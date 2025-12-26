# AI Studio Application Rules

This document outlines the technical stack and guidelines for developing and modifying the VulcanHR application.

## Tech Stack Overview

*   **React**: The core JavaScript library for building the user interface.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **Tailwind CSS**: A utility-first CSS framework used for all styling, enabling rapid and consistent UI development.
*   **Vite**: The build tool that provides a fast development experience and optimizes the production build.
*   **Recharts**: A composable charting library built with React, used for data visualization in dashboards.
*   **Google Gemini API**: Integrated for AI-driven performance insights and strategic HR feedback.
*   **Local Storage**: Utilized for client-side data persistence, storing employee and evaluation data.
*   **BroadcastChannel API**: Enables real-time data synchronization across multiple browser tabs.
*   **shadcn/ui & Radix UI**: A collection of re-usable components built with Radix UI and styled with Tailwind CSS, available for building accessible and customizable UI elements.
*   **lucide-react**: An icon library available for adding scalable vector graphics to the UI.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following guidelines when making changes or adding new features:

*   **UI Components**: All new UI components should be built using **React** and **TypeScript**. Prioritize using components from **shadcn/ui** or **Radix UI** where applicable. If a custom component is needed, create it as a new, small, and focused file.
*   **Styling**: **Tailwind CSS** is the exclusive styling framework. Do not introduce custom CSS files, inline styles (unless absolutely necessary for dynamic values), or other CSS-in-JS libraries.
*   **Charting**: For any data visualization requirements, use **Recharts**.
*   **AI Integration**: Interact with AI models exclusively through the `@google/genai` package, as demonstrated in `services/geminiService.ts`.
*   **State Management**: For component-level and application-wide state, leverage React's built-in hooks (`useState`, `useMemo`, `useEffect`, `useContext`). Avoid introducing external state management libraries unless explicitly required for complex global state.
*   **Data Persistence**: All local data storage and retrieval should be handled via `localStorage` through the `services/storageService.ts` utility.
*   **Cross-Tab Communication**: For synchronizing data across browser tabs, use the `BroadcastChannel` API as implemented in `services/storageService.ts`.
*   **Icons**: Use icons from the **lucide-react** library.
*   **Routing**: The application's navigation is currently managed within `App.tsx` using conditional rendering based on state. For any future routing needs, **React Router** should be used, with routes defined in `App.tsx`.