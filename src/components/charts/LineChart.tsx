import * as d3 from "d3";
import { isDefined } from "../../lib/isDefined";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { ValueWithTimestamp } from "../../models/ValueWithTimestamp";

import { ChartWithAxes, ChartWithAxesProps } from "./ChartWithAxes";

type Series = ValueWithTimestamp[];
type SeriesCollection = Map<string, Series>;

type SpecificProps = {
    allSeries: SeriesCollection;
    fillArea?: boolean;
    lineColors?: Map<string, string>;
    defaultLineColor: string;
};

export class LineChart extends ChartWithAxes<SpecificProps> {
    protected readonly scaleX: d3.ScaleTime<number, number, never>;

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

        if (allSeries.size === 0) {
            return;
        }

        const lineGenerator = d3
            .line<ValueWithTimestamp>()
            .x((d) => {
                return this.scaleX(d.timestamp);
            })
            .y((d) => this.scaleY(d.value));

        const valuesSvg = svg.select("g.values");

        allSeries.forEach((series, key) => {
            valuesSvg
                .selectAll(`path.line_${key}`)
                .data([series])
                .join("path")
                .attr("class", `line_${key}`)
                .attr("fill", "none")
                .attr("stroke", this.props.lineColors?.get(key) ?? this.props.defaultLineColor)
                .attr("stroke-width", 2)
                .attr("d", lineGenerator);
        });

        if (this.props.fillArea) {
            const series = Array.from(allSeries.values())[0];

            const areaGenerator = d3
                .area<ValueWithTimestamp>()
                .x((d) => this.scaleX(d.timestamp))
                .y0(this.scaleY(0))
                .y1((d) => this.scaleY(d.value));

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
        svg.on("mouseover", this.mouseover).on("mousemove", this.mousemove).on("mouseout", this.mouseout);

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

        var firstSeriesClosestIndex = bisect(this.firstSeries, pointerDate, 1) - 1;

        // Find all y-values to highlight
        const ys = Array.from(this.props.allSeries.values()).map((series) => {
            var closestIndex = bisect(series, pointerDate, 1) - 1;
            return this.scaleY(series[closestIndex]?.value);
        });

        this.svg!.select("g.crosshairs g.horizontal")
            .selectAll("path.value")
            .data(ys)
            .join("path")
            .attr("class", "value")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", (y) => `M${this.padding.left + this.axisWidth},${y} H ${this.width - this.padding.right}`);

        const hoveredValue = this.firstSeries[firstSeriesClosestIndex];
        const x = this.scaleX(hoveredValue.timestamp);

        this.svg!.select("g.crosshairs path.vertical")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", `M${x},${this.padding.top} V ${this.height - this.padding.bottom}`);

        const tooltip = d3.select("#tooltip");

        const tooltipInput: { name: string; valueWithTimestamp: ValueWithTimestamp }[] = [];

        this.props.allSeries.forEach((series, key) => {
            var closestIndex = bisect(series, pointerDate, 1) - 1;

            tooltipInput.push({ name: key, valueWithTimestamp: series[closestIndex] });
        });

        tooltip
            .html(this.buildTooltipContents(tooltipInput))
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 58 + "px")
            .style("display", "block");
    };

    mouseout = () => {
        this.svg!.select("g.crosshairs").attr("opacity", 0);

        d3.select("#tooltip").style("display", "none");
    };

    protected override renderXAxis(xAxisBase: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const { periodDescription } = this.props;
        const ticks = periodDescription.getChartTicks();
        const xAxis = d3
            .axisBottom(this.scaleX as any)
            .ticks(ticks, d3.timeFormat(periodDescription.timeFormatString()));

        xAxisBase.call(xAxis as any);
    }

    private buildTooltipContents(tooltipInput: { name: string; valueWithTimestamp: ValueWithTimestamp }[]) {
        const formattedValues = tooltipInput
            .filter((item) => isDefined(item.valueWithTimestamp))
            .map((item) => {
                const value = d3.format(this.props.graphDescription.tooltipValueFormat)(item.valueWithTimestamp.value);

                return `${item.name}: ${value} ${this.props.graphDescription.displayableUnit}`;
            });

        const displayedValue = formattedValues.join("<br>");

        const displayedTimestamp = this.props.periodDescription
            .atIndex(tooltipInput[0].valueWithTimestamp.timestamp)
            .toShortTitle();

        return `${displayedTimestamp}:<br>${displayedValue}`;
    }

    protected override getDomain(): number[] {
        const [min, max] = this.getMinValue(this.props.allSeries.values());

        const range = max - min;

        const padding = range * 0.1;

        return [Math.round(min - padding - 0.5), Math.round(max + padding + 0.5)];
    }

    private getMinValue(allSeries: Iterable<Series>): [min: number, max: number] {
        const allValues = Array.from(allSeries).flatMap((series) => series.flatMap((valueWithTs) => valueWithTs.value));

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);

        return [min, max];
    }
}
