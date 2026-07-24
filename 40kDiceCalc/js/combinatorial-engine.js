export function scrapeCombinatorialSelections() {
    const selectedMods = [];
    const checkboxes = document.querySelectorAll('.combinatorial-checkbox:checked');

    checkboxes.forEach(box => {
        selectedMods.push(box.value);
    });

    return selectedMods;
}



export function* generateCombinations(modifiers) {
    const totalCombinations = 1 << modifiers.length;

    // define combinations that are mathematically redundant or impossible to stack
    const exclusivePairs = [
        ["reroll_hits_all", "reroll_hits_1"],
        ["reroll_wounds_all", "reroll_wounds_1"]
    ];

    for (let i = 0; i < totalCombinations; i++) {
        const currentCombo = [];

        // build the current combination using our bitwise mask
        for (let j = 0; j < modifiers.length; j++) {
            if (i & (1 << j)) {
                currentCombo.push(modifiers[j]);
            }
        }


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
    }
}