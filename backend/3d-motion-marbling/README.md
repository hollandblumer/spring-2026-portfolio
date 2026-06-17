# 3D Motion Marbling Backend

FastAPI service for the `/3d-motion-marbling` portfolio route. It serves the live MANO files that the marbling sketch polls:

- `current_hand_state.json`
- `current_hand_mesh.obj`

## Local Setup

```bash
cd backend/3d-motion-marbling
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

By default, the API serves files from:

```bash
public/3d-motion-marbling
```

To serve the live files from the original MANO folder instead:

```bash
MANO_DATA_DIR="/Users/hollandblumer/Desktop/hand" uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Useful checks:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/current_hand_state.json
curl -I http://127.0.0.1:8000/current_hand_mesh.obj
```

## Frontend Behavior

When the portfolio runs on `localhost` or `127.0.0.1`, the marbling sketch automatically polls:

```bash
http://127.0.0.1:8000
```

On production domains, it falls back to the static files in `public/3d-motion-marbling`, so the page can still deploy without a live backend.

You can override the API base with a query string:

```bash
/3d-motion-marbling/finger_marble_mano.html?api=https://your-api.example.com
```

## Production Setup

Deploy this folder as its own Python web service.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Optional environment variables:

```bash
MANO_DATA_DIR=/path/to/live/hand/files
ALLOWED_ORIGINS=https://hollandblumer.com,https://www.hollandblumer.com,https://hollandblumer.github.io
```
