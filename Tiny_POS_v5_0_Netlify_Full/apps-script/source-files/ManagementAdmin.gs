/** Tiny POS v3.1 management helpers: coupons, audit log, safe customer deletion. */

function saveCoupon(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  payload = payload || {};
  const code = normalizeCouponCode_(payload.code);
  if (!code) throw new Error('Coupon code is required.');
  const type = String(payload.discountType || 'PERCENT').toUpperCase();
  if (['PERCENT','FIXED'].indexOf(type) < 0) throw new Error('Invalid coupon discount type.');
  const value = Math.max(0, number_(payload.discountValue));
  if (type === 'PERCENT' && value > 100) throw new Error('Percentage coupon cannot exceed 100%.');
  if (value <= 0) throw new Error('Coupon value must be greater than zero.');

  const existingByCode = findCouponByCode_(code);
  const existing = payload.couponId ? findRowBy_(POS.SHEETS.COUPONS, 'CouponID', payload.couponId) : existingByCode;
  if (existingByCode && (!existing || String(existingByCode.CouponID) !== String(existing.CouponID))) {
    throw new Error('This coupon code already exists.');
  }

  const now = new Date();
  const changes = {
    Code: code,
    DescriptionEN: sanitizeText_(payload.descriptionEN, 160),
    DescriptionKH: sanitizeText_(payload.descriptionKH, 160),
    DiscountType: type,
    DiscountValue: value,
    MinSpendUSD: Math.max(0, roundMoney_(number_(payload.minSpendUSD))),
    MaxDiscountUSD: Math.max(0, roundMoney_(number_(payload.maxDiscountUSD))),
    StartDate: payload.startDate ? new Date(payload.startDate) : '',
    EndDate: payload.endDate ? new Date(payload.endDate) : '',
    UsageLimit: Math.max(0, Math.floor(number_(payload.usageLimit))),
    Active: payload.active !== false,
    UpdatedAt: now
  };
  if (changes.StartDate && isNaN(changes.StartDate.getTime())) throw new Error('Invalid coupon start date/time.');
  if (changes.EndDate && isNaN(changes.EndDate.getTime())) throw new Error('Invalid coupon end date/time.');
  if (changes.StartDate && changes.EndDate && changes.EndDate < changes.StartDate) throw new Error('Coupon end date must be after the start date.');

  let couponId;
  if (existing) {
    couponId = String(existing.CouponID);
    updateRowObject_(POS.SHEETS.COUPONS, existing._row, changes);
  } else {
    couponId = uuid_('CPN');
    changes.CouponID = couponId;
    changes.UsedCount = 0;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.COUPONS, changes);
  }
  audit_(user.UserID, existing ? 'UPDATE_COUPON' : 'CREATE_COUPON', 'Coupon', couponId, changes);
  return {success:true,couponId:couponId};
}

function deleteCoupon(sessionToken, couponId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  const row = findRowBy_(POS.SHEETS.COUPONS, 'CouponID', couponId);
  if (!row) throw new Error('Coupon not found.');
  if (number_(row.UsedCount) > 0) {
    updateRowObject_(POS.SHEETS.COUPONS, row._row, {Active:false,UpdatedAt:new Date()});
    audit_(user.UserID, 'DEACTIVATE_USED_COUPON', 'Coupon', couponId, {});
    return {success:true,deactivated:true};
  }
  getSheet_(POS.SHEETS.COUPONS).deleteRow(row._row);
  audit_(user.UserID, 'DELETE_COUPON', 'Coupon', couponId, {});
  return {success:true,deleted:true};
}

function listAuditLogs(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  filters = filters || {};
  const query = sanitizeText_(filters.query, 160).toLowerCase();
  const range = reportRange_(filters.from, filters.to);
  const users = {};
  getRows_(POS.SHEETS.USERS).forEach(function(u){users[String(u.UserID)] = String(u.Name || u.LoginID || u.UserID);});
  return getRows_(POS.SHEETS.AUDIT)
    .filter(function(row){
      const d = reportDate_(row.DateTime);
      if (!d || d < range.from || d > range.to) return false;
      const hay = [row.Action,row.Entity,row.EntityID,row.DetailsJSON,users[String(row.UserID)]].join(' ').toLowerCase();
      return !query || hay.indexOf(query) >= 0;
    })
    .sort(function(a,b){return new Date(b.DateTime)-new Date(a.DateTime);})
    .slice(0,1000)
    .map(function(row){
      return {auditId:String(row.AuditID||''),dateTime:new Date(row.DateTime).toISOString(),userName:users[String(row.UserID)]||String(row.UserID||''),action:String(row.Action||''),entity:String(row.Entity||''),entityId:String(row.EntityID||''),details:String(row.DetailsJSON||'')};
    });
}

function deleteCustomer(sessionToken, customerId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (!customer) throw new Error('Customer not found.');
  const hasSales = getRows_(POS.SHEETS.SALES).some(function(r){return String(r.CustomerID||'')===String(customerId);});
  const hasReceivables = getRows_(POS.SHEETS.RECEIVABLES).some(function(r){return String(r.CustomerID||'')===String(customerId) && number_(r.BalanceUSD)>0.000001;});
  const hasPayments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).some(function(r){return String(r.CustomerID||'')===String(customerId);});
  if (hasSales || hasReceivables || hasPayments) {
    throw new Error('This customer has transaction history and cannot be deleted. Turn the customer inactive instead.');
  }
  getSheet_(POS.SHEETS.CUSTOMERS).deleteRow(customer._row);
  audit_(user.UserID, 'DELETE_CUSTOMER', 'Customer', customerId, {name:customer.Name});
  return {success:true};
}
