import { vocabularyDecks, baseTranslationOverrides } from './data/vocabulary.js';
import { texts } from './data/texts.js';
import { georgesDictionary } from './data/dictionary.js';

const LEITNER_INTERVALS = {
  1: 0,                           // Box 1: Sofort fällig (0 Std.)
  2: 24 * 60 * 60 * 1000,         // Box 2: nach 1 Tag (24 Std.)
  3: 3 * 24 * 60 * 60 * 1000,     // Box 3: nach 3 Tagen (72 Std.)
  4: 7 * 24 * 60 * 60 * 1000,     // Box 4: nach 7 Tagen (1 Woche)
  5: 14 * 24 * 60 * 60 * 1000,    // Box 5: nach 14 Tagen (2 Wochen)
  6: 30 * 24 * 60 * 60 * 1000     // Box 6: nach 30 Tagen (4 Wochen) / Archiviert
};

export class VocabTrainerController {
  constructor(appState, updateStatsCallback) {
    this.appState = appState;
    this.updateStatsCallback = updateStatsCallback;
    
    // Initialize vocab progress if missing
    this.appState.vocabProgress = this.appState.vocabProgress || {};
    
    this.rawDeck = [];
    this.currentDeck = []; // filtered based on due status
    this.currentDeckName = '';
    this.currentIndex = 0;
    this.isFlipped = false;
    this.reviewAllMode = false; // toggle to study already-learned cards early
    
    // Distractor list for MCQ (shuffled)
    this.mcOptions = [];
    this.mcSelectedIdx = null;
    this.mcAnswered = false;
    this.mcQuestionIsLatin = true; // alternates to test both directions

    // Match Mode state
    this.matchSet = []; // active set of 5 cards being matched
    this.matchLeftSelected = null; // clicked Latin element ID
    this.matchRightSelected = null; // clicked German element ID
    this.matchCorrectPairs = new Set(); // index in matchSet that are completed
    this.matchErrors = {}; // key: card Latin -> boolean (if user made a mistake on it)
    
    // Elements
    this.deckSelectEl = document.getElementById('vocab-deck-select');
    this.modeSelectEl = document.getElementById('vocab-mode-select');
    this.progressEl = document.getElementById('vocab-progress-label');
    this.cardContainerEl = document.getElementById('flashcard-container');
    this.interContainerEl = document.getElementById('vocab-interactive-container');
    
    this.frontWordEl = document.getElementById('card-front-word');
    this.frontSubEl = document.getElementById('card-front-subtext');
    this.backWordEl = document.getElementById('card-back-word');
    this.backSubEl = document.getElementById('card-back-subtext');
    this.deckIndicatorEl = document.getElementById('card-deck-indicator');

    this.btnRepeat = document.getElementById('btn-vocab-repeat');
    this.btnKnown = document.getElementById('btn-vocab-known');
    this.btnSkip = document.getElementById('btn-vocab-skip');

    this.init();
  }

