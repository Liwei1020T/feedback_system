import type {
  AssistanceResponse,
  Attachment,
  AuthTokens,
  AdminUser,
  CategorySuggestion,
  Complaint,
  ComplaintKind,
  ComplaintStatus,
  DashboardStats,
  DashboardKpis,
  SentimentMetrics,
  AIRecommendation,
  ComplaintSummary,
  Reply,
  SummaryResponse,
  TrendPoint,
  AIInsights,
  AdvancedAnalytics,
  CategoryDeepDive,
  DepartmentStat,
  PaginatedResult,
  Report,
  FeedbackPreset,
  FeedbackPresetCollection,
  InternalNote,
  Notification,
  RootCauseResponse,
  InsightsHeader
} from "../types";
import { apiClient } from "./client";

export interface ComplaintPayload {
  emp_id: string;
  email: string;
  phone: string;
  complaint_text: string;
  plant: string;
  kind?: ComplaintKind;
  category?: string;
  priority?: "normal" | "urgent";
}

export interface ReplyPayload {
  complaint_id: number;
  admin_id: number;
  reply_text: string;
  send_email?: boolean;
}

export interface AdminCreatePayload {
  username: string;
  email: string;
  password: string;
  department?: string;
  plant?: string;
}

export const login = async (username: string, password: string): Promise<AuthTokens> => {
  const { data } = await apiClient.post<AuthTokens>("/api/auth/login", { username, password });
  return data;
};

export const refreshToken = async (refresh_token: string) => {
  const { data } = await apiClient.post<{ access_token: string; expires_in: number }>(
    "/api/auth/refresh",
    { refresh_token }
  );
  return data;
};

export const submitComplaint = async (payload: ComplaintPayload, attachment?: File | null) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  if (attachment) {
    formData.append("attachment", attachment);
  }
  const { data } = await apiClient.post<Complaint>("/api/complaints", formData);
  return data;
};

