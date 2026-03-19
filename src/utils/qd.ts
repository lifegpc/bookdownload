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

enum MergeMode {
    PreOnly,
    NextOnly,
    All,
    AllWithNext,
    AllWithPrev,
}

const SORT_MODE: MergeMode[] = [MergeMode.PreOnly, MergeMode.NextOnly, MergeMode.All, MergeMode.AllWithNext, MergeMode.AllWithPrev];

function NextMode(mode: MergeMode) {
    const index = SORT_MODE.indexOf(mode);
    if (index === -1) return null;
    if (index === SORT_MODE.length - 1) return null;
    return SORT_MODE[index + 1];
}


export function get_new_volumes(chapterLists: QdChapterSimpleInfo[], volumes: Volume[], keepMode: ChapterShowMode): Volume[] {
    for (const ch of chapterLists) {
        // 起点使用 -1 标识，但后续处理中只识别undefined
        if (ch.id > 0) {
            if (ch.prev === -1) ch.prev = undefined;
            if (ch.next === -1) ch.next = undefined;
        }
    }
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
                chInfo.name = ch.name;
            }
        }
        let changed = false;
        let merge_mode = SORT_MODE[0];
        do {
            const current_len = needed.length;
            const not_found: QdChapterSimpleInfo[] = [];
            for (const ch of needed) {
                if ((merge_mode === MergeMode.NextOnly && ch.next && !ch.prev) || (merge_mode === MergeMode.AllWithNext && ch.prev && ch.next)) {
                    const nextVol = volMap.get(ch.next);
                    if (nextVol) {
                        const chIndex = nextVol.chapters.findIndex(c => c.id === ch.next);
                        if (chIndex !== -1) {
                            nextVol.chapters.splice(chIndex, 0, {
                                id: ch.id,
                                name: ch.name,
                                isSaved: true,
                            });
                            volMap.set(ch.id, nextVol);
                            continue;
                        }
                    }
                }
                if ((merge_mode === MergeMode.PreOnly && ch.prev && !ch.next) || (merge_mode === MergeMode.AllWithPrev && ch.prev && ch.next)) {
                    const prevVol = volMap.get(ch.prev);
                    if (prevVol) {
                        const chIndex = prevVol.chapters.findIndex(c => c.id === ch.prev);
                        if (chIndex !== -1) {
                            prevVol.chapters.splice(chIndex + 1, 0, {
                                id: ch.id,
                                name: ch.name,
                                isSaved: true,
                            });
                            volMap.set(ch.id, prevVol);
                            continue;
                        }
                    }
                }
                if (merge_mode === MergeMode.All && ch.prev && ch.next) {
                    const prevVol = volMap.get(ch.prev);
                    const nextVol = volMap.get(ch.next);
                    if (prevVol && nextVol && prevVol === nextVol) {
                        const preIndex = prevVol.chapters.findIndex(c => c.id === ch.prev);
                        const nextIndex = prevVol.chapters.findIndex(c => c.id === ch.next);
                        if (preIndex !== -1 && nextIndex !== -1 && preIndex + 1 === nextIndex) {
                            prevVol.chapters.splice(preIndex + 1, 0, {
                                id: ch.id,
                                name: ch.name,
                                isSaved: true,
                            });
                            volMap.set(ch.id, prevVol);
                            continue;
                        }
                    }
                }
                not_found.push(ch);
            }
            needed = not_found;
            changed = current_len !== needed.length;
            if (!changed) {
                const nextMode = NextMode(merge_mode);
                if (nextMode) {
                    merge_mode = nextMode;
                    changed = true;
                }
            }
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
            return vols.filter(vol => vol.chapters.length > 0);
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
