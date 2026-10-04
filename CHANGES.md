# Changes in this version

## Docker and deployment
- Dockerfile: runs as non-root user (UID 1000) so it works on Hugging Face Spaces
- .dockerignore: new; stops local node_modules and database from being copied into the image
- .gitattributes: new; normalizes line endings to LF
- backend/app/main.py: SPA fallback so /map, /assess and /assessment/:id work on refresh; seeds demo data on first start
- README.md: Hugging Face Spaces header and starter content
- Makefile: fixed `run` and `clean`

## Backend
- core/preprocess.py: fixed heatmap overlay bug (heatmaps were saturating into flat colors)
- core/explain.py: lowercase finding name inside the summary sentence
- routers/stats.py: AI-human agreement counts real reviews only, not seeded demo records
- routers/assessments.py: invalid numbers return a clear 422 instead of a 500 error
- tests/test_overlay.py: new regression tests for the overlay fix (13 tests pass)

## Frontend: mobile (375px)
- Assess.tsx: styled photo picker, 10 MB check, errors visible on every step, clarity chips wrap, larger checkboxes, clearer review step
- Results.tsx: new "Data quality checks" card so validation warnings are visible
- TopBar.tsx: compact Responsible AI button on phones
- Sidebar.tsx: short labels in the bottom nav, iPhone safe-area padding
- index.css: dark native controls, 16px inputs on phones (stops iOS zoom)
- CompareSlider.tsx: slider drags no longer fight page scrolling

## Frontend: accessibility (axe-core: 0 violations at 375px)
- Responsible AI modal: focus moves in on open and returns on close
- Collapsed sidebar links have accessible names
- Heading order fixed on Landing, Assess, Review and finding cards
- Confidence dial percentage readable by screen readers
- Compare slider: aria-valuetext, Home and End keys
- "Correct it" button announces expanded state; clarity chips announce pressed state
- Methodology diagram block reachable by keyboard

## Update 2: real demo photos
- scripts/seed_demo.py: uses real photos from backend/demo_photos/ when present (falls back to placeholders), matches field measurements to the photo type by file name, stores validation warnings, shrinks large photos, map center configurable with SEED_CENTER
- backend/demo_photos/README.md: new; naming guide and photo credits list
- routers/assessments.py: photos uploaded by users are saved as real data (is_demo = false), so their reviews count toward AI-human agreement

## Update 3: light and clean theme (teal / green)
- tailwind.config.ts and src/index.css: new light color tokens, clean white cards, solid teal buttons, 44px tap targets, one consistent style for form fields
- Inter font everywhere (Space Grotesk removed) for a standard, readable look
- Decorative moving background removed
- Risk colors darkened slightly so text stays readable on white (WCAG AA)
- Map now uses light map tiles; popups are white cards
- Header is sticky with a white background; sidebar and mobile bottom bar are white
- Charts, gauges, dials, badges and warnings recolored for a light background
- Checked at phone (375px), tablet (820px) and laptop (1440px): no sideways scrolling, 0 axe accessibility violations

## Update 4: easier to understand
- Assess: new "Try a sample photo" button loads a demo photo and its measurements, so judges can test in seconds; photo picker now lets phones choose camera or gallery
- Results: summary card at the top (score, top finding, confidence, warnings, "Confirm the result" button)
- Results: "Do you agree with the AI?" moved right after the explanation
- Results: "What the AI cannot see" shortened to one line with "Show details"
- Results: "Why this score" chart shows only factors that added points, with a color legend and screen reader text
- Results: one "Demo" badge instead of two, friendlier title "Stream check" with the date, clearer view buttons (Compare, Heatmap, Boxes, Photo)
- Home: example result card with a real photo and heatmap; distinct icons for Snap, Explain, Confirm and for Human, Animal, Ecosystem
- Map styles bundled into the app instead of loaded from an outside website (more reliable)

## Update 5: Demo Mode explained and animations
- TopBar: "Demo Mode" badge is now a button with a pulsing dot; it opens a new "What is Demo Mode?" window (components/DemoModeModal.tsx)
- Assess: "Analysing your photo" screen with a scanning line over the photo, a progress bar and steps that tick off (shown for at least 2.6 seconds)
- Results: compare slider sweeps left and right once so people see they can drag it
- Results: risk numbers count up and the gauge fills
- Review: animated "Thanks!" card after Agree, Correct it or Not sure
- Cards fade in one after another, lift slightly on hover (laptop only), and map dots pop in
- All animations turn off when the device is set to reduce motion

