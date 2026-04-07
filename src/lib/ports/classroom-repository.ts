import type { Classroom, Student } from '$lib/model/types.js';

export interface ClassroomRepository {
	createClassroom(name: string): Promise<Classroom>;
	getClassroom(id: string): Promise<Classroom | undefined>;
	listClassrooms(): Promise<Classroom[]>;
	updateClassroom(id: string, changes: Partial<Omit<Classroom, 'id'>>): Promise<void>;
	deleteClassroom(id: string): Promise<void>;
	createStudent(classroomId: string, name: string): Promise<Student>;
	getStudent(id: string): Promise<Student | undefined>;
	listStudentsByClassroom(classroomId: string): Promise<Student[]>;
	updateStudent(id: string, changes: Partial<Omit<Student, 'id'>>): Promise<void>;
	deleteStudent(id: string): Promise<void>;
}
