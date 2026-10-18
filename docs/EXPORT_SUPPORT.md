# Video Export Architecture & Browser Support — TickrStudio

## Architecture Overview

TickrStudio implements a client-side video rendering and muxing pipeline capable of producing true `.mp4` video files entirely within the user's browser without requiring server-side FFmpeg infrastructure.

```mermaid
flowchart LR
  CANVAS[Offscreen Canvas 2D] -->|drawFrame(t)| FRAME[Canvas ImageBitmap]
  FRAME -->|new VideoFrame()| VF[VideoFrame Object]
  VF -->|encoder.encode()| VE[WebCodecs VideoEncoder]
  VE -->|Chunk Output| MUX[mp4-muxer Muxer]
  MUX -->|ArrayBufferTarget| BLOB[video/mp4 Blob]
  BLOB -->|URL.createObjectURL| DL[User File Download]
```

---

## Codec & Profile Configuration

### 1. WebCodecs H.264 / AVC
- **Codec String**: `avc1.42001f` (Baseline Profile, Level 3.1) or `avc1.4d002a` (Main Profile, Level 4.2).
- **Target Bitrate**:
  - 1080p (1920x1080): 8,000,000 bps (8 Mbps)
  - 720p (1280x720): 4,500,000 bps (4.5 Mbps)
  - 540p (960x540): 2,500,000 bps (2.5 Mbps)
- **Framerate**: Evaluated frame-by-frame matching composition FPS (24, 30, or 60).
- **Muxer Target**: `ArrayBufferTarget` from `mp4-muxer`.

---

## Memory & Resource Management

1. **`VideoFrame.close()`**: Every instantiated `VideoFrame` must be closed immediately after being passed to `VideoEncoder.encode()`. Failing to close frames causes memory leaks and GPU crashes on mobile browsers.
2. **Cancellation Support**: The exporter supports abort signals. If the user cancels export, the render loop stops immediately, encoder queues are flushed, and all buffers are garbage collected.
3. **Chunked Memory Allocation**: Output buffers are written sequentially into `mp4-muxer` chunks rather than retaining uncompressed pixel arrays in RAM.

---

## Fallback Strategy (MediaRecorder)

When `VideoEncoder` is unavailable (e.g. Firefox desktop or older mobile browsers):
- The capability detector flags WebCodecs as unsupported.
- The UI transparently offers a high-quality `MediaRecorder` capture producing a valid `.webm` video file.
- The exported file is truthfully labeled as `.webm` (never falsely claiming to be MP4).
