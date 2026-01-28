import { AlertTriangle, X } from "lucide-react";
var ConfirmDialog = function (_a) {
    var isOpen = _a.isOpen, title = _a.title, message = _a.message, _b = _a.confirmText, confirmText = _b === void 0 ? "Confirm" : _b, _c = _a.cancelText, cancelText = _c === void 0 ? "Cancel" : _c, _d = _a.variant, variant = _d === void 0 ? "warning" : _d, onConfirm = _a.onConfirm, onCancel = _a.onCancel;
    if (!isOpen)
        return null;
    var variantStyles = {
        danger: {
            icon: "text-red-600",
            iconBg: "bg-red-100",
            button: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
        },
        warning: {
            icon: "text-orange-600",
            iconBg: "bg-orange-100",
            button: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        },
        info: {
            icon: "text-blue-600",
            iconBg: "bg-blue-100",
            button: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        },
        success: {
            icon: "text-green-600",
            iconBg: "bg-green-100",
            button: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        }
    };
    var styles = variantStyles[variant];
    return (<div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}/>

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Close Button */}
        <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Close">
          <X className="w-5 h-5 text-slate-500"/>
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={"w-16 h-16 rounded-2xl ".concat(styles.iconBg, " flex items-center justify-center mx-auto mb-4")}>
            <AlertTriangle className={"w-8 h-8 ".concat(styles.icon)}/>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 text-center mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={"flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ".concat(styles.button)}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>);
};
export default ConfirmDialog;
