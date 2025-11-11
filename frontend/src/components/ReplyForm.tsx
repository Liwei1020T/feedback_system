import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { Send, Paperclip, Mail, X } from "lucide-react";

interface ReplyFormProps {
  onSubmit: (reply: { text: string; sendEmail: boolean; attachment?: File | null }) => Promise<void>;
  loading?: boolean;
  text?: string;
  onTextChange?: (value: string) => void;
}

const ReplyForm = ({ onSubmit, loading, text: controlledText, onTextChange }: ReplyFormProps) => {
  const [internalText, setInternalText] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const text = controlledText ?? internalText;

  const setText = (value: string) => {
    if (onTextChange) {
      onTextChange(value);
    } else {
      setInternalText(value);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAttachment(file || null);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    await onSubmit({ text, sendEmail, attachment });
    if (!onTextChange) {
      setInternalText("");
    }
    setText("");
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Large Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full rounded-xl border-2 border-slate-200 p-4 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
          rows={8}
          placeholder="Type your reply here... Be clear and professional."
          value={text}
          onChange={handleTextareaChange}
          style={{ minHeight: '200px' }}
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-400">
          {text.length} characters
        </div>
      </div>

      {/* Email Checkbox - Prominent */}
      <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2 flex-1">
          <Mail className="w-5 h-5 text-blue-600" />
          <div>
            <span className="font-semibold text-slate-900">Email this reply to the employee</span>
            <p className="text-xs text-slate-600 mt-0.5">Employee will receive a notification email</p>
          </div>
        </div>
      </label>

      {/* File Attachment */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          <Paperclip className="w-4 h-4 inline mr-1" />
          Attach Image (optional)
        </label>
        
        {attachment ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Paperclip className="w-5 h-5 text-green-600" />
            <span className="flex-1 text-sm font-medium text-green-900">{attachment.name}</span>
            <span className="text-xs text-green-600">{(attachment.size / 1024).toFixed(1)} KB</span>
            <button
              type="button"
              onClick={removeAttachment}
              className="p-1 hover:bg-green-200 rounded-full transition"
            >
              <X className="w-4 h-4 text-green-700" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
            >
              <Paperclip className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Click to attach an image</span>
            </label>
          </div>
        )}
      </div>

      {/* Submit Button - Large and Prominent */}
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sending Reply...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Reply
          </>
        )}
      </button>
    </form>
  );
};

export default ReplyForm;
