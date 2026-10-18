import { describe, it, expect } from 'vitest';
import { evaluateTimeline, interpolateNumber, applyEasing } from './evaluator';
import { createDefaultProject } from '$lib/services/local-project-repository';

describe('Deterministic Evaluator', () => {
	it('evaluates easing curves within [0, 1]', () => {
		for (const easing of ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const) {
			expect(applyEasing(0, easing)).toBe(0);
			expect(applyEasing(1, easing)).toBe(1);
			const mid = applyEasing(0.5, easing);
			expect(mid).toBeGreaterThanOrEqual(0);
			expect(mid).toBeLessThanOrEqual(1);
		}
	});

	it('interpolates numeric keyframes accurately', () => {
		const keyframes = [
			{ id: '1', timeMs: 0, value: 100, easing: 'linear' as const },
			{ id: '2', timeMs: 1000, value: 200, easing: 'linear' as const }
		];

		expect(interpolateNumber(0, 50, keyframes)).toBe(100);
		expect(interpolateNumber(500, 50, keyframes)).toBe(150);
		expect(interpolateNumber(1000, 50, keyframes)).toBe(200);
		expect(interpolateNumber(1500, 50, keyframes)).toBe(200); // clamped to last
		expect(interpolateNumber(-500, 50, keyframes)).toBe(100); // clamped to first
	});

	it('produces bit-for-bit identical RenderState for identical inputs (deterministic)', () => {
		const project = createDefaultProject('Deterministic Run', 1920, 1080);
		const run1 = evaluateTimeline(project, 400);
		const run2 = evaluateTimeline(project, 400);

		expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
		expect(run1.objects.length).toBe(project.objects.length);
		expect(run1.timeMs).toBe(400);
	});

	it('interpolates active object transform properties correctly', () => {
		const project = createDefaultProject('Scale Test', 1920, 1080);
		const stateStart = evaluateTimeline(project, 0);
		const stateMid = evaluateTimeline(project, 400);
		const stateEnd = evaluateTimeline(project, 800);

		const pillStart = stateStart.objects.find((o) => o.name === 'Accent Pill');
		const pillMid = stateMid.objects.find((o) => o.name === 'Accent Pill');
		const pillEnd = stateEnd.objects.find((o) => o.name === 'Accent Pill');

		expect(pillStart?.transform.scaleX).toBe(0.6);
		expect(pillMid?.transform.scaleX).toBeGreaterThan(0.6);
		expect(pillMid?.transform.scaleX).toBeLessThan(1.0);
		expect(pillEnd?.transform.scaleX).toBe(1.0);
	});
});
