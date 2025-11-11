import { X } from "lucide-react";

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    url: string;
    name: string;
  } | null;
}

const AttachmentPreviewModal = ({ isOpen, onClose, attachment }: AttachmentPreviewModalProps) => {
  if (!isOpen || !attachment) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-slate-800">{attachment.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 h-[calc(100vh-150px)] overflow-auto">
          <img src={attachment.url} alt={attachment.name} className="max-w-full h-auto mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;
