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
