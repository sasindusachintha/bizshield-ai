import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6Lhve9GAaOhIKYcbYvJmc2hiqcs3rNsYz31FTxqBs6kvA' });
try {
  const result = await ai.models.list();
  console.log(JSON.stringify(result, null, 2).slice(0, 2000));
} catch (err) {
  console.error('ERROR', err);
}
