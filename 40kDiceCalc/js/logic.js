// contains the core math, dice rolling formulas, and simulation rules.

import { Dice } from './classes/Dice.js';

export function runSimulation(iterationsTotal, weaponsArray, unit) {
    let sumTotalDamage = 0, sumModelsKilled = 0, sumWastedDamage = 0;
    const allTotalDamage = [], allModelsKilled = [], allWastedDamage = [];

    // we need distributions for our advanced graphs
    const hitDistribution = {};
    const woundDistribution = {};
    const saveDistribution = {};

    let sumHits = { rawSuccesses: 0, bonusHits: 0, autoWounds: 0 };
    let sumWounds = { rawSuccesses: 0, devWounds: 0, normalWounds: 0 };
    let sumSaves = { failedSavesCount: 0, passedSavesCount: 0 };

    let highestDamage = 0;
    let highestKills = 0;
    let lowestDamage = Infinity; // starts infinitely high
    let lowestKilled = Infinity;

    for (let i = 0; i < iterationsTotal; i++) {
        let currentTargetHealth = unit.wounds;
        let runTotalDamage = 0, runModelsKilled = 0, runWastedDamage = 0;

        // track totals for THIS specific run
        let runTotalHits = 0, runTotalWounds = 0, runTotalSaves = 0;

        for (const weapon of weaponsArray) {
            const hurtSystem = runHurtSystem(weapon, unit, currentTargetHealth);

            runTotalDamage += hurtSystem.damage.totalDamage;
            runModelsKilled += hurtSystem.damage.modelsKilled;
            runWastedDamage += hurtSystem.damage.wastedDamage;
            currentTargetHealth = hurtSystem.finalHealth;

            // adv sim aggregations
            sumHits.rawSuccesses += hurtSystem.hits.rawSuccesses;
            sumHits.bonusHits += hurtSystem.hits.bonusHits;
            sumHits.autoWounds += hurtSystem.hits.autoWounds;
            sumWounds.rawSuccesses += hurtSystem.wounds.rawSuccesses;
            sumWounds.devWounds += hurtSystem.wounds.devWounds;
            sumWounds.normalWounds += hurtSystem.wounds.normalWounds;
            sumSaves.failedSavesCount += hurtSystem.saves.failedSavesCount;
            sumSaves.passedSavesCount += (hurtSystem.wounds.normalWounds - hurtSystem.saves.failedSavesCount);

            // X-Axis Data collection for this specific iteration
            // hits: normal hits + sustained bonus + lethal 6s
            runTotalHits += (hurtSystem.hits.rawSuccesses + hurtSystem.hits.bonusHits + hurtSystem.hits.autoWounds);
            // wounds: normal wounds + devastating 6s + lethal 6s that bypassed the roll
            runTotalWounds += (hurtSystem.wounds.rawSuccesses + hurtSystem.wounds.devWounds + hurtSystem.hits.autoWounds);
            // saves: normal wounds done - failed saves gives you successful saves
            runTotalSaves += (hurtSystem.wounds.normalWounds - hurtSystem.saves.failedSavesCount);
        }

        // Build the bell curves
        hitDistribution[runTotalHits] = (hitDistribution[runTotalHits] || 0) + 1;
        woundDistribution[runTotalWounds] = (woundDistribution[runTotalWounds] || 0) + 1;
        saveDistribution[runTotalSaves] = (saveDistribution[runTotalSaves] || 0) + 1;

        allTotalDamage.push(runTotalDamage);
        allModelsKilled.push(runModelsKilled);
        allWastedDamage.push(runWastedDamage);

        sumTotalDamage += runTotalDamage;
        sumModelsKilled += runModelsKilled;
        sumWastedDamage += runWastedDamage;

        if (highestDamage < runTotalDamage) highestDamage = runTotalDamage;
        if (highestKills < runModelsKilled) highestKills = runModelsKilled;
        if (lowestDamage > runTotalDamage) lowestDamage = runTotalDamage;
        if (lowestKilled > runModelsKilled) lowestKilled = runModelsKilled;
    }

    const avgTotalDamage = sumTotalDamage / iterationsTotal;
    const avgModelsKilled = sumModelsKilled / iterationsTotal;
    const avgWastedDamage = sumWastedDamage / iterationsTotal;

    const damageDistribution = {};
    for (const dmg of allTotalDamage) {
        damageDistribution[dmg] = (damageDistribution[dmg] || 0) + 1;
    }
    const killedDistribution = {};
    for (const killed of allModelsKilled) {
        killedDistribution[killed] = (killedDistribution[killed] || 0) + 1;
    }

    return {
        SimulatedRuns: iterationsTotal,
        totals: { sumHits, sumWounds, sumSaves },
        hitDistribution,
        woundDistribution,
        saveDistribution,
        averages: {
            damage: avgTotalDamage,
            killed: avgModelsKilled,
            wasted: avgWastedDamage,
            efficiency: avgTotalDamage > 0 ? (((avgTotalDamage - avgWastedDamage) / avgTotalDamage) * 100).toFixed(1) : 0,
            hits_success: sumHits.rawSuccesses / iterationsTotal,
            hits_bonus: sumHits.bonusHits / iterationsTotal,
            hits_auto: sumHits.autoWounds / iterationsTotal,
            wounds_success: sumWounds.rawSuccesses / iterationsTotal,
            wounds_dev: sumWounds.devWounds / iterationsTotal,
            saves_forced: sumWounds.normalWounds / iterationsTotal,
            saves_passed: sumSaves.passedSavesCount / iterationsTotal,
            saves_failed: sumSaves.failedSavesCount / iterationsTotal
        },
        extremes: {
            highestDamage: highestDamage,
            highestKills: highestKills,
            lowestDamage: lowestDamage,
            lowestKilled: lowestKilled
        },
        damageDistribution: damageDistribution,
        killedDistribution: killedDistribution

    };
}

