import { createClient } from '@insforge/sdk';
import type { TimelineProject } from '$lib/types/timeline';
import type { ProjectRepository } from './project-repository';
import { localProjectRepo } from './local-project-repository';

const insforgeUrl =
	(typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_INSFORGE_URL || import.meta.env.PUBLIC_INSFORGE_URL)) ||
	'';

const insforgeAnonKey =
	(typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_INSFORGE_ANON_KEY || import.meta.env.PUBLIC_INSFORGE_ANON_KEY)) ||
	'';

export class InsForgeService implements ProjectRepository {
	private client: any = null;
	public isConfigured: boolean = false;

	constructor() {
		if (insforgeUrl && insforgeAnonKey && !insforgeAnonKey.includes('your-anon-key')) {
			try {
				this.client = createClient({
					baseUrl: insforgeUrl,
					anonKey: insforgeAnonKey
				});
				this.isConfigured = true;
			} catch (err) {
				console.warn('InsForge client initialization skipped:', err);
				this.isConfigured = false;
			}
		}
	}

	async listProjects(): Promise<TimelineProject[]> {
		// First return local projects immediately for instant local-first UI
		const local = await localProjectRepo.listProjects();
		if (!this.isConfigured || !this.client) {
			return local;
		}

		try {
			// Try fetching remote cloud projects if table exists
			const { data, error } = await this.client.database
				.from('projects')
				.select('*')
				.order('updated_at', { ascending: false });

			if (!error && Array.isArray(data) && data.length > 0) {
				const remote = data.map((row: any) => row.project_data as TimelineProject).filter(Boolean);
				// Merge remote with local without duplicating
				const map = new Map<string, TimelineProject>();
				for (const p of local) map.set(p.id, p);
				for (const p of remote) {
					if (!map.has(p.id) || new Date(p.updatedAt) > new Date(map.get(p.id)!.updatedAt)) {
						map.set(p.id, p);
						await localProjectRepo.saveProject(p);
					}
				}
				return Array.from(map.values()).sort(
					(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				);
			}
		} catch (err) {
			console.warn('InsForge cloud list failed, falling back to local:', err);
		}

		return local;
	}

	async getProject(id: string): Promise<TimelineProject | null> {
		const local = await localProjectRepo.getProject(id);
		if (local) return local;

		if (!this.isConfigured || !this.client) return null;

		try {
			const { data, error } = await this.client.database
				.from('projects')
				.select('*')
				.eq('id', id)
				.single();

			if (!error && data?.project_data) {
				const proj = data.project_data as TimelineProject;
				await localProjectRepo.saveProject(proj);
				return proj;
			}
		} catch (err) {
			console.warn(`InsForge remote get for ${id} failed:`, err);
		}

		return null;
	}

	async saveProject(project: TimelineProject): Promise<void> {
		// Always persist to local IndexedDB first
		await localProjectRepo.saveProject(project);

		if (!this.isConfigured || !this.client) return;

		try {
			await this.client.database.from('projects').upsert([
				{
					id: project.id,
					name: project.name,
					project_data: project,
					updated_at: new Date().toISOString()
				}
			]);
		} catch (err) {
			console.warn(`InsForge remote save for ${project.id} failed (stored locally):`, err);
		}
	}

	async deleteProject(id: string): Promise<void> {
		await localProjectRepo.deleteProject(id);

		if (!this.isConfigured || !this.client) return;

		try {
			await this.client.database.from('projects').delete().eq('id', id);
		} catch (err) {
			console.warn(`InsForge remote delete for ${id} failed:`, err);
		}
	}

	async duplicateProject(id: string): Promise<TimelineProject> {
		const copy = await localProjectRepo.duplicateProject(id);
		if (this.isConfigured && this.client) {
			this.saveProject(copy).catch(() => {});
		}
		return copy;
	}

	async uploadAsset(file: File): Promise<{ url: string; key: string } | null> {
		if (!this.isConfigured || !this.client) {
			return null;
		}

		try {
			const key = `assets/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
			const result = await this.client.storage.from('assets').upload(key, file);
			if (result?.data?.url) {
				return { url: result.data.url, key };
			}
		} catch (err) {
			console.error('Failed to upload asset to InsForge Storage:', err);
		}

		return null;
	}
}

export const insforgeService = new InsForgeService();
