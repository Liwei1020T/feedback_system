import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Trash2, Bot, User, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { sendChatMessage, clearChatConversation, type ChatResponse } from "../api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
}

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatbot_messages");
    const savedConversationId = localStorage.getItem("chatbot_conversation_id");
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
    
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  // Save conversation history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatbot_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem("chatbot_conversation_id", conversationId);
    }
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opening or un-minimizing
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage({
        message: input,
        conversation_id: conversationId,
      });

      const aiMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        suggestedActions: response.suggested_actions,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setConversationId(response.conversation_id);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (window.confirm("Are you sure you want to clear this conversation? This will delete all chat history.")) {
      try {
        if (conversationId) {
          await clearChatConversation(conversationId);
        }
        setMessages([]);
        setConversationId(undefined);
        localStorage.removeItem("chatbot_messages");
        localStorage.removeItem("chatbot_conversation_id");
      } catch (error) {
        console.error("Error clearing conversation:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const exampleQuestions = [
    "How many pending complaints?",
    "What are the top issues?",
    "Which department needs help?",
    "Show me today's stats",
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-30 group-hover:opacity-60 transition"></div>
        <div className="relative flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200"
         style={{ width: '400px', height: isMinimized ? 'auto' : '600px' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Assistant</h3>
            <p className="text-xs text-blue-100">
              {messages.length > 0 ? `${messages.length} messages` : 'Ask me anything'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                  <Bot className="w-10 h-10 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Hi! I'm your AI Assistant</h4>
                <p className="text-sm text-slate-600 mb-4">
                  I can help with complaint data, analytics, and system insights.
                </p>
                <div className="space-y-2 w-full">
                  <p className="text-xs font-semibold text-slate-700">Quick questions:</p>
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="w-full text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-xs text-slate-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index}>
                    <div className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-slate-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-700" />
                        </div>
                      )}
                    </div>

                    {/* Suggested Actions */}
                    {message.role === "assistant" && message.suggestedActions && (
                      <div className="ml-10 mt-2 flex flex-wrap gap-1">
                        {message.suggestedActions.slice(0, 2).map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestedAction(action)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-slate-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
