import type { TimelineProject, SceneObject } from '$lib/types/timeline';

export function serializeToRecipe(project: TimelineProject): string {
	const lines: string[] = [];

	lines.push('[RECIPE]');
	lines.push(`canvas: ${project.settings.width}x${project.settings.height}`);
	lines.push(`fps: ${project.settings.fps}`);
	lines.push(`duration: ${project.settings.durationMs}ms`);
	lines.push(`background: ${project.settings.background}`);
	lines.push('');

	for (const obj of project.objects) {
		const safeName = obj.name.replace(/[^a-zA-Z0-9_\-]/g, '_') || obj.type;
		lines.push(`${obj.type} ${safeName}:`);

		if (obj.visible === false) lines.push(`  visible: false`);
		if (obj.locked === true) lines.push(`  locked: true`);

		if (obj.type === 'text') {
			const escapedContent = (obj.content || '')
				.replace(/\\/g, '\\\\')
				.replace(/"/g, '\\"')
				.replace(/\n/g, '\\n');
			lines.push(`  content: "${escapedContent}"`);
			lines.push(`  x: ${Math.round(obj.transform.x)}`);
			lines.push(`  y: ${Math.round(obj.transform.y)}`);
			lines.push(`  fontSize: ${obj.fontSize}`);
			if (obj.fontWeight) lines.push(`  fontWeight: "${obj.fontWeight}"`);
			if (obj.fontFamily) lines.push(`  fontFamily: "${obj.fontFamily}"`);
			if (obj.align) lines.push(`  align: ${obj.align}`);
			lines.push(`  fill: ${obj.fill}`);
		} else if (obj.type === 'rect') {
			lines.push(`  x: ${Math.round(obj.transform.x)}`);
			lines.push(`  y: ${Math.round(obj.transform.y)}`);
			lines.push(`  width: ${obj.width}`);
			lines.push(`  height: ${obj.height}`);
			lines.push(`  fill: ${obj.fill}`);
			if (obj.stroke) lines.push(`  stroke: ${obj.stroke}`);
			if (obj.strokeWidth) lines.push(`  strokeWidth: ${obj.strokeWidth}`);
			if (obj.cornerRadius) lines.push(`  cornerRadius: ${obj.cornerRadius}`);
		} else if (obj.type === 'ellipse') {
			lines.push(`  x: ${Math.round(obj.transform.x)}`);
			lines.push(`  y: ${Math.round(obj.transform.y)}`);
			lines.push(`  radiusX: ${obj.radiusX}`);
			lines.push(`  radiusY: ${obj.radiusY}`);
			lines.push(`  fill: ${obj.fill}`);
			if (obj.stroke) lines.push(`  stroke: ${obj.stroke}`);
			if (obj.strokeWidth) lines.push(`  strokeWidth: ${obj.strokeWidth}`);
		}

		if (obj.transform.scaleX !== 1) lines.push(`  scaleX: ${obj.transform.scaleX}`);
		if (obj.transform.scaleY !== 1) lines.push(`  scaleY: ${obj.transform.scaleY}`);
		if (obj.transform.rotationDeg !== 0) lines.push(`  rotationDeg: ${obj.transform.rotationDeg}`);
		if (obj.transform.opacity !== 1) lines.push(`  opacity: ${obj.transform.opacity}`);

		// Keyframes
		if (obj.keyframes) {
			for (const prop in obj.keyframes) {
				const kfs = obj.keyframes[prop];
				if (kfs && kfs.length > 0) {
					lines.push(`  ${prop}:`);
					for (const kf of kfs) {
						const easePart = kf.easing && kf.easing !== 'linear' ? ` (${kf.easing})` : '';
						lines.push(`    ${kf.timeMs}ms: ${kf.value}${easePart}`);
					}
				}
			}
		}

		lines.push('');
	}

	lines.push('[/RECIPE]');
	return lines.join('\n');
}
