# Project architecture

- Featured Notes use a reviewed publication snapshot separate from private personal notes and AI caches, because existing content must not be silently treated as approved curriculum material.
- Notes writes go through authenticated database functions that verify the existing protected admin role; direct student status, publication, and private-comment writes are not granted.
- Internal reviewer comments live in a separate admin-only table, because hiding a field in the interface is not an access boundary.
- Published Notes readers use a separate route from the legacy local-note editor, because the two note models and storage paths differ.
- The generated Cloud client and existing session are reused; the local Notes API contract can be removed when Cloud regenerates types after applying the additive setup.