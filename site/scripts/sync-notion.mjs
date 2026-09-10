import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, '..');
const contentDir = path.join(siteDir, 'src', 'content', 'blog');
const mediaDir = path.join(siteDir, 'public', 'notion-media');
const manifestPath = path.join(siteDir, '.notion-generated.json');

const token = process.env.NOTION_TOKEN;
const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
const notionVersion = process.env.NOTION_VERSION ?? '2026-03-11';
const apiBase = 'https://api.notion.com/v1';

if (!token || !dataSourceId) {
  throw new Error(
    'Missing NOTION_TOKEN or NOTION_DATA_SOURCE_ID. Add both values to the GitHub Actions secrets.',
  );
}

const fieldAliases = {
  title: ['title', '标题', 'name', '名称'],
  slug: ['slug', 'url slug', '路径', '网址', 'url'],
  status: ['status', '状态', '发布状态', 'publish status'],
  description: ['description', '摘要', '简介', '描述'],
  date: ['date', '发布日期', '发布时间', 'publish date'],
  updated: ['updated', '更新日期', '更新时间', 'last edited'],
  category: ['category', '分类', '类别'],
  tags: ['tags', '标签', 'tag'],
};

const normalizeFieldName = (value) => String(value).trim().toLocaleLowerCase();

function findProperty(page, field) {
  const aliases = new Set(fieldAliases[field].map(normalizeFieldName));
  return Object.entries(page.properties ?? {}).find(([name]) => aliases.has(normalizeFieldName(name)))?.[1];
}

function propertyValue(property) {
  if (!property) return '';
  if (property.type === 'title' || property.type === 'rich_text') {
    return (property[property.type] ?? []).map((item) => item.plain_text ?? '').join('').trim();
  }
  if (property.type === 'select' || property.type === 'status') {
    return property[property.type]?.name?.trim() ?? '';
  }
  if (property.type === 'multi_select') {
    return (property.multi_select ?? []).map((item) => item.name).filter(Boolean);
  }
  if (property.type === 'date') return property.date?.start ?? '';
  if (property.type === 'checkbox') return Boolean(property.checkbox);
  if (property.type === 'url') return property.url ?? '';
  if (property.type === 'number') return property.number ?? '';
  return '';
}

function propertyText(property) {
  const value = propertyValue(property);
  return Array.isArray(value) ? value.join(', ') : String(value ?? '').trim();
}

function isPublished(value) {
  if (typeof value === 'boolean') return value;
  return new Set(['published', 'publish', 'public', 'posted', '发布', '已发布', '公开']).has(
    String(value).trim().toLocaleLowerCase(),
  );
}

function slugify(value, fallback) {
  const slug = String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function yamlArray(values) {
  return JSON.stringify(Array.isArray(values) ? values : []);
}

function dateOnly(value, fallback) {
  const candidate = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(candidate)) return candidate.slice(0, 10);
  return fallback;
}

