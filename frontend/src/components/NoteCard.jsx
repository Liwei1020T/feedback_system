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
import { useState } from "react";
import { Pin, Edit2, Trash2, Save, X } from "lucide-react";
var NoteCard = function (_a) {
    var note = _a.note, currentUserId = _a.currentUserId, onEdit = _a.onEdit, onDelete = _a.onDelete, onPin = _a.onPin;
    var _b = useState(false), isEditing = _b[0], setIsEditing = _b[1];
    var _c = useState(note.content), editContent = _c[0], setEditContent = _c[1];
    var _d = useState(false), isLoading = _d[0], setIsLoading = _d[1];
    var isAuthor = currentUserId === note.author_id;
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editContent.trim())
                        return [2 /*return*/];
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onEdit(note.id, editContent)];
                case 2:
                    _a.sent();
                    setIsEditing(false);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to update note:", error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleCancel = function () {
        setEditContent(note.content);
        setIsEditing(false);
    };
    var handleDelete = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Delete this note? This action cannot be undone."))
                        return [2 /*return*/];
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onDelete(note.id)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error("Failed to delete note:", error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handlePin = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onPin(note.id)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    console.error("Failed to pin note:", error_3);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var formatDate = function (dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
    // Highlight @mentions in content
    var renderContent = function (content) {
        var mentionRegex = /@(\w+)/g;
        var parts = content.split(mentionRegex);
        return parts.map(function (part, index) {
            if (index % 2 === 1) {
                // This is a mention (captured group)
                return (<span key={index} className="text-blue-600 font-medium">
            @{part}
          </span>);
            }
            return <span key={index}>{part}</span>;
        });
    };
    return (<div className={"p-4 rounded-lg border transition-all ".concat(note.is_pinned
            ? "bg-amber-50 border-amber-200 shadow-md"
            : "bg-white border-slate-200 hover:border-slate-300")}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {note.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{note.author_name}</p>
            <p className="text-xs text-slate-500">{formatDate(note.created_at)}</p>
          </div>
          {note.is_pinned && (<Pin className="w-4 h-4 text-amber-600 fill-amber-600"/>)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={handlePin} disabled={isLoading} className={"p-1.5 rounded hover:bg-slate-100 transition ".concat(note.is_pinned ? "text-amber-600" : "text-slate-400")} title={note.is_pinned ? "Unpin note" : "Pin note"}>
            <Pin className="w-4 h-4"/>
          </button>

          {isAuthor && !isEditing && (<>
              <button onClick={function () { return setIsEditing(true); }} disabled={isLoading} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition" title="Edit note">
                <Edit2 className="w-4 h-4"/>
              </button>
              <button onClick={handleDelete} disabled={isLoading} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition" title="Delete note">
                <Trash2 className="w-4 h-4"/>
              </button>
            </>)}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (<div className="space-y-2">
          <textarea value={editContent} onChange={function (e) { return setEditContent(e.target.value); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="Edit note..." autoFocus/>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} disabled={isLoading} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1">
              <X className="w-4 h-4"/>
              Cancel
            </button>
            <button onClick={handleSave} disabled={isLoading || !editContent.trim()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
              <Save className="w-4 h-4"/>
              Save
            </button>
          </div>
        </div>) : (<div className="text-sm text-slate-700 whitespace-pre-wrap">
          {renderContent(note.content)}
        </div>)}

      {/* Mentions Badge */}
      {note.mentions.length > 0 && !isEditing && (<div className="mt-3 flex items-center gap-1 flex-wrap">
          <span className="text-xs text-slate-500">Mentioned:</span>
          {note.mentions.map(function (mention, idx) { return (<span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              @{mention}
            </span>); })}
        </div>)}

      {/* Updated indicator */}
      {note.updated_at !== note.created_at && !isEditing && (<p className="text-xs text-slate-400 mt-2">
          Edited {formatDate(note.updated_at)}
        </p>)}
    </div>);
};
export default NoteCard;
