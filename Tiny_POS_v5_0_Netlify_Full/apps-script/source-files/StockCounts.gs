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
