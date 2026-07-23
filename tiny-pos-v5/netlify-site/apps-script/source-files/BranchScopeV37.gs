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
