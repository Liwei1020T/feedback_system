import { useEffect, useId, useState } from "react";
import { Card, CardBody, CardTitle } from "./Card";
var STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
var PRIORITY_OPTIONS = ["normal", "urgent"];
var CATEGORY_OPTIONS = ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"];
var EditComplaintModal = function (_a) {
    var open = _a.open, complaint = _a.complaint, onClose = _a.onClose, onSave = _a.onSave;
    var _b = useState("Unclassified"), category = _b[0], setCategory = _b[1];
    var _c = useState("Pending"), status = _c[0], setStatus = _c[1];
    var _d = useState("normal"), priority = _d[0], setPriority = _d[1];
    var titleId = useId();
    useEffect(function () {
        if (complaint) {
            setCategory(complaint.category || "Unclassified");
            setStatus(complaint.status);
            setPriority(complaint.priority);
        }
    }, [complaint]);
    if (!open || !complaint)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="w-full max-w-xl">
        <Card>
          <CardTitle id={titleId}>Edit Ticket #{complaint.id}</CardTitle>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-slate-600">
                Category
                <select value={category} onChange={function (e) { return setCategory(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                  {CATEGORY_OPTIONS.map(function (opt) { return (<option key={opt} value={opt}>
                      {opt}
                    </option>); })}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                Priority
                <select value={priority} onChange={function (e) { return setPriority(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                  {PRIORITY_OPTIONS.map(function (opt) { return (<option key={opt} value={opt}>
                      {opt}
                    </option>); })}
                </select>
              </label>
              <label className="text-sm text-slate-600 md:col-span-2">
                Status
                <select value={status} onChange={function (e) { return setStatus(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                  {STATUS_OPTIONS.map(function (opt) { return (<option key={opt} value={opt}>
                      {opt}
                    </option>); })}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
                Cancel
              </button>
              <button type="button" onClick={function () { return onSave({ category: category, status: status, priority: priority }); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
                Save
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>);
};
export default EditComplaintModal;
