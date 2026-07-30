//#region dom scraping >>>>>>>>>>>>>>>>>>>>>>>

// scrapes current ui state for combinatorial buckets
export function scrapeCombinatorialSelections() {
    const getValues = (bucketId) => {
        const items = document.querySelectorAll(`#${bucketId} .draggable-mod`);

        return Array.from(items).map(item => item.getAttribute('data-mod'));
    };

    return {
        independent: getValues('bucket-independent'),
        mutExclusiveA: getValues('bucket-exclusive-a'),
        mutExclusiveB: getValues('bucket-exclusive-b'),
        mutExclusiveC: getValues('bucket-exclusive-c'),
        inclusiveA: getValues('bucket-inclusive-a'),
        inclusiveB: getValues('bucket-inclusive-b'),
        inclusiveC: getValues('bucket-inclusive-c')
    };
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

    // define hardcoded conflict rules
    const exclusivePairs = [
        ["reroll_hits_all", "reroll_hits_1"],
        ["reroll_wounds_all", "reroll_wounds_1"]
    ];

    // group all generated states into master array
    const allBuckets = [
        indCombinations,
        mutACombinations, mutBCombinations, mutCCombinations,
        incACombinations, incBCombinations, incCCombinations
    ];

    // recursive helper function for cartesian product
    function* cartesianProduct(bucketIndex, currentCombo) {

        // base condition to validate and yield result
        if (bucketIndex === allBuckets.length) {
            let isValid = true;

            for (const [modA, modB] of exclusivePairs) {
                if (currentCombo.includes(modA) && currentCombo.includes(modB)) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                yield currentCombo;
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