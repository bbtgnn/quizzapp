import { error } from '@sveltejs/kit';
import { loadClassroomsIndex } from '$lib/data/loaders/classrooms-index.js';

export const load = async () => {
	try {
		return await loadClassroomsIndex();
	} catch (e) {
		console.error('Failed to load classrooms:', e);
		throw error(500, { message: 'Could not load classrooms.' });
	}
};
