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
import { useState, useRef, useEffect } from "react";
import { Send, AtSign } from "lucide-react";
var NoteEditor = function (_a) {
    var onSubmit = _a.onSubmit, _b = _a.loading, loading = _b === void 0 ? false : _b, _c = _a.placeholder, placeholder = _c === void 0 ? "Add an internal note... Use @username to mention team members" : _c, _d = _a.availableMentions, availableMentions = _d === void 0 ? [] : _d;
    var _e = useState(""), content = _e[0], setContent = _e[1];
    var _f = useState(false), showMentions = _f[0], setShowMentions = _f[1];
    var _g = useState(""), mentionSearch = _g[0], setMentionSearch = _g[1];
    var _h = useState(0), mentionPosition = _h[0], setMentionPosition = _h[1];
    var _j = useState(0), selectedMentionIndex = _j[0], setSelectedMentionIndex = _j[1];
    var textareaRef = useRef(null);
    // Filter mentions based on search
    var filteredMentions = availableMentions.filter(function (username) {
        return username.toLowerCase().includes(mentionSearch.toLowerCase());
    });
    // Handle textarea change
    var handleChange = function (e) {
        var newContent = e.target.value;
        setContent(newContent);
        // Check if user is typing @mention
        var cursorPos = e.target.selectionStart;
        var textBeforeCursor = newContent.substring(0, cursorPos);
        var lastAtSymbol = textBeforeCursor.lastIndexOf("@");
        if (lastAtSymbol !== -1) {
            var textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(" ")) {
                setMentionSearch(textAfterAt);
                setMentionPosition(lastAtSymbol);
                setShowMentions(true);
                setSelectedMentionIndex(0);
                return;
            }
        }
        setShowMentions(false);
    };
    // Handle mention selection
    var insertMention = function (username) {
        var _a;
        var before = content.substring(0, mentionPosition);
        var after = content.substring(mentionPosition + mentionSearch.length + 1 // +1 for the @ symbol
        );
        var newContent = "".concat(before, "@").concat(username, " ").concat(after);
        setContent(newContent);
        setShowMentions(false);
        (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    };
    // Handle keyboard navigation in mention dropdown
    var handleKeyDown = function (e) {
        if (!showMentions || filteredMentions.length === 0)
            return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedMentionIndex(function (prev) {
                return prev < filteredMentions.length - 1 ? prev + 1 : 0;
            });
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedMentionIndex(function (prev) {
                return prev > 0 ? prev - 1 : filteredMentions.length - 1;
            });
        }
        else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            insertMention(filteredMentions[selectedMentionIndex]);
        }
        else if (e.key === "Escape") {
            setShowMentions(false);
        }
    };
    // Handle form submission
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!content.trim() || loading)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onSubmit(content)];
                case 2:
                    _a.sent();
                    setContent("");
                    setShowMentions(false);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to submit note:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Auto-resize textarea
    useEffect(function () {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = "".concat(textareaRef.current.scrollHeight, "px");
        }
    }, [content]);
    return (<form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea ref={textareaRef} value={content} onChange={handleChange} onKeyDown={handleKeyDown} placeholder={placeholder} className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px] max-h-[300px]" disabled={loading}/>

        {/* Mention dropdown */}
        {showMentions && filteredMentions.length > 0 && (<div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 border-b border-slate-100 mb-1">
                <AtSign className="w-3 h-3"/>
                <span>Mention someone</span>
              </div>
              {filteredMentions.map(function (username, index) { return (<button key={username} type="button" onClick={function () { return insertMention(username); }} className={"w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition ".concat(index === selectedMentionIndex
                    ? "bg-blue-100 text-blue-900"
                    : "text-slate-700")}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">@{username}</span>
                  </div>
                </button>); })}
            </div>
          </div>)}

        {/* Submit button */}
        <button type="submit" disabled={!content.trim() || loading} className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition" title="Send note (Shift+Enter for new line)">
          <Send className="w-4 h-4"/>
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500 mt-2">
        Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Shift+Enter</kbd> for new
        line, type <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">@username</kbd> to
        mention
      </p>
    </form>);
};
export default NoteEditor;
