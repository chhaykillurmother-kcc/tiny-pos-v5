function unitToPublic_(row) {
  return {
    unitId: String(row.UnitID || ''),
    nameEN: String(row.NameEN || ''),
    nameKH: String(row.NameKH || ''),
    abbreviation: String(row.Abbreviation || ''),
    allowDecimal: bool_(row.AllowDecimal),
    sortOrder: number_(row.SortOrder, 999),
    active: bool_(row.Active)
  };
}

function listActiveUnits_() {
  return getRows_(POS.SHEETS.UNITS)
    .filter(function(row) { return bool_(row.Active); })
    .sort(function(a,b) { return number_(a.SortOrder,999) - number_(b.SortOrder,999); })
    .map(unitToPublic_);
}

function listUnits(sessionToken) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK]);
  return getRows_(POS.SHEETS.UNITS)
    .sort(function(a,b) { return number_(a.SortOrder,999) - number_(b.SortOrder,999); })
    .map(unitToPublic_);
}

function saveUnit(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER]);
  payload = payload || {};
  const existing = payload.unitId
    ? findRowBy_(POS.SHEETS.UNITS, 'UnitID', payload.unitId)
    : null;
  const nameEN = sanitizeText_(payload.nameEN, 60);
  const nameKH = sanitizeText_(payload.nameKH, 60);
  const abbreviation = sanitizeText_(payload.abbreviation, 20);
  if (!nameEN && !nameKH) throw new Error('Unit name is required.');
  const now = new Date();
  const changes = {
    NameEN: nameEN,
    NameKH: nameKH,
    Abbreviation: abbreviation,
    AllowDecimal: payload.allowDecimal === true,
    SortOrder: number_(payload.sortOrder, 999),
    Active: payload.active !== false,
    UpdatedAt: now
  };
  let unitId;
  if (existing) {
    unitId = String(existing.UnitID);
    updateRowObject_(POS.SHEETS.UNITS, existing._row, changes);
  } else {
    unitId = uuid_('UNT');
    changes.UnitID = unitId;
    changes.CreatedAt = now;
    appendObject_(POS.SHEETS.UNITS, changes);
  }
  audit_(user.UserID, existing ? 'UPDATE_UNIT' : 'CREATE_UNIT', 'Unit', unitId, changes);
  return {success:true, unitId:unitId};
}