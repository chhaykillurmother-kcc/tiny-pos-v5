/**
 * Tiny POS Product Packaging v4.1 — package-aware sale, pending invoice,
 * receipt and customer-return endpoints.
 *
 * Inventory/FIFO quantities always use the product base unit. The additional
 * package columns preserve what the cashier actually sold (Can, Box, Bag...).
 */

function roundQtyV41_(value) {
  return Math.round(number_(value) * 1000) / 1000;
}

function roundCostV41_(value) {
  return Math.round(number_(value) * 1000000) / 1000000;
}

function validatePackageCartV41_(user, payload) {
  payload = payload || {};
  const branchId = resolveSaleBranchForPayloadV38_(user, payload);
  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  if (!requestedItems.length) throw new Error('The cart is empty.');

  const productRows = getRows_(POS.SHEETS.PRODUCTS);
  const productMap = {};
  productRows.forEach(function(row) {
    productMap[String(row.ProductID)] = row;
  });
  const unitMap = getUnitMap_();
  const packages = packageMapV41_(false);
  const requiredByProduct = {};
  const items = [];
  let subtotal = 0;

  requestedItems.forEach(function(requested) {
    const product = productMap[String(requested.productId)];
    if (!product || !bool_(product.Active)) {
      throw new Error('A product in the cart is unavailable.');
    }

    const selected = resolvePackageV41_(
      product,
      requested.packageId,
      'SALE',
      packages
    );

    let sellQty = roundQtyV41_(requested.qty);
    if (sellQty <= 0) {
      throw new Error('Product quantity must be greater than zero.');
    }

    if (
      selected.allowDecimal !== true &&
      Math.abs(sellQty - Math.round(sellQty)) > 0.000001
    ) {
      throw new Error(
        (product.NameEN || product.NameKH) +
        ' must use a whole-number ' + selected.unitName + ' quantity.'
      );
    }
    sellQty = selected.allowDecimal === true
      ? sellQty
      : Math.round(sellQty);

    const baseUnit = unitMap[String(product.UnitID || '')] || {};
    let baseQty = roundQtyV41_(sellQty * number_(selected.factor, 1));
    if (
      baseUnit.allowDecimal !== true &&
      Math.abs(baseQty - Math.round(baseQty)) > 0.000001
    ) {
      throw new Error(
        (product.NameEN || product.NameKH) +
        ': the selected package conversion does not produce a whole base-unit quantity.'
      );
    }
    baseQty = baseUnit.allowDecimal === true
      ? baseQty
      : Math.round(baseQty);

    requiredByProduct[String(product.ProductID)] = roundQtyV41_(
      number_(requiredByProduct[String(product.ProductID)]) + baseQty
    );

    const sellUnitPriceUSD = roundMoney_(number_(selected.priceUSD));
    const lineTotalUSD = roundMoney_(sellUnitPriceUSD * sellQty);
    subtotal = roundMoney_(subtotal + lineTotalUSD);

    items.push({
      productId: String(product.ProductID),
      barcode: String(product.Barcode || ''),
      productCode: String(product.ProductCode || ''),
      productName: String(product.NameEN || product.NameKH || ''),
      qty: baseQty,
      baseQty: baseQty,
      sellQty: sellQty,
      packageId: String(selected.packageId || ''),
      unitsPerSellUnit: number_(selected.factor, 1),
      sellUnitId: String(selected.unitId || product.UnitID || ''),
      sellUnitName: String(selected.unitName || ''),
      sellBarcode: String(selected.barcode || product.Barcode || ''),
      unitId: String(product.UnitID || ''),
      unitName: String(
        baseUnit.abbreviation || baseUnit.nameEN || baseUnit.nameKH || ''
      ),
      allowDecimal: baseUnit.allowDecimal === true,
      unitCostUSD: roundCostV41_(number_(product.CostUSD)),
      unitPriceUSD: baseQty > 0
        ? roundCostV41_(lineTotalUSD / baseQty)
        : 0,
      sellUnitPriceUSD: sellUnitPriceUSD,
      discountUSD: 0,
      lineTotalUSD: lineTotalUSD,
      productRow: product
    });
  });

  Object.keys(requiredByProduct).forEach(function(productId) {
    const product = productMap[productId];
    const available = getBranchStockQty_(branchId, productId);
    const required = requiredByProduct[productId];
    if (available + 0.000001 < required) {
      throw new Error(
        String(product.NameEN || product.NameKH || productId) +
        ' has insufficient stock. Available: ' + available +
        ', required: ' + required + '.'
      );
    }
  });

  const customerId = sanitizeText_(payload.customerId, 80);
  let customer = null;
  if (customerId) {
    customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
    if (!customer || !bool_(customer.Active)) {
      throw new Error('The selected customer is unavailable.');
    }
  }

  const settings = getSettings_();
  const exchangeRate = number_(
    payload.exchangeRate,
    number_(settings.EXCHANGE_RATE, 4100)
  );
  if (exchangeRate <= 0) throw new Error('Exchange rate is invalid.');

  let manualDiscountType = String(
    payload.manualDiscountType || ''
  ).trim().toUpperCase();
  let manualDiscountValue = 0;
  let manualDiscountPercent = 0;
  let manualDiscountUSD = 0;

  if (manualDiscountType === 'FIXED') {
    manualDiscountValue = Math.max(
      0,
      roundMoney_(number_(payload.manualDiscountValue, payload.discountUSD))
    );
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0
      ? Math.round(manualDiscountUSD / subtotal * 10000) / 100
      : 0;
  } else if (
    manualDiscountType === 'PERCENT' ||
    payload.manualDiscountValue !== undefined ||
    payload.manualDiscountPercent !== undefined
  ) {
    manualDiscountType = 'PERCENT';
    manualDiscountValue = Math.min(
      100,
      Math.max(
        0,
        number_(payload.manualDiscountValue, payload.manualDiscountPercent)
      )
    );
    manualDiscountValue = Math.round(manualDiscountValue * 100) / 100;
    manualDiscountPercent = manualDiscountValue;
    manualDiscountUSD = roundMoney_(
      subtotal * manualDiscountPercent / 100
    );
  } else {
    manualDiscountType = 'FIXED';
    manualDiscountValue = Math.max(
      0,
      roundMoney_(number_(payload.discountUSD))
    );
    manualDiscountValue = Math.min(subtotal, manualDiscountValue);
    manualDiscountUSD = manualDiscountValue;
    manualDiscountPercent = subtotal > 0
      ? Math.round(manualDiscountUSD / subtotal * 10000) / 100
      : 0;
  }

  const afterManualDiscount = roundMoney_(subtotal - manualDiscountUSD);
  const coupon = calculateCouponDiscount_(
    payload.couponCode,
    afterManualDiscount,
    new Date()
  );
  const couponDiscountUSD = Math.min(
    afterManualDiscount,
    roundMoney_(number_(coupon.discountUSD))
  );
  const discountUSD = Math.min(
    subtotal,
    roundMoney_(manualDiscountUSD + couponDiscountUSD)
  );
  const taxable = roundMoney_(subtotal - discountUSD);
  const taxRate = Math.max(0, number_(settings.TAX_RATE));
  const taxUSD = roundMoney_(taxable * taxRate / 100);
  const totalUSD = roundMoney_(taxable + taxUSD);
  const totalKHR = Math.round(totalUSD * exchangeRate);

  return {
    branchId: branchId,
    items: items,
    requiredByProduct: requiredByProduct,
    customerId: customerId,
    customerName: customer
      ? String(customer.Name || '')
      : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL').toUpperCase()
      : 'WALK-IN',
    customerCreditLimitUSD: customer
      ? roundMoney_(number_(customer.CreditLimitUSD))
      : 0,
    customerCreditBalanceUSD: customer
      ? getCustomerOutstanding_(customerId)
      : 0,
    customerPaymentTermsDays: customer
      ? Math.max(0, Math.round(number_(customer.PaymentTermsDays, 30)))
      : 0,
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
    taxUSD: taxUSD,
    totalUSD: totalUSD,
    totalKHR: totalKHR,
    exchangeRate: exchangeRate
  };
}

