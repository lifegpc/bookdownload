import { SHA256 } from "@stablelib/sha256";
import type { QdChapterInfo } from "../types";
import { get_chapter_content, toHex } from "../utils";

export function hash_qdchapter_info(info: QdChapterInfo): string {
    const encoder = new TextEncoder();
    const h = new SHA256();
    h.update(encoder.encode(info.bookId.toString() + '\n'));
    h.update(encoder.encode(info.bookInfo.bookName + '\n'));
    h.update(encoder.encode(info.bookInfo.authorId.toString() + '\n'));
    h.update(encoder.encode(info.bookInfo.authorName + '\n'));
    h.update(encoder.encode(info.id.toString() + '\n'));
    h.update(encoder.encode(info.chapterInfo.vipStatus.toString() + '\n'));
    h.update(encoder.encode(info.chapterInfo.isBuy.toString() + '\n'));
    h.update(encoder.encode(info.chapterInfo.updateTime + '\n'));
    h.update(encoder.encode(info.chapterInfo.chapterName + '\n'));
    if (info.contents) {
        for (const line of info.contents) {
            h.update(encoder.encode(line + '\n'));
        }
    } else {
        const content = get_chapter_content(info.chapterInfo.content);
        for (const line of content) {
            h.update(encoder.encode(line + '\n'));
        }
    }
    const hash = h.digest();
    return toHex(hash);
}
