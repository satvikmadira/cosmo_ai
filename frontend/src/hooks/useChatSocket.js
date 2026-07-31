import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Manages the WebSocket connection for real-time streaming chat, exposing:
 * - messages: full conversation transcript (with a live-streaming assistant bubble)
 * - isThinking / isStreaming: state for the AI avatar + typing indicators
 * - sendMessage(content, documentIds)
 */
export function useChatSocket({ conversationId, onConversationStarted }) {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const streamingTextRef = useRef("");

  useEffect(() => {
    const token = localStorage.getItem("cosmo_access_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/chat?token=${token}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "conversation_started":
          onConversationStarted?.(data.conversation_id, data.title);
          break;
        case "thinking":
          setIsThinking(true);
          break;
        case "stream_start":
          setIsThinking(false);
          setIsStreaming(true);
          streamingTextRef.current = "";
          setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);
          break;
        case "token":
          streamingTextRef.current += data.content;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: streamingTextRef.current, streaming: true };
            return copy;
          });
          break;
        case "stream_end":
          setIsStreaming(false);
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: streamingTextRef.current, streaming: false };
            return copy;
          });
          break;
        case "error":
          setIsThinking(false);
          setIsStreaming(false);
          setError(data.message);
          break;
        default:
          break;
      }
    };

    socket.onerror = () => setError("Connection error. Retrying may help.");

    return () => socket.close();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((content, documentIds = []) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected yet — try again in a moment.");
      return;
    }
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    socketRef.current.send(
      JSON.stringify({ content, conversation_id: conversationId, document_ids: documentIds })
    );
  }, [conversationId]);

  const loadHistory = useCallback((history) => setMessages(history), []);

  return { messages, isThinking, isStreaming, error, sendMessage, loadHistory };
}
