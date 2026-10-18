import { describe, it, expect } from 'vitest';
import { InsForgeService } from './insforge-service';

describe('InsForgeService & Cloud Sync', () => {
	it('instantiates cleanly without throwing errors', () => {
		const service = new InsForgeService();
		expect(service).toBeDefined();
		expect(typeof service.listProjects).toBe('function');
		expect(typeof service.saveProject).toBe('function');
		expect(typeof service.deleteProject).toBe('function');
	});

	it('safely handles asset upload when offline or in test environment', async () => {
		const service = new InsForgeService();
		const result = await service.uploadAsset(new File(['test'], 'test.png', { type: 'image/png' }));
		expect(result === null || typeof result?.url === 'string').toBe(true);
	});
});
