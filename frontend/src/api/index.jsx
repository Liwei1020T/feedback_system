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
import { apiClient } from "./client";
export var login = function (username, password) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/auth/login", { username: username, password: password })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var refreshToken = function (refresh_token) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/auth/refresh", { refresh_token: refresh_token })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var submitComplaint = function (payload, attachment) { return __awaiter(void 0, void 0, void 0, function () {
    var formData, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                formData = new FormData();
                Object.entries(payload).forEach(function (_a) {
                    var key = _a[0], value = _a[1];
                    if (value !== undefined && value !== null) {
                        formData.append(key, value);
                    }
                });
                if (attachment) {
                    formData.append("attachment", attachment);
                }
                return [4 /*yield*/, apiClient.post("/api/complaints", formData)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
var mapMeta = function (meta) { return ({
    page: meta.page,
    pageSize: meta.page_size,
    total: meta.total,
    totalPages: meta.total_pages
}); };
export var listComplaints = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (params) {
        var query, data;
        if (params === void 0) { params = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = {};
                    if (params.page !== undefined)
                        query.page = params.page;
                    if (params.pageSize !== undefined)
                        query.page_size = params.pageSize;
                    if (params.sort)
                        query.sort = params.sort;
                    if (params.order)
                        query.order = params.order;
                    if (params.search)
                        query.search = params.search;
                    if (params.kind)
                        query.kind = params.kind;
                    if (params.category)
                        query.category = params.category;
                    if (params.status)
                        query.status = params.status;
                    if (params.priority)
                        query.priority = params.priority;
                    if (params.plant)
                        query.plant = params.plant;
                    if (params.fromDate)
                        query.from_date = params.fromDate;
                    if (params.toDate)
                        query.to_date = params.toDate;
                    return [4 /*yield*/, apiClient.get("/api/complaints", {
                            params: Object.keys(query).length ? query : undefined
                        })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, {
                            items: data.items,
                            meta: mapMeta(data.meta)
                        }];
            }
        });
    });
};
export var getPlants = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/plants")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getComplaint = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(id))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var updateComplaint = function (id, updates) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.put("/api/complaints/".concat(id), updates)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var classifyComplaint = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(id, "/classify"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getReplyAssistance = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(id, "/assist"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getCategorySuggestions = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(id, "/suggestions"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.suggestions];
        }
    });
}); };
export var createReply = function (payload, attachment) { return __awaiter(void 0, void 0, void 0, function () {
    var formData, data;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                formData = new FormData();
                formData.append("complaint_id", payload.complaint_id.toString());
                formData.append("admin_id", payload.admin_id.toString());
                formData.append("reply_text", payload.reply_text);
                formData.append("send_email", ((_a = payload.send_email) !== null && _a !== void 0 ? _a : true).toString());
                if (attachment) {
                    formData.append("attachment", attachment);
                }
                return [4 /*yield*/, apiClient.post("/api/replies", formData)];
            case 1:
                data = (_b.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var listReplies = function (complaintId_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([complaintId_1], args_1, true), void 0, function (complaintId, params) {
        var query, data;
        if (params === void 0) { params = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = {};
                    if (params.page !== undefined)
                        query.page = params.page;
                    if (params.pageSize !== undefined)
                        query.page_size = params.pageSize;
                    if (params.order)
                        query.order = params.order;
                    return [4 /*yield*/, apiClient.get("/api/replies/".concat(complaintId), {
                            params: Object.keys(query).length ? query : undefined
                        })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, {
                            items: data.items,
                            meta: mapMeta(data.meta)
                        }];
            }
        });
    });
};
export var getComplaintAttachments = function (complaintId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(complaintId, "/attachments"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var uploadAttachment = function (complaintId, file) { return __awaiter(void 0, void 0, void 0, function () {
    var formData, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                formData = new FormData();
                formData.append("complaint_id", complaintId.toString());
                formData.append("file", file);
                return [4 /*yield*/, apiClient.post("/api/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var downloadAttachment = function (attachmentId) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/files/".concat(attachmentId), {
                    responseType: "blob"
                })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
export var deleteAttachment = function (attachmentId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/files/".concat(attachmentId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var listAdmins = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/admins")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var createAdmin = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/admins", payload)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var listAdminDepartments = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/admins/departments")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var listPlants = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/plants")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getDashboardStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/dashboard")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getDashboardKpis = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/kpis", { params: params })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getTopCategories = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var data;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/analytics/top-categories", { params: { limit: limit } })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data.categories];
            }
        });
    });
};
export var getStatusDistribution = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/distribution/status")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.distribution];
        }
    });
}); };
export var getSentimentMetrics = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (days) {
        var data;
        if (days === void 0) { days = 30; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/analytics/sentiment", { params: { days: days } })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
};
export var getAIRecommendations = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/ai/recommendations")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.recommendations];
        }
    });
}); };
export var getRootCauseInsights = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/ai/root-causes")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getInsightsHeader = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/insights-header")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var refreshAIInsights = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, recs, roots;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    apiClient.post("/api/ai/recommendations/refresh"),
                    apiClient.post("/api/ai/root-causes/refresh")
                ])];
            case 1:
                _a = _b.sent(), recs = _a[0], roots = _a[1];
                return [2 /*return*/, { recommendations: recs.data, rootCauses: roots.data }];
        }
    });
}); };
export var getTrendData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/trends")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.points];
        }
    });
}); };
export var getUserStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/user-stats")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getProfilePreferences = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/profile/preferences")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var updateProfilePreferences = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.put("/api/profile/preferences", payload)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var changePassword = function (current_password, new_password) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/profile/change-password", {
                    current_password: current_password,
                    new_password: new_password
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.success];
        }
    });
}); };
export var getFeedbackPresets = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/profile/presets/feedback")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var saveFeedbackPresets = function (presets) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.put("/api/profile/presets/feedback", {
                    presets: presets
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var listMyEmployees = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/profile/my-employees")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var addEmployee = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/profile/my-employees", payload)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var removeEmployee = function (employeeId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/profile/my-employees/".concat(employeeId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var getManager = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/profile/manager")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getDepartmentStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/department-stats")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.items];
        }
    });
}); };
export var getSummary = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (period) {
        var data;
        if (period === void 0) { period = "weekly"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/analytics/summary", {
                        params: { period: period }
                    })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
};
export var generateReport = function (period) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/reports/generate", { period: period })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getWeeklyReports = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/reports/weekly")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getWeeklyReportContent = function (id_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([id_1], args_1, true), void 0, function (id, format) {
        var response;
        if (format === void 0) { format = "html"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/reports/weekly/".concat(id), {
                        params: { format: format },
                        responseType: "text"
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
};
export var generateWeeklyReportNow = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/reports/weekly/generate-now", {})];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var deleteReport = function (reportId) { return __awaiter(void 0, void 0, void 0, function () {
    var err_1, status_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 5]);
                return [4 /*yield*/, apiClient.delete("/api/reports/".concat(reportId))];
            case 1:
                _b.sent();
                return [3 /*break*/, 5];
            case 2:
                err_1 = _b.sent();
                status_1 = (_a = err_1 === null || err_1 === void 0 ? void 0 : err_1.response) === null || _a === void 0 ? void 0 : _a.status;
                if (!(status_1 === 405)) return [3 /*break*/, 4];
                return [4 /*yield*/, apiClient.post("/api/reports/".concat(reportId, "/delete"))];
            case 3:
                _b.sent();
                return [2 /*return*/];
            case 4: throw err_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
