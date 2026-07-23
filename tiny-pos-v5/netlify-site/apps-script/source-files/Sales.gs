function validateCart_(payload) {
  payload = payload || {};

  const branchId = sanitizeText_(payload.branchId,80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  if (!requestedItems.length) throw new Error('The cart is empty.');

  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) { productMap[String(row.ProductID)] = row; });
  const unitMap = getUnitMap_();

  const items = [];
  let subtotal = 0;

  requestedItems.forEach(function(requested) {
    const product = productMap[String(requested.productId)];
    if (!product || !bool_(product.Active)) throw new Error('A product in the cart is unavailable.');

    const unit = unitMap[String(product.UnitID || '')] || {};
    let qty = number_(requested.qty);
    if (qty <= 0) throw new Error('Product quantity must be greater than zero.');
    if (unit.allowDecimal !== true && Math.abs(qty - Math.round(qty)) > 0.000001) {
      throw new Error((product.NameEN || product.NameKH) + ' must use a whole-number quantity.');
    }
    qty = unit.allowDecimal === true ? Math.round(qty * 1000) / 1000 : Math.round(qty);

    if (getBranchStockQty_(branchId, product.ProductID) + 0.000001 < qty) {
      throw new Error((product.NameEN || product.NameKH) + ' has insufficient stock.');
    }

    const unitPrice = roundMoney_(number_(product.PriceUSD));
    const lineTotal = roundMoney_(unitPrice * qty);
    subtotal = roundMoney_(subtotal + lineTotal);

    items.push({
      productId: String(product.ProductID),
      barcode: String(product.Barcode || ''),
      productName: String(product.NameEN || product.NameKH || ''),
      qty: qty,
      unitId: String(product.UnitID || ''),
      unitName: String(unit.abbreviation || unit.nameEN || unit.nameKH || ''),
      allowDecimal: unit.allowDecimal === true,
      unitCostUSD: roundMoney_(number_(product.CostUSD)),
      unitPriceUSD: unitPrice,
      discountUSD: 0,
      lineTotalUSD: lineTotal,
      productRow: product
    });
  });

  const customerId = sanitizeText_(payload.customerId, 80);
  let customer = null;
  if (customerId) {
    customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
    if (!customer || !bool_(customer.Active)) throw new Error('The selected customer is unavailable.');
  }

  const settings = getSettings_();
  const exchangeRate = number_(payload.exchangeRate, number_(settings.EXCHANGE_RATE, 4100));
  if (exchangeRate <= 0) throw new Error('Exchange rate is invalid.');

  let manualDiscountType = String(payload.manualDiscountType || '').trim().toUpperCase();
  let manualDiscountValue = 0;
  let manualDiscountPercent = 0;
  let manualDiscountUSD = 0;

  if (manualDiscountType === 'FIXED') {
    manualDiscountValue = Math.max(0, roundMoney_(number_(payload.manualDiscountValue, payload.discountUSD)));
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0 ? Math.round(manualDiscountUSD / subtotal * 10000) / 100 : 0;
  } else if (
    manualDiscountType === 'PERCENT' ||
    payload.manualDiscountValue !== undefined ||
    payload.manualDiscountPercent !== undefined
  ) {
    manualDiscountType = 'PERCENT';
    manualDiscountValue = Math.min(100, Math.max(0, number_(payload.manualDiscountValue, payload.manualDiscountPercent)));
    manualDiscountValue = Math.round(manualDiscountValue * 100) / 100;
    manualDiscountPercent = manualDiscountValue;
    manualDiscountUSD = roundMoney_(subtotal * manualDiscountPercent / 100);
  } else {
    manualDiscountType = 'FIXED';
    manualDiscountValue = Math.max(0, roundMoney_(number_(payload.discountUSD)));
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0 ? Math.round(manualDiscountUSD / subtotal * 10000) / 100 : 0;
  }

  const afterManualDiscount = roundMoney_(subtotal - manualDiscountUSD);
  const coupon = calculateCouponDiscount_(payload.couponCode, afterManualDiscount, new Date());
  const couponDiscountUSD = Math.min(afterManualDiscount, roundMoney_(number_(coupon.discountUSD)));
  const discountUSD = Math.min(subtotal, roundMoney_(manualDiscountUSD + couponDiscountUSD));
  const taxable = roundMoney_(subtotal - discountUSD);
  const taxRate = Math.max(0, number_(settings.TAX_RATE));
  const tax = roundMoney_(taxable * taxRate / 100);
  const totalUSD = roundMoney_(taxable + tax);
  const totalKHR = Math.round(totalUSD * exchangeRate);

  return {
    branchId: branchId,
    items: items,
    customerId: customerId,
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer ? String(customer.CustomerType || 'RETAIL').toUpperCase() : 'WALK-IN',
    customerCreditLimitUSD: customer ? roundMoney_(number_(customer.CreditLimitUSD)) : 0,
    customerCreditBalanceUSD: customer ? getCustomerOutstanding_(customerId) : 0,
    customerPaymentTermsDays: customer ? Math.max(0, Math.round(number_(customer.PaymentTermsDays, 30))) : 0,
    notes: sanitizeText_(payload.notes, 250),
    subtotalUSD: subtotal,
    manualDiscountType: manualDiscountType,
    manualDiscountValue: manualDiscountValue,
    manualDiscountPercent: manualDiscountPercent,
    manualDiscountUSD: manualDiscountUSD,
    couponCode: coupon.code,
    couponDescriptionEN: coupon.descriptionEN,
    couponDescriptionKH: coupon.descriptionKH,
    couponDiscountUSD: couponDiscountUSD,
    discountUSD: discountUSD,
    taxUSD: tax,
    totalUSD: totalUSD,
    totalKHR: totalKHR,
    exchangeRate: exchangeRate
  };
}

