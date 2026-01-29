import { IncludeParser } from './parser.js';

// SPAFrame object that holds our public methods
const SPAFrame = {};

// Function to check if a URL is on the same origin (domain + protocol)
function sameOrigin(url) {
  try {
    // Compare URL origin to current page origin
    return new URL(url, location.href).origin === location.origin;
  } catch {
    // If URL is invalid, return false
    return false;
  }
}

// Map clean URL to actual HTML file
function resolveUrl(path) {
  if (path === "/") return "src/route/index.html";
  return path.endsWith(".html") ? path : path.slice(1) + ".html";
}

// Main function to navigate to a new page via fetch
async function navigate(url, push = true) {
  if (!url) return; // if no URL, do nothing

  // If URL is external, mailto:, or tel:, use normal navigation
  if (
    !sameOrigin(url) ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    location.href = url;
    return;
  }

  try {
    // Check if this looks like a blog slug (no extension, not root)
    const isCleanUrl = !url.includes('.') && url !== '/';
    let targetUrl = url;

    // Attempt fetch
    let res = await fetch(targetUrl, { credentials: "same-origin" });

    // If 404 or clean URL failed, check if it's a blog post slug
    if ((!res.ok || isCleanUrl) && IncludeParser && IncludeParser.getPostBySlug) {
      // Extract slug from URL (last segment)
      // e.g. /posts/my-post -> my-post
      // e.g. /my-post -> my-post
      const slug = url.split('/').filter(Boolean).pop();
      const postData = IncludeParser.getPostBySlug(slug);

      if (postData) {
        console.log(`[SPAFrame] Found virtual post for slug: ${slug}`);
        // It's a valid post! Fetch the [slug] template.
        // mimicking Next.js / SvelteKit dynamic routing style
        const layoutUrl = '/src/route/posts/[slug].html';
        res = await fetch(layoutUrl, { credentials: "same-origin" });
        if (res.ok) {
          // We have the layout and the data. Time to render manually.
          const layoutHtml = await res.text();

          // Render the layout with the post data
          const finalHtml = IncludeParser.renderTemplate(layoutHtml, postData);

          // Fake a response object to continue with the standard flow
          // OR just handle DOM replacement here.
          // Let's standard flow handle it by mocking the text() method.
          res = {
            ok: true,
            text: async () => finalHtml
          };
        }
      }
    }

    // Standard Error Handling if still not ok
    if (!res.ok) { location.href = url; return; }

    // Get the HTML text
    const html = await res.text();

    // Parse HTML string into a DOM document
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Hide body before replacing content to prevent flash
    document.body.style.visibility = 'hidden';

    // Push the new URL into browser history (BEFORE scripts run so they see the new URL)
    if (push) history.pushState(null, "", url);

    // Replace current body with the new page's body
    document.body.innerHTML = doc.body.innerHTML;

    // Run IncludeParser to process any @include() in the fetched page
    if (IncludeParser && typeof IncludeParser.run === "function") {
      await IncludeParser.run();
    }

    // Re-run all scripts in the new body
    doc.body.querySelectorAll("script").forEach((s) => {
      // If script has a src, check if it's already loaded to avoid duplication
      // BUT: Vite dev mode extracts page logic into 'html-proxy' scripts.
      // We MUST run these every time the page is viewed.
      if (s.src) {
        const isViteProxy = s.src.includes('html-proxy');
        const isGlobal = s.src.includes('@vite/client') ||
          s.src.includes('/src/assets/js/main.js') ||
          s.src.includes('bootstrap'); // Add other globals if needed

        // Only skip if it's a known global and NOT a page-specific proxy
        if (!isViteProxy && isGlobal) {
          const isLoaded = Array.from(document.scripts).some(existing => existing.src === s.src);
          if (isLoaded) {
            console.log(`[SPAFrame] Skipping duplicate global script: ${s.src}`);
            return;
          }
        }
      }

      const ns = document.createElement("script");
      if (s.src) {
        // FORCE re-execution of local page scripts (html-proxy) by checking cache busting
        // Global scripts (@vite etc) are skipped by logic above.
        // For page logic, we MUST force the browser to treat it as a new module.
        if (s.src.includes('html-proxy') || s.src.includes('src/route')) {
          const url = new URL(s.src, location.href);
          url.searchParams.set('spa_t', Date.now());
          ns.src = url.toString();
        } else {
          ns.src = s.src;
        }
      }
      else ns.textContent = s.textContent;

      // Copy all attributes (e.g. type="module")
      Array.from(s.attributes).forEach(attr => {
        ns.setAttribute(attr.name, attr.value);
      });

      document.head.appendChild(ns);
    });

    // Show body after everything is processed
    document.body.style.visibility = 'visible';
  } catch (err) {
    // On error, fallback to normal navigation
    console.error("SPAFrame navigation error:", err);
    location.href = url;
  }
}

// Public method to start the SPA functionality
SPAFrame.start = function () {
  // Listen to all clicks in the document
  document.addEventListener(
    "click",
    (e) => {
      // Ignore clicks that are already handled or not left click
      if (e.defaultPrevented || e.button !== 0) return;

      // Ignore clicks with Ctrl, Meta, Shift, or Alt keys
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Find the closest link or button that has href or data-href
      const el = e.target.closest("a[href],button[href],button[data-href]");
      if (!el) return; // If none found, ignore

      // Get href from attribute or data-href
      const href = el.getAttribute("href") || el.dataset.href;
      if (!href) return;

      // Prevent default browser navigation
      e.preventDefault();

      // Navigate using SPAFrame
      navigate(href, true);
    },
    true,
  ); // use capture to intercept clicks early

  // Handle back/forward browser buttons
  window.addEventListener("popstate", () => {
    navigate(location.pathname + location.search, false);
  });
};

export { SPAFrame };

