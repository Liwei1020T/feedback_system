import { useState } from "react";
import { Pin, Edit2, Trash2, Save, X } from "lucide-react";
import type { InternalNote } from "../types";

interface NoteCardProps {
  note: InternalNote;
  currentUserId?: number;
  onEdit: (noteId: number, content: string) => Promise<void>;
  onDelete: (noteId: number) => Promise<void>;
  onPin: (noteId: number) => Promise<void>;
}

const NoteCard = ({ note, currentUserId, onEdit, onDelete, onPin }: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthor = currentUserId === note.author_id;

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    try {
      await onEdit(note.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this note? This action cannot be undone.")) return;
    setIsLoading(true);
    try {
      await onDelete(note.id);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async () => {
    setIsLoading(true);
    try {
      await onPin(note.id);
    } catch (error) {
      console.error("Failed to pin note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Highlight @mentions in content
  const renderContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention (captured group)
        return (
          <span key={index} className="text-blue-600 font-medium">
            @{part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        note.is_pinned
          ? "bg-amber-50 border-amber-200 shadow-md"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
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
          {note.is_pinned && (
            <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePin}
            disabled={isLoading}
            className={`p-1.5 rounded hover:bg-slate-100 transition ${
              note.is_pinned ? "text-amber-600" : "text-slate-400"
            }`}
            title={note.is_pinned ? "Unpin note" : "Pin note"}
          >
            <Pin className="w-4 h-4" />
          </button>

          {isAuthor && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition"
                title="Edit note"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Edit note..."
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !editContent.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-700 whitespace-pre-wrap">
          {renderContent(note.content)}
        </div>
      )}

      {/* Mentions Badge */}
      {note.mentions.length > 0 && !isEditing && (
        <div className="mt-3 flex items-center gap-1 flex-wrap">
          <span className="text-xs text-slate-500">Mentioned:</span>
          {note.mentions.map((mention, idx) => (
            <span
              key={idx}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
            >
              @{mention}
            </span>
          ))}
        </div>
      )}

      {/* Updated indicator */}
      {note.updated_at !== note.created_at && !isEditing && (
        <p className="text-xs text-slate-400 mt-2">
          Edited {formatDate(note.updated_at)}
        </p>
      )}
    </div>
  );
};

export default NoteCard;