function previewCartPricing(sessionToken, payload) {
  const user=requireSession_(sessionToken);payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  const validated = validateCart_(payload);

  return {
    subtotalUSD: validated.subtotalUSD,
    manualDiscountType: validated.manualDiscountType,
    manualDiscountValue: validated.manualDiscountValue,
    manualDiscountPercent: validated.manualDiscountPercent,
    manualDiscountUSD: validated.manualDiscountUSD,
    couponCode: validated.couponCode,
    couponDescriptionEN: validated.couponDescriptionEN,
    couponDescriptionKH: validated.couponDescriptionKH,
    couponDiscountUSD: validated.couponDiscountUSD,
    discountUSD: validated.discountUSD,
    taxUSD: validated.taxUSD,
    totalUSD: validated.totalUSD,
    totalKHR: validated.totalKHR,
    exchangeRate: validated.exchangeRate
  };
}

function completeCashSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const paymentCurrency = String(
      payload.paymentCurrency || 'USD'
    ).toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';

    const received = number_(payload.receivedAmount);
    const required = paymentCurrency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    if (received + 0.000001 < required) {
      throw new Error(
        'Received cash is less than the invoice total.'
      );
    }

    const payment = {
      method: 'CASH',
      currency: paymentCurrency,
      amount: required,
      reference: '',
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      '',
      {pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : ''}
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    receipt.receivedAmount = received;
    receipt.changeAmount = paymentCurrency === 'KHR'
      ? Math.round(received - required)
      : roundMoney_(received - required);

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

/**
 * Temporary bank completion.
 * This records BANK as the payment method without generating KHQR.
 * Dynamic KHQR can be re-enabled later after the rest of the POS is stable.
 */
function completeBankSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload=payload||{};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const currency = String(
      payload.bankCurrency || 'USD'
    ).toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';

    const amount = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    const payment = {
      method: 'BANK',
      currency: currency,
      amount: amount,
      reference: sanitizeText_(
        payload.bankReference,
        120
      ),
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      '',
      {pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : ''}
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}


function completeCreditSale(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload = payload || {};payload.branchId=resolveSaleBranchForPayloadV38_(user,payload);
  let sale;

  sale = withScriptLock_(function() {
    const validated = validateCart_(payload);
    if (!validated.customerId) throw new Error('Select a customer before using credit.');
    const customer = findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',validated.customerId);
    if (!customer || !bool_(customer.Active)) throw new Error('Active customer was not found.');

    const pending = resolvePendingForCompletion_(user, payload.pendingId);
    const paidMethod = String(payload.paidMethod || 'CASH').toUpperCase() === 'BANK' ? 'BANK' : 'CASH';
    const paidCurrency = String(payload.paidCurrency || 'USD').toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const enteredPaid = Math.max(0, number_(payload.paidAmount));
    const paidNowUSD = paidCurrency === 'KHR'
      ? roundMoney_(enteredPaid / validated.exchangeRate)
      : roundMoney_(enteredPaid);

    if (paidNowUSD > validated.totalUSD + 0.005) {
      throw new Error('Paid-now amount cannot exceed the invoice total.');
    }
    const creditAmountUSD = roundMoney_(validated.totalUSD - paidNowUSD);
    if (creditAmountUSD <= 0.000001) {
      throw new Error('Use Cash or Bank checkout when the invoice is fully paid.');
    }

    const currentBalance = getCustomerOutstanding_(validated.customerId);
    const limit = roundMoney_(number_(customer.CreditLimitUSD));
    const projected = roundMoney_(currentBalance + creditAmountUSD);
    const manager = [POS.ROLES.ADMIN, POS.ROLES.MANAGER].indexOf(user.Role) >= 0;
    const override = payload.overrideCredit === true && manager;

    if (!override) {
      if (limit <= 0) throw new Error('This customer does not have an approved credit limit.');
      if (projected > limit + 0.005) {
        throw new Error(
          'Credit limit exceeded. Current: $' + currentBalance.toFixed(2) +
          ', new credit: $' + creditAmountUSD.toFixed(2) +
          ', limit: $' + limit.toFixed(2) + '.'
        );
      }
    }

    const terms = Math.max(0, Math.round(number_(payload.paymentTermsDays, customer.PaymentTermsDays || 30)));
    let dueDate;
    if (payload.dueDate) {
      dueDate = new Date(String(payload.dueDate) + 'T23:59:59');
      if (isNaN(dueDate.getTime())) throw new Error('Due date is invalid.');
    } else {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + terms);
    }

    const payments = [];
    if (paidNowUSD > 0) {
      payments.push({
        method:paidMethod,
        currency:paidCurrency,
        amount:paidCurrency === 'KHR' ? Math.round(enteredPaid) : roundMoney_(enteredPaid),
        amountUSD:paidNowUSD,
        reference:sanitizeText_(payload.reference,120),
        status:POS.PAYMENT_STATUS.PAID
      });
    }

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payments,
      '',
      {
        pendingNo: pending ? String(pending.PendingNo || pending.InvoiceNo) : '',
        creditAmountUSD:creditAmountUSD,
        dueDate:dueDate,
        paymentTermsDays:terms,
        overrideCredit:override
      }
    );

    if (pending) markPendingCompletedLocked_(String(pending.PendingID), receipt.saleId, receipt.invoiceNo);
    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

function resolvePendingForCompletion_(user, pendingId) {
  const id = sanitizeText_(pendingId, 80);

  if (!id) {
    return null;
  }

  return getPendingInvoiceRowForUser_(user, id, true);
}

/*
 * The KHQR backend is retained for later use.
 * The current checkout interface does not call these functions.
 */
function createBankPaymentIntent(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  const validated = validateCart_(payload);
  const settings = getPublicSettings_();

  const currency = String(
    (payload && payload.bankCurrency) ||
    settings.khqr.currency ||
    'USD'
  ).toUpperCase() === 'KHR'
    ? 'KHR'
    : 'USD';

  const amount = currency === 'KHR'
    ? validated.totalKHR
    : validated.totalUSD;

  if (
    !settings.khqr.accountId ||
    !settings.khqr.merchantName
  ) {
    throw new Error(
      'KHQR account and merchant name are not configured in Settings.'
    );
  }

  return withScriptLock_(function() {
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );

    const invoiceNo = pending
      ? String(pending.InvoiceNo)
      : generateInvoiceNo_();

    const intentId = uuid_('PAY');
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() +
      settings.qrExpiryMinutes * 60 * 1000
    );

    appendObject_(POS.SHEETS.PAYMENT_INTENTS, {
      IntentID: intentId,
      InvoiceNo: invoiceNo,
      UserID: user.UserID,
      CustomerID: validated.customerId,
      CartJSON: JSON.stringify({
        items: validated.items.map(function(item) {
          return {
            productId: item.productId,
            qty: item.qty
          };
        }),
        notes: validated.notes,
        manualDiscountType:
          validated.manualDiscountType,
        manualDiscountValue:
          validated.manualDiscountValue,
        manualDiscountPercent:
          validated.manualDiscountPercent,
        couponCode: validated.couponCode,
        pendingId: pending
          ? String(pending.PendingID)
          : ''
      }),
      SubtotalUSD: validated.subtotalUSD,
      DiscountUSD: validated.discountUSD,
      TaxUSD: validated.taxUSD,
      TotalUSD: validated.totalUSD,
      TotalKHR: validated.totalKHR,
      ExchangeRate: validated.exchangeRate,
      Currency: currency,
      Amount: amount,
      Status: POS.PAYMENT_STATUS.PENDING,
      KHQRMD5: '',
      QRText: '',
      BankHash: '',
      CreatedAt: createdAt,
      ExpiresAt: expiresAt,
      SaleID: ''
    });

    audit_(
      user.UserID,
      'CREATE_PAYMENT_INTENT',
      'PaymentIntent',
      intentId,
      {
        invoiceNo: invoiceNo,
        amount: amount,
        currency: currency
      }
    );

    return {
      success: true,
      intentId: intentId,
      invoiceNo: invoiceNo,
      currency: currency,
      amount: amount,
      expiresAt: expiresAt.toISOString(),
      khqr: settings.khqr,
      bankAutoVerify: settings.bankAutoVerify,
      bankManualConfirm:
        settings.bankManualConfirm ||
        [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
          .indexOf(user.Role) >= 0
    };
  });
}

function attachKhqrToIntent(
  sessionToken,
  intentId,
  md5,
  qrText
) {
  const user = requireSession_(sessionToken);

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (
    !intent ||
    String(intent.UserID) !== String(user.UserID)
  ) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.Status) !== POS.PAYMENT_STATUS.PENDING
  ) {
    throw new Error('Payment intent is not pending.');
  }

  updateRowObject_(
    POS.SHEETS.PAYMENT_INTENTS,
    intent._row,
    {
      KHQRMD5: sanitizeText_(md5, 100),
      QRText: String(qrText || '').slice(0, 2000)
    }
  );

  return {success: true};
}

