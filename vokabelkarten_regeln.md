# Regelwerk für die Vokabelkarten-Generierung und das Leitner-System

Dieses Dokument beschreibt die Regeln zur automatischen Erstellung von Lernkarten aus lateinischen Lesetexten, die grammatikalischen Bezeichnungen der Grundformen sowie die Abläufe im Vokabeltrainer (Leitner-Boxen und Multiple-Choice-Distraktoren).

---

## 1. Grammatikalische Klärungen (Wortarten & Grundformen)

Um die Begriffe präzise festzulegen, werden hier die im Lateinischen gebräuchlichen grammatikalischen Bezeichnungen definiert.

### 1.1 Grundformen (Lemmata) je Wortart
Die im Wörterbuch nachgeschlagene Grundform eines Wortes wird allgemein als **Lemma** bezeichnet.
* **Verben:** Die Grundform eines Verbs ist der **Infinitiv** (z. B. *amare* = lieben).
* **Substantive (Nomen):** Die Grundform eines Substantivs ist der **Nominativ Singular** (z. B. *filius* = der Sohn, *mater* = die Mutter).
* **Adjektive:** Die Grundform eines Adjektivs ist der **Nominativ Singular Maskulinum** (z. B. *magnus* = groß, *beatus* = glücklich).
* **Pronomen:** Die Grundform eines Pronomens ist ebenfalls meist der **Nominativ Singular Maskulinum** (z. B. *is* = er, *qui* = welcher).

### 1.2 Vollständige Liste der lateinischen Wortklassen (Wortarten)
Das Lateinische teilt Wörter in folgende Klassen ein:
1. **Verben (Verba):** Tätigkeitswörter (z. B. *amare*, *timere*).
2. **Substantive (Substantiva):** Hauptwörter (z. B. *filius*, *mater*).
3. **Adjektive (Adjectiva):** Eigenschaftswörter (z. B. *magnus*, *ligneus*).
4. **Pronomen (Pronomina):** Fürwörter (z. B. *ego*, *is*, *qui*).
5. **Adverbien (Adverbia):** Umstandswörter (z. B. *magnopere*, *tamen*).
6. **Präpositionen (Praepositiones):** Verhältniswörter (z. B. *in*, *ad*, *cum*).
7. **Konjunktionen (Coniunctiones):** Bindewörter (z. B. *et*, *sed*, *quod*).
8. **Interjektionen (Interiectiones):** Ausrufewörter (z. B. *heu!*, *o!*).

> [!NOTE]
> Das Lateinische hat **keine Artikel** (wie "der", "die", "das"). Die Artikel werden im Deutschen bei der Übersetzung von Substantiven zur Verdeutlichung hinzugefügt.

---

## 2. Regeln zur Kartenerstellung aus Lesetexten

Beim Laden oder Einlesen eines lateinischen Textes läuft die Vokabelgenerierung nach folgenden Schritten ab:

