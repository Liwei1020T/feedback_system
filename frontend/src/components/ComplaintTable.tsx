import { clsx } from "clsx";

import type { CategoryFilter, Complaint } from "../types";

interface PaginationControls {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface ComplaintTableProps {
  complaints: Complaint[];
  selectedId?: number;
  onSelect: (complaint: Complaint) => void;
  onFilterChange?: (category: CategoryFilter) => void;
  activeFilter?: CategoryFilter;
  title?: string;
  emptyMessage?: string;
  showKindBadge?: boolean;
  onEdit?: (complaint: Complaint) => void;
  pagination?: PaginationControls;
  loading?: boolean;
}

const statusColor: Record<Complaint["status"], string> = {
  Pending: "bg-warning/20 text-warning",
  "In Progress": "bg-primary/10 text-primary",
  Resolved: "bg-success/20 text-success"
};

const priorityColor: Record<Complaint["priority"], string> = {
  normal: "text-slate-500 bg-slate-100",
  urgent: "text-danger bg-danger/10"
};

const FILTER_OPTIONS: CategoryFilter[] = ["All", "HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"];

const ComplaintTable = ({
  complaints,
  selectedId,
  onSelect,
  onFilterChange,
  activeFilter = "All",
  title = "Complaints",
  emptyMessage = "No records found.",
  showKindBadge = false,
  onEdit,
  pagination,
  loading = false
}: ComplaintTableProps) => {
  const columnCount = onEdit ? 7 : 6;
  const from = pagination
    ? complaints.length === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const to = pagination
    ? complaints.length === 0
      ? 0
      : from + complaints.length - 1
    : 0;

  return (
  <div className="glass-card overflow-hidden animate-scale-in">
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100/50 bg-gradient-to-r from-white to-slate-50/50">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {onFilterChange && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Filter:</span>
          <select
            value={activeFilter}
            onChange={(event) => onFilterChange(event.target.value as CategoryFilter)}
            className="rounded-xl border-2 border-slate-200 px-3 py-1.5 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">
          <tr>
            <th className="px-6 py-4">Ticket</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Plant</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Created</th>
            {onEdit && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columnCount} className="px-6 py-12 text-center text-sm text-slate-500">
                Loading records...
              </td>
            </tr>
          ) : complaints.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-6 py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            complaints.map((complaint) => (
              <tr
                key={complaint.id}
                onClick={() => onSelect(complaint)}
                className={clsx(
                  "cursor-pointer border-t border-slate-100 transition-all hover:bg-blue-50/50 hover:shadow-sm",
                  selectedId === complaint.id && "bg-blue-100/50 shadow-inner"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="text-blue-600">#{complaint.id}</span>
                    {showKindBadge && (
                      <span
                        className={clsx(
                          "uppercase text-[10px] tracking-wide px-2.5 py-1 rounded-full border font-bold shadow-sm",
                          complaint.kind === "feedback"
                            ? "text-blue-600 border-blue-300 bg-blue-100"
                            : "text-slate-600 border-slate-300 bg-slate-100"
                        )}
                      >
                        {complaint.kind}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    {complaint.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {complaint.plant ?? "Unassigned"}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx("px-3 py-1.5 rounded-full text-xs font-bold shadow-sm", statusColor[complaint.status])}>
                    {complaint.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx("px-3 py-1.5 rounded-full text-xs font-bold shadow-sm", priorityColor[complaint.priority])}>
                    {complaint.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 font-medium">
                  {new Date(complaint.created_at).toLocaleString()}
                </td>
                {onEdit && (
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(complaint);
                      }}
                      title="Edit"
                      className="ml-auto block rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {pagination ? (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white/80">
        <p className="text-sm text-slate-500">
          {pagination.total === 0
            ? "No records"
            : `Showing ${from}-${to} of ${pagination.total}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </span>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.totalPages === 0 || pagination.page >= pagination.totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
    ) : null}
  </div>
  );
};

export default ComplaintTable;
