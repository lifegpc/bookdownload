import { SHA256 } from "@stablelib/sha256";
import type { QdChapterInfo, QdChapterSimpleInfo } from "../types";
import { get_chapter_content, toHex } from "../utils";
import type { Chapter, Volume } from "../qdtypes";

export enum ChapterShowMode {
    All,
    SavedOnly,
    UnsavedOnly,
}


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

export function get_new_volumes(chapterLists: QdChapterSimpleInfo[], volumes: Volume[], keepMode: ChapterShowMode): Volume[] {
    const vols: Volume[] = [];
    if (keepMode == ChapterShowMode.All || keepMode == ChapterShowMode.SavedOnly) {
        const chMap: Map<number, Chapter> = new Map();
        const volMap: Map<number, Volume> = new Map();
        for (const vo of volumes) {
            const vol = structuredClone(vo);
            for (const ch of vol.chapters) {
                chMap.set(ch.id, ch);
                volMap.set(ch.id, vol);
            }
            vols.push(vol);
        }
        const volCh: Chapter[] = [];
        let needed: QdChapterSimpleInfo[] = [];
        for (const ch of chapterLists) {
            const chInfo = chMap.get(ch.id);
            if (!chInfo) {
                needed.push(ch);
            } else {
                chInfo.isSaved = true;
            }
        }
        let changed = false;
        do {
            const current_len = needed.length;
            const not_found: QdChapterSimpleInfo[] = [];
            for (const ch of needed) {
                if (ch.prev) {
                    const prevVol = volMap.get(ch.prev);
                    if (prevVol) {
                        const chIndex = prevVol.chapters.findIndex(c => c.id === ch.prev);
                        if (chIndex !== -1) {
                            prevVol.chapters.splice(chIndex + 1, 0, {
                                id: ch.id,
                                name: ch.name,
                                isSaved: true,
                            });
                            continue;
                        }
                    }
                }
                if (ch.next) {
                    const nextVol = volMap.get(ch.next);
                    if (nextVol) {
                        const chIndex = nextVol.chapters.findIndex(c => c.id === ch.next);
                        if (chIndex !== -1) {
                            nextVol.chapters.splice(chIndex, 0, {
                                id: ch.id,
                                name: ch.name,
                                isSaved: true,
                            });
                            continue;
                        }
                    }
                }
                not_found.push(ch);
            }
            needed = not_found;
            changed = current_len !== needed.length;
        } while (changed && needed.length > 0);
        for (const ch of needed) {
            volCh.push({
                id: ch.id,
                name: ch.name,
                isSaved: true,
            });
        }
        if (volCh.length > 0) {
            vols.unshift({
                id: 'vol_new',
                name: '其他已保存章节',
                chapters: volCh,
                isVip: false,
            });
        }
        if (keepMode == ChapterShowMode.SavedOnly) {
            for (const vol of vols) {
                vol.chapters = vol.chapters.filter(ch => ch.isSaved);
                vol.chapters.forEach(ch => delete ch.isSaved);
            }
        }
    } else if (keepMode == ChapterShowMode.UnsavedOnly) {
        const chIds = new Set(chapterLists.map(ch => ch.id));
        for (const vol of volumes) {
            const newChs = vol.chapters.filter(ch => !chIds.has(ch.id));
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
