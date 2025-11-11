import { Clock, MessageCircle, Edit3, CheckCircle2, AlertCircle, UserPlus, Flag, StickyNote } from "lucide-react";
import type { Complaint, Reply } from "../types";

export interface TimelineEvent {
  id: string;
  type: "created" | "status_change" | "reply" | "edit" | "assignment" | "escalation" | "resolved" | "note";
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, string>;
}

interface ActivityTimelineProps {
  complaint: Complaint;
  replies?: Reply[];
  events?: TimelineEvent[];
}

const ActivityTimeline = ({ complaint, replies = [], events = [] }: ActivityTimelineProps) => {
  // Build timeline from complaint data and replies
  const timeline: TimelineEvent[] = [];

  // Created event
  timeline.push({
    id: `created-${complaint.id}`,
    type: "created",
    title: "Ticket Created",
    description: `${complaint.kind === "complaint" ? "Complaint" : "Feedback"} submitted by ${complaint.email}`,
    timestamp: complaint.created_at
  });

  // Assignment event
  if (complaint.assigned_to) {
    const assignmentTime = complaint.updated_at; // Could be improved with dedicated timestamp
    timeline.push({
      id: `assigned-${complaint.id}`,
      type: "assignment",
      title: "Assigned",
      description: complaint.assignment_notes || `Assigned to admin #${complaint.assigned_to}`,
      timestamp: assignmentTime,
      metadata: {
        source: complaint.assignment_source || "manual"
      }
    });
  }

  // Escalation event
  if (complaint.escalated_to && complaint.escalated_at) {
    timeline.push({
      id: `escalated-${complaint.id}`,
      type: "escalation",
      title: "Escalated",
      description: complaint.escalation_reason || `Escalated to admin #${complaint.escalated_to}`,
      timestamp: complaint.escalated_at
    });
  }

  // Internal note events
  if (complaint.internal_notes && complaint.internal_notes.length > 0) {
    complaint.internal_notes.forEach((note) => {
      const preview =
        note.content.length > 160 ? `${note.content.slice(0, 160).trim()}…` : note.content;
      const metadata: Record<string, string> = {};
      if (note.is_pinned) {
        metadata.pinned = "Yes";
      }
      if (note.attachments && note.attachments.length > 0) {
        metadata.attachments = `${note.attachments.length} attachment${note.attachments.length > 1 ? "s" : ""}`;
      }
      timeline.push({
        id: `note-${note.id}`,
        type: "note",
        title: "Internal Note Added",
        description: preview,
        timestamp: note.created_at,
        user: note.author_name,
        metadata: Object.keys(metadata).length ? metadata : undefined
      });
    });
  }

  // Reply events
  replies.forEach((reply) => {
    timeline.push({
      id: `reply-${reply.id}`,
      type: "reply",
      title: "Admin Reply",
      description: reply.reply_text.substring(0, 100) + (reply.reply_text.length > 100 ? "..." : ""),
      timestamp: reply.created_at,
      user: `Admin #${reply.admin_id}`,
      metadata: {
        email_sent: reply.email_sent ? "Yes" : "No"
      }
    });
  });

  // Status change events (if status is not Pending)
  if (complaint.status === "In Progress") {
    timeline.push({
      id: `status-progress-${complaint.id}`,
      type: "status_change",
      title: "Status Changed",
      description: "Ticket marked as In Progress",
      timestamp: complaint.updated_at
    });
  }

  // Resolved event
  if (complaint.status === "Resolved" && complaint.resolved_at) {
    timeline.push({
      id: `resolved-${complaint.id}`,
      type: "resolved",
      title: "Resolved",
      description: `Resolution time: ${complaint.resolution_time_hours ? `${complaint.resolution_time_hours.toFixed(1)} hours` : "N/A"}`,
      timestamp: complaint.resolved_at
    });
  }

  // Add custom events
  events.forEach((event) => timeline.push(event));

  // Sort by timestamp (newest first)
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return <AlertCircle className="w-5 h-5" />;
      case "status_change":
        return <Edit3 className="w-5 h-5" />;
      case "reply":
        return <MessageCircle className="w-5 h-5" />;
      case "assignment":
        return <UserPlus className="w-5 h-5" />;
      case "escalation":
        return <Flag className="w-5 h-5" />;
      case "resolved":
        return <CheckCircle2 className="w-5 h-5" />;
      case "note":
        return <StickyNote className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "bg-blue-100 text-blue-600 border-blue-300";
      case "status_change":
        return "bg-purple-100 text-purple-600 border-purple-300";
      case "reply":
        return "bg-green-100 text-green-600 border-green-300";
      case "assignment":
        return "bg-indigo-100 text-indigo-600 border-indigo-300";
      case "escalation":
        return "bg-orange-100 text-orange-600 border-orange-300";
      case "resolved":
        return "bg-emerald-100 text-emerald-600 border-emerald-300";
      case "note":
        return "bg-amber-100 text-amber-600 border-amber-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        Activity Timeline
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />

        <div className="space-y-6">
          {timeline.map((event, index) => (
            <div key={event.id} className="relative pl-16 animate-slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Icon */}
              <div className={`absolute left-0 w-12 h-12 rounded-xl border-2 ${getColor(event.type)} flex items-center justify-center shadow-lg`}>
                {getIcon(event.type)}
              </div>

              {/* Content */}
              <div className="bg-white rounded-xl border-2 border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-bold text-slate-800">{event.title}</h4>
                  <time className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </time>
                </div>

                {event.description && (
                  <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                )}

                {event.user && (
                  <p className="text-xs text-slate-500 font-medium">
                    By: {event.user}
                  </p>
                )}

                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600"
                      >
                        <span className="font-bold capitalize">{key.replace(/_/g, " ")}:</span>
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {timeline.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
