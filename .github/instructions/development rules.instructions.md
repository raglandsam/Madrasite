# Agent Context & Documentation Rules

Before proposing code, implementing features, or making refactors:

1. **Mandatory Context Review:**
   - Read `docs/Context.md` to understand current sprint goals and roadmap alignment.
   - Read `docs/Architecture.md` to adhere to our approved tech stack, patterns, and schema conventions.
   - Read `docs/ChangeLogs.md` to see recent modifications and prevent regressions.

2. **External Alignment (Notion / Design Specs):**
   - Respect any external task scopes referenced in `docs/Context.md`. Do not implement features out of the current milestone scope, unless explicitly approved.

3. **Session Logging:**
   - At the conclusion of any major change or completed task, append a concise entry to `docs/ChangeLogs.md` detailing:
     - Date / Session goal
     - Files modified or added
     - Key architectural decisions made