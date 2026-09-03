import { GoogleGenerativeAI } from '@google/generative-ai';
import { parsedSlotSchema } from '../utils/validation.js';

function getDateInfo(currentDateStr: string) {
  const dateObj = currentDateStr ? new Date(currentDateStr + 'T00:00:00') : new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[dateObj.getDay()];

  const tomorrow = new Date(dateObj);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowDayName = daysOfWeek[tomorrow.getDay()];

  return {
    dateObj,
    dayName,
    currentDateStr,
    tomorrowStr,
    tomorrowDayName
  };
}

function heuristicParseTranscript(transcript: string, currentDateStr: string) {
  const lower = transcript.toLowerCase();
  const baseDate = currentDateStr ? new Date(currentDateStr + 'T00:00:00') : new Date();
  let targetDate = new Date(baseDate);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (!lower.includes('today')) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const currentDay = baseDate.getDay();
        let targetDay = i;
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }
  }

  const formattedDate = targetDate.toISOString().split('T')[0];
  const isRecurring = lower.includes('every') || lower.includes('weekly') || lower.includes('recurring');

  let startTime = '09:00';
  let endTime = '11:00';

  if (lower.includes('morning')) {
    startTime = '09:00';
    endTime = '12:00';
  } else if (lower.includes('afternoon')) {
    startTime = '13:00';
    endTime = '16:00';
  } else if (lower.includes('evening')) {
    startTime = '17:00';
    endTime = '19:00';
  } else {
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|until|\s)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let [_, h1, m1, p1, h2, m2, p2] = timeMatch;
      let startH = parseInt(h1, 10);
      let endH = parseInt(h2, 10);
      const startM = m1 ? m1 : '00';
      const endM = m2 ? m2 : '00';

      const isPMContext = lower.includes('pm') || lower.includes('afternoon') || lower.includes('evening');

      if (p1) {
        if (p1.toLowerCase() === 'pm' && startH < 12) startH += 12;
        if (p1.toLowerCase() === 'am' && startH === 12) startH = 0;
      }
      if (p2) {
        if (p2.toLowerCase() === 'pm' && endH < 12) endH += 12;
        if (p2.toLowerCase() === 'am' && endH === 12) endH = 0;
      }

      if (!p1 && !p2 && isPMContext) {
        if (startH < 12) startH += 12;
        if (endH < 12) endH += 12;
      } else if (!p1 && !p2 && startH < 8 && endH <= 12) {
        startH += 12;
        endH += 12;
      }

      if (startH >= endH && endH < 12 && !p2) {
        endH += 12;
      }

      startTime = `${startH.toString().padStart(2, '0')}:${startM}`;
      endTime = `${endH.toString().padStart(2, '0')}:${endM}`;
    }
  }

  return {
    transcript,
    slots: [{
      date: formattedDate,
      startTime,
      endTime,
      isRecurring,
    }]
  };
}

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

async function generateWithFallback(genAI: GoogleGenerativeAI, contents: any) {
  let lastErr: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 10s waiting for ${modelName}`)), 10000)
      );
      const result: any = await Promise.race([
        model.generateContent(contents),
        timeoutPromise,
      ]);
      return result;
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message || '';
      console.log(`[Voice AI Backend] Model ${modelName} call failed or timed out (${msg}), trying next model...`);
      continue;
    }
  }
  throw lastErr;
}

export const voiceService = {
  async parseVoiceTranscript(transcript: string, currentDate: string) {
    console.log(`[Voice AI Backend] parseVoiceTranscript called with transcript="${transcript}", currentDate="${currentDate}"`);
    if (!process.env.GEMINI_API_KEY) {
      console.log('[Voice AI Backend] GEMINI_API_KEY is not set. Using smart fallback parser.');
      return heuristicParseTranscript(transcript, currentDate);
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const { dayName, tomorrowStr, tomorrowDayName } = getDateInfo(currentDate);

      const prompt = `
You are an expert AI assistant that extracts availability schedule slots from spoken text or natural user input.

CURRENT DATE CONTEXT:
- Today's Date: ${currentDate} (${dayName})
- Tomorrow's Date: ${tomorrowStr} (${tomorrowDayName})

DATE RESOLUTION INSTRUCTIONS:
- "today" -> ${currentDate}
- "tomorrow" -> ${tomorrowStr}
- If a day of the week is mentioned (e.g. "Monday", "this Friday", "next Wednesday"):
  Calculate the exact YYYY-MM-DD date relative to Today (${currentDate}, ${dayName}). If the mentioned day is today or already passed this week, choose the next upcoming date for that weekday.

TIME RESOLUTION INSTRUCTIONS (Strictly 24-hour HH:mm format):
- Convert 12-hour AM/PM to 24-hour HH:mm (e.g. "10am" -> "10:00", "2pm" -> "14:00", "4:30pm" -> "16:30").
- If a range like "10 to 12" is mentioned in morning context, output "10:00" to "12:00".
- If "2 to 4pm" or "2 to 4 in the afternoon" is mentioned, output "14:00" to "16:00".
- If only a single start time is given (e.g. "at 10am"), default slot duration to 1 hour ("10:00" to "11:00").
- Default vague terms: "morning" -> 09:00 to 12:00, "afternoon" -> 13:00 to 16:00, "evening" -> 17:00 to 19:00.

RECURRING EVENTS:
- Detect if recurring is implied (e.g., "every Monday", "weekly"). If so, set "isRecurring": true.

OUTPUT SPECIFICATION:
Return ONLY valid JSON matching this exact structure with NO markdown formatting, commentary, or extra text:
{
  "transcript": "${transcript.replace(/"/g, '\\"')}",
  "slots": [
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "isRecurring": boolean
    }
  ]
}

Input Text: "${transcript}"
      `;

      const result = await generateWithFallback(genAI, prompt);
      const text = result.response.text().trim();
      console.log(`[Voice AI Backend] Gemini Text Raw Output:\n`, text);

      const cleanedText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanedText);
      const validationResult = parsedSlotSchema.safeParse(parsed);

      if (!validationResult.success) {
        console.error('[Voice AI Backend] Gemini validation error:', validationResult.error);
        return heuristicParseTranscript(transcript, currentDate);
      }

      for (const slot of validationResult.data.slots) {
        if (slot.startTime >= slot.endTime) {
          throw new Error('Start time must be before end time.');
        }
      }

      const responsePayload = {
        transcript: validationResult.data.transcript || transcript,
        slots: validationResult.data.slots
      };
      console.log('[Voice AI Backend] Final parseVoiceTranscript payload:', responsePayload);
      return responsePayload;
    } catch (err: any) {
      console.error('[Voice AI Backend] Gemini parsing failed, using fallback parser:', err?.message || err);
      return heuristicParseTranscript(transcript, currentDate);
    }
  }
};
