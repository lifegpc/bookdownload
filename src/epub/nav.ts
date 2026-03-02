export interface EpubNav {
    /** The headline of the navigation item. If level not specified, h1 will be used */
    headline?: string | {
        title: string;
        level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    };
    /** The title of the navigation document. It will be used as the title element in the nav.xhtml */
    title?: string;
    items: EpubNavItem[];
}

export interface EpubNavItem {
    name: string;
    href?: string;
    children?: EpubNavItem[];
}

function create_nav_item(xhtml: HTMLDocument, ele: HTMLElement, items: EpubNavItem[]) {
    if (items.length === 0) throw new Error('At least one navigation item is required');
    const ol = xhtml.createElement('ol');
    ele.appendChild(ol);
    for (const item of items) {
        const li = xhtml.createElement('li');
        ol.appendChild(li);
        if (item.href) {
            const a = xhtml.createElement('a');
            a.setAttribute('href', item.href);
            a.textContent = item.name;
            li.appendChild(a);
        } else {
            const span = xhtml.createElement('span');
            span.textContent = item.name;
            li.appendChild(span);
        }
        if (item.children) {
            create_nav_item(xhtml, li, item.children);
        }
    }
}

export function to_nav_xhtml(nav: EpubNav) {
    if (nav.items.length === 0) throw new Error('At least one navigation item is required');
    const xhtml = document.implementation.createDocument(null, 'html', null);
    const html = xhtml.documentElement;
    xhtml.insertBefore(xhtml.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), html);
    html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    html.setAttribute('xmlns:epub', 'http://www.idpf.org/2007/ops');
    const head = xhtml.createElement('head');
    html.appendChild(head);
    const title = xhtml.createElement('title');
    title.textContent = nav.title || 'Navigation';
    head.appendChild(title);
    const body = xhtml.createElement('body');
    html.appendChild(body);
    const nav_el = xhtml.createElement('nav');
    nav_el.setAttribute('epub:type', 'toc');
    body.appendChild(nav_el);
    if (nav.headline) {
        if (typeof nav.headline === 'string') {
            const h1 = xhtml.createElement('h1');
            h1.textContent = nav.headline;
            nav_el.appendChild(h1);
        } else {
            const h = xhtml.createElement(nav.headline.level);
            h.textContent = nav.headline.title;
            nav_el.appendChild(h);
        }
    }
    create_nav_item(xhtml, nav_el, nav.items);
    return new XMLSerializer().serializeToString(xhtml);
}
