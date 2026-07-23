# Tiny POS v5.0 — Complete Fresh Installation

Follow the sections in this exact order.

---

# Part 1 — Prepare the files

1. Extract `Tiny_POS_v5_0_Netlify_Full.zip`.
2. Keep the extracted folder on your computer.
3. Do not upload the ZIP directly to Apps Script.
4. Do not replace the existing production POS. This package uses a new Google Sheet, new Apps Script project, new Netlify site, and new Telegram bot.

The important paths are:

```text
apps-script/TinyPOS_Backend_V50.gs
apps-script/appsscript.json
netlify-site/public/index.html
netlify-site/netlify/functions/pos-api.mjs
netlify.toml
```

---

# Part 2 — Create the new Google Sheet

1. Open Google Drive.
2. Select **New → Google Sheets → Blank spreadsheet**.
3. Rename it, for example:

```text
Tiny POS v5 Production
```

4. Open **Extensions → Apps Script**.
5. Rename the Apps Script project:

```text
Tiny POS v5 Backend
```

6. Delete the default example inside `Code.gs`.
7. Rename `Code.gs` to:

```text
TinyPOS_Backend_V50
```

8. Open `apps-script/TinyPOS_Backend_V50.gs` from the extracted package.
9. Copy its complete contents.
10. Paste everything into the Apps Script file.
11. Press **Ctrl + S**.

The single backend file contains the complete server source. The `apps-script/source-files` folder is included only for easier maintenance and inspection.

---

# Part 3 — Replace the Apps Script manifest

1. In Apps Script, open **Project Settings**.
2. Enable **Show "appsscript.json" manifest file in editor**.
3. Open `appsscript.json` in the left file list.
4. Replace its complete contents with:

```text
apps-script/appsscript.json
```

5. Press **Ctrl + S**.

The manifest grants access to Google Sheets, Google Drive backup/image storage, external requests, UI prompts, and scheduled backup triggers.

---

# Part 4 — Install the fresh database

1. In the Apps Script function selector, choose:

```javascript
installTinyPOSV50Fresh
```

2. Click **Run**.
3. Complete Google authorization using the owner account.
4. Approve access to the spreadsheet, Drive, external requests, and Apps Script triggers.
5. The installer will ask for:

```text
Administrator name
Administrator login ID
Administrator PIN
Optional Telegram numeric user ID
```

Recommended example:

```text
Administrator name: Shop Owner
Login ID: admin
PIN: a private PIN of at least 4 characters
Telegram ID: leave blank for now
```

6. The installer creates all database sheets, the Main Branch, default categories and units, product packaging support, expense categories, FIFO tables, users, permissions, backups, transfers, returns, stock counts, and related structures.
7. It does not import old data because this is a new blank database.

The installer may show several verification dialogs. Continue until the final v5.0 result appears.

---

# Part 5 — Verify the database

Run:

```javascript
verifyTinyPOSV50
```

Expected result:

```text
Tiny POS v5.0 verification: OK
```

When a problem is shown, stop and correct it before deployment.

---

# Part 6 — Deploy the Apps Script backend

1. Select **Deploy → New deployment**.
2. Click the gear and choose **Web app**.
3. Use:

```text
Description: Tiny POS v5 Backend
Execute as: Me
Who has access: Anyone
```

4. Click **Deploy**.
5. Complete authorization when asked.
6. Copy the Web App URL. It must look like:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

7. Open the URL in a browser. It should display a small JSON health response containing:

```json
{
  "success": true,
  "service": "Tiny POS Backend"
}
```

The Apps Script URL is the backend only. Cashiers do not use it as the POS page.

---

# Part 7 — Get the Netlify environment values

Return to the Apps Script editor and run:

```javascript
showNetlifyEnvironmentValuesV50
```

Copy both displayed values:

```text
APPS_SCRIPT_WEB_APP_URL
POS_API_SECRET
```

Keep `POS_API_SECRET` private. Do not place it in `index.html`, GitHub source, screenshots, Telegram messages, or public documentation.

---

# Part 8 — Put the project on GitHub

Netlify Functions must deploy with the project. The recommended method is a Git repository rather than a static HTML drag-and-drop deployment.

1. Sign in to GitHub.
2. Create a new private repository, for example:

```text
tiny-pos-v5
```

3. Upload the complete extracted project folder contents so the repository root contains:

```text
apps-script/
netlify-site/
docs/
netlify.toml
README.md
```

4. Do not upload `.env` files or the API secret.
5. Commit the uploaded files.

You may also use GitHub Desktop to add and publish the complete folder.

---

# Part 9 — Create the Netlify site

