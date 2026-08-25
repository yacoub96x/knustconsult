import { GoogleGenerativeAI } from '@google/generative-ai';
import { parsedSlotSchema } from '../utils/validation.js';

export const voiceService = {
  async parseVoiceTranscript(transcript: string, currentDate: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an AI assistant that extracts availability schedules from spoken text.
Today's date is: ${currentDate}. Use this to resolve relative dates like "tomorrow", "next Monday".

Default time ranges for vague terms:
- "morning" -> 09:00 to 12:00
- "afternoon" -> 13:00 to 16:00
- "evening" -> 17:00 to 19:00

Detect if the language implies a recurring event (e.g. "every Monday", "weekly"). If so, set "isRecurring": true.

Return ONLY valid JSON with this exact structure, no markdown formatting or prose:
{ "slots": [ { "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm", "isRecurring": boolean } ] }

Transcript: "${transcript}"
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Attempt to clean any potential markdown formatting if model didn't perfectly adhere
      const cleanedText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      const parsed = JSON.parse(cleanedText);
      const validationResult = parsedSlotSchema.safeParse(parsed);
      
      if (!validationResult.success) {
        console.error('Gemini validation error:', validationResult.error);
        throw new Error('Failed to extract valid availability structure.');
      }
      
      // Additional validation: startTime < endTime
      for (const slot of validationResult.data.slots) {
        if (slot.startTime >= slot.endTime) {
          throw new Error('Start time must be before end time.');
        }
      }
      
      return validationResult.data.slots;
    } catch (err: any) {
      console.error('Gemini parsing error:', err);
      throw new Error("Could not parse availability from that. Try rephrasing or enter manually.");
    }
  },

  async parseAudio(audioBase64: string, mimeType: string, currentDate: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an AI assistant that extracts availability schedules from spoken audio recording.
Today's date is: ${currentDate}. Use this to resolve relative dates like "tomorrow", "next Monday".

Default time ranges for vague terms:
- "morning" -> 09:00 to 12:00
- "afternoon" -> 13:00 to 16:00
- "evening" -> 17:00 to 19:00

Detect if the language implies a recurring event (e.g. "every Monday", "weekly"). If so, set "isRecurring": true.

Return ONLY valid JSON with this exact structure, no markdown formatting or prose:
{ "slots": [ { "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm", "isRecurring": boolean } ] }
    `;

    try {
      // Clean mimeType if it contains codecs specifiers like audio/webm;codecs=opus
      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: cleanMimeType,
            data: audioBase64,
          },
        },
        prompt,
      ]);
      const text = result.response.text().trim();
      const cleanedText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

      const parsed = JSON.parse(cleanedText);
      const validationResult = parsedSlotSchema.safeParse(parsed);

      if (!validationResult.success) {
        console.error('Gemini audio validation error:', validationResult.error);
        throw new Error('Failed to extract valid availability structure from audio.');
      }

      for (const slot of validationResult.data.slots) {
        if (slot.startTime >= slot.endTime) {
          throw new Error('Start time must be before end time.');
        }
      }

      return validationResult.data.slots;
    } catch (err: any) {
      console.error('Gemini audio parsing error:', err);
      throw new Error("Could not parse audio availability. Please speak clearly and try again.");
    }
  }
};