function checkBankPayment(sessionToken, intentId) {
  const user = requireSession_(sessionToken);

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (!intent) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.UserID) !== String(user.UserID) &&
    [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(user.Role) < 0
  ) {
    throw new Error(
      'You do not have access to this payment intent.'
    );
  }

  if (
    String(intent.Status) === POS.PAYMENT_STATUS.PAID &&
    intent.SaleID
  ) {
    return getSaleReceipt_(intent.SaleID);
  }

  if (
    new Date(intent.ExpiresAt).getTime() < Date.now()
  ) {
    updateRowObject_(
      POS.SHEETS.PAYMENT_INTENTS,
      intent._row,
      {Status: POS.PAYMENT_STATUS.EXPIRED}
    );

    return {
      paid: false,
      status: POS.PAYMENT_STATUS.EXPIRED,
      message: 'QR expired.'
    };
  }

  const token = PropertiesService
    .getScriptProperties()
    .getProperty('BAKONG_API_TOKEN');

  if (!token) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message: 'Automatic verification is not configured.'
    };
  }

  if (!intent.KHQRMD5) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message: 'KHQR is still being prepared.'
    };
  }

  const baseUrl = PropertiesService
    .getScriptProperties()
    .getProperty('BAKONG_API_BASE_URL') ||
    'https://api-bakong.nbc.gov.kh';

  const response = UrlFetchApp.fetch(
    baseUrl.replace(/\/$/, '') +
    '/v1/check_transaction_by_md5',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token
      },
      payload: JSON.stringify({
        md5: String(intent.KHQRMD5)
      }),
      muteHttpExceptions: true
    }
  );

  const body = safeJsonParse_(
    response.getContentText(),
    {}
  );

  if (
    body.responseCode !== 0 ||
    !body.data
  ) {
    return {
      paid: false,
      status: POS.PAYMENT_STATUS.PENDING,
      message:
        body.responseMessage ||
        'Payment not found yet.'
    };
  }

  const paidCurrency = String(
    body.data.currency || ''
  ).toUpperCase();

  const paidAmount = number_(body.data.amount);
  const expectedCurrency = String(
    intent.Currency
  ).toUpperCase();

  const expectedAmount = number_(intent.Amount);
  const tolerance = expectedCurrency === 'KHR'
    ? 0.5
    : 0.005;

  if (
    paidCurrency !== expectedCurrency ||
    Math.abs(paidAmount - expectedAmount) > tolerance
  ) {
    audit_(
      user.UserID,
      'BANK_PAYMENT_MISMATCH',
      'PaymentIntent',
      intent.IntentID,
      {
        expectedCurrency: expectedCurrency,
        expectedAmount: expectedAmount,
        paidCurrency: paidCurrency,
        paidAmount: paidAmount
      }
    );

    throw new Error(
      'Bank payment amount or currency does not match this invoice.'
    );
  }

  return finalizeBankIntent_(
    user,
    intent,
    String(body.data.hash || ''),
    'BAKONG_AUTO'
  );
}

