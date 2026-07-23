/**
 * Cloudinary product-image integration for Google POS.
 * Credentials are stored in Apps Script Script Properties, never in Sheets
 * and never returned to the browser.
 */

function configureCloudinary() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const cloudNamePrompt = ui.prompt(
    'Cloudinary cloud name',
    'Paste the Cloud Name shown in your Cloudinary dashboard:',
    ui.ButtonSet.OK_CANCEL
  );
  if (cloudNamePrompt.getSelectedButton() !== ui.Button.OK) return;

  const apiKeyPrompt = ui.prompt(
    'Cloudinary API key',
    'Paste the API Key:',
    ui.ButtonSet.OK_CANCEL
  );
  if (apiKeyPrompt.getSelectedButton() !== ui.Button.OK) return;

  const apiSecretPrompt = ui.prompt(
    'Cloudinary API secret',
    'Paste the API Secret. Keep it private:',
    ui.ButtonSet.OK_CANCEL
  );
  if (apiSecretPrompt.getSelectedButton() !== ui.Button.OK) return;

  const cloudName = String(cloudNamePrompt.getResponseText() || '').trim();
  const apiKey = String(apiKeyPrompt.getResponseText() || '').trim();
  const apiSecret = String(apiSecretPrompt.getResponseText() || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    ui.alert('Cloudinary configuration was not saved because one or more values were empty.');
    return;
  }

  props.setProperties({
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret
  }, false);

  ui.alert(
    'Cloudinary configured',
    'Product images will now upload to Cloudinary.\n\nCloud name: ' + cloudName +
      '\nAPI key ending: ' + apiKey.slice(-4) +
      '\nAPI secret: saved securely',
    ui.ButtonSet.OK
  );
}

function checkCloudinaryConfiguration() {
  const ui = SpreadsheetApp.getUi();
  const config = getCloudinaryConfig_();
  ui.alert(
    'Cloudinary Image Storage',
    'Cloud name: ' + config.cloudName +
      '\nAPI key ending: ' + config.apiKey.slice(-4) +
      '\nAPI secret: configured' +
      '\nFolder: google-pos/products',
    ui.ButtonSet.OK
  );
}

function getCloudinaryConfig_() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    cloudName: String(props.getProperty('CLOUDINARY_CLOUD_NAME') || '').trim(),
    apiKey: String(props.getProperty('CLOUDINARY_API_KEY') || '').trim(),
    apiSecret: String(props.getProperty('CLOUDINARY_API_SECRET') || '').trim()
  };

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      'Cloudinary is not configured. In Google Sheets run POS Setup → Configure Cloudinary Images.'
    );
  }
  return config;
}

function uploadProductImageToCloudinary_(dataUrl, productId) {
  dataUrl = String(dataUrl || '');
  const parsed = parseDataUrl_(dataUrl);
  if (parsed.bytes.length > 1500000) {
    throw new Error('Compressed image must be under 1.5 MB.');
  }
  if (String(parsed.mimeType).indexOf('image/') !== 0) {
    throw new Error('The uploaded file is not a supported image.');
  }

  const config = getCloudinaryConfig_();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'google-pos/products';
  const publicId = sanitizeCloudinaryPublicId_(
    String(productId || 'product') + '-' + Date.now()
  );

  const paramsToSign = {
    folder: folder,
    public_id: publicId,
    timestamp: timestamp
  };

  const signature = cloudinarySignature_(paramsToSign, config.apiSecret);
  const endpoint =
    'https://api.cloudinary.com/v1_1/' +
    encodeURIComponent(config.cloudName) +
    '/image/upload';

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    payload: {
      file: dataUrl,
      api_key: config.apiKey,
      timestamp: String(timestamp),
      signature: signature,
      folder: folder,
      public_id: publicId
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  const result = safeJsonParse_(body, {});

  if (status < 200 || status >= 300 || !result.secure_url) {
    const message =
      result && result.error && result.error.message
        ? result.error.message
        : body || ('HTTP ' + status);
    throw new Error('Cloudinary upload failed: ' + message);
  }

  // Ask Cloudinary's delivery service to cap size and optimize format/quality.
  const optimizedUrl = String(result.secure_url).replace(
    '/upload/',
    '/upload/f_auto,q_auto,c_limit,w_600,h_600/'
  );

  return {
    fileId: 'cloudinary:' + String(result.public_id || ''),
    url: optimizedUrl
  };
}

function cloudinarySignature_(params, apiSecret) {
  const stringToSign = Object.keys(params)
    .filter(function(key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== '';
    })
    .sort()
    .map(function(key) {
      return key + '=' + String(params[key]);
    })
    .join('&') + String(apiSecret);

  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    stringToSign,
    Utilities.Charset.UTF_8
  ));
}

