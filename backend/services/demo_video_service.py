"""
Demo Maker video service.
Handles slideshow creation and voiceover mixing for the /demo-maker tool.
Imports music mixing from video_service — no logic duplication.
"""
from __future__ import annotations
import json, os, shutil, subprocess, uuid
from pathlib import Path

# ── Resolution presets ──────────────────────────────────────────────────────

FORMAT_DIMS: dict[str, tuple[int, int]] = {
    "16:9": (1920, 1080),
    "1:1":  (1080, 1080),
    "9:16": (1080, 1920),
}

XFADE_TYPES: dict[str, str] = {
    "Fade":  "fade",
    "Slide": "slideleft",
    "Zoom":  "smoothup",
}

_T_DUR = 0.5  # transition overlap (seconds)


# ── Media probing ────────────────────────────────────────────────────────────

def get_media_duration(path: str) -> float:
    """Return duration in seconds of any audio/video file via ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_format", path],
        capture_output=True, text=True,
    )
    try:
        return float(json.loads(result.stdout)["format"]["duration"])
    except Exception:
        return 0.0


# ── Audio helpers ────────────────────────────────────────────────────────────

def concat_audio_files(audio_paths: list[str], output_path: str) -> str:
    """Concatenate multiple audio clips into a single file."""
    if len(audio_paths) == 1:
        shutil.copy(audio_paths[0], output_path)
        return output_path

    n = len(audio_paths)
    inputs: list[str] = []
    for p in audio_paths:
        inputs += ["-i", p]

    concat_in = "".join(f"[{i}:a]" for i in range(n))
    result = subprocess.run(
        ["ffmpeg", "-y"] + inputs + [
            "-filter_complex", f"{concat_in}concat=n={n}:v=0:a=1[aout]",
            "-map", "[aout]",
            "-c:a", "aac", "-b:a", "128k",
            output_path,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audio concat failed:\n{result.stderr[-1000:]}")
    return output_path


def adjust_audio_tempo(
    audio_path: str,
    target_duration: float,
    current_duration: float,
    output_path: str,
) -> str:
    """
    Stretch/compress audio to match target_duration using FFmpeg atempo.
    Clamped to 0.85x–1.15x to avoid robotic artefacts.
    Falls back to original if ratio is outside range or negligibly different.
    """
    if current_duration <= 0 or target_duration <= 0:
        shutil.copy(audio_path, output_path)
        return output_path

    ratio = target_duration / current_duration
    ratio = max(0.85, min(1.15, ratio))

    if abs(ratio - 1.0) < 0.02:          # < 2% difference — skip
        shutil.copy(audio_path, output_path)
        return output_path

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", audio_path,
         "-filter:a", f"atempo={ratio:.4f}",
         "-c:a", "aac", "-b:a", "128k", output_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        shutil.copy(audio_path, output_path)
    return output_path


# ── Slideshow video builder ──────────────────────────────────────────────────

def _xfade_filter(
    n: int,
    durations: list[float],
    xfade_type: str,
    W: int,
    H: int,
) -> tuple[str, str]:
    """
    Build FFmpeg filter_complex for an N-photo slideshow with xfade transitions.
    Returns (filter_complex_string, output_label).
    """
    # Scale each input to target resolution with letter-boxing
    scale_parts = [
        f"[{i}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,"
        f"setsar=1,fps=25,format=yuv420p[v{i}]"
        for i in range(n)
    ]

    if n == 1:
        return scale_parts[0], "v0"

    xfade_parts: list[str] = []
    cumulative = 0.0
    prev = "v0"

    for i in range(1, n):
        cumulative += max(durations[i - 1], 1.0) - _T_DUR
        cumulative = max(cumulative, 0.0)
        out = f"vf{i}" if i < n - 1 else "vout"
        xfade_parts.append(
            f"[{prev}][v{i}]xfade=transition={xfade_type}:"
            f"duration={_T_DUR}:offset={cumulative:.3f}[{out}]"
        )
        prev = out

    fc = ";".join(scale_parts + xfade_parts)
    return fc, "vout"


def build_slideshow_video(
    photo_paths: list[str],
    durations: list[float],
    transition: str,
    export_format: str,
    output_path: str,
) -> str:
    """
    Render a slideshow from *photo_paths* with per-slide *durations* and
    smooth xfade *transition*.  Saves to *output_path*.
    """
    W, H = FORMAT_DIMS.get(export_format, (1920, 1080))
    xtype = XFADE_TYPES.get(transition, "fade")
    n = len(photo_paths)

    cmd = ["ffmpeg", "-y"]
    for i, path in enumerate(photo_paths):
        d = max(float(durations[i]), 1.5)
        # Give extra time so the last frame has room for the transition fade-out
        cmd += ["-loop", "1", "-t", f"{d + _T_DUR:.3f}", "-i", path]

    fc, out_label = _xfade_filter(n, durations, xtype, W, H)

    cmd += [
        "-filter_complex", fc,
        "-map", f"[{out_label}]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Slideshow build failed:\n{result.stderr[-2000:]}")
    return output_path


# ── Combine slideshow video + audio ─────────────────────────────────────────

def combine_video_audio(
    video_path: str,
    audio_path: str,
    output_path: str,
) -> str:
    """Merge a mute video with an audio track.  Audio wins for duration (-shortest)."""
    result = subprocess.run(
        ["ffmpeg", "-y",
         "-i", video_path,
         "-i", audio_path,
         "-c:v", "libx264", "-preset", "fast", "-crf", "23",
         "-c:a", "aac", "-b:a", "128k",
         "-shortest", "-movflags", "+faststart",
         output_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Video/audio combine failed:\n{result.stderr[-1000:]}")
    return output_path


# ── Voiceover mixing ─────────────────────────────────────────────────────────

def mix_voiceover_with_video(
    video_path: str,
    narration_path: str,
    audio_mode: str,          # "mute_original" | "keep_low"
    original_volume: float,   # 0.0 – 1.0
    output_path: str,
) -> str:
    """
    Overlay narration audio onto an existing video.

    mute_original — replace video audio with narration entirely.
    keep_low      — blend original (at original_volume) with narration.
    Falls back to mute_original on any FFmpeg error.
    """
    if audio_mode == "mute_original":
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path, "-i", narration_path,
            "-map", "0:v", "-map", "1:a",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-shortest", output_path,
        ]
    else:
        vol = max(0.0, min(1.0, original_volume))
        fc = (
            f"[0:a]volume={vol:.2f}[orig];"
            f"[1:a]volume=1.0[narr];"
            f"[orig][narr]amix=inputs=2:duration=longest:dropout_transition=2[aout]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path, "-i", narration_path,
            "-filter_complex", fc,
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            output_path,
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # Fallback: mute + narration
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-i", narration_path,
             "-map", "0:v", "-map", "1:a", "-c:v", "copy",
             "-c:a", "aac", "-shortest", output_path],
            capture_output=True,
        )
    return output_path
