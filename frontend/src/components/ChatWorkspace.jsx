import { FileText, Paperclip, Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import MarkdownMessage from "./MarkdownMessage";

export default function ChatWorkspace({
  messages,
  isThinking,
  error,
  onSend,
  documents,
  activeDocumentIds,
  onToggleDocument,
  onUploadDrop,
}) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (files) => files[0] && onUploadDrop(files[0]),
    noClick: true,
  });

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), activeDocumentIds);
    setInput("");
  };

  const filtered = search
    ? messages.filter((m) => m.content?.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <main {...getRootProps()} className="flex-1 flex flex-col h-full relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-20 bg-void/80 border-2 border-dashed border-gold flex items-center justify-center rounded-2xl m-4">
          <p className="font-display text-gold">Drop your PDF to add it to this conversation</p>
        </div>
      )}

      {/* Top bar: search */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-graphite-border">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this conversation…"
            className="glass-input w-full pl-8 !py-1.5"
          />
        </div>
        {documents.length > 0 && (
          <div className="flex gap-1 ml-auto flex-wrap justify-end max-w-md">
            {documents.map((d) => (
              <button
                key={d.id}
                onClick={() => onToggleDocument(d.id)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                  activeDocumentIds.includes(d.id)
                    ? "border-gold text-gold bg-gold/10"
                    : "border-graphite-border text-mist"
                }`}
              >
                <FileText size={11} /> {d.filename.slice(0, 14)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
        {filtered.length === 0 && !isThinking && (
          <div className="m-auto text-center text-mist">
            <p className="font-display text-xl text-pearl mb-1">Ask Cosmo anything</p>
            <p className="text-sm">Chat, upload PDFs for grounded answers, or just brainstorm.</p>
          </div>
        )}

        {filtered.map((m, i) => (
          <div key={i} className={`msg-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-gold-gradient text-void font-medium"
                  : "glass-panel text-pearl"
              }`}
            >
              {m.role === "assistant" ? (
                <MarkdownMessage content={m.content || " "} />
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {m.streaming && <span className="inline-block w-1.5 h-4 bg-gold ml-1 animate-pulse align-middle" />}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="glass-panel px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold dot-1" />
              <span className="w-2 h-2 rounded-full bg-gold dot-2" />
              <span className="w-2 h-2 rounded-full bg-gold dot-3" />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-6 pb-6 pt-2">
        <div className="glass-panel flex items-end gap-2 p-2">
          <button className="ghost-btn !p-2" title="Attach a document">
            <Paperclip size={16} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Cosmo…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-2 px-1 max-h-40"
          />
          <button onClick={handleSend} className="gold-btn !px-3 !py-2">
            <Send size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
