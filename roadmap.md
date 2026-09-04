# Insightly roadmap

## In progress
- [ ] Notes editor layout: full-screen wallpaper + writing area must fill the screen (reported screenshot shows editor collapsing under the toolbar).

## New
- [x] Remove LOVABLE_API_KEY dependency from AI features — every AI function now calls Gemini directly with a server-side key (GEMINI_API_KEY), with the old gateway kept only as a fallback.
- [ ] Confirm GEMINI_API_KEY is set in Project Settings → Secrets.
