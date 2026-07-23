/**
 * Supplier + Purchase Receiving + FIFO Inventory installer.
 * Safe upgrade: adds missing sheets/columns and never clears existing rows.
 */
var PURCHASE_FIFO = Object.freeze({
  SHEETS: Object.freeze({
    STOCK_LOTS: 'StockLots',
    FIFO_ALLOCATIONS: 'FifoAllocations',
    PURCHASE_RECEIPTS: 'PurchaseReceipts',
    SUPPLIER_PAYMENTS: 'SupplierPayments'
  }),
  HEADERS: Object.freeze({
    Suppliers: [
      'SupplierID', 'Name', 'ContactPerson', 'Phone', 'Email', 'Address',
      'TaxNumber', 'Notes', 'Active', 'CreatedAt', 'UpdatedAt'
    ],
    Purchases: [
      'PurchaseID', 'PurchaseNo', 'SupplierID', 'SupplierName',
      'SupplierInvoiceNo', 'PurchaseDate', 'ExpectedDate', 'SubtotalUSD',
      'DiscountType', 'DiscountValue', 'DiscountUSD', 'TaxUSD',
      'ShippingUSD', 'OtherCostUSD', 'TotalUSD', 'PaidUSD',
      'PaymentStatus', 'Status', 'Notes', 'UserID', 'CreatedAt', 'UpdatedAt'
    ],
    PurchaseItems: [
      'PurchaseItemID', 'PurchaseID', 'ProductID', 'ProductName',
      'OrderedQty', 'ReceivedQty', 'UnitCostUSD', 'LineDiscountUSD',
      'LineTotalUSD', 'LandedUnitCostUSD', 'CreatedAt', 'UpdatedAt'
    ],
    PurchaseReceipts: [
      'ReceiptID', 'ReceiptNo', 'PurchaseID', 'SupplierID', 'ReceivedAt',
      'TotalQty', 'TotalCostUSD', 'UserID', 'Notes', 'CreatedAt'
    ],
    SupplierPayments: [
      'SupplierPaymentID', 'PurchaseID', 'SupplierID', 'DateTime',
      'Method', 'AmountUSD', 'Reference', 'UserID', 'Notes', 'CreatedAt'
    ],
    StockLots: [
      'LotID', 'ProductID', 'PurchaseID', 'ReceiptID', 'ReceivedAt',
      'UnitCostUSD', 'QtyReceived', 'QtyRemaining', 'Status',
      'ReferenceType', 'ReferenceID', 'Note', 'CreatedAt', 'UpdatedAt'
    ],
    FifoAllocations: [
      'AllocationID', 'DateTime', 'ProductID', 'LotID', 'Qty',
      'UnitCostUSD', 'CostUSD', 'ReferenceType', 'ReferenceID',
      'UserID', 'Note'
    ],
    StockMovements: [
      'UnitCostUSD', 'CostInUSD', 'CostOutUSD'
    ],
    SaleItems: [
      'AllocatedSaleDiscountUSD', 'NetRevenueUSD', 'CostTotalUSD',
      'GrossProfitUSD'
    ]
  })
});

function installPurchaseFifoFeature() {
  const ss = getSpreadsheet_();
  const report = [];

  withScriptLock_(function() {
    ensurePurchaseFeatureColumns_(ss, 'Suppliers', PURCHASE_FIFO.HEADERS.Suppliers, true, report);
    ensurePurchaseFeatureColumns_(ss, 'Purchases', PURCHASE_FIFO.HEADERS.Purchases, true, report);
    ensurePurchaseFeatureColumns_(ss, 'PurchaseItems', PURCHASE_FIFO.HEADERS.PurchaseItems, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.PURCHASE_RECEIPTS, PURCHASE_FIFO.HEADERS.PurchaseReceipts, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.SUPPLIER_PAYMENTS, PURCHASE_FIFO.HEADERS.SupplierPayments, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.STOCK_LOTS, PURCHASE_FIFO.HEADERS.StockLots, true, report);
    ensurePurchaseFeatureColumns_(ss, PURCHASE_FIFO.SHEETS.FIFO_ALLOCATIONS, PURCHASE_FIFO.HEADERS.FifoAllocations, true, report);
    ensurePurchaseFeatureColumns_(ss, POS.SHEETS.STOCK, PURCHASE_FIFO.HEADERS.StockMovements, false, report);
    ensurePurchaseFeatureColumns_(ss, POS.SHEETS.SALE_ITEMS, PURCHASE_FIFO.HEADERS.SaleItems, false, report);

    const migration = migrateExistingStockToFifoLotsLocked_();
    report.push('FIFO opening lots created: ' + migration.created);
    if (migration.warnings.length) {
      report.push('Warnings: ' + migration.warnings.join(' | '));
    }
  });

  const message = 'Supplier, purchasing and FIFO feature installed.\n\n' + report.join('\n');
  console.log(message);
  try {
    ss.toast('Supplier + Purchase + FIFO installed.', 'POS Upgrade', 8);
  } catch (error) {
    console.log(error.message);
  }
  return message;
}

