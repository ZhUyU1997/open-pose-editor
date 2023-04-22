import pathlib

import requests

# Get the base directory of the extension
try:
    root_path = pathlib.Path(__file__).resolve().parents[0]
except NameError:
    import inspect

    root_path = pathlib.Path(inspect.getfile(lambda: None)).resolve().parents[0]


def download(url: str, dest: pathlib.Path):
    """Download a file"""
    try:
        with requests.get(url, stream=True) as r:
            with open(dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024):
                    f.write(chunk)
    except requests.exceptions.RequestException as e:
        print(e)


def main():
    # MediaPipe Pose files
    MEDIAPIPE_POSE_VERSION = "0.5.1675469404"
    mediapipe_dir = root_path / "downloads" / "pose" / MEDIAPIPE_POSE_VERSION
    mediapipe_dir.mkdir(mode=0o755, parents=True, exist_ok=True)

    for file_name in [
        "pose_landmark_full.tflite",
        "pose_web.binarypb",
        "pose_solution_packed_assets.data",
        "pose_solution_simd_wasm_bin.wasm",
        "pose_solution_packed_assets_loader.js",
        "pose_solution_simd_wasm_bin.js",
    ]:
        file_path = mediapipe_dir / file_name
        if file_path.exists():
            continue
        url = f"https://cdn.jsdelivr.net/npm/@mediapipe/pose@{MEDIAPIPE_POSE_VERSION}/{file_name}"
        print(f"Downloading {file_name}...")
        download(url, file_path)


main()
