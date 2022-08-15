import styles from "./Row.module.css";

export const Row: React.FC<{ collapsed?: boolean }> = ({ collapsed, children }) => {
    return collapsed ? null : <div className={styles.row}>{children}</div>;
};