function ensurePurchaseFeatureColumns_(ss, sheetName, requiredHeaders, createIfMissing, report) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    if (!createIfMissing) throw new Error('Missing required sheet: ' + sheetName);
    sheet = ss.insertSheet(sheetName);
    report.push('Created sheet: ' + sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function(value) {
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
      sheet.insertColumnsAfter(sheet.getMaxColumns(), finalColumn - sheet.getMaxColumns());
    }
    sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
    report.push(sheetName + ': added ' + missing.join(', '));
  } else {
    report.push(sheetName + ': already up to date');
  }

  const currentLastColumn = sheet.getLastColumn();
  if (currentLastColumn > 0) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, currentLastColumn)
      .setFontWeight('bold')
      .setBackground('#1d4ed8')
      .setFontColor('#ffffff');
  }
}

/**
 * Creates opening FIFO lots for existing stock. It only fills positive gaps.
 * Existing lots are never deleted or overwritten.
 */
function migrateExistingStockToFifoLotsLocked_() {
  const products = getRows_(POS.SHEETS.PRODUCTS);
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS);
  const remainingByProduct = {};

  lots.forEach(function(lot) {
    const productId = String(lot.ProductID || '');
    remainingByProduct[productId] = number_(remainingByProduct[productId]) + number_(lot.QtyRemaining);
  });

  let created = 0;
  const warnings = [];
  const now = new Date();

  products.forEach(function(product) {
    const productId = String(product.ProductID);
    const currentStock = number_(product.CurrentStock);
    const lotStock = number_(remainingByProduct[productId]);
    const difference = Math.round((currentStock - lotStock) * 1000) / 1000;

    if (difference > 0.0005) {
      createStockLotLocked_({
        productId: productId,
        purchaseId: '',
        receiptId: '',
        receivedAt: product.CreatedAt || now,
        unitCostUSD: number_(product.CostUSD),
        quantity: difference,
        referenceType: 'FIFO_MIGRATION',
        referenceId: productId,
        note: 'Opening FIFO lot created from existing CurrentStock'
      });
      created++;
    } else if (difference < -0.0005) {
      warnings.push(productId + ' lots exceed CurrentStock by ' + Math.abs(difference));
    }
  });

  return {created: created, warnings: warnings};
}

function checkFifoInventory() {
  const products = getRows_(POS.SHEETS.PRODUCTS);
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS);
  const remainingByProduct = {};
  const issues = [];

  lots.forEach(function(lot) {
    const productId = String(lot.ProductID || '');
    remainingByProduct[productId] = number_(remainingByProduct[productId]) + number_(lot.QtyRemaining);
  });

  products.forEach(function(product) {
    const current = Math.round(number_(product.CurrentStock) * 1000) / 1000;
    const fifo = Math.round(number_(remainingByProduct[String(product.ProductID)]) * 1000) / 1000;
    if (Math.abs(current - fifo) > 0.0005) {
      issues.push((product.NameEN || product.NameKH || product.ProductID) + ': CurrentStock ' + current + ', FIFO ' + fifo);
    }
  });

  const message = issues.length
    ? 'FIFO mismatches:\n' + issues.slice(0, 30).join('\n')
    : 'FIFO inventory is balanced with Products.CurrentStock.';
  console.log(message);
  try {
    getSpreadsheet_().toast(message, 'FIFO Check', 10);
  } catch (error) {
    console.log(error.message);
  }
  return message;
}