function sanitizeCloudinaryPublicId_(value) {
  return String(value || 'product')
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180) || 'product';
}

/**
 * Optional migration for existing Drive-backed product images.
 * Run this once from Apps Script after Cloudinary is configured.
 */
function migrateDriveProductImagesToCloudinary() {
  const ui = SpreadsheetApp.getUi();
  getCloudinaryConfig_();

  const rows = getRows_(POS.SHEETS.PRODUCTS).filter(function(row) {
    return String(row.ImageFileID || '') &&
      String(row.ImageFileID || '').indexOf('cloudinary:') !== 0 &&
      String(row.ImageURL || '').indexOf('drive.google.com') >= 0;
  });

  if (!rows.length) {
    ui.alert('No Google Drive product images were found to migrate.');
    return;
  }

  const confirm = ui.alert(
    'Migrate product images',
    'Move ' + rows.length + ' existing Drive image(s) to Cloudinary?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  let migrated = 0;
  const errors = [];

  rows.forEach(function(row) {
    try {
      const file = DriveApp.getFileById(String(row.ImageFileID));
      const blob = file.getBlob();
      const dataUrl =
        'data:' + blob.getContentType() + ';base64,' +
        Utilities.base64Encode(blob.getBytes());
      const uploaded = uploadProductImageToCloudinary_(dataUrl, row.ProductID);
      updateRowObject_(POS.SHEETS.PRODUCTS, row._row, {
        ImageURL: uploaded.url,
        ImageFileID: uploaded.fileId,
        UpdatedAt: new Date()
      });
      migrated++;
      Utilities.sleep(150);
    } catch (error) {
      errors.push(String(row.ProductID) + ': ' + (error.message || error));
    }
  });

  ui.alert(
    'Migration finished',
    'Migrated: ' + migrated + '\nFailed: ' + errors.length +
      (errors.length ? '\n\n' + errors.slice(0, 8).join('\n') : ''),
    ui.ButtonSet.OK
  );
}

/** Uploads a compressed return/damage evidence image. */
function uploadReturnImageToCloudinary_(dataUrl, referenceId) {
  dataUrl = String(dataUrl || '');
  if (!dataUrl) return {url:'',fileId:''};
  const parsed = parseDataUrl_(dataUrl);
  if (parsed.bytes.length > 1800000) throw new Error('Return image must be under 1.8 MB after compression.');
  if (String(parsed.mimeType).indexOf('image/') !== 0) throw new Error('Return evidence must be an image.');
  const config = getCloudinaryConfig_();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'tiny-pos/returns';
  const publicId = sanitizeCloudinaryPublicId_(String(referenceId || 'return') + '-' + Date.now());
  const paramsToSign = {folder:folder,public_id:publicId,timestamp:timestamp};
  const signature = cloudinarySignature_(paramsToSign, config.apiSecret);
  const endpoint = 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(config.cloudName) + '/image/upload';
  const response = UrlFetchApp.fetch(endpoint, {method:'post',payload:{file:dataUrl,api_key:config.apiKey,timestamp:String(timestamp),signature:signature,folder:folder,public_id:publicId},muteHttpExceptions:true});
  const status = response.getResponseCode();
  const body = response.getContentText();
  const result = safeJsonParse_(body, {});
  if (status < 200 || status >= 300 || !result.secure_url) {
    const message = result && result.error && result.error.message ? result.error.message : body || ('HTTP ' + status);
    throw new Error('Return image upload failed: ' + message);
  }
  return {
    fileId:'cloudinary:' + String(result.public_id || ''),
    url:String(result.secure_url).replace('/upload/','/upload/f_auto,q_auto,c_limit,w_1200,h_1200/')
  };
}
