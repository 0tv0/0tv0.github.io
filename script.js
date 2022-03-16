// make console.log output copy into the dev log
var oldLog = console.log;
var loggerElement = document.getElementById('console');
var errorReporter = document.getElementById('errorReporting');
var lines = [];
var scrollState = "up";

console.log = function() {
  let args = [...arguments];
  let text = '';
  args.forEach(x => text += (typeof x === 'object' ? JSON.stringify(x, null, 2) : x) + ' ');
  lines.push(...text.split('\n').map(c => `[${Date().toString().slice(16, 24)}] ${c}`));
  if(lines.length >= 51) lines = lines.slice(lines.length - 52);
  
  loggerElement.innerText = lines.join('\n');
  
  oldLog(...args);
};

window.onunhandledrejection = error => {
  let err = {
    stack: error.reason.stack.toString().split('\n').join('<br>').replaceAll(location.href, '')
  };
  
  err.title = `Critical error (uncaught promise error variant)`;
  console.log(err);
  console.error(err);
};

window.onerror = (stack, source, lineno, colno, title) => {
  console.log({
    stack,
    source,
    lineno,
    colno,
    title
  });
  
  let error = {
    stack
  };
  
  error.title = `Critical error in ${source.slice(location.href.length)} (line ${lineno} column ${colno})`;
  console.log(error);
  console.error(error);
};

console.error = function(e) {
  let el = document.createElement('div');
  el.setAttribute('class', 'errorReporting');
  el.innerHTML = '<b>' + (e.title || "Critical error (Source unknown)") + '</b><br>Stack (if any): <span style="font-family: Menlo-regular, Consolas; background-color: black;">' + e.stack + '</span><br>Unsure what to do? Hold the cmd key and press r, that will reload the app.\nThis error has been reported, it will probably be fixed by tomorrow or in a few days at most.';
  console.log(`Error innerHTML: ${el.innerHTML}`);
  errorReporter.appendChild(el);
};

// menu gui stuff
var mainMenu = document.getElementById('mainMenu');
var els = [];
var debugActive = false;

function loadButton(data) {
  let { text, set, action, disabled, type, custom, repeat } = data;
  // repeat will likely never be used, idk why i added it
  repeat = repeat || 1;
  for(let i = 0; i < repeat; i++) {
    let gId = Math.floor(Math.random() * 256 ** 5).toString(16).padStart(10, '0');

    let element = document.createElement(type);
    if(text) element.innerText = text;
    if(action) element.onclick = action;
    element.disabled = !!disabled;
    element.setAttribute('class', 'element-' + set);
    element.setAttribute('id', gId);
    element.set = set;
    if(custom) {
      for(let i in custom) {
        element[i] = custom[i];
      }
    };

    element.destroy = function() {
      element.classList.add("despawning");
      console.log("Destroying element " + gId + " [type=" + type + "]");
      setTimeout(() => {
        mainMenu.removeChild(element);
        if(els.includes(element)) els.splice(els.indexOf(element), 1);
      }, 1750);
    };

    element.classList.add("spawning");

    els.push(element);

    mainMenu.appendChild(element);
    
    console.log(`Processed new element data for scene ${set}: ${type} element with contents "${text.length > 40 ? (text.slice(0, 40) + '...') : text}", mode: ${disabled ? 'disabled' : 'enabled'}`);
  };
};

async function loadSet(set) {
  console.log(`Loading set ${set}`);
  mainElements.filter(x => x.set === set).forEach((x, i) => setTimeout(() => loadButton(x), i * 100));
  return new Promise((res, rej) => setTimeout(res, mainElements.filter(x => x.set === set).length * 100 + 1250));
};

async function unloadSet(set) {
  console.log(`Unloading set ${set}`);
  els.filter(x => x.set === set).forEach((x, i) => setTimeout(() => x.destroy(), i * 100));
  return new Promise((res, rej) => setTimeout(res, els.filter(x => x.set === set).length * 100 + 1250));
};

function createBackButton(from, to) {
  return {
    text: "Go back",
    action: async function returnToMainMenu() {
      await unloadSet(from);
      loadSet(to);
    },
    type: "button",
    set: from
  };
};

