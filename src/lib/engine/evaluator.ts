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

function parseHexColor(hex: string): [number, number, number] | null {
	const cleaned = hex.trim().replace(/^#/, '');
	if (cleaned.length === 3) {
		const r = parseInt(cleaned[0] + cleaned[0], 16);
		const g = parseInt(cleaned[1] + cleaned[1], 16);
		const b = parseInt(cleaned[2] + cleaned[2], 16);
		return [r, g, b];
	} else if (cleaned.length === 6) {
		const r = parseInt(cleaned.slice(0, 2), 16);
		const g = parseInt(cleaned.slice(2, 4), 16);
		const b = parseInt(cleaned.slice(4, 6), 16);
		return [r, g, b];
	}
	return null;
}

export function interpolateColor(
	timeMs: number,
	baseColor: string | undefined,
	keyframes?: Keyframe<string>[]
): string {
	if (!baseColor) return '#000000';
	if (!keyframes || keyframes.length === 0) return baseColor;

	const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);
	if (timeMs <= sorted[0].timeMs) return String(sorted[0].value);
	if (timeMs >= sorted[sorted.length - 1].timeMs) return String(sorted[sorted.length - 1].value);

	let prev = sorted[0];
	let next = sorted[sorted.length - 1];

	for (let i = 0; i < sorted.length - 1; i++) {
		if (timeMs >= sorted[i].timeMs && timeMs <= sorted[i + 1].timeMs) {
			prev = sorted[i];
			next = sorted[i + 1];
			break;
		}
	}

	const segmentDuration = next.timeMs - prev.timeMs;
	if (segmentDuration <= 0) return String(prev.value);

	const linearT = (timeMs - prev.timeMs) / segmentDuration;
	const easedT = applyEasing(linearT, next.easing || 'linear');

	const c1 = parseHexColor(String(prev.value));
	const c2 = parseHexColor(String(next.value));

	if (!c1 || !c2) {
		return easedT < 0.5 ? String(prev.value) : String(next.value);
	}

	const r = Math.round(c1[0] + (c2[0] - c1[0]) * easedT);
	const g = Math.round(c1[1] + (c2[1] - c1[1]) * easedT);
	const b = Math.round(c1[2] + (c2[2] - c1[2]) * easedT);

	const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
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

		const fill = interpolateColor(clampedTime, (obj as any).fill || '#F5F5F0', kfs.fill as any);
		const stroke = (obj as any).stroke
			? interpolateColor(clampedTime, (obj as any).stroke, kfs.stroke as any)
			: undefined;
		const strokeWidth = interpolateNumber(clampedTime, (obj as any).strokeWidth || 0, kfs.strokeWidth);

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
			fill,
			stroke,
			strokeWidth
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
