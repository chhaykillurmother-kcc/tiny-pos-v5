/**
 * Tiny POS Product Packaging v4.1 — package-aware purchasing, receiving,
 * purchase documents and supplier returns.
 *
 * Purchase entry is made in Box/Bag/Pack quantities and package cost. Stored
 * OrderedQty, ReceivedQty and FIFO quantities remain in the base unit.
 */

function calculatePackagePurchaseV41_(payload) {
  payload = payload || {};
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (!rawItems.length) {
    throw new Error('Add at least one product to the purchase.');
  }

  const products = {};
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(row) {
    products[String(row.ProductID)] = row;
  });
  const units = getUnitMap_();
  const packages = packageMapV41_(false);
  let subtotalUSD = 0;

  const items = rawItems.map(function(raw) {
    const product = products[String(raw.productId)];
    if (!product) throw new Error('A selected product no longer exists.');

    const selected = resolvePackageV41_(
      product,
      raw.packageId,
      'PURCHASE',
      packages
    );
    const baseUnit = units[String(product.UnitID || '')] || {};
    let purchaseQty = roundQtyV41_(
      raw.purchaseQty !== undefined
        ? raw.purchaseQty
        : raw.orderedQty !== undefined
          ? raw.orderedQty
          : raw.qty
    );

    if (purchaseQty <= 0) {
      throw new Error(
        String(product.NameEN || product.NameKH || '') +
        ': ordered quantity must be greater than zero.'
      );
    }
    if (
      selected.allowDecimal !== true &&
      Math.abs(purchaseQty - Math.round(purchaseQty)) > 0.000001
    ) {
      throw new Error(
        String(product.NameEN || product.NameKH || '') +
        ': purchase package quantity must be a whole number.'
      );
    }
    purchaseQty = selected.allowDecimal === true
      ? purchaseQty
      : Math.round(purchaseQty);

    let orderedQty = roundQtyV41_(purchaseQty * number_(selected.factor, 1));
    if (
      baseUnit.allowDecimal !== true &&
      Math.abs(orderedQty - Math.round(orderedQty)) > 0.000001
    ) {
      throw new Error(
        String(product.NameEN || product.NameKH || '') +
        ': package conversion does not produce a whole base-unit quantity.'
      );
    }
    orderedQty = baseUnit.allowDecimal === true
      ? orderedQty
      : Math.round(orderedQty);

    const purchaseUnitCostUSD = roundCostV41_(
      raw.purchaseUnitCostUSD !== undefined
        ? raw.purchaseUnitCostUSD
        : raw.unitCostUSD
    );
    if (purchaseUnitCostUSD < 0) {
      throw new Error(
        String(product.NameEN || product.NameKH || '') +
        ': package cost cannot be negative.'
      );
    }

    const lineBaseUSD = roundMoney_(purchaseQty * purchaseUnitCostUSD);
    const lineDiscountUSD = Math.min(
      lineBaseUSD,
      Math.max(0, roundMoney_(number_(raw.lineDiscountUSD)))
    );
    const lineTotalUSD = roundMoney_(lineBaseUSD - lineDiscountUSD);
    subtotalUSD = roundMoney_(subtotalUSD + lineTotalUSD);

    return {
      purchaseItemId: sanitizeText_(raw.purchaseItemId, 80),
      productId: String(product.ProductID),
      productName: String(product.NameEN || product.NameKH || ''),
      unitId: String(product.UnitID || ''),
      unitName: String(
        baseUnit.abbreviation || baseUnit.nameEN || baseUnit.nameKH || ''
      ),
      orderedQty: orderedQty,
      receivedQty: Math.max(0, roundQtyV41_(raw.receivedQty)),
      unitCostUSD: orderedQty > 0
        ? roundCostV41_(lineBaseUSD / orderedQty)
        : 0,
      lineDiscountUSD: lineDiscountUSD,
      lineTotalUSD: lineTotalUSD,
      packageId: String(selected.packageId || ''),
      purchaseUnitId: String(selected.unitId || product.UnitID || ''),
      purchaseUnitName: String(selected.unitName || ''),
      purchaseQty: purchaseQty,
      unitsPerPurchaseUnit: number_(selected.factor, 1),
      purchaseBarcode: String(selected.barcode || product.Barcode || ''),
      purchaseUnitCostUSD: purchaseUnitCostUSD
    };
  });

  let discountType = String(payload.discountType || 'FIXED').toUpperCase();
  if (['FIXED', 'PERCENT'].indexOf(discountType) === -1) {
    discountType = 'FIXED';
  }
  let discountValue = Math.max(0, number_(payload.discountValue));
  let discountUSD;
  if (discountType === 'PERCENT') {
    discountValue = Math.min(100, Math.round(discountValue * 100) / 100);
    discountUSD = roundMoney_(subtotalUSD * discountValue / 100);
  } else {
    discountValue = roundMoney_(Math.min(subtotalUSD, discountValue));
    discountUSD = discountValue;
  }

  const taxUSD = Math.max(0, roundMoney_(number_(payload.taxUSD)));
  const shippingUSD = Math.max(0, roundMoney_(number_(payload.shippingUSD)));
  const otherCostUSD = Math.max(0, roundMoney_(number_(payload.otherCostUSD)));
  const totalUSD = roundMoney_(Math.max(
    0,
    subtotalUSD - discountUSD + taxUSD + shippingUSD + otherCostUSD
  ));

  items.forEach(function(item) {
    const share = subtotalUSD > 0
      ? item.lineTotalUSD / subtotalUSD
      : 1 / items.length;
    const landedLineCostUSD = roundMoney_(
      item.lineTotalUSD - discountUSD * share + taxUSD * share +
      shippingUSD * share + otherCostUSD * share
    );
    item.landedUnitCostUSD = item.orderedQty > 0
      ? roundCostV41_(landedLineCostUSD / item.orderedQty)
      : 0;
    item.landedPurchaseUnitCostUSD = item.purchaseQty > 0
      ? roundCostV41_(landedLineCostUSD / item.purchaseQty)
      : 0;
  });

  return {
    items: items,
    subtotalUSD: subtotalUSD,
    discountType: discountType,
    discountValue: discountValue,
    discountUSD: discountUSD,
    taxUSD: taxUSD,
    shippingUSD: shippingUSD,
    otherCostUSD: otherCostUSD,
    totalUSD: totalUSD
  };
}

