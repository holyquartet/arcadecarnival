// Player character model

class Player {
  constructor(data = {}) {
    this.name = data.name || 'Adventurer';
    this.archetype = data.archetype || 'warrior';
    
    // Base stats with defaults
    this.stats = {
      health: data.stats?.health || 100,
      maxHealth: data.stats?.maxHealth || 100,
      mana: data.stats?.mana || 50,
      maxMana: data.stats?.maxMana || 50,
      strength: data.stats?.strength || 10,
      intelligence: data.stats?.intelligence || 10,
      dexterity: data.stats?.dexterity || 10,
      charisma: data.stats?.charisma || 10,
      defense: data.stats?.defense || 5,
      resistance: data.stats?.resistance || 5,
      level: data.stats?.level || 1,
      experience: data.stats?.experience || 0,
      experienceToLevel: data.stats?.experienceToLevel || 100
    };
    
    // Special abilities based on archetype
    this.abilities = data.abilities || this._getDefaultAbilities();
    
    // Character history
    this.background = data.background || {
      hometown: 'Unknown',
      backstory: 'A mysterious adventurer with an unknown past.'
    };
  }
  
  // Get default abilities based on archetype
  _getDefaultAbilities() {
    switch (this.archetype) {
      case 'warrior':
        return ['Powerful Strike', 'Shield Block', 'Intimidate'];
      case 'mage':
        return ['Fireball', 'Arcane Shield', 'Teleport'];
      case 'rogue':
        return ['Backstab', 'Evade', 'Pickpocket'];
      case 'diplomat':
        return ['Persuade', 'Bribe', 'Gather Information'];
      default:
        return ['Basic Attack'];
    }
  }
  
  // Modify a stat value
  modifyStat(stat, amount) {
    if (stat in this.stats) {
      this.stats[stat] += amount;
      
      // Handle special cases
      if (stat === 'health') {
        this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);
      } else if (stat === 'mana') {
        this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);
      } else if (stat === 'experience') {
        this._checkLevelUp();
      }
      
      return true;
    }
    return false;
  }
  
  // Check if player has leveled up
  _checkLevelUp() {
    if (this.stats.experience >= this.stats.experienceToLevel) {
      // Level up the character
      this.stats.level += 1;
      this.stats.experience -= this.stats.experienceToLevel;
      
      // Increase experience needed for next level
      this.stats.experienceToLevel = Math.floor(this.stats.experienceToLevel * 1.5);
      
      // Increase stats
      this.stats.maxHealth += 10;
      this.stats.health = this.stats.maxHealth;
      this.stats.maxMana += 5;
      this.stats.mana = this.stats.maxMana;
      
      // Increase core stats based on archetype
      switch (this.archetype) {
        case 'warrior':
          this.stats.strength += 3;
          this.stats.defense += 2;
          this.stats.dexterity += 1;
          break;
        case 'mage':
          this.stats.intelligence += 3;
          this.stats.resistance += 2;
          this.stats.mana += 5;
          break;
        case 'rogue':
          this.stats.dexterity += 3;
          this.stats.charisma += 1;
          this.stats.strength += 1;
          break;
        case 'diplomat':
          this.stats.charisma += 3;
          this.stats.intelligence += 2;
          this.stats.resistance += 1;
          break;
        default:
          // Balanced increase for other archetypes
          this.stats.strength += 1;
          this.stats.intelligence += 1;
          this.stats.dexterity += 1;
          this.stats.charisma += 1;
          this.stats.defense += 1;
      }
      
      return true;
    }
    return false;
  }
  
  // Add a new ability
  addAbility(ability) {
    if (!this.abilities.includes(ability)) {
      this.abilities.push(ability);
      return true;
    }
    return false;
  }
}

