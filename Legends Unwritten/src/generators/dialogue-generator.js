// legends-unwritten/src/generators/dialogue-generator.js
// Dynamic dialogue generation

class DialogueGenerator {
  constructor(config = {}) {
    this.dialoguePatterns = config.dialoguePatterns || {};
    this.responseTemplates = config.responseTemplates || {};
    
    // Load defaults if none provided
    if (Object.keys(this.dialoguePatterns).length === 0) {
      this._loadDefaultPatterns();
    }
  }
  
  // Generate NPC dialogue based on NPC and relationship
  generateDialogue(npc, relationshipValue, context = {}) {
    // Get appropriate dialogue type
    let category;
    
    if (relationshipValue >= 50) {
      category = 'friendly';
    } else if (relationshipValue <= -50) {
      category = 'hostile';
    } else {
      category = 'neutral';
    }
    
    // Get random dialogue of appropriate type
    if (!npc.dialogue || !npc.dialogue[category]) {
      // Fallback to generic dialogue
      return this._generateGenericDialogue(npc, category, context);
    }
    
    const options = npc.dialogue[category];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate response options based on NPC dialogue
  generateResponses(npcDialogue, player, npc, relationshipValue) {
    const responses = [];
    
    // Add generic responses based on relationship
    if (relationshipValue >= 50) {
      responses.push({
        text: 'Respond positively',
        effects: {
          relationships: { [npc.id]: 5 }
        },
        tags: ['friendly', 'social']
      });
    } else if (relationshipValue <= -50) {
      responses.push({
        text: 'Respond cautiously',
        tags: ['cautious', 'social']
      });
      responses.push({
        text: 'Threaten',
        effects: {
          relationships: { [npc.id]: -10 }
        },
        tags: ['hostile', 'intimidate']
      });
    } else {
      responses.push({
        text: 'Respond politely',
        effects: {
          relationships: { [npc.id]: 5 }
        },
        tags: ['polite', 'social']
      });
    }
    
    // Add archetype-specific responses
    switch (player.archetype) {
      case 'warrior':
        responses.push({
          text: 'Ask about local challenges',
          tags: ['quest', 'combat']
        });
        break;
      case 'mage':
        responses.push({
          text: 'Inquire about magical curiosities',
          tags: ['quest', 'magic']
        });
        break;
      case 'rogue':
        responses.push({
          text: 'Ask about valuable opportunities',
          tags: ['quest', 'loot']
        });
        break;
      case 'diplomat':
        responses.push({
          text: 'Gather information diplomatically',
          effects: {
            relationships: { [npc.id]: 5 }
          },
          tags: ['information', 'social']
        });
        break;
    }
    
    // Add context-specific responses
    if (npc.merchant) {
      responses.push({
        text: 'Ask to see wares',
        tags: ['shop', 'trade']
      });
    }
    
    if (npc.questGiver) {
      responses.push({
        text: 'Ask about available tasks',
        tags: ['quest', 'information']
      });
    }
    
    // Always add a leave option
    responses.push({
      text: 'End the conversation',
      tags: ['leave', 'social']
    });
    
    return responses;
  }
  
  // Generate generic dialogue based on relationship category
  _generateGenericDialogue(npc, category, context = {}) {
    const patterns = this.dialoguePatterns[category] || this.dialoguePatterns.neutral;
    
    if (!patterns || patterns.length === 0) {
      return `Hello there.`;
    }
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Replace variables in pattern
    return pattern
      .replace(/{npc\.name}/g, npc.name)
      .replace(/{npc\.type}/g, npc.type)
      .replace(/{context\.location}/g, context.location || 'this place')
      .replace(/{context\.time}/g, context.time || 'now');
  }
  
  // Load default dialogue patterns
  _loadDefaultPatterns() {
    this.dialoguePatterns = {
      friendly: [
        "Greetings, friend! It's good to see a friendly face around {context.location}.",
        "Ah, welcome! I've heard good things about you. How can I help?",
        "Hello there! What brings someone like you to {context.location} at {context.time}?",
        "Well met! Always a pleasure to see you around these parts."
      ],
      neutral: [
        "Hello. What brings you to {context.location}?",
        "Greetings, traveler. Can I help you with something?",
        "Yes? What do you need?",
        "Welcome to {context.location}. What's your business here?"
      ],
      hostile: [
        "I don't have anything to say to you. Move along.",
        "Keep your distance if you know what's good for you.",
        "What do you want? Make it quick.",
        "I'm watching you, so don't try anything foolish."
      ]
    };
  }
}

// Export the generator classes
export { StoryGenerator, EventGenerator, DialogueGenerator };
