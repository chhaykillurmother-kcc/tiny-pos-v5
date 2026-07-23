/**
 * Returns + Refunds + FIFO restoration installer.
 * Safe upgrade: adds only missing sheets/columns and never clears existing rows.
 */
var RETURNS_REFUNDS = Object.freeze({
  SHEETS: Object.freeze({
    RETURN_ITEMS: 'ReturnItems',
    REFUND_PAYMENTS: 'RefundPayments',
    RETURN_LOT_RESTORATIONS: 'ReturnLotRestorations'
  }),
  HEADERS: Object.freeze({
    Returns: [
      'ReturnID', 'ReturnNo', 'SaleID', 'InvoiceNo', 'DateTime',
      'RefundMethod', 'RefundCurrency', 'RefundAmount', 'AmountUSD',
      'AmountKHR', 'Reason', 'Notes', 'UserID', 'UserName', 'ShiftID',
      'Status', 'CreatedAt'
    ],
    ReturnItems: [
      'ReturnItemID', 'ReturnID', 'SaleItemID', 'SaleID', 'ProductID',
      'ProductName', 'QtyReturned', 'UnitPriceUSD', 'GrossLineRefundUSD',
      'DiscountRefundUSD', 'TaxRefundUSD', 'RefundUSD', 'Restock',
      'Condition', 'CostRestoredUSD', 'CreatedAt'
    ],
    RefundPayments: [
      'RefundPaymentID', 'ReturnID', 'SaleID', 'Method', 'Currency',
      'Amount', 'AmountUSD', 'Reference', 'ShiftID', 'UserID',
      'Status', 'CreatedAt'
    ],
    ReturnLotRestorations: [
      'RestorationID', 'ReturnID', 'ReturnItemID', 'SaleItemID',
      'OriginalAllocationID', 'OriginalLotID', 'ProductID', 'Qty',
      'UnitCostUSD', 'CostUSD', 'NewLotID', 'CreatedAt'
    ],
    Sales: [
      'ReturnedQty', 'RefundedUSD', 'ReturnStatus', 'LastReturnAt'
    ],
    SaleItems: [
      'ReturnedQty', 'RefundedUSD', 'RestockedQty',
      'CostRestoredUSD'
    ]
  })
});

function installReturnsRefundsFeature() {
  const ss = getSpreadsheet_();
  const report = [];

  withScriptLock_(function() {
    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.RETURNS,
      RETURNS_REFUNDS.HEADERS.Returns,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.RETURN_ITEMS,
      RETURNS_REFUNDS.HEADERS.ReturnItems,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS,
      RETURNS_REFUNDS.HEADERS.RefundPayments,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      RETURNS_REFUNDS.SHEETS.RETURN_LOT_RESTORATIONS,
      RETURNS_REFUNDS.HEADERS.ReturnLotRestorations,
      true,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.SALES,
      RETURNS_REFUNDS.HEADERS.Sales,
      false,
      report
    );

    ensureReturnsRefundColumns_(
      ss,
      POS.SHEETS.SALE_ITEMS,
      RETURNS_REFUNDS.HEADERS.SaleItems,
      false,
      report
    );
  });

  const message =
    'Returns and refunds feature installed.\n\n' +
    report.join('\n');

  console.log(message);

  try {
    ss.toast(
      'Returns + Refunds installed.',
      'POS Upgrade',
      8
    );
  } catch (error) {
    console.log(error.message);
  }

  return message;
}

function ensureReturnsRefundColumns_(
  ss,
  sheetName,
  requiredHeaders,
  createIfMissing,
  report
) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    if (!createIfMissing) {
      throw new Error('Missing required sheet: ' + sheetName);
    }

    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();

  const existing = lastColumn > 0
    ? sheet
        .getRange(1, 1, 1, lastColumn)
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
    : [];

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    const startColumn = lastColumn + 1;
    const finalColumn = startColumn + missing.length - 1;

    if (finalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        finalColumn - sheet.getMaxColumns()
      );
    }

    sheet
      .getRange(1, startColumn, 1, missing.length)
      .setValues([missing]);

    report.push(
      sheetName + ': added ' + missing.join(', ')
    );
  } else {
    report.push(sheetName + ': already up to date');
  }

  const currentLastColumn = sheet.getLastColumn();

  if (currentLastColumn > 0) {
    sheet.setFrozenRows(1);

    sheet
      .getRange(1, 1, 1, currentLastColumn)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

function checkReturnsRefundsFeature() {
  const ss = getSpreadsheet_();

  const requirements = {};
  requirements[POS.SHEETS.RETURNS] =
    RETURNS_REFUNDS.HEADERS.Returns;
  requirements[RETURNS_REFUNDS.SHEETS.RETURN_ITEMS] =
    RETURNS_REFUNDS.HEADERS.ReturnItems;
  requirements[RETURNS_REFUNDS.SHEETS.REFUND_PAYMENTS] =
    RETURNS_REFUNDS.HEADERS.RefundPayments;
  requirements[
    RETURNS_REFUNDS.SHEETS.RETURN_LOT_RESTORATIONS
  ] = RETURNS_REFUNDS.HEADERS.ReturnLotRestorations;
  requirements[POS.SHEETS.SALES] =
    RETURNS_REFUNDS.HEADERS.Sales;
  requirements[POS.SHEETS.SALE_ITEMS] =
    RETURNS_REFUNDS.HEADERS.SaleItems;

  const results = [];

  Object.keys(requirements).forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      results.push(sheetName + ': MISSING SHEET');
      return;
    }

    const lastColumn = sheet.getLastColumn();

    const headers = lastColumn > 0
      ? sheet
          .getRange(1, 1, 1, lastColumn)
          .getDisplayValues()[0]
          .map(function(value) {
            return String(value || '').trim();
          })
      : [];

    const missing = requirements[sheetName]
      .filter(function(header) {
        return headers.indexOf(header) === -1;
      });

    results.push(
      sheetName +
      ': ' +
      (missing.length
        ? 'Missing ' + missing.join(', ')
        : 'OK')
    );
  });

  const message = results.join('\n');
  console.log(message);

  try {
    ss.toast(message, 'Returns Feature Check', 10);
  } catch (error) {
    console.log(error.message);
  }

  return message;
}