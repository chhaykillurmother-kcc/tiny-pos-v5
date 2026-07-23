function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('SPREADSHEET_ID is not configured. Run installPOS() from the bound spreadsheet.');
  props.setProperty('SPREADSHEET_ID', active.getId());
  return active;
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run installPOS().');
  return sheet;
}

function ensureSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const existing = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];

  const needsHeader = headers.some(function(header, index) {
    return existing[index] !== header;
  });

  if (needsHeader) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1d4ed8')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function getRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return values.map(function(row, index) {
    const obj = {_row: index + 2};
    headers.forEach(function(header, col) { obj[header] = row[col]; });
    return obj;
  });
}

function appendObject_(sheetName, object) {
  return appendObjects_(sheetName, [object]);
}

function appendObjects_(sheetName, objects) {
  if (!objects || !objects.length) return;
  const sheet = getSheet_(sheetName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = objects.map(function(object) {
    return headers.map(function(header) {
      return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '';
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateRowObject_(sheetName, rowNumber, changes) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function(header, col) {
    if (Object.prototype.hasOwnProperty.call(changes, header)) row[col] = changes[header];
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function findRowBy_(sheetName, field, value) {
  const normalized = String(value);
  return getRows_(sheetName).find(function(row) {
    return String(row[field]) === normalized;
  }) || null;
}

function getSettings_() {
  const result = {};
  getRows_(POS.SHEETS.SETTINGS).forEach(function(row) {
    result[String(row.Key)] = row.Value;
  });
  return result;
}

function setSetting_(key, value, type) {
  const existing = findRowBy_(POS.SHEETS.SETTINGS, 'Key', key);
  const now = new Date();
  if (existing) {
    updateRowObject_(POS.SHEETS.SETTINGS, existing._row, {
      Value: String(value),
      Type: type || existing.Type || 'STRING',
      UpdatedAt: now
    });
  } else {
    appendObject_(POS.SHEETS.SETTINGS, {
      Key: key,
      Value: String(value),
      Type: type || 'STRING',
      UpdatedAt: now
    });
  }
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function audit_(userId, action, entity, entityId, details) {
  appendObject_(POS.SHEETS.AUDIT, {
    AuditID: uuid_('AUD'),
    DateTime: new Date(),
    UserID: userId || '',
    Action: action,
    Entity: entity,
    EntityID: entityId || '',
    DetailsJSON: JSON.stringify(details || {})
  });
}
