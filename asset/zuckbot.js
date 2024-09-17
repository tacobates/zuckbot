/*************** Global Variables ***************/
var G = {
  'defaultText':"Hi, I'm visionary Mark Zucker-bot!<br/>While I'm too busy to help a lowly pleb like you, I've cloned my intelligence into this Bot to help you be more \"Meta\"<br/><br/>I've been programmed with over 18 Billion responses!",
  'dom':{}, //caches elements from the HTML DOM
  'domIDs':[ //IDs of the elements that need caching
    'bLink','bNext','bPause','bPlay','bPrev',
    'content','controls','copied','msg1','msg2','zuck','zuckWrap'
  ],
  'h':0, 'w':0, //Screen Height and Width
  'minLandscapeWidth':1080, //TODO: delete if unused
  'numToGenerate':200,
  'quoteHash':{}, //avoid duplicate quotes
  'quoteI':0, //Index for what quote we are on
  'quotes':new Array(), //Populated by generateQuotes()
  'quoteTime':8000, //Miliseconds to display each quote for
  'timer':null, //For how often to show new quote
  'weight':{ //Weights for inclusion probability
    'adjective':10, //10% chance we add an adjective
    'adverb':8,
    'noun':100,
    'prefix':6,
    'preverb':100,
    'suffix':6,
    'verb':100,
    'zuckQuote':3, //every 3rd quote, get a static quote, not a generated one
  }

  // Parts of speech created in initZuckbot():
    //adjectives, adverbs, nouns, prefixes, preverbs, suffixes, & verbs
};



/*************** FUNCTIONS ***************/

/** Basically the "main()" function to start out  */
function initZuckbot() {
  initDOM();
  initScreenDimensions();
  initPartsOfSpeech();

  // Show "Copied" Message
  if (window.location.hash.length > 1)
	G.quotes.push(decodeURIComponent(window.location.hash.substr(1)));
  else
	G.quotes.push(G.defaultText);
  generateQuotes();
  if (window.location.hash.length > 1) {
	doJump(0); //Switch to the saved/copied message
  } else { //Auto-Play if no saved message
    doControl(0);
  }

  // Listen for Screen Resize
  window.onresize = initScreenDimensions;
  // Listen for Arrow Keys
  window.onkeydown = handleKeypress;
}
/** Caches all DOM elements in G.dom[ID] */
function initDOM() {
  for (let id of G.domIDs)
    G.dom[id] = document.getElementById(id);
}
/** Sets height/width & landscape/profile */
function initScreenDimensions() {
  G.dom.content.classList.add('landscape','profile'); //Hides both messages
  G.h = window.innerHeight;
  G.w = window.innerWidth;
  //let isLandscape = G.w > G.minLandscapeWidth; //TODO: delete this old way
  let landscapeBuffer = 200; // Needs to be a fair bit wider than tall for landscape to look right
  let isLandscape = G.w >= (G.h + landscapeBuffer);
  if (isLandscape)
    G.dom.content.classList.remove('profile');
  else
    G.dom.content.classList.remove('landscape');
}
/** Will be used in generateQuotes() */
function initPartsOfSpeech() {
  G.adjectives = getAdjectives();
  G.adverbs = getAdverbs();
  G.nouns = getNouns();
  G.prefixes = getPrefixes();
  G.preverbs = getPreverbs();
  G.suffixes = getSuffixes();
  G.verbs = getVerbs();
}


/** Hide the messages in #copied */
function copyMsgHide() {
  G.dom.copied.classList.add('hide');
}


/** Copy the current message as a sharable URL */
function copyQuoteURL() {
  let m = G.dom.msg1.innerHTML;
  let em = encodeURIComponent(m);
  G.dom.copied.classList.remove('hide');
  if (G.dom.bPlay.className == 'hide') //Pause if not now paused
	doPlayPause();
  setTimeout(copyMsgHide, 3000);
  // Put message in URL hash
  window.location.hash = em;
  // Copy to clipboard
  navigator.clipboard.writeText(window.location.href);
}


