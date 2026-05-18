import os
import io
import json
from pathlib import Path
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

load_dotenv()


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


#creates the main engine for this
app = FastAPI()

#gives the okay for python to communicate with the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured for Gemini analysis.",
        )

    return genai.Client(api_key=api_key)

BASE_DIR = Path(__file__).resolve().parent
REFERENCES_DIR = BASE_DIR / "references"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_UPLOAD_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MIN_IMAGE_DIMENSION = 64
MAX_IMAGE_DIMENSION = 6000


@app.get("/health")
async def health():
    return {
        "ok": True,
        "geminiConfigured": bool(os.getenv("GEMINI_API_KEY")),
        "allowedOrigins": get_allowed_origins(),
    }

# this connects the names in my manifest to the code samples the frontend already knows how to show
REFERENCE_SAMPLE_IDS = {
    "wavy-lines": ["ink-bleed", "metaballs"],
    "converging-spiral": ["logarithmic-spiral"],
    "envelope-sine-wave": ["envelope-sine"],
    "warped-svg-text": ["svg"],
    "contour-lines": ["contour-lines"],
    "egg-warp": ["egg-warp"],
    "organic-text-fill": ["organic-text-fill"],
    "eye-circle-packing": ["eye-pattern"],
    "fractal-trees": ["fractal-trees"],
    "spherical-bent-3d-text": ["spherical-3d-text"],
}

# this makes one clean list of sample ids gemini is allowed to return
ALLOWED_SAMPLE_IDS = {
    sample_id
    for sample_ids in REFERENCE_SAMPLE_IDS.values()
    for sample_id in sample_ids
}

SIFT_MATCH_RATIO = 0.75
SIFT_MIN_SCORE = 0.03
SIFT_MIN_GOOD_MATCHES = 6


# going through my references folder getting all the code I generated so far
def load_references():
    context = ""

    # checking if the folder actually exists so it doesnt crash
    if REFERENCES_DIR.exists():
        # looping through all the folders one by one
        for reference_path in sorted(REFERENCES_DIR.rglob("*")):
            # only grab the files that have these file extensions
            if reference_path.suffix in (".js", ".txt", ".glsl", ".html"):
                # f is a file object here
                # reading all the relevant files and concatening it to a megafile for Google to ultimately read
                with open(reference_path, "r") as f:
                    # adding a header tag to know which one to look at
                    label = reference_path.relative_to(REFERENCES_DIR)
                    context += f"\n--- Reference: {label} ---\n{f.read()}\n"
    return context


def load_reference_manifest():
    # loading the manifest so gemini knows the categories of things I already have references for
    manifest_path = REFERENCES_DIR / "manifest.json"
    if not manifest_path.exists():
        return {"features": []}

    with open(manifest_path, "r") as f:
        return json.load(f)


def compress_image(raw_bytes, max_size=1024, quality=85):
    # keeping images smaller makes gemini faster and avoids sending giant uploads
    img = Image.open(io.BytesIO(raw_bytes))

    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    img.convert("RGB").save(buffer, format="JPEG", quality=quality)
    return buffer.getvalue()


def validate_uploaded_image(file, raw_bytes):
    # never trust the browser accept field; check the actual upload on the server too
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Upload was empty.")

    if len(raw_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Please upload an image under 12MB.",
        )

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.verify()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="That file could not be read as a valid image.",
        ) from exc

    image = Image.open(io.BytesIO(raw_bytes))
    image_format = image.format

    if image_format not in ALLOWED_UPLOAD_FORMATS:
        raise HTTPException(
            status_code=415,
            detail=f"Please upload a JPG, PNG, or WebP image. Detected: {image_format or 'unknown'}.",
        )

    # animated images behave more like video, so reject them for this poster analyzer
    if getattr(image, "is_animated", False):
        raise HTTPException(
            status_code=415,
            detail="Animated images are not supported. Please upload a still poster image.",
        )

    width, height = image.size
    if min(width, height) < MIN_IMAGE_DIMENSION:
        raise HTTPException(
            status_code=400,
            detail="Image is too small to analyze.",
        )

    if max(width, height) > MAX_IMAGE_DIMENSION:
        raise HTTPException(
            status_code=413,
            detail="Image dimensions are too large. Please upload a smaller poster image.",
        )

    return image


