export interface ExportCapabilities {
	supported: boolean;
	method: 'webcodecs-mp4' | 'mediarecorder-webm' | 'unsupported';
	codec: string;
	reason?: string;
}

export async function checkExportCapabilities(
	width = 1920,
	height = 1080,
	fps = 30
): Promise<ExportCapabilities> {
	if (typeof window === 'undefined') {
		return {
			supported: false,
			method: 'unsupported',
			codec: '',
			reason: 'Browser environment required'
		};
	}

	// 1. Probe WebCodecs VideoEncoder (MP4 H.264)
	if ('VideoEncoder' in window && typeof window.VideoEncoder === 'function') {
		try {
			const candidateCodec = 'avc1.42001f'; // H.264 Baseline Profile
			const support = await window.VideoEncoder.isConfigSupported({
				codec: candidateCodec,
				width,
				height,
				bitrate: 5_000_000,
				framerate: fps
			});

			if (support.supported) {
				return {
					supported: true,
					method: 'webcodecs-mp4',
					codec: candidateCodec
				};
			}
		} catch (err) {
			console.warn('WebCodecs isConfigSupported probe failed:', err);
		}
	}

	// 2. Probe MediaRecorder fallback
	if ('MediaRecorder' in window && typeof window.MediaRecorder === 'function') {
		const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
		for (const t of types) {
			if (window.MediaRecorder.isTypeSupported(t)) {
				return {
					supported: true,
					method: 'mediarecorder-webm',
					codec: t
				};
			}
		}
	}

	return {
		supported: false,
		method: 'unsupported',
		codec: '',
		reason: 'Neither WebCodecs nor MediaRecorder are supported in this browser environment.'
	};
}
