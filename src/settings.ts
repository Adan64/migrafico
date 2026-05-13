"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class DataPointCardSettings extends FormattingSettingsCard {
    barColor = new formattingSettings.ColorPicker({
        name: "barColor",
        displayName: "Bar color",
        value: { value: "#4A90D9" }
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Text color",
        value: { value: "#444444" }
    });

    positiveColor = new formattingSettings.ColorPicker({
        name: "positiveColor",
        displayName: "Positive bracket color",
        value: { value: "#27ae60" }
    });

    negativeColor = new formattingSettings.ColorPicker({
        name: "negativeColor",
        displayName: "Negative bracket color",
        value: { value: "#e74c3c" }
    });

    name: string = "dataPoint";
    displayName: string = "Data colors";
    slices: Array<FormattingSettingsSlice> = [this.barColor, this.textColor, this.positiveColor, this.negativeColor];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dataPointCard = new DataPointCardSettings();
    cards = [this.dataPointCard];
}
