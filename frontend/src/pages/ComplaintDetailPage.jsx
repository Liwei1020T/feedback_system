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
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, FileText, StickyNote, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { analyzeComplaintDeep, classifyComplaint, createReply, getComplaint, getComplaintAttachments, getComplaintSummary, downloadAttachment, listReplies, regenerateResolutionTemplate, uploadAttachment } from "../api";
import ComplaintDetails from "../components/ComplaintDetails";
import ReplyForm from "../components/ReplyForm";
import ReplyList from "../components/ReplyList";
import FileUpload from "../components/FileUpload";
import InternalNotesPanel from "../components/InternalNotesPanel";
import ActivityTimeline from "../components/ActivityTimeline";
import { useAuth } from "../hooks/useAuth";
import { useToastStore } from "../store/toast";
var resolveErrorMessage = function (error, fallback) {
    if (error && typeof error === "object" && "message" in error) {
        var message = error.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }
    return fallback;
};
var ComplaintDetailPage = function () {
    var _a;
    var id = useParams().id;
    var navigate = useNavigate();
    var queryClient = useQueryClient();
    var user = useAuth().user;
    var toast = useToastStore();
    var complaintId = Number(id);
    var _b = useState(null), insightsError = _b[0], setInsightsError = _b[1];
    var _c = useState("details"), activeTab = _c[0], setActiveTab = _c[1];
    var _d = useState(""), replyDraft = _d[0], setReplyDraft = _d[1];
    var _e = useQuery({
        queryKey: ["complaint", complaintId],
        queryFn: function () { return getComplaint(complaintId); },
        enabled: !!complaintId
    }), complaint = _e.data, isLoading = _e.isLoading;
    var repliesData = useQuery({
        queryKey: ["replies", complaintId],
        queryFn: function () { return listReplies(complaintId); },
        enabled: !!complaintId
    }).data;
    var _f = useQuery({
        queryKey: ["complaint-summary", complaintId],
        queryFn: function () { return getComplaintSummary(complaintId); },
        enabled: !!complaintId,
        retry: false
    }), aiSummary = _f.data, summaryLoading = _f.isFetching, summaryError = _f.error;
    var _g = useQuery({
        queryKey: ["complaint-attachments", complaintId],
        queryFn: function () { return getComplaintAttachments(complaintId); },
        enabled: !!complaintId
    }), _h = _g.data, attachments = _h === void 0 ? [] : _h, attachmentsLoading = _g.isFetching;
    var summaryErrorMessage = summaryError
        ? resolveErrorMessage(summaryError, "Unable to generate AI summary right now.")
        : null;
    var handleUseTemplateInReply = function (template) {
        setReplyDraft(function (prev) { return (prev.length > 0 ? "".concat(prev, "\n\n").concat(template) : template); });
        setActiveTab("replies");
    };
    var formatFileSize = function (bytes) {
        if (bytes >= 1024 * 1024) {
            return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
        }
        if (bytes >= 1024) {
            return "".concat((bytes / 1024).toFixed(1), " KB");
        }
        return "".concat(bytes, " B");
    };
    var replies = (repliesData === null || repliesData === void 0 ? void 0 : repliesData.items) || [];
    var classifyMutation = useMutation({
        mutationFn: function () { return classifyComplaint(complaintId); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
            queryClient.invalidateQueries({ queryKey: ["complaints"] });
            queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] });
        }
    });
    var replyMutation = useMutation({
        mutationFn: function (data) {
            var _a, _b;
            return createReply({
                complaint_id: complaintId,
                admin_id: (_a = user === null || user === void 0 ? void 0 : user.id) !== null && _a !== void 0 ? _a : 0,
                reply_text: data.text,
                send_email: data.sendEmail
            }, (_b = data.attachment) !== null && _b !== void 0 ? _b : null);
        },
        onSuccess: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            queryClient.invalidateQueries({ queryKey: ["replies", complaintId] }),
                            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] }),
                            queryClient.invalidateQueries({ queryKey: ["complaint-attachments", complaintId] })
                        ])];
                    case 1:
                        _a.sent();
                        toast.success("Ticket Updated", "Ticket #".concat(complaintId, " has been updated successfully"));
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            toast.error("Reply Failed", resolveErrorMessage(error, "Unable to send reply. Please try again."));
        }
    });
    var uploadMutation = useMutation({
        mutationFn: function (file) { return uploadAttachment(complaintId, file); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
            queryClient.invalidateQueries({ queryKey: ["complaint-attachments", complaintId] });
        }
    });
    var analyzeMutation = useMutation({
        mutationFn: function () { return analyzeComplaintDeep(complaintId); },
        onSuccess: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setInsightsError(null);
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaints"] })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            setInsightsError(resolveErrorMessage(error, "Deep AI analysis is currently unavailable."));
        }
    });
    var regenerateMutation = useMutation({
        mutationFn: function () { return regenerateResolutionTemplate(complaintId); },
        onSuccess: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setInsightsError(null);
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaints"] })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaint-summary", complaintId] })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            setInsightsError(resolveErrorMessage(error, "Unable to regenerate the resolution template right now."));
        }
    });
    var handleAnalyzeInsights = function () {
        analyzeMutation.mutate();
    };
    var handleOpenAttachment = function (attachment) { return __awaiter(void 0, void 0, void 0, function () {
        var file, url, link, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, downloadAttachment(attachment.id)];
                case 1:
                    file = _a.sent();
                    url = URL.createObjectURL(file);
                    link = document.createElement("a");
                    link.href = url;
                    link.download = attachment.file_name || "attachment-".concat(attachment.id);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to open attachment", error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleRegenerateTemplate = function () {
        if (!(complaint === null || complaint === void 0 ? void 0 : complaint.ai_insights)) {
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
    return (<div className="space-y-6">
      {/* Back Button */}
      <div>
        <button onClick={function () { return navigate(-1); }} className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go back to previous page">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/>
          <span>Back</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 px-6" aria-label="Tabs">
            <button onClick={function () { return setActiveTab("details"); }} className={"px-4 py-3 text-sm font-medium border-b-2 transition ".concat(activeTab === "details"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300")}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4"/>
                <span>Details & Attachments</span>
              </div>
            </button>
            <button onClick={function () { return setActiveTab("notes"); }} className={"px-4 py-3 text-sm font-medium border-b-2 transition ".concat(activeTab === "notes"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300")}>
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4"/>
                <span>Internal Notes</span>
                {(complaint === null || complaint === void 0 ? void 0 : complaint.internal_notes) && complaint.internal_notes.length > 0 && (<span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {complaint.internal_notes.length}
                  </span>)}
              </div>
            </button>
            <button onClick={function () { return setActiveTab("replies"); }} className={"px-4 py-3 text-sm font-medium border-b-2 transition ".concat(activeTab === "replies"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300")}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4"/>
                <span>Replies</span>
                {replies.length > 0 && (<span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    {replies.length}
                  </span>)}
              </div>
            </button>
            <button onClick={function () { return setActiveTab("timeline"); }} className={"px-4 py-3 text-sm font-medium border-b-2 transition ".concat(activeTab === "timeline"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300")}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4"/>
                <span>Activity Timeline</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaint Details - Left Side */}
          <div className="lg:col-span-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5"/>
                  Complaint Details
                </h3>
                <p className="text-indigo-100 text-sm mt-1">Complete information about this complaint</p>
              </div>

              {/* Details Content */}
              <div className="p-6">
                <ComplaintDetails complaint={complaint} onClassify={function () { return classifyMutation.mutate(); }} classifyLoading={classifyMutation.isPending} aiSummary={aiSummary !== null && aiSummary !== void 0 ? aiSummary : null} summaryLoading={summaryLoading} summaryError={summaryErrorMessage} attachments={attachments} attachmentsLoading={attachmentsLoading} onOpenAttachment={handleOpenAttachment} onUseTemplate={handleUseTemplateInReply} onAnalyzeInsights={handleAnalyzeInsights} analyzeLoading={analyzeMutation.isPending} insightsError={insightsError} onRegenerateTemplate={handleRegenerateTemplate} regenerateLoading={regenerateMutation.isPending}/>
              </div>
            </div>
          </div>

          {/* Attachments - Right Side */}
          <div className="lg:col-span-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-orange-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-5 h-5"/>
                  Attachments
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  {attachments.length > 0
                ? "".concat(attachments.length, " ").concat(attachments.length === 1 ? 'file' : 'files', " attached")
                : 'Upload supporting files'}
                </p>
              </div>

              {/* Attachments Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upload New File
                  </label>
                  <FileUpload onUpload={function (file) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, uploadMutation.mutateAsync(file)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }} disabled={uploadMutation.isPending}/>
                </div>

                {attachments.length > 0 ? (<div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Uploaded Files
                    </label>
                    <ul className="space-y-2">
                      {attachments.map(function (attachment) { return (<li key={attachment.id} className="flex items-center justify-between gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-orange-600"/>
                            <div>
                              <p className="text-sm font-medium text-orange-900">{attachment.file_name}</p>
                              <p className="text-xs text-orange-700">{attachment.file_type} · {formatFileSize(attachment.file_size)}</p>
                            </div>
                          </div>
                          <button onClick={function () { return void handleOpenAttachment(attachment); }} className="text-xs font-semibold text-orange-700 hover:underline">
                            Download
                          </button>
                        </li>); })}
                    </ul>
                  </div>) : (<div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                    <p className="text-sm text-slate-600 font-medium">No files attached</p>
                    <p className="text-xs text-slate-500 mt-1">Upload files using the form above</p>
                  </div>)}
              </div>
            </div>
          </div>
        </div>)}

      {activeTab === "notes" && (<div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 px-5 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5"/>
              Internal Notes
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {(complaint === null || complaint === void 0 ? void 0 : complaint.internal_notes) && complaint.internal_notes.length > 0
                ? "".concat(complaint.internal_notes.length, " ").concat(complaint.internal_notes.length === 1 ? 'note' : 'notes', " for team collaboration")
                : 'Add private notes for your team'}
            </p>
          </div>

          {/* Notes Content */}
          <div className="p-6">
            <InternalNotesPanel complaintId={complaintId} currentUserId={user === null || user === void 0 ? void 0 : user.id} isWatching={(_a = complaint === null || complaint === void 0 ? void 0 : complaint.watchers) === null || _a === void 0 ? void 0 : _a.includes((user === null || user === void 0 ? void 0 : user.id) || 0)}/>
          </div>
        </div>)}

      {activeTab === "replies" && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reply Form - Left Side (Larger) */}
          <div className="lg:order-1">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5"/>
                  Add Reply
                </h3>
                <p className="text-blue-100 text-sm mt-1">Compose your response to the employee</p>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <ReplyForm onSubmit={function (data) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, replyMutation.mutateAsync(data)];
                        case 1:
                            _a.sent();
                            setReplyDraft("");
                            return [2 /*return*/];
                    }
                });
            }); }} loading={replyMutation.isPending} text={replyDraft} onTextChange={setReplyDraft}/>
              </div>
            </div>
          </div>

          {/* Replies List - Right Side */}
          <div className="lg:order-2">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5"/>
                  Replies to Employee
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  {replies.length > 0 ? "".concat(replies.length, " ").concat(replies.length === 1 ? 'reply' : 'replies', " sent") : 'No replies yet'}
                </p>
              </div>

              {/* Replies Content */}
              <div className="p-5 max-h-[600px] overflow-y-auto">
                {replies.length > 0 ? (<ReplyList replies={replies}/>) : (<div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-600 font-medium">No replies yet</p>
                    <p className="text-slate-500 text-sm mt-1">Your response will appear here</p>
                  </div>)}
              </div>
            </div>
          </div>
        </div>)}

      {activeTab === "timeline" && (<div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-5 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5"/>
              Activity Timeline
            </h3>
            <p className="text-cyan-100 text-sm mt-1">Complete history of all actions and updates</p>
          </div>

          {/* Timeline Content */}
          <div className="p-6">
            <ActivityTimeline complaint={complaint} replies={replies}/>
          </div>
        </div>)}
    </div>);
};
export default ComplaintDetailPage;
