import { useEffect, useId, useState, useRef } from "react";
import { Card, CardBody, CardTitle } from "./Card";
var STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
var ChangeStatusModal = function (_a) {
    var open = _a.open, _b = _a.currentStatus, currentStatus = _b === void 0 ? "Pending" : _b, _c = _a.currentCategory, currentCategory = _c === void 0 ? "Unclassified" : _c, _d = _a.currentPriority, currentPriority = _d === void 0 ? "normal" : _d, categories = _a.categories, ticketId = _a.ticketId, onClose = _a.onClose, onSave = _a.onSave;
    var _e = useState(currentStatus), status = _e[0], setStatus = _e[1];
    var _f = useState(currentCategory), category = _f[0], setCategory = _f[1];
    var _g = useState(currentPriority), priority = _g[0], setPriority = _g[1];
    var titleId = useId();
    var containerRef = useRef(null);
    var firstFieldRef = useRef(null);
    useEffect(function () {
        setStatus(currentStatus);
    }, [currentStatus]);
    useEffect(function () {
        setCategory(currentCategory || "Unclassified");
    }, [currentCategory]);
    useEffect(function () {
        setPriority(currentPriority || "normal");
    }, [currentPriority]);
    // Close on Escape
    useEffect(function () {
        if (!open)
            return;
        var onKey = function (e) {
            if (e.key === "Escape")
                onClose();
            if (e.key === "Enter")
                onSave(status, category, priority);
        };
        window.addEventListener("keydown", onKey);
        return function () { return window.removeEventListener("keydown", onKey); };
    }, [open, status, category, priority, onClose, onSave]);
    // Autofocus first field
    useEffect(function () {
        var _a;
        if (open)
            (_a = firstFieldRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, [open]);
    var onBackdropClick = function (e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    var hasChanges = status !== currentStatus || category !== currentCategory || priority !== currentPriority;
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={onBackdropClick}>
      <div ref={containerRef} className="w-full max-w-md">
        <Card>
          <CardTitle id={titleId}>Change Status {ticketId ? "#".concat(ticketId) : ""}</CardTitle>
          <CardBody className="space-y-4">
            <p className="text-xs text-slate-500">Only changed fields will be saved. Press Esc to cancel.</p>
            <label className="text-sm text-slate-600">
              New Status
              <select ref={firstFieldRef} value={status} onChange={function (e) { return setStatus(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                {STATUS_OPTIONS.map(function (opt) { return (<option key={opt} value={opt}>
                    {opt}
                  </option>); })}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Department
              <select value={category} onChange={function (e) { return setCategory(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                {(categories && categories.length ? categories : ["HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"]).map(function (opt) { return (<option key={opt} value={opt}>
                    {opt}
                  </option>); })}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Priority
              <select value={priority} onChange={function (e) { return setPriority(e.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm">
                {["normal", "urgent"].map(function (opt) { return (<option key={opt} value={opt}>
                    {opt === "urgent" ? "Urgent" : "Normal"}
                  </option>); })}
              </select>
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={function () { return onSave(status, category, priority); }} disabled={!hasChanges} className={"rounded-lg px-4 py-2 text-sm font-semibold text-white ".concat(hasChanges ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed")}>
                Save
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>);
};
export default ChangeStatusModal;
