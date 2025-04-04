// legends-unwritten/src/ui/menu-ui.js
// Menu and navigation UI

class MenuUI {
  constructor(config = {}) {
    this.containerEl = config.containerEl || document.getElementById('menu-container');
    this.gameManager = config.gameManager;
    
    this._init();
  }
  
  // Initialize menu elements
  _init() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create menu elements
    this._createMainMenu();
  }
  
  // Create main menu
  _createMainMenu() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create title
    const titleEl = document.createElement('h1');
    titleEl.className = 'game-title';
    titleEl.textContent = 'Legends Unwritten';
    this.containerEl.appendChild(titleEl);
    
    // Create subtitle
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'game-subtitle';
    subtitleEl.textContent = 'A Dynamic Text Adventure';
    this.containerEl.appendChild(subtitleEl);
    
    // Create menu buttons
    const menuEl = document.createElement('div');
    menuEl.className = 'main-menu';
    
    // New Game button
    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'New Game';
    newGameBtn.addEventListener('click', () => {
      if (this.gameManager) {
        this.gameManager.startNewGame();
      }
    });
    menuEl.appendChild(newGameBtn);
    
    // Continue Game button (if saves exist)
    const saveManager = new SaveManager();
    const saves = saveManager.getSavesList();
    
    if (saves && saves.length > 0) {
      const continueBtn = document.createElement('button');
      continueBtn.textContent = 'Continue Game';
      continueBtn.addEventListener('click', () => {
        this._createLoadGameMenu();
      });
      menuEl.appendChild(continueBtn);
    }
    
    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = 'Settings';
    settingsBtn.addEventListener('click', () => {
      this._createSettingsMenu();
    });
    menuEl.appendChild(settingsBtn);
    
    // About button
    const aboutBtn = document.createElement('button');
    aboutBtn.textContent = 'About';
    aboutBtn.addEventListener('click', () => {
      this._createAboutScreen();
    });
    menuEl.appendChild(aboutBtn);
    
    this.containerEl.appendChild(menuEl);
  }
  
  // Create load game menu
  _createLoadGameMenu() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create title
    const titleEl = document.createElement('h2');
    titleEl.textContent = 'Load Game';
    this.containerEl.appendChild(titleEl);
    
    // Get saves
    const saveManager = new SaveManager();
    const saves = saveManager.getSavesList();
    
    // Create saves list
    const savesEl = document.createElement('div');
    savesEl.className = 'saves-list';
    
    saves.forEach(save => {
      const saveEl = document.createElement('div');
      saveEl.className = 'save-item';
      
      const saveInfo = document.createElement('div');
      saveInfo.className = 'save-info';
      
      const saveName = document.createElement('h3');
      saveName.textContent = `${save.player.name} - Level ${save.player.stats.level} ${save.player.archetype}`;
      
      const saveDate = document.createElement('p');
      saveDate.textContent = new Date(save.timestamp).toLocaleString();
      
      saveInfo.appendChild(saveName);
      saveInfo.appendChild(saveDate);
      saveEl.appendChild(saveInfo);
      
      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', () => {
        if (this.gameManager) {
          this.gameManager.loadGame(save.id);
        }
      });
      saveEl.appendChild(loadBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this save?')) {
          saveManager.deleteSave(save.id);
          this._createLoadGameMenu(); // Refresh menu
        }
      });
      saveEl.appendChild(deleteBtn);
      
      savesEl.appendChild(saveEl);
    });
    
    this.containerEl.appendChild(savesEl);
    
    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = 'Back to Menu';
    backBtn.addEventListener('click', () => {
      this._createMainMenu();
    });
    this.containerEl.appendChild(backBtn);
  }
  
  // Create settings menu
  _createSettingsMenu() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create title
    const titleEl = document.createElement('h2');
    titleEl.textContent = 'Settings';
    this.containerEl.appendChild(titleEl);
    
    // Create settings form
    const settingsForm = document.createElement('div');
    settingsForm.className = 'settings-form';
    
    // Animation toggle
    const animationGroup = document.createElement('div');
    animationGroup.className = 'settings-group';
    
    const animationLabel = document.createElement('label');
    animationLabel.textContent = 'Text Animations:';
    animationLabel.setAttribute('for', 'animation-toggle');
    
    const animationToggle = document.createElement('input');
    animationToggle.type = 'checkbox';
    animationToggle.id = 'animation-toggle';
    animationToggle.checked = localStorage.getItem('textAnimations') !== 'false';
    
    animationToggle.addEventListener('change', () => {
      localStorage.setItem('textAnimations', animationToggle.checked);
    });
    
    animationGroup.appendChild(animationLabel);
    animationGroup.appendChild(animationToggle);
    settingsForm.appendChild(animationGroup);
    
    // Text speed
    const speedGroup = document.createElement('div');
    speedGroup.className = 'settings-group';
    
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Text Speed:';
    speedLabel.setAttribute('for', 'text-speed');
    
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.id = 'text-speed';
    speedSlider.min = '10';
    speedSlider.max = '100';
    speedSlider.value = localStorage.getItem('textSpeed') || '30';
    
    speedSlider.addEventListener('change', () => {
      localStorage.setItem('textSpeed', speedSlider.value);
    });
    
    speedGroup.appendChild(speedLabel);
    speedGroup.appendChild(speedSlider);
    settingsForm.appendChild(speedGroup);
    
    this.containerEl.appendChild(settingsForm);
    
    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = 'Back to Menu';
    backBtn.addEventListener('click', () => {
      this._createMainMenu();
    });
    this.containerEl.appendChild(backBtn);
  }
  
  // Create about screen
  _createAboutScreen() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create title
    const titleEl = document.createElement('h2');
    titleEl.textContent = 'About Legends Unwritten';
    this.containerEl.appendChild(titleEl);
    
    // Create about content
    const aboutContent = document.createElement('div');
    aboutContent.className = 'about-content';
    
    const description = document.createElement('p');
    description.textContent = 'Legends Unwritten is a dynamic text-based adventure game where your choices shape the story. The game engine generates unique storylines based on your decisions, creating a personalized experience every time you play.';
    aboutContent.appendChild(description);
    
    const howToPlay = document.createElement('h3');
    howToPlay.textContent = 'How to Play';
    aboutContent.appendChild(howToPlay);
    
    const instructions = document.createElement('p');
    instructions.textContent = 'Read the narrative text and choose from the available options to progress through the story. Your character\'s traits and your previous choices will influence the events that unfold.';
    aboutContent.appendChild(instructions);
    
    const credits = document.createElement('h3');
    credits.textContent = 'Credits';
    aboutContent.appendChild(credits);
    
    const creditsText = document.createElement('p');
    creditsText.textContent = 'Created with ❤️ by [Your Name]. Powered by the Legends Unwritten game engine.';
    aboutContent.appendChild(creditsText);
    
    this.containerEl.appendChild(aboutContent);
    
    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = 'Back to Menu';
    backBtn.addEventListener('click', () => {
      this._createMainMenu();
    });
    this.containerEl.appendChild(backBtn);
  }
  
  // Show in-game menu
  showInGameMenu() {
    // Create overlay
    const overlayEl = document.createElement('div');
    overlayEl.className = 'menu-overlay';
    
    // Create menu
    const menuEl = document.createElement('div');
    menuEl.className = 'in-game-menu';
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue Game';
    continueBtn.addEventListener('click', () => {
      overlayEl.remove();
    });
    menuEl.appendChild(continueBtn);
    
    // Save Game button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Game';
    saveBtn.addEventListener('click', () => {
      if (this.gameManager) {
        this.gameManager.saveGame();
        
        // Show save confirmation
        const confirmEl = document.createElement('div');
        confirmEl.className = 'save-confirmation';
        confirmEl.textContent = 'Game Saved!';
        menuEl.appendChild(confirmEl);
        
        setTimeout(() => {
          confirmEl.remove();
        }, 2000);
      }
    });
    menuEl.appendChild(saveBtn);
    
    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = 'Settings';
    settingsBtn.addEventListener('click', () => {
      // Replace menu contents with settings
      menuEl.innerHTML = '';
      
      // Create settings title
      const titleEl = document.createElement('h2');
      titleEl.textContent = 'Settings';
      menuEl.appendChild(titleEl);
      
      // Create settings controls (similar to _createSettingsMenu)
      // ...
      
      // Back button
      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', () => {
        this.showInGameMenu();
      });
      menuEl.appendChild(backBtn);
    });
    menuEl.appendChild(settingsBtn);
    
    // Main Menu button
    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.textContent = 'Exit to Main Menu';
    mainMenuBtn.addEventListener('click', () => {
      if (confirm('Return to main menu? Unsaved progress will be lost.')) {
        overlayEl.remove();
        this._createMainMenu();
        
        if (this.gameManager) {
          this.gameManager.exitToMainMenu();
        }
      }
    });
    menuEl.appendChild(mainMenuBtn);
    
    overlayEl.appendChild(menuEl);
    document.body.appendChild(overlayEl);
    
    // Close menu when clicking outside
    overlayEl.addEventListener('click', event => {
      if (event.target === overlayEl) {
        overlayEl.remove();
      }
    });
  }
}

// Export the UI components
export { GameUI, MenuUI };
