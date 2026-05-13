"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import embed, { Result } from "vega-embed";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

interface BarDatum {
    category: string;
    value: number;
}

interface ComparisonDatum {
    x1: string;
    x2: string;
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

    constructor(options: VisualConstructorOptions) {
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
        const categories = categorical?.categories?.[0]?.values ?? [];
        const values = categorical?.values?.[0]?.values ?? [];

        // Manejo del estado sin datos
        if (!categorical || categories.length === 0 || values.length === 0) {
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

        const bars: BarDatum[] = categories
            .map((cat, i) => ({ category: String(cat), value: Number(values[i]) || 0 }))
            .filter(d => d.value !== null && !isNaN(d.value));

        const comparisons: ComparisonDatum[] = [];
        for (let i = 1; i < bars.length; i++) {
            const prev = bars[i - 1].value;
            const curr = bars[i].value;
            const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
            comparisons.push({
                x1: bars[i - 1].category,
                x2: bars[i].category,
                maxVal: Math.max(prev, curr),
                pct,
                direction: pct >= 0 ? "up" : "down",
                label: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}%`
            });
        }

        // Restamos unos pocos píxeles para asegurar que no salgan barras de desplazamiento
        const w = Math.max(options.viewport.width - 10, 10);
        const h = Math.max(options.viewport.height - 10, 10);
        const barColor = this.formattingSettings.dataPointCard.barColor.value.value || "#4A90D9";
        const maxValue = Math.max(...bars.map(b => b.value));
        const yMax = maxValue > 0 ? maxValue * 1.35 : 10;

        // Actualización dinámica si el gráfico ya existe
        if (this.vegaResult) {
            this.vegaResult.view
                .signal("width", w)
                .signal("height", h)
                .signal("barColor", barColor)
                .signal("yMax", yMax)
                .data("bars", bars)
                .data("comparisons", comparisons)
                .runAsync()
                .catch(console.error);
            return;
        }

        const spec = this.buildSpec(bars, comparisons, w, h, yMax, barColor);
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        embed(this.container, spec as any, { actions: false, renderer: "svg" })
            .then(result => { this.vegaResult = result; })
            .catch(console.error);
    }

    private buildSpec(
        bars: BarDatum[],
        comparisons: ComparisonDatum[],
        width: number,
        height: number,
        yMax: number,
        barColor: string
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
                    reverse: true,
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
                    format: "~s"
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
                            fill: { signal: "barColor" },
                            fillOpacity: { value: 1 }
                        },
                        hover: { fillOpacity: { value: 0.8 } }
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
                            fill: { value: "#444" },
                            fontSize: { value: 11 },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { scale: "y", field: "value", offset: -6 },
                            text: { field: "value" }
                        }
                    }
                },

                // Línea horizontal del bracket entre barras
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            strokeWidth: { value: 1.5 }
                        },
                        update: {
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" }
                        }
                    }
                },

                // Tick vertical izquierdo del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            strokeWidth: { value: 1.5 }
                        },
                        update: {
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 14" },
                            y2: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" }
                        }
                    }
                },

                // Tick vertical derecho del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            strokeWidth: { value: 1.5 }
                        },
                        update: {
                            x: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 14" },
                            y2: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" }
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
                            fontSize: { value: 11 },
                            fontWeight: { value: "600" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            x: {
                                signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2"
                            },
                            y: { signal: "scale('y', datum.maxVal) - 26" },
                            text: { field: "label" },
                            fill: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" }
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
