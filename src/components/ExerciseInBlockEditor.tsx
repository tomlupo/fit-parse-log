import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParsedExercise, WorkoutBlock, parseExerciseParameters } from '@/lib/exerciseParser';
import { ProgressionEditor } from './ProgressionEditor';
import { Dumbbell, TrendingUp, Settings } from 'lucide-react';

interface ProgressionData {
  roundWeights?: string[];
  roundReps?: number[];
  roundTimes?: string[];
  roundDistances?: string[];
}

interface ExerciseInBlockEditorProps {
  exercise: ParsedExercise | null;
  block: WorkoutBlock;
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: ParsedExercise) => void;
}

export function ExerciseInBlockEditor({
  exercise,
  block,
  isOpen,
  onClose,
  onSave
}: ExerciseInBlockEditorProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [originalInput, setOriginalInput] = useState('');
  const [progression, setProgression] = useState<ProgressionData>({});

  useEffect(() => {
    if (exercise) {
      setExerciseName(exercise.name);
      setOriginalInput(exercise.originalInput);
      
      // Initialize progression from existing progressive weights
      if (exercise.parsedData.progressiveWeights) {
        setProgression({
          roundWeights: exercise.parsedData.progressiveWeights
        });
      } else {
        setProgression({});
      }
    }
  }, [exercise]);

  const handleSave = () => {
    if (!exercise) return;

    // Parse the original input to get base parameters
    const parsedData = parseExerciseParameters(originalInput);
    
    // For exercises in blocks, default to 1 set since block handles rounds
    const updatedParsedData = {
      ...parsedData,
      sets: 1, // Force to 1 set for block exercises
      // Add progression data if available
      progressiveWeights: progression.roundWeights?.filter(w => w.trim()) || parsedData.progressiveWeights,
    };

    const updatedExercise: ParsedExercise = {
      ...exercise,
      name: exerciseName,
      originalInput,
      parsedData: updatedParsedData,
      // Store progression metadata for future reference
      blockProgression: progression
    };

    onSave(updatedExercise);
    onClose();
  };

  const renderCurrentParameters = () => {
    if (!exercise) return null;

    const { parsedData } = exercise;
    const badges = [];

    // Always show 1 set for block exercises
    if (parsedData.reps) {
      badges.push(
        <Badge key="sets" variant="outline" className="text-xs">
          1 × {parsedData.reps} (per round)
        </Badge>
      );
    }

    if (progression.roundWeights?.length) {
      badges.push(
        <Badge key="progressive-weights" variant="secondary" className="text-xs">
          Progressive: {progression.roundWeights.filter(w => w).join(' → ')}
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

  if (!exercise) return null;

  const parsedData = parseExerciseParameters(originalInput);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Edit Exercise in {block.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Settings
            </TabsTrigger>
            <TabsTrigger value="progression" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Round Progression
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="exercise-name">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="Exercise name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="exercise-input">Parameters</Label>
                <Textarea
                  id="exercise-input"
                  value={originalInput}
                  onChange={(e) => setOriginalInput(e.target.value)}
                  placeholder="e.g., 10 @ 135lbs, 30 seconds, 2 miles"
                  className="mt-1 min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Sets will be set to 1 since the block ({block.rounds} rounds) handles repetitions
                </p>
              </div>

              {originalInput && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Current Parameters:</Label>
                  <div className="flex flex-wrap gap-2">
                    {renderCurrentParameters()}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Block Exercise Rules:</div>
                    <div className="text-blue-700 space-y-1">
                      <div>• This exercise is part of a {block.rounds}-round {block.type}</div>
                      <div>• Sets are automatically set to 1 (block rounds handle repetition)</div>
                      <div>• Use the Progression tab to vary parameters across rounds</div>
                      <div>• Rest between exercises: {block.restBetweenExercises || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progression" className="space-y-4">
            <ProgressionEditor
              rounds={block.rounds || 1}
              exerciseType={parsedData.type}
              currentProgression={progression}
              onProgressionChange={setProgression}
              baseReps={parsedData.reps}
              baseWeight={parsedData.weight}
              baseTime={parsedData.time}
              baseDistance={parsedData.distance}
            />
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">💡 Progression Tips:</div>
                <div className="space-y-1">
                  <div>• Progressive weights: Increase load each round</div>
                  <div>• Descending reps: Start high, decrease each round</div>
                  <div>• Leave fields empty to use the same value for all rounds</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!exerciseName.trim()}>
            Save Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}