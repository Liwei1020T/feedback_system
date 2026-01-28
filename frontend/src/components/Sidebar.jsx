import { NavLink } from "react-router-dom";
import { Home, MessageSquare, FileText, Sparkles, User, Building2, AlertCircle, BarChart3, UserCog } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
var Sidebar = function () {
    var _a;
    var user = useAuth().user;
    var isSuperAdmin = (user === null || user === void 0 ? void 0 : user.role) === "super_admin";
    var isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin" || isSuperAdmin;
    var navSections = [
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
    var filterNavItems = function (items) {
        return items.filter(function (item) {
            if (!item.roles)
                return true;
            return item.roles.includes((user === null || user === void 0 ? void 0 : user.role) || "");
        });
    };
    return (<aside className="app-sidebar w-72 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="app-sidebar__header px-6 py-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="app-sidebar__logo">
            <Sparkles className="w-5 h-5"/>
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight text-white">Jabil Feedback</p>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span className="app-sidebar__status-dot"></span>
              {(_a = user === null || user === void 0 ? void 0 : user.username) !== null && _a !== void 0 ? _a : "Guest"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col p-4 gap-6 flex-1 pb-32">
        {navSections.map(function (section, idx) {
            var filteredItems = filterNavItems(section.items);
            if (filteredItems.length === 0)
                return null;
            return (<div key={idx} className="space-y-1">
              {section.title && (<h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                  {section.title}
                </h3>)}
              {filteredItems.map(function (item) { return (<NavLink key={item.to} to={item.to} className={function (_a) {
                        var isActive = _a.isActive;
                        return "sidebar-link ".concat(isActive ? "is-active" : "");
                    }}>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0"/>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (<span className="sidebar-link__badge">
                      {item.badge}
                    </span>)}
                </NavLink>); })}
            </div>);
        })}
      </nav>
    </aside>);
};
export default Sidebar;
