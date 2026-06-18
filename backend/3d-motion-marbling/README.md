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

## Live Website MANO Uploads

Render cannot access your laptop webcam directly. To use the Python MANO mesh on
the public website, run the webcam MANO process locally and upload its generated
files to the hosted Render API.

Set this Render environment variable on the backend service:

```bash
MANO_UPLOAD_TOKEN=make-a-long-random-secret
```

While `webcam_mano.py` is running and writing files into
`/Users/hollandblumer/Desktop/hand`, run this in another terminal:

```bash
cd backend/3d-motion-marbling
python3 upload_mano_files.py \
  --api https://spring-2026-portfolio.onrender.com \
  --token "make-a-long-random-secret" \
  --data-dir "/Users/hollandblumer/Desktop/hand"
```

The uploader sends:

- `current_hand_state.json`
- `current_hand_mesh.obj`

to Render, and the public portfolio page polls those uploaded files.

## Frontend Behavior

By default, the public portfolio runs fully in the visitor's browser: it asks for
their webcam, tracks their hand with MediaPipe, and draws the bundled MANO mesh
asset from `public/3d-motion-marbling`.

The Python backend is optional. Use it only when you explicitly want to drive the
page from generated MANO files:

```bash
/3d-motion-marbling/finger_marble_mano.html?api=http://127.0.0.1:8000
```

For a hosted Python stream, pass the Render API URL:

```bash
/3d-motion-marbling/finger_marble_mano.html?api=https://your-api.example.com
```

For accurate visitor-webcam MANO fitting, pass `fit=1`. This asks the visitor
for webcam access, sends small JPEG frames to the Python backend, and renders the
returned MANO `projectedVertices`:

```bash
/3d-motion-marbling/finger_marble_mano.html?api=https://your-api.example.com&fit=1
```

This mode requires the backend service to have the licensed MANO model files
available on disk:

```bash
MANO_MODEL_DIR=/path/to/folder/with/mano/files
```

The folder must contain:

- `MANO_LEFT.pkl`
- `MANO_RIGHT.pkl`

Do not commit these files to the public portfolio repo; they are licensed
separately.

### Loading MANO files from Google Cloud Storage on Render

Store the model files in a private GCS bucket:

- `MANO_LEFT.pkl`
- `MANO_RIGHT.pkl`

Create a Google service account with `Storage Object Viewer` access to that
bucket. In Render, add the service account JSON as a Secret File named:

```bash
gcp-service-account.json
```

Render exposes that file at:

```bash
/etc/secrets/gcp-service-account.json
```

Set these Render environment variables on the backend service:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-service-account.json
GCS_MANO_BUCKET=your-private-bucket-name
MANO_MODEL_DIR=/tmp/mano-models
```

On startup/lazy MANO initialization, the backend downloads the two `.pkl` files
from GCS into `MANO_MODEL_DIR`. Check `/health` after deploy; it should report:

```json
"hasManoModels": {
  "left": true,
  "right": true
}
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
MANO_MODEL_DIR=/path/to/folder/with/mano/files
GCS_MANO_BUCKET=your-private-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-service-account.json
MANO_UPLOAD_TOKEN=make-a-long-random-secret
ALLOWED_ORIGINS=https://hollandblumer.com,https://www.hollandblumer.com,https://hollandblumer.github.io
```
