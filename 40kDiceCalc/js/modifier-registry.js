//#region registry config >>>>>>>>>>>>>>>>>>>>>>>

// unified dictionary for all game modifiers
export const ModifierRegistry = {
    "lethal": { name: "Lethal Hits", hasInput: false, combiCategory: "weapon_rules" },
    "devastating": { name: "Devastating Wounds", hasInput: false, combiCategory: "weapon_rules" },
    "sustained": { name: "Sustained Hits", hasInput: true, defaultVal: 1, combiCategory: "weapon_rules" },
    "lance": { name: "Lance", hasInput: false, combiCategory: null },
    "torrent": { name: "Torrent", hasInput: false, combiCategory: null },
    "twinlinked": { name: "Twin-Linked", hasInput: false, combiCategory: null },
    "blast": { name: "Blast", hasInput: false, combiCategory: null },
    "cleave": { name: "Cleave", hasInput: false, combiCategory: null },
    "melta": { name: "Melta", hasInput: true, defaultVal: 2, combiCategory: null },
    "anti": { name: "Anti-X", hasInput: true, defaultVal: 4, combiCategory: null },
    "rapidfire": { name: "Rapid Fire", hasInput: true, defaultVal: 1, combiCategory: null },

    "hit_plus_1": { name: "+1 to Hit", hasInput: false, combiCategory: "flat_mods" },
    "hit_minus_1": { name: "-1 to Hit", hasInput: false, combiCategory: null },
    "wound_plus_1": { name: "+1 to Wound", hasInput: false, combiCategory: "flat_mods" },
    "wound_minus_1": { name: "-1 to Wound", hasInput: false, combiCategory: null },
    "extra_ap_1": { name: "AP +1", hasInput: false, combiCategory: "flat_mods" },

    "reroll_hits_1": { name: "Reroll 1s (Hit)", hasInput: false, combiCategory: "rerolls" },
    "reroll_hits_all": { name: "Reroll All (Hit)", hasInput: false, combiCategory: "rerolls" },
    "reroll_one_hit": { name: "Reroll 1 Hit Roll", hasInput: false, combiCategory: "rerolls" },
    "reroll_wounds_1": { name: "Reroll 1s (Wound)", hasInput: false, combiCategory: "rerolls" },
    "reroll_wounds_all": { name: "Reroll All (Wound)", hasInput: false, combiCategory: "rerolls" },
    "reroll_one_wound": { name: "Reroll 1 Wound Roll", hasInput: false, combiCategory: "rerolls" },
    "fish_crits": { name: "Fish for Crits", hasInput: false, combiCategory: "rerolls" },
    "reroll_damage": { name: "Reroll Damage (1-2)", hasInput: false, combiCategory: "rerolls" },
    "reroll_one_damage": { name: "Reroll 1 Dmg Roll", hasInput: false, combiCategory: "rerolls" }
};

// ui labels for combi categories
export const CombiCategoryTitles = {
    "weapon_rules": "Weapon Rules",
    "flat_mods": "Flat Modifiers",
    "rerolls": "Reroll Rules"
};

//#endregion