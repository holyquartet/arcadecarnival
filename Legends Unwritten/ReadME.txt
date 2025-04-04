# Legends Unwritten

A text-based narrative adventure game with dynamic, generated storylines built in JavaScript.

## Overview

Legends Unwritten is a modular, extensible text-based adventure game engine that generates unique storylines based on player choices. The game uses a dynamic narrative system to provide unpredictable and personalized experiences for each playthrough.

## Features

- **Dynamic Story Generation**: The game engine generates narrative content based on player choices, character traits, and game state.
- **Branching Narrative System**: Player choices meaningfully affect the story direction.
- **Character Creation**: Players can select different character archetypes that impact how NPCs react and what options are available.
- **Randomized Events**: The game injects unexpected events to keep gameplay fresh and engaging.
- **Modular Architecture**: Easily expandable with new story templates, locations, NPCs, and events.
- **Save/Load System**: Players can save their progress and continue their adventure later.
- **Simple Combat System**: A lightweight turn-based combat system for action sequences.
- **Responsive UI**: Works on desktop and mobile devices.

## Project Structure

```
legends-unwritten/
├── assets/              # Game assets (favicon, etc.)
├── src/                 # Source code
│   ├── engine/          # Core game engine
│   │   └── game.js      # Main game loop and logic
│   ├── generators/      # Narrative generators
│   │   └── story-generator.js  # Dynamic story generation
│   ├── managers/        # Game coordination
│   │   ├── game-manager.js     # Orchestrates all components
│   │   └── save-manager.js     # Save/load functionality
│   ├── models/          # Data models
│   │   └── player.js    # Player character model
│   │   └── scene.js     # Scene data model
│   │   └── npc.js       # Non-player character model
│   ├── ui/              # User interface
│   │   └── game-ui.js   # Game interface
│   │   └── menu-ui.js   # Menu interface
│   ├── data/            # Game content
│   │   └── story-content.js  # Story templates and content
│   └── main.js          # Application entry point
├── styles/              # CSS stylesheets
│   └── main.css         # Main stylesheet
└── index.html           # Main HTML file
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server for development (optional)

### Installation

1. Clone the repository or download the source code.
2. If using a local web server, set it up to serve the project directory.
3. Open `index.html` in your browser.

### Development

To extend the game with new content:

1. Add new story templates to `src/data/story-content.js`
2. Create new location, NPC, or event templates in the same file
3. Implement new game mechanics by extending the core classes

## Extending the Game

### Adding Story Templates

Story templates define scenes that can be generated during gameplay. To add a new template:

```javascript
const newTemplate = {
  id: 'unique_id',
  type: 'exploration',  // starting, exploration, combat, etc.
  title: 'Template Title',
  description: 'Short description',
  location: {
    name: 'Location Name',
    type: 'wilderness',  // town, village, dungeon, etc.
    description: 'Location description'
  },
  narrative: [
    'First paragraph of narrative text.',
    'Second paragraph with {player.name} and {player.archetype} variables.'
  ],
  choices: [
    {
      text: 'Choice text',
      tags: ['explore', 'danger'],
      effects: {
        stats: { health: -5 },
        flags: { discovered_secret: true }
      }
    },
    // More choices...
  ],
  tags: ['forest', 'mystery', 'danger']
};

// Add to storyTemplates array
storyContent.storyTemplates.push(newTemplate);
```

### Adding Character Archetypes

To add a new character archetype, modify the character creation screen in `src/ui/game-ui.js` and update the `Player` class in `src/models/player.js`.

### Creating Custom Events

Random events can be added by creating new event templates in `src/data/story-content.js` and the `EventGenerator` class will incorporate them into gameplay.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic text adventures and choose-your-own-adventure books
- Built using vanilla JavaScript, HTML, and CSS
