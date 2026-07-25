// Built-in word lists organised by difficulty
const WORDS = {
  easy: [
    'anchor', 'apple', 'author', 'baking', 'ballot', 'banana', 'basket', 'beacon',
    'beetle', 'blanket', 'blossom', 'breeze', 'bridge', 'bubble', 'butter', 'button',
    'cabin', 'cactus', 'candle', 'canopy', 'castle', 'cherry', 'circle', 'clever',
    'clover', 'cobweb', 'coffee', 'copper', 'corner', 'cotton', 'crayon', 'cricket',
    'desert', 'design', 'dinner', 'donkey', 'dragon', 'engine', 'falcon', 'feather',
    'filter', 'finger', 'flavor', 'flower', 'forest', 'fossil', 'freeze', 'garden',
    'gentle', 'ginger', 'glider', 'golden', 'guitar', 'harbor', 'harvest', 'hollow',
    'humble', 'hunter', 'island', 'jungle', 'kettle', 'kitten', 'ladder', 'lantern',
    'lemon', 'lizard', 'magnet', 'mango', 'market', 'meadow', 'melon', 'monkey',
    'morning', 'museum', 'muffin', 'needle', 'nephew', 'noodle', 'number', 'orange',
    'orphan', 'ostrich', 'palace', 'panther', 'parade', 'parrot', 'pasture', 'peach',
    'peanut', 'pencil', 'pepper', 'person', 'picture', 'pillow', 'planet', 'plastic',
    'pocket', 'police', 'puddle', 'puppet', 'purple', 'rabbit', 'radish', 'rescue',
    'ribbon', 'river', 'rocket', 'saddle', 'sailor', 'salmon', 'shadow', 'silver',
    'simple', 'sketch', 'spider', 'sponge', 'spring', 'squirrel', 'stable', 'statue',
    'street', 'subway', 'summer', 'sunset', 'symbol', 'system', 'table', 'target',
    'temple', 'ticket', 'timber', 'tunnel', 'turtle', 'velvet', 'vessel', 'violet',
    'walnut', 'wallet', 'whisper', 'window', 'winter', 'wizard', 'yellow', 'zebra'
  ],
  medium: [
    'absolute', 'accidental', 'adventure', 'alphabet', 'ambulance', 'ancestor', 'animation',
    'apology', 'appetite', 'applause', 'aquarium', 'architect', 'argument', 'astronomer',
    'astronaut', 'atmosphere', 'avalanche', 'bachelor', 'backbone', 'backpack', 'bacteria',
    'balancer', 'balloon', 'barbecue', 'beautiful', 'beverage', 'bicycle', 'biography',
    'biscuit', 'blizzard', 'bookcase', 'boulder', 'boulevard', 'boundary', 'broadcast',
    'brochure', 'butterfly', 'cabdriver', 'cabinet', 'calculator', 'calendar', 'campaign',
    'cardinal', 'carnival', 'carpenters', 'cathedral', 'celebrate', 'cemetery', 'championship',
    'chuckle', 'cinnamon', 'citizens', 'cliffhanger', 'collision', 'colony', 'commercial',
    'committee', 'companion', 'compass', 'compliment', 'composer', 'conductor', 'conference',
    'consonant', 'continent', 'conversation', 'courage', 'courtesy', 'creativity', 'crocodile',
    'curiosity', 'custody', 'cylinder', 'daffodil', 'dandelion', 'datebook', 'daughter',
    'daylight', 'daydream', 'defiance', 'delegate', 'delicious', 'delightful', 'describe',
    'diameter', 'dictionary', 'dinosaur', 'director', 'disaster', 'discovery', 'distance',
    'divergence', 'document', 'doorknob', 'doughnut', 'dragonfly', 'driveway', 'duplicate',
    'duration', 'dynamics', 'earthquake', 'easement', 'eccentric', 'eclipse', 'economy',
    'education', 'effective', 'egotism', 'elastic', 'election', 'electricity', 'elephant',
    'elevator', 'embarrass', 'emotion', 'emphasis', 'emperor', 'employment', 'enchanted',
    'encyclopedia', 'enthusiasm', 'envious', 'equation', 'equipment', 'escalator', 'eternity',
    'evaporate', 'evidence', 'excellence', 'excitement', 'excursion', 'exhibit', 'existence',
    'expensive', 'experiment', 'explosive', 'extinguish', 'eyewitness', 'fabulous', 'facility',
    'facsimile', 'fanatic', 'fantastic', 'farmhouse', 'fascinate', 'favorite', 'featherweight',
    'festive', 'firecracker', 'fireplace', 'fireworks', 'flamingo', 'flatter', 'flexibility',
    'flounder', 'footprint', 'footstep', 'forecast', 'foreigner', 'fountain', 'fraction',
    'framework', 'frequency', 'friendship', 'frigate', 'frontier', 'furniture', 'futuristic',
    'galaxies', 'gallery', 'gardener', 'generator', 'generous', 'geography', 'geometric',
    'gladiator', 'glimpse', 'glossary', 'goldfish', 'gorilla', 'governor', 'graceful',
    'grandiose', 'grasshopper', 'gratitude', 'gravity', 'greetings', 'grenade', 'groceries',
    'guardian', 'guidance', 'gymnasium', 'handkerchief', 'handshake', 'happiness', 'harbor',
    'hardware', 'harmonica', 'harmony', 'headache', 'headline', 'headquarters', 'hedgehog',
    'helicopter', 'heroism', 'hibernation', 'historian', 'hometown', 'honeycomb', 'honeymoon',
    'horizon', 'horizontal', 'hospitable', 'hospitality', 'hourglass', 'houseboat', 'housework',
    'humanity', 'humorous', 'hurricane', 'hydraulic', 'hydrofoil', 'hydrogen', 'hygiene',
    'hypnotic', 'iceberg', 'identity', 'illuminate', 'illusion', 'illustration', 'imagination',
    'immediate', 'immense', 'immigrant', 'immortality', 'immunity', 'importance', 'impossible',
    'impression', 'incubator', 'independence', 'indicator', 'individual', 'inevitable',
    'infectious', 'infinite', 'ingredient', 'inhabitant', 'inheritance', 'initiative',
    'injection', 'injurious', 'innocence', 'inspection', 'inspiration', 'institution',
    'instruction', 'instrument', 'insurance', 'integrity', 'intellect', 'intensity',
    'interaction', 'interstate', 'interview', 'invitation', 'irrigation', 'islanders',
    'itinerary', 'jaguar', 'jalapeno', 'janitor', 'jellyfish', 'jealousy', 'journalism',
    'jubilant', 'judgment', 'juggle', 'junction', 'jurisdiction', 'justice', 'kangaroo',
    'keyhole', 'kilogram', 'kilometer', 'kindness', 'kingdom', 'knapsack', 'landscape',
    'lantern', 'latitude', 'laughter', 'leadership', 'legendary', 'legislation', 'lemonade',
    'leopard', 'librarian', 'lieutenant', 'lighthouse', 'lightbulb', 'limousine', 'linguist',
    'literature', 'livelihood', 'locomotive', 'logistics', 'longitude', 'longevity', 'luggage',
    'machinery', 'magnetism', 'magnificent', 'mainland', 'malaria', 'mammoth', 'mannequin',
    'manuscript', 'marathon', 'margarine', 'marginal', 'mariachi', 'maritime', 'marvelous',
    'masquerade', 'masterpiece', 'material', 'mathematics', 'mattress', 'mausoleum', 'maximum',
    'mechanic', 'mechanism', 'media', 'medication', 'medium', 'melodramatic', 'membrane',
    'memorable', 'mentality', 'merchandise', 'merchant', 'mercury', 'meridian', 'metaphor',
    'meteorite', 'microscope', 'midday', 'midnight', 'migration', 'milestone', 'millisecond',
    'miniature', 'minivan', 'miraculous', 'misery', 'misfortune', 'missile', 'mixture',
    'molecule', 'monument', 'moonlight', 'morphology', 'mosquito', 'motorcycle', 'mountain',
    'multitude', 'mummy', 'mushroom', 'music', 'musician', 'mustache', 'mysterious',
    'mythology', 'narrative', 'national', 'nausea', 'navigation', 'necessary', 'nectar',
    'neighborhood', 'neon', 'nerve', 'nestle', 'network', 'newspaper', 'nicotine',
    'nightingale', 'nitrogen', 'noble', 'nomination', 'nonchalant', 'nonsense', 'nostalgia',
    'notebook', 'notorious', 'novelty', 'novice', 'nuclear', 'nucleus', 'nuisance',
    'numeral', 'nursery', 'nutritious', 'oak', 'oasis', 'obedience', 'obituary',
    'objective', 'oblong', 'observatory', 'obstacle', 'occasion', 'occupant', 'occurrence',
    'oceanography', 'octagon', 'octopus', 'official', 'offset', 'oilfield', 'olive',
    'omission', 'omnipotent', 'omnipresent', 'onset', 'onlooker', 'onward', 'opaque',
    'operation', 'opponent', 'opportunity', 'optics', 'optimist', 'option', 'opulent',
    'oracle', 'orangeade', 'orbit', 'orchestra', 'orchestration', 'orchard', 'ordnance',
    'ordinary', 'organism', 'origami', 'originality', 'ornament', 'orphanage', 'orthodox',
    'ostrich', 'outbreak', 'outdoors', 'outfit', 'outgoing', 'outlaw', 'outlet',
    'outline', 'outlook', 'outnumber', 'outpost', 'outrage', 'outright', 'outset',
    'outshine', 'outside', 'outskirts', 'outspoken', 'outstanding', 'overcast', 'overcoat',
    'overcome', 'overcrowd', 'overflow', 'overhaul', 'overhead', 'overland', 'overlap',
    'overlook', 'overnight', 'overseas', 'oversight', 'overtake', 'overture', 'overview',
    'ownership', 'oxcart', 'oxygen', 'oyster', 'ozone', 'pace', 'pacemaker',
    'pacifist', 'package', 'packers', 'padding', 'paddle', 'paddock', 'padlock',
    'pageant', 'pagoda', 'paintbrush', 'pajamas', 'palace', 'palatable', 'palette',
    'palisade', 'pallbearer', 'palmtop', 'pampas', 'pamphlet', 'pancake', 'pancreas',
    'panda', 'pandemonium', 'pane', 'panel', 'panic', 'panorama', 'panther',
    'pantomime', 'pantry', 'papaya', 'paperback', 'paperwork', 'parabola', 'parachute',
    'parade', 'paradigm', 'paradise', 'paradox', 'paraffin', 'paragraph', 'parallel',
    'paralyze', 'paramedic', 'paramount', 'paranoia', 'parapet', 'paraphrase', 'parasite',
    'parasol', 'parchment', 'pardon', 'parentage', 'parishioner', 'parkway', 'parliament',
    'parlor', 'parochial', 'parody', 'parole', 'participle', 'particular', 'partisan',
    'partition', 'partridge', 'passbook', 'passenger', 'passerby', 'passionate', 'passive',
    'passport', 'password', 'pasteboard', 'pastel', 'patterson', 'pastime', 'pastry',
    'pasture', 'patent', 'pathfinder', 'pathology', 'pathway', 'patience', 'patient',
    'patriarch', 'patriot', 'patrolman', 'patronage', 'pattern', 'pavement', 'pavilion',
    'pawnbroker', 'paycheck', 'payroll', 'pea', 'peaceable', 'peacemaker', 'peacock',
    'peaking', 'peanut', 'pearl', 'peasantry', 'pebble', 'pecan', 'peculiar',
    'pedagogy', 'pedal', 'pedestal', 'pedestrian', 'pediatric', 'pedigree', 'peel',
    'peerage', 'pegboard', 'pelican', 'pelvis', 'penalty', 'penmanship', 'pennant',
    'pension', 'pentagon', 'penthouse', 'penumbra', 'people', 'pepperoni', 'percept',
    'perch', 'percussion', 'perdition', 'perfect', 'perforate', 'perform', 'perfume',
    'perilous', 'perimeter', 'periodical', 'periscope', 'perish', 'perjury', 'permanent',
    'permission', 'perpetual', 'perplex', 'persecute', 'persimmon', 'persistence', 'personnel',
    'perspective', 'persuade', 'pessimist', 'pesticide', 'petition', 'petroleum', 'petunia',
    'phantom', 'pharmacist', 'pharmacy', 'pharaoh', 'phenomenon', 'philanthropy', 'philology',
    'philosopher', 'phobia', 'phoenix', 'phonetics', 'phonograph', 'phosphate', 'phosphorus',
    'photograph', 'photon', 'phrase', 'physician', 'physics', 'physique', 'pianist',
    'piccolo', 'pickax', 'picket', 'pickle', 'picnic', 'pictorial', 'picture',
    'piecemeal', 'piecework', 'pier', 'pigment', 'pigpen', 'pigtail', 'pilgrim',
    'pillar', 'pillowcase', 'pilot', 'pimento', 'pimple', 'pincers', 'pinwheel',
    'pioneer', 'pipeline', 'piracy', 'pirate', 'pistachio', 'pistol', 'pitcher',
    'pitchfork', 'piteous', 'pitfall', 'pitiful', 'placement', 'placard', 'placentia',
    'placid', 'plagiarism', 'plague', 'plaids', 'plainness', 'plaintiff', 'plaintive',
    'planetary', 'plankton', 'planner', 'plantain', 'plantation', 'plasma', 'plaster',
    'platform', 'platinum', 'platitude', 'platter', 'platypus', 'plausible', 'playwright',
    'plaza', 'pleasant', 'pleasure', 'plebeian', 'pledge', 'plentiful', 'pliant',
    'pliers', 'plight', 'plumbing', 'plume', 'plummet', 'plumpness', 'plunder',
    'plywood', 'pneumatic', 'pneumonia', 'poacher', 'podium', 'poetic', 'poignant',
    'pointer', 'polaroid', 'polecat', 'police', 'policy', 'polished', 'politeness',
    'politics', 'pollutant', 'polygon', 'polymer', 'pompous', 'pigtail', 'pompano'
  ],
  hard: [
    'accommodate', 'achievement', 'acknowledgement', 'acquaintance', 'acquisition', 'acrimonious',
    'adolescence', 'adventurous', 'affidavit', 'aggression', 'alliteration', 'ambiguity',
    'ambivalent', 'ammunition', 'anachronism', 'annihilation', 'anonymous', 'antecedent',
    'anthropology', 'anticipated', 'apocalypse', 'apparatus', 'apprehension', 'archaeology',
    'architectural', 'aristocracy', 'articulate', 'assassination', 'asymmetrical', 'attainability',
    'authenticity', 'autobiography', 'auxiliary', 'bacteriology', 'belligerent', 'beneficiary',
    'benevolence', 'bibliography', 'biodegradable', 'bureaucracy', 'camaraderie', 'catastrophe',
    'category', 'centennial', 'characteristic', 'chivalrous', 'choreography', 'chronological',
    'chrysanthemum', 'circumference', 'circumstance', 'clandestine', 'coincidence', 'collaborate',
    'collateral', 'colloquial', 'commemorate', 'commensurate', 'committal', 'commotion',
    'comparative', 'compassionate', 'compatibility', 'comprehension', 'compromise', 'concentric',
    'conceptual', 'reconciliation', 'condescending', 'confidential', 'congratulations', 'conjecture',
    'conscientious', 'consciousness', 'consecutive', 'consequence', 'conservation', 'considerable',
    'conspicuous', 'conspiracy', 'constellation', 'contemporary', 'contemplate', 'contemptuous',
    'contradiction', 'controversial', 'convalescence', 'convenience', 'correspondence', 'corroborate',
    'counterfeit', 'cryptography', 'crystallize', 'curriculum', 'decapitation', 'definitely',
    'deliberate', 'delineate', 'demonstration', 'denomination', 'dependencies', 'depreciation',
    'description', 'desiccate', 'deteriorate', 'determination', 'detrimental', 'diaphanous',
    'differential', 'differentiation', 'diligence', 'dimension', 'disagreeable', 'disappearance',
    'disappointment', 'disaster', 'disciple', 'disciplinary', 'discrepancy', 'discrimination',
    'disillusion', 'disinterested', 'disproportionate', 'dissatisfaction', 'disseminate', 'dissolution',
    'distinguishable', 'distribution', 'diversification', 'eccentricity', 'ecclesiastical',
    'effectiveness', 'effervescent', 'efficiency', 'egregious', 'elaborate', 'electromagnet',
    'embarrassment', 'embryonic', 'enthusiastic', 'entrepreneur', 'environment', 'epidemiology',
    'ephemeral', 'equanimity', 'equilibrium', 'equivocal', 'eradication', 'erroneous',
    'essential', 'ethnicity', 'etymology', 'evaporation', 'exaggerate', 'exasperation',
    'exceptional', 'exclamation', 'excommunicated', 'exemplary', 'exhaustion', 'exhilaration',
    'existential', 'exonerate', 'extravaganza', 'extraordinary', 'extraterrestrial', 'extravagance',
    'flamboyant', 'fluorescent', 'formidable', 'foundational', 'fragility', 'fraternization',
    'fraudulent', 'frequently', 'fundamental', 'gargantuan', 'genealogy', 'generalization',
    'geometrical', 'glorification', 'governance', 'grammatical', 'gratuitous', 'gregarious',
    'guarantee', 'hallucination', 'harassment', 'haphazard', 'harmonious', 'hemosphere',
    'hereditary', 'heterogeneous', 'hierarchical', 'hippopotamus', 'hologram', 'homogeneity',
    'honorary', 'hospitalization', 'humanitarian', 'hyperbole', 'hypothesis', 'hysterical',
    'iconoclastic', 'idealistic', 'idiosyncrasy', 'illumination', 'illustrious', 'imaginary',
    'immeasurable', 'immemorially', 'immersion', 'imperative', 'impermissible', 'impersonation',
    'impetuous', 'implacable', 'implausible', 'impoverished', 'impracticable', 'impressionable',
    'improvisation', 'inadvertent', 'inalienable', 'incalculable', 'incandescent', 'incantation',
    'incapacitate', 'incarcerate', 'incendiary', 'incidental', 'incinerator', 'incomprehensible',
    'incongruous', 'inconsequential', 'inconsiderable', 'inconsistency', 'inconsolable', 'inconspicuous',
    'incontrovertible', 'inconvenience', 'incorporation', 'incrimination', 'indefatigable', 'indefinite',
    'indemnify', 'independency', 'indestructible', 'indictment', 'indifferent', 'indispensable',
    'individualism', 'indomitable', 'indubitable', 'ineffectual', 'ineffable', 'inefficiency',
    'ineligible', 'ineluctable', 'ineptitude', 'inequality', 'inequity', 'ineradicable',
    'inexhaustible', 'inexorable', 'inexpedient', 'inexplicable', 'inexpressible', 'inextricable',
    'infallibility', 'infatuation', 'infectiousness', 'inferential', 'infiltrate', 'infinitesimal',
    'inflammation', 'inflationary', 'inflexibility', 'infrastructure', 'ingenuity', 'ingratiate',
    'inhibition', 'inhospitable', 'inhumanity', 'inimitable', 'iniquity', 'initialization',
    'injunction', 'injustice', 'innovative', 'innuendo', 'inoculate', 'inopportune',
    'inordinate', 'inquisitive', 'insatiable', 'inscrutable', 'insecticide', 'insecurity',
    'insensitivity', 'insidious', 'insignificance', 'insinuation', 'insistent', 'insolvency',
    'insomnia', 'inspiration', 'instability', 'instantaneous', 'instigation', 'institutional',
    'subconscious', 'subterranean', 'supersede', 'surveillance', 'susceptible', 'synchronize',
    'temperature', 'thoroughfare', 'tranquility', 'unanimous', 'unprecedented', 'vacuum',
    'verisimilitude', 'vulnerability', 'whimsical', 'yacht', 'zealous'
  ]
};