function previewPurchaseTotalsV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  return calculatePackagePurchaseV41_(payload);
}

function savePurchaseDraftV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePurchaseWriteRole_(user);
  payload = payload || {};

  return withScriptLock_(function() {
    const supplier = findRowBy_(
      POS.SHEETS.SUPPLIERS,
      'SupplierID',
      payload.supplierId
    );
    if (!supplier || !bool_(supplier.Active)) {
      throw new Error('Select an active supplier.');
    }

    const calculated = calculatePackagePurchaseV41_(payload);
    const existing = payload.purchaseId
      ? findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', payload.purchaseId)
      : null;
    const requestedStatus = String(payload.status || 'DRAFT').toUpperCase() === 'ORDERED'
      ? 'ORDERED'
      : 'DRAFT';
    const now = new Date();

    if (existing) {
      const existingItems = getRows_(POS.SHEETS.PURCHASE_ITEMS)
        .filter(function(row) {
          return String(row.PurchaseID) === String(existing.PurchaseID);
        });
      const received = existingItems.reduce(function(sum, item) {
        return sum + number_(item.ReceivedQty);
      }, 0);
      if (received > 0.0005) {
        throw new Error('A purchase with received stock cannot be edited.');
      }
      if (['CANCELLED', 'RECEIVED'].indexOf(String(existing.Status)) >= 0) {
        throw new Error('This purchase can no longer be edited.');
      }
    }

    const purchaseId = existing
      ? String(existing.PurchaseID)
      : uuid_('PUR');
    const purchaseNo = existing
      ? String(existing.PurchaseNo)
      : generatePurchaseNo_();
    const paidUSD = existing ? number_(existing.PaidUSD) : 0;
    const paymentStatus = paidUSD <= 0
      ? 'UNPAID'
      : paidUSD + 0.005 >= calculated.totalUSD
        ? 'PAID'
        : 'PARTIALLY_PAID';
    const header = {
      PurchaseID: purchaseId,
      PurchaseNo: purchaseNo,
      BranchID: existing
        ? String(existing.BranchID || getUserBranchId_(user))
        : resolveAccessibleBranchId_(user, payload.branchId, false),
      SupplierID: String(supplier.SupplierID),
      SupplierName: String(supplier.Name),
      SupplierInvoiceNo: sanitizeText_(payload.supplierInvoiceNo, 100),
      PurchaseDate: payload.purchaseDate
        ? new Date(payload.purchaseDate + 'T00:00:00')
        : now,
      ExpectedDate: payload.expectedDate
        ? new Date(payload.expectedDate + 'T00:00:00')
        : '',
      SubtotalUSD: calculated.subtotalUSD,
      DiscountType: calculated.discountType,
      DiscountValue: calculated.discountValue,
      DiscountUSD: calculated.discountUSD,
      TaxUSD: calculated.taxUSD,
      ShippingUSD: calculated.shippingUSD,
      OtherCostUSD: calculated.otherCostUSD,
      TotalUSD: calculated.totalUSD,
      PaidUSD: paidUSD,
      PaymentStatus: paymentStatus,
      Status: requestedStatus,
      Notes: sanitizeText_(payload.notes, 500),
      UserID: user.UserID,
      UpdatedAt: now
    };

    if (existing) {
      updateRowObject_(POS.SHEETS.PURCHASES, existing._row, header);
      deletePurchaseItemsLocked_(purchaseId);
    } else {
      header.CreatedAt = now;
      appendObject_(POS.SHEETS.PURCHASES, header);
    }

    appendObjects_(
      POS.SHEETS.PURCHASE_ITEMS,
      calculated.items.map(function(item) {
        return {
          PurchaseItemID: uuid_('PIT'),
          PurchaseID: purchaseId,
          ProductID: item.productId,
          ProductName: item.productName,
          UnitID: item.unitId,
          UnitName: item.unitName,
          OrderedQty: item.orderedQty,
          ReceivedQty: 0,
          UnitCostUSD: item.unitCostUSD,
          LineDiscountUSD: item.lineDiscountUSD,
          LineTotalUSD: item.lineTotalUSD,
          LandedUnitCostUSD: item.landedUnitCostUSD,
          PurchasePackageID: item.packageId,
          PurchaseUnitName: item.purchaseUnitName,
          PurchaseQty: item.purchaseQty,
          UnitsPerPurchaseUnit: item.unitsPerPurchaseUnit,
          PurchaseBarcode: item.purchaseBarcode,
          PurchaseUnitCostUSD: item.purchaseUnitCostUSD,
          CreatedAt: now,
          UpdatedAt: now
        };
      })
    );

    audit_(
      user.UserID,
      existing ? 'UPDATE_PACKAGE_PURCHASE' : 'CREATE_PACKAGE_PURCHASE',
      'Purchase',
      purchaseId,
      {
        purchaseNo: purchaseNo,
        supplierId: supplier.SupplierID,
        totalUSD: calculated.totalUSD,
        status: requestedStatus
      }
    );

    return {
      success: true,
      purchaseId: purchaseId,
      purchaseNo: purchaseNo
    };
  });
}