  init() {
    this.populateDecks();

    // Event listeners
    this.deckSelectEl.addEventListener('change', () => {
      this.reviewAllMode = false;
      this.loadSelectedDeck();
    });
    this.modeSelectEl.addEventListener('change', () => this.displayActiveMode());
    this.cardContainerEl.addEventListener('click', () => this.flipCard());
    
    this.btnRepeat.addEventListener('click', () => this.handleCardResponse(false));
    this.btnKnown.addEventListener('click', () => this.handleCardResponse(true));
    if (this.btnSkip) {
      this.btnSkip.addEventListener('click', () => this.handleSkipCard());
    }

    // Keyboard support (Classic flashcard mode only)
    document.addEventListener('keydown', (e) => {
      const vocabView = document.getElementById('view-vocab');
      if (vocabView && vocabView.classList.contains('active') && this.modeSelectEl.value === 'classic') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.flipCard();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyN') {
          this.handleCardResponse(false);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyY' || e.code === 'Enter') {
          this.handleCardResponse(true);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.handleSkipCard();
        }
      }
    });

    // Load first deck by default
    this.loadSelectedDeck();
  }

  findStaticVocabCard(latinWord) {
    const cleanWord = latinWord.toLowerCase().trim();
    if (baseTranslationOverrides[cleanWord]) {
      return baseTranslationOverrides[cleanWord];
    }
    if (georgesDictionary[cleanWord]) {
      return georgesDictionary[cleanWord];
    }
    for (const deck of vocabularyDecks) {
      const card = deck.cards.find(c => c.latin.toLowerCase() === cleanWord);
      if (card) return card;
    }
    return null;
  }

  // Scrapes all text segments from local texts and creates a dynamic Perseus deck
  getPerseusDeck() {
    const perseusCards = [];
    const addedKeys = new Set();

    const formatNounTranslation = (translation, genderStr, caseStr, baseTranslation = "") => {
      if (!caseStr) return translation;
      const c = caseStr.toLowerCase();
      const isPlural = c.includes("plural") || c.includes(" pl.");
      
      let clean = translation.replace(/^(der|die|das|des|dem|den)\s+/i, '').trim();
      
      if (isPlural) {
        let article = "die";
        if (c.includes("genitiv")) article = "der";
        else if (c.includes("dativ") || c.includes("ablativ")) article = "den";
        return `${article} ${clean}`;
      }
      
      let isFem = false, isMasc = false, isNeut = false;
      if (baseTranslation) {
        const baseLower = baseTranslation.toLowerCase().trim();
        if (baseLower.startsWith("die ")) isFem = true;
        else if (baseLower.startsWith("der ")) isMasc = true;
        else if (baseLower.startsWith("das ")) isNeut = true;
      }
      
      if (!isFem && !isMasc && !isNeut && genderStr) {
        const g = genderStr.toLowerCase();
        isFem = g.includes("f.") || g.includes("(f)") || g.includes(" f");
        isMasc = g.includes("m.") || g.includes("(m)") || g.includes(" m");
        isNeut = g.includes("n.") || g.includes("(n)") || g.includes(" n");
      }
      
      if (!isFem && !isMasc && !isNeut) return translation;
      
      let article = "";
      if (isFem) {
        if (c.includes("genitiv") || c.includes("dativ") || c.includes("ablativ")) article = "der";
        else article = "die";
      } else if (isMasc) {
        if (c.includes("nominativ")) article = "der";
        else if (c.includes("genitiv")) article = "des";
        else if (c.includes("dativ") || c.includes("ablativ")) article = "dem";
        else if (c.includes("akkusativ")) article = "den";
        else article = "der";
      } else if (isNeut) {
        if (c.includes("genitiv")) article = "des";
        else if (c.includes("dativ") || c.includes("ablativ")) article = "dem";
        else article = "das";
      }
      return `${article} ${clean}`;
    };

    // Retrieve all chapters beginning with 'fabulae_faciles' (Perseus)
    const perseusTexts = texts.filter(t => t.id.startsWith('fabulae_faciles'));
    
    for (const text of perseusTexts) {
      if (!text.lexicon) continue;
      
      for (const [inflected, info] of Object.entries(text.lexicon)) {
        // Clean the lemma key (e.g. "comprehendere" or "urbs")
        const lemmaClean = info.lemma.split(/[,;\s]/)[0].toLowerCase().trim().replace(/[^a-zāēīōū]/g, '');
        const rootKey = `root_${lemmaClean}`;
        
        // 1. Add the dictionary root (lemma)
        if (!addedKeys.has(rootKey) && lemmaClean.length > 0) {
          addedKeys.add(rootKey);

          // Look up base translation in vocabulary decks if available
          let baseTranslation = info.translation.split('/')[0].split(';')[0].trim();
          let baseExplanation = `${info.pos} (Grundform)`;

          const staticCard = this.findStaticVocabCard(lemmaClean);
          if (staticCard) {
            baseTranslation = staticCard.translation;
            if (staticCard.explanation) {
              baseExplanation = staticCard.explanation;
            }
          }

          // Append Nominativ suffix for nouns and adjectives to make it clear they are base forms
          if (info.pos.includes("Substantiv") || info.pos.includes("Adjektiv")) {
            baseTranslation = formatNounTranslation(baseTranslation, info.lemma, "Nominativ", baseTranslation);
            if (!baseTranslation.includes("(") && !baseTranslation.includes("Nominativ")) {
              baseTranslation = `${baseTranslation} (Nominativ)`;
            }
          }

          perseusCards.push({
            latin: lemmaClean,
            forms: info.lemma,
            translation: baseTranslation,
            explanation: baseExplanation,
            level: "intermediate"
          });
        }
        
        // 2. Add the actual inflected form found in the text, if different
        const inflectedKey = `form_${inflected.toLowerCase()}`;
        if (inflected.toLowerCase() !== lemmaClean && !addedKeys.has(inflectedKey) && inflected.length > 1) {
          addedKeys.add(inflectedKey);

          let displayTranslation = info.translation;
          if (info.pos.includes("Substantiv") || info.pos.includes("Adjektiv")) {
            const caseMatch = info.parse.match(/(Nominativ|Genitiv|Dativ|Akkusativ|Ablativ|Vokativ)/i);
            if (caseMatch) {
              let baseTrans = "";
              const staticCard = this.findStaticVocabCard(lemmaClean);
              if (staticCard) {
                baseTrans = staticCard.translation;
              } else {
                baseTrans = info.translation;
              }
              let nounTrans = formatNounTranslation(info.translation, info.lemma, info.parse, baseTrans);
              displayTranslation = `${nounTrans} (${caseMatch[0]})`;
            }
          } else if (info.pos.includes("Verb")) {
            const parseLower = info.parse.toLowerCase();
            let pronoun = "";
            if (parseLower.includes("1. person singular") || parseLower.includes("1. pers. sg.")) {
              pronoun = "ich";
            } else if (parseLower.includes("2. person singular") || parseLower.includes("2. pers. sg.")) {
              pronoun = "du";
            } else if (parseLower.includes("3. person singular") || parseLower.includes("3. pers. sg.")) {
              pronoun = "er/sie/es";
            } else if (parseLower.includes("1. person plural") || parseLower.includes("1. pers. pl.")) {
              pronoun = "wir";
            } else if (parseLower.includes("2. person plural") || parseLower.includes("2. pers. pl.")) {
              pronoun = "ihr";
            } else if (parseLower.includes("3. person plural") || parseLower.includes("3. pers. pl.")) {
              pronoun = "sie";
            }
            
            if (pronoun) {
              const transLower = displayTranslation.toLowerCase();
              const alreadyHas = transLower.startsWith("ich ") ||
                                 transLower.startsWith("du ") ||
                                 transLower.startsWith("er ") ||
                                 transLower.startsWith("sie ") ||
                                 transLower.startsWith("es ") ||
                                 transLower.startsWith("wir ") ||
                                 transLower.startsWith("ihr ") ||
                                 transLower.startsWith("er/sie/es ");
              if (!alreadyHas) {
                displayTranslation = `${pronoun} ${displayTranslation}`;
              }
            }
          }

          perseusCards.push({
            latin: inflected,
            forms: `Form von: ${lemmaClean}`,
            translation: displayTranslation,
            explanation: `${info.pos} | ${info.parse} (Textform)`,
            level: "intermediate"
          });
        }
      }
    }
    
    return {
      id: "perseus_all",
      name: "Stapel: Perseus (Alle Formen)",
      description: "Enthält sowohl alle Grundwörter als auch konjugierte/deklinierte Formen aus der Perseus-Geschichte.",
      level: "intermediate",
      cards: perseusCards
    };
  }

  populateDecks() {
    const level = this.appState.courseLevel || 'intermediate';
    
    // Standard static decks
    const filtered = vocabularyDecks.filter(d => d.level === level);
    let optionsHtml = filtered
      .map(d => `<option value="${d.id}">${d.name} (${d.cards.length} Karten)</option>`)
      .join('');

    // Pre-filled dynamic Perseus Deck (only for intermediate level)
    if (level === 'intermediate') {
      const pDeck = this.getPerseusDeck();
      optionsHtml = `<option value="${pDeck.id}">${pDeck.name} (${pDeck.cards.length} Karten)</option>` + optionsHtml;
    }

    // Custom user added deck
    const customCount = this.appState.customVocabulary ? this.appState.customVocabulary.length : 0;
    optionsHtml += `<option value="custom">Eigene Vokabeln (${customCount} Karten)</option>`;

    this.deckSelectEl.innerHTML = optionsHtml;
  }

  loadSelectedDeck() {
    const deckId = this.deckSelectEl.value;
    
    if (deckId === 'custom') {
      const customWords = this.appState.customVocabulary || [];
      this.rawDeck = [...customWords];
      this.currentDeckName = 'Eigene Vokabeln';
    } else if (deckId === 'perseus_all') {
      const pDeck = this.getPerseusDeck();
      this.rawDeck = [...pDeck.cards];
      this.currentDeckName = pDeck.name;
    } else {
      const deck = vocabularyDecks.find(d => d.id === deckId);
      if (deck) {
        this.rawDeck = [...deck.cards];
        this.currentDeckName = deck.name;
      } else {
        this.rawDeck = [];
        this.currentDeckName = 'Leer';
      }
    }

    // Apply spaced-repetition due filter
    this.filterDueCards();

    this.currentIndex = 0;
    this.isFlipped = false;
    
    if (this.cardContainerEl.classList.contains('flipped')) {
      this.cardContainerEl.classList.remove('flipped');
    }

    this.updateBinDistributionUI();
    this.displayActiveMode();
  }

  filterDueCards() {
    const now = Date.now();
    
    // Helper to verify if an inflected card's root has been studied sufficiently (Box >= 3)
    const isUnlocked = (card) => {
      let rootWord = null;
      if (card.forms) {
        const formsClean = card.forms.toLowerCase();
        if (formsClean.startsWith("form von:")) {
          rootWord = card.forms.substring(9).trim().toLowerCase();
        }
      }
      
      if (rootWord) {
        const rootProgress = this.appState.vocabProgress[rootWord];
        const rootBin = rootProgress ? rootProgress.bin : 1;
        if (rootBin < 3) {
          return false; // Root is not in Box >= 3 yet, lock this inflected form
        }
      }
      return true;
    };

    if (this.reviewAllMode) {
      // Respect root dependency constraints even in review-all mode
      this.currentDeck = this.rawDeck.filter(isUnlocked);
      this.shuffle(this.currentDeck);
      return;
    }

    // Filter cards that are both unlocked (root learned) and due
    this.currentDeck = this.rawDeck.filter(card => {
      if (!isUnlocked(card)) return false;

      const progress = this.appState.vocabProgress[card.latin.toLowerCase()];
      if (!progress) return true; // new card is due immediately
      if (progress.bin >= 6) {
        // Mastered cards are archived
        return false;
      }
      return progress.nextReview <= now;
    });

    // Shuffle the active study deck
    this.shuffle(this.currentDeck);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  displayActiveMode() {
    const mode = this.modeSelectEl.value;
    
    if (this.currentDeck.length === 0) {
      this.displayEmptyDeckBanner();
      return;
    }

    // Toggle panels
    if (mode === 'classic') {
      this.cardContainerEl.style.display = 'block';
      this.interContainerEl.style.display = 'none';
      document.querySelector('.vocab-action-buttons').style.display = 'flex';
      
      this.displayClassicCard();
    } else if (mode === 'choice') {
      this.cardContainerEl.style.display = 'none';
      this.interContainerEl.style.display = 'flex';
      document.querySelector('.vocab-action-buttons').style.display = 'none';
      
      this.displayMultipleChoiceCard();
    } else if (mode === 'match') {
      this.cardContainerEl.style.display = 'none';
      this.interContainerEl.style.display = 'flex';
      document.querySelector('.vocab-action-buttons').style.display = 'none';
      
      this.displayMatchingGame();
    }
  }

  // Display empty state or completed Leitner reviews
  displayEmptyDeckBanner() {
    this.cardContainerEl.style.display = 'none';
    this.interContainerEl.style.display = 'flex';
    document.querySelector('.vocab-action-buttons').style.display = 'none';
    this.progressEl.textContent = '0 / 0';
    this.deckIndicatorEl.textContent = '-';

    const masteredCount = this.rawDeck.filter(c => {
      const p = this.appState.vocabProgress[c.latin.toLowerCase()];
      return p && p.bin >= 6;
    }).length;

    this.interContainerEl.innerHTML = `
      <div class="review-complete-banner">
        <div class="review-complete-icon">🎉</div>
        <h2>Alles wiederholt!</h2>
        <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto; font-size: 14px; line-height: 1.6;">
          Du hast alle derzeit fälligen Vokabeln in diesem Stapel gemeistert.
          <br>
          <span style="color: var(--accent-emerald); font-weight: 600;">${masteredCount} von ${this.rawDeck.length} Karten</span> in diesem Stapel sind dauerhaft archiviert (Box 6).
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 10px;">
          <button id="btn-force-review" class="btn btn-primary" style="font-size: 13px;">
            Vorzeitig wiederholen 🔄
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-force-review').addEventListener('click', () => {
      this.reviewAllMode = true;
      this.filterDueCards();
      this.currentIndex = 0;
      this.displayActiveMode();
    });
  }

  // --- 🎴 CLASSIC CARD FLIP MODE ---
  displayClassicCard() {
    const card = this.currentDeck[this.currentIndex];
    const progress = this.appState.vocabProgress[card.latin.toLowerCase()] || { bin: 1 };
    
    this.progressEl.textContent = `${this.currentIndex + 1} / ${this.currentDeck.length} fällig`;
    this.deckIndicatorEl.textContent = `${this.currentDeckName} (Box ${progress.bin})`;

    this.frontWordEl.textContent = card.latin;
    this.frontSubEl.textContent = card.forms || '';
    
    this.backWordEl.textContent = card.translation;
    this.backSubEl.textContent = card.explanation || '';
    
    // Georges lookup for flashcard back
    const georgesEl = document.getElementById('card-back-georges');
    if (georgesEl) {
      const cleanWord = card.latin.toLowerCase().trim();
      const georgesEntry = georgesDictionary[cleanWord];
      if (georgesEntry && georgesEntry.html) {
        georgesEl.innerHTML = `
          <div style="font-size: 10px; font-weight: 600; color: var(--accent-indigo); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">📖 Georges 1913:</div>
          <div>${georgesEntry.html}</div>
        `;
        georgesEl.style.display = 'block';
      } else {
        georgesEl.style.display = 'none';
      }
    }

    // Bind AI button inside card
    const aiBtn = document.getElementById('btn-card-ai-explain');
    if (aiBtn) {
      aiBtn.onclick = (e) => {
        e.stopPropagation(); // prevent flipping the card
        window.app.showAIExplanation(card.latin, card.forms || '', card.translation, card.explanation || '');
      };
    }
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

  // --- 🔘 MULTIPLE CHOICE MODE ---
  displayMultipleChoiceCard() {
    this.mcAnswered = false;
    const card = this.currentDeck[this.currentIndex];
    const progress = this.appState.vocabProgress[card.latin.toLowerCase()] || { bin: 1 };
    
    this.progressEl.textContent = `${this.currentIndex + 1} / ${this.currentDeck.length} fällig`;
    
    // Alternates matching direction
    this.mcQuestionIsLatin = (this.currentIndex % 2 === 0);

    // Pick 3 distractors
    const distractors = this.generateDistractors(card, this.mcQuestionIsLatin);
    
    const correctOption = this.mcQuestionIsLatin ? card.translation : card.latin;
    this.mcOptions = [correctOption, ...distractors];
    this.shuffle(this.mcOptions);

    this.mcSelectedIdx = this.mcOptions.indexOf(correctOption);

    this.renderMCQ(card, progress.bin);
  }

  generateDistractors(correctCard, questionIsLatin) {
    const distractors = new Set();
    const correctVal = questionIsLatin ? correctCard.translation : correctCard.latin;

    // Use current deck or fallback to all vocabulary list
    const sourceList = this.rawDeck.length > 5 ? this.rawDeck : vocabularyDecks.flatMap(d => d.cards);
    
    // Try to select 3 different meanings
    let attempts = 0;
    while (distractors.size < 3 && attempts < 100) {
      attempts++;
      const randCard = sourceList[Math.floor(Math.random() * sourceList.length)];
      const randVal = questionIsLatin ? randCard.translation : randCard.latin;
      
      if (randVal.toLowerCase() !== correctVal.toLowerCase() && !distractors.has(randVal)) {
        distractors.add(randVal);
      }
    }
    
    return Array.from(distractors);
  }

  renderMCQ(card, bin) {
    const questionText = this.mcQuestionIsLatin ? card.latin : card.translation;
    const subtitleText = this.mcQuestionIsLatin ? (card.forms || '') : 'Bedeutung im Lateinischen?';

    this.interContainerEl.innerHTML = `
      <div class="vocab-inter-header">
        <span>Multiple Choice (Richtung: ${this.mcQuestionIsLatin ? 'Latein ➜ Deutsch' : 'Deutsch ➜ Latein'})</span>
        <span>Box ${bin}</span>
      </div>
      <div class="vocab-inter-question-area">
        <div class="vocab-inter-question-word">${questionText}</div>
        <div class="vocab-inter-question-hint">${subtitleText}</div>
      </div>
      <div class="mc-grid" id="mc-options-grid">
        ${this.mcOptions.map((opt, i) => `
          <button class="mc-option-btn" data-index="${i}">${opt}</button>
        `).join('')}
      </div>
      <div id="mc-controls-container" style="display: flex; justify-content: center; margin-top: 16px; width: 100%;">
        <button id="btn-mc-skip" class="btn btn-secondary" style="background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.1); width: 100%; max-width: 280px;">⏭️ Überspringen</button>
      </div>
      <div id="mc-next-container" style="display:none; text-align: center; margin-top: 10px;">
        <button id="btn-mc-next" class="btn btn-primary" style="margin: 0 auto; width: 100%; max-width: 280px;">Nächste Karte ➔</button>
      </div>
    `;

    // Add click listeners to MC buttons
    const buttons = this.interContainerEl.querySelectorAll('.mc-option-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedIdx = parseInt(e.target.getAttribute('data-index'));
        this.evaluateMCQAnswer(clickedIdx, buttons);
      });
    });

    // Bind skip button
    const skipBtn = this.interContainerEl.querySelector('#btn-mc-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.handleSkipCard());
    }
  }

  evaluateMCQAnswer(clickedIdx, buttons) {
    if (this.mcAnswered) return;
    this.mcAnswered = true;

    const isCorrect = (clickedIdx === this.mcSelectedIdx);
    
    // Disable all options
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
      buttons[clickedIdx].classList.add('correct');
      this.updateLeitnerProgress(this.currentDeck[this.currentIndex], true);
      
      // Auto advance to next card after delay
      setTimeout(() => {
        this.advanceInteractive();
      }, 1000);
    } else {
      buttons[clickedIdx].classList.add('incorrect');
      buttons[this.mcSelectedIdx].classList.add('correct'); // reveal correct answer
      this.updateLeitnerProgress(this.currentDeck[this.currentIndex], false);
      
      // Hide skip button when showing review next button
      const mcControls = document.getElementById('mc-controls-container');
      if (mcControls) mcControls.style.display = 'none';

      // Require user to click 'Next' button to review mistake
      const nextContainer = document.getElementById('mc-next-container');
      nextContainer.style.display = 'block';
      
      document.getElementById('btn-mc-next').addEventListener('click', () => {
        this.advanceInteractive();
      });
    }
  }

  // --- 🧩 MATCHING GAME MODE ---
  displayMatchingGame() {
    const setSize = Math.min(5, this.currentDeck.length - this.currentIndex);
    
    // Pick the next slice of 5 cards
    this.matchSet = this.currentDeck.slice(this.currentIndex, this.currentIndex + setSize);
    
    this.matchLeftSelected = null;
    this.matchRightSelected = null;
    this.matchCorrectPairs.clear();
    this.matchErrors = {}; // reset mistakes tracker for this set

    // Prepare left (Latin) list
    const leftItems = this.matchSet.map((c, index) => ({ val: c.latin, index }));
    // Prepare right (German) list
    const rightItems = this.matchSet.map((c, index) => ({ val: c.translation.split('/')[0].trim(), index }));

    this.shuffle(leftItems);
    this.shuffle(rightItems);

    this.renderMatching(leftItems, rightItems);
  }

  renderMatching(leftItems, rightItems) {
    this.progressEl.textContent = `Gruppe ${Math.floor(this.currentIndex / 5) + 1} / ${Math.ceil(this.currentDeck.length / 5)}`;
    
    this.interContainerEl.innerHTML = `
      <div class="vocab-inter-header">
        <span>Wort-Zuordnung (Verbinde Latein links mit Deutsch rechts)</span>
        <span>${this.matchCorrectPairs.size} / ${this.matchSet.length} Paare</span>
      </div>
      <div class="match-layout">
        <div class="match-column" id="match-left-col">
          ${leftItems.map(item => `
            <button class="match-btn" id="match-L-${item.index}" data-side="L" data-index="${item.index}">${item.val}</button>
          `).join('')}
        </div>
        <div class="match-column" id="match-right-col">
          ${rightItems.map(item => `
            <button class="match-btn" id="match-R-${item.index}" data-side="R" data-index="${item.index}">${item.val}</button>
          `).join('')}
        </div>
      </div>
      <div id="match-next-container" style="display:none; text-align: center; margin-top: 16px;">
        <button id="btn-match-next" class="btn btn-primary" style="margin: 0 auto; width: 100%;">Nächste Gruppe ➔</button>
      </div>
    `;

    // Click events
    const leftButtons = this.interContainerEl.querySelectorAll('#match-left-col .match-btn');
    const rightButtons = this.interContainerEl.querySelectorAll('#match-right-col .match-btn');

    leftButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleMatchClick(e.target, 'L'));
    });
    rightButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleMatchClick(e.target, 'R'));
    });
  }

  handleMatchClick(buttonEl, side) {
    const index = parseInt(buttonEl.getAttribute('data-index'));

    // Ignore if already matched
    if (this.matchCorrectPairs.has(index)) return;

    // Reset previous error classes if any
    this.interContainerEl.querySelectorAll('.match-btn.incorrect').forEach(btn => {
      btn.classList.remove('incorrect');
    });

    if (side === 'L') {
      // Toggle selection
      this.interContainerEl.querySelectorAll('#match-left-col .match-btn').forEach(btn => btn.classList.remove('selected'));
      buttonEl.classList.add('selected');
      this.matchLeftSelected = index;
    } else {
      this.interContainerEl.querySelectorAll('#match-right-col .match-btn').forEach(btn => btn.classList.remove('selected'));
      buttonEl.classList.add('selected');
      this.matchRightSelected = index;
    }

    // Check if we have selected one from each side
    if (this.matchLeftSelected !== null && this.matchRightSelected !== null) {
      this.evaluateMatch();
    }
  }

  evaluateMatch() {
    const leftIdx = this.matchLeftSelected;
    const rightIdx = this.matchRightSelected;

    const leftBtn = document.getElementById(`match-L-${leftIdx}`);
    const rightBtn = document.getElementById(`match-R-${rightIdx}`);

    const isMatch = (leftIdx === rightIdx);
    const card = this.matchSet[leftIdx];

    if (isMatch) {
      // Correct Match
      leftBtn.className = 'match-btn correct';
      rightBtn.className = 'match-btn correct';
      leftBtn.disabled = true;
      rightBtn.disabled = true;

      this.matchCorrectPairs.add(leftIdx);
      
      // Apply Leitner spacing updates
      const hadPreviousError = this.matchErrors[card.latin] === true;
      this.updateLeitnerProgress(card, !hadPreviousError);

      this.matchLeftSelected = null;
      this.matchRightSelected = null;

      // Update header score counter
      const headerLabel = this.interContainerEl.querySelector('.vocab-inter-header span:last-child');
      if (headerLabel) {
        headerLabel.textContent = `${this.matchCorrectPairs.size} / ${this.matchSet.length} Paare`;
      }

      // Check if group is fully matched
      if (this.matchCorrectPairs.size === this.matchSet.length) {
        const nextContainer = document.getElementById('match-next-container');
        nextContainer.style.display = 'block';
        
        document.getElementById('btn-match-next').addEventListener('click', () => {
          this.currentIndex += this.matchSet.length;
          if (this.currentIndex >= this.currentDeck.length) {
            this.showToast('🎉 Du hast alle Vokabeln in diesem Stapel gemeistert!');
            this.reviewAllMode = false;
            this.filterDueCards();
            this.currentIndex = 0;
          }
          this.displayActiveMode();
        });
      }
    } else {
      // Incorrect Match
      leftBtn.classList.add('incorrect');
      rightBtn.classList.add('incorrect');
      
      // Tag both cards as incorrect for Leitner grading
      const leftCard = this.matchSet[leftIdx];
      const rightCard = this.matchSet[rightIdx];
      this.matchErrors[leftCard.latin] = true;
      this.matchErrors[rightCard.latin] = true;

      // Reset selections with visual shake delay
      setTimeout(() => {
        leftBtn.classList.remove('selected', 'incorrect');
        rightBtn.classList.remove('selected', 'incorrect');
      }, 400);

      this.matchLeftSelected = null;
      this.matchRightSelected = null;
    }
  }

  // --- Leitner Progress Updater ---
  updateLeitnerProgress(card, correct) {
    const cardKey = card.latin.toLowerCase();
    let progress = this.appState.vocabProgress[cardKey];
    
    if (!progress) {
      progress = { bin: 1, lastReviewed: 0, nextReview: 0 };
    }

    if (correct) {
      // Correct promotes by 1 bin up to max Box 6
      const nextBin = Math.min(6, progress.bin + 1);
      progress.bin = nextBin;
      progress.lastReviewed = Date.now();
      progress.nextReview = Date.now() + LEITNER_INTERVALS[nextBin];
    } else {
      // Mistake demotes card all the way back to Box 1
      progress.bin = 1;
      progress.lastReviewed = Date.now();
      progress.nextReview = Date.now() + LEITNER_INTERVALS[1];
    }

    this.appState.vocabProgress[cardKey] = progress;
    this.updateStatsCallback(); // Persist changes to localStorage and refresh stats UI
    this.updateBinDistributionUI();
  }

  // Shared function to increment index and handle end-of-deck scenarios in MC/Classic
  advanceInteractive() {
    this.currentIndex++;
    if (this.currentIndex >= this.currentDeck.length) {
      this.showToast('🎉 Alle fälligen Karten durchgearbeitet!');
      this.reviewAllMode = false;
      this.filterDueCards();
      this.currentIndex = 0;
    }
    this.displayActiveMode();
  }

  // --- CARD RATING ACTIONS (CLASSIC MODE) ---
  handleCardResponse(known) {
    if (this.currentDeck.length === 0) return;

    const card = this.currentDeck[this.currentIndex];
    this.updateLeitnerProgress(card, known);

    // Shift view index
    this.currentIndex++;
    if (this.currentIndex >= this.currentDeck.length) {
      this.showToast('🎉 Alle fälligen Karten in diesem Stapel geschafft!');
      this.reviewAllMode = false;
      this.filterDueCards();
      this.currentIndex = 0;
    }

    // Return visual card flip to normal with delay before loading card
    if (this.isFlipped) {
      this.cardContainerEl.classList.remove('flipped');
      this.isFlipped = false;
      setTimeout(() => {
        this.displayActiveMode();
      }, 250);
    } else {
      this.displayActiveMode();
    }
  }

  handleSkipCard() {
    if (this.currentDeck.length === 0) return;

    this.currentIndex++;
    if (this.currentIndex >= this.currentDeck.length) {
      this.showToast('⏭️ Einige Karten übersprungen. Lade Stapel neu...');
      this.reviewAllMode = false;
      this.filterDueCards();
      this.currentIndex = 0;
    }

    if (this.isFlipped) {
      this.cardContainerEl.classList.remove('flipped');
      this.isFlipped = false;
      setTimeout(() => {
        this.displayActiveMode();
      }, 250);
    } else {
      this.displayActiveMode();
    }
  }

  updateBinDistributionUI() {
    const bins = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    // Count box levels for cards in the current raw deck
    for (const card of this.rawDeck) {
      const prog = this.appState.vocabProgress[card.latin.toLowerCase()];
      const bin = prog ? prog.bin : 1;
      bins[bin]++;
    }

    const total = this.rawDeck.length || 1;
    
    // Update labels
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById(`bin-cnt-${i}`);
      if (el) el.textContent = bins[i];
    }

    const statsText = document.getElementById('vocab-bin-stats-text');
    if (statsText) {
      statsText.textContent = `${this.rawDeck.length} Vokabeln in: ${this.currentDeckName}`;
    }

    // Render stacked progress bar segments
    const progressBar = document.getElementById('vocab-bin-progress-bar');
    if (progressBar) {
      const colors = {
        1: '#fca5a5', // red/coral
        2: '#fed7aa', // orange
        3: '#fef08a', // yellow
        4: '#bfdbfe', // blue
        5: '#c7d2fe', // indigo
        6: '#a7f3d0'  // emerald green
      };
      
      let html = '';
      for (let i = 1; i <= 6; i++) {
        const pct = (bins[i] / total) * 100;
        if (pct > 0) {
          html += `<div style="width: ${pct}%; background: ${colors[i]}; transition: width 0.3s ease;"></div>`;
        }
      }
      progressBar.innerHTML = html;
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
