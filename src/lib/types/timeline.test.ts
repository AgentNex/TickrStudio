import { describe, it, expect } from 'vitest';
import { createDefaultProject } from '$lib/services/local-project-repository';

describe('Timeline Model & Factory', () => {
	it('creates valid default project with schemaVersion 1', () => {
		const proj = createDefaultProject('Test Composition', 1920, 1080);
		expect(proj.schemaVersion).toBe(1);
		expect(proj.name).toBe('Test Composition');
		expect(proj.settings.width).toBe(1920);
		expect(proj.settings.height).toBe(1080);
		expect(proj.settings.fps).toBe(30);
		expect(proj.settings.durationMs).toBe(4000);
		expect(proj.objects.length).toBeGreaterThanOrEqual(1);
		expect(proj.tracks.length).toBeGreaterThanOrEqual(1);
	});

	it('ensures object keyframe timestamps are bounded by duration', () => {
		const proj = createDefaultProject('Bounds Test', 1080, 1920);
		for (const obj of proj.objects) {
			for (const prop in obj.keyframes) {
				const kfs = obj.keyframes[prop];
				if (kfs) {
					for (const kf of kfs) {
						expect(kf.timeMs).toBeGreaterThanOrEqual(0);
						expect(kf.timeMs).toBeLessThanOrEqual(proj.settings.durationMs);
					}
				}
			}
		}
	});

	it('preserves clean JSON serialization', () => {
		const proj = createDefaultProject('Serialization Test', 1080, 1080);
		const json = JSON.stringify(proj);
		const parsed = JSON.parse(json);
		expect(parsed.id).toBe(proj.id);
		expect(parsed.settings.background).toBe(proj.settings.background);
		expect(parsed.objects[0].name).toBe(proj.objects[0].name);
	});
});
