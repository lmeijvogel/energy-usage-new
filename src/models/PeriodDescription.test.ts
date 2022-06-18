import { DayDescription, MonthDescription, YearDescription } from "./PeriodDescription";

describe("PeriodDescriptions", () => {
    describe("toUrl", () => {
        it("should give the right URL for a DayDescription", () => {
            expect(new DayDescription(2022, 2, 3).toUrl()).toEqual("/day/2022/3/3");
        });

        it("should give the right URL for a MonthDescription", () => {
            expect(new MonthDescription(2022, 2).toUrl()).toEqual("/month/2022/3");
        });

        it("should give the right URL for a YearDescription", () => {
            expect(new YearDescription(2022).toUrl()).toEqual("/year/2022");
        });
    });

    describe("atIndex", () => {
        it("should return the correct HourDescription", () => {
            const dayDescription = new DayDescription(2022, 2, 2);

            const first = dayDescription.atIndex(0);

            expect(first.year).toEqual(2022);
            expect(first.month).toEqual(2);
            expect(first.day).toEqual(2);
            expect(first.hour).toEqual(0);

            const last = dayDescription.atIndex(23);

            expect(last.year).toEqual(2022);
            expect(last.month).toEqual(2);
            expect(last.day).toEqual(2);
            expect(last.hour).toEqual(23);
        });

        it("should return the correct DayDescription", () => {
            const monthDescription = new MonthDescription(2022, 2);

            const first = monthDescription.atIndex(0);

            expect(first.year).toEqual(2022);
            expect(first.month).toEqual(2);
            expect(first.day).toEqual(1);

            const last = monthDescription.atIndex(30);

            expect(last.year).toEqual(2022);
            expect(last.month).toEqual(2);
            expect(last.day).toEqual(31);
        });

        it("should return the correct MonthDescription", () => {
            const yearDescription = new YearDescription(2022);

            const january = yearDescription.atIndex(0);

            expect(january.year).toEqual(2022);
            expect(january.month).toEqual(0);

            const december = yearDescription.atIndex(11);

            expect(december.year).toEqual(2022);
            expect(december.month).toEqual(11);
        });
    });
});
