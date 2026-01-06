import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, StickyNote, Pin } from "lucide-react";
import NoteCard from "./NoteCard";
import NoteEditor from "./NoteEditor";
import {
  createInternalNote,
  listInternalNotes,
  updateInternalNote,
  deleteInternalNote,
  pinInternalNote,
  watchComplaint,
  unwatchComplaint,
  listAdmins
} from "../api";
import type { InternalNote } from "../types";

interface InternalNotesPanelProps {
  complaintId: number;
  currentUserId?: number;
  isWatching?: boolean;
}

const InternalNotesPanel = ({
  complaintId,
  currentUserId,
  isWatching = false
}: InternalNotesPanelProps) => {
  const queryClient = useQueryClient();
  const [localIsWatching, setLocalIsWatching] = useState(isWatching);

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["internal-notes", complaintId],
    queryFn: () => listInternalNotes(complaintId)
  });

  // Fetch admins for @mention autocomplete
  const { data: admins = [] } = useQuery({
    queryKey: ["admins"],
    queryFn: listAdmins
  });

  const availableMentions = admins.map((admin) => admin.username);

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (content: string) =>
      createInternalNote(complaintId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: number; content: string }) =>
      updateInternalNote(complaintId, noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => deleteInternalNote(complaintId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
    }
  });

  // Pin note mutation
  const pinNoteMutation = useMutation({
    mutationFn: (noteId: number) => pinInternalNote(complaintId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", complaintId] });
    }
  });

  // Watch/unwatch complaint mutation
  const toggleWatchMutation = useMutation({
    mutationFn: () =>
      localIsWatching
        ? unwatchComplaint(complaintId)
        : watchComplaint(complaintId),
    onSuccess: () => {
      setLocalIsWatching(!localIsWatching);
      queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
    }
  });

  const handleCreateNote = async (content: string) => {
    await createNoteMutation.mutateAsync(content);
  };

  const handleEditNote = async (noteId: number, content: string) => {
    await updateNoteMutation.mutateAsync({ noteId, content });
  };

  const handleDeleteNote = async (noteId: number) => {
    await deleteNoteMutation.mutateAsync(noteId);
  };

  const handlePinNote = async (noteId: number) => {
    await pinNoteMutation.mutateAsync(noteId);
  };

  const handleToggleWatch = () => {
    toggleWatchMutation.mutate();
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pinnedCount = notes.filter((n) => n.is_pinned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <StickyNote className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Internal Notes</h3>
            <p className="text-sm text-slate-500">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
              {pinnedCount > 0 && ` · ${pinnedCount} pinned`}
            </p>
          </div>
        </div>

        {/* Watch button */}
        <button
          onClick={handleToggleWatch}
          disabled={toggleWatchMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            localIsWatching
              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {localIsWatching ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Watching</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm font-medium">Watch</span>
            </>
          )}
        </button>
      </div>

      {/* Note editor */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <NoteEditor
          onSubmit={handleCreateNote}
          loading={createNoteMutation.isPending}
          availableMentions={availableMentions}
        />
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-3">Loading notes...</p>
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No internal notes yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add a note above to start collaborating with your team
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onPin={handlePinNote}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      {notes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Pin className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Collaboration Tips</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• Use @username to notify team members</li>
                <li>• Pin important notes to keep them at the top</li>
                <li>• Watch this complaint to get notified of new notes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalNotesPanel;
