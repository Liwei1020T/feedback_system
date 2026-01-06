import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  RefreshCcw,
  Eye,
  Sparkles,
  Trash2
} from "lucide-react";
import { getWeeklyReports, generateReport, getWeeklyReportContent, deleteReport } from "../api";
import { Card, CardBody, CardTitle } from "../components/Card";
import { useToastStore } from "../store/toast";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Report, ReportMetadata, ComplaintStatus, ComplaintKind } from "../types";

const ReportsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportContent, setReportContent] = useState<string>("");
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentFormat, setContentFormat] = useState<"html" | "text">("html");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Fetch weekly reports
  const { data: reports = [], isLoading, error, refetch } = useQuery({
    queryKey: ["weekly-reports"],
    queryFn: getWeeklyReports,
    retry: 1
  });

  // Show error if fetch failed
  if (error) {
    console.error("Error fetching reports:", error);
  }

  // Generate report now mutation
  const generateMutation = useMutation({
    mutationFn: () => generateReport("weekly"),
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
      toast.success("Report Generated", `Successfully generated report #${newReport.id}!`);
    },
    onError: (error: any) => {
      console.error("Failed to generate report:", error);
      const message = error?.response?.data?.detail || error?.message || "Failed to generate report";
      toast.error("Generation Failed", message);
    }
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: (reportId: number) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
      toast.success("Report Deleted", "Report has been successfully deleted");
      setIsDeleteConfirmOpen(false);
      setReportToDelete(null);
    },
    onError: (error: any) => {
      console.error("Failed to delete report:", error);
      const message = error?.response?.data?.detail || error?.message || "Failed to delete report";
      toast.error("Delete Failed", message);
    }
  });

  const loadReportContent = async (report: Report, format: "html" | "text") => {
    if (format === "html" && report.html_content) {
      setReportContent(report.html_content);
      return;
    }
    setIsContentLoading(true);
    setReportContent("");
    try {
      const content = await getWeeklyReportContent(report.id, format);
      setReportContent(content);
    } catch (error) {
      console.error("Failed to load report content:", error);
      toast.error("Load Failed", "Could not load report content");
      setReportContent("Failed to load report content");
    } finally {
      setIsContentLoading(false);
    }
  };

  const handleViewReport = async (report: Report) => {
    setContentFormat("html");
    setSelectedReport(report);
    setIsModalOpen(true);
    await loadReportContent(report, "html");
  };

  const handleDownloadReport = async (report: Report, format: "html" | "text") => {
    try {
      let content: string;
      if (format === "html") {
        content = report.html_content ?? reportContent;
        if (!content) {
          content = await getWeeklyReportContent(report.id, "html");
        }
      } else {
        content = await getWeeklyReportContent(report.id, "text");
      }
      const blob = new Blob([content], {
        type: format === "html" ? "text/html" : "text/plain"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-report-${report.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const reportInsights = useMemo(() => {
    if (!selectedReport?.metadata) return null;
    const meta = selectedReport.metadata as ReportMetadata;
    const statsMeta =
      meta.stats && typeof meta.stats === "object" ? (meta.stats as Record<string, number>) : {};
    const prevention = Array.isArray(meta.prevention_recommendations)
      ? meta.prevention_recommendations.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    const focus = Array.isArray(meta.focus_areas)
      ? meta.focus_areas.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    const keyIssues = Array.isArray(meta.key_issues)
      ? meta.key_issues.reduce<Array<ReportMetadata["key_issues"][number]>>((acc, issue) => {
          if (!issue || typeof issue !== "object") {
            return acc;
          }
        const complaintId = Number((issue as unknown as Record<string, unknown>).complaint_id ?? 0);
        const category = String((issue as unknown as Record<string, unknown>).category ?? "Unclassified");
        const rawStatus = String((issue as unknown as Record<string, unknown>).status ?? "Pending");
        const rawKind = String((issue as unknown as Record<string, unknown>).kind ?? "complaint");
        const status: ComplaintStatus =
          rawStatus === "In Progress" || rawStatus === "Resolved" ? rawStatus : "Pending";
        const keyIssue = String((issue as unknown as Record<string, unknown>).key_issue ?? "");
        const probabilityValue = Number((issue as unknown as Record<string, unknown>).probability ?? 0);
        const kind: ComplaintKind =
          rawKind === "feedback" ? "feedback" : "complaint";
        acc.push({
          complaint_id: complaintId,
          category,
          status,
          kind,
          key_issue: keyIssue,
            probability: Number.isFinite(probabilityValue) ? probabilityValue : 0
          });
          return acc;
        }, [])
      : [];
    const topCategories = Array.isArray(meta.top_categories)
      ? meta.top_categories.reduce<Array<{ category: string; count: number }>>((acc, entry) => {
          if (!entry || typeof entry !== "object") {
            return acc;
          }
          const category = String((entry as unknown as Record<string, unknown>).category ?? "");
          const count = Number((entry as unknown as Record<string, unknown>).count ?? 0);
          if (category) {
            acc.push({ category, count: Number.isFinite(count) ? count : 0 });
          }
          return acc;
        }, [])
      : [];
    const summaryRaw =
      (typeof meta.summary_plain === "string" && meta.summary_plain.trim()) ||
      (typeof meta.summary_markdown === "string" && meta.summary_markdown.trim()) ||
      "";
    return {
      periodLabel: typeof meta.period_label === "string" ? meta.period_label : undefined,
      generatedAt: typeof meta.generated_at === "string" ? meta.generated_at : undefined,
      stats: statsMeta,
      summary: summaryRaw,
      prevention,
      focus,
      keyIssues,
      topCategories
    };
  }, [selectedReport]);

  const summaryParagraphs = useMemo(() => {
    if (!reportInsights?.summary) return [];
    return reportInsights.summary
      .split(/\n+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [reportInsights]);

  const summaryStats = useMemo(() => {
    if (!reportInsights) return [];
    const stats = reportInsights.stats || {};
    return [
      {
        label: "Total Tickets",
        value: stats.total ?? 0,
        hint: "Processed this period",
        accent: "bg-blue-50 text-blue-700 border-blue-200"
      },
      {
        label: "Resolved",
        value: stats.resolved ?? 0,
        hint: "Closed successfully",
        accent: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      {
        label: "Pending",
        value: stats.pending ?? 0,
        hint: "Awaiting action",
        accent: "bg-amber-50 text-amber-700 border-amber-200"
      },
      {
        label: "Urgent",
        value: stats.urgent ?? 0,
        hint: "Requires priority response",
        accent: "bg-rose-50 text-rose-700 border-rose-200"
      }
    ];
  }, [reportInsights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Reports</h1>
            <p className="text-sm text-slate-500">
              Automated summaries and insights from complaint data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              console.log("Generate Now clicked");
              generateMutation.mutate();
            }}
            disabled={generateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
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
                <FileText className="w-6 h-6 text-blue-600" />
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
                <Calendar className="w-6 h-6 text-green-600" />
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
                  {reports[0]?.period || "Weekly"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardTitle>Generated Reports</CardTitle>
        <CardBody>
          {error ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Failed to load reports</p>
              <p className="text-sm text-slate-500 mt-1">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-slate-500 mt-3">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No reports generated yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Click "Generate Now" to create your first weekly report
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                          <button
                            onClick={() => handleViewReport(report)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report, "html")}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Download HTML"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setReportToDelete(report);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Report Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
                <select
                  value={contentFormat}
                  onChange={(e) => {
                    const format = e.target.value as "html" | "text";
                    setContentFormat(format);
                    if (selectedReport) {
                      void loadReportContent(selectedReport, format);
                    }
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="html">HTML</option>
                  <option value="text">Plain Text</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reportInsights && (
                <section className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800">AI Executive Summary</h4>
                      {reportInsights.periodLabel && (
                        <p className="text-sm text-slate-500">Period: {reportInsights.periodLabel}</p>
                      )}
                    </div>
                    {reportInsights.generatedAt && (
                      <p className="text-xs text-slate-400 font-medium">
                        Generated {formatDateTime(reportInsights.generatedAt)}
                      </p>
                    )}
                  </div>

                  {summaryParagraphs.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm text-slate-700">
                      {summaryParagraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {summaryStats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {summaryStats.map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl border ${item.accent} p-4 shadow-sm`}
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-bold">{item.value}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.hint}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {reportInsights.topCategories.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">Top Categories</h5>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {reportInsights.topCategories.map((entry) => (
                          <li key={entry.category} className="flex items-center justify-between">
                            <span>{entry.category}</span>
                            <span className="font-semibold">{entry.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportInsights.focus.length > 0 && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                      <h5 className="text-sm font-semibold text-purple-700 mb-2">Focus Areas</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-purple-800">
                        {reportInsights.focus.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportInsights.prevention.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <h5 className="text-sm font-semibold text-emerald-700 mb-2">Preventative Actions</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-800">
                        {reportInsights.prevention.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reportInsights.keyIssues.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-4">
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
                            {reportInsights.keyIssues.map((issue, index) => (
                              <tr
                                key={`${issue.complaint_id}-${index}`}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="px-3 py-2 font-mono text-xs text-slate-600">#{issue.complaint_id}</td>
                                <td className="px-3 py-2 text-slate-700">{issue.category}</td>
                                <td className="px-3 py-2 text-slate-600">{issue.status}</td>
                                <td className="px-3 py-2 text-slate-600">{issue.key_issue}</td>
                                <td className="px-3 py-2 text-slate-700 font-semibold">
                                  {Math.round(issue.probability * 100)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {isContentLoading ? (
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    Loading report content...
                  </div>
                ) : contentFormat === "html" ? (
                  reportContent ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: reportContent }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">No HTML content available for this report.</p>
                  )
                ) : (
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                    {reportContent || "No plain text content available."}
                  </pre>
                )}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => handleDownloadReport(selectedReport, contentFormat)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download {contentFormat.toUpperCase()}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Report?"
        message={`Are you sure you want to delete report #${reportToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (reportToDelete) {
            const targetId = reportToDelete.id;
            setIsDeleteConfirmOpen(false);
            setReportToDelete(null);
            deleteMutation.mutate(targetId);
          }
        }}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setReportToDelete(null);
        }}
      />
    </div>
  );
};

export default ReportsPage;