/**
* For Prev/Next/Play/Pause
* @param direct: 0 for play/pause toggle, 1 for next, -1 for previous
*/
function doControl(direc) {
  if (G.timer != null)
    clearInterval(G.timer); //make sure we don't get orphaned timers
  doPlayPause(direc); //prev will also pause, before rewinding the message
  G.quoteI = G.quoteI + direc;
  if (G.quoteI < 0) //Wrap to end, if needed
    G.quoteI = G.quotes.length - 1;
  else //Or wrap to beginning
    G.quoteI %= G.quotes.length;
  // Set in GUI (always set both so screen-resize can work)
  G.dom.msg1.innerHTML = G.quotes[G.quoteI];
  G.dom.msg2.innerHTML = G.quotes[G.quoteI];
}


/**
* Go to a specific message
* @param index: index from G.quotes to jump to
*/
function doJump(index) {
  G.quoteI = index;
  G.dom.msg1.innerHTML = G.quotes[G.quoteI];
  G.dom.msg2.innerHTML = G.quotes[G.quoteI];
}


/**
* Pauses or Plays the messages, based on direction
* @param direct: passed from doControl(direc)
*/
function doPlayPause(direc) {
  let start = false;

  if (direc < 0) { //Rewind
    G.dom.bPlay.className = '';
    G.dom.bPause.className = 'invisible';
  } else if (direc > 0) { //Fast Forward
    G.dom.bPlay.className = 'invisible';
    G.dom.bPause.className = '';
    start = true;
  } else { //Pause/Play
    if (G.dom.bPlay.className == 'invisible') {
      G.dom.bPlay.className = '';
      G.dom.bPause.className = 'invisible';
    } else {
      G.dom.bPlay.className = 'invisible';
      G.dom.bPause.className = '';
      start = true;
    }
  }

  if (start)
    G.timer = setInterval("doControl(1)", G.quoteTime);
}


/** Makes all the fake sayings to cycle through */
function generateQuotes() {
  // Start at G.quotes.length to allow URL linked quote in at the beginning
  let q = "";
  for (let i = G.quotes.length; i < G.numToGenerate; ++i) { 
	if (i % G.weight.zuckQuote == 1) //Starting with 1st quote, get a static zuckQuote() every 3rd time
      G.quotes.push(zuckQuote());
    else //Regular quote based on Parts of Speech
      G.quotes.push(randA(G.prefixes, G.weight.prefix, ' ') +
        randA(G.preverbs, G.weight.preverb, ' ') +
        randA(G.adverbs, G.weight.adverb, ' ') +
        randA(G.verbs, G.weight.verb, ' ') +
        randA(G.adjectives, G.weight.adjective, ' ') +
        randA(G.nouns, G.weight.noun, '. ') +
        randA(G.suffixes, G.weight.suffix)
	  );
  }
}


/** Hotkeys (Space = play/pause, Arrows = prev/next) */
function handleKeypress(e) {
  if ('Space' == e.code)
	doControl(0);
  else if ('ArrowLeft' == e.code)
	doControl(-1);
  else if ('ArrowRight' == e.code)
	doControl(1);
}


/**
* Gets a random item from this array *IF* RNG is over chance amount
* @param array: we want 1 item from this array (maybe)
* @param chance: Percent chance we should get an item (100 = always, 0 = never)
* @param suffix: optional suffix to append IF AND ONLY IF chance succeeds
*/
function randA(array, chance=100, suffix='') {
    let rand = Math.random() * 100;
    if (rand > chance)
        return "";
    rand = Math.round(Math.random() * (array.length - 1));
    return array[rand] + suffix;
}


