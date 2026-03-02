import type { QdBookDownloadOptions, QdBookInfo, QdChapterInfo } from "../../types";
import { Epub } from "../../epub/base";
import { EpubNavItem } from "../../epub/nav";
import { useEffect, useState } from "react";
import { Result } from "antd";
import { ChapterShowMode, get_new_volumes } from "../../utils/qd";
import { createDb } from "../../db/interfaces";
import { get_chapter_content } from "../../utils";


export interface QdBookProps {
    info: QdBookInfo,
    options?: QdBookDownloadOptions,
    save_type: 'epub',
}

async function download_cover(url: string) {
    const response = await fetch(url, {
        method: 'GET',
    });
    if (!response.ok) {
        throw new Error(`Failed to download cover image: ${response.status} ${response.statusText}`);
    }
    return await response.blob();
}

function generate_titlepage(bookInfo: QdBookInfo) {
    const xhtml = document.implementation.createDocument(null, 'html', null);
    const html = xhtml.documentElement;
    xhtml.insertBefore(xhtml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), html);
    html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const head = xhtml.createElement('head');
    html.appendChild(head);
    const title = xhtml.createElement('title');
    title.textContent = bookInfo.bookName;
    head.appendChild(title);
    const body = xhtml.createElement('body');
    html.appendChild(body);
    const img = xhtml.createElement('img');
    img.setAttribute('src', 'cover.jpg');
    img.setAttribute('alt', 'Cover');
    body.appendChild(img);
    return new XMLSerializer().serializeToString(xhtml);
}

function generate_chapter_page(ch: QdChapterInfo) {
    const xhtml = document.implementation.createDocument(null, 'html', null);
    const html = xhtml.documentElement;
    xhtml.insertBefore(xhtml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), html);
    html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const head = xhtml.createElement('head');
    html.appendChild(head);
    const title = xhtml.createElement('title');
    title.textContent = ch.chapterInfo.chapterName;
    head.appendChild(title);
    const body = xhtml.createElement('body');
    html.appendChild(body);
    const h1 = xhtml.createElement('h1');
    h1.textContent = ch.chapterInfo.chapterName;
    body.appendChild(h1);
    const contents = ch.contents ?? get_chapter_content(ch.chapterInfo.content);
    for (const content of contents) {
        const p = xhtml.createElement('p');
        p.textContent = content;
        body.appendChild(p);
    }
    return new XMLSerializer().serializeToString(xhtml);
}

function generate_empty_chapter(title: string, status = '未保存') {
    const xhtml = document.implementation.createDocument(null, 'html', null);
    const html = xhtml.documentElement;
    xhtml.insertBefore(xhtml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), html);
    html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const head = xhtml.createElement('head');
    html.appendChild(head);
    const ti = xhtml.createElement('title');
    ti.textContent = title;
    head.appendChild(ti);
    const body = xhtml.createElement('body');
    html.appendChild(body);
    const h1 = xhtml.createElement('h1');
    h1.textContent = title + `（${status}）`;
    body.appendChild(h1);
    return new XMLSerializer().serializeToString(xhtml);
}

