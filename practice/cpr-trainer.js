/* ==========================================================================
   CPR TRAINER LOGIC - SEPARATE COMPONENT (110 BPM, 30:2 CYCLE)
   ========================================================================== */

let audioCtx = null;
let metronomeTimer = null;
let breathTimerInterval = null;

// Trainer States
let state = 'idle'; // 'idle', 'compressing', 'breathing'
let compressions = 0;
let cycles = 0;

// Metronome Timing
const BPM = 110;
const beatInterval = (60 / BPM) * 1000; // ~545.45 ms
let lastBeatTimestamp = 0;

// Sync / Accuracy metrics
let userTapsCount = 0;
let matchedTapsCount = 0;

// DOM Elements
const statusBadge = document.getElementById('trainer-status');
const compressionDisplay = document.getElementById('compression-count');
const cycleDisplay = document.getElementById('cycle-count');
const tapBtn = document.getElementById('tap-btn');
const pulseRing = document.getElementById('pulse-ring');
const actionPrompt = document.getElementById('action-prompt');
const breathOverlay = document.getElementById('breath-overlay');
const breathTimerDisplay = document.getElementById('breath-timer');
const accuracyDisplay = document.getElementById('sync-accuracy');
const instructionBox = document.getElementById('instruction-text');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

/* ==========================================================================
   INITIALIZE & WEBAUDIO SETUP
   ========================================================================== */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Woodblock metronome sound synthesis
function playClickSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

// Respiration Alert Sound (gentle, airy bell)
function playRespirationAlert() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5 note

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

/* ==========================================================================
   TRAINER CYCLES & TIMER CONTROLLERS
   ========================================================================== */
function startCompressingPhase() {
  state = 'compressing';
  statusBadge.textContent = "ĐANG ÉP TIM";
  statusBadge.className = "status-badge compressing";
  actionPrompt.textContent = "NHẤN KHỚP NHỊP!";
  instructionBox.textContent = "Hãy nhìn vòng tròn phát sáng và nghe tiếng gõ nhịp. Dùng ngón tay chạm vào nút giả lập để ép tim đúng tần số 110 lần/phút.";
  instructionBox.className = "instruction-box red-border";
  tapBtn.disabled = false;
  
  // Play first beat immediately
  triggerBeat();

  // Set metronome interval
  metronomeTimer = setInterval(triggerBeat, beatInterval);
}

function triggerBeat() {
  playClickSound();
  lastBeatTimestamp = Date.now();
  
  // Pulse animation on the button
  pulseRing.classList.remove('pulse-anim');
  void pulseRing.offsetWidth; // force reflow
  pulseRing.classList.add('pulse-anim');
  
  compressions++;
  compressionDisplay.textContent = `${compressions} / 30`;

  // Scale down chest button slightly to simulate ribcage recoil
  tapBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    tapBtn.style.transform = 'scale(1)';
  }, 100);

  // Transition to breathing after 30 compressions
  if (compressions >= 30) {
    stopCompressingPhase();
    startBreathingPhase();
  }
}

function stopCompressingPhase() {
  if (metronomeTimer) {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
  }
}

function startBreathingPhase() {
  state = 'breathing';
  statusBadge.textContent = "HÀ HƠI THỔI NGẠT";
  statusBadge.className = "status-badge breathing";
  actionPrompt.textContent = "DỪNG ÉP TIM";
  instructionBox.textContent = "NGỪNG ÉP TIM LẬP TỨC! Thực hiện Hà hơi thổi ngạt 2 LẦN: ngửa đầu nạn nhân ra sau, bịt mũi và thổi mạnh hơi đầy phổi.";
  instructionBox.className = "instruction-box";
  
  // Enable blow animation / display overlay
  breathOverlay.classList.add('active');
  
  let breathsCountdown = 5; // 5 seconds to perform 2 breaths
  breathTimerDisplay.textContent = breathsCountdown;
  
  playRespirationAlert();

  breathTimerInterval = setInterval(() => {
    breathsCountdown--;
    breathTimerDisplay.textContent = breathsCountdown;
    
    // Play sound alert for second breath at 2 seconds left
    if (breathsCountdown === 2) {
      playRespirationAlert();
    }

    if (breathsCountdown <= 0) {
      // End breathing phase
      clearInterval(breathTimerInterval);
      breathTimerInterval = null;
      
      breathOverlay.classList.remove('active');
      cycles++;
      cycleDisplay.textContent = cycles;
      
      // Reset compressions for next cycle
      compressions = 0;
      compressionDisplay.textContent = `0 / 30`;

      // Start compression phase again
      startCompressingPhase();
    }
  }, 1000);
}

function stopBreathingPhase() {
  if (breathTimerInterval) {
    clearInterval(breathTimerInterval);
    breathTimerInterval = null;
  }
  breathOverlay.classList.remove('active');
}

/* ==========================================================================
   USER INTERACTION LOGIC
   ========================================================================== */
function handleTapClick() {
  if (state !== 'compressing') return;

  const tapTime = Date.now();
  userTapsCount++;

  // Measure time difference to the closest metronome beat
  const diff = Math.abs(tapTime - lastBeatTimestamp);
  
  // If tap is within 150ms of the beat, it is considered synced (correct rhythm)
  if (diff <= 150) {
    matchedTapsCount++;
    instructionBox.textContent = "✓ Hoàn hảo! Bạn đang nhấn rất chuẩn nhịp.";
    instructionBox.style.borderLeftColor = "var(--primary-color)";
  } else {
    instructionBox.textContent = "✕ Sai nhịp! Hãy lắng nghe tiếng gõ nhịp và nhấn khớp theo.";
    instructionBox.style.borderLeftColor = "var(--accent-red)";
  }

  // Update Sync Accuracy Display
  const accPercent = Math.round((matchedTapsCount / userTapsCount) * 100);
  accuracyDisplay.textContent = `${accPercent}%`;
}

function handleStartPauseToggle() {
  initAudio();

  if (state === 'idle') {
    // Start Practice
    startBtn.textContent = "Tạm dừng";
    startBtn.className = "btn btn-primary active";
    startCompressingPhase();
  } else {
    // Pause Practice
    pauseTrainer();
  }
}

function pauseTrainer() {
  state = 'idle';
  statusBadge.textContent = "TẠM DỪNG";
  statusBadge.className = "status-badge idle";
  actionPrompt.textContent = "BẮT ĐẦU TẬP";
  
  startBtn.textContent = "Bắt đầu tập";
  startBtn.className = "btn btn-primary";
  tapBtn.disabled = true;

  stopCompressingPhase();
  stopBreathingPhase();
}

function resetTrainer() {
  pauseTrainer();
  
  compressions = 0;
  cycles = 0;
  userTapsCount = 0;
  matchedTapsCount = 0;

  compressionDisplay.textContent = "0 / 30";
  cycleDisplay.textContent = "0";
  accuracyDisplay.textContent = "--%";
  
  statusBadge.textContent = "CHỜ BẮT ĐẦU";
  statusBadge.className = "status-badge idle";
  actionPrompt.textContent = "BẤM BẮT ĐẦU";
  instructionBox.textContent = "Nhấn nút Bắt đầu để tập luyện. Nghe nhịp gõ gỗ để nhấn chìm ngực giả lập theo đúng nhịp độ.";
  instructionBox.className = "instruction-box";
}

// Event Listeners
startBtn.addEventListener('click', handleStartPauseToggle);
resetBtn.addEventListener('click', resetTrainer);
tapBtn.addEventListener('click', handleTapClick);
