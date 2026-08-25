# Design Técnico: Preferências e Configurações na Página de Conta

## 1. Visão Geral da Arquitetura

O sistema de preferências é desenhado para oferecer baixa latência na resposta de interface (atualização síncrona de estado reativo Vue e `localStorage`) com consistência garantida no backend através de chamadas assíncronas ao endpoint `/api/user-settings`.

---

## 2. Contrato de Dados & Modelo do Banco

### 2.1 Prisma Schema (`schema.prisma`)
```prisma
model UserSettings {
  user_id                   Int      @id
  page_animation_enabled    Boolean  @default(true)
  language                  String   @default("pt-BR")
  epub_font_size            Int      @default(18)
  epub_font_family          String   @default("newsreader")
  theme_mode                String   @default("dark")
  desktop_home_graph_open   Boolean  @default(true)
  desktop_reader_graph_open Boolean  @default(true)
  updated_at                DateTime @default(now()) @updatedAt
  user                      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### 2.2 Schema Zod Backend (`userSettings.schema.ts`)
```typescript
export const updateUserSettingsSchema = z.object({
  pageAnimationEnabled: z.boolean().default(true).optional(),
  language: z.string().default('pt-BR').optional(),
  epubFontSize: z.number().int().min(10).max(48).default(18).optional(),
  epubFontFamily: z.enum(['newsreader', 'literata', 'lora', 'merriweather', 'inter']).default('newsreader').optional(),
  themeMode: z.enum(['dark', 'light']).default('dark').optional(),
  desktopHomeGraphOpen: z.boolean().default(true).optional(),
  desktopReaderGraphOpen: z.boolean().default(true).optional(),
});
```

---

## 3. Frontend: Componentes e Composables

### 3.1 Composable `useSettings`
Gerencia o estado reativo compartilhado:
- `desktopHomeGraphOpen: Ref<boolean>`
- `desktopReaderGraphOpen: Ref<boolean>`
- `themeMode: Ref<'dark' | 'light'>`
- `epubFontSize: Ref<number>`
- `epubFontFamily: Ref<string>`
- `pageAnimationEnabled: Ref<boolean>`
- `language: Ref<string>`
- Funções de mutação: `setDesktopHomeGraphOpen`, `setDesktopReaderGraphOpen`, `setThemeMode`, `setEpubFontSize`, `setEpubFontFamily`.
- Aplicação imediata de tema: `document.documentElement.setAttribute('data-theme', mode)` e atualização da classe `.light-theme`.

### 3.2 Design da Interface em `/conta`
A seção **"Preferências & Configurações da Aplicação"** conterá:
1. **Grafo na Tela Inicial**: Toggle switch com ícone `NetworkIcon` e subtítulo explicativo.
2. **Aparência do Sistema**: Botões estilizados Dark / Light com ícones `MoonIcon` e `SunIcon`.
3. **Grafo no Leitor Desktop**: Toggle switch com ícone `BookOpenIcon` e subtítulo explicativo.
4. **Tamanho Padrão do Texto (EPUB)**: Controles `A-` / `A+` com badge numérico em `px`.
5. **Fonte Padrão (EPUB)**: Grid com cartões selecionáveis das 5 fontes do Aresta exibindo seu próprio estilo tipográfico e badge de categoria.
