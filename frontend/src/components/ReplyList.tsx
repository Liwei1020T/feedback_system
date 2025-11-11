import type { Attachment, Reply } from "../types";

interface ReplyListProps {
  replies: Reply[];
  attachments?: Attachment[];
  attachmentPreviews?: Record<number, string>;
  onViewAttachment?: (attachment: Attachment) => void;
}

const ReplyList = ({
  replies,
  attachments = [],
  attachmentPreviews = {},
  onViewAttachment
}: ReplyListProps) => (
  <div className="space-y-3">
    {replies.length === 0 && <p className="text-sm text-slate-500">No replies yet.</p>}
    {replies.map((reply) => (
      <div key={reply.id} className="rounded-lg border border-slate-100 p-3 space-y-2">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{reply.reply_text}</p>
        {attachments
          .filter((attachment) => attachment.reply_id === reply.id)
          .map((attachment) => {
            const preview = attachmentPreviews[attachment.id];
            const isImage = attachment.file_type.startsWith("image/");
            const fallbackLabel =
              attachment.file_type.split("/").pop()?.toUpperCase() || "FILE";
            return (
              <div key={attachment.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                {isImage && preview ? (
                  <img
                    src={preview}
                    alt={attachment.file_name}
                    className="h-12 w-12 rounded-md object-cover border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                    {fallbackLabel}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-[11px] text-slate-500">{attachment.file_type}</p>
                  {onViewAttachment && (
                    <button
                      onClick={() => onViewAttachment(attachment)}
                      className="mt-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Admin #{reply.admin_id}</span>
          <span>{new Date(reply.created_at).toLocaleString()}</span>
        </div>
      </div>
    ))}
  </div>
);

export default ReplyList;
