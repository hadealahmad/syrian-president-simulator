import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

function getGitCommit(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

const commitHash = getGitCommit();
const buildTime = new Date().toISOString();
const buildTimestamp = Date.now();
const appVersion = `1.0.${commitHash}`;

// Ensure public/version.json exists for dev/preview
const versionPayload = JSON.stringify(
  {
    version: appVersion,
    commit: commitHash,
    buildTime,
    timestamp: buildTimestamp,
  },
  null,
  2
);

try {
  const publicDir = path.resolve(import.meta.dirname, './public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.resolve(publicDir, 'version.json'), versionPayload);
} catch (err) {
  console.warn('Failed to write public/version.json:', err);
}

function versionPlugin(): Plugin {
  return {
    name: 'version-cache-buster',
    transformIndexHtml(html) {
      // 1. Inject anti-caching meta tags and version metadata into <head>
      const metaTags = `
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="app-version" content="${appVersion}" />
    <meta name="commit-hash" content="${commitHash}" />
    <meta name="build-time" content="${buildTime}" />`;

      let updatedHtml = html.replace('<head>', `<head>${metaTags}`);

      // 2. Append cache-busting query parameter to assets in HTML
      updatedHtml = updatedHtml.replace(
        /(href|src)="(\.?\/?assets\/[^"]+)"/g,
        `$1="$2?v=${commitHash || buildTimestamp}"`
      );

      return updatedHtml;
    },
    generateBundle() {
      // Emit version.json directly into output bundle dist
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionPayload,
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/version.json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.end(versionPayload);
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    svelte(),
    versionPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        id: './',
        name: 'رئيس الجمهورية — محاكاة إدارة واقتصاد سوريا ما بعد الحرب',
        short_name: 'رئيس الجمهورية',
        description:
          'محاكاة استراتيجية لإدارة الدولة والاقتصاد في سوريا ما بعد الحرب: قرارات رئاسية، وميزانية، وديون، وبناء مؤسسات.',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0a1b18',
        background_color: '#071210',
        categories: ['games', 'simulation', 'strategy'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf}'],
        globIgnores: ['**/version.json'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        ignoreURLParametersMatching: [/^v$/, /^utm_/, /^fbclid$/],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /version\.json/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, './src/lib'),
    },
  },
});
