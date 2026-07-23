/**
 * One-time installer for:
 * - Pending/held invoices
 * - Percentage discounts
 * - Coupon codes
 *
 * Run installCheckoutPendingFeature() once from the Apps Script editor.
 * This installer only adds missing sheets/columns. It does not clear data.
 */

const CHECKOUT_FEATURE = Object.freeze({
  PENDING_SHEET: 'PendingInvoices',
  COUPON_SHEET: 'Coupons',
  PENDING_HEADERS: [
    'PendingID', 'InvoiceNo', 'DateTime', 'CustomerID', 'CartJSON',
    'SubtotalUSD', 'ManualDiscountType', 'ManualDiscountValue',
    'ManualDiscountPercent', 'ManualDiscountUSD', 'CouponCode', 'CouponDiscountUSD', 'DiscountUSD', 'TaxUSD',
    'TotalUSD', 'TotalKHR', 'ExchangeRate', 'PreferredPayment',
    'Notes', 'Status', 'CashierID', 'CashierName', 'SaleID', 'UpdatedAt'
  ],
  COUPON_HEADERS: [
    'CouponID', 'Code', 'DescriptionEN', 'DescriptionKH',
    'DiscountType', 'DiscountValue', 'MinSpendUSD', 'MaxDiscountUSD',
    'StartDate', 'EndDate', 'UsageLimit', 'UsedCount', 'Active',
    'CreatedAt', 'UpdatedAt'
  ],
  SALES_EXTRA_HEADERS: [
    'ManualDiscountType', 'ManualDiscountValue',
    'ManualDiscountPercent', 'ManualDiscountUSD',
    'CouponCode', 'CouponDiscountUSD'
  ]
});

function installCheckoutPendingFeature() {
  const ss = getSpreadsheet_();

  ensureFeatureSheet_(
    CHECKOUT_FEATURE.PENDING_SHEET,
    CHECKOUT_FEATURE.PENDING_HEADERS
  );

  ensureFeatureSheet_(
    CHECKOUT_FEATURE.COUPON_SHEET,
    CHECKOUT_FEATURE.COUPON_HEADERS
  );

  addMissingColumnsSafe_(
    getSheet_(POS.SHEETS.SALES),
    CHECKOUT_FEATURE.SALES_EXTRA_HEADERS
  );

  SpreadsheetApp.getUi().alert(
    'Checkout feature installed',
    'Created/updated:\n' +
      '• PendingInvoices\n' +
      '• Coupons\n' +
      '• Percent/fixed discount and coupon columns in Sales\n\n' +
      'No existing sales or products were deleted.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function ensureFeatureSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  addMissingColumnsSafe_(sheet, headers);

  sheet.setFrozenRows(1);
  const lastCol = sheet.getLastColumn();

  if (lastCol > 0) {
    sheet.getRange(1, 1, 1, lastCol)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, lastCol);
  }

  return sheet;
}

function addMissingColumnsSafe_(sheet, requiredHeaders) {
  const lastCol = sheet.getLastColumn();

  let existing = [];

  if (lastCol > 0) {
    existing = sheet
      .getRange(1, 1, 1, lastCol)
      .getDisplayValues()[0]
      .map(function(value) {
        return String(value || '').trim();
      });
  }

  const missing = requiredHeaders.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (!missing.length) {
    return;
  }

  const startColumn = Math.max(1, lastCol + 1);

  sheet
    .getRange(1, startColumn, 1, missing.length)
    .setValues([missing]);
}

function checkCheckoutPendingFeature() {
  const ss = getSpreadsheet_();

  const pending = ss.getSheetByName(CHECKOUT_FEATURE.PENDING_SHEET);
  const coupons = ss.getSheetByName(CHECKOUT_FEATURE.COUPON_SHEET);
  const sales = getSheet_(POS.SHEETS.SALES);

  const salesHeaders = sales
    .getRange(1, 1, 1, sales.getLastColumn())
    .getDisplayValues()[0];

  const missingSales = CHECKOUT_FEATURE.SALES_EXTRA_HEADERS.filter(
    function(header) {
      return salesHeaders.indexOf(header) === -1;
    }
  );

  SpreadsheetApp.getUi().alert(
    'Checkout feature status',
    'PendingInvoices sheet: ' + (pending ? 'OK' : 'MISSING') + '\n' +
      'Coupons sheet: ' + (coupons ? 'OK' : 'MISSING') + '\n' +
      'Sales extra columns: ' +
      (missingSales.length ? 'Missing ' + missingSales.join(', ') : 'OK'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Optional helper for creating a coupon without manually editing the sheet.
 * Run createCouponPrompt() from the Apps Script function selector.
 */
function createCouponPrompt() {
  const ui = SpreadsheetApp.getUi();

  const codeResponse = ui.prompt(
    'Coupon code',
    'Enter a coupon code, for example WELCOME10:',
    ui.ButtonSet.OK_CANCEL
  );
  if (codeResponse.getSelectedButton() !== ui.Button.OK) return;

  const code = normalizeCouponCode_(codeResponse.getResponseText());
  if (!code) throw new Error('Coupon code is required.');

  const typeResponse = ui.prompt(
    'Discount type',
    'Enter PERCENT or FIXED:',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeResponse.getSelectedButton() !== ui.Button.OK) return;

  const type = String(typeResponse.getResponseText() || '')
    .trim()
    .toUpperCase();

  if (['PERCENT', 'FIXED'].indexOf(type) === -1) {
    throw new Error('Discount type must be PERCENT or FIXED.');
  }

  const valueResponse = ui.prompt(
    'Discount value',
    type === 'PERCENT'
      ? 'Enter the percentage, for example 10:'
      : 'Enter the fixed USD discount, for example 1.50:',
    ui.ButtonSet.OK_CANCEL
  );
  if (valueResponse.getSelectedButton() !== ui.Button.OK) return;

  const value = number_(valueResponse.getResponseText());
  if (value <= 0) throw new Error('Discount value must be greater than zero.');

  const minResponse = ui.prompt(
    'Minimum spend',
    'Enter the minimum subtotal in USD, or 0:',
    ui.ButtonSet.OK_CANCEL
  );
  if (minResponse.getSelectedButton() !== ui.Button.OK) return;

  const now = new Date();
  const existing = findCouponByCode_(code);

  const row = {
    Code: code,
    DescriptionEN: code,
    DescriptionKH: code,
    DiscountType: type,
    DiscountValue: value,
    MinSpendUSD: Math.max(0, number_(minResponse.getResponseText())),
    MaxDiscountUSD: 0,
    StartDate: '',
    EndDate: '',
    UsageLimit: 0,
    UsedCount: existing ? number_(existing.UsedCount) : 0,
    Active: true,
    UpdatedAt: now
  };

  if (existing) {
    updateRowObject_(CHECKOUT_FEATURE.COUPON_SHEET, existing._row, row);
  } else {
    row.CouponID = uuid_('CPN');
    row.CreatedAt = now;
    appendObject_(CHECKOUT_FEATURE.COUPON_SHEET, row);
  }

  ui.alert('Coupon saved: ' + code);
}
