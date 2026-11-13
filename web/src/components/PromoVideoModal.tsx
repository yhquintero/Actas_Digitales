import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, ShieldCheck, Sparkles, Smartphone, Globe, Lock, Mic } from 'lucide-react';

interface PromoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Scene {
  id: number;
  title: string;
  startSec: number;
  endSec: number;
  subtitles: string;
  narrationText: string;
  visualType: 'problem' | 'ecosystem' | 'pipeline' | 'correction' | 'security' | 'outro';
}

const SCENES: Scene[] = [
  {
    id: 1,
    title: "1. El Problema de las Reuniones",
    startSec: 0,
    endSec: 30,
    subtitles: "En cada empresa o asamblea, las decisiones nacen de una conversación. Pero transcribir grabaciones a mano cuesta días enteros de trabajo agotador y propenso a errores.",
    narrationText: "En cada empresa o asamblea, las decisiones más importantes nacen de una conversación. Pero transcribir grabaciones a mano cuesta días enteros de trabajo agotador, lleno de vacilaciones y propenso a errores.",
    visualType: 'problem'
  },
  {
    id: 2,
    title: "2. Ecosistema Actas Digitales",
    startSec: 30,
    endSec: 60,
    subtitles: "Te presentamos Actas Digitales: captura la voz de tus reuniones y transfórmala al instante en documentos formales limpios, en Web, Servidor propio y Android nativo.",
    narrationText: "Te presentamos Actas Digitales. Captura la voz de tus reuniones y transfórmala al instante en documentos formales limpios. Disponible en Web instalable, Servidor privado y aplicación Android nativa.",
    visualType: 'ecosystem'
  },
  {
    id: 3,
    title: "3. Pipeline IA en Español",
    startSec: 60,
    endSec: 105,
    subtitles: "Detección de voz (VAD), normalización de audio y transcripción fonética calibrada estrictamente para el idioma español, reconociendo términos técnicos y acentos.",
    narrationText: "Nuestro pipeline de inteligencia acústica aplica detección de voz, normalización y transcripción fonética calibrada estrictamente para el idioma español, reconociendo términos técnicos y acentos.",
    visualType: 'pipeline'
  },
  {
    id: 4,
    title: "4. Consolidación y Ortografía",
    startSec: 105,
    endSec: 140,
    subtitles: "Aquí ocurre la verdadera magia: nuestro motor elimina tartamudeos, suprime muletillas orales, inyecta signos ¿ y ¡ obligatorios y corrige todas las tildes del español.",
    narrationText: "Aquí ocurre la verdadera magia. Nuestro motor elimina tartamudeos, suprime muletillas orales, inyecta los signos de apertura reglamentarios y corrige todas las tildes del español según la Real Academia Española.",
    visualType: 'correction'
  },
  {
    id: 5,
    title: "5. Seguridad HTTPS y TLS 1.3",
    startSec: 140,
    endSec: 165,
    subtitles: "Tu información confidencial está blindada: cifrado HTTPS de extremo a extremo, certificados firmados, HSTS y la opción de operar 100% en tu servidor privado.",
    narrationText: "Tu información confidencial está totalmente blindada. Cifrado HTTPS de extremo a extremo con TLS 1.3, certificados firmados, HSTS y la opción de operar al cien por ciento en tu servidor privado.",
    visualType: 'security'
  },
  {
    id: 6,
    title: "6. Del Audio al Acta Oficial",
    startSec: 165,
    endSec: 180,
    subtitles: "Pasa de la voz al acuerdo formal en segundos. Exporta en Markdown, PDF y TXT listo para firmar. Descubre la potencia de Actas Digitales.",
    narrationText: "Pasa de la voz al acuerdo formal en segundos. Exporta en Markdown, PDF y formato de texto listo para firmar. Descubre la potencia de Actas Digitales.",
    visualType: 'outro'
  }
];

