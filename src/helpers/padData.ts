import { addDays, addHours, getDaysInMonth, isSameDay, isSameHour } from "date-fns";

export function padData(
    data: [Date, number][],
    startDate: Date,
    periodSize: "day" | "month" | "year"
): [Date, number][] {
    const result: [Date, number][] = [];

    if (periodSize === "day") {
        for (let hour = 0; hour < 24; hour++) {
            const currentDate = addHours(startDate, hour);

            const existingElement = data.find(([date, _val]) => isSameHour(date, currentDate));

            if (existingElement) {
                result.push(existingElement);
            } else {
                result.push([currentDate, 0]);
            }
        }
    }

    if (periodSize === "month") {
        for (let day = 0; day < getDaysInMonth(startDate); day++) {
            const currentDate = addDays(startDate, day);

            const existingElement = data.find(([date, _val]) => isSameDay(date, currentDate));

            if (existingElement) {
                result.push(existingElement);
            } else {
                result.push([currentDate, 0]);
            }
        }
    }

    return result;
}
