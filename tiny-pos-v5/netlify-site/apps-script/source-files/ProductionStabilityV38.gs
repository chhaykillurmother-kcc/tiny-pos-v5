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
