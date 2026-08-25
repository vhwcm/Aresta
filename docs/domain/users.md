# Domínio: Usuários, Autenticação & Configurações (`User`)

## 1. Propósito
Gerencia a identidade, controle de acesso, perfis, configurações pessoais de leitura e permissões dentro do Aresta.

---

## 2. Entidades e Modelo de Dados

### Modelos Prisma (`prisma/schema.prisma`)
```prisma
model User {
  id                  Int               @id @default(autoincrement())
  name                String
  email               String            @unique
  password_hash       String?
  role                String            @default("USER") // USER | ADMIN
  is_active           Boolean           @default(true)
  created_at          DateTime          @default(now())
  updated_at          DateTime?         @updatedAt
  current_streak      Int               @default(0)
  longest_streak      Int               @default(0)
  streak_freeze_count Int               @default(0)
  target_streak_days  Int               @default(7)
  last_active_date    String?
  userBooks           UserBook[]
  themes              Theme[]
  themeConnections    ThemeConnection[]
  userSettings        UserSettings?
  annotations         Annotation[]
  dailyActivities     DailyActivity[]

  @@map("users")
}

model UserSettings {
  user_id                Int      @id
  page_animation_enabled Boolean  @default(true)
  language               String   @default("pt-BR")
  updated_at             DateTime @default(now()) @updatedAt
  user                   User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

---

## 3. Regras de Negócio

1. **Autenticação & Senhas**:
   - Senhas são criptografadas com `bcryptjs` (salt rounds padrão >= 10).
   - O login bem-sucedido gera um JWT com tempo de expiração configurado em `JWT_EXPIRES_IN`.
2. **Perfis de Acesso (`role`)**:
   - `USER`: Acesso à estante pessoal, anotações, mapas mentais e configurações próprias.
   - `ADMIN`: Acesso à gestão de usuários, catálogo global e configurações do sistema.
3. **Preferências do Usuário (`UserSettings`)**:
   - Controle de animações de transição de página (acessibilidade / preferência de performance).
   - Idioma da interface (padrão `pt-BR`).

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/auth.controller.ts`, `src/controllers/user.controller.ts`, `src/controllers/userSettings.controller.ts`
  - `src/services/auth.service.ts`, `src/services/user.service.ts`, `src/services/userSettings.service.ts`
  - `src/middlewares/auth.middleware.ts`
- **Frontend**:
  - `front/app/composables/useAuth.ts`, `front/app/composables/useUserSettings.ts`
