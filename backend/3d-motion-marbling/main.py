import base64
import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response


BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parents[1]
DEFAULT_DATA_DIR = REPO_ROOT / "public" / "3d-motion-marbling"
DEFAULT_UPLOAD_DIR = Path(os.getenv("MANO_UPLOAD_DIR", "/tmp/3d-motion-marbling"))
DEFAULT_MANO_ROOT = Path(os.getenv("MANO_MODEL_DIR", BASE_DIR / "models"))
MANO_MODEL_FILES = ("MANO_LEFT.pkl", "MANO_RIGHT.pkl")
DATA_FILES = {
    "current_hand_state.json": "application/json",
    "current_hand_mesh.obj": "text/plain",
}
LIVE_FITTERS = {}
MODELS_READY = False

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://hollandblumer.com",
    "https://www.hollandblumer.com",
    "https://hollandblumer.github.io",
]


def get_allowed_origins():
    configured_origins = os.getenv("ALLOWED_ORIGINS", "")
    if not configured_origins:
        return DEFAULT_ALLOWED_ORIGINS

    return [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]


def get_data_dir():
    configured_dir = os.getenv("MANO_DATA_DIR", "")
    if configured_dir:
        return Path(configured_dir).expanduser().resolve()

    return DEFAULT_DATA_DIR.resolve()


def get_upload_dir():
    return DEFAULT_UPLOAD_DIR.expanduser().resolve()


def get_file_path(filename):
    upload_path = get_upload_dir() / filename
    if upload_path.exists():
        return upload_path

    return get_data_dir() / filename


def serve_data_file(filename, media_type):
    path = get_file_path(filename)
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{filename} was not found in {get_upload_dir()} or {get_data_dir()}",
        )

    return FileResponse(
        path,
        media_type=media_type,
        headers={"Cache-Control": "no-store"},
    )


def get_mano_root():
    return Path(os.getenv("MANO_MODEL_DIR", DEFAULT_MANO_ROOT)).expanduser().resolve()


def ensure_mano_models():
    global MODELS_READY
    mano_root = get_mano_root()
    if all((mano_root / filename).exists() for filename in MANO_MODEL_FILES):
        MODELS_READY = True
        return mano_root

    bucket_name = os.getenv("GCS_MANO_BUCKET", "")
    if not bucket_name:
        return mano_root

    try:
        from google.cloud import storage
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Google Cloud Storage dependency is unavailable: {exc}",
        ) from exc

    mano_root.mkdir(parents=True, exist_ok=True)
    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        for filename in MANO_MODEL_FILES:
            target_path = mano_root / filename
            if target_path.exists():
                continue
            bucket.blob(filename).download_to_filename(target_path)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not download MANO models from GCS bucket {bucket_name}: {exc}",
        ) from exc

    MODELS_READY = all((mano_root / filename).exists() for filename in MANO_MODEL_FILES)
    return mano_root


def lazy_import_mano_runtime():
    try:
        import inspect
        import cv2
        import mediapipe as mp
        import numpy as np
        import torch

        if not hasattr(inspect, "getargspec"):
            inspect.getargspec = inspect.getfullargspec
        for alias, value in {
            "bool": bool,
            "int": int,
            "float": float,
            "complex": complex,
            "object": object,
            "str": str,
            "unicode": str,
        }.items():
            if alias not in np.__dict__:
                setattr(np, alias, value)

        from manopth.manolayer import ManoLayer
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"MANO runtime dependencies are unavailable: {exc}",
        ) from exc

    return cv2, mp, np, torch, ManoLayer


def mediapipe_to_fit_target(landmarks, torch, device):
    pts = []
    for lm in landmarks.landmark:
        pts.append([lm.x, -lm.y, -lm.z])
    pts = torch.tensor(pts, dtype=torch.float32, device=device)
    root = pts[0].clone()
    scale = (pts - root).norm(dim=1).mean() + 1e-8
    target = (pts - root) / scale
    return target, root, scale


