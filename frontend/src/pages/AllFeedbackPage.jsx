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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Clock4, FileText, Loader2, MessageCircle, SlidersHorizontal, Pencil } from "lucide-react";
import { getDashboardStats, getPlants, listComplaints, updateComplaint } from "../api";
import { Card, CardBody } from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import EditComplaintModal from "../components/EditComplaintModal";
import ChangeStatusModal from "../components/ChangeStatusModal";
import StatCard from "../components/StatCard";
import SearchFilterBar from "../components/SearchFilterBar";
import { useToastStore } from "../store/toast";
var STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
var PRIORITY_OPTIONS = ["normal", "urgent"];
var PAGE_SIZE_OPTIONS = [10, 25, 50];
var KIND_TABS = [
    { value: "all", label: "All", icon: FileText, accent: "bg-slate-100 text-slate-700" },
    { value: "complaint", label: "Complaints", icon: AlertTriangle, accent: "bg-rose-100 text-rose-700" },
    { value: "feedback", label: "Feedback", icon: MessageCircle, accent: "bg-blue-100 text-blue-700" }
];
var createToastId = function () {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
};
var ensureNumber = function (value, fallback) {
    if (!value)
        return fallback;
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
var toDateInputValue = function (value) {
    if (!value)
        return "";
    if (value.includes("T")) {
        return value.slice(0, 10);
    }
    return value;
};
var startOfDayISO = function (value) {
    if (!value)
        return undefined;
    return new Date("".concat(value, "T00:00:00")).toISOString();
};
var endOfDayISO = function (value) {
    if (!value)
        return undefined;
    return new Date("".concat(value, "T23:59:59.999")).toISOString();
};
var AllFeedbackPage = function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    var navigate = useNavigate();
    var _w = useSearchParams(), searchParams = _w[0], setSearchParams = _w[1];
    var queryClient = useQueryClient();
    var searchParam = (_a = searchParams.get("search")) !== null && _a !== void 0 ? _a : "";
    var kindParam = (_b = searchParams.get("kind")) !== null && _b !== void 0 ? _b : "all";
    var plantParam = (_c = searchParams.get("plant")) !== null && _c !== void 0 ? _c : "";
    var priorityParam = (_d = searchParams.get("priority")) !== null && _d !== void 0 ? _d : "";
    var statusParam = (_e = searchParams.get("status")) !== null && _e !== void 0 ? _e : "";
    var categoryParam = (_f = searchParams.get("category")) !== null && _f !== void 0 ? _f : "";
    var fromParam = (_g = searchParams.get("from")) !== null && _g !== void 0 ? _g : "";
    var toParam = (_h = searchParams.get("to")) !== null && _h !== void 0 ? _h : "";
    var sortParam = (_j = searchParams.get("sort")) !== null && _j !== void 0 ? _j : "date";
    var orderParamRaw = (_k = searchParams.get("order")) !== null && _k !== void 0 ? _k : (sortParam === "priority" ? "asc" : "desc");
    var page = ensureNumber(searchParams.get("page"), 1);
    var pageSize = ensureNumber(searchParams.get("pageSize"), 10);
    var orderParam = orderParamRaw === "asc" ? "asc" : "desc";
    var normalizedSort = sortParam === "priority" ? "priority" : "date";
    var complaintsQueryKey = useMemo(function () { return [
        "complaints",
        searchParam,
        kindParam,
        plantParam,
        priorityParam,
        statusParam,
        categoryParam,
        fromParam,
        toParam,
        page,
        pageSize,
        normalizedSort,
        orderParam
    ]; }, [
        searchParam,
        kindParam,
        plantParam,
        priorityParam,
        statusParam,
        categoryParam,
        fromParam,
        toParam,
        page,
        pageSize,
        normalizedSort,
        orderParam
    ]);
    var complaintFilters = useMemo(function () { return ({
        page: page,
        pageSize: pageSize,
        sort: (normalizedSort === "priority" ? "priority" : "created_at"),
        order: (orderParam === "asc" ? "asc" : "desc"),
        search: searchParam.trim() ? searchParam.trim() : undefined,
        kind: kindParam === "all" ? undefined : kindParam,
        category: categoryParam || undefined,
        status: statusParam ? statusParam : undefined,
        priority: priorityParam ? priorityParam : undefined,
        plant: plantParam || undefined,
        fromDate: fromParam ? startOfDayISO(fromParam) : undefined,
        toDate: toParam ? endOfDayISO(toParam) : undefined
    }); }, [
        page,
        pageSize,
        normalizedSort,
        orderParam,
        searchParam,
        kindParam,
        categoryParam,
        statusParam,
        priorityParam,
        plantParam,
        fromParam,
        toParam
    ]);
    var _x = useQuery({
        queryKey: complaintsQueryKey,
        queryFn: function () { return listComplaints(complaintFilters); }
    }), complaintsPage = _x.data, complaintsLoading = _x.isLoading;
    var complaints = (_l = complaintsPage === null || complaintsPage === void 0 ? void 0 : complaintsPage.items) !== null && _l !== void 0 ? _l : [];
    var paginationMeta = complaintsPage === null || complaintsPage === void 0 ? void 0 : complaintsPage.meta;
    var dashboardStats = useQuery({
        queryKey: ["dashboard"],
        queryFn: getDashboardStats
    }).data;
    var plantsData = useQuery({
        queryKey: ["plants"],
        queryFn: getPlants
    }).data;
    var plants = plantsData !== null && plantsData !== void 0 ? plantsData : [];
    var _y = useState(false), isEditModalOpen = _y[0], setIsEditModalOpen = _y[1];
    var _z = useState(null), editTarget = _z[0], setEditTarget = _z[1];
    var _0 = useState(false), isConfirmOpen = _0[0], setIsConfirmOpen = _0[1];
    var _1 = useState(null), pendingUpdate = _1[0], setPendingUpdate = _1[1];
    // Simple status change modal state
    var _2 = useState(false), isStatusModalOpen = _2[0], setIsStatusModalOpen = _2[1];
    var _3 = useState(null), statusTarget = _3[0], setStatusTarget = _3[1];
    useEffect(function () {
        if (!isEditModalOpen) {
            setPendingUpdate(null);
            setIsConfirmOpen(false);
        }
    }, [isEditModalOpen]);
    var stats = {
        total: ((_m = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_complaints) !== null && _m !== void 0 ? _m : 0) + ((_o = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_feedback) !== null && _o !== void 0 ? _o : 0),
        complaintCount: (_p = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_complaints) !== null && _p !== void 0 ? _p : 0,
        feedbackCount: (_q = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_feedback) !== null && _q !== void 0 ? _q : 0,
        pendingCount: (_r = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.pending) !== null && _r !== void 0 ? _r : 0,
        inProgressCount: (_s = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.in_progress) !== null && _s !== void 0 ? _s : 0,
        resolvedCount: (_t = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.resolved) !== null && _t !== void 0 ? _t : 0
    };
    var categoryOptions = useMemo(function () {
        var categories = (dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.by_category) && typeof dashboardStats.by_category === "object"
            ? Object.keys(dashboardStats.by_category).filter(function (key) { return key && key.trim().length > 0; })
            : [];
        var unique = Array.from(new Set(__spreadArray(["All"], categories, true)));
        return unique;
    }, [dashboardStats]);
    // Department choices for status modal (exclude "All")
    var departmentChoices = useMemo(function () { return categoryOptions.filter(function (c) { return c && c !== "All"; }); }, [categoryOptions]);
    var searchFilters = useMemo(function () {
        var _a;
        return ({
            search: searchParam,
            status: statusParam || "All",
            priority: priorityParam || "All",
            kind: kindParam === "all" ? "All" : ((_a = kindParam) !== null && _a !== void 0 ? _a : "All"),
            category: categoryParam || undefined,
            plant: plantParam || undefined,
            dateFrom: fromParam || undefined,
            dateTo: toParam || undefined
        });
    }, [searchParam, statusParam, priorityParam, kindParam, categoryParam, plantParam, fromParam, toParam]);
    // Use new toast store instead of local state
    var toast = useToastStore();
    var updateParams = useCallback(function (values, options) {
        var next = new URLSearchParams(searchParams);
        Object.entries(values).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (!value) {
                next.delete(key);
            }
            else {
                next.set(key, value);
            }
        });
        if (options === null || options === void 0 ? void 0 : options.resetPage) {
            next.set("page", "1");
        }
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);
    var updateComplaintMutation = useMutation({
        mutationFn: function (_a) {
            var id = _a.id, updates = _a.updates;
            return updateComplaint(id, updates);
        },
        onMutate: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var previousPage, previousItems, currentItem, previousValues, optimisticItems;
            var _c;
            var id = _b.id, updates = _b.updates;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, queryClient.cancelQueries({ queryKey: complaintsQueryKey })];
                    case 1:
                        _d.sent();
                        previousPage = queryClient.getQueryData(complaintsQueryKey);
                        previousItems = (_c = previousPage === null || previousPage === void 0 ? void 0 : previousPage.items) !== null && _c !== void 0 ? _c : [];
                        currentItem = previousItems.find(function (item) { return item.id == id; }) || null;
                        previousValues = {};
                        Object.keys(updates).forEach(function (key) {
                            var typedKey = key;
                            if (currentItem && typedKey in currentItem) {
                                previousValues[typedKey] = currentItem[typedKey];
                            }
                        });
                        if (previousPage) {
                            optimisticItems = previousItems.map(function (item) { return (item.id === id ? __assign(__assign({}, item), updates) : item); });
                            queryClient.setQueryData(complaintsQueryKey, __assign(__assign({}, previousPage), { items: optimisticItems }));
                        }
                        return [2 /*return*/, { previousPage: previousPage, previousValues: previousValues, complaintId: id }];
                }
            });
        }); },
        onError: function (_error, _variables, context) {
            if (context === null || context === void 0 ? void 0 : context.previousPage) {
                queryClient.setQueryData(complaintsQueryKey, context.previousPage);
            }
            toast.error("Update Failed", "Failed to update feedback");
        },
        onSuccess: function (data, variables, context) {
            var _a, _b, _c;
            if (context === null || context === void 0 ? void 0 : context.previousPage) {
                queryClient.setQueryData(complaintsQueryKey, function (old) {
                    if (!old) {
                        return old;
                    }
                    var nextItems = old.items.map(function (item) { return (item.id === data.id ? data : item); });
                    return __assign(__assign({}, old), { items: nextItems });
                });
            }
            if (!((_a = variables.meta) === null || _a === void 0 ? void 0 : _a.silent)) {
                toast.success("Feedback Updated", (_c = (_b = variables.meta) === null || _b === void 0 ? void 0 : _b.overrideMessage) !== null && _c !== void 0 ? _c : "Feedback #".concat(data.id, " updated"));
            }
        },
        onSettled: function () {
            queryClient.invalidateQueries({ queryKey: complaintsQueryKey });
            // Keep Urgent Cases view in sync when priority/status changes
            queryClient.invalidateQueries({ queryKey: ["complaints", "urgent"] });
        }
    });
    var handleEditButton = function (feedback) {
        setEditTarget(feedback);
        setIsEditModalOpen(true);
    };
    var handleModalSave = function (updates) {
        if (!editTarget) {
            return;
        }
        var changes = [];
        if (updates.status !== editTarget.status) {
            changes.push("Status: ".concat(editTarget.status, " \u2192 ").concat(updates.status));
        }
        if (updates.priority !== editTarget.priority) {
            var fromPriority = editTarget.priority === "urgent" ? "Urgent" : "Normal";
            var toPriority = updates.priority === "urgent" ? "Urgent" : "Normal";
            changes.push("Priority: ".concat(fromPriority, " \u2192 ").concat(toPriority));
        }
        if (updates.category !== editTarget.category) {
            changes.push("Category: ".concat(editTarget.category, " \u2192 ").concat(updates.category));
        }
        if (changes.length === 0) {
            toast.info("No Changes", "Feedback remains unchanged.");
            return;
        }
        var variant = updates.status === "Resolved"
            ? "success"
            : updates.priority === "urgent" && editTarget.priority !== "urgent"
                ? "warning"
                : "info";
        setPendingUpdate({
            feedbackId: editTarget.id,
            updates: updates,
            changes: changes,
            variant: variant
        });
        setIsConfirmOpen(true);
    };
    var handleConfirmUpdate = function () {
        if (!pendingUpdate) {
            return;
        }
        updateComplaintMutation.mutate({
            id: pendingUpdate.feedbackId,
            updates: pendingUpdate.updates,
            meta: {
                overrideMessage: "Feedback #".concat(pendingUpdate.feedbackId, " updated (").concat(pendingUpdate.changes.join(", "), ")")
            }
        });
        setIsConfirmOpen(false);
        setIsEditModalOpen(false);
        setPendingUpdate(null);
    };
    var handleCancelConfirm = function () {
        setIsConfirmOpen(false);
        // Keep modal open for further edits
    };
    var isMutating = updateComplaintMutation.isPending;
    return (<div className="space-y-6">
      <div className="animate-slide-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          All Feedback
        </h1>
        <p className="text-slate-500 mt-2">View and manage all complaints and feedback in one place</p>
      </div>

      <div className="overflow-x-auto pb-2 -mx-6 px-6">
          <div className="grid grid-cols-7 gap-3 min-w-max">
            <StatCard label="Total" value={stats.total} icon={FileText} trend="Overall"/>
            <StatCard label="Complaints" value={stats.complaintCount} icon={AlertTriangle} trend="Follow-up" accent="text-danger"/>
            <StatCard label="Feedback" value={stats.feedbackCount} icon={MessageCircle} trend="Sentiments" accent="text-blue-600"/>
            <StatCard label="Pending" value={stats.pendingCount} icon={Clock} trend="Awaiting" accent="text-warning"/>
            <StatCard label="In Progress" value={stats.inProgressCount} icon={Clock4} trend="Being handled" accent="text-blue-600"/>
            <StatCard label="Resolved" value={stats.resolvedCount} icon={CheckCircle2} trend="Closed" accent="text-success"/>
            <StatCard label="Unclassified" value={(_u = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.unclassified) !== null && _u !== void 0 ? _u : 0} icon={MessageCircle} trend="AI Review" accent="text-purple-500"/>
          </div>
      </div>
      {/* New SearchFilterBar Component */}
      <SearchFilterBar filters={searchFilters} onFiltersChange={function (newFilters) {
            updateParams({
                search: newFilters.search && newFilters.search.trim().length > 0
                    ? newFilters.search.trim()
                    : null,
                status: newFilters.status === "All" ? null : newFilters.status,
                priority: newFilters.priority === "All" ? null : newFilters.priority,
                kind: newFilters.kind === "All" ? null : newFilters.kind,
                category: newFilters.category || null,
                plant: newFilters.plant || null,
                from: newFilters.dateFrom || null,
                to: newFilters.dateTo || null
            }, { resetPage: true });
        }} showAdvancedFilters={true} placeholder="Search feedback by ID, email, or description..." categories={categoryOptions} plants={plants}/>

      <Card>
        <CardBody className="space-y-6">
          {/* Sort and Page Size Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Sort by:</span>
              <button type="button" onClick={function () {
            var nextSort = normalizedSort === "date" ? "priority" : "date";
            var nextOrder = nextSort === "priority" ? "asc" : "desc";
            updateParams({ sort: nextSort, order: nextOrder }, {});
        }} className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" aria-label="Change sort order">
                {normalizedSort === "date" ? "Newest first" : "Priority (urgent first)"}
                <SlidersHorizontal className="ml-2 h-4 w-4 text-slate-500" aria-hidden="true"/>
              </button>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
              <span className="font-medium">Page size:</span>
              <select value={pageSize} onChange={function (event) { return updateParams({ pageSize: event.target.value, page: "1" }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" aria-label="Change results per page">
                {PAGE_SIZE_OPTIONS.map(function (size) { return (<option key={size} value={size}>
                    {size} per page
                  </option>); })}
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {complaintsLoading ? (<div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-8 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true"/> Loading feedback...
              </div>) : complaints.length === 0 ? (<div className="text-center py-8 text-slate-500">No feedback matches the selected filters.</div>) : (complaints.map(function (feedback) {
            var KindIcon = feedback.kind === "complaint" ? AlertTriangle : MessageCircle;
            return (<article key={feedback.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500/40">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={function () { return navigate("/complaints/".concat(feedback.id)); }} className="flex-1 text-left" aria-label={"View details for feedback #".concat(feedback.id)}>
                        <div className="flex items-center gap-2 mb-3">
                          <KindIcon className={"h-4 w-4 ".concat(feedback.kind === "complaint" ? "text-rose-600" : "text-blue-600")} aria-hidden="true"/>
                          <span className={"text-xs font-semibold px-2 py-1 rounded-full ".concat(feedback.kind === "complaint"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-blue-100 text-blue-700")}>
                            {feedback.kind === "complaint" ? "Complaint" : "Feedback"}
                          </span>
                          {(function () {
                    var cls = feedback.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-700"
                        : feedback.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"; // Pending
                    return (<span className={"text-xs font-semibold px-2 py-1 rounded-full ".concat(cls)}>
                                {feedback.status}
                              </span>);
                })()}
                          <span className={"text-xs font-semibold px-2 py-1 rounded-full ".concat(feedback.priority === "urgent"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600")}>
                            {feedback.priority === "urgent" ? "Urgent" : "Normal"}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{feedback.complaint_text}</h3>
                        <dl className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div>
                            <dt className="sr-only">Feedback ID</dt>
                            <dd>#{feedback.id}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Category</dt>
                            <dd>{feedback.category}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Employee</dt>
                            <dd>{feedback.emp_id}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Created</dt>
                            <dd>{new Date(feedback.created_at).toLocaleString()}</dd>
                          </div>
                          {feedback.plant && (<div>
                              <dt className="sr-only">Plant</dt>
                              <dd>Plant {feedback.plant}</dd>
                            </div>)}
                        </dl>
                      </button>

                      {/* Edit icon to change status */}
                      <div className="flex items-start gap-2 min-w-[40px]">
                        <button type="button" onClick={function (e) {
                    e.stopPropagation();
                    setStatusTarget(feedback);
                    setIsStatusModalOpen(true);
                }} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Change status" aria-label="Change status">
                          <Pencil className="h-4 w-4"/>
                        </button>
                      </div>
                    </div>
                  </article>);
        }))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (<div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
              <span>
                Page {paginationMeta.page} of {paginationMeta.totalPages} · {paginationMeta.total} total
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={function () {
                return paginationMeta.page > 1 &&
                    updateParams({ page: String(paginationMeta.page - 1) });
            }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50" disabled={paginationMeta.page <= 1} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true"/> Prev
                </button>
                <button type="button" onClick={function () {
                return paginationMeta.page < paginationMeta.totalPages &&
                    updateParams({ page: String(paginationMeta.page + 1) });
            }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50" disabled={paginationMeta.page >= paginationMeta.totalPages} aria-label="Next page">
                  Next <ChevronRight className="h-4 w-4" aria-hidden="true"/>
                </button>
              </div>
            </div>)}
        </CardBody>
      </Card>

      <EditComplaintModal open={isEditModalOpen} complaint={editTarget} onClose={function () { return setIsEditModalOpen(false); }} onSave={handleModalSave}/>

      <ConfirmDialog isOpen={isConfirmOpen} title="Apply feedback updates?" message={pendingUpdate
            ? "Confirm the following changes:\n".concat(pendingUpdate.changes
                .map(function (change) { return "\u2022 ".concat(change); })
                .join("\n"))
            : ""} confirmText="Apply changes" cancelText="Keep editing" variant={(_v = pendingUpdate === null || pendingUpdate === void 0 ? void 0 : pendingUpdate.variant) !== null && _v !== void 0 ? _v : "info"} onConfirm={handleConfirmUpdate} onCancel={handleCancelConfirm}/>

      {/* Simple Change Status modal */}
      <ChangeStatusModal open={isStatusModalOpen} currentStatus={statusTarget === null || statusTarget === void 0 ? void 0 : statusTarget.status} currentCategory={statusTarget === null || statusTarget === void 0 ? void 0 : statusTarget.category} categories={departmentChoices} currentPriority={statusTarget === null || statusTarget === void 0 ? void 0 : statusTarget.priority} ticketId={statusTarget === null || statusTarget === void 0 ? void 0 : statusTarget.id} onClose={function () { return setIsStatusModalOpen(false); }} onSave={function (nextStatus, nextCategory, nextPriority) {
            if (!statusTarget)
                return;
            updateComplaintMutation.mutate({
                id: statusTarget.id,
                updates: { status: nextStatus, category: nextCategory, priority: nextPriority },
                meta: { overrideMessage: "Feedback #".concat(statusTarget.id, " set to ").concat(nextStatus, " in ").concat(nextCategory, " (").concat(nextPriority === "urgent" ? "Urgent" : "Normal", ")") }
            });
            setIsStatusModalOpen(false);
            setStatusTarget(null);
        }}/>

      {updateComplaintMutation.isPending && (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Saving changes…
        </div>)}
    </div>);
};
export default AllFeedbackPage;
