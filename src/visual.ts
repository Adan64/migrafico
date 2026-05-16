"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import embed, { Result } from "vega-embed";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { VisualFormattingSettingsModel } from "./settings";

interface BarDatum {
    category: string;
    value: number;
    formattedValue: string;
    index: number;
    selectionId: ISelectionId;
}

interface ComparisonDatum {
    x1: string;
    x2: string;
    val1: number;
    val2: number;
    maxVal: number;
    pct: number;
    direction: "up" | "down";
    label: string;
}

export class Visual implements IVisual {
    private container: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private vegaResult: Result | null = null;
    private selectionManager: ISelectionManager;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = document.createElement("div");
        this.container.className = "visual-container";
        options.element.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews[0]
        );

        const dataView = options.dataViews?.[0];
        const categorical = dataView?.categorical;
        const categories = categorical?.categories?.[0];
        const values = categorical?.values?.[0];

        // Manejo del estado sin datos
        if (!categorical || !categories || !values || !categories.values || !values.values || categories.values.length === 0 || values.values.length === 0) {
            // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
            this.container.innerHTML = `
                <div style="padding: 20px; text-align: center; font-family: 'Segoe UI', sans-serif; color: #777; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h3 style="margin-bottom: 8px;">Esperando datos</h3>
                    <p style="font-size: 14px; margin: 0;">Por favor, añade un campo en <b>Categoría</b> y un campo en <b>Valor</b> en el panel de datos.</p>
                </div>
            `;
            if (this.vegaResult) {
                this.vegaResult.view.finalize();
                this.vegaResult = null;
            }
            return;
        }

        // Extracción de opciones del panel de formato
        const dpCard = this.formattingSettings.dataPointCard;
        const barColor = dpCard.barColor.value.value || "#4A90D9";
        const textColor = dpCard.textColor.value.value || "#444444";
        const positiveColor = dpCard.positiveColor.value.value || "#27ae60";
        const negativeColor = dpCard.negativeColor.value.value || "#e74c3c";
        const lineThickness = dpCard.lineThickness.value;
        const lineStyle = dpCard.lineStyle.value.value as string;
        const symbolStyle = dpCard.symbolStyle.value.value as string;
        const alternateColors = dpCard.alternateColors.value;
        const alternateBarColor = dpCard.alternateBarColor.value.value || "#85C1E9";
        const showBrackets = dpCard.showBrackets.value;
        const fontSize = dpCard.fontSize.value;
        const showFullNumbers = dpCard.showFullNumbers.value;

        const formatNumber = (num: number, full: boolean) => {
            if (full) return num.toLocaleString();
            if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + "M";
            if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "k";
            return num.toString();
        };

        const bars: BarDatum[] = categories.values
            .map((cat, i) => {
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories, i)
                    .createSelectionId();
                const val = Number(values.values[i]) || 0;
                return {
                    category: String(cat),
                    value: val,
                    formattedValue: formatNumber(val, showFullNumbers),
                    index: i,
                    selectionId
                };
            })
            .filter(d => d.value !== null && !isNaN(d.value));

        const comparisons: ComparisonDatum[] = [];
        for (let i = 1; i < bars.length; i++) {
            const prev = bars[i - 1].value;
            const curr = bars[i].value;
            const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
            
            let prefix = "";
            if (symbolStyle === "arrows") prefix = pct >= 0 ? "▲" : "▼";
            else if (symbolStyle === "signs") prefix = pct >= 0 ? "+" : "-";
            else if (symbolStyle === "arrows_thin") prefix = pct >= 0 ? "↑" : "↓";

            comparisons.push({
                x1: bars[i - 1].category,
                x2: bars[i].category,
                val1: prev,
                val2: curr,
                maxVal: Math.max(prev, curr),
                pct,
                direction: pct >= 0 ? "up" : "down",
                label: `${prefix} ${Math.abs(pct).toFixed(0)}%`
            });
        }

        // Restamos unos pocos píxeles para asegurar que no salgan barras de desplazamiento
        const w = Math.max(options.viewport.width - 10, 10);
        const h = Math.max(options.viewport.height - 10, 10);
        const maxValue = Math.max(...bars.map(b => b.value));
        const yMax = maxValue > 0 ? maxValue * 1.35 : 10;

        // Actualización dinámica si el gráfico ya existe
        if (this.vegaResult) {
            this.vegaResult.view
                .signal("width", w)
                .signal("height", h)
                .signal("barColor", barColor)
                .signal("textColor", textColor)
                .signal("positiveColor", positiveColor)
                .signal("negativeColor", negativeColor)
                .signal("lineThickness", lineThickness)
                .signal("lineStyle", lineStyle)
                .signal("alternateColors", alternateColors)
                .signal("alternateBarColor", alternateBarColor)
                .signal("showBrackets", showBrackets)
                .signal("fontSize", fontSize)
                .signal("showFullNumbers", showFullNumbers)
                .signal("yMax", yMax)
                .data("bars", bars)
                .data("comparisons", comparisons)
                .runAsync()
                .catch(console.error);
            return;
        }

        const spec = this.buildSpec(bars, comparisons, w, h, yMax, barColor, textColor, positiveColor, negativeColor, lineThickness, lineStyle, alternateColors, alternateBarColor, showBrackets, fontSize, showFullNumbers);
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        embed(this.container, spec as any, { actions: false, renderer: "svg" })
            .then(result => { 
                this.vegaResult = result; 
                result.view.addEventListener('click', (event, item) => {
                    if (item && item.datum && item.datum.selectionId) {
                        const selectionId = item.datum.selectionId as ISelectionId;
                        const multiSelect = (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).shiftKey;
                        this.selectionManager.select(selectionId, multiSelect);
                    } else {
                        this.selectionManager.clear();
                    }
                });
            })
            .catch(console.error);
    }

    private buildSpec(
        bars: BarDatum[],
        comparisons: ComparisonDatum[],
        width: number,
        height: number,
        yMax: number,
        barColor: string,
        textColor: string,
        positiveColor: string,
        negativeColor: string,
        lineThickness: number,
        lineStyle: string,
        alternateColors: boolean,
        alternateBarColor: string,
        showBrackets: boolean,
        fontSize: number,
        showFullNumbers: boolean
    ): object {
        return {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width: width,
            height: height,
            autosize: { type: "fit", contains: "padding" },
            padding: 5,
            background: null,

            signals: [
                { name: "barColor", value: barColor },
                { name: "textColor", value: textColor },
                { name: "positiveColor", value: positiveColor },
                { name: "negativeColor", value: negativeColor },
                { name: "lineThickness", value: lineThickness },
                { name: "lineStyle", value: lineStyle },
                { name: "alternateColors", value: alternateColors },
                { name: "alternateBarColor", value: alternateBarColor },
                { name: "showBrackets", value: showBrackets },
                { name: "fontSize", value: fontSize },
                { name: "showFullNumbers", value: showFullNumbers },
                { name: "yMax", value: yMax }
            ],

            data: [
                { name: "bars", values: bars },
                { name: "comparisons", values: comparisons }
            ],

            scales: [
                {
                    name: "x",
                    type: "band",
                    domain: { data: "bars", field: "category" },
                    range: "width",
                    paddingInner: 0.35,
                    paddingOuter: 0.15
                },
                {
                    name: "y",
                    type: "linear",
                    domain: [0, { signal: "yMax" }],
                    range: "height",
                    nice: true
                }
            ],

            axes: [
                {
                    orient: "bottom",
                    scale: "x",
                    domain: true,
                    domainColor: "#ccc",
                    ticks: false,
                    labelPadding: 8,
                    labelColor: "#555",
                    labelFontSize: 12,
                    labelFont: "Segoe UI, sans-serif",
                    labelAngle: -35,
                    labelOverlap: "greedy",
                    labelAlign: "right"
                },
                {
                    orient: "left",
                    scale: "y",
                    domain: false,
                    ticks: false,
                    grid: true,
                    gridDash: [3, 3],
                    gridColor: "#e8e8e8",
                    tickCount: 4,
                    labelColor: "#999",
                    labelFontSize: 11,
                    labelFont: "Segoe UI, sans-serif",
                    format: { signal: "showFullNumbers ? ',' : '~s'" }
                }
            ],

            marks: [
                // Barras
                {
                    type: "rect",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            cornerRadiusTopLeft: { value: 4 },
                            cornerRadiusTopRight: { value: 4 }
                        },
                        update: {
                            x: { scale: "x", field: "category" },
                            width: { scale: "x", band: 1 },
                            y: { scale: "y", field: "value" },
                            y2: { scale: "y", value: 0 },
                            fill: { signal: "alternateColors && (datum.index % 2 === 1) ? alternateBarColor : barColor" },
                            fillOpacity: { value: 1 },
                            tooltip: { signal: "{'Categoría': datum.category, 'Valor': datum.formattedValue}" }
                        },
                        hover: { fillOpacity: { value: 0.8 } }
                    }
                },

                // Línea horizontal del bracket entre barras
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {},
                        update: {
                            opacity: { signal: "showBrackets ? 1 : 0" },
                            strokeWidth: { signal: "lineThickness" },
                            strokeDash: { signal: "lineStyle === 'dashed' ? [6, 4] : lineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? positiveColor : negativeColor" }
                        }
                    }
                },

                // Línea vertical izquierda del bracket (toca la barra 1)
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {},
                        update: {
                            opacity: { signal: "showBrackets ? 1 : 0" },
                            strokeWidth: { signal: "lineThickness" },
                            strokeDash: { signal: "lineStyle === 'dashed' ? [6, 4] : lineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val1)" },
                            y2: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? positiveColor : negativeColor" }
                        }
                    }
                },

                // Línea vertical derecha del bracket (toca la barra 2)
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {},
                        update: {
                            opacity: { signal: "showBrackets ? 1 : 0" },
                            strokeWidth: { signal: "lineThickness" },
                            strokeDash: { signal: "lineStyle === 'dashed' ? [6, 4] : lineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val2)" },
                            y2: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? positiveColor : negativeColor" }
                        }
                    }
                },

                // Fondo blanco para la etiqueta de valor sobre cada barra (evita que la línea lo tache)
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            stroke: { value: "#ffffff" },
                            strokeWidth: { value: 4 },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            fontSize: { signal: "fontSize" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { scale: "y", field: "value", offset: -6 },
                            text: { field: "formattedValue" }
                        }
                    }
                },

                // Etiqueta de valor sobre cada barra
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            fontSize: { signal: "fontSize" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { scale: "y", field: "value", offset: -6 },
                            text: { field: "formattedValue" },
                            fill: { signal: "textColor" }
                        }
                    }
                },

                // Etiqueta de porcentaje (▲/▼ + %)
                {
                    type: "text",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            fontWeight: { value: "600" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            opacity: { signal: "showBrackets ? 1 : 0" },
                            fontSize: { signal: "fontSize" },
                            x: {
                                signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2"
                            },
                            y: { signal: "scale('y', datum.maxVal) - 40" },
                            text: { field: "label" },
                            fill: { signal: "datum.direction === 'up' ? positiveColor : negativeColor" }
                        }
                    }
                }
            ]
        };
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
