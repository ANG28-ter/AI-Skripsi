// src/components/chat/ChatSidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  User,
  Plus,
  Search,
  Trash2,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  LogOut,
} from "lucide-react";

/**
 * Sidebar percakapan — dipisah dari file monolit tanpa mengubah UI/logic.
 * Props yang DIHARUSKAN SAMA (agar 1:1 dengan kode asli):
 * - sidebarOpen, setSidebarOpen
 * - conversations (sudah difilter/visibleConversations dari parent) ATAU visibleConversations
 * - activeConversationId
 * - loadConversation, openNewConversation, deleteConversation
 * - searchQuery, setSearchQuery
 *
 * Catatan:
 * Parent bebas kirim "visibleConversations" langsung (hasil filter), atau kirim "conversations"
 * + biarin parent yang filter. Di bawah ini mendukung keduanya (visibleConversations lebih prioritas).
 */
export default function ChatSidebar({
  sidebarOpen,
  setSidebarOpen,
  conversations,
  visibleConversations,
  activeConversationId,
  loadConversation,
  openNewConversation,
  deleteConversation,
  searchQuery,
  setSearchQuery,
}) {
  const list = Array.isArray(visibleConversations)
    ? visibleConversations
    : Array.isArray(conversations)
    ? conversations
    : [];

  return (
    <aside
      className={`flex-shrink-0 transition-all duration-300 ${
        sidebarOpen ? "w-80" : "w-16"
      } bg-neutral-900/40 backdrop-blur-md border-r border-neutral-800/50 shadow-lg`}
    >
      <div className="h-full flex flex-col">
        {sidebarOpen && (
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Pengguna</div>
                <div className="text-xs text-neutral-300">Akun Anda</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-neutral-800/40 flex items-center justify-center"
              title="Tutup sidebar"
            >
              <PanelLeftClose className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        <div className="px-3 py-3">
          {sidebarOpen ? (
            <>
              <button
                onClick={openNewConversation}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/6"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span className="text-sm">Obrolan Baru</span>
              </button>

              <div className="mt-3 relative">
                <div className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari obrolan..."
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-neutral-800/40 text-sm outline-none"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-11 h-11 flex items-center justify-center rounded-md bg-neutral-800/70 hover:bg-neutral-700/90 transition shadow-lg"
                title="Buka sidebar"
              >
                <PanelLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={openNewConversation}
                className="w-11 h-11 flex items-center justify-center rounded-md bg-neutral-800/70 hover:bg-neutral-700/90 transition shadow-lg"
                title="Obrolan Baru"
              >
                <Plus className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-2">
          <style>{`.custom-scroll::-webkit-scrollbar{width:8px}.custom-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#10B981,#06B6D4);border-radius:8px}`}</style>
          <div className="space-y-2 py-2">
            {list.length === 0 && (
              <div className="text-xs text-neutral-400 px-2"></div>
            )}

            {list.map((conv) => {
              const active = conv.id === activeConversationId;
              return (
                <motion.div
                  key={conv.id}
                  layout
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
                    active
                      ? "bg-emerald-600/10 border border-emerald-500/20"
                      : "hover:bg-white/2"
                  }`}
                  onClick={() => loadConversation(conv)}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>

                  {sidebarOpen && (
                    <div className="flex-1">
                      <div className="text-sm line-clamp-1">
                        {conv.title || "Percakapan baru"}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {new Date(
                          conv.updatedAt || conv.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {sidebarOpen && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="p-1 rounded-md hover:bg-red-700/10"
                        title="Hapus percakapan"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-neutral-800/50">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-300">AI Dosen Pembimbing</div>
              <button title="Logout" className="p-2 rounded-md hover:bg-white/2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <LogOut className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
