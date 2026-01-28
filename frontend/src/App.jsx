import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";
import UrgentPage from "./pages/UrgentPage";
import DashboardPage from "./pages/DashboardPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ComplaintDetailPage from "./pages/ComplaintDetailPage";
import SubmitComplaintPage from "./pages/SubmitComplaintPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import AllFeedbackPage from "./pages/AllFeedbackPage";
import ReportsPage from "./pages/ReportsPage";
import DepartmentManagementPage from "./pages/DepartmentManagementPage";
import EmployeesPage from "./pages/EmployeesPage";
import { useAuth } from "./hooks/useAuth";
function App() {
    var user = useAuth().user;
    var isSuperAdmin = (user === null || user === void 0 ? void 0 : user.role) === "super_admin";
    return (<>
      <ToastContainer />
      <Routes>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/submit" element={<SubmitComplaintPage />}/>

      <Route element={<ProtectedRoute>
            <Layout />
          </ProtectedRoute>}>
        {/* Dashboard - Super Admin gets enhanced dashboard */}
        <Route path="/" element={isSuperAdmin ? <SuperAdminDashboard /> : <DashboardPage />}/>
        
        <Route path="/complaints/:id" element={<ComplaintDetailPage />}/>
        
        {/* Analytics & Insights */}
        <Route path="/analytics" element={<ProtectedRoute roles={["super_admin", "admin"]}>
              <AnalyticsPage />
            </ProtectedRoute>}/>
        {/* AI Insights page removed; Root Cause moved into Analytics */}

        {/* Complaints */}
        <Route path="/feedback" element={<AllFeedbackPage />}/>
        <Route path="/urgent" element={<ProtectedRoute roles={["super_admin", "admin"]}>
              <UrgentPage />
            </ProtectedRoute>}/>

        {/* Reports */}
        <Route path="/reports" element={<ProtectedRoute roles={["super_admin", "admin"]}>
              <ReportsPage />
            </ProtectedRoute>}/>

        {/* Management */}
        <Route path="/departments" element={<ProtectedRoute roles={["super_admin", "admin"]}>
              <DepartmentManagementPage />
            </ProtectedRoute>}/>
        <Route path="/employees" element={<ProtectedRoute roles={["admin"]}>
              <EmployeesPage />
            </ProtectedRoute>}/>

        {/* Account */}
        <Route path="/profile" element={<ProfilePage />}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    </>);
}
export default App;
