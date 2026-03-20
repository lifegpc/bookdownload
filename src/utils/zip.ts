import { configure } from '@zip.js/zip.js';
let configured = false;

export function makesure_zip_configured() {
    if (!configured) {
        configure({
            useWebWorkers: false,
            useCompressionStream: true,
        })
        configured = true;
    }
}
