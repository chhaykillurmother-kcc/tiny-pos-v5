
/**
 * Tiny POS V3 reports.
 * Sales/profit are accrual-based. Customer debt collection is cash movement,
 * not new revenue. FIFO lots are reported separately for stock aging.
 */
let REPORT_SCOPE_V37_ = null;

function reportRows_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  let rows = sheet ? getRows_(sheetName) : [];
  const scope = REPORT_SCOPE_V37_;
  if (!scope || (!scope.branchId && !scope.cashierId)) return rows;

  const salesRaw = sheetName === POS.SHEETS.SALES ? rows : getRows_(POS.SHEETS.SALES);
  const scopedSaleIds = {};
  salesRaw.forEach(function(sale) {
    const branchOk = !scope.branchId || String(sale.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
    const cashierOk = !scope.cashierId || String(sale.CashierID || '') === scope.cashierId;
    if (branchOk && cashierOk) scopedSaleIds[String(sale.SaleID)] = true;
  });

  if (sheetName === POS.SHEETS.SALES) return rows.filter(function(r){return scopedSaleIds[String(r.SaleID)];});
  if ([POS.SHEETS.SALE_ITEMS, POS.SHEETS.PAYMENTS, POS.SHEETS.RECEIVABLES].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return scopedSaleIds[String(r.SaleID)];});
  }
  if (sheetName === POS.SHEETS.RETURNS) {
    return rows.filter(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      return branchOk && scopedSaleIds[String(r.SaleID)];
    });
  }
  if ([POS.SHEETS.RETURN_ITEMS, POS.SHEETS.REFUND_PAYMENTS, POS.SHEETS.RETURN_LOT_RESTORATIONS].indexOf(sheetName) >= 0) {
    const returnIds = {};
    getRows_(POS.SHEETS.RETURNS).forEach(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      if (branchOk && scopedSaleIds[String(r.SaleID)]) returnIds[String(r.ReturnID)] = true;
    });
    return rows.filter(function(r){return returnIds[String(r.ReturnID)];});
  }
  if ([POS.SHEETS.PURCHASES, POS.SHEETS.PURCHASE_RECEIPTS, POS.SHEETS.SUPPLIER_RETURNS].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;});
  }
  if ([POS.SHEETS.STOCK_LOTS, POS.SHEETS.STOCK, POS.SHEETS.STOCK_COUNTS, POS.SHEETS.BRANCH_INVENTORY].indexOf(sheetName) >= 0) {
    return rows.filter(function(r){return !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;});
  }
  if (sheetName === POS.SHEETS.EXPENSES) {
    return rows.filter(function(r){
      const branchOk = !scope.branchId || String(r.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === scope.branchId;
      const userOk = !scope.cashierId || String(r.UserID || '') === scope.cashierId;
      return branchOk && userOk;
    });
  }
  return rows;
}

function reportDate_(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function reportRange_(fromValue, toValue) {
  const now = new Date();
  const from = fromValue
    ? new Date(String(fromValue) + 'T00:00:00')
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toValue
    ? new Date(String(toValue) + 'T23:59:59.999')
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) throw new Error('Invalid report date range.');
  if (from > to) throw new Error('From date cannot be after To date.');
  return {from:from,to:to};
}

function reportInRange_(value, range) {
  const date = reportDate_(value);
  return Boolean(date && date >= range.from && date <= range.to);
}

function reportSaleIncluded_(row) {
  const status = String(row.Status || '').toUpperCase();
  const payment = String(row.PaymentStatus || '').toUpperCase();
  return status !== POS.SALE_STATUS.VOID && payment !== POS.PAYMENT_STATUS.FAILED;
}

function reportPeriodKey_(dateValue, period) {
  const date = reportDate_(dateValue);
  if (!date) return null;
  period = String(period || 'DAILY').toUpperCase();
  if (period === 'MONTHLY') {
    return {
      key:Utilities.formatDate(date,POS.TIME_ZONE,'yyyy-MM'),
      label:Utilities.formatDate(date,POS.TIME_ZONE,'MMM yyyy')
    };
  }
  if (period === 'WEEKLY') {
    const day = date.getDay();
    const delta = day === 0 ? -6 : 1 - day;
    const monday = new Date(date.getFullYear(),date.getMonth(),date.getDate()+delta);
    const sunday = new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+6);
    return {
      key:Utilities.formatDate(monday,POS.TIME_ZONE,'yyyy-MM-dd'),
      label:Utilities.formatDate(monday,POS.TIME_ZONE,'dd MMM') + ' – ' +
        Utilities.formatDate(sunday,POS.TIME_ZONE,'dd MMM yyyy')
    };
  }
  return {
    key:Utilities.formatDate(date,POS.TIME_ZONE,'yyyy-MM-dd'),
    label:Utilities.formatDate(date,POS.TIME_ZONE,'dd MMM yyyy')
  };
}

