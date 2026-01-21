import { ElementHandle } from 'puppeteer-core';
import { SCRAPER_CONFIG } from '../lib/scraper.const';
import { browserService, TEMP_DOWNLOAD_DIR } from './browser.service'; // Import TEMP_DIR
import path from 'node:path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { production } from '../lib/node-env';

export class AiScraperService {

  public async generateContent(prompt: string): Promise<string> {
    console.log('[AiScraper] Starting content generation task...');
    
    try {
      const page = await browserService.getMainPage();
      console.log('[AiScraper] Attached to main page.');

      if (!page.url().includes(SCRAPER_CONFIG.WEB_URL)) {
        console.log(`[AiScraper] Navigating to target URL: ${SCRAPER_CONFIG.WEB_URL}`);
        await page.goto(SCRAPER_CONFIG.WEB_URL, { waitUntil: 'networkidle2' });
      }

      const newChatBtn = await page.$(SCRAPER_CONFIG.NEW_CHAT_BTN_SELECTOR);
      if (newChatBtn) {
        console.log('[AiScraper] Clicking "New Chat" button...');
        await newChatBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log('[AiScraper] "New Chat" button not found. Reloading page...');
        await page.reload({ waitUntil: 'networkidle2' });
      }

      const editorSelector = SCRAPER_CONFIG.PROMPT_INPUT_SELECTOR;
      console.log('[AiScraper] Waiting for input field...');
      await page.waitForSelector(editorSelector, { timeout: 10000 });
      
      console.log('[AiScraper] Pasting prompt...');
      await page.focus(editorSelector);
      
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, prompt);

      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';
      
      await page.keyboard.down(modifier);
      await page.keyboard.press('V');
      await page.keyboard.up(modifier);
      
      await new Promise(r => setTimeout(r, 800));
      
      console.log('[AiScraper] Sending prompt (Enter)...');
      await page.keyboard.press('Enter');

      console.log('[AiScraper] Waiting for response generation (Voice Button signal)...');
      await page.waitForSelector(SCRAPER_CONFIG.VOICE_BTN_SELECTOR, { 
        visible: true, 
        timeout: 180000 
      });
      console.log('[AiScraper] Response generation complete.');

      const copyBtnSelector = SCRAPER_CONFIG.COPY_BTN_SELECTOR;
      console.log('[AiScraper] Waiting for Copy button to be ready...');
      
      await page.waitForFunction((selector: any) => {
        const buttons = document.querySelectorAll(selector);
        const lastBtn = buttons[buttons.length - 1] as HTMLButtonElement;
        return lastBtn && !lastBtn.disabled;
      }, { timeout: 30000 }, copyBtnSelector);

      await new Promise(r => setTimeout(r, 1500));

      const copyButtons = await page.$$(copyBtnSelector);
      const lastCopyBtn = copyButtons[copyButtons.length - 1];
      
      if (!lastCopyBtn) throw new Error('Copy button not found');
      
      console.log('[AiScraper] Clicking Copy button...');
      await lastCopyBtn.click();
      
      await new Promise(r => setTimeout(r, 1000));

      console.log('[AiScraper] Reading content from clipboard...');
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

      console.log('[AiScraper] Content retrieved successfully.');
      return clipboardText;

    } catch (error) {
      console.error("[AiScraper] Scraping process failed:", error);
      throw error;
    }
  }

  public async generateImage(prompt: string): Promise<string> {
    console.log('[AiScraper] Starting IMAGE generation task...');
    
    const repoRoot = process.cwd();
    let finalDir: string;

    if (env.NODE_ENV === production) {
        finalDir = '/var/www/scraper-v2/content/images';
    } else {
        finalDir = path.join(process.cwd(), 'content', 'images');
    }

    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    try {
      const page = await browserService.getMainPage();
      console.log('[AiScraper] Attached to main page.');

      if (!page.url().includes(SCRAPER_CONFIG.WEB_URL)) {
        console.log(`[AiScraper] Navigating to target URL: ${SCRAPER_CONFIG.WEB_URL}`);
        await page.goto(SCRAPER_CONFIG.WEB_URL, { waitUntil: 'networkidle2' });
      }

      const newChatBtn = await page.$(SCRAPER_CONFIG.NEW_CHAT_BTN_SELECTOR);
      if (newChatBtn) {
        console.log('[AiScraper] Clicking "New Chat" button...');
        await newChatBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      } else {
        await page.reload({ waitUntil: 'networkidle2' });
      }

      if (SCRAPER_CONFIG.TOOLS_BTN_SELECTOR) {
        console.log('[AiScraper] Opening Tools Menu...');
        await this.clickElement(page, SCRAPER_CONFIG.TOOLS_BTN_SELECTOR);
        await new Promise(r => setTimeout(r, 1000));
      }

      if (SCRAPER_CONFIG.IMAGE_BTN_SELECTOR) {
        console.log('[AiScraper] Selecting Image Mode...');
        await this.clickElement(page, SCRAPER_CONFIG.IMAGE_BTN_SELECTOR);
        await new Promise(r => setTimeout(r, 1000));
      }

      const editorSelector = SCRAPER_CONFIG.PROMPT_INPUT_SELECTOR;
      console.log('[AiScraper] Waiting for input field...');
      await page.waitForSelector(editorSelector, { timeout: 10000 });
      
      console.log('[AiScraper] Pasting prompt...');
      await page.focus(editorSelector);
      
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, prompt);

      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';
      
      await page.keyboard.down(modifier);
      await page.keyboard.press('V');
      await page.keyboard.up(modifier);
      
      await new Promise(r => setTimeout(r, 800)); 
      
      console.log('[AiScraper] Sending prompt (Enter)...');
      await page.keyboard.press('Enter');

      console.log('[AiScraper] Waiting for generation to finish (Download signal)...');
      await page.waitForSelector(SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR, { 
        visible: true, 
        timeout: 240000 
      });
      console.log('[AiScraper] Generation complete signal received.');

      await new Promise(r => setTimeout(r, 2000)); 

      console.log('[AiScraper] Looking for Download button...');
      await this.clickElement(page, SCRAPER_CONFIG.DOWNLOAD_BTN_SELECTOR);
      console.log('[AiScraper] Download clicked. Polling temp folder...');

      const finalFilePath = await this.handleDownloadedFile(TEMP_DOWNLOAD_DIR, finalDir);
      
      const relativePath = path.relative(repoRoot, finalFilePath);
      console.log(`[AiScraper] Image saved successfully: ${relativePath}`);
      
      return relativePath;

    } catch (error) {
      console.error("[AiScraper] Image generation failed:", error);
      throw error;
    }
  }

  private async handleDownloadedFile(sourceDir: string, destDir: string, timeout = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Download timeout: No new file detected in temp folder.'));
        }

        let files: string[] = [];
        try {
            files = fs.readdirSync(sourceDir);
        } catch (e) {
            return; 
        }

        const validFiles = files.filter(file => 
            !file.endsWith('.crdownload') && 
            !file.endsWith('.tmp') &&
            (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp'))
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

                const ext = path.extname(newestFile.name); 
                const newName = `image-${uuidv4()}${ext}`; 
                const finalPath = path.join(destDir, newName);

                try {
                    fs.renameSync(newestFile.path, finalPath);
                    console.log(`[File] Moved & Renamed "${newestFile.name}" -> "${newName}"`);
                    resolve(finalPath);
                } catch (err) {
                    console.error('Failed to move file:', err);
                    reject(err);
                }
            }
        }
      }, 1000); 
    });
  }

  private async clickElement(page: any, selector: string, timeout = 10000) {
    let element: ElementHandle | null = null;

    console.log(`[AiScraper] Waiting for selector: ${selector}`);

    if (selector.startsWith('//')) {
      // XPath handling
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