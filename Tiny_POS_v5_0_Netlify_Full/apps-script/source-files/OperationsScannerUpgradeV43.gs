/**
 * Tiny POS Operations + Camera Scanner Upgrade v4.3
 *
 * Additive module. It does not replace Operations.gs, Reports.gs, Sales.gs,
 * Product Packaging, permissions, branches, or existing transaction sheets.
 */

const EXPENSE_V43 = Object.freeze({
  CATEGORY_SHEET: 'ExpenseCategories',
  CATEGORY_HEADERS: Object.freeze([
    'ExpenseCategoryID',
    'NameEN',
    'NameKH',
    'Active',
    'CreatedBy',
    'CreatedAt',
    'UpdatedAt'
  ]),
  EXPENSE_COLUMNS: Object.freeze([
    'ExpenseNo',
    'CategoryID',
    'PaymentType',
    'UpdatedAt',
    'UpdatedBy'
  ]),
  PAYMENT_TYPES: Object.freeze(['CASH', 'BANK'])
});

function installOperationsScannerUpgradeV43() {
  const ss = getSpreadsheet_();
  const report = [];

  let categorySheet = ss.getSheetByName(EXPENSE_V43.CATEGORY_SHEET);
  if (!categorySheet) {
    categorySheet = ss.insertSheet(EXPENSE_V43.CATEGORY_SHEET);
    report.push('Created: ' + EXPENSE_V43.CATEGORY_SHEET);
  }

  addMissingColumnsSafe_(
    categorySheet,
    EXPENSE_V43.CATEGORY_HEADERS
  );

  const expenseSheet = ss.getSheetByName(POS.SHEETS.EXPENSES);
  if (!expenseSheet) {
    throw new Error(
      'Missing Expenses sheet. Run installTinyPOSComplete() first.'
    );
  }

  addMissingColumnsSafe_(
    expenseSheet,
    EXPENSE_V43.EXPENSE_COLUMNS
  );

  styleExpenseSheetV43_(categorySheet);
  styleExpenseSheetV43_(expenseSheet);

  backfillExpenseDataV43_(report);

  SpreadsheetApp.flush();

  const message = [
    'Tiny POS Operations + Scanner v4.3 installed.',
    '',
    report.length ? report.join('\n') : 'No data migration was required.',
    '',
    'Existing expenses and all other POS data were preserved.'
  ].join('\n');

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return message;
}

function verifyOperationsScannerUpgradeV43() {
  const ss = getSpreadsheet_();
  const problems = [];

  const categorySheet = ss.getSheetByName(
    EXPENSE_V43.CATEGORY_SHEET
  );

  if (!categorySheet) {
    problems.push('Missing sheet: ' + EXPENSE_V43.CATEGORY_SHEET);
  } else {
    verifyHeadersV43_(
      categorySheet,
      EXPENSE_V43.CATEGORY_HEADERS,
      problems
    );
  }

  const expenseSheet = ss.getSheetByName(POS.SHEETS.EXPENSES);
  if (!expenseSheet) {
    problems.push('Missing sheet: ' + POS.SHEETS.EXPENSES);
  } else {
    verifyHeadersV43_(
      expenseSheet,
      EXPENSE_V43.EXPENSE_COLUMNS,
      problems
    );
  }

  if (problems.length) {
    throw new Error(
      'Tiny POS v4.3 verification failed:\n- ' +
      problems.join('\n- ')
    );
  }

  const result =
    'Tiny POS Operations + Scanner v4.3: OK\n\nNo data was changed.';

  try {
    SpreadsheetApp.getUi().alert(result);
  } catch (error) {
    console.log(result);
  }

  return result;
}

function verifyHeadersV43_(sheet, requiredHeaders, problems) {
  const headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn())
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
    : [];

  requiredHeaders.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      problems.push(
        sheet.getName() + ': missing column ' + header
      );
    }
  });
}

function styleExpenseSheetV43_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return;

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#1d4ed8')
    .setFontColor('#ffffff');
}

