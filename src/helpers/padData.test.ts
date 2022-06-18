import { addDays, addHours } from "date-fns";
import { createMeasurementEntry, MeasurementEntry } from "../models/MeasurementEntry";
import { padData } from "./padData";

describe("padData", () => {
    it("does not pad anything if it's not necessary", () => {
        const data = generateCompleteDayData();

        const paddedData = padData(data, new Date(2022, 2, 2), "day");
        expect(paddedData.length).toEqual(data.length);
        expect(paddedData).toEqual(expect.arrayContaining(data));
    });

    it("pads day data if it is necessary", () => {
        const date = new Date(2022, 2, 2, 0);

        const add = (hours: number) => addHours(date, hours);

        const data: MeasurementEntry[] = [
            createMeasurementEntry({ stroom: 12 }, add(2)),
            createMeasurementEntry({ stroom: 15 }, add(5)),
            createMeasurementEntry({ stroom: 10 }, add(10))
        ];

        const paddedData = padData(data, new Date(2022, 2, 2), "day");

        const expected = [
            [0, 0],
            [1, 0],
            [2, 12],
            [3, 0],
            [4, 0],
            [5, 15],
            [6, 0],
            [7, 0],
            [8, 0],
            [9, 0],
            [10, 10],
            [11, 0],
            [12, 0],
            [13, 0],
            [14, 0],
            [15, 0],
            [16, 0],
            [17, 0],
            [18, 0],
            [19, 0],
            [20, 0],
            [21, 0],
            [22, 0],
            [23, 0]
        ];

        expect(paddedData.length).toEqual(24);

        expected.forEach(([hour, value], i) => {
            const currentElement = paddedData[i];

            expect(currentElement.day).toEqual(2);
            expect(currentElement.month).toEqual(2);
            expect(currentElement.year).toEqual(2022);
            expect(currentElement.hour).toEqual(hour);
            expect(currentElement.stroom).toEqual(value);
        });
    });

    it("pads month data if it is necessary", () => {
        const date = new Date(2022, 1, 1);

        const add = (days: number) => addDays(date, days);

        const data: MeasurementEntry[] = [
            createMeasurementEntry({ stroom: 12 }, add(2)),
            createMeasurementEntry({ stroom: 15 }, add(5)),
            createMeasurementEntry({ stroom: 10 }, add(10))
        ];

        const paddedData = padData(data, date, "month");

        const expected = [
            [1, 0],
            [2, 0],
            [3, 12],
            [4, 0],
            [5, 0],
            [6, 15],
            [7, 0],
            [8, 0],
            [9, 0],
            [10, 0],
            [11, 10],
            [12, 0],
            [13, 0],
            [14, 0],
            [15, 0],
            [16, 0],
            [17, 0],
            [18, 0],
            [19, 0],
            [20, 0],
            [21, 0],
            [22, 0],
            [23, 0],
            [24, 0],
            [25, 0],
            [26, 0],
            [27, 0],
            [28, 0]
        ];

        expect(paddedData.length).toEqual(28);

        for (let i = 0; i < 28; i++) {}
        expected.forEach(([day, value], i) => {
            const currentElement = paddedData[i];

            expect(currentElement.day).toEqual(day);
            expect(currentElement.month).toEqual(1);
            expect(currentElement.year).toEqual(2022);
            expect(currentElement.stroom).toEqual(value);
        });
    });
});

function generateCompleteDayData(): MeasurementEntry[] {
    let result: MeasurementEntry[] = [];

    for (let hour = 0; hour < 24; hour++) {
        result.push(createMeasurementEntry({}, new Date(2022, 2, 2, hour, 0, 0)));
    }

    return result;
}

export {};
