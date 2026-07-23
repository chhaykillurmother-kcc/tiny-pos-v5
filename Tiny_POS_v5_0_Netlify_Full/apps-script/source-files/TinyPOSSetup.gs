/**
 * Tiny POS Complete safe installer/upgrader.
 * Adds missing sheets and columns only. Existing rows are never cleared.
 */
const TINY_POS_SCHEMA = Object.freeze({
  Settings: ['Key','Value','Type','UpdatedAt'],
  Users: ['UserID','LoginID','Name','TelegramID','Email','PINHash','Role','BranchID','PermissionsJSON','Active','Language','Theme','ThemeColor','LastLoginAt','CreatedAt','UpdatedAt'],
  Categories: ['CategoryID','NameEN','NameKH','SortOrder','Active','CreatedAt','UpdatedAt'],
  Units: ['UnitID','NameEN','NameKH','Abbreviation','AllowDecimal','SortOrder','Active','CreatedAt','UpdatedAt'],
  Products: ['ProductID','Barcode','SKU','NameEN','NameKH','CategoryID','UnitID','CostUSD','PriceUSD','PriceKHR','CurrentStock','LowStockLevel','ImageURL','ImageFileID','Active','CreatedAt','UpdatedAt'],
  Customers: ['CustomerID','Name','CustomerType','Phone','Email','Address','Notes','Points','CreditLimitUSD','CreditBalanceUSD','PaymentTermsDays','Active','CreatedAt','UpdatedAt'],
  Receivables: ['ReceivableID','CustomerID','SaleID','InvoiceNo','InvoiceDate','DueDate','OriginalAmountUSD','PaidUSD','BalanceUSD','Status','CreatedAt','UpdatedAt'],
  CustomerPayments: ['CustomerPaymentID','CustomerID','DateTime','Method','Currency','Amount','AmountUSD','Reference','ShiftID','UserID','Notes','CreatedAt'],
  CustomerPaymentAllocations: ['AllocationID','CustomerPaymentID','ReceivableID','SaleID','AmountUSD','CreatedAt'],
  Suppliers: ['SupplierID','Name','ContactPerson','Phone','Email','Address','TaxNumber','Notes','Active','CreatedAt','UpdatedAt'],
  Sales: ['SaleID','InvoiceNo','PendingNo','BranchID','DateTime','CustomerID','SubtotalUSD','DiscountUSD','TaxUSD','TotalUSD','TotalKHR','ExchangeRate','PaymentMethod','PaymentStatus','Status','CashierID','CashierName','ShiftID','Notes','CreatedAt','ManualDiscountType','ManualDiscountValue','ManualDiscountPercent','ManualDiscountUSD','CouponCode','CouponDiscountUSD','CustomerName','CustomerType','AmountPaidUSD','CreditAmountUSD','DueDate','PaymentTermsDays','CreditStatus','ReturnedQty','RefundedUSD','ReturnStatus','LastReturnAt'],
  SaleItems: ['SaleItemID','SaleID','ProductID','Barcode','ProductName','Qty','UnitCostUSD','UnitPriceUSD','DiscountUSD','LineTotalUSD','AllocatedSaleDiscountUSD','NetRevenueUSD','CostTotalUSD','GrossProfitUSD','UnitID','UnitName','ReturnedQty','RefundedUSD','RestockedQty','CostRestoredUSD'],
  Payments: ['PaymentID','SaleID','Method','Currency','Amount','Reference','KHQRMD5','BankHash','Status','ReceivedBy','CreatedAt'],
  PaymentIntents: ['IntentID','InvoiceNo','UserID','CustomerID','CartJSON','SubtotalUSD','DiscountUSD','TaxUSD','TotalUSD','TotalKHR','ExchangeRate','Currency','Amount','Status','KHQRMD5','QRText','BankHash','CreatedAt','ExpiresAt','SaleID'],
  PendingInvoices: ['PendingID','InvoiceNo','PendingNo','FinalInvoiceNo','BranchID','DateTime','CustomerID','CartJSON','SubtotalUSD','ManualDiscountType','ManualDiscountValue','ManualDiscountPercent','ManualDiscountUSD','CouponCode','CouponDiscountUSD','DiscountUSD','TaxUSD','TotalUSD','TotalKHR','ExchangeRate','PreferredPayment','Notes','Status','CashierID','CashierName','SaleID','UpdatedAt'],
  Coupons: ['CouponID','Code','DescriptionEN','DescriptionKH','DiscountType','DiscountValue','MinSpendUSD','MaxDiscountUSD','StartDate','EndDate','UsageLimit','UsedCount','Active','CreatedAt','UpdatedAt'],
  Purchases: ['PurchaseID','PurchaseNo','BranchID','SupplierID','SupplierName','SupplierInvoiceNo','PurchaseDate','ExpectedDate','SubtotalUSD','DiscountType','DiscountValue','DiscountUSD','TaxUSD','ShippingUSD','OtherCostUSD','TotalUSD','PaidUSD','SupplierCreditUSD','PaymentStatus','Status','Notes','UserID','CreatedAt','UpdatedAt'],
  PurchaseItems: ['PurchaseItemID','PurchaseID','ProductID','ProductName','UnitID','UnitName','OrderedQty','ReceivedQty','UnitCostUSD','LineDiscountUSD','LineTotalUSD','LandedUnitCostUSD','CreatedAt','UpdatedAt'],
  PurchaseReceipts: ['ReceiptID','ReceiptNo','PurchaseID','SupplierID','BranchID','ReceivedAt','TotalQty','TotalCostUSD','UserID','Notes','CreatedAt'],
  SupplierPayments: ['SupplierPaymentID','PurchaseID','SupplierID','DateTime','Method','AmountUSD','Reference','UserID','Notes','CreatedAt'],
  StockMovements: ['MovementID','DateTime','BranchID','FromBranchID','ToBranchID','ProductID','Type','QtyIn','QtyOut','BalanceAfter','ReferenceType','ReferenceID','UserID','Note','UnitCostUSD','CostInUSD','CostOutUSD'],
  StockCounts: ['CountID','CountNo','BranchID','CountType','CategoryID','CategoryName','Status','StartedAt','StartedByID','StartedByName','SubmittedAt','SubmittedByID','ApprovedAt','ApprovedByID','AppliedAt','AppliedByID','Notes','TotalItems','CountedItems','VarianceItems','VarianceQty','VarianceValueUSD','CreatedAt','UpdatedAt'],
  StockCountItems: ['CountItemID','CountID','BranchID','ProductID','Barcode','SKU','ProductName','CategoryID','UnitID','UnitName','SnapshotQty','CurrentSystemQty','Counted','PhysicalQty','VarianceQty','UnitCostUSD','VarianceValueUSD','Reason','Note','CountedAt','CountedByID','MovementDuringCount','NeedsRecount','AppliedAdjustmentID','CreatedAt','UpdatedAt'],
  StockLots: ['LotID','BranchID','ProductID','PurchaseID','ReceiptID','ReceivedAt','UnitCostUSD','QtyReceived','QtyRemaining','Status','ReferenceType','ReferenceID','Note','CreatedAt','UpdatedAt'],
  FifoAllocations: ['AllocationID','DateTime','BranchID','ProductID','LotID','Qty','UnitCostUSD','CostUSD','ReferenceType','ReferenceID','UserID','Note'],
  Returns: ['ReturnID','ReturnNo','BranchID','SaleID','InvoiceNo','DateTime','RefundMethod','RefundCurrency','RefundAmount','AmountUSD','AmountKHR','Reason','Notes','UserID','UserName','ShiftID','Status','CreatedAt','DamageImageURL','DamageImagePublicID'],
  ReturnItems: ['ReturnItemID','ReturnID','SaleItemID','SaleID','ProductID','ProductName','QtyReturned','UnitPriceUSD','GrossLineRefundUSD','DiscountRefundUSD','TaxRefundUSD','RefundUSD','Restock','Condition','CostRestoredUSD','CreatedAt'],
  RefundPayments: ['RefundPaymentID','ReturnID','SaleID','Method','Currency','Amount','AmountUSD','Reference','ShiftID','UserID','Status','CreatedAt'],
  ReturnLotRestorations: ['RestorationID','ReturnID','ReturnItemID','SaleItemID','OriginalAllocationID','OriginalLotID','ProductID','Qty','UnitCostUSD','CostUSD','NewLotID','CreatedAt'],
  Expenses: ['ExpenseID','DateTime','BranchID','Category','AmountUSD','Remark','UserID','ShiftID','CreatedAt'],
  CashShifts: ['ShiftID','UserID','OpenAt','OpeningUSD','OpeningKHR','CloseAt','ClosingUSD','ClosingKHR','ExpectedUSD','ExpectedKHR','DifferenceUSD','DifferenceKHR','Status'],
  Branches: ['BranchID','Code','NameEN','NameKH','Address','Phone','Active','CreatedAt','UpdatedAt'],
  BranchInventory: ['BranchInventoryID','BranchID','ProductID','Qty','AverageCostUSD','UpdatedAt'],
  StockTransfers: ['TransferID','TransferNo','FromBranchID','ToBranchID','Status','Reference','ExpectedArrival','RequestedAt','RequestedByID','ApprovedAt','ApprovedByID','ShippedAt','ShippedByID','ReceivedAt','ReceivedByID','ReceivedByName','ReceiptNote','VarianceStatus','TotalMissingQty','TotalDamagedQty','Notes','CreatedAt','UpdatedAt'],
  StockTransferItems: ['TransferItemID','TransferID','ProductID','ProductName','QtyRequested','QtyShipped','QtyReceived','QtyMissing','QtyDamaged','ReceiveNote','UnitCostUSD','AmountUSD','CreatedAt','UpdatedAt'],
  StockTransferAllocations: ['TransferAllocationID','TransferID','TransferItemID','ProductID','SourceLotID','Qty','UnitCostUSD','CostUSD','CreatedAt'],
  SupplierReturns: ['SupplierReturnID','ReturnNo','PurchaseID','PurchaseNo','SupplierID','SupplierName','BranchID','DateTime','Reason','SettlementType','RefundMethod','AmountUSD','Reference','Notes','DamageImageURL','DamageImagePublicID','Status','UserID','UserName','ApprovedByID','CreatedAt','UpdatedAt'],
  SupplierReturnItems: ['SupplierReturnItemID','SupplierReturnID','PurchaseItemID','ProductID','ProductName','QtyReturned','UnitCostUSD','AmountUSD','CreatedAt'],
  Backups: ['BackupID','DateTime','FileID','FileName','FileURL','BackupType','CreatedByID','CreatedByName','Note','Status','CreatedAt'],
  AuditLog: ['AuditID','DateTime','UserID','Action','Entity','EntityID','DetailsJSON']
});

