// legends-unwritten/src/generators/event-generator.js
// Random event generation system

class EventGenerator {
  constructor(config = {}) {
    this.eventTemplates = config.eventTemplates || [];
    
    // Load default templates if none provided
    if (this.eventTemplates.length === 0) {
      this._loadDefaultEventTemplates();
    }
  }
  
  // Generate a random event based on context
  async generateEvent(player, gameState, currentScene) {
    // Filter events that are appropriate for the current context
    const validEvents = this.eventTemplates.filter(template => {
      // Check location type compatibility
      if (template.locationTypes && 
          !template.locationTypes.includes(currentScene.location.type)) {
        return false;
      }
      
      // Check time of day compatibility
      if (template.timeOfDay && 
          template.timeOfDay !== gameState.worldState.time) {
        return false;
      }
      
      // Check for required player stats
      if (template.requirements && template.requirements.stats) {
        for (const [stat, value] of Object.entries(template.requirements.stats)) {
          if ((player.stats[stat] || 0) < value) {
            return false;
          }
        }
      }
      
      // Check for required game state flags
      if (template.requirements && template.requirements.flags) {
        for (const [flag, value] of Object.entries(template.requirements.flags)) {
          if (gameState.flags[flag] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // If no valid events, create a generic one
    if (validEvents.length === 0) {
      return this._createGenericEvent(player, currentScene);
    }
    
    // Select a random event from valid options
    const selectedTemplate = validEvents[Math.floor(Math.random() * validEvents.length)];
    
    // Build a scene from the event template
    const scene = new Scene({
      title: selectedTemplate.title,
      description: selectedTemplate.description,
      location: { ...currentScene.location }, // Events occur in same location
      tags: ['event', ...(selectedTemplate.tags || [])]
    });
    
    // Process narrative
    if (Array.isArray(selectedTemplate.narrative)) {
      scene.narrative = selectedTemplate.narrative.map(text => 
        this._processTemplate(text, player, gameState, scene)
      );
    } else {
      scene.narrative = [
        this._processTemplate(selectedTemplate.narrative, player, gameState, scene)
      ];
    }
    
    // Process choices
    scene.choices = selectedTemplate.choices.map(choice => ({
      text: this._processTemplate(choice.text, player, gameState, scene),
      effects: choice.effects,
      tags: choice.tags || []
    }));
    
    return scene;
  }
  
  // Process template strings
  _processTemplate(text, player, gameState, scene) {
    if (!text) return '';
    
    // Replace player-related variables
    let processed = text
      .replace(/\{player\.name\}/g, player.name)
      .replace(/\{player\.archetype\}/g, player.archetype);
    
    // Replace stat-related variables
    const statRegex = /\{player\.stats\.(\w+)\}/g;
    let match;
    while ((match = statRegex.exec(text)) !== null) {
      const statName = match[1];
      const statValue = player.stats[statName] || 0;
      processed = processed.replace(match[0], statValue);
    }
    
    // Replace scene-related variables
    if (scene) {
      processed = processed
        .replace(/\{location\.name\}/g, scene.location.name)
        .replace(/\{location\.description\}/g, scene.location.description);
    }
    
    // Replace game state variables
    if (gameState.worldState) {
      processed = processed
        .replace(/\{world\.time\}/g, gameState.worldState.time)
        .replace(/\{world\.weather\}/g, gameState.worldState.weather);
    }
    
    return processed;
  }
  
  // Create a generic event when no templates match
  _createGenericEvent(player, currentScene) {
    // Define some basic event types
    const basicEvents = [
      {
        title: 'A Strange Sound',
        narrative: `As you travel through ${currentScene.location.name}, you hear a strange sound nearby. It seems to be coming from just off the path.`,
        choices: [
          {
            text: 'Investigate the sound',
            tags: ['investigate', 'danger']
          },
          {
            text: 'Ignore it and continue on your way',
            tags: ['ignore', 'cautious']
          }
        ]
      },
      {
        title: 'An Unexpected Encounter',
        narrative: `While making your way through ${currentScene.location.name}, you spot a figure in the distance, watching you. They don't seem hostile... yet.`,
        choices: [
          {
            text: 'Approach and greet them',
            tags: ['social', 'approach']
          },
          {
            text: 'Ready yourself for trouble',
            tags: ['combat', 'cautious']
          },
          {
            text: 'Try to avoid them',
            tags: ['stealth', 'avoid']
          }
        ]
      },
      {
        title: 'Weather Changes',
        narrative: `The weather begins to change suddenly. Dark clouds roll in overhead, and the wind picks up.`,
        choices: [
          {
            text: 'Seek shelter immediately',
            tags: ['shelter', 'cautious']
          },
          {
            text: 'Press on despite the weather',
            effects: {
              stats: { health: -5 }
            },
            tags: ['brave', 'continue']
          }
        ]
      }
    ];
    
    // Select a random basic event
    const eventTemplate = basicEvents[Math.floor(Math.random() * basicEvents.length)];
    
    // Create a scene from the basic event
    return new Scene({
      title: eventTemplate.title,
      description: eventTemplate.title,
      location: { ...currentScene.location },
      narrative: [eventTemplate.narrative],
      choices: eventTemplate.choices,
      tags: ['event', 'random']
    });
  }
  
  // Load default event templates
  _loadDefaultEventTemplates() {
    // This would typically load from a JSON file or database
    // For now, we'll include a few basic templates directly
    
    this.eventTemplates = [
      {
        title: 'Traveling Merchant',
        description: 'You encounter a merchant selling unusual wares.',
        narrative: 'As you travel along the path, you spot a colorful wagon parked to the side. A merchant with an eccentric appearance waves at you. "Greetings, traveler! Care to see my wares? I have items you won\'t find in ordinary shops!"',
        locationTypes: ['wilderness', 'road', 'safe', 'neutral', 'village', 'town'],
        choices: [
          {
            text: 'Browse the merchant\'s wares',
            tags: ['shop', 'social']
          },
          {
            text: 'Ask about news and rumors',
            tags: ['information', 'social']
          },
          {
            text: 'Politely decline and move on',
            tags: ['leave', 'neutral']
          },
          {
            text: 'Be suspicious of the merchant',
            tags: ['cautious', 'observe']
          }
        ],
        tags: ['merchant', 'social', 'opportunity']
      },
      {
        title: 'Ambush!',
        description: 'Bandits attempt to ambush you on the road.',
        narrative: 'The path ahead narrows between two rocky outcroppings. As you proceed, several rough-looking figures emerge from hiding, weapons drawn. "Hand over your valuables," their leader demands, "and you might walk away from this."',
        locationTypes: ['wilderness', 'road', 'dangerous'],
        timeOfDay: 'night',
        choices: [
          {
            text: 'Prepare to defend yourself',
            tags: ['combat', 'brave']
          },
          {
            text: 'Try to talk your way out of the situation',
            tags: ['social', 'persuade']
          },
          {
            text: 'Look for an escape route',
            tags: ['flee', 'cautious']
          },
          {
            text: 'Surrender your valuables',
            effects: {
              inventory: {
                remove: ['gold', 'valuables']
              }
            },
            tags: ['surrender', 'cautious']
          }
        ],
        tags: ['danger', 'combat', 'bandits']
      },
      {
        title: 'Lost Traveler',
        description: 'You encounter someone in need of assistance.',
        narrative: 'You notice a distressed traveler sitting by the roadside. They look tired and disoriented. "Excuse me," they call out as they spot you. "I seem to have lost my way. Could you help me?"',
        locationTypes: ['wilderness', 'road', 'forest', 'neutral'],
        choices: [
          {
            text: 'Offer directions and assistance',
            effects: {
              relationships: { traveler: 20 }
            },
            tags: ['helpful', 'social']
          },
          {
            text: 'Share some of your supplies with them',
            effects: {
              relationships: { traveler: 30 },
              stats: { health: -5 }
            },
            tags: ['generous', 'helpful']
          },
          {
            text: 'Be cautious and ask questions first',
            tags: ['cautious', 'social']
          },
          {
            text: 'Tell them you can\'t help and continue on',
            tags: ['decline', 'neutral']
          }
        ],
        tags: ['social', 'help', 'opportunity']
      },
      {
        title: 'Strange Discovery',
        description: 'You find something unusual on your path.',
        narrative: 'Something catches your eye just off the path - a small, unusual object partially buried in the ground. It seems to emit a faint glow when the light hits it a certain way.',
        locationTypes: ['wilderness', 'forest', 'ruins', 'dungeon'],
        choices: [
          {
            text: 'Examine it more closely',
            tags: ['investigate', 'curious']
          },
          {
            text: 'Touch it carefully',
            tags: ['interact', 'risk']
          },
          {
            text: 'Leave it alone - it could be dangerous',
            tags: ['cautious', 'leave']
          },
          {
            text: 'Try to take it with you',
            effects: {
              inventory: {
                add: ['mysterious object']
              }
            },
            tags: ['loot', 'risk']
          }
        ],
        tags: ['mystery', 'discovery', 'magic']
      }
    ];
  }
}
