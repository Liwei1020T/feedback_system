var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { User, Building2, MapPin, Shield, Calendar, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Card, CardBody, CardTitle } from "../components/Card";
import EmployeeManagement from "../components/EmployeeManagement";
import { changePassword, getProfilePreferences, getUserStats, updateProfilePreferences, getManager } from "../api";
import { useNotificationStore } from "../store/notifications";
var resolveErrorMessage = function (error, fallback) {
    var _a, _b, _c;
    if (error && typeof error === "object") {
        var response = error.response;
        var detail = (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.detail) !== null && _b !== void 0 ? _b : (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.message;
        if (typeof detail === "string" && detail.trim()) {
            return detail;
        }
        var message = error.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }
    return fallback;
};
var ProfilePage = function () {
    var _a, _b, _c;
    var user = useAuth().user;
    var addNotification = useNotificationStore(function (state) { return state.add; });
    if (!user) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading profile...</p>
      </div>);
    }
    var roleLabel = user.role ? user.role.replace(/_/g, " ").replace(/\b\w/g, function (char) { return char.toUpperCase(); }) : "";
    var createdDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    var queryClient = useQueryClient();
    var makeNotificationId = function (prefix) { return "".concat(prefix, "-").concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8)); };
    var stats = useQuery({ queryKey: ["user-stats"], queryFn: getUserStats }).data;
    var prefs = useQuery({ queryKey: ["profile-prefs"], queryFn: getProfilePreferences }).data;
    var updatePrefs = useMutation({
        mutationFn: updateProfilePreferences,
        onMutate: function (next) { return __awaiter(void 0, void 0, void 0, function () {
            var previous;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryClient.cancelQueries({ queryKey: ["profile-prefs"] })];
                    case 1:
                        _a.sent();
                        previous = queryClient.getQueryData(["profile-prefs"]);
                        queryClient.setQueryData(["profile-prefs"], next);
                        return [2 /*return*/, { previous: previous }];
                }
            });
        }); },
        onSuccess: function (data) {
            queryClient.setQueryData(["profile-prefs"], data);
            addNotification({
                id: makeNotificationId("prefs"),
                title: "Preferences updated",
                message: "Your notification settings have been saved.",
                createdAt: new Date().toISOString()
            });
        },
        onError: function (error, _variables, context) {
            if (context === null || context === void 0 ? void 0 : context.previous) {
                queryClient.setQueryData(["profile-prefs"], context.previous);
            }
            addNotification({
                id: makeNotificationId("prefs-error"),
                title: "Update failed",
                message: resolveErrorMessage(error, "Could not update preferences."),
                createdAt: new Date().toISOString()
            });
        },
        onSettled: function () {
            queryClient.invalidateQueries({ queryKey: ["profile-prefs"] });
        }
    });
    var _d = useState(false), pwdOpen = _d[0], setPwdOpen = _d[1];
    var _e = useState(""), currentPwd = _e[0], setCurrentPwd = _e[1];
    var _f = useState(""), newPwd = _f[0], setNewPwd = _f[1];
    var _g = useState(null), pwdError = _g[0], setPwdError = _g[1];
    var changePwd = useMutation({
        mutationFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var ok;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setPwdError(null);
                        return [4 /*yield*/, changePassword(currentPwd, newPwd)];
                    case 1:
                        ok = _a.sent();
                        if (!ok)
                            throw new Error("Password change failed");
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            setPwdOpen(false);
            setCurrentPwd("");
            setNewPwd("");
            addNotification({
                id: makeNotificationId("pwd"),
                title: "Password updated",
                message: "Your password has been changed successfully.",
                createdAt: new Date().toISOString()
            });
        },
        onError: function (error) {
            var message = resolveErrorMessage(error, "Password change failed");
            setPwdError(message);
            addNotification({
                id: makeNotificationId("pwd-error"),
                title: "Password update failed",
                message: message,
                createdAt: new Date().toISOString()
            });
        }
    });
    var handlePreferenceUpdate = function (key, value) {
        if (!prefs)
            return;
        updatePrefs.mutate({
            email_notifications: key === "email_notifications" ? value : prefs.email_notifications,
            browser_notifications: key === "browser_notifications" ? value : prefs.browser_notifications,
            weekly_summary: key === "weekly_summary" ? value : prefs.weekly_summary
        });
    };
    var prefsDisabled = !prefs || updatePrefs.isPending;
    var resolutionRateDisplay = stats ? "".concat(stats.resolution_rate.toFixed(1), "%") : "--";
    var avgResponseDisplay = stats ? "".concat(stats.avg_response_time_hours.toFixed(1), "h") : "--";
    // Fetch manager info if user is an employee
    var _h = useQuery({
        queryKey: ["manager"],
        queryFn: getManager,
        enabled: (user === null || user === void 0 ? void 0 : user.role) === "employee"
    }), manager = _h.data, managerLoading = _h.isLoading;
    return (<div className="space-y-6">
      <div className="animate-slide-in">
        <h1 className="text-3xl font-bold text-slate-900">
          Profile
        </h1>
        <p className="text-slate-500 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle>Profile Information</CardTitle>
            <CardBody>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-white"/>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{user.username}</h2>
                    <p className="text-slate-500">{roleLabel}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400"/>
                        <div>
                          <p className="text-xs text-slate-500">User ID</p>
                          <p className="text-sm font-medium text-slate-700">#{user.id}</p>
                        </div>
                      </div>
                      
                      
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-slate-400"/>
                        <div>
                          <p className="text-xs text-slate-500">Role</p>
                          <p className="text-sm font-medium text-slate-700">{roleLabel}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {user.department && (<div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400"/>
                          <div>
                            <p className="text-xs text-slate-500">Department</p>
                            <p className="text-sm font-medium text-slate-700">{user.department}</p>
                          </div>
                        </div>)}
                      
                      {user.plant && (<div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-400"/>
                          <div>
                            <p className="text-xs text-slate-500">Plant</p>
                            <p className="text-sm font-medium text-slate-700">Plant {user.plant}</p>
                          </div>
                        </div>)}
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400"/>
                        <div>
                          <p className="text-xs text-slate-500">Member Since</p>
                          <p className="text-sm font-medium text-slate-700">{createdDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Manager Info Card - Show for employees */}
          {user.role === "employee" && (managerLoading ? (<Card>
                <CardTitle>Manager Information</CardTitle>
                <CardBody>
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-500">Loading manager information...</p>
                  </div>
                </CardBody>
              </Card>) : manager ? (<Card>
                <CardTitle>Manager Information</CardTitle>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-white"/>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{manager.username}</h3>
                        <p className="text-sm text-slate-500">{manager.role ? manager.role.replace(/_/g, " ").replace(/\b\w/g, function (char) { return char.toUpperCase(); }) : "Manager"}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-700 break-all">{manager.email}</p>
                        </div>
                        {manager.department && (<div>
                            <p className="text-xs text-slate-500">Department</p>
                            <p className="text-sm font-medium text-slate-700">{manager.department}</p>
                          </div>)}
                        {manager.plant && (<div>
                            <p className="text-xs text-slate-500">Plant</p>
                            <p className="text-sm font-medium text-slate-700">Plant {manager.plant}</p>
                          </div>)}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>) : null)}

          <Card>
            <CardTitle>Account Settings</CardTitle>
            <CardBody>
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Notification Preferences</h3>
                  <p className="text-sm text-slate-500 mb-3">Configure how you receive notifications</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-slate-300" checked={(_a = prefs === null || prefs === void 0 ? void 0 : prefs.email_notifications) !== null && _a !== void 0 ? _a : true} disabled={prefsDisabled} onChange={function (e) { return handlePreferenceUpdate("email_notifications", e.target.checked); }}/>
                      <span className="text-sm text-slate-700">Email notifications for new complaints</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-slate-300" checked={(_b = prefs === null || prefs === void 0 ? void 0 : prefs.browser_notifications) !== null && _b !== void 0 ? _b : true} disabled={prefsDisabled} onChange={function (e) { return handlePreferenceUpdate("browser_notifications", e.target.checked); }}/>
                      <span className="text-sm text-slate-700">Browser notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-slate-300" checked={(_c = prefs === null || prefs === void 0 ? void 0 : prefs.weekly_summary) !== null && _c !== void 0 ? _c : false} disabled={prefsDisabled} onChange={function (e) { return handlePreferenceUpdate("weekly_summary", e.target.checked); }}/>
                      <span className="text-sm text-slate-700">Weekly summary reports</span>
                    </label>
                    {updatePrefs.isPending && (<p className="text-xs text-slate-400">Saving preferences...</p>)}
                  </div>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Security</h3>
                  <p className="text-sm text-slate-500 mb-3">Manage your account security</p>
                  <button onClick={function () {
            setPwdError(null);
            setCurrentPwd("");
            setNewPwd("");
            setPwdOpen(true);
        }} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <Lock className="w-4 h-4"/> Change Password
                  </button>
                  {pwdOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-4">
                        <h4 className="text-lg font-semibold mb-2">Change Password</h4>
                        <div className="space-y-3">
                          <input type="password" placeholder="Current password" value={currentPwd} onChange={function (e) { return setCurrentPwd(e.target.value); }} className="w-full rounded-lg border border-slate-200 p-2 text-sm"/>
                          <input type="password" placeholder="New password" value={newPwd} onChange={function (e) { return setNewPwd(e.target.value); }} className="w-full rounded-lg border border-slate-200 p-2 text-sm"/>
                          {newPwd && newPwd.length < 10 && (<p className="text-xs text-amber-600">Password must be at least 10 characters.</p>)}
                          {pwdError && <p className="text-xs text-danger">{pwdError}</p>}
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={function () {
                setPwdOpen(false);
                setPwdError(null);
                setCurrentPwd("");
                setNewPwd("");
            }} className="rounded-lg border border-slate-200 px-3 py-1 text-sm">
                              Cancel
                            </button>
                            <button onClick={function () { return changePwd.mutate(); }} disabled={!currentPwd || !newPwd || newPwd.length < 10 || changePwd.isPending} className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white disabled:opacity-50">
                              {changePwd.isPending ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Quick Stats</CardTitle>
            <CardBody>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats ? stats.complaints_handled : "--"}</p>
                  <p className="text-sm text-slate-600">Complaints Handled</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{resolutionRateDisplay}</p>
                  <p className="text-sm text-slate-600">Resolution Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{avgResponseDisplay}</p>
                  <p className="text-sm text-slate-600">Avg Response Time</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Employee Management for Admins */}
          {(user.role === 'admin' || user.role === 'super_admin') && (<EmployeeManagement />)}

          <Card>
            <CardTitle>System Access</CardTitle>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Dashboard</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Full Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Analytics</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Full Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Admin Management</span>
                  <span className={"text-xs px-2 py-1 rounded-full ".concat(user.role === 'super_admin'
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-600')}>
                    {user.role === 'super_admin' ? 'Full Access' : 'No Access'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>);
};
export default ProfilePage;
