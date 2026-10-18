import { openDB, type IDBPDatabase } from 'idb';
import type { ProjectRepository } from './project-repository';
import type { TimelineProject } from '$lib/types/timeline';

const DB_NAME = 'logicut_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

export function createDefaultProject(
	name = 'Untitled Project',
	width = 1920,
	height = 1080,
	fps = 30,
	durationMs = 4000
): TimelineProject {
	const now = new Date().toISOString();
	const projectId = 'proj_' + Math.random().toString(36).slice(2, 9);
	const textObjId = 'obj_' + Math.random().toString(36).slice(2, 9);
	const rectObjId = 'obj_' + Math.random().toString(36).slice(2, 9);

	return {
		schemaVersion: 1,
		id: projectId,
		name,
		createdAt: now,
		updatedAt: now,
		settings: {
			width,
			height,
			fps,
			durationMs,
			background: '#0A0A0B'
		},
		objects: [
			{
				id: rectObjId,
				name: 'Accent Pill',
				type: 'rect',
				visible: true,
				locked: false,
				width: 320,
				height: 80,
				fill: '#19191C',
				stroke: '#D6D3C9',
				strokeWidth: 2,
				cornerRadius: 12,
				transform: {
					x: width / 2,
					y: height / 2,
					scaleX: 1,
					scaleY: 1,
					rotationDeg: 0,
					opacity: 1
				},
				keyframes: {
					scaleX: [
						{ id: 'kf_1', timeMs: 0, value: 0.6, easing: 'easeOut' },
						{ id: 'kf_2', timeMs: 800, value: 1, easing: 'easeOut' }
					],
					opacity: [
						{ id: 'kf_3', timeMs: 0, value: 0, easing: 'linear' },
						{ id: 'kf_4', timeMs: 600, value: 1, easing: 'linear' }
					]
				}
			},
			{
				id: textObjId,
				name: 'Title Text',
				type: 'text',
				visible: true,
				locked: false,
				content: 'Make it move.',
				fontSize: 56,
				fontFamily: 'Inter, sans-serif',
				fontWeight: '700',
				fill: '#F5F5F0',
				align: 'center',
				transform: {
					x: width / 2,
					y: height / 2 + 10,
					scaleX: 1,
					scaleY: 1,
					rotationDeg: 0,
					opacity: 1
				},
				keyframes: {
					y: [
						{ id: 'kf_5', timeMs: 0, value: height / 2 + 50, easing: 'easeOut' },
						{ id: 'kf_6', timeMs: 1000, value: height / 2 + 10, easing: 'easeOut' }
					],
					opacity: [
						{ id: 'kf_7', timeMs: 0, value: 0, easing: 'linear' },
						{ id: 'kf_8', timeMs: 600, value: 1, easing: 'linear' }
					]
				}
			}
		],
		tracks: [
			{
				id: 'track_1',
				name: 'Title Track',
				kind: 'visual',
				muted: false,
				locked: false,
				clips: [
					{
						id: 'clip_1',
						objectId: textObjId,
						startMs: 0,
						durationMs
					}
				]
			},
			{
				id: 'track_2',
				name: 'Graphics Track',
				kind: 'visual',
				muted: false,
				locked: false,
				clips: [
					{
						id: 'clip_2',
						objectId: rectObjId,
						startMs: 0,
						durationMs
					}
				]
			}
		],
		assets: []
	};
}

export class LocalProjectRepository implements ProjectRepository {
	private dbPromise: Promise<IDBPDatabase> | null = null;

	private async getDB(): Promise<IDBPDatabase> {
		if (typeof window === 'undefined') {
			throw new Error('IndexedDB is only accessible in browser runtime');
		}

		if (!this.dbPromise) {
			this.dbPromise = openDB(DB_NAME, DB_VERSION, {
				upgrade(db) {
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME, { keyPath: 'id' });
					}
				}
			});
		}
		return this.dbPromise;
	}

	async listProjects(): Promise<TimelineProject[]> {
		try {
			const db = await this.getDB();
			const all = (await db.getAll(STORE_NAME)) as TimelineProject[];
			if (all.length === 0) {
				// Seed initial project
				const sample = createDefaultProject('Welcome to LogiCut');
				await db.put(STORE_NAME, sample);
				return [sample];
			}
			return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		} catch (err) {
			console.error('Failed to list projects from IndexedDB:', err);
			return [];
		}
	}

	async getProject(id: string): Promise<TimelineProject | null> {
		try {
			const db = await this.getDB();
			const proj = (await db.get(STORE_NAME, id)) as TimelineProject | undefined;
			return proj || null;
		} catch (err) {
			console.error(`Failed to get project ${id} from IndexedDB:`, err);
			return null;
		}
	}

	async saveProject(project: TimelineProject): Promise<void> {
		try {
			const db = await this.getDB();
			const plain = JSON.parse(JSON.stringify(project));
			plain.updatedAt = new Date().toISOString();
			await db.put(STORE_NAME, plain);
		} catch (err) {
			console.error(`Failed to save project ${project.id} to IndexedDB:`, err);
			throw err;
		}
	}

	async deleteProject(id: string): Promise<void> {
		try {
			const db = await this.getDB();
			await db.delete(STORE_NAME, id);
		} catch (err) {
			console.error(`Failed to delete project ${id} from IndexedDB:`, err);
			throw err;
		}
	}

	async duplicateProject(id: string): Promise<TimelineProject> {
		const original = await this.getProject(id);
		if (!original) {
			throw new Error(`Project ${id} not found`);
		}
		const now = new Date().toISOString();
		const copy: TimelineProject = {
			...JSON.parse(JSON.stringify(original)),
			id: 'proj_' + Math.random().toString(36).slice(2, 9),
			name: `${original.name} (Copy)`,
			createdAt: now,
			updatedAt: now
		};
		await this.saveProject(copy);
		return copy;
	}
}

export const localProjectRepo = new LocalProjectRepository();
