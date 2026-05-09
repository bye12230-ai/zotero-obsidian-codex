import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';

const siteTitle = 'AI Research Knowledge Site';
const notesDir = path.resolve('notes');
const distDir = path.resolve('dist');
const assetsDir = path.join(distDir, '_site');

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const stripMdExt = (file) => file.replace(/\.md$/i, '');
const toPosix = (value) => value.split(path.sep).join('/');
const slugify = (text) => encodeURIComponent(
  text
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[\\/#?%*:|"<>.]+/g, '')
).replace(/%/g, '');

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(full);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [full] : [];
  });
}

function titleFromMarkdown(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim().replace(/[#*_`]/g, '') : fallback;
}

function preprocessMarkdown(markdown) {
  // Basic Obsidian-style wikilink support: [[Page]] and [[Page|Alias]].
  return markdown.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, page, alias) => {
    const label = alias || page;
    const href = `${page.trim().replace(/\s+/g, '-')}.html`;
    return `[${label}](${href})`;
  });
}

function createRenderer(headings) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  });

  const defaultHeadingOpen = md.renderer.rules.heading_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const inline = tokens[idx + 1];
    const level = Number(tokens[idx].tag.slice(1));
    const text = inline?.children?.filter((token) => token.type === 'text' || token.type === 'code_inline').map((token) => token.content).join('') || '';
    let id = slugify(text) || `heading-${idx}`;
    const same = headings.filter((heading) => heading.id === id || heading.id.startsWith(`${id}-`)).length;
    if (same) id = `${id}-${same + 1}`;
    tokens[idx].attrSet('id', id);
    if (level >= 2 && level <= 4) headings.push({ level, text, id });
    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const hrefIndex = tokens[idx].attrIndex('href');
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs[hrefIndex][1];
      if (/\.md(#[^\s]*)?$/i.test(href)) tokens[idx].attrs[hrefIndex][1] = href.replace(/\.md(?=#|$)/i, '.html');
      if (/^https?:\/\//i.test(href)) {
        tokens[idx].attrSet('target', '_blank');
        tokens[idx].attrSet('rel', 'noopener noreferrer');
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  return md;
}

function navHtml(pages, activeOutPath) {
  return pages.map((page) => {
    const depth = page.rel.split('/').length - 1;
    const active = page.outRel === activeOutPath ? ' aria-current="page"' : '';
    return `<a class="nav-link depth-${depth}${active ? ' active' : ''}" href="/${page.outRel}"${active}><span>${escapeHtml(page.title)}</span></a>`;
  }).join('\n');
}

function tocHtml(headings) {
  if (!headings.length) return '<p class="toc-empty">本文暂无二级标题。</p>';
  return headings.map((heading) => `<a class="toc-link level-${heading.level}" href="#${heading.id}">${escapeHtml(heading.text)}</a>`).join('\n');
}

function pageTemplate({ title, content, toc, nav, sourceRel, updatedAt }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="由 notes 目录中的 Markdown 自动生成的学术知识网站。">
  <title>${escapeHtml(title)} · ${escapeHtml(siteTitle)}</title>
  <link rel="stylesheet" href="/_site/site.css">
</head>
<body>
  <a class="skip-link" href="#content">跳到正文</a>
  <header class="topbar">
    <button class="menu-button" type="button" aria-label="打开导航" data-menu-button>☰</button>
    <a class="brand" href="/">${escapeHtml(siteTitle)}</a>
  </header>
  <div class="layout">
    <aside class="sidebar" data-sidebar>
      <div class="sidebar-title">Knowledge Notes</div>
      <nav class="site-nav" aria-label="左侧导航">
        ${nav}
      </nav>
    </aside>
    <main id="content" class="content">
      <article class="paper">
        <div class="paper-meta">
          <span>Source: ${escapeHtml(sourceRel)}</span>
          <span>Updated: ${escapeHtml(updatedAt)}</span>
        </div>
        ${content}
      </article>
    </main>
    <aside class="toc" aria-label="自动目录">
      <div class="toc-title">目录</div>
      <nav>${toc}</nav>
    </aside>
  </div>
  <script src="/_site/site.js"></script>
</body>
</html>`;
}

function writeAssets() {
  ensureDir(assetsDir);
  fs.writeFileSync(path.join(assetsDir, 'site.css'), `:root{--bg:#f7f5ef;--paper:#fffdf8;--ink:#1f2933;--muted:#667085;--line:#ded7c8;--accent:#7a4f1d;--accent2:#123c69;--nav:#f0eadf;--shadow:0 18px 45px rgba(31,41,51,.08)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Noto Serif SC","Source Han Serif SC",Georgia,"Times New Roman",serif;line-height:1.75}.skip-link{position:absolute;left:-999px;top:0;background:var(--accent2);color:white;padding:.5rem 1rem;z-index:10}.skip-link:focus{left:1rem;top:1rem}.topbar{display:none;position:sticky;top:0;z-index:20;height:56px;align-items:center;gap:.75rem;padding:0 1rem;border-bottom:1px solid var(--line);background:rgba(255,253,248,.92);backdrop-filter:blur(10px)}.brand{font-weight:700;color:var(--ink);text-decoration:none}.menu-button{border:1px solid var(--line);background:white;border-radius:8px;padding:.35rem .6rem;font-size:1.1rem}.layout{display:grid;grid-template-columns:280px minmax(0,1fr) 260px;min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;overflow:auto;padding:2rem 1.25rem;border-right:1px solid var(--line);background:var(--nav)}.sidebar-title{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:1.2rem}.site-nav{display:flex;flex-direction:column;gap:.2rem}.nav-link{display:block;color:#374151;text-decoration:none;border-radius:9px;padding:.48rem .7rem;font-size:.95rem}.nav-link.depth-1{padding-left:1.35rem}.nav-link.depth-2{padding-left:2rem}.nav-link:hover,.nav-link.active{background:#fff8ea;color:var(--accent2)}.nav-link.active{font-weight:700;box-shadow:inset 3px 0 0 var(--accent)}.content{padding:3rem clamp(1.25rem,4vw,4rem)}.paper{max-width:900px;margin:0 auto;background:var(--paper);border:1px solid var(--line);box-shadow:var(--shadow);padding:clamp(1.5rem,4vw,4rem)}.paper-meta{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--line);color:var(--muted);font-family:ui-sans-serif,system-ui,sans-serif;font-size:.82rem}.paper h1,.paper h2,.paper h3,.paper h4{line-height:1.28;color:#111827}.paper h1{font-size:clamp(2rem,4vw,3.2rem);margin:0 0 1.4rem;letter-spacing:-.02em}.paper h2{margin-top:2.4rem;padding-top:1.2rem;border-top:1px solid var(--line);font-size:1.55rem}.paper h3{margin-top:1.8rem;font-size:1.25rem}.paper h4{font-size:1.05rem}.paper p{margin:1rem 0}.paper a{color:var(--accent2);text-decoration-thickness:.08em;text-underline-offset:.18em}.paper blockquote{margin:1.5rem 0;padding:.8rem 1.2rem;border-left:4px solid var(--accent);background:#fbf4e6;color:#4b5563}.paper code{font-family:"SFMono-Regular",Consolas,monospace;background:#f1eee6;border:1px solid #e5ddcf;border-radius:5px;padding:.1rem .28rem;font-size:.9em}.paper pre{overflow:auto;background:#111827;color:#f8fafc;border-radius:12px;padding:1rem 1.2rem}.paper pre code{background:transparent;border:0;color:inherit;padding:0}.paper table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.95rem;display:block;overflow:auto}.paper th,.paper td{border:1px solid var(--line);padding:.65rem .8rem;vertical-align:top}.paper th{background:#f3ead8;text-align:left}.paper img{max-width:100%;height:auto}.toc{position:sticky;top:0;height:100vh;overflow:auto;padding:2rem 1.25rem;border-left:1px solid var(--line);background:#fbfaf7}.toc-title{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:1rem}.toc nav{display:flex;flex-direction:column;gap:.25rem}.toc-link{color:#53606f;text-decoration:none;font-family:ui-sans-serif,system-ui,sans-serif;font-size:.86rem;line-height:1.45;padding:.25rem 0}.toc-link.level-3{padding-left:1rem}.toc-link.level-4{padding-left:2rem}.toc-link:hover{color:var(--accent2)}.toc-empty{color:var(--muted);font-family:ui-sans-serif,system-ui,sans-serif;font-size:.86rem}@media (max-width:1100px){.layout{grid-template-columns:250px minmax(0,1fr)}.toc{display:none}}@media (max-width:780px){.topbar{display:flex}.layout{display:block}.sidebar{position:fixed;inset:56px auto 0 0;width:min(82vw,320px);transform:translateX(-100%);transition:transform .2s ease;z-index:30;box-shadow:var(--shadow)}body.nav-open .sidebar{transform:translateX(0)}.content{padding:1rem}.paper{padding:1.25rem}.paper h1{font-size:1.85rem}}`, 'utf-8');
  fs.writeFileSync(path.join(assetsDir, 'site.js'), `const button=document.querySelector('[data-menu-button]');button?.addEventListener('click',()=>document.body.classList.toggle('nav-open'));document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('nav-open')));`, 'utf-8');
}

function copyNoteAssets(dir = notesDir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      copyNoteAssets(full);
      continue;
    }
    if (!entry.isFile() || entry.name.toLowerCase().endsWith('.md')) continue;
    const rel = path.relative(notesDir, full);
    const target = path.join(distDir, rel);
    ensureDir(path.dirname(target));
    fs.copyFileSync(full, target);
  }
}

function build() {
  const files = walkMarkdown(notesDir).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  if (!files.length) throw new Error(`No Markdown files found in ${notesDir}`);

  ensureDir(distDir);
  writeAssets();
  copyNoteAssets();

  const pages = files.map((fullPath) => {
    const rel = toPosix(path.relative(notesDir, fullPath));
    const markdown = fs.readFileSync(fullPath, 'utf-8');
    const outRel = toPosix(path.join(path.dirname(rel), `${stripMdExt(path.basename(rel))}.html`)).replace(/^\.\//, '');
    const stat = fs.statSync(fullPath);
    return { fullPath, rel, outRel, title: titleFromMarkdown(markdown, stripMdExt(path.basename(rel))), updatedAt: stat.mtime.toISOString().slice(0, 10) };
  });

  for (const page of pages) {
    const headings = [];
    const md = createRenderer(headings);
    const markdown = preprocessMarkdown(fs.readFileSync(page.fullPath, 'utf-8'));
    const content = md.render(markdown);
    const html = pageTemplate({
      title: page.title,
      content,
      toc: tocHtml(headings),
      nav: navHtml(pages, page.outRel),
      sourceRel: page.rel,
      updatedAt: page.updatedAt,
    });
    const outFile = path.join(distDir, page.outRel);
    ensureDir(path.dirname(outFile));
    fs.writeFileSync(outFile, html, 'utf-8');
    console.log(`Built ${page.rel} -> ${page.outRel}`);
  }

  fs.copyFileSync(path.join(distDir, pages[0].outRel), path.join(distDir, 'index.html'));
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf-8');
  console.log(`Built ${pages.length} Markdown page(s).`);
}

build();
