import { create } from 'zustand'
import client from '../api/client'

export interface Company {
  id: number
  name: string
  location: string
}

export interface Job {
  id: number
  title: string
  company?: Company | null
  company_id?: number | null
  location: string
  job_type: string
  domain: string
  description?: string | null
  link: string
  email?: string | null
  phone?: string | null
  source: string
  status: string
  score: number
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string
  created_at: string
  updated_at: string
}

export interface Agent {
  id: number
  name: string
  source: string
  task: string
  status: string
  last_run?: string | null
  last_error?: string | null
  jobs_found_total: number
  jobs_found_last_run: number
  run_count: number
  enabled: number
  created_at: string
  updated_at: string
  api_key?: string | null
  keywords?: string[] | null
  location?: string | null
  domain?: string | null
  current_page?: number
}

export interface AgentConfigPayload {
  keywords: string[] | null
  location: string | null
  domain: string | null
  api_key: string | null
  current_page: number
}

export interface DashboardStats {
  summary: {
    total_jobs: number
    today_jobs: number
    week_jobs: number
    active_agents: number
    avg_score: number
  }
  by_status: {
    en_cours: number
    envoye: number
    entretien: number
    refus: number
  }
  by_source: Record<string, number>
  top_domains: Record<string, number>
  top_locations: Record<string, number>
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export interface AgentConfig {
  telegram_bot_token?: string
  telegram_chat_id?: string
  serpapi_key?: string
  linkedin_email?: string
  default_location?: string
  default_keywords?: string
}

export interface CVDoc {
  id: number
  filename: string
  file_type: string
  file_size: number
  uploaded_at: string
  has_text: boolean
}

export interface Application {
  id: number
  job_id: number
  job_title: string
  company_name: string
  location: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  has_cv: boolean
  has_motivation: boolean
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface SchedulerStatus {
  running: boolean
  enabled: boolean
  interval_minutes: number
  next_run_at: string | null
  last_run_started: string | null
  last_run_finished: string | null
  last_result: { status?: string; total_stored?: number } | null
  run_count: number
  skipped_count: number
  currently_running: boolean
}

interface JobStore {
  // Jobs
  jobs: Job[]
  totalJobs: number
  currentPage: number
  pageSize: number
  loading: boolean
  selectedJob: Job | null
  filters: {
    city?: string
    job_type?: string
    domain?: string
    status?: string
    source?: string
    days?: number
  }

  // Agents
  agents: Agent[]
  agentsLoading: boolean

  // Dashboard
  stats: DashboardStats | null
  statsLoading: boolean

  // Toasts
  toasts: Toast[]

  // Settings
  settings: AgentConfig

  // CV + Applications
  cv: CVDoc | null
  applications: Application[]
  applicationsLoading: boolean

  // Scheduler
  scheduler: SchedulerStatus | null

  // Actions - Jobs
  fetchJobs: (page?: number) => Promise<void>
  updateJob: (id: number, status: string) => Promise<void>
  setFilters: (filters: JobStore['filters']) => void
  selectJob: (job: Job | null) => void

  // Actions - Agents
  fetchAgents: () => Promise<void>
  toggleAgent: (agentId: number, enabled: boolean) => Promise<void>
  stopAgent: (agentId: number) => Promise<void>
  updateAgentTask: (agentId: number, task: string) => Promise<void>
  triggerAgent: (agentId: number) => Promise<void>
  runAllAgents: () => Promise<void>
  stopAllAgents: () => Promise<void>
  updateAgentConfig: (agentId: number, payload: AgentConfigPayload) => Promise<void>
  applyConfigToAll: (sourceAgentId: number, payload: AgentConfigPayload) => Promise<void>

  // Actions - Stats
  fetchStats: () => Promise<void>

  // Actions - Toasts
  pushToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: number) => void

  // Actions - Settings
  loadSettings: () => void
  saveSettings: (s: AgentConfig) => void

  // Actions - CV / Applications
  fetchCV: () => Promise<void>
  uploadCV: (file: File) => Promise<void>
  deleteCV: () => Promise<void>
  fetchApplications: () => Promise<void>
  generateApplication: (jobId: number) => Promise<void>
  deleteApplication: (id: number) => Promise<void>
  downloadAppFile: (id: number, kind: 'cv' | 'motivation') => Promise<void>

