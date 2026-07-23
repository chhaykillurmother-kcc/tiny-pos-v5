/**
 * Returns and refunds.
 *
 * Rules:
 * - Admin/Manager can complete returns.
 * - Accountant can search and view return history.
 * - Full and partial returns are supported.
 * - Refunds use the original paid net amount, including allocated tax.
 * - Restocked quantities restore the original FIFO costs.
 * - Damaged/non-restocked quantities do not increase saleable stock.
 */

function getRowsIfSheetExists_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return [];
  }

  return getRows_(sheetName);
}

function requireReturnViewRole_(user) { requirePermission_(user, 'RETURNS'); }

function requireReturnProcessRole_(user) { requirePermission_(user, 'RETURNS'); if ([POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.CASHIER].indexOf(String(user.Role))<0) throw new Error('You do not have permission to process refunds.'); }

function getReturnsModuleData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requireReturnViewRole_(user);

  if (typeof filters === 'string') filters = {query: filters};
  filters = filters || {};

  const normalized = sanitizeText_(filters.query, 120).toLowerCase();
  const branchId = resolveAccessibleBranchId_(user, filters.branchId, true);
  const range = (filters.from || filters.to)
    ? reportRange_(filters.from, filters.to)
    : null;

  function inRange(value) {
    return !range || reportInRange_(value, range);
  }

  const allReturns = getRowsIfSheetExists_(POS.SHEETS.RETURNS)
    .filter(function(row) {
      return String(row.Status || 'COMPLETED') !== 'CANCELLED';
    });

  const returns = allReturns
    .filter(function(row) {
      if (branchId && String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) !== branchId) return false;
      return inRange(row.DateTime || row.CreatedAt);
    })
    .sort(function(a, b) {
      return new Date(b.DateTime || b.CreatedAt || 0) - new Date(a.DateTime || a.CreatedAt || 0);
    });

  const refundedBySale = {};
  allReturns.forEach(function(row) {
    const saleId = String(row.SaleID || '');
    refundedBySale[saleId] = roundMoney_(number_(refundedBySale[saleId]) + number_(row.AmountUSD));
  });

  const sales = getRows_(POS.SHEETS.SALES)
    .filter(function(row) {
      if (String(row.Status) === POS.SALE_STATUS.VOID) return false;
      if (branchId && String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) !== branchId) return false;
      if (!inRange(row.DateTime || row.CreatedAt)) return false;

      const haystack = [row.InvoiceNo,row.SaleID,row.CashierName,row.CustomerID].join(' ').toLowerCase();
      return !normalized || haystack.indexOf(normalized) >= 0;
    })
    .sort(function(a, b) {
      return new Date(b.DateTime || b.CreatedAt || 0) - new Date(a.DateTime || a.CreatedAt || 0);
    })
    .slice(0, normalized || range ? 300 : 60)
    .map(function(row) {
      const refundedUSD = roundMoney_(number_(row.RefundedUSD, refundedBySale[String(row.SaleID)]));
      const totalUSD = roundMoney_(number_(row.TotalUSD));
      const refundableUSD = Math.max(0, roundMoney_(totalUSD - refundedUSD));
      const date = reportDate_(row.DateTime || row.CreatedAt);

      return {
        saleId: String(row.SaleID),
        invoiceNo: String(row.InvoiceNo),
        dateTime: date ? date.toISOString() : '',
        totalUSD: totalUSD,
        refundedUSD: refundedUSD,
        refundableUSD: refundableUSD,
        paymentMethod: String(row.PaymentMethod || ''),
        cashierName: String(row.CashierName || ''),
        returnStatus: String(row.ReturnStatus || ''),
        canReturn: refundableUSD > 0.000001
      };
    });

  const recentReturns = returns
    .filter(function(row) {
      const haystack = [row.ReturnNo,row.InvoiceNo,row.SaleID,row.UserName,row.Reason].join(' ').toLowerCase();
      return !normalized || haystack.indexOf(normalized) >= 0;
    })
    .slice(0, 300)
    .map(function(row) {
      const date = reportDate_(row.DateTime || row.CreatedAt);
      return {
        returnId: String(row.ReturnID),
        returnNo: String(row.ReturnNo || row.ReturnID),
        saleId: String(row.SaleID),
        invoiceNo: String(row.InvoiceNo),
        dateTime: date ? date.toISOString() : '',
        amountUSD: number_(row.AmountUSD),
        amountKHR: number_(row.AmountKHR),
        refundMethod: String(row.RefundMethod || ''),
        refundCurrency: String(row.RefundCurrency || 'USD'),
        refundAmount: number_(row.RefundAmount),
        reason: String(row.Reason || ''),
        userName: String(row.UserName || ''),
        status: String(row.Status || 'COMPLETED'),
        damageImageUrl: String(row.DamageImageURL || '')
      };
    });

  const todayKey = Utilities.formatDate(new Date(), POS.TIME_ZONE, 'yyyy-MM-dd');
  const todayReturns = allReturns.filter(function(row) {
    const date = reportDate_(row.DateTime || row.CreatedAt);
    return date && Utilities.formatDate(date, POS.TIME_ZONE, 'yyyy-MM-dd') === todayKey;
  });

  return {
    canProcess: userHasPermission_(user,'RETURNS') && [POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.CASHIER].indexOf(user.Role) >= 0,
    filters: {query:normalized,from:filters.from || '',to:filters.to || '',branchId:branchId},
    branches: branchRowsForUser_(user,false).map(branchToPublic_),
    canSelectAllBranches: canManageAllBranches_(user),
    metrics: {
      todayReturns: todayReturns.length,
      todayRefundUSD: roundMoney_(todayReturns.reduce(function(sum,row){return sum+number_(row.AmountUSD);},0)),
      totalReturns: returns.length,
      totalRefundUSD: roundMoney_(returns.reduce(function(sum,row){return sum+number_(row.AmountUSD);},0))
    },
    sales: sales,
    returns: recentReturns
  };
}

