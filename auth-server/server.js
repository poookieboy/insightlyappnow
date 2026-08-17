// Minimal auth-server example to demonstrate verifying Google ID tokens and a PKCE hint
// Run: NODE_ENV=development node server.js
// Requires Node 18+ for global fetch. Set GOOGLE_CLIENT_ID env var for stricter verification.

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APP_COOKIE_NAME = 'sid';

// Simple endpoint to verify an ID token from Google Identity Services
app.post('/verify-id-token', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ error: 'missing id_token' });

  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
    if (!resp.ok) return res.status(401).json({ error: 'invalid token' });
    const info = await resp.json();

    if (GOOGLE_CLIENT_ID && info.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'token audience mismatch' });
    }

    // At this point the token is valid. Create a session for the user here.
    const userid = info.sub;
    const sessionId = 's:' + Buffer.from(userid + ':' + Date.now()).toString('base64');

    // Note: Use a secure session store in production
    res.cookie(APP_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({ ok: true, user: { id: userid, email: info.email, name: info.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'verification failed' });
  }
});

// PKCE token exchange example (server side) — POST authorization code and code_verifier to exchange for tokens
app.post('/exchange-code', async (req, res) => {
  const { code, code_verifier, redirect_uri, client_id } = req.body;
  if (!code || !code_verifier || !redirect_uri || !client_id)
    return res.status(400).json({ error: 'missing parameters' });

  try {
    const params = new URLSearchParams({
      code,
      client_id,
      code_verifier,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokens = await tokenResp.json();
    if (!tokenResp.ok) return res.status(400).json({ error: tokens });

    // tokens contains access_token, id_token, refresh_token (if offline)
    return res.json(tokens);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'token exchange failed' });
  }
});

app.listen(PORT, () => console.log(`Auth server listening on http://localhost:${PORT}`));
