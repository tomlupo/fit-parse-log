import React, { useState } from 'react';
import { ExerciseForm } from '@/components/ExerciseForm';
import { ParsedExercise } from '@/lib/exerciseParser';
import { WorkoutSession } from '@/components/WorkoutSession';
import { WorkoutHeader } from '@/components/WorkoutHeader';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [exercises, setExercises] = useState<ParsedExercise[]>([]);
  const { toast } = useToast();

  const handleAddExercise = (exercise: ParsedExercise) => {
    setExercises(prev => [exercise, ...prev]);
    toast({
      title: "Exercise added!",
      description: `${exercise.name} has been added to your workout.`,
    });
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(prev => prev.filter(exercise => exercise.id !== id));
    toast({
      title: "Exercise removed",
      description: "Exercise has been removed from your workout.",
      variant: "destructive",
    });
  };

  const handleClearSession = () => {
    setExercises([]);
    toast({
      title: "Workout cleared",
      description: "All exercises have been removed from your session.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <WorkoutHeader />
        
        <div className="flex flex-col items-center space-y-8">
          <ExerciseForm onAddExercise={handleAddExercise} />
          <WorkoutSession 
            exercises={exercises}
            onRemoveExercise={handleRemoveExercise}
            onClearSession={handleClearSession}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
