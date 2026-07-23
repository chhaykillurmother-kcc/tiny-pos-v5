function receivableStatus_(row, atDate) {
  const balance = roundMoney_(number_(row.BalanceUSD));
  if (balance <= 0.000001) return 'PAID';
  const due = reportDate_(row.DueDate);
  const now = atDate || new Date();
  if (due && due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return 'OVERDUE';
  if (number_(row.PaidUSD) > 0) return 'PARTIAL';
  return 'OPEN';
}

function refreshCustomerCreditBalanceLocked_(customerId) {
  const receivables = getRows_(POS.SHEETS.RECEIVABLES).filter(function(row) {
    return String(row.CustomerID) === String(customerId) && number_(row.BalanceUSD) > 0.000001;
  });
  const balance = roundMoney_(receivables.reduce(function(sum,row) {
    return sum + number_(row.BalanceUSD);
  }, 0));
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (customer) {
    updateRowObject_(POS.SHEETS.CUSTOMERS, customer._row, {
      CreditBalanceUSD: balance,
      UpdatedAt: new Date()
    });
  }
  return balance;
}

function createReceivableLocked_(payload) {
  const amount = roundMoney_(number_(payload.amountUSD));
  if (amount <= 0) return null;
  const now = new Date();
  const receivableId = uuid_('RCV');
  appendObject_(POS.SHEETS.RECEIVABLES, {
    ReceivableID: receivableId,
    CustomerID: String(payload.customerId || ''),
    SaleID: String(payload.saleId || ''),
    InvoiceNo: String(payload.invoiceNo || ''),
    InvoiceDate: payload.invoiceDate || now,
    DueDate: payload.dueDate || now,
    OriginalAmountUSD: amount,
    PaidUSD: 0,
    BalanceUSD: amount,
    Status: 'OPEN',
    CreatedAt: now,
    UpdatedAt: now
  });
  refreshCustomerCreditBalanceLocked_(payload.customerId);
  return receivableId;
}

function getCustomerOutstanding_(customerId) {
  return roundMoney_(getRows_(POS.SHEETS.RECEIVABLES)
    .filter(function(row) {
      return String(row.CustomerID) === String(customerId) && number_(row.BalanceUSD) > 0.000001;
    })
    .reduce(function(sum,row) { return sum + number_(row.BalanceUSD); }, 0));
}

function getCreditAccountsData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.CASHIER, POS.ROLES.ACCOUNTANT]);
  filters = filters || {};
  const query = sanitizeText_(filters.query,120).toLowerCase();
  const statusFilter = String(filters.status || '').toUpperCase();
  const now = new Date();
  const customers = {};
  getRows_(POS.SHEETS.CUSTOMERS).forEach(function(row) {
    customers[String(row.CustomerID)] = row;
  });

  const receivables = getRows_(POS.SHEETS.RECEIVABLES)
    .map(function(row) {
      const status = receivableStatus_(row, now);
      return {
        receivableId:String(row.ReceivableID||''),
        customerId:String(row.CustomerID||''),
        saleId:String(row.SaleID||''),
        invoiceNo:String(row.InvoiceNo||''),
        invoiceDate:reportDate_(row.InvoiceDate) ? reportDate_(row.InvoiceDate).toISOString() : '',
        dueDate:reportDate_(row.DueDate) ? reportDate_(row.DueDate).toISOString() : '',
        originalAmountUSD:roundMoney_(number_(row.OriginalAmountUSD)),
        paidUSD:roundMoney_(number_(row.PaidUSD)),
        balanceUSD:roundMoney_(number_(row.BalanceUSD)),
        status:status
      };
    })
    .filter(function(row) {
      if (statusFilter && row.status !== statusFilter) return false;
      const c = customers[row.customerId] || {};
      const hay = [row.invoiceNo,c.Name,c.Phone,c.CustomerID].join(' ').toLowerCase();
      return !query || hay.indexOf(query) >= 0;
    })
    .sort(function(a,b) {
      const ad = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
      const bd = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
      return ad - bd;
    });

  const accountMap = {};
  receivables.forEach(function(r) {
    const c = customers[r.customerId] || {};
    if (!accountMap[r.customerId]) {
      accountMap[r.customerId] = {
        customerId:r.customerId,
        name:String(c.Name||''),
        customerType:String(c.CustomerType||'RETAIL'),
        phone:String(c.Phone||''),
        creditLimitUSD:roundMoney_(number_(c.CreditLimitUSD)),
        outstandingUSD:0,
        overdueUSD:0,
        openInvoices:0,
        overdueInvoices:0,
        nextDueDate:'',
        active:bool_(c.Active)
      };
    }
    const account = accountMap[r.customerId];
    account.outstandingUSD = roundMoney_(account.outstandingUSD + r.balanceUSD);
    if (r.status === 'OVERDUE') {
      account.overdueUSD = roundMoney_(account.overdueUSD + r.balanceUSD);
      account.overdueInvoices++;
    }
    if (r.balanceUSD > 0) account.openInvoices++;
    if (r.dueDate && (!account.nextDueDate || new Date(r.dueDate) < new Date(account.nextDueDate))) {
      account.nextDueDate = r.dueDate;
    }
  });

  const accounts = Object.keys(accountMap).map(function(id) {
    const a = accountMap[id];
    a.availableCreditUSD = Math.max(0, roundMoney_(a.creditLimitUSD - a.outstandingUSD));
    return a;
  }).sort(function(a,b){return b.outstandingUSD-a.outstandingUSD;});

  return {
    accounts:accounts,
    receivables:receivables.map(function(r) {
      const c = customers[r.customerId] || {};
      r.customerName = String(c.Name||'');
      r.customerType = String(c.CustomerType||'RETAIL');
      r.phone = String(c.Phone||'');
      return r;
    }),
    totals:{
      customers:accounts.length,
      outstandingUSD:roundMoney_(accounts.reduce(function(s,a){return s+a.outstandingUSD;},0)),
      overdueUSD:roundMoney_(accounts.reduce(function(s,a){return s+a.overdueUSD;},0)),
      openInvoices:receivables.filter(function(r){return r.balanceUSD>0;}).length,
      overdueInvoices:receivables.filter(function(r){return r.status==='OVERDUE';}).length
    }
  };
}

