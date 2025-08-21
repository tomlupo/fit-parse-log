export interface ParsedExerciseData {
  sets?: number;
  reps?: number;
  weight?: string;
  progressiveWeights?: string[];
  time?: string;
  distance?: string;
  restPeriod?: string;
  type: 'strength' | 'cardio' | 'time' | 'unknown';
}

export interface ParsedExercise {
  id: string;
  name: string;
  originalInput: string;
  parsedData: ParsedExerciseData;
  timestamp: Date;
  blockId?: string; // Optional block/round assignment
  blockProgression?: {
    roundWeights?: string[];
    roundReps?: number[];
    roundTimes?: string[];
    roundDistances?: string[];
  };
}

export interface WorkoutBlock {
  id: string;
  name: string;
  type: 'round' | 'superset' | 'circuit';
  exercises: string[]; // Exercise IDs
  restBetweenExercises?: string;
  rounds?: number;
}

export function parseExerciseParameters(input: string): ParsedExerciseData {
  const cleanInput = input.toLowerCase().trim();
  
  let type: ParsedExerciseData['type'] = 'unknown';
  let sets, reps, weight, time, distance, restPeriod;
  let progressiveWeights: string[] | undefined;

  // Extract rest period first (e.g., "rest 30s", "rest 2min", "30s rest")
  const restPatterns = [
    /rest\s+(\d+(?:\.\d+)?)\s*(s|sec|seconds?|m|min|minutes?)/i,
    /(\d+(?:\.\d+)?)\s*(s|sec|seconds?|m|min|minutes?)\s+rest/i,
    /rest\s+(\d+):(\d+)/i, // rest 1:30
    /(\d+):(\d+)\s+rest/i  // 1:30 rest
  ];

  for (const pattern of restPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      if (match[3] && match[4]) {
        // Time in MM:SS format
        restPeriod = `${match[1]}:${match[2]}`;
      } else if (match[1] && match[2]) {
        restPeriod = `${match[1]}${match[2]}`;
      }
      break;
    }
  }

  // Enhanced pattern for sets x reps with progressive weights
  // e.g., "3x10 @ 40/50/60kg", "3 x 10 @ 135/145/155lbs", "4x8@60/70/80/90kg"
  const progressiveStrengthPattern = /(\d+)\s*x\s*(\d+)(?:\s*@\s*((?:\d+(?:\.\d+)?\/)*\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?))?/i;
  
  // Pattern for sets x reps @ single weight (e.g., "3x10 @ 135lbs", "4 x 8 @ 185")
  const strengthPattern = /(\d+)\s*x\s*(\d+)(?:\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?))?/i;
  
  // Pattern for time (e.g., "30 seconds", "5 minutes", "1:30", "2.5 min")
  const timePattern = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)|(\d+):(\d+)/i;
  
  // Pattern for distance (e.g., "2 miles", "5km", "100m")
  const distancePattern = /(\d+(?:\.\d+)?)\s*(miles?|km|kilometers?|meters?|m|yards?|yds?)/i;
  
  // Pattern for just weight (e.g., "135lbs", "60kg")
  const weightPattern = /(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?)/i;
  
  // Pattern for just sets x reps (e.g., "3x10", "4 x 8")
  const setsRepsPattern = /(\d+)\s*x\s*(\d+)/i;

  // Check for progressive weights first
  if (progressiveStrengthPattern.test(cleanInput)) {
    const match = cleanInput.match(progressiveStrengthPattern);
    if (match) {
      sets = parseInt(match[1]);
      reps = parseInt(match[2]);
      
      if (match[3] && match[4]) {
        const weightsString = match[3];
        const unit = match[4];
        
        // Check if it contains forward slashes (progressive weights)
        if (weightsString.includes('/')) {
          progressiveWeights = weightsString.split('/').map(w => `${w.trim()}${unit}`);
        } else {
          weight = `${weightsString} ${unit}`;
        }
      }
      type = 'strength';
    }
  } else if (strengthPattern.test(cleanInput)) {
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
    progressiveWeights,
    time,
    distance,
    restPeriod,
    type
  };
}