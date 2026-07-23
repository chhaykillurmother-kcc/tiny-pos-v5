
function listActiveCustomers_() {
  return getRows_(POS.SHEETS.CUSTOMERS)
    .filter(function(row) { return bool_(row.Active); })
    .sort(function(a, b) { return String(a.Name || '').localeCompare(String(b.Name || '')); })
    .map(customerToPublic_);
}

function customerToPublic_(row) {
  return {
    customerId: String(row.CustomerID || ''),
    name: String(row.Name || ''),
    customerType: String(row.CustomerType || 'RETAIL').toUpperCase(),
    phone: String(row.Phone || ''),
    email: String(row.Email || ''),
    address: String(row.Address || ''),
    notes: String(row.Notes || ''),
    points: number_(row.Points),
    creditLimitUSD: number_(row.CreditLimitUSD),
    creditBalanceUSD: number_(row.CreditBalanceUSD),
    paymentTermsDays: Math.max(0, Math.round(number_(row.PaymentTermsDays, 30))),
    active: bool_(row.Active),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : '',
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : ''
  };
}

function getCustomersModuleData(sessionToken, filters) {
  requireSession_(sessionToken);
  filters = filters || {};
  const query = sanitizeText_(filters.query, 120).toLowerCase();
  const includeInactive = filters.includeInactive === true;
  const typeFilter = String(filters.customerType || '').toUpperCase();

  const sales = getRows_(POS.SHEETS.SALES).filter(function(row) {
    return String(row.Status || '') !== POS.SALE_STATUS.VOID;
  });
  const returns = getRowsIfSheetExists_(POS.SHEETS.RETURNS).filter(function(row) {
    return String(row.Status || 'COMPLETED') !== 'CANCELLED';
  });

  const salesByCustomer = {};
  sales.forEach(function(row) {
    const id = String(row.CustomerID || '');
    if (!id) return;
    if (!salesByCustomer[id]) salesByCustomer[id] = {transactions:0,grossUSD:0,lastPurchase:null};
    salesByCustomer[id].transactions += 1;
    salesByCustomer[id].grossUSD += number_(row.TotalUSD);
    const date = new Date(row.DateTime || row.CreatedAt || 0);
    if (!isNaN(date.getTime()) && (!salesByCustomer[id].lastPurchase || date > salesByCustomer[id].lastPurchase)) {
      salesByCustomer[id].lastPurchase = date;
    }
  });

  const refundByCustomer = {};
  const saleCustomerMap = {};
  sales.forEach(function(row) { saleCustomerMap[String(row.SaleID)] = String(row.CustomerID || ''); });
  returns.forEach(function(row) {
    const customerId = saleCustomerMap[String(row.SaleID)] || '';
    if (!customerId) return;
    refundByCustomer[customerId] = number_(refundByCustomer[customerId]) + number_(row.AmountUSD);
  });

  const customers = getRows_(POS.SHEETS.CUSTOMERS)
    .filter(function(row) {
      if (!includeInactive && !bool_(row.Active)) return false;
      if (typeFilter && String(row.CustomerType || 'RETAIL').toUpperCase() !== typeFilter) return false;
      const haystack = [row.CustomerID,row.Name,row.CustomerType,row.Phone,row.Email,row.Address].join(' ').toLowerCase();
      return !query || haystack.indexOf(query) >= 0;
    })
    .sort(function(a,b){return String(a.Name || '').localeCompare(String(b.Name || ''));})
    .map(function(row) {
      const out = customerToPublic_(row);
      const stats = salesByCustomer[out.customerId] || {transactions:0,grossUSD:0,lastPurchase:null};
      const refunds = roundMoney_(number_(refundByCustomer[out.customerId]));
      out.transactions = stats.transactions;
      out.grossSalesUSD = roundMoney_(stats.grossUSD);
      out.refundsUSD = refunds;
      out.netSalesUSD = roundMoney_(stats.grossUSD - refunds);
      out.averageSaleUSD = stats.transactions ? roundMoney_(out.netSalesUSD / stats.transactions) : 0;
      out.lastPurchase = stats.lastPurchase ? stats.lastPurchase.toISOString() : '';
      out.outstandingUSD = getCustomerOutstanding_(out.customerId);
      out.availableCreditUSD = Math.max(0, roundMoney_(out.creditLimitUSD - out.outstandingUSD));
      return out;
    });

  return {
    customers: customers,
    metrics: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(function(c){return c.active;}).length,
      repeatCustomers: customers.filter(function(c){return c.transactions > 1;}).length,
      netSalesUSD: roundMoney_(customers.reduce(function(sum,c){return sum + c.netSalesUSD;},0)),
      outstandingUSD: roundMoney_(customers.reduce(function(sum,c){return sum + c.outstandingUSD;},0))
    }
  };
}

