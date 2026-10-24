# Project architecture

- Keep the direct TanStack Router and router-plugin versions aligned with the installed TanStack Start dependency requirements; incompatible router-core copies break server-route type augmentation and SSR exports.
- Featured Notes use a reviewed publication snapshot separate from private personal notes and AI caches, because existing content must not be silently treated as approved curriculum material.
- Notes writes go through authenticated database functions that verify the existing protected admin role; direct student status, publication, and private-comment writes are not granted.
- Internal reviewer comments live in a separate admin-only table, because hiding a field in the interface is not an access boundary.
- Published Notes readers use a separate route from the legacy local-note editor, because the two note models and storage paths differ.
- Featured Notes and the Notes hub's personal editor reuse the existing external database client and its own authenticated session, because app-session tokens from a different configured service must never authorize external data writes; unrelated app auth and the legacy local-note route remain unchanged.
- Repository Notes migrations are operator-applied to the configured external project after schema inspection; do not provision or resume any managed backend to install them.
- Featured-draft AI uses the existing ai-notes function with server-side Groq credentials, verified caller identity and admin checks for generation; AI output remains a draft until explicit human review.