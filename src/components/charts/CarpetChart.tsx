import classNames from "classnames";
import * as d3 from "d3";
import {
    addHours,
    endOfToday,
    format,
    isMonday,
    isSaturday,
    isSunday,
    set,
    startOfDay,
    startOfToday,
    subMinutes
} from "date-fns";

import { useEffect } from "react";
import { GraphDescription } from "../../models/GraphDescription";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { PeriodDescription } from "../../models/PeriodDescription";
import { UsageField } from "../../models/UsageData";

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
    const axisWidth = 40;

    const cellWidth = (width - 2 * padding - axisWidth) / 31;
    const cellHeight = (height - 2 * padding) / 24;

    const dayPadding = 1;

    useEffect(() => {
        drawGraph(entries);
    }, [entries]);

    const drawGraph = (entries: MeasurementEntry[]) => {
        const data = entries.map((entry) => truncate(entry.value, 3));

        const max: number = Math.max(...data.filter(isDefined));

        const colorScale = d3
            .scaleLinear()
            .domain([0, max])
            .range(["white", graphDescription.barColor as any]);

        const svg = d3.select(`#svg_carpet_${fieldName}`);
        svg.attr("class", classNames(className));
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const graph = svg.select(".values");
        graph.attr("width", width).attr("height", height);

        graph
            .append("rect")
            .attr("x", padding + axisWidth)
            .attr("y", padding)
            .attr("width", width - 2 * padding - axisWidth)
            .attr("height", height - 2 * padding)
            .attr("fill", "none")
            .attr("stroke", borderGrey)
            .attr("stroke-width", "1px");

        const axisContainer = svg.select("g.axes");

        axisContainer.attr("transform", `translate(${padding + axisWidth}, 0)`).style("font-size", "10pt");

        if (entries.length === 0) {
            return;
        }

        /* The `cellWidth / 2` is there to make the scale return the centerpoints of
         * the squares. We can then offset the squares so they end up in the right place.
         */
        const scaleX = d3
            .scaleTime()
            .domain([startOfDay(entries[0].timestamp), startOfToday()])
            .range([padding + axisWidth + cellWidth / 2, width - padding - cellWidth / 2]);

        const scaleY = d3
            .scaleTime()
            .domain([startOfToday(), endOfToday()])
            .range([height - padding, padding]);

        const xAxis = d3.axisLeft(scaleY).ticks(d3.timeHour.every(3), d3.timeFormat("%H:%M"));

        axisContainer.call(xAxis as any);

        // TODO: Maybe there's another usage as well, maybe "year" with an entry for each day? :D
        if (periodDescription.periodSize === "month") {
            let lastDate: number | undefined;

            for (const entry of entries) {
                if (entry.timestamp.getDate() !== lastDate) {
                    drawWeekendMarker(entry.timestamp, scaleX, graph!);
                    lastDate = entry.timestamp.getDate();
                }

                drawSquare(entry, colorScale, scaleX, scaleY, graph!);
            }
        }
    };

    const drawWeekendMarker = (
        date: Date,
        scaleX: d3.ScaleTime<number, number, never>,
        container: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    ) => {
        if (isSaturday(date) || isMonday(date)) {
            let startX = scaleX(startOfDay(date)) - cellWidth / 2 - dayPadding;

            container
                .append("path")
                .attr("d", `M${startX} ${padding} v${height - 2 * padding}`)
                .attr("stroke-width", "1px")
                .attr("stroke", borderGrey);
        }
    };

    const drawSquare = (
        entry: MeasurementEntry,
        colorScale: d3.ScaleLinear<number, number, never>,
        scaleX: d3.ScaleTime<number, number, never>,
        scaleY: d3.ScaleTime<number, number, never>,
        container: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    ) => {
        const value = entry.value;
        const color = !!value ? colorScale(value) : "white";

        const now = new Date();

        const timestampMappedToToday = set(entry.timestamp, {
            year: now.getFullYear(),
            month: now.getMonth(),
            date: now.getDate()
        });

        const timeStampMappedToMidnight = startOfDay(entry.timestamp);

        /* Add 1 hour to the y scale value, since the graph is read from bottom to top.
         * For example, the square for hour 1 to 2 is received as hour 1. We must draw it from the top down,
         * so that would be hour 2.
         */
        container
            .append("rect")
            .attr("x", scaleX(timeStampMappedToMidnight) - cellWidth / 2)
            .attr("y", scaleY(addHours(timestampMappedToToday, 1)))
            .attr("width", cellWidth - 2 * dayPadding)
            .attr("height", cellHeight - 2 * dayPadding)
            .attr("fill", color)
            .on("mouseenter", (event: any) => showTooltip(event, entry, value, graphDescription))
            .on("mouseleave", hideTooltip)
            .attr(
                "title",
                `${timestampMappedToToday.getDate()}-${timestampMappedToToday.getMonth()} ${timestampMappedToToday.getHours()}:00 ${value}`
            );
        // .attr("stroke-width", dataIsZero ? 0.5 : 0)
        // .attr("stroke", "#888");
    };

    return (
        <div className="radialGraphContainer">
            <svg id={`svg_carpet_${fieldName}`}>
                <g className="values" />
                <g className="weekendMarkers" />
                <g className="axes" />
            </svg>
        </div>
    );
}

function showTooltip(event: any, entry: MeasurementEntry, value: number, graphDescription: GraphDescription) {
    const timestamp = entry.timestamp;

    const dateString = format(timestamp, "eee yyyy-MM-dd HH:00");
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
