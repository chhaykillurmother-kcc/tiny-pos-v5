function hashPin_(pin) {
  const salt = PropertiesService.getScriptProperties().getProperty('PASSWORD_SALT') || '';
  return sha256Hex_(salt + '|' + String(pin));
}

function createSession_(user) {
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('SESSION:' + token, String(user.UserID), POS.SESSION_SECONDS);
  return token;
}

function getSessionUser_(sessionToken) {
  if (!sessionToken) return null;
  const userId = CacheService.getScriptCache().get('SESSION:' + sessionToken);
  if (!userId) return null;
  const user = findRowBy_(POS.SHEETS.USERS, 'UserID', userId);
  if (!user || !bool_(user.Active)) return null;
  return user;
}

function requireSession_(sessionToken) {
  const user = getSessionUser_(sessionToken);
  if (!user) throw new Error('Your session expired. Please sign in again.');
  return user;
}

function loginWithCredentials(loginId, pin) {
  const identifier = sanitizeText_(loginId, 120).toLowerCase();
  if (!identifier) throw new Error('Staff ID is required.');
  const pinHash = hashPin_(String(pin || ''));
  const cache = CacheService.getScriptCache();
  const failKey = 'LOGIN_FAIL:' + sha256Hex_(identifier + '|' + pinHash).slice(0, 24);
  const failures = number_(cache.get(failKey), 0);

  if (failures >= 5) {
    throw new Error('Too many failed attempts. Wait 5 minutes and try again.');
  }

  const users = getRows_(POS.SHEETS.USERS);
  const user = users.find(function(row) {
    if (!bool_(row.Active) || String(row.PINHash || '') !== pinHash) return false;
    return [row.LoginID, row.UserID, row.Email, row.Name]
      .map(function(v) { return String(v || '').toLowerCase(); })
      .indexOf(identifier) >= 0;
  });

  if (!user) {
    cache.put(failKey, String(failures + 1), 300);
    throw new Error('Invalid staff ID or PIN.');
  }

  cache.remove(failKey);
  const now = new Date();
  updateRowObject_(POS.SHEETS.USERS, user._row, {LastLoginAt: now, UpdatedAt: now});
  user.LastLoginAt = now;
  const token = createSession_(user);
  audit_(user.UserID, 'LOGIN_CREDENTIALS', 'User', user.UserID, {loginId: identifier});
  return {sessionToken: token, user: publicUser_(user)};
}

function loginWithPin(pin) {
  throw new Error('Enter your Staff ID and PIN.');
}


function bootstrap(initData, sessionToken) {
  let user = getSessionUser_(sessionToken);
  let token = sessionToken || '';

  if (!user && initData) {
    const telegram = validateTelegramInitData_(initData);
    user = getRows_(POS.SHEETS.USERS).find(function(row) {
      return bool_(row.Active) && String(row.TelegramID) === String(telegram.user.id);
    }) || null;

    if (!user) {
      return {
        authenticated: false,
        telegramUser: {
          id: String(telegram.user.id),
          name: [telegram.user.first_name, telegram.user.last_name].filter(Boolean).join(' '),
          username: telegram.user.username || ''
        },
        message: 'This Telegram account is not registered in the Users sheet.'
      };
    }
    const loginAt = new Date();
    updateRowObject_(POS.SHEETS.USERS, user._row, {LastLoginAt: loginAt, UpdatedAt: loginAt});
    user.LastLoginAt = loginAt;
    token = createSession_(user);
    audit_(user.UserID, 'LOGIN_TELEGRAM', 'User', user.UserID, {telegramId: String(telegram.user.id)});
  }

  if (!user) return {authenticated: false};
  return buildBootstrapResponse_(user, token);
}

function refreshAppData(sessionToken) {
  const user = requireSession_(sessionToken);
  return buildBootstrapResponse_(user, sessionToken);
}

function buildBootstrapResponse_(user, token) {
  return {
    authenticated: true,
    sessionToken: token,
    user: publicUser_(user),
    settings: getPublicSettings_(),
    categories: listActiveCategories_(),
    units: listActiveUnits_(),
    products: listProductsForBranchV38_(user, getUserBranchId_(user)),
    customers: listActiveCustomers_(),
    dashboard: getDashboardForBranchV38_(user, getUserBranchId_(user)),
    branchContext: getBranchContextV38_(user)
  };
}

