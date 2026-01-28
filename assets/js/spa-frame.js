// Wrap everything in an IIFE to avoid polluting global scope
(function (global) {
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
    if (path === "/") return "index.html";
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
      // Fetch the HTML of the new page
      const res = await fetch(url, { credentials: "same-origin" });

      // If fetch fails, fallback to normal navigation
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
      if (window.IncludeParser && typeof IncludeParser.run === "function") {
        await IncludeParser.run();
      }

      // Re-run all scripts in the new body
      doc.body.querySelectorAll("script").forEach((s) => {
        const ns = document.createElement("script");
        if (s.src) ns.src = s.src;
        else ns.textContent = s.textContent;
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

  // AUTO start SPAFrame when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", SPAFrame.start);
  } else {
    SPAFrame.start();
  }

  // Expose SPAFrame to the global window object
  global.SPAFrame = SPAFrame;
})(window);
