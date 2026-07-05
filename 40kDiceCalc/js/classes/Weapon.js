export class Weapon {
    constructor(unitName, attack, BsWs, strength, Ap, damage, modelCount, unitCount, modifiers = {}) {
        this.unitName = unitName;

        this.isLeader = modifiers.isLeader || false;
        this.attachTarget = modifiers.attachTarget || null;
        this.grantedKeyword = modifiers.grantedKeyword || "none";

        this.attack = attack;
        this.BsWs = BsWs === "NA" ? "NA" : parseInt(BsWs, 10);
        this.strength = strength;
        this.Ap = Ap;
        this.damage = damage;
        this.modelCount = modelCount;
        this.unitCount = unitCount;


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
            lance: modifiers.lance || false,
            sustained: modifiers.sustained || 0,
            melta: modifiers.melta || 0,
            rapidFire: modifiers.rapidFire || 0,
            anti: modifiers.anti || 0,
            critHitThreshold: modifiers.critHitThreshold || 6, // Default Crit on 6
            critWoundThreshold: modifiers.critWoundThreshold || 6
        };
    }
}