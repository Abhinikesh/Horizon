"""
Demo Maker router — two background-task pipelines:

  POST /api/demo/photos-to-video   → slideshow from multiple photos
  POST /api/demo/voiceover-video   → add voiceover to a screen recording

Both return {project_id} immediately; frontend polls
GET /api/projects/{project_id} for status / progress.
"""
from __future__ import annotations
import os, uuid, shutil
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from models.database import get_db
from utils.auth_utils import make_current_user_dep
from routers.upload import get_file_path          # in-memory registry lookup

router = APIRouter()
_get_current_user = make_current_user_dep(get_db)

_AUDIO_DIR   = "outputs/audio"
_VIDEO_DIR   = "outputs/videos"
_TMPDIR_BASE = "outputs/videos/tmp_demo"


# ── Request / Response schemas ────────────────────────────────────────────────

class PhotosToVideoRequest(BaseModel):
    file_ids:             List[str]
    narrations:           List[str]
    slide_duration:       int         = Field(4, ge=2, le=10)
    transition:           str         = "Fade"
    language:             str         = "English"
    voice_style:          str         = "Natural Female"
    add_background_music: bool        = False
    music_style:          str         = "Ambient"
    export_format:        str         = "16:9"   # "16:9" | "1:1" | "9:16"


class VoiceoverVideoRequest(BaseModel):
    file_id:          str
    narration_text:   str
    language:         str   = "English"
    voice_style:      str   = "Natural Female"
    audio_mode:       str   = "keep_low"     # "mute_original" | "keep_low"
    original_volume:  float = Field(0.20, ge=0.0, le=1.0)
    auto_stretch:     bool  = True


# ── DB helpers ────────────────────────────────────────────────────────────────

async def _create_project(user_id: str, project_type: str, title: str) -> str:
    db = get_db()
    doc = {
        "user_id":       user_id,
        "project_type":  project_type,
        "title":         title,
        "status":        "pending",
        "progress_percent": 0,
        "narration_text": "",
        "language":      "English",
        "output_video_path": None,
        "output_url":    None,
        "created_at":    datetime.utcnow(),
        "updated_at":    datetime.utcnow(),
    }
    result = await db.projects.insert_one(doc)
    return str(result.inserted_id)


async def _update(project_id: str, status: str, progress: int, **extra) -> None:
    db = get_db()
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {
            "status":           status,
            "progress_percent": progress,
            "updated_at":       datetime.utcnow(),
            **extra,
        }},
    )


def _tmp(base: str, suffix: str = "") -> str:
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, f"{uuid.uuid4().hex[:10]}{suffix}")


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE 1 — Photos to Video
# ══════════════════════════════════════════════════════════════════════════════

async def _run_photos_pipeline(project_id: str, params: dict) -> None:
    import asyncio
    tmp_dir = f"{_TMPDIR_BASE}_{project_id[:8]}"
    os.makedirs(tmp_dir, exist_ok=True)

    try:
        await _update(project_id, "processing", 5)

        # ── Resolve file paths ─────────────────────────────────────────────
        photo_paths: list[str] = []
        for fid in params["file_ids"]:
            path = get_file_path(fid)
            if not path or not os.path.exists(path):
                raise FileNotFoundError(f"Uploaded photo not found: {fid}")
            photo_paths.append(path)

        narrations:  list[str]   = params["narrations"]
        n = len(photo_paths)

        # ── Step 1: Generate TTS for each photo ───────────────────────────
        from services.tts_service import generate_speech
        audio_paths: list[str] = []

        for i, (text, _) in enumerate(zip(narrations, photo_paths)):
            await _update(project_id, "processing",
                          int(5 + 35 * (i / n)), step="generating_narration")
            text_safe = text.strip() or f"Photo {i + 1}."
            audio_out = _tmp(tmp_dir, f"_narr{i}.aac")
            await generate_speech(
                text=text_safe,
                language=params["language"],
                voice_style=params["voice_style"],
                output_path=audio_out,
            )
            audio_paths.append(audio_out)

        await _update(project_id, "processing", 40, step="building_slideshow")

        # ── Step 2: Get each audio's duration, set slide durations ────────
        from services.demo_video_service import (
            get_media_duration, concat_audio_files,
            build_slideshow_video, combine_video_audio,
        )
        min_slide = int(params["slide_duration"])
        slide_durations = [
            max(float(min_slide), get_media_duration(ap))
            for ap in audio_paths
        ]

        # ── Step 3: Build slideshow video (FFmpeg xfade) ──────────────────
        slideshow_path = _tmp(tmp_dir, "_slideshow.mp4")
        await asyncio.get_event_loop().run_in_executor(
            None,
            build_slideshow_video,
            photo_paths, slide_durations,
            params["transition"], params["export_format"],
            slideshow_path,
        )
        await _update(project_id, "processing", 60, step="adding_transitions")

        # ── Step 4: Concatenate all narration audios ──────────────────────
        narr_combined = _tmp(tmp_dir, "_narr_combined.aac")
        await asyncio.get_event_loop().run_in_executor(
            None, concat_audio_files, audio_paths, narr_combined,
        )
        await _update(project_id, "processing", 70, step="mixing_audio")

        # ── Step 5: Optional background music ────────────────────────────
        if params.get("add_background_music") and params.get("music_style", "None") != "None":
            from services.video_service import _mix_music
            narr_combined = _mix_music(
                narr_combined, params["music_style"], tmp_dir, music_volume=0.15
            )
        await _update(project_id, "processing", 80)

        # ── Step 6: Combine slideshow + audio ─────────────────────────────
        os.makedirs(_VIDEO_DIR, exist_ok=True)
        final_path = os.path.join(
            _VIDEO_DIR, f"demo_photos_{project_id[:12]}.mp4"
        )
        await asyncio.get_event_loop().run_in_executor(
            None, combine_video_audio, slideshow_path, narr_combined, final_path,
        )
        await _update(project_id, "processing", 95)

        # ── Finalize ──────────────────────────────────────────────────────
        output_url = f"/outputs/videos/demo_photos_{project_id[:12]}.mp4"
        combined_narration = " ".join(n.strip() for n in narrations if n.strip())
        await _update(
            project_id, "ready", 100,
            output_video_path=final_path,
            output_url=output_url,
            narration_text=combined_narration,
            language=params["language"],
        )

    except Exception as exc:
        print(f"[demo/photos] Pipeline failed: {exc}")
        await _update(project_id, "failed", 0, error=str(exc))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE 2 — Voiceover Video
