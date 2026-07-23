/** FIFO stock-lot helpers. Must be called while the script lock is held. */

function createStockLotLocked_(payload) {
  payload = payload || {};
  const quantity = Math.round(number_(payload.quantity) * 1000) / 1000;
  if (quantity <= 0) throw new Error('FIFO lot quantity must be greater than zero.');

  const unitCost = roundMoney_(number_(payload.unitCostUSD));
  const now = new Date();
  const lotId = uuid_('LOT');

  appendObject_(PURCHASE_FIFO.SHEETS.STOCK_LOTS, {
    LotID: lotId,
    BranchID: sanitizeText_(payload.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
    ProductID: sanitizeText_(payload.productId, 80),
    PurchaseID: sanitizeText_(payload.purchaseId, 80),
    ReceiptID: sanitizeText_(payload.receiptId, 80),
    ReceivedAt: payload.receivedAt ? new Date(payload.receivedAt) : now,
    UnitCostUSD: unitCost,
    QtyReceived: quantity,
    QtyRemaining: quantity,
    Status: 'OPEN',
    ReferenceType: sanitizeText_(payload.referenceType, 40),
    ReferenceID: sanitizeText_(payload.referenceId, 80),
    Note: sanitizeText_(payload.note, 250),
    CreatedAt: now,
    UpdatedAt: now
  });

  return lotId;
}

function createOpeningStockLotLocked_(productId, quantity, unitCostUSD, userId, note, branchId) {
  return createStockLotLocked_({
    productId: productId,
    branchId: branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
    receivedAt: new Date(),
    unitCostUSD: unitCostUSD,
    quantity: quantity,
    referenceType: 'OPENING',
    referenceId: productId,
    note: note || 'Opening stock'
  });
}

/**
 * Builds a FIFO consumption plan without changing any sheets.
 * This allows every product to be validated before a sale/adjustment writes data.
 */
function planFifoAllocationsLocked_(items, branchId) {
  branchId = branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const allLots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS)
    .filter(function(lot) {
      return number_(lot.QtyRemaining) > 0.0000001 &&
        String(lot.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === String(branchId);
    })
    .sort(function(a, b) {
      const dateDiff = new Date(a.ReceivedAt).getTime() - new Date(b.ReceivedAt).getTime();
      return dateDiff || number_(a._row) - number_(b._row);
    });

  const lotsByProduct = {};
  allLots.forEach(function(lot) {
    const productId = String(lot.ProductID);
    if (!lotsByProduct[productId]) lotsByProduct[productId] = [];
    lotsByProduct[productId].push({
      row: lot._row,
      lotId: String(lot.LotID),
      unitCostUSD: number_(lot.UnitCostUSD),
      remaining: number_(lot.QtyRemaining),
      receivedAt: lot.ReceivedAt,
      branchId: String(lot.BranchID || branchId)
    });
  });

  const itemPlans = [];
  const finalLotRemaining = {};

  (items || []).forEach(function(item) {
    const productId = String(item.productId);
    const requestedQty = Math.round(number_(item.qty) * 1000) / 1000;
    let needed = requestedQty;
    let totalCost = 0;
    const allocations = [];
    const lots = lotsByProduct[productId] || [];

    lots.forEach(function(lot) {
      if (needed <= 0.0000001 || lot.remaining <= 0.0000001) return;
      const take = Math.round(Math.min(needed, lot.remaining) * 1000) / 1000;
      const cost = roundMoney_(take * lot.unitCostUSD);

      allocations.push({
        lotId: lot.lotId,
        lotRow: lot.row,
        qty: take,
        unitCostUSD: lot.unitCostUSD,
        costUSD: cost,
        branchId: lot.branchId
      });

      lot.remaining = Math.round((lot.remaining - take) * 1000) / 1000;
      needed = Math.round((needed - take) * 1000) / 1000;
      totalCost = roundMoney_(totalCost + cost);
      finalLotRemaining[lot.row] = lot.remaining;
    });

    if (needed > 0.0005) {
      const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
      const name = product ? (product.NameEN || product.NameKH || productId) : productId;
      throw new Error(
        name + ' does not have enough FIFO stock lots. Missing quantity: ' + needed +
        '. Run installPurchaseFifoFeature() or checkFifoInventory().'
      );
    }

    itemPlans.push({
      productId: productId,
      qty: requestedQty,
      totalCostUSD: totalCost,
      averageUnitCostUSD: requestedQty > 0 ? Math.round((totalCost / requestedQty) * 10000) / 10000 : 0,
      allocations: allocations
    });
  });

  return {
    itemPlans: itemPlans,
    finalLotRemaining: finalLotRemaining
  };
}

function applyFifoPlanLocked_(plan, references) {
  const now = new Date();
  const lotSheetName = PURCHASE_FIFO.SHEETS.STOCK_LOTS;
  const lotUpdates = plan && plan.finalLotRemaining ? plan.finalLotRemaining : {};

  Object.keys(lotUpdates).forEach(function(rowKey) {
    const remaining = Math.round(number_(lotUpdates[rowKey]) * 1000) / 1000;
    updateRowObject_(lotSheetName, Number(rowKey), {
      QtyRemaining: remaining,
      Status: remaining <= 0.0000001 ? 'CLOSED' : 'PARTIAL',
      UpdatedAt: now
    });
  });

  const allocationRows = [];
  (plan.itemPlans || []).forEach(function(itemPlan, index) {
    const reference = references[index] || {};
    itemPlan.allocations.forEach(function(allocation) {
      allocationRows.push({
        AllocationID: uuid_('FIF'),
        DateTime: now,
        BranchID: sanitizeText_(reference.branchId || allocation.branchId, 80) || BRANCH_FEATURE.DEFAULT_BRANCH_ID,
        ProductID: itemPlan.productId,
        LotID: allocation.lotId,
        Qty: allocation.qty,
        UnitCostUSD: allocation.unitCostUSD,
        CostUSD: allocation.costUSD,
        ReferenceType: sanitizeText_(reference.referenceType, 40),
        ReferenceID: sanitizeText_(reference.referenceId, 80),
        UserID: sanitizeText_(reference.userId, 80),
        Note: sanitizeText_(reference.note, 250)
      });
    });
  });

  appendObjects_(PURCHASE_FIFO.SHEETS.FIFO_ALLOCATIONS, allocationRows);
}

function getFifoStockSummary_(productId, branchId) {
  branchId = branchId || BRANCH_FEATURE.DEFAULT_BRANCH_ID;
  const lots = getRows_(PURCHASE_FIFO.SHEETS.STOCK_LOTS)
    .filter(function(lot) {
      return String(lot.ProductID) === String(productId) &&
        String(lot.BranchID || BRANCH_FEATURE.DEFAULT_BRANCH_ID) === String(branchId) &&
        number_(lot.QtyRemaining) > 0.0000001;
    })
    .sort(function(a, b) {
      return new Date(a.ReceivedAt) - new Date(b.ReceivedAt) || a._row - b._row;
    });

  const totalQty = lots.reduce(function(sum, lot) {
    return sum + number_(lot.QtyRemaining);
  }, 0);
  const totalCost = lots.reduce(function(sum, lot) {
    return sum + number_(lot.QtyRemaining) * number_(lot.UnitCostUSD);
  }, 0);

  return {
    totalQty: Math.round(totalQty * 1000) / 1000,
    totalCostUSD: roundMoney_(totalCost),
    averageCostUSD: totalQty > 0 ? Math.round((totalCost / totalQty) * 10000) / 10000 : 0,
    oldestUnitCostUSD: lots.length ? number_(lots[0].UnitCostUSD) : 0,
    newestUnitCostUSD: lots.length ? number_(lots[lots.length - 1].UnitCostUSD) : 0,
    lots: lots
  };
}

function getProductFifoLots(sessionToken, productId) {
  const user = requireSession_(sessionToken);
  requireRole_(user, [POS.ROLES.ADMIN, POS.ROLES.MANAGER, POS.ROLES.STOCK, POS.ROLES.ACCOUNTANT]);
  const product = findRowBy_(POS.SHEETS.PRODUCTS, 'ProductID', productId);
  if (!product) throw new Error('Product not found.');
  const branchId = getUserBranchId_(user);
  const summary = getFifoStockSummary_(productId, branchId);
  return {
    productId: String(product.ProductID),
    productName: String(product.NameEN || product.NameKH || ''),
    branchId: branchId,
    currentStock: getBranchStockQty_(branchId, productId),
    totalQty: summary.totalQty,
    totalCostUSD: summary.totalCostUSD,
    averageCostUSD: summary.averageCostUSD,
    oldestUnitCostUSD: summary.oldestUnitCostUSD,
    newestUnitCostUSD: summary.newestUnitCostUSD,
    lots: summary.lots.map(function(lot) {
      return {
        lotId: String(lot.LotID),
        branchId: String(lot.BranchID || branchId),
        receivedAt: new Date(lot.ReceivedAt).toISOString(),
        unitCostUSD: number_(lot.UnitCostUSD),
        qtyReceived: number_(lot.QtyReceived),
        qtyRemaining: number_(lot.QtyRemaining),
        status: String(lot.Status || ''),
        referenceType: String(lot.ReferenceType || ''),
        referenceId: String(lot.ReferenceID || ''),
        note: String(lot.Note || '')
      };
    })
  };
}
