import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Clock, Calendar, Target, RotateCcw, Layers, Timer } from 'lucide-react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';

interface WorkoutSessionProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
}

export function WorkoutSession({ exercises, blocks }: WorkoutSessionProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkoutStats = () => {
    const totalExercises = exercises.length;
    const strengthExercises = exercises.filter(e => e.parsedData.type === 'strength').length;
    const cardioExercises = exercises.filter(e => e.parsedData.type === 'cardio' || e.parsedData.type === 'time').length;
    
    return { totalExercises, strengthExercises, cardioExercises };
  };

  const renderExerciseCard = (exercise: ParsedExercise) => {
    const { parsedData } = exercise;
    
    return (
      <Card key={exercise.id} className="transition-transform hover:scale-[1.02]">
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-foreground">{exercise.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(exercise.timestamp)}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline">{parsedData.type}</Badge>
            
            {parsedData.sets && parsedData.reps && (
              <Badge variant="sets">
                {parsedData.sets} × {parsedData.reps}
              </Badge>
            )}
            
            {parsedData.progressiveWeights && parsedData.progressiveWeights.length > 0 ? (
              <Badge variant="weight">
                {parsedData.progressiveWeights.join(' → ')}
              </Badge>
            ) : parsedData.weight ? (
              <Badge variant="weight">
                {parsedData.weight}
              </Badge>
            ) : null}
            
            {parsedData.time && (
              <Badge variant="time">
                {parsedData.time}
              </Badge>
            )}
            
            {parsedData.distance && (
              <Badge variant="time">
                {parsedData.distance}
              </Badge>
            )}
            
            {parsedData.restPeriod && (
              <Badge variant="secondary">
                Rest: {parsedData.restPeriod}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground font-mono">
            Input: "{exercise.originalInput}"
          </div>
        </CardContent>
      </Card>
    );
  };

  const stats = getWorkoutStats();

  if (exercises.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No exercises yet</h3>
          <p className="text-muted-foreground">
            Start by adding your first exercise above to begin tracking your workout.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'superset': return <Layers className="h-4 w-4" />;
      case 'circuit': return <RotateCcw className="h-4 w-4" />;
      case 'rounds': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const groupedExercises = exercises.reduce((acc, exercise) => {
    const blockId = exercise.blockId || 'unassigned';
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(exercise);
    return acc;
  }, {} as Record<string, ParsedExercise[]>);

  const renderBlockSection = (blockId: string, blockExercises: ParsedExercise[]) => {
    const block = blocks.find(b => b.id === blockId);
    
    if (blockId === 'unassigned') {
      return (
        <div key="unassigned" className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>Individual Exercises</span>
          </div>
          {[...blockExercises].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).map(renderExerciseCard)}
        </div>
      );
    }

    if (!block) return null;

    return (
      <Card key={blockId} className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              {getBlockIcon(block.type)}
              {block.name}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {block.type}
              </Badge>
              {block.rounds && (
                <Badge variant="secondary" className="text-xs">
                  {block.rounds} rounds
                </Badge>
              )}
              {block.restBetweenExercises && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {block.restBetweenExercises}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...blockExercises].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).map(renderExerciseCard)}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">{stats.totalExercises}</span>
              <span className="text-muted-foreground">total</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-success" />
              <span className="font-medium">{stats.strengthExercises}</span>
              <span className="text-muted-foreground">strength</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-warning" />
              <span className="font-medium">{stats.cardioExercises}</span>
              <span className="text-muted-foreground">cardio</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {Object.entries(groupedExercises).map(([blockId, blockExercises]) =>
          renderBlockSection(blockId, blockExercises)
        )}
      </div>
    </div>
  );
}