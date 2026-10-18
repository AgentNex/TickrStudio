import type { TimelineProject, SceneObject, Keyframe } from '$lib/types/timeline';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export const VALID_EASINGS = new Set(['linear', 'easeIn', 'easeOut', 'easeInOut']);
export const VALID_OBJECT_TYPES = new Set(['text', 'rect', 'ellipse']);

export function validateTimelineProject(data: unknown): ValidationResult {
	const errors: string[] = [];

	if (!data || typeof data !== 'object') {
		return { valid: false, errors: ['Project must be a valid JSON object.'] };
	}

	const proj = data as Partial<TimelineProject>;

	if (proj.schemaVersion !== 1) {
		errors.push(`Invalid schemaVersion: expected 1, got ${proj.schemaVersion}`);
	}

	if (!proj.id || typeof proj.id !== 'string') {
		errors.push('Missing or invalid project id.');
	}

	if (!proj.name || typeof proj.name !== 'string') {
		errors.push('Missing or invalid project name.');
	}

	if (!proj.settings || typeof proj.settings !== 'object') {
		errors.push('Missing project settings object.');
	} else {
		const s = proj.settings;
		if (typeof s.width !== 'number' || s.width <= 0 || s.width > 7680) {
			errors.push(`Settings width must be between 1 and 7680 px (got ${s.width})`);
		}
		if (typeof s.height !== 'number' || s.height <= 0 || s.height > 4320) {
			errors.push(`Settings height must be between 1 and 4320 px (got ${s.height})`);
		}
		if (typeof s.fps !== 'number' || s.fps < 1 || s.fps > 120) {
			errors.push(`Settings fps must be between 1 and 120 (got ${s.fps})`);
		}
		if (typeof s.durationMs !== 'number' || s.durationMs < 100 || s.durationMs > 600000) {
			errors.push(`Settings durationMs must be between 100ms and 600,000ms (got ${s.durationMs})`);
		}
		if (typeof s.background !== 'string') {
			errors.push('Settings background must be a valid color string.');
		}
	}

	if (!Array.isArray(proj.objects)) {
		errors.push('Project objects must be an array.');
	} else {
		for (let i = 0; i < proj.objects.length; i++) {
			const obj = proj.objects[i];
			if (!obj || typeof obj !== 'object') {
				errors.push(`Object at index ${i} is not a valid object.`);
				continue;
			}
			if (!obj.id) errors.push(`Object at index ${i} is missing an id.`);
			if (!VALID_OBJECT_TYPES.has(obj.type)) {
				errors.push(`Object "${obj.name || i}" has invalid type "${obj.type}".`);
			}

			if (!obj.transform || typeof obj.transform !== 'object') {
				errors.push(`Object "${obj.name || i}" is missing a valid transform.`);
			} else {
				if (!Number.isFinite(obj.transform.x) || !Number.isFinite(obj.transform.y)) {
					errors.push(`Object "${obj.name || i}" transform.x and transform.y must be finite numbers.`);
				}
				if (!Number.isFinite(obj.transform.scaleX) || !Number.isFinite(obj.transform.scaleY)) {
					errors.push(`Object "${obj.name || i}" scaleX and scaleY must be finite numbers.`);
				}
				if (!Number.isFinite(obj.transform.rotationDeg)) {
					errors.push(`Object "${obj.name || i}" rotationDeg must be a finite number.`);
				}
				if (!Number.isFinite(obj.transform.opacity) || obj.transform.opacity < 0 || obj.transform.opacity > 1) {
					errors.push(`Object "${obj.name || i}" opacity must be a number between 0 and 1.`);
				}
			}

			// Validate keyframes
			if (obj.keyframes && typeof obj.keyframes === 'object') {
				for (const prop in obj.keyframes) {
					const kfs = obj.keyframes[prop];
					if (Array.isArray(kfs)) {
						for (const kf of kfs) {
							if (typeof kf.timeMs !== 'number' || kf.timeMs < 0) {
								errors.push(`Keyframe on ${obj.name}.${prop} has invalid timeMs ${kf.timeMs}`);
							}
							if (proj.settings?.durationMs && kf.timeMs > proj.settings.durationMs) {
								errors.push(
									`Keyframe on ${obj.name}.${prop} at ${kf.timeMs}ms exceeds project duration (${proj.settings.durationMs}ms)`
								);
							}
							if (kf.easing && !VALID_EASINGS.has(kf.easing)) {
								errors.push(`Invalid easing "${kf.easing}" on ${obj.name}.${prop}`);
							}
						}
					}
				}
			}
		}
	}

	if (!Array.isArray(proj.tracks)) {
		errors.push('Project tracks must be an array.');
	} else {
		for (let i = 0; i < proj.tracks.length; i++) {
			const track = proj.tracks[i];
			if (!track || typeof track !== 'object') {
				errors.push(`Track at index ${i} is not a valid object.`);
				continue;
			}
			if (!track.id) errors.push(`Track at index ${i} is missing an id.`);
			if (!Array.isArray(track.clips)) {
				errors.push(`Track "${track.name || i}" clips must be an array.`);
			} else {
				for (let j = 0; j < track.clips.length; j++) {
					const clip = track.clips[j];
					if (!clip || typeof clip !== 'object' || !clip.id || !clip.objectId) {
						errors.push(`Track "${track.name || i}" clip at index ${j} is invalid.`);
					} else {
						if (!Number.isFinite(clip.startMs) || !Number.isFinite(clip.durationMs) || clip.durationMs <= 0) {
							errors.push(`Clip "${clip.id}" has invalid timing (startMs: ${clip.startMs}, durationMs: ${clip.durationMs}).`);
						}
					}
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
