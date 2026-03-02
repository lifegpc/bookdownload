export interface EpubMetadata {
    /**The identifier is a map of identifier id to identifier value */
    identifier: Record<string, string>;
    /**The title can be a string or a map of language code to title */
    title: string | Record<string, string>;
    /**The language code or an array of language codes */
    language: string | string[];
    /**Modify time. If not specified, the current time will be used */
    modify_time?: Date;
    /**Author name */
    author?: string;
    /**A brief description of the EPUB content */
    description?: string;
    /**The subjects or keywords related to the EPUB content */
    subjects?: string[];
}

export interface EpubManifestItem {
    id: string;
    href: string;
    media_type: string;
    property?: {
        cover_image?: boolean;
        mathml?: boolean;
        nav?: boolean;
        remote_resources?: boolean;
        scripted?: boolean;
        svg?: boolean;
        switch?: boolean;
    },
    fallback?: string;
    media_overlay?: string;
}

export interface EpubItemRef {
    idref: string;
    linear?: boolean;
    property?: {
        page_spread_left?: boolean;
        page_spread_right?: boolean;
    }
}

export class EpubPackage {
    metadata?: EpubMetadata;
    unique_identifier?: string;
    manifest: EpubManifestItem[];
    spine: EpubItemRef[];
    constructor() {
        this.manifest = [];
        this.spine = [];
    }
    to_xml() {
        if (!this.metadata) throw new Error('Metadata is required');
        if (!this.unique_identifier) throw new Error('Unique identifier is required');
        if (!this.metadata.identifier[this.unique_identifier]) throw new Error('Unique identifier not found in metadata');
        if (this.manifest.length === 0) throw new Error('At least one manifest item is required');
        if (this.spine.length === 0) throw new Error('At least one spine item is required');
        const xml = document.implementation.createDocument(null, 'package', null);
        const p = xml.documentElement;
        xml.insertBefore(xml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), p);
        p.setAttribute('version', '3.0');
        p.setAttribute('xmlns', 'http://www.idpf.org/2007/opf');
        p.setAttribute('xmlns:xml', 'http://www.w3.org/XML/1998/namespace');
        p.setAttribute('unique-identifier', this.unique_identifier);
        const metadata = xml.createElement('metadata');
        p.appendChild(metadata);
        metadata.setAttribute('xmlns:dc', 'http://purl.org/dc/elements/1.1/');
        const identifiers = Object.entries(this.metadata.identifier);
        if (identifiers.length === 0) throw new Error('At least one identifier is required');
        for (const [id, value] of identifiers) {
            const identifier = xml.createElement('dc:identifier');
            identifier.setAttribute('id', id);
            identifier.textContent = value;
            metadata.appendChild(identifier);
        }
        if (typeof this.metadata.title === 'string') {
            const title = xml.createElement('dc:title');
            title.textContent = this.metadata.title;
            metadata.appendChild(title);
        } else {
            const titles = Object.entries(this.metadata.title);
            if (titles.length === 0) throw new Error('At least one title is required');
            for (const [lang, value] of titles) {
                const title = xml.createElement('dc:title');
                title.setAttribute('xml:lang', lang);
                title.textContent = value;
                metadata.appendChild(title);
            }
        }
        if (typeof this.metadata.language === 'string') {
            const language = xml.createElement('dc:language');
            language.textContent = this.metadata.language;
            metadata.appendChild(language);
        } else {
            const languages = this.metadata.language;
            if (languages.length === 0) throw new Error('At least one language is required');
            for (const lang of languages) {
                const language = xml.createElement('dc:language');
                language.textContent = lang;
                metadata.appendChild(language);
            }
        }
        const time = this.metadata.modify_time ?? new Date();
        time.setMilliseconds(0);
        const meta = xml.createElement('meta');
        meta.setAttribute('property', 'dcterms:modified');
        meta.textContent = time.toISOString().replace('.000', '');
        metadata.appendChild(meta);
        if (this.metadata.author) {
            const author = xml.createElement('dc:creator');
            author.textContent = this.metadata.author;
            author.id = 'aut';
            metadata.appendChild(author);
            const meta_author = xml.createElement('meta');
            meta_author.setAttribute('refines', '#aut');
            meta_author.setAttribute('property', 'role');
            meta_author.textContent = 'aut';
            metadata.appendChild(meta_author);
        }
        if (this.metadata.description) {
            const description = xml.createElement('dc:description');
            description.textContent = this.metadata.description;
            metadata.appendChild(description);
        }
        if (this.metadata.subjects) {
            for (const subject of this.metadata.subjects) {
                const subject_el = xml.createElement('dc:subject');
                subject_el.textContent = subject;
                metadata.appendChild(subject_el);
            }
        }
        const manifest = xml.createElement('manifest');
        p.appendChild(manifest);
        const mainfestIds = new Set(this.manifest.map(i => i.id));
        for (const i of this.manifest) {
            const item = xml.createElement('item');
            item.setAttribute('id', i.id);
            item.setAttribute('href', i.href);
            item.setAttribute('media-type', i.media_type);
            if (i.property) {
                const properties = [];
                if (i.property.cover_image) properties.push('cover-image');
                if (i.property.mathml) properties.push('mathml');
                if (i.property.nav) properties.push('nav');
                if (i.property.remote_resources) properties.push('remote-resources');
                if (i.property.scripted) properties.push('scripted');
                if (i.property.svg) properties.push('svg');
                if (i.property.switch) properties.push('switch');
                if (properties.length > 0) item.setAttribute('properties', properties.join(' '));
            }
            if (i.fallback) {
                if (!mainfestIds.has(i.fallback)) throw new Error(`Fallback item ${i.fallback} not found in manifest`);
                item.setAttribute('fallback', i.fallback);
            }
            if (i.media_overlay) {
                if (!mainfestIds.has(i.media_overlay)) throw new Error(`Media overlay item ${i.media_overlay} not found in manifest`);
                item.setAttribute('media-overlay', i.media_overlay);
            }
            manifest.appendChild(item);
        }
        const spine = xml.createElement('spine');
        p.appendChild(spine);
        for (const i of this.spine) {
            if (!mainfestIds.has(i.idref)) throw new Error(`Spine item ${i.idref} not found in manifest`);
            const itemref = xml.createElement('itemref');
            itemref.setAttribute('idref', i.idref);
            if (i.linear === false) itemref.setAttribute('linear', 'no');
            if (i.property) {
                const properties = [];
                if (i.property.page_spread_left) properties.push('page-spread-left');
                if (i.property.page_spread_right) properties.push('page-spread-right');
                if (properties.length > 0) itemref.setAttribute('properties', properties.join(' '));
            }
            spine.appendChild(itemref);
        }
        return new XMLSerializer().serializeToString(xml);
    }
}
