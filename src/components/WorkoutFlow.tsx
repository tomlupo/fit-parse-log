import React, { useCallback, useState, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Layers, RotateCcw, Zap, Target } from 'lucide-react';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';
import ExerciseNode from './flow/ExerciseNode';
import BlockNode from './flow/BlockNode';
import { useToast } from '@/hooks/use-toast';

interface WorkoutFlowProps {
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  onRemoveExercise: (id: string) => void;
  onAddBlock: (block: WorkoutBlock) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateExercise: (exercise: ParsedExercise) => void;
}

const nodeTypes = {
  exercise: ExerciseNode,
  block: BlockNode,
};

export function WorkoutFlow({ 
  exercises, 
  blocks, 
  onRemoveExercise, 
  onAddBlock, 
  onRemoveBlock,
  onUpdateExercise 
}: WorkoutFlowProps) {
  const { toast } = useToast();
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockType, setNewBlockType] = useState<'round' | 'superset' | 'circuit'>('round');
  const [newBlockRounds, setNewBlockRounds] = useState('3');
  const [newBlockRest, setNewBlockRest] = useState('');

  // Convert exercises and blocks to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    let yPosition = 100;
    const nodeSpacing = 180;

    // Add block nodes first
    blocks.forEach((block, index) => {
      const exercisesInBlock = exercises.filter(ex => ex.blockId === block.id);
      nodes.push({
        id: `block-${block.id}`,
        type: 'block',
        position: { x: 50, y: yPosition },
        data: {
          block,
          exerciseCount: exercisesInBlock.length,
          onRemove: onRemoveBlock,
          onEdit: () => {}, // TODO: Implement block editing
        },
      });
      yPosition += nodeSpacing;

      // Add exercises in this block
      exercisesInBlock.forEach((exercise, exIndex) => {
        nodes.push({
          id: `exercise-${exercise.id}`,
          type: 'exercise',
          position: { x: 400, y: yPosition - nodeSpacing + (exIndex * 120) },
          data: {
            exercise,
            onRemove: onRemoveExercise,
          },
          parentId: `block-${block.id}`,
        });
      });
    });

    // Add unassigned exercises
    const unassignedExercises = exercises.filter(ex => !ex.blockId);
    unassignedExercises.forEach((exercise, index) => {
      nodes.push({
        id: `exercise-${exercise.id}`,
        type: 'exercise',
        position: { x: 50 + (index % 3) * 300, y: yPosition },
        data: {
          exercise,
          onRemove: onRemoveExercise,
        },
      });
      
      if ((index + 1) % 3 === 0) {
        yPosition += nodeSpacing;
      }
    });

    return nodes;
  }, [exercises, blocks, onRemoveExercise, onRemoveBlock]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    // Create edges between blocks and their exercises
    blocks.forEach(block => {
      const exercisesInBlock = exercises.filter(ex => ex.blockId === block.id);
      exercisesInBlock.forEach(exercise => {
        edges.push({
          id: `edge-${block.id}-${exercise.id}`,
          source: `block-${block.id}`,
          target: `exercise-${exercise.id}`,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--primary))' },
        });
      });
    });

    return edges;
  }, [exercises, blocks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      // Handle connecting exercises to blocks
      if (params.source?.startsWith('block-') && params.target?.startsWith('exercise-')) {
        const blockId = params.source.replace('block-', '');
        const exerciseId = params.target.replace('exercise-', '');
        
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
          const updatedExercise = { ...exercise, blockId };
          onUpdateExercise(updatedExercise);
          
          toast({
            title: "Exercise grouped",
            description: `${exercise.name} has been added to the block.`,
          });
        }
      }
      
      setEdges((eds) => addEdge(params, eds));
    },
    [exercises, onUpdateExercise, setEdges, toast]
  );

  const handleAddBlock = () => {
    if (!newBlockName.trim()) return;

    const newBlock: WorkoutBlock = {
      id: Date.now().toString(),
      name: newBlockName,
      type: newBlockType,
      exercises: [],
      rounds: parseInt(newBlockRounds) || undefined,
      restBetweenExercises: newBlockRest || undefined,
    };

    onAddBlock(newBlock);
    setNewBlockName('');
    setNewBlockRounds('3');
    setNewBlockRest('');
    setIsAddingBlock(false);

    toast({
      title: "Block created",
      description: `${newBlock.name} has been added to your workout.`,
    });
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
        return <Layers className="h-4 w-4" />;
    }
  };

  if (exercises.length === 0) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8 text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No exercises to organize</h3>
          <p className="text-muted-foreground">
            Add some exercises first, then come back here to organize them into blocks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Workout Flow
            </div>
            <Dialog open={isAddingBlock} onOpenChange={setIsAddingBlock}>
              <DialogTrigger asChild>
                <Button variant="workout" size="sm">
                  <Plus className="h-4 w-4" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Workout Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="blockName">Block Name</Label>
                    <Input
                      id="blockName"
                      placeholder="e.g., Upper Body Round, Core Circuit"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="blockType">Block Type</Label>
                    <Select value={newBlockType} onValueChange={(value: any) => setNewBlockType(value)}>
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
                        placeholder="3"
                        value={newBlockRounds}
                        onChange={(e) => setNewBlockRounds(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rest">Rest Between</Label>
                      <Input
                        id="rest"
                        placeholder="30s, 1min"
                        value={newBlockRest}
                        onChange={(e) => setNewBlockRest(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleAddBlock} className="w-full" variant="workout">
                    {getBlockIcon(newBlockType)}
                    Create Block
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] bg-background/50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              style={{ backgroundColor: 'hsl(var(--background))' }}
            >
              <Controls className="!bottom-4 !left-4" />
              <Background color="hsl(var(--border))" />
              <MiniMap 
                className="!bottom-4 !right-4" 
                style={{ backgroundColor: 'hsl(var(--card))' }}
                maskColor="hsl(var(--background))"
              />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <div className="font-medium mb-2">How to use:</div>
        <div className="space-y-1">
          <div>• Drag exercises to reorder them in your workout</div>
          <div>• Connect exercises to blocks by dragging from block handles to exercise handles</div>
          <div>• Create blocks for rounds, supersets, or circuits</div>
          <div>• Use the minimap to navigate large workouts</div>
        </div>
      </div>
    </div>
  );
}