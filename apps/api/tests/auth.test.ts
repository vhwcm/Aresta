import { describe, it, expect, vi } from 'vitest'
import { authService } from '../src/modules/auth/services/auth.service'
import { authController } from '../src/modules/auth/controllers/auth.controller'
import { prisma } from '../src/modules/auth/config/database'
import type { Request, Response } from 'express'

describe('AuthService & AuthController Account Deletion', () => {
  it('AuthService.deleteAccount exclui o usuário pelo ID no prisma', async () => {
    const deleteSpy = vi.spyOn(prisma.user, 'delete').mockResolvedValue({ id: 99 } as any)
    const result = await authService.deleteAccount(99)

    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 99 } })
    expect(result).toEqual({ success: true })
    deleteSpy.mockRestore()
  })

  it('AuthController.deleteMe remove usuário autenticado', async () => {
    const deleteSpy = vi.spyOn(authService, 'deleteAccount').mockResolvedValue({ success: true })
    const req = {
      user: { userId: 42, email: 'test@aresta.app', role: 'USER' }
    } as unknown as Request

    const jsonMock = vi.fn()
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock })
    const res = {
      status: statusMock,
      json: jsonMock
    } as unknown as Response

    await authController.deleteMe(req, res)

    expect(deleteSpy).toHaveBeenCalledWith(42)
    expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Account deleted successfully' })
    deleteSpy.mockRestore()
  })

  it('AuthController.deleteMe retorna 401 se não houver usuário autenticado', async () => {
    const req = {} as unknown as Request
    const jsonMock = vi.fn()
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock })
    const res = {
      status: statusMock,
      json: jsonMock
    } as unknown as Response

    await authController.deleteMe(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })
})