function installTinyPOSComplete() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the target Google Sheet first.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  if (!props.getProperty('PASSWORD_SALT')) {
    props.setProperty('PASSWORD_SALT', Utilities.getUuid());
  }

  const report = [];
  Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName) {
    ensureTinyPosSheet_(ss, sheetName, TINY_POS_SCHEMA[sheetName], report);
  });

  Object.keys(DEFAULT_SETTINGS).forEach(function(key) {
    if (!findRowBy_(POS.SHEETS.SETTINGS, 'Key', key)) {
      setSetting_(key, DEFAULT_SETTINGS[key], 'STRING');
    }
  });

  ensureDefaultBranch_();
  syncMainBranchInventory_();

  if (!props.getProperty('IMAGE_FOLDER_ID')) {
    try {
      const folder = DriveApp.createFolder(DEFAULT_SETTINGS.IMAGE_FOLDER_NAME);
      props.setProperty('IMAGE_FOLDER_ID', folder.getId());
    } catch (error) {
      console.log('Drive image folder was not created: ' + error.message);
    }
  }

  if (getRows_(POS.SHEETS.USERS).length === 0) {
    const name = promptRequired_(ui, 'Administrator name', 'Enter the owner/administrator name:');
    const loginId = promptRequired_(ui, 'Administrator login ID', 'Enter a login ID, for example admin:').toLowerCase();
    const pin = promptRequired_(ui, 'Administrator PIN', 'Enter a new PIN with at least 4 characters:');
    if (pin.length < 4) throw new Error('PIN must contain at least 4 characters.');
    const telegramId = promptOptional_(ui, 'Telegram User ID', 'Enter the owner Telegram numeric user ID, or leave blank:');
    const now = new Date();
    appendObject_(POS.SHEETS.USERS, {
      UserID: uuid_('USR'), LoginID: loginId, Name: name,
      TelegramID: telegramId, Email: '', PINHash: hashPin_(pin),
      Role: POS.ROLES.ADMIN, BranchID: BRANCH_FEATURE.DEFAULT_BRANCH_ID, PermissionsJSON: JSON.stringify(allUserModuleKeys_()), Active: true, Language: 'en', Theme: 'auto',
      LastLoginAt: '', CreatedAt: now, UpdatedAt: now
    });
  } else {
    migrateUserLoginIds_();
    getRows_(POS.SHEETS.USERS).forEach(function(existingUser) {
      const changes = {};
      if (!String(existingUser.BranchID || '').trim()) changes.BranchID = BRANCH_FEATURE.DEFAULT_BRANCH_ID;
      if (!String(existingUser.PermissionsJSON || '').trim()) changes.PermissionsJSON = JSON.stringify(defaultPermissionsForRole_(existingUser.Role));
      if (Object.keys(changes).length) { changes.UpdatedAt = new Date(); updateRowObject_(POS.SHEETS.USERS, existingUser._row, changes); }
    });
  }

  if (getRows_(POS.SHEETS.CATEGORIES).length === 0) {
    const now = new Date();
    appendObjects_(POS.SHEETS.CATEGORIES, [
      {CategoryID:'CAT-GENERAL',NameEN:'General',NameKH:'ទូទៅ',SortOrder:1,Active:true,CreatedAt:now,UpdatedAt:now},
      {CategoryID:'CAT-DRINKS',NameEN:'Drinks',NameKH:'ភេសជ្ជៈ',SortOrder:2,Active:true,CreatedAt:now,UpdatedAt:now}
    ]);
  }

  if (getRows_(POS.SHEETS.UNITS).length === 0) {
    const now = new Date();
    appendObjects_(POS.SHEETS.UNITS, [
      {UnitID:'UNT-PIECE',NameEN:'Piece',NameKH:'ដុំ',Abbreviation:'pc',AllowDecimal:false,SortOrder:1,Active:true,CreatedAt:now,UpdatedAt:now},
      {UnitID:'UNT-CAN',NameEN:'Can',NameKH:'កំប៉ុង',Abbreviation:'can',AllowDecimal:false,SortOrder:2,Active:true,CreatedAt:now,UpdatedAt:now},
      {UnitID:'UNT-BOX',NameEN:'Box',NameKH:'ប្រអប់',Abbreviation:'box',AllowDecimal:false,SortOrder:3,Active:true,CreatedAt:now,UpdatedAt:now},
      {UnitID:'UNT-KG',NameEN:'Kilogram',NameKH:'គីឡូក្រាម',Abbreviation:'kg',AllowDecimal:true,SortOrder:4,Active:true,CreatedAt:now,UpdatedAt:now}
    ]);
  }

  // Give products without a unit the default Piece unit.
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    if (!String(product.UnitID || '').trim()) {
      updateRowObject_(POS.SHEETS.PRODUCTS, product._row, {UnitID:'UNT-PIECE',UpdatedAt:new Date()});
    }
  });

  // Initialize new customer fields without changing existing balances.
  getRows_(POS.SHEETS.CUSTOMERS).forEach(function(customer) {
    const changes = {};
    if (!String(customer.CustomerType || '').trim()) changes.CustomerType = 'RETAIL';
    if (String(customer.PaymentTermsDays == null ? '' : customer.PaymentTermsDays).trim() === '') changes.PaymentTermsDays = 30;
    if (Object.keys(changes).length) {
      changes.UpdatedAt = new Date();
      updateRowObject_(POS.SHEETS.CUSTOMERS, customer._row, changes);
    }
  });

  // Creates only missing opening FIFO lots for current stock.
  try {
    const migration = withScriptLock_(function() {
      return migrateExistingStockToFifoLotsLocked_();
    });
    report.push('FIFO opening lots created: ' + migration.created);
    if (migration.warnings && migration.warnings.length) {
      report.push('FIFO warnings: ' + migration.warnings.join(' | '));
    }
  } catch (error) {
    report.push('FIFO migration skipped: ' + error.message);
  }

  ui.alert(
    'Tiny POS Complete installed/upgraded.\n\n' +
    report.join('\n') +
    '\n\nExisting rows were not cleared.'
  );
  return report.join('\n');
}

