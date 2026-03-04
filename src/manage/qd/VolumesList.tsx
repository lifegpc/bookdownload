import { Collapse, CollapseProps, Flex, Tooltip, Alert } from "antd";
import type { Volume } from "../../qdtypes";
import styles from './VolumesList.module.css';
import { Link } from "react-router";
import { CheckCircleOutlined } from "@ant-design/icons";
import OpenInNewTab from "../../../node_modules/@material-icons/svg/svg/open_in_new/twotone.svg";
import Icon from "../../components/Icon";
import { useEffect, useMemo, useRef, useState } from "react";
import LocationSearchingTwotone from "../../../node_modules/@material-icons/svg/svg/location_searching/twotone.svg";
import { generateId } from "../../utils";

export type VolumesListProps = {
    volumes: Volume[];
    bookId: number;
    oneLine?: boolean;
    current?: number;
    loc?: [number | null, number | null] | null;
    locTip?: string;
    setLoc?: (loc: [number | null, number | null] | null) => void;
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

export default function VolumesList({ volumes, bookId, oneLine, current, loc, locTip, setLoc }: VolumesListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentVolumeId = useMemo(() => {
        if (!current) return null;
        return volumes.find(v => v.chapters.some(ch => ch.id === current))?.id ?? null;
    }, [volumes, current]);
    const name = useState(() => generateId())[0];

    const [activeKeys, setActiveKeys] = useState<string[]>([]);

    const scrollToCurrent = () => {
        if (!current || !currentVolumeId || !containerRef.current) return;

        const findChapterEl = () => containerRef.current?.querySelector<HTMLElement>(`[data-chapter-id="${current}"]`);

        if (!activeKeys.includes(currentVolumeId)) {
            setActiveKeys(prev => [...prev, currentVolumeId]);
            function checkChapterInView() {
                const el = findChapterEl();
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
            const el = findChapterEl();
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const hasLoc = loc !== undefined;
    const items = useMemo<CollapseProps['items']>(() => volumes.map(v => {
        const chCount = v.chapters.length;
        const children = v.chapters.map((chapter, index) => {
            const id = hasLoc ? generateId() : undefined;
            const curId = hasLoc ? chapter.id : null;
            const preId = hasLoc && index > 0 ? v.chapters[index - 1].id : null;
            const checked = hasLoc && loc && loc[0] === preId && loc[1] === curId;
            return <Flex className={oneLine ? styles.chone : styles.ch} key={chapter.id} data-chapter-id={chapter.id} align="center">
                {hasLoc && <input type="radio" id={id} checked={checked ?? false} onChange={() => setLoc && setLoc([preId, curId])} data-loc-id={`${preId},${curId}`} name={name} />}
                {!hasLoc && <Link to={`/qd/book/${bookId}/chapter/${chapter.id}`}>{chapter.name}</Link>}
                {hasLoc && <label htmlFor={id}>{chapter.name}</label>}
                <Flex className={styles.action}>
                    {chapter.isSaved && <CheckCircleOutlined className={styles.saved} />}
                    {chapter.id >= 0 && <Tooltip title="在起点上查看（新标签页）">
                        <Icon><OpenInNewTab fill="currentColor" width="20" className={styles.open} onClick={() => open_in_qidian(bookId, chapter.id)} /></Icon>
                    </Tooltip>}
                </Flex>
            </Flex>
        });
        if (hasLoc) {
            const id = generateId();
            const curId = v.chapters[chCount - 1].id;
            const checked = loc && loc[0] === curId && loc[1] === null;
            children.push(
                <Flex className={oneLine ? styles.chone : styles.ch} key={`loc-${v.id}`}>
                    <input type="radio" id={id} checked={checked ?? false} onChange={() => setLoc && setLoc([curId, null])} data-loc-id={`${curId},null`} name={name} />
                    <label htmlFor={id}>插入到卷末</label>
                </Flex>
            );
        }
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
    }), [volumes, bookId, oneLine, hasLoc]);
    useEffect(() => {
        if (!loc) return;
        const el = containerRef.current?.querySelector(`input[data-loc-id="${loc[0]},${loc[1]}"]`) as HTMLInputElement | null;
        if (el) {
            setTimeout(() => {
                if (!el.checked) el.checked = true;
            }, 1);
        } else {
            if (setLoc) {
                setLoc(null);
            }
        }
    }, [loc]);
    return (<div className={styles.c} ref={containerRef}>
        {hasLoc && <Alert type="info" title={locTip ?? "新章节将插入到选中的位置之前"} />}
        <div className={styles.cl}><Collapse
            key={bookId}
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(keys as string[])}
            items={items}
        /></div>
        {current && <Tooltip title="定位到当前章节" placement="left"><Icon cls={styles.current}><LocationSearchingTwotone fill="currentColor" onClick={scrollToCurrent} /></Icon></Tooltip>}
    </div>);
}
