import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function generateFavicons() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  const svgPath = path.resolve('public/favicon.svg')
  const svgContent = fs.readFileSync(svgPath, 'utf-8')
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: transparent; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `)
  
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'favicon.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 }
  ]
  
  for (const item of sizes) {
    await page.setViewportSize({ width: item.size, height: item.size })
    const outPath = path.resolve('public', item.name)
    await page.screenshot({ path: outPath, omitBackground: true })
    console.log(`Generated ${item.name} (${item.size}x${item.size})`)
  }
  
  await browser.close()
}

generateFavicons().catch(console.error)
