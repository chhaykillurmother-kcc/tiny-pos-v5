/**
 * Tiny POS v3.9 stability layer.
 *
 * This file intentionally uses new public function names so it can coexist
 * with earlier versions while the frontend migrates to the corrected paths.
 */

function setEntityActiveV39(sessionToken, entityType, entityId, active) {
  const result = setEntityActive(
    sessionToken,
    entityType,
    entityId,
    active === true
  );

  SpreadsheetApp.flush();

  return {
    success: true,
    entityType: String(entityType || '').toUpperCase(),
    entityId: String(entityId || ''),
    active: active === true,
    result: result || {}
  };
}


function reportEmptyV39_(type, options) {
  const range = reportRange_(
    options && options.from,
    options && options.to
  );

  return {
    type: String(type || 'SALES_SUMMARY').toUpperCase(),
    title: String(type || 'SALES_SUMMARY')
      .replace(/_/g, ' '),
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    totals: {},
    rows: [],
    filters: {
      branchId: sanitizeText_(
        options && options.branchId,
        80
      ),
      cashierId: sanitizeText_(
        options && options.cashierId,
        80
      )
    }
  };
}


function normalizeReportV39_(report, type, options) {
  const empty = reportEmptyV39_(type, options);

  report = report && typeof report === 'object'
    ? report
    : empty;

  if (!report.type) {
    report.type = empty.type;
  }

  if (!report.title) {
    report.title = empty.title;
  }

  if (!report.from) {
    report.from = empty.from;
  }

  if (!report.to) {
    report.to = empty.to;
  }

  if (!report.totals || typeof report.totals !== 'object') {
    report.totals = {};
  }

  if (!Array.isArray(report.rows)) {
    report.rows = [];
  }

  if (!report.filters) {
    report.filters = empty.filters;
  }

  return report;
}



function buildCreditReportV39_(
  user,
  reportOptions
) {
  const range = reportRange_(
    reportOptions.from,
    reportOptions.to
  );

  const branchId =
    sanitizeText_(
      reportOptions.branchId,
      80
    );

  const cashierId =
    sanitizeText_(
      reportOptions.cashierId,
      80
    );

  const query =
    sanitizeText_(
      reportOptions.query,
      160
    ).toLowerCase();

  const sales = {};

  getRows_(POS.SHEETS.SALES)
    .forEach(function(sale) {
      const branchOk =
        !branchId ||
        String(
          sale.BranchID ||
          BRANCH_FEATURE.DEFAULT_BRANCH_ID
        ) === branchId;

      const cashierOk =
        !cashierId ||
        String(
          sale.CashierID || ''
        ) === cashierId;

      if (
        branchOk &&
        cashierOk
      ) {
        sales[String(sale.SaleID)] =
          sale;
      }
    });

  const customers = {};

  getRows_(POS.SHEETS.CUSTOMERS)
    .forEach(function(customer) {
      customers[String(customer.CustomerID)] =
        customer;
    });

  const now = new Date();

  const rows = getRows_(
    POS.SHEETS.RECEIVABLES
  )
    .map(function(receivable) {
      const sale =
        sales[String(receivable.SaleID)];

      if (!sale) {
        return null;
      }

      const invoiceDate =
        reportDate_(
          receivable.InvoiceDate ||
          sale.DateTime ||
          sale.CreatedAt
        );

      if (
        !invoiceDate ||
        invoiceDate < range.from ||
        invoiceDate > range.to
      ) {
        return null;
      }

      const customer =
        customers[
          String(receivable.CustomerID)
        ] || {};

      const status =
        receivableStatus_(
          receivable,
          now
        );

      const row = {
        receivableId: String(
          receivable.ReceivableID || ''
        ),
        customerId: String(
          receivable.CustomerID || ''
        ),
        saleId: String(
          receivable.SaleID || ''
        ),
        invoiceNo: String(
          receivable.InvoiceNo ||
          sale.InvoiceNo ||
          ''
        ),
        invoiceDate:
          invoiceDate.toISOString(),
        dueDate:
          reportDate_(receivable.DueDate)
            ? reportDate_(
                receivable.DueDate
              ).toISOString()
            : '',
        originalAmountUSD:
          roundMoney_(
            number_(
              receivable.OriginalAmountUSD
            )
          ),
        paidUSD:
          roundMoney_(
            number_(
              receivable.PaidUSD
            )
          ),
        balanceUSD:
          roundMoney_(
            number_(
              receivable.BalanceUSD
            )
          ),
        status: status,
        customerName: String(
          customer.Name || ''
        ),
        customerType: String(
          customer.CustomerType ||
          'RETAIL'
        ),
        phone: String(
          customer.Phone || ''
        ),
        branchId: String(
          sale.BranchID ||
          BRANCH_FEATURE.DEFAULT_BRANCH_ID
        ),
        cashierId: String(
          sale.CashierID || ''
        ),
        cashierName: String(
          sale.CashierName || ''
        )
      };

      const haystack = [
        row.invoiceNo,
        row.customerName,
        row.customerType,
        row.phone,
        row.cashierName
      ].join(' ').toLowerCase();

      return (
        !query ||
        haystack.indexOf(query) >= 0
      ) ? row : null;
    })
    .filter(Boolean)
    .sort(function(a, b) {
      return new Date(a.dueDate || a.invoiceDate) -
        new Date(b.dueDate || b.invoiceDate);
    });

  const customerIds = {};

  rows.forEach(function(row) {
    if (row.customerId) {
      customerIds[row.customerId] = true;
    }
  });

  return {
    type: 'CREDIT',
    title: 'Customer Credit',
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    totals: {
      outstandingUSD:
        roundMoney_(
          rows.reduce(function(sum, row) {
            return sum +
              number_(row.balanceUSD);
          }, 0)
        ),
      overdueUSD:
        roundMoney_(
          rows
            .filter(function(row) {
              return row.status ===
                'OVERDUE';
            })
            .reduce(function(sum, row) {
              return sum +
                number_(row.balanceUSD);
            }, 0)
        ),
      openInvoices:
        rows.filter(function(row) {
          return number_(row.balanceUSD) >
            0.000001;
        }).length,
      overdueInvoices:
        rows.filter(function(row) {
          return row.status ===
            'OVERDUE';
        }).length,
      customers:
        Object.keys(customerIds).length
    },
    rows: rows,
    filters: {
      branchId: branchId,
      cashierId: cashierId
    }
  };
}


