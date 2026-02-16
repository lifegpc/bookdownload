import type { BookGData, QdBookTag, Volume } from "./qdtypes";
import type { SendMessage, Message } from "./types";
import { QdBookTagType } from "./qdtypes";

let g_data: BookGData | undefined;

export const QD_CHAPTER_URLPATH_REGEX = /^\/chapter\/\d+\/(\d+)\/?$/;

function get_book_name() {
    const bookName = document.getElementById('bookName') as HTMLHeadingElement | null;
    if (!bookName) {
        throw new Error('Failed to find book name element');
    }
    return bookName.innerText.trim();
}

function get_book_tags() {
    const tags: QdBookTag[] = [];
    const attribute = document.querySelector('p.book-attribute');
    if (attribute) {
        for (const children of attribute.children) {
            if (children instanceof HTMLSpanElement) {
                if (children.classList.contains("dot")) {
                    continue;
                }
                tags.push({
                    type: QdBookTagType.System,
                    name: children.innerText.trim(),
                });
            } else if (children instanceof HTMLAnchorElement) {
                tags.push({
                    type: QdBookTagType.Category,
                    name: children.innerText.trim(),
                    url: children.href,
                });
            } else {
                throw new Error(`Unknown tag element: ${children.outerHTML}`);
            }
        }
    }
    const allLabel = document.querySelector('p.all-label');
    if (allLabel) {
        for (const label of allLabel.children) {
            if (label instanceof HTMLAnchorElement) {
                tags.push({
                    type: QdBookTagType.User,
                    name: label.innerText.trim(),
                    url: label.href,
                });
            } else {
                throw new Error(`Unknown user tag element: ${label.outerHTML}`);
            }
        }
    }
    return tags;
}

function get_book_intro() {
    const intro = document.getElementById('book-intro-detail') as HTMLParagraphElement | null;
    if (!intro) {
        throw new Error('Failed to find book intro element');
    }
    return intro.innerText.trim();
}

function get_book_volumes() {
    const volumes: Volume[] = [];
    const vols = document.querySelectorAll('div.catalog-volume');
    for (const vol of vols) {
        const volInput = vol.querySelector('input.input-vol') as HTMLInputElement | null;
        if (!volInput) {
            throw new Error('Failed to find volume input element');
        }
        const volId = volInput.id;
        const volName = vol.querySelector('.volume-name') as HTMLElement | null;
        if (!volName) {
            throw new Error('Failed to find volume name element');
        }
        const firstNode = volName.firstChild;
        if (!firstNode) {
            throw new Error('Volume name element has no child');
        }
        if (firstNode.nodeType !== Node.TEXT_NODE) {
            throw new Error('Volume name element first child is not a text node');
        }
        const name = firstNode.textContent?.trim() || '';
        const vipNode = volName.querySelector('span.vip');
        const volume: Volume = {
            name,
            id: volId,
            isVip: !!vipNode,
            chapters: [],
        }
        const chs = vol.querySelectorAll('li.chapter-item');
        for (const ch of chs) {
            const chName = ch.querySelector('a.chapter-name') as HTMLAnchorElement | null;
            if (!chName) {
                throw new Error('Failed to find chapter name element');
            }
            const name = chName.innerText.trim();
            const href = new URL(chName.href);
            const match = href.pathname.match(QD_CHAPTER_URLPATH_REGEX);
            if (!match) {
                throw new Error(`Chapter URL does not match expected pattern: ${chName.href}`);
            }
            const chapterId = match[1];
            volume.chapters.push({
                name,
                id: parseInt(chapterId),
            });
        }
        volumes.push(volume);
    }
    return volumes;
}

window.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data['@type'] === 'g_data') {
        g_data = data.g_data;
        console.log('Received g_data:', g_data);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const m = message as SendMessage;
    try {
        if (m.type === 'GetQdBookInfo') {
            if (!g_data) {
                const msg: Message = {
                    ok: false,
                    code: 404,
                    msg: '没有找到g_data，可能是页面数据还没有加载完成，请稍后再试或者尝试刷新页面',
                    for: m.type,
                };
                sendResponse(msg);
                return;
            }
            const bookName = get_book_name();
            const msg: Message = {
                ok: true,
                code: 0,
                body: {
                    type: 'QdBookInfo',
                    bookInfo: g_data,
                    bookName,
                    id: g_data.pageJson.bookId,
                    tags: get_book_tags(),
                    intro: get_book_intro(),
                    volumes: get_book_volumes(),
                },
                for: m.type,
            };
            sendResponse(msg);
        }
    } catch (e) {
        console.error(e);
        const msg: Message = {
            ok: false,
            code: 500,
            msg: e instanceof Error ? e.message : 'Unknown error',
            for: m.type,
        };
        sendResponse(msg);
    }
});
