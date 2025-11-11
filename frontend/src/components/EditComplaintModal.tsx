import { useEffect, useId, useState } from "react";

import type { Complaint, ComplaintStatus, Priority } from "../types";
import { Card, CardBody, CardTitle } from "./Card";

interface EditComplaintModalProps {
  open: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  onSave: (updates: { category: string; status: ComplaintStatus; priority: Priority }) => void;
}

const STATUS_OPTIONS: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];
const PRIORITY_OPTIONS: Priority[] = ["normal", "urgent"];
const CATEGORY_OPTIONS = ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"];

const EditComplaintModal = ({ open, complaint, onClose, onSave }: EditComplaintModalProps) => {
  const [category, setCategory] = useState<string>("Unclassified");
  const [status, setStatus] = useState<ComplaintStatus>("Pending");
  const [priority, setPriority] = useState<Priority>("normal");
  const titleId = useId();

  useEffect(() => {
    if (complaint) {
      setCategory(complaint.category || "Unclassified");
      setStatus(complaint.status);
      setPriority(complaint.priority);
    }
  }, [complaint]);

  if (!open || !complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-xl">
        <Card>
          <CardTitle id={titleId}>Edit Ticket #{complaint.id}</CardTitle>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-slate-600">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
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
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600 md:col-span-2">
                Status
                <select
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
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave({ category, status, priority })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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

export default EditComplaintModal;