function recordCustomerPayment(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.CASHIER, POS.ROLES.ACCOUNTANT]);
  payload = payload || {};
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', payload.customerId);
  if (!customer || !bool_(customer.Active)) throw new Error('Active customer was not found.');

  const currency = String(payload.currency || 'USD').toUpperCase() === 'KHR' ? 'KHR' : 'USD';
  const settings = getSettings_();
  const exchangeRate = number_(settings.EXCHANGE_RATE,4100);
  const rawAmount = number_(payload.amount);
  const amountUSD = currency === 'KHR'
    ? roundMoney_(rawAmount / exchangeRate)
    : roundMoney_(rawAmount);
  if (amountUSD <= 0) throw new Error('Payment amount must be greater than zero.');

  return withScriptLock_(function() {
    let open = getRows_(POS.SHEETS.RECEIVABLES)
      .filter(function(row) {
        return String(row.CustomerID) === String(customer.CustomerID) && number_(row.BalanceUSD) > 0.000001;
      })
      .sort(function(a,b) {
        const ad = reportDate_(a.DueDate) || reportDate_(a.InvoiceDate) || new Date(0);
        const bd = reportDate_(b.DueDate) || reportDate_(b.InvoiceDate) || new Date(0);
        return ad-bd;
      });

    if (payload.receivableId) {
      open.sort(function(a,b) {
        if (String(a.ReceivableID) === String(payload.receivableId)) return -1;
        if (String(b.ReceivableID) === String(payload.receivableId)) return 1;
        return 0;
      });
    }

    const outstanding = roundMoney_(open.reduce(function(s,r){return s+number_(r.BalanceUSD);},0));
    if (amountUSD > outstanding + 0.005) {
      throw new Error('Payment exceeds the customer outstanding balance of $' + outstanding.toFixed(2) + '.');
    }

    const paymentId = uuid_('CPM');
    const now = new Date();
    const shift = getOpenShiftForUser_(user.UserID);
    appendObject_(POS.SHEETS.CUSTOMER_PAYMENTS, {
      CustomerPaymentID:paymentId,
      CustomerID:customer.CustomerID,
      DateTime:now,
      Method:String(payload.method||'CASH').toUpperCase()==='BANK'?'BANK':'CASH',
      Currency:currency,
      Amount:rawAmount,
      AmountUSD:amountUSD,
      Reference:sanitizeText_(payload.reference,120),
      ShiftID:shift ? shift.ShiftID : '',
      UserID:user.UserID,
      Notes:sanitizeText_(payload.notes,250),
      CreatedAt:now
    });

    let remaining = amountUSD;
    const allocations = [];
    open.forEach(function(row) {
      if (remaining <= 0.000001) return;
      const balance = roundMoney_(number_(row.BalanceUSD));
      const applied = roundMoney_(Math.min(balance, remaining));
      if (applied <= 0) return;
      const newPaid = roundMoney_(number_(row.PaidUSD) + applied);
      const newBalance = roundMoney_(balance - applied);
      const receivableStatus = newBalance <= 0.000001 ? 'PAID' : 'PARTIAL';
      updateRowObject_(POS.SHEETS.RECEIVABLES, row._row, {
        PaidUSD:newPaid,
        BalanceUSD:newBalance,
        Status:receivableStatus,
        UpdatedAt:now
      });
      const saleRow = row.SaleID ? findRowBy_(POS.SHEETS.SALES, 'SaleID', row.SaleID) : null;
      if (saleRow) {
        const totalPaid = roundMoney_(number_(saleRow.AmountPaidUSD) + applied);
        updateRowObject_(POS.SHEETS.SALES, saleRow._row, {
          AmountPaidUSD:totalPaid,
          CreditAmountUSD:newBalance,
          PaymentStatus:newBalance <= 0.000001 ? POS.PAYMENT_STATUS.PAID : POS.PAYMENT_STATUS.PARTIAL,
          CreditStatus:receivableStatus
        });
      }
      const allocation = {
        AllocationID:uuid_('CPA'),
        CustomerPaymentID:paymentId,
        ReceivableID:String(row.ReceivableID),
        SaleID:String(row.SaleID||''),
        AmountUSD:applied,
        CreatedAt:now
      };
      allocations.push(allocation);
      remaining = roundMoney_(remaining - applied);
    });
    appendObjects_(POS.SHEETS.CUSTOMER_PAYMENT_ALLOCATIONS, allocations);
    const balanceAfter = refreshCustomerCreditBalanceLocked_(customer.CustomerID);
    audit_(user.UserID,'CUSTOMER_PAYMENT','Customer',customer.CustomerID,{
      paymentId:paymentId, amountUSD:amountUSD, method:payload.method, balanceAfter:balanceAfter
    });

    return {
      success:true,
      paymentId:paymentId,
      customerId:String(customer.CustomerID),
      customerName:String(customer.Name||''),
      customerType:String(customer.CustomerType||'RETAIL'),
      dateTime:now.toISOString(),
      method:String(payload.method||'CASH').toUpperCase()==='BANK'?'BANK':'CASH',
      currency:currency,
      amount:rawAmount,
      amountUSD:amountUSD,
      reference:sanitizeText_(payload.reference,120),
      balanceAfterUSD:balanceAfter,
      allocations:allocations
    };
  });
}

