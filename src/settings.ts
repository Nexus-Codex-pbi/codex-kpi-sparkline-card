"use strict";

import powerbi from "powerbi-visuals-api";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { BackgroundSettings } from "./shared/backgroundSettings";
import { TitleSettings } from "./shared/titleSettings";
import { alignSlice, alignSelfFor, textAlignFor } from "./shared/textFormatting";
import { CardSignatureSettings } from "./shared/cardSignatureSettings";
import { BorderSettings } from "./shared/borderSettings";

// Alignment helpers + TitleSettings now live in _shared/formatting/ (D-13,
// D-14 — Plan 10 pilot). Re-exported here so visual.ts can import them
// from "./settings" (mirrors pbiKpiCard's shape).
export { TitleSettings, alignSelfFor, textAlignFor };

const ConstantOrRule = powerbi.VisualEnumerationInstanceKinds.ConstantOrRule;

class ValueCardSettings extends FormattingSettingsCard {
    // Value text — FontControl composite reuses the existing bare
    // "fontSize" property name (D-06/D-07: additive-only, no schema
    // rename) alongside NEW sibling properties (family/bold/italic/
    // underline). Bold defaults true to match the pre-existing hardcoded
    // font-weight:700 on .kpi-value (style/visual.less) — weightFor idiom
    // in visual.ts, matching pbiVarianceWaterfall/pbiNowVsThen precedent.
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        description: "Size of the KPI value text",
        value: 32
    });

    fontFamily = new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font Family", value: "Segoe UI, sans-serif" });
    bold = new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", value: true });
    italic = new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", value: false });
    underline = new formattingSettings.ToggleSwitch({ name: "underline", displayName: "Underline", value: false });

    valueFont = new formattingSettings.FontControl({
        name: "valueFont", displayName: "Font",
        fontFamily: this.fontFamily, fontSize: this.fontSize,
        bold: this.bold, italic: this.italic, underline: this.underline,
    });

    valueColor = new formattingSettings.ColorPicker({
        name: "valueColor",
        displayName: "Value Color",
        value: { value: "#333333" },
        instanceKind: ConstantOrRule
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Label Color",
        value: { value: "#767676" },
        instanceKind: ConstantOrRule
    });

    // Label text had NO pre-existing font-size control (CSS-only,
    // .kpi-label hardcoded 12px/weight:600) — brand-new dedicated Font
    // composite, Font Size defaulting to the value that reproduces the
    // prior CSS-derived size exactly (matches 01-11/01-12 precedent for a
    // surface with no independent control before this plan).
    labelFontFamily = new formattingSettings.FontPicker({ name: "labelFontFamily", displayName: "Label Font Family", value: "Segoe UI, sans-serif" });
    labelFontSize = new formattingSettings.NumUpDown({ name: "labelFontSize", displayName: "Label Font Size", value: 12 });
    labelBold = new formattingSettings.ToggleSwitch({ name: "labelBold", displayName: "Label Bold", value: true });
    labelItalic = new formattingSettings.ToggleSwitch({ name: "labelItalic", displayName: "Label Italic", value: false });
    labelUnderline = new formattingSettings.ToggleSwitch({ name: "labelUnderline", displayName: "Label Underline", value: false });

    labelFont = new formattingSettings.FontControl({
        name: "labelFont", displayName: "Label Font",
        fontFamily: this.labelFontFamily, fontSize: this.labelFontSize,
        bold: this.labelBold, italic: this.labelItalic, underline: this.labelUnderline,
    });

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background Color",
        value: { value: "#FFFFFF" },
        instanceKind: ConstantOrRule
    });

    displayUnits = new formattingSettings.ItemDropdown({
        name: "displayUnits",
        displayName: "Display Units",
        items: [
            { displayName: "Auto", value: "auto" },
            { displayName: "None", value: "none" },
            { displayName: "Thousands (K)", value: "thousands" },
            { displayName: "Millions (M)", value: "millions" },
            { displayName: "Billions (B)", value: "billions" }
        ],
        value: { displayName: "Auto", value: "auto" }
    });

    decimalPlaces = new formattingSettings.NumUpDown({
        name: "decimalPlaces",
        displayName: "Decimal Places",
        value: 1
    });

    showLabel = new formattingSettings.ToggleSwitch({
        name: "showLabel",
        displayName: "Show Label",
        value: true
    });

    labelText = new formattingSettings.TextInput({
        name: "labelText",
        displayName: "Label Text",
        description: "Custom label text (leave blank to use field name)",
        placeholder: "",
        value: ""
    });

    valueAlign = alignSlice("valueAlign", "center");
    labelAlign = alignSlice("labelAlign", "center");

    name: string = "valueCard";
    displayName: string = "Value";
    slices: Array<FormattingSettingsSlice> = [
        this.valueFont,
        this.valueColor,
        this.labelFont,
        this.labelColor,
        // this.backgroundColor — HIDDEN from the pane (Neil 2026-07-14: "2
        // background settings"). This legacy Value-card background is dead
        // (no longer read at render; the shared Background card governs the
        // card fill). Property stays DECLARED in capabilities so old saved
        // reports that reference it don't break, but it's removed from the
        // slices so only one Background control shows.
        this.displayUnits,
        this.decimalPlaces,
        this.showLabel,
        this.labelText,
        this.valueAlign,
        this.labelAlign
    ];
}

