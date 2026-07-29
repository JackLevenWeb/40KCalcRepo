// central nervous system. manages dom event listeners and broadcasts custom events.
import { syncAppUI, addBadgeToModule, addAttackerModule, switchDashboardView } from './ui-manager.js';
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

    const TabStandard = document.getElementById("tab-standard");
    const TabCombinatorial = document.getElementById("tab-combinatorial");
    const TabDataLoom = document.getElementById("tab-dataloom");

    if (TabStandard) {
        TabStandard.addEventListener("click", () => {
            switchDashboardView("tab-standard", "view-standard");
        });
    }

    if (TabCombinatorial) {
        TabCombinatorial.addEventListener("click", () => {
            switchDashboardView("tab-combinatorial", "view-combinatorial");
        });
    }

    if (TabDataLoom) {
        TabDataLoom.addEventListener("click", () => {
        });
    }

    const triggerSave = () => document.dispatchEvent(new CustomEvent("App:AutoSave"));

    if (ThemeSelect) {
        ThemeSelect.addEventListener("change", (e) => {
            const newTheme = e.target.value;

            const oldTheme = localStorage.getItem("40kTheme") || "space_wolves";

            if (confirm("Changing the theme will wipe your current roster and reset the dashboard. Proceed?")) {
                applyTheme(newTheme);
                document.dispatchEvent(new CustomEvent("App:ThemeChanged"));

                document.dispatchEvent(new CustomEvent("App:ClearDashboard"));
            } else {

                e.target.value = oldTheme;
            }
        });
    }


    const tutorialModal = document.getElementById("tutorial-modal");
    const modalClose = document.querySelector(".modal-close");
    const tutTitle = document.getElementById("tutorial-title");
    const tutBody = document.getElementById("tutorial-body");

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("tutorial-btn")) {
            const tutType = e.target.getAttribute("data-tutorial");

            if (tutType === "main_site") {
                tutTitle.textContent = "How to use this website";
                tutBody.innerHTML = `
                    <p>Welcome to the Munitorum Auspex(WIP), a probability calculator for Warhammer 40,000.</p>
                    <p style="margin-top: 10px;">This tool calculates exact probabilities for each phase of the game between attacking and defending units. To ensure pinpoint accuracy, this engine runs <strong>100,000 Monte Carlo simulations</strong> per unit, per modifier, per phase.</p>
                    <p style="margin-top: 10px;">Look for the <strong>?</strong> icons throughout the app to learn how each specific section functions.</p><br>
                    <p style="margin-top: 10px;">This app is a personal project created for learning and experimentation in 40K. It’s inspired by tools like Tactical Cogitator, but it’s not commercial. I built it as a portfolio piece to showcase my work on GitHub. <a href="https://github.com/JackLevenWeb" target="_blank" style="color: var(--theme-accent);">https://github.com/JackLevenWeb</a></p>
                    <div style="margin-top: 20px; font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    Inspired by: <a href="https://tactical-cogitator.com/" target="_blank" style="color: var(--theme-accent);">https://tactical-cogitator.com/</a><br>
                        Created by: <a href="https://www.linkedin.com/in/jackleventhorpe/" target="_blank" style="color: var(--theme-accent);">https://www.linkedin.com/in/jackleventhorpe/</a>
                    </div>
                `;
            } else if (tutType === "dashboard_mgmt") {
                tutTitle.textContent = "Data Requisition & Dashboard Management";
                tutBody.innerHTML = `
                    <p>This control panel manages your application state and data imports.</p>
                    <ul style="margin-top: 10px; margin-left: 20px; padding-left: 10px;">
                        <li style="margin-bottom: 8px;"><strong>API Search:</strong> Search the OpenHammer database for a unit, select Ranged or Melee, and import it directly to your roster.</li>
                        <li style="margin-bottom: 8px;"><strong>Theme:</strong> Swap the visual theme of the application (Note: this will clear the current dashboard).</li>
                        <li style="margin-bottom: 8px;"><strong>Import/Export JSON:</strong> Save your current Attacker Roster and Target Profile to your local computer, or load a previously saved roster.</li>
                    </ul>
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
                    <p style="margin-top: 10px;">It will also generate a <strong>Base Output Leaderboard</strong> at the top of the section, ranking your deployed weapons by their average damage output and models killed.</p>
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
                    <p style="margin-top: 10px;"><strong>Overkill/Efficiency (Wasted Damage):</strong> The amount of damage dealt that exceeded a model's remaining wounds (e.g., dealing 3 damage to a 1-wound model results in 2 wasted damage).</p>
                `;
            } else if (tutType === "combinatorial_engine") {
                tutTitle.textContent = "Combinatorial Modifier Analysis";
                tutBody.innerHTML = `
                    <p>The Combinatorial Engine is a theory-crafting tool designed to find the mathematically optimal loadout for your units.</p>
                    <p style="margin-top: 10px;">Instead of testing one modifier at a time, you can drag and drop multiple rules into the testing buckets below. The engine will automatically generate and simulate every valid combination of those rules, and then rank the results in a final leaderboard.</p>
                    <p style="margin-top: 10px;"><strong>Warning:</strong> The more modifiers you test at once, the more combinations the engine must generate. Testing too many modifiers simultaneously may take several minutes to compute!</p>
                `;
            } else if (tutType === "combi_pool") {
                tutTitle.textContent = "Available Pool";
                tutBody.innerHTML = `
                    <p>This is your staging area. Modifiers left in this bucket are completely ignored by the simulation engine.</p>
                    <p style="margin-top: 10px;">Click and drag these rules into the designated testing buckets to the right to include them in your mathematical permutations.</p>
                `;
            } else if (tutType === "combi_exclusive") {
                tutTitle.textContent = "Mutually Exclusive (OR Logic)";
                tutBody.innerHTML = `
                    <p>Modifiers placed in a Mutually Exclusive bucket will <strong>never</strong> be applied at the same time during a simulation test.</p>
                    <p style="margin-top: 10px;"><strong>Example:</strong> If you place <em>Lethal Hits</em> and <em>Sustained Hits</em> into Mutually Exclusive A, the engine will test a scenario with Lethal Hits, and a separate scenario with Sustained Hits, but it will never test a scenario where both are active together.</p>
                    <p style="margin-top: 10px;">Use the separate A, B, and C buckets to isolate different categories of rules (e.g., put Weapon Rules in A, and Reroll buffs in B).</p>
                `;
            } else if (tutType === "combi_inclusive") {
                tutTitle.textContent = "Inclusive (AND Logic / Package Deal)";
                tutBody.innerHTML = `
                    <p>Modifiers placed in an Inclusive bucket are bound together into an unbreakable "package deal."</p>
                    <p style="margin-top: 10px;">The engine will only generate two states for these rules: an "All" state where every modifier in the bucket is applied simultaneously, and a "Nothing" state where none of them are applied.</p>
                    <p style="margin-top: 10px;"><strong>Example:</strong> Useful for representing a stratagem or character aura that grants multiple buffs at once.</p>
                `;
            } else if (tutType === "combi_included") {
                tutTitle.textContent = "Included in All Tests";
                tutBody.innerHTML = `
                    <p>Modifiers placed in this bucket have no constraints placed on them. The engine will calculate every possible "On / Off" combination for every item in this bucket.</p>
                    <p style="margin-top: 10px;"><strong>Example:</strong> If you place 3 rules here, the engine will test a scenario where none are applied, scenarios where only 1 is applied, scenarios where 2 are applied, and a scenario where all 3 are applied.</p>
                    <p style="margin-top: 10px;"><em>Note: The more rules you place here, the longer the calculation will take.</em></p>
                `;
            } else if (tutType === "combi_roster") {
                tutTitle.textContent = "Active Combi Roster";
                tutBody.innerHTML = `
                    <p>This panel displays the specific attacking units and attached leaders you have synced from the Standard Analytics tab for testing.</p>
                    <p style="margin-top: 10px;">The engine will automatically detect Leaders and group them with their attached units to execute combined-arms simulations.</p>
                `;
            } else if (tutType === "combi_run") {
                tutTitle.textContent = "Calculation Methodology";
                tutBody.innerHTML = `
                    <p><strong>Damage vs. Models Killed:</strong></p>
                    <p style="margin-top: 10px;">The engine tracks <em>wasted damage</em> (overkill) strictly. For example, dealing 3 Damage to a 1-Wound model will record 3 Total Damage, but only 1 Model Killed.</p>
                    <p style="margin-top: 10px;">Because of this, weapons with high Damage characteristics might display massive Total Damage outputs, but relatively lower Models Killed compared to weapons with many low-Damage attacks. Always evaluate your combinations against your specific target's wound characteristics!</p>
                `;
            }

            tutorialModal.style.display = "block";
        }
    });


    if (modalClose) {
        modalClose.addEventListener("click", () => {
            tutorialModal.style.display = "none";
        });
    }


    window.addEventListener("click", (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.style.display = "none";
        }
    });


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

//combi engine >>>>
const draggables = document.querySelectorAll('.draggable-mod');
const dropzones = document.querySelectorAll('.bucket-dropzone');

draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', () => {
        draggable.classList.add('dragging');
        draggable.style.opacity = '0.4';
    });

    draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
        draggable.style.opacity = '1';
    });
});

dropzones.forEach(zone => {
    zone.addEventListener('dragover', e => {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            zone.appendChild(draggable);
        }
    });
});