//#region imports >>>>>>>>>>>>>>>>>>>>>>>

// ModifierRegistry from modifier-registry.js
import { ModifierRegistry, CombiCategoryTitles } from './modifier-registry.js';

//#endregion

//#region view manager >>>>>>>>>>>>>>>>>>>>>>>

// switch active view based on tab clicked
export function switchDashboardView(activeTabId, activeViewId) {
    const tabs = ["tab-standard", "tab-combinatorial", "tab-dataloom"];

    tabs.forEach(tabId => {
        const el = document.getElementById(tabId);
        if (el) {
            el.style.backgroundColor = "var(--surface-color)";
            el.style.color = "var(--theme-text-light)";
        }
    });

    const activeTab = document.getElementById(activeTabId);

    if (activeTab) {
        activeTab.style.backgroundColor = "var(--theme-accent)";
        activeTab.style.color = "#0F1115";
    }

    const views = ["view-standard", "view-combinatorial"];

    views.forEach(viewId => {
        const el = document.getElementById(viewId);
        if (el) el.style.display = "none";
    });

    const activeView = document.getElementById(activeViewId);

    if (activeView) {
        activeView.style.display = "block";
    }
}

//#endregion

//#region roster modules >>>>>>>>>>>>>>>>>>>>>>>

// inject html for a new attacker unit module
export function addAttackerModule(containerElement) {
    const moduleHTML = `
      <div class="attacker-module" style="background: var(--surface-color); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div class="input-field" style="flex-grow: 1; margin-right: 15px;">
                   <input type="text" class="in-unit-name" value="Attacker Unit" style="font-weight: bold; font-size: 1.2rem; color: var(--theme-accent); border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 5px 0; background: transparent; box-shadow: none;" />
                    <div class="attached-leaders-display" style="color: var(--theme-text-light); font-size: 0.85rem; font-weight: bold; margin-top: 5px;"></div>
                </div>
                <button class="remove-btn" style="background: var(--theme-text-light); color: var(--bg-color); border: none; border-radius: 4px; padding: 5px 10px; font-weight: bold;">X</button>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="cursor: pointer; color: var(--theme-text-light); font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">
                 <input type="checkbox" class="is-leader" style="margin-right: 5px;"> Declare Leader
              </label>
            </div>

            <div class="leader-options" style="display: none; background: var(--surface-hover); padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid var(--border-color);">
              <div class="core-stats-row">
                  <div class="input-field">
                     <label>Attach to Unit:</label>
                     <select class="attach-to"><option value="">-- Select Unit --</option></select>
                  </div>
                  <div class="input-field">
                     <label>Grant Keyword to Unit:</label>
                     <select class="grant-keyword">
                        <option value="none">None</option>
                        <option value="lethal">Lethal Hits</option>
                        <option value="devastating">Devastating Wounds</option>
                        <option value="sustained">Sustained Hits</option>
                        <option value="lance">Lance</option>
                        <option value="reroll_hits_1">Reroll 1s to Hit</option>
                        <option value="reroll_hits_all">Reroll All (Hit)</option>
                        <option value="reroll_wounds_1">Reroll 1s to Wound</option>
                        <option value="reroll_wounds_all">Reroll All (Wound)</option>
                        <option value="hit_plus_1">+1 to Hit</option>
                        <option value="wound_plus_1">+1 to Wound</option>
                     </select>
                  </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--theme-mid); padding-bottom: 5px;">
    <h4 style="margin: 0; border: none; padding: 0;">Core Profile</h4>
    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--theme-accent); font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
        Add to Combi Roster
        <label class="toggle-switch" style="width: 30px; height: 16px;">
            <input type="checkbox" class="in-combi-roster" />
            <span class="toggle-slider"></span>
        </label>
    </label>
</div>
            <div class="core-stats-row" style="grid-template-columns: repeat(2, 1fr); max-width: 300px;">
              <div class="input-field"><label>Units</label><input type="number" class="in-units" value="1" min="1" /></div>
              <div class="input-field"><label>Models</label><input type="number" class="in-models" value="5" min="1" /></div>
            </div>
            
            <div class="core-stats-row" style="grid-template-columns: repeat(5, 1fr);">
              <div class="input-field"><label>Attacks</label><input type="text" class="in-attacks" value="4" min="1" placeholder="D3+1" /></div>
              <div class="input-field"><label>BS/WS</label><input type="text" class="in-bsws" value="3" placeholder="NA" /></div>
              <div class="input-field"><label>Strength</label><input type="number" class="in-str" value="4" min="1" /></div>
              <div class="input-field"><label>AP</label><input type="number" class="in-ap" value="-1" max="0" /></div>
              <div class="input-field"><label>Damage</label><input type="text" class="in-dam" value="1" placeholder="D6+1" /></div>
            </div>

            <div class="core-stats-row" style="grid-template-columns: repeat(2, 1fr); max-width: 300px;">
              <div class="input-field"><label>Crit Hit</label><input type="number" class="in-crit-hit" value="6" min="2" max="6" /></div>
              <div class="input-field"><label>Crit Wnd</label><input type="number" class="in-crit-wound" value="6" min="2" max="6" /></div>
            </div>

            <h4>Active Modifiers</h4>
            <div class="modifier-adder-row">
                <select class="mod-dropdown" style="flex-grow: 1;">
                    <option value="none">-- Select a Rule to Add --</option>
                    <optgroup label="Weapon Rules">
                        <option value="lethal">Lethal Hits</option>
                        <option value="devastating">Devastating Wounds</option>
                        <option value="sustained">Sustained Hits</option>
                        <option value="melta">Melta</option>
                        <option value="anti">Anti-X</option>
                        <option value="rapidfire">Rapid Fire</option>
                        <option value="lance">Lance</option>
                        <option value="torrent">Torrent</option>
                        <option value="twinlinked">Twin-Linked</option>
                        <option value="blast">Blast</option>
                        <option value="cleave">Cleave</option>
                    </optgroup>
                    <optgroup label="Flat Modifiers">
                        <option value="hit_plus_1">+1 to Hit</option>
                        <option value="hit_minus_1">-1 to Hit</option>
                        <option value="wound_plus_1">+1 to Wound</option>
                        <option value="wound_minus_1">-1 to Wound</option>
                    </optgroup>
                  <optgroup label="Rerolls">
                        <option value="reroll_hits_1">Reroll 1s to Hit</option>
                        <option value="reroll_hits_all">Reroll All Hits</option>
                        <option value="reroll_one_hit">Reroll 1 Hit Roll</option>
                        <option value="reroll_wounds_1">Reroll 1s to Wound</option>
                        <option value="reroll_wounds_all">Reroll All Wounds</option>
                        <option value="reroll_one_wound">Reroll 1 Wound Roll</option>
                        <option value="fish_crits">Fish for Crits (Greedy)</option>
                        <option value="reroll_damage">Reroll Damage (1s & 2s)</option>
                        <option value="reroll_one_damage">Reroll 1 Dmg Roll</option>
                    </optgroup>
                </select>
                <button class="btn-primary add-mod-btn">Add Rule</button>
            </div>
            
            <div class="active-modifiers-list"></div>
      </div>
    `;

    containerElement.insertAdjacentHTML('beforeend', moduleHTML);

    const newModule = containerElement.lastElementChild;

    // prevent deletion if only one attacker exists
    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
            syncAppUI();
        } else {
            alert("The pack must have at least one attacker!");
        }
    });

    // attach newly selected rule to unit
    newModule.querySelector(".add-mod-btn").addEventListener("click", () => {
        const select = newModule.querySelector(".mod-dropdown");
        const modKey = select.value;

        if (modKey !== "none") {
            addBadgeToModule(newModule, modKey, false);
            select.value = "none";
            syncAppUI();
        }
    });
}

