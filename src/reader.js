import { texts } from './data/texts.js';
import { vocabularyDecks, baseTranslationOverrides } from './data/vocabulary.js';
import { georgesDictionary } from './data/dictionary.js';

export class ReaderController {
  constructor(appState, updateStatsCallback) {
    this.appState = appState;
    this.updateStatsCallback = updateStatsCallback;
    this.currentText = null;
    this.selectedWordData = null;

    // Elements
    this.selectEl = document.getElementById('reader-text-select');
    this.titleEl = document.getElementById('reader-text-title');
    this.descEl = document.getElementById('reader-text-desc');
    this.contentEl = document.getElementById('reader-text-content');
    this.analysisBodyEl = document.getElementById('reader-analysis-body');
    this.analysisFooterEl = document.getElementById('reader-analysis-footer');
    this.toggleTranslationBtn = document.getElementById('btn-toggle-translation');
    this.addToVocabBtn = document.getElementById('btn-add-to-vocab');

    this.showTranslation = false;

    this.init();
  }

  init() {
    this.updateSelectOptions();

    // Event listeners
    this.selectEl.addEventListener('change', (e) => this.loadText(e.target.value));
    this.toggleTranslationBtn.addEventListener('click', () => this.toggleTranslations());
    this.addToVocabBtn.addEventListener('click', () => this.addSelectedToVocab());

    // Mobile close drawer button
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => {
        const sidepanel = document.querySelector('.reader-sidepanel');
        if (sidepanel) {
          sidepanel.classList.remove('drawer-open');
        }
        // Deselect active word in reader text
        this.contentEl.querySelectorAll('.latin-word').forEach(el => el.classList.remove('active-word'));
      });
    }
  }

  updateSelectOptions() {
    const level = this.appState.courseLevel || 'intermediate';
    const filtered = texts.filter(t => t.level === level);
    
    this.selectEl.innerHTML = filtered
      .map(t => `<option value="${t.id}">${t.title} (${t.difficulty})</option>`)
      .join('');
      
    if (filtered.length > 0) {
      this.loadText(filtered[0].id);
    } else {
      this.clearText();
    }
  }

  clearText() {
    this.currentText = null;
    this.titleEl.textContent = 'Keine Lektionen verfügbar';
    this.descEl.textContent = 'Für diese Kursstufe stehen momentan keine Lesetexte zur Verfügung.';
    this.contentEl.innerHTML = '';
    this.clearAnalysis();
  }

  loadText(id) {
    const textObj = texts.find(t => t.id === id);
    if (!textObj) return;

    this.currentText = textObj;
    this.titleEl.textContent = textObj.title;
    this.descEl.textContent = textObj.description;
    this.contentEl.innerHTML = '';
    this.showTranslation = false;
    this.toggleTranslationBtn.classList.remove('btn-primary');
    this.toggleTranslationBtn.classList.add('btn-secondary');
    this.clearAnalysis();

    // Render sentences
    textObj.latin.forEach((sentence, idx) => {
      const translation = textObj.translations ? textObj.translations[idx] : '';
      
      const sentenceContainer = document.createElement('div');
      sentenceContainer.className = 'latin-sentence-container';
      
      const wordsHtml = this.formatSentence(sentence, textObj.lexicon);
      
      sentenceContainer.innerHTML = `
        <div class="sentence-content">
          <div class="sentence-latin-text">${wordsHtml}</div>
          <div class="sentence-translation" id="trans-${idx}">${translation}</div>
        </div>
        <button class="btn-translate-sentence" data-target="trans-${idx}" title="Satz übersetzen">
          👁️
        </button>
      `;
      
      this.contentEl.appendChild(sentenceContainer);
    });

    // Add click listeners to words
    this.contentEl.querySelectorAll('.latin-word').forEach(wordEl => {
      wordEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectWord(wordEl);
      });
    });

    // Add click listeners to sentence translation toggles
    this.contentEl.querySelectorAll('.btn-translate-sentence').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const transEl = document.getElementById(targetId);
        if (transEl) {
          transEl.classList.toggle('visible');
          btn.classList.toggle('active');
        }
      });
    });

    // Add click listeners to word retrain buttons
    this.contentEl.querySelectorAll('.retrain-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cleanWord = btn.getAttribute('data-word');
        this.retrainWord(cleanWord);
      });
    });

    // Mark as started in app state
    if (!this.appState.startedTexts.includes(id)) {
      this.appState.startedTexts.push(id);
      this.updateStatsCallback();
    }
  }

  formatSentence(sentenceText, lexicon) {
    // Splits by spaces and punctuation, keeping dividers
    const tokens = sentenceText.split(/(\s+|[,;.:!?()\-]+)/);
    return tokens.map(token => {
      if (token.trim() === '') {
        return token; // spacing
      }
      // Strip punctuation to find clean alphabetical word
      const cleanWord = token.toLowerCase().replace(/[^a-zäöüßāēīōū]/gi, '');
      if (cleanWord.length > 0 && lexicon[cleanWord]) {
        return `<span class="latin-word" data-word="${cleanWord}">${token}<span class="retrain-word-btn" data-word="${cleanWord}" title="Zurücksetzen in Box 1">🔄</span></span>`;
      } else if (cleanWord.length > 0) {
        // Fallback for words not in the lexicon
        return `<span class="latin-word unlisted" data-word="${cleanWord}">${token}<span class="retrain-word-btn" data-word="${cleanWord}" title="Zurücksetzen in Box 1">🔄</span></span>`;
      } else {
        return token; // just punctuation
      }
    }).join('');
  }

  selectWord(wordEl) {
    // Reset previous active word
    this.contentEl.querySelectorAll('.latin-word').forEach(el => el.classList.remove('active-word'));
    wordEl.classList.add('active-word');

    // Open drawer on mobile
    const sidepanel = document.querySelector('.reader-sidepanel');
    if (sidepanel) {
      sidepanel.classList.add('drawer-open');
    }

    const cleanWord = wordEl.getAttribute('data-word');
    const wordData = this.currentText.lexicon[cleanWord];

    if (wordData) {
      this.selectedWordData = {
        latin: wordEl.textContent.trim().replace(/[,;.:!?()\-]/g, ''),
        lemma: wordData.lemma,
        pos: wordData.pos,
        parse: wordData.parse,
        translation: wordData.translation
      };

      // Look up in Georges dictionary
      const lemmaKey = wordData.lemma.split(/[,;\s]/)[0].toLowerCase().trim().replace(/[^a-zāēīōū]/g, '');
      const georgesEntry = georgesDictionary[lemmaKey];
      let georgesHtmlSection = '';
      if (georgesEntry && georgesEntry.html) {
        georgesHtmlSection = `
          <div style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px; text-align: left;">
            <div style="font-size: 11px; font-weight: 600; color: var(--accent-indigo); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">📖 Georges Handwörterbuch (1913)</div>
            <div style="font-size: 12px; line-height: 1.5; max-height: 180px; overflow-y: auto; background: rgba(255,255,255,0.015); padding: 8px 10px; border-radius: var(--border-radius-sm); border: 1px solid rgba(255,255,255,0.04); color: var(--text-secondary);">
              ${georgesEntry.html}
            </div>
          </div>
        `;
      }

      this.analysisBodyEl.innerHTML = `
        <div class="word-info">
          <div class="word-hero">
            <div class="word-latin">${this.selectedWordData.latin}</div>
            <div class="word-lemma">Stammform: ${this.selectedWordData.lemma}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Wortart</div>
            <div class="info-val">${this.selectedWordData.pos}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Bestimmung (Grammatik)</div>
            <div class="info-val">${this.selectedWordData.parse}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Übersetzung (Deutsch)</div>
            <div class="info-val translation-val">${this.selectedWordData.translation}</div>
          </div>
          ${georgesHtmlSection}
        </div>
      `;
      this.analysisFooterEl.style.display = 'block';
    } else {
      this.selectedWordData = {
        latin: wordEl.textContent.trim().replace(/[,;.:!?()\-]/g, ''),
        lemma: cleanWord,
        pos: 'Unbekannt',
        parse: 'Keine Grammatikdaten vorhanden',
        translation: 'Klicke auf "Hinzufügen" um eigene Übersetzung zu pflegen'
      };

      this.analysisBodyEl.innerHTML = `
        <div class="word-info">
          <div class="word-hero">
            <div class="word-latin">${this.selectedWordData.latin}</div>
            <div class="word-lemma">Keine Datenbank-Treffer</div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); text-align: center;">
            Dieses Wort ist nicht vollständig annotiert. Du kannst es dennoch zu deiner Vokabelliste hinzufügen und dort übersetzen.
          </p>
        </div>
      `;
      this.analysisFooterEl.style.display = 'block';
    }
  }

  clearAnalysis() {
    this.selectedWordData = null;
    this.analysisBodyEl.innerHTML = `
      <div class="empty-sidepanel">
        <div class="empty-sidepanel-icon">👆</div>
        <p>Klicke auf ein beliebiges lateinisches Wort im Text, um dessen Wortart, Fall, Stammformen und deutsche Übersetzung anzuzeigen.</p>
      </div>
    `;
    this.analysisFooterEl.style.display = 'none';

    // Close drawer on mobile
    const sidepanel = document.querySelector('.reader-sidepanel');
    if (sidepanel) {
      sidepanel.classList.remove('drawer-open');
    }
  }

  toggleTranslations() {
    this.showTranslation = !this.showTranslation;
    const transEls = this.contentEl.querySelectorAll('.sentence-translation');
    
    if (this.showTranslation) {
      transEls.forEach(el => el.classList.add('visible'));
      this.toggleTranslationBtn.classList.remove('btn-secondary');
      this.toggleTranslationBtn.classList.add('btn-primary');
    } else {
      transEls.forEach(el => el.classList.remove('visible'));
      this.toggleTranslationBtn.classList.remove('btn-primary');
      this.toggleTranslationBtn.classList.add('btn-secondary');
    }
  }

  addSelectedToVocab() {
    if (!this.selectedWordData) return;

    // Check if custom deck exists, if not create it
    if (!this.appState.customVocabulary) {
      this.appState.customVocabulary = [];
    }

    // Extract clean lemma root (e.g. "urbs" from "urbs, urbis, f.")
    const cleanRoot = this.selectedWordData.lemma.split(/[,;\s]/)[0].toLowerCase().trim().replace(/[^a-zāēīōū]/g, '');
    const inflectedWord = this.selectedWordData.latin.toLowerCase();

    // Helper to find base translation in static decks if available
    const findStaticVocabCard = (latinWord) => {
      const clean = latinWord.toLowerCase().trim();
      if (baseTranslationOverrides[clean]) {
        return baseTranslationOverrides[clean];
      }
      for (const deck of vocabularyDecks) {
        const card = deck.cards.find(c => c.latin.toLowerCase() === clean);
        if (card) return card;
      }
      return null;
    };

    let addedRoot = false;
    let addedForm = false;

    // 1. Add the root (lemma) card if it differs from the inflected form
    if (cleanRoot && cleanRoot !== inflectedWord) {
      const rootExists = this.appState.customVocabulary.some(
        c => c.latin.toLowerCase() === cleanRoot
      );
      if (!rootExists) {
        let baseTranslation = this.selectedWordData.translation.split('/')[0].split(';')[0].trim();
        let baseExplanation = `${this.selectedWordData.pos} (Grundform)`;

        const staticCard = findStaticVocabCard(cleanRoot);
        if (staticCard) {
          baseTranslation = staticCard.translation;
          if (staticCard.explanation) {
            baseExplanation = staticCard.explanation;
          }
        }

        this.appState.customVocabulary.push({
          latin: cleanRoot,
          forms: this.selectedWordData.lemma,
          translation: baseTranslation,
          explanation: baseExplanation,
          custom: true
        });
        addedRoot = true;
      }
    }

    // 2. Add the inflected card
    const formExists = this.appState.customVocabulary.some(
      c => c.latin.toLowerCase() === inflectedWord
    );
    if (!formExists) {
      let displayTranslation = this.selectedWordData.translation;
      if (this.selectedWordData.pos.includes("Substantiv") || this.selectedWordData.pos.includes("Adjektiv")) {
        const caseMatch = this.selectedWordData.parse.match(/(Nominativ|Genitiv|Dativ|Akkusativ|Ablativ|Vokativ)/i);
        if (caseMatch) {
          displayTranslation = `${this.selectedWordData.translation} (${caseMatch[0]})`;
        }
      }

      this.appState.customVocabulary.push({
        latin: inflectedWord,
        forms: cleanRoot ? `Form von: ${cleanRoot}` : this.selectedWordData.lemma,
        translation: displayTranslation,
        explanation: `${this.selectedWordData.pos} | ${this.selectedWordData.parse} (Aus: ${this.currentText.title})`,
        custom: true
      });
      addedForm = true;
    }

    if (addedRoot && addedForm) {
      this.showToast(`"${inflectedWord}" (Form) & "${cleanRoot}" (Grundform) hinzugefügt!`);
    } else if (addedForm) {
      this.showToast(`"${inflectedWord}" wurde zu deinen Vokabeln hinzugefügt!`);
    } else if (addedRoot) {
      this.showToast(`Grundform "${cleanRoot}" wurde hinzugefügt!`);
    } else {
      this.showToast('Dieses Wort und seine Grundform sind bereits in deinen Vokabeln.');
    }

    this.updateStatsCallback();
  }

  retrainWord(cleanWord) {
    this.appState.vocabProgress = this.appState.vocabProgress || {};
    const progress = this.appState.vocabProgress[cleanWord] || { bin: 1, lastReviewed: 0, nextReview: 0 };
    progress.bin = 1;
    progress.lastReviewed = Date.now();
    progress.nextReview = Date.now(); // due immediately

    this.appState.vocabProgress[cleanWord] = progress;
    
    // Ensure word exists in custom vocab deck
    this.appState.customVocabulary = this.appState.customVocabulary || [];
    const wordExists = this.appState.customVocabulary.some(c => c.latin.toLowerCase() === cleanWord);
    
    if (!wordExists) {
      let baseTranslation = "Unbekannt";
      let baseForms = "";
      let baseExplanation = "Klick-Addition";
      
      const wordData = this.currentText.lexicon[cleanWord];
      if (wordData) {
        baseTranslation = wordData.translation;
        baseForms = wordData.lemma;
        baseExplanation = `${wordData.pos} | ${wordData.parse} (Aus: ${this.currentText.title})`;
      }
      
      this.appState.customVocabulary.push({
        latin: cleanWord,
        forms: baseForms,
        translation: baseTranslation,
        explanation: baseExplanation,
        custom: true
      });
    }

    this.updateStatsCallback();
    this.showToast(`🔄 "${cleanWord}" zurück in Box 1 gelegt (Sofort fällig)!`);
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
