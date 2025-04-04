// legends-unwritten/src/main.js
// Entry point for the application

import { GameManager } from './managers/game-manager.js';

// Sample story content (this would typically be loaded from JSON files)
import { loadStoryContent } from './data/story-content.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize game
  initGame();
});

// Initialize the game
async function initGame() {
  try {
    // Load story content
    const storyContent = await loadStoryContent();
    
    // Create game manager with configuration
    const gameManager = new GameManager({
      gameContainer: document.getElementById('game-container'),
      menuContainer: document.getElementById('menu-container'),
      storyConfig: {
        storyTemplates: storyContent.storyTemplates,
        locationTemplates: storyContent.locationTemplates,
        npcTemplates: storyContent.npcTemplates
      },
      eventConfig: {
        eventTemplates: storyContent.eventTemplates
      },
      dialogueConfig: {
        dialoguePatterns: storyContent.dialoguePatterns,
        responseTemplates: storyContent.responseTemplates
      }
    });
    
    // Initialize game
    gameManager.init();
    
    // Expose game manager to window for debugging (remove in production)
    window.gameManager = gameManager;
    
  } catch (error) {
    console.error('Error initializing game:', error);
    displayErrorMessage('Failed to initialize the game. Please refresh the page and try again.');
  }
}

// Display error message on page
function displayErrorMessage(message) {
  const container = document.querySelector('.container');
  
  // Create error element
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `
    <h2>Error</h2>
    <p>${message}</p>
    <button onclick="location.reload()">Reload Page</button>
  `;
  
  // Clear container and append error
  container.innerHTML = '';
  container.appendChild(errorEl);
}