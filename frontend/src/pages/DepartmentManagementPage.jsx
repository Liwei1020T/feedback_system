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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Building2, MapPin, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Card } from "../components/Card";
import { getDepartments, getDepartmentDetail, addEmployeeToDepartment, addAdminToDepartment, removeUserFromDepartment, getPlants, createDepartment, deleteDepartment, } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useToastStore } from "../store/toast";
var DepartmentManagementPage = function () {
    var user = useAuth().user;
    var toast = useToastStore();
    var queryClient = useQueryClient();
    var _a = useState(null), selectedDepartment = _a[0], setSelectedDepartment = _a[1];
    var _b = useState("All"), plantFilter = _b[0], setPlantFilter = _b[1];
    var _c = useState(false), showAddUserModal = _c[0], setShowAddUserModal = _c[1];
    var _d = useState(false), showCreateDepartmentModal = _d[0], setShowCreateDepartmentModal = _d[1];
    var _e = useState("employee"), userType = _e[0], setUserType = _e[1];
    var _f = useState({
        username: "",
        email: "",
        password: "",
    }), newUser = _f[0], setNewUser = _f[1];
    var _g = useState({
        name: "",
        description: "",
        plant: "",
    }), newDepartment = _g[0], setNewDepartment = _g[1];
    var isSuperAdmin = (user === null || user === void 0 ? void 0 : user.role) === "super_admin";
    var isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin" || isSuperAdmin;
    // Queries
    var _h = useQuery({
        queryKey: ["departments", plantFilter || "All"],
        queryFn: function () {
            if (isSuperAdmin) {
                return getDepartments(!plantFilter || plantFilter === "All" ? undefined : plantFilter);
            }
            if (isAdmin && (user === null || user === void 0 ? void 0 : user.department)) {
                return getDepartments(user.plant || undefined);
            }
            return [];
        },
        enabled: isAdmin,
    }), _j = _h.data, departments = _j === void 0 ? [] : _j, loadingDepartments = _h.isLoading;
    var _k = useQuery({
        queryKey: ["department-detail", selectedDepartment === null || selectedDepartment === void 0 ? void 0 : selectedDepartment.department, selectedDepartment === null || selectedDepartment === void 0 ? void 0 : selectedDepartment.plant],
        queryFn: function () {
            return getDepartmentDetail(selectedDepartment.department, selectedDepartment.plant);
        },
        enabled: !!selectedDepartment,
    }), departmentDetail = _k.data, loadingDetail = _k.isLoading;
    var _l = useQuery({
        queryKey: ["plants"],
        queryFn: getPlants,
    }).data, plants = _l === void 0 ? [] : _l;
    useEffect(function () {
        setSelectedDepartment(null);
    }, [plantFilter]);
    var plantOptions = useMemo(function () {
        var uniquePlants = Array.from(new Set(plants));
        return __spreadArray(["All"], uniquePlants, true);
    }, [plants]);
    var filteredDepartments = useMemo(function () {
        if (plantFilter === "All")
            return departments;
        return departments.filter(function (dept) { return dept.plant === plantFilter; });
    }, [departments, plantFilter]);
    // Mutations
    var addUserMutation = useMutation({
        mutationFn: function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (data.type === "employee") {
                    return [2 /*return*/, addEmployeeToDepartment(data.department, data.plant, data.user)];
                }
                else {
                    return [2 /*return*/, addAdminToDepartment(data.department, data.plant, data.user)];
                }
                return [2 /*return*/];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-detail"] });
            toast.success("".concat(userType === "admin" ? "Admin" : "Employee", " Added"), "Successfully added ".concat(userType, " to department"));
            setShowAddUserModal(false);
            setNewUser({ username: "", email: "", password: "" });
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to add user";
            toast.error("Add Failed", message);
        },
    });
    var removeUserMutation = useMutation({
        mutationFn: removeUserFromDepartment,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-detail"] });
            toast.success("User Removed", "User has been removed from the department");
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to remove user";
            toast.error("Remove Failed", message);
        },
    });
    var createDepartmentMutation = useMutation({
        mutationFn: createDepartment,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-names"] });
            // Refetch to update the table immediately
            queryClient.refetchQueries({ queryKey: ["departments", plantFilter || "All"] });
            toast.success("Department Created", "New department has been created and will appear across all plants.");
            setShowCreateDepartmentModal(false);
            setNewDepartment({ name: "", description: "", plant: "" });
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to create department";
            toast.error("Create Failed", message);
        },
    });
    var deleteDepartmentMutation = useMutation({
        mutationFn: deleteDepartment,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            queryClient.invalidateQueries({ queryKey: ["department-names"] });
            // Refetch to update the table immediately
            queryClient.refetchQueries({ queryKey: ["departments", plantFilter || "All"] });
            toast.success("Department Deleted", "Department has been deleted successfully");
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || (error === null || error === void 0 ? void 0 : error.message) || "Failed to delete department";
            toast.error("Delete Failed", message);
        },
    });
    var handleAddUser = function () {
        if (!selectedDepartment)
            return;
        if (!newUser.username || !newUser.email || !newUser.password) {
            toast.error("Validation Error", "Please fill in all fields");
            return;
        }
        addUserMutation.mutate({
            department: selectedDepartment.department,
            plant: selectedDepartment.plant,
            user: newUser,
            type: userType,
        });
    };
    var handleRemoveUser = function (userId, username) {
        if (confirm("Are you sure you want to remove ".concat(username, "?"))) {
            removeUserMutation.mutate(userId);
        }
    };
    var handleCreateDepartment = function () {
        if (!newDepartment.name.trim()) {
            toast.error("Validation Error", "Department name is required");
            return;
        }
        if (!newDepartment.plant) {
            toast.error("Validation Error", "Please select a plant");
            return;
        }
        createDepartmentMutation.mutate({
            name: newDepartment.name.trim(),
            description: newDepartment.description.trim() || undefined,
            plant: newDepartment.plant,
        });
    };
    var handleDeleteDepartment = function (departmentName, deptInfo) {
        // Check if department has users or complaints
        if (deptInfo.admin_count > 0 || deptInfo.employee_count > 0) {
            toast.error("Cannot Delete", "This department has ".concat(deptInfo.admin_count + deptInfo.employee_count, " user(s). Please reassign or remove them first."));
            return;
        }
        if (deptInfo.total_complaints > 0) {
            toast.error("Cannot Delete", "This department has ".concat(deptInfo.total_complaints, " complaint(s) assigned to it."));
            return;
        }
        if (confirm("Are you sure you want to delete the department \"".concat(departmentName, "\"? This action cannot be undone."))) {
            deleteDepartmentMutation.mutate(departmentName);
        }
    };
    if (!isAdmin) {
        return (<div className="p-6">
        <Card>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </Card>
      </div>);
    }
    // Auto-open admin's own department on first load
    useEffect(function () {
        if (isAdmin && !isSuperAdmin && (user === null || user === void 0 ? void 0 : user.department) && !selectedDepartment) {
            setSelectedDepartment({ department: user.department, plant: user.plant || "P1" });
        }
    }, [isAdmin, isSuperAdmin, user === null || user === void 0 ? void 0 : user.department, user === null || user === void 0 ? void 0 : user.plant, selectedDepartment]);
    return (<div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin ? "Manage departments, admins, and employees across all plants" : "Manage ".concat(user === null || user === void 0 ? void 0 : user.department, " department members")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (<button onClick={function () { return setShowCreateDepartmentModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm">
              <Plus className="w-4 h-4"/>
              Create Department
            </button>)}
          {isSuperAdmin && plants.length > 0 && (<div className="flex items-center gap-2">
              <label htmlFor="plant-filter" className="text-sm font-medium text-gray-600">
                Plant
              </label>
              <select id="plant-filter" value={plantFilter} onChange={function (event) { return setPlantFilter(event.target.value); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                {plantOptions.map(function (plantName) { return (<option key={plantName} value={plantName}>
                    {plantName === "All" ? "All Plants" : plantName}
                  </option>); })}
              </select>
            </div>)}
        </div>
      </div>

      {/* Department Table - Only for Super Admin */}
      {isSuperAdmin && (<>
          {loadingDepartments ? (<div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading departments...</p>
              </div>
            </div>) : filteredDepartments.length === 0 ? (<Card>
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                <p className="text-gray-500">No departments found</p>
              </div>
            </Card>) : (<Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Plant</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Admins</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Employees</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Total Feedback</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Pending</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Resolved</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map(function (dept) { return (<tr key={"".concat(dept.name, "-").concat(dept.plant)} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600"/>
                            </div>
                            <span className="font-medium text-gray-900">{dept.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4"/>
                            <span>{dept.plant}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {dept.admin_count}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                            {dept.employee_count}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                            {dept.total_complaints}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-700 font-medium">{dept.pending_complaints}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-700 font-medium">{dept.resolved_complaints}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={function () { return setSelectedDepartment({ department: dept.name, plant: dept.plant }); }} className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm">
                              View
                            </button>
                            <button onClick={function () { return handleDeleteDepartment(dept.name, dept); }} disabled={dept.admin_count > 0 || dept.employee_count > 0 || dept.total_complaints > 0} className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed" title={dept.admin_count > 0 || dept.employee_count > 0 || dept.total_complaints > 0
                        ? "Cannot delete department with users or complaints"
                        : "Delete department"}>
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            </Card>)}
        </>)}

      {/* Department Detail - Card for Regular Admin, Modal for Super Admin */}
      {selectedDepartment && departmentDetail && !isSuperAdmin && (<Card>
          <div className="p-6">
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{departmentDetail.department}</h2>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4"/>
                  {departmentDetail.plant}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (<button onClick={function () { return setShowAddUserModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus className="w-4 h-4"/>
                    Add User
                  </button>)}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {departmentDetail.stats.total_complaints}
                </div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {departmentDetail.stats.pending}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {departmentDetail.stats.in_progress}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {departmentDetail.stats.resolved}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>

            {/* Members Table */}
            <div className="space-y-6">
              {/* Admins Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600"/>
                  Admins ({departmentDetail.admins.length})
                </h3>
                {departmentDetail.admins.length === 0 ? (<p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No admins assigned</p>) : (<div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentDetail.admins.map(function (admin) { return (<tr key={admin.id} className="border-b border-gray-200 hover:bg-blue-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{admin.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {admin.password && (<code className="bg-white px-2 py-1 rounded border border-gray-200">{admin.password}</code>)}
                            </td>
                          </tr>); })}
                      </tbody>
                    </table>
                  </div>)}
              </div>

              {/* Employees Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600"/>
                  Employees ({departmentDetail.employees.length})
                </h3>
                {departmentDetail.employees.length === 0 ? (<p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No employees in this department</p>) : (<div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-green-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Password</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentDetail.employees.map(function (employee) { return (<tr key={employee.id} className="border-b border-gray-200 hover:bg-green-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {employee.password && (<code className="bg-white px-2 py-1 rounded border border-gray-200">{employee.password}</code>)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={function () { return handleRemoveUser(employee.id, employee.username); }} className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove employee">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </td>
                          </tr>); })}
                      </tbody>
                    </table>
                  </div>)}
              </div>
            </div>
          </div>
        </Card>)}

      {/* Department Detail Modal - Only for Super Admin */}
      {selectedDepartment && departmentDetail && isSuperAdmin && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{departmentDetail.department}</h2>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4"/>
                  {departmentDetail.plant}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (<button onClick={function () { return setShowAddUserModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus className="w-4 h-4"/>
                    Add User
                  </button>)}
                <button onClick={function () { return setSelectedDepartment(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {departmentDetail.stats.total_complaints}
                  </div>
                  <div className="text-sm text-gray-600">Total Feedback</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {departmentDetail.stats.pending}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {departmentDetail.stats.in_progress}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {departmentDetail.stats.resolved}
                  </div>
                  <div className="text-sm text-gray-600">Resolved</div>
                </div>
              </div>

              {/* Members Table */}
              <div className="space-y-6">
                {/* Admins Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600"/>
                    Admins ({departmentDetail.admins.length})
                  </h3>
                  {departmentDetail.admins.length === 0 ? (<p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No admins assigned</p>) : (<div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Password</th>
                            {isSuperAdmin && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {departmentDetail.admins.map(function (admin) { return (<tr key={admin.id} className="border-b border-gray-200 hover:bg-blue-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{admin.username}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {admin.password && (<code className="bg-white px-2 py-1 rounded border border-gray-200">{admin.password}</code>)}
                              </td>
                              {isSuperAdmin && admin.id !== (user === null || user === void 0 ? void 0 : user.id) && (<td className="px-4 py-3 text-center">
                                  <button onClick={function () { return handleRemoveUser(admin.id, admin.username); }} className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove admin">
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                </td>)}
                            </tr>); })}
                        </tbody>
                      </table>
                    </div>)}
                </div>

                {/* Employees Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600"/>
                    Employees ({departmentDetail.employees.length})
                  </h3>
                  {departmentDetail.employees.length === 0 ? (<p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No employees in this department</p>) : (<div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-green-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Password</th>
                            {isAdmin && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {departmentDetail.employees.map(function (employee) { return (<tr key={employee.id} className="border-b border-gray-200 hover:bg-green-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.username}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {employee.password && (<code className="bg-white px-2 py-1 rounded border border-gray-200">{employee.password}</code>)}
                              </td>
                              {isAdmin && (<td className="px-4 py-3 text-center">
                                  <button onClick={function () { return handleRemoveUser(employee.id, employee.username); }} className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove employee">
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                </td>)}
                            </tr>); })}
                        </tbody>
                      </table>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* Add User Modal */}
      {showAddUserModal && selectedDepartment && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className={"p-6 rounded-t-2xl ".concat(userType === "admin" ? "bg-blue-600" : "bg-emerald-600", " text-white")}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {userType === "admin" ? <ShieldCheck className="w-6 h-6"/> : <Users className="w-6 h-6"/>}
                Add {userType === "admin" ? "Admin" : "Employee"}
              </h3>
              <p className="text-sm text-white/80 mt-1">
                to {selectedDepartment.department} • {selectedDepartment.plant}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">User Type</label>
                <div className="flex gap-3">
                  <button onClick={function () { return setUserType("employee"); }} className={"flex-1 py-3 px-4 rounded-xl border-2 transition-all ".concat(userType === "employee"
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-white border-slate-300 text-slate-700")}>
                    <Users className="w-5 h-5 inline mr-2"/>
                    Employee
                  </button>
                  {isSuperAdmin && (<button onClick={function () { return setUserType("admin"); }} className={"flex-1 py-3 px-4 rounded-xl border-2 transition-all ".concat(userType === "admin"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-slate-300 text-slate-700")}>
                      <ShieldCheck className="w-5 h-5 inline mr-2"/>
                      Admin
                    </button>)}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input type="text" value={newUser.username} onChange={function (e) { return setNewUser(__assign(__assign({}, newUser), { username: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Enter username"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input type="email" value={newUser.email} onChange={function (e) { return setNewUser(__assign(__assign({}, newUser), { email: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Enter email"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input type="password" value={newUser.password} onChange={function (e) { return setNewUser(__assign(__assign({}, newUser), { password: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Enter password"/>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={function () { return setShowAddUserModal(false); }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleAddUser} disabled={addUserMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition">
                  {addUserMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Create Department Modal */}
      {showCreateDepartmentModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="p-6 rounded-t-2xl bg-emerald-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6"/>
                Create New Department
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Add a new department to the system
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Select a plant where this department will operate. You can create the same department for other plants separately.
                </p>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Plant <span className="text-red-500">*</span>
                </label>
                <select value={newDepartment.plant} onChange={function (e) { return setNewDepartment(__assign(__assign({}, newDepartment), { plant: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10">
                  <option value="">Select a plant...</option>
                  {plants.map(function (plant) { return (<option key={plant} value={plant}>
                      {plant}
                    </option>); })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={newDepartment.name} onChange={function (e) { return setNewDepartment(__assign(__assign({}, newDepartment), { name: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10" placeholder="e.g., Finance, Marketing, HR"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea value={newDepartment.description} onChange={function (e) { return setNewDepartment(__assign(__assign({}, newDepartment), { description: e.target.value })); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10 resize-none" placeholder="Brief description of the department" rows={3}/>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={function () {
                setShowCreateDepartmentModal(false);
                setNewDepartment({ name: "", description: "", plant: "" });
            }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleCreateDepartment} disabled={createDepartmentMutation.isPending || !newDepartment.name.trim() || !newDepartment.plant} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition">
                  {createDepartmentMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
export default DepartmentManagementPage;
