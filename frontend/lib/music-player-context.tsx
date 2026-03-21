"use client"

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react"

export interface MusicTrack {
  musicId: number
  title: string
  artist?: string
  fileUrl: string
  coverUrl?: string
  durationSeconds?: number
}

interface MusicPlayerState {
  track: MusicTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  visible: boolean
}

interface MusicPlayerActions {
  play: (track: MusicTrack) => void
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (time: number) => void
  dismiss: () => void
}

type MusicPlayerContextType = MusicPlayerState & MusicPlayerActions

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null)

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider")
  return ctx
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("durationchange", onDurationChange)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("durationchange", onDurationChange)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.pause()
      audio.src = ""
    }
  }, [])

  const play = useCallback((newTrack: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return

    if (track?.musicId === newTrack.musicId && audio.src) {
      audio.play().catch((e) => console.warn("[MusicPlayer] resume failed:", e))
    } else {
      setTrack(newTrack)
      audio.src = newTrack.fileUrl
      audio.load()
      audio.play().catch((e) => console.warn("[MusicPlayer] load/play failed:", e))
      setCurrentTime(0)
    }
    setVisible(true)
  }, [track?.musicId])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ""
    }
    setTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setVisible(false)
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio) audio.currentTime = time
  }, [])

  const dismiss = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ""
    }
    setTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setVisible(false)
  }, [])

  return (
    <MusicPlayerContext.Provider value={{ track, isPlaying, currentTime, duration, visible, play, pause, resume, stop, seek, dismiss }}>
      {children}
    </MusicPlayerContext.Provider>
  )
}
