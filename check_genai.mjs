import('@google/genai').then(m=>{console.log('ok', !!m.GoogleGenAI); console.dir(Object.keys(m), { depth: 2 });}).catch(e=>{console.error('import failed', e); process.exit(1);})
