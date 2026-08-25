//#region dom scraping >>>>>>>>>>>>>>>>>>>>>>>

// scrapes current ui state for combinatorial buckets
export function scrapeCombinatorialSelections() {
    const getValues = (bucketId) => {
        const items = document.querySelectorAll(`#${bucketId} .draggable-mod`);

        return Array.from(items).map(item => item.getAttribute('data-mod'));
    };

    const selections = {
        independent: getValues('bucket-independent'),
        mutExclusiveA: getValues('bucket-exclusive-a'),
        mutExclusiveB: getValues('bucket-exclusive-b'),
        mutExclusiveC: getValues('bucket-exclusive-c'),
        inclusiveA: getValues('bucket-inclusive-a'),
        inclusiveB: getValues('bucket-inclusive-b'),
        inclusiveC: getValues('bucket-inclusive-c')
    };

    // define rules where the dominant modifier makes the redundant one obsolete
    const overrideRules = [
        { dominant: "reroll_hits_all", redundant: "reroll_hits_1" },
        { dominant: "reroll_hits_all", redundant: "reroll_one_hit" },
        { dominant: "reroll_wounds_all", redundant: "reroll_wounds_1" },
        { dominant: "reroll_wounds_all", redundant: "reroll_one_wound" },
        { dominant: "reroll_damage", redundant: "reroll_one_damage" }
    ];

    // if a dominant rule is present anywhere purge the redundant one entirely
    for (const rule of overrideRules) {
        const hasDominant = Object.values(selections).some(bucket => bucket.includes(rule.dominant));

        if (hasDominant) {
            for (const key in selections) {
                selections[key] = selections[key].filter(mod => mod !== rule.redundant);
            }
        }
    }

    return selections;
}

//#endregion

//#region combination generator >>>>>>>>>>>>>>>>>>>>>>>

// generates all valid permutations based on bucket rules
export function* generateCombinations(independent, mutExclA, mutExclB, mutExclC, incA, incB, incC) {

    // build states for independent bucket
    const indCombinations = [];
    const indTotal = 1 << independent.length;

    for (let i = 0; i < indTotal; i++) {
        const combo = [];
        for (let j = 0; j < independent.length; j++) {
            if (i & (1 << j)) {
                combo.push(independent[j]);
            }
        }
        indCombinations.push(combo);
    }

    // build states for mutually exclusive buckets
    const mutACombinations = [[]];
    for (const mod of mutExclA) mutACombinations.push([mod]);

    const mutBCombinations = [[]];
    for (const mod of mutExclB) mutBCombinations.push([mod]);

    const mutCCombinations = [[]];
    for (const mod of mutExclC) mutCCombinations.push([mod]);

    // build states for inclusive buckets
    const incACombinations = [[]];
    if (incA.length > 0) incACombinations.push(incA);

    const incBCombinations = [[]];
    if (incB.length > 0) incBCombinations.push(incB);

    const incCCombinations = [[]];
    if (incC.length > 0) incCCombinations.push(incC);

    // define rules that can be tested separately but never simultaneously 
    const mutuallyExclusivePairs = [
        ["reroll_hits_1", "reroll_one_hit"],
        ["reroll_wounds_1", "reroll_one_wound"],
        ["reroll_damage", "reroll_one_damage"]
    ];

    // group all generated states into master array
    const allBuckets = [
        indCombinations,
        mutACombinations, mutBCombinations, mutCCombinations,
        incACombinations, incBCombinations, incCCombinations
    ];

    // tracks unique combinations to prevent duplicate simulations
    const yieldedCombos = new Set();

    // recursive helper function for cartesian product
    function* cartesianProduct(bucketIndex, currentCombo) {

        // base condition to validate and yield result
        if (bucketIndex === allBuckets.length) {
            let finalCombo = [...currentCombo];

            // check for forbidden overlapping rules
            let hasConflict = false;
            for (const [modA, modB] of mutuallyExclusivePairs) {
                if (finalCombo.includes(modA) && finalCombo.includes(modB)) {
                    hasConflict = true;
                    break;
                }
            }

            // if both conflicting rules are present, skip this combination entirely
            if (hasConflict) return;

            // sort and stringify to check for duplicates
            finalCombo.sort();
            const comboKey = finalCombo.join(",");

            if (!yieldedCombos.has(comboKey)) {
                yieldedCombos.add(comboKey);
                yield finalCombo;
            }

            return;
        }

        // loop through options in current bucket
        const currentBucketOptions = allBuckets[bucketIndex];

        for (const option of currentBucketOptions) {
            // combine and call function for next bucket
            yield* cartesianProduct(bucketIndex + 1, [...currentCombo, ...option]);
        }
    }

    // start recursion at bucket index 0
    yield* cartesianProduct(0, []);
}

//#endregion