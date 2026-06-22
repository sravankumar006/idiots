# IDIOTS SPACE — Project Documentation & Feature Guide

Welcome to the official documentation for **idiots space**, a warm, private, and highly interactive digital home for you and your crew. This platform combines workspace features (real-time chat, collaborative study rooms, goal tracking, AI assistance) with the emotional warmth of a shared friend group journal.

---

## 1. Project Overview & Philosophy

**idiots space** is designed to break away from massive, noisy social networks and standard sterile productivity tools. It offers a dedicated, private workspace for a close circle of friends ("nodes") to:
*   **Hang out and chat** in a real-time lounge.
*   **Work and study together** inside virtual focus cabins with synced Pomodoro timers.
*   **Track career progress** with interactive learning roadmaps, coding statistics, and portfolio profiles.
*   **Log emotional states** to keep crew members supportive and aware of each other's energy.
*   **Store memories** by pinning milestones, photos, and messages to a shared timeline and vault.
*   **Query intelligent nodes** using a shared and private AI companion (powered by Gemini, GPT, and OpenRouter).

### Tech Stack Architecture:
*   **Framework**: Next.js (App Router, React, TypeScript).
*   **Styling**: TailwindCSS with a custom **Glassmorphic** (translucent frosted panels) & **Neomorphic** (tactile soft-shadow) design system.
*   **Backend & Real-Time**: Supabase (PostgreSQL database, Supabase Auth, Storage Buckets, and Real-Time WebSocket channels).
*   **AI Integration**: Edge routing API supporting Google Gemini (default), OpenAI GPT, and OpenRouter, with built-in latency diagnostics.
*   **PWA Setup**: Service worker offline caching, responsive touch targets, and notch-aware edge-to-edge layout (`viewport-fit=cover`).

---

## 2. Navigation & Layout System

The platform features a highly adaptive navigation system tailored for desktop, tablet, and mobile screens.

### A. Desktop / Tablet Navigation
*   **Collapsible Sidebar Drawer (`aside`)**: Located on the left side of the screen.
    *   **Collapse/Expand Toggle**: Allows users to shrink the sidebar to small icon-only badges to maximize screen area.
    *   **Main Navigation Links**: Home (Dashboard), Chat Lounge, Companion (AI), Zen Focus, Memories (timeline/scrapbook), Creative Rooms (projects), and Settings.
    *   **Online Friends Roster**: Live roster displaying connected crew members with green active indicator dots.
    *   **Quick Profile Footer**: Displays the active user's custom color aura avatar and username. Clicking opens a customization sheet.
    *   **Theme Switcher**: Quick light/dark theme toggle.
*   **Global Topbar Header**:
    *   **Active Route Title**: Displays the name of the current area (e.g. `zen focus`, `shared timeline`).
    *   **Integrated Search Bar**: Allows users to filter connections and search across active elements.
    *   **Sync Badge**: Shows connection and Supabase sync health (e.g., "connected & synced").
    *   **Theme Toggle Button**: A quick-switch button to alternate between dark and light themes.
    *   **Smart Notification Bell**: Drops down a popover (or slide-in drawer on mobile) listing recent alerts. Includes category-specific icons (chat message, focus invite, memory save, roadmap accomplishment) and deep-links directly to the relevant workspace or chat message.
    *   **Right-Panel Toggle**: Opens/closes the desktop inspection panel showing room members, active sessions, and direct call actions.

### B. Mobile Navigation
*   **Bottom Tab Navigation Bar (`MobileNav`)**: A fixed bar aligned to the bottom.
    *   Features five touch-target optimized icons: **Home**, **Chat Lounge**, **Companion**, **Growth**, and **Us**.
    *   Designed with safe-area padding at the bottom (`env(safe-area-inset-bottom)`) to float gracefully above gesture navigation bars on modern bezel-less phones.
*   **Mobile Header**:
    *   Hides the desktop topbar to maximize height.
    *   Includes a profile icon trigger ("IS") which slides up a customized `UserActionSheet` containing username editors, avatar color aura customizers, and logout options.
*   **Adaptive Layout Viewports**:
    *   Maintains a custom CSS property `--visual-viewport-height` via window resizing listeners (`useVisualViewport`). This dynamically shrinks the app layout when the mobile virtual keyboard appears, avoiding input overlapping and layout breaks.

---

## 3. Core Features & Functional Details

### A. Growth Dashboard (Home Hub)
*   **Crew Motivation Banner**: A motivational bar that prints the total hours focused by the crew during the current week, how many members are active today, and the user's active focus streak in days (e.g., `study streak: 4 days 🔥`).
*   **Study Cabin Invitations**: Lists real-time pending invites from friends to join private study cabins, with instant "join" and "decline" triggers.
*   **Career Portfolio Card**:
    *   Allows users to set and edit target goals, dream target companies, and favorite coding languages.
    *   Links to external portfolio websites and resumes.
    *   Lists educational/professional certifications verified with badge symbols.
*   **Emotional Status Tracker**:
    *   Displays the user's current status text (e.g., "grinding Next.js routing issues") and an interactive emoji selection.
    *   Features horizontal level meters for **Energy Level** (0-10) and **Focus Level** (0-10) represented in warm-to-cool gradients.
*   **7-Day Focus Activity Graph**: A bar chart dynamically reflecting the user's daily study minutes over the last week.
*   **Active Projects Feed**: Displays progress bars (0-100%) showing the current completion of creative team rooms.
*   **Interactive Learning Roadmap**:
    *   Allows users to divide their roadmap into stages (e.g. "Frontend", "Backend", "Deployment").
    *   Users can add checkboxes for specific tasks and mark them off, which automatically generates an event log in the crew's dashboard timeline.

