export type Role = "admin" | "super_admin" | "employee" | "user";

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

export type Priority = "normal" | "urgent";

export type ComplaintKind = "complaint" | "feedback";

export type CategoryFilter =
  | "All"
  | "HR"
  | "Payroll"
  | "Facilities"
  | "IT"
  | "Safety"
  | "Unclassified";

export interface Complaint {
  id: number;
  emp_id: string;
  email: string;
  phone: string;
  complaint_text: string;
  kind: ComplaintKind;
  category: string;
  plant?: string | null;
  priority: Priority;
  status: ComplaintStatus;
  ai_confidence?: number;
  kind_confidence?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: number;
  assignment_source?: string;
  assignment_notes?: string;
  attachment_ids: number[];
  ai_insights?: AIInsights | null;
  sentiment_history?: SentimentSnapshot[];
  source_channel?: string;
  source_metadata?: ChannelMetadata | null;
  first_response_at?: string | null;
  resolution_time_hours?: number | null;
  internal_notes?: InternalNote[];
  watchers?: number[];
}

export interface Reply {
  id: number;
  complaint_id: number;
  admin_id: number;
  reply_text: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  complaint_id: number;
  reply_id?: number | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface DashboardStats {
  total_feedback: number;
  total_complaints: number;
  resolved: number;
  pending: number;
  in_progress: number;
  unclassified: number;
  by_kind: Record<string, number>;
  by_category: Record<string, number>;
}

export interface DashboardKpis {
  total_complaints: number;
  resolution_rate: number;
  urgent_cases: number;
  avg_response_time_hours: number;
  sla_compliance_rate: number;
}

export interface SentimentMetrics {
  overall_score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  trend: Array<{ date: string; score: number }>;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: string;
  estimated_effort: string;
  category: string;
  confidence: number;
  solution_steps: string[];
}

export interface RootCauseInsight {
  issue: string;
  complaint_count: number;
  departments: string[];
  severity: "high" | "medium" | "low";
  confidence: number;
  summary: string;
  recommended_actions: string[];
}

export interface RootCauseResponse {
  root_causes: RootCauseInsight[];
  generated_at: string;
  source: string;
}

export interface InsightsHeader {
  ai_confidence_percent: number;
  patterns_detected_count: number;
  auto_resolved_count: number;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface TrendPoint {
  period: string;
  total: number;
  resolved: number;
}

export interface ComplaintKeyIssue {
  complaint_id: number;
  kind: ComplaintKind;
  category: string;
  status: ComplaintStatus;
  key_issue: string;
  probability: number;
}

export interface SummaryResponse {
  summary: string;
  generated_at: string;
  metadata: Record<string, string>;
  prevention_recommendations: string[];
  focus_areas: string[];
  key_issues: ComplaintKeyIssue[];
}

export interface ReportMetadata {
  generated_at?: string;
  period?: string;
  period_label?: string;
  stats?: Record<string, number>;
  summary_markdown?: string;
  summary_plain?: string;
  prevention_recommendations?: string[];
  focus_areas?: string[];
  key_issues?: ComplaintKeyIssue[];
  top_categories?: { category: string; count: number }[];
}

export interface Report {
  id: number;
  period: "weekly" | "monthly" | "yearly";
  from_date: string;
  to_date: string;
  summary: string;
  created_at: string;
  download_url?: string | null;
  html_content?: string | null;
  recipients: string[];
  metadata?: ReportMetadata | null;
}

export interface FeedbackFilterSettings {
  kind?: ComplaintKind | null;
  status?: ComplaintStatus | null;
  priority?: Priority | null;
  plant?: string | null;
  from_date?: string | null;
  to_date?: string | null;
}

export interface FeedbackPreset {
  name: string;
  filters: FeedbackFilterSettings;
}

export interface FeedbackPresetCollection {
  presets: FeedbackPreset[];
}

export interface ComplaintSummary {
  complaint_id: number;
  category: string;
  probability: number;
  summary: string;
}

export interface AssistanceResponse {
  recommended_actions: string[];
  suggested_reply: string;
  tone: string;
  source: string;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
  keyword_hits: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    role: Role;
    department?: string | null;
    plant?: string | null;
  };
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  department?: string | null;
  plant?: string | null;
  created_at: string;
  password?: string | null;
}

export interface EmployeeUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  department?: string | null;
  plant?: string | null;
  manager_id?: number | null;  // The admin/manager they report to
  created_at: string;
  password?: string | null;
}

export interface SentimentSnapshot {
  sentiment: string;
  emotion: string;
  urgency_score: number;
  confidence: number;
  reasoning: string;
}

export interface SimilarComplaint {
  complaint_id: number;
  similarity_score: number;
  matched_keywords: string[];
  resolution_summary?: string | null;
}

export interface AIInsights {
  sentiment: SentimentSnapshot;
  similar_complaints: SimilarComplaint[];
  suggested_category: string;
  suggested_priority: string;
  suggested_assignee?: number | null;
  resolution_template?: string | null;
  estimated_resolution_time?: number | null;
  tags: string[];
  analyzed_at: string;
}

export interface ChannelMetadata {
  email_from?: string | null;
  email_subject?: string | null;
  email_message_id?: string | null;
  platform?: string | null;
  post_id?: string | null;
  author_handle?: string | null;
  public_url?: string | null;
  session_id?: string | null;
  visitor_ip?: string | null;
  browser_info?: string | null;
  webhook_source?: string | null;
  external_id?: string | null;
  api_key_id?: string | null;
}

export interface InternalNote {
  id: number;
  complaint_id: number;
  author_id: number;
  author_name: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  attachments: number[];
}

export interface TrendDataPoint {
  date: string;
  count: number;
  avg_resolution_time?: number | null;
  sentiment_score?: number | null;
}

export interface CategoryMetric {
  category: string;
  count: number;
  avg_resolution_time: number;
  resolution_rate: number;
  avg_sentiment_score: number;
  trending: "up" | "down" | "stable";
}

export interface AdminPerformanceMetric {
  admin_id: number;
  admin_name: string;
  assigned_count: number;
  resolved_count: number;
  avg_resolution_time: number;
  avg_first_response_time: number;
  customer_satisfaction?: number | null;
  resolution_rate: number;
}

export interface PredictiveInsights {
  predicted_volume_next_week: number;
  high_risk_categories: string[];
  recommended_staffing: Record<number, number>;
  emerging_issues: Array<{
    category: string;
    recent_count: string;
    severity: string;
  }>;
}

export interface AdvancedAnalytics {
  overview: Record<string, number>;
  trends: TrendDataPoint[];
  category_metrics: CategoryMetric[];
  admin_performance: AdminPerformanceMetric[];
  predictive_insights?: PredictiveInsights | null;
  generated_at: string;
}

export interface CategoryDeepDive {
  category: string;
  total_complaints: number;
  trends: TrendDataPoint[];
  top_tags: Array<{ tag: string; count: number }>;
  sentiment_distribution: Record<string, number>;
  avg_resolution_time_hours?: number | null;
  avg_first_response_hours?: number | null;
  sla_breach_rate?: number | null;
  reopen_rate?: number | null;
  avg_backlog_age_hours?: number | null;
}

export interface DepartmentStat {
  department: string;
  total: number;
  resolved: number;
  pending: number;
  in_progress: number;
  resolution_rate: number;
  avg_resolution_time_hours: number;
  avg_first_response_hours: number;
  sla_breach_rate: number;
  reopen_rate: number;
  avg_backlog_age_hours: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