function getReportWorkspaceV39(sessionToken, options) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'REPORTS');

  options = options || {};

  const filters = getBranchFilterOptionsV37(sessionToken);

  const allowedBranchIds = {};
  filters.branches.forEach(function(branch) {
    allowedBranchIds[String(branch.branchId)] = true;
  });

  let branchId = sanitizeText_(options.branchId, 80);

  if (!filters.canSelectAllBranches) {
    branchId = filters.defaultBranchId;
  } else if (branchId && !allowedBranchIds[branchId]) {
    throw new Error('The selected report branch is unavailable.');
  }

  let cashierId = sanitizeText_(options.cashierId, 80);

  if (cashierId) {
    const cashier = filters.users.find(function(item) {
      return String(item.userId) === cashierId;
    });

    if (
      !cashier ||
      (branchId && String(cashier.branchId) !== branchId)
    ) {
      cashierId = '';
    }
  }

  const reportOptions = {
    type: String(options.type || 'SALES_SUMMARY').toUpperCase(),
    from: options.from || '',
    to: options.to || '',
    period: options.period || 'DATE_RANGE',
    query: options.query || '',
    categoryId: options.categoryId || '',
    branchId: branchId,
    cashierId: cashierId
  };

  let report;

  try {
    report = reportOptions.type === 'CREDIT'
      ? buildCreditReportV39_(user, reportOptions)
      : getAdvancedReport(sessionToken, reportOptions);
  } catch (error) {
    console.error(
      'v3.9 report failed:',
      error && error.stack
        ? error.stack
        : String(error)
    );

    throw new Error(
      'Report could not be created: ' +
      (
        error && error.message
          ? error.message
          : String(error)
      )
    );
  }

  return {
    user: {
      userId: String(user.UserID || ''),
      name: String(user.Name || ''),
      role: String(user.Role || ''),
      branchId: getUserBranchId_(user)
    },
    filters: {
      canSelectAllBranches: filters.canSelectAllBranches,
      defaultBranchId: filters.defaultBranchId,
      branches: filters.branches,
      users: filters.users,
      selectedBranchId: branchId,
      selectedCashierId: cashierId
    },
    report: normalizeReportV39_(
      report,
      reportOptions.type,
      reportOptions
    )
  };
}


