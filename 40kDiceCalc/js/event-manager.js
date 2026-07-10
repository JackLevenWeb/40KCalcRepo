// central nervous system. manages dom event listeners and broadcasts custom events.

import { syncAppUI, addBadgeToModule, addAttackerModule } from './ui-manager.js';
import { applyTheme } from './theme-manager.js';

export function initializeWatchers() {
    const RosterContainer = document.getElementById("attacker-roster");
    const GlobalModBtn = document.getElementById("add-global-mod-btn");
    const GlobalModSelect = document.getElementById("global-mod-dropdown");
    const AddAttackerBtn = document.getElementById("add-attacker-btn");
    const ExportBtn = document.getElementById("export-roster-btn");
    const ImportBtn = document.getElementById("import-roster-btn");
    const ImportInput = document.getElementById("import-file-input");
    const ThemeSelect = document.getElementById("theme-dropdown");

    const triggerSave = () => document.dispatchEvent(new CustomEvent("App:AutoSave"));

    // theme watcher with safe cleanup prompt
    if (ThemeSelect) {
        ThemeSelect.addEventListener("change", (e) => {
            if (confirm("Changing themes requires a full dashboard clear to ensure layout sync. Proceed?")) {
                const clearBtn = document.getElementById("clear-dashboard-btn");
                if (clearBtn) {
                    // trigger click cleanly to wipe tracking objects first
                    clearBtn.click();
                }
                applyTheme(e.target.value);
                document.dispatchEvent(new CustomEvent("App:ThemeChanged"));
            } else {
                // read old theme or revert dropdown state
                const savedTheme = localStorage.getItem("40kTheme") || "space_wolves";
                ThemeSelect.value = savedTheme;
            }
        });
    }

    RosterContainer.addEventListener("input", () => {
        syncAppUI();
        triggerSave();
    });

    RosterContainer.addEventListener("change", () => {
        syncAppUI();
        triggerSave();
    });

    RosterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-mod-btn") ||
            e.target.classList.contains("remove-mod-btn") ||
            e.target.classList.contains("remove-btn")) {

            setTimeout(() => {
                triggerSave();
            }, 50);
        }
    });

    const targetIDs = [
        "toughness", "wounds", "save", "inVul", "target-models",
        "def-fnp", "def-minus-hit", "def-minus-wound", "def-minus-wound-str",
        "def-cover", "def-reduce-dam"
    ];

    targetIDs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", triggerSave);
            el.addEventListener("change", triggerSave);
        }
    });

    if (GlobalModBtn) {
        GlobalModBtn.addEventListener("click", () => {
            const modKey = GlobalModSelect.value;
            if (modKey === "none") return;

            const allModules = document.querySelectorAll('.attacker-module');
            allModules.forEach(module => {
                addBadgeToModule(module, modKey, false);
            });

            GlobalModSelect.value = "none";
            syncAppUI();
            triggerSave();
        });
    }

    if (AddAttackerBtn) {
        AddAttackerBtn.addEventListener("click", () => {
            addAttackerModule(RosterContainer);
            syncAppUI();
        });
    }

    if (ExportBtn) {
        ExportBtn.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("App:ExportRoster"));
        });
    }

    if (ImportBtn && ImportInput) {
        ImportBtn.addEventListener("click", () => {
            ImportInput.click();
        });

        ImportInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;
            document.dispatchEvent(new CustomEvent("App:ImportRoster", { detail: { file: file } }));
            ImportInput.value = "";
        });
    }
}