var mainElements = [
  // main menu
  {
    text: 'Main menu',
    type: 'h3',
    set: 'mainMenu'
  },
  {
    text: "Play",
    action: async function play() {
      await unloadSet('mainMenu');
      loadSet('songList');
    },
    type: "button",
    set: "mainMenu"
  },
  {
    text: "Config",
    action: async function settings() {
      await unloadSet('mainMenu');
      loadSet('config');
    },
    type: "button",
    set: "mainMenu"
  },
  {
    text: "About",
    action: async function about() {
      await unloadSet('mainMenu');
      loadSet('info');
    },
    type: "button",
    set: "mainMenu"
  },
  
  // config menu
  {
    text: 'Configuration',
    type: 'h3',
    set: 'config'
  },
  {
    text: 'Sorry, there aren\'t many options here yet :(\n\nTip: Note screen time sets how long notes are on screen for\nif you set it to 2000, notes will be visible for 2 seconds',
    type: 'h4',
    set: 'config'
  },
  {
    text: '',
    type: 'h3',
    set: 'config'
  },
  {
    text: "Set note screen time",
    action: async function setScreenTime() {
      let value = parseFloat(prompt(`Input the desired note screen time here!`));
      if(isNaN(value) || !isFinite(value) || value < 0) return;
      chartMGR.request('screentime', {
        value
      });
    },
    type: "button",
    set: "config"
  },
  {
    text: "Keybind manager",
    action: async function kbManager() {
      alert(`This feature is currently not fully finished, editing is not possible at the moment.\n\nKeybind layouts (in order left, down, up, right):\n${game.keybinds.map(c => c.join(' | ')).join('\n')}`);
    },
    type: "button",
    set: "config"
  },
  {
    text: "Downscroll/upscroll",
    action: async function flipScrollState() {
      return alert("No.");
      if(scrollState === 'up') scrollState = 'down';
      else scrollState = 'up';
      
      alert("Scroll mode: " + scrollState + "scroll\n\nDon't know what this means?\nUpscroll: notes will go from the bottom of the screen to the top (Games like FNF use this)\nDownscroll: notes will go from the top of the screen to the bottom (Games like osu (mania gamemode) will use this by default)\n\nIf you want to practice the mode you dont use, you should set note screen time to a lower value");
    },
    type: "button",
    set: "config"
  },
  createBackButton('config', 'mainMenu'),
  
  // about
  {
    text: 'About',
    type: 'h3',
    set: 'info'
  },
  {
    text: 'Version: 1.0 Beta',
    type: 'h4',
    set: 'info'
  },
  {
    text: 'Game engine: custom',
    type: 'h4',
    set: 'info'
  },
  {
    text: 'Render system:\nMenu: HTML/CSS\nIn game: HTML/CSS (for text etc), JS Canvases (rendering arrows and player sprites)',
    type: 'h4',
    set: 'info'
  },
  // begin stupidity
  {
    text: '',
    type: 'h4',
    set: 'info'
  },
  {
    text: '',
    type: 'h4',
    set: 'info'
  },
  // end stupidity
  {
    type: 'hr',
    set: 'info',
    custom: {
      size: '1',
      width: '50%',
      color: 'white'
    }
  },
  {
    type: 'br',
    set: 'info'
  },
  {
    text: 'Planned features',
    type: 'h3',
    set: 'info'
  },
  {
    text: 'Pause menu, game settings menu, better menu handler code (unlikely to be added), proper touchscreen support in-game, hold notes\nLevel creator (unlikely to be added), better HTML element handling, better debug menu',
    type: 'h4',
    set: 'info'
  },
  {
    type: 'br',
    set: 'info'
  },
  createBackButton('info', 'mainMenu'),
  
  {
    text: 'Song selector',
    type: 'h3',
    set: 'songList'
  },
  
  createBackButton('songList', 'mainMenu')
];

loadSet('mainMenu');

// make canvas be not stupid
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var backgroundCanvas = document.getElementById('background');
var bctx = backgroundCanvas.getContext('2d');

