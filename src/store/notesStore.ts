import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useUserStore } from './userStore'

export type NoteTag = 'thought' | 'intention' | 'lesson' | 'gratitude'

export interface Note {
  id: string
  user_id: string
  content: string
  tag: NoteTag
  expires_at: string | null
  saved: boolean
  archived_at: string | null
  linked_session_id: string | null
  created_at: string
  updated_at: string
}

interface NotesState {
  notes: Note[]
  loading: boolean
  loaded: boolean
}

interface NotesActions {
  load: () => Promise<void>
  create: (input: {
    content: string
    tag?: NoteTag
    saved?: boolean
    expiresInDays?: number | null   // null = never (only meaningful when saved=false; else expires_at = null)
    linkedSessionId?: string | null
  }) => Promise<Note | null>
  update: (id: string, patch: Partial<Pick<Note, 'content' | 'tag' | 'expires_at' | 'saved'>>) => Promise<void>
  archive: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
  cleanupOnBoot: () => Promise<void>
}

function plusDaysISO(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export const useNotesStore = create<NotesState & NotesActions>((set, get) => ({
  notes: [],
  loading: false,
  loaded: false,

  load: async () => {
    const userId = useUserStore.getState().userId
    if (!userId) return
    set({ loading: true })
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (data) set({ notes: data as Note[], loaded: true })
    } catch (err) {
      console.error('[notes] load error', err)
    } finally {
      set({ loading: false })
    }
  },

  create: async ({ content, tag = 'thought', saved = false, expiresInDays = 7, linkedSessionId = null }) => {
    const userId = useUserStore.getState().userId
    if (!userId) return null
    const expires_at = saved || expiresInDays === null ? null : plusDaysISO(expiresInDays)
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: userId, content, tag, saved, expires_at, linked_session_id: linkedSessionId })
        .select('*')
        .single()
      if (error) {
        console.error('[notes] create error', error)
        return null
      }
      const row = data as Note
      set((s) => ({ notes: [row, ...s.notes] }))
      return row
    } catch (err) {
      console.error('[notes] create exception', err)
      return null
    }
  },

  update: async (id, patch) => {
    // optimistic local update
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } as Note : n)),
    }))
    try {
      await supabase.from('notes').update(patch).eq('id', id)
    } catch (err) {
      console.error('[notes] update error', err)
    }
  },

  archive: async (id) => {
    const ts = new Date().toISOString()
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, archived_at: ts } : n)),
    }))
    try { await supabase.from('notes').update({ archived_at: ts }).eq('id', id) }
    catch (err) { console.error('[notes] archive error', err) }
  },

  restore: async (id) => {
    const expires_at = plusDaysISO(7)
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, archived_at: null, expires_at } : n)),
    }))
    try { await supabase.from('notes').update({ archived_at: null, expires_at }).eq('id', id) }
    catch (err) { console.error('[notes] restore error', err) }
  },

  cleanupOnBoot: async () => {
    const userId = useUserStore.getState().userId
    if (!userId) return
    const nowIso = new Date().toISOString()
    const archiveCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    try {
      // Move expired non-saved notes to archive
      await supabase
        .from('notes')
        .update({ archived_at: nowIso })
        .lt('expires_at', nowIso)
        .is('archived_at', null)
        .eq('saved', false)
        .eq('user_id', userId)
      // Delete archive entries older than 30 days
      await supabase
        .from('notes')
        .delete()
        .lt('archived_at', archiveCutoff)
        .eq('user_id', userId)
    } catch (err) {
      console.error('[notes] cleanup error', err)
    }
    // Refresh local cache
    await get().load()
  },
}))

export function noteTagColor(tag: NoteTag): string {
  switch (tag) {
    case 'thought':    return 'var(--ink2)'
    case 'intention':  return 'var(--physical)'
    case 'lesson':     return 'var(--cognitive)'
    case 'gratitude':  return 'var(--emotional)'
  }
}

export function relativeDate(iso: string): string {
  const d = new Date(iso)
  const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000)
  const days = Math.floor(diffSec / (24 * 3600))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'last week'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function expiresInLabel(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(ms / (24 * 3600 * 1000))
  if (days <= 0) return 'expires today'
  if (days === 1) return 'expires tomorrow'
  return `expires in ${days} days`
}