  // Actions - Scheduler
  fetchScheduler: () => Promise<void>
  triggerScheduler: () => Promise<void>
  pauseScheduler: () => Promise<void>
  resumeScheduler: () => Promise<void>

  // Actions - Chef chat
  sendChefCommand: (text: string) => Promise<{ reply: string; applied_to: number[]; parsed: any } | null>
}

const EMPTY_STATS: DashboardStats = {
  summary: { total_jobs: 0, today_jobs: 0, week_jobs: 0, active_agents: 0, avg_score: 0 },
  by_status: { en_cours: 0, envoye: 0, entretien: 0, refus: 0 },
  by_source: {},
  top_domains: {},
  top_locations: {}
}

let toastCounter = 0

export const useJobStore = create<JobStore>((set, get) => ({
  // Initial state
  jobs: [],
  totalJobs: 0,
  currentPage: 1,
  pageSize: 12,
  loading: false,
  selectedJob: null,
  filters: { days: 30 },
  agents: [],
  agentsLoading: false,
  stats: EMPTY_STATS,
  statsLoading: false,
  toasts: [],
  settings: {},
  cv: null,
  applications: [],
  applicationsLoading: false,
  scheduler: null,

  // === JOBS ===
  fetchJobs: async (page = 1) => {
    set({ loading: true })
    try {
      const { filters, pageSize } = get()
      const params: any = { page, page_size: pageSize }
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params[k] = v
      })

      const { data } = await client.get('/jobs', { params })
      set({
        jobs: data.jobs || [],
        totalJobs: data.total || 0,
        currentPage: data.page || page,
        loading: false,
      })
    } catch (err) {
      console.error('fetchJobs failed', err)
      set({ jobs: [], totalJobs: 0, loading: false })
      get().pushToast('Fehler beim Laden der Jobs', 'error')
    }
  },

  updateJob: async (id, status) => {
    // Optimistic update
    set(state => ({
      jobs: state.jobs.map(j => j.id === id ? { ...j, status } : j),
      selectedJob: state.selectedJob?.id === id
        ? { ...state.selectedJob, status }
        : state.selectedJob
    }))
    try {
      await client.patch(`/jobs/${id}`, { status })
      get().pushToast('Status aktualisiert', 'success')
    } catch (err) {
      console.error('updateJob failed', err)
      get().pushToast('Fehler beim Aktualisieren', 'error')
      get().fetchJobs(get().currentPage)
    }
  },

  setFilters: (filters) => {
    set({ filters, currentPage: 1 })
  },

  selectJob: (job) => set({ selectedJob: job }),

  // === AGENTS ===
  fetchAgents: async () => {
    set({ agentsLoading: true })
    try {
      const { data } = await client.get('/agents')
      set({ agents: data.agents || [], agentsLoading: false })
    } catch (err) {
      console.error('fetchAgents failed', err)
      set({ agentsLoading: false })
    }
  },

  triggerAgent: async (agentId) => {
    // Optimistic
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, status: 'running' } : a)
    }))
    try {
      const { data } = await client.post(`/agents/${agentId}/run`)
      get().pushToast(`${data.agent_name || 'Agent'} gestartet`, 'success')
      // Refresh after a short delay so backend has time to update
      setTimeout(() => {
        get().fetchAgents()
        get().fetchStats()
        get().fetchJobs(1)
      }, 1500)
    } catch (err) {
      console.error('triggerAgent failed', err)
      get().pushToast('Fehler beim Starten des Agenten', 'error')
      get().fetchAgents()
    }
  },

  runAllAgents: async () => {
    // Optimistic: mark all enabled non-chef agents as running immediately
    set(state => ({
      agents: state.agents.map(a =>
        a.enabled ? { ...a, status: 'running' } : a
      )
    }))
    try {
      await client.post('/agents/run-all')
      get().pushToast('Alle Agenten gestartet', 'success')
      // Quick refresh after a short delay
      setTimeout(() => {
        get().fetchAgents()
        get().fetchStats()
        get().fetchJobs(1)
      }, 2500)
      // Second refresh to catch completion
      setTimeout(() => {
        get().fetchAgents()
        get().fetchStats()
        get().fetchJobs(1)
      }, 8000)
    } catch (err) {
      console.error('runAllAgents failed', err)
      get().pushToast('Fehler beim Starten aller Agenten', 'error')
      get().fetchAgents()
    }
  },

  stopAllAgents: async () => {
    const runningIds = get().agents
      .filter(a => a.status === 'running')
      .map(a => a.id)
    // Optimistic: mark everyone as idle
    set(state => ({
      agents: state.agents.map(a => ({ ...a, status: 'idle' }))
    }))
    try {
      await Promise.all(
        runningIds.map(id => client.post(`/agents/${id}/stop`).catch(() => null))
      )
      get().pushToast('Alle Agenten gestoppt', 'info')
      get().fetchAgents()
    } catch (err) {
      console.error('stopAllAgents failed', err)
      get().fetchAgents()
    }
  },

  toggleAgent: async (agentId, enabled) => {
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, enabled: enabled ? 1 : 0 } : a)
    }))
    try {
      const action = enabled ? 'enable' : 'disable'
      await client.post(`/agents/${agentId}/${action}`)
      get().pushToast(enabled ? 'Agent eingeschaltet' : 'Agent ausgeschaltet', 'success')
    } catch (err) {
      console.error('toggleAgent failed', err)
      get().fetchAgents()
    }
  },

  stopAgent: async (agentId) => {
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, status: 'idle' } : a)
    }))
    try {
      await client.post(`/agents/${agentId}/stop`)
      get().pushToast('Agent gestoppt', 'info')
    } catch (err) {
      console.error('stopAgent failed', err)
      get().fetchAgents()
    }
  },

  updateAgentTask: async (agentId, task) => {
    try {
      await client.patch(`/agents/${agentId}`, { task })
      get().pushToast('Aufgabe aktualisiert', 'success')
      get().fetchAgents()
    } catch (err) {
      console.error('updateAgentTask failed', err)
      get().pushToast('Fehler beim Speichern', 'error')
    }
  },

  updateAgentConfig: async (agentId, payload) => {
    try {
      const { data } = await client.patch(`/agents/${agentId}`, payload)
      // Update local state with the fresh agent returned from server
      set(state => ({
        agents: state.agents.map(a => a.id === agentId ? { ...a, ...data } : a),
      }))
    } catch (err: any) {
      console.error('updateAgentConfig failed', err)
      const msg = err?.response?.data?.detail || 'Fehler beim Aktualisieren'
      get().pushToast(msg, 'error')
      throw err
    }
  },

  applyConfigToAll: async (_sourceAgentId, payload) => {
    // Apply to every hunter (skip chef + cv_generator + the source agent itself if desired).
    // Include the source agent too — user expects "save and apply to all" to be consistent.
    const targets = get().agents.filter(a => {
      const src = a.source?.toLowerCase()
      return src !== 'chef' && src !== 'cv_generator'
    })
    try {
      // Sequential to keep DB writes ordered + avoid spamming
      for (const a of targets) {
        const { data } = await client.patch(`/agents/${a.id}`, payload)
        set(state => ({
          agents: state.agents.map(x => x.id === a.id ? { ...x, ...data } : x),
        }))
      }
    } catch (err: any) {
      console.error('applyConfigToAll failed', err)
      get().pushToast(err?.response?.data?.detail || 'Fehler beim Massen-Update', 'error')
      throw err
    }
  },

  // === STATS ===
  fetchStats: async () => {
    set({ statsLoading: true })
    try {
      const { data } = await client.get('/dashboard/stats')
      set({ stats: data, statsLoading: false })
    } catch (err) {
      console.error('fetchStats failed', err)
      set({ stats: EMPTY_STATS, statsLoading: false })
    }
  },

  // === TOASTS ===
  pushToast: (message, type = 'info') => {
    const id = ++toastCounter
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },

  // === SETTINGS ===
  loadSettings: () => {
    try {
      const raw = localStorage.getItem('jobagents_settings')
      if (raw) set({ settings: JSON.parse(raw) })
    } catch {
      /* ignore */
    }
  },

  saveSettings: (s) => {
    localStorage.setItem('jobagents_settings', JSON.stringify(s))
    set({ settings: s })
  },

  // === CV / APPLICATIONS ===
  fetchCV: async () => {
    try {
      const { data } = await client.get('/applications/cv')
      set({ cv: data.cv || null })
    } catch (err) {
      console.error('fetchCV failed', err)
      set({ cv: null })
    }
  },

  uploadCV: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await client.post('/applications/cv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set({ cv: data })
      get().pushToast('CV erfolgreich hochgeladen', 'success')
    } catch (err: any) {
      console.error('uploadCV failed', err)
      const msg = err?.response?.data?.detail || 'Fehler beim Hochladen'
      get().pushToast(msg, 'error')
      throw err
    }
  },

  deleteCV: async () => {
    try {
      await client.delete('/applications/cv')
      set({ cv: null })
      get().pushToast('CV gelöscht', 'info')
    } catch (err) {
      console.error('deleteCV failed', err)
      get().pushToast('Fehler beim Löschen', 'error')
    }
  },

  fetchApplications: async () => {
    set({ applicationsLoading: true })
    try {
      const { data } = await client.get('/applications')
      set({ applications: data.applications || [], applicationsLoading: false })
    } catch (err) {
      console.error('fetchApplications failed', err)
      set({ applications: [], applicationsLoading: false })
    }
  },

  generateApplication: async (jobId) => {
    try {
      await client.post(`/applications/generate/${jobId}`)
      get().pushToast('Bewerbung wird erstellt...', 'info')
      // Refresh quickly + after the agent finishes (~3s)
      get().fetchApplications()
      get().fetchAgents()
      setTimeout(() => {
        get().fetchApplications()
        get().fetchAgents()
      }, 3500)
    } catch (err: any) {
      console.error('generateApplication failed', err)
      const msg = err?.response?.data?.detail || 'Fehler beim Generieren'
      get().pushToast(msg, 'error')
    }
  },

  deleteApplication: async (id) => {
    try {
      await client.delete(`/applications/${id}`)
      set(state => ({ applications: state.applications.filter(a => a.id !== id) }))
      get().pushToast('Bewerbung gelöscht', 'info')
    } catch (err) {
      console.error('deleteApplication failed', err)
      get().pushToast('Fehler beim Löschen', 'error')
    }
  },

  downloadAppFile: async (id, kind) => {
    try {
      const res = await client.get(`/applications/${id}/download/${kind}`, { responseType: 'blob' })
      const cd = res.headers['content-disposition'] || ''
      const match = /filename="?([^"]+)"?/.exec(cd)
      const filename = match ? match[1] : `${kind}_${id}.docx`

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('downloadAppFile failed', err)
      get().pushToast('Fehler beim Download', 'error')
    }
  },

  // === SCHEDULER ===
  fetchScheduler: async () => {
    try {
      const { data } = await client.get('/scheduler')
      set({ scheduler: data })
    } catch (err) {
      console.error('fetchScheduler failed', err)
    }
  },

  triggerScheduler: async () => {
    try {
      await client.post('/scheduler/trigger')
      get().pushToast('Auto-Pilot manuell gestartet', 'info')
      get().fetchScheduler()
      setTimeout(() => { get().fetchScheduler(); get().fetchAgents(); get().fetchJobs(1) }, 4000)
    } catch (err: any) {
      console.error('triggerScheduler failed', err)
      get().pushToast(err?.response?.data?.detail || 'Fehler', 'error')
    }
  },

  pauseScheduler: async () => {
    try {
      const { data } = await client.post('/scheduler/pause')
      set({ scheduler: data })
      get().pushToast('Auto-Pilot pausiert', 'info')
    } catch (err) { console.error(err) }
  },

  resumeScheduler: async () => {
    try {
      const { data } = await client.post('/scheduler/resume')
      set({ scheduler: data })
      get().pushToast('Auto-Pilot aktiviert', 'success')
    } catch (err) { console.error(err) }
  },

  // === CHEF CHAT ===
  sendChefCommand: async (text) => {
    try {
      const { data } = await client.post('/chef/chat', { message: text })
      // Refresh agents list — chef may have updated their config
      get().fetchAgents()
      return data
    } catch (err: any) {
      console.error('sendChefCommand failed', err)
      get().pushToast(err?.response?.data?.detail || 'Chef konnte den Befehl nicht verstehen', 'error')
      return null
    }
  },
}))
