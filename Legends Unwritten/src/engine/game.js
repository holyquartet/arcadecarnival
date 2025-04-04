// legends-unwritten/src/engine/game.js
// Core game engine with main game loop

class GameEngine {
  constructor(config = {}) {
    this.player = null;
    this.currentScene = null;
    this.gameState = {
      visitedLocations: new Set(),
      completedQuests: new Set(),
      inventory: [],
      relationships: {}, // NPC relationship scores
      worldState: {
        time: 'morning',
        weather: 'clear',
        danger: 'low'
      },
      flags: {} // For tracking misc. game state
    };
    
    this.storyGenerator = config.storyGenerator || new StoryGenerator();
    this.eventGenerator = config.eventGenerator || new EventGenerator();
    this.dialogueGenerator = config.dialogueGenerator || new DialogueGenerator();
    this.saveManager = config.saveManager || new SaveManager();
    
    // Event listeners for UI interaction
    this.listeners = {
      onSceneChange: [],
      onPlayerUpdate: [],
      onGameStateChange: [],
      onChoiceMade: []
    };
  }
  
  // Initialize a new game
  async initGame(playerData) {
    this.player = new Player(playerData);
    this.gameState.flags = {};
    
    // Generate starting scene
    this.currentScene = await this.storyGenerator.generateStartingScene(this.player);
    this._triggerEvent('onSceneChange', this.currentScene);
    
    return this.currentScene;
  }
  
  // Load a saved game
  async loadGame(saveId) {
    const saveData = await this.saveManager.loadGame(saveId);
    if (!saveData) return false;
    
    this.player = new Player(saveData.player);
    this.gameState = saveData.gameState;
    this.currentScene = saveData.currentScene;
    
    this._triggerEvent('onPlayerUpdate', this.player);
    this._triggerEvent('onGameStateChange', this.gameState);
    this._triggerEvent('onSceneChange', this.currentScene);
    
    return true;
  }
  
  // Save current game
  async saveGame(saveId) {
    const saveData = {
      player: this.player,
      gameState: this.gameState,
      currentScene: this.currentScene,
      timestamp: Date.now()
    };
    
    return await this.saveManager.saveGame(saveId, saveData);
  }
  
  // Process player choice and advance game
  async makeChoice(choiceIndex) {
    const choice = this.currentScene.choices[choiceIndex];
    if (!choice) return null;
    
    // Apply any effects from this choice
    if (choice.effects) {
      this._applyEffects(choice.effects);
    }
    
    // Record choice
    this._triggerEvent('onChoiceMade', choice);
    
    // Check for random event
    const randomEvent = await this._checkForRandomEvent();
    if (randomEvent) {
      // Handle random event before proceeding
      this.currentScene = randomEvent;
      this._triggerEvent('onSceneChange', this.currentScene);
      return this.currentScene;
    }
    
    // Generate next scene based on choice
    this.currentScene = await this.storyGenerator.generateNextScene(
      this.player,
      this.gameState,
      choice,
      this.currentScene
    );
    
    this._triggerEvent('onSceneChange', this.currentScene);
    return this.currentScene;
  }
  
  // Check for and possibly generate a random event
  async _checkForRandomEvent() {
    // Determine if a random event should occur
    if (Math.random() < this._getRandomEventChance()) {
      return await this.eventGenerator.generateEvent(
        this.player,
        this.gameState,
        this.currentScene
      );
    }
    return null;
  }
  
  // Calculate chance of random event based on game state
  _getRandomEventChance() {
    // Base chance
    let chance = 0.15;
    
    // Adjust based on danger level
    if (this.gameState.worldState.danger === 'high') chance += 0.1;
    
    // Adjust based on location type
    if (this.currentScene.location.type === 'dangerous') chance += 0.1;
    if (this.currentScene.location.type === 'safe') chance -= 0.05;
    
    return Math.min(Math.max(chance, 0.05), 0.4); // Keep between 5% and 40%
  }
  
  // Apply effects from a choice to player/game state
  _applyEffects(effects) {
    if (effects.stats) {
      for (const [stat, value] of Object.entries(effects.stats)) {
        this.player.modifyStat(stat, value);
      }
      this._triggerEvent('onPlayerUpdate', this.player);
    }
    
    if (effects.inventory) {
      if (effects.inventory.add) {
        this.gameState.inventory.push(...effects.inventory.add);
      }
      if (effects.inventory.remove) {
        effects.inventory.remove.forEach(item => {
          const index = this.gameState.inventory.indexOf(item);
          if (index > -1) {
            this.gameState.inventory.splice(index, 1);
          }
        });
      }
    }
    
    if (effects.relationships) {
      for (const [npc, value] of Object.entries(effects.relationships)) {
        this.gameState.relationships[npc] = (this.gameState.relationships[npc] || 0) + value;
      }
    }
    
    if (effects.worldState) {
      Object.assign(this.gameState.worldState, effects.worldState);
    }
    
    if (effects.flags) {
      for (const [flag, value] of Object.entries(effects.flags)) {
        this.gameState.flags[flag] = value;
      }
    }
    
    if (effects.location) {
      this.gameState.visitedLocations.add(effects.location);
    }
    
    if (effects.quest) {
      this.gameState.completedQuests.add(effects.quest);
    }
    
    this._triggerEvent('onGameStateChange', this.gameState);
  }
  
