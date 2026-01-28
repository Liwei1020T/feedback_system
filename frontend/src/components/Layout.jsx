import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { FloatingChatbot } from "./FloatingChatbot";
var titles = {
    "/": "Jabil Feedback Dashboard",
    "/analytics": "Analytics & Insights",
    "/insights": "AI-Powered Insights",
    "/chatbot": "AI Assistant",
    "/admins": "Admin Management",
    "/feedback": "All Complaints",
    "/urgent": "Urgent",
    "/reports": "Reports & Analytics",
    "/departments": "Department Management",
    "/employees": "Employee Management",
    "/settings": "System Settings",
    "/profile": "My Profile"
};
var Layout = function () {
    var _a;
    var location = useLocation();
    var title = (_a = titles[location.pathname]) !== null && _a !== void 0 ? _a : "Jabil Feedback System";
    return (<div className="app-shell flex min-h-screen text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title}/>
        <main className="app-main flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <FloatingChatbot />
    </div>);
};
export default Layout;