function manualConfirmBankPayment(
  sessionToken,
  intentId,
  reference
) {
  const user = requireSession_(sessionToken);
  const settings = getPublicSettings_();

  if (!settings.bankManualConfirm) {
    requireRole_(
      user,
      [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
    );
  }

  const intent = findRowBy_(
    POS.SHEETS.PAYMENT_INTENTS,
    'IntentID',
    intentId
  );

  if (!intent) {
    throw new Error('Payment intent not found.');
  }

  if (
    String(intent.Status) !== POS.PAYMENT_STATUS.PENDING
  ) {
    throw new Error('Payment intent is not pending.');
  }

  return finalizeBankIntent_(
    user,
    intent,
    sanitizeText_(reference, 120),
    'BANK_MANUAL'
  );
}

function finalizeBankIntent_(
  user,
  intent,
  bankHash,
  source
) {
  let sale;

  sale = withScriptLock_(function() {
    const latestIntent = findRowBy_(
      POS.SHEETS.PAYMENT_INTENTS,
      'IntentID',
      intent.IntentID
    );

    if (
      String(latestIntent.Status) === POS.PAYMENT_STATUS.PAID &&
      latestIntent.SaleID
    ) {
      return getSaleReceipt_(latestIntent.SaleID);
    }

    const cart = safeJsonParse_(
      latestIntent.CartJSON,
      {}
    );

    const validated = validateCart_({
      items: cart.items,
      customerId: latestIntent.CustomerID,
      notes: cart.notes,
      manualDiscountType:
        cart.manualDiscountType,
      manualDiscountValue:
        cart.manualDiscountValue,
      manualDiscountPercent:
        cart.manualDiscountPercent,
      couponCode: cart.couponCode,
      discountUSD: latestIntent.DiscountUSD,
      exchangeRate: latestIntent.ExchangeRate
    });

    const payment = {
      method: 'BANK',
      currency: String(latestIntent.Currency),
      amount: number_(latestIntent.Amount),
      reference: bankHash,
      khqrMd5: String(
        latestIntent.KHQRMD5 || ''
      ),
      bankHash: bankHash,
      status: POS.PAYMENT_STATUS.PAID
    };

    const receipt = createCompletedSaleLocked_(
      user,
      validated,
      payment,
      String(latestIntent.InvoiceNo)
    );

    updateRowObject_(
      POS.SHEETS.PAYMENT_INTENTS,
      latestIntent._row,
      {
        Status: POS.PAYMENT_STATUS.PAID,
        BankHash: bankHash,
        SaleID: receipt.saleId
      }
    );

    if (cart.pendingId) {
      markPendingCompletedLocked_(
        cart.pendingId,
        receipt.saleId,
        receipt.invoiceNo
      );
    }

    audit_(
      user.UserID,
      'CONFIRM_BANK_PAYMENT',
      'PaymentIntent',
      latestIntent.IntentID,
      {
        source: source,
        bankHash: bankHash,
        saleId: receipt.saleId
      }
    );

    return receipt;
  });

  notifySaleToTelegram_(sale, user);
  return sale;
}

function createCompletedSale_(
  user,
  validated,
  payment,
  invoiceNo
) {
  return withScriptLock_(function() {
    return createCompletedSaleLocked_(
      user,
      validateCart_({
        items: validated.items.map(function(item) {
          return {
            productId: item.productId,
            qty: item.qty
          };
        }),
        customerId: validated.customerId,
        notes: validated.notes,
        manualDiscountType:
          validated.manualDiscountType,
        manualDiscountValue:
          validated.manualDiscountValue,
        manualDiscountPercent:
          validated.manualDiscountPercent,
        couponCode: validated.couponCode,
        discountUSD: validated.discountUSD,
        exchangeRate: validated.exchangeRate,
        branchId: validated.branchId
      }),
      payment,
      invoiceNo
    );
  });
}

function createCompletedSaleLocked_(user, validated, payment, invoiceNo, saleOptions) {
  saleOptions = saleOptions || {};
  const payments = (Array.isArray(payment) ? payment : [payment]).filter(function(p){return p && number_(p.amount)>0;});
  const saleId=uuid_('SAL'), finalInvoiceNo=invoiceNo||generateInvoiceNo_(), now=new Date(), shift=getOpenShiftForUser_(user.UserID);
  const branchId=resolveAccessibleBranchId_(user, validated.branchId, false);
  let amountPaidUSD=0;
  payments.forEach(function(p){amountPaidUSD += p.amountUSD!==undefined?number_(p.amountUSD):(String(p.currency||'USD').toUpperCase()==='KHR'?number_(p.amount)/validated.exchangeRate:number_(p.amount));});
  amountPaidUSD=Math.min(validated.totalUSD,roundMoney_(amountPaidUSD));
  const creditAmountUSD=saleOptions.creditAmountUSD!==undefined?roundMoney_(number_(saleOptions.creditAmountUSD)):roundMoney_(Math.max(0,validated.totalUSD-amountPaidUSD));
  if(creditAmountUSD < -0.005 || amountPaidUSD+creditAmountUSD > validated.totalUSD+0.01)throw new Error('Payment and credit amounts do not match the invoice total.');
  const dueDate=saleOptions.dueDate?new Date(saleOptions.dueDate):'',paymentTermsDays=Math.max(0,Math.round(number_(saleOptions.paymentTermsDays,validated.customerPaymentTermsDays)));
  const paymentMethod=creditAmountUSD>0?(payments.length?String(payments[0].method||'CASH').toUpperCase()+'+CREDIT':'CREDIT'):(payments.length?String(payments[0].method||'CASH').toUpperCase():'CASH');
  const paymentStatus=creditAmountUSD>0?(amountPaidUSD>0?POS.PAYMENT_STATUS.PARTIAL:POS.PAYMENT_STATUS.UNPAID):POS.PAYMENT_STATUS.PAID;
  const productStates=validated.items.map(function(item){const product=findRowBy_(POS.SHEETS.PRODUCTS,'ProductID',item.productId);if(!product||!bool_(product.Active))throw new Error(item.productName+' is no longer available for sale.');const current=getBranchStockQty_(branchId,item.productId);if(current+0.0005<item.qty)throw new Error(item.productName+' has insufficient stock at this branch. Available: '+current+', required: '+item.qty);return {item:item,product:product,balance:Math.max(0,Math.round((current-item.qty)*1000)/1000)};});
  const fifoPlan=planFifoAllocationsLocked_(validated.items,branchId);
  appendObject_(POS.SHEETS.SALES,{SaleID:saleId,InvoiceNo:finalInvoiceNo,PendingNo:sanitizeText_(saleOptions.pendingNo,80),BranchID:branchId,DateTime:now,CustomerID:validated.customerId,CustomerName:validated.customerName,CustomerType:validated.customerType,SubtotalUSD:validated.subtotalUSD,DiscountUSD:validated.discountUSD,TaxUSD:validated.taxUSD,TotalUSD:validated.totalUSD,TotalKHR:validated.totalKHR,ExchangeRate:validated.exchangeRate,PaymentMethod:paymentMethod,PaymentStatus:paymentStatus,AmountPaidUSD:amountPaidUSD,CreditAmountUSD:creditAmountUSD,DueDate:dueDate||'',PaymentTermsDays:paymentTermsDays,CreditStatus:creditAmountUSD>0?'OPEN':'PAID',Status:POS.SALE_STATUS.COMPLETED,CashierID:user.UserID,CashierName:user.Name,ShiftID:shift?shift.ShiftID:'',Notes:validated.notes,CreatedAt:now,ManualDiscountType:validated.manualDiscountType,ManualDiscountValue:validated.manualDiscountValue,ManualDiscountPercent:validated.manualDiscountPercent,ManualDiscountUSD:validated.manualDiscountUSD,CouponCode:validated.couponCode,CouponDiscountUSD:validated.couponDiscountUSD});
  const saleItems=[],movements=[],refs=[];
  productStates.forEach(function(state,index){const item=state.item,costPlan=fifoPlan.itemPlans[index],saleItemId=uuid_('ITM'),share=validated.subtotalUSD>0?item.lineTotalUSD/validated.subtotalUSD:0,allocated=roundMoney_(validated.discountUSD*share),net=roundMoney_(item.lineTotalUSD-allocated),cost=roundMoney_(costPlan.totalCostUSD);saleItems.push({SaleItemID:saleItemId,SaleID:saleId,ProductID:item.productId,Barcode:item.barcode,ProductName:item.productName,Qty:item.qty,UnitID:item.unitId,UnitName:item.unitName,UnitCostUSD:costPlan.averageUnitCostUSD,UnitPriceUSD:item.unitPriceUSD,DiscountUSD:item.discountUSD,LineTotalUSD:item.lineTotalUSD,AllocatedSaleDiscountUSD:allocated,NetRevenueUSD:net,CostTotalUSD:cost,GrossProfitUSD:roundMoney_(net-cost)});movements.push({MovementID:uuid_('STK'),DateTime:now,BranchID:branchId,ProductID:item.productId,Type:'SALE',QtyIn:0,QtyOut:item.qty,BalanceAfter:state.balance,ReferenceType:'SALE',ReferenceID:saleId,UserID:user.UserID,Note:finalInvoiceNo,UnitCostUSD:costPlan.averageUnitCostUSD,CostInUSD:0,CostOutUSD:cost});refs.push({branchId:branchId,referenceType:'SALE',referenceId:saleItemId,userId:user.UserID,note:finalInvoiceNo+' / '+saleId});});
  applyFifoPlanLocked_(fifoPlan,refs);productStates.forEach(function(state){const summary=getFifoStockSummary_(state.item.productId,branchId);setBranchStockLocked_(branchId,state.item.productId,state.balance,summary.totalQty>0?summary.averageCostUSD:number_(state.product.CostUSD));});appendObjects_(POS.SHEETS.SALE_ITEMS,saleItems);appendObjects_(POS.SHEETS.STOCK,movements);
  payments.forEach(function(p){appendObject_(POS.SHEETS.PAYMENTS,{PaymentID:uuid_('PMT'),SaleID:saleId,Method:String(p.method||'CASH').toUpperCase(),Currency:String(p.currency||'USD').toUpperCase(),Amount:number_(p.amount),Reference:p.reference||'',KHQRMD5:p.khqrMd5||'',BankHash:p.bankHash||'',Status:p.status||POS.PAYMENT_STATUS.PAID,ReceivedBy:user.UserID,CreatedAt:now});});
  let receivableId='';if(creditAmountUSD>0){if(!validated.customerId)throw new Error('A customer is required for a credit sale.');receivableId=createReceivableLocked_({customerId:validated.customerId,saleId:saleId,invoiceNo:finalInvoiceNo,invoiceDate:now,dueDate:dueDate||new Date(now.getFullYear(),now.getMonth(),now.getDate()+paymentTermsDays),amountUSD:creditAmountUSD})||'';}
  incrementCouponUsageLocked_(validated.couponCode);
  audit_(user.UserID,'COMPLETE_SALE','Sale',saleId,{invoiceNo:finalInvoiceNo,pendingNo:saleOptions.pendingNo||'',branchId:branchId,totalUSD:validated.totalUSD,amountPaidUSD:amountPaidUSD,creditAmountUSD:creditAmountUSD,paymentMethod:paymentMethod,receivableId:receivableId,fifoCostUSD:roundMoney_(fifoPlan.itemPlans.reduce(function(sum,p){return sum+p.totalCostUSD;},0))});
  return buildReceipt_(saleId,finalInvoiceNo,now,user,validated,payments,{paymentMethod:paymentMethod,paymentStatus:paymentStatus,amountPaidUSD:amountPaidUSD,creditAmountUSD:creditAmountUSD,dueDate:dueDate?dueDate.toISOString():'',paymentTermsDays:paymentTermsDays,receivableId:receivableId,pendingNo:saleOptions.pendingNo||'',branchId:branchId});
}

function generateInvoiceNo_() {
  const key = dateKey_(new Date());
  const props = PropertiesService.getScriptProperties();
  const counterKey = 'INVOICE_COUNTER_' + key;

  const next =
    number_(props.getProperty(counterKey), 0) + 1;

  props.setProperty(counterKey, String(next));

  return 'INV-' +
    key +
    '-' +
    String(next).padStart(4, '0');
}

function buildReceipt_(
  saleId,
  invoiceNo,
  dateTime,
  user,
  validated,
  payments,
  creditInfo
) {
  const settings = getPublicSettings_();
  payments = Array.isArray(payments) ? payments : (payments ? [payments] : []);
  creditInfo = creditInfo || {};
  const firstPayment = payments[0] || {};

  return {
    isPending: false,
    paid: number_(creditInfo.creditAmountUSD) <= 0,
    status: creditInfo.paymentStatus || POS.PAYMENT_STATUS.PAID,
    saleId: saleId,
    invoiceNo: invoiceNo,
    dateTime: dateTime.toISOString(),
    cashierName: String(user.Name),
    customerId: validated.customerId,
    customerName: validated.customerName || 'Walk-in customer',
    customerType: validated.customerType || 'WALK-IN',
    items: validated.items.map(function(item) {
      return {
        productId: item.productId,
        name: item.productName,
        qty: item.qty,
        unitId: item.unitId || '',
        unitName: item.unitName || '',
        unitPriceUSD: item.unitPriceUSD,
        lineTotalUSD: item.lineTotalUSD
      };
    }),
    subtotalUSD: validated.subtotalUSD,
    manualDiscountType: validated.manualDiscountType,
    manualDiscountValue: validated.manualDiscountValue,
    manualDiscountPercent: validated.manualDiscountPercent,
    manualDiscountUSD: validated.manualDiscountUSD,
    couponCode: validated.couponCode,
    couponDiscountUSD: validated.couponDiscountUSD,
    discountUSD: validated.discountUSD,
    taxUSD: validated.taxUSD,
    totalUSD: validated.totalUSD,
    totalKHR: validated.totalKHR,
    exchangeRate: validated.exchangeRate,
    paymentMethod: creditInfo.paymentMethod || firstPayment.method || 'CASH',
    paymentStatus: creditInfo.paymentStatus || POS.PAYMENT_STATUS.PAID,
    payments: payments.map(function(p) {
      return {
        method:String(p.method||''),
        currency:String(p.currency||'USD'),
        amount:number_(p.amount),
        reference:String(p.reference||'')
      };
    }),
    paymentCurrency: firstPayment.currency || 'USD',
    paymentAmount: number_(firstPayment.amount),
    reference: firstPayment.reference || '',
    amountPaidUSD: roundMoney_(number_(creditInfo.amountPaidUSD, validated.totalUSD)),
    creditAmountUSD: roundMoney_(number_(creditInfo.creditAmountUSD)),
    dueDate: creditInfo.dueDate || '',
    paymentTermsDays: number_(creditInfo.paymentTermsDays),
    receivableId: creditInfo.receivableId || '',
    notes: validated.notes,
    shop: settings
  };
}

function getSaleReceipt_(saleId) {
  const sale = findRowBy_(POS.SHEETS.SALES, 'SaleID', saleId);
  if (!sale) throw new Error('Sale not found.');

  const items = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) { return String(row.SaleID) === String(saleId); });

  const payments = getRows_(POS.SHEETS.PAYMENTS)
    .filter(function(row) { return String(row.SaleID) === String(saleId); })
    .map(function(row) {
      return {
        method:String(row.Method||''),
        currency:String(row.Currency||'USD'),
        amount:number_(row.Amount),
        reference:String(row.Reference||''),
        status:String(row.Status||'')
      };
    });

  const user = findRowBy_(POS.SHEETS.USERS, 'UserID', sale.CashierID) || {Name:sale.CashierName};
  const customer = sale.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',sale.CustomerID)
    : null;

  return buildReceipt_(
    sale.SaleID,
    sale.InvoiceNo,
    new Date(sale.DateTime),
    user,
    {
      customerId: sale.CustomerID,
      customerName: String(sale.CustomerName || (customer ? customer.Name : '') || 'Walk-in customer'),
      customerType: String(sale.CustomerType || (customer ? customer.CustomerType : '') || 'WALK-IN'),
      items: items.map(function(row) {
        return {
          productId: row.ProductID,
          productName: row.ProductName,
          qty: number_(row.Qty),
          unitId:String(row.UnitID||''),
          unitName:String(row.UnitName||''),
          unitPriceUSD: number_(row.UnitPriceUSD),
          lineTotalUSD: number_(row.LineTotalUSD)
        };
      }),
      subtotalUSD: number_(sale.SubtotalUSD),
      manualDiscountType: storedManualDiscountType_(sale),
      manualDiscountValue: storedManualDiscountValue_(sale),
      manualDiscountPercent: number_(sale.ManualDiscountPercent),
      manualDiscountUSD: number_(sale.ManualDiscountUSD),
      couponCode: String(sale.CouponCode || ''),
      couponDiscountUSD: number_(sale.CouponDiscountUSD),
      discountUSD: number_(sale.DiscountUSD),
      taxUSD: number_(sale.TaxUSD),
      totalUSD: number_(sale.TotalUSD),
      totalKHR: number_(sale.TotalKHR),
      exchangeRate: number_(sale.ExchangeRate),
      notes: String(sale.Notes || '')
    },
    payments,
    {
      paymentMethod:String(sale.PaymentMethod||''),
      paymentStatus:String(sale.PaymentStatus||''),
      amountPaidUSD:number_(sale.AmountPaidUSD, number_(sale.TotalUSD)),
      creditAmountUSD:number_(sale.CreditAmountUSD),
      dueDate:reportDate_(sale.DueDate) ? reportDate_(sale.DueDate).toISOString() : '',
      paymentTermsDays:number_(sale.PaymentTermsDays),
      receivableId:(findRowBy_(POS.SHEETS.RECEIVABLES,'SaleID',saleId)||{}).ReceivableID || ''
    }
  );
}

/**
 * Reads the discount mode from current or older stored rows.
 * Older fixed-discount sales did not have ManualDiscountType/Value columns.
 */
function storedManualDiscountType_(row) {
  row = row || {};

  const explicit = String(
    row.ManualDiscountType || ''
  ).trim().toUpperCase();

  if (explicit === 'FIXED' || explicit === 'PERCENT') {
    return explicit;
  }

  const percentCell = row.ManualDiscountPercent;
  const hasPercent =
    percentCell !== '' &&
    percentCell !== undefined &&
    percentCell !== null;

  if (!hasPercent && number_(row.ManualDiscountUSD) > 0) {
    return 'FIXED';
  }

  return 'PERCENT';
}

function storedManualDiscountValue_(row) {
  row = row || {};

  const explicitValue = row.ManualDiscountValue;

  if (
    explicitValue !== '' &&
    explicitValue !== undefined &&
    explicitValue !== null
  ) {
    return number_(explicitValue);
  }

  return storedManualDiscountType_(row) === 'FIXED'
    ? number_(row.ManualDiscountUSD)
    : number_(row.ManualDiscountPercent);
}

