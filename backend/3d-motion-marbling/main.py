import json
import os
import time
import traceback
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
FINGER_BONE_PAIRS = (
    (0, 1),
    (1, 2),
    (2, 3),
    (3, 4),
    (0, 5),
    (5, 6),
    (6, 7),
    (7, 8),
    (0, 9),
    (9, 10),
    (10, 11),
    (11, 12),
    (0, 13),
    (13, 14),
    (14, 15),
    (15, 16),
    (0, 17),
    (17, 18),
    (18, 19),
    (19, 20),
)
DATA_FILES = {
    "current_hand_state.json": "application/json",
    "current_hand_mesh.obj": "text/plain",
}
LIVE_FITTERS = {}
MODELS_READY = False
FIT_RATE_LIMITS = {}
FIT_MONTHLY_USAGE = {}

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

    configured = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
    return list(dict.fromkeys([*DEFAULT_ALLOWED_ORIGINS, *configured]))


def get_int_env(name, default):
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def get_bool_env(name, default=True):
    value = os.getenv(name, "")
    if not value:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def get_client_key(request):
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def verify_fit_access(request):
    if not get_bool_env("MANO_FIT_ENABLED", True):
        raise HTTPException(
            status_code=503,
            detail="MANO fitting is disabled.",
        )

    expected_token = os.getenv("MANO_FIT_TOKEN", "").strip()
    if expected_token:
        provided_token = request.headers.get("x-mano-fit-token", "")
        if provided_token != expected_token:
            raise HTTPException(status_code=401, detail="Invalid MANO fit token.")

    now = time.time()
    client_key = get_client_key(request)
    per_minute_limit = get_int_env("MANO_FIT_RATE_LIMIT_PER_MINUTE", 120)
    if per_minute_limit > 0:
        window_start, count = FIT_RATE_LIMITS.get(client_key, (now, 0))
        if now - window_start >= 60:
            window_start, count = now, 0
        if count >= per_minute_limit:
            raise HTTPException(
                status_code=429,
                detail="MANO fitting rate limit reached. Try again later.",
            )
        FIT_RATE_LIMITS[client_key] = (window_start, count + 1)

    monthly_limit = get_int_env("MANO_FIT_MONTHLY_LIMIT", 3000)
    if monthly_limit > 0:
        month_key = time.strftime("%Y-%m", time.gmtime(now))
        count = FIT_MONTHLY_USAGE.get(month_key, 0)
        if count >= monthly_limit:
            raise HTTPException(
                status_code=429,
                detail="Monthly MANO fitting limit reached.",
            )
        FIT_MONTHLY_USAGE[month_key] = count + 1


def get_fit_limit_status():
    month_key = time.strftime("%Y-%m", time.gmtime())
    return {
        "enabled": get_bool_env("MANO_FIT_ENABLED", True),
        "requiresToken": bool(os.getenv("MANO_FIT_TOKEN", "").strip()),
        "rateLimitPerMinute": get_int_env("MANO_FIT_RATE_LIMIT_PER_MINUTE", 120),
        "monthlyLimit": get_int_env("MANO_FIT_MONTHLY_LIMIT", 3000),
        "monthlyUsed": FIT_MONTHLY_USAGE.get(month_key, 0),
        "month": month_key,
    }


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


def get_credentials_status():
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    return {
        "googleApplicationCredentials": credentials_path,
        "credentialsFileExists": bool(
            credentials_path and Path(credentials_path).exists()
        ),
        "secretsDirExists": Path("/etc/secrets").exists(),
        "gcpServiceAccountJsonEnvPresent": bool(
            os.getenv("GCP_SERVICE_ACCOUNT_JSON", "").strip()
        ),
    }


def get_storage_client(storage):
    service_account_json = os.getenv("GCP_SERVICE_ACCOUNT_JSON", "").strip()
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if not service_account_json and credentials_path.startswith("{"):
        service_account_json = credentials_path

    if service_account_json:
        from google.oauth2 import service_account

        service_account_info = json.loads(service_account_json)
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info
        )
        return storage.Client(
            credentials=credentials,
            project=service_account_info.get("project_id"),
        )

    return storage.Client()


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
        client = get_storage_client(storage)
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

    return np, torch, ManoLayer


def landmarks_to_fit_target(landmarks, torch, device):
    pts = []
    for lm in landmarks:
        pts.append(
            [
                float(lm.get("x", 0)),
                -float(lm.get("y", 0)),
                float(lm.get("z", 0)),
            ]
        )
    pts = torch.tensor(pts, dtype=torch.float32, device=device)
    root = pts[0].clone()
    scale = (pts - root).norm(dim=1).mean() + 1e-8
    target = (pts - root) / scale
    return target, root, scale


def mano_joints_to_mediapipe_order(joints):
    # manopth already returns 21 joints in MediaPipe-compatible order:
    # wrist, thumb, index, middle, ring, pinky, including fingertip vertices.
    j = joints[0, :21, :]
    j = j - j[0]
    j = j / (j.norm(dim=1).mean() + 1e-8)
    return j


def landmarks_to_json(landmarks):
    return [
        {
            "x": float(lm.get("x", 0)),
            "y": float(lm.get("y", 0)),
            "z": float(lm.get("z", 0)),
        }
        for lm in landmarks
    ]


