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
    plugins: [
        {
            name: 'clean-urls',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/') {
                        req.url = '/src/route/index.html';
                        next();
                        return;
                    }

                    // Generic Clean URL Auto-detection
                    // Check if the URL matches a file in src/route with .html extension
                    const potentialPath = resolve(__dirname, 'src/route', req.url.substring(1) + '.html');
                    if (fs.existsSync(potentialPath)) {
                        req.url = '/src/route' + req.url + '.html';
                    }
                    else if (req.url.startsWith('/route/')) {
                        req.url = '/src' + req.url;
                    }
                    else if (!req.url.endsWith('.html') && !req.url.includes('.')) {
                        // Generic fallback: try adding .html
                    }

                    next();
                });
            },
            // Server-side include processing & Layout System
            transformIndexHtml(html, ctx) {
                // If the file is app.html itself or not in src/route, skip layout wrapping 
                // (BUT we still want to process includes if it's app.html, though app.html is usually not requested directly)

                // Read app.html template
                let layout = fs.readFileSync(resolve(__dirname, 'src/app.html'), 'utf-8');

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
