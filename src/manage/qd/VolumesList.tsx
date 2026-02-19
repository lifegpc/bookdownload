import { Collapse, Flex } from "antd";
import type { Volume } from "../../qdtypes";
import styles from './VolumesList.module.css';
import { Link } from "react-router";
import { CheckCircleOutlined } from "@ant-design/icons";

export type VolumesListProps = {
    volumes: Volume[];
    bookId: number;
    oneLine?: boolean;
}

export default function VolumesList({ volumes, bookId, oneLine }: VolumesListProps) {
    return (<Collapse
        items={volumes.map(v => {
            const children = v.chapters.map(chapter => (
                        <Flex className={oneLine ? styles.chone : styles.ch} key={chapter.id}>
                            <Link to={`/qd/book/${bookId}/chapter/${chapter.id}`}>{chapter.name}</Link>
                            {chapter.isSaved && <CheckCircleOutlined className={styles.saved} />}
                        </Flex>
                    ));
            return {
                key: v.id,
                label: v.name,
                extra: v.isVip ? <span style={{ color: 'red' }}>VIP卷</span> : null,
                children: oneLine ? <div>
                    {children}
                </div>
                : <Flex wrap>
                    {children}
                </Flex>
            }
        })}
    />);
}