function purchaseItemToPackagePublicV41_(item) {
  const factor = number_(item.UnitsPerPurchaseUnit, 1) || 1;
  const orderedBase = number_(item.OrderedQty || item.Qty);
  const receivedBase = number_(item.ReceivedQty);
  const remainingBase = Math.max(0, roundQtyV41_(orderedBase - receivedBase));
  const purchaseQty = item.PurchaseQty !== '' && item.PurchaseQty !== undefined
    ? number_(item.PurchaseQty)
    : roundQtyV41_(orderedBase / factor);
  const packageCost = item.PurchaseUnitCostUSD !== '' &&
    item.PurchaseUnitCostUSD !== undefined
      ? number_(item.PurchaseUnitCostUSD)
      : roundCostV41_(number_(item.UnitCostUSD) * factor);

  return {
    purchaseItemId: String(item.PurchaseItemID),
    productId: String(item.ProductID),
    productName: String(item.ProductName || ''),
    unitId: String(item.UnitID || ''),
    unitName: String(item.UnitName || ''),
    orderedQty: orderedBase,
    receivedQty: receivedBase,
    remainingQty: remainingBase,
    unitCostUSD: number_(item.UnitCostUSD),
    lineDiscountUSD: number_(item.LineDiscountUSD),
    lineTotalUSD: number_(item.LineTotalUSD),
    landedUnitCostUSD: number_(item.LandedUnitCostUSD || item.UnitCostUSD),
    packageId: String(item.PurchasePackageID || ''),
    purchaseUnitName: String(item.PurchaseUnitName || item.UnitName || ''),
    purchaseQty: purchaseQty,
    receivedPurchaseQty: roundQtyV41_(receivedBase / factor),
    remainingPurchaseQty: roundQtyV41_(remainingBase / factor),
    unitsPerPurchaseUnit: factor,
    purchaseBarcode: String(item.PurchaseBarcode || ''),
    purchaseUnitCostUSD: packageCost,
    landedPurchaseUnitCostUSD: roundCostV41_(
      number_(item.LandedUnitCostUSD || item.UnitCostUSD) * factor
    )
  };
}

