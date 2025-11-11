import { LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./Notification";

interface TopBarProps {
  title?: string;
}

const TopBar = ({ title }: TopBarProps) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roleLabel = user?.role ? user.role.replace(/_/g, " ") : "";
  const roleBadgeClass = user?.role === "super_admin"
    ? "badge-super-admin"
    : user?.role === "admin"
    ? "badge-admin"
    : "badge-user";

  return (
    <header className="app-topbar flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-30">
      {/* Left: Title Section */}
      <div className="animate-slide-in flex-1">
        <h1 className="app-topbar__title text-2xl md:text-3xl font-bold">
          {title ?? "Dashboard"}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className={`${roleBadgeClass} text-xs font-bold px-2 py-0.5 rounded-md shadow-sm`}> 
            {roleLabel.toUpperCase()}
          </div>
          {user?.department && (
            <span className="text-sm text-slate-500">
              {user.department} {user.plant ? `• Plant ${user.plant}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="avatar-initials w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900">{user?.username || "Guest"}</p>
                <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.department || "No department"}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  window.location.href = "/profile";
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4" />
                View Profile
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
