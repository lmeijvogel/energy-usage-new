import { PeriodDescription } from "./PeriodDescription";
import { UsageField } from "../models/UsageData";
import { assertNever } from "../lib/assertNever";
import getDaysInMonth from "date-fns/getDaysInMonth";

export abstract class GraphDescription {
    constructor(protected readonly periodDescription: PeriodDescription) {}

    abstract readonly barColor: string;
    abstract readonly fieldName: UsageField;

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
}

function range(start: number, end: number): number[] {
    const result = [];

    for (let n = start; n < end; n++) {
        result.push(n);
    }

    return result;
}

export class GasGraphDescription extends GraphDescription {
    readonly barColor = "#e73711";
    readonly fieldName = "gas";

    get maxY() {
        switch (this.periodDescription.periodSize) {
            case "year":
                return 400;
            case "month":
                return 20;
            case "day":
                return 3;
            default:
                return assertNever(this.periodDescription.periodSize);
        }
    }
}

export class StroomGraphDescription extends GraphDescription {
    readonly barColor = "#f0ad4e";
    readonly fieldName = "stroom";

    get maxY() {
        switch (this.periodDescription.periodSize) {
            case "year":
                return 600;
            case "month":
                return 20;
            case "day":
                return 2;
            default:
                return assertNever(this.periodDescription.periodSize);
        }
    }
}

export class WaterGraphDescription extends GraphDescription {
    readonly barColor = "#428bca";
    readonly fieldName = "water";

    get maxY() {
        switch (this.periodDescription.periodSize) {
            case "year":
                return 30000;
            case "month":
                return 1500;
            case "day":
                return 200;
            default:
                return assertNever(this.periodDescription.periodSize);
        }
    }
}
