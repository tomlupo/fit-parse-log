import React, { useState, useMemo } from 'react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';  
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Clock, Edit, RotateCcw, Zap, Target, Users, GripVertical, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDndMonitor,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkoutGridProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (exercise: ParsedExercise) => void;
  onAddBlock: (block: WorkoutBlock) => void;
  onUpdateBlock: (block: WorkoutBlock) => void;
  onRemoveBlock: (id: string) => void;
}

// Sortable Exercise Component
function SortableExercise({ exercise, onEdit, onRemove }: { 
  exercise: ParsedExercise; 
  onEdit: (exercise: ParsedExercise) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="drag-handle"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(exercise)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(exercise.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <h4 className="font-medium text-sm">{exercise.name}</h4>
          </div>
          <button
            {...attributes}
            {...listeners}
            className="drag-grip cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-lg touch-none flex-shrink-0"
          >
            <GripVertical className="h-8 w-8 text-muted-foreground" />
          </button>
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
}

// Droppable Block Container
function DroppableBlock({ 
  block, 
  children, 
  onEdit, 
  onRemove,
  isEmpty = false 
}: { 
  block: WorkoutBlock; 
  children: React.ReactNode;
  onEdit: (block: WorkoutBlock) => void;
  onRemove: (id: string) => void;
  isEmpty?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.id}`,
    data: { type: 'block', blockId: block.id }
  });

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

  return (
    <Card 
      ref={setNodeRef}
      className={`p-4 transition-all ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
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
            onClick={() => onEdit(block)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(block.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isEmpty ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Drag exercises here to group them
          </p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
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
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const [editingExercise, setEditingExercise] = useState<ParsedExercise | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Create containers with ordered items
  const containers = useMemo(() => {
    const result: Record<string, string[]> = {
      unassigned: exercises
        .filter(ex => !ex.blockId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(ex => ex.id)
    };

    blocks.forEach(block => {
      result[`block-${block.id}`] = exercises
        .filter(ex => ex.blockId === block.id)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(ex => ex.id);
    });

    return result;
  }, [exercises, blocks]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string): string | null => {
    if (containers.unassigned.includes(id)) return 'unassigned';
    
    for (const [containerId, items] of Object.entries(containers)) {
      if (items.includes(id)) return containerId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = over.data.current?.type === 'block' 
      ? over.id as string
      : findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move between containers
    const activeExercise = exercises.find(ex => ex.id === activeId);
    if (!activeExercise) return;

    const targetBlockId = overContainer === 'unassigned' ? undefined : overContainer.replace('block-', '');
    const updatedExercise = { ...activeExercise, blockId: targetBlockId };
    onUpdateExercise(updatedExercise);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = over.data.current?.type === 'block' 
      ? over.id as string
      : findContainer(overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // Reorder within same container
      const containerItems = containers[activeContainer];
      const oldIndex = containerItems.indexOf(activeId);
      const newIndex = containerItems.indexOf(overId);

      if (oldIndex !== newIndex) {
        const reorderedItems = arrayMove(containerItems, oldIndex, newIndex);
        
        // Update timestamps to maintain order
        const now = Date.now();
        reorderedItems.forEach((exerciseId, index) => {
          const exercise = exercises.find(ex => ex.id === exerciseId);
          if (exercise) {
            const updatedExercise = { 
              ...exercise, 
              timestamp: new Date(now - (reorderedItems.length - index) * 1000) 
            };
            onUpdateExercise(updatedExercise);
          }
        });

        toast({
          title: "Exercise reordered",
          description: "Exercise order updated",
        });
      }
    }
  };

  const activeExercise = exercises.find(ex => ex.id === activeId);


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
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-6xl space-y-6">
        {/* Blocks */}
        {blocks.map(block => {
          const blockExercises = exercises.filter(ex => ex.blockId === block.id)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          const containerId = `block-${block.id}`;
          
          return (
            <DroppableBlock
              key={block.id}
              block={block}
              onEdit={handleBlockEdit}
              onRemove={onRemoveBlock}
              isEmpty={blockExercises.length === 0}
            >
              <SortableContext items={containers[containerId] || []} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {blockExercises.map(exercise => (
                    <SortableExercise
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={handleExerciseEdit}
                      onRemove={onRemoveExercise}
                    />
                  ))}
                </div>
              </SortableContext>
            </DroppableBlock>
          );
        })}

        {/* Unassigned Exercises */}
        {containers.unassigned.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises</h3>
            <SortableContext items={containers.unassigned} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {containers.unassigned.map(exerciseId => {
                  const exercise = exercises.find(ex => ex.id === exerciseId);
                  return exercise ? (
                    <SortableExercise
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={handleExerciseEdit}
                      onRemove={onRemoveExercise}
                    />
                  ) : null;
                })}
              </div>
            </SortableContext>
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <div className="font-medium mb-2">How to use:</div>
          <div className="space-y-1">
            <div>• Drag exercises by their grip handles to reorder</div>
            <div>• Drag exercises into blocks to group them</div>
            <div>• Tap edit button to modify exercise parameters</div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeExercise ? (
          <Card className="opacity-90 rotate-3 scale-105 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">{activeExercise.name}</h4>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
}