import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Zap, Target } from 'lucide-react';
import { WorkoutBlock } from '@/lib/exerciseParser';

interface BlockNodeData {
  block: WorkoutBlock;
  exerciseCount: number;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

function BlockNode({ data }: { data: BlockNodeData }) {
  const { block, exerciseCount, onRemove, onEdit } = data;

  const getBlockIcon = () => {
    switch (block.type) {
      case 'round':
        return <RotateCcw className="h-4 w-4" />;
      case 'superset':
        return <Zap className="h-4 w-4" />;
      case 'circuit':
        return <Target className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getBlockColor = () => {
    switch (block.type) {
      case 'round':
        return 'bg-primary text-primary-foreground';
      case 'superset':
        return 'bg-accent text-accent-foreground';
      case 'circuit':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`${getBlockColor()} rounded-lg p-4 min-w-[300px] shadow-workout border-2 border-dashed border-border/50`}>
      <Handle type="target" position={Position.Top} className="!bg-primary !border-primary" />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getBlockIcon()}
          <div>
            <h3 className="font-semibold text-sm">{block.name}</h3>
            <p className="text-xs opacity-80">{exerciseCount} exercises</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(block.id)}
            className="h-6 w-6 hover:bg-background/20"
          >
            <Target className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(block.id)}
            className="h-6 w-6 hover:bg-destructive/20"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="bg-background/20 border-background/30">
          {block.type}
        </Badge>
        
        {block.rounds && (
          <Badge variant="outline" className="bg-background/20 border-background/30">
            {block.rounds} rounds
          </Badge>
        )}
        
        {block.restBetweenExercises && (
          <Badge variant="outline" className="bg-background/20 border-background/30">
            Rest: {block.restBetweenExercises}
          </Badge>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-primary" />
    </div>
  );
}

export default memo(BlockNode);