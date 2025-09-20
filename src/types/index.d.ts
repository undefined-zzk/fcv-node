export interface Page {
  pageNum: number
  pageSize: number
  title?: string
  sort: 'asc' | 'desc'
  status?: number
  startTime?: string
  endTime?: string
  all: number
  [key: string]: any
}

export interface IntegralParams {
  integral: number
  user_id: number
  type: number
  source: string
  source_id: number
}
