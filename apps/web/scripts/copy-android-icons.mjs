import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src-tauri/icons/android')
const dstDir = path.resolve(__dirname, '../src-tauri/gen/android/app/src/main/res')

if (fs.existsSync(srcDir) && fs.existsSync(dstDir)) {
  fs.cpSync(srcDir, dstDir, { recursive: true })
  console.log('✓ Ícones do Android sincronizados com sucesso em gen/android/app/src/main/res')
} else if (!fs.existsSync(srcDir)) {
  console.warn('! Diretório de ícones src-tauri/icons/android não encontrado.')
}
