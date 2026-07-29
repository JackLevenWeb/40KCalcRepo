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

export function* generateCombinations(independent, mutExclA, mutExclB, mutExclC, incA, incB, incC) {

    // 1. Build the states for the Independent bucket
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

    // 2. Build the states for the Mutually Exclusive buckets
    const mutACombinations = [[]];
    for (const mod of mutExclA) mutACombinations.push([mod]);

    const mutBCombinations = [[]];
    for (const mod of mutExclB) mutBCombinations.push([mod]);

    const mutCCombinations = [[]];
    for (const mod of mutExclC) mutCCombinations.push([mod]);

    // 3. Build the states for the Inclusive (Package Deal) buckets
    const incACombinations = [[]];
    if (incA.length > 0) incACombinations.push(incA);

    const incBCombinations = [[]];
    if (incB.length > 0) incBCombinations.push(incB);

    const incCCombinations = [[]];
    if (incC.length > 0) incCCombinations.push(incC);

    // 4. Define our hardcoded conflict rules
    const exclusivePairs = [
        ["reroll_hits_all", "reroll_hits_1"],
        ["reroll_wounds_all", "reroll_wounds_1"]
    ];

    // 5. Group all the generated states together into one master array
    const allBuckets = [
        indCombinations,
        mutACombinations, mutBCombinations, mutCCombinations,
        incACombinations, incBCombinations, incCCombinations
    ];

    // 6. The Recursive Helper Function replacing the nested loops
    function* cartesianProduct(bucketIndex, currentCombo) {

        // Base Condition: If we have processed every bucket, validate and yield the result
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

        // Recursive Condition: Loop through the options in the current bucket
        const currentBucketOptions = allBuckets[bucketIndex];

        for (const option of currentBucketOptions) {
            // Combine what we have built so far with this option, and call the function again for the NEXT bucket
            yield* cartesianProduct(bucketIndex + 1, [...currentCombo, ...option]);
        }
    }

    // 7. Kick off the recursion starting at bucket index 0 with an empty combination array
    yield* cartesianProduct(0, []);
}