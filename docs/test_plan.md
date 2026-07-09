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