import React, { useState } from 'react';
import { ExerciseForm } from '@/components/ExerciseForm';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';
import { WorkoutSession } from '@/components/WorkoutSession';
import { WorkoutGrid } from '@/components/WorkoutGrid';
import { WorkoutHeader } from '@/components/WorkoutHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Workflow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  // Default exercises for testing
  const defaultExercises: ParsedExercise[] = [
    {
      id: '1',
      name: 'Bench Press',
      originalInput: 'Bench Press 3x8 80kg',
      parsedData: {
        sets: 3,
        reps: 8,
        weight: '80kg',
        type: 'strength'
      },
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      blockId: 'block1'
    },
    {
      id: '2', 
      name: 'Push-ups',
      originalInput: 'Push-ups 3x15',
      parsedData: {
        sets: 3,
        reps: 15,
        type: 'strength'
      },
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      blockId: 'block1'
    }
  ];

  const defaultBlocks: WorkoutBlock[] = [
    {
      id: 'block1',
      name: 'Upper Body Strength',
      type: 'superset',
      exercises: ['1', '2'],
      rounds: 3,
      restBetweenExercises: '2min'
    }
  ];

  const [exercises, setExercises] = useState<ParsedExercise[]>(defaultExercises);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>(defaultBlocks);
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
    setBlocks([]);
    toast({
      title: "Workout cleared",
      description: "All exercises and blocks have been removed from your session.",
    });
  };

  const handleAddBlock = (block: WorkoutBlock) => {
    setBlocks(prev => [...prev, block]);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    // Remove block association from exercises
    setExercises(prev => prev.map(exercise => 
      exercise.blockId === id 
        ? { ...exercise, blockId: undefined }
        : exercise
    ));
    toast({
      title: "Block removed",
      description: "Block has been removed and exercises unassigned.",
      variant: "destructive",
    });
  };

  const handleUpdateExercise = (updatedExercise: ParsedExercise) => {
    setExercises(prev => prev.map(exercise => 
      exercise.id === updatedExercise.id ? updatedExercise : exercise
    ));
  };

  const handleUpdateBlock = (updatedBlock: WorkoutBlock) => {
    setBlocks(prev => prev.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
  };

  const handleReorderBlocks = (reorderedBlocks: WorkoutBlock[]) => {
    setBlocks(reorderedBlocks);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <WorkoutHeader />
        
        <div className="flex flex-col items-center space-y-8">
          <ExerciseForm onAddExercise={handleAddExercise} />
          
          <Tabs defaultValue="list" className="w-full max-w-6xl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Grid View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="flex justify-center">
              <WorkoutSession 
                exercises={exercises}
                blocks={blocks}
                onRemoveExercise={handleRemoveExercise}
                onClearSession={handleClearSession}
              />
            </TabsContent>
            
            <TabsContent value="flow" className="flex justify-center">
              <WorkoutGrid
                exercises={exercises}
                blocks={blocks}
                onRemoveExercise={handleRemoveExercise}
                onUpdateExercise={handleUpdateExercise}
                onAddBlock={handleAddBlock}
                onUpdateBlock={handleUpdateBlock}
                onRemoveBlock={handleRemoveBlock}
                onReorderBlocks={handleReorderBlocks}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
