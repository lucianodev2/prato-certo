import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api' })

export interface Meal {
  id: number
  name: string
  category: string
  description: string
  created_at: string
}

export interface Evaluation {
  id: number
  meal_id: number
  meal_name?: string
  meal_category?: string
  rating: number
  liked: number
  had_waste: number
  day_of_week: number
  week_number: number
  created_at: string
}

export interface MealStats {
  id: number
  name: string
  category: string
  total_evals: number
  avg_rating: number
  liked_count: number
  waste_count: number
  approval_rate: number
}

export interface Overview {
  totalEvaluations: number
  averageRating: number
  wastePercentage: number
  totalMeals: number
}

export interface MatrixCell { avg: number; count: number }

export const mealsApi = {
  getAll:    ()              => http.get<{ meals: Meal[]; total: number }>('/meals'),
  getById:   (id: number)    => http.get<Meal>(`/meals/${id}`),
  create:    (data: Partial<Meal>) => http.post<{ meal: Meal; stackSize: number }>('/meals', data),
  update:    (id: number, data: Partial<Meal>) => http.put<{ meal: Meal; stackSize: number }>(`/meals/${id}`, data),
  remove:    (id: number)    => http.delete<{ message: string; stackSize: number }>(`/meals/${id}`),
  undo:      ()              => http.post('/meals/undo/last'),
  getStack:  ()              => http.get('/meals/stack/history'),
}

export const evaluationsApi = {
  getAll:         () => http.get<{ evaluations: Evaluation[] }>('/evaluations'),
  create:         (data: { meal_id: number; rating: number; liked: boolean; had_waste: boolean }) =>
                    http.post<{ message: string; id: number; queueSize: number }>('/evaluations', data),
  getQueueStatus: () => http.get('/evaluations/queue/status'),
}

export const statsApi = {
  getOverview:  () => http.get<Overview>('/stats/overview'),
  getMealsStats:() => http.get<{ stats: MealStats[] }>('/stats/meals'),
  getMatrix:    () => http.get<{ matrix: MatrixCell[][]; weeks: number; days: number }>('/stats/matrix'),
  getTree:      () => http.get('/stats/tree'),
}

export interface AIInsight {
  type: 'positive' | 'negative' | 'neutral'
  icon: string
  title: string
  description: string
}

export interface AIAlert {
  severity: 'high' | 'medium' | 'low'
  icon: string
  message: string
}

export interface AISuggestion {
  priority: 'alta' | 'média' | 'baixa'
  icon: string
  action: string
  reason: string
}

export interface AITrend {
  label: string
  direction: 'up' | 'down' | 'stable'
  icon: string
  value: string
}

export interface AIAnalysis {
  ok: boolean
  generatedAt: string
  engine: string
  overview: Overview
  summary: string
  insights: AIInsight[]
  alerts: AIAlert[]
  suggestions: AISuggestion[]
  trends: AITrend[]
}

export const analysisApi = {
  generate: () => http.post<AIAnalysis>('/analysis/generate'),
  getLast:  () => http.get<AIAnalysis & { cached?: boolean }>('/analysis/last'),
}
