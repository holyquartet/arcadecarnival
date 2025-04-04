// legends-unwritten/src/generators/story-generator.js
// Dynamic story generation system

import { Scene } from '../models/scene.js';

class StoryGenerator {
  constructor(config = {}) {
    this.storyTemplates = config.storyTemplates || [];
    this.locationTemplates = config.locationTemplates || [];
    this.eventTemplates = config.eventTemplates || [];
    this.npcTemplates = config.npcTemplates || [];
    
    // Load default templates if none provided
    if (this.storyTemplates.length === 0) {
      this._loadDefaultTemplates();
    }
  }
  
  // Generate initial scene based on player character
  async generateStartingScene(player) {
    // Find appropriate starting template based on player archetype
    const templates = this.storyTemplates.filter(
      template => template.type === 'starting' && 
      (!template.archetypes || template.archetypes.includes(player.archetype))
    );
    
    if (templates.length === 0) {
      // Fallback to generic starting scene
      return this._createGenericStartingScene(player);
    }
    
    // Select random template from filtered list
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate scene from template
    return this._generateSceneFromTemplate(template, player);
  }
  
  // Generate next scene based on previous scene and choice
  async generateNextScene(player, gameState, choice, currentScene) {
    // Check if choice leads to a specific scene ID
    if (choice.nextSceneId) {
      const specificTemplate = this.storyTemplates.find(t => t.id === choice.nextSceneId);
      if (specificTemplate) {
        return this._generateSceneFromTemplate(specificTemplate, player, gameState);
      }
    }
    
    // Filter templates based on current scene tags, location, and choice
    let relevantTemplates = this.storyTemplates.filter(template => {
      // Skip starting scenes
      if (template.type === 'starting') return false;
      
      // Check requirements if any
      if (template.requirements && !this._meetsTemplateRequirements(template.requirements, player, gameState)) {
        return false;
      }
      
      // Check for matching tags
      if (template.requiredTags) {
        const hasAllTags = template.requiredTags.every(tag => currentScene.hasTag(tag));
        if (!hasAllTags) return false;
      }
      
      // Filter by choice tags if present
      if (choice.tags && template.choiceTags) {
        const hasMatchingChoiceTag = choice.tags.some(tag => template.choiceTags.includes(tag));
        if (!hasMatchingChoiceTag) return false;
      }
      
      // Filter by location continuity
      if (template.location && template.location.continuity === true) {
        if (template.location.name !== currentScene.location.name) {
          return false;
        }
      }
      
      return true;
    });
    
    // If no relevant templates, try less restrictive filtering
    if (relevantTemplates.length === 0) {
      relevantTemplates = this.storyTemplates.filter(template => 
        template.type !== 'starting' && 
        (!template.requirements || this._meetsTemplateRequirements(template.requirements, player, gameState))
      );
    }
    
    // If still no templates, create a generic continuation
    if (relevantTemplates.length === 0) {
      return this._createGenericContinuationScene(player, currentScene, choice);
    }
    
    // Weight templates by relevance
    const weightedTemplates = relevantTemplates.map(template => {
      let weight = template.weight || 1;
      
      // Increase weight for templates matching the current location
      if (template.location && template.location.name === currentScene.location.name) {
        weight *= 2;
      }
      
      // Increase weight for templates matching choice tags
      if (choice.tags && template.choiceTags) {
        const matchingTags = choice.tags.filter(tag => template.choiceTags.includes(tag));
        weight *= (1 + matchingTags.length * 0.5);
      }
      
      return { template, weight };
    });
    
    // Select template based on weights
    const template = this._selectWeightedRandom(weightedTemplates);
    
    // Generate scene from template
    return this._generateSceneFromTemplate(template, player, gameState, currentScene, choice);
  }
  
