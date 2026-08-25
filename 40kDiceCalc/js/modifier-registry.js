//#region registry config >>>>>>>>>>>>>>>>>>>>>>>

// unified dictionary for all game modifiers
export const ModifierRegistry = {
    // modifier-registry.js

    "lethal": {
        name: "Lethal Hits",
        hasInput: false,
        combiCategory: "weapon_rules",
        // applies lethal hits
        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.lethal = true;
        },
        // skips if weapon already has lethal hits
        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.lethal === true) return "applied";
            }
            return false;
        }
    },
    "devastating": {
        name: "Devastating Wounds",
        hasInput: false,
        combiCategory: "weapon_rules",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.devastating = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.devastating === true) return "applied";
            }
            return false;
        }
    },
    "sustained": {
        name: "Sustained Hits",
        hasInput: true,
        defaultVal: 1,
        combiCategory: "weapon_rules",
        // sets sustained hits to at least 1
        applyEffect: (weapon, targetUnit) => {
            if (weapon.modifiers.sustained === 0) weapon.modifiers.sustained = 1;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.sustained > 0) return "applied";
            }
            return false;
        }
    },
    "lance": {
        name: "Lance",
        hasInput: false,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.lance = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.lance === true) return "applied";
            }
            return false;
        }
    },
    "torrent": {
        name: "Torrent",
        hasInput: false,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.torrent = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.torrent === true) return "applied";
            }
            return false;
        }
    },
    "twinlinked": {
        name: "Twin-Linked",
        hasInput: false,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.twinLinked = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.twinLinked === true) return "applied";
            }
            return false;
        }
    },
    "blast": {
        name: "Blast",
        hasInput: false,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.blast = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.blast === true) return "applied";
            }
            return false;
        }
    },
    "cleave": {
        name: "Cleave",
        hasInput: false,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.cleave = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.cleave === true) return "applied";
            }
            return false;
        }
    },
    "melta": {
        name: "Melta",
        hasInput: true,
        defaultVal: 2,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            if (weapon.modifiers.melta === 0) weapon.modifiers.melta = 2;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.melta > 0) return "applied";
            }
            return false;
        }
    },
    "anti": {
        name: "Anti-X",
        hasInput: true,
        defaultVal: 4,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            if (weapon.modifiers.anti === 0) weapon.modifiers.anti = 4;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.anti > 0) return "applied";
            }
            return false;
        }
    },
    "rapidfire": {
        name: "Rapid Fire",
        hasInput: true,
        defaultVal: 1,
        combiCategory: null,

        applyEffect: (weapon, targetUnit) => {
            if (weapon.modifiers.rapidFire === 0) weapon.modifiers.rapidFire = 1;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rapidFire > 0) return "applied";
            }
            return false;
        }
    },

    // modifier registry flat mods

    "hit_plus_1": {
        name: "+1 to Hit",
        hasInput: false,
        combiCategory: "flat_mods",
        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.hitMod += 1;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.hitMod > 0) return "applied";
                let effectiveBs = parseInt(w.BsWs) - w.modifiers.hitMod;
                if (effectiveBs <= 2) return "ineffective";
            }
            return false;
        }
    },
    "hit_minus_1": {
        name: "-1 to Hit",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.minusOneHit = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.minusOneHit) return "applied";
            return false;
        }
    },
    "wound_plus_1": {
        name: "+1 to Wound",
        hasInput: false,
        combiCategory: "flat_mods",
        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.woundMod += 1;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.woundMod > 0) return "applied";

                let baseWoundTarget = 5;
                if (w.strength >= targetUnit.toughness * 2) baseWoundTarget = 2;
                else if (w.strength > targetUnit.toughness) baseWoundTarget = 3;
                else if (w.strength === targetUnit.toughness) baseWoundTarget = 4;
                else if (w.strength <= targetUnit.toughness / 2) baseWoundTarget = 6;

                let effectiveWound = baseWoundTarget - w.modifiers.woundMod;

                if (targetUnit.modifiers.minusOneWound) effectiveWound += 1;
                if (targetUnit.modifiers.minusOneWoundHighStr && w.strength > targetUnit.toughness) effectiveWound += 1;
                if (w.modifiers.lance) effectiveWound -= 1;

                if (effectiveWound <= 2) return "ineffective";
            }
            return false;
        }
    },
    "wound_minus_1": {
        name: "-1 to Wound",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.minusOneWound = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.minusOneWound) return "applied";
            return false;
        }
    },
    "damage_plus_1": {
        name: "+1 Damage",
        hasInput: false,
        combiCategory: "flat_mods",
        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.damageMod += 1;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.damageMod > 0) return "applied";
            }
            return false;
        }
    },
    "extra_ap_1": {
        name: "AP +1",
        hasInput: false,
        combiCategory: "flat_mods",
        applyEffect: (weapon, targetUnit) => {
            weapon.Ap -= 1;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            return false;
        }
    },

    // modifier registry rerolls

    "reroll_hits_1": {
        name: "Reroll 1s (Hit)",
        hasInput: false,
        combiCategory: "rerolls",
        // sets hit rerolls to ones
        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollHits = "ones";
        },
        // skips if already rerolling ones or all
        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollHits === "ones" || w.modifiers.rerollHits === "all") return "applied";
            }
            return false;
        }
    },
    "reroll_hits_all": {
        name: "Reroll All (Hit)",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollHits = "all";
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollHits === "all") return "applied";
            }
            return false;
        }
    },
    "reroll_one_hit": {
        name: "Reroll 1 Hit Roll",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollOneHit = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollOneHit || w.modifiers.rerollHits === "all") return "applied";
            }
            return false;
        }
    },
    "reroll_wounds_1": {
        name: "Reroll 1s (Wound)",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollWounds = "ones";
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollWounds === "ones" || w.modifiers.rerollWounds === "all" || w.modifiers.twinLinked) return "applied";
            }
            return false;
        }
    },
    "reroll_wounds_all": {
        name: "Reroll All (Wound)",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollWounds = "all";
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollWounds === "all" || w.modifiers.twinLinked) return "applied";
            }
            return false;
        }
    },
    "reroll_one_wound": {
        name: "Reroll 1 Wound Roll",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollOneWound = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollOneWound || w.modifiers.rerollWounds === "all" || w.modifiers.twinLinked) return "applied";
            }
            return false;
        }
    },
    "fish_crits": {
        name: "Fish for Crits",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.fishForCrits = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.fishForCrits) return "applied";
            }
            return false;
        }
    },
    "reroll_damage": {
        name: "Reroll Damage 1 to 2",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollDamage = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollDamage) return "applied";

                let rawDam = w.damage;
                let parsedDam = parseInt(rawDam, 10);
                let isFlatDamage = !isNaN(parsedDam) && String(parsedDam) === String(rawDam).trim();

                if (isFlatDamage) return "ineffective";
            }
            return false;
        }
    },
    "reroll_one_damage": {
        name: "Reroll 1 Dmg Roll",
        hasInput: false,
        combiCategory: "rerolls",

        applyEffect: (weapon, targetUnit) => {
            weapon.modifiers.rerollOneDamage = true;
        },

        checkRedundancy: (weaponsArray, targetUnit) => {
            for (const w of weaponsArray) {
                if (w.modifiers.rerollOneDamage || w.modifiers.rerollDamage) return "applied";

                let rawDam = w.damage;
                let parsedDam = parseInt(rawDam, 10);
                let isFlatDamage = !isNaN(parsedDam) && String(parsedDam) === String(rawDam).trim();

                if (isFlatDamage) return "ineffective";
            }
            return false;
        }
    },
    // modifier-registry.js - Add to the very bottom, inside the registry object

    "SgT_wound_minus_1": {
        name: "S>T -1 Wound",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.minusOneWoundHighStr = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.minusOneWoundHighStr) return "applied";
            if (targetUnit.toughness >= weaponsArray[0].strength) return "ineffective";
            return false;
        }
    },
    "cover": {
        name: "Cover",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.cover = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.cover) return "applied";
            return false;
        }
    },
    "damage_minus_1": {
        name: "-1 Damage",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.minusOneDamage = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.minusOneDamage) return "applied";

            let rawDam = weaponsArray[0].damage;
            let parsedDam = parseInt(rawDam, 10);
            let isFlatDamage = !isNaN(parsedDam) && String(parsedDam) === String(rawDam).trim();

            if (isFlatDamage && parsedDam <= 1) return "ineffective";
            return false;
        }
    },
    "damage_half": {
        name: "Half Damage",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.halfDamage = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.halfDamage) return "applied";

            let rawDam = weaponsArray[0].damage;
            let parsedDam = parseInt(rawDam, 10);
            let isFlatDamage = !isNaN(parsedDam) && String(parsedDam) === String(rawDam).trim();

            if (isFlatDamage) {
                if (parsedDam <= 1) return "ineffective";

                let halfDmg = Math.ceil(parsedDam / 2);
                let minusOneDmg = Math.max(1, parsedDam - 1);

                // check for half damage vs -1 damage
                if (halfDmg === minusOneDmg) return "ineffective";
            }
            return false;
        }
    },
    "FNP": {
        name: "Feel No Pain 5+",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.fnp = 5;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.fnp > 0) return "applied";
            return false;
        }
    },
    "plus_1_save": {
        name: "+1 Save",
        hasInput: false,
        combiCategory: null,
        applyEffect: (weapon, targetUnit) => {
            targetUnit.modifiers.plusOneSave = true;
        },
        checkRedundancy: (weaponsArray, targetUnit) => {
            if (targetUnit.modifiers.plusOneSave) return "applied";
            if (weaponsArray[0].Ap >= 0 && targetUnit.save <= 3) return "ineffective";
            return false;
        }
    }

};

// ui labels for combi categories
export const CombiCategoryTitles = {
    "weapon_rules": "Weapon Rules",
    "flat_mods": "Flat Modifiers",
    "rerolls": "Reroll Rules"
};

//#endregion