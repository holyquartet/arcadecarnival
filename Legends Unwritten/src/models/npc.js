// Non-player character model

class NPC {
  constructor(data = {}) {
    this.id = data.id || `npc_${Date.now()}`;
    this.name = data.name || 'Stranger';
    this.description = data.description || 'A mysterious individual.';
    this.type = data.type || 'neutral'; // friendly, neutral, hostile
    
    this.stats = data.stats || {
      health: 50,
      strength: 5,
      defense: 3,
      intelligence: 5,
      resistance: 3,
      charisma: 5
    };
    
    this.dialogue = data.dialogue || {
      greeting: ['Hello there.'],
      friendly: ['How can I help you?'],
      neutral: ['What do you want?'],
      hostile: ['Stay back!'],
      farewell: ['Goodbye.']
    };
    
    this.questGiver = data.questGiver || false;
    this.quest = data.quest || null;
    this.merchant = data.merchant || false;
    this.inventory = data.inventory || [];
    this.memories = data.memories || []; // Remembers interactions with player
    
    // For enemy NPCs
    this.rewards = data.rewards || null;
    this.abilities = data.abilities || [];
  }
  
  // Get appropriate dialogue based on relationship
  getDialogue(relationshipValue, type = 'greeting') {
    let category;
    
    if (relationshipValue >= 50) {
      category = 'friendly';
    } else if (relationshipValue <= -50) {
      category = 'hostile';
    } else {
      category = 'neutral';
    }
    
    if (type !== 'greeting' && type !== 'farewell') {
      type = category;
    }
    
    // Get random dialogue of appropriate type
    const options = this.dialogue[type] || this.dialogue.neutral;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Remember an interaction with the player
  addMemory(interaction) {
    this.memories.push({
      ...interaction,
      timestamp: Date.now()
    });
    
    // Limit memory size
    if (this.memories.length > 10) {
      this.memories.shift(); // Remove oldest memory
    }
  }
  
  // Check if NPC remembers a specific interaction
  remembers(interactionType) {
    return this.memories.some(memory => memory.type === interactionType);
  }
}

// Export models
export { Player, Scene, NPC };
