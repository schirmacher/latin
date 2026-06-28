import { grammarData } from './data/grammar.js';

export class GrammarTrainerController {
  constructor(appState, updateStatsCallback) {
    this.appState = appState;
    this.updateStatsCallback = updateStatsCallback;

    this.currentDrill = null;
    this.drillActive = false;
    this.timerInterval = null;
    this.startTime = null;
    this.elapsedTime = 0; // in milliseconds

    // Elements
    this.selectEl = document.getElementById('grammar-select');
    this.btnStart = document.getElementById('btn-start-drill');
    this.btnReset = document.getElementById('btn-reset-drill');
    this.timerDisplayEl = document.getElementById('drill-timer-display');
    
    this.drillNameEl = document.getElementById('drill-name');
    this.drillDescEl = document.getElementById('drill-desc');
    this.tableHeadersEl = document.getElementById('drill-table-headers');
    this.tableRowsEl = document.getElementById('drill-table-rows');

    this.scorePercentEl = document.getElementById('drill-score-percent');
    this.scoreCircleEl = document.getElementById('drill-score-circle');
    this.resultMsgEl = document.getElementById('drill-result-msg');
    this.resultTimeEl = document.getElementById('drill-result-time');

    this.inputsList = [];

    this.init();
  }

  init() {
    this.populateDrillSelect();

    // Event listeners
    this.selectEl.addEventListener('change', () => this.setupStaticTable());
    this.btnStart.addEventListener('click', () => this.toggleDrill());
    this.btnReset.addEventListener('click', () => this.resetDrill());

    // Show initial table
    this.setupStaticTable();
  }

  populateDrillSelect() {
    let optionsHtml = '<optgroup label="Substantive (Deklinationen)">';
    grammarData.nouns.forEach(n => {
      optionsHtml += `<option value="noun_${n.id}">${n.name}</option>`;
    });
    optionsHtml += '</optgroup><optgroup label="Verben (Konjugationen)">';
    grammarData.verbs.forEach(v => {
      optionsHtml += `<option value="verb_${v.id}">${v.name}</option>`;
    });
    optionsHtml += '</optgroup>';
    
    this.selectEl.innerHTML = optionsHtml;
  }

  getDrillById(val) {
    const [type, id] = val.split('_');
    if (type === 'noun') {
      return { type, data: grammarData.nouns.find(n => n.id === id) };
    } else {
      return { type, data: grammarData.verbs.find(v => v.id === id) };
    }
  }

  setupStaticTable() {
    if (this.drillActive) {
      this.resetDrillState();
    }

    const val = this.selectEl.value;
    const drill = this.getDrillById(val);
    if (!drill || !drill.data) return;

    this.currentDrill = drill;
    this.drillNameEl.textContent = drill.data.name;
    this.drillDescEl.textContent = drill.data.description;
    
    // Set headers
    this.tableHeadersEl.innerHTML = drill.data.headers.map(h => `<th>${h}</th>`).join('');

    // Set static rows (non-interactive preview)
    this.tableRowsEl.innerHTML = drill.data.rows.map(row => {
      return `<tr>` + row.map((cell, idx) => {
        if (idx === 0) return `<td class="case-label">${cell}</td>`;
        return `<td><span style="color: var(--text-secondary); opacity: 0.8;">${cell}</span></td>`;
      }).join('') + `</tr>`;
    }).join('');

    // Reset scorecard
    this.scorePercentEl.textContent = '-';
    this.scoreCircleEl.className = 'score-circle';
    this.resultMsgEl.textContent = 'Bereit zum Starten';
    this.resultTimeEl.textContent = '';
    this.timerDisplayEl.style.display = 'none';
    this.btnReset.style.display = 'none';
    this.btnStart.textContent = 'Drill starten ⚡';
    this.btnStart.className = 'btn btn-primary';
  }

  toggleDrill() {
    if (this.drillActive) {
      // If active, stop and check score
      this.finishDrill();
    } else {
      // Start the drill!
      this.startDrill();
    }
  }

