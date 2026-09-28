// ─── Project links ──────────────────────────────────────────────────────────
// Single source of truth for the outbound URLs the UI links to, so the About
// page and the settings menu can never drift apart. Adding a link here makes
// it available to both.

export const PROJECT_LINKS = {
  repo: 'https://github.com/hadealahmad/syrian-president-simulator',
  repoIssues: 'https://github.com/hadealahmad/syrian-president-simulator/issues',
  license: 'https://github.com/hadealahmad/syrian-president-simulator/blob/master/LICENSE',
  authorSite: 'https://hadealahmad.com/',
  authorGithub: 'https://github.com/hadealahmad',
} as const;
