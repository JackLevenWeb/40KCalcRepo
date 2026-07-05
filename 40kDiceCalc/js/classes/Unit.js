export class Unit {
    constructor(toughness, wounds, save, inVul, fnp, modelCount, modifiers = {}) {
        this.toughness = toughness;
        this.wounds = wounds;
        this.save = save;
        this.inVul = inVul;
        this.fnp = fnp;
        this.modelCount = modelCount;

        // Defensive Modifiers
        this.modifiers = {
            minusOneHit: modifiers.minusOneHit || false,
            minusOneWound: modifiers.minusOneWound || false,
            minusOneWoundHighStr: modifiers.minusOneWoundHighStr || false,
            cover: modifiers.cover || false, // Worsens Attacker BS by 1
            halfDamage: modifiers.halfDamage || false,
            minusOneDamage: modifiers.minusOneDamage || false,
            keywords: modifiers.keywords || []
        };
    }
}