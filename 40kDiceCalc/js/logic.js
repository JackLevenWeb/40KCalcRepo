export function runSimulation(iterationsTotal, weaponsArray, unit) {
    let sumTotalDamage = 0;
    let sumModelsKilled = 0;
    let sumWastedDamage = 0;

    const allTotalDamage = [];
    const allModelsKilled = [];
    const allWastedDamage = [];

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

            // current health so the next weapon targets a damaged unit
            currentTargetHealth = hurtSystem.finalHealth;
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

    let efficiencyPercent = 0;
    if (avgTotalDamage > 0) {
        efficiencyPercent = ((avgTotalDamage - avgWastedDamage) / avgTotalDamage) * 100;
    }

    return {
        SimulatedRuns: iterationsTotal,
        averages: {
            damage: avgTotalDamage,
            killed: avgModelsKilled,
            wasted: avgWastedDamage,
            efficiency: efficiencyPercent.toFixed(1)
        },
        extremes: {
            highestDamage: Math.max(...allTotalDamage),
            highestKills: Math.max(...allModelsKilled),
            lowestDamage: Math.min(...allTotalDamage),
            lowestKilled: Math.min(...allModelsKilled)
        }
    };
}

export function runHurtSystem(weapon, unit, startingHealth) {

    const totalAttacks = blastCleaveRapid(weapon, unit);
    const hitRoll = rollDiceRecursive(totalAttacks, []);

    // Phase Placeholders (We will plug the modifier checks in here next!)
    const hitModifier = weapon.modifiers.hitMod;
    const woundModifier = weapon.modifiers.woundMod;
    const damageModifier = 0;
    const specialModifier = "Normal Damage";

    // 3. Hit Phase
    const hits = evaluateHits(hitRoll, weapon.BsWs, hitModifier, weapon);
    const successfulHits = hits.successes.length;

    if (successfulHits === 0) return { totalDamage: 0, modelsKilled: 0, wastedDamage: 0, finalHealth: startingHealth };

    // 3. Wound Phase
    const woundTarget = calculateWoundTarget(weapon.strength, unit.toughness);
    const woundRoll = rollDiceRecursive(successfulHits, []);
    const wounds = eveluateWounds(woundRoll, woundTarget, woundModifier);
    const successfulWounds = wounds.successes.length;

    if (successfulWounds === 0) return { totalDamage: 0, modelsKilled: 0, wastedDamage: 0, finalHealth: startingHealth };

    // 4. Save Phase
    const saveRoll = rollDiceRecursive(successfulWounds, []);
    const saves = eveluateSaves(saveRoll, unit.save, weapon.Ap, unit.inVul);
    const failedSavesCount = saves.fails.length;

    if (failedSavesCount === 0) return { totalDamage: 0, modelsKilled: 0, wastedDamage: 0, finalHealth: startingHealth };

    // 5. Damage Phase (Passing the startingHealth into the modelsKill function)
    const damageDone = modelsKill(saves.fails, weapon.damage, unit.wounds, damageModifier, specialModifier, startingHealth);

    // 6. MASTER RETURN
    return {
        totalDamage: damageDone.totalDamage,
        modelsKilled: damageDone.modelsKilled,
        wastedDamage: damageDone.wastedDamage,
        finalHealth: damageDone.currentHealth // Pass the resulting health out
    };
}


// >>> HELPER FUNCTIONS >>>

// Initial rolls
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

function checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon) {

    const TempsuccessfulHits = [];
    const tempfailedHits = [];

    //might have to account for critical changes later

    if (weapon.sustained) {
        successfulHits.forEach(die => {

            if (die === 6) {
                successfulHits.push(die);

            }

        })

    }


    if (failedHits) {



        for (const die of failedHits) {
            if (die === 1) {
                tempfailedHits.push(die);
            } else if (die === 6) {
                TempsuccessfulHits.push(die);
            } else {
                const modDie = hitModifier ? die + hitModifier : die;
                if (modDie >= toHit) {
                    TempsuccessfulHits.push(modDie);
                } else {
                    tempfailedHits.push(modDie);
                }
            }
        }
        successfulHits.push(...TempsuccessfulHits);
        failedHits.push(...tempfailedHits);

        return { successesChecked: successfulHits, failsChecked: failedHits };
        //getting back  const variable = functionVariable.successesChecked.length;
    } else {
        //normal roll
        for (const die of results) {
            if (die === 1) {
                tempfailedHits.push(die);
            } else if (die === 6) {
                TempsuccessfulHits.push(die);
            } else {
                const modDie = hitModifier ? die + hitModifier : die;
                if (modDie >= toHit) {
                    TempsuccessfulHits.push(modDie);
                } else {
                    tempfailedHits.push(modDie);
                }
            }
        }
        successfulHits.push(...TempsuccessfulHits);
        failedHits.push(...tempfailedHits);

        return { successesChecked: successfulHits, failsChecked: failedHits };

    }

}

