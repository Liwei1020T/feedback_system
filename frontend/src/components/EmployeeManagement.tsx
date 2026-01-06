import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Users, Loader2 } from "lucide-react";
import type { EmployeeUser } from "../api";
import { listMyEmployees, addEmployee, removeEmployee, type EmployeeCreatePayload } from "../api";
import { Card, CardBody, CardTitle } from "./Card";
import { useToastStore } from "../store/toast";

const EmployeeManagement: React.FC = () => {
  const toast = useToastStore();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<EmployeeCreatePayload>({
    username: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Queries and mutations
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["my-employees"],
    queryFn: listMyEmployees,
  });

  const addEmployeeMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["my-employees"] });
      setFormData({ username: "", email: "", password: "" });
      setShowAddForm(false);
      setFormError(null);
      toast.success("Employee Added", `${employee.username} has been added to your team`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to add employee";
      setFormError(message);
    },
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: removeEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-employees"] });
      toast.success("Employee Removed", "Employee has been removed from your team");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to remove employee";
      toast.error("Error", message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.username.trim()) {
      setFormError("Username is required");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!formData.password) {
      setFormError("Password is required");
      return;
    }
    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    addEmployeeMutation.mutate(formData);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Your Team</CardTitle>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <UserPlus size={16} />
          Add Employee
        </button>
      </div>

      <CardBody>
        {/* Add Employee Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-4">Add New Employee</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  disabled={addEmployeeMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                  disabled={addEmployeeMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 8 characters"
                  disabled={addEmployeeMutation.isPending}
                />
              </div>

              {formError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={addEmployeeMutation.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  {addEmployeeMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Add Employee
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError(null);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employees List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">No employees added yet</p>
            <p className="text-xs text-slate-400 mt-1">Add employees to help you manage feedback</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{employee.username}</p>
                  <p className="text-sm text-slate-600 truncate">{employee.email}</p>
                  {employee.department && (
                    <p className="text-xs text-slate-500">
                      {employee.department}
                      {employee.plant ? ` • ${employee.plant}` : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeEmployeeMutation.mutate(employee.id)}
                  disabled={removeEmployeeMutation.isPending}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove employee"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default EmployeeManagement;