export function runHurtSystem(weapon, unit, startingHealth) {
    const totalAttacks = calculateAttacks(weapon, unit);

    console.log(`Weapons array ${weapon}`);
    console.log(`Target units array ${unit}`);
    let autoWounds = 0;
    let successfulHits = 0;
    let hitData = { successes: 0, bonus: 0 };

    // Hit Phase
    if (weapon.modifiers.torrent || weapon.BsWs === "NA") {
        successfulHits = totalAttacks;
    } else {
        let rawHitMod = weapon.modifiers.hitMod + (unit.modifiers.minusOneHit ? -1 : 0);
        const finalHitMod = Math.max(-1, Math.min(1, rawHitMod));

        let activeBsWs = parseInt(weapon.BsWs, 10);
        if (unit.modifiers.cover && activeBsWs !== "NA") {
            activeBsWs += 1;
        }

        hitData = Dice.rollPool({
            poolSize: totalAttacks,
            target: activeBsWs,
            modifier: finalHitMod,
            rerollRule: weapon.modifiers.rerollHits,
            critThreshold: weapon.modifiers.critHitThreshold,
            sustained: weapon.modifiers.sustained,
            isLethalOrDev: weapon.modifiers.lethal,
            fishForCrits: weapon.modifiers.fishForCrits
        });

        autoWounds = hitData.autos;
        successfulHits = hitData.successes + hitData.bonus;
    }

    // early return
    if (successfulHits === 0 && autoWounds === 0) {
        return {
            hits: { rawSuccesses: 0, bonusHits: 0, autoWounds: 0 },
            wounds: { rawSuccesses: 0, devWounds: 0, normalWounds: 0 },
            saves: { failedSavesCount: 0 },
            damage: { totalDamage: 0, modelsKilled: 0, wastedDamage: 0 },
            finalHealth: startingHealth
        };
    }

    // Wound Phase
    const baseWoundTarget = calculateWoundTarget(weapon.strength, unit.toughness);

    let targetWoundMod = unit.modifiers.minusOneWound ? -1 : 0;
    if (unit.modifiers.minusOneWoundHighStr && weapon.strength > unit.toughness) targetWoundMod -= 1;
    let rawWoundMod = weapon.modifiers.woundMod + targetWoundMod;
    if (weapon.modifiers.lance) rawWoundMod += 1;

    const finalWoundMod = Math.max(-1, Math.min(1, rawWoundMod));

    const activeCritWound = weapon.modifiers.anti > 0 ? weapon.modifiers.anti : weapon.modifiers.critWoundThreshold;

    const woundData = Dice.rollPool({
        poolSize: successfulHits,
        target: baseWoundTarget,
        modifier: finalWoundMod,
        rerollRule: (weapon.modifiers.twinLinked || weapon.modifiers.rerollWounds === "all") ? "all" : weapon.modifiers.rerollWounds,
        critThreshold: activeCritWound,
        sustained: 0,
        isLethalOrDev: weapon.modifiers.devastating,
        fishForCrits: weapon.modifiers.fishForCrits
    });

    const normalWounds = woundData.successes + autoWounds;
    const devWounds = woundData.autos;

    //early return
    if (normalWounds === 0 && devWounds === 0) {
        return {
            hits: { rawSuccesses: hitData.successes, bonusHits: hitData.bonus, autoWounds: autoWounds },
            wounds: { rawSuccesses: 0, devWounds: 0, normalWounds: 0 },
            saves: { failedSavesCount: 0 },
            damage: { totalDamage: 0, modelsKilled: 0, wastedDamage: 0 },
            finalHealth: startingHealth
        };
    }

    // Save Phase
    let failedSavesCount = 0;
    if (normalWounds > 0) {
        const apApplied = unit.save - weapon.Ap - (unit.modifiers.plusOneSave ? 1 : 0);
        const bestSave = unit.inVul ? Math.min(apApplied, unit.inVul) : apApplied;

        const saveRolls = Dice.rollRaw(normalWounds);
        for (const die of saveRolls) {
            if (die === 1 || die < bestSave) failedSavesCount++;
        }
    }

    //early return
    const totalDamageEvents = failedSavesCount + devWounds;
    if (totalDamageEvents === 0) {
        return {
            hits: { rawSuccesses: hitData.successes, bonusHits: hitData.bonus, autoWounds: autoWounds },
            wounds: { rawSuccesses: woundData.successes, devWounds: devWounds, normalWounds: normalWounds },
            saves: { failedSavesCount: failedSavesCount },
            damage: { totalDamage: 0, modelsKilled: 0, wastedDamage: 0 },
            finalHealth: startingHealth
        };
    }

    // Damage Phase
    const damageDone = modelsKill(totalDamageEvents, weapon, unit, startingHealth);

    return {
        hits: {
            rawSuccesses: hitData.successes,
            bonusHits: hitData.bonus,
            autoWounds: autoWounds
        },
        wounds: {
            rawSuccesses: woundData.successes,
            devWounds: devWounds,
            normalWounds: normalWounds
        }, saves: {
            failedSavesCount: failedSavesCount
        },
        damage: {
            totalDamage: damageDone.totalDamage,
            modelsKilled: damageDone.modelsKilled,
            wastedDamage: damageDone.wastedDamage
        },
        finalHealth: damageDone.currentHealth
    };
}

