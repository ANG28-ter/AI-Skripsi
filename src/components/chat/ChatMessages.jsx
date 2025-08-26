// src/components/chat/ChatMessages.jsx
import React, { forwardRef } from "react";
import AssistantBubble from "./AssistantBubble";

/**
 * Komponen pesan (list chat).
 * - Menampilkan pesan user (hijau) vs asisten (abu).
 * - Asisten pakai <AssistantBubble /> biar markdown/segment tetap hidup.
 * - Ada indicator typing di bawah.
 */
const ChatMessages = forwardRef(({ messages, typingText }, chatEndRef) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
      <style>{`.custom-scroll::-webkit-scrollbar{width:8px}.custom-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#10B981,#06B6D4);border-radius:8px}`}</style>

      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={idx}
            className={`max-w-2xl ${
              isUser ? "ml-auto text-right" : "mr-auto text-left"
            }`}
          >
            <div
              className={`p-3 rounded-lg shadow ${
                isUser
                  ? "bg-emerald-700 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              {isUser ? (
                <span>{msg.content || "[No Content]"}</span>
              ) : (
                <AssistantBubble msg={msg} />
              )}
            </div>
          </div>
        );
      })}

      {typingText && (
        <div className="max-w-2xl mr-auto text-left">
          <div className="p-3 rounded-lg bg-gray-700 text-gray-200 shadow">
            {typingText}
          </div>
        </div>
      )}

      <div ref={chatEndRef}></div>
    </div>
  );
});

export default ChatMessages;
