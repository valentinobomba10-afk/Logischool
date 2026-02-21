// Constants
const CELL_SIZE = 20; // Size of each cell in the maze
const ROWS = 31; // Number of rows in the maze
const COLS = 28; // Number of columns in the maze
const PACMAN_RADIUS = 10; // Radius of Pac-Man
const GHOST_RADIUS = 10; // Radius of ghosts
const PELLET_RADIUS = 3; // Radius of regular pellets
const POWER_PELLET_RADIUS = 6; // Radius of power pellets
const PACMAN_SPEED = 3; // Pac-Man's movement speed
const GHOST_SPEED = 2; // Ghost's movement speed
const FRIGHTENED_GHOST_SPEED = 1.5; // Ghost speed when frightened
const FRIGHTENED_MODE_DURATION = 8000; // Duration of frightened mode in milliseconds
const GAME_FPS = 60; // Frames per second
const FRAME_DURATION = 1000 / GAME_FPS; // Duration of each frame in milliseconds

// Game state variables
let canvas, ctx;
let gameInterval;
let pacman, ghosts = [];
let pellets = [], powerPellets = [];
let maze = [];
let score = 0;
let lives = 3;
let gameState = 'idle'; // 'idle', 'playing', 'paused', 'gameOver', 'victory'
let lastDirectionPressed = null;
let soundEnabled = true;
let keyboardEnabled = true; // Flag to enable/disable keyboard temporarily
let ghostModeSwitchTime = 0; // Timer for switching between scatter and chase modes
const SCATTER_TIME = 7000; // Time in scatter mode (7 seconds)
const CHASE_TIME = 20000; // Time in chase mode (20 seconds)
let pacmanSkinColor = '#ffd84d';

const LS_STORAGE = {
  users: 'ls_users',
  current: 'ls_currentUser'
};

const LS_PACMAN_SKINS = {
  classic: '#ffd84d',
  neon: '#6dd5ff',
  solar: '#ffb347',
  phantom: '#b48cff'
};

function getLSUser() {
  try {
    const currentId = JSON.parse(localStorage.getItem(LS_STORAGE.current) || 'null');
    if (!currentId) return null;
    const users = JSON.parse(localStorage.getItem(LS_STORAGE.users) || '[]');
    const index = users.findIndex((user) => user.id === currentId);
    if (index === -1) return null;
    const user = users[index];
    let updated = false;
    if (!user.cosmetics || typeof user.cosmetics !== 'object') {
      user.cosmetics = {
        avatarUrl: '',
        presetAvatar: '',
        pacmanSkin: 'classic',
        pacmanTrail: 'none'
      };
      updated = true;
    } else {
      if (!user.cosmetics.pacmanSkin) {
        user.cosmetics.pacmanSkin = 'classic';
        updated = true;
      }
      if (!user.cosmetics.pacmanTrail) {
        user.cosmetics.pacmanTrail = 'none';
        updated = true;
      }
      if (user.cosmetics.avatarUrl === undefined) {
        user.cosmetics.avatarUrl = '';
        updated = true;
      }
      if (user.cosmetics.presetAvatar === undefined) {
        user.cosmetics.presetAvatar = '';
        updated = true;
      }
    }
    if (updated) {
      users[index] = user;
      localStorage.setItem(LS_STORAGE.users, JSON.stringify(users));
    }
    return user;
  } catch (err) {
    return null;
  }
}

function updateLSScore(finalScore) {
  try {
    const currentId = JSON.parse(localStorage.getItem(LS_STORAGE.current) || 'null');
    if (!currentId) return;
    const users = JSON.parse(localStorage.getItem(LS_STORAGE.users) || '[]');
    const index = users.findIndex((user) => user.id === currentId);
    if (index === -1) return;
    const user = users[index];
    if (!user.stats) user.stats = { bestScores: {}, gamesPlayed: [] };
    if (!user.stats.bestScores) user.stats.bestScores = {};
    if (!user.stats.gamesPlayed) user.stats.gamesPlayed = [];
    const entry = user.stats.bestScores.pacman;
    const isBetter = !entry || finalScore > entry.score;
    if (isBetter) {
      user.stats.bestScores.pacman = {
        score: finalScore,
        mode: 'high',
        updatedAt: new Date().toISOString()
      };
    }
    if (!user.stats.gamesPlayed.includes('pacman')) {
      user.stats.gamesPlayed.push('pacman');
    }
    users[index] = user;
    localStorage.setItem(LS_STORAGE.users, JSON.stringify(users));
  } catch (err) {
    // Ignore localStorage errors
  }
}

function loadLSCosmetics() {
  const user = getLSUser();
  pacmanSkinColor = LS_PACMAN_SKINS.classic;
}

// Directions
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// Audio elements
const sounds = {
  start: null,
  chomp: null,
  powerPellet: null,
  ghostEaten: null,
  death: null,
  victory: null
};

// Game objects
const pacmanObject = {
  x: 0,
  y: 0,
  direction: DIRECTIONS.RIGHT,
  nextDirection: DIRECTIONS.RIGHT,
  radius: PACMAN_RADIUS,
  speed: PACMAN_SPEED,
  mouthAngle: 0.2, // Initial mouth opening
  mouthDir: 1, // Direction of mouth animation (1: opening, -1: closing)
  isDead: false,
  deathAnimationTime: 0
};

