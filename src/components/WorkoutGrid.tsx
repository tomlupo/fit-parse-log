import React, { useState, useCallback } from 'react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Clock, Edit, RotateCcw, Zap, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkoutGridProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (exercise: ParsedExercise) => void;
  onAddBlock: (block: WorkoutBlock) => void;
  onUpdateBlock: (block: WorkoutBlock) => void;
  onRemoveBlock: (id: string) => void;
}

export function WorkoutGrid({ 
  exercises, 
  blocks, 
  onRemoveExercise, 
  onUpdateExercise,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock
}: WorkoutGridProps) {
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<'exercise' | 'block' | 'reorder' | null>(null);
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const [editingExercise, setEditingExercise] = useState<ParsedExercise | null>(null);

  // Get exercises not in any block
  const unassignedExercises = exercises.filter(ex => !ex.blockId);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'round':
        return <RotateCcw className="h-4 w-4" />;
      case 'superset':
        return <Zap className="h-4 w-4" />;
      case 'circuit':
        return <Target className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    setDraggedId(itemId);
    setDragPosition({ 
      x: rect.left, 
      y: rect.top 
    });
    
    // Prevent scrolling and text selection
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.touchAction = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggedId) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    setDragPosition({
      x: touch.clientX - 50, // Center the card on finger
      y: touch.clientY - 50
    });

    // Find what's under the finger
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropElement = elementBelow?.closest('[data-drop-target]');
    const targetId = dropElement?.getAttribute('data-drop-target');
    const zone = dropElement?.getAttribute('data-drop-zone') as 'exercise' | 'block' | 'reorder' | null;
    
    setDropTarget(targetId && targetId !== draggedId ? targetId : null);
    setDropZone(zone);
  }, [draggedId]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!draggedId) return;
    
    e.preventDefault();
    
    // Restore scrolling and text selection
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.touchAction = '';

    if (dropTarget && draggedId !== dropTarget) {
      handleDrop(draggedId, dropTarget, dropZone);
    }

    setDraggedId(null);
    setDropTarget(null);
    setDropZone(null);
    setDragPosition({ x: 0, y: 0 });
  }, [draggedId, dropTarget]);

  const handleDrop = (draggedId: string, targetId: string, zone: 'exercise' | 'block' | 'reorder' | null) => {
    const draggedExercise = exercises.find(ex => ex.id === draggedId);
    const targetExercise = exercises.find(ex => ex.id === targetId);
    const targetBlock = blocks.find(block => block.id === targetId);
    const draggedBlock = blocks.find(block => block.id === draggedId);

    // Case 1: Reordering exercises within the same block or in unassigned area
    if (zone === 'reorder' && draggedExercise && targetExercise) {
      const draggedBlockId = draggedExercise.blockId;
      const targetBlockId = targetExercise.blockId;
      
      // Allow reordering within same context OR moving between unassigned and blocks
      if (draggedBlockId === targetBlockId) {
        // Same context - reorder within
        const contextExercises = exercises.filter(ex => ex.blockId === draggedBlockId);
        const draggedIndex = contextExercises.findIndex(ex => ex.id === draggedId);
        const targetIndex = contextExercises.findIndex(ex => ex.id === targetId);
        
        // Reorder by updating timestamps to maintain order
        const now = Date.now();
        const updatedExercises = [...contextExercises];
        
        // Remove dragged exercise and insert at target position
        const [removed] = updatedExercises.splice(draggedIndex, 1);
        updatedExercises.splice(targetIndex, 0, removed);
        
        // Update timestamps to maintain new order
        updatedExercises.forEach((exercise, index) => {
          const updatedExercise = { 
            ...exercise, 
            timestamp: new Date(now - (updatedExercises.length - index) * 1000) 
          };
          onUpdateExercise(updatedExercise);
        });

        toast({
          title: "Exercise reordered",
          description: `${draggedExercise.name} has been moved`,
        });
        return;
      } else {
        // Different contexts - move exercise to target's context and reorder
        const targetContext = exercises.filter(ex => ex.blockId === targetBlockId);
        const targetIndex = targetContext.findIndex(ex => ex.id === targetId);
        
        // Update dragged exercise to be in target's context
        const now = Date.now();
        const newTimestamp = targetIndex === 0 
          ? new Date(now + 1000) // Place before first
          : new Date(targetContext[targetIndex].timestamp.getTime() + 500); // Place after target
        
        onUpdateExercise({ 
          ...draggedExercise, 
          blockId: targetBlockId,
          timestamp: newTimestamp
        });

        // If moving from block to unassigned, update the block's exercises array
        if (draggedBlockId) {
          const draggedBlock = blocks.find(b => b.id === draggedBlockId);
          if (draggedBlock) {
            const updatedBlock = {
              ...draggedBlock,
              exercises: draggedBlock.exercises.filter(id => id !== draggedId)
            };
            onUpdateBlock(updatedBlock);
          }
        }

        // If moving to a block, update the block's exercises array
        if (targetBlockId) {
          const targetBlock = blocks.find(b => b.id === targetBlockId);
          if (targetBlock) {
            const updatedBlock = {
              ...targetBlock,
              exercises: [...targetBlock.exercises, draggedId]
            };
            onUpdateBlock(updatedBlock);
          }
        }

        toast({
          title: "Exercise moved",
          description: `${draggedExercise.name} moved to ${targetBlockId ? blocks.find(b => b.id === targetBlockId)?.name : 'individual exercises'}`,
        });
        return;
      }
    }
    
    // Case 2: Block reordering
    if (zone === 'reorder' && draggedBlock && targetBlock) {
      // Handle block reordering logic here if needed
      toast({
        title: "Block reordered",
        description: `${draggedBlock.name} has been moved`,
      });
      return;
    }

    if (!draggedExercise) return;

    // Case 3: Dragging exercise onto another exercise - create new block
    if (targetExercise && !targetExercise.blockId && zone === 'exercise') {
      const newBlock: WorkoutBlock = {
        id: Date.now().toString(),
        name: `${draggedExercise.name} + ${targetExercise.name}`,
        type: 'round',
        exercises: [targetExercise.id, draggedExercise.id],
        rounds: 3
      };

      onAddBlock(newBlock);
      
      // Update both exercises to be in the new block
      onUpdateExercise({ ...targetExercise, blockId: newBlock.id });
      onUpdateExercise({ ...draggedExercise, blockId: newBlock.id });

      toast({
        title: "Block created",
        description: `Created "${newBlock.name}" with 2 exercises`,
      });
    }
    // Case 4: Dragging exercise onto existing block
    else if (targetBlock && zone === 'block') {
      const updatedBlock = {
        ...targetBlock,
        exercises: [...targetBlock.exercises, draggedExercise.id]
      };
      
      onUpdateBlock(updatedBlock);
      onUpdateExercise({ ...draggedExercise, blockId: targetBlock.id });

      toast({
        title: "Exercise added to block",
        description: `${draggedExercise.name} added to ${targetBlock.name}`,
      });
    }
  };

  const handleExerciseEdit = (exercise: ParsedExercise) => {
    setEditingExercise(exercise);
  };

  const handleBlockEdit = (block: WorkoutBlock) => {
    setEditingBlock(block);
  };

  const handleExerciseSave = () => {
    if (!editingExercise) return;
    onUpdateExercise(editingExercise);
    setEditingExercise(null);
    toast({
      title: "Exercise updated",
      description: `${editingExercise.name} has been updated`,
    });
  };

  const handleBlockSave = () => {
    if (!editingBlock) return;
    onUpdateBlock(editingBlock);
    setEditingBlock(null);
    toast({
      title: "Block updated",
      description: `${editingBlock.name} has been updated`,
    });
  };

  const renderExerciseBadges = (exercise: ParsedExercise) => {
    const { parsedData } = exercise;
    const badges = [];
    
    if (parsedData.sets && parsedData.reps) {
      badges.push(
        <Badge key="sets" variant="outline" className="text-xs">
          {parsedData.sets} × {parsedData.reps}
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
    
    if (parsedData.restPeriod) {
      badges.push(
        <Badge key="rest" variant="outline" className="text-xs">
          Rest: {parsedData.restPeriod}
        </Badge>
      );
    }
    
    return badges;
  };

  if (exercises.length === 0) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No exercises to organize</h3>
          <p className="text-muted-foreground">
            Add some exercises first, then drag them together to create blocks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full max-w-6xl space-y-6" style={{ touchAction: 'manipulation' }}>
        {/* Blocks */}
        {blocks.map(block => {
          const blockExercises = exercises.filter(ex => ex.blockId === block.id);
          const isDropTarget = dropTarget === block.id;
          
          return (
            <Card 
              key={block.id}
              className={`p-4 transition-all duration-200 ${
                dropTarget === block.id && dropZone === 'block' ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              data-drop-target={block.id}
              data-drop-zone="block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getBlockIcon(block.type)}
                  <h3 className="font-semibold">{block.name}</h3>
                  <Badge variant="outline">{block.type}</Badge>
                  {block.rounds && (
                    <Badge variant="secondary">{block.rounds} rounds</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleBlockEdit(block)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {blockExercises.map(exercise => {
                  const isDragged = draggedId === exercise.id;
                  
                  return (
                    <Card 
                      key={exercise.id}
                      className={`touch-manipulation select-none transition-all duration-200 ${
                        isDragged ? 'opacity-30' : 'active:scale-95'
                      } ${dropTarget === exercise.id && dropZone === 'reorder' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                      style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        touchAction: 'none'
                      }}
                      onTouchStart={(e) => handleTouchStart(e, exercise.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      data-drop-target={exercise.id}
                      data-drop-zone="reorder"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExerciseEdit(exercise)}
                              className="h-6 w-6"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveExercise(exercise.id)}
                              className="h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {renderExerciseBadges(exercise)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(exercise.timestamp)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {/* Unassigned Exercises */}
        {unassignedExercises.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unassignedExercises.map(exercise => {
                const isDragged = draggedId === exercise.id;
                const isDropTarget = dropTarget === exercise.id;
                
                return (
                  <Card 
                    key={exercise.id}
                    className={`touch-manipulation select-none transition-all duration-200 ${
                      isDragged ? 'opacity-30' : ''
                    } ${dropTarget === exercise.id && (dropZone === 'exercise' || dropZone === 'reorder') ? 'ring-2 ring-primary bg-primary/5' : 'active:scale-95'}`}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      touchAction: 'none'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, exercise.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                     data-drop-target={exercise.id}
                     data-drop-zone="reorder"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExerciseEdit(exercise)}
                            className="h-6 w-6"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveExercise(exercise.id)}
                            className="h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {renderExerciseBadges(exercise)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(exercise.timestamp)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Dragged Item */}
        {draggedId && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: dragPosition.x,
              top: dragPosition.y,
              transform: 'rotate(5deg) scale(0.9)',
              transition: 'none'
            }}
          >
            <Card className="opacity-80 shadow-2xl">
              <CardContent className="p-4">
                <h4 className="font-medium">
                  {exercises.find(ex => ex.id === draggedId)?.name}
                </h4>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <div className="font-medium mb-2">How to use:</div>
          <div className="space-y-1">
            <div>• Press and hold an exercise to start dragging</div>
            <div>• Drag onto another exercise to create a block</div>
            <div>• Drag onto existing blocks to add exercises</div>
            <div>• Drag within same context to reorder</div>
            <div>• Tap edit button to modify exercise or block parameters</div>
          </div>
        </div>
      </div>

      {/* Block Edit Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="blockName">Block Name</Label>
                <Input
                  id="blockName"
                  value={editingBlock.name}
                  onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="blockType">Block Type</Label>
                <Select 
                  value={editingBlock.type} 
                  onValueChange={(value: any) => setEditingBlock({ ...editingBlock, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Round - Multiple rounds of exercises
                      </div>
                    </SelectItem>
                    <SelectItem value="superset">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Superset - Back-to-back exercises
                      </div>
                    </SelectItem>
                    <SelectItem value="circuit">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Circuit - Timed rotations
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rounds">Rounds</Label>
                  <Input
                    id="rounds"
                    type="number"
                    value={editingBlock.rounds || ''}
                    onChange={(e) => setEditingBlock({ 
                      ...editingBlock, 
                      rounds: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="rest">Rest Between</Label>
                  <Input
                    id="rest"
                    placeholder="30s, 1min"
                    value={editingBlock.restBetweenExercises || ''}
                    onChange={(e) => setEditingBlock({ 
                      ...editingBlock, 
                      restBetweenExercises: e.target.value || undefined 
                    })}
                  />
                </div>
              </div>
              
              <Button onClick={handleBlockSave} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Edit Dialog */}
      <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          {editingExercise && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <Input
                  id="exerciseName"
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={editingExercise.parsedData.sets || ''}
                    onChange={(e) => setEditingExercise({ 
                      ...editingExercise, 
                      parsedData: { 
                        ...editingExercise.parsedData, 
                        sets: e.target.value ? parseInt(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    value={editingExercise.parsedData.reps || ''}
                    onChange={(e) => setEditingExercise({ 
                      ...editingExercise, 
                      parsedData: { 
                        ...editingExercise.parsedData, 
                        reps: e.target.value ? parseInt(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  placeholder="e.g., 135lbs, 60kg"
                  value={editingExercise.parsedData.weight || ''}
                  onChange={(e) => setEditingExercise({ 
                    ...editingExercise, 
                    parsedData: { 
                      ...editingExercise.parsedData, 
                      weight: e.target.value || undefined 
                    }
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  placeholder="e.g., 30s, 2min, 1:30"
                  value={editingExercise.parsedData.time || ''}
                  onChange={(e) => setEditingExercise({ 
                    ...editingExercise, 
                    parsedData: { 
                      ...editingExercise.parsedData, 
                      time: e.target.value || undefined 
                    }
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="distance">Distance</Label>
                <Input
                  id="distance"
                  placeholder="e.g., 5km, 2 miles"
                  value={editingExercise.parsedData.distance || ''}
                  onChange={(e) => setEditingExercise({ 
                    ...editingExercise, 
                    parsedData: { 
                      ...editingExercise.parsedData, 
                      distance: e.target.value || undefined 
                    }
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="rest">Rest Period</Label>
                <Input
                  id="rest"
                  placeholder="e.g., 30s, 1min"
                  value={editingExercise.parsedData.restPeriod || ''}
                  onChange={(e) => setEditingExercise({ 
                    ...editingExercise, 
                    parsedData: { 
                      ...editingExercise.parsedData, 
                      restPeriod: e.target.value || undefined 
                    }
                  })}
                />
              </div>
              
              <Button onClick={handleExerciseSave} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}