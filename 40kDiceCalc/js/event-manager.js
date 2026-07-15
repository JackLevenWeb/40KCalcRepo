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


    const tutorialModal = document.getElementById("tutorial-modal");
    const modalClose = document.querySelector(".modal-close");
    const tutTitle = document.getElementById("tutorial-title");
    const tutBody = document.getElementById("tutorial-body");

    // listen for clicks on ANY tutorial button
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("tutorial-btn")) {
            const tutType = e.target.getAttribute("data-tutorial");

            if (tutType === "main_site") {
                tutTitle.textContent = "How to use this website";
                tutBody.innerHTML = `
                    <p>Welcome to the Munitorum Auspex, a probability calculator for Warhammer 40,000.</p>
                    <p style="margin-top: 10px;">This tool calculates exact probabilities for each phase of the game between attacking and defending units. To ensure pinpoint accuracy, this engine runs <strong>100,000 Monte Carlo simulations</strong> per unit, per modifier, per phase.</p>
                    <p style="margin-top: 10px;">Look for the <strong>?</strong> icons throughout the app to learn how each specific section functions.</p><br>
                    <p style="margin-top: 10px;">This app is a personal project created for learning and experimentation in 40K. It’s inspired by tools like Tactical Cogitator, but it’s not commercial. I built it as a portfolio piece to showcase my work on GitHub. <a href="https://github.com/JackLevenWeb" target="_blank" style="color: var(--theme-accent);">https://github.com/JackLevenWeb</a></p>
                    <div style="margin-top: 20px; font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    Inspired by: <a href="https://tactical-cogitator.com/" target="_blank" style="color: var(--theme-accent);">https://tactical-cogitator.com/</a><br>
                        Created by: <a href="https://www.linkedin.com/in/jackleventhorpe/" target="_blank" style="color: var(--theme-accent);">https://www.linkedin.com/in/jackleventhorpe/</a>
                    </div>
                `;
            } else if (tutType === "attacker_roster") {
                tutTitle.textContent = "Attacker Roster";
                tutBody.innerHTML = `
                    <p>This section defines the unit(s) executing the attacks during the simulations.</p>
                    <ul style="margin-top: 10px; margin-left: 20px; padding-left: 10px;">
                        <li style="margin-bottom: 8px;"><strong>Attacker Unit:</strong> Rename your unit for easy tracking.</li>
                        <li style="margin-bottom: 8px;"><strong>Core Profile:</strong> Input the base stats of the weapon (Attacks, Strength, AP, Damage, etc.).</li>
                        <li style="margin-bottom: 8px;"><strong>Active Modifiers:</strong> Add specific weapon rules (like Lethal Hits or Sustained Hits) to this individual profile.</li>
                        <li style="margin-bottom: 8px;"><strong>Army Wide Rules:</strong> Apply a global modifier to every attacking unit on your roster at once.</li>
                        <li style="margin-bottom: 8px;"><strong>Declare Leader:</strong> Attach a character to a unit to grant them shared keyword buffs.</li>
                    </ul>
                `;
            } else if (tutType === "target_profile") {
                tutTitle.textContent = "Target Profile";
                tutBody.innerHTML = `
                    <p>This section defines the defensive stats of the unit receiving the attacks.</p>
                    <p style="margin-top: 10px;"><strong>Note:</strong> You may only test against <strong>one</strong> defending unit profile at a time.</p>
                    <ul style="margin-top: 10px; margin-left: 20px; padding-left: 10px;">
                        <li style="margin-bottom: 8px;"><strong>Defensive Stats:</strong> Input the target's Toughness, Wounds, and Save profile.</li>
                        <li style="margin-bottom: 8px;"><strong>Defensive Modifiers:</strong> Apply debuffs like Cover, -1 to Hit, or Damage Reduction.</li>
                    </ul>
                `;
            } else if (tutType === "base_sim") {
                tutTitle.textContent = "Base Profile Simulation";
                tutBody.innerHTML = `
                    <p>Clicking this button executes a quick burst of 100,000 simulations using <em>only</em> the currently active stats on your dashboard.</p>
                    <p style="margin-top: 10px;">It generates a single report showing the final distribution of Damage Dealt and Models Killed against the target unit.</p>
                `;
            } else if (tutType === "adv_sim") {
                tutTitle.textContent = "Modifier Delta Analysis";
                tutBody.innerHTML = `
                    <p>Clicking this button runs a deep comparative analysis.</p>
                    <p style="margin-top: 10px;">First, it runs 100,000 simulations for your Base Profile. Then, it runs <em>another</em> 100,000 simulations for <strong>every single modifier</strong> that is not already active on your base profile, showing you exactly how much value a specific buff (like +1 to Wound or Rerolls) will add to your output.</p>
                `;
            } else if (tutType === "base") {
                tutTitle.textContent = "Base Profile Report";
                tutBody.innerHTML = `
                    <p>The numbers on the left show the mathematical average of your simulation.</p>
                    <p style="margin-top: 10px;"><strong>Overkill (Wasted Damage):</strong> The amount of damage dealt that exceeded a model's remaining wounds (e.g., dealing 3 damage to a 1-wound model results in 2 wasted damage).</p>
                    <p style="margin-top: 10px;">The graph plots the % probability (Y-Axis) of achieving at least a specific total of Damage or Kills (X-Axis).</p>
                    <ul style="margin-top: 10px; margin-left: 20px; padding-left: 10px;">
                        <li><strong>Hover</strong> over a line to see the exact probability at that specific threshold.</li>
                        <li><strong>Click</strong> items in the legend at the top to hide or show their respective lines on the graph.</li>
                    </ul>
                `;
            } else if (tutType === "scenario") {
                tutTitle.textContent = "Scenario Testing Analytics";
                tutBody.innerHTML = `
                    <p>Each attacking unit receives its own dedicated set of Advanced Graphs.</p>
                    <p style="margin-top: 10px;">The averages table compares the <strong>Rule</strong> column against the resulting output. For example: <em>The base profile line might show a 30% chance to hit 8 attacks, but the "+1 to Hit" line shows that with that buff, you would instead have a 65% chance.</em></p>
                    <ul style="margin-top: 10px; margin-left: 20px; padding-left: 10px;">
                        <li style="margin-bottom: 6px;"><strong>Solid Lines:</strong> Represent buffs applied to your Attacking Unit.</li>
                        <li style="margin-bottom: 6px;"><strong>Dotted Lines:</strong> Represent defensive buffs applied to the Target Unit.</li>
                        <li style="margin-bottom: 6px;"><strong>Redundant Modifiers:</strong> If a rule mathematically does nothing (e.g., the target has a "-1 Damage" buff, but your weapon only does 1 Damage anyway), the engine grays it out and ignores it.</li>
                        <li style="margin-bottom: 6px;"><strong>Sustained Hits:</strong> Extra hits generated are tracked in their own column.</li>
                    </ul>
                `;
            } else if (tutType === "data_loom") {
                tutTitle.textContent = "Data-Loom (WIP)";
                tutBody.innerHTML = `
                    <p><strong>Work In Progress.</strong></p>
                    <p style="margin-top: 10px;">At a later stage, this feature will allow you to view the raw data and exact mathematical outputs of all 100,000+ simulation rolls, likely visualized as detailed bar graphs.</p>
                `;
            } else if (tutType === "wound_avg") {
                tutTitle.textContent = "Wound Phase Averages";
                tutBody.innerHTML = `
                    <p>Why are <strong>Lethal Hits</strong> tracked in the Wound graph and not the Hit graph?</p>
                    <p style="margin-top: 10px;">Because Lethal Hits automatically bypass the Wound roll entirely, they are mathematically counted as successful Wounds. Tracking them here gives you a true representation of your total successful Wounds pushed through to the Save phase.</p>
                `;
            } else if (tutType === "damage_avg") {
                tutTitle.textContent = "Damage / Models Killed";
                tutBody.innerHTML = `
                    <p>Why are <strong>Devastating Wounds</strong> tracked here?</p>
                    <p style="margin-top: 10px;">Because Devastating Wounds bypass the target's Save phase entirely and convert directly into damage, their impact is best visualized in the final Damage and Models Killed reports.</p>
                `;
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