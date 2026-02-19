import { Button, Result, Skeleton, Splitter } from "antd";
import { useParams } from "react-router";
import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import { useEffect, useRef, useState } from "react";
import { useDb } from "../dbProvider";
import type { QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';
import type { Volume } from "../../qdtypes";
import { useBookInfo } from "./BookInfoProvider";
import { get_new_volumes } from "../../utils/qd";
import VolumesList from "./VolumesList";
import styles from './BookChapter.module.css';

export default function BookChapter() {
    const setItems = useBookContext();
    const { chapterId } = useParams();
    const id = parseInt(chapterId ?? '');
    const [bookStatus, setBookStatus] = useBookStatus();
    const db = useDb();
    const [err, setErr] = useState<string | null>(null);
    const [listErr, setListErr] = useState<string | null>(null);
    const [chapter, setChapter] = useState<QdChapterInfo | null>(null);
    const [chapterContent, setChapterContent] = useState<string>('');
    const bookInfo = useBookInfo();
    const editorRef = useRef<MonacoEditorHandle>(null);
    async function load() {
        const primaryKey = bookStatus.chapterLists?.find(chapter => chapter.id === id)?.primaryKey;
        const data = await (primaryKey ? db.getQdChapter(primaryKey) : db.getLatestQdChapter(id));
        if (data) {
            setChapter(data);
            setChapterContent(data.contents ? data.contents.join('\n') : data.chapterInfo.content);
        } else {
            setErr("章节不存在");
        }
    }
    function handle_load() {
        load().catch(e => {
            setErr(e instanceof Error ? e.message : String(e));
        });
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
        if (chapterContent) setChapterContent('');
        if (err) setErr(null);
        handle_load();
        handle_list_load();
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
        vols = get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, !bookStatus.showSavedOnly);
    } else if (bookStatus.showSavedOnly) {
        vols = [];
    }
    return (<>
        <Splitter onResize={() => {
            setTimeout(() => {
                editorRef.current?.editor.layout();
            }, 1);
        }}>
            <Splitter.Panel min='20%' max='40%' defaultSize='30%' collapsible className={styles.chs}>
                {bookStatus.showSavedOnly && listErr && <Result status="error" title="加载章节列表失败" subTitle={listErr} extra={<Button type="primary" onClick={handle_list_load}>重试</Button>} />}
                {bookStatus.showSavedOnly && !bookStatus.chapterLists && !listErr && <Skeleton active />}
                {vols.length > 0 && <VolumesList bookId={bookInfo.id} volumes={vols} oneLine />}
            </Splitter.Panel>
            <Splitter.Panel className={styles.chc}>
                {err && <Result
                    status="error"
                    title="数据加载失败"
                    subTitle={err}
                    extra={<Button type="primary" onClick={() => { setErr(null); handle_load(); }}>重试</Button>} />}
                {chapter && <MonacoEditor
                    ref={editorRef}
                    value={chapterContent}
                    language="plaintext"
                    onChange={setChapterContent}
                    options={{
                        wordWrap: 'on',
                    }}
                />}
                {!chapter && !err && <Skeleton active />}
            </Splitter.Panel>
        </Splitter>
    </>)
}
