import { addDays, addHours, isSameDay } from "date-fns";
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

        const data: [Date, number][] = [
            [add(2), 12],
            [add(5), 15],
            [add(10), 10]
        ];

        const paddedData = padData(data, new Date(2022, 2, 2), "day");

        const expected = [
            [add(0), 0],
            [add(1), 0],
            [add(2), 12],
            [add(3), 0],
            [add(4), 0],
            [add(5), 15],
            [add(6), 0],
            [add(7), 0],
            [add(8), 0],
            [add(9), 0],
            [add(10), 10],
            [add(11), 0],
            [add(12), 0],
            [add(13), 0],
            [add(14), 0],
            [add(15), 0],
            [add(16), 0],
            [add(17), 0],
            [add(18), 0],
            [add(19), 0],
            [add(20), 0],
            [add(21), 0],
            [add(22), 0],
            [add(23), 0]
        ];

        expect(paddedData.length).toEqual(24);
        expect(paddedData).toEqual(expect.arrayContaining(expected));
    });

    it("pads month data if it is necessary", () => {
        const date = new Date(2022, 1, 1);

        const add = (days: number) => addDays(date, days);

        const data: [Date, number][] = [
            [add(2), 12],
            [add(5), 15],
            [add(10), 10]
        ];

        const paddedData = padData(data, new Date(2022, 1, 1), "month");

        const expected = [
            [add(0), 0],
            [add(1), 0],
            [add(2), 12],
            [add(3), 0],
            [add(4), 0],
            [add(5), 15],
            [add(6), 0],
            [add(7), 0],
            [add(8), 0],
            [add(9), 0],
            [add(10), 10],
            [add(11), 0],
            [add(12), 0],
            [add(13), 0],
            [add(14), 0],
            [add(15), 0],
            [add(16), 0],
            [add(17), 0],
            [add(18), 0],
            [add(19), 0],
            [add(20), 0],
            [add(21), 0],
            [add(22), 0],
            [add(23), 0],
            [add(24), 0],
            [add(25), 0],
            [add(26), 0],
            [add(27), 0]
        ];

        expect(paddedData.length).toEqual(28);

        expected.forEach(([day, value], i) => {
            const currentElement = paddedData[i];

            expect(isSameDay(currentElement[0], day)).toBeTruthy();
            expect(currentElement[1]).toEqual(value);
        });
    });
});

function generateCompleteDayData(): [Date, number][] {
    let result: [Date, number][] = [];

    for (let hour = 0; hour < 24; hour++) {
        result.push([new Date(2022, 2, 2, hour, 0, 0), 12]);
    }

    return result;
}
export {};
