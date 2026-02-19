import { Button, Result } from "antd";
import { useParams } from "react-router";
import { useBookContext, useBookStatus } from "./BookStatusProvider";
import { useEffect, useState } from "react";
import { useDb } from "../dbProvider";
import type { QdChapterInfo } from "../../types";
import MonacoEditor from 'react-monaco-editor';

export default function BookChapter() {
    const setItems = useBookContext();
    const { chapterId } = useParams();
    const id = parseInt(chapterId ?? '');
    const [bookStatus, setBookStatus] = useBookStatus();
    const db = useDb();
    const [err, setErr] = useState<string | null>(null);
    const [chapter, setChapter] = useState<QdChapterInfo | null>(null);
    const [chapterContent, setChapterContent] = useState<string>('');
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
    useEffect(() => {
        if (isNaN(id)) {
            return;
        }
        load().catch(e => {
            setErr(e instanceof Error ? e.message : String(e));
        });
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
    if (err) {
        return <Result
            status="error"
            title="数据加载失败"
            subTitle={err}
            extra={<Button type="primary" onClick={() => { setErr(null); load(); }}>重试</Button>} />;
    }
    return (<>
        <MonacoEditor
            value={chapterContent}
            language="plaintext"
            width="100%"
            height="calc(100vh - 50px)"
            onChange={setChapterContent}
            options={{
                wordWrap: 'on',
            }}
         />
    </>)
}
