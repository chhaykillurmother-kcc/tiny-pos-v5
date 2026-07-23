/** Tiny POS v5.0 Netlify Function proxy. */
function envValue(name) {
  try {
    if (globalThis.Netlify && globalThis.Netlify.env && typeof globalThis.Netlify.env.get === 'function') {
      const value = globalThis.Netlify.env.get(name);
      if (value) return value;
    }
  } catch (error) {
    console.warn('Netlify.env read failed:', error);
  }
  return process.env[name] || '';
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export default async function handler(request) {
  const requestId = crypto.randomUUID();

  if (request.method !== 'POST') {
    return jsonResponse({
      success: false,
      message: 'Method not allowed.',
      requestId
    }, 405);
  }

  try {
    const appsScriptUrl = envValue('APPS_SCRIPT_WEB_APP_URL').replace(/\/+$/, '');
    const apiSecret = envValue('POS_API_SECRET');

    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(appsScriptUrl)) {
      throw new Error('APPS_SCRIPT_WEB_APP_URL is missing or invalid.');
    }
    if (!apiSecret || apiSecret.length < 20) {
      throw new Error('POS_API_SECRET is missing or invalid.');
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 7_000_000) {
      return jsonResponse({
        success: false,
        message: 'Request body is too large.',
        requestId
      }, 413);
    }

    const payload = await request.json();
    const action = String(payload?.action || '').trim();
    const args = Array.isArray(payload?.args) ? payload.args : [];

    if (!action || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(action)) {
      throw new Error('Invalid API action.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    let backendResponse;
    try {
      backendResponse = await fetch(`${appsScriptUrl}?api=v5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Accept': 'application/json',
          'X-Tiny-POS-Proxy': 'netlify-v5'
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          action,
          args,
          apiSecret,
          proxyRequestId: requestId
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await backendResponse.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error('Non-JSON Apps Script response:', responseText.slice(0, 1000));
      throw new Error('Apps Script returned invalid JSON. Confirm the backend deployment and environment URL.');
    }

    if (result.success === false) {
      return jsonResponse(result, 400);
    }

    return jsonResponse(result, 200);
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    console.error('Tiny POS proxy error:', error);
    return jsonResponse({
      success: false,
      message: timedOut
        ? 'The backend request timed out. Check Apps Script Executions and try again.'
        : (error?.message || 'Unexpected proxy error.'),
      requestId
    }, timedOut ? 504 : 500);
  }
}

export const config = {
  path: '/api/pos'
};
