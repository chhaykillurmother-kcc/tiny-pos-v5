/**
 * Tiny POS Product Packaging v4.1 — product/package master data.
 *
 * Inventory and FIFO always remain in the product base unit.
 * Example: Coca-Cola base unit Can; one Box package = 24 Cans.
 */
const PRODUCT_PACKAGING_V41 = Object.freeze({
  VERSION: '4.1.0',
  SHEET: 'ProductPackages',
  BASE_PACKAGE_ID: '',
  CODE_PREFIX: 'P',
  CODE_DIGITS: 6,
  MAX_PACKAGES_PER_PRODUCT: 12
});

function formatProductCodeV41_(number) {
  return PRODUCT_PACKAGING_V41.CODE_PREFIX +
    String(Math.max(0, Math.floor(number_(number)))).padStart(
      PRODUCT_PACKAGING_V41.CODE_DIGITS,
      '0'
    );
}

function getMaximumProductCodeNumberV41_(products) {
  let maximum = 0;

  (products || getRows_(POS.SHEETS.PRODUCTS)).forEach(function(product) {
    const match = String(product.ProductCode || '')
      .trim()
      .toUpperCase()
      .match(/^P(\d{1,12})$/);

    if (match) {
      maximum = Math.max(maximum, number_(match[1]));
    }
  });

  return maximum;
}

function nextProductCodeLockedV41_() {
  const props = PropertiesService.getScriptProperties();
  const rows = getRows_(POS.SHEETS.PRODUCTS);
  const maximumInSheet = getMaximumProductCodeNumberV41_(rows);
  const stored = number_(props.getProperty('PRODUCT_CODE_COUNTER_V41'));
  const next = Math.max(maximumInSheet, stored) + 1;

  props.setProperty('PRODUCT_CODE_COUNTER_V41', String(next));
  return formatProductCodeV41_(next);
}

function previewNextProductCodeV41(sessionToken) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');

  const maximum = Math.max(
    getMaximumProductCodeNumberV41_(),
    number_(
      PropertiesService.getScriptProperties()
        .getProperty('PRODUCT_CODE_COUNTER_V41')
    )
  );

  return formatProductCodeV41_(maximum + 1);
}

function packageRowsV41_(productId, includeInactive) {
  return getRows_(PRODUCT_PACKAGING_V41.SHEET)
    .filter(function(row) {
      return (!productId || String(row.ProductID) === String(productId)) &&
        (includeInactive || bool_(row.Active));
    });
}

function packageUnitNameV41_(row, unitMap, language) {
  unitMap = unitMap || getUnitMap_();
  const unit = unitMap[String(row.PackageUnitID || '')] || {};
  const km = language === 'km';

  return String(
    km
      ? row.PackageNameKH || unit.nameKH || row.PackageNameEN || unit.nameEN
      : row.PackageNameEN || unit.nameEN || row.PackageNameKH || unit.nameKH
  ) || String(unit.abbreviation || 'Package');
}

function packageToPublicV41_(row, unitMap) {
  unitMap = unitMap || getUnitMap_();
  const unit = unitMap[String(row.PackageUnitID || '')] || {};

  return {
    packageId: String(row.PackageID || ''),
    productId: String(row.ProductID || ''),
    packageUnitId: String(row.PackageUnitID || ''),
    packageNameEN: String(row.PackageNameEN || unit.nameEN || ''),
    packageNameKH: String(row.PackageNameKH || unit.nameKH || ''),
    abbreviation: String(unit.abbreviation || ''),
    allowDecimal: unit.allowDecimal === true,
    unitsPerPackage: Math.round(number_(row.UnitsPerPackage) * 1000) / 1000,
    barcode: String(row.PackageBarcode || ''),
    priceUSD: roundMoney_(number_(row.PriceUSD)),
    priceKHR: Math.round(number_(row.PriceKHR)),
    allowPurchase: bool_(row.AllowPurchase),
    allowSale: bool_(row.AllowSale),
    active: bool_(row.Active)
  };
}

function packageMapV41_(includeInactive) {
  const map = {};
  const units = getUnitMap_();

  packageRowsV41_('', includeInactive).forEach(function(row) {
    map[String(row.PackageID)] = Object.assign(
      {row: row},
      packageToPublicV41_(row, units)
    );
  });

  return map;
}

