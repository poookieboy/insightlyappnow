import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API typings are not in lib.dom for all TS targets — use loose types.
type SR = any;

export function useVoiceChat() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR && !!window.speechSynthesis);
  }, []);

  const start = useCallback((onFinal?: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: SR = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(finalText || interim);
      if (finalText && onFinal) onFinal(finalText.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setTranscript("");
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    // Strip markdown artifacts for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, " code block ")
      .replace(/[*_`#>~]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1500);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1;
    u.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /female|Samantha|Google US English|Zira/i.test(v.name)) ?? voices[0];
    if (preferred) u.voice = preferred;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, transcript, supported, start, stop, speak, stopSpeaking };
}