function getReturnSaleDetails(
  sessionToken,
  saleId
) {
  const user = requireSession_(sessionToken);
  requireReturnViewRole_(user);

  const sale = findRowBy_(
    POS.SHEETS.SALES,
    'SaleID',
    saleId
  );

  if (!sale) {
    throw new Error('Sale not found.');
  }

  if (String(sale.Status) === POS.SALE_STATUS.VOID) {
    throw new Error('A void sale cannot be returned.');
  }

  const items = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    });

  const previousReturnItems = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS.RETURN_ITEMS
  ).filter(function(row) {
    return String(row.SaleID) === String(saleId);
  });

  const previousByItem = {};

  previousReturnItems.forEach(function(row) {
    const itemId = String(row.SaleItemID);

    if (!previousByItem[itemId]) {
      previousByItem[itemId] = {
        qty: 0,
        refundUSD: 0,
        restockedQty: 0
      };
    }

    previousByItem[itemId].qty +=
      number_(row.QtyReturned);

    previousByItem[itemId].refundUSD +=
      number_(row.RefundUSD);

    if (bool_(row.Restock)) {
      previousByItem[itemId].restockedQty +=
        number_(row.QtyReturned);
    }
  });

  const taxableTotal = Math.max(
    0,
    roundMoney_(
      number_(sale.SubtotalUSD) -
      number_(sale.DiscountUSD)
    )
  );

  const resultItems = items.map(function(item) {
    const soldQty = number_(item.Qty);
    const prior = previousByItem[
      String(item.SaleItemID)
    ] || {
      qty: number_(item.ReturnedQty),
      refundUSD: number_(item.RefundedUSD),
      restockedQty: number_(item.RestockedQty)
    };

    const lineTotal = roundMoney_(
      number_(item.LineTotalUSD)
    );

    let lineDiscount = number_(
      item.AllocatedSaleDiscountUSD
    );

    if (
      !lineDiscount &&
      number_(sale.SubtotalUSD) > 0
    ) {
      lineDiscount = roundMoney_(
        number_(sale.DiscountUSD) *
        lineTotal /
        number_(sale.SubtotalUSD)
      );
    }

    const hasStoredNetRevenue =
      item.NetRevenueUSD !== '' &&
      item.NetRevenueUSD !== undefined &&
      item.NetRevenueUSD !== null;

    const lineNet = hasStoredNetRevenue
      ? number_(item.NetRevenueUSD)
      : roundMoney_(
          lineTotal - lineDiscount
        );

    const taxShare =
      taxableTotal > 0
        ? roundMoney_(
            number_(sale.TaxUSD) *
            lineNet /
            taxableTotal
          )
        : 0;

    const fullRefundUSD = roundMoney_(
      lineNet + taxShare
    );

    const returnedQty = Math.min(
      soldQty,
      Math.round(number_(prior.qty) * 1000) / 1000
    );

    const availableQty = Math.max(
      0,
      Math.round((soldQty - returnedQty) * 1000) / 1000
    );

    const alreadyRefundedUSD = Math.min(
      fullRefundUSD,
      roundMoney_(number_(prior.refundUSD))
    );

    const remainingRefundUSD = Math.max(
      0,
      roundMoney_(
        fullRefundUSD - alreadyRefundedUSD
      )
    );

    return {
      saleItemId: String(item.SaleItemID),
      productId: String(item.ProductID),
      productName: String(item.ProductName || ''),
      soldQty: soldQty,
      returnedQty: returnedQty,
      availableQty: availableQty,
      unitPriceUSD: number_(item.UnitPriceUSD),
      lineTotalUSD: lineTotal,
      lineDiscountUSD: roundMoney_(lineDiscount),
      lineTaxUSD: taxShare,
      fullRefundUSD: fullRefundUSD,
      alreadyRefundedUSD: alreadyRefundedUSD,
      remainingRefundUSD: remainingRefundUSD,
      approximateRefundPerQty:
        availableQty > 0
          ? Math.round(
              remainingRefundUSD /
              availableQty *
              10000
            ) / 10000
          : 0,
      canReturn: availableQty > 0.000001
    };
  });

  const customer = sale.CustomerID
    ? findRowBy_(
        POS.SHEETS.CUSTOMERS,
        'CustomerID',
        sale.CustomerID
      )
    : null;

  return {
    saleId: String(sale.SaleID),
    invoiceNo: String(sale.InvoiceNo),
    dateTime: new Date(sale.DateTime).toISOString(),
    customerId: String(sale.CustomerID || ''),
    customerName: customer
      ? String(customer.Name || '')
      : '',
    totalUSD: number_(sale.TotalUSD),
    refundedUSD: number_(sale.RefundedUSD),
    refundableUSD: Math.max(
      0,
      roundMoney_(
        number_(sale.TotalUSD) -
        number_(sale.RefundedUSD)
      )
    ),
    exchangeRate: number_(sale.ExchangeRate, 4100),
    paymentMethod: String(sale.PaymentMethod || ''),
    paymentStatus: String(sale.PaymentStatus || ''),
    returnStatus: String(sale.ReturnStatus || ''),
    cashierName: String(sale.CashierName || ''),
    items: resultItems
  };
}

