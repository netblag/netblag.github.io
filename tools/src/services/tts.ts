import { getPlainText } from '../utils/textParser';

export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static listeners: Set<(speaking: boolean) => void> = new Set();
  private static speaking = false;

  static isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  static subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.speaking);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(speaking: boolean) {
    this.speaking = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  static stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }

    this.notify(false);
  }

  /**
   * Speaks text using Google Translate TTS service,
   * with seamless fallback to Google browser voices.
   */
  static speak(
    rawText: string, 
    options?: {
      rate?: number;
      pitch?: number;
      lang?: string;
      onEnd?: () => void;
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // 1. Clean structured JSON & whitespace
      const clean = getPlainText(rawText).trim();
      if (!clean) {
        resolve(false);
        return;
      }

      // 2. Stop any existing playback
      this.stop();

      const isFa = this.isPersian(clean);
      const targetLang = options?.lang || (isFa ? 'fa' : 'en');
      const rate = options?.rate || 1.0;

      // 3. Try Google Translate TTS online engine (under 200 chars)
      if (clean.length <= 200) {
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=${targetLang}&client=tw-ob`;
        
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = googleTtsUrl;
        audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
        this.currentAudio = audio;

        let hasEnded = false;
        const handleComplete = () => {
          if (hasEnded) return;
          hasEnded = true;
          this.currentAudio = null;
          this.notify(false);
          if (options?.onEnd) options.onEnd();
          resolve(true);
        };

        audio.onplay = () => {
          this.notify(true);
        };

        audio.onended = () => {
          handleComplete();
        };

        audio.onerror = () => {
          // If Google Translate audio fails or is blocked by network, fallback to Web Speech
          this.fallbackSpeechSynthesis(clean, targetLang, rate, options?.pitch, options?.onEnd, resolve);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Fallback to Web Speech API
            this.fallbackSpeechSynthesis(clean, targetLang, rate, options?.pitch, options?.onEnd, resolve);
          });
        }
      } else {
        // Longer text: use SpeechSynthesis prioritizing Google voices
        this.fallbackSpeechSynthesis(clean, targetLang, rate, options?.pitch, options?.onEnd, resolve);
      }
    });
  }

  /**
   * Fallback using Web Speech API with Google's high quality voices
   */
  private static fallbackSpeechSynthesis(
    text: string,
    targetLang: string,
    rate: number,
    pitch?: number,
    onEnd?: () => void,
    resolve?: (val: boolean) => void
  ) {
    if (!this.synth || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notify(false);
      if (onEnd) onEnd();
      if (resolve) resolve(false);
      return;
    }

    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = pitch || 1.0;
      utterance.lang = targetLang === 'fa' ? 'fa-IR' : 'en-US';

      // Pick Google US English / Google voice specifically
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice = voices.find(v => 
          v.name.includes('Google') && v.lang.toLowerCase().startsWith(targetLang.slice(0, 2))
        ) || voices.find(v => 
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Siri')) &&
          v.lang.toLowerCase().startsWith(targetLang.slice(0, 2))
        ) || voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2)));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        this.notify(true);
      };

      utterance.onend = () => {
        this.notify(false);
        if (onEnd) onEnd();
        if (resolve) resolve(true);
      };

      utterance.onerror = () => {
        this.notify(false);
        if (onEnd) onEnd();
        if (resolve) resolve(false);
      };

      this.synth.speak(utterance);
    } catch {
      this.notify(false);
      if (onEnd) onEnd();
      if (resolve) resolve(false);
    }
  }

  private static isPersian(text: string): boolean {
    const persianPattern = /[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF]/;
    return persianPattern.test(text);
  }
}
