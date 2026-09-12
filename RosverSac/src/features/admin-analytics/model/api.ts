import { api } from '@/shared/lib/api'
import type { AnalyticsOverview } from './types'

export function fetchAnalyticsOverview(days = 14) {
  return api<AnalyticsOverview>(`/api/admin/analytics?days=${days}`)
}

export function rebuildAnalyticsDemand() {
  return api<AnalyticsOverview>('/api/admin/analytics/rebuild-demand', {
    method: 'POST',
    body: '{}',
  })
}