export const PromoVideoModal: React.FC<PromoVideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);
  const totalDuration = 180; // 3 minutos = 180 segundos

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenSceneRef = useRef<number | null>(null);

  // Inicializar voces del sistema para narración fluida femenina en español
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Buscar voz femenina en español (Mónica, Paulina, Lucía, Helena, Laura, etc.)
        const spanishFemale = voices.find(
          (v) =>
            v.lang.startsWith('es') &&
            (v.name.toLowerCase().includes('monica') ||
              v.name.toLowerCase().includes('paulina') ||
              v.name.toLowerCase().includes('lucia') ||
              v.name.toLowerCase().includes('helena') ||
              v.name.toLowerCase().includes('sabina') ||
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('mujer'))
        ) || voices.find((v) => v.lang.startsWith('es'));
        
        if (spanishFemale) {
          setActiveVoice(spanishFemale);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Reproducir archivo de audio real o fallback con síntesis de voz
  const playCurrentSceneAudio = (scene: Scene) => {
    if (isMuted) return;

    if (audioRef.current) {
      audioRef.current.src = `/audio/escena_${scene.id}.mp3`;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        speakCurrentSceneFallback(scene);
      });
    } else {
      speakCurrentSceneFallback(scene);
    }
  };

  const speakCurrentSceneFallback = (scene: Scene) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.narrationText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    if (activeVoice) {
      utterance.voice = activeVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  // Reproductor con reloj sincronizado
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      lastSpokenSceneRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    let timer: number;
    if (isPlaying) {
      if (audioRef.current && audioRef.current.paused && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
      timer = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
    }

    return () => clearInterval(timer);
  }, [isPlaying, isOpen]);

  const currentScene = SCENES.find(
    (s) => currentTime >= s.startSec && currentTime < s.endSec
  ) || SCENES[SCENES.length - 1];

  // Disparar locución de audio cuando cambia la escena
  useEffect(() => {
    if (isOpen && isPlaying && !isMuted) {
      if (lastSpokenSceneRef.current !== currentScene.id) {
        lastSpokenSceneRef.current = currentScene.id;
        playCurrentSceneAudio(currentScene);
      }
    }
  }, [currentScene.id, isPlaying, isMuted, isOpen]);

  // Si se silencia o reactiva audio
  useEffect(() => {
    if (isMuted) {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else if (!isMuted && isPlaying) {
      playCurrentSceneAudio(currentScene);
    }
  }, [isMuted]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (newSec: number) => {
    const target = Math.min(totalDuration, Math.max(0, newSec));
    setCurrentTime(target);
    lastSpokenSceneRef.current = null;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Elemento de Audio Nativo */}
        <audio ref={audioRef} src="/audio/promocional_actas_digitales.mp3" preload="auto" />

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              <span>Vídeo Promocional (3 Minutos)</span>
              <span className="text-xs bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono">
                1080p · Locución Femenina en Español
              </span>
            </h3>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="text-slate-400 dark:text-slate-500 hover:text-white p-1 rounded-lg transition hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Area */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-between p-6 overflow-hidden">
          {/* Top Badge: Scene Indicator & Audio Status */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold backdrop-blur-sm">
              {currentScene.title}
            </div>

            <div className="flex items-center space-x-2">
              <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>Audio Femenino Activo</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                {formatTime(currentTime)} / 3:00
              </span>
            </div>
          </div>

          {/* Dynamic Scene Content Graphic */}
          <div className="w-full max-w-2xl my-auto flex flex-col items-center justify-center text-center">
            {currentScene.visualType === 'problem' && (
              <div className="space-y-4 animate-fade-zoom-in">
                <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                  <span className="text-4xl">⏱️</span>
                </div>
                <h4 className="text-2xl font-extrabold text-white">¿Horas perdidas transcribiendo actas a mano?</h4>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-mono max-w-lg mx-auto">
                  <span className="text-rose-400 line-through">"ehhh... bueno pues yo-yo creo que el acta..."</span>
                  <p className="mt-2 text-slate-400 dark:text-slate-500 italic">Notas desordenadas, vacilaciones orales y faltas de ortografía que retrasan los acuerdos.</p>
                </div>
              </div>
            )}

            {currentScene.visualType === 'ecosystem' && (
              <div className="space-y-4 animate-fade-zoom-in">
                <div className="flex items-center justify-center space-x-6 text-white mb-2">
                  <div className="flex flex-col items-center bg-slate-800/80 p-3 rounded-xl border border-indigo-500/40">
                    <Globe className="w-8 h-8 text-indigo-400 mb-1" />
                    <span className="text-xs font-bold">Web PWA</span>
                  </div>
                  <div className="text-indigo-400 font-bold text-xl">↔</div>
                  <div className="flex flex-col items-center bg-slate-800/80 p-3 rounded-xl border border-emerald-500/40">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold">Servidor HTTPS</span>
                  </div>
                  <div className="text-indigo-400 font-bold text-xl">↔</div>
                  <div className="flex flex-col items-center bg-slate-800/80 p-3 rounded-xl border border-purple-500/40">
                    <Smartphone className="w-8 h-8 text-purple-400 mb-1" />
                    <span className="text-xs font-bold">Android Nativo</span>
                  </div>
                </div>
                <h4 className="text-2xl font-extrabold text-white">Tres plataformas. Un solo objetivo.</h4>
                <p className="text-xs text-indigo-200">Graba desde el móvil, sube desde la web o procesa todo en tu propio servidor.</p>
              </div>
            )}

            {currentScene.visualType === 'pipeline' && (
              <div className="space-y-4 animate-fade-zoom-in w-full">
                <div className="flex items-center justify-center space-x-2 my-2">
                  {[40, 70, 25, 90, 60, 100, 45, 80, 30, 95, 50].map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 bg-indigo-500 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                    ></div>
                  ))}
                </div>
                <h4 className="text-2xl font-extrabold text-white">Reconocimiento Fonético Calibrado en Español</h4>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
                    ✓ VAD Silencios
                  </span>
                  <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full">
                    ✓ Forzado `language="es"`
                  </span>
                  <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full">
                    ✓ Timestamps por Frase
                  </span>
                </div>
              </div>
            )}

            {currentScene.visualType === 'correction' && (
              <div className="space-y-4 animate-fade-zoom-in max-w-lg">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-extrabold text-white">Consolidación y Corrección RAE</h4>
                <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 text-rose-300">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ANTES (CRUDO)</span>
                    "la sesion de oy se aprueva..."
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 text-emerald-300">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">DESPUÉS (OFICIAL)</span>
                    "¿La sesión de hoy se aprueba?"
                  </div>
                </div>
              </div>
            )}

            {currentScene.visualType === 'security' && (
              <div className="space-y-4 animate-fade-zoom-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-extrabold text-white">Seguridad y Privacidad Absoluta</h4>
                <div className="flex justify-center gap-3 text-xs font-mono">
                  <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
                    TLS 1.3 / AES-256
                  </span>
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full">
                    HSTS Activo
                  </span>
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full">
                    100% Servidor Local
                  </span>
                </div>
              </div>
            )}

            {currentScene.visualType === 'outro' && (
              <div className="space-y-4 animate-fade-zoom-in">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                  <span className="text-3xl">📑</span>
                </div>
                <h4 className="text-3xl font-black text-white tracking-tight">Actas Digitales</h4>
                <p className="text-sm text-indigo-200">Captura. Transcribe. Consolida. Formaliza.</p>
                <div className="pt-2">
                  <span className="bg-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg">
                    Descubre el Futuro de las Actas Oficiales
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subtitles Overlay at Bottom */}
          <div className="w-full max-w-3xl bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-center">
            <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
              {currentScene.subtitles}
            </p>
          </div>
        </div>

        {/* Video Scrubber & Controls */}
        <div className="p-6 bg-slate-900/90 border-t border-slate-800 space-y-4">
          {/* Progress Timeline */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={totalDuration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>180 segundos (3 minutos) · Audio en Español</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Buttons and Scene Jumper */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                  lastSpokenSceneRef.current = null;
                }}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Reiniciar"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition ${
                  isMuted ? 'text-rose-400 hover:bg-rose-950/50' : 'text-slate-400 dark:text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
                title={isMuted ? "Activar audio" : "Silenciar audio"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Jump to Scenes Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleSeek(scene.startSec)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition ${
                    currentScene.id === scene.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {scene.title.split('.')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
