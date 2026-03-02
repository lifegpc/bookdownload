import esbuild from 'esbuild';
import colors from 'colors';
import fs from 'fs';

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

async function build(name) {
    const result = await esbuild.build({
        entryPoints: [`src/${name}.ts`],
        bundle: true,
        minify: true,
        outfile: `${name}.cjs`,
        platform: 'node',
        target: ['node18'],
        sourcemap: true,
        sourcesContent: false,
        metafile: true,
        format: 'cjs',
    })
    displayResult(result);
    return result;
}

async function generateTestFile() {
    let content = `import { runTests, waitTestsRegistered } from "./test_base";\n`;
    content += 'import process from "node:process";\n';
    const files = await fs.promises.readdir('src', {recursive: true});
    const testLists = [];
    for (const file of files) {
        if (file.endsWith('.test.ts')) {
            const name = file.slice(0, -8).replaceAll(/[./\\]/g, '_');
            content += `import ${name} from "./${file.replaceAll(/[\\]/g, '/')}";\n`;
            testLists.push(`    ${name},`);
        }
    }
    content += `const tests = [\n${testLists.join('\n')}\n];\n`;
    content += `async function run() {
    await waitTestsRegistered(tests);
    const re = await runTests();
    if (re.failure > 0) {
        process.exit(1);
    }
}
run();\n`;
    await fs.promises.writeFile('src/test.ts', content);
}

await generateTestFile();
await build('test');
