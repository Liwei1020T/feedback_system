import { useRef, useState, type ChangeEvent } from "react";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const FileUpload = ({ onUpload, disabled }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={uploading || disabled}
        className="w-full rounded-lg border border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Attachment"}
      </button>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
};

export default FileUpload;
