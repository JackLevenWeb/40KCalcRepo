// handles all dom manipulation, html generation, and visual updates.

export const ModifierDictionary = {
    "lethal": { name: "Lethal Hits", hasInput: false },
    "devastating": { name: "Devastating Wounds", hasInput: false },
    "lance": { name: "Lance", hasInput: false },
    "torrent": { name: "Torrent", hasInput: false },
    "twinlinked": { name: "Twin-Linked", hasInput: false },
    "blast": { name: "Blast", hasInput: false },
    "cleave": { name: "Cleave", hasInput: false },
    "sustained": { name: "Sustained", hasInput: true, defaultVal: 1 },
    "melta": { name: "Melta", hasInput: true, defaultVal: 2 },
    "anti": { name: "Anti-X", hasInput: true, defaultVal: 4 },
    "rapidfire": { name: "Rapid Fire", hasInput: true, defaultVal: 1 },
    "hit_plus_1": { name: "+1 to Hit", hasInput: false },
    "hit_minus_1": { name: "-1 to Hit", hasInput: false },
    "wound_plus_1": { name: "+1 to Wound", hasInput: false },
    "wound_minus_1": { name: "-1 to Wound", hasInput: false },
    "reroll_hits_1": { name: "Reroll 1s (Hit)", hasInput: false },
    "reroll_hits_all": { name: "Reroll All (Hit)", hasInput: false },
    "reroll_wounds_1": { name: "Reroll 1s (Wound)", hasInput: false },
    "reroll_wounds_all": { name: "Reroll All (Wound)", hasInput: false }
};

export function addAttackerModule(containerElement) {
    const moduleHTML = `
      <div class="attacker-module" style="background: var(--surface-color); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div class="input-field" style="flex-grow: 1; margin-right: 15px;">
                <input type="text" class="in-unit-name" value="Attacker Unit" style="font-family: var(--font-header) !important; font-weight: bold; font-size: 1.2rem; color: var(--accent-primary); border: none; border-bottom: 1px solid var(--border-color); border-radius: 0; padding: 5px 0; background: transparent !important; box-shadow: none;" />
                <div class="attached-leaders-display" style="color: var(--accent-primary); font-size: 0.85rem; font-weight: bold; margin-top: 5px; font-family: var(--font-body);"></div>
            </div>
            <button class="remove-btn" style="background: var(--accent-danger) !important; color: #ffffff !important; border: none; border-radius: 4px; padding: 5px 10px; font-weight: bold;">X</button>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="cursor: pointer; color: var(--accent-primary); font-family: var(--font-header); font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">
             <input type="checkbox" class="is-leader" style="margin-right: 5px;"> Declare Leader
          </label>
        </div>

        <div class="leader-options" style="display: none; background: var(--surface-hover); padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid var(--border-color);">
          <div class="core-stats-row" style="display: flex; gap: 15px;">
              <div class="input-field">
                 <label class="section-heading-label" style="font-family: var(--font-header);">Attach to Unit:</label>
                 <select class="attach-to" style="padding: 5px;"><option value="">-- Select Unit --</option></select>
              </div>
              <div class="input-field">
                 <label class="section-heading-label" style="font-family: var(--font-header);">Grant Keyword to Unit:</label>
                 <select class="grant-keyword" style="padding: 5px;">
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

        <h4 class="section-heading-label" style="font-family: var(--font-header); margin-bottom: 10px;">Core Profile</h4>
        <div class="core-stats-row" style="display: flex; gap: 10px; flex-wrap: wrap;">
          <div class="input-field"><label style="color: var(--text-muted);">Units</label><input type="number" class="in-units" value="1" min="1" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Models</label><input type="number" class="in-models" value="5" min="1" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Attacks</label><input type="text" class="in-attacks" value="4" min="1" placeholder="D3+1" style="width: 80px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">BS/WS</label><input type="text" class="in-bsws" value="3" placeholder="NA" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Strength</label><input type="number" class="in-str" value="4" min="1" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">AP</label><input type="number" class="in-ap" value="-1" max="0" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Damage</label><input type="text" class="in-dam" value="1" placeholder="D6+1" style="width: 80px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Crit Hit</label><input type="number" class="in-crit-hit" value="6" min="2" max="6" style="width: 60px;" /></div>
          <div class="input-field"><label style="color: var(--text-muted);">Crit Wnd</label><input type="number" class="in-crit-wound" value="6" min="2" max="6" style="width: 60px;" /></div>
        </div>

        <h4 class="section-heading-label" style="font-family: var(--font-header); margin-top: 15px; margin-bottom: 10px;">Active Modifiers</h4>
        <div class="modifier-adder-row" style="display: flex; gap: 10px; margin-bottom: 15px; background-color: var(--bg-color) !important;">
            <select class="mod-dropdown" style="flex-grow: 1; padding: 8px;">
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
                    <option value="reroll_wounds_1">Reroll 1s to Wound</option>
                    <option value="reroll_wounds_all">Reroll All Wounds</option>
                </optgroup>
            </select>
            <button class="btn-primary add-mod-btn" style="padding: 8px 15px; border-radius: 4px; font-weight: bold;">Add Rule</button>
        </div>
        
        <div class="active-modifiers-list" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
      </div>
    `;

    containerElement.insertAdjacentHTML('beforeend', moduleHTML);
    const newModule = containerElement.lastElementChild;

    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
            syncAppUI();
        } else {
            alert("The pack must have at least one attacker!");
        }
    });

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