function backfillExpenseDataV43_(report) {
  const existingCategories = getRows_(
    EXPENSE_V43.CATEGORY_SHEET
  );

  const categoryByName = {};

  existingCategories.forEach(function(row) {
    [row.NameEN, row.NameKH].forEach(function(name) {
      const key = normalizeExpenseCategoryNameV43_(name);
      if (key) categoryByName[key] = row;
    });
  });

  const expenses = getRows_(POS.SHEETS.EXPENSES)
    .sort(function(a, b) {
      const aTime = expenseDateV43_(a.DateTime).getTime();
      const bTime = expenseDateV43_(b.DateTime).getTime();
      return aTime - bTime || a._row - b._row;
    });

  let categoriesCreated = 0;
  let expensesUpdated = 0;
  const perDaySequence = {};
  const sequenceProps = {};

  /* Read every existing sequence first so a blank legacy row can never be
     assigned a code already used by a later row. */
  expenses.forEach(function(row) {
    const match = String(row.ExpenseNo || '').match(
      /^EXP-(\d{8})-(\d+)$/i
    );

    if (!match) return;

    perDaySequence[match[1]] = Math.max(
      perDaySequence[match[1]] || 0,
      Number(match[2]) || 0
    );
  });

  expenses.forEach(function(row) {
    const changes = {};
    const categoryText = sanitizeText_(row.Category, 80) || 'General';
    const categoryKey = normalizeExpenseCategoryNameV43_(categoryText);
    let category = categoryByName[categoryKey];

    if (!category) {
      const categoryId = uuid_('EXC');
      const now = new Date();

      appendObject_(EXPENSE_V43.CATEGORY_SHEET, {
        ExpenseCategoryID: categoryId,
        NameEN: categoryText,
        NameKH: categoryText,
        Active: true,
        CreatedBy: String(row.UserID || ''),
        CreatedAt: now,
        UpdatedAt: now
      });

      category = {
        ExpenseCategoryID: categoryId,
        NameEN: categoryText,
        NameKH: categoryText,
        Active: true
      };

      categoryByName[categoryKey] = category;
      categoriesCreated++;
    }

    if (!String(row.CategoryID || '').trim()) {
      changes.CategoryID = String(category.ExpenseCategoryID);
    }

    if (!String(row.PaymentType || '').trim()) {
      changes.PaymentType = 'CASH';
    }

    if (!String(row.ExpenseNo || '').trim()) {
      const dateKey = Utilities.formatDate(
        expenseDateV43_(row.DateTime),
        POS.TIME_ZONE,
        'yyyyMMdd'
      );

      perDaySequence[dateKey] =
        (perDaySequence[dateKey] || 0) + 1;

      changes.ExpenseNo =
        'EXP-' + dateKey + '-' +
        String(perDaySequence[dateKey]).padStart(4, '0');
    }

    if (!row.UpdatedAt) {
      changes.UpdatedAt = row.CreatedAt || row.DateTime || new Date();
    }

    if (!String(row.UpdatedBy || '').trim()) {
      changes.UpdatedBy = String(row.UserID || '');
    }

    if (Object.keys(changes).length) {
      updateRowObject_(
        POS.SHEETS.EXPENSES,
        row._row,
        changes
      );
      expensesUpdated++;
    }
  });

  Object.keys(perDaySequence).forEach(function(dateKey) {
    sequenceProps['EXPENSE_SEQ_' + dateKey] = String(
      perDaySequence[dateKey]
    );
  });

  if (Object.keys(sequenceProps).length) {
    PropertiesService.getScriptProperties()
      .setProperties(sequenceProps, false);
  }

  if (categoriesCreated) {
    report.push(
      'Created ' + categoriesCreated +
      ' expense categor' +
      (categoriesCreated === 1 ? 'y' : 'ies') + '.'
    );
  }

  if (expensesUpdated) {
    report.push(
      'Upgraded ' + expensesUpdated +
      ' existing expense record(s).'
    );
  }
}

