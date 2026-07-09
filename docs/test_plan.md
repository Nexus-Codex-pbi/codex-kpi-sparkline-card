# Test Plan – Codex KPI Sparkline Card

## 1. Functional Tests
- [ ] Visual loads without errors
- [ ] Visual renders with sample data (value, target, sparkline)
- [ ] Visual handles empty data gracefully (shows empty state)
- [ ] All format pane options apply correctly (value card, target card, sparkline card)
- [ ] Selection / cross-filter works (when sparklineCategory bound, clicking card filters other visuals)
- [ ] Tooltips appear on hover (showing value, target, variance, and sparkline points)
- [ ] Context menu appears on right-click

## 2. Performance Tests
- [ ] update() completes < 250ms with sample data
- [ ] No memory leaks (test with repeated updates)
- [ ] Bundle size < 2.5 MB

## 3. Accessibility Tests
- [ ] Keyboard navigation works (tab to visual, Enter/Space triggers click/context menu)
- [ ] High contrast mode supported (colors adapt to theme)
- [ ] ARIA labels present (on container for click and context menu)
- [ ] No flashing content

## 4. Security Tests
- [ ] No external network calls (verify no network traffic in dev tools)
- [ ] No telemetry (no calls to external endpoints)
- [ ] No external scripts or fonts (all resources bundled)
- [ ] No DOM escape or eval (check code for unsafe patterns)

## 5. Packaging Tests
- [ ] pbiviz builds successfully (npm install && pbiviz package)
- [ ] Bundle size < 2.5 MB
- [ ] capabilities.json valid (passes schema validation)

## 6. Sample PBIX Verification
- [ ] Demonstrates all features (value, target delta, sparkline with area, axis labels)
- [ ] Demonstrates formatting options (all format pane sections)
- [ ] Demonstrates interactions (click-to-filter, context menu, tooltips)

## 7. Background Transparency (TRANS-01, Phase 1 Plan 06)
- [ ] Format pane → Background card: set a non-white colour, drag Transparency 0 → 50 → 100 over a NON-WHITE report canvas
- [ ] Transparency 0%: card renders fully opaque
- [ ] Transparency 50%: card blends visibly with the canvas behind it, no opaque halo/box around the visual edges
- [ ] Transparency 100%: canvas shows through cleanly, card content (value/label/sparkline) remains legible
- [ ] Repeat on both light and dark report themes — high contrast mode still renders "transparent" (system-handled), not the new colour/transparency
- [ ] An old saved .pbix (pre-upgrade, Background properties absent) renders fully opaque white/unchanged — no regression (matches the pre-existing Value Card → Background Color default)

## 8. Conditional Formatting / fx (TRANS-04, Phase 1 Plan 06)
- [ ] Value Color swatch (Value card) shows a working fx button in the format pane
- [ ] Bind the Value measure, open the fx rule editor, set a rule (e.g. gradient by value)
- [ ] Card's value text colour changes according to the rule as the bound measure's value changes
- [ ] Removing the rule reverts to the static Value Color swatch setting

## 9. Visual Title (TITLE-01, Phase 1 Plan 13)
- [ ] Title card appears in the format pane ("Visual Title") with Show Title (off by default), Title Text, Font, Alignment, Font Color
- [ ] Show Title off (default) renders no title — old saved report (no title properties set) is pixel-identical to pre-upgrade (D-06)
- [ ] Show Title on + Title Text set renders the title above the label/value/delta/sparkline stack
- [ ] Title does not render on the empty/landing-page state (no measure bound) — matches the pbiKpiCard exemplar's scope (title only appears once real data renders)
- [ ] Title Font (family/size/bold/italic/underline) and Alignment (left/center/right) apply correctly
- [ ] Title Font Color applies; high contrast mode overrides to the theme foreground colour

## 10. Per-Surface Text Treatment (TEXT-01, Phase 1 Plan 13)
- [ ] Value card: new Font control (Family/Bold/Italic/Underline, reusing existing Font Size) applies to the KPI value text; Bold on (default) renders the pre-existing font-weight 700
- [ ] Value card: new Label Font control (brand-new Font Size, previously CSS-only 12px) applies to the label text; Bold on (default) matches the pre-existing CSS font-weight 600 (weightFor idiom: bold-on renders 700, a documented negligible visual increase consistent with the pbiVarianceWaterfall/pbiNowVsThen precedent)
- [ ] Target card: new Delta Font control (brand-new Font Size, previously CSS-only 13px) applies to the change/delta readout text
- [ ] Value/Label/Target Alignment controls (converted to the shared `alignSlice` helper, defaults unchanged at "center") continue to apply alignSelf + text-align to their respective surfaces
- [ ] Positive/Negative Color logic on the delta readout is unaffected by the new font treatment

## 11. Text-Colour fx (TEXT-02, Phase 1 Plan 13 — carried forward from Plan 06)
- [ ] Value Color fx (wired in Plan 06) continues to work unchanged after this plan's font/title additions

## 12. Render-Nothing Defaults (D-06)
- [ ] Old saved report with none of the new title/font/alignment properties set renders pixel-identical to pre-upgrade: no title, value at weight 700, label at effective weight 700 (from 600, per the documented weightFor idiom), delta at effective weight 700 (from 600), all at prior default sizes/colours/positions

## 13. Known Pre-Existing Issue (out of scope, logged to deferred-items.md)
- [ ] `npx pbiviz package` logs a non-fatal `ENOENT: en-US/resources.resjson` error during localization packaging; build still completes successfully (`Package created!`, exit code 0). Not caused by this plan's changes — reproduces on a fresh `npm install` alone (no `en-US/` directory exists in the repo at all).