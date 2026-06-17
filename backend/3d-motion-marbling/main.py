import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response


BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parents[1]
DEFAULT_DATA_DIR = REPO_ROOT / "public" / "3d-motion-marbling"

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


def serve_data_file(filename, media_type):
    path = get_data_dir() / filename
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{filename} was not found in {get_data_dir()}",
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
    allow_methods=["GET", "HEAD"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    data_dir = get_data_dir()
    return {
        "ok": True,
        "dataDir": str(data_dir),
        "hasState": (data_dir / "current_hand_state.json").exists(),
        "hasMesh": (data_dir / "current_hand_mesh.obj").exists(),
        "allowedOrigins": get_allowed_origins(),
    }


@app.get("/current_hand_state.json")
async def current_hand_state():
    return serve_data_file("current_hand_state.json", "application/json")


@app.head("/current_hand_state.json")
async def current_hand_state_head():
    path = get_data_dir() / "current_hand_state.json"
    if not path.exists():
        raise HTTPException(status_code=404)

    return Response(headers={"Cache-Control": "no-store"})


@app.get("/current_hand_mesh.obj")
async def current_hand_mesh():
    return serve_data_file("current_hand_mesh.obj", "text/plain")


@app.head("/current_hand_mesh.obj")
async def current_hand_mesh_head():
    path = get_data_dir() / "current_hand_mesh.obj"
    if not path.exists():
        raise HTTPException(status_code=404)

    return Response(headers={"Cache-Control": "no-store"})
