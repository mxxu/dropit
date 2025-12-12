import { GoogleGenAI } from "@google/genai";

const getFileBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      encoded = encoded.replace(/^data:(.*,)?/, '');
      resolve(encoded);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeFilesWithGemini = async (files: File[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Filter for text or image files only for this demo to avoid token limits or unsupported types
    const supportedFiles = files.filter(f => 
      f.type.startsWith('text/') || 
      f.type.startsWith('image/') ||
      f.name.endsWith('.ts') ||
      f.name.endsWith('.tsx') ||
      f.name.endsWith('.json') ||
      f.name.endsWith('.md') ||
      f.name.endsWith('.py')
    ).slice(0, 5); // Limit to 5 files for demo performance

    if (supportedFiles.length === 0) {
      return "No supported text or image files selected for analysis.";
    }

    const fileParts = await Promise.all(supportedFiles.map(async (file) => {
      const base64Data = await getFileBase64(file);
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'text/plain', 
        }
      };
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...fileParts,
          {
            text: `Analyze these uploaded files. 
            1. Provide a brief summary of what this collection of files represents.
            2. If code, describe the tech stack. 
            3. If images, describe the visual content.
            4. List any potential issues or interesting patterns found.`
          }
        ]
      }
    });

    return response.text || "No analysis could be generated.";

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return `Error analyzing files: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};