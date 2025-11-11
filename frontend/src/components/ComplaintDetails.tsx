import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  Clipboard,
  ClipboardCheck,
  History,
  Sparkles,
  Tag as TagIcon,
  TimerReset
} from "lucide-react";

import type {
  AIInsights,
  Attachment,
  Complaint,
  ComplaintSummary,
  SentimentSnapshot
} from "../types";

interface ComplaintDetailsProps {
  complaint?: Complaint | null;
  onClassify?: () => void;
  classifyLoading?: boolean;
  actions?: ReactNode;
  aiSummary?: ComplaintSummary | null;
  summaryLoading?: boolean;
  summaryError?: string | null;
  attachments?: Attachment[];
  attachmentsLoading?: boolean;
  attachmentPreviews?: Record<number, string>;
  onOpenAttachment?: (attachment: Attachment) => void;
  onAnalyzeInsights?: () => void;
  analyzeLoading?: boolean;
  insightsError?: string | null;
  onRegenerateTemplate?: () => void;
  regenerateLoading?: boolean;
  onUseTemplate?: (template: string) => void;
}

const ComplaintDetails = ({
  complaint,
  onClassify,
  classifyLoading,
  actions,
  aiSummary,
  summaryLoading = false,
  summaryError = null,
  attachments = [],
  attachmentsLoading = false,
  attachmentPreviews = {},
  onOpenAttachment,
  onAnalyzeInsights,
  analyzeLoading = false,
  insightsError = null,
  onRegenerateTemplate,
  regenerateLoading = false,
  onUseTemplate
}: ComplaintDetailsProps) => {
  if (!complaint) {
    return (
      <div className="glass-card p-6 text-center text-slate-500">
        Select a complaint to see its details.
      </div>
    );
  }

  const isFeedback = complaint.kind === "feedback";
  const ticketLabel = isFeedback ? "Feedback" : "Complaint";
  const assignmentSourceLabel = complaint.assignment_source
    ? complaint.assignment_source.startsWith("auto:")
      ? `Auto rule · ${complaint.assignment_source.replace("auto:", "").replace(/[-_]/g, " ")}`
      : complaint.assignment_source.charAt(0).toUpperCase() + complaint.assignment_source.slice(1)
    : "Automated routing pending";
  const assignmentNotes = complaint.assignment_notes || "No assignment notes available.";
  const aiInsights: AIInsights | null | undefined = complaint.ai_insights;
  const sentimentHistory: SentimentSnapshot[] = complaint.sentiment_history ?? [];
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setCopySuccess(false);
  }, [aiInsights?.resolution_template]);

  const handleCopyTemplate = async () => {
    if (!aiInsights?.resolution_template) return;
    try {
      await navigator.clipboard.writeText(aiInsights.resolution_template);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setCopySuccess(false);
    }
  };

  const handleUseTemplate = () => {
    if (!aiInsights?.resolution_template || !onUseTemplate) return;
    onUseTemplate(aiInsights.resolution_template);
  };


  return (
    <div className="glass-card p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">Ticket</p>
          <h2 className="text-2xl font-semibold">#{complaint.id}</h2>
          <p className="text-sm text-slate-500">{complaint.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/60 px-3 py-1 text-xs text-slate-600 font-semibold uppercase tracking-wide">
            {ticketLabel}
          </span>
          {complaint.ai_confidence !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
              <Bot className="w-4 h-4" />
              AI {Math.round(complaint.ai_confidence * 100)}%
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success font-semibold">
            <BadgeCheck className="w-4 h-4" />
            {complaint.status}
          </span>
        </div>
      </header>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">{ticketLabel}</p>
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{complaint.complaint_text}</p>
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">Attachments</p>
        {attachmentsLoading ? (
          <p className="text-xs text-slate-500">Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p className="text-xs text-slate-500">No attachments uploaded.</p>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => {
              const previewUrl = attachmentPreviews[attachment.id];
              const isImage = attachment.file_type.startsWith("image/");
              const fallbackLabel =
                attachment.file_type.split("/").pop()?.toUpperCase() || "FILE";
              return (
                <div key={attachment.id} className="flex gap-3 items-start">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={attachment.file_name}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      {fallbackLabel}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{attachment.file_name}</p>
                    <p className="text-xs text-slate-500">
                      {attachment.file_type} · {formatSize(attachment.file_size)}
                    </p>
                    {onOpenAttachment && (
                      <button
                        onClick={() => void onOpenAttachment(attachment)}
                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">AI Summary</p>
        {summaryLoading ? (
          <p className="text-xs text-slate-500">Summarising...</p>
        ) : summaryError ? (
          <p className="text-xs text-danger">{summaryError}</p>
        ) : aiSummary ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-800">
              {aiSummary.category} · p={aiSummary.probability.toFixed(2)}
            </div>
            <p className="whitespace-pre-wrap">{aiSummary.summary}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No AI summary available.</p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase text-slate-400">AI Deep Insights</p>
          <div className="flex items-center gap-2">
            {onRegenerateTemplate && (
              <button
                onClick={onRegenerateTemplate}
                disabled={!aiInsights || regenerateLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <TimerReset className="w-3 h-3" />
                {regenerateLoading ? "Regenerating..." : "Regenerate Template"}
              </button>
            )}
            {onAnalyzeInsights && (
              <button
                onClick={onAnalyzeInsights}
                disabled={analyzeLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {analyzeLoading ? "Analyzing..." : "Deep Analyze"}
              </button>
            )}
          </div>
        </div>
        {analyzeLoading ? (
          <p className="text-xs text-slate-500">Running enhanced analysis...</p>
        ) : insightsError ? (
          <p className="text-xs text-danger">{insightsError}</p>
        ) : aiInsights ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <p className="text-[11px] uppercase text-slate-400">Sentiment</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {aiInsights.sentiment.sentiment}
                </p>
                <p className="text-xs text-slate-600">
                  Emotion: {aiInsights.sentiment.emotion} · Urgency {aiInsights.sentiment.urgency_score}/100
                </p>
                <p className="text-xs text-slate-500 whitespace-pre-wrap">
                  {aiInsights.sentiment.reasoning}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <p className="text-[11px] uppercase text-slate-400">AI Recommendations</p>
                <p className="font-medium text-slate-700">
                  Suggested Category: <span className="font-semibold">{aiInsights.suggested_category}</span>
                </p>
                <p className="font-medium text-slate-700">
                  Suggested Priority: <span className="capitalize font-semibold">{aiInsights.suggested_priority}</span>
                </p>
                {aiInsights.estimated_resolution_time ? (
                  <p className="text-xs text-slate-500">
                    Estimated resolution time: {aiInsights.estimated_resolution_time}h
                  </p>
                ) : null}
                {aiInsights.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {aiInsights.resolution_template ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase text-indigo-500 font-semibold">
                    Recommended Resolution Template
                  </p>
                  <div className="flex items-center gap-2">
                    {onUseTemplate ? (
                      <button
                        onClick={handleUseTemplate}
                        className="inline-flex items-center gap-1 rounded border border-indigo-200 px-2 py-0.5 text-[11px] text-indigo-600 hover:bg-indigo-100"
                      >
                        Use in reply
                      </button>
                    ) : null}
                    <button
                      onClick={handleCopyTemplate}
                      className="inline-flex items-center gap-1 rounded border border-indigo-200 px-2 py-0.5 text-[11px] text-indigo-600 hover:bg-indigo-100"
                    >
                      {copySuccess ? (
                        <>
                          <ClipboardCheck className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans">{aiInsights.resolution_template}</pre>
              </div>
            ) : null}

            {aiInsights.similar_complaints.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
                <p className="text-[11px] uppercase text-slate-400">Similar Complaints</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {aiInsights.similar_complaints.map((item) => (
                    <div key={item.complaint_id} className="rounded border border-slate-200 bg-white p-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-800">
                        #{item.complaint_id} · Similarity {(item.similarity_score * 100).toFixed(0)}%
                      </p>
                      {item.resolution_summary ? (
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">
                          {item.resolution_summary}
                        </p>
                      ) : null}
                      {item.matched_keywords.length > 0 ? (
                        <p className="text-[11px] text-slate-500">
                          Keywords: {item.matched_keywords.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Deep AI insights not available yet. Run a deep analysis to generate them.
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase">Type</p>
          <p className="font-medium capitalize">{complaint.kind}</p>
          {complaint.kind_confidence !== undefined && (
            <p className="text-xs text-slate-500">
              AI {Math.round(complaint.kind_confidence * 100)}% sure
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Category</p>
          <p className="font-medium">{complaint.category}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Plant</p>
          <p className="font-medium">{complaint.plant ?? "Unassigned"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Priority</p>
          <p className="font-medium capitalize">{complaint.priority}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Created</p>
          <p>{new Date(complaint.created_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Updated</p>
          <p>{new Date(complaint.updated_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Assigned To</p>
          <p className="font-medium">
            {complaint.assigned_to ? `User #${complaint.assigned_to}` : "Not assigned"}
          </p>
          <p className="text-xs text-slate-500">{assignmentSourceLabel}</p>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">Assignment Notes</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignmentNotes}</p>
      </section>

      {sentimentHistory.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs uppercase text-slate-400">Sentiment History</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-48 overflow-y-auto">
            {sentimentHistory.map((entry, index) => (
              <div key={`${entry.sentiment}-${index}`} className="flex items-start gap-2 text-xs text-slate-600">
                <History className="w-3 h-3 mt-0.5 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-700 capitalize">
                    {entry.sentiment} · {entry.emotion}
                  </p>
                  <p className="text-slate-500 whitespace-pre-wrap">{entry.reasoning}</p>
                  <p className="text-[10px] text-slate-400">
                    Urgency {entry.urgency_score}/100 · Confidence {(entry.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onClassify && (
          <button
            onClick={onClassify}
            disabled={classifyLoading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {classifyLoading ? "Classifying..." : "Run AI Classification"}
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};

export default ComplaintDetails;
