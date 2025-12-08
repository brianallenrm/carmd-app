import puppeteer from 'puppeteer-core';
// @ts-ignore
import chromium from '@sparticuz/chromium';

// Interface for the browser instance doesn't change much between core and full
export async function getBrowser() {
    let browser;

    // Check if running on Vercel (or any production environment)
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // Configuration for Vercel Serverless
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: {
                width: 1920,
                height: 1080,
            },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless as any,
        });
    } else {
        // Local development - dynamically import full puppeteer 
        // to avoid bundling it in production build
        const { default: localPuppeteer } = await import('puppeteer');

        browser = await localPuppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }

    return browser;
}
