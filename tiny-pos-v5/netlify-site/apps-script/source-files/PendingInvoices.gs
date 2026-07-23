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
