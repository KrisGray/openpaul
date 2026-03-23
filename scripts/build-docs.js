#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
let marked;

async function loadMarked() {
  try {
    const mod = await import('marked');
    marked = mod.marked ?? mod.default ?? mod;
  } catch (error) {
    const mod = require('marked');
    marked = mod.marked ?? mod;
  }
}

const CSS = `
:root {
  --bg: #ffffff;
  --fg: #1f2328;
  --muted: #656d76;
  --accent: #0969da;
  --accent-hover: #0550ae;
  --border: #d0d7de;
  --code-bg: #f6f8fa;
  --card-bg: #f6f8fa;
  --success: #1a7f37;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
    --muted: #8b949e;
    --accent: #58a6ff;
    --accent-hover: #79c0ff;
    --border: #30363d;
    --code-bg: #161b22;
    --card-bg: #161b22;
    --success: #3fb950;
  }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
  line-height: 1.6;
  color: var(--fg);
  background: var(--bg);
}
.container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

header {
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 100;
}
header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo { font-size: 1.5rem; font-weight: 700; }
.logo a { color: var(--fg); text-decoration: none; }
nav { display: flex; gap: 1.5rem; align-items: center; }
nav a { color: var(--muted); text-decoration: none; font-size: 0.95rem; }
nav a:hover, nav a.active { color: var(--accent); }

main { padding: 3rem 0; }

.page-title {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.page-title h1 { font-size: 2rem; }

.content h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
.content h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; }
.content h4 { font-size: 1.1rem; margin: 1.25rem 0 0.5rem; }
.content p { margin-bottom: 1rem; }
.content ul, .content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
.content li { margin-bottom: 0.5rem; }
.content a { color: var(--accent); }

pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}
code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 0.9em;
}
pre code { background: none; padding: 0; font-size: inherit; }
:not(pre) > code {
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
th, td {
  border: 1px solid var(--border);
  padding: 0.75rem 1rem;
  text-align: left;
}
th { background: var(--card-bg); font-weight: 600; }

blockquote {
  border-left: 4px solid var(--accent);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--muted);
}

footer {
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  text-align: center;
  color: var(--muted);
}
footer a { color: var(--accent); }

.pill {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.85rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

.hero {
  text-align: center;
  padding: 3rem 0;
}
.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.hero .tagline {
  font-size: 1.25rem;
  color: var(--muted);
  margin-bottom: 2rem;
}
.hero .cta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.hero .cta a {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}
.hero .cta .primary {
  background: var(--accent);
  color: #fff;
}
.hero .cta .secondary {
  border: 1px solid var(--border);
  color: var(--fg);
}
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 3rem 0;
}
.feature {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
}
.feature h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}
.feature p {
  margin-bottom: 0;
  color: var(--muted);
}
`;

function generatePage(title, body, basePath, activeNav) {
  const navItems = [
    { href: basePath + '/', label: 'Quick Start', anchor: '#quick-start' },
    { href: basePath + '/guides/', label: 'Guides', key: 'guides' },
    { href: basePath + '/tutorials/', label: 'Tutorials', key: 'tutorials' },
    { href: basePath + '/api/', label: 'API', key: 'api' },
    { href: 'https://github.com/KrisGray/openpaul', label: 'GitHub' }
  ];
  
  const navHtml = navItems.map(item => {
    const isActive = item.key === activeNav ? ' class="active"' : '';
    const href = item.anchor ? item.href + item.anchor : item.href;
    return `<a href="${href}"${isActive}>${item.label}</a>`;
  }).join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | OpenPAUL</title>
  <meta name="description" content="OpenPAUL - Plan-Apply-Unify Loop for structured AI-assisted development">
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo"><a href="${basePath}/">OpenPAUL</a></div>
      <nav>
        ${navHtml}
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="page-title">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
  </main>

  <footer>
    <div class="container">
      <p>
        <a href="https://github.com/KrisGray/openpaul">OpenPAUL</a> — 
        Plan-Apply-Unify Loop for structured AI development.
      </p>
      <p style="margin-top: 0.5rem; font-size: 0.9rem;">
        Created by <a href="https://github.com/KrisGray">Kris Gray</a>
      </p>
    </div>
  </footer>
</body>
</html>`;
}

function generateHomePage(basePath) {
  const navItems = [
    { href: basePath + '/', label: 'Quick Start', anchor: '#quick-start', key: 'home' },
    { href: basePath + '/guides/', label: 'Guides', key: 'guides' },
    { href: basePath + '/tutorials/', label: 'Tutorials', key: 'tutorials' },
    { href: basePath + '/api/', label: 'API', key: 'api' },
    { href: 'https://github.com/KrisGray/openpaul', label: 'GitHub' }
  ];
  
  const navHtml = navItems.map(item => {
    const isActive = item.key === 'home' ? ' class="active"' : '';
    const href = item.anchor ? item.href + item.anchor : item.href;
    return `<a href="${href}"${isActive}>${item.label}</a>`;
  }).join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenPAUL - Plan-Apply-Unify Loop</title>
  <meta name="description" content="OpenPAUL - Structured AI-assisted development for OpenCode">
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo"><a href="${basePath}/">OpenPAUL</a></div>
      <nav>
        ${navHtml}
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <h1>OpenPAUL</h1>
      <p class="tagline">Plan-Apply-Unify Loop — Structured AI-assisted development</p>
      <div class="cta">
        <a href="${basePath}/install/" class="primary">Get Started</a>
        <a href="${basePath}/guides/" class="secondary">Read Guides</a>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>Loop Integrity</h3>
        <p>Every plan closes with UNIFY. No orphan plans, no forgotten decisions.</p>
      </div>
      <div class="feature">
        <h3>In-Session Context</h3>
        <p>Keep development in-session with properly managed context. Quality over subagent sprawl.</p>
      </div>
      <div class="feature">
        <h3>Acceptance-Driven</h3>
        <p>Acceptance criteria are first-class citizens. Define done before starting.</p>
      </div>
      <div class="feature">
        <h3>State Persistence</h3>
        <p>Resume work across sessions. State, decisions, and progress are always preserved.</p>
      </div>
    </div>

    <div class="content">
      <h2 id="quick-start">Quick Start</h2>
      <pre><code># Initialize OpenPAUL in your project
npx openpaul

# Inside OpenCode, use the loop
/openpaul:plan     # Create an executable plan
/openpaul:apply    # Execute the plan
/openpaul:unify    # Close the loop (required!)</code></pre>

      <h2>Documentation</h2>
      <ul>
        <li><a href="${basePath}/install/">Installation Guide</a> — Get OpenPAUL running</li>
        <li><a href="${basePath}/guides/">Guides</a> — Core concepts and workflows</li>
        <li><a href="${basePath}/tutorials/">Tutorials</a> — Step-by-step learning</li>
        <li><a href="${basePath}/api/">API Reference</a> — TypeDoc generated docs</li>
      </ul>

      <h2>With OpenCARL (Recommended)</h2>
      <p>For the best experience, use OpenPAUL with <a href="https://github.com/KrisGray/opencarl">OpenCARL</a> — a dynamic rule injection system that enforces workflow discipline automatically.</p>
      <pre><code># Initialize both
npx openpaul
npx opencarl --local</code></pre>
    </div>
  </main>

  <footer>
    <div class="container">
      <p>
        <a href="https://github.com/KrisGray/openpaul">OpenPAUL</a> — 
        Plan-Apply-Unify Loop for structured AI development.
      </p>
      <p style="margin-top: 0.5rem; font-size: 0.9rem;">
        Created by <a href="https://github.com/KrisGray">Kris Gray</a>
      </p>
    </div>
  </footer>
</body>
</html>`;
}

