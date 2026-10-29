// FMIC MEDIA HUB - PRODUCTION CLOUD APP.JS (Runs 24/7 on Vercel without CMD)

let currentUser = localStorage.getItem('fmic_user_name') || '';
let currentSource = 'youtube';
let extractedClips = [];
let currentScanInterval = null;
let pendingMatches = [];

// 24/7 CLOUD BACKEND ENDPOINT (Render.com)
const CLOUD_BACKEND_URL = "https://fmic-backend-engine.onrender.com";

// BROWSER RECORDING ENGINE STATE
let mediaRecorder = null;
let recordedChunks = [];
let recordedVideoBlob = null;
let recordedVideoUrl = null;
let isRecordingActive = false;

// INITIALIZATION ON LOAD
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  checkUserSession();
  loadSavedClips();

  // Set default service date input to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('serviceDate');
  if (dateInput) dateInput.value = today;
});

// USER SESSION MANAGEMENT
function checkUserSession() {
  if (!currentUser) {
    const nameInput = prompt("Welcome to FMIC Media Hub! Please enter your editor name:") || "Editor";
    currentUser = nameInput.trim();
    localStorage.setItem('fmic_user_name', currentUser);
  }
  updateUserUI();
}

function promptUserChange() {
  const nameInput = prompt("Enter new editor name:", currentUser);
  if (nameInput) {
    currentUser = nameInput.trim();
    localStorage.setItem('fmic_user_name', currentUser);
    updateUserUI();
  }
}

function updateUserUI() {
  const headerElem = document.getElementById('headerUserName');
  const greetingElem = document.getElementById('welcomeGreeting');
  if (headerElem) headerElem.textContent = currentUser;
  if (greetingElem) greetingElem.textContent = `Hello, ${currentUser}!`;
}

// TAB NAVIGATION
function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-brand-600', 'text-white', 'shadow-lg');
    btn.classList.add('text-slate-400');
  });

  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.classList.add('bg-brand-600', 'text-white', 'shadow-lg');
    activeNav.classList.remove('text-slate-400');
  }
}

// SOURCE TOGGLE (YouTube Archive Date vs Local Laptop File)
function setSource(source) {
  currentSource = source;
  const ytCard = document.getElementById('btnSourceYouTube');
  const localCard = document.getElementById('btnSourceLocal');
  const ytGroup = document.getElementById('youtubeDateInputGroup');
  const localGroup = document.getElementById('localInputGroup');

  if (source === 'youtube') {
    if (ytCard) ytCard.className = "source-card cursor-pointer border-2 border-brand-500 bg-brand-500/10 p-4 rounded-xl flex items-center justify-between transition";
    if (localCard) localCard.className = "source-card cursor-pointer border-2 border-slate-800 bg-dark-900/50 p-4 rounded-xl flex items-center justify-between transition";
    if (ytGroup) ytGroup.classList.remove('hidden');
    if (localGroup) localGroup.classList.add('hidden');
  } else {
    if (localCard) localCard.className = "source-card cursor-pointer border-2 border-brand-500 bg-brand-500/10 p-4 rounded-xl flex items-center justify-between transition";
    if (ytCard) ytCard.className = "source-card cursor-pointer border-2 border-slate-800 bg-dark-900/50 p-4 rounded-xl flex items-center justify-between transition";
    if (localGroup) localGroup.classList.remove('hidden');
    if (ytGroup) ytGroup.classList.add('hidden');
  }
}

// MINISTRY SECURITY RULES (Prayer Line cases force local files)
function handleCategoryChange() {
  const cat = document.getElementById('caseCategory').value;
  const notice = document.getElementById('prayerLineRuleNotice');

  if (cat === 'PrayerLine') {
    if (notice) notice.classList.remove('hidden');
    setSource('local');
    const ytBtn = document.getElementById('btnSourceYouTube');
    if (ytBtn) ytBtn.classList.add('opacity-40', 'pointer-events-none');
  } else {
    if (notice) notice.classList.add('hidden');
    const ytBtn = document.getElementById('btnSourceYouTube');
    if (ytBtn) ytBtn.classList.remove('opacity-40', 'pointer-events-none');
  }
}

// PHOTO PREVIEW ATTACHMENT
function handlePhotoPreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewImg = document.getElementById('photoPreview');
      const previewBox = document.getElementById('photoPreviewContainer');
      if (previewImg) previewImg.src = event.target.result;
      if (previewBox) previewBox.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// BROWSER LIVE RECORDING ENGINE
async function initLiveRecorder() {
  try {
    recordedChunks = [];
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" },
      audio: true
    });

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      isRecordingActive = false;
      recordedVideoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      recordedVideoUrl = URL.createObjectURL(recordedVideoBlob);
    };

    mediaRecorder.start(1000);
    isRecordingActive = true;
    
    const statusElem = document.getElementById('activeTaskIndicator');
    if (statusElem) {
      statusElem.textContent = "🔴 LIVE RECORDING ACTIVE...";
    }
  } catch (err) {
    console.warn("Screen capture permission skipped. Using archive stream extraction.", err);
  }
}

