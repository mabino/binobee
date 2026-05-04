// Built-in word lists organised by difficulty
const WORDS = {
  easy: [
    'apple','banana','orange','grape','lemon','mango','peach','plum','melon',
    'cat','dog','fish','bird','frog','duck','cow','pig','lamb','bear','deer',
    'book','desk','door','floor','hand','jump','king','lamp','milk','moon',
    'nose','park','rain','snow','tree','walk','yard','blue','gold','pink',
    'ball','barn','bell','boat','bone','bowl','cake','cave','chip','clay',
    'coat','coin','cold','cook','corn','curl','dark','dive','doll','drag',
    'drum','dust','earn','east','edge','farm','fast','fear','feed','feel',
    'film','find','fire','flag','flat','flow','foam','fold','food','fork',
    'free','full','game','gate','gift','girl','glow','goal','grab','grew',
    'grin','grip','grow','halt','harm','hate','hawk','heal','heap','heat',
    'heel','held','help','herb','here','hide','hill','hint','hold','hole',
    'home','hook','hope','horn','host','huge','hunt','inch','iron','item',
    'joke','just','keen','keep','kind','knew','know','lake','land','lane',
    'last','late','lead','leaf','lean','leap','left','lend','less','lick',
    'lift','lime','line','link','lion','list','live','lock','long','look',
    'loop','lord','lose','loud','love','luck','mail','make','male','mark',
    'mass','maze','meal','mean','meat','meet','melt','menu','mild','mile',
    'mill','mine','mint','mist','mode','mole','monk','mood','move','much',
    'must','nail','name','navy','near','neat','need','nest','news','nice',
    'nine','node','noon','norm','note','noun','oath','oven','over','pace',
    'pack','page','pain','pale','palm','pane','pass','path','pave','peak',
    'peel','pick','pile','pill','pine','pipe','plan','play','plot','plow',
    'plum','poem','pole','poll','pond','pool','port','pose','post','pour',
    'pray','prey','pull','pump','pure','push','race','rack','rage','rail',
    'rake','rank','rare','read','real','reed','rely','rent','rest','rice',
    'rich','ride','ring','rise','risk','road','rock','role','roll','roof',
    'room','rope','rule','rush','rust','safe','sage','sail','sale','salt',
    'sand','save','seal','seed','seek','self','sell','sent','shed','ship',
    'shop','shot','show','side','silk','sing','sink','site','size','skin',
    'slab','slam','slim','slip','slot','slow','soap','sock','soft','soil',
    'sold','sole','song','sore','sort','soul','span','spin','spot','spur',
    'star','stay','stem','step','stop','stub','suit','surf','tail','tale',
    'tame','task','tall','team','tear','tell','tend','tent','test','tide',
    'tile','time','tire','toad','told','toll','tone','tool','tour','town',
    'trim','trip','true','tube','tusk','twig','twin','type','vale','vast',
    'veil','vein','verb','view','vine','vote','wade','wave','weak','weed',
    'well','went','west','wide','wild','will','wind','wink','wire','wish',
    'wolf','wood','word','work','worm','yawn','year','yell','zone'
  ],
  medium: [
    'absence','account','acquire','advance','affect','afraid','agency',
    'agenda','anchor','annual','appear','argue','arise','assign','assist',
    'assume','attach','attend','autumn','barely','barrel','beauty','became',
    'before','behalf','behave','belief','belong','beyond','bitter','bother',
    'branch','breath','bridge','bright','broken','buffer','burden','button',
    'cancel','capture','career','castle','casual','central','certain',
    'change','charge','chrome','circle','circus','claim','clever','client',
    'coarse','coffee','column','combat','commit','common','corner','cotton',
    'couple','create','crisis','custom','damage','danger','daughter',
    'debate','decide','defeat','degree','demand','design','detail','detect',
    'divide','domain','double','during','either','empire','enable','engine',
    'entire','escape','estate','except','expect','export','extend','factor',
    'fairly','famous','female','fierce','figure','finger','finish','flavor',
    'flight','flower','follow','forest','formal','framed','friend','frozen',
    'future','gather','gentle','global','glance','govern','gravel','ground',
    'happen','health','height','honest','hunger','impact','import','income',
    'indeed','insist','joined','kernel','latter','launch','leader','legal',
    'length','letter','likely','listen','locate','lovely','loyal','manner',
    'matter','modern','module','moment','moral','mother','motion','muscle',
    'mutual','narrow','nation','nature','notice','number','object','occupy',
    'ocean','option','origin','output','palace','parent','patrol','peace',
    'people','period','person','phase','photo','piece','pilot','planet',
    'plant','plate','policy','power','press','price','pride','print','prior',
    'profit','public','pursue','range','rapid','ratio','react','ready',
    'reason','rebel','record','refer','region','relate','remain','repeat',
    'report','rescue','resort','result','return','reveal','review','reward',
    'rigid','robot','rough','royal','rural','sacred','salmon','satisfy',
    'school','season','secret','select','senior','series','settle','severe',
    'signal','silent','silver','simple','single','sister','sketch','sleep',
    'slight','smart','smooth','solar','solve','south','space','speak',
    'speed','spend','spirit','split','sport','staff','stage','stand',
    'start','state','stick','still','stone','store','story','study','style',
    'supply','switch','symbol','system','teach','theme','tight','title',
    'today','topic','total','touch','tough','track','trade','trail','train',
    'treat','trend','trial','tribe','trust','truth','twice','twist','union',
    'unity','upper','upset','usual','valid','value','video','visit','vital',
    'vocal','voice','waste','watch','water','wealth','weird','whole',
    'widen','window','winter','write','wrong','young'
  ],
  hard: [
    'aberration','abolition','abstinence','abundance','accessible',
    'accumulate','achievement','acknowledge','acquaintance','acrimony',
    'adamant','admonish','adversarial','affidavit','affirmative',
    'alacrity','allegiance','alliteration','allusion','ambiguous',
    'ambivalent','ammunition','anachronism','anniversary','antagonist',
    'apparatus','appropriate','archipelago','arduous','articulate',
    'assassination','atrocious','audacious','authenticate','auxiliary',
    'belligerent','beneficiary','bibliography','bureaucracy','catastrophe',
    'chronological','collaborate','colloquial','combustible','commemorate',
    'commensurate','comprehensible','conscientious','consecutive',
    'conspicuous','contemporary','contemplate','controversial','cryptography',
    'curriculum','delineate','denomination','deteriorate','discrepancy',
    'distinguish','ecclesiastical','equilibrium','erroneous','exaggerate',
    'exasperate','extraordinary','facilitate','fluorescent','formidable',
    'frustration','fundamental','grammatically','gregarious','guarantee',
    'hallucinate','hierarchical','hippopotamus','horizontal','humanitarian',
    'hypothesis','idiosyncrasy','immediately','inadvertent','indispensable',
    'inflammatory','influential','infrastructure','instantaneous',
    'intellectual','interrogation','irresistible','judiciary','jurisdiction',
    'kaleidoscope','knowledgeable','ludicrous','magnanimous','malevolence',
    'melancholy','miscellaneous','mischievous','modification','mountainous',
    'necessary','neuroscience','obsequious','occasionally','oppression',
    'outrageous','perseverance','pharmaceutical','physiological','prestigious',
    'privilege','pronunciation','quarantine','questionnaire','quizzical',
    'ratification','rebellious','reconnaissance','referendum','relinquish',
    'renaissance','resilience','resurrection','revelation','rhetorical',
    'rigmarole','sabotage','simultaneous','sophisticated','spontaneous',
    'subordinate','surveillance','susceptible','technological','temperament',
    'treacherous','unanimous','unprecedented','vulnerability','catastrophic',
    'accommodate','Mediterranean','silhouette','desiccate','millennium',
    'concurrence','occurrence','recommend','rhythm','separate','supersede',
    'conscience','lieutenant','bureaucracy','acquire','connoisseur'
  ]
};

