
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTasks = async (level: number): Promise<Task[]> => {
  const prompt = `Generate 3 diverse daily "earning" tasks for a tycoon game. 
  Level of user: ${level}.
  Each task must have:
  1. A title (in Bengali).
  2. A creative description/challenge (in Bengali).
  3. A difficulty level.
  4. Reward (virtual currency amount).
  5. Energy cost.
  6. A type (Riddle, Creative, or Math).
  7. Correct answer (if it's a riddle or math).

  Format as JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              reward: { type: Type.NUMBER },
              energyCost: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              type: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["id", "title", "description", "reward", "energyCost", "difficulty", "type"]
          }
        }
      }
    });

    const tasks = JSON.parse(response.text || "[]");
    return tasks.map((t: any) => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("Error generating tasks:", error);
    return [];
  }
};

export const verifyTaskAnswer = async (task: Task, userAnswer: string): Promise<boolean> => {
    if (!task.answer) return true; // Some tasks might be creative-only
    
    const prompt = `Verify if this answer is correct for the following challenge:
    Challenge: ${task.description}
    Correct Answer: ${task.answer}
    User Answer: ${userAnswer}
    
    Respond only with "true" or "false".`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text.toLowerCase().includes("true");
    } catch (error) {
        return userAnswer.toLowerCase() === task.answer.toLowerCase();
    }
}