function saleItemCost_(item) {
  const stored = String(item.CostTotalUSD == null ? '' : item.CostTotalUSD).trim();
  return stored === ''
    ? roundMoney_(number_(item.UnitCostUSD) * number_(item.Qty))
    : roundMoney_(number_(item.CostTotalUSD));
}

function returnItemNetRevenue_(item) {
  const allocated = String(item.GrossLineRefundUSD == null ? '' : item.GrossLineRefundUSD).trim() !== '' ||
    String(item.DiscountRefundUSD == null ? '' : item.DiscountRefundUSD).trim() !== '';
  return allocated
    ? Math.max(0, number_(item.GrossLineRefundUSD) - number_(item.DiscountRefundUSD))
    : Math.max(0, number_(item.RefundUSD) - number_(item.TaxRefundUSD));
}

function buildAccountingData_(range) {
  const allSales = reportRows_(POS.SHEETS.SALES).filter(reportSaleIncluded_);
  const allItems = reportRows_(POS.SHEETS.SALE_ITEMS);
  const allReturns = reportRows_(POS.SHEETS.RETURNS).filter(function(row) {
    return String(row.Status || 'COMPLETED').toUpperCase() !== 'CANCELLED';
  });
  const allReturnItems = reportRows_(POS.SHEETS.RETURN_ITEMS);
  const allRefundPayments = reportRows_(POS.SHEETS.REFUND_PAYMENTS).filter(function(row) {
    return String(row.Status || 'PAID').toUpperCase() !== 'CANCELLED';
  });
  const allExpenses = reportRows_(POS.SHEETS.EXPENSES);
  const allPurchases = reportRows_(POS.SHEETS.PURCHASES).filter(function(row) {
    return String(row.Status || '').toUpperCase() !== 'CANCELLED';
  });

  const sales = allSales.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const saleIds = {};
  sales.forEach(function(row){saleIds[String(row.SaleID)] = true;});
  const saleItems = allItems.filter(function(row){return saleIds[String(row.SaleID)];});
  const returns = allReturns.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const returnIds = {};
  returns.forEach(function(row){returnIds[String(row.ReturnID)] = true;});
  const returnItems = allReturnItems.filter(function(row){return returnIds[String(row.ReturnID)];});
  const refundPayments = allRefundPayments.filter(function(row){return returnIds[String(row.ReturnID)] || reportInRange_(row.CreatedAt||row.DateTime,range);});
  const expenses = allExpenses.filter(function(row){return reportInRange_(row.DateTime || row.CreatedAt,range);});
  const purchases = allPurchases.filter(function(row){return reportInRange_(row.PurchaseDate || row.CreatedAt,range);});

  const itemsBySale = {};
  saleItems.forEach(function(item){
    const id=String(item.SaleID||'');
    if(!itemsBySale[id])itemsBySale[id]=[];
    itemsBySale[id].push(item);
  });
  const returnsBySale = {};
  returns.forEach(function(row){
    const id=String(row.SaleID||'');
    if(!returnsBySale[id])returnsBySale[id]=[];
    returnsBySale[id].push(row);
  });
  const returnItemsByReturn = {};
  returnItems.forEach(function(item){
    const id=String(item.ReturnID||'');
    if(!returnItemsByReturn[id])returnItemsByReturn[id]=[];
    returnItemsByReturn[id].push(item);
  });

  let grossSales=0,discounts=0,salesTax=0,salesReceipts=0,saleCost=0;
  let refundTotal=0,returnNetSales=0,returnTax=0,restoredCost=0;
  let cashSales=0,bankSales=0,creditSales=0,cashRefunds=0,bankRefunds=0;

  sales.forEach(function(sale){
    grossSales += number_(sale.SubtotalUSD);
    discounts += number_(sale.DiscountUSD);
    salesTax += number_(sale.TaxUSD);
    salesReceipts += number_(sale.TotalUSD);
    cashSales += String(sale.PaymentMethod||'').toUpperCase().indexOf('CASH') >= 0 ? number_(sale.AmountPaidUSD || (sale.PaymentMethod==='CASH'?sale.TotalUSD:0)) : 0;
    bankSales += String(sale.PaymentMethod||'').toUpperCase().indexOf('BANK') >= 0 ? number_(sale.AmountPaidUSD || (sale.PaymentMethod==='BANK'?sale.TotalUSD:0)) : 0;
    creditSales += number_(sale.CreditAmountUSD);
    (itemsBySale[String(sale.SaleID)]||[]).forEach(function(item){saleCost += saleItemCost_(item);});
  });

  returns.forEach(function(row){
    refundTotal += number_(row.AmountUSD);
    const items=returnItemsByReturn[String(row.ReturnID)]||[];
    if(items.length){
      items.forEach(function(item){
        returnNetSales += returnItemNetRevenue_(item);
        returnTax += number_(item.TaxRefundUSD);
        restoredCost += number_(item.CostRestoredUSD);
      });
    } else {
      returnNetSales += number_(row.AmountUSD);
    }
  });

  refundPayments.forEach(function(row){
    const method=String(row.Method||'').toUpperCase();
    if(method==='CASH')cashRefunds+=number_(row.AmountUSD);
    if(method==='BANK')bankRefunds+=number_(row.AmountUSD);
  });
  if(!refundPayments.length){
    returns.forEach(function(row){
      const method=String(row.RefundMethod||'').toUpperCase();
      if(method==='CASH')cashRefunds+=number_(row.AmountUSD);
      if(method==='BANK')bankRefunds+=number_(row.AmountUSD);
    });
  }

  const expenseTotal=expenses.reduce(function(sum,row){return sum+number_(row.AmountUSD);},0);
  const purchaseTotal=purchases.reduce(function(sum,row){return sum+number_(row.TotalUSD);},0);
  const netSales=grossSales-discounts-returnNetSales;
  const netTax=salesTax-returnTax;
  const netReceipts=salesReceipts-refundTotal;
  const cogs=saleCost-restoredCost;
  const grossProfit=netSales-cogs;
  const netProfit=grossProfit-expenseTotal;

  return {
    sales:sales,saleItems:saleItems,returns:returns,returnItems:returnItems,
    expenses:expenses,purchases:purchases,itemsBySale:itemsBySale,returnsBySale:returnsBySale,
    totals:{
      grossSalesUSD:roundMoney_(grossSales),
      discountsUSD:roundMoney_(discounts),
      refundsUSD:roundMoney_(refundTotal),
      returnNetSalesUSD:roundMoney_(returnNetSales),
      taxUSD:roundMoney_(netTax),
      netSalesUSD:roundMoney_(netSales),
      netReceiptsUSD:roundMoney_(netReceipts),
      cogsUSD:roundMoney_(cogs),
      grossProfitUSD:roundMoney_(grossProfit),
      expensesUSD:roundMoney_(expenseTotal),
      purchaseUSD:roundMoney_(purchaseTotal),
      netProfitUSD:roundMoney_(netProfit),
      marginPercent:netSales ? Math.round(grossProfit/netSales*10000)/100 : 0,
      transactions:sales.length,
      returns:returns.length,
      purchases:purchases.length,
      expenseCount:expenses.length,
      cashUSD:roundMoney_(cashSales-cashRefunds),
      bankUSD:roundMoney_(bankSales-bankRefunds),
      creditUSD:roundMoney_(creditSales),
      averageSaleUSD:sales.length ? roundMoney_(netReceipts/sales.length) : 0,
      counts:{
        grossSales:sales.length,discounts:sales.filter(function(r){return number_(r.DiscountUSD)>0;}).length,
        refunds:returns.length,netSales:sales.length,cogs:saleItems.length,grossProfit:sales.length,
        expenses:expenses.length,purchases:purchases.length,netProfit:sales.length
      }
    }
  };
}

