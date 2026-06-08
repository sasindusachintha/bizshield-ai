import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6Lhve9GAaOhIKYcbYvJmc2hiqcs3rNsYz31FTxqBs6kvA' });
try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Generate a short JSON array with one object containing title and description',
  });
  console.log('RESPONSE TEXT:', response.text);
} catch (err) {
  console.error('ERROR', err);
  if (err instanceof Error) console.error('ERR MSG', err.message);
}
