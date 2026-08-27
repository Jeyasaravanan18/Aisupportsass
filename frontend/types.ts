// types.ts — shared TypeScript interfaces matching backend Pydantic models

export type InteractionMode = 'simulator' | 'manual' | 'replay';

export type SentimentLabel =
  | 'very_negative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'very_positive';

export interface SessionConfig {
  mode: InteractionMode;
  agent_name: string;
  product_context: string;
  customer_scenario: string;
  persona_frustration: number;
  persona_verbosity: 'brief' | 'moderate' | 'detailed';
  replay_transcript?: string;
}

export interface SessionCreateResponse {
  session_id: string;
  mode: InteractionMode;
  message: string;
}

export interface ConversationMessage {
  role: 'customer' | 'agent';
  content: string;
  turn_index: number;
}

export interface KnowledgeArticle {
  title: string;
  excerpt: string;
  article_id: string;
  relevance_score: number;
}

export interface IntentSentimentResult {
  intent: string;
  emotional_state: string;
  frustration_level: number;
  satisfaction_trend: 'improving' | 'stable' | 'declining';
  sentiment_label: SentimentLabel;
  sentiment_score: number;
}

export interface CoachingResult {
  suggested_response: string;
  tone_score: number;
  tone_feedback: string;
  improvement_tips: string[];
}

export interface EscalationResult {
  risk_score: number;
  reasoning: string;
  strategy: string;
  should_alert: boolean;
}

export interface TurnResult {
  session_id: string;
  turn_index: number;
  customer_message: string;
  intent_sentiment: IntentSentimentResult;
  knowledge_articles: KnowledgeArticle[];
  coaching: CoachingResult;
  escalation: EscalationResult;
  conversation_history: ConversationMessage[];
}

export interface SentimentJourneyPoint {
  turn_index: number;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  customer_message_preview: string;
}

export interface EscalationMoment {
  turn_index: number;
  risk_score: number;
  customer_message_preview: string;
}

export interface PerformanceReport {
  session_id: string;
  agent_name: string;
  mode: InteractionMode;
  total_turns: number;
  duration_seconds: number | null;
  summary: string;
  sentiment_journey: SentimentJourneyPoint[];
  resolution_quality_score: number;
  resolution_quality_breakdown: {
    empathy_and_tone: number;
    issue_resolution: number;
    response_clarity: number;
    efficiency: number;
  };
  escalation_moments: EscalationMoment[];
  coaching_recommendations: string[];
  top_knowledge_gaps: string[];
  final_customer_sentiment: SentimentLabel;
}
