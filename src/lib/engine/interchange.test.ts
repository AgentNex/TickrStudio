import { describe, it, expect } from 'vitest';
import { generateAiRecipe } from './ai-recipe';
import { serializeToXml, parseXmlSubset } from './interchange';
import { createDefaultProject } from '$lib/services/local-project-repository';

describe('AI Recipe Generation & XML Interchange', () => {
	it('generates valid recipe from natural language prompt', () => {
		const res = generateAiRecipe({
			prompt: 'Tech podcast intro titled "Future Sync"',
			aspectRatio: '16:9',
			durationSeconds: 5
		});
		expect(res.recipeText).toContain('[RECIPE]');
		expect(res.project).toBeDefined();
		expect(res.project.settings.durationMs).toBe(5000);
		expect(res.project.objects.length).toBeGreaterThanOrEqual(2);
	});

	it('serializes and parses XML subset safely without script tags', () => {
		const proj = createDefaultProject('XML Test Compo', 1920, 1080);
		const xml = serializeToXml(proj);

		expect(xml).toContain('<?xml');
		expect(xml).toContain('<composition');
		expect(xml).toContain('width="1920"');

		const parsed = parseXmlSubset(xml);
		expect(parsed.success).toBe(true);
		expect(parsed.project?.objects.length).toBe(proj.objects.length);
	});

	it('strictly rejects unsafe script elements in XML', () => {
		const unsafeXml = `<composition><text><content><script>alert(1)</script></content></text></composition>`;
		const parsed = parseXmlSubset(unsafeXml);
		expect(parsed.success).toBe(false);
		expect(parsed.error).toContain('Unsafe tag');
	});
});
