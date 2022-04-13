import { useEffect, useState } from "react";

import Chart from "react-apexcharts";

export const App = () => {
    const defaultState = {
        options: {
            chart: {
                id: "basic-bar"
            },
            xaxis: {
                categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
            }
        },
        series: [
            {
                name: "series-1",
                data: [30, 40, 45, 50, 49, 60, 70, 91]
            }
        ]
    };

    const [state, setState] = useState(defaultState);

    const setNewValues = (json: any) => {
        const labels = json.map((value: any) => value[0]);
        const values = json.map((value: any) => value[1]);

        setState({
            ...state,
            options: {
                ...state.options,
                xaxis: {
                    categories: labels
                }
            },
            series: [
                {
                    name: "gas",
                    data: values
                }
            ]
        });
    };

    useEffect(() => {
        fetch("/api/gas")
            .then((response) => response.json())
            .then((json) => setNewValues(json));
    }, []);

    return (
        <div className="app">
            <div className="row">
                <div className="mixed-chart">
                    <Chart options={state.options} series={state.series} type="bar" width="500" />
                </div>
            </div>
        </div>
    );
};

export default App;
