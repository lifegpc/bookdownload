import type { PageContext } from './qdtypes';
import type { Message, SendMessage } from './types';
import { QdConfig } from './config';
import { get_chapter_content } from './utils';
import Notification from './components/Notification';

function getPageData(): PageContext | undefined {
    const data = document.getElementById('vite-plugin-ssr_pageContext')?.innerHTML;
    if (!data) {
        return undefined;
    }
    return JSON.parse(data);
}

let loaded = false;

async function load() {
    const pageData = getPageData();
    if (!pageData) {
        console.log(`No page data found on ${window.location.href}`);
        return;
    }
    const cfg = new QdConfig();
    await cfg.init();
    if (!cfg.AutoSaveChapter) {
        return;
    }
    const chapterInfo = pageData.pageContext.pageProps.pageData.chapterInfo;
    const bookInfo = pageData.pageContext.pageProps.pageData.bookInfo;
    let contents: string[] | undefined = undefined;
    if (chapterInfo.vipStatus !== 0) {
        if (!chapterInfo.isBuy) {
            Notification(`章节《${chapterInfo.chapterName}》未购买，跳过保存`, 'info');
            return;
        }
        if (chapterInfo.cES !== 0) {
            Notification(`章节《${chapterInfo.chapterName}》有特殊加密，无法保存`, 'info');
            return;
        }
        contents = getContents();
    } else {
        contents = get_chapter_content(chapterInfo.content);
    }
    if (contents.length === 0) {
        setTimeout(load, 1000);
        return;
    }
    // Clear encrypted content to reduce size.
    chapterInfo.content = '';
    const msg: SendMessage = {
        type: 'SaveQdChapterInfo',
        info: {
            chapterInfo,
            bookInfo,
            bookId: bookInfo.bookId,
            id: chapterInfo.chapterId,
            contents,
            time: Date.now(),
        },
    }
    const re: Message = await chrome.runtime.sendMessage(msg);
    if (!re.ok) {
        console.error(`Failed to save chapter info: ${re.msg}`);
        Notification(`章节《${chapterInfo.chapterName}》自动保存失败: ${re.msg}`, 'error');
    } else {
        Notification(`章节《${chapterInfo.chapterName}》已自动保存`, 'success');
    }
}

function getContents() {
    const datas: string[] = [];
    document.querySelectorAll('span.content-text').forEach(span => {
        const e = span as HTMLElement;
        datas.push(e.innerText);
    })
    return datas;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const m = message as SendMessage;
    try {
        if (m.type === 'GetQdChapterInfo') {
            const pageData = getPageData();
            if (!pageData) {
                const msg: Message = {
                    ok: false,
                    code: 404,
                    msg: 'No page data found',
                    for: m.type,
                };
                sendResponse(msg);
                return;
            }
            const chapterInfo = pageData.pageContext.pageProps.pageData.chapterInfo;
            const bookInfo = pageData.pageContext.pageProps.pageData.bookInfo;
            let contents: string[] | undefined = undefined;
            if (chapterInfo.vipStatus !== 0) {
                contents = getContents();
            } else {
                contents = get_chapter_content(chapterInfo.content);
            }
            // Clear encrypted content to reduce size.
            chapterInfo.content = '';
            const msg: Message = {
                ok: true,
                code: 0,
                body: {
                    type: 'QdChapterInfo',
                    chapterInfo,
                    bookInfo,
                    bookId: bookInfo.bookId,
                    id: chapterInfo.chapterId,
                    contents,
                    time: Date.now(),
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
})

window.addEventListener('load', () => {
    if (!loaded) {
        loaded = true;
        load();
    }
});
if (document.readyState === 'complete') {
    if (!loaded) {
        loaded = true;
        load();
    }
}
