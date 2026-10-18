import type { TimelineProject, SceneObject, Keyframe, EasingName } from '$lib/types/timeline';
import { VALID_EASINGS } from './timeline-schema';

export function serializeToXml(project: TimelineProject): string {
	const lines: string[] = [];
	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(
		`<composition schemaVersion="1" width="${project.settings.width}" height="${project.settings.height}" fps="${project.settings.fps}" duration="${project.settings.durationMs}" background="${project.settings.background}">`
	);

	for (const obj of project.objects) {
		const baseAttrs = `id="${obj.id}" name="${escapeXml(obj.name)}" x="${obj.transform.x}" y="${obj.transform.y}" scaleX="${obj.transform.scaleX}" scaleY="${obj.transform.scaleY}" rotationDeg="${obj.transform.rotationDeg}" opacity="${obj.transform.opacity}"`;

		if (obj.type === 'text') {
			lines.push(`  <text ${baseAttrs} fontSize="${obj.fontSize}" fill="${obj.fill}" align="${obj.align}">`);
			lines.push(`    <content>${escapeXml(obj.content)}</content>`);
		} else if (obj.type === 'rect') {
			lines.push(
				`  <rect ${baseAttrs} width="${obj.width}" height="${obj.height}" fill="${obj.fill}" stroke="${obj.stroke || ''}" strokeWidth="${obj.strokeWidth || 0}" cornerRadius="${obj.cornerRadius || 0}">`
			);
		} else if (obj.type === 'ellipse') {
			lines.push(
				`  <ellipse ${baseAttrs} radiusX="${obj.radiusX}" radiusY="${obj.radiusY}" fill="${obj.fill}" stroke="${obj.stroke || ''}" strokeWidth="${obj.strokeWidth || 0}">`
			);
		}

		// Keyframes
		if (obj.keyframes) {
			lines.push('    <keyframes>');
			for (const prop in obj.keyframes) {
				const kfs = obj.keyframes[prop];
				if (kfs) {
					for (const kf of kfs) {
						lines.push(
							`      <keyframe property="${prop}" time="${kf.timeMs}" value="${escapeXml(String(kf.value))}" easing="${kf.easing}" />`
						);
					}
				}
			}
			lines.push('    </keyframes>');
		}

		lines.push(`  </${obj.type}>`);
	}

	lines.push('</composition>');
	return lines.join('\n');
}

