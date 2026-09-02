import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateBookletInput, AppendChapterInput } from '../schemas/didactic.schema.js';
import { didacticAIService } from './didacticAI.service.js';
import { DidacticPromptContext } from './didacticPromptEngine.service.js';

export class DidacticBookletService {
  /**
   * Cria um novo livreto didático independente (Standalone Booklet) com seu primeiro capítulo
   */
  async createBooklet(userId: number, input: CreateBookletInput) {
    const context: DidacticPromptContext = {
      topic: input.topic,
      depthLevel: input.depth_level,
      bookletTitle: input.title,
      chapterIndex: 1,
    };

    // Coleta contexto adicional de temas, flashcards ou anotações se fornecidos
    if (input.theme_id) {
      const theme = await prisma.theme.findUnique({ where: { id: input.theme_id } });
      if (theme) context.themeName = theme.name;
    }

    if (input.flashcard_id) {
      const flashcard = await prisma.flashcard.findUnique({
        where: { id: input.flashcard_id },
        include: { book: true },
      });
      if (flashcard) {
        context.flashcardQuestion = flashcard.question;
        context.flashcardAnswer = flashcard.answer;
        context.bookTitle = flashcard.book?.title;
      }
    }

    if (input.annotation_id) {
      const annotation = await prisma.annotation.findUnique({
        where: { id: input.annotation_id },
        include: { book: true },
      });
      if (annotation) {
        context.annotationQuote = annotation.selected_text || undefined;
        context.annotationNote = annotation.note || undefined;
        context.bookTitle = annotation.book?.title;
      }
    }

    // 1. Gera o conteúdo pedagógico via IA
    const aiResult = await didacticAIService.generateExplanation(context);
    const chapterTitle = input.title ? `Capítulo 1: ${aiResult.title}` : aiResult.title;
    const bookletTitle = input.title || aiResult.title;

    // 2. Transação Prisma para criar Book, UserBook, DidacticBooklet e Capítulo 1
    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: bookletTitle,
          file_path: `virtual://didactic_booklet`,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
          cover_path: null,
        },
      });

      await tx.userBook.create({
        data: {
          user_id: userId,
          book_id: book.id,
          status: 'LENDO',
          current_page: 0,
        },
      });

      if (input.theme_id) {
        await tx.bookTheme.create({
          data: {
            book_id: book.id,
            theme_id: input.theme_id,
          },
        });
      }

      const booklet = await tx.didacticBooklet.create({
        data: {
          user_id: userId,
          book_id: book.id,
          title: bookletTitle,
          description: `Livreto didático focado em: ${input.topic}`,
        },
      });

      const chapter = await tx.didacticBookletChapter.create({
        data: {
          booklet_id: booklet.id,
          order_index: 1,
          title: chapterTitle,
          topic: input.topic,
          raw_markdown: aiResult.markdown,
          flashcard_id: input.flashcard_id,
          annotation_id: input.annotation_id,
          theme_id: input.theme_id,
          diagram_count: aiResult.diagramCount,
        },
      });

      return {
        book,
        booklet: {
          ...booklet,
          chapters: [chapter],
        },
      };
    });

    return result;
  }

  /**
   * Anexa um novo capítulo didático a um livreto existente.
   * RESTRIÇÃO INEGOCIÁVEL: Só é permitido appendar em livros que sejam livretos didáticos ('DIDACTIC').
   */
  async appendChapterToBooklet(
    userId: number,
    targetBookIdOrBookletId: number | string,
    input: AppendChapterInput
  ) {
    // 1. Busca o livro ou livreto de destino
    let book: any = null;
    let booklet: any = null;

    if (typeof targetBookIdOrBookletId === 'number') {
      book = await prisma.book.findUnique({
        where: { id: targetBookIdOrBookletId },
        include: { didacticBooklet: { include: { chapters: { orderBy: { order_index: 'asc' } } } } },
      });
      booklet = book?.didacticBooklet;
    } else {
      booklet = await prisma.didacticBooklet.findUnique({
        where: { id: targetBookIdOrBookletId },
        include: { book: true, chapters: { orderBy: { order_index: 'asc' } } },
      });
      book = booklet?.book;
    }

    if (!book) {
      throw new AppError('Livro de destino não encontrado.', 404);
    }

    // 2. VALIDAÇÃO DA REGRA DE NEGÓCIO: Só podemos appendar livreto em livreto
    if (!book.is_ai_generated || book.format_type !== 'DIDACTIC' || !booklet) {
      throw new AppError(
        'CANNOT_APPEND_TO_NON_BOOKLET: Não é permitido anexar explicações a livros convencionais (EPUB/PDF). A anexação é permitida exclusivamente em livretos didáticos gerados por IA.',
        422
      );
    }

    // 3. Validação de permissão do usuário
    if (booklet.user_id !== userId) {
      throw new AppError('Você não tem permissão para alterar este livreto.', 403);
    }

    // 4. Determina o próximo número de capítulo sequencial
    const nextOrderIndex = (booklet.chapters?.length ?? 0) + 1;

    // 5. Coleta contexto do capítulo
    const context: DidacticPromptContext = {
      topic: input.topic,
      depthLevel: input.depth_level,
      bookletTitle: booklet.title,
      chapterIndex: nextOrderIndex,
    };

    if (input.theme_id) {
      const theme = await prisma.theme.findUnique({ where: { id: input.theme_id } });
      if (theme) context.themeName = theme.name;
    }

    if (input.flashcard_id) {
      const flashcard = await prisma.flashcard.findUnique({
        where: { id: input.flashcard_id },
        include: { book: true },
      });
      if (flashcard) {
        context.flashcardQuestion = flashcard.question;
        context.flashcardAnswer = flashcard.answer;
        context.bookTitle = flashcard.book?.title;
      }
    }

    if (input.annotation_id) {
      const annotation = await prisma.annotation.findUnique({
        where: { id: input.annotation_id },
        include: { book: true },
      });
      if (annotation) {
        context.annotationQuote = annotation.selected_text || undefined;
        context.annotationNote = annotation.note || undefined;
        context.bookTitle = annotation.book?.title;
      }
    }

    // 6. Gera explicação do novo capítulo
    const aiResult = await didacticAIService.generateExplanation(context);
    const chapterTitle = input.title || `Capítulo ${nextOrderIndex}: ${aiResult.title}`;

    // 7. Persiste o novo capítulo anexado
    const newChapter = await prisma.didacticBookletChapter.create({
      data: {
        booklet_id: booklet.id,
        order_index: nextOrderIndex,
        title: chapterTitle,
        topic: input.topic,
        raw_markdown: aiResult.markdown,
        flashcard_id: input.flashcard_id,
        annotation_id: input.annotation_id,
        theme_id: input.theme_id,
        diagram_count: aiResult.diagramCount,
      },
    });

    // Atualiza a data de modificação do livreto
    await prisma.didacticBooklet.update({
      where: { id: booklet.id },
      data: { updated_at: new Date() },
    });

    return {
      book,
      booklet: {
        ...booklet,
        chapters: [...booklet.chapters, newChapter],
      },
      newChapter,
    };
  }

  /**
   * Lista os livretos didáticos do usuário
   */
  async getBooklets(userId: number, themeId?: number) {
    const where: any = { user_id: userId };

    if (themeId) {
      where.book = {
        bookThemes: {
          some: { theme_id: themeId },
        },
      };
    }

    return prisma.didacticBooklet.findMany({
      where,
      include: {
        book: {
          include: {
            bookThemes: { include: { theme: true } },
          },
        },
        chapters: {
          select: {
            id: true,
            order_index: true,
            title: true,
            topic: true,
            diagram_count: true,
            created_at: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  /**
   * Retorna um livreto completo com todo o conteúdo e capítulos para o leitor
   */
  async getBookletById(userId: number, bookIdOrBookletId: number | string) {
    let booklet: any = null;

    if (typeof bookIdOrBookletId === 'number') {
      booklet = await prisma.didacticBooklet.findFirst({
        where: { book_id: bookIdOrBookletId, user_id: userId },
        include: {
          book: {
            include: {
              bookThemes: { include: { theme: true } },
              annotations: {
                where: { user_id: userId },
                orderBy: { created_at: 'asc' },
              },
            },
          },
          chapters: {
            orderBy: { order_index: 'asc' },
          },
        },
      });
    } else {
      booklet = await prisma.didacticBooklet.findFirst({
        where: { id: bookIdOrBookletId, user_id: userId },
        include: {
          book: {
            include: {
              bookThemes: { include: { theme: true } },
              annotations: {
                where: { user_id: userId },
                orderBy: { created_at: 'asc' },
              },
            },
          },
          chapters: {
            orderBy: { order_index: 'asc' },
          },
        },
      });
    }

    if (!booklet) {
      throw new AppError('Livreto didático não encontrado.', 404);
    }

    return booklet;
  }
}

export const didacticBookletService = new DidacticBookletService();