function getPurchaseDetailsV41(sessionToken, purchaseId) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  const row = findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', purchaseId);
  if (!row) throw new Error('Purchase not found.');

  const purchase = purchaseRowToPublic_(row);
  purchase.items = getRows_(POS.SHEETS.PURCHASE_ITEMS)
    .filter(function(item) {
      return String(item.PurchaseID) === String(purchaseId);
    })
    .map(purchaseItemToPackagePublicV41_);

  purchase.payments = getRows_(PURCHASE_FIFO.SHEETS.SUPPLIER_PAYMENTS)
    .filter(function(payment) {
      return String(payment.PurchaseID) === String(purchaseId);
    })
    .map(function(payment) {
      return {
        paymentId: String(payment.SupplierPaymentID),
        dateTime: new Date(payment.DateTime).toISOString(),
        method: String(payment.Method),
        amountUSD: number_(payment.AmountUSD),
        reference: String(payment.Reference || ''),
        notes: String(payment.Notes || '')
      };
    });

  purchase.receipts = getRows_(PURCHASE_FIFO.SHEETS.PURCHASE_RECEIPTS)
    .filter(function(receipt) {
      return String(receipt.PurchaseID) === String(purchaseId);
    })
    .map(function(receipt) {
      return {
        receiptId: String(receipt.ReceiptID),
        receiptNo: String(receipt.ReceiptNo),
        receivedAt: new Date(receipt.ReceivedAt).toISOString(),
        totalQty: number_(receipt.TotalQty),
        totalCostUSD: number_(receipt.TotalCostUSD),
        notes: String(receipt.Notes || '')
      };
    });
  purchase.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return purchase;
}

function createPackageStockLotLockedV41_(payload) {
  payload = payload || {};
  const quantity = roundQtyV41_(payload.quantity);

  if (quantity <= 0) {
    throw new Error('FIFO lot quantity must be greater than zero.');
  }

  const unitCost = roundCostV41_(payload.unitCostUSD);
  const now = new Date();
  const lotId = uuid_('LOT');

  appendObject_(PURCHASE_FIFO.SHEETS.STOCK_LOTS, {
    LotID: lotId,
    BranchID: sanitizeText_(payload.branchId, 80) ||
      BRANCH_FEATURE.DEFAULT_BRANCH_ID,
    ProductID: sanitizeText_(payload.productId, 80),
    PurchaseID: sanitizeText_(payload.purchaseId, 80),
    ReceiptID: sanitizeText_(payload.receiptId, 80),
    ReceivedAt: payload.receivedAt
      ? new Date(payload.receivedAt)
      : now,
    UnitCostUSD: unitCost,
    QtyReceived: quantity,
    QtyRemaining: quantity,
    Status: 'OPEN',
    ReferenceType: sanitizeText_(payload.referenceType, 40),
    ReferenceID: sanitizeText_(payload.referenceId, 80),
    Note: sanitizeText_(payload.note, 250),
    CreatedAt: now,
    UpdatedAt: now
  });

  return lotId;
}

