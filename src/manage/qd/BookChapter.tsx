import { Button, Result, Skeleton, Splitter } from "antd";
import { useParams } from "react-router";
import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import { useEffect, useRef, useState } from "react";
import { useDb } from "../dbProvider";
import type { QdChapterInfo } from "../../types";
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
    const bookInfo = useBookInfo();
    const editorRef = useRef<ChapterEditor>(null);
    async function load(controller?: AbortController) {
        const primaryKey = bookStatus.chapterLists?.find(chapter => chapter.id === id)?.primaryKey;
        const data = await (primaryKey ? db.getQdChapter(primaryKey) : db.getLatestQdChapter(id));
        if (controller?.signal.aborted) {
            return;
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
    useEffect(() => {
        if (isNaN(id)) {
            return;
        }
        if (chapter) setChapter(null);
        if (err) setErr(null);
        const abort = handle_load();
        handle_list_load();
        return abort;
    }, [id]);
    setItems([{
        title: chapter ? `章节详情：${chapter.chapterInfo.chapterName}` : '章节详情'
    }])
    if (isNaN(id)) {
        return <Result
            status="error"
            title="章节ID无效"
        />;
    }
    let vols: Volume[] = bookInfo.volumes;
    if (bookStatus.chapterLists) {
        vols = get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, bookStatus.chapterShowMode);
    } else if (bookStatus.chapterShowMode != ChapterShowMode.All) {
        vols = [];
    }
    return (<>
        <Splitter onResize={() => {
            setTimeout(() => {
                editorRef.current?.layout();
            }, 1);
        }}>
            <Splitter.Panel min='20%' max='40%' defaultSize='30%' collapsible className={styles.chs}>
                {bookStatus.chapterShowMode != ChapterShowMode.All && listErr && <Result status="error" title="加载章节列表失败" subTitle={listErr} extra={<Button type="primary" onClick={handle_list_load}>重试</Button>} />}
                {bookStatus.chapterShowMode != ChapterShowMode.All && !bookStatus.chapterLists && !listErr && <Skeleton active />}
                {vols.length > 0 && <VolumesList bookId={bookInfo.id} volumes={vols} oneLine />}
            </Splitter.Panel>
            <Splitter.Panel className={styles.chc}>
                {err && <Result
                    status="error"
                    title="数据加载失败"
                    subTitle={err}
                    extra={<Button type="primary" onClick={() => { setErr(null); handle_load(); }}>重试</Button>} />}
                {chapter && <ChapterEditor ref={editorRef} chapter={chapter} onChapterSaveAs={setChapter} />}
                {!chapter && !err && <Skeleton active />}
            </Splitter.Panel>
        </Splitter>
    </>)
}
