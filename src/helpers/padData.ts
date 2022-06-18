import { addDays, addHours, getDaysInMonth, getWeekYear } from "date-fns";
import { MeasurementEntry } from "../models/MeasurementEntry";

export function padData(
    data: MeasurementEntry[],
    startDate: Date,
    periodSize: "day" | "month" | "year"
): MeasurementEntry[] {
    const result: MeasurementEntry[] = [];

    if (periodSize === "day") {
        for (let hour = 0; hour < 24; hour++) {
            const currentDate = addHours(startDate, hour);

            const existingElement = data.find((element) => element.hour === hour);

            if (existingElement) {
                result.push(existingElement);
            } else {
                result.push({
                    year: currentDate.getFullYear(),
                    month: currentDate.getMonth(),
                    day: currentDate.getDate(),
                    hour: hour,
                    weekday: getWeekYear(currentDate),
                    gas: 0,
                    stroom: 0,
                    water: 0,
                    stroom_geleverd: 0
                });
            }
        }
        return result;
    }

    if (periodSize === "month") {
        for (let day = 0; day < getDaysInMonth(startDate); day++) {
            const currentDate = addDays(startDate, day);

            const existingElement = data.find((element) => element.day === day + 1);

            if (existingElement) {
                result.push(existingElement);
            } else {
                result.push({
                    year: currentDate.getFullYear(),
                    month: currentDate.getMonth(),
                    day: currentDate.getDate(),
                    hour: 0,
                    weekday: getWeekYear(currentDate),
                    gas: 0,
                    stroom: 0,
                    water: 0,
                    stroom_geleverd: 0
                });
            }
        }

        return result;
    }

    // For year data, don't pad anything.
    return data;
}
