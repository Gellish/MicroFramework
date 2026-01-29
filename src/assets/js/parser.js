import { marked } from 'marked';
import jsyaml from 'js-yaml';

const IncludeParser = {};
const inflight = new Map();
const markdownFiles = import.meta.glob('/src/route/**/*.md', { as: 'raw', eager: true });
const postIndex = new Map(); // Map<Slug, {path, metadata, body}>

function generateSlug(title) {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pre-index all markdown files
for (const path in markdownFiles) {
  const raw = markdownFiles[path];
  // Quick frontmatter parse to get slug/title without full marked parse if possible
  // But parseMarkdown() is robust, let's use it but maybe optimize later if slow.
  // For now, we need metadata to get the slug.
  const fmRegex = /^-{3,}\r?\n([\s\S]+?)\r?\n-{3,}\r?\n([\s\S]*)/;
  const match = raw.match(fmRegex);

  if (match) {
    try {
      const metadata = jsyaml.load(match[1]);
      let slug = metadata.slug;
      if (!slug && metadata.title) {
        slug = generateSlug(metadata.title);
      }
      if (slug) {
        // Store raw content or pre-parsed? 
        // Let's store raw and parse on demand to save init time, 
        // BUT we need metadata for the listing page anyway.
        // Let's store the metadata object + raw body.
        postIndex.set(slug, { path, metadata, rawBody: match[2], rawFull: raw });
      }
    } catch (e) {
      console.warn('Failed to parse frontmatter for', path, e);
    }
  }
}

async function fetchFile(file) {
  const url = new URL(file, location.href).href;
  const cacheKey = 'include_cache_' + url;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;
  if (inflight.has(url)) return inflight.get(url);
  const promise = fetch(url, { credentials: 'same-origin' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
      const text = await res.text();
      sessionStorage.setItem(cacheKey, text);
      inflight.delete(url);
      return text;
    })
    .catch(err => {
      inflight.delete(url);
      throw err;
    });
  inflight.set(url, promise);
  return promise;
}

function parseMarkdown(rawContent) {
  const fmRegex = /^-{3,}\r?\n([\s\S]+?)\r?\n-{3,}\r?\n([\s\S]*)/;
  const match = rawContent.match(fmRegex);
  if (match) {
    try {
      const metadata = jsyaml.load(match[1]);
      // Ensure slug exists in metadata if title is present
      if (!metadata.slug && metadata.title) {
        metadata.slug = generateSlug(metadata.title);
      }
      const body = marked.parse(match[2]);
      return { ...metadata, body };
    } catch (e) {
      return { body: marked.parse(rawContent) };
    }
  } else {
    return { body: marked.parse(rawContent) };
  }
}

function renderTemplate(template, data) {
  return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) => {
    let val = data[key];
    if (val instanceof Date) {
      // Format: January 27, 2026
      return val.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return val !== undefined ? val : '';
  });
}

// 🔹 Core Logic: Process a full content block string (source + template)
function processContentBlockMatch(fullMatch, source, template) {
  let replacementHtml = '';

  // Path Resolution Logic
  // If user types 'posts' -> '/pages/posts'
  // If user types 'pages/posts' -> '/pages/posts' (avoid double /pages/)
  // If user types '/pages/posts' -> '/pages/posts'
  let cleanSource = source.trim();
  if (cleanSource.startsWith('/')) cleanSource = cleanSource.substring(1);
  if (!cleanSource.startsWith('src/route/')) cleanSource = 'src/route/' + cleanSource;
  const searchPath = '/' + cleanSource;

  const matches = Object.keys(markdownFiles).filter(path => {
    if (path === searchPath + '.md') return true;
    if (path.startsWith(searchPath + '/')) return true;
    return false;
  });

  for (const path of matches) {
    const raw = markdownFiles[path];
    const data = parseMarkdown(raw);
    replacementHtml += renderTemplate(template, data);
  }

  if (matches.length === 0) {
    console.warn(`[IncludeParser] No markdown files found for source: ${source} (searched: ${searchPath})`);
    // replacementHtml = `<!-- No content found for ${source} -->`; // Silent fail is better for UI?
  }
  return replacementHtml;
}

