/**
 * Tiny POS v5.0 backend web entry points.
 *
 * GET  /exec            -> backend health response
 * POST /exec?api=v5     -> Netlify API bridge
 * POST /exec?hook=...   -> Telegram webhook
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      service: 'Tiny POS Backend',
      version: POS.VERSION,
      spreadsheetConfigured: Boolean(
        PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
      ),
      netlifyConfigured: Boolean(
        PropertiesService.getScriptProperties().getProperty('NETLIFY_APP_URL')
      ),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const mode = e && e.parameter && e.parameter.api
    ? String(e.parameter.api).toLowerCase()
    : '';

  if (mode === 'v5') {
    return handleNetlifyApiV50_(e);
  }

  return handleTelegramWebhookV50_(e);
}

function handleTelegramWebhookV50_(e) {
  const ok = ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);

  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('WEBHOOK_SECRET') || '';
    const receivedSecret = e && e.parameter && e.parameter.hook
      ? String(e.parameter.hook)
      : '';

    if (expectedSecret && receivedSecret !== expectedSecret) {
      console.error('Rejected Telegram webhook: invalid secret.');
      return ok;
    }

    const raw = e && e.postData && e.postData.contents
      ? e.postData.contents
      : '';
    if (!raw) return ok;

    const update = JSON.parse(raw);
    if (!claimTelegramUpdate_(update.update_id)) return ok;
    handleTelegramUpdate_(update);
  } catch (error) {
    console.error(
      'Telegram webhook error:',
      error && error.stack ? error.stack : String(error)
    );
  }

  return ok;
}

function claimTelegramUpdate_(updateId) {
  if (updateId === undefined || updateId === null) return false;

  const id = String(updateId);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'TELEGRAM_RECENT_UPDATE_IDS';
    let recent = [];

    try {
      recent = JSON.parse(props.getProperty(key) || '[]');
      if (!Array.isArray(recent)) recent = [];
    } catch (error) {
      recent = [];
    }

    if (recent.indexOf(id) !== -1) return false;

    recent.push(id);
    if (recent.length > 250) recent = recent.slice(-250);
    props.setProperty(key, JSON.stringify(recent));
    return true;
  } finally {
    lock.releaseLock();
  }
}
