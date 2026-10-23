// APP STATE
let currentUser = localStorage.getItem('fmic_user_name') || '';
let currentSource = 'youtube'; // 'youtube' or 'local'
let extractedClips = [];
let currentScanInterval = null;
let pendingMatches = [];

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  checkUserSession();
  loadSavedClips();
});

// USER SESSION MANAGEMENT
function checkUserSession() {
  if (!currentUser) {
    document.getElementById('userModal').classList.remove('hidden');
  } else {
    updateUserUI();
  }
}

function saveUserSession() {
  const input = document.getElementById('inputUserName').value.trim();
  if (input) {
    currentUser = input;
    localStorage.setItem('fmic_user_name', currentUser);
    document.getElementById('userModal').classList.add('hidden');
    updateUserUI();
  }
}

function promptUserChange() {
  document.getElementById('inputUserName').value = currentUser;
  document.getElementById('userModal').classList.remove('hidden');
}

function updateUserUI() {
  document.getElementById('headerUserName').textContent = currentUser;
  document.getElementById('welcomeGreeting').textContent = `Hello, ${currentUser}!`;
}

// TAB SWITCHING
function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-brand-600', 'text-white', 'shadow-lg');
    btn.classList.add('text-slate-400');
  });

  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.classList.add('bg-brand-600', 'text-white', 'shadow-lg');
    activeNav.classList.remove('text-slate-400');
  }
}

// SOURCE SELECTION LOGIC
function setSource(source) {
  currentSource = source;
  const ytCard = document.getElementById('btnSourceYouTube');
  const localCard = document.getElementById('btnSourceLocal');
  const ytGroup = document.getElementById('youtubeInputGroup');
  const localGroup = document.getElementById('localInputGroup');

  if (source === 'youtube') {
    ytCard.className = "source-card cursor-pointer border-2 border-brand-500 bg-brand-500/10 p-4 rounded-xl flex items-center justify-between transition";
    localCard.className = "source-card cursor-pointer border-2 border-slate-800 bg-dark-900/50 p-4 rounded-xl flex items-center justify-between transition";
    ytGroup.classList.remove('hidden');
    localGroup.classList.add('hidden');
  } else {
    localCard.className = "source-card cursor-pointer border-2 border-brand-500 bg-brand-500/10 p-4 rounded-xl flex items-center justify-between transition";
    ytCard.className = "source-card cursor-pointer border-2 border-slate-800 bg-dark-900/50 p-4 rounded-xl flex items-center justify-between transition";
    localGroup.classList.remove('hidden');
    ytGroup.classList.add('hidden');
  }
}

// MINISTRY RULE ENFORCEMENT
function handleCategoryChange() {
  const cat = document.getElementById('caseCategory').value;
  const notice = document.getElementById('prayerLineRuleNotice');

  if (cat === 'PrayerLine') {
    notice.classList.remove('hidden');
    setSource('local');
    document.getElementById('btnSourceYouTube').classList.add('opacity-40', 'pointer-events-none');
  } else {
    notice.classList.add('hidden');
    document.getElementById('btnSourceYouTube').classList.remove('opacity-40', 'pointer-events-none');
  }
}

// PHOTO PREVIEW
function handlePhotoPreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('photoPreview').src = event.target.result;
      document.getElementById('photoPreviewContainer').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// FAST SCAN ENGINE SIMULATION
