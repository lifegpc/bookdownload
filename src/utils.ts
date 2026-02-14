import type { UrlParams, SendMessage, Message } from "./types";

export const QD_CHAPTER_URLPATH_REGEX = /^\/chapter\/(\d+)\/(\d+)\/?$/;

export function parseUrlParams(url: string | URL): UrlParams | undefined {
    const u = url instanceof URL ? url : new URL(url);
    if (u.hostname.endsWith('qidian.com')) {
        const match = u.pathname.match(QD_CHAPTER_URLPATH_REGEX);
        if (match) {
            const [, bookId, chapterId] = match;
            return {
                page: 'qdchapter',
                bookId,
                chapterId,
            } as UrlParams;
        }
    }
}

export async function sendMessageToTab(tabId: number, message: SendMessage): Promise<Message> {
    return await chrome.tabs.sendMessage(tabId, message);
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error('No active tab found');
    }
    const tab = tabs[0];
    if (!tab.url) {
        throw new Error('Active tab has no URL');
    }
    return tab;
}

export function get_chapter_content(data: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const texts = doc.querySelectorAll('p');
    const content: string[] = [];
    texts.forEach((p) => {
        if (p.innerText.trim() === '') {
            return;
        }
        content.push(p.innerText);
    });
    return content;
}

export function saveAsFile(filename: string, content: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function saveConfig(key: string, config: any): Promise<void> {
    return await chrome.storage.local.set({ [key]: config });
}

export async function loadConfig<T>(key: string, defaultValue: T): Promise<T> {
    const r = await chrome.storage.local.get<{[key]: T | undefined}>(key);
    if (r[key] === undefined) {
        return defaultValue;
    }
    return r[key];
}
