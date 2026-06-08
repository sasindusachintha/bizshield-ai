import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6Lhve9GAaOhIKYcbYvJmc2hiqcs3rNsYz31FTxqBs6kvA' });
try {
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: 'Hello world',
  });
  console.log('RESPONSE', response);
} catch (err) {
  console.error('ERROR', err);
  if (err instanceof Error) console.error('ERR MSG', err.message);
}