async function notionRequest(endpoint, init = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': notionVersion,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API ${response.status} for ${endpoint}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

async function queryPages() {
  const pages = [];
  let cursor;
  do {
    const response = await notionRequest(`/data_sources/${encodeURIComponent(dataSourceId)}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    pages.push(...(response.results ?? []));
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function retrieveMarkdown(pageId) {
  const response = await notionRequest(`/pages/${encodeURIComponent(pageId)}/markdown`);
  let markdown = response.markdown ?? '';
  if (response.truncated) {
    console.warn(`Page ${pageId} is truncated; loading ${response.unknown_block_ids?.length ?? 0} additional blocks.`);
  }
  for (const blockId of response.unknown_block_ids ?? []) {
    try {
      const child = await notionRequest(`/pages/${encodeURIComponent(blockId)}/markdown`);
      markdown += `\n\n${child.markdown ?? ''}`;
    } catch (error) {
      console.warn(`Could not load unknown block ${blockId}: ${error.message}`);
    }
  }
  return markdown;
}

function mediaExtension(url, contentType = '') {
  try {
    const ext = path.extname(new URL(url).pathname).toLocaleLowerCase();
    if (/^\.[a-z0-9]{1,8}$/.test(ext)) return ext;
  } catch {
    // Fall back to the response content type.
  }
  const type = contentType.split(';', 1)[0].toLocaleLowerCase();
  const known = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'video/mp4': '.mp4',
  };
  return known[type] ?? '.bin';
}

function isNotionMediaUrl(value) {
  try {
    const url = new URL(value);
    return /(^|\.)notion-static\.com$|(^|\.)amazonaws\.com$|(^|\.)notion\.so$/i.test(url.hostname);
  } catch {
    return false;
  }
}

async function downloadMedia(url, slug, index) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`media ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = mediaExtension(url, response.headers.get('content-type') ?? '');
  const filename = `${slug}-${String(index).padStart(2, '0')}${extension}`;
  await mkdir(mediaDir, { recursive: true });
  await writeFile(path.join(mediaDir, filename), bytes);
  return `/notion-media/${filename}`;
}

async function localizeMedia(markdown, slug, generatedMedia) {
  let mediaIndex = 0;
  const replacements = new Map();
  const mediaPattern = /(!\[[^\]]*\]\()((?:https?:\/\/)[^\s)]+)(\)|)|((?:<(?:audio|video|file|pdf)\b[^>]*\bsrc=")((?:https?:\/\/)[^"\s]+)("))/gi;
  const urls = [];
  for (const match of markdown.matchAll(mediaPattern)) {
    const url = match[2] ?? match[5];
    if (url && isNotionMediaUrl(url)) urls.push(url);
  }
  for (const url of [...new Set(urls)]) {
    try {
      const localUrl = await downloadMedia(url, slug, ++mediaIndex);
      replacements.set(url, localUrl);
      generatedMedia.push(path.basename(localUrl));
    } catch (error) {
      console.warn(`Could not download media for ${slug}: ${error.message}`);
    }
  }
  let result = markdown;
  for (const [remote, local] of replacements) result = result.split(remote).join(local);
  return result;
}

function normalizeMarkdown(markdown) {
  let result = markdown
    .replace(/\s*\{(?:color|toggle)="[^"]*"\}/g, '')
    .replace(/<empty-block\s*\/>/gi, '')
    .replace(/<mention-(?:user|page|database|data-source|agent)(?:\s+url="[^"]*")?>([\s\S]*?)<\/mention-[^>]+>/gi, '$1')
    .replace(/<mention-(?:user|page|database|data-source|agent)(?:\s+url="[^"]*")?\s*\/>/gi, '')
    .replace(/<mention-date[^>]*\/>/gi, '')
    .replace(/<unknown\s+url="([^"]+)"\s*\/>/gi, '[未同步内容]($1)')
    .replace(/<page\s+url="([^"]+)"[^>]*>([\s\S]*?)<\/page>/gi, '[$2]($1)')
    .replace(/<database\s+url="([^"]+)"[^>]*>([\s\S]*?)<\/database>/gi, '[$2]($1)')

  // Notion-flavored Markdown uses custom block tags. Standard Markdown
  // parsers treat their contents as raw HTML, so unwrap callouts and
  // dedent their children into a regular blockquote.
  result = result.replace(/<callout\b([^>]*)>([\s\S]*?)<\/callout>/gi, (_, attributes, body) => {
    const icon = attributes.match(/\bicon="([^"]+)"/i)?.[1] ?? '';
    const content = body
      .replace(/^\t/gm, '')
      .replace(/\*\*([^*\n]+)\*\*(?=[\p{L}\p{N}])/gu, '**$1** ')
      .trim();
    const lines = content ? content.split('\n') : [];
    if (icon && lines.length > 0) lines[0] = `${icon} ${lines[0]}`;
    const quote = lines.map((line) => (line.trim() ? `> ${line}` : '>')).join('\n');
    return `\n\n${quote}\n\n`;
  });

  // Ensure Markdown resumes after Notion's HTML table block. Without the
  // separating blank line, all following headings and lists remain literal.
  result = result
    .replace(/<table\b([^>]*)>/gi, '\n\n<table$1>\n')
    .replace(/<\/table>/gi, '\n</table>\n\n')
    .replace(/\n{3,}/g, '\n\n');

  // The enhanced Markdown endpoint emits one line per Notion block, often
  // without the blank lines expected by CommonMark. Add block spacing while
  // keeping list items, blockquotes, fenced code, and table rows together.
  const lines = result.split('\n');
  const spaced = [];
  let inFence = false;
  let inTable = false;
  const isList = (line) => /^(?:[-*+]\s|\d+[.)]\s)/.test(line);
  const isQuote = (line) => line.startsWith('>');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    spaced.push(line);
    if (/^(?:\s*)(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*<table\b/i.test(line)) inTable = true;
    if (/^\s*<\/table>/i.test(line)) inTable = false;
    const next = lines[index + 1];
    if (!next || !next.trim() || inTable || !line.trim()) continue;
    const currentTrimmed = line.trim();
    const nextTrimmed = next.trim();
    const keepTogether =
      (isList(currentTrimmed) && isList(nextTrimmed)) ||
      (isQuote(currentTrimmed) && isQuote(nextTrimmed));
    if (!keepTogether) spaced.push('');
  }

  return spaced
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function excerpt(markdown, title) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\[\]_*`>#|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 160) || title;
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return { files: [], media: [] };
  }
}

async function removePreviousGeneratedFiles(manifest) {
  for (const filename of manifest.files ?? []) {
    if (/^[\w\-.\u0080-]+\.md$/u.test(filename)) await rm(path.join(contentDir, filename), { force: true });
  }
  for (const filename of manifest.media ?? []) {
    if (/^[\w\-.]+$/u.test(filename)) await rm(path.join(mediaDir, filename), { force: true });
  }
}

function pageMetadata(page, markdown) {
  const title = propertyText(findProperty(page, 'title')) || `未命名文章 ${page.id.slice(0, 8)}`;
  const slug = slugify(propertyText(findProperty(page, 'slug')), slugify(title, page.id.slice(0, 8)));
  const statusProperty = findProperty(page, 'status');
  const status = propertyValue(statusProperty);
  if (!statusProperty || !isPublished(status)) return null;
  const date = dateOnly(propertyText(findProperty(page, 'date')), dateOnly(page.created_time, new Date().toISOString()));
  const updated = dateOnly(propertyText(findProperty(page, 'updated')), dateOnly(page.last_edited_time, date));
  const description = propertyText(findProperty(page, 'description')) || excerpt(markdown, title);
  const category = propertyText(findProperty(page, 'category')) || '未分类';
  const tags = propertyValue(findProperty(page, 'tags'));
  return {
    title,
    slug,
    description,
    date,
    updated: updated === date ? undefined : updated,
    category,
    tags: Array.isArray(tags) ? tags : String(tags).split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

function frontmatter(metadata, markdown) {
  const lines = [
    '---',
    `title: ${yamlString(metadata.title)}`,
    `description: ${yamlString(metadata.description)}`,
    `slug: ${yamlString(metadata.slug)}`,
    `date: ${metadata.date}`,
    ...(metadata.updated ? [`updated: ${metadata.updated}`] : []),
    `category: ${yamlString(metadata.category)}`,
    `tags: ${yamlArray(metadata.tags)}`,
    'draft: false',
    '---',
    '',
  ];
  return `${lines.join('\n')}${markdown}\n`;
}

async function main() {
  const previousManifest = await readManifest();
  await removePreviousGeneratedFiles(previousManifest);
  await mkdir(contentDir, { recursive: true });
  await mkdir(mediaDir, { recursive: true });

  const pages = await queryPages();
  const generatedFiles = [];
  const generatedMedia = [];
  const usedSlugs = new Set();
  let publishedCount = 0;

  for (const page of pages) {
    const rawMarkdown = await retrieveMarkdown(page.id);
    const metadata = pageMetadata(page, rawMarkdown);
    if (!metadata) continue;
    if (usedSlugs.has(metadata.slug)) throw new Error(`Duplicate Notion slug: ${metadata.slug}`);
    usedSlugs.add(metadata.slug);

    const markdown = normalizeMarkdown(await localizeMedia(rawMarkdown, metadata.slug, generatedMedia));
    const filename = `__notion__${metadata.slug}.md`;
    const destination = path.join(contentDir, filename);
    try {
      await readFile(destination);
      throw new Error(`The generated slug conflicts with an existing article: ${filename}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await writeFile(destination, frontmatter(metadata, markdown), 'utf8');
    generatedFiles.push(filename);
    publishedCount += 1;
  }

  await writeFile(manifestPath, `${JSON.stringify({ files: generatedFiles, media: generatedMedia }, null, 2)}\n`);
  console.log(`Synced ${publishedCount} published Notion page(s) into ${contentDir}.`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? error);
  process.exitCode = 1;
});
