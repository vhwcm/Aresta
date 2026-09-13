import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src-tauri/icons/android')
const androidProjectDir = path.resolve(__dirname, '../src-tauri/gen/android')
const dstDir = path.resolve(androidProjectDir, 'app/src/main/res')

if (!fs.existsSync(srcDir)) {
  console.warn('! Diretório de ícones src-tauri/icons/android não encontrado.')
} else if (fs.existsSync(androidProjectDir)) {
  fs.mkdirSync(dstDir, { recursive: true })
  fs.cpSync(srcDir, dstDir, { recursive: true })
  console.log('✓ Ícones oficiais do Android sincronizados com sucesso em gen/android/app/src/main/res')
} else {
  console.log('• Projeto gen/android ainda não inicializado. Os ícones serão copiados automaticamente no build.')
}
