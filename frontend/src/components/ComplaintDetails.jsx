var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useEffect, useState } from "react";
import { BadgeCheck, Bot, Clipboard, ClipboardCheck, History, Sparkles, Tag as TagIcon, TimerReset } from "lucide-react";
var ComplaintDetails = function (_a) {
    var _b, _c;
    var complaint = _a.complaint, onClassify = _a.onClassify, classifyLoading = _a.classifyLoading, actions = _a.actions, aiSummary = _a.aiSummary, _d = _a.summaryLoading, summaryLoading = _d === void 0 ? false : _d, _e = _a.summaryError, summaryError = _e === void 0 ? null : _e, _f = _a.attachments, attachments = _f === void 0 ? [] : _f, _g = _a.attachmentsLoading, attachmentsLoading = _g === void 0 ? false : _g, _h = _a.attachmentPreviews, attachmentPreviews = _h === void 0 ? {} : _h, onOpenAttachment = _a.onOpenAttachment, onAnalyzeInsights = _a.onAnalyzeInsights, _j = _a.analyzeLoading, analyzeLoading = _j === void 0 ? false : _j, _k = _a.insightsError, insightsError = _k === void 0 ? null : _k, onRegenerateTemplate = _a.onRegenerateTemplate, _l = _a.regenerateLoading, regenerateLoading = _l === void 0 ? false : _l, onUseTemplate = _a.onUseTemplate;
    if (!complaint) {
        return (<div className="glass-card p-6 text-center text-slate-500">
        Select a complaint to see its details.
      </div>);
    }
    var isFeedback = complaint.kind === "feedback";
    var ticketLabel = isFeedback ? "Feedback" : "Complaint";
    var assignmentSourceLabel = complaint.assignment_source
        ? complaint.assignment_source.startsWith("auto:")
            ? "Auto rule \u00B7 ".concat(complaint.assignment_source.replace("auto:", "").replace(/[-_]/g, " "))
            : complaint.assignment_source.charAt(0).toUpperCase() + complaint.assignment_source.slice(1)
        : "Automated routing pending";
    var assignmentNotes = complaint.assignment_notes || "No assignment notes available.";
    var aiInsights = complaint.ai_insights;
    var sentimentHistory = (_b = complaint.sentiment_history) !== null && _b !== void 0 ? _b : [];
    var formatSize = function (bytes) {
        if (bytes >= 1024 * 1024) {
            return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
        }
        return "".concat((bytes / 1024).toFixed(1), " KB");
    };
    var _m = useState(false), copySuccess = _m[0], setCopySuccess = _m[1];
    useEffect(function () {
        setCopySuccess(false);
    }, [aiInsights === null || aiInsights === void 0 ? void 0 : aiInsights.resolution_template]);
    var handleCopyTemplate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(aiInsights === null || aiInsights === void 0 ? void 0 : aiInsights.resolution_template))
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(aiInsights.resolution_template)];
                case 2:
                    _b.sent();
                    setCopySuccess(true);
                    setTimeout(function () { return setCopySuccess(false); }, 2500);
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    setCopySuccess(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleUseTemplate = function () {
        if (!(aiInsights === null || aiInsights === void 0 ? void 0 : aiInsights.resolution_template) || !onUseTemplate)
            return;
        onUseTemplate(aiInsights.resolution_template);
    };
    return (<div className="glass-card p-6 space-y-4">
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
          {complaint.ai_confidence !== undefined && (<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
              <Bot className="w-4 h-4"/>
              AI {Math.round(complaint.ai_confidence * 100)}%
            </span>)}
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success font-semibold">
            <BadgeCheck className="w-4 h-4"/>
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
        {attachmentsLoading ? (<p className="text-xs text-slate-500">Loading attachments...</p>) : attachments.length === 0 ? (<p className="text-xs text-slate-500">No attachments uploaded.</p>) : (<div className="space-y-3">
            {attachments.map(function (attachment) {
                var _a;
                var previewUrl = attachmentPreviews[attachment.id];
                var isImage = attachment.file_type.startsWith("image/");
                var fallbackLabel = ((_a = attachment.file_type.split("/").pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || "FILE";
                return (<div key={attachment.id} className="flex gap-3 items-start">
                  {isImage && previewUrl ? (<img src={previewUrl} alt={attachment.file_name} className="h-16 w-16 rounded-lg object-cover border border-slate-200 bg-white"/>) : (<div className="h-16 w-16 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      {fallbackLabel}
                    </div>)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{attachment.file_name}</p>
                    <p className="text-xs text-slate-500">
                      {attachment.file_type} · {formatSize(attachment.file_size)}
                    </p>
                    {onOpenAttachment && (<button onClick={function () { return void onOpenAttachment(attachment); }} className="mt-1 text-xs font-semibold text-primary hover:underline">
                        View
                      </button>)}
                  </div>
                </div>);
            })}
          </div>)}
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">AI Summary</p>
        {summaryLoading ? (<p className="text-xs text-slate-500">Summarising...</p>) : summaryError ? (<p className="text-xs text-danger">{summaryError}</p>) : aiSummary ? (<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-800">
              {aiSummary.category} · p={aiSummary.probability.toFixed(2)}
            </div>
            <p className="whitespace-pre-wrap">{aiSummary.summary}</p>
          </div>) : (<p className="text-xs text-slate-500">No AI summary available.</p>)}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase text-slate-400">AI Deep Insights</p>
          <div className="flex items-center gap-2">
            {onRegenerateTemplate && (<button onClick={onRegenerateTemplate} disabled={!aiInsights || regenerateLoading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                <TimerReset className="w-3 h-3"/>
                {regenerateLoading ? "Regenerating..." : "Regenerate Template"}
              </button>)}
            {onAnalyzeInsights && (<button onClick={onAnalyzeInsights} disabled={analyzeLoading} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                <Sparkles className="w-3 h-3"/>
                {analyzeLoading ? "Analyzing..." : "Deep Analyze"}
              </button>)}
          </div>
        </div>
        {analyzeLoading ? (<p className="text-xs text-slate-500">Running enhanced analysis...</p>) : insightsError ? (<p className="text-xs text-danger">{insightsError}</p>) : aiInsights ? (<div className="space-y-3">
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
                {aiInsights.estimated_resolution_time ? (<p className="text-xs text-slate-500">
                    Estimated resolution time: {aiInsights.estimated_resolution_time}h
                  </p>) : null}
                {aiInsights.tags.length > 0 ? (<div className="flex flex-wrap gap-2">
                    {aiInsights.tags.map(function (tag) { return (<span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <TagIcon className="w-3 h-3"/>
                        {tag}
                      </span>); })}
                  </div>) : null}
              </div>
            </div>

            {aiInsights.resolution_template ? (<div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase text-indigo-500 font-semibold">
                    Recommended Resolution Template
                  </p>
                  <div className="flex items-center gap-2">
                    {onUseTemplate ? (<button onClick={handleUseTemplate} className="inline-flex items-center gap-1 rounded border border-indigo-200 px-2 py-0.5 text-[11px] text-indigo-600 hover:bg-indigo-100">
                        Use in reply
                      </button>) : null}
                    <button onClick={handleCopyTemplate} className="inline-flex items-center gap-1 rounded border border-indigo-200 px-2 py-0.5 text-[11px] text-indigo-600 hover:bg-indigo-100">
                      {copySuccess ? (<>
                          <ClipboardCheck className="w-3 h-3"/>
                          Copied
                        </>) : (<>
                          <Clipboard className="w-3 h-3"/>
                          Copy
                        </>)}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans">{aiInsights.resolution_template}</pre>
              </div>) : null}

            {aiInsights.similar_complaints.length > 0 ? (<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
                <p className="text-[11px] uppercase text-slate-400">Similar Complaints</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {aiInsights.similar_complaints.map(function (item) { return (<div key={item.complaint_id} className="rounded border border-slate-200 bg-white p-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-800">
                        #{item.complaint_id} · Similarity {(item.similarity_score * 100).toFixed(0)}%
                      </p>
                      {item.resolution_summary ? (<p className="text-xs text-slate-600 whitespace-pre-wrap">
                          {item.resolution_summary}
                        </p>) : null}
                      {item.matched_keywords.length > 0 ? (<p className="text-[11px] text-slate-500">
                          Keywords: {item.matched_keywords.join(", ")}
                        </p>) : null}
                    </div>); })}
                </div>
              </div>) : null}
          </div>) : (<p className="text-xs text-slate-500">
            Deep AI insights not available yet. Run a deep analysis to generate them.
          </p>)}
      </section>

      <section className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase">Type</p>
          <p className="font-medium capitalize">{complaint.kind}</p>
          {complaint.kind_confidence !== undefined && (<p className="text-xs text-slate-500">
              AI {Math.round(complaint.kind_confidence * 100)}% sure
            </p>)}
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Category</p>
          <p className="font-medium">{complaint.category}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Plant</p>
          <p className="font-medium">{(_c = complaint.plant) !== null && _c !== void 0 ? _c : "Unassigned"}</p>
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
            {complaint.assigned_to ? "User #".concat(complaint.assigned_to) : "Not assigned"}
          </p>
          <p className="text-xs text-slate-500">{assignmentSourceLabel}</p>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase text-slate-400">Assignment Notes</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignmentNotes}</p>
      </section>

      {sentimentHistory.length > 0 ? (<section className="space-y-2">
          <p className="text-xs uppercase text-slate-400">Sentiment History</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-48 overflow-y-auto">
            {sentimentHistory.map(function (entry, index) { return (<div key={"".concat(entry.sentiment, "-").concat(index)} className="flex items-start gap-2 text-xs text-slate-600">
                <History className="w-3 h-3 mt-0.5 text-slate-400"/>
                <div>
                  <p className="font-semibold text-slate-700 capitalize">
                    {entry.sentiment} · {entry.emotion}
                  </p>
                  <p className="text-slate-500 whitespace-pre-wrap">{entry.reasoning}</p>
                  <p className="text-[10px] text-slate-400">
                    Urgency {entry.urgency_score}/100 · Confidence {(entry.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>); })}
          </div>
        </section>) : null}

      <div className="flex flex-wrap gap-2">
        {onClassify && (<button onClick={onClassify} disabled={classifyLoading} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
            {classifyLoading ? "Classifying..." : "Run AI Classification"}
          </button>)}
        {actions}
      </div>
    </div>);
};
export default ComplaintDetails;
