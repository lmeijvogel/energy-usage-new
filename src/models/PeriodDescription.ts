export type GraphTickPositions = "on_value" | "between_values";

const DAYS_OF_WEEK = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

const FULL_MONTH_NAMES = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december"
];

const ABBREV_MONTH_NAMES = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const firstMeasurementDate = new Date(2014, 2, 3);

export abstract class PeriodDescription {
    abstract readonly periodSize: "year" | "month" | "day";
    abstract readonly graphTickPositions: GraphTickPositions;

    padDatePart(part: number): string {
        const stringPart = part.toString();

        switch (stringPart.length) {
            case 0:
                return "00";
            case 1:
                return "0" + stringPart;
            default:
                return stringPart;
        }
    }

    abstract toUrl(): string;
    abstract toTitle(): string;
    abstract toDate(): Date;

    abstract previous(): PeriodDescription;
    abstract next(): PeriodDescription;
    abstract up(): PeriodDescription | null;

    abstract formatTick(index: number): string;

    hasMeasurements(): boolean {
        return !this.beforeFirstMeasurement() && !this.isInFuture();
    }

    beforeFirstMeasurement(): boolean {
        return this.relevantDateParts(this.toDate()) < this.relevantDateParts(firstMeasurementDate);
    }

    abstract relevantDateParts(date: Date): Date;

    isInFuture(): boolean {
        return this.toDate() > new Date();
    }

    toShortTitle(): string {
        return this.toTitle();
    }

    abstract startOfPeriod(): Date;
}

export class YearDescription extends PeriodDescription {
    readonly periodSize = "year";
    readonly graphTickPositions = "on_value";

    year: number;

    constructor(year: number) {
        super();
        this.year = year;
    }

    previous() {
        return new YearDescription(this.year - 1);
    }

    next() {
        return new YearDescription(this.year + 1);
    }

    up() {
        return null;
    }

    toUrl() {
        return "/year/" + this.year;
    }

    toTitle() {
        return this.year.toString();
    }

    toDate() {
        return new Date(this.year, 0, 1);
    }

    relevantDateParts(date: Date): Date {
        return new Date(date.getFullYear(), 0, 0);
    }

    startOfPeriod(): Date {
        return new Date(this.year, 0, 1);
    }

    formatTick(index: number) {
        return ABBREV_MONTH_NAMES[index]; // `${index + 1}`;
    }

    atIndex(index: number): MonthDescription {
        return new MonthDescription(this.year, index);
    }
}

export class MonthDescription extends PeriodDescription {
    readonly periodSize = "month";
    readonly graphTickPositions = "on_value";

    year: number;
    month: number;

    constructor(year: number, month: number) {
        super();
        this.year = year;
        this.month = month;
    }

    previous() {
        const date = new Date(this.year, this.month - 1, 1);

        return new MonthDescription(date.getFullYear(), date.getMonth());
    }

    next() {
        const date = new Date(this.year, this.month + 1, 1);

        return new MonthDescription(date.getFullYear(), date.getMonth());
    }

    up() {
        return new YearDescription(this.year);
    }

    toUrl() {
        return `/month/${this.year}/${this.month + 1}`;
    }

    toTitle() {
        return `${FULL_MONTH_NAMES[this.month]} ${this.year}`;
    }

    toDate() {
        return new Date(this.year, this.month, 1);
    }

    relevantDateParts(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 0);
    }

    startOfPeriod(): Date {
        return new Date(this.year, this.month, 1);
    }

    formatTick(index: number) {
        return `${index + 1}`;
    }

    atIndex(index: number): DayDescription {
        return new DayDescription(this.year, this.month, index + 1);
    }
}

export class DayDescription extends PeriodDescription {
    readonly periodSize = "day";
    readonly graphTickPositions = "between_values";

    year: number;
    month: number;
    day: number;

    constructor(year: number, month: number, day: number) {
        super();
        this.year = year;
        this.month = month;
        this.day = day;
    }

    previous() {
        const date = new Date(this.year, this.month, this.day - 1);

        return new DayDescription(date.getFullYear(), date.getMonth(), date.getDate());
    }

    next() {
        const date = new Date(this.year, this.month, this.day + 1);
        return new DayDescription(date.getFullYear(), date.getMonth(), date.getDate());
    }

    up() {
        return new MonthDescription(this.year, this.month);
    }

    toUrl() {
        return `/day/${this.year}/${this.month + 1}/${this.day}`;
    }

    toTitle() {
        const date = new Date(this.year, this.month, this.day);

        return `${DAYS_OF_WEEK[date.getDay()]} ${this.day} ${FULL_MONTH_NAMES[this.month]} ${this.year}`;
    }

    toDate() {
        return new Date(this.year, this.month, this.day);
    }

    toShortTitle() {
        return `${this.day} ${FULL_MONTH_NAMES[this.month]} ${this.year}`;
    }

    relevantDateParts(date: Date): Date {
        return date;
    }

    static today() {
        const now = new Date();

        return new DayDescription(now.getFullYear(), now.getMonth(), now.getDate());
    }

    startOfPeriod(): Date {
        return new Date(this.year, this.month, this.day);
    }

    formatTick(index: number) {
        return `d${index}`;
    }
}

export function deserializePeriodDescription(input: any): PeriodDescription {
    switch (input.type) {
        case "DayDescription":
            return new DayDescription(input.year, input.month, input.day);
        case "MonthDescription":
            return new MonthDescription(input.year, input.month);
        case "YearDescription":
            return new YearDescription(input.year);
    }

    return DayDescription.today();
}

export function serializePeriodDescription(periodDescription: PeriodDescription): any {
    if (periodDescription instanceof DayDescription) {
        return {
            type: "DayDescription",
            year: periodDescription.year,
            month: periodDescription.month,
            day: periodDescription.day
        };
    }
    if (periodDescription instanceof MonthDescription) {
        return { type: "MonthDescription", year: periodDescription.year, month: periodDescription.month };
    }
    if (periodDescription instanceof YearDescription) {
        return { type: "YearDescription", year: periodDescription.year };
    }
}