function receivePurchaseStockV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PURCHASES');
  payload = payload || {};

  return withScriptLock_(function() {
    const purchase = findRowBy_(
      POS.SHEETS.PURCHASES,
      'PurchaseID',
      payload.purchaseId
    );

    if (!purchase) {
      throw new Error('Purchase not found.');
    }

    if (String(purchase.Status) === 'DRAFT') {
      throw new Error(
        'Mark the purchase as ORDERED before receiving stock.'
      );
    }

    if (
      ['CANCELLED', 'RECEIVED'].indexOf(
        String(purchase.Status)
      ) >= 0
    ) {
      throw new Error('This purchase cannot receive more stock.');
    }

    const branchId = String(
      purchase.BranchID ||
      getUserBranchId_(user)
    );

    const itemRows = getRows_(POS.SHEETS.PURCHASE_ITEMS)
      .filter(function(item) {
        return String(item.PurchaseID) ===
          String(purchase.PurchaseID);
      });

    const itemMap = {};
    itemRows.forEach(function(item) {
      itemMap[String(item.PurchaseItemID)] = item;
    });

    const lines = [];

    (Array.isArray(payload.items) ? payload.items : [])
      .forEach(function(raw) {
        const item = itemMap[String(raw.purchaseItemId)];

        if (!item) {
          throw new Error('A purchase item was not found.');
        }

        const factor = number_(
          item.UnitsPerPurchaseUnit,
          1
        ) || 1;

        let purchaseQty = raw.receivePurchaseQty !== undefined
          ? number_(raw.receivePurchaseQty)
          : number_(raw.receiveQty);

        purchaseQty = roundQtyV41_(purchaseQty);

        const packageUnitAllowsDecimal = String(
          item.PurchasePackageID || ''
        )
          ? (
              (
                packageMapV41_(true)[
                  String(item.PurchasePackageID)
                ] || {}
              ).allowDecimal === true
            )
          : (
              (
                getUnitMap_()[
                  String(item.UnitID || '')
                ] || {}
              ).allowDecimal === true
            );

        if (
          !packageUnitAllowsDecimal &&
          Math.abs(purchaseQty - Math.round(purchaseQty)) >
            0.000001
        ) {
          throw new Error(
            String(item.ProductName || '') +
            ': received package quantity must be a whole number.'
          );
        }

        purchaseQty = packageUnitAllowsDecimal
          ? purchaseQty
          : Math.round(purchaseQty);

        const receiveBaseQty = roundQtyV41_(
          purchaseQty * factor
        );

        const orderedBaseQty = number_(
          item.OrderedQty || item.Qty
        );

        const receivedBaseQty = number_(
          item.ReceivedQty
        );

        const remainingBaseQty = roundQtyV41_(
          orderedBaseQty - receivedBaseQty
        );

        if (purchaseQty < 0) {
          throw new Error(
            String(item.ProductName || '') +
            ': received quantity cannot be negative.'
          );
        }

        if (receiveBaseQty > remainingBaseQty + 0.0005) {
          const remainingPurchaseQty = roundQtyV41_(
            remainingBaseQty / factor
          );

          throw new Error(
            String(item.ProductName || '') +
            ': cannot receive more than ' +
            remainingPurchaseQty +
            ' ' +
            String(
              item.PurchaseUnitName ||
              item.UnitName ||
              ''
            ) +
            '.'
          );
        }

        if (receiveBaseQty > 0.0005) {
          lines.push({
            item: item,
            purchaseQty: purchaseQty,
            baseQty: receiveBaseQty,
            factor: factor
          });
        }
      });

    if (!lines.length) {
      throw new Error(
        'Enter at least one quantity to receive.'
      );
    }

    const now = new Date();
    const receiptId = uuid_('REC');
    const receiptNo = generatePurchaseReceiptNo_();
    let totalBaseQty = 0;
    let totalCostUSD = 0;
    let totalPurchaseQty = 0;

    lines.forEach(function(line) {
      const item = line.item;
      const product = findRowBy_(
        POS.SHEETS.PRODUCTS,
        'ProductID',
        item.ProductID
      );

      if (!product) {
        throw new Error(
          String(item.ProductName || '') +
          ' no longer exists.'
        );
      }

      /*
       * LandedUnitCostUSD is cost per BASE unit and is intentionally kept
       * at six decimal places. Example: $10 / 24 cans = $0.416667.
       */
      const baseUnitCostUSD = roundCostV41_(
        item.LandedUnitCostUSD ||
        item.UnitCostUSD
      );

      const currentBaseStock = getBranchStockQty_(
        branchId,
        product.ProductID
      );

      const nextBaseStock = roundQtyV41_(
        currentBaseStock + line.baseQty
      );

      const newReceivedBaseQty = roundQtyV41_(
        number_(item.ReceivedQty) +
        line.baseQty
      );

      const lineCostUSD = roundMoney_(
        line.baseQty * baseUnitCostUSD
      );

      createPackageStockLotLockedV41_({
        branchId: branchId,
        productId: product.ProductID,
        purchaseId: purchase.PurchaseID,
        receiptId: receiptId,
        receivedAt: now,
        unitCostUSD: baseUnitCostUSD,
        quantity: line.baseQty,
        referenceType: 'PURCHASE_RECEIPT',
        referenceId: receiptId,
        note:
          receiptNo +
          ' / ' +
          purchase.PurchaseNo +
          ' / ' +
          line.purchaseQty +
          ' ' +
          String(
            item.PurchaseUnitName ||
            item.UnitName ||
            ''
          )
      });

      const fifoSummary = getFifoStockSummary_(
        product.ProductID,
        branchId
      );

      setBranchStockLocked_(
        branchId,
        product.ProductID,
        nextBaseStock,
        fifoSummary.totalQty > 0
          ? fifoSummary.averageCostUSD
          : baseUnitCostUSD
      );

      updateRowObject_(
        POS.SHEETS.PURCHASE_ITEMS,
        item._row,
        {
          ReceivedQty: newReceivedBaseQty,
          UpdatedAt: now
        }
      );

      appendObject_(POS.SHEETS.STOCK, {
        MovementID: uuid_('STK'),
        DateTime: now,
        BranchID: branchId,
        ProductID: product.ProductID,
        Type: 'PURCHASE_RECEIPT',
        QtyIn: line.baseQty,
        QtyOut: 0,
        BalanceAfter: nextBaseStock,
        ReferenceType: 'PURCHASE',
        ReferenceID: purchase.PurchaseID,
        UserID: user.UserID,
        Note:
          receiptNo +
          ' / ' +
          line.purchaseQty +
          ' ' +
          String(
            item.PurchaseUnitName ||
            item.UnitName ||
            ''
          ),
        UnitCostUSD: baseUnitCostUSD,
        CostInUSD: lineCostUSD,
        CostOutUSD: 0
      });

      totalPurchaseQty = roundQtyV41_(
        totalPurchaseQty + line.purchaseQty
      );

      totalBaseQty = roundQtyV41_(
        totalBaseQty + line.baseQty
      );

      totalCostUSD = roundMoney_(
        totalCostUSD + lineCostUSD
      );
    });

    appendObject_(
      PURCHASE_FIFO.SHEETS.PURCHASE_RECEIPTS,
      {
        ReceiptID: receiptId,
        ReceiptNo: receiptNo,
        PurchaseID: purchase.PurchaseID,
        SupplierID: purchase.SupplierID,
        BranchID: branchId,
        ReceivedAt: now,
        TotalQty: totalBaseQty,
        TotalCostUSD: totalCostUSD,
        UserID: user.UserID,
        Notes: sanitizeText_(payload.notes, 250),
        CreatedAt: now
      }
    );

    const refreshedItems = getRows_(
      POS.SHEETS.PURCHASE_ITEMS
    ).filter(function(item) {
      return String(item.PurchaseID) ===
        String(purchase.PurchaseID);
    });

    const fullyReceived = refreshedItems.every(
      function(item) {
        return (
          number_(item.ReceivedQty) + 0.0005 >=
          number_(item.OrderedQty || item.Qty)
        );
      }
    );

    const partlyReceived = refreshedItems.some(
      function(item) {
        return number_(item.ReceivedQty) > 0.0005;
      }
    );

    const status = fullyReceived
      ? 'RECEIVED'
      : partlyReceived
        ? 'PARTIALLY_RECEIVED'
        : 'ORDERED';

    updateRowObject_(
      POS.SHEETS.PURCHASES,
      purchase._row,
      {
        Status: status,
        UpdatedAt: now
      }
    );

    audit_(
      user.UserID,
      'RECEIVE_PACKAGE_PURCHASE',
      'Purchase',
      purchase.PurchaseID,
      {
        branchId: branchId,
        receiptNo: receiptNo,
        totalPurchaseQty: totalPurchaseQty,
        totalBaseQty: totalBaseQty,
        totalCostUSD: totalCostUSD,
        status: status
      }
    );

    return {
      success: true,
      purchaseId: String(purchase.PurchaseID),
      receiptId: receiptId,
      receiptNo: receiptNo,
      status: status,
      totalPurchaseQty: totalPurchaseQty,
      totalBaseQty: totalBaseQty,
      totalCostUSD: totalCostUSD
    };
  });
}

