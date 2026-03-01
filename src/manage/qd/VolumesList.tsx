import { Collapse, CollapseProps, Flex, Tooltip } from "antd";
import type { Volume } from "../../qdtypes";
import styles from './VolumesList.module.css';
import { Link } from "react-router";
import { CheckCircleOutlined } from "@ant-design/icons";
import OpenInNewTab from "../../../node_modules/@material-icons/svg/svg/open_in_new/twotone.svg";
import Icon from "../../components/Icon";
import { useMemo, useState } from "react";
import LocationSearchingTwotone from "../../../node_modules/@material-icons/svg/svg/location_searching/twotone.svg";

export type VolumesListProps = {
    volumes: Volume[];
    bookId: number;
    oneLine?: boolean;
    current?: number;
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

export default function VolumesList({ volumes, bookId, oneLine, current }: VolumesListProps) {
    const currentVolumeId = useMemo(() => {
        if (!current) return null;
        return volumes.find(v => v.chapters.some(ch => ch.id === current))?.id ?? null;
    }, [volumes, current]);

    const [activeKeys, setActiveKeys] = useState<string[]>([]);

    const scrollToCurrent = () => {
        if (!current || !currentVolumeId) return;

        if (!activeKeys.includes(currentVolumeId)) {
            setActiveKeys(prev => [...prev, currentVolumeId]);
            function checkChapterInView() {
                const el = document.getElementById(`chapter-${current}`);
                if (el && el.offsetParent) {
                    // Wait for the collapse animation to finish before scrolling
                    setTimeout(() => {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                } else {
                    setTimeout(checkChapterInView, 100);
                }
            }
            setTimeout(checkChapterInView, 20);
        } else {
            const el = document.getElementById(`chapter-${current}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const items = useMemo<CollapseProps['items']>(() => volumes.map(v => {
        const children = v.chapters.map(chapter => (
            <Flex className={oneLine ? styles.chone : styles.ch} key={chapter.id} id={`chapter-${chapter.id}`}>
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
    return (<div className={styles.c}>
        <div className={styles.cl}><Collapse
            key={bookId}
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(keys as string[])}
            items={items}
        /></div>
        {current && <Tooltip title="定位到当前章节" placement="left"><Icon cls={styles.current}><LocationSearchingTwotone fill="currentColor" onClick={scrollToCurrent} /></Icon></Tooltip>}
    </div>);
}
