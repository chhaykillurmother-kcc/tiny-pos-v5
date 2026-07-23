/**
 * Tiny POS Product Packaging v4.1 installer.
 *
 * This installer is additive. It creates one new sheet and adds only missing
 * columns. Existing product, purchase, sale, stock, FIFO, return, branch and
 * permission data are not cleared or rewritten.
 */
const PRODUCT_PACKAGING_SCHEMA_V41 = Object.freeze({
  ProductPackages: [
    'PackageID','ProductID','PackageUnitID','PackageNameEN','PackageNameKH',
    'UnitsPerPackage','PackageBarcode','PriceUSD','PriceKHR',
    'AllowPurchase','AllowSale','Active','CreatedAt','UpdatedAt'
  ],
  Products: ['ProductCode'],
  SaleItems: [
    'SellPackageID','SellUnitName','SellQty','UnitsPerSellUnit',
    'SellBarcode','SellUnitPriceUSD'
  ],
  PurchaseItems: [
    'PurchasePackageID','PurchaseUnitName','PurchaseQty',
    'UnitsPerPurchaseUnit','PurchaseBarcode','PurchaseUnitCostUSD'
  ],
  ReturnItems: [
    'ReturnPackageID','ReturnUnitName','ReturnSellQty','UnitsPerReturnUnit'
  ],
  SupplierReturnItems: [
    'ReturnPackageID','ReturnUnitName','ReturnPurchaseQty','UnitsPerReturnUnit'
  ]
});

function installProductPackagingV41() {
  const ss = getSpreadsheet_();
  const report = [];

  Object.keys(PRODUCT_PACKAGING_SCHEMA_V41).forEach(function(sheetName) {
    ensureProductPackagingSheetV41_(
      ss,
      sheetName,
      PRODUCT_PACKAGING_SCHEMA_V41[sheetName],
      report
    );
  });

  ensurePackagingUnitsV41_();

  const codeResult = assignMissingProductCodesV41_();
  report.push('Product codes assigned: ' + codeResult.assigned);
  report.push('Next product code: ' + codeResult.nextCode);

  SpreadsheetApp.flush();

  const message = [
    'Tiny POS Product Packaging v4.1 installed.',
    '',
    report.join('\n'),
    '',
    'Existing rows were not cleared.'
  ].join('\n');

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return {
    success: true,
    report: report,
    nextProductCode: codeResult.nextCode
  };
}

function ensureProductPackagingSheetV41_(ss, sheetName, requiredHeaders, report) {
  let sheet = ss.getSheetByName(sheetName);
  const wasCreated = !sheet;

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn)
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
    const requiredFinalColumn = startColumn + missing.length - 1;

    if (requiredFinalColumn > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        requiredFinalColumn - sheet.getMaxColumns()
      );
    }

    sheet.getRange(1, startColumn, 1, missing.length)
      .setValues([missing]);

    report.push(
      sheetName + ': added ' + missing.length + ' column(s)'
    );
  }

  /*
   * Preserve the formatting of every existing sheet. Only the newly created
   * ProductPackages sheet receives a basic header style.
   */
  if (wasCreated && sheet.getLastColumn() > 0) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