function getPurchasePrintDataV41(sessionToken, purchaseId, documentType) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  const purchase = getPurchaseDetailsV41(sessionToken, purchaseId);
  const supplier = findRowBy_(
    POS.SHEETS.SUPPLIERS,
    'SupplierID',
    purchase.supplierId
  ) || {};
  return {
    documentType: String(documentType || 'PURCHASE_ORDER').toUpperCase(),
    purchase: purchase,
    supplier: {
      name: String(supplier.Name || purchase.supplierName),
      contactPerson: String(supplier.ContactPerson || ''),
      phone: String(supplier.Phone || ''),
      email: String(supplier.Email || ''),
      address: String(supplier.Address || ''),
      taxNumber: String(supplier.TaxNumber || '')
    },
    shop: getPublicSettings_(),
    printedBy: String(user.Name),
    productPackagingVersion: PRODUCT_PACKAGING_V41.VERSION
  };
}

function getPurchaseReturnableDetailV41(sessionToken, purchaseId) {
  const detail = getPurchaseReturnableDetail(sessionToken, purchaseId);
  const rows = getRows_(POS.SHEETS.PURCHASE_ITEMS)
    .filter(function(item) {
      return String(item.PurchaseID) === String(purchaseId);
    });
  const byId = {};
  rows.forEach(function(item) {
    byId[String(item.PurchaseItemID)] = item;
  });

  detail.items = detail.items.map(function(item) {
    const row = byId[item.purchaseItemId] || {};
    const factor = number_(row.UnitsPerPurchaseUnit, 1) || 1;
    return Object.assign({}, item, {
      packageId: String(row.PurchasePackageID || ''),
      purchaseUnitName: String(row.PurchaseUnitName || row.UnitName || ''),
      unitsPerPurchaseUnit: factor,
      receivedBaseQty: item.receivedQty,
      alreadyReturnedBaseQty: item.alreadyReturnedQty,
      returnableBaseQty: item.returnableQty,
      receivedQty: roundQtyV41_(item.receivedQty / factor),
      alreadyReturnedQty: roundQtyV41_(item.alreadyReturnedQty / factor),
      returnableQty: roundQtyV41_(item.returnableQty / factor),
      unitCostUSD: roundCostV41_(number_(item.unitCostUSD) * factor)
    });
  });
  detail.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return detail;
}

