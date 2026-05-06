# User Guide – Codex KPI Sparkline Card

## Overview
A clean KPI card with optional target comparison and sparkline trend. Displays a primary value (numeric or text) with a target indicator and a small sparkline showing historical trend.

## 1. Adding the Visual
1. Import the `.pbiviz` file into Power BI Desktop
2. Locate the visual in the Visualizations pane
3. Drag it onto the report canvas

## 2. Data Binding
- **Value** (Required): Primary metric to display (numeric or text). This is the main KPI value.
- **Target** (Optional): Target value for comparison (numeric). If bound, shows a delta indicator.
- **Sparkline Values** (Optional): Numeric values for the sparkline trend (e.g., historical values).
- **Sparkline Category** (Optional): Category for the sparkline values (e.g., time periods). Each unique value creates a point in the sparkline.
- **Sort Order** (Optional): Numeric value to control the order of sparkline points (ascending). If bound, points are sorted by this value.

## 3. Formatting Options
**Value Card**
- Font Size: Size of the value text.
- Value Color: Colour of the value text.
- Label Color: Colour of the label text.
- Background Color: Background colour of the card.
- Display Units: Units for numeric values (e.g., 0 for none, 1 for thousands, 2 for millions).
- Decimal Places: Number of decimal places for numeric values.
- Show Label: Toggle display of the label above the value.
- Label Text: Custom label text (defaults to the measure name).
- Value Alignment: Horizontal alignment of the value (left, center, right).
- Label Alignment: Horizontal alignment of the label (left, center, right).

**Target Card**
- Show Target: Toggle visibility of the target delta indicator.
- Positive Color: Colour when the value is above or equal to target (good).
- Negative Color: Colour when the value is below target (bad).
- Variance Type: How to show the variance: Percentage, Absolute, or Both.
- Target Alignment: Horizontal alignment of the delta text (left, center, right).

**Sparkline Card**
- Show Sparkline: Toggle visibility of the sparkline.
- Sparkline Color: Colour of the sparkline line and area.
- Line Width: Thickness of the sparkline line (px).
- Show Area: Toggle fill area under the sparkline line.
- Show Axis Labels: Toggle display of category labels below the sparkline (if sparkline category bound).

## 4. Features
- Displays a primary KPI value with optional label.
- Optional target comparison showing variance as an arrow and percentage/absolute.
- Optional sparkline trend showing historical values.
- Tooltips on hover showing value, target, variance, and sparkline points.
- Click the card to cross-filter other visuals by the sparkline category (if bound).
- Right-click for context menu.
- Supports high contrast mode and keyboard navigation.
- Responsive font scaling for narrow containers.
- Sparkline can show line only or line with area fill.
- Sparkline axis labels can show categories (if bound).

## 5. Limitations
- Only the first row of data is used for the Value and Target fields (additional rows are ignored).
- Sparkline requires both Sparkline Values and Sparkline Category to be bound to display; otherwise, no sparkline is shown.
- Sparkline Values must be numeric; non-numeric values are treated as zero.
- Sparkline Category must be text; non-text values are converted to string.
- Sort Order must be numeric; non-numeric values are placed at the end.
- The visual does not support drill-through or hierarchical categories.
- The sparkline is limited to the first 30,000 points (data reduction limit).

## 6. Support
For help or questions, visit https://nexuscodex.nexus/support