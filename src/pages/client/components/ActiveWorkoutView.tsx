import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, CheckCircle2, RotateCcw, X, Dumbbell, Timer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Exercise {
  id: string;
  orden: number;
  series: number;
  repeticiones: string;
  notas: string;
  ejercicio: {
    nombre: string;
    musculos: string[];
    imagen_url: string;
  };
}

interface ActiveWorkoutProps {
  exercises: Exercise[];
  onComplete: () => void;
  onClose: () => void;
}

interface WorkoutState {
  currentIndex: number;
  currentSet: number;
  isResting: boolean;
  restTimeRemaining: number;
  startTime: number;
  completedSets: number[]; // Array of completed set counts per exercise index
}

const STORAGE_KEY = 'gym_active_session';
const REST_TIME_SET = 120; // 2 minutes
const REST_TIME_EXERCISE = 180; // 3 minutes

export default function ActiveWorkoutView({ exercises, onComplete, onClose }: ActiveWorkoutProps) {
  const [state, setState] = useState<WorkoutState>({
    currentIndex: 0,
    currentSet: 1,
    isResting: false,
    restTimeRemaining: 0,
    startTime: Date.now(),
    completedSets: new Array(exercises.length).fill(0)
  });

  const [sessionRestored, setSessionRestored] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate if saved state matches current exercises (rough check by length)
        if (parsed.completedSets && parsed.completedSets.length === exercises.length) {
          // Check if session is from today (optional, but good practice)
          const sessionDate = new Date(parsed.startTime);
          const today = new Date();
          if (sessionDate.toDateString() === today.toDateString()) {
             setState(parsed);
             setSessionRestored(true);
          }
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, [exercises.length]);

  // Save state to local storage on update
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Timer logic
  useEffect(() => {
    if (state.isResting && state.restTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
           if (prev.restTimeRemaining <= 1) {
             return { ...prev, isResting: false, restTimeRemaining: 0 };
           }
           return { ...prev, restTimeRemaining: prev.restTimeRemaining - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isResting, state.restTimeRemaining]);

  const currentExercise = exercises[state.currentIndex];
  const isLastExercise = state.currentIndex === exercises.length - 1;
  const isLastSet = state.currentSet >= currentExercise.series;

  const handleFinishSet = () => {
    // Determine rest time
    const isExerciseComplete = isLastSet;
    const nextRestTime = isExerciseComplete ? REST_TIME_EXERCISE : REST_TIME_SET;

    // Logic for next state
    let nextIndex = state.currentIndex;
    let nextSet = state.currentSet + 1;
    const nextCompletedSets = [...state.completedSets];
    
    // Mark set as complete
    nextCompletedSets[state.currentIndex] = Math.max(nextCompletedSets[state.currentIndex], state.currentSet);

    if (isExerciseComplete) {
       if (isLastExercise) {
         // Workout Complete!
         finishWorkout();
         return;
       }
       nextIndex = state.currentIndex + 1;
       nextSet = 1;
    }

    setState(prev => ({
      ...prev,
      currentIndex: nextIndex,
      currentSet: nextSet,
      completedSets: nextCompletedSets,
      isResting: true,
      restTimeRemaining: nextRestTime
    }));
  };

  const skipRest = () => {
    setState(prev => ({ ...prev, isResting: false, restTimeRemaining: 0 }));
  };

  const finishWorkout = () => {
    localStorage.removeItem(STORAGE_KEY);
    onComplete();
  };

  const cancelWorkout = () => {
    // Clean up storage if cancelled mid-workout to avoid stale state on next start
    // or keep it? User might have accidentally clicked close.
    // Let's keep it but maybe add a confirm dialog later. For now, just close.
    // Actually, if we just close, the "Start Routine" button will be visible again.
    // Since we restore from local storage on mount, if they click start again, it resumes!
    // That acts as a "minimize" feature. Nice.
    onClose();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const totalSets = exercises.reduce((acc, ex) => acc + ex.series, 0);
    const completedSetsTotal = state.completedSets.reduce((acc, count) => acc + count, 0);
    // Add current set progress if not resting and not finished
    // Actually, logic is tricky because state updates immediately. 
    // Let's just use completed sets count relative to total.
    return (completedSetsTotal / totalSets) * 100;
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col h-screen supports-[height:100dvh]:h-[100dvh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Rutina Activa</span>
            <span className="font-bold text-lg leading-none">
                {state.isResting ? "Descansando..." : `Ejercicio ${state.currentIndex + 1}/${exercises.length}`}
            </span>
        </div>
        <Button variant="ghost" size="icon" onClick={cancelWorkout}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Bar */}
      <Progress value={calculateProgress()} className="h-2 rounded-none" />

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col gap-6 items-center text-center">
            
            {state.isResting ? (
                <div className="flex flex-col items-center justify-center space-y-8 py-10 w-full animate-in fade-in duration-300">
                    <div className="relative">
                         <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-10">
                            <div className="h-64 w-64 rounded-full bg-primary/20 blur-xl"></div>
                         </div>
                         <Timer className="h-24 w-24 text-primary mb-4" />
                    </div>
                    
                    <div className="space-y-2">
                        <span className="text-muted-foreground text-sm uppercase tracking-widest">Tiempo de Descanso</span>
                        <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums">
                            {formatTime(state.restTimeRemaining)}
                        </div>
                    </div>

                    <div className="space-y-4 w-full max-w-xs">
                         <div className="text-sm text-muted-foreground">
                            Siguiente: {state.currentSet === 1 ? exercises[state.currentIndex]?.ejercicio.nombre : `Serie ${state.currentSet}`}
                         </div>
                        <Button size="lg" className="w-full" onClick={skipRest}>
                            Saltar Descanso <SkipForward className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-right duration-300">
                    {/* Exercise Info */}
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-lg border">
                            {currentExercise.ejercicio.imagen_url ? (
                                <img 
                                    src={currentExercise.ejercicio.imagen_url} 
                                    alt={currentExercise.ejercicio.nombre}
                                    className="w-full h-full object-contain bg-black/5"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-accent/20">
                                    <Dumbbell className="h-16 w-16 text-muted-foreground/40" />
                                </div>
                            )}
                        </div>

                        <div className="text-left space-y-1">
                             <h2 className="text-2xl font-bold">{currentExercise.ejercicio.nombre}</h2>
                             <p className="text-muted-foreground flex items-center gap-2">
                                <Dumbbell className="h-4 w-4" />
                                {currentExercise.repeticiones} Repeticiones
                             </p>
                        </div>
                        
                        {currentExercise.notas && (
                             <div className="bg-accent/30 p-4 rounded-lg text-sm text-left border text-muted-foreground">
                                <span className="font-semibold block mb-1 text-xs uppercase tracking-wide">Notas:</span>
                                {currentExercise.notas}
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      {!state.isResting && (
          <div className="p-4 pb-8 border-t bg-background/80 backdrop-blur-sm shrink-0 flex flex-col gap-3">
            <div className="text-center">
              <span className="text-sm text-muted-foreground uppercase tracking-widest block mb-1">Serie Actual</span>
              <div className="text-3xl font-bold tracking-tight">
                {state.currentSet} <span className="text-muted-foreground text-xl">/ {currentExercise.series}</span>
              </div>
            </div>
            <Button size="lg" className="w-full h-14 text-lg shadow-lg relative overflow-hidden" onClick={handleFinishSet}>
                <span className="relative z-10 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" /> Terminar Serie
                </span>
                <div className="absolute inset-0 bg-primary/10 hover:bg-primary/20 transition-colors" />
            </Button>
          </div>
      )}
    </div>
  );
}
