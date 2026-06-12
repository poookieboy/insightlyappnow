import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

/** Pick the most natural-sounding voice available in the browser.
 *  Prioritises: explicit "Natural"/"Neural" voices → known premium voices
 *  (Google/Microsoft/Apple) → any en-US voice → first available. */
function pickHumanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang));
  const pool = en.length ? en : voices;
  const prefer = [
    /Natural/i,
    /Neural/i,
    /Premium/i,
    /Enhanced/i,
    /Google US English/i,
    /Google UK English Female/i,
    /Microsoft (Aria|Jenny|Guy|Davis|Ava|Andrew)/i,
    /Samantha/i,
    /Karen/i,
    /Daniel/i,
  ];
  for (const re of prefer) {
    const hit = pool.find((v) => re.test(v.name));
    if (hit) return hit;
  }
  return pool[0] ?? voices[0];
}

export function useVoiceChat() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SR | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR && !!window.speechSynthesis);

    if (!window.speechSynthesis) return;
    const refresh = () => {
      voiceRef.current = pickHumanVoice(window.speechSynthesis.getVoices());
    };
    refresh();
    window.speechSynthesis.onvoiceschanged = refresh;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
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

  /** Speak a long reply by splitting into sentence-sized chunks. Adds tiny
   *  pauses between sentences so it sounds like a person, not a robot
   *  reading without breath. */
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, " . code block . ")
      .replace(/[*_`#>~]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2400);

    const chunks = clean.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];

    const voice = voiceRef.current ?? pickHumanVoice(window.speechSynthesis.getVoices());
    setSpeaking(true);

    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      // Slower + slightly lower pitch reads as warmer and more human than defaults
      u.rate = 0.96;
      u.pitch = 0.95;
      u.volume = 1;
      if (voice) u.voice = voice;
      if (i === chunks.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      window.speechSynthesis.speak(u);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, transcript, supported, start, stop, speak, stopSpeaking };
}
