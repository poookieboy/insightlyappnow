# Project architecture

- Web builds use the framework hosting defaults; only Capacitor builds enable SPA-only output, because custom Node output can publish an empty legacy HTML document instead of the actual application.

- Keep the direct TanStack Router and router-plugin versions aligned with the installed TanStack Start dependency requirements; incompatible router-core copies break server-route type augmentation and SSR exports.
- Featured Notes use a reviewed publication snapshot separate from private personal notes and AI caches, because existing content must not be silently treated as approved curriculum material.
- Notes writes go through authenticated database functions that verify the existing protected admin role; direct student status, publication, and private-comment writes are not granted.
- Internal reviewer comments live in a separate admin-only table, because hiding a field in the interface is not an access boundary.
- Published Notes readers use a separate route from the legacy local-note editor, because the two note models and storage paths differ.
- App auth, Notes, and browser integrations share the generated persistent client pinned to the user-selected external connection through Vite public defines; .env stays untouched, and a separate quiz read-only client remains available because anonymous quiz reads must not alter session state.
- Repository Notes migrations are operator-applied to the configured external project after schema inspection; do not provision or resume any managed backend to install them.
- Featured-draft AI uses the existing ai-notes function with server-side Groq credentials, verified caller identity and admin checks for generation; AI output remains a draft until explicit human review.