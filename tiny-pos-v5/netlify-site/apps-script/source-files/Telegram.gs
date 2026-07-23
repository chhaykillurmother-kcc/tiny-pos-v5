/** Tiny POS v5.0 Telegram bot integration. */
function normalizeNetlifyAppUrlV50_(value) {
  const url = String(value || '').trim().replace(/\/+$/, '');
  if (!url) throw new Error('Netlify POS URL is required.');
  if (!/^https:\/\//i.test(url)) throw new Error('Netlify POS URL must begin with https://');
  return url;
}

function telegramApi_(method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token) throw new Error('BOT_TOKEN is not configured.');
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  const result = safeJsonParse_(response.getContentText(), {});
  if (response.getResponseCode() >= 300 || !result.ok) {
    throw new Error('Telegram API error: ' + (result.description || response.getContentText()));
  }
  return result.result;
}

function getBackendWebAppUrlV50_() {
  const props = PropertiesService.getScriptProperties();
  const stored = String(props.getProperty('WEB_APP_URL') || '').trim();
  const live = String(ScriptApp.getService().getUrl() || '').trim();
  const url = live || stored;
  if (!url || !/\/exec(?:\?|$)/.test(url)) {
    throw new Error('Deploy the Apps Script project as a Web app first.');
  }
  props.setProperty('WEB_APP_URL', url.split('?')[0]);
  return url.split('?')[0];
}

function getNetlifyAppUrlV50_() {
  return normalizeNetlifyAppUrlV50_(
    PropertiesService.getScriptProperties().getProperty('NETLIFY_APP_URL')
  );
}

function setTelegramWebhook_() {
  const props = PropertiesService.getScriptProperties();
  const backendUrl = getBackendWebAppUrlV50_();
  let secret = props.getProperty('WEBHOOK_SECRET');
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('WEBHOOK_SECRET', secret);
  }
  const webhookUrl = backendUrl + '?hook=' + encodeURIComponent(secret);
  return telegramApi_('setWebhook', {
    url: webhookUrl,
    drop_pending_updates: true,
    max_connections: 1,
    allowed_updates: ['message']
  });
}

function setTelegramMenuButton_() {
  const appUrl = getNetlifyAppUrlV50_();
  return telegramApi_('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Open POS',
      web_app: {url: appUrl}
    }
  });
}

function configureTelegramBotV50() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const tokenResponse = ui.prompt(
    'New Telegram Bot Token',
    'Paste the token from @BotFather:',
    ui.ButtonSet.OK_CANCEL
  );
  if (tokenResponse.getSelectedButton() !== ui.Button.OK) return {cancelled:true};
  const token = String(tokenResponse.getResponseText() || '').trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error('The Telegram bot token format is invalid.');
  }

  const urlResponse = ui.prompt(
    'Netlify Tiny POS URL',
    'Paste the production Netlify URL, for example https://tiny-pos-name.netlify.app',
    ui.ButtonSet.OK_CANCEL
  );
  if (urlResponse.getSelectedButton() !== ui.Button.OK) return {cancelled:true};
  const netlifyUrl = normalizeNetlifyAppUrlV50_(urlResponse.getResponseText());

  props.setProperty('BOT_TOKEN', token);
  props.setProperty('NETLIFY_APP_URL', netlifyUrl);
  props.setProperty('WEB_APP_URL', getBackendWebAppUrlV50_());

  const webhook = setTelegramWebhook_();
  const menu = setTelegramMenuButton_();

  const result = {
    success: true,
    netlifyUrl: netlifyUrl,
    backendUrl: props.getProperty('WEB_APP_URL'),
    webhook: webhook,
    menuButton: menu
  };

  ui.alert(
    'Telegram bot connected.\n\n' +
    'POS URL: ' + netlifyUrl + '\n' +
    'Backend webhook: ' + props.getProperty('WEB_APP_URL')
  );
  return result;
}

function handleTelegramUpdate_(update) {
  const message = update && update.message;
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const telegramUserId = message.from && message.from.id ? String(message.from.id) : '';
  const text = String(message.text || '').trim();
  const appUrl = getNetlifyAppUrlV50_();

  if (text === '/start' || text === '/menu') {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text:
        '🛒 Tiny POS\n\n' +
        'Your Telegram ID: ' + telegramUserId + '\n' +
        'លេខសម្គាល់ Telegram របស់អ្នក: ' + telegramUserId + '\n\n' +
        'Tap the button below to open Tiny POS.',
      reply_markup: {
        inline_keyboard: [[{
          text: '🛒 Open POS / បើក POS',
          web_app: {url: appUrl}
        }]]
      }
    });
    return;
  }

  if (text === '/id') {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: 'Your Telegram ID: ' + telegramUserId
    });
    return;
  }

  if (text === '/today') {
    const summary = getTodaySummary_();
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text:
        '📊 Today / ថ្ងៃនេះ\n' +
        'Invoices: ' + summary.transactions + '\n' +
        'Revenue: $' + summary.revenueUSD.toFixed(2)
    });
    return;
  }

  telegramApi_('sendMessage', {
    chat_id: chatId,
    text:
      'Use /start to open Tiny POS.\n' +
      'Use /id to see your Telegram ID.\n\n' +
      'ប្រើ /start ដើម្បីបើក POS។'
  });
}

function notifySaleToTelegram_(sale, user) {
  const telegramId = user && user.TelegramID;
  if (!telegramId) return;
  try {
    telegramApi_('sendMessage', {
      chat_id: String(telegramId),
      text:
        '✅ Sale completed\n' +
        'Invoice: ' + sale.invoiceNo + '\n' +
        'Total: $' + Number(sale.totalUSD).toFixed(2) + '\n' +
        'Payment: ' + sale.paymentMethod
    });
  } catch (error) {
    console.error('Telegram receipt notification failed', error);
  }
}