function previewCartPricingV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const validated = validatePackageCartV41_(user, payload);
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

function completeCashSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );
    const currency = String(
      (payload && payload.paymentCurrency) || 'USD'
    ).toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const received = number_(payload && payload.receivedAmount);
    const required = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    if (received + 0.000001 < required) {
      throw new Error('Received cash is less than the invoice total.');
    }

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      {
        method: 'CASH',
        currency: currency,
        amount: required,
        reference: '',
        status: POS.PAYMENT_STATUS.PAID
      },
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : ''
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }

    result.receivedAmount = received;
    result.changeAmount = currency === 'KHR'
      ? Math.round(received - required)
      : roundMoney_(received - required);
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function completeBankSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pending = resolvePendingForCompletion_(
      user,
      payload && payload.pendingId
    );
    const currency = String(
      (payload && payload.bankCurrency) || 'USD'
    ).toUpperCase() === 'KHR' ? 'KHR' : 'USD';
    const amount = currency === 'KHR'
      ? validated.totalKHR
      : validated.totalUSD;

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      {
        method: 'BANK',
        currency: currency,
        amount: amount,
        reference: sanitizeText_(payload && payload.bankReference, 120),
        status: POS.PAYMENT_STATUS.PAID
      },
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : ''
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function completeCreditSaleV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  payload = payload || {};
  let receipt;

  receipt = withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    if (!validated.customerId) {
      throw new Error('Select a customer before using credit.');
    }

    const customer = findRowBy_(
      POS.SHEETS.CUSTOMERS,
      'CustomerID',
      validated.customerId
    );
    if (!customer || !bool_(customer.Active)) {
      throw new Error('Active customer was not found.');
    }

    const pending = resolvePendingForCompletion_(user, payload.pendingId);
    const paidMethod = String(payload.paidMethod || 'CASH').toUpperCase() === 'BANK'
      ? 'BANK'
      : 'CASH';
    const paidCurrency = String(payload.paidCurrency || 'USD').toUpperCase() === 'KHR'
      ? 'KHR'
      : 'USD';
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
    const manager = [POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(user.Role) >= 0;
    const override = payload.overrideCredit === true && manager;

    if (!override) {
      if (limit <= 0) {
        throw new Error('This customer does not have an approved credit limit.');
      }
      if (projected > limit + 0.005) {
        throw new Error(
          'Credit limit exceeded. Current: $' + currentBalance.toFixed(2) +
          ', new credit: $' + creditAmountUSD.toFixed(2) +
          ', limit: $' + limit.toFixed(2) + '.'
        );
      }
    }

    const terms = Math.max(
      0,
      Math.round(number_(
        payload.paymentTermsDays,
        customer.PaymentTermsDays || 30
      ))
    );
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
        method: paidMethod,
        currency: paidCurrency,
        amount: paidCurrency === 'KHR'
          ? Math.round(enteredPaid)
          : roundMoney_(enteredPaid),
        amountUSD: paidNowUSD,
        reference: sanitizeText_(payload.reference, 120),
        status: POS.PAYMENT_STATUS.PAID
      });
    }

    const result = createCompletedPackageSaleLockedV41_(
      user,
      validated,
      payments,
      '',
      {
        pendingNo: pending
          ? String(pending.PendingNo || pending.InvoiceNo)
          : '',
        creditAmountUSD: creditAmountUSD,
        dueDate: dueDate,
        paymentTermsDays: terms,
        overrideCredit: override
      }
    );

    if (pending) {
      markPendingCompletedLocked_(
        String(pending.PendingID),
        result.saleId,
        result.invoiceNo
      );
    }
    return result;
  });

  notifySaleToTelegram_(receipt, user);
  return receipt;
}

