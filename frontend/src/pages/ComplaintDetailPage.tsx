import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, FileText, StickyNote, MessageSquare, Clock, ArrowLeft } from "lucide-react";

import {
  analyzeComplaintDeep,
  classifyComplaint,
  createReply,
  getComplaint,
  getComplaintAttachments,
  getComplaintSummary,
  downloadAttachment,
  listReplies,
  regenerateResolutionTemplate,
  uploadAttachment
} from "../api";
import ComplaintDetails from "../components/ComplaintDetails";
import ReplyForm from "../components/ReplyForm";
import ReplyList from "../components/ReplyList";
import FileUpload from "../components/FileUpload";
import InternalNotesPanel from "../components/InternalNotesPanel";
import ActivityTimeline from "../components/ActivityTimeline";
import { useAuth } from "../hooks/useAuth";
import { useToastStore } from "../store/toast";
import type { Attachment } from "../types";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const ComplaintDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToastStore();

  const complaintId = Number(id);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "replies" | "timeline">("details");
  const [replyDraft, setReplyDraft] = useState("");

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: () => getComplaint(complaintId),
    enabled: !!complaintId
  });

  const { data: repliesData } = useQuery({
    queryKey: ["replies", complaintId],
    queryFn: () => listReplies(complaintId),
    enabled: !!complaintId
  });

  const {
    data: aiSummary,
    isFetching: summaryLoading,
    error: summaryError
  } = useQuery({
    queryKey: ["complaint-summary", complaintId],
    queryFn: () => getComplaintSummary(complaintId),
    enabled: !!complaintId,
    retry: false
  });

  const {
    data: attachments = [],
    isFetching: attachmentsLoading
  } = useQuery({
    queryKey: ["complaint-attachments", complaintId],
    queryFn: () => getComplaintAttachments(complaintId),
    enabled: !!complaintId
  });

  const summaryErrorMessage = summaryError
    ? resolveErrorMessage(summaryError, "Unable to generate AI summary right now.")
    : null;

  const handleUseTemplateInReply = (template: string) => {
    setReplyDraft((prev) => (prev.length > 0 ? `${prev}\n\n${template}` : template));
    setActiveTab("replies");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const replies = repliesData?.items || [];

  const classifyMutation = useMutation({
    mutationFn: () => classifyComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: (data: { text: string; sendEmail: boolean; attachment?: File | null }) =>
      createReply(
        {
          complaint_id: complaintId,
          admin_id: user?.id ?? 0,
          reply_text: data.text,
          send_email: data.sendEmail
        },
        data.attachment ?? null
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["replies", complaintId] }),
        queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] }),
        queryClient.invalidateQueries({ queryKey: ["complaint-attachments", complaintId] })
      ]);
      toast.success("Ticket Updated", `Ticket #${complaintId} has been updated successfully`);
    },
    onError: (error) => {
      toast.error("Reply Failed", resolveErrorMessage(error, "Unable to send reply. Please try again."));
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(complaintId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaint-attachments", complaintId] });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeComplaintDeep(complaintId),
    onSuccess: async () => {
      setInsightsError(null);
      await queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      await queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] });
    },
    onError: (error) => {
      setInsightsError(resolveErrorMessage(error, "Deep AI analysis is currently unavailable."));
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateResolutionTemplate(complaintId),
    onSuccess: async () => {
      setInsightsError(null);
      await queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      await queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] });
    },
    onError: (error) => {
      setInsightsError(
        resolveErrorMessage(error, "Unable to regenerate the resolution template right now.")
      );
    }
  });

  const handleAnalyzeInsights = () => {
    analyzeMutation.mutate();
  };

  const handleOpenAttachment = async (attachment: Attachment) => {
    try {
      const file = await downloadAttachment(attachment.id);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name || `attachment-${attachment.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to open attachment", error);
    }
  };

  const handleRegenerateTemplate = () => {
    if (!complaint?.ai_insights) {
      setInsightsError("Run a deep analysis before regenerating the template.");
      return;
    }
    regenerateMutation.mutate();
  };

  if (isLoading) {
    return <div className="glass-card p-6 text-center text-slate-500">Loading complaint...</div>;
  }

  if (!complaint) {
    return <div className="glass-card p-6 text-center text-danger">Complaint not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Details & Attachments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "notes"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                <span>Internal Notes</span>
                {complaint?.internal_notes && complaint.internal_notes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {complaint.internal_notes.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("replies")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "replies"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Replies</span>
                {replies.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    {replies.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Activity Timeline</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaint Details - Left Side */}
          <div className="lg:col-span-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Complaint Details
                </h3>
                <p className="text-indigo-100 text-sm mt-1">Complete information about this complaint</p>
              </div>

              {/* Details Content */}
              <div className="p-6">
                <ComplaintDetails
                  complaint={complaint}
                  onClassify={() => classifyMutation.mutate()}
                  classifyLoading={classifyMutation.isPending}
                  aiSummary={aiSummary ?? null}
                  summaryLoading={summaryLoading}
                  summaryError={summaryErrorMessage}
                  attachments={attachments}
                  attachmentsLoading={attachmentsLoading}
                  onOpenAttachment={handleOpenAttachment}
                  onUseTemplate={handleUseTemplateInReply}
                  onAnalyzeInsights={handleAnalyzeInsights}
                  analyzeLoading={analyzeMutation.isPending}
                  insightsError={insightsError}
                  onRegenerateTemplate={handleRegenerateTemplate}
                  regenerateLoading={regenerateMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Attachments - Right Side */}
          <div className="lg:col-span-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-orange-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  {attachments.length > 0
                    ? `${attachments.length} ${attachments.length === 1 ? 'file' : 'files'} attached`
                    : 'Upload supporting files'}
                </p>
              </div>

              {/* Attachments Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upload New File
                  </label>
                  <FileUpload
                    onUpload={async (file) => {
                      await uploadMutation.mutateAsync(file);
                    }}
                    disabled={uploadMutation.isPending}
                  />
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Uploaded Files
                    </label>
                    <ul className="space-y-2">
                      {attachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="flex items-center justify-between gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="text-sm font-medium text-orange-900">{attachment.file_name}</p>
                              <p className="text-xs text-orange-700">{attachment.file_type} · {formatFileSize(attachment.file_size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => void handleOpenAttachment(attachment)}
                            className="text-xs font-semibold text-orange-700 hover:underline"
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 font-medium">No files attached</p>
                    <p className="text-xs text-slate-500 mt-1">Upload files using the form above</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 px-5 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Internal Notes
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {complaint?.internal_notes && complaint.internal_notes.length > 0
                ? `${complaint.internal_notes.length} ${complaint.internal_notes.length === 1 ? 'note' : 'notes'} for team collaboration`
                : 'Add private notes for your team'}
            </p>
          </div>

          {/* Notes Content */}
          <div className="p-6">
            <InternalNotesPanel
              complaintId={complaintId}
              currentUserId={user?.id}
              isWatching={complaint?.watchers?.includes(user?.id || 0)}
            />
          </div>
        </div>
      )}

      {activeTab === "replies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reply Form - Left Side (Larger) */}
          <div className="lg:order-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Add Reply
                </h3>
                <p className="text-blue-100 text-sm mt-1">Compose your response to the employee</p>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <ReplyForm
                  onSubmit={async (data) => {
                    await replyMutation.mutateAsync(data);
                    setReplyDraft("");
                  }}
                  loading={replyMutation.isPending}
                  text={replyDraft}
                  onTextChange={setReplyDraft}
                />
              </div>
            </div>
          </div>

          {/* Replies List - Right Side */}
          <div className="lg:order-2">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Replies to Employee
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'} sent` : 'No replies yet'}
                </p>
              </div>

              {/* Replies Content */}
              <div className="p-5 max-h-[600px] overflow-y-auto">
                {replies.length > 0 ? (
                  <ReplyList replies={replies} />
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No replies yet</p>
                    <p className="text-slate-500 text-sm mt-1">Your response will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-5 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Timeline
            </h3>
            <p className="text-cyan-100 text-sm mt-1">Complete history of all actions and updates</p>
          </div>

          {/* Timeline Content */}
          <div className="p-6">
            <ActivityTimeline complaint={complaint} replies={replies} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailPage;
