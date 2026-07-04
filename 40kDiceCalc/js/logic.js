export function runHurtSystem(weapon, unit) {

    const hitRoll = rollDiceRecursive(weapon.attack * weapon.modelCount, []);
    const woundTarget = calculateWoundTarget(weapon.strength, unit.toughness);

    //place holder for when we create hit modifiers
    // const hitModifier = modfiers.hitMod ;
    // const woundModifer = modfiers.woundMod ;
    const hitModifier = 0;
    const woundModifer = 0;
    const damageModifier = 0;
    const specialModifier = "Normal Damage";

    const hits = evaluateHits(hitRoll, weapon.BsWs, hitModifier);

    if (hits.successes.length === 0) return "Attack failed to hit.";

    const woundRoll = rollDiceRecursive(hits.successes.length, []);

    const wounds = eveluateWounds(woundRoll, woundTarget, woundModifer);

    if (wounds.successes.length === 0) return "Attack failed to wound.";


    const saveRoll = rollDiceRecursive(wounds.successes.length, []);

    const failedSaves = eveluateSaves(saveRoll, unit.save, weapon.ap, unit.inVul);

    const damageDone = modelsKilled(failedSaves, weapon.damage, unit.wounds, damageModifier, specialModifier);


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



function modelsKilled(failedSaves, weaponDamge, modelWounds, damageModifier, specialModifier) {

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





