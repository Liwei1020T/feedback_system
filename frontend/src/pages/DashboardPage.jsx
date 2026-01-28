var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock4, Info, MessageCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeComplaintDeep, classifyComplaint, createReply, getCategorySuggestions, getDashboardStats, getComplaintAttachments, getComplaintSummary, getReplyAssistance, listComplaints, listReplies, downloadAttachment, regenerateResolutionTemplate, updateComplaint } from "../api";
import StatCard from "../components/StatCard";
import ComplaintTable from "../components/ComplaintTable";
import EditComplaintModal from "../components/EditComplaintModal";
import { useAuth } from "../hooks/useAuth";
import { useNotificationStore } from "../store/notifications";
import { useToastStore } from "../store/toast";
import AttachmentPreviewModal from "../components/AttachmentPreviewModal";
var resolveErrorMessage = function (error, fallback) {
    if (error && typeof error === "object" && "message" in error) {
        var message = error.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }
    return fallback;
};
var CATEGORY_OPTIONS = ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"];
var PRIORITY_OPTIONS = ["normal", "urgent"];
var STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
var DashboardPage = function () {
    var _a, _b, _c, _d, _e, _f;
    var user = useAuth().user;
    var navigate = useNavigate();
    var queryClient = useQueryClient();
    var _g = useState(null), selected = _g[0], setSelected = _g[1];
    var _h = useState("Unclassified"), categoryValue = _h[0], setCategoryValue = _h[1];
    var _j = useState("normal"), priorityValue = _j[0], setPriorityValue = _j[1];
    var _k = useState("All"), categoryFilter = _k[0], setCategoryFilter = _k[1];
    var _l = useState("Pending"), statusValue = _l[0], setStatusValue = _l[1];
    var _m = useState(""), replyDraft = _m[0], setReplyDraft = _m[1];
    var _o = useState([]), recommendations = _o[0], setRecommendations = _o[1];
    var _p = useState("supportive"), tone = _p[0], setTone = _p[1];
    var _q = useState(null), insightsError = _q[0], setInsightsError = _q[1];
    var _r = useState({}), attachmentPreviews = _r[0], setAttachmentPreviews = _r[1];
    var attachmentPreviewRef = useRef({});
    var _s = useState(null), previewAttachment = _s[0], setPreviewAttachment = _s[1];
    var _t = useState(false), editOpen = _t[0], setEditOpen = _t[1];
    var _u = useState(null), editTarget = _u[0], setEditTarget = _u[1];
    var addNotification = useNotificationStore(function (state) { return state.add; });
    var notificationItems = useNotificationStore(function (state) { return state.items; });
    var toast = useToastStore();
    // Recent feedback pagination + sorting (server-side)
    var _v = useState(1), recentPage = _v[0], setRecentPage = _v[1];
    var recentPageSize = useState(10)[0];
    var _w = useState(localStorage.getItem("feedbackSort") || "date"), recentSort = _w[0], setRecentSort = _w[1];
    var mapSort = function (value) { return (value === "date" ? "created_at" : "priority"); };
    var _x = useQuery({
        queryKey: [
            "complaints",
            "recent",
            { page: recentPage, pageSize: recentPageSize, sort: recentSort, category: categoryFilter }
        ],
        queryFn: function () {
            return listComplaints({
                page: recentPage,
                pageSize: recentPageSize,
                sort: mapSort(recentSort),
                order: "desc",
                // pass category filter when applied
                category: categoryFilter !== "All" ? categoryFilter : undefined
            });
        }
    }), complaintsData = _x.data, isLoading = _x.isLoading;
    var complaints = (complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.items) || [];
    var stats = useQuery({
        queryKey: ["dashboard"],
        queryFn: getDashboardStats
    }).data;
    // Weekly textual AI summary is intentionally not shown on Dashboard.
    // Compute top categories from dashboard stats to enrich highlights
    var topCategories = useMemo(function () {
        if (!(stats === null || stats === void 0 ? void 0 : stats.by_category))
            return [];
        return Object.entries(stats.by_category)
            .map(function (_a) {
            var name = _a[0], count = _a[1];
            return ({ name: name, count: count });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 3);
    }, [stats === null || stats === void 0 ? void 0 : stats.by_category]);
    // Paginated replies for the selected feedback
    var _y = useState(1), replyPage = _y[0], setReplyPage = _y[1];
    var replyPageSize = useState(5)[0];
    var _z = useQuery({
        queryKey: ["replies", selected === null || selected === void 0 ? void 0 : selected.id, { page: replyPage, pageSize: replyPageSize }],
        queryFn: function () { return listReplies(selected.id, { page: replyPage, pageSize: replyPageSize, order: "desc" }); },
        enabled: Boolean(selected === null || selected === void 0 ? void 0 : selected.id)
    }), repliesData = _z.data, repliesLoading = _z.isFetching;
    var replies = (repliesData === null || repliesData === void 0 ? void 0 : repliesData.items) || [];
    var _0 = useQuery({
        queryKey: ["complaint-attachments", selected === null || selected === void 0 ? void 0 : selected.id],
        queryFn: function () { return getComplaintAttachments(selected.id); },
        enabled: Boolean(selected === null || selected === void 0 ? void 0 : selected.id)
    }), _1 = _0.data, attachments = _1 === void 0 ? [] : _1, attachmentsLoading = _0.isFetching;
    var complaintLevelAttachments = useMemo(function () { return attachments.filter(function (attachment) { return !attachment.reply_id; }); }, [attachments]);
    var _2 = useQuery({
        queryKey: ["category-suggestions", selected === null || selected === void 0 ? void 0 : selected.id],
        queryFn: function () { return getCategorySuggestions(selected.id); },
        enabled: Boolean(selected === null || selected === void 0 ? void 0 : selected.id)
    }), _3 = _2.data, suggestions = _3 === void 0 ? [] : _3, suggestionsLoading = _2.isFetching;
    var _4 = useQuery({
        queryKey: ["complaint-summary", selected === null || selected === void 0 ? void 0 : selected.id],
        queryFn: function () { return getComplaintSummary(selected.id); },
        enabled: Boolean(selected === null || selected === void 0 ? void 0 : selected.id)
    }), complaintSummary = _4.data, complaintSummaryLoading = _4.isFetching, complaintSummaryError = _4.isError, complaintSummaryErrorValue = _4.error;
    // Removed application logs panel and related polling on dashboard.
    // Server delivers filtered + sorted slice already; we only derive presentation here
    var complaintFeedback = useMemo(function () { return complaints.filter(function (item) { return item.kind === "complaint"; }); }, [complaints]);
    var feedbackFeedback = useMemo(function () { return complaints.filter(function (item) { return item.kind === "feedback"; }); }, [complaints]);
    useEffect(function () {
        complaints.forEach(function (complaint) {
            var urgentId = "urgent-".concat(complaint.id);
            var unclassifiedId = "unclassified-".concat(complaint.id);
            if (complaint.priority === "urgent" &&
                !notificationItems.some(function (notification) { return notification.id === urgentId; })) {
                addNotification({
                    id: urgentId,
                    title: "Urgent complaint",
                    message: "Feedback #".concat(complaint.id, " (").concat(complaint.category, ") needs immediate attention."),
                    createdAt: complaint.created_at
                });
            }
            if (complaint.category === "Unclassified" &&
                !notificationItems.some(function (notification) { return notification.id === unclassifiedId; })) {
                addNotification({
                    id: unclassifiedId,
                    title: "Manual classification required",
                    message: "Feedback #".concat(complaint.id, " has low AI confidence and needs review."),
                    createdAt: complaint.created_at
                });
            }
        });
    }, [complaints, notificationItems, addNotification]);
    useEffect(function () {
        if (selected && categoryFilter !== "All" && selected.category !== categoryFilter) {
            setSelected(null);
        }
    }, [categoryFilter, selected]);
    useEffect(function () {
        var _a;
        if (!selected && complaints.length > 0) {
            setSelected((_a = complaints[0]) !== null && _a !== void 0 ? _a : null);
        }
    }, [complaints, selected]);
    useEffect(function () {
        var revokeAll = function (map) {
            Object.values(map).forEach(function (url) { return URL.revokeObjectURL(url); });
        };
        var active = true;
        var loadPreviews = function () { return __awaiter(void 0, void 0, void 0, function () {
            var next, _i, attachments_1, attachment, blob, url, error_1, axiosError;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!attachments || attachments.length === 0) {
                            if (Object.keys(attachmentPreviewRef.current).length) {
                                revokeAll(attachmentPreviewRef.current);
                                attachmentPreviewRef.current = {};
                            }
                            if (active) {
                                setAttachmentPreviews({});
                            }
                            return [2 /*return*/];
                        }
                        next = {};
                        _i = 0, attachments_1 = attachments;
                        _c.label = 1;
                    case 1:
                        if (!(_i < attachments_1.length)) return [3 /*break*/, 6];
                        attachment = attachments_1[_i];
                        if (!attachment.file_type.startsWith("image/")) {
                            return [3 /*break*/, 5];
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, downloadAttachment(attachment.id)];
                    case 3:
                        blob = _c.sent();
                        if (!active) {
                            return [2 /*return*/];
                        }
                        url = URL.createObjectURL(blob);
                        next[attachment.id] = url;
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
                        // Silently skip files that are no longer available (410 Gone)
                        // This is expected for attachments that were deleted or never uploaded
                        if (error_1 && typeof error_1 === 'object' && 'response' in error_1) {
                            axiosError = error_1;
                            if (((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) === 410 || ((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
                                return [3 /*break*/, 5]; // Skip silently for missing files
                            }
                        }
                        // Log other errors for debugging
                        console.error("Failed to load attachment preview", error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        if (active) {
                            revokeAll(attachmentPreviewRef.current);
                            attachmentPreviewRef.current = next;
                            setAttachmentPreviews(next);
                        }
                        else {
                            revokeAll(next);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        loadPreviews();
        return function () {
            active = false;
            revokeAll(attachmentPreviewRef.current);
            attachmentPreviewRef.current = {};
        };
    }, [attachments, downloadAttachment]);
    useEffect(function () {
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
    var handleViewAttachment = function (attachment) { return __awaiter(void 0, void 0, void 0, function () {
        var getUrl, url, opened, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    getUrl = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var blob, url;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (attachmentPreviews[attachment.id]) {
                                        return [2 /*return*/, attachmentPreviews[attachment.id]];
                                    }
                                    return [4 /*yield*/, downloadAttachment(attachment.id)];
                                case 1:
                                    blob = _a.sent();
                                    url = URL.createObjectURL(blob);
                                    setTimeout(function () { return URL.revokeObjectURL(url); }, 60000);
                                    return [2 /*return*/, url];
                            }
                        });
                    }); };
                    return [4 /*yield*/, getUrl()];
                case 1:
                    url = _a.sent();
                    if (attachment.file_type.startsWith("image/")) {
                        setPreviewAttachment({ attachment: attachment, url: url });
                    }
                    else {
                        opened = window.open(url, "_blank", "noopener,noreferrer");
                        if (!opened) {
                            throw new Error("Please allow pop-ups to view attachments.");
                        }
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    addNotification({
                        id: "attachment-error-".concat(attachment.id, "-").concat(Date.now()),
                        title: "Attachment error",
                        message: resolveErrorMessage(error_2, "Unable to open attachment."),
                        createdAt: new Date().toISOString()
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var classifyMutation = useMutation({
        mutationFn: function (id) { return classifyComplaint(id); },
        onSuccess: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!selected)
                            return [2 /*return*/];
                        return [4 /*yield*/, Promise.all([
                                queryClient.invalidateQueries({ queryKey: ["complaints"] }),
                                queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                                queryClient.invalidateQueries({ queryKey: ["category-suggestions", selected.id] }),
                                queryClient.invalidateQueries({ queryKey: ["complaint-summary", selected.id] })
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }
    });
    var updateMutation = useMutation({
        mutationFn: function () {
            if (!selected)
                throw new Error("No complaint selected");
            return updateComplaint(selected.id, {
                category: categoryValue,
                priority: priorityValue,
                status: statusValue
            });
        },
        onSuccess: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!selected)
                            return [2 /*return*/];
                        setSelected(function (prev) {
                            return prev && prev.id === selected.id
                                ? __assign(__assign({}, prev), { category: categoryValue, priority: priorityValue, status: statusValue, updated_at: new Date().toISOString() }) : prev;
                        });
                        return [4 /*yield*/, Promise.all([
                                queryClient.invalidateQueries({ queryKey: ["complaints"] }),
                                queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                                queryClient.invalidateQueries({ queryKey: ["replies", selected.id] }),
                                queryClient.invalidateQueries({ queryKey: ["category-suggestions", selected.id] }),
                                queryClient.invalidateQueries({ queryKey: ["complaint-summary", selected.id] })
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }
    });
    var replyMutation = useMutation({
        mutationFn: function (payload) {
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
        onSuccess: function (_, variables) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!selected) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["replies", selected.id] })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaints"] })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaint-attachments", selected.id] })];
                    case 3:
                        _a.sent();
                        if (!variables.sendEmail) return [3 /*break*/, 5];
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["dashboard"] })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        setReplyDraft("");
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); }
    });
    var assistanceMutation = useMutation({
        mutationFn: function () {
            if (!selected)
                throw new Error("No complaint selected");
            return getReplyAssistance(selected.id);
        },
        onSuccess: function (data) {
            setReplyDraft(data.suggested_reply);
            setRecommendations(data.recommended_actions);
            setTone(data.tone);
        },
        onError: function () {
            setRecommendations([]);
            setTone("supportive");
        }
    });
    var assistanceErrorMessage = resolveErrorMessage(assistanceMutation.error, "AI reply assistance is currently unavailable.");
    var analyzeMutation = useMutation({
        mutationFn: function (complaintId) { return analyzeComplaintDeep(complaintId); },
        onSuccess: function (insights) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setInsightsError(null);
                        setSelected(function (prev) {
                            var _a;
                            return prev
                                ? __assign(__assign({}, prev), { ai_insights: insights, sentiment_history: __spreadArray(__spreadArray([], ((_a = prev.sentiment_history) !== null && _a !== void 0 ? _a : []), true), [insights.sentiment], false) }) : prev;
                        });
                        addNotification({
                            id: "insights-".concat(Date.now()),
                            title: "Deep analysis ready",
                            message: "AI insights generated for the selected complaint.",
                            createdAt: new Date().toISOString()
                        });
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["complaints"] })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            var message = resolveErrorMessage(error, "Deep AI analysis is currently unavailable.");
            setInsightsError(message);
            addNotification({
                id: "insights-error-".concat(Date.now()),
                title: "Deep analysis failed",
                message: message,
                createdAt: new Date().toISOString()
            });
        }
    });
    var regenerateMutation = useMutation({
        mutationFn: function (complaintId) { return regenerateResolutionTemplate(complaintId); },
        onSuccess: function (template) {
            setInsightsError(null);
            setSelected(function (prev) {
                return prev && prev.ai_insights
                    ? __assign(__assign({}, prev), { ai_insights: __assign(__assign({}, prev.ai_insights), { resolution_template: template }) }) : prev;
            });
            addNotification({
                id: "template-".concat(Date.now()),
                title: "Template refreshed",
                message: "Resolution template updated with the latest guidance.",
                createdAt: new Date().toISOString()
            });
        },
        onError: function (error) {
            var message = resolveErrorMessage(error, "Unable to regenerate the resolution template.");
            setInsightsError(message);
            addNotification({
                id: "template-error-".concat(Date.now()),
                title: "Template regeneration failed",
                message: message,
                createdAt: new Date().toISOString()
            });
        }
    });
    var handleAnalyzeInsights = function () {
        if (!selected) {
            setInsightsError("Select a complaint before running deep analysis.");
            return;
        }
        analyzeMutation.mutate(selected.id);
    };
    var handleRegenerateTemplate = function () {
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
    var cards = useMemo(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return [
            {
                label: "Total Feedback",
                value: ((_a = stats === null || stats === void 0 ? void 0 : stats.total_complaints) !== null && _a !== void 0 ? _a : 0) + ((_b = stats === null || stats === void 0 ? void 0 : stats.total_feedback) !== null && _b !== void 0 ? _b : 0),
                icon: Info,
                trend: "Overall volume"
            },
            {
                label: "Complaints",
                value: (_c = stats === null || stats === void 0 ? void 0 : stats.total_complaints) !== null && _c !== void 0 ? _c : 0,
                icon: AlertTriangle,
                trend: "Requires follow-up",
                accent: "text-danger"
            },
            {
                label: "Feedback",
                value: (_d = stats === null || stats === void 0 ? void 0 : stats.total_feedback) !== null && _d !== void 0 ? _d : 0,
                icon: MessageCircle,
                trend: "General sentiments",
                accent: "text-blue-600"
            },
            {
                label: "Pending",
                value: (_e = stats === null || stats === void 0 ? void 0 : stats.pending) !== null && _e !== void 0 ? _e : 0,
                icon: Clock4,
                trend: "Awaiting response",
                accent: "text-warning"
            },
            {
                label: "In Progress",
                value: (_f = stats === null || stats === void 0 ? void 0 : stats.in_progress) !== null && _f !== void 0 ? _f : 0,
                icon: Clock4,
                trend: "Being handled",
                accent: "text-blue-500"
            },
            {
                label: "Resolved",
                value: (_g = stats === null || stats === void 0 ? void 0 : stats.resolved) !== null && _g !== void 0 ? _g : 0,
                icon: CheckCircle2,
                trend: "Closed feedback",
                accent: "text-success"
            },
            {
                label: "Unclassified",
                value: (_h = stats === null || stats === void 0 ? void 0 : stats.unclassified) !== null && _h !== void 0 ? _h : 0,
                icon: Info,
                trend: "Needs AI review",
                accent: "text-purple-600"
            }
        ];
    }, [stats]);
    return (<div className="space-y-6">
      {(user === null || user === void 0 ? void 0 : user.role) === "admin" && (user.department || user.plant) && (<div className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Viewing{" "}
          {user.department ? (<><span className="font-semibold">{user.department}</span> department</>) : null}
          {user.department && user.plant ? " | " : ""}
          {user.plant ? (<span className="font-semibold">Plant {user.plant}</span>) : null}
          {" feedback only."}
        </div>)}

      <div className="grid grid-cols-7 gap-3">
        {cards.map(function (card) { return (<StatCard key={card.label} {...card}/>); })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {isLoading ? (<div className="glass-card p-6 text-center text-slate-500">Loading feedback...</div>) : (<div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Recent Feedback</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <button onClick={function () {
                var newSort = recentSort === "date" ? "priority" : "date";
                setRecentSort(newSort);
                localStorage.setItem("feedbackSort", newSort);
                // Reset to first page when changing sort
                setRecentPage(1);
            }} className={"px-3 py-2 rounded-lg text-sm font-medium transition-colors ".concat(recentSort === "date"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                    {recentSort === "date" ? "Date" : "Priority"}
                  </button>
                </div>
              </div>
              
              <ComplaintTable complaints={complaints} selectedId={selected === null || selected === void 0 ? void 0 : selected.id} onSelect={function (item) {
                // Navigate to complaint detail page to see Internal Notes tab
                navigate("/complaints/".concat(item.id));
            }} onFilterChange={function (value) { return setCategoryFilter(value); }} activeFilter={categoryFilter} title={"Recent Feedback (".concat((_a = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.total) !== null && _a !== void 0 ? _a : 0, ")")} emptyMessage="No feedback captured yet." showKindBadge onEdit={function (c) {
                setEditTarget(c);
                setEditOpen(true);
            }} pagination={{
                page: (_b = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.page) !== null && _b !== void 0 ? _b : recentPage,
                pageSize: (_c = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.pageSize) !== null && _c !== void 0 ? _c : recentPageSize,
                total: (_d = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.total) !== null && _d !== void 0 ? _d : 0,
                totalPages: (_e = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.totalPages) !== null && _e !== void 0 ? _e : 0,
                onPageChange: function (page) { return setRecentPage(page); }
            }} loading={isLoading}/>
              
              {((_f = complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.meta.total) !== null && _f !== void 0 ? _f : 0) > recentPageSize && (<div className="text-center mt-4">
                  <button onClick={function () { return window.location.href = '/feedback'; }} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View all feedback →
                  </button>
                </div>)}
            </div>)}
        </div>
      </div>
  <AttachmentPreviewModal isOpen={!!previewAttachment} onClose={function () { return setPreviewAttachment(null); }} attachment={previewAttachment ? { url: previewAttachment.url, name: previewAttachment.attachment.file_name } : null}/>
  <EditComplaintModal open={editOpen} complaint={editTarget} onClose={function () { return setEditOpen(false); }} onSave={function (updates) {
            if (!editTarget)
                return;
            updateComplaint(editTarget.id, {
                category: updates.category,
                priority: updates.priority,
                status: updates.status
            })
                .then(function () {
                setEditOpen(false);
                toast.success("Feedback Updated", "Feedback #".concat(editTarget.id, " has been updated successfully"));
                void queryClient.invalidateQueries({ queryKey: ["complaints"] });
            })
                .catch(function (error) {
                setEditOpen(false);
                toast.error("Update Failed", resolveErrorMessage(error, "Failed to update feedback"));
            });
        }}/>
    </div>);
};
export default DashboardPage;
