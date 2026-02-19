export type BookInfo = {
    // 主标识与基本信息
    bookId: number;
    bookName: string;
    sbookid: number;
    authorId: number;
    authorName: string;
    cAuthorId: string;

    // 分类与渠道
    chanId: number;
    chanName: string;
    chanUrl: string;
    chanAlias: string;
    subCateId: number;
    subCateName: string;
    unitCategoryId: number;
    unitSubCategoryId: number;

    // 状态与付费相关
    isVip: number;
    bookType: number;
    form: number;
    chargetype: number;
    totalprice: number;
    fineLayout: number;
    isPreCollection: number;

    // 书城状态
    bookStore: {
        member: boolean;
        app: boolean;
        story: boolean;
    };

    // 展示/状态文本
    bookStatus: string;
    actionStatus: string;
    signStatus: string;
    joinTime: string;
    collect: number;

    // 更新信息
    updChapterId: number;
    updChapterName: string;
    updTime: number;
    updChapterUrl: string;

    // 其它标识/编辑信息
    cbid: string;
    editorNickname: string;
    bookLabels: string[];
    bookTag: {
        tagName: string;
    };

    updInfo: {
        desc: string;
        tag: string;
        updStatus: string;
    };

    supplierId: string;

    interact: {
        recTicketEnable: number;
        monthTicketEnable: number;
        donateEnable: number;
    };

    // 统计与权限
    joinTimes: number;
    isSign: number;
    noRewardMonthTic: number;
    wordsCnt?: number;
    bookAllAuth: number;
};

export type ChapterExtra = {
    nextCcid: string;
    nextName: string;
    nextVipStatus: number;
    preCcid: string;
    prevName: string;
    prevVipStatus: number;
    volumeBody: boolean;
    volumeName: string;
    nextUrl: string;
    preUrl: string;
};

export type ChapterRiskInfo = {
    banId: number;
    banMessage: string;
    sessionKey: string;
    captchaAId: string;
    captchaURL: string;
    phoneNumber: string;
    gt: string;
    challenge: string;
    offline: number;
    newCaptcha: number;
    captchaType: number;
};

export type ChapterRiskbe = {
    be: number;
    message: string;
};

export type ChapterAuthorWords = {
    content: string;
};

export type ChapterInfo = {
    actualWords: number;
    authorRecommend: unknown[]; // Assuming array of unknown type, can be refined if needed
    authorSay: string;
    cbid: string;
    ccid: string;
    chapterId: number;
    chapterName: string;
    chapterOrder: number;
    chapterType: number;
    cvid: string;
    extra: ChapterExtra;
    fineLayout: number;
    freeStatus: number;
    modifyTime: number;
    multiModal: number;
    next: number;
    nextCcid: string;
    prev: number;
    prevCcid: string;
    seq: number;
    updateTime: string;
    uuid: number;
    vipStatus: number;
    volumeId: number;
    wordsCount: number;
    isFirst: number;
    content: string;
    riskInfo: ChapterRiskInfo;
    riskbe: ChapterRiskbe;
    updateTimestamp: number;
    isBuy: number;
    limitFree: number;
    authorWords: ChapterAuthorWords;
    eFW: number;
    cES: number;
    guidMark: string;
    fEnS: number;
};

export type PageContext = {
    pageContext: {
        routeParams: {
            bookId: string;
            chapterId: string;
        };
        pageProps: {
            pageData: {
                bookInfo: BookInfo;
                chapterInfo: ChapterInfo;
            };
        };
    };
};

export type BookGData = {
    chanId: number;
    checkLevel8: boolean;
    firstChapterId: number;
    imgUrl: string;
    isBookAlbum: boolean;
    isCatelog: boolean;
    isPublication: number;
    pageJson: {
        authorInfo: {
            authorId: string;
            authorName: string;
            avatar: string;
        },
        bookId: number;
        bookType: number;
        isLogin: boolean;
        isPublication: boolean;
        isSign: number;
        isVip: number;
        salesMode: number;
        signStatus: string;
    }
}

export type Chapter = {
    name: string;
    id: number;
    isSaved?: boolean;
}

export type Volume = {
    name: string;
    id: string;
    isVip: boolean;
    chapters: Chapter[];
}

export enum QdBookTagType {
    System,
    Category,
    User,
}

export type QdBookTag = {
    name: string;
    type: QdBookTagType;
    url?: string;
}