function packagesByProductV41_(includeInactive) {
  const map = {};
  const units = getUnitMap_();

  packageRowsV41_('', includeInactive).forEach(function(row) {
    const productId = String(row.ProductID || '');
    if (!map[productId]) map[productId] = [];
    map[productId].push(packageToPublicV41_(row, units));
  });

  Object.keys(map).forEach(function(productId) {
    map[productId].sort(function(a, b) {
      return number_(a.unitsPerPackage) - number_(b.unitsPerPackage) ||
        String(a.packageNameEN).localeCompare(String(b.packageNameEN));
    });
  });

  return map;
}

function enrichProductsWithPackagesV41_(products) {
  const grouped = packagesByProductV41_(true);
  const productRows = {};

  getRows_(POS.SHEETS.PRODUCTS).forEach(function(row) {
    productRows[String(row.ProductID)] = row;
  });

  return (products || []).map(function(product) {
    const row = productRows[String(product.productId)] || {};
    return Object.assign({}, product, {
      productCode: String(row.ProductCode || ''),
      packages: (grouped[String(product.productId)] || []).map(function(pkg) {
        return Object.assign({}, pkg);
      })
    });
  });
}

function bootstrapV41(initData, sessionToken) {
  const result = bootstrap(initData, sessionToken);
  if (result && result.authenticated) {
    result.products = enrichProductsWithPackagesV41_(result.products || []);
    result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  }
  return result;
}

function refreshAppDataV41(sessionToken) {
  const result = refreshAppData(sessionToken);
  result.products = enrichProductsWithPackagesV41_(result.products || []);
  result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return result;
}

function getBranchWorkspaceV41(sessionToken, branchId) {
  const result = getBranchWorkspaceV38(sessionToken, branchId);
  result.products = enrichProductsWithPackagesV41_(result.products || []);
  result.productPackagingVersion = PRODUCT_PACKAGING_V41.VERSION;
  return result;
}

function listProductPackagesV41(sessionToken, productId, includeInactive) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');

  return packageRowsV41_(productId, includeInactive === true)
    .map(function(row) {
      return packageToPublicV41_(row, getUnitMap_());
    });
}

function validateProductCodeV41_(productCode, productId) {
  const code = sanitizeText_(productCode, 30).toUpperCase();

  if (!/^P\d{6,}$/.test(code)) {
    throw new Error('Product code must use the format P000001.');
  }

  const duplicate = getRows_(POS.SHEETS.PRODUCTS).find(function(row) {
    return String(row.ProductCode || '').trim().toUpperCase() === code &&
      String(row.ProductID || '') !== String(productId || '');
  });

  if (duplicate) {
    throw new Error('This product code is already used by another product.');
  }

  return code;
}

function validatePackageBarcodeV41_(barcode, productId, packageId) {
  barcode = sanitizeText_(barcode, 80);
  if (!barcode) return '';

  const productDuplicate = getRows_(POS.SHEETS.PRODUCTS).find(function(row) {
    /*
     * A package barcode must be different from every base-unit barcode,
     * including the base barcode of this same product.
     */
    return String(row.Barcode || '') === barcode;
  });

  if (productDuplicate) {
    throw new Error('Package barcode ' + barcode + ' is already a product barcode.');
  }

  const packageDuplicate = packageRowsV41_('', true).find(function(row) {
    return String(row.PackageBarcode || '') === barcode &&
      String(row.PackageID || '') !== String(packageId || '');
  });

  if (packageDuplicate) {
    throw new Error('Package barcode ' + barcode + ' is already in use.');
  }

  return barcode;
}

