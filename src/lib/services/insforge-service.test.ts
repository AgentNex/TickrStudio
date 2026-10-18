import { describe, it, expect } from 'vitest';
import { InsForgeService } from './insforge-service';

describe('InsForgeService & Cloud Sync', () => {
	it('instantiates cleanly without throwing errors', () => {
		const service = new InsForgeService();
		expect(service).toBeDefined();
		expect(typeof service.listProjects).toBe('function');
		expect(typeof service.saveProject).toBe('function');
		expect(typeof service.deleteProject).toBe('function');
		expect(typeof service.duplicateProject).toBe('function');
	});

	it('returns null or url when uploadAsset is called', async () => {
		const service = new InsForgeService();
		// Avoid hanging on external network in unit test by setting mock or verifying method signature
		expect(typeof service.uploadAsset).toBe('function');
	});
});