function processSaleReturn(
  sessionToken,
  payload
) {
  const user = requireSession_(sessionToken);
  requireReturnProcessRole_(user);

  payload = payload || {};

  const saleId = sanitizeText_(payload.saleId, 80);
  const reason = sanitizeText_(payload.reason, 120);
  const notes = sanitizeText_(payload.notes, 500);

  if (!saleId) {
    throw new Error('Sale is required.');
  }

  if (!reason) {
    throw new Error('Return reason is required.');
  }

  const refundMethod =
    String(payload.refundMethod || 'CASH')
      .toUpperCase() === 'BANK'
      ? 'BANK'
      : 'CASH';

  const refundCurrency =
    String(payload.refundCurrency || 'USD')
      .toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';

  const reference = sanitizeText_(
    payload.reference,
    120
  );

  if (refundMethod === 'BANK' && !reference) {
    throw new Error(
      'Bank refund reference is required.'
    );
  }

  const requestedItems = Array.isArray(payload.items)
    ? payload.items
    : [];

  const evidenceImage = payload.damageImageDataUrl
    ? uploadReturnImageToCloudinary_(payload.damageImageDataUrl, 'return-evidence')
    : {url:'',fileId:''};

  if (!requestedItems.length) {
    throw new Error(
      'Select at least one returned item.'
    );
  }

  const result = withScriptLock_(function() {
    const sale = findRowBy_(
      POS.SHEETS.SALES,
      'SaleID',
      saleId
    );

    if (!sale) {
      throw new Error('Sale not found.');
    }

    if (String(sale.Status) === POS.SALE_STATUS.VOID) {
      throw new Error(
        'A void sale cannot be returned.'
      );
    }

    const detail = getReturnSaleDetails(
      sessionToken,
      saleId
    );

    const detailMap = {};

    detail.items.forEach(function(item) {
      detailMap[item.saleItemId] = item;
    });

    const seenSaleItemIds = {};

    const selected = requestedItems.map(
      function(requested) {
        const saleItemId = sanitizeText_(
          requested.saleItemId,
          80
        );

        if (seenSaleItemIds[saleItemId]) {
          throw new Error(
            'The same sale item was submitted more than once.'
          );
        }

        seenSaleItemIds[saleItemId] = true;

        const item = detailMap[saleItemId];

        if (!item) {
          throw new Error(
            'A selected sale item was not found.'
          );
        }

        let qty = Math.round(
          number_(requested.qty) * 1000
        ) / 1000;

        if (qty <= 0) {
          throw new Error(
            item.productName +
            ': return quantity must be greater than zero.'
          );
        }

        if (qty > item.availableQty + 0.0005) {
          throw new Error(
            item.productName +
            ': only ' +
            item.availableQty +
            ' can still be returned.'
          );
        }

        const isAllRemaining =
          Math.abs(qty - item.availableQty) <= 0.0005;

        let refundUSD = isAllRemaining
          ? item.remainingRefundUSD
          : roundMoney_(
              item.fullRefundUSD *
              qty /
              item.soldQty
            );

        refundUSD = Math.min(
          item.remainingRefundUSD,
          Math.max(0, refundUSD)
        );

        const grossRefundUSD = roundMoney_(
          item.lineTotalUSD *
          qty /
          item.soldQty
        );

        const discountRefundUSD = roundMoney_(
          item.lineDiscountUSD *
          qty /
          item.soldQty
        );

        let taxRefundUSD = roundMoney_(
          refundUSD -
          (
            grossRefundUSD -
            discountRefundUSD
          )
        );

        if (taxRefundUSD < 0) {
          taxRefundUSD = 0;
        }

        return {
          detail: item,
          qty: qty,
          refundUSD: refundUSD,
          grossRefundUSD: grossRefundUSD,
          discountRefundUSD: discountRefundUSD,
          taxRefundUSD: taxRefundUSD,
          restock: bool_(requested.restock),
          condition: sanitizeText_(
            requested.condition || 'GOOD',
            40
          ).toUpperCase()
        };
      }
    );

    let refundUSD = roundMoney_(
      selected.reduce(function(sum, item) {
        return sum + item.refundUSD;
      }, 0)
    );

    const saleRemainingRefundUSD = Math.max(
      0,
      roundMoney_(
        number_(sale.TotalUSD) -
        number_(sale.RefundedUSD)
      )
    );

    const selectedQtyByItem = {};

    selected.forEach(function(item) {
      selectedQtyByItem[item.detail.saleItemId] =
        item.qty;
    });

    const returningAllRemaining =
      detail.items.every(function(item) {
        if (item.availableQty <= 0.0005) {
          return true;
        }

        return (
          number_(
            selectedQtyByItem[item.saleItemId]
          ) + 0.0005 >=
          item.availableQty
        );
      });

    if (
      returningAllRemaining &&
      selected.length
    ) {
      const adjustment = roundMoney_(
        saleRemainingRefundUSD -
        refundUSD
      );

      const last = selected[
        selected.length - 1
      ];

      last.refundUSD = roundMoney_(
        last.refundUSD + adjustment
      );

      last.taxRefundUSD = Math.max(
        0,
        roundMoney_(
          last.taxRefundUSD + adjustment
        )
      );

      refundUSD = saleRemainingRefundUSD;
    }

    if (
      refundUSD >
      saleRemainingRefundUSD + 0.005
    ) {
      throw new Error(
        'Refund exceeds the remaining invoice amount.'
      );
    }

    if (refundUSD <= 0) {
      throw new Error(
        'The calculated refund is zero.'
      );
    }

    const exchangeRate = number_(
      sale.ExchangeRate,
      4100
    );

    const amountKHR = Math.round(
      refundUSD * exchangeRate
    );

    const refundAmount =
      refundCurrency === 'KHR'
        ? amountKHR
        : refundUSD;

    const now = new Date();
    const returnId = uuid_('RTN');
    const returnNo = generateReturnNo_();
    const shift = getOpenShiftForUser_(
      user.UserID
    );

    appendObject_(POS.SHEETS.RETURNS, {
      ReturnID: returnId,
      ReturnNo: returnNo,
      BranchID: String(sale.BranchID || getUserBranchId_(user)),
      SaleID: saleId,
      InvoiceNo: sale.InvoiceNo,
      DateTime: now,
      RefundMethod: refundMethod,
      RefundCurrency: refundCurrency,
      RefundAmount: refundAmount,
      AmountUSD: refundUSD,
      AmountKHR: amountKHR,
      Reason: reason,
      Notes: notes,
      UserID: user.UserID,
      UserName: user.Name,
      ShiftID: shift ? shift.ShiftID : '',
      Status: 'COMPLETED',
      CreatedAt: now,
      DamageImageURL: evidenceImage.url || '',
      DamageImagePublicID: evidenceImage.fileId || ''
    });

    const returnItemRows = [];
    const stockMovementRows = [];
    const receiptItems = [];

    selected.forEach(function(selectedItem) {
      const item = selectedItem.detail;

      const saleItem = findRowBy_(
        POS.SHEETS.SALE_ITEMS,
        'SaleItemID',
        item.saleItemId
      );

      if (!saleItem) {
        throw new Error(
          'Sale item disappeared during return.'
        );
      }

      const returnItemId = uuid_('RTI');
      let costRestoredUSD = 0;
      let restockedQty = 0;

      if (selectedItem.restock) {
        const restoration =
          restoreOriginalFifoCostLocked_({
            returnId: returnId,
            returnItemId: returnItemId,
            saleItem: saleItem,
            qty: selectedItem.qty,
            userId: user.UserID,
            branchId: String(sale.BranchID || getUserBranchId_(user)),
            returnNo: returnNo
          });

        costRestoredUSD =
          restoration.costRestoredUSD;

        restockedQty = selectedItem.qty;

        const product = findRowBy_(
          POS.SHEETS.PRODUCTS,
          'ProductID',
          item.productId
        );

        if (!product) {
          throw new Error(
            item.productName +
            ': product no longer exists.'
          );
        }

        const returnBranchId = String(sale.BranchID || getUserBranchId_(user));
        const balance = Math.round((getBranchStockQty_(returnBranchId, product.ProductID) + selectedItem.qty) * 1000) / 1000;

        setBranchStockLocked_(returnBranchId, product.ProductID, balance, getBranchAverageCost_(returnBranchId, product.ProductID));

        stockMovementRows.push({
          MovementID: uuid_('STK'),
          DateTime: now,
          BranchID: returnBranchId,
          ProductID: item.productId,
          Type: 'SALE_RETURN',
          QtyIn: selectedItem.qty,
          QtyOut: 0,
          BalanceAfter: balance,
          ReferenceType: 'RETURN',
          ReferenceID: returnId,
          UserID: user.UserID,
          Note:
            returnNo +
            ' / ' +
            sale.InvoiceNo +
            ' / ' +
            selectedItem.condition,
          UnitCostUSD:
            selectedItem.qty > 0
              ? Math.round(
                  costRestoredUSD /
                  selectedItem.qty *
                  10000
                ) / 10000
              : 0,
          CostInUSD: costRestoredUSD,
          CostOutUSD: 0
        });
      }

      returnItemRows.push({
        ReturnItemID: returnItemId,
        ReturnID: returnId,
        SaleItemID: item.saleItemId,
        SaleID: saleId,
        ProductID: item.productId,
        ProductName: item.productName,
        QtyReturned: selectedItem.qty,
        UnitPriceUSD: item.unitPriceUSD,
        GrossLineRefundUSD:
          selectedItem.grossRefundUSD,
        DiscountRefundUSD:
          selectedItem.discountRefundUSD,
        TaxRefundUSD:
          selectedItem.taxRefundUSD,
        RefundUSD: selectedItem.refundUSD,
        Restock: selectedItem.restock,
        Condition: selectedItem.condition,
        CostRestoredUSD: costRestoredUSD,
        CreatedAt: now
      });

      updateRowObject_(
        POS.SHEETS.SALE_ITEMS,
        saleItem._row,
        {
          ReturnedQty: Math.round(
            (
              number_(saleItem.ReturnedQty) +
              selectedItem.qty
            ) * 1000
          ) / 1000,

          RefundedUSD: roundMoney_(
            number_(saleItem.RefundedUSD) +
            selectedItem.refundUSD
          ),

          RestockedQty: Math.round(
            (
              number_(saleItem.RestockedQty) +
              restockedQty
            ) * 1000
          ) / 1000,

          CostRestoredUSD: roundMoney_(
            number_(saleItem.CostRestoredUSD) +
            costRestoredUSD
          )
        }
      );

      receiptItems.push({
        productName: item.productName,
        qty: selectedItem.qty,
        refundUSD: selectedItem.refundUSD,
        restock: selectedItem.restock,
        condition: selectedItem.condition,
        costRestoredUSD: costRestoredUSD
      });
    });

    appendObjects_(
      RETURNS_REFUNDS.SHEETS.RETURN_ITEMS,
      returnItemRows
    );

    appendObjects_(
      POS.SHEETS.STOCK,
      stockMovementRows
    );

    appendObject_(
      RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS,
      {
        RefundPaymentID: uuid_('RFP'),
        ReturnID: returnId,
        SaleID: saleId,
        Method: refundMethod,
        Currency: refundCurrency,
        Amount: refundAmount,
        AmountUSD: refundUSD,
        Reference: reference,
        ShiftID: shift ? shift.ShiftID : '',
        UserID: user.UserID,
        Status: 'PAID',
        CreatedAt: now
      }
    );

    const currentSaleItems = getRows_(
      POS.SHEETS.SALE_ITEMS
    ).filter(function(row) {
      return String(row.SaleID) === saleId;
    });

    const soldQty = currentSaleItems.reduce(
      function(sum, row) {
        return sum + number_(row.Qty);
      },
      0
    );

    const returnedQty = currentSaleItems.reduce(
      function(sum, row) {
        return sum + number_(row.ReturnedQty);
      },
      0
    );

    const totalRefundedUSD = roundMoney_(
      number_(sale.RefundedUSD) +
      refundUSD
    );

    const fullyReturned =
      returnedQty + 0.0005 >= soldQty ||
      totalRefundedUSD + 0.005 >=
        number_(sale.TotalUSD);

    updateRowObject_(
      POS.SHEETS.SALES,
      sale._row,
      {
        ReturnedQty:
          Math.round(returnedQty * 1000) / 1000,
        RefundedUSD: totalRefundedUSD,
        ReturnStatus:
          fullyReturned ? 'FULL' : 'PARTIAL',
        LastReturnAt: now,
        Status:
          fullyReturned
            ? POS.SALE_STATUS.RETURNED
            : POS.SALE_STATUS.COMPLETED
      }
    );

    audit_(
      user.UserID,
      'PROCESS_RETURN',
      'Return',
      returnId,
      {
        returnNo: returnNo,
        saleId: saleId,
        invoiceNo: sale.InvoiceNo,
        refundUSD: refundUSD,
        refundMethod: refundMethod,
        refundCurrency: refundCurrency,
        restockedQty: receiptItems.reduce(
          function(sum, item) {
            return sum +
              (item.restock ? item.qty : 0);
          },
          0
        )
      }
    );

    const receipt = {
      returnId: returnId,
      returnNo: returnNo,
      saleId: saleId,
      invoiceNo: String(sale.InvoiceNo),
      dateTime: now.toISOString(),
      refundMethod: refundMethod,
      refundCurrency: refundCurrency,
      refundAmount: refundAmount,
      amountUSD: refundUSD,
      amountKHR: amountKHR,
      exchangeRate: exchangeRate,
      reference: reference,
      reason: reason,
      notes: notes,
      userName: String(user.Name),
      damageImageUrl: evidenceImage.url || '',
      items: receiptItems,
      shop: getPublicSettings_()
    };

    return receipt;
  });

  notifyReturnToTelegram_(result, user);
  return result;
}

