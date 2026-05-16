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

    lineThickness = new formattingSettings.NumUpDown({
        name: "lineThickness",
        displayName: "Grosor de líneas",
        value: 1.5
    });

    lineStyle = new formattingSettings.ItemDropdown({
        name: "lineStyle",
        displayName: "Estilo de líneas",
        items: [
            { value: "solid", displayName: "Sólida" },
            { value: "dashed", displayName: "Discontinua" },
            { value: "dotted", displayName: "Punteada" }
        ],
        value: { value: "solid", displayName: "Sólida" }
    });

    symbolStyle = new formattingSettings.ItemDropdown({
        name: "symbolStyle",
        displayName: "Estilo de símbolo",
        items: [
            { value: "arrows", displayName: "▲ / ▼" },
            { value: "signs", displayName: "+ / -" },
            { value: "arrows_thin", displayName: "↑ / ↓" }
        ],
        value: { value: "arrows", displayName: "▲ / ▼" }
    });

    alternateColors = new formattingSettings.ToggleSwitch({
        name: "alternateColors",
        displayName: "Alternar colores",
        value: false
    });

    alternateBarColor = new formattingSettings.ColorPicker({
        name: "alternateBarColor",
        displayName: "Color alterno",
        value: { value: "#85C1E9" }
    });

    showBrackets = new formattingSettings.ToggleSwitch({
        name: "showBrackets",
        displayName: "Mostrar comparaciones",
        value: true
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Tamaño de fuente",
        value: 11
    });

    showFullNumbers = new formattingSettings.ToggleSwitch({
        name: "showFullNumbers",
        displayName: "Mostrar números completos",
        value: false
    });

    name: string = "dataPoint";
    displayName: string = "Personalización avanzada";
    slices: Array<FormattingSettingsSlice> = [
        this.barColor, this.alternateColors, this.alternateBarColor,
        this.textColor, this.fontSize, this.showFullNumbers,
        this.showBrackets, this.positiveColor, this.negativeColor,
        this.lineThickness, this.lineStyle, this.symbolStyle
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dataPointCard = new DataPointCardSettings();
    cards = [this.dataPointCard];
}