function processMarkdown(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function buildFile(inputPath, outputPath, title, basePath, activeNav) {
  const content = fs.readFileSync(inputPath, 'utf8');
  const processed = processMarkdown(content);
  const body = marked.parse(processed);
  const html = generatePage(title, body, basePath, activeNav);
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log(`Generated: ${outputPath}`);
}

async function main() {
  await loadMarked();
  if (!marked) {
    throw new Error('Failed to load marked for docs build');
  }

  const rootDir = path.join(__dirname, '..');
  const docsDir = path.join(rootDir, 'docs');

  // Build home page
  const homeHtml = generateHomePage('.');
  fs.writeFileSync(path.join(docsDir, 'index.html'), homeHtml);
  console.log('Generated: docs/index.html');

  // Build guides index
  buildFile(
    path.join(docsDir, 'guides.md'),
    path.join(docsDir, 'guides', 'index.html'),
    'Guides',
    '..',
    'guides'
  );

  // Build tutorials index
  buildFile(
    path.join(docsDir, 'tutorials.md'),
    path.join(docsDir, 'tutorials', 'index.html'),
    'Tutorials',
    '..',
    'tutorials'
  );

  // Build INSTALL.md
  const installPath = path.join(rootDir, 'INSTALL.md');
  if (fs.existsSync(installPath)) {
    buildFile(
      installPath,
      path.join(docsDir, 'install', 'index.html'),
      'Installation Guide',
      '..',
      null
    );
  }

  // Build TROUBLESHOOTING.md
  const troubleshootingPath = path.join(rootDir, 'TROUBLESHOOTING.md');
  if (fs.existsSync(troubleshootingPath)) {
    buildFile(
      troubleshootingPath,
      path.join(docsDir, 'troubleshooting', 'index.html'),
      'Troubleshooting',
      '..',
      null
    );
  }

  // Build tutorials
  const tutorialsDir = path.join(rootDir, 'tutorials');
  if (fs.existsSync(tutorialsDir)) {
    const tutorials = fs.readdirSync(tutorialsDir).filter(f => f.endsWith('.md'));
    tutorials.forEach(file => {
      const name = file.replace('-tutorial.md', '').replace('.md', '');
      buildFile(
        path.join(tutorialsDir, file),
        path.join(docsDir, 'tutorials', name, 'index.html'),
        file.replace('-tutorial.md', '').replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Tutorial',
        '../..',
        'tutorials'
      );
    });
  }

  // Build skills/guides
  const skillsDir = path.join(rootDir, 'resources', 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir);
    skills.forEach(skillName => {
      const skillPath = path.join(skillsDir, skillName);
      if (fs.statSync(skillPath).isDirectory()) {
        const mdFiles = fs.readdirSync(skillPath).filter(f => f.endsWith('.md'));
        mdFiles.forEach(file => {
          const name = file.replace('.md', '').toLowerCase();
          const title = file.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          buildFile(
            path.join(skillPath, file),
            path.join(docsDir, 'guides', name, 'index.html'),
            title,
            '../..',
            'guides'
          );
        });
      }
    });
  }

  console.log('\nDocs build complete!');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
