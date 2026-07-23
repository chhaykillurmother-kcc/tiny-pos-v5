/**
 * Tiny POS v5.0 secure Netlify-to-Apps-Script API router.
 * Only functions in this explicit allowlist can be called through HTTP.
 */
function handleNetlifyApiV50_(e) {
  const requestId = Utilities.getUuid();
  try {
    const raw = e && e.postData && e.postData.contents
      ? String(e.postData.contents)
      : '';

    if (!raw) throw new Error('Request body is empty.');
    if (raw.length > 7000000) throw new Error('Request body is too large.');

    const request = JSON.parse(raw);
    verifyNetlifyApiSecretV50_(request.apiSecret);

    const action = String(request.action || '').trim();
    const args = Array.isArray(request.args) ? request.args : [];
    const routes = getNetlifyApiRoutesV50_();

    if (!Object.prototype.hasOwnProperty.call(routes, action)) {
      throw new Error('Unsupported API action: ' + action);
    }

    const result = routes[action].apply(null, args);
    return jsonOutputV50_({
      success: true,
      data: normalizeJsonValueV50_(result),
      requestId: requestId
    });
  } catch (error) {
    console.error(
      'Tiny POS API error [' + requestId + ']:',
      error && error.stack ? error.stack : String(error)
    );
    return jsonOutputV50_({
      success: false,
      message: error && error.message ? error.message : 'Backend request failed.',
      requestId: requestId
    });
  }
}

function verifyNetlifyApiSecretV50_(providedSecret) {
  const expected = PropertiesService.getScriptProperties().getProperty('POS_API_SECRET');
  if (!expected) throw new Error('POS_API_SECRET is not configured.');

  const providedHash = sha256Hex_('v5|' + String(providedSecret || ''));
  const expectedHash = sha256Hex_('v5|' + String(expected));
  if (providedHash !== expectedHash) throw new Error('Unauthorized API request.');
}

function getNetlifyApiRoutesV50_() {
  return {
    "adjustStock": adjustStock,
    "approveAndApplyStockCount": approveAndApplyStockCount,
    "bootstrap": bootstrap,
    "cancelPendingInvoice": cancelPendingInvoice,
    "cancelPurchase": cancelPurchase,
    "cancelStockCount": cancelStockCount,
    "cancelStockTransfer": cancelStockTransfer,
    "closeCashShift": closeCashShift,
    "completeBankSale": completeBankSale,
    "completeCashSale": completeCashSale,
    "completeCreditSale": completeCreditSale,
    "configureBackupSchedule": configureBackupSchedule,
    "createManualBackup": createManualBackup,
    "createStockCount": createStockCount,
    "deleteCoupon": deleteCoupon,
    "deleteCustomer": deleteCustomer,
    "deleteExpenseV43": deleteExpenseV43,
    "deleteProduct": deleteProduct,
    "deleteUser": deleteUser,
    "getAdvancedReport": getAdvancedReport,
    "getAdvancedReportV38": getAdvancedReportV38,
    "getBackupManagerData": getBackupManagerData,
    "getBackupManagerDataV38": getBackupManagerDataV38,
    "getBranchFilterOptionsV37": getBranchFilterOptionsV37,
    "getBranchTransferModuleData": getBranchTransferModuleData,
    "getBranchTransferModuleDataV39": getBranchTransferModuleDataV39,
    "getBranchWorkspaceV38": getBranchWorkspaceV38,
    "getCreditAccountsData": getCreditAccountsData,
    "getCustomerDetails": getCustomerDetails,
    "getCustomerStatement": getCustomerStatement,
    "getCustomersModuleData": getCustomersModuleData,
    "getDatabaseMaintenanceDataV42": getDatabaseMaintenanceDataV42,
    "getExpenseManagementV43": getExpenseManagementV43,
    "getInventoryModuleDataV37": getInventoryModuleDataV37,
    "getOperationsStatus": getOperationsStatus,
    "getPendingInvoice": getPendingInvoice,
    "getProductFifoLots": getProductFifoLots,
    "getPurchaseDetails": getPurchaseDetails,
    "getPurchaseModuleData": getPurchaseModuleData,
    "getPurchasePrintData": getPurchasePrintData,
    "getPurchaseReturnableDetail": getPurchaseReturnableDetail,
    "getReceipt": getReceipt,
    "getReportWorkspaceV39": getReportWorkspaceV39,
    "getReports": getReports,
    "getReturnReceipt": getReturnReceipt,
    "getReturnSaleDetails": getReturnSaleDetails,
    "getReturnsModuleData": getReturnsModuleData,
    "getReturnsWorkspaceV39": getReturnsWorkspaceV39,
    "getSalesList": getSalesList,
    "getSalesListV38": getSalesListV38,
    "getSalesListWorkspaceV39": getSalesListWorkspaceV39,
    "getStockCountDetail": getStockCountDetail,
    "getStockCountModuleData": getStockCountModuleData,
    "getSupplierReturnModuleData": getSupplierReturnModuleData,
    "getTransferProductOptionsV37": getTransferProductOptionsV37,
    "listAuditLogs": listAuditLogs,
    "listBranches": listBranches,
    "listCategories": listCategories,
    "listCoupons": listCoupons,
    "listPendingInvoices": listPendingInvoices,
    "listPermissionOptions": listPermissionOptions,
    "listUnits": listUnits,
    "listUsers": listUsers,
    "loginWithCredentials": loginWithCredentials,
    "loginWithPin": loginWithPin,
    "logout": logout,
    "openCashShift": openCashShift,
    "previewCartPricing": previewCartPricing,
    "previewNextProductCodeV41": previewNextProductCodeV41,
    "printPendingInvoice": printPendingInvoice,
    "processSaleReturn": processSaleReturn,
    "processSupplierReturn": processSupplierReturn,
    "receivePurchaseStock": receivePurchaseStock,
    "receiveStockTransfer": receiveStockTransfer,
    "receiveStockTransferV39": receiveStockTransferV39,
    "recordCustomerPayment": recordCustomerPayment,
    "recordExpense": recordExpense,
    "recordSupplierPayment": recordSupplierPayment,
    "refreshAppData": refreshAppData,
    "reopenStockCount": reopenStockCount,
    "resetBusinessDataV42": resetBusinessDataV42,
    "restoreTinyPosBackup": restoreTinyPosBackup,
    "saveBranch": saveBranch,
    "saveCategory": saveCategory,
    "saveCoupon": saveCoupon,
    "saveCustomer": saveCustomer,
    "saveExpenseCategoryV43": saveExpenseCategoryV43,
    "saveExpenseV43": saveExpenseV43,
    "saveMyPreferences": saveMyPreferences,
    "savePendingInvoice": savePendingInvoice,
    "saveProduct": saveProduct,
    "savePurchaseDraft": savePurchaseDraft,
    "saveSettings": saveSettings,
    "saveStockCountDraft": saveStockCountDraft,
    "saveStockTransfer": saveStockTransfer,
    "saveSupplier": saveSupplier,
    "saveUnit": saveUnit,
    "saveUser": saveUser,
    "setEntityActive": setEntityActive,
    "setEntityActiveV38": setEntityActiveV38,
    "setEntityActiveV39": setEntityActiveV39,
    "shipStockTransfer": shipStockTransfer,
    "submitStockCount": submitStockCount
  };
}

function normalizeJsonValueV50_(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value, function(key, item) {
    if (item instanceof Date) return item.toISOString();
    if (typeof item === 'number' && !isFinite(item)) return null;
    return item;
  }));
}

function jsonOutputV50_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
