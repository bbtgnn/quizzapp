import type { ClassroomRepository } from '$lib/ports/classroom-repository.js';
import * as impl from './repositories/classrooms.js';

export const dexieClassroomRepository: ClassroomRepository = {
	createClassroom: impl.createClassroom,
	getClassroom: impl.getClassroom,
	listClassrooms: impl.listClassrooms,
	updateClassroom: impl.updateClassroom,
	deleteClassroom: impl.deleteClassroom,
	createStudent: impl.createStudent,
	getStudent: impl.getStudent,
	listStudentsByClassroom: impl.listStudentsByClassroom,
	updateStudent: impl.updateStudent,
	deleteStudent: impl.deleteStudent
};
