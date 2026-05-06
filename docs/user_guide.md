# User Guide: pbiKpiCard

## Adding the Visual
1. In Power BI Desktop, navigate to the Visualizations pane.
2. Click the three dots (⋯) and select "Get more visuals".
3. Search for "pbiKpiCard" or "Codex KPI Sparkline Card".
4. Select the visual and click "Add".
5. The visual icon will appear in the Visualizations pane. Click it to add an instance to your report.

## Data Binding
The visual supports the following data fields (drag fields from the Fields pane to these wells):

| Field Name | Type | Required? | Description |
|------------|------|-----------|-------------|
| Value | Measure | Yes (numeric or text) | The primary KPI value to display (e.g. 23, 87.3%, $14,100, "Status"). Can be numeric or text. |
| Target | Measure | No (numeric) | Target value for comparison (e.g. 100, 0.9). Must be numeric. |
| Sparkline Values | Measure | No (numeric) | Numeric values for the sparkline trend chart (e.g. daily values over time). |
| Sparkline Category | Grouping | No | Category for the sparkline (e.g. Date, Month). Provides the X-axis for the sparkline. |
| Sort Order | Measure | No (numeric) | Numeric value to control the sort order of sparkline data points (ascending). |

**Note**: At least the Value field must be bound to display a KPI. If Value is text, the Target, Sparkline Values, and Sort Order fields are ignored (as they require numeric data).

## Formatting Options
The visual provides extensive formatting options in the Format pane:

### Value Card
- **Font Size**: Size of the value text in pixels.
- **Value Color**: Color of the value text.
- **Label Color**: Color of the label text (above the value).
- **Background Color**: Background color of the card (transparent in high contrast mode).
- **Display Units**: Units for displaying large numbers (e.g., 0, Thousands, Millions, Billions).
- **Decimal Places**: Number of decimal places to show for numeric values.
- **Show Label**: Toggle to display the label above the value.
- **Label Text**: Custom label text (overrides the field name if set).
- **Value Alignment**: Horizontal alignment of the value (Left, Center, Right).
- **Label Alignment**: Horizontal alignment of the label (Left, Center, Right).

### Target Card
- **Show Target**: Toggle to display the target comparison.
- **Positive Color**: Color for the delta when value is above target.
- **Negative Color**: Color for the delta when value is below target.
- **Variance Type**: How to display the difference:
  - *Percentage*: Shows difference as a percentage (e.g., +5.2%).
  - *Absolute*: Shows difference in the same units as the value (e.g., +5.2).
  - *Both*: Shows both absolute and percentage (e.g., +5.2 (+5.2%)).
- **Target Alignment**: Horizontal alignment of the delta (Left, Center, Right).

### Sparkline Card
- **Show Sparkline**: Toggle to display the sparkline trend chart.
- **Sparkline Color**: Color of the sparkline line/area.
- **Sparkline Type**: Chart type for the sparkline:
  - *Line*: Line chart.
  - *Area*: Area chart (filled under the line).
  - *Bar*: Bar chart.
- **Line Width**: Width of the sparkline line in pixels.
- **Show Dot**: Toggle to show a dot on the last data point.
- **Dot Color**: Color of the dot on the last data point.

## Features
- **Flexible Value Display**: Shows numeric values (with formatting) or text values as the primary KPI.
- **Target Comparison**: Optionally shows how the value compares to a target with color-coded delta (▲ for increase, ▼ for decrease).
- **Sparkline Trend**: Optionally displays a mini trend chart showing historical values.
- **Cross-Filtering**: Clicking the visual filters other visuals by the measure value (if Value is bound and numeric).
- **Context Menu**: Right-click the visual to access the standard Power BI context menu (e.g., Sort, Export data).
- **Tooltips**: Hover over the visual to see a tooltip with the value, target (if bound), and variance.
- **High Contrast Mode**: Automatically adapts to Windows high contrast settings for improved accessibility.
- **Responsive Design**: Value font size adjusts slightly in very narrow containers to prevent overflow.
- **Text Support**: Can display text values (e.g., status labels) when the Value field contains non-numeric data.
- **Sorting**: Bind a Sort Order field to control the order of points in the sparkline (ascending).

## Limitations
- The Value field supports only a single value (first row if multiple rows are bound).
- The Target field must be numeric and supports only a single value.
- The Sparkline Values field must be numeric and supports multiple values (for the trend chart).
- The Sparkline Category field, if bound, must have the same granularity as Sparkline Values.
- The visual does not support drill-through or drill-down.
- The visual does not support conditional formatting via data fields.
- The Sort Order field only supports ascending order; descending order is not supported.
- When Value is text, the Target, Sparkline Values, and Sort Order fields are ignored (as they require numeric data).

## Known Issues
None reported.

## Support URL
For support, visit: https://nexuscodex.nexus/support