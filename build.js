import esbuild from 'esbuild';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import colors from 'colors';
import esbuildPluginEslint from 'esbuild-plugin-eslint';

const is_dev = process.argv.includes('--dev');
const is_dbg = process.argv.includes('--debug');
const no_source_map = process.argv.includes('--no-sourcemap');

function sourcemap(is_content_script = false) {
    if (no_source_map) return false;
    if (is_dev && is_content_script) return "inline";
    return true;
}

function displaySize(bytes) {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
}

/**@param {esbuild.BuildResult} result */
function displayResult(result) {
    for (const outfile in result.metafile.outputs) {
        const output = result.metafile.outputs[outfile];
        let totalInBytes = 0;
        for (const input in output.inputs) {
            const inp = result.metafile.inputs[input];
            totalInBytes += inp.bytes;
        }
        let inInfo = '';
        if (totalInBytes > 0) {
            const ratio = (output.bytes / totalInBytes * 100).toFixed(2);
            inInfo = ` - Input size: ${colors.green(displaySize(totalInBytes))} (${totalInBytes} B), Ratio: ${colors.yellow(ratio + '%')}`;
        }
        console.log(`${colors.cyan(outfile)}: ${colors.yellow(displaySize(output.bytes))} (${output.bytes} B)${inInfo}`);
    }
}

const plugins = [
    esbuildPluginEslint(),
];

async function build(name, is_content_script = true) {
    const result = await esbuild.build({
        entryPoints: [`src/${name}.ts`],
        bundle: true,
        minify: !is_dbg,
        outfile: `dist/${name}.js`,
        platform: 'browser',
        target: ['chrome100'],
        sourcemap: sourcemap(is_content_script),
        metafile: true,
        plugins,
    })
    displayResult(result);
    return result;
}

async function buildTsx(names, tsnames) {
    const entryPoints = [];
    for (const name of names) {
        entryPoints.push(`src/${name}.tsx`);
    }
    for (const name of tsnames) {
        entryPoints.push(`src/${name}.ts`);
    }
    const result = await esbuild.build({
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
        metafile: true,
        plugins,
    });
    for (const name of names) {
        const srcHtmlPath = path.join('src', `${name}.html`);
        const distHtmlPath = path.join('dist', `${name}.html`);
        fs.copyFileSync(srcHtmlPath, distHtmlPath);
    }
    displayResult(result);
    return result;
}

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
await build('qdchapter');
await build('qdbook');
await buildTsx(['popup', 'settings', 'manage'], ['background']);
