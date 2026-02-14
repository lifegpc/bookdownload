import { Switch } from "antd";
import styles from "./SwitchLabel.module.css";

export type SwitchLabelProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function SwitchLabel({ label, checked, onChange }: SwitchLabelProps) {
    return (
        <div className={styles["switch-label"]}>
            <span onClick={() => onChange(!checked)}>{label}</span>
            <Switch checked={checked} onChange={onChange} />
        </div>
    );
}