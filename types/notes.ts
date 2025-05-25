export interface Note {
  id: string
  userId: string
  title: string
  content: string
  topic: string
  createdAt: string
  updatedAt: string
  articleId?: string
  articleTitle?: string
  isMarkdown?: boolean
  tags?: string[]
}