class TargetCardSettings extends FormattingSettingsCard {
    showTarget = new formattingSettings.ToggleSwitch({
        name: "showTarget",
        displayName: "Show Target",
        value: true
    });

    positiveColor = new formattingSettings.ColorPicker({
        name: "positiveColor",
        displayName: "Positive Color",
        value: { value: "#107C10" },
        instanceKind: ConstantOrRule
    });

    negativeColor = new formattingSettings.ColorPicker({
        name: "negativeColor",
        displayName: "Negative Color",
        value: { value: "#D13438" },
        instanceKind: ConstantOrRule
    });

    varianceType = new formattingSettings.ItemDropdown({
        name: "varianceType",
        displayName: "Variance Display",
        items: [
            { displayName: "Percentage", value: "percentage" },
            { displayName: "Absolute", value: "absolute" },
            { displayName: "Both", value: "both" }
        ],
        value: { displayName: "Percentage", value: "percentage" }
    });

    // Delta/change readout (rendered into .kpi-delta) had NO pre-existing
    // font-size control (CSS-only, hardcoded 13px/weight:600) — brand-new
    // dedicated Font composite, Font Size defaulting to the value that
    // reproduces the prior CSS-derived size exactly.
    deltaFontFamily = new formattingSettings.FontPicker({ name: "deltaFontFamily", displayName: "Delta Font Family", value: "Segoe UI, sans-serif" });
    deltaFontSize = new formattingSettings.NumUpDown({ name: "deltaFontSize", displayName: "Delta Font Size", value: 13 });
    deltaBold = new formattingSettings.ToggleSwitch({ name: "deltaBold", displayName: "Delta Bold", value: true });
    deltaItalic = new formattingSettings.ToggleSwitch({ name: "deltaItalic", displayName: "Delta Italic", value: false });
    deltaUnderline = new formattingSettings.ToggleSwitch({ name: "deltaUnderline", displayName: "Delta Underline", value: false });

    deltaFont = new formattingSettings.FontControl({
        name: "deltaFont", displayName: "Delta Font",
        fontFamily: this.deltaFontFamily, fontSize: this.deltaFontSize,
        bold: this.deltaBold, italic: this.deltaItalic, underline: this.deltaUnderline,
    });

    targetAlign = alignSlice("targetAlign", "center");

    name: string = "targetCard";
    displayName: string = "Target";
    slices: Array<FormattingSettingsSlice> = [
        this.showTarget,
        this.positiveColor,
        this.negativeColor,
        this.varianceType,
        this.deltaFont,
        this.targetAlign
    ];
}

class SparklineCardSettings extends FormattingSettingsCard {
    showSparkline = new formattingSettings.ToggleSwitch({
        name: "showSparkline",
        displayName: "Show Sparkline",
        value: true
    });

    sparklineColor = new formattingSettings.ColorPicker({
        name: "sparklineColor",
        displayName: "Line Color",
        value: { value: "#0078D4" },
        instanceKind: ConstantOrRule
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayName: "Line Width",
        value: 2
    });

    // v2 board look (Plan 16): the "soft area fill under the line" is now
    // part of the unified spark grammar shared with Sparkline Table (see
    // Suite Enhancement Audit) — default flips true (this pre-existing
    // toggle previously defaulted OFF). Still fully honoured either way:
    // an explicit false is a real per-visual choice, an untouched
    // property now ships the new default look (D-16 — same "new default,
    // still-overridable toggle" precedent as every other v2 batch visual).
    showArea = new formattingSettings.ToggleSwitch({
        name: "showArea",
        displayName: "Show Area Fill",
        value: true
    });

    showAxisLabels = new formattingSettings.ToggleSwitch({
        name: "showAxisLabels",
        displayName: "Show Axis Labels",
        description: "Show first and last category labels below the sparkline",
        value: false
    });

    name: string = "sparklineCard";
    displayName: string = "Sparkline";
    slices: Array<FormattingSettingsSlice> = [
        this.showSparkline,
        this.sparklineColor,
        this.lineWidth,
        this.showArea,
        this.showAxisLabels
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    cardSignature = new CardSignatureSettings();
    titleSettings = new TitleSettings();
    valueCardSettings = new ValueCardSettings();
    targetCardSettings = new TargetCardSettings();
    sparklineCardSettings = new SparklineCardSettings();
    background = new BackgroundSettings();
    visualBorder = new BorderSettings();

    // No transparency-default override here (unlike most of this batch):
    // pbiKpiSparklineCard's PRE-EXISTING default was a genuine opaque-white
    // paint — `this.container.style.backgroundColor` is set unconditionally
    // on every update() call (before any data-presence check), reading
    // `valueCardSettings.backgroundColor` (default "#FFFFFF"). The shared
    // Background card's own default (opaque white, transparency 0) is
    // pixel-identical to that pre-existing behaviour, so the raw shared
    // default is correct as-is (D-06) — confirmed via direct code
    // inspection of src/visual.ts's update(), not assumed.
    cards = [this.titleSettings, this.valueCardSettings, this.targetCardSettings, this.sparklineCardSettings, this.background,
        this.cardSignature, this.visualBorder
    ];
}