function validateTelegramInitData_(initData) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token) throw new Error('Telegram bot token is not configured.');

  const params = {};
  String(initData).split('&').forEach(function(part) {
    const pair = part.split('=');
    const key = decodeURIComponent(pair.shift() || '');
    const rawValue = pair.join('=');
    params[key] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
  });

  const receivedHash = params.hash;
  if (!receivedHash) throw new Error('Telegram authentication hash is missing.');

  const dataCheckString = Object.keys(params)
    .filter(function(key) { return key !== 'hash'; })
    .sort()
    .map(function(key) { return key + '=' + params[key]; })
    .join('\n');

  const secretKey = Utilities.computeHmacSha256Signature(
    token,
    'WebAppData',
    Utilities.Charset.UTF_8
  );
  const calculatedHash = bytesToHex_(Utilities.computeHmacSha256Signature(
    dataCheckString,
    secretKey
  ));

  if (calculatedHash !== String(receivedHash).toLowerCase()) {
    throw new Error('Invalid Telegram Mini App authentication data.');
  }

  const authDate = Number(params.auth_date || 0);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (!authDate || age < -60 || age > POS.TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    throw new Error('Telegram login data is expired. Close and reopen the Mini App.');
  }

  const user = safeJsonParse_(params.user, null);
  if (!user || !user.id) throw new Error('Telegram user information is missing.');
  return {user: user, queryId: params.query_id || '', authDate: authDate};
}

function logout(sessionToken) {
  if (sessionToken) CacheService.getScriptCache().remove('SESSION:' + sessionToken);
  return true;
}

function saveUser(sessionToken, payload) {
  const current = requireSession_(sessionToken);
  requireRole_(current, [POS.ROLES.ADMIN]);
  payload = payload || {};
  const existing = payload.userId ? findRowBy_(POS.SHEETS.USERS, 'UserID', payload.userId) : null;
  const now = new Date();
  const role = sanitizeText_(payload.role, 30);
  if (Object.keys(POS.ROLES).map(function(key) { return POS.ROLES[key]; }).indexOf(role) === -1) {
    throw new Error('Invalid role.');
  }

  const loginId = sanitizeText_(payload.loginId, 60).toLowerCase();
  if (!loginId) throw new Error('Login ID is required.');
  const duplicateLogin = getRows_(POS.SHEETS.USERS).find(function(row) {
    return String(row.LoginID || '').toLowerCase() === loginId &&
      (!existing || String(row.UserID) !== String(existing.UserID));
  });
  if (duplicateLogin) throw new Error('This Login ID is already in use.');

  const branchId = sanitizeText_(payload.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const branch = findRowBy_(POS.SHEETS.BRANCHES, 'BranchID', branchId);
  if (!branch || !bool_(branch.Active)) throw new Error('Selected branch is unavailable.');
  const permissions = normalizePermissions_(payload.permissions, role);

  const data = {
    LoginID: loginId,
    Name: sanitizeText_(payload.name, 80),
    TelegramID: sanitizeText_(payload.telegramId, 30),
    Email: sanitizeText_(payload.email, 120),
    Role: role,
    BranchID: branchId,
    PermissionsJSON: JSON.stringify(permissions),
    Active: payload.active !== false,
    Language: payload.language === 'km' ? 'km' : 'en',
    Theme: ['light', 'dark', 'auto'].indexOf(payload.theme) >= 0 ? payload.theme : 'auto',
    ThemeColor: ['DEFAULT','BLUE','TEAL','GREEN','PURPLE','ORANGE','ROSE'].indexOf(String(payload.themeColor || 'DEFAULT').toUpperCase()) >= 0 ? String(payload.themeColor || 'DEFAULT').toUpperCase() : 'DEFAULT',
    UpdatedAt: now
  };
  if (!data.Name) throw new Error('User name is required.');
  if (payload.pin) {
    if (String(payload.pin).length < 4) throw new Error('PIN must contain at least 4 characters.');
    data.PINHash = hashPin_(payload.pin);
  }

  let userId;
  if (existing) {
    userId = existing.UserID;
    updateRowObject_(POS.SHEETS.USERS, existing._row, data);
  } else {
    userId = uuid_('USR');
    data.UserID = userId;
    data.PINHash = data.PINHash || '';
    data.CreatedAt = now;
    appendObject_(POS.SHEETS.USERS, data);
  }
  audit_(current.UserID, existing ? 'UPDATE_USER' : 'CREATE_USER', 'User', userId, {role: role, branchId:branchId, permissions:permissions});
  return {success: true, userId: userId};
}

function listUsers(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN]);
  return getRows_(POS.SHEETS.USERS).map(publicUser_);
}