  // Generate a scene from a template
  async _generateSceneFromTemplate(template, player, gameState = {}, currentScene = null, choice = null) {
    // Create base scene from template
    const scene = new Scene({
      id: `scene_${Date.now()}`,
      title: this._processTemplate(template.title, player, gameState),
      description: template.description ? this._processTemplate(template.description, player, gameState) : '',
      tags: [...(template.tags || [])]
    });
    
    // Generate or continue location
    if (template.location && template.location.continuity === true && currentScene) {
      scene.location = { ...currentScene.location };
    } else if (template.location && template.location.name) {
      scene.location = {
        name: template.location.name,
        type: template.location.type || 'neutral',
        description: template.location.description || ''
      };
    } else {
      // Generate random location
      scene.location = this._generateRandomLocation(player);
    }
    
    // Process narrative text
    if (template.narrative) {
      if (Array.isArray(template.narrative)) {
        scene.narrative = template.narrative.map(text => 
          this._processTemplate(text, player, gameState, scene)
        );
      } else {
        scene.narrative = [this._processTemplate(template.narrative, player, gameState, scene)];
      }
    } else {
      // Generate a default narrative based on the scene
      scene.narrative = [this._generateDefaultNarrative(scene, player)];
    }
    
    // Process choices
    if (template.choices) {
      scene.choices = template.choices.map(choiceTemplate => ({
        text: this._processTemplate(choiceTemplate.text, player, gameState, scene),
        nextSceneId: choiceTemplate.nextSceneId || null,
        effects: choiceTemplate.effects || null,
        tags: choiceTemplate.tags || []
      }));
    } else {
      // Generate default choices
      scene.choices = this._generateDefaultChoices(scene, player);
    }
    
    // Add characters if specified
    if (template.characters) {
      scene.characters = await Promise.all(
        template.characters.map(async charTemplate => {
          // If character is specified by ID, find it
          if (typeof charTemplate === 'string') {
            const foundTemplate = this.npcTemplates.find(npc => npc.id === charTemplate);
            return foundTemplate ? this._generateCharacterFromTemplate(foundTemplate) : null;
          }
          // Otherwise generate from inline template
          return this._generateCharacterFromTemplate(charTemplate);
        })
      ).then(characters => characters.filter(Boolean)); // Remove null entries
    }
    
    // Add ambient details
    scene.music = template.music || null;
    scene.ambientSounds = template.ambientSounds || null;
    
    return scene;
  }
  
  // Create a generic starting scene for any player
  _createGenericStartingScene(player) {
    const locations = [
      { name: 'Crossroads Inn', type: 'safe', description: 'A cozy tavern at the crossroads between several towns.' },
      { name: 'Village Square', type: 'safe', description: 'The central gathering place of a small frontier village.' },
      { name: 'Harbor Docks', type: 'neutral', description: 'The busy docks of a coastal trading town.' },
      { name: 'Forest Edge', type: 'neutral', description: 'The boundary between civilization and the untamed wilds.' }
    ];
    
    const narratives = [
      `Your journey begins as you find yourself in the ${locations[0].name}. The possibilities of adventure stretch out before you, waiting to be seized.`,
      `The ${locations[1].name} bustles with activity as you arrive, marking the beginning of your adventure.`,
      `The salty air of the ${locations[2].name} fills your lungs as you contemplate the path ahead.`,
      `Standing at the ${locations[3].name}, you can feel the call of adventure pulling you forward.`
    ];
    
    const locationIndex = Math.floor(Math.random() * locations.length);
    
    return new Scene({
      title: 'The Beginning',
      description: 'Your adventure begins here.',
      location: locations[locationIndex],
      narrative: [narratives[locationIndex]],
      choices: [
        {
          text: 'Explore the surroundings',
          tags: ['explore']
        },
        {
          text: 'Talk to locals',
          tags: ['social']
        },
        {
          text: 'Check your belongings',
          effects: {
            flags: { checkedInventory: true }
          },
          tags: ['inventory']
        }
      ],
      tags: ['starting', 'introduction']
    });
  }
  
