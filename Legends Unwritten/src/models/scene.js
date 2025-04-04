// Scene model for narrative segments

class Scene {
  constructor(data = {}) {
    this.id = data.id || `scene_${Date.now()}`;
    this.title = data.title || 'Untitled Scene';
    this.description = data.description || '';
    this.narrative = data.narrative || [];
    
    this.location = data.location || {
      name: 'Unknown',
      type: 'neutral',
      description: 'A nondescript location.'
    };
    
    this.characters = data.characters || [];
    this.items = data.items || [];
    
    this.choices = data.choices || [
      {
        text: 'Continue',
        nextSceneId: null, // Generated dynamically
        effects: null
      }
    ];
    
    this.requirements = data.requirements || null;
    this.tags = data.tags || [];
    this.music = data.music || null;
    this.ambientSounds = data.ambientSounds || null;
  }
  
  // Add a new choice
  addChoice(choice) {
    this.choices.push(choice);
  }
  
  // Check if the scene has a specific tag
  hasTag(tag) {
    return this.tags.includes(tag);
  }
  
  // Add a paragraph to the narrative
  addNarrative(text) {
    this.narrative.push(text);
  }
  
  // Check if scene meets requirements based on player and game state
  meetsRequirements(player, gameState) {
    if (!this.requirements) return true;
    
    // Check stat requirements
    if (this.requirements.stats) {
      for (const [stat, value] of Object.entries(this.requirements.stats)) {
        if ((player.stats[stat] || 0) < value) {
          return false;
        }
      }
    }
    
    // Check inventory requirements
    if (this.requirements.inventory) {
      for (const item of this.requirements.inventory) {
        if (!gameState.inventory.includes(item)) {
          return false;
        }
      }
    }
    
    // Check quest requirements
    if (this.requirements.quests) {
      for (const quest of this.requirements.quests) {
        if (!gameState.completedQuests.has(quest)) {
          return false;
        }
      }
    }
    
    // Check flag requirements
    if (this.requirements.flags) {
      for (const [flag, value] of Object.entries(this.requirements.flags)) {
        if (gameState.flags[flag] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
}

