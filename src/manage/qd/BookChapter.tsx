import { Button, Result, Skeleton, Splitter } from "antd";
import { useParams, useSearchParams } from "react-router";
import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "../dbProvider";
import { QdChapterHistoryInfo, type QdChapterInfo } from "../../types";
import type { Volume } from "../../qdtypes";
import { useBookInfo } from "./BookInfoProvider";
import { ChapterShowMode, get_new_volumes } from "../../utils/qd";
import VolumesList from "./VolumesList";
import styles from './BookChapter.module.css';
import ChapterEditor from "./ChapterEditor";

export default function BookChapter() {
    const setItems = useBookContext();
    const { chapterId } = useParams();
    const id = parseInt(chapterId ?? '');
    const [bookStatus, setBookStatus] = useBookStatus();
    const db = useDb();
    const [err, setErr] = useState<string | null>(null);
    const [listErr, setListErr] = useState<string | null>(null);
    const [chapter, setChapter] = useState<QdChapterInfo | null>(null);
    const [params, setParams] = useSearchParams();
    const [history, setHistory] = useState<QdChapterHistoryInfo | null>(null);
    const bookInfo = useBookInfo();
    const editorRef = useRef<ChapterEditor>(null);
    async function load(controller?: AbortController) {
        let data: QdChapterInfo | undefined;
        const oTime = params.get("time");
        const time = oTime ? parseInt(oTime) : null;
        console.log("load chapter", { id, time, history });
        if (history && !(chapter && id !== chapter.id)) {
            if (chapter?.time === history.time) {
                return;
            }
            data = await db.getQdChapter(history.primaryKey);
            if (controller?.signal.aborted) {
                return;
            }
        } else if (time) {
            if (isNaN(time)) {
                setErr("时间戳无效");
                return;
            }
            if (chapter?.time === time) {
                return;
            }
            data = await db.getQdChapterByTime(bookInfo.id, id, time);
            if (controller?.signal.aborted) {
                return;
            }
        } else {
            const primaryKey = bookStatus.chapterLists?.find(chapter => chapter.id === id)?.primaryKey;
            data = await (primaryKey ? db.getQdChapter(primaryKey) : db.getLatestQdChapter(id));
            if (controller?.signal.aborted) {
                return;
            }
        }
        if (data) {
            if (data.id !== id) return;
            setChapter(data);
            setErr(null);
        } else {
            setErr("章节不存在");
            setChapter(null);
        }
    }
    function handle_load() {
        const controller = new AbortController();
        load(controller).catch(e => {
            if (controller.signal.aborted) {
                return;
            }
            setChapter(null);
            setErr(e instanceof Error ? e.message : String(e));
        });
        return () => {
            controller.abort();
        }
    }
    function handle_list_load() {
        if (listErr) {
            setListErr(null);
        }
        loadChapterListsIfNeeded(bookInfo.id, bookStatus, setBookStatus, db).catch(e => {
            console.log(e);
            setListErr(e instanceof Error ? e.message : String(e));
        });
    }
    const time = (chapter && id !== chapter.id) ? null : history?.time ?? (
        params.get("time") ? parseInt(params.get("time")!) : null
    )
    useEffect(() => {
        if (isNaN(id)) {
            return;
        }
        if (chapter && id !== chapter.id) {
            setChapter(null);
            if (history) {
                setHistory(null);
            }
        }
        if (err) setErr(null);
        const abort = handle_load();
        handle_list_load();
        return abort;
    }, [id, time]);
    setItems([{
        title: chapter ? `章节详情：${chapter.chapterInfo.chapterName}` : '章节详情'
    }])
    if (isNaN(id)) {
        return <Result
            status="error"
            title="章节ID无效"
        />;
    }
    const vols = useMemo(() => {
        let vols: Volume[] = bookInfo.volumes;
        if (bookStatus.chapterLists) {
            vols = get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, bookStatus.chapterShowMode);
        } else if (bookStatus.chapterShowMode != ChapterShowMode.All) {
            vols = [];
        }
        return vols;
    }, [bookInfo.volumes, bookStatus.chapterLists, bookStatus.chapterShowMode])
    return (<>
        <Splitter onResize={() => {
            setTimeout(() => {
                editorRef.current?.layout();
            }, 1);
        }}>
            <Splitter.Panel min='20%' max='40%' defaultSize='30%' collapsible className={styles.chs}>
                {bookStatus.chapterShowMode != ChapterShowMode.All && listErr && <Result status="error" title="加载章节列表失败" subTitle={listErr} extra={<Button type="primary" onClick={handle_list_load}>重试</Button>} />}
                {bookStatus.chapterShowMode != ChapterShowMode.All && !bookStatus.chapterLists && !listErr && <Skeleton active />}
                {vols.length > 0 && <VolumesList bookId={bookInfo.id} volumes={vols} oneLine key={bookInfo.id} />}
            </Splitter.Panel>
            <Splitter.Panel className={styles.chc}>
                {err && <Result
                    status="error"
                    title="数据加载失败"
                    subTitle={err}
                    extra={<Button type="primary" onClick={() => { setErr(null); handle_load(); }}>重试</Button>} />}
                {chapter && <ChapterEditor
                    ref={editorRef}
                    chapter={chapter}
                    onChapterSaveAs={setChapter}
                    history
                    onLoadHistoryItem={(item) => {
                        setHistory(item);
                        setParams({ time: item.time.toString() });
                    }}
                />}
                {!chapter && !err && <Skeleton active />}
            </Splitter.Panel>
        </Splitter>
    </>)
}
