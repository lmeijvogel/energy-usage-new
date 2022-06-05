import { assertNever } from "../lib/assertNever";
import { UsageField } from "../models/UsageData";

export function unitToString(fieldName: UsageField) {
    switch (fieldName) {
        case "gas":
            return "m³";
        case "stroom":
            return "kWh";
        case "water":
            return "L";
        default:
            return assertNever(fieldName);
    }
}
