import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Activity, Users, MessageSquare, Target, BarChart3, Zap, Brain, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getDashboardKpis, listComplaints, getTopCategories, getStatusDistribution, getAIRecommendations } from "../api";
import { Card, CardBody, CardTitle } from "../components/Card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
var COLORS = {
    blue: "#3b82f6",
    teal: "#0d9488",
    amber: "#f59e0b",
    red: "#ef4444",
    purple: "#a855f7",
    cyan: "#06b6d4",
    slate: "#64748b"
};
var SuperAdminDashboard = function () {
    var _a, _b, _c;
    var navigate = useNavigate();
    var _d = useState(false), showRecommendationsModal = _d[0], setShowRecommendationsModal = _d[1];
    var _e = useState(null), selectedRecommendation = _e[0], setSelectedRecommendation = _e[1];
    // Fetch dashboard statistics
    var _f = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: getDashboardStats
    }), stats = _f.data, isLoading = _f.isLoading;
    // Fetch KPIs
    var kpis = useQuery({
        queryKey: ["dashboard-kpis"],
        queryFn: function () { return getDashboardKpis(); }
    }).data;
    // Fetch recent complaints for trends
    var complaintsData = useQuery({
        queryKey: ["complaints", "recent"],
        queryFn: function () { return listComplaints({ page: 1, pageSize: 50, sort: "created_at", order: "desc" }); }
    }).data;
    // Fetch top categories
    var topCategories = useQuery({
        queryKey: ["top-categories"],
        queryFn: function () { return getTopCategories(6); }
    }).data;
    // Fetch status distribution
    var statusDistribution = useQuery({
        queryKey: ["status-distribution"],
        queryFn: getStatusDistribution
    }).data;
    var _g = useQuery({
        queryKey: ["ai-recommendations"],
        queryFn: getAIRecommendations
    }), _h = _g.data, aiRecommendations = _h === void 0 ? [] : _h, recommendationsLoading = _g.isLoading;
    var complaints = (complaintsData === null || complaintsData === void 0 ? void 0 : complaintsData.items) || [];
    // Calculate KPIs from backend data
    var totalComplaints = (kpis === null || kpis === void 0 ? void 0 : kpis.total_complaints) || 0;
    var resolutionRate = ((_a = kpis === null || kpis === void 0 ? void 0 : kpis.resolution_rate) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || "0";
    var urgentCount = (kpis === null || kpis === void 0 ? void 0 : kpis.urgent_cases) || 0;
    var avgResponseTime = kpis ? "".concat(kpis.avg_response_time_hours.toFixed(1), "h") : "0h";
    var slaCompliance = kpis ? "".concat(kpis.sla_compliance_rate.toFixed(1), "%") : "0%";
    // Top Categories Data
    var categoryData = useMemo(function () {
        return topCategories || [];
    }, [topCategories]);
    // Status Distribution Data
    var statusData = useMemo(function () {
        if (!statusDistribution)
            return [];
        return Object.entries(statusDistribution)
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            return ({ name: name, value: value });
        })
            .filter(function (item) { return item.value > 0; });
    }, [statusDistribution]);
    // Complaint Trend Data (Last 7 days)
    var trendData = useMemo(function () {
        var days = 7;
        var data = [];
        var now = new Date();
        var _loop_1 = function (i) {
            var date = new Date(now);
            date.setDate(date.getDate() - i);
            var dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            var dayComplaints = complaints.filter(function (c) {
                var createdDate = new Date(c.created_at);
                return createdDate.toDateString() === date.toDateString();
            });
            data.push({
                date: dateStr,
                complaints: dayComplaints.length,
                resolved: dayComplaints.filter(function (c) { return c.status === "Resolved"; }).length
            });
        };
        for (var i = days - 1; i >= 0; i--) {
            _loop_1(i);
        }
        return data;
    }, [complaints]);
    var fallbackRecommendations = [
        {
            id: "fallback_process",
            title: "Improve Response Time",
            description: "Average first-response time is over 18 hours. Stand up a rapid-response rotation to cut delays.",
            priority: "high",
            impact: "Could improve satisfaction by 15%",
            estimated_effort: "1-2 weeks",
            category: "process",
            confidence: 0.8,
            solution_steps: [
                "Audit first-response timestamps from the last month to spot bottlenecks.",
                "Create a rapid-response rotation so someone is always accountable for new tickets.",
                "Share SLA clocks in the team channel to maintain visibility on aging items."
            ]
        },
        {
            id: "fallback_resources",
            title: "Rebalance Workload",
            description: "Workload is uneven across admins. Rebalance assignments or add backup coverage for busy plants.",
            priority: "medium",
            impact: "Could reduce escalations by 20%",
            estimated_effort: "2-3 weeks",
            category: "resource",
            confidence: 0.72,
            solution_steps: [
                "Review workload metrics for each admin and identify overload hotspots.",
                "Redistribute or batch assignments to even out inflow by department.",
                "Schedule cross-training so backup owners can support peak periods."
            ]
        },
        {
            id: "fallback_communication",
            title: "Proactive Communications",
            description: "Increase status updates for long-running complaints to avoid negative sentiment spikes.",
            priority: "medium",
            impact: "Could improve sentiment by 10%",
            estimated_effort: "1 week",
            category: "communication",
            confidence: 0.76,
            solution_steps: [
                "Send personalized updates to employees with open complaints older than 3 days.",
                "Publish guidance on empathetic phrasing and escalation paths.",
                "Add a reminder in the case tracker to prompt follow-ups every 48 hours."
            ]
        },
        {
            id: "fallback_analysis",
            title: "Deep-Dive Root Cause",
            description: "Recurring payroll complaints suggest a systemic issue. Run a cross-team root-cause workshop.",
            priority: "low",
            impact: "Could reduce payroll complaints by 12%",
            estimated_effort: "3-4 weeks",
            category: "analysis",
            confidence: 0.7,
            solution_steps: [
                "Gather the most recent payroll complaint examples and classify the triggers.",
                "Host a problem-solving workshop with Payroll, HR, and IT stakeholders.",
                "Document agreed fixes and track implementation milestones."
            ]
        }
    ];
    var allRecommendations = (aiRecommendations && aiRecommendations.length > 0)
        ? aiRecommendations
        : fallbackRecommendations;
    var highlightRecommendations = allRecommendations.slice(0, 4);
    var priorityToSeverity = {
        high: "warning",
        medium: "info",
        low: "success"
    };
    var categoryToIcon = {
        process: TrendingUp,
        resource: Users,
        communication: MessageSquare,
        analysis: Target,
        sentiment: Activity,
        compliance: Clock,
        training: Brain,
        default: Brain
    };
    var activeRecommendation = (_b = selectedRecommendation !== null && selectedRecommendation !== void 0 ? selectedRecommendation : allRecommendations[0]) !== null && _b !== void 0 ? _b : null;
    var activeSeverity = activeRecommendation ? priorityToSeverity[activeRecommendation.priority] : null;
    var activeBadgeColor = activeSeverity === "warning"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : activeSeverity === "info"
            ? "bg-blue-100 text-blue-700 border-blue-200"
            : "bg-emerald-100 text-emerald-700 border-emerald-200";
    var ActiveInsightIcon = activeRecommendation
        ? (_c = categoryToIcon[activeRecommendation.category]) !== null && _c !== void 0 ? _c : categoryToIcon.default
        : categoryToIcon.default;
    var handleInsightClick = function (recommendation) {
        setSelectedRecommendation(recommendation);
        setShowRecommendationsModal(true);
    };
    var KPICard = function (_a) {
        var title = _a.title, value = _a.value, subtitle = _a.subtitle, Icon = _a.icon, trend = _a.trend, trendValue = _a.trendValue, _b = _a.color, color = _b === void 0 ? "blue" : _b;
        var colorClasses = {
            blue: "from-blue-500 to-blue-600",
            emerald: "from-emerald-500 to-emerald-600",
            amber: "from-amber-500 to-amber-600",
            red: "from-red-500 to-red-600",
            purple: "from-purple-500 to-purple-600"
        };
        return (<Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
            {trend && trendValue && (<div className={"flex items-center gap-1 mt-2 text-xs font-semibold ".concat(trend === "up" ? "text-emerald-600" : "text-red-600")}>
                {trend === "up" ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                <span>{trendValue}</span>
              </div>)}
          </div>
          <div className={"bg-gradient-to-br ".concat(colorClasses[color], " p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform")}>
            <Icon className="w-6 h-6 text-white"/>
          </div>
        </div>
      </Card>);
    };
    if (isLoading) {
        return (<div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>);
    }
    return (<div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="banner-gradient rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Super Admin Control Center</h1>
            <p className="text-blue-100">Complete system oversight and intelligent insights at your fingertips</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/30">
              <p className="text-sm font-medium text-blue-100">System Health</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-bold">All Systems Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Total Complaints" value={totalComplaints} subtitle="All time submissions" icon={MessageSquare} trend="up" trendValue="+8.2% this week" color="blue"/>
        <KPICard title="Resolution Rate" value={"".concat(resolutionRate, "%")} subtitle="Successfully resolved" icon={CheckCircle2} trend="up" trendValue="+3.5%" color="emerald"/>
        <KPICard title="Urgent Cases" value={urgentCount} subtitle="Require immediate attention" icon={AlertTriangle} color="red"/>
        <KPICard title="Avg Response Time" value={avgResponseTime} subtitle="First response time" icon={Clock} trend="down" trendValue="-12% faster" color="amber"/>
        <KPICard title="SLA Compliance" value={slaCompliance} subtitle="Meeting target deadlines" icon={Target} trend="up" trendValue="+2.1%" color="purple"/>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaint Trend Chart */}
        <Card className="lg:col-span-2">
          <CardTitle>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500"/>
              Complaint Trends (Last 7 Days)
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12}/>
                <YAxis stroke="#64748b" fontSize={12}/>
                <Tooltip contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}/>
                <Legend />
                <Line type="monotone" dataKey="complaints" stroke={COLORS.blue} strokeWidth={3} dot={{ fill: COLORS.blue, r: 4 }} activeDot={{ r: 6 }} name="Complaints"/>
                <Line type="monotone" dataKey="resolved" stroke={COLORS.teal} strokeWidth={3} dot={{ fill: COLORS.teal, r: 4 }} activeDot={{ r: 6 }} name="Resolved"/>
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardTitle>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500"/>
              Status Distribution
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={function (_a) {
        var name = _a.name, percent = _a.percent;
        return "".concat(name, ": ").concat((percent * 100).toFixed(0), "%");
    }} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map(function (_, index) { return (<Cell key={"cell-".concat(index)} fill={Object.values(COLORS)[index % Object.values(COLORS).length]}/>); })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Category Chart and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <Card className="lg:col-span-2">
          <CardTitle>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-500"/>
              Top Complaint Categories
            </div>
          </CardTitle>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12}/>
                <YAxis stroke="#64748b" fontSize={12}/>
                <Tooltip contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}/>
                <Bar dataKey="count" fill={COLORS.teal} radius={[8, 8, 0, 0]} name="Complaints"/>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-50">
          <CardTitle>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500"/>
              Quick Actions
            </div>
          </CardTitle>
          <CardBody className="space-y-3">
            <button onClick={function () { return navigate("/urgent"); }} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl transition-all group">
              <AlertTriangle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform"/>
              <div className="text-left">
                <p className="font-semibold text-sm text-slate-900">Urgent Complaints</p>
                <p className="text-xs text-slate-500">{urgentCount} pending</p>
              </div>
            </button>

            <button onClick={function () { return navigate("/insights"); }} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group">
              <Brain className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform"/>
              <div className="text-left">
                <p className="font-semibold text-sm text-slate-900">AI Insights</p>
                <p className="text-xs text-slate-500">View analytics</p>
              </div>
            </button>

            <button onClick={function () { return navigate("/reports"); }} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all group">
              <BarChart3 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform"/>
              <div className="text-left">
                <p className="font-semibold text-sm text-slate-900">Generate Report</p>
                <p className="text-xs text-slate-500">Weekly/Monthly</p>
              </div>
            </button>

            <button onClick={function () { return navigate("/departments"); }} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all group">
              <Users className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform"/>
              <div className="text-left">
                <p className="font-semibold text-sm text-slate-900">Manage Teams</p>
                <p className="text-xs text-slate-500">Departments & Staff</p>
              </div>
            </button>
          </CardBody>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="bg-indigo-50 border-2 border-indigo-200">
        <CardTitle>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600"/>
            <span className="text-indigo-600">
              AI-Powered Insights & Recommendations
            </span>
          </div>
        </CardTitle>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlightRecommendations.map(function (recommendation) {
            var _a;
            var severity = priorityToSeverity[recommendation.priority];
            var severityColors = {
                warning: "border-amber-300 bg-amber-50",
                info: "border-blue-300 bg-blue-50",
                success: "border-emerald-300 bg-emerald-50"
            }[severity];
            var iconColor = {
                warning: "text-amber-600",
                info: "text-blue-600",
                success: "text-emerald-600"
            }[severity];
            var InsightIcon = (_a = categoryToIcon[recommendation.category]) !== null && _a !== void 0 ? _a : categoryToIcon.default;
            return (<button key={recommendation.id} onClick={function () { return handleInsightClick(recommendation); }} className={"text-left p-4 rounded-xl border-2 ".concat(severityColors, " hover:shadow-lg transition-all group")}>
                  <div className="flex items-start gap-3">
                    <div className={"".concat(iconColor, " group-hover:scale-110 transition-transform")}>
                      <InsightIcon className="w-5 h-5"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-sm text-slate-900">{recommendation.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/70 text-slate-600 border border-white/60">
                          {recommendation.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{recommendation.description}</p>
                      <div className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                        Open action plan →
                      </div>
                    </div>
                  </div>
                </button>);
        })}
          </div>
        </CardBody>
      </Card>

      {showRecommendationsModal && (<div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-indigo-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AI Recommendations</h3>
                <p className="text-xs text-slate-500">
                  Prioritized actions generated from recent complaint patterns.
                </p>
              </div>
              <button onClick={function () {
                setShowRecommendationsModal(false);
                setSelectedRecommendation(null);
            }} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors" aria-label="Close recommendations">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] px-6 py-5 custom-scrollbar">
              {recommendationsLoading ? (<div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                  Loading recommendations...
                </div>) : !activeRecommendation ? (<div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                  Select a recommendation to view the action plan.
                </div>) : (<div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-indigo-600">
                        <ActiveInsightIcon className="w-5 h-5"/>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{activeRecommendation.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{activeRecommendation.description}</p>
                      </div>
                    </div>
                    <span className={"text-[11px] font-bold px-2 py-1 rounded-full border ".concat(activeBadgeColor)}>
                      Priority: {activeRecommendation.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                      <p className="font-semibold text-slate-700 mb-0.5">Impact</p>
                      <p>{activeRecommendation.impact}</p>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                      <p className="font-semibold text-slate-700 mb-0.5">Estimated Effort</p>
                      <p>{activeRecommendation.estimated_effort}</p>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
                      <p className="font-semibold text-slate-700 mb-0.5">Confidence</p>
                      <p>{Math.round(activeRecommendation.confidence * 100)}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      Action Plan
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700 list-disc pl-5">
                      {activeRecommendation.solution_steps && activeRecommendation.solution_steps.length > 0 ? (activeRecommendation.solution_steps.map(function (step, index) { return (<li key={index}>{step}</li>); })) : (<li>AI did not return specific steps. Define next actions with your team.</li>)}
                    </ul>
                  </div>
                </div>)}
            </div>
          </div>
        </div>)}
    </div>);
};
export default SuperAdminDashboard;
