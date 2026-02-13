import esbuild from 'esbuild';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const is_dev = process.argv.includes('--dev');
const is_dbg = process.argv.includes('--debug');
const no_source_map = process.argv.includes('--no-sourcemap');

function sourcemap(is_content_script = false) {
    if (no_source_map) return false;
    if (is_dev && is_content_script) return "inline";
    return true;
}

async function build(name, is_content_script = true) {
    return await esbuild.build({
        entryPoints: [`src/${name}.ts`],
        bundle: true,
        minify: !is_dbg,
        outfile: `dist/${name}.js`,
        platform: 'browser',
        target: ['chrome100'],
        sourcemap: sourcemap(is_content_script),
    })
}

async function buildTsx(names) {
    const entryPoints = [];
    for (const name of names) {
        entryPoints.push(`src/${name}.tsx`);
    }
    await esbuild.build({
        entryPoints: entryPoints,
        bundle: true,
        minify: !is_dbg,
        outdir: 'dist',
        platform: 'browser',
        target: ['chrome100'],
        sourcemap: sourcemap(),
        jsx: 'automatic',
        loader: { '.css': 'global-css', '.module.css': 'local-css' },
        splitting: true,
        format: 'esm',
    });
    for (const name of names) {
        const srcHtmlPath = path.join('src', `${name}.html`);
        const distHtmlPath = path.join('dist', `${name}.html`);
        fs.copyFileSync(srcHtmlPath, distHtmlPath);
    }
}

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
await build('qdchapter');
await buildTsx(['popup', 'settings']);
