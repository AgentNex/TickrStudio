import type { TimelineProject } from '$lib/types/timeline';
import { evaluateTimeline } from './evaluator';
import { renderSceneToCanvas } from './canvas-renderer';
import { checkExportCapabilities } from './export-capabilities';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ExportProgress {
	currentFrame: number;
	totalFrames: number;
	percent: number;
}

export interface ExportOptions {
	fps?: number;
	width?: number;
	height?: number;
	bitrate?: number;
	onProgress?: (progress: ExportProgress) => void;
	checkCancelled?: () => boolean;
}

export interface ExportResult {
	blob: Blob;
	extension: 'mp4' | 'webm';
	mimeType: string;
	filename: string;
}

export async function exportProjectVideo(
	project: TimelineProject,
	options: ExportOptions = {}
): Promise<ExportResult> {
	const fps = options.fps || project.settings.fps || 30;
	const width = options.width || project.settings.width || 1920;
	const height = options.height || project.settings.height || 1080;
	const bitrate = options.bitrate || 6_000_000;
	const durationMs = project.settings.durationMs || 4000;
	const totalFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));

	const caps = await checkExportCapabilities(width, height, fps);
	if (!caps.supported) {
		throw new Error(caps.reason || 'Browser video export is not supported in this environment.');
	}

	// Create offscreen canvas for rendering frames
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to create 2D canvas context for rendering export frames.');
	}

	// 1. Primary path: WebCodecs + MP4 Muxer
	if (caps.method === 'webcodecs-mp4' && typeof window.VideoEncoder === 'function') {
		const target = new ArrayBufferTarget();
		const muxer = new Muxer({
			target,
			video: {
				codec: 'avc',
				width,
				height
			},
			fastStart: 'in-memory'
		});

		let encoderError: any = null;
		const encoder = new window.VideoEncoder({
			output: (chunk, meta) => {
				muxer.addVideoChunk(chunk, meta);
			},
			error: (e) => {
				encoderError = e;
				console.error('VideoEncoder error:', e);
			}
		});

		encoder.configure({
			codec: caps.codec,
			width,
			height,
			bitrate,
			framerate: fps
		});

		try {
			for (let i = 0; i < totalFrames; i++) {
				if (options.checkCancelled?.()) {
					encoder.close();
					throw new Error('Export cancelled by user.');
				}

				if (encoderError) {
					throw new Error(`VideoEncoder failure: ${encoderError.message || encoderError}`);
				}

				const timeMs = (i / fps) * 1000;
				const renderState = evaluateTimeline(project, timeMs);

				// Render strictly without gizmos
				renderSceneToCanvas(ctx, renderState, { drawGizmos: false });

				const timestampMicroseconds = Math.round(i * (1_000_000 / fps));
				const frame = new window.VideoFrame(canvas, {
					timestamp: timestampMicroseconds
				});

				// Encode with periodic keyframe
				const isKeyFrame = i % (fps * 2) === 0;
				encoder.encode(frame, { keyFrame: isKeyFrame });
				frame.close(); // Immediate cleanup to prevent memory leak

				const percent = Math.round(((i + 1) / totalFrames) * 100);
				options.onProgress?.({
					currentFrame: i + 1,
					totalFrames,
					percent
				});

				// Backpressure check: wait if encoder queue is backed up
				while (encoder.encodeQueueSize > 5) {
					await new Promise((r) => setTimeout(r, 10));
				}

				// Yield to event loop every 5 frames
				if (i % 5 === 0) {
					await new Promise((r) => setTimeout(r, 0));
				}
			}

			await encoder.flush();
			encoder.close();
			muxer.finalize();

			const blob = new Blob([target.buffer], { type: 'video/mp4' });
			const safeName = project.name.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'composition';

			return {
				blob,
				extension: 'mp4',
				mimeType: 'video/mp4',
				filename: `${safeName}_${width}x${height}_${fps}fps.mp4`
			};
		} catch (err) {
			try {
				encoder.close();
			} catch {}
			throw err;
		}
	}

	// 2. Fallback path: MediaRecorder (Truthful WebM format)
	return exportWithMediaRecorder(canvas, ctx, project, width, height, fps, totalFrames, caps.codec, options);
}

async function exportWithMediaRecorder(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	project: TimelineProject,
	width: number,
	height: number,
	fps: number,
	totalFrames: number,
	mimeType: string,
	options: ExportOptions
): Promise<ExportResult> {
	const stream = canvas.captureStream(fps);
	const recorder = new MediaRecorder(stream, { mimeType });
	const chunks: BlobPart[] = [];

	try {
		recorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) chunks.push(e.data);
		};

		const finishedPromise = new Promise<void>((resolve, reject) => {
			recorder.onstop = () => resolve();
			recorder.onerror = (e) => reject(e);
		});

		recorder.start();

		for (let i = 0; i < totalFrames; i++) {
			if (options.checkCancelled?.()) {
				recorder.stop();
				throw new Error('Export cancelled by user.');
			}

			const timeMs = (i / fps) * 1000;
			const renderState = evaluateTimeline(project, timeMs);
			renderSceneToCanvas(ctx, renderState, { drawGizmos: false });

			const percent = Math.round(((i + 1) / totalFrames) * 100);
			options.onProgress?.({
				currentFrame: i + 1,
				totalFrames,
				percent
			});

			await new Promise((r) => setTimeout(r, 1000 / fps));
		}

		recorder.stop();
		await finishedPromise;

		const blob = new Blob(chunks, { type: mimeType });
		const safeName = project.name.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'composition';

		return {
			blob,
			extension: 'webm',
			mimeType,
			filename: `${safeName}_${width}x${height}_${fps}fps.webm`
		};
	} finally {
		stream.getTracks().forEach((t) => t.stop());
	}
}
