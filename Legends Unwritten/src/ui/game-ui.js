// legends-unwritten/src/ui/game-ui.js
// User interface manager for the game

class GameUI {
  constructor(config = {}) {
    this.containerEl = config.containerEl || document.getElementById('game-container');
    this.outputEl = null;
    this.choicesEl = null;
    this.statusEl = null;
    
    this.animations = config.animations === false ? false : true;
    this.textSpeed = config.textSpeed || 30; // ms per character
    
    this.currentAnimation = null;
    
    this._init();
  }
  
  // Initialize UI elements
  _init() {
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Create output area for narrative text
    this.outputEl = document.createElement('div');
    this.outputEl.className = 'game-output';
    this.containerEl.appendChild(this.outputEl);
    
    // Create choices area
    this.choicesEl = document.createElement('div');
    this.choicesEl.className = 'game-choices';
    this.containerEl.appendChild(this.choicesEl);
    
    // Create status bar
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'game-status';
    this.containerEl.appendChild(this.statusEl);
  }
  
  // Display a scene
  async displayScene(scene, player, gameState) {
    // Clear previous content
    this.outputEl.innerHTML = '';
    this.choicesEl.innerHTML = '';
    
    // Display location heading
    const locationEl = document.createElement('div');
    locationEl.className = 'game-location';
    locationEl.textContent = scene.location.name;
    this.outputEl.appendChild(locationEl);
    
    // Display scene title
    const titleEl = document.createElement('h2');
    titleEl.className = 'game-title';
    titleEl.textContent = scene.title;
    this.outputEl.appendChild(titleEl);
    
    // Display narrative text with typing animation
    for (const paragraph of scene.narrative) {
      const paragraphEl = document.createElement('p');
      paragraphEl.className = 'game-paragraph';
      this.outputEl.appendChild(paragraphEl);
      
      if (this.animations) {
        await this._animateText(paragraphEl, paragraph);
      } else {
        paragraphEl.textContent = paragraph;
      }
    }
    
    // Display choices
    await this._displayChoices(scene.choices);
    
    // Update status bar
    this._updateStatus(player, gameState);
    
    // Scroll to end of output
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  // Display choices
  async _displayChoices(choices) {
    // Clear previous choices
    this.choicesEl.innerHTML = '';
    
    // Add some delay before showing choices
    if (this.animations) {
      await this._delay(500);
    }
    
    // Create list for choices
    const listEl = document.createElement('ul');
    listEl.className = 'choice-list';
    this.choicesEl.appendChild(listEl);
    
    // Add each choice as a button
    choices.forEach((choice, index) => {
      const itemEl = document.createElement('li');
      
      const buttonEl = document.createElement('button');
      buttonEl.className = 'choice-button';
      buttonEl.textContent = choice.text;
      buttonEl.dataset.index = index;
      
      // Add choice tags as data attributes for styling
      if (choice.tags) {
        choice.tags.forEach(tag => {
          buttonEl.dataset[tag] = true;
        });
      }
      
      itemEl.appendChild(buttonEl);
      listEl.appendChild(itemEl);
      
      // Add with a slight delay for each button if animations enabled
      if (this.animations) {
        itemEl.style.opacity = '0';
        setTimeout(() => {
          itemEl.style.opacity = '1';
        }, 100 * index);
      }
    });
  }
  
  // Update the status bar with player info
  _updateStatus(player, gameState) {
    this.statusEl.innerHTML = '';
    
    // Create player info section
    const playerInfo = document.createElement('div');
    playerInfo.className = 'player-info';
    
    // Name and level
    const nameEl = document.createElement('span');
    nameEl.className = 'player-name';
    nameEl.textContent = `${player.name} - Level ${player.stats.level} ${player.archetype}`;
    playerInfo.appendChild(nameEl);
    
    // Health
    const healthEl = document.createElement('div');
    healthEl.className = 'player-health';
    healthEl.innerHTML = `Health: <span>${player.stats.health}/${player.stats.maxHealth}</span>`;
    playerInfo.appendChild(healthEl);
    
    // Mana if applicable
    if (player.stats.mana !== undefined) {
      const manaEl = document.createElement('div');
      manaEl.className = 'player-mana';
      manaEl.innerHTML = `Mana: <span>${player.stats.mana}/${player.stats.maxMana}</span>`;
      playerInfo.appendChild(manaEl);
    }
    
    // Add player info to status bar
    this.statusEl.appendChild(playerInfo);
    
    // Create world info section
    const worldInfo = document.createElement('div');
    worldInfo.className = 'world-info';
    
    // Time and weather
    if (gameState.worldState) {
      const timeWeatherEl = document.createElement('span');
      timeWeatherEl.className = 'time-weather';
      timeWeatherEl.textContent = `${gameState.worldState.time} - ${gameState.worldState.weather}`;
      worldInfo.appendChild(timeWeatherEl);
    }
    
    // Add world info to status bar
    this.statusEl.appendChild(worldInfo);
  }
  
  // Display a combat interface
  async displayCombat(combatState, player) {
    // Clear output area
    this.outputEl.innerHTML = '';
    
    // Create combat header
    const combatHeader = document.createElement('div');
    combatHeader.className = 'combat-header';
    combatHeader.textContent = `Combat: ${player.name} vs ${combatState.enemy.name}`;
    this.outputEl.appendChild(combatHeader);
    
    // Create health displays
    const healthDisplay = document.createElement('div');
    healthDisplay.className = 'combat-health-display';
    
    const playerHealthEl = document.createElement('div');
    playerHealthEl.className = 'player-combat-health';
    playerHealthEl.innerHTML = `Your Health: <span>${combatState.playerHealth}/${player.stats.maxHealth}</span>`;
    
    const enemyHealthEl = document.createElement('div');
    enemyHealthEl.className = 'enemy-combat-health';
    enemyHealthEl.innerHTML = `${combatState.enemy.name}: <span>${combatState.enemyHealth}/${combatState.enemy.stats.health}</span>`;
    
    healthDisplay.appendChild(playerHealthEl);
    healthDisplay.appendChild(enemyHealthEl);
    this.outputEl.appendChild(healthDisplay);
    
    // Create combat log
    const combatLog = document.createElement('div');
    combatLog.className = 'combat-log';
    
    // Add each log entry
    for (const entry of combatState.log) {
      const logEntry = document.createElement('p');
      logEntry.textContent = entry;
      combatLog.appendChild(logEntry);
    }
    
    this.outputEl.appendChild(combatLog);
    
    // Check if combat is over
    if (combatState.result) {
      // Combat is over, show continue button
      const continueChoice = [{ text: 'Continue', tags: ['continue'] }];
      await this._displayChoices(continueChoice);
    } else {
      // Show combat action choices
      const combatChoices = [
        { text: 'Attack', tags: ['combat', 'attack'] },
        { text: 'Dodge', tags: ['combat', 'dodge'] }
      ];
      
      // Add magic option if player has mana
      if (player.stats.mana >= 5) {
        combatChoices.push({ text: 'Cast Spell', tags: ['combat', 'magic'] });
      }
      
      await this._displayChoices(combatChoices);
    }
    
    // Scroll to bottom of combat log
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  // Display character creation interface
  async displayCharacterCreation() {
    this.outputEl.innerHTML = '';
    this.choicesEl.innerHTML = '';
    
    // Title
    const titleEl = document.createElement('h1');
    titleEl.className = 'create-character-title';
    titleEl.textContent = 'Create Your Character';
    this.outputEl.appendChild(titleEl);
    
    // Character form
    const formEl = document.createElement('div');
    formEl.className = 'character-form';
    
    // Name input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Character Name:';
    nameLabel.setAttribute('for', 'character-name');
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'character-name';
    nameInput.placeholder = 'Enter your character name';
    
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    formEl.appendChild(nameGroup);
    
    // Archetype selection
    const archetypeGroup = document.createElement('div');
    archetypeGroup.className = 'form-group';
    
    const archetypeLabel = document.createElement('label');
    archetypeLabel.textContent = 'Choose your Archetype:';
    archetypeGroup.appendChild(archetypeLabel);
    
    const archetypes = [
      { id: 'warrior', name: 'Warrior', description: 'Strong in combat with high health and strength.' },
      { id: 'mage', name: 'Mage', description: 'Skilled in magic with high intelligence and mana.' },
      { id: 'rogue', name: 'Rogue', description: 'Cunning and quick with high dexterity.' },
      { id: 'diplomat', name: 'Diplomat', description: 'Charismatic and persuasive with high charisma.' }
    ];
    
    const archetypeOptions = document.createElement('div');
    archetypeOptions.className = 'archetype-options';
    
    archetypes.forEach(archetype => {
      const option = document.createElement('div');
      option.className = 'archetype-option';
      option.dataset.archetype = archetype.id;
      
      const optionName = document.createElement('h3');
      optionName.textContent = archetype.name;
      
      const optionDesc = document.createElement('p');
      optionDesc.textContent = archetype.description;
      
      option.appendChild(optionName);
      option.appendChild(optionDesc);
      archetypeOptions.appendChild(option);
      
      // Add click handler
      option.addEventListener('click', () => {
        // Remove selected class from all options
        document.querySelectorAll('.archetype-option').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selected class to this option
        option.classList.add('selected');
      });
    });
    
    archetypeGroup.appendChild(archetypeOptions);
    formEl.appendChild(archetypeGroup);
    
    this.outputEl.appendChild(formEl);
    
    // Create start button
    const startButton = document.createElement('button');
    startButton.className = 'start-game-button';
    startButton.textContent = 'Begin Your Adventure';
    startButton.disabled = true;
    
    this.choicesEl.appendChild(startButton);
    
    // Enable button when both name and archetype are selected
    const validateForm = () => {
      const name = nameInput.value.trim();
      const selectedArchetype = document.querySelector('.archetype-option.selected');
      
      startButton.disabled = !(name && selectedArchetype);
    };
    
    nameInput.addEventListener('input', validateForm);
    archetypeOptions.addEventListener('click', validateForm);
    
    // Return a promise that resolves with the character data when the form is submitted
    return new Promise(resolve => {
      startButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const archetype = document.querySelector('.archetype-option.selected').dataset.archetype;
        
        resolve({
          name,
          archetype
        });
      });
    });
  }
  
