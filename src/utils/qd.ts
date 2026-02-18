import { SHA256 } from "@stablelib/sha256";
import type { QdChapterInfo, QdChapterSimpleInfo } from "../types";
import { get_chapter_content, toHex } from "../utils";
import type { Chapter, Volume } from "../qdtypes";

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

export function get_new_volumes(chapterLists: QdChapterSimpleInfo[], volumes: Volume[], keep=true): Volume[] {
    const vols: Volume[] = [];
    if (keep) {
        const volMap: Map<number, string> = new Map();
        for (const vol of volumes) {
            const id = vol.id;
            for (const ch of vol.chapters) {
                volMap.set(ch.id, vol.name);
            }
            vols.push(vol);
        }
        const volCh: Chapter[] = [];
        for (const ch of chapterLists) {
            if (!volMap.has(ch.id)) {
                volCh.push({
                    id: ch.id,
                    name: ch.name,
                });
            }
        }
        if (volCh.length > 0) {
            vols.unshift({
                id: 'vol_new',
                name: '其他已保存章节',
                chapters: volCh,
                isVip: false,
            });
        }
    } else {
        const chIds = new Set(chapterLists.map(ch => ch.id));
        for (const vol of volumes) {
            const newChs = vol.chapters.filter(ch => chIds.has(ch.id));
            if (newChs.length > 0) {
                vols.push({
                    ...vol,
                    chapters: newChs,
                });
            }
        }
    }
    return vols;
}
