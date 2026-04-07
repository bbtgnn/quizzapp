# Hexagonal ports & adapters — implementation plan

> **Status (2026-04-07):** The temporary folder **`src/lib/db/`** has been **removed** after migration. Use **`$lib/app`** and **`$lib/model`** for application imports; Dexie lives only under **`src/lib/adapters/persistence/dexie/`**. The file map and task checklist below are **historical** migration context.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the client data and domain code into **ports**, **Dexie adapters**, **`application` services**, and **`$lib/app` composition**, without changing user-visible behavior, and make **SessionEngine** independent of concrete persistence imports.

**Architecture:** Canonical entity types live in **`src/lib/model/types.ts`**. **`src/lib/ports/`** holds repository interfaces. **`src/lib/adapters/persistence/dexie/`** owns `QuizAppDB`, repository functions, and backup I/O. A short-lived **`src/lib/db/`** compatibility re-export layer existed during migration and **has been deleted**; use **`$lib/app`** and **`$lib/model`**. **`src/lib/application/`** adds use cases tested with stub ports. **`src/lib/domain/`** holds **SessionEngine**, **question-selector**, and **student-orderer** (moved from flat `lib` paths) with imports only from **`$lib/model`** and **`$lib/ports`** (types), not from adapters. Routes and loaders import **`$lib/app`** for wired services and persistence helpers.

**Tech stack:** SvelteKit 2, Svelte 5, TypeScript, Dexie 4, Vitest, Playwright, bun.

---

## File map (create / modify / move)

| Path | Role |
|------|------|
| `src/lib/model/types.ts` | Canonical entity interfaces (today’s `db/types.ts` content). |
| `src/lib/ports/session-repository.ts` | `SessionRepository` interface. |
| `src/lib/ports/classroom-repository.ts` | `ClassroomRepository` interface. |
| `src/lib/ports/question-set-repository.ts` | `QuestionSetRepository` interface. |
| `src/lib/ports/attempt-repository.ts` | `AttemptRepository` interface. |
| `src/lib/ports/session-engine-persistence.ts` | Narrow port for SessionEngine’s three persistence callbacks. |
| `src/lib/adapters/persistence/dexie/schema.ts` | `QuizAppDB` + `db` export (moved from `db/schema.ts`). |
| `src/lib/adapters/persistence/dexie/repositories/*.ts` | Dexie-backed functions (moved from `db/repositories/`). |
| `src/lib/adapters/persistence/dexie/backup.ts` | Backup import/export (moved from `db/backup.ts`). |
| `src/lib/adapters/persistence/dexie/session-repository.adapter.ts` | Object implementing `SessionRepository` by delegating to repository functions. |
| `src/lib/adapters/persistence/dexie/classroom-repository.adapter.ts` | Implements `ClassroomRepository`. |
| `src/lib/adapters/persistence/dexie/question-set-repository.adapter.ts` | Implements `QuestionSetRepository`. |
| `src/lib/adapters/persistence/dexie/attempt-repository.adapter.ts` | Implements `AttemptRepository`. |
| `src/lib/db/**` *(removed)* | Temporary re-exports during migration; **do not recreate**. Use `$lib/model`, `$lib/app`, and `adapters/persistence/dexie/`. |
| `src/lib/app/repositories.ts` | Production singletons: `sessionRepository`, `classroomRepository`, etc. |
| `src/lib/app/session-engine-persistence.ts` | `sessionEnginePersistence` object satisfying `SessionEnginePersistence`. |
| `src/lib/app/backup.ts` | Re-export backup API for Settings (routes must not import adapters). |
| `src/lib/app/index.ts` | Public surface: repositories, persistence, backup, and named application helpers as they appear. |
| `src/lib/application/sessions/sessions.service.ts` | Example use cases: `listSessions`, `getSessionRunPayload` (or split read helpers used by loaders). |
| `src/lib/application/sessions/sessions.service.test.ts` | Stub ports, no IndexedDB. |
| `src/lib/domain/session-engine/index.ts` | Moved from `lib/session-engine/index.ts`; types from `$lib/model`; **no** `$lib/db` imports. |
| `src/lib/domain/session-engine/session-engine.test.ts` | Moved; update imports. |
| `src/lib/domain/question-selector/**` | Moved from `lib/question-selector/**`. |
| `src/lib/domain/student-orderer/**` | Moved from `lib/student-orderer/**`. |
| `src/lib/application/question-sets/persist-snippet-file.ts` | One parsed JSON file → snippet + questions under an existing question set id. |
| `src/lib/application/question-sets/persist-snippet-file.test.ts` | Stub `QuestionSetRepository`. |
| `src/routes/**/*.svelte`, `src/routes/**/*.ts`, `src/lib/data/loaders/*.ts`, `src/lib/components/CodeBlock.svelte` | Migration target: **`$lib/app`** / **`$lib/model`** / **`$lib/domain`** only; **`$lib/db`** removed — do not reintroduce. |
| `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md` | Document ports, adapters, `app/`, `domain/`, `model/`. |
| `docs/superpowers/specs/2026-04-07-hexagonal-ports-adapters-design.md` | Append rows to **Exception list** only if a route is granted direct read-port access without a service. |