function getSalesListWorkspaceV39(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'SALES_LIST');

  filters = filters || {};

  const options = getBranchFilterOptionsV37(sessionToken);

  const branchId = resolveAccessibleBranchId_(
    user,
    filters.branchId,
    true
  );

  const result = getSalesList(sessionToken, {
    from: filters.from || '',
    to: filters.to || '',
    query: filters.query || '',
    method: filters.method || '',
    status: filters.status || '',
    branchId: branchId
  });

  result = result || {};
  result.rows = Array.isArray(result.rows)
    ? result.rows
    : [];
  result.metrics = result.metrics || {
    sales: 0,
    totalUSD: 0,
    paidUSD: 0,
    creditUSD: 0
  };
  result.branches = options.branches;
  result.canSelectAllBranches =
    options.canSelectAllBranches;
  result.defaultBranchId =
    options.defaultBranchId;
  result.selectedBranchId =
    branchId;

  return result;
}


function getReturnsWorkspaceV39(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'RETURNS');

  filters = filters || {};

  const options = getBranchFilterOptionsV37(sessionToken);

  const branchId = resolveAccessibleBranchId_(
    user,
    filters.branchId,
    true
  );

  const result = getReturnsModuleData(sessionToken, {
    query: filters.query || '',
    from: filters.from || '',
    to: filters.to || '',
    branchId: branchId
  }) || {};

  result.sales = Array.isArray(result.sales)
    ? result.sales
    : [];
  result.returns = Array.isArray(result.returns)
    ? result.returns
    : [];
  result.metrics = result.metrics || {};
  result.branches = options.branches;
  result.canSelectAllBranches =
    options.canSelectAllBranches;
  result.defaultBranchId =
    options.defaultBranchId;
  result.selectedBranchId =
    branchId;

  return result;
}


function transferAllocationSliceV39_(
  allocations,
  startOffset,
  quantity
) {
  let cursor = 0;
  let remaining = Math.max(
    0,
    number_(quantity)
  );

  const start = Math.max(
    0,
    number_(startOffset)
  );

  const output = [];

  allocations
    .slice()
    .sort(function(a, b) {
      return number_(a._row) - number_(b._row);
    })
    .forEach(function(allocation) {
      if (remaining <= 0.0005) {
        return;
      }

      const allocationQty = number_(allocation.Qty);
      const allocationStart = cursor;
      const allocationEnd = cursor + allocationQty;
      cursor = allocationEnd;

      const overlapStart = Math.max(
        allocationStart,
        start
      );
      const overlapEnd = Math.min(
        allocationEnd,
        start + quantity
      );

      const overlap = Math.max(
        0,
        overlapEnd - overlapStart
      );

      if (overlap <= 0.0005) {
        return;
      }

      const qty = Math.min(
        overlap,
        remaining
      );

      output.push({
        qty: qty,
        unitCostUSD: number_(
          allocation.UnitCostUSD
        ),
        costUSD: roundMoney_(
          qty *
          number_(allocation.UnitCostUSD)
        )
      });

      remaining = Math.max(
        0,
        remaining - qty
      );
    });

  if (remaining > 0.0005) {
    throw new Error(
      'The transfer cost allocation is incomplete. ' +
      'Run the branch FIFO repair before receiving.'
    );
  }

  return output;
}


