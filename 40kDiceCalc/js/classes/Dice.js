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
    static rollPool({ poolSize, target, modifier, rerollRule, critThreshold, sustained, isLethalOrDev, fishForCrits, rerollOne = false }) {
        let initialRolls = this.rollRaw(poolSize);
        let finalRolls = [];

        const isFishingActive = fishForCrits && (isLethalOrDev || sustained > 0) && (rerollRule === "all" || rerollRule === "ones");
        const cappedMod = Math.max(-1, Math.min(1, modifier));

        let singleRerollUsed = false;

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


            if (!shouldReroll && rerollOne && !singleRerollUsed) {
                if (r === 1 || (r < critThreshold && r + cappedMod < target)) {
                    shouldReroll = true;
                    singleRerollUsed = true;
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
            if (r === 1) {
                fails++;
                continue;
            }
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
            if (r + cappedMod >= target) {
                successes++;
            } else {
                fails++;
            }
        }

        return { successes, fails, autos, bonus };
    }
}