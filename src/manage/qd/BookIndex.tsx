import { Affix, Flex, Space, Tag, Typography, Skeleton, Result, Button, Modal } from "antd";
import { useBookInfo } from "./BookInfoProvider";
import styles from './BookIndex.module.css';
import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import VolumesList from "./VolumesList";
import { useEffect, useMemo, useState } from "react";
import { useDb } from "../dbProvider";
import type { Volume } from "../../qdtypes";
import { ChapterShowMode, get_new_volumes } from "../../utils/qd";
import ShowMode from "./ShowMode";
import { sendMessageToTab, waitTabLoaded } from "../../utils";
import { QdBookDownloadOptions, QdBookTxtZipOptions } from "../../types";
import SwitchLabel from "../../components/SwitchLabel";
import { useNavigate } from "react-router";

const { Paragraph, Link } = Typography;

const QD_BOOK_TAG_COLOR = ['blue', 'cyan', 'orange'];

export default function BookIndex() {
    const bookInfo = useBookInfo();
    const db = useDb();
    const [bookStatus, setBookStatus] = useBookStatus();
    const setItems = useBookContext();
    const [err, setErr] = useState<string | null>(null);
    const [saveChapterOpenSaveAs, setSaveChapterOpenSaveAs] = useState<'epub' | 'txtzip' | false>(false);
    const [downloadOptions, setDownloadOptions] = useState<QdBookDownloadOptions>({});
    const [txtzipOptions, setTxtZipOptions] = useState<QdBookTxtZipOptions>({});
    const navigate = useNavigate();
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
    async function handleSave() {
        const url = chrome.runtime.getURL('dist/download.html');
        const tab = await chrome.tabs.create({ url });
        if (tab.status !== 'complete') {
            await waitTabLoaded(tab.id!);
        }
        if (saveChapterOpenSaveAs === 'epub') {
            await sendMessageToTab(tab.id!, {
                type: 'DownloadQdBookAsEpub',
                info: bookInfo,
                options: downloadOptions,
            });
        } else if (saveChapterOpenSaveAs === 'txtzip') {
            await sendMessageToTab(tab.id!, {
                type: 'DownloadQdBookAsTxtZip',
                info: bookInfo,
                options: downloadOptions,
                txtzip: txtzipOptions,
            });
        }
    }
    useEffect(() => {
        handle();
    }, [bookInfo.id]);
    useEffect(() => {
        setItems([]);
    }, [setItems]);
    const vols = useMemo<Volume[]>(() => {
        if (bookStatus.chapterLists) {
            return get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, bookStatus.chapterShowMode);
        } else if (bookStatus.chapterShowMode != ChapterShowMode.All) {
            return [];
        }
        return bookInfo.volumes;
    }, [bookStatus.chapterLists, bookInfo.volumes, bookStatus.chapterShowMode]);
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
            <Flex align="center" className={styles.actions}>
                <Button type="primary" onClick={() => setSaveChapterOpenSaveAs('epub')}>保存为EPUB</Button>
                <Button type="primary" onClick={() => setSaveChapterOpenSaveAs('txtzip')}>保存为TXT ZIP</Button>
                <Modal
                    open={saveChapterOpenSaveAs !== false}
                    onCancel={() => setSaveChapterOpenSaveAs(false)}
                    onOk={() => {
                        setSaveChapterOpenSaveAs(false);
                        handleSave();
                    }}
                    title={`保存为${saveChapterOpenSaveAs === 'epub' ? 'EPUB' : 'TXT ZIP'}`}
                    okText="保存"
                    cancelText="取消"
                >
                    <SwitchLabel
                        checked={downloadOptions.skipNotBoughtChapters ?? false}
                        onChange={(checked) => setDownloadOptions({ ...downloadOptions, skipNotBoughtChapters: checked })}
                        label="跳过未购买章节"
                    />
                    <SwitchLabel
                        checked={downloadOptions.skipUnsavedChapters ?? false}
                        onChange={(checked) => setDownloadOptions({ ...downloadOptions, skipUnsavedChapters: checked })}
                        label="跳过未保存章节"
                    />
                    {saveChapterOpenSaveAs === 'txtzip' && (<>
                        <SwitchLabel
                            checked={txtzipOptions.addVolumeFolder ?? true}
                            onChange={(checked) => setTxtZipOptions({ ...txtzipOptions, addVolumeFolder: checked })}
                            label="为每个卷创建文件夹"
                        />
                        <SwitchLabel
                            checked={txtzipOptions.useChapterNameAsFileName ?? true}
                            onChange={(checked) => setTxtZipOptions({ ...txtzipOptions, useChapterNameAsFileName: checked })}
                            label="使用章节名称作为文件名（否则使用章节ID）"
                        />
                    </>)}
                </Modal>
                <Button onClick={() => navigate('chapter/new')}>新章节</Button>
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
