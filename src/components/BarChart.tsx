import * as React from "react";
import { createRef } from "react";
import classNames from "classnames";
import * as d3 from "d3";

// import { getTimes } from "suncalc";

import { unitToString } from "../helpers/unitToString";
import { UsageField } from "../models/UsageData";
import { GraphTickPositions, PeriodDescription } from "../models/PeriodDescription";
// import { drawTimeBands } from "./drawTimeBands";

type Props = {
    className?: string;
    fieldName: UsageField;
    label: string;
    periodDescription: PeriodDescription;
    series: number[];
    maxY: number;
    color: string;
    // colorIntense: string;
    onClick: (index: number) => void;
    tooltipLabelBuilder: (title: number) => string;
    graphTickPositions: GraphTickPositions;
};

const width = 480;
const height = 240;
const padding = {
    top: 10,
    right: 30,
    bottom: 10,
    left: 10
};

const axisWidth = 30;
const axisHeight = 10;

export class BarChart extends React.Component<Props> {
    private readonly elementRef = createRef<SVGSVGElement>();

    private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | null = null;

    private readonly scaleX: d3.ScaleBand<number>;

    /* When the user drags to select a number of bars,
     * it's necessary to find the bars corresponding to the
     * coordinates on-screen. Sadly, the BandScale that we use for
     * positioning the bars does not have an `inverse(x)` method,
     * so we build a second (linear) scale that matches the BandScale
     * and use that for finding the current bar for given x-coordinates.
     */
    // private readonly scaleXForInversion: d3.ScaleLinear<number, number, never>;

    private readonly scaleY: d3.ScaleLinear<number, number, never>;
    private readonly yAxis: d3.Axis<d3.NumberValue>;

    private ignoreClickEvent = false;

    constructor(props: Props) {
        super(props);

        this.scaleX = d3.scaleBand<number>().padding(0.15);
        // this.scaleXForInversion = d3.scaleLinear();

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
                id={`chart_${this.props.label}`}
                ref={this.elementRef}
            >
                <g className="xAxis" />
                <g className="yAxis" />
                <g className="gridLines" />
                <g className="additionalInfo" />
                <g className="values" />
                <g className="selection">
                    <rect />
                </g>
            </svg>
        );
    }

    private initializeGraph() {
        const id = this.elementRef.current!.id;

        this.svg = d3.select("#" + id).attr("viewBox", `0 0 ${width} ${height}`);

        this.svg.on("click", () => {
            if (this.ignoreClickEvent) {
                return;
            }

            this.svg!.select("g.selection").select("rect").attr("display", "none");
        });
    }

    private renderGraph(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const domain = d3.range(0, this.props.series.length, 1);

        this.scaleX.domain(domain).range([padding.left + axisWidth, width - padding.right]);

        // this.scaleXForInversion.domain(domain).range([padding.left + axisWidth, width - padding.right]);

        this.scaleY.domain([0, this.props.maxY]).range([height - padding.bottom - axisHeight, padding.top]);

        this.updateAxes(svg);

        this.drawGridLines(svg);

        this.drawBars(svg, this.props.series);

        // if (this.props.fieldName === "stroom") {
        // const { periodDescription } = this.props;

        // if (periodDescription instanceof DayDescription) {
        // this.drawTimesOfDay(svg, periodDescription.toDate());
        // } else {
        // const g = svg.select("g.additionalInfo");

        // g.selectChildren().remove();
        // }
        // }
    }

    private clickBar = ({ target }: { target: SVGRectElement }) => {
        const index = parseInt(target.attributes.getNamedItem("index")!.value, 10);
        this.props.onClick(index);
    };

    private showTooltip = (event: any, value: number) => {
        const index = parseInt(event.target.attributes.getNamedItem("index")!.value, 10);
        const contents = this.buildTooltipContents(index, value);
        const tooltip = d3.select("#tooltip");

        tooltip
            .html(contents)
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 58 + "px")
            .style("display", "block");
    };

    private hideTooltip = () => {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "none");
    };

    private updateAxes(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        /* The reasonable assumption would be that creating a scale for a bar chart
         * would just reuse the band scale, but that has the downside that the ticks will
         * always end up in the middle of the bars. For the year and month charts that is fine:
         * A bar represents the usage for a given day or month.
         *
         * For the day chart, it feels better to have the bars *between* the axis ticks,
         * since the graph shows the usage between e.g. 09:00 and 10:00. And we need a linear
         * scale to do that: I can't persuade an xAxis based on a band scale to put the ticks
         * between the bands.
         */
        const scaleXForXAxis = d3
            .scaleLinear()
            .domain([0, this.props.series.length])
            .range([padding.left + axisWidth, width - padding.right]);

        let xAxis: any;
        if (this.props.graphTickPositions === "on_value") {
            xAxis = d3
                .axisBottom(this.scaleX as any)
                .tickValues(d3.range(0, this.props.series.length, 2))
                .tickFormat((n: any) => `${(n as number) + 1}`)
                .tickSizeOuter(0);
        } else {
            xAxis = d3.axisBottom(scaleXForXAxis);
        }

        svg.select(".xAxis")
            .attr("transform", `translate(0, ${this.scaleY(0)})`)
            .call(xAxis);
        svg.select(".yAxis")
            .attr("transform", `translate(${padding.left + axisWidth}, 0)`)
            .call(this.yAxis as any);
    }

    private drawGridLines(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const yTickValues = this.yAxis.tickValues() || this.scaleY.ticks();
        svg.select("g.gridLines")
            .selectAll("line")
            .data(yTickValues)
            .join("line")
            .attr("x1", padding.left + axisWidth)
            .attr("y1", (el: any) => this.scaleY(el))
            .attr("x2", width - padding.right)
            .attr("y2", (el: any) => this.scaleY(el))
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1);
    }

    private drawBars(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, relativeData: number[]) {
        svg.select("g.values")
            .selectAll("rect")
            .data(relativeData)
            .join("rect")
            .on("click", this.clickBar)
            .on("mouseenter", this.showTooltip)
            .on("mouseleave", this.hideTooltip)

            .attr("y", (el: number) => this.scaleY(el))
            .attr("height", (el: number) => this.scaleY(0) - this.scaleY(el))
            .attr("x", (_val: number, i: number) => this.calculateBarXPosition(i))
            .attr("width", this.scaleX.bandwidth())
            .attr("fill", this.props.color)
            .attr("index", (_d: any, i: number) => i);
    }

    // private drawTimesOfDay(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, date: Date) {
    // const [latitude, longitude] = [51.922909, 4.47059];

    // const times = getTimes(date, latitude, longitude);

    // const g = svg.select("g.additionalInfo");
    // const bandHeight = this.scaleY(0) - padding.top;

    // drawTimeBands(g, times, this.scaleX, padding.top, bandHeight, padding.left + axisWidth, width - padding.right);
    // }

    private calculateBarXPosition(i: number) {
        const pos = this.scaleX(i);

        return !!pos ? pos : 0;
    }

    private buildTooltipContents(index: number, value: number) {
        return `${this.props.tooltipLabelBuilder(index)}:<br />${value} ${unitToString(this.props.fieldName)}`;
    }
}
