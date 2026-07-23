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