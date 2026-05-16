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
        const xAxis = this.formattingSettings.xAxis;
        const yAxis = this.formattingSettings.yAxis;
        const columns = this.formattingSettings.columns;
        const dataLabels = this.formattingSettings.dataLabels;
        const comparisonsCard = this.formattingSettings.comparisons;

        const config = {
            xShow: xAxis.show.value,
            xFontColor: xAxis.fontColor.value.value || "#999999",
            xFontSize: xAxis.fontSize.value,
            xIsBold: xAxis.isBold.value,
            xIsItalic: xAxis.isItalic.value,
            xLabelAngle: xAxis.labelAngle.value,

            yShowGridlines: yAxis.showGridlines.value,
            yGridlineStyle: yAxis.gridlineStyle.value.value as string,
            yFontColor: yAxis.fontColor.value.value || "#999999",
            yFontSize: yAxis.fontSize.value,

            colBarColor: columns.barColor.value.value || "#4A90D9",
            colAlternateColors: columns.alternateColors.value,
            colAlternateBarColor: columns.alternateBarColor.value.value || "#85C1E9",
            colPadding: columns.padding.value / 100,

            lblShow: dataLabels.show.value,
            lblPosition: dataLabels.position.value.value as string,
            lblFontColor: dataLabels.fontColor.value.value || "#444444",
            lblFontSize: dataLabels.fontSize.value,
            lblIsBold: dataLabels.isBold.value,
            lblIsItalic: dataLabels.isItalic.value,
            lblShowFullNumbers: dataLabels.showFullNumbers.value,

            compShow: comparisonsCard.show.value,
            compPositiveColor: comparisonsCard.positiveColor.value.value || "#27ae60",
            compNegativeColor: comparisonsCard.negativeColor.value.value || "#e74c3c",
            compLineThickness: comparisonsCard.lineThickness.value,
            compLineStyle: comparisonsCard.lineStyle.value.value as string,
            compSymbolStyle: comparisonsCard.symbolStyle.value.value as string
        };

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
                    formattedValue: formatNumber(val, config.lblShowFullNumbers),
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
            if (config.compSymbolStyle === "arrows") prefix = pct >= 0 ? "▲" : "▼";
            else if (config.compSymbolStyle === "signs") prefix = pct >= 0 ? "+" : "-";
            else if (config.compSymbolStyle === "arrows_thin") prefix = pct >= 0 ? "↑" : "↓";

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
            const view = this.vegaResult.view;
            view.signal("width", w).signal("height", h).signal("yMax", yMax);
            for (const [key, value] of Object.entries(config)) {
                view.signal(key, value);
            }
            view.data("bars", bars).data("comparisons", comparisons).runAsync().catch(console.error);
            return;
        }

        const spec = this.buildSpec(bars, comparisons, w, h, yMax, config);
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
        config: any
    ): object {
        const signals: any[] = [
            { name: "yMax", value: yMax }
        ];
        for (const [key, value] of Object.entries(config)) {
            signals.push({ name: key, value });
        }

        return {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width: width,
            height: height,
            padding: 5,
            autosize: { type: "fit", contains: "padding" },
            signals: signals,

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
                    paddingInner: { signal: "colPadding" },
                    paddingOuter: 0.1
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
                    domainOpacity: { signal: "xShow ? 1 : 0" },
                    labelOpacity: { signal: "xShow ? 1 : 0" },
                    tickOpacity: { signal: "xShow ? 1 : 0" },
                    labelAngle: { signal: "xLabelAngle" },
                    labelOverlap: true,
                    labelColor: { signal: "xFontColor" },
                    labelFontSize: { signal: "xFontSize" },
                    labelFontWeight: { signal: "xIsBold ? 'bold' : 'normal'" },
                    labelFontStyle: { signal: "xIsItalic ? 'italic' : 'normal'" },
                    labelFont: "Segoe UI, sans-serif"
                },
                {
                    orient: "left",
                    scale: "y",
                    grid: true,
                    gridOpacity: { signal: "yShowGridlines ? 1 : 0" },
                    gridDash: { signal: "yGridlineStyle === 'dashed' ? [6, 4] : yGridlineStyle === 'dotted' ? [2, 3] : []" },
                    gridColor: "#eee",
                    tickCount: 4,
                    labelColor: { signal: "yFontColor" },
                    labelFontSize: { signal: "yFontSize" },
                    labelFont: "Segoe UI, sans-serif",
                    format: { signal: "lblShowFullNumbers ? ',' : '~s'" }
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
                            fill: { signal: "colAlternateColors && (datum.index % 2 === 1) ? colAlternateBarColor : colBarColor" },
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
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: "compLineStyle === 'dashed' ? [6, 4] : compLineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? compPositiveColor : compNegativeColor" }
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
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: "compLineStyle === 'dashed' ? [6, 4] : compLineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val1)" },
                            y2: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? compPositiveColor : compNegativeColor" }
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
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: "compLineStyle === 'dashed' ? [6, 4] : compLineStyle === 'dotted' ? [2, 3] : []" },
                            x: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val2)" },
                            y2: { signal: "scale('y', datum.maxVal) - 35" },
                            stroke: { signal: "datum.direction === 'up' ? compPositiveColor : compNegativeColor" }
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
                            opacity: { signal: "lblShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            fontWeight: { signal: "lblIsBold ? 'bold' : 'normal'" },
                            fontStyle: { signal: "lblIsItalic ? 'italic' : 'normal'" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "lblPosition === 'inside' ? scale('y', datum.value) + 14 : scale('y', datum.value) - 6" },
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
                            opacity: { signal: "lblShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            fontWeight: { signal: "lblIsBold ? 'bold' : 'normal'" },
                            fontStyle: { signal: "lblIsItalic ? 'italic' : 'normal'" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "lblPosition === 'inside' ? scale('y', datum.value) + 14 : scale('y', datum.value) - 6" },
                            text: { field: "formattedValue" },
                            fill: { signal: "lblFontColor" }
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
                            opacity: { signal: "compShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            x: {
                                signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2"
                            },
                            y: { signal: "scale('y', datum.maxVal) - 40" },
                            text: { field: "label" },
                            fill: { signal: "datum.direction === 'up' ? compPositiveColor : compNegativeColor" }
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