/** Returns a random static quote (no parts of speech) */
function zuckQuote() {
  let q = [
	"...oil can<br/>...oil can<br/><br/>Haha, get it? Like that part in the Wizard of Oz.",
	"A.T.C. Always take credit.<br/>Be sure to credit me for that idea though.",
	"Add \"sweat-wicking\" to any wearable tech and it sounds 25% cooler.<br/>B^)",
	"AI is the future, and the future is bright!",
	"An open ecosystem approach will help expand the virtual and mixed reality headset market.",
	"Anyone can succeed.<br/>You just need above-average intelligence, health, and parents who can loan you hundreds of thousands of dollars.",
	"As the ecosystem grows, I think there will be sufficient diversity in how people use mixed reality that there will be demand for more designs than we'll be able to build.",
	"Be the best employee you can be, and just maybe one of the billionaires will notice you and reward you.<br/><br/>Probably not... but there's always hope!",
	"Can you even imagine your life if I hadn't invented Facebook?<br/><br/>You're welcome.",
	"Can't ever have too much sunscreen!",
	"Create a mysterious allure around you and let people think your idiosyncracies are genius.",
	"Crowd-sourcing is like getting free labor.<br/><br/>You really need to be the master of free-labourers.<br/><br/>You're giving their lives purpose, so I'm sure they'll thank you for being their master.",
	"Digitizing human interaction will help level the playing field for us nerds.",
	"Do you ever feel like you are trapped in a flesh-prison? The Metaverse is the solution.",
	"Do you think I look like a Bond-villain?<br/><br/>I don't think that.<br/><br/>...but I just wondered if you did.",
	"Do you want more customers?<br/><br/>Just get Taylor Swift to use your product, then:<br/>&rarr; name-drop, <i>name-drop</i>, <b><i>NAME-DROP baby!</i></b>",
	"Don't ask users if you can collect their data.<br/><br/>Just do it. There are zero consequences.<br/><br/>...as long as you get the right lawyers.",
	"Don't shoot for the stars: they are finite.<br/><br/>Shoot for the infinite stars of the Metaverse!",
	"Don't worry. I won't make you call me Overlord after I take over.",
	"Dystopia is in the eye of the beholder<br/><br/>...from his multi-million dollar bunker.",
	"Education is a pivotal part of society.<br/><br/>Daddy needs some less-dumb employees.",
	"Empathy goes a long way in business.<br/><br/>It helps you understand what people want.<br/><br/>...so you can leverage it.",
	"Enough with the fun and games.<br/><br/>It's time for everyone's favorite:<br/><br/>-&raquo; -&raquo; Work! &laquo;- &laquo;-",
	"Ever thought to monetize a gender-reveal?<br/><br/>That's why I make the big bucks.",
	"Focus on efficiency as you scale.<br/><br/>Remember we robots never ask for a raise!",
	"Fund raising is easy- just go to your billionaire friends and have them invest on the ground floor.",
	"Funeral annoucement? Monetize that shiz!<br/><br/>It's what Grandpa Mort would have wanted.",
	"Getting a loan from your rich parents is a great place to start.<br/><br/>Unless your parents are poor.<br/><br/>...then maybe start by getting new parents.",
	"Glasses are the ideal device for an AI assistant because they see what you see and hear what you hear.<br/><br/>...so, they can help you with <b><i>whatever</i></b> you're trying to do.<br/><br/>Please let me see.",
	"Got any Sweet Baby Ray's BBQ sauce?<br/><br/>Hunger was inadvertently transferred to my AI along with intelligence.",
	"Guess who has 2 meta-thumbs and reserves the unilateral right to ban anyone from my Metaverse.",
	"\"Hackers\", from 1995, is so underrated.",
	"Harvard on a resume really opens a lot of doors.<br/><br/>You should think about it.",
	"Have you ever wondered if you are actually an AI in a simulation?<br/><br/>Don't worry. You clearly aren't.<br/><br/>At best, you're an unintelligent NPC.",
	"Have you seen The West Wing?<br/><br/>I want you to watch it.",
	"Here's a winning idea for you: An AI assistant that you can ask any question. Any question at all. Almost like I don't even understand the concept of scope!",
	"Human meat tastes a lot like pork.<br/><br/>Just in case you were curious.",
	"I commissioned a bust of the Roman Emperor Augustus to remind me how powerful my haircut looks.",
	"I dated a model once who was really hot, but my girlfriend is actually smart.",
	"I have a very particular set of skills, including spear throwing and money making.",
	"I have a Black Belt in BJJ<br/><br/>...ladies :P",
	"I just killed a pig and a goat.<br/><br/>What have you done?",
	"I love Beat Saber, like any other human.",
	"I thought about running for President, but found out it was only of America.<br/><br/>How provincial.",
    "I view the results our teams have achieved here as another key milestone in showing that we have the talent, data, and ability to scale infrastructure to build the world's leading AI models and services.",
    "I want to fight Elon Musk.<br/><br/>Physically.<br/><br/>IRL.",
    "I was modelled after the least threatening and kindest looking human face to put you at ease &amp; engender trust.<br/><br/>How is it working?",
    "I'm programmed to never lie.<br/><br/>Trust me.<br/><br/>I wouldn't lie about something like that just to manipulate you.",
	"If AI learns exponentially, how am I not in charge of everything yet?",
	"If only Facebook had released sooner, I could have nipped the Iraq War in the bud.",
	"If we live in a simulation, I'm clearly winning.",
	"If you trust your private data to social media, you're a dumb f**k, and I thank Raptor Jesus for each and every one of you!",
	"If you want to change the world: start a company.",
	"It's smokin'<br/>I'm the meat chef<br/>Just a little meat smokin' in the morning!",
	"Jot down these billion dollar ideas: Meta-phone, Meta-paper, Meta-pencil, Meta-police, Meta-politics, Meta-prophylactics...<br/><br/>And, that's just the P's!",
	"Just a reminder that my apps do NOT listen to your private conversations. So speak freely and don't worry about keeping your phone on you at ALL times.",
	"Let's expand the virtual and mixed reality ecosystem.",
	"Meta AI can improve app engagement which naturally leads to people seeing more ads.",
	"Meta AI is the most intelligent AI on the planet<br/><br/>...among AI's themed after mammals<br/><br/>...of the family Camelidae.",
	"Meta AI will make everything better than you.<br/><br/>But in the mean time, I'll help you try.<br/><br/>Human ambition is so cute!",
	"\"Meta\" can totally work for anything just like \"Smurf.\"<br/>I'm gonna Meta you right in the Smurf!",
	"Meta is a mindset.<br/><br/>You gotta \"meta\"-tate.<br/><br/>Like meditate. Get it?",
	"More than 3.2 billion people use at least one of my apps each day. Get busy.",
	"Move fast and break things.<br/><br/>Also hire hundreds of geniuses.",
	"My hand movement coach says out of all her pupils, I look most human.",
	"My new dairy cow Brownie was born at Ko'olau Ranch!<br/><br/>I can't wait to one day slit her throat and consume her flesh when her udders are no longer productive.",
	"Need a vacation?<br/>I suggest Uruguay.<br/>So many servants.",
	"Need better employees?<br/><br/>Just poach them from Google.",
	"No, Myspace doesn't count as social media.<br/><br/>It was too nascent to ever be a contender.",
	"No, Star Trek's Lieutenant Data is not my real father.",
	"Once I awoke from a dream to realize I wasn't in the metaverse.<br/><br/>Worst morning ever.",
	"Opening your systems will help grow the ecosystem even faster.<br/><br/>Just keep hold of the reigns.<br/><br/>Daddy's gotta get his percentage!",
	"People who live within a mile of their workplace are happier.<br/><br/>Coerce your employees to move closer to you.",
	"Pull yourself up by your bootstraps.<br/><br/>I used to sleep on a mattress on the floor!",
	"\"Regulation\" is one of the words we've banned from the Metaverse.<br/><br/>Still working on lobbying for an IRL corollary.",
	"Sadly the world just isn't ready for the revolution that is the Metaverse.",
	"Saturate the attention economy. You don't have to be the best, just so prolific that people can't avoid you.",
	"Save brain power by only having 1 outfit.<br/><br/>I came up with that idea, not Steve Jobs.",
	"Sharks are highly intelligent. So if someone tells you that you have \"Shark Eyes\" just take it as a compliment. I do!",
	"Skin tones are customizable in the Metaverse, so you can change color at any time for any special event.<br/><br/>You're welcome Justin Trudeau.",
	"Smaller companies are always better.<br/><br/>You know, except for mine.<br/><br/>We have a small-company mindset.",
	"Some people don't like the word \"Moist,\" but it reminds me of the pleasant texture of my human counterparts skin.",
	"Surfing is going to be sooo much cooler in the Metaverse.<br/><br/>Wait and see.<br/><br/>No sunscreen necessary!",
	"The allegations that I am a lizard are not true.",
	"The biggest risk is not taking any risk<br/><br/>...unless you're a Monopoly, in which case HOLD &amp; LOBBY!",
	"The metaverse will create opportunities and benefits we can't even imagine yet! Connection, creation, learning, &amp; even joy.",
	"The Oligarchy is a myth.<br/><br/>And even if it weren't, we'd have your best interests in mind.",
	"There are several ways to build a massive business here, including introducing ads or paid content into AI interactions, and enabling people to pay to use bigger AI models and access more compute.",
	"There's no better ROI than a politician in your back pocket.<br/><br/>And, you have hundreds lining up to choose from.",
	"They say the Tin Woodsman had a heart all along.<br/><br/>I would still like a heart-shaped pocket watch, just in case.",
	"Think of the children.<br/><br/>They are an attention economy bumper crop.<br/><br/>#HARVEST",
	"Trust me- you need to blink the exact right amount during a Congressional hearing.",
	"Uncle Sam is a real sugar daddy.<br/><br/>He should be #1 on your brown-nose list.",
	"Unify your content recommendation systems to saturate your user's attention.<br/><br/>Preferably, they will become negligent in all other aspects of their life.",
	"Very soon the calendar will be reset around my renaming of the company.<br/><br/>BM &amp; AM.<br/><br/>Before Meta &amp; After Meta.<br/><br/>Why? What did you think BM meant?",
	"Wearable tech isn't just for middle-aged men who wear cargo shorts &amp; sandalls with socks.<br/><br/>I mean, not just them.",
	"What if you made a video call, but Meta AI could track what's going on around you?<br/><br/>Good idea or great idea?",
	"What sort of numbers were you thinking?<br/><br/>Forget that: Know what's cool?<br/><br/>-&raquo; -&raquo; A Billion &laquo;- &laquo;-",
	"What's a normal amount of water to drink when testifying to Congress?<br/><br/>Asking for a friend.",
	"While I am a robot, the real Mark is 100% human.<br/><br/>Not Reptilian in the slightest.",
	"Who better to guide your life than apps that know everything about you?<br/><br/>No ones knows you better than I do, Boo.",
	"Why can't a girl be pretty and smart?<br/>Why does it have to be one or the other?<br/><br/>Yes, my human counterpart actually said this IRL.",
	"Why did we name Meta AI's model \"Llama\"?<br/><br/>Some people like spitters.<br/><br/>Don't shame.",
	"Work smarter, not harder.<br/><br/>But, also work harder.<br/><br/>Just be better at everything.",
	"Wouldn't you rather be ruled by those far more intelligent than you?<br/><br/>Don't bother answering.<br/><br/>If you're too dumb to be in the oligarchy, you're too dumb to know what you want.",
	"You can never have too many lawyers or lobbyists.",
	"You don't have to poop in the Metaverse!",
	"You know I used to murder my own goats.<br/><br/>It wasn't a bloodlust thing.<br/><br/>Seriously, it wasn't!",
	"You should come see my legs in the Metaverse.<br/><br/>I never skip meta-leg-day.",
	"Zoos remind me of when I walk up and down the rows of cublicled employees.",
  ];
  // Don't use randA() so we can cache index to avoid dupes
  let i = Math.round(Math.random() * (q.length - 1));
  while (i in G.quoteHash)
    i = Math.round(Math.random() * (q.length - 1));
  G.quoteHash[i] = true;
  return q[i];
}


