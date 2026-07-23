# Tiny POS v5.0 — Production Test Checklist

## Infrastructure

- [ ] Apps Script `/exec` health response opens.
- [ ] Netlify production URL opens.
- [ ] Netlify Function log shows successful `/api/pos` requests.
- [ ] Admin can log in by Login ID and PIN.
- [ ] `/start` opens the Netlify POS.
- [ ] Telegram auto-login works after the Telegram ID is linked.

## Camera

- [ ] Rear camera permission appears.
- [ ] EAN-13 scans.
- [ ] Code 128 scans.
- [ ] QR scans.
- [ ] Base barcode adds the base unit.
- [ ] Box/package barcode adds the package unit.
- [ ] Torch button works when supported.
- [ ] Take Photo fallback works.
- [ ] USB/Bluetooth scanner works.

## Products and packaging

- [ ] New product gets the next P000001-style code.
- [ ] Base unit is saved.
- [ ] Package conversion is saved.
- [ ] Base and package barcodes are unique.
- [ ] Product status toggle works immediately.
- [ ] Inactive product disappears from New Sale.
- [ ] A–Z English sorting works.
- [ ] Khmer sorting works.

## Sales

- [ ] Can and Box can be mixed in one cart.
- [ ] Base-stock deduction is correct.
- [ ] Cash sale completes.
- [ ] Bank-marked sale completes.
- [ ] Credit sale completes.
- [ ] Pending invoice resumes.
- [ ] Receipt print works.
- [ ] Receipt image export works.
- [ ] Sale appears under Returns & Refunds.

## Inventory and FIFO

- [ ] Purchase by Box converts to base units.
- [ ] FIFO cost per base unit is correct.
- [ ] Branch inventory increases only in selected branch.
- [ ] Transfer deducts source branch.
- [ ] Transfer receive adds destination branch.
- [ ] Missing/damaged transfer quantities are recorded.
- [ ] Stock Count saves, submits, approves, and applies.

## Returns

- [ ] Customer return restores correct base quantity.
- [ ] Box return restores package conversion quantity.
- [ ] Supplier return deducts correct FIFO quantity.
- [ ] Refund print/image works.

## Cash and expenses

- [ ] Expense category can be created.
- [ ] Cash expense saves.
- [ ] Bank expense saves.
- [ ] Expense search works.
- [ ] Expense edit works.
- [ ] Expense delete works.

## Branches and reports

- [ ] Dashboard branch switch works.
- [ ] Product Management branch switch works.
- [ ] Inventory branch filter works.
- [ ] Purchase destination branch works.
- [ ] Reports filter by branch.
- [ ] Reports filter by salesperson.

## Permissions

- [ ] Cashier sees only allowed functions.
- [ ] Stock Controller sees only allowed functions.
- [ ] Manager custom permissions hide unchecked functions.
- [ ] Hidden pages cannot be opened directly.

## Backup and reset

- [ ] Manual backup appears in Drive.
- [ ] Backup record appears in POS.
- [ ] Restore is tested only on test data.
- [ ] Database Maintenance preview works.
- [ ] Pre-reset backup is mandatory.
