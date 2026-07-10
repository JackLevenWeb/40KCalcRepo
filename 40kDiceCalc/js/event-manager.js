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

    if (ThemeSelect) {
        ThemeSelect.addEventListener("change", (e) => {
            const newTheme = e.target.value;
            // Grab the currently saved theme to revert to if they cancel
            const oldTheme = localStorage.getItem("40kTheme") || "space_wolves";

            if (confirm("Changing the theme will wipe your current roster and reset the dashboard. Proceed?")) {
                // Apply colors and update charts
                applyTheme(newTheme);
                document.dispatchEvent(new CustomEvent("App:ThemeChanged"));

                // Trigger the full board reset
                document.dispatchEvent(new CustomEvent("App:ClearDashboard"));
            } else {
                // Revert the dropdown visual so it matches the unchanged UI
                e.target.value = oldTheme;
            }
        });
    }

    // --- Tutorial Modal Logic ---
    const tutorialModal = document.getElementById("tutorial-modal");
    const modalClose = document.querySelector(".modal-close");
    const tutTitle = document.getElementById("tutorial-title");
    const tutBody = document.getElementById("tutorial-body");

    // Listen for clicks on ANY tutorial button
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("tutorial-btn")) {
            const tutType = e.target.getAttribute("data-tutorial");

            if (tutType === "base") {
                tutTitle.textContent = "Base Profile Report";
                tutBody.innerHTML = "This section shows the exact mathematical averages of your unit's current loadout against the target. <br><br><strong>Note:</strong> We will add more detailed instructions here later!";
            } else if (tutType === "scenario") {
                tutTitle.textContent = "Scenario Testing Analytics";
                tutBody.innerHTML = "This engine runs your weapon profile through every applicable keyword (Lethal, Devastating, Sustained, etc.) to show you which buffs provide the most value for your CP.<br><br><strong>Note:</strong> We will add more detailed instructions here later!";
            }

            tutorialModal.style.display = "block";
        }
    });

    // Close the modal when the X is clicked
    if (modalClose) {
        modalClose.addEventListener("click", () => {
            tutorialModal.style.display = "none";
        });
    }

    // Close the modal if the user clicks anywhere outside of it
    window.addEventListener("click", (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.style.display = "none";
        }
    });
    // ----------------------------

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