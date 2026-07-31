import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The signature visual of Cosmo AI: a pulsing gold-rimmed orb that acts as the
 * assistant's "face". It glows and ripples while thinking, and while speaking
 * (via the Web Speech API) it drives a live waveform + subtle "mouth" pulse
 * synced to speech amplitude approximation.
 */
export default function AvatarPanel({ isThinking, isStreaming, latestAssistantText }) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bars = useMemo(() => Array.from({ length: 28 }), []);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!voiceEnabled || !latestAssistantText || isStreaming) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestAssistantText.slice(0, 600));
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [latestAssistantText, isStreaming, voiceEnabled]);

  const active = isThinking || isStreaming || isSpeaking;

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 p-4 gap-4">
      <div className="glass-panel flex-1 flex flex-col items-center justify-center relative overflow-hidden py-10">
        <div className="absolute inset-0 bg-radial-glow opacity-70" />

        {/* Orb */}
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute w-52 h-52 rounded-full bg-gold-gradient blur-2xl transition-opacity duration-500 ${
              active ? "opacity-40 animate-pulse-slow" : "opacity-15"
            }`}
          />
          <div
            className={`relative w-36 h-36 rounded-full border-2 border-gold/60 bg-graphite/80 backdrop-blur-xl
              flex items-center justify-center shadow-gold ${active ? "animate-float" : ""}`}
          >
            <div
              className={`w-20 h-20 rounded-full bg-gold-gradient transition-transform duration-300 ${
                isSpeaking ? "scale-110" : "scale-100"
              }`}
              style={{
                animation: isSpeaking ? "pulse 0.6s ease-in-out infinite" : undefined,
              }}
            />
            {/* "mouth" indicator */}
            <div
              className={`absolute bottom-8 w-8 rounded-full bg-void/70 transition-all duration-150 ${
                isSpeaking ? "h-3" : "h-1"
              }`}
            />
          </div>
        </div>

        <p className="relative mt-6 font-display text-sm text-mist tracking-wide">
          {isThinking ? "Thinking…" : isStreaming ? "Responding…" : isSpeaking ? "Speaking…" : "Cosmo is ready"}
        </p>

        {/* Waveform */}
        <div className="relative flex items-end gap-[3px] h-10 mt-6">
          {bars.map((_, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full bg-gold ${active ? "opacity-90" : "opacity-20"}`}
              style={{
                height: active ? `${8 + ((i * 37) % 32)}px` : "4px",
                animation: active ? `waveform 0.9s ease-in-out ${i * 0.04}s infinite alternate` : "none",
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes waveform {
            from { transform: scaleY(0.4); }
            to { transform: scaleY(1.3); }
          }
        `}</style>

        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          className="absolute bottom-4 right-4 ghost-btn !px-2 !py-2"
          title={voiceEnabled ? "Mute voice" : "Enable voice"}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </aside>
  );
}