function getDashboardData_(user) {
  const now=new Date();
  const today=Utilities.formatDate(now,POS.TIME_ZONE,'yyyy-MM-dd');
  const month=Utilities.formatDate(now,POS.TIME_ZONE,'yyyy-MM');
  const dayMap={},weekly=[];
  for(let offset=6;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset);
    const key=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    const bucket={date:key,label:Utilities.formatDate(d,POS.TIME_ZONE,'EEE'),salesUSD:0,grossProfitUSD:0,transactions:0};
    dayMap[key]=bucket;weekly.push(bucket);
  }

  const dashboardBranchId=getUserBranchId_(user);
  const viewAllBranches=[POS.ROLES.ADMIN,POS.ROLES.MANAGER,POS.ROLES.ACCOUNTANT].indexOf(String(user&&user.Role))>=0;
  const sales=reportRows_(POS.SHEETS.SALES).filter(reportSaleIncluded_).filter(function(s){return viewAllBranches||String(s.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===dashboardBranchId;});
  const items=reportRows_(POS.SHEETS.SALE_ITEMS);
  const returns=reportRows_(POS.SHEETS.RETURNS).filter(function(r){return String(r.Status||'').toUpperCase()!=='CANCELLED';});
  const returnItems=reportRows_(POS.SHEETS.RETURN_ITEMS);
  const itemsBySale={};
  items.forEach(function(i){const id=String(i.SaleID);if(!itemsBySale[id])itemsBySale[id]=[];itemsBySale[id].push(i);});
  const returnByDate={};
  returns.forEach(function(r){
    const d=reportDate_(r.DateTime||r.CreatedAt);if(!d)return;
    const k=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    if(!returnByDate[k])returnByDate[k]={revenue:0,cost:0};
    const ritems=returnItems.filter(function(i){return String(i.ReturnID)===String(r.ReturnID);});
    returnByDate[k].revenue += ritems.length ? ritems.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0) : number_(r.AmountUSD);
    returnByDate[k].cost += ritems.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
  });

  let todayRevenue=0,todayProfit=0,todayTransactions=0,monthRevenue=0,monthProfit=0;
  sales.forEach(function(sale){
    const d=reportDate_(sale.DateTime||sale.CreatedAt);if(!d)return;
    const day=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd');
    const mon=Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM');
    const net=number_(sale.SubtotalUSD)-number_(sale.DiscountUSD);
    const cost=(itemsBySale[String(sale.SaleID)]||[]).reduce(function(s,i){return s+saleItemCost_(i);},0);
    const profit=net-cost;
    if(dayMap[day]){dayMap[day].salesUSD+=net;dayMap[day].grossProfitUSD+=profit;dayMap[day].transactions++;}
    if(day===today){todayRevenue+=net;todayProfit+=profit;todayTransactions++;}
    if(mon===month){monthRevenue+=net;monthProfit+=profit;}
  });
  Object.keys(returnByDate).forEach(function(day){
    const r=returnByDate[day];
    if(dayMap[day]){dayMap[day].salesUSD-=r.revenue;dayMap[day].grossProfitUSD-=r.revenue-r.cost;}
    if(day===today){todayRevenue-=r.revenue;todayProfit-=r.revenue-r.cost;}
    if(day.slice(0,7)===month){monthRevenue-=r.revenue;monthProfit-=r.revenue-r.cost;}
  });
  weekly.forEach(function(b){b.salesUSD=roundMoney_(b.salesUSD);b.grossProfitUSD=roundMoney_(b.grossProfitUSD);});
  const products=reportRows_(POS.SHEETS.PRODUCTS).filter(function(p){return bool_(p.Active);});
  const pendingPurchaseCount=reportRows_(POS.SHEETS.PURCHASES).filter(function(p){return (viewAllBranches||String(p.BranchID||BRANCH_FEATURE.DEFAULT_BRANCH_ID)===dashboardBranchId)&&['DRAFT','ORDERED','PARTIALLY_RECEIVED'].indexOf(String(p.Status||'').toUpperCase())>=0;}).length;
  const pendingInvoiceCount=reportRows_(POS.SHEETS.PENDING_INVOICES).filter(function(p){return String(p.Status||'OPEN').toUpperCase()==='OPEN';}).length;
  const todayRefundCount=returns.filter(function(r){const d=reportDate_(r.DateTime||r.CreatedAt);return d&&Utilities.formatDate(d,POS.TIME_ZONE,'yyyy-MM-dd')===today;}).length;
  const todayDate=new Date();todayDate.setHours(23,59,59,999);
  const openReceivables=reportRows_(POS.SHEETS.RECEIVABLES).filter(function(r){return number_(r.BalanceUSD)>0.000001;});
  const overdueCustomerIds={};
  openReceivables.forEach(function(r){const d=reportDate_(r.DueDate);if(d&&d<todayDate)overdueCustomerIds[String(r.CustomerID)]=true;});
  return {
    todayRevenueUSD:roundMoney_(todayRevenue),
    todayGrossProfitUSD:roundMoney_(todayProfit),
    todayTransactions:todayTransactions,
    monthRevenueUSD:roundMoney_(monthRevenue),
    monthGrossProfitUSD:roundMoney_(monthProfit),
    lowStockProducts:products.filter(function(p){return getBranchStockQty_(dashboardBranchId,p.ProductID)<=number_(p.LowStockLevel);}).length,
    creditOutstandingUSD:roundMoney_(openReceivables.reduce(function(s,r){return s+Math.max(0,number_(r.BalanceUSD));},0)),
    pendingPurchaseCount:pendingPurchaseCount,
    pendingInvoiceCount:pendingInvoiceCount,
    pendingCreditCustomerCount:Object.keys(overdueCustomerIds).length,
    todayRefundCount:todayRefundCount,
    openCreditCustomerCount:Object.keys(openReceivables.reduce(function(m,r){m[String(r.CustomerID)]=true;return m;},{})).length,
    weeklySales:weekly
  };
}