export function addBadgeToModule(moduleNode, modKey, isGranted) {
    const list = moduleNode.querySelector(".active-modifiers-list");
    if (list.querySelector(`.mod-badge[data-key="${modKey}"]`)) return;

    const modData = ModifierDictionary[modKey];
    if (!modData) return;

    const badge = document.createElement("div");
    badge.className = "mod-badge";
    badge.dataset.key = modKey;
    if (isGranted) badge.dataset.granted = "true";

    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.background = "var(--bg-color)";
    badge.style.border = "1px solid var(--border-color)";
    badge.style.borderRadius = "4px";
    badge.style.padding = "4px 8px";
    badge.style.fontSize = "0.85rem";
    badge.style.color = "#ffffff";
    badge.style.fontFamily = "var(--font-body)";

    let innerHTML = `<span>${modData.name}</span>`;

    if (modData.hasInput) {
        innerHTML += `<input type="number" class="badge-val" value="${modData.defaultVal}" min="1" ${isGranted ? 'disabled' : ''} style="width: 40px; margin-left: 8px; padding: 2px;" />`;
    }

    if (!isGranted) {
        innerHTML += `<button class="remove-mod-btn" style="background: transparent; border: none; color: var(--accent-primary); margin-left: 8px; cursor: pointer; font-weight: bold;">×</button>`;
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

export function buildRosterFromJSON(containerElement, jsonData) {
    containerElement.innerHTML = '';
    jsonData.forEach(unitData => {
        addAttackerModule(containerElement);
        const newModule = containerElement.lastElementChild;

        newModule.querySelector(".in-unit-name").value = unitData.unitName;
        newModule.querySelector(".in-attacks").value = unitData.attack;
        newModule.querySelector(".in-bsws").value = unitData.BsWs;
        newModule.querySelector(".in-str").value = unitData.strength;
        newModule.querySelector(".in-ap").value = unitData.Ap;
        newModule.querySelector(".in-dam").value = unitData.damage;
        newModule.querySelector(".in-models").value = unitData.modelCount;
        newModule.querySelector(".in-units").value = unitData.unitCount;

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

export function spawnReportCard(title, container, statsHTML, avgStatsHTML) {
    const cardHTML = `
        <div class="report-card" style="margin-bottom: 20px; background: var(--surface-color); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 10px var(--theme-shadow);">
            
            <div style="display: grid; grid-template-columns: 375px 1fr; gap: 0; align-items: stretch;">
                <div class="avg-stats-sidebar" style="background: var(--bg-color); padding: 15px; border-right: 1px solid var(--border-color);">
                    <h4 class="section-heading-label" style="font-family: var(--font-header) !important; margin-top: 0; margin-bottom: 10px; font-size: 1.1rem;">${title} Averages</h4>
                    ${avgStatsHTML}
                </div>
                
                <div style="padding: 15px; min-height: 250px; display: flex; flex-direction: column;">
                    <div style="position: relative; flex-grow: 1; width: 100%;">
                        <canvas class="adv-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="core-stats-header" style="padding: 10px 15px; background: var(--surface-hover); border-top: 1px solid var(--border-color);">
                ${statsHTML}
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
    return container.lastElementChild;
}