def mano_joints_to_mediapipe_order(joints):
    j = joints[0, :21, :]
    j = j - j[0]
    j = j / (j.norm(dim=1).mean() + 1e-8)
    return j


def landmarks_to_json(landmarks):
    return [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in landmarks.landmark]


def project_mano_vertices(verts, joints, trans, mp_root, mp_scale):
    mano_root = joints[0, 0, :]
    mano_scale = (joints[0, :21, :] - mano_root).norm(dim=1).mean() + 1e-8
    fitted = ((verts[0] - mano_root) / mano_scale) + trans[0]
    image_points = fitted * mp_scale + mp_root
    image_points = image_points.detach().cpu()

    z = image_points[:, 2]
    z_min = z.min()
    z_range = (z.max() - z_min).clamp_min(1e-8)
    z_norm = (z - z_min) / z_range

    return [
        [float(x), float(-y), float(depth)]
        for (x, y, _), depth in zip(image_points.tolist(), z_norm.tolist())
    ]


class LiveManoFitter:
    def __init__(self, hand_side):
        cv2, mp, np, torch, ManoLayer = lazy_import_mano_runtime()
        self.cv2 = cv2
        self.np = np
        self.torch = torch
        self.device = torch.device(os.getenv("MANO_DEVICE", "cpu"))
        self.iterations = int(os.getenv("MANO_ITERATIONS", "8"))
        self.hand_side = hand_side

        mano_root = ensure_mano_models()
        expected_file = "MANO_RIGHT.pkl" if hand_side == "right" else "MANO_LEFT.pkl"
        if not (mano_root / expected_file).exists():
            raise HTTPException(
                status_code=503,
                detail=f"Missing MANO model file: {mano_root / expected_file}",
            )

        self.mano_layer = ManoLayer(
            mano_root=str(mano_root),
            use_pca=True,
            ncomps=45,
            flat_hand_mean=False,
            side=hand_side,
        ).to(self.device)
        self.pose = torch.zeros(1, 48, device=self.device, requires_grad=True)
        self.shape = torch.zeros(1, 10, device=self.device, requires_grad=True)
        self.trans = torch.zeros(1, 3, device=self.device, requires_grad=True)
        self.optimizer = torch.optim.Adam([self.pose, self.shape, self.trans], lr=0.01)
        self.mp_hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.65,
            min_tracking_confidence=0.65,
        )

    def fit(self, image_bytes):
        image_arr = self.np.frombuffer(image_bytes, dtype=self.np.uint8)
        frame = self.cv2.imdecode(image_arr, self.cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode frame.")

        rgb = self.cv2.cvtColor(frame, self.cv2.COLOR_BGR2RGB)
        result = self.mp_hands.process(rgb)
        if not result.multi_hand_landmarks:
            return {"hasHand": False, "landmarks": [], "projectedVertices": []}

        hand_landmarks = result.multi_hand_landmarks[0]
        target, mp_root, mp_scale = mediapipe_to_fit_target(
            hand_landmarks,
            self.torch,
            self.device,
        )

        frame_pose = self.pose.detach().clone()
        frame_shape = self.shape.detach().clone()
        frame_trans = self.trans.detach().clone()

        for _ in range(self.iterations):
            self.optimizer.zero_grad()
            verts, joints = self.mano_layer(self.pose, self.shape)
            pred = mano_joints_to_mediapipe_order(joints) + self.trans

            loss = ((pred - target) ** 2).mean()
            loss = loss + 0.0005 * (self.pose ** 2).mean()
            loss = loss + 0.001 * (self.shape ** 2).mean()
            loss = loss + 0.0008 * ((self.pose - frame_pose) ** 2).mean()
            loss = loss + 0.0008 * ((self.trans - frame_trans) ** 2).mean()

            loss.backward()
            self.optimizer.step()

        with self.torch.no_grad():
            self.pose.mul_(0.92).add_(frame_pose, alpha=0.08)
            self.shape.mul_(0.98).add_(frame_shape, alpha=0.02)
            self.trans.mul_(0.82).add_(frame_trans, alpha=0.18)

        verts, joints = self.mano_layer(self.pose, self.shape)
        return {
            "hasHand": True,
            "landmarks": landmarks_to_json(hand_landmarks),
            "projectedVertices": project_mano_vertices(
                verts,
                joints,
                self.trans,
                mp_root,
                mp_scale,
            ),
        }


def get_live_fitter(session_id, hand_side):
    key = f"{session_id}:{hand_side}"
    if key not in LIVE_FITTERS:
        LIVE_FITTERS[key] = LiveManoFitter(hand_side)
    return LIVE_FITTERS[key]


app = FastAPI(title="3D Motion Marbling API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["GET", "HEAD", "PUT", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    data_dir = get_data_dir()
    upload_dir = get_upload_dir()
    mano_root = ensure_mano_models()
    return {
        "ok": True,
        "dataDir": str(data_dir),
        "uploadDir": str(upload_dir),
        "hasState": get_file_path("current_hand_state.json").exists(),
        "hasMesh": get_file_path("current_hand_mesh.obj").exists(),
        "hasUploadedState": (upload_dir / "current_hand_state.json").exists(),
        "hasUploadedMesh": (upload_dir / "current_hand_mesh.obj").exists(),
        "hasManoModels": {
            "left": (mano_root / "MANO_LEFT.pkl").exists(),
            "right": (mano_root / "MANO_RIGHT.pkl").exists(),
        },
        "manoModelDir": str(mano_root),
        "gcsManoBucket": os.getenv("GCS_MANO_BUCKET", ""),
        "allowedOrigins": get_allowed_origins(),
    }


@app.post("/fit_frame")
async def fit_frame(request: Request):
    payload = await request.json()
    image = payload.get("image", "")
    session_id = payload.get("sessionId", "default")
    hand_side = payload.get("handSide", "left")

    if hand_side not in {"left", "right"}:
        raise HTTPException(status_code=400, detail="handSide must be left or right.")
    if not image:
        raise HTTPException(status_code=400, detail="Missing image.")

    if "," in image:
        image = image.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image data.") from exc

    fitter = get_live_fitter(session_id, hand_side)
    return fitter.fit(image_bytes)


def verify_upload_token(upload_token):
    expected_token = os.getenv("MANO_UPLOAD_TOKEN", "")
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="MANO_UPLOAD_TOKEN is not configured.",
        )
    if upload_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid upload token.")


@app.put("/upload/{filename}")
async def upload_data_file(
    filename: str,
    request: Request,
    x_mano_upload_token: str = Header(default=""),
):
    if filename not in DATA_FILES:
        raise HTTPException(status_code=404, detail="Unsupported upload file.")

    verify_upload_token(x_mano_upload_token)

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Upload body is empty.")

    upload_dir = get_upload_dir()
    upload_dir.mkdir(parents=True, exist_ok=True)
    final_path = upload_dir / filename
    temp_path = upload_dir / f".{filename}.tmp"
    temp_path.write_bytes(body)
    temp_path.replace(final_path)

    return {"ok": True, "filename": filename, "bytes": len(body)}


@app.get("/current_hand_state.json")
async def current_hand_state():
    return serve_data_file("current_hand_state.json", "application/json")


@app.head("/current_hand_state.json")
async def current_hand_state_head():
    path = get_file_path("current_hand_state.json")
    if not path.exists():
        raise HTTPException(status_code=404)

    return Response(headers={"Cache-Control": "no-store"})


@app.get("/current_hand_mesh.obj")
async def current_hand_mesh():
    return serve_data_file("current_hand_mesh.obj", "text/plain")


@app.head("/current_hand_mesh.obj")
async def current_hand_mesh_head():
    path = get_file_path("current_hand_mesh.obj")
    if not path.exists():
        raise HTTPException(status_code=404)

    return Response(headers={"Cache-Control": "no-store"})
