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

  // Layout order - tracks the order of blocks and standalone exercises
  const defaultLayoutOrder = [
    { type: 'block' as const, id: 'block1' }
  ];

  const [exercises, setExercises] = useState<ParsedExercise[]>(defaultExercises);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>(defaultBlocks);
  const [layoutOrder, setLayoutOrder] = useState<Array<{ type: 'block' | 'exercise', id: string }>>(defaultLayoutOrder);
  const { toast } = useToast();

  const handleAddExercise = (exercise: ParsedExercise) => {
    setExercises(prev => [exercise, ...prev]);
    // Add standalone exercise to layout
    if (!exercise.blockId) {
      setLayoutOrder(prev => [{ type: 'exercise', id: exercise.id }, ...prev]);
    }
    toast({
      title: "Exercise added!",
      description: `${exercise.name} has been added to your workout.`,
    });
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(prev => prev.filter(exercise => exercise.id !== id));
    // Remove from layout if it's a standalone exercise
    setLayoutOrder(prev => prev.filter(item => !(item.type === 'exercise' && item.id === id)));
    toast({
      title: "Exercise removed",
      description: "Exercise has been removed from your workout.",
      variant: "destructive",
    });
  };

  const handleClearSession = () => {
    setExercises([]);
    setBlocks([]);
    setLayoutOrder([]);
    toast({
      title: "Workout cleared",
      description: "All exercises and blocks have been removed from your session.",
    });
  };

  const handleAddBlock = (block: WorkoutBlock) => {
    setBlocks(prev => [...prev, block]);
    // Add block to layout
    setLayoutOrder(prev => [...prev, { type: 'block', id: block.id }]);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    // Remove block from layout
    setLayoutOrder(prev => prev.filter(item => !(item.type === 'block' && item.id === id)));
    // Remove block association from exercises and add them to layout as standalone
    const orphanedExercises = exercises.filter(ex => ex.blockId === id);
    setExercises(prev => prev.map(exercise => 
      exercise.blockId === id 
        ? { ...exercise, blockId: undefined }
        : exercise
    ));
    // Add orphaned exercises to layout
    if (orphanedExercises.length > 0) {
      setLayoutOrder(prev => [
        ...prev,
        ...orphanedExercises.map(ex => ({ type: 'exercise' as const, id: ex.id }))
      ]);
    }
    toast({
      title: "Block removed",
      description: "Block has been removed and exercises unassigned.",
      variant: "destructive",
    });
  };

  const handleUpdateExercise = (updatedExercise: ParsedExercise) => {
    const oldExercise = exercises.find(ex => ex.id === updatedExercise.id);
    setExercises(prev => prev.map(exercise => 
      exercise.id === updatedExercise.id ? updatedExercise : exercise
    ));
    
    // Handle layout changes when exercise moves between block and standalone
    if (oldExercise) {
      const wasStandalone = !oldExercise.blockId;
      const isNowStandalone = !updatedExercise.blockId;
      
      if (wasStandalone && !isNowStandalone) {
        // Moving from standalone to block - remove from layout
        setLayoutOrder(prev => prev.filter(item => !(item.type === 'exercise' && item.id === updatedExercise.id)));
      } else if (!wasStandalone && isNowStandalone) {
        // Moving from block to standalone - add to layout
        setLayoutOrder(prev => [...prev, { type: 'exercise', id: updatedExercise.id }]);
      }
    }
  };

  const handleUpdateBlock = (updatedBlock: WorkoutBlock) => {
    setBlocks(prev => prev.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
  };

  const handleReorderBlocks = (reorderedBlocks: WorkoutBlock[]) => {
    setBlocks(reorderedBlocks);
  };

  const handleReorderLayout = (newLayoutOrder: Array<{ type: 'block' | 'exercise', id: string }>) => {
    setLayoutOrder(newLayoutOrder);
  };

  const handleMoveItemUp = (itemType: 'block' | 'exercise', itemId: string) => {
    const currentIndex = layoutOrder.findIndex(item => item.type === itemType && item.id === itemId);
    if (currentIndex > 0) {
      const newOrder = [...layoutOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = 
        [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setLayoutOrder(newOrder);
      toast({
        title: `${itemType === 'block' ? 'Block' : 'Exercise'} moved up`,
        description: "Item order updated",
      });
    }
  };

  const handleMoveItemDown = (itemType: 'block' | 'exercise', itemId: string) => {
    const currentIndex = layoutOrder.findIndex(item => item.type === itemType && item.id === itemId);
    if (currentIndex < layoutOrder.length - 1) {
      const newOrder = [...layoutOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
        [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setLayoutOrder(newOrder);
      toast({
        title: `${itemType === 'block' ? 'Block' : 'Exercise'} moved down`,
        description: "Item order updated",
      });
    }
  };

  const handleMoveExerciseInBlockUp = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise?.blockId) return;

    const blockExercises = exercises
      .filter(ex => ex.blockId === exercise.blockId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const currentIndex = blockExercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex > 0) {
      const targetExercise = blockExercises[currentIndex - 1];
      const now = Date.now();
      
      // Swap timestamps to reorder
      const updatedExercise = { ...exercise, timestamp: new Date(now - (blockExercises.length - currentIndex + 1) * 1000) };
      const updatedTarget = { ...targetExercise, timestamp: new Date(now - (blockExercises.length - currentIndex) * 1000) };
      
      setExercises(prev => prev.map(ex => {
        if (ex.id === exerciseId) return updatedExercise;
        if (ex.id === targetExercise.id) return updatedTarget;
        return ex;
      }));
      
      toast({
        title: "Exercise moved up",
        description: "Exercise order updated within block",
      });
    }
  };

  const handleMoveExerciseInBlockDown = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise?.blockId) return;

    const blockExercises = exercises
      .filter(ex => ex.blockId === exercise.blockId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const currentIndex = blockExercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex < blockExercises.length - 1) {
      const targetExercise = blockExercises[currentIndex + 1];
      const now = Date.now();
      
      // Swap timestamps to reorder
      const updatedExercise = { ...exercise, timestamp: new Date(now - (blockExercises.length - currentIndex - 1) * 1000) };
      const updatedTarget = { ...targetExercise, timestamp: new Date(now - (blockExercises.length - currentIndex) * 1000) };
      
      setExercises(prev => prev.map(ex => {
        if (ex.id === exerciseId) return updatedExercise;
        if (ex.id === targetExercise.id) return updatedTarget;
        return ex;
      }));
      
      toast({
        title: "Exercise moved down",
        description: "Exercise order updated within block",
      });
    }
  };

  const handleGroupExercise = (exerciseId: string, blockId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updatedExercise = { ...exercise, blockId };
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? updatedExercise : ex));
    
    // Remove from layout if it was standalone
    if (!exercise.blockId) {
      setLayoutOrder(prev => prev.filter(item => !(item.type === 'exercise' && item.id === exerciseId)));
    }
    
    toast({
      title: "Exercise grouped",
      description: `Exercise moved to block`,
    });
  };

  const handleUngroupExercise = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise?.blockId) return;

    const updatedExercise = { ...exercise, blockId: undefined };
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? updatedExercise : ex));
    
    // Add to layout as standalone
    setLayoutOrder(prev => [...prev, { type: 'exercise', id: exerciseId }]);
    
    toast({
      title: "Exercise ungrouped",
      description: "Exercise moved to standalone",
    });
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
                Preview
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Edit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="flex justify-center">
              <WorkoutSession 
                exercises={exercises}
                blocks={blocks}
              />
            </TabsContent>
            
            <TabsContent value="flow" className="flex justify-center">
              <WorkoutGrid
                exercises={exercises}
                blocks={blocks}
                layoutOrder={layoutOrder}
                onRemoveExercise={handleRemoveExercise}
                onUpdateExercise={handleUpdateExercise}
                onAddBlock={handleAddBlock}
                onUpdateBlock={handleUpdateBlock}
                onRemoveBlock={handleRemoveBlock}
                onMoveItemUp={handleMoveItemUp}
                onMoveItemDown={handleMoveItemDown}
                onMoveExerciseInBlockUp={handleMoveExerciseInBlockUp}
                onMoveExerciseInBlockDown={handleMoveExerciseInBlockDown}
                onGroupExercise={handleGroupExercise}
                onUngroupExercise={handleUngroupExercise}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
