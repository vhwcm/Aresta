import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  // 1. Configurações da Aplicação
  await prisma.appConfig.upsert({
    where: { key: 'version' },
    update: { value: '1.0.0' },
    create: { key: 'version', value: '1.0.0' },
  });

  // 2. Criação / Atualização do Administrador e Usuários padrão
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
      id: 1,
      name: 'viktor',
      email: 'viktor@aresta.org',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      is_active: true,
    },
  });

  // Usuário padrão de testes (id=100)
  await prisma.user.upsert({
    where: { email: 'usuario@aresta.org' },
    update: {
      name: 'Usuário Teste',
      role: 'USER',
      is_active: true,
    },
    create: {
      id: 100,
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

  // 4. Livros Padrão
  const booksData = [
    { id: 1, title: 'Contos Fluminenses', file_path: 'storage/books/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.pdf', cover_path: 'storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png' },
    { id: 2, title: 'Curso de Pré-Cálculo', file_path: 'storage/books/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.pdf', cover_path: 'storage/covers/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.png' },
    { id: 3, title: 'A Cartomante', file_path: 'storage/books/a-cartomante.pdf', cover_path: 'storage/covers/a-cartomante.png' },
    { id: 4, title: 'Como Tocar Piano', file_path: 'storage/books/Como-tocar-piano.pdf', cover_path: 'storage/covers/Como-tocar-piano.png' },
    { id: 5, title: 'Curso de Desenho - Carlos Damasceno', file_path: 'storage/books/curso-de-desenho-carlos-damasceno.pdf', cover_path: 'storage/covers/curso-de-desenho-carlos-damasceno.png' },
    { id: 6, title: 'Aprenda a Desenhar do Zero', file_path: 'storage/books/ebook_aprendaadesenhardozero.pdf', cover_path: 'storage/covers/ebook_aprendaadesenhardozero.png' },
    { id: 7, title: 'Inglês Aplicado a Eventos', file_path: 'storage/books/ingles-aplicado-a-eventos.pdf', cover_path: 'storage/covers/ingles-aplicado-a-eventos.png' },
    { id: 8, title: 'Informática Avançada', file_path: 'storage/books/livro_informatica_avancada_compressed.pdf', cover_path: 'storage/covers/livro_informatica_avancada_compressed.png' },
    { id: 9, title: 'Microeconomia', file_path: 'storage/books/microeconomia-compress.pdf', cover_path: 'storage/covers/microeconomia-compress.png' },
    { id: 10, title: 'O Alienista', file_path: 'storage/books/O-Alienista.pdf', cover_path: 'storage/covers/O-Alienista.png' },
  ];

  for (const b of booksData) {
    await prisma.book.upsert({
      where: { id: b.id },
      update: { title: b.title, file_path: b.file_path, cover_path: b.cover_path },
      create: b,
    });
  }

  // 5. UserBooks (Livros na estante do admin)
  const userBooks = [
    { id: 1, user_id: 1, book_id: 1, status: 'LIDO', current_page: 180 },
    { id: 2, user_id: 1, book_id: 2, status: 'LENDO', current_page: 45 },
    { id: 3, user_id: 1, book_id: 3, status: 'LIDO', current_page: 32 },
    { id: 4, user_id: 1, book_id: 4, status: 'QUERO_LER', current_page: 0 },
    { id: 5, user_id: 1, book_id: 5, status: 'LENDO', current_page: 90 },
    { id: 6, user_id: 1, book_id: 6, status: 'QUERO_LER', current_page: 0 },
    { id: 7, user_id: 1, book_id: 7, status: 'LIDO', current_page: 120 },
    { id: 8, user_id: 1, book_id: 8, status: 'LENDO', current_page: 210 },
    { id: 9, user_id: 1, book_id: 9, status: 'QUERO_LER', current_page: 0 },
    { id: 10, user_id: 1, book_id: 10, status: 'LIDO', current_page: 85 },
  ];

  for (const ub of userBooks) {
    await prisma.userBook.upsert({
      where: { user_id_book_id: { user_id: ub.user_id, book_id: ub.book_id } },
      update: { status: ub.status, current_page: ub.current_page },
      create: ub,
    });
  }

  // 6. Temas (Nós do Grafo)
  const themes = [
    { id: 1, user_id: 1, name: 'Literatura Brasileira', color: '#E57B55', description: 'Obras clássicas da literatura e prosa nacional' },
    { id: 2, user_id: 1, name: 'Machado de Assis', color: '#F59E0B', description: 'Foco na obra e realismo machadiano' },
    { id: 3, user_id: 1, name: 'Exatas & Matemática', color: '#3B82F6', description: 'Cálculo, lógica e exatas' },
    { id: 4, user_id: 1, name: 'Artes & Criatividade', color: '#EC4899', description: 'Técnicas de desenho e expressão visual' },
    { id: 5, user_id: 1, name: 'Música & Teoria', color: '#8B5CF6', description: 'Prática instrumental e piano' },
    { id: 6, user_id: 1, name: 'Línguas & Idiomas', color: '#10B981', description: 'Comunicação e inglês aplicado' },
    { id: 7, user_id: 1, name: 'Tecnologia & Computação', color: '#06B6D4', description: 'Informática e desenvolvimento' },
    { id: 8, user_id: 1, name: 'Ciências Sociais & Economia', color: '#6366F1', description: 'Princípios de micro e macroeconomia' },
  ];

  for (const t of themes) {
    await prisma.theme.upsert({
      where: { id: t.id },
      update: { name: t.name, color: t.color, description: t.description },
      create: t,
    });
  }

  // 7. Conexões de Temas (Arestas do Grafo)
  const connections = [
    { user_id: 1, source_theme_id: 1, target_theme_id: 2 },
    { user_id: 1, source_theme_id: 3, target_theme_id: 7 },
    { user_id: 1, source_theme_id: 4, target_theme_id: 5 },
    { user_id: 1, source_theme_id: 7, target_theme_id: 8 },
    { user_id: 1, source_theme_id: 6, target_theme_id: 8 },
  ];

  for (const c of connections) {
    await prisma.themeConnection.upsert({
      where: {
        user_id_source_theme_id_target_theme_id: {
          user_id: c.user_id,
          source_theme_id: c.source_theme_id,
          target_theme_id: c.target_theme_id,
        },
      },
      update: {},
      create: c,
    });
  }

  // 8. Associação Livro <-> Tema (BookTheme)
  const bookThemes = [
    { user_book_id: 1, theme_id: 1 },
    { user_book_id: 1, theme_id: 2 },
    { user_book_id: 2, theme_id: 3 },
    { user_book_id: 3, theme_id: 1 },
    { user_book_id: 3, theme_id: 2 },
    { user_book_id: 4, theme_id: 5 },
    { user_book_id: 5, theme_id: 4 },
    { user_book_id: 6, theme_id: 4 },
    { user_book_id: 7, theme_id: 6 },
    { user_book_id: 8, theme_id: 7 },
    { user_book_id: 9, theme_id: 8 },
    { user_book_id: 10, theme_id: 1 },
    { user_book_id: 10, theme_id: 2 },
  ];

  for (const bt of bookThemes) {
    await prisma.bookTheme.upsert({
      where: {
        user_book_id_theme_id: {
          user_book_id: bt.user_book_id,
          theme_id: bt.theme_id,
        },
      },
      update: {},
      create: bt,
    });
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