// build dynamic html based on modifier requirements
export function addBadgeToModule(moduleNode, modKey, isGranted) {
    const list = moduleNode.querySelector(".active-modifiers-list");

    // prevent duplicate badges
    if (list.querySelector(`.mod-badge[data-key="${modKey}"]`)) return;

    const modData = ModifierRegistry[modKey];
    if (!modData) return;

    const badge = document.createElement("div");

    badge.className = "mod-badge";
    badge.dataset.key = modKey;
    if (isGranted) badge.dataset.granted = "true";

    let innerHTML = `<span>${modData.name}</span>`;

    if (modData.hasInput) {
        innerHTML += `<input type="number" class="badge-val" value="${modData.defaultVal}" min="1" ${isGranted ? 'disabled' : ''} />`;
    }

    if (!isGranted) {
        innerHTML += `<button class="remove-mod-btn">×</button>`;
    }

    badge.innerHTML = innerHTML;

    if (!isGranted) {
        badge.querySelector(".remove-mod-btn").addEventListener("click", () => {
            badge.remove();
            syncAppUI();
        });
    }

    list.appendChild(badge);
}

//#endregion

//#region state sync >>>>>>>>>>>>>>>>>>>>>>>

// update dropdowns and leader assignments across modules
export function syncAppUI() {
    const modules = document.querySelectorAll('.attacker-module');
    const allNames = Array.from(modules).map(m => m.querySelector('.in-unit-name').value.trim());

    modules.forEach(module => {
        module.querySelector('.in-units').disabled = false;
        module.querySelector('.attached-leaders-display').innerHTML = '';
        module.querySelectorAll('.mod-badge[data-granted="true"]').forEach(b => b.remove());

        const isLeader = module.querySelector('.is-leader').checked;
        module.querySelector('.leader-options').style.display = isLeader ? "block" : "none";

        const select = module.querySelector('.attach-to');
        const currentSelection = select.value;
        const myName = module.querySelector('.in-unit-name').value.trim();

        select.innerHTML = '<option value="">-- Select Unit --</option>';

        allNames.forEach(name => {
            if (name && name !== myName) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            }
        });

        if (allNames.includes(currentSelection)) select.value = currentSelection;
    });

    // attach leader logic and auto-grant keywords
    modules.forEach(leaderModule => {
        const isLeader = leaderModule.querySelector('.is-leader').checked;
        const targetName = leaderModule.querySelector('.attach-to').value;
        const granted = leaderModule.querySelector('.grant-keyword').value;
        const leaderName = leaderModule.querySelector('.in-unit-name').value.trim();

        if (isLeader && targetName) {
            const targetModule = Array.from(modules).find(m => m.querySelector('.in-unit-name').value.trim() === targetName);

            if (targetModule) {
                targetModule.querySelector('.attached-leaders-display').innerHTML += `Led by: ${leaderName}`;
                targetModule.querySelector('.in-units').value = 1;
                targetModule.querySelector('.in-units').disabled = true;

                if (granted !== "none") {
                    addBadgeToModule(targetModule, granted, true);
                    addBadgeToModule(leaderModule, granted, true);
                }
            }
        }
    });
}

