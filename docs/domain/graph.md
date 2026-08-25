# Domínio: Grafo de Conhecimento & Mapa Mental (`Theme`)

## 1. Propósito
O Grafo de Conhecimento do Aresta permite ao leitor criar temas conceituais, interconectar ideias transversais entre múltiplos livros e visualizar essas relações como um mapa mental interativo com física de nós.

---

## 2. Entidades e Modelo de Dados

### Modelos Prisma (`prisma/schema.prisma`)
```prisma
model Theme {
  id                Int               @id @default(autoincrement())
  user_id           Int
  name              String
  color             String?           @default("#E57B55")
  description       String?
  created_at        DateTime          @default(now())
  user              User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  sourceConnections ThemeConnection[] @relation("SourceTheme")
  targetConnections ThemeConnection[] @relation("TargetTheme")
  bookThemes        BookTheme[]
  annotationThemes  AnnotationTheme[]

  @@map("themes")
}

model ThemeConnection {
  id              Int      @id @default(autoincrement())
  user_id         Int
  source_theme_id Int
  target_theme_id Int
  created_at      DateTime @default(now())
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  sourceTheme     Theme    @relation("SourceTheme", fields: [source_theme_id], references: [id], onDelete: Cascade)
  targetTheme     Theme    @relation("TargetTheme", fields: [target_theme_id], references: [id], onDelete: Cascade)

  @@unique([user_id, source_theme_id, target_theme_id])
  @@map("theme_connections")
}

model BookTheme {
  id           Int      @id @default(autoincrement())
  user_book_id Int
  theme_id     Int
  created_at   DateTime @default(now())
  userBook     UserBook @relation(fields: [user_book_id], references: [id], onDelete: Cascade)
  theme        Theme    @relation(fields: [theme_id], references: [id], onDelete: Cascade)

  @@unique([user_book_id, theme_id])
  @@map("book_themes")
}
```

---

## 3. Regras de Negócio e Visualização

1. **Grafo Direcionado & Ponderado**:
   - Conexões entre temas (`ThemeConnection`) representam pontes conceituais criadas pelo usuário.
   - O endpoint `GET /api/graph` agrega nós (Livros, Temas, Anotações) e links para consumo direto pelo D3.js.
2. **Cores e Identidade Visual**:
   - Cada tema possui uma cor hexadecimal customizável (padrão `#E57B55`), aplicada aos nós e arestas correspondentes.

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/graph.controller.ts`, `src/services/graph.service.ts`, `src/schemas/graph.schema.ts`
- **Frontend**:
  - `front/app/composables/useGraph.ts`, `front/app/components/GraphCanvas.vue`, `front/app/pages/graph.vue`
