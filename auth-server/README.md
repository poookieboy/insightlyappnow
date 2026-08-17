Auth server example for InsightlyAppNow

This folder contains a small Node/Express example server showing:
- Verifying a Google ID token (from Google Identity Services) at POST /verify-id-token
- Exchanging an OAuth2 code with PKCE at POST /exchange-code

Purpose
- Demonstrates how to verify Google identity tokens on a server and create a cookie-based session.
- Shows a server-side PKCE exchange for mobile/native flows where the system browser returns an authorization code to the app.

Notes / Setup
1. Node 18+ is recommended (so global fetch is available).
2. Create a .env or set environment variables as needed:
   - GOOGLE_CLIENT_ID (optional but recommended for stricter verification)
   - NODE_ENV=development

Run locally

  cd auth-server
  node server.js

Endpoints

- POST /verify-id-token
  Body: { id_token }
  Verifies the id_token with Google's tokeninfo endpoint and sets a cookie named "sid".

- POST /exchange-code
  Body: { code, code_verifier, redirect_uri, client_id }
  Exchanges an OAuth2 authorization code (PKCE) for tokens using Google's token endpoint.

PKCE / APK notes
- For WebView-wrapped APKs, Google blocks OAuth in embedded webviews. Use the system browser for OAuth PKCE flows.
- Flow summary for APK (recommended):
  1. App opens system browser to Google's authorization endpoint with PKCE code_challenge and redirect_uri set to a custom scheme (myapp://oauth2redirect) or to a loopback address.
  2. After user consents, Google redirects back to the app (intent filter handling the custom scheme) with a code.
  3. The app posts the code and the original code_verifier to a server (/exchange-code) to exchange for tokens.
  4. The server returns tokens or creates a server-side session and sets a cookie if the app uses webviews.

Security
- This example is intentionally minimal. For production:
  - Use HTTPS everywhere.
  - Use a proper session store (Redis, DB) and rotate session IDs.
  - Validate tokens and enforce token expiration checks.
  - Protect endpoints (rate-limiting, CSRF where applicable).
