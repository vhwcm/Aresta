import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src-tauri/icons/android')
const androidProjectDir = path.resolve(__dirname, '../src-tauri/gen/android')
const dstDir = path.resolve(androidProjectDir, 'app/src/main/res')

console.log('=== Configurando Recursos e Modo Fullscreen do Android ===')

// 1. Sincronizar Ícones Oficiais do Android
if (!fs.existsSync(srcDir)) {
  console.warn('! Diretório de ícones src-tauri/icons/android não encontrado.')
} else if (fs.existsSync(androidProjectDir)) {
  fs.mkdirSync(dstDir, { recursive: true })
  fs.cpSync(srcDir, dstDir, { recursive: true })
  console.log('✓ Ícones oficiais do Android sincronizados com sucesso em gen/android/app/src/main/res')
} else {
  console.log('• Projeto gen/android ainda não inicializado. Os ícones serão copiados automaticamente no build.')
}

// 2. Configurar MainActivity.kt com Modo Imersivo Fullscreen Sticky
function configureMainActivity() {
  if (!fs.existsSync(androidProjectDir)) return

  const javaDir = path.resolve(androidProjectDir, 'app/src/main/java')
  if (!fs.existsSync(javaDir)) return

  function findMainActivity(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
        const found = findMainActivity(fullPath)
        if (found) return found
      } else if (file.name === 'MainActivity.kt') {
        return fullPath
      }
    }
    return null
  }

  const mainActivityPath = findMainActivity(javaDir)
  if (mainActivityPath) {
    console.log(`• Configurando Fullscreen em ${mainActivityPath}`)
    const content = fs.readFileSync(mainActivityPath, 'utf-8')
    
    // Se ainda não tiver o método hideSystemBars
    if (!content.includes('hideSystemBars')) {
      const updatedContent = `package com.aresta.reader

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    hideSystemBars()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      hideSystemBars()
    }
  }

  private fun hideSystemBars() {
    try {
      WindowCompat.setDecorFitsSystemWindows(window, false)
      val controller = WindowInsetsControllerCompat(window, window.decorView)
      controller.hide(WindowInsetsCompat.Type.systemBars())
      controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        window.attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}
`
      fs.writeFileSync(mainActivityPath, updatedContent, 'utf-8')
      console.log('✓ MainActivity.kt atualizado com suporte nativo a Fullscreen Imersivo Total (SystemBars Hidden)')
    }
  }
}

// 3. Configurar styles.xml e themes.xml com Fullscreen
function configureAndroidStyles() {
  if (!fs.existsSync(androidProjectDir)) return

  const valuesDir = path.resolve(androidProjectDir, 'app/src/main/res/values')
  if (!fs.existsSync(valuesDir)) return

  const styleFiles = ['styles.xml', 'themes.xml']
  for (const styleFile of styleFiles) {
    const stylePath = path.join(valuesDir, styleFile)
    if (fs.existsSync(stylePath)) {
      let content = fs.readFileSync(stylePath, 'utf-8')
      if (!content.includes('android:windowFullscreen')) {
        content = content.replace(
          /<\/style>/i,
          `  <item name="android:windowFullscreen">true</item>\n    <item name="android:windowNoTitle">true</item>\n    <item name="android:windowActionBar">false</item>\n    <item name="android:windowContentOverlay">@null</item>\n  </style>`
        )
        fs.writeFileSync(stylePath, content, 'utf-8')
        console.log(`✓ ${styleFile} atualizado com atributos Fullscreen e NoTitleBar`)
      }
    }
  }
}

// Executar configurações
try {
  configureMainActivity()
  configureAndroidStyles()
} catch (err) {
  console.warn('! Aviso ao configurar arquivos do Android:', err.message)
}