class Dictionary {
  constructor() {
    this.cache = new Map();
    this.allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
  }

  async getRandomWord(config) {
    let pool;
    if (config.customDictionary?.length > 0) {
      pool = config.customDictionary;
    } else {
      switch (config.difficulty) {
        case 'easy':   pool = WORDS.easy;   break;
        case 'medium': pool = WORDS.medium; break;
        case 'hard':   pool = WORDS.hard;   break;
        default: {
          // mixed: skew toward medium/hard for variety
          pool = [
            ...WORDS.easy.slice(0, 40),
            ...WORDS.medium,
            ...WORDS.hard
          ];
        }
      }
    }
    const word = pool[Math.floor(Math.random() * pool.length)];
    return this.getDefinition(word);
  }

  async getDefinition(word) {
    if (this.cache.has(word)) return this.cache.get(word);

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

        const info = {
          word: entry.word || word,
          phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || `/${word}/`,
          partOfSpeech: meaning?.partOfSpeech || '',
          definition: def?.definition || 'No definition available.',
          example: def?.example || null
        };
        this.cache.set(word, info);
        return info;
      }
    } catch (_) { /* network/timeout — fall through */ }

    const fallback = {
      word,
      phonetic: `/${word}/`,
      partOfSpeech: '',
      definition: 'No definition available.',
      example: null
    };
    this.cache.set(word, fallback);
    return fallback;
  }
}

module.exports = { Dictionary, WORDS };
