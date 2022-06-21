import styles from "./Row.module.css";

export const Row: React.FC = ({ children }) => {
    return <div className={styles.row}>{children}</div>;
};
