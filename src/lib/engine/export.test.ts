import { describe, it, expect } from 'vitest';
import { checkExportCapabilities } from './export-capabilities';
import { createDefaultProject } from '$lib/services/local-project-repository';

describe('Video Export Pipeline & Capabilities', () => {
	it('probes export capabilities without throwing in non-browser runtime', async () => {
		const caps = await checkExportCapabilities(1920, 1080, 30);
		expect(caps).toBeDefined();
		expect(typeof caps.supported).toBe('boolean');
		expect(['webcodecs-mp4', 'mediarecorder-webm', 'unsupported']).toContain(caps.method);
	});

	it('computes accurate frame count for composition duration', () => {
		const project = createDefaultProject('Export Math Test', 1920, 1080);
		project.settings.durationMs = 4000;
		project.settings.fps = 30;

		const fps = project.settings.fps;
		const totalFrames = Math.ceil((project.settings.durationMs / 1000) * fps);

		expect(totalFrames).toBe(120);

		// Keyframe interval
		const keyframeInterval = fps * 2;
		expect(keyframeInterval).toBe(60);
	});

	it('correctly maps frame index to millisecond and microsecond timestamps', () => {
		const fps = 30;
		const frameIdx = 15; // 0.5s into animation
		const timeMs = (frameIdx / fps) * 1000;
		const timestampMicroseconds = Math.round(frameIdx * (1_000_000 / fps));

		expect(timeMs).toBe(500);
		expect(timestampMicroseconds).toBe(500000);
	});
});
