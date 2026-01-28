import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
var ProtectedRoute = function (_a) {
    var roles = _a.roles, children = _a.children;
    var _b = useAuth(), isAuthenticated = _b.isAuthenticated, loading = _b.loading, user = _b.user;
    var location = useLocation();
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    if (roles && user && !roles.includes(user.role)) {
        return <Navigate to="/" replace/>;
    }
    return <>{children}</>;
};
export default ProtectedRoute;
