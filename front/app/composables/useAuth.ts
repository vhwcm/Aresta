import { ref, computed } from 'vue'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

const API_BASE = 'http://localhost:7070/api'

const getCookieRef = <T>(name: string, opts?: any) => {
  if (typeof useCookie === 'function') {
    return useCookie<T>(name, opts)
  }
  return ref<T | null>(null)
}

export const useAuth = () => {
  const tokenCookie = getCookieRef<string | null>('aresta_token', { maxAge: 86400 })
  const userCookie = getCookieRef<AuthUser | null>('aresta_user', { maxAge: 86400 })

  const isLoggedIn = computed(() => !!tokenCookie.value)
  const user = computed(() => userCookie.value)
  const isAdmin = computed(() => userCookie.value?.role === 'ADMIN')

  const login = async (loginId: string, passwordStr: string) => {
    try {
      const response = await $fetch<LoginResponse>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: {
          login: loginId,
          password: passwordStr
        }
      })

      tokenCookie.value = response.token
      userCookie.value = response.user
      return { success: true, user: response.user }
    } catch (e: any) {
      console.error('Erro no login:', e)
      const errorMsg = e.data || e.statusMessage || 'Falha ao autenticar. Verifique o login e a senha.'
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Usuário ou senha inválidos.' }
    }
  }

  const logout = () => {
    tokenCookie.value = null
    userCookie.value = null
    if (typeof navigateTo === 'function') {
      navigateTo('/login')
    }
  }

  const fetchCurrentUser = async () => {
    if (!tokenCookie.value) return null
    try {
      const userData = await $fetch<AuthUser>(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenCookie.value}` }
      })
      userCookie.value = userData
      return userData
    } catch (e) {
      tokenCookie.value = null
      userCookie.value = null
      return null
    }
  }

  return {
    token: tokenCookie,
    user,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    fetchCurrentUser
  }
}
