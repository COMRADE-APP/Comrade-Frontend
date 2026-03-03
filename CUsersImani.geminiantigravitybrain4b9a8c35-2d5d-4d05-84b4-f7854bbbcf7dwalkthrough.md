
---

## 2. Platform-Wide AI Voice Assistant & Screen Reader Accessibility (Phase 19)

### The Comrade Voice Engine
Implemented a robust, browser-native AI Voice Assistant using the `SpeechSynthesis` and `SpeechRecognition` APIs to provide hands-free navigation, daily briefings, and platform control.

- **Wake Phrase Triggers:** The listener engine runs passively when enabled and awakes when hearing "Hey Comrade" (or any user-defined custom wake phrase).
- **Proactive Authentication Welcome:** Immediately upon successful login, the AI greets the user by name to create an immersive, personalized experience.
- **Natural Language Command Parser:** Translates fuzzy vocal instructions into action:
    - *"Go to events" / "Take me to my tasks"* -> Triggers React Router `navigate()`.
    - *"Read this page"* -> Uses DOM extraction to read the main content area aloud.
    - *"What's new?" / "Brief me"* -> Calls the backend aggregator.

### Centralized `VoiceBriefingView` Backend API
Created a new data-aggregator endpoint at `/api/qomai/voice/briefing/` that scans across 4 Django apps to build a synthesized verbal report for the user:
- Counts Unread Messages (`ConversationParticipant` query).
- Counts Pending Active Tasks (`Task` model).
- Counts New Announcements within the last 7 days (`Announcements` model).

### Floating Animated Voice Widget UI 
Built a persistent, non-intrusive floating orb widget (`VoiceAssistantWidget.jsx`) injected into the `MainLayout.jsx` wrapper.
- Uses dynamic CSS animations to reflect 4 distinct states: Disabled (gray), Idle (blue breathing), Listening (emerald pulsating), and Processing/Speaking (purple spinning).
- Includes an auto-fading Speech Bubble to display AI responses visually.

### ARIA Screen Reader Enhancements
Audited and upgraded the platform's core reusable components to be fully compliant with screen reader technologies (like NVDA, JAWS, or VoiceOver):
- Injected `role="button"`, `role="region"`, `role="navigation"`, and `role="main"` to structural elements.
- Added context-aware `aria-disabled`, `aria-invalid`, and `aria-label` attributes to the `Button`, `Card`, `Input`, and `Sidebar` components.
- Introduced a hidden "Skip to main content" link at the top of the DOM for keyboard-only users.
- Placed an `aria-live="polite"` region within the Voice Assistant Context to automatically narrate route changes (e.g., "Navigating to Dashboard") without interrupting ongoing screen reader speech.
