import core from '@actions/core'
import github from '@actions/github'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_FILES_TO_SEND = 25
const MAX_FILE_PATCH_CHARS = 3500
const MAX_PROMPT_CHARS = 30000
const MAX_COMMENT_CHARS = 60000

const CODE_FILE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.vue',
  '.svelte',
  '.html',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.json',
  '.yml',
  '.yaml',
  '.sh',
  '.mdx',
  '.py',
  '.go',
  '.java',
  '.rb',
  '.rs',
  '.php',
  '.cs',
])

const IGNORED_EXACT_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'nuxt.config.ts',
  'nuxt.config.js',
  'playwright.config.ts',
  'playwright.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'eslint.config.js',
  'eslint.config.mjs',
  'prettier.config.js',
  '.prettierrc',
  '.prettierrc.json',
  '.eslintrc',
  '.eslintrc.json',
  'README.md',
  'CHANGELOG.md',
])

const IGNORED_PATH_PREFIXES = [
  '.github/',
  'docs/',
  'node_modules/',
]

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function getExtension(filePath) {
  const normalized = normalizePath(filePath)
  const lastSlash = normalized.lastIndexOf('/')
  const fileName = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : ''
}

function isDocsFile(filePath) {
  return normalizePath(filePath).startsWith('docs/')
}

function isIgnoredFile(filePath) {
  const normalized = normalizePath(filePath)
  if (IGNORED_EXACT_FILES.has(normalized)) return true
  return IGNORED_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix))
}

function isCodeFile(filePath) {
  if (isDocsFile(filePath)) return false
  if (isIgnoredFile(filePath)) return false
  return CODE_FILE_EXTENSIONS.has(getExtension(filePath))
}

function clampText(value, limit) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}\n\n[... conteúdo truncado por limite de tamanho ...]`
}

function stripCodeFences(text) {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:mdx|markdown|md)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) return fenceMatch[1].trim()
  return trimmed
}

function buildDiffBundle(files) {
  const chunks = []
  let totalChars = 0

  for (const file of files.slice(0, MAX_FILES_TO_SEND)) {
    const header = `### ${file.status.toUpperCase()} ${file.filename}`
    const body = file.patch
      ? clampText(file.patch, MAX_FILE_PATCH_CHARS)
      : '[Sem patch disponível pela API para este arquivo.]'
    const chunk = `${header}\n${body}\n`

    if (totalChars + chunk.length > MAX_PROMPT_CHARS) {
      chunks.push('\n[Diff truncado por limite de tamanho do prompt.]')
      break
    }

    chunks.push(chunk)
    totalChars += chunk.length
  }

  return chunks.join('\n')
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  const geminiKey = process.env.GEMINI_API_KEY

  if (!token) {
    core.setFailed('GITHUB_TOKEN não foi fornecido.')
    return
  }

  if (!geminiKey) {
    core.warning('GEMINI_API_KEY não foi fornecida; pulando análise de documentação.')
    return
  }

  const { context } = github
  const pullRequest = context.payload.pull_request

  if (!pullRequest) {
    core.setFailed('Este workflow só pode rodar em eventos de Pull Request.')
    return
  }

  const octokit = github.getOctokit(token)
  const { owner, repo } = context.repo
  const pull_number = pullRequest.number

  core.info(`Carregando arquivos do PR #${pull_number}...`)

  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number,
    per_page: 100,
  })

  const touchedDocs = files.some(file => isDocsFile(file.filename))
  if (touchedDocs) {
    core.info('A pasta docs/ já foi alterada neste PR. Nenhuma sugestão será gerada.')
    return
  }

  const codeFiles = files.filter(file => isCodeFile(file.filename))
  if (codeFiles.length === 0) {
    core.info('Nenhum arquivo de código relevante foi alterado após o filtro. Nada a fazer.')
    return
  }

  const diffBundle = buildDiffBundle(codeFiles)

  if (!diffBundle.trim()) {
    core.warning('Não foi possível montar um diff útil para enviar ao Gemini.')
    return
  }

  const prompt = [
    'Você é um redator técnico especialista em Mintlify.',
    'Analise este diff de código e gere documentação em formato MDX explicando as novas funcionalidades ou mudanças na regra de negócio.',
    'Retorne apenas o código MDX pronto para uso, sem explicações adicionais e sem blocos de texto fora do MDX.',
    '',
    'DIFF:',
    diffBundle,
  ].join('\n')

  core.info('Chamando Gemini para gerar sugestão de documentação...')

  const genAI = new GoogleGenerativeAI(geminiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const response = await model.generateContent(prompt)
  const generatedText = response.response.text()
  const mdx = stripCodeFences(generatedText)

  if (!mdx) {
    core.warning('O Gemini retornou uma resposta vazia.')
    return
  }

  const commentBody = clampText(
    [
      '## Sugestão automática de documentação',
      '',
      'A pasta `docs/` não foi alterada neste PR. Abaixo está uma sugestão de documentação em MDX gerada automaticamente a partir do diff de código.',
      '',
      '```mdx',
      mdx,
      '```',
    ].join('\n'),
    MAX_COMMENT_CHARS,
  )

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: commentBody,
  })

  core.info('Comentário postado com sucesso no Pull Request.')
}

main().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error))
})
