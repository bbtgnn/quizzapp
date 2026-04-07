export {
	sessionRepository,
	classroomRepository,
	questionSetRepository,
	attemptRepository,
	repositories,
	createRepositories,
	type AppRepositories
} from './repositories.js';
export {
	sessionEnginePersistence,
	createSessionEnginePersistence
} from './session-engine-persistence.js';
export type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
export {
	exportFullBackup,
	importFullBackupFromFile,
	type ImportBackupResult
} from './backup.js';
export { listSessionsOrderedByStartedAt } from '$lib/application/sessions/sessions.service.js';
export { persistQuestionSet } from '$lib/application/question-sets/persist-question-set.js';
