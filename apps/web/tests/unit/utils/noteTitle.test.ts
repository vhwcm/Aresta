import { describe, it, expect } from 'vitest'
import { resolveNoteTitle, extractTitleFromMarkdown } from '../../../app/utils/noteTitle'

describe('noteTitle utility', () => {
  describe('extractTitleFromMarkdown', () => {
    it('extrai título do primeiro cabeçalho markdown #', () => {
      expect(extractTitleFromMarkdown('# Arquitetura Hexagonal\n\nConteúdo explicativo')).toBe('Arquitetura Hexagonal')
    })

    it('extrai título de cabeçalho ## e remove formatações', () => {
      expect(extractTitleFromMarkdown('## **Teoria do Caos**\n\nOutro texto')).toBe('Teoria do Caos')
    })

    it('ignora cabeçalhos genéricos ou templates padrão', () => {
      expect(extractTitleFromMarkdown('# Nova Anotação\n\nTexto')).toBeNull()
      expect(extractTitleFromMarkdown('# Nova Nota\n\nTexto')).toBeNull()
      expect(extractTitleFromMarkdown('# Nota\n\nTexto')).toBeNull()
      expect(extractTitleFromMarkdown('# Sem Título\n\nTexto')).toBeNull()
    })

    it('retorna null se conteúdo estiver vazio ou sem cabeçalho', () => {
      expect(extractTitleFromMarkdown('')).toBeNull()
      expect(extractTitleFromMarkdown(null)).toBeNull()
      expect(extractTitleFromMarkdown('Apenas um parágrafo sem cabeçalho.')).toBeNull()
    })
  })

  describe('resolveNoteTitle', () => {
    it('retorna o título explícito quando fornecido', () => {
      expect(resolveNoteTitle('Filosofia Antiga', '# Qualquer coisa')).toBe('Filosofia Antiga')
    })

    it('retorna "Nota" quando nenhum título ou cabeçalho for informado', () => {
      expect(resolveNoteTitle('', '')).toBe('Nota')
      expect(resolveNoteTitle(null, null)).toBe('Nota')
      expect(resolveNoteTitle('   ', 'Texto sem cabeçalho')).toBe('Nota')
    })

    it('substitui títulos legados "Nova Nota" por "Nota" se não houver cabeçalho customizado', () => {
      expect(resolveNoteTitle('Nova Nota', '')).toBe('Nota')
      expect(resolveNoteTitle('Nova nota', '# Nova Anotação')).toBe('Nota')
      expect(resolveNoteTitle('Nota sem título', '')).toBe('Nota')
    })

    it('extrai cabeçalho markdown se título for vazio ou "Nova Nota"', () => {
      expect(resolveNoteTitle('', '# Estruturas de Dados\n\nGrafos e árvores')).toBe('Estruturas de Dados')
      expect(resolveNoteTitle('Nova Nota', '# Redes Convolucionais\n\nVisão computacional')).toBe('Redes Convolucionais')
    })
  })
})