def list_reference_images():
    # this lets us check which visual examples are sitting in the references folder
    if not REFERENCES_DIR.exists():
        return []

    return [
        str(path.relative_to(REFERENCES_DIR))
        for path in sorted(REFERENCES_DIR.rglob("*"))
        if path.suffix.lower() in IMAGE_EXTENSIONS
    ]


def load_visual_reference_parts(reference_manifest):
    # this turns manifest image files into labeled image parts for gemini
    parts = []

    for feature in reference_manifest.get("features", []):
        feature_id = feature.get("id")
        label = feature.get("label")

        for image_path in feature.get("images", []):
            full_path = REFERENCES_DIR / image_path
            if not full_path.exists():
                continue

            with open(full_path, "rb") as f:
                compressed = compress_image(f.read(), max_size=768, quality=82)

            parts.append(
                f"Visual Reference: {label} ({feature_id}) from {image_path}"
            )
            parts.append(types.Part.from_bytes(data=compressed, mime_type="image/jpeg"))

    return parts


def image_bytes_to_gray(raw_bytes):
    # opencv reads images as arrays, and sift works on grayscale
    encoded = np.frombuffer(raw_bytes, np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        return None

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape[:2]
    max_size = 900

    # smaller images keep this fast while preserving the main visual structure
    if max(height, width) > max_size:
        scale = max_size / max(height, width)
        gray = cv2.resize(
            gray,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA,
        )

    return gray


def feature_by_image_path(reference_manifest):
    # this lets the matcher know which reference image belongs to which manifest feature
    lookup = {}

    for feature in reference_manifest.get("features", []):
        for image_path in feature.get("images", []):
            lookup[image_path] = feature

    return lookup


def match_reference_images(raw_bytes, limit=5):
    # old-school local computer vision: SIFT keypoints + Lowe ratio test
    uploaded_gray = image_bytes_to_gray(raw_bytes)
    if uploaded_gray is None:
        return []

    sift = cv2.SIFT_create()
    uploaded_keypoints, uploaded_descriptors = sift.detectAndCompute(
        uploaded_gray,
        None,
    )

    if uploaded_descriptors is None or len(uploaded_keypoints) == 0:
        return []

    manifest = load_reference_manifest()
    feature_lookup = feature_by_image_path(manifest)
    matcher = cv2.BFMatcher(cv2.NORM_L2)
    matches = []

    for image_path in list_reference_images():
        feature = feature_lookup.get(image_path)
        if not feature:
            continue

        full_path = REFERENCES_DIR / image_path
        with open(full_path, "rb") as f:
            reference_gray = image_bytes_to_gray(f.read())

        if reference_gray is None:
            continue

        reference_keypoints, reference_descriptors = sift.detectAndCompute(
            reference_gray,
            None,
        )

        if reference_descriptors is None or len(reference_keypoints) == 0:
            continue

        raw_matches = matcher.knnMatch(
            reference_descriptors,
            uploaded_descriptors,
            k=2,
        )
        good_matches = []

        for pair in raw_matches:
            if len(pair) < 2:
                continue

            best, second_best = pair
            if best.distance < SIFT_MATCH_RATIO * second_best.distance:
                good_matches.append(best)

        reference_count = max(1, len(reference_keypoints))
        score = min(1, len(good_matches) / reference_count)

        matches.append(
            {
                "referenceId": feature.get("id"),
                "label": feature.get("label"),
                "image": image_path,
                "score": round(score, 4),
                "goodMatches": len(good_matches),
                "referenceKeypoints": len(reference_keypoints),
                "uploadedKeypoints": len(uploaded_keypoints),
                "sampleIds": REFERENCE_SAMPLE_IDS.get(feature.get("id"), []),
            }
        )

    matches.sort(key=lambda match: (match["score"], match["goodMatches"]), reverse=True)
    return matches[:limit]


def sift_found_a_good_match(matches):
    # if sift finds usable local matches, we can skip gemini and save tokens
    if not matches:
        return False

    top_match = matches[0]
    return (
        top_match["score"] >= SIFT_MIN_SCORE
        and top_match["goodMatches"] >= SIFT_MIN_GOOD_MATCHES
    )


def sift_matches_to_analysis(matches):
    # this converts sift matches into the same shape the frontend already uses
    elements = []

    for index, match in enumerate(matches[:3]):
        if (
            match["score"] < SIFT_MIN_SCORE
            or match["goodMatches"] < SIFT_MIN_GOOD_MATCHES
        ):
            continue

        samples = [
            {
                "title": f"{sample_id} HTML",
                "sampleId": sample_id,
                "tall": True,
            }
            for sample_id in match.get("sampleIds", [])
        ]

        if not samples:
            continue

        elements.append(
            {
                "id": f"sift-{match['referenceId']}",
                "label": match["label"],
                # sift is matching the whole reference image for now, so place these as suggested callouts
                "x": f"{50 + index * 8:.1f}%",
                "y": f"{42 + index * 10:.1f}%",
                "confidence": match["score"],
                "referenceId": match["referenceId"],
                "details": {
                    "description": (
                        f"SIFT matched this upload to {match['image']} with "
                        f"{match['goodMatches']} local feature matches."
                    ),
                    "samples": samples,
                },
            }
        )

    return {
        "source": "sift",
        "summary": "Matched locally with SIFT. Gemini was not used.",
        "siftMatches": matches,
        "elements": elements,
    }


def normalize_percent(value, fallback):
    # gemini can send 50 or "50%" so this turns both into the same frontend format
    if isinstance(value, str):
        value = value.strip().replace("%", "")

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        numeric_value = fallback

    return f"{min(100, max(0, numeric_value)):.1f}%"


def normalize_analysis(reading):
    # this cleans up gemini's response so the frontend can use it like my built-in poster elements
    if not isinstance(reading, dict):
        return {"elements": [], "summary": ""}

    # gemini should send elements, but this keeps the app from crashing if it sends something weird
    raw_elements = reading.get("elements", [])
    if not isinstance(raw_elements, list):
        raw_elements = []

    elements = []

    for index, element in enumerate(raw_elements[:8]):
        if not isinstance(element, dict):
            continue

        # only keep code samples that exist in the frontend
        samples = []
        for raw_sample in element.get("samples", []):
            if not isinstance(raw_sample, dict):
                continue

            sample_id = raw_sample.get("sampleId")
            if sample_id not in ALLOWED_SAMPLE_IDS:
                continue

            samples.append(
                {
                    "title": raw_sample.get("title") or f"{sample_id} HTML",
                    "sampleId": sample_id,
                    "tall": bool(raw_sample.get("tall", True)),
                }
            )

        reference_id = element.get("referenceId")
        # if gemini gives a reference id but forgets samples, fill them in from my manifest map
        if not samples and reference_id in REFERENCE_SAMPLE_IDS:
            samples = [
                {
                    "title": f"{sample_id} HTML",
                    "sampleId": sample_id,
                    "tall": True,
                }
                for sample_id in REFERENCE_SAMPLE_IDS[reference_id]
            ]

        if not samples:
            continue

        # this makes the detected element match the DetectedElement shape in posters.ts
        label = element.get("label") or "Detected Element"
        description = element.get("description") or element.get("reason") or ""

        elements.append(
            {
                "id": element.get("id") or f"uploaded-element-{index + 1}",
                "label": label,
                "x": normalize_percent(element.get("x"), 50),
                "y": normalize_percent(element.get("y"), 50),
                "confidence": element.get("confidence"),
                "referenceId": reference_id,
                "details": {
                    "description": description,
                    "samples": samples,
                },
            }
        )

    return {
        "summary": reading.get("summary", ""),
        "elements": elements,
    }


@app.get("/references")
async def references():
    # quick debug endpoint so we can see what the backend thinks the library contains
    manifest = load_reference_manifest()
    manifest_images = {
        image
        for feature in manifest.get("features", [])
        for image in feature.get("images", [])
    }
    folder_images = list_reference_images()

    return {
        "manifest": manifest,
        "folder_images": folder_images,
        "unmapped_images": [
            image for image in folder_images if image not in manifest_images
        ],
    }


@app.post("/match-references")
async def match_references(file:UploadFile = File(...)):
    # this checks the uploaded image against my reference images without using gemini
    raw_bytes = await file.read()
    validate_uploaded_image(file, raw_bytes)
    return {
        "algorithm": "SIFT",
        "matches": match_reference_images(raw_bytes),
    }

#sending info to the server
@app.post("/analyze")
async def analyze_poster(file:UploadFile = File(...)):
    # wait for the full file to be uploaded to the RAM (bytes)
    #image_data = await file.read()
    raw_bytes = await file.read()
    validate_uploaded_image(file, raw_bytes)

    # make the uploaded poster a smaller jpeg before sending it to gemini
    compressed_bytes = compress_image(raw_bytes)
    sift_matches = match_reference_images(raw_bytes)

    if sift_found_a_good_match(sift_matches):
        return sift_matches_to_analysis(sift_matches)

    reference_manifest = load_reference_manifest()
    personal_context = load_references()
    visual_reference_parts = load_visual_reference_parts(reference_manifest)

    #prompt the gemini tool
    instruction = (
        "You are analyzing design elements of this poster basically performing a forensic"
        "deconstruction of a poster. Identify different patterns in the poster that can be replicated with equations and or made with creative tools "
        "1. Identify structural patterns (grids, flow fields, recursion) that can be "
        "modeled with mathematical equations. "
        "2. Map these patterns to creative coding tools like p5.js, Three.js, or GLSL. "
        "3. Use my references as the primary methodology for your implementation "
        "logic. If a pattern matches a snippet in the library, prioritize that approach. "
        "Return only JSON with this shape: "
        "{"
        "\"summary\":\"short overall reading\","
        "\"elements\":["
        "{"
        "\"id\":\"kebab-case-id\","
        "\"label\":\"short callout label\","
        "\"x\":50,"
        "\"y\":50,"
        "\"confidence\":0.0,"
        "\"referenceId\":\"one manifest feature id\","
        "\"description\":\"why this visual element matches\","
        "\"samples\":[{\"title\":\"HTML\",\"sampleId\":\"one allowed sample id\",\"tall\":true}]"
        "}"
        "]"
        "}. "
        "Coordinates x and y must be percentages from 0 to 100 locating the feature center in the image. "
        "Only use sampleId values from this allowed list: "
        f"{sorted(ALLOWED_SAMPLE_IDS)}."
    )

    client = get_gemini_client()
    response = client.models.generate_content(
        model = 'gemini-2.5-flash',
        contents = [
            f"Reference Manifest:\n{json.dumps(reference_manifest)}",
            f"Local SIFT pre-match results:\n{json.dumps(sift_matches)}",
            f"Reference Library:\n{personal_context}",
            *visual_reference_parts,
            # this tells gemini we are sending data that isn't just text
            types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg"),
            "Deconstruct this poster. Detect visual elements similar to the reference manifest and return the JSON blueprint."
        ],
        # gemini returns a JSON object for ui
        config = {
            # these are keys specific to gemini sdk
            "response_mime_type": "application/json",
            "system_instruction": instruction
        }

    )

    gemini_analysis = normalize_analysis(response.parsed)
    gemini_analysis["source"] = "gemini"
    gemini_analysis["siftMatches"] = sift_matches
    return gemini_analysis
