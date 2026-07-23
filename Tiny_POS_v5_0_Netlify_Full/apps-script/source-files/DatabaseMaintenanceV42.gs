/**
 * Tiny POS Database Maintenance v4.2
 *
 * Safe business-data reset for a working Tiny POS installation.
 *
 * This file is additive. It does not delete or modify Apps Script files,
 * deployments, triggers, users, roles, permissions, branches, settings,
 * products, product packages, categories, units, customers, suppliers,
 * coupons, product codes, barcodes, images, or backups.
 *
 * The reset clears only transaction/history/inventory data and rebuilds all
 * product/branch stock balances at zero. A Google Drive backup is mandatory
 * and is created before any data is changed.
 */
const DATABASE_MAINTENANCE_V42 = Object.freeze({
  VERSION: '4.2.0',
  CONFIRMATION_TEXT: 'RESET POS DATA',

  /* Child/detail tables are cleared before their parent tables. */
  TRANSACTION_SHEETS: Object.freeze([
    'CustomerPaymentAllocations',
    'CustomerPayments',
    'Receivables',

    'RefundPayments',
    'ReturnLotRestorations',
    'ReturnItems',
    'Returns',

    'Payments',
    'PaymentIntents',
    'SaleItems',
    'Sales',
    'PendingInvoices',

    'SupplierReturnItems',
    'SupplierReturns',
    'SupplierPayments',
    'PurchaseReceipts',
    'PurchaseItems',
    'Purchases',

    'StockTransferAllocations',
    'StockTransferItems',
    'StockTransfers',

    'StockCountItems',
    'StockCounts',

    'FifoAllocations',
    'StockLots',
    'StockMovements',

    'Expenses',
    'CashShifts'
  ]),

  /* These script-property counters are transaction/document sequences only. */
  COUNTER_PREFIXES: Object.freeze([
    'INVOICE_COUNTER_',
    'PENDING_COUNTER_',
    'PURCHASE_COUNTER_',
    'PURCHASE_RECEIPT_COUNTER_',
    'RETURN_COUNTER_',
    'SUPPLIER_RETURN_COUNTER_',
    'TRANSFER_COUNTER_'
  ]),

  /* Explicitly documented master data that the reset keeps. */
  PRESERVED_SHEETS: Object.freeze([
    'Settings',
    'Users',
    'Categories',
    'Units',
    'Products',
    'ProductPackages',
    'Customers',
    'Suppliers',
    'Coupons',
    'Branches',
    'Backups'
  ])
});

function getDatabaseMaintenanceDataV42(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  requirePermission_(user, 'BACKUP');

  return buildDatabaseMaintenanceSummaryV42_();
}

function previewBusinessDataResetV42(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  requirePermission_(user, 'BACKUP');

  payload = payload || {};

  return {
    success: true,
    confirmationText: DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT,
    clearAuditLog: payload.clearAuditLog === true,
    resetDocumentCounters: payload.resetDocumentCounters !== false,
    summary: buildDatabaseMaintenanceSummaryV42_(),
    warnings: [
      'A Google Drive backup will be created before the reset starts.',
      'Products, product packages, customers, suppliers, users, branches, settings, coupons, product codes, barcodes and images are preserved.',
      'All branch stock and FIFO quantities will be reset to zero.',
      'Do not run the reset while cashiers are selling or stock keepers are receiving goods.'
    ]
  };
}

