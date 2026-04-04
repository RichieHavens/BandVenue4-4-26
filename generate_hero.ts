import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generate() {
  console.log("Generating image...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A cinematic, high-quality photograph of a live music concert from the crowd perspective. Dark, moody atmosphere with vibrant red stage lights and lasers cutting through atmospheric fog. Silhouettes of a cheering crowd with hands up in the foreground. The center of the image has negative space and is slightly darker to allow a logo to be overlaid clearly. Professional photography, photorealistic, highly detailed.',
        },
      ],
    },
  });
  
  let found = false;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      fs.writeFileSync('./public/hero-bg.png', Buffer.from(base64EncodeString, 'base64'));
      console.log('Image saved to /public/hero-bg.png');
      found = true;
    }
  }
  
  if (!found) {
    console.log("No image data found in response.");
  }
}

generate().catch(console.error);