export var getAppLogs = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/logs")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.content];
        }
    });
}); };
export var getEmailQueueStats = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/logs/email-queue")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getComplaintSummary = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(id, "/summary"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var analyzeComplaintDeep = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(id, "/analyze"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var regenerateResolutionTemplate = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(id, "/regenerate-template"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data.template];
        }
    });
}); };
export var analyzeAllComplaints = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/analyze-all")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getAdvancedAnalytics = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (includePredictions) {
        var data;
        if (includePredictions === void 0) { includePredictions = true; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/analytics/advanced", {
                        params: { include_predictions: includePredictions }
                    })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
};
export var getCategoryDeepDive = function (category) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/category/".concat(category))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
// Natural Language Query
export var queryNaturalLanguage = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/analytics/nl-query", null, {
                    params: { query: query }
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
// Voice of Customer Analysis
export var getVoiceOfCustomerAnalysis = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/analytics/voc", { params: params })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var createInternalNote = function (complaintId, payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(complaintId, "/notes"), payload)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var listInternalNotes = function (complaintId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/complaints/".concat(complaintId, "/notes"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var updateInternalNote = function (complaintId, noteId, payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.put("/api/complaints/".concat(complaintId, "/notes/").concat(noteId), payload)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var deleteInternalNote = function (complaintId, noteId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/complaints/".concat(complaintId, "/notes/").concat(noteId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var pinInternalNote = function (complaintId, noteId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(complaintId, "/notes/").concat(noteId, "/pin"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var watchComplaint = function (complaintId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/complaints/".concat(complaintId, "/notes/watch"))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var unwatchComplaint = function (complaintId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/complaints/".concat(complaintId, "/notes/watch"))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var getDepartments = function (plant) { return __awaiter(void 0, void 0, void 0, function () {
    var normalizedPlant, params, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                normalizedPlant = plant && plant.trim();
                params = normalizedPlant && normalizedPlant.toLowerCase() !== "all"
                    ? { plant: normalizedPlant }
                    : undefined;
                return [4 /*yield*/, apiClient.get("/api/departments", {
                        params: params
                    })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var getDepartmentDetail = function (department, plant) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/departments/".concat(encodeURIComponent(department), "/").concat(encodeURIComponent(plant)))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var addEmployeeToDepartment = function (department, plant, employee) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/departments/".concat(encodeURIComponent(department), "/").concat(encodeURIComponent(plant), "/employees"), employee)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var addAdminToDepartment = function (department, plant, admin) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/departments/".concat(encodeURIComponent(department), "/").concat(encodeURIComponent(plant), "/admins"), admin)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var removeUserFromDepartment = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/departments/users/".concat(userId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var getDepartmentNames = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/departments/names")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var createDepartment = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/departments", payload, {
                    params: { plant: payload.plant }
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var deleteDepartment = function (departmentName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/departments/".concat(encodeURIComponent(departmentName)))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var sendChatMessage = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/chatbot/chat", message)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var clearChatConversation = function (conversationId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/chatbot/chat/".concat(conversationId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var getChatHistory = function (conversationId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/chatbot/chat/history/".concat(conversationId))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
// ============================================================================
// Notifications API
// ============================================================================
export var listNotifications = function (isRead_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([isRead_1], args_1, true), void 0, function (isRead, limit) {
        var data;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, apiClient.get("/api/notifications", { params: { is_read: isRead, limit: limit } })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
};
export var getNotification = function (notifId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.get("/api/notifications/".concat(notifId))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var markNotificationRead = function (notifId) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.patch("/api/notifications/".concat(notifId, "/read"))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var markAllNotificationsRead = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/notifications/mark-all-read")];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
export var deleteNotification = function (notifId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.delete("/api/notifications/".concat(notifId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var createNotification = function (notification) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, apiClient.post("/api/notifications", notification)];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
