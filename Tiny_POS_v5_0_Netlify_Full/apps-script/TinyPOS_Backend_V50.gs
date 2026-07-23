/**
 * Tiny POS v5.0 — Complete Apps Script backend.
 * Fresh Google Sheet + Netlify frontend + Telegram Mini App.
 * Generated as one paste-ready file; individual source files are also included.
 */


/* ==========================================================================
 * SOURCE: Config.gs
 * ========================================================================== */
/**
 * Tiny POS Complete — Google Sheets + Apps Script + Telegram Mini App.
 * Secrets are stored in Script Properties, not in this file.
 */
const POS = Object.freeze({
  VERSION: '5.0.0',
  TIME_ZONE: 'Asia/Phnom_Penh',
  SESSION_SECONDS: 21600,
  TELEGRAM_AUTH_MAX_AGE_SECONDS: 86400,
  DEFAULT_QR_EXPIRY_MINUTES: 5,
  SHEETS: Object.freeze({
    SETTINGS: 'Settings',
    USERS: 'Users',
    CATEGORIES: 'Categories',
    UNITS: 'Units',
    PRODUCTS: 'Products',
    CUSTOMERS: 'Customers',
    RECEIVABLES: 'Receivables',
    CUSTOMER_PAYMENTS: 'CustomerPayments',
    CUSTOMER_PAYMENT_ALLOCATIONS: 'CustomerPaymentAllocations',
    SUPPLIERS: 'Suppliers',
    SALES: 'Sales',
    SALE_ITEMS: 'SaleItems',
    PAYMENTS: 'Payments',
    PAYMENT_INTENTS: 'PaymentIntents',
    PENDING_INVOICES: 'PendingInvoices',
    COUPONS: 'Coupons',
    PURCHASES: 'Purchases',
    PURCHASE_ITEMS: 'PurchaseItems',
    PURCHASE_RECEIPTS: 'PurchaseReceipts',
    SUPPLIER_PAYMENTS: 'SupplierPayments',
    STOCK: 'StockMovements',
    STOCK_COUNTS: 'StockCounts',
    STOCK_COUNT_ITEMS: 'StockCountItems',
    STOCK_LOTS: 'StockLots',
    FIFO_ALLOCATIONS: 'FifoAllocations',
    RETURNS: 'Returns',
    RETURN_ITEMS: 'ReturnItems',
    REFUND_PAYMENTS: 'RefundPayments',
    RETURN_LOT_RESTORATIONS: 'ReturnLotRestorations',
    EXPENSES: 'Expenses',
    SHIFTS: 'CashShifts',
    AUDIT: 'AuditLog',
    BRANCHES: 'Branches',
    BRANCH_INVENTORY: 'BranchInventory',
    TRANSFERS: 'StockTransfers',
    TRANSFER_ITEMS: 'StockTransferItems',
    TRANSFER_ALLOCATIONS: 'StockTransferAllocations',
    SUPPLIER_RETURNS: 'SupplierReturns',
    SUPPLIER_RETURN_ITEMS: 'SupplierReturnItems',
    BACKUPS: 'Backups'
  }),
  ROLES: Object.freeze({
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    CASHIER: 'CASHIER',
    STOCK: 'STOCK_CONTROLLER',
    ACCOUNTANT: 'ACCOUNTANT'
  }),
  SALE_STATUS: Object.freeze({
    COMPLETED: 'COMPLETED',
    VOID: 'VOID',
    RETURNED: 'RETURNED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
    REFUNDED: 'REFUNDED'
  }),
  PAYMENT_STATUS: Object.freeze({
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
    PARTIAL: 'PARTIAL',
    UNPAID: 'UNPAID'
  })
});

/**
 * Base headers retained for compatibility with older installer functions.
 * TinyPOSSetup.gs contains the complete final schema and safely adds missing columns.
 */
const HEADERS = Object.freeze({
  Settings: ['Key', 'Value', 'Type', 'UpdatedAt'],
  Users: ['UserID', 'LoginID', 'Name', 'TelegramID', 'Email', 'PINHash', 'Role', 'BranchID', 'PermissionsJSON', 'Active', 'Language', 'Theme', 'ThemeColor', 'LastLoginAt', 'CreatedAt', 'UpdatedAt'],
  Categories: ['CategoryID', 'NameEN', 'NameKH', 'SortOrder', 'Active', 'CreatedAt', 'UpdatedAt'],
  Units: ['UnitID', 'NameEN', 'NameKH', 'Abbreviation', 'AllowDecimal', 'SortOrder', 'Active', 'CreatedAt', 'UpdatedAt'],
  Products: ['ProductID', 'Barcode', 'SKU', 'NameEN', 'NameKH', 'CategoryID', 'UnitID', 'CostUSD', 'PriceUSD', 'PriceKHR', 'CurrentStock', 'LowStockLevel', 'ImageURL', 'ImageFileID', 'Active', 'CreatedAt', 'UpdatedAt'],
  Customers: ['CustomerID', 'Name', 'CustomerType', 'Phone', 'Email', 'Address', 'Notes', 'Points', 'CreditLimitUSD', 'CreditBalanceUSD', 'PaymentTermsDays', 'Active', 'CreatedAt', 'UpdatedAt'],
  Receivables: ['ReceivableID','CustomerID','SaleID','InvoiceNo','InvoiceDate','DueDate','OriginalAmountUSD','PaidUSD','BalanceUSD','Status','CreatedAt','UpdatedAt'],
  CustomerPayments: ['CustomerPaymentID','CustomerID','DateTime','Method','Currency','Amount','AmountUSD','Reference','ShiftID','UserID','Notes','CreatedAt'],
  CustomerPaymentAllocations: ['AllocationID','CustomerPaymentID','ReceivableID','SaleID','AmountUSD','CreatedAt'],
  Suppliers: ['SupplierID', 'Name', 'ContactPerson', 'Phone', 'Email', 'Address', 'TaxNumber', 'Notes', 'Active', 'CreatedAt', 'UpdatedAt'],
  Sales: ['SaleID', 'InvoiceNo', 'DateTime', 'CustomerID', 'CustomerName', 'CustomerType', 'SubtotalUSD', 'DiscountUSD', 'TaxUSD', 'TotalUSD', 'TotalKHR', 'ExchangeRate', 'PaymentMethod', 'PaymentStatus', 'AmountPaidUSD', 'CreditAmountUSD', 'DueDate', 'PaymentTermsDays', 'CreditStatus', 'Status', 'CashierID', 'CashierName', 'ShiftID', 'Notes', 'CreatedAt', 'ManualDiscountType', 'ManualDiscountValue', 'ManualDiscountPercent', 'ManualDiscountUSD', 'CouponCode', 'CouponDiscountUSD', 'ReturnedQty', 'RefundedUSD', 'ReturnStatus', 'LastReturnAt'],
  SaleItems: ['SaleItemID', 'SaleID', 'ProductID', 'Barcode', 'ProductName', 'Qty', 'UnitID', 'UnitName', 'UnitCostUSD', 'UnitPriceUSD', 'DiscountUSD', 'LineTotalUSD', 'AllocatedSaleDiscountUSD', 'NetRevenueUSD', 'CostTotalUSD', 'GrossProfitUSD', 'ReturnedQty', 'RefundedUSD', 'RestockedQty', 'CostRestoredUSD'],
  Payments: ['PaymentID', 'SaleID', 'Method', 'Currency', 'Amount', 'Reference', 'KHQRMD5', 'BankHash', 'Status', 'ReceivedBy', 'CreatedAt'],
  PaymentIntents: ['IntentID', 'InvoiceNo', 'UserID', 'CustomerID', 'CartJSON', 'SubtotalUSD', 'DiscountUSD', 'TaxUSD', 'TotalUSD', 'TotalKHR', 'ExchangeRate', 'Currency', 'Amount', 'Status', 'KHQRMD5', 'QRText', 'BankHash', 'CreatedAt', 'ExpiresAt', 'SaleID'],
  Purchases: ['PurchaseID', 'PurchaseNo', 'SupplierID', 'DateTime', 'TotalUSD', 'Status', 'UserID', 'CreatedAt'],
  PurchaseItems: ['PurchaseItemID', 'PurchaseID', 'ProductID', 'UnitID', 'UnitName', 'Qty', 'UnitCostUSD', 'LineTotalUSD'],
  StockMovements: ['MovementID', 'DateTime', 'ProductID', 'Type', 'QtyIn', 'QtyOut', 'BalanceAfter', 'ReferenceType', 'ReferenceID', 'UserID', 'Note'],
  StockCounts: ['CountID','CountNo','CountType','CategoryID','CategoryName','Status','StartedAt','StartedByID','StartedByName','SubmittedAt','SubmittedByID','ApprovedAt','ApprovedByID','AppliedAt','AppliedByID','Notes','TotalItems','CountedItems','VarianceItems','VarianceQty','VarianceValueUSD','CreatedAt','UpdatedAt'],
  StockCountItems: ['CountItemID','CountID','ProductID','Barcode','SKU','ProductName','CategoryID','UnitID','UnitName','SnapshotQty','CurrentSystemQty','Counted','PhysicalQty','VarianceQty','UnitCostUSD','VarianceValueUSD','Reason','Note','CountedAt','CountedByID','MovementDuringCount','NeedsRecount','AppliedAdjustmentID','CreatedAt','UpdatedAt'],
  Returns: ['ReturnID', 'SaleID', 'InvoiceNo', 'DateTime', 'AmountUSD', 'Reason', 'UserID', 'Status', 'DamageImageURL', 'DamageImagePublicID'],
  Expenses: ['ExpenseID', 'DateTime', 'BranchID', 'Category', 'AmountUSD', 'Remark', 'UserID', 'ShiftID', 'CreatedAt'],
  CashShifts: ['ShiftID', 'UserID', 'OpenAt', 'OpeningUSD', 'OpeningKHR', 'CloseAt', 'ClosingUSD', 'ClosingKHR', 'ExpectedUSD', 'ExpectedKHR', 'DifferenceUSD', 'DifferenceKHR', 'Status'],
  AuditLog: ['AuditID', 'DateTime', 'UserID', 'Action', 'Entity', 'EntityID', 'DetailsJSON']
});

const DEFAULT_SETTINGS = Object.freeze({
  SHOP_NAME_EN: 'Tiny Shop',
  SHOP_NAME_KH: 'ហាង តៃនី',
  SHOP_PHONE: '',
  SHOP_ADDRESS_EN: 'Phnom Penh, Cambodia',
  SHOP_ADDRESS_KH: 'ភ្នំពេញ កម្ពុជា',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'auto',
  EXCHANGE_RATE: '4100',
  TAX_RATE: '0',
  RECEIPT_FOOTER_EN: 'Thank you for your purchase!',
  RECEIPT_FOOTER_KH: 'សូមអរគុណសម្រាប់ការទិញទំនិញ!',
  KHQR_TYPE: 'INDIVIDUAL',
  BAKONG_ACCOUNT_ID: '',
  KHQR_MERCHANT_NAME: '',
  KHQR_MERCHANT_CITY: 'PHNOM PENH',
  KHQR_MERCHANT_ID: '',
  KHQR_ACQUIRING_BANK: '',
  KHQR_CURRENCY: 'USD',
  KHQR_MOBILE_NUMBER: '',
  KHQR_STORE_LABEL: '',
  KHQR_TERMINAL_LABEL: 'POS-1',
  KHQR_MCC: '5999',
  QR_EXPIRY_MINUTES: String(POS.DEFAULT_QR_EXPIRY_MINUTES),
  BANK_AUTO_VERIFY: 'FALSE',
  BANK_MANUAL_CONFIRM: 'FALSE',
  IMAGE_FOLDER_NAME: 'Tiny POS Product Images',
  DEFAULT_RECEIPT_PAPER: '80MM',
  THEME_COLOR: 'DEFAULT',
  STOCK_COUNT_RECOUNT_QTY: '5',
  STOCK_COUNT_RECOUNT_PERCENT: '10',
  AUTO_BACKUP_ENABLED: 'FALSE',
  AUTO_BACKUP_FREQUENCY: 'DAILY',
  AUTO_BACKUP_HOUR: '2',
  BACKUP_RETENTION_COUNT: '30'
});


/* ==========================================================================
 * SOURCE: PermissionAccess.gs
 * ========================================================================== */
/**
 * Tiny POS v5.0 exact role and individual module permissions.
 *
 * A saved PermissionsJSON array is the exact list for that user. An empty
 * saved array intentionally means no modules. Role defaults are used only
 * when PermissionsJSON is missing/blank/invalid.
 */
const USER_MODULES = Object.freeze([
  {key:'DASHBOARD', label:'Dashboard', labelKH:'ផ្ទាំងគ្រប់គ្រង'},
  {key:'POS', label:'New Sale', labelKH:'លក់ថ្មី'},
  {key:'PRODUCTS', label:'Products', labelKH:'ទំនិញ'},
  {key:'CUSTOMERS', label:'Customers', labelKH:'អតិថិជន'},
  {key:'CREDIT', label:'Credit Accounts', labelKH:'គណនីឥណទាន'},
  {key:'INVENTORY', label:'Inventory', labelKH:'ស្តុក'},
  {key:'STOCK_COUNT', label:'Stock Count', labelKH:'រាប់ស្តុក'},
  {key:'PURCHASES', label:'Purchases', labelKH:'ការទិញចូល'},
  {key:'SUPPLIER_RETURNS', label:'Supplier Returns', labelKH:'ត្រឡប់ទៅអ្នកផ្គត់ផ្គង់'},
  {key:'TRANSFERS', label:'Stock Transfers', labelKH:'ផ្ទេរស្តុក'},
  {key:'RETURNS', label:'Returns & Refunds', labelKH:'ត្រឡប់ និងសងប្រាក់'},
  {key:'REPORTS', label:'Reports', labelKH:'របាយការណ៍'},
  {key:'OPERATIONS', label:'Cash & Expenses', labelKH:'សាច់ប្រាក់ និងចំណាយ'},
  {key:'USERS', label:'Users', labelKH:'អ្នកប្រើប្រាស់'},
  {key:'SETTINGS', label:'Settings', labelKH:'ការកំណត់'},
  {key:'BACKUP', label:'Backup & Restore', labelKH:'បម្រុងទុក និងស្តារ'},
  {key:'BRANCHES', label:'Branches', labelKH:'សាខា'}
]);

function allUserModuleKeys_() {
  return USER_MODULES.map(function(module) { return module.key; });
}

function defaultPermissionsForRole_(role) {
  const value = String(role || '').trim().toUpperCase();
  if (value === POS.ROLES.ADMIN) return allUserModuleKeys_();
  if (value === POS.ROLES.MANAGER) {
    return allUserModuleKeys_().filter(function(key) { return key !== 'USERS'; });
  }
  if (value === POS.ROLES.CASHIER) {
    return ['DASHBOARD','POS','CUSTOMERS','RETURNS','OPERATIONS','SETTINGS'];
  }
  if (value === POS.ROLES.STOCK) {
    return ['DASHBOARD','PRODUCTS','INVENTORY','STOCK_COUNT','PURCHASES','SUPPLIER_RETURNS','TRANSFERS','SETTINGS'];
  }
  if (value === POS.ROLES.ACCOUNTANT) {
    return ['DASHBOARD','CUSTOMERS','CREDIT','PURCHASES','SUPPLIER_RETURNS','RETURNS','REPORTS','OPERATIONS','SETTINGS'];
  }
  return ['DASHBOARD','POS'];
}

function cleanPermissionList_(list) {
  const valid = allUserModuleKeys_();
  const seen = {};
  return (Array.isArray(list) ? list : [])
    .map(function(key) { return String(key || '').trim().toUpperCase(); })
    .filter(function(key) {
      if (!key || valid.indexOf(key) === -1 || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function parsePermissionValue_(value) {
  if (Array.isArray(value)) return {saved:true, list:value};
  if (value === null || value === undefined) return {saved:false, list:[]};
  const text = String(value).trim();
  if (!text) return {saved:false, list:[]};
  const parsed = safeJsonParse_(text, null);
  return Array.isArray(parsed)
    ? {saved:true, list:parsed}
    : {saved:false, list:[]};
}

function normalizePermissions_(value, role) {
  const parsed = parsePermissionValue_(value);
  return cleanPermissionList_(
    parsed.saved ? parsed.list : defaultPermissionsForRole_(role)
  );
}

function getUserPermissions_(user) {
  if (!user) return [];
  return normalizePermissions_(user.PermissionsJSON, user.Role);
}

function userHasPermission_(user, permission) {
  if (!user) return false;
  const key = String(permission || '').trim().toUpperCase();
  return Boolean(key) && getUserPermissions_(user).indexOf(key) !== -1;
}

function requirePermission_(user, permission) {
  if (!userHasPermission_(user, permission)) {
    throw new Error('You do not have permission to open or use this function.');
  }
  return user;
}

function requirePermissionByToken_(sessionToken, permission) {
  return requirePermission_(requireSession_(sessionToken), permission);
}

function listPermissionOptions(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  return {
    modules: USER_MODULES,
    branches: listBranchesForUserManagement_(user),
    roleDefaults: {
      ADMIN: defaultPermissionsForRole_(POS.ROLES.ADMIN),
      MANAGER: defaultPermissionsForRole_(POS.ROLES.MANAGER),
      CASHIER: defaultPermissionsForRole_(POS.ROLES.CASHIER),
      STOCK_CONTROLLER: defaultPermissionsForRole_(POS.ROLES.STOCK),
      ACCOUNTANT: defaultPermissionsForRole_(POS.ROLES.ACCOUNTANT)
    }
  };
}

function getMyExactPermissionSnapshot(sessionToken) {
  const user = requireSession_(sessionToken);
  return {
    success: true,
    role: String(user.Role || ''),
    permissions: getUserPermissions_(user),
    version: 'V5_EXACT_PERMISSIONS'
  };
}

function deleteUser(sessionToken, userId) {
  const current = requireSession_(sessionToken);
  requireRole_(current, [POS.ROLES.ADMIN]);
  const target = findRowBy_(POS.SHEETS.USERS, 'UserID', userId);
  if (!target) throw new Error('User not found.');
  if (String(target.UserID) === String(current.UserID)) {
    throw new Error('You cannot delete the user account that is currently signed in.');
  }
  const hasHistory = [
    [POS.SHEETS.SALES, 'CashierID'],
    [POS.SHEETS.PURCHASES, 'UserID'],
    [POS.SHEETS.RETURNS, 'UserID'],
    [POS.SHEETS.EXPENSES, 'UserID'],
    [POS.SHEETS.STOCK, 'UserID']
  ].some(function(pair) {
    return getRows_(pair[0]).some(function(row) {
      return String(row[pair[1]] || '') === String(userId);
    });
  });
  if (hasHistory) {
    updateRowObject_(POS.SHEETS.USERS, target._row, {Active:false, UpdatedAt:new Date()});
    audit_(current.UserID, 'DEACTIVATE_USER_WITH_HISTORY', 'User', userId, {});
    return {success:true, deactivated:true};
  }
  getSheet_(POS.SHEETS.USERS).deleteRow(target._row);
  audit_(current.UserID, 'DELETE_USER', 'User', userId, {name:target.Name});
  return {success:true, deleted:true};
}


/* ==========================================================================
 * SOURCE: Database.gs
 * ========================================================================== */
function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('SPREADSHEET_ID is not configured. Run installPOS() from the bound spreadsheet.');
  props.setProperty('SPREADSHEET_ID', active.getId());
  return active;
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run installPOS().');
  return sheet;
}

function ensureSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const existing = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];

  const needsHeader = headers.some(function(header, index) {
    return existing[index] !== header;
  });

  if (needsHeader) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1d4ed8')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function getRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return values.map(function(row, index) {
    const obj = {_row: index + 2};
    headers.forEach(function(header, col) { obj[header] = row[col]; });
    return obj;
  });
}

function appendObject_(sheetName, object) {
  return appendObjects_(sheetName, [object]);
}

function appendObjects_(sheetName, objects) {
  if (!objects || !objects.length) return;
  const sheet = getSheet_(sheetName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = objects.map(function(object) {
    return headers.map(function(header) {
      return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '';
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateRowObject_(sheetName, rowNumber, changes) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function(header, col) {
    if (Object.prototype.hasOwnProperty.call(changes, header)) row[col] = changes[header];
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function findRowBy_(sheetName, field, value) {
  const normalized = String(value);
  return getRows_(sheetName).find(function(row) {
    return String(row[field]) === normalized;
  }) || null;
}

function getSettings_() {
  const result = {};
  getRows_(POS.SHEETS.SETTINGS).forEach(function(row) {
    result[String(row.Key)] = row.Value;
  });
  return result;
}

function setSetting_(key, value, type) {
  const existing = findRowBy_(POS.SHEETS.SETTINGS, 'Key', key);
  const now = new Date();
  if (existing) {
    updateRowObject_(POS.SHEETS.SETTINGS, existing._row, {
      Value: String(value),
      Type: type || existing.Type || 'STRING',
      UpdatedAt: now
    });
  } else {
    appendObject_(POS.SHEETS.SETTINGS, {
      Key: key,
      Value: String(value),
      Type: type || 'STRING',
      UpdatedAt: now
    });
  }
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function audit_(userId, action, entity, entityId, details) {
  appendObject_(POS.SHEETS.AUDIT, {
    AuditID: uuid_('AUD'),
    DateTime: new Date(),
    UserID: userId || '',
    Action: action,
    Entity: entity,
    EntityID: entityId || '',
    DetailsJSON: JSON.stringify(details || {})
  });
}


/* ==========================================================================
 * SOURCE: Utils.gs
 * ========================================================================== */
function uuid_(prefix) {
  return (prefix ? prefix + '-' : '') + Utilities.getUuid();
}

function nowIso_() {
  return Utilities.formatDate(new Date(), POS.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function dateKey_(date) {
  return Utilities.formatDate(date || new Date(), POS.TIME_ZONE, 'yyyyMMdd');
}

function roundMoney_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function number_(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function bool_(value) {
  return String(value).toUpperCase() === 'TRUE' || value === true || value === 1;
}

function bytesToHex_(bytes) {
  return bytes.map(function(byte) {
    return ('0' + ((byte & 0xff).toString(16))).slice(-2);
  }).join('');
}

function sha256Hex_(value) {
  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ));
}

function safeJsonParse_(text, fallback) {
  try { return JSON.parse(text); } catch (error) { return fallback; }
}

function requireRole_(user, allowedRoles) {
  if (!user || allowedRoles.indexOf(user.Role) === -1) {
    throw new Error('You do not have permission for this action.');
  }
}

function publicUser_(user) {
  const branchId = getUserBranchId_(user);
  const branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', branchId);
  return {
    userId: String(user.UserID),
    loginId: String(user.LoginID || ''),
    name: String(user.Name),
    telegramId: String(user.TelegramID || ''),
    email: String(user.Email || ''),
    role: String(user.Role),
    branchId: branchId,
    branchName: branch ? String(branch.NameEN || branch.NameKH || branch.Code || branchId) : branchId,
    permissions: getUserPermissions_(user),
    active: bool_(user.Active),
    language: String(user.Language || 'en'),
    theme: String(user.Theme || 'auto'),
    themeColor: String(user.ThemeColor || 'DEFAULT').toUpperCase(),
    lastLoginAt: user.LastLoginAt ? new Date(user.LastLoginAt).toISOString() : ''
  };
}

function sanitizeText_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 255);
}

function parseDataUrl_(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');
  return {mimeType: match[1], bytes: Utilities.base64Decode(match[2])};
}


/* ==========================================================================
 * SOURCE: BranchScopeV37.gs
 * ========================================================================== */
/** Tiny POS v3.7 branch access, branch-aware inventory, and report filters. */
function canManageAllBranches_(user) {
  return [POS.ROLES.ADMIN, POS.ROLES.MANAGER].indexOf(String(user && user.Role)) >= 0;
}

function branchRowsForUser_(user, includeInactive) {
  const own = getUserBranchId_(user);
  return getRows_(POS.SHEETS.BRANCHES)
    .filter(function(row) {
      if (!includeInactive && !bool_(row.Active)) return false;
      return canManageAllBranches_(user) || String(row.BranchID) === String(own);
    })
    .sort(function(a,b){return String(a.Code||a.NameEN||'').localeCompare(String(b.Code||b.NameEN||''));});
}

function resolveAccessibleBranchId_(user, requestedBranchId, allowAll) {
  let requested = sanitizeText_(requestedBranchId, 80);
  if (canManageAllBranches_(user)) {
    if (!requested && allowAll) return '';
    requested = requested || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  } else {
    requested = getUserBranchId_(user);
  }
  const branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', requested);
  if (!branch || !bool_(branch.Active)) throw new Error('Selected branch is unavailable.');
  return String(branch.BranchID);
}

function requireBranchAccess_(user, branchId) {
  const resolved = resolveAccessibleBranchId_(user, branchId, false);
  if (!canManageAllBranches_(user) && String(resolved) !== String(getUserBranchId_(user))) {
    throw new Error('You cannot access another branch.');
  }
  return resolved;
}

function branchPublicMap_() {
  const map = {};
  getRows_(POS.SHEETS.BRANCHES).forEach(function(row){map[String(row.BranchID)] = branchToPublic_(row);});
  return map;
}

function getBranchFilterOptionsV37(sessionToken) {
  const user = requireSession_(sessionToken);
  const branches = branchRowsForUser_(user, false).map(branchToPublic_);
  const allowedBranchIds = {};
  branches.forEach(function(branch){allowedBranchIds[branch.branchId] = true;});
  const users = getRows_(POS.SHEETS.USERS)
    .filter(function(row){return bool_(row.Active) && (canManageAllBranches_(user) || allowedBranchIds[getUserBranchId_(row)]);})
    .sort(function(a,b){return String(a.Name||a.LoginID).localeCompare(String(b.Name||b.LoginID));})
    .map(function(row){
      const branchId = getUserBranchId_(row);
      const branch = findRowBy_(POS.SHEETS.BRANCHES,'BranchID',branchId);
      return {userId:String(row.UserID),name:String(row.Name||row.LoginID||row.UserID),role:String(row.Role||''),branchId:branchId,branchName:branch?String(branch.NameEN||branch.NameKH||branch.Code):branchId};
    });
  return {
    canSelectAllBranches: canManageAllBranches_(user),
    defaultBranchId: getUserBranchId_(user),
    branches: branches,
    users: users
  };
}

function inventoryProductPublicV37_(product, branchId, branchName, quantity, averageCostUSD, unitMap) {
  const item = productToPublic_(product, unitMap);
  item.branchId = branchId;
  item.branchName = branchName;
  item.currentStock = Math.round(number_(quantity) * 1000) / 1000;
  item.costUSD = roundMoney_(averageCostUSD);
  item.inventoryValueUSD = roundMoney_(item.currentStock * item.costUSD);
  return item;
}

function getInventoryModuleDataV37(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'INVENTORY');
  filters = filters || {};
  const requested = resolveAccessibleBranchId_(user, filters.branchId, true);
  const branchRows = branchRowsForUser_(user, false);
  const branchMap = {};
  branchRows.forEach(function(row){branchMap[String(row.BranchID)] = branchToPublic_(row);});
  const unitMap = getUnitMap_();
  const products = getRows_(POS.SHEETS.PRODUCTS);
  const rows = [];

  products.forEach(function(product) {
    if (requested) {
      const qty = getBranchStockQty_(requested, product.ProductID);
      const cost = getBranchAverageCost_(requested, product.ProductID);
      rows.push(inventoryProductPublicV37_(product, requested, (branchMap[requested]||{}).nameEN || requested, qty, cost, unitMap));
      return;
    }
    let totalQty = 0;
    let totalValue = 0;
    branchRows.forEach(function(branch) {
      const qty = getBranchStockQty_(branch.BranchID, product.ProductID);
      const cost = getBranchAverageCost_(branch.BranchID, product.ProductID);
      totalQty += qty;
      totalValue += qty * cost;
    });
    const average = totalQty > 0 ? totalValue / totalQty : number_(product.CostUSD);
    rows.push(inventoryProductPublicV37_(product, '', 'All branches', totalQty, average, unitMap));
  });

  return {
    canSelectAllBranches: canManageAllBranches_(user),
    selectedBranchId: requested,
    defaultBranchId: getUserBranchId_(user),
    branches: branchRows.map(branchToPublic_),
    rows: rows
  };
}

function getTransferProductOptionsV37(sessionToken, branchId, query) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'TRANSFERS');
  branchId = requireBranchAccess_(user, branchId);
  query = sanitizeText_(query,120).toLowerCase();
  const units = getUnitMap_();
  return getRows_(POS.SHEETS.PRODUCTS)
    .filter(function(row){
      if (!bool_(row.Active)) return false;
      const hay = [row.NameEN,row.NameKH,row.SKU,row.Barcode].join(' ').toLowerCase();
      return !query || hay.indexOf(query) >= 0;
    })
    .map(function(row){
      const p = productToPublic_(row,units);
      p.availableQty = getBranchStockQty_(branchId,row.ProductID);
      return p;
    })
    .filter(function(p){return p.availableQty > 0.0005;})
    .sort(function(a,b){return (b.availableQty-a.availableQty)||String(a.nameEN||a.nameKH).localeCompare(String(b.nameEN||b.nameKH));})
    .slice(0,40);
}


/* ==========================================================================
 * SOURCE: TinyPOSSetup.gs
 * ========================================================================== */
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


/* ==========================================================================
 * SOURCE: Setup.gs
 * ========================================================================== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tiny POS Setup')
    .addItem('1. Install / Upgrade Complete POS', 'installTinyPOSComplete')
    .addItem('2. Verify Complete POS', 'verifyTinyPOSComplete')
    .addSeparator()
    .addItem('3. Configure Telegram Bot', 'configureTelegram')
    .addItem('4. Connect Telegram + Blue Button', 'setupTelegramDeployment')
    .addItem('5. Check Telegram Connection', 'checkTelegramConnection')
    .addSeparator()
    .addItem('6. Configure Cloudinary Images', 'configureCloudinary')
    .addItem('7. Check Cloudinary Images', 'checkCloudinaryConfiguration')
    .addSeparator()
    .addItem('8. Configure Bakong Token', 'configureBakongToken')
    .addItem('9. Backup Database', 'backupTinyPOSDatabase')
    .addItem('Add Demo Products', 'seedDemoProducts')
    .addToUi();
}


function configureTelegram() {
  const ui = SpreadsheetApp.getUi();
  const token = promptRequired_(ui, 'Telegram bot token', 'Paste the token received from @BotFather:');
  PropertiesService.getScriptProperties().setProperty('BOT_TOKEN', token);
  ui.alert('Telegram token saved securely in Script Properties.');
}

function configureBakongToken() {
  const ui = SpreadsheetApp.getUi();
  const token = promptOptional_(ui, 'Bakong Open API token', 'Paste the Bakong Open API access token. Leave blank to disable automatic bank-payment verification:');
  const props = PropertiesService.getScriptProperties();
  if (token) props.setProperty('BAKONG_API_TOKEN', token);
  else props.deleteProperty('BAKONG_API_TOKEN');

  const baseUrl = promptOptional_(ui, 'Bakong API base URL', 'Production default: https://api-bakong.nbc.gov.kh');
  props.setProperty('BAKONG_API_BASE_URL', baseUrl || 'https://api-bakong.nbc.gov.kh');
  setSetting_('BANK_AUTO_VERIFY', token ? 'TRUE' : 'FALSE', 'BOOLEAN');
  ui.alert(token ? 'Bakong token saved; automatic verification enabled.' : 'Automatic verification disabled.');
}

function setupTelegramDeployment() {
  const ui = SpreadsheetApp.getUi();
  const detectedUrl = ScriptApp.getService().getUrl() || '';
  const response = ui.prompt(
    'Published Web App URL',
    'Paste the published Web App URL ending in /exec.\n\n' +
    'Do NOT paste a URL ending in /dev.\n' +
    'Do NOT paste the Apps Script editor URL.\n\n' +
    (detectedUrl ? 'Detected URL: ' + detectedUrl : ''),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const url = normalizePublishedWebAppUrl_(response.getResponseText());

  // Verify that the URL is publicly reachable before saving it in Telegram.
  const testResponse = UrlFetchApp.fetch(url, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = testResponse.getResponseCode();
  if (status < 200 || status >= 400) {
    throw new Error(
      'The Web App URL is not publicly reachable. HTTP status: ' + status +
      '. Redeploy with Execute as: Me and Who has access: Anyone.'
    );
  }

  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
  setTelegramWebhook_();
  setTelegramMenuButton_();

  const info = telegramApi_('getWebhookInfo', {});
  ui.alert(
    'Telegram connected successfully.\n\n' +
    'Mini App URL:\n' + url + '\n\n' +
    'Webhook URL:\n' + (info.url || '(empty)') + '\n\n' +
    'Pending updates: ' + (info.pending_update_count || 0) + '\n' +
    'Last error: ' + (info.last_error_message || 'None')
  );
}

function checkTelegramConnection() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const appUrl = props.getProperty('WEB_APP_URL') || '(not saved)';
  const info = telegramApi_('getWebhookInfo', {});
  const menu = telegramApi_('getChatMenuButton', {});

  ui.alert(
    'Saved Mini App URL:\n' + appUrl + '\n\n' +
    'Telegram webhook URL:\n' + (info.url || '(empty)') + '\n\n' +
    'Pending updates: ' + (info.pending_update_count || 0) + '\n' +
    'Last error date: ' + (info.last_error_date || 'None') + '\n' +
    'Last error message: ' + (info.last_error_message || 'None') + '\n\n' +
    'Menu type: ' + (menu.type || 'unknown') + '\n' +
    'Menu text: ' + (menu.text || '') + '\n' +
    'Menu URL: ' + (menu.web_app && menu.web_app.url ? menu.web_app.url : '')
  );
}

function seedDemoProducts() {
  const existing = getRows_(POS.SHEETS.PRODUCTS);
  if (existing.length) throw new Error('Products sheet is not empty. Demo data was not added.');
  const now = new Date();
  appendObjects_(POS.SHEETS.PRODUCTS, [
    {ProductID: 'PRD-DEMO-001', Barcode: '885000000001', SKU: 'COKE-330', NameEN: 'Coca-Cola 330ml', NameKH: 'កូកាកូឡា 330ml', CategoryID: 'CAT-DRINKS', UnitID: 'UNT-CAN', CostUSD: 0.45, PriceUSD: 0.75, PriceKHR: 3100, CurrentStock: 50, LowStockLevel: 10, ImageURL: '', ImageFileID: '', Active: true, CreatedAt: now, UpdatedAt: now},
    {ProductID: 'PRD-DEMO-002', Barcode: '885000000002', SKU: 'WATER-500', NameEN: 'Water 500ml', NameKH: 'ទឹកសុទ្ធ 500ml', CategoryID: 'CAT-DRINKS', UnitID: 'UNT-PIECE', CostUSD: 0.15, PriceUSD: 0.30, PriceKHR: 1200, CurrentStock: 100, LowStockLevel: 20, ImageURL: '', ImageFileID: '', Active: true, CreatedAt: now, UpdatedAt: now}
  ]);
  withScriptLock_(function() {
    createOpeningStockLotLocked_('PRD-DEMO-001', 50, 0.45, 'SYSTEM', 'Demo opening stock');
    createOpeningStockLotLocked_('PRD-DEMO-002', 100, 0.15, 'SYSTEM', 'Demo opening stock');
  });
  SpreadsheetApp.getUi().alert('Demo products and FIFO opening lots added.');
}

function promptRequired_(ui, title, message) {
  const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) throw new Error('Setup cancelled.');
  const value = response.getResponseText().trim();
  if (!value) throw new Error(title + ' is required.');
  return value;
}

function promptOptional_(ui, title, message) {
  const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return '';
  return response.getResponseText().trim();
}


/* ==========================================================================
 * SOURCE: Auth.gs
 * ========================================================================== */
function hashPin_(pin) {
  const salt = PropertiesService.getScriptProperties().getProperty('PASSWORD_SALT') || '';
  return sha256Hex_(salt + '|' + String(pin));
}

function createSession_(user) {
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('SESSION:' + token, String(user.UserID), POS.SESSION_SECONDS);
  return token;
}

function getSessionUser_(sessionToken) {
  if (!sessionToken) return null;
  const userId = CacheService.getScriptCache().get('SESSION:' + sessionToken);
  if (!userId) return null;
  const user = findRowBy_(POS.SHEETS.USERS, 'UserID', userId);
  if (!user || !bool_(user.Active)) return null;
  return user;
}

function requireSession_(sessionToken) {
  const user = getSessionUser_(sessionToken);
  if (!user) throw new Error('Your session expired. Please sign in again.');
  return user;
}

function loginWithCredentials(loginId, pin) {
  const identifier = sanitizeText_(loginId, 120).toLowerCase();
  if (!identifier) throw new Error('Staff ID is required.');
  const pinHash = hashPin_(String(pin || ''));
  const cache = CacheService.getScriptCache();
  const failKey = 'LOGIN_FAIL:' + sha256Hex_(identifier + '|' + pinHash).slice(0, 24);
  const failures = number_(cache.get(failKey), 0);

  if (failures >= 5) {
    throw new Error('Too many failed attempts. Wait 5 minutes and try again.');
  }

  const users = getRows_(POS.SHEETS.USERS);
  const user = users.find(function(row) {
    if (!bool_(row.Active) || String(row.PINHash || '') !== pinHash) return false;
    return [row.LoginID, row.UserID, row.Email, row.Name]
      .map(function(v) { return String(v || '').toLowerCase(); })
      .indexOf(identifier) >= 0;
  });

  if (!user) {
    cache.put(failKey, String(failures + 1), 300);
    throw new Error('Invalid staff ID or PIN.');
  }

  cache.remove(failKey);
  const now = new Date();
  updateRowObject_(POS.SHEETS.USERS, user._row, {LastLoginAt: now, UpdatedAt: now});
  user.LastLoginAt = now;
  const token = createSession_(user);
  audit_(user.UserID, 'LOGIN_CREDENTIALS', 'User', user.UserID, {loginId: identifier});
  return {sessionToken: token, user: publicUser_(user)};
}

function loginWithPin(pin) {
  throw new Error('Enter your Staff ID and PIN.');
}


function bootstrap(initData, sessionToken) {
  let user = getSessionUser_(sessionToken);
  let token = sessionToken || '';

  if (!user && initData) {
    const telegram = validateTelegramInitData_(initData);
    user = getRows_(POS.SHEETS.USERS).find(function(row) {
      return bool_(row.Active) && String(row.TelegramID) === String(telegram.user.id);
    }) || null;

    if (!user) {
      return {
        authenticated: false,
        telegramUser: {
          id: String(telegram.user.id),
          name: [telegram.user.first_name, telegram.user.last_name].filter(Boolean).join(' '),
          username: telegram.user.username || ''
        },
        message: 'This Telegram account is not registered in the Users sheet.'
      };
    }
    const loginAt = new Date();
    updateRowObject_(POS.SHEETS.USERS, user._row, {LastLoginAt: loginAt, UpdatedAt: loginAt});
    user.LastLoginAt = loginAt;
    token = createSession_(user);
    audit_(user.UserID, 'LOGIN_TELEGRAM', 'User', user.UserID, {telegramId: String(telegram.user.id)});
  }

  if (!user) return {authenticated: false};
  return buildBootstrapResponse_(user, token);
}

function refreshAppData(sessionToken) {
  const user = requireSession_(sessionToken);
  return buildBootstrapResponse_(user, sessionToken);
}

function buildBootstrapResponse_(user, token) {
  return {
    authenticated: true,
    sessionToken: token,
    user: publicUser_(user),
    settings: getPublicSettings_(),
    categories: listActiveCategories_(),
    units: listActiveUnits_(),
    products: listProductsForBranchV38_(user, getUserBranchId_(user)),
    customers: listActiveCustomers_(),
    dashboard: getDashboardForBranchV38_(user, getUserBranchId_(user)),
    branchContext: getBranchContextV38_(user)
  };
}

function validateTelegramInitData_(initData) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token) throw new Error('Telegram bot token is not configured.');

  const params = {};
  String(initData).split('&').forEach(function(part) {
    const pair = part.split('=');
    const key = decodeURIComponent(pair.shift() || '');
    const rawValue = pair.join('=');
    params[key] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
  });

  const receivedHash = params.hash;
  if (!receivedHash) throw new Error('Telegram authentication hash is missing.');

  const dataCheckString = Object.keys(params)
    .filter(function(key) { return key !== 'hash'; })
    .sort()
    .map(function(key) { return key + '=' + params[key]; })
    .join('\n');

  const secretKey = Utilities.computeHmacSha256Signature(
    token,
    'WebAppData',
    Utilities.Charset.UTF_8
  );
  const calculatedHash = bytesToHex_(Utilities.computeHmacSha256Signature(
    dataCheckString,
    secretKey
  ));

  if (calculatedHash !== String(receivedHash).toLowerCase()) {
    throw new Error('Invalid Telegram Mini App authentication data.');
  }

  const authDate = Number(params.auth_date || 0);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (!authDate || age < -60 || age > POS.TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    throw new Error('Telegram login data is expired. Close and reopen the Mini App.');
  }

  const user = safeJsonParse_(params.user, null);
  if (!user || !user.id) throw new Error('Telegram user information is missing.');
  return {user: user, queryId: params.query_id || '', authDate: authDate};
}

function logout(sessionToken) {
  if (sessionToken) CacheService.getScriptCache().remove('SESSION:' + sessionToken);
  return true;
}

function saveUser(sessionToken, payload) {
  const current = requireSession_(sessionToken);
  requireRole_(current, [POS.ROLES.ADMIN]);
  payload = payload || {};
  const existing = payload.userId ? findRowBy_(POS.SHEETS.USERS, 'UserID', payload.userId) : null;
  const now = new Date();
  const role = sanitizeText_(payload.role, 30);
  if (Object.keys(POS.ROLES).map(function(key) { return POS.ROLES[key]; }).indexOf(role) === -1) {
    throw new Error('Invalid role.');
  }

  const loginId = sanitizeText_(payload.loginId, 60).toLowerCase();
  if (!loginId) throw new Error('Login ID is required.');
  const duplicateLogin = getRows_(POS.SHEETS.USERS).find(function(row) {
    return String(row.LoginID || '').toLowerCase() === loginId &&
      (!existing || String(row.UserID) !== String(existing.UserID));
  });
  if (duplicateLogin) throw new Error('This Login ID is already in use.');

  const branchId = sanitizeText_(payload.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', branchId);
  if (!branch || !bool_(branch.Active)) throw new Error('Selected branch is unavailable.');
  const permissions = normalizePermissions_(payload.permissions, role);

  const data = {
    LoginID: loginId,
    Name: sanitizeText_(payload.name, 80),
    TelegramID: sanitizeText_(payload.telegramId, 30),
    Email: sanitizeText_(payload.email, 120),
    Role: role,
    BranchID: branchId,
    PermissionsJSON: JSON.stringify(permissions),
    Active: payload.active !== false,
    Language: payload.language === 'km' ? 'km' : 'en',
    Theme: ['light', 'dark', 'auto'].indexOf(payload.theme) >= 0 ? payload.theme : 'auto',
    ThemeColor: ['DEFAULT','BLUE','TEAL','GREEN','PURPLE','ORANGE','ROSE'].indexOf(String(payload.themeColor || 'DEFAULT').toUpperCase()) >= 0 ? String(payload.themeColor || 'DEFAULT').toUpperCase() : 'DEFAULT',
    UpdatedAt: now
  };
  if (!data.Name) throw new Error('User name is required.');
  if (payload.pin) {
    if (String(payload.pin).length < 4) throw new Error('PIN must contain at least 4 characters.');
    data.PINHash = hashPin_(payload.pin);
  }

  let userId;
  if (existing) {
    userId = existing.UserID;
    updateRowObject_(POS.SHEETS.USERS, existing._row, data);
  } else {
    userId = uuid_('USR');
    data.UserID = userId;
    data.PINHash = data.PINHash || '';
    data.CreatedAt = now;
    appendObject_(POS.SHEETS.USERS, data);
  }
  audit_(current.UserID, existing ? 'UPDATE_USER' : 'CREATE_USER', 'User', userId, {role: role, branchId:branchId, permissions:permissions});
  return {success: true, userId: userId};
}

function listUsers(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  return getRows_(POS.SHEETS.USERS).map(publicUser_);
}


/* ==========================================================================
 * SOURCE: BackupRestore.gs
 * ========================================================================== */
/** Tiny POS v3.6 automated backup and controlled restore. */
function backupFolder_() {
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty('BACKUP_FOLDER_ID');
  if(id){try{return DriveApp.getFolderById(id);}catch(error){}}
  const folder=DriveApp.createFolder('Tiny POS Backups');
  props.setProperty('BACKUP_FOLDER_ID',folder.getId());
  return folder;
}

function createTinyPosBackup_(user, type, note) {
  const ss=getSpreadsheet_(),stamp=Utilities.formatDate(new Date(),POS.TIME_ZONE,'yyyyMMdd-HHmmss');
  const folder=backupFolder_();
  const source=DriveApp.getFileById(ss.getId());
  const copy=source.makeCopy(ss.getName()+' Backup '+stamp,folder);
  const now=new Date();
  appendObject_(POS.SHEETS.BACKUPS,{BackupID:uuid_('BKP'),DateTime:now,FileID:copy.getId(),FileName:copy.getName(),FileURL:copy.getUrl(),BackupType:String(type||'MANUAL'),CreatedByID:user?user.UserID:'SYSTEM',CreatedByName:user?user.Name:'SYSTEM',Note:sanitizeText_(note,250),Status:'AVAILABLE',CreatedAt:now});
  pruneTinyPosBackups_();
  return {fileId:copy.getId(),fileName:copy.getName(),url:copy.getUrl(),dateTime:now.toISOString()};
}

function createManualBackup(sessionToken, note) {
  const user=requireSession_(sessionToken);requirePermission_(user,'BACKUP');
  return createTinyPosBackup_(user,'MANUAL',note);
}

function runScheduledTinyPosBackup() {
  try{return createTinyPosBackup_(null,'AUTOMATIC','Scheduled backup');}
  catch(error){console.error('Scheduled backup failed:',error&&error.stack?error.stack:error);throw error;}
}

function pruneTinyPosBackups_() {
  const retention=Math.max(1,Math.min(365,Math.floor(number_(settingValueV38_('BACKUP_RETENTION_COUNT')||30))));
  const rows=getRows_(POS.SHEETS.BACKUPS).filter(function(row){return String(row.Status||'AVAILABLE')==='AVAILABLE';}).sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);});
  rows.slice(retention).forEach(function(row){
    try{DriveApp.getFileById(String(row.FileID)).setTrashed(true);}catch(error){}
    updateRowObject_(POS.SHEETS.BACKUPS,row._row,{Status:'TRASHED'});
  });
}

function configureBackupSchedule(sessionToken, payload) {
  const user=requireSession_(sessionToken);requireRole_(user,[POS.ROLES.ADMIN]);requirePermission_(user,'BACKUP');payload=payload||{};
  const enabled=payload.enabled===true;const frequency=['DAILY','WEEKLY'].indexOf(String(payload.frequency||'DAILY').toUpperCase())>=0?String(payload.frequency).toUpperCase():'DAILY';const hour=Math.max(0,Math.min(23,Math.floor(number_(payload.hour,2))));const retention=Math.max(1,Math.min(365,Math.floor(number_(payload.retention,30))));
  setSetting_('AUTO_BACKUP_ENABLED',enabled?'TRUE':'FALSE','BOOLEAN');setSetting_('AUTO_BACKUP_FREQUENCY',frequency,'STRING');setSetting_('AUTO_BACKUP_HOUR',String(hour),'NUMBER');setSetting_('BACKUP_RETENTION_COUNT',String(retention),'NUMBER');
  ScriptApp.getProjectTriggers().forEach(function(trigger){if(trigger.getHandlerFunction()==='runScheduledTinyPosBackup')ScriptApp.deleteTrigger(trigger);});
  if(enabled){let builder=ScriptApp.newTrigger('runScheduledTinyPosBackup').timeBased().atHour(hour);if(frequency==='WEEKLY')builder=builder.onWeekDay(ScriptApp.WeekDay.SUNDAY);else builder=builder.everyDays(1);builder.create();}
  audit_(user.UserID,'CONFIGURE_BACKUP','Backup','',{enabled:enabled,frequency:frequency,hour:hour,retention:retention});
  return getBackupManagerData(sessionToken);
}

function getBackupManagerData(sessionToken) {
  const user=requireSession_(sessionToken);requirePermission_(user,'BACKUP');
  return {settings:{enabled:bool_(settingValueV38_('AUTO_BACKUP_ENABLED')),frequency:String(settingValueV38_('AUTO_BACKUP_FREQUENCY')||'DAILY'),hour:number_(settingValueV38_('AUTO_BACKUP_HOUR'),2),retention:number_(settingValueV38_('BACKUP_RETENTION_COUNT'),30)},backups:getRows_(POS.SHEETS.BACKUPS).filter(function(row){return String(row.Status||'AVAILABLE')==='AVAILABLE';}).sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);}).slice(0,100).map(function(row){return {backupId:String(row.BackupID),dateTime:row.DateTime?new Date(row.DateTime).toISOString():'',fileName:String(row.FileName),url:String(row.FileURL),type:String(row.BackupType),createdBy:String(row.CreatedByName),note:String(row.Note)};})};
}

function restoreTinyPosBackup(sessionToken, backupId, confirmation) {
  const user=requireSession_(sessionToken);requireRole_(user,[POS.ROLES.ADMIN]);requirePermission_(user,'BACKUP');
  if(String(confirmation||'').trim().toUpperCase()!=='RESTORE')throw new Error('Type RESTORE to confirm.');
  const backup=findRowBy_(POS.SHEETS.BACKUPS,'BackupID',backupId);if(!backup||String(backup.Status||'AVAILABLE')!=='AVAILABLE')throw new Error('Backup not found.');
  return withScriptLock_(function(){
    const safety=createTinyPosBackup_(user,'PRE_RESTORE','Automatic safety backup before restoring '+backup.FileName);
    const source=SpreadsheetApp.openById(String(backup.FileID)),target=getSpreadsheet_();
    Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName){
      const sourceSheet=source.getSheetByName(sheetName);if(!sourceSheet)return;
      let targetSheet=target.getSheetByName(sheetName);if(!targetSheet)targetSheet=target.insertSheet(sheetName);
      const values=sourceSheet.getDataRange().getValues();targetSheet.clearContents();
      if(values.length&&values[0].length){if(values[0].length>targetSheet.getMaxColumns())targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(),values[0].length-targetSheet.getMaxColumns());if(values.length>targetSheet.getMaxRows())targetSheet.insertRowsAfter(targetSheet.getMaxRows(),values.length-targetSheet.getMaxRows());targetSheet.getRange(1,1,values.length,values[0].length).setValues(values);targetSheet.setFrozenRows(1);}
    });
    installTinyPOSCompleteSilent_();
    audit_(user.UserID,'RESTORE_BACKUP','Backup',backupId,{fileName:backup.FileName,safetyBackup:safety.fileName});
    return {success:true,restoredFile:String(backup.FileName),safetyBackup:safety};
  });
}

function installTinyPOSCompleteSilent_() {
  const ss=getSpreadsheet_(),report=[];
  Object.keys(TINY_POS_SCHEMA).forEach(function(sheetName){ensureTinyPosSheet_(ss,sheetName,TINY_POS_SCHEMA[sheetName],report);});
  Object.keys(DEFAULT_SETTINGS).forEach(function(key){if(!findRowBy_(POS.SHEETS.SETTINGS,'Key',key))setSetting_(key,DEFAULT_SETTINGS[key],'STRING');});
  ensureDefaultBranch_();syncMainBranchInventory_();
  return report;
}


/* ==========================================================================
 * SOURCE: BranchTransfers.gs
 * ========================================================================== */
/** Tiny POS v3.6 branches, branch inventory, and stock transfers. */
const BRANCH_FEATURE = Object.freeze({
  DEFAULT_BRANCH_ID: 'BR-MAIN',
  STATUS: Object.freeze({DRAFT:'DRAFT',SHIPPED:'SHIPPED',RECEIVED:'RECEIVED',CANCELLED:'CANCELLED'})
});

function ensureDefaultBranch_() {
  let branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', BRANCH_FEATURE.DEFAULT_BRANCH_ID);
  if (!branch) {
    const now = new Date();
    appendObject_(POS.SHEETS.BRANCHES, {
      BranchID: BRANCH_FEATURE.DEFAULT_BRANCH_ID,
      Code: 'MAIN', NameEN: 'Main Branch', NameKH: 'សាខាចម្បង',
      Address: '', Phone: '', Active: true, CreatedAt: now, UpdatedAt: now
    });
    branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', BRANCH_FEATURE.DEFAULT_BRANCH_ID);
  }
  return branch;
}

function getUserBranchId_(user) {
  const id = sanitizeText_(user && user.BranchID, 80);
  const branch = id ? findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', id) : null;
  return branch && bool_(branch.Active) ? String(branch.BranchID) : BRANCH_FEATURE.DEFAULT_BRANCH_ID;
}

function getBranchInventoryRow_(branchId, productId) {
  return getRows_(POS.SHEETS.BRANCH_INVENTORY).find(function(row) {
    return String(row.BranchID) === String(branchId) && String(row.ProductID) === String(productId);
  }) || null;
}

function getBranchStockQty_(branchId, productId) {
  const row = getBranchInventoryRow_(branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID, productId);
  if (row) return number_(row.Qty);
  if (String(branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === BRANCH_FEATURE.DEFAULT_BRANCH_ID) {
    const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
    return product ? number_(product.CurrentStock) : 0;
  }
  return 0;
}

function getBranchAverageCost_(branchId, productId) {
  const row = getBranchInventoryRow_(branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID, productId);
  if (row && number_(row.AverageCostUSD) >= 0) return number_(row.AverageCostUSD);
  const summary = getFifoStockSummary_(productId, branchId);
  if (summary.totalQty > 0) return summary.averageCostUSD;
  const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
  return product ? number_(product.CostUSD) : 0;
}

function setBranchStockLocked_(branchId, productId, quantity, averageCostUSD) {
  branchId = branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const qty = Math.max(0, Math.round(number_(quantity) * 1000) / 1000);
  const cost = Math.max(0, number_(averageCostUSD));
  const now = new Date();
  const row = getBranchInventoryRow_(branchId, productId);
  const data = {Qty:qty, AverageCostUSD:cost, UpdatedAt:now};
  if (row) {
    updateRowObject_(POS.SHEETS.BRANCH_INVENTORY, row._row, data);
  } else {
    appendObject_(POS.SHEETS.BRANCH_INVENTORY, {
      BranchInventoryID: uuid_('BIN'), BranchID:branchId, ProductID:productId,
      Qty:qty, AverageCostUSD:cost, UpdatedAt:now
    });
  }
  if (String(branchId) === BRANCH_FEATURE.DEFAULT_BRANCH_ID) {
    const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
    if (product) {
      const changes = {CurrentStock:qty, UpdatedAt:now};
      if (cost >= 0) changes.CostUSD = cost;
      updateRowObject_(POS.SHEETS.PRODUCTS, product._row, changes);
    }
  }
  return qty;
}

function adjustBranchStockLocked_(branchId, productId, quantityChange, averageCostUSD) {
  const current = getBranchStockQty_(branchId, productId);
  const next = Math.round((current + number_(quantityChange)) * 1000) / 1000;
  if (next < -0.0005) throw new Error('Branch stock cannot become negative.');
  return setBranchStockLocked_(branchId, productId, Math.max(0, next), averageCostUSD);
}

function syncMainBranchInventory_() {
  ensureDefaultBranch_();
  const existing = {};
  getRows_(POS.SHEETS.BRANCH_INVENTORY).forEach(function(row) {
    existing[String(row.BranchID) + '|' + String(row.ProductID)] = row;
  });
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    const key = BRANCH_FEATURE.DEFAULT_BRANCH_ID + '|' + String(product.ProductID);
    if (!existing[key]) {
      appendObject_(POS.SHEETS.BRANCH_INVENTORY, {
        BranchInventoryID:uuid_('BIN'), BranchID:BRANCH_FEATURE.DEFAULT_BRANCH_ID,
        ProductID:product.ProductID, Qty:number_(product.CurrentStock),
        AverageCostUSD:number_(product.CostUSD), UpdatedAt:new Date()
      });
    }
  });
}

function listBranchesForUserManagement_(user) {
  return getRows_(POS.SHEETS.BRANCHES)
    .filter(function(row) { return bool_(row.Active) || String(row.BranchID) === getUserBranchId_(user); })
    .sort(function(a,b){return String(a.Code||a.NameEN).localeCompare(String(b.Code||b.NameEN));})
    .map(branchToPublic_);
}

function branchToPublic_(row) {
  return {
    branchId:String(row.BranchID||''), code:String(row.Code||''),
    nameEN:String(row.NameEN||''), nameKH:String(row.NameKH||''),
    address:String(row.Address||''), phone:String(row.Phone||''), active:bool_(row.Active)
  };
}

function listBranches(sessionToken, includeInactive) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'BRANCHES');
  return getRows_(POS.SHEETS.BRANCHES)
    .filter(function(row){return includeInactive === true || bool_(row.Active);})
    .sort(function(a,b){return String(a.Code||a.NameEN).localeCompare(String(b.Code||b.NameEN));})
    .map(branchToPublic_);
}

function saveBranch(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  requirePermission_(user, 'BRANCHES');
  payload = payload || {};
  const existing = payload.branchId ? findRowBy_(POS.SHEETS.BRANCHES,'BranchID',payload.branchId) : null;
  const code = sanitizeText_(payload.code,30).toUpperCase();
  const nameEN = sanitizeText_(payload.nameEN,100);
  const nameKH = sanitizeText_(payload.nameKH,100);
  if (!code || (!nameEN && !nameKH)) throw new Error('Branch code and name are required.');
  const duplicate = getRows_(POS.SHEETS.BRANCHES).find(function(row){
    return String(row.Code||'').toUpperCase() === code && (!existing || String(row.BranchID)!==String(existing.BranchID));
  });
  if (duplicate) throw new Error('This branch code is already used.');
  const now = new Date();
  const data = {Code:code,NameEN:nameEN,NameKH:nameKH,Address:sanitizeText_(payload.address,250),Phone:sanitizeText_(payload.phone,60),Active:payload.active!==false,UpdatedAt:now};
  let branchId;
  if (existing) {
    branchId=String(existing.BranchID); updateRowObject_(POS.SHEETS.BRANCHES,existing._row,data);
  } else {
    branchId=uuid_('BR'); data.BranchID=branchId; data.CreatedAt=now; appendObject_(POS.SHEETS.BRANCHES,data);
  }
  audit_(user.UserID,existing?'UPDATE_BRANCH':'CREATE_BRANCH','Branch',branchId,data);
  return {success:true,branchId:branchId};
}

function nextTransferNoLocked_() {
  const key = dateKey_(new Date());
  const props = PropertiesService.getScriptProperties();
  const property = 'TRANSFER_COUNTER_' + key;
  const next = number_(props.getProperty(property),0)+1;
  props.setProperty(property,String(next));
  return 'TRF-' + key + '-' + String(next).padStart(4,'0');
}

function transferToPublic_(row, branchMap) {
  branchMap = branchMap || {};
  const items = getRows_(POS.SHEETS.TRANSFER_ITEMS).filter(function(item){return String(item.TransferID)===String(row.TransferID);});
  return {
    transferId:String(row.TransferID), transferNo:String(row.TransferNo),
    fromBranchId:String(row.FromBranchID), toBranchId:String(row.ToBranchID),
    fromBranchName:(branchMap[String(row.FromBranchID)]||{}).nameEN || String(row.FromBranchID),
    toBranchName:(branchMap[String(row.ToBranchID)]||{}).nameEN || String(row.ToBranchID),
    status:String(row.Status||''), requestedAt:row.RequestedAt?new Date(row.RequestedAt).toISOString():'',
    shippedAt:row.ShippedAt?new Date(row.ShippedAt).toISOString():'', receivedAt:row.ReceivedAt?new Date(row.ReceivedAt).toISOString():'',
    reference:String(row.Reference||''), expectedArrival:row.ExpectedArrival?new Date(row.ExpectedArrival).toISOString():'',
    receivedByName:String(row.ReceivedByName||''), receiptNote:String(row.ReceiptNote||''), notes:String(row.Notes||''), itemCount:items.length,
    totalQty:items.reduce(function(sum,item){return sum+number_(item.QtyRequested);},0),
    items:items.map(function(item){return {transferItemId:String(item.TransferItemID),productId:String(item.ProductID),productName:String(item.ProductName),qtyRequested:number_(item.QtyRequested),qtyShipped:number_(item.QtyShipped),qtyReceived:number_(item.QtyReceived),unitCostUSD:number_(item.UnitCostUSD),amountUSD:number_(item.AmountUSD)};})
  };
}

function getBranchTransferModuleData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'TRANSFERS');
  filters = filters || {};
  const scopeBranchId = resolveAccessibleBranchId_(user, filters.branchId, true);
  const query = sanitizeText_(filters.query,120).toLowerCase();
  const status = sanitizeText_(filters.status,30).toUpperCase();
  const branchRows = getRows_(POS.SHEETS.BRANCHES);
  const branchMap = {};
  branchRows.forEach(function(row){branchMap[String(row.BranchID)] = branchToPublic_(row);});
  const transfers = getRows_(POS.SHEETS.TRANSFERS)
    .filter(function(row){
      if (status && String(row.Status||'').toUpperCase()!==status) return false;
      if (scopeBranchId && String(row.FromBranchID)!==String(scopeBranchId) && String(row.ToBranchID)!==String(scopeBranchId)) return false;
      const hay=[row.TransferNo,(branchMap[String(row.FromBranchID)]||{}).nameEN,(branchMap[String(row.ToBranchID)]||{}).nameEN,row.Status,row.Notes].join(' ').toLowerCase();
      return !query || hay.indexOf(query)>=0;
    })
    .sort(function(a,b){return new Date(b.RequestedAt||b.CreatedAt)-new Date(a.RequestedAt||a.CreatedAt);})
    .map(function(row){return transferToPublic_(row,branchMap);});
  return {
    branches:branchRows.map(branchToPublic_), transfers:transfers,
    metrics:{total:transfers.length,draft:transfers.filter(function(t){return t.status==='DRAFT';}).length,shipped:transfers.filter(function(t){return t.status==='SHIPPED';}).length,received:transfers.filter(function(t){return t.status==='RECEIVED';}).length},
    canManageAllBranches:canManageAllBranches_(user),defaultBranchId:getUserBranchId_(user),selectedBranchId:scopeBranchId
  };
}

function saveStockTransfer(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'TRANSFERS');
  requireRole_(user,[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]);
  payload = payload || {};
  const fromBranchId=requireBranchAccess_(user,payload.fromBranchId),toBranchId=sanitizeText_(payload.toBranchId,80);
  if(!fromBranchId||!toBranchId||fromBranchId===toBranchId)throw new Error('Choose two different branches.');
  const fromBranch=findRowBy_(POS.SHEETS.BRANCHES,'BranchID',fromBranchId),toBranch=findRowBy_(POS.SHEETS.BRANCHES,'BranchID',toBranchId);
  if(!fromBranch||!toBranch||!bool_(fromBranch.Active)||!bool_(toBranch.Active))throw new Error('Both branches must be active.');
  const rawItems=Array.isArray(payload.items)?payload.items:[];
  const items=rawItems.map(function(raw){
    const product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',raw.productId);
    if(!product)throw new Error('Transfer product not found.');
    const qty=Math.round(number_(raw.qty)*1000)/1000;
    if(qty<=0)throw new Error('Transfer quantity must be greater than zero.');
    const available=getBranchStockQty_(fromBranchId,product.ProductID);
    if(available+0.0005<qty)throw new Error((product.NameEN||product.NameKH)+': only '+available+' available in the source branch.');
    return {product:product,qty:qty};
  });
  if(!items.length)throw new Error('Add at least one transfer product.');
  return withScriptLock_(function(){
    const now=new Date(),transferId=uuid_('TRF'),transferNo=nextTransferNoLocked_();
    appendObject_(POS.SHEETS.TRANSFERS,{TransferID:transferId,TransferNo:transferNo,FromBranchID:fromBranchId,ToBranchID:toBranchId,Status:'DRAFT',Reference:sanitizeText_(payload.reference,100),ExpectedArrival:payload.expectedArrival?new Date(payload.expectedArrival+'T00:00:00'):'',RequestedAt:now,RequestedByID:user.UserID,ApprovedAt:'',ApprovedByID:'',ShippedAt:'',ShippedByID:'',ReceivedAt:'',ReceivedByID:'',ReceivedByName:'',ReceiptNote:'',Notes:sanitizeText_(payload.notes,500),CreatedAt:now,UpdatedAt:now});
    appendObjects_(POS.SHEETS.TRANSFER_ITEMS,items.map(function(entry){return {TransferItemID:uuid_('TRI'),TransferID:transferId,ProductID:entry.product.ProductID,ProductName:String(entry.product.NameEN||entry.product.NameKH),QtyRequested:entry.qty,QtyShipped:0,QtyReceived:0,UnitCostUSD:0,AmountUSD:0,CreatedAt:now,UpdatedAt:now};}));
    audit_(user.UserID,'CREATE_TRANSFER','StockTransfer',transferId,{transferNo:transferNo,fromBranchId:fromBranchId,toBranchId:toBranchId,items:items.length});
    return {success:true,transferId:transferId,transferNo:transferNo};
  });
}

function shipStockTransfer(sessionToken, transferId) {
  const user=requireSession_(sessionToken);requirePermission_(user,'TRANSFERS');requireRole_(user,[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]);
  return withScriptLock_(function(){
    const transfer=findRowBy_(POS.SHEETS.TRANSFERS,'TransferID',transferId);if(!transfer)throw new Error('Transfer not found.');
    if(String(transfer.Status)!=='DRAFT')throw new Error('Only a draft transfer can be shipped.');
    requireBranchAccess_(user, transfer.FromBranchID);
    const items=getRows_(POS.SHEETS.TRANSFER_ITEMS).filter(function(row){return String(row.TransferID)===String(transferId);});
    items.forEach(function(item){ensureBranchFifoCoverageV38_(String(transfer.FromBranchID),String(item.ProductID));});
    const plan=planFifoAllocationsLocked_(items.map(function(item){return {productId:item.ProductID,qty:number_(item.QtyRequested)};}),transfer.FromBranchID);
    const now=new Date();
    applyFifoPlanLocked_(plan,items.map(function(item){return {referenceType:'STOCK_TRANSFER_OUT',referenceId:item.TransferItemID,userId:user.UserID,note:transfer.TransferNo,branchId:transfer.FromBranchID};}));
    items.forEach(function(item,index){
      const costPlan=plan.itemPlans[index];
      const balance=adjustBranchStockLocked_(transfer.FromBranchID,item.ProductID,-number_(item.QtyRequested),costPlan.averageUnitCostUSD);
      updateRowObject_(POS.SHEETS.TRANSFER_ITEMS,item._row,{QtyShipped:number_(item.QtyRequested),UnitCostUSD:costPlan.averageUnitCostUSD,AmountUSD:costPlan.totalCostUSD,UpdatedAt:now});
      appendObject_(POS.SHEETS.STOCK,{MovementID:uuid_('STK'),DateTime:now,ProductID:item.ProductID,Type:'TRANSFER_OUT',QtyIn:0,QtyOut:number_(item.QtyRequested),BalanceAfter:balance,ReferenceType:'TRANSFER',ReferenceID:transferId,UserID:user.UserID,Note:transfer.TransferNo,UnitCostUSD:costPlan.averageUnitCostUSD,CostInUSD:0,CostOutUSD:costPlan.totalCostUSD,BranchID:transfer.FromBranchID,FromBranchID:transfer.FromBranchID,ToBranchID:transfer.ToBranchID});
      plan.itemPlans[index].allocations.forEach(function(allocation){appendObject_(POS.SHEETS.TRANSFER_ALLOCATIONS,{TransferAllocationID:uuid_('TRA'),TransferID:transferId,TransferItemID:item.TransferItemID,ProductID:item.ProductID,SourceLotID:allocation.lotId,Qty:allocation.qty,UnitCostUSD:allocation.unitCostUSD,CostUSD:allocation.costUSD,CreatedAt:now});});
    });
    updateRowObject_(POS.SHEETS.TRANSFERS,transfer._row,{Status:'SHIPPED',ApprovedAt:now,ApprovedByID:user.UserID,ShippedAt:now,ShippedByID:user.UserID,UpdatedAt:now});
    audit_(user.UserID,'SHIP_TRANSFER','StockTransfer',transferId,{transferNo:transfer.TransferNo});
    return {success:true,status:'SHIPPED'};
  });
}

function receiveStockTransfer(sessionToken, transferId, payload) {
  payload = payload || {};
  const user=requireSession_(sessionToken);requirePermission_(user,'TRANSFERS');requireRole_(user,[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]);
  return withScriptLock_(function(){
    const transfer=findRowBy_(POS.SHEETS.TRANSFERS,'TransferID',transferId);if(!transfer)throw new Error('Transfer not found.');
    if(String(transfer.Status)!=='SHIPPED')throw new Error('Only a shipped transfer can be received.');
    requireBranchAccess_(user, transfer.ToBranchID);
    const items=getRows_(POS.SHEETS.TRANSFER_ITEMS).filter(function(row){return String(row.TransferID)===String(transferId);});
    const allocations=getRows_(POS.SHEETS.TRANSFER_ALLOCATIONS).filter(function(row){return String(row.TransferID)===String(transferId);});
    const now=new Date();
    items.forEach(function(item){
      const itemAllocations=allocations.filter(function(row){return String(row.TransferItemID)===String(item.TransferItemID);});
      itemAllocations.forEach(function(allocation){createStockLotLocked_({productId:item.ProductID,branchId:transfer.ToBranchID,receivedAt:now,unitCostUSD:number_(allocation.UnitCostUSD),quantity:number_(allocation.Qty),referenceType:'STOCK_TRANSFER_IN',referenceId:transferId,note:transfer.TransferNo});});
      const qty=number_(item.QtyShipped||item.QtyRequested);
      const balance=adjustBranchStockLocked_(transfer.ToBranchID,item.ProductID,qty,number_(item.UnitCostUSD));
      updateRowObject_(POS.SHEETS.TRANSFER_ITEMS,item._row,{QtyReceived:qty,UpdatedAt:now});
      appendObject_(POS.SHEETS.STOCK,{MovementID:uuid_('STK'),DateTime:now,ProductID:item.ProductID,Type:'TRANSFER_IN',QtyIn:qty,QtyOut:0,BalanceAfter:balance,ReferenceType:'TRANSFER',ReferenceID:transferId,UserID:user.UserID,Note:transfer.TransferNo,UnitCostUSD:number_(item.UnitCostUSD),CostInUSD:number_(item.AmountUSD),CostOutUSD:0,BranchID:transfer.ToBranchID,FromBranchID:transfer.FromBranchID,ToBranchID:transfer.ToBranchID});
    });
    updateRowObject_(POS.SHEETS.TRANSFERS,transfer._row,{Status:'RECEIVED',ReceivedAt:now,ReceivedByID:user.UserID,ReceivedByName:user.Name,ReceiptNote:sanitizeText_(payload.receiptNote,250),UpdatedAt:now});
    audit_(user.UserID,'RECEIVE_TRANSFER','StockTransfer',transferId,{transferNo:transfer.TransferNo});
    return {success:true,status:'RECEIVED'};
  });
}

function cancelStockTransfer(sessionToken, transferId) {
  const user=requireSession_(sessionToken);requirePermission_(user,'TRANSFERS');requireRole_(user,[POS.ROLES.ADMIN,POS.ROLES.MANAGER]);
  const transfer=findRowBy_(POS.SHEETS.TRANSFERS,'TransferID',transferId);if(!transfer)throw new Error('Transfer not found.');
  if(String(transfer.Status)!=='DRAFT')throw new Error('Only a draft transfer can be cancelled.');
  updateRowObject_(POS.SHEETS.TRANSFERS,transfer._row,{Status:'CANCELLED',UpdatedAt:new Date()});
  audit_(user.UserID,'CANCEL_TRANSFER','StockTransfer',transferId,{});return {success:true};
}


/* ==========================================================================
 * SOURCE: Cloudinary.gs
 * ========================================================================== */
/**
 * Cloudinary product-image integration for Google POS.
 * Credentials are stored in Apps Script Script Properties, never in Sheets
 * and never returned to the browser.
 */

function configureCloudinary() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const cloudNamePrompt = ui.prompt(
    'Cloudinary cloud name',
    'Paste the Cloud Name shown in your Cloudinary dashboard:',
    ui.ButtonSet.OK_CANCEL
  );
  if (cloudNamePrompt.getSelectedButton() !== ui.Button.OK) return;

  const apiKeyPrompt = ui.prompt(
    'Cloudinary API key',
    'Paste the API Key:',
    ui.ButtonSet.OK_CANCEL
  );
  if (apiKeyPrompt.getSelectedButton() !== ui.Button.OK) return;

  const apiSecretPrompt = ui.prompt(
    'Cloudinary API secret',
    'Paste the API Secret. Keep it private:',
    ui.ButtonSet.OK_CANCEL
  );
  if (apiSecretPrompt.getSelectedButton() !== ui.Button.OK) return;

  const cloudName = String(cloudNamePrompt.getResponseText() || '').trim();
  const apiKey = String(apiKeyPrompt.getResponseText() || '').trim();
  const apiSecret = String(apiSecretPrompt.getResponseText() || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    ui.alert('Cloudinary configuration was not saved because one or more values were empty.');
    return;
  }

  props.setProperties({
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret
  }, false);

  ui.alert(
    'Cloudinary configured',
    'Product images will now upload to Cloudinary.\n\nCloud name: ' + cloudName +
      '\nAPI key ending: ' + apiKey.slice(-4) +
      '\nAPI secret: saved securely',
    ui.ButtonSet.OK
  );
}

function checkCloudinaryConfiguration() {
  const ui = SpreadsheetApp.getUi();
  const config = getCloudinaryConfig_();
  ui.alert(
    'Cloudinary Image Storage',
    'Cloud name: ' + config.cloudName +
      '\nAPI key ending: ' + config.apiKey.slice(-4) +
      '\nAPI secret: configured' +
      '\nFolder: google-pos/products',
    ui.ButtonSet.OK
  );
}

function getCloudinaryConfig_() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    cloudName: String(props.getProperty('CLOUDINARY_CLOUD_NAME') || '').trim(),
    apiKey: String(props.getProperty('CLOUDINARY_API_KEY') || '').trim(),
    apiSecret: String(props.getProperty('CLOUDINARY_API_SECRET') || '').trim()
  };

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      'Cloudinary is not configured. In Google Sheets run POS Setup → Configure Cloudinary Images.'
    );
  }
  return config;
}

function uploadProductImageToCloudinary_(dataUrl, productId) {
  dataUrl = String(dataUrl || '');
  const parsed = parseDataUrl_(dataUrl);
  if (parsed.bytes.length > 1500000) {
    throw new Error('Compressed image must be under 1.5 MB.');
  }
  if (String(parsed.mimeType).indexOf('image/') !== 0) {
    throw new Error('The uploaded file is not a supported image.');
  }

  const config = getCloudinaryConfig_();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'google-pos/products';
  const publicId = sanitizeCloudinaryPublicId_(
    String(productId || 'product') + '-' + Date.now()
  );

  const paramsToSign = {
    folder: folder,
    public_id: publicId,
    timestamp: timestamp
  };

  const signature = cloudinarySignature_(paramsToSign, config.apiSecret);
  const endpoint =
    'https://api.cloudinary.com/v1_1/' +
    encodeURIComponent(config.cloudName) +
    '/image/upload';

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    payload: {
      file: dataUrl,
      api_key: config.apiKey,
      timestamp: String(timestamp),
      signature: signature,
      folder: folder,
      public_id: publicId
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  const result = safeJsonParse_(body, {});

  if (status < 200 || status >= 300 || !result.secure_url) {
    const message =
      result && result.error && result.error.message
        ? result.error.message
        : body || ('HTTP ' + status);
    throw new Error('Cloudinary upload failed: ' + message);
  }

  // Ask Cloudinary's delivery service to cap size and optimize format/quality.
  const optimizedUrl = String(result.secure_url).replace(
    '/upload/',
    '/upload/f_auto,q_auto,c_limit,w_600,h_600/'
  );

  return {
    fileId: 'cloudinary:' + String(result.public_id || ''),
    url: optimizedUrl
  };
}

function cloudinarySignature_(params, apiSecret) {
  const stringToSign = Object.keys(params)
    .filter(function(key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== '';
    })
    .sort()
    .map(function(key) {
      return key + '=' + String(params[key]);
    })
    .join('&') + String(apiSecret);

  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    stringToSign,
    Utilities.Charset.UTF_8
  ));
}

function sanitizeCloudinaryPublicId_(value) {
  return String(value || 'product')
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180) || 'product';
}

/**
 * Optional migration for existing Drive-backed product images.
 * Run this once from Apps Script after Cloudinary is configured.
 */
function migrateDriveProductImagesToCloudinary() {
  const ui = SpreadsheetApp.getUi();
  getCloudinaryConfig_();

  const rows = getRows_(POS.SHEETS.PRODUCTS).filter(function(row) {
    return String(row.ImageFileID || '') &&
      String(row.ImageFileID || '').indexOf('cloudinary:') !== 0 &&
      String(row.ImageURL || '').indexOf('drive.google.com') >= 0;
  });

  if (!rows.length) {
    ui.alert('No Google Drive product images were found to migrate.');
    return;
  }

  const confirm = ui.alert(
    'Migrate product images',
    'Move ' + rows.length + ' existing Drive image(s) to Cloudinary?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  let migrated = 0;
  const errors = [];

  rows.forEach(function(row) {
    try {
      const file = DriveApp.getFileById(String(row.ImageFileID));
      const blob = file.getBlob();
      const dataUrl =
        'data:' + blob.getContentType() + ';base64,' +
        Utilities.base64Encode(blob.getBytes());
      const uploaded = uploadProductImageToCloudinary_(dataUrl, row.ProductID);
      updateRowObject_(POS.SHEETS.PRODUCTS, row._row, {
        ImageURL: uploaded.url,
        ImageFileID: uploaded.fileId,
        UpdatedAt: new Date()
      });
      migrated++;
      Utilities.sleep(150);
    } catch (error) {
      errors.push(String(row.ProductID) + ': ' + (error.message || error));
    }
  });

  ui.alert(
    'Migration finished',
    'Migrated: ' + migrated + '\nFailed: ' + errors.length +
      (errors.length ? '\n\n' + errors.slice(0, 8).join('\n') : ''),
    ui.ButtonSet.OK
  );
}

/** Uploads a compressed return/damage evidence image. */
function uploadReturnImageToCloudinary_(dataUrl, referenceId) {
  dataUrl = String(dataUrl || '');
  if (!dataUrl) return {url:'',fileId:''};
  const parsed = parseDataUrl_(dataUrl);
  if (parsed.bytes.length > 1800000) throw new Error('Return image must be under 1.8 MB after compression.');
  if (String(parsed.mimeType).indexOf('image/') !== 0) throw new Error('Return evidence must be an image.');
  const config = getCloudinaryConfig_();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'tiny-pos/returns';
  const publicId = sanitizeCloudinaryPublicId_(String(referenceId || 'return') + '-' + Date.now());
  const paramsToSign = {folder:folder,public_id:publicId,timestamp:timestamp};
  const signature = cloudinarySignature_(paramsToSign, config.apiSecret);
  const endpoint = 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(config.cloudName) + '/image/upload';
  const response = UrlFetchApp.fetch(endpoint, {method:'post',payload:{file:dataUrl,api_key:config.apiKey,timestamp:String(timestamp),signature:signature,folder:folder,public_id:publicId},muteHttpExceptions:true});
  const status = response.getResponseCode();
  const body = response.getContentText();
  const result = safeJsonParse_(body, {});
  if (status < 200 || status >= 300 || !result.secure_url) {
    const message = result && result.error && result.error.message ? result.error.message : body || ('HTTP ' + status);
    throw new Error('Return image upload failed: ' + message);
  }
  return {
    fileId:'cloudinary:' + String(result.public_id || ''),
    url:String(result.secure_url).replace('/upload/','/upload/f_auto,q_auto,c_limit,w_1200,h_1200/')
  };
}


/* ==========================================================================
 * SOURCE: Coupons.gs
 * ========================================================================== */
function normalizeCouponCode_(value) {
  return sanitizeText_(value, 40).toUpperCase().replace(/\s+/g, '');
}

function findCouponByCode_(code) {
  const normalized = normalizeCouponCode_(code);
  if (!normalized) return null;
  return getRows_(POS.SHEETS.COUPONS).find(function(row) {
    return normalizeCouponCode_(row.Code) === normalized;
  }) || null;
}

function calculateCouponDiscount_(code, eligibleSubtotalUSD, atDate) {
  const normalized = normalizeCouponCode_(code);
  const empty = {code:'',descriptionEN:'',descriptionKH:'',discountUSD:0};
  if (!normalized) return empty;

  const coupon = findCouponByCode_(normalized);
  if (!coupon || !bool_(coupon.Active)) {
    throw new Error('Coupon code is invalid or inactive.');
  }

  const now = atDate instanceof Date ? atDate : new Date();
  const start = coupon.StartDate ? new Date(coupon.StartDate) : null;
  const end = coupon.EndDate ? new Date(coupon.EndDate) : null;
  if (start && !isNaN(start.getTime()) && now < start) {
    throw new Error('This coupon is not active yet.');
  }
  if (end && !isNaN(end.getTime())) {
    // Date-only coupons remain valid through the selected day; datetime coupons expire exactly at the selected time.
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 && end.getMilliseconds() === 0) {
      end.setHours(23,59,59,999);
    }
    if (now > end) throw new Error('This coupon has expired.');
  }

  const usageLimit = Math.max(0, Math.floor(number_(coupon.UsageLimit)));
  const usedCount = Math.max(0, Math.floor(number_(coupon.UsedCount)));
  if (usageLimit > 0 && usedCount >= usageLimit) {
    throw new Error('This coupon has reached its usage limit.');
  }

  const subtotal = Math.max(0, roundMoney_(eligibleSubtotalUSD));
  const minimum = Math.max(0, roundMoney_(coupon.MinSpendUSD));
  if (subtotal + 0.000001 < minimum) {
    throw new Error('Minimum spend for this coupon is $' + minimum.toFixed(2) + '.');
  }

  const type = String(coupon.DiscountType || 'PERCENT').toUpperCase();
  const value = Math.max(0, number_(coupon.DiscountValue));
  let discount = type === 'FIXED'
    ? value
    : subtotal * Math.min(100, value) / 100;

  const maxDiscount = Math.max(0, number_(coupon.MaxDiscountUSD));
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  discount = Math.min(subtotal, roundMoney_(discount));

  return {
    code: normalized,
    descriptionEN: String(coupon.DescriptionEN || normalized),
    descriptionKH: String(coupon.DescriptionKH || coupon.DescriptionEN || normalized),
    discountUSD: discount
  };
}

function incrementCouponUsageLocked_(code) {
  const coupon = findCouponByCode_(code);
  if (!coupon) return;
  updateRowObject_(POS.SHEETS.COUPONS, coupon._row, {
    UsedCount: Math.max(0, Math.floor(number_(coupon.UsedCount))) + 1,
    UpdatedAt: new Date()
  });
}

function listCoupons(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  return getRows_(POS.SHEETS.COUPONS).map(function(row) {
    return {
      couponId:String(row.CouponID), code:String(row.Code || ''),
      descriptionEN:String(row.DescriptionEN || ''), descriptionKH:String(row.DescriptionKH || ''),
      discountType:String(row.DiscountType || 'PERCENT'), discountValue:number_(row.DiscountValue),
      minSpendUSD:number_(row.MinSpendUSD), maxDiscountUSD:number_(row.MaxDiscountUSD),
      startDate:row.StartDate ? new Date(row.StartDate).toISOString() : '',
      endDate:row.EndDate ? new Date(row.EndDate).toISOString() : '',
      usageLimit:number_(row.UsageLimit), usedCount:number_(row.UsedCount), active:bool_(row.Active)
    };
  });
}


/* ==========================================================================
 * SOURCE: CustomerCredit.gs
 * ========================================================================== */
function receivableStatus_(row, atDate) {
  const balance = roundMoney_(number_(row.BalanceUSD));
  if (balance <= 0.000001) return 'PAID';
  const due = reportDate_(row.DueDate);
  const now = atDate || new Date();
  if (due && due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return 'OVERDUE';
  if (number_(row.PaidUSD) > 0) return 'PARTIAL';
  return 'OPEN';
}

function refreshCustomerCreditBalanceLocked_(customerId) {
  const receivables = getRows_(POS.SHEETS.RECEIVABLES).filter(function(row) {
    return String(row.CustomerID) === String(customerId) && number_(row.BalanceUSD) > 0.000001;
  });
  const balance = roundMoney_(receivables.reduce(function(sum,row) {
    return sum + number_(row.BalanceUSD);
  }, 0));
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (customer) {
    updateRowObject_(POS.SHEETS.CUSTOMERS, customer._row, {
      CreditBalanceUSD: balance,
      UpdatedAt: new Date()
    });
  }
  return balance;
}

function createReceivableLocked_(payload) {
  const amount = roundMoney_(number_(payload.amountUSD));
  if (amount <= 0) return null;
  const now = new Date();
  const receivableId = uuid_('RCV');
  appendObject_(POS.SHEETS.RECEIVABLES, {
    ReceivableID: receivableId,
    CustomerID: String(payload.customerId || ''),
    SaleID: String(payload.saleId || ''),
    InvoiceNo: String(payload.invoiceNo || ''),
    InvoiceDate: payload.invoiceDate || now,
    DueDate: payload.dueDate || now,
    OriginalAmountUSD: amount,
    PaidUSD: 0,
    BalanceUSD: amount,
    Status: 'OPEN',
    CreatedAt: now,
    UpdatedAt: now
  });
  refreshCustomerCreditBalanceLocked_(payload.customerId);
  return receivableId;
}

function getCustomerOutstanding_(customerId) {
  return roundMoney_(getRows_(POS.SHEETS.RECEIVABLES)
    .filter(function(row) {
      return String(row.CustomerID) === String(customerId) && number_(row.BalanceUSD) > 0.000001;
    })
    .reduce(function(sum,row) { return sum + number_(row.BalanceUSD); }, 0));
}

function getCreditAccountsData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.CASHIER, POS.ROLES.ACCOUNTANT]);
  filters = filters || {};
  const query = sanitizeText_(filters.query,120).toLowerCase();
  const statusFilter = String(filters.status || '').toUpperCase();
  const now = new Date();
  const customers = {};
  getRows_(POS.SHEETS.CUSTOMERS).forEach(function(row) {
    customers[String(row.CustomerID)] = row;
  });

  const receivables = getRows_(POS.SHEETS.RECEIVABLES)
    .map(function(row) {
      const status = receivableStatus_(row, now);
      return {
        receivableId:String(row.ReceivableID||''),
        customerId:String(row.CustomerID||''),
        saleId:String(row.SaleID||''),
        invoiceNo:String(row.InvoiceNo||''),
        invoiceDate:reportDate_(row.InvoiceDate) ? reportDate_(row.InvoiceDate).toISOString() : '',
        dueDate:reportDate_(row.DueDate) ? reportDate_(row.DueDate).toISOString() : '',
        originalAmountUSD:roundMoney_(number_(row.OriginalAmountUSD)),
        paidUSD:roundMoney_(number_(row.PaidUSD)),
        balanceUSD:roundMoney_(number_(row.BalanceUSD)),
        status:status
      };
    })
    .filter(function(row) {
      if (statusFilter && row.status !== statusFilter) return false;
      const c = customers[row.customerId] || {};
      const hay = [row.invoiceNo,c.Name,c.Phone,c.CustomerID].join(' ').toLowerCase();
      return !query || hay.indexOf(query) >= 0;
    })
    .sort(function(a,b) {
      const ad = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
      const bd = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
      return ad - bd;
    });

  const accountMap = {};
  receivables.forEach(function(r) {
    const c = customers[r.customerId] || {};
    if (!accountMap[r.customerId]) {
      accountMap[r.customerId] = {
        customerId:r.customerId,
        name:String(c.Name||''),
        customerType:String(c.CustomerType||'RETAIL'),
        phone:String(c.Phone||''),
        creditLimitUSD:roundMoney_(number_(c.CreditLimitUSD)),
        outstandingUSD:0,
        overdueUSD:0,
        openInvoices:0,
        overdueInvoices:0,
        nextDueDate:'',
        active:bool_(c.Active)
      };
    }
    const account = accountMap[r.customerId];
    account.outstandingUSD = roundMoney_(account.outstandingUSD + r.balanceUSD);
    if (r.status === 'OVERDUE') {
      account.overdueUSD = roundMoney_(account.overdueUSD + r.balanceUSD);
      account.overdueInvoices++;
    }
    if (r.balanceUSD > 0) account.openInvoices++;
    if (r.dueDate && (!account.nextDueDate || new Date(r.dueDate) < new Date(account.nextDueDate))) {
      account.nextDueDate = r.dueDate;
    }
  });

  const accounts = Object.keys(accountMap).map(function(id) {
    const a = accountMap[id];
    a.availableCreditUSD = Math.max(0, roundMoney_(a.creditLimitUSD - a.outstandingUSD));
    return a;
  }).sort(function(a,b){return b.outstandingUSD-a.outstandingUSD;});

  return {
    accounts:accounts,
    receivables:receivables.map(function(r) {
      const c = customers[r.customerId] || {};
      r.customerName = String(c.Name||'');
      r.customerType = String(c.CustomerType||'RETAIL');
      r.phone = String(c.Phone||'');
      return r;
    }),
    totals:{
      customers:accounts.length,
      outstandingUSD:roundMoney_(accounts.reduce(function(s,a){return s+a.outstandingUSD;},0)),
      overdueUSD:roundMoney_(accounts.reduce(function(s,a){return s+a.overdueUSD;},0)),
      openInvoices:receivables.filter(function(r){return r.balanceUSD>0;}).length,
      overdueInvoices:receivables.filter(function(r){return r.status==='OVERDUE';}).length
    }
  };
}

function recordCustomerPayment(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.CASHIER, POS.ROLES.ACCOUNTANT]);
  payload = payload || {};
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', payload.customerId);
  if (!customer || !bool_(customer.Active)) throw new Error('Active customer was not found.');

  const currency = String(payload.currency || 'USD').toUpperCase() === 'KHR' ? 'KHR' : 'USD';
  const settings = getSettings_();
  const exchangeRate = number_(settings.EXCHANGE_RATE,4100);
  const rawAmount = number_(payload.amount);
  const amountUSD = currency === 'KHR'
    ? roundMoney_(rawAmount / exchangeRate)
    : roundMoney_(rawAmount);
  if (amountUSD <= 0) throw new Error('Payment amount must be greater than zero.');

  return withScriptLock_(function() {
    let open = getRows_(POS.SHEETS.RECEIVABLES)
      .filter(function(row) {
        return String(row.CustomerID) === String(customer.CustomerID) && number_(row.BalanceUSD) > 0.000001;
      })
      .sort(function(a,b) {
        const ad = reportDate_(a.DueDate) || reportDate_(a.InvoiceDate) || new Date(0);
        const bd = reportDate_(b.DueDate) || reportDate_(b.InvoiceDate) || new Date(0);
        return ad-bd;
      });

    if (payload.receivableId) {
      open.sort(function(a,b) {
        if (String(a.ReceivableID) === String(payload.receivableId)) return -1;
        if (String(b.ReceivableID) === String(payload.receivableId)) return 1;
        return 0;
      });
    }

    const outstanding = roundMoney_(open.reduce(function(s,r){return s+number_(r.BalanceUSD);},0));
    if (amountUSD > outstanding + 0.005) {
      throw new Error('Payment exceeds the customer outstanding balance of $' + outstanding.toFixed(2) + '.');
    }

    const paymentId = uuid_('CPM');
    const now = new Date();
    const shift = getOpenShiftForUser_(user.UserID);
    appendObject_(POS.SHEETS.CUSTOMER_PAYMENTS, {
      CustomerPaymentID:paymentId,
      CustomerID:customer.CustomerID,
      DateTime:now,
      Method:String(payload.method||'CASH').toUpperCase()==='BANK'?'BANK':'CASH',
      Currency:currency,
      Amount:rawAmount,
      AmountUSD:amountUSD,
      Reference:sanitizeText_(payload.reference,120),
      ShiftID:shift ? shift.ShiftID : '',
      UserID:user.UserID,
      Notes:sanitizeText_(payload.notes,250),
      CreatedAt:now
    });

    let remaining = amountUSD;
    const allocations = [];
    open.forEach(function(row) {
      if (remaining <= 0.000001) return;
      const balance = roundMoney_(number_(row.BalanceUSD));
      const applied = roundMoney_(Math.min(balance, remaining));
      if (applied <= 0) return;
      const newPaid = roundMoney_(number_(row.PaidUSD) + applied);
      const newBalance = roundMoney_(balance - applied);
      const receivableStatus = newBalance <= 0.000001 ? 'PAID' : 'PARTIAL';
      updateRowObject_(POS.SHEETS.RECEIVABLES, row._row, {
        PaidUSD:newPaid,
        BalanceUSD:newBalance,
        Status:receivableStatus,
        UpdatedAt:now
      });
      const saleRow = row.SaleID ? findRowBy_(POS.SHEETS.SALES, 'SaleID', row.SaleID) : null;
      if (saleRow) {
        const totalPaid = roundMoney_(number_(saleRow.AmountPaidUSD) + applied);
        updateRowObject_(POS.SHEETS.SALES, saleRow._row, {
          AmountPaidUSD:totalPaid,
          CreditAmountUSD:newBalance,
          PaymentStatus:newBalance <= 0.000001 ? POS.PAYMENT_STATUS.PAID : POS.PAYMENT_STATUS.PARTIAL,
          CreditStatus:receivableStatus
        });
      }
      const allocation = {
        AllocationID:uuid_('CPA'),
        CustomerPaymentID:paymentId,
        ReceivableID:String(row.ReceivableID),
        SaleID:String(row.SaleID||''),
        AmountUSD:applied,
        CreatedAt:now
      };
      allocations.push(allocation);
      remaining = roundMoney_(remaining - applied);
    });
    appendObjects_(POS.SHEETS.CUSTOMER_PAYMENT_ALLOCATIONS, allocations);
    const balanceAfter = refreshCustomerCreditBalanceLocked_(customer.CustomerID);
    audit_(user.UserID,'CUSTOMER_PAYMENT','Customer',customer.CustomerID,{
      paymentId:paymentId, amountUSD:amountUSD, method:payload.method, balanceAfter:balanceAfter
    });

    return {
      success:true,
      paymentId:paymentId,
      customerId:String(customer.CustomerID),
      customerName:String(customer.Name||''),
      customerType:String(customer.CustomerType||'RETAIL'),
      dateTime:now.toISOString(),
      method:String(payload.method||'CASH').toUpperCase()==='BANK'?'BANK':'CASH',
      currency:currency,
      amount:rawAmount,
      amountUSD:amountUSD,
      reference:sanitizeText_(payload.reference,120),
      balanceAfterUSD:balanceAfter,
      allocations:allocations
    };
  });
}

function getCustomerStatement(sessionToken, customerId, fromValue, toValue) {
  requireSession_(sessionToken);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',customerId);
  if (!customer) throw new Error('Customer not found.');
  const range = reportRange_(fromValue,toValue);
  const receivables = getRows_(POS.SHEETS.RECEIVABLES).filter(function(row) {
    return String(row.CustomerID)===String(customerId) && reportInRange_(row.InvoiceDate||row.CreatedAt,range);
  });
  const payments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).filter(function(row) {
    return String(row.CustomerID)===String(customerId) && reportInRange_(row.DateTime||row.CreatedAt,range);
  });
  const entries = [];
  receivables.forEach(function(r) {
    entries.push({
      dateTime:reportDate_(r.InvoiceDate||r.CreatedAt).toISOString(),
      type:'INVOICE', reference:String(r.InvoiceNo||''), debitUSD:number_(r.OriginalAmountUSD),
      creditUSD:0, dueDate:reportDate_(r.DueDate)?reportDate_(r.DueDate).toISOString():''
    });
  });
  payments.forEach(function(p) {
    entries.push({
      dateTime:reportDate_(p.DateTime||p.CreatedAt).toISOString(),
      type:'PAYMENT', reference:String(p.Reference||p.CustomerPaymentID||''), debitUSD:0,
      creditUSD:number_(p.AmountUSD), method:String(p.Method||'')
    });
  });
  entries.sort(function(a,b){return new Date(a.dateTime)-new Date(b.dateTime);});
  let running = 0;
  entries.forEach(function(e){running=roundMoney_(running+e.debitUSD-e.creditUSD);e.balanceUSD=running;});
  return {
    customer:customerToPublic_(customer),
    entries:entries,
    outstandingUSD:getCustomerOutstanding_(customerId)
  };
}


/* ==========================================================================
 * SOURCE: Customers.gs
 * ========================================================================== */
function listActiveCustomers_() {
  return getRows_(POS.SHEETS.CUSTOMERS)
    .filter(function(row) { return bool_(row.Active); })
    .sort(function(a, b) { return String(a.Name || '').localeCompare(String(b.Name || '')); })
    .map(customerToPublic_);
}

function customerToPublic_(row) {
  return {
    customerId: String(row.CustomerID || ''),
    name: String(row.Name || ''),
    customerType: String(row.CustomerType || 'RETAIL').toUpperCase(),
    phone: String(row.Phone || ''),
    email: String(row.Email || ''),
    address: String(row.Address || ''),
    notes: String(row.Notes || ''),
    points: number_(row.Points),
    creditLimitUSD: number_(row.CreditLimitUSD),
    creditBalanceUSD: number_(row.CreditBalanceUSD),
    paymentTermsDays: Math.max(0, Math.round(number_(row.PaymentTermsDays, 30))),
    active: bool_(row.Active),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : '',
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : ''
  };
}

function getCustomersModuleData(sessionToken, filters) {
  requireSession_(sessionToken);
  filters = filters || {};
  const query = sanitizeText_(filters.query, 120).toLowerCase();
  const includeInactive = filters.includeInactive === true;
  const typeFilter = String(filters.customerType || '').toUpperCase();

  const sales = getRows_(POS.SHEETS.SALES).filter(function(row) {
    return String(row.Status || '') !== POS.SALE_STATUS.VOID;
  });
  const returns = getRowsIfSheetExists_(POS.SHEETS.RETURNS).filter(function(row) {
    return String(row.Status || 'COMPLETED') !== 'CANCELLED';
  });

  const salesByCustomer = {};
  sales.forEach(function(row) {
    const id = String(row.CustomerID || '');
    if (!id) return;
    if (!salesByCustomer[id]) salesByCustomer[id] = {transactions:0,grossUSD:0,lastPurchase:null};
    salesByCustomer[id].transactions += 1;
    salesByCustomer[id].grossUSD += number_(row.TotalUSD);
    const date = new Date(row.DateTime || row.CreatedAt || 0);
    if (!isNaN(date.getTime()) && (!salesByCustomer[id].lastPurchase || date > salesByCustomer[id].lastPurchase)) {
      salesByCustomer[id].lastPurchase = date;
    }
  });

  const refundByCustomer = {};
  const saleCustomerMap = {};
  sales.forEach(function(row) { saleCustomerMap[String(row.SaleID)] = String(row.CustomerID || ''); });
  returns.forEach(function(row) {
    const customerId = saleCustomerMap[String(row.SaleID)] || '';
    if (!customerId) return;
    refundByCustomer[customerId] = number_(refundByCustomer[customerId]) + number_(row.AmountUSD);
  });

  const customers = getRows_(POS.SHEETS.CUSTOMERS)
    .filter(function(row) {
      if (!includeInactive && !bool_(row.Active)) return false;
      if (typeFilter && String(row.CustomerType || 'RETAIL').toUpperCase() !== typeFilter) return false;
      const haystack = [row.CustomerID,row.Name,row.CustomerType,row.Phone,row.Email,row.Address].join(' ').toLowerCase();
      return !query || haystack.indexOf(query) >= 0;
    })
    .sort(function(a,b){return String(a.Name || '').localeCompare(String(b.Name || ''));})
    .map(function(row) {
      const out = customerToPublic_(row);
      const stats = salesByCustomer[out.customerId] || {transactions:0,grossUSD:0,lastPurchase:null};
      const refunds = roundMoney_(number_(refundByCustomer[out.customerId]));
      out.transactions = stats.transactions;
      out.grossSalesUSD = roundMoney_(stats.grossUSD);
      out.refundsUSD = refunds;
      out.netSalesUSD = roundMoney_(stats.grossUSD - refunds);
      out.averageSaleUSD = stats.transactions ? roundMoney_(out.netSalesUSD / stats.transactions) : 0;
      out.lastPurchase = stats.lastPurchase ? stats.lastPurchase.toISOString() : '';
      out.outstandingUSD = getCustomerOutstanding_(out.customerId);
      out.availableCreditUSD = Math.max(0, roundMoney_(out.creditLimitUSD - out.outstandingUSD));
      return out;
    });

  return {
    customers: customers,
    metrics: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(function(c){return c.active;}).length,
      repeatCustomers: customers.filter(function(c){return c.transactions > 1;}).length,
      netSalesUSD: roundMoney_(customers.reduce(function(sum,c){return sum + c.netSalesUSD;},0)),
      outstandingUSD: roundMoney_(customers.reduce(function(sum,c){return sum + c.outstandingUSD;},0))
    }
  };
}

function saveCustomer(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'CUSTOMERS');
  payload = payload || {};
  const name = sanitizeText_(payload.name, 120);
  if (!name) throw new Error('Customer name is required.');

  const phone = sanitizeText_(payload.phone, 40);
  if (phone) {
    const duplicate = getRows_(POS.SHEETS.CUSTOMERS).find(function(row) {
      return String(row.Phone || '') === phone && String(row.CustomerID) !== String(payload.customerId || '');
    });
    if (duplicate) throw new Error('This phone number already belongs to another customer.');
  }

  const existing = payload.customerId
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', payload.customerId)
    : null;
  const now = new Date();
  const customerType = ['RETAIL','WHOLESALE','VIP','CREDIT'].indexOf(String(payload.customerType||'RETAIL').toUpperCase()) >= 0
    ? String(payload.customerType||'RETAIL').toUpperCase()
    : 'RETAIL';
  const changes = {
    Name: name,
    CustomerType: customerType,
    Phone: phone,
    Email: sanitizeText_(payload.email, 120),
    Address: sanitizeText_(payload.address, 250),
    Notes: sanitizeText_(payload.notes, 500),
    Active: payload.active !== false,
    UpdatedAt: now
  };

  if ([POS.ROLES.ADMIN, POS.ROLES.MANAGER].indexOf(user.Role) >= 0) {
    changes.CreditLimitUSD = Math.max(0, roundMoney_(number_(payload.creditLimitUSD)));
    changes.PaymentTermsDays = Math.max(0, Math.round(number_(payload.paymentTermsDays,30)));
  }

  let customerId;
  if (existing) {
    customerId = String(existing.CustomerID);
    updateRowObject_(POS.SHEETS.CUSTOMERS, existing._row, changes);
  } else {
    customerId = uuid_('CUS');
    changes.CustomerID = customerId;
    changes.Points = 0;
    changes.CreditLimitUSD = changes.CreditLimitUSD || 0;
    changes.CreditBalanceUSD = 0;
    changes.PaymentTermsDays = changes.PaymentTermsDays || 30;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.CUSTOMERS, changes);
  }

  audit_(user.UserID, existing ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER', 'Customer', customerId, changes);
  return {success:true, customerId:customerId};
}

function getCustomerDetails(sessionToken, customerId) {
  requireSession_(sessionToken);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (!customer) throw new Error('Customer not found.');

  const sales = getRows_(POS.SHEETS.SALES)
    .filter(function(row){return String(row.CustomerID || '') === String(customerId) && String(row.Status || '') !== POS.SALE_STATUS.VOID;})
    .sort(function(a,b){return new Date(b.DateTime || 0)-new Date(a.DateTime || 0);})
    .slice(0,100)
    .map(function(row){
      return {
        saleId:String(row.SaleID), invoiceNo:String(row.InvoiceNo || ''),
        dateTime:new Date(row.DateTime || row.CreatedAt).toISOString(),
        totalUSD:number_(row.TotalUSD), paymentMethod:String(row.PaymentMethod || ''),
        paymentStatus:String(row.PaymentStatus||''),
        creditAmountUSD:number_(row.CreditAmountUSD),
        status:String(row.Status || '')
      };
    });

  const receivables = getRows_(POS.SHEETS.RECEIVABLES)
    .filter(function(row){return String(row.CustomerID)===String(customerId);})
    .sort(function(a,b){return new Date(b.InvoiceDate||0)-new Date(a.InvoiceDate||0);})
    .map(function(row){
      return {
        receivableId:String(row.ReceivableID||''), saleId:String(row.SaleID||''),
        invoiceNo:String(row.InvoiceNo||''), invoiceDate:reportDate_(row.InvoiceDate)?reportDate_(row.InvoiceDate).toISOString():'',
        dueDate:reportDate_(row.DueDate)?reportDate_(row.DueDate).toISOString():'',
        originalAmountUSD:number_(row.OriginalAmountUSD), paidUSD:number_(row.PaidUSD),
        balanceUSD:number_(row.BalanceUSD), status:receivableStatus_(row,new Date())
      };
    });

  return {customer:customerToPublic_(customer), sales:sales, receivables:receivables};
}


/* ==========================================================================
 * SOURCE: DatabaseMaintenanceV42.gs
 * ========================================================================== */
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


/* ==========================================================================
 * SOURCE: EntityStatus.gs
 * ========================================================================== */
function setEntityActive(sessionToken, entityType, entityId, active) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK]);

  const type = String(entityType || '').toUpperCase();
  const map = {
    PRODUCT: {sheet: POS.SHEETS.PRODUCTS, idField: 'ProductID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]},
    CUSTOMER: {sheet: POS.SHEETS.CUSTOMERS, idField: 'CustomerID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER]},
    SUPPLIER: {sheet: POS.SHEETS.SUPPLIERS, idField: 'SupplierID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]},
    CATEGORY: {sheet: POS.SHEETS.CATEGORIES, idField: 'CategoryID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER]},
    UNIT: {sheet: POS.SHEETS.UNITS, idField: 'UnitID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER]},
    COUPON: {sheet: POS.SHEETS.COUPONS, idField: 'CouponID', roles:[POS.ROLES.ADMIN,POS.ROLES.MANAGER]}
  };
  const config = map[type];
  if (!config) throw new Error('Unsupported status entity.');
  requireRole_(user, config.roles);
  const row = findRowBy_(config.sheet, config.idField, entityId);
  if (!row) throw new Error(type + ' was not found.');
  updateRowObject_(config.sheet, row._row, {Active: active === true, UpdatedAt:new Date()});
  audit_(user.UserID, 'SET_ACTIVE', type, String(entityId), {active:active===true});
  return {success:true, entityType:type, entityId:String(entityId), active:active===true};
}


/* ==========================================================================
 * SOURCE: FifoInventory.gs
 * ========================================================================== */
/** FIFO stock-lot helpers. Must be called while the script lock is held. */

function createStockLotLocked_(payload) {
  payload = payload || {};
  const quantity = Math.round(number_(payload.quantity) * 1000) / 1000;
  if (quantity <= 0) throw new Error('FIFO lot quantity must be greater than zero.');

  const unitCost = roundMoney_(number_(payload.unitCostUSD));
  const now = new Date();
  const lotId = uuid_('LOT');

  appendObject_(PURCHASE_FIFO.SHEETS.STOCK_LOTS, {
    LotID: lotId,
    BranchID: sanitizeText_(payload.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
    ProductID: sanitizeText_(payload.productId, 80),
    PurchaseID: sanitizeText_(payload.purchaseId, 80),
    ReceiptID: sanitizeText_(payload.receiptId, 80),
    ReceivedAt: payload.receivedAt ? new Date(payload.receivedAt) : now,
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

function createOpeningStockLotLocked_(productId, quantity, unitCostUSD, userId, note, branchId) {
  return createStockLotLocked_({
    productId: productId,
    branchId: branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
    receivedAt: new Date(),
    unitCostUSD: unitCostUSD,
    quantity: quantity,
    referenceType: 'OPENING',
    referenceId: productId,
    note: note || 'Opening stock'
  });
}

/**
 * Builds a FIFO consumption plan without changing any sheets.
 * This allows every product to be validated before a sale/adjustment writes data.
 */
function planFifoAllocationsLocked_(items, branchId) {
  branchId = branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const allLots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS)
    .filter(function(lot) {
      return number_(lot.QtyRemaining) > 0.0000001 &&
        String(lot.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === String(branchId);
    })
    .sort(function(a, b) {
      const dateDiff = new Date(a.ReceivedAt).getTime() - new Date(b.ReceivedAt).getTime();
      return dateDiff || number_(a._row) - number_(b._row);
    });

  const lotsByProduct = {};
  allLots.forEach(function(lot) {
    const productId = String(lot.ProductID);
    if (!lotsByProduct[productId]) lotsByProduct[productId] = [];
    lotsByProduct[productId].push({
      row: lot._row,
      lotId: String(lot.LotID),
      unitCostUSD: number_(lot.UnitCostUSD),
      remaining: number_(lot.QtyRemaining),
      receivedAt: lot.ReceivedAt,
      branchId: String(lot.BranchID || branchId)
    });
  });

  const itemPlans = [];
  const finalLotRemaining = {};

  (items || []).forEach(function(item) {
    const productId = String(item.productId);
    const requestedQty = Math.round(number_(item.qty) * 1000) / 1000;
    let needed = requestedQty;
    let totalCost = 0;
    const allocations = [];
    const lots = lotsByProduct[productId] || [];

    lots.forEach(function(lot) {
      if (needed <= 0.0000001 || lot.remaining <= 0.0000001) return;
      const take = Math.round(Math.min(needed, lot.remaining) * 1000) / 1000;
      const cost = roundMoney_(take * lot.unitCostUSD);

      allocations.push({
        lotId: lot.lotId,
        lotRow: lot.row,
        qty: take,
        unitCostUSD: lot.unitCostUSD,
        costUSD: cost,
        branchId: lot.branchId
      });

      lot.remaining = Math.round((lot.remaining - take) * 1000) / 1000;
      needed = Math.round((needed - take) * 1000) / 1000;
      totalCost = roundMoney_(totalCost + cost);
      finalLotRemaining[lot.row] = lot.remaining;
    });

    if (needed > 0.0005) {
      const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
      const name = product ? (product.NameEN || product.NameKH || productId) : productId;
      throw new Error(
        name + ' does not have enough FIFO stock lots. Missing quantity: ' + needed +
        '. Run installPurchaseFifoFeature() or checkFifoInventory().'
      );
    }

    itemPlans.push({
      productId: productId,
      qty: requestedQty,
      totalCostUSD: totalCost,
      averageUnitCostUSD: requestedQty > 0 ? Math.round((totalCost / requestedQty) * 10000) / 10000 : 0,
      allocations: allocations
    });
  });

  return {
    itemPlans: itemPlans,
    finalLotRemaining: finalLotRemaining
  };
}

function applyFifoPlanLocked_(plan, references) {
  const now = new Date();
  const lotSheetName = PURCHASE_FIFO.SHEETS.STOCK_LOTS;
  const lotUpdates = plan && plan.finalLotRemaining ? plan.finalLotRemaining : {};

  Object.keys(lotUpdates).forEach(function(rowKey) {
    const remaining = Math.round(number_(lotUpdates[rowKey]) * 1000) / 1000;
    updateRowObject_(lotSheetName, Number(rowKey), {
      QtyRemaining: remaining,
      Status: remaining <= 0.0000001 ? 'CLOSED' : 'PARTIAL',
      UpdatedAt: now
    });
  });

  const allocationRows = [];
  (plan.itemPlans || []).forEach(function(itemPlan, index) {
    const reference = references[index] || {};
    itemPlan.allocations.forEach(function(allocation) {
      allocationRows.push({
        AllocationID: uuid_('FIF'),
        DateTime: now,
        BranchID: sanitizeText_(reference.branchId || allocation.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
        ProductID: itemPlan.productId,
        LotID: allocation.lotId,
        Qty: allocation.qty,
        UnitCostUSD: allocation.unitCostUSD,
        CostUSD: allocation.costUSD,
        ReferenceType: sanitizeText_(reference.referenceType, 40),
        ReferenceID: sanitizeText_(reference.referenceId, 80),
        UserID: sanitizeText_(reference.userId, 80),
        Note: sanitizeText_(reference.note, 250)
      });
    });
  });

  appendObjects_(PURCHASE_FIFO.SHEETS.FIFO_ALLOCATIONS, allocationRows);
}

function getFifoStockSummary_(productId, branchId) {
  branchId = branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS)
    .filter(function(lot) {
      return String(lot.ProductID) === String(productId) &&
        String(lot.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === String(branchId) &&
        number_(lot.QtyRemaining) > 0.0000001;
    })
    .sort(function(a, b) {
      return new Date(a.ReceivedAt) - new Date(b.ReceivedAt) || a._row - b._row;
    });

  const totalQty = lots.reduce(function(sum, lot) {
    return sum + number_(lot.QtyRemaining);
  }, 0);
  const totalCost = lots.reduce(function(sum, lot) {
    return sum + number_(lot.QtyRemaining) * number_(lot.UnitCostUSD);
  }, 0);

  return {
    totalQty: Math.round(totalQty * 1000) / 1000,
    totalCostUSD: roundMoney_(totalCost),
    averageCostUSD: totalQty > 0 ? Math.round((totalCost / totalQty) * 10000) / 10000 : 0,
    oldestUnitCostUSD: lots.length ? number_(lots[0].UnitCostUSD) : 0,
    newestUnitCostUSD: lots.length ? number_(lots[lots.length - 1].UnitCostUSD) : 0,
    lots: lots
  };
}

function getProductFifoLots(sessionToken, productId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK, POS.ROLES.ACCOUNTANT]);
  const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
  if (!product) throw new Error('Product not found.');
  const branchId = getUserBranchId_(user);
  const summary = getFifoStockSummary_(productId, branchId);
  return {
    productId: String(product.ProductID),
    productName: String(product.NameEN || product.NameKH || ''),
    branchId: branchId,
    currentStock: getBranchStockQty_(branchId, productId),
    totalQty: summary.totalQty,
    totalCostUSD: summary.totalCostUSD,
    averageCostUSD: summary.averageCostUSD,
    oldestUnitCostUSD: summary.oldestUnitCostUSD,
    newestUnitCostUSD: summary.newestUnitCostUSD,
    lots: summary.lots.map(function(lot) {
      return {
        lotId: String(lot.LotID),
        branchId: String(lot.BranchID || branchId),
        receivedAt: new Date(lot.ReceivedAt).toISOString(),
        unitCostUSD: number_(lot.UnitCostUSD),
        qtyReceived: number_(lot.QtyReceived),
        qtyRemaining: number_(lot.QtyRemaining),
        status: String(lot.Status || ''),
        referenceType: String(lot.ReferenceType || ''),
        referenceId: String(lot.ReferenceID || ''),
        note: String(lot.Note || '')
      };
    })
  };
}


/* ==========================================================================
 * SOURCE: ManagementAdmin.gs
 * ========================================================================== */
/** Tiny POS v3.1 management helpers: coupons, audit log, safe customer deletion. */

function saveCoupon(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  payload = payload || {};
  const code = normalizeCouponCode_(payload.code);
  if (!code) throw new Error('Coupon code is required.');
  const type = String(payload.discountType || 'PERCENT').toUpperCase();
  if (['PERCENT','FIXED'].indexOf(type) < 0) throw new Error('Invalid coupon discount type.');
  const value = Math.max(0, number_(payload.discountValue));
  if (type === 'PERCENT' && value > 100) throw new Error('Percentage coupon cannot exceed 100%.');
  if (value <= 0) throw new Error('Coupon value must be greater than zero.');

  const existingByCode = findCouponByCode_(code);
  const existing = payload.couponId ? findRowBy_(POS.SHEETS.COUPONS, 'CouponID', payload.couponId) : existingByCode;
  if (existingByCode && (!existing || String(existingByCode.CouponID) !== String(existing.CouponID))) {
    throw new Error('This coupon code already exists.');
  }

  const now = new Date();
  const changes = {
    Code: code,
    DescriptionEN: sanitizeText_(payload.descriptionEN, 160),
    DescriptionKH: sanitizeText_(payload.descriptionKH, 160),
    DiscountType: type,
    DiscountValue: value,
    MinSpendUSD: Math.max(0, roundMoney_(number_(payload.minSpendUSD))),
    MaxDiscountUSD: Math.max(0, roundMoney_(number_(payload.maxDiscountUSD))),
    StartDate: payload.startDate ? new Date(payload.startDate) : '',
    EndDate: payload.endDate ? new Date(payload.endDate) : '',
    UsageLimit: Math.max(0, Math.floor(number_(payload.usageLimit))),
    Active: payload.active !== false,
    UpdatedAt: now
  };
  if (changes.StartDate && isNaN(changes.StartDate.getTime())) throw new Error('Invalid coupon start date/time.');
  if (changes.EndDate && isNaN(changes.EndDate.getTime())) throw new Error('Invalid coupon end date/time.');
  if (changes.StartDate && changes.EndDate && changes.EndDate < changes.StartDate) throw new Error('Coupon end date must be after the start date.');

  let couponId;
  if (existing) {
    couponId = String(existing.CouponID);
    updateRowObject_(POS.SHEETS.COUPONS, existing._row, changes);
  } else {
    couponId = uuid_('CPN');
    changes.CouponID = couponId;
    changes.UsedCount = 0;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.COUPONS, changes);
  }
  audit_(user.UserID, existing ? 'UPDATE_COUPON' : 'CREATE_COUPON', 'Coupon', couponId, changes);
  return {success:true,couponId:couponId};
}

function deleteCoupon(sessionToken, couponId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  const row = findRowBy_(POS.SHEETS.COUPONS, 'CouponID', couponId);
  if (!row) throw new Error('Coupon not found.');
  if (number_(row.UsedCount) > 0) {
    updateRowObject_(POS.SHEETS.COUPONS, row._row, {Active:false,UpdatedAt:new Date()});
    audit_(user.UserID, 'DEACTIVATE_USED_COUPON', 'Coupon', couponId, {});
    return {success:true,deactivated:true};
  }
  getSheet_(POS.SHEETS.COUPONS).deleteRow(row._row);
  audit_(user.UserID, 'DELETE_COUPON', 'Coupon', couponId, {});
  return {success:true,deleted:true};
}

function listAuditLogs(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  filters = filters || {};
  const query = sanitizeText_(filters.query, 160).toLowerCase();
  const range = reportRange_(filters.from, filters.to);
  const users = {};
  getRows_(POS.SHEETS.USERS).forEach(function(u){users[String(u.UserID)] = String(u.Name || u.LoginID || u.UserID);});
  return getRows_(POS.SHEETS.AUDIT)
    .filter(function(row){
      const d = reportDate_(row.DateTime);
      if (!d || d < range.from || d > range.to) return false;
      const hay = [row.Action,row.Entity,row.EntityID,row.DetailsJSON,users[String(row.UserID)]].join(' ').toLowerCase();
      return !query || hay.indexOf(query) >= 0;
    })
    .sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);})
    .slice(0,1000)
    .map(function(row){
      return {auditId:String(row.AuditID||''),dateTime:new Date(row.DateTime).toISOString(),userName:users[String(row.UserID)]||String(row.UserID||''),action:String(row.Action||''),entity:String(row.Entity||''),entityId:String(row.EntityID||''),details:String(row.DetailsJSON||'')};
    });
}

function deleteCustomer(sessionToken, customerId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (!customer) throw new Error('Customer not found.');
  const hasSales = getRows_(POS.SHEETS.SALES).some(function(r){return String(r.CustomerID||'')===String(customerId);});
  const hasReceivables = getRows_(POS.SHEETS.RECEIVABLES).some(function(r){return String(r.CustomerID||'')===String(customerId) && number_(r.BalanceUSD)>0.000001;});
  const hasPayments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).some(function(r){return String(r.CustomerID||'')===String(customerId);});
  if (hasSales || hasReceivables || hasPayments) {
    throw new Error('This customer has transaction history and cannot be deleted. Turn the customer inactive instead.');
  }
  getSheet_(POS.SHEETS.CUSTOMERS).deleteRow(customer._row);
  audit_(user.UserID, 'DELETE_CUSTOMER', 'Customer', customerId, {name:customer.Name});
  return {success:true};
}


/* ==========================================================================
 * SOURCE: Operations.gs
 * ========================================================================== */
function getOpenShiftForUser_(userId) {
  const shifts = getRows_(POS.SHEETS.SHIFTS)
    .filter(function(row) {
      return (
        String(row.UserID) ===
          String(userId) &&
        String(row.Status) === 'OPEN'
      );
    });

  return shifts.length
    ? shifts[shifts.length - 1]
    : null;
}

function openCashShift(
  sessionToken,
  openingUSD,
  openingKHR
) {
  const user = requireSession_(sessionToken);

  if (getOpenShiftForUser_(user.UserID)) {
    throw new Error(
      'You already have an open shift.'
    );
  }

  const shiftId = uuid_('SFT');

  appendObject_(POS.SHEETS.SHIFTS, {
    ShiftID: shiftId,
    UserID: user.UserID,
    OpenAt: new Date(),
    OpeningUSD: roundMoney_(
      number_(openingUSD)
    ),
    OpeningKHR: Math.round(
      number_(openingKHR)
    ),
    CloseAt: '',
    ClosingUSD: '',
    ClosingKHR: '',
    ExpectedUSD: '',
    ExpectedKHR: '',
    DifferenceUSD: '',
    DifferenceKHR: '',
    Status: 'OPEN'
  });

  audit_(
    user.UserID,
    'OPEN_SHIFT',
    'CashShift',
    shiftId,
    {
      openingUSD: openingUSD,
      openingKHR: openingKHR
    }
  );

  return {
    success: true,
    shiftId: shiftId
  };
}

function closeCashShift(
  sessionToken,
  closingUSD,
  closingKHR
) {
  const user = requireSession_(sessionToken);
  const shift = getOpenShiftForUser_(user.UserID);

  if (!shift) {
    throw new Error(
      'No open shift was found.'
    );
  }

  const sales = getRows_(POS.SHEETS.SALES)
    .filter(function(row) {
      return (
        String(row.ShiftID) ===
          String(shift.ShiftID) &&
        String(row.Status) !==
          POS.SALE_STATUS.VOID
      );
    });

  const saleIds = {};

  sales.forEach(function(row) {
    saleIds[String(row.SaleID)] = true;
  });

  const cashPayments = getRows_(
    POS.SHEETS.PAYMENTS
  ).filter(function(row) {
    return (
      saleIds[String(row.SaleID)] &&
      String(row.Method) === 'CASH' &&
      String(row.Status) ===
        POS.PAYMENT_STATUS.PAID
    );
  });

  let cashUSD = 0;
  let cashKHR = 0;

  cashPayments.forEach(function(row) {
    if (String(row.Currency) === 'KHR') {
      cashKHR += number_(row.Amount);
    } else {
      cashUSD += number_(row.Amount);
    }
  });

  const customerPayments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).filter(function(row) {
    return String(row.ShiftID) === String(shift.ShiftID) &&
      String(row.Method || '').toUpperCase() === 'CASH';
  });
  customerPayments.forEach(function(row) {
    if (String(row.Currency || 'USD').toUpperCase() === 'KHR') {
      cashKHR += number_(row.Amount);
    } else {
      cashUSD += number_(row.AmountUSD || row.Amount);
    }
  });

  const refundPayments = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS
  ).filter(function(row) {
    return (
      String(row.ShiftID) ===
        String(shift.ShiftID) &&
      String(row.Method) === 'CASH' &&
      String(row.Status) === 'PAID'
    );
  });

  let cashRefundUSD = 0;
  let cashRefundKHR = 0;

  refundPayments.forEach(function(row) {
    if (String(row.Currency) === 'KHR') {
      cashRefundKHR += number_(row.Amount);
    } else {
      cashRefundUSD += number_(row.Amount);
    }
  });

  const expenses = getRows_(POS.SHEETS.EXPENSES)
    .filter(function(row) {
      return String(row.ShiftID) ===
        String(shift.ShiftID);
    });

  const expenseUSD = expenses.reduce(
    function(sum, row) {
      return sum + number_(row.AmountUSD);
    },
    0
  );

  const expectedUSD = roundMoney_(
    number_(shift.OpeningUSD) +
    cashUSD -
    cashRefundUSD -
    expenseUSD
  );

  const expectedKHR = Math.round(
    number_(shift.OpeningKHR) +
    cashKHR -
    cashRefundKHR
  );

  const finalUSD = roundMoney_(
    number_(closingUSD)
  );

  const finalKHR = Math.round(
    number_(closingKHR)
  );

  updateRowObject_(
    POS.SHEETS.SHIFTS,
    shift._row,
    {
      CloseAt: new Date(),
      ClosingUSD: finalUSD,
      ClosingKHR: finalKHR,
      ExpectedUSD: expectedUSD,
      ExpectedKHR: expectedKHR,
      DifferenceUSD: roundMoney_(
        finalUSD - expectedUSD
      ),
      DifferenceKHR:
        finalKHR - expectedKHR,
      Status: 'CLOSED'
    }
  );

  audit_(
    user.UserID,
    'CLOSE_SHIFT',
    'CashShift',
    shift.ShiftID,
    {
      expectedUSD: expectedUSD,
      expectedKHR: expectedKHR,
      cashRefundUSD: cashRefundUSD,
      cashRefundKHR: cashRefundKHR
    }
  );

  return {
    success: true,
    expectedUSD: expectedUSD,
    expectedKHR: expectedKHR,
    cashRefundUSD: roundMoney_(
      cashRefundUSD
    ),
    cashRefundKHR: Math.round(
      cashRefundKHR
    ),
    differenceUSD: roundMoney_(
      finalUSD - expectedUSD
    ),
    differenceKHR:
      finalKHR - expectedKHR
  };
}

function recordExpense(
  sessionToken,
  payload
) {
  const user = requireSession_(sessionToken);
  payload = payload || {};

  const amount = roundMoney_(
    number_(payload.amountUSD)
  );

  if (amount <= 0) {
    throw new Error(
      'Expense amount must be greater than zero.'
    );
  }

  const shift = getOpenShiftForUser_(
    user.UserID
  );

  const expenseId = uuid_('EXP');

  appendObject_(POS.SHEETS.EXPENSES, {
    ExpenseID: expenseId,
    DateTime: new Date(),
    BranchID: resolveAccessibleBranchId_(user, payload.branchId, false),
    Category: sanitizeText_(
      payload.category,
      80
    ),
    AmountUSD: amount,
    Remark: sanitizeText_(
      payload.remark,
      250
    ),
    UserID: user.UserID,
    ShiftID: shift ? shift.ShiftID : '',
    CreatedAt: new Date()
  });

  audit_(
    user.UserID,
    'RECORD_EXPENSE',
    'Expense',
    expenseId,
    {
      amountUSD: amount
    }
  );

  return {
    success: true,
    expenseId: expenseId
  };
}

function getOperationsStatus(sessionToken) {
  const user = requireSession_(sessionToken);
  const shift = getOpenShiftForUser_(
    user.UserID
  );

  return {
    openShift: shift
      ? {
          shiftId: String(shift.ShiftID),
          openAt:
            new Date(shift.OpenAt).toISOString(),
          openingUSD:
            number_(shift.OpeningUSD),
          openingKHR:
            number_(shift.OpeningKHR)
        }
      : null
  };
}


/* ==========================================================================
 * SOURCE: OperationsScannerUpgradeV43.gs
 * ========================================================================== */
/**
 * Tiny POS Operations + Camera Scanner Upgrade v4.3
 *
 * Additive module. It does not replace Operations.gs, Reports.gs, Sales.gs,
 * Product Packaging, permissions, branches, or existing transaction sheets.
 */

const EXPENSE_V43 = Object.freeze({
  CATEGORY_SHEET: 'ExpenseCategories',
  CATEGORY_HEADERS: Object.freeze([
    'ExpenseCategoryID',
    'NameEN',
    'NameKH',
    'Active',
    'CreatedBy',
    'CreatedAt',
    'UpdatedAt'
  ]),
  EXPENSE_COLUMNS: Object.freeze([
    'ExpenseNo',
    'CategoryID',
    'PaymentType',
    'UpdatedAt',
    'UpdatedBy'
  ]),
  PAYMENT_TYPES: Object.freeze(['CASH', 'BANK'])
});

function installOperationsScannerUpgradeV43() {
  const ss = getSpreadsheet_();
  const report = [];

  let categorySheet = ss.getSheetByName(EXPENSE_V43.CATEGORY_SHEET);
  if (!categorySheet) {
    categorySheet = ss.insertSheet(EXPENSE_V43.CATEGORY_SHEET);
    report.push('Created: ' + EXPENSE_V43.CATEGORY_SHEET);
  }

  addMissingColumnsSafe_(
    categorySheet,
    EXPENSE_V43.CATEGORY_HEADERS
  );

  const expenseSheet = ss.getSheetByName(POS.SHEETS.EXPENSES);
  if (!expenseSheet) {
    throw new Error(
      'Missing Expenses sheet. Run installTinyPOSComplete() first.'
    );
  }

  addMissingColumnsSafe_(
    expenseSheet,
    EXPENSE_V43.EXPENSE_COLUMNS
  );

  styleExpenseSheetV43_(categorySheet);
  styleExpenseSheetV43_(expenseSheet);

  backfillExpenseDataV43_(report);

  SpreadsheetApp.flush();

  const message = [
    'Tiny POS Operations + Scanner v4.3 installed.',
    '',
    report.length ? report.join('\n') : 'No data migration was required.',
    '',
    'Existing expenses and all other POS data were preserved.'
  ].join('\n');

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return message;
}

function verifyOperationsScannerUpgradeV43() {
  const ss = getSpreadsheet_();
  const problems = [];

  const categorySheet = ss.getSheetByName(
    EXPENSE_V43.CATEGORY_SHEET
  );

  if (!categorySheet) {
    problems.push('Missing sheet: ' + EXPENSE_V43.CATEGORY_SHEET);
  } else {
    verifyHeadersV43_(
      categorySheet,
      EXPENSE_V43.CATEGORY_HEADERS,
      problems
    );
  }

  const expenseSheet = ss.getSheetByName(POS.SHEETS.EXPENSES);
  if (!expenseSheet) {
    problems.push('Missing sheet: ' + POS.SHEETS.EXPENSES);
  } else {
    verifyHeadersV43_(
      expenseSheet,
      EXPENSE_V43.EXPENSE_COLUMNS,
      problems
    );
  }

  if (problems.length) {
    throw new Error(
      'Tiny POS v4.3 verification failed:\n- ' +
      problems.join('\n- ')
    );
  }

  const result =
    'Tiny POS Operations + Scanner v4.3: OK\n\nNo data was changed.';

  try {
    SpreadsheetApp.getUi().alert(result);
  } catch (error) {
    console.log(result);
  }

  return result;
}

function verifyHeadersV43_(sheet, requiredHeaders, problems) {
  const headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn())
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
    : [];

  requiredHeaders.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      problems.push(
        sheet.getName() + ': missing column ' + header
      );
    }
  });
}

function styleExpenseSheetV43_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return;

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#1d4ed8')
    .setFontColor('#ffffff');
}

function backfillExpenseDataV43_(report) {
  const existingCategories = getRows_(
    EXPENSE_V43.CATEGORY_SHEET
  );

  const categoryByName = {};

  existingCategories.forEach(function(row) {
    [row.NameEN, row.NameKH].forEach(function(name) {
      const key = normalizeExpenseCategoryNameV43_(name);
      if (key) categoryByName[key] = row;
    });
  });

  const expenses = getRows_(POS.SHEETS.EXPENSES)
    .sort(function(a, b) {
      const aTime = expenseDateV43_(a.DateTime).getTime();
      const bTime = expenseDateV43_(b.DateTime).getTime();
      return aTime - bTime || a._row - b._row;
    });

  let categoriesCreated = 0;
  let expensesUpdated = 0;
  const perDaySequence = {};
  const sequenceProps = {};

  /* Read every existing sequence first so a blank legacy row can never be
     assigned a code already used by a later row. */
  expenses.forEach(function(row) {
    const match = String(row.ExpenseNo || '').match(
      /^EXP-(\d{8})-(\d+)$/i
    );

    if (!match) return;

    perDaySequence[match[1]] = Math.max(
      perDaySequence[match[1]] || 0,
      Number(match[2]) || 0
    );
  });

  expenses.forEach(function(row) {
    const changes = {};
    const categoryText = sanitizeText_(row.Category, 80) || 'General';
    const categoryKey = normalizeExpenseCategoryNameV43_(categoryText);
    let category = categoryByName[categoryKey];

    if (!category) {
      const categoryId = uuid_('EXC');
      const now = new Date();

      appendObject_(EXPENSE_V43.CATEGORY_SHEET, {
        ExpenseCategoryID: categoryId,
        NameEN: categoryText,
        NameKH: categoryText,
        Active: true,
        CreatedBy: String(row.UserID || ''),
        CreatedAt: now,
        UpdatedAt: now
      });

      category = {
        ExpenseCategoryID: categoryId,
        NameEN: categoryText,
        NameKH: categoryText,
        Active: true
      };

      categoryByName[categoryKey] = category;
      categoriesCreated++;
    }

    if (!String(row.CategoryID || '').trim()) {
      changes.CategoryID = String(category.ExpenseCategoryID);
    }

    if (!String(row.PaymentType || '').trim()) {
      changes.PaymentType = 'CASH';
    }

    if (!String(row.ExpenseNo || '').trim()) {
      const dateKey = Utilities.formatDate(
        expenseDateV43_(row.DateTime),
        POS.TIME_ZONE,
        'yyyyMMdd'
      );

      perDaySequence[dateKey] =
        (perDaySequence[dateKey] || 0) + 1;

      changes.ExpenseNo =
        'EXP-' + dateKey + '-' +
        String(perDaySequence[dateKey]).padStart(4, '0');
    }

    if (!row.UpdatedAt) {
      changes.UpdatedAt = row.CreatedAt || row.DateTime || new Date();
    }

    if (!String(row.UpdatedBy || '').trim()) {
      changes.UpdatedBy = String(row.UserID || '');
    }

    if (Object.keys(changes).length) {
      updateRowObject_(
        POS.SHEETS.EXPENSES,
        row._row,
        changes
      );
      expensesUpdated++;
    }
  });

  Object.keys(perDaySequence).forEach(function(dateKey) {
    sequenceProps['EXPENSE_SEQ_' + dateKey] = String(
      perDaySequence[dateKey]
    );
  });

  if (Object.keys(sequenceProps).length) {
    PropertiesService.getScriptProperties()
      .setProperties(sequenceProps, false);
  }

  if (categoriesCreated) {
    report.push(
      'Created ' + categoriesCreated +
      ' expense categor' +
      (categoriesCreated === 1 ? 'y' : 'ies') + '.'
    );
  }

  if (expensesUpdated) {
    report.push(
      'Upgraded ' + expensesUpdated +
      ' existing expense record(s).'
    );
  }
}

function normalizeExpenseCategoryNameV43_(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function expenseDateV43_(value) {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(value || Date.now());

  return isNaN(date.getTime()) ? new Date() : date;
}

function expenseCategoryPublicV43_(row) {
  return {
    categoryId: String(row.ExpenseCategoryID || ''),
    nameEN: String(row.NameEN || row.NameKH || ''),
    nameKH: String(row.NameKH || row.NameEN || ''),
    active: bool_(row.Active)
  };
}

function listExpenseCategoriesV43_(includeInactive) {
  return getRows_(EXPENSE_V43.CATEGORY_SHEET)
    .filter(function(row) {
      return includeInactive || bool_(row.Active);
    })
    .sort(function(a, b) {
      return String(a.NameEN || a.NameKH || '')
        .localeCompare(
          String(b.NameEN || b.NameKH || ''),
          'en',
          {numeric: true, sensitivity: 'base'}
        );
    });
}

function saveExpenseCategoryV43(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  payload = payload || {};

  let nameEN = sanitizeText_(payload.nameEN, 80);
  let nameKH = sanitizeText_(payload.nameKH, 80);

  if (!nameEN && !nameKH) {
    throw new Error('Enter an expense category name.');
  }

  nameEN = nameEN || nameKH;
  nameKH = nameKH || nameEN;

  const wantedKeys = [nameEN, nameKH]
    .map(normalizeExpenseCategoryNameV43_)
    .filter(Boolean);

  const duplicate = listExpenseCategoriesV43_(true)
    .find(function(row) {
      const existingKeys = [row.NameEN, row.NameKH]
        .map(normalizeExpenseCategoryNameV43_)
        .filter(Boolean);

      return existingKeys.some(function(key) {
        return wantedKeys.indexOf(key) >= 0;
      });
    });

  if (duplicate) {
    if (!bool_(duplicate.Active)) {
      updateRowObject_(
        EXPENSE_V43.CATEGORY_SHEET,
        duplicate._row,
        {
          NameEN: nameEN,
          NameKH: nameKH,
          Active: true,
          UpdatedAt: new Date()
        }
      );
    }

    return {
      success: true,
      category: expenseCategoryPublicV43_(
        Object.assign({}, duplicate, {
          NameEN: nameEN,
          NameKH: nameKH,
          Active: true
        })
      ),
      reused: true
    };
  }

  const categoryId = uuid_('EXC');
  const now = new Date();

  appendObject_(EXPENSE_V43.CATEGORY_SHEET, {
    ExpenseCategoryID: categoryId,
    NameEN: nameEN,
    NameKH: nameKH,
    Active: true,
    CreatedBy: user.UserID,
    CreatedAt: now,
    UpdatedAt: now
  });

  audit_(
    user.UserID,
    'CREATE_EXPENSE_CATEGORY',
    'ExpenseCategory',
    categoryId,
    {nameEN: nameEN, nameKH: nameKH}
  );

  return {
    success: true,
    category: {
      categoryId: categoryId,
      nameEN: nameEN,
      nameKH: nameKH,
      active: true
    },
    reused: false
  };
}

function getExpenseManagementV43(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  filters = filters || {};

  const canViewAllCreators = [
    POS.ROLES.ADMIN,
    POS.ROLES.MANAGER,
    POS.ROLES.ACCOUNTANT
  ].indexOf(String(user.Role || '')) >= 0;

  const branchId = resolveAccessibleBranchId_(
    user,
    filters.branchId,
    true
  );

  const from = parseExpenseBoundaryV43_(
    filters.from,
    false
  );

  const to = parseExpenseBoundaryV43_(
    filters.to,
    true
  );

  if (from && to && from > to) {
    throw new Error('From date cannot be after To date.');
  }

  const categoryId = sanitizeText_(filters.categoryId, 100);
  const paymentType = String(filters.paymentType || '')
    .trim()
    .toUpperCase();

  const requestedCreatorId = sanitizeText_(
    filters.creatorId,
    100
  );

  const creatorId = canViewAllCreators
    ? requestedCreatorId
    : String(user.UserID);

  const query = sanitizeText_(filters.query, 160)
    .toLocaleLowerCase();

  const users = getRows_(POS.SHEETS.USERS);
  const userMap = {};
  users.forEach(function(row) {
    userMap[String(row.UserID)] = row;
  });

  const branches = getRows_(POS.SHEETS.BRANCHES);
  const branchMap = {};
  branches.forEach(function(row) {
    branchMap[String(row.BranchID)] = row;
  });

  const categoryRows = listExpenseCategoriesV43_(true);
  const categoryMap = {};
  categoryRows.forEach(function(row) {
    categoryMap[String(row.ExpenseCategoryID)] = row;
  });

  const rows = getRows_(POS.SHEETS.EXPENSES)
    .filter(function(row) {
      const rowDate = expenseDateV43_(row.DateTime);
      const rowBranchId = String(
        row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
      );

      const branchOk = !branchId || rowBranchId === branchId;
      const fromOk = !from || rowDate >= from;
      const toOk = !to || rowDate <= to;
      const categoryOk = !categoryId ||
        String(row.CategoryID || '') === categoryId;
      const paymentOk = !paymentType ||
        String(row.PaymentType || 'CASH').toUpperCase() === paymentType;
      const creatorOk = !creatorId ||
        String(row.UserID || '') === creatorId;

      if (!(branchOk && fromOk && toOk && categoryOk && paymentOk && creatorOk)) {
        return false;
      }

      if (!query) return true;

      const creator = userMap[String(row.UserID)] || {};
      const branch = branchMap[rowBranchId] || {};

      return [
        row.ExpenseNo,
        row.Category,
        row.PaymentType,
        row.AmountUSD,
        row.Remark,
        creator.Name,
        creator.LoginID,
        branch.NameEN,
        branch.NameKH,
        branch.Code
      ].join(' ').toLocaleLowerCase().indexOf(query) >= 0;
    })
    .sort(function(a, b) {
      return expenseDateV43_(b.DateTime).getTime() -
        expenseDateV43_(a.DateTime).getTime() ||
        b._row - a._row;
    })
    .slice(0, 1000)
    .map(function(row) {
      const creator = userMap[String(row.UserID)] || {};
      const rowBranchId = String(
        row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
      );
      const branch = branchMap[rowBranchId] || {};
      const category = categoryMap[String(row.CategoryID)] || {};
      const canModify = canModifyExpenseV43_(user, row);

      return {
        expenseId: String(row.ExpenseID || ''),
        expenseNo: String(row.ExpenseNo || row.ExpenseID || ''),
        dateTime: expenseDateV43_(row.DateTime).toISOString(),
        branchId: rowBranchId,
        branchName: String(
          branch.NameEN || branch.NameKH || branch.Code || rowBranchId
        ),
        branchNameEN: String(
          branch.NameEN || branch.NameKH || branch.Code || rowBranchId
        ),
        branchNameKH: String(
          branch.NameKH || branch.NameEN || branch.Code || rowBranchId
        ),
        creatorId: String(row.UserID || ''),
        creatorName: String(
          creator.Name || creator.LoginID || row.UserID || ''
        ),
        categoryId: String(row.CategoryID || ''),
        categoryNameEN: String(
          category.NameEN || row.Category || ''
        ),
        categoryNameKH: String(
          category.NameKH || row.Category || ''
        ),
        category: String(row.Category || category.NameEN || ''),
        paymentType: String(row.PaymentType || 'CASH').toUpperCase(),
        amountUSD: roundMoney_(number_(row.AmountUSD)),
        remark: String(row.Remark || ''),
        canEdit: canModify,
        canDelete: canModify
      };
    });

  const totals = rows.reduce(function(result, row) {
    result.count++;
    result.totalUSD += number_(row.amountUSD);

    if (row.paymentType === 'BANK') {
      result.bankUSD += number_(row.amountUSD);
    } else {
      result.cashUSD += number_(row.amountUSD);
    }

    return result;
  }, {
    count: 0,
    totalUSD: 0,
    cashUSD: 0,
    bankUSD: 0
  });

  const accessibleBranches = branchRowsForUser_(user, false)
    .map(branchToPublic_);

  const accessibleBranchIds = {};
  accessibleBranches.forEach(function(branch) {
    accessibleBranchIds[String(branch.branchId)] = true;
  });

  const creatorOptions = users
    .filter(function(row) {
      if (!bool_(row.Active)) return false;
      if (!canViewAllCreators) {
        return String(row.UserID) === String(user.UserID);
      }

      return canManageAllBranches_(user) ||
        accessibleBranchIds[String(getUserBranchId_(row))];
    })
    .sort(function(a, b) {
      return String(a.Name || a.LoginID || '')
        .localeCompare(
          String(b.Name || b.LoginID || ''),
          'en',
          {numeric: true, sensitivity: 'base'}
        );
    })
    .map(function(row) {
      return {
        userId: String(row.UserID),
        name: String(row.Name || row.LoginID || row.UserID),
        branchId: String(getUserBranchId_(row))
      };
    });

  return {
    rows: rows,
    totals: {
      count: totals.count,
      totalUSD: roundMoney_(totals.totalUSD),
      cashUSD: roundMoney_(totals.cashUSD),
      bankUSD: roundMoney_(totals.bankUSD)
    },
    categories: categoryRows
      .filter(function(row) { return bool_(row.Active); })
      .map(expenseCategoryPublicV43_),
    branches: accessibleBranches,
    creators: creatorOptions,
    canSelectAllBranches: canManageAllBranches_(user),
    canViewAllCreators: canViewAllCreators,
    defaultBranchId: String(getUserBranchId_(user)),
    selectedBranchId: branchId,
    truncated: rows.length >= 1000
  };
}

function parseExpenseBoundaryV43_(value, endOfDay) {
  const text = String(value || '').trim();
  if (!text) return null;

  const date = new Date(
    text + (endOfDay ? 'T23:59:59.999' : 'T00:00:00')
  );

  if (isNaN(date.getTime())) {
    throw new Error('Invalid expense date filter.');
  }

  return date;
}

function canModifyExpenseV43_(user, expenseRow) {
  if (!user || !expenseRow) return false;

  if ([POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(String(user.Role || '')) >= 0) {
    return true;
  }

  return String(expenseRow.UserID || '') ===
    String(user.UserID || '');
}

function requireExpenseModifyAccessV43_(user, expenseRow) {
  if (!canModifyExpenseV43_(user, expenseRow)) {
    throw new Error(
      'You can only edit or delete your own expenses.'
    );
  }

  requireBranchAccess_(
    user,
    String(
      expenseRow.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
    )
  );
}

function saveExpenseV43(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  payload = payload || {};

  const expenseId = sanitizeText_(payload.expenseId, 120);
  const existing = expenseId
    ? findRowBy_(POS.SHEETS.EXPENSES, 'ExpenseID', expenseId)
    : null;

  if (expenseId && !existing) {
    throw new Error('Expense record was not found.');
  }

  if (existing) {
    requireExpenseModifyAccessV43_(user, existing);
  }

  const branchId = resolveAccessibleBranchId_(
    user,
    payload.branchId || (existing && existing.BranchID),
    false
  );

  const categoryId = sanitizeText_(payload.categoryId, 120);
  const categoryRow = categoryId
    ? findRowBy_(
        EXPENSE_V43.CATEGORY_SHEET,
        'ExpenseCategoryID',
        categoryId
      )
    : null;

  if (!categoryRow || !bool_(categoryRow.Active)) {
    throw new Error('Select an active expense category.');
  }

  const paymentType = String(payload.paymentType || 'CASH')
    .trim()
    .toUpperCase();

  if (EXPENSE_V43.PAYMENT_TYPES.indexOf(paymentType) === -1) {
    throw new Error('Expense type must be Cash or Bank.');
  }

  const amountUSD = roundMoney_(number_(payload.amountUSD));
  if (amountUSD <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const dateTime = parseExpenseDateTimeV43_(payload.dateTime);
  const remark = sanitizeText_(payload.remark, 500);
  const categoryName = String(
    categoryRow.NameEN || categoryRow.NameKH || ''
  );

  const now = new Date();

  if (existing) {
    const ownerId = String(existing.UserID || user.UserID);
    const ownerShift = paymentType === 'CASH'
      ? getOpenShiftForUser_(ownerId)
      : null;

    updateRowObject_(
      POS.SHEETS.EXPENSES,
      existing._row,
      {
        DateTime: dateTime,
        BranchID: branchId,
        CategoryID: categoryId,
        Category: categoryName,
        PaymentType: paymentType,
        AmountUSD: amountUSD,
        Remark: remark,
        ShiftID: paymentType === 'CASH'
          ? String(
              existing.ShiftID ||
              (ownerShift ? ownerShift.ShiftID : '')
            )
          : '',
        UpdatedAt: now,
        UpdatedBy: user.UserID
      }
    );

    audit_(
      user.UserID,
      'UPDATE_EXPENSE',
      'Expense',
      existing.ExpenseID,
      {
        expenseNo: existing.ExpenseNo,
        amountUSD: amountUSD,
        paymentType: paymentType,
        branchId: branchId,
        categoryId: categoryId
      }
    );

    return {
      success: true,
      expenseId: String(existing.ExpenseID),
      expenseNo: String(existing.ExpenseNo || existing.ExpenseID),
      updated: true
    };
  }

  return withScriptLock_(function() {
    const newExpenseId = uuid_('EXP');
    const expenseNo = nextExpenseNoV43_(dateTime);
    const shift = paymentType === 'CASH'
      ? getOpenShiftForUser_(user.UserID)
      : null;

    appendObject_(POS.SHEETS.EXPENSES, {
      ExpenseID: newExpenseId,
      ExpenseNo: expenseNo,
      DateTime: dateTime,
      BranchID: branchId,
      CategoryID: categoryId,
      Category: categoryName,
      PaymentType: paymentType,
      AmountUSD: amountUSD,
      Remark: remark,
      UserID: user.UserID,
      ShiftID: shift ? shift.ShiftID : '',
      CreatedAt: now,
      UpdatedAt: now,
      UpdatedBy: user.UserID
    });

    audit_(
      user.UserID,
      'CREATE_EXPENSE',
      'Expense',
      newExpenseId,
      {
        expenseNo: expenseNo,
        amountUSD: amountUSD,
        paymentType: paymentType,
        branchId: branchId,
        categoryId: categoryId
      }
    );

    return {
      success: true,
      expenseId: newExpenseId,
      expenseNo: expenseNo,
      updated: false
    };
  });
}

function nextExpenseNoV43_(dateTime) {
  const dateKey = Utilities.formatDate(
    expenseDateV43_(dateTime),
    POS.TIME_ZONE,
    'yyyyMMdd'
  );

  const propertyKey = 'EXPENSE_SEQ_' + dateKey;
  const props = PropertiesService.getScriptProperties();
  let sequence = Number(props.getProperty(propertyKey) || 0);

  if (!sequence) {
    getRows_(POS.SHEETS.EXPENSES).forEach(function(row) {
      const match = String(row.ExpenseNo || '').match(
        new RegExp('^EXP-' + dateKey + '-(\\d+)$', 'i')
      );

      if (match) {
        sequence = Math.max(
          sequence,
          Number(match[1]) || 0
        );
      }
    });
  }

  sequence++;
  props.setProperty(propertyKey, String(sequence));

  return 'EXP-' + dateKey + '-' +
    String(sequence).padStart(4, '0');
}

function parseExpenseDateTimeV43_(value) {
  if (!value) return new Date();

  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(String(value));

  if (isNaN(date.getTime())) {
    throw new Error('Invalid expense date and time.');
  }

  return date;
}

function deleteExpenseV43(sessionToken, expenseId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  expenseId = sanitizeText_(expenseId, 120);
  if (!expenseId) {
    throw new Error('Expense ID is required.');
  }

  return withScriptLock_(function() {
    const existing = findRowBy_(
      POS.SHEETS.EXPENSES,
      'ExpenseID',
      expenseId
    );

    if (!existing) {
      throw new Error('Expense record was not found.');
    }

    requireExpenseModifyAccessV43_(user, existing);

    const details = {
      expenseNo: String(existing.ExpenseNo || existing.ExpenseID),
      amountUSD: roundMoney_(number_(existing.AmountUSD)),
      category: String(existing.Category || ''),
      paymentType: String(existing.PaymentType || 'CASH'),
      branchId: String(existing.BranchID || ''),
      originalUserId: String(existing.UserID || '')
    };

    getSheet_(POS.SHEETS.EXPENSES).deleteRow(existing._row);

    audit_(
      user.UserID,
      'DELETE_EXPENSE',
      'Expense',
      expenseId,
      details
    );

    return {
      success: true,
      expenseId: expenseId,
      expenseNo: details.expenseNo
    };
  });
}


/* ==========================================================================
 * SOURCE: PackagePurchasesV41.gs
 * ========================================================================== */
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


/* ==========================================================================
 * SOURCE: PackageSalesV41.gs
 * ========================================================================== */
/**
 * Tiny POS Product Packaging v4.1 — package-aware sale, pending invoice,
 * receipt and customer-return endpoints.
 *
 * Inventory/FIFO quantities always use the product base unit. The additional
 * package columns preserve what the cashier actually sold (Can, Box, Bag...).
 */

function roundQtyV41_(value) {
  return Math.round(number_(value) * 1000) / 1000;
}

function roundCostV41_(value) {
  return Math.round(number_(value) * 1000000) / 1000000;
}

function validatePackageCartV41_(user, payload) {
  payload = payload || {};
  const branchId = resolveSaleBranchForPayloadV38_(user, payload);
  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  if (!requestedItems.length) throw new Error('The cart is empty.');

  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) {
    productMap[String(row.ProductID)] = row;
  });
  const unitMap = getUnitMap_();
  const packages = packageMapV41_(false);
  const requiredByProduct = {};
  const items = [];
  let subtotal = 0;

  requestedItems.forEach(function(requested) {
    const product = productMap[String(requested.productId)];
    if (!product || !bool_(product.Active)) {
      throw new Error('A product in the cart is unavailable.');
    }

    const selected = resolvePackageV41_(
      product,
      requested.packageId,
      'SALE',
      packages
    );

    let sellQty = roundQtyV41_(requested.qty);
    if (sellQty <= 0) {
      throw new Error('Product quantity must be greater than zero.');
    }

    if (
      selected.allowDecimal !== true &&
      Math.abs(sellQty - Math.round(sellQty)) > 0.000001
    ) {
      throw new Error(
        (product.NameEN || product.NameKH) +
        ' must use a whole-number ' + selected.unitName + ' quantity.'
      );
    }
    sellQty = selected.allowDecimal === true
      ? sellQty
      : Math.round(sellQty);

    const baseUnit = unitMap[String(product.UnitID || '')] || {};
    let baseQty = roundQtyV41_(sellQty * number_(selected.factor, 1));
    if (
      baseUnit.allowDecimal !== true &&
      Math.abs(baseQty - Math.round(baseQty)) > 0.000001
    ) {
      throw new Error(
        (product.NameEN || product.NameKH) +
        ': the selected package conversion does not produce a whole base-unit quantity.'
      );
    }
    baseQty = baseUnit.allowDecimal === true
      ? baseQty
      : Math.round(baseQty);

    requiredByProduct[String(product.ProductID)] = roundQtyV41_(
      number_(requiredByProduct[String(product.ProductID)]) + baseQty
    );

    const sellUnitPriceUSD = roundMoney_(number_(selected.priceUSD));
    const lineTotalUSD = roundMoney_(sellUnitPriceUSD * sellQty);
    subtotal = roundMoney_(subtotal + lineTotalUSD);

    items.push({
      productId: String(product.ProductID),
      barcode: String(product.Barcode || ''),
      productCode: String(product.ProductCode || ''),
      productName: String(product.NameEN || product.NameKH || ''),
      qty: baseQty,
      baseQty: baseQty,
      sellQty: sellQty,
      packageId: String(selected.packageId || ''),
      unitsPerSellUnit: number_(selected.factor, 1),
      sellUnitId: String(selected.unitId || product.UnitID || ''),
      sellUnitName: String(selected.unitName || ''),
      sellBarcode: String(selected.barcode || product.Barcode || ''),
      unitId: String(product.UnitID || ''),
      unitName: String(
        baseUnit.abbreviation || baseUnit.nameEN || baseUnit.nameKH || ''
      ),
      allowDecimal: baseUnit.allowDecimal === true,
      unitCostUSD: roundCostV41_(number_(product.CostUSD)),
      unitPriceUSD: baseQty > 0
        ? roundCostV41_(lineTotalUSD / baseQty)
        : 0,
      sellUnitPriceUSD: sellUnitPriceUSD,
      discountUSD: 0,
      lineTotalUSD: lineTotalUSD,
      productRow: product
    });
  });

  Object.keys(requiredByProduct).forEach(function(productId) {
    const product = productMap[productId];
    const available = getBranchStockQty_(branchId, productId);
    const required = requiredByProduct[productId];
    if (available + 0.000001 < required) {
      throw new Error(
        String(product.NameEN || product.NameKH || productId) +
        ' has insufficient stock. Available: ' + available +
        ', required: ' + required + '.'
      );
    }
  });

  const customerId = sanitizeText_(payload.customerId, 80);
  let customer = null;
  if (customerId) {
    customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
    if (!customer || !bool_(customer.Active)) {
      throw new Error('The selected customer is unavailable.');
    }
  }

  const settings = getSettings_();
  const exchangeRate = number_(
    payload.exchangeRate,
    number_(settings.EXCHANGE_RATE, 4100)
  );
  if (exchangeRate <= 0) throw new Error('Exchange rate is invalid.');

  let manualDiscountType = String(
    payload.manualDiscountType || ''
  ).trim().toUpperCase();
  let manualDiscountValue = 0;
  let manualDiscountPercent = 0;
  let manualDiscountUSD = 0;

  if (manualDiscountType === 'FIXED') {
    manualDiscountValue = Math.max(
      0,
      roundMoney_(number_(payload.manualDiscountValue, payload.discountUSD))
    );
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0
      ? Math.round(manualDiscountUSD / subtotal * 10000) / 100
      : 0;
  } else if (
    manualDiscountType === 'PERCENT' ||
    payload.manualDiscountValue !== undefined ||
    payload.manualDiscountPercent !== undefined
  ) {
    manualDiscountType = 'PERCENT';
    manualDiscountValue = Math.min(
      100,
      Math.max(
        0,
        number_(payload.manualDiscountValue, payload.manualDiscountPercent)
      )
    );
    manualDiscountValue = Math.round(manualDiscountValue * 100) / 100;
    manualDiscountPercent = manualDiscountValue;
    manualDiscountUSD = roundMoney_(
      subtotal * manualDiscountPercent / 100
    );
  } else {
    manualDiscountType = 'FIXED';
    manualDiscountValue = Math.max(
      0,
      roundMoney_(number_(payload.discountUSD))
    );
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0
      ? Math.round(manualDiscountUSD / subtotal * 10000) / 100
      : 0;
  }

  const afterManualDiscount = roundMoney_(subtotal - manualDiscountUSD);
  const coupon = calculateCouponDiscount_(
    payload.couponCode,
    afterManualDiscount,
    new Date()
  );
  const couponDiscountUSD = Math.min(
    afterManualDiscount,
    roundMoney_(number_(coupon.discountUSD))
  );
  const discountUSD = Math.min(
    subtotal,
    roundMoney_(manualDiscountUSD + couponDiscountUSD)
  );
  const taxable = roundMoney_(subtotal - discountUSD);
  const taxRate = Math.max(0, number_(settings.TAX_RATE));
  const taxUSD = roundMoney_(taxable * taxRate / 100);
  const totalUSD = roundMoney_(taxable + taxUSD);
  const totalKHR = Math.round(totalUSD * exchangeRate);

  return {
    branchId: branchId,
    items: items,
    requiredByProduct: requiredByProduct,
    customerId: customerId,
    customerName: customer
      ? String(customer.Name || '')
      : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL').toUpperCase()
      : 'WALK-IN',
    customerCreditLimitUSD: customer
      ? roundMoney_(number_(customer.CreditLimitUSD))
      : 0,
    customerCreditBalanceUSD: customer
      ? getCustomerOutstanding_(customerId)
      : 0,
    customerPaymentTermsDays: customer
      ? Math.max(0, Math.round(number_(customer.PaymentTermsDays, 30)))
      : 0,
    notes: sanitizeText_(payload.notes, 250),
    subtotalUSD: subtotal,
    manualDiscountType: manualDiscountType,
    manualDiscountValue: manualDiscountValue,
    manualDiscountPercent: manualDiscountPercent,
    manualDiscountUSD: manualDiscountUSD,
    couponCode: coupon.code,
    couponDescriptionEN: coupon.descriptionEN,
    couponDescriptionKH: coupon.descriptionKH,
    couponDiscountUSD: couponDiscountUSD,
    discountUSD: discountUSD,
    taxUSD: taxUSD,
    totalUSD: totalUSD,
    totalKHR: totalKHR,
    exchangeRate: exchangeRate
  };
}

function previewCartPricingV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const validated = validatePackageCartV41_(user, payload);
  return {
    subtotalUSD: validated.subtotalUSD,
    manualDiscountType: validated.manualDiscountType,
    manualDiscountValue: validated.manualDiscountValue,
    manualDiscountPercent: validated.manualDiscountPercent,
    manualDiscountUSD: validated.manualDiscountUSD,
    couponCode: validated.couponCode,
    couponDescriptionEN: validated.couponDescriptionEN,
    couponDescriptionKH: validated.couponDescriptionKH,
    couponDiscountUSD: validated.couponDiscountUSD,
    discountUSD: validated.discountUSD,
    taxUSD: validated.taxUSD,
    totalUSD: validated.totalUSD,
    totalKHR: validated.totalKHR,
    exchangeRate: validated.exchangeRate
  };
}

function completeCashSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );
    const currency = String(
      (payload && payload.paymentCurrency) || 'USD'
    ).toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const received = number_(payload && payload.receivedAmount);
    const required = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    if (received + 0.000001 < required) {
      throw new Error('Received cash is less than the invoice total.');
    }

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      {
        method: 'CASH',
        currency: currency,
        amount: required,
        reference: '',
        status: POS.PAYMENT_STATUS.PAID
      },
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : ''
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }

    result.receivedAmount = received;
    result.changeAmount = currency === 'KHR'
      ? Math.round(received - required)
      : roundMoney_(received - required);
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function completeBankSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );
    const currency = String(
      (payload && payload.bankCurrency) || 'USD'
    ).toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const amount = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      {
        method: 'BANK',
        currency: currency,
        amount: amount,
        reference: sanitizeText_(payload && payload.bankReference, 120),
        status: POS.PAYMENT_STATUS.PAID
      },
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : ''
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function completeCreditSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  payload = payload || {};
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    if (!validated.customerId) {
      throw new Error('Select a customer before using credit.');
    }

    const customer = findRowBy_(
      POS.SHEETS.CUSTOMERS,
      'CustomerID',
      validated.customerId
    );
    if (!customer || !bool_(customer.Active)) {
      throw new Error('Active customer was not found.');
    }

    const pending = resolvePendingForCompletion_(user, payload.pendingId);
    const paidMethod = String(payload.paidMethod || 'CASH').toUpperCase() === 'BANK'
      ? 'BANK'
      : 'CASH';
    const paidCurrency = String(payload.paidCurrency || 'USD').toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';
    const enteredPaid = Math.max(0, number_(payload.paidAmount));
    const paidNowUSD = paidCurrency === 'KHR'
      ? roundMoney_(enteredPaid / validated.exchangeRate)
      : roundMoney_(enteredPaid);

    if (paidNowUSD > validated.totalUSD + 0.005) {
      throw new Error('Paid-now amount cannot exceed the invoice total.');
    }

    const creditAmountUSD = roundMoney_(validated.totalUSD - paidNowUSD);
    if (creditAmountUSD <= 0.000001) {
      throw new Error('Use Cash or Bank checkout when the invoice is fully paid.');
    }

    const currentBalance = getCustomerOutstanding_(validated.customerId);
    const limit = roundMoney_(number_(customer.CreditLimitUSD));
    const projected = roundMoney_(currentBalance + creditAmountUSD);
    const manager = [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(user.Role) >= 0;
    const override = payload.overrideCredit === true && manager;

    if (!override) {
      if (limit <= 0) {
        throw new Error('This customer does not have an approved credit limit.');
      }
      if (projected > limit + 0.005) {
        throw new Error(
          'Credit limit exceeded. Current: $' + currentBalance.toFixed(2) +
          ', new credit: $' + creditAmountUSD.toFixed(2) +
          ', limit: $' + limit.toFixed(2) + '.'
        );
      }
    }

    const terms = Math.max(
      0,
      Math.round(number_(
        payload.paymentTermsDays,
        customer.PaymentTermsDays || 30
      ))
    );
    let dueDate;
    if (payload.dueDate) {
      dueDate = new Date(String(payload.dueDate) + 'T23:59:59');
      if (isNaN(dueDate.getTime())) throw new Error('Due date is invalid.');
    } else {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + terms);
    }

    const payments = [];
    if (paidNowUSD > 0) {
      payments.push({
        method: paidMethod,
        currency: paidCurrency,
        amount: paidCurrency === 'KHR'
          ? Math.round(enteredPaid)
          : roundMoney_(enteredPaid),
        amountUSD: paidNowUSD,
        reference: sanitizeText_(payload.reference, 120),
        status: POS.PAYMENT_STATUS.PAID
      });
    }

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      payments,
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : '',
        creditAmountUSD: creditAmountUSD,
        dueDate: dueDate,
        paymentTermsDays: terms,
        overrideCredit: override
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function createCompletedPackageSaleLockedV41_(
  user,
  validated,
  payment,
  invoiceNo,
  saleOptions
) {
  saleOptions = saleOptions || {};
  const payments = (Array.isArray(payment) ? payment : [payment])
    .filter(function(row) {
      return row && number_(row.amount) > 0;
    });
  const saleId = uuid_('SAL');
  const finalInvoiceNo = invoiceNo || generateInvoiceNo_();
  const now = new Date();
  const shift = getOpenShiftForUser_(user.UserID);
  const branchId = resolveAccessibleBranchId_(
    user,
    validated.branchId,
    false
  );

  let amountPaidUSD = 0;
  payments.forEach(function(row) {
    amountPaidUSD += row.amountUSD !== undefined
      ? number_(row.amountUSD)
      : (
          String(row.currency || 'USD').toUpperCase() === 'KHR'
            ? number_(row.amount) / validated.exchangeRate
            : number_(row.amount)
        );
  });
  amountPaidUSD = Math.min(
    validated.totalUSD,
    roundMoney_(amountPaidUSD)
  );

  const creditAmountUSD = saleOptions.creditAmountUSD !== undefined
    ? roundMoney_(number_(saleOptions.creditAmountUSD))
    : roundMoney_(Math.max(0, validated.totalUSD - amountPaidUSD));

  if (
    creditAmountUSD < -0.005 ||
    amountPaidUSD + creditAmountUSD > validated.totalUSD + 0.01
  ) {
    throw new Error('Payment and credit amounts do not match the invoice total.');
  }

  const dueDate = saleOptions.dueDate
    ? new Date(saleOptions.dueDate)
    : '';
  const paymentTermsDays = Math.max(
    0,
    Math.round(number_(
      saleOptions.paymentTermsDays,
      validated.customerPaymentTermsDays
    ))
  );
  const paymentMethod = creditAmountUSD > 0
    ? (
        payments.length
          ? String(payments[0].method || 'CASH').toUpperCase() + '+CREDIT'
          : 'CREDIT'
      )
    : (
        payments.length
          ? String(payments[0].method || 'CASH').toUpperCase()
          : 'CASH'
      );
  const paymentStatus = creditAmountUSD > 0
    ? (
        amountPaidUSD > 0
          ? POS.PAYMENT_STATUS.PARTIAL
          : POS.PAYMENT_STATUS.UNPAID
      )
    : POS.PAYMENT_STATUS.PAID;

  const products = {};
  const currentByProduct = {};
  Object.keys(validated.requiredByProduct || {}).forEach(function(productId) {
    const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
    if (!product || !bool_(product.Active)) {
      throw new Error('A product is no longer available for sale.');
    }
    const current = getBranchStockQty_(branchId, productId);
    const required = number_(validated.requiredByProduct[productId]);
    if (current + 0.0005 < required) {
      throw new Error(
        String(product.NameEN || product.NameKH || productId) +
        ' has insufficient stock at this branch. Available: ' + current +
        ', required: ' + required + '.'
      );
    }
    products[productId] = product;
    currentByProduct[productId] = current;
  });

  const fifoInput = validated.items.map(function(item) {
    return {
      productId: item.productId,
      qty: item.baseQty
    };
  });
  const fifoPlan = planFifoAllocationsLocked_(fifoInput, branchId);

  appendObject_(POS.SHEETS.SALES, {
    SaleID: saleId,
    InvoiceNo: finalInvoiceNo,
    PendingNo: sanitizeText_(saleOptions.pendingNo, 80),
    BranchID: branchId,
    DateTime: now,
    CustomerID: validated.customerId,
    CustomerName: validated.customerName,
    CustomerType: validated.customerType,
    SubtotalUSD: validated.subtotalUSD,
    DiscountUSD: validated.discountUSD,
    TaxUSD: validated.taxUSD,
    TotalUSD: validated.totalUSD,
    TotalKHR: validated.totalKHR,
    ExchangeRate: validated.exchangeRate,
    PaymentMethod: paymentMethod,
    PaymentStatus: paymentStatus,
    AmountPaidUSD: amountPaidUSD,
    CreditAmountUSD: creditAmountUSD,
    DueDate: dueDate || '',
    PaymentTermsDays: paymentTermsDays,
    CreditStatus: creditAmountUSD > 0 ? 'OPEN' : 'PAID',
    Status: POS.SALE_STATUS.COMPLETED,
    CashierID: user.UserID,
    CashierName: user.Name,
    ShiftID: shift ? shift.ShiftID : '',
    Notes: validated.notes,
    CreatedAt: now,
    ManualDiscountType: validated.manualDiscountType,
    ManualDiscountValue: validated.manualDiscountValue,
    ManualDiscountPercent: validated.manualDiscountPercent,
    ManualDiscountUSD: validated.manualDiscountUSD,
    CouponCode: validated.couponCode,
    CouponDiscountUSD: validated.couponDiscountUSD
  });

  const saleItems = [];
  const movements = [];
  const fifoReferences = [];
  const runningBalance = Object.assign({}, currentByProduct);

  validated.items.forEach(function(item, index) {
    const costPlan = fifoPlan.itemPlans[index];
    const saleItemId = uuid_('ITM');
    const share = validated.subtotalUSD > 0
      ? item.lineTotalUSD / validated.subtotalUSD
      : 0;
    const allocatedDiscount = roundMoney_(validated.discountUSD * share);
    const netRevenue = roundMoney_(
      item.lineTotalUSD - allocatedDiscount
    );
    const totalCost = roundMoney_(costPlan.totalCostUSD);
    runningBalance[item.productId] = roundQtyV41_(
      number_(runningBalance[item.productId]) - item.baseQty
    );

    saleItems.push({
      SaleItemID: saleItemId,
      SaleID: saleId,
      ProductID: item.productId,
      Barcode: item.barcode,
      ProductName: item.productName,
      Qty: item.baseQty,
      UnitID: item.unitId,
      UnitName: item.unitName,
      UnitCostUSD: costPlan.averageUnitCostUSD,
      UnitPriceUSD: item.unitPriceUSD,
      DiscountUSD: item.discountUSD,
      LineTotalUSD: item.lineTotalUSD,
      AllocatedSaleDiscountUSD: allocatedDiscount,
      NetRevenueUSD: netRevenue,
      CostTotalUSD: totalCost,
      GrossProfitUSD: roundMoney_(netRevenue - totalCost),
      SellPackageID: item.packageId,
      SellUnitName: item.sellUnitName,
      SellQty: item.sellQty,
      UnitsPerSellUnit: item.unitsPerSellUnit,
      SellBarcode: item.sellBarcode,
      SellUnitPriceUSD: item.sellUnitPriceUSD
    });

    movements.push({
      MovementID: uuid_('STK'),
      DateTime: now,
      BranchID: branchId,
      ProductID: item.productId,
      Type: 'SALE',
      QtyIn: 0,
      QtyOut: item.baseQty,
      BalanceAfter: Math.max(0, runningBalance[item.productId]),
      ReferenceType: 'SALE',
      ReferenceID: saleId,
      UserID: user.UserID,
      Note: finalInvoiceNo + ' / ' + item.sellQty + ' ' + item.sellUnitName,
      UnitCostUSD: costPlan.averageUnitCostUSD,
      CostInUSD: 0,
      CostOutUSD: totalCost
    });

    fifoReferences.push({
      branchId: branchId,
      referenceType: 'SALE',
      referenceId: saleItemId,
      userId: user.UserID,
      note: finalInvoiceNo + ' / ' + saleId
    });
  });

  applyFifoPlanLocked_(fifoPlan, fifoReferences);

  Object.keys(runningBalance).forEach(function(productId) {
    const summary = getFifoStockSummary_(productId, branchId);
    const product = products[productId] || {};
    setBranchStockLocked_(
      branchId,
      productId,
      Math.max(0, runningBalance[productId]),
      summary.totalQty > 0
        ? summary.averageCostUSD
        : number_(product.CostUSD)
    );
  });

  appendObjects_(POS.SHEETS.SALE_ITEMS, saleItems);
  appendObjects_(POS.SHEETS.STOCK, movements);

  payments.forEach(function(row) {
    appendObject_(POS.SHEETS.PAYMENTS, {
      PaymentID: uuid_('PMT'),
      SaleID: saleId,
      Method: String(row.method || 'CASH').toUpperCase(),
      Currency: String(row.currency || 'USD').toUpperCase(),
      Amount: number_(row.amount),
      Reference: row.reference || '',
      KHQRMD5: row.khqrMd5 || '',
      BankHash: row.bankHash || '',
      Status: row.status || POS.PAYMENT_STATUS.PAID,
      ReceivedBy: user.UserID,
      CreatedAt: now
    });
  });

  let receivableId = '';
  if (creditAmountUSD > 0) {
    if (!validated.customerId) {
      throw new Error('A customer is required for a credit sale.');
    }
    receivableId = createReceivableLocked_({
      customerId: validated.customerId,
      saleId: saleId,
      invoiceNo: finalInvoiceNo,
      invoiceDate: now,
      dueDate: dueDate || new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + paymentTermsDays
      ),
      amountUSD: creditAmountUSD
    }) || '';
  }

  incrementCouponUsageLocked_(validated.couponCode);
  audit_(user.UserID, 'COMPLETE_PACKAGE_SALE', 'Sale', saleId, {
    invoiceNo: finalInvoiceNo,
    pendingNo: saleOptions.pendingNo || '',
    branchId: branchId,
    totalUSD: validated.totalUSD,
    amountPaidUSD: amountPaidUSD,
    creditAmountUSD: creditAmountUSD,
    paymentMethod: paymentMethod,
    receivableId: receivableId,
    fifoCostUSD: roundMoney_(
      fifoPlan.itemPlans.reduce(function(sum, plan) {
        return sum + plan.totalCostUSD;
      }, 0)
    )
  });

  return buildPackageReceiptV41_(
    saleId,
    finalInvoiceNo,
    now,
    user,
    validated,
    payments,
    {
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      amountPaidUSD: amountPaidUSD,
      creditAmountUSD: creditAmountUSD,
      dueDate: dueDate ? dueDate.toISOString() : '',
      paymentTermsDays: paymentTermsDays,
      receivableId: receivableId,
      pendingNo: saleOptions.pendingNo || '',
      branchId: branchId
    }
  );
}

function packageReceiptItemV41_(item) {
  return {
    productId: String(item.productId || item.ProductID || ''),
    name: String(item.productName || item.ProductName || ''),
    qty: number_(
      item.sellQty !== undefined
        ? item.sellQty
        : (
            item.SellQty !== '' && item.SellQty !== undefined
              ? item.SellQty
              : item.qty !== undefined
                ? item.qty
                : item.Qty
          )
    ),
    baseQty: number_(item.baseQty !== undefined ? item.baseQty : item.Qty),
    packageId: String(item.packageId || item.SellPackageID || ''),
    unitsPerSellUnit: number_(
      item.unitsPerSellUnit !== undefined
        ? item.unitsPerSellUnit
        : item.UnitsPerSellUnit,
      1
    ),
    unitId: String(item.sellUnitId || item.UnitID || ''),
    unitName: String(
      item.sellUnitName || item.SellUnitName || item.UnitName || ''
    ),
    barcode: String(item.sellBarcode || item.SellBarcode || item.Barcode || ''),
    unitPriceUSD: number_(
      item.sellUnitPriceUSD !== undefined
        ? item.sellUnitPriceUSD
        : (
            item.SellUnitPriceUSD !== '' && item.SellUnitPriceUSD !== undefined
              ? item.SellUnitPriceUSD
              : item.unitPriceUSD !== undefined
                ? item.unitPriceUSD
                : item.UnitPriceUSD
          )
    ),
    lineTotalUSD: number_(item.lineTotalUSD !== undefined ? item.lineTotalUSD : item.LineTotalUSD)
  };
}

function buildPackageReceiptV41_(
  saleId,
  invoiceNo,
  dateTime,
  user,
  validated,
  payments,
  creditInfo
) {
  const receipt = buildReceipt_(
    saleId,
    invoiceNo,
    dateTime,
    user,
    validated,
    payments,
    creditInfo
  );
  receipt.items = validated.items.map(packageReceiptItemV41_);
  receipt.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return receipt;
}

function getReceiptV41(sessionToken, saleId) {
  const user = requireSession_(sessionToken);
  const sale = findRowBy_(POS.SHEETS.SALES, 'SaleID', saleId);
  if (!sale) throw new Error('Sale not found.');

  const rawItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    });
  const payments = getRows_(POS.SHEETS.PAYMENTS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    })
    .map(function(row) {
      return {
        method: String(row.Method || ''),
        currency: String(row.Currency || 'USD'),
        amount: number_(row.Amount),
        reference: String(row.Reference || ''),
        status: String(row.Status || '')
      };
    });
  const cashier = findRowBy_(POS.SHEETS.USERS, 'UserID', sale.CashierID) || {
    Name: sale.CashierName
  };
  const customer = sale.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', sale.CustomerID)
    : null;

  const validated = {
    customerId: String(sale.CustomerID || ''),
    customerName: String(
      sale.CustomerName || (customer ? customer.Name : '') || 'Walk-in customer'
    ),
    customerType: String(
      sale.CustomerType || (customer ? customer.CustomerType : '') || 'WALK-IN'
    ),
    items: rawItems.map(function(row) {
      return {
        productId: String(row.ProductID || ''),
        productName: String(row.ProductName || ''),
        baseQty: number_(row.Qty),
        sellQty: row.SellQty !== '' && row.SellQty !== undefined
          ? number_(row.SellQty)
          : number_(row.Qty),
        packageId: String(row.SellPackageID || ''),
        unitsPerSellUnit: number_(row.UnitsPerSellUnit, 1),
        sellUnitId: String(row.UnitID || ''),
        sellUnitName: String(row.SellUnitName || row.UnitName || ''),
        sellBarcode: String(row.SellBarcode || row.Barcode || ''),
        unitPriceUSD: number_(row.UnitPriceUSD),
        sellUnitPriceUSD:
          row.SellUnitPriceUSD !== '' && row.SellUnitPriceUSD !== undefined
            ? number_(row.SellUnitPriceUSD)
            : number_(row.UnitPriceUSD),
        lineTotalUSD: number_(row.LineTotalUSD)
      };
    }),
    subtotalUSD: number_(sale.SubtotalUSD),
    manualDiscountType: storedManualDiscountType_(sale),
    manualDiscountValue: storedManualDiscountValue_(sale),
    manualDiscountPercent: number_(sale.ManualDiscountPercent),
    manualDiscountUSD: number_(sale.ManualDiscountUSD),
    couponCode: String(sale.CouponCode || ''),
    couponDiscountUSD: number_(sale.CouponDiscountUSD),
    discountUSD: number_(sale.DiscountUSD),
    taxUSD: number_(sale.TaxUSD),
    totalUSD: number_(sale.TotalUSD),
    totalKHR: number_(sale.TotalKHR),
    exchangeRate: number_(sale.ExchangeRate),
    notes: String(sale.Notes || '')
  };

  return buildPackageReceiptV41_(
    sale.SaleID,
    sale.InvoiceNo,
    new Date(sale.DateTime),
    cashier,
    validated,
    payments,
    {
      paymentMethod: String(sale.PaymentMethod || ''),
      paymentStatus: String(sale.PaymentStatus || ''),
      amountPaidUSD: number_(sale.AmountPaidUSD, number_(sale.TotalUSD)),
      creditAmountUSD: number_(sale.CreditAmountUSD),
      dueDate: reportDate_(sale.DueDate)
        ? reportDate_(sale.DueDate).toISOString()
        : '',
      paymentTermsDays: number_(sale.PaymentTermsDays),
      receivableId: (
        findRowBy_(POS.SHEETS.RECEIVABLES, 'SaleID', saleId) || {}
      ).ReceivableID || ''
    }
  );
}

function savePendingInvoiceV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  payload = payload || {};

  return withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pendingId = sanitizeText_(payload.pendingId, 80);
    const existing = pendingId
      ? getPendingInvoiceRowForUser_(user, pendingId, true)
      : null;
    const now = new Date();
    const preferred = normalizePreferredPayment_(payload.preferredPayment);
    const snapshot = {
      items: validated.items.map(function(item) {
        return {
          productId: item.productId,
          barcode: item.sellBarcode,
          name: item.productName,
          packageId: item.packageId,
          unitId: item.sellUnitId,
          unitName: item.sellUnitName,
          qty: item.sellQty,
          baseQty: item.baseQty,
          unitsPerSellUnit: item.unitsPerSellUnit,
          unitPriceUSD: item.sellUnitPriceUSD,
          lineTotalUSD: item.lineTotalUSD
        };
      }),
      notes: validated.notes
    };
    const changes = {
      BranchID: validated.branchId,
      DateTime: existing ? existing.DateTime : now,
      CustomerID: validated.customerId,
      CartJSON: JSON.stringify(snapshot),
      SubtotalUSD: validated.subtotalUSD,
      ManualDiscountType: validated.manualDiscountType,
      ManualDiscountValue: validated.manualDiscountValue,
      ManualDiscountPercent: validated.manualDiscountPercent,
      ManualDiscountUSD: validated.manualDiscountUSD,
      CouponCode: validated.couponCode,
      CouponDiscountUSD: validated.couponDiscountUSD,
      DiscountUSD: validated.discountUSD,
      TaxUSD: validated.taxUSD,
      TotalUSD: validated.totalUSD,
      TotalKHR: validated.totalKHR,
      ExchangeRate: validated.exchangeRate,
      PreferredPayment: preferred,
      Notes: validated.notes,
      Status: 'OPEN',
      CashierID: user.UserID,
      CashierName: user.Name,
      UpdatedAt: now
    };
    let row;
    if (existing) {
      updateRowObject_(CHECKOUT_FEATURE.PENDING_SHEET, existing._row, changes);
      row = Object.assign({}, existing, changes);
    } else {
      const pendingNo = generatePendingNo_();
      row = Object.assign({}, changes, {
        PendingID: uuid_('PND'),
        InvoiceNo: pendingNo,
        PendingNo: pendingNo,
        FinalInvoiceNo: '',
        SaleID: ''
      });
      appendObject_(CHECKOUT_FEATURE.PENDING_SHEET, row);
    }

    audit_(
      user.UserID,
      existing ? 'UPDATE_PENDING_PACKAGE_INVOICE' : 'CREATE_PENDING_PACKAGE_INVOICE',
      'PendingInvoice',
      row.PendingID,
      {
        pendingNo: row.PendingNo || row.InvoiceNo,
        totalUSD: validated.totalUSD
      }
    );
    return buildPendingPackageReceiptV41_(row);
  });
}

function getPendingInvoiceV41(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];
  const customer = row.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', row.CustomerID)
    : null;

  return {
    pendingId: String(row.PendingID),
    branchId: String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    customerId: String(row.CustomerID || ''),
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL')
      : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        packageId: String(item.packageId || ''),
        qty: number_(item.qty)
      };
    }),
    manualDiscountType: storedManualDiscountType_(row),
    manualDiscountValue: storedManualDiscountValue_(row),
    manualDiscountPercent: number_(row.ManualDiscountPercent),
    manualDiscountUSD: number_(row.ManualDiscountUSD),
    couponCode: String(row.CouponCode || ''),
    couponDiscountUSD: number_(row.CouponDiscountUSD),
    preferredPayment: normalizePreferredPayment_(row.PreferredPayment),
    notes: String(row.Notes || ''),
    receipt: buildPendingPackageReceiptV41_(row)
  };
}

function printPendingInvoiceV41(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  return buildPendingPackageReceiptV41_(row);
}

function buildPendingPackageReceiptV41_(row) {
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];
  const settings = getPublicSettings_();
  const customer = row.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', row.CustomerID)
    : null;

  return {
    isPending: true,
    paid: false,
    status: 'PENDING',
    pendingId: String(row.PendingID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    dateTime: new Date(row.DateTime).toISOString(),
    cashierName: String(row.CashierName || ''),
    customerId: String(row.CustomerID || ''),
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL')
      : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        name: String(item.name || ''),
        qty: number_(item.qty),
        baseQty: number_(item.baseQty, number_(item.qty)),
        packageId: String(item.packageId || ''),
        unitsPerSellUnit: number_(item.unitsPerSellUnit, 1),
        unitId: String(item.unitId || ''),
        unitName: String(item.unitName || ''),
        barcode: String(item.barcode || ''),
        unitPriceUSD: number_(item.unitPriceUSD),
        lineTotalUSD: number_(item.lineTotalUSD)
      };
    }),
    subtotalUSD: number_(row.SubtotalUSD),
    manualDiscountType: storedManualDiscountType_(row),
    manualDiscountValue: storedManualDiscountValue_(row),
    manualDiscountPercent: number_(row.ManualDiscountPercent),
    manualDiscountUSD: number_(row.ManualDiscountUSD),
    couponCode: String(row.CouponCode || ''),
    couponDiscountUSD: number_(row.CouponDiscountUSD),
    discountUSD: number_(row.DiscountUSD),
    taxUSD: number_(row.TaxUSD),
    totalUSD: number_(row.TotalUSD),
    totalKHR: number_(row.TotalKHR),
    exchangeRate: number_(row.ExchangeRate),
    paymentMethod: normalizePreferredPayment_(row.PreferredPayment),
    preferredPayment: normalizePreferredPayment_(row.PreferredPayment),
    paymentCurrency: '',
    paymentAmount: 0,
    reference: '',
    notes: String(row.Notes || ''),
    shop: settings,
    productPackagingVersion: PRODUCT_PACKAGING_V41.VERSION
  };
}

function saleItemPackageMetaV41_(saleItem) {
  const factor = number_(saleItem.UnitsPerSellUnit, 1) || 1;
  const isPackage = String(saleItem.SellPackageID || '') !== '';
  return {
    packageId: String(saleItem.SellPackageID || ''),
    unitName: String(saleItem.SellUnitName || saleItem.UnitName || ''),
    factor: factor,
    sellQty: saleItem.SellQty !== '' && saleItem.SellQty !== undefined
      ? number_(saleItem.SellQty)
      : roundQtyV41_(number_(saleItem.Qty) / factor),
    sellUnitPriceUSD:
      saleItem.SellUnitPriceUSD !== '' && saleItem.SellUnitPriceUSD !== undefined
        ? number_(saleItem.SellUnitPriceUSD)
        : (
            isPackage
              ? roundMoney_(number_(saleItem.UnitPriceUSD) * factor)
              : number_(saleItem.UnitPriceUSD)
          )
  };
}

function getReturnSaleDetailsV41(sessionToken, saleId) {
  const detail = getReturnSaleDetails(sessionToken, saleId);
  const saleItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    });
  const byId = {};
  saleItems.forEach(function(row) {
    byId[String(row.SaleItemID)] = row;
  });

  detail.items = detail.items.map(function(item) {
    const row = byId[item.saleItemId] || {};
    const meta = saleItemPackageMetaV41_(row);
    return Object.assign({}, item, {
      packageId: meta.packageId,
      sellUnitName: meta.unitName,
      unitsPerSellUnit: meta.factor,
      soldBaseQty: item.soldQty,
      returnedBaseQty: item.returnedQty,
      availableBaseQty: item.availableQty,
      soldQty: roundQtyV41_(item.soldQty / meta.factor),
      returnedQty: roundQtyV41_(item.returnedQty / meta.factor),
      availableQty: roundQtyV41_(item.availableQty / meta.factor),
      unitPriceUSD: meta.sellUnitPriceUSD
    });
  });

  detail.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return detail;
}

function processSaleReturnV41(sessionToken, payload) {
  payload = payload || {};
  const saleItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(payload.saleId || '');
    });
  const byId = {};
  saleItems.forEach(function(row) {
    byId[String(row.SaleItemID)] = row;
  });

  const converted = Object.assign({}, payload, {
    items: (Array.isArray(payload.items) ? payload.items : []).map(function(item) {
      const saleItem = byId[String(item.saleItemId)];
      if (!saleItem) throw new Error('A selected sale item was not found.');
      const meta = saleItemPackageMetaV41_(saleItem);
      return Object.assign({}, item, {
        qty: roundQtyV41_(number_(item.qty) * meta.factor)
      });
    })
  });

  const result = processSaleReturn(sessionToken, converted);
  const returnId = String(result.returnId || '');
  if (returnId) {
    const rows = getRows_(POS.SHEETS.RETURN_ITEMS)
      .filter(function(row) {
        return String(row.ReturnID) === returnId;
      });
    rows.forEach(function(row) {
      const saleItem = byId[String(row.SaleItemID)] || {};
      const meta = saleItemPackageMetaV41_(saleItem);
      updateRowObject_(POS.SHEETS.RETURN_ITEMS, row._row, {
        ReturnPackageID: meta.packageId,
        ReturnUnitName: meta.unitName,
        ReturnSellQty: roundQtyV41_(number_(row.QtyReturned) / meta.factor),
        UnitsPerReturnUnit: meta.factor
      });
    });
  }

  return getReturnReceiptV41(sessionToken, returnId);
}

function getReturnReceiptV41(sessionToken, returnId) {
  const receipt = getReturnReceipt(sessionToken, returnId);
  const returnRows = getRows_(POS.SHEETS.RETURN_ITEMS)
    .filter(function(row) {
      return String(row.ReturnID) === String(returnId);
    });

  receipt.items = returnRows.map(function(row) {
    const factor = number_(row.UnitsPerReturnUnit, 1) || 1;
    return {
      productName: String(row.ProductName || ''),
      qty: row.ReturnSellQty !== '' && row.ReturnSellQty !== undefined
        ? number_(row.ReturnSellQty)
        : roundQtyV41_(number_(row.QtyReturned) / factor),
      baseQty: number_(row.QtyReturned),
      packageId: String(row.ReturnPackageID || ''),
      unitName: String(row.ReturnUnitName || ''),
      unitsPerUnit: factor,
      refundUSD: number_(row.RefundUSD),
      restock: bool_(row.Restock),
      condition: String(row.Condition || ''),
      costRestoredUSD: number_(row.CostRestoredUSD)
    };
  });
  receipt.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return receipt;
}


/* ==========================================================================
 * SOURCE: PendingFeatureSetup.gs
 * ========================================================================== */
/**
 * One-time installer for:
 * - Pending/held invoices
 * - Percentage discounts
 * - Coupon codes
 *
 * Run installCheckoutPendingFeature() once from the Apps Script editor.
 * This installer only adds missing sheets/columns. It does not clear data.
 */

const CHECKOUT_FEATURE = Object.freeze({
  PENDING_SHEET: 'PendingInvoices',
  COUPON_SHEET: 'Coupons',
  PENDING_HEADERS: [
    'PendingID', 'InvoiceNo', 'DateTime', 'CustomerID', 'CartJSON',
    'SubtotalUSD', 'ManualDiscountType', 'ManualDiscountValue',
    'ManualDiscountPercent', 'ManualDiscountUSD', 'CouponCode', 'CouponDiscountUSD', 'DiscountUSD', 'TaxUSD',
    'TotalUSD', 'TotalKHR', 'ExchangeRate', 'PreferredPayment',
    'Notes', 'Status', 'CashierID', 'CashierName', 'SaleID', 'UpdatedAt'
  ],
  COUPON_HEADERS: [
    'CouponID', 'Code', 'DescriptionEN', 'DescriptionKH',
    'DiscountType', 'DiscountValue', 'MinSpendUSD', 'MaxDiscountUSD',
    'StartDate', 'EndDate', 'UsageLimit', 'UsedCount', 'Active',
    'CreatedAt', 'UpdatedAt'
  ],
  SALES_EXTRA_HEADERS: [
    'ManualDiscountType', 'ManualDiscountValue',
    'ManualDiscountPercent', 'ManualDiscountUSD',
    'CouponCode', 'CouponDiscountUSD'
  ]
});

function installCheckoutPendingFeature() {
  const ss = getSpreadsheet_();

  ensureFeatureSheet_(
    CHECKOUT_FEATURE.PENDING_SHEET,
    CHECKOUT_FEATURE.PENDING_HEADERS
  );

  ensureFeatureSheet_(
    CHECKOUT_FEATURE.COUPON_SHEET,
    CHECKOUT_FEATURE.COUPON_HEADERS
  );

  addMissingColumnsSafe_(
    getSheet_(POS.SHEETS.SALES),
    CHECKOUT_FEATURE.SALES_EXTRA_HEADERS
  );

  SpreadsheetApp.getUi().alert(
    'Checkout feature installed',
    'Created/updated:\n' +
      '• PendingInvoices\n' +
      '• Coupons\n' +
      '• Percent/fixed discount and coupon columns in Sales\n\n' +
      'No existing sales or products were deleted.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function ensureFeatureSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  addMissingColumnsSafe_(sheet, headers);

  sheet.setFrozenRows(1);
  const lastCol = sheet.getLastColumn();

  if (lastCol > 0) {
    sheet.getRange(1, 1, 1, lastCol)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, lastCol);
  }

  return sheet;
}

function addMissingColumnsSafe_(sheet, requiredHeaders) {
  const lastCol = sheet.getLastColumn();

  let existing = [];

  if (lastCol > 0) {
    existing = sheet
      .getRange(1, 1, 1, lastCol)
      .getDisplayValues()[0]
      .map(function(value) {
        return String(value || '').trim();
      });
  }

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (!missing.length) {
    return;
  }

  const startColumn = Math.max(1, lastCol + 1);

  sheet
    .getRange(1, startColumn, 1, missing.length)
    .setValues([missing]);
}

function checkCheckoutPendingFeature() {
  const ss = getSpreadsheet_();

  const pending = ss.getSheetByName(CHECKOUT_FEATURE.PENDING_SHEET);
  const coupons = ss.getSheetByName(CHECKOUT_FEATURE.COUPON_SHEET);
  const sales = getSheet_(POS.SHEETS.SALES);

  const salesHeaders = sales
    .getRange(1, 1, 1, sales.getLastColumn())
    .getDisplayValues()[0];

  const missingSales = CHECKOUT_FEATURE.SALES_EXTRA_HEADERS.filter(
    function(header) {
      return salesHeaders.indexOf(header) === -1;
    }
  );

  SpreadsheetApp.getUi().alert(
    'Checkout feature status',
    'PendingInvoices sheet: ' + (pending ? 'OK' : 'MISSING') + '\n' +
      'Coupons sheet: ' + (coupons ? 'OK' : 'MISSING') + '\n' +
      'Sales extra columns: ' +
      (missingSales.length ? 'Missing ' + missingSales.join(', ') : 'OK'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Optional helper for creating a coupon without manually editing the sheet.
 * Run createCouponPrompt() from the Apps Script function selector.
 */
function createCouponPrompt() {
  const ui = SpreadsheetApp.getUi();

  const codeResponse = ui.prompt(
    'Coupon code',
    'Enter a coupon code, for example WELCOME10:',
    ui.ButtonSet.OK_CANCEL
  );
  if (codeResponse.getSelectedButton() !== ui.Button.OK) return;

  const code = normalizeCouponCode_(codeResponse.getResponseText());
  if (!code) throw new Error('Coupon code is required.');

  const typeResponse = ui.prompt(
    'Discount type',
    'Enter PERCENT or FIXED:',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeResponse.getSelectedButton() !== ui.Button.OK) return;

  const type = String(typeResponse.getResponseText() || '')
    .trim()
    .toUpperCase();

  if (['PERCENT', 'FIXED'].indexOf(type) === -1) {
    throw new Error('Discount type must be PERCENT or FIXED.');
  }

  const valueResponse = ui.prompt(
    'Discount value',
    type === 'PERCENT'
      ? 'Enter the percentage, for example 10:'
      : 'Enter the fixed USD discount, for example 1.50:',
    ui.ButtonSet.OK_CANCEL
  );
  if (valueResponse.getSelectedButton() !== ui.Button.OK) return;

  const value = number_(valueResponse.getResponseText());
  if (value <= 0) throw new Error('Discount value must be greater than zero.');

  const minResponse = ui.prompt(
    'Minimum spend',
    'Enter the minimum subtotal in USD, or 0:',
    ui.ButtonSet.OK_CANCEL
  );
  if (minResponse.getSelectedButton() !== ui.Button.OK) return;

  const now = new Date();
  const existing = findCouponByCode_(code);

  const row = {
    Code: code,
    DescriptionEN: code,
    DescriptionKH: code,
    DiscountType: type,
    DiscountValue: value,
    MinSpendUSD: Math.max(0, number_(minResponse.getResponseText())),
    MaxDiscountUSD: 0,
    StartDate: '',
    EndDate: '',
    UsageLimit: 0,
    UsedCount: existing ? number_(existing.UsedCount) : 0,
    Active: true,
    UpdatedAt: now
  };

  if (existing) {
    updateRowObject_(CHECKOUT_FEATURE.COUPON_SHEET, existing._row, row);
  } else {
    row.CouponID = uuid_('CPN');
    row.CreatedAt = now;
    appendObject_(CHECKOUT_FEATURE.COUPON_SHEET, row);
  }

  ui.alert('Coupon saved: ' + code);
}


/* ==========================================================================
 * SOURCE: PendingInvoices.gs
 * ========================================================================== */
function savePendingInvoice(sessionToken, payload) {
  const user=requireSession_(sessionToken);requirePermission_(user,'POS');payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  return withScriptLock_(function(){
    const validated=validateCart_(payload),pendingId=sanitizeText_(payload&&payload.pendingId,80),existing=pendingId?getPendingInvoiceRowForUser_(user,pendingId,true):null,now=new Date(),preferred=normalizePreferredPayment_(payload&&payload.preferredPayment);
    const snapshot={items:validated.items.map(function(item){return {productId:item.productId,barcode:item.barcode,name:item.productName,unitId:item.unitId||'',unitName:item.unitName||'',qty:item.qty,unitPriceUSD:item.unitPriceUSD,lineTotalUSD:item.lineTotalUSD};}),notes:validated.notes};
    const changes={BranchID:validated.branchId,DateTime:existing?existing.DateTime:now,CustomerID:validated.customerId,CartJSON:JSON.stringify(snapshot),SubtotalUSD:validated.subtotalUSD,ManualDiscountType:validated.manualDiscountType,ManualDiscountValue:validated.manualDiscountValue,ManualDiscountPercent:validated.manualDiscountPercent,ManualDiscountUSD:validated.manualDiscountUSD,CouponCode:validated.couponCode,CouponDiscountUSD:validated.couponDiscountUSD,DiscountUSD:validated.discountUSD,TaxUSD:validated.taxUSD,TotalUSD:validated.totalUSD,TotalKHR:validated.totalKHR,ExchangeRate:validated.exchangeRate,PreferredPayment:preferred,Notes:validated.notes,Status:'OPEN',CashierID:user.UserID,CashierName:user.Name,UpdatedAt:now};
    let row;
    if(existing){updateRowObject_(CHECKOUT_FEATURE.PENDING_SHEET,existing._row,changes);row=Object.assign({},existing,changes);}else{const no=generatePendingNo_();row=Object.assign({},changes,{PendingID:uuid_('PND'),InvoiceNo:no,PendingNo:no,FinalInvoiceNo:'',SaleID:''});appendObject_(CHECKOUT_FEATURE.PENDING_SHEET,row);}
    audit_(user.UserID,existing?'UPDATE_PENDING_INVOICE':'CREATE_PENDING_INVOICE','PendingInvoice',row.PendingID,{pendingNo:row.PendingNo||row.InvoiceNo,totalUSD:validated.totalUSD});return buildPendingReceipt_(row);
  });
}

function listPendingInvoices(sessionToken) {
  const user = requireSession_(sessionToken);
  const canSeeAll = [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
    .indexOf(String(user.Role)) >= 0;

  return getRows_(CHECKOUT_FEATURE.PENDING_SHEET)
    .filter(function(row) {
      const rowBranch = String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID);
      const branchAllowed = canSeeAll || rowBranch === String(getUserBranchId_(user));
      const cashierAllowed = canSeeAll || String(row.CashierID) === String(user.UserID);
      return String(row.Status || 'OPEN') === 'OPEN' && branchAllowed && cashierAllowed;
    })
    .sort(function(a, b) {
      return new Date(b.UpdatedAt || b.DateTime).getTime() -
        new Date(a.UpdatedAt || a.DateTime).getTime();
    })
    .map(function(row) {
      const cart = safeJsonParse_(row.CartJSON, {});
      const items = Array.isArray(cart.items) ? cart.items : [];

      return {
        pendingId: String(row.PendingID),
        branchId: String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID),
        invoiceNo: String(row.PendingNo || row.InvoiceNo),
        dateTime: new Date(row.DateTime).toISOString(),
        updatedAt: new Date(row.UpdatedAt || row.DateTime).toISOString(),
        customerId: String(row.CustomerID || ''),
        itemCount: items.reduce(function(sum, item) {
          return sum + number_(item.qty);
        }, 0),
        totalUSD: number_(row.TotalUSD),
        totalKHR: number_(row.TotalKHR),
        preferredPayment: normalizePreferredPayment_(
          row.PreferredPayment
        ),
        cashierName: String(row.CashierName || ''),
        couponCode: String(row.CouponCode || '')
      };
    });
}

function getPendingInvoice(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];

  return {
    pendingId: String(row.PendingID),
    branchId: String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    customerId: String(row.CustomerID || ''),
    customerName: row.CustomerID ? String((findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',row.CustomerID)||{}).Name || '') : 'Walk-in customer',
    customerType: row.CustomerID ? String((findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',row.CustomerID)||{}).CustomerType || 'RETAIL') : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        qty: number_(item.qty)
      };
    }),
    manualDiscountType: storedManualDiscountType_(row),
    manualDiscountValue: storedManualDiscountValue_(row),
    manualDiscountPercent: number_(row.ManualDiscountPercent),
    manualDiscountUSD: number_(row.ManualDiscountUSD),
    couponCode: String(row.CouponCode || ''),
    couponDiscountUSD: number_(row.CouponDiscountUSD),
    preferredPayment: normalizePreferredPayment_(
      row.PreferredPayment
    ),
    notes: String(row.Notes || ''),
    receipt: buildPendingReceipt_(row)
  };
}

function printPendingInvoice(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  return buildPendingReceipt_(row);
}

function cancelPendingInvoice(sessionToken, pendingId, reason) {
  const user = requireSession_(sessionToken);

  return withScriptLock_(function() {
    const row = getPendingInvoiceRowForUser_(user, pendingId, true);

    updateRowObject_(CHECKOUT_FEATURE.PENDING_SHEET, row._row, {
      Status: 'CANCELLED',
      Notes: [
        String(row.Notes || ''),
        reason ? 'Cancelled: ' + sanitizeText_(reason, 180) : ''
      ].filter(Boolean).join(' | '),
      UpdatedAt: new Date()
    });

    audit_(
      user.UserID,
      'CANCEL_PENDING_INVOICE',
      'PendingInvoice',
      row.PendingID,
      {
        invoiceNo: row.InvoiceNo,
        reason: sanitizeText_(reason, 180)
      }
    );

    return {
      success: true,
      pendingId: String(row.PendingID)
    };
  });
}

function getPendingInvoiceRowForUser_(user, pendingId, requireOpen) {
  const row = findRowBy_(
    CHECKOUT_FEATURE.PENDING_SHEET,
    'PendingID',
    pendingId
  );

  if (!row) {
    throw new Error('Pending invoice was not found.');
  }

  const manager = [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
    .indexOf(String(user.Role)) >= 0;

  const rowBranch = String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID);
  if (!manager && rowBranch !== String(getUserBranchId_(user))) {
    throw new Error('This pending invoice belongs to another branch.');
  }
  if (!manager && String(row.CashierID) !== String(user.UserID)) {
    throw new Error('You do not have access to this pending invoice.');
  }

  if (
    requireOpen &&
    String(row.Status || 'OPEN') !== 'OPEN'
  ) {
    throw new Error('This pending invoice is no longer open.');
  }

  return row;
}

function markPendingCompletedLocked_(pendingId, saleId, finalInvoiceNo) {
  if (!pendingId) return;
  const row=findRowBy_(CHECKOUT_FEATURE.PENDING_SHEET,'PendingID',pendingId);if(!row)return;
  if(String(row.Status||'OPEN')!=='OPEN')throw new Error('This pending invoice is no longer open.');
  updateRowObject_(CHECKOUT_FEATURE.PENDING_SHEET,row._row,{Status:'COMPLETED',SaleID:saleId,FinalInvoiceNo:finalInvoiceNo||'',UpdatedAt:new Date()});
}

function buildPendingReceipt_(row) {
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];
  const settings = getPublicSettings_();

  return {
    isPending: true,
    paid: false,
    status: 'PENDING',
    pendingId: String(row.PendingID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    dateTime: new Date(row.DateTime).toISOString(),
    cashierName: String(row.CashierName || ''),
    customerId: String(row.CustomerID || ''),
    customerName: row.CustomerID ? String((findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',row.CustomerID)||{}).Name || '') : 'Walk-in customer',
    customerType: row.CustomerID ? String((findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',row.CustomerID)||{}).CustomerType || 'RETAIL') : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        name: String(item.name || ''),
        qty: number_(item.qty),
        unitId: String(item.unitId || ''),
        unitName: String(item.unitName || ''),
        unitPriceUSD: number_(item.unitPriceUSD),
        lineTotalUSD: number_(item.lineTotalUSD)
      };
    }),
    subtotalUSD: number_(row.SubtotalUSD),
    manualDiscountType: storedManualDiscountType_(row),
    manualDiscountValue: storedManualDiscountValue_(row),
    manualDiscountPercent: number_(row.ManualDiscountPercent),
    manualDiscountUSD: number_(row.ManualDiscountUSD),
    couponCode: String(row.CouponCode || ''),
    couponDiscountUSD: number_(row.CouponDiscountUSD),
    discountUSD: number_(row.DiscountUSD),
    taxUSD: number_(row.TaxUSD),
    totalUSD: number_(row.TotalUSD),
    totalKHR: number_(row.TotalKHR),
    exchangeRate: number_(row.ExchangeRate),
    paymentMethod: normalizePreferredPayment_(row.PreferredPayment),
    preferredPayment: normalizePreferredPayment_(
      row.PreferredPayment
    ),
    paymentCurrency: '',
    paymentAmount: 0,
    reference: '',
    notes: String(row.Notes || ''),
    shop: settings
  };
}

function normalizePreferredPayment_(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  return ['CASH', 'BANK', 'CREDIT'].indexOf(normalized) >= 0
    ? normalized
    : 'UNDECIDED';
}

function generatePendingNo_() {
  const key=dateKey_(new Date()),props=PropertiesService.getScriptProperties(),counterKey='PENDING_COUNTER_'+key,next=number_(props.getProperty(counterKey),0)+1;
  props.setProperty(counterKey,String(next));
  return 'PEN-INV-'+key+'-'+String(next).padStart(4,'0');
}


/* ==========================================================================
 * SOURCE: ProductPackagingSetupV41.gs
 * ========================================================================== */
/**
 * Tiny POS Product Packaging v4.1 installer.
 *
 * This installer is additive. It creates one new sheet and adds only missing
 * columns. Existing product, purchase, sale, stock, FIFO, return, branch and
 * permission data are not cleared or rewritten.
 */
const PRODUCT_PACKAGING_SCHEMA_V41 = Object.freeze({
  ProductPackages: [
    'PackageID','ProductID','PackageUnitID','PackageNameEN','PackageNameKH',
    'UnitsPerPackage','PackageBarcode','PriceUSD','PriceKHR',
    'AllowPurchase','AllowSale','Active','CreatedAt','UpdatedAt'
  ],
  Products: ['ProductCode'],
  SaleItems: [
    'SellPackageID','SellUnitName','SellQty','UnitsPerSellUnit',
    'SellBarcode','SellUnitPriceUSD'
  ],
  PurchaseItems: [
    'PurchasePackageID','PurchaseUnitName','PurchaseQty',
    'UnitsPerPurchaseUnit','PurchaseBarcode','PurchaseUnitCostUSD'
  ],
  ReturnItems: [
    'ReturnPackageID','ReturnUnitName','ReturnSellQty','UnitsPerReturnUnit'
  ],
  SupplierReturnItems: [
    'ReturnPackageID','ReturnUnitName','ReturnPurchaseQty','UnitsPerReturnUnit'
  ]
});

function installProductPackagingV41() {
  const ss = getSpreadsheet_();
  const report = [];

  Object.keys(PRODUCT_PACKAGING_SCHEMA_V41).forEach(function(sheetName) {
    ensureProductPackagingSheetV41_(
      ss,
      sheetName,
      PRODUCT_PACKAGING_SCHEMA_V41[sheetName],
      report
    );
  });

  ensurePackagingUnitsV41_();

  const codeResult = assignMissingProductCodesV41_();
  report.push('Product codes assigned: ' + codeResult.assigned);
  report.push('Next product code: ' + codeResult.nextCode);

  SpreadsheetApp.flush();

  const message = [
    'Tiny POS Product Packaging v4.1 installed.',
    '',
    report.join('\n'),
    '',
    'Existing rows were not cleared.'
  ].join('\n');

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return {
    success: true,
    report: report,
    nextProductCode: codeResult.nextCode
  };
}

function ensureProductPackagingSheetV41_(ss, sheetName, requiredHeaders, report) {
  let sheet = ss.getSheetByName(sheetName);
  const wasCreated = !sheet;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn)
      .getDisplayValues()[0]
      .map(function(value) {
        return String(value || '').trim();
      })
    : [];

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    const startColumn = lastColumn + 1;
    const requiredFinalColumn = startColumn + missing.length - 1;

    if (requiredFinalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        requiredFinalColumn - sheet.getMaxColumns()
      );
    }

    sheet.getRange(1, startColumn, 1, missing.length)
      .setValues([missing]);

    report.push(
      sheetName + ': added ' + missing.length + ' column(s)'
    );
  }

  /*
   * Preserve the formatting of every existing sheet. Only the newly created
   * ProductPackages sheet receives a basic header style.
   */
  if (wasCreated && sheet.getLastColumn() > 0) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

function ensurePackagingUnitsV41_() {
  const existing = getRows_(POS.SHEETS.UNITS);
  const byId = {};

  existing.forEach(function(row) {
    byId[String(row.UnitID)] = row;
  });

  const now = new Date();
  const defaults = [
    {
      UnitID: 'UNT-BOX',
      NameEN: 'Box',
      NameKH: 'ប្រអប់',
      Abbreviation: 'box',
      AllowDecimal: false,
      SortOrder: 3,
      Active: true
    },
    {
      UnitID: 'UNT-BAG',
      NameEN: 'Bag',
      NameKH: 'ថង់',
      Abbreviation: 'bag',
      AllowDecimal: false,
      SortOrder: 4,
      Active: true
    },
    {
      UnitID: 'UNT-PACK',
      NameEN: 'Pack',
      NameKH: 'កញ្ចប់',
      Abbreviation: 'pack',
      AllowDecimal: false,
      SortOrder: 5,
      Active: true
    },
    {
      UnitID: 'UNT-CARTON',
      NameEN: 'Carton',
      NameKH: 'កេស',
      Abbreviation: 'ctn',
      AllowDecimal: false,
      SortOrder: 6,
      Active: true
    },
    {
      UnitID: 'UNT-TRAY',
      NameEN: 'Tray',
      NameKH: 'ថាស',
      Abbreviation: 'tray',
      AllowDecimal: false,
      SortOrder: 7,
      Active: true
    }
  ];

  defaults.forEach(function(unit) {
    if (byId[unit.UnitID]) return;

    appendObject_(POS.SHEETS.UNITS, Object.assign({}, unit, {
      CreatedAt: now,
      UpdatedAt: now
    }));
  });
}

function assignMissingProductCodesV41_() {
  return withScriptLock_(function() {
    const products = getRows_(POS.SHEETS.PRODUCTS)
      .sort(function(a, b) {
        return number_(a._row) - number_(b._row);
      });

    let maximum = getMaximumProductCodeNumberV41_(products);
    let assigned = 0;

    products.forEach(function(product) {
      if (String(product.ProductCode || '').trim()) return;

      maximum += 1;
      updateRowObject_(POS.SHEETS.PRODUCTS, product._row, {
        ProductCode: formatProductCodeV41_(maximum),
        UpdatedAt: new Date()
      });
      assigned += 1;
    });

    PropertiesService.getScriptProperties().setProperty(
      'PRODUCT_CODE_COUNTER_V41',
      String(maximum)
    );

    return {
      assigned: assigned,
      nextCode: formatProductCodeV41_(maximum + 1)
    };
  });
}

function verifyProductPackagingV41() {
  const ss = getSpreadsheet_();
  const issues = [];

  Object.keys(PRODUCT_PACKAGING_SCHEMA_V41).forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      issues.push(sheetName + ': MISSING SHEET');
      return;
    }

    const headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn())
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
      : [];

    const missing = PRODUCT_PACKAGING_SCHEMA_V41[sheetName]
      .filter(function(header) {
        return headers.indexOf(header) === -1;
      });

    if (missing.length) {
      issues.push(sheetName + ': missing ' + missing.join(', '));
    }
  });

  const duplicateCodes = {};
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    const code = String(product.ProductCode || '').trim().toUpperCase();
    if (!code) return;
    duplicateCodes[code] = number_(duplicateCodes[code]) + 1;
  });

  Object.keys(duplicateCodes).forEach(function(code) {
    if (duplicateCodes[code] > 1) {
      issues.push('Duplicate product code: ' + code);
    }
  });

  const barcodeOwners = {};
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    const barcode = String(product.Barcode || '').trim();
    if (!barcode) return;
    barcodeOwners[barcode] = 'Product ' + String(product.ProductCode || product.ProductID);
  });

  getRows_('ProductPackages').forEach(function(pkg) {
    const barcode = String(pkg.PackageBarcode || '').trim();
    if (!barcode) return;

    if (barcodeOwners[barcode]) {
      issues.push(
        'Duplicate barcode ' + barcode + ': ' +
        barcodeOwners[barcode] + ' and package ' + String(pkg.PackageID)
      );
    } else {
      barcodeOwners[barcode] = 'Package ' + String(pkg.PackageID);
    }
  });

  const message = issues.length
    ? issues.join('\n')
    : 'Tiny POS Product Packaging v4.1: OK';

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return message;
}


/* ==========================================================================
 * SOURCE: ProductPackagingV41.gs
 * ========================================================================== */
/**
 * Tiny POS Product Packaging v4.1 — product/package master data.
 *
 * Inventory and FIFO always remain in the product base unit.
 * Example: Coca-Cola base unit Can; one Box package = 24 Cans.
 */
const PRODUCT_PACKAGING_V41 = Object.freeze({
  VERSION: '4.1.0',
  SHEET: 'ProductPackages',
  BASE_PACKAGE_ID: '',
  CODE_PREFIX: 'P',
  CODE_DIGITS: 6,
  MAX_PACKAGES_PER_PRODUCT: 12
});

function formatProductCodeV41_(number) {
  return PRODUCT_PACKAGING_V41.CODE_PREFIX +
    String(Math.max(0, Math.floor(number_(number)))).padStart(
      PRODUCT_PACKAGING_V41.CODE_DIGITS,
      '0'
    );
}

function getMaximumProductCodeNumberV41_(products) {
  let maximum = 0;

  (products || getRows_(POS.SHEETS.PRODUCTS)).forEach(function(product) {
    const match = String(product.ProductCode || '')
      .trim()
      .toUpperCase()
      .match(/^P(\d{1,12})$/);

    if (match) {
      maximum = Math.max(maximum, number_(match[1]));
    }
  });

  return maximum;
}

function nextProductCodeLockedV41_() {
  const props = PropertiesService.getScriptProperties();
  const rows = getRows_(POS.SHEETS.PRODUCTS);
  const maximumInSheet = getMaximumProductCodeNumberV41_(rows);
  const stored = number_(props.getProperty('PRODUCT_CODE_COUNTER_V41'));
  const next = Math.max(maximumInSheet, stored) + 1;

  props.setProperty('PRODUCT_CODE_COUNTER_V41', String(next));
  return formatProductCodeV41_(next);
}

function previewNextProductCodeV41(sessionToken) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');

  const maximum = Math.max(
    getMaximumProductCodeNumberV41_(),
    number_(
      PropertiesService.getScriptProperties()
        .getProperty('PRODUCT_CODE_COUNTER_V41')
    )
  );

  return formatProductCodeV41_(maximum + 1);
}

function packageRowsV41_(productId, includeInactive) {
  return getRows_(PRODUCT_PACKAGING_V41.SHEET)
    .filter(function(row) {
      return (!productId || String(row.ProductID) === String(productId)) &&
        (includeInactive || bool_(row.Active));
    });
}

function packageUnitNameV41_(row, unitMap, language) {
  unitMap = unitMap || getUnitMap_();
  const unit = unitMap[String(row.PackageUnitID || '')] || {};
  const km = language === 'km';

  return String(
    km
      ? row.PackageNameKH || unit.nameKH || row.PackageNameEN || unit.nameEN
      : row.PackageNameEN || unit.nameEN || row.PackageNameKH || unit.nameKH
  ) || String(unit.abbreviation || 'Package');
}

function packageToPublicV41_(row, unitMap) {
  unitMap = unitMap || getUnitMap_();
  const unit = unitMap[String(row.PackageUnitID || '')] || {};

  return {
    packageId: String(row.PackageID || ''),
    productId: String(row.ProductID || ''),
    packageUnitId: String(row.PackageUnitID || ''),
    packageNameEN: String(row.PackageNameEN || unit.nameEN || ''),
    packageNameKH: String(row.PackageNameKH || unit.nameKH || ''),
    abbreviation: String(unit.abbreviation || ''),
    allowDecimal: unit.allowDecimal === true,
    unitsPerPackage: Math.round(number_(row.UnitsPerPackage) * 1000) / 1000,
    barcode: String(row.PackageBarcode || ''),
    priceUSD: roundMoney_(number_(row.PriceUSD)),
    priceKHR: Math.round(number_(row.PriceKHR)),
    allowPurchase: bool_(row.AllowPurchase),
    allowSale: bool_(row.AllowSale),
    active: bool_(row.Active)
  };
}

function packageMapV41_(includeInactive) {
  const map = {};
  const units = getUnitMap_();

  packageRowsV41_('', includeInactive).forEach(function(row) {
    map[String(row.PackageID)] = Object.assign(
      {row: row},
      packageToPublicV41_(row, units)
    );
  });

  return map;
}

function packagesByProductV41_(includeInactive) {
  const map = {};
  const units = getUnitMap_();

  packageRowsV41_('', includeInactive).forEach(function(row) {
    const productId = String(row.ProductID || '');
    if (!map[productId]) map[productId] = [];
    map[productId].push(packageToPublicV41_(row, units));
  });

  Object.keys(map).forEach(function(productId) {
    map[productId].sort(function(a, b) {
      return number_(a.unitsPerPackage) - number_(b.unitsPerPackage) ||
        String(a.packageNameEN).localeCompare(String(b.packageNameEN));
    });
  });

  return map;
}

function enrichProductsWithPackagesV41_(products) {
  const grouped = packagesByProductV41_(true);
  const productRows = {};

  getRows_(POS.SHEETS.PRODUCTS).forEach(function(row) {
    productRows[String(row.ProductID)] = row;
  });

  return (products || []).map(function(product) {
    const row = productRows[String(product.productId)] || {};
    return Object.assign({}, product, {
      productCode: String(row.ProductCode || ''),
      packages: (grouped[String(product.productId)] || []).map(function(pkg) {
        return Object.assign({}, pkg);
      })
    });
  });
}

function bootstrapV41(initData, sessionToken) {
  const result = bootstrap(initData, sessionToken);
  if (result && result.authenticated) {
    result.products = enrichProductsWithPackagesV41_(result.products || []);
    result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  }
  return result;
}

function refreshAppDataV41(sessionToken) {
  const result = refreshAppData(sessionToken);
  result.products = enrichProductsWithPackagesV41_(result.products || []);
  result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return result;
}

function getBranchWorkspaceV41(sessionToken, branchId) {
  const result = getBranchWorkspaceV38(sessionToken, branchId);
  result.products = enrichProductsWithPackagesV41_(result.products || []);
  result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return result;
}

function listProductPackagesV41(sessionToken, productId, includeInactive) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');

  return packageRowsV41_(productId, includeInactive === true)
    .map(function(row) {
      return packageToPublicV41_(row, getUnitMap_());
    });
}

function validateProductCodeV41_(productCode, productId) {
  const code = sanitizeText_(productCode, 30).toUpperCase();

  if (!/^P\d{6,}$/.test(code)) {
    throw new Error('Product code must use the format P000001.');
  }

  const duplicate = getRows_(POS.SHEETS.PRODUCTS).find(function(row) {
    return String(row.ProductCode || '').trim().toUpperCase() === code &&
      String(row.ProductID || '') !== String(productId || '');
  });

  if (duplicate) {
    throw new Error('This product code is already used by another product.');
  }

  return code;
}

function validatePackageBarcodeV41_(barcode, productId, packageId) {
  barcode = sanitizeText_(barcode, 80);
  if (!barcode) return '';

  const productDuplicate = getRows_(POS.SHEETS.PRODUCTS).find(function(row) {
    /*
     * A package barcode must be different from every base-unit barcode,
     * including the base barcode of this same product.
     */
    return String(row.Barcode || '') === barcode;
  });

  if (productDuplicate) {
    throw new Error('Package barcode ' + barcode + ' is already a product barcode.');
  }

  const packageDuplicate = packageRowsV41_('', true).find(function(row) {
    return String(row.PackageBarcode || '') === barcode &&
      String(row.PackageID || '') !== String(packageId || '');
  });

  if (packageDuplicate) {
    throw new Error('Package barcode ' + barcode + ' is already in use.');
  }

  return barcode;
}

function saveProductPackagesLockedV41_(productId, baseProduct, packages, user) {
  const incoming = Array.isArray(packages) ? packages : [];

  if (incoming.length > PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT) {
    throw new Error(
      'A product can have at most ' +
      PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT +
      ' package units.'
    );
  }

  const unitMap = getUnitMap_();
  const existing = packageRowsV41_(productId, true);
  const existingMap = {};
  const retained = {};
  const now = new Date();

  existing.forEach(function(row) {
    existingMap[String(row.PackageID)] = row;
  });

  const seenBarcodes = {};
  const seenDefinitions = {};

  incoming.forEach(function(raw) {
    raw = raw || {};
    const packageId = sanitizeText_(raw.packageId, 80);
    const old = packageId ? existingMap[packageId] : null;
    const packageUnitId = sanitizeText_(raw.packageUnitId, 80);
    const unit = unitMap[packageUnitId];

    if (!unit) {
      throw new Error('Select a valid package unit such as Box, Bag or Pack.');
    }

    const factor = Math.round(number_(raw.unitsPerPackage) * 1000) / 1000;
    if (factor <= 1) {
      throw new Error('Units per package must be greater than 1.');
    }

    const definitionKey = packageUnitId + '|' + factor;
    if (seenDefinitions[definitionKey]) {
      throw new Error('The same package unit and conversion was entered twice.');
    }
    seenDefinitions[definitionKey] = true;

    const barcode = validatePackageBarcodeV41_(
      raw.barcode,
      productId,
      packageId
    );

    if (barcode && seenBarcodes[barcode]) {
      throw new Error('The same package barcode was entered twice.');
    }
    if (barcode) seenBarcodes[barcode] = true;

    const priceUSD = roundMoney_(number_(raw.priceUSD));
    const priceKHR = Math.round(number_(raw.priceKHR));

    if (priceUSD < 0 || priceKHR < 0) {
      throw new Error('Package selling prices cannot be negative.');
    }

    const changes = {
      ProductID: productId,
      PackageUnitID: packageUnitId,
      PackageNameEN: sanitizeText_(raw.packageNameEN, 80) || String(unit.nameEN || ''),
      PackageNameKH: sanitizeText_(raw.packageNameKH, 80) || String(unit.nameKH || ''),
      UnitsPerPackage: factor,
      PackageBarcode: barcode,
      PriceUSD: priceUSD,
      PriceKHR: priceKHR,
      AllowPurchase: raw.allowPurchase !== false,
      AllowSale: raw.allowSale !== false,
      Active: raw.active !== false,
      UpdatedAt: now
    };

    let savedId;
    if (old) {
      savedId = String(old.PackageID);
      updateRowObject_(PRODUCT_PACKAGING_V41.SHEET, old._row, changes);
    } else {
      savedId = uuid_('PKG');
      changes.PackageID = savedId;
      changes.CreatedAt = now;
      appendObject_(PRODUCT_PACKAGING_V41.SHEET, changes);
    }

    retained[savedId] = true;
  });

  existing.forEach(function(row) {
    if (retained[String(row.PackageID)]) return;
    if (!bool_(row.Active)) return;

    updateRowObject_(PRODUCT_PACKAGING_V41.SHEET, row._row, {
      Active: false,
      UpdatedAt: now
    });
  });

  audit_(user.UserID, 'SAVE_PRODUCT_PACKAGES', 'Product', productId, {
    packageCount: incoming.length,
    baseUnitId: String(baseProduct.UnitID || '')
  });
}


function validateProductPackagePayloadV41_(payload, existingProduct) {
  payload = payload || {};
  const incoming = Array.isArray(payload.packages)
    ? payload.packages
    : [];

  if (
    incoming.length >
    PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT
  ) {
    throw new Error(
      'A product can have at most ' +
      PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT +
      ' package units.'
    );
  }

  const units = getUnitMap_();
  const baseBarcode = sanitizeText_(
    payload.barcode,
    80
  );
  const productId = existingProduct
    ? String(existingProduct.ProductID)
    : '';
  const seenBarcodes = {};
  const seenDefinitions = {};

  incoming.forEach(function(raw) {
    raw = raw || {};

    const unitId = sanitizeText_(
      raw.packageUnitId,
      80
    );

    if (!units[unitId]) {
      throw new Error(
        'Select a valid package unit such as Box, Bag or Pack.'
      );
    }

    const factor = roundQtyV41_(
      raw.unitsPerPackage
    );

    if (factor <= 1) {
      throw new Error(
        'Units per package must be greater than 1.'
      );
    }

    const definitionKey =
      unitId + '|' + factor;

    if (seenDefinitions[definitionKey]) {
      throw new Error(
        'The same package unit and conversion was entered twice.'
      );
    }

    seenDefinitions[definitionKey] = true;

    const barcode = sanitizeText_(
      raw.barcode,
      80
    );

    if (barcode) {
      if (barcode === baseBarcode) {
        throw new Error(
          'Base-unit barcode and package barcode must be different.'
        );
      }

      if (seenBarcodes[barcode]) {
        throw new Error(
          'The same package barcode was entered twice.'
        );
      }

      seenBarcodes[barcode] = true;

      const productDuplicate =
        getRows_(POS.SHEETS.PRODUCTS)
          .find(function(row) {
            return String(row.Barcode || '') ===
              barcode;
          });

      if (productDuplicate) {
        throw new Error(
          'Package barcode ' +
          barcode +
          ' is already a product barcode.'
        );
      }

      const packageDuplicate =
        packageRowsV41_('', true)
          .find(function(row) {
            return String(row.PackageBarcode || '') ===
              barcode &&
              String(row.PackageID || '') !==
                String(raw.packageId || '');
          });

      if (packageDuplicate) {
        throw new Error(
          'Package barcode ' +
          barcode +
          ' is already in use.'
        );
      }
    }

    if (
      number_(raw.priceUSD) < 0 ||
      number_(raw.priceKHR) < 0
    ) {
      throw new Error(
        'Package selling prices cannot be negative.'
      );
    }
  });

  if (
    payload.productCode &&
    existingProduct
  ) {
    validateProductCodeV41_(
      payload.productCode,
      productId
    );
  }
}

function saveProductWithPackagesV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');
  payload = payload || {};

  const existingBeforeSave = payload.productId
    ? findRowBy_(
        POS.SHEETS.PRODUCTS,
        'ProductID',
        payload.productId
      )
    : null;

  validateProductPackagePayloadV41_(
    payload,
    existingBeforeSave
  );

  /*
   * saveProduct() already uses the Apps Script lock. Do not place it inside
   * another ScriptLock because ScriptLock is not re-entrant.
   */
  const baseResult = saveProduct(sessionToken, payload);

  return withScriptLock_(function() {
    const product = findRowBy_(
      POS.SHEETS.PRODUCTS,
      'ProductID',
      baseResult.productId
    );

    if (!product) {
      throw new Error('Product was saved but could not be reloaded.');
    }

    let productCode = sanitizeText_(
      payload.productCode,
      30
    ).toUpperCase();

    if (!productCode) {
      productCode = product.ProductCode
        ? String(product.ProductCode)
        : nextProductCodeLockedV41_();
    }

    productCode = validateProductCodeV41_(
      productCode,
      product.ProductID
    );

    updateRowObject_(
      POS.SHEETS.PRODUCTS,
      product._row,
      {
        ProductCode: productCode,
        UpdatedAt: new Date()
      }
    );

    product.ProductCode = productCode;

    saveProductPackagesLockedV41_(
      String(product.ProductID),
      product,
      payload.packages,
      user
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      productId: String(product.ProductID),
      productCode: productCode,
      imageUrl: String(
        product.ImageURL ||
        baseResult.imageUrl ||
        ''
      ),
      packages: packageRowsV41_(
        product.ProductID,
        true
      ).map(function(row) {
        return packageToPublicV41_(
          row,
          getUnitMap_()
        );
      })
    };
  });
}

function resolvePackageV41_(product, packageId, purpose, packageMap) {
  const id = sanitizeText_(packageId, 80);
  const unitMap = getUnitMap_();
  const baseUnit = unitMap[String(product.UnitID || '')] || {};

  if (!id) {
    return {
      packageId: '',
      productId: String(product.ProductID),
      unitId: String(product.UnitID || ''),
      unitName: String(baseUnit.abbreviation || baseUnit.nameEN || baseUnit.nameKH || ''),
      barcode: String(product.Barcode || ''),
      factor: 1,
      allowDecimal: baseUnit.allowDecimal === true,
      priceUSD: roundMoney_(number_(product.PriceUSD)),
      priceKHR: Math.round(number_(product.PriceKHR))
    };
  }

  packageMap = packageMap || packageMapV41_(false);
  const pkg = packageMap[id];

  if (!pkg || String(pkg.productId) !== String(product.ProductID) || !pkg.active) {
    throw new Error('The selected product package is unavailable.');
  }

  if (purpose === 'SALE' && !pkg.allowSale) {
    throw new Error('This package is not enabled for sale.');
  }

  if (purpose === 'PURCHASE' && !pkg.allowPurchase) {
    throw new Error('This package is not enabled for purchase.');
  }

  return {
    packageId: pkg.packageId,
    productId: pkg.productId,
    unitId: pkg.packageUnitId,
    unitName: String(pkg.abbreviation || pkg.packageNameEN || pkg.packageNameKH || ''),
    barcode: String(pkg.barcode || ''),
    factor: number_(pkg.unitsPerPackage, 1),
    allowDecimal: pkg.allowDecimal === true,
    priceUSD: pkg.priceUSD > 0
      ? pkg.priceUSD
      : roundMoney_(number_(product.PriceUSD) * number_(pkg.unitsPerPackage, 1)),
    priceKHR: pkg.priceKHR > 0
      ? pkg.priceKHR
      : Math.round(number_(product.PriceKHR) * number_(pkg.unitsPerPackage, 1)),
    packageNameEN: pkg.packageNameEN,
    packageNameKH: pkg.packageNameKH
  };
}


/* ==========================================================================
 * SOURCE: ProductionStabilityV38.gs
 * ========================================================================== */
/** Tiny POS v3.8 production stability and complete branch scope. */
function settingValueV38_(key) {
  return getSettings_()[String(key)];
}

function getBranchContextV38_(user) {
  const branches = branchRowsForUser_(user, false).map(branchToPublic_);
  return {
    canSwitch: canManageAllBranches_(user),
    defaultBranchId: getUserBranchId_(user),
    branches: branches
  };
}

function resolveSaleBranchForPayloadV38_(user, payload) {
  payload = payload || {};
  const pendingId = sanitizeText_(payload.pendingId, 80);
  if (pendingId) {
    const pending = findRowBy_(POS.SHEETS.PENDING_INVOICES, 'PendingID', pendingId);
    if (pending) return resolveAccessibleBranchId_(user, pending.BranchID || getUserBranchId_(user), false);
  }
  return resolveAccessibleBranchId_(user, payload.branchId || getUserBranchId_(user), false);
}

function listProductsForBranchV38_(user, requestedBranchId) {
  const branchId = resolveAccessibleBranchId_(user, requestedBranchId, false);
  const includeInactive = [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK].indexOf(String(user.Role)) >= 0;
  const units = getUnitMap_();
  return getRows_(POS.SHEETS.PRODUCTS)
    .filter(function(row){ return includeInactive || bool_(row.Active); })
    .map(function(row){
      const item = productToPublic_(row, units);
      item.currentStock = getBranchStockQty_(branchId, row.ProductID);
      item.costUSD = getBranchAverageCost_(branchId, row.ProductID);
      item.branchId = branchId;
      return item;
    });
}

function getDashboardForBranchV38_(user, requestedBranchId) {
  const branchId = resolveAccessibleBranchId_(user, requestedBranchId, false);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const sales = getRows_(POS.SHEETS.SALES).filter(function(row){
    return String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === branchId && reportSaleIncluded_(row);
  });
  const returns = getRows_(POS.SHEETS.RETURNS).filter(function(row){
    return String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === branchId && String(row.Status || '') !== 'CANCELLED';
  });
  const saleItems = getRows_(POS.SHEETS.SALE_ITEMS);
  const saleItemMap = {};
  saleItems.forEach(function(item){
    const id = String(item.SaleID || '');
    if (!saleItemMap[id]) saleItemMap[id] = [];
    saleItemMap[id].push(item);
  });
  const todaySales = sales.filter(function(row){ return reportInRange_(row.DateTime || row.CreatedAt, {from:start,to:end}); });
  const monthSales = sales.filter(function(row){ return reportInRange_(row.DateTime || row.CreatedAt, {from:monthStart,to:end}); });
  const todayReturns = returns.filter(function(row){ return reportInRange_(row.DateTime || row.CreatedAt, {from:start,to:end}); });
  let todayNet = todaySales.reduce(function(sum,row){return sum + number_(row.TotalUSD);},0) - todayReturns.reduce(function(sum,row){return sum + number_(row.AmountUSD);},0);
  let todayCost = 0;
  todaySales.forEach(function(sale){ (saleItemMap[String(sale.SaleID)] || []).forEach(function(item){ todayCost += saleItemCost_(item); }); });
  const low = getRows_(POS.SHEETS.PRODUCTS).filter(function(product){
    const qty = getBranchStockQty_(branchId, product.ProductID);
    return bool_(product.Active) && qty <= number_(product.LowStockLevel) && qty > 0;
  }).length;
  const pendingPurchases = getRows_(POS.SHEETS.PURCHASES).filter(function(row){
    return String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === branchId && ['DRAFT','ORDERED','PARTIALLY_RECEIVED'].indexOf(String(row.Status || '').toUpperCase()) >= 0;
  }).length;
  const pendingInvoices = getRows_(POS.SHEETS.PENDING_INVOICES).filter(function(row){
    return String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === branchId && String(row.Status || 'OPEN') === 'OPEN';
  }).length;
  const openCreditCustomers = {};
  getRows_(POS.SHEETS.RECEIVABLES).forEach(function(row){
    const sale = findRowBy_(POS.SHEETS.SALES, 'SaleID', row.SaleID);
    if (sale && String(sale.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === branchId && number_(row.BalanceUSD) > 0) openCreditCustomers[String(row.CustomerID)] = true;
  });
  const weekly = [];
  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const dayStart = new Date(day.getFullYear(),day.getMonth(),day.getDate());
    const dayEnd = new Date(day.getFullYear(),day.getMonth(),day.getDate(),23,59,59,999);
    const amount = sales.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,{from:dayStart,to:dayEnd});}).reduce(function(sum,row){return sum+number_(row.TotalUSD);},0) - returns.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,{from:dayStart,to:dayEnd});}).reduce(function(sum,row){return sum+number_(row.AmountUSD);},0);
    weekly.push({date:Utilities.formatDate(day,POS.TIME_ZONE,'yyyy-MM-dd'),label:Utilities.formatDate(day,POS.TIME_ZONE,'EEE'),amountUSD:roundMoney_(amount)});
  }
  return {
    branchId: branchId,
    todayRevenueUSD: roundMoney_(todayNet),
    todayGrossProfitUSD: roundMoney_(todayNet - todayCost),
    todayTransactions: todaySales.length,
    monthRevenueUSD: roundMoney_(monthSales.reduce(function(sum,row){return sum+number_(row.TotalUSD);},0)),
    lowStockProducts: low,
    pendingPurchaseCount: pendingPurchases,
    pendingInvoiceCount: pendingInvoices,
    openCreditCustomerCount: Object.keys(openCreditCustomers).length,
    todayRefundCount: todayReturns.length,
    weeklySales: weekly
  };
}

function getBranchWorkspaceV38(sessionToken, branchId) {
  const user = requireSession_(sessionToken);
  const selected = resolveAccessibleBranchId_(user, branchId || getUserBranchId_(user), false);
  return {
    branchId: selected,
    branchContext: getBranchContextV38_(user),
    products: listProductsForBranchV38_(user, selected),
    dashboard: getDashboardForBranchV38_(user, selected)
  };
}

function setEntityActiveV38(sessionToken, entityType, entityId, active) {
  const result = setEntityActive(sessionToken, entityType, entityId, active);
  SpreadsheetApp.flush();
  return Object.assign({active: active === true}, result || {});
}

function normalizeReportV38_(result, type) {
  result = result || {};
  if (!result.type) result.type = type;
  if (!result.title) result.title = type.replace(/_/g,' ');
  if (!result.totals) result.totals = {};
  if (!Array.isArray(result.rows)) result.rows = [];
  return result;
}

function getAdvancedReportV38(sessionToken, options) {
  options = options || {};
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'REPORTS');
  options.branchId = resolveAccessibleBranchId_(user, options.branchId, true);
  try {
    return normalizeReportV38_(getAdvancedReport(sessionToken, options), String(options.type || 'SALES_SUMMARY').toUpperCase());
  } catch (error) {
    console.error('Advanced report v3.8 failed:', error && error.stack ? error.stack : error);
    throw new Error('Report failed: ' + (error && error.message ? error.message : String(error)));
  }
}

function getSalesListV38(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'SALES_LIST');
  filters = filters || {};
  filters.branchId = resolveAccessibleBranchId_(user, filters.branchId, true);
  return getSalesList(sessionToken, filters);
}

function getBackupManagerDataV38(sessionToken) {
  const data = getBackupManagerData(sessionToken);
  data.health = {drive:true,triggers:true};
  return data;
}

function ensureBranchFifoCoverageV38_(branchId, productId) {
  const stock = getBranchStockQty_(branchId, productId);
  const summary = getFifoStockSummary_(productId, branchId);
  const missing = Math.round((stock - number_(summary.totalQty)) * 1000) / 1000;
  if (missing > 0.0005) {
    const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
    createStockLotLocked_({productId:productId,branchId:branchId,receivedAt:new Date(),unitCostUSD:getBranchAverageCost_(branchId,productId) || number_(product && product.CostUSD),quantity:missing,referenceType:'BRANCH_OPENING',referenceId:branchId,note:'Automatic branch FIFO reconciliation'});
  }
}

function repairBranchDataV38(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user,[POS.ROLES.ADMIN]);
  return withScriptLock_(function(){
    ensureDefaultBranch_();
    syncMainBranchInventory_();
    getRows_(POS.SHEETS.BRANCH_INVENTORY).forEach(function(row){ ensureBranchFifoCoverageV38_(String(row.BranchID),String(row.ProductID)); });
    SpreadsheetApp.flush();
    return {success:true};
  });
}


/* ==========================================================================
 * SOURCE: ProductionStabilityV39.gs
 * ========================================================================== */
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


/* ==========================================================================
 * SOURCE: Products.gs
 * ========================================================================== */
function listActiveCategories_() {
  return getRows_(POS.SHEETS.CATEGORIES)
    .filter(function(row) { return bool_(row.Active); })
    .sort(function(a, b) { return number_(a.SortOrder) - number_(b.SortOrder); })
    .map(function(row) {
      return {
        categoryId: String(row.CategoryID),
        nameEN: String(row.NameEN || ''),
        nameKH: String(row.NameKH || '')
      };
    });
}

function listCategories(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK]);
  return getRows_(POS.SHEETS.CATEGORIES)
    .sort(function(a, b) { return number_(a.SortOrder) - number_(b.SortOrder); })
    .map(function(row) {
      return {
        categoryId: String(row.CategoryID),
        nameEN: String(row.NameEN || ''),
        nameKH: String(row.NameKH || ''),
        sortOrder: number_(row.SortOrder),
        active: bool_(row.Active)
      };
    });
}

function getUnitMap_() {
  const map = {};
  getRows_(POS.SHEETS.UNITS).forEach(function(row) {
    map[String(row.UnitID)] = unitToPublic_(row);
  });
  return map;
}

function listActiveProducts_() {
  const units = getUnitMap_();
  return getRows_(POS.SHEETS.PRODUCTS)
    .filter(function(row) { return bool_(row.Active); })
    .map(function(row){ return productToPublic_(row, units); });
}

function listProductsForBootstrap_(user) {
  const includeInactive = [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK].indexOf(String(user.Role)) >= 0;
  const units = getUnitMap_();
  const branchId = getUserBranchId_(user);
  return getRows_(POS.SHEETS.PRODUCTS)
    .filter(function(row) { return includeInactive || bool_(row.Active); })
    .map(function(row){
      const item = productToPublic_(row, units);
      item.currentStock = getBranchStockQty_(branchId, row.ProductID);
      item.branchId = branchId;
      return item;
    });
}

function productToPublic_(row, unitMap) {
  unitMap = unitMap || getUnitMap_();
  const unit = unitMap[String(row.UnitID || '')] || {};
  return {
    productId: String(row.ProductID),
    barcode: String(row.Barcode || ''),
    sku: String(row.SKU || ''),
    nameEN: String(row.NameEN || ''),
    nameKH: String(row.NameKH || ''),
    categoryId: String(row.CategoryID || ''),
    unitId: String(row.UnitID || ''),
    unitNameEN: String(unit.nameEN || ''),
    unitNameKH: String(unit.nameKH || ''),
    unitAbbreviation: String(unit.abbreviation || ''),
    allowDecimal: unit.allowDecimal === true,
    costUSD: number_(row.CostUSD),
    priceUSD: number_(row.PriceUSD),
    priceKHR: number_(row.PriceKHR),
    currentStock: number_(row.CurrentStock),
    lowStockLevel: number_(row.LowStockLevel),
    imageUrl: String(row.ImageURL || ''),
    active: bool_(row.Active),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : '',
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : ''
  };
}

function saveCategory(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  payload = payload || {};
  const existing = payload.categoryId ? findRowBy_(POS.SHEETS.CATEGORIES, 'CategoryID', payload.categoryId) : null;
  const now = new Date();
  const changes = {
    NameEN: sanitizeText_(payload.nameEN, 80),
    NameKH: sanitizeText_(payload.nameKH, 80),
    SortOrder: number_(payload.sortOrder, 999),
    Active: payload.active !== false,
    UpdatedAt: now
  };
  if (!changes.NameEN && !changes.NameKH) throw new Error('Category name is required.');

  let categoryId;
  if (existing) {
    categoryId = existing.CategoryID;
    updateRowObject_(POS.SHEETS.CATEGORIES, existing._row, changes);
  } else {
    categoryId = uuid_('CAT');
    changes.CategoryID = categoryId;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.CATEGORIES, changes);
  }
  audit_(user.UserID, existing ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY', 'Category', categoryId, changes);
  return {success: true, categoryId: categoryId};
}

function saveProduct(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');
  payload = payload || {};
  const nameEN = sanitizeText_(payload.nameEN, 120);
  const nameKH = sanitizeText_(payload.nameKH, 120);
  if (!nameEN && !nameKH) throw new Error('Product name is required.');
  const barcode = sanitizeText_(payload.barcode, 80);
  if (barcode) {
    const duplicate = getRows_(POS.SHEETS.PRODUCTS).find(function(row) {
      return String(row.Barcode) === barcode && String(row.ProductID) !== String(payload.productId || '');
    });
    if (duplicate) throw new Error('This barcode is already used by another product.');
  }
  const categoryId = sanitizeText_(payload.categoryId,80);
  if (categoryId && !findRowBy_(POS.SHEETS.CATEGORIES,'CategoryID',categoryId)) throw new Error('Selected category was not found.');
  const unitId = sanitizeText_(payload.unitId,80);
  if (unitId && !findRowBy_(POS.SHEETS.UNITS,'UnitID',unitId)) throw new Error('Selected unit was not found.');
  const existing = payload.productId ? findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', payload.productId) : null;
  const now = new Date();
  let image = {url: existing ? String(existing.ImageURL || '') : '', fileId: existing ? String(existing.ImageFileID || '') : ''};
  if (payload.imageDataUrl) image = saveProductImage_(payload.imageDataUrl, payload.productId || uuid_('TMP'));
  const changes = {
    Barcode: barcode, SKU: sanitizeText_(payload.sku, 80), NameEN: nameEN, NameKH: nameKH,
    CategoryID: categoryId, UnitID: unitId, CostUSD: roundMoney_(number_(payload.costUSD)),
    PriceUSD: roundMoney_(number_(payload.priceUSD)), PriceKHR: Math.round(number_(payload.priceKHR)),
    LowStockLevel: number_(payload.lowStockLevel), ImageURL: image.url, ImageFileID: image.fileId,
    Active: payload.active !== false, UpdatedAt: now
  };
  if (changes.PriceUSD < 0 || changes.CostUSD < 0) throw new Error('Price and cost cannot be negative.');
  const branchId = getUserBranchId_(user);
  let productId;
  withScriptLock_(function(){
    if (existing) {
      productId = existing.ProductID;
      updateRowObject_(POS.SHEETS.PRODUCTS, existing._row, changes);
    } else {
      productId = uuid_('PRD');
      const openingStock = Math.max(0, number_(payload.openingStock));
      changes.ProductID = productId; changes.CurrentStock = branchId === BRANCH_FEATURE.DEFAULT_BRANCH_ID ? openingStock : 0; changes.CreatedAt = now;
      appendObject_(POS.SHEETS.PRODUCTS, changes);
      setBranchStockLocked_(branchId, productId, openingStock, changes.CostUSD);
      if (openingStock > 0) {
        appendObject_(POS.SHEETS.STOCK, {MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:productId,Type:'OPENING',QtyIn:openingStock,QtyOut:0,BalanceAfter:openingStock,ReferenceType:'PRODUCT',ReferenceID:productId,UserID:user.UserID,Note:'Opening stock',UnitCostUSD:changes.CostUSD,CostInUSD:roundMoney_(openingStock*changes.CostUSD),CostOutUSD:0});
        createOpeningStockLotLocked_(productId, openingStock, changes.CostUSD, user.UserID, 'Opening stock', branchId);
      }
    }
  });
  audit_(user.UserID, existing ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', 'Product', productId, changes);
  return {success:true,productId:productId,imageUrl:image.url};
}

function saveProductImage_(dataUrl, productId) {
  return uploadProductImageToCloudinary_(dataUrl, productId);
}

function adjustStock(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'INVENTORY');
  payload = payload || {};
  const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', payload.productId);
  if (!product) throw new Error('Product not found.');
  const unit = product.UnitID ? findRowBy_(POS.SHEETS.UNITS,'UnitID',product.UnitID) : null;
  const rawQty = number_(payload.quantity);
  const quantity = unit && !bool_(unit.AllowDecimal) ? Math.round(rawQty) : Math.round(rawQty * 1000) / 1000;
  if (!quantity) throw new Error('Adjustment quantity cannot be zero.');
  const branchId = sanitizeText_(payload.branchId,80) || getUserBranchId_(user);
  return withScriptLock_(function() {
    const currentStock = getBranchStockQty_(branchId, product.ProductID);
    const newStock = Math.round((currentStock + quantity) * 1000) / 1000;
    if (newStock < -0.0005) throw new Error('Stock cannot become negative.');
    const now = new Date(), adjustmentId = uuid_('ADJ');
    const rawCost = payload.unitCostUSD == null ? '' : String(payload.unitCostUSD).trim();
    let unitCost = rawCost === '' ? getBranchAverageCost_(branchId, product.ProductID) : number_(rawCost), costIn=0, costOut=0;
    if (quantity > 0) {
      if (unitCost < 0) throw new Error('Adjustment cost cannot be negative.');
      unitCost=roundMoney_(unitCost); costIn=roundMoney_(quantity*unitCost);
      createStockLotLocked_({branchId:branchId,productId:product.ProductID,receivedAt:now,unitCostUSD:unitCost,quantity:quantity,referenceType:'ADJUSTMENT_IN',referenceId:adjustmentId,note:sanitizeText_(payload.note,250)});
    } else {
      const plan=planFifoAllocationsLocked_([{productId:product.ProductID,qty:Math.abs(quantity)}],branchId);
      costOut=plan.itemPlans[0].totalCostUSD; unitCost=plan.itemPlans[0].averageUnitCostUSD;
      applyFifoPlanLocked_(plan,[{branchId:branchId,referenceType:'ADJUSTMENT_OUT',referenceId:adjustmentId,userId:user.UserID,note:sanitizeText_(payload.note,250)}]);
    }
    const avg = quantity > 0 ? getFifoStockSummary_(product.ProductID,branchId).averageCostUSD : getBranchAverageCost_(branchId,product.ProductID);
    setBranchStockLocked_(branchId,product.ProductID,Math.max(0,newStock),avg || unitCost);
    appendObject_(POS.SHEETS.STOCK,{MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:product.ProductID,Type:quantity>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',QtyIn:quantity>0?quantity:0,QtyOut:quantity<0?Math.abs(quantity):0,BalanceAfter:Math.max(0,newStock),ReferenceType:'ADJUSTMENT',ReferenceID:adjustmentId,UserID:user.UserID,Note:sanitizeText_(payload.note,250),UnitCostUSD:unitCost,CostInUSD:costIn,CostOutUSD:costOut});
    audit_(user.UserID,'STOCK_ADJUSTMENT','Product',product.ProductID,{branchId:branchId,quantity:quantity,balanceAfter:newStock});
    return {success:true,currentStock:Math.max(0,newStock),branchId:branchId};
  });
}


function deleteProduct(sessionToken, productId) {
  const user=requireSession_(sessionToken);requireRole_(user,[POS.ROLES.ADMIN]);
  const product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',productId);if(!product)throw new Error('Product not found.');
  const stock=getRows_(POS.SHEETS.BRANCH_INVENTORY).reduce(function(sum,row){return sum+(String(row.ProductID)===String(productId)?number_(row.Qty):0);},0);
  const hasHistory=[[POS.SHEETS.SALE_ITEMS,'ProductID'],[POS.SHEETS.PURCHASE_ITEMS,'ProductID'],[POS.SHEETS.STOCK,'ProductID'],[POS.SHEETS.RETURN_ITEMS,'ProductID']].some(function(pair){return getRows_(pair[0]).some(function(row){return String(row[pair[1]]||'')===String(productId);});});
  if(stock>0.0001||hasHistory){updateRowObject_(POS.SHEETS.PRODUCTS,product._row,{Active:false,UpdatedAt:new Date()});audit_(user.UserID,'DEACTIVATE_PRODUCT_WITH_HISTORY','Product',productId,{stock:stock});return {success:true,deactivated:true};}
  getSheet_(POS.SHEETS.PRODUCTS).deleteRow(product._row);audit_(user.UserID,'DELETE_PRODUCT','Product',productId,{name:product.NameEN||product.NameKH});return {success:true,deleted:true};
}


/* ==========================================================================
 * SOURCE: PurchaseFifoSetup.gs
 * ========================================================================== */
/**
 * Supplier + Purchase Receiving + FIFO Inventory installer.
 * Safe upgrade: adds missing sheets/columns and never clears existing rows.
 */
var PURCHASE_FIFO = Object.freeze({
  SHEETS: Object.freeze({
    STOCK_LOTS: 'StockLots',
    FIFO_ALLOCATIONS: 'FifoAllocations',
    PURCHASE_RECEIPTS: 'PurchaseReceipts',
    SUPPLIER_PAYMENTS: 'SupplierPayments'
  }),
  HEADERS: Object.freeze({
    Suppliers: [
      'SupplierID', 'Name', 'ContactPerson', 'Phone', 'Email', 'Address',
      'TaxNumber', 'Notes', 'Active', 'CreatedAt', 'UpdatedAt'
    ],
    Purchases: [
      'PurchaseID', 'PurchaseNo', 'SupplierID', 'SupplierName',
      'SupplierInvoiceNo', 'PurchaseDate', 'ExpectedDate', 'SubtotalUSD',
      'DiscountType', 'DiscountValue', 'DiscountUSD', 'TaxUSD',
      'ShippingUSD', 'OtherCostUSD', 'TotalUSD', 'PaidUSD',
      'PaymentStatus', 'Status', 'Notes', 'UserID', 'CreatedAt', 'UpdatedAt'
    ],
    PurchaseItems: [
      'PurchaseItemID', 'PurchaseID', 'ProductID', 'ProductName',
      'OrderedQty', 'ReceivedQty', 'UnitCostUSD', 'LineDiscountUSD',
      'LineTotalUSD', 'LandedUnitCostUSD', 'CreatedAt', 'UpdatedAt'
    ],
    PurchaseReceipts: [
      'ReceiptID', 'ReceiptNo', 'PurchaseID', 'SupplierID', 'ReceivedAt',
      'TotalQty', 'TotalCostUSD', 'UserID', 'Notes', 'CreatedAt'
    ],
    SupplierPayments: [
      'SupplierPaymentID', 'PurchaseID', 'SupplierID', 'DateTime',
      'Method', 'AmountUSD', 'Reference', 'UserID', 'Notes', 'CreatedAt'
    ],
    StockLots: [
      'LotID', 'ProductID', 'PurchaseID', 'ReceiptID', 'ReceivedAt',
      'UnitCostUSD', 'QtyReceived', 'QtyRemaining', 'Status',
      'ReferenceType', 'ReferenceID', 'Note', 'CreatedAt', 'UpdatedAt'
    ],
    FifoAllocations: [
      'AllocationID', 'DateTime', 'ProductID', 'LotID', 'Qty',
      'UnitCostUSD', 'CostUSD', 'ReferenceType', 'ReferenceID',
      'UserID', 'Note'
    ],
    StockMovements: [
      'UnitCostUSD', 'CostInUSD', 'CostOutUSD'
    ],
    SaleItems: [
      'AllocatedSaleDiscountUSD', 'NetRevenueUSD', 'CostTotalUSD',
      'GrossProfitUSD'
    ]
  })
});

function installPurchaseFifoFeature() {
  const ss = getSpreadsheet_();
  const report = [];

  withScriptLock_(function() {
    ensurePurchaseFeatureColumns_(ss, 'Suppliers', PURCHASE_FIFO.HEADERS.Suppliers, true, report);
    ensurePurchaseFeatureColumns_(ss, 'Purchases', PURCHASE_FIFO.HEADERS.Purchases, true, report);
    ensurePurchaseFeatureColumns_(ss, 'PurchaseItems', PURCHASE_FIFO.HEADERS.PurchaseItems, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.PURCHASE_RECEIPTS, PURCHASE_FIFO.HEADERS.PurchaseReceipts, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.SUPPLIER_PAYMENTS, PURCHASE_FIFO.HEADERS.SupplierPayments, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.STOCK_LOTS, PURCHASE_FIFO.HEADERS.StockLots, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.FIFO_ALLOCATIONS, PURCHASE_FIFO.HEADERS.FifoAllocations, true, report);
    ensurePurchaseFeatureColumns_(ss, POS.SHEETS.STOCK, PURCHASE_FIFO.HEADERS.StockMovements, false, report);
    ensurePurchaseFeatureColumns_(ss, POS.SHEETS.SALE_ITEMS, PURCHASE_FIFO.HEADERS.SaleItems, false, report);

    const migration = migrateExistingStockToFifoLotsLocked_();
    report.push('FIFO opening lots created: ' + migration.created);
    if (migration.warnings.length) {
      report.push('Warnings: ' + migration.warnings.join(' | '));
    }
  });

  const message = 'Supplier, purchasing and FIFO feature installed.\n\n' + report.join('\n');
  console.log(message);
  try {
    ss.toast('Supplier + Purchase + FIFO installed.', 'POS Upgrade', 8);
  } catch (error) {
    console.log(error.message);
  }
  return message;
}

function ensurePurchaseFeatureColumns_(ss, sheetName, requiredHeaders, createIfMissing, report) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    if (!createIfMissing) throw new Error('Missing required sheet: ' + sheetName);
    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function(value) {
        return String(value || '').trim();
      })
    : [];

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    const startColumn = lastColumn + 1;
    const finalColumn = startColumn + missing.length - 1;
    if (finalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), finalColumn - sheet.getMaxColumns());
    }
    sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
    report.push(sheetName + ': added ' + missing.join(', '));
  } else {
    report.push(sheetName + ': already up to date');
  }

  const currentLastColumn = sheet.getLastColumn();
  if (currentLastColumn > 0) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, currentLastColumn)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

/**
 * Creates opening FIFO lots for existing stock. It only fills positive gaps.
 * Existing lots are never deleted or overwritten.
 */
function migrateExistingStockToFifoLotsLocked_() {
  const products = getRows_(POS.SHEETS.PRODUCTS);
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS);
  const remainingByProduct = {};

  lots.forEach(function(lot) {
    const productId = String(lot.ProductID || '');
    remainingByProduct[productId] = number_(remainingByProduct[productId]) + number_(lot.QtyRemaining);
  });

  let created = 0;
  const warnings = [];
  const now = new Date();

  products.forEach(function(product) {
    const productId = String(product.ProductID);
    const currentStock = number_(product.CurrentStock);
    const lotStock = number_(remainingByProduct[productId]);
    const difference = Math.round((currentStock - lotStock) * 1000) / 1000;

    if (difference > 0.0005) {
      createStockLotLocked_({
        productId: productId,
        purchaseId: '',
        receiptId: '',
        receivedAt: product.CreatedAt || now,
        unitCostUSD: number_(product.CostUSD),
        quantity: difference,
        referenceType: 'FIFO_MIGRATION',
        referenceId: productId,
        note: 'Opening FIFO lot created from existing CurrentStock'
      });
      created++;
    } else if (difference < -0.0005) {
      warnings.push(productId + ' lots exceed CurrentStock by ' + Math.abs(difference));
    }
  });

  return {created: created, warnings: warnings};
}

function checkFifoInventory() {
  const products = getRows_(POS.SHEETS.PRODUCTS);
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS);
  const remainingByProduct = {};
  const issues = [];

  lots.forEach(function(lot) {
    const productId = String(lot.ProductID || '');
    remainingByProduct[productId] = number_(remainingByProduct[productId]) + number_(lot.QtyRemaining);
  });

  products.forEach(function(product) {
    const current = Math.round(number_(product.CurrentStock) * 1000) / 1000;
    const fifo = Math.round(number_(remainingByProduct[String(product.ProductID)]) * 1000) / 1000;
    if (Math.abs(current - fifo) > 0.0005) {
      issues.push((product.NameEN || product.NameKH || product.ProductID) + ': CurrentStock ' + current + ', FIFO ' + fifo);
    }
  });

  const message = issues.length
    ? 'FIFO mismatches:\n' + issues.slice(0, 30).join('\n')
    : 'FIFO inventory is balanced with Products.CurrentStock.';
  console.log(message);
  try {
    getSpreadsheet_().toast(message, 'FIFO Check', 10);
  } catch (error) {
    console.log(error.message);
  }
  return message;
}


/* ==========================================================================
 * SOURCE: PurchaseReturns.gs
 * ========================================================================== */
/** Tiny POS v3.6 purchase returns to suppliers. */
function requireSupplierReturnView_(user) {
  requirePermission_(user, 'SUPPLIER_RETURNS');
}
function requireSupplierReturnWrite_(user) {
  requireSupplierReturnView_(user);
  requireRole_(user,[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.STOCK]);
}

function nextSupplierReturnNoLocked_() {
  const key=dateKey_(new Date()),props=PropertiesService.getScriptProperties(),property='SUPPLIER_RETURN_COUNTER_'+key;
  const next=number_(props.getProperty(property),0)+1;props.setProperty(property,String(next));
  return 'SRN-'+key+'-'+String(next).padStart(4,'0');
}

function supplierReturnToPublic_(row) {
  const items=getRows_(POS.SHEETS.SUPPLIER_RETURN_ITEMS).filter(function(item){return String(item.SupplierReturnID)===String(row.SupplierReturnID);});
  return {
    supplierReturnId:String(row.SupplierReturnID), returnNo:String(row.ReturnNo),
    purchaseId:String(row.PurchaseID), purchaseNo:String(row.PurchaseNo),
    supplierId:String(row.SupplierID), supplierName:String(row.SupplierName), branchId:String(row.BranchID||''),
    dateTime:row.DateTime?new Date(row.DateTime).toISOString():'', reason:String(row.Reason||''),
    settlementType:String(row.SettlementType||''), refundMethod:String(row.RefundMethod||''),
    amountUSD:number_(row.AmountUSD), reference:String(row.Reference||''), notes:String(row.Notes||''),
    status:String(row.Status||''), userName:String(row.UserName||''), imageUrl:String(row.DamageImageURL||''),
    totalQty:items.reduce(function(sum,item){return sum+number_(item.QtyReturned);},0),
    items:items.map(function(item){return {productId:String(item.ProductID),productName:String(item.ProductName),qtyReturned:number_(item.QtyReturned),unitCostUSD:number_(item.UnitCostUSD),amountUSD:number_(item.AmountUSD)};})
  };
}

function getSupplierReturnModuleData(sessionToken, filters) {
  const user=requireSession_(sessionToken);requireSupplierReturnView_(user);filters=filters||{};
  const query=sanitizeText_(filters.query,160).toLowerCase();const range=reportRange_(filters.from,filters.to);
  const rows=getRows_(POS.SHEETS.SUPPLIER_RETURNS).filter(function(row){
    const d=reportDate_(row.DateTime||row.CreatedAt);if(!d||d<range.from||d>range.to)return false;
    if(filters.supplierId&&String(row.SupplierID)!==String(filters.supplierId))return false;
    const hay=[row.ReturnNo,row.PurchaseNo,row.SupplierName,row.Reason,row.Reference,row.Status].join(' ').toLowerCase();
    return !query||hay.indexOf(query)>=0;
  }).sort(function(a,b){return new Date(b.DateTime||b.CreatedAt)-new Date(a.DateTime||a.CreatedAt);}).map(supplierReturnToPublic_);
  const purchases=getRows_(POS.SHEETS.PURCHASES).filter(function(p){return ['PARTIALLY_RECEIVED','RECEIVED'].indexOf(String(p.Status))>=0;}).sort(function(a,b){return new Date(b.PurchaseDate||b.CreatedAt)-new Date(a.PurchaseDate||a.CreatedAt);}).slice(0,300).map(function(p){return {purchaseId:String(p.PurchaseID),purchaseNo:String(p.PurchaseNo),supplierId:String(p.SupplierID),supplierName:String(p.SupplierName),purchaseDate:p.PurchaseDate?new Date(p.PurchaseDate).toISOString():'',branchId:String(p.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID),totalUSD:number_(p.TotalUSD),status:String(p.Status)};});
  return {returns:rows,purchases:purchases,suppliers:getRows_(POS.SHEETS.SUPPLIERS).map(function(s){return {supplierId:String(s.SupplierID),name:String(s.Name),active:bool_(s.Active)};}),metrics:{returns:rows.length,quantity:rows.reduce(function(s,r){return s+r.totalQty;},0),amountUSD:roundMoney_(rows.reduce(function(s,r){return s+r.amountUSD;},0))}};
}

function getPurchaseReturnableDetail(sessionToken, purchaseId) {
  const user=requireSession_(sessionToken);requireSupplierReturnWrite_(user);
  const purchase=findRowBy_(POS.SHEETS.PURCHASES,'PurchaseID',purchaseId);if(!purchase)throw new Error('Purchase not found.');
  if(['PARTIALLY_RECEIVED','RECEIVED'].indexOf(String(purchase.Status))<0)throw new Error('Only a received purchase can be returned.');
  const existingReturns=getRows_(POS.SHEETS.SUPPLIER_RETURN_ITEMS).filter(function(row){return getRows_(POS.SHEETS.SUPPLIER_RETURNS).some(function(header){return String(header.SupplierReturnID)===String(row.SupplierReturnID)&&String(header.PurchaseID)===String(purchaseId)&&String(header.Status)!=='CANCELLED';});});
  const returnedByItem={};existingReturns.forEach(function(row){returnedByItem[String(row.PurchaseItemID)]=number_(returnedByItem[String(row.PurchaseItemID)])+number_(row.QtyReturned);});
  const branchId=String(purchase.BranchID||getUserBranchId_(user));
  const lots=getRows_(POS.SHEETS.STOCK_LOTS).filter(function(lot){return String(lot.PurchaseID)===String(purchaseId)&&String(lot.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===branchId&&number_(lot.QtyRemaining)>0.0005;});
  const openByProduct={};lots.forEach(function(lot){openByProduct[String(lot.ProductID)]=number_(openByProduct[String(lot.ProductID)])+number_(lot.QtyRemaining);});
  const items=getRows_(POS.SHEETS.PURCHASE_ITEMS).filter(function(item){return String(item.PurchaseID)===String(purchaseId);}).map(function(item){
    const received=number_(item.ReceivedQty),already=number_(returnedByItem[String(item.PurchaseItemID)]),remainingReceived=Math.max(0,received-already),openQty=number_(openByProduct[String(item.ProductID)]),returnable=Math.max(0,Math.min(remainingReceived,openQty));
    return {purchaseItemId:String(item.PurchaseItemID),productId:String(item.ProductID),productName:String(item.ProductName),receivedQty:received,alreadyReturnedQty:already,returnableQty:returnable,unitCostUSD:number_(item.LandedUnitCostUSD||item.UnitCostUSD)};
  }).filter(function(item){return item.returnableQty>0.0005;});
  return {purchaseId:String(purchase.PurchaseID),purchaseNo:String(purchase.PurchaseNo),supplierId:String(purchase.SupplierID),supplierName:String(purchase.SupplierName),branchId:branchId,totalUSD:number_(purchase.TotalUSD),balanceUSD:Math.max(0,number_(purchase.TotalUSD)-number_(purchase.PaidUSD)-number_(purchase.SupplierCreditUSD)),items:items};
}

function processSupplierReturn(sessionToken, payload) {
  const user=requireSession_(sessionToken);requireSupplierReturnWrite_(user);payload=payload||{};
  return withScriptLock_(function(){
    const purchase=findRowBy_(POS.SHEETS.PURCHASES,'PurchaseID',payload.purchaseId);if(!purchase)throw new Error('Purchase not found.');
    const detail=getPurchaseReturnableDetail(sessionToken,purchase.PurchaseID);const detailMap={};detail.items.forEach(function(item){detailMap[item.purchaseItemId]=item;});
    const selected=(Array.isArray(payload.items)?payload.items:[]).map(function(raw){const item=detailMap[String(raw.purchaseItemId)];if(!item)throw new Error('A selected item is no longer returnable.');const qty=Math.round(number_(raw.qty)*1000)/1000;if(qty<=0||qty>item.returnableQty+0.0005)throw new Error(item.productName+': invalid return quantity. Maximum '+item.returnableQty+'.');return {item:item,qty:qty};});
    if(!selected.length)throw new Error('Enter at least one return quantity.');
    const reason=sanitizeText_(payload.reason,80);if(!reason)throw new Error('Return reason is required.');
    const settlementType=['CREDIT_NOTE','REDUCE_BALANCE','CASH_REFUND','BANK_REFUND'].indexOf(String(payload.settlementType||'').toUpperCase())>=0?String(payload.settlementType).toUpperCase():'CREDIT_NOTE';
    const now=new Date(),returnId=uuid_('SRN'),returnNo=nextSupplierReturnNoLocked_(),branchId=detail.branchId;
    const evidence=payload.damageImageDataUrl?uploadReturnImageToCloudinary_(payload.damageImageDataUrl,'supplier-return-'+returnNo):{url:'',fileId:''};
    const lots=getRows_(POS.SHEETS.STOCK_LOTS).filter(function(lot){return String(lot.PurchaseID)===String(purchase.PurchaseID)&&String(lot.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===branchId&&number_(lot.QtyRemaining)>0.0005;}).sort(function(a,b){return new Date(b.ReceivedAt)-new Date(a.ReceivedAt)||b._row-a._row;});
    const itemRows=[],movements=[];let totalAmount=0,totalQty=0;
    selected.forEach(function(selection){
      let remaining=selection.qty,itemCost=0;const product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',selection.item.productId);if(!product)throw new Error(selection.item.productName+' no longer exists.');
      lots.filter(function(lot){return String(lot.ProductID)===String(selection.item.productId);}).forEach(function(lot){if(remaining<=0.0005)return;const take=Math.round(Math.min(remaining,number_(lot.QtyRemaining))*1000)/1000;if(take<=0)return;const next=Math.round((number_(lot.QtyRemaining)-take)*1000)/1000;updateRowObject_(POS.SHEETS.STOCK_LOTS,lot._row,{QtyRemaining:next,Status:next<=0.0005?'CLOSED':'PARTIAL',UpdatedAt:now});const cost=roundMoney_(take*number_(lot.UnitCostUSD));itemCost=roundMoney_(itemCost+cost);appendObject_(POS.SHEETS.FIFO_ALLOCATIONS,{AllocationID:uuid_('FIF'),DateTime:now,ProductID:selection.item.productId,LotID:lot.LotID,Qty:take,UnitCostUSD:number_(lot.UnitCostUSD),CostUSD:cost,ReferenceType:'SUPPLIER_RETURN',ReferenceID:returnId,UserID:user.UserID,Note:returnNo,BranchID:branchId});remaining=Math.round((remaining-take)*1000)/1000;});
      if(remaining>0.0005)throw new Error(selection.item.productName+': not enough stock remains from this purchase lot.');
      const balance=adjustBranchStockLocked_(branchId,selection.item.productId,-selection.qty,selection.qty?itemCost/selection.qty:0);totalAmount=roundMoney_(totalAmount+itemCost);totalQty+=selection.qty;
      itemRows.push({SupplierReturnItemID:uuid_('SRI'),SupplierReturnID:returnId,PurchaseItemID:selection.item.purchaseItemId,ProductID:selection.item.productId,ProductName:selection.item.productName,QtyReturned:selection.qty,UnitCostUSD:selection.qty?Math.round(itemCost/selection.qty*10000)/10000:0,AmountUSD:itemCost,CreatedAt:now});
      movements.push({MovementID:uuid_('STK'),DateTime:now,ProductID:selection.item.productId,Type:'SUPPLIER_RETURN',QtyIn:0,QtyOut:selection.qty,BalanceAfter:balance,ReferenceType:'SUPPLIER_RETURN',ReferenceID:returnId,UserID:user.UserID,Note:returnNo,UnitCostUSD:selection.qty?itemCost/selection.qty:0,CostInUSD:0,CostOutUSD:itemCost,BranchID:branchId,FromBranchID:branchId,ToBranchID:''});
    });
    appendObject_(POS.SHEETS.SUPPLIER_RETURNS,{SupplierReturnID:returnId,ReturnNo:returnNo,PurchaseID:purchase.PurchaseID,PurchaseNo:purchase.PurchaseNo,SupplierID:purchase.SupplierID,SupplierName:purchase.SupplierName,BranchID:branchId,DateTime:now,Reason:reason,SettlementType:settlementType,RefundMethod:settlementType==='BANK_REFUND'?'BANK':settlementType==='CASH_REFUND'?'CASH':'CREDIT',AmountUSD:totalAmount,Reference:sanitizeText_(payload.reference,120),Notes:sanitizeText_(payload.notes,500),DamageImageURL:evidence.url||'',DamageImagePublicID:evidence.fileId||'',Status:'COMPLETED',UserID:user.UserID,UserName:user.Name,ApprovedByID:user.UserID,CreatedAt:now,UpdatedAt:now});
    appendObjects_(POS.SHEETS.SUPPLIER_RETURN_ITEMS,itemRows);appendObjects_(POS.SHEETS.STOCK,movements);
    if(['CREDIT_NOTE','REDUCE_BALANCE'].indexOf(settlementType)>=0){const credit=roundMoney_(number_(purchase.SupplierCreditUSD)+totalAmount);const payable=Math.max(0,number_(purchase.TotalUSD)-credit),paid=number_(purchase.PaidUSD),status=paid<=0?'UNPAID':paid+0.005>=payable?'PAID':'PARTIALLY_PAID';updateRowObject_(POS.SHEETS.PURCHASES,purchase._row,{SupplierCreditUSD:credit,PaymentStatus:status,UpdatedAt:now});}
    audit_(user.UserID,'PROCESS_SUPPLIER_RETURN','SupplierReturn',returnId,{returnNo:returnNo,purchaseNo:purchase.PurchaseNo,totalQty:totalQty,amountUSD:totalAmount,settlementType:settlementType});
    return supplierReturnToPublic_(findRowBy_(POS.SHEETS.SUPPLIER_RETURNS,'SupplierReturnID',returnId));
  });
}


/* ==========================================================================
 * SOURCE: Reports.gs
 * ========================================================================== */
/**
 * Tiny POS V3 reports.
 * Sales/profit are accrual-based. Customer debt collection is cash movement,
 * not new revenue. FIFO lots are reported separately for stock aging.
 */
let REPORT_SCOPE_V37_ = null;

function reportRows_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  let rows = sheet ? getRows_(sheetName) : [];
  const scope = REPORT_SCOPE_V37_;
  if (!scope || (!scope.branchId && !scope.cashierId)) return rows;

  const salesRaw = sheetName === POS.SHEETS.SALES ? rows : getRows_(POS.SHEETS.SALES);
  const scopedSaleIds = {};
  salesRaw.forEach(function(sale) {
    const branchOk = !scope.branchId || String(sale.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
    const cashierOk = !scope.cashierId || String(sale.CashierID || '') === scope.cashierId;
    if (branchOk && cashierOk) scopedSaleIds[String(sale.SaleID)] = true;
  });

  if (sheetName === POS.SHEETS.SALES) return rows.filter(function(r){return scopedSaleIds[String(r.SaleID)];});
  if ([POS.SHEETS.SALE_ITEMS, POS.SHEETS.PAYMENTS, POS.SHEETS.RECEIVABLES].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return scopedSaleIds[String(r.SaleID)];});
  }
  if (sheetName === POS.SHEETS.RETURNS) {
    return rows.filter(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      return branchOk && scopedSaleIds[String(r.SaleID)];
    });
  }
  if ([POS.SHEETS.RETURN_ITEMS, POS.SHEETS.REFUND_PAYMENTS, POS.SHEETS.RETURN_LOT_RESTORATIONS].indexOf(sheetName) >= 0) {
    const returnIds = {};
    getRows_(POS.SHEETS.RETURNS).forEach(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      if (branchOk && scopedSaleIds[String(r.SaleID)]) returnIds[String(r.ReturnID)] = true;
    });
    return rows.filter(function(r){return returnIds[String(r.ReturnID)];});
  }
  if ([POS.SHEETS.PURCHASES, POS.SHEETS.PURCHASE_RECEIPTS, POS.SHEETS.SUPPLIER_RETURNS].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;});
  }
  if ([POS.SHEETS.STOCK_LOTS, POS.SHEETS.STOCK, POS.SHEETS.STOCK_COUNTS, POS.SHEETS.BRANCH_INVENTORY].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;});
  }
  if (sheetName === POS.SHEETS.EXPENSES) {
    return rows.filter(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      const userOk = !scope.cashierId || String(r.UserID || '') === scope.cashierId;
      return branchOk && userOk;
    });
  }
  return rows;
}

function reportDate_(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function reportRange_(fromValue, toValue) {
  const now = new Date();
  const from = fromValue
    ? new Date(String(fromValue) + 'T00:00:00')
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toValue
    ? new Date(String(toValue) + 'T23:59:59.999')
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) throw new Error('Invalid report date range.');
  if (from > to) throw new Error('From date cannot be after To date.');
  return {from:from,to:to};
}

function reportInRange_(value, range) {
  const date = reportDate_(value);
  return Boolean(date && date >= range.from && date <= range.to);
}

function reportSaleIncluded_(row) {
  const status = String(row.Status || '').toUpperCase();
  const payment = String(row.PaymentStatus || '').toUpperCase();
  return status !== POS.SALE_STATUS.VOID && payment !== POS.PAYMENT_STATUS.FAILED;
}

function reportPeriodKey_(dateValue, period) {
  const date = reportDate_(dateValue);
  if (!date) return null;
  period = String(period || 'DAILY').toUpperCase();
  if (period === 'MONTHLY') {
    return {
      key:Utilities.formatDate(date,POS.TIME_ZONE,'yyyy-MM'),
      label:Utilities.formatDate(date,POS.TIME_ZONE,'MMM yyyy')
    };
  }
  if (period === 'WEEKLY') {
    const day = date.getDay();
    const delta = day === 0 ? -6 : 1 - day;
    const monday = new Date(date.getFullYear(),date.getMonth(),date.getDate()+delta);
    const sunday = new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+6);
    return {
      key:Utilities.formatDate(monday,POS.TIME_ZONE,'yyyy-MM-dd'),
      label:Utilities.formatDate(monday,POS.TIME_ZONE,'dd MMM') + ' – ' +
        Utilities.formatDate(sunday,POS.TIME_ZONE,'dd MMM yyyy')
    };
  }
  return {
    key:Utilities.formatDate(date,POS.TIME_ZONE,'yyyy-MM-dd'),
    label:Utilities.formatDate(date,POS.TIME_ZONE,'dd MMM yyyy')
  };
}

function saleItemCost_(item) {
  const stored = String(item.CostTotalUSD == null ? '' : item.CostTotalUSD).trim();
  return stored === ''
    ? roundMoney_(number_(item.UnitCostUSD) * number_(item.Qty))
    : roundMoney_(number_(item.CostTotalUSD));
}

function returnItemNetRevenue_(item) {
  const allocated = String(item.GrossLineRefundUSD == null ? '' : item.GrossLineRefundUSD).trim() !== '' ||
    String(item.DiscountRefundUSD == null ? '' : item.DiscountRefundUSD).trim() !== '';
  return allocated
    ? Math.max(0, number_(item.GrossLineRefundUSD) - number_(item.DiscountRefundUSD))
    : Math.max(0, number_(item.RefundUSD) - number_(item.TaxRefundUSD));
}

function buildAccountingData_(range) {
  const allSales = reportRows_(POS.SHEETS.SALES).filter(reportSaleIncluded_);
  const allItems = reportRows_(POS.SHEETS.SALE_ITEMS);
  const allReturns = reportRows_(POS.SHEETS.RETURNS).filter(function(row) {
    return String(row.Status || 'COMPLETED').toUpperCase() !== 'CANCELLED';
  });
  const allReturnItems = reportRows_(POS.SHEETS.RETURN_ITEMS);
  const allRefundPayments = reportRows_(POS.SHEETS.REFUND_PAYMENTS).filter(function(row) {
    return String(row.Status || 'PAID').toUpperCase() !== 'CANCELLED';
  });
  const allExpenses = reportRows_(POS.SHEETS.EXPENSES);
  const allPurchases = reportRows_(POS.SHEETS.PURCHASES).filter(function(row) {
    return String(row.Status || '').toUpperCase() !== 'CANCELLED';
  });

  const sales = allSales.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const saleIds = {};
  sales.forEach(function(row){saleIds[String(row.SaleID)] = true;});
  const saleItems = allItems.filter(function(row){return saleIds[String(row.SaleID)];});
  const returns = allReturns.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const returnIds = {};
  returns.forEach(function(row){returnIds[String(row.ReturnID)] = true;});
  const returnItems = allReturnItems.filter(function(row){return returnIds[String(row.ReturnID)];});
  const refundPayments = allRefundPayments.filter(function(row){return returnIds[String(row.ReturnID)] || reportInRange_(row.CreatedAt||row.DateTime,range);});
  const expenses = allExpenses.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const purchases = allPurchases.filter(function(row){return reportInRange_(row.PurchaseDate || row.CreatedAt,range);});

  const itemsBySale = {};
  saleItems.forEach(function(item){
    const id=String(item.SaleID||'');
    if(!itemsBySale[id])itemsBySale[id]=[];
    itemsBySale[id].push(item);
  });
  const returnsBySale = {};
  returns.forEach(function(row){
    const id=String(row.SaleID||'');
    if(!returnsBySale[id])returnsBySale[id]=[];
    returnsBySale[id].push(row);
  });
  const returnItemsByReturn = {};
  returnItems.forEach(function(item){
    const id=String(item.ReturnID||'');
    if(!returnItemsByReturn[id])returnItemsByReturn[id]=[];
    returnItemsByReturn[id].push(item);
  });

  let grossSales=0,discounts=0,salesTax=0,salesReceipts=0,saleCost=0;
  let refundTotal=0,returnNetSales=0,returnTax=0,restoredCost=0;
  let cashSales=0,bankSales=0,creditSales=0,cashRefunds=0,bankRefunds=0;

  sales.forEach(function(sale){
    grossSales += number_(sale.SubtotalUSD);
    discounts += number_(sale.DiscountUSD);
    salesTax += number_(sale.TaxUSD);
    salesReceipts += number_(sale.TotalUSD);
    cashSales += String(sale.PaymentMethod||'').toUpperCase().indexOf('CASH') >= 0 ? number_(sale.AmountPaidUSD || (sale.PaymentMethod==='CASH'?sale.TotalUSD:0)) : 0;
    bankSales += String(sale.PaymentMethod||'').toUpperCase().indexOf('BANK') >= 0 ? number_(sale.AmountPaidUSD || (sale.PaymentMethod==='BANK'?sale.TotalUSD:0)) : 0;
    creditSales += number_(sale.CreditAmountUSD);
    (itemsBySale[String(sale.SaleID)]||[]).forEach(function(item){saleCost += saleItemCost_(item);});
  });

  returns.forEach(function(row){
    refundTotal += number_(row.AmountUSD);
    const items=returnItemsByReturn[String(row.ReturnID)]||[];
    if(items.length){
      items.forEach(function(item){
        returnNetSales += returnItemNetRevenue_(item);
        returnTax += number_(item.TaxRefundUSD);
        restoredCost += number_(item.CostRestoredUSD);
      });
    } else {
      returnNetSales += number_(row.AmountUSD);
    }
  });

  refundPayments.forEach(function(row){
    const method=String(row.Method||'').toUpperCase();
    if(method==='CASH')cashRefunds+=number_(row.AmountUSD);
    if(method==='BANK')bankRefunds+=number_(row.AmountUSD);
  });
  if(!refundPayments.length){
    returns.forEach(function(row){
      const method=String(row.RefundMethod||'').toUpperCase();
      if(method==='CASH')cashRefunds+=number_(row.AmountUSD);
      if(method==='BANK')bankRefunds+=number_(row.AmountUSD);
    });
  }

  const expenseTotal=expenses.reduce(function(sum,row){return sum+number_(row.AmountUSD);},0);
  const purchaseTotal=purchases.reduce(function(sum,row){return sum+number_(row.TotalUSD);},0);
  const netSales=grossSales-discounts-returnNetSales;
  const netTax=salesTax-returnTax;
  const netReceipts=salesReceipts-refundTotal;
  const cogs=saleCost-restoredCost;
  const grossProfit=netSales-cogs;
  const netProfit=grossProfit-expenseTotal;

  return {
    sales:sales,saleItems:saleItems,returns:returns,returnItems:returnItems,
    expenses:expenses,purchases:purchases,itemsBySale:itemsBySale,returnsBySale:returnsBySale,
    totals:{
      grossSalesUSD:roundMoney_(grossSales),
      discountsUSD:roundMoney_(discounts),
      refundsUSD:roundMoney_(refundTotal),
      returnNetSalesUSD:roundMoney_(returnNetSales),
      taxUSD:roundMoney_(netTax),
      netSalesUSD:roundMoney_(netSales),
      netReceiptsUSD:roundMoney_(netReceipts),
      cogsUSD:roundMoney_(cogs),
      grossProfitUSD:roundMoney_(grossProfit),
      expensesUSD:roundMoney_(expenseTotal),
      purchaseUSD:roundMoney_(purchaseTotal),
      netProfitUSD:roundMoney_(netProfit),
      marginPercent:netSales ? Math.round(grossProfit/netSales*10000)/100 : 0,
      transactions:sales.length,
      returns:returns.length,
      purchases:purchases.length,
      expenseCount:expenses.length,
      cashUSD:roundMoney_(cashSales-cashRefunds),
      bankUSD:roundMoney_(bankSales-bankRefunds),
      creditUSD:roundMoney_(creditSales),
      averageSaleUSD:sales.length ? roundMoney_(netReceipts/sales.length) : 0,
      counts:{
        grossSales:sales.length,discounts:sales.filter(function(r){return number_(r.DiscountUSD)>0;}).length,
        refunds:returns.length,netSales:sales.length,cogs:saleItems.length,grossProfit:sales.length,
        expenses:expenses.length,purchases:purchases.length,netProfit:sales.length
      }
    }
  };
}

function getDashboardData_(user) {
  const now=new Date();
  const today=Utilities.formatDate(now,POS.TIME_ZONE,'yyyy-MM-dd');
  const month=Utilities.formatDate(now,POS.TIME_ZONE,'yyyy-MM');
  const dayMap={},weekly=[];
  for(let offset=6;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset);
    const key=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    const bucket={date:key,label:Utilities.formatDate(d,POS.TIME_ZONE,'EEE'),salesUSD:0,grossProfitUSD:0,transactions:0};
    dayMap[key]=bucket;weekly.push(bucket);
  }

  const dashboardBranchId=getUserBranchId_(user);
  const viewAllBranches=[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.ACCOUNTANT].indexOf(String(user&&user.Role))>=0;
  const sales=reportRows_(POS.SHEETS.SALES).filter(reportSaleIncluded_).filter(function(s){return viewAllBranches||String(s.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===dashboardBranchId;});
  const items=reportRows_(POS.SHEETS.SALE_ITEMS);
  const returns=reportRows_(POS.SHEETS.RETURNS).filter(function(r){return String(r.Status||'').toUpperCase()!=='CANCELLED';});
  const returnItems=reportRows_(POS.SHEETS.RETURN_ITEMS);
  const itemsBySale={};
  items.forEach(function(i){const id=String(i.SaleID);if(!itemsBySale[id])itemsBySale[id]=[];itemsBySale[id].push(i);});
  const returnByDate={};
  returns.forEach(function(r){
    const d=reportDate_(r.DateTime||r.CreatedAt);if(!d)return;
    const k=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    if(!returnByDate[k])returnByDate[k]={revenue:0,cost:0};
    const ritems=returnItems.filter(function(i){return String(i.ReturnID)===String(r.ReturnID);});
    returnByDate[k].revenue += ritems.length ? ritems.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0) : number_(r.AmountUSD);
    returnByDate[k].cost += ritems.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
  });

  let todayRevenue=0,todayProfit=0,todayTransactions=0,monthRevenue=0,monthProfit=0;
  sales.forEach(function(sale){
    const d=reportDate_(sale.DateTime||sale.CreatedAt);if(!d)return;
    const day=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    const mon=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM');
    const net=number_(sale.SubtotalUSD)-number_(sale.DiscountUSD);
    const cost=(itemsBySale[String(sale.SaleID)]||[]).reduce(function(s,i){return s+saleItemCost_(i);},0);
    const profit=net-cost;
    if(dayMap[day]){dayMap[day].salesUSD+=net;dayMap[day].grossProfitUSD+=profit;dayMap[day].transactions++;}
    if(day===today){todayRevenue+=net;todayProfit+=profit;todayTransactions++;}
    if(mon===month){monthRevenue+=net;monthProfit+=profit;}
  });
  Object.keys(returnByDate).forEach(function(day){
    const r=returnByDate[day];
    if(dayMap[day]){dayMap[day].salesUSD-=r.revenue;dayMap[day].grossProfitUSD-=r.revenue-r.cost;}
    if(day===today){todayRevenue-=r.revenue;todayProfit-=r.revenue-r.cost;}
    if(day.slice(0,7)===month){monthRevenue-=r.revenue;monthProfit-=r.revenue-r.cost;}
  });
  weekly.forEach(function(b){b.salesUSD=roundMoney_(b.salesUSD);b.grossProfitUSD=roundMoney_(b.grossProfitUSD);});
  const products=reportRows_(POS.SHEETS.PRODUCTS).filter(function(p){return bool_(p.Active);});
  const pendingPurchaseCount=reportRows_(POS.SHEETS.PURCHASES).filter(function(p){return (viewAllBranches||String(p.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===dashboardBranchId)&&['DRAFT','ORDERED','PARTIALLY_RECEIVED'].indexOf(String(p.Status||'').toUpperCase())>=0;}).length;
  const pendingInvoiceCount=reportRows_(POS.SHEETS.PENDING_INVOICES).filter(function(p){return String(p.Status||'OPEN').toUpperCase()==='OPEN';}).length;
  const todayRefundCount=returns.filter(function(r){const d=reportDate_(r.DateTime||r.CreatedAt);return d&&Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd')===today;}).length;
  const todayDate=new Date();todayDate.setHours(23,59,59,999);
  const openReceivables=reportRows_(POS.SHEETS.RECEIVABLES).filter(function(r){return number_(r.BalanceUSD)>0.000001;});
  const overdueCustomerIds={};
  openReceivables.forEach(function(r){const d=reportDate_(r.DueDate);if(d&&d<todayDate)overdueCustomerIds[String(r.CustomerID)]=true;});
  return {
    todayRevenueUSD:roundMoney_(todayRevenue),
    todayGrossProfitUSD:roundMoney_(todayProfit),
    todayTransactions:todayTransactions,
    monthRevenueUSD:roundMoney_(monthRevenue),
    monthGrossProfitUSD:roundMoney_(monthProfit),
    lowStockProducts:products.filter(function(p){return getBranchStockQty_(dashboardBranchId,p.ProductID)<=number_(p.LowStockLevel);}).length,
    creditOutstandingUSD:roundMoney_(openReceivables.reduce(function(s,r){return s+Math.max(0,number_(r.BalanceUSD));},0)),
    pendingPurchaseCount:pendingPurchaseCount,
    pendingInvoiceCount:pendingInvoiceCount,
    pendingCreditCustomerCount:Object.keys(overdueCustomerIds).length,
    todayRefundCount:todayRefundCount,
    openCreditCustomerCount:Object.keys(openReceivables.reduce(function(m,r){m[String(r.CustomerID)]=true;return m;},{})).length,
    weeklySales:weekly
  };
}

function getTodaySummary_() {
  const user={};
  return getDashboardData_(user);
}

function getAdvancedReport(sessionToken, options) {
  const reportUser=requireSession_(sessionToken);requirePermission_(reportUser,'REPORTS');
  options=options||{};
  const requestedBranch = sanitizeText_(options.branchId,80);
  const requestedCashier = sanitizeText_(options.cashierId,80);
  const branchId = resolveAccessibleBranchId_(reportUser, requestedBranch, true);
  let cashierId = requestedCashier;
  if (!canManageAllBranches_(reportUser)) {
    if (String(reportUser.Role) === POS.ROLES.CASHIER) cashierId = String(reportUser.UserID);
    else if (cashierId) {
      const cashier = findRowBy_(POS.SHEETS.USERS,'UserID',cashierId);
      if (!cashier || String(getUserBranchId_(cashier)) !== String(getUserBranchId_(reportUser))) cashierId = '';
    }
  }
  REPORT_SCOPE_V37_ = {branchId:branchId,cashierId:cashierId};
  try {
    const type=String(options.type||'SALES_SUMMARY').toUpperCase();
    const range=reportRange_(options.from,options.to);
    let result;
    if(type==='PROFIT_LOSS')result=buildProfitLossReport_(range);
    else if(type==='STOCK')result=buildStockReport_(range,options);
    else if(type==='CUSTOMER')result=buildCustomerReport_(range,options);
    else if(type==='CREDIT')result=buildCreditReport_(sessionToken,range,options);
    else if(type==='REFUND')result=buildRefundSummaryReport_(range,options);
    else result=buildSalesSummaryReport_(range,options);
    result.filters = {branchId:branchId,cashierId:cashierId};
    return result;
  } finally {
    REPORT_SCOPE_V37_ = null;
  }
}

function getReports(sessionToken, options) {
  options=options||{};options.type='SALES_SUMMARY';
  return getAdvancedReport(sessionToken,options);
}
function getReportsSafeV2(sessionToken,options){return getReports(sessionToken,options);}

function buildSalesSummaryReport_(range, options) {
  const data=buildAccountingData_(range);
  const period=String(options&&options.period||'DATE_RANGE').toUpperCase();
  const buckets={};

  function bucketFor(value){
    const info=period==='DATE_RANGE' ? {key:'RANGE',label:Utilities.formatDate(range.from,POS.TIME_ZONE,'yyyy-MM-dd')+' — '+Utilities.formatDate(range.to,POS.TIME_ZONE,'yyyy-MM-dd')} : reportPeriodKey_(value,period);if(!info)return null;
    if(!buckets[info.key])buckets[info.key]={
      periodKey:info.key,periodLabel:info.label,slips:0,grossSalesUSD:0,discountsUSD:0,
      refundsUSD:0,netSalesUSD:0,cogsUSD:0,grossProfitUSD:0,cashUSD:0,bankUSD:0,creditUSD:0
    };
    return buckets[info.key];
  }

  data.sales.forEach(function(sale){
    const b=bucketFor(sale.DateTime||sale.CreatedAt);if(!b)return;
    b.slips++;
    b.grossSalesUSD+=number_(sale.SubtotalUSD);
    b.discountsUSD+=number_(sale.DiscountUSD);
    b.netSalesUSD+=number_(sale.SubtotalUSD)-number_(sale.DiscountUSD);
    b.creditUSD+=number_(sale.CreditAmountUSD);
    const method=String(sale.PaymentMethod||'').toUpperCase();
    if(method.indexOf('CASH')>=0)b.cashUSD+=number_(sale.AmountPaidUSD || sale.TotalUSD);
    if(method.indexOf('BANK')>=0)b.bankUSD+=number_(sale.AmountPaidUSD || sale.TotalUSD);
    (data.itemsBySale[String(sale.SaleID)]||[]).forEach(function(i){b.cogsUSD+=saleItemCost_(i);});
  });

  const returnItemsById={};
  data.returnItems.forEach(function(i){const id=String(i.ReturnID);if(!returnItemsById[id])returnItemsById[id]=[];returnItemsById[id].push(i);});
  data.returns.forEach(function(r){
    const b=bucketFor(r.DateTime||r.CreatedAt);if(!b)return;
    const ri=returnItemsById[String(r.ReturnID)]||[];
    const netRefund=ri.length?ri.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0):number_(r.AmountUSD);
    const restored=ri.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
    b.refundsUSD+=netRefund;b.netSalesUSD-=netRefund;b.cogsUSD-=restored;
    const method=String(r.RefundMethod||'').toUpperCase();
    if(method==='CASH')b.cashUSD-=number_(r.AmountUSD);
    if(method==='BANK')b.bankUSD-=number_(r.AmountUSD);
  });

  const rows=Object.keys(buckets).sort().map(function(key){
    const b=buckets[key];
    b.grossSalesUSD=roundMoney_(b.grossSalesUSD);b.discountsUSD=roundMoney_(b.discountsUSD);
    b.refundsUSD=roundMoney_(b.refundsUSD);b.netSalesUSD=roundMoney_(b.netSalesUSD);
    b.cogsUSD=roundMoney_(b.cogsUSD);b.grossProfitUSD=roundMoney_(b.netSalesUSD-b.cogsUSD);
    b.cashUSD=roundMoney_(b.cashUSD);b.bankUSD=roundMoney_(b.bankUSD);b.creditUSD=roundMoney_(b.creditUSD);
    return b;
  });
  return {type:'SALES_SUMMARY',title:'Sales Summary',period:period,from:range.from.toISOString(),to:range.to.toISOString(),totals:data.totals,rows:rows};
}

function buildProfitLossReport_(range) {
  const data=buildAccountingData_(range);
  const byDay={};
  function bucket(value){
    const info=reportPeriodKey_(value,'DAILY');if(!info)return null;
    if(!byDay[info.key])byDay[info.key]={
      date:info.key,grossSalesUSD:0,saleCount:0,discountsUSD:0,discountCount:0,
      refundsUSD:0,returnCount:0,netSalesUSD:0,cogsUSD:0,grossProfitUSD:0,
      expensesUSD:0,expenseCount:0,purchaseUSD:0,purchaseCount:0,netProfitUSD:0
    };
    return byDay[info.key];
  }
  data.sales.forEach(function(s){
    const b=bucket(s.DateTime||s.CreatedAt);if(!b)return;
    b.saleCount++;b.grossSalesUSD+=number_(s.SubtotalUSD);b.discountsUSD+=number_(s.DiscountUSD);
    if(number_(s.DiscountUSD)>0)b.discountCount++;
    (data.itemsBySale[String(s.SaleID)]||[]).forEach(function(i){b.cogsUSD+=saleItemCost_(i);});
  });
  const riBy={};data.returnItems.forEach(function(i){const id=String(i.ReturnID);if(!riBy[id])riBy[id]=[];riBy[id].push(i);});
  data.returns.forEach(function(r){
    const b=bucket(r.DateTime||r.CreatedAt);if(!b)return;
    const items=riBy[String(r.ReturnID)]||[];
    b.returnCount++;b.refundsUSD+=items.length?items.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0):number_(r.AmountUSD);
    b.cogsUSD-=items.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
  });
  data.expenses.forEach(function(e){const b=bucket(e.DateTime||e.CreatedAt);if(b){b.expensesUSD+=number_(e.AmountUSD);b.expenseCount++;}});
  data.purchases.forEach(function(p){const b=bucket(p.PurchaseDate||p.CreatedAt);if(b){b.purchaseUSD+=number_(p.TotalUSD);b.purchaseCount++;}});

  const rows=Object.keys(byDay).sort().map(function(k){
    const b=byDay[k];
    b.netSalesUSD=roundMoney_(b.grossSalesUSD-b.discountsUSD-b.refundsUSD);
    b.cogsUSD=roundMoney_(b.cogsUSD);b.grossProfitUSD=roundMoney_(b.netSalesUSD-b.cogsUSD);
    b.netProfitUSD=roundMoney_(b.grossProfitUSD-b.expensesUSD);
    ['grossSalesUSD','discountsUSD','refundsUSD','expensesUSD','purchaseUSD'].forEach(function(x){b[x]=roundMoney_(b[x]);});
    return b;
  });
  return {type:'PROFIT_LOSS',title:'Profit / Loss',from:range.from.toISOString(),to:range.to.toISOString(),totals:data.totals,rows:rows};
}

function stockAgeBucket_(days) {
  if(days<=30)return '0-30';
  if(days<=60)return '31-60';
  if(days<=90)return '61-90';
  return '91+';
}

function buildStockReport_(range,options) {
  options=options||{};
  const products={},categories={},units={},purchases={};
  reportRows_(POS.SHEETS.PRODUCTS).forEach(function(p){products[String(p.ProductID)]=p;});
  reportRows_(POS.SHEETS.CATEGORIES).forEach(function(c){categories[String(c.CategoryID)]=String(c.NameEN||c.NameKH||'');});
  reportRows_(POS.SHEETS.UNITS).forEach(function(u){units[String(u.UnitID)]=String(u.Abbreviation||u.NameEN||u.NameKH||'');});
  reportRows_(POS.SHEETS.PURCHASES).forEach(function(p){purchases[String(p.PurchaseID)]=p;});

  const query=sanitizeText_(options.query,120).toLowerCase();
  const categoryId=sanitizeText_(options.categoryId,80);
  const now=new Date();
  const rows=[];

  reportRows_(POS.SHEETS.STOCK_LOTS).filter(function(l){return number_(l.QtyRemaining)>0.000001;}).forEach(function(lot){
    const p=products[String(lot.ProductID)];if(!p)return;
    if(categoryId&&String(p.CategoryID)!==categoryId)return;
    const hay=[p.NameEN,p.NameKH,p.Barcode,p.SKU].join(' ').toLowerCase();
    if(query&&hay.indexOf(query)<0)return;
    const received=reportDate_(lot.ReceivedAt||lot.CreatedAt)||now;
    const days=Math.max(0,Math.floor((now-received)/86400000));
    const qty=number_(lot.QtyRemaining);
    const cost=number_(lot.UnitCostUSD);
    const pur=purchases[String(lot.PurchaseID)]||{};
    rows.push({
      lotId:String(lot.LotID||''),productId:String(p.ProductID),productName:String(p.NameEN||p.NameKH||''),
      barcode:String(p.Barcode||''),sku:String(p.SKU||''),category:categories[String(p.CategoryID)]||'',
      unit:units[String(p.UnitID)]||'',purchaseNo:String(pur.PurchaseNo||lot.ReferenceID||''),
      receivedAt:received.toISOString(),ageDays:days,agingBucket:stockAgeBucket_(days),
      qtyRemaining:qty,unitCostUSD:roundMoney_(cost),inventoryValueUSD:roundMoney_(qty*cost),
      active:bool_(p.Active),status:qty<=0?'OUT':qty<=number_(p.LowStockLevel)?'LOW':'OK'
    });
  });

  // Products with current stock but no open FIFO lot remain visible as fallback.
  Object.keys(products).forEach(function(id){
    const p=products[id];const qty=number_(p.CurrentStock);
    if(qty<=0||rows.some(function(r){return r.productId===id;}))return;
    if(categoryId&&String(p.CategoryID)!==categoryId)return;
    const hay=[p.NameEN,p.NameKH,p.Barcode,p.SKU].join(' ').toLowerCase();
    if(query&&hay.indexOf(query)<0)return;
    rows.push({
      lotId:'FALLBACK-'+id,productId:id,productName:String(p.NameEN||p.NameKH||''),barcode:String(p.Barcode||''),
      sku:String(p.SKU||''),category:categories[String(p.CategoryID)]||'',unit:units[String(p.UnitID)]||'',
      purchaseNo:'Opening / legacy',receivedAt:p.CreatedAt?reportDate_(p.CreatedAt).toISOString():'',
      ageDays:p.CreatedAt?Math.max(0,Math.floor((now-reportDate_(p.CreatedAt))/86400000)):0,
      agingBucket:stockAgeBucket_(p.CreatedAt?Math.max(0,Math.floor((now-reportDate_(p.CreatedAt))/86400000)):0),
      qtyRemaining:qty,unitCostUSD:roundMoney_(number_(p.CostUSD)),inventoryValueUSD:roundMoney_(qty*number_(p.CostUSD)),
      active:bool_(p.Active),status:qty<=number_(p.LowStockLevel)?'LOW':'OK'
    });
  });

  rows.sort(function(a,b){return a.productName.localeCompare(b.productName)||new Date(a.receivedAt)-new Date(b.receivedAt);});
  const aging={
    '0-30':{qty:0,valueUSD:0,lots:0},
    '31-60':{qty:0,valueUSD:0,lots:0},
    '61-90':{qty:0,valueUSD:0,lots:0},
    '91+':{qty:0,valueUSD:0,lots:0}
  };
  rows.forEach(function(r){const a=aging[r.agingBucket];a.qty+=r.qtyRemaining;a.valueUSD+=r.inventoryValueUSD;a.lots++;});
  Object.keys(aging).forEach(function(k){aging[k].qty=Math.round(aging[k].qty*1000)/1000;aging[k].valueUSD=roundMoney_(aging[k].valueUSD);});
  const distinct={};rows.forEach(function(r){distinct[r.productId]=true;});
  const totals={
    inventoryQty:Math.round(rows.reduce(function(s,r){return s+r.qtyRemaining;},0)*1000)/1000,
    inventoryValueUSD:roundMoney_(rows.reduce(function(s,r){return s+r.inventoryValueUSD;},0)),
    lowStockCount:Object.keys(products).filter(function(id){const p=products[id];return number_(p.CurrentStock)>0&&number_(p.CurrentStock)<=number_(p.LowStockLevel);}).length,
    outOfStockCount:Object.keys(products).filter(function(id){return number_(products[id].CurrentStock)<=0;}).length,
    products:Object.keys(distinct).length,lots:rows.length,aging:aging
  };
  return {type:'STOCK',title:'Stock Analysis',from:range.from.toISOString(),to:range.to.toISOString(),totals:totals,rows:rows};
}

function buildCustomerReport_(range,options) {
  const data=buildAccountingData_(range),customers={};
  reportRows_(POS.SHEETS.CUSTOMERS).forEach(function(c){
    customers[String(c.CustomerID)]={
      customerId:String(c.CustomerID),name:String(c.Name||''),customerType:String(c.CustomerType||'RETAIL'),
      phone:String(c.Phone||''),email:String(c.Email||''),active:bool_(c.Active),
      registeredAt:reportDate_(c.CreatedAt)?reportDate_(c.CreatedAt).toISOString():'',
      creditLimitUSD:number_(c.CreditLimitUSD),outstandingUSD:getCustomerOutstanding_(c.CustomerID),
      transactions:0,grossSalesUSD:0,refundsUSD:0,netSalesUSD:0,lastPurchase:null
    };
  });
  const saleCustomer={};
  data.sales.forEach(function(s){
    const id=String(s.CustomerID||'');saleCustomer[String(s.SaleID)]=id;if(!id||!customers[id])return;
    const c=customers[id];c.transactions++;c.grossSalesUSD+=number_(s.TotalUSD);
    const d=reportDate_(s.DateTime||s.CreatedAt);if(d&&(!c.lastPurchase||d>c.lastPurchase))c.lastPurchase=d;
  });
  data.returns.forEach(function(r){const id=saleCustomer[String(r.SaleID)]||'';if(id&&customers[id])customers[id].refundsUSD+=number_(r.AmountUSD);});
  const query=sanitizeText_(options&&options.query,120).toLowerCase();
  const rows=Object.keys(customers).map(function(id){
    const c=customers[id];c.grossSalesUSD=roundMoney_(c.grossSalesUSD);c.refundsUSD=roundMoney_(c.refundsUSD);
    c.netSalesUSD=roundMoney_(c.grossSalesUSD-c.refundsUSD);c.averageSaleUSD=c.transactions?roundMoney_(c.netSalesUSD/c.transactions):0;
    c.lastPurchase=c.lastPurchase?c.lastPurchase.toISOString():'';
    return c;
  }).filter(function(c){return !query||[c.name,c.customerType,c.phone,c.email,c.customerId].join(' ').toLowerCase().indexOf(query)>=0;})
    .sort(function(a,b){return b.netSalesUSD-a.netSalesUSD;});
  const buying=rows.filter(function(r){return r.transactions>0;});
  return {type:'CUSTOMER',title:'Customer Analysis',from:range.from.toISOString(),to:range.to.toISOString(),
    totals:{
      customers:rows.length,activeCustomers:rows.filter(function(r){return r.active;}).length,
      buyingCustomers:buying.length,repeatCustomers:rows.filter(function(r){return r.transactions>1;}).length,
      netSalesUSD:roundMoney_(rows.reduce(function(s,r){return s+r.netSalesUSD;},0)),
      outstandingUSD:roundMoney_(rows.reduce(function(s,r){return s+r.outstandingUSD;},0)),
      averageCustomerValueUSD:buying.length?roundMoney_(buying.reduce(function(s,r){return s+r.netSalesUSD;},0)/buying.length):0
    },rows:rows};
}

function buildCreditReport_(sessionToken,range,options) {
  const data=getCreditAccountsData(sessionToken,options);
  const rows=(data.receivables||[]).filter(function(row) {
    return reportInRange_(row.invoiceDate, range);
  });
  const customerIds={};
  rows.forEach(function(row){customerIds[String(row.customerId||'')]=true;});
  const totals={
    outstandingUSD:roundMoney_(rows.reduce(function(sum,row){return sum+number_(row.balanceUSD);},0)),
    overdueUSD:roundMoney_(rows.filter(function(row){return row.status==='OVERDUE';}).reduce(function(sum,row){return sum+number_(row.balanceUSD);},0)),
    openInvoices:rows.filter(function(row){return number_(row.balanceUSD)>0.000001;}).length,
    overdueInvoices:rows.filter(function(row){return row.status==='OVERDUE';}).length,
    customers:Object.keys(customerIds).filter(Boolean).length
  };
  return {type:'CREDIT',title:'Customer Credit',from:range.from.toISOString(),to:range.to.toISOString(),totals:totals,rows:rows};
}

function getReceipt(sessionToken,saleId){requireSession_(sessionToken);return getSaleReceipt_(saleId);}


function buildRefundSummaryReport_(range, options) {
  options=options||{};
  const query=sanitizeText_(options.query,160).toLowerCase();
  const sales={};reportRows_(POS.SHEETS.SALES).forEach(function(s){sales[String(s.SaleID)]=s;});
  const returnItems={};reportRows_(POS.SHEETS.RETURN_ITEMS).forEach(function(i){const id=String(i.ReturnID);if(!returnItems[id])returnItems[id]=[];returnItems[id].push(i);});
  const rows=reportRows_(POS.SHEETS.RETURNS)
    .filter(function(r){return String(r.Status||'COMPLETED').toUpperCase()!=='CANCELLED'&&reportInRange_(r.DateTime||r.CreatedAt,range);})
    .map(function(r){
      const sale=sales[String(r.SaleID)]||{};const items=returnItems[String(r.ReturnID)]||[];
      const hay=[r.ReturnNo,r.InvoiceNo,r.Reason,r.UserName,sale.CustomerName].join(' ').toLowerCase();
      if(query&&hay.indexOf(query)<0)return null;
      return {returnId:String(r.ReturnID||''),returnNo:String(r.ReturnNo||r.ReturnID||''),invoiceNo:String(r.InvoiceNo||''),dateTime:reportDate_(r.DateTime||r.CreatedAt).toISOString(),customerName:String(sale.CustomerName||'Walk-in'),amountUSD:roundMoney_(number_(r.AmountUSD)),refundMethod:String(r.RefundMethod||''),refundCurrency:String(r.RefundCurrency||'USD'),reason:String(r.Reason||''),processedBy:String(r.UserName||''),itemCount:items.length,qtyReturned:items.reduce(function(sum,i){return sum+number_(i.QtyReturned);},0),restockedQty:items.reduce(function(sum,i){return sum+(bool_(i.Restock)?number_(i.QtyReturned):0);},0),damageImageUrl:String(r.DamageImageURL||''),status:String(r.Status||'COMPLETED')};
    }).filter(Boolean).sort(function(a,b){return new Date(b.dateTime)-new Date(a.dateTime);});
  return {type:'REFUND',title:'Refund Summary',from:range.from.toISOString(),to:range.to.toISOString(),totals:{returns:rows.length,refundsUSD:roundMoney_(rows.reduce(function(s,r){return s+r.amountUSD;},0)),items:rows.reduce(function(s,r){return s+r.itemCount;},0),qtyReturned:rows.reduce(function(s,r){return s+r.qtyReturned;},0),restockedQty:rows.reduce(function(s,r){return s+r.restockedQty;},0)},rows:rows};
}


/* ==========================================================================
 * SOURCE: ReturnsRefunds.gs
 * ========================================================================== */
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


/* ==========================================================================
 * SOURCE: ReturnsRefundsSetup.gs
 * ========================================================================== */
/**
 * Returns + Refunds + FIFO restoration installer.
 * Safe upgrade: adds only missing sheets/columns and never clears existing rows.
 */
var RETURNS_REFUNDS = Object.freeze({
  SHEETS: Object.freeze({
    RETURN_ITEMS: 'ReturnItems',
    REFUND_PAYMENTS: 'RefundPayments',
    RETURN_LOT_RESTORATIONS: 'ReturnLotRestorations'
  }),
  HEADERS: Object.freeze({
    Returns: [
      'ReturnID', 'ReturnNo', 'SaleID', 'InvoiceNo', 'DateTime',
      'RefundMethod', 'RefundCurrency', 'RefundAmount', 'AmountUSD',
      'AmountKHR', 'Reason', 'Notes', 'UserID', 'UserName', 'ShiftID',
      'Status', 'CreatedAt'
    ],
    ReturnItems: [
      'ReturnItemID', 'ReturnID', 'SaleItemID', 'SaleID', 'ProductID',
      'ProductName', 'QtyReturned', 'UnitPriceUSD', 'GrossLineRefundUSD',
      'DiscountRefundUSD', 'TaxRefundUSD', 'RefundUSD', 'Restock',
      'Condition', 'CostRestoredUSD', 'CreatedAt'
    ],
    RefundPayments: [
      'RefundPaymentID', 'ReturnID', 'SaleID', 'Method', 'Currency',
      'Amount', 'AmountUSD', 'Reference', 'ShiftID', 'UserID',
      'Status', 'CreatedAt'
    ],
    ReturnLotRestorations: [
      'RestorationID', 'ReturnID', 'ReturnItemID', 'SaleItemID',
      'OriginalAllocationID', 'OriginalLotID', 'ProductID', 'Qty',
      'UnitCostUSD', 'CostUSD', 'NewLotID', 'CreatedAt'
    ],
    Sales: [
      'ReturnedQty', 'RefundedUSD', 'ReturnStatus', 'LastReturnAt'
    ],
    SaleItems: [
      'ReturnedQty', 'RefundedUSD', 'RestockedQty',
      'CostRestoredUSD'
    ]
  })
});

function installReturnsRefundsFeature() {
  const ss = getSpreadsheet_();
  const report = [];

  withScriptLock_(function() {
    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.RETURNS,
      RETURNS_REFUNDS.HEADERS.Returns,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.RETURN_ITEMS,
      RETURNS_REFUNDS.HEADERS.ReturnItems,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS,
      RETURNS_REFUNDS.HEADERS.RefundPayments,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.RETURN_LOT_RESTORATIONS,
      RETURNS_REFUNDS.HEADERS.ReturnLotRestorations,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.SALES,
      RETURNS_REFUNDS.HEADERS.Sales,
      false,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.SALE_ITEMS,
      RETURNS_REFUNDS.HEADERS.SaleItems,
      false,
      report
    );
  });

  const message =
    'Returns and refunds feature installed.\n\n' +
    report.join('\n');

  console.log(message);

  try {
    ss.toast(
      'Returns + Refunds installed.',
      'POS Upgrade',
      8
    );
  } catch (error) {
    console.log(error.message);
  }

  return message;
}

function ensureReturnsRefundColumns_(
  ss,
  sheetName,
  requiredHeaders,
  createIfMissing,
  report
) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    if (!createIfMissing) {
      throw new Error('Missing required sheet: ' + sheetName);
    }

    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();

  const existing = lastColumn > 0
    ? sheet
        .getRange(1, 1, 1, lastColumn)
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
    : [];

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    const startColumn = lastColumn + 1;
    const finalColumn = startColumn + missing.length - 1;

    if (finalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        finalColumn - sheet.getMaxColumns()
      );
    }

    sheet
      .getRange(1, startColumn, 1, missing.length)
      .setValues([missing]);

    report.push(
      sheetName + ': added ' + missing.join(', ')
    );
  } else {
    report.push(sheetName + ': already up to date');
  }

  const currentLastColumn = sheet.getLastColumn();

  if (currentLastColumn > 0) {
    sheet.setFrozenRows(1);

    sheet
      .getRange(1, 1, 1, currentLastColumn)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

function checkReturnsRefundsFeature() {
  const ss = getSpreadsheet_();

  const requirements = {};
  requirements[POS.SHEETS.RETURNS] =
    RETURNS_REFUNDS.HEADERS.Returns;
  requirements[RETURNS_REFUNDS.SHEETS.RETURN_ITEMS] =
    RETURNS_REFUNDS.HEADERS.ReturnItems;
  requirements[RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS] =
    RETURNS_REFUNDS.HEADERS.RefundPayments;
  requirements[
    RETURNS_REFUNDS.SHEETS.RETURN_LOT_RESTORATIONS
  ] = RETURNS_REFUNDS.HEADERS.ReturnLotRestorations;
  requirements[POS.SHEETS.SALES] =
    RETURNS_REFUNDS.HEADERS.Sales;
  requirements[POS.SHEETS.SALE_ITEMS] =
    RETURNS_REFUNDS.HEADERS.SaleItems;

  const results = [];

  Object.keys(requirements).forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      results.push(sheetName + ': MISSING SHEET');
      return;
    }

    const lastColumn = sheet.getLastColumn();

    const headers = lastColumn > 0
      ? sheet
          .getRange(1, 1, 1, lastColumn)
          .getDisplayValues()[0]
          .map(function(value) {
            return String(value || '').trim();
          })
      : [];

    const missing = requirements[sheetName]
      .filter(function(header) {
        return headers.indexOf(header) === -1;
      });

    results.push(
      sheetName +
      ': ' +
      (missing.length
        ? 'Missing ' + missing.join(', ')
        : 'OK')
    );
  });

  const message = results.join('\n');
  console.log(message);

  try {
    ss.toast(message, 'Returns Feature Check', 10);
  } catch (error) {
    console.log(error.message);
  }

  return message;
}


/* ==========================================================================
 * SOURCE: Sales.gs
 * ========================================================================== */
function validateCart_(payload) {
  payload = payload || {};

  const branchId = sanitizeText_(payload.branchId,80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  if (!requestedItems.length) throw new Error('The cart is empty.');

  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) { productMap[String(row.ProductID)] = row; });
  const unitMap = getUnitMap_();

  const items = [];
  let subtotal = 0;

  requestedItems.forEach(function(requested) {
    const product = productMap[String(requested.productId)];
    if (!product || !bool_(product.Active)) throw new Error('A product in the cart is unavailable.');

    const unit = unitMap[String(product.UnitID || '')] || {};
    let qty = number_(requested.qty);
    if (qty <= 0) throw new Error('Product quantity must be greater than zero.');
    if (unit.allowDecimal !== true && Math.abs(qty - Math.round(qty)) > 0.000001) {
      throw new Error((product.NameEN || product.NameKH) + ' must use a whole-number quantity.');
    }
    qty = unit.allowDecimal === true ? Math.round(qty * 1000) / 1000 : Math.round(qty);

    if (getBranchStockQty_(branchId, product.ProductID) + 0.000001 < qty) {
      throw new Error((product.NameEN || product.NameKH) + ' has insufficient stock.');
    }

    const unitPrice = roundMoney_(number_(product.PriceUSD));
    const lineTotal = roundMoney_(unitPrice * qty);
    subtotal = roundMoney_(subtotal + lineTotal);

    items.push({
      productId: String(product.ProductID),
      barcode: String(product.Barcode || ''),
      productName: String(product.NameEN || product.NameKH || ''),
      qty: qty,
      unitId: String(product.UnitID || ''),
      unitName: String(unit.abbreviation || unit.nameEN || unit.nameKH || ''),
      allowDecimal: unit.allowDecimal === true,
      unitCostUSD: roundMoney_(number_(product.CostUSD)),
      unitPriceUSD: unitPrice,
      discountUSD: 0,
      lineTotalUSD: lineTotal,
      productRow: product
    });
  });

  const customerId = sanitizeText_(payload.customerId, 80);
  let customer = null;
  if (customerId) {
    customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
    if (!customer || !bool_(customer.Active)) throw new Error('The selected customer is unavailable.');
  }

  const settings = getSettings_();
  const exchangeRate = number_(payload.exchangeRate, number_(settings.EXCHANGE_RATE, 4100));
  if (exchangeRate <= 0) throw new Error('Exchange rate is invalid.');

  let manualDiscountType = String(payload.manualDiscountType || '').trim().toUpperCase();
  let manualDiscountValue = 0;
  let manualDiscountPercent = 0;
  let manualDiscountUSD = 0;

  if (manualDiscountType === 'FIXED') {
    manualDiscountValue = Math.max(0, roundMoney_(number_(payload.manualDiscountValue, payload.discountUSD)));
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0 ? Math.round(manualDiscountUSD / subtotal * 10000) / 100 : 0;
  } else if (
    manualDiscountType === 'PERCENT' ||
    payload.manualDiscountValue !== undefined ||
    payload.manualDiscountPercent !== undefined
  ) {
    manualDiscountType = 'PERCENT';
    manualDiscountValue = Math.min(100, Math.max(0, number_(payload.manualDiscountValue, payload.manualDiscountPercent)));
    manualDiscountValue = Math.round(manualDiscountValue * 100) / 100;
    manualDiscountPercent = manualDiscountValue;
    manualDiscountUSD = roundMoney_(subtotal * manualDiscountPercent / 100);
  } else {
    manualDiscountType = 'FIXED';
    manualDiscountValue = Math.max(0, roundMoney_(number_(payload.discountUSD)));
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0 ? Math.round(manualDiscountUSD / subtotal * 10000) / 100 : 0;
  }

  const afterManualDiscount = roundMoney_(subtotal - manualDiscountUSD);
  const coupon = calculateCouponDiscount_(payload.couponCode, afterManualDiscount, new Date());
  const couponDiscountUSD = Math.min(afterManualDiscount, roundMoney_(number_(coupon.discountUSD)));
  const discountUSD = Math.min(subtotal, roundMoney_(manualDiscountUSD + couponDiscountUSD));
  const taxable = roundMoney_(subtotal - discountUSD);
  const taxRate = Math.max(0, number_(settings.TAX_RATE));
  const tax = roundMoney_(taxable * taxRate / 100);
  const totalUSD = roundMoney_(taxable + tax);
  const totalKHR = Math.round(totalUSD * exchangeRate);

  return {
    branchId: branchId,
    items: items,
    customerId: customerId,
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer ? String(customer.CustomerType || 'RETAIL').toUpperCase() : 'WALK-IN',
    customerCreditLimitUSD: customer ? roundMoney_(number_(customer.CreditLimitUSD)) : 0,
    customerCreditBalanceUSD: customer ? getCustomerOutstanding_(customerId) : 0,
    customerPaymentTermsDays: customer ? Math.max(0, Math.round(number_(customer.PaymentTermsDays, 30))) : 0,
    notes: sanitizeText_(payload.notes, 250),
    subtotalUSD: subtotal,
    manualDiscountType: manualDiscountType,
    manualDiscountValue: manualDiscountValue,
    manualDiscountPercent: manualDiscountPercent,
    manualDiscountUSD: manualDiscountUSD,
    couponCode: coupon.code,
    couponDescriptionEN: coupon.descriptionEN,
    couponDescriptionKH: coupon.descriptionKH,
    couponDiscountUSD: couponDiscountUSD,
    discountUSD: discountUSD,
    taxUSD: tax,
    totalUSD: totalUSD,
    totalKHR: totalKHR,
    exchangeRate: exchangeRate
  };
}

function previewCartPricing(sessionToken, payload) {
  const user=requireSession_(sessionToken);payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  const validated = validateCart_(payload);

  return {
    subtotalUSD: validated.subtotalUSD,
    manualDiscountType: validated.manualDiscountType,
    manualDiscountValue: validated.manualDiscountValue,
    manualDiscountPercent: validated.manualDiscountPercent,
    manualDiscountUSD: validated.manualDiscountUSD,
    couponCode: validated.couponCode,
    couponDescriptionEN: validated.couponDescriptionEN,
    couponDescriptionKH: validated.couponDescriptionKH,
    couponDiscountUSD: validated.couponDiscountUSD,
    discountUSD: validated.discountUSD,
    taxUSD: validated.taxUSD,
    totalUSD: validated.totalUSD,
    totalKHR: validated.totalKHR,
    exchangeRate: validated.exchangeRate
  };
}

function completeCashSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const paymentCurrency = String(
      payload.paymentCurrency || 'USD'
    ).toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';

    const received = number_(payload.receivedAmount);
    const required = paymentCurrency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    if (received + 0.000001 < required) {
      throw new Error(
        'Received cash is less than the invoice total.'
      );
    }

    const payment = {
      method: 'CASH',
      currency: paymentCurrency,
      amount: required,
      reference: '',
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      '',
      {pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : ''}
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    receipt.receivedAmount = received;
    receipt.changeAmount = paymentCurrency === 'KHR'
      ? Math.round(received - required)
      : roundMoney_(received - required);

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

/**
 * Temporary bank completion.
 * This records BANK as the payment method without generating KHQR.
 * Dynamic KHQR can be re-enabled later after the rest of the POS is stable.
 */
function completeBankSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const currency = String(
      payload.bankCurrency || 'USD'
    ).toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';

    const amount = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    const payment = {
      method: 'BANK',
      currency: currency,
      amount: amount,
      reference: sanitizeText_(
        payload.bankReference,
        120
      ),
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      '',
      {pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : ''}
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}


function completeCreditSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload = payload || {};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    if (!validated.customerId) throw new Error('Select a customer before using credit.');
    const customer = findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',validated.customerId);
    if (!customer || !bool_(customer.Active)) throw new Error('Active customer was not found.');

    const pending = resolvePendingForCompletion_(user, payload.pendingId);
    const paidMethod = String(payload.paidMethod || 'CASH').toUpperCase() === 'BANK' ? 'BANK' : 'CASH';
    const paidCurrency = String(payload.paidCurrency || 'USD').toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const enteredPaid = Math.max(0, number_(payload.paidAmount));
    const paidNowUSD = paidCurrency === 'KHR'
      ? roundMoney_(enteredPaid / validated.exchangeRate)
      : roundMoney_(enteredPaid);

    if (paidNowUSD > validated.totalUSD + 0.005) {
      throw new Error('Paid-now amount cannot exceed the invoice total.');
    }
    const creditAmountUSD = roundMoney_(validated.totalUSD - paidNowUSD);
    if (creditAmountUSD <= 0.000001) {
      throw new Error('Use Cash or Bank checkout when the invoice is fully paid.');
    }

    const currentBalance = getCustomerOutstanding_(validated.customerId);
    const limit = roundMoney_(number_(customer.CreditLimitUSD));
    const projected = roundMoney_(currentBalance + creditAmountUSD);
    const manager = [POS.ROLES.ADMIN, POS.ROLES.MANAGER].indexOf(user.Role) >= 0;
    const override = payload.overrideCredit === true && manager;

    if (!override) {
      if (limit <= 0) throw new Error('This customer does not have an approved credit limit.');
      if (projected > limit + 0.005) {
        throw new Error(
          'Credit limit exceeded. Current: $' + currentBalance.toFixed(2) +
          ', new credit: $' + creditAmountUSD.toFixed(2) +
          ', limit: $' + limit.toFixed(2) + '.'
        );
      }
    }

    const terms = Math.max(0, Math.round(number_(payload.paymentTermsDays, customer.PaymentTermsDays || 30)));
    let dueDate;
    if (payload.dueDate) {
      dueDate = new Date(String(payload.dueDate) + 'T23:59:59');
      if (isNaN(dueDate.getTime())) throw new Error('Due date is invalid.');
    } else {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + terms);
    }

    const payments = [];
    if (paidNowUSD > 0) {
      payments.push({
        method:paidMethod,
        currency:paidCurrency,
        amount:paidCurrency === 'KHR' ? Math.round(enteredPaid) : roundMoney_(enteredPaid),
        amountUSD:paidNowUSD,
        reference:sanitizeText_(payload.reference,120),
        status:POS.PAYMENT_STATUS.PAID
      });
    }

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payments,
      '',
      {
        pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : '',
        creditAmountUSD:creditAmountUSD,
        dueDate:dueDate,
        paymentTermsDays:terms,
        overrideCredit:override
      }
    );

    if (pending) markPendingCompletedLocked_(String(pending.PendingID), receipt.saleId, receipt.invoiceNo);
    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

function resolvePendingForCompletion_(user, pendingId) {
  const id = sanitizeText_(pendingId, 80);

  if (!id) {
    return null;
  }

  return getPendingInvoiceRowForUser_(user, id, true);
}

/*
 * The KHQR backend is retained for later use.
 * The current checkout interface does not call these functions.
 */
function createBankPaymentIntent(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  const validated = validateCart_(payload);
  const settings = getPublicSettings_();

  const currency = String(
    (payload && payload.bankCurrency) ||
    settings.khqr.currency ||
    'USD'
  ).toUpperCase() === 'KHR'
    ? 'KHR'
    : 'USD';

  const amount = currency === 'KHR'
    ? validated.totalKHR
    : validated.totalUSD;

  if (
    !settings.khqr.accountId ||
    !settings.khqr.merchantName
  ) {
    throw new Error(
      'KHQR account and merchant name are not configured in Settings.'
    );
  }

  return withScriptLock_(function() {
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const invoiceNo = pending
      ? String(pending.InvoiceNo)
      : generateInvoiceNo_();

    const intentId = uuid_('PAY');
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() +
      settings.qrExpiryMinutes * 60 * 1000
    );

    appendObject_(POS.SHEETS.PAYMENT_INTENTS, {
      IntentID: intentId,
      InvoiceNo: invoiceNo,
      UserID: user.UserID,
      CustomerID: validated.customerId,
      CartJSON: JSON.stringify({
        items: validated.items.map(function(item) {
          return {
            productId: item.productId,
            qty: item.qty
          };
        }),
        notes: validated.notes,
        manualDiscountType:
          validated.manualDiscountType,
        manualDiscountValue:
          validated.manualDiscountValue,
        manualDiscountPercent:
          validated.manualDiscountPercent,
        couponCode: validated.couponCode,
        pendingId: pending
          ? String(pending.PendingID)
          : ''
      }),
      SubtotalUSD: validated.subtotalUSD,
      DiscountUSD: validated.discountUSD,
      TaxUSD: validated.taxUSD,
      TotalUSD: validated.totalUSD,
      TotalKHR: validated.totalKHR,
      ExchangeRate: validated.exchangeRate,
      Currency: currency,
      Amount: amount,
      Status: POS.PAYMENT_STATUS.PENDING,
      KHQRMD5: '',
      QRText: '',
      BankHash: '',
      CreatedAt: createdAt,
      ExpiresAt: expiresAt,
      SaleID: ''
    });

    audit_(
      user.UserID,
      'CREATE_PAYMENT_INTENT',
      'PaymentIntent',
      intentId,
      {
        invoiceNo: invoiceNo,
        amount: amount,
        currency: currency
      }
    );

    return {
      success: true,
      intentId: intentId,
      invoiceNo: invoiceNo,
      currency: currency,
      amount: amount,
      expiresAt: expiresAt.toISOString(),
      khqr: settings.khqr,
      bankAutoVerify: settings.bankAutoVerify,
      bankManualConfirm:
        settings.bankManualConfirm ||
        [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
          .indexOf(user.Role) >= 0
    };
  });
}

function attachKhqrToIntent(
  sessionToken,
  intentId,
  md5,
  qrText
) {
  const user = requireSession_(sessionToken);

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (
    !intent ||
    String(intent.UserID) !== String(user.UserID)
  ) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.Status) !== POS.PAYMENT_STATUS.PENDING
  ) {
    throw new Error('Payment intent is not pending.');
  }

  updateRowObject_(
    POS.SHEETS.PAYMENT_INTENTS,
    intent._row,
    {
      KHQRMD5: sanitizeText_(md5, 100),
      QRText: String(qrText || '').slice(0, 2000)
    }
  );

  return {success: true};
}

function checkBankPayment(sessionToken, intentId) {
  const user = requireSession_(sessionToken);

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (!intent) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.UserID) !== String(user.UserID) &&
    [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(user.Role) < 0
  ) {
    throw new Error(
      'You do not have access to this payment intent.'
    );
  }

  if (
    String(intent.Status) === POS.PAYMENT_STATUS.PAID &&
    intent.SaleID
  ) {
    return getSaleReceipt_(intent.SaleID);
  }

  if (
    new Date(intent.ExpiresAt).getTime() < Date.now()
  ) {
    updateRowObject_(
      POS.SHEETS.PAYMENT_INTENTS,
      intent._row,
      {Status: POS.PAYMENT_STATUS.EXPIRED}
    );

    return {
      paid: false,
      status: POS.PAYMENT_STATUS.EXPIRED,
      message: 'QR expired.'
    };
  }

  const token = PropertiesService
    .getScriptProperties()
    .getProperty('BAKONG_API_TOKEN');

  if (!token) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message: 'Automatic verification is not configured.'
    };
  }

  if (!intent.KHQRMD5) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message: 'KHQR is still being prepared.'
    };
  }

  const baseUrl = PropertiesService
    .getScriptProperties()
    .getProperty('BAKONG_API_BASE_URL') ||
    'https://api-bakong.nbc.gov.kh';

  const response = UrlFetchApp.fetch(
    baseUrl.replace(/\/$/, '') +
    '/v1/check_transaction_by_md5',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token
      },
      payload: JSON.stringify({
        md5: String(intent.KHQRMD5)
      }),
      muteHttpExceptions: true
    }
  );

  const body = safeJsonParse_(
    response.getContentText(),
    {}
  );

  if (
    body.responseCode !== 0 ||
    !body.data
  ) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message:
        body.responseMessage ||
        'Payment not found yet.'
    };
  }

  const paidCurrency = String(
    body.data.currency || ''
  ).toUpperCase();

  const paidAmount = number_(body.data.amount);
  const expectedCurrency = String(
    intent.Currency
  ).toUpperCase();

  const expectedAmount = number_(intent.Amount);
  const tolerance = expectedCurrency === 'KHR'
    ? 0.5
    : 0.005;

  if (
    paidCurrency !== expectedCurrency ||
    Math.abs(paidAmount - expectedAmount) > tolerance
  ) {
    audit_(
      user.UserID,
      'BANK_PAYMENT_MISMATCH',
      'PaymentIntent',
      intent.IntentID,
      {
        expectedCurrency: expectedCurrency,
        expectedAmount: expectedAmount,
        paidCurrency: paidCurrency,
        paidAmount: paidAmount
      }
    );

    throw new Error(
      'Bank payment amount or currency does not match this invoice.'
    );
  }

  return finalizeBankIntent_(
    user,
    intent,
    String(body.data.hash || ''),
    'BAKONG_AUTO'
  );
}

function manualConfirmBankPayment(
  sessionToken,
  intentId,
  reference
) {
  const user = requireSession_(sessionToken);
  const settings = getPublicSettings_();

  if (!settings.bankManualConfirm) {
    requireRole_(
      user,
      [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
    );
  }

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (!intent) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.Status) !== POS.PAYMENT_STATUS.PENDING
  ) {
    throw new Error('Payment intent is not pending.');
  }

  return finalizeBankIntent_(
    user,
    intent,
    sanitizeText_(reference, 120),
    'BANK_MANUAL'
  );
}

function finalizeBankIntent_(
  user,
  intent,
  bankHash,
  source
) {
  let sale;

  sale = withScriptLock_(function() {
    const latestIntent = findRowBy_(
      POS.SHEETS.PAYMENT_INTENTS,
      'IntentID',
      intent.IntentID
    );

    if (
      String(latestIntent.Status) === POS.PAYMENT_STATUS.PAID &&
      latestIntent.SaleID
    ) {
      return getSaleReceipt_(latestIntent.SaleID);
    }

    const cart = safeJsonParse_(
      latestIntent.CartJSON,
      {}
    );

    const validated = validateCart_({
      items: cart.items,
      customerId: latestIntent.CustomerID,
      notes: cart.notes,
      manualDiscountType:
        cart.manualDiscountType,
      manualDiscountValue:
        cart.manualDiscountValue,
      manualDiscountPercent:
        cart.manualDiscountPercent,
      couponCode: cart.couponCode,
      discountUSD: latestIntent.DiscountUSD,
      exchangeRate: latestIntent.ExchangeRate
    });

    const payment = {
      method: 'BANK',
      currency: String(latestIntent.Currency),
      amount: number_(latestIntent.Amount),
      reference: bankHash,
      khqrMd5: String(
        latestIntent.KHQRMD5 || ''
      ),
      bankHash: bankHash,
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      String(latestIntent.InvoiceNo)
    );

    updateRowObject_(
      POS.SHEETS.PAYMENT_INTENTS,
      latestIntent._row,
      {
        Status: POS.PAYMENT_STATUS.PAID,
        BankHash: bankHash,
        SaleID: receipt.saleId
      }
    );

    if (cart.pendingId) {
      markPendingCompletedLocked_(
        cart.pendingId,
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    audit_(
      user.UserID,
      'CONFIRM_BANK_PAYMENT',
      'PaymentIntent',
      latestIntent.IntentID,
      {
        source: source,
        bankHash: bankHash,
        saleId: receipt.saleId
      }
    );

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

function createCompletedSale_(
  user,
  validated,
  payment,
  invoiceNo
) {
  return withScriptLock_(function() {
    return createCompletedSaleLocked_(
      user,
      validateCart_({
        items: validated.items.map(function(item) {
          return {
            productId: item.productId,
            qty: item.qty
          };
        }),
        customerId: validated.customerId,
        notes: validated.notes,
        manualDiscountType:
          validated.manualDiscountType,
        manualDiscountValue:
          validated.manualDiscountValue,
        manualDiscountPercent:
          validated.manualDiscountPercent,
        couponCode: validated.couponCode,
        discountUSD: validated.discountUSD,
        exchangeRate: validated.exchangeRate,
        branchId: validated.branchId
      }),
      payment,
      invoiceNo
    );
  });
}

function createCompletedSaleLocked_(user, validated, payment, invoiceNo, saleOptions) {
  saleOptions = saleOptions || {};
  const payments = (Array.isArray(payment) ? payment : [payment]).filter(function(p){return p && number_(p.amount)>0;});
  const saleId=uuid_('SAL'), finalInvoiceNo=invoiceNo||generateInvoiceNo_(), now=new Date(), shift=getOpenShiftForUser_(user.UserID);
  const branchId=resolveAccessibleBranchId_(user, validated.branchId, false);
  let amountPaidUSD=0;
  payments.forEach(function(p){amountPaidUSD += p.amountUSD!==undefined?number_(p.amountUSD):(String(p.currency||'USD').toUpperCase()==='KHR'?number_(p.amount)/validated.exchangeRate:number_(p.amount));});
  amountPaidUSD=Math.min(validated.totalUSD,roundMoney_(amountPaidUSD));
  const creditAmountUSD=saleOptions.creditAmountUSD!==undefined?roundMoney_(number_(saleOptions.creditAmountUSD)):roundMoney_(Math.max(0,validated.totalUSD-amountPaidUSD));
  if(creditAmountUSD < -0.005 || amountPaidUSD+creditAmountUSD > validated.totalUSD+0.01)throw new Error('Payment and credit amounts do not match the invoice total.');
  const dueDate=saleOptions.dueDate?new Date(saleOptions.dueDate):'',paymentTermsDays=Math.max(0,Math.round(number_(saleOptions.paymentTermsDays,validated.customerPaymentTermsDays)));
  const paymentMethod=creditAmountUSD>0?(payments.length?String(payments[0].method||'CASH').toUpperCase()+'+CREDIT':'CREDIT'):(payments.length?String(payments[0].method||'CASH').toUpperCase():'CASH');
  const paymentStatus=creditAmountUSD>0?(amountPaidUSD>0?POS.PAYMENT_STATUS.PARTIAL:POS.PAYMENT_STATUS.UNPAID):POS.PAYMENT_STATUS.PAID;
  const productStates=validated.items.map(function(item){const product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',item.productId);if(!product||!bool_(product.Active))throw new Error(item.productName+' is no longer available for sale.');const current=getBranchStockQty_(branchId,item.productId);if(current+0.0005<item.qty)throw new Error(item.productName+' has insufficient stock at this branch. Available: '+current+', required: '+item.qty);return {item:item,product:product,balance:Math.max(0,Math.round((current-item.qty)*1000)/1000)};});
  const fifoPlan=planFifoAllocationsLocked_(validated.items,branchId);
  appendObject_(POS.SHEETS.SALES,{SaleID:saleId,InvoiceNo:finalInvoiceNo,PendingNo:sanitizeText_(saleOptions.pendingNo,80),BranchID:branchId,DateTime:now,CustomerID:validated.customerId,CustomerName:validated.customerName,CustomerType:validated.customerType,SubtotalUSD:validated.subtotalUSD,DiscountUSD:validated.discountUSD,TaxUSD:validated.taxUSD,TotalUSD:validated.totalUSD,TotalKHR:validated.totalKHR,ExchangeRate:validated.exchangeRate,PaymentMethod:paymentMethod,PaymentStatus:paymentStatus,AmountPaidUSD:amountPaidUSD,CreditAmountUSD:creditAmountUSD,DueDate:dueDate||'',PaymentTermsDays:paymentTermsDays,CreditStatus:creditAmountUSD>0?'OPEN':'PAID',Status:POS.SALE_STATUS.COMPLETED,CashierID:user.UserID,CashierName:user.Name,ShiftID:shift?shift.ShiftID:'',Notes:validated.notes,CreatedAt:now,ManualDiscountType:validated.manualDiscountType,ManualDiscountValue:validated.manualDiscountValue,ManualDiscountPercent:validated.manualDiscountPercent,ManualDiscountUSD:validated.manualDiscountUSD,CouponCode:validated.couponCode,CouponDiscountUSD:validated.couponDiscountUSD});
  const saleItems=[],movements=[],refs=[];
  productStates.forEach(function(state,index){const item=state.item,costPlan=fifoPlan.itemPlans[index],saleItemId=uuid_('ITM'),share=validated.subtotalUSD>0?item.lineTotalUSD/validated.subtotalUSD:0,allocated=roundMoney_(validated.discountUSD*share),net=roundMoney_(item.lineTotalUSD-allocated),cost=roundMoney_(costPlan.totalCostUSD);saleItems.push({SaleItemID:saleItemId,SaleID:saleId,ProductID:item.productId,Barcode:item.barcode,ProductName:item.productName,Qty:item.qty,UnitID:item.unitId,UnitName:item.unitName,UnitCostUSD:costPlan.averageUnitCostUSD,UnitPriceUSD:item.unitPriceUSD,DiscountUSD:item.discountUSD,LineTotalUSD:item.lineTotalUSD,AllocatedSaleDiscountUSD:allocated,NetRevenueUSD:net,CostTotalUSD:cost,GrossProfitUSD:roundMoney_(net-cost)});movements.push({MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:item.productId,Type:'SALE',QtyIn:0,QtyOut:item.qty,BalanceAfter:state.balance,ReferenceType:'SALE',ReferenceID:saleId,UserID:user.UserID,Note:finalInvoiceNo,UnitCostUSD:costPlan.averageUnitCostUSD,CostInUSD:0,CostOutUSD:cost});refs.push({branchId:branchId,referenceType:'SALE',referenceId:saleItemId,userId:user.UserID,note:finalInvoiceNo+' / '+saleId});});
  applyFifoPlanLocked_(fifoPlan,refs);productStates.forEach(function(state){const summary=getFifoStockSummary_(state.item.productId,branchId);setBranchStockLocked_(branchId,state.item.productId,state.balance,summary.totalQty>0?summary.averageCostUSD:number_(state.product.CostUSD));});appendObjects_(POS.SHEETS.SALE_ITEMS,saleItems);appendObjects_(POS.SHEETS.STOCK,movements);
  payments.forEach(function(p){appendObject_(POS.SHEETS.PAYMENTS,{PaymentID:uuid_('PMT'),SaleID:saleId,Method:String(p.method||'CASH').toUpperCase(),Currency:String(p.currency||'USD').toUpperCase(),Amount:number_(p.amount),Reference:p.reference||'',KHQRMD5:p.khqrMd5||'',BankHash:p.bankHash||'',Status:p.status||POS.PAYMENT_STATUS.PAID,ReceivedBy:user.UserID,CreatedAt:now});});
  let receivableId='';if(creditAmountUSD>0){if(!validated.customerId)throw new Error('A customer is required for a credit sale.');receivableId=createReceivableLocked_({customerId:validated.customerId,saleId:saleId,invoiceNo:finalInvoiceNo,invoiceDate:now,dueDate:dueDate||new Date(now.getFullYear(),now.getMonth(),now.getDate()+paymentTermsDays),amountUSD:creditAmountUSD})||'';}
  incrementCouponUsageLocked_(validated.couponCode);
  audit_(user.UserID,'COMPLETE_SALE','Sale',saleId,{invoiceNo:finalInvoiceNo,pendingNo:saleOptions.pendingNo||'',branchId:branchId,totalUSD:validated.totalUSD,amountPaidUSD:amountPaidUSD,creditAmountUSD:creditAmountUSD,paymentMethod:paymentMethod,receivableId:receivableId,fifoCostUSD:roundMoney_(fifoPlan.itemPlans.reduce(function(sum,p){return sum+p.totalCostUSD;},0))});
  return buildReceipt_(saleId,finalInvoiceNo,now,user,validated,payments,{paymentMethod:paymentMethod,paymentStatus:paymentStatus,amountPaidUSD:amountPaidUSD,creditAmountUSD:creditAmountUSD,dueDate:dueDate?dueDate.toISOString():'',paymentTermsDays:paymentTermsDays,receivableId:receivableId,pendingNo:saleOptions.pendingNo||'',branchId:branchId});
}

function generateInvoiceNo_() {
  const key = dateKey_(new Date());
  const props = PropertiesService.getScriptProperties();
  const counterKey = 'INVOICE_COUNTER_' + key;

  const next =
    number_(props.getProperty(counterKey), 0) + 1;

  props.setProperty(counterKey, String(next));

  return 'INV-' +
    key +
    '-' +
    String(next).padStart(4, '0');
}

function buildReceipt_(
  saleId,
  invoiceNo,
  dateTime,
  user,
  validated,
  payments,
  creditInfo
) {
  const settings = getPublicSettings_();
  payments = Array.isArray(payments) ? payments : (payments ? [payments] : []);
  creditInfo = creditInfo || {};
  const firstPayment = payments[0] || {};

  return {
    isPending: false,
    paid: number_(creditInfo.creditAmountUSD) <= 0,
    status: creditInfo.paymentStatus || POS.PAYMENT_STATUS.PAID,
    saleId: saleId,
    invoiceNo: invoiceNo,
    dateTime: dateTime.toISOString(),
    cashierName: String(user.Name),
    customerId: validated.customerId,
    customerName: validated.customerName || 'Walk-in customer',
    customerType: validated.customerType || 'WALK-IN',
    items: validated.items.map(function(item) {
      return {
        productId: item.productId,
        name: item.productName,
        qty: item.qty,
        unitId: item.unitId || '',
        unitName: item.unitName || '',
        unitPriceUSD: item.unitPriceUSD,
        lineTotalUSD: item.lineTotalUSD
      };
    }),
    subtotalUSD: validated.subtotalUSD,
    manualDiscountType: validated.manualDiscountType,
    manualDiscountValue: validated.manualDiscountValue,
    manualDiscountPercent: validated.manualDiscountPercent,
    manualDiscountUSD: validated.manualDiscountUSD,
    couponCode: validated.couponCode,
    couponDiscountUSD: validated.couponDiscountUSD,
    discountUSD: validated.discountUSD,
    taxUSD: validated.taxUSD,
    totalUSD: validated.totalUSD,
    totalKHR: validated.totalKHR,
    exchangeRate: validated.exchangeRate,
    paymentMethod: creditInfo.paymentMethod || firstPayment.method || 'CASH',
    paymentStatus: creditInfo.paymentStatus || POS.PAYMENT_STATUS.PAID,
    payments: payments.map(function(p) {
      return {
        method:String(p.method||''),
        currency:String(p.currency||'USD'),
        amount:number_(p.amount),
        reference:String(p.reference||'')
      };
    }),
    paymentCurrency: firstPayment.currency || 'USD',
    paymentAmount: number_(firstPayment.amount),
    reference: firstPayment.reference || '',
    amountPaidUSD: roundMoney_(number_(creditInfo.amountPaidUSD, validated.totalUSD)),
    creditAmountUSD: roundMoney_(number_(creditInfo.creditAmountUSD)),
    dueDate: creditInfo.dueDate || '',
    paymentTermsDays: number_(creditInfo.paymentTermsDays),
    receivableId: creditInfo.receivableId || '',
    notes: validated.notes,
    shop: settings
  };
}

function getSaleReceipt_(saleId) {
  const sale = findRowBy_(POS.SHEETS.SALES, 'SaleID', saleId);
  if (!sale) throw new Error('Sale not found.');

  const items = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) { return String(row.SaleID) === String(saleId); });

  const payments = getRows_(POS.SHEETS.PAYMENTS)
    .filter(function(row) { return String(row.SaleID) === String(saleId); })
    .map(function(row) {
      return {
        method:String(row.Method||''),
        currency:String(row.Currency||'USD'),
        amount:number_(row.Amount),
        reference:String(row.Reference||''),
        status:String(row.Status||'')
      };
    });

  const user = findRowBy_(POS.SHEETS.USERS, 'UserID', sale.CashierID) || {Name:sale.CashierName};
  const customer = sale.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',sale.CustomerID)
    : null;

  return buildReceipt_(
    sale.SaleID,
    sale.InvoiceNo,
    new Date(sale.DateTime),
    user,
    {
      customerId: sale.CustomerID,
      customerName: String(sale.CustomerName || (customer ? customer.Name : '') || 'Walk-in customer'),
      customerType: String(sale.CustomerType || (customer ? customer.CustomerType : '') || 'WALK-IN'),
      items: items.map(function(row) {
        return {
          productId: row.ProductID,
          productName: row.ProductName,
          qty: number_(row.Qty),
          unitId:String(row.UnitID||''),
          unitName:String(row.UnitName||''),
          unitPriceUSD: number_(row.UnitPriceUSD),
          lineTotalUSD: number_(row.LineTotalUSD)
        };
      }),
      subtotalUSD: number_(sale.SubtotalUSD),
      manualDiscountType: storedManualDiscountType_(sale),
      manualDiscountValue: storedManualDiscountValue_(sale),
      manualDiscountPercent: number_(sale.ManualDiscountPercent),
      manualDiscountUSD: number_(sale.ManualDiscountUSD),
      couponCode: String(sale.CouponCode || ''),
      couponDiscountUSD: number_(sale.CouponDiscountUSD),
      discountUSD: number_(sale.DiscountUSD),
      taxUSD: number_(sale.TaxUSD),
      totalUSD: number_(sale.TotalUSD),
      totalKHR: number_(sale.TotalKHR),
      exchangeRate: number_(sale.ExchangeRate),
      notes: String(sale.Notes || '')
    },
    payments,
    {
      paymentMethod:String(sale.PaymentMethod||''),
      paymentStatus:String(sale.PaymentStatus||''),
      amountPaidUSD:number_(sale.AmountPaidUSD, number_(sale.TotalUSD)),
      creditAmountUSD:number_(sale.CreditAmountUSD),
      dueDate:reportDate_(sale.DueDate) ? reportDate_(sale.DueDate).toISOString() : '',
      paymentTermsDays:number_(sale.PaymentTermsDays),
      receivableId:(findRowBy_(POS.SHEETS.RECEIVABLES,'SaleID',saleId)||{}).ReceivableID || ''
    }
  );
}

/**
 * Reads the discount mode from current or older stored rows.
 * Older fixed-discount sales did not have ManualDiscountType/Value columns.
 */
function storedManualDiscountType_(row) {
  row = row || {};

  const explicit = String(
    row.ManualDiscountType || ''
  ).trim().toUpperCase();

  if (explicit === 'FIXED' || explicit === 'PERCENT') {
    return explicit;
  }

  const percentCell = row.ManualDiscountPercent;
  const hasPercent =
    percentCell !== '' &&
    percentCell !== undefined &&
    percentCell !== null;

  if (!hasPercent && number_(row.ManualDiscountUSD) > 0) {
    return 'FIXED';
  }

  return 'PERCENT';
}

function storedManualDiscountValue_(row) {
  row = row || {};

  const explicitValue = row.ManualDiscountValue;

  if (
    explicitValue !== '' &&
    explicitValue !== undefined &&
    explicitValue !== null
  ) {
    return number_(explicitValue);
  }

  return storedManualDiscountType_(row) === 'FIXED'
    ? number_(row.ManualDiscountUSD)
    : number_(row.ManualDiscountPercent);
}


/* ==========================================================================
 * SOURCE: SalesList.gs
 * ========================================================================== */
/** Tiny POS v3.6 searchable sale list. */
function getSalesList(sessionToken, filters) {
  const user=requireSession_(sessionToken);requirePermission_(user,'SALES_LIST');filters=filters||{};
  const range=reportRange_(filters.from,filters.to),query=sanitizeText_(filters.query,160).toLowerCase(),method=sanitizeText_(filters.method,30).toUpperCase(),status=sanitizeText_(filters.status,40).toUpperCase(),branchId=sanitizeText_(filters.branchId,80);
  const payments=getRows_(POS.SHEETS.PAYMENTS),paidBySale={};
  payments.forEach(function(payment){const id=String(payment.SaleID),currency=String(payment.Currency||'USD').toUpperCase(),sale=findRowBy_(POS.SHEETS.SALES,'SaleID',id),rate=sale?number_(sale.ExchangeRate,4100):4100;const usd=currency==='KHR'?number_(payment.Amount)/rate:number_(payment.Amount);paidBySale[id]=roundMoney_(number_(paidBySale[id])+usd);});
  const rows=getRows_(POS.SHEETS.SALES).filter(function(sale){const d=reportDate_(sale.DateTime||sale.CreatedAt);if(!d||d<range.from||d>range.to)return false;if(method&&String(sale.PaymentMethod||'').toUpperCase().indexOf(method)<0)return false;if(status&&String(sale.Status||'').toUpperCase()!==status)return false;if(branchId&&String(sale.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)!==branchId)return false;const hay=[sale.InvoiceNo,sale.CustomerName,sale.CustomerType,sale.CashierName,sale.PaymentMethod,sale.PaymentStatus,sale.Status].join(' ').toLowerCase();return !query||hay.indexOf(query)>=0;}).sort(function(a,b){return new Date(b.DateTime||b.CreatedAt)-new Date(a.DateTime||a.CreatedAt);}).slice(0,1000).map(function(sale){const paid=paidBySale[String(sale.SaleID)]!==undefined?paidBySale[String(sale.SaleID)]:number_(sale.AmountPaidUSD);return {saleId:String(sale.SaleID),invoiceNo:String(sale.InvoiceNo),dateTime:new Date(sale.DateTime||sale.CreatedAt).toISOString(),customerName:String(sale.CustomerName||'Walk-in customer'),customerType:String(sale.CustomerType||'WALK-IN'),amountUSD:number_(sale.TotalUSD),paidUSD:roundMoney_(paid),creditUSD:number_(sale.CreditAmountUSD),method:String(sale.PaymentMethod||''),paymentStatus:String(sale.PaymentStatus||''),status:String(sale.Status||''),cashierName:String(sale.CashierName||''),branchId:String(sale.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID),pendingNo:String(sale.PendingNo||'')};});
  return {rows:rows,metrics:{sales:rows.length,totalUSD:roundMoney_(rows.reduce(function(s,r){return s+r.amountUSD;},0)),paidUSD:roundMoney_(rows.reduce(function(s,r){return s+r.paidUSD;},0)),creditUSD:roundMoney_(rows.reduce(function(s,r){return s+r.creditUSD;},0))},branches:listBranchesForUserManagement_(user)};
}


/* ==========================================================================
 * SOURCE: Settings.gs
 * ========================================================================== */
function getPublicSettings_() {
  const s = getSettings_();
  return {
    version: POS.VERSION,
    shopNameEN: String(s.SHOP_NAME_EN || ''),
    shopNameKH: String(s.SHOP_NAME_KH || ''),
    shopPhone: String(s.SHOP_PHONE || ''),
    shopAddressEN: String(s.SHOP_ADDRESS_EN || ''),
    shopAddressKH: String(s.SHOP_ADDRESS_KH || ''),
    defaultLanguage: String(s.DEFAULT_LANGUAGE || 'en'),
    defaultTheme: String(s.DEFAULT_THEME || 'auto'),
    themeColor: String(s.THEME_COLOR || 'DEFAULT').toUpperCase(),
    exchangeRate: number_(s.EXCHANGE_RATE, 4100),
    taxRate: number_(s.TAX_RATE, 0),
    receiptFooterEN: String(s.RECEIPT_FOOTER_EN || ''),
    receiptFooterKH: String(s.RECEIPT_FOOTER_KH || ''),
    bankAutoVerify: bool_(s.BANK_AUTO_VERIFY) && !!PropertiesService.getScriptProperties().getProperty('BAKONG_API_TOKEN'),
    bankManualConfirm: bool_(s.BANK_MANUAL_CONFIRM),
    qrExpiryMinutes: Math.min(10, Math.max(1, number_(s.QR_EXPIRY_MINUTES, 5))),
    khqr: {
      type: String(s.KHQR_TYPE || 'INDIVIDUAL'),
      accountId: String(s.BAKONG_ACCOUNT_ID || ''),
      merchantName: String(s.KHQR_MERCHANT_NAME || ''),
      merchantCity: String(s.KHQR_MERCHANT_CITY || 'PHNOM PENH'),
      merchantId: String(s.KHQR_MERCHANT_ID || ''),
      acquiringBank: String(s.KHQR_ACQUIRING_BANK || ''),
      currency: String(s.KHQR_CURRENCY || 'USD'),
      mobileNumber: String(s.KHQR_MOBILE_NUMBER || ''),
      storeLabel: String(s.KHQR_STORE_LABEL || ''),
      terminalLabel: String(s.KHQR_TERMINAL_LABEL || 'POS-1'),
      merchantCategoryCode: String(s.KHQR_MCC || '5999')
    }
  };
}

function saveSettings(sessionToken, changes) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  changes = changes || {};
  const allowed = [
    'SHOP_NAME_EN', 'SHOP_NAME_KH', 'SHOP_PHONE', 'SHOP_ADDRESS_EN', 'SHOP_ADDRESS_KH',
    'DEFAULT_LANGUAGE', 'DEFAULT_THEME', 'THEME_COLOR', 'EXCHANGE_RATE', 'TAX_RATE',
    'RECEIPT_FOOTER_EN', 'RECEIPT_FOOTER_KH', 'KHQR_TYPE', 'BAKONG_ACCOUNT_ID',
    'KHQR_MERCHANT_NAME', 'KHQR_MERCHANT_CITY', 'KHQR_MERCHANT_ID',
    'KHQR_ACQUIRING_BANK', 'KHQR_CURRENCY', 'KHQR_MOBILE_NUMBER',
    'KHQR_STORE_LABEL', 'KHQR_TERMINAL_LABEL', 'KHQR_MCC', 'QR_EXPIRY_MINUTES',
    'BANK_AUTO_VERIFY', 'BANK_MANUAL_CONFIRM'
  ];
  Object.keys(changes).forEach(function(key) {
    if (allowed.indexOf(key) >= 0) setSetting_(key, changes[key], 'STRING');
  });
  audit_(user.UserID, 'UPDATE_SETTINGS', 'Settings', '', changes);
  return getPublicSettings_();
}


function saveMyPreferences(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload = payload || {};
  const language = payload.language === 'km' ? 'km' : 'en';
  const theme = ['light','dark','auto'].indexOf(String(payload.theme||'')) >= 0 ? String(payload.theme) : 'auto';
  const color = ['DEFAULT','BLUE','TEAL','GREEN','PURPLE','ORANGE','ROSE'].indexOf(String(payload.themeColor||'DEFAULT').toUpperCase()) >= 0 ? String(payload.themeColor||'DEFAULT').toUpperCase() : 'DEFAULT';
  const row = findRowBy_(POS.SHEETS.USERS,'UserID',user.UserID);
  updateRowObject_(POS.SHEETS.USERS,row._row,{Language:language,Theme:theme,ThemeColor:color,UpdatedAt:new Date()});
  audit_(user.UserID,'UPDATE_MY_PREFERENCES','User',user.UserID,{language:language,theme:theme,themeColor:color});
  return publicUser_(findRowBy_(POS.SHEETS.USERS,'UserID',user.UserID));
}


/* ==========================================================================
 * SOURCE: StockCounts.gs
 * ========================================================================== */
/**
 * Tiny POS Physical Stock Count / Cycle Count.
 * Supports draft counting, barcode-driven input, manager review, and FIFO-safe reconciliation.
 */
const STOCK_COUNT_FEATURE = Object.freeze({
  VERSION: '1.0.0',
  STATUS: Object.freeze({
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPLIED: 'APPLIED',
    CANCELLED: 'CANCELLED'
  }),
  TYPES: Object.freeze({
    FULL: 'FULL',
    CYCLE: 'CYCLE'
  }),
  REASONS: Object.freeze([
    'COUNT_VARIANCE',
    'MISSING',
    'DAMAGED',
    'EXPIRED',
    'OVERSTOCK',
    'COUNTING_ERROR',
    'OTHER'
  ])
});

function stockCountViewRoles_() { return [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK, POS.ROLES.ACCOUNTANT, POS.ROLES.CASHIER]; }

function stockCountEditRoles_() {
  return [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK];
}

function stockCountApproveRoles_() {
  return [POS.ROLES.ADMIN, POS.ROLES.MANAGER];
}

function stockCountDateIso_(value) {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toISOString();
}

function stockCountParseFilterDate_(value, endOfDay) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some(function(n) { return !Number.isFinite(n); })) return null;
  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
}

function stockCountThresholds_() {
  const settings = getSettings_();
  return {
    quantity: Math.max(0, number_(settings.STOCK_COUNT_RECOUNT_QTY, 5)),
    percent: Math.max(0, number_(settings.STOCK_COUNT_RECOUNT_PERCENT, 10))
  };
}

function stockCountNeedsRecount_(variance, systemQty) {
  const thresholds = stockCountThresholds_();
  const absolute = Math.abs(number_(variance));
  const base = Math.abs(number_(systemQty));
  const percent = base > 0.000001 ? (absolute / base) * 100 : 0;
  return (
    (thresholds.quantity > 0 && absolute >= thresholds.quantity) ||
    (thresholds.percent > 0 && base > 0.000001 && percent >= thresholds.percent)
  );
}

function nextStockCountNumberLocked_() {
  const prefix = 'SC-' + dateKey_(new Date()) + '-';
  const max = getRows_(POS.SHEETS.STOCK_COUNTS).reduce(function(value, row) {
    const countNo = String(row.CountNo || '');
    if (countNo.indexOf(prefix) !== 0) return value;
    const suffix = Number(countNo.slice(prefix.length));
    return Number.isFinite(suffix) ? Math.max(value, suffix) : value;
  }, 0);
  return prefix + String(max + 1).padStart(4, '0');
}

function stockCountCategoryMap_() {
  const map = {};
  getRows_(POS.SHEETS.CATEGORIES).forEach(function(row) {
    map[String(row.CategoryID)] = {
      nameEN: String(row.NameEN || ''),
      nameKH: String(row.NameKH || '')
    };
  });
  return map;
}

function stockCountUserMap_() {
  const map = {};
  getRows_(POS.SHEETS.USERS).forEach(function(row) {
    map[String(row.UserID)] = String(row.Name || row.LoginID || row.UserID || '');
  });
  return map;
}

function stockCountHeaderPublic_(row, userMap) {
  userMap = userMap || stockCountUserMap_();
  return {
    countId: String(row.CountID || ''),
    countNo: String(row.CountNo || ''),
    countType: String(row.CountType || STOCK_COUNT_FEATURE.TYPES.CYCLE),
    categoryId: String(row.CategoryID || ''),
    categoryName: String(row.CategoryName || 'All products'),
    branchId: String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID),
    status: String(row.Status || STOCK_COUNT_FEATURE.STATUS.DRAFT),
    startedAt: stockCountDateIso_(row.StartedAt),
    startedById: String(row.StartedByID || ''),
    startedByName: String(row.StartedByName || userMap[String(row.StartedByID)] || ''),
    submittedAt: stockCountDateIso_(row.SubmittedAt),
    approvedAt: stockCountDateIso_(row.ApprovedAt),
    appliedAt: stockCountDateIso_(row.AppliedAt),
    notes: String(row.Notes || ''),
    totalItems: number_(row.TotalItems),
    countedItems: number_(row.CountedItems),
    varianceItems: number_(row.VarianceItems),
    varianceQty: number_(row.VarianceQty),
    varianceValueUSD: number_(row.VarianceValueUSD),
    createdAt: stockCountDateIso_(row.CreatedAt),
    updatedAt: stockCountDateIso_(row.UpdatedAt)
  };
}

function stockCountItemPublic_(row, productMap, unitMap) {
  productMap=productMap||{};unitMap=unitMap||{};const product=productMap[String(row.ProductID)]||{},unit=unitMap[String(row.UnitID||product.UnitID||'')]||{},branchId=String(row.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID),current=getBranchStockQty_(branchId,row.ProductID),counted=bool_(row.Counted),physical=counted?number_(row.PhysicalQty):null,variance=counted?Math.round((physical-current)*1000)/1000:0,snapshot=number_(row.SnapshotQty),unitCost=number_(row.UnitCostUSD||product.CostUSD);
  return {countItemId:String(row.CountItemID||''),countId:String(row.CountID||''),branchId:branchId,productId:String(row.ProductID||''),barcode:String(row.Barcode||product.Barcode||''),sku:String(row.SKU||product.SKU||''),productName:String(row.ProductName||product.NameEN||product.NameKH||''),categoryId:String(row.CategoryID||product.CategoryID||''),unitId:String(row.UnitID||product.UnitID||''),unitName:String(row.UnitName||unit.NameEN||unit.Abbreviation||''),allowDecimal:unit.AllowDecimal===true||bool_(unit.AllowDecimal),snapshotQty:snapshot,currentSystemQty:current,movementDuringCount:Math.round((current-snapshot)*1000)/1000,counted:counted,physicalQty:physical,varianceQty:variance,unitCostUSD:unitCost,varianceValueUSD:counted?roundMoney_(variance*unitCost):0,reason:String(row.Reason||'COUNT_VARIANCE'),note:String(row.Note||''),needsRecount:counted?stockCountNeedsRecount_(variance,current):false,countedAt:stockCountDateIso_(row.CountedAt),countedById:String(row.CountedByID||''),appliedAdjustmentId:String(row.AppliedAdjustmentID||'')};
}

function summarizeStockCountItems_(items) {
  let countedItems = 0;
  let varianceItems = 0;
  let varianceQty = 0;
  let varianceValueUSD = 0;
  let recountItems = 0;
  items.forEach(function(item) {
    if (!item.counted) return;
    countedItems += 1;
    if (Math.abs(number_(item.varianceQty)) > 0.0005) varianceItems += 1;
    if (item.needsRecount) recountItems += 1;
    varianceQty = Math.round((varianceQty + number_(item.varianceQty)) * 1000) / 1000;
    varianceValueUSD = roundMoney_(varianceValueUSD + number_(item.varianceValueUSD));
  });
  return {
    totalItems: items.length,
    countedItems: countedItems,
    uncountedItems: Math.max(0, items.length - countedItems),
    varianceItems: varianceItems,
    recountItems: recountItems,
    varianceQty: varianceQty,
    varianceValueUSD: varianceValueUSD
  };
}

function getStockCountModuleData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'STOCK_COUNT');
  filters = filters || {};
  const from = stockCountParseFilterDate_(filters.from, false);
  const to = stockCountParseFilterDate_(filters.to, true);
  const status = String(filters.status || '').toUpperCase();
  const type = String(filters.type || '').toUpperCase();
  const query = String(filters.query || '').trim().toLowerCase();
  const branchId = resolveAccessibleBranchId_(user, filters.branchId, true);
  const userMap = stockCountUserMap_();

  const rows = getRows_(POS.SHEETS.STOCK_COUNTS)
    .filter(function(row) {
      const date = row.StartedAt ? new Date(row.StartedAt) : new Date(row.CreatedAt);
      if (from && date < from) return false;
      if (to && date > to) return false;
      if (status && String(row.Status || '').toUpperCase() !== status) return false;
      if (type && String(row.CountType || '').toUpperCase() !== type) return false;
      if (branchId && String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) !== branchId) return false;
      if (query) {
        const haystack = [
          row.CountNo,
          row.CategoryName,
          row.StartedByName,
          row.Notes,
          row.Status
        ].join(' ').toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    })
    .sort(function(a, b) {
      return new Date(b.StartedAt || b.CreatedAt) - new Date(a.StartedAt || a.CreatedAt) || b._row - a._row;
    });

  const counts = rows.map(function(row) { return stockCountHeaderPublic_(row, userMap); });
  return {
    counts: counts,
    metrics: {
      total: counts.length,
      drafts: counts.filter(function(row) { return row.status === STOCK_COUNT_FEATURE.STATUS.DRAFT; }).length,
      submitted: counts.filter(function(row) { return row.status === STOCK_COUNT_FEATURE.STATUS.SUBMITTED; }).length,
      applied: counts.filter(function(row) { return row.status === STOCK_COUNT_FEATURE.STATUS.APPLIED; }).length,
      varianceValueUSD: roundMoney_(counts.reduce(function(sum, row) { return sum + number_(row.varianceValueUSD); }, 0))
    },
    canCreate: stockCountEditRoles_().indexOf(String(user.Role)) >= 0,
    canApprove: stockCountApproveRoles_().indexOf(String(user.Role)) >= 0,
    canSelectAllBranches: canManageAllBranches_(user),
    selectedBranchId: branchId,
    defaultBranchId: getUserBranchId_(user),
    branches: branchRowsForUser_(user,false).map(branchToPublic_)
  };
}

function createStockCount(sessionToken, payload) {
  const user=requireSession_(sessionToken);requirePermission_(user,'STOCK_COUNT');payload=payload||{};
  const requestedIds=Array.isArray(payload.productIds)?payload.productIds.map(String).filter(Boolean):[];
  const countType=requestedIds.length?'ITEMS':String(payload.countType||STOCK_COUNT_FEATURE.TYPES.CYCLE).toUpperCase();
  if(['FULL','CYCLE','ITEMS'].indexOf(countType)<0)throw new Error('Invalid stock-count type.');
  const categoryId=countType==='CYCLE'?sanitizeText_(payload.categoryId,80):'';
  if(countType==='CYCLE'&&!categoryId)throw new Error('Choose a category for a cycle count.');
  const branchId=resolveAccessibleBranchId_(user,payload.branchId,false),includeInactive=payload.includeInactive!==false;
  return withScriptLock_(function(){
    const category=categoryId?findRowBy_(POS.SHEETS.CATEGORIES,'CategoryID',categoryId):null;if(categoryId&&!category)throw new Error('Category not found.');
    const idSet={};requestedIds.forEach(function(id){idSet[id]=true;});
    const unitMap={};getRows_(POS.SHEETS.UNITS).forEach(function(u){unitMap[String(u.UnitID)]=u;});
    const products=getRows_(POS.SHEETS.PRODUCTS).filter(function(p){if(countType==='ITEMS'&&!idSet[String(p.ProductID)])return false;if(countType==='CYCLE'&&String(p.CategoryID)!==categoryId)return false;const qty=getBranchStockQty_(branchId,p.ProductID);return includeInactive?bool_(p.Active)||qty>0.0005:bool_(p.Active);}).sort(function(a,b){return String(a.NameEN||a.NameKH).localeCompare(String(b.NameEN||b.NameKH));});
    if(!products.length)throw new Error('No products were selected for this stock count.');
    const now=new Date(),countId=uuid_('CNT'),countNo=nextStockCountNumberLocked_(),categoryName=countType==='ITEMS'?'Selected items':categoryId?String(category.NameEN||category.NameKH||categoryId):'All products';
    appendObject_(POS.SHEETS.STOCK_COUNTS,{CountID:countId,CountNo:countNo,BranchID:branchId,CountType:countType,CategoryID:categoryId,CategoryName:categoryName,Status:'DRAFT',StartedAt:now,StartedByID:user.UserID,StartedByName:user.Name,Notes:sanitizeText_(payload.notes,500),TotalItems:products.length,CountedItems:0,VarianceItems:0,VarianceQty:0,VarianceValueUSD:0,CreatedAt:now,UpdatedAt:now});
    appendObjects_(POS.SHEETS.STOCK_COUNT_ITEMS,products.map(function(p){const unit=unitMap[String(p.UnitID||'')]||{},qty=getBranchStockQty_(branchId,p.ProductID),fifo=getFifoStockSummary_(p.ProductID,branchId),cost=fifo.totalQty>0?fifo.averageCostUSD:number_(p.CostUSD);return {CountItemID:uuid_('CNI'),CountID:countId,BranchID:branchId,ProductID:p.ProductID,Barcode:String(p.Barcode||''),SKU:String(p.SKU||''),ProductName:String(p.NameEN||p.NameKH||p.ProductID),CategoryID:String(p.CategoryID||''),UnitID:String(p.UnitID||''),UnitName:String(unit.NameEN||unit.Abbreviation||''),SnapshotQty:qty,CurrentSystemQty:qty,Counted:false,PhysicalQty:'',VarianceQty:0,UnitCostUSD:cost,VarianceValueUSD:0,Reason:'COUNT_VARIANCE',Note:'',MovementDuringCount:0,NeedsRecount:false,CreatedAt:now,UpdatedAt:now};}));
    audit_(user.UserID,'CREATE_STOCK_COUNT','StockCount',countId,{branchId:branchId,countNo:countNo,countType:countType,items:products.length});return getStockCountDetail(sessionToken,countId);
  });
}

function getStockCountDetail(sessionToken, countId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'STOCK_COUNT');
  const count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', countId);
  if (!count) throw new Error('Stock count not found.');
  requireBranchAccess_(user, String(count.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID));

  const products = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  products.forEach(function(row) { productMap[String(row.ProductID)] = row; });
  const units = getRows_(POS.SHEETS.UNITS);
  const unitMap = {};
  units.forEach(function(row) { unitMap[String(row.UnitID)] = row; });
  const items = getRows_(POS.SHEETS.STOCK_COUNT_ITEMS)
    .filter(function(row) { return String(row.CountID) === String(countId); })
    .map(function(row) { return stockCountItemPublic_(row, productMap, unitMap); })
    .sort(function(a, b) { return a.productName.localeCompare(b.productName); });
  const summary = summarizeStockCountItems_(items);
  const publicCount = stockCountHeaderPublic_(count, stockCountUserMap_());
  const status = publicCount.status;
  return {
    count: publicCount,
    items: items,
    summary: summary,
    reasons: STOCK_COUNT_FEATURE.REASONS.slice(),
    thresholds: stockCountThresholds_(),
    canEdit: status === STOCK_COUNT_FEATURE.STATUS.DRAFT && stockCountEditRoles_().indexOf(String(user.Role)) >= 0,
    canSubmit: status === STOCK_COUNT_FEATURE.STATUS.DRAFT && stockCountEditRoles_().indexOf(String(user.Role)) >= 0,
    canApprove: status === STOCK_COUNT_FEATURE.STATUS.SUBMITTED && stockCountApproveRoles_().indexOf(String(user.Role)) >= 0,
    canReopen: status === STOCK_COUNT_FEATURE.STATUS.SUBMITTED && stockCountApproveRoles_().indexOf(String(user.Role)) >= 0,
    canCancel: [STOCK_COUNT_FEATURE.STATUS.DRAFT, STOCK_COUNT_FEATURE.STATUS.SUBMITTED].indexOf(status) >= 0 &&
      (stockCountApproveRoles_().indexOf(String(user.Role)) >= 0 || String(count.StartedByID) === String(user.UserID))
  };
}

function normalizeStockCountPhysical_(value, allowDecimal) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('Physical quantity must be zero or greater.');
  return allowDecimal ? Math.round(number * 1000) / 1000 : Math.round(number);
}

function saveStockCountItemsLocked_(user, count, updates) {
  if (String(count.Status) !== STOCK_COUNT_FEATURE.STATUS.DRAFT) {
    throw new Error('Only a draft stock count can be edited.');
  }
  const itemRows = getRows_(POS.SHEETS.STOCK_COUNT_ITEMS)
    .filter(function(row) { return String(row.CountID) === String(count.CountID); });
  const itemMap = {};
  itemRows.forEach(function(row) { itemMap[String(row.ProductID)] = row; });
  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) { productMap[String(row.ProductID)] = row; });
  const unitRows = getRows_(POS.SHEETS.UNITS);
  const unitMap = {};
  unitRows.forEach(function(row) { unitMap[String(row.UnitID)] = row; });
  const now = new Date();

  (updates || []).forEach(function(update) {
    const item = itemMap[String(update.productId)];
    if (!item) throw new Error('A submitted product is not part of this count.');
    const product = productMap[String(item.ProductID)];
    if (!product) throw new Error('A counted product no longer exists.');
    const unit = unitMap[String(item.UnitID || product.UnitID || '')] || {};
    const counted = update.counted !== false && update.physicalQty !== '' && update.physicalQty !== null && update.physicalQty !== undefined;
    const countBranchId = String(count.BranchID || getUserBranchId_(user));
    const currentQty = getBranchStockQty_(countBranchId, product.ProductID);
    const physicalQty = counted ? normalizeStockCountPhysical_(update.physicalQty, bool_(unit.AllowDecimal)) : '';
    const variance = counted ? Math.round((physicalQty - currentQty) * 1000) / 1000 : 0;
    const unitCost = number_(item.UnitCostUSD || product.CostUSD);
    updateRowObject_(POS.SHEETS.STOCK_COUNT_ITEMS, item._row, {
      CurrentSystemQty: currentQty,
      Counted: counted,
      PhysicalQty: physicalQty,
      VarianceQty: variance,
      UnitCostUSD: unitCost,
      VarianceValueUSD: counted ? roundMoney_(variance * unitCost) : 0,
      Reason: sanitizeText_(update.reason || item.Reason || 'COUNT_VARIANCE', 40),
      Note: sanitizeText_(update.note, 250),
      CountedAt: counted ? now : '',
      CountedByID: counted ? user.UserID : '',
      MovementDuringCount: Math.round((currentQty - number_(item.SnapshotQty)) * 1000) / 1000,
      NeedsRecount: counted ? stockCountNeedsRecount_(variance, currentQty) : false,
      UpdatedAt: now
    });
  });

  const publicItems = getRows_(POS.SHEETS.STOCK_COUNT_ITEMS)
    .filter(function(row) { return String(row.CountID) === String(count.CountID); })
    .map(function(row) { return stockCountItemPublic_(row, productMap, unitMap); });
  const summary = summarizeStockCountItems_(publicItems);
  updateRowObject_(POS.SHEETS.STOCK_COUNTS, count._row, {
    TotalItems: summary.totalItems,
    CountedItems: summary.countedItems,
    VarianceItems: summary.varianceItems,
    VarianceQty: summary.varianceQty,
    VarianceValueUSD: summary.varianceValueUSD,
    UpdatedAt: now
  });
  return summary;
}

function saveStockCountDraft(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'STOCK_COUNT');
  payload = payload || {};
  return withScriptLock_(function() {
    const count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', payload.countId);
    if (!count) throw new Error('Stock count not found.');
    const summary = saveStockCountItemsLocked_(user, count, payload.items || []);
    audit_(user.UserID, 'SAVE_STOCK_COUNT', 'StockCount', count.CountID, {
      updatedItems: (payload.items || []).length,
      countedItems: summary.countedItems,
      varianceItems: summary.varianceItems
    });
    return getStockCountDetail(sessionToken, count.CountID);
  });
}

function submitStockCount(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'STOCK_COUNT');
  payload = payload || {};
  return withScriptLock_(function() {
    let count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', payload.countId);
    if (!count) throw new Error('Stock count not found.');
    if (String(count.Status) !== STOCK_COUNT_FEATURE.STATUS.DRAFT) {
      throw new Error('Only a draft stock count can be submitted.');
    }
    if (payload.items && payload.items.length) {
      saveStockCountItemsLocked_(user, count, payload.items);
      count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', payload.countId);
    }
    const detail = getStockCountDetail(sessionToken, payload.countId);
    if (detail.summary.uncountedItems > 0) {
      throw new Error('Count every product before submitting. Uncounted products: ' + detail.summary.uncountedItems);
    }
    const now = new Date();
    updateRowObject_(POS.SHEETS.STOCK_COUNTS, count._row, {
      Status: STOCK_COUNT_FEATURE.STATUS.SUBMITTED,
      SubmittedAt: now,
      SubmittedByID: user.UserID,
      TotalItems: detail.summary.totalItems,
      CountedItems: detail.summary.countedItems,
      VarianceItems: detail.summary.varianceItems,
      VarianceQty: detail.summary.varianceQty,
      VarianceValueUSD: detail.summary.varianceValueUSD,
      UpdatedAt: now
    });
    audit_(user.UserID, 'SUBMIT_STOCK_COUNT', 'StockCount', count.CountID, detail.summary);
    return getStockCountDetail(sessionToken, count.CountID);
  });
}

function reopenStockCount(sessionToken, countId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, stockCountApproveRoles_());
  return withScriptLock_(function() {
    const count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', countId);
    if (!count) throw new Error('Stock count not found.');
    if (String(count.Status) !== STOCK_COUNT_FEATURE.STATUS.SUBMITTED) {
      throw new Error('Only a submitted count can be reopened.');
    }
    updateRowObject_(POS.SHEETS.STOCK_COUNTS, count._row, {
      Status: STOCK_COUNT_FEATURE.STATUS.DRAFT,
      SubmittedAt: '',
      SubmittedByID: '',
      UpdatedAt: new Date()
    });
    audit_(user.UserID, 'REOPEN_STOCK_COUNT', 'StockCount', countId, {});
    return getStockCountDetail(sessionToken, countId);
  });
}

function cancelStockCount(sessionToken, countId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'STOCK_COUNT');
  return withScriptLock_(function() {
    const count = findRowBy_(POS.SHEETS.STOCK_COUNTS, 'CountID', countId);
    if (!count) throw new Error('Stock count not found.');
    const status = String(count.Status);
    const canCancel = [STOCK_COUNT_FEATURE.STATUS.DRAFT, STOCK_COUNT_FEATURE.STATUS.SUBMITTED].indexOf(status) >= 0 &&
      (stockCountApproveRoles_().indexOf(String(user.Role)) >= 0 || String(count.StartedByID) === String(user.UserID));
    if (!canCancel) throw new Error('You cannot cancel this stock count.');
    updateRowObject_(POS.SHEETS.STOCK_COUNTS, count._row, {
      Status: STOCK_COUNT_FEATURE.STATUS.CANCELLED,
      UpdatedAt: new Date()
    });
    audit_(user.UserID, 'CANCEL_STOCK_COUNT', 'StockCount', countId, {});
    return {success: true};
  });
}

function approveAndApplyStockCount(sessionToken, payload) {
  const user=requireSession_(sessionToken);requireRole_(user,stockCountApproveRoles_());payload=payload||{};
  return withScriptLock_(function(){
    const count=findRowBy_(POS.SHEETS.STOCK_COUNTS,'CountID',payload.countId);if(!count)throw new Error('Stock count not found.');if(String(count.Status)!=='SUBMITTED')throw new Error('Only a submitted stock count can be applied.');
    const branchId=String(count.BranchID||getUserBranchId_(user));
    const items=getRows_(POS.SHEETS.STOCK_COUNT_ITEMS).filter(function(r){return String(r.CountID)===String(count.CountID);});if(!items.length||items.some(function(r){return !bool_(r.Counted);}))throw new Error('Every selected product must be counted before approval.');
    const products={};getRows_(POS.SHEETS.PRODUCTS).forEach(function(p){products[String(p.ProductID)]=p;});
    const changed=[];items.forEach(function(item){const current=getBranchStockQty_(branchId,item.ProductID),saved=number_(item.CurrentSystemQty);if(Math.abs(current-saved)>0.0005)changed.push({productId:String(item.ProductID),productName:String(item.ProductName),submittedSystemQty:saved,currentSystemQty:current});});
    if(changed.length&&payload.confirmChangedStock!==true)return {requiresConfirmation:true,changedItems:changed,message:'Stock changed after submission. Review before applying.'};
    const adjustments=items.map(function(item){const product=products[String(item.ProductID)];if(!product)throw new Error('A counted product no longer exists: '+item.ProductName);const current=getBranchStockQty_(branchId,item.ProductID),physical=number_(item.PhysicalQty);return {item:item,product:product,current:current,physical:physical,difference:Math.round((physical-current)*1000)/1000};});
    const negative=adjustments.filter(function(e){return e.difference<-0.0005;}),plan=negative.length?planFifoAllocationsLocked_(negative.map(function(e){return {productId:e.product.ProductID,qty:Math.abs(e.difference)};}),branchId):{itemPlans:[],finalLotRemaining:{}};
    if(negative.length)applyFifoPlanLocked_(plan,negative.map(function(e){return {branchId:branchId,referenceType:'STOCK_COUNT_OUT',referenceId:count.CountID,userId:user.UserID,note:'Physical stock count '+count.CountNo};}));
    const now=new Date(),movements=[];let negIndex=0,varianceItems=0,varianceQty=0,varianceValue=0;
    adjustments.forEach(function(e){let unitCost=number_(e.item.UnitCostUSD||e.product.CostUSD),costIn=0,costOut=0,adjustmentId='';if(e.difference>0.0005){adjustmentId=uuid_('SCA');costIn=roundMoney_(e.difference*unitCost);createStockLotLocked_({branchId:branchId,productId:e.product.ProductID,receivedAt:now,unitCostUSD:unitCost,quantity:e.difference,referenceType:'STOCK_COUNT_IN',referenceId:count.CountID,note:String(e.item.Reason||'OVERSTOCK')});}else if(e.difference<-0.0005){const p=plan.itemPlans[negIndex++];unitCost=p.averageUnitCostUSD;costOut=p.totalCostUSD;adjustmentId=uuid_('SCA');}
      if(Math.abs(e.difference)>0.0005){varianceItems++;varianceQty=Math.round((varianceQty+e.difference)*1000)/1000;varianceValue=roundMoney_(varianceValue+(e.difference>0?costIn:-costOut));movements.push({MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:e.product.ProductID,Type:e.difference>0?'STOCK_COUNT_IN':'STOCK_COUNT_OUT',QtyIn:e.difference>0?e.difference:0,QtyOut:e.difference<0?Math.abs(e.difference):0,BalanceAfter:e.physical,ReferenceType:'STOCK_COUNT',ReferenceID:count.CountID,UserID:user.UserID,Note:sanitizeText_(String(e.item.Reason||'COUNT_VARIANCE')+(e.item.Note?': '+e.item.Note:''),250),UnitCostUSD:unitCost,CostInUSD:costIn,CostOutUSD:costOut});}
      setBranchStockLocked_(branchId,e.product.ProductID,e.physical,e.difference>0?unitCost:getBranchAverageCost_(branchId,e.product.ProductID));updateRowObject_(POS.SHEETS.STOCK_COUNT_ITEMS,e.item._row,{BranchID:branchId,CurrentSystemQty:e.current,VarianceQty:e.difference,UnitCostUSD:unitCost,VarianceValueUSD:e.difference>0?costIn:-costOut,MovementDuringCount:Math.round((e.current-number_(e.item.SnapshotQty))*1000)/1000,NeedsRecount:stockCountNeedsRecount_(e.difference,e.current),AppliedAdjustmentID:adjustmentId,UpdatedAt:now});
    });
    appendObjects_(POS.SHEETS.STOCK,movements);updateRowObject_(POS.SHEETS.STOCK_COUNTS,count._row,{Status:'APPLIED',ApprovedAt:now,ApprovedByID:user.UserID,AppliedAt:now,AppliedByID:user.UserID,CountedItems:items.length,VarianceItems:varianceItems,VarianceQty:varianceQty,VarianceValueUSD:varianceValue,UpdatedAt:now});audit_(user.UserID,'APPLY_STOCK_COUNT','StockCount',count.CountID,{branchId:branchId,varianceItems:varianceItems,varianceQty:varianceQty,varianceValueUSD:varianceValue});return {success:true,countId:String(count.CountID),status:'APPLIED'};
  });
}


/* ==========================================================================
 * SOURCE: SuppliersPurchases.gs
 * ========================================================================== */
function requirePurchaseRole_(user) { requirePermission_(user, 'PURCHASES'); }

function requirePurchaseWriteRole_(user) { requirePermission_(user, 'PURCHASES'); }

function listSuppliers_(includeInactive) {
  return getRows_(POS.SHEETS.SUPPLIERS)
    .filter(function(row) { return includeInactive || bool_(row.Active); })
    .sort(function(a, b) { return String(a.Name || '').localeCompare(String(b.Name || '')); })
    .map(function(row) {
      return {
        supplierId: String(row.SupplierID),
        name: String(row.Name || ''),
        contactPerson: String(row.ContactPerson || ''),
        phone: String(row.Phone || ''),
        email: String(row.Email || ''),
        address: String(row.Address || ''),
        taxNumber: String(row.TaxNumber || ''),
        notes: String(row.Notes || ''),
        active: bool_(row.Active)
      };
    });
}

function purchaseRowToPublic_(row) {
  const credit=number_(row.SupplierCreditUSD),payable=Math.max(0,number_(row.TotalUSD)-credit);
  return {purchaseId:String(row.PurchaseID),purchaseNo:String(row.PurchaseNo||''),branchId:String(row.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID),supplierId:String(row.SupplierID||''),supplierName:String(row.SupplierName||''),supplierInvoiceNo:String(row.SupplierInvoiceNo||''),purchaseDate:row.PurchaseDate?new Date(row.PurchaseDate).toISOString():'',expectedDate:row.ExpectedDate?new Date(row.ExpectedDate).toISOString():'',subtotalUSD:number_(row.SubtotalUSD),discountType:String(row.DiscountType||'FIXED'),discountValue:number_(row.DiscountValue),discountUSD:number_(row.DiscountUSD),taxUSD:number_(row.TaxUSD),shippingUSD:number_(row.ShippingUSD),otherCostUSD:number_(row.OtherCostUSD),totalUSD:number_(row.TotalUSD),supplierCreditUSD:credit,paidUSD:number_(row.PaidUSD),balanceUSD:roundMoney_(Math.max(0,payable-number_(row.PaidUSD))),paymentStatus:String(row.PaymentStatus||'UNPAID'),status:String(row.Status||'DRAFT'),notes:String(row.Notes||''),userId:String(row.UserID||''),createdAt:row.CreatedAt?new Date(row.CreatedAt).toISOString():'',updatedAt:row.UpdatedAt?new Date(row.UpdatedAt).toISOString():''};
}

function getPurchaseModuleData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  filters = filters || {};

  const query = sanitizeText_(filters.query, 120).toLowerCase();
  const branchId = resolveAccessibleBranchId_(user, filters.branchId, true);
  const supplierId = sanitizeText_(filters.supplierId, 80);
  const range = (filters.from || filters.to)
    ? reportRange_(filters.from, filters.to)
    : null;

  const purchases = getRows_(POS.SHEETS.PURCHASES)
    .filter(function(row) {
      if (supplierId && String(row.SupplierID || '') !== supplierId) return false;
      if (range && !reportInRange_(row.PurchaseDate || row.CreatedAt, range)) return false;
      const haystack = [row.PurchaseNo,row.SupplierName,row.SupplierInvoiceNo,row.Status,row.PaymentStatus].join(' ').toLowerCase();
      return !query || haystack.indexOf(query) >= 0;
    })
    .sort(function(a, b) {
      return new Date(b.CreatedAt || b.PurchaseDate || 0) - new Date(a.CreatedAt || a.PurchaseDate || 0);
    })
    .slice(0, 500)
    .map(purchaseRowToPublic_);

  const totals = purchases.reduce(function(acc, purchase) {
    acc.totalUSD += purchase.totalUSD;
    acc.paidUSD += purchase.paidUSD;
    acc.balanceUSD += purchase.balanceUSD;
    if (purchase.status === 'PARTIALLY_RECEIVED') acc.partialCount++;
    if (purchase.status === 'ORDERED') acc.orderedCount++;
    return acc;
  }, {totalUSD: 0, paidUSD: 0, balanceUSD: 0, partialCount: 0, orderedCount: 0});

  return {
    filters:{query:query,supplierId:supplierId,from:filters.from || '',to:filters.to || ''},
    suppliers: listSuppliers_(true),
    purchases: purchases,
    metrics: {
      totalPurchasesUSD: roundMoney_(totals.totalUSD),
      supplierBalanceUSD: roundMoney_(totals.balanceUSD),
      orderedCount: totals.orderedCount,
      partialCount: totals.partialCount
    }
  };
}

function saveSupplier(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePurchaseWriteRole_(user);
  payload = payload || {};

  const name = sanitizeText_(payload.name, 120);
  if (!name) throw new Error('Supplier name is required.');

  const existing = payload.supplierId
    ? findRowBy_(POS.SHEETS.SUPPLIERS, 'SupplierID', payload.supplierId)
    : null;
  const now = new Date();
  const changes = {
    Name: name,
    ContactPerson: sanitizeText_(payload.contactPerson, 120),
    Phone: sanitizeText_(payload.phone, 50),
    Email: sanitizeText_(payload.email, 120),
    Address: sanitizeText_(payload.address, 250),
    TaxNumber: sanitizeText_(payload.taxNumber, 80),
    Notes: sanitizeText_(payload.notes, 250),
    Active: payload.active !== false,
    UpdatedAt: now
  };

  let supplierId;
  if (existing) {
    supplierId = String(existing.SupplierID);
    updateRowObject_(POS.SHEETS.SUPPLIERS, existing._row, changes);
  } else {
    supplierId = uuid_('SUP');
    changes.SupplierID = supplierId;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.SUPPLIERS, changes);
  }

  audit_(user.UserID, existing ? 'UPDATE_SUPPLIER' : 'CREATE_SUPPLIER', 'Supplier', supplierId, changes);
  return {success: true, supplierId: supplierId};
}

function calculatePurchase_(payload) {
  payload = payload || {};
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (!rawItems.length) throw new Error('Add at least one product to the purchase.');

  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) { productMap[String(row.ProductID)] = row; });
  const unitMap = getUnitMap_();

  let subtotal = 0;
  const items = rawItems.map(function(raw) {
    const product = productMap[String(raw.productId)];
    if (!product) throw new Error('A selected product no longer exists.');
    const unit = unitMap[String(product.UnitID || '')] || {};

    const orderedQty = Math.round(number_(raw.orderedQty !== undefined ? raw.orderedQty : raw.qty) * 1000) / 1000;
    const unitCost = roundMoney_(number_(raw.unitCostUSD));
    const lineBase = roundMoney_(orderedQty * unitCost);
    const lineDiscount = Math.min(lineBase, Math.max(0, roundMoney_(number_(raw.lineDiscountUSD))));
    const lineTotal = roundMoney_(lineBase - lineDiscount);

    if (orderedQty <= 0) throw new Error((product.NameEN || product.NameKH) + ': ordered quantity must be greater than zero.');
    if (unitCost < 0) throw new Error((product.NameEN || product.NameKH) + ': unit cost cannot be negative.');

    subtotal = roundMoney_(subtotal + lineTotal);
    return {
      purchaseItemId: sanitizeText_(raw.purchaseItemId, 80),
      productId: String(product.ProductID),
      productName: String(product.NameEN || product.NameKH || ''),
      unitId: String(product.UnitID || ''),
      unitName: String(unit.abbreviation || unit.nameEN || unit.nameKH || ''),
      orderedQty: orderedQty,
      receivedQty: Math.max(0, number_(raw.receivedQty)),
      unitCostUSD: unitCost,
      lineDiscountUSD: lineDiscount,
      lineTotalUSD: lineTotal
    };
  });

  let discountType = String(payload.discountType || 'FIXED').toUpperCase();
  if (['FIXED', 'PERCENT'].indexOf(discountType) === -1) discountType = 'FIXED';
  let discountValue = Math.max(0, number_(payload.discountValue));
  let discountUSD;
  if (discountType === 'PERCENT') {
    discountValue = Math.min(100, Math.round(discountValue * 100) / 100);
    discountUSD = roundMoney_(subtotal * discountValue / 100);
  } else {
    discountValue = roundMoney_(Math.min(subtotal, discountValue));
    discountUSD = discountValue;
  }

  const taxUSD = Math.max(0, roundMoney_(number_(payload.taxUSD)));
  const shippingUSD = Math.max(0, roundMoney_(number_(payload.shippingUSD)));
  const otherCostUSD = Math.max(0, roundMoney_(number_(payload.otherCostUSD)));
  const totalUSD = roundMoney_(Math.max(0, subtotal - discountUSD + taxUSD + shippingUSD + otherCostUSD));

  // Allocate header-level discount/costs proportionally so each FIFO lot gets a landed cost.
  items.forEach(function(item) {
    const share = subtotal > 0 ? item.lineTotalUSD / subtotal : 1 / items.length;
    const landedLineCost = roundMoney_(
      item.lineTotalUSD - discountUSD * share + taxUSD * share + shippingUSD * share + otherCostUSD * share
    );
    item.landedUnitCostUSD = item.orderedQty > 0
      ? Math.round((landedLineCost / item.orderedQty) * 10000) / 10000
      : 0;
  });

  return {
    items: items,
    subtotalUSD: subtotal,
    discountType: discountType,
    discountValue: discountValue,
    discountUSD: discountUSD,
    taxUSD: taxUSD,
    shippingUSD: shippingUSD,
    otherCostUSD: otherCostUSD,
    totalUSD: totalUSD
  };
}

function previewPurchaseTotals(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  return calculatePurchase_(payload);
}

function savePurchaseDraft(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePurchaseWriteRole_(user);
  payload = payload || {};

  return withScriptLock_(function() {
    const supplier = findRowBy_(POS.SHEETS.SUPPLIERS, 'SupplierID', payload.supplierId);
    if (!supplier || !bool_(supplier.Active)) throw new Error('Select an active supplier.');

    const calculated = calculatePurchase_(payload);
    const existing = payload.purchaseId
      ? findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', payload.purchaseId)
      : null;
    const requestedStatus = String(payload.status || 'DRAFT').toUpperCase() === 'ORDERED' ? 'ORDERED' : 'DRAFT';
    const now = new Date();

    if (existing) {
      const existingItems = getRows_(POS.SHEETS.PURCHASE_ITEMS).filter(function(row) {
        return String(row.PurchaseID) === String(existing.PurchaseID);
      });
      const received = existingItems.reduce(function(sum, item) { return sum + number_(item.ReceivedQty); }, 0);
      if (received > 0.0005) throw new Error('A purchase with received stock cannot be edited.');
      if (String(existing.Status) === 'CANCELLED' || String(existing.Status) === 'RECEIVED') {
        throw new Error('This purchase can no longer be edited.');
      }
    }

    const purchaseId = existing ? String(existing.PurchaseID) : uuid_('PUR');
    const purchaseNo = existing ? String(existing.PurchaseNo) : generatePurchaseNo_();
    const paidUSD = existing ? number_(existing.PaidUSD) : 0;
    const paymentStatus = paidUSD <= 0 ? 'UNPAID' : paidUSD + 0.005 >= calculated.totalUSD ? 'PAID' : 'PARTIALLY_PAID';
    const header = {
      PurchaseID: purchaseId,
      PurchaseNo: purchaseNo,
      BranchID: existing ? String(existing.BranchID || getUserBranchId_(user)) : resolveAccessibleBranchId_(user, payload.branchId, false),
      SupplierID: String(supplier.SupplierID),
      SupplierName: String(supplier.Name),
      SupplierInvoiceNo: sanitizeText_(payload.supplierInvoiceNo, 100),
      PurchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate + 'T00:00:00') : now,
      ExpectedDate: payload.expectedDate ? new Date(payload.expectedDate + 'T00:00:00') : '',
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

    appendObjects_(POS.SHEETS.PURCHASE_ITEMS, calculated.items.map(function(item) {
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
        CreatedAt: now,
        UpdatedAt: now
      };
    }));

    audit_(user.UserID, existing ? 'UPDATE_PURCHASE' : 'CREATE_PURCHASE', 'Purchase', purchaseId, {
      purchaseNo: purchaseNo,
      supplierId: supplier.SupplierID,
      totalUSD: calculated.totalUSD,
      status: requestedStatus
    });

    return {success: true, purchaseId: purchaseId, purchaseNo: purchaseNo};
  });
}

function deletePurchaseItemsLocked_(purchaseId) {
  const sheet = getSheet_(POS.SHEETS.PURCHASE_ITEMS);
  const rows = getRows_(POS.SHEETS.PURCHASE_ITEMS)
    .filter(function(row) { return String(row.PurchaseID) === String(purchaseId); })
    .map(function(row) { return row._row; })
    .sort(function(a, b) { return b - a; });
  rows.forEach(function(row) { sheet.deleteRow(row); });
}

function getPurchaseDetails(sessionToken, purchaseId) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  const row = findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', purchaseId);
  if (!row) throw new Error('Purchase not found.');

  const purchase = purchaseRowToPublic_(row);
  purchase.items = getRows_(POS.SHEETS.PURCHASE_ITEMS)
    .filter(function(item) { return String(item.PurchaseID) === String(purchaseId); })
    .map(function(item) {
      const ordered = number_(item.OrderedQty || item.Qty);
      const received = number_(item.ReceivedQty);
      return {
        purchaseItemId: String(item.PurchaseItemID),
        productId: String(item.ProductID),
        productName: String(item.ProductName || ''),
        unitId: String(item.UnitID || ''),
        unitName: String(item.UnitName || ''),
        orderedQty: ordered,
        receivedQty: received,
        remainingQty: Math.max(0, Math.round((ordered - received) * 1000) / 1000),
        unitCostUSD: number_(item.UnitCostUSD),
        lineDiscountUSD: number_(item.LineDiscountUSD),
        lineTotalUSD: number_(item.LineTotalUSD),
        landedUnitCostUSD: number_(item.LandedUnitCostUSD || item.UnitCostUSD)
      };
    });
  purchase.payments = getRows_(PURCHASE_FIFO.SHEETS.SUPPLIER_PAYMENTS)
    .filter(function(payment) { return String(payment.PurchaseID) === String(purchaseId); })
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
    .filter(function(receipt) { return String(receipt.PurchaseID) === String(purchaseId); })
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
  return purchase;
}

function receivePurchaseStock(sessionToken, payload) {
  const user=requireSession_(sessionToken);requirePermission_(user,'PURCHASES');payload=payload||{};
  return withScriptLock_(function(){
    const purchase=findRowBy_(POS.SHEETS.PURCHASES,'PurchaseID',payload.purchaseId);if(!purchase)throw new Error('Purchase not found.');
    if(String(purchase.Status)==='DRAFT')throw new Error('Mark the purchase as ORDERED before receiving stock.');
    if(['CANCELLED','RECEIVED'].indexOf(String(purchase.Status))>=0)throw new Error('This purchase cannot receive more stock.');
    const branchId=String(purchase.BranchID||getUserBranchId_(user));
    const items=getRows_(POS.SHEETS.PURCHASE_ITEMS).filter(function(i){return String(i.PurchaseID)===String(purchase.PurchaseID);}),map={};items.forEach(function(i){map[String(i.PurchaseItemID)]=i;});
    const lines=[];(Array.isArray(payload.items)?payload.items:[]).forEach(function(req){const item=map[String(req.purchaseItemId)];if(!item)throw new Error('A purchase item was not found.');const qty=Math.round(number_(req.receiveQty)*1000)/1000,remaining=Math.round((number_(item.OrderedQty||item.Qty)-number_(item.ReceivedQty))*1000)/1000;if(qty<0)throw new Error(item.ProductName+': received quantity cannot be negative.');if(qty>remaining+0.0005)throw new Error(item.ProductName+': cannot receive more than '+remaining+'.');if(qty>0.0005)lines.push({item:item,qty:qty});});
    if(!lines.length)throw new Error('Enter at least one quantity to receive.');
    const now=new Date(),receiptId=uuid_('REC'),receiptNo=generatePurchaseReceiptNo_();let totalQty=0,totalCost=0;
    lines.forEach(function(line){const item=line.item,product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',item.ProductID);if(!product)throw new Error(item.ProductName+' no longer exists.');const cost=number_(item.LandedUnitCostUSD||item.UnitCostUSD),current=getBranchStockQty_(branchId,product.ProductID),next=Math.round((current+line.qty)*1000)/1000,newReceived=Math.round((number_(item.ReceivedQty)+line.qty)*1000)/1000,lineCost=roundMoney_(line.qty*cost);createStockLotLocked_({branchId:branchId,productId:product.ProductID,purchaseId:purchase.PurchaseID,receiptId:receiptId,receivedAt:now,unitCostUSD:cost,quantity:line.qty,referenceType:'PURCHASE_RECEIPT',referenceId:receiptId,note:receiptNo+' / '+purchase.PurchaseNo});const fifoSummary=getFifoStockSummary_(product.ProductID,branchId);setBranchStockLocked_(branchId,product.ProductID,next,fifoSummary.totalQty>0?fifoSummary.averageCostUSD:cost);updateRowObject_(POS.SHEETS.PURCHASE_ITEMS,item._row,{ReceivedQty:newReceived,UpdatedAt:now});appendObject_(POS.SHEETS.STOCK,{MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:product.ProductID,Type:'PURCHASE_RECEIPT',QtyIn:line.qty,QtyOut:0,BalanceAfter:next,ReferenceType:'PURCHASE',ReferenceID:purchase.PurchaseID,UserID:user.UserID,Note:receiptNo,UnitCostUSD:cost,CostInUSD:lineCost,CostOutUSD:0});totalQty+=line.qty;totalCost=roundMoney_(totalCost+lineCost);});
    appendObject_(PURCHASE_FIFO.SHEETS.PURCHASE_RECEIPTS,{ReceiptID:receiptId,ReceiptNo:receiptNo,PurchaseID:purchase.PurchaseID,SupplierID:purchase.SupplierID,BranchID:branchId,ReceivedAt:now,TotalQty:Math.round(totalQty*1000)/1000,TotalCostUSD:totalCost,UserID:user.UserID,Notes:sanitizeText_(payload.notes,250),CreatedAt:now});
    const refreshed=getRows_(POS.SHEETS.PURCHASE_ITEMS).filter(function(i){return String(i.PurchaseID)===String(purchase.PurchaseID);}),full=refreshed.every(function(i){return number_(i.ReceivedQty)+0.0005>=number_(i.OrderedQty||i.Qty);}),any=refreshed.some(function(i){return number_(i.ReceivedQty)>0.0005;}),status=full?'RECEIVED':any?'PARTIALLY_RECEIVED':'ORDERED';updateRowObject_(POS.SHEETS.PURCHASES,purchase._row,{Status:status,UpdatedAt:now});audit_(user.UserID,'RECEIVE_PURCHASE','Purchase',purchase.PurchaseID,{branchId:branchId,receiptNo:receiptNo,totalQty:totalQty,totalCostUSD:totalCost,status:status});return {success:true,purchaseId:String(purchase.PurchaseID),receiptId:receiptId,receiptNo:receiptNo,status:status};
  });
}

function recordSupplierPayment(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.ACCOUNTANT]);
  payload = payload || {};

  return withScriptLock_(function() {
    const purchase = findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', payload.purchaseId);
    if (!purchase) throw new Error('Purchase not found.');
    if (String(purchase.Status) === 'CANCELLED') throw new Error('Cannot pay a cancelled purchase.');

    const amount = roundMoney_(number_(payload.amountUSD));
    const balance = roundMoney_(Math.max(0, number_(purchase.TotalUSD) - number_(purchase.PaidUSD)));
    if (amount <= 0) throw new Error('Payment amount must be greater than zero.');
    if (amount > balance + 0.005) throw new Error('Payment exceeds the remaining supplier balance of $' + balance.toFixed(2) + '.');

    const now = new Date();
    const newPaid = roundMoney_(number_(purchase.PaidUSD) + amount);
    const status = newPaid + 0.005 >= number_(purchase.TotalUSD) ? 'PAID' : 'PARTIALLY_PAID';
    const paymentId = uuid_('SPM');

    appendObject_(PURCHASE_FIFO.SHEETS.SUPPLIER_PAYMENTS, {
      SupplierPaymentID: paymentId,
      PurchaseID: purchase.PurchaseID,
      SupplierID: purchase.SupplierID,
      DateTime: now,
      Method: ['CASH', 'BANK', 'CREDIT'].indexOf(String(payload.method || '').toUpperCase()) >= 0
        ? String(payload.method).toUpperCase() : 'CASH',
      AmountUSD: amount,
      Reference: sanitizeText_(payload.reference, 120),
      UserID: user.UserID,
      Notes: sanitizeText_(payload.notes, 250),
      CreatedAt: now
    });
    updateRowObject_(POS.SHEETS.PURCHASES, purchase._row, {
      PaidUSD: newPaid,
      PaymentStatus: status,
      UpdatedAt: now
    });
    audit_(user.UserID, 'SUPPLIER_PAYMENT', 'Purchase', purchase.PurchaseID, {paymentId: paymentId, amountUSD: amount, method: payload.method});
    return {success: true, paymentId: paymentId, paidUSD: newPaid, balanceUSD: roundMoney_(number_(purchase.TotalUSD) - newPaid), paymentStatus: status};
  });
}

function cancelPurchase(sessionToken, purchaseId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);

  return withScriptLock_(function() {
    const purchase = findRowBy_(POS.SHEETS.PURCHASES, 'PurchaseID', purchaseId);
    if (!purchase) throw new Error('Purchase not found.');
    const received = getRows_(POS.SHEETS.PURCHASE_ITEMS)
      .filter(function(item) { return String(item.PurchaseID) === String(purchaseId); })
      .reduce(function(sum, item) { return sum + number_(item.ReceivedQty); }, 0);
    if (received > 0.0005) throw new Error('A purchase with received stock cannot be cancelled. Use a stock adjustment or supplier return workflow later.');
    if (number_(purchase.PaidUSD) > 0.005) throw new Error('A purchase with supplier payments cannot be cancelled.');
    updateRowObject_(POS.SHEETS.PURCHASES, purchase._row, {Status: 'CANCELLED', UpdatedAt: new Date()});
    audit_(user.UserID, 'CANCEL_PURCHASE', 'Purchase', purchaseId, {});
    return {success: true};
  });
}

function generatePurchaseNo_() {
  const key = dateKey_(new Date());
  const props = PropertiesService.getScriptProperties();
  const counterKey = 'PURCHASE_COUNTER_' + key;
  const next = number_(props.getProperty(counterKey), 0) + 1;
  props.setProperty(counterKey, String(next));
  return 'PO-' + key + '-' + String(next).padStart(4, '0');
}

function generatePurchaseReceiptNo_() {
  const key = dateKey_(new Date());
  const props = PropertiesService.getScriptProperties();
  const counterKey = 'PURCHASE_RECEIPT_COUNTER_' + key;
  const next = number_(props.getProperty(counterKey), 0) + 1;
  props.setProperty(counterKey, String(next));
  return 'GRN-' + key + '-' + String(next).padStart(4, '0');
}

function getPurchasePrintData(sessionToken, purchaseId, documentType) {
  const user = requireSession_(sessionToken);
  requirePurchaseRole_(user);
  const purchase = getPurchaseDetails(sessionToken, purchaseId);
  const supplier = findRowBy_(POS.SHEETS.SUPPLIERS, 'SupplierID', purchase.supplierId) || {};
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
    printedBy: String(user.Name)
  };
}


/* ==========================================================================
 * SOURCE: Units.gs
 * ========================================================================== */
function unitToPublic_(row) {
  return {
    unitId: String(row.UnitID || ''),
    nameEN: String(row.NameEN || ''),
    nameKH: String(row.NameKH || ''),
    abbreviation: String(row.Abbreviation || ''),
    allowDecimal: bool_(row.AllowDecimal),
    sortOrder: number_(row.SortOrder, 999),
    active: bool_(row.Active)
  };
}

function listActiveUnits_() {
  return getRows_(POS.SHEETS.UNITS)
    .filter(function(row) { return bool_(row.Active); })
    .sort(function(a,b) { return number_(a.SortOrder,999) - number_(b.SortOrder,999); })
    .map(unitToPublic_);
}

function listUnits(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK]);
  return getRows_(POS.SHEETS.UNITS)
    .sort(function(a,b) { return number_(a.SortOrder,999) - number_(b.SortOrder,999); })
    .map(unitToPublic_);
}

function saveUnit(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  payload = payload || {};
  const existing = payload.unitId
    ? findRowBy_(POS.SHEETS.UNITS, 'UnitID', payload.unitId)
    : null;
  const nameEN = sanitizeText_(payload.nameEN, 60);
  const nameKH = sanitizeText_(payload.nameKH, 60);
  const abbreviation = sanitizeText_(payload.abbreviation, 20);
  if (!nameEN && !nameKH) throw new Error('Unit name is required.');
  const now = new Date();
  const changes = {
    NameEN: nameEN,
    NameKH: nameKH,
    Abbreviation: abbreviation,
    AllowDecimal: payload.allowDecimal === true,
    SortOrder: number_(payload.sortOrder, 999),
    Active: payload.active !== false,
    UpdatedAt: now
  };
  let unitId;
  if (existing) {
    unitId = String(existing.UnitID);
    updateRowObject_(POS.SHEETS.UNITS, existing._row, changes);
  } else {
    unitId = uuid_('UNT');
    changes.UnitID = unitId;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.UNITS, changes);
  }
  audit_(user.UserID, existing ? 'UPDATE_UNIT' : 'CREATE_UNIT', 'Unit', unitId, changes);
  return {success:true, unitId:unitId};
}


/* ==========================================================================
 * SOURCE: NetlifyApiV50.gs
 * ========================================================================== */
/**
 * Tiny POS v5.0 secure Netlify-to-Apps-Script API router.
 * Only functions in this explicit allowlist can be called through HTTP.
 */
function handleNetlifyApiV50_(e) {
  const requestId = Utilities.getUuid();
  try {
    const raw = e && e.postData && e.postData.contents
      ? String(e.postData.contents)
      : '';

    if (!raw) throw new Error('Request body is empty.');
    if (raw.length > 7000000) throw new Error('Request body is too large.');

    const request = JSON.parse(raw);
    verifyNetlifyApiSecretV50_(request.apiSecret);

    const action = String(request.action || '').trim();
    const args = Array.isArray(request.args) ? request.args : [];
    const routes = getNetlifyApiRoutesV50_();

    if (!Object.prototype.hasOwnProperty.call(routes, action)) {
      throw new Error('Unsupported API action: ' + action);
    }

    const result = routes[action].apply(null, args);
    return jsonOutputV50_({
      success: true,
      data: normalizeJsonValueV50_(result),
      requestId: requestId
    });
  } catch (error) {
    console.error(
      'Tiny POS API error [' + requestId + ']:',
      error && error.stack ? error.stack : String(error)
    );
    return jsonOutputV50_({
      success: false,
      message: error && error.message ? error.message : 'Backend request failed.',
      requestId: requestId
    });
  }
}

function verifyNetlifyApiSecretV50_(providedSecret) {
  const expected = PropertiesService.getScriptProperties().getProperty('POS_API_SECRET');
  if (!expected) throw new Error('POS_API_SECRET is not configured.');

  const providedHash = sha256Hex_('v5|' + String(providedSecret || ''));
  const expectedHash = sha256Hex_('v5|' + String(expected));
  if (providedHash !== expectedHash) throw new Error('Unauthorized API request.');
}

function getNetlifyApiRoutesV50_() {
  return {
    "adjustStock": adjustStock,
    "approveAndApplyStockCount": approveAndApplyStockCount,
    "bootstrap": bootstrap,
    "cancelPendingInvoice": cancelPendingInvoice,
    "cancelPurchase": cancelPurchase,
    "cancelStockCount": cancelStockCount,
    "cancelStockTransfer": cancelStockTransfer,
    "closeCashShift": closeCashShift,
    "completeBankSale": completeBankSale,
    "completeCashSale": completeCashSale,
    "completeCreditSale": completeCreditSale,
    "configureBackupSchedule": configureBackupSchedule,
    "createManualBackup": createManualBackup,
    "createStockCount": createStockCount,
    "deleteCoupon": deleteCoupon,
    "deleteCustomer": deleteCustomer,
    "deleteExpenseV43": deleteExpenseV43,
    "deleteProduct": deleteProduct,
    "deleteUser": deleteUser,
    "getAdvancedReport": getAdvancedReport,
    "getAdvancedReportV38": getAdvancedReportV38,
    "getBackupManagerData": getBackupManagerData,
    "getBackupManagerDataV38": getBackupManagerDataV38,
    "getBranchFilterOptionsV37": getBranchFilterOptionsV37,
    "getBranchTransferModuleData": getBranchTransferModuleData,
    "getBranchTransferModuleDataV39": getBranchTransferModuleDataV39,
    "getBranchWorkspaceV38": getBranchWorkspaceV38,
    "getCreditAccountsData": getCreditAccountsData,
    "getCustomerDetails": getCustomerDetails,
    "getCustomerStatement": getCustomerStatement,
    "getCustomersModuleData": getCustomersModuleData,
    "getDatabaseMaintenanceDataV42": getDatabaseMaintenanceDataV42,
    "getExpenseManagementV43": getExpenseManagementV43,
    "getInventoryModuleDataV37": getInventoryModuleDataV37,
    "getOperationsStatus": getOperationsStatus,
    "getPendingInvoice": getPendingInvoice,
    "getProductFifoLots": getProductFifoLots,
    "getPurchaseDetails": getPurchaseDetails,
    "getPurchaseModuleData": getPurchaseModuleData,
    "getPurchasePrintData": getPurchasePrintData,
    "getPurchaseReturnableDetail": getPurchaseReturnableDetail,
    "getReceipt": getReceipt,
    "getReportWorkspaceV39": getReportWorkspaceV39,
    "getReports": getReports,
    "getReturnReceipt": getReturnReceipt,
    "getReturnSaleDetails": getReturnSaleDetails,
    "getReturnsModuleData": getReturnsModuleData,
    "getReturnsWorkspaceV39": getReturnsWorkspaceV39,
    "getSalesList": getSalesList,
    "getSalesListV38": getSalesListV38,
    "getSalesListWorkspaceV39": getSalesListWorkspaceV39,
    "getStockCountDetail": getStockCountDetail,
    "getStockCountModuleData": getStockCountModuleData,
    "getSupplierReturnModuleData": getSupplierReturnModuleData,
    "getTransferProductOptionsV37": getTransferProductOptionsV37,
    "listAuditLogs": listAuditLogs,
    "listBranches": listBranches,
    "listCategories": listCategories,
    "listCoupons": listCoupons,
    "listPendingInvoices": listPendingInvoices,
    "listPermissionOptions": listPermissionOptions,
    "listUnits": listUnits,
    "listUsers": listUsers,
    "loginWithCredentials": loginWithCredentials,
    "loginWithPin": loginWithPin,
    "logout": logout,
    "openCashShift": openCashShift,
    "previewCartPricing": previewCartPricing,
    "previewNextProductCodeV41": previewNextProductCodeV41,
    "printPendingInvoice": printPendingInvoice,
    "processSaleReturn": processSaleReturn,
    "processSupplierReturn": processSupplierReturn,
    "receivePurchaseStock": receivePurchaseStock,
    "receiveStockTransfer": receiveStockTransfer,
    "receiveStockTransferV39": receiveStockTransferV39,
    "recordCustomerPayment": recordCustomerPayment,
    "recordExpense": recordExpense,
    "recordSupplierPayment": recordSupplierPayment,
    "refreshAppData": refreshAppData,
    "reopenStockCount": reopenStockCount,
    "resetBusinessDataV42": resetBusinessDataV42,
    "restoreTinyPosBackup": restoreTinyPosBackup,
    "saveBranch": saveBranch,
    "saveCategory": saveCategory,
    "saveCoupon": saveCoupon,
    "saveCustomer": saveCustomer,
    "saveExpenseCategoryV43": saveExpenseCategoryV43,
    "saveExpenseV43": saveExpenseV43,
    "saveMyPreferences": saveMyPreferences,
    "savePendingInvoice": savePendingInvoice,
    "saveProduct": saveProduct,
    "savePurchaseDraft": savePurchaseDraft,
    "saveSettings": saveSettings,
    "saveStockCountDraft": saveStockCountDraft,
    "saveStockTransfer": saveStockTransfer,
    "saveSupplier": saveSupplier,
    "saveUnit": saveUnit,
    "saveUser": saveUser,
    "setEntityActive": setEntityActive,
    "setEntityActiveV38": setEntityActiveV38,
    "setEntityActiveV39": setEntityActiveV39,
    "shipStockTransfer": shipStockTransfer,
    "submitStockCount": submitStockCount
  };
}

function normalizeJsonValueV50_(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value, function(key, item) {
    if (item instanceof Date) return item.toISOString();
    if (typeof item === 'number' && !isFinite(item)) return null;
    return item;
  }));
}

function jsonOutputV50_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ==========================================================================
 * SOURCE: FreshInstallV50.gs
 * ========================================================================== */
/** Tiny POS v5.0 fresh installation and configuration helpers. */
function ensureApiSecretV50_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('POS_API_SECRET');
  if (!secret) {
    secret = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + Date.now(),
        Utilities.Charset.UTF_8
      )
    ).replace(/=+$/g, '');
    props.setProperty('POS_API_SECRET', secret);
  }
  return secret;
}

function installTinyPOSV50Fresh() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the new blank Google Sheet first.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  props.setProperty('TINY_POS_VERSION', POS.VERSION);
  ensureApiSecretV50_();

  installTinyPOSComplete();
  installProductPackagingV41();
  installOperationsScannerUpgradeV43();

  const result = verifyTinyPOSV50();
  if (!result.success) {
    throw new Error('Installation finished with verification problems:\n' + result.problems.join('\n'));
  }

  SpreadsheetApp.getUi().alert(
    'Tiny POS v5.0 fresh database is ready.\n\n' +
    'Next: deploy this Apps Script project as a Web app, then run showNetlifyEnvironmentValuesV50.'
  );

  return result;
}

function verifyTinyPOSV50() {
  const problems = [];

  try {
    const base = verifyTinyPOSComplete();
    if (!/OK/i.test(String(base || ''))) problems.push(String(base));
  } catch (error) {
    problems.push('Base database: ' + error.message);
  }

  try {
    const packaging = verifyProductPackagingV41();
    if (packaging && packaging.success === false) {
      problems.push('Product packaging verification failed.');
    }
  } catch (error) {
    problems.push('Product packaging: ' + error.message);
  }

  try {
    const operations = verifyOperationsScannerUpgradeV43();
    if (operations && operations.success === false) {
      problems.push('Expense/scanner verification failed.');
    }
  } catch (error) {
    problems.push('Expense/scanner: ' + error.message);
  }

  try {
    verifyDatabaseMaintenanceV42();
  } catch (error) {
    problems.push('Database maintenance: ' + error.message);
  }

  const requiredProperties = ['SPREADSHEET_ID', 'PASSWORD_SALT', 'POS_API_SECRET'];
  requiredProperties.forEach(function(key) {
    if (!PropertiesService.getScriptProperties().getProperty(key)) {
      problems.push('Missing Script Property: ' + key);
    }
  });

  const result = {
    success: problems.length === 0,
    version: POS.VERSION,
    spreadsheetId: getSpreadsheet_().getId(),
    problems: problems
  };

  try {
    SpreadsheetApp.getUi().alert(
      result.success
        ? 'Tiny POS v5.0 verification: OK'
        : 'Tiny POS v5.0 verification problems:\n\n' + problems.join('\n')
    );
  } catch (error) {
    console.log(JSON.stringify(result));
  }

  return result;
}

function showNetlifyEnvironmentValuesV50() {
  const backendUrl = getBackendWebAppUrlV50_();
  const secret = ensureApiSecretV50_();
  const result = {
    APPS_SCRIPT_WEB_APP_URL: backendUrl,
    POS_API_SECRET: secret
  };

  SpreadsheetApp.getUi().alert(
    'Copy these two values into Netlify environment variables.\n\n' +
    'APPS_SCRIPT_WEB_APP_URL\n' + backendUrl + '\n\n' +
    'POS_API_SECRET\n' + secret + '\n\n' +
    'Keep POS_API_SECRET private.'
  );
  console.log(JSON.stringify(result));
  return result;
}

function setNetlifyAppUrlV50() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Netlify Tiny POS URL',
    'Paste the production URL, for example https://tiny-pos-name.netlify.app',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return {cancelled:true};

  const url = normalizeNetlifyAppUrlV50_(response.getResponseText());
  PropertiesService.getScriptProperties().setProperty('NETLIFY_APP_URL', url);
  ui.alert('Saved Netlify POS URL:\n' + url);
  return {success:true, url:url};
}

function linkAdministratorTelegramV50() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Link Administrator Telegram',
    'Send /id to the new bot, then paste the numeric Telegram ID here:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return {cancelled:true};

  const telegramId = String(response.getResponseText() || '').trim();
  if (!/^\d+$/.test(telegramId)) throw new Error('Telegram ID must contain digits only.');

  const admin = getRows_(POS.SHEETS.USERS).find(function(user) {
    return String(user.Role) === POS.ROLES.ADMIN && bool_(user.Active);
  });
  if (!admin) throw new Error('No active Administrator user was found.');

  updateRowObject_(POS.SHEETS.USERS, admin._row, {
    TelegramID: telegramId,
    UpdatedAt: new Date()
  });
  ui.alert('Linked Telegram ID ' + telegramId + ' to ' + admin.Name + '.');
  return {success:true, userId:admin.UserID, telegramId:telegramId};
}

function rotatePosApiSecretV50() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('POS_API_SECRET');
  const secret = ensureApiSecretV50_();
  SpreadsheetApp.getUi().alert(
    'A new POS_API_SECRET was generated.\n\n' +
    'Update the POS_API_SECRET environment variable in Netlify immediately, then redeploy Netlify.\n\n' +
    secret
  );
  return secret;
}


/* ==========================================================================
 * SOURCE: Telegram.gs
 * ========================================================================== */
/** Tiny POS v5.0 Telegram bot integration. */
function normalizeNetlifyAppUrlV50_(value) {
  const url = String(value || '').trim().replace(/\/+$/, '');
  if (!url) throw new Error('Netlify POS URL is required.');
  if (!/^https:\/\//i.test(url)) throw new Error('Netlify POS URL must begin with https://');
  return url;
}

function telegramApi_(method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token) throw new Error('BOT_TOKEN is not configured.');
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  const result = safeJsonParse_(response.getContentText(), {});
  if (response.getResponseCode() >= 300 || !result.ok) {
    throw new Error('Telegram API error: ' + (result.description || response.getContentText()));
  }
  return result.result;
}

function getBackendWebAppUrlV50_() {
  const props = PropertiesService.getScriptProperties();
  const stored = String(props.getProperty('WEB_APP_URL') || '').trim();
  const live = String(ScriptApp.getService().getUrl() || '').trim();
  const url = live || stored;
  if (!url || !/\/exec(?:\?|$)/.test(url)) {
    throw new Error('Deploy the Apps Script project as a Web app first.');
  }
  props.setProperty('WEB_APP_URL', url.split('?')[0]);
  return url.split('?')[0];
}

function getNetlifyAppUrlV50_() {
  return normalizeNetlifyAppUrlV50_(
    PropertiesService.getScriptProperties().getProperty('NETLIFY_APP_URL')
  );
}

function setTelegramWebhook_() {
  const props = PropertiesService.getScriptProperties();
  const backendUrl = getBackendWebAppUrlV50_();
  let secret = props.getProperty('WEBHOOK_SECRET');
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('WEBHOOK_SECRET', secret);
  }
  const webhookUrl = backendUrl + '?hook=' + encodeURIComponent(secret);
  return telegramApi_('setWebhook', {
    url: webhookUrl,
    drop_pending_updates: true,
    max_connections: 1,
    allowed_updates: ['message']
  });
}

function setTelegramMenuButton_() {
  const appUrl = getNetlifyAppUrlV50_();
  return telegramApi_('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Open POS',
      web_app: {url: appUrl}
    }
  });
}

function configureTelegramBotV50() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const tokenResponse = ui.prompt(
    'New Telegram Bot Token',
    'Paste the token from @BotFather:',
    ui.ButtonSet.OK_CANCEL
  );
  if (tokenResponse.getSelectedButton() !== ui.Button.OK) return {cancelled:true};
  const token = String(tokenResponse.getResponseText() || '').trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error('The Telegram bot token format is invalid.');
  }

  const urlResponse = ui.prompt(
    'Netlify Tiny POS URL',
    'Paste the production Netlify URL, for example https://tiny-pos-name.netlify.app',
    ui.ButtonSet.OK_CANCEL
  );
  if (urlResponse.getSelectedButton() !== ui.Button.OK) return {cancelled:true};
  const netlifyUrl = normalizeNetlifyAppUrlV50_(urlResponse.getResponseText());

  props.setProperty('BOT_TOKEN', token);
  props.setProperty('NETLIFY_APP_URL', netlifyUrl);
  props.setProperty('WEB_APP_URL', getBackendWebAppUrlV50_());

  const webhook = setTelegramWebhook_();
  const menu = setTelegramMenuButton_();

  const result = {
    success: true,
    netlifyUrl: netlifyUrl,
    backendUrl: props.getProperty('WEB_APP_URL'),
    webhook: webhook,
    menuButton: menu
  };

  ui.alert(
    'Telegram bot connected.\n\n' +
    'POS URL: ' + netlifyUrl + '\n' +
    'Backend webhook: ' + props.getProperty('WEB_APP_URL')
  );
  return result;
}

function handleTelegramUpdate_(update) {
  const message = update && update.message;
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const telegramUserId = message.from && message.from.id ? String(message.from.id) : '';
  const text = String(message.text || '').trim();
  const appUrl = getNetlifyAppUrlV50_();

  if (text === '/start' || text === '/menu') {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text:
        '🛒 Tiny POS\n\n' +
        'Your Telegram ID: ' + telegramUserId + '\n' +
        'លេខសម្គាល់ Telegram របស់អ្នក: ' + telegramUserId + '\n\n' +
        'Tap the button below to open Tiny POS.',
      reply_markup: {
        inline_keyboard: [[{
          text: '🛒 Open POS / បើក POS',
          web_app: {url: appUrl}
        }]]
      }
    });
    return;
  }

  if (text === '/id') {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: 'Your Telegram ID: ' + telegramUserId
    });
    return;
  }

  if (text === '/today') {
    const summary = getTodaySummary_();
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text:
        '📊 Today / ថ្ងៃនេះ\n' +
        'Invoices: ' + summary.transactions + '\n' +
        'Revenue: $' + summary.revenueUSD.toFixed(2)
    });
    return;
  }

  telegramApi_('sendMessage', {
    chat_id: chatId,
    text:
      'Use /start to open Tiny POS.\n' +
      'Use /id to see your Telegram ID.\n\n' +
      'ប្រើ /start ដើម្បីបើក POS។'
  });
}

function notifySaleToTelegram_(sale, user) {
  const telegramId = user && user.TelegramID;
  if (!telegramId) return;
  try {
    telegramApi_('sendMessage', {
      chat_id: String(telegramId),
      text:
        '✅ Sale completed\n' +
        'Invoice: ' + sale.invoiceNo + '\n' +
        'Total: $' + Number(sale.totalUSD).toFixed(2) + '\n' +
        'Payment: ' + sale.paymentMethod
    });
  } catch (error) {
    console.error('Telegram receipt notification failed', error);
  }
}


/* ==========================================================================
 * SOURCE: WebApp.gs
 * ========================================================================== */
/**
 * Tiny POS v5.0 backend web entry points.
 *
 * GET  /exec            -> backend health response
 * POST /exec?api=v5     -> Netlify API bridge
 * POST /exec?hook=...   -> Telegram webhook
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      service: 'Tiny POS Backend',
      version: POS.VERSION,
      spreadsheetConfigured: Boolean(
        PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
      ),
      netlifyConfigured: Boolean(
        PropertiesService.getScriptProperties().getProperty('NETLIFY_APP_URL')
      ),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const mode = e && e.parameter && e.parameter.api
    ? String(e.parameter.api).toLowerCase()
    : '';

  if (mode === 'v5') {
    return handleNetlifyApiV50_(e);
  }

  return handleTelegramWebhookV50_(e);
}

function handleTelegramWebhookV50_(e) {
  const ok = ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);

  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('WEBHOOK_SECRET') || '';
    const receivedSecret = e && e.parameter && e.parameter.hook
      ? String(e.parameter.hook)
      : '';

    if (expectedSecret && receivedSecret !== expectedSecret) {
      console.error('Rejected Telegram webhook: invalid secret.');
      return ok;
    }

    const raw = e && e.postData && e.postData.contents
      ? e.postData.contents
      : '';
    if (!raw) return ok;

    const update = JSON.parse(raw);
    if (!claimTelegramUpdate_(update.update_id)) return ok;
    handleTelegramUpdate_(update);
  } catch (error) {
    console.error(
      'Telegram webhook error:',
      error && error.stack ? error.stack : String(error)
    );
  }

  return ok;
}

function claimTelegramUpdate_(updateId) {
  if (updateId === undefined || updateId === null) return false;

  const id = String(updateId);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'TELEGRAM_RECENT_UPDATE_IDS';
    let recent = [];

    try {
      recent = JSON.parse(props.getProperty(key) || '[]');
      if (!Array.isArray(recent)) recent = [];
    } catch (error) {
      recent = [];
    }

    if (recent.indexOf(id) !== -1) return false;

    recent.push(id);
    if (recent.length > 250) recent = recent.slice(-250);
    props.setProperty(key, JSON.stringify(recent));
    return true;
  } finally {
    lock.releaseLock();
  }
}
