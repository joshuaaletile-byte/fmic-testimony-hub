document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('part2-container');
  if (container) {
    container.innerHTML = `
      <!-- TAB 2: FOUND CLIPS QUEUE -->
      <section id="tab-archive" class="tab-content hidden space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-white">Extracted Testimony Clips</h3>
            <p class="text-xs text-slate-400">Ready for review, pre-roll editing, and renaming</p>
          </div>
          <button onclick="clearClipQueue()" class="text-xs text-slate-400 hover:text-red-400 transition flex items-center space-x-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Clear Completed Queue</span>
          </button>
        </div>

        <div id="emptyQueueState" class="bg-dark-800/40 border border-slate-800 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <i data-lucide="film" class="w-8 h-8"></i>
          </div>
          <h4 class="text-base font-semibold text-slate-300">No Matched Clips Yet</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Start an AI scan from the "Scan & Extract" tab.
          </p>
        </div>

        <div id="clipsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>

      <!-- TAB 3: MINISTRY RULES -->
      <section id="tab-rules" class="tab-content hidden space-y-6">
        <div class="bg-dark-800 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i data-lucide="shield-check" class="w-5 h-5 text-brand-500"></i>
            FMIC Media Production & Privacy Guidelines
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Standard operating procedures for editing and handling deliverance testimony video clips.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="p-4 bg-dark-900 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center space-x-2 text-brand-500 font-semibold text-sm">
                <i data-lucide="file-video" class="w-4 h-4"></i>
                <h4>Prayer Line Files Restriction</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Prayer line cases must strictly be searched on raw local service recordings saved on church laptops.
              </p>
            </div>

            <div class="p-4 bg-dark-900 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center space-x-2 text-gold-400 font-semibold text-sm">
                <i data-lucide="clock" class="w-4 h-4"></i>
                <h4>Automatic 15-Second Pre-Roll</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Every identified timestamp automatically includes a 15-second padding prior to ministration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 4: DEPLOYMENT GUIDE -->
      <section id="tab-deployment" class="tab-content hidden space-y-6">
        <div class="bg-dark-800 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i data-lucide="cloud-upload" class="w-5 h-5 text-brand-500"></i>
            Deploy Free to Vercel & GitHub Guide
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Follow these simple steps to host this web application online for free without any payments.
          </p>
        </div>
      </section>

      <!-- ONBOARDING MODAL -->
      <div id="userModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-dark-800 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <div class="flex items-center space-x-3">
            <div class="p-3 bg-brand-500/20 text-brand-500 rounded-xl">
              <i data-lucide="user-check" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Welcome to FMIC Media Hub</h3>
              <p class="text-xs text-slate-400">Please enter your editor name to personalize your session</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Admin / Editor Name</label>
            <input type="text" id="inputUserName" placeholder="e.g. Yinka, Samuel, Grace..." class="w-full bg-dark-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500 transition" />
          </div>

          <button onclick="saveUserSession()" class="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl transition">
            Continue to Workspace
          </button>
        </div>
      </div>

      <!-- VERIFICATION MODAL -->
      <div id="clipVerificationModal" class="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-dark-800 border border-slate-700 p-6 rounded-2xl max-w-2xl w-full shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <span class="bg-gold-500/20 text-gold-400 text-xs font-bold px-2 py-0.5 rounded">VERIFY CANDIDATE</span>
              <h3 class="text-sm font-bold text-white">Confirm Member Ministration Match</h3>
            </div>
            <button onclick="closeVerificationModal()" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="relative bg-black rounded-xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center">
            <div id="simulatedVideoScreen" class="text-center p-6 space-y-3">
              <div class="w-12 h-12 bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <i data-lucide="play-circle" class="w-8 h-8"></i>
              </div>
              <div class="space-y-1">
                <h4 id="modalCandidateTitle" class="text-base font-bold text-white">Candidate Match Clip</h4>
                <p id="modalCandidateDetails" class="text-xs text-slate-400">Timestamp: 03:42:15 (-15s pre-roll buffer applied)</p>
              </div>
            </div>
          </div>

          <div class="bg-dark-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <p class="text-slate-300"><strong>Member:</strong> <span id="modalMemberName" class="text-gold-400"></span></p>
            <p class="text-slate-300"><strong>Prophecy / Prayer Line Case:</strong> <span id="modalCaseDesc" class="text-slate-400"></span></p>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button onclick="skipCandidateMatch()" class="w-full sm:w-auto px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl text-xs font-medium transition">
              Skip Match
            </button>
            <button onclick="confirmCandidateMatch()" class="w-full sm:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-500/20">
              Confirm & Save Clean Clip
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) {
      lucide.createIcons();
    }
  }
});
