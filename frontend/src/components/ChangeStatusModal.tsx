import { useEffect, useId, useState, useRef } from "react";
import type { ComplaintStatus, Priority } from "../types";
import { Card, CardBody, CardTitle } from "./Card";

interface ChangeStatusModalProps {
  open: boolean;
  currentStatus?: ComplaintStatus;
  ticketId?: number;
  onClose: () => void;
  // Department/category editing
  currentCategory?: string;
  categories?: string[];
  // Priority editing
  currentPriority?: Priority;
  onSave: (nextStatus: ComplaintStatus, nextCategory: string, nextPriority: Priority) => void;
}

const STATUS_OPTIONS: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];

const ChangeStatusModal = ({ open, currentStatus = "Pending", currentCategory = "Unclassified", currentPriority = "normal", categories, ticketId, onClose, onSave }: ChangeStatusModalProps) => {
  const [status, setStatus] = useState<ComplaintStatus>(currentStatus);
  const [category, setCategory] = useState<string>(currentCategory);
  const [priority, setPriority] = useState<Priority>(currentPriority);
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setCategory(currentCategory || "Unclassified");
  }, [currentCategory]);
  useEffect(() => {
    setPriority(currentPriority || "normal");
  }, [currentPriority]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onSave(status, category, priority);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, status, category, priority, onClose, onSave]);

  // Autofocus first field
  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasChanges =
    status !== currentStatus || category !== currentCategory || priority !== currentPriority;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={onBackdropClick}
    >
      <div ref={containerRef} className="w-full max-w-md">
        <Card>
          <CardTitle id={titleId}>Change Status {ticketId ? `#${ticketId}` : ""}</CardTitle>
          <CardBody className="space-y-4">
            <p className="text-xs text-slate-500">Only changed fields will be saved. Press Esc to cancel.</p>
            <label className="text-sm text-slate-600">
              New Status
              <select
                ref={firstFieldRef}
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Department
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {(categories && categories.length ? categories : ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"]).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {(["normal", "urgent"] as Priority[]).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "urgent" ? "Urgent" : "Normal"}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(status, category, priority)}
                disabled={!hasChanges}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  hasChanges ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
