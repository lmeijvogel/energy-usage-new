import classNames from "classnames";
import * as d3 from "d3";
import { add, format, getDaysInMonth, isSaturday, isSunday, isWeekend } from "date-fns";

import { useEffect } from "react";
import { GraphDescription } from "../../models/GraphDescription";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { PeriodDescription } from "../../models/PeriodDescription";
import { UsageField } from "../../models/UsageData";

import styles from "./CarpetChart.module.css";

type Props = {
    className?: string;
    width: number;
    height: number;
    entries: MeasurementEntry[];
    fieldName: UsageField;
    periodDescription: PeriodDescription;
    graphDescription: GraphDescription;
};

const borderGrey = "#ccc";
export function CarpetChart({
    className,
    width,
    height,
    entries,
    fieldName,
    periodDescription,
    graphDescription
}: Props) {
    const padding = 30;

    const cellWidth = (width - 2 * padding) / 31;
    const cellHeight = (height - 2 * padding) / 24;

    const dayPadding = 1;

    useEffect(() => {
        drawGraph(entries);
    }, [entries]);

    const drawGraph = (entries: MeasurementEntry[]) => {
        const data = entries.map((value) => truncate(value[fieldName], 3));

        const max: number = Math.max(...data.filter(isDefined));

        const colorScale = d3
            .scaleLinear()
            .domain([0, max])
            .range(["white", graphDescription.barColor as any]);

        const svg = d3.select(`#svg_carpet_${fieldName}`);
        svg.attr("class", classNames(className));
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const graph = svg.select(".graph");
        graph.attr("width", width).attr("height", height);

        graph.html("");

        graph
            .append("rect")
            .attr("x", padding)
            .attr("y", padding)
            .attr("width", width - 2 * padding)
            .attr("height", height - 2 * padding)
            .attr("fill", "none")
            .attr("stroke", borderGrey)
            .attr("stroke-width", "1px");

        const maxData = d3.max(data) ?? 0;

        // TODO: Maybe there's another usage as well, maybe "year" with an entry for each day? :D
        if (periodDescription.periodSize === "month") {
            let lastDate: number | undefined;
            let dayContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
            let column = -1;

            for (const entry of entries) {
                if (entry.day !== lastDate) {
                    column++;

                    dayContainer = graph.append("g");

                    const date = new Date(entry.year, entry.month - 1, entry.day);
                    if (isSaturday(date)) {
                        drawWeekendMarker(column, "saturday", dayContainer);
                    } else if (isSunday(date)) {
                        drawWeekendMarker(column, "sunday", dayContainer);
                    }
                    lastDate = entry.day;
                }

                drawSquare(entry, fieldName, column, colorScale, dayContainer!);
            }
        }
    };

    const drawWeekendMarker = (
        column: number,
        day: "saturday" | "sunday",
        dayContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    ) => {
        let startX = padding + column * cellWidth;

        if (day === "sunday") {
            startX += cellWidth;
        }

        dayContainer
            .append("path")
            .attr("d", `M${startX} ${padding} v${height - 2 * padding}`)
            .attr("stroke-width", "1px")
            .attr("stroke", borderGrey);
    };

    const drawSquare = (
        entry: MeasurementEntry,
        fieldName: UsageField,
        column: number,
        colorScale: d3.ScaleLinear<number, number, never>,
        container: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    ) => {
        const value = entry[fieldName];
        const color = !!value ? colorScale(value) : "white";

        container
            .append("rect")
            .attr("x", padding + column * cellWidth + dayPadding)
            .attr("y", padding + entry.hour * cellHeight + dayPadding)
            .attr("width", cellWidth - 2 * dayPadding)
            .attr("height", cellHeight - 2 * dayPadding)
            .attr("fill", color)
            .on("mouseenter", (event: any) => showTooltip(event, entry, value, graphDescription))
            .on("mouseleave", hideTooltip)
            .attr("title", `${entry.day}-${entry.month} ${entry.hour}:00 ${value}`);
        // .attr("stroke-width", dataIsZero ? 0.5 : 0)
        // .attr("stroke", "#888");
    };

    return (
        <div className="radialGraphContainer">
            <svg id={`svg_carpet_${fieldName}`}>
                <g className="graph" />
            </svg>
        </div>
    );
}

function showTooltip(event: any, entry: MeasurementEntry, value: number, graphDescription: GraphDescription) {
    const date = new Date(entry.year, entry.month - 1, entry.day, entry.hour);

    const dateString = format(date, "eee yyyy-MM-dd HH:00");
    const contents = `${dateString}<br />value: <b>${d3.format(".2f")(value)}</b> ${graphDescription.displayableUnit}`;

    const tooltip = d3.select("#tooltip");

    tooltip
        .html(contents)
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY - 58 + "px")
        .style("display", "block");
}

function hideTooltip() {
    const tooltip = d3.select("#tooltip");
    tooltip.style("display", "none");
}

function truncate(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

function isDefined<T>(x: T): x is T {
    return x !== undefined && x !== null;
}
