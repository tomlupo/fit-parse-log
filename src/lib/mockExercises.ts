export const mockExercises = [
  "Bench Press",
  "Squats",
  "Deadlift",
  "Pull-ups",
  "Push-ups",
  "Overhead Press",
  "Barbell Rows",
  "Dumbbell Curls",
  "Tricep Dips",
  "Leg Press",
  "Lunges",
  "Plank",
  "Burpees",
  "Mountain Climbers",
  "Jumping Jacks",
  "Russian Twists",
  "Calf Raises",
  "Lat Pulldowns",
  "Chest Flyes",
  "Hip Thrusts"
];

export function searchExercises(query: string): string[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  return mockExercises
    .filter(exercise => 
      exercise.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5); // Limit to 5 suggestions
}