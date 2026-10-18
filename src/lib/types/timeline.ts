export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface Keyframe<T = number | string> {
	id: string;
	timeMs: number;
	value: T;
	easing: EasingName;
}

export interface Transform {
	x: number;
	y: number;
	scaleX: number;
	scaleY: number;
	rotationDeg: number;
	opacity: number;
}

export type SceneObjectType = 'text' | 'rect' | 'ellipse';

export interface BaseSceneObject {
	id: string;
	name: string;
	type: SceneObjectType;
	visible: boolean;
	locked: boolean;
	transform: Transform;
	keyframes: {
		x?: Keyframe<number>[];
		y?: Keyframe<number>[];
		scaleX?: Keyframe<number>[];
		scaleY?: Keyframe<number>[];
		rotationDeg?: Keyframe<number>[];
		opacity?: Keyframe<number>[];
		[key: string]: Keyframe<any>[] | undefined;
	};
}

export interface TextSceneObject extends BaseSceneObject {
	type: 'text';
	content: string;
	fontSize: number;
	fontFamily: string;
	fontWeight: string | number;
	fill: string;
	align: 'left' | 'center' | 'right';
}

export interface RectSceneObject extends BaseSceneObject {
	type: 'rect';
	width: number;
	height: number;
	fill: string;
	stroke?: string;
	strokeWidth?: number;
	cornerRadius?: number;
}

export interface EllipseSceneObject extends BaseSceneObject {
	type: 'ellipse';
	radiusX: number;
	radiusY: number;
	fill: string;
	stroke?: string;
	strokeWidth?: number;
}

export type SceneObject = TextSceneObject | RectSceneObject | EllipseSceneObject;

export interface TimelineClip {
	id: string;
	objectId: string;
	startMs: number;
	durationMs: number;
}

export interface TimelineTrack {
	id: string;
	name: string;
	kind: 'visual' | 'audio';
	muted: boolean;
	locked: boolean;
	clips: TimelineClip[];
}

export interface ProjectAsset {
	id: string;
	name: string;
	kind: 'image' | 'audio';
	url: string;
	sizeBytes?: number;
}

export interface ProjectSettings {
	width: number;
	height: number;
	fps: number;
	durationMs: number;
	background: string;
}

export interface TimelineProject {
	schemaVersion: 1;
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	settings: ProjectSettings;
	objects: SceneObject[];
	tracks: TimelineTrack[];
	assets: ProjectAsset[];
}
