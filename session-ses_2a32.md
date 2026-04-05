## Assistant

Here's a comprehensive diagram of the entire app's logic, broken into layers.

---

## 1. Data Model (Entity Relationships)

```mermaid
erDiagram
    Classroom ||--o{ Student : "has"
    Classroom ||--o{ Session : "hosts"

    QuestionSet ||--o{ Snippet : "contains"
    Snippet ||--o{ Question : "has"
    Question ||--o{ Question : "chain_parent_id (follow-up chain)"

    Session }o--o{ QuestionSet : "question_set_ids[]"
    Session ||--o{ SessionStudent : "tracks"
    Student ||--o{ SessionStudent : "enrolled in"

    Session ||--o{ Attempt : "records"
    Student ||--o{ Attempt : "answers"
    Question ||--o{ Attempt : "asked in"

    Classroom {
        string id PK
        string name
        number created_at
    }
    Student {
        string id PK
        string classroom_id FK
        string name
    }
    QuestionSet {
        string id PK
        string name
        number imported_at
    }
    Snippet {
        string id PK
        string question_set_id FK
        string language
        string code
        Highlight highlight
    }
    Question {
        string id PK
        string snippet_id FK
        string text
        string correct_answer
        string difficulty
        string chain_parent_id FK
        number chain_order
    }
    Session {
        string id PK
        string classroom_id FK
        string[] question_set_ids
        number n_questions_per_student
        number started_at
        number completed_at
        string status "active | paused | completed"
        string strategy_id
    }
    SessionStudent {
        string id PK
        string session_id FK
        string student_id FK
        boolean completed
        number question_slots_remaining
    }
    Attempt {
        string id PK
        string session_id FK
        string student_id FK
        string question_id FK
        string outcome "correct | partial | wrong"
        number answered_at
    }
```

---

## 2. Page Navigation & User Flows

```mermaid
flowchart TD
    HOME["/ (Home)<br/>List Classrooms"]

    HOME -->|"New Classroom"| NEW_CR["/classrooms/new<br/>Create classroom + students"]
    HOME -->|"Edit"| EDIT_CR["/classrooms/[id]<br/>Edit name, add/remove students"]
    HOME -->|"Delete"| HOME
    HOME -->|"Sessions"| SESSIONS["/sessions<br/>List paused sessions"]
    HOME -->|"History"| HISTORY["/history<br/>List completed sessions"]
    HOME -->|"Question Sets"| QS["/question-sets<br/>List question sets"]
    HOME -->|"Settings"| SETTINGS["/settings<br/>Export / Import JSON backup"]

    NEW_CR -->|"Submit → createClassroom + createStudent[]"| HOME
    EDIT_CR -->|"Delete Classroom"| HOME

    SESSIONS -->|"Start New Session"| NEW_SESS["/sessions/new<br/>Pick classroom, question sets, N questions"]
    SESSIONS -->|"Resume"| RUN["/sessions/[id]/run<br/>Live quiz session"]

    NEW_SESS -->|"Submit → createSession + createSessionStudent[]"| RUN

    RUN -->|"All students done"| COMPLETE_SCREEN["Session Complete screen"]
    RUN -->|"Pause"| SESSIONS
    COMPLETE_SCREEN -->|"Back"| SESSIONS

    HISTORY -->|"Click session"| HIST_DETAIL["/history/[id]<br/>Per-student attempt results"]

    QS -->|"Import"| IMPORT["/question-sets/import<br/>Pick folder of .json files"]
    QS -->|"Delete"| QS
    IMPORT -->|"Done"| QS

    SETTINGS -->|"Export"| DL["Download JSON backup"]
    SETTINGS -->|"Import"| RESTORE["Replace all DB data"]
```

---

## 3. Session Engine — Core State Machine

```mermaid
stateDiagram-v2
    [*] --> Active : createSession()

    Active --> Running : SessionEngine initialized

    state Running {
        [*] --> PickStudent
        PickStudent --> PickQuestion : currentStudent exists
        PickQuestion --> ShowQuestion : question picked

        ShowQuestion --> RecordOutcome : teacher presses 1/C, 2/P, or 3/W

        state chain_check <<choice>>
        RecordOutcome --> chain_check
        chain_check --> NextChainQ : in chain & more chain items
        chain_check --> ConsumeSlot : standalone or chain finished

        NextChainQ --> ShowQuestion : advance chainIndex

        state slot_check <<choice>>
        ConsumeSlot --> slot_check
        slot_check --> PickQuestion : slots remaining > 0
        slot_check --> NextStudent : slots remaining = 0 (student completed)

        state student_check <<choice>>
        NextStudent --> student_check
        student_check --> PickStudent : more students
        student_check --> SessionDone : no students left
    }

    Running --> Paused : pause()
    Paused --> Running : resume (re-init engine)
    Running --> Completed : SessionDone
    Completed --> [*]
```

---

## 4. Question Selection Pipeline (Strategy Pattern)

