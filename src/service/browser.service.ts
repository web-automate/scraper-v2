import puppeteer, { Page, Browser, Protocol, Permission } from 'puppeteer-core';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { SCRAPER_CONFIG } from '../lib/scraper.const';
import { env } from 'process';
import { SessionManager } from '../config/session/manager';

const CHROME_PATH = process.platform === 'win32' 
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
  : '/usr/bin/google-chrome';

const USER_DATA_DIR = path.join(process.cwd(), 'chrome_data_prod');
export const TEMP_DOWNLOAD_DIR = path.join(process.cwd(), 'temp_downloads');
export const DEBUG_PORT = env.DEBUG_PORT || 9222;

export class BrowserService {
  private browserProcess: ChildProcess | null = null;
  public sessionManager: SessionManager = new SessionManager();

  private fixPreferences() {
    const preferencesPath = path.join(USER_DATA_DIR, 'Default', 'Preferences');
    if (fs.existsSync(preferencesPath)) {
      try {
        const content = fs.readFileSync(preferencesPath, 'utf-8');
        const json = JSON.parse(content);
        if (json.profile && json.profile.exit_type !== 'Normal') {
          json.profile.exit_type = 'Normal';
          if (json.profile.exited_cleanly !== undefined) {
            json.profile.exited_cleanly = true;
          }
          fs.writeFileSync(preferencesPath, JSON.stringify(json, null, 2));
        }
      } catch (error) { }
    }
  }

  private ensureDownloadDir() {
    if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
      fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
      console.log(`Created download directory: ${TEMP_DOWNLOAD_DIR}`);
    }
  }

  public async getMainPage(): Promise<Page> {
    const browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${DEBUG_PORT}`,
      defaultViewport: null,
    });

    const context = browser.defaultBrowserContext();
    const permissions: Permission[] = [
      'clipboard-read',
      'clipboard-write',
      'clipboard-sanitized-write',
    ];

    if (SCRAPER_CONFIG.WEB_URL) {
      try {
        const origin = new URL(SCRAPER_CONFIG.WEB_URL).origin;
        await context.overridePermissions(origin, permissions);
      } catch (e) {
        console.warn('Failed to set permissions for config URL', e);
      }
    }

    await context.overridePermissions('https://chatgpt.com', permissions);
    await context.overridePermissions('https://chat.openai.com', permissions);
    await context.overridePermissions('https://gemini.google.com', permissions);

    const page = await browser.pages();
    const mainPage = page[0];

    try {
      this.ensureDownloadDir();

      const client = await mainPage.createCDPSession();
      
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: TEMP_DOWNLOAD_DIR,
      });

      console.log(`✅ Download path set to: ${TEMP_DOWNLOAD_DIR}`);
    } catch (error) {
      console.error('❌ Failed to set download behavior:', error);
    }

    return mainPage;
  }

  public async launch() {
    if (this.browserProcess) return;

    this.fixPreferences();

    const args = [
      '--remote-debugging-port=' + DEBUG_PORT,
      '--no-first-run',
      '--no-sandbox',
      '--no-default-browser-check',
      '--user-data-dir=' + USER_DATA_DIR,
      '--window-size=1280,1024',
      '--disable-session-crashed-bubble',
      '--disable-infobars',
      '--restore-last-session',
      '--disable-popup-blocking',
      '--disable-notifications',
      `--default-download-path=${TEMP_DOWNLOAD_DIR}`,
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',];

    if (process.platform === 'win32') {
      this.browserProcess = spawn(CHROME_PATH, args, { detached: true });
    } else {
      this.browserProcess = spawn('xvfb-run', [
        '-a', 
        '--server-args=-screen 0 1280x1024x24', 
        CHROME_PATH, 
        ...args
      ], { 
        detached: true, 
        stdio: 'inherit' 
      });
    }

    const maxRetries = 20; 
    let connected = false;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
        if (response.ok) {
          console.log("✅ Chrome is ready!");
          connected = true;
          break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (!connected) {
      throw new Error('Chrome failed to start: Port 9222 unreachable after 10 seconds.');
    }
  }

  public async initSession(sessionName: string) {
    console.log(`Initializing session: ${sessionName}`);
    const page = await this.getMainPage();

    if (SCRAPER_CONFIG.WEB_URL) {
      await page.goto(SCRAPER_CONFIG.WEB_URL, { waitUntil: 'domcontentloaded' });
    }

    await this.sessionManager.importSession(page, sessionName);
    
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('Session initialized and page reloaded.');
  }

  public kill() {
    if (this.browserProcess) {
      this.browserProcess.kill();
      this.browserProcess = null;
    }
  }
}

export const browserService = new BrowserService();