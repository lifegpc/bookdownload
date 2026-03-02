import type * as QdTypes from "./qdtypes";

export type DiscriminatedUnion<
    K extends PropertyKey,
    T extends Record<PropertyKey, unknown>,
> = {
    [P in keyof T]: ({ [Q in K]: P } & T[P]) extends infer U
        ? { [Q in keyof U]: U[Q] }
        : never;
}[keyof T];

export type QdChapterInfo = {
    chapterInfo: QdTypes.ChapterInfo;
    bookInfo: QdTypes.BookInfo;
    bookId: number;
    /**Chapter ID */
    id: number;
    /**Decrypted contents of the chapter. May not obtained if chapter is a free chapter */
    contents?: string[];
    /**Timestamp of the chapter */
    time: number;
    hash?: string;
}

export type QdChapterSimpleInfo = {
    primaryKey: unknown;
    id: number;
    name: string;
    bookId: number;
    time: number;
    /// Previous chapter ID
    prev?: number;
    /// Next chapter ID
    next?: number;
}

export type QdChapterHistoryInfo = {
    primaryKey: unknown;
    name: string;
    time: number;
}

export type QdBookInfo = {
    bookInfo: QdTypes.BookGData;
    bookName: string;
    /**Book ID */
    id: number;
    tags: QdTypes.QdBookTag[];
    intro: string;
    volumes: QdTypes.Volume[];
}

export interface QdBookDownloadOptions {
    skipUnsavedChapters?: boolean;
    skipNotBoughtChapters?: boolean;
}

export type SendMessageMap = {
    GetQdChapterInfo: {};
    GetQdBookInfo: {};
    SaveQdChapterInfo: {
        info: QdChapterInfo;
    };
    DownloadQdBookAsEpub: {
        info: QdBookInfo;
        options?: QdBookDownloadOptions;
    }
}

export type SendMessage = DiscriminatedUnion<"type", SendMessageMap>;

export type MessageMap = {
    QdChapterInfo: QdChapterInfo,
    QdBookInfo: QdBookInfo,
};

export type MessageBody = DiscriminatedUnion<"type", MessageMap>;

export type Message = {
    ok: boolean;
    /**error code, 0 for success */
    code: number;
    msg?: string;
    body?: MessageBody;
    for: keyof SendMessageMap;
};

export type QdChapterUrlParams = {
    bookId: string;
    chapterId: string;
}

export type QdBookUrlParams = {
    bookId: string;
}

export type UrlParamsMap = {
    qdchapter: QdChapterUrlParams;
    qdbook: QdBookUrlParams;
}

export type UrlParams = DiscriminatedUnion<"page", UrlParamsMap>;

export type PagedData<T> = {
    /**Total number of items */
    total: number;
    /**Start at 1*/
    page: number;
    /**Total number of pages */
    totalPages: number;
    pageSize: number;
    items: T[];
}