function createCompletedPackageSaleLockedV41_(
  user,
  validated,
  payment,
  invoiceNo,
  saleOptions
) {
  saleOptions = saleOptions || {};
  const payments = (Array.isArray(payment) ? payment : [payment])
    .filter(function(row) {
      return row && number_(row.amount) > 0;
    });
  const saleId = uuid_('SAL');
  const finalInvoiceNo = invoiceNo || generateInvoiceNo_();
  const now = new Date();
  const shift = getOpenShiftForUser_(user.UserID);
  const branchId = resolveAccessibleBranchId_(
    user,
    validated.branchId,
    false
  );

  let amountPaidUSD = 0;
  payments.forEach(function(row) {
    amountPaidUSD += row.amountUSD !== undefined
      ? number_(row.amountUSD)
      : (
          String(row.currency || 'USD').toUpperCase() === 'KHR'
            ? number_(row.amount) / validated.exchangeRate
            : number_(row.amount)
        );
  });
  amountPaidUSD = Math.min(
    validated.totalUSD,
    roundMoney_(amountPaidUSD)
  );

  const creditAmountUSD = saleOptions.creditAmountUSD !== undefined
    ? roundMoney_(number_(saleOptions.creditAmountUSD))
    : roundMoney_(Math.max(0, validated.totalUSD - amountPaidUSD));

  if (
    creditAmountUSD < -0.005 ||
    amountPaidUSD + creditAmountUSD > validated.totalUSD + 0.01
  ) {
    throw new Error('Payment and credit amounts do not match the invoice total.');
  }

  const dueDate = saleOptions.dueDate
    ? new Date(saleOptions.dueDate)
    : '';
  const paymentTermsDays = Math.max(
    0,
    Math.round(number_(
      saleOptions.paymentTermsDays,
      validated.customerPaymentTermsDays
    ))
  );
  const paymentMethod = creditAmountUSD > 0
    ? (
        payments.length
          ? String(payments[0].method || 'CASH').toUpperCase() + '+CREDIT'
          : 'CREDIT'
      )
    : (
        payments.length
          ? String(payments[0].method || 'CASH').toUpperCase()
          : 'CASH'
      );
  const paymentStatus = creditAmountUSD > 0
    ? (
        amountPaidUSD > 0
          ? POS.PAYMENT_STATUS.PARTIAL
          : POS.PAYMENT_STATUS.UNPAID
      )
    : POS.PAYMENT_STATUS.PAID;

  const products = {};
  const currentByProduct = {};
  Object.keys(validated.requiredByProduct || {}).forEach(function(productId) {
    const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
    if (!product || !bool_(product.Active)) {
      throw new Error('A product is no longer available for sale.');
    }
    const current = getBranchStockQty_(branchId, productId);
    const required = number_(validated.requiredByProduct[productId]);
    if (current + 0.0005 < required) {
      throw new Error(
        String(product.NameEN || product.NameKH || productId) +
        ' has insufficient stock at this branch. Available: ' + current +
        ', required: ' + required + '.'
      );
    }
    products[productId] = product;
    currentByProduct[productId] = current;
  });

  const fifoInput = validated.items.map(function(item) {
    return {
      productId: item.productId,
      qty: item.baseQty
    };
  });
  const fifoPlan = planFifoAllocationsLocked_(fifoInput, branchId);

  appendObject_(POS.SHEETS.SALES, {
    SaleID: saleId,
    InvoiceNo: finalInvoiceNo,
    PendingNo: sanitizeText_(saleOptions.pendingNo, 80),
    BranchID: branchId,
    DateTime: now,
    CustomerID: validated.customerId,
    CustomerName: validated.customerName,
    CustomerType: validated.customerType,
    SubtotalUSD: validated.subtotalUSD,
    DiscountUSD: validated.discountUSD,
    TaxUSD: validated.taxUSD,
    TotalUSD: validated.totalUSD,
    TotalKHR: validated.totalKHR,
    ExchangeRate: validated.exchangeRate,
    PaymentMethod: paymentMethod,
    PaymentStatus: paymentStatus,
    AmountPaidUSD: amountPaidUSD,
    CreditAmountUSD: creditAmountUSD,
    DueDate: dueDate || '',
    PaymentTermsDays: paymentTermsDays,
    CreditStatus: creditAmountUSD > 0 ? 'OPEN' : 'PAID',
    Status: POS.SALE_STATUS.COMPLETED,
    CashierID: user.UserID,
    CashierName: user.Name,
    ShiftID: shift ? shift.ShiftID : '',
    Notes: validated.notes,
    CreatedAt: now,
    ManualDiscountType: validated.manualDiscountType,
    ManualDiscountValue: validated.manualDiscountValue,
    ManualDiscountPercent: validated.manualDiscountPercent,
    ManualDiscountUSD: validated.manualDiscountUSD,
    CouponCode: validated.couponCode,
    CouponDiscountUSD: validated.couponDiscountUSD
  });

  const saleItems = [];
  const movements = [];
  const fifoReferences = [];
  const runningBalance = Object.assign({}, currentByProduct);

  validated.items.forEach(function(item, index) {
    const costPlan = fifoPlan.itemPlans[index];
    const saleItemId = uuid_('ITM');
    const share = validated.subtotalUSD > 0
      ? item.lineTotalUSD / validated.subtotalUSD
      : 0;
    const allocatedDiscount = roundMoney_(validated.discountUSD * share);
    const netRevenue = roundMoney_(
      item.lineTotalUSD - allocatedDiscount
    );
    const totalCost = roundMoney_(costPlan.totalCostUSD);
    runningBalance[item.productId] = roundQtyV41_(
      number_(runningBalance[item.productId]) - item.baseQty
    );

    saleItems.push({
      SaleItemID: saleItemId,
      SaleID: saleId,
      ProductID: item.productId,
      Barcode: item.barcode,
      ProductName: item.productName,
      Qty: item.baseQty,
      UnitID: item.unitId,
      UnitName: item.unitName,
      UnitCostUSD: costPlan.averageUnitCostUSD,
      UnitPriceUSD: item.unitPriceUSD,
      DiscountUSD: item.discountUSD,
      LineTotalUSD: item.lineTotalUSD,
      AllocatedSaleDiscountUSD: allocatedDiscount,
      NetRevenueUSD: netRevenue,
      CostTotalUSD: totalCost,
      GrossProfitUSD: roundMoney_(netRevenue - totalCost),
      SellPackageID: item.packageId,
      SellUnitName: item.sellUnitName,
      SellQty: item.sellQty,
      UnitsPerSellUnit: item.unitsPerSellUnit,
      SellBarcode: item.sellBarcode,
      SellUnitPriceUSD: item.sellUnitPriceUSD
    });

    movements.push({
      MovementID: uuid_('STK'),
      DateTime: now,
      BranchID: branchId,
      ProductID: item.productId,
      Type: 'SALE',
      QtyIn: 0,
      QtyOut: item.baseQty,
      BalanceAfter: Math.max(0, runningBalance[item.productId]),
      ReferenceType: 'SALE',
      ReferenceID: saleId,
      UserID: user.UserID,
      Note: finalInvoiceNo + ' / ' + item.sellQty + ' ' + item.sellUnitName,
      UnitCostUSD: costPlan.averageUnitCostUSD,
      CostInUSD: 0,
      CostOutUSD: totalCost
    });

    fifoReferences.push({
      branchId: branchId,
      referenceType: 'SALE',
      referenceId: saleItemId,
      userId: user.UserID,
      note: finalInvoiceNo + ' / ' + saleId
    });
  });

  applyFifoPlanLocked_(fifoPlan, fifoReferences);

  Object.keys(runningBalance).forEach(function(productId) {
    const summary = getFifoStockSummary_(productId, branchId);
    const product = products[productId] || {};
    setBranchStockLocked_(
      branchId,
      productId,
      Math.max(0, runningBalance[productId]),
      summary.totalQty > 0
        ? summary.averageCostUSD
        : number_(product.CostUSD)
    );
  });

  appendObjects_(POS.SHEETS.SALE_ITEMS, saleItems);
  appendObjects_(POS.SHEETS.STOCK, movements);

  payments.forEach(function(row) {
    appendObject_(POS.SHEETS.PAYMENTS, {
      PaymentID: uuid_('PMT'),
      SaleID: saleId,
      Method: String(row.method || 'CASH').toUpperCase(),
      Currency: String(row.currency || 'USD').toUpperCase(),
      Amount: number_(row.amount),
      Reference: row.reference || '',
      KHQRMD5: row.khqrMd5 || '',
      BankHash: row.bankHash || '',
      Status: row.status || POS.PAYMENT_STATUS.PAID,
      ReceivedBy: user.UserID,
      CreatedAt: now
    });
  });

  let receivableId = '';
  if (creditAmountUSD > 0) {
    if (!validated.customerId) {
      throw new Error('A customer is required for a credit sale.');
    }
    receivableId = createReceivableLocked_({
      customerId: validated.customerId,
      saleId: saleId,
      invoiceNo: finalInvoiceNo,
      invoiceDate: now,
      dueDate: dueDate || new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + paymentTermsDays
      ),
      amountUSD: creditAmountUSD
    }) || '';
  }

  incrementCouponUsageLocked_(validated.couponCode);
  audit_(user.UserID, 'COMPLETE_PACKAGE_SALE', 'Sale', saleId, {
    invoiceNo: finalInvoiceNo,
    pendingNo: saleOptions.pendingNo || '',
    branchId: branchId,
    totalUSD: validated.totalUSD,
    amountPaidUSD: amountPaidUSD,
    creditAmountUSD: creditAmountUSD,
    paymentMethod: paymentMethod,
    receivableId: receivableId,
    fifoCostUSD: roundMoney_(
      fifoPlan.itemPlans.reduce(function(sum, plan) {
        return sum + plan.totalCostUSD;
      }, 0)
    )
  });

  return buildPackageReceiptV41_(
    saleId,
    finalInvoiceNo,
    now,
    user,
    validated,
    payments,
    {
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      amountPaidUSD: amountPaidUSD,
      creditAmountUSD: creditAmountUSD,
      dueDate: dueDate ? dueDate.toISOString() : '',
      paymentTermsDays: paymentTermsDays,
      receivableId: receivableId,
      pendingNo: saleOptions.pendingNo || '',
      branchId: branchId
    }
  );
}

