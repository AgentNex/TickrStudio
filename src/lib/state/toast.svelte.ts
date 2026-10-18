export interface ToastMessage {
	id: string;
	title: string;
	message?: string;
	type?: 'info' | 'success' | 'warning' | 'error';
	durationMs?: number;
}

class ToastStore {
	toasts = $state<ToastMessage[]>([]);

	show(message: Omit<ToastMessage, 'id'>) {
		const id = Math.random().toString(36).slice(2, 9);
		const toast: ToastMessage = {
			...message,
			id,
			type: message.type || 'info',
			durationMs: message.durationMs ?? 3500
		};
		this.toasts.push(toast);

		if (toast.durationMs && toast.durationMs > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, toast.durationMs);
		}
		return id;
	}

	success(title: string, message?: string) {
		return this.show({ title, message, type: 'success' });
	}

	error(title: string, message?: string) {
		return this.show({ title, message, type: 'error', durationMs: 5000 });
	}

	info(title: string, message?: string) {
		return this.show({ title, message, type: 'info' });
	}

	warning(title: string, message?: string) {
		return this.show({ title, message, type: 'warning' });
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