function processSupplierReturnV41(sessionToken, payload) {
  payload = payload || {};
  const purchaseItems = getRows_(POS.SHEETS.PURCHASE_ITEMS)
    .filter(function(item) {
      return String(item.PurchaseID) === String(payload.purchaseId || '');
    });
  const byId = {};
  purchaseItems.forEach(function(item) {
    byId[String(item.PurchaseItemID)] = item;
  });

  const converted = Object.assign({}, payload, {
    items: (Array.isArray(payload.items) ? payload.items : []).map(function(raw) {
      const item = byId[String(raw.purchaseItemId)];
      if (!item) throw new Error('A selected purchase item was not found.');
      const factor = number_(item.UnitsPerPurchaseUnit, 1) || 1;
      return {
        purchaseItemId: String(raw.purchaseItemId),
        qty: roundQtyV41_(number_(raw.qty) * factor)
      };
    })
  });

  const result = processSupplierReturn(sessionToken, converted);
  const returnId = String(result.supplierReturnId || '');

  if (returnId) {
    const rows = getRows_(POS.SHEETS.SUPPLIER_RETURN_ITEMS)
      .filter(function(row) {
        return String(row.SupplierReturnID) === returnId;
      });
    rows.forEach(function(row) {
      const purchaseItem = byId[String(row.PurchaseItemID)] || {};
      const factor = number_(purchaseItem.UnitsPerPurchaseUnit, 1) || 1;
      updateRowObject_(POS.SHEETS.SUPPLIER_RETURN_ITEMS, row._row, {
        ReturnPackageID: String(purchaseItem.PurchasePackageID || ''),
        ReturnUnitName: String(
          purchaseItem.PurchaseUnitName || purchaseItem.UnitName || ''
        ),
        ReturnPurchaseQty: roundQtyV41_(number_(row.QtyReturned) / factor),
        UnitsPerReturnUnit: factor
      });
    });
  }

  return supplierReturnPackagePublicV41_(
    findRowBy_(POS.SHEETS.SUPPLIER_RETURNS, 'SupplierReturnID', returnId)
  );
}

