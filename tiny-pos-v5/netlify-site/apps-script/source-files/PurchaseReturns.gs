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
