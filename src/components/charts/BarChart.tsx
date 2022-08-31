import * as d3 from "d3";
import { ValueWithTimestamp } from "../../models/ValueWithTimestamp";

import { ChartWithAxes, ChartWithAxesProps } from "./ChartWithAxes";

type SpecificProps = {
    series: ValueWithTimestamp[];
    onBarClick: (date: Date) => void;
};

export class BarChart extends ChartWithAxes<SpecificProps> {
    private readonly scaleX: d3.ScaleBand<Date>;
    private readonly scaleXForInversion: d3.ScaleTime<number, number, unknown>;

    private readonly brush: d3.BrushBehavior<unknown>;
    private values: d3.Selection<d3.BaseType | SVGRectElement, ValueWithTimestamp, d3.BaseType, unknown> | undefined;
    private brushSvg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | undefined;
    constructor(props: ChartWithAxesProps & SpecificProps) {
        super(props);

        this.scaleX = d3.scaleBand<Date>().padding(0.15);
        this.scaleXForInversion = d3.scaleTime();

        this.brush = d3.brushX();
    }

    override initializeGraph() {
        super.initializeGraph();

        const crosshairsSvg = this.svg!.append("g");
        crosshairsSvg.attr("class", "crosshairs");

        crosshairsSvg.append("g").attr("class", "horizontal");
        crosshairsSvg.append("path").attr("class", "vertical");

        // Add the brush before the values because otherwise the values aren't clickable.
        this.brushSvg = this.svg!.insert("g", ".values");
        this.brushSvg.attr("class", "brush");

        this.brush.extent([
            [this.padding.left + this.axisWidth, this.padding.top],
            [this.width - this.padding.right, this.height - this.padding.bottom - this.xAxisHeight()]
        ]);

        this.brush
            .on("brush", (event: any, d: unknown) => {
                const selection = event.selection;

                if (!selection) return;

                const bandwidth = this.scaleX.bandwidth() / 2;
                const selectedTimes = selection.map((px: number) => px - bandwidth).map(this.scaleXForInversion.invert);

                const selectedEntries = this.props.series.filter(
                    (entry) => entry.timestamp >= selectedTimes[0] && entry.timestamp <= selectedTimes[1]
                );
                this.values?.attr("fill", (el) => {
                    const timestamp = this.props.periodDescription.normalize(el.timestamp);
                    if (timestamp < selectedTimes[0] || timestamp > selectedTimes[1]) {
                        return this.props.graphDescription.barColor;
                    } else {
                        return "#ff00ff";
                    }
                });

                const left = event.pageX + 20 + "px";
                const top = event.pageY - 58 + "px";

                if (selectedEntries.length) {
                    this.showTooltip(this.buildTooltipContentsForRange(selectedEntries), left, top);
                }
            })
            .on("end", (event: any) => {
                if (!event.selection) {
                    this.values?.attr("fill", this.props.graphDescription.barColor);
                }
            });

        this.brushSvg.call(this.brush);
    }

    override get elementId() {
        return `BarChart_${this.props.label}`;
    }

    override componentDidUpdate() {
        const { periodDescription } = this.props;

        const domain = periodDescription
            .getExpectedDomainValues()
            .range(periodDescription.startOfPeriod(), periodDescription.endOfPeriod());

        this.scaleX.domain(domain).range([this.padding.left + this.axisWidth, this.width - this.padding.right]);

        this.scaleXForInversion
            .domain([periodDescription.startOfPeriod(), periodDescription.endOfPeriod()])
            .range([this.axisWidth + this.padding.left, this.width - this.padding.right]);

        this.brushSvg?.call(this.brush.move, null);

        super.componentDidUpdate();
    }

    override drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        this.values = svg
            .select("g.values")
            .selectAll("rect")
            .data(this.props.series)
            .join("rect")
            .on("click", this.onValueClick)
            .attr("y", (el) => this.scaleY(el.value))
            .attr("height", (el) => this.scaleY(0) - this.scaleY(el.value))
            .attr("x", (el) => this.calculateBarXPosition(el.timestamp))
            .attr("width", this.scaleX.bandwidth())
            .attr("fill", this.props.graphDescription.barColor)
            .attr("index", (_d: any, i: number) => i);