  // Event handling
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }
  
  _triggerEvent(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
  }
  
  // Combat system
  async startCombat(enemy) {
    // Initialize combat state
    const combatState = {
      enemy,
      round: 1,
      playerHealth: this.player.stats.health,
      enemyHealth: enemy.stats.health,
      log: [`Combat with ${enemy.name} begins!`]
    };
    
    return combatState;
  }
  
  async processCombatAction(combatState, action) {
    const { enemy, round, playerHealth, enemyHealth, log } = combatState;
    
    // Calculate player action results
    let playerDamage = 0;
    let playerMessage = '';
    
    switch (action) {
      case 'attack':
        playerDamage = this._calculateDamage(
          this.player.stats.strength, 
          enemy.stats.defense
        );
        playerMessage = `You attack ${enemy.name} for ${playerDamage} damage!`;
        break;
      case 'magic':
        if (this.player.stats.mana >= 5) {
          this.player.modifyStat('mana', -5);
          playerDamage = this._calculateDamage(
            this.player.stats.intelligence * 1.5, 
            enemy.stats.resistance
          );
          playerMessage = `You cast a spell at ${enemy.name} for ${playerDamage} damage!`;
        } else {
          playerMessage = 'You don\'t have enough mana!';
        }
        break;
      case 'dodge':
        playerMessage = 'You prepare to dodge the enemy attack.';
        break;
    }
    
    // Apply player damage to enemy
    const newEnemyHealth = Math.max(0, enemyHealth - playerDamage);
    
    // Calculate enemy action and damage
    const enemyAction = this._determineEnemyAction(enemy, newEnemyHealth);
    let enemyDamage = 0;
    let enemyMessage = '';
    
    if (newEnemyHealth > 0) {
      switch (enemyAction) {
        case 'attack':
          // Reduce damage if player dodged
          const dodgeModifier = action === 'dodge' ? 0.5 : 1;
          enemyDamage = this._calculateDamage(
            enemy.stats.strength, 
            this.player.stats.defense
          ) * dodgeModifier;
          
          enemyMessage = `${enemy.name} attacks you for ${enemyDamage} damage!`;
          if (action === 'dodge') {
            enemyMessage += ' (Reduced by dodge)';
          }
          break;
        case 'special':
          enemyDamage = this._calculateDamage(
            enemy.stats.strength * 1.5, 
            this.player.stats.defense
          );
          enemyMessage = `${enemy.name} uses a special attack for ${enemyDamage} damage!`;
          break;
      }
    }
    
    // Apply enemy damage to player
    const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
    
    // Update combat state
    const newCombatState = {
      enemy,
      round: round + 1,
      playerHealth: newPlayerHealth,
      enemyHealth: newEnemyHealth,
      log: [
        ...log,
        playerMessage,
        enemyMessage,
        `Round ${round} ends. You: ${newPlayerHealth}HP, ${enemy.name}: ${newEnemyHealth}HP`
      ]
    };
    
    // Check for combat end
    if (newEnemyHealth <= 0) {
      newCombatState.log.push(`You defeated ${enemy.name}!`);
      newCombatState.result = 'victory';
      
      // Apply rewards
      if (enemy.rewards) {
        this._applyEffects(enemy.rewards);
        if (enemy.rewards.experience) {
          newCombatState.log.push(`You gained ${enemy.rewards.experience} experience!`);
        }
        if (enemy.rewards.inventory && enemy.rewards.inventory.add) {
          newCombatState.log.push(`You obtained: ${enemy.rewards.inventory.add.join(', ')}`);
        }
      }
    } else if (newPlayerHealth <= 0) {
      newCombatState.log.push('You have been defeated!');
      newCombatState.result = 'defeat';
      
      // Apply defeat consequences
      this.player.modifyStat('health', 1); // Restore minimal health
      // Could apply other defeat effects here
    }
    
    // If combat ended, update player health
    if (newCombatState.result) {
      this.player.stats.health = newPlayerHealth > 0 ? newPlayerHealth : 1;
      this._triggerEvent('onPlayerUpdate', this.player);
    }
    
    return newCombatState;
  }
  
  _calculateDamage(attackStat, defenseStat) {
    const baseDamage = attackStat;
    const defense = defenseStat / 2;
    const damage = Math.max(1, Math.floor(baseDamage - defense));
    
    // Add randomness
    const variation = Math.floor(damage * 0.2); // 20% variation
    return damage + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
  }
  
  _determineEnemyAction(enemy, enemyHealth) {
    // Simple AI for enemy actions
    if (enemyHealth < enemy.stats.health * 0.3 && Math.random() < 0.7) {
      // Desperate, likely to use special attack when low health
      return 'special';
    }
    
    if (Math.random() < 0.2) {
      // Small chance of special attack normally
      return 'special';
    }
    
    return 'attack';
  }
}

// Export for use in other modules
export default GameEngine;
