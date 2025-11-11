import { User, Building2, MapPin, Shield, Calendar, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { Card, CardBody, CardTitle } from "../components/Card";
import EmployeeManagement from "../components/EmployeeManagement";
import { changePassword, getProfilePreferences, getUserStats, updateProfilePreferences, getManager } from "../api";
import { useNotificationStore } from "../store/notifications";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { detail?: string; message?: string } } }).response;
    const detail = response?.data?.detail ?? response?.data?.message;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const ProfilePage = () => {
  const { user } = useAuth();
  const addNotification = useNotificationStore((state) => state.add);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const roleLabel = user.role ? user.role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "";
  const createdDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const queryClient = useQueryClient();
  const makeNotificationId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data: stats } = useQuery({ queryKey: ["user-stats"], queryFn: getUserStats });
  const { data: prefs } = useQuery({ queryKey: ["profile-prefs"], queryFn: getProfilePreferences });
  const updatePrefs = useMutation({
    mutationFn: updateProfilePreferences,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["profile-prefs"] });
      const previous = queryClient.getQueryData(["profile-prefs"]);
      queryClient.setQueryData(["profile-prefs"], next);
      return { previous } as { previous?: typeof next };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile-prefs"], data);
      addNotification({
        id: makeNotificationId("prefs"),
        title: "Preferences updated",
        message: "Your notification settings have been saved.",
        createdAt: new Date().toISOString()
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["profile-prefs"], context.previous);
      }
      addNotification({
        id: makeNotificationId("prefs-error"),
        title: "Update failed",
        message: resolveErrorMessage(error, "Could not update preferences."),
        createdAt: new Date().toISOString()
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-prefs"] });
    }
  });

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const changePwd = useMutation({
    mutationFn: async () => {
      setPwdError(null);
      const ok = await changePassword(currentPwd, newPwd);
      if (!ok) throw new Error("Password change failed");
    },
    onSuccess: () => {
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
    onError: (error: unknown) => {
      const message = resolveErrorMessage(error, "Password change failed");
      setPwdError(message);
      addNotification({
        id: makeNotificationId("pwd-error"),
        title: "Password update failed",
        message,
        createdAt: new Date().toISOString()
      });
    }
  });

  const handlePreferenceUpdate = (
    key: "email_notifications" | "browser_notifications" | "weekly_summary",
    value: boolean
  ) => {
    if (!prefs) return;
    updatePrefs.mutate({
      email_notifications: key === "email_notifications" ? value : prefs.email_notifications,
      browser_notifications: key === "browser_notifications" ? value : prefs.browser_notifications,
      weekly_summary: key === "weekly_summary" ? value : prefs.weekly_summary
    });
  };

  const prefsDisabled = !prefs || updatePrefs.isPending;
  const resolutionRateDisplay = stats ? `${stats.resolution_rate.toFixed(1)}%` : "--";
  const avgResponseDisplay = stats ? `${stats.avg_response_time_hours.toFixed(1)}h` : "--";
  
  // Fetch manager info if user is an employee
  const { data: manager, isLoading: managerLoading } = useQuery({ 
    queryKey: ["manager"], 
    queryFn: getManager,
    enabled: user?.role === "employee"
  });

  return (
    <div className="space-y-6">
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
                    <User className="w-12 h-12 text-white" />
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
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">User ID</p>
                          <p className="text-sm font-medium text-slate-700">#{user.id}</p>
                        </div>
                      </div>
                      
                      
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Role</p>
                          <p className="text-sm font-medium text-slate-700">{roleLabel}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {user.department && (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Department</p>
                            <p className="text-sm font-medium text-slate-700">{user.department}</p>
                          </div>
                        </div>
                      )}
                      
                      {user.plant && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Plant</p>
                            <p className="text-sm font-medium text-slate-700">Plant {user.plant}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
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
          {user.role === "employee" && (
            managerLoading ? (
              <Card>
                <CardTitle>Manager Information</CardTitle>
                <CardBody>
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-500">Loading manager information...</p>
                  </div>
                </CardBody>
              </Card>
            ) : manager ? (
              <Card>
                <CardTitle>Manager Information</CardTitle>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{manager.username}</h3>
                        <p className="text-sm text-slate-500">{manager.role ? manager.role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Manager"}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-700 break-all">{manager.email}</p>
                        </div>
                        {manager.department && (
                          <div>
                            <p className="text-xs text-slate-500">Department</p>
                            <p className="text-sm font-medium text-slate-700">{manager.department}</p>
                          </div>
                        )}
                        {manager.plant && (
                          <div>
                            <p className="text-xs text-slate-500">Plant</p>
                            <p className="text-sm font-medium text-slate-700">Plant {manager.plant}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : null
          )}

          <Card>
            <CardTitle>Account Settings</CardTitle>
            <CardBody>
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Notification Preferences</h3>
                  <p className="text-sm text-slate-500 mb-3">Configure how you receive notifications</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={prefs?.email_notifications ?? true}
                        disabled={prefsDisabled}
                        onChange={(e) => handlePreferenceUpdate("email_notifications", e.target.checked)}
                      />
                      <span className="text-sm text-slate-700">Email notifications for new complaints</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={prefs?.browser_notifications ?? true}
                        disabled={prefsDisabled}
                        onChange={(e) => handlePreferenceUpdate("browser_notifications", e.target.checked)}
                      />
                      <span className="text-sm text-slate-700">Browser notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={prefs?.weekly_summary ?? false}
                        disabled={prefsDisabled}
                        onChange={(e) => handlePreferenceUpdate("weekly_summary", e.target.checked)}
                      />
                      <span className="text-sm text-slate-700">Weekly summary reports</span>
                    </label>
                    {updatePrefs.isPending && (
                      <p className="text-xs text-slate-400">Saving preferences...</p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Security</h3>
                  <p className="text-sm text-slate-500 mb-3">Manage your account security</p>
                  <button
                    onClick={() => {
                      setPwdError(null);
                      setCurrentPwd("");
                      setNewPwd("");
                      setPwdOpen(true);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Lock className="w-4 h-4" /> Change Password
                  </button>
                  {pwdOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-4">
                        <h4 className="text-lg font-semibold mb-2">Change Password</h4>
                        <div className="space-y-3">
                          <input
                            type="password"
                            placeholder="Current password"
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                          />
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                          />
                          {newPwd && newPwd.length < 10 && (
                            <p className="text-xs text-amber-600">Password must be at least 10 characters.</p>
                          )}
                          {pwdError && <p className="text-xs text-danger">{pwdError}</p>}
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => {
                                setPwdOpen(false);
                                setPwdError(null);
                                setCurrentPwd("");
                                setNewPwd("");
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => changePwd.mutate()}
                              disabled={!currentPwd || !newPwd || newPwd.length < 10 || changePwd.isPending}
                              className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {changePwd.isPending ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <EmployeeManagement />
          )}

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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'super_admin' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role === 'super_admin' ? 'Full Access' : 'No Access'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
