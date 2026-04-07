import { error } from '@sveltejs/kit';
import { classroomRepository } from '$lib/app/index.js';

export const load = async ({ params }) => {
	const id = params.id;
	if (!id) throw error(404, { message: 'Classroom not found' });

	try {
		const classroom = await classroomRepository.getClassroom(id);
		if (!classroom) throw error(404, { message: 'Classroom not found' });
		const students = await classroomRepository.listStudentsByClassroom(id);
		return { classroom, students };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load classroom:', e);
		throw error(500, { message: 'Could not load classroom.' });
	}
};