  // Display a notification message
  async displayNotification(message, type = 'info') {
    const notificationEl = document.createElement('div');
    notificationEl.className = `game-notification ${type}`;
    notificationEl.textContent = message;
    
    // Add to container temporarily
    this.containerEl.appendChild(notificationEl);
    
    // Animate in
    setTimeout(() => {
      notificationEl.classList.add('visible');
    }, 10);
    
    // Remove after delay
    return new Promise(resolve => {
      setTimeout(() => {
        notificationEl.classList.remove('visible');
        
        // Remove from DOM after animation
        setTimeout(() => {
          notificationEl.remove();
          resolve();
        }, 300);
      }, 3000);
    });
  }
  
  // Animate text typing effect
  async _animateText(element, text) {
    // Cancel any existing animation
    if (this.currentAnimation) {
      clearInterval(this.currentAnimation);
    }
    
    return new Promise(resolve => {
      let index = 0;
      element.textContent = '';
      
      this.currentAnimation = setInterval(() => {
        // Add next character
        element.textContent += text[index];
        index++;
        
        // Check if animation is complete
        if (index >= text.length) {
          clearInterval(this.currentAnimation);
          this.currentAnimation = null;
          resolve();
        }
      }, this.textSpeed);
    });
  }
  
  // Helper method to create a delay
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Add a click handler for choice buttons
  onChoiceClick(callback) {
    this.choicesEl.addEventListener('click', event => {
      const button = event.target.closest('.choice-button');
      if (button) {
        const index = parseInt(button.dataset.index, 10);
        callback(index);
      }
    });
  }
}