function getCustomerStatement(sessionToken, customerId, fromValue, toValue) {
  requireSession_(sessionToken);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS,'CustomerID',customerId);
  if (!customer) throw new Error('Customer not found.');
  const range = reportRange_(fromValue,toValue);
  const receivables = getRows_(POS.SHEETS.RECEIVABLES).filter(function(row) {
    return String(row.CustomerID)===String(customerId) && reportInRange_(row.InvoiceDate||row.CreatedAt,range);
  });
  const payments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).filter(function(row) {
    return String(row.CustomerID)===String(customerId) && reportInRange_(row.DateTime||row.CreatedAt,range);
  });
  const entries = [];
  receivables.forEach(function(r) {
    entries.push({
      dateTime:reportDate_(r.InvoiceDate||r.CreatedAt).toISOString(),
      type:'INVOICE', reference:String(r.InvoiceNo||''), debitUSD:number_(r.OriginalAmountUSD),
      creditUSD:0, dueDate:reportDate_(r.DueDate)?reportDate_(r.DueDate).toISOString():''
    });
  });
  payments.forEach(function(p) {
    entries.push({
      dateTime:reportDate_(p.DateTime||p.CreatedAt).toISOString(),
      type:'PAYMENT', reference:String(p.Reference||p.CustomerPaymentID||''), debitUSD:0,
      creditUSD:number_(p.AmountUSD), method:String(p.Method||'')
    });
  });
  entries.sort(function(a,b){return new Date(a.dateTime)-new Date(b.dateTime);});
  let running = 0;
  entries.forEach(function(e){running=roundMoney_(running+e.debitUSD-e.creditUSD);e.balanceUSD=running;});
  return {
    customer:customerToPublic_(customer),
    entries:entries,
    outstandingUSD:getCustomerOutstanding_(customerId)
  };
}