import { listClassrooms, listQuestionSets } from '$lib/db/index.js';

export const load = async () => {
	try {
		const [dbClassrooms, dbQuestionSets] = await Promise.all([
			listClassrooms(),
			listQuestionSets()
		]);
		return {
			classrooms: dbClassrooms.sort((a, b) => b.created_at - a.created_at),
			questionSets: dbQuestionSets.sort((a, b) => b.imported_at - a.imported_at),
			loadError: null as string | null
		};
	} catch (e) {
		console.error('Failed to load data:', e);
		return {
			classrooms: [],
			questionSets: [],
			loadError: 'Failed to load classrooms and question sets.'
		};
	}
};