function getTodaySummary_() {
  const user={};
  return getDashboardData_(user);
}

function getAdvancedReport(sessionToken, options) {
  const reportUser=requireSession_(sessionToken);requirePermission_(reportUser,'REPORTS');
  options=options||{};
  const requestedBranch = sanitizeText_(options.branchId,80);
  const requestedCashier = sanitizeText_(options.cashierId,80);
  const branchId = resolveAccessibleBranchId_(reportUser, requestedBranch, true);
  let cashierId = requestedCashier;
  if (!canManageAllBranches_(reportUser)) {
    if (String(reportUser.Role) === POS.ROLES.CASHIER) cashierId = String(reportUser.UserID);
    else if (cashierId) {
      const cashier = findRowBy_(POS.SHEETS.USERS,'UserID',cashierId);
      if (!cashier || String(getUserBranchId_(cashier)) !== String(getUserBranchId_(reportUser))) cashierId = '';
    }
  }
  REPORT_SCOPE_V37_ = {branchId:branchId,cashierId:cashierId};
  try {
    const type=String(options.type||'SALES_SUMMARY').toUpperCase();
    const range=reportRange_(options.from,options.to);
    let result;
    if(type==='PROFIT_LOSS')result=buildProfitLossReport_(range);
    else if(type==='STOCK')result=buildStockReport_(range,options);
    else if(type==='CUSTOMER')result=buildCustomerReport_(range,options);
    else if(type==='CREDIT')result=buildCreditReport_(sessionToken,range,options);
    else if(type==='REFUND')result=buildRefundSummaryReport_(range,options);
    else result=buildSalesSummaryReport_(range,options);
    result.filters = {branchId:branchId,cashierId:cashierId};
    return result;
  } finally {
    REPORT_SCOPE_V37_ = null;
  }
}

