import { Select } from "antd";
import { ChapterShowMode } from "../../utils/qd"

const TEXTS = {
    [ChapterShowMode.All]: "显示所有章节",
    [ChapterShowMode.SavedOnly]: "仅显示已保存章节",
    [ChapterShowMode.UnsavedOnly]: "仅显示未保存章节",
}

export interface ShowModeProps {
    mode: ChapterShowMode;
    onChange: (mode: ChapterShowMode) => void;
}

export default function ShowMode({ mode, onChange }: ShowModeProps) {
    return (
        <Select
            value={mode}
            onChange={onChange}
            options={
                Object.values(ChapterShowMode).filter(value => typeof value === 'number').map(value => ({
                    label: TEXTS[value as ChapterShowMode],
                    value,
                }))
            }
        />
    );
}
