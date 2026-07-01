import './style.css';
import { ReaderController } from './reader.js';
import { VocabTrainerController } from './vocabTrainer.js';
import { GrammarTrainerController } from './grammarTrainer.js';

// Global Application State Management
const STATE_LOCAL_STORAGE_KEY = 'antigravitas_latin_state_v1';
const GEMINI_KEY_STORAGE_KEY = 'antigravitas_latin_gemini_key';

class App {
  constructor() {
    this.state = this.loadState();
    
    // Sub-controllers
    this.readerController = null;
    this.vocabTrainerController = null;
    this.grammarTrainerController = null;

    this.init();
  }

  loadState() {
    const raw = localStorage.getItem(STATE_LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse app state from local storage. Resetting.', e);
      }
    }
    
    return {
      customVocabulary: [], // Cards added by user: { latin, forms, translation, explanation, custom: true }
      vocabProgress: {},    // Map of cardKey -> { bin, lastReviewed, nextReview }
      masteredVocab: [],    // Deprecated, replaced by vocabProgress
      startedTexts: [],     // Array of text IDs started
      drillsCompleted: 0,   // Count of perfect grammar drills
      courseLevel: 'intermediate' // 'beginner' or 'intermediate'
    };
  }

  saveState() {
    localStorage.setItem(STATE_LOCAL_STORAGE_KEY, JSON.stringify(this.state));
  }

  init() {
    // 1. Initialize View Router
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-container');
    const pageTitleEl = document.getElementById('page-title');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetView = link.getAttribute('data-view');
        
        // Update active class on nav links
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Update active class on view panels
        views.forEach(v => v.classList.remove('active'));
        const activeView = document.getElementById(`view-${targetView}`);
        if (activeView) {
          activeView.classList.add('active');
        }

        // Update top header title
        const titles = {
          dashboard: 'Übersicht',
          reader: 'Interaktiver Leser',
          vocab: 'Wortschatz-Trainer',
          grammar: 'Grammatik-Tabellen & Drills'
        };
        pageTitleEl.textContent = titles[targetView] || 'Latein-Lernbegleiter';

        // Custom action on view activations
        if (targetView === 'vocab' && this.vocabTrainerController) {
          // Re-populate decks in case user added new custom vocabulary from the reader
          this.vocabTrainerController.populateDecks();
        }

        // Close sidebar drawer on mobile after clicking navigation
        document.body.classList.remove('sidebar-open');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // 2. Dashboard Quick Actions router bindings
    document.getElementById('btn-quick-read').addEventListener('click', () => {
      this.navigateToView('reader');
    });
    document.getElementById('btn-quick-vocab').addEventListener('click', () => {
      this.navigateToView('vocab');
    });
    document.getElementById('btn-quick-drill').addEventListener('click', () => {
      this.navigateToView('grammar');
    });

    // 3. Modals event bindings
    this.setupModals();

    // 4. Initialize Controller instances
    this.readerController = new ReaderController(this.state, () => this.handleStateUpdate());
    this.vocabTrainerController = new VocabTrainerController(this.state, () => this.handleStateUpdate());
    this.grammarTrainerController = new GrammarTrainerController(this.state, () => this.handleStateUpdate());

    // 5. Draw initial statistics
    this.updateStatsUI();

    // 6. Level Select handling
    const levelSelect = document.getElementById('course-level-select');
    if (levelSelect) {
      levelSelect.value = this.state.courseLevel || 'intermediate';
      levelSelect.addEventListener('change', (e) => {
        this.state.courseLevel = e.target.value;
        this.saveState();
        this.handleLevelChange();
      });
    }

    // 7. Mobile Sidebar Hamburger Menu Toggle
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
        if (sidebarBackdrop) {
          sidebarBackdrop.classList.toggle('active');
        }
      });
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
        sidebarBackdrop.classList.remove('active');
      });
    }

    this.handleLevelChange(); // set initial dashboard text
  }

  handleLevelChange() {
    const welcomeCard = document.querySelector('.dashboard-welcome');
    const quickStartList = document.getElementById('dashboard-quick-start-list');
    const level = this.state.courseLevel || 'intermediate';
    
    if (welcomeCard) {
      if (level === 'beginner') {
        welcomeCard.innerHTML = `
          <h2>Salvete! 👋</h2>
          <p>Willkommen bei deinem Latein-Lernbegleiter für absolute Anfänger. Hier starten wir von Grund auf: von einfachen Sätzen wie "Roma in Italia est" bis zu deinen ersten Schritten im selbstständigen Lesen. Nutze den <strong>Leser</strong> für kleine Lektionen und trainiere deinen Grundwortschatz im <strong>Wortschatz-Trainer</strong>.</p>
        `;
      } else {
        welcomeCard.innerHTML = `
          <h2>Salvete! 👋</h2>
          <p>Willkommen bei deinem Latein-Lernbegleiter. Da du bereits Vorkenntnisse hast, zielt dieses Tool darauf ab, deine Lesefähigkeit durch direkten Kontakt mit lateinischen Texten zu trainieren und gleichzeitig deine Grammatik-Automatismen zu festigen.</p>
        `;
      }
    }

    if (quickStartList) {
      if (level === 'beginner') {
        quickStartList.innerHTML = `
          <div class="qs-item">
            <div class="qs-info">
              <h4>Lektion 1: Imperium Romanum lesen</h4>
              <p>Lerne einfache lateinische Sätze über Geographie und den Unterschied von Singular/Plural kennen.</p>
            </div>
            <button class="btn btn-primary" id="btn-quick-read">Lesen 📖</button>
          </div>
          <div class="qs-item">
            <div class="qs-info">
              <h4>Geographie-Vokabeln lernen</h4>
              <p>Drille die Vokabeln der ersten Lektion wie terra, insula und fluvius im Flashcard-Trainer.</p>
            </div>
            <button class="btn btn-gold" id="btn-quick-vocab">Lernen 🎴</button>
          </div>
          <div class="qs-item">
            <div class="qs-info">
              <h4>1. Deklination kennenlernen</h4>
              <p>Sieh dir die Nominativ- und Genitiv-Endungen der Substantive an.</p>
            </div>
            <button class="btn btn-secondary" id="btn-quick-drill">Ansehen 🏛️</button>
          </div>
        `;
      } else {
        quickStartList.innerHTML = `
          <div class="qs-item">
            <div class="qs-info">
              <h4>Ritchie's Fabulae Faciles lesen</h4>
              <p>Starte mit einfachen Mythenerzählungen über Perseus und nutze die Klick-Analyse.</p>
            </div>
            <button class="btn btn-primary" id="btn-quick-read">Lesen 📖</button>
          </div>
          <div class="qs-item">
            <div class="qs-info">
              <h4>Vokabeln auffrischen</h4>
              <p>Wiederhole das Grundlagen-Auffrischungsdeck, um wichtige Stammformen zu reaktivieren.</p>
            </div>
            <button class="btn btn-gold" id="btn-quick-vocab">Lernen 🎴</button>
          </div>
          <div class="qs-item">
            <div class="qs-info">
              <h4>1. Deklination drillen (a-Deklination)</h4>
              <p>Trainiere die Noun-Endungen auf Geschwindigkeit und Präzision.</p>
            </div>
            <button class="btn btn-secondary" id="btn-quick-drill">Drillen 🏛️</button>
          </div>
        `;
      }

      // Re-bind dashboard quick start click events because we re-created the buttons
      document.getElementById('btn-quick-read').addEventListener('click', () => {
        this.navigateToView('reader');
      });
      document.getElementById('btn-quick-vocab').addEventListener('click', () => {
        this.navigateToView('vocab');
      });
      document.getElementById('btn-quick-drill').addEventListener('click', () => {
        this.navigateToView('grammar');
      });
    }

    // Update controllers to filter based on new level
    if (this.readerController) {
      this.readerController.updateSelectOptions();
    }
    if (this.vocabTrainerController) {
      this.vocabTrainerController.populateDecks();
      this.vocabTrainerController.loadSelectedDeck();
    }
  }

  setupModals() {
    const settingsModal = document.getElementById('settings-modal');
    const aiModal = document.getElementById('ai-modal');
    const keyInput = document.getElementById('input-gemini-key');

    // Settings open/close
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      keyInput.value = localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || '';
      settingsModal.style.display = 'flex';
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const key = keyInput.value.trim();
      if (key) {
        localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key);
        this.showToast('API Key erfolgreich gespeichert.');
      } else {
        localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
        this.showToast('API Key entfernt.');
      }
      settingsModal.style.display = 'none';
    });

    // Review Modal open/close
    const reviewModal = document.getElementById('review-modal');
    document.getElementById('btn-open-review').addEventListener('click', () => {
      if (this.vocabTrainerController) {
        // Dynamically recreate the cards from the Perseus decks following the updated rules
        const pDeck1 = this.vocabTrainerController.getPerseusDeck();
        const pDeck2 = this.vocabTrainerController.getPerseus4To6Deck();
        const cards = [
          ...(pDeck1 ? pDeck1.cards : []),
          ...(pDeck2 ? pDeck2.cards : [])
        ];
        
        const grid = document.getElementById('review-cards-grid');
        if (grid) {
          grid.innerHTML = cards.map(c => `
            <div class="glass-card" style="padding: 12px 16px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 4px; background: rgba(30, 41, 59, 0.4);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 6px;">
                <strong style="color: var(--accent-indigo); font-size: 15px;">${c.latin}</strong>
                <span style="font-size: 10px; color: var(--text-muted); background: rgba(255, 255, 255, 0.04); padding: 2px 6px; border-radius: 4px;">
                  ${c.forms && c.forms.startsWith('Form von:') ? 'Flexions-Form' : 'Grundform'}
                </span>
              </div>
              <div style="font-size: 13px; color: var(--text-primary); font-weight: 500; margin-top: 4px;">
                ${c.translation}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">
                ${c.explanation}
              </div>
            </div>
          `).join('');
        }
        
        const countEl = document.getElementById('review-cards-count');
        if (countEl) {
          countEl.textContent = `${cards.length} Karten`;
        }
      }
      reviewModal.style.display = 'flex';
    });

    document.getElementById('btn-close-review').addEventListener('click', () => {
      reviewModal.style.display = 'none';
    });

    document.getElementById('btn-reset-vocab-debug').addEventListener('click', () => {
      if (confirm('Bist du sicher, dass du deinen Lernfortschritt und alle benutzerdefinierten Vokabeln zurücksetzen willst?')) {
        this.state.customVocabulary = [];
        this.state.vocabProgress = {};
        this.saveState();
        this.updateStatsUI();
        if (this.vocabTrainerController) {
          this.vocabTrainerController.populateDecks();
          this.vocabTrainerController.loadSelectedDeck();
        }
        this.showToast('Lernfortschritt zurückgesetzt!');
        document.getElementById('btn-open-review').click(); // refresh list
      }
    });

    // Close AI modal
    document.getElementById('btn-close-ai').addEventListener('click', () => {
      aiModal.style.display = 'none';
    });

    // Word analysis explain click
    document.getElementById('btn-reader-ai-explain').addEventListener('click', () => {
      if (this.readerController && this.readerController.selectedWordData) {
        const data = this.readerController.selectedWordData;
        this.requestAIExplanation(data.latin, data.lemma, data.pos, data.parse, data.translation);
      }
    });

    // Flashcard back explain click
    document.getElementById('btn-card-ai-explain').addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card flip
      if (this.vocabTrainerController && this.vocabTrainerController.currentDeck.length > 0) {
        const card = this.vocabTrainerController.currentDeck[this.vocabTrainerController.currentIndex];
        this.requestAIExplanation(card.latin, card.forms || card.latin, 'Vokabelkarte', 'Vokabel-Stammform', card.translation);
      }
    });
  }

  async requestAIExplanation(word, lemma, pos, parse, translation) {
    const aiModal = document.getElementById('ai-modal');
    const body = document.getElementById('ai-modal-body');
    
    body.innerHTML = '';
    aiModal.style.display = 'flex';

    const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE_KEY);
    if (!apiKey) {
      body.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="font-size: 40px; margin-bottom: 12px;">🔑</div>
          <h4 style="margin-bottom: 8px; color: var(--accent-gold);">Kein API-Key hinterlegt</h4>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
            Um KI-Erklärungen direkt in der App zu laden, musst du einen Gemini API Key in den Einstellungen hinterlegen.
          </p>
          <button class="btn btn-primary" id="btn-ai-to-settings">Zu den Einstellungen ⚙️</button>
        </div>
      `;
      document.getElementById('btn-ai-to-settings').addEventListener('click', () => {
        aiModal.style.display = 'none';
        document.getElementById('btn-open-settings').click();
      });
      return;
    }

    // Render loading spinner
    body.innerHTML = `
      <div class="spinner-container">
        <div class="spinner"></div>
        <p style="color: var(--text-secondary); font-size: 14px;">KI-Lehrer formuliert eine Erklärung für "${word}"...</p>
      </div>
    `;

    try {
      const responseText = await this.fetchGeminiExplanation(apiKey, word, lemma, pos, parse, translation);
      body.innerHTML = this.parseMarkdownToHTML(responseText);
    } catch (err) {
      console.error(err);
      body.innerHTML = `
        <div style="text-align: center; padding: 20px 10px; color: var(--accent-rose);">
          <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
          <h4 style="margin-bottom: 8px;">Fehler bei der KI-Anfrage</h4>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
            Die Anfrage an die Gemini API ist fehlgeschlagen. Bitte überprüfe deine Internetverbindung und den eingegebenen API Key.
          </p>
          <p style="font-size: 12px; font-family: monospace; margin-top: 10px; opacity: 0.8;">
            Details: ${err.message}
          </p>
        </div>
      `;
    }
  }

  async fetchGeminiExplanation(apiKey, word, lemma, pos, parse, translation) {
    const prompt = `Du bist ein erfahrener, freundlicher Lateinlehrer für deutschsprachige Schüler. 
Erkläre das lateinische Wort "${word}" kurz, anschaulich und präzise auf Deutsch.

Kontextuelle Angaben:
- Stammform (Lemma): ${lemma}
- Wortart: ${pos}
- Bestimmung im Satz: ${parse}
- Standard-Übersetzung: ${translation}

Bitte strukturiere deine Erklärung wie folgt:
1. Bedeutung & Übersetzung (Wie übersetzt man dieses Wort am besten? Gibt es Nuancen?)
2. Grammatikalische Einordnung (Deklination/Konjugationsklasse, Stammformen, Besonderheiten oder Ausnahmen wie z.B. gemischte Deklination bei domus)
3. Beispielsätze (1-2 kurze lateinische Minibeispiele oder Phrasen mit deutscher Übersetzung).

Formatierungsanweisung: Formatiere deine Antwort in lesbarem Markdown (nutze ## für Überschriften, * für Stichpunkte, fettgedruckte Wörter für Hervorhebungen). Halte es kompakt und fokussiert (ca. 120-180 Wörter).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Status ${response.status}`);
    }

    const json = await response.json();
    if (json.candidates && json.candidates[0].content.parts[0].text) {
      return json.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Ungültiges Antwortformat der API');
    }
  }

  parseMarkdownToHTML(md) {
    let html = md;
    
    // Escape HTML tags to prevent XSS/rendering issues
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Replace inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Replace headings (### or ## or #)
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^# (.*$)/gim, '<h4>$1</h4>');
    
    // Replace bold text **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace list items
    // First convert '* item' or '- item' to <li>item</li>
    html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li>$1</li>');
    
    // Wrap lists (groups of <li>) in <ul>
    // We do a regex pass that detects contiguous li items and wraps them
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // merge adjacent uls
    
    // Replace paragraphs (double newlines)
    html = html.replace(/\n\s*\n/g, '</p><p>');
    
    // Replace single newlines with br
    html = html.replace(/\n/g, '<br>');
    
    return `<div class="ai-explanation"><p>${html}</p></div>`;
  }

  navigateToView(viewName) {
    const navLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (navLink) {
      navLink.click();
    }
  }

  handleStateUpdate() {
    this.saveState();
    this.updateStatsUI();
  }

  updateStatsUI() {
    // Mastered vocabulary cards count (Bin 6 / Mastered)
    let vocabCount = 0;
    if (this.state.vocabProgress) {
      vocabCount = Object.values(this.state.vocabProgress).filter(p => p.bin >= 6).length;
    }
    document.getElementById('stat-vocab-mastered').textContent = vocabCount;
    document.getElementById('dash-vocab-num').textContent = vocabCount;

    // Started reading texts count
    const textCount = this.state.startedTexts.length;
    document.getElementById('stat-texts-read').textContent = textCount;
    document.getElementById('dash-texts-num').textContent = textCount;

    // Completed grammar drills count
    const drillCount = this.state.drillsCompleted;
    document.getElementById('stat-drills-done').textContent = drillCount;
    document.getElementById('dash-drills-num').textContent = drillCount;
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

// Instantiate the application once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
