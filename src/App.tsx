import { useState } from "react";
import { DayDescription, MonthDescription, PeriodDescription, YearDescription } from "./models/PeriodDescription";

import { Row } from "./components/Row";
import { NavigationOverlay } from "./components/NavigationOverlay";
import { PeriodGraphs } from "./components/PeriodGraphs";
import { CarpetCharts } from "./components/CarpetCharts";
import { LinesAndGauges } from "./components/LinesAndGauges";

export type MeasurementResponse = [timestampString: string, value: number];
export type MinMaxMeasurementResponse = [timestampString: string, minValue: number, maxValue: number];

const collapsePeriods = false;
const collapseCarpets = false;

export const App = () => {
    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(DayDescription.today());

    const choosePeriod = (date: Date) => {
        const newPeriod = periodDescription.atIndex(date);

        if (
            newPeriod instanceof DayDescription ||
            newPeriod instanceof MonthDescription ||
            newPeriod instanceof YearDescription
        ) {
            setPeriodDescription(newPeriod);
        }
    };

    return (
        <NavigationOverlay periodDescription={periodDescription} onSelect={setPeriodDescription}>
            <div className="app">
                <Row collapsed={collapsePeriods}>
                    <PeriodGraphs periodDescription={periodDescription} onPeriodChosen={choosePeriod} />
                </Row>
                <Row>
                    <LinesAndGauges periodDescription={periodDescription} />
                </Row>
                {!collapseCarpets && <CarpetCharts periodDescription={periodDescription} />}
            </div>
        </NavigationOverlay>
    );
};

export default App;