## Update 6: installable app, sharing, small screens
- Installable app (PWA): frontend/public/manifest.json, sw.js and app icons; "Install app" button on the home page (Android and Chrome), iPhone instructions (Share, then Add to Home Screen)
- Works on weak connections: pages and photos already seen load from the cache; live results always come from the server
- Results: "Share" button (phone share menu, or "Link copied" on laptops)
- New app icon and browser tab icon
- Small phones (320px) and phones turned sideways checked: no sideways scrolling, 0 accessibility violations
- Methodology weights table scrolls inside its card on very small screens; Demo badge stays on one line
- Map markers drawn as SVG so they can animate

## Update 7: speed fix
- core/demo_mode.py: region finding rewritten with OpenCV (same results, about 15 times faster; analysis went from about 16 seconds to about 1 second)
- core/preprocess.py + routers/assessments.py: very large photos are resized to 1600 px before analysis (faster, and no memory crash on huge photos)
- Assess.tsx: photos are resized in the browser before upload (much faster on mobile data)
- First start with demo seeding: about 5 seconds instead of about 35
- tests: 2 new tests (15 pass)

## Update 8: better analysis and bug fixes
Analysis (Demo Mode)
- Trash is now found by its own rule (small, sharp-edged, plastic-coloured objects), not by brown water as before
- Algae rule is stricter (clearly green, saturated), so murky or brown-green water and green nets are no longer called algae
- Risk index: several trash detections now add up; trash weight raised (human 0.25, animal 0.30, ecosystem 0.30); new pollution term 0.15 x debris x turbidity (sewage often travels with trash). A heavily littered river now scores MODERATE from the photo alone, HIGH with sewage smell and nearby homes
- Explanations: no repeated lines, findings sorted by confidence, clearer wording ("...that this shows murky water")
- 4 new tests for the analysis rules (19 tests pass)

Bug fixes
- "Correct it": each label appears once, readable names (no more "algae_mat"), already-found labels are not offered again
- Expert review page and map filters use readable names
- Map zooms to wherever the demo sites are; stays steady while filtering; corrected results count as human-checked (solid ring)
- Demo Mode badge now follows the real state (demo vs trained models)
- Methodology formula updated for the new pollution term

## Update 9: cache fix
- frontend/public/sw.js: photos and heatmaps are no longer cached by the browser (old images could show after resetting the demo data); cache version bumped so old caches are cleared automatically

## Update 10: map photo preview
- MapView.tsx + index.css: hovering a map dot (laptop) shows a small card with the photo, top finding and risk score; clicking still opens the full card. On phones, tapping opens the full card as before.

## Update 11: new tagline and Learn page
- New tagline everywhere: "Healthy streams, healthy communities." with the line "AI explains what it sees. You make the call." on the home page
- New Learn page (/learn): 8 plain-language guides (murky water, algae, trash, sewage, stagnant water and mosquitoes, pH, foam and oil, One Health), each with why it matters for people, animals and nature, how to spot it, what you can do, and how StreamLens checks it
- "What is this?" links on finding cards, "What is One Health?" on the risk card, and "Learn more" chips under "Why this score", all jumping to the right guide
- Navigation: Learn added to the sidebar and the phone tab bar (Methodology is linked from the Learn page on phones)

## Update 12: sample presets and Save as PDF
- Assess: three sample buttons (Polluted river, Clean stream, Algae stream) that load a matching demo photo with its field measurements, plus "Or try a random sample"
- Results: "Save as PDF" button creates a clean one-page A4 report (score, Human/Animal/Ecosystem, photo and heatmap, findings, why this score, field observations, data quality checks, limitations). Works on laptops and phones through the browser's print/save menu

## Update 13: trash rule tuned on real photos
- core/demo_mode.py: trash now also needs mixed colours in a small area (litter is many colours; ripples, sky and sparkles are one colour). Tested on the 12 demo photos: clean water, muddy water and algae photos no longer show false trash; both trash photos still do
- Assess presets pick the best-matching photo (Clean stream picks the cleanest clear_ photo)
