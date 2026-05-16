import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class XAxisSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    isBold: formattingSettings.ToggleSwitch;
    isItalic: formattingSettings.ToggleSwitch;
    labelAngle: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class YAxisSettings extends FormattingSettingsCard {
    showGridlines: formattingSettings.ToggleSwitch;
    gridlineStyle: formattingSettings.ItemDropdown;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class ColumnsSettings extends FormattingSettingsCard {
    barColor: formattingSettings.ColorPicker;
    alternateColors: formattingSettings.ToggleSwitch;
    alternateBarColor: formattingSettings.ColorPicker;
    padding: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class DataLabelsSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    isBold: formattingSettings.ToggleSwitch;
    isItalic: formattingSettings.ToggleSwitch;
    showFullNumbers: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class ComparisonsSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    positiveColor: formattingSettings.ColorPicker;
    negativeColor: formattingSettings.ColorPicker;
    lineThickness: formattingSettings.NumUpDown;
    lineStyle: formattingSettings.ItemDropdown;
    symbolStyle: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    xAxis: XAxisSettings;
    yAxis: YAxisSettings;
    columns: ColumnsSettings;
    dataLabels: DataLabelsSettings;
    comparisons: ComparisonsSettings;
    cards: (XAxisSettings | YAxisSettings | ColumnsSettings | DataLabelsSettings | ComparisonsSettings)[];
}
export {};
