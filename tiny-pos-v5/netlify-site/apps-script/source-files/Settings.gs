function getPublicSettings_() {
  const s = getSettings_();
  return {
    version: POS.VERSION,
    shopNameEN: String(s.SHOP_NAME_EN || ''),
    shopNameKH: String(s.SHOP_NAME_KH || ''),
    shopPhone: String(s.SHOP_PHONE || ''),
    shopAddressEN: String(s.SHOP_ADDRESS_EN || ''),
    shopAddressKH: String(s.SHOP_ADDRESS_KH || ''),
    defaultLanguage: String(s.DEFAULT_LANGUAGE || 'en'),
    defaultTheme: String(s.DEFAULT_THEME || 'auto'),
    themeColor: String(s.THEME_COLOR || 'DEFAULT').toUpperCase(),
    exchangeRate: number_(s.EXCHANGE_RATE, 4100),
    taxRate: number_(s.TAX_RATE, 0),
    receiptFooterEN: String(s.RECEIPT_FOOTER_EN || ''),
    receiptFooterKH: String(s.RECEIPT_FOOTER_KH || ''),
    bankAutoVerify: bool_(s.BANK_AUTO_VERIFY) && !!PropertiesService.getScriptProperties().getProperty('BAKONG_API_TOKEN'),
    bankManualConfirm: bool_(s.BANK_MANUAL_CONFIRM),
    qrExpiryMinutes: Math.min(10, Math.max(1, number_(s.QR_EXPIRY_MINUTES, 5))),
    khqr: {
      type: String(s.KHQR_TYPE || 'INDIVIDUAL'),
      accountId: String(s.BAKONG_ACCOUNT_ID || ''),
      merchantName: String(s.KHQR_MERCHANT_NAME || ''),
      merchantCity: String(s.KHQR_MERCHANT_CITY || 'PHNOM PENH'),
      merchantId: String(s.KHQR_MERCHANT_ID || ''),
      acquiringBank: String(s.KHQR_ACQUIRING_BANK || ''),
      currency: String(s.KHQR_CURRENCY || 'USD'),
      mobileNumber: String(s.KHQR_MOBILE_NUMBER || ''),
      storeLabel: String(s.KHQR_STORE_LABEL || ''),
      terminalLabel: String(s.KHQR_TERMINAL_LABEL || 'POS-1'),
      merchantCategoryCode: String(s.KHQR_MCC || '5999')
    }
  };
}

function saveSettings(sessionToken, changes) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  changes = changes || {};
  const allowed = [
    'SHOP_NAME_EN', 'SHOP_NAME_KH', 'SHOP_PHONE', 'SHOP_ADDRESS_EN', 'SHOP_ADDRESS_KH',
    'DEFAULT_LANGUAGE', 'DEFAULT_THEME', 'THEME_COLOR', 'EXCHANGE_RATE', 'TAX_RATE',
    'RECEIPT_FOOTER_EN', 'RECEIPT_FOOTER_KH', 'KHQR_TYPE', 'BAKONG_ACCOUNT_ID',
    'KHQR_MERCHANT_NAME', 'KHQR_MERCHANT_CITY', 'KHQR_MERCHANT_ID',
    'KHQR_ACQUIRING_BANK', 'KHQR_CURRENCY', 'KHQR_MOBILE_NUMBER',
    'KHQR_STORE_LABEL', 'KHQR_TERMINAL_LABEL', 'KHQR_MCC', 'QR_EXPIRY_MINUTES',
    'BANK_AUTO_VERIFY', 'BANK_MANUAL_CONFIRM'
  ];
  Object.keys(changes).forEach(function(key) {
    if (allowed.indexOf(key) >= 0) setSetting_(key, changes[key], 'STRING');
  });
  audit_(user.UserID, 'UPDATE_SETTINGS', 'Settings', '', changes);
  return getPublicSettings_();
}


function saveMyPreferences(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  payload = payload || {};
  const language = payload.language === 'km' ? 'km' : 'en';
  const theme = ['light','dark','auto'].indexOf(String(payload.theme||'')) >= 0 ? String(payload.theme) : 'auto';
  const color = ['DEFAULT','BLUE','TEAL','GREEN','PURPLE','ORANGE','ROSE'].indexOf(String(payload.themeColor||'DEFAULT').toUpperCase()) >= 0 ? String(payload.themeColor||'DEFAULT').toUpperCase() : 'DEFAULT';
  const row = findRowBy_(POS.SHEETS.USERS,'UserID',user.UserID);
  updateRowObject_(POS.SHEETS.USERS,row._row,{Language:language,Theme:theme,ThemeColor:color,UpdatedAt:new Date()});
  audit_(user.UserID,'UPDATE_MY_PREFERENCES','User',user.UserID,{language:language,theme:theme,themeColor:color});
  return publicUser_(findRowBy_(POS.SHEETS.USERS,'UserID',user.UserID));
}