        svg.on("mouseover", this.mouseover).on("mousemove", this.mousemove).on("mouseout", this.mouseout);
    }

    // private drawTimesOfDay(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, date: Date) {
    // const [latitude, longitude] = [51.922909, 4.47059];

    // const times = getTimes(date, latitude, longitude);

    // const g = svg.select("g.additionalInfo");
    // const bandHeight = this.scaleY(0) - padding.top;

    // drawTimeBands(g, times, this.scaleX, padding.top, bandHeight, padding.left + axisWidth, width - padding.right);
    // }

    protected override renderXAxis(xAxisBase: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
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

        // Sadly, I also can't use the same logic as in the LineChart here, by using
        // scaleTime and using .ticks(), since bandScale does not support .ticks().
        const { graphDescription, graphTickPositions, periodDescription } = this.props;

        let domain = [periodDescription.startOfPeriod(), periodDescription.endOfPeriod()];

        if (graphTickPositions === "on_value") {
            domain = domain.map(periodDescription.shiftHalfTick);
        }

        const scaleXForXAxis = d3
            .scaleTime()
            .domain(domain)
            .range([this.padding.left + this.axisWidth, this.width - this.padding.right]);

        const ticks = periodDescription.getChartTicks();
        const xAxis = d3
            .axisBottom(scaleXForXAxis)
            .ticks(ticks, d3.timeFormat(periodDescription.timeFormatString()))
            .tickSizeOuter(0);

        const renderedXAxisLabels = xAxisBase
            .call(xAxis as any)
            .selectAll("text")
            .style("font-size", "13pt");

        if (graphDescription.hasTextLabels) {
            renderedXAxisLabels
                .style("text-anchor", "end")
                .attr("dy", "-.2em")
                .attr("dx", "-1em")
                .attr("transform", "rotate(-65)");
        } else {
            // Got the 0.71em from the browser
            renderedXAxisLabels.style("text-anchor", null).attr("dy", "0.71em").attr("transform", null);
        }
    }

    protected onValueClick = (_event: unknown, value: ValueWithTimestamp) => {
        this.props.onBarClick(value.timestamp);
    };

    private buildTooltipContentsForSingleMeasurement(valueWithTimestamp: ValueWithTimestamp) {
        const formattedValue = d3.format(this.props.graphDescription.tooltipValueFormat)(valueWithTimestamp.value);

        return `${this.props.periodDescription
            .atIndex(valueWithTimestamp.timestamp)
            .toShortTitle()}:<br />${formattedValue} ${this.props.graphDescription.displayableUnit}`;
    }

    private buildTooltipContentsForRange(values: ValueWithTimestamp[]) {
        const total = d3.sum(values.map((value) => value.value));

        const formattedValue = d3.format(this.props.graphDescription.tooltipValueFormat)(total);

        const startTimestamp = this.props.periodDescription.atIndex(values[0].timestamp).toShortTitle();
        const endTimestamp = this.props.periodDescription.atIndex(values[values.length - 1].timestamp).toShortTitle();
        return `${startTimestamp}-${endTimestamp}:<br />${formattedValue} ${this.props.graphDescription.displayableUnit}`;
    }

    private calculateBarXPosition(date: Date) {
        const { periodDescription } = this.props;
        const pos = this.scaleX(periodDescription.normalize(date));

        return !!pos ? pos : 0;
    }

    mouseover = () => {
        this.svg!.select("g.crosshairs").attr("opacity", 1);
    };

    // Example from https://d3-graph-gallery.com/graph/line_cursor.html
    mousemove = (event: any) => {
        // This allows to find the closest X index of the mouse:
        var bisect = d3.bisector((d: ValueWithTimestamp) => d.timestamp).right;

        const pointerX = d3.pointer(event)[0];
        const pointerDate = this.scaleXForInversion.invert(pointerX);

        var closestIndex = bisect(this.props.series, pointerDate, 1) - 1;

        // Find all y-values to highlight
        const hoveredEntry = this.props.series[closestIndex];

        if (!hoveredEntry) {
            return;
        }

        // Use `scaleXForInversion` because ScaleBand does not return anything,
        // possibly due to imprecise matches.
        const x =
            this.scaleX(this.props.periodDescription.normalize(hoveredEntry.timestamp))! + this.scaleX.bandwidth() / 2;
        const y = this.scaleY(hoveredEntry.value);

        this.svg!.select("g.crosshairs g.horizontal")
            .selectAll("path.value")
            .data([y])
            .join("path")
            .attr("class", "value")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", (y) => `M${this.padding.left + this.axisWidth},${y} H ${this.width - this.padding.right}`);

        this.svg!.select("g.crosshairs path.vertical")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", `M${x},${this.padding.top} V ${this.height - this.padding.bottom}`);

        const left = event.pageX + 20 + "px";
        const top = event.pageY - 58 + "px";

        this.showTooltip(this.buildTooltipContentsForSingleMeasurement(hoveredEntry), left, top);
    };

    mouseout = () => {
        this.svg!.select("g.crosshairs").attr("opacity", 0);
        console.log("mouseout");
        this.hideTooltip();
    };

    showTooltip(text: string, left: string, top: string) {
        const tooltip = d3.select("#tooltip");
        tooltip.html(text).style("left", left).style("top", top).style("display", "block");
    }

    hideTooltip() {
        const tooltip = d3.select("#tooltip");

        tooltip.style("display", "none");
    }
}