function adjust() {
  canvas.width = window.innerWidth * 2;
  canvas.height = window.innerHeight * 2;
  backgroundCanvas.width = window.innerWidth * 2;
  backgroundCanvas.height = window.innerHeight * 2;
  console.log(`Resized canvases for resolution ${window.innerWidth * 2}x${window.innerHeight * 2}`)
};

(window.onresize = adjust)();

// ty https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

// game data
const game = {
  arrows: [
    {
      direction: 'left',
      assetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/left.png',
      glowAssetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/left_glow.png'
    },
    {
      direction: 'down',
      assetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/down.png',
      glowAssetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/down_glow.png'
    },
    {
      direction: 'up',
      assetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/up.png',
      glowAssetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/up_glow.png'
    },
    {
      direction: 'right',
      assetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/right.png',
      glowAssetURL: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/right_glow.png'
    }
  ],
  trail: new Image('https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/trail.png'),
  arrowPositioning: {
    centre: 50,
    spacing: 17,
    yLevel: 2,
    
    width: 10,
    height: 10 / 3 * 4,
    
    size: 0.8
  },
  keybinds: [
    [
      'w',
      'a',
      's',
      'd',
    ],
    [
      'ArrowLeft',
      'ArrowDown',
      'ArrowUp',
      'ArrowRight'
    ],
    [
      'f',
      'g',
      'h',
      'j'
    ],
    [
      'z',
      'x',
      ',',
      '.'
    ]
  ],
  playing: false,
  songs: [
    {
      name: "Friday Night Cursed (Vs. Herobrine)",
      color: "cyan",
      songs: [
        {
          name: "Danger",
          voice: "https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/dangerVoices.mp3",
          BGM: "https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/dangerInst.mp3",
          chart: "/danger-hard.json"
        },
        {
          name: "Recreated"
        }
      ]
    },
    {
      name: "Vs. Camellia (week 2 update)",
      color: "pink",
      songs: [
        {
          name: "Ghost"
        },
        {
          name: "Ghost (VIP)",
          voice: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/ghostVoices.mp3',
          BGM: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/ghostInst.mp3',
          chart: '/ghost-vip-hard.json'
        },
        {
          name: "Lioness\' Pride"
        },
        {
          name: "Liquated"
        },
        {
          name: "Nacreous Snowmelt"
        },
        {
          name: "Quaoar",
          voice: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/Voices.mp3',
          BGM: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/Inst.mp3',
          chart: '/quaoar-hard.json'
        },
        {
          name: "Why do you hate me?"
        }
      ]
    },
    {
      name: "Vs. Tricky",
      color: "red",
      songs: [
        {
          name: "Improbable outset"
        },
        {
          name: "Madness"
        },
        {
          name: "Hellclown"
        },
        {
          name: "Expurgation (no death notes)",
          voice: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/expurgationVoices.mp3',
          BGM: 'https://cdn.glitch.global/fcf54e56-5018-4d5c-93ef-f65c05ef0656/expurgationInst.mp3',
          chart: '/expurgation-hard.json'
        }
      ]
    }
  ],
  ratings: [
    {
      name: 'sick', window: 40, points: 350, accuracy: 100,
      image: 'data:image/png;base64,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'
    },
    {
      name: 'good', window: 80, points: 200, accuracy: 90,
      image: 'data:image/png;base64,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'
    },
    { 
      name: 'ok', window: 120, points: 100, accuracy: 75,
      image: 'data:image/png;base64,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'
    },
    {
      name: 'bad', window: 180, points: 50, accuracy: 60,
      image: 'data:image/png;base64,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'
    }
  ]
};