// Safe position check - returns true if coordinates are within maze bounds
function isSafePosition(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

// Safe maze accessor - returns the value at maze[y][x] or 1 (wall) if out of bounds
function getMazeValue(x, y) {
  if (!isSafePosition(x, y)) {
    return 1; // Treat out of bounds as a wall
  }
  return maze[y][x];
}

class Ghost {
  constructor(x, y, color, name, strategy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.name = name;
    this.direction = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.speed = GHOST_SPEED;
    this.radius = GHOST_RADIUS;
    this.mode = 'scatter'; // 'scatter', 'chase', 'frightened'
    this.previousMode = 'scatter';
    this.frightenedTimeLeft = 0;
    this.isEaten = false;
    this.strategy = strategy;
    this.scatterTarget = { x: 0, y: 0 }; // Will be set differently for each ghost
    this.justChangedMode = false; // Flag for allowing direction reversal during mode changes
    // Animation variables
    this.animationFrame = 0;
    this.eyesDirection = DIRECTIONS.RIGHT;
  }

  update() {
    // Update frightened state
    if (this.mode === 'frightened') {
      this.frightenedTimeLeft -= FRAME_DURATION;
      if (this.frightenedTimeLeft <= 0) {
        this.mode = this.previousMode;
        this.speed = GHOST_SPEED;
      }
    }
    
    // Force position to be valid
    this.ensureValidPosition();
    
    // Move ghost
    if (!this.isInCellCenter()) {
      // Continue in current direction
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
      
      // Force position to be valid after movement
      this.ensureValidPosition();
    } else {
      // Ghost is in cell center, can change direction
      // Round to exact cell center
      this.x = Math.floor(this.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
      this.y = Math.floor(this.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
      
      // Get target based on mode
      let target = this.getTarget();

      // Choose next direction based on target
      const possibleDirections = this.getPossibleDirections();
      let bestDirection = null;
      let bestDistance = Infinity;

      for (const dir of possibleDirections) {
        const newX = this.x + dir.x * CELL_SIZE;
        const newY = this.y + dir.y * CELL_SIZE;
        const distance = Math.sqrt(Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2));
        
        // In frightened mode, we sometimes make suboptimal choices
        if (this.mode === 'frightened') {
          if (Math.random() < 0.3 || distance < bestDistance) {
            bestDistance = distance;
            bestDirection = dir;
          }
        } else if (distance < bestDistance) {
          bestDistance = distance;
          bestDirection = dir;
        }
      }

      if (bestDirection) {
        this.direction = bestDirection;
        this.eyesDirection = bestDirection;
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
      } else if (possibleDirections.length > 0) {
        // Fallback if no best direction found
        this.direction = possibleDirections[0];
        this.eyesDirection = possibleDirections[0];
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
      }
      
      // Force position to be valid after choosing new direction
      this.ensureValidPosition();
    }
    
    // Update animation frame
    this.animationFrame = (this.animationFrame + 1) % 30;
  }

  getTarget() {
    let target;
    
    if (this.mode === 'frightened') {
      // Random movement in frightened mode
      target = this.getRandomTarget();
    } else if (this.mode === 'scatter') {
      target = { ...this.scatterTarget };
    } else if (this.isEaten) {
      // Head to ghost house when eaten
      target = { x: 14 * CELL_SIZE, y: 14 * CELL_SIZE };
      if (Math.abs(this.x - target.x) < CELL_SIZE && Math.abs(this.y - target.y) < CELL_SIZE) {
        this.isEaten = false;
        this.mode = this.previousMode;
        this.speed = GHOST_SPEED;
      }
    } else {
      // Chase mode - use ghost's strategy to get target
      try {
        target = this.strategy(pacman, ghosts, this);
      } catch (error) {
        console.error('Error in ghost strategy:', error);
        // Fallback target - go to center
        target = { x: 14 * CELL_SIZE, y: 14 * CELL_SIZE };
      }
    }
    
    // Ensure target is within bounds
    target.x = Math.max(CELL_SIZE, Math.min(target.x, (COLS - 2) * CELL_SIZE));
    target.y = Math.max(CELL_SIZE, Math.min(target.y, (ROWS - 2) * CELL_SIZE));
    
    return target;
  }

  getRandomTarget() {
    // Make sure the random target is within the maze bounds (away from edges)
    const randomCol = Math.floor(Math.random() * (COLS - 4)) + 2; // Stay at least 2 cells from edge
    const randomRow = Math.floor(Math.random() * (ROWS - 4)) + 2; // Stay at least 2 cells from edge
    return { x: randomCol * CELL_SIZE, y: randomRow * CELL_SIZE };
  }

  ensureValidPosition() {
    // Handle tunnel wraparound
    if (this.x < 0) {
      this.x = (COLS - 1) * CELL_SIZE - CELL_SIZE / 2;
    } else if (this.x > (COLS - 1) * CELL_SIZE) {
      this.x = CELL_SIZE / 2;
    }
    
    if (this.y < 0) {
      this.y = (ROWS - 1) * CELL_SIZE - CELL_SIZE / 2;
    } else if (this.y > (ROWS - 1) * CELL_SIZE) {
      this.y = CELL_SIZE / 2;
    }
    
    // Ensure we're not outside the maze dimensions with an extra buffer
    this.x = Math.max(CELL_SIZE / 2, Math.min(this.x, (COLS - 1) * CELL_SIZE - CELL_SIZE / 2));
    this.y = Math.max(CELL_SIZE / 2, Math.min(this.y, (ROWS - 1) * CELL_SIZE - CELL_SIZE / 2));
  }
  
  isInCellCenter() {
    const cellX = Math.floor(this.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    const cellY = Math.floor(this.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    return Math.abs(this.x - cellX) < this.speed && Math.abs(this.y - cellY) < this.speed;
  }

  getPossibleDirections() {
    const directions = [];
    // Calculate cell coordinates from pixel position
    const cellX = Math.floor(this.x / CELL_SIZE);
    const cellY = Math.floor(this.y / CELL_SIZE);
    
    // Safety check
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
      console.error('Ghost position out of bounds:', this.x, this.y, 'Cell:', cellX, cellY);
      this.ensureValidPosition();
      return [this.direction]; // Return current direction to avoid errors
    }
    
    // Check all four directions using safe accessor
    if (isSafePosition(cellX, cellY - 1) && getMazeValue(cellX, cellY - 1) !== 1) {
      directions.push(DIRECTIONS.UP);
    }
    
    if (isSafePosition(cellX, cellY + 1) && getMazeValue(cellX, cellY + 1) !== 1) {
      directions.push(DIRECTIONS.DOWN);
    }
    
    if (isSafePosition(cellX - 1, cellY) && getMazeValue(cellX - 1, cellY) !== 1) {
      directions.push(DIRECTIONS.LEFT);
    }
    
    if (isSafePosition(cellX + 1, cellY) && getMazeValue(cellX + 1, cellY) !== 1) {
      directions.push(DIRECTIONS.RIGHT);
    }
    
    // If no valid directions found, return current direction
    if (directions.length === 0) {
      return [this.direction];
    }
    
    // Filter out the reverse of current direction (ghosts can't reverse)
    // EXCEPT during mode changes, where reversal is allowed
    if (!this.justChangedMode) {
      const filteredDirections = directions.filter(dir => 
        !(dir.x === -this.direction.x && dir.y === -this.direction.y)
      );
      
      // If no valid directions after filtering, return all directions
      return filteredDirections.length > 0 ? filteredDirections : directions;
    }
    
    this.justChangedMode = false; // Reset the flag
    return directions; // Allow all directions including reversal after mode change
  }

  frighten() {
    if (this.mode !== 'frightened') {
      this.previousMode = this.mode;
    }
    this.mode = 'frightened';
    this.frightenedTimeLeft = FRIGHTENED_MODE_DURATION;
    this.speed = FRIGHTENED_GHOST_SPEED;
    
    // Immediately reverse direction when frightened (as in original game)
    this.justChangedMode = true;
    this.direction = {
      x: -this.direction.x,
      y: -this.direction.y
    };
  }

  draw() {
    // Don't draw if eaten and reached ghost house
    if (this.isEaten && Math.abs(this.x - 14 * CELL_SIZE) < CELL_SIZE && Math.abs(this.y - 14 * CELL_SIZE) < CELL_SIZE) {
      return;
    }
    
    if (this.isEaten) {
      // Draw eyes only when eaten
      this.drawEyes();
      return;
    }

    ctx.save();
    ctx.beginPath();
    
    // Ghost body
    if (this.mode === 'frightened') {
      // Flash when frightened mode is ending
      if (this.frightenedTimeLeft < 2000 && Math.floor(this.frightenedTimeLeft / 200) % 2 === 0) {
        ctx.fillStyle = 'white';
      } else {
        ctx.fillStyle = 'blue';
      }
    } else {
      ctx.fillStyle = this.color;
    }

    // Draw semi-circle for the top
    ctx.arc(this.x, this.y, this.radius, Math.PI, 0, false);
    
    // Draw the bottom wave part (varies with animation)
    const waveOffset = (this.animationFrame < 15) ? 2 : 0;
    
    ctx.lineTo(this.x + this.radius, this.y + this.radius);
    ctx.lineTo(this.x + this.radius - 4, this.y + this.radius - waveOffset);
    ctx.lineTo(this.x + this.radius - 8, this.y + this.radius);
    ctx.lineTo(this.x + this.radius - 12, this.y + this.radius - waveOffset);
    ctx.lineTo(this.x + this.radius - 16, this.y + this.radius);
    ctx.lineTo(this.x - this.radius, this.y + this.radius);
    ctx.closePath();
    ctx.fill();
    
    // Draw eyes
    this.drawEyes();
    
    // If frightened, draw mouth
    if (this.mode === 'frightened') {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x - 3, this.y + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 3, this.y + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw mouth
      ctx.beginPath();
      ctx.moveTo(this.x - 5, this.y + 5);
      ctx.lineTo(this.x - 2, this.y + 7);
      ctx.lineTo(this.x + 2, this.y + 7);
      ctx.lineTo(this.x + 5, this.y + 5);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawEyes() {
    ctx.fillStyle = 'white';
    
    // Eye positions adjusted based on direction
    let leftEyeX = this.x - 3;
    let rightEyeX = this.x + 3;
    let eyesY = this.y - 2;
    
    // Draw eye whites
    ctx.beginPath();
    ctx.arc(leftEyeX, eyesY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyesY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pupils based on direction
    const pupilOffset = 1;
    let pupilX = 0;
    let pupilY = 0;
    
    if (this.eyesDirection === DIRECTIONS.LEFT) {
      pupilX = -pupilOffset;
    } else if (this.eyesDirection === DIRECTIONS.RIGHT) {
      pupilX = pupilOffset;
    } else if (this.eyesDirection === DIRECTIONS.UP) {
      pupilY = -pupilOffset;
    } else if (this.eyesDirection === DIRECTIONS.DOWN) {
      pupilY = pupilOffset;
    }
    
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilX, eyesY + pupilY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilX, eyesY + pupilY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialization function
function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Event listeners for controls
  setupEventListeners();
  
  // Load LogiSchool cosmetics if available
  loadLSCosmetics();

  // Load maze, pellets, and game objects
  setupMaze();
  resetGame();
  
  // Load sounds
  loadSounds();
  
  // Initial render
  updateScoreDisplay();
  updateLivesDisplay();
  showMessage('Press Start to Play!');
  render();
  
  console.log("Game initialized successfully");
}

function setupEventListeners() {
  // Remove any existing listeners to avoid duplicates
  document.removeEventListener('keydown', handleKeyDown);
  
  // Add keyboard controls
  document.addEventListener('keydown', handleKeyDown);
  console.log("Keyboard event listener attached");
  
  // Button controls
  document.getElementById('startButton').addEventListener('click', handleStartButton);
  document.getElementById('pauseButton').addEventListener('click', handlePauseButton);
}

function handleKeyDown(e) {
  // Skip if keyboard controls are disabled
  if (!keyboardEnabled) {
    return;
  }
  
  if (gameState === 'playing') {
    // Movement controls
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        lastDirectionPressed = DIRECTIONS.UP;
        console.log("UP key pressed");
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        lastDirectionPressed = DIRECTIONS.DOWN;
        console.log("DOWN key pressed");
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        lastDirectionPressed = DIRECTIONS.LEFT;
        console.log("LEFT key pressed");
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        lastDirectionPressed = DIRECTIONS.RIGHT;
        console.log("RIGHT key pressed");
        e.preventDefault();
        break;
      case 'p':
      case 'P':
        togglePause();
        break;
      case 'm':
      case 'M':
        toggleSound();
        break;
    }
  }
  
  // Space to start/restart
  if ((e.key === ' ' || e.key === 'Spacebar') && (gameState === 'idle' || gameState === 'gameOver' || gameState === 'victory')) {
    startGame();
    e.preventDefault();
  }
}

function handleStartButton() {
  if (gameState === 'idle' || gameState === 'gameOver' || gameState === 'victory') {
    startGame();
  } else if (gameState === 'paused') {
    resumeGame();
  }
}

function handlePauseButton() {
  togglePause();
}

function togglePause() {
  if (gameState === 'playing') {
    pauseGame();
  } else if (gameState === 'paused') {
    resumeGame();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  showMessage(soundEnabled ? 'Sound On' : 'Sound Off', 1000);
}

function loadSounds() {
  sounds.start = document.getElementById('startSound');
  sounds.chomp = document.getElementById('chompSound');
  sounds.powerPellet = document.getElementById('powerPelletSound');
  sounds.ghostEaten = document.getElementById('ghostEatenSound');
  sounds.death = document.getElementById('deathSound');
  sounds.victory = document.getElementById('victorySound');
}

function playSound(soundName) {
  if (soundEnabled && sounds[soundName]) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(error => {
      console.error('Error playing sound:', error);
    });
  }
}

function setupMaze() {
  // 0: empty path, 1: wall, 2: pellet, 3: power pellet, 4: ghost house
  maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 4, 4, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 3, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];
  
  // Initialize pellets and power pellets
  pellets = [];
  powerPellets = [];
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (maze[row][col] === 2) {
        pellets.push({
          x: col * CELL_SIZE + CELL_SIZE / 2,
          y: row * CELL_SIZE + CELL_SIZE / 2,
          radius: PELLET_RADIUS,
          isEaten: false
        });
      } else if (maze[row][col] === 3) {
        powerPellets.push({
          x: col * CELL_SIZE + CELL_SIZE / 2,
          y: row * CELL_SIZE + CELL_SIZE / 2,
          radius: POWER_PELLET_RADIUS,
          isEaten: false,
          pulseTime: 0
        });
      }
    }
  }
  
  console.log("Maze setup complete, pellets:", pellets.length, "power pellets:", powerPellets.length);
}

function resetGame() {
  // Reset Pac-Man
  pacman = { ...pacmanObject };
  pacman.x = 14 * CELL_SIZE + CELL_SIZE / 2;
  pacman.y = 23 * CELL_SIZE + CELL_SIZE / 2;
  pacman.isDead = false;
  
  // Reset ghost mode timer
  ghostModeSwitchTime = 0;
  
  // Create ghosts with improved strategies
  ghosts = [
    new Ghost(14 * CELL_SIZE + CELL_SIZE / 2, 11 * CELL_SIZE + CELL_SIZE / 2, 'red', 'Blinky', 
              (pacman) => {
                // Blinky directly targets Pac-Man's current position
                return { x: pacman.x, y: pacman.y };
              }),
    
    new Ghost(14 * CELL_SIZE + CELL_SIZE / 2, 14 * CELL_SIZE + CELL_SIZE / 2, 'pink', 'Pinky',
              (pacman) => {
                // Pinky targets 4 cells ahead of Pac-Man
                const target = { x: pacman.x, y: pacman.y };
                
                // Add offset based on Pac-Man's direction
                if (pacman.direction === DIRECTIONS.UP) {
                  target.x -= 4 * CELL_SIZE; // Special case: up has a -4,-4 offset
                  target.y -= 4 * CELL_SIZE;
                } else {
                  target.x += pacman.direction.x * 4 * CELL_SIZE;
                  target.y += pacman.direction.y * 4 * CELL_SIZE;
                }
                
                return target;
              }),
    
    new Ghost(12 * CELL_SIZE + CELL_SIZE / 2, 14 * CELL_SIZE + CELL_SIZE / 2, 'cyan', 'Inky',
              (pacman, ghosts) => {
                // Get Blinky's position
                const blinky = ghosts[0];
                
                // Get position 2 tiles ahead of Pac-Man
                const pivotPoint = { x: pacman.x, y: pacman.y };
                
                if (pacman.direction === DIRECTIONS.UP) {
                  pivotPoint.x -= 2 * CELL_SIZE; // Special case for up
                  pivotPoint.y -= 2 * CELL_SIZE;
                } else {
                  pivotPoint.x += pacman.direction.x * 2 * CELL_SIZE;
                  pivotPoint.y += pacman.direction.y * 2 * CELL_SIZE;
                }
                
                // Double the vector from Blinky to this pivot point
                const target = {
                  x: pivotPoint.x + (pivotPoint.x - blinky.x),
                  y: pivotPoint.y + (pivotPoint.y - blinky.y)
                };
                
                return target;
              }),
    
    new Ghost(16 * CELL_SIZE + CELL_SIZE / 2, 14 * CELL_SIZE + CELL_SIZE / 2, 'orange', 'Clyde',
              (pacman, ghosts, ghost) => {
                // Calculate distance to Pac-Man
                const dist = Math.sqrt(
                  Math.pow(pacman.x - ghost.x, 2) + 
                  Math.pow(pacman.y - ghost.y, 2)
                );
                
                // If Clyde is further than 8 tiles from Pac-Man, chase him
                // If closer than 8 tiles, go to scatter target
                if (dist > 8 * CELL_SIZE) {
                  return { x: pacman.x, y: pacman.y };
                } else {
                  return { x: 2 * CELL_SIZE, y: (ROWS - 3) * CELL_SIZE }; // Bottom-left corner
                }
              })
  ];
  
  // Set scatter targets for each ghost
  ghosts[0].scatterTarget = { x: (COLS - 3) * CELL_SIZE, y: 2 * CELL_SIZE }; // Top-right
  ghosts[1].scatterTarget = { x: 2 * CELL_SIZE, y: 2 * CELL_SIZE }; // Top-left
  ghosts[2].scatterTarget = { x: (COLS - 3) * CELL_SIZE, y: (ROWS - 3) * CELL_SIZE }; // Bottom-right
  ghosts[3].scatterTarget = { x: 2 * CELL_SIZE, y: (ROWS - 3) * CELL_SIZE }; // Bottom-left
  
  // Reset pellets and power pellets
  pellets.forEach(pellet => pellet.isEaten = false);
  powerPellets.forEach(pellet => pellet.isEaten = false);
  
  // Reset score and lives if starting a new game
  if (gameState === 'idle' || gameState === 'gameOver') {
    score = 0;
    lives = 3;
    updateScoreDisplay();
    updateLivesDisplay();
  }
  
  lastDirectionPressed = null;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update the button states
  document.getElementById('startButton').textContent = 'Start Game';
  document.getElementById('startButton').disabled = false;
  document.getElementById('pauseButton').disabled = true;
  
  console.log("Game reset complete");
}

// Debug function to verify initial setup
function debugInitialSetup() {
  // Log initial position and direction
  console.log("Initial Pac-Man position:", pacman.x, pacman.y);
  const cellX = Math.floor(pacman.x / CELL_SIZE);
  const cellY = Math.floor(pacman.y / CELL_SIZE);
  console.log("Initial cell:", cellX, cellY);
  
  // Check if Pac-Man can move in initial direction
  const nextCellX = cellX + pacman.direction.x;
  const nextCellY = cellY + pacman.direction.y;
  
  if (nextCellX >= 0 && nextCellX < COLS && 
      nextCellY >= 0 && nextCellY < ROWS) {
    console.log("Next cell:", nextCellX, nextCellY, 
               "is wall:", maze[nextCellY][nextCellX] === 1);
  } else {
    console.log("Initial direction leads out of bounds");
  }
  
  // Check surrounding cells
  console.log("Surrounding cells:");
  console.log("Up:", isSafePosition(cellX, cellY-1) ? maze[cellY-1][cellX] : "out of bounds");
  console.log("Down:", isSafePosition(cellX, cellY+1) ? maze[cellY+1][cellX] : "out of bounds");
  console.log("Left:", isSafePosition(cellX-1, cellY) ? maze[cellY][cellX-1] : "out of bounds");
  console.log("Right:", isSafePosition(cellX+1, cellY) ? maze[cellY][cellX+1] : "out of bounds");
}

function startGame() {
  console.log("startGame called, current state:", gameState);
  
  if (gameState === 'idle' || gameState === 'gameOver' || gameState === 'victory') {
    resetGame();
    gameState = 'playing';
    keyboardEnabled = true; // Ensure keyboard is enabled
    
    // Make sure Pac-Man can move initially
    pacman.direction = DIRECTIONS.RIGHT; // Force initial direction
    
    // Update buttons
    document.getElementById('startButton').textContent = 'Restart';
    document.getElementById('pauseButton').disabled = false;
    
    hideMessage();
    playSound('start');
    
    // Debug initial setup
    debugInitialSetup();
    
    // Clean up any existing interval
    if (gameInterval) {
      clearInterval(gameInterval);
      console.log("Cleared existing game interval");
    }
    
    // Start the game loop
    console.log("Starting game loop with frame duration:", FRAME_DURATION);
    gameInterval = setInterval(gameLoop, FRAME_DURATION);
    
    console.log("Game started, keyboard enabled, game state:", gameState);
  }
}

function pauseGame() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('pauseButton').textContent = 'Resume';
    showMessage('Paused');
    console.log("Game paused");
  }
}

function resumeGame() {
  if (gameState === 'paused') {
    gameState = 'playing';
    document.getElementById('pauseButton').textContent = 'Pause';
    hideMessage();
    console.log("Game resumed");
  }
}

function gameLoop() {
  if (gameState === 'playing') {
    update();
    render();
    
    // Check for game over or victory
    checkGameState();
  }
}

function update() {
  // Handle Pac-Man's movement
  updatePacman();
  
  // Update ghost mode timing
  updateGhostModes();
  
  // Update ghosts
  for (const ghost of ghosts) {
    ghost.update();
  }
  
  // Check collisions
  checkCollisions();
  
  // Update power pellet animation
  for (const pellet of powerPellets) {
    if (!pellet.isEaten) {
      pellet.pulseTime = (pellet.pulseTime + 1) % 60;
    }
  }

}

// Function to switch ghost modes between scatter and chase
function updateGhostModes() {
  if (gameState !== 'playing') return;
  
  ghostModeSwitchTime += FRAME_DURATION;
  
  // Calculate cycle time - alternate between scatter and chase
  const totalCycleTime = SCATTER_TIME + CHASE_TIME;
  const cycleTime = ghostModeSwitchTime % totalCycleTime;
  
  // Determine which mode ghosts should be in
  const shouldBeScatter = cycleTime < SCATTER_TIME;
  
  // Update each ghost's mode if not frightened or eaten
  for (const ghost of ghosts) {
    if (ghost.mode !== 'frightened' && !ghost.isEaten) {
      const newMode = shouldBeScatter ? 'scatter' : 'chase';
      
      // Only change mode if it's different
      if (ghost.mode !== newMode) {
        ghost.mode = newMode;
        
        // Flag that allows direction reversal
        ghost.justChangedMode = true;
        
        // Reverse direction when mode changes (as in the original game)
        ghost.direction = {
          x: -ghost.direction.x,
          y: -ghost.direction.y
        };
      }
    }
  }
}

// Fixed Pac-Man movement function to ensure continuous movement
function updatePacman() {
  if (pacman.isDead) {
    // Death animation
    pacman.deathAnimationTime += FRAME_DURATION / 1000;
    return;
  }
  
  // Mouth animation
  pacman.mouthAngle += 0.06 * pacman.mouthDir;
  if (pacman.mouthAngle >= 0.5) {
    pacman.mouthDir = -1;
  } else if (pacman.mouthAngle <= 0) {
    pacman.mouthDir = 1;
  }

  const prevX = pacman.x;
  const prevY = pacman.y;
  
  // Get current cell position
  const cellX = Math.floor(pacman.x / CELL_SIZE);
  const cellY = Math.floor(pacman.y / CELL_SIZE);
  const cellCenterX = cellX * CELL_SIZE + CELL_SIZE / 2;
  const cellCenterY = cellY * CELL_SIZE + CELL_SIZE / 2;
  
  // FIRST: Try to change direction if player requested it
  if (lastDirectionPressed) {
    // Calculate the cell in the requested direction
    const wantedNextCellX = cellX + lastDirectionPressed.x;
    const wantedNextCellY = cellY + lastDirectionPressed.y;
    
    // Check if that direction is valid (not a wall)
    const canTurn = (
      isSafePosition(wantedNextCellX, wantedNextCellY) &&
      getMazeValue(wantedNextCellX, wantedNextCellY) !== 1
    );
    
    // If we can turn and we're close enough to center, do the turn
    if (canTurn && 
        Math.abs(pacman.x - cellCenterX) < pacman.speed * 2 && 
        Math.abs(pacman.y - cellCenterY) < pacman.speed * 2) {
      
      // Center exactly on the cell for clean turns
      pacman.x = cellCenterX;
      pacman.y = cellCenterY;
      
      // Change direction
      pacman.direction = lastDirectionPressed;
      lastDirectionPressed = null; // Clear the requested direction after applying it
      console.log("Changed direction to:", Object.keys(DIRECTIONS).find(key => DIRECTIONS[key] === pacman.direction));
    }
  }
  
  // SECOND: Always try to move in the current direction
  const nextX = pacman.x + pacman.direction.x * pacman.speed;
  const nextY = pacman.y + pacman.direction.y * pacman.speed;

  // Use the leading edge to avoid clipping into walls
  const leadX = pacman.x + pacman.direction.x * (pacman.radius + pacman.speed);
  const leadY = pacman.y + pacman.direction.y * (pacman.radius + pacman.speed);
  
  // Calculate the next cell
  const nextCellX = Math.floor(nextX / CELL_SIZE);
  const nextCellY = Math.floor(nextY / CELL_SIZE);
  const leadCellX = Math.floor(leadX / CELL_SIZE);
  const leadCellY = Math.floor(leadY / CELL_SIZE);
  
  // Handle tunnel wraparound
  if (nextCellX < 0) {
    pacman.x = (COLS - 1) * CELL_SIZE + CELL_SIZE / 2;
  } else if (nextCellX >= COLS) {
    pacman.x = CELL_SIZE / 2;
  } else if (nextCellY < 0) {
    pacman.y = (ROWS - 1) * CELL_SIZE + CELL_SIZE / 2;
  } else if (nextCellY >= ROWS) {
    pacman.y = CELL_SIZE / 2;
  }
  // Normal movement if not hitting a wall
  else {
    // Check if next position would hit a wall
    const nextCell = (nextCellX >= 0 && nextCellX < COLS && 
                      nextCellY >= 0 && nextCellY < ROWS) ? 
                      maze[nextCellY][nextCellX] : 1;
    const leadCell = (leadCellX >= 0 && leadCellX < COLS && 
                      leadCellY >= 0 && leadCellY < ROWS) ? 
                      maze[leadCellY][leadCellX] : 1;
                      
    const hitWall = nextCell === 1 || leadCell === 1;
    
    // Special case for cell boundaries - check if we're crossing into a wall
    const isAtHorizontalBoundary = pacman.direction.x !== 0 && 
                                  Math.abs(nextX - cellCenterX) > CELL_SIZE / 2;
    const isAtVerticalBoundary = pacman.direction.y !== 0 && 
                                Math.abs(nextY - cellCenterY) > CELL_SIZE / 2;
    
    const wouldCrossWall = (isAtHorizontalBoundary || isAtVerticalBoundary) && hitWall;
    
    if (!hitWall) {
      // Move forward if no wall
      pacman.x = nextX;
      pacman.y = nextY;
    } else {
      // Align with cell edge when hitting a wall
      if (pacman.direction === DIRECTIONS.RIGHT) {
        pacman.x = cellX * CELL_SIZE + CELL_SIZE - pacman.radius;
      } else if (pacman.direction === DIRECTIONS.LEFT) {
        pacman.x = cellX * CELL_SIZE + pacman.radius;
      } else if (pacman.direction === DIRECTIONS.DOWN) {
        pacman.y = cellY * CELL_SIZE + CELL_SIZE - pacman.radius;
      } else if (pacman.direction === DIRECTIONS.UP) {
        pacman.y = cellY * CELL_SIZE + pacman.radius;
      }
    }
  }
}

function checkCollisions() {
  if (pacman.isDead) return;
  
  // Check pellet collisions
  for (const pellet of pellets) {
    if (!pellet.isEaten && isColliding(pacman, pellet)) {
      pellet.isEaten = true;
      score += 10;
      updateScoreDisplay();
      playSound('chomp');
    }
  }
  
  // Check power pellet collisions
  for (const pellet of powerPellets) {
    if (!pellet.isEaten && isColliding(pacman, pellet)) {
      pellet.isEaten = true;
      score += 50;
      updateScoreDisplay();
      playSound('powerPellet');
      
      // Frighten all ghosts
      for (const ghost of ghosts) {
        ghost.frighten();
      }
    }
  }
  
  // Check ghost collisions
  for (const ghost of ghosts) {
    if (isColliding(pacman, ghost)) {
      if (ghost.mode === 'frightened' && !ghost.isEaten) {
        // Eat ghost
        ghost.isEaten = true;
        score += 200;
        updateScoreDisplay();
        playSound('ghostEaten');
        showMessage('+200', 1000);
      } else if (!ghost.isEaten) {
        // Pac-Man dies
        pacman.isDead = true;
        pacman.deathAnimationTime = 0;
        playSound('death');
        lives--;
        updateLivesDisplay();
        
        // Disable keyboard temporarily to prevent input during death animation
        keyboardEnabled = false;
        
        // Short delay before resetting
        setTimeout(() => {
          keyboardEnabled = true; // Re-enable keyboard
          if (lives > 0) {
            resetPositions();
          } else {
            gameOver();
          }
        }, 2000);
      }
    }
  }
  
  // Check if all pellets are eaten (victory)
  const remainingPellets = pellets.filter(p => !p.isEaten).length;
  const remainingPowerPellets = powerPellets.filter(p => !p.isEaten).length;
  
  if (remainingPellets === 0 && remainingPowerPellets === 0) {
    victory();
  }
}

function isColliding(obj1, obj2) {
  const distance = Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
  return distance < obj1.radius + obj2.radius;
}

function resetPositions() {
  // Reset Pac-Man position
  pacman.x = 14 * CELL_SIZE + CELL_SIZE / 2;
  pacman.y = 23 * CELL_SIZE + CELL_SIZE / 2;
  pacman.direction = DIRECTIONS.RIGHT;
  pacman.isDead = false;
  
  // Reset ghost positions
  ghosts[0].x = 14 * CELL_SIZE + CELL_SIZE / 2; // Blinky
  ghosts[0].y = 11 * CELL_SIZE + CELL_SIZE / 2;
  ghosts[0].direction = DIRECTIONS.RIGHT;
  ghosts[0].mode = 'scatter';
  
  ghosts[1].x = 14 * CELL_SIZE + CELL_SIZE / 2; // Pinky
  ghosts[1].y = 14 * CELL_SIZE + CELL_SIZE / 2;
  ghosts[1].direction = DIRECTIONS.RIGHT;
  ghosts[1].mode = 'scatter';
  
  ghosts[2].x = 12 * CELL_SIZE + CELL_SIZE / 2; // Inky
  ghosts[2].y = 14 * CELL_SIZE + CELL_SIZE / 2;
  ghosts[2].direction = DIRECTIONS.RIGHT;
  ghosts[2].mode = 'scatter';
  
  ghosts[3].x = 16 * CELL_SIZE + CELL_SIZE / 2; // Clyde
  ghosts[3].y = 14 * CELL_SIZE + CELL_SIZE / 2;
  ghosts[3].direction = DIRECTIONS.RIGHT;
  ghosts[3].mode = 'scatter';
  
  // Reset ghost modes and eaten states
  for (const ghost of ghosts) {
    ghost.mode = 'scatter';
    ghost.isEaten = false;
    ghost.frightenedTimeLeft = 0;
    ghost.justChangedMode = false;
  }
  
  // Reset ghost mode timer
  ghostModeSwitchTime = 0;
  
  lastDirectionPressed = null;
}

function gameOver() {
  gameState = 'gameOver';
  showMessage('Game Over!');
  updateLSScore(score);
  
  // Update buttons
  document.getElementById('startButton').textContent = 'Try Again';
  document.getElementById('pauseButton').disabled = true;
}

function victory() {
  gameState = 'victory';
  score += 1000; // Bonus for completing the level
  updateScoreDisplay();
  updateLSScore(score);
  playSound('victory');
  showMessage('Victory! +1000 pts');
  
  // Update buttons
  document.getElementById('startButton').textContent = 'Play Again';
  document.getElementById('pauseButton').disabled = true;
}

function checkGameState() {
  // Already handled in the collision checks
}

function updateScoreDisplay() {
  document.getElementById('score').textContent = score;
}

function updateLivesDisplay() {
  const livesContainer = document.getElementById('lives');
  livesContainer.innerHTML = '';
  
  for (let i = 0; i < lives; i++) {
    const lifeElem = document.createElement('span');
    lifeElem.className = 'life';
    livesContainer.appendChild(lifeElem);
  }
}

function showMessage(text, duration = null) {
  const messageElem = document.getElementById('gameMessage');
  messageElem.textContent = text;
  messageElem.style.display = 'block';
  
  if (duration) {
    setTimeout(() => {
      messageElem.style.display = 'none';
    }, duration);
  }
}

function hideMessage() {
  document.getElementById('gameMessage').style.display = 'none';
}

function render() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw maze
  drawMaze();
  
  // Draw pellets
  drawPellets();
  
  // Draw power pellets
  drawPowerPellets();

  // Draw Pac-Man
  drawPacman();
  
  // Draw ghosts
  for (const ghost of ghosts) {
    ghost.draw();
  }
}

