import { UserCog, Search, Plus, Edit2, Trash2, Mail, Building2, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardTitle } from "../components/Card";
import { addEmployee, listMyEmployees, removeEmployee, getDashboardStats } from "../api";
import { useToastStore } from "../store/toast";
var EmployeesPage = function () {
    var _a, _b;
    var _c = useState(""), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState("All"), filterDepartment = _d[0], setFilterDepartment = _d[1];
    var toast = useToastStore();
    var queryClient = useQueryClient();
    // Real employees from API (current admin's team)
    var _e = useQuery({
        queryKey: ["my-employees"],
        queryFn: listMyEmployees
    }), _f = _e.data, myEmployees = _f === void 0 ? [] : _f, isLoading = _e.isLoading;
    var dashboardStats = useQuery({
        queryKey: ["dashboard"],
        queryFn: getDashboardStats
    }).data;
    // Departments derived from current list
    var departments = useMemo(function () {
        var names = new Set(["All"]);
        myEmployees.forEach(function (e) { return names.add(e.department || "Unassigned"); });
        return Array.from(names);
    }, [myEmployees]);
    var filteredEmployees = useMemo(function () {
        return myEmployees.filter(function (emp) {
            var matchesSearch = emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase());
            var matchesDepartment = filterDepartment === "All" || (emp.department || "Unassigned") === filterDepartment;
            return matchesSearch && matchesDepartment;
        });
    }, [myEmployees, searchTerm, filterDepartment]);
    // Add employee via simple prompts (quick enablement)
    var addMutation = useMutation({
        mutationFn: addEmployee,
        onSuccess: function (emp) {
            toast.success("Employee Added", "".concat(emp.username, " has been added to your team"));
            queryClient.invalidateQueries({ queryKey: ["my-employees"] });
        },
        onError: function (err) {
            var _a, _b;
            var msg = ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || "Unable to add employee";
            toast.error("Add Failed", msg);
        }
    });
    var deleteMutation = useMutation({
        mutationFn: removeEmployee,
        onSuccess: function () {
            toast.success("Employee Removed", "Employee has been removed from your team");
            queryClient.invalidateQueries({ queryKey: ["my-employees"] });
        },
        onError: function (err) {
            var _a, _b;
            var msg = ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.detail) || "Unable to remove employee";
            toast.error("Error", msg);
        }
    });
    return (<div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="banner-gradient rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <UserCog className="w-10 h-10"/>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
              <p className="text-cyan-100">Manage employee accounts and department assignments</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all" onClick={function () {
            var _a, _b, _c;
            var username = (_a = prompt("Username (e.g., john.doe)")) === null || _a === void 0 ? void 0 : _a.trim();
            if (!username)
                return;
            var email = (_b = prompt("Email")) === null || _b === void 0 ? void 0 : _b.trim();
            if (!email)
                return;
            var password = (_c = prompt("Temporary Password (min 10 chars)")) === null || _c === void 0 ? void 0 : _c.trim();
            if (!password)
                return;
            addMutation.mutate({ username: username, email: email, password: password });
        }}>
            <Plus className="w-5 h-5"/>
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-2 border-blue-200">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Employees</p>
            <p className="text-3xl font-bold text-blue-900">{myEmployees.length}</p>
          </div>
        </Card>

        <Card className="bg-emerald-50 border-2 border-emerald-200">
          <div>
            <p className="text-sm font-medium text-emerald-700 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-emerald-900">{myEmployees.length}</p>
          </div>
        </Card>

        <Card className="bg-purple-50 border-2 border-purple-200">
          <div>
            <p className="text-sm font-medium text-purple-700 mb-1">Departments</p>
            <p className="text-3xl font-bold text-purple-900">{Math.max(0, departments.length - 1)}</p>
          </div>
        </Card>

        <Card className="bg-amber-50 border-2 border-amber-200">
          <div>
            <p className="text-sm font-medium text-amber-700 mb-1">Total Complaints</p>
            <p className="text-3xl font-bold text-amber-900">{((_a = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_complaints) !== null && _a !== void 0 ? _a : 0) + ((_b = dashboardStats === null || dashboardStats === void 0 ? void 0 : dashboardStats.total_feedback) !== null && _b !== void 0 ? _b : 0)}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"/>
              <input type="text" placeholder="Search employees by name or email..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <select value={filterDepartment} onChange={function (e) { return setFilterDepartment(e.target.value); }} className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {departments.map(function (dept) { return (<option key={dept} value={dept}>{dept}</option>); })}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Employee List */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-500"/>
              Employee Directory
            </div>
            <span className="text-sm text-slate-500">{isLoading ? "Loading…" : "".concat(filteredEmployees.length, " employees")}</span>
          </div>
        </CardTitle>
        <CardBody>
          <div className="space-y-3">
            {filteredEmployees.length === 0 ? (<div className="text-center py-12">
                <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                <p className="text-slate-500">No employees found</p>
              </div>) : (filteredEmployees.map(function (employee) { return (<div key={employee.id} className="flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {employee.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900">{employee.username}</h3>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">ACTIVE</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3"/>
                          <span>{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3"/>
                          <span>{employee.department || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3"/>
                          <span>{employee.plant || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                    {/* Placeholder for future metrics */}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors group-hover:scale-110" title="Edit (coming soon)">
                      <Edit2 className="w-4 h-4 text-blue-600"/>
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors group-hover:scale-110" title="Remove employee" onClick={function () {
                if (confirm("Remove ".concat(employee.username, " from your team?"))) {
                    deleteMutation.mutate(employee.id);
                }
            }}>
                      <Trash2 className="w-4 h-4 text-red-600"/>
                    </button>
                  </div>
                </div>); }))}
          </div>
        </CardBody>
      </Card>
    </div>);
};
export default EmployeesPage;