---

### Task 1: Canonical model types

**Files:**

- Create: `src/lib/model/types.ts`
- Modify: `src/lib/db/types.ts`

- [ ] **Step 1: Add `src/lib/model/types.ts`**

Copy the entire contents of `src/lib/db/types.ts` into `src/lib/model/types.ts` unchanged (all interfaces: `Classroom`, `Student`, `QuestionSet`, `Highlight`, `Snippet`, `Question`, `Session`, `SessionStudent`, `Attempt`).

- [ ] **Step 2: Replace `src/lib/db/types.ts` with a re-export**

```ts
export type {
	Attempt,
	Classroom,
	Highlight,
	Question,
	QuestionSet,
	Session,
	SessionStudent,
	Snippet,
	Student
} from '$lib/model/types.js';
```

- [ ] **Step 3: Verify**

Run: `bun run check`  
Expected: PASS (no TypeScript or Svelte errors).

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/types.ts src/lib/db/types.ts
git commit -m "refactor: add canonical model types under lib/model"
```

---

### Task 2: Port interfaces (repositories + SessionEngine persistence)

**Files:**

- Create: `src/lib/ports/session-repository.ts`
- Create: `src/lib/ports/classroom-repository.ts`
- Create: `src/lib/ports/question-set-repository.ts`
- Create: `src/lib/ports/attempt-repository.ts`
- Create: `src/lib/ports/session-engine-persistence.ts`

- [ ] **Step 1: Add `src/lib/ports/session-engine-persistence.ts`**

```ts
import type { Attempt, Session, SessionStudent } from '$lib/model/types.js';