// quickly add all the song buttons in for when they're needed
game.songs.forEach(x => {
  let parentName = x.name;
  
  mainElements.push(createBackButton('song-' + x.name, 'songList'));
  
  x.songs.forEach(y => {
    let usable = true;
    if(!y.BGM) usable = false;
    if(!y.chart) usable = false;
    
    mainElements.push({
      text: y.name,
      action: async function() {
        await unloadSet('song-' + parentName);
        mainMenu.classList.add('menuDespawn');
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        setTimeout(() => {
          document.body.removeChild(mainMenu);
          document.getElementById('loadingScreen').hidden = false;
          console.log("Enabled loading tip");
          let msg = document.getElementById('loadingMessage');
          msg.innerText = 'Loading files [0/3]\nSkipping audio download';
          let inst = new Audio();
          setTimeout(() => {
            console.log("Downloaded instrumental");
            msg.innerText = 'Loading files [1/3]\nSkipping audio download';
            let voices = new Audio();
            setTimeout(async () => {
              console.log("Downloaded voices");
              msg.innerText = 'Loading files [2/3]\nFetching chart\nChart location: ' + y.chart;
              await chartMGR.load(y.chart);
              msg.innerText = 'Loaded files [3/3] (Audio downloads skipped)\nTap on this message to begin!\n\nWarning: audio desyncs are VERY common\nBlame safari, not me';

              msg.onclick = async () => {
                msg.onclick = null;
                document.getElementById('loadingScreen').hidden = true;
                inst.play();
                voices.play();
                game.playing = true;

                await chartMGR.request('begin');    
                document.getElementById('stats').hidden = false;
                
                setTimeout(songEnd, (await chartMGR.request('length')).length);
              };
            }, 1000);
            //voices.src = y.voice;
          }, 1000);
          //inst.src = y.BGM;
        }, 950);
      },
      set: 'song-' + parentName,
      type: 'button',
      disabled: !usable
    });
  });
  
  mainElements.push({
    text: x.name,
    action: async function() {
      await unloadSet('songList');
      await loadSet('song-' + x.name);
    },
    set: "songList",
    type: 'button',
    disabled: false,
    custom: {
      style: 'background: linear-gradient(90deg, ' + x.color + ' 2%, rgba(35,36,38,1) 2%, rgba(35,36,38,1) 98%, ' + x.color + ' 98%)'
    }
  });
  
  console.log(`Processed song set "${x.name}"`);
});

// more game data aaaaaaAAAAAAAA
game.arrows = game.arrows.map(x => {
  
  x.state = 0;
  x.ready = false;
  x.img = new Image();
  x.glowImg = new Image();
  
  x.img.onload = () => {
    x.width = x.img.width;
    x.height = x.img.height;
    x.state += 0.5;
    if(x.state === 1) x.ready = true;
  };
  
  x.glowImg.onload = () => {
    x.state += 0.5;
    if(x.state === 1) x.ready = true;
  };
  
  x.img.src = x.assetURL;
  x.glowImg.src = x.glowAssetURL;
  
  return x;
  
});

// input handler
var sevenCounter = 0;

var heldKeys = {
  
};

var queuedPresses = [];

window.onkeydown = function(data) {
  // ArrowLeft, ArrowUp, ArrowDown, ArrowRight etc
  // 1 2 3 4 5 d f j k l [ ] Enter
  let key = data.key;
  if(key === '7') sevenCounter++;
  
  if(!debugActive && 4 < sevenCounter) {
    debugActive = true;
    loadButton({
      text: '\nDeveloper mode is now active',
      type: 'h4',
      set: 'mainMenu'
    });
    document.getElementById('console').hidden = false;
  };
  
  game.keybinds.forEach(set => {
    let idx = set.indexOf(key);
    if(idx !== -1) {
      heldKeys[idx] = true;
      queuedPresses.push(idx);
    };
  });
  
  console.log(`Key press registered: ${key}`);
};

window.onkeyup = function(data) {
  let key = data.key;
  
  game.keybinds.forEach(set => {
    let idx = set.indexOf(key);
    if(idx !== -1) {
      heldKeys[idx] = false;
    };
  });
  
  console.log(`Key release registered: ${key}`);
};

// worker
var chartWorker = new Worker('/chartWorker.js');

// chart api
var chartMGR = {
  request: function(type, data = {}) {
    return new Promise((res, rej) => {
      let asyncRequestID = Math.floor(Math.random() * 36 ** 10).toString(36).padStart(10, '0');
      let listener = function(e) {
        if(e.data.asyncRequestID === asyncRequestID) {
          if(e.data.error) rej(e.data.error);
          else res(e.data);
          chartWorker.removeEventListener('message', listener);
        }
      };

      chartWorker.addEventListener('message', listener);
      chartWorker.postMessage({
        ...data,
        type,
        asyncRequestID
      })
    });
  },
  
  load: async function(url) {
    await chartMGR.request('chart', { url });
  },
  
  read: function() {
    return chartMGR.request('get');
  }
};

