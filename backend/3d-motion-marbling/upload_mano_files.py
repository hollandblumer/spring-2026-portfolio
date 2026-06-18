import argparse
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


FILES = ("current_hand_state.json", "current_hand_mesh.obj")


def upload_file(api_base, token, path):
    data = path.read_bytes()
    request = Request(
        f"{api_base.rstrip('/')}/upload/{path.name}",
        data=data,
        method="PUT",
        headers={
            "Content-Type": "application/octet-stream",
            "X-MANO-Upload-Token": token,
        },
    )
    with urlopen(request, timeout=8) as response:
        response.read()


def main():
    parser = argparse.ArgumentParser(
        description="Upload live MANO files to the hosted marbling API.",
    )
    parser.add_argument("--api", required=True, help="Hosted API base URL.")
    parser.add_argument("--token", required=True, help="MANO upload token.")
    parser.add_argument(
        "--data-dir",
        default="/Users/hollandblumer/Desktop/hand",
        help="Folder containing current_hand_state.json and current_hand_mesh.obj.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=0.12,
        help="Seconds between upload checks.",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir).expanduser()
    last_uploaded = {}
    print(f"Watching {data_dir} and uploading to {args.api}")

    while True:
        for filename in FILES:
            path = data_dir / filename
            if not path.exists():
                continue

            modified_at = path.stat().st_mtime_ns
            if last_uploaded.get(filename) == modified_at:
                continue

            try:
                upload_file(args.api, args.token, path)
                last_uploaded[filename] = modified_at
                print(f"Uploaded {filename}")
            except (HTTPError, URLError, TimeoutError) as err:
                print(f"Upload failed for {filename}: {err}")

        time.sleep(args.interval)


if __name__ == "__main__":
    main()
