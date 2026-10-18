/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				bg: 'var(--color-bg)',
				'surface-1': 'var(--color-surface-1)',
				'surface-2': 'var(--color-surface-2)',
				'surface-3': 'var(--color-surface-3)',
				border: 'var(--color-border)',
				'border-strong': 'var(--color-border-strong)',
				text: 'var(--color-text)',
				'text-secondary': 'var(--color-text-secondary)',
				'text-muted': 'var(--color-text-muted)',
				accent: 'var(--color-accent)',
				'accent-hover': 'var(--color-accent-hover)',
				'accent-foreground': 'var(--color-accent-foreground)',
				success: 'var(--color-success)',
				warning: 'var(--color-warning)',
				danger: 'var(--color-danger)',
				info: 'var(--color-info)'
			},
			borderRadius: {
				xs: 'var(--radius-xs)',
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)'
			},
			fontFamily: {
				sans: [
					'Inter',
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'sans-serif'
				],
				mono: [
					'"JetBrains Mono"',
					'ui-monospace',
					'SFMono-Regular',
					'Menlo',
					'Monaco',
					'Consolas',
					'monospace'
				]
			}
		}
	},
	plugins: []
};