// setInterval(() => chartWorker.postMessage('hi'), 10);

// drawing, note handling
// Accuracy: 100% | Combo breaks: 0 | Score: 0 | BOTPLAY

var stats = {
  accuracy: 100,
  misses: 0,
  score: 0,
  hits: 0,
  ratings: {}
};

game.ratings.forEach(x => stats.ratings[x.name] = 0);

function getClearType() {
  if(stats.misses === 0) return "FC";
  if(stats.misses < 10) return "SDCB";
  return "Clear";
};

function getClearTypeAccuracyName() {
  if(stats.accuracy === 100) return "P";
  if(stats.accuracy > 99) return "M";
  if(stats.ratings.good === 0) return "G";
  return "";
};

function getRank() {
  if(stats.accuracy === 100) return "SS";
  if(stats.accuracy >= 95) return "S";
  if(stats.accuracy >= 90) return "A";
  if(stats.accuracy >= 80) return "B";
  if(stats.accuracy >= 70) return "C";
  if(stats.accuracy >= 60) return "D";
  if(stats.accuracy >= 55) return "E";
  if(stats.accuracy >= 50) return "F";
  if(stats.accuracy >= 1) return "Just stop...";
  return "Bruh";
};

function updateStats() {
  document.getElementById('stats').innerText =
    'Accuracy: ' + stats.accuracy.toFixed(2) + '% | ' +
    'Combo breaks: ' + stats.misses + ' | ' +
    getClearTypeAccuracyName() + getClearType() + ' (' + stats.hits + ') Combo | ' +
    getRank();
};

function parseStats() {
  stats.accuracy = [];
  
  game.ratings.forEach(c => {
    let amount = stats.ratings[c.name];
    for(let i = 0; i < amount; i++) stats.accuracy.push(c.accuracy);
  });
  for(let i = 0; i < stats.misses; i++) stats.accuracy.push(0);
  let sum = 0;
  for(let i in stats.accuracy) sum += stats.accuracy[i];
  stats.accuracy = sum / stats.accuracy.length;
  
  updateStats();
};

setInterval(() => {
  console.log(JSON.stringify(stats.ratings));
}, 4000);

function giveRating(rating) {
  let img = document.createElement('img');
  img.setAttribute('class', 'noteInfoCool');
  
  document.body.appendChild(img);
  setTimeout(() => {
    document.body.removeChild(img);
  }, 950);
  
  img.src = game.ratings.filter(x => x.name === rating)[0].image;
  
  stats.hits++;
  stats.ratings[rating]++;
  
  parseStats();
};

function songEnd() {
  document.getElementById('winScreen').setAttribute('class', 'fadeIn');
  document.getElementById('endStats').innerText = `Rank: ${getRank()}\nAccuracy: ${stats.accuracy.toFixed(2)}%\nRating: ${getClearTypeAccuracyName() + getClearType()}\nCombo: ${stats.hits}\nMisses: ${stats.misses}`;
};

var passedNotes = [];

