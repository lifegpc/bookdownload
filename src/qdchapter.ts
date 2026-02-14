import type { PageContext } from './qdtypes';
import type { Message, SendMessage } from './types';

function getPageData(): PageContext | undefined {
    let data = document.getElementById('vite-plugin-ssr_pageContext')?.innerHTML;
    if (!data) {
        return undefined;
    }
    return JSON.parse(data);
}

let loaded = false;

function load() {
    const pageData = getPageData();
    if (!pageData) {
        console.log(`No page data found on ${window.location.href}`);
        return;
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
                // Clear encrypted content to reduce size.
                chapterInfo.content = '';
            }
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