### B. Chat Lounge (Real-Time Communication)
*   **Supabase Real-Time WebSocket Channels**: Instant text streaming, typing indicators (`@user is typing...`), and scroll anchoring to lock to the latest message.
*   **Rich Attachments**: Supports dragging and dropping files directly into the window. Handled file types (image, video, code files, PDFs, etc.) display with specialized icons and inline previews.
*   **Reaction Picker**: Allows users to append emoji reactions to individual messages to convey emotion without cluttering the chat history.
*   **Save to Vault (Shared Scrapbook)**: Hovering over or clicking a message or media attachment triggers a "Save to Memory Vault" action. It copies the message content, sender details, and attachment URL, saving them as a permanent shared memory in the `us` tab.
*   **Zen Study Mode**: A toggle inside focus-related chat channels. When enabled, a visual filter highlights code files, text documentation, and PDF downloads, helping team members focus on learning materials.

### C. Companion Node (AI Assistant)
*   **Personal AI Consultant**: A private, 1-on-1 dialog space with "Rocky" (the custom AI assistant). Streams response text tokens in real-time. Contains helpful diagnostic panels showing average latency and active models.
*   **Diagnostics Health Monitor**: A live panel tracking AI API performance across providers (Google Gemini, OpenAI, OpenRouter) to display configurations, success rates, and average latency.
*   **Shared #ai logs**: A shared repository that automatically logs all prompt-and-response interactions from group chat rooms. It makes AI answers searchable, category-filtered (e.g., General, Study, Coding, Research, Projects), and reusable so friends can learn from each other's queries.
*   **Memory Center**: A page compiling user-specific AI conversations and summaries to help users track long-term progress.

### D. Zen Focus (Study Lounge)
*   **Live Focus Cabins**:
    *   **Browser**: Shows all waiting or active study cabins hosted by friends.
    *   **Create Cabin**: A modal allowing hosts to specify a room name, description, privacy settings (public or invite-only), and send invitations to crew members.
*   **Focus Cabin Dashboard**:
    *   **Synced Pomodoro Timer**: A group-synced session timer with play, pause, and reset options. Supports choosing timer goals (25m Pomodoro, 50m grind, custom intervals) and plays calming zen background sounds.
    *   **Activity Status Selector**: Lets users broadcast what they are working on (e.g. `writing code`, `reading docs`, `solving bugs`) to other cabin members.
    *   **Active Study Roster**: A visual list showing the profile avatars of everyone currently in the cabin and their active focus state.
*   **Floating Session Pill**: If a user navigates away from the focus room to check the chat lounge or dashboard while a timer is running, a compact draggable pill floats on the screen showing the remaining session time. Clicking it routes the user back to the active cabin.

### E. Us Hub (Shared Memories & Timelines)
*   **Shared Timeline**: A scrollable vertical timeline that logs major group achievements, new focus session completions, career updates, and memories shared by any node.
*   **Scrapbook Vault**: A categorized vault storing saved chat snippets, screenshots, milestones, and shared files. It preserves a permanent memory bank for the group.

---

## 4. Progressive Web App (PWA) & Edge-to-Edge Architecture

To deliver a premium mobile app experience, the website is optimized to function as a Progressive Web App (PWA) when added to a user's mobile home screen.

### A. Full-Screen Edge-to-Edge Support
*   **`viewport-fit=cover`**: Added to the Next.js layout viewport configuration. This tells mobile engines (iOS Safari, Android Chrome) that the web application should draw directly into the system bars (status bar at the top, gesture home bar at the bottom) rather than letterboxing.
*   **iOS Translucent Status Bar**: Implemented with `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` so web content flows behind the battery, clock, and camera notch.
*   **Android Seamless theme-color Blending**:
    *   A dynamic hook inside the global `PwaHandler` Client Component checks the active system/user theme.
    *   It dynamically updates the `<meta name="theme-color">` to match the exact background color of the active theme (`#171614` for dark mode, `#D8D1C7` for light mode).
    *   This removes the ugly "black line" (the browser status bar frame) on Android devices, allowing the status bar area to merge seamlessly into the app.

### B. Hardware Notch and Cutout Adaptation (CSS Insets)
To prevent the camera notch and home indicator from overlaying interactive buttons, the layout dynamically shifts elements away from hardware borders:
*   **Page Headers**: Sticky headers (such as `Topbar` and chat lounge headers) use `padding-top: env(safe-area-inset-top, 0px)` and dynamic heights to push navigation buttons below the phone's front camera.
*   **Bottom Navigation**: The bottom mobile menu uses `padding-bottom: env(safe-area-inset-bottom, 8px)` to ensure the tap targets are safely above the mobile device's gesture nav indicator.
*   **Scroll Views**: Core content areas have bottom margin adjustments (`mb-[calc(3rem+env(safe-area-inset-bottom,0px))]`) so that scrollable content is fully readable and isn't cut off by screen curves.

---

## 5. Technical Diagnostics & Maintenance

To perform maintenance, type checking, or compile local tests:
1.  **TypeScript Verification**: Run `npx tsc --noEmit` to verify type safety.
2.  **Next.js Dev Server**: Propose or run `npm run dev` to start the local development environment.
3.  **Supabase Policies**: All database reads/writes follow PostgreSQL Row Level Security (RLS) constraints linked to user profiles.
