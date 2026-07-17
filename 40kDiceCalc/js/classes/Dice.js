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

        // process Rerolls, BEFORE modifiers
        for (const r of initialRolls) {
            let shouldReroll = false;

            if (isFishingActive) {
                // greedy Reroll everything that is not a critical success
                if (r < critThreshold) {
                    shouldReroll = true;
                }
            } else if (rerollRule === "all") {
                // normal reroll misses (unmodified roll < target)
                if (r < target && r !== 6) {
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

        const cappedMod = Math.max(-1, Math.min(1, modifier));

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