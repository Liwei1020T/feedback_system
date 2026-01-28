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
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Trash2, Bot, User, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { sendChatMessage, clearChatConversation } from "../api";
export var FloatingChatbot = function () {
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var _b = useState(false), isMinimized = _b[0], setIsMinimized = _b[1];
    var _c = useState([]), messages = _c[0], setMessages = _c[1];
    var _d = useState(""), input = _d[0], setInput = _d[1];
    var _e = useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(undefined), conversationId = _f[0], setConversationId = _f[1];
    var messagesEndRef = useRef(null);
    var inputRef = useRef(null);
    // Load conversation history from localStorage on mount
    useEffect(function () {
        var savedMessages = localStorage.getItem("chatbot_messages");
        var savedConversationId = localStorage.getItem("chatbot_conversation_id");
        if (savedMessages) {
            try {
                var parsed = JSON.parse(savedMessages);
                // Convert timestamp strings back to Date objects
                var messagesWithDates = parsed.map(function (msg) { return (__assign(__assign({}, msg), { timestamp: new Date(msg.timestamp) })); });
                setMessages(messagesWithDates);
            }
            catch (e) {
                console.error("Failed to load chat history:", e);
            }
        }
        if (savedConversationId) {
            setConversationId(savedConversationId);
        }
    }, []);
    // Save conversation history to localStorage whenever it changes
    useEffect(function () {
        if (messages.length > 0) {
            localStorage.setItem("chatbot_messages", JSON.stringify(messages));
        }
    }, [messages]);
    useEffect(function () {
        if (conversationId) {
            localStorage.setItem("chatbot_conversation_id", conversationId);
        }
    }, [conversationId]);
    // Auto-scroll to bottom when new messages arrive
    useEffect(function () {
        var _a;
        if (isOpen && !isMinimized) {
            (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isMinimized]);
    // Focus input when opening or un-minimizing
    useEffect(function () {
        if (isOpen && !isMinimized) {
            setTimeout(function () { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100);
        }
    }, [isOpen, isMinimized]);
    var handleSendMessage = function () { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, response, aiMessage_1, error_1, errorMessage_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!input.trim() || isLoading)
                        return [2 /*return*/];
                    userMessage = {
                        role: "user",
                        content: input,
                        timestamp: new Date(),
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [userMessage], false); });
                    setInput("");
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, sendChatMessage({
                            message: input,
                            conversation_id: conversationId,
                        })];
                case 2:
                    response = _a.sent();
                    aiMessage_1 = {
                        role: "assistant",
                        content: response.response,
                        timestamp: new Date(),
                        suggestedActions: response.suggested_actions,
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [aiMessage_1], false); });
                    setConversationId(response.conversation_id);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("Chat error:", error_1);
                    errorMessage_1 = {
                        role: "assistant",
                        content: "I apologize, but I encountered an error processing your message. Please try again.",
                        timestamp: new Date(),
                    };
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [errorMessage_1], false); });
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleClearConversation = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm("Are you sure you want to clear this conversation? This will delete all chat history.")) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!conversationId) return [3 /*break*/, 3];
                    return [4 /*yield*/, clearChatConversation(conversationId)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    setMessages([]);
                    setConversationId(undefined);
                    localStorage.removeItem("chatbot_messages");
                    localStorage.removeItem("chatbot_conversation_id");
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error clearing conversation:", error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleKeyPress = function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    var handleSuggestedAction = function (action) {
        var _a;
        setInput(action);
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    };
    var exampleQuestions = [
        "How many pending complaints?",
        "What are the top issues?",
        "Which department needs help?",
        "Show me today's stats",
    ];
    if (!isOpen) {
        return (<button onClick={function () { return setIsOpen(true); }} className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110" aria-label="Open AI Assistant">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-30 group-hover:opacity-60 transition"></div>
        <div className="relative flex items-center gap-2">
          <MessageSquare className="w-6 h-6"/>
          {messages.length > 0 && (<span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
              {messages.filter(function (m) { return m.role === 'assistant'; }).length}
            </span>)}
        </div>
      </button>);
    }
    return (<div className="fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200" style={{ width: '400px', height: isMinimized ? 'auto' : '600px' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
            <Bot className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Assistant</h3>
            <p className="text-xs text-blue-100">
              {messages.length > 0 ? "".concat(messages.length, " messages") : 'Ask me anything'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={function () { return setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/20 rounded-lg transition" aria-label={isMinimized ? "Maximize" : "Minimize"}>
            {isMinimized ? <Maximize2 className="w-4 h-4"/> : <Minimize2 className="w-4 h-4"/>}
          </button>
          {messages.length > 0 && (<button onClick={handleClearConversation} className="p-2 hover:bg-white/20 rounded-lg transition" aria-label="Clear conversation">
              <Trash2 className="w-4 h-4"/>
            </button>)}
          <button onClick={function () { return setIsOpen(false); }} className="p-2 hover:bg-white/20 rounded-lg transition" aria-label="Close chat">
            <X className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (<>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {messages.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                  <Bot className="w-10 h-10 text-blue-600"/>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Hi! I'm your AI Assistant</h4>
                <p className="text-sm text-slate-600 mb-4">
                  I can help with complaint data, analytics, and system insights.
                </p>
                <div className="space-y-2 w-full">
                  <p className="text-xs font-semibold text-slate-700">Quick questions:</p>
                  {exampleQuestions.map(function (question, index) { return (<button key={index} onClick={function () { return setInput(question); }} className="w-full text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-xs text-slate-700">
                      {question}
                    </button>); })}
                </div>
              </div>) : (<>
                {messages.map(function (message, index) { return (<div key={index}>
                    <div className={"flex gap-2 ".concat(message.role === "user" ? "justify-end" : "justify-start")}>
                      {message.role === "assistant" && (<div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white"/>
                        </div>)}
                      <div className={"max-w-[75%] rounded-2xl px-4 py-2 ".concat(message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800 shadow-sm")}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className={"text-xs mt-1 ".concat(message.role === "user" ? "text-blue-100" : "text-slate-500")}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.role === "user" && (<div className="flex-shrink-0 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-700"/>
                        </div>)}
                    </div>

                    {/* Suggested Actions */}
                    {message.role === "assistant" && message.suggestedActions && (<div className="ml-10 mt-2 flex flex-wrap gap-1">
                        {message.suggestedActions.slice(0, 2).map(function (action, i) { return (<button key={i} onClick={function () { return handleSuggestedAction(action); }} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition">
                            {action}
                          </button>); })}
                      </div>)}
                  </div>); })}
                {isLoading && (<div className="flex gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white"/>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin"/>
                        <span className="text-sm text-slate-600">Thinking...</span>
                      </div>
                    </div>
                  </div>)}
                <div ref={messagesEndRef}/>
              </>)}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input} onChange={function (e) { return setInput(e.target.value); }} onKeyPress={handleKeyPress} placeholder="Ask me anything..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" disabled={isLoading}/>
              <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                {isLoading ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<Send className="w-4 h-4"/>)}
              </button>
            </div>
          </div>
        </>)}
    </div>);
};
