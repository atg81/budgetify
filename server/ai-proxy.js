// server/ai-proxy.js
// Minimal Express proxy to safely call OpenAI from server-side.
// Do NOT store API keys in client code. Set OPENAI_API_KEY in environment.

const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/api/ai', async (req, res) => {
  try {
    const { question, category } = req.body || {};
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Missing question' });
    if (question.length > 1000) return res.status(400).json({ error: 'Question too long' });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(501).json({ error: 'AI not configured on server' });

    const prompt = `You are a helpful assistant for a budgeting app called Budgetify. User question: ${question}. Category: ${category || 'general'}`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are concise and helpful.' }, { role: 'user', content: prompt }],
      max_tokens: 300,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'Upstream AI error', details: txt });
    }

    const json = await r.json();
    const answer = json?.choices?.[0]?.message?.content || '';
    return res.json({ answer });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`AI proxy listening on ${PORT}`));
