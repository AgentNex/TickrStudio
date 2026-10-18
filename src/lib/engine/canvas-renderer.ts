import type { RenderState, EvaluatedSceneObject } from './evaluator';

export interface RendererOptions {
	scale?: number;
	selectedObjectId?: string | null;
	drawGizmos?: boolean;
}

export function renderSceneToCanvas(
	ctx: CanvasRenderingContext2D,
	state: RenderState,
	options: RendererOptions = {}
): void {
	const { selectedObjectId = null, drawGizmos = false } = options;

	const canvasWidth = ctx.canvas.width;
	const canvasHeight = ctx.canvas.height;

	// Clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// Compute scaling to fit canvas while preserving scene aspect ratio
	const scaleX = canvasWidth / state.width;
	const scaleY = canvasHeight / state.height;
	const fitScale = Math.min(scaleX, scaleY);

	const offsetX = (canvasWidth - state.width * fitScale) / 2;
	const offsetY = (canvasHeight - state.height * fitScale) / 2;

	ctx.save();
	ctx.translate(offsetX, offsetY);
	ctx.scale(fitScale, fitScale);

	// 1. Draw composition background
	ctx.fillStyle = state.background || '#0A0A0B';
	ctx.fillRect(0, 0, state.width, state.height);

	// 2. Clip strictly to composition canvas bounds
	ctx.beginPath();
	ctx.rect(0, 0, state.width, state.height);
	ctx.clip();

	// 3. Render each evaluated object in scene order
	for (const obj of state.objects) {
		renderObject(ctx, obj);
	}

	// 4. If gizmos are requested and an object is selected, render editor selection box
	if (drawGizmos && selectedObjectId) {
		const selected = state.objects.find((o) => o.id === selectedObjectId);
		if (selected) {
			renderSelectionGizmo(ctx, selected);
		}
	}

	ctx.restore();
}

function renderObject(ctx: CanvasRenderingContext2D, obj: EvaluatedSceneObject): void {
	ctx.save();

	// Apply transforms
	ctx.translate(obj.transform.x, obj.transform.y);
	if (obj.transform.rotationDeg) {
		ctx.rotate((obj.transform.rotationDeg * Math.PI) / 180);
	}
	ctx.scale(obj.transform.scaleX, obj.transform.scaleY);
	ctx.globalAlpha = Math.max(0, Math.min(1, obj.transform.opacity));

	if (obj.type === 'text' && obj.content) {
		ctx.font = `${obj.fontWeight || '400'} ${obj.fontSize || 48}px ${obj.fontFamily || 'Inter, sans-serif'}`;
		ctx.fillStyle = obj.fill || '#F5F5F0';
		ctx.textAlign = obj.align || 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(obj.content, 0, 0);

		if (obj.stroke && obj.strokeWidth) {
			ctx.strokeStyle = obj.stroke;
			ctx.lineWidth = obj.strokeWidth;
			ctx.strokeText(obj.content, 0, 0);
		}
	} else if (obj.type === 'rect') {
		const w = obj.width || 200;
		const h = obj.height || 100;
		const x = -w / 2;
		const y = -h / 2;
		const r = Math.min(obj.cornerRadius || 0, w / 2, h / 2);

		ctx.beginPath();
		if (r > 0 && typeof ctx.roundRect === 'function') {
			ctx.roundRect(x, y, w, h, r);
		} else {
			ctx.rect(x, y, w, h);
		}

		if (obj.fill) {
			ctx.fillStyle = obj.fill;
			ctx.fill();
		}
		if (obj.stroke && obj.strokeWidth) {
			ctx.strokeStyle = obj.stroke;
			ctx.lineWidth = obj.strokeWidth;
			ctx.stroke();
		}
	} else if (obj.type === 'ellipse') {
		const rx = Math.max(1, obj.radiusX || 50);
		const ry = Math.max(1, obj.radiusY || 50);

		ctx.beginPath();
		ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);

		if (obj.fill) {
			ctx.fillStyle = obj.fill;
			ctx.fill();
		}
		if (obj.stroke && obj.strokeWidth) {
			ctx.strokeStyle = obj.stroke;
			ctx.lineWidth = obj.strokeWidth;
			ctx.stroke();
		}
	}

	ctx.restore();
}

function renderSelectionGizmo(ctx: CanvasRenderingContext2D, obj: EvaluatedSceneObject): void {
	ctx.save();
	ctx.translate(obj.transform.x, obj.transform.y);
	if (obj.transform.rotationDeg) {
		ctx.rotate((obj.transform.rotationDeg * Math.PI) / 180);
	}
	ctx.scale(obj.transform.scaleX, obj.transform.scaleY);

	let w = 100;
	let h = 100;
	if (obj.type === 'text') {
		ctx.font = `${obj.fontWeight || '400'} ${obj.fontSize || 48}px ${obj.fontFamily || 'Inter, sans-serif'}`;
		const metrics = ctx.measureText(obj.content || '');
		w = metrics.width + 24;
		h = (obj.fontSize || 48) * 1.2;
	} else if (obj.type === 'rect') {
		w = (obj.width || 200) + 8;
		h = (obj.height || 100) + 8;
	} else if (obj.type === 'ellipse') {
		w = ((obj.radiusX || 50) + 4) * 2;
		h = ((obj.radiusY || 50) + 4) * 2;
	}

	// Selection rectangle
	ctx.strokeStyle = '#D6D3C9'; // Warm ivory accent
	ctx.lineWidth = 1.5;
	ctx.setLineDash([4, 4]);
	ctx.strokeRect(-w / 2, -h / 2, w, h);
	ctx.setLineDash([]);

	// Corner handles
	ctx.fillStyle = '#FFFFFF';
	ctx.strokeStyle = '#171715';
	ctx.lineWidth = 1;
	const handleSize = 6;
	const corners = [
		[-w / 2, -h / 2],
		[w / 2, -h / 2],
		[-w / 2, h / 2],
		[w / 2, h / 2]
	];
	for (const [cx, cy] of corners) {
		ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
		ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
	}

	ctx.restore();
}

export function hitTestObject(
	state: RenderState,
	sceneX: number,
	sceneY: number
): EvaluatedSceneObject | null {
	// Reverse order (top-most first)
	for (let i = state.objects.length - 1; i >= 0; i--) {
		const obj = state.objects[i];
		const dx = sceneX - obj.transform.x;
		const dy = sceneY - obj.transform.y;

		let w = 100;
		let h = 100;
		if (obj.type === 'rect') {
			w = obj.width || 200;
			h = obj.height || 100;
		} else if (obj.type === 'ellipse') {
			w = (obj.radiusX || 50) * 2;
			h = (obj.radiusY || 50) * 2;
		} else if (obj.type === 'text') {
			w = (obj.fontSize || 48) * (obj.content?.length || 1) * 0.6;
			h = obj.fontSize || 48;
		}

		if (Math.abs(dx) <= (w * obj.transform.scaleX) / 2 && Math.abs(dy) <= (h * obj.transform.scaleY) / 2) {
			return obj;
		}
	}
	return null;
}
