import { useBookContext } from "./BookStatusProvider";
import type { QdChapterInfo } from "../../types";
import { useEffect, useState } from "react";
import { useDb } from "../dbProvider";
import { useBookInfo } from "./BookInfoProvider";
import { Result, Skeleton } from "antd";

export default function BookNewChapter() {
    const setItems = useBookContext();
    const [chapter, setChapter] = useState<QdChapterInfo | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const bookInfo = useBookInfo();
    const db = useDb();
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
    return (<>
        {err && <Result title="加载失败" status="error" subTitle={err} />}
        {!err && !chapter && <Skeleton active />}
    </>);
}
