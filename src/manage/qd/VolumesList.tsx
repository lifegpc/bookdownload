import { Collapse, Flex } from "antd";
import type { Volume } from "../../qdtypes";
import styles from './VolumesList.module.css';
import { Link } from "react-router";

export type VolumesListProps = {
    volumes: Volume[];
    bookId: number;
}

export default function VolumesList({ volumes, bookId }: VolumesListProps) {
    return (<Collapse
        items={volumes.map(v => {
            return {
                key: v.id,
                label: v.name,
                extra: v.isVip ? <span style={{ color: 'red' }}>VIP卷</span> : null,
                children: <Flex wrap>
                    {v.chapters.map(chapter => (
                        <Link to={`/qd/book/${bookId}/chapter/${chapter.id}`} className={styles.ch} key={chapter.id}>{chapter.name}</Link>
                    ))}
                </Flex>
            }
        })}
    />);
}
