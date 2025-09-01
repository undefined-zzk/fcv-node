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
