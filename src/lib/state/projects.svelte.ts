import type { TimelineProject } from '$lib/types/timeline';
import { localProjectRepo, createDefaultProject } from '$lib/services/local-project-repository';
import { toast } from './toast.svelte';

class ProjectsStore {
	list = $state<TimelineProject[]>([]);
	loading = $state(true);
	error = $state<string | null>(null);
	searchQuery = $state('');

	filteredList = $derived(
		this.list.filter((p) =>
			p.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim())
		)
	);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.list = await localProjectRepo.listProjects();
		} catch (err: any) {
			this.error = err?.message || 'Failed to load projects';
			toast.error('Storage Error', this.error ?? undefined);
		} finally {
			this.loading = false;
		}
	}

	async create(name = 'Untitled Project', width = 1920, height = 1080) {
		try {
			const project = createDefaultProject(name, width, height);
			await localProjectRepo.saveProject(project);
			this.list.unshift(project);
			toast.success('Project Created', `"${project.name}" is ready to edit.`);
			return project;
		} catch (err: any) {
			toast.error('Creation Failed', err?.message);
			throw err;
		}
	}

	async duplicate(id: string) {
		try {
			const copy = await localProjectRepo.duplicateProject(id);
			this.list.unshift(copy);
			toast.success('Duplicated', `Created "${copy.name}".`);
			return copy;
		} catch (err: any) {
			toast.error('Duplicate Failed', err?.message);
			throw err;
		}
	}

	async delete(id: string) {
		try {
			const proj = this.list.find((p) => p.id === id);
			await localProjectRepo.deleteProject(id);
			this.list = this.list.filter((p) => p.id !== id);
			toast.success('Project Deleted', proj ? `"${proj.name}" removed.` : undefined);
		} catch (err: any) {
			toast.error('Delete Failed', err?.message);
			throw err;
		}
	}

	async rename(id: string, newName: string) {
		try {
			const project = this.list.find((p) => p.id === id);
			if (project) {
				project.name = newName;
				await localProjectRepo.saveProject(project);
				toast.success('Renamed', `Project name updated to "${newName}".`);
			}
		} catch (err: any) {
			toast.error('Rename Failed', err?.message);
			throw err;
		}
	}
}

export const projectsStore = new ProjectsStore();
