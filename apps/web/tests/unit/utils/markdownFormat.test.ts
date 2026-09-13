import { describe, it, expect } from 'vitest';
import {
  applyMarkdownFormat,
  renderInlineMarkdown,
  renderMarkdown,
  escapeHtml,
} from '../../../app/utils/markdownFormat';

describe('applyMarkdownFormat utility', () => {
  describe('Formatação de Negrito (bold)', () => {
    it('envolve texto selecionado com **', () => {
      const text = 'Olá mundo maravilhoso';
      // seleciona "mundo" (índice 4 a 9)
      const res = applyMarkdownFormat(text, 4, 9, 'bold');
      expect(res.newText).toBe('Olá **mundo** maravilhoso');
      // Cursor mantém o texto selecionado dentro dos asteriscos
      expect(res.selectionStart).toBe(6);
      expect(res.selectionEnd).toBe(11);
    });

    it('desfaz formatação se o texto selecionado já contiver ** externamente', () => {
      const text = 'Olá **mundo** maravilhoso';
      // seleciona "mundo" que está envolvido por ** (índice 6 a 11)
      const res = applyMarkdownFormat(text, 6, 11, 'bold');
      expect(res.newText).toBe('Olá mundo maravilhoso');
      expect(res.selectionStart).toBe(4);
      expect(res.selectionEnd).toBe(9);
    });

    it('desfaz formatação se a seleção incluir os asteriscos **mundo**', () => {
      const text = 'Olá **mundo** maravilhoso';
      // seleciona "**mundo**" (índice 4 a 13)
      const res = applyMarkdownFormat(text, 4, 13, 'bold');
      expect(res.newText).toBe('Olá mundo maravilhoso');
      expect(res.selectionStart).toBe(4);
      expect(res.selectionEnd).toBe(9);
    });

    it('insere **** e posiciona o cursor no meio se nada estiver selecionado', () => {
      const text = 'Texto ';
      const res = applyMarkdownFormat(text, 6, 6, 'bold');
      expect(res.newText).toBe('Texto ****');
      expect(res.selectionStart).toBe(8);
      expect(res.selectionEnd).toBe(8);
    });

    it('remove **** se o cursor estiver no meio de marcadores vazios', () => {
      const text = 'Texto ****';
      // cursor no meio: Texto **|** (índice 8)
      const res = applyMarkdownFormat(text, 8, 8, 'bold');
      expect(res.newText).toBe('Texto ');
      expect(res.selectionStart).toBe(6);
      expect(res.selectionEnd).toBe(6);
    });
  });

  describe('Formatação de Itálico (italic)', () => {
    it('envolve texto selecionado com *', () => {
      const text = 'Olá mundo maravilhoso';
      // seleciona "mundo" (índice 4 a 9)
      const res = applyMarkdownFormat(text, 4, 9, 'italic');
      expect(res.newText).toBe('Olá *mundo* maravilhoso');
      expect(res.selectionStart).toBe(5);
      expect(res.selectionEnd).toBe(10);
    });

    it('desfaz formatação se o texto selecionado já contiver * externamente', () => {
      const text = 'Olá *mundo* maravilhoso';
      // seleciona "mundo" (índice 5 a 10)
      const res = applyMarkdownFormat(text, 5, 10, 'italic');
      expect(res.newText).toBe('Olá mundo maravilhoso');
      expect(res.selectionStart).toBe(4);
      expect(res.selectionEnd).toBe(9);
    });

    it('desfaz formatação se a seleção incluir os asteriscos *mundo*', () => {
      const text = 'Olá *mundo* maravilhoso';
      // seleciona "*mundo*" (índice 4 a 11)
      const res = applyMarkdownFormat(text, 4, 11, 'italic');
      expect(res.newText).toBe('Olá mundo maravilhoso');
      expect(res.selectionStart).toBe(4);
      expect(res.selectionEnd).toBe(9);
    });

    it('insere ** e posiciona o cursor no meio se nada estiver selecionado', () => {
      const text = 'Texto ';
      const res = applyMarkdownFormat(text, 6, 6, 'italic');
      expect(res.newText).toBe('Texto **');
      expect(res.selectionStart).toBe(7);
      expect(res.selectionEnd).toBe(7);
    });

    it('remove ** se o cursor estiver no meio de marcadores vazios', () => {
      const text = 'Texto **';
      // cursor no meio: Texto *|* (índice 7)
      const res = applyMarkdownFormat(text, 7, 7, 'italic');
      expect(res.newText).toBe('Texto ');
      expect(res.selectionStart).toBe(6);
      expect(res.selectionEnd).toBe(6);
    });

    it('não confunde negrito ** com itálico * ao aplicar itálico sobre texto em negrito', () => {
      const text = 'Olá **mundo** maravilhoso';
      // seleciona "mundo" dentro do negrito (índice 6 a 11)
      // ao aplicar itálico, deve envolver com * tornando-o negrito+itálico ***mundo***
      const res = applyMarkdownFormat(text, 6, 11, 'italic');
      expect(res.newText).toBe('Olá ***mundo*** maravilhoso');
      expect(res.selectionStart).toBe(7);
      expect(res.selectionEnd).toBe(12);
    });
  });

  describe('escapeHtml', () => {
    it('escapa tags e caracteres perigosos', () => {
      const raw = '<script>alert("xss")</script> & "aspas"';
      expect(escapeHtml(raw)).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;aspas&quot;'
      );
    });
  });

  describe('renderInlineMarkdown', () => {
    it('retorna string vazia para valores nulos ou vazios', () => {
      expect(renderInlineMarkdown(null)).toBe('');
      expect(renderInlineMarkdown(undefined)).toBe('');
      expect(renderInlineMarkdown('')).toBe('');
    });

    it('renderiza itálico com asterisco simples', () => {
      const input = 'Segundo *O Programador Pragmático*';
      const output = renderInlineMarkdown(input);
      expect(output).toContain('<em>O Programador Pragmático</em>');
      expect(output).not.toContain('<p>');
    });

    it('renderiza negrito com asterisco duplo', () => {
      const input = 'manter a **ortogonalidade** do código';
      const output = renderInlineMarkdown(input);
      expect(output).toContain('<strong>ortogonalidade</strong>');
      expect(output).not.toContain('<p>');
    });

    it('renderiza negrito e itálico combinados no mesmo texto', () => {
      const input =
        'Segundo *O Programador Pragmático*, quais são as principais práticas para manter a **ortogonalidade** do código durante o desenvolvimento?';
      const output = renderInlineMarkdown(input);
      expect(output).toContain('<em>O Programador Pragmático</em>');
      expect(output).toContain('<strong>ortogonalidade</strong>');
      expect(output).not.toContain('*O Programador');
      expect(output).not.toContain('**ortogonalidade**');
    });

    it('renderiza código inline com crase', () => {
      const input = 'Use a função `renderInlineMarkdown()`';
      const output = renderInlineMarkdown(input);
      expect(output).toContain('<code>renderInlineMarkdown()</code>');
    });

    it('escapa injeções de script preservando a formatação markdown', () => {
      const input = '**Negrito** <script>alert("hack")</script>';
      const output = renderInlineMarkdown(input);
      expect(output).toContain('<strong>Negrito</strong>');
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });
  });

  describe('renderMarkdown', () => {
    it('renderiza markdown em múltiplos parágrafos e preserva negrito/itálico', () => {
      const input = 'Parágrafo 1 com **negrito**.\n\nParágrafo 2 com *itálico*.';
      const output = renderMarkdown(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>negrito</strong>');
      expect(output).toContain('<em>itálico</em>');
    });
  });
});