async function render(notes) {
  if(!game.playing) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  game.arrows.forEach((e, idx) => {
    let x = game.arrowPositioning.centre + map(
      idx,
      
      0,
      game.arrows.length,
      
      -game.arrowPositioning.spacing,
      game.arrowPositioning.spacing
    );
    
    let y = game.arrowPositioning.yLevel;
    
    let startX = x;
    let startY = y;
    
    let width = game.arrowPositioning.width * game.arrowPositioning.size;
    let height = game.arrowPositioning.height * game.arrowPositioning.size;

    ctx.drawImage(
      heldKeys[idx] ? e.glowImg : e.img,
      
      0, 
      0, 
      e.width, 
      e.height, 
      
      startX / 100 * canvas.width, 
      (scrollState === 'up' ? startY : 100 - startY) / 100 * canvas.height, 
      
      width / 100 * canvas.width, 
      height / 100 * canvas.height
    );
  });
  
  notes.forEach(data => {
    if(!data.playing) return;
    if(passedNotes.includes(data.noteid)) return;
    let e = game.arrows[data.arrow % game.arrows.length];
    
    let x = game.arrowPositioning.centre + map(
      data.arrow,
      
      0,
      game.arrows.length,
      
      -game.arrowPositioning.spacing,
      game.arrowPositioning.spacing
    );

    let y = map(data.scroll, 1, 0, 100, game.arrowPositioning.yLevel);

    if(y <= -10 && !passedNotes.includes(data.noteid)) {
      passedNotes.push(data.noteid);
      stats.hits = 0;
      stats.misses++;
      parseStats();
    };
    
    let startX = x;
    let startY = y;
    
    let width = game.arrowPositioning.width * game.arrowPositioning.size;
    let height = game.arrowPositioning.height * game.arrowPositioning.size;
    
    ctx.drawImage(
      e.img,
      
      0, 
      0, 
      e.width, 
      e.height, 
      
      startX / 100 * canvas.width, 
      (scrollState === 'up' ? startY : 100 - startY) / 100 * canvas.height, 
      
      width / 100 * canvas.width, 
      height / 100 * canvas.height
    );
    
    for(let i = 0; i < data.holdScroll; i++) {
      let hy = map(i, 1, 0, 100, game.arrowPositioning.yLevel);
      
      ctx.drawImage(
        game.trail,

        0, 
        0, 
        e.width, 
        e.height, 

        startX / 100 * canvas.width, 
        (scrollState === 'up' ? startY : 100 - startY) / 100 * canvas.height, 

        width / 100 * canvas.width, 
        height / 100 * canvas.height
      );
    };
    
    // ctx.fillText(JSON.stringify(data), startX / 100 * canvas.width, startY / 100 * canvas.height);
  });
};

// particles
var particleCounter = 0;
var particlesArray = [];

function spawnParticle(initial) {
  let i = {
    id: particleCounter++,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20,
    opacity: Math.random() * 255,
    dirX: Math.random() - 0.5,
    dirY: Math.random() - 0.5
  };
  
  // stick to a side, so they spawn offscreen
  if(initial) i.x = Math.round(i.x / 100) * 105;
  if(initial) i.y = Math.round(i.y / 100) * 105;
  
  console.log(`Spawned new particle`, i);
  return i;
};

function particles() {
  bctx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  
  while(particlesArray.length < 50) particlesArray.push(spawnParticle());
  particlesArray.forEach(x => {
    x.dirX += (Math.random() - 0.5) / 10;
    x.dirY += (Math.random() - 0.5) / 10;
    x.dirX = Math.min(1, Math.max(-1, x.dirX));
    x.dirY = Math.min(1, Math.max(-1, x.dirY));
    
    x.x += x.dirX / 30;
    x.y += x.dirY / 30;
    
    if(x.x < -1) x.x = 101;
    if(x.y < -1) x.y = 101;
    if(101 < x.x) x.x = -1;
    if(101 < x.y) x.y = -1;
    
    bctx.beginPath();
    bctx.arc(x.x / 100 * canvas.width, x.y / 100 * canvas.height, x.size, 0, 2 * Math.PI, false);
    bctx.fillStyle = bctx.strokeStyle = '#ffffff' + Math.floor(x.opacity).toString(16).padStart(2, '0');
    bctx.fill();
    bctx.lineWidth = 5;
    bctx.stroke();
  });
};

// fruitloop
const loop = async () => {
  let { notes } = await chartMGR.read();
  
  while(queuedPresses.length) {
    let selected = queuedPresses.shift();
    let closestAcceptableNote = notes.filter(note => note.arrow === selected && note.playing && !passedNotes.includes(note.noteid))[0];
    if(!closestAcceptableNote) continue;
    
    let acceptableRange = game.ratings.filter(range => (range.window * 1.5) >= closestAcceptableNote.offset)[0];
    if(!acceptableRange) continue;
    
    console.log(closestAcceptableNote, acceptableRange);
    
    giveRating(acceptableRange.name);
    passedNotes.push(closestAcceptableNote.noteid);
  };
  
  await render(notes);
  if(!game.playing) particles();
  requestAnimationFrame(loop);
};

loop();