function packageReceiptItemV41_(item) {
  return {
    productId: String(item.productId || item.ProductID || ''),
    name: String(item.productName || item.ProductName || ''),
    qty: number_(
      item.sellQty !== undefined
        ? item.sellQty
        : (
            item.SellQty !== '' && item.SellQty !== undefined
              ? item.SellQty
              : item.qty !== undefined
                ? item.qty
                : item.Qty
          )
    ),
    baseQty: number_(item.baseQty !== undefined ? item.baseQty : item.Qty),
    packageId: String(item.packageId || item.SellPackageID || ''),
    unitsPerSellUnit: number_(
      item.unitsPerSellUnit !== undefined
        ? item.unitsPerSellUnit
        : item.UnitsPerSellUnit,
      1
    ),
    unitId: String(item.sellUnitId || item.UnitID || ''),
    unitName: String(
      item.sellUnitName || item.SellUnitName || item.UnitName || ''
    ),
    barcode: String(item.sellBarcode || item.SellBarcode || item.Barcode || ''),
    unitPriceUSD: number_(
      item.sellUnitPriceUSD !== undefined
        ? item.sellUnitPriceUSD
        : (
            item.SellUnitPriceUSD !== '' && item.SellUnitPriceUSD !== undefined
              ? item.SellUnitPriceUSD
              : item.unitPriceUSD !== undefined
                ? item.unitPriceUSD
                : item.UnitPriceUSD
          )
    ),
    lineTotalUSD: number_(item.lineTotalUSD !== undefined ? item.lineTotalUSD : item.LineTotalUSD)
  };
}

