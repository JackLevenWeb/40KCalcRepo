// central nervous system. manages dom event listeners and broadcasts custom events.

import { syncAppUI, addBadgeToModule, addAttackerModule } from './ui-manager.js';

export function initializeWatchers() {
    const RosterContainer = document.getElementById("attacker-roster");
    const GlobalModBtn = document.getElementById("add-global-mod-btn");
    const GlobalModSelect = document.getElementById("global-mod-dropdown");
    const AddAttackerBtn = document.getElementById("add-attacker-btn");
    const ExportBtn = document.getElementById("export-roster-btn");
    const ImportBtn = document.getElementById("import-roster-btn");
    const ImportInput = document.getElementById("import-file-input");

    // helper function to broadcast our save event
    const triggerSave = () => document.dispatchEvent(new CustomEvent("App:AutoSave"));

    // roster text & dropdown changes
    RosterContainer.addEventListener("input", () => {
        syncAppUI();
        triggerSave();
    });

    RosterContainer.addEventListener("change", () => {
        syncAppUI();
        triggerSave();
    });

    // roster clicks - add/remove badges
    RosterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-mod-btn") ||
            e.target.classList.contains("remove-mod-btn") ||
            e.target.classList.contains("remove-btn")) {

            setTimeout(() => {
                triggerSave();
            }, 50);
        }
    });

    // target profile watcher
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

    // global mod watcher
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

    // add attacker button
    if (AddAttackerBtn) {
        AddAttackerBtn.addEventListener("click", () => {
            addAttackerModule(RosterContainer);
            syncAppUI();
        });
    }

    // export button
    if (ExportBtn) {
        ExportBtn.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("App:ExportRoster"));
        });
    }

    // import buttons
    if (ImportBtn && ImportInput) {
        ImportBtn.addEventListener("click", () => {
            ImportInput.click();
        });

        ImportInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // broadcast the import event and pass the file data inside the "detail" payload
            document.dispatchEvent(new CustomEvent("App:ImportRoster", { detail: { file: file } }));

            // reset the input so the user can import the exact same file twice if they want to
            ImportInput.value = "";
        });
    }
}