function restoreOriginalFifoCostLocked_(payload) {
  const saleItem = payload.saleItem;
  const qtyRequested = Math.round(
    number_(payload.qty) * 1000
  ) / 1000;

  let remaining = qtyRequested;
  let totalCost = 0;

  const allocations = getRows_(
    PURCHASE_FIFO.SHEETS.FIFO_ALLOCATIONS
  )
    .filter(function(row) {
      return (
        String(row.ReferenceType) === 'SALE' &&
        String(row.ReferenceID) ===
          String(saleItem.SaleItemID)
      );
    })
    .sort(function(a, b) {
      return number_(b._row) - number_(a._row);
    });

  const restorations = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS
      .RETURN_LOT_RESTORATIONS
  ).filter(function(row) {
    return String(row.SaleItemID) ===
      String(saleItem.SaleItemID);
  });

  const restoredByAllocation = {};

  restorations.forEach(function(row) {
    const key = String(
      row.OriginalAllocationID || ''
    );

    restoredByAllocation[key] =
      number_(restoredByAllocation[key]) +
      number_(row.Qty);
  });

  const rows = [];

  allocations.forEach(function(allocation) {
    if (remaining <= 0.0000001) {
      return;
    }

    const allocationId = String(
      allocation.AllocationID
    );

    const available = Math.max(
      0,
      Math.round(
        (
          number_(allocation.Qty) -
          number_(restoredByAllocation[allocationId])
        ) * 1000
      ) / 1000
    );

    if (available <= 0.0000001) {
      return;
    }

    const take = Math.round(
      Math.min(remaining, available) * 1000
    ) / 1000;

    const unitCost = number_(
      allocation.UnitCostUSD
    );

    const cost = roundMoney_(take * unitCost);

    const newLotId = createStockLotLocked_({
      branchId: payload.branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
      productId: saleItem.ProductID,
      quantity: take,
      unitCostUSD: unitCost,
      receivedAt: new Date(),
      referenceType: 'SALE_RETURN',
      referenceId: payload.returnId,
      note:
        payload.returnNo +
        ' restoring original sale cost'
    });

    rows.push({
      RestorationID: uuid_('RST'),
      ReturnID: payload.returnId,
      ReturnItemID: payload.returnItemId,
      SaleItemID: saleItem.SaleItemID,
      OriginalAllocationID: allocationId,
      OriginalLotID: allocation.LotID,
      ProductID: saleItem.ProductID,
      Qty: take,
      UnitCostUSD: unitCost,
      CostUSD: cost,
      NewLotID: newLotId,
      CreatedAt: new Date()
    });

    totalCost = roundMoney_(totalCost + cost);
    remaining = Math.round(
      (remaining - take) * 1000
    ) / 1000;
  });

  // Backward-compatible fallback for sales completed before FIFO was installed.
  if (remaining > 0.0005) {
    const unitCost = number_(saleItem.UnitCostUSD);
    const cost = roundMoney_(
      remaining * unitCost
    );

    const newLotId = createStockLotLocked_({
      branchId: payload.branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
      productId: saleItem.ProductID,
      quantity: remaining,
      unitCostUSD: unitCost,
      receivedAt: new Date(),
      referenceType: 'SALE_RETURN',
      referenceId: payload.returnId,
      note:
        payload.returnNo +
        ' fallback original average cost'
    });

    rows.push({
      RestorationID: uuid_('RST'),
      ReturnID: payload.returnId,
      ReturnItemID: payload.returnItemId,
      SaleItemID: saleItem.SaleItemID,
      OriginalAllocationID: '',
      OriginalLotID: '',
      ProductID: saleItem.ProductID,
      Qty: remaining,
      UnitCostUSD: unitCost,
      CostUSD: cost,
      NewLotID: newLotId,
      CreatedAt: new Date()
    });

    totalCost = roundMoney_(totalCost + cost);
    remaining = 0;
  }

  appendObjects_(
    RETURNS_REFUNDS.SHEETS
      .RETURN_LOT_RESTORATIONS,
    rows
  );

  return {
    costRestoredUSD: totalCost,
    restorations: rows
  };
}