def project_mano_vertices(verts, joints, trans, mp_root, mp_scale):
    mano_joints = joints[0, :21, :]
    mano_root = mano_joints[0, :]
    mano_scale = (mano_joints - mano_root).norm(dim=1).mean() + 1e-8
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
        np, torch, ManoLayer = lazy_import_mano_runtime()
        self.np = np
        self.torch = torch
        torch.set_num_threads(int(os.getenv("MANO_TORCH_THREADS", "1")))
        self.device = torch.device(os.getenv("MANO_DEVICE", "cpu"))
        self.iterations = int(os.getenv("MANO_ITERATIONS", "16"))
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
        self.finger_bone_pairs = torch.tensor(
            FINGER_BONE_PAIRS,
            dtype=torch.long,
            device=self.device,
        )
        self.pose = torch.zeros(1, 48, device=self.device, requires_grad=True)
        self.shape = torch.zeros(1, 10, device=self.device, requires_grad=True)
        self.trans = torch.zeros(1, 3, device=self.device, requires_grad=True)
        self.optimizer = torch.optim.Adam([self.pose, self.shape, self.trans], lr=0.012)

    def fit_landmarks(self, landmarks):
        if len(landmarks) < 21:
            raise HTTPException(status_code=400, detail="Expected 21 hand landmarks.")

        target, mp_root, mp_scale = landmarks_to_fit_target(
            landmarks[:21],
            self.torch,
            self.device,
        )
        weights = self.torch.ones(21, 1, device=self.device)
        weights[[4, 8, 12, 16, 20]] = 4.0
        weights[[1, 5, 9, 13, 17]] = 2.0
        weights[[2, 3, 6, 7, 10, 11, 14, 15, 18, 19]] = 2.6

        frame_pose = self.pose.detach().clone()
        frame_shape = self.shape.detach().clone()
        frame_trans = self.trans.detach().clone()

        for _ in range(self.iterations):
            self.optimizer.zero_grad()
            verts, joints = self.mano_layer(self.pose, self.shape)
            pred = mano_joints_to_mediapipe_order(joints) + self.trans

            joint_delta = pred - target
            bone_from = self.finger_bone_pairs[:, 0]
            bone_to = self.finger_bone_pairs[:, 1]
            pred_bones = pred[bone_to] - pred[bone_from]
            target_bones = target[bone_to] - target[bone_from]
            pred_dirs = pred_bones[:, :2] / (
                pred_bones[:, :2].norm(dim=1, keepdim=True) + 1e-8
            )
            target_dirs = target_bones[:, :2] / (
                target_bones[:, :2].norm(dim=1, keepdim=True) + 1e-8
            )
            pred_lengths = pred_bones.norm(dim=1)
            target_lengths = target_bones.norm(dim=1)

            loss = (weights * (joint_delta ** 2)).mean()
            loss = loss + 0.7 * (weights * (joint_delta[:, :2] ** 2)).mean()
            loss = loss + 0.75 * ((pred_dirs - target_dirs) ** 2).mean()
            loss = loss + 0.35 * ((pred_lengths - target_lengths) ** 2).mean()
            loss = loss + 0.0012 * (self.pose ** 2).mean()
            loss = loss + 0.001 * (self.shape ** 2).mean()
            loss = loss + 0.00045 * ((self.pose - frame_pose) ** 2).mean()
            loss = loss + 0.0006 * ((self.trans - frame_trans) ** 2).mean()

            loss.backward()
            self.optimizer.step()

        with self.torch.no_grad():
            self.pose.mul_(0.96).add_(frame_pose, alpha=0.04)
            self.shape.mul_(0.98).add_(frame_shape, alpha=0.02)
            self.trans.mul_(0.9).add_(frame_trans, alpha=0.1)

        verts, joints = self.mano_layer(self.pose, self.shape)
        return {
            "hasHand": True,
            "landmarks": landmarks_to_json(landmarks[:21]),
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
        max_fitters = int(os.getenv("MANO_MAX_FITTERS", "2"))
        while len(LIVE_FITTERS) >= max_fitters:
            LIVE_FITTERS.pop(next(iter(LIVE_FITTERS)))
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
    model_error = ""
    try:
        mano_root = ensure_mano_models()
    except HTTPException as exc:
        mano_root = get_mano_root()
        model_error = str(exc.detail)

    return {
        "ok": not model_error,
        "runtimeMode": "browser-landmarks-python-mano",
        "activeFitters": len(LIVE_FITTERS),
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
        "manoModelError": model_error,
        "gcsManoBucket": os.getenv("GCS_MANO_BUCKET", ""),
        "gcpCredentials": get_credentials_status(),
        "allowedOrigins": get_allowed_origins(),
        "fitLimits": get_fit_limit_status(),
    }


@app.post("/fit_landmarks")
async def fit_landmarks(request: Request):
    try:
        verify_fit_access(request)
        payload = await request.json()
        landmarks = payload.get("landmarks", [])
        session_id = payload.get("sessionId", "default")
        hand_side = payload.get("handSide", "left")

        if hand_side not in {"left", "right"}:
            raise HTTPException(
                status_code=400,
                detail="handSide must be left or right.",
            )
        if not isinstance(landmarks, list):
            raise HTTPException(status_code=400, detail="Missing landmarks.")

        fitter = get_live_fitter(session_id, hand_side)
        return fitter.fit_landmarks(landmarks)
    except HTTPException:
        raise
    except Exception as exc:
        print(traceback.format_exc(), flush=True)
        raise HTTPException(
            status_code=503,
            detail=f"MANO landmark fit failed: {type(exc).__name__}: {exc}",
        ) from exc


@app.post("/fit_frame")
async def fit_frame():
    raise HTTPException(
        status_code=410,
        detail="fit_frame was replaced by browser landmark fitting at /fit_landmarks.",
    )


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
