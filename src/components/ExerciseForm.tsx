import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Dumbbell } from 'lucide-react';

export interface ParsedExercise {
  id: string;
  name: string;
  originalInput: string;
  parsedData: {
    sets?: number;
    reps?: number;
    weight?: string;
    time?: string;
    distance?: string;
    type: 'strength' | 'cardio' | 'time' | 'unknown';
  };
  timestamp: Date;
}

interface ExerciseFormProps {
  onAddExercise: (exercise: ParsedExercise) => void;
}

export function ExerciseForm({ onAddExercise }: ExerciseFormProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseParams, setExerciseParams] = useState('');
  const [preview, setPreview] = useState<ParsedExercise | null>(null);

  const parseExerciseParameters = (input: string): ParsedExercise['parsedData'] => {
    const cleanInput = input.toLowerCase().trim();
    
    // Pattern for sets x reps @ weight (e.g., "3x10 @ 135lbs", "4 x 8 @ 185")
    const strengthPattern = /(\d+)\s*x\s*(\d+)(?:\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?))?/i;
    
    // Pattern for time (e.g., "30 seconds", "5 minutes", "1:30", "2.5 min")
    const timePattern = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)|(\d+):(\d+)/i;
    
    // Pattern for distance (e.g., "2 miles", "5km", "100m")
    const distancePattern = /(\d+(?:\.\d+)?)\s*(miles?|km|kilometers?|meters?|m|yards?|yds?)/i;
    
    // Pattern for just weight (e.g., "135lbs", "60kg")
    const weightPattern = /(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?)/i;
    
    // Pattern for just sets x reps (e.g., "3x10", "4 x 8")
    const setsRepsPattern = /(\d+)\s*x\s*(\d+)/i;

    let type: ParsedExercise['parsedData']['type'] = 'unknown';
    let sets, reps, weight, time, distance;

    if (strengthPattern.test(cleanInput)) {
      const match = cleanInput.match(strengthPattern);
      if (match) {
        sets = parseInt(match[1]);
        reps = parseInt(match[2]);
        if (match[3] && match[4]) {
          weight = `${match[3]} ${match[4]}`;
        }
        type = 'strength';
      }
    } else if (timePattern.test(cleanInput)) {
      const match = cleanInput.match(timePattern);
      if (match) {
        if (match[3] && match[4]) {
          // Time in MM:SS format
          time = `${match[3]}:${match[4]}`;
        } else if (match[1] && match[2]) {
          time = `${match[1]} ${match[2]}`;
        }
        type = 'time';
      }
    } else if (distancePattern.test(cleanInput)) {
      const match = cleanInput.match(distancePattern);
      if (match) {
        distance = `${match[1]} ${match[2]}`;
        type = 'cardio';
      }
    } else if (setsRepsPattern.test(cleanInput)) {
      const match = cleanInput.match(setsRepsPattern);
      if (match) {
        sets = parseInt(match[1]);
        reps = parseInt(match[2]);
        type = 'strength';
      }
    } else if (weightPattern.test(cleanInput)) {
      const match = cleanInput.match(weightPattern);
      if (match) {
        weight = `${match[1]} ${match[2]}`;
        type = 'strength';
      }
    }

    return {
      sets,
      reps,
      weight,
      time,
      distance,
      type
    };
  };

  const handleParametersChange = (value: string) => {
    setExerciseParams(value);
    
    if (value.trim() && exerciseName.trim()) {
      const parsedData = parseExerciseParameters(value);
      setPreview({
        id: '',
        name: exerciseName,
        originalInput: value,
        parsedData,
        timestamp: new Date()
      });
    } else {
      setPreview(null);
    }
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
    
    if (data.weight) {
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
            <Input
              placeholder="Exercise name (e.g., Bench Press, Running, Squats)"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="text-lg"
            />
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
            <div>• <code className="text-accent">30 minutes</code> - Time duration</div>
            <div>• <code className="text-accent">2 miles</code> - Distance</div>
            <div>• <code className="text-accent">1:30</code> - Time in MM:SS</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}