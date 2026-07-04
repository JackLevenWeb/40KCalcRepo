export function runSimulation(iterationsTotal, weapon, unit) {

    //Running Totals
    let sumTotalDamage = 0;
    let sumModelsKilled = 0;
    let sumWastedDamage = 0;


    //below arrays used for aggregation
    //The Historical Records
    const allTotalDamage = [];
    const allModelsKilled = [];
    const allWastedDamage = [];


    for (let i = 0; i < iterationsTotal; i++) {

        const hurtSystem = runHurtSystem(weapon, unit);

        allTotalDamage.push(hurtSystem.totalDamage);
        allModelsKilled.push(hurtSystem.modelsKilled);
        allWastedDamage.push(hurtSystem.wastedDamage);

        sumModelsKilled += hurtSystem.modelsKilled;
        sumTotalDamage += hurtSystem.totalDamage;
        sumWastedDamage += hurtSystem.wastedDamage;


    }

    //avgs
    const avgTotalDamage = sumTotalDamage / iterationsTotal;
    const avgModelsKilled = sumModelsKilled / iterationsTotal;
    const avgWastedDamage = sumWastedDamage / iterationsTotal;


    let efficiencyPercent = 0;
    if (avgTotalDamage > 0) {
        efficiencyPercent = ((avgTotalDamage - avgWastedDamage) / avgTotalDamage) * 100;
    }

    //min - max
    const maxDamage = Math.max(...allTotalDamage);
    const maxKilled = Math.max(...allModelsKilled);
    const minDamage = Math.min(...allTotalDamage);
    const minKilled = Math.min(...allModelsKilled);

    return {
        SimulatedRuns: iterationsTotal,
        averages: {
            damage: avgTotalDamage,
            killed: avgModelsKilled,
            wasted: avgWastedDamage,
            efficiency: efficiencyPercent.toFixed(1)
        },
        extremes: {
            highestDamage: maxDamage,
            highestKills: maxKilled,
            lowestDamage: minDamage,
            lowestKilled: minKilled

        },
        history: {
            allTotalDamage,
            allModelsKilled

        }

    }





}




export function runHurtSystem(weapon, unit) {


    const totalAttacks = weapon.attack * weapon.modelCount;
    const hitRoll = rollDiceRecursive(totalAttacks, []);

    // Modifiers (Placeholders for now)
    const hitModifier = 0;
    const woundModifier = 0;
    const damageModifier = 0;
    const specialModifier = "Normal Damage";

    // 2. Hit Phase
    const hits = evaluateHits(hitRoll, weapon.BsWs, hitModifier);
    const successfulHits = hits.successes.length;

    // If no hits, return the Master Object with zeros
    if (successfulHits === 0) {
        return {
            attacks: totalAttacks,
            hits: 0,
            wounds: 0,
            failedSaves: 0,
            totalDamage: 0,
            modelsKilled: 0,
            wastedDamage: 0
        };
    }

    // 3. Wound Phase
    const woundTarget = calculateWoundTarget(weapon.strength, unit.toughness);
    const woundRoll = rollDiceRecursive(successfulHits, []);
    const wounds = eveluateWounds(woundRoll, woundTarget, woundModifier);
    const successfulWounds = wounds.successes.length;

    // If no wounds, return early with zeros
    if (successfulWounds === 0) {
        return {
            attacks: totalAttacks,
            hits: successfulHits,
            wounds: 0,
            failedSaves: 0,
            totalDamage: 0,
            modelsKilled: 0,
            wastedDamage: 0
        };
    }


    // 4. Save Phase
    const saveRoll = rollDiceRecursive(successfulWounds, []);
    // Note: ensure your evaluateSaves function uses unit.save, weapon.ap, unit.invul
    const saves = eveluateSaves(saveRoll, unit.save, weapon.ap, unit.invul);
    const failedSavesCount = saves.fails.length;

    // SPEED BOOST 3: If they saved everything, return early!
    if (failedSavesCount === 0) {
        return {
            attacks: totalAttacks,
            hits: successfulHits,
            wounds: successfulWounds,
            failedSaves: 0,
            totalDamage: 0,
            modelsKilled: 0,
            wastedDamage: 0
        };
    }

    // 5. Damage Phase
    const damageDone = modelsKill(saves.fails, weapon.damage, unit.wounds, damageModifier, specialModifier);

    // 6. MASTER RETURN
    return {
        attacks: totalAttacks,
        hits: successfulHits,
        wounds: successfulWounds,
        failedSaves: failedSavesCount,
        totalDamage: damageDone.totalDamage,
        modelsKilled: damageDone.modelsKilled,
        wastedDamage: damageDone.wastedDamage
    };

}



