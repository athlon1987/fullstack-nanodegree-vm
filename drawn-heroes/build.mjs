// Builds three outputs:
//   dist/web/          multi-file static site (index.html, game.js, game.css, assets/)
//   dist/single/       one self-contained HTML file (images inlined) for offline play
//   dist/artifact/     the same single file as a page fragment for claude.ai Artifacts
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(root, 'dist');
const serve = process.argv.includes('--serve');
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const body = fs.readFileSync(path.join(root, 'body.html'), 'utf8');

const common = {
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  minify: !serve,
  sourcemap: serve,
  target: ['es2019', 'safari13', 'chrome80', 'firefox78'],
  logLevel: 'warning',
};

async function buildWeb() {
  const out = path.join(dist, 'web');
  fs.rmSync(out, { recursive: true, force: true });
  await esbuild.build({ ...common, outfile: path.join(out, 'game.js'), loader: { '.png': 'file' }, assetNames: 'assets/[name]-[hash]', publicPath: '.' });
  const html = template
    .replace('<!--STYLE-->', '<link rel="stylesheet" href="game.css">')
    .replace('<!--BODY-->', body)
    .replace('<!--SCRIPT-->', '<script src="game.js"></script>');
  fs.writeFileSync(path.join(out, 'index.html'), html);
  return out;
}

async function buildSingle() {
  const r = await esbuild.build({ ...common, sourcemap: false, minify: true, write: false, outdir: 'mem', loader: { '.png': 'dataurl' } });
  const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
  const css = r.outputFiles.find((f) => f.path.endsWith('.css')).text;
  const single = template
    .replace('<!--STYLE-->', `<style>${css}</style>`)
    .replace('<!--BODY-->', body)
    .replace('<!--SCRIPT-->', `<script>${js}</script>`);
  fs.mkdirSync(path.join(dist, 'single'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'single', 'ink-rush.html'), single);
  // Artifact fragment: the host supplies doctype/head/body, so only title, styles, markup and script.
  const fragment = [
    '<title>Momo &amp; Scout Ink Rush</title>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Patrick+Hand&display=swap">',
    `<style>${css}</style>`,
    body,
    `<script>${js}</script>`,
  ].join('\n');
  fs.mkdirSync(path.join(dist, 'artifact'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'artifact', 'ink-rush.html'), fragment);
  return single.length;
}

if (serve) {
  const out = path.join(dist, 'web');
  await buildWeb();
  const ctx = await esbuild.context({ ...common, outfile: path.join(out, 'game.js'), loader: { '.png': 'file' }, assetNames: 'assets/[name]-[hash]', publicPath: '.' });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: Number(process.env.PORT ?? 8080), host: '0.0.0.0' });
  console.log(`Serving http://localhost:${port}`);
} else {
  const out = await buildWeb();
  const size = await buildSingle();
  console.log(`web build: ${path.relative(root, out)}  single file: ${(size / 1024).toFixed(0)} KB`);
}
