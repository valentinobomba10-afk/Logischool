(() => {
  const KEYMAP = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
    W: 'up',
    A: 'left',
    S: 'down',
    D: 'right'
  };

  const createEl = (tag, className, html) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html !== undefined) el.innerHTML = html;
    return el;
  };

  const LogiSchoolGames = {
    launch(game, root, core) {
      root.innerHTML = '';
      const handlers = {
        'click-rush': () => this.clickRush(root, core),
        'click-rush-online': () => this.clickRushOnline(root, core),
        'connect-4': () => this.connect4(root, core),
        'connect-4-online': () => this.connect4Online(root, core),
        'rock-paper-scissors': () => this.rps(root, core),
        'rock-paper-scissors-online': () => this.rpsOnline(root, core),
        'memory-flip-online': () => this.memoryFlipOnline(root, core),
        'memory-flip': () => this.memoryFlip(root, core),
        snake: () => this.snake(root, core),
        tetris: () => this.tetris(root, core),
        'chrome-dino': () => this.embedGame(root, core, game),
        pacman: () => this.embedGame(root, core, game),
        chess: () => this.embedGame(root, core, game),
        'geo-guesser': () => this.embedGame(root, core, game),
        'geometry-dash-lite': () => this.embedGame(root, core, game),
        'cookie-clicker': () => this.embedGame(root, core, game),
        'temple-run-2': () => this.embedGame(root, core, game),
        'cl-super-smash-bros': () => this.embedGame(root, core, game),
        'sonic-2': () => this.embedGame(root, core, game),
        'donkey-kong': () => this.embedGame(root, core, game),
        'crossy-road': () => this.embedGame(root, core, game),
        'crazy-plane-landing': () => this.embedGame(root, core, game),
        'escape-road': () => this.embedGame(root, core, game),
        'escape-road-2': () => this.embedGame(root, core, game),
        'block-blast': () => this.embedGame(root, core, game),
        'parking-fury-3': () => this.embedGame(root, core, game),
        'wheelie-life-modded': () => this.embedGame(root, core, game),
        'google-baseball': () => this.embedGame(root, core, game),
        'google-doodle-cricket': () => this.embedGame(root, core, game),
        'solar-smash': () => this.embedGame(root, core, game),
        'top-speed-racing-3d': () => this.embedGame(root, core, game),
        'ultimate-car-driving-simulator': () => this.embedGame(root, core, game),
        'ragdoll-hit': () => this.embedGame(root, core, game)
      };
      const handler = handlers[game.id];
      if (!handler) {
        root.innerHTML = '<div class="notice">Game unavailable.</div>';
        return;
      }
      handler();
    },
    attachOnlineLobby(host, title = 'Players You Can Play With') {
      if (!host) return null;
      const lobby = createEl('div', 'online-lobby');
      lobby.innerHTML = `
        <div class="online-lobby-head">
          <strong>${title}</strong>
          <span class="online-lobby-meta">0 online · 0 waiting</span>
        </div>
        <div class="online-lobby-list">
          <div class="online-lobby-empty">No waiting players yet. Stay in queue.</div>
        </div>
      `;
      host.appendChild(lobby);
      return {
        root: lobby,
        meta: lobby.querySelector('.online-lobby-meta'),
        list: lobby.querySelector('.online-lobby-list')
      };
    },
    renderOnlineLobby(lobbyUi, payload, currentUserId) {
      if (!lobbyUi || !lobbyUi.meta || !lobbyUi.list) return;
      const allPlayers = Array.isArray(payload?.onlinePlayers) ? payload.onlinePlayers : [];
      const waitingPlayers = Array.isArray(payload?.availablePlayers) ? payload.availablePlayers : [];
      const fallbackWaiting = allPlayers.filter((entry) => {
        const state = String(entry?.state || '').toLowerCase();
        return state === 'queue' && String(entry?.id || '') !== String(currentUserId || '');
      });
      const playable = waitingPlayers.length ? waitingPlayers : fallbackWaiting;
      const queueCountRaw = Number(payload?.queuePlayers);
      const onlineCountRaw = Number(payload?.onlineCount);
      const queueCount = Number.isFinite(queueCountRaw)
        ? queueCountRaw
        : allPlayers.filter((entry) => String(entry?.state || '').toLowerCase() === 'queue').length;
      const onlineCount = Number.isFinite(onlineCountRaw) ? onlineCountRaw : allPlayers.length;
      lobbyUi.meta.textContent = `${onlineCount} online · ${queueCount} waiting`;
      lobbyUi.list.innerHTML = '';
      if (!playable.length) {
        lobbyUi.list.innerHTML = '<div class="online-lobby-empty">No waiting players yet. Stay in queue.</div>';
        return;
      }
      playable.slice(0, 10).forEach((entry) => {
        const row = createEl('div', 'online-lobby-item');
        const dot = createEl('span', 'online-lobby-dot');
        const name = createEl('span', 'online-lobby-name');
        name.textContent = String(entry?.username || 'Player').slice(0, 18) || 'Player';
        row.appendChild(dot);
        row.appendChild(name);
        lobbyUi.list.appendChild(row);
      });
    },
    clickRush(root, core) {
      const wrap = createEl('div', 'click-rush');
      const hud = createEl(
        'div',
        'hud',
        `
        <div class="hud-item">Time: <span id="crTime">10.0s</span></div>
        <div class="hud-item">Clicks: <span id="crClicks">0</span></div>
        <div class="hud-item">Best: <span id="crBest">--</span></div>
      `
      );
      const startBtn = createEl('button', 'btn primary', 'Start');
      const clickBtn = createEl('button', 'click-btn');
      clickBtn.textContent = 'CLICK';
      clickBtn.style.display = 'none';
      const result = createEl('div', 'notice');
      result.style.display = 'none';

      wrap.appendChild(hud);
      wrap.appendChild(startBtn);
      wrap.appendChild(clickBtn);
      wrap.appendChild(result);
      root.appendChild(wrap);

      const bestEl = hud.querySelector('#crBest');
      const user = core.getCurrentUser();
      const entry = user?.stats?.bestScores?.['click-rush'];
      if (entry) bestEl.textContent = entry.score;

      let timer = null;
      let timeLeft = 10;
      let clicks = 0;
      const reset = () => {
        clearInterval(timer);
        timeLeft = 10;
        clicks = 0;
        hud.querySelector('#crTime').textContent = '10.0s';
        hud.querySelector('#crClicks').textContent = '0';
        clickBtn.style.display = 'none';
        startBtn.style.display = 'inline-flex';
        result.style.display = 'none';
      };
      const endGame = () => {
        clearInterval(timer);
        clickBtn.style.display = 'none';
        startBtn.style.display = 'inline-flex';
        result.style.display = 'block';
        result.textContent = `Final score: ${clicks} clicks.`;
        core.reportScore('click-rush', clicks, 'high');
        const updated = core.getCurrentUser()?.stats?.bestScores?.['click-rush'];
        if (updated) bestEl.textContent = updated.score;
      };
      startBtn.addEventListener('click', () => {
        reset();
        clicks = 0;
        clickBtn.style.display = 'grid';
        startBtn.style.display = 'none';
        result.style.display = 'none';
        timer = setInterval(() => {
          timeLeft -= 0.1;
          if (timeLeft <= 0) {
            hud.querySelector('#crTime').textContent = '0.0s';
            endGame();
            return;
          }
          hud.querySelector('#crTime').textContent = `${timeLeft.toFixed(1)}s`;
        }, 100);
      });
      clickBtn.addEventListener('click', () => {
        clicks += 1;
        hud.querySelector('#crClicks').textContent = clicks;
      });
    },
    connect4(root, core) {
      const wrap = createEl('div', 'connect4');
      const status = createEl('div', 'notice');
      status.textContent = 'Your turn.';
      const boardEl = createEl('div', 'connect4-board');
      const overlay = createEl('div', 'notice');
      overlay.style.display = 'none';
      const resetBtn = createEl('button', 'btn ghost', 'Restart');
      const topRow = createEl('div', 'embed-toolbar');
      topRow.appendChild(status);
      topRow.appendChild(resetBtn);
      wrap.appendChild(topRow);
      wrap.appendChild(boardEl);
      wrap.appendChild(overlay);
      root.appendChild(wrap);

      const rows = 6;
      const cols = 7;
      let board = Array.from({ length: rows }, () => Array(cols).fill(0));
      let currentPlayer = 1;
      let gameOver = false;
      let turns = 0;

      const createCells = () => {
        boardEl.innerHTML = '';
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            const cell = createEl('div', 'connect4-cell');
            cell.dataset.col = c;
            boardEl.appendChild(cell);
          }
        }
      };

      const renderBoard = () => {
        [...boardEl.children].forEach((cell, index) => {
          const r = Math.floor(index / cols);
          const c = index % cols;
          cell.classList.remove('player', 'cpu');
          if (board[r][c] === 1) cell.classList.add('player');
          if (board[r][c] === 2) cell.classList.add('cpu');
        });
      };

      const getAvailableRow = (col) => {
        for (let r = rows - 1; r >= 0; r -= 1) {
          if (board[r][col] === 0) return r;
        }
        return -1;
      };

      const checkWin = (player) => {
        const directions = [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1]
        ];
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            if (board[r][c] !== player) continue;
            for (const [dr, dc] of directions) {
              let count = 0;
              for (let i = 0; i < 4; i += 1) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
                if (board[nr][nc] === player) count += 1;
              }
              if (count === 4) return true;
            }
          }
        }
        return false;
      };

      const availableCols = () => {
        const colsList = [];
        for (let c = 0; c < cols; c += 1) {
          if (getAvailableRow(c) !== -1) colsList.push(c);
        }
        return colsList;
      };

      const simulateWin = (col, player) => {
        const row = getAvailableRow(col);
        if (row === -1) return false;
        board[row][col] = player;
        const win = checkWin(player);
        board[row][col] = 0;
        return win;
      };

      const endGame = (message, playerWon) => {
        gameOver = true;
        overlay.style.display = 'block';
        overlay.textContent = message;
        if (playerWon) {
          const score = Math.max(0, 120 - turns * 2);
          core.reportScore('connect-4', score, 'high');
        }
      };

      const cpuMove = () => {
        if (gameOver) return;
        status.textContent = 'CPU thinking...';
        setTimeout(() => {
          const validCols = availableCols();
          let choice = validCols[Math.floor(Math.random() * validCols.length)];
          for (const col of validCols) {
            if (simulateWin(col, 2)) {
              choice = col;
              break;
            }
          }
          if (choice !== undefined) {
            for (const col of validCols) {
              if (simulateWin(col, 1)) {
                choice = col;
                break;
              }
            }
          }
          if (validCols.includes(3) && Math.random() > 0.3) {
            choice = 3;
          }
          const row = getAvailableRow(choice);
          if (row === -1) return;
          board[row][choice] = 2;
          turns += 1;
          renderBoard();
          if (checkWin(2)) {
            endGame('CPU wins this round.', false);
            return;
          }
          if (availableCols().length === 0) {
            endGame('It\'s a draw.', false);
            return;
          }
          currentPlayer = 1;
          status.textContent = 'Your turn.';
        }, 600);
      };

      boardEl.addEventListener('click', (event) => {
        if (gameOver || currentPlayer !== 1) return;
        const cell = event.target.closest('.connect4-cell');
        if (!cell) return;
        const col = Number(cell.dataset.col);
        const row = getAvailableRow(col);
        if (row === -1) return;
        board[row][col] = 1;
        turns += 1;
        renderBoard();
        if (checkWin(1)) {
          endGame('You win! Great connect 4.', true);
          return;
        }
        if (availableCols().length === 0) {
          endGame('It\'s a draw.', false);
          return;
        }
        currentPlayer = 2;
        cpuMove();
      });

      resetBtn.addEventListener('click', () => {
        board = Array.from({ length: rows }, () => Array(cols).fill(0));
        currentPlayer = 1;
        gameOver = false;
        turns = 0;
        overlay.style.display = 'none';
        status.textContent = 'Your turn.';
        renderBoard();
      });

      createCells();
      renderBoard();
    },
    rps(root, core) {
      const wrap = createEl('div', 'rps');
      const status = createEl('div', 'notice');
      const hands = createEl('div', 'rps-hands');
      hands.innerHTML = '<div id="playerHand">✊</div><div id="cpuHand">✊</div>';
      const stats = createEl('div', 'hud');
      stats.innerHTML = `
        <div class="hud-item">Wins: <span id="rpsWins">0</span></div>
        <div class="hud-item">Streak: <span id="rpsStreak">0</span></div>
        <div class="hud-item">Best: <span id="rpsBest">--</span></div>
      `;
      const buttons = createEl('div', 'rps-buttons');
      ['Rock', 'Paper', 'Scissors'].forEach((label) => {
        const btn = createEl('button', 'btn ghost');
        btn.textContent = label;
        btn.addEventListener('click', () => playRound(label.toLowerCase()));
        buttons.appendChild(btn);
      });
      wrap.appendChild(status);
      wrap.appendChild(hands);
      wrap.appendChild(stats);
      wrap.appendChild(buttons);
      root.appendChild(wrap);

      const choices = ['rock', 'paper', 'scissors'];
      const emoji = { rock: '✊', paper: '✋', scissors: '✌️' };
      let wins = 0;
      let streak = 0;
      let best = 0;
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.['rock-paper-scissors'];
      if (bestEntry) {
        best = bestEntry.score;
        document.getElementById('rpsBest').textContent = bestEntry.score;
      }

      const compare = (player, cpu) => {
        if (player === cpu) return 'tie';
        if (
          (player === 'rock' && cpu === 'scissors') ||
          (player === 'paper' && cpu === 'rock') ||
          (player === 'scissors' && cpu === 'paper')
        ) {
          return 'win';
        }
        return 'lose';
      };

      const playRound = (playerChoice) => {
        hands.classList.add('shake');
        status.textContent = 'Ready...';
        let count = 3;
        const countdown = setInterval(() => {
          count -= 1;
          if (count > 0) {
            status.textContent = `Revealing in ${count}...`;
            return;
          }
          clearInterval(countdown);
          hands.classList.remove('shake');
          const cpuChoice = choices[Math.floor(Math.random() * choices.length)];
          document.getElementById('playerHand').textContent = emoji[playerChoice];
          document.getElementById('cpuHand').textContent = emoji[cpuChoice];
          const result = compare(playerChoice, cpuChoice);
          if (result === 'win') {
            wins += 1;
            streak += 1;
            status.textContent = 'You win this round!';
          } else if (result === 'lose') {
            status.textContent = 'CPU wins. Try again.';
            streak = 0;
          } else {
            status.textContent = 'Tie round.';
          }
          document.getElementById('rpsWins').textContent = wins;
          document.getElementById('rpsStreak').textContent = streak;
          if (streak > best) {
            best = streak;
            core.reportScore('rock-paper-scissors', best, 'high');
            document.getElementById('rpsBest').textContent = best;
          }
        }, 400);
      };
    },
    rpsOnline(root, core) {
      const endpoint = '/.netlify/functions/rps-online';
      const user = core.getCurrentUser();
      if (!user) {
        root.innerHTML = '<div class="notice">Sign in to play online.</div>';
        return;
      }

      const wrap = createEl('div', 'rps-online');
      wrap.innerHTML = `
        <div class="rps-online-head">
          <div class="notice" id="rpsOnlineStatus">Connecting to online matchmaker...</div>
          <div class="rps-online-actions">
            <button class="btn ghost" id="rpsOnlineFind">Find Match</button>
            <button class="btn ghost" id="rpsOnlineLeave">Leave</button>
          </div>
        </div>
        <div class="rps-online-players">
          <div class="online-player" id="rpsOnlineMeCard"></div>
          <div class="rps-online-vs">VS</div>
          <div class="online-player" id="rpsOnlineOppCard"></div>
        </div>
        <div class="hud">
          <div class="hud-item">Round: <span id="rpsOnlineRound">1</span></div>
          <div class="hud-item">You: <span id="rpsOnlineMyScore">0</span></div>
          <div class="hud-item">Opponent: <span id="rpsOnlineOppScore">0</span></div>
          <div class="hud-item">Target: 5</div>
        </div>
        <div class="rps-online-hands">
          <div class="rps-online-hand">
            <span id="rpsOnlineMyHand">❔</span>
            <small>You</small>
          </div>
          <div class="rps-online-hand">
            <span id="rpsOnlineOppHand">❔</span>
            <small>Opponent</small>
          </div>
        </div>
        <div class="rps-online-buttons">
          <button class="btn primary" data-move="rock">Rock</button>
          <button class="btn primary" data-move="paper">Paper</button>
          <button class="btn primary" data-move="scissors">Scissors</button>
        </div>
        <div class="notice" id="rpsOnlineSub">Waiting for another player...</div>
      `;
      root.appendChild(wrap);
      const lobbyUi = this.attachOnlineLobby(wrap);

      const statusEl = wrap.querySelector('#rpsOnlineStatus');
      const subEl = wrap.querySelector('#rpsOnlineSub');
      const meCard = wrap.querySelector('#rpsOnlineMeCard');
      const oppCard = wrap.querySelector('#rpsOnlineOppCard');
      const roundEl = wrap.querySelector('#rpsOnlineRound');
      const myScoreEl = wrap.querySelector('#rpsOnlineMyScore');
      const oppScoreEl = wrap.querySelector('#rpsOnlineOppScore');
      const myHandEl = wrap.querySelector('#rpsOnlineMyHand');
      const oppHandEl = wrap.querySelector('#rpsOnlineOppHand');
      const findBtn = wrap.querySelector('#rpsOnlineFind');
      const leaveBtn = wrap.querySelector('#rpsOnlineLeave');
      const moveButtons = [...wrap.querySelectorAll('.rps-online-buttons button')];

      const emoji = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
      };

      const currentPlayerPayload = () => {
        const currentUser = core.getCurrentUser() || user;
        const avatar =
          typeof core.getAvatarPayload === 'function'
            ? core.getAvatarPayload(currentUser)
            : { avatarUrl: '', avatarPreset: '' };
        return {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: avatar.avatarUrl || '',
          avatarPreset: avatar.avatarPreset || ''
        };
      };

      const resolveAvatarUrl = (entry) => {
        if (!entry) return '';
        if (typeof core.resolveAvatarUrl === 'function') {
          return core.resolveAvatarUrl(entry) || '';
        }
        const url = String(entry.avatarUrl || '').trim();
        return /^https?:\/\//.test(url) ? url : '';
      };

      const renderPlayerCard = (el, playerData, fallback, role) => {
        el.innerHTML = '';
        const name = String(playerData?.username || fallback || 'Player');
        const avatarWrap = createEl('div', 'online-avatar');
        const avatarUrl = resolveAvatarUrl(playerData);
        if (avatarUrl) {
          const img = createEl('img');
          img.src = avatarUrl;
          img.alt = name;
          avatarWrap.appendChild(img);
        } else {
          avatarWrap.textContent = name.slice(0, 1).toUpperCase();
        }
        const meta = createEl('div', 'online-meta');
        const nameEl = createEl('div', 'online-name');
        nameEl.textContent = name;
        const roleEl = createEl('div', 'online-role');
        roleEl.textContent = role;
        meta.appendChild(nameEl);
        meta.appendChild(roleEl);
        el.appendChild(avatarWrap);
        el.appendChild(meta);
      };

      const setMoveButtons = (enabled) => {
        moveButtons.forEach((btn) => {
          btn.disabled = !enabled;
        });
      };

      let active = true;
      let matchId = '';
      let lastFinishedMatch = '';
      let pollTimer = null;
      let requestInFlight = false;
      let shouldQueue = true;

      const setWaitingView = (message) => {
        const me = currentPlayerPayload();
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, null, 'Waiting...', 'Opponent');
        roundEl.textContent = '1';
        myScoreEl.textContent = '0';
        oppScoreEl.textContent = '0';
        myHandEl.textContent = '❔';
        oppHandEl.textContent = '❔';
        statusEl.textContent = message || 'Waiting for another player...';
        subEl.textContent = 'Queue is live across devices.';
        setMoveButtons(false);
      };

      const handleNetworkError = (message) => {
        statusEl.textContent = 'Online server unavailable.';
        subEl.textContent = message || 'Try refreshing in a moment.';
        setMoveButtons(false);
      };

      const postAction = async (action, extra = {}) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...extra })
          });
          const data = await response.json();
          if (!response.ok) {
            return { error: data?.error || `Request failed (${response.status})` };
          }
          return data;
        } catch (err) {
          return { error: 'Network error' };
        }
      };

      const renderMatch = (match) => {
        if (!match || !match.id) {
          setWaitingView('Waiting for another player...');
          return;
        }
        matchId = match.id;
        const me = (match.players || []).find((p) => p.id === user.id) || currentPlayerPayload();
        const opponent = (match.players || []).find((p) => p.id !== user.id) || null;
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, opponent, 'Waiting...', 'Opponent');

        const round = match.round || {};
        const myScore = Number(match.scores?.[user.id] || 0);
        const oppScore = Number(match.scores?.[opponent?.id] || 0);
        myScoreEl.textContent = String(myScore);
        oppScoreEl.textContent = String(oppScore);
        roundEl.textContent = String(round.number || 1);
        myHandEl.textContent = round.myMove ? emoji[round.myMove] || '❔' : '❔';
        if (round.opponentMove) {
          oppHandEl.textContent = emoji[round.opponentMove] || '❔';
        } else if (round.opponentSubmitted) {
          oppHandEl.textContent = '⌛';
        } else {
          oppHandEl.textContent = '❔';
        }

        if (match.winnerId) {
          shouldQueue = false;
          const youWon = match.winnerId === user.id;
          statusEl.textContent = youWon ? 'You won the online match.' : `${opponent?.username || 'Opponent'} won the match.`;
          subEl.textContent = 'Press Find Match to queue again.';
          setMoveButtons(false);
          if (lastFinishedMatch !== match.id) {
            lastFinishedMatch = match.id;
            core.reportScore('rock-paper-scissors-online', myScore, 'high');
            if (youWon && typeof core.reportOnlineWin === 'function') {
              core.reportOnlineWin('rock-paper-scissors-online');
            }
          }
          return;
        }

        if (round.status === 'choosing') {
          if (round.mySubmitted) {
            statusEl.textContent = `Round ${round.number}: move locked.`;
            subEl.textContent = round.opponentSubmitted
              ? 'Both moves in. Revealing...'
              : `Waiting for ${opponent?.username || 'opponent'} to choose.`;
            setMoveButtons(false);
          } else {
            statusEl.textContent = `Round ${round.number}: choose your move.`;
            subEl.textContent = `${opponent?.username || 'Opponent'} is online.`;
            setMoveButtons(true);
          }
          return;
        }

        statusEl.textContent = `Round ${round.number} result`;
        subEl.textContent = round.message || 'Next round starting...';
        setMoveButtons(false);
      };

      const applyState = (payload) => {
        if (!payload) return;
        this.renderOnlineLobby(lobbyUi, payload, user.id);
        if (payload.error) {
          handleNetworkError(payload.error);
          return;
        }
        if (payload.status === 'matched' && payload.match) {
          renderMatch(payload.match);
          return;
        }
        if (payload.status === 'waiting') {
          shouldQueue = true;
          const size = Number(payload.queueSize || 1);
          setWaitingView(payload.message || 'Waiting for another player...');
          subEl.textContent = `Queue size: ${size}`;
          return;
        }
        if (payload.status === 'idle' && shouldQueue) {
          statusEl.textContent = 'Rejoining queue...';
          joinQueue();
          return;
        }
        setWaitingView('Looking for a player...');
      };

      const joinQueue = async () => {
        if (!active) return;
        shouldQueue = true;
        statusEl.textContent = 'Joining online queue...';
        const payload = await postAction('join', {
          player: currentPlayerPayload(),
          matchId
        });
        applyState(payload);
      };

      const pollState = async () => {
        if (!active || requestInFlight) return;
        requestInFlight = true;
        try {
          const payload = await postAction('state', {
            playerId: user.id,
            matchId,
            player: currentPlayerPayload()
          });
          applyState(payload);
        } finally {
          requestInFlight = false;
        }
      };

      const leaveCurrent = async () => {
        if (!active) return;
        shouldQueue = false;
        await postAction('leave', { playerId: user.id, matchId });
        matchId = '';
        setWaitingView('Left match. Press Find Match to queue again.');
      };

      moveButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!matchId || btn.disabled) return;
          setMoveButtons(false);
          const move = btn.dataset.move;
          const payload = await postAction('move', {
            playerId: user.id,
            matchId,
            move
          });
          applyState(payload);
        });
      });

      findBtn.addEventListener('click', () => {
        shouldQueue = true;
        matchId = '';
        joinQueue();
      });
      leaveBtn.addEventListener('click', () => {
        leaveCurrent();
      });

      const handleUnload = () => {
        active = false;
        clearInterval(pollTimer);
        try {
          navigator.sendBeacon(
            endpoint,
            new Blob([JSON.stringify({ action: 'leave', playerId: user.id, matchId })], {
              type: 'application/json'
            })
          );
        } catch (err) {
          // no-op
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      setWaitingView('Connecting to online matchmaker...');
      joinQueue();
      pollTimer = setInterval(pollState, 1200);
    },
    clickRushOnline(root, core) {
      const endpoint = '/.netlify/functions/click-rush-online';
      const user = core.getCurrentUser();
      if (!user) {
        root.innerHTML = '<div class="notice">Sign in to play online.</div>';
        return;
      }

      const wrap = createEl('div', 'click-rush-online');
      wrap.innerHTML = `
        <div class="rps-online-head">
          <div class="notice" id="croStatus">Connecting to online click arena...</div>
          <div class="rps-online-actions">
            <button class="btn ghost" id="croFind">Find Match</button>
            <button class="btn ghost" id="croLeave">Leave</button>
          </div>
        </div>
        <div class="rps-online-players">
          <div class="online-player" id="croMeCard"></div>
          <div class="rps-online-vs">VS</div>
          <div class="online-player" id="croOppCard"></div>
        </div>
        <div class="hud">
          <div class="hud-item">Time: <span id="croTime">10.0s</span></div>
          <div class="hud-item">You: <span id="croMy">0</span></div>
          <div class="hud-item">Opponent: <span id="croOpp">0</span></div>
          <div class="hud-item">Best: <span id="croBest">--</span></div>
        </div>
        <button class="click-btn" id="croClickBtn" disabled>CLICK</button>
        <div class="notice" id="croSub">Waiting for another player...</div>
      `;
      root.appendChild(wrap);
      const lobbyUi = this.attachOnlineLobby(wrap);

      const statusEl = wrap.querySelector('#croStatus');
      const subEl = wrap.querySelector('#croSub');
      const meCard = wrap.querySelector('#croMeCard');
      const oppCard = wrap.querySelector('#croOppCard');
      const myEl = wrap.querySelector('#croMy');
      const oppEl = wrap.querySelector('#croOpp');
      const timeEl = wrap.querySelector('#croTime');
      const bestEl = wrap.querySelector('#croBest');
      const clickBtn = wrap.querySelector('#croClickBtn');
      const findBtn = wrap.querySelector('#croFind');
      const leaveBtn = wrap.querySelector('#croLeave');

      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.['click-rush-online'];
      let best = Number(bestEntry?.score || 0);
      bestEl.textContent = best > 0 ? String(best) : '--';

      const currentPlayerPayload = () => {
        const currentUser = core.getCurrentUser() || user;
        const avatar =
          typeof core.getAvatarPayload === 'function'
            ? core.getAvatarPayload(currentUser)
            : { avatarUrl: '', avatarPreset: '' };
        return {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: avatar.avatarUrl || '',
          avatarPreset: avatar.avatarPreset || ''
        };
      };

      const resolveAvatarUrl = (entry) => {
        if (!entry) return '';
        if (typeof core.resolveAvatarUrl === 'function') {
          return core.resolveAvatarUrl(entry) || '';
        }
        const url = String(entry.avatarUrl || '').trim();
        return /^https?:\/\//.test(url) ? url : '';
      };

      const renderPlayerCard = (el, playerData, fallback, role) => {
        el.innerHTML = '';
        const name = String(playerData?.username || fallback || 'Player');
        const avatarWrap = createEl('div', 'online-avatar');
        const avatarUrl = resolveAvatarUrl(playerData);
        if (avatarUrl) {
          const img = createEl('img');
          img.src = avatarUrl;
          img.alt = name;
          avatarWrap.appendChild(img);
        } else {
          avatarWrap.textContent = name.slice(0, 1).toUpperCase();
        }
        const meta = createEl('div', 'online-meta');
        const nameEl = createEl('div', 'online-name');
        nameEl.textContent = name;
        const roleEl = createEl('div', 'online-role');
        roleEl.textContent = role;
        meta.appendChild(nameEl);
        meta.appendChild(roleEl);
        el.appendChild(avatarWrap);
        el.appendChild(meta);
      };

      const canClickNow = () => {
        if (!active || !matchState || !matchState.id) return false;
        if (matchState.status !== 'live') return false;
        return Date.now() < Number(matchState.endAt || 0);
      };

      const updateClickButton = () => {
        clickBtn.disabled = !canClickNow();
      };

      const updateTimerLabel = () => {
        if (!matchState || !matchState.id) {
          timeEl.textContent = '10.0s';
          return;
        }
        const now = Date.now();
        if (matchState.status === 'countdown') {
          const ms = Math.max(0, Number(matchState.startAt || 0) - now);
          timeEl.textContent = `${(ms / 1000).toFixed(1)}s`;
          return;
        }
        if (matchState.status === 'live') {
          const ms = Math.max(0, Number(matchState.endAt || 0) - now);
          timeEl.textContent = `${(ms / 1000).toFixed(1)}s`;
          return;
        }
        timeEl.textContent = '0.0s';
      };

      const setWaitingView = (message) => {
        const me = currentPlayerPayload();
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, null, 'Waiting...', 'Opponent');
        myEl.textContent = '0';
        oppEl.textContent = '0';
        statusEl.textContent = message || 'Waiting for another player...';
        subEl.textContent = 'Queue is live across devices.';
        matchId = '';
        matchState = null;
        pendingClicks = 0;
        optimisticClicks = 0;
        updateTimerLabel();
        updateClickButton();
      };

      const handleNetworkError = (message) => {
        statusEl.textContent = 'Online server unavailable.';
        subEl.textContent = message || 'Try refreshing in a moment.';
        updateClickButton();
      };

      const postAction = async (action, extra = {}) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...extra })
          });
          const data = await response.json();
          if (!response.ok) {
            return { error: data?.error || `Request failed (${response.status})` };
          }
          return data;
        } catch (err) {
          return { error: 'Network error' };
        }
      };

      const renderMatch = (match) => {
        if (!match || !match.id) {
          setWaitingView('Waiting for another player...');
          return;
        }
        matchState = match;
        matchId = match.id;
        const me = (match.players || []).find((p) => p.id === user.id) || currentPlayerPayload();
        const opponent = (match.players || []).find((p) => p.id !== user.id) || null;
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, opponent, 'Waiting...', 'Opponent');

        const serverMy = Number(match.counts?.[user.id] || 0);
        const oppId = opponent?.id;
        const serverOpp = Number(match.counts?.[oppId] || 0);
        if (serverMy >= optimisticClicks) {
          optimisticClicks = serverMy;
        }
        myEl.textContent = String(Math.max(serverMy, optimisticClicks));
        oppEl.textContent = String(serverOpp);
        updateTimerLabel();

        if (match.status === 'finished') {
          shouldQueue = false;
          updateClickButton();
          const youWon = match.winnerId && match.winnerId === user.id;
          const tie = !match.winnerId;
          if (tie) {
            statusEl.textContent = `Match finished: tie at ${serverMy}-${serverOpp}.`;
          } else {
            statusEl.textContent = youWon
              ? `You win: ${serverMy} vs ${serverOpp}.`
              : `${opponent?.username || 'Opponent'} wins: ${serverOpp} vs ${serverMy}.`;
          }
          subEl.textContent = 'Press Find Match to play again.';
          pendingClicks = 0;
          optimisticClicks = serverMy;
          if (lastFinishedMatch !== match.id) {
            lastFinishedMatch = match.id;
            core.reportScore('click-rush-online', serverMy, 'high');
            if (youWon && typeof core.reportOnlineWin === 'function') {
              core.reportOnlineWin('click-rush-online');
            }
            if (serverMy > best) {
              best = serverMy;
              bestEl.textContent = String(best);
            }
          }
          return;
        }

        if (match.status === 'countdown') {
          statusEl.textContent = `Match found vs ${opponent?.username || 'Opponent'}.`;
          subEl.textContent = 'Starting soon... get ready.';
          updateClickButton();
          return;
        }

        statusEl.textContent = `Live battle vs ${opponent?.username || 'Opponent'}.`;
        subEl.textContent = 'Click fast. Live counts sync in real time.';
        updateClickButton();
      };

      const applyState = (payload) => {
        if (!payload) return;
        this.renderOnlineLobby(lobbyUi, payload, user.id);
        if (payload.error) {
          handleNetworkError(payload.error);
          return;
        }
        if (payload.status === 'matched' && payload.match) {
          renderMatch(payload.match);
          return;
        }
        if (payload.status === 'waiting') {
          shouldQueue = true;
          const size = Number(payload.queueSize || 1);
          setWaitingView(payload.message || 'Waiting for another player...');
          subEl.textContent = `Queue size: ${size}`;
          return;
        }
        if (payload.status === 'idle' && shouldQueue) {
          statusEl.textContent = 'Rejoining queue...';
          joinQueue();
          return;
        }
        setWaitingView('Press Find Match to queue.');
      };

      const joinQueue = async () => {
        if (!active) return;
        shouldQueue = true;
        statusEl.textContent = 'Joining online queue...';
        pendingClicks = 0;
        optimisticClicks = 0;
        const payload = await postAction('join', {
          player: currentPlayerPayload(),
          matchId
        });
        applyState(payload);
      };

      const pollState = async () => {
        if (!active || requestInFlight) return;
        requestInFlight = true;
        try {
          const payload = await postAction('state', {
            playerId: user.id,
            matchId
          });
          applyState(payload);
        } finally {
          requestInFlight = false;
        }
      };

      const flushClicks = async () => {
        if (!active || !matchId || pendingClicks <= 0) return;
        if (flushInFlight || !canClickNow()) return;
        flushInFlight = true;
        const delta = Math.min(20, pendingClicks);
        pendingClicks -= delta;
        try {
          const payload = await postAction('click', {
            playerId: user.id,
            matchId,
            delta
          });
          applyState(payload);
        } finally {
          flushInFlight = false;
        }
      };

      const leaveCurrent = async () => {
        if (!active) return;
        shouldQueue = false;
        await postAction('leave', { playerId: user.id, matchId });
        setWaitingView('Left match. Press Find Match to queue again.');
      };

      let active = true;
      let matchId = '';
      let matchState = null;
      let pendingClicks = 0;
      let optimisticClicks = 0;
      let pollTimer = null;
      let tickTimer = null;
      let flushTimer = null;
      let requestInFlight = false;
      let flushInFlight = false;
      let lastFinishedMatch = '';
      let shouldQueue = true;

      clickBtn.addEventListener('click', () => {
        if (!canClickNow()) return;
        pendingClicks += 1;
        optimisticClicks += 1;
        myEl.textContent = String(optimisticClicks);
      });

      findBtn.addEventListener('click', () => {
        shouldQueue = true;
        matchId = '';
        matchState = null;
        pendingClicks = 0;
        optimisticClicks = 0;
        joinQueue();
      });

      leaveBtn.addEventListener('click', () => {
        leaveCurrent();
      });

      const handleUnload = () => {
        active = false;
        clearInterval(pollTimer);
        clearInterval(tickTimer);
        clearInterval(flushTimer);
        try {
          navigator.sendBeacon(
            endpoint,
            new Blob([JSON.stringify({ action: 'leave', playerId: user.id, matchId })], {
              type: 'application/json'
            })
          );
        } catch (err) {
          // no-op
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      setWaitingView('Connecting to online click arena...');
      joinQueue();
      pollTimer = setInterval(pollState, 700);
      tickTimer = setInterval(() => {
        updateTimerLabel();
        updateClickButton();
      }, 100);
      flushTimer = setInterval(flushClicks, 180);
    },
    connect4Online(root, core) {
      const endpoint = '/.netlify/functions/connect4-online';
      const user = core.getCurrentUser();
      if (!user) {
        root.innerHTML = '<div class="notice">Sign in to play online.</div>';
        return;
      }

      const wrap = createEl('div', 'connect4-online');
      wrap.innerHTML = `
        <div class="rps-online-head">
          <div class="notice" id="c4oStatus">Connecting to online matchmaker...</div>
          <div class="rps-online-actions">
            <button class="btn ghost" id="c4oFind">Find Match</button>
            <button class="btn ghost" id="c4oLeave">Leave</button>
          </div>
        </div>
        <div class="rps-online-players">
          <div class="online-player" id="c4oMeCard"></div>
          <div class="rps-online-vs">VS</div>
          <div class="online-player" id="c4oOppCard"></div>
        </div>
        <div class="hud">
          <div class="hud-item">Turn: <span id="c4oTurn">--</span></div>
          <div class="hud-item">Moves: <span id="c4oMoves">0</span></div>
          <div class="hud-item">Best: <span id="c4oBest">--</span></div>
        </div>
        <div class="connect4-board" id="c4oBoard"></div>
        <div class="notice" id="c4oSub">Waiting for another player...</div>
      `;
      root.appendChild(wrap);
      const lobbyUi = this.attachOnlineLobby(wrap);

      const statusEl = wrap.querySelector('#c4oStatus');
      const subEl = wrap.querySelector('#c4oSub');
      const meCard = wrap.querySelector('#c4oMeCard');
      const oppCard = wrap.querySelector('#c4oOppCard');
      const boardEl = wrap.querySelector('#c4oBoard');
      const turnEl = wrap.querySelector('#c4oTurn');
      const movesEl = wrap.querySelector('#c4oMoves');
      const bestEl = wrap.querySelector('#c4oBest');
      const findBtn = wrap.querySelector('#c4oFind');
      const leaveBtn = wrap.querySelector('#c4oLeave');

      const rows = 6;
      const cols = 7;
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.['connect-4-online'];
      let best = Number(bestEntry?.score || 0);
      bestEl.textContent = best > 0 ? String(best) : '--';

      const currentPlayerPayload = () => {
        const currentUser = core.getCurrentUser() || user;
        const avatar =
          typeof core.getAvatarPayload === 'function'
            ? core.getAvatarPayload(currentUser)
            : { avatarUrl: '', avatarPreset: '' };
        return {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: avatar.avatarUrl || '',
          avatarPreset: avatar.avatarPreset || ''
        };
      };

      const resolveAvatarUrl = (entry) => {
        if (!entry) return '';
        if (typeof core.resolveAvatarUrl === 'function') {
          return core.resolveAvatarUrl(entry) || '';
        }
        const url = String(entry.avatarUrl || '').trim();
        return /^https?:\/\//.test(url) ? url : '';
      };

      const renderPlayerCard = (el, playerData, fallback, role) => {
        el.innerHTML = '';
        const name = String(playerData?.username || fallback || 'Player');
        const avatarWrap = createEl('div', 'online-avatar');
        const avatarUrl = resolveAvatarUrl(playerData);
        if (avatarUrl) {
          const img = createEl('img');
          img.src = avatarUrl;
          img.alt = name;
          avatarWrap.appendChild(img);
        } else {
          avatarWrap.textContent = name.slice(0, 1).toUpperCase();
        }
        const meta = createEl('div', 'online-meta');
        const nameEl = createEl('div', 'online-name');
        nameEl.textContent = name;
        const roleEl = createEl('div', 'online-role');
        roleEl.textContent = role;
        meta.appendChild(nameEl);
        meta.appendChild(roleEl);
        el.appendChild(avatarWrap);
        el.appendChild(meta);
      };

      const makeEmptyBoard = () => Array.from({ length: rows }, () => Array(cols).fill(0));

      const isMyTurn = () =>
        !!matchState &&
        matchState.status === 'live' &&
        String(matchState.currentTurn || '') === user.id;

      const updateBoardInteractivity = () => {
        boardEl.style.pointerEvents = isMyTurn() ? 'auto' : 'none';
      };

      const renderBoard = (board, players) => {
        const matrix = Array.isArray(board) ? board : makeEmptyBoard();
        const p1 = players?.[0]?.id || '';
        const p2 = players?.[1]?.id || '';
        boardEl.innerHTML = '';
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            const cell = createEl('div', 'connect4-cell');
            const value = Number(matrix[r]?.[c] || 0);
            if (value) {
              const ownerId = value === 1 ? p1 : p2;
              if (ownerId === user.id) {
                cell.classList.add('player');
              } else {
                cell.classList.add('cpu');
              }
            }
            cell.dataset.col = String(c);
            boardEl.appendChild(cell);
          }
        }
        updateBoardInteractivity();
      };

      const setWaitingView = (message) => {
        const me = currentPlayerPayload();
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, null, 'Waiting...', 'Opponent');
        renderBoard(makeEmptyBoard(), []);
        statusEl.textContent = message || 'Waiting for another player...';
        subEl.textContent = 'Queue is live across devices.';
        turnEl.textContent = '--';
        movesEl.textContent = '0';
        matchState = null;
        matchId = '';
      };

      const handleNetworkError = (message) => {
        statusEl.textContent = 'Online server unavailable.';
        subEl.textContent = message || 'Try refreshing in a moment.';
        updateBoardInteractivity();
      };

      const postAction = async (action, extra = {}) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...extra })
          });
          const data = await response.json();
          if (!response.ok) {
            return { error: data?.error || `Request failed (${response.status})` };
          }
          return data;
        } catch (err) {
          return { error: 'Network error' };
        }
      };

      const renderMatch = (match) => {
        if (!match || !match.id) {
          setWaitingView('Waiting for another player...');
          return;
        }
        matchState = match;
        matchId = match.id;
        const players = Array.isArray(match.players) ? match.players : [];
        const me = players.find((p) => p.id === user.id) || currentPlayerPayload();
        const opponent = players.find((p) => p.id !== user.id) || null;
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, opponent, 'Waiting...', 'Opponent');
        renderBoard(match.board, players);

        movesEl.textContent = String(Number(match.moveCount || 0));

        if (match.status === 'finished') {
          shouldQueue = false;
          const draw = !!match.isDraw || !match.winnerId;
          turnEl.textContent = draw ? 'Draw' : 'Finished';
          if (draw) {
            statusEl.textContent = 'Match finished: draw.';
          } else if (String(match.winnerId) === user.id) {
            statusEl.textContent = `You beat ${opponent?.username || 'your opponent'}!`;
          } else {
            statusEl.textContent = `${opponent?.username || 'Opponent'} won this match.`;
          }
          subEl.textContent = match.reason || 'Press Find Match to play again.';
          if (!draw && String(match.winnerId) === user.id && lastScoredMatch !== match.id) {
            lastScoredMatch = match.id;
            const score = Math.max(40, 220 - Number(match.moveCount || 0) * 4);
            core.reportScore('connect-4-online', score, 'high');
            if (typeof core.reportOnlineWin === 'function') {
              core.reportOnlineWin('connect-4-online');
            }
            if (score > best) {
              best = score;
              bestEl.textContent = String(best);
            }
          }
          updateBoardInteractivity();
          return;
        }

        const myTurn = String(match.currentTurn || '') === user.id;
        turnEl.textContent = myTurn ? 'Your turn' : `${opponent?.username || 'Opponent'}`;
        statusEl.textContent = `Live match vs ${opponent?.username || 'Opponent'}.`;
        subEl.textContent = myTurn ? 'Choose a column to drop your disc.' : 'Opponent is thinking...';
        updateBoardInteractivity();
      };

      const applyState = (payload) => {
        if (!payload) return;
        this.renderOnlineLobby(lobbyUi, payload, user.id);
        if (payload.error) {
          handleNetworkError(payload.error);
          return;
        }
        if (payload.status === 'matched' && payload.match) {
          renderMatch(payload.match);
          return;
        }
        if (payload.status === 'waiting') {
          shouldQueue = true;
          const size = Number(payload.queueSize || 1);
          setWaitingView(payload.message || 'Waiting for another player...');
          subEl.textContent = `Queue size: ${size}`;
          return;
        }
        if (payload.status === 'idle' && shouldQueue) {
          statusEl.textContent = 'Rejoining queue...';
          joinQueue();
          return;
        }
        setWaitingView('Press Find Match to queue.');
      };

      const joinQueue = async () => {
        if (!active) return;
        shouldQueue = true;
        statusEl.textContent = 'Joining online queue...';
        const payload = await postAction('join', {
          player: currentPlayerPayload(),
          matchId
        });
        applyState(payload);
      };

      const pollState = async () => {
        if (!active || requestInFlight) return;
        requestInFlight = true;
        try {
          const payload = await postAction('state', {
            playerId: user.id,
            matchId
          });
          applyState(payload);
        } finally {
          requestInFlight = false;
        }
      };

      const makeMove = async (col) => {
        if (!active || !matchId || !isMyTurn()) return;
        const payload = await postAction('move', {
          playerId: user.id,
          matchId,
          col
        });
        applyState(payload);
      };

      const leaveCurrent = async () => {
        if (!active) return;
        shouldQueue = false;
        await postAction('leave', { playerId: user.id, matchId });
        setWaitingView('Left match. Press Find Match to queue again.');
      };

      let active = true;
      let matchId = '';
      let matchState = null;
      let pollTimer = null;
      let requestInFlight = false;
      let lastScoredMatch = '';
      let shouldQueue = true;

      boardEl.addEventListener('click', (event) => {
        const cell = event.target.closest('.connect4-cell');
        if (!cell) return;
        const col = Number(cell.dataset.col);
        if (!Number.isFinite(col)) return;
        makeMove(col);
      });

      findBtn.addEventListener('click', () => {
        shouldQueue = true;
        matchId = '';
        matchState = null;
        joinQueue();
      });

      leaveBtn.addEventListener('click', () => {
        leaveCurrent();
      });

      const handleUnload = () => {
        active = false;
        clearInterval(pollTimer);
        try {
          navigator.sendBeacon(
            endpoint,
            new Blob([JSON.stringify({ action: 'leave', playerId: user.id, matchId })], {
              type: 'application/json'
            })
          );
        } catch (err) {
          // no-op
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      setWaitingView('Connecting to online matchmaker...');
      joinQueue();
      pollTimer = setInterval(pollState, 1100);
    },
    memoryFlipOnline(root, core) {
      const endpoint = '/.netlify/functions/memory-flip-online';
      const user = core.getCurrentUser();
      if (!user) {
        root.innerHTML = '<div class="notice">Sign in to play online.</div>';
        return;
      }

      const wrap = createEl('div', 'memory-online');
      wrap.innerHTML = `
        <div class="rps-online-head">
          <div class="notice" id="mfoStatus">Connecting to online matchmaker...</div>
          <div class="rps-online-actions">
            <button class="btn ghost" id="mfoFind">Find Match</button>
            <button class="btn ghost" id="mfoLeave">Leave</button>
          </div>
        </div>
        <div class="rps-online-players">
          <div class="online-player" id="mfoMeCard"></div>
          <div class="rps-online-vs">VS</div>
          <div class="online-player" id="mfoOppCard"></div>
        </div>
        <div class="hud">
          <div class="hud-item">You Pairs: <span id="mfoMyPairs">0</span></div>
          <div class="hud-item">Opponent Pairs: <span id="mfoOppPairs">0</span></div>
          <div class="hud-item">Moves: <span id="mfoMoves">0</span></div>
          <div class="hud-item">Best: <span id="mfoBest">--</span></div>
        </div>
        <div class="memory-grid memory-online-grid" id="mfoBoard"></div>
        <div class="notice" id="mfoSub">Waiting for another player...</div>
      `;
      root.appendChild(wrap);
      const lobbyUi = this.attachOnlineLobby(wrap);

      const statusEl = wrap.querySelector('#mfoStatus');
      const subEl = wrap.querySelector('#mfoSub');
      const meCard = wrap.querySelector('#mfoMeCard');
      const oppCard = wrap.querySelector('#mfoOppCard');
      const boardEl = wrap.querySelector('#mfoBoard');
      const myPairsEl = wrap.querySelector('#mfoMyPairs');
      const oppPairsEl = wrap.querySelector('#mfoOppPairs');
      const movesEl = wrap.querySelector('#mfoMoves');
      const bestEl = wrap.querySelector('#mfoBest');
      const findBtn = wrap.querySelector('#mfoFind');
      const leaveBtn = wrap.querySelector('#mfoLeave');

      const emoji = ['🚀', '🎮', '🧠', '⚡', '🛰️', '🎯', '🧩', '🔷', '🌟', '🎲', '🔥', '🪐'];
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.['memory-flip-online'];
      let best = Number(bestEntry?.score || 0);
      bestEl.textContent = best > 0 ? String(best) : '--';

      const currentPlayerPayload = () => {
        const currentUser = core.getCurrentUser() || user;
        const avatar =
          typeof core.getAvatarPayload === 'function'
            ? core.getAvatarPayload(currentUser)
            : { avatarUrl: '', avatarPreset: '' };
        return {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: avatar.avatarUrl || '',
          avatarPreset: avatar.avatarPreset || ''
        };
      };

      const resolveAvatarUrl = (entry) => {
        if (!entry) return '';
        if (typeof core.resolveAvatarUrl === 'function') {
          return core.resolveAvatarUrl(entry) || '';
        }
        const url = String(entry.avatarUrl || '').trim();
        return /^https?:\/\//.test(url) ? url : '';
      };

      const renderPlayerCard = (el, playerData, fallback, role) => {
        el.innerHTML = '';
        const name = String(playerData?.username || fallback || 'Player');
        const avatarWrap = createEl('div', 'online-avatar');
        const avatarUrl = resolveAvatarUrl(playerData);
        if (avatarUrl) {
          const img = createEl('img');
          img.src = avatarUrl;
          img.alt = name;
          avatarWrap.appendChild(img);
        } else {
          avatarWrap.textContent = name.slice(0, 1).toUpperCase();
        }
        const meta = createEl('div', 'online-meta');
        const nameEl = createEl('div', 'online-name');
        nameEl.textContent = name;
        const roleEl = createEl('div', 'online-role');
        roleEl.textContent = role;
        meta.appendChild(nameEl);
        meta.appendChild(roleEl);
        el.appendChild(avatarWrap);
        el.appendChild(meta);
      };

      const hiddenCards = (size = 16) => Array.from({ length: size }, () => null);

      const canFlipCard = (index) => {
        if (!matchState || matchState.status !== 'live') return false;
        const my = matchState.my || {};
        const matched = Array.isArray(my.matched) ? my.matched : [];
        const open = Array.isArray(my.open) ? my.open : [];
        const cards = Array.isArray(matchState.cards) ? matchState.cards : [];
        if (my.locked) return false;
        if (matched.includes(index)) return false;
        if (open.includes(index)) return false;
        if (open.length >= 2) return false;
        if (cards[index] !== null && cards[index] !== undefined) return false;
        return true;
      };

      const renderBoard = (match) => {
        const cardList = Array.isArray(match?.cards) && match.cards.length ? match.cards : hiddenCards(16);
        boardEl.innerHTML = '';
        cardList.forEach((value, index) => {
          const card = createEl('button', 'memory-card memory-online-card');
          card.type = 'button';
          card.dataset.index = String(index);
          const inner = createEl('div', 'memory-inner');
          const faceValue = value === null || value === undefined ? '' : emoji[Number(value) % emoji.length] || '🧩';
          inner.innerHTML = `
            <div class="memory-face memory-front"></div>
            <div class="memory-face memory-back">${faceValue}</div>
          `;
          card.appendChild(inner);
          if (value !== null && value !== undefined) {
            card.classList.add('flipped');
          }
          const enabled = canFlipCard(index);
          if (enabled) {
            card.classList.add('can-flip');
            card.disabled = false;
          } else {
            card.disabled = true;
          }
          boardEl.appendChild(card);
        });
      };

      const setWaitingView = (message) => {
        const me = currentPlayerPayload();
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, null, 'Waiting...', 'Opponent');
        statusEl.textContent = message || 'Waiting for another player...';
        subEl.textContent = 'Queue is live across devices.';
        myPairsEl.textContent = '0';
        oppPairsEl.textContent = '0';
        movesEl.textContent = '0';
        matchState = null;
        matchId = '';
        renderBoard(null);
      };

      const handleNetworkError = (message) => {
        statusEl.textContent = 'Online server unavailable.';
        subEl.textContent = message || 'Try refreshing in a moment.';
      };

      const postAction = async (action, extra = {}) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...extra })
          });
          const data = await response.json();
          if (!response.ok) {
            return { error: data?.error || `Request failed (${response.status})` };
          }
          return data;
        } catch (err) {
          return { error: 'Network error' };
        }
      };

      const renderMatch = (match) => {
        if (!match || !match.id) {
          setWaitingView('Waiting for another player...');
          return;
        }
        matchState = match;
        matchId = match.id;
        const players = Array.isArray(match.players) ? match.players : [];
        const me = players.find((p) => p.id === user.id) || currentPlayerPayload();
        const opponent = players.find((p) => p.id !== user.id) || null;
        renderPlayerCard(meCard, me, me.username, 'You');
        renderPlayerCard(oppCard, opponent, 'Waiting...', 'Opponent');

        const my = match.my || {};
        const opp = match.opponent || {};
        const targetPairs = Number(match.targetPairs || 8);
        const myPairs = Number(my.matchedPairs || 0);
        const oppPairs = Number(opp.matchedPairs || 0);
        const moves = Number(my.moves || 0);
        myPairsEl.textContent = `${myPairs}/${targetPairs}`;
        oppPairsEl.textContent = `${oppPairs}/${targetPairs}`;
        movesEl.textContent = String(moves);
        renderBoard(match);

        if (match.status === 'finished') {
          shouldQueue = false;
          const youWon = String(match.winnerId || '') === user.id;
          if (!match.winnerId) {
            statusEl.textContent = 'Match finished.';
          } else if (youWon) {
            statusEl.textContent = `You won vs ${opponent?.username || 'opponent'}!`;
          } else {
            statusEl.textContent = `${opponent?.username || 'Opponent'} won the match.`;
          }
          subEl.textContent = match.reason || 'Press Find Match to play again.';
          if (lastScoredMatch !== match.id) {
            lastScoredMatch = match.id;
            const score =
              (youWon ? 250 : 0) + myPairs * 45 + Math.max(0, 180 - moves * 8);
            core.reportScore('memory-flip-online', score, 'high');
            if (youWon && typeof core.reportOnlineWin === 'function') {
              core.reportOnlineWin('memory-flip-online');
            }
            if (score > best) {
              best = score;
              bestEl.textContent = String(best);
            }
          }
          return;
        }

        if (my.locked) {
          statusEl.textContent = `Live race vs ${opponent?.username || 'opponent'}.`;
          subEl.textContent = 'No match this turn. Keep going.';
          return;
        }
        if (Array.isArray(my.open) && my.open.length === 1) {
          statusEl.textContent = `Live race vs ${opponent?.username || 'opponent'}.`;
          subEl.textContent = 'Pick one more card.';
          return;
        }
        statusEl.textContent = `Live race vs ${opponent?.username || 'opponent'}.`;
        subEl.textContent = 'Find all pairs before your opponent.';
      };

      const applyState = (payload) => {
        if (!payload) return;
        this.renderOnlineLobby(lobbyUi, payload, user.id);
        if (payload.error) {
          handleNetworkError(payload.error);
          return;
        }
        if (payload.status === 'matched' && payload.match) {
          renderMatch(payload.match);
          return;
        }
        if (payload.status === 'waiting') {
          shouldQueue = true;
          const size = Number(payload.queueSize || 1);
          setWaitingView(payload.message || 'Waiting for another player...');
          subEl.textContent = `Queue size: ${size}`;
          return;
        }
        if (payload.status === 'idle' && shouldQueue) {
          statusEl.textContent = 'Rejoining queue...';
          joinQueue();
          return;
        }
        setWaitingView('Press Find Match to queue.');
      };

      const joinQueue = async () => {
        if (!active) return;
        shouldQueue = true;
        statusEl.textContent = 'Joining online queue...';
        const payload = await postAction('join', {
          player: currentPlayerPayload(),
          matchId
        });
        applyState(payload);
      };

      const pollState = async () => {
        if (!active || requestInFlight) return;
        requestInFlight = true;
        try {
          const payload = await postAction('state', {
            playerId: user.id,
            matchId
          });
          applyState(payload);
        } finally {
          requestInFlight = false;
        }
      };

      const flipCard = async (index) => {
        if (!active || !matchId || !canFlipCard(index)) return;
        const payload = await postAction('flip', {
          playerId: user.id,
          matchId,
          index
        });
        applyState(payload);
      };

      const leaveCurrent = async () => {
        if (!active) return;
        shouldQueue = false;
        await postAction('leave', { playerId: user.id, matchId });
        setWaitingView('Left match. Press Find Match to queue again.');
      };

      let active = true;
      let matchId = '';
      let matchState = null;
      let pollTimer = null;
      let requestInFlight = false;
      let lastScoredMatch = '';
      let shouldQueue = true;

      boardEl.addEventListener('click', (event) => {
        const card = event.target.closest('.memory-online-card');
        if (!card) return;
        const index = Number(card.dataset.index);
        if (!Number.isFinite(index)) return;
        flipCard(index);
      });

      findBtn.addEventListener('click', () => {
        shouldQueue = true;
        matchId = '';
        matchState = null;
        joinQueue();
      });
      leaveBtn.addEventListener('click', () => {
        leaveCurrent();
      });

      const handleUnload = () => {
        active = false;
        clearInterval(pollTimer);
        try {
          navigator.sendBeacon(
            endpoint,
            new Blob([JSON.stringify({ action: 'leave', playerId: user.id, matchId })], {
              type: 'application/json'
            })
          );
        } catch (err) {
          // no-op
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      setWaitingView('Connecting to online matchmaker...');
      joinQueue();
      pollTimer = setInterval(pollState, 700);
    },
    memoryFlip(root, core) {
      const wrap = createEl('div', 'click-rush');
      const hud = createEl('div', 'hud');
      hud.innerHTML = `
        <div class="hud-item">Moves: <span id="memMoves">0</span></div>
        <div class="hud-item">Time: <span id="memTime">0:00</span></div>
        <div class="hud-item">Best: <span id="memBest">--</span></div>
      `;
      const grid = createEl('div', 'memory-grid');
      const result = createEl('div', 'notice');
      result.style.display = 'none';
      const controls = createEl('div', 'hud');
      const shuffleBtn = createEl('button', 'btn ghost', 'Shuffle');
      controls.appendChild(shuffleBtn);
      wrap.appendChild(hud);
      wrap.appendChild(controls);
      wrap.appendChild(grid);
      wrap.appendChild(result);
      root.appendChild(wrap);

      const emojis = ['🚀', '🎮', '🧠', '⚡', '🛰️', '🎯', '🧩', '🔷', '🌟', '🎲'];
      let first = null;
      let second = null;
      let lock = false;
      let moves = 0;
      let matched = 0;
      let startTime = null;
      let timer = null;
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.['memory-flip'];
      if (bestEntry) document.getElementById('memBest').textContent = bestEntry.score;

      const updateTimer = () => {
        if (!startTime) return;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = String(elapsed % 60).padStart(2, '0');
        document.getElementById('memTime').textContent = `${minutes}:${seconds}`;
      };

      const handleMatch = (totalCards) => {
        if (first.dataset.value === second.dataset.value) {
          matched += 2;
          first = null;
          second = null;
          if (matched === totalCards) {
            clearInterval(timer);
            result.style.display = 'block';
            result.textContent = `Completed in ${moves} moves.`;
            core.reportScore('memory-flip', moves, 'low');
            const updated = core.getCurrentUser()?.stats?.bestScores?.['memory-flip'];
            if (updated) document.getElementById('memBest').textContent = updated.score;
          }
        } else {
          lock = true;
          setTimeout(() => {
            first.classList.remove('flipped');
            second.classList.remove('flipped');
            first = null;
            second = null;
            lock = false;
          }, 700);
        }
      };

      const buildGrid = () => {
        const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
        grid.innerHTML = '';
        cards.forEach((emoji) => {
          const card = createEl('div', 'memory-card');
          card.dataset.value = emoji;
          const inner = createEl('div', 'memory-inner');
          inner.innerHTML = `
            <div class="memory-face memory-front"></div>
            <div class="memory-face memory-back">${emoji}</div>
          `;
          card.appendChild(inner);
          card.addEventListener('click', () => {
            if (lock || card.classList.contains('flipped')) return;
            if (!startTime) {
              startTime = Date.now();
              timer = setInterval(updateTimer, 1000);
            }
            card.classList.add('flipped');
            if (!first) {
              first = card;
              return;
            }
            second = card;
            moves += 1;
            document.getElementById('memMoves').textContent = moves;
            handleMatch(cards.length);
          });
          grid.appendChild(card);
        });
      };

      const resetGame = () => {
        clearInterval(timer);
        first = null;
        second = null;
        lock = false;
        moves = 0;
        matched = 0;
        startTime = null;
        timer = null;
        document.getElementById('memMoves').textContent = '0';
        document.getElementById('memTime').textContent = '0:00';
        result.style.display = 'none';
        grid.classList.add('shuffling');
        buildGrid();
        setTimeout(() => grid.classList.remove('shuffling'), 500);
      };

      shuffleBtn.addEventListener('click', resetGame);
      buildGrid();
    },
    snake(root, core) {
      const wrap = createEl('div', 'canvas-wrap');
      const hud = createEl('div', 'hud');
      hud.innerHTML = `
        <div class="hud-item">Score: <span id="snakeScore">0</span></div>
        <div class="hud-item">Best: <span id="snakeBest">--</span></div>
      `;
      const canvas = createEl('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const overlay = createEl('div', 'game-overlay');
      overlay.innerHTML = '<div>Game Over</div>';
      const restart = createEl('button', 'btn primary', 'Restart');
      overlay.appendChild(restart);
      wrap.appendChild(canvas);
      wrap.appendChild(overlay);
      root.appendChild(hud);
      root.appendChild(wrap);

      const ctx = canvas.getContext('2d');
      const gridSize = 20;
      const tile = canvas.width / gridSize;
      let snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 }
      ];
      let dir = { x: 1, y: 0 };
      let nextDir = { x: 1, y: 0 };
      let food = { x: 5, y: 5 };
      let score = 0;
      let running = true;
      let loop = null;
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.snake;
      if (bestEntry) document.getElementById('snakeBest').textContent = bestEntry.score;

      const placeFood = () => {
        let pos;
        do {
          pos = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
          };
        } while (snake.some((seg) => seg.x === pos.x && seg.y === pos.y));
        food = pos;
      };

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bg.addColorStop(0, '#0b1024');
        bg.addColorStop(1, '#111a3a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(109, 213, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i += 1) {
          const pos = i * tile;
          ctx.beginPath();
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, pos);
          ctx.lineTo(canvas.width, pos);
          ctx.stroke();
        }

        const centerOf = (seg) => ({
          x: seg.x * tile + tile / 2,
          y: seg.y * tile + tile / 2
        });

        if (snake.length > 0) {
          ctx.save();
          ctx.strokeStyle = '#5cffb0';
          ctx.lineWidth = tile * 0.68;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(92, 255, 176, 0.6)';
          ctx.beginPath();
          const head = centerOf(snake[0]);
          ctx.moveTo(head.x, head.y);
          for (let i = 1; i < snake.length; i += 1) {
            const p = centerOf(snake[i]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.restore();

          // Head
          ctx.save();
          ctx.fillStyle = '#36f59a';
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(54, 245, 154, 0.5)';
          ctx.beginPath();
          ctx.arc(head.x, head.y, tile * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Eyes
          ctx.fillStyle = '#0b1024';
          const eyeOffset = tile * 0.14;
          ctx.beginPath();
          ctx.arc(head.x - eyeOffset, head.y - eyeOffset, tile * 0.05, 0, Math.PI * 2);
          ctx.arc(head.x + eyeOffset, head.y - eyeOffset, tile * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }

        // Food
        ctx.save();
        ctx.fillStyle = '#ffb347';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 179, 71, 0.6)';
        ctx.beginPath();
        ctx.arc(food.x * tile + tile / 2, food.y * tile + tile / 2, tile * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const step = () => {
        if (!running) return;
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (
          head.x < 0 ||
          head.x >= gridSize ||
          head.y < 0 ||
          head.y >= gridSize ||
          snake.some((seg) => seg.x === head.x && seg.y === head.y)
        ) {
          running = false;
          overlay.classList.add('show');
          core.reportScore('snake', score, 'high');
          const updated = core.getCurrentUser()?.stats?.bestScores?.snake;
          if (updated) document.getElementById('snakeBest').textContent = updated.score;
          return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 1;
          document.getElementById('snakeScore').textContent = score;
          placeFood();
        } else {
          snake.pop();
        }
        draw();
      };

      const reset = () => {
        snake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 }
        ];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        document.getElementById('snakeScore').textContent = score;
        overlay.classList.remove('show');
        running = true;
        placeFood();
        draw();
      };

      window.addEventListener('keydown', (event) => {
        const key = KEYMAP[event.key];
        if (!key) return;
        event.preventDefault();
        if (key === 'up' && dir.y === 1) return;
        if (key === 'down' && dir.y === -1) return;
        if (key === 'left' && dir.x === 1) return;
        if (key === 'right' && dir.x === -1) return;
        nextDir =
          key === 'up'
            ? { x: 0, y: -1 }
            : key === 'down'
            ? { x: 0, y: 1 }
            : key === 'left'
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
      });

      restart.addEventListener('click', reset);
      placeFood();
      draw();
      clearInterval(loop);
      loop = setInterval(step, 120);
    },
    tetris(root, core) {
      const wrap = createEl('div', 'tetris-panel');
      const canvasWrap = createEl('div', 'canvas-wrap');
      const canvas = createEl('canvas');
      canvas.width = 240;
      canvas.height = 480;
      canvasWrap.appendChild(canvas);
      const overlay = createEl('div', 'game-overlay');
      overlay.innerHTML = '<div>Game Over</div>';
      const restart = createEl('button', 'btn primary', 'Restart');
      overlay.appendChild(restart);
      canvasWrap.appendChild(overlay);
      const stats = createEl('div', 'tetris-stats');
      stats.innerHTML = `
        <div class="hud-item">Score: <span id="tetrisScore">0</span></div>
        <div class="hud-item">Lines: <span id="tetrisLines">0</span></div>
        <div class="hud-item">Level: <span id="tetrisLevel">1</span></div>
        <div class="hud-item">Next:</div>
        <canvas id="tetrisNext" width="120" height="120"></canvas>
      `;
      wrap.appendChild(canvasWrap);
      wrap.appendChild(stats);
      root.appendChild(wrap);

      const ctx = canvas.getContext('2d');
      const nextCanvas = stats.querySelector('#tetrisNext');
      const nextCtx = nextCanvas.getContext('2d');
      const cols = 10;
      const rows = 20;
      const scale = canvas.width / cols;
      let board = Array.from({ length: rows }, () => Array(cols).fill(0));
      const pieces = {
        I: [[1, 1, 1, 1]],
        O: [
          [1, 1],
          [1, 1]
        ],
        T: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        S: [
          [0, 1, 1],
          [1, 1, 0]
        ],
        Z: [
          [1, 1, 0],
          [0, 1, 1]
        ],
        J: [
          [1, 0, 0],
          [1, 1, 1]
        ],
        L: [
          [0, 0, 1],
          [1, 1, 1]
        ]
      };
      const colors = {
        I: '#6dd5ff',
        O: '#ffb347',
        T: '#8b5cff',
        S: '#5cffb0',
        Z: '#ff5f7a',
        J: '#6dd5ff',
        L: '#ffd84d'
      };

      let current = null;
      let next = null;
      let pos = { x: 0, y: 0 };
      let dropInterval = 550;
      let lastDrop = 0;
      let score = 0;
      let lines = 0;
      let level = 1;
      let running = true;

      const drawMatrix = (matrix, offset, context, colorOverride) => {
        matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              context.fillStyle = colorOverride || colors[current.type];
              context.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale - 2, scale - 2);
            }
          });
        });
      };

      const collide = (boardRef, piece, offset) => {
        for (let y = 0; y < piece.matrix.length; y += 1) {
          for (let x = 0; x < piece.matrix[y].length; x += 1) {
            if (piece.matrix[y][x]) {
              const boardY = y + offset.y;
              const boardX = x + offset.x;
              if (boardY >= rows || boardX < 0 || boardX >= cols || boardRef[boardY]?.[boardX]) {
                return true;
              }
            }
          }
        }
        return false;
      };

      const merge = () => {
        current.matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              board[y + pos.y][x + pos.x] = current.type;
            }
          });
        });
      };

      const rotate = (matrix) => matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());

      const clearLines = () => {
        let cleared = 0;
        board = board.filter((row) => {
          if (row.every((cell) => cell)) {
            cleared += 1;
            return false;
          }
          return true;
        });
        while (board.length < rows) {
          board.unshift(Array(cols).fill(0));
        }
        if (cleared > 0) {
          lines += cleared;
          score += cleared * 100;
          level = Math.floor(lines / 5) + 1;
          dropInterval = Math.max(120, 800 - (level - 1) * 60);
          document.getElementById('tetrisScore').textContent = score;
          document.getElementById('tetrisLines').textContent = lines;
          document.getElementById('tetrisLevel').textContent = level;
        }
      };

      const draw = () => {
        ctx.fillStyle = '#0b1024';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        board.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              ctx.fillStyle = colors[cell];
              ctx.fillRect(x * scale, y * scale, scale - 2, scale - 2);
            }
          });
        });
        if (current) {
          // Ghost piece
          let ghostY = pos.y;
          while (!collide(board, current, { x: pos.x, y: ghostY + 1 })) {
            ghostY += 1;
          }
          const ghostColor = 'rgba(255, 255, 255, 0.15)';
          drawMatrix(current.matrix, { x: pos.x, y: ghostY }, ctx, ghostColor);
          drawMatrix(current.matrix, pos, ctx);
        }
      };

      const drawNext = () => {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        nextCtx.fillStyle = '#0b1024';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        const matrix = next.matrix;
        matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              nextCtx.fillStyle = colors[next.type];
              nextCtx.fillRect(x * 24 + 12, y * 24 + 12, 22, 22);
            }
          });
        });
      };

      const spawn = () => {
        if (!next) {
          next = randomPiece();
        }
        current = next;
        next = randomPiece();
        pos = {
          x: Math.floor(cols / 2) - Math.floor(current.matrix[0].length / 2),
          y: 0
        };
        drawNext();
        if (collide(board, current, pos)) {
          running = false;
          overlay.classList.add('show');
          core.reportScore('tetris', score, 'high');
        }
      };

      const randomPiece = () => {
        const keys = Object.keys(pieces);
        const type = keys[Math.floor(Math.random() * keys.length)];
        return { type, matrix: pieces[type].map((row) => [...row]) };
      };

      const drop = () => {
        pos.y += 1;
        if (collide(board, current, pos)) {
          pos.y -= 1;
          merge();
          clearLines();
          spawn();
        }
      };

      const hardDrop = () => {
        while (!collide(board, current, { x: pos.x, y: pos.y + 1 })) {
          pos.y += 1;
        }
        drop();
      };

      const update = (time = 0) => {
        if (!running) return;
        const delta = time - lastDrop;
        if (delta > dropInterval) {
          drop();
          lastDrop = time;
        }
        draw();
        requestAnimationFrame(update);
      };

      const reset = () => {
        board = Array.from({ length: rows }, () => Array(cols).fill(0));
        score = 0;
        lines = 0;
        level = 1;
        running = true;
        overlay.classList.remove('show');
        document.getElementById('tetrisScore').textContent = score;
        document.getElementById('tetrisLines').textContent = lines;
        document.getElementById('tetrisLevel').textContent = level;
        next = null;
        spawn();
      };

      window.addEventListener('keydown', (event) => {
        if (!current || !running) return;
        if (event.key === 'ArrowLeft') {
          pos.x -= 1;
          if (collide(board, current, pos)) pos.x += 1;
        } else if (event.key === 'ArrowRight') {
          pos.x += 1;
          if (collide(board, current, pos)) pos.x -= 1;
        } else if (event.key === 'ArrowDown') {
          drop();
        } else if (event.key === 'ArrowUp') {
          const rotated = rotate(current.matrix);
          const old = current.matrix;
          current.matrix = rotated;
          if (collide(board, current, pos)) {
            current.matrix = old;
          }
        } else if (event.code === 'Space') {
          hardDrop();
        }
      });

      restart.addEventListener('click', reset);
      spawn();
      update();
    },
    embedGame(root, core, game) {
      const wrap = createEl('div', 'unblocked-embed');
      const toolbar = createEl('div', 'embed-toolbar');
      const title = createEl('div', 'notice');
      title.textContent = 'Embedded Game';
      const fullBtn = createEl('button', 'btn ghost', 'Fullscreen Game');
      toolbar.appendChild(title);
      toolbar.appendChild(fullBtn);
      const shell = createEl('div', 'embed-shell');
      shell.classList.add(`embed-shell-${game.id}`);
      const frame = createEl('iframe', 'embed-frame');
      frame.src = game.embed;
      frame.allow = 'fullscreen *; autoplay *; gamepad *';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('loading', 'eager');
      frame.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock allow-downloads allow-orientation-lock allow-presentation'
      );
      frame.referrerPolicy = 'no-referrer';
      const adBlockEnabled = typeof core.isAdBlockEnabled === 'function' ? core.isAdBlockEnabled() : true;
      title.textContent = adBlockEnabled ? 'Embedded Game · Ad Blocker On' : 'Embedded Game';
      const isCarGame =
        game.id === 'escape-road' || game.id === 'escape-road-2' || game.id === 'parking-fury-3';
      const adUrlNeedles = [
        'doubleclick.net',
        'googlesyndication.com',
        'googleads.g.doubleclick.net',
        'googletagmanager.com',
        'google-analytics.com',
        'adservice.google.com',
        'adnxs.com',
        'taboola.com',
        'outbrain.com',
        'unityads',
        'imasdk.googleapis.com',
        'adsmoloco.com',
        'adsystem.com',
        'adskeeper.com',
        'adtraffic',
        'adroll.com',
        'smartadserver.com',
        'moatads.com',
        'scorecardresearch.com',
        'amazon-adsystem.com'
      ];
      const adNodeSelector = [
        '#imaContainer',
        '#imaContainer_new',
        '#button',
        '.main-panel-ads',
        '.adsbox',
        '.ad-container',
        '.ad-wrapper',
        '.ad-banner',
        '[id^="google_ads"]',
        '[id*="google_ads"]',
        '[id*="ad-container"]',
        '[class*="ad-slot"]',
        '[data-ad]',
        '[data-ad-client]',
        '[data-ad-slot]',
        'ins.adsbygoogle',
        'script[src*="doubleclick"]',
        'script[src*="googlesyndication"]',
        'script[src*="googletagmanager"]',
        'script[src*="google-analytics"]',
        'script[src*="adservice"]',
        'script[src*="adnxs"]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'iframe[src*="googleads"]',
        'iframe[src*="adnxs"]',
        'iframe[src*="adservice"]',
        'iframe[src*="taboola"]',
        'iframe[src*="outbrain"]'
      ].join(', ');
      const isBlockedAdUrl = (value) => {
        const url = String(value || '').toLowerCase();
        return adUrlNeedles.some((needle) => url.includes(needle));
      };

      const installEmbedAdShield = () => {
        if (!adBlockEnabled) return;
        let win;
        let doc;
        try {
          win = frame.contentWindow;
          doc = frame.contentDocument || (win ? win.document : null);
        } catch (error) {
          return;
        }
        if (!win || !doc) return;

        const scrubAdNodes = () => {
          try {
            doc.querySelectorAll(adNodeSelector).forEach((node) => node.remove());
            doc.querySelectorAll('script[src], iframe[src], img[src], link[href]').forEach((node) => {
              const url = node.src || node.href || '';
              if (isBlockedAdUrl(url)) {
                node.remove();
              }
            });
          } catch (error) {}
        };

        if (!win.__lsAdShield) {
          win.__lsAdShield = true;
          const popupMock = {
            closed: false,
            close() {
              this.closed = true;
            },
            focus() {},
            blur() {},
            postMessage() {}
          };
          try {
            Object.defineProperty(win, 'open', {
              configurable: true,
              enumerable: false,
              writable: true,
              value: () => popupMock
            });
          } catch (error) {
            try {
              win.open = () => popupMock;
            } catch (innerError) {}
          }

          if (!doc.getElementById('ls-ad-shield-style')) {
            const style = doc.createElement('style');
            style.id = 'ls-ad-shield-style';
            style.textContent = `
              ${adNodeSelector} {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
              }
            `;
            if (doc.head) doc.head.appendChild(style);
          }
          if (win.MutationObserver && !win.__lsAdShieldObserver) {
            win.__lsAdShieldObserver = new win.MutationObserver((mutations) => {
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                  if (!node || node.nodeType !== 1) continue;
                  if (node.matches && node.matches(adNodeSelector)) {
                    node.remove();
                    continue;
                  }
                  const nodeUrl = node.src || node.href || '';
                  if (isBlockedAdUrl(nodeUrl)) {
                    node.remove();
                  }
                }
              }
            });
            const rootNode = doc.documentElement || doc.body;
            if (rootNode) {
              win.__lsAdShieldObserver.observe(rootNode, { childList: true, subtree: true });
            }
          }
        }

        scrubAdNodes();
        if (!win.__lsAdShieldTimer) {
          win.__lsAdShieldTimer = win.setInterval(() => {
            scrubAdNodes();
          }, 1200);
        }
      };

      const installAzgamesScanner = () => {
        if (!isCarGame) return;
        let win;
        let doc;
        try {
          win = frame.contentWindow;
          doc = frame.contentDocument || (win ? win.document : null);
        } catch (error) {
          return;
        }
        if (!win || !doc) return;

        const looksBig = (el) => {
          if (!el || typeof el.getBoundingClientRect !== 'function') return false;
          const rect = el.getBoundingClientRect();
          if (!rect || rect.width < 180 || rect.height < 30) return false;
          const style = win.getComputedStyle ? win.getComputedStyle(el) : null;
          if (style) {
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) < 0.3) {
              return false;
            }
            const fontSize = parseFloat(style.fontSize || '0');
            const area = rect.width * rect.height;
            return fontSize >= 34 || area >= 14000;
          }
          return true;
        };

        const hasBigAzgamesText = () => {
          const nodes = doc.querySelectorAll('h1,h2,h3,h4,p,span,div,a,strong,b,button');
          for (const node of nodes) {
            const text = String(node.textContent || '')
              .toUpperCase()
              .replace(/\s+/g, '');
            if (!text.includes('AZGAMES.IO')) continue;
            if (looksBig(node)) return true;
          }
          return false;
        };

        const refreshEmbed = () => {
          const now = Date.now();
          if (now - (frame.__lsAzRefreshAt || 0) < 4000) return;
          frame.__lsAzRefreshAt = now;
          const base = String(game.embed || frame.src || '').split('#')[0];
          frame.src = `${base}${base.includes('?') ? '&' : '?'}ls_refresh=${now}`;
        };

        const scan = () => {
          try {
            if (hasBigAzgamesText()) {
              refreshEmbed();
            }
          } catch (error) {}
        };

        scan();
        if (!win.__lsAzgamesScanTimer) {
          win.__lsAzgamesScanTimer = win.setInterval(scan, 1200);
        }
      };

      frame.addEventListener('load', installEmbedAdShield);
      frame.addEventListener('load', installAzgamesScanner);
      if (game.id === 'pacman') {
        frame.style.height = '760px';
      }
      shell.appendChild(frame);
      const fsHud = createEl('div', 'embed-fs-overlay');
      const fsAnnouncement = createEl(
        'div',
        'embed-fs-announcement',
        `
          <div class="embed-fs-title">Global Announcement</div>
          <div class="embed-fs-announcement-text">No active announcement.</div>
        `
      );
      fsAnnouncement.style.display = 'none';
      const fsChat = createEl(
        'div',
        'embed-fs-chat',
        `
          <div class="embed-fs-title">Live Chat</div>
          <div class="embed-fs-chat-list">
            <div class="embed-fs-chat-empty">No chat yet.</div>
          </div>
        `
      );
      const fsAnnouncementText = fsAnnouncement.querySelector('.embed-fs-announcement-text');
      const fsChatList = fsChat.querySelector('.embed-fs-chat-list');
      const readAnnouncement = () => {
        const message = document.querySelector('#globalAnnouncementBar .global-announcement-text')?.textContent?.trim();
        const author = document.querySelector('#globalAnnouncementBar .global-announcement-author')?.textContent?.trim();
        const time = document.querySelector('#globalAnnouncementBar .global-announcement-time')?.textContent?.trim();
        if (!message) return '';
        const parts = [message];
        if (author) parts.push(author);
        if (time) parts.push(time);
        return parts.join(' · ');
      };
      const readChatPreviewLines = () => {
        const rows = [...document.querySelectorAll('#gameChatList .game-chat-row')];
        if (!rows.length) return [];
        return rows
          .slice(-5)
          .map((row) => {
            const name = row.querySelector('.game-chat-meta strong')?.textContent?.trim() || 'Player';
            const text = row.querySelector('.game-chat-text')?.textContent?.trim() || '';
            if (!text) return '';
            return `${name}: ${text}`;
          })
          .filter(Boolean);
      };
      const renderFullscreenHud = () => {
        const announcement = readAnnouncement();
        fsAnnouncement.style.display = announcement ? 'block' : 'none';
        if (fsAnnouncementText) {
          fsAnnouncementText.textContent = announcement || '';
        }
        if (fsChatList) {
          const lines = readChatPreviewLines();
          fsChatList.innerHTML = '';
          if (!lines.length) {
            const empty = createEl('div', 'embed-fs-chat-empty');
            empty.textContent = 'No chat yet.';
            fsChatList.appendChild(empty);
            return;
          }
          lines.forEach((line) => {
            const lineEl = createEl('div', 'embed-fs-chat-line');
            lineEl.textContent = line;
            fsChatList.appendChild(lineEl);
          });
        }
      };
      fsHud.appendChild(fsAnnouncement);
      fsHud.appendChild(fsChat);
      shell.appendChild(fsHud);
      const fallback = createEl('div', 'notice');
      fallback.innerHTML = `If the game does not load, <a href="${game.embed}" target="_blank">open it in a new tab</a>.`;
      wrap.appendChild(toolbar);
      wrap.appendChild(shell);
      wrap.appendChild(fallback);

      if (game.manualScore) {
        const panel = createEl('div', 'card score-panel');
        panel.innerHTML = `
          <div class="field">
            <label>${game.manualScoreLabel || 'Score'}</label>
            <input type="number" min="0" step="1" placeholder="Enter ${game.manualScoreLabel || 'score'}" />
          </div>
          <button class="btn primary">Save Score</button>
          <div class="notice">Use the in-game distance and save it here to update your LogiSchool points.</div>
        `;
        const input = panel.querySelector('input');
        const btn = panel.querySelector('button');
        btn.addEventListener('click', () => {
          const value = Number(input.value);
          if (!Number.isFinite(value) || value < 0) {
            core.showToast('Enter a valid score.');
            return;
          }
          core.reportScore(game.id, value, game.scoreMode || 'high');
          input.value = '';
          core.showToast('Score saved.');
        });
        wrap.appendChild(panel);
      }

      root.appendChild(wrap);

      fullBtn.addEventListener('click', () => {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (fullscreenElement === shell) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
          return;
        }
        if (shell.requestFullscreen) {
          shell.requestFullscreen();
        } else if (shell.webkitRequestFullscreen) {
          shell.webkitRequestFullscreen();
        }
      });

      const updateFullscreenState = () => {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        const active = fullscreenElement === shell;
        fullBtn.textContent = active ? 'Exit Fullscreen' : 'Fullscreen Game';
        if (active) {
          renderFullscreenHud();
          if (!shell.__lsHudTimer) {
            shell.__lsHudTimer = setInterval(renderFullscreenHud, 1200);
          }
        } else if (shell.__lsHudTimer) {
          clearInterval(shell.__lsHudTimer);
          shell.__lsHudTimer = null;
        }
      };

      document.addEventListener('fullscreenchange', updateFullscreenState);
      document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    },
    pacman(root, core) {
      const wrap = createEl('div', 'canvas-wrap');
      const hud = createEl('div', 'pacman-hud');
      hud.innerHTML = `
        <div class="hud-item">Score: <span id="pacScore">0</span></div>
        <div class="hud-item">Best: <span id="pacBest">--</span></div>
      `;
      const canvas = createEl('canvas');
      canvas.width = 420;
      canvas.height = 420;
      const overlay = createEl('div', 'game-overlay');
      overlay.innerHTML = '<div>Pacman down!</div>';
      const retry = createEl('button', 'btn primary', 'Retry');
      overlay.appendChild(retry);
      wrap.appendChild(canvas);
      wrap.appendChild(overlay);
      root.appendChild(hud);
      root.appendChild(wrap);

      const ctx = canvas.getContext('2d');
      const gridSize = 15;
      const tile = canvas.width / gridSize;
      const map = [
        '111111111111111',
        '100000001000001',
        '101111101011101',
        '101000101000101',
        '101011101110101',
        '100010000010001',
        '111010111010111',
        '100000100000001',
        '101110111011101',
        '101000000000101',
        '101011111110101',
        '100000001000001',
        '101111101011101',
        '100000000000001',
        '111111111111111'
      ];
      let dots = [];
      let pacman = { x: 1, y: 1, dir: { x: 1, y: 0 } };
      let ghosts = [
        { x: 13, y: 13, dir: { x: -1, y: 0 }, color: '#ff5f7a' },
        { x: 13, y: 1, dir: { x: 0, y: 1 }, color: '#6dd5ff' },
        { x: 1, y: 13, dir: { x: 1, y: 0 }, color: '#ffb347' }
      ];
      let score = 0;
      let running = true;
      let trail = [];
      const bestEntry = core.getCurrentUser()?.stats?.bestScores?.pacman;
      if (bestEntry) document.getElementById('pacBest').textContent = bestEntry.score;

      const user = core.getCurrentUser();
      const points = core.computePoints(user);
      const skin = core.data.pacmanSkins.find((s) => s.id === user?.cosmetics?.pacmanSkin) ||
        core.data.pacmanSkins[0];
      const trailSetting =
        core.data.pacmanTrails.find((t) => t.id === user?.cosmetics?.pacmanTrail) ||
        core.data.pacmanTrails[0];

      const isWall = (x, y) => map[y]?.[x] === '1';
      const initDots = () => {
        dots = [];
        for (let y = 0; y < map.length; y += 1) {
          for (let x = 0; x < map[y].length; x += 1) {
            if (map[y][x] === '0') dots.push({ x, y });
          }
        }
      };

      const draw = () => {
        ctx.fillStyle = '#0b1024';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < map.length; y += 1) {
          for (let x = 0; x < map[y].length; x += 1) {
            if (map[y][x] === '1') {
              ctx.fillStyle = '#202b55';
              ctx.fillRect(x * tile, y * tile, tile, tile);
            }
          }
        }
        ctx.fillStyle = '#f3f5ff';
        dots.forEach((dot) => {
          ctx.beginPath();
          ctx.arc(dot.x * tile + tile / 2, dot.y * tile + tile / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        if (trailSetting.id !== 'none') {
          ctx.fillStyle = trailSetting.color;
          trail.forEach((pos, index) => {
            ctx.globalAlpha = 0.3 + index / trail.length;
            ctx.beginPath();
            ctx.arc(pos.x * tile + tile / 2, pos.y * tile + tile / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = skin.color;
        ctx.beginPath();
        ctx.arc(pacman.x * tile + tile / 2, pacman.y * tile + tile / 2, tile / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ghosts.forEach((ghost) => {
          ctx.fillStyle = ghost.color;
          ctx.beginPath();
          ctx.arc(ghost.x * tile + tile / 2, ghost.y * tile + tile / 2, tile / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      const moveEntity = (entity) => {
        const nx = entity.x + entity.dir.x;
        const ny = entity.y + entity.dir.y;
        if (!isWall(nx, ny)) {
          entity.x = nx;
          entity.y = ny;
        }
      };

      const updatePacman = () => {
        const nx = pacman.x + pacman.dir.x;
        const ny = pacman.y + pacman.dir.y;
        if (!isWall(nx, ny)) {
          pacman.x = nx;
          pacman.y = ny;
          trail.push({ x: pacman.x, y: pacman.y });
          if (trail.length > 6) trail.shift();
        }
        const dotIndex = dots.findIndex((dot) => dot.x === pacman.x && dot.y === pacman.y);
        if (dotIndex !== -1) {
          dots.splice(dotIndex, 1);
          score += 1;
          document.getElementById('pacScore').textContent = score;
        }
      };

      const updateGhost = (ghost) => {
        const options = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ].filter((dir) => !isWall(ghost.x + dir.x, ghost.y + dir.y));
        options.sort(
          (a, b) =>
            Math.abs(pacman.x - (ghost.x + a.x)) + Math.abs(pacman.y - (ghost.y + a.y)) -
            (Math.abs(pacman.x - (ghost.x + b.x)) + Math.abs(pacman.y - (ghost.y + b.y)))
        );
        ghost.dir = options[0] || ghost.dir;
        moveEntity(ghost);
      };

      const tick = () => {
        if (!running) return;
        updatePacman();
        ghosts.forEach(updateGhost);
        if (ghosts.some((g) => g.x === pacman.x && g.y === pacman.y)) {
          running = false;
          overlay.classList.add('show');
          core.reportScore('pacman', score, 'high');
          const updated = core.getCurrentUser()?.stats?.bestScores?.pacman;
          if (updated) document.getElementById('pacBest').textContent = updated.score;
          return;
        }
        if (dots.length === 0) {
          running = false;
          overlay.classList.add('show');
          overlay.firstChild.textContent = 'You cleared the maze!';
          core.reportScore('pacman', score, 'high');
          const updated = core.getCurrentUser()?.stats?.bestScores?.pacman;
          if (updated) document.getElementById('pacBest').textContent = updated.score;
          return;
        }
        draw();
      };

      const reset = () => {
        pacman = { x: 1, y: 1, dir: { x: 1, y: 0 } };
        ghosts = [
          { x: 13, y: 13, dir: { x: -1, y: 0 }, color: '#ff5f7a' },
          { x: 13, y: 1, dir: { x: 0, y: 1 }, color: '#6dd5ff' },
          { x: 1, y: 13, dir: { x: 1, y: 0 }, color: '#ffb347' }
        ];
        score = 0;
        trail = [];
        running = true;
        overlay.classList.remove('show');
        document.getElementById('pacScore').textContent = score;
        initDots();
        draw();
      };

      window.addEventListener('keydown', (event) => {
        const key = KEYMAP[event.key];
        if (!key) return;
        event.preventDefault();
        pacman.dir =
          key === 'up'
            ? { x: 0, y: -1 }
            : key === 'down'
            ? { x: 0, y: 1 }
            : key === 'left'
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
      });

      retry.addEventListener('click', reset);
      initDots();
      draw();
      setInterval(tick, 200);
    },
    chess(root, core) {
      const wrap = createEl('div', 'chess-area');
      const status = createEl('div', 'notice');
      status.textContent = 'Your move.';
      const boardWrap = createEl('div', 'chess-board');
      const grid = createEl('div', 'chess-grid');
      const piecesLayer = createEl('div');
      piecesLayer.style.position = 'absolute';
      piecesLayer.style.inset = '0';
      const resultOverlay = createEl('div', 'game-overlay');
      const resultText = createEl('div');
      resultOverlay.appendChild(resultText);
      boardWrap.appendChild(grid);
      boardWrap.appendChild(piecesLayer);
      boardWrap.appendChild(resultOverlay);
      const trays = createEl('div', 'chess-trays');
      const trayWhite = createEl('div', 'chess-tray');
      const trayBlack = createEl('div', 'chess-tray');
      trays.appendChild(trayWhite);
      trays.appendChild(trayBlack);
      const controls = createEl('div', 'embed-toolbar');
      const restart = createEl('button', 'btn ghost', 'Restart');
      controls.appendChild(status);
      controls.appendChild(restart);
      wrap.appendChild(controls);
      wrap.appendChild(boardWrap);
      wrap.appendChild(trays);
      root.appendChild(wrap);

      const initialBoard = () => [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];

      const pieceSymbols = {
        P: '♙',
        R: '♖',
        N: '♘',
        B: '♗',
        Q: '♕',
        K: '♔',
        p: '♟',
        r: '♜',
        n: '♞',
        b: '♝',
        q: '♛',
        k: '♚'
      };

      let board = initialBoard();
      let currentPlayer = 'w';
      let selected = null;
      let legalMoves = [];
      let moveCount = 0;
      let gameOver = false;

      const buildGrid = () => {
        grid.innerHTML = '';
        for (let r = 0; r < 8; r += 1) {
          for (let c = 0; c < 8; c += 1) {
            const square = createEl('div', 'chess-square');
            square.dataset.row = r;
            square.dataset.col = c;
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            grid.appendChild(square);
          }
        }
      };

      const squareEl = (row, col) =>
        grid.querySelector(`.chess-square[data-row="${row}"][data-col="${col}"]`);

      const clearHighlights = () => {
        grid.querySelectorAll('.chess-square').forEach((square) => {
          square.classList.remove('legal', 'attack');
        });
      };

      const initPieces = () => {
        piecesLayer.innerHTML = '';
        board.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (!cell) return;
            const piece = createEl(
              'div',
              `chess-piece ${cell === cell.toUpperCase() ? 'white' : 'black'}`
            );
            piece.textContent = pieceSymbols[cell];
            piece.dataset.row = r;
            piece.dataset.col = c;
            piece.style.transform = `translate(${c * 12.5}%, ${r * 12.5}%)`;
            piecesLayer.appendChild(piece);
          });
        });
      };

      const getPieceEl = (r, c) =>
        piecesLayer.querySelector(`.chess-piece[data-row=\"${r}\"][data-col=\"${c}\"]`);

      const movePieceEl = (el, r, c) => {
        if (!el) return;
        el.dataset.row = r;
        el.dataset.col = c;
        el.style.transform = `translate(${c * 12.5}%, ${r * 12.5}%)`;
      };

      const animateCapture = (element, tray) => {
        if (!element || !tray) return;
        const start = element.getBoundingClientRect();
        const end = tray.getBoundingClientRect();
        const ghost = element.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.left = `${start.left}px`;
        ghost.style.top = `${start.top}px`;
        ghost.style.width = `${start.width}px`;
        ghost.style.height = `${start.height}px`;
        ghost.style.margin = '0';
        ghost.style.zIndex = '80';
        ghost.style.transition = 'transform 0.45s ease, opacity 0.45s ease';
        document.body.appendChild(ghost);
        const targetLeft = end.left + 12;
        const targetTop = end.top + 12;
        const dx = targetLeft - start.left;
        const dy = targetTop - start.top;
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.7)`;
          ghost.style.opacity = '0.7';
        });
        setTimeout(() => ghost.remove(), 500);
      };

      const cloneBoard = (boardState) => boardState.map((row) => [...row]);

      const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

      const isWhite = (piece) => piece && piece === piece.toUpperCase();
      const isBlack = (piece) => piece && piece === piece.toLowerCase();

      const kingPosition = (boardState, color) => {
        for (let r = 0; r < 8; r += 1) {
          for (let c = 0; c < 8; c += 1) {
            const piece = boardState[r][c];
            if (piece && ((color === 'w' && piece === 'K') || (color === 'b' && piece === 'k'))) {
              return { r, c };
            }
          }
        }
        return null;
      };

      const isAttacked = (boardState, r, c, byColor) => {
        const enemyIsWhite = byColor === 'w';
        for (let row = 0; row < 8; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            const piece = boardState[row][col];
            if (!piece) continue;
            if (enemyIsWhite !== isWhite(piece)) continue;
            const moves = pseudoMoves(boardState, row, col, piece, true);
            if (moves.some((m) => m.r === r && m.c === c)) return true;
          }
        }
        return false;
      };

      const inCheck = (boardState, color) => {
        const king = kingPosition(boardState, color);
        if (!king) return false;
        const enemy = color === 'w' ? 'b' : 'w';
        return isAttacked(boardState, king.r, king.c, enemy);
      };

      const pseudoMoves = (boardState, r, c, piece, attacksOnly = false) => {
        const moves = [];
        const color = isWhite(piece) ? 'w' : 'b';
        const forward = color === 'w' ? -1 : 1;
        const addMove = (nr, nc, captureOnly = false) => {
          if (!inBounds(nr, nc)) return;
          const target = boardState[nr][nc];
          if (target) {
            if ((color === 'w' && isBlack(target)) || (color === 'b' && isWhite(target))) {
              moves.push({ r: nr, c: nc, capture: true });
            }
            return;
          }
          if (!captureOnly && !attacksOnly) moves.push({ r: nr, c: nc });
        };

        switch (piece.toLowerCase()) {
          case 'p': {
            if (!attacksOnly) {
              addMove(r + forward, c);
              const startRow = color === 'w' ? 6 : 1;
              if (r === startRow && !boardState[r + forward][c]) {
                addMove(r + forward * 2, c);
              }
            }
            addMove(r + forward, c - 1, true);
            addMove(r + forward, c + 1, true);
            break;
          }
          case 'n': {
            const offsets = [
              [2, 1],
              [2, -1],
              [-2, 1],
              [-2, -1],
              [1, 2],
              [1, -2],
              [-1, 2],
              [-1, -2]
            ];
            offsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
            break;
          }
          case 'b':
          case 'r':
          case 'q': {
            const directions = [];
            if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') {
              directions.push(
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1]
              );
            }
            if (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
              directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
            }
            directions.forEach(([dr, dc]) => {
              let nr = r + dr;
              let nc = c + dc;
              while (inBounds(nr, nc)) {
                const target = boardState[nr][nc];
                if (target) {
                  if ((color === 'w' && isBlack(target)) || (color === 'b' && isWhite(target))) {
                    moves.push({ r: nr, c: nc, capture: true });
                  }
                  break;
                }
                if (!attacksOnly) moves.push({ r: nr, c: nc });
                nr += dr;
                nc += dc;
              }
            });
            break;
          }
          case 'k': {
            for (let dr = -1; dr <= 1; dr += 1) {
              for (let dc = -1; dc <= 1; dc += 1) {
                if (dr === 0 && dc === 0) continue;
                addMove(r + dr, c + dc);
              }
            }
            break;
          }
        }
        return moves;
      };

      const legalMovesFor = (boardState, r, c) => {
        const piece = boardState[r][c];
        if (!piece) return [];
        const color = isWhite(piece) ? 'w' : 'b';
        const moves = pseudoMoves(boardState, r, c, piece);
        return moves.filter((move) => {
          const nextBoard = cloneBoard(boardState);
          nextBoard[move.r][move.c] = piece;
          nextBoard[r][c] = '';
          if (piece.toLowerCase() === 'p' && (move.r === 0 || move.r === 7)) {
            nextBoard[move.r][move.c] = color === 'w' ? 'Q' : 'q';
          }
          return !inCheck(nextBoard, color);
        });
      };

      const allLegalMoves = (boardState, color) => {
        const moves = [];
        for (let r = 0; r < 8; r += 1) {
          for (let c = 0; c < 8; c += 1) {
            const piece = boardState[r][c];
            if (!piece) continue;
            if (color === 'w' && !isWhite(piece)) continue;
            if (color === 'b' && !isBlack(piece)) continue;
            legalMovesFor(boardState, r, c).forEach((move) => {
              moves.push({ from: { r, c }, to: move });
            });
          }
        }
        return moves;
      };

      const evaluateBoard = (boardState) => {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        let score = 0;
        boardState.forEach((row) => {
          row.forEach((piece) => {
            if (!piece) return;
            const val = values[piece.toLowerCase()] || 0;
            score += isWhite(piece) ? val : -val;
          });
        });
        return score;
      };

      const applyMove = (boardState, move) => {
        const nextBoard = cloneBoard(boardState);
        const piece = nextBoard[move.from.r][move.from.c];
        nextBoard[move.to.r][move.to.c] = piece;
        nextBoard[move.from.r][move.from.c] = '';
        if (piece.toLowerCase() === 'p' && (move.to.r === 0 || move.to.r === 7)) {
          nextBoard[move.to.r][move.to.c] = isWhite(piece) ? 'Q' : 'q';
        }
        return nextBoard;
      };

      const makeMove = (from, to, isAi = false) => {
        const piece = board[from.r][from.c];
        const captured = board[to.r][to.c];
        const capturedEl = getPieceEl(to.r, to.c);
        board[to.r][to.c] = piece;
        board[from.r][from.c] = '';
        if (piece.toLowerCase() === 'p' && (to.r === 0 || to.r === 7)) {
          board[to.r][to.c] = isWhite(piece) ? 'Q' : 'q';
        }
        if (captured) {
          const trayPiece = createEl(
            'div',
            `chess-piece ${captured === captured.toUpperCase() ? 'white' : 'black'}`,
            pieceSymbols[captured]
          );
          if (captured === captured.toUpperCase()) {
            trayWhite.appendChild(trayPiece);
            animateCapture(capturedEl, trayWhite);
          } else {
            trayBlack.appendChild(trayPiece);
            animateCapture(capturedEl, trayBlack);
          }
          if (capturedEl) capturedEl.remove();
        }
        const movingEl = getPieceEl(from.r, from.c);
        movePieceEl(movingEl, to.r, to.c);
        if (movingEl && piece.toLowerCase() === 'p' && (to.r === 0 || to.r === 7)) {
          movingEl.textContent = pieceSymbols[board[to.r][to.c]];
        }
        clearHighlights();
        selected = null;
        legalMoves = [];
        moveCount += 1;
        if (inCheck(board, currentPlayer === 'w' ? 'b' : 'w')) {
          status.textContent = 'Check!';
        }
      };

      const endIfCheckmate = () => {
        const opponent = currentPlayer === 'w' ? 'b' : 'w';
        const moves = allLegalMoves(board, opponent);
        if (moves.length === 0) {
          gameOver = true;
          const message = opponent === 'b' ? 'Checkmate! You win.' : 'Checkmate. AI wins.';
          status.textContent = message;
          resultText.textContent = message;
          resultOverlay.classList.add('show');
          clearHighlights();
          const king = kingPosition(board, opponent);
          if (king) squareEl(king.r, king.c).classList.add('attack');
          if (opponent === 'b') {
            const score = Math.max(0, 1000 - moveCount * 5);
            core.reportScore('chess', score, 'high');
          }
        }
      };

      const aiMove = () => {
        if (gameOver) return;
        status.textContent = 'AI thinking...';
        setTimeout(() => {
          const moves = allLegalMoves(board, 'b');
          if (!moves.length) {
            endIfCheckmate();
            return;
          }
          let bestScore = Infinity;
          let bestMove = moves[0];
          moves.forEach((move) => {
            const nextBoard = applyMove(board, move);
            let score = evaluateBoard(nextBoard);
            const replies = allLegalMoves(nextBoard, 'w');
            if (replies.length) {
              let replyScore = -Infinity;
              replies.forEach((reply) => {
                const replyBoard = applyMove(nextBoard, reply);
                replyScore = Math.max(replyScore, evaluateBoard(replyBoard));
              });
              score = replyScore;
            }
            score += Math.random() * 0.15;
            if (score < bestScore) {
              bestScore = score;
              bestMove = move;
            }
          });
          makeMove(bestMove.from, bestMove.to, true);
          currentPlayer = 'w';
          status.textContent = 'Your move.';
          endIfCheckmate();
        }, 700);
      };

      grid.addEventListener('click', (event) => {
        if (gameOver || currentPlayer !== 'w') return;
        const square = event.target.closest('.chess-square');
        if (!square) return;
        const r = Number(square.dataset.row);
        const c = Number(square.dataset.col);
        const piece = board[r][c];
        if (selected && legalMoves.some((m) => m.r === r && m.c === c)) {
          makeMove(selected, { r, c });
          currentPlayer = 'b';
          endIfCheckmate();
          if (!gameOver) aiMove();
          return;
        }
        if (!piece || !isWhite(piece)) {
          selected = null;
          legalMoves = [];
          clearHighlights();
          return;
        }
        selected = { r, c };
        legalMoves = legalMovesFor(board, r, c);
        clearHighlights();
        legalMoves.forEach((move) => {
          const target = board[move.r][move.c];
          const sq = squareEl(move.r, move.c);
          if (target) {
            sq.classList.add('attack');
          } else {
            sq.classList.add('legal');
          }
        });
      });

      restart.addEventListener('click', () => {
        board = initialBoard();
        currentPlayer = 'w';
        selected = null;
        legalMoves = [];
        moveCount = 0;
        gameOver = false;
        status.textContent = 'Your move.';
        resultOverlay.classList.remove('show');
        trayWhite.innerHTML = '';
        trayBlack.innerHTML = '';
        buildGrid();
        initPieces();
      });

      buildGrid();
      initPieces();
    }
  };

  window.LogiSchoolGames = LogiSchoolGames;
})();