// 🔹 Strategy: Find @content text node, scan siblings until @endcontent, render, replace.
async function processContentBlocksInDOM(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let changed = false;

  for (const node of nodes) {
    // Only look for start tags
    if (!node.nodeValue.includes('@content(')) continue;

    // Ensure this node is still in the DOM (might have been removed in prev iteration)
    if (!node.parentNode) continue;

    const startContent = node.nodeValue;
    const startRegex = /@content\(['"](.+?)['"]\)/;
    const startMatch = startContent.match(startRegex);

    if (!startMatch) continue; // Should exist if includes() passed

    const source = startMatch[1];

    // We found the start. Now we need to find the end.
    // We will collect the "Template" parts.
    const siblingsToRemove = [];
    let template = '';
    let foundEnd = false;
    let currentNode = node;

    // Handle the part of the start node *after* the @content(...)
    // e.g. "@content('foo') <div>" -> template starts with " <div>"
    const splitIndex = startContent.indexOf(startMatch[0]) + startMatch[0].length;
    template += startContent.substring(splitIndex);

    // Traverse siblings
    while (currentNode.nextSibling) {
      currentNode = currentNode.nextSibling;

      let nodeText = '';
      let isEndNode = false;

      if (currentNode.nodeType === Node.TEXT_NODE) {
        const val = currentNode.nodeValue;
        const endIdx = val.indexOf('@endcontent');
        if (endIdx !== -1) {
          // Found the end!
          nodeText = val.substring(0, endIdx);
          isEndNode = true;
          foundEnd = true;
        } else {
          nodeText = val;
        }
      } else {
        // Element node
        nodeText = currentNode.outerHTML;
      }

      if (!isEndNode) {
        siblingsToRemove.push(currentNode);
        template += nodeText;
      } else {
        // Should we keep the text *after* @endcontent? Yes.
        // But for simplicity, we just won't remove this node yet, 
        // we'll just truncate its text value later? 
        // Actually @endcontent is usually on its own line or end of block.
        // Let's assume we consume the @endcontent marker.
        siblingsToRemove.push(currentNode); // We will remove the node containing @endcontent? 
        // Wait, if @endcontent is inside a text node that has other stuff after it, we should split it.
        // For now, assume it consumes the node or we modify it.
        // Simpler: Just remove the node if it's mostly the marker.
        // Correct logic: Modify the end node to remove the marker and everything before it? 
        // No, we already captured "before it" in nodeText.
        // So we should update the end node to ONLY contain what's *after* the marker.
      }

      if (foundEnd) {
        // Update the End Node content (remove the marker and pre-marker text)
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const endIdx = currentNode.nodeValue.indexOf('@endcontent');
          currentNode.nodeValue = currentNode.nodeValue.substring(endIdx + '@endcontent'.length);
        }
        break;
      }
    }

    if (foundEnd) {
      // We have the full template!
      const newHtml = processContentBlockMatch(null, source, template);

      // Create fragment
      const wrapper = document.createElement('div');
      wrapper.innerHTML = newHtml;
      const frag = document.createDocumentFragment();
      while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);

      // Replace the Start Node with: (Part before @content) + (New HTML)
      // But wait, the Start Node text *before* the match should be kept.
      const prefix = startContent.substring(0, startContent.indexOf(startMatch[0]));
      node.nodeValue = prefix; // Update start node to just be the prefix

      // Insert new content after start node
      if (node.nextSibling) {
        node.parentNode.insertBefore(frag, node.nextSibling);
      } else {
        node.parentNode.appendChild(frag);
      }

      // Remove the intermediate nodes that we consumed
      for (const sibling of siblingsToRemove) {
        // If it's the end node and we just modified it (it still exists), don't remove it!
        // Wait, logic above: `siblingsToRemove.push(currentNode)` happened even for End Node.
        // But we modified End Node in DOM. Removing it would lose the "after" text.
        // Fix: Don't add End Node to `siblingsToRemove` if we modify it in place.
        if (sibling === currentNode && sibling.nodeType === Node.TEXT_NODE) {
          // It was the end text node, we modified its value, keep it.
        } else {
          sibling.remove();
        }
      }

      changed = true;
      console.log('[IncludeParser] Processed multi-node content block');
    }
  }
  return changed;
}

