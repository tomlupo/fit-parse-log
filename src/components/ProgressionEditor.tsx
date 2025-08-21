import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, TrendingUp } from 'lucide-react';

interface ProgressionData {
  roundWeights?: string[];
  roundReps?: number[];
  roundTimes?: string[];
  roundDistances?: string[];
}

interface ProgressionEditorProps {
  rounds: number;
  exerciseType: 'strength' | 'cardio' | 'time' | 'unknown';
  currentProgression?: ProgressionData;
  onProgressionChange: (progression: ProgressionData) => void;
  baseReps?: number;
  baseWeight?: string;
  baseTime?: string;
  baseDistance?: string;
}

export function ProgressionEditor({
  rounds,
  exerciseType,
  currentProgression,
  onProgressionChange,
  baseReps,
  baseWeight,
  baseTime,
  baseDistance
}: ProgressionEditorProps) {
  const [progression, setProgression] = useState<ProgressionData>(
    currentProgression || {}
  );

  useEffect(() => {
    setProgression(currentProgression || {});
  }, [currentProgression]);

  const handleProgressionUpdate = (newProgression: ProgressionData) => {
    setProgression(newProgression);
    onProgressionChange(newProgression);
  };

  const updateRoundWeight = (roundIndex: number, weight: string) => {
    const newWeights = [...(progression.roundWeights || Array(rounds).fill(''))];
    newWeights[roundIndex] = weight;
    handleProgressionUpdate({ ...progression, roundWeights: newWeights });
  };

  const updateRoundReps = (roundIndex: number, reps: number) => {
    const newReps = [...(progression.roundReps || Array(rounds).fill(baseReps || 0))];
    newReps[roundIndex] = reps;
    handleProgressionUpdate({ ...progression, roundReps: newReps });
  };

  const updateRoundTime = (roundIndex: number, time: string) => {
    const newTimes = [...(progression.roundTimes || Array(rounds).fill(''))];
    newTimes[roundIndex] = time;
    handleProgressionUpdate({ ...progression, roundTimes: newTimes });
  };

  const updateRoundDistance = (roundIndex: number, distance: string) => {
    const newDistances = [...(progression.roundDistances || Array(rounds).fill(''))];
    newDistances[roundIndex] = distance;
    handleProgressionUpdate({ ...progression, roundDistances: newDistances });
  };

  const fillProgressiveWeights = () => {
    if (!baseWeight) return;
    
    const match = baseWeight.match(/(\d+(?:\.\d+)?)\s*(lbs?|kg)/i);
    if (!match) return;
    
    const baseValue = parseFloat(match[1]);
    const unit = match[2];
    const increment = exerciseType === 'strength' ? (unit.toLowerCase().includes('lb') ? 10 : 5) : 0;
    
    const newWeights = Array(rounds).fill('').map((_, index) => 
      `${baseValue + (increment * index)}${unit}`
    );
    
    handleProgressionUpdate({ ...progression, roundWeights: newWeights });
  };

  const fillProgressiveReps = () => {
    if (!baseReps) return;
    
    const newReps = Array(rounds).fill(0).map((_, index) => 
      Math.max(1, baseReps - index) // Decrease reps each round but never go below 1
    );
    
    handleProgressionUpdate({ ...progression, roundReps: newReps });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Round Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strength exercise progression */}
        {exerciseType === 'strength' && (
          <>
            {/* Weight progression */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Weight per Round</Label>
                {baseWeight && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fillProgressiveWeights}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Auto Fill (+{baseWeight.includes('lb') ? '10lbs' : '5kg'})
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array(rounds).fill('').map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Round {index + 1}</Label>
                    <Input
                      placeholder={baseWeight || "135lbs"}
                      value={progression.roundWeights?.[index] || ''}
                      onChange={(e) => updateRoundWeight(index, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Reps progression */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Reps per Round</Label>
                {baseReps && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fillProgressiveReps}
                    className="text-xs h-7"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Descending ({baseReps}, {baseReps-1}, ...)
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array(rounds).fill(0).map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">R{index + 1}</Label>
                    <Input
                      type="number"
                      placeholder={baseReps?.toString() || "10"}
                      value={progression.roundReps?.[index] || ''}
                      onChange={(e) => updateRoundReps(index, parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Time-based exercise progression */}
        {exerciseType === 'time' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time per Round</Label>
            <div className="grid grid-cols-2 gap-2">
              {Array(rounds).fill('').map((_, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Round {index + 1}</Label>
                  <Input
                    placeholder={baseTime || "30s"}
                    value={progression.roundTimes?.[index] || ''}
                    onChange={(e) => updateRoundTime(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cardio exercise progression */}
        {exerciseType === 'cardio' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Distance per Round</Label>
            <div className="grid grid-cols-2 gap-2">
              {Array(rounds).fill('').map((_, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Round {index + 1}</Label>
                  <Input
                    placeholder={baseDistance || "1 mile"}
                    value={progression.roundDistances?.[index] || ''}
                    onChange={(e) => updateRoundDistance(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {(progression.roundWeights?.some(w => w) || 
          progression.roundReps?.some(r => r > 0) ||
          progression.roundTimes?.some(t => t) ||
          progression.roundDistances?.some(d => d)) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Preview:</Label>
            <div className="flex flex-wrap gap-1">
              {Array(rounds).fill('').map((_, index) => {
                const roundData = [];
                if (progression.roundReps?.[index]) roundData.push(`${progression.roundReps[index]} reps`);
                if (progression.roundWeights?.[index]) roundData.push(progression.roundWeights[index]);
                if (progression.roundTimes?.[index]) roundData.push(progression.roundTimes[index]);
                if (progression.roundDistances?.[index]) roundData.push(progression.roundDistances[index]);
                
                return roundData.length > 0 ? (
                  <Badge key={index} variant="outline" className="text-xs">
                    R{index + 1}: {roundData.join(' @ ')}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}