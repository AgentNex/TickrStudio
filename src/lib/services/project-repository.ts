import type { TimelineProject } from '$lib/types/timeline';

export interface ProjectRepository {
	listProjects(): Promise<TimelineProject[]>;
	getProject(id: string): Promise<TimelineProject | null>;
	saveProject(project: TimelineProject): Promise<void>;
	deleteProject(id: string): Promise<void>;
	duplicateProject(id: string): Promise<TimelineProject>;
}
