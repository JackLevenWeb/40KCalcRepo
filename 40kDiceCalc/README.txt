# 40k Hurt System Cogitator

## Overview
This application is a web-based probability calculator for tabletop simulation mechanics. It processes complex cascading probabilities via a waterfall simulation model, executing 100,000 iterations to output structured statistical distributions of damage, hits, wounds, and saves.

## Features
- Complex Profile Parsing: Handles layered modifiers and conditional triggers.
- Multithreaded Processing: Utilizes Web Workers to run high-volume waterfall simulations without blocking the main browser thread.
- Data Aggregation: Uses an in-memory SQLite database (via WebAssembly) to aggregate, filter, and structure raw simulation data.
- Comparative Analytics: Generates multi-line, stacked area charts to visually compare the efficacy of different rule modifiers side-by-side.
- State Management: Allows users to export and import simulation states via local JSON files, persisting data seamlessly.
- Dynamic UI Architecture: Implements a token-based theme switching system driven by CSS variables.

## Architecture
This project uses a decoupled, event-driven, frontend-only architecture:
- app.js: Main controller and pipeline orchestrator.
- event-manager.js: Centralized event bus handling DOM listeners and CustomEvent broadcasting.
- theme-manager.js: Token mapping dictionary for dynamic CSS variable injection.
- ui-manager.js: DOM manipulation, layout management, and HTML template generation.
- chart-manager.js: Coordinates data rendering using Chart.js.
- db-manager.js: SQLite database initialization, insertion routines, and structured querying.
- logic.js: Pure mathematical simulation engine housing the waterfall resolution logic.
- webWorker.js: Background thread handler for intensive loops.

For a detailed breakdown of how data moves through this application, please see Data_flow_explanation.txt