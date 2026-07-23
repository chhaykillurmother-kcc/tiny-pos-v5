
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
