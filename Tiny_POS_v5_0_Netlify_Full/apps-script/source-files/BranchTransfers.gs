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