function ensurePackagingUnitsV41_() {
  const existing = getRows_(POS.SHEETS.UNITS);
  const byId = {};

  existing.forEach(function(row) {
    byId[String(row.UnitID)] = row;
  });

  const now = new Date();
  const defaults = [
    {
      UnitID: 'UNT-BOX',
      NameEN: 'Box',
      NameKH: 'ប្រអប់',
      Abbreviation: 'box',
      AllowDecimal: false,
      SortOrder: 3,
      Active: true
    },
    {
      UnitID: 'UNT-BAG',
      NameEN: 'Bag',
      NameKH: 'ថង់',
      Abbreviation: 'bag',
      AllowDecimal: false,
      SortOrder: 4,
      Active: true
    },
    {
      UnitID: 'UNT-PACK',
      NameEN: 'Pack',
      NameKH: 'កញ្ចប់',
      Abbreviation: 'pack',
      AllowDecimal: false,
      SortOrder: 5,
      Active: true
    },
    {
      UnitID: 'UNT-CARTON',
      NameEN: 'Carton',
      NameKH: 'កេស',
      Abbreviation: 'ctn',
      AllowDecimal: false,
      SortOrder: 6,
      Active: true
    },
    {
      UnitID: 'UNT-TRAY',
      NameEN: 'Tray',
      NameKH: 'ថាស',
      Abbreviation: 'tray',
      AllowDecimal: false,
      SortOrder: 7,
      Active: true
    }
  ];

  defaults.forEach(function(unit) {
    if (byId[unit.UnitID]) return;

    appendObject_(POS.SHEETS.UNITS, Object.assign({}, unit, {
      CreatedAt: now,
      UpdatedAt: now
    }));
  });
}

function assignMissingProductCodesV41_() {
  return withScriptLock_(function() {
    const products = getRows_(POS.SHEETS.PRODUCTS)
      .sort(function(a, b) {
        return number_(a._row) - number_(b._row);
      });

    let maximum = getMaximumProductCodeNumberV41_(products);
    let assigned = 0;

    products.forEach(function(product) {
      if (String(product.ProductCode || '').trim()) return;

      maximum += 1;
      updateRowObject_(POS.SHEETS.PRODUCTS, product._row, {
        ProductCode: formatProductCodeV41_(maximum),
        UpdatedAt: new Date()
      });
      assigned += 1;
    });

    PropertiesService.getScriptProperties().setProperty(
      'PRODUCT_CODE_COUNTER_V41',
      String(maximum)
    );

    return {
      assigned: assigned,
      nextCode: formatProductCodeV41_(maximum + 1)
    };
  });
}

function verifyProductPackagingV41() {
  const ss = getSpreadsheet_();
  const issues = [];

  Object.keys(PRODUCT_PACKAGING_SCHEMA_V41).forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      issues.push(sheetName + ': MISSING SHEET');
      return;
    }

    const headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn())
        .getDisplayValues()[0]
        .map(function(value) {
          return String(value || '').trim();
        })
      : [];

    const missing = PRODUCT_PACKAGING_SCHEMA_V41[sheetName]
      .filter(function(header) {
        return headers.indexOf(header) === -1;
      });

    if (missing.length) {
      issues.push(sheetName + ': missing ' + missing.join(', '));
    }
  });

  const duplicateCodes = {};
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    const code = String(product.ProductCode || '').trim().toUpperCase();
    if (!code) return;
    duplicateCodes[code] = number_(duplicateCodes[code]) + 1;
  });

  Object.keys(duplicateCodes).forEach(function(code) {
    if (duplicateCodes[code] > 1) {
      issues.push('Duplicate product code: ' + code);
    }
  });

  const barcodeOwners = {};
  getRows_(POS.SHEETS.PRODUCTS).forEach(function(product) {
    const barcode = String(product.Barcode || '').trim();
    if (!barcode) return;
    barcodeOwners[barcode] = 'Product ' + String(product.ProductCode || product.ProductID);
  });

  getRows_('ProductPackages').forEach(function(pkg) {
    const barcode = String(pkg.PackageBarcode || '').trim();
    if (!barcode) return;

    if (barcodeOwners[barcode]) {
      issues.push(
        'Duplicate barcode ' + barcode + ': ' +
        barcodeOwners[barcode] + ' and package ' + String(pkg.PackageID)
      );
    } else {
      barcodeOwners[barcode] = 'Package ' + String(pkg.PackageID);
    }
  });

  const message = issues.length
    ? issues.join('\n')
    : 'Tiny POS Product Packaging v4.1: OK';

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    console.log(message);
  }

  return message;
}
