import React from 'react';
import { Dumbbell, Zap } from 'lucide-react';

export function WorkoutHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-gradient-primary">
          <Dumbbell className="h-8 w-8 text-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Workout Notebook
        </h1>
        <div className="p-3 rounded-full bg-gradient-primary">
          <Zap className="h-8 w-8 text-foreground" />
        </div>
      </div>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Track your exercises with smart parameter parsing. 
        Just type naturally - we'll understand your workout format.
      </p>
    </div>
  );
}