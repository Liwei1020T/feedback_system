import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../api";
import { useAuth } from "../hooks/useAuth";
var NotificationBell = function () {
    var _a = useState(false), open = _a[0], setOpen = _a[1];
    var navigate = useNavigate();
    var queryClient = useQueryClient();
    var user = useAuth().user;
    // Fetch notifications
    var _b = useQuery({
        queryKey: ["notifications"],
        queryFn: function () { return listNotifications(undefined, 50); },
        refetchInterval: 30000, // Refetch every 30 seconds as fallback
    }), _c = _b.data, notifications = _c === void 0 ? [] : _c, refetch = _b.refetch;
    var unreadCount = notifications.filter(function (n) { return !n.is_read; }).length;
    // SSE Connection for real-time updates
    useEffect(function () {
        if (!user)
            return;
        var token = localStorage.getItem("access_token");
        if (!token)
            return;
        // Create EventSource for SSE.
        // EventSource cannot set custom headers, so pass the bearer token via query string.
        var baseUrl = "".concat(import.meta.env.VITE_API_URL || "http://localhost:8000", "/api/notifications/stream/sse");
        var url = "".concat(baseUrl, "?token=").concat(encodeURIComponent(token));
        var eventSource = new EventSource(url, { withCredentials: true });
        eventSource.onmessage = function (event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === "notification") {
                    // New notification received - refetch list
                    refetch();
                    // Show browser notification if permission granted
                    if (window.Notification && window.Notification.permission === "granted") {
                        new window.Notification(data.data.title, {
                            body: data.data.message,
                            icon: "/favicon.ico",
                            tag: "notif-".concat(data.data.id),
                        });
                    }
                }
            }
            catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };
        eventSource.onerror = function () {
            console.warn("SSE connection error, will retry...");
            eventSource.close();
        };
        // Request browser notification permission on first load
        if (window.Notification && window.Notification.permission === "default") {
            window.Notification.requestPermission();
        }
        return function () {
            eventSource.close();
        };
    }, [user, refetch]);
    // Mark single notification as read
    var markReadMutation = useMutation({
        mutationFn: markNotificationRead,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
    // Mark all notifications as read
    var markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
    // Delete notification
    var deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
    var handleNotificationClick = function (notification) {
        // Mark as read
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        // Navigate to link if present
        if (notification.link) {
            setOpen(false);
            navigate(notification.link);
        }
    };
    var handleDelete = function (e, notifId) {
        e.stopPropagation();
        deleteMutation.mutate(notifId);
    };
    var toggle = function () {
        setOpen(function (prev) { return !prev; });
    };
    var getNotificationColor = function (type) {
        switch (type) {
            case "error":
                return "border-l-red-500 bg-red-50/50 hover:bg-red-100/50";
            case "warning":
                return "border-l-amber-500 bg-amber-50/50 hover:bg-amber-100/50";
            case "success":
                return "border-l-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/50";
            default:
                return "border-l-blue-500 bg-blue-50/50 hover:bg-blue-100/50";
        }
    };
    return (<div className="relative">
      <button className="relative inline-flex items-center justify-center rounded-xl p-2.5 hover:bg-slate-100 transition-all" onClick={toggle} aria-label="Notifications">
        <Bell className="w-5 h-5 text-slate-600"/>
        {unreadCount > 0 && (<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>)}
      </button>

      {open && (<>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={function () { return setOpen(false); }}/>
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-3 w-96 rounded-2xl border-2 border-slate-200 bg-white shadow-2xl z-20 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
              <p className="text-base font-bold text-slate-800">
                Notifications {unreadCount > 0 && (<span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>)}
              </p>
              {notifications.length > 0 && (<button className="text-xs inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold transition-colors" onClick={function () { return markAllReadMutation.mutate(); }} disabled={markAllReadMutation.isPending}>
                  <CheckCheck className="w-4 h-4"/>
                  Mark all read
                </button>)}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (<div className="px-5 py-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2"/>
                  <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                </div>) : (notifications.map(function (notif) { return (<div key={notif.id} className={"group relative w-full text-left px-5 py-4 border-b border-slate-100 last:border-0 transition-all cursor-pointer ".concat(notif.is_read
                    ? "bg-white text-slate-500 hover:bg-slate-50"
                    : "".concat(getNotificationColor(notif.type), " text-slate-700 border-l-4"))} onClick={function () { return handleNotificationClick(notif); }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold truncate">{notif.title}</p>
                          {!notif.is_read && (<span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>)}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-[11px] text-slate-400 font-medium">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                          {notif.link && (<ExternalLink className="w-3 h-3 text-slate-400"/>)}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button onClick={function (e) { return handleDelete(e, notif.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all" aria-label="Delete notification">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>); }))}
            </div>

          </div>
        </>)}
    </div>);
};
export default NotificationBell;
