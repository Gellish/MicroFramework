# SPAFrame + IncludeParser

A lightweight JavaScript framework that brings **Laravel-style HTML includes** and **SPA navigation** to plain HTML files — **without build tools, without attributes, and without flash or blank screens**.

---

## ✨ Features

* ✅ `@include('file.html')` syntax (Laravel-style)
* ✅ No repeated navbar / footer / layout HTML
* ✅ SPA navigation (no full page reload)
* ✅ No flash of raw HTML
* ✅ No blank screen during navigation
* ✅ Works with plain `.html` files
* ✅ Zero build step
* ✅ Pure client-side JavaScript

---

## 🎯 Purpose

This framework solves a common static-site problem:

> Repeating the same HTML (navbar, footer, layout) across multiple pages.

Instead of copy-pasting shared markup into every page, you write it **once** and reuse it everywhere.

```html
@include('nav.html')
```

The browser automatically injects the HTML at runtime.

---

## 🧠 How It Works (Conceptual)

1. Browser loads the page
2. Rendering is **temporarily stabilized** (paint is delayed)
3. `IncludeParser` resolves all `@include()` directives
4. Shared HTML is injected into the DOM
5. SPAFrame enables client-side navigation
6. Page is displayed only when fully ready

This prevents:

* Flash of unprocessed HTML
* Blank screens during navigation
* Layout jumping

---

## 🚀 Quick Start

### 1️⃣ Project Structure

```
project/
│
├─ index.html
├─ blog.html
├─ nav.html
├─ main.css
├─ spa-frame.js
├─ parser.js
```

---

### 2️⃣ Example Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Home</title>
  <link rel="stylesheet" href="main.css">
  <script src="spa-frame.js"></script>
  <script src="parser.js"></script>
</head>
<body>

  @include('nav.html')

  <h1>Home Page</h1>

</body>
</html>
```

---

### 3️⃣ Example `nav.html`

```html
<nav>
  <a href="index.html">Home</a>
  <a href="blog.html">Blog</a>
</nav>
```

---

## 🔥 Running the Project (Required)

### ❌ Do NOT open with:

```
file:///index.html
```

Modern browsers block `fetch()` for local files.

---

### ✅ FASTEST OPTION (Recommended)

```bash
npx serve .
```

Then open:

```
http://localhost:3000
```

---

## 🧩 Why a Server Is Needed

* Enables `fetch()` for HTML includes
* Avoids CORS restrictions
* Serves static files only
* No backend logic involved

This framework remains **100% client-side**.

---

## ⚡ Why There Is No Flash or Blank Screen

This framework **stabilizes rendering before DOM mutation**, similar to how modern frameworks work internally.

Instead of letting the browser paint immediately:

* Rendering is delayed
* Includes are resolved
* DOM is finalized
* Page is shown only when complete

This is the same principle used by:

* React
* Svelte
* Next.js
* Server-side templating engines

---

## 🆚 Comparison

| Feature           | This Framework | React / Vue | HTMX      |
| ----------------- | -------------- | ----------- | --------- |
| Build step        | ❌ No           | ✅ Yes       | ❌ No      |
| Plain HTML        | ✅ Yes          | ❌ No        | ✅ Yes     |
| SPA navigation    | ✅ Yes          | ✅ Yes       | ⚠ Partial |
| HTML includes     | ✅ Yes          | ❌ No        | ⚠ Partial |
| Flash-free render | ✅ Yes          | ✅ Yes       | ⚠ Partial |

---

## 🧪 Ideal Use Cases

* Static websites
* Documentation sites
* Dashboards
* Prototypes
* Learning SPA internals
* Developers who want full control

---

## 📌 One-Line Description

> A lightweight JavaScript framework that adds Laravel-style HTML includes and SPA navigation to plain HTML — without build tools and without visual artifacts.