function resetBusinessDataV42(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  requirePermission_(user, 'BACKUP');

  payload = payload || {};

  const confirmation = String(payload.confirmation || '')
    .trim()
    .toUpperCase();

  if (confirmation !== DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT) {
    throw new Error(
      'Type ' + DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT + ' to confirm.'
    );
  }

  if (payload.acknowledged !== true) {
    throw new Error('Confirm that all users have stopped using the POS.');
  }

  const clearAuditLog = payload.clearAuditLog === true;
  const resetDocumentCounters = payload.resetDocumentCounters !== false;

  return withScriptLock_(function() {
    /*
     * Backup is mandatory. If Drive backup creation fails, the reset stops
     * before any sheet is modified.
     */
    const backup = createTinyPosBackup_(
      user,
      'PRE_RESET',
      'Automatic safety backup before Tiny POS business-data reset'
    );

    const before = buildDatabaseMaintenanceSummaryV42_();
    const cleared = [];

    DATABASE_MAINTENANCE_V42.TRANSACTION_SHEETS.forEach(function(sheetName) {
      cleared.push(clearSheetDataRowsV42_(sheetName));
    });

    /* Audit history is optional. The reset action itself is always logged. */
    if (clearAuditLog) {
      cleared.push(clearSheetDataRowsV42_('AuditLog'));
    }

    resetProductStockV42_();
    resetCustomerDerivedBalancesV42_();
    resetCouponUsageV42_();
    rebuildZeroBranchInventoryV42_();

    if (resetDocumentCounters) {
      resetDocumentCountersV42_();
    }

    SpreadsheetApp.flush();

    const verification = verifyBusinessDataResetV42_();

    audit_(
      user.UserID,
      'RESET_BUSINESS_DATA',
      'DatabaseMaintenance',
      '',
      {
        version: DATABASE_MAINTENANCE_V42.VERSION,
        backupFileId: backup.fileId,
        backupFileName: backup.fileName,
        clearAuditLog: clearAuditLog,
        resetDocumentCounters: resetDocumentCounters,
        clearedSheets: cleared,
        verification: verification
      }
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Tiny POS business data was reset successfully.',
      backup: backup,
      before: before,
      clearedSheets: cleared,
      verification: verification,
      after: buildDatabaseMaintenanceSummaryV42_()
    };
  });
}

/**
 * Apps Script editor fallback.
 * Run only from the function selector while the spreadsheet is open.
 */
