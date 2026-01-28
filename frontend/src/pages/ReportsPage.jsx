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
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Download, Calendar, TrendingUp, RefreshCcw, Eye, Sparkles, Trash2 } from "lucide-react";
import { getWeeklyReports, generateReport, getWeeklyReportContent, deleteReport } from "../api";
import { Card, CardBody, CardTitle } from "../components/Card";
import { useToastStore } from "../store/toast";
import ConfirmDialog from "../components/ConfirmDialog";
var ReportsPage = function () {
    var _a;
    var queryClient = useQueryClient();
    var toast = useToastStore();
    var _b = useState(null), selectedReport = _b[0], setSelectedReport = _b[1];
    var _c = useState(""), reportContent = _c[0], setReportContent = _c[1];
    var _d = useState(false), isContentLoading = _d[0], setIsContentLoading = _d[1];
    var _e = useState("html"), contentFormat = _e[0], setContentFormat = _e[1];
    var _f = useState(false), isModalOpen = _f[0], setIsModalOpen = _f[1];
    var _g = useState(false), isDeleteConfirmOpen = _g[0], setIsDeleteConfirmOpen = _g[1];
    var _h = useState(null), reportToDelete = _h[0], setReportToDelete = _h[1];
    // Fetch weekly reports
    var _j = useQuery({
        queryKey: ["weekly-reports"],
        queryFn: getWeeklyReports,
        retry: 1
    }), _k = _j.data, reports = _k === void 0 ? [] : _k, isLoading = _j.isLoading, error = _j.error, refetch = _j.refetch;
    // Show error if fetch failed
    if (error) {
        console.error("Error fetching reports:", error);
    }
    // Generate report now mutation
    var generateMutation = useMutation({
        mutationFn: function () { return generateReport("weekly"); },
        onSuccess: function (newReport) {
            queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
            toast.success("Report Generated", "Successfully generated report #".concat(newReport.id, "!"));
        },
        onError: function (error) {
            var _a, _b;
            console.error("Failed to generate report:", error);
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to generate report";
            toast.error("Generation Failed", message);
        }
    });
    // Delete report mutation
    var deleteMutation = useMutation({
        mutationFn: function (reportId) { return deleteReport(reportId); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
            toast.success("Report Deleted", "Report has been successfully deleted");
            setIsDeleteConfirmOpen(false);
            setReportToDelete(null);
        },
        onError: function (error) {
            var _a, _b;
            console.error("Failed to delete report:", error);
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to delete report";
            toast.error("Delete Failed", message);
        }
    });
    var loadReportContent = function (report, format) { return __awaiter(void 0, void 0, void 0, function () {
        var content, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (format === "html" && report.html_content) {
                        setReportContent(report.html_content);
                        return [2 /*return*/];
                    }
                    setIsContentLoading(true);
                    setReportContent("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getWeeklyReportContent(report.id, format)];
                case 2:
                    content = _a.sent();
                    setReportContent(content);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load report content:", error_1);
                    toast.error("Load Failed", "Could not load report content");
                    setReportContent("Failed to load report content");
                    return [3 /*break*/, 5];
                case 4:
                    setIsContentLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleViewReport = function (report) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setContentFormat("html");
                    setSelectedReport(report);
                    setIsModalOpen(true);
                    return [4 /*yield*/, loadReportContent(report, "html")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadReport = function (report, format) { return __awaiter(void 0, void 0, void 0, function () {
        var content, blob, url, a, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    content = void 0;
                    if (!(format === "html")) return [3 /*break*/, 3];
                    content = (_a = report.html_content) !== null && _a !== void 0 ? _a : reportContent;
                    if (!!content) return [3 /*break*/, 2];
                    return [4 /*yield*/, getWeeklyReportContent(report.id, "html")];
                case 1:
                    content = _b.sent();
                    _b.label = 2;
                case 2: return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, getWeeklyReportContent(report.id, "text")];
                case 4:
                    content = _b.sent();
                    _b.label = 5;
                case 5:
                    blob = new Blob([content], {
                        type: format === "html" ? "text/html" : "text/plain"
                    });
                    url = URL.createObjectURL(blob);
                    a = document.createElement("a");
                    a.href = url;
                    a.download = "weekly-report-".concat(report.id, ".").concat(format);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _b.sent();
                    console.error("Failed to download report:", error_2);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var formatDate = function (dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    var formatDateTime = function (dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
    var reportInsights = useMemo(function () {
        if (!(selectedReport === null || selectedReport === void 0 ? void 0 : selectedReport.metadata))
            return null;
        var meta = selectedReport.metadata;
        var statsMeta = meta.stats && typeof meta.stats === "object" ? meta.stats : {};
        var prevention = Array.isArray(meta.prevention_recommendations)
            ? meta.prevention_recommendations.filter(function (item) { return typeof item === "string" && item.trim().length > 0; })
            : [];
        var focus = Array.isArray(meta.focus_areas)
            ? meta.focus_areas.filter(function (item) { return typeof item === "string" && item.trim().length > 0; })
            : [];
        var keyIssues = Array.isArray(meta.key_issues)
            ? meta.key_issues.reduce(function (acc, issue) {
                var _a, _b, _c, _d, _e, _f;
                if (!issue || typeof issue !== "object") {
                    return acc;
                }
                var complaintId = Number((_a = issue.complaint_id) !== null && _a !== void 0 ? _a : 0);
                var category = String((_b = issue.category) !== null && _b !== void 0 ? _b : "Unclassified");
                var rawStatus = String((_c = issue.status) !== null && _c !== void 0 ? _c : "Pending");
                var rawKind = String((_d = issue.kind) !== null && _d !== void 0 ? _d : "complaint");
                var status = rawStatus === "In Progress" || rawStatus === "Resolved" ? rawStatus : "Pending";
                var keyIssue = String((_e = issue.key_issue) !== null && _e !== void 0 ? _e : "");
                var probabilityValue = Number((_f = issue.probability) !== null && _f !== void 0 ? _f : 0);
                var kind = rawKind === "feedback" ? "feedback" : "complaint";
                acc.push({
                    complaint_id: complaintId,
                    category: category,
                    status: status,
                    kind: kind,
                    key_issue: keyIssue,
                    probability: Number.isFinite(probabilityValue) ? probabilityValue : 0
                });
                return acc;
            }, [])
            : [];
        var topCategories = Array.isArray(meta.top_categories)
            ? meta.top_categories.reduce(function (acc, entry) {
                var _a, _b;
                if (!entry || typeof entry !== "object") {
                    return acc;
                }
                var category = String((_a = entry.category) !== null && _a !== void 0 ? _a : "");
                var count = Number((_b = entry.count) !== null && _b !== void 0 ? _b : 0);
                if (category) {
                    acc.push({ category: category, count: Number.isFinite(count) ? count : 0 });
                }
                return acc;
            }, [])
            : [];
        var summaryRaw = (typeof meta.summary_plain === "string" && meta.summary_plain.trim()) ||
            (typeof meta.summary_markdown === "string" && meta.summary_markdown.trim()) ||
            "";
        return {
            periodLabel: typeof meta.period_label === "string" ? meta.period_label : undefined,
            generatedAt: typeof meta.generated_at === "string" ? meta.generated_at : undefined,
            stats: statsMeta,
            summary: summaryRaw,
            prevention: prevention,
            focus: focus,
            keyIssues: keyIssues,
            topCategories: topCategories
        };
    }, [selectedReport]);
    var summaryParagraphs = useMemo(function () {
        if (!(reportInsights === null || reportInsights === void 0 ? void 0 : reportInsights.summary))
            return [];
        return reportInsights.summary
            .split(/\n+/)
            .map(function (item) { return item.trim(); })
            .filter(function (item) { return item.length > 0; });
    }, [reportInsights]);
    var summaryStats = useMemo(function () {
        var _a, _b, _c, _d;
        if (!reportInsights)
            return [];
        var stats = reportInsights.stats || {};
        return [
            {
                label: "Total Tickets",
                value: (_a = stats.total) !== null && _a !== void 0 ? _a : 0,
                hint: "Processed this period",
                accent: "bg-blue-50 text-blue-700 border-blue-200"
            },
            {
                label: "Resolved",
                value: (_b = stats.resolved) !== null && _b !== void 0 ? _b : 0,
                hint: "Closed successfully",
                accent: "bg-emerald-50 text-emerald-700 border-emerald-200"
            },
            {
                label: "Pending",
                value: (_c = stats.pending) !== null && _c !== void 0 ? _c : 0,
                hint: "Awaiting action",
                accent: "bg-amber-50 text-amber-700 border-amber-200"
            },
            {
                label: "Urgent",
                value: (_d = stats.urgent) !== null && _d !== void 0 ? _d : 0,
                hint: "Requires priority response",
                accent: "bg-rose-50 text-rose-700 border-rose-200"
            }
        ];
    }, [reportInsights]);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Reports</h1>
            <p className="text-sm text-slate-500">
              Automated summaries and insights from complaint data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={function () { return refetch(); }} disabled={isLoading} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2">
            <RefreshCcw className={"w-4 h-4 ".concat(isLoading ? "animate-spin" : "")}/>
            <span>Refresh</span>
          </button>
          <button onClick={function () {
            console.log("Generate Now clicked");
            generateMutation.mutate();
        }} disabled={generateMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Sparkles className={"w-4 h-4 ".concat(generateMutation.isPending ? "animate-spin" : "")}/>
            <span>{generateMutation.isPending ? "Generating..." : "Generate Now"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{reports.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600"/>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Latest Report</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {reports[0] ? formatDate(reports[0].created_at) : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600"/>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Report Period</p>
                <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">
                  {((_a = reports[0]) === null || _a === void 0 ? void 0 : _a.period) || "Weekly"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600"/>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardTitle>Generated Reports</CardTitle>
        <CardBody>
          {error ? (<div className="text-center py-12">
              <FileText className="w-16 h-16 text-red-300 mx-auto mb-4"/>
              <p className="text-red-600 font-medium">Failed to load reports</p>
              <p className="text-sm text-slate-500 mt-1">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
              <button onClick={function () { return refetch(); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Try Again
              </button>
            </div>) : isLoading ? (<div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-slate-500 mt-3">Loading reports...</p>
            </div>) : reports.length === 0 ? (<div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4"/>
              <p className="text-slate-600 font-medium">No reports generated yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Click "Generate Now" to create your first weekly report
              </p>
            </div>) : (<div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Report ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Created At
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      From Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      To Date
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(function (report) { return (<tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-slate-900">#{report.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700 capitalize">{report.period}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">
                          {formatDateTime(report.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(report.from_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(report.to_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={function () { return handleViewReport(report); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View report">
                            <Eye className="w-4 h-4"/>
                          </button>
                          <button onClick={function () { return handleDownloadReport(report, "html"); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Download HTML">
                            <Download className="w-4 h-4"/>
                          </button>
                          <button onClick={function () {
                    setReportToDelete(report);
                    setIsDeleteConfirmOpen(true);
                }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete report">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>); })}
                </tbody>
              </table>
            </div>)}
        </CardBody>
      </Card>

      {/* Report Modal */}
      {isModalOpen && selectedReport && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Weekly Report #{selectedReport.id}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(selectedReport.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select value={contentFormat} onChange={function (e) {
                var format = e.target.value;
                setContentFormat(format);
                if (selectedReport) {
                    void loadReportContent(selectedReport, format);
                }
            }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="html">HTML</option>
                  <option value="text">Plain Text</option>
                </select>
                <button onClick={function () { return setIsModalOpen(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reportInsights && (<section className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800">AI Executive Summary</h4>
                      {reportInsights.periodLabel && (<p className="text-sm text-slate-500">Period: {reportInsights.periodLabel}</p>)}
                    </div>
                    {reportInsights.generatedAt && (<p className="text-xs text-slate-400 font-medium">
                        Generated {formatDateTime(reportInsights.generatedAt)}
                      </p>)}
                  </div>

                  {summaryParagraphs.length > 0 && (<div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm text-slate-700">
                      {summaryParagraphs.map(function (paragraph, index) { return (<p key={index}>{paragraph}</p>); })}
                    </div>)}

                  {summaryStats.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {summaryStats.map(function (item) { return (<div key={item.label} className={"rounded-xl border ".concat(item.accent, " p-4 shadow-sm")}>
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-bold">{item.value}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.hint}</p>
                        </div>); })}
                    </div>)}

                  {reportInsights.topCategories.length > 0 && (<div className="rounded-xl border border-slate-200 p-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">Top Categories</h5>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {reportInsights.topCategories.map(function (entry) { return (<li key={entry.category} className="flex items-center justify-between">
                            <span>{entry.category}</span>
                            <span className="font-semibold">{entry.count}</span>
                          </li>); })}
                      </ul>
                    </div>)}

                  {reportInsights.focus.length > 0 && (<div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                      <h5 className="text-sm font-semibold text-purple-700 mb-2">Focus Areas</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-purple-800">
                        {reportInsights.focus.map(function (item) { return (<li key={item}>{item}</li>); })}
                      </ul>
                    </div>)}

                  {reportInsights.prevention.length > 0 && (<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <h5 className="text-sm font-semibold text-emerald-700 mb-2">Preventative Actions</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-800">
                        {reportInsights.prevention.map(function (item) { return (<li key={item}>{item}</li>); })}
                      </ul>
                    </div>)}

                  {reportInsights.keyIssues.length > 0 && (<div className="rounded-xl border border-slate-200 p-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-3">Key Issues</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Ticket</th>
                              <th className="px-3 py-2 text-left font-semibold">Category</th>
                              <th className="px-3 py-2 text-left font-semibold">Status</th>
                              <th className="px-3 py-2 text-left font-semibold">Issue</th>
                              <th className="px-3 py-2 text-left font-semibold">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportInsights.keyIssues.map(function (issue, index) { return (<tr key={"".concat(issue.complaint_id, "-").concat(index)} className="border-b border-slate-100 last:border-0">
                                <td className="px-3 py-2 font-mono text-xs text-slate-600">#{issue.complaint_id}</td>
                                <td className="px-3 py-2 text-slate-700">{issue.category}</td>
                                <td className="px-3 py-2 text-slate-600">{issue.status}</td>
                                <td className="px-3 py-2 text-slate-600">{issue.key_issue}</td>
                                <td className="px-3 py-2 text-slate-700 font-semibold">
                                  {Math.round(issue.probability * 100)}%
                                </td>
                              </tr>); })}
                          </tbody>
                        </table>
                      </div>
                    </div>)}
                </section>)}

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {isContentLoading ? (<div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
                    Loading report content...
                  </div>) : contentFormat === "html" ? (reportContent ? (<div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reportContent }}/>) : (<p className="text-sm text-slate-500">No HTML content available for this report.</p>)) : (<pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                    {reportContent || "No plain text content available."}
                  </pre>)}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button onClick={function () { return handleDownloadReport(selectedReport, contentFormat); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <Download className="w-4 h-4"/>
                <span>Download {contentFormat.toUpperCase()}</span>
              </button>
              <button onClick={function () { return setIsModalOpen(false); }} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>)}

      <ConfirmDialog isOpen={isDeleteConfirmOpen} title="Delete Report?" message={"Are you sure you want to delete report #".concat(reportToDelete === null || reportToDelete === void 0 ? void 0 : reportToDelete.id, "? This action cannot be undone.")} confirmText="Delete" cancelText="Cancel" variant="danger" onConfirm={function () {
            if (reportToDelete) {
                var targetId = reportToDelete.id;
                setIsDeleteConfirmOpen(false);
                setReportToDelete(null);
                deleteMutation.mutate(targetId);
            }
        }} onCancel={function () {
            setIsDeleteConfirmOpen(false);
            setReportToDelete(null);
        }}/>
    </div>);
};
export default ReportsPage;
