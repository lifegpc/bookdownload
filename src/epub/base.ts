import { configure, ZipWriter, TextReader, BlobReader, WritableWriter } from "@zip.js/zip.js";
import type { Reader, ReadableReader, ZipWriterAddDataOptions } from "@zip.js/zip.js";
import { EpubPackage, EpubManifestItem, EpubItemRef } from "./package";
import { EpubNav, to_nav_xhtml } from "./nav";

type StreamType<T> = Reader<T> | ReadableReader | ReadableStream | Reader<unknown>[] | ReadableReader[] | ReadableStream[];

let configured = false;

export class Epub<T extends WritableStream | WritableWriter> {
    zip: ZipWriter<T>;
    package;
    #inited;
    constructor(blob: T) {
        if (!configured) {
            configure({
                useWebWorkers: false,
                useCompressionStream: true,
            })
            configured = true;
        }
        this.zip = new ZipWriter(blob);
        this.package = new EpubPackage();
        this.#inited = false;
    }
    async init() {
        await this.zip.add('mimetype', new TextReader('application/epub+zip'), {
            level: 0,
            extendedTimestamp: false,
        });
        await this.zip.add('META-INF/container.xml', this.#container_xml());
        this.#inited = true;
    }
    async write_package() {
        if (!this.#inited) throw new Error('Epub not initialized');
        await this.zip.add('package.opf', new TextReader(this.package.to_xml()));
    }
    async save() {
        console.log('Writing package...');
        await this.write_package();
        console.log('Package written, closing zip...');
        return await this.zip.close();
    }
    async add_blob(path: string, blob: Blob, manifest: Omit<EpubManifestItem, 'href'>, options?: ZipWriterAddDataOptions) {
        await this.add_file(path, new BlobReader(blob), manifest, options);
    }
    async add_file<T>(path: string, content: StreamType<T>, manifest: Omit<EpubManifestItem, 'href'>, options?: ZipWriterAddDataOptions) {
        if (!this.#inited) throw new Error('Epub not initialized');
        await this.zip.add(path, content, options);
        this.package.manifest.push({
            ...manifest,
            href: path,
        });
    }
    add_spine(idref: string, options?: Omit<EpubItemRef, 'idref'>) {
        this.package.spine.push({
            ...options,
            idref,
        });
    }
    async add_text(path: string, text: string, manifest: Omit<EpubManifestItem, 'href'>, options?: ZipWriterAddDataOptions) {
        await this.add_file(path, new TextReader(text), manifest, options);
    }
    async add_nav(nav: EpubNav) {
        const nav_xhtml = to_nav_xhtml(nav);
        await this.add_file('nav.xhtml', new TextReader(nav_xhtml), {
            id: 'nav',
            media_type: 'application/xhtml+xml',
            property: {
                nav: true,
            },
        });
    }
    #container_xml() {
        const xml = document.implementation.createDocument(null, 'container', null)
        const container = xml.documentElement;
        xml.insertBefore(xml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), container);
        container.setAttribute('version', '1.0');
        container.setAttribute('xmlns', 'urn:oasis:names:tc:opendocument:xmlns:container');
        const rootfiles = xml.createElement('rootfiles');
        const rootfile = xml.createElement('rootfile');
        rootfile.setAttribute('full-path', 'package.opf');
        rootfile.setAttribute('media-type', 'application/oebps-package+xml');
        rootfiles.appendChild(rootfile);
        container.appendChild(rootfiles);
        return new TextReader(new XMLSerializer().serializeToString(xml));
    }
}
