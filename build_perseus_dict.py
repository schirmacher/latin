import re
import struct
import json

# Paths
idx_file = '/home/arne/dev/latin/georges_stardict/georges_lat-de/stardict.idx'
dict_file = '/home/arne/dev/latin/georges_stardict/georges_lat-de/stardict.dict'
texts_file = '/home/arne/dev/latin/src/data/texts.js'
output_file = '/home/arne/dev/latin/src/data/dictionary.js'

def parse_stardict_idx(idx_path):
    entries = []
    with open(idx_path, 'rb') as f:
        data = f.read()
    
    offset = 0
    total_bytes = len(data)
    
    while offset < total_bytes:
        null_idx = data.find(b'\x00', offset)
        if null_idx == -1:
            break
        
        word = data[offset:null_idx].decode('utf-8')
        offset = null_idx + 1
        
        word_offset, word_size = struct.unpack('>II', data[offset:offset+8])
        offset += 8
        
        entries.append((word, word_offset, word_size))
        
    return entries

def read_dict_definition(dict_path, offset, size):
    with open(dict_path, 'rb') as f:
        f.seek(offset)
        def_bytes = f.read(size)
    return def_bytes.decode('utf-8', errors='replace')

def strip_macrons(text):
    mapping = {
        'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u',
        'Ā': 'a', 'Ē': 'e', 'Ī': 'i', 'Ō': 'o', 'Ū': 'u'
    }
    for macron, normal in mapping.items():
        text = text.replace(macron, normal)
    return text.lower()

def get_lookup_candidates(lemma):
    candidates = [lemma, lemma.capitalize()]
    
    if lemma == 'tamen':
        candidates.append('tame')
    
    # Verb inflections: map infinitive to 1st person singular present
    if lemma == 'esse':
        candidates.append('sum')
    elif lemma == 'velle':
        candidates.append('volo')
    elif lemma == 'posse':
        candidates.append('possum')
    elif lemma == 'ire':
        candidates.append('eo')
    elif lemma == 'nolle':
        candidates.append('nolo')
    elif lemma.endswith('ferre'):
        candidates.append(lemma[:-5] + 'fero')  # e.g. referre -> refero, ferre -> fero
    elif lemma.endswith('are'):
        candidates.append(lemma[:-3] + 'o')
    elif lemma.endswith('ere'):
        base = lemma[:-3]
        candidates.append(base + 'eo')  # e.g. timere -> timeo
        candidates.append(base + 'o')   # e.g. comprehendere -> comprehendo
        candidates.append(base + 'io')  # e.g. conicere -> conicio
    elif lemma.endswith('ire'):
        candidates.append(lemma[:-3] + 'io')  # e.g. audire -> audio
        
    # Deponents
    if lemma.endswith('isci'):
        candidates.append(lemma[:-4] + 'iscor')
    elif lemma.endswith('ari'):
        candidates.append(lemma[:-3] + 'or')
    elif lemma.endswith('eri'):
        candidates.append(lemma[:-3] + 'eor')
    elif lemma.endswith('i') and not lemma.endswith('ae') and not lemma.endswith('i'):
        candidates.append(lemma[:-1] + 'or')
        
    # Plurals/nouns
    if lemma.endswith('finitimi'):
        candidates.append('finitimus')
    if lemma == 'fines':
        candidates.append('finis')
    if lemma == 'vires':
        candidates.append('vis')
        
    return candidates

