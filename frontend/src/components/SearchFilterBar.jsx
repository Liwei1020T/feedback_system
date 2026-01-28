var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useState } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";
var SearchFilterBar = function (_a) {
    var filters = _a.filters, onFiltersChange = _a.onFiltersChange, _b = _a.showAdvancedFilters, showAdvancedFilters = _b === void 0 ? false : _b, _c = _a.placeholder, placeholder = _c === void 0 ? "Search tickets by ID, email, or description..." : _c, _d = _a.categories, categories = _d === void 0 ? ["All", "HR", "Payroll", "Facilities", "IT", "Safety", "Unclassified"] : _d, _e = _a.plants, plants = _e === void 0 ? [] : _e;
    var _f = useState(false), showFilters = _f[0], setShowFilters = _f[1];
    var handleSearchChange = function (value) {
        onFiltersChange(__assign(__assign({}, filters), { search: value }));
    };
    var handleFilterChange = function (key, value) {
        var _a;
        onFiltersChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value || undefined, _a)));
    };
    var clearFilters = function () {
        onFiltersChange({
            search: "",
            status: "All",
            priority: "All",
            kind: "All",
            category: undefined,
            plant: undefined,
            dateFrom: undefined,
            dateTo: undefined
        });
    };
    var hasActiveFilters = filters.search ||
        (filters.status && filters.status !== "All") ||
        (filters.priority && filters.priority !== "All") ||
        (filters.kind && filters.kind !== "All") ||
        filters.category ||
        filters.plant ||
        filters.dateFrom ||
        filters.dateTo;
    return (<div className="glass-card overflow-hidden animate-fade-in">
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
            <input type="text" value={filters.search} onChange={function (e) { return handleSearchChange(e.target.value); }} placeholder={placeholder} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"/>
          </div>
          
          {showAdvancedFilters && (<button onClick={function () { return setShowFilters(!showFilters); }} className={"inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ".concat(showFilters || hasActiveFilters
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50")}>
              <Filter className="w-4 h-4"/>
              Filters
              {hasActiveFilters && (<span className="w-2 h-2 bg-white rounded-full animate-pulse"/>)}
            </button>)}
          
          {hasActiveFilters && (<button onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white border-2 border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all">
              <X className="w-4 h-4"/>
              Clear
            </button>)}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && showFilters && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border-2 border-slate-100 animate-fade-in">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Status
              </label>
              <select value={filters.status || "All"} onChange={function (e) { return handleFilterChange("status", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium">
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Priority
              </label>
              <select value={filters.priority || "All"} onChange={function (e) { return handleFilterChange("priority", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium">
                <option value="All">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Kind Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Type
              </label>
              <select value={filters.kind || "All"} onChange={function (e) { return handleFilterChange("kind", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium">
                <option value="All">All Types</option>
                <option value="complaint">Complaint</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Category
              </label>
              <select value={filters.category || "All"} onChange={function (e) { return handleFilterChange("category", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium">
                {categories.map(function (cat) { return (<option key={cat} value={cat === "All" ? "" : cat}>
                    {cat}
                  </option>); })}
              </select>
            </div>

            {/* Plant Filter */}
            {plants.length > 0 && (<div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                  Plant
                </label>
                <select value={filters.plant || "All"} onChange={function (e) { return handleFilterChange("plant", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium">
                  <option value="">All Plants</option>
                  {plants.map(function (plant) { return (<option key={plant} value={plant}>
                      {plant}
                    </option>); })}
                </select>
              </div>)}

            {/* Date From */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                <Calendar className="inline w-3 h-3 mr-1"/>
                From Date
              </label>
              <input type="date" value={filters.dateFrom || ""} onChange={function (e) { return handleFilterChange("dateFrom", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"/>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                <Calendar className="inline w-3 h-3 mr-1"/>
                To Date
              </label>
              <input type="date" value={filters.dateTo || ""} onChange={function (e) { return handleFilterChange("dateTo", e.target.value); }} className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-medium"/>
            </div>
          </div>)}
      </div>
    </div>);
};
export default SearchFilterBar;
