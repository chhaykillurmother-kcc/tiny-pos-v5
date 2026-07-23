/** Tiny POS v5.0 fresh installation and configuration helpers. */
function ensureApiSecretV50_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('POS_API_SECRET');
  if (!secret) {
    secret = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + Date.now(),
        Utilities.Charset.UTF_8
      )
    ).replace(/=+$/g, '');
    props.setProperty('POS_API_SECRET', secret);
  }
  return secret;
}

function installTinyPOSV50Fresh() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the new blank Google Sheet first.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  props.setProperty('TINY_POS_VERSION', POS.VERSION);
  ensureApiSecretV50_();

  installTinyPOSComplete();
  installProductPackagingV41();
  installOperationsScannerUpgradeV43();

  const result = verifyTinyPOSV50();
  if (!result.success) {
    throw new Error('Installation finished with verification problems:\n' + result.problems.join('\n'));
  }

  SpreadsheetApp.getUi().alert(
    'Tiny POS v5.0 fresh database is ready.\n\n' +
    'Next: deploy this Apps Script project as a Web app, then run showNetlifyEnvironmentValuesV50.'
  );

  return result;
}

function verifyTinyPOSV50() {
  const problems = [];

  try {
    const base = verifyTinyPOSComplete();
    if (!/OK/i.test(String(base || ''))) problems.push(String(base));
  } catch (error) {
    problems.push('Base database: ' + error.message);
  }

  try {
    const packaging = verifyProductPackagingV41();
    if (packaging && packaging.success === false) {
      problems.push('Product packaging verification failed.');
    }
  } catch (error) {
    problems.push('Product packaging: ' + error.message);
  }

  try {
    const operations = verifyOperationsScannerUpgradeV43();
    if (operations && operations.success === false) {
      problems.push('Expense/scanner verification failed.');
    }
  } catch (error) {
    problems.push('Expense/scanner: ' + error.message);
  }

  try {
    verifyDatabaseMaintenanceV42();
  } catch (error) {
    problems.push('Database maintenance: ' + error.message);
  }

  const requiredProperties = ['SPREADSHEET_ID', 'PASSWORD_SALT', 'POS_API_SECRET'];
  requiredProperties.forEach(function(key) {
    if (!PropertiesService.getScriptProperties().getProperty(key)) {
      problems.push('Missing Script Property: ' + key);
    }
  });

  const result = {
    success: problems.length === 0,
    version: POS.VERSION,
    spreadsheetId: getSpreadsheet_().getId(),
    problems: problems
  };

  try {
    SpreadsheetApp.getUi().alert(
      result.success
        ? 'Tiny POS v5.0 verification: OK'
        : 'Tiny POS v5.0 verification problems:\n\n' + problems.join('\n')
    );
  } catch (error) {
    console.log(JSON.stringify(result));
  }

  return result;
}

function showNetlifyEnvironmentValuesV50() {
  const backendUrl = getBackendWebAppUrlV50_();
  const secret = ensureApiSecretV50_();
  const result = {
    APPS_SCRIPT_WEB_APP_URL: backendUrl,
    POS_API_SECRET: secret
  };

  SpreadsheetApp.getUi().alert(
    'Copy these two values into Netlify environment variables.\n\n' +
    'APPS_SCRIPT_WEB_APP_URL\n' + backendUrl + '\n\n' +
    'POS_API_SECRET\n' + secret + '\n\n' +
    'Keep POS_API_SECRET private.'
  );
  console.log(JSON.stringify(result));
  return result;
}

function setNetlifyAppUrlV50() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Netlify Tiny POS URL',
    'Paste the production URL, for example https://tiny-pos-name.netlify.app',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return {cancelled:true};

  const url = normalizeNetlifyAppUrlV50_(response.getResponseText());
  PropertiesService.getScriptProperties().setProperty('NETLIFY_APP_URL', url);
  ui.alert('Saved Netlify POS URL:\n' + url);
  return {success:true, url:url};
}

function linkAdministratorTelegramV50() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Link Administrator Telegram',
    'Send /id to the new bot, then paste the numeric Telegram ID here:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return {cancelled:true};

  const telegramId = String(response.getResponseText() || '').trim();
  if (!/^\d+$/.test(telegramId)) throw new Error('Telegram ID must contain digits only.');

  const admin = getRows_(POS.SHEETS.USERS).find(function(user) {
    return String(user.Role) === POS.ROLES.ADMIN && bool_(user.Active);
  });
  if (!admin) throw new Error('No active Administrator user was found.');

  updateRowObject_(POS.SHEETS.USERS, admin._row, {
    TelegramID: telegramId,
    UpdatedAt: new Date()
  });
  ui.alert('Linked Telegram ID ' + telegramId + ' to ' + admin.Name + '.');
  return {success:true, userId:admin.UserID, telegramId:telegramId};
}

function rotatePosApiSecretV50() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('POS_API_SECRET');
  const secret = ensureApiSecretV50_();
  SpreadsheetApp.getUi().alert(
    'A new POS_API_SECRET was generated.\n\n' +
    'Update the POS_API_SECRET environment variable in Netlify immediately, then redeploy Netlify.\n\n' +
    secret
  );
  return secret;
}
