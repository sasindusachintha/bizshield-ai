import fetch from 'node-fetch';
const response = await fetch('http://localhost:5000/api/growth/generate-ideas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ skills: 'coding, web development', budget: 5000, interest: 'online education' }),
});
const text = await response.text();
console.log('STATUS', response.status);
console.log(text);
