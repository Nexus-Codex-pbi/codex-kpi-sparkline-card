"use strict";

import powerbi from "powerbi-visuals-api";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { BackgroundSettings } from "../../_shared/formatting/backgroundSettings";

const ConstantOrRule = powerbi.VisualEnumerationInstanceKinds.ConstantOrRule;

class ValueCardSettings extends FormattingSettingsCard {
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        description: "Size of the KPI value text",
        value: 32
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

    valueAlign = new formattingSettings.AlignmentGroup({
        name: "valueAlign",
        displayName: "Value Alignment",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
        value: "center"
    });

    labelAlign = new formattingSettings.AlignmentGroup({
        name: "labelAlign",
        displayName: "Label Alignment",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
        value: "center"
    });

    name: string = "valueCard";
    displayName: string = "Value";
    slices: Array<FormattingSettingsSlice> = [
        this.fontSize,
        this.valueColor,
        this.labelColor,
        this.backgroundColor,
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

    targetAlign = new formattingSettings.AlignmentGroup({
        name: "targetAlign",
        displayName: "Target Alignment",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
        value: "center"
    });

    name: string = "targetCard";
    displayName: string = "Target";
    slices: Array<FormattingSettingsSlice> = [
        this.showTarget,
        this.positiveColor,
        this.negativeColor,
        this.varianceType,
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

    showArea = new formattingSettings.ToggleSwitch({
        name: "showArea",
        displayName: "Show Area Fill",
        value: false
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
    valueCardSettings = new ValueCardSettings();
    targetCardSettings = new TargetCardSettings();
    sparklineCardSettings = new SparklineCardSettings();
    background = new BackgroundSettings();

    // No transparency-default override here (unlike most of this batch):
    // pbiKpiSparklineCard's PRE-EXISTING default was a genuine opaque-white
    // paint — `this.container.style.backgroundColor` is set unconditionally
    // on every update() call (before any data-presence check), reading
    // `valueCardSettings.backgroundColor` (default "#FFFFFF"). The shared
    // Background card's own default (opaque white, transparency 0) is
    // pixel-identical to that pre-existing behaviour, so the raw shared
    // default is correct as-is (D-06) — confirmed via direct code
    // inspection of src/visual.ts's update(), not assumed.
    cards = [this.valueCardSettings, this.targetCardSettings, this.sparklineCardSettings, this.background];
}
