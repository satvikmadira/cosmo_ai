import { useEffect, useState } from "react";
import AvatarPanel from "../components/AvatarPanel";
import ChatWorkspace from "../components/ChatWorkspace";
import Sidebar from "../components/Sidebar";
import { useChatSocket } from "../hooks/useChatSocket";
import api from "../services/api";

export default function Workspace() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeDocumentIds, setActiveDocumentIds] = useState([]);

  const refreshConversations = () => api.get("/chat/conversations").then(({ data }) => setConversations(data));
  const refreshDocuments = () => api.get("/documents").then(({ data }) => setDocuments(data));

  useEffect(() => {
    refreshConversations();
    refreshDocuments();
    const interval = setInterval(refreshDocuments, 4000); // poll RAG indexing status
    return () => clearInterval(interval);
  }, []);

  const { messages, isThinking, isStreaming, error, sendMessage, loadHistory } = useChatSocket({
    conversationId: activeConversationId,
    onConversationStarted: (id, title) => {
      setActiveConversationId(id);
      refreshConversations();
    },
  });

  const selectConversation = async (id) => {
    setActiveConversationId(id);
    const { data } = await api.get(`/chat/conversations/${id}`);
    loadHistory(data.messages.map((m) => ({ role: m.role, content: m.content })));
  };

  const newChat = () => {
    setActiveConversationId(null);
    loadHistory([]);
  };

  const uploadDocument = async (file) => {
    const form = new FormData();
    form.append("file", file);
    await api.post("/documents/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
    refreshDocuments();
  };

  const deleteDocument = async (id) => {
    await api.delete(`/documents/${id}`);
    setActiveDocumentIds((prev) => prev.filter((d) => d !== id));
    refreshDocuments();
  };

  const toggleDocument = (id) =>
    setActiveDocumentIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant" && !m.streaming);

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={newChat}
        documents={documents}
        onUpload={uploadDocument}
        onDeleteDocument={deleteDocument}
      />
      <ChatWorkspace
        messages={messages}
        isThinking={isThinking}
        error={error}
        onSend={sendMessage}
        documents={documents.filter((d) => d.status === "ready")}
        activeDocumentIds={activeDocumentIds}
        onToggleDocument={toggleDocument}
        onUploadDrop={uploadDocument}
      />
      <AvatarPanel
        isThinking={isThinking}
        isStreaming={isStreaming}
        latestAssistantText={lastAssistantMessage?.content}
      />
    </div>
  );
}