/** Outbound persistence used only by SessionEngine (subset of session + attempt repos). */
export interface SessionEnginePersistence {
	createAttempt(data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt>;
	updateSession(id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void>;
	updateSessionStudent(
		id: string,
		changes: Partial<Omit<SessionStudent, 'id'>>
	): Promise<void>;
}
```

- [ ] **Step 2: Add `src/lib/ports/session-repository.ts`**

```ts
import type { Session, SessionStudent } from '$lib/model/types.js';

export interface SessionRepository {
	createSession(
		data: Omit<Session, 'id' | 'started_at' | 'completed_at' | 'status'>
	): Promise<Session>;
	getSession(id: string): Promise<Session | undefined>;
	listSessions(): Promise<Session[]>;
	updateSession(id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void>;
	createSessionStudent(
		sessionId: string,
		studentId: string,
		questionSlotsRemaining: number
	): Promise<SessionStudent>;
	listSessionStudents(sessionId: string): Promise<SessionStudent[]>;
	updateSessionStudent(
		id: string,
		changes: Partial<Omit<SessionStudent, 'id'>>
	): Promise<void>;
}
```

- [ ] **Step 3: Add `src/lib/ports/classroom-repository.ts`**

```ts
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
```

- [ ] **Step 4: Add `src/lib/ports/question-set-repository.ts`**

```ts
import type { Question, QuestionSet, Snippet } from '$lib/model/types.js';

export interface QuestionSetRepository {
	createQuestionSet(name: string): Promise<QuestionSet>;
	getQuestionSet(id: string): Promise<QuestionSet | undefined>;
	listQuestionSets(): Promise<QuestionSet[]>;
	deleteQuestionSet(id: string): Promise<void>;
	createSnippet(
		questionSetId: string,
		data: Omit<Snippet, 'id' | 'question_set_id'>
	): Promise<Snippet>;
	listSnippetsByQuestionSet(questionSetId: string): Promise<Snippet[]>;
	deleteSnippetsByQuestionSet(questionSetId: string): Promise<void>;
	createQuestion(
		snippetId: string,
		data: Omit<Question, 'id' | 'snippet_id'>
	): Promise<Question>;
	listQuestionsBySnippet(snippetId: string): Promise<Question[]>;
	listQuestionsByQuestionSet(questionSetId: string): Promise<Question[]>;
	deleteQuestionsBySnippet(snippetId: string): Promise<void>;
}
```

- [ ] **Step 5: Add `src/lib/ports/attempt-repository.ts`**

```ts
import type { Attempt } from '$lib/model/types.js';

export interface AttemptRepository {
	createAttempt(data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt>;
	listAttemptsBySession(sessionId: string): Promise<Attempt[]>;
	listAttemptsByStudentInSession(sessionId: string, studentId: string): Promise<Attempt[]>;
	listAttemptsByStudent(studentId: string): Promise<Attempt[]>;
}
```

- [ ] **Step 6: Verify**

Run: `bun run check`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ports/
git commit -m "feat: add repository and SessionEngine persistence ports"
```

---

### Task 3: Move Dexie schema and repositories into adapters

**Files:**

- Move: `src/lib/db/schema.ts` → `src/lib/adapters/persistence/dexie/schema.ts`
- Move: `src/lib/db/repositories/*.ts` → `src/lib/adapters/persistence/dexie/repositories/*.ts`
- Move: `src/lib/db/backup.ts` → `src/lib/adapters/persistence/dexie/backup.ts`
- Create: `src/lib/db/schema.ts` (re-export)
- Create: `src/lib/db/repositories/classrooms.ts` (re-export)
- Create: `src/lib/db/repositories/sessions.ts` (re-export)
- Create: `src/lib/db/repositories/question-sets.ts` (re-export)
- Create: `src/lib/db/repositories/attempts.ts` (re-export)
- Create: `src/lib/db/backup.ts` (re-export)

- [ ] **Step 1: Move files with git**

```bash
mkdir -p src/lib/adapters/persistence/dexie/repositories
git mv src/lib/db/schema.ts src/lib/adapters/persistence/dexie/schema.ts
git mv src/lib/db/repositories/classrooms.ts src/lib/adapters/persistence/dexie/repositories/classrooms.ts
git mv src/lib/db/repositories/sessions.ts src/lib/adapters/persistence/dexie/repositories/sessions.ts
git mv src/lib/db/repositories/question-sets.ts src/lib/adapters/persistence/dexie/repositories/question-sets.ts
git mv src/lib/db/repositories/attempts.ts src/lib/adapters/persistence/dexie/repositories/attempts.ts
git mv src/lib/db/backup.ts src/lib/adapters/persistence/dexie/backup.ts
```

- [ ] **Step 2: Fix imports in `src/lib/adapters/persistence/dexie/schema.ts`**

Replace `from './types.js'` with `from '$lib/model/types.js'` for the `import type` block.

- [ ] **Step 3: Fix imports in each dexie repository file**

In each file under `src/lib/adapters/persistence/dexie/repositories/`, set:

```ts
import { db } from '../schema.js';
import type { ... } from '$lib/model/types.js';
```

(use the same type imports as before, only change the path from `../types.js` to `$lib/model/types.js`).

- [ ] **Step 4: Fix `src/lib/adapters/persistence/dexie/backup.ts`**

Change `import { db } from './schema.js';` (path remains correct relative to backup file location next to `schema.ts`).

- [ ] **Step 5: Add compatibility `src/lib/db/schema.ts`**

```ts
export { db } from '$lib/adapters/persistence/dexie/schema.js';
```

- [ ] **Step 6: Add compatibility repository re-exports**

`src/lib/db/repositories/classrooms.ts`:

```ts
export {
	createClassroom,
	deleteClassroom,
	deleteStudent,
	getClassroom,
	getStudent,
	listClassrooms,
	listStudentsByClassroom,
	updateClassroom,
	updateStudent,
	createStudent
} from '$lib/adapters/persistence/dexie/repositories/classrooms.js';
```

`src/lib/db/repositories/sessions.ts`:

```ts
export {
	createSession,
	createSessionStudent,
	getSession,
	listSessionStudents,
	listSessions,
	updateSession,
	updateSessionStudent
} from '$lib/adapters/persistence/dexie/repositories/sessions.js';
```

`src/lib/db/repositories/question-sets.ts`:

```ts
export {
	createQuestion,
	createQuestionSet,
	createSnippet,
	deleteQuestionsBySnippet,
	deleteQuestionSet,
	deleteSnippetsByQuestionSet,
	getQuestionSet,
	listQuestionSets,
	listQuestionsByQuestionSet,
	listQuestionsBySnippet,
	listSnippetsByQuestionSet
} from '$lib/adapters/persistence/dexie/repositories/question-sets.js';
```

`src/lib/db/repositories/attempts.ts`:

```ts
export {
	createAttempt,
	listAttemptsBySession,
	listAttemptsByStudent,
	listAttemptsByStudentInSession
} from '$lib/adapters/persistence/dexie/repositories/attempts.js';
```

- [ ] **Step 7: Add compatibility `src/lib/db/backup.ts`**

```ts
export {
	exportFullBackup,
	importFullBackupFromFile,
	type ImportBackupResult
} from '$lib/adapters/persistence/dexie/backup.js';
```

- [ ] **Step 8: Verify**

Run: `bun run check`  
Run: `bun run test:unit -- --run`  
Expected: PASS (same behavior, paths updated).

- [ ] **Step 9: Commit**

```bash
git add src/lib/adapters src/lib/db
git commit -m "refactor: move Dexie schema and repositories to adapters layer"
```

---

### Task 4: Dexie adapter objects implementing ports

**Files:**

- Create: `src/lib/adapters/persistence/dexie/session-repository.adapter.ts`
- Create: `src/lib/adapters/persistence/dexie/classroom-repository.adapter.ts`
- Create: `src/lib/adapters/persistence/dexie/question-set-repository.adapter.ts`
- Create: `src/lib/adapters/persistence/dexie/attempt-repository.adapter.ts`

- [ ] **Step 1: Add `session-repository.adapter.ts`**

```ts
import type { SessionRepository } from '$lib/ports/session-repository.js';
import * as impl from './repositories/sessions.js';

export const dexieSessionRepository: SessionRepository = {
	createSession: impl.createSession,
	getSession: impl.getSession,
	listSessions: impl.listSessions,
	updateSession: impl.updateSession,
	createSessionStudent: impl.createSessionStudent,
	listSessionStudents: impl.listSessionStudents,
	updateSessionStudent: impl.updateSessionStudent
};
```

- [ ] **Step 2: Add `classroom-repository.adapter.ts`**

```ts
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
```

- [ ] **Step 3: Add `question-set-repository.adapter.ts`**

```ts
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import * as impl from './repositories/question-sets.js';

export const dexieQuestionSetRepository: QuestionSetRepository = {
	createQuestionSet: impl.createQuestionSet,
	getQuestionSet: impl.getQuestionSet,
	listQuestionSets: impl.listQuestionSets,
	deleteQuestionSet: impl.deleteQuestionSet,
	createSnippet: impl.createSnippet,
	listSnippetsByQuestionSet: impl.listSnippetsByQuestionSet,
	deleteSnippetsByQuestionSet: impl.deleteSnippetsByQuestionSet,
	createQuestion: impl.createQuestion,
	listQuestionsBySnippet: impl.listQuestionsBySnippet,
	listQuestionsByQuestionSet: impl.listQuestionsByQuestionSet,
	deleteQuestionsBySnippet: impl.deleteQuestionsBySnippet
};
```

- [ ] **Step 4: Add `attempt-repository.adapter.ts`**

```ts
import type { AttemptRepository } from '$lib/ports/attempt-repository.js';
import * as impl from './repositories/attempts.js';

export const dexieAttemptRepository: AttemptRepository = {
	createAttempt: impl.createAttempt,
	listAttemptsBySession: impl.listAttemptsBySession,
	listAttemptsByStudentInSession: impl.listAttemptsByStudentInSession,
	listAttemptsByStudent: impl.listAttemptsByStudent
};
```

- [ ] **Step 5: Verify**

Run: `bun run check`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/adapters/persistence/dexie/*.adapter.ts
git commit -m "feat: wire Dexie repositories as port implementations"
```

---

### Task 5: Composition root (`$lib/app`)

**Files:**

- Create: `src/lib/app/repositories.ts`
- Create: `src/lib/app/session-engine-persistence.ts`
- Create: `src/lib/app/backup.ts`
- Create: `src/lib/app/index.ts`

- [ ] **Step 1: Add `src/lib/app/repositories.ts`**

```ts
import { dexieSessionRepository } from '$lib/adapters/persistence/dexie/session-repository.adapter.js';
import { dexieClassroomRepository } from '$lib/adapters/persistence/dexie/classroom-repository.adapter.js';
import { dexieQuestionSetRepository } from '$lib/adapters/persistence/dexie/question-set-repository.adapter.js';
import { dexieAttemptRepository } from '$lib/adapters/persistence/dexie/attempt-repository.adapter.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';
import type { ClassroomRepository } from '$lib/ports/classroom-repository.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import type { AttemptRepository } from '$lib/ports/attempt-repository.js';

export const sessionRepository: SessionRepository = dexieSessionRepository;
export const classroomRepository: ClassroomRepository = dexieClassroomRepository;
export const questionSetRepository: QuestionSetRepository = dexieQuestionSetRepository;
export const attemptRepository: AttemptRepository = dexieAttemptRepository;

export interface AppRepositories {
	sessions: SessionRepository;
	classrooms: ClassroomRepository;
	questionSets: QuestionSetRepository;
	attempts: AttemptRepository;
}

export const repositories: AppRepositories = {
	sessions: sessionRepository,
	classrooms: classroomRepository,
	questionSets: questionSetRepository,
	attempts: attemptRepository
};

/** For tests: override one or more repos while keeping production defaults elsewhere. */
export function createRepositories(overrides: Partial<AppRepositories> = {}): AppRepositories {
	return {
		sessions: overrides.sessions ?? dexieSessionRepository,
		classrooms: overrides.classrooms ?? dexieClassroomRepository,
		questionSets: overrides.questionSets ?? dexieQuestionSetRepository,
		attempts: overrides.attempts ?? dexieAttemptRepository
	};
}
```

- [ ] **Step 2: Add `src/lib/app/session-engine-persistence.ts`**

```ts
import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
import { attemptRepository, sessionRepository } from './repositories.js';

export const sessionEnginePersistence: SessionEnginePersistence = {
	createAttempt: attemptRepository.createAttempt.bind(attemptRepository),
	updateSession: sessionRepository.updateSession.bind(sessionRepository),
	updateSessionStudent: sessionRepository.updateSessionStudent.bind(sessionRepository)
};

export function createSessionEnginePersistence(
	overrides: Partial<SessionEnginePersistence> = {}
): SessionEnginePersistence {
	return {
		createAttempt: overrides.createAttempt ?? sessionEnginePersistence.createAttempt,
		updateSession: overrides.updateSession ?? sessionEnginePersistence.updateSession,
		updateSessionStudent:
			overrides.updateSessionStudent ?? sessionEnginePersistence.updateSessionStudent
	};
}
```

- [ ] **Step 3: Add `src/lib/app/backup.ts`**

```ts
export {
	exportFullBackup,
	importFullBackupFromFile,
	type ImportBackupResult
} from '$lib/adapters/persistence/dexie/backup.js';
```

- [ ] **Step 4: Add `src/lib/app/index.ts`**

```ts
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
	createSessionEnginePersistence,
	type SessionEnginePersistence
} from './session-engine-persistence.js';
export {
	exportFullBackup,
	importFullBackupFromFile,
	type ImportBackupResult
} from './backup.js';
```

- [ ] **Step 5: Verify**

Run: `bun run check`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/app
git commit -m "feat: add app composition root for repositories and SessionEngine persistence"
```

---

### Task 6: Application service for session list (TDD)

**Files:**

- Create: `src/lib/application/sessions/sessions.service.ts`
- Create: `src/lib/application/sessions/sessions.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/application/sessions/sessions.service.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import type { Session } from '$lib/model/types.js';
import { listSessionsOrderedByStartedAt } from './sessions.service.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';

describe('listSessionsOrderedByStartedAt', () => {
	it('delegates to repository and sorts by started_at descending', async () => {
		const a: Session = {
			id: 'a',
			classroom_id: 'c',
			question_set_ids: [],
			n_questions_per_student: 1,
			started_at: 100,
			completed_at: null,
			status: 'active',
			strategy_id: 'default'
		};
		const b: Session = {
			id: 'b',
			classroom_id: 'c',
			question_set_ids: [],
			n_questions_per_student: 1,
			started_at: 200,
			completed_at: null,
			status: 'active',
			strategy_id: 'default'
		};
		const listSessions = vi.fn<[], Promise<Session[]>>().mockResolvedValue([a, b]);
		const sessions: SessionRepository = {
			createSession: vi.fn(),
			getSession: vi.fn(),
			listSessions,
			updateSession: vi.fn(),
			createSessionStudent: vi.fn(),
			listSessionStudents: vi.fn(),
			updateSessionStudent: vi.fn()
		};

		const result = await listSessionsOrderedByStartedAt(sessions);

		expect(listSessions).toHaveBeenCalledOnce();
		expect(result.map((s) => s.id)).toEqual(['b', 'a']);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:unit -- --run src/lib/application/sessions/sessions.service.test.ts`  
Expected: FAIL (module `./sessions.service.js` missing or function not exported).

- [ ] **Step 3: Implement `sessions.service.ts`**

```ts
import type { Session } from '$lib/model/types.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';

export async function listSessionsOrderedByStartedAt(
	sessions: SessionRepository
): Promise<Session[]> {
	const all = await sessions.listSessions();
	return [...all].sort((x, y) => y.started_at - x.started_at);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test:unit -- --run src/lib/application/sessions/sessions.service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/application/sessions/sessions.service.ts src/lib/application/sessions/sessions.service.test.ts
git commit -m "feat: add sessions application service with stubbed repository test"
```

---

### Task 7: SessionEngine — remove `$lib/db` dependency; require persistence

**Files:**

- Modify: `src/lib/session-engine/index.ts` (until moved in Task 9)
- Modify: `src/lib/session-engine/session-engine.test.ts`
- Modify: `src/routes/sessions/[id]/run/+page.svelte`

- [ ] **Step 1: Update `SessionEngine` constructor**

In `src/lib/session-engine/index.ts`:

- Change type imports from `$lib/db/types.js` to `$lib/model/types.js`.
- Remove imports from `$lib/db/index.js`.
- Remove `SessionEngineOptions` optional callbacks; replace with **required** second argument or extend the constructor signature as follows:

Add:

```ts
import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
```

Change constructor to accept **persistence as the last argument** (after `attempts`):

```ts
constructor(
	session: Session,
	sessionStudents: SessionStudent[],
	students: Student[],
	questions: Question[],
	attempts: Attempt[],
	persistence: SessionEnginePersistence
) {
	this._session = session;
	this._questions = questions;
	this._attempts = [...attempts];
	this._createAttempt = persistence.createAttempt;
	this._updateSession = persistence.updateSession;
	this._updateSessionStudent = persistence.updateSessionStudent;
	// ... rest unchanged
}
```

Remove the `SessionEngineOptions` interface and all `options?.` defaulting.

- [ ] **Step 2: Update every `new SessionEngine(...)` in `session-engine.test.ts`**

Pass `makeMockRepos()` as the **sixth** argument on **every** `new SessionEngine(...)` call (grep the file — there are many). The mock object already matches `SessionEnginePersistence`. Update type imports to `$lib/model/types.js`.

- [ ] **Step 3: Update `src/routes/sessions/[id]/run/+page.svelte`**

Add import:

```ts
import { sessionEnginePersistence } from '$lib/app/index.js';
```

Change `new SessionEngine(...)` to pass `sessionEnginePersistence` as the sixth argument:

```ts
engine = new SessionEngine(
	data.session,
	data.sessionStudents,
	data.students,
	data.allQuestions,
	data.attempts,
	sessionEnginePersistence
);
```

- [ ] **Step 4: Verify**

Run: `bun run test:unit -- --run src/lib/session-engine/session-engine.test.ts`  
Run: `bun run check`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/session-engine/index.ts src/lib/session-engine/session-engine.test.ts src/routes/sessions/[id]/run/+page.svelte
git commit -m "refactor: SessionEngine requires injected persistence port"
```

---

### Task 8: Migrate session routes and loaders to `$lib/app` + application service

**Files:**

- Modify: `src/routes/sessions/+page.ts`
- Modify: `src/routes/sessions/new/+page.ts`
- Modify: `src/routes/sessions/new/+page.svelte`
- Modify: `src/routes/sessions/[id]/run/+page.ts`
- Modify: `src/lib/app/index.ts` (export `listSessionsOrderedByStartedAt`)

- [ ] **Step 1: Re-export application helper from `src/lib/app/index.ts`**

Append:

```ts
export { listSessionsOrderedByStartedAt } from '$lib/application/sessions/sessions.service.js';
```

- [ ] **Step 2: Update `src/routes/sessions/+page.ts`**

Replace imports from `$lib/db/index.js` with:

```ts
import { classroomRepository, sessionRepository } from '$lib/app/index.js';
import { listSessionsOrderedByStartedAt } from '$lib/app/index.js';
import type { Session } from '$lib/model/types.js';
```

Replace `listSessions()` with `listSessionsOrderedByStartedAt(sessionRepository)` where the page needs sorted sessions; use `sessionRepository` / `classroomRepository` for other calls (same method names as before).

- [ ] **Step 3: Update `src/routes/sessions/new/+page.ts`**

```ts
import { classroomRepository, questionSetRepository } from '$lib/app/index.js';
```

Use `classroomRepository.listClassrooms()` and `questionSetRepository.listQuestionSets()`.

- [ ] **Step 4: Update `src/routes/sessions/new/+page.svelte`**

```ts
import {
	sessionRepository,
	classroomRepository
} from '$lib/app/index.js';
```

Use `sessionRepository.createSession`, `classroomRepository.listStudentsByClassroom`, `sessionRepository.createSessionStudent` (same names as repository methods).

- [ ] **Step 5: Update `src/routes/sessions/[id]/run/+page.ts`**

Replace `$lib/db/index.js` imports with `$lib/app/index.js` and call the same operations on `sessionRepository`, `classroomRepository`, `questionSetRepository`, `attemptRepository` as today’s `getSession`, `listSessionStudents`, etc.

Replace `import type { Question, Snippet } from '$lib/db/types.js'` with `$lib/model/types.js`.

- [ ] **Step 6: Verify**

Run: `bun run check`  
Run: `bun run test:unit -- --run`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/app/index.ts src/routes/sessions
git commit -m "refactor: route session flows through app layer"
```

---

### Task 9: Move domain modules under `src/lib/domain/`

**Files:**

- Move: `src/lib/session-engine/**` → `src/lib/domain/session-engine/**`
- Move: `src/lib/question-selector/**` → `src/lib/domain/question-selector/**`
- Move: `src/lib/student-orderer/**` → `src/lib/domain/student-orderer/**`
- Modify: every file that imports `$lib/session-engine`, `$lib/question-selector`, `$lib/student-orderer`

- [ ] **Step 1: Git mv**

```bash
mkdir -p src/lib/domain
git mv src/lib/session-engine src/lib/domain/session-engine
git mv src/lib/question-selector src/lib/domain/question-selector
git mv src/lib/student-orderer src/lib/domain/student-orderer
```

- [ ] **Step 2: Update domain internal imports**

Inside `domain/question-selector` and `domain/student-orderer`, replace `$lib/db/types.js` with `$lib/model/types.js`.

- [ ] **Step 3: Update `src/lib/domain/session-engine/index.ts`**

Use `$lib/model/types.js` and:

```ts
import { getStrategy as getQuestionStrategy } from '$lib/domain/question-selector/registry.js';
import { getStrategy as getStudentStrategy } from '$lib/domain/student-orderer/registry.js';
```

- [ ] **Step 4: Replace all project imports**

Globally update:

- `$lib/session-engine/` → `$lib/domain/session-engine/`
- `$lib/question-selector/` → `$lib/domain/question-selector/`
- `$lib/student-orderer/` → `$lib/domain/student-orderer/`

Files include at least: `src/routes/sessions/[id]/run/+page.svelte`, any tests under `vitest`, and `session-engine` tests.

- [ ] **Step 5: Verify**

Run: `bun run check`  
Run: `bun run test:unit -- --run`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/domain src/routes src/lib
git commit -m "refactor: move session-engine and strategies under lib/domain"
```

---

### Task 10: Migrate remaining routes, loaders, and components

**Files:**

- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/classrooms/new/+page.svelte`
- Modify: `src/routes/classrooms/[id]/+page.ts`
- Modify: `src/routes/classrooms/[id]/+page.svelte`
- Modify: `src/routes/history/+page.ts`
- Modify: `src/routes/history/[id]/+page.ts`
- Modify: `src/routes/question-sets/+page.ts`
- Modify: `src/routes/question-sets/+page.svelte`
- Modify: `src/routes/question-sets/import/+page.svelte`
- Modify: `src/routes/settings/+page.svelte`
- Modify: `src/lib/data/loaders/classrooms-index.ts`
- Modify: `src/lib/data/loaders/classrooms-index.test.ts`
- Modify: `src/lib/components/CodeBlock.svelte`

- [ ] **Step 1: Replace DB barrel imports**

For each file listed, replace:

- `from '$lib/db/index.js'` → import the needed **repository singletons** from `$lib/app/index.js` and call the **same method names** on `classroomRepository`, `sessionRepository`, `questionSetRepository`, or `attemptRepository`.

- [ ] **Step 2: Replace type imports**

Replace `from '$lib/db/types.js'` with `from '$lib/model/types.js'`.

In `CodeBlock.svelte`, replace `import type { Highlight } from '$lib/db/types'` with `$lib/model/types`.

- [ ] **Step 3: Settings backup**

In `src/routes/settings/+page.svelte`, change:

```ts
import { exportFullBackup, importFullBackupFromFile } from '$lib/db/backup.js';
```

to:

```ts
import { exportFullBackup, importFullBackupFromFile } from '$lib/app/index.js';
```

- [ ] **Step 4: Update `classrooms-index.test.ts` mock path**

Change `vi.mock('$lib/db/index.js', ...)` to mock `$lib/app/index.js` **or** inject `classroomRepository` into `loadClassroomsIndex` if you refactor the loader to accept repositories (prefer keeping loader pure: pass `ClassroomRepository` as argument from `+page.ts`). If the loader stays as today, mock `$lib/app/index.js` exports `listClassrooms` / `listStudentsByClassroom` — **adjust the mock** to match whichever module the loader imports after you change `classrooms-index.ts`.

- [ ] **Step 5: Verify**

Run: `bun run check`  
Run: `bun run test:unit -- --run`  
Run: `bun run test:e2e`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes src/lib/data/loaders src/lib/components/CodeBlock.svelte
git commit -m "refactor: migrate routes and loaders to app and model imports"
```

---

### Task 11: Import persistence use case (TDD)

**Files:**

- Create: `src/lib/application/question-sets/persist-snippet-file.ts`
- Create: `src/lib/application/question-sets/persist-snippet-file.test.ts`
- Modify: `src/routes/question-sets/import/+page.svelte`

**Note:** The import UI creates **one** `QuestionSet` per folder (`createQuestionSet(folderName)`), then **one snippet + questions per JSON file** under that set. The application function therefore takes an **existing** `questionSetId`, not the folder name.

- [ ] **Step 1: Write failing test `persist-snippet-file.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import type { ParsedSnippetFile } from '$lib/importer/index.js';
import { persistSnippetFileUnderQuestionSet } from './persist-snippet-file.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

describe('persistSnippetFileUnderQuestionSet', () => {
	it('creates snippet and questions with optional chain', async () => {
		const createSnippet = vi.fn().mockResolvedValue({
			id: 'sn1',
			question_set_id: 'qs1',
			language: 'ts',
			code: 'x'
		});
		const createQuestion = vi
			.fn()
			.mockResolvedValueOnce({
				id: 'qroot',
				snippet_id: 'sn1',
				text: 'Q1',
				correct_answer: 'A',
				chain_parent_id: null,
				chain_order: 0
			})
			.mockResolvedValue({
				id: 'qchild',
				snippet_id: 'sn1',
				text: 'C1',
				correct_answer: 'B',
				chain_parent_id: 'qroot',
				chain_order: 1
			});

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createSnippet,
			listSnippetsByQuestionSet: vi.fn(),
			deleteSnippetsByQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsBySnippet: vi.fn(),
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsBySnippet: vi.fn()
		};

		const parsed: ParsedSnippetFile = {
			snippet: { language: 'ts', code: 'x' },
			questions: [
				{
					text: 'Q1',
					correctAnswer: 'A',
					chain: [{ text: 'C1', correctAnswer: 'B' }]
				}
			]
		};

		await persistSnippetFileUnderQuestionSet(questionSets, 'qs1', parsed);

		expect(createSnippet).toHaveBeenCalledWith('qs1', {
			language: 'ts',
			code: 'x'
		});
		expect(createQuestion).toHaveBeenNthCalledWith(1, 'sn1', {
			text: 'Q1',
			correct_answer: 'A',
			chain_parent_id: null,
			chain_order: 0
		});
		expect(createQuestion).toHaveBeenNthCalledWith(2, 'sn1', {
			text: 'C1',
			correct_answer: 'B',
			chain_parent_id: 'qroot',
			chain_order: 1
		});
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `bun run test:unit -- --run src/lib/application/question-sets/persist-snippet-file.test.ts`  
Expected: FAIL (missing module or function).

- [ ] **Step 3: Implement `persist-snippet-file.ts`**

Match `src/routes/question-sets/import/+page.svelte` (lines 58–85): `difficulty` may be undefined — only include it in `createQuestion` when `q.difficulty !== undefined`.

```ts
import type { ParsedSnippetFile } from '$lib/importer/index.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

export async function persistSnippetFileUnderQuestionSet(
	questionSets: QuestionSetRepository,
	questionSetId: string,
	parsed: ParsedSnippetFile
): Promise<void> {
	const { snippet, questions } = parsed;

	const dbSnippet = await questionSets.createSnippet(questionSetId, {
		language: snippet.language,
		code: snippet.code,
		...(snippet.highlight !== undefined ? { highlight: snippet.highlight } : {})
	});

	for (const q of questions) {
		const rootQ = await questionSets.createQuestion(dbSnippet.id, {
			text: q.text,
			correct_answer: q.correctAnswer,
			...(q.difficulty !== undefined ? { difficulty: q.difficulty } : {}),
			chain_parent_id: null,
			chain_order: 0
		});

		if (q.chain) {
			for (let i = 0; i < q.chain.length; i++) {
				await questionSets.createQuestion(dbSnippet.id, {
					text: q.chain[i].text,
					correct_answer: q.chain[i].correctAnswer,
					chain_parent_id: rootQ.id,
					chain_order: i + 1
				});
			}
		}
	}
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `bun run test:unit -- --run src/lib/application/question-sets/persist-snippet-file.test.ts`  
Expected: PASS.

- [ ] **Step 5: Wire the Svelte page**

In `src/routes/question-sets/import/+page.svelte`:

- Import `questionSetRepository` from `$lib/app/index.js`.
- Import `persistSnippetFileUnderQuestionSet` from `$lib/application/question-sets/persist-snippet-file.js`.
- Keep `const questionSet = await questionSetRepository.createQuestionSet(folderName);` in the page.
- Replace the inline `createSnippet` / `createQuestion` block with `await persistSnippetFileUnderQuestionSet(questionSetRepository, questionSet.id, { snippet, questions });`.

- [ ] **Step 6: Export from `src/lib/app/index.ts` (optional)**

```ts
export { persistSnippetFileUnderQuestionSet } from '$lib/application/question-sets/persist-snippet-file.js';
```

- [ ] **Step 7: Verify**

Run: `bun run check`  
Run: `bun run test:unit -- --run`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/application/question-sets src/routes/question-sets/import/+page.svelte src/lib/app/index.ts
git commit -m "feat: extract question-set folder import persistence behind QuestionSetRepository"
```

---

### Task 12: Narrow `src/lib/db/index.ts` and update documentation

**Files:**

- Modify: `src/lib/db/index.ts`
- Modify: `.planning/codebase/ARCHITECTURE.md`
- Modify: `.planning/codebase/CONVENTIONS.md`

- [ ] **Step 1: Trim `src/lib/db/index.ts`**

Remove exports that encourage new code to depend on this barrel: keep **only** re-exports needed for **remaining** external consumers, or replace the file with a short comment pointing to `$lib/app` and `$lib/model`. Goal: **no new imports** of `$lib/db` from `src/routes` or `src/lib/application` after Task 10.

Preferred end state:

```ts
/** @deprecated Import from `$lib/app` or `$lib/model` instead. */
export { db } from './schema.js';
export type * from './types.js';
export * from './repositories/classrooms.js';
// ... only if something outside `src/` still needs them; otherwise delete unused re-exports.
```

Run `rg "from '\\$lib/db" src` — expect **zero** matches (or only deprecated internal shims). If matches remain, fix those imports before deleting exports.

- [ ] **Step 2: Update `.planning/codebase/ARCHITECTURE.md`**

Add sections for **`model/`**, **`ports/`**, **`application/`**, **`adapters/persistence/dexie/`**, **`domain/`**, **`app/`**, and state that **`db/`** is legacy shim. Align with `docs/superpowers/specs/2026-04-07-hexagonal-ports-adapters-design.md`.

- [ ] **Step 3: Update `.planning/codebase/CONVENTIONS.md`**

Document: new persistence code lives under **adapters**; new orchestration under **application**; routes use **`$lib/app`**.

- [ ] **Step 4: Verify**

Run: `bun run check`  
Run: `bun run test`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/index.ts .planning/codebase/ARCHITECTURE.md .planning/codebase/CONVENTIONS.md
git commit -m "docs: align planning docs with hexagonal layout; deprecate db barrel"
```

---

## Plan self-review

**1. Spec coverage**

| Spec section | Task(s) |
|--------------|---------|
| Target layout (`model`, `ports`, `application`, `adapters`, `app`, `domain`) | 1–5, 9, 12 |
| Dexie only in adapters | 3, 4 |
| Central composition (`$lib/app`) | 5, 8, 10, 11 |
| Route policy (default `app`) | 8, 10, 11; exceptions documented only if added |
| SessionEngine + port-aligned persistence | 2, 5, 7 |
| Importer via application + ports | 11 |
| Backup via app re-export | 5, 10 |
| Staged migration + compat re-exports | 3, 12 |
| Testing (stub ports, no Dexie in app tests) | 6, 11 |
| Planning docs update | 12 |

**2. Placeholder scan**  
No `TBD` / `TODO` / vague “add error handling” steps; test and implementation bodies are specified.

**3. Type consistency**  
`SessionEnginePersistence` matches the three methods previously optional on `SessionEngineOptions`. Repository port methods match moved Dexie repository functions. `persistSnippetFileUnderQuestionSet` maps `correctAnswer` → `correct_answer` like `src/routes/question-sets/import/+page.svelte`.

**Fix applied during review:** Task 7 requires updating **all** `SessionEngine` test call sites (grep shows multiple `new SessionEngine` lines in `session-engine.test.ts`); the engineer must pass the mock object as the **sixth** argument in **every** occurrence, not only the first test. Task 11 was corrected so the use case matches **one question set per folder** and **many files per set** (not one set per file).

---

Plan complete and saved to `docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md`. Two execution options:

**1. Subagent-driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