1. Sign in to Netlify.
2. Select **Add new project → Import an existing project**.
3. Choose GitHub.
4. Select the `tiny-pos-v5` repository.
5. Netlify reads `netlify.toml` automatically.
6. Confirm these values:

```text
Build command: empty
Publish directory: netlify-site/public
Functions directory: netlify-site/netlify/functions
```

7. Before or immediately after the first deployment, open the site's environment-variable settings.
8. Add:

```text
Name: APPS_SCRIPT_WEB_APP_URL
Value: the Apps Script /exec URL
```

9. Add:

```text
Name: POS_API_SECRET
Value: the secret generated by Apps Script
```

10. Save the variables.
11. Trigger a new production deployment.
12. Wait until the deployment status is **Published**.
13. Copy the production URL, for example:

```text
https://tiny-pos-v5-example.netlify.app
```

14. Open it directly in Chrome or Safari.
15. Sign in with the administrator Login ID and PIN created during installation.

When the login says that the backend is missing, recheck the two Netlify environment variables and deploy again.

---

# Part 10 — Test the camera before Telegram

Use the direct Netlify URL on the phone.

1. Sign in.
2. Open **New Sale**.
3. Press the barcode camera button.
4. Choose **Allow Camera**.
5. Test an EAN, UPC, Code 128, or QR value that matches an existing product barcode, SKU, product code, or package barcode.

The camera now runs on the top-level Netlify page. No separate camera website is needed.

Create a test product first when the database is empty:

```text
Product: Coca-Cola
Base unit: Can
Barcode: a barcode you can scan
Price: 0.75
Opening stock: add through a purchase or inventory adjustment
```

For packages:

```text
Box = 24 Cans
Box barcode = a different barcode
```

Scanning the base barcode adds Can. Scanning the package barcode adds Box.

---

# Part 11 — Create the new Telegram bot

1. Open the verified **@BotFather** account in Telegram.
2. Send:

```text
/newbot
```

3. Enter the bot display name, for example:

```text
Tiny POS Shop
```

4. Enter a unique username ending in `bot`, for example:

```text
TinyPosShop2026Bot
```

5. BotFather returns a token similar to:

```text
1234567890:ABCDEF...
```

6. Copy the token privately.

Do not publish or share the token. Anyone with it can control the bot.

---

# Part 12 — Connect the new bot

In Apps Script, run:

```javascript
configureTelegramBotV50
```

The function asks for:

```text
New Telegram bot token
Netlify production POS URL
```

Paste the values and confirm.

The function automatically:

```text
Stores the bot token in Script Properties
Stores the Netlify POS URL
Sets the Telegram webhook to the Apps Script backend
Sets the bot's menu button to the Netlify POS URL
```

---

# Part 13 — Link the administrator Telegram account

1. Open the new bot.
2. Send:

```text
/start
```

3. The bot replies with your numeric Telegram ID and an **Open POS** button.
4. Copy the numeric Telegram ID.
5. In Apps Script, run:

```javascript
linkAdministratorTelegramV50
```

6. Paste the numeric ID.
7. Close the Mini App completely.
8. Reopen it from the bot's **Open POS** button.

When the Telegram account is linked, Tiny POS can authenticate the administrator automatically through Telegram Mini App init data. Direct browser login with Login ID and PIN remains available.

---

# Part 14 — Add the first real setup data

Use this order:

```text
1. Settings: shop name, phone, address, receipt footer, language/theme
2. Branches
3. Users and exact permissions
4. Categories
5. Units
6. Suppliers
7. Products and package conversions
8. Purchases / opening stock
9. Customers
10. Test sale
```

Do not manually type stock into linked transaction tables. Use Purchase Receiving, Inventory Adjustment, or approved Stock Count.

---

# Part 15 — Required test sequence

Complete every test in `TEST_CHECKLIST.md` before changing the business to v5.0.

Keep the previous POS available until these pass:

```text
Login in browser
Telegram automatic login
Camera scanning
Can/Box mixed sale
Cash sale
Bank-marked sale
Pending invoice
Customer credit sale
Return/refund
Purchase and partial receiving
FIFO profit
Branch transfer and variance receipt
Stock count
Expense category/create/edit/delete
Branch and cashier reports
User permission hiding
Backup and restore on test data
```

---

# Updating later

## Frontend change

1. Edit `netlify-site/public/index.html` or other Netlify files.
2. Commit to GitHub.
3. Netlify deploys the new version.

## Backend change

1. Update Apps Script code.
2. Select **Deploy → Manage deployments → Edit**.
3. Choose **New version**.
4. Deploy while keeping the same backend URL.

## Rotate a leaked API secret

Run:

```javascript
rotatePosApiSecretV50
```

Then replace `POS_API_SECRET` in Netlify and redeploy immediately.
