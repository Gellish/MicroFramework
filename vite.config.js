import { resolve } from 'path'
import { defineConfig } from 'vite'
import fs from 'fs'

// Helper to recursively process @include directives
function processIncludes(html) {
    return html.replace(/@include\(['"](.+?)['"]\)/g, (match, p1) => {
        const filePath = resolve(__dirname, p1.startsWith('/') ? p1.slice(1) : p1);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return processIncludes(content); // Recursive
        } catch (e) {
            console.error(`Error including file: ${filePath}`, e);
            return `<!-- Error including ${p1}: ${e.message} -->`;
        }
    });
}

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/route/index.html'),
                ...Object.fromEntries(
                    fs.readdirSync(resolve(__dirname, 'src/route'))
                        .filter(file => file.endsWith('.html') && file !== 'index.html')
                        .map(file => [
                            file.replace('.html', ''),
                            resolve(__dirname, 'src/route', file)
                        ])
                )
            },
        },
    },
    envPrefix: ['VITE_', 'FIREBASE_', 'SUPABASE_', 'USE_FIREBASE', 'API_'],
    plugins: [
        {
            name: 'clean-urls',
            configureServer(server) {
                // Local File Save API
                server.middlewares.use('/__api/save', (req, res, next) => {
                    if (req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => { body += chunk.toString(); });
                        req.on('end', () => {
                            try {
                                const { path, content } = JSON.parse(body);
                                let fullPath;
                                // Handle both absolute paths (from our parser) and relative paths
                                if (path.includes('/') || path.includes('\\')) {
                                    // It's likely already a path from the root (as per parser.js)
                                    // Remove leading slash if present
                                    const relativePath = path.startsWith('/') ? path.slice(1) : path;
                                    fullPath = resolve(__dirname, relativePath);
                                } else {
                                    // Fallback
                                    fullPath = resolve(__dirname, path);
                                }

                                // Security/Sanity Check: Only allow writing to src/route/contents ideally, 
                                // but for now effectively everywhere in src/route is okay for this admin tool.
                                if (!fullPath.includes('src')) {
                                    console.warn('Blocked write attempt outside src:', fullPath);
                                    res.statusCode = 403;
                                    res.end(JSON.stringify({ error: 'Access Denied: Path outside src' }));
                                    return;
                                }

                                fs.writeFileSync(fullPath, content, 'utf-8');
                                console.log('[Vite API] Saved file:', fullPath);
                                res.statusCode = 200;
                                res.end(JSON.stringify({ success: true }));
                            } catch (err) {
                                console.error('Save error:', err);
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: err.message }));
                            }
                        });
                        return;
                    }
                    next();
                });

                // Local File Delete API
                server.middlewares.use('/__api/delete', (req, res, next) => {
                    if (req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => { body += chunk.toString(); });
                        req.on('end', () => {
                            try {
                                const { path } = JSON.parse(body);
                                let fullPath;
                                if (path.includes('/') || path.includes('\\')) {
                                    const relativePath = path.startsWith('/') ? path.slice(1) : path;
                                    fullPath = resolve(__dirname, relativePath);
                                } else {
                                    fullPath = resolve(__dirname, path);
                                }

                                if (!fullPath.includes('src')) {
                                    res.statusCode = 403;
                                    res.end(JSON.stringify({ error: 'Access Denied' }));
                                    return;
                                }

                                if (fs.existsSync(fullPath)) {
                                    fs.unlinkSync(fullPath);
                                    console.log('[Vite API] Deleted file:', fullPath);
                                    res.statusCode = 200;
                                    res.end(JSON.stringify({ success: true }));
                                } else {
                                    res.statusCode = 404;
                                    res.end(JSON.stringify({ error: 'File not found' }));
                                }
                            } catch (err) {
                                console.error('Delete error:', err);
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: err.message }));
                            }
                        });
                        return;
                    }
                    next();
                });

                server.middlewares.use((req, res, next) => {
                    if (req.url === '/') {
                        req.url = '/src/route/index.html';
                        next();
                        return;
                    }

                    // Handle /admin root to admin index
                    if (req.url === '/admin' || req.url === '/admin/') {
                        req.url = '/src/route/admin/index.html';
                        next();
                        return;
                    }

                    // 1. Check for extensionless URLs (clean URLs)
                    // e.g. /admin/posts -> /src/route/admin/posts.html
                    const cleanPath = resolve(__dirname, 'src/route', req.url.substring(1) + '.html');
                    if (fs.existsSync(cleanPath)) {
                        req.url = '/src/route' + req.url + '.html';
                        next();
                        return;
                    }

                    // 2. Check for explicit .html URLs that are missing /src/route prefix
                    // e.g. /admin/index.html -> /src/route/admin/index.html
                    // but ONLY if the file doesn't exist at root (standard Vite behavior)
                    if (req.url.endsWith('.html') && !req.url.startsWith('/src/route')) {
                        const htmlPath = resolve(__dirname, 'src/route', req.url.substring(1));
                        if (fs.existsSync(htmlPath)) {
                            req.url = '/src/route' + req.url;
                            next();
                            return;
                        }
                    }

                    // Existing fallback for /route/ prefix
                    if (req.url.startsWith('/route/')) {
                        req.url = '/src' + req.url;
                    }

                    next();
                });
            },
            // Server-side include processing & Layout System
            transformIndexHtml(html, ctx) {
                // If the file is app.html itself or not in src/route, skip layout wrapping 
                // (BUT we still want to process includes if it's app.html, though app.html is usually not requested directly)

                // Read app.html template (Default)
                let layoutPath = resolve(__dirname, 'src/app.html');

                // Check if we are serving an admin page
                // ctx.originalUrl might effectively be the URL
                // ctx.filename is the disk path
                if (ctx.filename && (ctx.filename.includes('src/route/admin') || ctx.filename.includes('src\\route\\admin'))) {
                    layoutPath = resolve(__dirname, 'src/admin.html');
                } else if (ctx.originalUrl && (ctx.originalUrl.startsWith('/admin') || ctx.originalUrl.includes('/admin/'))) {
                    layoutPath = resolve(__dirname, 'src/admin.html');
                }

                let layout = fs.readFileSync(layoutPath, 'utf-8');

                // Extract title from the page fragment if present
                const titleMatch = html.match(/<title>(.*?)<\/title>/);
                const pageTitle = titleMatch ? titleMatch[1] : null;

                // Remove the title tag from the content to avoid duplicates (optional, but cleaner)
                let pageContent = html.replace(/<title>.*?<\/title>/, '');

                // Simple heuristic: If the page already has <!DOCTYPE html>, assume it's legacy and use it as is
                // BUT user wants to refactor. So we will assume pages are FRAGMENTS.
                // However, the `html` passed here is the CONTENT OF THE FILE.

                // If we are serving src/route/index.html (which is currently full HTML), 
                // this logic might break it unless we strip it.
                // For now, let's implement the layout injection:

                // If the page content has <html> or <body>, we might want to strip them 
                // OR we just rely on the user having refactored them.
                // Let's assume the user is refactoring them to fragments.

                if (pageTitle) {
                    layout = layout.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`);
                }

                // Inject content
                let finalHtml = layout.replace('<!-- @outlet -->', pageContent);

                // Process @include directives (recursively) on the FINAL combined HTML
                let processedHtml = processIncludes(finalHtml);

                // Auto-inject visibility hidden (legacy FOUC fix)
                processedHtml = processedHtml.replace('<body>', '<body style="visibility: hidden;">');

                return processedHtml;
            }
        }
    ]
})
