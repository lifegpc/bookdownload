import esbuild from 'esbuild';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const is_dev = process.argv.includes('--dev');
const is_dbg = process.argv.includes('--debug');
const no_source_map = process.argv.includes('--no-sourcemap');

function sourcemap() {
    if (no_source_map) return false;
    if (is_dev) return "inline";
    return true;
}

async function build(name) {
    return await esbuild.build({
        entryPoints: [`src/${name}.ts`],
        bundle: true,
        minify: !is_dbg,
        outfile: `dist/${name}.js`,
        platform: 'browser',
        target: ['chrome100'],
        sourcemap: sourcemap(),
    })
}

async function buildTsx(name) {
    await esbuild.build({
        entryPoints: [`src/${name}.tsx`],
        bundle: true,
        minify: !is_dbg,
        outfile: `dist/${name}.js`,
        platform: 'browser',
        target: ['chrome100'],
        sourcemap: sourcemap(),
        jsx: 'automatic',
        loader: { '.css': 'global-css', '.module.css': 'local-css' },
    });

    // 确保输出目录存在并写入同名 HTML
    fs.mkdirSync(path.dirname(`dist/${name}.html`), { recursive: true });
    const cssFile = `dist/${name}.css`;
    const cssLink = fs.existsSync(cssFile) ? `<link rel="stylesheet" href="./${name}.css"/>` : '';
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${name}</title>
  ${cssLink}
</head>
<body>
  <div id="root"></div>
  <script src="./${name}.js"></script>
</body>
</html>`;
    fs.writeFileSync(`dist/${name}.html`, html, 'utf8');
}

await build('qdchapter');
await buildTsx('popup');
