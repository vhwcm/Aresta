import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const STORE_BOOKS_DATA = [
  {
    id: 1,
    title: 'Contos Fluminenses',
    author: 'Machado de Assis',
    summary: 'Coletânea de contos que retratam a sociedade carioca do século XIX com ironia e perspicácia psicológica.',
    file_path: 'storage/epubs/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.epub',
    cover_path: 'storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png',
    status: 'LIDO',
    current_page: 180,
  },
  {
    id: 2,
    title: 'Curso de Pré-Cálculo',
    author: 'Equipe Acadêmica',
    summary: 'Fundamentos de funções, trigonometria e álgebra para estudantes universitários.',
    file_path: 'storage/epubs/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.epub',
    cover_path: 'storage/covers/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.png',
    status: 'LENDO',
    current_page: 45,
  },
  {
    id: 3,
    title: 'A Cartomante',
    author: 'Machado de Assis',
    summary: 'Um dos contos mais famosos sobre traição, destino e ironia trágica.',
    file_path: 'storage/epubs/a-cartomante.epub',
    cover_path: 'storage/covers/a-cartomante.png',
    status: 'LIDO',
    current_page: 32,
  },
  {
    id: 4,
    title: 'Como Tocar Piano',
    author: 'Mestre da Música',
    summary: 'Guia prático para iniciantes em teclado e teoria musical aplicada.',
    file_path: 'storage/epubs/Como-tocar-piano.epub',
    cover_path: 'storage/covers/Como-tocar-piano.png',
    status: 'QUERO_LER',
    current_page: 0,
  },
  {
    id: 5,
    title: 'Curso de Desenho',
    author: 'Carlos Damasceno',
    summary: 'Técnicas de sombreamento, proporção e esboço para ilustradores.',
    file_path: 'storage/epubs/curso-de-desenho-carlos-damasceno.epub',
    cover_path: 'storage/covers/curso-de-desenho-carlos-damasceno.png',
    status: 'LENDO',
    current_page: 90,
  },
  {
    id: 6,
    title: 'Aprenda a Desenhar do Zero',
    author: 'Ilustra Brasil',
    summary: 'Manual passo a passo para desenvolver a expressão visual e desenho livre.',
    file_path: 'storage/epubs/ebook_aprendaadesenhardozero.epub',
    cover_path: 'storage/covers/ebook_aprendaadesenhardozero.png',
    status: 'QUERO_LER',
    current_page: 0,
  },
  {
    id: 7,
    title: 'Inglês Aplicado a Eventos',
    author: 'Línguas Global',
    summary: 'Vocabulário e expressões situacionais para turismo e organização de eventos.',
    file_path: 'storage/epubs/ingles-aplicado-a-eventos.epub',
    cover_path: 'storage/covers/ingles-aplicado-a-eventos.png',
    status: 'LIDO',
    current_page: 120,
  },
  {
    id: 8,
    title: 'Informática Avançada',
    author: 'Tech Academy',
    summary: 'Conceitos avançados de sistemas operacionais, redes e arquitetura computacional.',
    file_path: 'storage/epubs/livro_informatica_avancada_compressed.epub',
    cover_path: 'storage/covers/livro_informatica_avancada_compressed.png',
    status: 'LENDO',
    current_page: 210,
  },
  {
    id: 9,
    title: 'Microeconomia',
    author: 'Economia Moderna',
    summary: 'Análise de mercados, comportamento do consumidor e estruturas de custo.',
    file_path: 'storage/epubs/microeconomia-compress.epub',
    cover_path: 'storage/covers/microeconomia-compress.png',
    status: 'QUERO_LER',
    current_page: 0,
  },
  {
    id: 10,
    title: 'O Alienista',
    author: 'Machado de Assis',
    summary: 'Sátira brilhante sobre a loucura, poder e a ciência na figura de Simão Bacamarte.',
    file_path: 'storage/epubs/O-Alienista.epub',
    cover_path: 'storage/covers/O-Alienista.png',
    status: 'LENDO',
    current_page: 33,
  },
];

export const THEMES_DATA = [
  { id: 1, name: 'Literatura Brasileira', color: '#E57B55', description: 'Obras clássicas da literatura e prosa nacional' },
  { id: 2, name: 'Machado de Assis', color: '#F59E0B', description: 'Foco na obra e realismo machadiano' },
  { id: 3, name: 'Exatas & Matemática', color: '#3B82F6', description: 'Cálculo, lógica e exatas' },
  { id: 4, name: 'Artes & Criatividade', color: '#EC4899', description: 'Técnicas de desenho e expressão visual' },
  { id: 5, name: 'Música & Teoria', color: '#8B5CF6', description: 'Prática instrumental e piano' },
  { id: 6, name: 'Línguas & Idiomas', color: '#10B981', description: 'Comunicação e inglês aplicado' },
  { id: 7, name: 'Tecnologia & Programação', color: '#06B6D4', description: 'Ciência da computação, programação e ferramentas' },
  { id: 8, name: 'Ciências Sociais & Economia', color: '#6366F1', description: 'Princípios de micro e macroeconomia' },
  { id: 9, name: 'Mentalidade & Ferramentas', color: '#14B8A6', description: 'Boas práticas e mentalidade de desenvolvimento' },
];

export const HIERARCHIES_DATA = [
  { parent_theme_id: 1, child_theme_id: 2 }, // Literatura Brasileira -> Machado de Assis
  { parent_theme_id: 7, child_theme_id: 9 }, // Tecnologia & Programação -> Mentalidade & Ferramentas
  { parent_theme_id: 4, child_theme_id: 5 }, // Artes & Criatividade -> Música & Teoria
];

