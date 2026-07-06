import { Dice } from './classes/Dice.js';

export function runSimulation(iterationsTotal, weaponsArray, unit) {
    let sumTotalDamage = 0;
    let sumModelsKilled = 0;
    let sumWastedDamage = 0;

    const allTotalDamage = [];
    const allModelsKilled = [];
    const allWastedDamage = [];


    //these are needed for adv sims
    let sumHits = { rawSuccesses: 0, bonusHits: 0, autoWounds: 0 };
    let sumWounds = { rawSuccesses: 0, devWounds: 0 };
    let sumSaves = { normalWoundsToSave: 0, devWoundsBypass: 0 };

    for (let i = 0; i < iterationsTotal; i++) {
        let currentTargetHealth = unit.wounds;
        let runTotalDamage = 0;
        let runModelsKilled = 0;
        let runWastedDamage = 0;



        for (const weapon of weaponsArray) {
            const hurtSystem = runHurtSystem(weapon, unit, currentTargetHealth);
            runTotalDamage += hurtSystem.totalDamage;
            runModelsKilled += hurtSystem.modelsKilled;
            runWastedDamage += hurtSystem.wastedDamage;
            currentTargetHealth = hurtSystem.finalHealth;

            //these are needed for adv sims
            sumHits.rawSuccesses += hurtSystem.hits.rawSuccesses;
            sumHits.bonusHits += hurtSystem.hits.bonusHits;
            sumHits.autoWounds += hurtSystem.hits.autoWounds;

            sumWounds.rawSuccesses += hurtSystem.wounds.rawSuccesses;
            sumWounds.devWounds += hurtSystem.wounds.devWounds;

            sumSaves.normalWoundsToSave += hurtSystem.wounds.rawSuccesses;
            sumSaves.devWoundsBypass += hurtSystem.wounds.devWounds;


        }

        allTotalDamage.push(runTotalDamage);
        allModelsKilled.push(runModelsKilled);
        allWastedDamage.push(runWastedDamage);

        sumTotalDamage += runTotalDamage;
        sumModelsKilled += runModelsKilled;
        sumWastedDamage += runWastedDamage;
    }

    const avgTotalDamage = sumTotalDamage / iterationsTotal;
    const avgModelsKilled = sumModelsKilled / iterationsTotal;
    const avgWastedDamage = sumWastedDamage / iterationsTotal;

    const damageDistribution = {};
    for (const dmg of allTotalDamage) {
        damageDistribution[dmg] = (damageDistribution[dmg] || 0) + 1;
    }

    return {
        SimulatedRuns: iterationsTotal,
        totals: { sumHits, sumWounds, sumSaves },
        averages: {
            damage: avgTotalDamage,
            killed: avgModelsKilled,
            wasted: avgWastedDamage,
            efficiency: avgTotalDamage > 0 ? (((avgTotalDamage - avgWastedDamage) / avgTotalDamage) * 100).toFixed(1) : 0
        },
        extremes: {
            highestDamage: Math.max(...allTotalDamage),
            highestKills: Math.max(...allModelsKilled),
            lowestDamage: Math.min(...allTotalDamage),
            lowestKilled: Math.min(...allModelsKilled)
        },
        distribution: damageDistribution
    };
}

export function runHurtSystem(weapon, unit, startingHealth) {
    const totalAttacks = calculateAttacks(weapon, unit);
    let autoWounds = 0;
    let successfulHits = 0;
    let hitData = { successes: 0, bonus: 0 };
    // 2. Hit Phase
    if (weapon.modifiers.torrent || weapon.BsWs === "NA") {
        successfulHits = totalAttacks;
    } else {
        const finalHitMod = weapon.modifiers.hitMod + (unit.modifiers.minusOneHit ? -1 : 0);
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
            isLethalOrDev: weapon.modifiers.lethal
        });

        autoWounds = hitData.autos;
        successfulHits = hitData.successes + hitData.bonus;
    }

    if (successfulHits === 0 && autoWounds === 0) return zeroReturn(startingHealth);

    // 3. Wound Phase
    const baseWoundTarget = calculateWoundTarget(weapon.strength, unit.toughness);

    let targetWoundMod = unit.modifiers.minusOneWound ? -1 : 0;
    if (unit.modifiers.minusOneWoundHighStr && weapon.strength > unit.toughness) targetWoundMod -= 1;
    let finalWoundMod = weapon.modifiers.woundMod + targetWoundMod;
    if (weapon.modifiers.lance) finalWoundMod += 1;

    const activeCritWound = weapon.modifiers.anti > 0 ? weapon.modifiers.anti : weapon.modifiers.critWoundThreshold;

    const woundData = Dice.rollPool({
        poolSize: successfulHits,
        target: baseWoundTarget,
        modifier: finalWoundMod,
        rerollRule: (weapon.modifiers.twinLinked || weapon.modifiers.rerollWounds === "all") ? "all" : weapon.modifiers.rerollWounds,
        critThreshold: activeCritWound,
        sustained: 0,
        isLethalOrDev: weapon.modifiers.devastating
    });

    const normalWounds = woundData.successes + autoWounds;
    const devWounds = woundData.autos;

    if (normalWounds === 0 && devWounds === 0) return zeroReturn(startingHealth);

    // 4. Save Phase
    let failedSavesCount = 0;
    if (normalWounds > 0) {
        const apApplied = unit.save - weapon.Ap;
        const bestSave = unit.inVul ? Math.min(apApplied, unit.inVul) : apApplied;

        const saveRolls = Dice.rollRaw(normalWounds);
        for (const die of saveRolls) {
            if (die === 1 || die < bestSave) failedSavesCount++;
        }
    }

    const totalDamageEvents = failedSavesCount + devWounds;
    if (totalDamageEvents === 0) return zeroReturn(startingHealth);

    // 5. Damage Phase
    const damageDone = modelsKill(totalDamageEvents, weapon, unit, startingHealth);

    return {
        hits: {
            rawSuccesses: hitData.successes,
            bonusHits: hitData.bonus,
            autoWounds: autoWounds
        },
        wounds: {
            rawSuccesses: woundData.successes,
            devWounds: devWounds
        },
        damage: {
            totalDamage: damageDone.totalDamage,
            modelsKilled: damageDone.modelsKilled,
            wastedDamage: damageDone.wastedDamage
        },
        finalHealth: damageDone.currentHealth
    };
}

// --- HELPER FUNCTIONS ---

function zeroReturn(health) {
    return { totalDamage: 0, modelsKilled: 0, wastedDamage: 0, finalHealth: health };
}

function calculateAttacks(weapon, unit) {
    let baseAttacks = weapon.attack;
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

// Resolves variable damage like "D3", "D6+2", "2D6"
function resolveDamage(damageString) {
    let str = String(damageString).toUpperCase().replace(/\s/g, '');
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    let total = 0;
    const diceRegex = /(\d*)D(\d+)/g;
    let match;
    while ((match = diceRegex.exec(str)) !== null) {
        let numDice = match[1] === "" ? 1 : parseInt(match[1], 10);
        let sides = parseInt(match[2], 10);
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * sides) + 1;
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
        let baseDmg = resolveDamage(weapon.damage);
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