export function parseXmlSubset(xmlString: string): { success: boolean; project?: TimelineProject; error?: string } {
	try {
		// Strict, regex-based safe XML parser for the documented subset (no DOMParser execution / no script tags)
		if (/<script/i.test(xmlString)) {
			return { success: false, error: 'Unsafe tag <script> detected and rejected.' };
		}

		const compMatch = xmlString.match(/<composition\s+([^>]+)>/i);
		if (!compMatch) {
			return { success: false, error: 'Missing root <composition> element.' };
		}

		const attrsStr = compMatch[1];
		const getAttr = (name: string, def = '') => {
			const m = attrsStr.match(new RegExp(`${name}="([^"]*)"`, 'i'));
			return m ? m[1] : def;
		};

		const width = parseInt(getAttr('width', '1920'), 10);
		const height = parseInt(getAttr('height', '1080'), 10);
		const fps = parseInt(getAttr('fps', '30'), 10);
		const durationMs = parseInt(getAttr('duration', '4000'), 10);
		const background = getAttr('background', '#0A0A0B');

		const objects: SceneObject[] = [];
		const now = new Date().toISOString();

		// Match individual object tags
		const objRegex = /<(text|rect|ellipse)\s+([^>]+)>(.*?)<\/\1>/gis;
		let match: RegExpExecArray | null;

		while ((match = objRegex.exec(xmlString)) !== null) {
			const type = match[1].toLowerCase() as 'text' | 'rect' | 'ellipse';
			const objAttrs = match[2];
			const innerContent = match[3];

			const getObjAttr = (name: string, def = '') => {
				const m = objAttrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
				return m ? m[1] : def;
			};

			const id = getObjAttr('id', 'obj_' + Math.random().toString(36).slice(2, 9));
			const name = unescapeXml(getObjAttr('name', type));
			const x = parseFloat(getObjAttr('x', String(width / 2)));
			const y = parseFloat(getObjAttr('y', String(height / 2)));
			const scaleX = parseFloat(getObjAttr('scaleX', '1'));
			const scaleY = parseFloat(getObjAttr('scaleY', '1'));
			const rotationDeg = parseFloat(getObjAttr('rotationDeg', '0'));
			const opacity = parseFloat(getObjAttr('opacity', '1'));

			const keyframes: Record<string, Keyframe<any>[]> = {};
			const kfRegex = /<keyframe\s+([^>]+)\/>/gi;
			let kfMatch: RegExpExecArray | null;
			while ((kfMatch = kfRegex.exec(innerContent)) !== null) {
				const kfAttrs = kfMatch[1];
				const getKfAttr = (k: string) => {
					const m = kfAttrs.match(new RegExp(`${k}="([^"]*)"`, 'i'));
					return m ? m[1] : '';
				};
				const prop = getKfAttr('property');
				const time = parseInt(getKfAttr('time'), 10);
				const rawVal = unescapeXml(getKfAttr('value'));
				const easing = (getKfAttr('easing') || 'linear') as EasingName;
				const parsedVal = isNaN(Number(rawVal)) ? rawVal : Number(rawVal);

				if (prop && !isNaN(time)) {
					if (!keyframes[prop]) keyframes[prop] = [];
					keyframes[prop].push({
						id: 'kf_' + Math.random().toString(36).slice(2, 9),
						timeMs: time,
						value: parsedVal,
						easing: VALID_EASINGS.has(easing) ? easing : 'linear'
					});
				}
			}

			const baseTransform = { x, y, scaleX, scaleY, rotationDeg, opacity };

			if (type === 'text') {
				const contentMatch = innerContent.match(/<content>(.*?)<\/content>/is);
				const content = contentMatch ? unescapeXml(contentMatch[1]) : name;
				const fontSize = parseFloat(getObjAttr('fontSize', '48'));
				const fill = getObjAttr('fill', '#F5F5F0');
				const align = (getObjAttr('align', 'center') as any) || 'center';

				objects.push({
					id,
					name,
					type: 'text',
					visible: true,
					locked: false,
					transform: baseTransform,
					keyframes,
					content,
					fontSize,
					fontFamily: 'Inter, sans-serif',
					fontWeight: '600',
					fill,
					align
				});
			} else if (type === 'rect') {
				const w = parseFloat(getObjAttr('width', '300'));
				const h = parseFloat(getObjAttr('height', '200'));
				const fill = getObjAttr('fill', '#19191C');
				const stroke = getObjAttr('stroke', '');
				const strokeWidth = parseFloat(getObjAttr('strokeWidth', '0'));
				const cornerRadius = parseFloat(getObjAttr('cornerRadius', '0'));

				objects.push({
					id,
					name,
					type: 'rect',
					visible: true,
					locked: false,
					transform: baseTransform,
					keyframes,
					width: w,
					height: h,
					fill,
					stroke: stroke || undefined,
					strokeWidth: strokeWidth || undefined,
					cornerRadius: cornerRadius || undefined
				});
			} else if (type === 'ellipse') {
				const rx = parseFloat(getObjAttr('radiusX', '100'));
				const ry = parseFloat(getObjAttr('radiusY', '100'));
				const fill = getObjAttr('fill', '#19191C');
				const stroke = getObjAttr('stroke', '');
				const strokeWidth = parseFloat(getObjAttr('strokeWidth', '0'));

				objects.push({
					id,
					name,
					type: 'ellipse',
					visible: true,
					locked: false,
					transform: baseTransform,
					keyframes,
					radiusX: rx,
					radiusY: ry,
					fill,
					stroke: stroke || undefined,
					strokeWidth: strokeWidth || undefined
				});
			}
		}

		const tracks = objects.map((obj, i) => ({
			id: `track_${i + 1}`,
			name: `${obj.name} Track`,
			kind: 'visual' as const,
			muted: false,
			locked: false,
			clips: [{ id: `clip_${i + 1}`, objectId: obj.id, startMs: 0, durationMs }]
		}));

		return {
			success: true,
			project: {
				schemaVersion: 1,
				id: 'proj_' + Math.random().toString(36).slice(2, 9),
				name: 'Imported Composition',
				createdAt: now,
				updatedAt: now,
				settings: { width, height, fps, durationMs, background },
				objects,
				tracks,
				assets: []
			}
		};
	} catch (err: any) {
		return { success: false, error: err?.message || 'XML parsing failed' };
	}
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function unescapeXml(str: string): string {
	return str
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}