type PaginatedComplaintsApi = {
  items: Complaint[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
};

const mapMeta = (meta: PaginatedComplaintsApi["meta"]): PaginatedResult<Complaint>["meta"] => ({
  page: meta.page,
  pageSize: meta.page_size,
  total: meta.total,
  totalPages: meta.total_pages
});

export interface ListComplaintsParams {
  page?: number;
  pageSize?: number;
  sort?: "created_at" | "priority" | "status";
  order?: "asc" | "desc";
  search?: string;
  kind?: ComplaintKind;
  category?: string;
  status?: ComplaintStatus;
  priority?: "normal" | "urgent";
  plant?: string;
  fromDate?: string;
  toDate?: string;
}

export const listComplaints = async (params: ListComplaintsParams = {}): Promise<PaginatedResult<Complaint>> => {
  const query: Record<string, unknown> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.page_size = params.pageSize;
  if (params.sort) query.sort = params.sort;
  if (params.order) query.order = params.order;
  if (params.search) query.search = params.search;
  if (params.kind) query.kind = params.kind;
  if (params.category) query.category = params.category;
  if (params.status) query.status = params.status;
  if (params.priority) query.priority = params.priority;
  if (params.plant) query.plant = params.plant;
  if (params.fromDate) query.from_date = params.fromDate;
  if (params.toDate) query.to_date = params.toDate;

  const { data } = await apiClient.get<PaginatedComplaintsApi>("/api/complaints", {
    params: Object.keys(query).length ? query : undefined
  });
  return {
    items: data.items,
    meta: mapMeta(data.meta)
  };
};

export const getPlants = async () => {
  const { data } = await apiClient.get<string[]>("/api/complaints/plants");
  return data;
};

export const getComplaint = async (id: number) => {
  const { data } = await apiClient.get<Complaint>(`/api/complaints/${id}`);
  return data;
};

export const updateComplaint = async (id: number, updates: Partial<Complaint>) => {
  const { data } = await apiClient.put<Complaint>(`/api/complaints/${id}`, updates);
  return data;
};

export const classifyComplaint = async (id: number) => {
  const { data } = await apiClient.post(`/api/complaints/${id}/classify`);
  return data;
};

export const getReplyAssistance = async (id: number) => {
  const { data } = await apiClient.get<AssistanceResponse>(`/api/complaints/${id}/assist`);
  return data;
};

export const getCategorySuggestions = async (id: number) => {
  const { data } = await apiClient.get<{ suggestions: CategorySuggestion[] }>(
    `/api/complaints/${id}/suggestions`
  );
  return data.suggestions;
};

export const createReply = async (payload: ReplyPayload, attachment?: File | null) => {
  const formData = new FormData();
  formData.append("complaint_id", payload.complaint_id.toString());
  formData.append("admin_id", payload.admin_id.toString());
  formData.append("reply_text", payload.reply_text);
  formData.append("send_email", (payload.send_email ?? true).toString());
  if (attachment) {
    formData.append("attachment", attachment);
  }
  const { data } = await apiClient.post<Reply>("/api/replies", formData);
  return data;
};

type PaginatedRepliesApi = {
  items: Reply[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
};

export interface ListRepliesParams {
  page?: number;
  pageSize?: number;
  order?: "asc" | "desc";
}

export const listReplies = async (
  complaintId: number,
  params: ListRepliesParams = {}
): Promise<PaginatedResult<Reply>> => {
  const query: Record<string, unknown> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.page_size = params.pageSize;
  if (params.order) query.order = params.order;

  const { data } = await apiClient.get<PaginatedRepliesApi>(`/api/replies/${complaintId}`, {
    params: Object.keys(query).length ? query : undefined
  });
  return {
    items: data.items,
    meta: mapMeta(data.meta)
  };
};

export const getComplaintAttachments = async (complaintId: number) => {
  const { data } = await apiClient.get<Attachment[]>(`/api/complaints/${complaintId}/attachments`);
  return data;
};

export const uploadAttachment = async (complaintId: number, file: File) => {
  const formData = new FormData();
  formData.append("complaint_id", complaintId.toString());
  formData.append("file", file);
  const { data } = await apiClient.post<Attachment>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
};

export const downloadAttachment = async (attachmentId: number) => {
  const response = await apiClient.get<Blob>(`/api/files/${attachmentId}`, {
    responseType: "blob"
  });
  return response.data;
};

export const deleteAttachment = async (attachmentId: number) => {
  await apiClient.delete(`/api/files/${attachmentId}`);
};

export const listAdmins = async () => {
  const { data } = await apiClient.get<AdminUser[]>("/api/admins");
  return data;
};

export const createAdmin = async (payload: AdminCreatePayload) => {
  const { data } = await apiClient.post<AdminUser>("/api/admins", payload);
  return data;
};

export const listAdminDepartments = async () => {
  const { data } = await apiClient.get<string[]>("/api/admins/departments");
  return data;
};

export const listPlants = async () => {
  const { data } = await apiClient.get<string[]>("/api/complaints/plants");
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await apiClient.get<DashboardStats>("/api/analytics/dashboard");
  return data;
};

export const getDashboardKpis = async (params?: { fromDate?: string; toDate?: string }) => {
  const { data } = await apiClient.get<DashboardKpis>("/api/analytics/kpis", { params });
  return data;
};

export const getTopCategories = async (limit: number = 10) => {
  const { data } = await apiClient.get<{ categories: Array<{ name: string; count: number }> }>(
    "/api/analytics/top-categories",
    { params: { limit } }
  );
  return data.categories;
};

export const getStatusDistribution = async () => {
  const { data } = await apiClient.get<{ distribution: Record<string, number> }>(
    "/api/analytics/distribution/status"
  );
  return data.distribution;
};

export const getSentimentMetrics = async (days: number = 30) => {
  const { data } = await apiClient.get<SentimentMetrics>(
    "/api/analytics/sentiment",
    { params: { days } }
  );
  return data;
};

export const getAIRecommendations = async () => {
  const { data } = await apiClient.get<{ 
    recommendations: AIRecommendation[];
    generated_at: string;
  }>("/api/ai/recommendations");
  return data.recommendations;
};

export const getRootCauseInsights = async () => {
  const { data } = await apiClient.get<RootCauseResponse>("/api/ai/root-causes");
  return data;
};

export const getInsightsHeader = async () => {
  const { data } = await apiClient.get<InsightsHeader>("/api/analytics/insights-header");
  return data;
};

export const refreshAIInsights = async () => {
  // refresh recommendations and root causes in parallel
  const [recs, roots] = await Promise.all([
    apiClient.post("/api/ai/recommendations/refresh"),
    apiClient.post("/api/ai/root-causes/refresh")
  ]);
  return { recommendations: recs.data, rootCauses: roots.data } as const;
};

export const getTrendData = async () => {
  const { data } = await apiClient.get<{ points: TrendPoint[] }>("/api/analytics/trends");
  return data.points;
};

export const getUserStats = async () => {
  const { data } = await apiClient.get<{ complaints_handled: number; resolution_rate: number; avg_response_time_hours: number }>(
    "/api/analytics/user-stats"
  );
  return data;
};

export const getProfilePreferences = async () => {
  const { data } = await apiClient.get<{ email_notifications: boolean; browser_notifications: boolean; weekly_summary: boolean }>(
    "/api/profile/preferences"
  );
  return data;
};

export const updateProfilePreferences = async (payload: {
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_summary: boolean;
}) => {
  const { data } = await apiClient.put<typeof payload>("/api/profile/preferences", payload);
  return data;
};

export const changePassword = async (current_password: string, new_password: string) => {
  const { data } = await apiClient.post<{ success: boolean }>("/api/profile/change-password", {
    current_password,
    new_password
  });
  return data.success;
};

export const getFeedbackPresets = async (): Promise<FeedbackPresetCollection> => {
  const { data } = await apiClient.get<FeedbackPresetCollection>("/api/profile/presets/feedback");
  return data;
};

export const saveFeedbackPresets = async (presets: FeedbackPreset[]): Promise<FeedbackPresetCollection> => {
  const { data } = await apiClient.put<FeedbackPresetCollection>("/api/profile/presets/feedback", {
    presets
  });
  return data;
};

// Employee Management Endpoints
export interface EmployeeCreatePayload {
  username: string;
  email: string;
  password: string;
}

export const listMyEmployees = async (): Promise<EmployeeUser[]> => {
  const { data } = await apiClient.get<EmployeeUser[]>("/api/profile/my-employees");
  return data;
};

export const addEmployee = async (payload: EmployeeCreatePayload): Promise<EmployeeUser> => {
  const { data } = await apiClient.post<EmployeeUser>("/api/profile/my-employees", payload);
  return data;
};

export const removeEmployee = async (employeeId: number): Promise<void> => {
  await apiClient.delete(`/api/profile/my-employees/${employeeId}`);
};

export const getManager = async (): Promise<{ id: number; username: string; email: string; department?: string; plant?: string; role: string } | null> => {
  const { data } = await apiClient.get("/api/profile/manager");
  return data;
};

export const getDepartmentStats = async () => {
  const { data } = await apiClient.get<{ items: DepartmentStat[] }>("/api/analytics/department-stats");
  return data.items;
};

export const getSummary = async (period: "weekly" | "monthly" | "yearly" = "weekly") => {
  const { data } = await apiClient.get<SummaryResponse>("/api/analytics/summary", {
    params: { period }
  });
  return data;
};

export const generateReport = async (period: "weekly" | "monthly" | "yearly"): Promise<Report> => {
  const { data } = await apiClient.post<Report>("/api/reports/generate", { period });
  return data;
};

export const getWeeklyReports = async (): Promise<Report[]> => {
  const { data } = await apiClient.get<Report[]>("/api/reports/weekly");
  return data;
};

export const getWeeklyReportContent = async (
  id: number,
  format: "html" | "text" = "html"
): Promise<string> => {
  const response = await apiClient.get<string>(`/api/reports/weekly/${id}`, {
    params: { format },
    responseType: "text"
  });
  return response.data;
};

export const generateWeeklyReportNow = async (): Promise<Report> => {
  const { data } = await apiClient.post<Report>("/api/reports/weekly/generate-now", {});
  return data;
};

export const deleteReport = async (reportId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/reports/${reportId}`);
  } catch (err: any) {
    const status = err?.response?.status as number | undefined;
    // Fallback: Some deployments may not allow DELETE; try POST fallback
    if (status === 405) {
      await apiClient.post(`/api/reports/${reportId}/delete`);
      return;
    }
    throw err;
  }
};

export const getAppLogs = async () => {
  const { data } = await apiClient.get<{ content: string }>("/api/logs");
  return data.content;
};

export const getEmailQueueStats = async (): Promise<{ pending: number; next_retry_eta: string | null }> => {
  const { data } = await apiClient.get<{ pending: number; next_retry_eta: string | null }>(
    "/api/logs/email-queue"
  );
  return data;
};

export const getComplaintSummary = async (id: number) => {
  const { data } = await apiClient.get<ComplaintSummary>(`/api/complaints/${id}/summary`);
  return data;
};

export const analyzeComplaintDeep = async (id: number) => {
  const { data } = await apiClient.post<AIInsights>(`/api/complaints/${id}/analyze`);
  return data;
};

export const regenerateResolutionTemplate = async (id: number) => {
  const { data } = await apiClient.post<{ template: string }>(
    `/api/complaints/${id}/regenerate-template`
  );
  return data.template;
};

export const analyzeAllComplaints = async () => {
  const { data } = await apiClient.post<{ analyzed: number; skipped: number; failed: number[] }>(
    "/api/complaints/analyze-all"
  );
  return data;
};

export const getAdvancedAnalytics = async (includePredictions = true) => {
  const { data } = await apiClient.get<AdvancedAnalytics>("/api/analytics/advanced", {
    params: { include_predictions: includePredictions }
  });
  return data;
};

export const getCategoryDeepDive = async (category: string) => {
  const { data } = await apiClient.get<CategoryDeepDive>(`/api/analytics/category/${category}`);
  return data;
};

// Natural Language Query
export const queryNaturalLanguage = async (query: string) => {
  const { data } = await apiClient.post("/api/analytics/nl-query", null, {
    params: { query }
  });
  return data;
};

// Voice of Customer Analysis
export const getVoiceOfCustomerAnalysis = async (params?: {
  category?: string;
  days?: number;
}) => {
  const { data } = await apiClient.get("/api/analytics/voc", { params });
  return data;
};

// ============================================================================
// Internal Notes API
// ============================================================================

export interface InternalNoteCreatePayload {
  content: string;
  attachments?: number[];
}

export interface InternalNoteUpdatePayload {
  content: string;
}

export const createInternalNote = async (
  complaintId: number,
  payload: InternalNoteCreatePayload
) => {
  const { data } = await apiClient.post<InternalNote>(
    `/api/complaints/${complaintId}/notes`,
    payload
  );
  return data;
};

export const listInternalNotes = async (complaintId: number) => {
  const { data } = await apiClient.get<InternalNote[]>(
    `/api/complaints/${complaintId}/notes`
  );
  return data;
};

export const updateInternalNote = async (
  complaintId: number,
  noteId: number,
  payload: InternalNoteUpdatePayload
) => {
  const { data } = await apiClient.put<InternalNote>(
    `/api/complaints/${complaintId}/notes/${noteId}`,
    payload
  );
  return data;
};

export const deleteInternalNote = async (complaintId: number, noteId: number) => {
  await apiClient.delete(`/api/complaints/${complaintId}/notes/${noteId}`);
};

export const pinInternalNote = async (complaintId: number, noteId: number) => {
  const { data } = await apiClient.post<InternalNote>(
    `/api/complaints/${complaintId}/notes/${noteId}/pin`
  );
  return data;
};

export const watchComplaint = async (complaintId: number) => {
  await apiClient.post(`/api/complaints/${complaintId}/notes/watch`);
};

export const unwatchComplaint = async (complaintId: number) => {
  await apiClient.delete(`/api/complaints/${complaintId}/notes/watch`);
};

// Department Management
export interface DepartmentInfo {
  name: string;
  plant: string;
  admin_count: number;
  employee_count: number;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
}

export interface EmployeeUser {
  id: number;
  username: string;
  email: string;
  role: string;
  department: string | null;
  plant: string | null;
  manager_id?: number | null;  // The admin/manager they report to
  created_at: string;
  password: string | null;
}

export interface DepartmentDetail {
  department: string;
  plant: string;
  admins: EmployeeUser[];
  employees: EmployeeUser[];
  stats: {
    total_complaints: number;
    pending: number;
    in_progress: number;
    resolved: number;
    admin_count: number;
    employee_count: number;
  };
}

export const getDepartments = async (plant?: string): Promise<DepartmentInfo[]> => {
  const normalizedPlant = plant && plant.trim();
  const params =
    normalizedPlant && normalizedPlant.toLowerCase() !== "all"
      ? { plant: normalizedPlant }
      : undefined;
  const { data } = await apiClient.get<DepartmentInfo[]>("/api/departments", {
    params
  });
  return data;
};

export const getDepartmentDetail = async (department: string, plant: string): Promise<DepartmentDetail> => {
  const { data } = await apiClient.get<DepartmentDetail>(`/api/departments/${encodeURIComponent(department)}/${encodeURIComponent(plant)}`);
  return data;
};

export const addEmployeeToDepartment = async (
  department: string,
  plant: string,
  employee: {
    username: string;
    email: string;
    password: string;
    department?: string;
    plant?: string;
  }
): Promise<EmployeeUser> => {
  const { data } = await apiClient.post<EmployeeUser>(
    `/api/departments/${encodeURIComponent(department)}/${encodeURIComponent(plant)}/employees`,
    employee
  );
  return data;
};

export const addAdminToDepartment = async (
  department: string,
  plant: string,
  admin: {
    username: string;
    email: string;
    password: string;
    department?: string;
    plant?: string;
  }
): Promise<EmployeeUser> => {
  const { data } = await apiClient.post<EmployeeUser>(
    `/api/departments/${encodeURIComponent(department)}/${encodeURIComponent(plant)}/admins`,
    admin
  );
  return data;
};

export const removeUserFromDepartment = async (userId: number): Promise<void> => {
  await apiClient.delete(`/api/departments/users/${userId}`);
};

export const getDepartmentNames = async (): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>("/api/departments/names");
  return data;
};

export interface DepartmentCreatePayload {
  name: string;
  description?: string;
  plant: string;
}

export const createDepartment = async (payload: DepartmentCreatePayload): Promise<{ id: number; name: string; description?: string; plant: string; message: string }> => {
  const { data } = await apiClient.post("/api/departments", payload, {
    params: { plant: payload.plant }
  });
  return data;
};

export const deleteDepartment = async (departmentName: string): Promise<void> => {
  await apiClient.delete(`/api/departments/${encodeURIComponent(departmentName)}`);
};

// ============================================================================
// AI Chatbot API
// ============================================================================

export interface ChatMessage {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  context_used: string[];
  suggested_actions?: string[];
}

export interface ChatHistoryMessage {
  role: string;
  content: string;
}

export interface ChatHistory {
  conversation_id: string;
  messages: ChatHistoryMessage[];
}

export const sendChatMessage = async (message: ChatMessage): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>("/api/chatbot/chat", message);
  return data;
};

export const clearChatConversation = async (conversationId: string): Promise<void> => {
  await apiClient.delete(`/api/chatbot/chat/${conversationId}`);
};

export const getChatHistory = async (conversationId: string): Promise<ChatHistory> => {
  const { data } = await apiClient.get<ChatHistory>(`/api/chatbot/chat/history/${conversationId}`);
  return data;
};

// ============================================================================
// Notifications API
// ============================================================================

export const listNotifications = async (isRead?: boolean, limit: number = 50) => {
  const { data } = await apiClient.get<Notification[]>(
    "/api/notifications",
    { params: { is_read: isRead, limit } }
  );
  return data;
};

export const getNotification = async (notifId: number) => {
  const { data } = await apiClient.get<Notification>(`/api/notifications/${notifId}`);
  return data;
};

export const markNotificationRead = async (notifId: number) => {
  const { data } = await apiClient.patch<Notification>(
    `/api/notifications/${notifId}/read`
  );
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.post<{ marked_read: number }>(
    "/api/notifications/mark-all-read"
  );
  return data;
};

export const deleteNotification = async (notifId: number) => {
  await apiClient.delete(`/api/notifications/${notifId}`);
};

export const createNotification = async (notification: Partial<Notification>) => {
  const { data } = await apiClient.post<Notification>(
    "/api/notifications",
    notification
  );
  return data;
};