function buildPackageReceiptV41_(
  saleId,
  invoiceNo,
  dateTime,
  user,
  validated,
  payments,
  creditInfo
) {
  const receipt = buildReceipt_(
    saleId,
    invoiceNo,
    dateTime,
    user,
    validated,
    payments,
    creditInfo
  );
  receipt.items = validated.items.map(packageReceiptItemV41_);
  receipt.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return receipt;
}

function getReceiptV41(sessionToken, saleId) {
  const user = requireSession_(sessionToken);
  const sale = findRowBy_(POS.SHEETS.SALES, 'SaleID', saleId);
  if (!sale) throw new Error('Sale not found.');

  const rawItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    });
  const payments = getRows_(POS.SHEETS.PAYMENTS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    })
    .map(function(row) {
      return {
        method: String(row.Method || ''),
        currency: String(row.Currency || 'USD'),
        amount: number_(row.Amount),
        reference: String(row.Reference || ''),
        status: String(row.Status || '')
      };
    });
  const cashier = findRowBy_(POS.SHEETS.USERS, 'UserID', sale.CashierID) || {
    Name: sale.CashierName
  };
  const customer = sale.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', sale.CustomerID)
    : null;

  const validated = {
    customerId: String(sale.CustomerID || ''),
    customerName: String(
      sale.CustomerName || (customer ? customer.Name : '') || 'Walk-in customer'
    ),
    customerType: String(
      sale.CustomerType || (customer ? customer.CustomerType : '') || 'WALK-IN'
    ),
    items: rawItems.map(function(row) {
      return {
        productId: String(row.ProductID || ''),
        productName: String(row.ProductName || ''),
        baseQty: number_(row.Qty),
        sellQty: row.SellQty !== '' && row.SellQty !== undefined
          ? number_(row.SellQty)
          : number_(row.Qty),
        packageId: String(row.SellPackageID || ''),
        unitsPerSellUnit: number_(row.UnitsPerSellUnit, 1),
        sellUnitId: String(row.UnitID || ''),
        sellUnitName: String(row.SellUnitName || row.UnitName || ''),
        sellBarcode: String(row.SellBarcode || row.Barcode || ''),
        unitPriceUSD: number_(row.UnitPriceUSD),
        sellUnitPriceUSD:
          row.SellUnitPriceUSD !== '' && row.SellUnitPriceUSD !== undefined
            ? number_(row.SellUnitPriceUSD)
            : number_(row.UnitPriceUSD),
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
  };

  return buildPackageReceiptV41_(
    sale.SaleID,
    sale.InvoiceNo,
    new Date(sale.DateTime),
    cashier,
    validated,
    payments,
    {
      paymentMethod: String(sale.PaymentMethod || ''),
      paymentStatus: String(sale.PaymentStatus || ''),
      amountPaidUSD: number_(sale.AmountPaidUSD, number_(sale.TotalUSD)),
      creditAmountUSD: number_(sale.CreditAmountUSD),
      dueDate: reportDate_(sale.DueDate)
        ? reportDate_(sale.DueDate).toISOString()
        : '',
      paymentTermsDays: number_(sale.PaymentTermsDays),
      receivableId: (
        findRowBy_(POS.SHEETS.RECEIVABLES, 'SaleID', saleId) || {}
      ).ReceivableID || ''
    }
  );
}

function savePendingInvoiceV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  payload = payload || {};

  return withScriptLock_(function() {
    const validated = validatePackageCartV41_(user, payload);
    const pendingId = sanitizeText_(payload.pendingId, 80);
    const existing = pendingId
      ? getPendingInvoiceRowForUser_(user, pendingId, true)
      : null;
    const now = new Date();
    const preferred = normalizePreferredPayment_(payload.preferredPayment);
    const snapshot = {
      items: validated.items.map(function(item) {
        return {
          productId: item.productId,
          barcode: item.sellBarcode,
          name: item.productName,
          packageId: item.packageId,
          unitId: item.sellUnitId,
          unitName: item.sellUnitName,
          qty: item.sellQty,
          baseQty: item.baseQty,
          unitsPerSellUnit: item.unitsPerSellUnit,
          unitPriceUSD: item.sellUnitPriceUSD,
          lineTotalUSD: item.lineTotalUSD
        };
      }),
      notes: validated.notes
    };
    const changes = {
      BranchID: validated.branchId,
      DateTime: existing ? existing.DateTime : now,
      CustomerID: validated.customerId,
      CartJSON: JSON.stringify(snapshot),
      SubtotalUSD: validated.subtotalUSD,
      ManualDiscountType: validated.manualDiscountType,
      ManualDiscountValue: validated.manualDiscountValue,
      ManualDiscountPercent: validated.manualDiscountPercent,
      ManualDiscountUSD: validated.manualDiscountUSD,
      CouponCode: validated.couponCode,
      CouponDiscountUSD: validated.couponDiscountUSD,
      DiscountUSD: validated.discountUSD,
      TaxUSD: validated.taxUSD,
      TotalUSD: validated.totalUSD,
      TotalKHR: validated.totalKHR,
      ExchangeRate: validated.exchangeRate,
      PreferredPayment: preferred,
      Notes: validated.notes,
      Status: 'OPEN',
      CashierID: user.UserID,
      CashierName: user.Name,
      UpdatedAt: now
    };
    let row;
    if (existing) {
      updateRowObject_(CHECKOUT_FEATURE.PENDING_SHEET, existing._row, changes);
      row = Object.assign({}, existing, changes);
    } else {
      const pendingNo = generatePendingNo_();
      row = Object.assign({}, changes, {
        PendingID: uuid_('PND'),
        InvoiceNo: pendingNo,
        PendingNo: pendingNo,
        FinalInvoiceNo: '',
        SaleID: ''
      });
      appendObject_(CHECKOUT_FEATURE.PENDING_SHEET, row);
    }

    audit_(
      user.UserID,
      existing ? 'UPDATE_PENDING_PACKAGE_INVOICE' : 'CREATE_PENDING_PACKAGE_INVOICE',
      'PendingInvoice',
      row.PendingID,
      {
        pendingNo: row.PendingNo || row.InvoiceNo,
        totalUSD: validated.totalUSD
      }
    );
    return buildPendingPackageReceiptV41_(row);
  });
}

function getPendingInvoiceV41(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];
  const customer = row.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', row.CustomerID)
    : null;

  return {
    pendingId: String(row.PendingID),
    branchId: String(row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    customerId: String(row.CustomerID || ''),
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL')
      : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        packageId: String(item.packageId || ''),
        qty: number_(item.qty)
      };
    }),
    manualDiscountType: storedManualDiscountType_(row),
    manualDiscountValue: storedManualDiscountValue_(row),
    manualDiscountPercent: number_(row.ManualDiscountPercent),
    manualDiscountUSD: number_(row.ManualDiscountUSD),
    couponCode: String(row.CouponCode || ''),
    couponDiscountUSD: number_(row.CouponDiscountUSD),
    preferredPayment: normalizePreferredPayment_(row.PreferredPayment),
    notes: String(row.Notes || ''),
    receipt: buildPendingPackageReceiptV41_(row)
  };
}