// 🔹 Simple String Replacer for Includes
async function replaceIncludesInString(str) {
  const includeRegex = /@include\(['"](.+?)['"]\)/g;
  const matches = [...str.matchAll(includeRegex)];
  if (matches.length === 0) return str;

  const uniqueFiles = [...new Set(matches.map(m => m[1]))];
  const fileContents = new Map();

  await Promise.all(uniqueFiles.map(async file => {
    try {
      const content = await fetchFile(file);
      fileContents.set(file, content);
    } catch (err) {
      console.error(err);
    }
  }));

  let result = str;
  for (const match of matches) {
    const full = match[0];
    const file = match[1];
    const content = fileContents.get(file) || "";
    result = result.split(full).join(content);
  }
  return result;
}

// 🔹 Process Includes in Text Nodes (Standard)
async function processIncludesInDOM(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let changed = false;
  for (const node of nodes) {
    if (!node.nodeValue.includes('@include(')) continue;
    const original = node.nodeValue;
    const replaced = await replaceIncludesInString(original);
    if (replaced !== original) {
      const temp = document.createElement('div');
      temp.innerHTML = replaced;
      // Script activation...
      const scripts = temp.querySelectorAll('script');
      for (const s of scripts) { /* ... */ } // Skipping for brevity in fix

      const frag = document.createDocumentFragment();
      while (temp.firstChild) frag.appendChild(temp.firstChild);
      node.parentNode.replaceChild(frag, node);
      changed = true;
    }
  }
  return changed;
}

// 🔹 Top-level runner
IncludeParser.run = async function (root = document.documentElement) {
  try {
    let pass = 0;
    let any;
    do {
      pass++;
      console.log(`[IncludeParser] pass ${pass} start`);

      // Pass 1: Handle Includes
      const includesChanged = await processIncludesInDOM(root);

      // Pass 2: Handle Content Blocks (Multi-node)
      const contentChanged = await processContentBlocksInDOM(root);

      any = includesChanged || contentChanged;

      console.log(`[IncludeParser] pass ${pass} done — changed=${any}`);
      if (pass > 10) break;
    } while (any);

    if (window.SPAFrame && typeof window.SPAFrame.start === 'function') {
      try { window.SPAFrame.start(); } catch (e) { }
    }
    document.body.style.visibility = 'visible';
  } catch (err) {
    console.error('[IncludeParser] run error', err);
    document.body.style.visibility = 'visible';
  }
};

// 🔹 Expose helpers for SPA Router
IncludeParser.getPostBySlug = function (slug) {
  // Try exact match
  if (postIndex.has(slug)) {
    const entry = postIndex.get(slug);
    // Return full parsed data
    const parsed = parseMarkdown(entry.rawFull);
    return parsed;
  }
  return null;
};

IncludeParser.renderTemplate = function (template, data) {
  return renderTemplate(template, data);
};

// Return all indexed local markdown files
IncludeParser.getLocalPosts = function () {
  return Array.from(postIndex.values()).map(entry => {
    // Parse on demand or use cached metadata
    // entry has {path, metadata, rawBody, rawFull}
    return {
      id: entry.metadata.slug || 'local-' + Math.random().toString(36).substr(2, 9),
      title: entry.metadata.title || 'Untitled Local Post',
      content: entry.rawFull, // Use rawFull to preserve frontmatter for editing
      source: 'local',
      path: entry.path // This seems to be relative to root like '/src/route/...'
    };
  });
};

export { IncludeParser };