function installPOS() {
  return installTinyPOSComplete();
}

function ensureTinyPosSheet_(ss, sheetName, requiredHeaders, report) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    report.push('Created: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function(v) { return String(v || '').trim(); })
    : [];
  const missing = requiredHeaders.filter(function(header) { return existing.indexOf(header) === -1; });

  if (missing.length) {
    const start = lastColumn + 1;
    const finalColumn = start + missing.length - 1;
    if (finalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), finalColumn - sheet.getMaxColumns());
    }
    sheet.getRange(1, start, 1, missing.length).setValues([missing]);
    report.push(sheetName + ': added ' + missing.length + ' column(s)');
  }

  if (sheet.getLastColumn() > 0) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

function migrateUserLoginIds_() {
  const users = getRows_(POS.SHEETS.USERS);
  const used = {};
  users.forEach(function(user) {
    if (user.LoginID) used[String(user.LoginID).toLowerCase()] = true;
  });

  users.forEach(function(user) {
    if (user.LoginID) return;
    let base = String(user.Name || user.UserID || 'user')
      .toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'user';
    let candidate = base;
    let n = 2;
    while (used[candidate]) candidate = base + n++;
    used[candidate] = true;
    updateRowObject_(POS.SHEETS.USERS, user._row, {LoginID:candidate, UpdatedAt:new Date()});
  });
}

function verifyTinyPOSComplete() {
  const ss = getSpreadsheet_();
  const issues = [];
  Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      issues.push(sheetName + ': MISSING SHEET');
      return;
    }
    const headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();})
      : [];
    const missing = TINY_POS_SCHEMA[sheetName].filter(function(h){return headers.indexOf(h)===-1;});
    if (missing.length) issues.push(sheetName + ': missing ' + missing.join(', '));
  });
  try {
    const fifo = checkFifoInventory();
    if (/mismatch/i.test(fifo)) issues.push(fifo);
  } catch (error) {
    issues.push('FIFO check failed: ' + error.message);
  }
  const message = issues.length ? issues.join('\n') : 'Tiny POS Complete database: OK';
  SpreadsheetApp.getUi().alert(message);
  return message;
}

function backupTinyPOSDatabase() {
  const ss = getSpreadsheet_();
  const stamp = Utilities.formatDate(new Date(), POS.TIME_ZONE, 'yyyyMMdd-HHmmss');
  const copy = DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' Backup ' + stamp);
  SpreadsheetApp.getUi().alert('Backup created:\n' + copy.getName());
  return {name: copy.getName(), id: copy.getId(), url: copy.getUrl()};
}
