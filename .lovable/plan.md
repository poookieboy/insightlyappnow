- I’ll fix the current broken/slow parts first, then expand the learning features in a stable way.

## What I found

- The AI backend function responds successfully when called directly, so the app-side connection issue is likely caused by the current browser request/stream handling and environment fallback behavior.
- Mock papers can fail to open because the paper runner only searches using the currently saved profile curriculum/grade. If the user changes the selector on the papers list but does not save it, the opened paper ID no longer matches the profile context.
- Mock paper scoring currently has a results-state bug: answers are graded with `setAnswers`, then the score screen reads the old answers immediately, so scores can show wrong/empty until state catches up.
- Revision and paper content exists, but it is still limited. Requested CBC subjects like CRE, Home Science, Agriculture, and Pre-Technical Studies are missing or underrepresented.
- Notes are saved as plain cards. Workspace documents can be saved, but Notes does not yet open them in a proper editable document/PDF-like viewer.
- Several UI interactions use heavy animations, localStorage writes on every edit/input, and full-list rendering, which can make buttons feel laggy on mobile.

## Plan

### 1. Fix the AI tutor connection and upgrade it into a ChatGPT/Copilot-style tutor

- Make the tutor call more robust by using the standard Lovable Cloud function invocation path/client instead of relying on a fragile hand-built URL/key flow.
- Improve streaming parsing so it handles partial chunks safely and shows a clearer error if the backend is unreachable.
- Add ChatGPT-like tabs/modes at the top of the tutor:
  - Ask
  - Explain step-by-step
  - Quiz me
  - Diagram/chart
  - Project helper
- Update the AI prompt so it can create Mermaid diagrams/charts when helpful, explain with steps, help with project work, and ask follow-up questions when the student is stuck.
- Add a “retry” action on failed messages instead of losing the question.

### 2. Fix mock papers opening and auto-grading

- Change paper lookup so `/tests/$paperId` can find a paper from the selected paper ID itself, not only the saved profile curriculum/grade.
- Preserve selected curriculum/grade through navigation from the test list.
- Fix the submit flow so grading is computed synchronously before showing results.
- Improve short-answer grading normalization and show:
  - your answer
  - correct/model answer
  - why it was marked right/wrong
- Improve the test runner UI with clearer question navigation, answered/unanswered indicators, timer, submit confirmation, and review screen.

### 3. Add more curriculum subjects and topic coverage

- Expand revision + mock paper banks with curriculum-friendly subject packs.
- Add requested CBC-style subjects such as:
  - CRE / Christian Religious Education
  - Home Science
  - Agriculture
  - Pre-Technical Studies
  - Integrated Science / Science
  - Social Studies
  - English
  - Kiswahili where applicable
  - Mathematics
- Keep support for all existing curriculum choices and all grades by using shared grade bands, with room to make each curriculum more specific over time.
- Add topic and subtopic structures for each subject, then generate 1–20 practice questions per topic/subtopic where practical.
- Add difficulty tags: Easy, Medium, Hard.

### 4. Improve Revision behavior

- Replace “show answer / mark as done” style flow with typed-answer checking everywhere.
- Let students retry, reveal the answer, or ask the AI to explain the exact question.
- Add filters for subject, topic, and difficulty.
- Add subject tests from revision topics using the same improved timer and grading system as mock papers.

### 5. Upgrade Notes into editable document/PDF-style review

- Add a document viewer/editor for saved notes/workspace documents.
- Show notes in a clean page-like layout similar to a PDF sheet, but still editable.
- Add actions for:
  - open/edit note
  - save changes
  - duplicate
  - print/export using the browser print dialog as PDF
- Render saved rich-text notes from Workspace correctly instead of showing raw HTML/plain previews.

### 6. Fix laggy buttons and mobile performance

- Reduce unnecessary animations on frequently changing screens.
- Debounce document draft saving instead of writing to storage on every keystroke.
- Avoid rebuilding large question lists unnecessarily.
- Make buttons use faster active states and prevent double-click/double-submit issues.
- Clean up list rendering and progress calculations for smoother mobile usage.

## Technical notes

- I will not edit the auto-generated Cloud client/type files.
- I will keep this mostly frontend/content-library based; no new database tables are needed for this pass.
- I’ll test the AI function directly again after code changes and verify the app uses the safer invocation path.
- I’ll run the project build/type check after implementation to catch route, import, and TypeScript issues.
- Q also fix the way that the notes are saved