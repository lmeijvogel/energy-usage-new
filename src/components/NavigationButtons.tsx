import { DayDescription, PeriodDescription } from "../models/PeriodDescription";
import styles from "./NavigationButtons.module.css";

type Props = {
    periodDescription: PeriodDescription;
    onSelect: (periodDescription: PeriodDescription) => void;
};

export function NavigationButtons({ periodDescription, onSelect }: Props) {
    const upClicked = () => {
        const newPeriodDescription = periodDescription.up();

        if (newPeriodDescription) {
            onSelect(newPeriodDescription);
        }
    };

    const previousClicked = () => {
        onSelect(periodDescription.previous());
    };

    const nextClicked = () => {
        onSelect(periodDescription.next());
    };

    const todayClicked = () => {
        onSelect(DayDescription.today());
    };

    return (
        <div className={styles.navigationButtons}>
            <div className={styles.row}>
                <NavigationButton onClick={upClicked}>Up</NavigationButton>
            </div>
            <div className={styles.row}>
                <NavigationButton onClick={previousClicked}>Previous</NavigationButton>
                <NavigationButton onClick={nextClicked}>Next</NavigationButton>
            </div>
            <div className={styles.row}>
                <NavigationButton onClick={todayClicked}>Today</NavigationButton>
            </div>
        </div>
    );
}

type NavigationButtonProps = {
    children: any;
    onClick: () => void;
};
function NavigationButton({ children, onClick }: NavigationButtonProps) {
    return (
        <button className={styles.navigationButton} onClick={onClick}>
            {children}
        </button>
    );
}
