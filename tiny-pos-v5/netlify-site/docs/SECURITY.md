# Tiny POS v5.0 Security Notes

- Keep `POS_API_SECRET` only in Apps Script Properties and Netlify environment variables.
- Keep the Telegram bot token private.
- Do not place either secret in `index.html` or GitHub.
- Use a private GitHub repository.
- Deploy Apps Script as **Execute as Me** and **Anyone** so Netlify and Telegram can call it.
- The Apps Script API uses an explicit action allowlist; arbitrary server functions cannot be requested.
- User sessions and module permissions are still checked by backend functions.
- Rotate the API secret with `rotatePosApiSecretV50` after any suspected leak.
- Revoke and regenerate the Telegram token through BotFather after any suspected leak.
- Test Backup/Restore and Database Reset only on copied data first.
