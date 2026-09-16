import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotes } from '../../../app/composables/useNotes'
import { noteRepo } from '../../../app/adapters/database/repositories/NoteRepository'

import { ref } from 'vue'
import * as authComposable from '../../../app/composables/useAuth'

describe('useNotes composable (Local-First Architecture)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('fake-token'),
      user: ref({ id: 1, name: 'Test' }),
      isLoggedIn: ref(true),
    } as any)
    const { notesList } = useNotes()
    notesList.value = []
  })

  it('fetchNotes busca lista de notas do repositório local', async () => {
    await noteRepo.save({
      id: 'note-1',
      title: 'Nota 1',
      content: 'Conteúdo 1',
      tags: ['tag1'],
    })

    const { notesList, fetchNotes } = useNotes()
    const result = await fetchNotes()

    expect(result.notes.length).toBeGreaterThanOrEqual(1)
    expect(notesList.value.some((n) => n.title === 'Nota 1')).toBe(true)
  })

  it('createNote persiste localmente e adiciona nota ao topo da lista', async () => {
    const { createNote, notesList, currentNote } = useNotes()
    const created = await createNote({ title: 'Nota Criada', content: 'Markdown content' })

    expect(created.id).toBeDefined()
    expect(created.title).toBe('Nota Criada')
    expect(notesList.value[0]?.title).toBe('Nota Criada')
    expect(currentNote.value?.title).toBe('Nota Criada')

    // Confirma persistência no repositório
    const saved = await noteRepo.getById(created.id)
    expect(saved?.title).toBe('Nota Criada')
  })

  it('deleteNote remove a nota do banco local e atualiza a lista reativa', async () => {
    const { createNote, deleteNote, notesList } = useNotes()
    const note = await createNote({ title: 'Nota Para Deletar', content: '...' })
    expect(notesList.value.some((n) => n.id === note.id)).toBe(true)

    await deleteNote(note.id)

    expect(notesList.value.some((n) => n.id === note.id)).toBe(false)
    const deleted = await noteRepo.getById(note.id)
    expect(deleted).toBeNull()
  })
})
