import * as fs from 'fs';
import * as path from 'path';
import { ElementHandle, Page } from 'puppeteer-core';
import { v4 as uuidv4 } from 'uuid';
import { ImageHelper } from '../helper/img-converter';
import { SCRAPER_CONFIG } from '../lib/scraper.const';
import { browserService, TEMP_DOWNLOAD_DIR } from './browser.service';

export class AiScraperService {
  private readonly repoRoot: string;
  private readonly finalDir: string;
  private readonly editImageDir: string;

  constructor() {
    this.repoRoot = process.cwd();

    this.finalDir = process.env.NODE_ENV === 'production'
      ? '/var/www/scraper-v2/content/images'
      : path.join(this.repoRoot, 'content', 'images');

    this.editImageDir = path.join(this.finalDir, 'edit');

    if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
      fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
    }

    if (!fs.existsSync(this.finalDir)) {
      fs.mkdirSync(this.finalDir, { recursive: true });
    }

    if (!fs.existsSync(this.editImageDir)) {
      fs.mkdirSync(this.editImageDir, { recursive: true });
    }
  }

  public async generateContent(prompt: string): Promise<string> {
    console.log('[AiScraper] Starting content generation task...');

    try {
      const page = await this.setupChatSession(prompt);

      console.log('[AiScraper] Waiting for response generation...');
      await page.waitForSelector(SCRAPER_CONFIG.VOICE_BTN_SELECTOR, {
        visible: true,
        timeout: 180000
      });

      console.log('[AiScraper] Response ready. Finding copy button...');
      await this.waitForCopyButton(page);

      const copyButtons = await page.$$(SCRAPER_CONFIG.COPY_BTN_SELECTOR);
      const lastCopyBtn = copyButtons[copyButtons.length - 1];

      if (!lastCopyBtn) throw new Error('Copy button not found');

      await lastCopyBtn.click();
      await new Promise(r => setTimeout(r, 1000));

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      console.log('[AiScraper] Content retrieved successfully.');

      return clipboardText;

    } catch (error) {
      console.error("[AiScraper] Text generation failed:", error);
      throw error;
    }
  }

  public async generateImage(prompt: string, webpFormat?: boolean, imageMaxSizeKB?: number): Promise<string> {
    console.log('[AiScraper] Starting IMAGE generation task...');



    if (!fs.existsSync(this.finalDir)) fs.mkdirSync(this.finalDir, { recursive: true });

    try {
      const page = await this.setupChatSession(prompt, true);

      console.log('[AiScraper] Waiting for image generation...');

      try {
        await page.waitForSelector(SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR, {
          visible: true,
          timeout: 60000
        });
      } catch (timeoutError) {
        await this.checkContentViolation(page);
        throw timeoutError;
      }

      console.log('[AiScraper] Image generated. Starting download...');

      await new Promise(r => setTimeout(r, 2000));
      await this.clickElement(page, SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR);

      const finalFilePath = await this.handleDownloadedFile(TEMP_DOWNLOAD_DIR, this.finalDir, imageMaxSizeKB, webpFormat);

      const relativePath = path.relative(this.repoRoot, finalFilePath);
      console.log(`[AiScraper] Image saved: ${relativePath}`);

      return relativePath;

    } catch (error) {
      console.error("[AiScraper] Image generation failed:", error);
      throw error;
    }
  }

  public async generateEditImage(prompt: string, webpFormat?: boolean, imageMaxSizeKB?: number, localFilePath?: string): Promise<string> {
    console.log('[AiScraper] Starting IMAGE EDIT generation task...');

    if (!fs.existsSync(this.editImageDir)) fs.mkdirSync(this.editImageDir, { recursive: true });

    try {
      const page = await this.setupChatSession(prompt, true, localFilePath);
      console.log('[AiScraper] Waiting for image edit generation...');

      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          fs.rmSync(localFilePath, { force: true });
          console.log(`[Worker] Cleaned up source file: ${localFilePath}`);
        } catch (e) {
          console.error(`[Worker] Failed to cleanup source file: ${e}`);
        }
      }

      try {
        await page.waitForSelector(SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR, {
          visible: true,
          timeout: 5 *60000
        });
      } catch (timeoutError) {
        await this.checkContentViolation(page);
        throw timeoutError;
      }

      console.log('[AiScraper] Image edit generated. Starting download...');
      await new Promise(r => setTimeout(r, 2000));
      await this.clickElement(page, SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR);

      const finalFilePath = await this.handleDownloadedFile(TEMP_DOWNLOAD_DIR, this.editImageDir, imageMaxSizeKB, webpFormat);

      const relativePath = path.relative(this.repoRoot, finalFilePath);
      console.log(`[AiScraper] Image edit saved: ${relativePath}`);
      return relativePath;
    } catch (error) {
      console.error("[AiScraper] Image edit generation failed:", error);
      throw error;
    }
  }


  private async setupChatSession(prompt: string, isImageMode = false, localFilePath?: string): Promise<Page> {
    const page = await browserService.getMainPage();

    if (!page.url().includes(SCRAPER_CONFIG.WEB_URL)) {
      await page.goto(SCRAPER_CONFIG.WEB_URL, { waitUntil: 'networkidle2' });
    }

    const newChatBtn = await page.$(SCRAPER_CONFIG.NEW_CHAT_BTN_SELECTOR);
    if (newChatBtn) {
      await newChatBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      await page.reload({ waitUntil: 'networkidle2' });
    }

    if (isImageMode) {
      if (SCRAPER_CONFIG.TOOLS_BTN_SELECTOR) {
        await this.clickElement(page, SCRAPER_CONFIG.TOOLS_BTN_SELECTOR);
        await new Promise(r => setTimeout(r, 500));
      }
      if (SCRAPER_CONFIG.IMAGE_BTN_SELECTOR) {
        await this.clickElement(page, SCRAPER_CONFIG.IMAGE_BTN_SELECTOR);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const editorSelector = SCRAPER_CONFIG.PROMPT_INPUT_SELECTOR;
    await page.waitForSelector(editorSelector, { timeout: 10000 });
    await page.focus(editorSelector);

    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    if (localFilePath) {
      try {
        const buffer = fs.readFileSync(localFilePath);
        const base64Image = buffer.toString('base64');
        const ext = path.extname(localFilePath).toLowerCase().replace('.', '');

        let mimeType = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        if (ext === 'webp') mimeType = 'image/webp';

        await page.evaluate(async (base64, mime) => {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mime });

          await navigator.clipboard.write([
            new ClipboardItem({ [mime]: blob })
          ]);
        }, base64Image, mimeType);

        await page.keyboard.down(modifier);
        await page.keyboard.press('V');
        await page.keyboard.up(modifier);

        await new Promise(r => setTimeout(r, 2000));

      } catch (error) {
        console.error(error);
      }
    }

    await page.evaluate((text) => navigator.clipboard.writeText(text), prompt);
    await page.keyboard.down(modifier);
    await page.keyboard.press('V');
    await page.keyboard.up(modifier);
    await new Promise(r => setTimeout(r, 800));

    await page.waitForSelector(SCRAPER_CONFIG.SEND_BTN_SELECTOR, { timeout: 30000 });

    await page.keyboard.press('Enter');
    return page;
  }

  private async checkContentViolation(page: Page): Promise<void> {
    console.warn('[AiScraper] Timeout waiting for result. Checking for violations...');

    const violationError = await page.evaluate((selector, keywords) => {
      const messages = document.querySelectorAll(selector);
      if (messages.length === 0) return null;

      const lastMessage = messages[messages.length - 1];
      const text = lastMessage.textContent?.toLowerCase() || '';

      const isViolation = keywords.some((k: string) => text.includes(k.toLowerCase()));
      return isViolation ? lastMessage.textContent : null;
    }, SCRAPER_CONFIG.VIOLATION_SELECTOR, SCRAPER_CONFIG.VIOLATION_KEYWORDS);

    if (violationError) {
      throw new Error(`CONTENT_POLICY_VIOLATION: ${violationError}`);
    }
  }

  private async waitForCopyButton(page: Page) {
    return page.waitForFunction((selector: any) => {
      const buttons = document.querySelectorAll(selector);
      const lastBtn = buttons[buttons.length - 1] as HTMLButtonElement;
      return lastBtn && !lastBtn.disabled;
    }, { timeout: 30000 }, SCRAPER_CONFIG.COPY_BTN_SELECTOR);
  }

  private async handleDownloadedFile(
    sourceDir: string,
    destDir: string,
    imageMaxSizeKB?: number,
    webpFormat?: boolean,
    timeout = 60000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkInterval = setInterval(async () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Download timeout: No new file detected in temp folder.'));
          return;
        }

        let files: string[] = [];
        try {
          files = fs.readdirSync(sourceDir);
        } catch (e) { return; }

        const validFiles = files.filter(file =>
          !file.endsWith('.crdownload') &&
          !file.endsWith('.tmp') &&
          /\.(png|jpg|jpeg|webp)$/i.test(file)
        );

        if (validFiles.length > 0) {
          const newestFile = validFiles.map(fileName => {
            const filePath = path.join(sourceDir, fileName);
            return {
              name: fileName,
              time: fs.statSync(filePath).mtime.getTime(),
              path: filePath
            };
          }).sort((a, b) => b.time - a.time)[0];

          if (Date.now() - newestFile.time < 60000) {
            clearInterval(checkInterval);

            try {
              const newName = `image-${uuidv4()}.webp`;
              let finalPath = path.join(destDir, newName);

              if (imageMaxSizeKB) {
                console.log(`[Process] Compressing ${newestFile.name} to <${imageMaxSizeKB}KB...`);
                await ImageHelper.compressToSize(newestFile.path, finalPath, imageMaxSizeKB);
                fs.unlinkSync(newestFile.path);
              } else if (webpFormat) {
                console.log(`[Process] Converting ${newestFile.name} to WebP...`);
                await ImageHelper.convertToWebP(newestFile.path, finalPath);
                fs.unlinkSync(newestFile.path);
              } else {
                const ext = path.extname(newestFile.name);
                finalPath = path.join(destDir, `image-${uuidv4()}${ext}`);
                console.log(`[Process] Moving raw file ${newestFile.name}...`);
                fs.renameSync(newestFile.path, finalPath);
              }

              console.log(`[Success] Saved to "${finalPath}"`);
              resolve(finalPath);
            } catch (err) {
              console.error('Failed to process image:', err);
              reject(err);
            }
          }
        }
      }, 1000);
    });
  }

  private async clickElement(page: Page, selector: string, timeout = 10000) {
    let element: ElementHandle | null = null;
    console.log(`[AiScraper] Waiting for selector: ${selector}`);

    if (selector.startsWith('//')) {
      try {
        await page.waitForSelector(`xpath/${selector}`, { timeout, visible: true });
        const elements = await page.$$(`xpath/${selector}`);
        element = elements[0];
      } catch (e) {
        console.warn("XPath wait failed, trying evaluation match...");
        throw e;
      }
    } else {
      await page.waitForSelector(selector, { timeout, visible: true });
      element = await page.$(selector);
    }

    if (element) {
      await element.click();
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }
}