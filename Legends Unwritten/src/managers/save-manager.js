// legends-unwritten/src/managers/save-manager.js
// Handles saving and loading game data

class SaveManager {
  constructor() {
    this.storageKey = 'legends-unwritten-saves';
    this.maxSaves = 10;
  }
  
  // Get list of all save games
  getSavesList() {
    try {
      const saves = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return saves.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    } catch (error) {
      console.error('Error loading saves list:', error);
      return [];
    }
  }
  
  // Save game data
  async saveGame(saveId, saveData) {
    try {
      // Generate unique ID if none provided
      if (!saveId) {
        saveId = `save_${Date.now()}`;
      }
      
      // Get existing saves
      let saves = this.getSavesList();
      
      // Find if save already exists
      const existingIndex = saves.findIndex(save => save.id === saveId);
      
      // Update save data
      const saveInfo = {
        id: saveId,
        player: {
          name: saveData.player.name,
          archetype: saveData.player.archetype,
          stats: saveData.player.stats
        },
        currentScene: {
          title: saveData.currentScene.title,
          location: saveData.currentScene.location
        },
        timestamp: saveData.timestamp || Date.now()
      };
      
      if (existingIndex >= 0) {
        // Update existing save in list
        saves[existingIndex] = saveInfo;
      } else {
        // Add new save to list
        saves.push(saveInfo);
        
        // Limit number of saves
        if (saves.length > this.maxSaves) {
          saves = saves.slice(0, this.maxSaves);
        }
      }
      
      // Save the list of saves
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
      
      // Save the full game data
      localStorage.setItem(`save_data_${saveId}`, JSON.stringify(saveData));
      
      return saveId;
    } catch (error) {
      console.error('Error saving game:', error);
      return null;
    }
  }
  
  // Load game data
  async loadGame(saveId) {
    try {
      const saveData = localStorage.getItem(`save_data_${saveId}`);
      
      if (!saveData) {
        return null;
      }
      
      return JSON.parse(saveData);
    } catch (error) {
      console.error('Error loading game:', error);
      return null;
    }
  }
  
  // Delete a save game
  deleteSave(saveId) {
    try {
      // Get existing saves
      let saves = this.getSavesList();
      
      // Filter out the save to delete
      saves = saves.filter(save => save.id !== saveId);
      
      // Save updated list
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
      
      // Remove full save data
      localStorage.removeItem(`save_data_${saveId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting save:', error);
      return false;
    }
  }
  
  // Create quick save
  async quickSave(saveData) {
    return this.saveGame('quicksave', saveData);
  }
  
  // Load quick save
  async quickLoad() {
    return this.loadGame('quicksave');
  }
  
  // Export save to file
  exportSave(saveId) {
    try {
      const saveData = localStorage.getItem(`save_data_${saveId}`);
      
      if (!saveData) {
        return null;
      }
      
      const dataBlob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `legends-unwritten-${saveId}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting save:', error);
      return false;
    }
  }
  
  // Import save from file
  async importSave(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = event => {
          try {
            const saveData = JSON.parse(event.target.result);
            
            if (!saveData || !saveData.player || !saveData.currentScene) {
              reject(new Error('Invalid save file format'));
              return;
            }
            
            // Generate a new save ID
            const saveId = `save_${Date.now()}`;
            
            // Save the imported data
            this.saveGame(saveId, saveData).then(result => {
              resolve(saveId);
            }).catch(error => {
              reject(error);
            });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = error => {
          reject(error);
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }
}