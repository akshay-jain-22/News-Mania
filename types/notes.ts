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
  articleUrl?: string
  isMarkdown: boolean
  tags: string[]
}

export interface CreateNoteInput {
  title: string
  content: string
  topic?: string
  articleId?: string
  articleTitle?: string
  articleUrl?: string
  isMarkdown?: boolean
  tags?: string[]
}
