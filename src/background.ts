import type { SendMessage, Message } from "./types";
import { createDb } from "./db/interfaces";
import type { Db } from "./db/interfaces";
import type { QdChapterInfo } from "./types";

let db: Db | null = null;

async function get_db() {
    if (!db) {
        const d = await createDb();
        await d.init();
        db = d;
    }
    return db;
}

async function save_qd_chapter_info(info: QdChapterInfo) {
    const d = await get_db();
    await d.saveQdChapter(info);
}

chrome.runtime.onMessage.addListener((message: SendMessage, sender, sendResponse) => {
    if (message.type === 'SaveQdChapterInfo') {
        save_qd_chapter_info(message.info).then(() => {
            const msg: Message = {
                ok: true,
                code: 0,
                for: 'SaveQdChapterInfo',
            };
            sendResponse(msg);
        }).catch(e => {
            const msg: Message = {
                ok: false,
                code: 1,
                msg: e instanceof Error ? e.message : 'Unknown error',
                for: 'SaveQdChapterInfo',
            };
            console.log('Failed to save chapter info:', e);
            sendResponse(msg);
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'manage',
        title: '管理数据库',
        contexts: ['action'],
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'manage') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('dist/manage.html'),
        })
    }
});
