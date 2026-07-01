# Research: Curated Free Latin-German Dictionaries & Databases

To avoid AI hallucinations and ensure college-level grammatical precision, we can build a lightweight local dictionary database for the app by compiling data from free, curated, academic-grade bilingual sources. 

Below is an overview of the best public-domain and open-license Latin-German linguistic resources, their formats, and how we can integrate them.

---

## 📚 1. The Leading Free Latin-German Databases

### A. Karl Ernst Georges (Ausführliches lateinisch-deutsches Handwörterbuch - 1913)
*   **Status:** Public Domain (Karl Ernst Georges died in 1895; editions up to 1913 are fully out of copyright).
*   **Academic Quality:** **Outstanding (Gold Standard).** It remains the premier academic resource for Latin-German lexicography in German universities.
*   **Format & Availability:**
    *   **Full Text:** Structured HTML on [Zeno.org](http://www.zeno.org/Georges-1913).
    *   **Machine-Readable:** Nikita Murzintcev’s [Latin Dictionaries project](https://github.com/murchik/latin-dictionaries) hosts community-digitized versions of Georges' dictionaries in **StarDict / Slob** format.
    *   **TEI/XML:** Several digital humanities groups have partial TEI-XML representations of the Georges text.

### B. German Wiktionary (de.wiktionary.org - Latin Section)
*   **Status:** Open License (**Creative Commons Attribution-ShareAlike 4.0 / CC-BY-SA**).
*   **Academic Quality:** **Very High.** Wiktionary has excellent, community-curated tables for Latin declensions and conjugations, accompanied by exact German meanings and part-of-speech labels.
*   **Format & Availability:**
    *   **Dumps:** Wikimedia provides weekly database dumps (XML/JSON) of Wiktionary.
    *   **Parsed Datasets:** Projects like the *Enhanced Latin Lemma Dataset* (available on Zenodo) parse Wiktionary content into clean, flat **JSON/CSV** datasets containing lemma, cases, and tense forms.
    *   **REST API:** Can be queried dynamically client-side: `https://de.wiktionary.org/api/rest_v1/page/html/{word}`.

### C. GNU FreeDict Project (la-de - Latin to German)
*   **Status:** Open Source (**GNU General Public License / GPL**).
*   **Academic Quality:** **Moderate.** It is a structured bilingual wordlist with basic translations, though less comprehensive than Georges.
*   **Format & Availability:**
    *   **TEI XML:** Directly downloadable in structured TEI-XML format from the [FreeDict Github Repositories](https://github.com/freedict/fd-dictionaries/tree/master/la-de). 
    *   **Usability:** Highly convenient for converting into a flat JSON lookup file with a script.

---

## 🛠️ 2. How to Build the App's Local Dictionary

To keep the client-side app fast and lightweight, we do not want to load the entire 60,000-word Georges dictionary (which would be >15MB of raw JSON). Instead, we can create a **curated local dictionary** containing the **~2,000 most frequent classical Latin words** (e.g. the *Core Latin Vocabulary* list).

This local database (`src/data/dictionary.js`) can be structured as follows:

```javascript
export const localDictionary = {
  "puer": { 
    lemma: "puer, pueri, m.", 
    pos: "Substantiv", 
    translation: "der Junge", 
    explanation: "o-Deklination, maskulin" 
  },
  "habitare": { 
    lemma: "habitare", 
    pos: "Verb", 
    translation: "wohnen", 
    explanation: "a-Konjugation, Infinitiv" 
  }
  // ... compiled from FreeDict or Wiktionary
};
```

### Proposed Workflow:
1.  **Extract:** We can write a script to download the **FreeDict (la-de)** XML database or the **Wiktionary Enhanced Dataset**.
2.  **Filter:** Filter the database down to the most common 2,000 classical Latin lemmas (which cover ~85% of all vocabulary in Caesar, Cicero, and the Vulgate).
3.  **Compile:** Compile this subset into a single **200KB JSON** file (`src/data/dictionary.js`) and bundle it directly into the application.
4.  **Lookup:** When a user clicks a word or harvests it in the reader, the app queries this local dictionary. If found, it automatically fills in the Nominative base translation. If not found, it falls back to the text's annotation.