function transferToPublicV39_(row, branchMap) {
  branchMap = branchMap || {};

  const items = getRows_(POS.SHEETS.TRANSFER_ITEMS)
    .filter(function(item) {
      return String(item.TransferID) ===
        String(row.TransferID);
    });

  let totalShipped = 0;
  let totalReceived = 0;
  let totalMissing = 0;
  let totalDamaged = 0;

  const publicItems = items.map(function(item) {
    const shipped = number_(item.QtyShipped);
    const received = number_(item.QtyReceived);
    const missing = number_(item.QtyMissing);
    const damaged = number_(item.QtyDamaged);

    totalShipped += shipped;
    totalReceived += received;
    totalMissing += missing;
    totalDamaged += damaged;

    return {
      transferItemId: String(item.TransferItemID),
      productId: String(item.ProductID),
      productName: String(item.ProductName),
      qtyRequested: number_(item.QtyRequested),
      qtyShipped: shipped,
      qtyReceived: received,
      qtyMissing: missing,
      qtyDamaged: damaged,
      qtyOutstanding: Math.max(
        0,
        Math.round(
          (
            shipped -
            received -
            missing -
            damaged
          ) * 1000
        ) / 1000
      ),
      receiveNote: String(item.ReceiveNote || ''),
      unitCostUSD: number_(item.UnitCostUSD),
      amountUSD: number_(item.AmountUSD)
    };
  });

  const fromBranch =
    branchMap[String(row.FromBranchID)] || {};
  const toBranch =
    branchMap[String(row.ToBranchID)] || {};

  return {
    transferId: String(row.TransferID),
    transferNo: String(row.TransferNo),
    fromBranchId: String(row.FromBranchID),
    toBranchId: String(row.ToBranchID),
    fromBranchName:
      fromBranch.nameEN ||
      fromBranch.nameKH ||
      String(row.FromBranchID),
    toBranchName:
      toBranch.nameEN ||
      toBranch.nameKH ||
      String(row.ToBranchID),
    status: String(row.Status || ''),
    varianceStatus: String(
      row.VarianceStatus || ''
    ),
    requestedAt: row.RequestedAt
      ? new Date(row.RequestedAt).toISOString()
      : '',
    shippedAt: row.ShippedAt
      ? new Date(row.ShippedAt).toISOString()
      : '',
    receivedAt: row.ReceivedAt
      ? new Date(row.ReceivedAt).toISOString()
      : '',
    reference: String(row.Reference || ''),
    expectedArrival: row.ExpectedArrival
      ? new Date(row.ExpectedArrival).toISOString()
      : '',
    receivedByName: String(
      row.ReceivedByName || ''
    ),
    receiptNote: String(
      row.ReceiptNote || ''
    ),
    notes: String(row.Notes || ''),
    itemCount: publicItems.length,
    totalQty: publicItems.reduce(
      function(sum, item) {
        return sum + item.qtyRequested;
      },
      0
    ),
    totalShippedQty: totalShipped,
    totalReceivedQty: totalReceived,
    totalMissingQty: totalMissing,
    totalDamagedQty: totalDamaged,
    totalOutstandingQty: Math.max(
      0,
      Math.round(
        (
          totalShipped -
          totalReceived -
          totalMissing -
          totalDamaged
        ) * 1000
      ) / 1000
    ),
    items: publicItems
  };
}


function getBranchTransferModuleDataV39(
  sessionToken,
  filters
) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'TRANSFERS');

  filters = filters || {};

  const scopeBranchId =
    resolveAccessibleBranchId_(
      user,
      filters.branchId,
      true
    );

  const query = sanitizeText_(
    filters.query,
    120
  ).toLowerCase();

  const status = sanitizeText_(
    filters.status,
    40
  ).toUpperCase();

  const branchRows = getRows_(
    POS.SHEETS.BRANCHES
  );

  const branchMap = {};

  branchRows.forEach(function(row) {
    branchMap[String(row.BranchID)] =
      branchToPublic_(row);
  });

  const transfers = getRows_(
    POS.SHEETS.TRANSFERS
  )
    .filter(function(row) {
      const rowStatus = String(
        row.Status || ''
      ).toUpperCase();

      if (
        status &&
        rowStatus !== status
      ) {
        return false;
      }

      if (
        scopeBranchId &&
        String(row.FromBranchID) !==
          String(scopeBranchId) &&
        String(row.ToBranchID) !==
          String(scopeBranchId)
      ) {
        return false;
      }

      const haystack = [
        row.TransferNo,
        (branchMap[String(row.FromBranchID)] || {})
          .nameEN,
        (branchMap[String(row.ToBranchID)] || {})
          .nameEN,
        row.Status,
        row.Reference,
        row.Notes
      ].join(' ').toLowerCase();

      return !query ||
        haystack.indexOf(query) >= 0;
    })
    .sort(function(a, b) {
      return new Date(
        b.RequestedAt || b.CreatedAt
      ) - new Date(
        a.RequestedAt || a.CreatedAt
      );
    })
    .map(function(row) {
      return transferToPublicV39_(
        row,
        branchMap
      );
    });

  const options =
    getBranchFilterOptionsV37(sessionToken);

  return {
    branches: options.branches,
    transfers: transfers,
    metrics: {
      total: transfers.length,
      draft: transfers.filter(function(item) {
        return item.status === 'DRAFT';
      }).length,
      shipped: transfers.filter(function(item) {
        return item.status === 'SHIPPED';
      }).length,
      partial: transfers.filter(function(item) {
        return item.status ===
          'PARTIALLY_RECEIVED';
      }).length,
      received: transfers.filter(function(item) {
        return [
          'RECEIVED',
          'RECEIVED_WITH_VARIANCE'
        ].indexOf(item.status) >= 0;
      }).length
    },
    canManageAllBranches:
      options.canSelectAllBranches,
    defaultBranchId:
      options.defaultBranchId,
    selectedBranchId:
      scopeBranchId
  };
}


