// Lateinische Grammatiktabellen und Erklärungen auf Deutsch
export const grammarData = {
  nouns: [
    {
      id: "decl_1",
      name: "1. Deklination (a-Deklination)",
      description: "Hauptsächlich feminine Substantive (z.B. amica - die Freundin, via - der Weg). Einige wenige maskuline Berufe gehören auch hierher (poeta - Dichter, agricola - Bauer).",
      example: "amica (Freundin)",
      headers: ["Kasus", "Singular", "Plural"],
      rows: [
        ["Nominativ (Wer/Was?)", "amica", "amicae"],
        ["Genitiv (Wessen?)", "amicae", "amicarum"],
        ["Dativ (Wem?)", "amicae", "amicis"],
        ["Akkusativ (Wen/Was?)", "amicam", "amicas"],
        ["Ablativ (Womit/Wodurch/Wo?)", "amica", "amicis"]
      ],
      drills: {
        stem: "amic",
        endings: {
          singular: ["a", "ae", "ae", "am", "a"],
          plural: ["ae", "arum", "is", "as", "is"]
        }
      }
    },
    {
      id: "decl_2_m",
      name: "2. Deklination: Maskulinum (o-Deklination)",
      description: "Maskuline Substantive auf -us oder -er (z.B. amicus - der Freund, puer - der Junge).",
      example: "amicus (Freund)",
      headers: ["Kasus", "Singular", "Plural"],
      rows: [
        ["Nominativ", "amicus", "amici"],
        ["Genitiv", "amici", "amicorum"],
        ["Dativ", "amico", "amicis"],
        ["Akkusativ", "amicum", "amicos"],
        ["Ablativ", "amico", "amicis"]
      ],
      drills: {
        stem: "amic",
        endings: {
          singular: ["us", "i", "o", "um", "o"],
          plural: ["i", "orum", "is", "os", "is"]
        }
      }
    },
    {
      id: "decl_2_n",
      name: "2. Deklination: Neutrum (o-Deklination)",
      description: "Neutrale Substantive auf -um (z.B. bellum - der Krieg, donum - das Geschenk). Wichtig: Im Neutrum sind Nominativ und Akkusativ immer identisch!",
      example: "bellum (Krieg)",
      headers: ["Kasus", "Singular", "Plural"],
      rows: [
        ["Nominativ", "bellum", "bella"],
        ["Genitiv", "belli", "bellorum"],
        ["Dativ", "bello", "bellis"],
        ["Akkusativ", "bellum", "bella"],
        ["Ablativ", "bello", "bellis"]
      ],
      drills: {
        stem: "bell",
        endings: {
          singular: ["um", "i", "o", "um", "o"],
          plural: ["a", "orum", "is", "a", "is"]
        }
      }
    },
    {
      id: "decl_3_cons",
      name: "3. Deklination (konsonantisch / gemischt)",
      description: "Substantive aller drei Geschlechter, deren Stamm auf einen Konsonanten endet (z.B. pater - Vater, urbs - Stadt). Der Genitiv Singular endet immer auf -is.",
      example: "pater, patris m. (Vater)",
      headers: ["Kasus", "Singular", "Plural"],
      rows: [
        ["Nominativ", "pater", "patres"],
        ["Genitiv", "patris", "patrum"],
        ["Dativ", "patri", "patribus"],
        ["Akkusativ", "patrem", "patres"],
        ["Ablativ", "patre", "patribus"]
      ],
      drills: {
        stem: "patr",
        nominativeSingularOverride: "pater",
        endings: {
          singular: ["", "is", "i", "em", "e"], // Nominativ ist der reine Stamm/Lexemeintrag
          plural: ["es", "um", "ibus", "es", "ibus"]
        }
      }
    }
  ],
  verbs: [
    {
      id: "conjugation_pres",
      name: "Präsens Aktiv (Gegenwart)",
      description: "Die Personalendungen für das Präsens Aktiv bei regelmäßigen Konjugationen.",
      headers: ["Person", "a-Konjugation (amare)", "e-Konjugation (videre)", "kons. Konjugation (legere)"],
      rows: [
        ["1. Pers. Sing. (ich)", "amo", "video", "lego"],
        ["2. Pers. Sing. (du)", "amas", "vides", "legis"],
        ["3. Pers. Sing. (er/sie/es)", "amat", "videt", "legit"],
        ["1. Pers. Plur. (wir)", "amamus", "videmus", "legimus"],
        ["2. Pers. Plur. (ihr)", "amatis", "videtis", "legitis"],
        ["3. Pers. Plur. (sie)", "amant", "vident", "legunt"]
      ],
      drills: {
        endings: ["o/m", "s", "t", "mus", "tis", "nt"]
      }
    },
    {
      id: "conjugation_imp",
      name: "Imperfekt Aktiv (Vergangenheit)",
      description: "Zeigt eine dauernde oder wiederholte Handlung in der Vergangenheit an. Kennzeichen ist meist das Tempuszeichen -ba-.",
      headers: ["Person", "a-Konjugation (amare)", "e-Konjugation (videre)", "kons. Konjugation (legere)"],
      rows: [
        ["1. Pers. Sing. (ich)", "amabam", "videbam", "legebam"],
        ["2. Pers. Sing. (du)", "amabas", "videbas", "legebas"],
        ["3. Pers. Sing. (er/sie/es)", "amabat", "videbat", "legebat"],
        ["1. Pers. Plur. (wir)", "amabamus", "videbamus", "legebamus"],
        ["2. Pers. Plur. (ihr)", "amabatis", "videbatis", "legebatis"],
        ["3. Pers. Plur. (sie)", "amabant", "videbant", "legebant"]
      ],
      drills: {
        suffix: "ba",
        endings: ["m", "s", "t", "mus", "tis", "nt"]
      }
    },
    {
      id: "conjugation_perf",
      name: "Perfekt Aktiv (Vergangenheit)",
      description: "Drückt die einmalige, abgeschlossene Handlung aus. Hat eigene Personalendungen, die an den Perfektstamm angehängt werden.",
      headers: ["Person", "a-Konjugation (amare)", "e-Konjugation (videre)", "kons. Konjugation (legere)"],
      rows: [
        ["1. Pers. Sing. (ich)", "amavi", "vidi", "legi"],
        ["2. Pers. Sing. (du)", "amavisti", "vidisti", "legisti"],
        ["3. Pers. Sing. (er/sie/es)", "amavit", "vidit", "legit"],
        ["1. Pers. Plur. (wir)", "amavimus", "vidimus", "legimus"],
        ["2. Pers. Plur. (ihr)", "amavistis", "vidistis", "legistis"],
        ["3. Pers. Plur. (sie)", "amaverunt / -ere", "viderunt", "legerunt"]
      ],
      drills: {
        endings: ["i", "isti", "it", "imus", "istis", "erunt"]
      }
    }
  ]
};
