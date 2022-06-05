import { DayDescription, MonthDescription, YearDescription } from "./PeriodDescription";

describe("PeriodDescriptions", () => {
    it("should give the right URL for a DayDescription", () => {
        expect(new DayDescription(2022, 2, 3).toUrl()).toEqual("/hours/2022-03-03");
    });

    it("should give the right URL for a MonthDescription", () => {
        expect(new MonthDescription(2022, 2).toUrl()).toEqual("/days/2022-03");
    });

    it("should give the right URL for a YearDescription", () => {
        expect(new YearDescription(2022).toUrl()).toEqual("/months/2022");
    });
});