function resetBusinessDataFromEditorV42() {
  const ui = SpreadsheetApp.getUi();

  const first = ui.alert(
    'Tiny POS Business Data Reset',
    [
      'This clears sales, purchases, returns, transfers, pending invoices,',
      'cash/expense records, credit transactions, FIFO and all branch stock.',
      '',
      'It keeps products, product packages, customers, suppliers, users,',
      'branches, settings, coupons, barcodes, images and product codes.',
      '',
      'A Google Drive backup will be created first.',
      '',
      'Continue?'
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );

  if (first !== ui.Button.YES) {
    return {success: false, cancelled: true};
  }

  const typed = ui.prompt(
    'Final confirmation',
    'Type exactly: ' + DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT,
    ui.ButtonSet.OK_CANCEL
  );

  if (typed.getSelectedButton() !== ui.Button.OK) {
    return {success: false, cancelled: true};
  }

  if (
    String(typed.getResponseText() || '').trim().toUpperCase() !==
    DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT
  ) {
    throw new Error(
      'Confirmation text did not match. Nothing was reset.'
    );
  }

  const editorName =
    Session.getActiveUser().getEmail() ||
    'Apps Script Editor';

  return withScriptLock_(function() {
    const editorUser = {
      UserID: 'EDITOR',
      Name: editorName
    };

    const backup = createTinyPosBackup_(
      editorUser,
      'PRE_RESET',
      'Automatic safety backup before editor business-data reset'
    );

    DATABASE_MAINTENANCE_V42.TRANSACTION_SHEETS.forEach(function(sheetName) {
      clearSheetDataRowsV42_(sheetName);
    });

    resetProductStockV42_();
    resetCustomerDerivedBalancesV42_();
    resetCouponUsageV42_();
    rebuildZeroBranchInventoryV42_();
    resetDocumentCountersV42_();

    SpreadsheetApp.flush();

    const verification = verifyBusinessDataResetV42_();

    audit_(
      'EDITOR',
      'RESET_BUSINESS_DATA_FROM_EDITOR',
      'DatabaseMaintenance',
      '',
      {
        editor: editorName,
        backupFileId: backup.fileId,
        backupFileName: backup.fileName,
        verification: verification
      }
    );

    SpreadsheetApp.flush();

    ui.alert(
      'Reset completed.\n\n' +
      'Backup: ' + backup.fileName + '\n' +
      'Verification: ' +
      (verification.ok ? 'OK' : verification.issues.join(' | '))
    );

    return {
      success: true,
      backup: backup,
      verification: verification
    };
  });
}

function buildDatabaseMaintenanceSummaryV42_() {
  const transactionSheets = DATABASE_MAINTENANCE_V42.TRANSACTION_SHEETS
    .map(function(sheetName) {
      return {
        sheetName: sheetName,
        rowCount: getSheetDataRowCountV42_(sheetName),
        exists: databaseMaintenanceSheetExistsV42_(sheetName)
      };
    });

  const totalTransactionRows = transactionSheets.reduce(function(sum, row) {
    return sum + number_(row.rowCount, 0);
  }, 0);

  const products = getSafeRowsV42_('Products');
  const customers = getSafeRowsV42_('Customers');
  const suppliers = getSafeRowsV42_('Suppliers');
  const branches = getSafeRowsV42_('Branches');
  const packages = getSafeRowsV42_('ProductPackages');
  const backups = getSafeRowsV42_('Backups')
    .filter(function(row) {
      return String(row.Status || 'AVAILABLE') === 'AVAILABLE';
    })
    .sort(function(a, b) {
      return new Date(b.DateTime || 0) - new Date(a.DateTime || 0);
    });

  const stock = products.reduce(function(sum, product) {
    return sum + Math.max(0, number_(product.CurrentStock, 0));
  }, 0);

  const branchStock = getSafeRowsV42_('BranchInventory')
    .reduce(function(sum, row) {
      return sum + Math.max(0, number_(row.Qty, 0));
    }, 0);

  return {
    version: DATABASE_MAINTENANCE_V42.VERSION,
    confirmationText: DATABASE_MAINTENANCE_V42.CONFIRMATION_TEXT,
    transactionSheets: transactionSheets,
    totals: {
      transactionRows: totalTransactionRows,
      sales: getSheetDataRowCountV42_('Sales'),
      purchases: getSheetDataRowCountV42_('Purchases'),
      pendingInvoices: getSheetDataRowCountV42_('PendingInvoices'),
      returns: getSheetDataRowCountV42_('Returns'),
      supplierReturns: getSheetDataRowCountV42_('SupplierReturns'),
      transfers: getSheetDataRowCountV42_('StockTransfers'),
      expenses: getSheetDataRowCountV42_('Expenses'),
      fifoLots: getSheetDataRowCountV42_('StockLots'),
      products: products.length,
      productPackages: packages.length,
      customers: customers.length,
      suppliers: suppliers.length,
      branches: branches.length,
      productStock: Math.round(stock * 1000) / 1000,
      branchStock: Math.round(branchStock * 1000) / 1000
    },
    preservedSheets: DATABASE_MAINTENANCE_V42.PRESERVED_SHEETS.slice(),
    lastBackup: backups.length
      ? {
          backupId: String(backups[0].BackupID || ''),
          fileName: String(backups[0].FileName || ''),
          url: String(backups[0].FileURL || ''),
          dateTime: backups[0].DateTime
            ? new Date(backups[0].DateTime).toISOString()
            : ''
        }
      : null
  };
}

function verifyBusinessDataResetV42_() {
  const issues = [];

  DATABASE_MAINTENANCE_V42.TRANSACTION_SHEETS.forEach(function(sheetName) {
    const count = getSheetDataRowCountV42_(sheetName);
    if (count > 0) {
      issues.push(sheetName + ' still has ' + count + ' row(s).');
    }
  });

  getSafeRowsV42_('Products').forEach(function(product) {
    if (Math.abs(number_(product.CurrentStock, 0)) > 0.0005) {
      issues.push(
        'Product ' + String(product.ProductID || product.NameEN || '') +
        ' still has stock.'
      );
    }
  });

  getSafeRowsV42_('BranchInventory').forEach(function(row) {
    if (Math.abs(number_(row.Qty, 0)) > 0.0005) {
      issues.push(
        'Branch inventory ' + String(row.BranchID || '') + '/' +
        String(row.ProductID || '') + ' is not zero.'
      );
    }
  });

  getSafeRowsV42_('Customers').forEach(function(customer) {
    if (
      Math.abs(number_(customer.CreditBalanceUSD, 0)) > 0.005 ||
      Math.abs(number_(customer.Points, 0)) > 0.005
    ) {
      issues.push(
        'Customer ' + String(customer.CustomerID || customer.Name || '') +
        ' still has derived balance/points.'
      );
    }
  });

  getSafeRowsV42_('Coupons').forEach(function(coupon) {
    if (number_(coupon.UsedCount, 0) !== 0) {
      issues.push(
        'Coupon ' + String(coupon.Code || coupon.CouponID || '') +
        ' still has a usage count.'
      );
    }
  });

  return {
    ok: issues.length === 0,
    issues: issues.slice(0, 100),
    checkedAt: new Date().toISOString()
  };
}

function clearSheetDataRowsV42_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return {
      sheetName: sheetName,
      rowsCleared: 0,
      existed: false
    };
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = Math.max(1, sheet.getLastColumn());
  const rows = Math.max(0, lastRow - 1);

  if (rows > 0) {
    sheet.getRange(2, 1, rows, lastColumn).clearContent();
  }

  return {
    sheetName: sheetName,
    rowsCleared: rows,
    existed: true
  };
}

