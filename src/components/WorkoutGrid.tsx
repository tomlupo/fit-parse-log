import React, { useState } from 'react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';  
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, RotateCcw, Zap, Target, Users, Plus, ChevronUp, ChevronDown, Link2Off, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExerciseInBlockEditor } from './ExerciseInBlockEditor';

// Exercise Component
function ExerciseCard({ 
  exercise, 
  onEdit, 
  onRemove, 
  onUngroup,
  onGroup,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  showGroupButton = false,
  isInBlock = false
}: { 
  exercise: ParsedExercise; 
  onEdit: (exercise: ParsedExercise) => void;
  onRemove: (id: string) => void;
  onUngroup?: (exerciseId: string) => void;
  onGroup?: (exerciseId: string) => void;
  onMoveUp: (exerciseId: string) => void;
  onMoveDown: (exerciseId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showGroupButton?: boolean;
  isInBlock?: boolean;
}) {
  const renderExerciseBadges = (exercise: ParsedExercise) => {
    const { parsedData } = exercise;
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
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-base mb-3">{exercise.name}</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {renderExerciseBadges(exercise)}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {exercise.originalInput}
            </p>
          </div>
          
          {/* Move buttons */}
          <div className="flex gap-1 ml-3">
            <Button
              variant="outline"
              onClick={() => onMoveUp(exercise.id)}
              disabled={!canMoveUp}
              className="h-11 px-4"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onMoveDown(exercise.id)}
              disabled={!canMoveDown}
              className="h-11 px-4"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Action bar */}
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => onEdit(exercise)}
            className="h-11 px-4"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {exercise.blockId && onUngroup && (
            <Button
              variant="outline"
              onClick={() => onUngroup(exercise.id)}
              className="h-11 px-4"
            >
              <Link2Off className="h-4 w-4" />
            </Button>
          )}
          {showGroupButton && onGroup && (
            <Button
              variant="outline"
              onClick={() => onGroup(exercise.id)}
              className="h-11 px-4"
            >
              <Link2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => onRemove(exercise.id)}
            className="h-11 px-4"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Block Component
function BlockCard({
  block, 
  children, 
  onEdit, 
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isEmpty = false 
}: { 
  block: WorkoutBlock; 
  children: React.ReactNode;
  onEdit: (block: WorkoutBlock) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isEmpty?: boolean;
}) {
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
    <Card className="overflow-hidden">
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
              </div>
            </div>
          </div>
          
          {/* Move buttons */}
          <div className="flex gap-1 ml-3">
            <Button
              variant="outline"
              onClick={() => onMoveUp(block.id)}
              disabled={!canMoveUp}
              className="h-11 px-4"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onMoveDown(block.id)}
              disabled={!canMoveDown}
              className="h-11 px-4"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Action bar */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            onClick={() => onEdit(block)}
            className="h-11 px-4"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={() => onRemove(block.id)}
            className="h-11 px-4"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4">
        {isEmpty ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Use group button on exercises to add them to this block
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

interface WorkoutGridProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  layoutOrder: Array<{ type: 'block' | 'exercise', id: string }>;
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (exercise: ParsedExercise) => void;
  onAddBlock: (block: WorkoutBlock) => void;
  onUpdateBlock: (block: WorkoutBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveItemUp: (itemType: 'block' | 'exercise', itemId: string) => void;
  onMoveItemDown: (itemType: 'block' | 'exercise', itemId: string) => void;
  onMoveExerciseInBlockUp: (exerciseId: string) => void;
  onMoveExerciseInBlockDown: (exerciseId: string) => void;
  onGroupExercise: (exerciseId: string, blockId: string) => void;
  onUngroupExercise: (exerciseId: string) => void;
}

export function WorkoutGrid({ 
  exercises, 
  blocks, 
  layoutOrder,
  onRemoveExercise, 
  onUpdateExercise,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveItemUp,
  onMoveItemDown,
  onMoveExerciseInBlockUp,
  onMoveExerciseInBlockDown,
  onGroupExercise,
  onUngroupExercise
}: WorkoutGridProps) {
  const { toast } = useToast();
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const [editingExercise, setEditingExercise] = useState<ParsedExercise | null>(null);
  const [editingExerciseInBlock, setEditingExerciseInBlock] = useState<{exercise: ParsedExercise, block: WorkoutBlock} | null>(null);
  const [groupingExercise, setGroupingExercise] = useState<string | null>(null);
  const [newBlockName, setNewBlockName] = useState('New Block');

  const handleAddBlock = () => {
    const newBlock: WorkoutBlock = {
      id: `block-${Date.now()}`,
      name: 'New Block',
      type: 'superset',
      exercises: [],
      rounds: 1,
      restBetweenExercises: '30s'
    };
    
    onAddBlock(newBlock);
    setEditingBlock(newBlock);
  };

  const handleExerciseEdit = (exercise: ParsedExercise) => {
    if (exercise.blockId) {
      // For exercises in blocks, use the specialized editor
      const block = blocks.find(b => b.id === exercise.blockId);
      if (block) {
        setEditingExerciseInBlock({ exercise, block });
      }
    } else {
      // For standalone exercises, use the regular editor
      setEditingExercise(exercise);
    }
  };

  const handleExerciseInBlockSave = (exercise: ParsedExercise) => {
    onUpdateExercise(exercise);
    setEditingExerciseInBlock(null);
    toast({
      title: "Exercise updated",
      description: `${exercise.name} has been updated with progression settings`,
    });
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

  const handleGroupExercise = (exerciseId: string) => {
    setGroupingExercise(exerciseId);
  };

  const handleConfirmGroup = (blockId: string) => {
    if (!groupingExercise) return;
    onGroupExercise(groupingExercise, blockId);
    setGroupingExercise(null);
    setNewBlockName('New Block');
  };

  const handleCreateNewBlockAndGroup = () => {
    if (!groupingExercise) return;
    
    const newBlock: WorkoutBlock = {
      id: `block-${Date.now()}`,
      name: newBlockName,
      type: 'superset',
      exercises: [],
      rounds: 1,
      restBetweenExercises: '30s'
    };
    
    onAddBlock(newBlock);
    onGroupExercise(groupingExercise, newBlock.id);
    setGroupingExercise(null);
    setNewBlockName('New Block');
  };

  if (exercises.length === 0) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No exercises to organize</h3>
          <p className="text-muted-foreground">
            Add some exercises first, then use the group buttons to organize them into blocks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Workout Structure</h2>
        <Button onClick={handleAddBlock} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Block
        </Button>
      </div>

      {/* Unified Layout */}
      {layoutOrder.map((item, index) => {
        if (item.type === 'block') {
          const block = blocks.find(b => b.id === item.id);
          if (!block) return null;
          
          const blockExercises = exercises.filter(ex => ex.blockId === block.id)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          return (
            <BlockCard
              key={block.id}
              block={block}
              onEdit={handleBlockEdit}
              onRemove={onRemoveBlock}
              onMoveUp={(id) => onMoveItemUp('block', id)}
              onMoveDown={(id) => onMoveItemDown('block', id)}
              canMoveUp={index > 0}
              canMoveDown={index < layoutOrder.length - 1}
              isEmpty={blockExercises.length === 0}
            >
              <div className="space-y-3">
                {blockExercises.map((exercise, exerciseIndex) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleExerciseEdit}
                    onRemove={onRemoveExercise}
                    onUngroup={onUngroupExercise}
                    onMoveUp={onMoveExerciseInBlockUp}
                    onMoveDown={onMoveExerciseInBlockDown}
                    canMoveUp={exerciseIndex > 0}
                    canMoveDown={exerciseIndex < blockExercises.length - 1}
                    isInBlock={true}
                  />
                ))}
              </div>
            </BlockCard>
          );
        } else {
          // Standalone exercise
          const exercise = exercises.find(ex => ex.id === item.id);
          if (!exercise || exercise.blockId) return null;
          
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={handleExerciseEdit}
              onRemove={onRemoveExercise}
              onGroup={handleGroupExercise}
              onMoveUp={(id) => onMoveItemUp('exercise', id)}
              onMoveDown={(id) => onMoveItemDown('exercise', id)}
              canMoveUp={index > 0}
              canMoveDown={index < layoutOrder.length - 1}
              showGroupButton={true}
            />
          );
        }
      })}

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <div className="font-medium mb-2">How to use:</div>
        <div className="space-y-1">
          <div>• Use up/down arrows to reorder items</div>
          <div>• Use "Group" button on standalone exercises to add them to blocks</div>
          <div>• Use "Ungroup" button to remove exercises from blocks</div>
          <div>• Use "Add Block" button to create new blocks</div>
          <div>• Use edit button to modify exercise or block parameters</div>
        </div>
      </div>

      {/* Grouping Dialog */}
      <Dialog open={!!groupingExercise} onOpenChange={() => setGroupingExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Choose an existing block or create a new one:</Label>
            </div>
            
            {blocks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Blocks:</Label>
                <div className="grid gap-2">
                  {blocks.map(block => (
                    <Button
                      key={block.id}
                      variant="outline"
                      onClick={() => handleConfirmGroup(block.id)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex items-center gap-2">
                        {block.type === 'round' && <RotateCcw className="h-4 w-4" />}
                        {block.type === 'superset' && <Zap className="h-4 w-4" />}
                        {block.type === 'circuit' && <Target className="h-4 w-4" />}
                        <div className="text-left">
                          <div className="font-medium">{block.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {block.type} • {exercises.filter(ex => ex.blockId === block.id).length} exercises
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Create New Block:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Block name"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                />
                <Button onClick={handleCreateNewBlockAndGroup}>
                  Create & Group
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Exercise in Block Edit Dialog */}
      <ExerciseInBlockEditor
        exercise={editingExerciseInBlock?.exercise || null}
        block={editingExerciseInBlock?.block || { id: '', name: '', type: 'superset', exercises: [] }}
        isOpen={!!editingExerciseInBlock}
        onClose={() => setEditingExerciseInBlock(null)}
        onSave={handleExerciseInBlockSave}
      />
    </div>
  );
}