class LocalProvider {
  constructor() {
    this.words = WORDS;
  }

  async getRandomWord(difficulty) {
    let pool;
    switch (difficulty) {
      case 'easy':   pool = this.words.easy;   break;
      case 'medium': pool = this.words.medium; break;
      case 'hard':   pool = this.words.hard;   break;
      default: {
        pool = [
          ...this.words.easy.slice(0, 40),
          ...this.words.medium,
          ...this.words.hard
        ];
      }
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async getDefinition(word) {
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const def = meaning?.definitions?.[0];

        return {
          word: entry.word || word,
          phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || `/${word}/`,
          partOfSpeech: meaning?.partOfSpeech || '',
          definition: def?.definition || 'No definition available.',
          example: def?.example || null
        };
      }
    } catch (_) { /* network/timeout — fall through */ }

    return {
      word,
      phonetic: `/${word}/`,
      partOfSpeech: '',
      definition: 'No definition available.',
      example: null
    };
  }
}

class WordnikProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.wordnik.com/v4';
  }

  async getRandomWord(difficulty) {
    // Determine frequency ranges based on difficulty
    // easy: common words, medium: moderate, hard: rare
    const ranges = {
      easy:   { min: 10000, max: -1 },
      medium: { min: 1000,  max: 10000 },
      hard:   { min: 1,     max: 1000 }
    };
    const range = ranges[difficulty] || { min: 100, max: -1 };

    const url = `${this.baseUrl}/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=${range.min}&maxCorpusCount=${range.max}&minLength=4&api_key=${this.apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('Wordnik fetch failed');
    const data = await res.json();
    return data.word;
  }

  async getDefinition(word) {
    const common = { word, phonetic: `/${word}/`, partOfSpeech: '', definition: 'No definition available.', example: null };
    
    try {
      // 1. Get definitions
      const defRes = await fetch(`${this.baseUrl}/word.json/${encodeURIComponent(word)}/definitions?limit=1&includeRelated=false&useCanonical=false&includeTags=false&api_key=${this.apiKey}`);
      if (defRes.ok) {
        const defs = await defRes.json();
        if (defs.length > 0) {
          common.definition = defs[0].text;
          common.partOfSpeech = defs[0].partOfSpeech;
        }
      }

      // 2. Get examples
      const exRes = await fetch(`${this.baseUrl}/word.json/${encodeURIComponent(word)}/examples?limit=1&includeDuplicates=false&useCanonical=false&api_key=${this.apiKey}`);
      if (exRes.ok) {
        const exs = await exRes.json();
        if (exs.examples?.length > 0) {
          common.example = exs.examples[0].text;
        }
      }
      
      // 3. Phonetic (approximate since Wordnik doesn't always have one plain text phonetic)
      return common;
    } catch (_) {
      return common;
    }
  }
}

class Dictionary {
  constructor() {
    this.cache = new Map();
    this.provider = process.env.WORDNIK_API_KEY 
      ? new WordnikProvider(process.env.WORDNIK_API_KEY)
      : new LocalProvider();
    
    console.log(`[Dictionary] Using ${this.provider.constructor.name}`);
  }

  async getRandomWord(config) {
    let word;
    if (config.customDictionary?.length > 0) {
      word = config.customDictionary[Math.floor(Math.random() * config.customDictionary.length)];
    } else {
      word = await this.provider.getRandomWord(config.difficulty);
    }
    return this.getDefinition(word);
  }

  async getDefinition(word) {
    if (this.cache.has(word)) return this.cache.get(word);
    const info = await this.provider.getDefinition(word);
    this.cache.set(word, info);
    return info;
  }
}

module.exports = { Dictionary, WORDS };
