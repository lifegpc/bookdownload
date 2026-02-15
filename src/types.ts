import * as QdTypes from "./qdtypes";

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

export type SendMessageMap = {
    GetQdChapterInfo: {};
    SaveQdChapterInfo: {
        info: QdChapterInfo;
    };
}

export type SendMessage = DiscriminatedUnion<"type", SendMessageMap>;

export type MessageMap = {
    QdChapterInfo: QdChapterInfo,
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

export type UrlParamsMap = {
    qdchapter: QdChapterUrlParams;
}

export type UrlParams = DiscriminatedUnion<"page", UrlParamsMap>;
