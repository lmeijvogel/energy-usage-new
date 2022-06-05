import { ReactElement } from "react";
import styles from "./Card.module.css";

type Props = {
    children: ReactElement | ReactElement[];
};

export function Card({ children }: Props) {
    return <div className={styles.card}>{children}</div>;
}
