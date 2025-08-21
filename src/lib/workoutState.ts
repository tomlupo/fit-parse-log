import { z } from 'zod';
import { ParsedExercise, WorkoutBlock } from '@/lib/exerciseParser';

// Zod schema for workout state validation
const ParsedExerciseDataSchema = z.object({
  sets: z.number().optional(),
  reps: z.number().optional(),
  weight: z.string().optional(),
  progressiveWeights: z.array(z.string()).optional(),
  time: z.string().optional(),
  distance: z.string().optional(),
  restPeriod: z.string().optional(),
  type: z.enum(['strength', 'cardio', 'time', 'unknown']),
});

const ParsedExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalInput: z.string(),
  parsedData: ParsedExerciseDataSchema,
  timestamp: z.string(), // ISO string that will be converted to Date
  blockId: z.string().optional(),
  blockProgression: z.object({
    roundWeights: z.array(z.string()).optional(),
    roundReps: z.array(z.number()).optional(),
    roundTimes: z.array(z.string()).optional(),
    roundDistances: z.array(z.string()).optional(),
  }).optional(),
});

const WorkoutBlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['round', 'superset', 'circuit']),
  exercises: z.array(z.string()),
  restBetweenExercises: z.string().optional(),
  rounds: z.number().optional(),
});

const LayoutOrderItemSchema = z.object({
  type: z.enum(['block', 'exercise']),
  id: z.string(),
});

const WorkoutStateSchema = z.object({
  version: z.number(),
  savedAt: z.string(),
  exercises: z.array(ParsedExerciseSchema),
  blocks: z.array(WorkoutBlockSchema),
  layoutOrder: z.array(LayoutOrderItemSchema),
});

export type WorkoutState = {
  version: number;
  savedAt: string;
  exercises: ParsedExercise[];
  blocks: WorkoutBlock[];
  layoutOrder: Array<{ type: 'block' | 'exercise', id: string }>;
};

const STORAGE_KEY = 'workout-autosave';
const CURRENT_VERSION = 1;

// Convert Date objects to ISO strings for storage
const serializeState = (state: Omit<WorkoutState, 'version' | 'savedAt'>): WorkoutState => ({
  version: CURRENT_VERSION,
  savedAt: new Date().toISOString(),
  exercises: state.exercises.map(ex => ({
    ...ex,
    timestamp: ex.timestamp.toISOString(),
  })) as any,
  blocks: state.blocks,
  layoutOrder: state.layoutOrder,
});

// Convert ISO strings back to Date objects
const deserializeState = (serializedState: any): WorkoutState => {
  const state = {
    ...serializedState,
    exercises: serializedState.exercises.map((ex: any) => ({
      ...ex,
      timestamp: new Date(ex.timestamp),
    })),
  };
  return state;
};

export const saveToLocalStorage = (state: Omit<WorkoutState, 'version' | 'savedAt'>) => {
  try {
    const serialized = serializeState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    return { success: true };
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return { success: false, error: 'Failed to save workout' };
  }
};

export const loadFromLocalStorage = (): { success: true; data: WorkoutState } | { success: false; error: string } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { success: false, error: 'No saved workout found' };
    }

    const parsed = JSON.parse(stored);
    const validated = WorkoutStateSchema.parse(parsed);
    const deserialized = deserializeState(validated);
    
    return { success: true, data: deserialized };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return { success: false, error: 'Failed to load saved workout' };
  }
};

export const exportToJson = (state: Omit<WorkoutState, 'version' | 'savedAt'>) => {
  try {
    const serialized = serializeState(state);
    const dataStr = JSON.stringify(serialized, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const now = new Date();
    const filename = `workout-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to export:', error);
    return { success: false, error: 'Failed to export workout' };
  }
};

export const importFromJson = (file: File): Promise<{ success: true; data: WorkoutState } | { success: false; error: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const validated = WorkoutStateSchema.parse(parsed);
        const deserialized = deserializeState(validated);
        
        resolve({ success: true, data: deserialized });
      } catch (error) {
        console.error('Failed to import:', error);
        if (error instanceof z.ZodError) {
          resolve({ success: false, error: 'Invalid workout file format' });
        } else {
          resolve({ success: false, error: 'Failed to import workout file' });
        }
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
};