
const size = 5;
let map = [];
let playerPos = { x: 0, y: 0 };


let player = {
  hp: 100,
  intelligence: 0,
  strength: 0,
  luck: 0,
  coins: 0,
  inventory: []
};


let questions = {
  easy: [],
  medium: [],
  hard: []
};

// LOAD QUESTIONS
async function loadQuestions() {
  questions.easy = await fetch("data/easy.json").then(r => r.json());
  questions.medium = await fetch("data/medium.json").then(r => r.json());
  questions.hard = await fetch("data/hard.json").then(r => r.json());
}

// INIT MAP
function createMap() {
 
for (let y = 0; y < size; y++) {
  let row = [];
  for (let x = 0; x < size; x++) {

    let type = Math.random() < 0.5 ? "question" : "fight";

    // Bottom-right tile = win tile
    if (x === size - 1 && y === size - 1) {
      type = "goal";
    }

    row.push({ type });
  }
  map.push(row);
}


// DRAW MAP
function drawMap() {
  const mapDiv = document.getElementById("map");
  mapDiv.innerHTML = "";

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let tile = document.createElement("div");
      tile.className = "tile";

      if (x === playerPos.x && y === playerPos.y) {
        tile.classList.add("player");
      }

      tile.onclick = () => move(x, y);
      mapDiv.appendChild(tile);
    }
  }
}

// MOVE PLAYER
function move(x, y) {
  if (Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) !== 1) return;

  playerPos = { x, y };
  drawMap();

  handleNode(map[y][x]);
}

// HANDLE NODE

function handleNode(node) {
  if (node.type === "question") {
    questionEvent();
  } else if (node.type === "fight") {
    fightEvent();
  } else if (node.type === "goal") {
    goalEvent();
  }
}


// GET DIFFICULTY
function getDifficulty() {
  if (player.intelligence < 5) return "easy";
  if (player.intelligence < 10) return "medium";
  return "hard";
}

// QUESTION EVENT
function questionEvent() {
  const difficulty = getDifficulty();
  const pool = questions[difficulty];
  const q = pool[Math.floor(Math.random() * pool.length)];

  const eventDiv = document.getElementById("event");

  eventDiv.innerHTML = `<h3>${q.question}</h3>`;

  q.options.forEach(option => {
    let btn = document.createElement("button");
    btn.textContent = option;

    btn.onclick = () => {
      if (option === q.answer) {
        correctAnswer();
      } else {
        wrongAnswer();
      }
    };

    eventDiv.appendChild(btn);
  });
}

// CORRECT ANSWER

function correctAnswer() {
  const difficulty = getDifficulty();

  let coinReward = 2;
  if (difficulty === "medium") coinReward = 4;
  if (difficulty === "hard") coinReward = 6;

  player.coins += coinReward;

  let choice = Math.random() < 0.5;

  if (choice) {
    player.intelligence++;
    showMessage(`Correct! +1 Intelligence, +${coinReward} coins`);
  } else {
    showStatChoice(coinReward);
  }

  updateStats();
}


// STAT CHOICE

function showStatChoice(coins) {
  const eventDiv = document.getElementById("event");
  eventDiv.innerHTML = `<h3>Choose a stat (+${coins} coins awarded):</h3>`;

  player.coins += coins;

  ["intelligence", "strength", "luck"].forEach(stat => {
    let btn = document.createElement("button");
    btn.textContent = stat;

    btn.onclick = () => {
      player[stat]++;
      showMessage(`+1 ${stat}`);
      updateStats();
    };

    eventDiv.appendChild(btn);
  });
}

// WRONG ANSWER
function wrongAnswer() {
  player.hp -= 10;
  showMessage("Wrong! -10 HP");
  updateStats();
}

// FIGHT EVENT
function fightEvent() {
  const eventDiv = document.getElementById("event");

  let isStreak = Math.random() < 0.5;

  if (isStreak) {
    startStreakChallenge();
  } else {
    startDiceFight();
  }
}


//GOAL EVENT

function goalEvent() {
  if (player.coins >= 100) {
    showMessage("🎉 You win! You reached the goal with enough coins!");
  } else {
    showMessage(`You need 100 coins to win. Current: ${player.coins}`);
  }
}

// DICE FIGHT
function startDiceFight() {
  let roll = Math.floor(Math.random() * 6) + 1;
  let total = roll + player.strength;
  let difficulty = 6;

  if (total > difficulty) {
    winFight();
  } else {
    loseFight();
  }
}

// STREAK MODE
function startStreakChallenge() {
  let count = 0;

  function ask() {
    if (count === 3) {
      winFight();
      return;
    }

    const q = questions.easy[Math.floor(Math.random() * questions.easy.length)];
    const eventDiv = document.getElementById("event");

    eventDiv.innerHTML = `<h3>${q.question}</h3>`;

    q.options.forEach(opt => {
      let btn = document.createElement("button");
      btn.textContent = opt;

      btn.onclick = () => {
        if (opt === q.answer) {
          count++;
          ask();
        } else {
          loseFight();
        }
      };

      eventDiv.appendChild(btn);
    });
  }

  ask();
}

// WIN

function winFight() {
  let stat = ["intelligence", "strength", "luck"][Math.floor(Math.random() * 3)];
  player[stat]++;

  let coinReward = 5 + Math.floor(Math.random() * 6); // 5–10 coins
  player.coins += coinReward;

  let rewardItem = Math.random() * 100 < (10 + player.luck * 2);

  if (rewardItem) {
    const item = Math.random() < 0.5 ? "50/50 Potion" : "Health Potion";
    player.inventory.push(item);
  }

  showMessage(`Win! +1 ${stat}, +${coinReward} coins`);
  updateStats();
}


// LOSE
function loseFight() {
  player.hp -= 15;
  showMessage("Lost fight! -15 HP");
  updateStats();
}

// UI HELPERS
function showMessage(msg) {
  document.getElementById("event").innerHTML = `<h3>${msg}</h3>`;
}


function updateStats() {
  document.getElementById("stats").innerHTML =
    `HP: ${player.hp} | INT: ${player.intelligence} | STR: ${player.strength} | LUCK: ${player.luck} | COINS: ${player.coins}
    <br>Inventory: ${player.inventory.join(", ") || "Empty"}`;

  if (player.hp <= 0) {
    alert("Game Over!");
    location.reload();
  }

  checkWin();
}


// START GAME
async function start() {
  await loadQuestions();
  createMap();
  drawMap();
  updateStats();
}

start();