### Regel 2.1: Wortextraktion & Bereinigung[analysis_code_review.md](analysis_code_review.md)
1. Der Text wird in einzelne Wort-Token zerlegt.
2. Satzzeichen werden entfernt, alle Wörter werden in Kleinbuchstaben umgewandelt.

  ### Regel 2.2: Erstellung der Grundform-Karte (Lemma-Karte)
  Für jedes gefundene Wort wird die grammatikalische Grundform (das Lemma) ermittelt.
  * Es wird eine **Grundform-Karte** erstellt.
  * **Vorderseite:** Das Lemma (z. B. *amare* oder *filius*).
  * **Rückseite (Übersetzung):** Die deutsche Grundform aus dem kuratierten Georges-Wörterbuch (z. B. *"lieben"* für *amare*; *"der Sohn (Nominativ)"* für *filius*).
    * *Hinweis zur Eindeutigkeit:* Für Substantive und Adjektive wird auf der Rückseite standardmäßig der Kasus-Hinweis `(Nominativ)` angehängt (z. B. *"Mutter (Nominativ)"* statt nur *"Mutter"*), um Verwechslungen mit anderen Kasusformen zu verhindern.
  * **Zusatzdaten:** Georges-Wörterbucheintrag (HTML) und Wortart als Erklärung.
  
  ### Regel 2.3: Erstellung der Textform-Karte (Flexions-Karte)
  Wenn das im Text gelesene Wort eine abgewandelte (flektierte) Form der Grundform ist (z. B. *amabat* statt *amare*, oder *filium* statt *filius*), wird eine **zweite, separate Karte** erstellt.
  * **Vorderseite:** Die konkrete Textform (z. B. *amabat* oder *filium*).
  * **Rückseite (Übersetzung):** Die im Kontext passende deutsche Übersetzung, präzisiert nach folgenden Mustern:
    * **Verben:** Bei konjugierten Verbformen wird zwingend das passende deutsche Personalpronomen vorangestellt, basierend auf der grammatikalischen Person und Numerus (z. B. *"er/sie/es lief"* statt nur *"lief"*; *"er/sie/es läuft"* statt nur *"läuft"*; *"sie liefen"* statt *"liefen"*). Dies gilt **nicht** für den Infinitiv (Grundform).
    * **Substantive / Adjektive:** Um Mehrdeutigkeiten auszuschließen (z. B. bei Wörtern wie *"Mutter"*, die im Nominativ *mater* und im Akkusativ *matrem* heißen können), wird der Kasus in Klammern angehängt (z. B. *"die Mutter (Nominativ)"* bzw. *"die Mutter (Akkusativ)"*).
  * **Zusatzdaten:** Die genaue grammatikalische Bestimmung (z. B. *"3. Person Singular Imperfekt Aktiv"* oder *"Akkusativ Singular Maskulinum"*).
  * **Referenz-Link:** Die Karte erhält das Attribut `forms` mit dem Wert `"Form von: [Grundform]"` (z. B. `"Form von: filius"`).

---

## 3. Leitner-Box-Verwaltung und Fortschritts-Erhalt

### Regel 3.1: Schutz vor Überschreiben (Duplikat-Prüfung)
* Bevor eine neu generierte Karte (egal ob Grundform oder Textform) in das System eingefügt wird, prüft das Programm, ob diese Vokabel (Vorderseite in Kleinbuchstaben) bereits in der Lernhistorie (`vocabProgress` im `localStorage`) existiert.
* **Existiert sie bereits:** Die Karte wird **übersprungen** und nicht überschrieben. Box-Stufen und Wiederholungsdaten des Nutzers bleiben unberührt.
* **Existiert sie nicht:** Die Karte wird neu registriert und standardmäßig in **Box 1** einsortiert (sofort fällig).

### Regel 3.2: Lern-Abhängigkeit (Sperre für Flexions-Karten)
* Der Schüler muss zwingend zuerst das Stammwort lernen.
* Eine **Textform-Karte** (z. B. *filium*) wird im täglichen Training so lange gesperrt (ausgeblendet), bis die dazugehörige **Grundform-Karte** (z. B. *filius*) mindestens **Box 3** erreicht hat.

---

## 4. Regeln für Multiple-Choice-Distraktoren

Um zu verhindern, dass der Schüler die richtige Antwort durch einfaches Ausschließen unmöglicher Wortarten errät (z. B. weil die Frage ein Verb ist, aber drei der vier Auswahlmöglichkeiten Substantive sind), gelten für Multiple Choice folgende Regeln:

### Regel 4.1: Wortarten-Homogenität bei den Antwortmöglichkeiten
* Die drei falschen Antwortalternativen (Distraktoren) müssen **aus derselben Wortart** stammen wie die richtige Antwort.
  * *Beispiel:* Ist das gesuchte Wort ein **Verb** (z. B. *timere* ➜ *fürchten*), müssen alle falschen Auswahlmöglichkeiten ebenfalls deutsche **Verben** im Infinitiv sein (z. B. *lieben*, *töten*, *werfen*).
  * *Beispiel:* Ist das gesuchte Wort ein **Substantiv** im Akkusativ (z. B. *matrem* ➜ *die Mutter (Akkusativ)*), müssen die Distraktoren ebenfalls deutsche **Substantive** sein, idealerweise mit dem gleichen Kasushinweis (z. B. *den Sohn (Akkusativ)*, *den Großvater (Akkusativ)*).

