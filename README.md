# SPA Micro-Framework (Vite + Bootstrap 5)

A **lightweight Single Page Application micro-framework** built on **Vite**, **Bootstrap 5**, and a custom runtime that enables **Laravel-style HTML includes** and **smooth SPA navigation** — without visual glitches.

---

## ✨ Features

* ⚡ **Powered by Vite**
  Instant dev server, fast HMR, and optimized production builds.

* 🎨 **Bootstrap 5**
  Responsive layout, navbar, grid system, and UI components.

* 🧩 **Laravel-Style HTML Includes**
  Reuse components with:

  ```html
  @include('/includes/nav.html')
  ```

  * Processed **before render**
  * **Zero FOUC** (no flash, no blank screen, no split-second artifacts)

* 🚀 **SPA Navigation**
  Client-side routing without full page reloads.

* 📱 **Fully Responsive**
  Mobile-first layouts and navigation.

---

## 🗂 Project Structure

```
project/
├── assets/
│   ├── css/            # Custom styles
│   ├── js/             # Core framework scripts (IncludeParser, SPAFrame)
│   └── images/         # Images and illustrations
├── includes/           # Reusable HTML components (nav, footer)
├── pages/              # Application pages (blog, about, contact)
├── index.html          # Entry point (Home)
├── vite.config.js      # Vite config (HTML transform & routing)
└── package.json        # Dependencies & scripts
```

---

## 🚀 Quick Start

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Development Server

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

### 3️⃣ Build for Production

```bash
npm run build
```

---

## 🧠 How It Works

### HTML Includes (Laravel-Style)

Instead of repeating layout code across pages, shared components are included using:

```html
@include('/includes/nav.html')
```

**Vite processes these includes at dev/build time**, so:

* The browser receives **fully rendered HTML**
* No runtime flashes
* SEO-friendly output
* No JavaScript race conditions

---

### SPA Navigation

The `SPAFrame` runtime handles internal navigation:

1. Intercepts internal link clicks
2. Fetches page content via `fetch()`
3. Replaces the main content area
4. Updates browser history (`pushState`)
5. Preserves layout and styles

All without a full page reload.

---

## 📄 Pages

| Page        | URL        | Description                       |
| ----------- | ---------- | --------------------------------- |
| **Home**    | `/`        | Landing page with hero section    |
| **Blog**    | `/blog`    | Blog grid using Bootstrap cards   |
| **About**   | `/about`   | Profile section with illustration |
| **Contact** | `/contact` | Styled contact form               |

---

## 🛠 Recent Improvements & Fixes

### ✅ Zero Flash / Zero Blank Screen

* Implemented **Vite `transformIndexHtml`**
* Includes are resolved **before the browser renders**
* No `visibility: hidden` hacks required at runtime

### ✅ Clean URLs

* Routes work without `.html`

  ```
  /about
  /contact
  /blog
  ```
* Middleware handles SPA fallback correctly

### ✅ Layout Stability

* Navbar is full-width (fluid)
* Page content remains centered
* No layout shifting during navigation

### ✅ Bootstrap 5 Standardization

* Unified layout system
* Removed redundant custom CSS
* Consistent UI across all pages

---

## 🎯 Why This Framework Exists

This project sits between:

* Static HTML
* Full SPA frameworks (React / Vue)

It’s ideal if you want:

* Plain HTML
* Reusable components
* SPA behavior
* No build complexity creep
* Full control over rendering

---

## 📜 License

Open Source.
Use it, fork it, break it, improve it.
