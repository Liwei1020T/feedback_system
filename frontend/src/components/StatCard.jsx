var StatCard = function (_a) {
    var label = _a.label, value = _a.value, Icon = _a.icon, trend = _a.trend, _b = _a.accent, accent = _b === void 0 ? "text-primary" : _b;
    return (<div className="glass-card p-3 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200">
    <div className={"p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 ".concat(accent, " mb-2")}>
      <Icon className="w-4 h-4"/>
    </div>
    <p className="text-[10px] uppercase font-semibold tracking-wide text-slate-500 mb-1">{label}</p>
    <p className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{value}</p>
    {trend && <p className="text-[10px] text-slate-400 mt-0.5">{trend}</p>}
  </div>);
};
export default StatCard;
