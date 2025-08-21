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
    const isInBlock = !!exercise.blockId;
    
    const renderExerciseBadges = () => {
      const badges = [];
      
      if (parsedData.sets && parsedData.reps) {
        // Show different format for exercises in blocks
        const setsDisplay = isInBlock ? `1 × ${parsedData.reps} (per round)` : `${parsedData.sets} × ${parsedData.reps}`;
        badges.push(
          <Badge key="sets" variant="outline" className="text-xs">
            {setsDisplay}
          </Badge>
        );
      }
      
      if (parsedData.progressiveWeights && parsedData.progressiveWeights.length > 0) {
        badges.push(
          <Badge key="progressive-weights" variant="secondary" className="text-xs">
            {parsedData.progressiveWeights.join(' → ')}
          </Badge>
        );
      } else if (parsedData.weight) {
        badges.push(
          <Badge key="weight" variant="secondary" className="text-xs">
            {parsedData.weight}
          </Badge>
        );
      }
      
      if (parsedData.time) {
        badges.push(
          <Badge key="time" variant="outline" className="text-xs">
            {parsedData.time}
          </Badge>
        );
      }
      
      if (parsedData.distance) {
        badges.push(
          <Badge key="distance" variant="outline" className="text-xs">
            {parsedData.distance}
          </Badge>
        );
      }
      
      if (parsedData.restPeriod) {
        badges.push(
          <Badge key="rest" variant="outline" className="text-xs">
            Rest: {parsedData.restPeriod}
          </Badge>
        );
      }
      
      return badges;
    };
    
    return (
      <Card key={exercise.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base mb-3">{exercise.name}</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {renderExerciseBadges()}
              </div>
            </div>
            
            {/* Timestamp in preview mode */}
            <div className="ml-3 text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(exercise.timestamp)}
              </p>
            </div>
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
      <Card key={blockId} className="overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getBlockIcon(block.type)}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{block.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline">{block.type}</Badge>
                  {block.rounds && (
                    <Badge variant="secondary">{block.rounds} rounds</Badge>
                  )}
                  {block.restBetweenExercises && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {block.restBetweenExercises}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {[...blockExercises].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).map(renderExerciseCard)}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
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
      
      <div className="space-y-6">
        {Object.entries(groupedExercises).map(([blockId, blockExercises]) =>
          renderBlockSection(blockId, blockExercises)
        )}
      </div>
    </div>
  );
}