def clean_html_translation(html, candidates, is_noun=False):
    if "Kein detaillierter Eintrag" in html:
        return ""
        
    # Clean candidates for case-insensitive matching
    cands_clean = {strip_macrons(c) for c in candidates}
    for c in list(cands_clean):
        cands_clean.add(re.sub(r'[^a-zäöüß]', '', c))
        
    html_clean = html.replace('\n', ' ')
    
    # Regex to find an article followed immediately by a bold translation
    # ONLY run this if it is a noun (or proper name)
    if is_noun:
        pattern = r'\b(der|die|das|den|dem|des|jede|jede|ein|eine)\b\s*(?:</i>)?\s*(?:<i>)?\s*<b[^>]*>(.*?)</b>'
        matches = re.finditer(pattern, html_clean[:500], re.IGNORECASE)
        found_nouns = []
        seen_words = set()
        for match in matches:
            art = match.group(1).lower()
            word = re.sub(r'<[^>]+>', '', match.group(2)).strip(',; ')
            word_clean = re.sub(r'[^a-zäöüß]', '', strip_macrons(word))
            if word_clean in cands_clean:
                continue
            if len(word) > 2 and word_clean not in seen_words:
                found_nouns.append(f"{art} {word}")
                seen_words.add(word_clean)
        if found_nouns:
            return " / ".join(found_nouns)
        
    # Fallback to first bold segment
    bold_matches = []
    for match in re.finditer(r'(<b[^>]*>(.*?)</b>)', html_clean):
        full_tag = match.group(1)
        content = match.group(2)
        content_clean = re.sub(r'<[^>]+>', '', content).strip(',; ')
        word_clean = re.sub(r'[^a-zäöüß]', '', strip_macrons(content_clean))
        
        # Skip if it is a headword candidate or too short
        if word_clean in cands_clean or len(content_clean) <= 2:
            continue
            
        # Check if preceded by "also" or "gleichs." indicating etymological literal meaning
        preceding = html_clean[max(0, match.start() - 25):match.start()].lower()
        if "also" in preceding or "gleichs." in preceding:
            continue
            
        bold_matches.append({
            'start': match.start(),
            'end': match.end(),
            'content': content_clean,
            'full_tag': full_tag
        })
        
    if not bold_matches:
        return ""
        
    # Merge consecutive bold segments separated only by conjunctions/punctuation
    result = bold_matches[0]['content']
    last_end = bold_matches[0]['end']
    
    for next_match in bold_matches[1:]:
        between_text = html_clean[last_end:next_match['start']]
        between_clean = re.sub(r'<[^>]+>', '', between_text).strip()
        
        # Avoid merging across Roman numeral markers
        if "I)" in between_clean or "II)" in between_clean or "III)" in between_clean:
            break
            
        # If the intermediate text is a joining punctuation/conjunction (e.g. "-", "od.", "oder", "und", ",", or empty)
        if len(between_clean) < 15 and any(j in between_clean or between_clean == "" for j in ['-', 'od.', 'oder', 'und', ',', '/']):
            result += between_text + next_match['content']
            result = re.sub(r'<[^>]+>', '', result)
            last_end = next_match['end']
        else:
            break
            
    # Extra check for author abbreviations like 'Cic.', 'Plaut.' etc.
    res_clean = re.sub(r'\s+', ' ', result).strip(',; ')
    if res_clean.lower() in ['cic.', 'liv.', 'plaut.', 'hor.', 'verg.']:
        return ""
        
    return res_clean

# 1. Load unique lemmas from texts.js
print("Loading lemmas from texts.js...")
with open(texts_file, 'r', encoding='utf-8') as f:
    texts_content = f.read()

# Find all lexicon blocks
lexicon_entries = re.findall(r'"([a-zA-Zāēīōū]+)"\s*:\s*\{([^}]+)\}', texts_content)

lemma_to_info = {}
for inflected, content in lexicon_entries:
    lemma_match = re.search(r'lemma:\s*"([^"]+)"', content)
    pos_match = re.search(r'pos:\s*"([^"]+)"', content)
    trans_match = re.search(r'translation:\s*"([^"]+)"', content)
    lemma_trans_match = re.search(r'lemmaTranslation:\s*"([^"]+)"', content)
    
    if lemma_match and pos_match and trans_match:
        lemma = lemma_match.group(1)
        pos = pos_match.group(2) if len(pos_match.groups()) > 1 else pos_match.group(1)
        translation = trans_match.group(1)
        lemma_translation = lemma_trans_match.group(1).split('/')[0].split(';')[0].strip() if lemma_trans_match else ""
        
        # Clean lemma to get first word
        clean_lemma = re.split(r'[,;\s]', lemma)[0].lower().strip().replace('[', '').replace(']', '')
        clean_lemma = ''.join(c for c in clean_lemma if c.isalpha() or c in 'āēīōū')
        
        if clean_lemma and clean_lemma not in lemma_to_info:
            lemma_to_info[clean_lemma] = {
                'pos': pos,
                'translation': translation.split('/')[0].split(';')[0].strip(),
                'lemma_translation': lemma_translation
            }