function generateReturnNo_() {
  const key = dateKey_(new Date());
  const props =
    PropertiesService.getScriptProperties();
  const counterKey = 'RETURN_COUNTER_' + key;

  const next =
    number_(props.getProperty(counterKey), 0) + 1;

  props.setProperty(
    counterKey,
    String(next)
  );

  return (
    'RET-' +
    key +
    '-' +
    String(next).padStart(4, '0')
  );
}

function getReturnReceipt(
  sessionToken,
  returnId
) {
  const user = requireSession_(sessionToken);
  requireReturnViewRole_(user);

  const row = findRowBy_(
    POS.SHEETS.RETURNS,
    'ReturnID',
    returnId
  );

  if (!row) {
    throw new Error('Return not found.');
  }

  const items = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS.RETURN_ITEMS
  )
    .filter(function(item) {
      return String(item.ReturnID) ===
        String(returnId);
    })
    .map(function(item) {
      return {
        productName: String(
          item.ProductName || ''
        ),
        qty: number_(item.QtyReturned),
        refundUSD: number_(item.RefundUSD),
        restock: bool_(item.Restock),
        condition: String(
          item.Condition || ''
        ),
        costRestoredUSD: number_(
          item.CostRestoredUSD
        )
      };
    });

  const payment = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS
  ).find(function(paymentRow) {
    return String(paymentRow.ReturnID) ===
      String(returnId);
  }) || {};

  const sale = findRowBy_(
    POS.SHEETS.SALES,
    'SaleID',
    row.SaleID
  ) || {};

  return {
    returnId: String(row.ReturnID),
    returnNo: String(
      row.ReturnNo || row.ReturnID
    ),
    saleId: String(row.SaleID),
    invoiceNo: String(row.InvoiceNo),
    dateTime: new Date(row.DateTime).toISOString(),
    refundMethod: String(
      row.RefundMethod || payment.Method || ''
    ),
    refundCurrency: String(
      row.RefundCurrency ||
      payment.Currency ||
      'USD'
    ),
    refundAmount: number_(
      row.RefundAmount,
      payment.Amount
    ),
    amountUSD: number_(row.AmountUSD),
    amountKHR: number_(row.AmountKHR),
    exchangeRate: number_(
      sale.ExchangeRate,
      4100
    ),
    reference: String(
      payment.Reference || ''
    ),
    reason: String(row.Reason || ''),
    notes: String(row.Notes || ''),
    userName: String(row.UserName || ''),
    damageImageUrl: String(row.DamageImageURL || ''),
    items: items,
    shop: getPublicSettings_()
  };
}

function notifyReturnToTelegram_(
  receipt,
  user
) {
  const telegramId =
    user && user.TelegramID;

  if (!telegramId) {
    return;
  }

  try {
    telegramApi_('sendMessage', {
      chat_id: String(telegramId),
      text:
        '↩️ Return completed\n' +
        'Return: ' + receipt.returnNo + '\n' +
        'Invoice: ' + receipt.invoiceNo + '\n' +
        'Refund: $' +
        Number(receipt.amountUSD).toFixed(2) +
        '\nMethod: ' +
        receipt.refundMethod
    });
  } catch (error) {
    console.error(
      'Telegram return notification failed',
      error
    );
  }
}