import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';


const CalcBtn = document.getElementById("calculate-btn");
CalcBtn.addEventListener("click", () => {

    createWeapon();
    createUnit();


});


function createWeapon() {

    const attack = parseInt(document.getElementById("attacks").value, 10);
    const bsws = parseInt(document.getElementById("bs-ws").value, 10);
    const strength = parseInt(document.getElementById("strength").value, 10);
    const ap = parseInt(document.getElementById("ap").value, 10);
    const damage = parseInt(document.getElementById("damage").value, 10);
    const modelCount = parseInt(document.getElementById("modelCount").value, 10);

    const attackerWeapon = new Weapon(attack, bsws, strength, ap, damage, modelCount);

    console.log(attackerWeapon);

}

function createUnit() {

    const toughness = parseInt(document.getElementById("toughness").value, 10);
    const wounds = parseInt(document.getElementById("wounds").value, 10);
    const save = parseInt(document.getElementById("save").value, 10);
    const inVul = parseInt(document.getElementById("inVul").value, 10) || null;

    const targetUnit = new Unit(toughness, wounds, save, inVul);

    console.log(targetUnit);



}