import { NavLink } from "react-router-dom";
import {
  Home,
  MessageSquare,
  FileText,
  Sparkles,
  User,
  Building2,
  AlertCircle,
  BarChart3,
  UserCog
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: string[];
}

const Sidebar = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  const navSections: NavSection[] = [
    {
      items: [
        { to: "/", label: "Dashboard", icon: Home }
      ]
    },
    {
      title: "Analytics & Insights",
      items: [
        { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "admin"] }
      ]
    },
    {
      title: "Complaints",
      items: [
        { to: "/feedback", label: "All Complaints", icon: MessageSquare },
        { to: "/urgent", label: "Urgent", icon: AlertCircle, roles: ["super_admin", "admin"] }
      ]
    },
    {
      title: "Reports",
      items: [
        { to: "/reports", label: "Reports", icon: FileText, roles: ["super_admin", "admin"] }
      ]
    },
    {
      title: "Management",
      items: [
        { to: "/departments", label: "Departments", icon: Building2, roles: ["super_admin", "admin"] },
        { to: "/employees", label: "Employees", icon: UserCog, roles: ["admin"] }
      ]
    },
    {
      title: "Account",
      items: [
        { to: "/profile", label: "Profile", icon: User }
      ]
    }
  ];

  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role || "");
    });
  };

  return (
    <aside className="app-sidebar w-72 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="app-sidebar__header px-6 py-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="app-sidebar__logo">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight text-white">AI Feedback</p>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="app-sidebar__status-dot"></span>
              {user?.username ?? "Guest"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col p-4 gap-6 flex-1 pb-32">
        {navSections.map((section, idx) => {
          const filteredItems = filterNavItems(section.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {section.title && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                  {section.title}
                </h3>
              )}
              {filteredItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "is-active" : ""}`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="sidebar-link__badge">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
