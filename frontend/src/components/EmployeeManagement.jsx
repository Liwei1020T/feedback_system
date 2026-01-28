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
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Users, Loader2 } from "lucide-react";
import { listMyEmployees, addEmployee, removeEmployee } from "../api";
import { Card, CardBody, CardTitle } from "./Card";
import { useToastStore } from "../store/toast";
var EmployeeManagement = function () {
    var toast = useToastStore();
    var queryClient = useQueryClient();
    var _a = useState(false), showAddForm = _a[0], setShowAddForm = _a[1];
    var _b = useState({
        username: "",
        email: "",
        password: "",
    }), formData = _b[0], setFormData = _b[1];
    var _c = useState(null), formError = _c[0], setFormError = _c[1];
    // Queries and mutations
    var _d = useQuery({
        queryKey: ["my-employees"],
        queryFn: listMyEmployees,
    }), _e = _d.data, employees = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    var addEmployeeMutation = useMutation({
        mutationFn: addEmployee,
        onSuccess: function (employee) {
            queryClient.invalidateQueries({ queryKey: ["my-employees"] });
            setFormData({ username: "", email: "", password: "" });
            setShowAddForm(false);
            setFormError(null);
            toast.success("Employee Added", "".concat(employee.username, " has been added to your team"));
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || "Failed to add employee";
            setFormError(message);
        },
    });
    var removeEmployeeMutation = useMutation({
        mutationFn: removeEmployee,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["my-employees"] });
            toast.success("Employee Removed", "Employee has been removed from your team");
        },
        onError: function (error) {
            var _a, _b;
            var message = ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || "Failed to remove employee";
            toast.error("Error", message);
        },
    });
    var handleSubmit = function (e) {
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
    return (<Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Your Team</CardTitle>
        <button onClick={function () { return setShowAddForm(!showAddForm); }} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <UserPlus size={16}/>
          Add Employee
        </button>
      </div>

      <CardBody>
        {/* Add Employee Form */}
        {showAddForm && (<div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-4">Add New Employee</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <input type="text" value={formData.username} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { username: e.target.value })); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter username" disabled={addEmployeeMutation.isPending}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input type="email" value={formData.email} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { email: e.target.value })); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter email" disabled={addEmployeeMutation.isPending}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input type="password" value={formData.password} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { password: e.target.value })); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min 8 characters" disabled={addEmployeeMutation.isPending}/>
              </div>

              {formError && (<div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {formError}
                </div>)}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={addEmployeeMutation.isPending} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                  {addEmployeeMutation.isPending && <Loader2 size={16} className="animate-spin"/>}
                  Add Employee
                </button>
                <button type="button" onClick={function () {
                setShowAddForm(false);
                setFormError(null);
            }} className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>)}

        {/* Employees List */}
        {isLoading ? (<div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400"/>
          </div>) : employees.length === 0 ? (<div className="text-center py-8">
            <Users size={32} className="mx-auto text-slate-300 mb-2"/>
            <p className="text-slate-500">No employees added yet</p>
            <p className="text-xs text-slate-400 mt-1">Add employees to help you manage feedback</p>
          </div>) : (<div className="space-y-3">
            {employees.map(function (employee) { return (<div key={employee.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{employee.username}</p>
                  <p className="text-sm text-slate-600 truncate">{employee.email}</p>
                  {employee.department && (<p className="text-xs text-slate-500">
                      {employee.department}
                      {employee.plant ? " \u2022 ".concat(employee.plant) : ""}
                    </p>)}
                </div>
                <button onClick={function () { return removeEmployeeMutation.mutate(employee.id); }} disabled={removeEmployeeMutation.isPending} className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Remove employee">
                  <Trash2 size={18}/>
                </button>
              </div>); })}
          </div>)}
      </CardBody>
    </Card>);
};
export default EmployeeManagement;