// helper functions>>>>>>>
function calculateAttacks(weapon, unit) {
    let baseAttacks = resolveDamage(weapon.attack); //reusing function for variable damage here
    if (weapon.modifiers.blast || weapon.modifiers.cleave) {
        baseAttacks += Math.floor(unit.modelCount / 5);
    } else if (weapon.modifiers.rapidFire) {
        baseAttacks += weapon.modifiers.rapidFire;
    }
    return baseAttacks * weapon.modelCount * weapon.unitCount;
}

function calculateWoundTarget(strength, toughness) {
    if (strength >= toughness * 2) return 2;
    if (strength > toughness) return 3;
    if (strength === toughness) return 4;
    if (strength <= toughness / 2) return 6;
    return 5;
}

// variable damage like "D3", "D6+2", "2D6"
function resolveDamage(damageString, shouldReroll = false) {
    let str = String(damageString).toUpperCase().replace(/\s/g, '');
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    let total = 0;
    const diceRegex = /(\d*)D(\d+)/g;
    let match;
    while ((match = diceRegex.exec(str)) !== null) {
        let numDice = match[1] === "" ? 1 : parseInt(match[1], 10);
        let sides = parseInt(match[2], 10);
        for (let i = 0; i < numDice; i++) {
            let roll = Math.floor(Math.random() * sides) + 1;
            if (shouldReroll && (roll === 1 || roll === 2)) {
                roll = Math.floor(Math.random() * sides) + 1;
            }
            total += roll;
        }
    }
    let flatModsStr = str.replace(/(\d*)D(\d+)/g, '');
    const flatRegex = /([+-]\d+)/g;
    let flatMatch;
    while ((flatMatch = flatRegex.exec(flatModsStr)) !== null) {
        total += parseInt(flatMatch[1], 10);
    }
    return Math.max(1, total);
}

function modelsKill(damageEvents, weapon, unit, startingHealth) {
    let modelsKilledCount = 0;
    let wastedDamage = 0;
    let currentHealth = startingHealth;
    let totalActualDamageTaken = 0;

    for (let i = 0; i < damageEvents; i++) {
        let baseDmg = resolveDamage(weapon.damage, weapon.modifiers.rerollDamage);
        let dmgInstance = baseDmg + (weapon.modifiers.melta || 0);

        if (unit.modifiers.halfDamage) dmgInstance = Math.ceil(dmgInstance / 2);
        if (unit.modifiers.minusOneDamage) dmgInstance -= 1;

        dmgInstance = Math.max(1, dmgInstance);

        if (unit.fnp && unit.fnp > 1) {
            let unpreventedDamage = 0;
            const fnpRolls = Dice.rollRaw(dmgInstance);
            for (const die of fnpRolls) {
                if (die < unit.fnp) unpreventedDamage++;
            }
            dmgInstance = unpreventedDamage;
        }

        if (dmgInstance === 0) continue;

        totalActualDamageTaken += dmgInstance;
        currentHealth -= dmgInstance;

        if (currentHealth <= 0) {
            modelsKilledCount++;
            wastedDamage += Math.abs(currentHealth);
            currentHealth = unit.wounds;
        }
    }

    return { totalDamage: totalActualDamageTaken, modelsKilled: modelsKilledCount, wastedDamage, currentHealth };
}