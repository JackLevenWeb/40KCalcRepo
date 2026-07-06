# 40k Hurt System Cogitator

## Overview
This application is a web-based probability calculator for Warhammer 40,000 dice mechanics. It simulates thousands of dice rolls across various weapon profiles and defensive stats to output statistical distributions of damage, hits, wounds, and saves. 

## Features
* **Complex Profile Parsing:** Handles modifiers such as Lethal Hits, Devastating Wounds, Sustained Hits, and Rerolls.
* **Multithreaded Processing:** Utilizes Web Workers to run high-volume simulations (e.g., 50,000 iterations) without blocking the main browser thread.
* **Data Aggregation:** Uses an in-memory SQLite database (via WebAssembly) to aggregate, filter, and structure simulation data.
* **Comparative Analytics:** Generates multi-line, stacked area charts to visually compare the efficacy of different rule modifiers side-by-side.
* **State Management:** Allows users to export and import army rosters via local JSON files.

## Architecture
This project uses a modular, frontend-only architecture:
* `app.js`: Main controller and pipeline orchestrator.
* `logic.js`: Pure mathematical simulation engine.
* `ui-manager.js`: DOM manipulation and HTML generation.
* `db-manager.js`: SQLite database initialization and querying.
* `webWorker.js`: Background thread handler.

For a detailed breakdown of how data moves through this application, please see [DATA_FLOW_EXPLANATION.md](DATA_FLOW_EXPLANATION.md).