function checkLethal(results, weapon) {
    const lethalCount = 0;
    if (weapon.lethal) {
        results.forEach(die => {
            if (die === 6) {
                lethalCount++;

            }

        });

    }
    return lethalCount;

}


// Check and modify hits
function evaluateHits(results, toHit, hitModifier, weapon) {
    //account for torrent//done
    //account for rerolling(all and 1s)//done
    //check for sustained//done
    //check for lethals //done
    const successfulHits = [];
    const failedHits = [];
    let lethal = 0;


    if (weapon.torrent) {

        successfulHits = [...results];

        return { successes: successfulHits, fails: failedHits, lethals: lethal };
    }

    //reroll all hits once
    if (weapon.reollHits === "all") {


        const firstDicePool = checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon);//use to push to main hits and fails
        successfulHits.push(...dicePool.successesChecked);
        failedHits.push(...dicePool.failsChecked);

        //did any fail?
        if (failedHits.length > 0) {
            const reRolled = rollDiceRecursive(failedHits.length, []);
            const SecondDicePool = checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon);
            successfulHits.push(...dicePool.successesChecked);
            failedHits.push(...dicePool.failsChecked);

        }

        lethal = checkLethal(successfulHits, weapon);
        return { successes: successfulHits, fails: failedHits, lethals: lethal };

    } else if (weapon.reollHits === "ones") {
        const firstDicePool = checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon);//use to push to main hits and fails
        successfulHits.push(...dicePool.successesChecked);
        failedHits.push(...dicePool.failsChecked);

        //how many 1s to reroll
        const countOnes = failedHits.filter(die => die === 1).length;

        if (countOnes > 0) {
            const reRolled = rollDiceRecursive(failedHits.length, []);
            const SecondDicePool = checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon);
            successfulHits.push(...dicePool.successesChecked);
            failedHits.push(...dicePool.failsChecked);

        }
        lethal = checkLethal(successfulHits, weapon);
        return { successes: successfulHits, fails: failedHits, lethals: lethal };

    }

    const normalDicePool = checkRoll(results, successfulHits, failedHits, toHit, hitModifier, weapon);
    successfulHits.push(...dicePool.successesChecked);
    failedHits.push(...dicePool.failsChecked);
    lethal = checkLethal(successfulHits, weapon);
    return { successes: successfulHits, fails: failedHits, lethals: lethal };
}

// Find wound target number
function calculateWoundTarget(strength, toughness) {
    if (strength >= toughness * 2) return 2;
    if (strength > toughness) return 3;
    if (strength === toughness) return 4;
    if (strength <= toughness / 2) return 6;
    return 5;
}

//anti keyword
//tiwnlinked / reroll
//dev wounds
// Evaluate wounds
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

// Evaluate saves
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

// Final Damage and Kills
function modelsKill(failedSaves, weaponDamage, modelWounds, damageModifier, specialModifier, startingHealth) {
    let finalDamage = weaponDamage;

    if (damageModifier !== 0) {
        finalDamage += damageModifier;
    }

    if (specialModifier === "Half Damage") {
        finalDamage = finalDamage / 2;
    }

    // Round up fractions AFTER all math is complete
    finalDamage = Math.ceil(finalDamage);

    // The Minimum 1 Rule
    finalDamage = Math.max(1, finalDamage);

    let modelsKilledCount = 0;
    let wastedDamage = 0;
    let currentHealth = startingHealth;

    for (let i = 0; i < failedSaves.length; i++) {
        currentHealth -= finalDamage;

        // Did the model die?
        if (currentHealth <= 0) {
            modelsKilledCount++;
            wastedDamage += Math.abs(currentHealth);
            currentHealth = modelWounds; // Fresh model steps up
        }
    }

    const totalDamage = failedSaves.length * finalDamage;

    return { totalDamage, modelsKilled: modelsKilledCount, wastedDamage, currentHealth };
}

//attack modifiers
function blastCleaveRapid(weapon, unit) {
    const totalAttacks = 0;

    if (weapon.blast || weapon.cleave) {
        const extraAttack = Math.floor(unit.modelCount / 5);
        totalAttacks = (weapon.attack + extraAttack) * weapon.modelCount * weapon.unitCount;

    } else if (weapon.rapidFire) {
        totalAttacks = (weapon.attack + weapon.rapidFire) * weapon.modelCount * weapon.unitCount;

    } else {

        totalAttacks = weapon.attack * weapon.modelCount * weapon.unitCount;

    }
    return totalAttacks;

}