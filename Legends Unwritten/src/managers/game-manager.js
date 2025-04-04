// legends-unwritten/src/managers/game-manager.js
// Main game manager to coordinate all components

import GameEngine from '../engine/game.js';
import { Player } from '../models/player.js';
import { StoryGenerator, EventGenerator, DialogueGenerator } from '../generators/story-generator.js';
import { GameUI, MenuUI } from '../ui/game-ui.js';
import SaveManager from './save-manager.js';

class GameManager {
  constructor(config = {}) {
    this.gameContainer = config.gameContainer || document.getElementById('game-container');
    this.menuContainer = config.menuContainer || document.getElementById('menu-container');
    
    // Initialize components
    this.saveManager = new SaveManager();
    
    this.storyGenerator = new StoryGenerator(config.storyConfig);
    this.eventGenerator = new EventGenerator(config.eventConfig);
    this.dialogueGenerator = new DialogueGenerator(config.dialogueConfig);
    
    this.gameEngine = new GameEngine({
      storyGenerator: this.storyGenerator,
      eventGenerator: this.eventGenerator,
      dialogueGenerator: this.dialogueGenerator,
      saveManager: this.saveManager
    });
    
    // Get UI settings from local storage
    const textAnimations = localStorage.getItem('textAnimations') !== 'false';
    const textSpeed = parseInt(localStorage.getItem('textSpeed') || '30', 10);
    
    this.gameUI = new GameUI({
      containerEl: this.gameContainer,
      animations: textAnimations,
      textSpeed: textSpeed
    });
    
    this.menuUI = new MenuUI({
      containerEl: this.menuContainer,
      gameManager: this
    });
    
    // Current game state
    this.gameActive = false;
    this.inCombat = false;
    this.combatState = null;
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  // Initialize the game
  init() {
    // Show main menu
    this._showMainMenu();
    
    // Set up keyboard shortcuts
    window.addEventListener('keydown', event => {
      // ESC key for menu
      if (event.key === 'Escape' && this.gameActive) {
        this.menuUI.showInGameMenu();
      }
      
      // Quick save (Ctrl+S)
      if (event.key === 's' && event.ctrlKey && this.gameActive) {
        event.preventDefault();
        this.quickSave();
      }
      
      // Quick load (Ctrl+L)
      if (event.key === 'l' && event.ctrlKey && this.gameActive) {
        event.preventDefault();
        this.quickLoad();
      }
    });
  }
  
  // Start a new game
  async startNewGame() {
    try {
      // Hide menu container
      this.menuContainer.style.display = 'none';
      
      // Show game container
      this.gameContainer.style.display = 'block';
      
      // Display character creation screen
      const characterData = await this.gameUI.displayCharacterCreation();
      
      // Initialize game with new character
      const scene = await this.gameEngine.initGame(characterData);
      
      // Display initial scene
      await this.gameUI.displayScene(scene, this.gameEngine.player, this.gameEngine.gameState);
      
      // Set game as active
      this.gameActive = true;
      
      return true;
    } catch (error) {
      console.error('Error starting new game:', error);
      return false;
    }
  }
  
  // Load a saved game
  async loadGame(saveId) {
    try {
      // Hide menu container
      this.menuContainer.style.display = 'none';
      
      // Show game container
      this.gameContainer.style.display = 'block';
      
      // Load game data
      const success = await this.gameEngine.loadGame(saveId);
      
      if (!success) {
        throw new Error('Failed to load game data');
      }
      
      // Display the current scene
      await this.gameUI.displayScene(
        this.gameEngine.currentScene, 
        this.gameEngine.player, 
        this.gameEngine.gameState
      );
      
      // Set game as active
      this.gameActive = true;
      
      return true;
    } catch (error) {
      console.error('Error loading game:', error);
      this.gameUI.displayNotification('Error loading game', 'error');
      this._showMainMenu();
      return false;
    }
  }
  
  // Save the current game
  async saveGame(saveId) {
    if (!this.gameActive) return false;
    
    try {
      // Generate save ID if not provided
      if (!saveId) {
        saveId = `save_${Date.now()}`;
      }
      
      // Save current game
      const savedId = await this.gameEngine.saveGame(saveId);
      
      if (savedId) {
        this.gameUI.displayNotification('Game saved successfully', 'success');
        return true;
      } else {
        throw new Error('Failed to save game');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      this.gameUI.displayNotification('Error saving game', 'error');
      return false;
    }
  }
  
  // Quick save
  async quickSave() {
    return this.saveGame('quicksave');
  }
  
  // Quick load
  async quickLoad() {
    if (await this.loadGame('quicksave')) {
      this.gameUI.displayNotification('Game loaded successfully', 'success');
      return true;
    }
    return false;
  }
  
  // Process player choice
  async processChoice(choiceIndex) {
    if (!this.gameActive) return;
    
    try {
      if (this.inCombat) {
        await this._processCombatChoice(choiceIndex);
      } else {
        await this._processNarrativeChoice(choiceIndex);
      }
    } catch (error) {
      console.error('Error processing choice:', error);
      this.gameUI.displayNotification('Error processing choice', 'error');
    }
  }
  
  // Process narrative choice
  async _processNarrativeChoice(choiceIndex) {
    // Get next scene based on choice
    const nextScene = await this.gameEngine.makeChoice(choiceIndex);
    
    if (!nextScene) {
      this.gameUI.displayNotification('Invalid choice', 'error');
      return;
    }
    
    // Check if this is a combat scene
    if (nextScene.hasTag('combat_start')) {
      // Extract enemy data from scene
      const enemy = nextScene.characters.find(char => char.type === 'hostile');
      
      if (enemy) {
        // Start combat
        this.combatState = await this.gameEngine.startCombat(enemy);
        this.inCombat = true;
        
        // Display combat interface
        await this.gameUI.displayCombat(this.combatState, this.gameEngine.player);
        return;
      }
    }
    
    // Display new scene
    await this.gameUI.displayScene(
      nextScene,
      this.gameEngine.player,
      this.gameEngine.gameState
    );
  }
  
  // Process combat choice
  async _processCombatChoice(choiceIndex) {
    const choices = ['attack', 'dodge', 'magic'];
    const action = choices[choiceIndex] || 'attack';
    
    // Process combat action
    this.combatState = await this.gameEngine.processCombatAction(
      this.combatState,
      action
    );
    
    // Update combat display
    await this.gameUI.displayCombat(this.combatState, this.gameEngine.player);
    
    // Check if combat is over
    if (this.combatState.result) {
      // If player clicked "Continue" after combat ended
      if (choiceIndex === 0 && this.combatState.result) {
        this.inCombat = false;
        
        // Generate post-combat scene
        const nextScene = await this.storyGenerator.generateNextScene(
          this.gameEngine.player,
          this.gameEngine.gameState,
          { 
            text: 'Continue', 
            tags: [this.combatState.result === 'victory' ? 'combat_victory' : 'combat_defeat']
          },
          this.gameEngine.currentScene
        );
        
        // Update current scene
        this.gameEngine.currentScene = nextScene;
        
        // Display new scene
        await this.gameUI.displayScene(
          nextScene,
          this.gameEngine.player,
          this.gameEngine.gameState
        );
      }
    }
  }
  
  // Exit to main menu
  exitToMainMenu() {
    // Reset game state
    this.gameActive = false;
    this.inCombat = false;
    this.combatState = null;
    
    // Hide game container
    this.gameContainer.style.display = 'none';
    
    // Show menu container
    this.menuContainer.style.display = 'block';
    
    // Ensure menu is displayed
    this._showMainMenu();
  }
  
  // Set up event listeners
  _setupEventListeners() {
    // Listen for choice clicks
    this.gameUI.onChoiceClick(index => {
      this.processChoice(index);
    });
    
    // Listen for game engine events
    this.gameEngine.on('onPlayerUpdate', player => {
      // Update UI with player changes
    });
    
    this.gameEngine.on('onGameStateChange', gameState => {
      // Update UI with game state changes
    });
  }
  
  // Show main menu
  _showMainMenu() {
    // Hide game container
    this.gameContainer.style.display = 'none';
    
    // Show menu container
    this.menuContainer.style.display = 'block';
    
    // Create main menu
    this.menuUI._createMainMenu();
  }
}

// Export the managers
export { SaveManager, GameManager };