function normalizeExpenseCategoryNameV43_(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function expenseDateV43_(value) {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(value || Date.now());

  return isNaN(date.getTime()) ? new Date() : date;
}

function expenseCategoryPublicV43_(row) {
  return {
    categoryId: String(row.ExpenseCategoryID || ''),
    nameEN: String(row.NameEN || row.NameKH || ''),
    nameKH: String(row.NameKH || row.NameEN || ''),
    active: bool_(row.Active)
  };
}

function listExpenseCategoriesV43_(includeInactive) {
  return getRows_(EXPENSE_V43.CATEGORY_SHEET)
    .filter(function(row) {
      return includeInactive || bool_(row.Active);
    })
    .sort(function(a, b) {
      return String(a.NameEN || a.NameKH || '')
        .localeCompare(
          String(b.NameEN || b.NameKH || ''),
          'en',
          {numeric: true, sensitivity: 'base'}
        );
    });
}

function saveExpenseCategoryV43(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  payload = payload || {};

  let nameEN = sanitizeText_(payload.nameEN, 80);
  let nameKH = sanitizeText_(payload.nameKH, 80);

  if (!nameEN && !nameKH) {
    throw new Error('Enter an expense category name.');
  }

  nameEN = nameEN || nameKH;
  nameKH = nameKH || nameEN;

  const wantedKeys = [nameEN, nameKH]
    .map(normalizeExpenseCategoryNameV43_)
    .filter(Boolean);

  const duplicate = listExpenseCategoriesV43_(true)
    .find(function(row) {
      const existingKeys = [row.NameEN, row.NameKH]
        .map(normalizeExpenseCategoryNameV43_)
        .filter(Boolean);

      return existingKeys.some(function(key) {
        return wantedKeys.indexOf(key) >= 0;
      });
    });

  if (duplicate) {
    if (!bool_(duplicate.Active)) {
      updateRowObject_(
        EXPENSE_V43.CATEGORY_SHEET,
        duplicate._row,
        {
          NameEN: nameEN,
          NameKH: nameKH,
          Active: true,
          UpdatedAt: new Date()
        }
      );
    }

    return {
      success: true,
      category: expenseCategoryPublicV43_(
        Object.assign({}, duplicate, {
          NameEN: nameEN,
          NameKH: nameKH,
          Active: true
        })
      ),
      reused: true
    };
  }

  const categoryId = uuid_('EXC');
  const now = new Date();

  appendObject_(EXPENSE_V43.CATEGORY_SHEET, {
    ExpenseCategoryID: categoryId,
    NameEN: nameEN,
    NameKH: nameKH,
    Active: true,
    CreatedBy: user.UserID,
    CreatedAt: now,
    UpdatedAt: now
  });

  audit_(
    user.UserID,
    'CREATE_EXPENSE_CATEGORY',
    'ExpenseCategory',
    categoryId,
    {nameEN: nameEN, nameKH: nameKH}
  );

  return {
    success: true,
    category: {
      categoryId: categoryId,
      nameEN: nameEN,
      nameKH: nameKH,
      active: true
    },
    reused: false
  };
}

function getExpenseManagementV43(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  filters = filters || {};

  const canViewAllCreators = [
    POS.ROLES.ADMIN,
    POS.ROLES.MANAGER,
    POS.ROLES.ACCOUNTANT
  ].indexOf(String(user.Role || '')) >= 0;

  const branchId = resolveAccessibleBranchId_(
    user,
    filters.branchId,
    true
  );

  const from = parseExpenseBoundaryV43_(
    filters.from,
    false
  );

  const to = parseExpenseBoundaryV43_(
    filters.to,
    true
  );

  if (from && to && from > to) {
    throw new Error('From date cannot be after To date.');
  }

  const categoryId = sanitizeText_(filters.categoryId, 100);
  const paymentType = String(filters.paymentType || '')
    .trim()
    .toUpperCase();

  const requestedCreatorId = sanitizeText_(
    filters.creatorId,
    100
  );

  const creatorId = canViewAllCreators
    ? requestedCreatorId
    : String(user.UserID);

  const query = sanitizeText_(filters.query, 160)
    .toLocaleLowerCase();

  const users = getRows_(POS.SHEETS.USERS);
  const userMap = {};
  users.forEach(function(row) {
    userMap[String(row.UserID)] = row;
  });

  const branches = getRows_(POS.SHEETS.BRANCHES);
  const branchMap = {};
  branches.forEach(function(row) {
    branchMap[String(row.BranchID)] = row;
  });

  const categoryRows = listExpenseCategoriesV43_(true);
  const categoryMap = {};
  categoryRows.forEach(function(row) {
    categoryMap[String(row.ExpenseCategoryID)] = row;
  });

  const rows = getRows_(POS.SHEETS.EXPENSES)
    .filter(function(row) {
      const rowDate = expenseDateV43_(row.DateTime);
      const rowBranchId = String(
        row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
      );

      const branchOk = !branchId || rowBranchId === branchId;
      const fromOk = !from || rowDate >= from;
      const toOk = !to || rowDate <= to;
      const categoryOk = !categoryId ||
        String(row.CategoryID || '') === categoryId;
      const paymentOk = !paymentType ||
        String(row.PaymentType || 'CASH').toUpperCase() === paymentType;
      const creatorOk = !creatorId ||
        String(row.UserID || '') === creatorId;

      if (!(branchOk && fromOk && toOk && categoryOk && paymentOk && creatorOk)) {
        return false;
      }

      if (!query) return true;

      const creator = userMap[String(row.UserID)] || {};
      const branch = branchMap[rowBranchId] || {};

      return [
        row.ExpenseNo,
        row.Category,
        row.PaymentType,
        row.AmountUSD,
        row.Remark,
        creator.Name,
        creator.LoginID,
        branch.NameEN,
        branch.NameKH,
        branch.Code
      ].join(' ').toLocaleLowerCase().indexOf(query) >= 0;
    })
    .sort(function(a, b) {
      return expenseDateV43_(b.DateTime).getTime() -
        expenseDateV43_(a.DateTime).getTime() ||
        b._row - a._row;
    })
    .slice(0, 1000)
    .map(function(row) {
      const creator = userMap[String(row.UserID)] || {};
      const rowBranchId = String(
        row.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
      );
      const branch = branchMap[rowBranchId] || {};
      const category = categoryMap[String(row.CategoryID)] || {};
      const canModify = canModifyExpenseV43_(user, row);

      return {
        expenseId: String(row.ExpenseID || ''),
        expenseNo: String(row.ExpenseNo || row.ExpenseID || ''),
        dateTime: expenseDateV43_(row.DateTime).toISOString(),
        branchId: rowBranchId,
        branchName: String(
          branch.NameEN || branch.NameKH || branch.Code || rowBranchId
        ),
        branchNameEN: String(
          branch.NameEN || branch.NameKH || branch.Code || rowBranchId
        ),
        branchNameKH: String(
          branch.NameKH || branch.NameEN || branch.Code || rowBranchId
        ),
        creatorId: String(row.UserID || ''),
        creatorName: String(
          creator.Name || creator.LoginID || row.UserID || ''
        ),
        categoryId: String(row.CategoryID || ''),
        categoryNameEN: String(
          category.NameEN || row.Category || ''
        ),
        categoryNameKH: String(
          category.NameKH || row.Category || ''
        ),
        category: String(row.Category || category.NameEN || ''),
        paymentType: String(row.PaymentType || 'CASH').toUpperCase(),
        amountUSD: roundMoney_(number_(row.AmountUSD)),
        remark: String(row.Remark || ''),
        canEdit: canModify,
        canDelete: canModify
      };
    });

  const totals = rows.reduce(function(result, row) {
    result.count++;
    result.totalUSD += number_(row.amountUSD);

    if (row.paymentType === 'BANK') {
      result.bankUSD += number_(row.amountUSD);
    } else {
      result.cashUSD += number_(row.amountUSD);
    }

    return result;
  }, {
    count: 0,
    totalUSD: 0,
    cashUSD: 0,
    bankUSD: 0
  });

  const accessibleBranches = branchRowsForUser_(user, false)
    .map(branchToPublic_);

  const accessibleBranchIds = {};
  accessibleBranches.forEach(function(branch) {
    accessibleBranchIds[String(branch.branchId)] = true;
  });

  const creatorOptions = users
    .filter(function(row) {
      if (!bool_(row.Active)) return false;
      if (!canViewAllCreators) {
        return String(row.UserID) === String(user.UserID);
      }

      return canManageAllBranches_(user) ||
        accessibleBranchIds[String(getUserBranchId_(row))];
    })
    .sort(function(a, b) {
      return String(a.Name || a.LoginID || '')
        .localeCompare(
          String(b.Name || b.LoginID || ''),
          'en',
          {numeric: true, sensitivity: 'base'}
        );
    })
    .map(function(row) {
      return {
        userId: String(row.UserID),
        name: String(row.Name || row.LoginID || row.UserID),
        branchId: String(getUserBranchId_(row))
      };
    });

  return {
    rows: rows,
    totals: {
      count: totals.count,
      totalUSD: roundMoney_(totals.totalUSD),
      cashUSD: roundMoney_(totals.cashUSD),
      bankUSD: roundMoney_(totals.bankUSD)
    },
    categories: categoryRows
      .filter(function(row) { return bool_(row.Active); })
      .map(expenseCategoryPublicV43_),
    branches: accessibleBranches,
    creators: creatorOptions,
    canSelectAllBranches: canManageAllBranches_(user),
    canViewAllCreators: canViewAllCreators,
    defaultBranchId: String(getUserBranchId_(user)),
    selectedBranchId: branchId,
    truncated: rows.length >= 1000
  };
}

function parseExpenseBoundaryV43_(value, endOfDay) {
  const text = String(value || '').trim();
  if (!text) return null;

  const date = new Date(
    text + (endOfDay ? 'T23:59:59.999' : 'T00:00:00')
  );

  if (isNaN(date.getTime())) {
    throw new Error('Invalid expense date filter.');
  }

  return date;
}

function canModifyExpenseV43_(user, expenseRow) {
  if (!user || !expenseRow) return false;

  if ([POS.ROLES.ADMIN, POS.ROLES.MANAGER]
      .indexOf(String(user.Role || '')) >= 0) {
    return true;
  }

  return String(expenseRow.UserID || '') ===
    String(user.UserID || '');
}

function requireExpenseModifyAccessV43_(user, expenseRow) {
  if (!canModifyExpenseV43_(user, expenseRow)) {
    throw new Error(
      'You can only edit or delete your own expenses.'
    );
  }

  requireBranchAccess_(
    user,
    String(
      expenseRow.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID
    )
  );
}

function saveExpenseV43(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  payload = payload || {};

  const expenseId = sanitizeText_(payload.expenseId, 120);
  const existing = expenseId
    ? findRowBy_(POS.SHEETS.EXPENSES, 'ExpenseID', expenseId)
    : null;

  if (expenseId && !existing) {
    throw new Error('Expense record was not found.');
  }

  if (existing) {
    requireExpenseModifyAccessV43_(user, existing);
  }

  const branchId = resolveAccessibleBranchId_(
    user,
    payload.branchId || (existing && existing.BranchID),
    false
  );

  const categoryId = sanitizeText_(payload.categoryId, 120);
  const categoryRow = categoryId
    ? findRowBy_(
        EXPENSE_V43.CATEGORY_SHEET,
        'ExpenseCategoryID',
        categoryId
      )
    : null;

  if (!categoryRow || !bool_(categoryRow.Active)) {
    throw new Error('Select an active expense category.');
  }

  const paymentType = String(payload.paymentType || 'CASH')
    .trim()
    .toUpperCase();

  if (EXPENSE_V43.PAYMENT_TYPES.indexOf(paymentType) === -1) {
    throw new Error('Expense type must be Cash or Bank.');
  }

  const amountUSD = roundMoney_(number_(payload.amountUSD));
  if (amountUSD <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const dateTime = parseExpenseDateTimeV43_(payload.dateTime);
  const remark = sanitizeText_(payload.remark, 500);
  const categoryName = String(
    categoryRow.NameEN || categoryRow.NameKH || ''
  );

  const now = new Date();

  if (existing) {
    const ownerId = String(existing.UserID || user.UserID);
    const ownerShift = paymentType === 'CASH'
      ? getOpenShiftForUser_(ownerId)
      : null;

    updateRowObject_(
      POS.SHEETS.EXPENSES,
      existing._row,
      {
        DateTime: dateTime,
        BranchID: branchId,
        CategoryID: categoryId,
        Category: categoryName,
        PaymentType: paymentType,
        AmountUSD: amountUSD,
        Remark: remark,
        ShiftID: paymentType === 'CASH'
          ? String(
              existing.ShiftID ||
              (ownerShift ? ownerShift.ShiftID : '')
            )
          : '',
        UpdatedAt: now,
        UpdatedBy: user.UserID
      }
    );

    audit_(
      user.UserID,
      'UPDATE_EXPENSE',
      'Expense',
      existing.ExpenseID,
      {
        expenseNo: existing.ExpenseNo,
        amountUSD: amountUSD,
        paymentType: paymentType,
        branchId: branchId,
        categoryId: categoryId
      }
    );

    return {
      success: true,
      expenseId: String(existing.ExpenseID),
      expenseNo: String(existing.ExpenseNo || existing.ExpenseID),
      updated: true
    };
  }

  return withScriptLock_(function() {
    const newExpenseId = uuid_('EXP');
    const expenseNo = nextExpenseNoV43_(dateTime);
    const shift = paymentType === 'CASH'
      ? getOpenShiftForUser_(user.UserID)
      : null;

    appendObject_(POS.SHEETS.EXPENSES, {
      ExpenseID: newExpenseId,
      ExpenseNo: expenseNo,
      DateTime: dateTime,
      BranchID: branchId,
      CategoryID: categoryId,
      Category: categoryName,
      PaymentType: paymentType,
      AmountUSD: amountUSD,
      Remark: remark,
      UserID: user.UserID,
      ShiftID: shift ? shift.ShiftID : '',
      CreatedAt: now,
      UpdatedAt: now,
      UpdatedBy: user.UserID
    });

    audit_(
      user.UserID,
      'CREATE_EXPENSE',
      'Expense',
      newExpenseId,
      {
        expenseNo: expenseNo,
        amountUSD: amountUSD,
        paymentType: paymentType,
        branchId: branchId,
        categoryId: categoryId
      }
    );

    return {
      success: true,
      expenseId: newExpenseId,
      expenseNo: expenseNo,
      updated: false
    };
  });
}

function nextExpenseNoV43_(dateTime) {
  const dateKey = Utilities.formatDate(
    expenseDateV43_(dateTime),
    POS.TIME_ZONE,
    'yyyyMMdd'
  );

  const propertyKey = 'EXPENSE_SEQ_' + dateKey;
  const props = PropertiesService.getScriptProperties();
  let sequence = Number(props.getProperty(propertyKey) || 0);

  if (!sequence) {
    getRows_(POS.SHEETS.EXPENSES).forEach(function(row) {
      const match = String(row.ExpenseNo || '').match(
        new RegExp('^EXP-' + dateKey + '-(\\d+)$', 'i')
      );

      if (match) {
        sequence = Math.max(
          sequence,
          Number(match[1]) || 0
        );
      }
    });
  }

  sequence++;
  props.setProperty(propertyKey, String(sequence));

  return 'EXP-' + dateKey + '-' +
    String(sequence).padStart(4, '0');
}

function parseExpenseDateTimeV43_(value) {
  if (!value) return new Date();

  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(String(value));

  if (isNaN(date.getTime())) {
    throw new Error('Invalid expense date and time.');
  }

  return date;
}

function deleteExpenseV43(sessionToken, expenseId) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'OPERATIONS');

  expenseId = sanitizeText_(expenseId, 120);
  if (!expenseId) {
    throw new Error('Expense ID is required.');
  }

  return withScriptLock_(function() {
    const existing = findRowBy_(
      POS.SHEETS.EXPENSES,
      'ExpenseID',
      expenseId
    );

    if (!existing) {
      throw new Error('Expense record was not found.');
    }

    requireExpenseModifyAccessV43_(user, existing);

    const details = {
      expenseNo: String(existing.ExpenseNo || existing.ExpenseID),
      amountUSD: roundMoney_(number_(existing.AmountUSD)),
      category: String(existing.Category || ''),
      paymentType: String(existing.PaymentType || 'CASH'),
      branchId: String(existing.BranchID || ''),
      originalUserId: String(existing.UserID || '')
    };

    getSheet_(POS.SHEETS.EXPENSES).deleteRow(existing._row);

    audit_(
      user.UserID,
      'DELETE_EXPENSE',
      'Expense',
      expenseId,
      details
    );

    return {
      success: true,
      expenseId: expenseId,
      expenseNo: details.expenseNo
    };
  });
}
