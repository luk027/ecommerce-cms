const fs = require('fs')
const path = require('path')

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      walk(p)
    } else if (f.endsWith('.js')) {
      const content = fs.readFileSync(p, 'utf8')
      if (content.includes("index.scss")) {
        const scssPath = path.join(dir, 'index.scss')
        if (!fs.existsSync(scssPath)) {
          fs.writeFileSync(scssPath, '/* empty */\n')
          console.log('Created:', scssPath)
        }
      }
    }
  }
}

walk('node_modules/@payloadcms/ui/dist')

// Fix assets index.js
const assetsIndex = path.join('node_modules/@payloadcms/ui/dist/assets/index.js')
if (fs.existsSync(assetsIndex)) {
  fs.writeFileSync(
    assetsIndex,
    `export const payloadFavicon = '/payload-favicon.svg';
export const payloadFaviconDark = '/payload-favicon-dark.png';
export const payloadFaviconLight = '/payload-favicon-light.png';
export const staticOGImage = '/static-og-image.png';
export default payloadFavicon;
`
  )
  console.log('Fixed assets index.js')
}

console.log('Done creating missing scss files')
