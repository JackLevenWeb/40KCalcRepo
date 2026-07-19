export class Dice {
    // roll helper
    static rollRaw(count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * 6) + 1);
        }
        return results;
    }

    //  evaluation Function
    static rollPool({ poolSize, target, modifier, rerollRule, critThreshold, sustained, isLethalOrDev, fishForCrits }) {
        let initialRolls = this.rollRaw(poolSize);
        let finalRolls = [];

        const isFishingActive = fishForCrits && (isLethalOrDev || sustained > 0) && (rerollRule === "all" || rerollRule === "ones");

        // calculate the capped modifier FIRST so it can be used to evaluate misses
        const cappedMod = Math.max(-1, Math.min(1, modifier));

        // process Rerolls
        for (const r of initialRolls) {
            let shouldReroll = false;

            if (isFishingActive) {
                // greedy Reroll everything that is not a natural critical success
                if (r < critThreshold) {
                    shouldReroll = true;
                }
            } else if (rerollRule === "all") {
                // reroll natural 1s OR any roll that misses AFTER the modifier is applied
                if (r === 1 || (r < critThreshold && r + cappedMod < target)) {
                    shouldReroll = true;
                }
            } else if (rerollRule === "ones") {
                if (r === 1) {
                    shouldReroll = true;
                }
            }

            if (shouldReroll) {
                finalRolls.push(this.rollRaw(1)[0]);
            } else {
                finalRolls.push(r);
            }
        }

        // process Outcomes
        let successes = 0;
        let fails = 0;
        let autos = 0;
        let bonus = 0;

        for (const r of finalRolls) {
            // check for natural 1s (Automatic Failure)
            if (r === 1) {
                fails++;
                continue;
            }

            // check for natural criticals (Ignores modifiers)
            if (r >= critThreshold) {
                if (isLethalOrDev) {
                    autos++;
                } else {
                    successes++;
                }

                if (sustained > 0) {
                    bonus += sustained;
                }
                continue;
            }

            // check for normal successes (Applies modifiers)
            if (r + cappedMod >= target) {
                successes++;
            } else {
                fails++;
            }
        }

        return { successes, fails, autos, bonus };
    }
}