export interface Job {
  id: string
  type: "embed_article" | "recalc_credibility" | "update_recommendations" | "cleanup_cache"
  data: any
  status: "pending" | "processing" | "completed" | "failed"
  retries: number
  maxRetries: number
  createdAt: string
  processedAt?: string
  error?: string
}

class JobQueue {
  private jobs: Map<string, Job> = new Map()
  private processing: Set<string> = new Set()
  private maxConcurrent = 5

  /**
   * Enqueue a job
   */
  enqueue(type: Job["type"], data: any, maxRetries = 3): string {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const job: Job = {
      id,
      type,
      data,
      status: "pending",
      retries: 0,
      maxRetries,
      createdAt: new Date().toISOString(),
    }

    this.jobs.set(id, job)
    this.processNext()

    return id
  }

  /**
   * Get job status
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id)
  }

  /**
   * Process next job in queue
   */
  private async processNext() {
    if (this.processing.size >= this.maxConcurrent) {
      return
    }

    const pendingJob = Array.from(this.jobs.values()).find((j) => j.status === "pending")

    if (!pendingJob) {
      return
    }

    this.processing.add(pendingJob.id)
    pendingJob.status = "processing"

    try {
      await this.executeJob(pendingJob)
      pendingJob.status = "completed"
      pendingJob.processedAt = new Date().toISOString()
    } catch (error) {
      console.error(`Job ${pendingJob.id} failed:`, error)

      if (pendingJob.retries < pendingJob.maxRetries) {
        pendingJob.retries++
        pendingJob.status = "pending"
        pendingJob.error = String(error)
      } else {
        pendingJob.status = "failed"
        pendingJob.error = String(error)
      }
    } finally {
      this.processing.delete(pendingJob.id)
      this.processNext()
    }
  }

  /**
   * Execute a job based on type
   */
  private async executeJob(job: Job) {
    switch (job.type) {
      case "embed_article":
        await this.embedArticle(job.data)
        break
      case "recalc_credibility":
        await this.recalculateCredibility(job.data)
        break
      case "update_recommendations":
        await this.updateRecommendations(job.data)
        break
      case "cleanup_cache":
        await this.cleanupCache(job.data)
        break
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  /**
   * Embed article content and store in vector DB
   */
  private async embedArticle(data: { articleId: string; content: string }) {
    console.log(`[Worker] Embedding article ${data.articleId}`)
    // Implementation would call embeddings service and store in vector DB
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  /**
   * Recalculate credibility for an article
   */
  private async recalculateCredibility(data: { articleId: string }) {
    console.log(`[Worker] Recalculating credibility for article ${data.articleId}`)
    // Implementation would recalculate and publish updates
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  /**
   * Update recommendations for a user
   */
  private async updateRecommendations(data: { userId: string }) {
    console.log(`[Worker] Updating recommendations for user ${data.userId}`)
    // Implementation would recalculate recommendations
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  /**
   * Cleanup expired cache entries
   */
  private async cleanupCache(data: { type: string }) {
    console.log(`[Worker] Cleaning up ${data.type} cache`)
    // Implementation would delete expired entries from database
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

export const jobQueue = new JobQueue()