function saveProductPackagesLockedV41_(productId, baseProduct, packages, user) {
  const incoming = Array.isArray(packages) ? packages : [];

  if (incoming.length > PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT) {
    throw new Error(
      'A product can have at most ' +
      PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT +
      ' package units.'
    );
  }

  const unitMap = getUnitMap_();
  const existing = packageRowsV41_(productId, true);
  const existingMap = {};
  const retained = {};
  const now = new Date();

  existing.forEach(function(row) {
    existingMap[String(row.PackageID)] = row;
  });

  const seenBarcodes = {};
  const seenDefinitions = {};

  incoming.forEach(function(raw) {
    raw = raw || {};
    const packageId = sanitizeText_(raw.packageId, 80);
    const old = packageId ? existingMap[packageId] : null;
    const packageUnitId = sanitizeText_(raw.packageUnitId, 80);
    const unit = unitMap[packageUnitId];

    if (!unit) {
      throw new Error('Select a valid package unit such as Box, Bag or Pack.');
    }

    const factor = Math.round(number_(raw.unitsPerPackage) * 1000) / 1000;
    if (factor <= 1) {
      throw new Error('Units per package must be greater than 1.');
    }

    const definitionKey = packageUnitId + '|' + factor;
    if (seenDefinitions[definitionKey]) {
      throw new Error('The same package unit and conversion was entered twice.');
    }
    seenDefinitions[definitionKey] = true;

    const barcode = validatePackageBarcodeV41_(
      raw.barcode,
      productId,
      packageId
    );

    if (barcode && seenBarcodes[barcode]) {
      throw new Error('The same package barcode was entered twice.');
    }
    if (barcode) seenBarcodes[barcode] = true;

    const priceUSD = roundMoney_(number_(raw.priceUSD));
    const priceKHR = Math.round(number_(raw.priceKHR));

    if (priceUSD < 0 || priceKHR < 0) {
      throw new Error('Package selling prices cannot be negative.');
    }

    const changes = {
      ProductID: productId,
      PackageUnitID: packageUnitId,
      PackageNameEN: sanitizeText_(raw.packageNameEN, 80) || String(unit.nameEN || ''),
      PackageNameKH: sanitizeText_(raw.packageNameKH, 80) || String(unit.nameKH || ''),
      UnitsPerPackage: factor,
      PackageBarcode: barcode,
      PriceUSD: priceUSD,
      PriceKHR: priceKHR,
      AllowPurchase: raw.allowPurchase !== false,
      AllowSale: raw.allowSale !== false,
      Active: raw.active !== false,
      UpdatedAt: now
    };

    let savedId;
    if (old) {
      savedId = String(old.PackageID);
      updateRowObject_(PRODUCT_PACKAGING_V41.SHEET, old._row, changes);
    } else {
      savedId = uuid_('PKG');
      changes.PackageID = savedId;
      changes.CreatedAt = now;
      appendObject_(PRODUCT_PACKAGING_V41.SHEET, changes);
    }

    retained[savedId] = true;
  });

  existing.forEach(function(row) {
    if (retained[String(row.PackageID)]) return;
    if (!bool_(row.Active)) return;

    updateRowObject_(PRODUCT_PACKAGING_V41.SHEET, row._row, {
      Active: false,
      UpdatedAt: now
    });
  });

  audit_(user.UserID, 'SAVE_PRODUCT_PACKAGES', 'Product', productId, {
    packageCount: incoming.length,
    baseUnitId: String(baseProduct.UnitID || '')
  });
}


function validateProductPackagePayloadV41_(payload, existingProduct) {
  payload = payload || {};
  const incoming = Array.isArray(payload.packages)
    ? payload.packages
    : [];

  if (
    incoming.length >
    PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT
  ) {
    throw new Error(
      'A product can have at most ' +
      PRODUCT_PACKAGING_V41.MAX_PACKAGES_PER_PRODUCT +
      ' package units.'
    );
  }

  const units = getUnitMap_();
  const baseBarcode = sanitizeText_(
    payload.barcode,
    80
  );
  const productId = existingProduct
    ? String(existingProduct.ProductID)
    : '';
  const seenBarcodes = {};
  const seenDefinitions = {};

  incoming.forEach(function(raw) {
    raw = raw || {};

    const unitId = sanitizeText_(
      raw.packageUnitId,
      80
    );

    if (!units[unitId]) {
      throw new Error(
        'Select a valid package unit such as Box, Bag or Pack.'
      );
    }

    const factor = roundQtyV41_(
      raw.unitsPerPackage
    );

    if (factor <= 1) {
      throw new Error(
        'Units per package must be greater than 1.'
      );
    }

    const definitionKey =
      unitId + '|' + factor;

    if (seenDefinitions[definitionKey]) {
      throw new Error(
        'The same package unit and conversion was entered twice.'
      );
    }

    seenDefinitions[definitionKey] = true;

    const barcode = sanitizeText_(
      raw.barcode,
      80
    );

    if (barcode) {
      if (barcode === baseBarcode) {
        throw new Error(
          'Base-unit barcode and package barcode must be different.'
        );
      }

      if (seenBarcodes[barcode]) {
        throw new Error(
          'The same package barcode was entered twice.'
        );
      }

      seenBarcodes[barcode] = true;

      const productDuplicate =
        getRows_(POS.SHEETS.PRODUCTS)
          .find(function(row) {
            return String(row.Barcode || '') ===
              barcode;
          });

      if (productDuplicate) {
        throw new Error(
          'Package barcode ' +
          barcode +
          ' is already a product barcode.'
        );
      }

      const packageDuplicate =
        packageRowsV41_('', true)
          .find(function(row) {
            return String(row.PackageBarcode || '') ===
              barcode &&
              String(row.PackageID || '') !==
                String(raw.packageId || '');
          });

      if (packageDuplicate) {
        throw new Error(
          'Package barcode ' +
          barcode +
          ' is already in use.'
        );
      }
    }

    if (
      number_(raw.priceUSD) < 0 ||
      number_(raw.priceKHR) < 0
    ) {
      throw new Error(
        'Package selling prices cannot be negative.'
      );
    }
  });

  if (
    payload.productCode &&
    existingProduct
  ) {
    validateProductCodeV41_(
      payload.productCode,
      productId
    );
  }
}

