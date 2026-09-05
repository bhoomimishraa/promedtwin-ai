// Vercel serverless function — proxies chat requests to the Anthropic API
// so the API key never reaches the browser.
//
// Deploy this file at:  /api/chat.js  (Vercel auto-detects it as a serverless function)
// Set an environment variable in your Vercel project settings:
//   ANTHROPIC_API_KEY = sk-ant-...
//
// The front end (index.html) calls fetch('/api/chat', { method: 'POST', body: {...} })
// which arrives here and gets forwarded to Anthropic with the key attached.
//
// Written in CommonJS (module.exports) rather than ES module (export default)
// syntax, since Vercel's Node.js runtime defaults to CommonJS for .js files
// unless a package.json with "type": "module" is present. Using ES module
// syntax without that config causes an immediate FUNCTION_INVOCATION_FAILED
// crash before any of this code even runs.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Anthropic API', detail: String(err) });
  }
};
