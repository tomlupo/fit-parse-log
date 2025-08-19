import React, { useState, useRef, useCallback } from 'react';
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

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  dragOffset: { x: number; y: number };
  dropTarget: string | null;
  startTime: number;
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    dragOffset: { x: 0, y: 0 },
    dropTarget: null,
    startTime: 0
  });
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

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

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.touchAction = 'none';
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    
    dragRef.current = {
      startX: clientX - rect.left,
      startY: clientY - rect.top
    };
    
    setDragState({
      isDragging: true,
      draggedId: itemId,
      dragOffset: { x: rect.left, y: rect.top },
      dropTarget: null,
      startTime: Date.now()
    });
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragRef.current) return;

    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState(prev => ({
      ...prev,
      dragOffset: {
        x: clientX - dragRef.current!.startX,
        y: clientY - dragRef.current!.startY
      }
    }));

    // Find drop target
    const elements = document.elementsFromPoint(clientX, clientY);
    const dropElement = elements.find(el => 
      el.getAttribute('data-drop-target') && 
      el.getAttribute('data-drop-target') !== dragState.draggedId
    );
    
    setDragState(prev => ({
      ...prev,
      dropTarget: dropElement?.getAttribute('data-drop-target') || null
    }));
  }, [dragState.isDragging, dragState.draggedId]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.touchAction = '';

    const dragDuration = Date.now() - dragState.startTime;
    
    // Only process drop if it was a drag (not a tap) and has a drop target
    if (dragDuration > 150 && dragState.dropTarget && dragState.draggedId && dragState.dropTarget !== dragState.draggedId) {
      handleDrop(dragState.draggedId, dragState.dropTarget);
    }

    setDragState({
      isDragging: false,
      draggedId: null,
      dragOffset: { x: 0, y: 0 },
      dropTarget: null,
      startTime: 0
    });
    dragRef.current = null;
  }, [dragState]);

  React.useEffect(() => {
    if (dragState.isDragging) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.touchAction = '';
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const handleDrop = (draggedId: string, targetId: string) => {
    const draggedExercise = exercises.find(ex => ex.id === draggedId);
    const targetExercise = exercises.find(ex => ex.id === targetId);
    const targetBlock = blocks.find(block => block.id === targetId);

    if (!draggedExercise) return;

    // Case 1: Dragging exercise onto another exercise - create new block
    if (targetExercise && !targetExercise.blockId) {
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
    // Case 2: Dragging exercise onto existing block
    else if (targetBlock) {
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

  const handleBlockEdit = (block: WorkoutBlock) => {
    setEditingBlock(block);
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
      <div className="w-full max-w-6xl space-y-6">
        {/* Blocks */}
        {blocks.map(block => {
          const blockExercises = exercises.filter(ex => ex.blockId === block.id);
          const isDropTarget = dragState.dropTarget === block.id;
          
          return (
            <Card 
              key={block.id}
              className={`p-4 transition-all duration-200 ${
                isDropTarget ? 'ring-2 ring-primary scale-105' : ''
              }`}
              data-drop-target={block.id}
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
                  const isDragged = dragState.draggedId === exercise.id;
                  
                  return (
                    <Card 
                      key={exercise.id}
                      className={`select-none cursor-grab active:cursor-grabbing transition-all duration-200 ${
                        isDragged ? 'opacity-50 scale-95 z-50' : 'hover:scale-105'
                      }`}
                      style={isDragged ? {
                        position: 'fixed',
                        left: dragState.dragOffset.x,
                        top: dragState.dragOffset.y,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        transform: 'rotate(5deg)'
                      } : {}}
                      onMouseDown={(e) => handleDragStart(e, exercise.id)}
                      onTouchStart={(e) => handleDragStart(e, exercise.id)}
                      data-drop-target={exercise.id}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveExercise(exercise.id)}
                            className="h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
                const isDragged = dragState.draggedId === exercise.id;
                const isDropTarget = dragState.dropTarget === exercise.id;
                
                return (
                  <Card 
                    key={exercise.id}
                    className={`select-none cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      isDragged ? 'opacity-50 scale-95 z-50' : ''
                    } ${isDropTarget ? 'ring-2 ring-primary scale-105' : 'hover:scale-105'}`}
                    style={isDragged ? {
                      position: 'fixed',
                      left: dragState.dragOffset.x,
                      top: dragState.dragOffset.y,
                      zIndex: 1000,
                      pointerEvents: 'none',
                      transform: 'rotate(5deg)'
                    } : {}}
                    onMouseDown={(e) => handleDragStart(e, exercise.id)}
                    onTouchStart={(e) => handleDragStart(e, exercise.id)}
                    data-drop-target={exercise.id}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveExercise(exercise.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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

        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <div className="font-medium mb-2">How to use:</div>
          <div className="space-y-1">
            <div>• Drag one exercise onto another to create a block</div>
            <div>• Drag exercises onto existing blocks to add them</div>
            <div>• Click the edit button on blocks to modify parameters</div>
            <div>• Remove exercises or blocks with the trash button</div>
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
    </>
  );
}