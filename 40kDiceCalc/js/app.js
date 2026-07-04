import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
const CalcBtn = document.getElementById("calculate-btn");

CalcBtn.addEventListener("click", () => {


    const displayScreen = document.getElementById("results-output");


    displayScreen.textContent = "Rolling 10,000 dice... Please wait! 🎲";
    CalcBtn.disabled = true;

    setTimeout(() => {


        const attackerWeapon = createWeapon();
        const targetUnit = createUnit();
        console.log(`Attacker (NU M A BSWS S AP D): ${attackerWeapon.unitCount} ${attackerWeapon.modelCount} ${attackerWeapon.attack} ${attackerWeapon.BsWs} ${attackerWeapon.strength} ${attackerWeapon.Ap} ${attackerWeapon.damage}`);
        console.log(`Target (T W SV INSV): ${targetUnit.toughness} ${targetUnit.wounds} ${targetUnit.save} ${targetUnit.inVul || "None"}`);

        const results = runSimulation(10000, attackerWeapon, targetUnit);





        const formattedOutput = `
🎲 SIMULATION COMPLETE (${results.SimulatedRuns.toLocaleString()} Runs)
======================================================

📊 AVERAGES (Per Attack Sequence)
------------------------------------------------------
Average Total Damage:   ${results.averages.damage.toFixed(2)}
Average Models Killed:  ${results.averages.killed.toFixed(2)}
Average Wasted Damage:  ${results.averages.wasted.toFixed(2)}
Damage Efficiency:      ${results.averages.efficiency}%

🔥 EXTREMES (Highest & Lowest Spikes)
------------------------------------------------------
Highest Total Damage:   ${results.extremes.highestDamage}
Highest Models Killed:  ${results.extremes.highestKills}
Lowest Total Damage:    ${results.extremes.lowestDamage}
Lowest Models Killed:   ${results.extremes.lowestKilled}
`;

        displayScreen.textContent = formattedOutput.trim();


        CalcBtn.disabled = false;

    }, 10);
});


function createWeapon() {

    const attack = parseInt(document.getElementById("attacks").value, 10);
    const bsws = parseInt(document.getElementById("bs-ws").value, 10);
    const strength = parseInt(document.getElementById("strength").value, 10);
    const ap = parseInt(document.getElementById("ap").value, 10);
    const damage = parseInt(document.getElementById("damage").value, 10);
    const modelCount = parseInt(document.getElementById("modelCount").value, 10);
    const unitCount = parseInt(document.getElementById("unitCount").value, 10);

    const attackerWeapon = new Weapon(attack, bsws, strength, ap, damage, modelCount, unitCount);
    return attackerWeapon;


}

function createUnit() {

    const toughness = parseInt(document.getElementById("toughness").value, 10);
    const wounds = parseInt(document.getElementById("wounds").value, 10);
    const save = parseInt(document.getElementById("save").value, 10);
    const inVul = parseInt(document.getElementById("inVul").value, 10) || null;

    const targetUnit = new Unit(toughness, wounds, save, inVul);
    return targetUnit;




}