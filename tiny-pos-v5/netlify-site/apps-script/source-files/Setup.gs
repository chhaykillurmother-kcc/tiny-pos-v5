function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tiny POS Setup')
    .addItem('1. Install / Upgrade Complete POS', 'installTinyPOSComplete')
    .addItem('2. Verify Complete POS', 'verifyTinyPOSComplete')
    .addSeparator()
    .addItem('3. Configure Telegram Bot', 'configureTelegram')
    .addItem('4. Connect Telegram + Blue Button', 'setupTelegramDeployment')
    .addItem('5. Check Telegram Connection', 'checkTelegramConnection')
    .addSeparator()
    .addItem('6. Configure Cloudinary Images', 'configureCloudinary')
    .addItem('7. Check Cloudinary Images', 'checkCloudinaryConfiguration')
    .addSeparator()
    .addItem('8. Configure Bakong Token', 'configureBakongToken')
    .addItem('9. Backup Database', 'backupTinyPOSDatabase')
    .addItem('Add Demo Products', 'seedDemoProducts')
    .addToUi();
}


function configureTelegram() {
  const ui = SpreadsheetApp.getUi();
  const token = promptRequired_(ui, 'Telegram bot token', 'Paste the token received from @BotFather:');
  PropertiesService.getScriptProperties().setProperty('BOT_TOKEN', token);
  ui.alert('Telegram token saved securely in Script Properties.');
}

function configureBakongToken() {
  const ui = SpreadsheetApp.getUi();
  const token = promptOptional_(ui, 'Bakong Open API token', 'Paste the Bakong Open API access token. Leave blank to disable automatic bank-payment verification:');
  const props = PropertiesService.getScriptProperties();
  if (token) props.setProperty('BAKONG_API_TOKEN', token);
  else props.deleteProperty('BAKONG_API_TOKEN');

  const baseUrl = promptOptional_(ui, 'Bakong API base URL', 'Production default: https://api-bakong.nbc.gov.kh');
  props.setProperty('BAKONG_API_BASE_URL', baseUrl || 'https://api-bakong.nbc.gov.kh');
  setSetting_('BANK_AUTO_VERIFY', token ? 'TRUE' : 'FALSE', 'BOOLEAN');
  ui.alert(token ? 'Bakong token saved; automatic verification enabled.' : 'Automatic verification disabled.');
}

function setupTelegramDeployment() {
  const ui = SpreadsheetApp.getUi();
  const detectedUrl = ScriptApp.getService().getUrl() || '';
  const response = ui.prompt(
    'Published Web App URL',
    'Paste the published Web App URL ending in /exec.\n\n' +
    'Do NOT paste a URL ending in /dev.\n' +
    'Do NOT paste the Apps Script editor URL.\n\n' +
    (detectedUrl ? 'Detected URL: ' + detectedUrl : ''),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const url = normalizePublishedWebAppUrl_(response.getResponseText());

  // Verify that the URL is publicly reachable before saving it in Telegram.
  const testResponse = UrlFetchApp.fetch(url, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = testResponse.getResponseCode();
  if (status < 200 || status >= 400) {
    throw new Error(
      'The Web App URL is not publicly reachable. HTTP status: ' + status +
      '. Redeploy with Execute as: Me and Who has access: Anyone.'
    );
  }

  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
  setTelegramWebhook_();
  setTelegramMenuButton_();

  const info = telegramApi_('getWebhookInfo', {});
  ui.alert(
    'Telegram connected successfully.\n\n' +
    'Mini App URL:\n' + url + '\n\n' +
    'Webhook URL:\n' + (info.url || '(empty)') + '\n\n' +
    'Pending updates: ' + (info.pending_update_count || 0) + '\n' +
    'Last error: ' + (info.last_error_message || 'None')
  );
}

function checkTelegramConnection() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const appUrl = props.getProperty('WEB_APP_URL') || '(not saved)';
  const info = telegramApi_('getWebhookInfo', {});
  const menu = telegramApi_('getChatMenuButton', {});

  ui.alert(
    'Saved Mini App URL:\n' + appUrl + '\n\n' +
    'Telegram webhook URL:\n' + (info.url || '(empty)') + '\n\n' +
    'Pending updates: ' + (info.pending_update_count || 0) + '\n' +
    'Last error date: ' + (info.last_error_date || 'None') + '\n' +
    'Last error message: ' + (info.last_error_message || 'None') + '\n\n' +
    'Menu type: ' + (menu.type || 'unknown') + '\n' +
    'Menu text: ' + (menu.text || '') + '\n' +
    'Menu URL: ' + (menu.web_app && menu.web_app.url ? menu.web_app.url : '')
  );
}

function seedDemoProducts() {
  const existing = getRows_(POS.SHEETS.PRODUCTS);
  if (existing.length) throw new Error('Products sheet is not empty. Demo data was not added.');
  const now = new Date();
  appendObjects_(POS.SHEETS.PRODUCTS, [
    {ProductID: 'PRD-DEMO-001', Barcode: '885000000001', SKU: 'COKE-330', NameEN: 'Coca-Cola 330ml', NameKH: 'កូកាកូឡា 330ml', CategoryID: 'CAT-DRINKS', UnitID: 'UNT-CAN', CostUSD: 0.45, PriceUSD: 0.75, PriceKHR: 3100, CurrentStock: 50, LowStockLevel: 10, ImageURL: '', ImageFileID: '', Active: true, CreatedAt: now, UpdatedAt: now},
    {ProductID: 'PRD-DEMO-002', Barcode: '885000000002', SKU: 'WATER-500', NameEN: 'Water 500ml', NameKH: 'ទឹកសុទ្ធ 500ml', CategoryID: 'CAT-DRINKS', UnitID: 'UNT-PIECE', CostUSD: 0.15, PriceUSD: 0.30, PriceKHR: 1200, CurrentStock: 100, LowStockLevel: 20, ImageURL: '', ImageFileID: '', Active: true, CreatedAt: now, UpdatedAt: now}
  ]);
  withScriptLock_(function() {
    createOpeningStockLotLocked_('PRD-DEMO-001', 50, 0.45, 'SYSTEM', 'Demo opening stock');
    createOpeningStockLotLocked_('PRD-DEMO-002', 100, 0.15, 'SYSTEM', 'Demo opening stock');
  });
  SpreadsheetApp.getUi().alert('Demo products and FIFO opening lots added.');
}

function promptRequired_(ui, title, message) {
  const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) throw new Error('Setup cancelled.');
  const value = response.getResponseText().trim();
  if (!value) throw new Error(title + ' is required.');
  return value;
}

function promptOptional_(ui, title, message) {
  const response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return '';
  return response.getResponseText().trim();
}
