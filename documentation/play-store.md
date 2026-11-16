# Publishing to Google Play (PWABuilder → Trusted Web Activity)

The Android app is a Trusted Web Activity (TWA): a thin Android shell that opens
https://game.hadealahmad.com full-screen. Every web deploy updates the app; a new
Play release is only needed when the shell itself changes (icon, name, package
settings).

## What is already in the repo

| Requirement | Where |
| --- | --- |
| Manifest: name, short_name, description, `id`, start_url, scope, `lang`/`dir`, display + `display_override`, colours, categories, `launch_handler`, `handle_links`, `prefer_related_applications`, shortcuts | `vite.config.ts` → `VitePWA({ manifest })` |
| Icons: 192/512 `any` + 192/512 `maskable` | `public/icon-*.png`, `public/icon-maskable-*.png` |
| Manifest screenshots: 6 narrow (1082×1922) + 4 wide (1920×1080) | `public/screenshots/*.webp` |
| Service worker with offline precache | `vite-plugin-pwa` (workbox) |
| Privacy policy (AR + EN) | `public/privacy.html` → https://game.hadealahmad.com/privacy.html, linked from «عن اللعبة» |
| Play listing graphics | `store-assets/feature-graphic-1024x500.png`, `store-assets/play-icon-512.png`, phone shots in `store-assets/raw/narrow-*.png`, tablet/landscape shots in `store-assets/raw/wide-*.png` |

Re-capture screenshots after UI changes:

```bash
npm run build && npx vite preview --port 4317 &
npx tsx scripts/store/capture-store-shots.mts      # writes store-assets/raw/
```

## 1. Package with PWABuilder

1. Open https://www.pwabuilder.com/reportcard?site=https://game.hadealahmad.com and
   confirm manifest + service worker show no required-field errors.
2. **Package for stores → Android → Google Play**. Options:
   - Package ID: `com.hadealahmad.president` (permanent; cannot change after first upload)
   - App name: `رئيس الجمهورية`, launcher name: `رئيس الجمهورية`
   - Version code `1`, version name `1.0.0` (bump both for every shell release)
   - Host: `game.hadealahmad.com`, start URL `/`
   - Display mode: `standalone`; status bar / nav colours `#0b0f12`
   - Splash fade-out 300 ms; Notifications: off
   - Signing key: **Create new** (or reuse the existing one for later releases)
3. Download the zip. Keep `signing.keystore` and `signing-key-info.txt` somewhere
   safe and **never commit them**. Losing them means you can't publish updates
   unless Play App Signing holds the upload key.

The zip contains `app-release-bundle.aab` (upload to Play), an `.apk` for local
testing, and `assetlinks.json`.

## 2. Digital Asset Links (removes the browser URL bar)

Without this file the app shows a Chrome address bar at the top.

1. Upload the `.aab` to Play once (internal testing is enough).
2. Play Console → *Test and release → App integrity → App signing*: copy the
   **App signing key certificate SHA-256** fingerprint.
3. Create `public/.well-known/assetlinks.json` with BOTH fingerprints (the one
   from PWABuilder's `assetlinks.json` and the Play one):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.hadealahmad.president",
      "sha256_cert_fingerprints": [
        "AA:BB:...:PWABUILDER_UPLOAD_KEY",
        "CC:DD:...:PLAY_APP_SIGNING_KEY"
      ]
    }
  }
]
```

4. Push. The Pages workflow (`actions/upload-pages-artifact@v3`) includes dot
   folders, so it is served at
   https://game.hadealahmad.com/.well-known/assetlinks.json. Check it with
   https://developers.google.com/digital-asset-links/tools/generator.

## 3. Play Console listing

**App name:** رئيس الجمهورية

**Short description (≤80):**
محاكاة استراتيجية لإدارة الدولة والاقتصاد في سوريا ما بعد الحرب.

**Full description:**

> أنت رئيس الجمهورية في المرحلة الانتقالية، وأمامك أربعون دورًا نصف سنوي لإعادة بناء الدولة.
>
> • وازِن الميزانية: الضرائب، والرسوم، والإنفاق، والدَّين الخارجي.
> • أدِر أربع عشرة محافظة على الخريطة: الكهرباء، والأضرار، والألغام، والاحتقان.
> • أصدِر المراسيم، وابنِ المؤسسات، واحمِ ثقة الناس ورصيدك السياسي.
> • واجه أحداثًا مفاجئة تفرض عليك قرارات صعبة.
> • نهايات متعددة، وإنجازات، وسجلّ لأفضل جولاتك.
>
> ومعها لعبة جانبية: «قرارات عاجلة»، ملفات سريعة تختار فيها بين قرارين وتحاول ألا يسقط أي مؤشر.
>
> بلا إعلانات، وبلا حساب، وتعمل دون اتصال بعد أول تشغيل. اللعبة مفتوحة المصدر.

**Category:** Games → Simulation (or Strategy). **Tags:** simulation, strategy.

**Graphics:** icon `store-assets/play-icon-512.png`, feature graphic
`store-assets/feature-graphic-1024x500.png`, 2–8 phone screenshots from
`store-assets/raw/narrow-*.png` (01, 02, 03, 05, 06, 08 recommended), optional
7"/10" tablet screenshots from `store-assets/raw/wide-*.png`.

**Privacy policy URL:** https://game.hadealahmad.com/privacy.html

## 4. App content forms

- **Ads:** No ads.
- **Data safety:** the live GTM container (GTM-MP8775QZ) runs only GA4
  (G-8NM263X5WG) with enhanced measurement; no other vendors. Declare:
  - *App activity → App interactions* (game events, page views, clicks)
  - *Device or other IDs* (GA client ID cookie)
  - *Location → Approximate location* (GA4 derives country/city from IP)

  For each: collected, not shared (Google is a service provider), not
  ephemeral, **optional** (consent banner), purpose *Analytics*. Encrypted in
  transit: yes. No accounts, so no account-deletion URL. Everything else
  (personal/financial info, precise location, messages, photos, files,
  contacts, health, crash logs) is not collected. Game saves stay in
  localStorage on the device and are not "collected".
- **Content rating (IARC):** Strategy/simulation; political themes and references
  to war, no graphic violence, no user interaction or chat, no purchases.
- **Target audience:** 13+ (privacy policy states not directed at children).
- **News app:** No. **Government app:** No (it's a game, not affiliated with any
  government; say so if asked).

## 5. After the first release

- Put the IARC certificate ID in the manifest as `iarc_rating_id` (optional).
- Add the Play listing to the manifest as `related_applications` only if you want
  browsers to suggest the Play app instead of PWA install (keep
  `prefer_related_applications: false` otherwise).
