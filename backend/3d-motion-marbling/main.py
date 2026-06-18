import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response


BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parents[1]
DEFAULT_DATA_DIR = REPO_ROOT / "public" / "3d-motion-marbling"
DEFAULT_UPLOAD_DIR = Path(os.getenv("MANO_UPLOAD_DIR", "/tmp/3d-motion-marbling"))
DATA_FILES = {
    "current_hand_state.json": "application/json",
    "current_hand_mesh.obj": "text/plain",
}

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


app = FastAPI(title="3D Motion Marbling API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["GET", "HEAD", "PUT"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    data_dir = get_data_dir()
    upload_dir = get_upload_dir()
    return {
        "ok": True,
        "dataDir": str(data_dir),
        "uploadDir": str(upload_dir),
        "hasState": get_file_path("current_hand_state.json").exists(),
        "hasMesh": get_file_path("current_hand_mesh.obj").exists(),
        "hasUploadedState": (upload_dir / "current_hand_state.json").exists(),
        "hasUploadedMesh": (upload_dir / "current_hand_mesh.obj").exists(),
        "allowedOrigins": get_allowed_origins(),
    }


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
