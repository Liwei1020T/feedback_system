import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listComplaints } from "../api";
import { Card, CardBody, CardTitle } from "../components/Card";
var UrgentPage = function () {
    var _a;
    var navigate = useNavigate();
    var _b = useQuery({
        queryKey: ["urgent-feedback"],
        queryFn: function () {
            return listComplaints({
                page: 1,
                pageSize: 100,
                sort: "created_at",
                order: "desc",
                priority: "urgent",
            });
        },
        staleTime: 15000,
        refetchOnWindowFocus: true,
    }), data = _b.data, isLoading = _b.isLoading, refetch = _b.refetch, isFetching = _b.isFetching;
    var items = (_a = data === null || data === void 0 ? void 0 : data.items) !== null && _a !== void 0 ? _a : [];
    var timeSince = function (date) {
        var diffMs = Date.now() - new Date(date).getTime();
        var h = Math.floor(diffMs / (1000 * 60 * 60));
        if (h < 1)
            return "Just now";
        if (h < 24)
            return "".concat(h, "h ago");
        var d = Math.floor(h / 24);
        return "".concat(d, "d ago");
    };
    return (<div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-red-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
            <AlertTriangle className="w-8 h-8"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Urgent</h1>
            <p className="text-red-100">All tickets with priority set to Urgent</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-red-100">Total Urgent</p>
          <p className="text-3xl font-bold">{items.length}</p>
        </div>
      </div>

      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500"/>
              Urgent Tickets
            </div>
            <button onClick={function () { return refetch(); }} disabled={isFetching} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60">
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </CardTitle>
        <CardBody>
          {isLoading ? (<div className="flex items-center justify-center py-12 text-slate-500">Loading…</div>) : items.length === 0 ? (<div className="text-center py-12 text-slate-500">No urgent tickets found</div>) : (<div className="space-y-3">
              {items.map(function (c) { return (<button key={c.id} onClick={function () { return navigate("/complaints/".concat(c.id)); }} className="w-full text-left flex items-center gap-4 p-4 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 rounded-xl transition-all group">
                  {/* Indicator */}
                  <div className="w-2 h-10 bg-red-500 rounded-full"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">#{c.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">Urgent</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{c.category}</span>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full ".concat(c.status === "Resolved"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700")}>{c.status}</span>
                    </div>
                    <p className="font-medium text-slate-900 line-clamp-2">{c.complaint_text}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3"/>{c.emp_id}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/>{timeSince(c.created_at)}</span>
                    </div>
                  </div>
                  {/* Right arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all"/>
                  </div>
                </button>); })}
            </div>)}
        </CardBody>
      </Card>
    </div>);
};
export default UrgentPage;
