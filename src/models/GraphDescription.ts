import { PeriodDescription } from "./PeriodDescription";
import { UsageField } from "../models/UsageData";
import { assertNever } from "../lib/assertNever";
import getDaysInMonth from "date-fns/getDaysInMonth";

export abstract class GraphDescription {
    constructor(protected readonly periodDescription: PeriodDescription) {}

    abstract readonly barColor: string;
    abstract readonly lightColor: string;
    abstract readonly fieldName: UsageField | "temperatuur";

    abstract readonly displayableUnit: string;

    get minY(): number {
        return 0;
    }

    abstract get maxY(): number;

    get xLabelHeight(): number {
        switch (this.periodDescription.periodSize) {
            case "year":
                return 40;
            default:
                return 20;
        }
    }
    get hasTextLabels(): boolean {
        return this.periodDescription.periodSize === "year";
    }

    get displayedTickIndices(): number[] {
        switch (this.periodDescription.periodSize) {
            case "year":
                return range(0, 12);
            case "month":
                const daysInMonth = getDaysInMonth(this.periodDescription.startOfPeriod());

                return range(0, daysInMonth).filter((i) => {
                    if (i === 0 || i === daysInMonth - 1) {
                        return true;
                    }

                    if (i % 2 === 0) {
                        // Skip next-to-last day to make sure that there's always room
                        if (i === daysInMonth - 2) {
                            return false;
                        }
                        return true;
                    }

                    return false;
                });
            case "day":
                return range(0, 23);
            default:
                return assertNever(this.periodDescription.periodSize);
        }
    }

    get tooltipValueFormat() {
        return ".2f";
    }

    protected get periodSize(): "year" | "month" | "day" {
        return this.periodDescription.periodSize;
    }
}

function range(start: number, end: number): number[] {
    const result = [];

    for (let n = start; n < end; n++) {
        result.push(n);
    }

    return result;
}

export class GasGraphDescription extends GraphDescription {
    readonly barColor = "#e73710";
    readonly lightColor = "#e73710";
    readonly fieldName = "gas";

    readonly displayableUnit = "m³";

    get maxY() {
        switch (this.periodSize) {
            case "year":
                return 400;
            case "month":
                return 12;
            case "day":
                return 1;
            default:
                return assertNever(this.periodSize);
        }
    }
}

export class StroomGraphDescription extends GraphDescription {
    readonly barColor = "#f0ad4e";
    readonly lightColor = "#ffddad";
    readonly fieldName = "stroom";
    readonly displayableUnit = "kWh";

    get maxY() {
        switch (this.periodSize) {
            case "year":
                return 600;
            case "month":
                return 20;
            case "day":
                return 2;
            default:
                return assertNever(this.periodSize);
        }
    }
}

export class WaterGraphDescription extends GraphDescription {
    readonly barColor = "#428bca";
    readonly lightColor = "#428bca";
    readonly fieldName = "water";

    readonly displayableUnit = "L";

    get maxY() {
        switch (this.periodSize) {
            case "year":
                return 30000;
            case "month":
                return 1500;
            case "day":
                return 200;
            default:
                return assertNever(this.periodSize);
        }
    }

    get tooltipValueFormat() {
        return "d";
    }
}

export class CurrentPowerUsageGraphDescription extends GraphDescription {
    readonly barColor = "#f0ad4e";
    readonly lightColor = "#ffddad";
    readonly fieldName = "stroom";
    readonly displayableUnit = "W";

    get maxY() {
        return 3000; // We only support a single period anyway
    }
}

export class BinnenTemperatuurGraphDescription extends GraphDescription {
    readonly barColor = "#428bca";
    readonly lightColor = "#428bca";
    readonly fieldName = "temperatuur";

    readonly displayableUnit = "°C";

    override get minY() {
        return 15;
    }

    get maxY() {
        return 35;
    }

    get tooltipValueFormat() {
        return "d";
    }
}