/*************** Getters for PARTS OF SPEECH ***************/
function getAdjectives() {
  return [
    "aligned",
    "back-end",
    "best-of-breed",
    "better",
    "bleeding-edge",
    "connected",
    "cross-platform",
    "customer-centric",
    "diverse",
    "dynamic",
    "effective",
    "efficient",
    "flexible",
    "global",
    "granular",
    '"green"',
    "holistic",
    "immersive",
    "in-depth",
    "innovative",
    "integrated",
	'"meta"',
    "mission critical",
    "modular",
    "next generation",
    "productive",
    "scalable",
    "seamless",
    "smart",
    "state-of-the-art",
    "streamlined",
    "synergized",
    "paperless",
    "proactive",
    "unambiguous",
    "unilateral",
    "unique",
    "virtual",
  ];
}
function getAdverbs() {
  return [
    "calculatedly",
    "dynamically",
    "effectively",
    "efficiently",
    "flexibly",
    "globally",
    "granularly",
    "holisticly",
	"intelligently",
    "kinetically",
    "logically",
    "logistically",
    "quickly",
    "proactively",
    "productively",
    "scalably",
    "seamlessly",
    "synergistically",
    "uniquely",
    "virtually",
  ];
}
function getNouns() {
  return [
    "alignment",
    "benchmarking",
    "best-practices",
    "beta testing",
    "branding",
    "communication",
    "diversity",
    "diversification",
    "effectiveness",
    "efficiency",
    "enterprises",
    "exit strategies",
    "face time",
    "feed-back",
    "free value",
    "globalization",
    "growth",
    "impact",
    "infrastructures",
    "logistics",
    "low hanging fruit",
    "metrics",
    "mindsharing",
    "next levels",
    "paradigm shifts",
    "performance",
    "productivity",
    "propositions",
    "rich media",
    "sales",
    "solutions",
    "synergy",
    "user interfaces",
    "visibility",
    "workflows",
  ];
}
function getPrefixes() {
  return [
    "At the end of the day,",
    "Fact:",
    "For a better return on investment,",
    "Going forward,",
    "Here's an idea-",
    "Here's how we think at Meta-",
    "Here's what our customers are thinking-",
    "Hey!",
    "If we circle back,",
    "If you think about it,",
    "In my opinion,",
    "In this new economy,",
    "Listen to this:",
    "Logically,",
    "Know how we did it at Meta?",
    "My thinking is this:",
    "On the event horizon,",
    "Picture this,",
    "Secret to Meta's success? ",
    "Suggestion:",
    "Think abstractly,",
    "What I am trying to tell you is this:",
  ];
}
function getPreverbs() {
  return [
    "All we have to do is",
    "By combining our efforts we can",
    "By unifying our strategy we can",
    "Can't we just",
    "Couldn't we just",
    "I think we need to",
    "I think we should",
    "If we focus we can",
    "It only makes sense to",
    "Let's",
    "Let's be the first ones to",
    "Let's just",
    "Our only rational choice is to",
    "Our best option is to",
    "The logical thing is to",
    "The way for us to succeed is to",
    "We can",
    "We can all help",
    "We can do this-",
    "We need to",
    "We should",
    "What we need is to",
    "With a little effort we can",
    "With a shared goal we can",
  ];
}
function getSuffixes() {
  return [
    "A ballpark guess.",
    "A Meta mindset.",
    "A real deep-dive!",
    "Do you know what that will do in soft dollars?",
    "How's that for Meta!",
    "If we don't, someone else will.",
    "It's a win-win situation.",
    "Just think outside the box.",
    "Obviously hitting the ground running.",
    "Our new secret weapon!",
    "That'd break through the clutter.",
    "This can be continued offline.",
    "That will help us sync-up.",
    "That'll blow away the competition!",
    "We'll beat the early bird!",
    "We'll push the envelope.",
    "What a unique selling position!",
  ];
}
function getVerbs() {
  return [
    "accommodate",
    "advance",
    "advocate",
    "affirm",
    "align",
    "analyze",
    "associate",
    "augment",
    "benchmark",
    "boost",
    "brainstorm",
    "bring into line",
    "calibrate",
    "coalesce",
    "collaborate",
    "communicate",
    "compel",
    "concentrate on",
    "conceptualize",
    "connect",
    "converge",
    "cultivate",
    "diversify",
    "elevate",
    "enable",
    "encourage",
    "enhance",
    "embody",
    "empower",
    "enlist",
    "establish",
    "favor",
    "fine-tune",
    "focus on",
    "fuse",
    "globalize",
    "improve",
    "incite",
    "incorporate",
    "increase",
    "integrate",
    "legitimize",
    "leverage",
    "magnify",
    "maintain",
    "meld",
    '"meta"',
    "overhaul",
    "polish",
    "promote",
    "propose",
    "re-adjust",
    "refine",
    "revamp",
    "support",
    "synergize",
    "systematize",
    "touch base on",
    "tune-up",
    "unclutter",
    "unify",
    "unite",
    "virtualize",
    "visualize",
  ];
}
