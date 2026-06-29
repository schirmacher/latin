import { texts } from './data/texts.js';
import { vocabularyDecks } from './data/vocabulary.js';

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
        <div class="sentence-latin-text">${wordsHtml}</div>
        <div class="sentence-translation">${translation}</div>
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
        return `<span class="latin-word" data-word="${cleanWord}">${token}</span>`;
      } else if (cleanWord.length > 0) {
        // Fallback for words not in the lexicon
        return `<span class="latin-word unlisted" data-word="${cleanWord}">${token}</span>`;
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
      this.appState.customVocabulary.push({
        latin: inflectedWord,
        forms: cleanRoot ? `Form von: ${cleanRoot}` : this.selectedWordData.lemma,
        translation: this.selectedWordData.translation,
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
