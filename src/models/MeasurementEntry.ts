import { getDay } from "date-fns";

export type MeasurementEntry = {
    year: number;
    month: number;
    day: number;
    hour: number;
    weekday: number;
    gas: number;
    stroom: number;
    water: number;
    stroom_geleverd: number;
};

export function createMeasurementEntry(data: Partial<MeasurementEntry>, date = new Date()): MeasurementEntry {
    return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        weekday: getDay(date),
        gas: 0,
        stroom: 0,
        water: 0,
        stroom_geleverd: 0,
        ...data
    };
}
