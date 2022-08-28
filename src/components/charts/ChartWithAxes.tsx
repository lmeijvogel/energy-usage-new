import * as React from "react";
import { createRef } from "react";
import classNames from "classnames";
import * as d3 from "d3";

// import { getTimes } from "suncalc";

import { GraphTickPositions, PeriodDescription } from "../../models/PeriodDescription";
import { GraphDescription } from "../../models/GraphDescription";
// import { drawTimeBands } from "./drawTimeBands";

export type ChartWithAxesProps = {
    className?: string;
    label: string;
    periodDescription: PeriodDescription;
    graphDescription: GraphDescription;
    // colorIntense: string;
    tooltipLabelBuilder: (title: number) => string;
    graphTickPositions: GraphTickPositions;
};

export abstract class ChartWithAxes<T> extends React.Component<ChartWithAxesProps & T> {
    protected abstract get elementId(): string;

    readonly width = 480;
    readonly height = 240;
    readonly padding = {
        top: 10,
        right: 30,
        bottom: 10,
        left: 10
    };
    readonly axisWidth = 50;

    private readonly elementRef = createRef<SVGSVGElement>();

    protected svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | null = null;

    protected readonly scaleY: d3.ScaleLinear<number, number, never>;

    private readonly yAxis: d3.Axis<d3.NumberValue>;

    constructor(props: ChartWithAxesProps & T) {
        super(props);

        this.scaleY = d3.scaleLinear().clamp(true);
        this.yAxis = d3.axisLeft(this.scaleY);
    }

    componentDidMount() {
        this.initializeGraph();
        this.renderGraph(this.svg!);
    }

    componentDidUpdate() {
        this.renderGraph(this.svg!);
    }

    render() {
        // Values are rendered above the selection for the tooltip
        return (
            <svg
                className={classNames(this.props.className, "periodUsageGraph")}
                id={this.elementId}
                ref={this.elementRef}
            >
                <g className="gridLines" />
                <g className="additionalInfo" />
                <g className="values" />
                <g className="xAxis" />
                <g className="yAxis" />
            </svg>
        );
    }

    protected initializeGraph() {
        const id = this.elementRef.current!.id;

        this.svg = d3.select("#" + id).attr("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    private renderGraph(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const xAxisHeight = this.props.graphDescription.xLabelHeight;
        this.scaleY
            .domain([this.props.graphDescription.minY, this.props.graphDescription.maxY])
            .range([this.height - this.padding.bottom - xAxisHeight, this.padding.top]);

        this.drawValues(svg);

        this.updateAxes(svg);
    }

    private updateAxes(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        /* Remove and repaint the axis: When switching between scales (or formatting, not sure),
         * the first tick kept getting painted wrong (shifted to the left).
         *
         * Starting clean fixes this.
         */
        svg.select("g.xAxis").remove();

        const xAxisBase = svg
            .append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.scaleY(0)})`);

        this.renderXAxis(xAxisBase);

        svg.select(".yAxis")
            .attr("transform", `translate(${this.padding.left + this.axisWidth}, 0)`)
            .style("font-size", "13pt")
            .call(this.yAxis as any);
    }
    protected abstract renderXAxis(xAxisBase: d3.Selection<SVGGElement, unknown, HTMLElement, any>): void;

    protected abstract drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>): void;
}
