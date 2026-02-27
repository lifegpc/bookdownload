import { Affix, Flex, Space, Tag, Typography, Skeleton, Result, Button } from "antd";
import { useBookInfo } from "./BookInfoProvider";
import styles from './BookIndex.module.css';
import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import VolumesList from "./VolumesList";
import { useEffect, useState } from "react";
import { useDb } from "../dbProvider";
import type { Volume } from "../../qdtypes";
import { ChapterShowMode, get_new_volumes } from "../../utils/qd";
import ShowMode from "./ShowMode";

const { Paragraph, Link } = Typography;

const QD_BOOK_TAG_COLOR = ['blue', 'cyan', 'orange'];

export default function BookIndex() {
    const bookInfo = useBookInfo();
    const db = useDb();
    const [bookStatus, setBookStatus] = useBookStatus();
    const setItems = useBookContext();
    const [err, setErr] = useState<string | null>(null);
    function setChapterShowMode(chapterShowMode: ChapterShowMode) {
        setBookStatus({ ...bookStatus, chapterShowMode });
    }
    function handle() {
        if (err) {
            setErr(null);
        }
        loadChapterListsIfNeeded(bookInfo.id, bookStatus, setBookStatus, db).catch(e => {
            console.log(e);
            setErr(e instanceof Error ? e.message : String(e));
        });
    }
    useEffect(() => {
        handle();
    }, [bookInfo.id]);
    setItems([]);
    let vols: Volume[] = bookInfo.volumes;
    if (bookStatus.chapterLists) {
        vols = get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, bookStatus.chapterShowMode);
    } else if (bookStatus.chapterShowMode != ChapterShowMode.All) {
        vols = [];
    }
    return (
        <div className={styles.c}>
            <Flex justify="center" align="center">
                <img className={styles.img} src={bookInfo.bookInfo.imgUrl} />
                <Space orientation="vertical" className={styles.info}>
                    <h2 className={styles.name}>{bookInfo.bookName}</h2>
                    <Paragraph className={styles.author}><span>{bookInfo.bookInfo.pageJson.authorInfo.authorName}</span> 著</Paragraph>
                    <Flex wrap justify="flex-end" gap={8} className={styles.tags}>
                        {bookInfo.tags.map((tag) => (
                            <Tag color={QD_BOOK_TAG_COLOR[tag.type]} key={tag.name} variant="outlined">{
                                tag.url ? <Link href={tag.url} target="_blank">{tag.name}</Link> : tag.name
                            }</Tag>
                        ))}
                    </Flex>
                    <Flex justify="flex-end">
                        <Tag className={styles.sign} color="green" variant="outlined">{bookInfo.bookInfo.pageJson.signStatus}</Tag>
                    </Flex>
                    <Paragraph className={styles.intro}>{bookInfo.intro.split('\n').map((line) => (
                        <>{line}<br /></>
                    ))}</Paragraph>
                </Space>
            </Flex>
            <Affix offsetTop={10}>
                <Flex justify="flex-end" className={styles.affix}>
                    <ShowMode mode={bookStatus.chapterShowMode} onChange={setChapterShowMode} />
                </Flex>
            </Affix>
            {bookStatus.chapterShowMode != ChapterShowMode.All && err && <Result status="error" title="加载章节列表失败" subTitle={err} extra={<Button type="primary" onClick={handle}>重试</Button>} />}
            {bookStatus.chapterShowMode != ChapterShowMode.All && !bookStatus.chapterLists && !err && <Skeleton active />}
            {vols.length > 0 && <VolumesList bookId={bookInfo.id} volumes={vols} />}
        </div>
    );
}
