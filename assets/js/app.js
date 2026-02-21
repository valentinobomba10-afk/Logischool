(() => {
  const UPDATE_RELEASE_DELAY_MS = 1 * 60 * 60 * 1000;
  const UPDATE_MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const TERMS_LAST_UPDATED = 'February 19, 2026';
  const TERMS_TEXT = `Terms and Conditions – Last Updated: ${TERMS_LAST_UPDATED}
By accessing, browsing, clicking “Agree,” creating an account, launching a game, or otherwise using LogiSchool (“LogiSchool,” “we,” “our,” or “us”), you confirm that you have carefully read, fully understood, and agreed to be legally bound by these Terms and Conditions in their entirety, and if you do not agree you must immediately discontinue use of the website; LogiSchool is an online browser-based gaming and learning platform created for entertainment and recreational purposes and is provided to users voluntarily at their own discretion and risk; you agree to use LogiSchool only in a lawful, respectful, and responsible manner and not to misuse, disrupt, overload, reverse engineer, decompile, attempt to extract source code, bypass security systems, interfere with servers, probe vulnerabilities, introduce malicious software, distribute harmful code, exploit glitches, manipulate gameplay mechanics, artificially inflate scores, abuse leaderboards, use automation software, bots, scripts, macros, injected code, browser exploits, unauthorized extensions, or any other unfair method to gain advantage or damage the experience for others; all content available on LogiSchool including but not limited to games, code, algorithms, databases, systems, designs, branding, graphics, logos, layouts, animations, text, sounds, user interface elements, and structural components are the intellectual property of LogiSchool unless otherwise credited and are protected under applicable copyright, trademark, and intellectual property laws and may not be copied, reproduced, redistributed, republished, modified, uploaded, sold, licensed, or commercially exploited without prior written consent; you agree that fair play is mandatory and that LogiSchool reserves the right to investigate suspicious behavior and take corrective action including but not limited to warnings, score resets, removal of progress, feature restrictions, temporary suspension, permanent bans, IP blocks, device bans, or reporting serious violations where required; if user accounts are provided, you are solely responsible for maintaining the confidentiality and security of your login information and for all actions that occur under your account and you agree not to share, transfer, lease, or sell access to your account; LogiSchool may update, modify, suspend, or discontinue any part of the website including games, systems, or features at any time without notice; the platform is provided on an “as is” and “as available” basis without warranties of any kind whether express or implied including but not limited to uninterrupted service, accuracy, reliability, security, fitness for a particular purpose, or freedom from errors or harmful components; LogiSchool shall not be liable for loss of data, corruption of files, lost progress, downtime, technical failures, device damage, indirect damages, incidental damages, consequential damages, or any loss resulting from use or inability to use the platform; you acknowledge that internet services may experience outages or technical limitations outside our control and you assume full responsibility for use; third-party links or advertisements that may appear are provided for convenience only and LogiSchool is not responsible for their content or policies; by clicking “Agree” and continuing to use LogiSchool you confirm that your access is voluntary and that you are personally responsible for ensuring your use complies with all applicable school policies, classroom rules, workplace guidelines, parental restrictions, and local regulations, and you explicitly accept that if your use of LogiSchool results in disciplinary action, warnings, device confiscation, detention, suspension, restriction of privileges, parental consequences, or any form of trouble with a teacher, school, educational institution, workplace, guardian, or authority, such consequences are solely your responsibility and not the responsibility of LogiSchool or Valentino Bomba (Val), and you acknowledge that LogiSchool and Valentino Bomba have no involvement, liability, or accountability regarding such outcomes because you voluntarily agreed to these Terms prior to use; if you are under the age of 13 you confirm you have obtained parental or guardian permission before accessing the platform; if any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect; failure to enforce any provision does not constitute a waiver of rights; these Terms constitute the entire agreement between you and LogiSchool and supersede all prior communications whether written or oral; LogiSchool reserves the right to revise or update these Terms at any time and continued use after changes are posted constitutes acceptance of the revised Terms; and as a small hidden acknowledgment for users who carefully read everything, if you see this line you win a code called DonkeyKong26 which may be redeemable within LogiSchool at our discretion.`;

  const LogiSchool = {
    storage: {
      users: 'ls_users',
      current: 'ls_currentUser',
      theme: 'ls_theme',
      adBlock: 'ls_adblock',
      termsAcceptedVersion: 'ls_terms_accepted_version',
      updateV2Target: 'ls_update_v2_target',
      updateV2PopupClosed: 'ls_update_v2_popup_closed',
      updateV2CelebrationSeen: 'ls_update_v2_celebration_seen',
      updatePreviewEnabled: 'ls_update_preview_enabled',
      adminMode: 'ls_admin_mode_enabled',
      announcementSeen: 'ls_global_announcement_seen',
      redeemed: 'ls_redeemedCodes',
      gameVoteTarget: 'ls_game_vote_target_v2',
      gameVoteCounts: 'ls_game_vote_counts_v2',
      gameVoteChoices: 'ls_game_vote_choices_v2',
      postLogin: 'ls_post_login',
      showAuth: 'ls_show_auth',
      globalSync: 'ls_global_last_sync',
      dailyQuestSeason: 'ls_daily_quest_season_v1',
      followedLiveSeen: 'ls_followed_live_seen_v1'
    },
    data: {
      categories: ['All', 'Speed', 'Arcade', 'Strategy', 'Duel', 'Memory', 'Unblocked'],
      globalLeaderboard: {
        enabled: true,
        endpoint: '/.netlify/functions/leaderboard',
        provider: 'netlify',
        limit: 100,
        livePollMs: 5000,
        livePushMs: 8000
      },
      announcementReactions: {
        endpoint: '/.netlify/functions/leaderboard?resource=announcement-reaction'
      },
      gameChat: {
        endpoint: '/.netlify/functions/game-chat',
        adminEndpoint: '/.netlify/functions/game-chat',
        room: 'global-games',
        limit: 80,
        livePollMs: 3500
      },
      tournament: {
        endpoint: '/.netlify/functions/tournament',
        livePollMs: 12000
      },
      dailyQuests: {
        rewardPoints: 750,
        seasonDays: 100
      },
      updateTimer: {
        endpoint: '/.netlify/functions/leaderboard?resource=timer'
      },
      gameVoting: {
        endpoint: '/.netlify/functions/game-votes',
        durationMs: 6 * 60 * 60 * 1000,
        livePollMs: 10000
      },
      adminTools: {
        endpoint: '/.netlify/functions/leaderboard?resource=admin',
        code: 'Cabra2031'
      },
      social: {
        endpoint: '/.netlify/functions/social',
        livePollMs: 3500,
        followPollMs: 12000,
        chatPollMs: 2500
      },
      recovery: {
        endpoint: '/.netlify/functions/recovery',
        codeLength: 6
      },
      accounts: {
        endpoint: '/.netlify/functions/accounts'
      },
      tiers: [
        { name: 'Bronze', min: 0 },
        { name: 'Silver', min: 500 },
        { name: 'Gold', min: 1200 },
        { name: 'Platinum', min: 2500 },
        { name: 'Diamond', min: 5000 },
        { name: 'Nebula', min: 9000 },
        { name: 'Legend', min: 14000 }
      ],
      avatarTiers: [
        { name: 'Starter', min: 0 },
        { name: 'Scholar', min: 500 },
        { name: 'Trailblazer', min: 1500 },
        { name: 'Architect', min: 3000 },
        { name: 'Virtuoso', min: 6000 },
        { name: 'Luminary', min: 9000 }
      ],
      pacmanSkins: [
        { id: 'classic', name: 'Classic', min: 0, color: '#ffd84d' },
        { id: 'neon', name: 'Neon Pulse', min: 1500, color: '#6dd5ff' },
        { id: 'solar', name: 'Solar Flare', min: 3000, color: '#ffb347' },
        { id: 'phantom', name: 'Phantom', min: 6000, color: '#b48cff' }
      ],
      pacmanTrails: [
        { id: 'none', name: 'None', min: 0, color: 'transparent' },
        { id: 'spark', name: 'Spark', min: 1500, color: '#6dd5ff' },
        { id: 'ember', name: 'Ember', min: 3000, color: '#ff8f5c' },
        { id: 'nebula', name: 'Nebula', min: 6000, color: '#b48cff' }
      ],
      presets: [
        {
          id: 'preset-aurora',
          name: 'Aurora',
          url:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%236dd5ff"/><stop offset="100%" stop-color="%238b5cff"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(%23g)"/><text x="50%" y="54%" font-family="Bebas Neue" font-size="64" fill="%230b1024" text-anchor="middle">LS</text></svg>'
        },
        {
          id: 'preset-solar',
          name: 'Solar',
          url:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0"><stop offset="0%" stop-color="%23ffb347"/><stop offset="100%" stop-color="%23ff5f7a"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(%23g)"/><circle cx="80" cy="80" r="42" fill="%230b1024" opacity="0.2"/></svg>'
        },
        {
          id: 'preset-midnight',
          name: 'Midnight',
          url:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%23141c3a"/><stop offset="100%" stop-color="%2340508a"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(%23g)"/><path d="M50 110c10-18 38-24 60-10" stroke="%23ffffff" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.5"/></svg>'
        },
        {
          id: 'preset-orbit',
          name: 'Orbit',
          url:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%236dd5ff"/><stop offset="100%" stop-color="%23ffb347"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="%230b1024"/><circle cx="80" cy="80" r="54" stroke="url(%23g)" stroke-width="8" fill="none"/></svg>'
        }
      ],
      profileBanners: [
        { id: 'none', name: 'Default', min: 0, css: '' },
        { id: 'aurora', name: 'Aurora Flow', min: 600, css: 'linear-gradient(135deg, rgba(109,213,255,0.25), rgba(139,92,255,0.2))' },
        { id: 'sunburst', name: 'Sunburst', min: 1500, css: 'linear-gradient(135deg, rgba(255,179,71,0.28), rgba(255,95,122,0.22))' },
        { id: 'matrix', name: 'Matrix Mint', min: 3000, css: 'linear-gradient(135deg, rgba(92,255,176,0.24), rgba(109,213,255,0.18))' },
        { id: 'nebula', name: 'Nebula Crown', min: 6500, css: 'linear-gradient(135deg, rgba(180,140,255,0.3), rgba(109,213,255,0.2))' }
      ],
      chatNameColors: [
        { id: 'default', name: 'Default', min: 0, color: '' },
        { id: 'sky', name: 'Sky Blue', min: 500, color: '#6dd5ff' },
        { id: 'mint', name: 'Mint', min: 1400, color: '#5cffb0' },
        { id: 'amber', name: 'Amber', min: 2500, color: '#ffd84d' },
        { id: 'nova', name: 'Nova Pink', min: 4200, color: '#ff78b5' },
        { id: 'legend', name: 'Legend Gold', min: 8000, color: '#ffcf67' }
      ],
      titleTags: [
        { id: 'none', name: 'No Tag', label: '', min: 0 },
        { id: 'rookie', name: 'Rookie', label: 'ROOKIE', min: 400 },
        { id: 'strategist', name: 'Strategist', label: 'STRATEGIST', min: 1600 },
        { id: 'speedster', name: 'Speedster', label: 'SPEEDSTER', min: 2600 },
        { id: 'arcade-star', name: 'Arcade Star', label: 'ARCADE STAR', min: 4200 },
        { id: 'champion', name: 'Champion', label: 'CHAMPION', min: 7600 }
      ],
      games: [
        {
          id: 'click-rush',
          name: 'Click Rush',
          category: 'Speed',
          description: 'Hit as many clicks as you can in 10 seconds. Precision and speed win.',
          tip: 'Keep your cursor centered and use short bursts of clicks.',
          instructions: ['Press Start to begin.', 'Click the big button as fast as possible.', 'Score is total clicks in 10 seconds.'],
          accent: '#6dd5ff',
          accent2: '#8b5cff',
          scoreMode: 'high',
          scoreLabel: 'clicks'
        },
        {
          id: 'connect-4',
          name: 'Connect 4',
          category: 'Strategy',
          description: 'Outsmart the CPU with a 4-in-a-row connection battle.',
          tip: 'Control the center columns to build multiple threats.',
          instructions: ['Click a column to drop your disc.', 'Create four in a row before the CPU.', 'Block the CPU when it threatens a win.'],
          accent: '#ffb347',
          accent2: '#ff5f7a',
          scoreMode: 'high',
          scoreLabel: 'score'
        },
        {
          id: 'rock-paper-scissors',
          name: 'Rock Paper Scissors',
          category: 'Duel',
          description: 'Fast hand battles with streak tracking and animated reveals.',
          tip: 'Switch patterns when you win to keep the CPU guessing.',
          instructions: ['Choose Rock, Paper, or Scissors.', 'Watch the countdown and reveal.', 'Build the longest win streak.'],
          accent: '#8b5cff',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'streak'
        },
        {
          id: 'memory-flip',
          name: 'Memory Flip',
          category: 'Memory',
          description: 'Match all emoji pairs in the fewest moves possible.',
          tip: 'Focus on corners first to build a mental map.',
          instructions: ['Flip two cards to reveal emojis.', 'Match pairs to keep them open.', 'Finish with the fewest moves.'],
          accent: '#6dd5ff',
          accent2: '#ffb347',
          scoreMode: 'low',
          scoreLabel: 'moves'
        },
        {
          id: 'snake',
          name: 'Snake',
          category: 'Arcade',
          description: 'Classic grid snake with smooth controls and fast restarts.',
          tip: 'Plan your turns ahead and avoid tight loops.',
          instructions: ['Use arrow keys or WASD to move.', 'Collect squares to grow.', 'Avoid walls and your tail.'],
          accent: '#5cffb0',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'score'
        },
        {
          id: 'tetris',
          name: 'Tetris',
          category: 'Arcade',
          description: 'Drop blocks, clear lines, and climb the level ladder.',
          tip: 'Keep the stack low by clearing lines quickly.',
          instructions: ['Arrow keys move and rotate.', 'Space drops instantly.', 'Clear lines to score.'],
          accent: '#6dd5ff',
          accent2: '#8b5cff',
          scoreMode: 'high',
          scoreLabel: 'score'
        },
        {
          id: 'chrome-dino',
          name: 'Chrome Dino',
          category: 'Arcade',
          description: 'The classic offline runner embedded inside LogiSchool.',
          tip: 'Tap jump early to clear birds in later stages.',
          instructions: ['Press space or tap to jump.', 'Avoid cacti and birds.', 'Survive for the highest score.'],
          accent: '#ffb347',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: 'https://wayou.github.io/t-rex-runner/'
        },
        {
          id: 'pacman',
          name: 'Pacman',
          category: 'Arcade',
          description: 'Eat dots, avoid ghosts, and chase high scores.',
          tip: 'Clear corners first to create safer routes.',
          instructions: ['Use arrow keys or WASD.', 'Eat every dot to win.', 'Avoid ghosts and retry to improve.'],
          accent: '#ffd84d',
          accent2: '#ff8f5c',
          scoreMode: 'high',
          scoreLabel: 'dots',
          embed: '../embeds/pacman/index.html'
        },
        {
          id: 'chess',
          name: 'Chess',
          category: 'Strategy',
          description: 'Classic chess with polished animations and smart play.',
          tip: 'Develop pieces early and protect the king.',
          instructions: ['Select a piece to see legal moves.', 'Capture to gain advantage.', 'Checkmate to win.'],
          accent: '#b48cff',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/chess-classic.html'
        },
        {
          id: 'cookie-clicker',
          name: 'Cookie Clicker',
          category: 'Unblocked',
          description: 'Bake cookies, buy upgrades, and grow your bakery.',
          tip: 'Upgrade your cursor early for rapid scaling.',
          instructions: ['Click to bake cookies.', 'Buy upgrades to automate.', 'Track your best cookies.'],
          accent: '#ffb347',
          accent2: '#8b5cff',
          scoreMode: 'high',
          scoreLabel: 'cookies',
          embed: '../embeds/cookieclicker.html'
        },
        {
          id: 'temple-run-2',
          name: 'Temple Run 2',
          category: 'Unblocked',
          description: 'Fast endless runner with jumps, slides, and turns.',
          tip: 'Stay centered and anticipate turns early.',
          instructions: ['Swipe or arrow keys to move.', 'Avoid obstacles and collect coins.', 'Push for high distance.'],
          accent: '#5cffb0',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'distance',
          manualScore: true,
          manualScoreLabel: 'Distance',
          manualScoreUnit: 'm',
          embed: '../embeds/temple-run-2.html'
        },
        {
          id: 'cl-super-smash-bros',
          name: 'Super Smash Bros',
          category: 'Unblocked',
          description: 'Battle-ready platform fighter with classic arcade energy.',
          tip: 'Use fullscreen for the smoothest combos.',
          instructions: ['Press Enter to start.', 'Move with TFGH.', 'Attack with X and S.'],
          accent: '#ffb347',
          accent2: '#8b5cff',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/clsupersmashbros.html'
        },
        {
          id: 'sonic-2',
          name: 'Sonic 2',
          category: 'Unblocked',
          description: 'Classic high-speed platforming with Sonic and Tails.',
          tip: 'Use fullscreen for smoother play.',
          instructions: ['Press start to begin.', 'Arrow keys control movement.', 'Z / X to jump or fight.'],
          accent: '#6dd5ff',
          accent2: '#ffd84d',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/sonic-2.html'
        },
        {
          id: 'donkey-kong',
          name: 'Donkey Kong',
          category: 'Unblocked',
          description: 'Classic arcade platforming with barrels and ladders.',
          tip: 'Time your jumps and use ladders to avoid barrels.',
          instructions: ['Press start to begin.', 'Arrow keys control movement.', 'Z / X to jump or fight.'],
          accent: '#ffb347',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/cldonkeykong.html'
        },
        {
          id: 'crossy-road',
          name: 'Crossy Road',
          category: 'Unblocked',
          description: 'Hop through busy roads and rivers without getting hit.',
          tip: 'Keep moving and watch traffic timing before each hop.',
          instructions: ['Use arrow keys to move.', 'Avoid cars and water lanes.', 'Stay alive to reach a higher score.'],
          accent: '#5cffb0',
          accent2: '#ffd84d',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/clcrossyroad.html'
        },
        {
          id: 'crazy-plane-landing',
          name: 'Crazy Plane Landing',
          category: 'Unblocked',
          description: 'Guide your plane to land safely through tricky approaches.',
          tip: 'Control your angle early and avoid hard corrections near the runway.',
          instructions: ['Use mouse or touch to control flight.', 'Align your approach before landing.', 'Land smoothly to score higher.'],
          accent: '#6dd5ff',
          accent2: '#5cffb0',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/clcrazyplanelanding.html'
        },
        {
          id: 'escape-road',
          name: 'Escape Road',
          category: 'Unblocked',
          description: 'High-speed police chase driving with quick turns and near misses.',
          tip: 'Use short steering taps to avoid over-correcting at speed.',
          instructions: ['Game loads immediately.', 'Arrow keys steer your car.', 'Dodge police and survive as long as possible.'],
          accent: '#ff5f7a',
          accent2: '#6dd5ff',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/escape-road.html'
        },
        {
          id: 'escape-road-2',
          name: 'Escape Road 2',
          category: 'Unblocked',
          description: 'Sequel chase mode with faster pacing and tighter turns.',
          tip: 'Brake your turns early and keep space from police packs.',
          instructions: ['Game loads immediately.', 'Arrow keys steer your car.', 'Survive longer to push a higher score.'],
          accent: '#ffd84d',
          accent2: '#ff5f7a',
          scoreMode: 'high',
          scoreLabel: 'score',
          embed: '../embeds/clescaperoad-2.html'
        }
      ]
    },
    init() {
      this.applyBackendEndpoints();
      if (this.enforcePrimaryDomain()) return;
      this.applyTheme();
      this.renderTopbar();
      this.injectLeaderboardLink();
      this.syncCurrentUser();
      this.initAuthOverlay();
      const page = document.body.dataset.page;
      if (page === 'home') {
        this.initTournament();
        this.renderHome();
        this.renderFeedbackFooter();
        this.syncUpdateTimer().finally(async () => {
          await this.activateBigUpdateFromFolder();
          this.renderHome();
          this.renderFeedbackFooter();
          this.renderUpdateCountdown();
          this.maybeShowUpdatePopup();
        });
      }
      if (page === 'game') {
        if (this.requireAuthForGame()) return;
        this.syncUpdateTimer().finally(async () => {
          await this.activateBigUpdateFromFolder();
          this.renderGamePage();
          this.renderFeedbackFooter();
          this.showGameTermsPopup();
        });
      }
      if (page === 'profile') {
        this.renderProfile();
      }
      if (page === 'settings') {
        this.renderSettings();
      }
      if (page === 'admin') {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
          this.safeSet(this.storage.postLogin, 'admin.html');
          this.safeSet(this.storage.showAuth, true);
          window.location.href = 'index.html';
          return;
        }
        this.renderAdminPage();
      }
      if (page === 'leaderboard') {
        this.renderLeaderboard();
      }
      if (page === 'live') {
        this.renderLiveHub();
      }
      if (page === 'chat') {
        this.renderSocialChat();
      }
      this.startGlobalLiveSync();
      this.startFollowLiveNotifications();
    },
    getFunctionsFallbackBase() {
      const fromWindow = String(window.LOGISCHOOL_API_BASE || '')
        .trim()
        .replace(/\/$/, '');
      if (fromWindow) return fromWindow;
      const fromStorage = String(this.safeParse('ls_api_base', '') || '')
        .trim()
        .replace(/\/$/, '');
      if (fromStorage) return fromStorage;
      return 'https://keen-celebration-production.up.railway.app';
    },
    withBaseUrl(path, base) {
      const endpoint = String(path || '').trim();
      if (!endpoint) return endpoint;
      if (!base) return endpoint;
      if (/^https?:\/\//i.test(endpoint)) return endpoint;
      if (!endpoint.startsWith('/')) return endpoint;
      return `${base}${endpoint}`;
    },
    applyBackendEndpoints() {
      const fallbackBase = this.getFunctionsFallbackBase();
      if (!fallbackBase) return;
      this.data.globalLeaderboard.endpoint = this.withBaseUrl(
        this.data.globalLeaderboard.endpoint,
        fallbackBase
      );
      this.data.announcementReactions.endpoint = this.withBaseUrl(
        this.data.announcementReactions.endpoint,
        fallbackBase
      );
      this.data.gameChat.endpoint = this.withBaseUrl(this.data.gameChat.endpoint, fallbackBase);
      this.data.gameChat.adminEndpoint = this.withBaseUrl(
        this.data.gameChat.adminEndpoint,
        fallbackBase
      );
      this.data.tournament.endpoint = this.withBaseUrl(this.data.tournament.endpoint, fallbackBase);
      this.data.updateTimer.endpoint = this.withBaseUrl(this.data.updateTimer.endpoint, fallbackBase);
      this.data.gameVoting.endpoint = this.withBaseUrl(this.data.gameVoting.endpoint, fallbackBase);
      this.data.adminTools.endpoint = this.withBaseUrl(this.data.adminTools.endpoint, fallbackBase);
      this.data.recovery.endpoint = this.withBaseUrl(this.data.recovery.endpoint, fallbackBase);
      this.data.social.endpoint = this.withBaseUrl(this.data.social.endpoint, fallbackBase);
      this.data.accounts.endpoint = this.withBaseUrl(this.data.accounts.endpoint, fallbackBase);
    },
    enforcePrimaryDomain() {
      if (window.location.protocol === 'file:') return false;
      const host = String(window.location.hostname || '')
        .trim()
        .toLowerCase();
      const oldDomain = 'logischool.netlify.app';
      if (host !== oldDomain) return false;
      if (document.getElementById('legacyDomainOverlay')) return true;

      const targetUrl = `https://logischool.live${window.location.pathname || '/'}${window.location.search || ''}${window.location.hash || ''}`;
      const app = document.querySelector('.app');
      if (app) app.setAttribute('aria-hidden', 'true');
      document.body.classList.add('legacy-domain-lock');

      const overlay = document.createElement('div');
      overlay.className = 'overlay active legacy-domain-overlay';
      overlay.id = 'legacyDomainOverlay';
      overlay.innerHTML = `
        <div class="legacy-domain-popup card">
          <h2>LogiSchool moved</h2>
          <p>
            LogiSchool is not using this URL anymore. Redirecting you in
            <strong id="legacyDomainCountdown">7</strong> seconds to
            <strong>logischool.live</strong>.
          </p>
          <p class="notice">
            PLEASE USE <strong>LOGISCHOOL.LIVE</strong> NOT <strong>.NETLIFY.APP</strong>. Thanks, Valentino.
          </p>
          <a class="btn primary" href="${targetUrl}">Go Now</a>
        </div>
      `;
      document.body.appendChild(overlay);

      const countdownEl = overlay.querySelector('#legacyDomainCountdown');
      let remaining = 7;
      const tick = () => {
        remaining = Math.max(0, remaining - 1);
        if (countdownEl) countdownEl.textContent = String(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          window.location.replace(targetUrl);
        }
      };
      const timer = setInterval(tick, 1000);
      return true;
    },
    safeParse(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    safeSet(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        // ignore storage errors
      }
    },
    normalizeRecoveryEmail(value) {
      const email = String(value || '')
        .trim()
        .toLowerCase()
        .slice(0, 180);
      if (!email) return '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
      return email;
    },
    normalizeRecoveryPhone(value) {
      let phone = String(value || '')
        .trim()
        .replace(/[\s().-]/g, '');
      if (!phone) return '';
      if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
      if (phone.startsWith('+')) {
        const digits = phone.slice(1).replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) return '';
        return `+${digits}`;
      }
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
      return '';
    },
    maskRecoveryEmail(value) {
      const email = this.normalizeRecoveryEmail(value);
      if (!email) return '';
      const [localRaw, domainRaw] = email.split('@');
      const local = String(localRaw || '');
      const domain = String(domainRaw || '');
      const maskedLocal =
        local.length <= 2
          ? `${local.slice(0, 1)}*`
          : `${local.slice(0, 1)}${'*'.repeat(Math.min(6, local.length - 2))}${local.slice(-1)}`;
      const [domainNameRaw, ...domainTail] = domain.split('.');
      const domainName = String(domainNameRaw || '');
      const domainSuffix = domainTail.join('.');
      const maskedDomain = domainName
        ? `${domainName.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(6, domainName.length - 1)))}`
        : '***';
      return domainSuffix ? `${maskedLocal}@${maskedDomain}.${domainSuffix}` : `${maskedLocal}@${maskedDomain}`;
    },
    maskRecoveryPhone(value) {
      const phone = this.normalizeRecoveryPhone(value);
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      const tail = digits.slice(-2);
      const hidden = Math.max(0, digits.length - 2);
      return `+${'*'.repeat(hidden)}${tail}`;
    },
    getRecoveryContact(user, method) {
      if (!user || !user.recovery || typeof user.recovery !== 'object') return '';
      if (method === 'email') return this.normalizeRecoveryEmail(user.recovery.email);
      if (method === 'sms') return this.normalizeRecoveryPhone(user.recovery.phone);
      return '';
    },
    formatRecoveryContact(user, method) {
      const contact = this.getRecoveryContact(user, method);
      if (!contact) return '';
      return method === 'email' ? this.maskRecoveryEmail(contact) : this.maskRecoveryPhone(contact);
    },
    async callRecoveryApi(action, payload = {}) {
      const endpoint = this.data.recovery?.endpoint;
      if (!endpoint) {
        return { ok: false, status: 0, data: { error: 'Recovery endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Recovery codes need the Netlify website URL.' } };
      }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload })
        });
        let data = null;
        try {
          data = await response.json();
        } catch (err) {
          data = null;
        }
        return {
          ok: response.ok,
          status: response.status,
          data: data || {}
        };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { error: String(err?.message || 'Recovery request failed.') }
        };
      }
    },
    async callAccountsApi(action, payload = {}) {
      const endpoint = this.data.accounts?.endpoint;
      if (!endpoint) {
        return { ok: false, status: 0, data: { error: 'Accounts endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Accounts need website URL.' } };
      }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload })
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        return { ok: response.ok, status: response.status, data };
      } catch (err) {
        return { ok: false, status: 0, data: { error: String(err?.message || 'Account API error.') } };
      }
    },
    upsertLocalUser(remoteUser) {
      if (!remoteUser || typeof remoteUser !== 'object') return null;
      const normalized = this.normalizeUser({
        ...remoteUser,
        id: String(remoteUser.id || '').trim().slice(0, 80),
        username: String(remoteUser.username || '').trim().slice(0, 18),
        pin: String(remoteUser.pin || '').trim().slice(0, 4)
      });
      if (!normalized.id || !normalized.username || !/^\d{4}$/.test(normalized.pin || '')) return null;
      const users = this.getUsers();
      const index = users.findIndex((u) => String(u.id) === normalized.id);
      if (index >= 0) {
        users[index] = { ...users[index], ...normalized };
      } else {
        users.push(normalized);
      }
      this.saveUsers(users);
      return normalized;
    },
    getUsers() {
      const users = this.safeParse(this.storage.users, []);
      return Array.isArray(users) ? users : [];
    },
    saveUsers(users) {
      this.safeSet(this.storage.users, users);
    },
    readRawStorage(key) {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    },
    parseStoredValue(raw) {
      if (raw === null || raw === undefined) return null;
      const text = String(raw).trim();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (err) {
        return text;
      }
    },
    normalizeCurrentUserId(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      const text = String(value).trim();
      if (!text || text === 'null' || text === 'undefined') return '';
      return text;
    },
    getCurrentUserId() {
      const currentRaw = this.readRawStorage(this.storage.current);
      if (currentRaw !== null) {
        const parsed = this.parseStoredValue(currentRaw);
        return this.normalizeCurrentUserId(parsed);
      }
      const legacyKeys = ['ls_current_user', 'lsCurrentUser'];
      for (const key of legacyKeys) {
        const raw = this.readRawStorage(key);
        if (raw === null) continue;
        const parsed = this.parseStoredValue(raw);
        const legacyId = this.normalizeCurrentUserId(parsed);
        if (!legacyId) continue;
        this.setCurrentUser(legacyId);
        return legacyId;
      }
      return '';
    },
    getCurrentUser() {
      const id = this.getCurrentUserId();
      if (!id) return null;
      const user = this.getUsers().find((u) => u.id === id) || null;
      if (!user) return null;
      const normalized = this.normalizeUser(user);
      if (normalized._updated) {
        delete normalized._updated;
        this.updateUser(normalized);
      }
      return normalized;
    },
    normalizeUser(user) {
      let updated = false;
      if (!user.stats) {
        user.stats = { bestScores: {}, gamesPlayed: [] };
        updated = true;
      }
      if (!user.stats.bestScores) {
        user.stats.bestScores = {};
        updated = true;
      }
      if (!user.stats.gamesPlayed) {
        user.stats.gamesPlayed = [];
        updated = true;
      }
      if (!user.stats.daily || typeof user.stats.daily !== 'object') {
        user.stats.daily = {
          date: '',
          playGames: 0,
          onlineWin: false,
          claimed: false,
          streak: 0,
          lastClaimDate: ''
        };
        updated = true;
      } else {
        if (!user.stats.daily.date) user.stats.daily.date = '';
        if (typeof user.stats.daily.playGames !== 'number') user.stats.daily.playGames = 0;
        if (typeof user.stats.daily.onlineWin !== 'boolean') user.stats.daily.onlineWin = false;
        if (typeof user.stats.daily.claimed !== 'boolean') user.stats.daily.claimed = false;
        if (typeof user.stats.daily.streak !== 'number') user.stats.daily.streak = 0;
        if (!user.stats.daily.lastClaimDate) user.stats.daily.lastClaimDate = '';
      }
      if (!Array.isArray(user.stats.tournamentBadges)) {
        user.stats.tournamentBadges = [];
        updated = true;
      }
      if (typeof user.bonusPoints !== 'number') {
        user.bonusPoints = 0;
        updated = true;
      }
      if (!user.recovery || typeof user.recovery !== 'object') {
        user.recovery = {
          email: '',
          phone: ''
        };
        updated = true;
      } else {
        const normalizedEmail = this.normalizeRecoveryEmail(user.recovery.email);
        const normalizedPhone = this.normalizeRecoveryPhone(user.recovery.phone);
        if ((user.recovery.email || '') !== normalizedEmail) {
          user.recovery.email = normalizedEmail;
          updated = true;
        }
        if ((user.recovery.phone || '') !== normalizedPhone) {
          user.recovery.phone = normalizedPhone;
          updated = true;
        }
      }
      if (!user.cosmetics) {
        user.cosmetics = {
          avatarUrl: '',
          presetAvatar: '',
          pacmanSkin: 'classic',
          pacmanTrail: 'none',
          profileBanner: 'none',
          chatNameColor: 'default',
          titleTag: 'none'
        };
        updated = true;
      } else {
        if (user.cosmetics.avatarUrl === undefined) user.cosmetics.avatarUrl = '';
        if (user.cosmetics.presetAvatar === undefined) user.cosmetics.presetAvatar = '';
        if (!user.cosmetics.pacmanSkin) user.cosmetics.pacmanSkin = 'classic';
        if (!user.cosmetics.pacmanTrail) user.cosmetics.pacmanTrail = 'none';
        if (!user.cosmetics.profileBanner) user.cosmetics.profileBanner = 'none';
        if (!user.cosmetics.chatNameColor) user.cosmetics.chatNameColor = 'default';
        if (!user.cosmetics.titleTag) user.cosmetics.titleTag = 'none';
      }
      if (updated) user._updated = true;
      return user;
    },
    setCurrentUser(id) {
      this.safeSet(this.storage.current, id);
    },
    signOut() {
      this.safeSet(this.storage.current, null);
      this.showToast('Signed out.');
      this.renderTopbar();
    },
    createUser(username, pin, recovery = {}) {
      const trimmed = username.trim().slice(0, 18);
      if (!trimmed) {
        return { ok: false, message: 'Username is required.' };
      }
      if (!/^\d{4}$/.test(pin)) {
        return { ok: false, message: 'PIN must be 4 digits.' };
      }
      const recoveryEmailRaw = String(recovery?.email || '').trim();
      const recoveryPhoneRaw = String(recovery?.phone || '').trim();
      const recoveryEmail = recoveryEmailRaw ? this.normalizeRecoveryEmail(recoveryEmailRaw) : '';
      const recoveryPhone = recoveryPhoneRaw ? this.normalizeRecoveryPhone(recoveryPhoneRaw) : '';
      if (recoveryEmailRaw && !recoveryEmail) {
        return { ok: false, message: 'Recovery email is invalid.' };
      }
      if (recoveryPhoneRaw && !recoveryPhone) {
        return { ok: false, message: 'Recovery phone is invalid.' };
      }
      const users = this.getUsers();
      const exists = users.some((user) => user.username.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return { ok: false, message: 'Username already exists on this device.' };
      }
      const user = {
        id: `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        username: trimmed,
        pin,
        createdAt: new Date().toISOString(),
        stats: {
          bestScores: {},
          gamesPlayed: []
        },
        recovery: {
          email: recoveryEmail,
          phone: recoveryPhone
        },
        bonusPoints: 0,
        cosmetics: {
          avatarUrl: '',
          presetAvatar: '',
          pacmanSkin: 'classic',
          pacmanTrail: 'none'
        }
      };
      users.push(user);
      this.saveUsers(users);
      this.setCurrentUser(user.id);
      return { ok: true, user };
    },
    loginUser(username, pin) {
      const trimmed = username.trim();
      const users = this.getUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === trimmed.toLowerCase() && u.pin === pin
      );
      if (!user) {
        return { ok: false, message: 'Incorrect username or PIN.' };
      }
      this.setCurrentUser(user.id);
      return { ok: true, user };
    },
    async createUserOnline(username, pin, recovery = {}) {
      const result = this.createUser(username, pin, recovery);
      if (!result.ok) return result;
      const api = await this.callAccountsApi('register', { user: result.user });
      if (!api.ok) {
        return {
          ok: true,
          user: result.user,
          message: 'Online account sync is down right now. Your local account was still created.'
        };
      }
      const saved = this.upsertLocalUser(api.data?.user || result.user) || result.user;
      this.setCurrentUser(saved.id);
      return { ok: true, user: saved };
    },
    async loginUserOnline(username, pin) {
      const trimmed = String(username || '').trim().slice(0, 18);
      if (!trimmed || !/^\d{4}$/.test(String(pin || ''))) {
        return { ok: false, message: 'Incorrect username or PIN.' };
      }
      const api = await this.callAccountsApi('login', { username: trimmed, pin: String(pin) });
      if (api.ok && api.data?.user) {
        const saved = this.upsertLocalUser(api.data.user) || api.data.user;
        this.setCurrentUser(saved.id);
        return { ok: true, user: saved };
      }
      return this.loginUser(trimmed, String(pin));
    },
    updateUser(updated) {
      const users = this.getUsers();
      const index = users.findIndex((u) => u.id === updated.id);
      if (index === -1) return;
      users[index] = updated;
      this.saveUsers(users);
    },
    scoreToPoints(score, mode) {
      if (mode === 'low' || mode === 'time') {
        return Math.max(5, Math.round(1200 / (score + 2)));
      }
      return Math.max(0, Math.round(score));
    },
    computePoints(user) {
      if (!user) return 0;
      const bestScores = user.stats?.bestScores || {};
      let total = Number(user.bonusPoints) || 0;
      Object.values(bestScores).forEach((entry) => {
        if (entry && typeof entry.score === 'number') {
          total += this.scoreToPoints(entry.score, entry.mode || 'high');
        }
      });
      return total;
    },
    getStartOfTodayTs(ts = Date.now()) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    },
    normalizeDailyQuestSeason(raw, now = Date.now()) {
      const totalDays = Math.max(1, Math.round(Number(this.data.dailyQuests?.seasonDays) || 100));
      let startAt = Number(raw?.startAt);
      if (!Number.isFinite(startAt) || startAt <= 0) {
        startAt = this.getStartOfTodayTs(now);
      }
      const expectedEnd = startAt + totalDays * DAY_MS;
      let endAt = Number(raw?.endAt);
      if (!Number.isFinite(endAt) || endAt <= startAt) {
        endAt = expectedEnd;
      } else {
        endAt = expectedEnd;
      }
      const active = now < endAt;
      const elapsedDays = Math.floor((now - startAt) / DAY_MS) + 1;
      const currentDay = Math.min(totalDays, Math.max(1, elapsedDays));
      const remainingMs = Math.max(0, endAt - now);
      const remainingDays = Math.max(0, Math.ceil(remainingMs / DAY_MS));
      return {
        startAt,
        endAt,
        totalDays,
        currentDay,
        remainingDays,
        active
      };
    },
    getDailyQuestSeason() {
      const raw = this.safeParse(this.storage.dailyQuestSeason, null);
      const season = this.normalizeDailyQuestSeason(raw, Date.now());
      const rawStart = Number(raw?.startAt);
      const rawEnd = Number(raw?.endAt);
      const rawTotal = Number(raw?.totalDays);
      const needsSave =
        !raw ||
        !Number.isFinite(rawStart) ||
        !Number.isFinite(rawEnd) ||
        rawStart !== season.startAt ||
        rawEnd !== season.endAt ||
        rawTotal !== season.totalDays;
      if (needsSave) {
        this.safeSet(this.storage.dailyQuestSeason, {
          startAt: season.startAt,
          endAt: season.endAt,
          totalDays: season.totalDays
        });
      }
      return season;
    },
    isDailyQuestSeasonActive() {
      return this.getDailyQuestSeason().active;
    },
    getTodayKey(offsetDays = 0) {
      const now = new Date();
      if (offsetDays) now.setDate(now.getDate() + offsetDays);
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
        2,
        '0'
      )}`;
    },
    ensureDailyState(user) {
      if (!user?.stats) return null;
      const season = this.getDailyQuestSeason();
      const today = this.getTodayKey(0);
      const yesterday = this.getTodayKey(-1);
      const daily = user.stats.daily || {
        date: '',
        playGames: 0,
        onlineWin: false,
        claimed: false,
        streak: 0,
        lastClaimDate: ''
      };
      let changed = false;
      if (!season.active) {
        user.stats.daily = daily;
        if (changed) this.updateUser(user);
        return daily;
      }
      if (daily.date !== today) {
        daily.playGames = 0;
        daily.onlineWin = false;
        daily.claimed = false;
        daily.date = today;
        changed = true;
      }
      if (daily.lastClaimDate && daily.lastClaimDate !== today && daily.lastClaimDate !== yesterday) {
        if (daily.streak !== 0) {
          daily.streak = 0;
          changed = true;
        }
      }
      user.stats.daily = daily;
      if (changed) this.updateUser(user);
      return daily;
    },
    updateDailyQuestProgress(options = {}) {
      if (!this.isDailyQuestSeasonActive()) return null;
      const user = this.getCurrentUser();
      if (!user) return null;
      const daily = this.ensureDailyState(user);
      if (!daily) return null;
      let changed = false;
      if (options.playedGameId) {
        const next = Math.min(3, Math.max(0, Number(daily.playGames || 0)) + 1);
        if (next !== daily.playGames) {
          daily.playGames = next;
          changed = true;
        }
      }
      if (options.onlineWin && !daily.onlineWin) {
        daily.onlineWin = true;
        changed = true;
      }
      if (changed) {
        user.stats.daily = daily;
        this.updateUser(user);
      }
      return daily;
    },
    claimDailyReward() {
      if (!this.isDailyQuestSeasonActive()) {
        return { ok: false, message: 'Daily quest season has ended.' };
      }
      const user = this.getCurrentUser();
      if (!user) return { ok: false, message: 'Sign in required.' };
      const daily = this.ensureDailyState(user);
      if (!daily) return { ok: false, message: 'Daily state unavailable.' };
      if (daily.claimed) return { ok: false, message: 'Reward already claimed today.' };
      if (Number(daily.playGames || 0) < 3 || !daily.onlineWin) {
        return { ok: false, message: 'Complete all daily quests first.' };
      }
      const today = this.getTodayKey(0);
      const yesterday = this.getTodayKey(-1);
      const last = String(daily.lastClaimDate || '');
      if (last === yesterday) {
        daily.streak = Math.max(1, Number(daily.streak || 0) + 1);
      } else if (last !== today) {
        daily.streak = 1;
      }
      daily.claimed = true;
      daily.lastClaimDate = today;
      const reward = Math.max(100, Number(this.data.dailyQuests?.rewardPoints) || 750);
      user.bonusPoints = Math.max(0, Number(user.bonusPoints || 0) + reward);
      user.stats.daily = daily;
      this.updateUser(user);
      this.renderTopbar();
      this.syncCurrentUser(true);
      return { ok: true, reward, streak: daily.streak };
    },
    getUnlockedByPoints(items, points) {
      const pts = Number(points || 0);
      return (Array.isArray(items) ? items : []).filter((item) => pts >= Number(item.min || 0));
    },
    getOptionById(items, id, fallbackId = '') {
      const list = Array.isArray(items) ? items : [];
      const pick = String(id || '').trim();
      return list.find((item) => item.id === pick) || list.find((item) => item.id === fallbackId) || list[0] || null;
    },
    getActiveProfileBanner(user, points) {
      const unlocked = this.getUnlockedByPoints(this.data.profileBanners, points);
      const preferred = String(user?.cosmetics?.profileBanner || 'none');
      return this.getOptionById(unlocked.length ? unlocked : this.data.profileBanners, preferred, 'none');
    },
    getActiveChatNameColor(user, points) {
      const unlocked = this.getUnlockedByPoints(this.data.chatNameColors, points);
      const preferred = String(user?.cosmetics?.chatNameColor || 'default');
      return this.getOptionById(unlocked.length ? unlocked : this.data.chatNameColors, preferred, 'default');
    },
    getActiveTitleTag(user, points) {
      const unlocked = this.getUnlockedByPoints(this.data.titleTags, points);
      const preferred = String(user?.cosmetics?.titleTag || 'none');
      return this.getOptionById(unlocked.length ? unlocked : this.data.titleTags, preferred, 'none');
    },
    applyTournamentBadges(user, badges = []) {
      if (!user) return false;
      const current = Array.isArray(user.stats?.tournamentBadges) ? user.stats.tournamentBadges : [];
      const merged = [...current];
      let changed = false;
      (Array.isArray(badges) ? badges : []).forEach((badge) => {
        if (!badge || typeof badge !== 'object') return;
        const id = String(badge.id || '').trim().slice(0, 120);
        if (!id || merged.some((row) => String(row.id || '') === id)) return;
        merged.push({
          id,
          place: Number(badge.place) || 0,
          gameId: String(badge.gameId || '').trim().slice(0, 40),
          eventId: String(badge.eventId || '').trim().slice(0, 80),
          label: String(badge.label || '').trim().slice(0, 80),
          awardedAt: Number(badge.awardedAt) || Date.now()
        });
        changed = true;
      });
      if (!changed) return false;
      merged.sort((a, b) => Number(b.awardedAt || 0) - Number(a.awardedAt || 0));
      user.stats.tournamentBadges = merged.slice(0, 20);
      this.updateUser(user);
      return true;
    },
    getTierGradients() {
      return {
        Bronze: 'linear-gradient(135deg, rgba(109, 213, 255, 0.6), rgba(139, 92, 255, 0.6))',
        Silver: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(182, 204, 255, 0.6))',
        Gold: 'linear-gradient(135deg, rgba(255, 211, 93, 0.7), rgba(255, 143, 92, 0.7))',
        Platinum: 'linear-gradient(135deg, rgba(109, 213, 255, 0.7), rgba(92, 255, 176, 0.7))',
        Diamond: 'linear-gradient(135deg, rgba(180, 140, 255, 0.7), rgba(109, 213, 255, 0.7))',
        Nebula: 'linear-gradient(135deg, rgba(255, 143, 92, 0.7), rgba(139, 92, 255, 0.7))',
        Legend: 'linear-gradient(135deg, rgba(255, 211, 93, 0.7), rgba(180, 140, 255, 0.7))'
      };
    },
    getAvatarPayload(user) {
      if (!user) return { avatarUrl: '', avatarPreset: '' };
      const cosmetics = user.cosmetics || {};
      const url = String(cosmetics.avatarUrl || '').trim();
      const avatarUrl = /^https?:\/\//.test(url) ? url : '';
      const preset = String(cosmetics.presetAvatar || '').trim();
      const validPreset = this.data.presets.some((item) => item.id === preset) ? preset : '';
      return { avatarUrl, avatarPreset: validPreset };
    },
    getChatIdentityPayload(user) {
      if (!user) {
        return {
          titleTag: '',
          chatNameColor: ''
        };
      }
      const points = this.computePoints(user);
      const title = this.getActiveTitleTag(user, points);
      const color = this.getActiveChatNameColor(user, points);
      return {
        titleTag: String(title?.label || '').trim().slice(0, 28),
        chatNameColor: String(color?.color || '').trim().slice(0, 12)
      };
    },
    resolveAvatarUrl(entry) {
      if (!entry) return '';
      const presetId = String(entry.avatarPreset || '').trim();
      if (presetId) {
        const preset = this.data.presets.find((item) => item.id === presetId);
        if (preset) return preset.url;
      }
      const url = String(entry.avatarUrl || '').trim();
      if (/^https?:\/\//.test(url) || url.startsWith('data:image/')) return url;
      return '';
    },
    canGlobalSync(minGapMs = 1200) {
      const config = this.data.globalLeaderboard;
      if (!config?.enabled || !this.hasGlobalSyncBackend()) return false;
      if (window.location.protocol === 'file:') return false;
      let last = 0;
      try {
        last = Number(localStorage.getItem(this.storage.globalSync) || 0);
      } catch (err) {
        last = 0;
      }
      const now = Date.now();
      if (now - last < minGapMs) return false;
      try {
        localStorage.setItem(this.storage.globalSync, String(now));
      } catch (err) {
        // ignore storage errors
      }
      return true;
    },
    hasGlobalSyncBackend() {
      const config = this.data.globalLeaderboard || {};
      if (!config.enabled) return false;
      if (String(config.provider || '').toLowerCase() === 'supabase') {
        return Boolean(config.supabaseUrl && config.supabaseKey);
      }
      return Boolean(config.endpoint);
    },
    isSupabaseLeaderboardEnabled() {
      const config = this.data.globalLeaderboard || {};
      return (
        String(config.provider || '').toLowerCase() === 'supabase' &&
        Boolean(config.supabaseUrl) &&
        Boolean(config.supabaseKey)
      );
    },
    getSupabaseHeaders() {
      const key = String(this.data.globalLeaderboard?.supabaseKey || '');
      return {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      };
    },
    buildGlobalPayload(user) {
      if (!user) return null;
      const points = this.computePoints(user);
      const tier = this.getTier(points);
      const avatar = this.getAvatarPayload(user);
      return {
        id: user.id,
        username: user.username,
        points,
        tier: tier.name,
        avatarUrl: avatar.avatarUrl,
        avatarPreset: avatar.avatarPreset
      };
    },
    async pushGlobalUser(user, force = false) {
      const config = this.data.globalLeaderboard;
      if (!config?.enabled || !this.hasGlobalSyncBackend()) return;
      if (!user) return;
      if (!force && !this.canGlobalSync()) return;
      const payload = this.buildGlobalPayload(user);
      if (!payload) return;
      try {
        if (this.isSupabaseLeaderboardEnabled()) {
          const nowIso = new Date().toISOString();
          await fetch(
            `${config.supabaseUrl}/rest/v1/global_leaderboard?on_conflict=id`,
            {
              method: 'POST',
              headers: {
                ...this.getSupabaseHeaders(),
                Prefer: 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify([
                {
                  id: String(payload.id || '').slice(0, 80),
                  username: String(payload.username || '').slice(0, 18),
                  points: Number(payload.points || 0),
                  updated_at: nowIso
                }
              ])
            }
          );
          return;
        }
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        this.handleGlobalSyncResponse(data, response.status);
      } catch (err) {
        // ignore network errors
      }
    },
    async syncCurrentUser(force = false) {
      const user = this.getCurrentUser();
      await this.pushGlobalUser(user, force);
    },
    async syncAllUsers(force = false) {
      const users = this.getUsers();
      if (!users.length) return;
      await Promise.allSettled(users.map((user) => this.pushGlobalUser(user, force)));
    },
    startGlobalLiveSync() {
      const config = this.data.globalLeaderboard;
      if (!config?.enabled || !this.hasGlobalSyncBackend()) return;
      if (window.location.protocol === 'file:') return;
      const pushMs = Math.max(3000, Number(config.livePushMs) || 8000);
      clearInterval(this.globalLiveSyncTimer);
      this.syncAllUsers(true);
      this.syncCurrentUser(true);
      this.pollGlobalAnnouncement();
      this.globalLiveSyncTimer = setInterval(() => {
        if (document.hidden) return;
        this.syncCurrentUser(true);
        this.pollGlobalAnnouncement();
      }, pushMs);
      if (!this.globalVisibilityListenerAdded) {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.syncCurrentUser(true);
            this.pollGlobalAnnouncement();
          }
        });
        this.globalVisibilityListenerAdded = true;
      }
    },
    buildAnnouncementUserQuery() {
      const current = this.getCurrentUser();
      const params = [];
      const userId = String(current?.id || '')
        .trim()
        .slice(0, 80);
      const username = String(current?.username || '')
        .trim()
        .slice(0, 18);
      if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
      if (username) params.push(`username=${encodeURIComponent(username)}`);
      return params.join('&');
    },
    async reactToAnnouncement(announcementId, reaction) {
      const config = this.data.announcementReactions;
      if (!config?.endpoint) return { ok: false, error: 'Reactions endpoint not configured.' };
      if (window.location.protocol === 'file:') return { ok: false, error: 'Reactions require Netlify deployment.' };
      const user = this.getCurrentUser();
      if (!user) return { ok: false, error: 'Sign in to react.' };
      const normalizedReaction = String(reaction || '')
        .trim()
        .toLowerCase();
      const payload = {
        announcementId: String(announcementId || '').trim().slice(0, 80),
        reaction: normalizedReaction || 'clear',
        userId: String(user.id || '')
          .trim()
          .slice(0, 80),
        username: String(user.username || '')
          .trim()
          .slice(0, 18)
      };
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        if (data && typeof data === 'object') {
          this.renderGlobalAnnouncement(data.announcement || null);
        }
        if (!response.ok) {
          return { ok: false, status: response.status, error: String(data?.error || 'Failed to save reaction.') };
        }
        return { ok: true, status: response.status, data };
      } catch (err) {
        return { ok: false, status: 0, error: String(err?.message || 'Failed to save reaction.') };
      }
    },
    async fetchGlobalLeaderboard(limit) {
      const config = this.data.globalLeaderboard;
      if (!config?.enabled || !this.hasGlobalSyncBackend()) return null;
      if (window.location.protocol === 'file:') return null;
      const max = Number(limit || config.limit || 10);
      try {
        if (this.isSupabaseLeaderboardEnabled()) {
          const response = await fetch(
            `${config.supabaseUrl}/rest/v1/global_leaderboard?select=id,username,points,updated_at&order=points.desc,updated_at.desc&limit=${encodeURIComponent(max)}`,
            {
              cache: 'no-store',
              headers: this.getSupabaseHeaders()
            }
          );
          if (!response.ok) {
            this.lastGlobalError = String(response.status);
            return null;
          }
          const rows = await response.json();
          if (!Array.isArray(rows)) return null;
          this.lastGlobalError = '';
          return rows.map((row) => ({
            id: String(row.id || ''),
            username: String(row.username || 'Player'),
            points: Number(row.points || 0),
            tier: this.getTier(Number(row.points || 0)).name,
            avatarUrl: '',
            avatarPreset: '',
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
          }));
        }
        const userQuery = this.buildAnnouncementUserQuery();
        const queryBase = `limit=${encodeURIComponent(max)}&ts=${Date.now()}`;
        const query = userQuery ? `${queryBase}&${userQuery}` : queryBase;
        const response = await fetch(`${config.endpoint}?${query}`, { cache: 'no-store' });
        if (!response.ok) {
          let detail = '';
          try {
            const payload = await response.json();
            detail = payload?.code || payload?.error || '';
          } catch (err) {
            detail = '';
          }
          this.lastGlobalError = detail ? `${response.status} ${detail}` : String(response.status);
          return null;
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.entries)) return null;
        this.renderGlobalAnnouncement(data.announcement || null);
        this.lastGlobalError = '';
        return data.entries;
      } catch (err) {
        this.lastGlobalError = err?.message || 'network_error';
        return null;
      }
    },
    async pollGlobalAnnouncement() {
      const config = this.data.globalLeaderboard;
      if (!config?.enabled || !this.hasGlobalSyncBackend()) return null;
      if (window.location.protocol === 'file:') return null;
      if (this.isSupabaseLeaderboardEnabled()) return null;
      try {
        const userQuery = this.buildAnnouncementUserQuery();
        const queryBase = `limit=1&ts=${Date.now()}`;
        const query = userQuery ? `${queryBase}&${userQuery}` : queryBase;
        const response = await fetch(`${config.endpoint}?${query}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        this.renderGlobalAnnouncement(data?.announcement || null);
        return data?.announcement || null;
      } catch (err) {
        return null;
      }
    },
    async syncUpdateTimer() {
      const config = this.data.updateTimer;
      if (!config?.endpoint) return null;
      if (window.location.protocol === 'file:') return null;
      try {
        const response = await fetch(config.endpoint, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        const remoteTarget = Number(data?.target);
        if (!Number.isFinite(remoteTarget) || remoteTarget <= 0) return null;
        const localTarget = Number(this.safeParse(this.storage.updateV2Target, 0));
        const localRemaining = localTarget - Date.now();
        const preserveLocalRush =
          Number.isFinite(localTarget) && localRemaining > 0 && localRemaining <= 15 * 1000;
        const target = preserveLocalRush ? Math.min(remoteTarget, localTarget) : remoteTarget;
        this.safeSet(this.storage.updateV2Target, target);
        return target;
      } catch (err) {
        return null;
      }
    },
    normalizeChatMessage(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const id = String(raw.id || '')
        .trim()
        .slice(0, 80);
      const username = String(raw.username || '')
        .trim()
        .slice(0, 18);
      const text = String(raw.text || '')
        .trim()
        .slice(0, 220);
      const createdAt = Number(raw.createdAt);
      if (!id || !username || !text || !Number.isFinite(createdAt) || createdAt <= 0) return null;
      const gameId = String(raw.gameId || '')
        .trim()
        .slice(0, 60);
      const gameName = String(raw.gameName || '')
        .trim()
        .slice(0, 60);
      return {
        id,
        userId: String(raw.userId || '')
          .trim()
          .slice(0, 80),
        username,
        text,
        createdAt,
        gameId,
        gameName,
        avatarUrl: String(raw.avatarUrl || '')
          .trim()
          .slice(0, 500),
        avatarPreset: String(raw.avatarPreset || '')
          .trim()
          .slice(0, 40),
        titleTag: String(raw.titleTag || '')
          .trim()
          .slice(0, 28),
        chatNameColor: String(raw.chatNameColor || '')
          .trim()
          .slice(0, 12)
      };
    },
    setGameChatStatus(message, isError = false) {
      const statusEl = document.getElementById('gameChatStatus');
      if (!statusEl) return;
      statusEl.textContent = message || '';
      statusEl.classList.toggle('game-chat-status-error', Boolean(isError));
    },
    async reportGameChatMessage(message) {
      const config = this.data.gameChat;
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showToast('Sign in to report messages.');
        return;
      }
      if (!config?.endpoint || !message?.id) return;
      const reasonInput = window.prompt('Report reason (optional):', 'Inappropriate message');
      if (reasonInput === null) return;
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'report_message',
            room: this.gameChatState?.room || 'global-games',
            messageId: String(message.id || '').slice(0, 80),
            reporterId: String(currentUser.id || '').slice(0, 80),
            reporterName: String(currentUser.username || '').slice(0, 18),
            reason: String(reasonInput || '').slice(0, 160)
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          this.showToast(String(data?.error || 'Failed to report message.'));
          return;
        }
        this.showToast('Message reported.');
      } catch (err) {
        this.showToast('Could not send report.');
      }
    },
    renderGameChatMessages(messages = []) {
      const list = document.getElementById('gameChatList');
      if (!list) return;
      const rows = Array.isArray(messages) ? messages.map((row) => this.normalizeChatMessage(row)).filter(Boolean) : [];
      const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
      list.innerHTML = '';
      if (!rows.length) {
        list.innerHTML = '<div class="empty">No messages yet. Be the first to chat.</div>';
        return;
      }
      const gradients = this.getTierGradients();
      rows.forEach((row) => {
        const entry = document.createElement('div');
        entry.className = 'game-chat-row';

        const avatar = document.createElement('div');
        avatar.className = 'game-chat-avatar';
        const avatarUrl = this.resolveAvatarUrl({ avatarUrl: row.avatarUrl, avatarPreset: row.avatarPreset });
        if (avatarUrl) {
          const img = document.createElement('img');
          img.src = avatarUrl;
          img.alt = row.username;
          avatar.appendChild(img);
        } else {
          avatar.style.background = gradients.Bronze;
          avatar.textContent = row.username.slice(0, 1).toUpperCase();
        }

        const bubble = document.createElement('div');
        bubble.className = 'game-chat-bubble';

        const meta = document.createElement('div');
        meta.className = 'game-chat-meta';
        const name = document.createElement('strong');
        this.applyChatNameStyle(name, row.username, row.chatNameColor);
        const displayName = this.formatDisplayUsername(row.username);
        name.textContent = row.titleTag ? `[${row.titleTag}] ${displayName}` : displayName;
        const time = document.createElement('span');
        const timeText = new Date(row.createdAt).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        });
        const tag = row.gameName ? ` · ${row.gameName}` : row.gameId ? ` · ${row.gameId}` : '';
        time.textContent = `${timeText}${tag}`;
        const actions = document.createElement('div');
        actions.className = 'game-chat-actions';
        const reportBtn = document.createElement('button');
        reportBtn.type = 'button';
        reportBtn.className = 'chat-report-btn';
        reportBtn.textContent = 'Report';
        reportBtn.addEventListener('click', () => this.reportGameChatMessage(row));
        const currentUserId = String(this.getCurrentUser()?.id || '');
        if (currentUserId && row.userId && row.userId === currentUserId) {
          reportBtn.disabled = true;
          reportBtn.title = 'You cannot report your own message.';
        }
        actions.appendChild(time);
        actions.appendChild(reportBtn);
        meta.appendChild(name);
        meta.appendChild(actions);

        const text = document.createElement('p');
        text.className = 'game-chat-text';
        text.textContent = row.text;

        bubble.appendChild(meta);
        bubble.appendChild(text);
        entry.appendChild(avatar);
        entry.appendChild(bubble);
        list.appendChild(entry);
      });

      if (nearBottom || !this.gameChatHasScrolled) {
        list.scrollTop = list.scrollHeight;
        this.gameChatHasScrolled = true;
      }
    },
    async fetchGameChatMessages() {
      const config = this.data.gameChat;
      const state = this.gameChatState;
      if (!config?.endpoint || !state) return null;
      if (window.location.protocol === 'file:') {
        this.setGameChatStatus('Online chat needs Netlify deployment.', true);
        return null;
      }
      try {
        const me = this.getCurrentUser();
        const userId = String(me?.id || '').trim().slice(0, 80);
        const username = String(me?.username || '').trim().slice(0, 18);
        const params = new URLSearchParams({
          room: state.room,
          limit: String(Math.max(10, Number(config.limit) || 80)),
          ts: String(Date.now())
        });
        if (userId) params.set('userId', userId);
        if (username) params.set('username', username);
        const query = params.toString();
        const response = await fetch(`${config.endpoint}?${query}`, { cache: 'no-store' });
        if (!response.ok) {
          let errorMessage = 'Chat unavailable right now.';
          try {
            const payload = await response.json();
            if (payload?.error) errorMessage = String(payload.error);
          } catch (err) {
            // ignore parsing issues
          }
          this.setGameChatStatus(errorMessage, true);
          return null;
        }
        const data = await response.json();
        const messages = Array.isArray(data?.messages)
          ? data.messages.map((row) => this.normalizeChatMessage(row)).filter(Boolean)
          : [];
        this.gameChatState.messages = messages;
        this.renderGameChatMessages(messages);
        if (Number(data?.mutedUntil) > Date.now()) {
          this.setGameChatStatus(`You are muted until ${new Date(Number(data.mutedUntil)).toLocaleString()}.`, true);
          return messages;
        }
        this.setGameChatStatus('Live global chat is online.');
        return messages;
      } catch (err) {
        this.setGameChatStatus('Could not reach chat server.', true);
        return null;
      }
    },
    async sendGameChatMessage(game) {
      const config = this.data.gameChat;
      const state = this.gameChatState;
      if (!config?.endpoint || !state) return;
      const input = document.getElementById('gameChatInput');
      if (!input) return;
      const user = this.getCurrentUser();
      if (!user) {
        this.showToast('Sign in to chat.');
        return;
      }
      const message = input.value.trim().slice(0, 220);
      if (!message) return;
      if (window.location.protocol === 'file:') {
        this.setGameChatStatus('Online chat needs Netlify deployment.', true);
        return;
      }

      const avatar = this.getAvatarPayload(user);
      const chatIdentity = this.getChatIdentityPayload(user);
      const payload = {
        room: state.room,
        userId: user.id,
        username: user.username,
        message,
        gameId: String(game?.id || '').trim().slice(0, 60),
        gameName: String(game?.name || '').trim().slice(0, 60),
        avatarUrl: avatar.avatarUrl,
        avatarPreset: avatar.avatarPreset,
        titleTag: chatIdentity.titleTag,
        chatNameColor: chatIdentity.chatNameColor
      };

      const sendBtn = document.getElementById('gameChatSend');
      if (sendBtn) sendBtn.disabled = true;

      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        if (!response.ok) {
          const code = String(data?.code || '').toUpperCase();
          if (code === 'MUTED') {
            this.setGameChatStatus(String(data?.error || 'You are muted.'), true);
          } else if (code === 'BANNED_WORD') {
            this.setGameChatStatus(String(data?.error || 'Blocked by chat filter.'), true);
          } else {
            this.setGameChatStatus(String(data?.error || 'Failed to send message.'), true);
          }
          return;
        }
        input.value = '';
        if (data?.message) {
          const next = this.normalizeChatMessage(data.message);
          const current = Array.isArray(this.gameChatState.messages) ? this.gameChatState.messages : [];
          if (next && !current.some((row) => row.id === next.id)) {
            current.push(next);
            this.gameChatState.messages = current.slice(-120);
            this.renderGameChatMessages(this.gameChatState.messages);
          } else {
            this.fetchGameChatMessages();
          }
        } else {
          this.fetchGameChatMessages();
        }
        this.setGameChatStatus('Message sent.');
      } catch (err) {
        this.setGameChatStatus('Could not send message.', true);
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    },
    setupGameChat(game) {
      clearInterval(this.gameChatPollTimer);
      this.gameChatState = null;
      this.gameChatHasScrolled = false;
      const aside = document.querySelector('.game-layout .side');
      if (!aside) return;

      let card = document.getElementById('gameChatCard');
      if (!card) {
        card = document.createElement('div');
        card.className = 'card game-chat-card';
        card.id = 'gameChatCard';
        card.innerHTML = `
          <h3>Live Chat</h3>
          <p class="notice">Global chat for all players currently on game pages.</p>
          <div class="game-chat-list" id="gameChatList"></div>
          <div class="game-chat-form">
            <input id="gameChatInput" maxlength="220" placeholder="Type a message..." />
            <button class="btn primary" id="gameChatSend" type="button">Send</button>
          </div>
          <div class="notice" id="gameChatStatus">Connecting chat...</div>
        `;
        aside.appendChild(card);
      }

      this.gameChatState = {
        room: String(this.data.gameChat?.room || 'global-games')
          .trim()
          .slice(0, 40),
        messages: []
      };

      const input = document.getElementById('gameChatInput');
      const sendBtn = document.getElementById('gameChatSend');
      if (sendBtn) {
        sendBtn.onclick = () => this.sendGameChatMessage(game);
      }
      if (input) {
        input.onkeydown = (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.sendGameChatMessage(game);
          }
        };
      }

      this.fetchGameChatMessages();
      const pollMs = Math.max(2000, Number(this.data.gameChat?.livePollMs) || 3500);
      this.gameChatPollTimer = setInterval(() => {
        if (document.hidden) return;
        this.fetchGameChatMessages();
      }, pollMs);
    },
    getTier(points) {
      const tiers = this.data.tiers;
      let current = tiers[0];
      tiers.forEach((tier) => {
        if (points >= tier.min) current = tier;
      });
      return current;
    },
    applyTheme() {
      const saved = this.safeParse(this.storage.theme, 'dark');
      const theme = saved === 'light' ? 'light' : 'dark';
      document.body.dataset.theme = theme;
    },
    setTheme(theme) {
      const next = theme === 'light' ? 'light' : 'dark';
      this.safeSet(this.storage.theme, next);
      document.body.dataset.theme = next;
      this.showToast(`Theme set to ${next}.`);
    },
    isAdBlockEnabled() {
      const saved = this.safeParse(this.storage.adBlock, null);
      return saved !== false;
    },
    setAdBlockEnabled(enabled, silent = false) {
      const next = !!enabled;
      this.safeSet(this.storage.adBlock, next);
      if (!silent) {
        this.showToast(`Ad blocker ${next ? 'enabled' : 'disabled'}.`);
      }
      return next;
    },
    isAdminModeEnabled() {
      return Boolean(this.safeParse(this.storage.adminMode, false));
    },
    setAdminModeEnabled(enabled) {
      this.safeSet(this.storage.adminMode, Boolean(enabled));
    },
    normalizeAnnouncement(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const message = String(raw.message || '')
        .trim()
        .slice(0, 320);
      if (!message) return null;
      const expiresAt = Number(raw.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
      const id = String(raw.id || `ann_${expiresAt}`)
        .trim()
        .slice(0, 80);
      if (!id) return null;
      const createdBy = String(raw.createdBy || 'Admin')
        .trim()
        .slice(0, 18);
      const up = Math.max(0, Math.round(Number(raw?.reactions?.up) || 0));
      const down = Math.max(0, Math.round(Number(raw?.reactions?.down) || 0));
      const userReactionRaw = String(raw.userReaction || '')
        .trim()
        .toLowerCase();
      const userReaction = userReactionRaw === 'up' || userReactionRaw === 'down' ? userReactionRaw : '';
      return {
        id,
        message,
        expiresAt,
        createdBy: createdBy || 'Admin',
        reactions: { up, down, total: up + down },
        userReaction
      };
    },
    renderGlobalAnnouncement(rawAnnouncement) {
      const announcement = this.normalizeAnnouncement(rawAnnouncement);
      const existing = document.getElementById('globalAnnouncementBar');
      if (!announcement) {
        clearInterval(this.globalAnnouncementTimer);
        if (existing) existing.remove();
        return;
      }
      const app = document.querySelector('.app');
      if (!app) return;
      let bar = existing;
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'globalAnnouncementBar';
        bar.className = 'global-announcement card';
        const topbar = app.querySelector('.topbar');
        if (topbar) {
          app.insertBefore(bar, topbar.nextSibling);
        } else {
          app.prepend(bar);
        }
      }
      const render = () => {
        const remaining = announcement.expiresAt - Date.now();
        if (remaining <= 0) {
          clearInterval(this.globalAnnouncementTimer);
          bar.remove();
          return;
        }
        bar.innerHTML = '';
        const pill = document.createElement('div');
        pill.className = 'pill accent';
        pill.textContent = 'Global Announcement';
        const message = document.createElement('div');
        message.className = 'global-announcement-text';
        message.textContent = announcement.message;
        const author = document.createElement('div');
        author.className = 'global-announcement-author';
        author.textContent = `By ${announcement.createdBy || 'Admin'}`;
        const time = document.createElement('div');
        time.className = 'global-announcement-time';
        time.textContent = `Ends in ${this.formatShortCountdown(remaining)}`;
        const reactions = document.createElement('div');
        reactions.className = 'global-announcement-reactions';
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = `reaction-btn ${announcement.userReaction === 'up' ? 'active' : ''}`.trim();
        upBtn.textContent = `👍 ${announcement.reactions?.up || 0}`;
        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = `reaction-btn ${announcement.userReaction === 'down' ? 'active' : ''}`.trim();
        downBtn.textContent = `👎 ${announcement.reactions?.down || 0}`;
        upBtn.addEventListener('click', async () => {
          const next = announcement.userReaction === 'up' ? 'clear' : 'up';
          const result = await this.reactToAnnouncement(announcement.id, next);
          if (!result.ok && result.error) this.showToast(result.error);
        });
        downBtn.addEventListener('click', async () => {
          const next = announcement.userReaction === 'down' ? 'clear' : 'down';
          const result = await this.reactToAnnouncement(announcement.id, next);
          if (!result.ok && result.error) this.showToast(result.error);
        });
        reactions.appendChild(upBtn);
        reactions.appendChild(downBtn);
        bar.appendChild(pill);
        bar.appendChild(message);
        bar.appendChild(author);
        bar.appendChild(time);
        bar.appendChild(reactions);
      };
      render();
      clearInterval(this.globalAnnouncementTimer);
      this.globalAnnouncementTimer = setInterval(render, 1000);

      const seen = this.safeParse(this.storage.announcementSeen, '');
      if (seen !== announcement.id) {
        this.safeSet(this.storage.announcementSeen, announcement.id);
        this.showToast(`Announcement: ${announcement.message}`);
      }
    },
    handleGlobalSyncResponse(payload, responseStatus) {
      if (payload && typeof payload === 'object') {
        this.renderGlobalAnnouncement(payload.announcement || null);
      }
      const code = String(payload?.code || '').toUpperCase();
      if (responseStatus === 403 && (code === 'BANNED' || code === 'KICKED')) {
        this.safeSet(this.storage.current, null);
        this.safeSet(this.storage.showAuth, true);
        this.renderTopbar();
        const message =
          String(payload?.error || payload?.message || '').trim() ||
          (code === 'BANNED'
            ? 'You are banned from global leaderboard sync.'
            : 'You were kicked and need to sign in again.');
        this.showToast(message);
        const page = document.body.dataset.page;
        if (page === 'game') {
          window.location.href = '../index.html';
        } else if (page && page !== 'home') {
          window.location.href = 'index.html';
        }
      }
    },
    async adminRequest(action, body = {}) {
      const config = this.data.adminTools;
      if (!config?.endpoint) {
        return { ok: false, status: 0, data: { error: 'Admin endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Admin tools require Netlify deployment.' } };
      }
      const currentUser = this.getCurrentUser();
      const adminUsername = String(currentUser?.username || 'Admin')
        .trim()
        .slice(0, 18);
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminCode: config.code,
            adminUsername: adminUsername || 'Admin',
            action,
            ...body
          })
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        this.renderGlobalAnnouncement(data?.announcement || null);
        return { ok: response.ok, status: response.status, data };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { error: String(err?.message || 'Admin request failed.') }
        };
      }
    },
    async chatAdminRequest(action, body = {}) {
      const config = this.data.gameChat;
      const adminCode = this.data.adminTools?.code || '';
      if (!config?.adminEndpoint) {
        return { ok: false, status: 0, data: { error: 'Chat admin endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Chat admin requires Netlify deployment.' } };
      }
      try {
        const response = await fetch(config.adminEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            adminCode,
            ...body
          })
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        return { ok: response.ok, status: response.status, data };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { error: String(err?.message || 'Chat admin request failed.') }
        };
      }
    },
    async tournamentAdminRequest(action, body = {}) {
      const config = this.data.tournament;
      const adminCode = this.data.adminTools?.code || '';
      if (!config?.endpoint) {
        return { ok: false, status: 0, data: { error: 'Tournament endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Tournament admin requires Netlify deployment.' } };
      }
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            adminCode,
            ...body
          })
        });
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        return { ok: response.ok, status: response.status, data };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { error: String(err?.message || 'Tournament admin request failed.') }
        };
      }
    },
    showToast(message) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    },
    isOwnerUsername(username) {
      return String(username || '')
        .trim()
        .toLowerCase() === 'logitech';
    },
    formatDisplayUsername(username) {
      const clean = String(username || '').trim();
      if (!clean) return 'Player';
      return this.isOwnerUsername(clean) ? `${clean} (OWNER)` : clean;
    },
    applyChatNameStyle(nameEl, username, color = '') {
      if (!nameEl) return;
      const safeColor = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color || '') ? String(color) : '';
      if (safeColor) {
        nameEl.style.color = safeColor;
      } else {
        nameEl.style.color = '';
      }
      nameEl.classList.remove('owner-rainbow');
      if (this.isOwnerUsername(username)) {
        nameEl.classList.add('owner-rainbow');
      }
    },
    async callSocialApi(action, payload = {}, method = 'POST') {
      const endpoint = this.data.social?.endpoint;
      if (!endpoint) {
        return { ok: false, status: 0, data: { error: 'Social endpoint not configured.' } };
      }
      if (window.location.protocol === 'file:') {
        return { ok: false, status: 0, data: { error: 'Social features require Netlify deployment.' } };
      }
      try {
        let url = endpoint;
        let options = {};
        if (method === 'GET') {
          const params = new URLSearchParams({ action });
          Object.keys(payload || {}).forEach((key) => {
            const val = payload[key];
            if (val === undefined || val === null || val === '') return;
            params.set(key, String(val));
          });
          url = `${endpoint}?${params.toString()}`;
          options = { method: 'GET' };
        } else {
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload })
          };
        }
        const response = await fetch(url, options);
        let data = {};
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
        return { ok: response.ok, status: response.status, data };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { error: String(err?.message || 'Social request failed.') }
        };
      }
    },
    showRecoverySecurityPopup(user) {
      if (!user) return;
      const existing = document.getElementById('recoverySecurityOverlay');
      if (existing) existing.remove();

      const emailMask = this.formatRecoveryContact(user, 'email');
      const smsMask = this.formatRecoveryContact(user, 'sms');
      const hasRecovery = Boolean(emailMask || smsMask);
      const contactLine = hasRecovery
        ? `Current recovery: ${
            emailMask ? `Email ${emailMask}` : ''
          }${emailMask && smsMask ? ' · ' : ''}${smsMask ? `SMS ${smsMask}` : ''}.`
        : 'No recovery contact is saved yet.';

      const overlay = document.createElement('div');
      overlay.className = 'overlay active security-popup-overlay';
      overlay.id = 'recoverySecurityOverlay';
      overlay.innerHTML = `
        <div class="security-popup card">
          <h2>Keep Your Account Safe</h2>
          <p>
            If you want your account safe, verify your email/phone number.
            If you already have an account, go to Profile Settings and add a recovery email or phone number.
          </p>
          <p class="notice">${contactLine}</p>
          <div class="security-popup-actions">
            <button class="btn primary" id="openRecoveryProfileBtn">Open Profile Settings</button>
            <button class="btn ghost" id="closeRecoveryPopupBtn">Later</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#openRecoveryProfileBtn')?.addEventListener('click', () => {
        window.location.href = 'profile.html';
      });
      overlay.querySelector('#closeRecoveryPopupBtn')?.addEventListener('click', () => {
        overlay.remove();
      });
    },
    renderTopbar() {
      const userArea = document.getElementById('userArea');
      if (!userArea) return;
      const user = this.getCurrentUser();
      userArea.innerHTML = '';
      const showSettings =
        document.body.dataset.page !== 'game' && document.body.dataset.page !== 'notfound';
      if (showSettings) {
        const settingsLink = document.createElement('a');
        settingsLink.className = 'link';
        if (this.isAdminModeEnabled()) {
          settingsLink.href = 'admin.html';
          settingsLink.textContent = 'Admin';
        } else {
          settingsLink.href = 'settings.html';
          settingsLink.textContent = 'Settings';
        }
        userArea.appendChild(settingsLink);
      }
      if (!user) {
        const guest = document.createElement('div');
        guest.className = 'user-chip';
        guest.innerHTML = '<div class="name">Guest</div><div class="meta">Sign in to play</div>';
        userArea.appendChild(guest);
        return;
      }
      const points = this.computePoints(user);
      const tier = this.getTier(points);
      const titleTag = this.getActiveTitleTag(user, points);
      const chatColor = this.getActiveChatNameColor(user, points);
      const ownerName = this.formatDisplayUsername(user.username);
      const displayName = titleTag?.label ? `[${titleTag.label}] ${ownerName}` : ownerName;
      const badgeCount = Array.isArray(user.stats?.tournamentBadges) ? user.stats.tournamentBadges.length : 0;
      const chip = document.createElement('div');
      chip.className = 'user-chip';
      chip.innerHTML = `
        <div>
          <div class="name">${displayName}</div>
          <div class="meta">${points} pts · ${tier.name}${badgeCount ? ` · ${badgeCount} badge${badgeCount === 1 ? '' : 's'}` : ''}</div>
        </div>
      `;
      if (chatColor?.color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(chatColor.color)) {
        const nameEl = chip.querySelector('.name');
        if (nameEl) nameEl.style.color = chatColor.color;
      }
      const profileLink = document.createElement('a');
      profileLink.href = 'profile.html';
      profileLink.className = 'link';
      profileLink.textContent = 'Profile';
      const signOut = document.createElement('button');
      signOut.className = 'btn ghost';
      signOut.textContent = 'Sign Out';
      signOut.addEventListener('click', () => {
        this.signOut();
        window.location.href = 'index.html';
      });
      userArea.appendChild(chip);
      userArea.appendChild(profileLink);
      userArea.appendChild(signOut);
    },
    injectLeaderboardLink() {
      const topbarRight = document.querySelector('.topbar-right');
      if (!topbarRight) return;
      const isGamePage = document.body.dataset.page === 'game';
      const userArea = document.getElementById('userArea');
      const links = [
        {
          id: 'leaderboard',
          label: 'Leaderboard',
          href: isGamePage ? '../leaderboard.html' : 'leaderboard.html'
        }
      ];
      links.forEach((item) => {
        if (topbarRight.querySelector(`[data-global-link="${item.id}"]`)) return;
        const link = document.createElement('a');
        link.className = 'link';
        link.dataset.globalLink = item.id;
        link.href = item.href;
        link.textContent = item.label;
        if (userArea && userArea.parentElement === topbarRight) {
          topbarRight.insertBefore(link, userArea);
        } else {
          topbarRight.appendChild(link);
        }
      });
    },
    initAuthOverlay() {
      const overlay = document.getElementById('authOverlay');
      if (!overlay) return;
      const tabLogin = document.getElementById('tabLogin');
      const tabCreate = document.getElementById('tabCreate');
      const loginForm = document.getElementById('loginForm');
      const createForm = document.getElementById('createForm');
      const showRecoveryBtn = document.getElementById('showRecoveryBtn');
      const recoveryPanel = document.getElementById('recoveryPanel');
      const recoveryUsernameInput = document.getElementById('recoveryUsernameInput');
      const recoveryMethodEmailBtn = document.getElementById('recoveryMethodEmail');
      const recoveryMethodSmsBtn = document.getElementById('recoveryMethodSms');
      const sendRecoveryCodeBtn = document.getElementById('sendRecoveryCodeBtn');
      const recoveryCodeInput = document.getElementById('recoveryCodeInput');
      const recoveryNewPinInput = document.getElementById('recoveryNewPinInput');
      const verifyRecoveryCodeBtn = document.getElementById('verifyRecoveryCodeBtn');
      const recoveryStatusText = document.getElementById('recoveryStatusText');
      const recoveryState = {
        method: 'email',
        pending: null
      };
      const toggleTabStyle = (btn, active) => {
        if (!btn) return;
        btn.classList.toggle('primary', active);
        btn.classList.toggle('ghost', !active);
      };
      const switchTab = (tab) => {
        if (tab === 'login') {
          toggleTabStyle(tabLogin, true);
          toggleTabStyle(tabCreate, false);
          loginForm.style.display = 'grid';
          createForm.style.display = 'none';
        } else {
          toggleTabStyle(tabCreate, true);
          toggleTabStyle(tabLogin, false);
          createForm.style.display = 'grid';
          loginForm.style.display = 'none';
        }
      };
      tabLogin?.addEventListener('click', () => switchTab('login'));
      tabCreate?.addEventListener('click', () => switchTab('create'));

      loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = loginForm.querySelector('input[name="login-username"]').value;
        const pin = loginForm.querySelector('input[name="login-pin"]').value;
        const result = this.loginUser(username, pin);
        if (!result.ok) {
          this.showToast(result.message);
          return;
        }
        this.safeSet(this.storage.showAuth, false);
        overlay.classList.remove('active');
        this.renderTopbar();
        this.syncCurrentUser(true);
        const redirect = this.safeParse(this.storage.postLogin, '');
        if (redirect) {
          this.safeSet(this.storage.postLogin, '');
          window.location.href = redirect;
          return;
        }
        this.showToast('Welcome back!');
      });

      createForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = createForm.querySelector('input[name="create-username"]').value;
        const pin = createForm.querySelector('input[name="create-pin"]').value;
        const recoveryEmail =
          createForm.querySelector('input[name="create-recovery-email"]')?.value || '';
        const recoveryPhone =
          createForm.querySelector('input[name="create-recovery-phone"]')?.value || '';
        const result = this.createUser(username, pin, {
          email: recoveryEmail,
          phone: recoveryPhone
        });
        if (!result.ok) {
          this.showToast(result.message);
          return;
        }
        this.safeSet(this.storage.showAuth, false);
        overlay.classList.remove('active');
        this.renderTopbar();
        this.syncCurrentUser(true);
        this.showToast('Account created.');
        this.showRecoverySecurityPopup(result.user);
      });

      const setRecoveryStatus = (message, isError = false) => {
        if (!recoveryStatusText) return;
        recoveryStatusText.textContent = message || '';
        recoveryStatusText.style.color = isError ? 'var(--warn)' : '';
      };
      const setRecoveryMethod = (method) => {
        recoveryState.method = method === 'sms' ? 'sms' : 'email';
        toggleTabStyle(recoveryMethodEmailBtn, recoveryState.method === 'email');
        toggleTabStyle(recoveryMethodSmsBtn, recoveryState.method === 'sms');
      };
      const findRecoveryUser = () => {
        const username = String(recoveryUsernameInput?.value || '')
          .trim()
          .slice(0, 18);
        if (!username) return null;
        const users = this.getUsers();
        const match = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
        if (!match) return null;
        return this.normalizeUser({ ...match });
      };
      const refreshRecoveryHint = () => {
        const match = findRecoveryUser();
        recoveryState.pending = null;
        if (!match) {
          setRecoveryStatus('Enter a username on this device to recover that PIN.', false);
          return;
        }
        const email = this.getRecoveryContact(match, 'email');
        const sms = this.getRecoveryContact(match, 'sms');
        if (!email && !sms) {
          setRecoveryStatus('No recovery contact saved. Sign in first and set email/phone in Profile.', true);
          return;
        }
        if (recoveryState.method === 'email' && !email && sms) setRecoveryMethod('sms');
        if (recoveryState.method === 'sms' && !sms && email) setRecoveryMethod('email');
        const activeContact = this.formatRecoveryContact(match, recoveryState.method);
        if (!activeContact) {
          setRecoveryStatus(
            recoveryState.method === 'email'
              ? 'This account has no recovery email saved.'
              : 'This account has no recovery phone saved.',
            true
          );
          return;
        }
        setRecoveryStatus(
          `${recoveryState.method.toUpperCase()} ready for ${activeContact}. Send code to continue.`,
          false
        );
      };

      showRecoveryBtn?.addEventListener('click', () => {
        if (!recoveryPanel) return;
        const isHidden = recoveryPanel.style.display === 'none';
        recoveryPanel.style.display = isHidden ? 'grid' : 'none';
        showRecoveryBtn.textContent = isHidden ? 'Hide Recovery' : 'Forgot PIN? Use Email/SMS Code';
        if (isHidden) refreshRecoveryHint();
      });

      recoveryUsernameInput?.addEventListener('input', () => {
        refreshRecoveryHint();
      });
      recoveryMethodEmailBtn?.addEventListener('click', () => {
        setRecoveryMethod('email');
        refreshRecoveryHint();
      });
      recoveryMethodSmsBtn?.addEventListener('click', () => {
        setRecoveryMethod('sms');
        refreshRecoveryHint();
      });
      sendRecoveryCodeBtn?.addEventListener('click', async () => {
        const match = findRecoveryUser();
        if (!match) {
          setRecoveryStatus('Username not found on this device.', true);
          return;
        }
        const destination = this.getRecoveryContact(match, recoveryState.method);
        if (!destination) {
          setRecoveryStatus(
            recoveryState.method === 'email'
              ? 'No recovery email saved for this account.'
              : 'No recovery phone saved for this account.',
            true
          );
          return;
        }
        setRecoveryStatus(`Sending code via ${recoveryState.method.toUpperCase()}...`, false);
        const result = await this.callRecoveryApi('send', {
          username: match.username,
          method: recoveryState.method,
          destination
        });
        if (!result.ok) {
          setRecoveryStatus(String(result?.data?.error || 'Could not send recovery code.'), true);
          return;
        }
        recoveryState.pending = {
          username: match.username,
          method: recoveryState.method,
          destination
        };
        const masked = String(result?.data?.maskedDestination || this.formatRecoveryContact(match, recoveryState.method));
        setRecoveryStatus(`Code sent to ${masked}. Enter code + new PIN below.`, false);
      });
      verifyRecoveryCodeBtn?.addEventListener('click', async () => {
        const pending = recoveryState.pending;
        if (!pending) {
          setRecoveryStatus('Send a recovery code first.', true);
          return;
        }
        const code = String(recoveryCodeInput?.value || '').trim();
        const newPin = String(recoveryNewPinInput?.value || '').trim();
        const expectedLength = Math.max(4, Number(this.data.recovery?.codeLength) || 6);
        const codePattern = new RegExp(`^\\\\d{${expectedLength}}$`);
        if (!codePattern.test(code)) {
          setRecoveryStatus(`Enter a valid ${expectedLength}-digit code.`, true);
          return;
        }
        if (!/^\\d{4}$/.test(newPin)) {
          setRecoveryStatus('New PIN must be 4 digits.', true);
          return;
        }
        setRecoveryStatus('Verifying code...', false);
        const result = await this.callRecoveryApi('verify', {
          username: pending.username,
          method: pending.method,
          destination: pending.destination,
          code
        });
        if (!result.ok) {
          setRecoveryStatus(String(result?.data?.error || 'Could not verify recovery code.'), true);
          return;
        }
        const users = this.getUsers();
        const matchIndex = users.findIndex(
          (u) => String(u.username || '').toLowerCase() === pending.username.toLowerCase()
        );
        if (matchIndex === -1) {
          setRecoveryStatus('Account no longer exists on this device.', true);
          return;
        }
        users[matchIndex].pin = newPin;
        this.saveUsers(users);
        recoveryState.pending = null;
        if (recoveryCodeInput) recoveryCodeInput.value = '';
        if (recoveryNewPinInput) recoveryNewPinInput.value = '';
        const loginUserInput = loginForm?.querySelector('input[name="login-username"]');
        const loginPinInput = loginForm?.querySelector('input[name="login-pin"]');
        if (loginUserInput) loginUserInput.value = users[matchIndex].username;
        if (loginPinInput) loginPinInput.value = newPin;
        setRecoveryStatus('PIN reset successful. You can sign in now.', false);
        this.showToast('PIN reset complete.');
      });
      setRecoveryMethod('email');

      const showFlag = this.safeParse(this.storage.showAuth, false);
      const user = this.getCurrentUser();
      if (!user && (showFlag || document.body.dataset.page === 'home')) {
        overlay.classList.add('active');
        this.safeSet(this.storage.showAuth, false);
      }
      switchTab('login');
    },
    renderHome() {
      const grid = document.getElementById('gameGrid');
      const filters = document.getElementById('categoryFilters');
      if (!grid || !filters) return;
      const votePanel = document.getElementById('gameVotePanel');
      if (votePanel) votePanel.remove();

      const preferredCategory =
        this.homeActiveCategory && this.data.categories.includes(this.homeActiveCategory)
          ? this.homeActiveCategory
          : 'All';

      const renderCards = (category) => {
        this.homeActiveCategory = category;
        grid.innerHTML = '';
        let games = this.data.games.filter((game) =>
          category === 'All' ? true : game.category === category
        );
        if (!games.length) {
          const empty = document.createElement('div');
          empty.className = 'game-card';
          empty.innerHTML = '<div class="pill">Coming Soon</div><h3>New Games</h3><p>More games are on the way for this category.</p>';
          grid.appendChild(empty);
          return;
        }
        games.forEach((game) => {
          const card = document.createElement('div');
          card.className = 'game-card';
          card.style.setProperty('--card-accent', game.accent);
          card.innerHTML = `
            <div class="pill">${game.category}</div>
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            <div class="card-actions">
              <div class="cta">Play Now →</div>
            </div>
          `;
          const applyHover = () => {
            card.classList.add('hovering');
            card.style.transform = 'translateY(-6px) scale(1.01)';
            card.style.borderColor = 'rgba(109, 213, 255, 0.5)';
            card.style.boxShadow = '0 24px 50px rgba(3, 7, 20, 0.6)';
          };
          const clearHover = () => {
            card.classList.remove('hovering');
            card.style.transform = '';
            card.style.borderColor = '';
            card.style.boxShadow = '';
          };
          card.addEventListener('pointerenter', applyHover);
          card.addEventListener('pointerleave', clearHover);
          card.addEventListener('pointerdown', applyHover);
          card.addEventListener('pointerup', clearHover);
          card.addEventListener('click', () => {
            window.location.href = `games/${game.id}.html`;
          });
          grid.appendChild(card);
        });
      };

      filters.innerHTML = '';
      this.data.categories.forEach((category, index) => {
        const pill = document.createElement('button');
        pill.className = 'pill';
        pill.textContent = category;
        if ((index === 0 && !preferredCategory) || category === preferredCategory) pill.classList.add('active');
        pill.addEventListener('click', () => {
          filters.querySelectorAll('.pill').forEach((el) => el.classList.remove('active'));
          pill.classList.add('active');
          renderCards(category);
        });
        filters.appendChild(pill);
      });

      renderCards(preferredCategory);

      const count = document.getElementById('gameCount');
      if (count) count.textContent = `${this.data.games.length} games`;

      const localNote = document.getElementById('localNote');
      if (localNote) {
        const baseNote =
          'Accounts and saves stay on this device. Leaderboard syncs usernames + points globally when you are online.';
        if (this.bigUpdateManifest && this.isUpdateV2Live()) {
          const extra = String(this.bigUpdateManifest.homeNotice || '').trim();
          localNote.textContent = extra ? `${baseNote} ${extra}` : baseNote;
        } else {
          localNote.textContent = baseNote;
        }
      }
      this.renderDailyQuestPanel();
      this.renderTournamentPanel();
      this.renderBigUpdatePanel();
    },
    renderDailyQuestPanel() {
      if (document.body.dataset.page !== 'home') return;
      const app = document.querySelector('.app');
      const filters = document.getElementById('categoryFilters');
      if (!app || !filters) return;
      let panel = document.getElementById('dailyQuestPanel');
      if (!panel) {
        panel = document.createElement('section');
        panel.id = 'dailyQuestPanel';
        panel.className = 'daily-quest-panel card';
        app.insertBefore(panel, filters);
      }
      const season = this.getDailyQuestSeason();
      const seasonLabel = `Day ${Math.min(season.currentDay, season.totalDays)} / ${season.totalDays}`;
      const seasonTail = season.active ? `${season.remainingDays}d left` : 'Season ended';
      const user = this.getCurrentUser();
      const reward = Math.max(100, Number(this.data.dailyQuests?.rewardPoints) || 750);
      if (!user) {
        panel.innerHTML = `
          <div class="daily-quest-head">
            <div>
              <div class="pill">Daily Quests</div>
              <strong>${seasonLabel}</strong>
            </div>
            <div class="tournament-time">${seasonTail}</div>
          </div>
          <div class="notice">${
            season.active
              ? `Sign in to start quests. Play 3 games and win 1 online match to claim +${reward} points.`
              : 'The 100-day daily quest season has ended.'
          }</div>
        `;
        return;
      }
      const daily = this.ensureDailyState(user) || {
        playGames: 0,
        onlineWin: false,
        claimed: false,
        streak: 0
      };
      if (!season.active) {
        panel.innerHTML = `
          <div class="daily-quest-head">
            <div>
              <div class="pill accent">Daily Quests</div>
              <strong>${seasonLabel}</strong>
            </div>
            <div class="tournament-time">${seasonTail}</div>
          </div>
          <div class="notice">Quest season complete. Final streak: ${Number(daily.streak || 0)} day${
          Number(daily.streak || 0) === 1 ? '' : 's'
        }.</div>
        `;
        return;
      }
      panel.innerHTML = `
        <div class="daily-quest-head">
          <div>
            <div class="pill accent">Daily Quests</div>
            <strong>${seasonLabel} · Streak: ${Number(daily.streak || 0)} day${Number(daily.streak || 0) === 1 ? '' : 's'}</strong>
          </div>
          <div style="display: grid; gap: 8px; justify-items: end;">
            <div class="tournament-time">${seasonTail}</div>
            <button class="btn primary" id="dailyQuestClaimBtn">Claim +${reward}</button>
          </div>
        </div>
        <div class="daily-quest-grid">
          <div class="chip ${Number(daily.playGames || 0) >= 3 ? '' : 'locked'}">${Number(daily.playGames || 0) >= 3 ? '✓' : '•'} Play 3 games (${Math.min(3, Number(daily.playGames || 0))}/3)</div>
          <div class="chip ${daily.onlineWin ? '' : 'locked'}">${daily.onlineWin ? '✓' : '•'} Win 1 online match</div>
          <div class="chip ${daily.claimed ? '' : 'locked'}">${daily.claimed ? '✓' : '•'} Claim reward</div>
        </div>
        <div class="notice" id="dailyQuestStatus">${
          daily.claimed ? 'Reward claimed for today.' : 'Complete both quests to claim reward.'
        }</div>
      `;
      const claimBtn = panel.querySelector('#dailyQuestClaimBtn');
      const statusEl = panel.querySelector('#dailyQuestStatus');
      if (claimBtn) {
        claimBtn.disabled = Boolean(daily.claimed) || Number(daily.playGames || 0) < 3 || !daily.onlineWin;
        claimBtn.addEventListener('click', () => {
          const result = this.claimDailyReward();
          if (!result.ok) {
            if (statusEl) statusEl.textContent = result.message;
            this.showToast(result.message);
            return;
          }
          if (statusEl) statusEl.textContent = `Claimed +${result.reward} points. Streak is now ${result.streak}.`;
          this.showToast(`Daily reward claimed: +${result.reward}.`);
          this.renderHome();
        });
      }
    },
    getTournamentGameLabel(gameId) {
      const game = this.data.games.find((item) => item.id === gameId);
      return game?.name || gameId || 'Tournament';
    },
    async initTournament() {
      await this.syncTournament(true);
      clearInterval(this.tournamentPollTimer);
      const pollMs = Math.max(5000, Number(this.data.tournament?.livePollMs) || 12000);
      this.tournamentPollTimer = setInterval(() => {
        if (document.hidden) return;
        this.syncTournament(true);
      }, pollMs);
    },
    async syncTournament(render = false) {
      const config = this.data.tournament;
      if (!config?.endpoint || window.location.protocol === 'file:') {
        if (render) this.renderTournamentPanel();
        return null;
      }
      const user = this.getCurrentUser();
      const params = new URLSearchParams({ ts: String(Date.now()) });
      if (user?.id) params.set('userId', String(user.id).slice(0, 80));
      if (user?.username) params.set('username', String(user.username).slice(0, 18));
      try {
        const response = await fetch(`${config.endpoint}?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) {
          if (render) this.renderTournamentPanel();
          return null;
        }
        const data = await response.json();
        this.tournamentState = data || null;
        if (user && Array.isArray(data?.badges)) {
          const changed = this.applyTournamentBadges(user, data.badges);
          if (changed && document.body.dataset.page === 'profile') {
            this.renderProfile();
          }
        }
        if (render) this.renderTournamentPanel();
        return data;
      } catch (err) {
        if (render) this.renderTournamentPanel();
        return null;
      }
    },
    renderTournamentPanel() {
      if (document.body.dataset.page !== 'home') return;
      const app = document.querySelector('.app');
      const filters = document.getElementById('categoryFilters');
      if (!app || !filters) return;
      let panel = document.getElementById('tournamentPanel');
      if (!panel) {
        panel = document.createElement('section');
        panel.id = 'tournamentPanel';
        panel.className = 'tournament-panel card';
        app.insertBefore(panel, filters);
      }
      const state = this.tournamentState;
      if (!state || !state.event) {
        panel.innerHTML = `
          <div class="daily-quest-head">
            <div class="pill">Tournament</div>
            <strong>Loading tournament...</strong>
          </div>
          <div class="notice">Timed leaderboard events will appear here.</div>
        `;
        return;
      }
      const event = state.event || {};
      const season = state.season && typeof state.season === 'object' ? state.season : null;
      const top = Array.isArray(state.top) ? state.top : [];
      const winners = Array.isArray(state.lastWinners) ? state.lastWinners : [];
      const endsIn = Math.max(0, Number(event.endAt || 0) - Date.now());
      const seasonEndsIn = Math.max(0, Number(season?.endAt || 0) - Date.now());
      const seasonActive = !season || Date.now() < Number(season.endAt || 0);
      const eventActive = seasonActive && endsIn > 0;
      panel.innerHTML = `
        <div class="daily-quest-head">
          <div>
            <div class="pill accent">Tournament</div>
            <strong>${this.getTournamentGameLabel(event.gameId)} Cup</strong>
          </div>
          <div class="tournament-time">${eventActive ? this.formatCountdown(endsIn) : 'Round ended'}</div>
        </div>
        <div class="notice">${
          seasonActive
            ? `Live top 3. New tournament round every day. Season ends in ${this.formatCountdown(seasonEndsIn)}.`
            : 'Tournament season has ended.'
        }</div>
        <div class="tournament-top">
          ${
            top.length
              ? top
                  .slice(0, 3)
                  .map(
                    (row, index) => `<div class="tournament-item"><span>#${index + 1} ${row.username || 'Player'}</span><strong>${row.score || 0}</strong></div>`
                  )
                  .join('')
              : '<div class="notice">No scores submitted yet.</div>'
          }
        </div>
        <div class="notice">${
          winners.length
            ? `Last winners: ${winners
                .slice(0, 3)
                .map((row) => `${row.username} (#${row.place})`)
                .join(' · ')}`
            : 'No previous winners yet.'
        }</div>
      `;
    },
    async submitTournamentScore(gameId, score, mode, force = false) {
      const config = this.data.tournament;
      const user = this.getCurrentUser();
      if (!config?.endpoint || !user || window.location.protocol === 'file:') return;
      if (!force && (mode === 'low' || mode === 'time')) return;
      const seasonEnd = Number(this.tournamentState?.season?.endAt || 0);
      if (seasonEnd > 0 && Date.now() >= seasonEnd) return;
      const activeGameId = String(this.tournamentState?.event?.gameId || 'click-rush').trim();
      if (!force && String(gameId || '').trim() !== activeGameId) return;
      const value = Math.max(0, Math.round(Number(score) || 0));
      if (!value) return;
      const key = `${gameId}:${value}:${Math.floor(Date.now() / 4000)}`;
      if (this.lastTournamentSubmitKey === key) return;
      this.lastTournamentSubmitKey = key;
      const avatar = this.getAvatarPayload(user);
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit_score',
            userId: String(user.id || '').slice(0, 80),
            username: String(user.username || '').slice(0, 18),
            gameId: String(gameId || '').slice(0, 64),
            score: value,
            avatarUrl: avatar.avatarUrl,
            avatarPreset: avatar.avatarPreset
          })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          this.tournamentState = data || this.tournamentState;
          if (Array.isArray(data?.badges)) {
            const changed = this.applyTournamentBadges(user, data.badges);
            if (changed && document.body.dataset.page === 'profile') {
              this.renderProfile();
            }
          }
          if (document.body.dataset.page === 'home') this.renderTournamentPanel();
        }
      } catch (err) {
        // ignore network errors for tournament submits
      }
    },
    ensureGameVoteState() {
      if (this.gameVoteState) return this.gameVoteState;
      const targetSaved = Number(this.safeParse(this.storage.gameVoteTarget, 0));
      const countsSaved = this.normalizeVoteCounts(this.safeParse(this.storage.gameVoteCounts, {}));
      const choicesRaw = this.safeParse(this.storage.gameVoteChoices, {});
      const choices = {};
      if (choicesRaw && typeof choicesRaw === 'object') {
        Object.keys(choicesRaw).forEach((key) => {
          const userId = String(key || '').trim().slice(0, 80);
          const gameId = String(choicesRaw[key] || '').trim().slice(0, 64);
          if (userId && gameId) choices[userId] = gameId;
        });
      }
      const duration = Number(this.data.gameVoting?.durationMs) || 6 * 60 * 60 * 1000;
      const target = Number.isFinite(targetSaved) && targetSaved > 0 ? targetSaved : Date.now() + duration;
      this.gameVoteState = { target, counts: countsSaved, choices };
      this.safeSet(this.storage.gameVoteTarget, target);
      this.safeSet(this.storage.gameVoteCounts, countsSaved);
      this.safeSet(this.storage.gameVoteChoices, choices);
      return this.gameVoteState;
    },
    normalizeVoteCounts(rawCounts) {
      const normalized = {};
      if (!rawCounts || typeof rawCounts !== 'object') return normalized;
      Object.keys(rawCounts).forEach((key) => {
        const gameId = String(key || '').trim().slice(0, 64);
        const votes = Math.max(0, Math.round(Number(rawCounts[key]) || 0));
        if (gameId && votes > 0) normalized[gameId] = votes;
      });
      return normalized;
    },
    isGameVoteActive() {
      const state = this.ensureGameVoteState();
      return Date.now() < state.target;
    },
    getCurrentUserVoteGameId() {
      const user = this.getCurrentUser();
      if (!user?.id) return '';
      const state = this.ensureGameVoteState();
      return String(state.choices[user.id] || '');
    },
    getVoteCountForGame(gameId) {
      const state = this.ensureGameVoteState();
      return Number(state.counts?.[gameId] || 0);
    },
    getTopVotedGames(limit = 3) {
      const state = this.ensureGameVoteState();
      const rows = Object.entries(state.counts || {})
        .map(([id, votes]) => ({
          game: this.data.games.find((item) => item.id === id) || null,
          votes: Number(votes || 0)
        }))
        .filter((row) => row.game && row.votes > 0)
        .sort((a, b) => b.votes - a.votes || a.game.name.localeCompare(b.game.name));
      return rows.slice(0, limit);
    },
    getHomeOrderedGames(games, category) {
      if (category !== 'All') return games;
      if (this.isGameVoteActive()) return games;
      const top = this.getTopVotedGames(3);
      if (!top.length) return games;
      const topIds = top.map((row) => row.game.id);
      const pinned = topIds
        .map((id) => games.find((game) => game.id === id))
        .filter(Boolean);
      const pinnedSet = new Set(pinned.map((game) => game.id));
      const rest = games.filter((game) => !pinnedSet.has(game.id));
      return [...pinned, ...rest];
    },
    renderGameVotePanel() {
      if (document.body.dataset.page !== 'home') return;
      const app = document.querySelector('.app');
      const filters = document.getElementById('categoryFilters');
      if (!app || !filters) return;
      let panel = document.getElementById('gameVotePanel');
      if (!panel) {
        panel = document.createElement('section');
        panel.id = 'gameVotePanel';
        panel.className = 'game-vote-panel card';
        app.insertBefore(panel, filters);
      }
      const state = this.ensureGameVoteState();
      const active = Date.now() < state.target;
      const remaining = Math.max(0, state.target - Date.now());
      const topThree = this.getTopVotedGames(3);
      panel.innerHTML = `
        <div class="game-vote-head">
          <div>
            <div class="pill accent">${active ? 'Vote Live' : 'Vote Closed'}</div>
            <h3>Today's Fav Games</h3>
          </div>
          <div class="game-vote-timer">${active ? this.formatCountdown(remaining) : 'Final Results'}</div>
        </div>
        <div class="notice">
          ${
            active
              ? 'Vote for one favorite game before the timer reaches zero.'
              : 'Voting ended. Top 3 games are pinned first on the home page.'
          }
        </div>
        ${
          topThree.length
            ? `<div class="game-vote-top">
                ${topThree
                  .map(
                    (item, index) => `
                  <div class="game-vote-item">
                    <span>#${index + 1} ${item.game.name}</span>
                    <strong>${item.votes}</strong>
                  </div>`
                  )
                  .join('')}
              </div>`
            : '<div class="notice">No votes yet. Vote buttons are on each game card.</div>'
        }
      `;
    },
    async initGameVoting() {
      this.ensureGameVoteState();
      await this.syncGameVotes(true);
      clearInterval(this.gameVotePollTimer);
      const pollMs = Number(this.data.gameVoting?.livePollMs) || 10000;
      this.gameVotePollTimer = setInterval(() => {
        if (document.hidden || document.body.dataset.page !== 'home') return;
        this.syncGameVotes(true);
      }, pollMs);
    },
    async syncGameVotes(renderIfChanged = false) {
      const config = this.data.gameVoting;
      const state = this.ensureGameVoteState();
      const user = this.getCurrentUser();
      const userId = String(user?.id || '').trim();
      const before = JSON.stringify({
        target: state.target,
        counts: state.counts,
        myVote: userId ? state.choices[userId] || '' : ''
      });

      if (!config?.endpoint || window.location.protocol === 'file:') {
        if (renderIfChanged) this.renderGameVotePanel();
        return state;
      }

      try {
        const params = new URLSearchParams({ ts: String(Date.now()) });
        if (userId) params.set('userId', userId);
        const response = await fetch(`${config.endpoint}?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) return state;
        const payload = await response.json();
        const target = Number(payload?.target);
        if (Number.isFinite(target) && target > 0) {
          state.target = target;
          this.safeSet(this.storage.gameVoteTarget, target);
        }
        if (Array.isArray(payload?.counts)) {
          const nextCounts = {};
          payload.counts.forEach((row) => {
            const gameId = String(row?.gameId || '').trim().slice(0, 64);
            const votes = Math.max(0, Math.round(Number(row?.votes) || 0));
            if (gameId && votes > 0) nextCounts[gameId] = votes;
          });
          state.counts = nextCounts;
          this.safeSet(this.storage.gameVoteCounts, nextCounts);
        }
        if (userId) {
          const votedGameId = String(payload?.votedGameId || '').trim().slice(0, 64);
          if (votedGameId) {
            state.choices[userId] = votedGameId;
          } else {
            delete state.choices[userId];
          }
          this.safeSet(this.storage.gameVoteChoices, state.choices);
        }
      } catch (err) {
        return state;
      }

      const after = JSON.stringify({
        target: state.target,
        counts: state.counts,
        myVote: userId ? state.choices[userId] || '' : ''
      });
      if (renderIfChanged && before !== after && document.body.dataset.page === 'home') {
        this.renderHome();
      } else if (renderIfChanged) {
        this.renderGameVotePanel();
      }
      return state;
    },
    async castGameVote(gameId) {
      const user = this.getCurrentUser();
      if (!user) {
        this.showToast('Sign in to vote for a game.');
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('active');
        return;
      }
      const state = this.ensureGameVoteState();
      if (!this.isGameVoteActive()) {
        this.showToast('Voting has ended for this round.');
        this.renderHome();
        return;
      }

      const userId = String(user.id || '').trim();
      const previousVote = String(state.choices[userId] || '');
      if (previousVote === gameId) {
        this.showToast('You already voted for this game.');
        return;
      }

      const config = this.data.gameVoting;
      if (config?.endpoint && window.location.protocol !== 'file:') {
        try {
          const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              username: user.username,
              gameId
            })
          });
          let payload = {};
          try {
            payload = await response.json();
          } catch (err) {
            payload = {};
          }
          const target = Number(payload?.target);
          if (Number.isFinite(target) && target > 0) {
            state.target = target;
            this.safeSet(this.storage.gameVoteTarget, target);
          }

          if (response.ok) {
            if (Array.isArray(payload?.counts)) {
              const nextCounts = {};
              payload.counts.forEach((row) => {
                const id = String(row?.gameId || '').trim().slice(0, 64);
                const votes = Math.max(0, Math.round(Number(row?.votes) || 0));
                if (id && votes > 0) nextCounts[id] = votes;
              });
              state.counts = nextCounts;
              this.safeSet(this.storage.gameVoteCounts, nextCounts);
            }
            const votedGameId = String(payload?.votedGameId || gameId).trim().slice(0, 64);
            if (votedGameId) state.choices[userId] = votedGameId;
            this.safeSet(this.storage.gameVoteChoices, state.choices);
            this.showToast(previousVote ? 'Vote updated.' : 'Vote submitted.');
            this.renderHome();
            return;
          }
          if (response.status === 409) {
            this.showToast('Voting has ended for this round.');
            this.renderHome();
            return;
          }
          if (response.status >= 400 && response.status < 500) {
            this.showToast(String(payload?.error || 'Vote failed.'));
            return;
          }
        } catch (err) {
          // fall back to local voting below
        }
      }

      if (previousVote && state.counts[previousVote]) {
        state.counts[previousVote] = Math.max(0, state.counts[previousVote] - 1);
        if (state.counts[previousVote] <= 0) delete state.counts[previousVote];
      }
      state.counts[gameId] = Number(state.counts[gameId] || 0) + 1;
      state.choices[userId] = gameId;
      this.safeSet(this.storage.gameVoteCounts, state.counts);
      this.safeSet(this.storage.gameVoteChoices, state.choices);
      this.showToast(previousVote ? 'Vote updated locally.' : 'Vote submitted locally.');
      this.renderHome();
    },
    getBigUpdateManifestPaths() {
      const page = document.body.dataset.page;
      if (page === 'game') {
        return [
          '../big%20update/manifest.json',
          '../big update/manifest.json',
          '/big%20update/manifest.json',
          '/big update/manifest.json'
        ];
      }
      return [
        'big%20update/manifest.json',
        'big update/manifest.json',
        './big%20update/manifest.json',
        './big update/manifest.json',
        '/big%20update/manifest.json',
        '/big update/manifest.json'
      ];
    },
    isUpdateV2Live() {
      // Update is finished: keep big update content permanently enabled.
      return true;
    },
    isUpdatePreviewEnabled() {
      const enabled = Boolean(this.safeParse(this.storage.updatePreviewEnabled, false));
      if (this.isUpdateV2Live()) {
        if (enabled) this.safeSet(this.storage.updatePreviewEnabled, false);
        return false;
      }
      return enabled;
    },
    setUpdatePreviewEnabled(enabled) {
      this.safeSet(this.storage.updatePreviewEnabled, Boolean(enabled));
    },
    async loadBigUpdateManifest() {
      const paths = this.getBigUpdateManifestPaths();
      for (const path of paths) {
        try {
          const response = await fetch(path, { cache: 'no-store' });
          if (!response.ok) continue;
          const data = await response.json();
          if (!data || typeof data !== 'object') continue;
          return data;
        } catch (err) {
          // try next path
        }
      }
      return null;
    },
    normalizeQueuedGame(item) {
      if (!item || typeof item !== 'object') return null;
      const id = String(item.id || '')
        .trim()
        .slice(0, 64);
      const name = String(item.name || '')
        .trim()
        .slice(0, 64);
      if (!id || !name) return null;
      const category = String(item.category || 'Unblocked')
        .trim()
        .slice(0, 24);
      const description = String(item.description || 'New game from the big update.')
        .trim()
        .slice(0, 220);
      const tip = String(item.tip || 'Have fun and set a new high score.')
        .trim()
        .slice(0, 180);
      const instructionsRaw = Array.isArray(item.instructions) ? item.instructions : [];
      const instructions = instructionsRaw
        .map((step) => String(step || '').trim())
        .filter(Boolean)
        .slice(0, 6);
      if (!instructions.length) {
        instructions.push('Start the game and follow on-screen controls.');
      }
      const accent = String(item.accent || '#6dd5ff').trim() || '#6dd5ff';
      const accent2 = String(item.accent2 || '#8b5cff').trim() || '#8b5cff';
      const scoreMode = item.scoreMode === 'low' || item.scoreMode === 'time' ? item.scoreMode : 'high';
      const scoreLabel = String(item.scoreLabel || 'score')
        .trim()
        .slice(0, 20);
      const normalized = {
        id,
        name,
        category,
        description,
        tip,
        instructions,
        accent,
        accent2,
        scoreMode,
        scoreLabel
      };
      if (item.embed) {
        normalized.embed = String(item.embed).trim();
      }
      return normalized;
    },
    async activateBigUpdateFromFolder() {
      const manifest = await this.loadBigUpdateManifest();
      if (!manifest) return;
      this.bigUpdateManifest = manifest;

      const queuedGames = Array.isArray(manifest.games) ? manifest.games : [];
      let changed = false;
      queuedGames.forEach((item) => {
        const game = this.normalizeQueuedGame(item);
        if (!game) return;
        if (this.data.games.some((g) => g.id === game.id)) return;
        this.data.games.push(game);
        changed = true;
        if (game.category && game.category !== 'All' && !this.data.categories.includes(game.category)) {
          this.data.categories.push(game.category);
        }
      });

      if (changed && this.isUpdateV2Live()) {
        this.showToast('Big Update 2.00 is now live.');
      }
    },
    renderBigUpdatePanel() {
      if (document.body.dataset.page !== 'home') return;
      const app = document.querySelector('.app');
      if (!app) return;
      let panel = document.getElementById('bigUpdatePanel');
      if (!this.isUpdateV2Live() || !this.bigUpdateManifest) {
        if (panel) panel.remove();
        return;
      }

      const version = String(this.bigUpdateManifest.version || '2.00').trim();
      const title = String(this.bigUpdateManifest.title || 'Big Update Live').trim();
      const items = Array.isArray(this.bigUpdateManifest.items)
        ? this.bigUpdateManifest.items.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : [];

      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'bigUpdatePanel';
        panel.className = 'big-update-panel card';
        const countdown = document.getElementById('updateCountdownPanel');
        if (countdown) {
          app.insertBefore(panel, countdown);
        } else {
          app.appendChild(panel);
        }
      }

      panel.innerHTML = `
        <div class="big-update-head">
          <div class="pill accent">Update ${version}</div>
          <strong>${title}</strong>
        </div>
        <div class="notice">Released from the <code>big update</code> folder automatically when the timer ended.</div>
        ${
          items.length
            ? `<ul class="big-update-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
            : '<div class="notice">No release notes listed yet.</div>'
        }
      `;
    },
    getUpdateV2Target() {
      const now = Date.now();
      let target = Number(this.safeParse(this.storage.updateV2Target, 0));
      const shouldResetToToday =
        !Number.isFinite(target) || target <= 0 || target - now > UPDATE_MAX_AHEAD_MS;
      if (shouldResetToToday) {
        target = now + UPDATE_RELEASE_DELAY_MS;
        this.safeSet(this.storage.updateV2Target, target);
        return target;
      }
      return target;
    },
    formatCountdown(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(
        seconds
      ).padStart(2, '0')}s`;
    },
    formatShortCountdown(ms) {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    ensureUpdateFxLayer() {
      if (document.body.dataset.page !== 'home') return null;
      let root = document.getElementById('updateFxLayer');
      if (!root) {
        root = document.createElement('div');
        root.id = 'updateFxLayer';
        root.className = 'update-fx-layer';
        root.innerHTML = `
          <div class="update-corner-timer" id="updateCornerTimer">
            <div class="update-corner-label" id="updateCornerLabel">Update in</div>
            <div class="update-corner-value" id="updateCornerValue">10:00</div>
            <div class="update-corner-progress"><span id="updateCornerProgress"></span></div>
          </div>
          <div class="update-center-countdown" id="updateCenterCountdown">10</div>
          <div class="update-launch-overlay" id="updateLaunchOverlay">
            <div class="update-launch-particles" id="updateLaunchParticles"></div>
            <div class="update-release-panel card" id="updateReleasePanel"></div>
          </div>
        `;
        document.body.appendChild(root);
      }
      return {
        root,
        corner: root.querySelector('#updateCornerTimer'),
        cornerLabel: root.querySelector('#updateCornerLabel'),
        cornerValue: root.querySelector('#updateCornerValue'),
        cornerProgress: root.querySelector('#updateCornerProgress'),
        center: root.querySelector('#updateCenterCountdown'),
        launch: root.querySelector('#updateLaunchOverlay'),
        particles: root.querySelector('#updateLaunchParticles'),
        panel: root.querySelector('#updateReleasePanel')
      };
    },
    updateFinalMinuteFx(remaining) {
      const refs = this.ensureUpdateFxLayer();
      if (!refs) return;
      const { corner, cornerLabel, cornerValue, cornerProgress, center } = refs;
      if (!corner || !center) return;

      const tenMinutesMs = 10 * 60 * 1000;
      const fiveMinutesMs = 5 * 60 * 1000;
      const oneMinuteMs = 60 * 1000;
      const inTenMinuteWindow = remaining > 0 && remaining <= tenMinutesMs;
      const inFiveMinuteWindow = remaining > 0 && remaining <= fiveMinutesMs;
      const inFinalMinute = remaining > 0 && remaining <= oneMinuteMs;

      if (inTenMinuteWindow) {
        const urgency = Math.min(1, Math.max(0, 1 - remaining / tenMinutesMs));
        document.body.style.setProperty('--update-urgency', urgency.toFixed(3));
        document.body.classList.add('update-last-ten');
        document.body.classList.toggle('update-last-five', inFiveMinuteWindow);
        document.body.classList.toggle('update-final-minute', inFinalMinute);

        corner.classList.add('show');
        if (cornerLabel) {
          if (inFinalMinute) {
            cornerLabel.textContent = 'Final minute';
          } else if (inFiveMinuteWindow) {
            cornerLabel.textContent = 'Final phase';
          } else {
            cornerLabel.textContent = 'Update in';
          }
        }
        if (cornerValue) {
          cornerValue.textContent = this.formatShortCountdown(remaining);
        }
        if (cornerProgress) {
          const progress = Math.round(((tenMinutesMs - remaining) / tenMinutesMs) * 100);
          cornerProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        const now = Date.now();
        const burstGapMs = Math.max(700, Math.round(2500 - urgency * 1900));
        if (!this.lastUpdateAmbientBurstAt || now - this.lastUpdateAmbientBurstAt >= burstGapMs) {
          this.lastUpdateAmbientBurstAt = now;
          const x = Math.round(window.innerWidth * (0.12 + Math.random() * 0.76));
          const y = Math.round(window.innerHeight * (0.08 + Math.random() * 0.5));
          this.spawnUpdateBurst(x, y, 0.28 + urgency * 0.95);
          if (remaining <= 2 * 60 * 1000) {
            setTimeout(() => {
              const x2 = Math.round(window.innerWidth * (0.08 + Math.random() * 0.84));
              const y2 = Math.round(window.innerHeight * (0.08 + Math.random() * 0.42));
              this.spawnUpdateBurst(x2, y2, 0.38 + urgency * 0.92);
            }, 220);
          }
        }

        const confettiGapMs = inFiveMinuteWindow ? 9000 : 14000;
        if (!this.lastUpdateAmbientConfettiAt || now - this.lastUpdateAmbientConfettiAt >= confettiGapMs) {
          this.lastUpdateAmbientConfettiAt = now;
          this.spawnUpdateConfetti(inFinalMinute ? 26 : inFiveMinuteWindow ? 18 : 10);
        }

        if (remaining <= 10 * 1000) {
          const value = Math.max(1, Math.ceil(remaining / 1000));
          if (this.lastCenterCountdownValue !== value) {
            this.lastCenterCountdownValue = value;
            center.textContent = String(value);
            center.classList.remove('pulse');
            void center.offsetWidth;
            center.classList.add('pulse');
          }
          center.classList.add('show');
        } else {
          this.lastCenterCountdownValue = null;
          center.classList.remove('show');
          center.classList.remove('pulse');
        }
      } else {
        document.body.style.removeProperty('--update-urgency');
        document.body.classList.remove('update-last-ten');
        document.body.classList.remove('update-last-five');
        document.body.classList.remove('update-final-minute');
        this.lastUpdateAmbientBurstAt = 0;
        this.lastUpdateAmbientConfettiAt = 0;
        this.lastCenterCountdownValue = null;
        corner.classList.remove('show');
        if (cornerLabel) cornerLabel.textContent = 'Update in';
        if (cornerValue) cornerValue.textContent = '10:00';
        if (cornerProgress) cornerProgress.style.width = '0%';
        center.classList.remove('show');
        center.classList.remove('pulse');
      }
    },
    spawnUpdateBurst(x, y, intensity = 1) {
      const refs = this.ensureUpdateFxLayer();
      const particlesRoot = refs?.particles;
      if (!particlesRoot) return;
      const colors = ['#6dd5ff', '#8b5cff', '#ffb347', '#ff5f7a', '#5cffb0', '#ffd84d'];
      const count = Math.round(18 + intensity * 14);
      for (let i = 0; i < count; i += 1) {
        const particle = document.createElement('span');
        particle.className = 'update-burst-particle';
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.24;
        const distance = 80 + Math.random() * 180 * intensity;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = `${750 + Math.random() * 400}ms`;
        particlesRoot.appendChild(particle);
        setTimeout(() => particle.remove(), 1300);
      }

      const ring = document.createElement('span');
      ring.className = 'update-burst-ring';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.style.setProperty('--ring-size', `${120 + Math.random() * 80 * intensity}px`);
      particlesRoot.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    },
    spawnUpdateConfetti(total = 110) {
      const refs = this.ensureUpdateFxLayer();
      const particlesRoot = refs?.particles;
      if (!particlesRoot) return;
      const colors = ['#6dd5ff', '#8b5cff', '#ffb347', '#ff5f7a', '#5cffb0', '#ffd84d', '#ffffff'];
      for (let i = 0; i < total; i += 1) {
        const confetti = document.createElement('span');
        confetti.className = 'update-confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `${-10 - Math.random() * 30}%`;
        confetti.style.width = `${5 + Math.random() * 8}px`;
        confetti.style.height = `${8 + Math.random() * 14}px`;
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 220)}px`);
        confetti.style.animationDuration = `${2600 + Math.random() * 2200}ms`;
        confetti.style.animationDelay = `${Math.random() * 800}ms`;
        particlesRoot.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5400);
      }
    },
    runUpdateLaunchSequence() {
      if (this.updateLaunchSequenceStarted) return;
      if (this.safeParse(this.storage.updateV2CelebrationSeen, false)) return;
      const refs = this.ensureUpdateFxLayer();
      if (!refs) return;
      const { launch, particles, panel, corner, center } = refs;
      if (!launch || !particles || !panel || !corner || !center) return;
      this.updateLaunchSequenceStarted = true;
      this.safeSet(this.storage.updateV2CelebrationSeen, true);
      corner.classList.remove('show');
      center.classList.remove('show');
      center.classList.remove('pulse');
      document.body.classList.remove('update-final-minute');

      launch.classList.add('active');
      particles.innerHTML = '';

      for (let i = 0; i < 12; i += 1) {
        setTimeout(() => {
          const x = Math.round(window.innerWidth * (0.1 + Math.random() * 0.8));
          const y = Math.round(window.innerHeight * (0.12 + Math.random() * 0.5));
          this.spawnUpdateBurst(x, y, 1 + Math.random() * 0.6);
        }, i * 180);
      }
      this.spawnUpdateConfetti(150);

      const buildReleasePanel = () => {
        const version = String(this.bigUpdateManifest?.version || '2.00').trim();
        const title = String(this.bigUpdateManifest?.title || 'Big Update 2.00').trim();
        const items = Array.isArray(this.bigUpdateManifest?.items)
          ? this.bigUpdateManifest.items.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
          : [
              'Online mode games are now available.',
              'Leaderboard and points sync is enabled.',
              'New unblocked games are now unlocked.'
            ];
        panel.innerHTML = `
          <div class="update-release-head">
            <div class="pill accent">Update ${version} Live</div>
            <strong>${title}</strong>
          </div>
          <ul class="update-release-list">
            ${items.map((item) => `<li class="update-release-item">${item}</li>`).join('')}
          </ul>
        `;
        const revealItems = [...panel.querySelectorAll('.update-release-item')];
        revealItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('show');
            item.classList.remove('boom');
            void item.offsetWidth;
            item.classList.add('boom');
            const rect = item.getBoundingClientRect();
            this.spawnUpdateBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.75);
          }, 900 + index * 700);
        });
      };

      buildReleasePanel();
      if (!this.bigUpdateManifest) {
        this.loadBigUpdateManifest().then((manifest) => {
          if (!manifest || !this.updateLaunchSequenceStarted) return;
          this.bigUpdateManifest = manifest;
          buildReleasePanel();
        });
      }

      setTimeout(() => {
        launch.classList.remove('active');
        particles.innerHTML = '';
      }, 17000);
    },
    renderUpdateCountdown() {
      if (document.body.dataset.page !== 'home') return;
      if (this.isUpdateV2Live()) {
        clearInterval(this.updateCountdownTimer);
        const panel = document.getElementById('updateCountdownPanel');
        if (panel) panel.remove();
        const popup = document.getElementById('updatePopupOverlay');
        if (popup) popup.remove();
        const fxLayer = document.getElementById('updateFxLayer');
        if (fxLayer) fxLayer.remove();
        return;
      }
      const isClosed = this.safeParse(this.storage.updateV2PopupClosed, false);
      const app = document.querySelector('.app');
      if (!app) return;
      let panel = document.getElementById('updateCountdownPanel');

      if (!isClosed) {
        if (panel) {
          panel.remove();
          panel = null;
        }
      }

      if (isClosed && !panel) {
        panel = document.createElement('div');
        panel.id = 'updateCountdownPanel';
        panel.className = 'update-countdown card';
        panel.innerHTML = `
          <div class="update-countdown-head">
            <div>
              <div class="pill accent">Update 2.00</div>
              <div class="update-countdown-title">New games + suggestions coming soon</div>
            </div>
            <div class="update-countdown-time" id="updateCountdownValue">7d 00h 00m 00s</div>
          </div>
          <div class="notice" id="updateCountdownNote">Live countdown to the big update.</div>
        `;
        const footer = document.getElementById('feedbackFooter');
        if (footer) {
          app.insertBefore(panel, footer);
        } else {
          app.appendChild(panel);
        }
      }

      const valueEl = document.getElementById('updateCountdownValue');
      const noteEl = document.getElementById('updateCountdownNote');

      const tick = () => {
        const target = this.getUpdateV2Target();
        const remaining = target - Date.now();
        this.updateFinalMinuteFx(remaining);

        if (valueEl) {
          valueEl.textContent = remaining <= 0 ? '00d 00h 00m 00s' : this.formatCountdown(remaining);
        }
        if (noteEl) {
          noteEl.textContent =
            remaining <= 0 ? 'Update 2.00 is live now.' : 'Big update countdown is live: suggestions + new games.';
        }

        if (remaining <= 0) {
          this.runUpdateLaunchSequence();
          if (!this.bigUpdateReleaseHandled) {
            this.bigUpdateReleaseHandled = true;
            this.activateBigUpdateFromFolder().then(() => {
              this.renderHome();
              this.renderFeedbackFooter();
            });
          }
          return;
        }
      };

      clearInterval(this.updateCountdownTimer);
      tick();
      this.updateCountdownTimer = setInterval(tick, 1000);
    },
    maybeShowUpdatePopup() {
      if (document.body.dataset.page !== 'home') return;
      if (this.isUpdateV2Live()) {
        this.safeSet(this.storage.updateV2PopupClosed, true);
        return;
      }
      if (this.safeParse(this.storage.updateV2PopupClosed, false)) return;
      if (document.getElementById('updatePopupOverlay')) return;

      const authOverlay = document.getElementById('authOverlay');
      if (authOverlay && authOverlay.classList.contains('active')) {
        clearTimeout(this.updatePopupRetryTimer);
        this.updatePopupRetryTimer = setTimeout(() => this.maybeShowUpdatePopup(), 900);
        return;
      }

      const remaining = this.getUpdateV2Target() - Date.now();
      const overlay = document.createElement('div');
      overlay.className = 'overlay active update-popup-overlay';
      overlay.id = 'updatePopupOverlay';
      overlay.innerHTML = `
        <div class="update-popup card">
          <h2>Big update soon</h2>
          <p class="notice">Update 2.00 will include more games and suggestions from students.</p>
          <div class="update-popup-countdown" id="updatePopupCountdown">${this.formatCountdown(remaining)}</div>
          <button class="btn primary" id="closeUpdatePopup">Close</button>
        </div>
      `;
      document.body.appendChild(overlay);

      const popupCountdown = overlay.querySelector('#updatePopupCountdown');
      const updatePopupTick = () => {
        const diff = this.getUpdateV2Target() - Date.now();
        if (popupCountdown) {
          popupCountdown.textContent = this.formatCountdown(diff);
        }
      };
      updatePopupTick();
      this.updatePopupTimer = setInterval(updatePopupTick, 1000);

      const closeBtn = overlay.querySelector('#closeUpdatePopup');
      closeBtn?.addEventListener('click', () => {
        clearInterval(this.updatePopupTimer);
        this.safeSet(this.storage.updateV2PopupClosed, true);
        overlay.remove();
        this.renderUpdateCountdown();
      });
    },
    showGameTermsPopup() {
      if (document.body.dataset.page !== 'game') return;
      const acceptedVersion = this.safeParse(this.storage.termsAcceptedVersion, '');
      if (acceptedVersion === TERMS_LAST_UPDATED) return;
      if (document.getElementById('termsOverlay')) return;
      const overlay = document.createElement('div');
      overlay.className = 'overlay active terms-overlay';
      overlay.id = 'termsOverlay';
      overlay.innerHTML = `
        <div class="terms-modal card">
          <h2>LogiSchool Terms and Conditions</h2>
          <div class="terms-last-updated">Last Updated: ${TERMS_LAST_UPDATED}</div>
          <div class="terms-text" id="termsText"></div>
          <div class="terms-actions">
            <button class="btn ghost" id="termsLeaveBtn">Leave Game</button>
            <button class="btn primary" id="termsAgreeBtn">Agree</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const termsText = overlay.querySelector('#termsText');
      if (termsText) {
        termsText.textContent = TERMS_TEXT;
      }
      const leaveBtn = overlay.querySelector('#termsLeaveBtn');
      const agreeBtn = overlay.querySelector('#termsAgreeBtn');
      leaveBtn?.addEventListener('click', () => {
        window.location.href = '../index.html';
      });
      agreeBtn?.addEventListener('click', () => {
        this.safeSet(this.storage.termsAcceptedVersion, TERMS_LAST_UPDATED);
        overlay.remove();
      });
    },
    renderFeedbackFooter() {
      const page = document.body.dataset.page;
      if (page !== 'home' && page !== 'game') return;
      const app = document.querySelector('.app');
      if (!app) return;

      let footer = document.getElementById('feedbackFooter');
      if (footer) return;
      footer = document.createElement('div');
      footer.className = 'feedback-footer';
      footer.id = 'feedbackFooter';
      footer.innerHTML = `
        <span>Made by Valentino · </span>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfF5J1ZHXwlnvQXyGnSJjYvAoZQBaDgFwJk_25bJIHOM81sMA/viewform?usp=header"
          target="_blank"
          rel="noopener noreferrer"
        >
          Bugs, suggestions, and game requests
        </a>
      `;
      app.appendChild(footer);
    },
    requireAuthForGame() {
      const user = this.getCurrentUser();
      if (user) return false;
      this.safeSet(this.storage.showAuth, true);
      const gameId = window.GAME_ID || '';
      if (gameId) {
        this.safeSet(this.storage.postLogin, `games/${gameId}.html`);
      }
      window.location.href = '../index.html';
      return true;
    },
    renderGamePage() {
      const gameId = window.GAME_ID;
      const game = this.data.games.find((g) => g.id === gameId);
      const root = document.getElementById('gameRoot');
      if (!game || !root) {
        if (root) root.innerHTML = '<div class="notice">Game unavailable.</div>';
        return;
      }
      document.getElementById('gameTitle').textContent = game.name;
      document.getElementById('gameDesc').textContent = game.description;
      document.getElementById('gameTag').textContent = game.category;
      const inst = document.getElementById('gameInstructions');
      inst.innerHTML = '';
      game.instructions.forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        inst.appendChild(li);
      });
      document.getElementById('gameTip').textContent = game.tip;
      const stage = document.getElementById('gameStage');
      if (stage) {
        stage.style.setProperty('--accent', game.accent);
        stage.style.setProperty('--accent-2', game.accent2);
      }
      this.updateBestUI(game);
      this.setupGameChat(game);
      if (window.LogiSchoolGames && typeof window.LogiSchoolGames.launch === 'function') {
        window.LogiSchoolGames.launch(game, root, this);
      } else {
        root.innerHTML = '<div class="notice">Game unavailable.</div>';
      }
    },
    updateBestUI(game) {
      const bestEl = document.getElementById('gameBest');
      if (!bestEl) return;
      const user = this.getCurrentUser();
      if (!user) {
        bestEl.textContent = 'Best: --';
        return;
      }
      const entry = user.stats?.bestScores?.[game.id];
      if (!entry) {
        bestEl.textContent = 'Best: --';
        return;
      }
      bestEl.textContent = `Best: ${entry.score} ${game.scoreLabel}`;
    },
    reportScore(gameId, score, mode) {
      const user = this.getCurrentUser();
      if (!user) return;
      const game = this.data.games.find((g) => g.id === gameId);
      const stats = user.stats || { bestScores: {}, gamesPlayed: [] };
      const entry = stats.bestScores[gameId];
      let isBetter = false;
      if (!entry) {
        isBetter = true;
      } else if (mode === 'low' || mode === 'time') {
        isBetter = score < entry.score;
      } else {
        isBetter = score > entry.score;
      }
      if (isBetter) {
        stats.bestScores[gameId] = { score, mode, updatedAt: new Date().toISOString() };
        this.showToast(`New best: ${score} ${game?.scoreLabel || ''}`.trim());
      }
      if (!stats.gamesPlayed.includes(gameId)) {
        stats.gamesPlayed.push(gameId);
      }
      user.stats = stats;
      this.updateUser(user);
      this.updateDailyQuestProgress({ playedGameId: gameId });
      this.updateBestUI(game);
      this.renderTopbar();
      this.syncCurrentUser(true);
      this.submitTournamentScore(gameId, score, mode);
    },
    reportOnlineWin(gameId) {
      const daily = this.updateDailyQuestProgress({ onlineWin: true });
      if (daily && daily.onlineWin) {
        this.showToast('Daily quest complete: online win.');
      }
    },
    renderProfile() {
      const user = this.getCurrentUser();
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      this.syncTournament(false);
      const points = this.computePoints(user);
      const tier = this.getTier(points);
      const dailySeason = this.getDailyQuestSeason();
      const daily = this.ensureDailyState(user);
      const activeBanner = this.getActiveProfileBanner(user, points);
      const activeTitle = this.getActiveTitleTag(user, points);
      const activeChatColor = this.getActiveChatNameColor(user, points);
      const avatarEl = document.getElementById('profileAvatar');
      const avatarImg = document.createElement('img');
      const tierGradients = this.getTierGradients();
      let avatarUrl = user.cosmetics?.avatarUrl || '';
      if (!avatarUrl && user.cosmetics?.presetAvatar) {
        const preset = this.data.presets.find((p) => p.id === user.cosmetics.presetAvatar);
        if (preset) avatarUrl = preset.url;
      }
      if (avatarUrl) {
        avatarImg.src = avatarUrl;
        avatarImg.alt = 'Avatar';
        avatarEl.innerHTML = '';
        avatarEl.appendChild(avatarImg);
      } else {
        avatarEl.style.background = tierGradients[tier.name] || tierGradients.Bronze;
        avatarEl.textContent = tier.name[0];
      }
      const headerCard = document.getElementById('profileHeaderCard');
      if (headerCard) {
        headerCard.style.background = activeBanner?.css
          ? `${activeBanner.css}, var(--card-strong)`
          : '';
      }
      const profileNameEl = document.getElementById('profileName');
      if (profileNameEl) {
        const profileName = this.formatDisplayUsername(user.username);
        profileNameEl.textContent = activeTitle?.label ? `[${activeTitle.label}] ${profileName}` : profileName;
        profileNameEl.style.color =
          activeChatColor?.color && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(activeChatColor.color)
            ? activeChatColor.color
            : '';
      }
      document.getElementById('profilePoints').textContent = `${points} points`;
      document.getElementById('profileTier').textContent = tier.name;
      document.getElementById('profileGamesPlayed').textContent =
        user.stats?.gamesPlayed?.length || 0;
      const allUsers = this.getUsers().map((u) => ({ id: u.id, points: this.computePoints(u) }));
      allUsers.sort((a, b) => b.points - a.points);
      const rankIndex = allUsers.findIndex((entry) => entry.id === user.id);
      document.getElementById('profileRank').textContent = rankIndex === -1 ? '--' : `#${rankIndex + 1}`;

      const bestList = document.getElementById('bestScoresList');
      bestList.innerHTML = '';
      const bestScores = user.stats?.bestScores || {};
      const entries = Object.entries(bestScores);
      if (!entries.length) {
        bestList.innerHTML = '<div class="empty">No scores yet. Play a game to start.</div>';
      } else {
        entries.forEach(([gameId, entry]) => {
          const game = this.data.games.find((g) => g.id === gameId);
          const item = document.createElement('div');
          item.className = 'stat-card';
          item.innerHTML = `
            <div class="label">${game?.name || gameId}</div>
            <div class="value">${entry.score} ${game?.scoreLabel || ''}</div>
          `;
          bestList.appendChild(item);
        });
      }

      const achList = document.getElementById('achievementList');
      achList.innerHTML = '';
      const achievements = [
        { id: 'first-game', label: 'First Game', ok: (user.stats?.gamesPlayed?.length || 0) >= 1 },
        { id: 'three-games', label: '3 Games Played', ok: (user.stats?.gamesPlayed?.length || 0) >= 3 },
        { id: 'five-games', label: '5 Games Played', ok: (user.stats?.gamesPlayed?.length || 0) >= 5 },
        { id: 'silver-tier', label: 'Silver Tier', ok: points >= 500 },
        { id: 'gold-tier', label: 'Gold Tier', ok: points >= 1200 },
        { id: 'platinum-tier', label: 'Platinum Tier', ok: points >= 2500 }
      ];
      achievements.forEach((achievement) => {
        const item = document.createElement('div');
        item.className = 'chip' + (achievement.ok ? '' : ' locked');
        item.textContent = achievement.ok ? `✓ ${achievement.label}` : achievement.label;
        achList.appendChild(item);
      });

      const avatarTierList = document.getElementById('avatarTierList');
      avatarTierList.innerHTML = '';
      this.data.avatarTiers.forEach((tierItem) => {
        const chip = document.createElement('div');
        chip.className = 'chip' + (points >= tierItem.min ? '' : ' locked');
        chip.textContent = `${tierItem.name} · ${tierItem.min}+`;
        avatarTierList.appendChild(chip);
      });

      const bannerSelect = document.getElementById('profileBannerSelect');
      const chatColorSelect = document.getElementById('chatColorSelect');
      const titleTagSelect = document.getElementById('titleTagSelect');
      const saveCosmeticsBtn = document.getElementById('saveProfileCosmetics');
      const cosmeticsHint = document.getElementById('profileCosmeticsHint');
      const unlockedBanners = this.getUnlockedByPoints(this.data.profileBanners, points);
      const unlockedChatColors = this.getUnlockedByPoints(this.data.chatNameColors, points);
      const unlockedTitleTags = this.getUnlockedByPoints(this.data.titleTags, points);

      const fillSelect = (el, items, selectedId, mapLabel) => {
        if (!el) return;
        el.innerHTML = '';
        items.forEach((item) => {
          const option = document.createElement('option');
          option.value = item.id;
          option.textContent = mapLabel(item);
          if (item.id === selectedId) option.selected = true;
          el.appendChild(option);
        });
      };
      fillSelect(
        bannerSelect,
        unlockedBanners,
        this.getActiveProfileBanner(user, points)?.id || 'none',
        (item) => `${item.name} (${item.min}+ pts)`
      );
      fillSelect(
        chatColorSelect,
        unlockedChatColors,
        this.getActiveChatNameColor(user, points)?.id || 'default',
        (item) => `${item.name} (${item.min}+ pts)`
      );
      fillSelect(
        titleTagSelect,
        unlockedTitleTags,
        this.getActiveTitleTag(user, points)?.id || 'none',
        (item) => `${item.name} (${item.min}+ pts)`
      );
      if (saveCosmeticsBtn) {
        saveCosmeticsBtn.onclick = () => {
          user.cosmetics.profileBanner = String(bannerSelect?.value || 'none');
          user.cosmetics.chatNameColor = String(chatColorSelect?.value || 'default');
          user.cosmetics.titleTag = String(titleTagSelect?.value || 'none');
          this.updateUser(user);
          this.syncCurrentUser(true);
          if (cosmeticsHint) cosmeticsHint.textContent = 'Cosmetics saved.';
          this.renderTopbar();
          this.renderProfile();
        };
      }
      if (cosmeticsHint) {
        cosmeticsHint.textContent = `Unlocked: ${unlockedBanners.length} banners · ${unlockedChatColors.length} chat colors · ${unlockedTitleTags.length} title tags.`;
      }

      const badgeList = document.getElementById('tournamentBadgeList');
      if (badgeList) {
        badgeList.innerHTML = '';
        const badges = Array.isArray(user.stats?.tournamentBadges) ? user.stats.tournamentBadges : [];
        if (!badges.length) {
          badgeList.innerHTML = '<div class="empty">No badges yet. Place top 3 in tournaments.</div>';
        } else {
          badges.slice(0, 12).forEach((badge) => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            const place = Number(badge.place || 0);
            const placeLabel = place > 0 ? `Top ${place}` : 'Top 3';
            chip.textContent = `${placeLabel} · ${badge.label || badge.gameId || 'Tournament'}`;
            badgeList.appendChild(chip);
          });
        }
      }

      const profileDailyQuestList = document.getElementById('profileDailyQuestList');
      const profileDailyClaim = document.getElementById('profileDailyClaim');
      const profileDailyStatus = document.getElementById('profileDailyStatus');
      if (profileDailyQuestList) {
        const playCount = Number(daily?.playGames || 0);
        const onlineWin = Boolean(daily?.onlineWin);
        const claimed = Boolean(daily?.claimed);
        const seasonLabel = `Day ${Math.min(dailySeason.currentDay, dailySeason.totalDays)}/${dailySeason.totalDays}`;
        profileDailyQuestList.innerHTML = `
          <div class="chip-grid">
            <div class="chip">${seasonLabel} · ${dailySeason.active ? `${dailySeason.remainingDays}d left` : 'Season ended'}</div>
            <div class="chip ${playCount >= 3 ? '' : 'locked'}">${playCount >= 3 ? '✓' : '•'} Play 3 games (${playCount}/3)</div>
            <div class="chip ${onlineWin ? '' : 'locked'}">${onlineWin ? '✓' : '•'} Win 1 online match</div>
            <div class="chip ${claimed ? '' : 'locked'}">${claimed ? '✓' : '•'} Claim reward</div>
            <div class="chip">Streak: ${Number(daily?.streak || 0)} day${Number(daily?.streak || 0) === 1 ? '' : 's'}</div>
          </div>
        `;
      }
      if (profileDailyClaim) {
        profileDailyClaim.disabled =
          !dailySeason.active || Boolean(daily?.claimed) || Number(daily?.playGames || 0) < 3 || !daily?.onlineWin;
        profileDailyClaim.onclick = () => {
          const claim = this.claimDailyReward();
          if (!claim.ok) {
            if (profileDailyStatus) profileDailyStatus.textContent = claim.message;
            this.showToast(claim.message);
            return;
          }
          if (profileDailyStatus) {
            profileDailyStatus.textContent = `Reward claimed: +${claim.reward} points. Streak: ${claim.streak}.`;
          }
          this.showToast(`Daily reward claimed: +${claim.reward} points.`);
          this.renderProfile();
        };
      }
      if (profileDailyStatus) {
        profileDailyStatus.textContent = !dailySeason.active
          ? `Daily quest season ended. Final streak: ${Number(daily?.streak || 0)}.`
          : daily?.claimed
          ? `Reward already claimed today. Current streak: ${Number(daily?.streak || 0)}.`
          : 'Complete both quests to claim your reward.';
      }

      const presetWrap = document.getElementById('avatarPresets');
      presetWrap.innerHTML = '';
      this.data.presets.forEach((preset) => {
        const btn = document.createElement('button');
        btn.className = 'chip';
        if (user.cosmetics.presetAvatar === preset.id) btn.classList.add('selected');
        btn.textContent = preset.name;
        btn.addEventListener('click', () => {
          user.cosmetics.presetAvatar = preset.id;
          user.cosmetics.avatarUrl = '';
          this.updateUser(user);
          this.syncCurrentUser(true);
          this.renderProfile();
        });
        presetWrap.appendChild(btn);
      });

      const avatarInput = document.getElementById('avatarUrlInput');
      const avatarSave = document.getElementById('avatarUrlSave');
      const avatarError = document.getElementById('avatarUrlError');
      avatarInput.value = user.cosmetics.avatarUrl || '';
      avatarSave.onclick = () => {
        const url = avatarInput.value.trim();
        if (!url) {
          user.cosmetics.avatarUrl = '';
          this.updateUser(user);
          this.syncCurrentUser(true);
          this.renderProfile();
          avatarError.textContent = '';
          return;
        }
        if (!/^https?:\/\//.test(url)) {
          avatarError.textContent = 'Please enter a valid http(s) URL.';
          return;
        }
        const img = new Image();
        img.onload = () => {
          user.cosmetics.avatarUrl = url;
          user.cosmetics.presetAvatar = '';
          this.updateUser(user);
          this.syncCurrentUser(true);
          avatarError.textContent = '';
          this.renderProfile();
        };
        img.onerror = () => {
          avatarError.textContent = 'Image could not be loaded.';
        };
        img.src = url;
      };

      const changeName = document.getElementById('changeName');
      const changePin = document.getElementById('changePin');
      const changeRecoveryEmail = document.getElementById('changeRecoveryEmail');
      const changeRecoveryPhone = document.getElementById('changeRecoveryPhone');
      const recoveryContactStatus = document.getElementById('recoveryContactStatus');
      const saveAccount = document.getElementById('saveAccount');
      const signOutBtn = document.getElementById('profileSignOut');
      changeName.value = user.username;
      if (changeRecoveryEmail) changeRecoveryEmail.value = this.getRecoveryContact(user, 'email');
      if (changeRecoveryPhone) changeRecoveryPhone.value = this.getRecoveryContact(user, 'sms');
      if (recoveryContactStatus) {
        const emailMask = this.formatRecoveryContact(user, 'email');
        const smsMask = this.formatRecoveryContact(user, 'sms');
        if (emailMask || smsMask) {
          recoveryContactStatus.textContent = `Recovery saved: ${
            emailMask ? `Email ${emailMask}` : ''
          }${emailMask && smsMask ? ' · ' : ''}${smsMask ? `SMS ${smsMask}` : ''}`;
        } else {
          recoveryContactStatus.textContent = 'No recovery contact set yet.';
        }
      }
      saveAccount.onclick = () => {
        const newName = changeName.value.trim().slice(0, 18);
        const newPin = changePin.value.trim();
        const recoveryEmailRaw = String(changeRecoveryEmail?.value || '').trim();
        const recoveryPhoneRaw = String(changeRecoveryPhone?.value || '').trim();
        const recoveryEmail = recoveryEmailRaw ? this.normalizeRecoveryEmail(recoveryEmailRaw) : '';
        const recoveryPhone = recoveryPhoneRaw ? this.normalizeRecoveryPhone(recoveryPhoneRaw) : '';
        if (!newName) {
          this.showToast('Username is required.');
          return;
        }
        if (newPin && !/^\d{4}$/.test(newPin)) {
          this.showToast('PIN must be 4 digits.');
          return;
        }
        if (recoveryEmailRaw && !recoveryEmail) {
          this.showToast('Recovery email is invalid.');
          return;
        }
        if (recoveryPhoneRaw && !recoveryPhone) {
          this.showToast('Recovery phone is invalid.');
          return;
        }
        const users = this.getUsers();
        const nameTaken = users.some(
          (u) => u.id !== user.id && u.username.toLowerCase() === newName.toLowerCase()
        );
        if (nameTaken) {
          this.showToast('Username already taken.');
          return;
        }
        user.username = newName;
        if (newPin) user.pin = newPin;
        user.recovery = {
          email: recoveryEmail,
          phone: recoveryPhone
        };
        this.updateUser(user);
        this.showToast('Account updated.');
        this.renderTopbar();
        this.syncCurrentUser(true);
        this.renderProfile();
      };
      signOutBtn.onclick = () => {
        this.signOut();
        window.location.href = 'index.html';
      };
    },
    renderSettings() {
      const user = this.getCurrentUser();
      const themeButtons = document.querySelectorAll('[data-theme-choice]');
      themeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setTheme(btn.dataset.themeChoice);
          themeButtons.forEach((b) => {
            b.classList.remove('primary');
            b.classList.add('ghost');
          });
          btn.classList.add('primary');
          btn.classList.remove('ghost');
        });
      });
      const activeTheme = document.body.dataset.theme;
      themeButtons.forEach((btn) => {
        if (btn.dataset.themeChoice === activeTheme) {
          btn.classList.add('primary');
          btn.classList.remove('ghost');
        } else {
          btn.classList.add('ghost');
          btn.classList.remove('primary');
        }
      });
      const adBlockToggle = document.getElementById('adBlockToggle');
      const adBlockStatus = document.getElementById('adBlockStatus');
      const syncAdBlockUi = () => {
        if (!adBlockToggle) return;
        const enabled = this.isAdBlockEnabled();
        adBlockToggle.textContent = enabled ? 'Ad Blocker: On' : 'Ad Blocker: Off';
        adBlockToggle.classList.toggle('primary', enabled);
        adBlockToggle.classList.toggle('ghost', !enabled);
        if (adBlockStatus) {
          adBlockStatus.textContent = enabled
            ? 'Ad blocker is active for embedded games.'
            : 'Ad blocker is off. Embedded games may show ads.';
        }
      };
      if (adBlockToggle) {
        adBlockToggle.addEventListener('click', () => {
          this.setAdBlockEnabled(!this.isAdBlockEnabled());
          syncAdBlockUi();
        });
        syncAdBlockUi();
      }
      const codeInput = document.getElementById('redeemCodeInput');
      const redeemBtn = document.getElementById('redeemButton');
      const redeemMsg = document.getElementById('redeemMessage');
      const unlockList = document.getElementById('unlockList');
      const redeemedList = document.getElementById('redeemedList');
      const redeemedCodes = this.safeParse(this.storage.redeemed, []);

      const refreshUnlocks = () => {
        unlockList.innerHTML = '';
        if (user && user.bonusPoints > 0) {
          const item = document.createElement('div');
          item.className = 'chip';
          item.textContent = `Bonus Points: ${user.bonusPoints}`;
          unlockList.appendChild(item);
        }
        if (this.isUpdatePreviewEnabled()) {
          const previewItem = document.createElement('div');
          previewItem.className = 'chip';
          previewItem.textContent = 'Update Preview: On (SANTA22WE)';
          unlockList.appendChild(previewItem);
        }
        if (this.isAdminModeEnabled()) {
          const adminItem = document.createElement('div');
          adminItem.className = 'chip';
          adminItem.textContent = 'Admin Mode: Enabled (CABRA2031)';
          unlockList.appendChild(adminItem);
        }
        if (!this.isUpdateV2Live() && redeemedCodes.includes('SANTA33WE')) {
          const rushItem = document.createElement('div');
          rushItem.className = 'chip';
          rushItem.textContent = 'Final Countdown Triggered (SANTA33WE)';
          unlockList.appendChild(rushItem);
        }
        if (!unlockList.children.length) {
          unlockList.innerHTML = '<div class="empty">No unlocks yet.</div>';
        }

        redeemedList.innerHTML = '';
        if (!redeemedCodes.length) {
          redeemedList.innerHTML = '<div class="empty">No codes redeemed yet.</div>';
        } else {
          redeemedCodes.forEach((code) => {
            const item = document.createElement('div');
            item.className = 'chip';
            item.textContent = code;
            redeemedList.appendChild(item);
          });
        }
      };

      redeemBtn.addEventListener('click', () => {
        const code = codeInput.value.trim().toUpperCase();
        if (!code) return;
        if (!user) {
          redeemMsg.textContent = 'Please sign in before redeeming a code.';
          return;
        }
        if (code === 'SANTA22WE') {
          if (this.isUpdateV2Live()) {
            this.setUpdatePreviewEnabled(false);
            redeemMsg.textContent = 'SANTA22WE expired because Update 2.00 is already live.';
            refreshUnlocks();
            return;
          }
          const nextState = !this.isUpdatePreviewEnabled();
          this.setUpdatePreviewEnabled(nextState);
          redeemMsg.textContent = nextState
            ? 'SANTA22WE redeemed: pre-release games are now visible.'
            : 'SANTA22WE redeemed again: pre-release games are now hidden.';
          refreshUnlocks();
          return;
        }
        if (code === 'CABRA2031') {
          const nextAdminState = !this.isAdminModeEnabled();
          this.setAdminModeEnabled(nextAdminState);
          redeemMsg.textContent = nextAdminState
            ? 'CABRA2031 accepted. Admin mode is now enabled on this device.'
            : 'CABRA2031 entered again. Admin mode is now disabled.';
          this.renderAdminPanel();
          refreshUnlocks();
          return;
        }
        if (code === 'SANTA33WE') {
          if (this.isUpdateV2Live()) {
            redeemMsg.textContent = 'SANTA33WE expired because Update 2.00 is already live.';
            refreshUnlocks();
            return;
          }
          if (redeemedCodes.includes(code)) {
            redeemMsg.textContent = 'SANTA33WE already used on this device.';
            return;
          }
          const fastTarget = Date.now() + 10 * 1000;
          this.safeSet(this.storage.updateV2Target, fastTarget);
          this.safeSet(this.storage.updateV2CelebrationSeen, false);
          this.updateLaunchSequenceStarted = false;
          redeemedCodes.push(code);
          this.safeSet(this.storage.redeemed, redeemedCodes);
          redeemMsg.textContent = 'SANTA33WE activated: final 10-second update countdown started.';
          refreshUnlocks();
          return;
        }
        if (redeemedCodes.includes(code)) {
          redeemMsg.textContent = 'Code already redeemed on this device.';
          return;
        }
        if (code === 'DONKEY26') {
          redeemedCodes.push(code);
          this.safeSet(this.storage.redeemed, redeemedCodes);
          const prankUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
          const popup = window.open(prankUrl, '_blank', 'noopener,noreferrer');
          redeemMsg.textContent = popup
            ? 'DONKEY26 redeemed! Surprise opened in a new tab.'
            : 'DONKEY26 redeemed. Pop-up was blocked, allow pop-ups and try again.';
          refreshUnlocks();
          return;
        }
        redeemMsg.textContent = 'Invalid code.';
      });

      refreshUnlocks();
    },
    renderAdminPage() {
      const locked = document.getElementById('adminLockedInfo');
      if (!this.isAdminModeEnabled()) {
        if (locked) locked.hidden = false;
        this.renderAdminPanel();
        return;
      }
      if (locked) locked.hidden = true;
      this.renderAdminPanel();
    },
    renderAdminPlayers(entries = [], moderation = {}) {
      const host = document.getElementById('adminPlayerList');
      if (!host) return;
      host.innerHTML = '';
      if (!entries.length) {
        host.innerHTML = '<div class="empty">No global players found yet.</div>';
        return;
      }
      const bannedIds = moderation?.bannedIds || {};
      const bannedNames = moderation?.bannedNames || {};
      const kickedIds = moderation?.kickedById || {};
      const kickedNames = moderation?.kickedByName || {};
      const now = Date.now();

      entries.slice(0, 120).forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'admin-player-row';

        const name = document.createElement('div');
        name.className = 'admin-player-name';
        name.textContent = `${entry.username || 'Player'} (${entry.points || 0} pts)`;

        const meta = document.createElement('div');
        meta.className = 'admin-player-meta';
        const id = String(entry.id || '').trim();
        const lower = String(entry.username || '')
          .toLowerCase()
          .trim();
        const banned = Boolean((id && bannedIds[id]) || (lower && bannedNames[lower]));
        const kickedUntil = Math.max(Number(kickedIds[id]) || 0, Number(kickedNames[lower]) || 0);
        const kicked = Number.isFinite(kickedUntil) && kickedUntil > now;
        const flags = [entry.tier ? `Tier ${entry.tier}` : '', banned ? 'BANNED' : '', kicked ? 'KICKED' : '']
          .filter(Boolean)
          .join(' · ');
        meta.textContent = `${flags}${id ? ` · ID: ${id}` : ''}`;

        row.appendChild(name);
        row.appendChild(meta);
        host.appendChild(row);
      });
    },
    renderAdminLocalUsers(users = []) {
      const host = document.getElementById('adminLocalUserList');
      if (!host) return;
      host.innerHTML = '';
      if (!Array.isArray(users) || !users.length) {
        host.innerHTML = '<div class="empty">No local accounts on this device.</div>';
        return;
      }
      users
        .slice()
        .sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')))
        .forEach((user) => {
          const row = document.createElement('div');
          row.className = 'admin-player-row';
          row.dataset.localUserId = String(user.id || '');
          row.dataset.localUsername = String(user.username || '');

          const name = document.createElement('div');
          name.className = 'admin-player-name';
          name.textContent = `${user.username || 'Player'} (${this.computePoints(user)} pts)`;

          const meta = document.createElement('div');
          meta.className = 'admin-player-meta';
          const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
          meta.textContent = `ID: ${user.id || '--'} · Created: ${createdAt} · PIN hidden for security`;

          row.appendChild(name);
          row.appendChild(meta);
          host.appendChild(row);
        });
    },
    toLocalDatetimeValue(timestamp) {
      const ms = Number(timestamp);
      if (!Number.isFinite(ms) || ms <= 0) return '';
      const date = new Date(ms);
      const pad = (value) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
        date.getMinutes()
      )}`;
    },
    normalizeAdminTimers(rawTimers) {
      if (!Array.isArray(rawTimers)) return [];
      return rawTimers
        .map((row) => {
          const id = String(row?.id || '')
            .trim()
            .toLowerCase()
            .slice(0, 40);
          const label = String(row?.label || row?.id || '')
            .trim()
            .slice(0, 64);
          const target = Number(row?.target);
          if (!id || !label || !Number.isFinite(target) || target <= 0) return null;
          return {
            id,
            label,
            target,
            isMain: Boolean(row?.isMain),
            createdBy: String(row?.createdBy || 'Admin').trim().slice(0, 18) || 'Admin'
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.target - b.target || a.id.localeCompare(b.id));
    },
    renderAdminTimers(rawTimers = []) {
      const host = document.getElementById('adminTimerList');
      const preview = document.getElementById('adminTimerPreview');
      if (!host) return;
      host.innerHTML = '';
      const timers = this.normalizeAdminTimers(rawTimers);
      if (!timers.length) {
        host.innerHTML = '<div class="empty">No timers yet. Create one below.</div>';
        if (preview) preview.textContent = 'No timers loaded yet.';
        return;
      }

      const now = Date.now();
      timers.forEach((timer) => {
        const row = document.createElement('div');
        row.className = 'admin-player-row';
        row.dataset.timerId = timer.id;
        row.dataset.timerLabel = timer.label;
        row.dataset.timerTarget = String(timer.target);

        const name = document.createElement('div');
        name.className = 'admin-player-name';
        name.textContent = `${timer.label}${timer.isMain ? ' (Main)' : ''}`;

        const meta = document.createElement('div');
        meta.className = 'admin-player-meta';
        const remaining = timer.target - now;
        const remainingText = remaining >= 0 ? this.formatCountdown(remaining) : 'Completed';
        meta.textContent = `ID: ${timer.id} · Ends: ${new Date(timer.target).toLocaleString()} · ${remainingText}`;

        row.appendChild(name);
        row.appendChild(meta);
        host.appendChild(row);
      });

      if (preview) preview.textContent = `${timers.length} timer${timers.length === 1 ? '' : 's'} loaded. Click one to edit.`;
    },
    renderAdminTournamentSummary(state) {
      const preview = document.getElementById('adminTournamentPreview');
      if (!preview) return;
      const event = state?.event && typeof state.event === 'object' ? state.event : null;
      if (!event) {
        preview.textContent = 'Tournament status unavailable.';
        return;
      }
      const season = state?.season && typeof state.season === 'object' ? state.season : null;
      const gameLabel = this.getTournamentGameLabel(event.gameId);
      const endsAt = Number(event.endAt || 0);
      const endsText = Number.isFinite(endsAt) && endsAt > 0 ? new Date(endsAt).toLocaleString() : 'Unknown';
      const seasonEnds = Number(season?.endAt || 0);
      const seasonText =
        Number.isFinite(seasonEnds) && seasonEnds > 0
          ? ` · Season ends ${new Date(seasonEnds).toLocaleDateString()}`
          : '';
      preview.textContent = `Current: ${gameLabel} (${event.gameId || 'unknown'}) · Ends ${endsText}${seasonText}`;
    },
    renderAdminChatReports(reports = []) {
      const host = document.getElementById('adminChatReports');
      if (!host) return;
      host.innerHTML = '';
      const rows = Array.isArray(reports) ? reports : [];
      if (!rows.length) {
        host.innerHTML = '<div class="empty">No chat reports.</div>';
        return;
      }
      rows.slice(0, 80).forEach((report) => {
        const row = document.createElement('div');
        row.className = 'admin-player-row';
        row.dataset.room = String(report.room || 'global-games');
        row.dataset.messageId = String(report.messageId || '');
        const name = document.createElement('div');
        name.className = 'admin-player-name';
        name.textContent = `${report.targetUsername || 'Player'} reported by ${report.reporterName || 'Player'}`;
        const meta = document.createElement('div');
        meta.className = 'admin-player-meta';
        const created = Number(report.createdAt) ? new Date(Number(report.createdAt)).toLocaleString() : 'Unknown time';
        meta.textContent = `Room: ${report.room || 'global-games'} · Message ID: ${report.messageId || '--'} · ${created}`;
        const body = document.createElement('div');
        body.className = 'notice';
        body.style.marginTop = '6px';
        body.textContent = `"${report.messageText || ''}" · Reason: ${report.reason || 'No reason provided.'}`;
        row.appendChild(name);
        row.appendChild(meta);
        row.appendChild(body);
        host.appendChild(row);
      });
    },
    renderAdminChatModeration(moderation = {}) {
      const mutedPreview = document.getElementById('adminChatMutedPreview');
      const bannedPreview = document.getElementById('adminChatBannedPreview');
      if (mutedPreview) {
        const muted = Array.isArray(moderation.muted) ? moderation.muted : [];
        if (!muted.length) {
          mutedPreview.textContent = 'No muted players.';
        } else {
          mutedPreview.textContent = muted
            .slice(0, 6)
            .map((item) => `${item.target} (until ${new Date(Number(item.until || 0)).toLocaleTimeString()})`)
            .join(' · ');
        }
      }
      if (bannedPreview) {
        const words = Array.isArray(moderation.bannedWords) ? moderation.bannedWords : [];
        bannedPreview.textContent = words.length ? words.join(', ') : 'No banned words configured.';
      }
      this.renderAdminChatReports(Array.isArray(moderation.reports) ? moderation.reports : []);
    },
    renderAdminPanel() {
      const panelWrap = document.getElementById('adminPanelWrap');
      const panel = document.getElementById('adminPanel');
      if (!panel) return;
      const enabled = this.isAdminModeEnabled();
      if (panelWrap) {
        panelWrap.style.display = enabled ? 'grid' : 'none';
      }
      panel.hidden = !enabled;
      if (!enabled) {
        const statusEl = document.getElementById('adminStatus');
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.classList.remove('admin-status-error');
        }
        return;
      }

      const statusEl = document.getElementById('adminStatus');
      const targetInput = document.getElementById('adminTargetUser');
      const pointsInput = document.getElementById('adminPointsAmount');
      const kickMinutesInput = document.getElementById('adminKickMinutes');
      const announcementInput = document.getElementById('adminAnnouncementText');
      const announcementMinutesInput = document.getElementById('adminAnnouncementMinutes');
      const announcementPreview = document.getElementById('adminAnnouncementPreview');
      const timerIdInput = document.getElementById('adminTimerId');
      const timerLabelInput = document.getElementById('adminTimerLabel');
      const timerMinutesInput = document.getElementById('adminTimerMinutes');
      const timerAtInput = document.getElementById('adminTimerAt');
      const tournamentGameInput = document.getElementById('adminTournamentGameId');
      const tournamentTitleInput = document.getElementById('adminTournamentTitle');
      const tournamentHoursInput = document.getElementById('adminTournamentHours');
      const tournamentStartInput = document.getElementById('adminTournamentStartAt');
      const chatTargetInput = document.getElementById('adminChatTarget');
      const chatMuteMinutesInput = document.getElementById('adminChatMuteMinutes');
      const chatMessageIdInput = document.getElementById('adminChatMessageId');
      const chatBannedWordsInput = document.getElementById('adminChatBannedWords');
      const localTargetInput = document.getElementById('adminLocalTargetUser');
      const localPinInput = document.getElementById('adminLocalNewPin');
      const localStatusEl = document.getElementById('adminLocalStatus');
      const localListEl = document.getElementById('adminLocalUserList');
      if (
        !statusEl ||
        !targetInput ||
        !pointsInput ||
        !kickMinutesInput ||
        !announcementInput ||
        !announcementMinutesInput ||
        !timerIdInput ||
        !timerLabelInput ||
        !timerMinutesInput ||
        !timerAtInput ||
        !chatTargetInput ||
        !chatMuteMinutesInput ||
        !chatMessageIdInput ||
        !chatBannedWordsInput
      ) {
        return;
      }

      const setLocalStatus = (message, isError = false) => {
        if (!localStatusEl) return;
        localStatusEl.textContent = message || '';
        localStatusEl.classList.toggle('admin-status-error', Boolean(isError));
      };

      const refreshLocalSupport = () => {
        this.renderAdminLocalUsers(this.getUsers());
      };

      const tournamentGameList = document.getElementById('adminTournamentGameList');
      if (tournamentGameList && !tournamentGameList.dataset.ready) {
        tournamentGameList.dataset.ready = '1';
        tournamentGameList.innerHTML = '';
        this.data.games.forEach((game) => {
          const option = document.createElement('option');
          option.value = game.id;
          option.label = `${game.name} (${game.category})`;
          tournamentGameList.appendChild(option);
        });
      }

      const setStatus = (message, isError = false) => {
        statusEl.textContent = message || '';
        statusEl.classList.toggle('admin-status-error', Boolean(isError));
      };

      const loadChatStatus = async () => {
        const result = await this.chatAdminRequest('status');
        if (!result.ok) {
          this.renderAdminChatModeration({ muted: [], bannedWords: [], reports: [] });
          return { ok: false, error: String(result.data?.error || 'Chat moderation unavailable.') };
        }
        const moderation = result.data?.moderation || {};
        this.renderAdminChatModeration(moderation);
        if (chatBannedWordsInput) {
          const words = Array.isArray(moderation.bannedWords) ? moderation.bannedWords : [];
          chatBannedWordsInput.value = words.join(', ');
        }
        return { ok: true };
      };

      const loadTournamentStatus = async () => {
        const result = await this.tournamentAdminRequest('status');
        if (!result.ok) {
          this.renderAdminTournamentSummary(this.tournamentState || null);
          return { ok: false, error: String(result.data?.error || 'Tournament status unavailable.') };
        }
        this.tournamentState = result.data || this.tournamentState;
        this.renderAdminTournamentSummary(this.tournamentState);
        if (tournamentGameInput && !tournamentGameInput.value) {
          tournamentGameInput.value = String(this.tournamentState?.event?.gameId || 'click-rush');
        }
        if (tournamentTitleInput && !tournamentTitleInput.value) {
          tournamentTitleInput.value = String(this.tournamentState?.event?.title || '').slice(0, 90);
        }
        return { ok: true };
      };

      const loadStatus = async (message = 'Loading admin data...') => {
        setStatus(message, false);
        refreshLocalSupport();
        const result = await this.adminRequest('status');
        if (!result.ok) {
          setStatus(String(result.data?.error || `Admin request failed (${result.status}).`), true);
          this.renderAdminPlayers([], {});
          this.renderAdminTimers([]);
          this.renderAdminChatModeration({ muted: [], bannedWords: [], reports: [] });
          this.renderAdminTournamentSummary(this.tournamentState || null);
          if (announcementPreview) announcementPreview.textContent = 'No active announcement.';
          return;
        }
        this.renderAdminPlayers(Array.isArray(result.data?.entries) ? result.data.entries : [], result.data?.moderation || {});
        this.renderAdminTimers(Array.isArray(result.data?.timers) ? result.data.timers : []);
        const announcement = this.normalizeAnnouncement(result.data?.announcement || null);
        if (announcementPreview) {
          announcementPreview.textContent = announcement
            ? `${announcement.message} — by ${announcement.createdBy || 'Admin'} (ends in ${this.formatShortCountdown(
                announcement.expiresAt - Date.now()
              )})`
            : 'No active announcement.';
        }
        const chat = await loadChatStatus();
        const tournament = await loadTournamentStatus();
        const hasError = !chat.ok || !tournament.ok;
        const statusBits = ['Admin data synced.'];
        if (!chat.ok) statusBits.push(chat.error);
        if (!tournament.ok) statusBits.push(tournament.error);
        setStatus(statusBits.join(' '), hasError);
      };

      panel.__loadAdminStatus = loadStatus;

      const runAction = async (action, payload, successMessage) => {
        setStatus('Running admin action...', false);
        const result = await this.adminRequest(action, payload);
        if (!result.ok) {
          setStatus(String(result.data?.error || `Action failed (${result.status}).`), true);
          return;
        }
        this.renderAdminPlayers(Array.isArray(result.data?.entries) ? result.data.entries : [], result.data?.moderation || {});
        this.renderAdminTimers(Array.isArray(result.data?.timers) ? result.data.timers : []);
        const announcement = this.normalizeAnnouncement(result.data?.announcement || null);
        if (announcementPreview) {
          announcementPreview.textContent = announcement
            ? `${announcement.message} — by ${announcement.createdBy || 'Admin'} (ends in ${this.formatShortCountdown(
                announcement.expiresAt - Date.now()
              )})`
            : 'No active announcement.';
        }
        await loadChatStatus();
        this.syncUpdateTimer();
        setStatus(successMessage || 'Action complete.');
      };

      const runChatAction = async (action, payload, successMessage) => {
        setStatus('Running chat admin action...', false);
        const result = await this.chatAdminRequest(action, payload);
        if (!result.ok) {
          setStatus(String(result.data?.error || `Chat action failed (${result.status}).`), true);
          return;
        }
        this.renderAdminChatModeration(result.data?.moderation || {});
        if (chatBannedWordsInput) {
          const words = Array.isArray(result.data?.moderation?.bannedWords) ? result.data.moderation.bannedWords : [];
          chatBannedWordsInput.value = words.join(', ');
        }
        setStatus(successMessage || 'Chat action complete.');
      };

      const runTournamentAction = async (action, payload, successMessage) => {
        setStatus('Running tournament action...', false);
        const result = await this.tournamentAdminRequest(action, payload);
        if (!result.ok) {
          setStatus(String(result.data?.error || `Tournament action failed (${result.status}).`), true);
          return;
        }
        this.tournamentState = result.data || this.tournamentState;
        this.renderAdminTournamentSummary(this.tournamentState);
        if (document.body.dataset.page === 'home') {
          this.renderTournamentPanel();
        }
        setStatus(successMessage || 'Tournament action complete.');
      };

      if (!panel.dataset.bound) {
        panel.dataset.bound = '1';

        document.getElementById('adminRefreshBtn')?.addEventListener('click', () => {
          panel.__loadAdminStatus('Refreshing admin data...');
        });

        document.getElementById('adminGivePointsBtn')?.addEventListener('click', () => {
          const target = targetInput.value.trim();
          const delta = Math.round(Number(pointsInput.value) || 0);
          if (!target) {
            setStatus('Enter a username or user ID target first.', true);
            return;
          }
          if (!delta) {
            setStatus('Points amount cannot be 0.', true);
            return;
          }
          runAction('give_points', { target, pointsDelta: delta }, `Updated points for ${target}.`);
        });

        document.getElementById('adminGivePointsAllBtn')?.addEventListener('click', () => {
          const delta = Math.round(Number(pointsInput.value) || 0);
          if (!delta) {
            setStatus('Points amount cannot be 0.', true);
            return;
          }
          runAction('give_points_all', { pointsDelta: delta }, `Updated points for all global players by ${delta}.`);
        });

        document.getElementById('adminKickBtn')?.addEventListener('click', () => {
          const target = targetInput.value.trim();
          const minutes = Math.max(1, Math.round(Number(kickMinutesInput.value) || 15));
          if (!target) {
            setStatus('Enter a username or user ID target first.', true);
            return;
          }
          runAction('kick_player', { target, minutes }, `${target} kicked for ${minutes} minutes.`);
        });

        document.getElementById('adminBanBtn')?.addEventListener('click', () => {
          const target = targetInput.value.trim();
          if (!target) {
            setStatus('Enter a username or user ID target first.', true);
            return;
          }
          runAction('ban_player', { target }, `${target} banned.`);
        });

        document.getElementById('adminUnbanBtn')?.addEventListener('click', () => {
          const target = targetInput.value.trim();
          if (!target) {
            setStatus('Enter a username or user ID target first.', true);
            return;
          }
          runAction('unban_player', { target }, `${target} unbanned.`);
        });

        document.getElementById('adminRemoveBtn')?.addEventListener('click', () => {
          const target = targetInput.value.trim();
          if (!target) {
            setStatus('Enter a username or user ID target first.', true);
            return;
          }
          runAction('remove_player', { target }, `${target} removed from global leaderboard.`);
        });

        document.getElementById('adminSendAnnouncementBtn')?.addEventListener('click', () => {
          const message = announcementInput.value.trim();
          const minutes = Math.max(1, Math.round(Number(announcementMinutesInput.value) || 30));
          if (!message) {
            setStatus('Announcement text is required.', true);
            return;
          }
          runAction(
            'set_announcement',
            { message, minutes },
            `Announcement sent globally for ${minutes} minute${minutes === 1 ? '' : 's'}.`
          );
        });

        document.getElementById('adminClearAnnouncementBtn')?.addEventListener('click', () => {
          runAction('clear_announcement', {}, 'Announcement cleared.');
        });

        document.getElementById('adminResetTimerBtn')?.addEventListener('click', () => {
          runAction('set_timer_one_hour', {}, 'Update timer reset to 1 hour from now.');
        });

        document.getElementById('adminTimerList')?.addEventListener('click', (event) => {
          const targetEl = event.target instanceof Element ? event.target : null;
          const row = targetEl ? targetEl.closest('.admin-player-row') : null;
          if (!row) return;
          const timerId = String(row.dataset.timerId || '').trim();
          const timerLabel = String(row.dataset.timerLabel || '').trim();
          const timerTarget = Number(row.dataset.timerTarget || 0);
          if (!timerId || !Number.isFinite(timerTarget) || timerTarget <= 0) return;
          timerIdInput.value = timerId;
          timerLabelInput.value = timerLabel || timerId;
          timerAtInput.value = this.toLocalDatetimeValue(timerTarget);
          const minutesLeft = Math.max(1, Math.round((timerTarget - Date.now()) / 60000));
          timerMinutesInput.value = String(minutesLeft);
          setStatus(`Loaded timer "${timerId}" into the editor.`, false);
        });

        document.getElementById('adminUpsertTimerBtn')?.addEventListener('click', () => {
          const timerId = timerIdInput.value.trim().toLowerCase();
          if (!timerId) {
            setStatus('Timer ID is required.', true);
            return;
          }
          const label = timerLabelInput.value.trim();
          let target = NaN;
          const exactValue = timerAtInput.value.trim();
          if (exactValue) {
            target = new Date(exactValue).getTime();
            if (!Number.isFinite(target) || target <= 0) {
              setStatus('Exact date/time is invalid.', true);
              return;
            }
          } else {
            const minutes = Math.round(Number(timerMinutesInput.value) || 0);
            if (minutes <= 0) {
              setStatus('Minutes from now must be greater than 0.', true);
              return;
            }
            target = Date.now() + minutes * 60 * 1000;
          }
          runAction('set_timer', { timerId, label, target }, `Timer "${timerId}" saved.`);
        });

        document.getElementById('adminDeleteTimerBtn')?.addEventListener('click', () => {
          const timerId = timerIdInput.value.trim().toLowerCase();
          if (!timerId) {
            setStatus('Timer ID is required.', true);
            return;
          }
          runAction('delete_timer', { timerId }, `Timer "${timerId}" deleted.`);
        });

        document.getElementById('adminCreateTournamentBtn')?.addEventListener('click', () => {
          const gameId = String(tournamentGameInput?.value || '')
            .trim()
            .toLowerCase();
          if (!gameId) {
            setStatus('Tournament game ID is required.', true);
            return;
          }
          const durationHours = Math.max(1, Math.min(168, Math.round(Number(tournamentHoursInput?.value) || 24)));
          const titleRaw = String(tournamentTitleInput?.value || '').trim();
          const title = titleRaw ? titleRaw.slice(0, 90) : `${this.getTournamentGameLabel(gameId)} Cup`;
          let startAt = Date.now();
          const exactStart = String(tournamentStartInput?.value || '').trim();
          if (exactStart) {
            startAt = new Date(exactStart).getTime();
            if (!Number.isFinite(startAt) || startAt <= 0) {
              setStatus('Tournament start date/time is invalid.', true);
              return;
            }
          }
          runTournamentAction(
            'create_event',
            { gameId, title, startAt, durationHours },
            `Tournament created: ${this.getTournamentGameLabel(gameId)} (${durationHours}h).`
          );
        });

        document.getElementById('adminLoadTournamentNowBtn')?.addEventListener('click', () => {
          if (tournamentStartInput) tournamentStartInput.value = '';
          this.tournamentAdminRequest('status').then((result) => {
            if (!result.ok) {
              setStatus(String(result.data?.error || 'Failed to load tournament status.'), true);
              return;
            }
            this.tournamentState = result.data || this.tournamentState;
            const event = this.tournamentState?.event || {};
            if (tournamentGameInput) tournamentGameInput.value = String(event.gameId || 'click-rush');
            if (tournamentTitleInput) tournamentTitleInput.value = String(event.title || '').slice(0, 90);
            if (tournamentHoursInput) {
              const spanMs = Math.max(60 * 60 * 1000, Number(event.endAt || 0) - Number(event.startAt || 0));
              tournamentHoursInput.value = String(Math.max(1, Math.round(spanMs / (60 * 60 * 1000))));
            }
            this.renderAdminTournamentSummary(this.tournamentState);
            setStatus('Tournament editor loaded from current event.', false);
          });
        });

        document.getElementById('adminChatMuteBtn')?.addEventListener('click', () => {
          const target = chatTargetInput.value.trim();
          const minutes = Math.max(1, Math.round(Number(chatMuteMinutesInput.value) || 30));
          if (!target) {
            setStatus('Enter a chat target username or ID.', true);
            return;
          }
          runChatAction('mute_user', { target, minutes }, `${target} muted for ${minutes} minutes.`);
        });

        document.getElementById('adminChatUnmuteBtn')?.addEventListener('click', () => {
          const target = chatTargetInput.value.trim();
          if (!target) {
            setStatus('Enter a chat target username or ID.', true);
            return;
          }
          runChatAction('unmute_user', { target }, `${target} unmuted.`);
        });

        document.getElementById('adminChatDeleteMessageBtn')?.addEventListener('click', () => {
          const messageId = chatMessageIdInput.value.trim();
          if (!messageId) {
            setStatus('Enter a message ID to delete.', true);
            return;
          }
          runChatAction('delete_message', { room: 'global-games', messageId }, `Message ${messageId} deleted.`);
        });

        document.getElementById('adminChatSaveWordsBtn')?.addEventListener('click', () => {
          const wordsText = chatBannedWordsInput.value.trim();
          runChatAction('set_banned_words', { wordsText }, 'Chat banned words updated.');
        });

        document.getElementById('adminChatClearReportsBtn')?.addEventListener('click', () => {
          runChatAction('clear_reports', {}, 'Chat reports cleared.');
        });

        document.getElementById('adminChatReports')?.addEventListener('click', (event) => {
          const targetEl = event.target instanceof Element ? event.target : null;
          const row = targetEl ? targetEl.closest('.admin-player-row') : null;
          if (!row) return;
          const messageId = String(row.dataset.messageId || '').trim();
          if (messageId) {
            chatMessageIdInput.value = messageId;
            setStatus(`Loaded message ID ${messageId}.`, false);
          }
        });

        document.getElementById('adminLocalResetPinBtn')?.addEventListener('click', async () => {
          if (!localTargetInput || !localPinInput) return;
          const target = String(localTargetInput.value || '').trim();
          const nextPin = String(localPinInput.value || '').trim();
          if (!target) {
            setLocalStatus('Enter a local username or ID.', true);
            return;
          }
          if (!/^\d{4}$/.test(nextPin)) {
            setLocalStatus('New PIN must be exactly 4 digits.', true);
            return;
          }
          let didGlobal = false;
          const globalResult = await this.callAccountsApi('admin_reset_pin', {
            adminCode: this.data.adminTools?.code || '',
            target,
            newPin: nextPin
          });
          if (globalResult.ok) {
            didGlobal = true;
          }
          const users = this.getUsers();
          const match = users.find((u) => {
            const id = String(u?.id || '').trim();
            const username = String(u?.username || '')
              .trim()
              .toLowerCase();
            return id === target || username === target.toLowerCase();
          });
          if (!match) {
            if (didGlobal) {
              setLocalStatus('Global PIN reset done.', false);
              this.showToast('Global PIN reset complete.');
            } else {
              setLocalStatus(String(globalResult.data?.error || 'User not found.'), true);
            }
            return;
          }
          match.pin = nextPin;
          this.updateUser(match);
          refreshLocalSupport();
          setLocalStatus(
            didGlobal ? `Global + local PIN reset for ${match.username}.` : `Local PIN reset for ${match.username}.`,
            false
          );
          this.showToast(
            didGlobal ? `Global + local PIN reset for ${match.username}.` : `Local PIN reset for ${match.username}.`
          );
          localPinInput.value = '';
          localTargetInput.value = String(match.username || target);
        });

        localListEl?.addEventListener('click', (event) => {
          const targetEl = event.target instanceof Element ? event.target : null;
          const row = targetEl ? targetEl.closest('.admin-player-row') : null;
          if (!row || !localTargetInput) return;
          const userId = String(row.dataset.localUserId || '').trim();
          const username = String(row.dataset.localUsername || '').trim();
          localTargetInput.value = username || userId;
          setLocalStatus(`Selected ${username || userId}. Enter a new PIN to reset.`, false);
        });
      }

      loadStatus();
    },
    buildSocialIdentityPayload(user) {
      if (!user) return null;
      const chat = this.getChatIdentityPayload(user);
      return {
        username: user.username,
        userId: user.id,
        titleTag: chat.titleTag,
        chatNameColor: chat.chatNameColor
      };
    },
    startFollowLiveNotifications() {
      const user = this.getCurrentUser();
      if (!user) return;
      clearInterval(this.followLiveTimer);
      const readSeen = () => {
        const raw = this.safeParse(this.storage.followedLiveSeen, {});
        if (!raw || typeof raw !== 'object') return {};
        return raw;
      };
      const writeSeen = (value) => this.safeSet(this.storage.followedLiveSeen, value || {});
      const poll = async () => {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        const result = await this.callSocialApi(
          'live_snapshot',
          { username: currentUser.username },
          'GET'
        );
        if (!result.ok) return;
        const followedLive = Array.isArray(result.data?.followedLive) ? result.data.followedLive : [];
        const seen = readSeen();
        const nextSeen = {};
        followedLive.forEach((stream) => {
          const hostKey = String(stream?.hostKey || '')
            .trim()
            .toLowerCase();
          const streamId = String(stream?.id || '').trim();
          if (!hostKey || !streamId) return;
          nextSeen[hostKey] = streamId;
          if (!seen[hostKey] || seen[hostKey] !== streamId) {
            if (document.body.dataset.page !== 'live') {
              this.showToast(`${this.formatDisplayUsername(stream.hostUsername)} is LIVE now.`);
            }
          }
        });
        writeSeen(nextSeen);
      };
      poll();
      const pollMs = Math.max(8000, Number(this.data.social?.followPollMs) || 12000);
      this.followLiveTimer = setInterval(() => {
        if (document.hidden) return;
        poll();
      }, pollMs);
    },
    renderLiveHub() {
      const user = this.getCurrentUser();
      if (!user) {
        this.safeSet(this.storage.showAuth, true);
        window.location.href = 'index.html';
        return;
      }

      const gameSelect = document.getElementById('liveGameSelect');
      const titleInput = document.getElementById('liveTitleInput');
      const startBtn = document.getElementById('startLiveBtn');
      const stopBtn = document.getElementById('stopLiveBtn');
      const hostStatus = document.getElementById('liveHostStatus');
      const list = document.getElementById('liveStreamList');
      const followingNotice = document.getElementById('liveFollowingNotice');
      const watchVideo = document.getElementById('liveWatchVideo');
      const watchMeta = document.getElementById('liveWatchMeta');
      const followBtn = document.getElementById('liveFollowBtn');
      const refreshBtn = document.getElementById('liveRefreshBtn');
      const chatList = document.getElementById('liveChatList');
      const chatInput = document.getElementById('liveChatInput');
      const chatSendBtn = document.getElementById('liveChatSendBtn');
      const chatStatus = document.getElementById('liveChatStatus');
      if (!gameSelect || !startBtn || !stopBtn || !list || !watchVideo || !watchMeta || !followBtn) return;

      const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const selfKey = String(user.username || '').trim().toLowerCase();
      const identity = this.buildSocialIdentityPayload(user) || {
        username: user.username,
        userId: user.id,
        titleTag: '',
        chatNameColor: ''
      };

      const state = {
        streams: [],
        streamMap: {},
        following: new Set(),
        selectedStreamId: '',
        host: {
          streamId: '',
          localStream: null,
          peers: {},
          pingTimer: 0,
          signalTimer: 0
        },
        watch: {
          streamId: '',
          pc: null,
          signalTimer: 0,
          pingTimer: 0,
          hostKey: '',
          hostUsername: ''
        },
        chatTimer: 0,
        snapshotTimer: 0
      };
      this.liveHubState = state;

      const setHostStatus = (message, isError = false) => {
        if (!hostStatus) return;
        hostStatus.textContent = message || '';
        hostStatus.style.color = isError ? 'var(--warn)' : '';
      };
      const setChatStatus = (message, isError = false) => {
        if (!chatStatus) return;
        chatStatus.textContent = message || '';
        chatStatus.style.color = isError ? 'var(--warn)' : '';
      };

      const fillGameSelect = () => {
        gameSelect.innerHTML = '';
        this.data.games.forEach((game) => {
          const option = document.createElement('option');
          option.value = game.id;
          option.textContent = `${game.name} (${game.category})`;
          gameSelect.appendChild(option);
        });
      };

      const closeHostPeer = (viewerKey) => {
        const entry = state.host.peers[viewerKey];
        if (!entry) return;
        try {
          entry.pc.onicecandidate = null;
          entry.pc.ontrack = null;
          entry.pc.close();
        } catch (err) {
          // ignore
        }
        delete state.host.peers[viewerKey];
      };

      const stopWatching = () => {
        clearInterval(state.watch.signalTimer);
        clearInterval(state.watch.pingTimer);
        state.watch.signalTimer = 0;
        state.watch.pingTimer = 0;
        if (state.watch.pc) {
          try {
            state.watch.pc.onicecandidate = null;
            state.watch.pc.ontrack = null;
            state.watch.pc.close();
          } catch (err) {
            // ignore
          }
        }
        state.watch.pc = null;
        state.watch.streamId = '';
        state.watch.hostKey = '';
        state.watch.hostUsername = '';
        if (!state.host.localStream) {
          watchVideo.srcObject = null;
        }
      };

      const stopHosting = async (sendStop = true) => {
        clearInterval(state.host.pingTimer);
        clearInterval(state.host.signalTimer);
        state.host.pingTimer = 0;
        state.host.signalTimer = 0;
        Object.keys(state.host.peers).forEach((viewerKey) => closeHostPeer(viewerKey));
        if (state.host.localStream) {
          state.host.localStream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (err) {
              // ignore
            }
          });
        }
        const stoppedStreamId = state.host.streamId;
        state.host.localStream = null;
        state.host.streamId = '';
        if (sendStop && stoppedStreamId) {
          await this.callSocialApi('stop_stream', {
            streamId: stoppedStreamId,
            username: identity.username
          });
        }
        if (state.watch.streamId === stoppedStreamId || !state.watch.streamId) {
          watchVideo.srcObject = null;
          watchVideo.muted = true;
        }
      };

      const ensureWatchingStream = async (stream) => {
        if (!stream) return;
        if (state.watch.streamId === stream.id && state.watch.pc) return;
        stopWatching();

        state.selectedStreamId = stream.id;
        state.watch.streamId = stream.id;
        state.watch.hostKey = String(stream.hostKey || '');
        state.watch.hostUsername = String(stream.hostUsername || '');

        watchMeta.textContent = `${this.formatDisplayUsername(stream.hostUsername)} · ${stream.gameName || stream.gameId || 'Live'} · ${stream.viewerCount || 0} watching`;
        setChatStatus('Connecting to stream...', false);

        if (stream.hostKey === selfKey && state.host.localStream) {
          watchVideo.srcObject = state.host.localStream;
          watchVideo.muted = true;
          setChatStatus('This is your live preview.', false);
          return;
        }

        const pc = new RTCPeerConnection(rtcConfig);
        state.watch.pc = pc;

        pc.ontrack = (event) => {
          const mediaStream = event.streams?.[0] || null;
          if (mediaStream) {
            watchVideo.srcObject = mediaStream;
            watchVideo.muted = false;
          }
        };
        pc.onicecandidate = (event) => {
          if (!event.candidate) return;
          this.callSocialApi('viewer_ice', {
            streamId: stream.id,
            viewerUsername: identity.username,
            candidate: event.candidate
          });
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setChatStatus('Connected. Live chat is active.', false);
            return;
          }
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setChatStatus('Stream connection interrupted.', true);
          }
        };

        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
        } catch (err) {
          setChatStatus('Could not start viewer connection.', true);
          return;
        }

        const offerResult = await this.callSocialApi('viewer_offer', {
          streamId: stream.id,
          viewerUsername: identity.username,
          offer: pc.localDescription
        });
        if (!offerResult.ok) {
          setChatStatus(String(offerResult.data?.error || 'Could not send viewer offer.'), true);
          return;
        }

        state.watch.signalTimer = setInterval(async () => {
          if (!state.watch.streamId || state.watch.streamId !== stream.id || !state.watch.pc) return;
          const poll = await this.callSocialApi('viewer_signal_poll', {
            streamId: stream.id,
            viewerUsername: identity.username
          });
          if (!poll.ok) return;
          if (poll.data?.answer && !state.watch.pc.currentRemoteDescription) {
            try {
              await state.watch.pc.setRemoteDescription(new RTCSessionDescription(poll.data.answer));
            } catch (err) {
              // ignore bad remote description
            }
          }
          const candidates = Array.isArray(poll.data?.candidates) ? poll.data.candidates : [];
          for (const candidate of candidates) {
            try {
              await state.watch.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              // ignore bad candidate
            }
          }
        }, 1200);

        state.watch.pingTimer = setInterval(() => {
          if (!state.watch.streamId) return;
          this.callSocialApi('watch_ping', {
            streamId: state.watch.streamId,
            username: identity.username
          });
        }, 8000);

        this.callSocialApi('watch_ping', {
          streamId: stream.id,
          username: identity.username
        });
      };

      const renderStreamRows = () => {
        list.innerHTML = '';
        if (!state.streams.length) {
          list.innerHTML = '<div class=\"empty\">No one is live right now.</div>';
          return;
        }
        state.streams.forEach((stream) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'admin-player-row';
          row.style.cursor = 'pointer';
          if (state.selectedStreamId === stream.id) {
            row.style.borderColor = 'rgba(109, 213, 255, 0.55)';
            row.style.background = 'rgba(109, 213, 255, 0.12)';
          }
          row.innerHTML = `
            <div class=\"admin-player-name\">
              <span class=\"stream-title\">${this.formatDisplayUsername(stream.hostUsername)}</span>
            </div>
            <div class=\"admin-player-meta stream-meta\">
              ${stream.gameName || stream.gameId || 'Live'} · ${stream.viewerCount || 0} watching${stream.title ? ` · ${stream.title}` : ''}
            </div>
          `;
          row.addEventListener('click', () => {
            state.selectedStreamId = stream.id;
            ensureWatchingStream(stream);
            renderStreamRows();
            updateFollowButton();
            loadLiveChat();
          });
          list.appendChild(row);
        });
      };

      const updateFollowButton = () => {
        const stream = state.streamMap[state.selectedStreamId];
        if (!stream || !followBtn) {
          followBtn.disabled = true;
          followBtn.textContent = 'Follow Streamer';
          return;
        }
        if (stream.hostKey === selfKey) {
          followBtn.disabled = true;
          followBtn.textContent = 'You are the streamer';
          return;
        }
        followBtn.disabled = false;
        followBtn.textContent = state.following.has(stream.hostKey) ? 'Unfollow Streamer' : 'Follow Streamer';
      };

      const loadSnapshot = async (focusSelected = false) => {
        const result = await this.callSocialApi(
          'live_snapshot',
          { username: identity.username },
          'GET'
        );
        if (!result.ok) {
          setHostStatus(String(result.data?.error || 'Live service unavailable.'), true);
          return;
        }
        const streams = Array.isArray(result.data?.streams) ? result.data.streams : [];
        state.streams = streams;
        state.streamMap = {};
        streams.forEach((stream) => {
          state.streamMap[stream.id] = stream;
        });
        state.following = new Set(
          (Array.isArray(result.data?.following) ? result.data.following : [])
            .map((entry) => String(entry || '').trim().toLowerCase())
            .filter(Boolean)
        );
        if (followingNotice) {
          const followedLive = Array.isArray(result.data?.followedLive) ? result.data.followedLive : [];
          followingNotice.textContent = `Following ${state.following.size} streamer${
            state.following.size === 1 ? '' : 's'
          } · ${followedLive.length} live now`;
        }
        renderStreamRows();

        const currentHostStream = streams.find((stream) => stream.hostKey === selfKey);
        if (currentHostStream && state.host.streamId === currentHostStream.id) {
          setHostStatus(
            `You are LIVE on ${currentHostStream.gameName || currentHostStream.gameId || 'Live'} · ${currentHostStream.viewerCount || 0} watching`,
            false
          );
        }

        if (state.selectedStreamId) {
          const stillLive = state.streamMap[state.selectedStreamId];
          if (!stillLive) {
            stopWatching();
            state.selectedStreamId = '';
            watchMeta.textContent = 'Selected stream went offline.';
            setChatStatus('Stream is offline.', true);
            if (!state.host.localStream) watchVideo.srcObject = null;
          } else if (focusSelected) {
            ensureWatchingStream(stillLive);
          } else {
            watchMeta.textContent = `${this.formatDisplayUsername(stillLive.hostUsername)} · ${stillLive.gameName || stillLive.gameId || 'Live'} · ${stillLive.viewerCount || 0} watching`;
          }
        }
        updateFollowButton();
      };

      const startHostSignalLoop = () => {
        clearInterval(state.host.signalTimer);
        state.host.signalTimer = setInterval(async () => {
          if (!state.host.streamId || !state.host.localStream) return;
          const poll = await this.callSocialApi('host_signal_poll', {
            streamId: state.host.streamId,
            hostUsername: identity.username
          });
          if (!poll.ok) return;

          const offers = Array.isArray(poll.data?.offers) ? poll.data.offers : [];
          for (const offerRow of offers) {
            const viewerKey = String(offerRow?.viewerKey || '')
              .trim()
              .toLowerCase();
            const viewerUsername = String(offerRow?.viewerUsername || '').trim().slice(0, 18);
            const offer = offerRow?.offer;
            if (!viewerKey || !viewerUsername || !offer || state.host.peers[viewerKey]) continue;
            const pc = new RTCPeerConnection(rtcConfig);
            state.host.peers[viewerKey] = { pc, viewerUsername };
            state.host.localStream.getTracks().forEach((track) => {
              pc.addTrack(track, state.host.localStream);
            });
            pc.onicecandidate = (event) => {
              if (!event.candidate) return;
              this.callSocialApi('host_ice', {
                streamId: state.host.streamId,
                hostUsername: identity.username,
                viewerUsername,
                candidate: event.candidate
              });
            };
            pc.onconnectionstatechange = () => {
              if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
                closeHostPeer(viewerKey);
              }
            };
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await this.callSocialApi('host_answer', {
                streamId: state.host.streamId,
                hostUsername: identity.username,
                viewerUsername,
                answer: pc.localDescription
              });
            } catch (err) {
              closeHostPeer(viewerKey);
            }
          }

          const allCandidates = poll.data?.viewerCandidates && typeof poll.data.viewerCandidates === 'object'
            ? poll.data.viewerCandidates
            : {};
          for (const [viewerKeyRaw, listRaw] of Object.entries(allCandidates)) {
            const viewerKey = String(viewerKeyRaw || '')
              .trim()
              .toLowerCase();
            const entry = state.host.peers[viewerKey];
            if (!entry || !entry.pc) continue;
            const candidates = Array.isArray(listRaw) ? listRaw : [];
            for (const candidate of candidates) {
              try {
                await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                // ignore invalid candidate
              }
            }
          }
        }, 1200);
      };

      const startLive = async () => {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
          setHostStatus('Screen sharing is not supported in this browser.', true);
          return;
        }
        if (state.host.streamId) {
          setHostStatus('You are already live.', false);
          return;
        }
        const gameId = String(gameSelect.value || '').trim();
        const game = this.data.games.find((row) => row.id === gameId);
        if (!game) {
          setHostStatus('Pick a valid game first.', true);
          return;
        }
        stopWatching();
        setHostStatus('Requesting screen share...', false);
        let mediaStream = null;
        try {
          mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
        } catch (err) {
          setHostStatus('Screen share was cancelled.', true);
          return;
        }
        if (!mediaStream) {
          setHostStatus('Could not access your screen.', true);
          return;
        }

        const startRes = await this.callSocialApi('start_stream', {
          username: identity.username,
          userId: identity.userId,
          gameId: game.id,
          gameName: game.name,
          title: String(titleInput?.value || '').trim(),
          streamId: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        });
        if (!startRes.ok) {
          mediaStream.getTracks().forEach((track) => track.stop());
          setHostStatus(String(startRes.data?.error || 'Could not start stream.'), true);
          return;
        }

        const streamId = String(startRes.data?.stream?.id || '').trim();
        if (!streamId) {
          mediaStream.getTracks().forEach((track) => track.stop());
          setHostStatus('Live stream ID was not returned.', true);
          return;
        }
        state.host.streamId = streamId;
        state.host.localStream = mediaStream;
        watchVideo.srcObject = mediaStream;
        watchVideo.muted = true;
        state.selectedStreamId = streamId;
        state.watch.streamId = '';
        setHostStatus('You are LIVE now. Keep this tab open while streaming.', false);

        const firstVideoTrack = mediaStream.getVideoTracks()[0];
        if (firstVideoTrack) {
          firstVideoTrack.addEventListener(
            'ended',
            () => {
              if (!state.host.streamId) return;
              stopHosting(true).then(() => {
                setHostStatus('Live ended (screen share stopped).', false);
                loadSnapshot();
              });
            },
            { once: true }
          );
        }

        clearInterval(state.host.pingTimer);
        state.host.pingTimer = setInterval(() => {
          if (!state.host.streamId) return;
          this.callSocialApi('ping_stream', {
            streamId: state.host.streamId,
            username: identity.username
          });
        }, 7000);

        startHostSignalLoop();
        await loadSnapshot(true);
      };

      const loadLiveChat = async () => {
        const streamId = state.selectedStreamId;
        if (!streamId) {
          chatList.innerHTML = '';
          setChatStatus('Join a stream to chat.', false);
          return;
        }
        const res = await this.callSocialApi(
          'stream_chat_list',
          { streamId, limit: 80 },
          'GET'
        );
        if (!res.ok) {
          setChatStatus(String(res.data?.error || 'Could not load live chat.'), true);
          return;
        }
        const messages = Array.isArray(res.data?.messages) ? res.data.messages : [];
        chatList.innerHTML = '';
        if (!messages.length) {
          chatList.innerHTML = '<div class=\"empty\">No chat messages yet.</div>';
          setChatStatus('No messages yet.', false);
          return;
        }
        messages.forEach((msg) => {
          const row = document.createElement('div');
          row.className = 'chat-msg';
          const name = document.createElement('span');
          name.className = 'chat-author';
          const rawName = String(msg.from || 'Player').trim();
          const cleanName = this.formatDisplayUsername(rawName);
          const titleTag = String(msg.titleTag || '').trim();
          name.textContent = titleTag ? `[${titleTag}] ${cleanName}` : cleanName;
          this.applyChatNameStyle(name, rawName, String(msg.chatNameColor || '').trim());
          const text = document.createElement('span');
          text.className = 'chat-text';
          text.textContent = ` ${msg.text || ''}`;
          row.appendChild(name);
          row.appendChild(text);
          chatList.appendChild(row);
        });
        chatList.scrollTop = chatList.scrollHeight;
        setChatStatus(`Live chat active · ${Number(res.data?.viewerCount || 0)} watching`, false);
      };

      fillGameSelect();
      setHostStatus('Select a game and start screen share.', false);

      startBtn.addEventListener('click', () => {
        startLive();
      });
      stopBtn.addEventListener('click', async () => {
        if (!state.host.streamId) {
          setHostStatus('You are not live right now.', true);
          return;
        }
        await stopHosting(true);
        stopWatching();
        setHostStatus('Live stopped.', false);
        await loadSnapshot();
      });
      refreshBtn?.addEventListener('click', () => {
        loadSnapshot(true);
      });
      followBtn.addEventListener('click', async () => {
        const stream = state.streamMap[state.selectedStreamId];
        if (!stream) return;
        if (stream.hostKey === selfKey) return;
        const res = await this.callSocialApi('follow_toggle', {
          username: identity.username,
          targetUsername: stream.hostUsername
        });
        if (!res.ok) {
          this.showToast(String(res.data?.error || 'Could not update follow.'));
          return;
        }
        state.following = new Set(
          (Array.isArray(res.data?.following) ? res.data.following : [])
            .map((entry) => String(entry || '').trim().toLowerCase())
            .filter(Boolean)
        );
        updateFollowButton();
        const followingNow = Boolean(res.data?.followingState);
        this.showToast(followingNow ? `Following ${this.formatDisplayUsername(stream.hostUsername)}.` : `Unfollowed ${this.formatDisplayUsername(stream.hostUsername)}.`);
      });

      chatSendBtn?.addEventListener('click', async () => {
        const streamId = state.selectedStreamId;
        const text = String(chatInput?.value || '').trim();
        if (!streamId || !text) return;
        const send = await this.callSocialApi('stream_chat_send', {
          streamId,
          username: identity.username,
          userId: identity.userId,
          text,
          titleTag: identity.titleTag,
          chatNameColor: identity.chatNameColor
        });
        if (!send.ok) {
          setChatStatus(String(send.data?.error || 'Could not send message.'), true);
          return;
        }
        chatInput.value = '';
        loadLiveChat();
      });
      chatInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          chatSendBtn?.click();
        }
      });

      clearInterval(state.snapshotTimer);
      state.snapshotTimer = setInterval(() => {
        if (document.hidden) return;
        loadSnapshot(false);
      }, Math.max(2500, Number(this.data.social?.livePollMs) || 3500));

      clearInterval(state.chatTimer);
      state.chatTimer = setInterval(() => {
        if (document.hidden) return;
        if (!state.selectedStreamId) return;
        loadLiveChat();
      }, 2500);

      loadSnapshot(true);
      loadLiveChat();

      window.addEventListener(
        'beforeunload',
        () => {
          stopHosting(true);
          stopWatching();
          clearInterval(state.snapshotTimer);
          clearInterval(state.chatTimer);
        },
        { once: true }
      );
    },
    renderSocialChat() {
      const user = this.getCurrentUser();
      if (!user) {
        this.safeSet(this.storage.showAuth, true);
        window.location.href = 'index.html';
        return;
      }

      const dmTargetInput = document.getElementById('dmTargetInput');
      const openDmBtn = document.getElementById('openDmBtn');
      const dmStatus = document.getElementById('dmStatus');
      const dmThreadList = document.getElementById('dmThreadList');
      const groupNameInput = document.getElementById('groupNameInput');
      const groupMembersInput = document.getElementById('groupMembersInput');
      const createGroupBtn = document.getElementById('createGroupBtn');
      const groupStatus = document.getElementById('groupStatus');
      const groupList = document.getElementById('groupList');
      const conversationTitle = document.getElementById('chatConversationTitle');
      const messageList = document.getElementById('chatMessageList');
      const messageInput = document.getElementById('chatMessageInput');
      const sendBtn = document.getElementById('chatSendBtn');
      const chatStatus = document.getElementById('chatStatus');
      if (!dmTargetInput || !openDmBtn || !dmThreadList || !groupList || !messageList || !sendBtn) return;

      const identity = this.buildSocialIdentityPayload(user) || {
        username: user.username,
        userId: user.id,
        titleTag: '',
        chatNameColor: ''
      };
      const selfKey = String(identity.username || '').trim().toLowerCase();

      const state = {
        mode: 'dm',
        dmTarget: '',
        groupId: '',
        groups: [],
        threads: [],
        pollTimer: 0
      };

      const setDmStatus = (message, isError = false) => {
        if (!dmStatus) return;
        dmStatus.textContent = message || '';
        dmStatus.style.color = isError ? 'var(--warn)' : '';
      };
      const setGroupStatus = (message, isError = false) => {
        if (!groupStatus) return;
        groupStatus.textContent = message || '';
        groupStatus.style.color = isError ? 'var(--warn)' : '';
      };
      const setChatStatus = (message, isError = false) => {
        if (!chatStatus) return;
        chatStatus.textContent = message || '';
        chatStatus.style.color = isError ? 'var(--warn)' : '';
      };

      const renderMessages = (messages) => {
        messageList.innerHTML = '';
        if (!Array.isArray(messages) || !messages.length) {
          messageList.innerHTML = '<div class=\"empty\">No messages yet.</div>';
          return;
        }
        messages.forEach((msg) => {
          const row = document.createElement('div');
          row.className = 'chat-msg';
          const author = document.createElement('span');
          author.className = 'chat-author';
          const titleTag = String(msg.titleTag || '').trim();
          const rawName = String(msg.from || 'Player').trim();
          const nameText = this.formatDisplayUsername(rawName);
          author.textContent = titleTag ? `[${titleTag}] ${nameText}` : nameText;
          this.applyChatNameStyle(author, rawName, String(msg.chatNameColor || '').trim());
          const text = document.createElement('span');
          text.className = 'chat-text';
          text.textContent = ` ${msg.text || ''}`;
          row.appendChild(author);
          row.appendChild(text);
          messageList.appendChild(row);
        });
        messageList.scrollTop = messageList.scrollHeight;
      };

      const loadThreads = async () => {
        const res = await this.callSocialApi('dm_threads', { username: identity.username }, 'GET');
        if (!res.ok) return;
        state.threads = Array.isArray(res.data?.threads) ? res.data.threads : [];
        dmThreadList.innerHTML = '';
        if (!state.threads.length) {
          dmThreadList.innerHTML = '<div class=\"empty\">No private chats yet.</div>';
          return;
        }
        state.threads.forEach((thread) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'admin-player-row';
          row.style.cursor = 'pointer';
          const selected = state.mode === 'dm' && state.dmTarget && state.dmTarget.toLowerCase() === thread.withKey;
          if (selected) {
            row.style.borderColor = 'rgba(109, 213, 255, 0.55)';
            row.style.background = 'rgba(109, 213, 255, 0.12)';
          }
          row.innerHTML = `
            <div class=\"admin-player-name\">${this.formatDisplayUsername(thread.withUsername || thread.withKey)}</div>
            <div class=\"admin-player-meta\">${thread.lastText || ''}</div>
          `;
          row.addEventListener('click', () => {
            state.mode = 'dm';
            state.groupId = '';
            state.dmTarget = String(thread.withUsername || thread.withKey || '').trim();
            dmTargetInput.value = state.dmTarget;
            conversationTitle.textContent = `DM · ${this.formatDisplayUsername(state.dmTarget)}`;
            setDmStatus(`Opened DM with ${state.dmTarget}.`, false);
            setChatStatus('Private chat active.', false);
            loadConversation();
            loadThreads();
            loadGroups();
          });
          dmThreadList.appendChild(row);
        });
      };

      const loadGroups = async () => {
        const res = await this.callSocialApi('group_list', { username: identity.username }, 'GET');
        if (!res.ok) return;
        state.groups = Array.isArray(res.data?.groups) ? res.data.groups : [];
        groupList.innerHTML = '';
        if (!state.groups.length) {
          groupList.innerHTML = '<div class=\"empty\">No group chats yet.</div>';
          return;
        }
        state.groups.forEach((group) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'admin-player-row';
          row.style.cursor = 'pointer';
          if (state.mode === 'group' && state.groupId === group.id) {
            row.style.borderColor = 'rgba(109, 213, 255, 0.55)';
            row.style.background = 'rgba(109, 213, 255, 0.12)';
          }
          row.innerHTML = `
            <div class=\"admin-player-name\">${group.name}</div>
            <div class=\"admin-player-meta\">${group.memberCount || 0} members${group.lastText ? ` · ${group.lastText}` : ''}</div>
          `;
          row.addEventListener('click', () => {
            state.mode = 'group';
            state.groupId = group.id;
            state.dmTarget = '';
            conversationTitle.textContent = `Group · ${group.name}`;
            setGroupStatus(`Opened group ${group.name}.`, false);
            setChatStatus('Group chat active.', false);
            loadConversation();
            loadThreads();
            loadGroups();
          });
          groupList.appendChild(row);
        });
      };

      const loadConversation = async () => {
        if (state.mode === 'group' && state.groupId) {
          const res = await this.callSocialApi(
            'group_messages',
            { groupId: state.groupId, username: identity.username, limit: 120 },
            'GET'
          );
          if (!res.ok) {
            setChatStatus(String(res.data?.error || 'Could not load group messages.'), true);
            return;
          }
          const groupName = String(res.data?.group?.name || 'Group');
          conversationTitle.textContent = `Group · ${groupName}`;
          renderMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
          setChatStatus(`Group chat · ${groupName}`, false);
          return;
        }
        if (state.mode === 'dm' && state.dmTarget) {
          const res = await this.callSocialApi(
            'dm_list',
            { username: identity.username, withUsername: state.dmTarget, limit: 120 },
            'GET'
          );
          if (!res.ok) {
            setChatStatus(String(res.data?.error || 'Could not load DM.'), true);
            return;
          }
          conversationTitle.textContent = `DM · ${this.formatDisplayUsername(state.dmTarget)}`;
          renderMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
          setChatStatus('Private chat active.', false);
          return;
        }
        messageList.innerHTML = '<div class=\"empty\">Choose a DM or group to start chatting.</div>';
      };

      const openDm = () => {
        const target = String(dmTargetInput.value || '')
          .trim()
          .slice(0, 18);
        const targetKey = target.toLowerCase();
        if (!target) {
          setDmStatus('Enter a username.', true);
          return;
        }
        if (targetKey === selfKey) {
          setDmStatus('Use another username for DM.', true);
          return;
        }
        state.mode = 'dm';
        state.groupId = '';
        state.dmTarget = target;
        conversationTitle.textContent = `DM · ${this.formatDisplayUsername(target)}`;
        setDmStatus(`Opened DM with ${target}.`, false);
        loadConversation();
      };

      const sendMessage = async () => {
        const text = String(messageInput.value || '').trim();
        if (!text) return;
        if (state.mode === 'group' && state.groupId) {
          const res = await this.callSocialApi('group_send', {
            groupId: state.groupId,
            username: identity.username,
            userId: identity.userId,
            text,
            titleTag: identity.titleTag,
            chatNameColor: identity.chatNameColor
          });
          if (!res.ok) {
            setChatStatus(String(res.data?.error || 'Could not send group message.'), true);
            return;
          }
          messageInput.value = '';
          loadConversation();
          loadGroups();
          return;
        }
        if (state.mode === 'dm' && state.dmTarget) {
          const res = await this.callSocialApi('dm_send', {
            fromUsername: identity.username,
            fromUserId: identity.userId,
            toUsername: state.dmTarget,
            text,
            titleTag: identity.titleTag,
            chatNameColor: identity.chatNameColor
          });
          if (!res.ok) {
            setChatStatus(String(res.data?.error || 'Could not send DM.'), true);
            return;
          }
          messageInput.value = '';
          loadConversation();
          loadThreads();
          return;
        }
        setChatStatus('Choose a DM or group first.', true);
      };

      openDmBtn.addEventListener('click', openDm);
      dmTargetInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openDm();
        }
      });

      createGroupBtn?.addEventListener('click', async () => {
        const name = String(groupNameInput?.value || '').trim();
        const members = String(groupMembersInput?.value || '')
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
        if (!name) {
          setGroupStatus('Group name is required.', true);
          return;
        }
        const res = await this.callSocialApi('group_create', {
          ownerUsername: identity.username,
          name,
          members
        });
        if (!res.ok) {
          setGroupStatus(String(res.data?.error || 'Could not create group.'), true);
          return;
        }
        if (groupNameInput) groupNameInput.value = '';
        if (groupMembersInput) groupMembersInput.value = '';
        setGroupStatus(`Group "${name}" created.`, false);
        await loadGroups();
      });

      sendBtn.addEventListener('click', sendMessage);
      messageInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendMessage();
        }
      });

      clearInterval(state.pollTimer);
      state.pollTimer = setInterval(() => {
        if (document.hidden) return;
        loadThreads();
        loadGroups();
        loadConversation();
      }, Math.max(2000, Number(this.data.social?.chatPollMs) || 2500));

      loadThreads();
      loadGroups();
      loadConversation();
      setDmStatus('No DM selected.', false);
      setGroupStatus('Create or select a group.', false);
      setChatStatus('Choose a DM or group to start chatting.', false);

      window.addEventListener(
        'beforeunload',
        () => {
          clearInterval(state.pollTimer);
        },
        { once: true }
      );
    },
    renderLeaderboard() {
      const table = document.getElementById('leaderboardTable');
      const hint = document.getElementById('leaderboardHint');
      if (!table) return;
      const gradients = this.getTierGradients();
      const renderRows = (rows, emptyText) => {
        table.innerHTML = '';
        if (!rows.length) {
          table.innerHTML = `<tr><td colspan="3" class="empty">${emptyText}</td></tr>`;
          return;
        }
        rows.forEach((row, index) => {
          const tr = document.createElement('tr');
          const rank = document.createElement('td');
          const name = document.createElement('td');
          const pts = document.createElement('td');
          rank.textContent = `#${index + 1}`;
          const playerWrap = document.createElement('div');
          playerWrap.className = 'player-cell';
          const avatar = document.createElement('div');
          avatar.className = 'player-avatar';
          const avatarUrl = this.resolveAvatarUrl(row);
          if (avatarUrl) {
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.alt = row.username || 'Player';
            avatar.appendChild(img);
          } else {
            avatar.style.background = gradients[row.tier] || gradients.Bronze;
            avatar.textContent = (row.username || '?').slice(0, 1).toUpperCase();
          }
          const label = document.createElement('span');
          label.textContent = this.formatDisplayUsername(row.username || 'Player');
          const dot = document.createElement('span');
          dot.className = `online-dot ${row.online ? 'online' : 'offline'}`;
          dot.title = row.online ? 'Online' : 'Offline';
          playerWrap.appendChild(dot);
          playerWrap.appendChild(avatar);
          playerWrap.appendChild(label);
          name.appendChild(playerWrap);
          pts.textContent = `${row.points} pts`;
          tr.appendChild(rank);
          tr.appendChild(name);
          tr.appendChild(pts);
          table.appendChild(tr);
        });
      };

      const localRows = this.getUsers()
        .map((user) => {
          const points = this.computePoints(user);
          const tier = this.getTier(points);
          const avatar = this.getAvatarPayload(user);
          return {
            username: user.username,
            points,
            tier: tier.name,
            avatarUrl: avatar.avatarUrl,
            avatarPreset: avatar.avatarPreset,
            online: user.id === this.getCurrentUserId()
          };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 100);

      renderRows(localRows, 'No players yet.');
      if (hint) hint.textContent = 'Loading global leaderboard...';

      const loadGlobalRows = async () => {
        await this.syncCurrentUser(true);
        const rows = await this.fetchGlobalLeaderboard();
        if (rows) {
          const cleaned = rows.map((entry) => ({
            username: entry.username,
            points: entry.points,
            tier: entry.tier,
            avatarUrl: entry.avatarUrl,
            avatarPreset: entry.avatarPreset,
            online:
              Date.now() -
                (Number(entry.updatedAt || 0) ||
                  Date.parse(String(entry.updatedAt || '')) ||
                  0) <=
              90 * 1000
          }));
          renderRows(cleaned, 'No global players yet.');
          if (hint) {
            hint.textContent =
              'Global leaderboard across all devices (live via Supabase, refresh every 5s). Green dot = online, red dot = offline.';
          }
          return;
        }
        if (hint) {
          const detail = this.lastGlobalError ? ` (${this.lastGlobalError})` : '';
          hint.textContent = `Global leaderboard unavailable. Showing this-device leaderboard only${detail}.`;
        }
      };

      this.syncAllUsers(true);
      clearInterval(this.leaderboardPollTimer);
      loadGlobalRows();
      const pollMs = Math.max(3000, Number(this.data.globalLeaderboard.livePollMs) || 5000);
      this.leaderboardPollTimer = setInterval(loadGlobalRows, pollMs);
    }
  };

  window.LogiSchool = LogiSchool;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LogiSchool.init());
  } else {
    LogiSchool.init();
  }
})();
