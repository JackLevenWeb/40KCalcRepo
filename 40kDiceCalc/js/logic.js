

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