function getReports(sessionToken, options) {
  options=options||{};options.type='SALES_SUMMARY';
  return getAdvancedReport(sessionToken,options);
}
function getReportsSafeV2(sessionToken,options){return getReports(sessionToken,options);}

function buildSalesSummaryReport_(range, options) {
  const data=buildAccountingData_(range);
  const period=String(options&&options.period||'DATE_RANGE').toUpperCase();
  const buckets={};

  function bucketFor(value){
    const info=period==='DATE_RANGE' ? {key:'RANGE',label:Utilities.formatDate(range.from,POS.TIME_ZONE,'yyyy-MM-dd')+' — '+Utilities.formatDate(range.to,POS.TIME_ZONE,'yyyy-MM-dd')} : reportPeriodKey_(value,period);if(!info)return null;
    if(!buckets[info.key])buckets[info.key]={
      periodKey:info.key,periodLabel:info.label,slips:0,grossSalesUSD:0,discountsUSD:0,
      refundsUSD:0,netSalesUSD:0,cogsUSD:0,grossProfitUSD:0,cashUSD:0,bankUSD:0,creditUSD:0
    };
    return buckets[info.key];
  }

  data.sales.forEach(function(sale){
    const b=bucketFor(sale.DateTime||sale.CreatedAt);if(!b)return;
    b.slips++;
    b.grossSalesUSD+=number_(sale.SubtotalUSD);
    b.discountsUSD+=number_(sale.DiscountUSD);
    b.netSalesUSD+=number_(sale.SubtotalUSD)-number_(sale.DiscountUSD);
    b.creditUSD+=number_(sale.CreditAmountUSD);
    const method=String(sale.PaymentMethod||'').toUpperCase();
    if(method.indexOf('CASH')>=0)b.cashUSD+=number_(sale.AmountPaidUSD || sale.TotalUSD);
    if(method.indexOf('BANK')>=0)b.bankUSD+=number_(sale.AmountPaidUSD || sale.TotalUSD);
    (data.itemsBySale[String(sale.SaleID)]||[]).forEach(function(i){b.cogsUSD+=saleItemCost_(i);});
  });

  const returnItemsById={};
  data.returnItems.forEach(function(i){const id=String(i.ReturnID);if(!returnItemsById[id])returnItemsById[id]=[];returnItemsById[id].push(i);});
  data.returns.forEach(function(r){
    const b=bucketFor(r.DateTime||r.CreatedAt);if(!b)return;
    const ri=returnItemsById[String(r.ReturnID)]||[];
    const netRefund=ri.length?ri.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0):number_(r.AmountUSD);
    const restored=ri.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
    b.refundsUSD+=netRefund;b.netSalesUSD-=netRefund;b.cogsUSD-=restored;
    const method=String(r.RefundMethod||'').toUpperCase();
    if(method==='CASH')b.cashUSD-=number_(r.AmountUSD);
    if(method==='BANK')b.bankUSD-=number_(r.AmountUSD);
  });

  const rows=Object.keys(buckets).sort().map(function(key){
    const b=buckets[key];
    b.grossSalesUSD=roundMoney_(b.grossSalesUSD);b.discountsUSD=roundMoney_(b.discountsUSD);
    b.refundsUSD=roundMoney_(b.refundsUSD);b.netSalesUSD=roundMoney_(b.netSalesUSD);
    b.cogsUSD=roundMoney_(b.cogsUSD);b.grossProfitUSD=roundMoney_(b.netSalesUSD-b.cogsUSD);
    b.cashUSD=roundMoney_(b.cashUSD);b.bankUSD=roundMoney_(b.bankUSD);b.creditUSD=roundMoney_(b.creditUSD);
    return b;
  });
  return {type:'SALES_SUMMARY',title:'Sales Summary',period:period,from:range.from.toISOString(),to:range.to.toISOString(),totals:data.totals,rows:rows};
}

