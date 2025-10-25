import type { WebSocket } from "ws"

export interface WebSocketMessage {
  type: "recommendation_update" | "credibility_update" | "methodology_update" | "dashboard_metrics"
  userId: string
  data: any
  timestamp: string
}

export interface RecommendationUpdate {
  articleId: string
  score: number
  reason: string
  updatedAt: string
}

export interface CredibilityUpdate {
  articleId: string
  score: number
  factors: string[]
  updatedAt: string
}

class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map()
  private messageQueue: Map<string, WebSocketMessage[]> = new Map()

  /**
   * Register a WebSocket connection for a user
   */
  registerConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(ws)

    // Send queued messages
    const queued = this.messageQueue.get(userId) || []
    queued.forEach((msg) => {
      try {
        ws.send(JSON.stringify(msg))
      } catch (error) {
        console.error("Error sending queued message:", error)
      }
    })
    this.messageQueue.delete(userId)
  }

  /**
   * Unregister a WebSocket connection
   */
  unregisterConnection(userId: string, ws: WebSocket) {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      userConnections.delete(ws)
      if (userConnections.size === 0) {
        this.connections.delete(userId)
      }
    }
  }

  /**
   * Broadcast a message to a specific user
   */
  broadcastToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.connections.get(userId)

    if (!userConnections || userConnections.size === 0) {
      // Queue message if no active connections
      if (!this.messageQueue.has(userId)) {
        this.messageQueue.set(userId, [])
      }
      this.messageQueue.get(userId)!.push(message)
      return
    }

    userConnections.forEach((ws) => {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error("Error sending message:", error)
        this.unregisterConnection(userId, ws)
      }
    })
  }

  /**
   * Broadcast to multiple users
   */
  broadcastToUsers(userIds: string[], message: Omit<WebSocketMessage, "userId">) {
    userIds.forEach((userId) => {
      this.broadcastToUser(userId, {
        ...message,
        userId,
      })
    })
  }

  /**
   * Get active connection count for a user
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0
  }
}

export const wsManager = new WebSocketManager()
