export var Card = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b, style = _a.style;
    return (<div className={"glass-card p-6 hover:shadow-soft transition-shadow duration-300 animate-scale-in ".concat(className)} style={style}>{children}</div>);
};
export var CardTitle = function (_a) {
    var children = _a.children, id = _a.id;
    return (<h2 id={id} className="text-lg font-bold mb-4 text-slate-800">{children}</h2>);
};
export var CardBody = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b;
    return <div className={className}>{children}</div>;
};