function printPendingInvoiceV41(sessionToken, pendingId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'POS');
  const row = getPendingInvoiceRowForUser_(user, pendingId, true);
  return buildPendingPackageReceiptV41_(row);
}

function buildPendingPackageReceiptV41_(row) {
  const cart = safeJsonParse_(row.CartJSON, {});
  const items = Array.isArray(cart.items) ? cart.items : [];
  const settings = getPublicSettings_();
  const customer = row.CustomerID
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', row.CustomerID)
    : null;

  return {
    isPending: true,
    paid: false,
    status: 'PENDING',
    pendingId: String(row.PendingID),
    invoiceNo: String(row.PendingNo || row.InvoiceNo),
    dateTime: new Date(row.DateTime).toISOString(),
    cashierName: String(row.CashierName || ''),
    customerId: String(row.CustomerID || ''),
    customerName: customer ? String(customer.Name || '') : 'Walk-in customer',
    customerType: customer
      ? String(customer.CustomerType || 'RETAIL')
      : 'WALK-IN',
    items: items.map(function(item) {
      return {
        productId: String(item.productId || ''),
        name: String(item.name || ''),
        qty: number_(item.qty),
        baseQty: number_(item.baseQty, number_(item.qty)),
        packageId: String(item.packageId || ''),
        unitsPerSellUnit: number_(item.unitsPerSellUnit, 1),
        unitId: String(item.unitId || ''),
        unitName: String(item.unitName || ''),
        barcode: String(item.barcode || ''),
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
    preferredPayment: normalizePreferredPayment_(row.PreferredPayment),
    paymentCurrency: '',
    paymentAmount: 0,
    reference: '',
    notes: String(row.Notes || ''),
    shop: settings,
    productPackagingVersion: PRODUCT_PACKAGING_V41.VERSION
  };
}

function saleItemPackageMetaV41_(saleItem) {
  const factor = number_(saleItem.UnitsPerSellUnit, 1) || 1;
  const isPackage = String(saleItem.SellPackageID || '') !== '';
  return {
    packageId: String(saleItem.SellPackageID || ''),
    unitName: String(saleItem.SellUnitName || saleItem.UnitName || ''),
    factor: factor,
    sellQty: saleItem.SellQty !== '' && saleItem.SellQty !== undefined
      ? number_(saleItem.SellQty)
      : roundQtyV41_(number_(saleItem.Qty) / factor),
    sellUnitPriceUSD:
      saleItem.SellUnitPriceUSD !== '' && saleItem.SellUnitPriceUSD !== undefined
        ? number_(saleItem.SellUnitPriceUSD)
        : (
            isPackage
              ? roundMoney_(number_(saleItem.UnitPriceUSD) * factor)
              : number_(saleItem.UnitPriceUSD)
          )
  };
}

function getReturnSaleDetailsV41(sessionToken, saleId) {
  const detail = getReturnSaleDetails(sessionToken, saleId);
  const saleItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(saleId);
    });
  const byId = {};
  saleItems.forEach(function(row) {
    byId[String(row.SaleItemID)] = row;
  });

  detail.items = detail.items.map(function(item) {
    const row = byId[item.saleItemId] || {};
    const meta = saleItemPackageMetaV41_(row);
    return Object.assign({}, item, {
      packageId: meta.packageId,
      sellUnitName: meta.unitName,
      unitsPerSellUnit: meta.factor,
      soldBaseQty: item.soldQty,
      returnedBaseQty: item.returnedQty,
      availableBaseQty: item.availableQty,
      soldQty: roundQtyV41_(item.soldQty / meta.factor),
      returnedQty: roundQtyV41_(item.returnedQty / meta.factor),
      availableQty: roundQtyV41_(item.availableQty / meta.factor),
      unitPriceUSD: meta.sellUnitPriceUSD
    });
  });

  detail.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return detail;
}

function processSaleReturnV41(sessionToken, payload) {
  payload = payload || {};
  const saleItems = getRows_(POS.SHEETS.SALE_ITEMS)
    .filter(function(row) {
      return String(row.SaleID) === String(payload.saleId || '');
    });
  const byId = {};
  saleItems.forEach(function(row) {
    byId[String(row.SaleItemID)] = row;
  });

  const converted = Object.assign({}, payload, {
    items: (Array.isArray(payload.items) ? payload.items : []).map(function(item) {
      const saleItem = byId[String(item.saleItemId)];
      if (!saleItem) throw new Error('A selected sale item was not found.');
      const meta = saleItemPackageMetaV41_(saleItem);
      return Object.assign({}, item, {
        qty: roundQtyV41_(number_(item.qty) * meta.factor)
      });
    })
  });

  const result = processSaleReturn(sessionToken, converted);
  const returnId = String(result.returnId || '');
  if (returnId) {
    const rows = getRows_(POS.SHEETS.RETURN_ITEMS)
      .filter(function(row) {
        return String(row.ReturnID) === returnId;
      });
    rows.forEach(function(row) {
      const saleItem = byId[String(row.SaleItemID)] || {};
      const meta = saleItemPackageMetaV41_(saleItem);
      updateRowObject_(POS.SHEETS.RETURN_ITEMS, row._row, {
        ReturnPackageID: meta.packageId,
        ReturnUnitName: meta.unitName,
        ReturnSellQty: roundQtyV41_(number_(row.QtyReturned) / meta.factor),
        UnitsPerReturnUnit: meta.factor
      });
    });
  }

  return getReturnReceiptV41(sessionToken, returnId);
}

function getReturnReceiptV41(sessionToken, returnId) {
  const receipt = getReturnReceipt(sessionToken, returnId);
  const returnRows = getRows_(POS.SHEETS.RETURN_ITEMS)
    .filter(function(row) {
      return String(row.ReturnID) === String(returnId);
    });

  receipt.items = returnRows.map(function(row) {
    const factor = number_(row.UnitsPerReturnUnit, 1) || 1;
    return {
      productName: String(row.ProductName || ''),
      qty: row.ReturnSellQty !== '' && row.ReturnSellQty !== undefined
        ? number_(row.ReturnSellQty)
        : roundQtyV41_(number_(row.QtyReturned) / factor),
      baseQty: number_(row.QtyReturned),
      packageId: String(row.ReturnPackageID || ''),
      unitName: String(row.ReturnUnitName || ''),
      unitsPerUnit: factor,
      refundUSD: number_(row.RefundUSD),
      restock: bool_(row.Restock),
      condition: String(row.Condition || ''),
      costRestoredUSD: number_(row.CostRestoredUSD)
    };
  });
  receipt.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return receipt;
}
