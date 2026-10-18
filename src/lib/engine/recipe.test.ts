import { describe, it, expect } from 'vitest';
import { parseRecipe } from './recipe-parser';
import { serializeToRecipe } from './recipe-serializer';
import { validateTimelineProject } from './timeline-schema';
import { createDefaultProject } from '$lib/services/local-project-repository';

const SAMPLE_RECIPE = `[RECIPE]
canvas: 1920x1080
fps: 30
duration: 4000ms
background: #0A0A0B

text title:
  content: "Make it move."
  x: 960
  y: 500
  fontSize: 88
  fill: #F5F5F0
  opacity:
    0ms: 0
    500ms: 1 (easeOut)

rect card:
  x: 960
  y: 600
  width: 400
  height: 200
  fill: #19191C
  stroke: #D6D3C9
  strokeWidth: 2
  cornerRadius: 12
  scaleX:
    0ms: 0.5 (easeIn)
    800ms: 1 (easeOut)
[/RECIPE]`;

describe('Recipe DSL Parser & Serializer', () => {
	it('parses valid recipe into valid TimelineProject model', () => {
		const res = parseRecipe(SAMPLE_RECIPE);
		expect(res.success).toBe(true);
		expect(res.errors).toHaveLength(0);
		expect(res.project).toBeDefined();

		const p = res.project!;
		expect(p.settings.width).toBe(1920);
		expect(p.settings.height).toBe(1080);
		expect(p.settings.fps).toBe(30);
		expect(p.settings.durationMs).toBe(4000);
		expect(p.settings.background).toBe('#0A0A0B');

		expect(p.objects).toHaveLength(2);

		const textObj = p.objects[0];
		expect(textObj.name).toBe('title');
		expect(textObj.type).toBe('text');
		if (textObj.type === 'text') {
			expect(textObj.content).toBe('Make it move.');
			expect(textObj.fontSize).toBe(88);
			expect(textObj.fill).toBe('#F5F5F0');
		}

		// Verify keyframes on opacity
		expect(textObj.keyframes.opacity).toBeDefined();
		expect(textObj.keyframes.opacity).toHaveLength(2);
		expect(textObj.keyframes.opacity![0].value).toBe(0);
		expect(textObj.keyframes.opacity![1].value).toBe(1);
		expect(textObj.keyframes.opacity![1].easing).toBe('easeOut');

		// Check rect keyframes
		const rectObj = p.objects[1];
		expect(rectObj.keyframes.scaleX).toBeDefined();
		expect(rectObj.keyframes.scaleX![0].easing).toBe('easeIn');
		expect(rectObj.keyframes.scaleX![1].easing).toBe('easeOut');
	});

	it('serializes TimelineProject back to clean [RECIPE] syntax', () => {
		const project = createDefaultProject('My Test', 1920, 1080);
		const recipeText = serializeToRecipe(project);

		expect(recipeText).toContain('[RECIPE]');
		expect(recipeText).toContain('canvas: 1920x1080');
		expect(recipeText).toContain('fps: 30');
		expect(recipeText).toContain('duration: 4000ms');
		expect(recipeText).toContain('[/RECIPE]');

		// Roundtrip parse
		const reparsed = parseRecipe(recipeText);
		expect(reparsed.success).toBe(true);
		expect(reparsed.project?.objects.length).toBe(project.objects.length);
	});

	it('validates schema using validateTimelineProject', () => {
		const res = parseRecipe(SAMPLE_RECIPE);
		expect(res.success).toBe(true);
		const val = validateTimelineProject(res.project);
		expect(val.valid).toBe(true);
		expect(val.errors).toHaveLength(0);
	});

	it('reports precise line and column errors for missing tags and invalid values', () => {
		const malformed = `canvas: 1920x1080\nfps: 30`;
		const res = parseRecipe(malformed);
		expect(res.success).toBe(false);
		expect(res.errors[0].message).toContain('Missing opening [RECIPE]');

		const invalidFps = `[RECIPE]\nfps: 999\n[/RECIPE]`;
		const res2 = parseRecipe(invalidFps);
		expect(res2.success).toBe(false);
		expect(res2.errors[0].line).toBe(2);
		expect(res2.errors[0].message).toContain('Invalid FPS');
	});

	it('reports error on invalid easing names', () => {
		const badEasing = `[RECIPE]\ntext title:\n  opacity:\n    0ms: 0 (bouncySpring)\n[/RECIPE]`;
		const res = parseRecipe(badEasing);
		expect(res.success).toBe(false);
		expect(res.errors[0].message).toContain('Invalid easing');
	});
});
