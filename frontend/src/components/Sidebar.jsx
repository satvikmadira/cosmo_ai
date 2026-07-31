import {
  Bookmark,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  History,
  LogOut,
  Settings,
  Sparkles,
  UploadCloud,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const TABS = [
  { key: "history", label: "Chat History", icon: History },
  { key: "saved", label: "Saved Conversations", icon: Bookmark },
  { key: "documents", label: "Document Upload", icon: FileText },
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  conversations,
  onSelectConversation,
  activeConversationId,
  onNewChat,
  documents,
  onUpload,
  onDeleteDocument,
}) {
  const { user, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // "valid" | "invalid" | null
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [useLocal, setUseLocal] = useState(user?.use_local_ollama ?? false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get("/auth/ollama-status").then(({ data }) => setOllamaAvailable(data.available));
  }, []);

  const saveApiKey = async () => {
    setValidating(true);
    setKeyStatus(null);
    try {
      await api.put("/auth/ai-config", {
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        api_key: apiKey,
        use_local_ollama: useLocal,
      });
      setKeyStatus("valid");
      setApiKey("");
      refreshProfile();
    } catch {
      setKeyStatus("invalid");
    } finally {
      setValidating(false);
    }
  };

  const toggleLocal = async (val) => {
    setUseLocal(val);
    await api.put("/auth/ai-config", {
      provider: user.ai_provider,
      model: user.ai_model,
      use_local_ollama: val,
    });
    refreshProfile();
  };

  return (
    <aside className="w-72 shrink-0 border-r border-graphite-border bg-obsidian/60 flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-graphite-border">
        <Sparkles className="text-gold" size={22} />
        <span className="font-display font-bold text-lg tracking-wide">
          Cosmo <span className="text-gold">AI</span>
        </span>
      </div>

      {/* AI Engine */}
      <div className="px-4 py-4 border-b border-graphite-border">
        <div className="flex items-center gap-2 mb-2 text-mist text-xs uppercase tracking-wider">
          <Cpu size={14} /> AI Engine
        </div>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={user?.has_api_key ? "API key saved • enter to replace" : "Paste your API key"}
            className="glass-input w-full pr-9"
          />
          <button
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-mist hover:text-pearl"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={saveApiKey}
          disabled={!apiKey || validating}
          className="gold-btn w-full mt-2 text-sm !py-1.5"
        >
          {validating ? "Validating…" : "Save & Validate"}
        </button>
        {keyStatus === "valid" && <p className="text-xs text-green-400 mt-1">Key validated and saved.</p>}
        {keyStatus === "invalid" && <p className="text-xs text-red-400 mt-1">Key rejected — check and try again.</p>}

        {ollamaAvailable && (
          <label className="flex items-center justify-between mt-3 text-xs text-mist cursor-pointer">
            <span>Use local Ollama (detected)</span>
            <input
              type="checkbox"
              checked={useLocal}
              onChange={(e) => toggleLocal(e.target.checked)}
              className="accent-gold"
            />
          </label>
        )}
      </div>

      {/* New chat */}
      <div className="px-4 pt-3">
        <button onClick={onNewChat} className="gold-btn w-full text-sm">
          + New Conversation
        </button>
      </div>

      {/* Tabs */}
      <nav className="px-3 pt-4 flex flex-col gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`sidebar-item ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} /> {label}
          </div>
        ))}
      </nav>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {(activeTab === "history" || activeTab === "saved") && (
          <div className="flex flex-col gap-1">
            {conversations
              .filter((c) => (activeTab === "saved" ? c.is_saved : true))
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`sidebar-item !px-3 ${activeConversationId === c.id ? "active" : ""}`}
                >
                  <span className="truncate">{c.title}</span>
                </div>
              ))}
            {conversations.length === 0 && (
              <p className="text-xs text-mist/70">No conversations yet — start one above.</p>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ghost-btn flex items-center justify-center gap-2 border-dashed"
            >
              <UploadCloud size={16} /> Upload PDF for RAG
            </button>
            <div className="flex flex-col gap-2">
              {documents.map((d) => (
                <div key={d.id} className="glass-panel !rounded-lg px-3 py-2 text-xs flex justify-between items-center">
                  <div>
                    <p className="truncate max-w-[140px]">{d.filename}</p>
                    <p className="text-mist">{d.status} • {d.chunk_count} chunks</p>
                  </div>
                  <button onClick={() => onDeleteDocument(d.id)} className="text-mist hover:text-red-400">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "profile" && user && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center font-display font-bold text-void text-xl">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <p className="font-display font-semibold">{user.name}</p>
            <p className="text-xs text-mist">@{user.username}</p>
            <p className="text-xs text-mist">{user.email}</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="glass-panel !rounded-lg px-3 py-2">
              <p className="text-mist text-xs">Provider</p>
              <p>{user?.ai_provider}</p>
            </div>
            <div className="glass-panel !rounded-lg px-3 py-2">
              <p className="text-mist text-xs">Model</p>
              <p>{user?.ai_model}</p>
            </div>
            <button onClick={logout} className="ghost-btn flex items-center justify-center gap-2 mt-2">
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
