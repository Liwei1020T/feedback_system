import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock4,
  FileText,
  Loader2,
  MessageCircle,
  SlidersHorizontal,
  Pencil
} from "lucide-react";

import {
  getDashboardStats,
  getPlants,
  listComplaints,
  updateComplaint
} from "../api";
import type {
  Complaint,
  ComplaintKind,
  ComplaintStatus,
  PaginatedResult,
  Priority
} from "../types";
import { Card, CardBody, CardTitle } from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import EditComplaintModal from "../components/EditComplaintModal";
import ChangeStatusModal from "../components/ChangeStatusModal";
import StatCard from "../components/StatCard";
import SearchFilterBar, { SearchFilters } from "../components/SearchFilterBar";
import { useToastStore } from "../store/toast";

const STATUS_OPTIONS: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];
const PRIORITY_OPTIONS: Priority[] = ["normal", "urgent"];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const KIND_TABS: Array<{
  value: "all" | "complaint" | "feedback";
  label: string;
  icon: typeof AlertTriangle;
  accent: string;
}> = [
  { value: "all", label: "All", icon: FileText, accent: "bg-slate-100 text-slate-700" },
  { value: "complaint", label: "Complaints", icon: AlertTriangle, accent: "bg-rose-100 text-rose-700" },
  { value: "feedback", label: "Feedback", icon: MessageCircle, accent: "bg-blue-100 text-blue-700" }
];

interface UpdateComplaintVariables {
  id: number;
  updates: Partial<Complaint>;
  meta?: {
    silent?: boolean;
    overrideMessage?: string;
  };
}

const createToastId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const ensureNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) {
    return value.slice(0, 10);
  }
  return value;
};

const startOfDayISO = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`).toISOString();
};

const endOfDayISO = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T23:59:59.999`).toISOString();
};

const AllFeedbackPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const searchParam = searchParams.get("search") ?? "";
  const kindParam = (searchParams.get("kind") as "all" | "complaint" | "feedback") ?? "all";
  const plantParam = searchParams.get("plant") ?? "";
  const priorityParam = searchParams.get("priority") ?? "";
  const statusParam = (searchParams.get("status") as ComplaintStatus | null) ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const sortParam = searchParams.get("sort") ?? "date";
  const orderParamRaw = searchParams.get("order") ?? (sortParam === "priority" ? "asc" : "desc");

  const page = ensureNumber(searchParams.get("page"), 1);
  const pageSize = ensureNumber(searchParams.get("pageSize"), 10);
  const orderParam = orderParamRaw === "asc" ? "asc" : "desc";
  const normalizedSort = sortParam === "priority" ? "priority" : "date";

  const complaintsQueryKey = useMemo(
    () => [
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
    ],
    [
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
    ]
  );

  const complaintFilters = useMemo(
    () => ({
      page,
      pageSize,
      sort: (normalizedSort === "priority" ? "priority" : "created_at") as "priority" | "created_at",
      order: (orderParam === "asc" ? "asc" : "desc") as "asc" | "desc",
      search: searchParam.trim() ? searchParam.trim() : undefined,
      kind: kindParam === "all" ? undefined : (kindParam as ComplaintKind),
      category: categoryParam || undefined,
      status: statusParam ? (statusParam as ComplaintStatus) : undefined,
      priority: priorityParam ? (priorityParam as Priority) : undefined,
      plant: plantParam || undefined,
      fromDate: fromParam ? startOfDayISO(fromParam) : undefined,
      toDate: toParam ? endOfDayISO(toParam) : undefined
    }),
    [
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
    ]
  );

  const { data: complaintsPage, isLoading: complaintsLoading } = useQuery<PaginatedResult<Complaint>>({
    queryKey: complaintsQueryKey,
    queryFn: () => listComplaints(complaintFilters)
  });

  const complaints = (complaintsPage as PaginatedResult<Complaint> | undefined)?.items ?? [];
  const paginationMeta = (complaintsPage as PaginatedResult<Complaint> | undefined)?.meta;

  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats
  });

  const { data: plantsData } = useQuery({
    queryKey: ["plants"],
    queryFn: getPlants
  });
  const plants = plantsData ?? [];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Complaint | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    feedbackId: number;
    updates: { category: string; status: ComplaintStatus; priority: Priority };
    changes: string[];
    variant: "danger" | "warning" | "info" | "success";
  } | null>(null);

  // Simple status change modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Complaint | null>(null);

  useEffect(() => {
    if (!isEditModalOpen) {
      setPendingUpdate(null);
      setIsConfirmOpen(false);
    }
  }, [isEditModalOpen]);

  const stats = {
  total: (dashboardStats?.total_complaints ?? 0) + (dashboardStats?.total_feedback ?? 0),
    complaintCount: dashboardStats?.total_complaints ?? 0,
    feedbackCount: dashboardStats?.total_feedback ?? 0,
    pendingCount: dashboardStats?.pending ?? 0,
    inProgressCount: dashboardStats?.in_progress ?? 0,
    resolvedCount: dashboardStats?.resolved ?? 0
  };

  const categoryOptions = useMemo(() => {
    const categories =
      dashboardStats?.by_category && typeof dashboardStats.by_category === "object"
        ? Object.keys(dashboardStats.by_category).filter((key) => key && key.trim().length > 0)
        : [];
    const unique = Array.from(new Set(["All", ...categories]));
    return unique;
  }, [dashboardStats]);

  // Department choices for status modal (exclude "All")
  const departmentChoices = useMemo(
    () => categoryOptions.filter((c) => c && c !== "All"),
    [categoryOptions]
  );

  const searchFilters = useMemo<SearchFilters>(
    () => ({
      search: searchParam,
      status: statusParam || "All",
      priority: (priorityParam as Priority) || "All",
      kind: kindParam === "all" ? "All" : ((kindParam as ComplaintKind) ?? "All"),
      category: categoryParam || undefined,
      plant: plantParam || undefined,
      dateFrom: fromParam || undefined,
      dateTo: toParam || undefined
    }),
    [searchParam, statusParam, priorityParam, kindParam, categoryParam, plantParam, fromParam, toParam]
  );

  // Use new toast store instead of local state
  const toast = useToastStore();

  const updateParams = useCallback(
    (values: Record<string, string | null | undefined>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(values).forEach(([key, value]) => {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      if (options?.resetPage) {
        next.set("page", "1");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const updateComplaintMutation = useMutation<Complaint, unknown, UpdateComplaintVariables, {
    previousPage?: PaginatedResult<Complaint>;
    previousValues: Partial<Complaint>;
    complaintId: number;
  }>({
    mutationFn: ({ id, updates }) => updateComplaint(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: complaintsQueryKey });
      const previousPage = queryClient.getQueryData<PaginatedResult<Complaint>>(complaintsQueryKey);
      const previousItems = previousPage?.items ?? [];
      const currentItem = previousItems.find((item) => item.id == id) || null;
      const previousValues: Partial<Complaint> = {};
      Object.keys(updates).forEach((key) => {
        const typedKey = key as keyof Complaint;
        if (currentItem && typedKey in currentItem) {
          (previousValues as Record<string, any>)[typedKey] = currentItem[typedKey];
        }
      });
      if (previousPage) {
        const optimisticItems = previousItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
        queryClient.setQueryData(complaintsQueryKey, { ...previousPage, items: optimisticItems });
      }
      return { previousPage, previousValues, complaintId: id };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPage) {
        queryClient.setQueryData(complaintsQueryKey, context.previousPage);
      }
      toast.error("Update Failed", "Failed to update feedback");
    },
    onSuccess: (data, variables, context) => {
      if (context?.previousPage) {
        queryClient.setQueryData(complaintsQueryKey, (old?: PaginatedResult<Complaint>) => {
          if (!old) {
            return old;
          }
          const nextItems = old.items.map((item) => (item.id === data.id ? data : item));
          return { ...old, items: nextItems };
        });
      }
      if (!variables.meta?.silent) {
        toast.success("Feedback Updated", variables.meta?.overrideMessage ?? `Feedback #${data.id} updated`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: complaintsQueryKey });
      // Keep Urgent Cases view in sync when priority/status changes
      queryClient.invalidateQueries({ queryKey: ["complaints", "urgent"] });
    }
  });

  const handleEditButton = (feedback: Complaint) => {
    setEditTarget(feedback);
    setIsEditModalOpen(true);
  };

  const handleModalSave = (updates: { category: string; status: ComplaintStatus; priority: Priority }) => {
    if (!editTarget) {
      return;
    }

    const changes: string[] = [];
    if (updates.status !== editTarget.status) {
      changes.push(`Status: ${editTarget.status} → ${updates.status}`);
    }
    if (updates.priority !== editTarget.priority) {
      const fromPriority = editTarget.priority === "urgent" ? "Urgent" : "Normal";
      const toPriority = updates.priority === "urgent" ? "Urgent" : "Normal";
      changes.push(`Priority: ${fromPriority} → ${toPriority}`);
    }
    if (updates.category !== editTarget.category) {
      changes.push(`Category: ${editTarget.category} → ${updates.category}`);
    }

    if (changes.length === 0) {
      toast.info("No Changes", "Feedback remains unchanged.");
      return;
    }

    const variant: "danger" | "warning" | "info" | "success" =
      updates.status === "Resolved"
        ? "success"
        : updates.priority === "urgent" && editTarget.priority !== "urgent"
          ? "warning"
          : "info";

    setPendingUpdate({
      feedbackId: editTarget.id,
      updates,
      changes,
      variant
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (!pendingUpdate) {
      return;
    }
    updateComplaintMutation.mutate({
      id: pendingUpdate.feedbackId,
      updates: pendingUpdate.updates,
      meta: {
        overrideMessage: `Feedback #${pendingUpdate.feedbackId} updated (${pendingUpdate.changes.join(
          ", "
        )})`
      }
    });
    setIsConfirmOpen(false);
    setIsEditModalOpen(false);
    setPendingUpdate(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    // Keep modal open for further edits
  };

  const isMutating = updateComplaintMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="animate-slide-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          All Feedback
        </h1>
        <p className="text-slate-500 mt-2">View and manage all complaints and feedback in one place</p>
      </div>

      <div className="overflow-x-auto pb-2 -mx-6 px-6">
          <div className="grid grid-cols-7 gap-3 min-w-max">
            <StatCard label="Total" value={stats.total} icon={FileText} trend="Overall" />
            <StatCard label="Complaints" value={stats.complaintCount} icon={AlertTriangle} trend="Follow-up" accent="text-danger" />
            <StatCard label="Feedback" value={stats.feedbackCount} icon={MessageCircle} trend="Sentiments" accent="text-blue-600" />
            <StatCard label="Pending" value={stats.pendingCount} icon={Clock} trend="Awaiting" accent="text-warning" />
            <StatCard label="In Progress" value={stats.inProgressCount} icon={Clock4} trend="Being handled" accent="text-blue-600" />
            <StatCard label="Resolved" value={stats.resolvedCount} icon={CheckCircle2} trend="Closed" accent="text-success" />
            <StatCard label="Unclassified" value={dashboardStats?.unclassified ?? 0} icon={MessageCircle} trend="AI Review" accent="text-purple-500" />
          </div>
      </div>
      {/* New SearchFilterBar Component */}
      <SearchFilterBar
        filters={searchFilters}
        onFiltersChange={(newFilters) => {
          updateParams(
            {
              search:
                newFilters.search && newFilters.search.trim().length > 0
                  ? newFilters.search.trim()
                  : null,
              status: newFilters.status === "All" ? null : newFilters.status,
              priority: newFilters.priority === "All" ? null : newFilters.priority,
              kind: newFilters.kind === "All" ? null : newFilters.kind,
              category: newFilters.category || null,
              plant: newFilters.plant || null,
              from: newFilters.dateFrom || null,
              to: newFilters.dateTo || null
            },
            { resetPage: true }
          );
        }}
        showAdvancedFilters={true}
        placeholder="Search feedback by ID, email, or description..."
        categories={categoryOptions}
        plants={plants}
      />

      <Card>
        <CardBody className="space-y-6">
          {/* Sort and Page Size Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Sort by:</span>
              <button
                type="button"
                onClick={() => {
                  const nextSort = normalizedSort === "date" ? "priority" : "date";
                  const nextOrder = nextSort === "priority" ? "asc" : "desc";
                  updateParams({ sort: nextSort, order: nextOrder }, {});
                }}
                className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Change sort order"
              >
                {normalizedSort === "date" ? "Newest first" : "Priority (urgent first)"}
                <SlidersHorizontal className="ml-2 h-4 w-4 text-slate-500" aria-hidden="true" />
              </button>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
              <span className="font-medium">Page size:</span>
              <select
                value={pageSize}
                onChange={(event) => updateParams({ pageSize: event.target.value, page: "1" })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                aria-label="Change results per page"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {complaintsLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-8 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading feedback...
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No feedback matches the selected filters.</div>
            ) : (
              complaints.map((feedback) => {
                const KindIcon = feedback.kind === "complaint" ? AlertTriangle : MessageCircle;
                return (
                  <article
                    key={feedback.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/complaints/${feedback.id}`)}
                        className="flex-1 text-left"
                        aria-label={`View details for feedback #${feedback.id}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <KindIcon
                            className={`h-4 w-4 ${feedback.kind === "complaint" ? "text-rose-600" : "text-blue-600"}`}
                            aria-hidden="true"
                          />
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            feedback.kind === "complaint"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {feedback.kind === "complaint" ? "Complaint" : "Feedback"}
                          </span>
                          {(() => {
                            const cls =
                              feedback.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-700"
                                : feedback.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"; // Pending
                            return (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>
                                {feedback.status}
                              </span>
                            );
                          })()}
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              feedback.priority === "urgent"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
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
                          {feedback.plant && (
                            <div>
                              <dt className="sr-only">Plant</dt>
                              <dd>Plant {feedback.plant}</dd>
                            </div>
                          )}
                        </dl>
                      </button>

                      {/* Edit icon to change status */}
                      <div className="flex items-start gap-2 min-w-[40px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusTarget(feedback);
                            setIsStatusModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Change status"
                          aria-label="Change status"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
              <span>
                Page {paginationMeta.page} of {paginationMeta.totalPages} · {paginationMeta.total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    paginationMeta.page > 1 &&
                    updateParams({ page: String(paginationMeta.page - 1) })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
                  disabled={paginationMeta.page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    paginationMeta.page < paginationMeta.totalPages &&
                    updateParams({ page: String(paginationMeta.page + 1) })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
                  disabled={paginationMeta.page >= paginationMeta.totalPages}
                  aria-label="Next page"
                >
                  Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <EditComplaintModal
        open={isEditModalOpen}
        complaint={editTarget}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleModalSave}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Apply feedback updates?"
        message={
          pendingUpdate
            ? `Confirm the following changes:\n${pendingUpdate.changes
                .map((change) => `• ${change}`)
                .join("\n")}`
            : ""
        }
        confirmText="Apply changes"
        cancelText="Keep editing"
        variant={pendingUpdate?.variant ?? "info"}
        onConfirm={handleConfirmUpdate}
        onCancel={handleCancelConfirm}
      />

      {/* Simple Change Status modal */}
      <ChangeStatusModal
        open={isStatusModalOpen}
        currentStatus={statusTarget?.status}
        currentCategory={statusTarget?.category}
        categories={departmentChoices as string[]}
        currentPriority={statusTarget?.priority}
        ticketId={statusTarget?.id}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={(nextStatus, nextCategory, nextPriority) => {
          if (!statusTarget) return;
          updateComplaintMutation.mutate({
            id: statusTarget.id,
            updates: { status: nextStatus, category: nextCategory, priority: nextPriority },
            meta: { overrideMessage: `Feedback #${statusTarget.id} set to ${nextStatus} in ${nextCategory} (${nextPriority === "urgent" ? "Urgent" : "Normal"})` }
          });
          setIsStatusModalOpen(false);
          setStatusTarget(null);
        }}
      />

      {updateComplaintMutation.isPending && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Saving changes…
        </div>
      )}
    </div>
  );
};

export default AllFeedbackPage;