function buildProfitLossReport_(range) {
  const data=buildAccountingData_(range);
  const byDay={};
  function bucket(value){
    const info=reportPeriodKey_(value,'DAILY');if(!info)return null;
    if(!byDay[info.key])byDay[info.key]={
      date:info.key,grossSalesUSD:0,saleCount:0,discountsUSD:0,discountCount:0,
      refundsUSD:0,returnCount:0,netSalesUSD:0,cogsUSD:0,grossProfitUSD:0,
      expensesUSD:0,expenseCount:0,purchaseUSD:0,purchaseCount:0,netProfitUSD:0
    };
    return byDay[info.key];
  }
  data.sales.forEach(function(s){
    const b=bucket(s.DateTime||s.CreatedAt);if(!b)return;
    b.saleCount++;b.grossSalesUSD+=number_(s.SubtotalUSD);b.discountsUSD+=number_(s.DiscountUSD);
    if(number_(s.DiscountUSD)>0)b.discountCount++;
    (data.itemsBySale[String(s.SaleID)]||[]).forEach(function(i){b.cogsUSD+=saleItemCost_(i);});
  });
  const riBy={};data.returnItems.forEach(function(i){const id=String(i.ReturnID);if(!riBy[id])riBy[id]=[];riBy[id].push(i);});
  data.returns.forEach(function(r){
    const b=bucket(r.DateTime||r.CreatedAt);if(!b)return;
    const items=riBy[String(r.ReturnID)]||[];
    b.returnCount++;b.refundsUSD+=items.length?items.reduce(function(s,i){return s+returnItemNetRevenue_(i);},0):number_(r.AmountUSD);
    b.cogsUSD-=items.reduce(function(s,i){return s+number_(i.CostRestoredUSD);},0);
  });
  data.expenses.forEach(function(e){const b=bucket(e.DateTime||e.CreatedAt);if(b){b.expensesUSD+=number_(e.AmountUSD);b.expenseCount++;}});
  data.purchases.forEach(function(p){const b=bucket(p.PurchaseDate||p.CreatedAt);if(b){b.purchaseUSD+=number_(p.TotalUSD);b.purchaseCount++;}});

  const rows=Object.keys(byDay).sort().map(function(k){
    const b=byDay[k];
    b.netSalesUSD=roundMoney_(b.grossSalesUSD-b.discountsUSD-b.refundsUSD);
    b.cogsUSD=roundMoney_(b.cogsUSD);b.grossProfitUSD=roundMoney_(b.netSalesUSD-b.cogsUSD);
    b.netProfitUSD=roundMoney_(b.grossProfitUSD-b.expensesUSD);
    ['grossSalesUSD','discountsUSD','refundsUSD','expensesUSD','purchaseUSD'].forEach(function(x){b[x]=roundMoney_(b[x]);});
    return b;
  });
  return {type:'PROFIT_LOSS',title:'Profit / Loss',from:range.from.toISOString(),to:range.to.toISOString(),totals:data.totals,rows:rows};
}

function stockAgeBucket_(days) {
  if(days<=30)return '0-30';
  if(days<=60)return '31-60';
  if(days<=90)return '61-90';
  return '91+';
}

