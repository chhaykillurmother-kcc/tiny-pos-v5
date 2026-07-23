function uuid_(prefix) {
  return (prefix ? prefix + '-' : '') + Utilities.getUuid();
}

function nowIso_() {
  return Utilities.formatDate(new Date(), POS.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function dateKey_(date) {
  return Utilities.formatDate(date || new Date(), POS.TIME_ZONE, 'yyyyMMdd');
}

function roundMoney_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function number_(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function bool_(value) {
  return String(value).toUpperCase() === 'TRUE' || value === true || value === 1;
}

function bytesToHex_(bytes) {
  return bytes.map(function(byte) {
    return ('0' + ((byte & 0xff).toString(16))).slice(-2);
  }).join('');
}

function sha256Hex_(value) {
  return bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ));
}

function safeJsonParse_(text, fallback) {
  try { return JSON.parse(text); } catch (error) { return fallback; }
}

function requireRole_(user, allowedRoles) {
  if (!user || allowedRoles.indexOf(user.Role) === -1) {
    throw new Error('You do not have permission for this action.');
  }
}

function publicUser_(user) {
  const branchId = getUserBranchId_(user);
  const branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', branchId);
  return {
    userId: String(user.UserID),
    loginId: String(user.LoginID || ''),
    name: String(user.Name),
    telegramId: String(user.TelegramID || ''),
    email: String(user.Email || ''),
    role: String(user.Role),
    branchId: branchId,
    branchName: branch ? String(branch.NameEN || branch.NameKH || branch.Code || branchId) : branchId,
    permissions: getUserPermissions_(user),
    active: bool_(user.Active),
    language: String(user.Language || 'en'),
    theme: String(user.Theme || 'auto'),
    themeColor: String(user.ThemeColor || 'DEFAULT').toUpperCase(),
    lastLoginAt: user.LastLoginAt ? new Date(user.LastLoginAt).toISOString() : ''
  };
}

function sanitizeText_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 255);
}

function parseDataUrl_(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');
  return {mimeType: match[1], bytes: Utilities.base64Decode(match[2])};
}