// rebuild modules from imported json state
export function buildRosterFromJSON(containerElement, jsonData, clearRoster = true) {
    if (clearRoster) {
        containerElement.innerHTML = '';
    }

    jsonData.forEach(unitData => {
        addAttackerModule(containerElement);

        const newModule = containerElement.lastElementChild;

        newModule.querySelector(".in-unit-name").value = unitData.unitName || "Attacker Unit";
        newModule.querySelector(".in-attacks").value = unitData.attack || "1";
        newModule.querySelector(".in-bsws").value = unitData.BsWs || "3";
        newModule.querySelector(".in-str").value = unitData.strength || 4;
        newModule.querySelector(".in-ap").value = unitData.Ap || 0;
        newModule.querySelector(".in-dam").value = unitData.damage || "1";
        newModule.querySelector(".in-models").value = unitData.modelCount || 5;
        newModule.querySelector(".in-units").value = unitData.unitCount || 1;

        // restore combi roster toggle state
        if (unitData.includeInCombi) {
            const toggle = newModule.querySelector('.in-combi-roster');
            if (toggle) toggle.checked = true;
        }

        if (unitData.modifiers) {
            if (unitData.modifiers.critHitThreshold) {
                newModule.querySelector(".in-crit-hit").value = unitData.modifiers.critHitThreshold;
            }
            if (unitData.modifiers.critWoundThreshold) {
                newModule.querySelector(".in-crit-wound").value = unitData.modifiers.critWoundThreshold;
            }
        }

        if (unitData.isLeader) {
            newModule.querySelector('.is-leader').checked = true;

            if (unitData.attachTarget) {
                const attachSelect = newModule.querySelector('.attach-to');
                attachSelect.innerHTML = `<option value="${unitData.attachTarget}">${unitData.attachTarget}</option>`;
                attachSelect.value = unitData.attachTarget;
            }

            if (unitData.grantedKeyword) {
                newModule.querySelector('.grant-keyword').value = unitData.grantedKeyword;
            }
        }

        const mods = unitData.modifiers;

        if (mods) {
            if (mods.lethal) addBadgeToModule(newModule, "lethal", false);
            if (mods.devastating) addBadgeToModule(newModule, "devastating", false);
            if (mods.lance) addBadgeToModule(newModule, "lance", false);
            if (mods.torrent) addBadgeToModule(newModule, "torrent", false);
            if (mods.twinLinked) addBadgeToModule(newModule, "twinlinked", false);
            if (mods.blast) addBadgeToModule(newModule, "blast", false);
            if (mods.cleave) addBadgeToModule(newModule, "cleave", false);
            if (mods.hitMod > 0) addBadgeToModule(newModule, "hit_plus_1", false);
            if (mods.hitMod < 0) addBadgeToModule(newModule, "hit_minus_1", false);
            if (mods.woundMod > 0) addBadgeToModule(newModule, "wound_plus_1", false);
            if (mods.woundMod < 0) addBadgeToModule(newModule, "wound_minus_1", false);
            if (mods.rerollHits === "all") addBadgeToModule(newModule, "reroll_hits_all", false);
            if (mods.rerollHits === "ones") addBadgeToModule(newModule, "reroll_hits_1", false);
            if (mods.rerollWounds === "all") addBadgeToModule(newModule, "reroll_wounds_all", false);
            if (mods.rerollWounds === "ones") addBadgeToModule(newModule, "reroll_wounds_1", false);
            if (mods.rerollOneHit) addBadgeToModule(newModule, "reroll_one_hit", false);
            if (mods.rerollOneWound) addBadgeToModule(newModule, "reroll_one_wound", false);
            if (mods.fishForCrits) addBadgeToModule(newModule, "fish_crits", false);
            if (mods.rerollDamage) addBadgeToModule(newModule, "reroll_damage", false);
            if (mods.rerollOneDamage) addBadgeToModule(newModule, "reroll_one_damage", false);

            if (mods.sustained > 0) {
                addBadgeToModule(newModule, "sustained", false);
                newModule.querySelector('.mod-badge[data-key="sustained"] .badge-val').value = mods.sustained;
            }
            if (mods.melta > 0) {
                addBadgeToModule(newModule, "melta", false);
                newModule.querySelector('.mod-badge[data-key="melta"] .badge-val').value = mods.melta;
            }
            if (mods.anti > 0) {
                addBadgeToModule(newModule, "anti", false);
                newModule.querySelector('.mod-badge[data-key="anti"] .badge-val').value = mods.anti;
            }
            if (mods.rapidFire > 0) {
                addBadgeToModule(newModule, "rapidfire", false);
                newModule.querySelector('.mod-badge[data-key="rapidfire"] .badge-val').value = mods.rapidFire;
            }
        }
    });

    syncAppUI();
};

