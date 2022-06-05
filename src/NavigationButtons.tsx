import { PeriodDescription } from "./models/PeriodDescription";

type Props = {
    periodDescription: PeriodDescription;
    onSelect: (periodDescription: PeriodDescription) => void;
};

export function NavigationButtons({ periodDescription, onSelect }: Props) {
    const previousClicked = () => {
        onSelect(periodDescription.previous());
    };

    const nextClicked = () => {
        onSelect(periodDescription.next());
    };

    return (
        <div>
            <button onClick={previousClicked}>Previous</button>
            <button onClick={nextClicked}>Next</button>
        </div>
    );
}
