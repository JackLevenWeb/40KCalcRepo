function scrapeCombinatorialSelections() {
    const selectedMods = [];
    const checkboxes = document.querySelectorAll('.combinatorial-checkbox:checked');

    checkboxes.forEach(box => {
        selectedMods.push(box.value);
    });

    return selectedMods;
}



export function* generateCombinations(modifiers) {
    const totalCombinations = 1 << modifiers.length;

    for (let i = 0; i < totalCombinations; i++) {
        const currentCombo = [];
        for (let j = 0; j < modifiers.length; j++) {
            if (i & (1 << j)) {
                currentCombo.push(modifiers[j]);
            }
        }
        yield currentCombo;
    }
}