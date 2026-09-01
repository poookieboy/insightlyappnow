import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

/** Pick the most natural-sounding voice available on the device.
 *  Prioritises platform "Natural/Neural" voices, then known premium voices,
 *  then any English voice. All of this uses the browser's built-in speech
 *  engine — no API keys, no network calls. */
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
    /Microsoft (Aria|Jenny|Ava|Emma|Guy|Andrew|Davis)/i,
    /Samantha/i,
    /Serena/i,
    /Karen/i,
    /Moira/i,
    /Daniel/i,
  ];
  for (const re of prefer) {
    const hit = pool.find((v) => re.test(v.name));
    if (hit) return hit;
  }
  return pool[0] ?? voices[0];
}

/** Turn written text into something that reads aloud naturally:
 *  strip markdown scaffolding, expand a few symbols, and keep punctuation
 *  that the speech engine uses for breathing. */
function speakableText(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ". Here's a code block on screen. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, ", ")
    .replace(/^\s*(\d+)\.\s+/gm, "$1. ")
    .replace(/[*_>~|]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s*=\s*/g, " equals ")
    .replace(/(\d)\s*%/g, "$1 percent")
    .replace(/\s*\n{2,}\s*/g, ". ")
    .replace(/\s*\n\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/([.,!?;:])\1+/g, "$1")
    .trim();
}

/** Break into short, breathable phrases. Long sentences get split on commas
 *  so the delivery doesn't run out of air like a robot reading a paragraph. */
function toPhrases(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= 170) { out.push(s); continue; }
    let buf = "";
    for (const part of s.split(/(?<=,)\s+/)) {
      if ((buf + " " + part).trim().length > 170 && buf) { out.push(buf.trim()); buf = part; }
      else buf = (buf ? buf + " " : "") + part;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

export function useVoiceChat() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recRef = useRef<SR | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);
  const keepAliveRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const synth = window.speechSynthesis;
    setSupported(!!SR);
    setTtsSupported(!!synth);
    if (!synth) return;

    const refresh = () => { voiceRef.current = pickHumanVoice(synth.getVoices()); };
    refresh();
    synth.onvoiceschanged = refresh;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
      if (keepAliveRef.current) window.clearInterval(keepAliveRef.current);
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
    try { rec.start(); } catch { setListening(false); }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
    setListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelledRef.current = true;
    queueRef.current = [];
    if (keepAliveRef.current) { window.clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  /** Speak with human pacing: one phrase at a time, with a short natural
   *  pause after each, and slight pitch variation so it doesn't feel flat. */
  const speak = useCallback((text: string) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth || !text) return;

    synth.cancel();
    cancelledRef.current = false;

    const clean = speakableText(text).slice(0, 4000);
    if (!clean) return;
    queueRef.current = toPhrases(clean);
    const voice = voiceRef.current ?? pickHumanVoice(synth.getVoices());
    setSpeaking(true);

    // Chrome silently stops long speech after ~15s; a periodic resume keeps it alive.
    if (keepAliveRef.current) window.clearInterval(keepAliveRef.current);
    keepAliveRef.current = window.setInterval(() => {
      if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); }
    }, 9000);

    const finish = () => {
      if (keepAliveRef.current) { window.clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      setSpeaking(false);
    };

    const next = () => {
      if (cancelledRef.current) return finish();
      const phrase = queueRef.current.shift();
      if (!phrase) return finish();

      const u = new SpeechSynthesisUtterance(phrase);
      if (voice) u.voice = voice;
      // Conversational, unhurried delivery with gentle natural variation.
      u.rate = 0.97 + (Math.random() - 0.5) * 0.04;
      u.pitch = /\?\s*$/.test(phrase) ? 1.06 : 0.98 + (Math.random() - 0.5) * 0.04;
      u.volume = 1;
      const gap = /[.!?]$/.test(phrase) ? 240 : 110;
      u.onend = () => { if (!cancelledRef.current) window.setTimeout(next, gap); else finish(); };
      u.onerror = () => { if (!cancelledRef.current) window.setTimeout(next, 60); else finish(); };
      synth.speak(u);
    };

    next();
  }, []);

  return { listening, speaking, transcript, supported, ttsSupported, start, stop, speak, stopSpeaking };
}
