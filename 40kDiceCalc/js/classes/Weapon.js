

export class Weapon {

    constructor(attack, BsWs, strength, Ap, damage, modelCount, unitCount, modifiers = {}) {
        this.attack = attack;
        this.BsWs = BsWs;
        this.strength = strength;
        this.Ap = Ap;
        this.damage = damage;
        this.modelCount = modelCount;
        this.unitCount = unitCount;




        // The Modifiers Object
        this.modifiers = {
            hitMod: modifiers.hitMod || 0,
            woundMod: modifiers.woundMod || 0,
            rerollHits: modifiers.rerollHits || "none",
            rerollWounds: modifiers.rerollWounds || "none",
            lethal: modifiers.lethal || false,
            devastating: modifiers.devastating || false,
            torrent: modifiers.torrent || false,
            twinLinked: modifiers.twinLinked || false,
            blast: modifiers.blast || false,
            cleave: modifiers.cleave || false,
            sustained: modifiers.sustained || 0,
            melta: modifiers.melta || 0,
            rapidFire: modifiers.rapidFire || 0,
            anti: modifiers.anti || 0
        };
    }

}