  startDrill() {
    this.drillActive = true;
    this.btnStart.textContent = 'Drill abbrechen 🛑';
    this.btnStart.className = 'btn btn-danger';
    this.btnReset.style.display = 'inline-flex';
    this.timerDisplayEl.style.display = 'inline-block';
    
    // Reset inputs
    this.inputsList = [];
    
    const drill = this.currentDrill;

    // Render interactive grid
    this.tableRowsEl.innerHTML = drill.data.rows.map((row, rIdx) => {
      let html = `<tr><td class="case-label">${row[0]}</td>`;
      
      for (let cIdx = 1; cIdx < row.length; cIdx++) {
        const correctVal = row[cIdx].toLowerCase().trim().replace(/ /g, '');
        const inputId = `drill-input-${rIdx}-${cIdx}`;
        html += `
          <td>
            <input 
              type="text" 
              class="drill-input" 
              id="${inputId}" 
              data-correct="${correctVal}" 
              placeholder="..." 
              autocomplete="off" 
              spellcheck="false"
            />
          </td>
        `;
      }
      html += `</tr>`;
      return html;
    }).join('');

    // Gather input elements and bind validation events
    this.inputsList = Array.from(this.tableRowsEl.querySelectorAll('.drill-input'));
    
    this.inputsList.forEach((inputEl, idx) => {
      inputEl.addEventListener('input', () => this.validateInput(inputEl));
      inputEl.addEventListener('blur', () => this.validateOnBlur(inputEl));
      
      // Enter key focuses next input
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.focusNextInput(idx);
        }
      });
    });

    // Focus first input
    if (this.inputsList.length > 0) {
      this.inputsList[0].focus();
    }

    // Start timer
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.timerDisplayEl.textContent = '00:00.0';
    this.timerInterval = setInterval(() => this.updateTimer(), 100);

    // Scorecard state
    this.scorePercentEl.textContent = '0%';
    this.scoreCircleEl.className = 'score-circle';
    this.resultMsgEl.textContent = 'Fülle die Tabelle aus!';
  }

  validateInput(inputEl) {
    const val = inputEl.value.toLowerCase().trim().replace(/ /g, '');
    const correct = inputEl.getAttribute('data-correct');

    // Split correct answer if multiple variants exist (e.g. "amaverunt/-ere" -> ["amaverunt", "amavere"])
    const correctVariants = correct.split('/').map(v => v.trim());

    // If input matches the full word or any of its slash variants
    const isCorrect = correctVariants.some(variant => {
      if (variant.includes('-')) {
        // e.g. "amaverunt/-ere" -> check if ends with "ere"
        // Let's resolve the stem: amaverunt or amavere
        const base = correctVariants[0]; // e.g. "amaverunt"
        const suffix = variant.replace('-', ''); // e.g. "ere"
        const stem = base.substring(0, base.length - suffix.length);
        const reconstructed = stem + suffix;
        return val === base || val === reconstructed;
      }
      return val === variant;
    });

    if (isCorrect) {
      inputEl.classList.remove('incorrect');
      inputEl.classList.add('correct');
      inputEl.disabled = true; // lock it in!
      
      // Recalculate drill score
      this.checkDrillProgress();
      
      // Auto-focus next input
      const idx = this.inputsList.indexOf(inputEl);
      this.focusNextInput(idx);
    }
  }

  validateOnBlur(inputEl) {
    if (inputEl.disabled) return; // already correct and disabled
    
    const val = inputEl.value.toLowerCase().trim().replace(/ /g, '');
    if (val === '') {
      inputEl.classList.remove('incorrect', 'correct');
      return;
    }

    const correct = inputEl.getAttribute('data-correct');
    const correctVariants = correct.split('/').map(v => v.trim());
    
    const isCorrect = correctVariants.some(variant => {
      if (variant.includes('-')) {
        const base = correctVariants[0];
        const suffix = variant.replace('-', '');
        const stem = base.substring(0, base.length - suffix.length);
        return val === base || val === (stem + suffix);
      }
      return val === variant;
    });

    if (!isCorrect) {
      inputEl.classList.add('incorrect');
      inputEl.classList.remove('correct');
    }
  }

  focusNextInput(currentIdx) {
    // Find next enabled input
    for (let i = currentIdx + 1; i < this.inputsList.length; i++) {
      if (!this.inputsList[i].disabled) {
        this.inputsList[i].focus();
        return;
      }
    }
    // Loop back to start if needed
    for (let i = 0; i < currentIdx; i++) {
      if (!this.inputsList[i].disabled) {
        this.inputsList[i].focus();
        return;
      }
    }
  }

  checkDrillProgress() {
    const correctCount = this.inputsList.filter(el => el.disabled).length;
    const percent = Math.round((correctCount / this.inputsList.length) * 100);
    this.scorePercentEl.textContent = `${percent}%`;

    if (correctCount === this.inputsList.length) {
      // Finished all cells!
      this.finishDrill();
    }
  }

  updateTimer() {
    this.elapsedTime = Date.now() - this.startTime;
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    const tenths = Math.floor((this.elapsedTime % 1000) / 100);

    const pad = (n) => n.toString().padStart(2, '0');
    this.timerDisplayEl.textContent = `${pad(minutes)}:${pad(seconds)}.${tenths}`;
  }

  finishDrill() {
    this.stopTimer();
    this.drillActive = false;
    this.btnStart.textContent = 'Drill starten ⚡';
    this.btnStart.className = 'btn btn-primary';
    this.btnReset.style.display = 'none';

    // Calculate final score
    const correctCount = this.inputsList.filter(el => el.disabled).length;
    const totalCells = this.inputsList.length;
    const percent = Math.round((correctCount / totalCells) * 100);

    this.scorePercentEl.textContent = `${percent}%`;

    if (percent === 100) {
      this.scoreCircleEl.className = 'score-circle perfect';
      this.resultMsgEl.textContent = '🎉 Hervorragend!';
      
      const min = Math.floor(this.elapsedTime / 60000);
      const sec = ((this.elapsedTime % 60000) / 1000).toFixed(1);
      const timeStr = min > 0 ? `${min} Min ${sec} Sek` : `${sec} Sek`;
      
      this.resultTimeEl.innerHTML = `Zeit: <strong>${timeStr}</strong>`;
      
      // Save stats
      this.appState.drillsCompleted++;
      this.showToast(`Drill fehlerfrei abgeschlossen in ${timeStr}!`);
      this.updateStatsCallback();
    } else {
      this.scoreCircleEl.className = 'score-circle finished';
      this.resultMsgEl.textContent = 'Drill beendet';
      this.resultTimeEl.textContent = `Ausgefüllt: ${correctCount} von ${totalCells}`;
    }

    // Disable all remaining inputs
    this.inputsList.forEach(input => input.disabled = true);
  }

  resetDrill() {
    this.resetDrillState();
    this.startDrill();
  }

  resetDrillState() {
    this.stopTimer();
    this.drillActive = false;
    this.elapsedTime = 0;
    this.timerDisplayEl.textContent = '00:00.0';
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
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
    }, 3500);
  }
}