function resetProductStockV42_() {
  setColumnsForAllRowsV42_('Products', {
    CurrentStock: 0,
    UpdatedAt: new Date()
  });
}

function resetCustomerDerivedBalancesV42_() {
  setColumnsForAllRowsV42_('Customers', {
    Points: 0,
    CreditBalanceUSD: 0,
    UpdatedAt: new Date()
  });
}

function resetCouponUsageV42_() {
  setColumnsForAllRowsV42_('Coupons', {
    UsedCount: 0,
    UpdatedAt: new Date()
  });
}

function setColumnsForAllRowsV42_(sheetName, changes) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return;
  }

  const rowCount = sheet.getLastRow() - 1;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(function(value) {
      return String(value || '').trim();
    });

  Object.keys(changes).forEach(function(field) {
    const index = headers.indexOf(field);
    if (index < 0) return;

    const value = changes[field];
    const values = Array.from({length: rowCount}, function() {
      return [value instanceof Date ? new Date(value.getTime()) : value];
    });

    sheet.getRange(2, index + 1, rowCount, 1).setValues(values);
  });
}

function rebuildZeroBranchInventoryV42_() {
  clearSheetDataRowsV42_('BranchInventory');

  if (!databaseMaintenanceSheetExistsV42_('BranchInventory')) {
    return;
  }

  const branches = getSafeRowsV42_('Branches');
  const products = getSafeRowsV42_('Products');
  const now = new Date();
  const rows = [];

  branches.forEach(function(branch) {
    const branchId = String(branch.BranchID || '').trim();
    if (!branchId) return;

    products.forEach(function(product) {
      const productId = String(product.ProductID || '').trim();
      if (!productId) return;

      rows.push({
        BranchInventoryID: uuid_('BIN'),
        BranchID: branchId,
        ProductID: productId,
        Qty: 0,
        AverageCostUSD: Math.max(0, number_(product.CostUSD, 0)),
        UpdatedAt: now
      });
    });
  });

  appendObjectsInChunksV42_('BranchInventory', rows, 500);
}

function appendObjectsInChunksV42_(sheetName, objects, chunkSize) {
  const size = Math.max(1, number_(chunkSize, 500));

  for (let index = 0; index < objects.length; index += size) {
    appendObjects_(sheetName, objects.slice(index, index + size));
  }
}

function resetDocumentCountersV42_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();

  Object.keys(all).forEach(function(key) {
    const shouldDelete = DATABASE_MAINTENANCE_V42.COUNTER_PREFIXES
      .some(function(prefix) {
        return key.indexOf(prefix) === 0;
      });

    if (shouldDelete) {
      props.deleteProperty(key);
    }
  });
}

function databaseMaintenanceSheetExistsV42_(sheetName) {
  return Boolean(getSpreadsheet_().getSheetByName(sheetName));
}

function getSheetDataRowCountV42_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  return sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
}

function getSafeRowsV42_(sheetName) {
  return databaseMaintenanceSheetExistsV42_(sheetName)
    ? getRows_(sheetName)
    : [];
}

/**
 * Run once from the Apps Script function selector after adding this file.
 * It checks dependencies only and does not change any POS data.
 */
function verifyDatabaseMaintenanceV42() {
  const issues = [];
  const requiredSheets = [
    'Users',
    'Products',
    'Customers',
    'Branches',
    'BranchInventory',
    'Backups',
    'AuditLog'
  ];

  requiredSheets.forEach(function(sheetName) {
    if (!databaseMaintenanceSheetExistsV42_(sheetName)) {
      issues.push('Missing sheet: ' + sheetName);
    }
  });

  if (typeof createTinyPosBackup_ !== 'function') {
    issues.push('Missing function: createTinyPosBackup_ (BackupRestore.gs)');
  }

  if (typeof requireSession_ !== 'function') {
    issues.push('Missing function: requireSession_ (Auth.gs)');
  }

  if (typeof requirePermission_ !== 'function') {
    issues.push('Missing function: requirePermission_ (PermissionAccess.gs)');
  }

  if (typeof withScriptLock_ !== 'function') {
    issues.push('Missing function: withScriptLock_ (Database.gs)');
  }

  const message = issues.length
    ? 'Database Maintenance v4.2 is NOT ready:\n\n' + issues.join('\n')
    : 'Tiny POS Database Maintenance v4.2: OK\n\nNo data was changed.';

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return {
    success: issues.length === 0,
    issues: issues,
    message: message
  };
}
