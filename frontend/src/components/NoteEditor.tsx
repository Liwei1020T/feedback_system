import { useState, useRef, useEffect } from "react";
import { Send, AtSign } from "lucide-react";

interface NoteEditorProps {
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
  availableMentions?: string[]; // List of usernames that can be mentioned
}

const NoteEditor = ({
  onSubmit,
  loading = false,
  placeholder = "Add an internal note... Use @username to mention team members",
  availableMentions = []
}: NoteEditorProps) => {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter mentions based on search
  const filteredMentions = availableMentions.filter((username) =>
    username.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Handle textarea change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check if user is typing @mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
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
  const insertMention = (username: string) => {
    const before = content.substring(0, mentionPosition);
    const after = content.substring(
      mentionPosition + mentionSearch.length + 1 // +1 for the @ symbol
    );
    const newContent = `${before}@${username} ${after}`;
    setContent(newContent);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredMentions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev < filteredMentions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredMentions.length - 1
      );
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertMention(filteredMentions[selectedMentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    try {
      await onSubmit(content);
      setContent("");
      setShowMentions(false);
    } catch (error) {
      console.error("Failed to submit note:", error);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px] max-h-[300px]"
          disabled={loading}
        />

        {/* Mention dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 border-b border-slate-100 mb-1">
                <AtSign className="w-3 h-3" />
                <span>Mention someone</span>
              </div>
              {filteredMentions.map((username, index) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => insertMention(username)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition ${
                    index === selectedMentionIndex
                      ? "bg-blue-100 text-blue-900"
                      : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">@{username}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Send note (Shift+Enter for new line)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500 mt-2">
        Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Shift+Enter</kbd> for new
        line, type <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">@username</kbd> to
        mention
      </p>
    </form>
  );
};

export default NoteEditor;