function receiveStockTransferV39(
  sessionToken,
  transferId,
  payload
) {
  payload = payload || {};

  const user = requireSession_(sessionToken);

  requirePermission_(user, 'TRANSFERS');

  requireRole_(
    user,
    [
      POS.ROLES.ADMIN,
      POS.ROLES.MANAGER,
      POS.ROLES.STOCK
    ]
  );

  return withScriptLock_(function() {
    const transfer = findRowBy_(
      POS.SHEETS.TRANSFERS,
      'TransferID',
      transferId
    );

    if (!transfer) {
      throw new Error('Transfer not found.');
    }

    const currentStatus = String(
      transfer.Status || ''
    ).toUpperCase();

    if (
      [
        'SHIPPED',
        'PARTIALLY_RECEIVED'
      ].indexOf(currentStatus) < 0
    ) {
      throw new Error(
        'Only a shipped or partially received transfer can be received.'
      );
    }

    requireBranchAccess_(
      user,
      transfer.ToBranchID
    );

    const items = getRows_(
      POS.SHEETS.TRANSFER_ITEMS
    ).filter(function(row) {
      return String(row.TransferID) ===
        String(transferId);
    });

    const payloadItems =
      Array.isArray(payload.items)
        ? payload.items
        : [];

    const inputByItem = {};

    payloadItems.forEach(function(item) {
      inputByItem[String(item.transferItemId)] =
        item || {};
    });

    const allocations = getRows_(
      POS.SHEETS.TRANSFER_ALLOCATIONS
    ).filter(function(row) {
      return String(row.TransferID) ===
        String(transferId);
    });

    const now = new Date();

    let totalReceivedNow = 0;
    let totalMissingNow = 0;
    let totalDamagedNow = 0;

    items.forEach(function(item) {
      const input =
        inputByItem[String(item.TransferItemID)] ||
        {};

      const shipped = number_(
        item.QtyShipped ||
        item.QtyRequested
      );

      const receivedBefore = number_(
        item.QtyReceived
      );

      const missingBefore = number_(
        item.QtyMissing
      );

      const damagedBefore = number_(
        item.QtyDamaged
      );

      const processedBefore =
        receivedBefore +
        missingBefore +
        damagedBefore;

      const outstanding = Math.max(
        0,
        Math.round(
          (
            shipped -
            processedBefore
          ) * 1000
        ) / 1000
      );

      const receivedNow = Math.max(
        0,
        Math.round(
          number_(input.qtyReceived) *
          1000
        ) / 1000
      );

      const missingNow = Math.max(
        0,
        Math.round(
          number_(input.qtyMissing) *
          1000
        ) / 1000
      );

      const damagedNow = Math.max(
        0,
        Math.round(
          number_(input.qtyDamaged) *
          1000
        ) / 1000
      );

      const processedNow =
        receivedNow +
        missingNow +
        damagedNow;

      if (processedNow > outstanding + 0.0005) {
        throw new Error(
          String(item.ProductName || 'Product') +
          ': received, missing, and damaged quantities exceed the outstanding quantity of ' +
          outstanding + '.'
        );
      }

      if (
        processedNow <= 0.0005 &&
        outstanding > 0.0005
      ) {
        return;
      }

      const itemAllocations =
        allocations.filter(function(row) {
          return String(row.TransferItemID) ===
            String(item.TransferItemID);
        });

      if (receivedNow > 0.0005) {
        const receivedAllocations =
          transferAllocationSliceV39_(
            itemAllocations,
            processedBefore,
            receivedNow
          );

        receivedAllocations.forEach(
          function(allocation) {
            createStockLotLocked_({
              productId: item.ProductID,
              branchId: transfer.ToBranchID,
              receivedAt: now,
              unitCostUSD:
                allocation.unitCostUSD,
              quantity: allocation.qty,
              referenceType:
                'STOCK_TRANSFER_IN',
              referenceId: transferId,
              note: transfer.TransferNo
            });
          }
        );

        const receivedCost =
          receivedAllocations.reduce(
            function(sum, allocation) {
              return sum +
                allocation.costUSD;
            },
            0
          );

        const averageCost =
          receivedNow > 0
            ? receivedCost / receivedNow
            : number_(item.UnitCostUSD);

        const balance =
          adjustBranchStockLocked_(
            transfer.ToBranchID,
            item.ProductID,
            receivedNow,
            averageCost
          );

        appendObject_(
          POS.SHEETS.STOCK,
          {
            MovementID: uuid_('STK'),
            DateTime: now,
            ProductID: item.ProductID,
            Type: 'TRANSFER_IN',
            QtyIn: receivedNow,
            QtyOut: 0,
            BalanceAfter: balance,
            ReferenceType: 'TRANSFER',
            ReferenceID: transferId,
            UserID: user.UserID,
            Note: transfer.TransferNo,
            UnitCostUSD: averageCost,
            CostInUSD:
              roundMoney_(receivedCost),
            CostOutUSD: 0,
            BranchID: transfer.ToBranchID,
            FromBranchID:
              transfer.FromBranchID,
            ToBranchID:
              transfer.ToBranchID
          }
        );
      }

      updateRowObject_(
        POS.SHEETS.TRANSFER_ITEMS,
        item._row,
        {
          QtyReceived:
            receivedBefore +
            receivedNow,
          QtyMissing:
            missingBefore +
            missingNow,
          QtyDamaged:
            damagedBefore +
            damagedNow,
          ReceiveNote: sanitizeText_(
            input.note,
            250
          ),
          UpdatedAt: now
        }
      );

      totalReceivedNow += receivedNow;
      totalMissingNow += missingNow;
      totalDamagedNow += damagedNow;
    });

    const updatedItems = getRows_(
      POS.SHEETS.TRANSFER_ITEMS
    ).filter(function(row) {
      return String(row.TransferID) ===
        String(transferId);
    });

    let totalShipped = 0;
    let totalReceived = 0;
    let totalMissing = 0;
    let totalDamaged = 0;

    updatedItems.forEach(function(item) {
      totalShipped += number_(
        item.QtyShipped ||
        item.QtyRequested
      );
      totalReceived += number_(
        item.QtyReceived
      );
      totalMissing += number_(
        item.QtyMissing
      );
      totalDamaged += number_(
        item.QtyDamaged
      );
    });

    const outstanding = Math.max(
      0,
      Math.round(
        (
          totalShipped -
          totalReceived -
          totalMissing -
          totalDamaged
        ) * 1000
      ) / 1000
    );

    let status;

    if (outstanding > 0.0005) {
      status = 'PARTIALLY_RECEIVED';
    } else if (
      totalMissing > 0.0005 ||
      totalDamaged > 0.0005
    ) {
      status = 'RECEIVED_WITH_VARIANCE';
    } else {
      status = 'RECEIVED';
    }

    updateRowObject_(
      POS.SHEETS.TRANSFERS,
      transfer._row,
      {
        Status: status,
        VarianceStatus:
          totalMissing > 0.0005 ||
          totalDamaged > 0.0005
            ? 'VARIANCE'
            : 'MATCHED',
        TotalMissingQty: totalMissing,
        TotalDamagedQty: totalDamaged,
        ReceivedAt: now,
        ReceivedByID: user.UserID,
        ReceivedByName: user.Name,
        ReceiptNote: sanitizeText_(
          payload.receiptNote,
          500
        ),
        UpdatedAt: now
      }
    );

    audit_(
      user.UserID,
      'RECEIVE_TRANSFER',
      'StockTransfer',
      transferId,
      {
        transferNo:
          transfer.TransferNo,
        receivedNow:
          totalReceivedNow,
        missingNow:
          totalMissingNow,
        damagedNow:
          totalDamagedNow,
        totalOutstanding:
          outstanding,
        status: status
      }
    );

    return {
      success: true,
      status: status,
      totalReceivedQty:
        totalReceived,
      totalMissingQty:
        totalMissing,
      totalDamagedQty:
        totalDamaged,
      totalOutstandingQty:
        outstanding
    };
  });
}