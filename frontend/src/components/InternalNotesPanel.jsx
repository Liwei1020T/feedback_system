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
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, StickyNote, Pin } from "lucide-react";
import NoteCard from "./NoteCard";
import NoteEditor from "./NoteEditor";
import { createInternalNote, listInternalNotes, updateInternalNote, deleteInternalNote, pinInternalNote, watchComplaint, unwatchComplaint, listAdmins } from "../api";
var InternalNotesPanel = function (_a) {
    var complaintId = _a.complaintId, currentUserId = _a.currentUserId, _b = _a.isWatching, isWatching = _b === void 0 ? false : _b;
    var queryClient = useQueryClient();
    var _c = useState(isWatching), localIsWatching = _c[0], setLocalIsWatching = _c[1];
    // Fetch notes
    var _d = useQuery({
        queryKey: ["internal-notes", complaintId],
        queryFn: function () { return listInternalNotes(complaintId); }
    }), _e = _d.data, notes = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    // Fetch admins for @mention autocomplete
    var _f = useQuery({
        queryKey: ["admins"],
        queryFn: listAdmins
    }).data, admins = _f === void 0 ? [] : _f;
    var availableMentions = admins.map(function (admin) { return admin.username; });
    // Create note mutation
    var createNoteMutation = useMutation({
        mutationFn: function (content) {
            return createInternalNote(complaintId, { content: content });
        },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
        }
    });
    // Update note mutation
    var updateNoteMutation = useMutation({
        mutationFn: function (_a) {
            var noteId = _a.noteId, content = _a.content;
            return updateInternalNote(complaintId, noteId, { content: content });
        },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
        }
    });
    // Delete note mutation
    var deleteNoteMutation = useMutation({
        mutationFn: function (noteId) { return deleteInternalNote(complaintId, noteId); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
        }
    });
    // Pin note mutation
    var pinNoteMutation = useMutation({
        mutationFn: function (noteId) { return pinInternalNote(complaintId, noteId); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
        }
    });
    // Watch/unwatch complaint mutation
    var toggleWatchMutation = useMutation({
        mutationFn: function () {
            return localIsWatching
                ? unwatchComplaint(complaintId)
                : watchComplaint(complaintId);
        },
        onSuccess: function () {
            setLocalIsWatching(!localIsWatching);
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
        }
    });
    var handleCreateNote = function (content) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createNoteMutation.mutateAsync(content)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleEditNote = function (noteId, content) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateNoteMutation.mutateAsync({ noteId: noteId, content: content })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteNote = function (noteId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deleteNoteMutation.mutateAsync(noteId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handlePinNote = function (noteId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pinNoteMutation.mutateAsync(noteId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleToggleWatch = function () {
        toggleWatchMutation.mutate();
    };
    // Sort notes: pinned first, then by date
    var sortedNotes = __spreadArray([], notes, true).sort(function (a, b) {
        if (a.is_pinned && !b.is_pinned)
            return -1;
        if (!a.is_pinned && b.is_pinned)
            return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    var pinnedCount = notes.filter(function (n) { return n.is_pinned; }).length;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <StickyNote className="w-5 h-5 text-blue-600"/>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Internal Notes</h3>
            <p className="text-sm text-slate-500">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
              {pinnedCount > 0 && " \u00B7 ".concat(pinnedCount, " pinned")}
            </p>
          </div>
        </div>

        {/* Watch button */}
        <button onClick={handleToggleWatch} disabled={toggleWatchMutation.isPending} className={"flex items-center gap-2 px-4 py-2 rounded-lg border transition ".concat(localIsWatching
            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50")}>
          {localIsWatching ? (<>
              <Eye className="w-4 h-4"/>
              <span className="text-sm font-medium">Watching</span>
            </>) : (<>
              <EyeOff className="w-4 h-4"/>
              <span className="text-sm font-medium">Watch</span>
            </>)}
        </button>
      </div>

      {/* Note editor */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <NoteEditor onSubmit={handleCreateNote} loading={createNoteMutation.isPending} availableMentions={availableMentions}/>
      </div>

      {/* Notes list */}
      {isLoading ? (<div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-3">Loading notes...</p>
        </div>) : sortedNotes.length === 0 ? (<div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-600 font-medium">No internal notes yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add a note above to start collaborating with your team
          </p>
        </div>) : (<div className="space-y-3">
          {sortedNotes.map(function (note) { return (<NoteCard key={note.id} note={note} currentUserId={currentUserId} onEdit={handleEditNote} onDelete={handleDeleteNote} onPin={handlePinNote}/>); })}
        </div>)}

      {/* Info footer */}
      {notes.length > 0 && (<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Pin className="w-4 h-4 text-blue-600 mt-0.5"/>
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Collaboration Tips</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• Use @username to notify team members</li>
                <li>• Pin important notes to keep them at the top</li>
                <li>• Watch this complaint to get notified of new notes</li>
              </ul>
            </div>
          </div>
        </div>)}
    </div>);
};
export default InternalNotesPanel;
