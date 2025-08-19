import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Clock } from 'lucide-react';
import { ParsedExercise } from '@/lib/exerciseParser';

interface ExerciseNodeData {
  exercise: ParsedExercise;
  onRemove: (id: string) => void;
}

function ExerciseNode({ data }: { data: ExerciseNodeData }) {
  const { exercise, onRemove } = data;
  const { parsedData } = exercise;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderParsedBadges = () => {
    const badges = [];
    
    if (parsedData.sets && parsedData.reps) {
      badges.push(
        <Badge key="sets" variant="sets" className="text-xs">
          {parsedData.sets} × {parsedData.reps}
        </Badge>
      );
    }
    
    if (parsedData.progressiveWeights && parsedData.progressiveWeights.length > 0) {
      badges.push(
        <Badge key="progressive-weights" variant="weight" className="text-xs">
          {parsedData.progressiveWeights.join(' → ')}
        </Badge>
      );
    } else if (parsedData.weight) {
      badges.push(
        <Badge key="weight" variant="weight" className="text-xs">
          {parsedData.weight}
        </Badge>
      );
    }
    
    if (parsedData.time) {
      badges.push(
        <Badge key="time" variant="time" className="text-xs">
          {parsedData.time}
        </Badge>
      );
    }
    
    if (parsedData.distance) {
      badges.push(
        <Badge key="distance" variant="time" className="text-xs">
          {parsedData.distance}
        </Badge>
      );
    }
    
    if (parsedData.restPeriod) {
      badges.push(
        <Badge key="rest" variant="secondary" className="text-xs">
          Rest: {parsedData.restPeriod}
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <div className="bg-gradient-card border border-border rounded-lg p-4 min-w-[250px] shadow-card">
      <Handle type="target" position={Position.Top} className="!bg-accent !border-accent" />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm mb-1">{exercise.name}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(exercise.timestamp)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(exercise.id)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className="text-xs">{parsedData.type}</Badge>
        {renderParsedBadges()}
      </div>
      
      <div className="text-xs text-muted-foreground font-mono">
        "{exercise.originalInput}"
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-accent" />
    </div>
  );
}

export default memo(ExerciseNode);