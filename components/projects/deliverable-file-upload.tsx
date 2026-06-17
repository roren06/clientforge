"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type DeliverableFileUploadProps = {
  deliverableId: string;
  existingFileUrl?: string | null;
  existingFileName?: string | null;
};

export function DeliverableFileUpload({
  deliverableId,
  existingFileUrl,
  existingFileName,
}: DeliverableFileUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      setMessage(null);
      setMessageType(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/deliverables/${deliverableId}/file`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to upload file.");
      }

      setMessage("File uploaded successfully.");
      setMessageType("success");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload file."
      );
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {existingFileUrl ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-300">
          <p className="text-white">Attached file</p>
          <a
            href={`/api/deliverables/${deliverableId}/file/download`}
            className="mt-1 inline-block text-cyan-300 hover:text-cyan-200"
          >
            Download {existingFileName || "attached file"}
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-sm text-gray-400">
          No file attached yet.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          data-testid={`deliverable-file-input-${deliverableId}`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading
            ? "Uploading..."
            : existingFileUrl
            ? "Replace File"
            : "Upload File"}
        </button>

        {message ? (
          <p
            className={`text-xs ${
              messageType === "success" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}