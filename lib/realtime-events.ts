import {
  wsManager,
  type WebSocketMessage,
  type RecommendationUpdate,
  type CredibilityUpdate,
} from "@/lib/websocket-manager"

/**
 * Publish recommendation update to user
 */
export function publishRecommendationUpdate(userId: string, update: RecommendationUpdate) {
  const message: WebSocketMessage = {
    type: "recommendation_update",
    userId,
    data: update,
    timestamp: new Date().toISOString(),
  }

  wsManager.broadcastToUser(userId, message)
}

/**
 * Publish credibility update to affected users
 */
export function publishCredibilityUpdate(articleId: string, update: CredibilityUpdate, affectedUserIds: string[]) {
  const message: WebSocketMessage = {
    type: "credibility_update",
    userId: "", // Will be set per user
    data: {
      articleId,
      ...update,
    },
    timestamp: new Date().toISOString(),
  }

  wsManager.broadcastToUsers(affectedUserIds, {
    type: message.type,
    data: message.data,
    timestamp: message.timestamp,
  })
}

/**
 * Publish methodology update
 */
export function publishMethodologyUpdate(userId: string, changes: any) {
  const message: WebSocketMessage = {
    type: "methodology_update",
    userId,
    data: changes,
    timestamp: new Date().toISOString(),
  }

  wsManager.broadcastToUser(userId, message)
}

/**
 * Publish dashboard metrics update
 */
export function publishDashboardMetrics(userId: string, metrics: any) {
  const message: WebSocketMessage = {
    type: "dashboard_metrics",
    userId,
    data: metrics,
    timestamp: new Date().toISOString(),
  }

  wsManager.broadcastToUser(userId, message)
}
