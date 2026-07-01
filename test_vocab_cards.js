import { VocabTrainerController } from './src/vocabTrainer.js';
import { georgesDictionary } from './src/data/dictionary.js';

// Minimal mock browser environment to instantiate VocabTrainerController
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();

const mockElement = {
  addEventListener: () => {},
  appendChild: () => {},
  setAttribute: () => {},
  removeAttribute: () => {},
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false
  },
  innerHTML: '',
  textContent: '',
  value: ''
};

globalThis.document = {
  getElementById: () => mockElement,
  querySelectorAll: () => [],
  querySelector: () => mockElement,
  createElement: () => mockElement,
  addEventListener: () => {}
};

const mockAppState = {
  vocabProgress: {}
};

const controller = new VocabTrainerController(mockAppState);

// Chapters 1-3
const deck1to3 = controller.getPerseusDeck();
// Chapters 4-6
const deck4to6 = controller.getPerseus4To6Deck();

const allCards = [...deck1to3.cards, ...deck4to6.cards];

console.log(`Running validation for ${allCards.length} generated vocabulary cards...`);

const testCases = [
  // Noun check
  {
    latin: "pes",
    assertion: (card) => card.translation === "der Fuß (Nominativ)",
    description: "Lemma card for 'pes' has correct translation resolved from Georges"
  },
  {
    latin: "pedibus",
    assertion: (card) => card.translation === "den Füßen (Dativ)",
    description: "Inflected card 'pedibus' is formatted as 'den Füßen (Dativ)'"
  },
  // Verb check
  {
    latin: "esse",
    assertion: (card) => card.translation === "sein, vorhanden sein",
    description: "Verb 'esse' has correct translation resolved from Georges"
  },
  {
    latin: "abscidere",
    assertion: (card) => card.translation === "abhauen, abschneiden",
    description: "Verb 'abscidere' has correct translation resolved from Georges"
  },
  {
    latin: "devorare",
    assertion: (card) => card.translation === "hinunter- od. hinterschlucken, -schlingen, verschlucken, verschlingen",
    description: "Verb 'devorare' has correctly resolved prefix-merged translation"
  },
  {
    latin: "appellare",
    assertion: (card) => card.translation === "ansprechen, anreden",
    description: "Verb 'appellare' skips etymological literal meaning to resolve correctly"
  },
  {
    latin: "velle",
    assertion: (card) => card.translation === "willens sein, begehren, wünschen",
    description: "Verb 'velle' resolves homonym 'volo' to 'want' rather than 'fly'"
  },
  // Proper noun check
  {
    latin: "andromeda",
    assertion: (card) => card.translation === "Andromeda",
    description: "Proper noun 'andromeda' skips suffix ending to resolve correctly"
  },
  // Pronoun check
  {
    latin: "hic",
    assertion: (card) => card.translation === "dieser, diese, dieses",
    description: "Pronoun 'hic' skips article-aware noun segment selection to resolve correctly"
  },
  // Adjective check
  {
    latin: "maximus",
    assertion: (card) => card.translation.toLowerCase() === "der größte (nominativ)",
    description: "Adjective 'maximus' uses correctly formatted comparative/superlative base form translation"
  }
];

let failed = false;

// 1. Run explicit assertions
for (const tc of testCases) {
  const matching = allCards.filter(c => c.latin.toLowerCase() === tc.latin.toLowerCase());
  if (matching.length === 0) {
    console.error(`❌ FAILED: Card '${tc.latin}' not found in decks.`);
    failed = true;
    continue;
  }
  
  for (const card of matching) {
    try {
      if (tc.assertion(card)) {
        console.log(`✅ PASSED: ${tc.description} (Word: ${card.latin} -> "${card.translation}")`);
      } else {
        console.error(`❌ FAILED: ${tc.description}`);
        console.error(`   Got: "${card.translation}"`);
        failed = true;
      }
    } catch (e) {
      console.error(`❌ FAILED: ${tc.description} threw error: ${e.message}`);
      failed = true;
    }
  }
}

// 2. Structural sanity check on all cards
let invalidCardsCount = 0;
for (const card of allCards) {
  if (!card.latin || typeof card.latin !== 'string' || card.latin.trim() === '') {
    console.error(`❌ Card has missing or invalid 'latin' field:`, card);
    invalidCardsCount++;
  }
  if (!card.translation || typeof card.translation !== 'string' || card.translation.trim() === '') {
    console.error(`❌ Card '${card.latin}' has missing or empty 'translation' field.`);
    invalidCardsCount++;
  }
  if (card.translation && (card.translation.includes("Kein detaillierter Eintrag") || card.translation.includes("<p>") || card.translation.includes("<b>"))) {
    console.error(`❌ Card '${card.latin}' has unparsed HTML/raw string in translation: "${card.translation}"`);
    invalidCardsCount++;
  }
}

if (invalidCardsCount > 0) {
  console.error(`❌ FAILED: ${invalidCardsCount} cards had structural validation failures.`);
  failed = true;
} else {
  console.log(`✅ Structural sanity check passed for all ${allCards.length} cards.`);
}

if (failed) {
  process.exit(1);
} else {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY.");
  process.exit(0);
}