  // Create a generic continuation scene
  _createGenericContinuationScene(player, currentScene, choice) {
    // Determine if location should change based on choice
    const locationChange = choice.tags && (
      choice.tags.includes('travel') || 
      choice.tags.includes('explore') ||
      choice.tags.includes('leave')
    );
    
    const location = locationChange ? 
      this._generateRandomLocation(player) : 
      { ...currentScene.location };
    
    // Generate appropriate narrative
    let narrative;
    if (locationChange) {
      narrative = [
        `You make your way to ${location.name}. ${location.description}`,
        `What will you do here?`
      ];
    } else if (choice.tags && choice.tags.includes('social')) {
      narrative = [
        `After speaking with the locals, you learn more about your surroundings.`,
        `There seems to be more to discover in this place.`
      ];
    } else if (choice.tags && choice.tags.includes('combat')) {
      narrative = [
        `The threat dealt with, you catch your breath and consider your next move.`,
        `What path will you choose now?`
      ];
    } else {
      narrative = [
        `You continue your adventure, alert for any opportunities or dangers.`,
        `What will you do next?`
      ];
    }
    
    // Generate appropriate choices
    const choices = this._generateDefaultChoices({ location }, player);
    
    return new Scene({
      title: locationChange ? `At the ${location.name}` : `Continuing On`,
      location,
      narrative,
      choices,
      tags: locationChange ? ['new_location'] : ['continuation']
    });
  }
  
  // Generate default narrative for a scene
  _generateDefaultNarrative(scene, player) {
    const { location } = scene;
    
    // Simple location-based narrative
    const locationDesc = location.description || `A ${location.type || 'mysterious'} place.`;
    
    return `You find yourself at ${location.name}. ${locationDesc}`;
  }
  
  // Generate default choices based on scene and player
  _generateDefaultChoices(scene, player) {
    const defaultChoices = [
      {
        text: 'Explore further',
        tags: ['explore']
      },
      {
        text: 'Rest for a while',
        effects: {
          stats: { health: 5, mana: 5 }
        },
        tags: ['rest']
      }
    ];
    
    // Add location-specific choices
    if (scene.location) {
      switch (scene.location.type) {
        case 'town':
        case 'village':
        case 'safe':
          defaultChoices.push({
            text: 'Talk to locals',
            tags: ['social']
          });
          defaultChoices.push({
            text: 'Visit the market',
            tags: ['shop', 'social']
          });
          break;
        case 'wilderness':
        case 'dangerous':
          defaultChoices.push({
            text: 'Proceed with caution',
            tags: ['explore', 'danger']
          });
          defaultChoices.push({
            text: 'Look for resources',
            tags: ['gather']
          });
          break;
        case 'dungeon':
        case 'ruins':
          defaultChoices.push({
            text: 'Search for treasures',
            tags: ['loot', 'danger']
          });
          defaultChoices.push({
            text: 'Examine the area carefully',
            tags: ['investigate']
          });
          break;
      }
    }
    
    // Add archetype-specific choices
    switch (player.archetype) {
      case 'warrior':
        defaultChoices.push({
          text: 'Look for challenges',
          tags: ['combat']
        });
        break;
      case 'mage':
        defaultChoices.push({
          text: 'Study the surroundings for magical properties',
          tags: ['magic', 'investigate']
        });
        break;
      case 'rogue':
        defaultChoices.push({
          text: 'Look for something valuable',
          tags: ['steal', 'loot']
        });
        break;
      case 'diplomat':
        defaultChoices.push({
          text: 'Gather information',
          tags: ['social', 'investigate']
        });
        break;
    }
    
    // Add a "leave" option if in a specific location
    if (scene.location && scene.location.type !== 'wilderness') {
      defaultChoices.push({
        text: `Leave ${scene.location.name}`,
        tags: ['leave', 'travel']
      });
    }
    
    return defaultChoices;
  }
  
