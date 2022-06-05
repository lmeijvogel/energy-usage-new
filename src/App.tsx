// import formatInTimeZone from "date-fns-tz/formatInTimeZone";
// import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc";
import { useCallback, useEffect, useState } from "react";
import { BarChart } from "./components/BarChart";
import { DayDescription, MonthDescription, PeriodDescription } from "./models/PeriodDescription";

import styles from "./App.module.css";
import { NavigationButtons } from "./NavigationButtons";
import { Card } from "./components/Card";
import { parseISO } from "date-fns";
import { CardTitle } from "./components/CardTitle";

// import {     zonedTimeToUtc } from 'date-fns';

const useData: () => [Date[], number[], (json: [Date, number][]) => void] = () => {
    const [labels, setLabels] = useState<Date[]>([]);
    const [values, setValues] = useState<number[]>([]);

    const update = useCallback((json: [Date, number][]) => {
        setLabels(json.map((value: [Date, number]) => new Date(value[0])));
        setValues(json.map((value: [Date, number]) => round(value[1], 3)));
    }, []);

    return [labels, values, update];
};

type JsonResponseEntry = [dateString: string, value: number];

export const App = () => {
    const [gasLabels, gasValues, updateGas] = useData();
    const [stroomLabels, stroomValues, updateStroom] = useData();
    const [waterLabels, waterValues, updateWater] = useData();

    // const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(new MonthDescription(2022, 3));
    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(new DayDescription(2022, 3, 1));
    useEffect(() => {
        const date = periodDescription.toUrl();

        fetch(`/api/${date}/gas`)
            .then((response) => response.json())
            .then((json) => json.map(([dateString, value]: JsonResponseEntry) => [parseISO(dateString), value]))
            .then(updateGas);

        fetch(`/api/${date}/stroom`)
            .then((response) => response.json())
            .then((json) => json.map(([dateString, value]: JsonResponseEntry) => [parseISO(dateString), value]))
            .then(updateStroom);

        fetch(`/api/${date}/water`)
            .then((response) => response.json())
            .then((json) =>
                json.map(([dateString, value]: [dateString: string, value: number]) => [parseISO(dateString), value])
            )
            .then(updateWater);
    }, [periodDescription, updateGas, updateStroom, updateWater]);

    const noop = () => {};
    const toString = (el: any) => el.toString();

    return (
        <div className="app">
            <div className={styles.row}>
                <h1>{periodDescription.toTitle()}</h1>
            </div>
            <div className={styles.row}>
                <Card>
                    <CardTitle label="Gas" labels={gasLabels} series={gasValues} fieldName="gas" />
                    <BarChart
                        label="Gas"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        fieldName="gas"
                        series={gasValues}
                        maxY={12}
                        color={"#e73711"}
                        onClick={noop}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={"on_value"}
                    />
                </Card>
                <Card>
                    <CardTitle label="Stroom" labels={stroomLabels} series={stroomValues} fieldName="stroom" />
                    <BarChart
                        label="Stroom"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        fieldName="stroom"
                        series={stroomValues}
                        maxY={12}
                        color={"#f0ad4e"}
                        onClick={noop}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={"on_value"}
                    />
                </Card>
                <Card>
                    <CardTitle label="Water" labels={waterLabels} series={waterValues} fieldName="water" />
                    <BarChart
                        label="Water"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        fieldName="water"
                        series={waterValues}
                        maxY={1200}
                        color={"#428bca"}
                        onClick={noop}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={"on_value"}
                    />
                </Card>
            </div>
            <NavigationButtons periodDescription={periodDescription} onSelect={setPeriodDescription} />
        </div>
    );
};

function round(v: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(v * factor) / factor;
}

export default App;