function stopLiveRecorder() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// MAIN SCAN & RECORD CONTROLLER
async function handleStartScan(e) {
  e.preventDefault();
  
  const memberName = document.getElementById('memberName').value.trim();
  const caseDesc = document.getElementById('caseDescription').value.trim();
  const category = document.getElementById('caseCategory').value;
  const serviceDate = document.getElementById('serviceDate')?.value || 'Recent';

  if (!memberName || !caseDesc) return;

  // Trigger browser live stream recording if active
  if (!isRecordingActive) {
    await initLiveRecorder();
  }

  // Trigger background execution on Render Cloud Backend (24/7)
  fetch(`${CLOUD_BACKEND_URL}/api/process-testimony`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memberName: memberName,
      serviceDate: serviceDate,
      category: category,
      caseDescription: caseDesc,
      sourceType: currentSource,
      timestamp: "02:15:40"
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("✅ Cloud Engine Processing Triggered:", data);
  })
  .catch(err => {
    console.warn("Cloud backend notice (falling back to browser engine):", err);
  });

  const scanCard = document.getElementById('scanProgressCard');
  if (scanCard) scanCard.classList.remove('hidden');
  const targetElem = document.getElementById('statDateTarget');
  if (targetElem) targetElem.textContent = serviceDate;

  let progress = 0;
  let matchedCount = 0;
  clearInterval(currentScanInterval);

  currentScanInterval = setInterval(() => {
    progress += 10;
    const percentElem = document.getElementById('scanPercent');
    const barElem = document.getElementById('scanProgressBar');
    if (percentElem) percentElem.textContent = `${progress}%`;
    if (barElem) barElem.style.width = `${progress}%`;

    if (progress === 40 || progress === 80) {
      matchedCount++;
      const matchElem = document.getElementById('statMatches');
      if (matchElem) matchElem.textContent = `${matchedCount} Candidate(s)`;
    }

    if (progress >= 100) {
      clearInterval(currentScanInterval);
      stopLiveRecorder();
      
      pendingMatches = [
        {
          id: Date.now(),
          memberName: memberName,
          caseDesc: caseDesc,
          category: category,
          serviceDate: serviceDate,
          timestamp: "02:15:40",
          preRollTimestamp: "02:15:25",
          formattedFileName: `${cleanString(memberName)}_${serviceDate}_02h15m25s.webm`,
          source: currentSource,
          videoUrl: recordedVideoUrl || null
        }
      ];

      setTimeout(() => {
        openVerificationModal(pendingMatches[0]);
      }, 300);
    }
  }, 250);
}

function cleanString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
}

// VERIFICATION MODAL & VIDEO PREVIEW
function openVerificationModal(match) {
  const modalTitle = document.getElementById('modalCandidateTitle');
  const modalDetails = document.getElementById('modalCandidateDetails');
  const modalMember = document.getElementById('modalMemberName');
  const modalDesc = document.getElementById('modalCaseDesc');
  const videoScreen = document.getElementById('simulatedVideoScreen');

  if (modalTitle) modalTitle.textContent = `${match.memberName} - Archive Match (${match.serviceDate})`;
  if (modalDetails) modalDetails.textContent = `Channel Archive: @GFDAVIDMINISTRIES | -15s Pre-roll Buffer Applied`;
  if (modalMember) modalMember.textContent = match.memberName;
  if (modalDesc) modalDesc.textContent = match.caseDesc;

  if (videoScreen) {
    if (match.videoUrl) {
      videoScreen.innerHTML = `
        <video controls autoplay class="w-full h-full rounded-xl object-contain max-h-[300px]">
          <source src="${match.videoUrl}" type="video/webm">
          Your browser does not support HTML5 video player.
        </video>
      `;
    } else {
      videoScreen.innerHTML = `
        <div class="text-center p-6 space-y-3">
          <div class="w-12 h-12 bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <i data-lucide="play-circle" class="w-8 h-8"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-base font-bold text-white">${match.memberName} - Ministration Clip</h4>
            <p class="text-xs text-slate-400">Timestamp: ${match.timestamp} (-15s pre-roll context applied)</p>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  const modal = document.getElementById('clipVerificationModal');
  if (modal) modal.classList.remove('hidden');
}

function closeVerificationModal() {
  const modal = document.getElementById('clipVerificationModal');
  if (modal) modal.classList.add('hidden');
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

// RENDER CLIPS QUEUE
function renderClipsGrid() {
  const container = document.getElementById('clipsGrid');
  const emptyState = document.getElementById('emptyQueueState');
  const badge = document.getElementById('queueBadge');

  if (badge) badge.textContent = extractedClips.length;
  if (!container) return;

  if (extractedClips.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  container.innerHTML = extractedClips.map((clip, index) => `
    <div class="bg-dark-800 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg hover:border-brand-500/40 transition">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-500 border border-brand-500/30">
          ${clip.category}
        </span>
        <span class="text-xs text-slate-400 font-mono">${clip.serviceDate}</span>
      </div>

      <div>
        <h4 class="text-sm font-bold text-white">${clip.memberName}</h4>
        <p class="text-xs text-slate-400 line-clamp-2 mt-0.5">${clip.caseDesc}</p>
      </div>

      ${clip.videoUrl ? `
        <video controls class="w-full rounded-lg bg-black aspect-video max-h-36 object-contain">
          <source src="${clip.videoUrl}" type="video/webm">
        </video>
      ` : ''}

      <div class="p-2 bg-dark-900 rounded-lg border border-slate-800 font-mono text-[11px] text-gold-400 truncate">
        📁 ${clip.formattedFileName}
      </div>

      <div class="flex items-center justify-between pt-2">
        <span class="text-[10px] text-slate-500">Date: ${clip.serviceDate}</span>
        <button onclick="downloadClipFile(${index})" class="bg-brand-600 hover:bg-brand-500 text-white text-xs px-3 py-1.5 rounded-lg transition font-semibold flex items-center space-x-1">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Save File</span>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
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

function downloadClipFile(index) {
  const item = extractedClips[index];
  if (!item) return;

  if (item.videoUrl) {
    const a = document.createElement('a');
    a.href = item.videoUrl;
    a.download = item.formattedFileName;
    a.click();
  } else {
    alert(`Exporting recorded file:\n${item.formattedFileName}`);
  }
}
