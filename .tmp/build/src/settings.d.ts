import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class ValueCardSettings extends FormattingSettingsCard {
    fontSize: formattingSettings.NumUpDown;
    valueColor: formattingSettings.ColorPicker;
    labelColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    displayUnits: formattingSettings.ItemDropdown;
    decimalPlaces: formattingSettings.NumUpDown;
    showLabel: formattingSettings.ToggleSwitch;
    labelText: formattingSettings.TextInput;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class TargetCardSettings extends FormattingSettingsCard {
    showTarget: formattingSettings.ToggleSwitch;
    positiveColor: formattingSettings.ColorPicker;
    negativeColor: formattingSettings.ColorPicker;
    varianceType: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class SparklineCardSettings extends FormattingSettingsCard {
    showSparkline: formattingSettings.ToggleSwitch;
    sparklineColor: formattingSettings.ColorPicker;
    lineWidth: formattingSettings.NumUpDown;
    showArea: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    valueCardSettings: ValueCardSettings;
    targetCardSettings: TargetCardSettings;
    sparklineCardSettings: SparklineCardSettings;
    cards: (ValueCardSettings | TargetCardSettings | SparklineCardSettings)[];
}
export {};
