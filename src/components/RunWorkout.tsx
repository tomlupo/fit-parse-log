import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, ChevronLeft, ChevronRight, Square, Timer, Target, RotateCcw, Layers } from 'lucide-react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';

interface RunWorkoutProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  layoutOrder: Array<{ type: 'block' | 'exercise', id: string }>;
}

interface WorkoutStep {
  id: string;
  exerciseId: string;
  exerciseName: string;
  reps?: number;
  weight?: string;
  time?: string;
  distance?: string;
  restPeriod?: string;
  context?: {
    blockName?: string;
    blockType?: string;
    currentRound?: number;
    totalRounds?: number;
    exerciseInBlock?: number;
    totalExercisesInBlock?: number;
  };
  restAfter?: string; // Block rest between exercises
}

const parseTimeToSeconds = (timeStr: string): number => {
  const cleaned = timeStr.toLowerCase().trim();
  
  // Handle MM:SS format
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
  }
  
  // Handle "30s", "2min", etc.
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(s|sec|seconds?|m|min|minutes?)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    if (unit.startsWith('m')) {
      return value * 60;
    }
    return value;
  }
  
  return 60; // Default 1 minute
};

const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function RunWorkout({ exercises, blocks, layoutOrder }: RunWorkoutProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  const buildSteps = (): WorkoutStep[] => {
    const steps: WorkoutStep[] = [];
    
    for (const layoutItem of layoutOrder) {
      if (layoutItem.type === 'exercise') {
        // Standalone exercise
        const exercise = exercises.find(ex => ex.id === layoutItem.id);
        if (!exercise) continue;
        
        const sets = exercise.parsedData.sets || 1;
        for (let set = 1; set <= sets; set++) {
          steps.push({
            id: `${exercise.id}-set-${set}`,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            reps: exercise.parsedData.reps,
            weight: exercise.parsedData.weight,
            time: exercise.parsedData.time,
            distance: exercise.parsedData.distance,
            restPeriod: exercise.parsedData.restPeriod,
          });
        }
      } else if (layoutItem.type === 'block') {
        // Block with exercises
        const block = blocks.find(b => b.id === layoutItem.id);
        if (!block) continue;
        
        const blockExercises = exercises
          .filter(ex => ex.blockId === block.id)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const rounds = block.rounds || 1;
        
        for (let round = 1; round <= rounds; round++) {
          for (let exIndex = 0; exIndex < blockExercises.length; exIndex++) {
            const exercise = blockExercises[exIndex];
            
            // Calculate progression values for this round
            let reps = exercise.parsedData.reps;
            let weight = exercise.parsedData.weight;
            let time = exercise.parsedData.time;
            let distance = exercise.parsedData.distance;
            
            if (exercise.blockProgression) {
              const prog = exercise.blockProgression;
              if (prog.roundReps && prog.roundReps[round - 1] !== undefined) {
                reps = prog.roundReps[round - 1];
              }
              if (prog.roundWeights && prog.roundWeights[round - 1]) {
                weight = prog.roundWeights[round - 1];
              }
              if (prog.roundTimes && prog.roundTimes[round - 1]) {
                time = prog.roundTimes[round - 1];
              }
              if (prog.roundDistances && prog.roundDistances[round - 1]) {
                distance = prog.roundDistances[round - 1];
              }
            }
            
            // Use progressive weights if available and no block progression
            if (!weight && exercise.parsedData.progressiveWeights) {
              const roundIndex = Math.min(round - 1, exercise.parsedData.progressiveWeights.length - 1);
              weight = exercise.parsedData.progressiveWeights[roundIndex];
            }
            
            steps.push({
              id: `${exercise.id}-round-${round}`,
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              reps,
              weight,
              time,
              distance,
              restPeriod: exercise.parsedData.restPeriod,
              context: {
                blockName: block.name,
                blockType: block.type,
                currentRound: round,
                totalRounds: rounds,
                exerciseInBlock: exIndex + 1,
                totalExercisesInBlock: blockExercises.length,
              },
              restAfter: exIndex < blockExercises.length - 1 ? block.restBetweenExercises : undefined,
            });
          }
        }
      }
    }
    
    return steps;
  };

  const steps = buildSteps();
  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimeRemaining]);

  const startRest = (duration: string) => {
    const seconds = parseTimeToSeconds(duration);
    setRestTimeRemaining(seconds);
    setIsRestTimerActive(true);
  };

  const pauseRest = () => setIsRestTimerActive(false);
  const resumeRest = () => setIsRestTimerActive(true);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
    }
  };

  const getBlockIcon = (type?: string) => {
    switch (type) {
      case 'superset': return <Layers className="h-4 w-4" />;
      case 'circuit': return <RotateCcw className="h-4 w-4" />;
      case 'round': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (steps.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No workout to run</h3>
          <p className="text-muted-foreground">
            Add some exercises or blocks to start your guided workout session.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Workout in Progress</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Context Header */}
      {currentStep?.context && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {getBlockIcon(currentStep.context.blockType)}
              <div>
                <h3 className="font-semibold">{currentStep.context.blockName}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Round {currentStep.context.currentRound}/{currentStep.context.totalRounds}</span>
                  <span>Exercise {currentStep.context.exerciseInBlock}/{currentStep.context.totalExercisesInBlock}</span>
                  <Badge variant="outline" className="text-xs">
                    {currentStep.context.blockType}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Exercise */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">{currentStep.exerciseName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {currentStep.reps && (
              <Badge variant="default" className="text-base px-3 py-1">
                {currentStep.reps} reps
              </Badge>
            )}
            {currentStep.weight && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                {currentStep.weight}
              </Badge>
            )}
            {currentStep.time && (
              <Badge variant="outline" className="text-base px-3 py-1">
                {currentStep.time}
              </Badge>
            )}
            {currentStep.distance && (
              <Badge variant="outline" className="text-base px-3 py-1">
                {currentStep.distance}
              </Badge>
            )}
          </div>

          {/* Rest Timer */}
          {(currentStep.restPeriod || currentStep.restAfter) && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                Rest Timer
              </div>
              
              {isRestTimerActive ? (
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-center">
                    {formatSeconds(restTimeRemaining)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={pauseRest} variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={() => setRestTimeRemaining(0)} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 justify-center">
                  {restTimeRemaining > 0 ? (
                    <Button onClick={resumeRest} variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Resume ({formatSeconds(restTimeRemaining)})
                    </Button>
                  ) : (
                    <>
                      {currentStep.restPeriod && (
                        <Button onClick={() => startRest(currentStep.restPeriod!)} variant="outline">
                          <Timer className="h-4 w-4 mr-2" />
                          Rest {currentStep.restPeriod}
                        </Button>
                      )}
                      {currentStep.restAfter && (
                        <Button onClick={() => startRest(currentStep.restAfter!)} variant="outline">
                          <Timer className="h-4 w-4 mr-2" />
                          Rest {currentStep.restAfter}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentStepIndex + 1}</span>
              <span>/</span>
              <span>{steps.length}</span>
            </div>
            
            <Button
              onClick={nextStep}
              disabled={currentStepIndex === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}