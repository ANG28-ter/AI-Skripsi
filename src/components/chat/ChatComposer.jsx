// src/components/chat/ChatComposer.jsx
import React from "react";
import {
  Paperclip,
  Mic as LucideMic,
  Send as LucideSend,
  Square as LucideSquare,
  X,
} from "lucide-react";
import { renderFileIcon } from "../../utils/chatUtils";

/**
 * ChatComposer: input area (file upload, mic, textarea, send button).
 * Semua handler dikirim lewat props biar tetap terhubung ke useChatDosenPembimbing.
 */
export default function ChatComposer({
  input,
  setInput,
  loading,
  isRecording,
  selectedFile,
  handleFileUpload,
  removeSelectedFile,
  startRecording,
  stopRecording,
  handleKeyDown,
  handleSubmit,
  textareaRef,
  handleStop,
}) {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-4 bg-neutral-900/10">
      <div className="max-w-3xl mx-auto">
        {selectedFile && (
          <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-neutral-800/40 border border-neutral-700">
            {renderFileIcon(selectedFile.name.split(".").pop().toLowerCase())}
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-neutral-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 rounded-md hover:bg-neutral-700"
              title="Hapus file"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="flex items-center gap-3 rounded-full bg-neutral-800/40 px-4 py-2 border border-neutral-700"
        >
          {/* Upload */}
          <label
            htmlFor="upload-file"
            className="cursor-pointer flex-shrink-0 self-center"
          >
            <input
              id="upload-file"
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={handleFileUpload}
            />
            <Paperclip className="w-5 h-5 text-neutral-300 hover:text-emerald-300" />
          </label>

          {/* Mic */}
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              else startRecording();
            }}
            title="Voice"
            className={`p-2 rounded-full hover:bg-neutral-800/60 transition-colors flex-shrink-0 self-center ${
              isRecording ? "text-rose-400 animate-pulse" : "text-neutral-300"
            }`}
          >
            <LucideMic className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            placeholder="Tanyakan apa saja — contoh: mohon koreksi metodologi saya..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-neutral-500 resize-none overflow-hidden leading-5 self-center"
            rows={1}
            style={{ maxHeight: "200px", minHeight: "20px" }}
            disabled={loading}
          />

          {/* Send/Stop */}
          <button
            type={loading ? "button" : "submit"}
            onClick={loading ? handleStop : undefined}
            title={loading ? "Hentikan" : "Kirim"}
            className={`p-2 rounded-full shadow-lg flex items-center justify-center self-center transition-all ${
              loading
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110"
            }`}
          >
            {loading ? (
              <LucideSquare className="w-5 h-5 text-white" />
            ) : (
              <LucideSend className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
      </div>
    </footer>
  );
}
