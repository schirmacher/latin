// Lateinische Texte mit grammatikalischer Analyse und Übersetzung
export const texts = [
  {
    id: "beg_chap_1",
    title: "Lektion 1: Imperium Romanum (Anfänger)",
    description: "Der absolute Einstieg. Lerne einfache Sätze, Ortsbeschreibungen und den Unterschied zwischen Singular ('est') und Plural ('sunt').",
    difficulty: "Anfänger (Stufe A)",
    level: "beginner",
    latin: [
      "Roma in Italia est. Italia in Europa est.",
      "Rhenus et Danuvius fluvii in Germania sunt.",
      "Corsica et Sardinia insulae magnae sunt."
    ],
    translations: [
      "Rom ist in Italien. Italien ist in Europa.",
      "Der Rhein und die Donau sind Flüsse in Deutschland.",
      "Korsika und Sardinien sind große Inseln."
    ],
    lexicon: {
      "roma": { lemma: "Roma, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Rom" },
      "in": { lemma: "in", pos: "Präposition (+ Abl.)", parse: "in / im (Wo?)", translation: "in" },
      "italia": { lemma: "Italia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Ablativ Singular", translation: "Italien" },
      "est": { lemma: "esse", pos: "Verb", parse: "3. Person Singular Präsens Indikativ", translation: "ist" },
      "europa": { lemma: "Europa, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Ablativ Singular", translation: "Europa" },
      "rhenus": { lemma: "Rhenus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "der Rhein" },
      "et": { lemma: "et", pos: "Konjunktion", parse: "und", translation: "und" },
      "danuvius": { lemma: "Danuvius, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "die Donau" },
      "fluvii": { lemma: "fluvius, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Plural Maskulinum", translation: "Flüsse" },
      "germania": { lemma: "Germania, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Ablativ Singular", translation: "Deutschland / Germanien" },
      "sunt": { lemma: "esse", pos: "Verb", parse: "3. Person Plural Präsens Indikativ", translation: "sind" },
      "corsica": { lemma: "Corsica, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Korsika" },
      "sardinia": { lemma: "Sardinia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Sardinien" },
      "insulae": { lemma: "insula, -ae (f.)", pos: "Substantiv (1. Dekl.)", parse: "Nominativ Plural Femininum", translation: "Inseln" },
      "magnae": { lemma: "magnus, -a, -um", pos: "Adjektiv", parse: "Nominativ Plural Femininum (kongruent mit insulae)", translation: "große" }
    }
  },
  {
    id: "beg_chap_2",
    title: "Lektion 2: Familia Romana (Anfänger)",
    description: "Hier lernst du Familienbeziehungen kennen. Du erfährst, wer verheiratet ist und wer wessen Sohn oder Tochter ist (Einführung Genitiv).",
    difficulty: "Anfänger (Stufe A)",
    level: "beginner",
    latin: [
      "Iulius vir Romanus est. Aemilia femina Romana est.",
      "Marcus et Quintus sunt filii Iulii et Aemiliae.",
      "Iulia est filia Iulii et Aemiliae."
    ],
    translations: [
      "Julius ist ein römischer Mann. Aemilia ist eine römische Frau.",
      "Marcus und Quintus sind die Söhne von Julius und Aemilia.",
      "Julia ist die Tochter von Julius und Aemilia."
    ],
    lexicon: {
      "iulius": { lemma: "Iulius, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Julius" },
      "vir": { lemma: "vir, viri (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Singular Maskulinum", translation: "Mann" },
      "romanus": { lemma: "Romanus, -a, -um", pos: "Adjektiv", parse: "Nominativ Singular Maskulinum", translation: "römischer" },
      "est": { lemma: "esse", pos: "Verb", parse: "3. Person Singular Präsens Indikativ", translation: "ist" },
      "aemilia": { lemma: "Aemilia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Aemilia" },
      "femina": { lemma: "femina, -ae (f.)", pos: "Substantiv (1. Dekl.)", parse: "Nominativ Singular Femininum", translation: "Frau" },
      "romana": { lemma: "Romanus, -a, -um", pos: "Adjektiv", parse: "Nominativ Singular Femininum", translation: "römische" },
      "marcus": { lemma: "Marcus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Marcus" },
      "et": { lemma: "et", pos: "Konjunktion", parse: "und", translation: "und" },
      "quintus": { lemma: "Quintus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Quintus" },
      "sunt": { lemma: "esse", pos: "Verb", parse: "3. Person Plural Präsens Indikativ", translation: "sind" },
      "filii": { lemma: "filius, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Plural Maskulinum", translation: "Söhne" },
      "iulii": { lemma: "Iulius, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Genitiv Singular", translation: "des Julius / von Julius" },
      "aemiliae": { lemma: "Aemilia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Genitiv Singular", translation: "der Aemilia / von Aemilia" },
      "iulia": { lemma: "Iulia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Julia" },
      "filia": { lemma: "filia, -ae (f.)", pos: "Substantiv (1. Dekl.)", parse: "Nominativ Singular Femininum", translation: "Tochter" }
    }
  },
  {
    id: "fabulae_faciles_1",
    title: "Ritchie's Fabulae Faciles: Perseus 1 (Die Rettung)",
    description: "Der Beginn der Geschichte von Perseus. Perfekt für den Wiedereinstieg mit einfacher Satzstruktur.",
    difficulty: "Einfach (Stufe B / 1)",
    level: "intermediate",
    latin: [
      "Haec narrantur a poetis de Perseo.",
      "Perseus filius erat Iovis, maximi deorum;",
      "avus eius Acrisius appellabatur.",
      "Acrisius volebat Perseum nepotem suum necare;",
      "nam propter oraculum puerum timebat."
    ],
    translations: [
      "Dies wird von den Dichtern über Perseus erzählt.",
      "Perseus war der Sohn Jupiters, des größten der Götter;",
      "sein Großvater wurde Acrisius genannt.",
      "Acrisius wollte Perseum, seinen Enkel, töten;",
      "denn wegen eines Orakels fürchtete er den Jungen."
    ],
    lexicon: {
      "haec": { lemma: "hic, haec, hoc", pos: "Demonstrativpronomen", parse: "Nominativ Plural Neutrum", translation: "dies / diese Dinge" },
      "narrantur": { lemma: "narrare", pos: "Verb (a-Konj.)", parse: "3. Person Plural Präsens Indikativ Passiv", translation: "werden erzählt" },
      "a": { lemma: "a / ab", pos: "Präposition (+ Abl.)", parse: "von (Urheber)", translation: "von" },
      "poetis": { lemma: "poeta, -ae (m.)", pos: "Substantiv (1. Dekl.)", parse: "Ablativ Plural Maskulinum", translation: "Dichtern" },
      "de": { lemma: "de", pos: "Präposition (+ Abl.)", parse: "über / von ... herab", translation: "über / von" },
      "perseo": { lemma: "Perseus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Ablativ Singular", translation: "Perseus" },
      "perseus": { lemma: "Perseus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Perseus" },
      "filius": { lemma: "filius, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Singular Maskulinum", translation: "Sohn" },
      "erat": { lemma: "esse", pos: "Hilfsverb", parse: "3. Person Singular Imperfekt Indikativ Aktiv", translation: "war" },
      "iovis": { lemma: "Iuppiter, Iovis (m.)", pos: "Eigenname (3. Dekl.)", parse: "Genitiv Singular", translation: "Jupiters" },
      "maximi": { lemma: "maximus, -a, -um", pos: "Adjektiv (Superlativ)", parse: "Genitiv Singular Maskulinum", translation: "des größten" },
      "deorum": { lemma: "deus, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Genitiv Plural Maskulinum", translation: "der Götter" },
      "avus": { lemma: "avus, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Singular Maskulinum", translation: "Großvater" },
      "eius": { lemma: "is, ea, id", pos: "Demonstrativ-/Personalpronomen", parse: "Genitiv Singular Maskulinum", translation: "sein / dessen" },
      "acrisius": { lemma: "Acrisius, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Acrisius" },
      "appellabatur": { lemma: "appellare", pos: "Verb (a-Konj.)", parse: "3. Person Singular Imperfekt Indikativ Passiv", translation: "wurde genannt" },
      "volebat": { lemma: "velle", pos: "Verb (unregelmäßig)", parse: "3. Person Singular Imperfekt Indikativ Aktiv", translation: "wollte" },
      "nepotem": { lemma: "nepos, nepotis (m.)", pos: "Substantiv (3. Dekl.)", parse: "Akkusativ Singular Maskulinum", translation: "Enkel" },
      "suum": { lemma: "suus, -a, -um", pos: "Possessivpronomen", parse: "Akkusativ Singular Maskulinum", translation: "seinen" },
      "necare": { lemma: "necare", pos: "Verb (a-Konj.)", parse: "Präsens Infinitiv Aktiv", translation: "töten" },
      "nam": { lemma: "nam", pos: "Konjunktion", parse: "denn", translation: "denn" },
      "propter": { lemma: "propter", pos: "Präposition (+ Akk.)", parse: "wegen", translation: "wegen" },
      "oraculum": { lemma: "oraculum, -i (n.)", pos: "Substantiv (2. Dekl.)", parse: "Akkusativ Singular Neutrum", translation: "das Orakel / die Prophezeiung" },
      "puerum": { lemma: "puer, pueri (m.)", pos: "Substantiv (2. Dekl.)", parse: "Akkusativ Singular Maskulinum", translation: "den Jungen" },
      "timebat": { lemma: "timere", pos: "Verb (e-Konj.)", parse: "3. Person Singular Imperfekt Indikativ Aktiv", translation: "fürchtete" }
    }
  },
  {
    id: "vulgate_john_1",
    title: "Die Vulgata: Evangelium nach Johannes (Prolog)",
    description: "Hieronymus' Bibelübersetzung. Sehr direkte Satzstruktur, ideal zur Förderung des flüssigen Lesens.",
    difficulty: "Mittel (Stufe B / 2)",
    level: "intermediate",
    latin: [
      "In principio erat Verbum,",
      "et Verbum erat apud Deum,",
      "et Deus erat Verbum.",
      "Hoc erat in principio apud Deum.",
      "Omnia per ipsum facta sunt:",
      "et sine ipso factum est nihil, quod factum est."
    ],
    translations: [
      "Im Anfang war das Wort,",
      "und das Wort war bei Gott,",
      "und Gott war das Wort.",
      "Dieses war im Anfang bei Gott.",
      "Alles ist durch dasselbe gemacht worden:",
      "und ohne dasselbe ist nichts gemacht worden, was gemacht worden ist."
    ],
    lexicon: {
      "in": { lemma: "in", pos: "Präposition (+ Abl. / Akk.)", parse: "in (+ Abl. zeigt Ort/Zeit)", translation: "in / im" },
      "principio": { lemma: "principium, -i (n.)", pos: "Substantiv (2. Dekl.)", parse: "Ablativ Singular Neutrum", translation: "Anfang / Beginn" },
      "erat": { lemma: "esse", pos: "Hilfsverb", parse: "3. Person Singular Imperfekt Indikativ Aktiv", translation: "war" },
      "verbum": { lemma: "verbum, -i (n.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Singular Neutrum", translation: "Wort" },
      "et": { lemma: "et", pos: "Konjunktion", parse: "und", translation: "und" },
      "apud": { lemma: "apud", pos: "Präposition (+ Akk.)", parse: "bei / nahe", translation: "bei" },
      "deum": { lemma: "deus, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Akkusativ Singular Maskulinum", translation: "Gott" },
      "deus": { lemma: "deus, -i (m.)", pos: "Substantiv (2. Dekl.)", parse: "Nominativ Singular Maskulinum", translation: "Gott" },
      "hoc": { lemma: "hic, haec, hoc", pos: "Demonstrativpronomen", parse: "Nominativ Singular Neutrum", translation: "dieses / dieses Wort" },
      "omnia": { lemma: "omnis, -e", pos: "Adjektiv (substantiviert)", parse: "Nominativ Plural Neutrum", translation: "alles / alle Dinge" },
      "per": { lemma: "per", pos: "Präposition (+ Akk.)", parse: "durch", translation: "durch" },
      "ipsum": { lemma: "ipse, ipsa, ipsum", pos: "Demonstrativpronomen", parse: "Akkusativ Singular Neutrum (bezieht sich auf Verbum)", translation: "ihn / dasselbe" },
      "facta": { lemma: "facere", pos: "Verb (gemischte Konj.)", parse: "Partizip Perfekt Passiv (Plural Neutrum)", translation: "gemacht / erschaffen" },
      "sunt": { lemma: "esse", pos: "Hilfsverb", parse: "3. Person Plural Präsens Indikativ", translation: "sind (facta sunt = sind gemacht worden)" },
      "sine": { lemma: "sine", pos: "Präposition (+ Abl.)", parse: "ohne", translation: "ohne" },
      "ipso": { lemma: "ipse, ipsa, ipsum", pos: "Demonstrativpronomen", parse: "Ablativ Singular Neutrum", translation: "ihn / dasselbe" },
      "factum": { lemma: "facere", pos: "Verb (gemischte Konj.)", parse: "Partizip Perfekt Passiv (Singular Neutrum)", translation: "gemacht / erschaffen" },
      "est": { lemma: "esse", pos: "Hilfsverb", parse: "3. Person Singular Präsens Indikativ (factum est = ist gemacht worden)", translation: "ist" },
      "nihil": { lemma: "nihil (indeklinabel)", pos: "Substantiv", parse: "Nominativ Neutrum", translation: "nichts" },
      "quod": { lemma: "qui, quae, quod", pos: "Relativpronomen", parse: "Nominativ Singular Neutrum", translation: "was / welches" }
    }
  },
  {
    id: "eutropius_1",
    title: "Eutropius: Breviarium Historiae Romanae (Romulus)",
    description: "Die Gründung Roms durch Romulus. Kurze, prägnante historische Sätze im klassischen Latein.",
    difficulty: "Mittel-Schwer (Stufe B / 3)",
    level: "intermediate",
    latin: [
      "Romulus civitatem novam condidit,",
      "quam ex nomine suo Romam vocavit.",
      "Multitudinem finitimorum in civitatem recepit."
    ],
    translations: [
      "Romulus gründete eine neue Stadt,",
      "die er nach seinem eigenen Namen Rom nannte.",
      "Er nahm eine Menge von Nachbarn in die Bürgerschaft auf."
    ],
    lexicon: {
      "romulus": { lemma: "Romulus, -i (m.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Singular", translation: "Romulus" },
      "civitatem": { lemma: "civitas, civitatis (f.)", pos: "Substantiv (3. Dekl.)", parse: "Akkusativ Singular Femininum", translation: "Stadt / Bürgerschaft" },
      "novam": { lemma: "novus, -a, -um", pos: "Adjektiv", parse: "Akkusativ Singular Femininum", translation: "neue" },
      "condidit": { lemma: "condere", pos: "Verb (3. Konj.)", parse: "3. Person Singular Perfekt Indikativ Aktiv", translation: "gründete" },
      "quam": { lemma: "qui, quae, quod", pos: "Relativpronomen", parse: "Akkusativ Singular Femininum (bezieht sich auf civitatem)", translation: "die / welche" },
      "ex": { lemma: "ex / e", pos: "Präposition (+ Abl.)", parse: "aus / von ... aus / nach", translation: "aus / nach" },
      "nomine": { lemma: "nomen, nominis (n.)", pos: "Substantiv (3. Dekl.)", parse: "Ablativ Singular Neutrum", translation: "Namen" },
      "suo": { lemma: "suus, -a, -um", pos: "Possessivpronomen", parse: "Ablativ Singular Neutrum (kongruent mit nomine)", translation: "seinem" },
      "romam": { lemma: "Roma, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Akkusativ Singular", translation: "Rom" },
      "vocavit": { lemma: "vocare", pos: "Verb (a-Konj.)", parse: "3. Person Singular Perfekt Indikativ Aktiv", translation: "nannte / rief" },
      "multitudinem": { lemma: "multitudo, multitudinis (f.)", pos: "Substantiv (3. Dekl.)", parse: "Akkusativ Singular Femininum", translation: "Menge / Vielzahl" },
      "finitimorum": { lemma: "finitimi, -orum (m. Pl.)", pos: "Substantiv (2. Dekl.)", parse: "Genitiv Plural Maskulinum", translation: "der Nachbarn / der Angrenzenden" },
      "recepit": { lemma: "recipere", pos: "Verb (gemischte Konj.)", parse: "3. Person Singular Perfekt Indikativ Aktiv", translation: "nahm auf / empfing" }
    }
  },
  {
    id: "caesar_gallic_1",
    title: "Julius Caesar: De Bello Gallico (Prolog)",
    description: "Der berühmte Anfang des gallischen Krieges. Sehr präzise und logische klassische Prosa.",
    difficulty: "Schwer (Stufe B / 4)",
    level: "intermediate",
    latin: [
      "Gallia est omnis divisa in partes tres,",
      "quarum unam incolunt Belgae,",
      "aliam Aquitani,",
      "tertiam qui ipsorum lingua Celtae, nostra Galli appellantur."
    ],
    translations: [
      "Ganz Gallien ist in drei Teile geteilt,",
      "von denen die Belgier den einen bewohnen,",
      "die Aquitanier einen anderen,",
      "den dritten diejenigen, die in ihrer eigenen Sprache Kelten, in unserer Gallier genannt werden."
    ],
    lexicon: {
      "gallia": { lemma: "Gallia, -ae (f.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Singular", translation: "Gallien" },
      "est": { lemma: "esse", pos: "Hilfsverb", parse: "3. Person Singular Präsens Indikativ (divisa est = ist geteilt)", translation: "ist" },
      "omnis": { lemma: "omnis, -e", pos: "Adjektiv", parse: "Nominativ Singular Femininum (kongruent mit Gallia)", translation: "ganz / als Ganzes" },
      "divisa": { lemma: "dividere", pos: "Verb (3. Konj.)", parse: "Partizip Perfekt Passiv (Nominativ Singular Femininum)", translation: "geteilt" },
      "quarum": { lemma: "qui, quae, quod", pos: "Relativpronomen", parse: "Genitiv Plural Femininum (bezieht sich auf partes)", translation: "von denen" },
      "unam": { lemma: "unus, -a, -um", pos: "Zahlwort / Adjektiv", parse: "Akkusativ Singular Femininum (ergänze: partem)", translation: "einen (Teil)" },
      "incolunt": { lemma: "incolere", pos: "Verb (3. Konj.)", parse: "3. Person Plural Präsens Indikativ Aktiv", translation: "bewohnen" },
      "belgae": { lemma: "Belgae, -arum (m. Pl.)", pos: "Eigenname (1. Dekl. - Achtung: maskulin)", parse: "Nominativ Plural", translation: "die Belgier" },
      "aliam": { lemma: "alius, alia, aliud", pos: "Pronominaladjektiv", parse: "Akkusativ Singular Femininum (ergänze: partem incolunt)", translation: "einen anderen (Teil bewohnen...)" },
      "aquitani": { lemma: "Aquitani, -orum (m. Pl.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Plural", translation: "die Aquitanier" },
      "tertiam": { lemma: "tertius, -a, -um", pos: "Ordnungszahl", parse: "Akkusativ Singular Femininum (ergänze: partem incolunt)", translation: "den dritten (Teil bewohnen diejenigen...)" },
      "qui": { lemma: "qui, quae, quod", pos: "Relativpronomen", parse: "Nominativ Plural Maskulinum", translation: "die / welche" },
      "ipsorum": { lemma: "ipse, ipsa, ipsum", pos: "Demonstrativpronomen (Intensivpronomen)", parse: "Genitiv Plural Maskulinum", translation: "ihrer selbst / in ihrer eigenen" },
      "lingua": { lemma: "lingua, -ae (f.)", pos: "Substantiv (1. Dekl.)", parse: "Ablativ Singular Femininum (Ablativus instrumenti)", translation: "Sprache" },
      "celtae": { lemma: "Celtae, -arum (m. Pl.)", pos: "Eigenname (1. Dekl.)", parse: "Nominativ Plural", translation: "Kelten" },
      "nostra": { lemma: "noster, nostra, nostrum", pos: "Possessivpronomen", parse: "Ablativ Singular Femininum (ergänze: lingua)", translation: "unserer (Sprache)" },
      "galli": { lemma: "Galli, -orum (m. Pl.)", pos: "Eigenname (2. Dekl.)", parse: "Nominativ Plural", translation: "Gallier" },
      "appellantur": { lemma: "appellare", pos: "Verb (a-Konj.)", parse: "3. Person Plural Präsens Indikativ Passiv", translation: "werden genannt" }
    }
  }
];
