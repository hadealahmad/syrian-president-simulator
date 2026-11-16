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
  build: {
    rollupOptions: {
      // Main game plus the side games (extras/). Each side game is its own
      // page so its code never ships inside the main game's bundle.
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        extras: path.resolve(import.meta.dirname, 'extras/index.html'),
        dossier: path.resolve(import.meta.dirname, 'extras/dossier/index.html'),
        crisis: path.resolve(import.meta.dirname, 'extras/crisis/index.html'),
      },
    },
  },
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
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        // Matches the default theme's --c-bg so the Android splash screen
        // blends into the first frame.
        theme_color: '#0b0f12',
        background_color: '#0b0f12',
        categories: ['games', 'simulation', 'strategy', 'education'],
        prefer_related_applications: false,
        handle_links: 'preferred',
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        shortcuts: [
          {
            name: 'ألعاب جانبية',
            short_name: 'ألعاب جانبية',
            description: 'ألعاب قصيرة من عالم رئيس الجمهورية',
            url: './extras/index.html',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'قرارات عاجلة',
            short_name: 'قرارات عاجلة',
            description: 'لعبة ملفات سريعة: قرّر وحافظ على التوازن',
            url: './extras/dossier/index.html',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        screenshots: [
          ...[
            'الشاشة الرئيسية',
            'خريطة المحافظات',
            'الخزينة والضرائب',
            'المراسيم والحكم',
            'التقارير والمؤشرات',
            'قرارات عاجلة',
          ].map((label, i) => ({
            src: `screenshots/narrow-${i + 1}.webp`,
            sizes: '1082x1922',
            type: 'image/webp',
            form_factor: 'narrow' as const,
            label,
          })),
          ...['خريطة المحافظات', 'الخزينة والضرائب', 'المراسيم والحكم', 'التقارير والمؤشرات'].map(
            (label, i) => ({
              src: `screenshots/wide-${i + 1}.webp`,
              sizes: '1920x1080',
              type: 'image/webp',
              form_factor: 'wide' as const,
              label,
            }),
          ),
        ],
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
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf}'],
        globIgnores: ['**/version.json'],
        navigateFallback: 'index.html',
        // Standalone demos under public/extras/ are their own pages; never
        // answer their navigations with the main game's shell.
        navigateFallbackDenylist: [/\/extras\//],
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
