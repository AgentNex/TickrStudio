import type {
	TimelineProject,
	SceneObject,
	Keyframe,
	EasingName,
	Transform
} from '$lib/types/timeline';

export interface EvaluatedSceneObject {
	id: string;
	name: string;
	type: 'text' | 'rect' | 'ellipse';
	visible: boolean;
	locked: boolean;
	transform: Transform;
	// Type-specific evaluated properties
	content?: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string | number;
	fill: string;
	stroke?: string;
	strokeWidth?: number;
	align?: 'left' | 'center' | 'right';
	width?: number;
	height?: number;
	cornerRadius?: number;
	radiusX?: number;
	radiusY?: number;
}

export interface RenderState {
	width: number;
	height: number;
	background: string;
	timeMs: number;
	objects: EvaluatedSceneObject[];
}

export function applyEasing(t: number, easing: EasingName = 'linear'): number {
	// Clamp t to [0, 1]
	const clamped = Math.max(0, Math.min(1, t));
	switch (easing) {
		case 'easeIn':
			return clamped * clamped * clamped;
		case 'easeOut':
			return 1 - Math.pow(1 - clamped, 3);
		case 'easeInOut':
			return clamped < 0.5
				? 4 * clamped * clamped * clamped
				: 1 - Math.pow(-2 * clamped + 2, 3) / 2;
		case 'linear':
		default:
			return clamped;
	}
}

export function interpolateNumber(
	timeMs: number,
	baseValue: number,
	keyframes?: Keyframe<number>[]
): number {
	if (!keyframes || keyframes.length === 0) {
		return baseValue;
	}

	// Sort keyframes chronologically
	const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);

	if (timeMs <= sorted[0].timeMs) {
		return sorted[0].value;
	}

	const last = sorted[sorted.length - 1];
	if (timeMs >= last.timeMs) {
		return last.value;
	}

	// Find enclosing interval [a, b]
	for (let i = 0; i < sorted.length - 1; i++) {
		const a = sorted[i];
		const b = sorted[i + 1];
		if (timeMs >= a.timeMs && timeMs <= b.timeMs) {
			const span = b.timeMs - a.timeMs;
			if (span === 0) return a.value;
			const rawProgress = (timeMs - a.timeMs) / span;
			const easedProgress = applyEasing(rawProgress, b.easing || 'linear');
			return a.value + (b.value - a.value) * easedProgress;
		}
	}

	return baseValue;
}

export function evaluateTimeline(project: TimelineProject, timeMs: number): RenderState {
	const clampedTime = Math.max(0, Math.min(project.settings.durationMs, timeMs));
	const evaluatedObjects: EvaluatedSceneObject[] = [];

	for (const obj of project.objects) {
		if (!obj.visible) continue;

		// Check if object is active in track clips
		let isClipActive = true;
		if (project.tracks && project.tracks.length > 0) {
			const parentTrack = project.tracks.find((t) =>
				t.clips.some((c) => c.objectId === obj.id)
			);
			if (parentTrack) {
				if (parentTrack.muted) continue;
				const clip = parentTrack.clips.find((c) => c.objectId === obj.id);
				if (clip) {
					isClipActive =
						clampedTime >= clip.startMs && clampedTime <= clip.startMs + clip.durationMs;
				}
			}
		}

		if (!isClipActive) continue;

		const kfs = obj.keyframes || {};

		const x = interpolateNumber(clampedTime, obj.transform.x, kfs.x);
		const y = interpolateNumber(clampedTime, obj.transform.y, kfs.y);
		const scaleX = interpolateNumber(clampedTime, obj.transform.scaleX, kfs.scaleX);
		const scaleY = interpolateNumber(clampedTime, obj.transform.scaleY, kfs.scaleY);
		const rotationDeg = interpolateNumber(clampedTime, obj.transform.rotationDeg, kfs.rotationDeg);
		const opacity = Math.max(
			0,
			Math.min(1, interpolateNumber(clampedTime, obj.transform.opacity, kfs.opacity))
		);

		const evaluated: EvaluatedSceneObject = {
			id: obj.id,
			name: obj.name,
			type: obj.type,
			visible: obj.visible,
			locked: obj.locked,
			transform: {
				x,
				y,
				scaleX,
				scaleY,
				rotationDeg,
				opacity
			},
			fill: (obj as any).fill || '#F5F5F0',
			stroke: (obj as any).stroke,
			strokeWidth: (obj as any).strokeWidth
		};

		if (obj.type === 'text') {
			evaluated.content = obj.content;
			evaluated.fontSize = interpolateNumber(clampedTime, obj.fontSize, kfs.fontSize);
			evaluated.fontFamily = obj.fontFamily;
			evaluated.fontWeight = obj.fontWeight;
			evaluated.align = obj.align;
		} else if (obj.type === 'rect') {
			evaluated.width = interpolateNumber(clampedTime, obj.width, kfs.width);
			evaluated.height = interpolateNumber(clampedTime, obj.height, kfs.height);
			evaluated.cornerRadius = obj.cornerRadius;
		} else if (obj.type === 'ellipse') {
			evaluated.radiusX = interpolateNumber(clampedTime, obj.radiusX, kfs.radiusX);
			evaluated.radiusY = interpolateNumber(clampedTime, obj.radiusY, kfs.radiusY);
		}

		evaluatedObjects.push(evaluated);
	}

	return {
		width: project.settings.width,
		height: project.settings.height,
		background: project.settings.background,
		timeMs: clampedTime,
		objects: evaluatedObjects
	};
}
