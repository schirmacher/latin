import { vocabularyDecks } from './data/vocabulary.js';

export class VocabTrainerController {
  constructor(appState, updateStatsCallback) {
    this.appState = appState;
    this.updateStatsCallback = updateStatsCallback;
    
    this.currentDeck = [];
    this.currentDeckName = '';
    this.currentIndex = 0;
    this.isFlipped = false;

    // Elements
    this.deckSelectEl = document.getElementById('vocab-deck-select');
    this.progressEl = document.getElementById('vocab-progress-label');
    this.cardContainerEl = document.getElementById('flashcard-container');
    
    this.frontWordEl = document.getElementById('card-front-word');
    this.frontSubEl = document.getElementById('card-front-subtext');
    this.backWordEl = document.getElementById('card-back-word');
    this.backSubEl = document.getElementById('card-back-subtext');
    this.deckIndicatorEl = document.getElementById('card-deck-indicator');

    this.btnRepeat = document.getElementById('btn-vocab-repeat');
    this.btnKnown = document.getElementById('btn-vocab-known');

    this.init();
  }

  init() {
    this.populateDecks();

    // Event listeners
    this.deckSelectEl.addEventListener('change', () => this.loadSelectedDeck());
    this.cardContainerEl.addEventListener('click', () => this.flipCard());
    
    this.btnRepeat.addEventListener('click', () => this.handleCardResponse(false));
    this.btnKnown.addEventListener('click', () => this.handleCardResponse(true));

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      // Only process key events if vocab view is active
      const vocabView = document.getElementById('view-vocab');
      if (vocabView && vocabView.classList.contains('active')) {
        if (e.code === 'Space') {
          e.preventDefault();
          this.flipCard();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyN') {
          // 'N' or ArrowLeft for repeat
          this.handleCardResponse(false);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyY' || e.code === 'Enter') {
          // 'Y', Enter, or ArrowRight for known
          this.handleCardResponse(true);
        }
      }
    });

    // Load first deck by default
    this.loadSelectedDeck();
  }

  populateDecks() {
    const level = this.appState.courseLevel || 'intermediate';
    const filtered = vocabularyDecks.filter(d => d.level === level);

    // Add default decks
    let optionsHtml = filtered
      .map(d => `<option value="${d.id}">${d.name} (${d.cards.length} Karten)</option>`)
      .join('');

    // Add custom deck option if user has custom vocabulary
    const customCount = this.appState.customVocabulary ? this.appState.customVocabulary.length : 0;
    optionsHtml += `<option value="custom">Eigene Vokabeln (${customCount} Karten)</option>`;

    this.deckSelectEl.innerHTML = optionsHtml;
  }

  loadSelectedDeck() {
    const deckId = this.deckSelectEl.value;
    
    if (deckId === 'custom') {
      const customWords = this.appState.customVocabulary || [];
      this.currentDeck = [...customWords];
      this.currentDeckName = 'Eigene Vokabeln';
    } else {
      const deck = vocabularyDecks.find(d => d.id === deckId);
      if (deck) {
        this.currentDeck = [...deck.cards];
        this.currentDeckName = deck.name;
      } else {
        this.currentDeck = [];
        this.currentDeckName = 'Leer';
      }
    }

    // Shuffle deck
    this.shuffle(this.currentDeck);

    this.currentIndex = 0;
    this.isFlipped = false;
    this.cardContainerEl.classList.remove('flipped');
    this.displayCard();
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  displayCard() {
    if (this.currentDeck.length === 0) {
      this.progressEl.textContent = '0 / 0 Karten';
      this.deckIndicatorEl.textContent = '-';
      
      this.frontWordEl.textContent = 'Keine Karten';
      this.frontSubEl.textContent = 'Füge Vokabeln aus dem Leser hinzu, um zu beginnen.';
      this.backWordEl.textContent = 'Keine Übersetzung';
      this.backSubEl.textContent = 'Wähle einen anderen Kartenstapel.';
      
      this.btnRepeat.disabled = true;
      this.btnKnown.disabled = true;
      return;
    }

    this.btnRepeat.disabled = false;
    this.btnKnown.disabled = false;

    const card = this.currentDeck[this.currentIndex];
    
    this.progressEl.textContent = `Karte ${this.currentIndex + 1} von ${this.currentDeck.length}`;
    this.deckIndicatorEl.textContent = this.currentDeckName;

    this.frontWordEl.textContent = card.latin;
    this.frontSubEl.textContent = card.forms || '';
    
    this.backWordEl.textContent = card.translation;
    this.backSubEl.textContent = card.explanation || '';
  }

  flipCard() {
    if (this.currentDeck.length === 0) return;
    this.isFlipped = !this.isFlipped;
    if (this.isFlipped) {
      this.cardContainerEl.classList.add('flipped');
    } else {
      this.cardContainerEl.classList.remove('flipped');
    }
  }

  handleCardResponse(known) {
    if (this.currentDeck.length === 0) return;

    const card = this.currentDeck[this.currentIndex];
    const cardKey = card.latin.toLowerCase();

    if (known) {
      // Add to mastered vocabulary in appState if not already present
      if (!this.appState.masteredVocab.includes(cardKey)) {
        this.appState.masteredVocab.push(cardKey);
        this.updateStatsCallback();
      }
    } else {
      // If repeat, remove from mastered vocab
      const index = this.appState.masteredVocab.indexOf(cardKey);
      if (index > -1) {
        this.appState.masteredVocab.splice(index, 1);
        this.updateStatsCallback();
      }
    }

    // Move to next card
    this.currentIndex++;
    if (this.currentIndex >= this.currentDeck.length) {
      // Completed the deck! Reshuffle and start over
      this.showToast('🎉 Du hast alle Karten in diesem Stapel durchgearbeitet!');
      this.shuffle(this.currentDeck);
      this.currentIndex = 0;
    }

    // Reset card flip with animation delay
    if (this.isFlipped) {
      this.cardContainerEl.classList.remove('flipped');
      this.isFlipped = false;
      setTimeout(() => {
        this.displayCard();
      }, 250); // wait for flip back animation
    } else {
      this.displayCard();
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>✨</span> <div>${message}</div>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