function saveCustomer(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'CUSTOMERS');
  payload = payload || {};
  const name = sanitizeText_(payload.name, 120);
  if (!name) throw new Error('Customer name is required.');

  const phone = sanitizeText_(payload.phone, 40);
  if (phone) {
    const duplicate = getRows_(POS.SHEETS.CUSTOMERS).find(function(row) {
      return String(row.Phone || '') === phone && String(row.CustomerID) !== String(payload.customerId || '');
    });
    if (duplicate) throw new Error('This phone number already belongs to another customer.');
  }

  const existing = payload.customerId
    ? findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', payload.customerId)
    : null;
  const now = new Date();
  const customerType = ['RETAIL','WHOLESALE','VIP','CREDIT'].indexOf(String(payload.customerType||'RETAIL').toUpperCase()) >= 0
    ? String(payload.customerType||'RETAIL').toUpperCase()
    : 'RETAIL';
  const changes = {
    Name: name,
    CustomerType: customerType,
    Phone: phone,
    Email: sanitizeText_(payload.email, 120),
    Address: sanitizeText_(payload.address, 250),
    Notes: sanitizeText_(payload.notes, 500),
    Active: payload.active !== false,
    UpdatedAt: now
  };

  if ([POS.ROLES.ADMIN, POS.ROLES.MANAGER].indexOf(user.Role) >= 0) {
    changes.CreditLimitUSD = Math.max(0, roundMoney_(number_(payload.creditLimitUSD)));
    changes.PaymentTermsDays = Math.max(0, Math.round(number_(payload.paymentTermsDays,30)));
  }

  let customerId;
  if (existing) {
    customerId = String(existing.CustomerID);
    updateRowObject_(POS.SHEETS.CUSTOMERS, existing._row, changes);
  } else {
    customerId = uuid_('CUS');
    changes.CustomerID = customerId;
    changes.Points = 0;
    changes.CreditLimitUSD = changes.CreditLimitUSD || 0;
    changes.CreditBalanceUSD = 0;
    changes.PaymentTermsDays = changes.PaymentTermsDays || 30;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.CUSTOMERS, changes);
  }

  audit_(user.UserID, existing ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER', 'Customer', customerId, changes);
  return {success:true, customerId:customerId};
}

function getCustomerDetails(sessionToken, customerId) {
  requireSession_(sessionToken);
  const customer = findRowBy_(POS.SHEETS.CUSTOMERS, 'CustomerID', customerId);
  if (!customer) throw new Error('Customer not found.');

  const sales = getRows_(POS.SHEETS.SALES)
    .filter(function(row){return String(row.CustomerID || '') === String(customerId) && String(row.Status || '') !== POS.SALE_STATUS.VOID;})
    .sort(function(a,b){return new Date(b.DateTime || 0)-new Date(a.DateTime || 0);})
    .slice(0,100)
    .map(function(row){
      return {
        saleId:String(row.SaleID), invoiceNo:String(row.InvoiceNo || ''),
        dateTime:new Date(row.DateTime || row.CreatedAt).toISOString(),
        totalUSD:number_(row.TotalUSD), paymentMethod:String(row.PaymentMethod || ''),
        paymentStatus:String(row.PaymentStatus||''),
        creditAmountUSD:number_(row.CreditAmountUSD),
        status:String(row.Status || '')
      };
    });

  const receivables = getRows_(POS.SHEETS.RECEIVABLES)
    .filter(function(row){return String(row.CustomerID)===String(customerId);})
    .sort(function(a,b){return new Date(b.InvoiceDate||0)-new Date(a.InvoiceDate||0);})
    .map(function(row){
      return {
        receivableId:String(row.ReceivableID||''), saleId:String(row.SaleID||''),
        invoiceNo:String(row.InvoiceNo||''), invoiceDate:reportDate_(row.InvoiceDate)?reportDate_(row.InvoiceDate).toISOString():'',
        dueDate:reportDate_(row.DueDate)?reportDate_(row.DueDate).toISOString():'',
        originalAmountUSD:number_(row.OriginalAmountUSD), paidUSD:number_(row.PaidUSD),
        balanceUSD:number_(row.BalanceUSD), status:receivableStatus_(row,new Date())
      };
    });

  return {customer:customerToPublic_(customer), sales:sales, receivables:receivables};
}
