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
import { persist } from "zustand/middleware";
export var useNotificationStore = create()(persist(function (set, get) { return ({
    items: [],
    add: function (notification) {
        return set(function (state) { return ({
            items: __spreadArray([
                __assign(__assign({}, notification), { read: false })
            ], state.items, true).slice(0, 20) // keep the latest 20
        }); });
    },
    markRead: function (id) {
        return set(function (state) { return ({
            items: state.items.map(function (item) { return (item.id === id ? __assign(__assign({}, item), { read: true }) : item); })
        }); });
    },
    markAllRead: function () {
        return set(function (state) { return ({
            items: state.items.map(function (item) { return (__assign(__assign({}, item), { read: true })); })
        }); });
    },
    unreadCount: function () { return get().items.filter(function (item) { return !item.read; }).length; }
}); }, {
    name: "notification-store"
}));