  // Generate a random location
  _generateRandomLocation(player) {
    // If we have location templates, use one
    if (this.locationTemplates.length > 0) {
      const template = this.locationTemplates[
        Math.floor(Math.random() * this.locationTemplates.length)
      ];
      
      return {
        name: template.name,
        type: template.type || 'neutral',
        description: template.description || ''
      };
    }
    
    // Otherwise generate a basic random location
    const locationTypes = [
      { type: 'village', names: ['Oakvale', 'Rivertown', 'Highfield', 'Westmarch'] },
      { type: 'wilderness', names: ['Dark Forest', 'Mountain Pass', 'Misty Valley', 'Rolling Hills'] },
      { type: 'dungeon', names: ['Ancient Ruins', 'Forgotten Crypt', 'Abandoned Mine', 'Mystical Cave'] },
      { type: 'town', names: ['Ironforge', 'Silverpine', 'Goldcrest', 'Stormhaven'] }
    ];
    
    const typeIndex = Math.floor(Math.random() * locationTypes.length);
    const nameIndex = Math.floor(Math.random() * locationTypes[typeIndex].names.length);
    
    const location = {
      name: locationTypes[typeIndex].names[nameIndex],
      type: locationTypes[typeIndex].type
    };
    
    // Generate description based on type
    switch (location.type) {
      case 'village':
        location.description = 'A small settlement with humble buildings and friendly locals.';
        break;
      case 'wilderness':
        location.description = 'Untamed nature surrounds you, full of both beauty and danger.';
        break;
      case 'dungeon':
        location.description = 'A foreboding place, dark and mysterious, promising both danger and treasure.';
        break;
      case 'town':
        location.description = 'A bustling place filled with various shops, inns, and plenty of potential opportunities.';
        break;
    }
    
    return location;
  }
  
  // Generate character from template
  _generateCharacterFromTemplate(template) {
    // Import NPC class if needed
    // const { NPC } = require('../models/npc');
    
    // Convert template to NPC
    return new NPC(template);
  }
  
