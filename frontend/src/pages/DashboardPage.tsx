import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock4, Info, MessageCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  analyzeComplaintDeep,
  classifyComplaint,
  createReply,
  getCategorySuggestions,
  getDashboardStats,
  getComplaintAttachments,
  getComplaintSummary,
  getReplyAssistance,
  listComplaints,
  listReplies,
  downloadAttachment,
  regenerateResolutionTemplate,
  updateComplaint
} from "../api";
import type {
  CategoryFilter,
  CategorySuggestion,
  Complaint,
  ComplaintStatus,
  Attachment,
  Priority
} from "../types";
import StatCard from "../components/StatCard";
import ComplaintTable from "../components/ComplaintTable";
import EditComplaintModal from "../components/EditComplaintModal";
import ComplaintDetails from "../components/ComplaintDetails";
import { Card, CardBody, CardTitle } from "../components/Card";
import ReplyForm from "../components/ReplyForm";
import ReplyList from "../components/ReplyList";
import { useAuth } from "../hooks/useAuth";
import { useNotificationStore } from "../store/notifications";
import { useToastStore } from "../store/toast";
import AttachmentPreviewModal from "../components/AttachmentPreviewModal";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const CATEGORY_OPTIONS = ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"];
const PRIORITY_OPTIONS: Priority[] = ["normal", "urgent"];
const STATUS_OPTIONS: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [categoryValue, setCategoryValue] = useState<string>("Unclassified");
  const [priorityValue, setPriorityValue] = useState<Priority>("normal");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [statusValue, setStatusValue] = useState<ComplaintStatus>("Pending");
  const [replyDraft, setReplyDraft] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [tone, setTone] = useState<string>("supportive");
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<number, string>>({});
  const attachmentPreviewRef = useRef<Record<number, string>>({});
  const [previewAttachment, setPreviewAttachment] = useState<{ attachment: Attachment; url: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Complaint | null>(null);
  const addNotification = useNotificationStore((state) => state.add);
  const notificationItems = useNotificationStore((state) => state.items);
  const toast = useToastStore();

  // Recent feedback pagination + sorting (server-side)
  const [recentPage, setRecentPage] = useState<number>(1);
  const [recentPageSize] = useState<number>(10);
  const [recentSort, setRecentSort] = useState<"date" | "priority">(
  (localStorage.getItem("feedbackSort") as "date" | "priority") || "date"
  );

  const mapSort = (value: "date" | "priority") => (value === "date" ? "created_at" : "priority" as const);
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: [
      "complaints",
      "recent",
      { page: recentPage, pageSize: recentPageSize, sort: recentSort, category: categoryFilter }
    ],
    queryFn: () =>
      listComplaints({
        page: recentPage,
        pageSize: recentPageSize,
        sort: mapSort(recentSort),
        order: "desc",
        // pass category filter when applied
        category: categoryFilter !== "All" ? (categoryFilter as string) : undefined
      })
  });

  const complaints = complaintsData?.items || [];

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats
  });

  // Weekly textual AI summary is intentionally not shown on Dashboard.

  // Compute top categories from dashboard stats to enrich highlights
  const topCategories = useMemo(() => {
    if (!stats?.by_category) return [] as Array<{ name: string; count: number }>;
    return Object.entries(stats.by_category)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [stats?.by_category]);

  // Paginated replies for the selected feedback
  const [replyPage, setReplyPage] = useState<number>(1);
  const [replyPageSize] = useState<number>(5);
  const { data: repliesData, isFetching: repliesLoading } = useQuery({
    queryKey: ["replies", selected?.id, { page: replyPage, pageSize: replyPageSize }],
    queryFn: () => listReplies(selected!.id, { page: replyPage, pageSize: replyPageSize, order: "desc" }),
    enabled: Boolean(selected?.id)
  });

  const replies = repliesData?.items || [];

  const {
    data: attachments = [],
    isFetching: attachmentsLoading
  } = useQuery({
    queryKey: ["complaint-attachments", selected?.id],
    queryFn: () => getComplaintAttachments(selected!.id),
    enabled: Boolean(selected?.id)
  });

  const complaintLevelAttachments = useMemo(
    () => attachments.filter((attachment) => !attachment.reply_id),
    [attachments]
  );

  const { data: suggestions = [], isFetching: suggestionsLoading } = useQuery({
    queryKey: ["category-suggestions", selected?.id],
    queryFn: () => getCategorySuggestions(selected!.id),
    enabled: Boolean(selected?.id)
  });

  const {
    data: complaintSummary,
    isFetching: complaintSummaryLoading,
    isError: complaintSummaryError,
    error: complaintSummaryErrorValue
  } = useQuery({
    queryKey: ["complaint-summary", selected?.id],
    queryFn: () => getComplaintSummary(selected!.id),
    enabled: Boolean(selected?.id)
  });

  // Removed application logs panel and related polling on dashboard.

  // Server delivers filtered + sorted slice already; we only derive presentation here
  const complaintFeedback = useMemo(
    () => complaints.filter((item) => item.kind === "complaint"),
    [complaints]
  );
  const feedbackFeedback = useMemo(
    () => complaints.filter((item) => item.kind === "feedback"),
    [complaints]
  );

  useEffect(() => {
    complaints.forEach((complaint) => {
      const urgentId = `urgent-${complaint.id}`;
      const unclassifiedId = `unclassified-${complaint.id}`;

      if (
        complaint.priority === "urgent" &&
        !notificationItems.some((notification) => notification.id === urgentId)
      ) {
        addNotification({
          id: urgentId,
          title: "Urgent complaint",
          message: `Feedback #${complaint.id} (${complaint.category}) needs immediate attention.`,
          createdAt: complaint.created_at
        });
      }

      if (
        complaint.category === "Unclassified" &&
        !notificationItems.some((notification) => notification.id === unclassifiedId)
      ) {
        addNotification({
          id: unclassifiedId,
          title: "Manual classification required",
          message: `Feedback #${complaint.id} has low AI confidence and needs review.`,
          createdAt: complaint.created_at
        });
      }
    });
  }, [complaints, notificationItems, addNotification]);

  useEffect(() => {
    if (selected && categoryFilter !== "All" && selected.category !== categoryFilter) {
      setSelected(null);
    }
  }, [categoryFilter, selected]);

  useEffect(() => {
    if (!selected && complaints.length > 0) {
      setSelected(complaints[0] ?? null);
    }
  }, [complaints, selected]);

  useEffect(() => {
    const revokeAll = (map: Record<number, string>) => {
      Object.values(map).forEach((url) => URL.revokeObjectURL(url));
    };

    let active = true;

    const loadPreviews = async () => {
      if (!attachments || attachments.length === 0) {
        if (Object.keys(attachmentPreviewRef.current).length) {
          revokeAll(attachmentPreviewRef.current);
          attachmentPreviewRef.current = {};
        }
        if (active) {
          setAttachmentPreviews({});
        }
        return;
      }

      const next: Record<number, string> = {};
      for (const attachment of attachments) {
        if (!attachment.file_type.startsWith("image/")) {
          continue;
        }
        try {
          const blob = await downloadAttachment(attachment.id);
          if (!active) {
            return;
          }
          const url = URL.createObjectURL(blob);
          next[attachment.id] = url;
        } catch (error) {
          // Silently skip files that are no longer available (410 Gone)
          // This is expected for attachments that were deleted or never uploaded
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 410 || axiosError.response?.status === 404) {
              continue; // Skip silently for missing files
            }
          }
          // Log other errors for debugging
          console.error("Failed to load attachment preview", error);
        }
      }

      if (active) {
        revokeAll(attachmentPreviewRef.current);
        attachmentPreviewRef.current = next;
        setAttachmentPreviews(next);
      } else {
        revokeAll(next);
      }
    };

    loadPreviews();

    return () => {
      active = false;
      revokeAll(attachmentPreviewRef.current);
      attachmentPreviewRef.current = {};
    };
  }, [attachments, downloadAttachment]);

  useEffect(() => {
    if (selected) {
      setCategoryValue(selected.category);
      setPriorityValue(selected.priority);
      setStatusValue(selected.status);
      setReplyDraft("");
      setRecommendations([]);
      setTone("supportive");
  // Reset replies pagination on feedback switch
      setReplyPage(1);
    }
  }, [selected]);

  const handleViewAttachment = async (attachment: Attachment) => {
    try {
      const getUrl = async () => {
        if (attachmentPreviews[attachment.id]) {
          return attachmentPreviews[attachment.id];
        }
        const blob = await downloadAttachment(attachment.id);
        const url = URL.createObjectURL(blob);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return url;
      };

      const url = await getUrl();

      if (attachment.file_type.startsWith("image/")) {
        setPreviewAttachment({ attachment, url });
      } else {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) {
          throw new Error("Please allow pop-ups to view attachments.");
        }
      }
    } catch (error) {
      addNotification({
        id: `attachment-error-${attachment.id}-${Date.now()}`,
        title: "Attachment error",
        message: resolveErrorMessage(error, "Unable to open attachment."),
        createdAt: new Date().toISOString()
      });
    }
  };

  const classifyMutation = useMutation({
    mutationFn: (id: number) => classifyComplaint(id),
    onSuccess: async () => {
      if (!selected) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complaints"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["category-suggestions", selected.id] }),
        queryClient.invalidateQueries({ queryKey: ["complaint-summary", selected.id] })
      ]);
    }
  });
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No complaint selected");
      return updateComplaint(selected.id, {
        category: categoryValue,
        priority: priorityValue,
        status: statusValue
      });
    },
    onSuccess: async () => {
      if (!selected) return;
      setSelected((prev) =>
        prev && prev.id === selected.id
          ? {
              ...prev,
              category: categoryValue,
              priority: priorityValue,
              status: statusValue,
              updated_at: new Date().toISOString()
            }
          : prev
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complaints"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["replies", selected.id] }),
        queryClient.invalidateQueries({ queryKey: ["category-suggestions", selected.id] }),
        queryClient.invalidateQueries({ queryKey: ["complaint-summary", selected.id] })
      ]);
    }
  });

  const replyMutation = useMutation({
    mutationFn: (payload: { text: string; sendEmail: boolean; attachment?: File | null }) => {
      if (!selected || !user) {
        throw new Error("No complaint selected");
      }
      return createReply({
        complaint_id: selected.id,
        admin_id: user.id,
        reply_text: payload.text,
        send_email: payload.sendEmail
      }, payload.attachment);
    },
    onSuccess: async (_, variables) => {
      if (selected) {
        await queryClient.invalidateQueries({ queryKey: ["replies", selected.id] });
        await queryClient.invalidateQueries({ queryKey: ["complaints"] });
        await queryClient.invalidateQueries({ queryKey: ["complaint-attachments", selected.id] });
        if (variables.sendEmail) {
          await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
        setReplyDraft("");
      }
    }
  });

  const assistanceMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No complaint selected");
      return getReplyAssistance(selected.id);
    },
    onSuccess: (data) => {
      setReplyDraft(data.suggested_reply);
      setRecommendations(data.recommended_actions);
      setTone(data.tone);
    },
    onError: () => {
      setRecommendations([]);
      setTone("supportive");
    }
  });

  const assistanceErrorMessage = resolveErrorMessage(
    assistanceMutation.error,
    "AI reply assistance is currently unavailable."
  );

  const analyzeMutation = useMutation({
    mutationFn: (complaintId: number) => analyzeComplaintDeep(complaintId),
    onSuccess: async (insights) => {
      setInsightsError(null);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              ai_insights: insights,
              sentiment_history: [...(prev.sentiment_history ?? []), insights.sentiment]
            }
          : prev
      );
      addNotification({
        id: `insights-${Date.now()}`,
        title: "Deep analysis ready",
        message: "AI insights generated for the selected complaint.",
        createdAt: new Date().toISOString()
      });
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error) => {
      const message = resolveErrorMessage(error, "Deep AI analysis is currently unavailable.");
      setInsightsError(message);
      addNotification({
        id: `insights-error-${Date.now()}`,
        title: "Deep analysis failed",
        message,
        createdAt: new Date().toISOString()
      });
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: (complaintId: number) => regenerateResolutionTemplate(complaintId),
    onSuccess: (template) => {
      setInsightsError(null);
      setSelected((prev) =>
        prev && prev.ai_insights
          ? { ...prev, ai_insights: { ...prev.ai_insights, resolution_template: template } }
          : prev
      );
      addNotification({
        id: `template-${Date.now()}`,
        title: "Template refreshed",
        message: "Resolution template updated with the latest guidance.",
        createdAt: new Date().toISOString()
      });
    },
    onError: (error) => {
      const message = resolveErrorMessage(error, "Unable to regenerate the resolution template.");
      setInsightsError(message);
      addNotification({
        id: `template-error-${Date.now()}`,
        title: "Template regeneration failed",
        message,
        createdAt: new Date().toISOString()
      });
    }
  });

  const handleAnalyzeInsights = () => {
    if (!selected) {
      setInsightsError("Select a complaint before running deep analysis.");
      return;
    }
    analyzeMutation.mutate(selected.id);
  };

  const handleRegenerateTemplate = () => {
    if (!selected) {
      setInsightsError("Select a complaint before regenerating the template.");
      return;
    }
    if (!selected.ai_insights) {
      setInsightsError("Run a deep analysis before regenerating the template.");
      return;
    }
    regenerateMutation.mutate(selected.id);
  };

  const cards = useMemo(
    () => [
      {
  label: "Total Feedback",
  value: (stats?.total_complaints ?? 0) + (stats?.total_feedback ?? 0),
        icon: Info,
        trend: "Overall volume"
      },
      {
        label: "Complaints",
        value: stats?.total_complaints ?? 0,
        icon: AlertTriangle,
        trend: "Requires follow-up",
        accent: "text-danger"
      },
      {
        label: "Feedback",
        value: stats?.total_feedback ?? 0,
        icon: MessageCircle,
        trend: "General sentiments",
        accent: "text-blue-600"
      },
      {
        label: "Pending",
        value: stats?.pending ?? 0,
        icon: Clock4,
        trend: "Awaiting response",
        accent: "text-warning"
      },
      {
        label: "In Progress",
        value: stats?.in_progress ?? 0,
        icon: Clock4,
        trend: "Being handled",
        accent: "text-blue-500"
      },
      {
        label: "Resolved",
        value: stats?.resolved ?? 0,
        icon: CheckCircle2,
  trend: "Closed feedback",
        accent: "text-success"
      },
      {
        label: "Unclassified",
        value: stats?.unclassified ?? 0,
        icon: Info,
        trend: "Needs AI review",
        accent: "text-purple-600"
      }
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      {user?.role === "admin" && (user.department || user.plant) && (
        <div className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Viewing{" "}
          {user.department ? (
            <><span className="font-semibold">{user.department}</span> department</>
          ) : null}
          {user.department && user.plant ? " | " : ""}
          {user.plant ? (
            <span className="font-semibold">Plant {user.plant}</span>
          ) : null}
          {" feedback only."}
        </div>
      )}

      <div className="grid grid-cols-7 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="glass-card p-6 text-center text-slate-500">Loading feedback...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Recent Feedback</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <button
                    onClick={() => {
                      const newSort = recentSort === "date" ? "priority" : "date";
                      setRecentSort(newSort);
                      localStorage.setItem("feedbackSort", newSort);
                      // Reset to first page when changing sort
                      setRecentPage(1);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recentSort === "date"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {recentSort === "date" ? "Date" : "Priority"}
                  </button>
                </div>
              </div>
              
              <ComplaintTable
                complaints={complaints}
                selectedId={selected?.id}
                onSelect={(item) => {
                  // Navigate to complaint detail page to see Internal Notes tab
                  navigate(`/complaints/${item.id}`);
                }}
                onFilterChange={(value) => setCategoryFilter(value)}
                activeFilter={categoryFilter}
                title={`Recent Feedback (${complaintsData?.meta.total ?? 0})`}
                emptyMessage="No feedback captured yet."
                showKindBadge
                onEdit={(c) => {
                  setEditTarget(c);
                  setEditOpen(true);
                }}
                pagination={{
                  page: complaintsData?.meta.page ?? recentPage,
                  pageSize: complaintsData?.meta.pageSize ?? recentPageSize,
                  total: complaintsData?.meta.total ?? 0,
                  totalPages: complaintsData?.meta.totalPages ?? 0,
                  onPageChange: (page) => setRecentPage(page)
                }}
                loading={isLoading}
              />
              
              {(complaintsData?.meta.total ?? 0) > recentPageSize && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => window.location.href = '/feedback'}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View all feedback →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  <AttachmentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment ? { url: previewAttachment.url, name: previewAttachment.attachment.file_name } : null}
  />
  <EditComplaintModal
    open={editOpen}
    complaint={editTarget}
    onClose={() => setEditOpen(false)}
    onSave={(updates) => {
      if (!editTarget) return;
      updateComplaint(editTarget.id, {
        category: updates.category,
        priority: updates.priority,
        status: updates.status
      })
        .then(() => {
          setEditOpen(false);
          toast.success("Feedback Updated", `Feedback #${editTarget.id} has been updated successfully`);
          void queryClient.invalidateQueries({ queryKey: ["complaints"] });
        })
        .catch((error) => {
          setEditOpen(false);
          toast.error("Update Failed", resolveErrorMessage(error, "Failed to update feedback"));
        });
    }}
  />
    </div>
  );
};

export default DashboardPage;

