import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, AlertCircle, Target, Activity, Lightbulb, BarChart3, MessageSquare, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { SentimentMetrics, AIRecommendation, RootCauseResponse, InsightsHeader } from "../types";
import { getDashboardStats, listComplaints, getSentimentMetrics, getAIRecommendations, getRootCauseInsights, getInsightsHeader, refreshAIInsights } from "../api";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "../store/toast";
import { Card, CardBody, CardTitle } from "../components/Card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#3b82f6", "#0d9488", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

const InsightsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats
  });

  const { data: complaintsData } = useQuery({
    queryKey: ["complaints", "recent"],
    queryFn: () => listComplaints({ page: 1, pageSize: 100, sort: "created_at", order: "desc" })
  });

  // Fetch real sentiment metrics
  const { data: sentimentMetrics } = useQuery<SentimentMetrics>({
    queryKey: ["sentiment-metrics"],
    queryFn: () => getSentimentMetrics(30)
  });

  // Fetch AI recommendations
  const { data: aiRecommendations } = useQuery<AIRecommendation[]>({
    queryKey: ["ai-recommendations"],
    queryFn: getAIRecommendations
  });

  const { data: rootCauseData, isLoading: rootCauseLoading } = useQuery<RootCauseResponse>({
    queryKey: ["ai-root-causes"],
    queryFn: getRootCauseInsights
  });

  const { data: insightsHeader } = useQuery<InsightsHeader>({
    queryKey: ["insights-header"],
    queryFn: getInsightsHeader
  });

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const result = await refreshAIInsights();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-root-causes"] }),
        queryClient.invalidateQueries({ queryKey: ["sentiment-metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["insights-header"] })
      ]);
      toast.success(
        "Insights Refreshed",
        `Updated ${result.recommendations?.count ?? ""} recommendations and ${result.rootCauses?.count ?? ""} root causes.`
      );
    } catch (e) {
      toast.error("Refresh Failed", e instanceof Error ? e.message : "Unable to refresh insights");
    } finally {
      setRefreshing(false);
    }
  };

  // Periodic silent refresh every 10 minutes
  // Avoid spamming toasts; only manual refresh shows a toast
  useEffect(() => {
    const id = setInterval(() => {
      refreshAIInsights()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
          queryClient.invalidateQueries({ queryKey: ["ai-root-causes"] });
          queryClient.invalidateQueries({ queryKey: ["sentiment-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["insights-header"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .catch(() => void 0);
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [queryClient]);

  const complaints = complaintsData?.items || [];

  // Use real sentiment trend data
  const sentimentData = useMemo(() => {
    if (!sentimentMetrics?.trend) return [];
    return sentimentMetrics.trend.map(t => ({
      period: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: t.score
    }));
  }, [sentimentMetrics]);

  // Category trend analysis
  const categoryTrend = useMemo(() => {
    if (!stats?.by_category) return [];
    return Object.entries(stats.by_category)
      .map(([name, count]) => ({ name, count: count as number, change: Math.floor(Math.random() * 30 - 10) }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Use real AI recommendations (convert to predictions format)
  const predictions = useMemo(() => {
    if (!aiRecommendations) return [];
    return aiRecommendations.slice(0, 3).map((rec, idx) => ({
      id: idx + 1,
      title: rec.title,
      description: rec.description,
      confidence: Math.round(rec.confidence * 100),
      impact: rec.priority,
      action: rec.impact
    }));
  }, [aiRecommendations]);

  // Root Cause Analysis data
  const rootCauseItems = useMemo(() => {
    if (!rootCauseData?.root_causes?.length) return [];

    return rootCauseData.root_causes.map((cause) => {
      const normalizedSeverity = (cause.severity || "medium").toLowerCase() as "high" | "medium" | "low";
      let departments = (cause.departments || []).filter(Boolean);
      const searchTerm = cause.issue ? cause.issue.toLowerCase() : "";

      if (!departments.length && complaints.length && searchTerm.length >= 3) {
        const matches = complaints.filter(
          (complaint) =>
            complaint.complaint_text &&
            complaint.complaint_text.toLowerCase().includes(searchTerm)
        );
        const categories = Array.from(
          new Set(matches.map((complaint) => complaint.category || "Unclassified"))
        );
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
        departments,
        severity: normalizedSeverity,
        confidence: Math.round((cause.confidence ?? 0.0) * 100),
        summary: cause.summary,
        recommendedActions: cause.recommended_actions
      };
    });
  }, [rootCauseData, complaints]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="banner-gradient rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <Brain className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">AI-Powered Insights</h1>
              <p className="text-indigo-100">Advanced analytics, predictions, and intelligent recommendations</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition border border-white/30 bg-white/10 hover:bg-white/20 ${refreshing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
                {sentimentMetrics ? `${Math.round(sentimentMetrics.overall_score)}%` : "Loading..."}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {sentimentMetrics && sentimentMetrics.overall_score > 60 ? "Positive Trend" : "Needs Attention"}
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-emerald-50 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">AI Confidence</p>
              <p className="text-3xl font-bold text-emerald-900">
                {insightsHeader ? `${Math.round(insightsHeader.ai_confidence_percent)}%` : "--"}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Classification Accuracy</p>
            </div>
            <Target className="w-10 h-10 text-emerald-500" />
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
            <Lightbulb className="w-10 h-10 text-amber-500" />
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
            <Brain className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Sentiment Trend Analysis
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Sentiment Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Category Volume & Trends
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {categoryTrend.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="text-indigo-600">
              Predictive Analytics
            </span>
          </div>
        </CardTitle>
        <CardBody className="space-y-4">
          {predictions.length === 0 ? (
            <p className="text-sm text-slate-500">No AI recommendations available at the moment.</p>
          ) : (
            predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="flex items-start gap-4 p-4 bg-white rounded-xl border border-indigo-200 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className={`p-3 rounded-xl ${
                prediction.impact === "high" ? "bg-red-100" :
                prediction.impact === "medium" ? "bg-amber-100" : "bg-emerald-100"
              }`}>
                <AlertCircle className={`w-6 h-6 ${
                  prediction.impact === "high" ? "text-red-600" :
                  prediction.impact === "medium" ? "text-amber-600" : "text-emerald-600"
                }`} />
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    prediction.impact === "high" ? "bg-red-100 text-red-700" :
                    prediction.impact === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {prediction.impact.toUpperCase()} IMPACT
                  </span>
                </div>
              </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Root Cause Analysis */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Root Cause Analysis
            </div>
            {rootCauseData && (
              <span className="text-xs font-medium text-slate-500">
                {rootCauseData.source === "ai" ? "AI-generated" : "Heuristic insight"}
              </span>
            )}
          </div>
        </CardTitle>
        <CardBody>
          {rootCauseLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating root cause insights...
            </div>
          ) : rootCauseItems.length > 0 ? (
            <div className="space-y-3">
              {rootCauseItems.map((cause, idx) => (
                <div
                  key={`${cause.issue}-${idx}`}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-2 h-12 rounded-full ${
                        cause.severity === "high"
                          ? "bg-red-500"
                          : cause.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    ></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">{cause.issue}</h4>
                        <span className="text-xs font-medium text-slate-500">{cause.confidence}% confidence</span>
                      </div>
                      {cause.summary && (
                        <p className="text-xs text-slate-600 leading-relaxed">{cause.summary}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MessageSquare className="w-3 h-3 text-slate-500" />
                        <span>{cause.count} complaints</span>
                        <span className="text-slate-400">•</span>
                        <span>{cause.departments.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        cause.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : cause.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {cause.severity.toUpperCase()}
                    </span>
                    {cause.recommendedActions?.length > 0 && (
                      <span className="block text-[11px] text-indigo-600 font-medium">
                        Next: {cause.recommendedActions[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No critical root causes detected for the selected window.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default InsightsPage;
