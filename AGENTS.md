# Project architecture

- Web builds use the framework hosting defaults; only Capacitor builds enable SPA-only output, because custom Node output can publish an empty legacy HTML document instead of the actual application.
- Content pages define leaf metadata through pageHead; parent pages render matching child outlets so callbacks and paper previews mount instead of silently displaying the parent.
- Browser-only diagram rendering loads after mount with strict sanitization; AI HTTP callers send the publishable apikey and real session bearer, never an opaque publishable value as a JWT.

- Keep the direct TanStack Router and router-plugin versions aligned with the installed TanStack Start dependency requirements; incompatible router-core copies break server-route type augmentation and SSR exports.
- Notes uses the pre-feature personal editor and its existing storage helpers; the parent renders nested personal-note readers because reverting a feature must not break pre-existing routes.
- App auth and browser integrations share the generated persistent client pinned to the user-selected external connection through Vite public defines; .env stays untouched, and a separate quiz read-only client remains available because anonymous quiz reads must not alter session state.
- Rollbacks copy only reviewed source files from history and preserve runtime/dependency/security repairs, because a whole-tree restore can overwrite protected environment values and reintroduce startup failures.