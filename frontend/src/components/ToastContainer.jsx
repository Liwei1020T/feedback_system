import Toast from "./Toast";
import { useToastStore } from "../store/toast";
var ToastContainer = function () {
    var toasts = useToastStore(function (state) { return state.toasts; });
    var removeToast = useToastStore(function (state) { return state.removeToast; });
    return (<div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {toasts.map(function (toast) { return (<Toast key={toast.id} id={toast.id} type={toast.type} title={toast.title} message={toast.message} duration={toast.duration} onClose={removeToast}/>); })}
      </div>
    </div>);
};
export default ToastContainer;