function buildStockReport_(range,options) {
  options=options||{};
  const products={},categories={},units={},purchases={};
  reportRows_(POS.SHEETS.PRODUCTS).forEach(function(p){products[String(p.ProductID)]=p;});
  reportRows_(POS.SHEETS.CATEGORIES).forEach(function(c){categories[String(c.CategoryID)]=String(c.NameEN||c.NameKH||'');});
  reportRows_(POS.SHEETS.UNITS).forEach(function(u){units[String(u.UnitID)]=String(u.Abbreviation||u.NameEN||u.NameKH||'');});
  reportRows_(POS.SHEETS.PURCHASES).forEach(function(p){purchases[String(p.PurchaseID)]=p;});

  const query=sanitizeText_(options.query,120).toLowerCase();
  const categoryId=sanitizeText_(options.categoryId,80);
  const now=new Date();
  const rows=[];

  reportRows_(POS.SHEETS.STOCK_LOTS).filter(function(l){return number_(l.QtyRemaining)>0.000001;}).forEach(function(lot){
    const p=products[String(lot.ProductID)];if(!p)return;
    if(categoryId&&String(p.CategoryID)!==categoryId)return;
    const hay=[p.NameEN,p.NameKH,p.Barcode,p.SKU].join(' ').toLowerCase();
    if(query&&hay.indexOf(query)<0)return;
    const received=reportDate_(lot.ReceivedAt||lot.CreatedAt)||now;
    const days=Math.max(0,Math.floor((now-received)/86400000));
    const qty=number_(lot.QtyRemaining);
    const cost=number_(lot.UnitCostUSD);
    const pur=purchases[String(lot.PurchaseID)]||{};
    rows.push({
      lotId:String(lot.LotID||''),productId:String(p.ProductID),productName:String(p.NameEN||p.NameKH||''),
      barcode:String(p.Barcode||''),sku:String(p.SKU||''),category:categories[String(p.CategoryID)]||'',
      unit:units[String(p.UnitID)]||'',purchaseNo:String(pur.PurchaseNo||lot.ReferenceID||''),
      receivedAt:received.toISOString(),ageDays:days,agingBucket:stockAgeBucket_(days),
      qtyRemaining:qty,unitCostUSD:roundMoney_(cost),inventoryValueUSD:roundMoney_(qty*cost),
      active:bool_(p.Active),status:qty<=0?'OUT':qty<=number_(p.LowStockLevel)?'LOW':'OK'
    });
  });

  // Products with current stock but no open FIFO lot remain visible as fallback.
  Object.keys(products).forEach(function(id){
    const p=products[id];const qty=number_(p.CurrentStock);
    if(qty<=0||rows.some(function(r){return r.productId===id;}))return;
    if(categoryId&&String(p.CategoryID)!==categoryId)return;
    const hay=[p.NameEN,p.NameKH,p.Barcode,p.SKU].join(' ').toLowerCase();
    if(query&&hay.indexOf(query)<0)return;
    rows.push({
      lotId:'FALLBACK-'+id,productId:id,productName:String(p.NameEN||p.NameKH||''),barcode:String(p.Barcode||''),
      sku:String(p.SKU||''),category:categories[String(p.CategoryID)]||'',unit:units[String(p.UnitID)]||'',
      purchaseNo:'Opening / legacy',receivedAt:p.CreatedAt?reportDate_(p.CreatedAt).toISOString():'',
      ageDays:p.CreatedAt?Math.max(0,Math.floor((now-reportDate_(p.CreatedAt))/86400000)):0,
      agingBucket:stockAgeBucket_(p.CreatedAt?Math.max(0,Math.floor((now-reportDate_(p.CreatedAt))/86400000)):0),
      qtyRemaining:qty,unitCostUSD:roundMoney_(number_(p.CostUSD)),inventoryValueUSD:roundMoney_(qty*number_(p.CostUSD)),
      active:bool_(p.Active),status:qty<=number_(p.LowStockLevel)?'LOW':'OK'
    });
  });

  rows.sort(function(a,b){return a.productName.localeCompare(b.productName)||new Date(a.receivedAt)-new Date(b.receivedAt);});
  const aging={
    '0-30':{qty:0,valueUSD:0,lots:0},
    '31-60':{qty:0,valueUSD:0,lots:0},
    '61-90':{qty:0,valueUSD:0,lots:0},
    '91+':{qty:0,valueUSD:0,lots:0}
  };
  rows.forEach(function(r){const a=aging[r.agingBucket];a.qty+=r.qtyRemaining;a.valueUSD+=r.inventoryValueUSD;a.lots++;});
  Object.keys(aging).forEach(function(k){aging[k].qty=Math.round(aging[k].qty*1000)/1000;aging[k].valueUSD=roundMoney_(aging[k].valueUSD);});
  const distinct={};rows.forEach(function(r){distinct[r.productId]=true;});
  const totals={
    inventoryQty:Math.round(rows.reduce(function(s,r){return s+r.qtyRemaining;},0)*1000)/1000,
    inventoryValueUSD:roundMoney_(rows.reduce(function(s,r){return s+r.inventoryValueUSD;},0)),
    lowStockCount:Object.keys(products).filter(function(id){const p=products[id];return number_(p.CurrentStock)>0&&number_(p.CurrentStock)<=number_(p.LowStockLevel);}).length,
    outOfStockCount:Object.keys(products).filter(function(id){return number_(products[id].CurrentStock)<=0;}).length,
    products:Object.keys(distinct).length,lots:rows.length,aging:aging
  };
  return {type:'STOCK',title:'Stock Analysis',from:range.from.toISOString(),to:range.to.toISOString(),totals:totals,rows:rows};
}

function buildCustomerReport_(range,options) {
  const data=buildAccountingData_(range),customers={};
  reportRows_(POS.SHEETS.CUSTOMERS).forEach(function(c){
    customers[String(c.CustomerID)]={
      customerId:String(c.CustomerID),name:String(c.Name||''),customerType:String(c.CustomerType||'RETAIL'),
      phone:String(c.Phone||''),email:String(c.Email||''),active:bool_(c.Active),
      registeredAt:reportDate_(c.CreatedAt)?reportDate_(c.CreatedAt).toISOString():'',
      creditLimitUSD:number_(c.CreditLimitUSD),outstandingUSD:getCustomerOutstanding_(c.CustomerID),
      transactions:0,grossSalesUSD:0,refundsUSD:0,netSalesUSD:0,lastPurchase:null
    };
  });
  const saleCustomer={};
  data.sales.forEach(function(s){
    const id=String(s.CustomerID||'');saleCustomer[String(s.SaleID)]=id;if(!id||!customers[id])return;
    const c=customers[id];c.transactions++;c.grossSalesUSD+=number_(s.TotalUSD);
    const d=reportDate_(s.DateTime||s.CreatedAt);if(d&&(!c.lastPurchase||d>c.lastPurchase))c.lastPurchase=d;
  });
  data.returns.forEach(function(r){const id=saleCustomer[String(r.SaleID)]||'';if(id&&customers[id])customers[id].refundsUSD+=number_(r.AmountUSD);});
  const query=sanitizeText_(options&&options.query,120).toLowerCase();
  const rows=Object.keys(customers).map(function(id){
    const c=customers[id];c.grossSalesUSD=roundMoney_(c.grossSalesUSD);c.refundsUSD=roundMoney_(c.refundsUSD);
    c.netSalesUSD=roundMoney_(c.grossSalesUSD-c.refundsUSD);c.averageSaleUSD=c.transactions?roundMoney_(c.netSalesUSD/c.transactions):0;
    c.lastPurchase=c.lastPurchase?c.lastPurchase.toISOString():'';
    return c;
  }).filter(function(c){return !query||[c.name,c.customerType,c.phone,c.email,c.customerId].join(' ').toLowerCase().indexOf(query)>=0;})
    .sort(function(a,b){return b.netSalesUSD-a.netSalesUSD;});
  const buying=rows.filter(function(r){return r.transactions>0;});
  return {type:'CUSTOMER',title:'Customer Analysis',from:range.from.toISOString(),to:range.to.toISOString(),
    totals:{
      customers:rows.length,activeCustomers:rows.filter(function(r){return r.active;}).length,
      buyingCustomers:buying.length,repeatCustomers:rows.filter(function(r){return r.transactions>1;}).length,
      netSalesUSD:roundMoney_(rows.reduce(function(s,r){return s+r.netSalesUSD;},0)),
      outstandingUSD:roundMoney_(rows.reduce(function(s,r){return s+r.outstandingUSD;},0)),
      averageCustomerValueUSD:buying.length?roundMoney_(buying.reduce(function(s,r){return s+r.netSalesUSD;},0)/buying.length):0
    },rows:rows};
}

