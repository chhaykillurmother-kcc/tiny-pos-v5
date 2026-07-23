# Tiny POS v5.0 Troubleshooting

## Netlify page says backend configuration is missing

Check Netlify environment variables:

```text
APPS_SCRIPT_WEB_APP_URL
POS_API_SECRET
```

Then trigger a new production deploy.

## Apps Script returned invalid JSON

- Confirm the environment URL ends in `/exec`.
- Open the URL directly and confirm the backend health JSON.
- Confirm the Apps Script deployment is a Web app.
- Confirm access is set to Anyone.
- Check Apps Script **Executions** for the error.

## Unauthorized API request

The Netlify `POS_API_SECRET` differs from Apps Script. Run:

```javascript
showNetlifyEnvironmentValuesV50
```

Copy the secret again, update Netlify, and redeploy.

## Camera permission is blocked

- Open the Netlify production URL, not a local HTML file.
- Allow camera permission for the Netlify site.
- Allow Telegram camera permission when using the Mini App.
- Close other camera/video applications.
- Try Chrome or Safari directly.
- Use Take Photo or an external scanner as fallback.

## Telegram /start does not respond

Run:

```javascript
configureTelegramBotV50
```

Then check the Apps Script Executions page for webhook errors.

## Telegram opens the wrong URL

Run `configureTelegramBotV50` again and paste the correct Netlify production URL.

## Login works in browser but not Telegram

Send `/id` to the bot and run:

```javascript
linkAdministratorTelegramV50
```

For other employees, save their Telegram ID in User Management.
