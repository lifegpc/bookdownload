import { Collapse, CollapseProps, Flex, Tooltip } from "antd";
import type { Volume } from "../../qdtypes";
import styles from './VolumesList.module.css';
import { Link } from "react-router";
import { CheckCircleOutlined } from "@ant-design/icons";
import OpenInNewTab from "../../../node_modules/@material-icons/svg/svg/open_in_new/twotone.svg";
import Icon from "../../components/Icon";
import { useMemo } from "react";

export type VolumesListProps = {
    volumes: Volume[];
    bookId: number;
    oneLine?: boolean;
}

async function open_in_qidian(bookId: number, chapterId: number) {
    const url = `https://www.qidian.com/chapter/${bookId}/${chapterId}/`;
    if (chrome && chrome.tabs) {
        try {
            const current = await chrome.tabs.getCurrent();
            await chrome.tabs.create({ url, active: true, openerTabId: current?.id, index: current ? current.index + 1 : undefined });
        } catch (e) {
            console.error('Failed to open in new tab, falling back to window.open', e);
            window.open(url, '_blank');
        }
    } else {
        window.open(url, '_blank');
    }
}

export default function VolumesList({ volumes, bookId, oneLine }: VolumesListProps) {
    const items = useMemo<CollapseProps['items']>(() => volumes.map(v => {
        const children = v.chapters.map(chapter => (
            <Flex className={oneLine ? styles.chone : styles.ch} key={chapter.id}>
                <Link to={`/qd/book/${bookId}/chapter/${chapter.id}`}>{chapter.name}</Link>
                <Flex className={styles.action}>
                    {chapter.isSaved && <CheckCircleOutlined className={styles.saved} />}
                    <Tooltip title="在起点上查看（新标签页）">
                        <Icon><OpenInNewTab fill="currentColor" width="20" className={styles.open} onClick={() => open_in_qidian(bookId, chapter.id)} /></Icon>
                    </Tooltip>
                </Flex>
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
    }), [volumes, bookId, oneLine]);
    return (<Collapse
        key={bookId}
        items={items}
    />);
}
