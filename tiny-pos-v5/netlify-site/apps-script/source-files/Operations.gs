function getOpenShiftForUser_(userId) {
  const shifts = getRows_(POS.SHEETS.SHIFTS)
    .filter(function(row) {
      return (
        String(row.UserID) ===
          String(userId) &&
        String(row.Status) === 'OPEN'
      );
    });

  return shifts.length
    ? shifts[shifts.length - 1]
    : null;
}

function openCashShift(
  sessionToken,
  openingUSD,
  openingKHR
) {
  const user = requireSession_(sessionToken);

  if (getOpenShiftForUser_(user.UserID)) {
    throw new Error(
      'You already have an open shift.'
    );
  }

  const shiftId = uuid_('SFT');

  appendObject_(POS.SHEETS.SHIFTS, {
    ShiftID: shiftId,
    UserID: user.UserID,
    OpenAt: new Date(),
    OpeningUSD: roundMoney_(
      number_(openingUSD)
    ),
    OpeningKHR: Math.round(
      number_(openingKHR)
    ),
    CloseAt: '',
    ClosingUSD: '',
    ClosingKHR: '',
    ExpectedUSD: '',
    ExpectedKHR: '',
    DifferenceUSD: '',
    DifferenceKHR: '',
    Status: 'OPEN'
  });

  audit_(
    user.UserID,
    'OPEN_SHIFT',
    'CashShift',
    shiftId,
    {
      openingUSD: openingUSD,
      openingKHR: openingKHR
    }
  );

  return {
    success: true,
    shiftId: shiftId
  };
}

function closeCashShift(
  sessionToken,
  closingUSD,
  closingKHR
) {
  const user = requireSession_(sessionToken);
  const shift = getOpenShiftForUser_(user.UserID);

  if (!shift) {
    throw new Error(
      'No open shift was found.'
    );
  }

  const sales = getRows_(POS.SHEETS.SALES)
    .filter(function(row) {
      return (
        String(row.ShiftID) ===
          String(shift.ShiftID) &&
        String(row.Status) !==
          POS.SALE_STATUS.VOID
      );
    });

  const saleIds = {};

  sales.forEach(function(row) {
    saleIds[String(row.SaleID)] = true;
  });

  const cashPayments = getRows_(
    POS.SHEETS.PAYMENTS
  ).filter(function(row) {
    return (
      saleIds[String(row.SaleID)] &&
      String(row.Method) === 'CASH' &&
      String(row.Status) ===
        POS.PAYMENT_STATUS.PAID
    );
  });

  let cashUSD = 0;
  let cashKHR = 0;

  cashPayments.forEach(function(row) {
    if (String(row.Currency) === 'KHR') {
      cashKHR += number_(row.Amount);
    } else {
      cashUSD += number_(row.Amount);
    }
  });

  const customerPayments = getRows_(POS.SHEETS.CUSTOMER_PAYMENTS).filter(function(row) {
    return String(row.ShiftID) === String(shift.ShiftID) &&
      String(row.Method || '').toUpperCase() === 'CASH';
  });
  customerPayments.forEach(function(row) {
    if (String(row.Currency || 'USD').toUpperCase() === 'KHR') {
      cashKHR += number_(row.Amount);
    } else {
      cashUSD += number_(row.AmountUSD || row.Amount);
    }
  });

  const refundPayments = getRowsIfSheetExists_(
    RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS
  ).filter(function(row) {
    return (
      String(row.ShiftID) ===
        String(shift.ShiftID) &&
      String(row.Method) === 'CASH' &&
      String(row.Status) === 'PAID'
    );
  });

  let cashRefundUSD = 0;
  let cashRefundKHR = 0;

  refundPayments.forEach(function(row) {
    if (String(row.Currency) === 'KHR') {
      cashRefundKHR += number_(row.Amount);
    } else {
      cashRefundUSD += number_(row.Amount);
    }
  });

  const expenses = getRows_(POS.SHEETS.EXPENSES)
    .filter(function(row) {
      return String(row.ShiftID) ===
        String(shift.ShiftID);
    });

  const expenseUSD = expenses.reduce(
    function(sum, row) {
      return sum + number_(row.AmountUSD);
    },
    0
  );

  const expectedUSD = roundMoney_(
    number_(shift.OpeningUSD) +
    cashUSD -
    cashRefundUSD -
    expenseUSD
  );

  const expectedKHR = Math.round(
    number_(shift.OpeningKHR) +
    cashKHR -
    cashRefundKHR
  );

  const finalUSD = roundMoney_(
    number_(closingUSD)
  );

  const finalKHR = Math.round(
    number_(closingKHR)
  );

  updateRowObject_(
    POS.SHEETS.SHIFTS,
    shift._row,
    {
      CloseAt: new Date(),
      ClosingUSD: finalUSD,
      ClosingKHR: finalKHR,
      ExpectedUSD: expectedUSD,
      ExpectedKHR: expectedKHR,
      DifferenceUSD: roundMoney_(
        finalUSD - expectedUSD
      ),
      DifferenceKHR:
        finalKHR - expectedKHR,
      Status: 'CLOSED'
    }
  );

  audit_(
    user.UserID,
    'CLOSE_SHIFT',
    'CashShift',
    shift.ShiftID,
    {
      expectedUSD: expectedUSD,
      expectedKHR: expectedKHR,
      cashRefundUSD: cashRefundUSD,
      cashRefundKHR: cashRefundKHR
    }
  );

  return {
    success: true,
    expectedUSD: expectedUSD,
    expectedKHR: expectedKHR,
    cashRefundUSD: roundMoney_(
      cashRefundUSD
    ),
    cashRefundKHR: Math.round(
      cashRefundKHR
    ),
    differenceUSD: roundMoney_(
      finalUSD - expectedUSD
    ),
    differenceKHR:
      finalKHR - expectedKHR
  };
}

function recordExpense(
  sessionToken,
  payload
) {
  const user = requireSession_(sessionToken);
  payload = payload || {};

  const amount = roundMoney_(
    number_(payload.amountUSD)
  );

  if (amount <= 0) {
    throw new Error(
      'Expense amount must be greater than zero.'
    );
  }

  const shift = getOpenShiftForUser_(
    user.UserID
  );

  const expenseId = uuid_('EXP');

  appendObject_(POS.SHEETS.EXPENSES, {
    ExpenseID: expenseId,
    DateTime: new Date(),
    BranchID: resolveAccessibleBranchId_(user, payload.branchId, false),
    Category: sanitizeText_(
      payload.category,
      80
    ),
    AmountUSD: amount,
    Remark: sanitizeText_(
      payload.remark,
      250
    ),
    UserID: user.UserID,
    ShiftID: shift ? shift.ShiftID : '',
    CreatedAt: new Date()
  });

  audit_(
    user.UserID,
    'RECORD_EXPENSE',
    'Expense',
    expenseId,
    {
      amountUSD: amount
    }
  );

  return {
    success: true,
    expenseId: expenseId
  };
}

function getOperationsStatus(sessionToken) {
  const user = requireSession_(sessionToken);
  const shift = getOpenShiftForUser_(
    user.UserID
  );

  return {
    openShift: shift
      ? {
          shiftId: String(shift.ShiftID),
          openAt:
            new Date(shift.OpenAt).toISOString(),
          openingUSD:
            number_(shift.OpeningUSD),
          openingKHR:
            number_(shift.OpeningKHR)
        }
      : null
  };
}