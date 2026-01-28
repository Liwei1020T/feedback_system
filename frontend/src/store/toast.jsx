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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { create } from "zustand";
export var useToastStore = create(function (set) { return ({
    toasts: [],
    addToast: function (toast) {
        var id = "toast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        set(function (state) { return ({
            toasts: __spreadArray(__spreadArray([], state.toasts, true), [__assign(__assign({}, toast), { id: id })], false)
        }); });
    },
    removeToast: function (id) {
        set(function (state) { return ({
            toasts: state.toasts.filter(function (t) { return t.id !== id; })
        }); });
    },
    clearAll: function () {
        set({ toasts: [] });
    },
    success: function (title, message, duration) {
        if (duration === void 0) { duration = 5000; }
        var id = "toast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        set(function (state) { return ({
            toasts: __spreadArray(__spreadArray([], state.toasts, true), [{ id: id, type: "success", title: title, message: message, duration: duration }], false)
        }); });
    },
    error: function (title, message, duration) {
        if (duration === void 0) { duration = 7000; }
        var id = "toast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        set(function (state) { return ({
            toasts: __spreadArray(__spreadArray([], state.toasts, true), [{ id: id, type: "error", title: title, message: message, duration: duration }], false)
        }); });
    },
    warning: function (title, message, duration) {
        if (duration === void 0) { duration = 6000; }
        var id = "toast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        set(function (state) { return ({
            toasts: __spreadArray(__spreadArray([], state.toasts, true), [{ id: id, type: "warning", title: title, message: message, duration: duration }], false)
        }); });
    },
    info: function (title, message, duration) {
        if (duration === void 0) { duration = 5000; }
        var id = "toast-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        set(function (state) { return ({
            toasts: __spreadArray(__spreadArray([], state.toasts, true), [{ id: id, type: "info", title: title, message: message, duration: duration }], false)
        }); });
    }
}); });
