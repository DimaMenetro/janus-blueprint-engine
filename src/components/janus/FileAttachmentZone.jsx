import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { glassSurface } from "@/components/ui/LiquidGlass";
import { Paperclip, X, FileText, Image, File, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FILE_ICONS = {
  pdf: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  webp: Image,
  gif: Image,
  svg: Image,
};

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || File;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAttachmentZone({ files, onChange, t, isDark }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);

    const newFiles = [];
    for (const file of Array.from(fileList)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newFiles.push({
        file_url,
        file_name: file.name,
        file_size: file.size,
      });
    }

    onChange([...files, ...newFiles]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const accent = isDark ? "#a78bfa" : "#3b82f6";
  const mutedAccent = isDark ? "rgba(167,139,250,0.12)" : "rgba(59,130,246,0.08)";

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: t.title, display: "block", marginBottom: 8 }}>
        Attachments
      </label>

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.csv,.xlsx,.json,.html,.txt,.md"
      />

      {/* File chips */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}
          >
            {files.map((f, idx) => {
              const Icon = getFileIcon(f.file_name);
              return (
                <motion.div
                  key={f.file_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    ...glassSurface(t),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 10,
                    fontSize: 12,
                    color: t.title,
                    maxWidth: 220,
                  }}
                >
                  <Icon style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.file_name}
                  </span>
                  <span style={{ color: t.muted, flexShrink: 0 }}>
                    {formatSize(f.file_size)}
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                      color: t.muted,
                      flexShrink: 0,
                    }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          ...glassSurface(t),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "12px 16px",
          borderRadius: 14,
          cursor: uploading ? "wait" : "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: accent,
          background: mutedAccent,
          border: `1px dashed ${isDark ? "rgba(167,139,250,0.25)" : "rgba(59,130,246,0.25)"}`,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {uploading ? (
          <>
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
            Uploading…
          </>
        ) : (
          <>
            <Paperclip style={{ width: 16, height: 16 }} />
            Attach files (PDF, images, CSV, JSON…)
          </>
        )}
      </motion.button>
    </div>
  );
}