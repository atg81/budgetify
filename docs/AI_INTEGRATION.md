# AI Integration (safe setup)

This project includes a client-side call from the AiChat UI to a server endpoint `/api/ai`.
For security, you should run a server-side proxy that holds your OpenAI API key (never put the key in frontend code).

Quick setup (optional):

1. Install dependencies in project root or a separate folder:

```bash
npm install express node-fetch dotenv
```

2. Create a `.env` file (not committed) with:

```
OPENAI_API_KEY=sk-...
```

3. Start the proxy:

```bash
node server/ai-proxy.js
```

The proxy listens on port `3001` by default and exposes `POST /api/ai`.

4. In development, run the proxy alongside Vite and configure a dev proxy (vite config) or set the frontend to call `http://localhost:3001/api/ai`.

Security notes:
- The proxy limits input length and returns errors if API key is not set. Do not expose the API key to clients.
- Consider adding authentication, rate limits, and input sanitization before deploying.

Client behavior:
- If `/api/ai` is reachable and returns an `answer`, the AiChat UI will show that dynamic response.
- If the proxy is not available, AiChat falls back to the built-in canned answers.

