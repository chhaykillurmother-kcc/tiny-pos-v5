function normalizeCouponCode_(value) {
  return sanitizeText_(value, 40).toUpperCase().replace(/\s+/g, '');
}

function findCouponByCode_(code) {
  const normalized = normalizeCouponCode_(code);
  if (!normalized) return null;
  return getRows_(POS.SHEETS.COUPONS).find(function(row) {
    return normalizeCouponCode_(row.Code) === normalized;
  }) || null;
}

function calculateCouponDiscount_(code, eligibleSubtotalUSD, atDate) {
  const normalized = normalizeCouponCode_(code);
  const empty = {code:'',descriptionEN:'',descriptionKH:'',discountUSD:0};
  if (!normalized) return empty;

  const coupon = findCouponByCode_(normalized);
  if (!coupon || !bool_(coupon.Active)) {
    throw new Error('Coupon code is invalid or inactive.');
  }

  const now = atDate instanceof Date ? atDate : new Date();
  const start = coupon.StartDate ? new Date(coupon.StartDate) : null;
  const end = coupon.EndDate ? new Date(coupon.EndDate) : null;
  if (start && !isNaN(start.getTime()) && now < start) {
    throw new Error('This coupon is not active yet.');
  }
  if (end && !isNaN(end.getTime())) {
    // Date-only coupons remain valid through the selected day; datetime coupons expire exactly at the selected time.
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 && end.getMilliseconds() === 0) {
      end.setHours(23,59,59,999);
    }
    if (now > end) throw new Error('This coupon has expired.');
  }

  const usageLimit = Math.max(0, Math.floor(number_(coupon.UsageLimit)));
  const usedCount = Math.max(0, Math.floor(number_(coupon.UsedCount)));
  if (usageLimit > 0 && usedCount >= usageLimit) {
    throw new Error('This coupon has reached its usage limit.');
  }

  const subtotal = Math.max(0, roundMoney_(eligibleSubtotalUSD));
  const minimum = Math.max(0, roundMoney_(coupon.MinSpendUSD));
  if (subtotal + 0.000001 < minimum) {
    throw new Error('Minimum spend for this coupon is $' + minimum.toFixed(2) + '.');
  }

  const type = String(coupon.DiscountType || 'PERCENT').toUpperCase();
  const value = Math.max(0, number_(coupon.DiscountValue));
  let discount = type === 'FIXED'
    ? value
    : subtotal * Math.min(100, value) / 100;

  const maxDiscount = Math.max(0, number_(coupon.MaxDiscountUSD));
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  discount = Math.min(subtotal, roundMoney_(discount));

  return {
    code: normalized,
    descriptionEN: String(coupon.DescriptionEN || normalized),
    descriptionKH: String(coupon.DescriptionKH || coupon.DescriptionEN || normalized),
    discountUSD: discount
  };
}

function incrementCouponUsageLocked_(code) {
  const coupon = findCouponByCode_(code);
  if (!coupon) return;
  updateRowObject_(POS.SHEETS.COUPONS, coupon._row, {
    UsedCount: Math.max(0, Math.floor(number_(coupon.UsedCount))) + 1,
    UpdatedAt: new Date()
  });
}

function listCoupons(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  return getRows_(POS.SHEETS.COUPONS).map(function(row) {
    return {
      couponId:String(row.CouponID), code:String(row.Code || ''),
      descriptionEN:String(row.DescriptionEN || ''), descriptionKH:String(row.DescriptionKH || ''),
      discountType:String(row.DiscountType || 'PERCENT'), discountValue:number_(row.DiscountValue),
      minSpendUSD:number_(row.MinSpendUSD), maxDiscountUSD:number_(row.MaxDiscountUSD),
      startDate:row.StartDate ? new Date(row.StartDate).toISOString() : '',
      endDate:row.EndDate ? new Date(row.EndDate).toISOString() : '',
      usageLimit:number_(row.UsageLimit), usedCount:number_(row.UsedCount), active:bool_(row.Active)
    };
  });
}
