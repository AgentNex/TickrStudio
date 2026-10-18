import type {
	TimelineProject,
	SceneObject,
	Keyframe,
	EasingName,
	SceneObjectType
} from '$lib/types/timeline';
import { VALID_EASINGS } from './timeline-schema';

export interface ParseError {
	line: number;
	column: number;
	message: string;
}

export interface ParseResult {
	success: boolean;
	project?: TimelineProject;
	errors: ParseError[];
}

export function parseRecipe(input: string): ParseResult {
	const errors: ParseError[] = [];
	const rawLines = input.split(/\r?\n/);

	let inRecipe = false;
	let recipeStartLine = 1;
	let recipeEndLine = rawLines.length;

	// Check for [RECIPE] and [/RECIPE] tags
	for (let i = 0; i < rawLines.length; i++) {
		const trimmed = rawLines[i].trim();
		if (trimmed === '[RECIPE]') {
			inRecipe = true;
			recipeStartLine = i + 1;
		} else if (trimmed === '[/RECIPE]') {
			recipeEndLine = i + 1;
			break;
		}
	}

	if (!inRecipe) {
		errors.push({
			line: 1,
			column: 1,
			message: 'Missing opening [RECIPE] tag.'
		});
		return { success: false, errors };
	}

	// Settings defaults
	let width = 1920;
	let height = 1080;
	let fps = 30;
	let durationMs = 4000;
	let background = '#0A0A0B';

	const objects: SceneObject[] = [];
	let currentObj: Partial<SceneObject> | null = null;
	let currentProp: string | null = null;

	const now = new Date().toISOString();

	for (let lineIdx = recipeStartLine; lineIdx < recipeEndLine - 1; lineIdx++) {
		const lineNum = lineIdx + 1;
		const line = rawLines[lineIdx];
		const trimmed = line.trim();

		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
			continue;
		}

		const indent = line.search(/\S/);

		// Top-level or Settings: indent == 0
		if (indent === 0) {
			currentProp = null;

			// Global settings
			if (trimmed.startsWith('canvas:')) {
				const val = trimmed.replace('canvas:', '').trim();
				const match = val.match(/^(\d+)\s*[xX]\s*(\d+)$/);
				if (match) {
					const w = parseInt(match[1], 10);
					const h = parseInt(match[2], 10);
					if (w > 0 && h > 0 && w <= 4320 && h <= 4320) {
						width = w;
						height = h;
					} else {
						errors.push({ line: lineNum, column: 8, message: `Canvas width and height must be between 1 and 4320 px (got ${w}x${h})` });
					}
				} else {
					errors.push({ line: lineNum, column: 8, message: `Invalid canvas format: expected "WIDTHxHEIGHT" (e.g. 1920x1080), got "${val}"` });
				}
				continue;
			}

			if (trimmed.startsWith('fps:')) {
				const val = parseInt(trimmed.replace('fps:', '').trim(), 10);
				if (!isNaN(val) && val > 0 && val <= 120) {
					fps = val;
				} else {
					errors.push({ line: lineNum, column: 5, message: `Invalid FPS: must be between 1 and 120` });
				}
				continue;
			}

			if (trimmed.startsWith('duration:')) {
				const val = trimmed.replace('duration:', '').trim();
				let parsedMs = 0;
				if (val.endsWith('ms')) {
					parsedMs = parseInt(val.replace('ms', ''), 10);
				} else if (val.endsWith('s')) {
					parsedMs = parseFloat(val.replace('s', '')) * 1000;
				} else {
					parsedMs = parseInt(val, 10);
				}
				if (!isNaN(parsedMs) && parsedMs >= 100) {
					durationMs = parsedMs;
				} else {
					errors.push({ line: lineNum, column: 10, message: `Invalid duration: must be at least 100ms` });
				}
				continue;
			}

			if (trimmed.startsWith('background:')) {
				background = trimmed.replace('background:', '').trim();
				continue;
			}

			// Object header: <type> <name>:
			const objMatch = trimmed.match(/^(text|rect|ellipse)\s+([a-zA-Z0-9_\-]+):$/i);
			if (objMatch) {
				const type = objMatch[1].toLowerCase() as SceneObjectType;
				const name = objMatch[2];
				const objId = 'obj_' + Math.random().toString(36).slice(2, 9);

				const baseTransform = {
					x: width / 2,
					y: height / 2,
					scaleX: 1,
					scaleY: 1,
					rotationDeg: 0,
					opacity: 1
				};

				let newObj: SceneObject;
				if (type === 'text') {
					newObj = {
						id: objId,
						name,
						type: 'text',
						visible: true,
						locked: false,
						transform: baseTransform,
						keyframes: {},
						content: name,
						fontSize: 48,
						fontFamily: 'Inter, sans-serif',
						fontWeight: '600',
						fill: '#F5F5F0',
						align: 'center'
					};
				} else if (type === 'rect') {
					newObj = {
						id: objId,
						name,
						type: 'rect',
						visible: true,
						locked: false,
						transform: baseTransform,
						keyframes: {},
						width: 300,
						height: 200,
						fill: '#19191C',
						stroke: '#D6D3C9',
						strokeWidth: 2,
						cornerRadius: 8
					};
				} else {
					newObj = {
						id: objId,
						name,
						type: 'ellipse',
						visible: true,
						locked: false,
						transform: baseTransform,
						keyframes: {},
						radiusX: 120,
						radiusY: 120,
						fill: '#19191C',
						stroke: '#D6D3C9',
						strokeWidth: 2
					};
				}

				objects.push(newObj);
				currentObj = newObj;
				continue;
			}

			errors.push({
				line: lineNum,
				column: 1,
				message: `Unrecognized statement: "${trimmed}"`
			});
			continue;
		}

		// Indented level 1 (Object property or keyframe property header): indent >= 2
		if (indent >= 2 && currentObj) {
			const colonIdx = trimmed.indexOf(':');
			if (colonIdx === -1) {
				errors.push({ line: lineNum, column: indent + 1, message: `Expected "property: value"` });
				continue;
			}

			const propName = trimmed.slice(0, colonIdx).trim();
			const propVal = trimmed.slice(colonIdx + 1).trim();

			// If propVal is empty, this begins a keyframe block, e.g. "opacity:" or "scaleX:"
			if (!propVal) {
				currentProp = propName;
				if (!currentObj.keyframes) currentObj.keyframes = {};
				if (!currentObj.keyframes[propName]) currentObj.keyframes[propName] = [];
				continue;
			}

			// Indented level 2 (Keyframe value inside a property): e.g. "0ms: 0 (easeOut)"
			if (currentProp && (indent >= 4 || propName.endsWith('ms') || propName.endsWith('s'))) {
				const timeMatch = propName.match(/^(\d+)(ms|s)?$/);
				if (timeMatch) {
					let time = parseInt(timeMatch[1], 10);
					if (timeMatch[2] === 's') time *= 1000;

					let value: any = propVal;
					let easing: EasingName = 'linear';

					// Check for (easing) suffix: e.g. "1.0 (easeOut)"
					const easeMatch = propVal.match(/^(.*?)\s*\(([a-zA-Z]+)\)$/);
					if (easeMatch) {
						value = easeMatch[1].trim();
						const parsedEasing = easeMatch[2].trim() as EasingName;
						if (VALID_EASINGS.has(parsedEasing)) {
							easing = parsedEasing;
						} else {
							errors.push({ line: lineNum, column: line.indexOf('(') + 1, message: `Invalid easing: "${parsedEasing}". Expected linear, easeIn, easeOut, or easeInOut.` });
						}
					}

					// Parse numeric value if possible
					if (!isNaN(Number(value))) {
						value = Number(value);
					}

					currentObj.keyframes![currentProp]!.push({
						id: 'kf_' + Math.random().toString(36).slice(2, 9),
						timeMs: time,
						value,
						easing
					});
					continue;
				}
			}

			// Regular property assignments on currentObj
			currentProp = null;
			let parsedVal: any = propVal;

			// Handle quoted strings: "Make it move."
			if (propVal.startsWith('"') && propVal.endsWith('"')) {
				parsedVal = propVal
					.slice(1, -1)
					.replace(/\\n/g, '\n')
					.replace(/\\"/g, '"')
					.replace(/\\\\/g, '\\');
			} else if (!isNaN(Number(propVal))) {
				parsedVal = Number(propVal);
			}

			switch (propName) {
				case 'x':
				case 'y':
				case 'scaleX':
				case 'scaleY':
				case 'rotationDeg':
				case 'opacity':
					if (!Number.isFinite(Number(parsedVal))) {
						errors.push({ line: lineNum, column: indent + 1, message: `Property "${propName}" must be a finite number, got "${propVal}"` });
					} else if (currentObj.transform) {
						(currentObj.transform as any)[propName] = Number(parsedVal);
					}
					break;
				case 'visible':
					currentObj.visible = String(parsedVal).toLowerCase() !== 'false';
					break;
				case 'locked':
					currentObj.locked = String(parsedVal).toLowerCase() === 'true';
					break;
				case 'content':
					if (currentObj.type === 'text') {
						(currentObj as any).content = String(parsedVal);
					}
					break;
				case 'fontSize':
				case 'fontFamily':
				case 'fontWeight':
				case 'align':
				case 'fill':
				case 'stroke':
				case 'strokeWidth':
				case 'cornerRadius':
				case 'width':
				case 'height':
				case 'radiusX':
				case 'radiusY':
					(currentObj as any)[propName] = parsedVal;
					break;
				default:
					errors.push({ line: lineNum, column: indent + 1, message: `Unknown property "${propName}" on ${currentObj.type}` });
			}
		}
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	// Generate corresponding tracks and clips for visual editor
	const tracks = objects.map((obj, idx) => ({
		id: `track_${idx + 1}`,
		name: `${obj.name} Track`,
		kind: 'visual' as const,
		muted: false,
		locked: obj.locked,
		clips: [
			{
				id: `clip_${idx + 1}`,
				objectId: obj.id,
				startMs: 0,
				durationMs
			}
		]
	}));

	const project: TimelineProject = {
		schemaVersion: 1,
		id: 'proj_' + Math.random().toString(36).slice(2, 9),
		name: 'Recipe Composition',
		createdAt: now,
		updatedAt: now,
		settings: {
			width,
			height,
			fps,
			durationMs,
			background
		},
		objects,
		tracks,
		assets: []
	};

	return {
		success: true,
		project,
		errors: []
	};
}