function handleStartScan(e) {
  e.preventDefault();
  
  const memberName = document.getElementById('memberName').value.trim();
  const caseDesc = document.getElementById('caseDescription').value.trim();
  const category = document.getElementById('caseCategory').value;
  const hours = parseInt(document.getElementById('serviceDuration').value);

  if (!memberName || !caseDesc) return;

  const scanCard = document.getElementById('scanProgressCard');
  scanCard.classList.remove('hidden');
  document.getElementById('activeTaskIndicator').classList.remove('hidden');

  let progress = 0;
  let matchedCount = 0;
  clearInterval(currentScanInterval);

  currentScanInterval = setInterval(() => {
    progress += 5;
    document.getElementById('scanPercent').textContent = `${progress}%`;
    document.getElementById('scanProgressBar').style.width = `${progress}%`;

    const currentTotalSecs = (hours * 3600) * (progress / 100);
    const hrs = Math.floor(currentTotalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((currentTotalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(currentTotalSecs % 60).toString().padStart(2, '0');
    document.getElementById('statTimeProcessed').textContent = `${hrs}:${mins}:${secs} / ${hours.toString().padStart(2, '0')}:00:00`;

    if (progress === 40 || progress === 80) {
      matchedCount++;
      document.getElementById('statMatches').textContent = `${matchedCount} Candidate(s)`;
    }

    if (progress >= 100) {
      clearInterval(currentScanInterval);
      document.getElementById('activeTaskIndicator').classList.add('hidden');
      
      pendingMatches = [
        {
          id: Date.now(),
          memberName: memberName,
          caseDesc: caseDesc,
          category: category,
          timestamp: "03:14:20",
          preRollTimestamp: "03:14:05",
          formattedFileName: `${cleanString(memberName)}_${cleanString(caseDesc)}_03h14m05s.mp4`,
          source: currentSource
        }
      ];

      openVerificationModal(pendingMatches[0]);
    }
  }, 300);
}

function cleanString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
}

function openVerificationModal(match) {
  document.getElementById('modalCandidateTitle').textContent = `${match.memberName} - Ministration Candidate`;
  document.getElementById('modalCandidateDetails').textContent = `Raw Timestamp: ${match.timestamp} | Clipping Start: ${match.preRollTimestamp} (-15s pre-roll buffer applied)`;
  document.getElementById('modalMemberName').textContent = match.memberName;
  document.getElementById('modalCaseDesc').textContent = match.caseDesc;
  document.getElementById('clipVerificationModal').classList.remove('hidden');
}

function closeVerificationModal() {
  document.getElementById('clipVerificationModal').classList.add('hidden');
}

function confirmCandidateMatch() {
  if (pendingMatches.length > 0) {
    const item = pendingMatches.shift();
    extractedClips.unshift(item);
    saveClipsToStorage();
    renderClipsGrid();
    openTab('archive');
  }
  closeVerificationModal();
}

function skipCandidateMatch() {
  pendingMatches.shift();
  closeVerificationModal();
}

function renderClipsGrid() {
  const container = document.getElementById('clipsGrid');
  const emptyState = document.getElementById('emptyQueueState');
  const badge = document.getElementById('queueBadge');

  badge.textContent = extractedClips.length;

  if (extractedClips.length === 0) {
    emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = extractedClips.map(clip => `
    <div class="bg-dark-800 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg hover:border-brand-500/40 transition">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-500 border border-brand-500/30">
          ${clip.category}
        </span>
        <span class="text-xs text-slate-400 font-mono">${clip.preRollTimestamp}</span>
      </div>

      <div>
        <h4 class="text-sm font-bold text-white">${clip.memberName}</h4>
        <p class="text-xs text-slate-400 line-clamp-2 mt-0.5">${clip.caseDesc}</p>
      </div>

      <div class="p-2 bg-dark-900 rounded-lg border border-slate-800 font-mono text-[11px] text-gold-400 truncate">
        📁 ${clip.formattedFileName}
      </div>

      <div class="flex items-center justify-between pt-2">
        <span class="text-[10px] text-slate-500">Source: ${clip.source.toUpperCase()}</span>
        <button onclick="downloadClip('${clip.formattedFileName}')" class="bg-brand-600 hover:bg-brand-500 text-white text-xs px-3 py-1.5 rounded-lg transition font-semibold flex items-center space-x-1">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Export Clip</span>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

function saveClipsToStorage() {
  localStorage.setItem('fmic_extracted_clips', JSON.stringify(extractedClips));
}

function loadSavedClips() {
  const saved = localStorage.getItem('fmic_extracted_clips');
  if (saved) {
    extractedClips = JSON.parse(saved);
    renderClipsGrid();
  }
}

function clearClipQueue() {
  extractedClips = [];
  saveClipsToStorage();
  renderClipsGrid();
}

function downloadClip(filename) {
  alert(`Exporting clean testimony clip:\n\n${filename}\n\nFile downloaded with 15-second pre-roll context!`);
}
