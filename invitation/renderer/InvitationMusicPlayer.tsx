"use client";

import { Music, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { WeddingInvitationContent } from "./types";

type InvitationMusicPlayerProps = {
  music: NonNullable<WeddingInvitationContent["music"]>;
};

export function InvitationMusicPlayer({ music }: InvitationMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = clampVolume(music.volume);

    function syncPlaying() {
      setIsPlaying(Boolean(audio && !audio.paused && !audio.ended));
    }

    function markReady() {
      setIsLoading(false);
    }

    function markError() {
      setIsLoading(false);
      setIsPlaying(false);
      setError("No pudimos reproducir la musica.");
    }

    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);
    audio.addEventListener("canplay", markReady);
    audio.addEventListener("error", markError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
      audio.removeEventListener("canplay", markReady);
      audio.removeEventListener("error", markError);
    };
  }, [music.volume]);

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) {
        audioRef.current?.pause();
      }
    }

    document.addEventListener("visibilitychange", pauseWhenHidden);

    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setError(null);

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setIsLoading(true);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError("Activa el audio desde el boton.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      <audio preload="none" ref={audioRef} src={music.audioUrl} />
      <button
        aria-label={
          isPlaying ? "Pausar musica de la invitacion" : "Reproducir musica de la invitacion"
        }
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] px-4 text-sm font-semibold text-[color:var(--inv-primary)] shadow-[0_14px_36px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
        onClick={togglePlayback}
        type="button"
      >
        <span className="grid size-7 place-items-center rounded-full bg-[color:var(--inv-primary)] text-[color:var(--inv-surface)]">
          {isLoading ? (
            <Music aria-hidden="true" className="size-4 animate-pulse" />
          ) : isPlaying ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : (
            <Play aria-hidden="true" className="size-4" />
          )}
        </span>
        <span className="min-w-0 truncate">
          {music.title || (isPlaying ? "Pausar" : "Musica")}
        </span>
      </button>
      <p
        aria-live="polite"
        className="max-w-64 rounded-full bg-[color:var(--inv-surface)]/92 px-3 py-1 text-right text-xs font-semibold text-[color:var(--inv-muted)] shadow-sm"
      >
        {error ?? (music.artist ? music.artist : "")}
      </p>
    </div>
  );
}

function clampVolume(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.45;
  }

  return Math.min(1, Math.max(0, value));
}
