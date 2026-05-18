# Poster Blueprint Backend

FastAPI analyzer used by the `/poster-blueprint` frontend route.

## Local Setup

```bash
cd backend/poster-blueprint
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
GEMINI_API_KEY=your_key uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The frontend defaults to `http://127.0.0.1:8000/analyze`. Override it with:

```bash
NEXT_PUBLIC_POSTER_BLUEPRINT_API_URL=https://your-api.example.com/analyze
```

## Production Setup

Deploy this folder as its own Python web service:

```bash
backend/poster-blueprint
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Required backend environment variables:

```bash
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=https://hollandblumer.com,https://www.hollandblumer.com,https://hollandblumer.github.io
```

After the backend deploys, set this environment variable before building the portfolio frontend:

```bash
NEXT_PUBLIC_POSTER_BLUEPRINT_API_URL=https://poster-blueprint-api.onrender.com/analyze
```

Useful backend checks:

```bash
curl https://poster-blueprint-api.onrender.com/health
curl https://poster-blueprint-api.onrender.com/references
```
