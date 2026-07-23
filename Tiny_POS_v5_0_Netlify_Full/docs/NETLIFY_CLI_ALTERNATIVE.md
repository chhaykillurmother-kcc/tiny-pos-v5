# Netlify CLI Alternative — No GitHub Required

Use this only when you do not want to create a GitHub repository.

1. Install the current Node.js LTS version on Windows.
2. Open Command Prompt or PowerShell.
3. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

4. Change directory to the extracted project root—the folder containing `netlify.toml`:

```bash
cd "C:\path\to\Tiny_POS_v5_0_Netlify_Full"
```

5. Sign in:

```bash
netlify login
```

6. Initialize a new site:

```bash
netlify init
```

Choose to create and configure a new Netlify site.

7. Add the backend URL:

```bash
netlify env:set APPS_SCRIPT_WEB_APP_URL "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```

8. Add the private API secret:

```bash
netlify env:set POS_API_SECRET "YOUR_GENERATED_SECRET"
```

9. Deploy production:

```bash
netlify deploy --prod
```

10. Copy the production Netlify URL from the command output.

For later frontend updates, run `netlify deploy --prod` again from the same project folder.