export default function Book({info, options, save_type}: QdBookProps) {
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState(false);
    const [total, setTotal] = useState<number>(0);
    const [current, setCurrent] = useState<number>(0);
    async function save() {
        const pickerOptions = {
            suggestedName: `${info.bookName}.${save_type}`,
            types: [{
                description: 'EPUB File',
                accept: {'application/epub+zip': ['.epub']}
            }],
        };
        const fileHandle = await window.showSaveFilePicker(pickerOptions);
        const writable = await fileHandle.createWritable();
        const epub = new Epub(writable);
        if (epub) {
            await epub.init();
            epub.package.metadata = {
                title: info.bookName,
                identifier: {
                    qd: info.id.toString(),
                },
                language: 'zho',
                author: info.bookInfo.pageJson.authorInfo.authorName,
                description: info.intro,
                subjects: info.tags.map(tag => tag.name),
            };
            epub.package.unique_identifier = 'qd';
            const cover = await download_cover(info.bookInfo.imgUrl);
            await epub.add_blob('cover.jpg', cover, {
                id: 'cover',
                media_type: cover.type,
                property: {
                    cover_image: true,
                }
            }, {level: 0});
            const titlepage = generate_titlepage(info);
            await epub.add_text('titlepage.xhtml', titlepage, {
                id: 'titlepage',
                media_type: 'application/xhtml+xml',
            });
            epub.add_spine('titlepage');
        }
        const navs: EpubNavItem[] = [
            {
                name: '标题页',
                href: 'titlepage.xhtml',
            }
        ];
        const db = await createDb();
        await db.init();
        const chapters = await db.getQdChapterSimpleInfos(info.id);
        setTotal(chapters.length);
        const mode = options?.skipUnsavedChapters ? ChapterShowMode.SavedOnly : ChapterShowMode.All;
        const skipUnsavedChapters = options?.skipUnsavedChapters ?? false;
        const skipNotBoughtChapters = options?.skipNotBoughtChapters ?? false;
        const vols = get_new_volumes(chapters, info.volumes, mode);
        const chpkeys: unknown[] = [];
        const chs: Map<unknown, QdChapterInfo> = new Map();
        const batchSize = db.batchSize();
        if (batchSize) {
            for (const ch of chapters) {
                chpkeys.push(ch.primaryKey);
            }
            let c = 0;
            while (chpkeys.length > 0) {
                const batchKeys = chpkeys.splice(0, batchSize);
                const batchChs = await db.getQdChaptersBatch(batchKeys);
                batchChs.forEach((ch, i) => {
                    if (ch) {
                        chs.set(batchKeys[i], ch);
                    }
                });
                c += batchChs.length;
                setCurrent(c);
            }
        }
        const chKeys: Map<number, unknown> = new Map();
        let c = 0;
        for (const ch of chapters) {
            chKeys.set(ch.id, ch.primaryKey);
        }
        for (const vol of vols) {
            const volNav: EpubNavItem = {
                name: vol.name,
                children: [],
            };
            for (const chapter of vol.chapters) {
                const link = `ch/${vol.id}/ch_${chapter.id}.xhtml`;
                const id = `ch${chapter.id}`.replace(/[^a-zA-Z0-9-]/g, '_');
                let page: string;
                const it: EpubNavItem = {
                    name: chapter.name,
                    href: link,
                };
                if (skipUnsavedChapters || chapter.isSaved) {
                    let ch: QdChapterInfo | undefined;
                    if (batchSize) {
                        ch = chs.get(chKeys.get(chapter.id));
                    } else {
                        ch = await db.getQdChapter(chKeys.get(chapter.id));
                    }
                    if (!ch) {
                        throw new Error(`Chapter not found: ${chapter.id}`);
                    }
                    c += 1;
                    if (!batchSize) setCurrent(c);
                    if (skipNotBoughtChapters && !ch.chapterInfo.isBuy) {
                        continue;
                    }
                    page = generate_chapter_page(ch);
                } else {
                    page = generate_empty_chapter(chapter.name);
                    it.name += '（未保存）';
                }
                if (epub) {
                    await epub.add_text(link, page, {
                        id,
                        media_type: 'application/xhtml+xml',
                    });
                    epub.add_spine(id, {
                        linear: vol.name !== '作品相关',
                    });
                }
                volNav.children!.push(it);
                if (volNav.href === undefined) {
                    volNav.href = link;
                }
            }
            if (volNav.children!.length > 0) {
                navs.push(volNav);
            }
        }
        chs.clear();
        if (epub) {
            await epub.add_nav({
                items: navs,
            });
            await epub.save();
            setOk(true);
        }
    }
    useEffect(() => {
        save().catch(e => {
            console.warn(e);
            setErr(e instanceof Error ? e.message : String(e));
        });
    }, []);
    return (<>
        {err && <Result title="保存失败" status="error" subTitle={err} />}
        {ok && <Result title="保存成功" status="success" />}
        {total > 0 && !ok && <div>正在保存章节 {current} / {total}</div>}
    </>);
}
