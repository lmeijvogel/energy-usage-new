import * as d3 from "d3";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { ValueWithTimestamp } from "../../models/ValueWithTimestamp";

import { ChartWithAxes, ChartWithAxesProps } from "./ChartWithAxes";

type Series = ValueWithTimestamp[];
type SeriesCollection = Map<string, Series>;

type SpecificProps = {
    allSeries: SeriesCollection;
};

export class LineChart extends ChartWithAxes<SpecificProps> {
    protected readonly scaleX: d3.ScaleTime<number, number, never>;

    private mouseCatcherSvg: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | null = null;

    constructor(props: ChartWithAxesProps & SpecificProps) {
        super(props);

        this.scaleX = d3.scaleTime();
    }

    override initializeGraph() {
        super.initializeGraph();

        this.svg!.select("g.values").append("g").attr("class", "area");

        const crosshairsSvg = this.svg!.append("g");
        crosshairsSvg.attr("class", "crosshairs");

        crosshairsSvg.append("g").attr("class", "horizontal");
        crosshairsSvg.append("path").attr("class", "vertical");

        const tooltipSvg = this.svg!.append("g").attr("class", "tooltip");
        tooltipSvg.append("text").attr("fill", "black");

        this.svg!.append("rect").attr("class", "mouseCatcher");
    }

    override componentDidUpdate() {
        const { allSeries } = this.props;

        if (allSeries.size > 0) {
            const firstSeries = this.firstSeries!;

            if (firstSeries.length > 0) {
                const domain = [
                    this.props.periodDescription.startOfPeriod(),
                    this.props.periodDescription.endOfPeriod()
                ];

                const minimumX = this.padding.left + this.axisWidth;
                const maximumX = this.width - this.padding.right;
                this.scaleX.domain(domain).range([minimumX, maximumX]);
            }
        }

        super.componentDidUpdate();
    }

    override get elementId() {
        return `LineChart_${this.props.label}`;
    }

    private get firstSeries(): ValueWithTimestamp[] | undefined {
        const firstKey = Array.from(this.props.allSeries.keys())[0];

        return this.props.allSeries.get(firstKey);
    }

    override drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const { allSeries, graphDescription } = this.props;

        const lineGenerator = d3
            .line<ValueWithTimestamp>()
            .x((d) => {
                return this.scaleX(d.timestamp);
            })
            .y((d) => this.scaleY(d.value));

        const areaGenerator = d3
            .area<ValueWithTimestamp>()
            .x((d) => this.scaleX(d.timestamp))
            .y0(this.scaleY(0))
            .y1((d) => this.scaleY(d.value));

        const valuesSvg = svg.select("g.values");

        allSeries.forEach((series, key) => {
            valuesSvg
                .selectAll(`path.line_${key}`)
                .data([series])
                .join("path")
                .attr("class", `line_${key}`)
                .attr("fill", "none")
                .attr("stroke", graphDescription.barColor)
                .attr("stroke-width", 2)
                .attr("d", lineGenerator);
        });

        if (allSeries.size === 1) {
            const series = Array.from(allSeries.values())[0];

            valuesSvg
                .select("g.area")
                .selectAll("path")
                .data([series])
                .join("path")
                .attr("fill", graphDescription.lightColor)
                .attr("stroke", graphDescription.barColor)
                .attr("stroke-width", 0)
                .attr("d", areaGenerator);
        }

        // Create a rect on top of the svg area: this rectangle recovers mouse position
        this.mouseCatcherSvg = svg.select("rect.mouseCatcher");

        this.mouseCatcherSvg
            .attr("class", "mouseCatcher")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", this.width)
            .attr("height", this.height)
            .on("mouseover", this.mouseover)
            .on("mousemove", this.mousemove)
            .on("mouseout", this.mouseout);

        svg.select("g.tooltip").attr("width", 100).attr("height", 100).attr("fill", "white");
    }

    mouseover = () => {
        this.svg!.select("g.crosshairs").attr("opacity", 1);
    };

    // Example from https://d3-graph-gallery.com/graph/line_cursor.html
    mousemove = (event: any) => {
        if (!this.firstSeries) {
            return;
        }

        // This allows to find the closest X index of the mouse:
        var bisect = d3.bisector((d: MeasurementEntry) => d.timestamp).right;

        const pointerX = d3.pointer(event)[0];
        const pointerDate = this.scaleX.invert(pointerX);

        var closestIndex = bisect(this.firstSeries, pointerDate, 1) - 1;

        // Find all y-values to highlight
        const ys = Array.from(this.props.allSeries.values()).map((series) => this.scaleY(series[closestIndex].value));

        this.svg!.select("g.crosshairs g.horizontal")
            .selectAll("path.value")
            .data(ys)
            .join("path")
            .attr("class", "value")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", (y) => `M${this.padding.left + this.axisWidth},${y} H ${this.width - this.padding.right}`);

        const hoveredValue = this.firstSeries[closestIndex];
        const x = this.scaleX(hoveredValue.timestamp);

        this.svg!.select("g.crosshairs path.vertical")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", `M${x},${this.padding.top} V ${this.height - this.padding.bottom}`);

        const tooltip = d3.select("#tooltip");
        tooltip
            .html(
                this.buildTooltipContents(
                    Array.from(this.props.allSeries.values()).map((series) => series[closestIndex])
                )
            )
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 58 + "px")
            .style("display", "block");
    };

    mouseout = () => {
        this.svg!.select("g.crosshairs").attr("opacity", 0);
        this.svg!.select("g.tooltip").attr("opacity", 0);
    };

    protected override renderXAxis(xAxisBase: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        const { periodDescription } = this.props;
        const ticks = periodDescription.getChartTicks();
        const xAxis = d3
            .axisBottom(this.scaleX as any)
            .ticks(ticks, d3.timeFormat(periodDescription.timeFormatString()));

        xAxisBase.call(xAxis);
    }

    private buildTooltipContents(valuesWithTimestamp: ValueWithTimestamp[]) {
        const formattedValues = valuesWithTimestamp
            .map((v) => v.value)
            .map(d3.format(this.props.graphDescription.tooltipValueFormat))
            .map((value) => `${value} ${this.props.graphDescription.displayableUnit}`);

        const [minValue, maxValue] = formattedValues;

        // Only display two values if there are two distinct values.
        // A case for the same values would be the day display of living room temperatures:
        // These are (almost?) always the same, so a single value should be enough.
        let displayedValue: string;
        if (!!minValue && !!maxValue && minValue !== maxValue) {
            displayedValue = `max: ${maxValue}<br />min: ${minValue}`;
        } else {
            displayedValue = minValue;
        }

        return `${this.props.periodDescription
            .atIndex(valuesWithTimestamp[0].timestamp)
            .toShortTitle()}:<br />${displayedValue}`;
    }
}
