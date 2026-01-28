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
import { useRef, useState } from "react";
import { Send, Paperclip, Mail, X } from "lucide-react";
var ReplyForm = function (_a) {
    var onSubmit = _a.onSubmit, loading = _a.loading, controlledText = _a.text, onTextChange = _a.onTextChange;
    var _b = useState(""), internalText = _b[0], setInternalText = _b[1];
    var _c = useState(true), sendEmail = _c[0], setSendEmail = _c[1];
    var _d = useState(null), attachment = _d[0], setAttachment = _d[1];
    var fileInputRef = useRef(null);
    var textareaRef = useRef(null);
    var text = controlledText !== null && controlledText !== void 0 ? controlledText : internalText;
    var setText = function (value) {
        if (onTextChange) {
            onTextChange(value);
        }
        else {
            setInternalText(value);
        }
    };
    var handleFileChange = function (event) {
        var _a, _b;
        var file = (_b = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
        setAttachment(file || null);
    };
    var removeAttachment = function () {
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    var handleSubmit = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    if (!text.trim())
                        return [2 /*return*/];
                    return [4 /*yield*/, onSubmit({ text: text, sendEmail: sendEmail, attachment: attachment })];
                case 1:
                    _a.sent();
                    if (!onTextChange) {
                        setInternalText("");
                    }
                    setText("");
                    setAttachment(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Auto-resize textarea
    var handleTextareaChange = function (e) {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };
    return (<form className="space-y-4" onSubmit={handleSubmit}>
      {/* Large Textarea */}
      <div className="relative">
        <textarea ref={textareaRef} className="w-full rounded-xl border-2 border-slate-200 p-4 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" rows={8} placeholder="Type your reply here... Be clear and professional." value={text} onChange={handleTextareaChange} style={{ minHeight: '200px' }}/>
        <div className="absolute bottom-3 right-3 text-xs text-slate-400">
          {text.length} characters
        </div>
      </div>

      {/* Email Checkbox - Prominent */}
      <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition">
        <input type="checkbox" checked={sendEmail} onChange={function (e) { return setSendEmail(e.target.checked); }} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"/>
        <div className="flex items-center gap-2 flex-1">
          <Mail className="w-5 h-5 text-blue-600"/>
          <div>
            <span className="font-semibold text-slate-900">Email this reply to the employee</span>
            <p className="text-xs text-slate-600 mt-0.5">Employee will receive a notification email</p>
          </div>
        </div>
      </label>

      {/* File Attachment */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          <Paperclip className="w-4 h-4 inline mr-1"/>
          Attach Image (optional)
        </label>
        
        {attachment ? (<div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Paperclip className="w-5 h-5 text-green-600"/>
            <span className="flex-1 text-sm font-medium text-green-900">{attachment.name}</span>
            <span className="text-xs text-green-600">{(attachment.size / 1024).toFixed(1)} KB</span>
            <button type="button" onClick={removeAttachment} className="p-1 hover:bg-green-200 rounded-full transition">
              <X className="w-4 h-4 text-green-700"/>
            </button>
          </div>) : (<div className="relative">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload"/>
            <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
              <Paperclip className="w-5 h-5 text-slate-500"/>
              <span className="text-sm font-medium text-slate-600">Click to attach an image</span>
            </label>
          </div>)}
      </div>

      {/* Submit Button - Large and Prominent */}
      <button type="submit" disabled={loading || !text.trim()} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
        {loading ? (<>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sending Reply...
          </>) : (<>
            <Send className="w-5 h-5"/>
            Send Reply
          </>)}
      </button>
    </form>);
};
export default ReplyForm;
