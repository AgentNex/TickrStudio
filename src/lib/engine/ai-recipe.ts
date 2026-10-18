import { parseRecipe, type ParseResult } from './recipe-parser';
import type { TimelineProject } from '$lib/types/timeline';

export interface AiPromptRequest {
	prompt: string;
	aspectRatio?: '16:9' | '9:16' | '1:1';
	durationSeconds?: number;
}

export function generateAiRecipe(req: AiPromptRequest): { recipeText: string; project: TimelineProject } {
	const promptLower = req.prompt.toLowerCase();

	let width = 1920;
	let height = 1080;
	if (req.aspectRatio === '9:16') {
		width = 1080;
		height = 1920;
	} else if (req.aspectRatio === '1:1') {
		width = 1080;
		height = 1080;
	}

	const durationMs = (req.durationSeconds || 4) * 1000;

	// Extract title idea from prompt
	let mainTitle = 'LogiCut Studio';
	let subtitle = 'Motion in the Browser';
	let accentColor = '#D6D3C9'; // Warm ivory default
	let bgColor = '#0A0A0B'; // Obsidian dark default

	if (promptLower.includes('tech') || promptLower.includes('podcast')) {
		mainTitle = 'TECH HORIZON';
		subtitle = 'Weekly Deep Dive';
		accentColor = '#9AA7B4';
	} else if (promptLower.includes('product') || promptLower.includes('launch')) {
		mainTitle = 'Introducing Nova';
		subtitle = 'The next generation tool';
		accentColor = '#86A995';
	} else if (promptLower.includes('sale') || promptLower.includes('discount')) {
		mainTitle = 'SPECIAL EVENT';
		subtitle = 'Limited Time Only';
		accentColor = '#D2AD72';
	} else if (promptLower.includes('minimal')) {
		mainTitle = 'Elegance';
		subtitle = 'Pure Design';
		accentColor = '#D6D3C9';
	} else {
		// Clean extraction of words in quotes if any
		const quoted = req.prompt.match(/"([^"]+)"/);
		if (quoted) {
			mainTitle = quoted[1];
		} else {
			const words = req.prompt.split(/\s+/).slice(0, 4).join(' ');
			if (words.length > 3) mainTitle = words;
		}
	}

	const centerX = Math.round(width / 2);
	const centerY = Math.round(height / 2);

	const recipeLines = [
		'[RECIPE]',
		`canvas: ${width}x${height}`,
		`fps: 30`,
		`duration: ${durationMs}ms`,
		`background: ${bgColor}`,
		'',
		`rect accent_card:`,
		`  x: ${centerX}`,
		`  y: ${centerY}`,
		`  width: ${Math.round(width * 0.45)}`,
		`  height: ${Math.round(height * 0.28)}`,
		`  fill: #111113`,
		`  stroke: ${accentColor}`,
		`  strokeWidth: 2`,
		`  cornerRadius: 16`,
		`  scaleX:`,
		`    0ms: 0.7 (easeOut)`,
		`    800ms: 1.0 (easeOut)`,
		`  opacity:`,
		`    0ms: 0 (linear)`,
		`    400ms: 1 (linear)`,
		'',
		`text main_title:`,
		`  content: "${mainTitle}"`,
		`  x: ${centerX}`,
		`  y: ${centerY - 20}`,
		`  fontSize: ${Math.round(height * 0.065)}`,
		`  fill: #F5F5F0`,
		`  y:`,
		`    0ms: ${centerY + 20} (easeOut)`,
		`    900ms: ${centerY - 20} (easeOut)`,
		`  opacity:`,
		`    0ms: 0 (linear)`,
		`    600ms: 1 (linear)`,
		'',
		`text subtitle:`,
		`  content: "${subtitle}"`,
		`  x: ${centerX}`,
		`  y: ${centerY + 45}`,
		`  fontSize: ${Math.round(height * 0.03)}`,
		`  fill: #A1A1AA`,
		`  opacity:`,
		`    0ms: 0 (linear)`,
		`    600ms: 0 (linear)`,
		`    1200ms: 1 (easeOut)`,
		'',
		`ellipse glow_accent:`,
		`  x: ${centerX}`,
		`  y: ${centerY}`,
		`  radiusX: ${Math.round(width * 0.22)}`,
		`  radiusY: ${Math.round(height * 0.12)}`,
		`  fill: #19191C`,
		`  stroke: ${accentColor}`,
		`  strokeWidth: 1`,
		`  opacity:`,
		`    0ms: 0 (linear)`,
		`    400ms: 0.35 (easeOut)`,
		`    ${durationMs}ms: 0.15 (easeInOut)`,
		'',
		'[/RECIPE]'
	];

	const recipeText = recipeLines.join('\n');
	const parseResult = parseRecipe(recipeText);

	if (!parseResult.success || !parseResult.project) {
		throw new Error('Failed to generate valid AI recipe: ' + parseResult.errors[0]?.message);
	}

	parseResult.project.name = mainTitle;
	return {
		recipeText,
		project: parseResult.project
	};
}
