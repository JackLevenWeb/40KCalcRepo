export class Dice {
    // Basic roll helper
    static rollRaw(count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * 6) + 1);
        }
        return results;
    }

    // The Master Evaluation Function
    static rollPool({ poolSize, target, modifier, rerollRule, critThreshold, sustained, isLethalOrDev }) {
        let initialRolls = this.rollRaw(poolSize);
        let finalRolls = [];

        // 1. Process Rerolls (Happens BEFORE modifiers in 40k)
        for (const r of initialRolls) {
            if (rerollRule === "all" && r < target && r !== 6) {
                finalRolls.push(this.rollRaw(1)[0]);
            } else if (rerollRule === "ones" && r === 1) {
                finalRolls.push(this.rollRaw(1)[0]);
            } else {
                finalRolls.push(r);
            }
        }

        // 2. Process Outcomes
        let successes = 0;
        let fails = 0;
        let autos = 0; // Lethal Hits or Devastating Wounds
        let bonus = 0; // Sustained Hits

        // 40k Rule: Final modifiers can never be more than +1 or -1
        const cappedMod = Math.max(-1, Math.min(1, modifier));

        for (const r of finalRolls) {
            // Unmodified 1 always fails
            if (r === 1) {
                fails++;
                continue;
            }

            // Critical Success Check (Unmodified)
            if (r >= critThreshold) {
                if (isLethalOrDev) {
                    autos++; // Bypasses the next phase!
                } else {
                    successes++;
                }

                if (sustained > 0) {
                    bonus += sustained; // Generate extra dice
                }
                continue;
            }

            // Normal Success Check (Modified)
            if (r + cappedMod >= target) {
                successes++;
            } else {
                fails++;
            }
        }

        return { successes, fails, autos, bonus };
    }
}