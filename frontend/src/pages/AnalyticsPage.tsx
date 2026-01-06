import { useMemo, useState, useEffect } from "react";
import { 
  RefreshCcw, 
  Tag as TagIcon, 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Download,
  Activity,
  Target,
  Zap,
  Award,
  AlertCircle,
  Calendar,
  FileText,
  Filter,
  Bell,
  Sparkles,
  Lightbulb,
  Brain,
  Star,
  TrendingUpIcon,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

import { Card, CardBody, CardTitle } from "../components/Card";
import {
  getAdvancedAnalytics,
  getCategoryDeepDive,
  getDashboardStats,
  getTrendData,
  getRootCauseInsights
} from "../api";
import { analyzeAllComplaints, getDepartmentStats } from "../api";
 

 

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const AnalyticsPage = () => {
  // State management
  const [includePredictions, setIncludePredictions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  const queryClient = useQueryClient();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["department-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["advanced-analytics"] });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, queryClient]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats
  });

  // Trends not shown on page (panel removed)
  const { data: trends = [] } = useQuery({
    queryKey: ["trends"],
    queryFn: getTrendData
  });

  // Root cause insights (moved from Insights page)
  const { data: rootCauseData, isFetching: rootCauseLoading } = useQuery<RootCauseResponse>({
    queryKey: ["ai-root-causes"],
    queryFn: getRootCauseInsights
  });

 

  const {
    data: advancedAnalytics,
    isFetching: advancedLoading,
    refetch: refetchAdvancedAnalytics
  } = useQuery({
    queryKey: ["advanced-analytics", includePredictions],
    queryFn: () => getAdvancedAnalytics(includePredictions)
  });

  const {
    data: categoryDeepDive,
    isFetching: categoryDeepDiveLoading,
    isError: categoryDeepDiveError,
    error: categoryDeepDiveErrorValue
  } = useQuery({
    queryKey: ["category-deep-dive", selectedCategory],
    queryFn: () => getCategoryDeepDive(selectedCategory!),
    enabled: Boolean(selectedCategory)
  });

 

  const analyzeAllMutation = useMutation({
    mutationFn: () => analyzeAllComplaints(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complaints"] }),
        queryClient.invalidateQueries({ queryKey: ["advanced-analytics"] })
      ]);
      void refetchAdvancedAnalytics();
    }
  });

 

  const handleAdvancedRefresh = () => {
    void refetchAdvancedAnalytics();
  };

  const categoryDeepDiveErrorMessage = categoryDeepDiveError
    ? resolveErrorMessage(categoryDeepDiveErrorValue, "Unable to load category deep dive.")
    : null;

  // Department performance table
  const { data: departmentStats = [] } = useQuery({
    queryKey: ["department-stats"],
    queryFn: getDepartmentStats
  });

  // Weekly report panel removed from Analytics page.

  type DeptKey =
    | "department"
    | "total"
    | "resolved"
    | "pending"
    | "in_progress"
    | "resolution_rate"
    | "avg_resolution_time_hours"
    | "avg_first_response_hours"
    | "sla_breach_rate"
    | "reopen_rate"
    | "avg_backlog_age_hours";

  const [deptSort, setDeptSort] = useState<{ key: DeptKey; dir: "asc" | "desc" }>({ key: "department", dir: "asc" });
  const sortedDepartments = useMemo(() => {
    const data = [...departmentStats];
    const { key, dir } = deptSort;
    data.sort((a: any, b: any) => {
      const av = a[key];
      const bv = b[key];
      if (key === "department") {
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        return dir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
      }
      const an = Number(av) || 0;
      const bn = Number(bv) || 0;
      return dir === "asc" ? an - bn : bn - an;
    });
    return data;
  }, [departmentStats, deptSort]);

  const toggleDeptSort = (key: DeptKey) => {
    setDeptSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const exportDepartmentsCsv = () => {
    if (!departmentStats.length) return;
    const headers = [
      "Department",
      "Total",
      "Resolved",
      "Pending",
      "In Progress",
      "Resolution Rate",
      "Avg Resolution (h)",
      "Avg First Response (h)",
      "SLA Breach Rate",
      "Reopen Rate",
      "Avg Backlog Age (h)"
    ];
    const rows = departmentStats.map((r) => [
      r.department,
      r.total,
      r.resolved,
      r.pending,
      r.in_progress,
      r.resolution_rate.toFixed(1),
      r.avg_resolution_time_hours.toFixed(1),
      r.avg_first_response_hours.toFixed(1),
      r.sla_breach_rate.toFixed(1),
      r.reopen_rate.toFixed(1),
      r.avg_backlog_age_hours.toFixed(1)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "department_stats.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatRate = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(1)}%` : "—");
  const formatHours = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(1)}h` : "—");
  const formatDate = (value: string) => new Date(value).toLocaleDateString();
  const formatSentimentScore = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "Sentiment: —";
    }
    const normalized = Math.max(-1, Math.min(1, value));
    const tone = normalized > 0.2 ? "Positive" : normalized < -0.2 ? "Negative" : "Neutral";
    return `Sentiment: ${tone} (${(normalized * 100).toFixed(0)}%)`;
  };

  // Calculate KPIs
  const overallKPIs = useMemo(() => {
    if (!departmentStats.length) return null;
    
    const totalTickets = departmentStats.reduce((sum, d) => sum + d.total, 0);
    const totalResolved = departmentStats.reduce((sum, d) => sum + d.resolved, 0);
    const totalPending = departmentStats.reduce((sum, d) => sum + d.pending, 0);
    const totalInProgress = departmentStats.reduce((sum, d) => sum + d.in_progress, 0);
    
    const avgResolutionRate = departmentStats.reduce((sum, d) => sum + d.resolution_rate, 0) / departmentStats.length;
    const avgResponseTime = departmentStats.reduce((sum, d) => sum + d.avg_first_response_hours, 0) / departmentStats.length;
    const avgResolutionTime = departmentStats.reduce((sum, d) => sum + d.avg_resolution_time_hours, 0) / departmentStats.length;
    const avgSLABreach = departmentStats.reduce((sum, d) => sum + d.sla_breach_rate, 0) / departmentStats.length;
    const avgReopenRate = departmentStats.reduce((sum, d) => sum + d.reopen_rate, 0) / departmentStats.length;
    const avgBacklogAge = departmentStats.reduce((sum, d) => sum + d.avg_backlog_age_hours, 0) / departmentStats.length;
    
    return {
      totalTickets,
      totalResolved,
      totalPending,
      totalInProgress,
      resolutionRate: avgResolutionRate,
      responseTime: avgResponseTime,
      resolutionTime: avgResolutionTime,
      slaBreachRate: avgSLABreach,
      reopenRate: avgReopenRate,
      backlogAge: avgBacklogAge
    };
  }, [departmentStats]);

  // Prepare chart data
  const departmentChartData = useMemo(() => {
    return departmentStats.map(d => ({
      name: d.department,
      total: d.total,
      resolved: d.resolved,
      pending: d.pending,
      inProgress: d.in_progress,
      resolutionRate: d.resolution_rate,
      slaBreachRate: d.sla_breach_rate
    }));
  }, [departmentStats]);

  const statusDistribution = useMemo(() => {
    if (!departmentStats.length) return [];
    const total = departmentStats.reduce((sum, d) => sum + d.total, 0);
    const resolved = departmentStats.reduce((sum, d) => sum + d.resolved, 0);
    const pending = departmentStats.reduce((sum, d) => sum + d.pending, 0);
    const inProgress = departmentStats.reduce((sum, d) => sum + d.in_progress, 0);
    
    return [
      { name: 'Resolved', value: resolved, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
    ];
  }, [departmentStats]);

  // Find top and bottom performers
  const topPerformers = useMemo(() => {
    if (!departmentStats.length) return [];
    return [...departmentStats]
      .sort((a, b) => b.resolution_rate - a.resolution_rate)
      .slice(0, 3);
  }, [departmentStats]);

  const needsAttention = useMemo(() => {
    if (!departmentStats.length) return [];
    return [...departmentStats]
      .filter(d => d.sla_breach_rate > 20 || d.reopen_rate > 15 || d.avg_backlog_age_hours > 72)
      .sort((a, b) => b.sla_breach_rate - a.sla_breach_rate)
      .slice(0, 5);
  }, [departmentStats]);

  // Normalize root cause items for display
  const rootCauseItems = useMemo(() => {
    const complaints: any[] = []; // not needed for mapping here; kept for future joins
    if (!rootCauseData?.root_causes?.length) return [] as Array<{
      issue: string;
      count: number;
      departments: string[];
      severity: "high" | "medium" | "low";
      confidence: number;
      summary: string;
      recommendedActions: string[];
    }>;

    return rootCauseData.root_causes.map((cause) => {
      const normalizedSeverity = (cause.severity || "medium").toLowerCase() as "high" | "medium" | "low";
      let departments = (cause.departments || []).filter(Boolean);
      if (!departments.length) departments = ["Unassigned"];
      return {
        issue: cause.issue,
        count: cause.complaint_count,
        departments,
        severity: normalizedSeverity,
        confidence: Math.round((cause.confidence ?? 0.0) * 100),
        summary: cause.summary,
        recommendedActions: cause.recommended_actions || []
      };
    });
  }, [rootCauseData]);

  // Anomaly Detection - Critical Issues
  const anomalies = useMemo(() => {
    if (!departmentStats.length || !overallKPIs) return [];
    
    const criticalAnomalies = [];
    
    departmentStats.forEach(dept => {
      // Check for SLA breach spike (50% above average)
      if (dept.sla_breach_rate > overallKPIs.slaBreachRate * 1.5 && dept.sla_breach_rate > 15) {
        criticalAnomalies.push({
          department: dept.department,
          type: 'sla_breach',
          severity: 'critical',
          message: `SLA breach rate ${dept.sla_breach_rate.toFixed(1)}% (${((dept.sla_breach_rate / overallKPIs.slaBreachRate - 1) * 100).toFixed(0)}% above average)`,
          value: dept.sla_breach_rate
        });
      }
      
      // Check for high reopen rate
      if (dept.reopen_rate > 20) {
        criticalAnomalies.push({
          department: dept.department,
          type: 'reopen_rate',
          severity: dept.reopen_rate > 30 ? 'critical' : 'warning',
          message: `High reopen rate: ${dept.reopen_rate.toFixed(1)}%`,
          value: dept.reopen_rate
        });
      }
      
      // Check for backlog age (>5 days)
      if (dept.avg_backlog_age_hours > 120) {
        criticalAnomalies.push({
          department: dept.department,
          type: 'backlog_age',
          severity: dept.avg_backlog_age_hours > 168 ? 'critical' : 'warning', // 7 days critical
          message: `Aging backlog: ${(dept.avg_backlog_age_hours / 24).toFixed(1)} days`,
          value: dept.avg_backlog_age_hours
        });
      }
      
      // Check for low resolution rate
      if (dept.resolution_rate < 50 && dept.total > 5) {
        criticalAnomalies.push({
          department: dept.department,
          type: 'low_resolution',
          severity: dept.resolution_rate < 30 ? 'critical' : 'warning',
          message: `Low resolution rate: ${dept.resolution_rate.toFixed(1)}%`,
          value: dept.resolution_rate
        });
      }
    });
    
    return criticalAnomalies
      .sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        return b.value - a.value;
      })
      .slice(0, 5); // Top 5 anomalies
  }, [departmentStats, overallKPIs]);

  const trendChartData = useMemo(() => {
    return trends.map(t => ({
      date: t.period ? new Date(t.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      complaints: t.total || 0
    }));
  }, [trends]);

  const COLORS = {
    resolved: '#0d9488', // Teal
    inProgress: '#3b82f6', // Blue
    pending: '#f59e0b', // Amber
    danger: '#ef4444',
    purple: '#8b5cf6',
    slate: '#64748b'
  };

  // Advanced Analytics Data Processing
  const categoryMetrics = useMemo(() => {
    if (!advancedAnalytics?.category_metrics) return [];
    return advancedAnalytics.category_metrics.map(cat => ({
      category: cat.category,
      total: cat.count || 0,
      resolutionRate: cat.resolution_rate || 0,
      trend: cat.trending || 'stable'
    }));
  }, [advancedAnalytics]);

  // AI Insights - Smart Pattern Recognition
  const aiInsights = useMemo(() => {
    if (!advancedAnalytics?.category_metrics || !departmentStats.length) return null;

    // Identify trending issues (increasing complaints)
    const trendingIssues = advancedAnalytics.category_metrics
      .filter(cat => cat.trending === 'up' && cat.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Identify critical categories (high volume + low resolution + negative sentiment)
    const criticalCategories = advancedAnalytics.category_metrics
      .filter(cat => 
        cat.count > 5 && 
        cat.resolution_rate < 60 && 
        cat.avg_sentiment_score < -0.2
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate sentiment trend
    const avgSentiment = advancedAnalytics.category_metrics.length > 0
      ? advancedAnalytics.category_metrics.reduce((sum, cat) => sum + cat.avg_sentiment_score, 0) / 
        advancedAnalytics.category_metrics.length
      : 0;

    // Identify departments at risk (based on multiple factors)
    const atRiskDepartments = departmentStats
      .filter(dept => 
        (dept.sla_breach_rate > 15 && dept.reopen_rate > 10) ||
        (dept.avg_backlog_age_hours > 96) ||
        (dept.resolution_rate < 50 && dept.total > 3)
      )
      .sort((a, b) => b.sla_breach_rate - a.sla_breach_rate)
      .slice(0, 3);

    // Generate AI recommendations
    const recommendations = [];
    
    if (trendingIssues.length > 0) {
      recommendations.push({
        type: 'trending',
        priority: 'high',
        message: `${trendingIssues[0].category} complaints increasing by trend analysis`,
        action: `Review recent ${trendingIssues[0].category} tickets for common patterns`,
        icon: 'trending'
      });
    }

    if (criticalCategories.length > 0) {
      recommendations.push({
        type: 'critical',
        priority: 'urgent',
        message: `${criticalCategories[0].category} showing poor performance`,
        action: `Allocate additional resources to ${criticalCategories[0].category} (${criticalCategories[0].count} tickets, ${criticalCategories[0].resolution_rate.toFixed(0)}% resolved)`,
        icon: 'alert'
      });
    }

    if (atRiskDepartments.length > 0) {
      recommendations.push({
        type: 'department',
        priority: 'high',
        message: `${atRiskDepartments[0].department} department needs attention`,
        action: `SLA breach at ${atRiskDepartments[0].sla_breach_rate.toFixed(1)}% - consider workload redistribution`,
        icon: 'users'
      });
    }

    if (avgSentiment < -0.3) {
      recommendations.push({
        type: 'sentiment',
        priority: 'medium',
        message: 'Overall customer sentiment is declining',
        action: 'Review response templates and resolution quality',
        icon: 'alert'
      });
    }

    return {
      trendingIssues,
      criticalCategories,
      atRiskDepartments,
      avgSentiment,
      recommendations: recommendations.slice(0, 4),
      lastAnalyzed: new Date().toISOString()
    };
  }, [advancedAnalytics, departmentStats]);

  // Predictive Analytics - Enhanced from backend
  const predictions = useMemo(() => {
    if (!advancedAnalytics?.predictive_insights) return null;

    const insights = advancedAnalytics.predictive_insights;
    
    return {
      nextWeekVolume: insights.predicted_volume_next_week || 0,
      highRiskCategories: insights.high_risk_categories || [],
      emergingIssues: insights.emerging_issues || [],
      recommendedStaffing: insights.recommended_staffing || {},
      weekOverWeekChange: overallKPIs 
        ? ((insights.predicted_volume_next_week || 0) / (overallKPIs.totalTickets || 1) - 1) * 100
        : 0
    };
  }, [advancedAnalytics, overallKPIs]);


  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Enhanced Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Performance Analytics
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Real-time insights • Predictive intelligence • Management dashboard
                    {autoRefresh && <span className="ml-2 inline-flex items-center gap-1 text-green-600"><Bell className="w-3 h-3 animate-pulse" /> Live</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition shadow-sm ${
                  autoRefresh 
                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title={autoRefresh ? "Auto-refresh enabled (30s)" : "Auto-refresh disabled"}
              >
                <Bell className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Live' : 'Manual'}
              </button>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition shadow-sm ${
                  showFilters 
                    ? 'border-blue-300 bg-blue-50 text-blue-700' 
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              <button
                onClick={handleAdvancedRefresh}
                disabled={advancedLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
              >
                <RefreshCcw className={`w-4 h-4 ${advancedLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => analyzeAllMutation.mutate()}
                disabled={analyzeAllMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition shadow-md"
              >
                <Zap className={`w-4 h-4 ${analyzeAllMutation.isPending ? 'animate-pulse' : ''}`} />
                {analyzeAllMutation.isPending ? "Analyzing..." : "AI Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 animate-slideInFromLeft">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-slate-600 font-medium">to</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quick Ranges</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateRange({
                      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    })}
                    className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDateRange({
                      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    })}
                    className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setDateRange({
                      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    })}
                    className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    void queryClient.invalidateQueries({ queryKey: ["department-stats"] });
                    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly Detection Alerts */}
        {anomalies.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-600 rounded-lg p-5 shadow-md animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                    Critical Anomalies Detected
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{anomalies.length}</span>
                  </h3>
                  <span className="text-xs text-red-700 font-semibold">Requires Immediate Attention</span>
                </div>
                <div className="space-y-2">
                  {anomalies.map((anomaly, index) => (
                    <div
                      key={`${anomaly.department}-${anomaly.type}-${index}`}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-red-200 hover:border-red-400 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          anomaly.severity === 'critical' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-900">{anomaly.department}</span>
                        <span className="text-sm text-slate-600">{anomaly.message}</span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(anomaly.department)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        View Details →
                      </button>
                    </div>
                  ))}
                </div>
                {anomalies.length > 0 && (
                  <p className="text-xs text-red-700 mt-3 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    These departments are showing unusual patterns and may require immediate intervention
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Executive KPIs - Enhanced Design */}
        {overallKPIs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                {overallKPIs.resolutionRate >= 70 ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Healthy
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    Alert
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-slate-900">{overallKPIs.totalTickets}</p>
              <p className="text-xs text-slate-600 mt-2">
                <span className="font-semibold text-green-600">{overallKPIs.totalResolved}</span> resolved • 
                <span className="font-semibold text-orange-600 ml-1">{overallKPIs.totalPending}</span> pending
              </p>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  overallKPIs.resolutionRate >= 80 ? 'bg-green-50 text-green-700' :
                  overallKPIs.resolutionRate >= 60 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {overallKPIs.resolutionRate >= 80 ? 'Excellent' : overallKPIs.resolutionRate >= 60 ? 'Good' : 'Poor'}
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Resolution Rate</p>
              <p className="text-3xl font-bold text-slate-900">{overallKPIs.resolutionRate.toFixed(1)}%</p>
              <div className="mt-2 bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    overallKPIs.resolutionRate >= 70 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(overallKPIs.resolutionRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                {overallKPIs.responseTime <= 24 ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    On Track
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Delayed
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-slate-900">{overallKPIs.responseTime.toFixed(1)}<span className="text-lg text-slate-600">h</span></p>
              <p className="text-xs text-slate-600 mt-2">Target: <span className="font-semibold">24h</span></p>
            </div>

            {/* SLA Compliance */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                {overallKPIs.slaBreachRate <= 10 ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Compliant
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    Risk
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">SLA Compliance</p>
              <p className="text-3xl font-bold text-slate-900">{(100 - overallKPIs.slaBreachRate).toFixed(1)}%</p>
              <p className="text-xs text-slate-600 mt-2">
                Breach rate: <span className={`font-semibold ${overallKPIs.slaBreachRate <= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallKPIs.slaBreachRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        )}

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume Trend */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Ticket Volume Trend (Last 30 Days)
            </div>
          </CardTitle>
          <CardBody>
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No trend data available</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Status Distribution
            </div>
          </CardTitle>
          <CardBody>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No distribution data available</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* SLA Performance Breakdown */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              SLA Performance Breakdown
            </div>
          </CardTitle>
          <CardBody>
            {overallKPIs ? (
              <div className="space-y-5">
                {/* Overall SLA Compliance */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">Overall SLA Compliance</span>
                    <span className={`text-2xl font-bold ${
                      (100 - overallKPIs.slaBreachRate) >= 95 ? 'text-green-600' :
                      (100 - overallKPIs.slaBreachRate) >= 85 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {(100 - overallKPIs.slaBreachRate).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        (100 - overallKPIs.slaBreachRate) >= 95 ? 'bg-green-500' :
                        (100 - overallKPIs.slaBreachRate) >= 85 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${100 - overallKPIs.slaBreachRate}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                    <span>Target: 95%</span>
                    <span className={
                      (100 - overallKPIs.slaBreachRate) >= 95 ? 'text-green-600 font-semibold' : 
                      'text-red-600 font-semibold'
                    }>
                      {(100 - overallKPIs.slaBreachRate) >= 95 ? '✓ Target Met' : '✗ Below Target'}
                    </span>
                  </div>
                </div>

                {/* First Response SLA */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-slate-700">First Response Time SLA</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {overallKPIs.responseTime < 24 ? '92%' : overallKPIs.responseTime < 48 ? '78%' : '65%'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${overallKPIs.responseTime < 24 ? '92%' : overallKPIs.responseTime < 48 ? '78%' : '65%'}` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-600">Avg: {overallKPIs.responseTime.toFixed(1)}h</span>
                    <span className="text-xs text-slate-600">Target: &lt;24h</span>
                  </div>
                </div>

                {/* Resolution Time SLA */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-slate-700">Resolution Time SLA</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {overallKPIs.resolutionRate >= 80 ? '88%' : overallKPIs.resolutionRate >= 60 ? '72%' : '58%'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${overallKPIs.resolutionRate >= 80 ? '88%' : overallKPIs.resolutionRate >= 60 ? '72%' : '58%'}` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-600">Avg: {overallKPIs.resolutionTime.toFixed(1)}h</span>
                    <span className="text-xs text-slate-600">Target: &lt;72h</span>
                  </div>
                </div>

                {/* Backlog Age SLA */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-slate-700">Backlog Age SLA</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {overallKPIs.backlogAge < 48 ? '95%' : overallKPIs.backlogAge < 96 ? '75%' : '55%'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${overallKPIs.backlogAge < 48 ? '95%' : overallKPIs.backlogAge < 96 ? '75%' : '55%'}` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-600">Avg: {(overallKPIs.backlogAge / 24).toFixed(1)} days</span>
                    <span className="text-xs text-slate-600">Target: &lt;48h</span>
                  </div>
                </div>

                {/* SLA Summary */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{departmentStats.filter(d => d.sla_breach_rate < 10).length}</p>
                      <p className="text-xs text-slate-600 mt-1">Excellent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{departmentStats.filter(d => d.sla_breach_rate >= 10 && d.sla_breach_rate < 20).length}</p>
                      <p className="text-xs text-slate-600 mt-1">Needs Work</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{departmentStats.filter(d => d.sla_breach_rate >= 20).length}</p>
                      <p className="text-xs text-slate-600 mt-1">Critical</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>Loading SLA metrics...</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Department Performance Comparison */}
        <Card className="lg:col-span-2">
          <CardTitle>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Department Performance Comparison
            </div>
          </CardTitle>
          <CardBody>
            {departmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="resolved" fill="#0d9488" name="Resolved" />
                  <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No department data available</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top Performers & Areas Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Top Performing Departments
            </div>
          </CardTitle>
          <CardBody>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((dept, index) => (
                  <div 
                    key={dept.department} 
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{dept.department}</p>
                        <p className="text-xs text-gray-600">{dept.total} total tickets</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700">{dept.resolution_rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">Resolution Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">No performance data available</p>
            )}
          </CardBody>
        </Card>

        {/* Areas Needing Attention */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Departments Needing Attention
            </div>
          </CardTitle>
          <CardBody>
            {needsAttention.length > 0 ? (
              <div className="space-y-3">
                {needsAttention.map((dept) => (
                  <div 
                    key={dept.department} 
                    className="p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{dept.department}</p>
                      <button
                        onClick={() => setSelectedCategory(dept.department)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {dept.sla_breach_rate > 20 && (
                        <div className="bg-white px-2 py-1 rounded">
                          <p className="text-gray-600">SLA Breach</p>
                          <p className="font-semibold text-red-600">{dept.sla_breach_rate.toFixed(1)}%</p>
                        </div>
                      )}
                      {dept.reopen_rate > 15 && (
                        <div className="bg-white px-2 py-1 rounded">
                          <p className="text-gray-600">Reopen Rate</p>
                          <p className="font-semibold text-orange-600">{dept.reopen_rate.toFixed(1)}%</p>
                        </div>
                      )}
                      {dept.avg_backlog_age_hours > 72 && (
                        <div className="bg-white px-2 py-1 rounded">
                          <p className="text-gray-600">Backlog Age</p>
                          <p className="font-semibold text-red-600">{(dept.avg_backlog_age_hours / 24).toFixed(1)}d</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">All departments performing well!</p>
                <p className="text-xs text-gray-600 mt-1">No critical issues detected</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Detailed Department Performance Table */}
      {/* Detailed Department Performance Table */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <span>Detailed Department Metrics</span>
            <button
              onClick={exportDepartmentsCsv}
              disabled={departmentStats.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </CardTitle>
        <CardBody>
          {departmentStats.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No department data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left sticky left-0 bg-slate-50 z-10">
                      <button onClick={() => toggleDeptSort("department")} className="font-semibold hover:text-blue-600 transition">
                        Department {deptSort.key === "department" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("total")} className="font-semibold hover:text-blue-600 transition">
                        Total {deptSort.key === "total" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("resolved")} className="font-semibold hover:text-blue-600 transition">
                        Resolved {deptSort.key === "resolved" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("pending")} className="font-semibold hover:text-blue-600 transition">
                        Pending {deptSort.key === "pending" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("in_progress")} className="font-semibold hover:text-blue-600 transition">
                        In Progress {deptSort.key === "in_progress" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("resolution_rate")} className="font-semibold hover:text-blue-600 transition">
                        Resolution % {deptSort.key === "resolution_rate" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("avg_resolution_time_hours")} className="font-semibold hover:text-blue-600 transition">
                        Avg Resolution {deptSort.key === "avg_resolution_time_hours" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button onClick={() => toggleDeptSort("avg_first_response_hours")} className="font-semibold hover:text-blue-600 transition">
                        Avg Response {deptSort.key === "avg_first_response_hours" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleDeptSort("sla_breach_rate")}
                        className="font-semibold hover:text-blue-600 transition"
                        title="Percent of resolved tickets that exceeded SLA thresholds"
                      >
                        SLA Breach % {deptSort.key === "sla_breach_rate" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleDeptSort("reopen_rate")}
                        className="font-semibold hover:text-blue-600 transition"
                        title="Percent of resolved tickets that were reopened"
                      >
                        Reopen % {deptSort.key === "reopen_rate" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleDeptSort("avg_backlog_age_hours")}
                        className="font-semibold hover:text-blue-600 transition"
                        title="Average age of open tickets"
                      >
                        Backlog Age {deptSort.key === "avg_backlog_age_hours" ? (deptSort.dir === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDepartments.map((row) => (
                    <tr key={row.department} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white hover:bg-slate-50 z-10">
                        <button
                          onClick={() => setSelectedCategory(row.department)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          title="Click for detailed analysis"
                        >
                          {row.department}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{row.total}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row.resolved}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {row.pending}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {row.in_progress}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.resolution_rate >= 70 ? 'text-green-600' : row.resolution_rate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                          {row.resolution_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{row.avg_resolution_time_hours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-right text-slate-700">{row.avg_first_response_hours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.sla_breach_rate <= 10 ? 'text-green-600' : row.sla_breach_rate <= 20 ? 'text-orange-600' : 'text-red-600'}`}>
                          {row.sla_breach_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.reopen_rate <= 5 ? 'text-green-600' : row.reopen_rate <= 15 ? 'text-orange-600' : 'text-red-600'}`}>
                          {row.reopen_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.avg_backlog_age_hours <= 48 ? 'text-green-600' : row.avg_backlog_age_hours <= 72 ? 'text-orange-600' : 'text-red-600'}`}>
                          {(row.avg_backlog_age_hours / 24).toFixed(1)}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Root Cause Analysis (moved from AI Insights) */}
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

      {/* AI-Powered Advanced Analytics */}
      {advancedAnalytics && (
        <Card>
          <CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span>AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-normal text-slate-600">
                  <input
                    type="checkbox"
                    checked={includePredictions}
                    onChange={() => setIncludePredictions(!includePredictions)}
                    className="rounded border-slate-300"
                  />
                  Include Predictions
                </label>
              </div>
            </div>
          </CardTitle>
          <CardBody>
            {advancedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Category Performance Metrics */}
                {advancedAnalytics.category_metrics && advancedAnalytics.category_metrics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Category Performance Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {advancedAnalytics.category_metrics.map((cat) => (
                        <button
                          key={cat.category}
                          onClick={() => setSelectedCategory(cat.category)}
                          className="text-left bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{cat.category}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{cat.count} tickets</p>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              cat.trending === 'up' ? 'bg-orange-100 text-orange-700' :
                              cat.trending === 'down' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {cat.trending === 'up' ? 'Increasing' : cat.trending === 'down' ? 'Decreasing' : 'Stable'}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <p className="text-slate-600">Resolution</p>
                              <p className={`font-bold ${
                                cat.resolution_rate >= 70 ? 'text-green-600' :
                                cat.resolution_rate >= 50 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {cat.resolution_rate.toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Avg Sentiment</p>
                              <p className={`font-bold ${
                                cat.avg_sentiment_score > 0 ? 'text-green-600' :
                                cat.avg_sentiment_score < 0 ? 'text-red-600' :
                                'text-slate-600'
                              }`}>
                                {cat.avg_sentiment_score.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predictive Insights */}
                {includePredictions && advancedAnalytics.predictive_insights && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Predictive Insights</h3>
                        <p className="text-xs text-slate-600">AI-powered forecasts and recommendations</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Expected Volume Next Week</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {advancedAnalytics.predictive_insights.predicted_volume_next_week || 0}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Based on historical trends</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-600 mb-1">High Risk Categories</p>
                        <p className="text-2xl font-bold text-red-600">
                          {advancedAnalytics.predictive_insights.high_risk_categories?.length || 0}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Requiring immediate attention</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Emerging Issues</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {advancedAnalytics.predictive_insights.emerging_issues?.length || 0}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">New patterns detected</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* AI Intelligence Dashboard - NEW */}
      {aiInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommendations */}
          <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
            <CardTitle>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI-Powered Recommendations
                  </span>
                  <p className="text-xs text-slate-600 font-normal mt-0.5">
                    Smart insights based on pattern analysis
                  </p>
                </div>
              </div>
            </CardTitle>
            <CardBody>
              <div className="space-y-3">
                {aiInsights.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-xl p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${
                      rec.priority === 'urgent' ? 'border-red-500' :
                      rec.priority === 'high' ? 'border-orange-500' :
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        rec.priority === 'urgent' ? 'bg-red-100' :
                        rec.priority === 'high' ? 'bg-orange-100' :
                        'bg-blue-100'
                      }`}>
                        {rec.icon === 'trending' && <TrendingUp className={`w-5 h-5 ${
                          rec.priority === 'urgent' ? 'text-red-600' :
                          rec.priority === 'high' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />}
                        {rec.icon === 'alert' && <AlertTriangle className={`w-5 h-5 ${
                          rec.priority === 'urgent' ? 'text-red-600' :
                          rec.priority === 'high' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />}
                        {rec.icon === 'users' && <Users className={`w-5 h-5 ${
                          rec.priority === 'urgent' ? 'text-red-600' :
                          rec.priority === 'high' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                            rec.priority === 'urgent' ? 'bg-red-600 text-white' :
                            rec.priority === 'high' ? 'bg-orange-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {rec.priority}
                          </span>
                          <p className="font-semibold text-slate-900 text-sm">{rec.message}</p>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {aiInsights.recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">All systems performing well!</p>
                    <p className="text-sm text-slate-600 mt-1">No critical recommendations at this time</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Analyzed {aiInsights.lastAnalyzed ? new Date(aiInsights.lastAnalyzed).toLocaleTimeString() : 'recently'}
                    </span>
                    <span className="font-semibold text-purple-600">
                      AI Confidence: High
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Predictive Workload Forecast */}
          {predictions && (
            <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-blue-200">
              <CardTitle>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                    <TrendingUpIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      7-Day Workload Forecast
                    </span>
                    <p className="text-xs text-slate-600 font-normal mt-0.5">
                      Predictive analytics for resource planning
                    </p>
                  </div>
                </div>
              </CardTitle>
              <CardBody>
                <div className="space-y-5">
                  {/* Volume Prediction */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Expected Ticket Volume</p>
                        <p className="text-xs text-slate-600 mt-1">Next 7 days prediction</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {predictions.nextWeekVolume}
                        </p>
                        <div className={`flex items-center gap-1 justify-end mt-1 ${
                          predictions.weekOverWeekChange > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {predictions.weekOverWeekChange > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-bold">
                            {Math.abs(predictions.weekOverWeekChange).toFixed(1)}% WoW
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          predictions.weekOverWeekChange > 20 ? 'bg-red-500' :
                          predictions.weekOverWeekChange > 10 ? 'bg-orange-500' :
                          predictions.weekOverWeekChange > 0 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(predictions.weekOverWeekChange) * 5)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* High Risk Categories */}
                  {predictions.highRiskCategories.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-slate-900">High Risk Categories</h4>
                      </div>
                      <div className="space-y-2">
                        {predictions.highRiskCategories.map((category, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="font-medium text-slate-900">{category}</span>
                            </div>
                            <button
                              onClick={() => setSelectedCategory(category)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                            >
                              Investigate →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emerging Issues */}
                  {predictions.emergingIssues.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-semibold text-slate-900">Emerging Patterns</h4>
                      </div>
                      <div className="space-y-2">
                        {predictions.emergingIssues.slice(0, 3).map((issue, index) => {
                          const issueData = typeof issue === 'string' ? { category: issue } : issue;
                          return (
                            <div 
                              key={index}
                              className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm"
                            >
                              <div className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {issueData.category || String(issue)}
                                  </p>
                                  {'recent_count' in issueData && issueData.recent_count && (
                                    <p className="text-xs text-slate-600 mt-1">
                                      {issueData.recent_count} recent tickets • {issueData.severity} severity
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Summary */}
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border border-blue-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-700" />
                      <p className="text-sm font-semibold text-blue-900">AI Analysis Summary</p>
                    </div>
                    <p className="text-sm text-blue-800">
                      {predictions.weekOverWeekChange > 15 
                        ? `⚠️ Significant volume increase expected. Consider staffing adjustments.`
                        : predictions.weekOverWeekChange > 5
                        ? `📈 Moderate increase forecasted. Monitor closely.`
                        : predictions.weekOverWeekChange < -5
                        ? `📉 Volume decreasing. Good time for training and process improvements.`
                        : `✅ Stable workload expected. Maintain current operations.`
                      }
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Sentiment & Performance Intelligence */}
      {aiInsights && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardTitle>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>Sentiment & Performance Intelligence</span>
            </div>
          </CardTitle>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Sentiment */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Overall Sentiment</p>
                <div className="flex items-center justify-center mb-3">
                  <div className={`text-6xl font-bold ${
                    aiInsights.avgSentiment > 0.2 ? 'text-green-600' :
                    aiInsights.avgSentiment > -0.2 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {aiInsights.avgSentiment > 0.2 ? '😊' : 
                     aiInsights.avgSentiment > -0.2 ? '😐' : 
                     '😞'}
                  </div>
                </div>
                <p className="text-center text-sm text-slate-600">
                  Score: {aiInsights.avgSentiment.toFixed(2)}
                </p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                  <div 
                    className={`h-full rounded-full ${
                      aiInsights.avgSentiment > 0.2 ? 'bg-green-500' :
                      aiInsights.avgSentiment > -0.2 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${((aiInsights.avgSentiment + 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Trending Issues */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Trending Issues</p>
                <div className="space-y-2">
                  {aiInsights.trendingIssues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">{issue.category}</span>
                      </div>
                      <span className="text-xs font-bold text-orange-600">+{issue.count}</span>
                    </div>
                  ))}
                  {aiInsights.trendingIssues.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No trending issues</p>
                  )}
                </div>
              </div>

              {/* At-Risk Departments */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">At-Risk Departments</p>
                <div className="space-y-2">
                  {aiInsights.atRiskDepartments.map((dept, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dept.department}</span>
                        <span className="text-xs font-bold text-red-600">
                          {dept.sla_breach_rate.toFixed(0)}% SLA
                        </span>
                      </div>
                    </div>
                  ))}
                  {aiInsights.atRiskDepartments.length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                      <p className="text-sm text-slate-500">All departments healthy</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Enhanced Category Deep Dive Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
            {/* Modal Header - Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCategory} Department</h2>
                  <p className="text-sm text-blue-100 mt-0.5">Comprehensive Performance Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50">
              {categoryDeepDiveLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                  <p className="text-slate-600 font-medium">Loading department insights...</p>
                </div>
              ) : categoryDeepDiveErrorMessage ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 font-semibold text-lg">{categoryDeepDiveErrorMessage}</p>
                  <p className="text-slate-500 text-sm mt-2">Please try again or contact support</p>
                </div>
              ) : categoryDeepDive ? (
                <div className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Complaints Card */}
                    <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          categoryDeepDive.total_complaints > 10 ? 'bg-orange-100 text-orange-700' :
                          categoryDeepDive.total_complaints > 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {categoryDeepDive.total_complaints > 10 ? 'High' : 
                           categoryDeepDive.total_complaints > 5 ? 'Medium' : 'Low'} Volume
                        </span>
                      </div>
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Total Complaints</p>
                      <p className="text-3xl font-bold text-slate-900">{categoryDeepDive.total_complaints}</p>
                    </div>

                    {/* Resolution Time Card */}
                    <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Avg Resolution Time</p>
                      <p className="text-3xl font-bold text-slate-900">{formatHours(categoryDeepDive.avg_resolution_time_hours)}</p>
                    </div>

                    {/* SLA Breach Card */}
                    <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          (categoryDeepDive.sla_breach_rate ?? 0) > 20 ? 'bg-red-100 text-red-700' :
                          (categoryDeepDive.sla_breach_rate ?? 0) > 10 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {(categoryDeepDive.sla_breach_rate ?? 0) > 20 ? 'Critical' :
                           (categoryDeepDive.sla_breach_rate ?? 0) > 10 ? 'Warning' : 'Good'}
                        </span>
                      </div>
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">SLA Breach Rate</p>
                      <p className="text-3xl font-bold text-slate-900">{formatRate(categoryDeepDive.sla_breach_rate)}</p>
                    </div>

                    {/* Backlog Age Card */}
                    <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <AlertTriangle className={`w-5 h-5 ${
                          (categoryDeepDive.avg_backlog_age_hours ?? 0) > 72 ? 'text-red-600' :
                          (categoryDeepDive.avg_backlog_age_hours ?? 0) > 48 ? 'text-orange-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Avg Backlog Age</p>
                      <p className="text-3xl font-bold text-slate-900">{formatHours(categoryDeepDive.avg_backlog_age_hours)}</p>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sentiment Distribution Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Sentiment Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: categoryDeepDive.sentiment_distribution.positive || 0, color: '#0d9488' },
                              { name: 'Neutral', value: categoryDeepDive.sentiment_distribution.neutral || 0, color: '#94a3b8' },
                              { name: 'Negative', value: categoryDeepDive.sentiment_distribution.negative || 0, color: '#ef4444' }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {[
                              { name: 'Positive', value: categoryDeepDive.sentiment_distribution.positive || 0, color: '#0d9488' },
                              { name: 'Neutral', value: categoryDeepDive.sentiment_distribution.neutral || 0, color: '#94a3b8' },
                              { name: 'Negative', value: categoryDeepDive.sentiment_distribution.negative || 0, color: '#ef4444' }
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Service Metrics Comparison */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Service Metrics
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={[
                            { 
                              metric: 'Response', 
                              hours: categoryDeepDive.avg_first_response_hours || 0,
                              fill: '#3b82f6'
                            },
                            { 
                              metric: 'Resolution', 
                              hours: categoryDeepDive.avg_resolution_time_hours || 0,
                              fill: '#0d9488'
                            },
                            { 
                              metric: 'Backlog', 
                              hours: categoryDeepDive.avg_backlog_age_hours || 0,
                              fill: '#f59e0b'
                            }
                          ]}
                          layout="horizontal"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis type="category" dataKey="metric" stroke="#64748b" />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Duration']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                            {[
                              { fill: '#3b82f6' },
                              { fill: '#0d9488' },
                              { fill: '#f59e0b' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Trend Activity Chart */}
                  {categoryDeepDive.trends.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        7-Day Activity Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart
                          data={categoryDeepDive.trends.slice(-7).map(trend => ({
                            date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            complaints: trend.count,
                            resolution: trend.avg_resolution_time || 0
                          }))}
                        >
                          <defs>
                            <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="complaints" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorComplaints)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Performance Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Additional Metrics */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Performance Indicators
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">First Response Time</span>
                            <span className="text-lg font-bold text-blue-600">{formatHours(categoryDeepDive.avg_first_response_hours)}</span>
                          </div>
                          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((categoryDeepDive.avg_first_response_hours || 0) / 24) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Reopen Rate</span>
                            <span className="text-lg font-bold text-purple-600">{formatRate(categoryDeepDive.reopen_rate)}</span>
                          </div>
                          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${(categoryDeepDive.reopen_rate || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Tags Cloud */}
                    {categoryDeepDive.top_tags.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <TagIcon className="w-5 h-5 text-purple-600" />
                          Top Issue Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categoryDeepDive.top_tags.slice(0, 10).map((tag, index) => (
                            <span
                              key={tag.tag}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-md"
                              style={{
                                fontSize: `${Math.max(0.75, 1 - (index * 0.05))}rem`
                              }}
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag.tag}
                              <span className="ml-1 px-2 py-0.5 bg-purple-100 rounded-full text-xs font-bold">
                                {tag.count}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">No data available for this department.</p>
                  <p className="text-slate-400 text-sm mt-2">Try selecting a different department</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
import type { RootCauseResponse } from "../types";