function saveProductWithPackagesV41(sessionToken, payload) {
  const user = requireSession_(sessionToken);
  requirePermission_(user, 'PRODUCTS');
  payload = payload || {};

  const existingBeforeSave = payload.productId
    ? findRowBy_(
        POS.SHEETS.PRODUCTS,
        'ProductID',
        payload.productId
      )
    : null;

  validateProductPackagePayloadV41_(
    payload,
    existingBeforeSave
  );

  /*
   * saveProduct() already uses the Apps Script lock. Do not place it inside
   * another ScriptLock because ScriptLock is not re-entrant.
   */
  const baseResult = saveProduct(sessionToken, payload);

  return withScriptLock_(function() {
    const product = findRowBy_(
      POS.SHEETS.PRODUCTS,
      'ProductID',
      baseResult.productId
    );

    if (!product) {
      throw new Error('Product was saved but could not be reloaded.');
    }

    let productCode = sanitizeText_(
      payload.productCode,
      30
    ).toUpperCase();

    if (!productCode) {
      productCode = product.ProductCode
        ? String(product.ProductCode)
        : nextProductCodeLockedV41_();
    }

    productCode = validateProductCodeV41_(
      productCode,
      product.ProductID
    );

    updateRowObject_(
      POS.SHEETS.PRODUCTS,
      product._row,
      {
        ProductCode: productCode,
        UpdatedAt: new Date()
      }
    );

    product.ProductCode = productCode;

    saveProductPackagesLockedV41_(
      String(product.ProductID),
      product,
      payload.packages,
      user
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      productId: String(product.ProductID),
      productCode: productCode,
      imageUrl: String(
        product.ImageURL ||
        baseResult.imageUrl ||
        ''
      ),
      packages: packageRowsV41_(
        product.ProductID,
        true
      ).map(function(row) {
        return packageToPublicV41_(
          row,
          getUnitMap_()
        );
      })
    };
  });
}

function resolvePackageV41_(product, packageId, purpose, packageMap) {
  const id = sanitizeText_(packageId, 80);
  const unitMap = getUnitMap_();
  const baseUnit = unitMap[String(product.UnitID || '')] || {};

  if (!id) {
    return {
      packageId: '',
      productId: String(product.ProductID),
      unitId: String(product.UnitID || ''),
      unitName: String(baseUnit.abbreviation || baseUnit.nameEN || baseUnit.nameKH || ''),
      barcode: String(product.Barcode || ''),
      factor: 1,
      allowDecimal: baseUnit.allowDecimal === true,
      priceUSD: roundMoney_(number_(product.PriceUSD)),
      priceKHR: Math.round(number_(product.PriceKHR))
    };
  }

  packageMap = packageMap || packageMapV41_(false);
  const pkg = packageMap[id];

  if (!pkg || String(pkg.productId) !== String(product.ProductID) || !pkg.active) {
    throw new Error('The selected product package is unavailable.');
  }

  if (purpose === 'SALE' && !pkg.allowSale) {
    throw new Error('This package is not enabled for sale.');
  }

  if (purpose === 'PURCHASE' && !pkg.allowPurchase) {
    throw new Error('This package is not enabled for purchase.');
  }

  return {
    packageId: pkg.packageId,
    productId: pkg.productId,
    unitId: pkg.packageUnitId,
    unitName: String(pkg.abbreviation || pkg.packageNameEN || pkg.packageNameKH || ''),
    barcode: String(pkg.barcode || ''),
    factor: number_(pkg.unitsPerPackage, 1),
    allowDecimal: pkg.allowDecimal === true,
    priceUSD: pkg.priceUSD > 0
      ? pkg.priceUSD
      : roundMoney_(number_(product.PriceUSD) * number_(pkg.unitsPerPackage, 1)),
    priceKHR: pkg.priceKHR > 0
      ? pkg.priceKHR
      : Math.round(number_(product.PriceKHR) * number_(pkg.unitsPerPackage, 1)),
    packageNameEN: pkg.packageNameEN,
    packageNameKH: pkg.packageNameKH
  };
}
