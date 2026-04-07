import { db } from '../schema.js';
import type { Classroom, Student } from '$lib/model/types.js';

export async function createClassroom(name: string): Promise<Classroom> {
	const classroom: Classroom = {
		id: crypto.randomUUID(),
		name,
		created_at: Date.now()
	};
	await db.classrooms.add(classroom);
	return classroom;
}

export async function getClassroom(id: string): Promise<Classroom | undefined> {
	return db.classrooms.get(id);
}

export async function listClassrooms(): Promise<Classroom[]> {
	return db.classrooms.toArray();
}

export async function updateClassroom(
	id: string,
	changes: Partial<Omit<Classroom, 'id'>>
): Promise<void> {
	await db.classrooms.update(id, changes);
}

export async function deleteClassroom(id: string): Promise<void> {
	await db.transaction('rw', [db.classrooms, db.students], async () => {
		await db.students.where('classroom_id').equals(id).delete();
		await db.classrooms.delete(id);
	});
}

export async function createStudent(classroomId: string, name: string): Promise<Student> {
	const student: Student = {
		id: crypto.randomUUID(),
		classroom_id: classroomId,
		name
	};
	await db.students.add(student);
	return student;
}

export async function getStudent(id: string): Promise<Student | undefined> {
	return db.students.get(id);
}

export async function listStudentsByClassroom(classroomId: string): Promise<Student[]> {
	return db.students.where('classroom_id').equals(classroomId).toArray();
}

export async function updateStudent(
	id: string,
	changes: Partial<Omit<Student, 'id'>>
): Promise<void> {
	await db.students.update(id, changes);
}

export async function deleteStudent(id: string): Promise<void> {
	await db.students.delete(id);
}