function drawMaze() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (maze[row][col] === 1) {
        ctx.fillStyle = '#2121de';
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add some detail to walls with rounded corners and edges
        ctx.strokeStyle = '#1a1ac9';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawPellets() {
  ctx.fillStyle = '#ffb8ae';
  
  for (const pellet of pellets) {
    if (!pellet.isEaten) {
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, pellet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPowerPellets() {
  for (const pellet of powerPellets) {
    if (!pellet.isEaten) {
      // Pulsating effect
      const pulseScale = 1 + 0.2 * Math.sin(pellet.pulseTime * 0.1);
      const radius = pellet.radius * pulseScale;
      
      ctx.fillStyle = '#ffb8ff';
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPacman() {
  ctx.save();
  ctx.translate(pacman.x, pacman.y);
  
  // Rotate based on direction
  let rotationAngle = 0;
  if (pacman.direction === DIRECTIONS.UP) {
    rotationAngle = -Math.PI / 2;
  } else if (pacman.direction === DIRECTIONS.DOWN) {
    rotationAngle = Math.PI / 2;
  } else if (pacman.direction === DIRECTIONS.LEFT) {
    rotationAngle = Math.PI;
  }
  ctx.rotate(rotationAngle);
  
  // Death animation
  if (pacman.isDead) {
    const deathProgress = Math.min(pacman.deathAnimationTime / 1.5, 1);
    const mouthAngle = Math.PI * deathProgress;
    
    ctx.fillStyle = pacmanSkinColor;
    ctx.beginPath();
    ctx.arc(0, 0, pacman.radius, mouthAngle, Math.PI * 2 - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // Normal Pac-Man with chomping animation
    ctx.fillStyle = pacmanSkinColor;
    ctx.beginPath();
    ctx.arc(0, 0, pacman.radius, pacman.mouthAngle, Math.PI * 2 - pacman.mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);
