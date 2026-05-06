# Test Plan for pbiKpiCard

## Functional Tests
### Rendering
- [ ] Renders correctly when only Measure field is bound (numeric value)
- [ ] Renders correctly when Measure field is bound (text value)
- [ ] Renders correctly when Measure and Target fields are bound (numeric)
- [ ] Renders correctly when Measure, Target, and Sparkline Values fields are bound
- [ ] Renders correctly when all fields are bound (Measure, Target, Sparkline Values, Sparkline Category, Sort Order)
- [ ] Displays empty state when no data bound or Measure is null
- [ ] Handles numeric values (integers, decimals) correctly
- [ ] Handles percentage values correctly (when format set to Percent via display units)
- [ ] Handles currency values correctly (when format set to Currency via display units)
- [ ] Handles text values correctly (when Measure contains non-numeric data)
- [ ] Renders sparkline when Sparkline Values and Sparkline Category are bound
- [ ] Hides sparkline when Show Sparkline is disabled
- [ ] Shows/hides target delta based on Show Target setting
- [ ] Changes delta color based on positive/negative variance
- [ ] Changes delta format based on Variance Type (Percentage, Absolute, Both)
- [ ] Renders label when Show Label is enabled
- [ ] Uses custom label text when Label Text is set
- [ ] Applies background color (except in high contrast mode)
- [ ] Respects value alignment (left, center, right)
- [ ] Respects label alignment (left, center, right)
- [ ] Applies responsive font scaling in narrow containers (<200px width)

### Formatting
- [ ] Value Card: Font size updates correctly
- [ ] Value Card: Value color updates correctly
- [ ] Value Card: Label color updates correctly
- [ ] Value Card: Background color updates correctly (not in high contrast)
- [ ] Value Card: Display units setting affects numeric display
- [ ] Value Card: Decimal places setting affects numeric display
- [ ] Value Card: Show/hide label works correctly
- [ ] Value Card: Label text updates when changed
- [ ] Value Card: Value alignment (left, center, right) works correctly
- [ ] Value Card: Label alignment (left, center, right) works correctly
- [ ] Target Card: Show/hide target works correctly
- [ ] Target Card: Positive color updates correctly
- [ ] Target Card: Negative color updates correctly
- [ ] Target Card: Variance type (Percentage, Absolute, Both) changes delta display
- [ ] Target Card: Target alignment (left, center, right) works correctly
- [ ] Sparkline Card: Show/hide sparkline works correctly
- [ ] Sparkline Card: Sparkline color updates correctly
- [ ] Sparkline Card: Line width updates correctly
- [ ] Sparkline Card: Show area toggle works correctly
- [ ] Sparkline Card: Show axis labels toggle works correctly

### Interactions
- [ ] Tooltip appears on hover when visual has data (shows measure name, value, target, variance)
- [ ] Tooltip hides on mouse leave
- [ ] Context menu appears on right-click (standard Power BI context menu)
- [ ] Click-to-filter: When Measure is bound and numeric, clicking visual filters other visuals by that measure value
- [ ] Click-to-filter: When Measure is text, clicking visual does not filter (no-op)
- [ ] Click-to-filter: Ctrl/Cmd-click enables multi-select filtering
- [ ] Visual selection: Visual can be selected (single click) and shows selection border
- [ ] Multi-visual selection: Visual can be part of group selection (Ctrl/Cmd-click)
- [ ] Highlighting: Visual responds to highlighting from other visuals (if supported)
- [ ] Responsive font scaling: Value text scales down in narrow containers (<120px width)
- [ ] Responsive font scaling: Value text scales moderately in medium containers (120-200px width)
- [ ] Responsive font scaling: Value text uses set size in wide containers (>200px width)

## Performance Tests
- [ ] Visual renders within 100ms for typical data updates
- [ ] Visual maintains smooth interaction (hover, click) at 60fps
- [ ] Memory usage does not grow with repeated updates (no leaks)
- [ ] Visual handles rapid sequential updates (e.g., from slicer) without stutter
- [ ] Sparkline rendering completes within acceptable time for reasonable data points (<1000)
- [ ] DOM element count remains stable after initial render (no excessive recreation)

## Accessibility Tests
- [ ] Keyboard Navigation
  - [ ] Visual is focusable via Tab key
  - [ ] Enter key activates click (filter if Measure bound and numeric)
  - [ ] Space bar activates click (filter if Measure bound and numeric)
  - [ ] Shift+F10 or context menu key opens context menu
  - [ ] Focus outline is visible when focused
- [ ] High Contrast Mode
  - [ ] Background becomes transparent in high contrast mode
  - [ ] Text uses system foreground color for readability
  - [ ] Sparkline uses system foreground color for lines/points
  - [ ] All text remains readable in high contrast mode
  - [ ] Visual functions correctly when Windows high contrast enabled
- [ ] Screen Reader
  - [ ] All text content (label, value, delta) is accessible to screen readers
  - [ ] Delta conveys information via both color and symbol (▲/▼)
  - [ ] Visual announces as a logical unit (label, value, delta)
  - [ ] Tooltip provides additional details on hover/focus
- [ ] Color Usage
  - [ ] Visual does not rely solely on color to convey information
  - [ ] Delta uses both color and arrow symbol to indicate direction
  - [ ] Sufficient contrast between text and background in default themes
- [ ] Text Scaling
  - [ ] Visual respects browser/text scaling settings
  - [ ] Font sizes scale appropriately with system settings
  - [ ] No text clipping or overflow at larger text sizes

## Security Tests
- [ ] No external network requests are made (verify via browser dev tools)
- [ ] No telemetry data is collected or transmitted
- [ ] Visual does not use eval(), Function(), or similar dynamic code
- [ ] Visual does not use innerHTML or outerHTML for DOM injection
- [ ] All data binding uses textContent or safe DOM APIs
- [ ] Visual does not access localStorage, sessionStorage, or cookies
- [ ] Visual does not request additional privileges (privileges array empty)
- [ ] Visual only uses approved dependencies (powerbi-visuals-api, powerbi-visuals-utils-formattingmodel, d3-scale, d3-shape)

## Packaging Tests
- [ ] pbiviz.json validates against schema (pbiviz validate)
- [ ] All referenced assets (icon, style, string resources) exist
- [ ] capabilities.json is valid JSON and matches visual implementation
- [ ] Visual packages successfully (pbiviz package)
- [ ] Generated .pbiviz file contains correct resources
- [ ] Visual version in pbiviz.json matches expected version
- [ ] Visual description and display name are present

## Sample PBIX Verification
- [ ] Sample PBIX report loads visual without errors
- [ ] Sample PBIX demonstrates all data roles (Measure, Target, Sparkline Values, Sparkline Category, Sort Order)
- [ ] Sample PBIX demonstrates formatting options (value card, target card, sparkline card)
- [ ] Sample PBIX demonstrates click-to-filter functionality
- [ ] Sample PBIX demonstrates tooltip on hover
- [ ] Sample PBIX demonstrates context menu
- [ ] Sample PBIX demonstrates high contrast mode
- [ ] Sample PBIX demonstrates keyboard navigation
- [ ] Sample PBIX saves and reloads correctly (visual state preserved)