export const BOOK_THEMES_DATA = [
  { book_id: 1, theme_id: 1 },
  { book_id: 1, theme_id: 2 },
  { book_id: 2, theme_id: 3 },
  { book_id: 3, theme_id: 1 },
  { book_id: 3, theme_id: 2 },
  { book_id: 4, theme_id: 5 },
  { book_id: 5, theme_id: 4 },
  { book_id: 6, theme_id: 4 },
  { book_id: 7, theme_id: 6 },
  { book_id: 8, theme_id: 7 },
  { book_id: 8, theme_id: 9 },
  { book_id: 9, theme_id: 8 },
  { book_id: 10, theme_id: 1 },
  { book_id: 10, theme_id: 2 },
];

export async function seedDatabase(prisma: PrismaClient) {
  console.log('🌱 [SeedService] Sincronizando banco de dados, acervo e usuário admin...');

  // 1. Configurações da Aplicação
  await prisma.appConfig.upsert({
    where: { key: 'version' },
    update: { value: '1.0.0' },
    create: { key: 'version', value: '1.0.0' },
  });

  // 2. Usuário Administrador (viktor)
  const adminPasswordHash = await bcrypt.hash('orlaweb123123#', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'viktor@aresta.org' },
    update: {
      name: 'viktor',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      is_active: true,
    },
    create: {
      name: 'viktor',
      email: 'viktor@aresta.org',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      is_active: true,
    },
  });

  // Usuário Teste (padrão)
  await prisma.user.upsert({
    where: { email: 'usuario@aresta.org' },
    update: {
      name: 'Usuário Teste',
      role: 'USER',
      is_active: true,
    },
    create: {
      name: 'Usuário Teste',
      email: 'usuario@aresta.org',
      password_hash: await bcrypt.hash('teste123', 10),
      role: 'USER',
      is_active: true,
    },
  });

  // 3. UserSettings para o Admin
  await prisma.userSettings.upsert({
    where: { user_id: adminUser.id },
    update: { page_animation_enabled: true, language: 'pt-BR' },
    create: { user_id: adminUser.id, page_animation_enabled: true, language: 'pt-BR' },
  });

  // 4. Limpeza de livros residuais de testes com capa nula ou IDs fora da lista oficial
  const validBookIds = STORE_BOOKS_DATA.map((b) => b.id);
  await prisma.book.deleteMany({
    where: {
      OR: [
        { id: { notIn: validBookIds } },
        { cover_path: null },
      ],
    },
  });

  // 5. Livros Oficiais do Acervo (storage/epubs e storage/covers)
  for (const b of STORE_BOOKS_DATA) {
    await prisma.book.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        file_path: b.file_path,
        cover_path: b.cover_path,
      },
      create: {
        id: b.id,
        title: b.title,
        file_path: b.file_path,
        cover_path: b.cover_path,
      },
    });

    await prisma.bookPublicInfo.upsert({
      where: { book_id: b.id },
      update: {
        author: b.author,
        summary: b.summary,
      },
      create: {
        book_id: b.id,
        author: b.author,
        summary: b.summary,
      },
    });
  }

  // 6. UserBooks (Vincular todos os livros do acervo ao usuário viktor - ADMIN)
  const now = new Date();
  for (const b of STORE_BOOKS_DATA) {
    await prisma.userBook.upsert({
      where: {
        user_id_book_id: {
          user_id: adminUser.id,
          book_id: b.id,
        },
      },
      update: {
        status: b.status,
        current_page: b.current_page,
        last_accessed_at: b.id === 10 ? now : undefined,
      },
      create: {
        user_id: adminUser.id,
        book_id: b.id,
        status: b.status,
        current_page: b.current_page,
        last_accessed_at: b.id === 10 ? now : undefined,
      },
    });
  }

  // 7. Temas Globais (Nós do Grafo)
  for (const t of THEMES_DATA) {
    await prisma.theme.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        color: t.color,
        description: t.description,
      },
      create: {
        id: t.id,
        name: t.name,
        color: t.color,
        description: t.description,
      },
    });
  }

  // 8. Hierarquias de Temas
  for (const h of HIERARCHIES_DATA) {
    await prisma.themeHierarchy.upsert({
      where: {
        parent_theme_id_child_theme_id: {
          parent_theme_id: h.parent_theme_id,
          child_theme_id: h.child_theme_id,
        },
      },
      update: {},
      create: {
        parent_theme_id: h.parent_theme_id,
        child_theme_id: h.child_theme_id,
      },
    });
  }

  // 9. Vínculo Livro <-> Tema (BookTheme)
  for (const bt of BOOK_THEMES_DATA) {
    await prisma.bookTheme.upsert({
      where: {
        book_id_theme_id: {
          book_id: bt.book_id,
          theme_id: bt.theme_id,
        },
      },
      update: {},
      create: {
        book_id: bt.book_id,
        theme_id: bt.theme_id,
      },
    });
  }

  // 10. Sincronizar sequences do PostgreSQL para evitar erro de PK duplicada em inserções autoincrementais
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('themes', 'id'), COALESCE((SELECT MAX(id) FROM themes), 1));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('books', 'id'), COALESCE((SELECT MAX(id) FROM books), 1));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('annotations', 'id'), COALESCE((SELECT MAX(id) FROM annotations), 1));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('flashcards', 'id'), COALESCE((SELECT MAX(id) FROM flashcards), 1));`);
  } catch {
    // Ignora se não for PostgreSQL ou driver sem suporte a setval
  }

  console.log(`✅ [SeedService] Acervo sincronizado com sucesso: ${STORE_BOOKS_DATA.length} livros vinculados ao admin viktor (id=${adminUser.id})!`);
}