  // Replace template variables with actual values
  _processTemplate(text, player, gameState = {}, scene = null) {
    if (!text) return '';
    
    // Replace player-related variables
    let processed = text
      .replace(/\{player\.name\}/g, player.name)
      .replace(/\{player\.archetype\}/g, player.archetype)
      .replace(/\{player\.background\.hometown\}/g, player.background.hometown);
    
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
  
  // Check if template requirements are met
  _meetsTemplateRequirements(requirements, player, gameState) {
    // Similar to Scene's meetsRequirements method
    
    // Check stat requirements
    if (requirements.stats) {
      for (const [stat, value] of Object.entries(requirements.stats)) {
        if ((player.stats[stat] || 0) < value) {
          return false;
        }
      }
    }
    
    // Check inventory requirements
    if (requirements.inventory) {
      for (const item of requirements.inventory) {
        if (!gameState.inventory.includes(item)) {
          return false;
        }
      }
    }
    
    // Check quest requirements
    if (requirements.quests) {
      for (const quest of requirements.quests) {
        if (!gameState.completedQuests.has(quest)) {
          return false;
        }
      }
    }
    
    // Check flag requirements
    if (requirements.flags) {
      for (const [flag, value] of Object.entries(requirements.flags)) {
        if (gameState.flags[flag] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Select a random element with weighting
  _selectWeightedRandom(weightedList) {
    const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedList) {
      random -= item.weight;
      if (random <= 0) {
        return item.template;
      }
    }
    
    // Fallback to first item if something goes wrong
    return weightedList[0].template;
  }
  
  // Load default story templates
  _loadDefaultTemplates() {
    // This would typically load from a JSON file or database
    // For now, we'll include a few basic templates directly
    
    this.storyTemplates = [
      {
        id: 'intro_tavern',
        type: 'starting',
        title: 'The Crossroads Inn',
        description: 'Your adventure begins at a cozy tavern.',
        location: {
          name: 'Crossroads Inn',
          type: 'safe',
          description: 'A warm, inviting tavern where travelers from all directions gather.'
        },
        narrative: [
          'The crackling fire illuminates the rustic interior of the Crossroads Inn. The aroma of hearty stew and fresh bread fills the air as travelers share tales of their journeys.',
          'As a {player.archetype}, you find yourself drawn to this place, perhaps by fate or mere coincidence.',
          'What will your story be?'
        ],
        choices: [
          {
            text: 'Approach the innkeeper for information',
            tags: ['social', 'information']
          },
          {
            text: 'Listen to the conversations around you',
            tags: ['observe', 'information']
          },
          {
            text: 'Check what supplies you have',
            effects: {
              flags: { checkedInventory: true }
            },
            tags: ['inventory']
          },
          {
            text: 'Step outside to survey the area',
            tags: ['explore']
          }
        ],
        tags: ['starting', 'tavern', 'peaceful']
      },
      {
        id: 'village_trouble',
        type: 'quest_start',
        title: 'Village in Need',
        description: 'A village faces mysterious troubles.',
        location: {
          name: 'Troubled Village',
          type: 'safe',
          description: 'A small village where the locals appear anxious and worried.'
        },
        narrative: [
          'As you arrive in the village, you notice the worried faces of the locals. They speak in hushed tones, and many doors remain firmly shut.',
          'An elderly villager approaches you, recognizing you as an outsider who might be able to help.',
          '"Thank the heavens, a {player.archetype}! Perhaps you can help us with our troubles..."'
        ],
        choices: [
          {
            text: 'Offer your assistance',
            tags: ['quest', 'helpful']
          },
          {
            text: 'Ask for more details before committing',
            tags: ['cautious', 'information']
          },
          {
            text: 'Politely decline and continue on your journey',
            tags: ['decline', 'leave']
          }
        ],
        tags: ['quest', 'village', 'mystery']
      },
      {
        id: 'forest_path',
        type: 'exploration',
        title: 'The Winding Forest Path',
        description: 'A path through mysterious woods.',
        location: {
          name: 'Ancient Forest',
          type: 'wilderness',
          description: 'A dense forest with towering trees and dappled sunlight filtering through the canopy.'
        },
        narrative: [
          'The forest path winds between ancient trees, their branches creating patterns of light and shadow on the ground. The air is rich with the scent of earth and vegetation.',
          'As you walk deeper into the woods, you sense that you're not alone among the trees.'
        ],
        choices: [
          {
            text: 'Continue down the path cautiously',
            tags: ['explore', 'cautious']
          },
          {
            text: 'Leave the path to investigate a strange sound',
            tags: ['investigate', 'danger']
          },
          {
            text: 'Find a good spot to rest',
            effects: {
              stats: { health: 10, mana: 10 }
            },
            tags: ['rest']
          },
          {
            text: 'Turn back toward more open ground',
            tags: ['retreat', 'leave']
          }
        ],
        tags: ['forest', 'nature', 'mystery']
      }
    ];
    
    // Sample location templates
    this.locationTemplates = [
      {
        name: 'Mistwood Forest',
        type: 'wilderness',
        description: 'A thick forest where mist clings to the ground and sunlight struggles to penetrate the dense canopy.'
      },
      {
        name: 'Stormhaven City',
        type: 'town',
        description: 'A bustling walled city, known for its strong defenses and skilled craftsmen.'
      },
      {
        name: 'Forgotten Ruins',
        type: 'dungeon',
        description: 'The crumbling remains of an ancient civilization, now home to dangers and treasures alike.'
      },
      {
        name: 'Riverdale Village',
        type: 'village',
        description: 'A peaceful farming community nestled alongside a gently flowing river.'
      },
      {
        name: 'Dragonspire Mountains',
        type: 'wilderness',
        description: 'Towering peaks shrouded in clouds, rumored to be the home of ancient dragons.'
      }
    ];
  }
}