### Regel 4.2: Ermittlung der Wortart für Distraktoren
* Das Programm liest das Attribut `explanation` oder `pos` der richtigen Karte aus, um die Wortart zu bestimmen (z. B. *"Verb"*, *"Substantiv"*, *"Adjektiv"*).
* Es filtert den Vokabelstapel nach anderen Karten derselben Kategorie, mischt diese und wählt drei zufällige Distraktoren aus.
* Sollte ein Stapel zu wenige Wörter derselben Wortart enthalten, fallen die Distraktoren auf Wörter mit ähnlichen Merkmalen zurück.

---

## 5. Datenquellen und die absolute Wahrheit (Ground Truth)

Um die Zuverlässigkeit und Fehlerfreiheit der Vokabelkarten zu garantieren, unterscheidet die App klar zwischen verschiedenen Datenebenen:

### 5.1 Der Georges-Wörterbucheintrag (100 % Ground Truth)
* **Die Quelle:** Der vollständige Artikeltext auf der Rückseite der Karten sowie im Analyse-Seitenfenster stammt direkt und unverändert aus der digitalen Datenbank des **Karl Ernst Georges (Ausführliches Handwörterbuch, 1913)**.
* **Keine Algorithmen:** Diese Definitionen werden **nicht** durch Algorithmen oder künstliche Intelligenz generiert oder interpretiert, sondern byte-genau aus dem Wörterbuchindex ausgelesen. Sie repräsentieren die absolute, wissenschaftliche Wahrheit (Ground Truth) für jedes Lemma.

### 5.2 Die kurzen Übersetzungen (Vorder- und Rückseiten-Label)
Für die kurzen Bezeichnungen im Vokabeltrainer (z. B. für Multiple Choice oder Schnellsuchen) wird folgende Priorisierung angewendet:
1. **Klasse 1: Manuelle Kuratierung (Menschliche Wahrheit)**
   * Manuell gepflegte Einträge im Text-Lexikon unter `lemmaTranslation` (in `texts.js`) und in den statischen Decks (z. B. *puer* ➜ *"der Junge"*, *timere* ➜ *"fürchten"*). Dies sind feste, fehlerfreie Wahrheiten.
2. **Klasse 2: Lexikalisches Fallback (Kontext-Übersetzung)**
   * Liegt kein expliziter `lemmaTranslation`-Wert vor, greift das System auf das kontextuelle Vokabelverzeichnis (`translation`) in `texts.js` zurück.
3. **Klasse 3: Algorithmische Ableitung (Grammatik-Anpassung)**
   * Die grammatikalischen Ergänzungen für Flexionskarten (z. B. das Hinzufügen von Personalpronomen wie *"er/sie/es"* bei Verben oder Kasus-Endungen wie `(Akkusativ)` bei Substantiven) werden auf Basis der im Text hinterlegten Grammatik-Tags algorithmisch erzeugt (z. B. Grundform *"schlafen"* + 3. Person Plural Imperfekt Indikativ Aktiv ➜ *"sie schliefen"*).

### 5.3 Georges als letzte Instanz
Sollte die kurze Übersetzung einer Karte (Klasse 2 oder 3) ungenau oder unvollständig wirken, ist der vollflächige **Georges-Wörterbucheintrag** auf der Rückseite der Karte die unfehlbare Kontrollinstanz für den Schüler. Sieht er dort Unstimmigkeiten, kann er die Karte über den Button **"Erneut lernen"** sofort zur manuellen Festigung zurücksetzen.

