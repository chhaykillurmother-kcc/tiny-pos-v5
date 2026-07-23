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