function supplierReturnPackagePublicV41_(header) {
  if (!header) throw new Error('Supplier return not found.');
  const items = getRows_(POS.SHEETS.SUPPLIER_RETURN_ITEMS)
    .filter(function(item) {
      return String(item.SupplierReturnID) === String(header.SupplierReturnID);
    });

  return {
    supplierReturnId: String(header.SupplierReturnID),
    returnNo: String(header.ReturnNo),
    purchaseId: String(header.PurchaseID),
    purchaseNo: String(header.PurchaseNo),
    supplierId: String(header.SupplierID),
    supplierName: String(header.SupplierName),
    branchId: String(header.BranchID || ''),
    dateTime: header.DateTime ? new Date(header.DateTime).toISOString() : '',
    reason: String(header.Reason || ''),
    settlementType: String(header.SettlementType || ''),
    refundMethod: String(header.RefundMethod || ''),
    amountUSD: number_(header.AmountUSD),
    reference: String(header.Reference || ''),
    notes: String(header.Notes || ''),
    status: String(header.Status || ''),
    userName: String(header.UserName || ''),
    imageUrl: String(header.DamageImageURL || ''),
    totalQty: items.reduce(function(sum, item) {
      const factor = number_(item.UnitsPerReturnUnit, 1) || 1;
      return sum + (
        item.ReturnPurchaseQty !== '' && item.ReturnPurchaseQty !== undefined
          ? number_(item.ReturnPurchaseQty)
          : roundQtyV41_(number_(item.QtyReturned) / factor)
      );
    }, 0),
    items: items.map(function(item) {
      const factor = number_(item.UnitsPerReturnUnit, 1) || 1;
      return {
        productId: String(item.ProductID),
        productName: String(item.ProductName),
        qtyReturned:
          item.ReturnPurchaseQty !== '' && item.ReturnPurchaseQty !== undefined
            ? number_(item.ReturnPurchaseQty)
            : roundQtyV41_(number_(item.QtyReturned) / factor),
        baseQtyReturned: number_(item.QtyReturned),
        packageId: String(item.ReturnPackageID || ''),
        unitName: String(item.ReturnUnitName || ''),
        unitsPerUnit: factor,
        unitCostUSD: roundCostV41_(number_(item.UnitCostUSD) * factor),
        amountUSD: number_(item.AmountUSD)
      };
    }),
    productPackagingVersion: PRODUCT_PACKAGING_V41.VERSION
  };
}
