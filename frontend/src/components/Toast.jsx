import { useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";
var Toast = function (_a) {
    var id = _a.id, type = _a.type, title = _a.title, message = _a.message, _b = _a.duration, duration = _b === void 0 ? 5000 : _b, onClose = _a.onClose;
    useEffect(function () {
        if (duration > 0) {
            var timer_1 = setTimeout(function () {
                onClose(id);
            }, duration);
            return function () { return clearTimeout(timer_1); };
        }
    }, [id, duration, onClose]);
    var typeStyles = {
        success: {
            icon: CheckCircle2,
            iconColor: "text-green-600",
            bg: "bg-white border-green-200",
            progressBg: "bg-green-500"
        },
        error: {
            icon: AlertCircle,
            iconColor: "text-red-600",
            bg: "bg-white border-red-200",
            progressBg: "bg-red-500"
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-orange-600",
            bg: "bg-white border-orange-200",
            progressBg: "bg-orange-500"
        },
        info: {
            icon: Info,
            iconColor: "text-blue-600",
            bg: "bg-white border-blue-200",
            progressBg: "bg-blue-500"
        }
    };
    var style = typeStyles[type];
    var Icon = style.icon;
    return (<div className={"relative min-w-80 max-w-md rounded-xl shadow-2xl border-2 ".concat(style.bg, " overflow-hidden animate-slide-in-from-right")}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={"w-6 h-6 ".concat(style.iconColor)}/>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {title}
            </h4>
            {message && (<p className="text-xs text-slate-600">
                {message}
              </p>)}
          </div>

          {/* Close Button */}
          <button onClick={function () { return onClose(id); }} className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close notification">
            <X className="w-4 h-4 text-slate-500"/>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (<div className="h-1 bg-slate-100">
          <div className={"h-full ".concat(style.progressBg)} style={{
                animation: "shrink ".concat(duration, "ms linear forwards")
            }}/>
        </div>)}
    </div>);
};
export default Toast;
