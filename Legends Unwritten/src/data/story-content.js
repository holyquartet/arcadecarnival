// legends-unwritten/src/data/story-content.js
// Load story content from files or define directly

export async function loadStoryContent() {
  // In a full implementation, this would load JSON files with story content
  // For this demo, we'll return sample content directly
  
  return {
    storyTemplates: [
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
      // Additional story templates would be defined here
    ],
    
    locationTemplates: [
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
    ],
    
    eventTemplates: [
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
      // Additional event templates would be defined here
    ],
    
    npcTemplates: [
      {
        id: 'innkeeper',
        name: 'Galen',
        type: 'friendly',
        description: 'A middle-aged man with a hearty laugh and a well-trimmed beard.',
        dialogue: {
          greeting: [
            'Welcome to the Crossroads Inn, traveler! What can I get for you?',
            'Ah, a new face! Always good to see travelers stopping by. What'll it be?'
          ],
          friendly: [
            'You\'re always welcome here. What can I help you with?',
            'Good to see you again! Need anything?'
          ],
          neutral: [
            'What can I do for you?',
            'Need something?'
          ],
          farewell: [
            'Safe travels, friend!',
            'Come back anytime!'
          ]
        },
        questGiver: true
      },
      // Additional NPC templates would be defined here
    ],
    
    dialoguePatterns: {
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
    },
    
    responseTemplates: {
      // Response templates would be defined here
    }
  };
}
