import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AuthProviderFactory, type SupportedAuthProvider } from '../providers/AuthProviderFactory'

export class OAuthService {
  getAuthUrl(provider: SupportedAuthProvider | string, state?: string, redirectUri?: string): string {
    const authProvider = AuthProviderFactory.getProvider(provider)
    return authProvider.getAuthUrl(state, redirectUri)
  }

  async handleCallback(
    provider: SupportedAuthProvider | string,
    code: string,
    redirectUri?: string
  ) {
    const authProvider = AuthProviderFactory.getProvider(provider)
    const { tokens, userProfile } = await authProvider.handleCallback(code, redirectUri)

    const cleanEmail = userProfile.email.toLowerCase().trim()

    // 1. Procura usuário já existente por email ou por conta vinculada
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { accounts: true },
    })

    if (!user) {
      // 2. Se não existir, cria o novo usuário com userSettings padrão
      user = await prisma.user.create({
        data: {
          name: userProfile.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          userSettings: { create: {} },
        },
        include: { accounts: true },
      })
    }

    // 3. Atualiza ou cria o registro da conta OAuth (Account)
    const expiresAt = tokens.expiresIn ? Math.floor(Date.now() / 1000) + tokens.expiresIn : undefined

    const existingAccount = user.accounts.find(
      (acc) => acc.provider === userProfile.provider && acc.provider_account_id === userProfile.providerAccountId
    )

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token: tokens.accessToken,
          ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        },
      })
    } else {
      await prisma.account.create({
        data: {
          user_id: user.id,
          provider: userProfile.provider,
          provider_account_id: userProfile.providerAccountId,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        },
      })
    }

    // 4. Emite JWT de sessão do Aresta
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'sua-chave-jwt-secreta-compartilhada',
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    )

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
      },
      oauth: {
        provider: userProfile.provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        scope: tokens.scope,
      },
    }
  }

  async refreshToken(userId: number, provider: SupportedAuthProvider | string) {
    const cleanProvider = provider.toLowerCase()
    const account = await prisma.account.findFirst({
      where: { user_id: userId, provider: cleanProvider },
    })

    if (!account) {
      throw new Error(`Nenhuma conta ${provider} vinculada para o usuário ID ${userId}`)
    }

    if (!account.refresh_token) {
      throw new Error(`Conta ${provider} não possui refresh token disponível`)
    }

    const authProvider = AuthProviderFactory.getProvider(cleanProvider)
    const newTokens = await authProvider.refreshAccessToken(account.refresh_token)

    const expiresAt = newTokens.expiresIn ? Math.floor(Date.now() / 1000) + newTokens.expiresIn : undefined

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: newTokens.accessToken,
        ...(newTokens.refreshToken ? { refresh_token: newTokens.refreshToken } : {}),
        expires_at: expiresAt,
      },
    })

    return {
      accessToken: newTokens.accessToken,
      expiresIn: newTokens.expiresIn,
    }
  }

  async getAccount(userId: number, provider: string) {
    return prisma.account.findFirst({
      where: { user_id: userId, provider: provider.toLowerCase() },
      select: {
        id: true,
        provider: true,
        provider_account_id: true,
        access_token: true,
        expires_at: true,
        scope: true,
        created_at: true,
        updated_at: true,
      },
    })
  }
}

export const oauthService = new OAuthService()
