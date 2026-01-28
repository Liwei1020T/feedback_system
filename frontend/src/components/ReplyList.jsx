var ReplyList = function (_a) {
    var replies = _a.replies, _b = _a.attachments, attachments = _b === void 0 ? [] : _b, _c = _a.attachmentPreviews, attachmentPreviews = _c === void 0 ? {} : _c, onViewAttachment = _a.onViewAttachment;
    return (<div className="space-y-3">
    {replies.length === 0 && <p className="text-sm text-slate-500">No replies yet.</p>}
    {replies.map(function (reply) { return (<div key={reply.id} className="rounded-lg border border-slate-100 p-3 space-y-2">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{reply.reply_text}</p>
        {attachments
                .filter(function (attachment) { return attachment.reply_id === reply.id; })
                .map(function (attachment) {
                var _a;
                var preview = attachmentPreviews[attachment.id];
                var isImage = attachment.file_type.startsWith("image/");
                var fallbackLabel = ((_a = attachment.file_type.split("/").pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || "FILE";
                return (<div key={attachment.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                {isImage && preview ? (<img src={preview} alt={attachment.file_name} className="h-12 w-12 rounded-md object-cover border border-slate-200 bg-white"/>) : (<div className="h-12 w-12 flex items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                    {fallbackLabel}
                  </div>)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-[11px] text-slate-500">{attachment.file_type}</p>
                  {onViewAttachment && (<button onClick={function () { return onViewAttachment(attachment); }} className="mt-1 text-[11px] font-semibold text-primary hover:underline">
                      View
                    </button>)}
                </div>
              </div>);
            })}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Admin #{reply.admin_id}</span>
          <span>{new Date(reply.created_at).toLocaleString()}</span>
        </div>
      </div>); })}
  </div>);
};
export default ReplyList;