```mermaid
flowchart TD
    START["_pickQuestion()"] --> FILTER_ROOT["Filter root questions<br/>(chain_parent_id === null)"]
    FILTER_ROOT --> DEDUP["Remove already-asked<br/>this session (_askedThisSession)"]
    DEDUP -->|"none left"| RESET["Clear _askedThisSession<br/>→ recurse"]
    DEDUP -->|"candidates exist"| STRATEGY

    subgraph STRATEGY ["QuestionSelectionStrategy (pluggable)"]
        direction TB
        S1["Registry lookup by<br/>session.strategy_id"]
        S1 --> DEFAULT["Default Strategy"]

        DEFAULT --> FIND_WORK["Filter: unanswered OR<br/>last outcome = wrong/partial"]
        FIND_WORK -->|"needsWork found"| RETURN_FIRST["Return first needing work"]
        FIND_WORK -->|"all correct"| OLDEST["Return question with<br/>oldest correct attempt<br/>(spaced repetition)"]
    end

    STRATEGY --> CHECK_CHAIN{"Has children?<br/>(chain_parent_id = rootQ.id)"}
    CHECK_CHAIN -->|"Yes"| INIT_CHAIN["Set _chainQuestions = [root, ...children]<br/>sorted by chain_order"]
    CHECK_CHAIN -->|"No"| RETURN_Q["Return root question"]
    INIT_CHAIN --> RETURN_CHAIN["Return chain[0]"]
```

---

## 5. Student Ordering (Strategy Pattern)

```mermaid
flowchart LR
    INPUT["All students in classroom"] --> FILTER["Remove completed students<br/>(SessionStudent.completed = true)"]
    FILTER --> SHUFFLE["Fisher-Yates shuffle<br/>(random order)"]
    SHUFFLE --> OUTPUT["Ordered student list"]

    NOTE["Used on session resume (paused → active).<br/>On initial start: simple incomplete filter."]
```

---

## 6. Import Pipeline (Question Set from Folder)

```mermaid
flowchart TD
    A["User clicks 'Select Folder'<br/>(File System Access API)"] --> B["showDirectoryPicker()"]
    B --> C["createQuestionSet(folderName)"]
    C --> LOOP["For each .json file in folder"]

    LOOP --> PARSE["parseSnippetFile(jsonString)"]
    PARSE -->|"ok: false"| ERR["Record error, skip file"]
    PARSE -->|"ok: true"| SAVE

    subgraph SAVE ["Persist to IndexedDB"]
        direction TB
        S1["createSnippet(qsId, {language, code, highlight})"]
        S1 --> S2["For each question:"]
        S2 --> S3["createQuestion(snippetId, {text, answer, difficulty})<br/>→ rootQuestion"]
        S3 --> S4{"Has chain?"}
        S4 -->|"Yes"| S5["For each chain item:<br/>createQuestion(snippetId, {text, answer,<br/>chain_parent_id: rootQ.id, chain_order: i+1})"]
        S4 -->|"No"| DONE["Next question"]
        S5 --> DONE
    end

    ERR --> LOOP
    SAVE --> LOOP
    LOOP -->|"all files processed"| RESULT["Show import summary:<br/>N imported, M errors"]
```

---

## 7. Chain Question Outcome Aggregation

```mermaid
flowchart LR
    OUTCOMES["Chain outcomes array<br/>[correct, partial, wrong, ...]"]
    OUTCOMES --> CHECK1{"All correct?"}
    CHECK1 -->|"Yes"| R1["→ correct"]
    CHECK1 -->|"No"| CHECK2{"Any wrong?"}
    CHECK2 -->|"Yes"| R2["→ wrong"]
    CHECK2 -->|"No"| R3["→ partial"]
```

---

## 8. Settings — Export/Import Backup

```mermaid
flowchart LR
    subgraph Export
        EX1["Read all 8 tables from Dexie"] --> EX2["JSON blob {version:1, ...tables}"]
        EX2 --> EX3["Trigger download<br/>quizapp-backup-YYYY-MM-DD.json"]
    end

    subgraph Import
        IM1["User picks .json file"] --> IM2["Validate: version === 1"]
        IM2 --> IM3["Confirm: 'replace ALL data?'"]
        IM3 --> IM4["Transaction: clear all 8 tables<br/>→ bulkAdd from backup"]
    end
```

---

### Summary

| Layer                 | Tech                        | Description                                                                                                |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Storage**           | Dexie (IndexedDB)           | 8 tables, all client-side, no server                                                                       |
| **Routing**           | SvelteKit (static adapter)  | 11 pages, file-based routing                                                                               |
| **Session Engine**    | Pure TypeScript class       | Drives quiz flow: student order → question pick → outcome recording → slot consumption → completion        |
| **Question Selector** | Strategy pattern + registry | Pluggable via `strategy_id`. Default: prioritize wrong/unanswered, then oldest-correct (spaced repetition) |
| **Student Orderer**   | Strategy pattern + registry | Pluggable. Default: filter completed, Fisher-Yates shuffle                                                 |
| **Importer**          | File System Access API      | Parse JSON snippet files from a local folder into Dexie                                                    |
| **Backup**            | JSON export/import          | Full database dump/restore with version checking                                                           |

---