# ══════════════════════════════════════════════════════════════════════════════

async def _run_voiceover_pipeline(project_id: str, params: dict) -> None:
    import asyncio
    tmp_dir = f"{_TMPDIR_BASE}_{project_id[:8]}"
    os.makedirs(tmp_dir, exist_ok=True)

    try:
        await _update(project_id, "processing", 5)

        # ── Resolve uploaded video path ───────────────────────────────────
        video_path = get_file_path(params["file_id"])
        if not video_path or not os.path.exists(video_path):
            raise FileNotFoundError("Uploaded video not found")

        # ── Step 1: Get video duration ────────────────────────────────────
        from services.demo_video_service import (
            get_media_duration, adjust_audio_tempo, mix_voiceover_with_video,
        )
        video_dur = await asyncio.get_event_loop().run_in_executor(
            None, get_media_duration, video_path
        )
        await _update(project_id, "processing", 15, step="processing_video")

        # ── Step 2: Generate TTS narration ────────────────────────────────
        from services.tts_service import generate_speech
        narr_path = _tmp(tmp_dir, "_narration.aac")
        await generate_speech(
            text=params["narration_text"],
            language=params["language"],
            voice_style=params["voice_style"],
            output_path=narr_path,
        )
        await _update(project_id, "processing", 55, step="generating_voiceover")

        # ── Step 3: Tempo-adjust narration if auto_stretch ────────────────
        if params.get("auto_stretch") and video_dur > 0:
            narr_dur = await asyncio.get_event_loop().run_in_executor(
                None, get_media_duration, narr_path,
            )
            adjusted = _tmp(tmp_dir, "_narration_adj.aac")
            await asyncio.get_event_loop().run_in_executor(
                None, adjust_audio_tempo, narr_path, video_dur, narr_dur, adjusted,
            )
            narr_path = adjusted
        await _update(project_id, "processing", 70, step="syncing_audio")

        # ── Step 4: Mix voiceover into video ──────────────────────────────
        os.makedirs(_VIDEO_DIR, exist_ok=True)
        final_path = os.path.join(
            _VIDEO_DIR, f"demo_voiceover_{project_id[:12]}.mp4"
        )
        await asyncio.get_event_loop().run_in_executor(
            None,
            mix_voiceover_with_video,
            video_path, narr_path,
            params["audio_mode"],
            float(params.get("original_volume", 0.20)),
            final_path,
        )
        await _update(project_id, "processing", 95)

        # ── Finalize ──────────────────────────────────────────────────────
        output_url = f"/outputs/videos/demo_voiceover_{project_id[:12]}.mp4"
        await _update(
            project_id, "ready", 100,
            output_video_path=final_path,
            output_url=output_url,
            narration_text=params["narration_text"],
            language=params["language"],
        )

    except Exception as exc:
        print(f"[demo/voiceover] Pipeline failed: {exc}")
        await _update(project_id, "failed", 0, error=str(exc))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ══════════════════════════════════════════════════════════════════════════════
# HTTP endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/photos-to-video")
async def photos_to_video(
    body: PhotosToVideoRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(_get_current_user),
):
    """Start a background slideshow generation task."""
    if len(body.file_ids) == 0:
        raise HTTPException(400, "At least one photo is required")
    if len(body.file_ids) != len(body.narrations):
        raise HTTPException(400, "file_ids and narrations must have the same length")
    if len(body.file_ids) > 10:
        raise HTTPException(400, "Maximum 10 photos allowed")

    title = f"Demo Video — {datetime.utcnow().strftime('%b %d %H:%M')}"
    project_id = await _create_project(current_user["id"], "demo_photos", title)

    params = {
        "file_ids":             body.file_ids,
        "narrations":           body.narrations,
        "slide_duration":       body.slide_duration,
        "transition":           body.transition,
        "language":             body.language,
        "voice_style":          body.voice_style,
        "add_background_music": body.add_background_music,
        "music_style":          body.music_style,
        "export_format":        body.export_format,
    }
    background_tasks.add_task(_run_photos_pipeline, project_id, params)
    return {"project_id": project_id, "status": "pending"}


@router.post("/voiceover-video")
async def voiceover_video(
    body: VoiceoverVideoRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(_get_current_user),
):
    """Start a background voiceover generation task."""
    if not body.narration_text.strip():
        raise HTTPException(400, "Narration text is required")

    title = f"Demo Voiceover — {datetime.utcnow().strftime('%b %d %H:%M')}"
    project_id = await _create_project(current_user["id"], "demo_voiceover", title)

    params = {
        "file_id":         body.file_id,
        "narration_text":  body.narration_text,
        "language":        body.language,
        "voice_style":     body.voice_style,
        "audio_mode":      body.audio_mode,
        "original_volume": body.original_volume,
        "auto_stretch":    body.auto_stretch,
    }
    background_tasks.add_task(_run_voiceover_pipeline, project_id, params)
    return {"project_id": project_id, "status": "pending"}
