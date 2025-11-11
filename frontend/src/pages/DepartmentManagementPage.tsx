import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Building2, MapPin, Plus, Trash2, ShieldCheck, X } from "lucide-react";
import { Card } from "../components/Card";
import {
  getDepartments,
  getDepartmentDetail,
  addEmployeeToDepartment,
  addAdminToDepartment,
  removeUserFromDepartment,
  getDepartmentNames,
  getPlants,
  createDepartment,
  deleteDepartment,
  type DepartmentInfo,
  type DepartmentDetail,
  type EmployeeUser,
} from "../api";
import { useAuth } from "../hooks/useAuth";
import { useToastStore } from "../store/toast";

const DepartmentManagementPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToastStore();
  const queryClient = useQueryClient();

  const [selectedDepartment, setSelectedDepartment] = useState<{
    department: string;
    plant: string;
  } | null>(null);
  const [plantFilter, setPlantFilter] = useState<string>("All");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [userType, setUserType] = useState<"employee" | "admin">("employee");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    plant: "",
  });

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  // Queries
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ["departments", plantFilter || "All"],
    queryFn: () => {
      if (isSuperAdmin) {
        return getDepartments(!plantFilter || plantFilter === "All" ? undefined : plantFilter);
      }
      if (isAdmin && user?.department) {
        return getDepartments(user.plant || undefined);
      }
      return [];
    },
    enabled: isAdmin,
  });

  const { data: departmentDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["department-detail", selectedDepartment?.department, selectedDepartment?.plant],
    queryFn: () =>
      getDepartmentDetail(selectedDepartment!.department, selectedDepartment!.plant),
    enabled: !!selectedDepartment,
  });

  const { data: plants = [] } = useQuery({
    queryKey: ["plants"],
    queryFn: getPlants,
  });

  useEffect(() => {
    setSelectedDepartment(null);
  }, [plantFilter]);

  const plantOptions = useMemo(() => {
    const uniquePlants = Array.from(new Set(plants));
    return ["All", ...uniquePlants];
  }, [plants]);

  const filteredDepartments = useMemo(() => {
    if (plantFilter === "All") return departments;
    return departments.filter(dept => dept.plant === plantFilter);
  }, [departments, plantFilter]);

  // Mutations
  const addUserMutation = useMutation({
    mutationFn: async (data: { department: string; plant: string; user: typeof newUser; type: "employee" | "admin" }) => {
      if (data.type === "employee") {
        return addEmployeeToDepartment(data.department, data.plant, data.user);
      } else {
        return addAdminToDepartment(data.department, data.plant, data.user);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-detail"] });
      toast.success(
        `${userType === "admin" ? "Admin" : "Employee"} Added`,
        `Successfully added ${userType} to department`
      );
      setShowAddUserModal(false);
      setNewUser({ username: "", email: "", password: "" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || "Failed to add user";
      toast.error("Add Failed", message);
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: removeUserFromDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-detail"] });
      toast.success("User Removed", "User has been removed from the department");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || "Failed to remove user";
      toast.error("Remove Failed", message);
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-names"] });
      // Refetch to update the table immediately
      queryClient.refetchQueries({ queryKey: ["departments", plantFilter || "All"] });
      toast.success("Department Created", "New department has been created and will appear across all plants.");
      setShowCreateDepartmentModal(false);
      setNewDepartment({ name: "", description: "", plant: "" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || "Failed to create department";
      toast.error("Create Failed", message);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-names"] });
      // Refetch to update the table immediately
      queryClient.refetchQueries({ queryKey: ["departments", plantFilter || "All"] });
      toast.success("Department Deleted", "Department has been deleted successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || "Failed to delete department";
      toast.error("Delete Failed", message);
    },
  });

  const handleAddUser = () => {
    if (!selectedDepartment) return;
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

  const handleRemoveUser = (userId: number, username: string) => {
    if (confirm(`Are you sure you want to remove ${username}?`)) {
      removeUserMutation.mutate(userId);
    }
  };

  const handleCreateDepartment = () => {
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

  const handleDeleteDepartment = (departmentName: string, deptInfo: DepartmentInfo) => {
    // Check if department has users or complaints
    if (deptInfo.admin_count > 0 || deptInfo.employee_count > 0) {
      toast.error(
        "Cannot Delete",
        `This department has ${deptInfo.admin_count + deptInfo.employee_count} user(s). Please reassign or remove them first.`
      );
      return;
    }

    if (deptInfo.total_complaints > 0) {
      toast.error(
        "Cannot Delete",
        `This department has ${deptInfo.total_complaints} complaint(s) assigned to it.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
      deleteDepartmentMutation.mutate(departmentName);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  // Auto-open admin's own department on first load
  useEffect(() => {
    if (isAdmin && !isSuperAdmin && user?.department && !selectedDepartment) {
      setSelectedDepartment({ department: user.department, plant: user.plant || "P1" });
    }
  }, [isAdmin, isSuperAdmin, user?.department, user?.plant, selectedDepartment]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin ? "Manage departments, admins, and employees across all plants" : `Manage ${user?.department} department members`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateDepartmentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Department
            </button>
          )}
          {isSuperAdmin && plants.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="plant-filter" className="text-sm font-medium text-gray-600">
                Plant
              </label>
              <select
                id="plant-filter"
                value={plantFilter}
                onChange={(event) => setPlantFilter(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                {plantOptions.map((plantName) => (
                  <option key={plantName} value={plantName}>
                    {plantName === "All" ? "All Plants" : plantName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Department Table - Only for Super Admin */}
      {isSuperAdmin && (
        <>
          {loadingDepartments ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading departments...</p>
              </div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <Card>
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No departments found</p>
              </div>
            </Card>
          ) : (
            <Card>
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
                    {filteredDepartments.map((dept) => (
                      <tr 
                        key={`${dept.name}-${dept.plant}`}
                        className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{dept.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
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
                            <button
                              onClick={() => setSelectedDepartment({ department: dept.name, plant: dept.plant })}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(dept.name, dept)}
                              disabled={dept.admin_count > 0 || dept.employee_count > 0 || dept.total_complaints > 0}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title={
                                dept.admin_count > 0 || dept.employee_count > 0 || dept.total_complaints > 0
                                  ? "Cannot delete department with users or complaints"
                                  : "Delete department"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Department Detail - Card for Regular Admin, Modal for Super Admin */}
      {selectedDepartment && departmentDetail && !isSuperAdmin && (
        <Card>
          <div className="p-6">
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{departmentDetail.department}</h2>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {departmentDetail.plant}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                )}
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
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Admins ({departmentDetail.admins.length})
                </h3>
                {departmentDetail.admins.length === 0 ? (
                  <p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No admins assigned</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentDetail.admins.map((admin) => (
                          <tr key={admin.id} className="border-b border-gray-200 hover:bg-blue-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{admin.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {admin.password && (
                                <code className="bg-white px-2 py-1 rounded border border-gray-200">{admin.password}</code>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Employees Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Employees ({departmentDetail.employees.length})
                </h3>
                {departmentDetail.employees.length === 0 ? (
                  <p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No employees in this department</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                        {departmentDetail.employees.map((employee) => (
                          <tr key={employee.id} className="border-b border-gray-200 hover:bg-green-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {employee.password && (
                                <code className="bg-white px-2 py-1 rounded border border-gray-200">{employee.password}</code>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRemoveUser(employee.id, employee.username)}
                                className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remove employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Department Detail Modal - Only for Super Admin */}
      {selectedDepartment && departmentDetail && isSuperAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{departmentDetail.department}</h2>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {departmentDetail.plant}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                )}
                <button
                  onClick={() => setSelectedDepartment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
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
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Admins ({departmentDetail.admins.length})
                  </h3>
                  {departmentDetail.admins.length === 0 ? (
                    <p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No admins assigned</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                          {departmentDetail.admins.map((admin) => (
                            <tr key={admin.id} className="border-b border-gray-200 hover:bg-blue-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{admin.username}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {admin.password && (
                                  <code className="bg-white px-2 py-1 rounded border border-gray-200">{admin.password}</code>
                                )}
                              </td>
                              {isSuperAdmin && admin.id !== user?.id && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleRemoveUser(admin.id, admin.username)}
                                    className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Remove admin"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Employees Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Employees ({departmentDetail.employees.length})
                  </h3>
                  {departmentDetail.employees.length === 0 ? (
                    <p className="text-gray-500 text-sm px-4 py-3 bg-gray-50 rounded-lg">No employees in this department</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                          {departmentDetail.employees.map((employee) => (
                            <tr key={employee.id} className="border-b border-gray-200 hover:bg-green-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.username}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {employee.password && (
                                  <code className="bg-white px-2 py-1 rounded border border-gray-200">{employee.password}</code>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleRemoveUser(employee.id, employee.username)}
                                    className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Remove employee"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className={`p-6 rounded-t-2xl ${userType === "admin" ? "bg-blue-600" : "bg-emerald-600"} text-white`}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {userType === "admin" ? <ShieldCheck className="w-6 h-6" /> : <Users className="w-6 h-6" />}
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
                  <button
                    onClick={() => setUserType("employee")}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      userType === "employee"
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-white border-slate-300 text-slate-700"
                    }`}
                  >
                    <Users className="w-5 h-5 inline mr-2" />
                    Employee
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setUserType("admin")}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                        userType === "admin"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-slate-300 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 inline mr-2" />
                      Admin
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter password"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
                >
                  {addUserMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateDepartmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="p-6 rounded-t-2xl bg-emerald-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" />
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
                <select
                  value={newDepartment.plant}
                  onChange={(e) => setNewDepartment({ ...newDepartment, plant: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                >
                  <option value="">Select a plant...</option>
                  {plants.map((plant) => (
                    <option key={plant} value={plant}>
                      {plant}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  placeholder="e.g., Finance, Marketing, HR"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10 resize-none"
                  placeholder="Brief description of the department"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateDepartmentModal(false);
                    setNewDepartment({ name: "", description: "", plant: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDepartment}
                  disabled={createDepartmentMutation.isPending || !newDepartment.name.trim() || !newDepartment.plant}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition"
                >
                  {createDepartmentMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagementPage;