print(f"Parsed {len(lemma_to_info)} unique lemmas from texts.js.")

# 2. Parse StarDict Index
print("Parsing StarDict index...")
stardict_entries = parse_stardict_idx(idx_file)
print(f"Georges StarDict has {len(stardict_entries)} entries.")

# Index lookup map
index_map = {}
for word, offset, size in stardict_entries:
    base_word = re.sub(r'\(\d+\)', '', word).strip()
    if base_word not in index_map:
        index_map[base_word] = []
    index_map[base_word].append((word, offset, size))

# 3. Generate local dictionary
local_dict = {}
not_found = []

for clean_lemma, info in lemma_to_info.items():
    # Search in StarDict using candidates
    html_content = ""
    candidates = get_lookup_candidates(clean_lemma)
    
    found_key = None
    for cand in candidates:
        if cand in index_map:
            found_key = cand
            break
            
    if found_key:
        defs = []
        for word, offset, size in index_map[found_key]:
            definition = read_dict_definition(dict_file, offset, size)
            defs.append((word, definition))
            
        # If there are multiple homonyms, filter them if the lemma matches a specific one
        if len(defs) > 1:
            matching_defs = []
            for w, d in defs:
                headword_area = d[:150].lower()
                headword_area_clean = strip_macrons(headword_area)
                if clean_lemma in headword_area_clean:
                    matching_defs.append(d)
            if len(matching_defs) >= 1:
                defs = [(None, d) for d in matching_defs]
                
        html_content = '<hr style="margin: 16px 0; border: none; border-top: 1px dashed rgba(255,255,255,0.15);" />'.join([d for w, d in defs])
        
        # Automatically extract clean translation from HTML (Noun-aware)
        if "eigenname" in info['pos'].lower():
            extracted_trans = info['lemma_translation'] if info['lemma_translation'] else info['translation']
        else:
            is_noun = "substantiv" in info['pos'].lower()
            extracted_trans = clean_html_translation(html_content, candidates, is_noun)
            if not extracted_trans:
                extracted_trans = info['lemma_translation'] if info['lemma_translation'] else info['translation']
            elif info['lemma_translation']:
                lt_clean = re.sub(r'^(der|die|das|den|dem|des)\s+', '', info['lemma_translation'].lower()).strip()
                et_clean = extracted_trans.lower()
                if lt_clean not in et_clean:
                    extracted_trans = f"{info['lemma_translation']} / {extracted_trans}"
    else:
        not_found.append(clean_lemma)
        html_content = f"<p>Kein detaillierter Eintrag für <b>{clean_lemma}</b> im Georges Handwörterbuch gefunden.</p>"
        extracted_trans = info['lemma_translation'] if info['lemma_translation'] else info['translation']
        
    local_dict[clean_lemma] = {
        'translation': extracted_trans,
        'explanation': f"{info['pos']} (Grundform)",
        'html': html_content
    }

print(f"Compiled dictionary for {len(local_dict)} lemmas.")
print(f"Words not found in Georges index: {len(not_found)} ({', '.join(not_found[:10])}...)")

# 4. Write to output JS file
js_content = f"""// Automatisch generiert aus Karl Ernst Georges (1913) StarDict Datenbank
// Enthält extrahierte Übersetzungen, Erklärungen und vollständige HTML-Artikel.

export const georgesDictionary = {json.dumps(local_dict, indent=2, ensure_ascii=False)};
"""

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully wrote {output_file}.")
