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
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, AlertCircle, Target, Activity, Lightbulb, BarChart3, MessageSquare, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { getDashboardStats, listComplaints, getSentimentMetrics, getAIRecommendations, getRootCauseInsights, getInsightsHeader, refreshAIInsights } from "../api";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "../store/toast";
import { Card, CardBody, CardTitle } from "../components/Card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
var COLORS = ["#3b82f6", "#0d9488", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];
var InsightsPage = function () {
    var queryClient = useQueryClient();
    var toast = useToastStore();
    var _a = useState(false), refreshing = _a[0], setRefreshing = _a[1];
    var stats = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: getDashboardStats
    }).data;
    var complaintsData = useQuery({
        queryKey: ["complaints", "recent"],
        queryFn: function () { return listComplaints({ page: 1, pageSize: 100, sort: "created_at", order: "desc" }); }
    }).data;
    // Fetch real sentiment metrics
    var sentimentMetrics = useQuery({
        queryKey: ["sentiment-metrics"],
        queryFn: function () { return getSentimentMetrics(30); }
    }).data;
    // Fetch AI recommendations
    var aiRecommendations = useQuery({
        queryKey: ["ai-recommendations"],
        queryFn: getAIRecommendations
    }).data;
    var _b = useQuery({
        queryKey: ["ai-root-causes"],
        queryFn: getRootCauseInsights
    }), rootCauseData = _b.data, rootCauseLoading = _b.isLoading;
    var insightsHeader = useQuery({
        queryKey: ["insights-header"],
        queryFn: getInsightsHeader
    }).data;
    var handleRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, e_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 3, 4, 5]);
                    setRefreshing(true);
                    return [4 /*yield*/, refreshAIInsights()];
                case 1:
                    result = _e.sent();
                    return [4 /*yield*/, Promise.all([
                            queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] }),
                            queryClient.invalidateQueries({ queryKey: ["ai-root-causes"] }),
                            queryClient.invalidateQueries({ queryKey: ["sentiment-metrics"] }),
                            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
                            queryClient.invalidateQueries({ queryKey: ["insights-header"] })
                        ])];
                case 2:
                    _e.sent();
                    toast.success("Insights Refreshed", "Updated ".concat((_b = (_a = result.recommendations) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : "", " recommendations and ").concat((_d = (_c = result.rootCauses) === null || _c === void 0 ? void 0 : _c.count) !== null && _d !== void 0 ? _d : "", " root causes."));
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _e.sent();
                    toast.error("Refresh Failed", e_1 instanceof Error ? e_1.message : "Unable to refresh insights");
                    return [3 /*break*/, 5];
                case 4:
                    setRefreshing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Periodic silent refresh every 10 minutes
    // Avoid spamming toasts; only manual refresh shows a toast
    useEffect(function () {
        var id = setInterval(function () {
            refreshAIInsights()
                .then(function () {
                queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
                queryClient.invalidateQueries({ queryKey: ["ai-root-causes"] });
                queryClient.invalidateQueries({ queryKey: ["sentiment-metrics"] });
                queryClient.invalidateQueries({ queryKey: ["insights-header"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            })
                .catch(function () { return void 0; });
        }, 10 * 60 * 1000);
        return function () { return clearInterval(id); };
    }, [queryClient]);
    var complaints = (complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.items) || [];
    // Use real sentiment trend data
    var sentimentData = useMemo(function () {
        if (!(sentimentMetrics === null || sentimentMetrics === void 0 ? void 0 : sentimentMetrics.trend))
            return [];
        return sentimentMetrics.trend.map(function (t) { return ({
            period: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: t.score
        }); });
    }, [sentimentMetrics]);
    // Category trend analysis
    var categoryTrend = useMemo(function () {
        if (!(stats === null || stats === void 0 ? void 0 : stats.by_category))
            return [];
        return Object.entries(stats.by_category)
            .map(function (_a) {
            var name = _a[0], count = _a[1];
            return ({ name: name, count: count, change: Math.floor(Math.random() * 30 - 10) });
        })
            .sort(function (a, b) { return b.count - a.count; });
    }, [stats]);
    // Use real AI recommendations (convert to predictions format)
    var predictions = useMemo(function () {
        if (!aiRecommendations)
            return [];
        return aiRecommendations.slice(0, 3).map(function (rec, idx) { return ({
            id: idx + 1,
            title: rec.title,
            description: rec.description,
            confidence: Math.round(rec.confidence * 100),
            impact: rec.priority,
            action: rec.impact
        }); });
    }, [aiRecommendations]);
    // Root Cause Analysis data
    var rootCauseItems = useMemo(function () {
        var _a;
        if (!((_a = rootCauseData === null || rootCauseData === void 0 ? void 0 : rootCauseData.root_causes) === null || _a === void 0 ? void 0 : _a.length))
            return [];
        return rootCauseData.root_causes.map(function (cause) {
            var _a;
            var normalizedSeverity = (cause.severity || "medium").toLowerCase();
            var departments = (cause.departments || []).filter(Boolean);
            var searchTerm = cause.issue ? cause.issue.toLowerCase() : "";
            if (!departments.length && complaints.length && searchTerm.length >= 3) {
                var matches = complaints.filter(function (complaint) {
                    return complaint.complaint_text &&
                        complaint.complaint_text.toLowerCase().includes(searchTerm);
                });
                var categories = Array.from(new Set(matches.map(function (complaint) { return complaint.category || "Unclassified"; })));
                if (categories.length) {
                    departments = categories;
                }
            }
            if (!departments.length) {
                departments = ["Unassigned"];
            }
            return {
                issue: cause.issue,
                count: cause.complaint_count,
                departments: departments,
                severity: normalizedSeverity,
                confidence: Math.round(((_a = cause.confidence) !== null && _a !== void 0 ? _a : 0.0) * 100),
                summary: cause.summary,
                recommendedActions: cause.recommended_actions
            };
        });
    }, [rootCauseData, complaints]);
    return (<div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="banner-gradient rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <Brain className="w-10 h-10"/>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">AI-Powered Insights</h1>
              <p className="text-indigo-100">Advanced analytics, predictions, and intelligent recommendations</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className={"inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition border border-white/30 bg-white/10 hover:bg-white/20 ".concat(refreshing ? "opacity-60 cursor-not-allowed" : "")}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
            {refreshing ? "Refreshing" : "Refresh Insights"}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Overall Sentiment</p>
              <p className="text-3xl font-bold text-blue-900">
                {sentimentMetrics ? "".concat(Math.round(sentimentMetrics.overall_score), "%") : "Loading..."}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {sentimentMetrics && sentimentMetrics.overall_score > 60 ? "Positive Trend" : "Needs Attention"}
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-500"/>
          </div>
        </Card>

        <Card className="bg-emerald-50 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">AI Confidence</p>
              <p className="text-3xl font-bold text-emerald-900">
                {insightsHeader ? "".concat(Math.round(insightsHeader.ai_confidence_percent), "%") : "--"}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Classification Accuracy</p>
            </div>
            <Target className="w-10 h-10 text-emerald-500"/>
          </div>
        </Card>

        <Card className="bg-amber-50 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">Patterns Detected</p>
              <p className="text-3xl font-bold text-amber-900">
                {insightsHeader ? insightsHeader.patterns_detected_count : 0}
              </p>
              <p className="text-xs text-amber-600 mt-1">This Month</p>
            </div>
            <Lightbulb className="w-10 h-10 text-amber-500"/>
          </div>
        </Card>

        <Card className="bg-purple-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Auto-Resolved</p>
              <p className="text-3xl font-bold text-purple-900">
                {insightsHeader ? insightsHeader.auto_resolved_count : 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">AI Assistance</p>
            </div>
            <Brain className="w-10 h-10 text-purple-500"/>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500"/>
              Sentiment Trend Analysis
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="period" stroke="#64748b" fontSize={12}/>
                <YAxis stroke="#64748b" fontSize={12}/>
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Sentiment Score"/>
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500"/>
              Category Volume & Trends
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12}/>
                <YAxis stroke="#64748b" fontSize={12}/>
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {categoryTrend.map(function (_, index) { return (<Cell key={"cell-".concat(index)} fill={COLORS[index % COLORS.length]}/>); })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* AI Predictions */}
      <Card className="border-2 border-indigo-200 bg-indigo-50">
        <CardTitle>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600"/>
            <span className="text-indigo-600">
              Predictive Analytics
            </span>
          </div>
        </CardTitle>
        <CardBody className="space-y-4">
          {predictions.length === 0 ? (<p className="text-sm text-slate-500">No AI recommendations available at the moment.</p>) : (predictions.map(function (prediction) { return (<div key={prediction.id} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-indigo-200 hover:shadow-lg transition-all cursor-pointer group">
                <div className={"p-3 rounded-xl ".concat(prediction.impact === "high" ? "bg-red-100" :
                prediction.impact === "medium" ? "bg-amber-100" : "bg-emerald-100")}>
                <AlertCircle className={"w-6 h-6 ".concat(prediction.impact === "high" ? "text-red-600" :
                prediction.impact === "medium" ? "text-amber-600" : "text-emerald-600")}/>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{prediction.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600">{prediction.confidence}% confidence</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3">{prediction.description}</p>
                <div className="flex items-center justify-between">
                  <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {prediction.action} →
                  </button>
                  <span className={"text-xs font-bold px-2 py-1 rounded-full ".concat(prediction.impact === "high" ? "bg-red-100 text-red-700" :
                prediction.impact === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                    {prediction.impact.toUpperCase()} IMPACT
                  </span>
                </div>
              </div>
              </div>); }))}
        </CardBody>
      </Card>

      {/* Root Cause Analysis */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500"/>
              Root Cause Analysis
            </div>
            {rootCauseData && (<span className="text-xs font-medium text-slate-500">
                {rootCauseData.source === "ai" ? "AI-generated" : "Heuristic insight"}
              </span>)}
          </div>
        </CardTitle>
        <CardBody>
          {rootCauseLoading ? (<div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin"/>
              Generating root cause insights...
            </div>) : rootCauseItems.length > 0 ? (<div className="space-y-3">
              {rootCauseItems.map(function (cause, idx) {
                var _a;
                return (<div key={"".concat(cause.issue, "-").concat(idx)} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group cursor-pointer">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={"w-2 h-12 rounded-full ".concat(cause.severity === "high"
                        ? "bg-red-500"
                        : cause.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500")}></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">{cause.issue}</h4>
                        <span className="text-xs font-medium text-slate-500">{cause.confidence}% confidence</span>
                      </div>
                      {cause.summary && (<p className="text-xs text-slate-600 leading-relaxed">{cause.summary}</p>)}
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MessageSquare className="w-3 h-3 text-slate-500"/>
                        <span>{cause.count} complaints</span>
                        <span className="text-slate-400">•</span>
                        <span>{cause.departments.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={"text-xs font-bold px-3 py-1 rounded-full ".concat(cause.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : cause.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700")}>
                      {cause.severity.toUpperCase()}
                    </span>
                    {((_a = cause.recommendedActions) === null || _a === void 0 ? void 0 : _a.length) > 0 && (<span className="block text-[11px] text-indigo-600 font-medium">
                        Next: {cause.recommendedActions[0]}
                      </span>)}
                  </div>
                </div>);
            })}
            </div>) : (<p className="text-sm text-slate-500">No critical root causes detected for the selected window.</p>)}
        </CardBody>
      </Card>
    </div>);
};
export default InsightsPage;