function buildCreditReport_(sessionToken,range,options) {
  const data=getCreditAccountsData(sessionToken,options);
  const rows=(data.receivables||[]).filter(function(row) {
    return reportInRange_(row.invoiceDate, range);
  });
  const customerIds={};
  rows.forEach(function(row){customerIds[String(row.customerId||'')]=true;});
  const totals={
    outstandingUSD:roundMoney_(rows.reduce(function(sum,row){return sum+number_(row.balanceUSD);},0)),
    overdueUSD:roundMoney_(rows.filter(function(row){return row.status==='OVERDUE';}).reduce(function(sum,row){return sum+number_(row.balanceUSD);},0)),
    openInvoices:rows.filter(function(row){return number_(row.balanceUSD)>0.000001;}).length,
    overdueInvoices:rows.filter(function(row){return row.status==='OVERDUE';}).length,
    customers:Object.keys(customerIds).filter(Boolean).length
  };
  return {type:'CREDIT',title:'Customer Credit',from:range.from.toISOString(),to:range.to.toISOString(),totals:totals,rows:rows};
}

function getReceipt(sessionToken,saleId){requireSession_(sessionToken);return getSaleReceipt_(saleId);}


function buildRefundSummaryReport_(range, options) {
  options=options||{};
  const query=sanitizeText_(options.query,160).toLowerCase();
  const sales={};reportRows_(POS.SHEETS.SALES).forEach(function(s){sales[String(s.SaleID)]=s;});
  const returnItems={};reportRows_(POS.SHEETS.RETURN_ITEMS).forEach(function(i){const id=String(i.ReturnID);if(!returnItems[id])returnItems[id]=[];returnItems[id].push(i);});
  const rows=reportRows_(POS.SHEETS.RETURNS)
    .filter(function(r){return String(r.Status||'COMPLETED').toUpperCase()!=='CANCELLED'&&reportInRange_(r.DateTime||r.CreatedAt,range);})
    .map(function(r){
      const sale=sales[String(r.SaleID)]||{};const items=returnItems[String(r.ReturnID)]||[];
      const hay=[r.ReturnNo,r.InvoiceNo,r.Reason,r.UserName,sale.CustomerName].join(' ').toLowerCase();
      if(query&&hay.indexOf(query)<0)return null;
      return {returnId:String(r.ReturnID||''),returnNo:String(r.ReturnNo||r.ReturnID||''),invoiceNo:String(r.InvoiceNo||''),dateTime:reportDate_(r.DateTime||r.CreatedAt).toISOString(),customerName:String(sale.CustomerName||'Walk-in'),amountUSD:roundMoney_(number_(r.AmountUSD)),refundMethod:String(r.RefundMethod||''),refundCurrency:String(r.RefundCurrency||'USD'),reason:String(r.Reason||''),processedBy:String(r.UserName||''),itemCount:items.length,qtyReturned:items.reduce(function(sum,i){return sum+number_(i.QtyReturned);},0),restockedQty:items.reduce(function(sum,i){return sum+(bool_(i.Restock)?number_(i.QtyReturned):0);},0),damageImageUrl:String(r.DamageImageURL||''),status:String(r.Status||'COMPLETED')};
    }).filter(Boolean).sort(function(a,b){return new Date(b.dateTime)-new Date(a.dateTime);});
  return {type:'REFUND',title:'Refund Summary',from:range.from.toISOString(),to:range.to.toISOString(),totals:{returns:rows.length,refundsUSD:roundMoney_(rows.reduce(function(s,r){return s+r.amountUSD;},0)),items:rows.reduce(function(s,r){return s+r.itemCount;},0),qtyReturned:rows.reduce(function(s,r){return s+r.qtyReturned;},0),restockedQty:rows.reduce(function(s,r){return s+r.restockedQty;},0)},rows:rows};
}