//intial rolls
function rollDiceRecursive(numberOfDice, results = []) {

    if (numberOfDice === 0) {

        return results;
    } else {

        const roll = Math.floor(Math.random() * 6) + 1;

        results.push(roll);
        const currentDice = numberOfDice - 1;
        return rollDiceRecursive(currentDice, results);

    }


}

//check and modifiy hits
function evaluateHits(results, toHit, hitModifier) {
    const successfulHits = [];
    const failedHits = [];


    for (const die of results) {
        if (die === 1) {
            failedHits.push(die);

        } else if (die === 6) {
            successfulHits.push(die);

        } else {

            const modDie = hitModifier ? die + hitModifier : die;
            if (modDie >= toHit) {
                successfulHits.push(modDie);

            } else {
                failedHits.push(modDie);

            }



        }


    }
    return { successes: successfulHits, fails: failedHits };



}

//find wound target number
function calculateWoundTarget(strength, toughness) {

    if (strength >= toughness * 2) return 2;
    if (strength > toughness) return 3;
    if (strength === toughness) return 4;
    if (strength <= toughness / 2) return 6;
    return 5;



}


function eveluateWounds(results, woundTarget, woundModifier) {
    const successfulWounds = [];
    const failedWounds = [];

    for (const die of results) {

        if (die === 1) {
            failedWounds.push(die);

        } else if (die === 6) {
            successfulWounds.push(die);

        } else {
            const modDie = woundModifier ? die + woundModifier : die;
            if (modDie >= woundTarget) {
                successfulWounds.push(die);


            } else {
                failedWounds.push(die);
            }
        }

    }

    return { successes: successfulWounds, fails: failedWounds };

}



function eveluateSaves(results, saveTarget, ap, invul) {
    const successfulSaves = [];
    const failedSaves = [];


    const apApplied = saveTarget - ap;

    const bestSave = invul ? Math.min(apApplied, invul) : apApplied;


    for (const die of results) {
        if (die === 1) {

            failedSaves.push(die);
        } else if (die >= bestSave) {

            successfulSaves.push(die);
        } else {
            failedSaves.push(die);
        }
    }

    return { successes: successfulSaves, fails: failedSaves };

}



function modelsKill(failedSaves, weaponDamge, modelWounds, damageModifier, specialModifier) {

    let finalDamage = weaponDamge;

    if (damageModifier !== 0) {
        finalDamage += damageModifier;
    }

    if (specialModifier === "Half Damage") {
        finalDamage = finalDamage / 2;
    }

    // Round up fractions AFTER all math is complete
    finalDamage = Math.ceil(finalDamage);

    // The Minimum 1 Rule (Damage can never be 0 or negative)
    finalDamage = Math.max(1, finalDamage);

    let modelsKilledCount = 0;
    let wastedDamage = 0;
    let currentModelHealth = modelWounds;

    for (let i = 0; i < failedSaves.length; i++) {





        currentModelHealth -= finalDamage;

        // Did the model die?
        if (currentModelHealth <= 0) {
            modelsKilledCount++;
            wastedDamage += Math.abs(currentModelHealth);
            currentModelHealth = modelWounds; // Fresh model steps up
        }
    }

    const totalDamage = failedSaves.length * finalDamage;

    return { totalDamage, modelsKilled: modelsKilledCount, wastedDamage };


}





