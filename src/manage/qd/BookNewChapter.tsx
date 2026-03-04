import { loadChapterListsIfNeeded, useBookContext, useBookStatus } from "./BookStatusProvider";
import type { QdChapterInfo } from "../../types";
import { useEffect, useMemo, useState } from "react";
import { useDb } from "../dbProvider";
import { useBookInfo } from "./BookInfoProvider";
import { Result, Skeleton, Input, Tooltip, Modal } from "antd";
import NewChapterEditor from "./NewChapterEditor";
import styles from "./BookNewChapter.module.css";
import Icon from "../../components/Icon";
import SaveOutlined from "../../../node_modules/@material-icons/svg/svg/save/outline.svg";
import ViewListOutlined from "../../../node_modules/@material-icons/svg/svg/view_list/outline.svg";
import { ChapterShowMode, get_new_volumes } from "../../utils/qd";
import VolumesList from "./VolumesList";
import { useNavigate } from "react-router";

export default function BookNewChapter() {
    const setItems = useBookContext();
    const [chapter, setChapter] = useState<QdChapterInfo | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [chapterName, setChapterName] = useState('');
    const [loc, setLoc] = useState<[number | null, number | null] | null>(null);
    const bookInfo = useBookInfo();
    const [bookStatus, setBookStatus] = useBookStatus();
    const db = useDb();
    const [openChapterList, setOpenChapterList] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    setItems([
        { title: "新章节" },
    ])
    async function load() {
        const new_id = await db.getQdNewChapterId();
        console.log("new chapter id", new_id);
        const time = Date.now();
        setChapter({
            id: new_id,
            bookId: bookInfo.id,
            contents: [],
            time,
            bookInfo: {
                bookId: bookInfo.id,
                bookName: bookInfo.bookName,
                sbookid: 0,
                authorId: Number(bookInfo.bookInfo.pageJson.authorInfo.authorId),
                authorName: bookInfo.bookInfo.pageJson.authorInfo.authorName,
                cAuthorId: '',
                chanId: bookInfo.bookInfo.chanId,
                chanName: '',
                chanUrl: '',
                chanAlias: '',
                subCateId: 0,
                subCateName: '',
                unitCategoryId: 0,
                unitSubCategoryId: 0,
                isVip: bookInfo.bookInfo.pageJson.isVip,
                bookType: bookInfo.bookInfo.pageJson.bookType,
                form: 0,
                chargetype: 0,
                totalprice: 0,
                fineLayout: 0,
                isPreCollection: 0,
                bookStore: {
                    member: false,
                    app: false,
                    story: false,
                },
                bookStatus: '',
                actionStatus: '',
                signStatus: bookInfo.bookInfo.pageJson.signStatus,
                joinTime: '',
                collect: 0,
                updChapterId: 0,
                updChapterName: '',
                updTime: 0,
                updChapterUrl: '',
                cbid: '',
                editorNickname: '',
                bookLabels: [],
                bookTag: {
                    tagName: '',
                },
                updInfo: {
                    desc: '',
                    tag: '',
                    updStatus: '',
                },
                supplierId: '',
                interact: {
                    recTicketEnable: 0,
                    monthTicketEnable: 0,
                    donateEnable: 0,
                },
                joinTimes: 0,
                isSign: bookInfo.bookInfo.pageJson.isSign,
                noRewardMonthTic: 0,
                bookAllAuth: 0,
            },
            chapterInfo: {
                actualWords: 0,
                authorRecommend: [],
                authorSay: '',
                cbid: '',
                ccid: '',
                chapterId: new_id,
                chapterName: '',
                chapterOrder: 0,
                chapterType: 0,
                cvid: '',
                extra: {
                    nextCcid: '',
                    nextName: '',
                    nextVipStatus: 0,
                    preCcid: '',
                    prevName: '',
                    prevVipStatus: 0,
                    volumeBody: false,
                    volumeName: '',
                    nextUrl: '',
                    preUrl: '',
                },
                fineLayout: 0,
                freeStatus: 0,
                modifyTime: time,
                multiModal: 0,
                nextCcid: '',
                prevCcid: '',
                seq: 0,
                updateTime: new Date(time).toISOString(),
                uuid: 0,
                vipStatus: 0,
                volumeId: 0,
                wordsCount: 0,
                isFirst: 0,
                content: '',
                riskInfo: {
                    banId: 0,
                    banMessage: '',
                    sessionKey: '',
                    captchaAId: '',
                    captchaURL: '',
                    phoneNumber: '',
                    gt: '',
                    challenge: '',
                    offline: 0,
                    newCaptcha: 0,
                    captchaType: 0,
                },
                riskbe: {
                    be: 0,
                    message: '',
                },
                updateTimestamp: time,
                isBuy: 0,
                limitFree: 0,
                authorWords: {
                    content: '',
                },
                eFW: 0,
                cES: 0,
                guidMark: '',
                fEnS: 0,
            },
        })
    }
    useEffect(() => {
        load().catch(e => {
            console.warn(e);
            setErr(e instanceof Error ? e.message : String(e));
        });
    }, []);
    useEffect(() => {
        loadChapterListsIfNeeded(bookInfo.id, bookStatus, setBookStatus, db).catch(e => {
            console.warn(e);
        });
    }, [bookInfo.id]);
    const vols = useMemo(() => {
        let vols = bookInfo.volumes;
        if (bookStatus.chapterLists) {
            vols = get_new_volumes(bookStatus.chapterLists, bookInfo.volumes, ChapterShowMode.All);
            if (vols.length > 0 && vols[0].id == 'vol_new') {
                vols.splice(0, 1);
            }
        }
        return vols;
    }, [bookInfo.volumes, bookStatus.chapterLists]);
    let saveClass = styles.save;
    const saveDisabled = !chapterName.trim() || !content.trim() || !loc;
    if (saveDisabled || isSaving) {
        saveClass += ` ${styles.disabled}`;
    }
    let locClass = styles.loc;
    if (!loc) {
        locClass += ` ${styles.unset}`;
    }
    async function handleSave() {
        if (saveDisabled) return;
        if (!chapter) return;
        if (!loc) return;
        setIsSaving(true);
        try {
            chapter.contents = content.split('\n');
            chapter.chapterInfo.chapterName = chapterName;
            chapter.chapterInfo.prev = loc[0] ?? undefined;
            chapter.chapterInfo.next = loc[1] ?? undefined;
            await db.saveQdChapter(chapter);
            setBookStatus(prev => ({
                ...prev,
                chapterLists: undefined,
            }));
            navigate(`/qd/book/${bookInfo.id}/chapter/${chapter.id}`);
        } catch (e) {
            console.warn(e);
            setIsSaving(false);
        }
    }
    return (<>
        {err && <Result title="加载失败" status="error" subTitle={err} />}
        {!err && !chapter && <Skeleton active />}
        {chapter && !err && <div className={styles.c}>
            <div className={styles.top}>
                <Input placeholder="章节名称" value={chapterName} onChange={(e) => setChapterName(e.target.value)} className={styles.name} />
                <div className={styles.actions}>
                    <Tooltip title="设置章节位置" placement="left"><Icon><ViewListOutlined fill="currentColor" className={locClass} onClick={() => setOpenChapterList(true)} /></Icon></Tooltip>
                    <Tooltip title="保存新章节" placement="left"><Icon><SaveOutlined fill="currentColor" className={saveClass} onClick={saveDisabled || isSaving ? undefined : () => handleSave()} /></Icon></Tooltip>
                </div>
                <Modal title="选择章节位置" open={openChapterList} onCancel={() => setOpenChapterList(false)} footer={null} width={{
                    sm: 400,
                    md: 600,
                    lg: 800,
                    xl: 1000,
                    xxl: 1400,
                    xxxl: 1800,
                }}>
                    <VolumesList bookId={bookInfo.id} volumes={vols} setLoc={setLoc} loc={loc} />
                </Modal>
            </div>
            <NewChapterEditor content={content} onContentChanged={setContent} className={styles.editor} />
        </div>}
    </>);
}
