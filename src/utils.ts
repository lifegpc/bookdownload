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

/**
 * Compress data using CompressionStream API. The result is a Uint8Array with the first 4 bytes representing the original data length (little-endian), followed by the compressed data.
 */
export async function compress(data: BufferSource, method: CompressionFormat = 'deflate'): Promise<Uint8Array<ArrayBuffer>> {
    if (typeof CompressionStream === 'undefined') {
        throw new Error('CompressionStream is not supported in this browser');
    }
    const stream = new CompressionStream(method);
    const writer = stream.writable.getWriter();
    const dataLength = data.byteLength;
    writer.write(data);
    writer.close();
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        totalLength += value.length;
    }
    const result = new Uint8Array(totalLength + 4);
    const view = new DataView(result.buffer);
    view.setUint32(0, dataLength, true);
    let offset = 4;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

/**
 * Decompress data using DecompressionStream API. The input should be a Uint8Array where the first 4 bytes represent the original data length (little-endian), followed by the compressed data. The output is a Uint8Array containing the decompressed data.
 */
export async function decompress(data: BufferSource, method: CompressionFormat = 'deflate'): Promise<Uint8Array<ArrayBuffer>> {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error('DecompressionStream is not supported in this browser');
    }
    const stream = new DecompressionStream(method);
    const view = new DataView(data instanceof ArrayBuffer ? data : data.buffer);
    const originalLength = view.getUint32(0, true);
    const writer = stream.writable.getWriter();
    writer.write(view.buffer.slice(4));
    writer.close();
    const reader = stream.readable.getReader();
    const result = new Uint8Array(originalLength);
    let offset = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        result.set(value, offset);
        offset += value.length;
    }
    return result;
}

export function ToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
