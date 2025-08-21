import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Dumbbell, Search } from 'lucide-react';
import { parseExerciseParameters, ParsedExercise } from '@/lib/exerciseParser';
import { searchExercises } from '@/lib/mockExercises';

interface ExerciseFormProps {
  onAddExercise: (exercise: ParsedExercise) => void;
}

export function ExerciseForm({ onAddExercise }: ExerciseFormProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseParams, setExerciseParams] = useState('');
  const [preview, setPreview] = useState<ParsedExercise | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleExerciseNameChange = (value: string) => {
    setExerciseName(value);
    const newSuggestions = searchExercises(value);
    setSuggestions(newSuggestions);
    setOpen(newSuggestions.length > 0 && value.length > 0);
    updatePreview(value, exerciseParams);
  };

  const handleExerciseSelect = (exercise: string) => {
    setExerciseName(exercise);
    setSuggestions([]);
    setOpen(false);
    updatePreview(exercise, exerciseParams);
  };

  const updatePreview = (name: string, params: string) => {
    if (params.trim() && name.trim()) {
      const parsedData = parseExerciseParameters(params);
      setPreview({
        id: '',
        name,
        originalInput: params,
        parsedData,
        timestamp: new Date()
      });
    } else {
      setPreview(null);
    }
  };

  const handleParametersChange = (value: string) => {
    setExerciseParams(value);
    updatePreview(exerciseName, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exerciseName.trim() || !exerciseParams.trim()) return;
    
    const parsedData = parseExerciseParameters(exerciseParams);
    const exercise: ParsedExercise = {
      id: Date.now().toString(),
      name: exerciseName,
      originalInput: exerciseParams,
      parsedData,
      timestamp: new Date()
    };
    
    onAddExercise(exercise);
    setExerciseName('');
    setExerciseParams('');
    setPreview(null);
  };

  const renderParsedBadges = (data: ParsedExercise['parsedData']) => {
    const badges = [];
    
    if (data.sets && data.reps) {
      badges.push(
        <Badge key="sets" variant="sets">
          {data.sets} × {data.reps}
        </Badge>
      );
    }
    
    if (data.progressiveWeights && data.progressiveWeights.length > 0) {
      badges.push(
        <Badge key="progressive-weights" variant="weight">
          {data.progressiveWeights.join(' → ')}
        </Badge>
      );
    } else if (data.weight) {
      badges.push(
        <Badge key="weight" variant="weight">
          {data.weight}
        </Badge>
      );
    }
    
    if (data.time) {
      badges.push(
        <Badge key="time" variant="time">
          {data.time}
        </Badge>
      );
    }
    
    if (data.distance) {
      badges.push(
        <Badge key="distance" variant="time">
          {data.distance}
        </Badge>
      );
    }
    
    if (data.restPeriod) {
      badges.push(
        <Badge key="rest" variant="secondary">
          Rest: {data.restPeriod}
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6" />
          Add Exercise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    placeholder="Exercise name (e.g., Bench Press, Running, Squats)"
                    value={exerciseName}
                    onChange={(e) => handleExerciseNameChange(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0 && exerciseName.length > 0) setOpen(true);
                    }}
                    className="text-lg pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="z-50 w-full p-0 bg-popover" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                  <CommandList>
                    <CommandEmpty>No exercises found.</CommandEmpty>
                    <CommandGroup>
                      {suggestions.map((exercise) => (
                        <CommandItem
                          key={exercise}
                          onSelect={() => handleExerciseSelect(exercise)}
                          className="cursor-pointer"
                        >
                          <Dumbbell className="mr-2 h-4 w-4" />
                          {exercise}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Input
              placeholder="Parameters (e.g., 3x10 @ 135lbs, 30 minutes, 2 miles)"
              value={exerciseParams}
              onChange={(e) => handleParametersChange(e.target.value)}
              className="text-lg"
            />
          </div>
          
          {preview && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{preview.name}</span>
                <Badge variant="outline">{preview.parsedData.type}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {renderParsedBadges(preview.parsedData)}
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="workout" 
            size="lg" 
            className="w-full"
            disabled={!exerciseName.trim() || !exerciseParams.trim()}
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </form>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <div className="font-medium mb-2">Supported formats:</div>
          <div className="space-y-1">
            <div>• <code className="text-accent">3x10 @ 135lbs</code> - Sets × Reps @ Weight</div>
            <div>• <code className="text-accent">3x10 @ 40/50/60kg</code> - Progressive weights</div>
            <div>• <code className="text-accent">3x10 @ 135lbs rest 30s</code> - With rest period</div>
            <div>• <code className="text-accent">30 minutes</code> - Time duration</div>
            <div>• <code className="text-accent">2 miles</code> - Distance</div>
            <div>• <code className="text-accent">1:30</code> - Time in MM:SS</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}