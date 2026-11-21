// NotebookLM MCP authentication setup (two-phase).
//
// Phase 1: open a NORMAL (non-automated) Chrome window on the notebooklm-mcp
//          profile so the user can sign in. Automated Chrome windows don't
//          become visible when launched from the IDE, and Google sometimes
//          blocks sign-in inside automated browsers.
// Phase 2: after the user closes that window, reopen the same profile
//          headlessly with patchright, verify the Google auth cookies, and
//          save state.json the way notebooklm-mcp expects.
//
// Note: notebooklm-mcp's own performLogin() treats any URL *containing*
// "notebooklm.google" as success, which falsely matches the sign-in page's
// `continue=` parameter. That's why this script does its own check.

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PKG = 'C:/Users/moham/AppData/Roaming/npm/node_modules/notebooklm-mcp';
const { AuthManager } = await import(`file:///${PKG}/dist/auth/auth-manager.js`);
const { CONFIG } = await import(`file:///${PKG}/dist/config.js`);
const { chromium } = await import(`file:///${PKG}/node_modules/patchright/index.mjs`);

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REQUIRED_COOKIES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID'];
const TIMEOUT_MS = 15 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profileProcessCount = () => {
  try {
    const out = execSync(
      'powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"name = \'chrome.exe\'\\" | Where-Object { $_.CommandLine -like \'*notebooklm-mcp*\' }).Count"',
      { encoding: 'utf8' }
    );
    return parseInt(out.trim() || '0', 10) || 0;
  } catch {
    return 0;
  }
};

const killProfileProcesses = () => {
  try {
    execSync(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name = \'chrome.exe\'\\" | Where-Object { $_.CommandLine -like \'*notebooklm-mcp*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"',
      { stdio: 'ignore' }
    );
  } catch {
    // ignore
  }
};

// --verify: skip phase 1 and only check a sign-in the user did in a Chrome
// window they opened themselves (e.g. via Win+R), which is always visible.
const VERIFY_ONLY = process.argv.includes('--verify');
const auth = new AuthManager();
fs.mkdirSync(CONFIG.chromeProfileDir, { recursive: true });
fs.mkdirSync(CONFIG.browserStateDir, { recursive: true });

if (VERIFY_ONLY) {
  if (profileProcessCount() > 0) {
    console.error('❌ The NotebookLM Chrome window is still open. Close it first, then re-run.');
    process.exit(1);
  }
} else {
// ---------------------------------------------------------------- Phase 1
killProfileProcesses();
await sleep(1000);
await auth.clearAllAuthData();
fs.mkdirSync(CONFIG.chromeProfileDir, { recursive: true });
fs.mkdirSync(CONFIG.browserStateDir, { recursive: true });

console.log('====================================================');
console.log('🚀 NotebookLM Authentication Setup');
console.log('');
console.log('1. A normal Google Chrome window is opening now.');
console.log('2. Sign into your Google account.');
console.log('3. Wait until the NotebookLM home page loads.');
console.log('4. CLOSE that Chrome window. The script then finishes.');
console.log('====================================================');

// `cmd /c start` goes through the Windows shell so the window is shown normally.
spawn(
  'cmd.exe',
  [
    '/c', 'start', '""', `"${CHROME}"`,
    `--user-data-dir="${CONFIG.chromeProfileDir}"`,
    '--no-first-run', '--no-default-browser-check', '--new-window',
    'https://notebooklm.google.com/',
  ],
  { detached: true, stdio: 'ignore', windowsVerbatimArguments: true }
).unref();

// Wait for Chrome to start on this profile, then wait for the user to close it.
const start = Date.now();
let started = false;
let lastLog = 0;
while (Date.now() - start < TIMEOUT_MS) {
  const count = profileProcessCount();
  if (!started && count > 0) {
    started = true;
    console.log('🟢 Chrome window opened. Sign in, then close the window.');
  }
  if (started && count === 0) break;
  if (!started && Date.now() - start > 30000) {
    console.error('❌ Chrome did not start within 30s.');
    process.exit(1);
  }
  const elapsed = Math.floor((Date.now() - start) / 1000);
  if (started && elapsed - lastLog >= 30) {
    lastLog = elapsed;
    console.log(`⏳ Waiting for you to sign in and close the window... (${elapsed}s)`);
  }
  await sleep(2000);
}
if (profileProcessCount() > 0) {
  console.error('❌ Timed out (15 minutes) waiting for the Chrome window to close.');
  process.exit(1);
}

} // end phase 1

// ---------------------------------------------------------------- Phase 2
console.log('🔍 Verifying sign-in...');
await sleep(1500);

const context = await chromium.launchPersistentContext(CONFIG.chromeProfileDir, {
  channel: 'chrome',
  headless: true,
  viewport: CONFIG.viewport,
  locale: 'en-US',
  args: ['--disable-blink-features=AutomationControlled', '--no-first-run'],
});

let ok = false;
try {
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const host = new URL(page.url()).hostname;
  const names = new Set((await context.cookies()).map((c) => c.name));
  const missing = REQUIRED_COOKIES.filter((n) => !names.has(n));

  if (['notebooklm.google.com', 'notebook.google.com'].includes(host) && missing.length === 0) {
    await auth.saveBrowserState(context, page);
    const saved = JSON.parse(fs.readFileSync(path.join(CONFIG.browserStateDir, 'state.json'), 'utf8'));
    const found = saved.cookies.map((c) => c.name).filter((n) => REQUIRED_COOKIES.includes(n));
    ok = true;
    console.log('====================================================');
    console.log('✅ Authentication successful!');
    console.log(`   Auth cookies saved: ${found.join(', ')}`);
    console.log('====================================================');
  } else {
    console.error('❌ Not signed in.');
    console.error(`   Landed on: ${page.url()}`);
    if (missing.length) console.error(`   Missing cookies: ${missing.join(', ')}`);
    console.error('   Re-run and make sure NotebookLM fully loads before closing Chrome.');
  }
} finally {
  await context.close().catch(() => {});
}

process.exit(ok ? 0 : 1);