//#endregion

//#region reporting ui >>>>>>>>>>>>>>>>>>>>>>>

// inject html for advanced analysis report cards
export function spawnReportCard(title, container, statsHTML, avgStatsHTML) {
    const cardHTML = `
        <div class="report-card" style="margin-bottom: 20px; background: rgba(15, 17, 21, 0.4); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
            <div style="display: grid; grid-template-columns: 375px 1fr; gap: 0; align-items: stretch;">
                <div class="avg-stats-sidebar" style="background: rgba(0,0,0,0.25); padding: 15px; border-right: 1px solid var(--border-color);">
                    <h4 style="color: var(--theme-text-light); margin-top: 0; margin-bottom: 10px; font-size: 1rem;">${title}</h4>
                    ${avgStatsHTML}
                </div>
                <div style="padding: 15px; min-height: 250px; position: relative;">
                    <canvas class="adv-chart"></canvas>
                </div>
            </div>
            <div class="core-stats-header" style="padding: 10px 15px; background: rgba(255,255,255,0.02); border-top: 1px solid var(--border-color);">
                ${statsHTML}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);
    return container.lastElementChild;
}

export function spawnLeaderboard(container, statsArray, isSingleTarget = false) {
    // sort by kills then damage
    statsArray.sort((a, b) => {
        if (b.avgKills !== a.avgKills) {
            return b.avgKills - a.avgKills;
        }
        return b.avgDamage - a.avgDamage;
    });

    const summaryCard = document.createElement('div');

    summaryCard.style.background = "var(--surface-color)";
    summaryCard.style.padding = "20px";
    summaryCard.style.borderRadius = "8px";
    summaryCard.style.border = "1px solid var(--theme-accent)";
    summaryCard.style.marginBottom = "30px";
    summaryCard.style.boxShadow = "0 4px 15px rgba(0,0,0,0.5)";

    const killHeader = isSingleTarget ? "Probability to Kill" : "Expected Models Killed";

    let tableHTML = `
        <h3 style="margin-top: 0; color: var(--theme-accent); border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
             Base Output Leaderboard
        </h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
            <thead>
                <tr>
                    <th style="padding: 10px; color: var(--theme-text-muted); border-bottom: 1px solid var(--border-color);">Weapon Profile</th>
                    <th style="padding: 10px; color: var(--theme-text-muted); border-bottom: 1px solid var(--border-color);">${killHeader}</th>
                    <th style="padding: 10px; color: var(--theme-text-muted); border-bottom: 1px solid var(--border-color);">Avg Damage</th>
                </tr>
            </thead>
            <tbody>
    `;

    statsArray.forEach((stat, index) => {
        const medal = index === 0 ? "1st: " : index === 1 ? "2nd: " : index === 2 ? "3rd: " : "";
        const killDisplay = isSingleTarget ? (stat.avgKills * 100).toFixed(1) + "%" : stat.avgKills.toFixed(2);

        tableHTML += `
            <tr class="leaderboard-row" data-target="${stat.unitName}" style="cursor: pointer;">
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--theme-accent); font-weight: bold;">
                    ${medal}${stat.unitName}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--theme-text-light);">${killDisplay}</td>
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--theme-text-light);">${stat.avgDamage.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    summaryCard.innerHTML = tableHTML;

    // attach scroll to target accordion functionality
    const rows = summaryCard.querySelectorAll('.leaderboard-row');

    rows.forEach(row => {
        row.addEventListener('click', () => {
            const targetUnit = row.getAttribute('data-target');
            const targetAccordion = document.querySelector(`details[data-unit="${targetUnit}"]`);

            if (targetAccordion) {
                document.querySelectorAll('#advanced-reports-container details').forEach(d => d.open = false);
                targetAccordion.open = true;
                targetAccordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    container.insertAdjacentElement('afterbegin', summaryCard);
}

//#endregion

//#region combi engine >>>>>>>>>>>>>>>>>>>>>>>

// build initial testing pool from valid combi modifiers
export function initCombinatorialPool() {
    const container = document.getElementById("bucket-available");
    if (!container) return;

    container.innerHTML = "";

    const combiMods = Object.entries(ModifierRegistry)
        .filter(([key, data]) => data.combiCategory !== null)
        .map(([key, data]) => ({ key, ...data }));

    const categories = [...new Set(combiMods.map(m => m.combiCategory))];

    categories.forEach(cat => {
        const wrapper = document.createElement("div");

        wrapper.innerHTML = `
            <div style="color: var(--theme-text-muted); font-size: 0.75rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
                ${CombiCategoryTitles[cat] || cat}
            </div>
            <div id="pool-${cat}" class="bucket-dropzone available-pool-zone" data-accept="${cat}" style="display: flex; flex-direction: column; gap: 8px; min-height: 40px; padding: 5px; border: 1px dashed var(--theme-mid); border-radius: 4px;">
            </div>
        `;

        container.appendChild(wrapper);
    });

    combiMods.forEach(mod => {
        const dropzone = document.getElementById(`pool-${mod.combiCategory}`);

        if (dropzone) {
            const el = document.createElement("div");

            el.draggable = true;
            el.className = "draggable-mod";
            el.dataset.mod = mod.key;
            el.dataset.category = mod.combiCategory;
            el.style.cssText = "background: var(--bg-color); padding: 8px; border: 1px solid var(--theme-mid); border-radius: 4px; cursor: grab; color: var(--theme-text-light); font-size: 0.85rem; font-weight: bold;";
            el.textContent = mod.name;

            dropzone.appendChild(el);
        }
    });
}

export function renderCombiMirror(weaponsArray, targetUnit) {
    const container = document.getElementById("combi-mirror-container");
    if (!container) return;

    const targetName = targetUnit.name || "Defending Target";

    let html = `<div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: stretch;">`;

    // build target profile card
    let targetMods = [];

    if (targetUnit.modifiers.minusOneHit) targetMods.push("-1 Hit");
    if (targetUnit.modifiers.minusOneWound) targetMods.push("-1 Wnd");
    if (targetUnit.modifiers.minusOneWoundHighStr) targetMods.push("S>T -1 Wnd");
    if (targetUnit.modifiers.cover) targetMods.push("Cover");
    if (targetUnit.modifiers.halfDamage) targetMods.push("1/2 Dmg");
    if (targetUnit.modifiers.minusOneDamage) targetMods.push("-1 Dmg");
    if (targetUnit.modifiers.plusOneSave) targetMods.push("+1 Save");
    if (targetUnit.fnp && targetUnit.fnp > 1) targetMods.push(`FNP ${targetUnit.fnp}+`);

    let targetModsStr = targetMods.length > 0 ? targetMods.join(' | ') : "No Defensive Mods";

    html += `
    <div style="flex: 1; min-width: 250px; background: var(--surface-color); border: 1px solid var(--border-color); border-top: 4px solid var(--theme-btn-standard); border-radius: 6px; padding: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 8px;">
        <div style="color: var(--theme-text-muted); font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Target Profile</div>
        <div style="font-size: 1.2rem; color: var(--theme-text-light); font-weight: bold;">${targetName}</div>
        <div style="display: flex; gap: 10px; font-size: 0.95rem; color: #fff; font-weight: bold; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
            <span>T${targetUnit.toughness}</span>|<span>W${targetUnit.wounds}</span>|<span>SV${targetUnit.save}+</span>${targetUnit.inVul ? `|<span>INV${targetUnit.inVul}++</span>` : ''}
        </div>
        <div style="color: var(--theme-btn-standard); font-size: 0.8rem; font-weight: bold;">${targetModsStr}</div>
    </div>
    `;

    const groups = [];
    const processed = new Set();

    weaponsArray.forEach(w => {
        if (!w.isLeader) {
            const leaders = weaponsArray.filter(lw => lw.isLeader && lw.attachTarget === w.unitName);
            leaders.forEach(l => processed.add(l.unitName));
            groups.push({ base: w, leaders: leaders });
        }
    });

    weaponsArray.forEach(w => {
        if (w.isLeader && !processed.has(w.unitName)) {
            groups.push({ base: null, leaders: [w] });
        }
    });

    // format active modifiers for datacards
    const getModsString = (w) => {
        let activeMods = [];

        if (w.modifiers.lethal) activeMods.push("Lethal");
        if (w.modifiers.devastating) activeMods.push("Dev Wounds");
        if (w.modifiers.sustained > 0) activeMods.push(`Sus ${w.modifiers.sustained}`);
        if (w.modifiers.rerollHits !== "none") activeMods.push(`RR Hits`);
        if (w.modifiers.rerollWounds !== "none") activeMods.push(`RR Wounds`);
        if (w.modifiers.anti > 0) activeMods.push(`Anti-${w.modifiers.anti}+`);
        if (w.modifiers.lance) activeMods.push("Lance");
        if (w.modifiers.rapidFire > 0) activeMods.push(`RF ${w.modifiers.rapidFire}`);
        if (w.modifiers.melta > 0) activeMods.push(`Melta ${w.modifiers.melta}`);
        if (w.modifiers.torrent) activeMods.push("Torrent");
        if (w.modifiers.twinLinked) activeMods.push("Twin-Linked");
        if (w.modifiers.blast) activeMods.push("Blast");
        if (w.modifiers.cleave) activeMods.push("Cleave");
        if (w.modifiers.hitMod > 0) activeMods.push(`+${w.modifiers.hitMod} Hit`);
        if (w.modifiers.hitMod < 0) activeMods.push(`${w.modifiers.hitMod} Hit`);
        if (w.modifiers.woundMod > 0) activeMods.push(`+${w.modifiers.woundMod} Wound`);
        if (w.modifiers.woundMod < 0) activeMods.push(`${w.modifiers.woundMod} Wound`);
        if (w.modifiers.rerollDamage) activeMods.push(`RR Damage`);
        if (w.modifiers.rerollOneHit) activeMods.push("RR 1 Hit");
        if (w.modifiers.rerollOneWound) activeMods.push("RR 1 Wound");
        if (w.modifiers.rerollOneDamage) activeMods.push("RR 1 Dmg");

        return activeMods.length > 0 ? `[${activeMods.join(', ')}]` : "";
    };

    // build grouped attacker cards
    groups.forEach(g => {
        html += `<div style="flex: 1; min-width: 280px; background: var(--surface-color); border: 1px solid var(--border-color); border-top: 4px solid var(--theme-accent); border-radius: 6px; padding: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 10px;">`;

        if (g.leaders.length > 0) {
            html += `<div style="display: flex; flex-direction: column; gap: 5px;">`;
            g.leaders.forEach(l => {
                const modsDisplay = getModsString(l);
                html += `
                <div style="background: rgba(196, 130, 53, 0.08); border: 1px solid var(--theme-accent); border-radius: 4px; padding: 10px;">
                    <div style="color: var(--theme-accent); font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">Leader</div>
                    <div style="font-size: 1.05rem; color: #fff; font-weight: bold;">${l.unitName}</div>
                    <div style="font-size: 0.85rem; color: var(--theme-text-light); margin-top: 4px;">
                        ${l.attack}A | BS/WS ${l.BsWs}+ | S${l.strength} | AP${l.Ap} | D${l.damage}
                    </div>
                    ${modsDisplay ? `<div style="color: var(--theme-accent); font-size: 0.75rem; font-weight: bold; margin-top: 4px;">${modsDisplay}</div>` : ''}
                </div>`;
            });
            html += `</div>`;

            if (g.base) {
                html += `<div style="text-align: center; color: var(--theme-text-muted); font-size: 0.75rem; font-weight: bold; letter-spacing: 1px;">▼ LEADING ▼</div>`;
            }
        }

        if (g.base) {
            const unitLabel = g.leaders.length > 0 ? "Bodyguard Unit" : "Unit";
            const modsDisplay = getModsString(g.base);

            html += `
            <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 4px; padding: 10px;">
                <div style="color: var(--theme-text-muted); font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">${unitLabel}</div>
                <div style="font-size: 1.05rem; color: #fff; font-weight: bold;">${g.base.unitName}</div>
                <div style="font-size: 0.85rem; color: var(--theme-text-light); margin-top: 4px;">
                    ${g.base.unitCount * g.base.modelCount}M | ${g.base.attack}A | BS/WS ${g.base.BsWs}+ | S${g.base.strength} | AP${g.base.Ap} | D${g.base.damage}
                </div>
                ${modsDisplay ? `<div style="color: var(--theme-accent); font-size: 0.75rem; font-weight: bold; margin-top: 4px;">${modsDisplay}</div>` : ''}
            </div>`;
        }

        html += `</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

export function renderCombinatorialLeaderboard(leaderboardData, totalSims = 0, bucketState = null) {
    const container = document.getElementById("combinatorial-results-container");
    if (!container) return;

    container.innerHTML = "";

    if (!leaderboardData || leaderboardData.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: var(--theme-text-light);'>No results generated.</p>";
        return;
    }

    // format modifier display names and apply bucket colors
    const formatMod = (mod) => {
        let color = "var(--theme-text-light)";

        if (bucketState) {
            if (bucketState.mutExclusiveA.includes(mod) || bucketState.mutExclusiveB.includes(mod) || bucketState.mutExclusiveC.includes(mod)) {
                color = "var(--theme-accent)";
            } else if (bucketState.inclusiveA.includes(mod) || bucketState.inclusiveB.includes(mod) || bucketState.inclusiveC.includes(mod)) {
                color = "var(--theme-inclusive)";
            }
        }

        const formattedName = mod.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        return `<span style="color: ${color}; font-weight: bold;">${formattedName}</span>`;
    };

    leaderboardData.forEach(item => {
        const groupName = item.groupName;
        const topCombos = item.topCombos;
        const baseStats = item.baseResult;

        const card = document.createElement("details");
        card.open = true;
        card.style.cssText = `
            background: var(--bg-color); 
            border-radius: 6px; 
            border: 1px solid var(--border-color); 
            margin-bottom: 25px;
            overflow: hidden;
        `;

        let htmlString = `
            <summary style="background: var(--surface-hover); padding: 15px; cursor: pointer; font-size: 1.2rem; font-weight: bold; color: var(--theme-accent); outline: none; border-bottom: 1px solid var(--border-color);">
                ${groupName}
            </summary>
            <div style="padding: 20px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        topCombos.forEach((comboData, index) => {
            const modsUsed = comboData[0];
            const stats = comboData[1];

            const modString = modsUsed.length > 0
                ? modsUsed.map(formatMod).join(' <span style="color: var(--theme-text-muted);">+</span> ')
                : "Base Profile Only";

            const kills = stats.averages.killed.toFixed(3);
            const damage = stats.averages.damage.toFixed(3);

            let deltaHTML = "";

            if (baseStats) {
                const deltaKills = (stats.averages.killed - baseStats.averages.killed).toFixed(3);
                const deltaDmg = (stats.averages.damage - baseStats.averages.damage).toFixed(3);
                const killColor = deltaKills >= 0 ? "#8FE07F" : "var(--danger-red)";
                const dmgColor = deltaDmg >= 0 ? "#8FE07F" : "var(--danger-red)";
                const killSign = deltaKills >= 0 ? "+" : "";
                const dmgSign = deltaDmg >= 0 ? "+" : "";

                deltaHTML = `
                    <div style="font-size: 0.8rem; color: var(--theme-text-muted); margin-top: 5px; text-align: right;">
                        Δ Base: <span style="color: ${killColor}">${killSign}${deltaKills} Kills</span> | <span style="color: ${dmgColor}">${dmgSign}${deltaDmg} DMG</span>
                    </div>
                `;
            }

            htmlString += `
                <div style="background: rgba(0, 0, 0, 0.3); padding: 12px 15px; border-radius: 4px; border-left: 4px solid var(--theme-accent); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="flex-grow: 1;">
                        <strong style="color: #fff; font-size: 1.05rem;">#${index + 1}: ${modString}</strong>
                    </div>
                    <div style="min-width: 150px; display: flex; flex-direction: column; align-items: flex-end;">
                        <div>
                            <span style="color: var(--danger-red); font-weight: bold; font-size: 1.1rem;">${kills} Kills</span> 
                            <span style="color: var(--theme-text-muted); margin: 0 8px;">|</span> 
                            <span style="color: var(--theme-text-light); font-size: 0.95rem;">${damage} DMG</span>
                        </div>
                        ${deltaHTML}
                    </div>
                </div>
            `;
        });

        htmlString += `</div></div>`;
        card.innerHTML = htmlString;
        container.appendChild(card);
    });
}

//#endregion