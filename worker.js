// worker.js

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ==========================================
    // 1. 后端核心：下载测速接口 (逻辑保持不变)
    // ==========================================
    if (url.pathname === '/speed/down') {
      let fileSizeMB = 100; // 默认 100MB
      const mbParam = url.searchParams.get('mb');

      if (mbParam !== null) {
        const val = parseFloat(mbParam);
        // 校验逻辑：0 <= val <= 1024
        if (isNaN(val) || val < 0 || val > 1024) {
          return new Response("404 Not Found: Size must be between 0 and 1024 MB", { status: 404 });
        }
        fileSizeMB = val;
      }

      const fileSize = Math.floor(fileSizeMB * 1024 * 1024);
      
      const stream = new ReadableStream({
        start(controller) {
          const chunkSize = 64 * 1024; 
          let sent = 0;
          function push() {
            if (sent >= fileSize) {
              controller.close();
              return;
            }
            const chunkBytes = Math.min(chunkSize, fileSize - sent);
            const buffer = new Uint8Array(chunkBytes); 
            controller.enqueue(buffer);
            sent += chunkBytes;
            if (controller.desiredSize > 0) push();
            else setTimeout(push, 0);
          }
          push();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="testfile-${fileSizeMB}MB.bin"`,
          "Access-Control-Allow-Origin": "*", 
        }
      });
    }

    // ==========================================
    // 2. 前端界面：多语言适配版
    // ==========================================
    if (url.pathname === '/speed') {
      return new Response(htmlUI(url.origin), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};

// ==========================================
// HTML 模板
// ==========================================
function htmlUI(origin) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asonlino Speed</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 24px; width: 24px;
      border-radius: 50%; 
      background: #ffffff;
      border: 2px solid #6366f1; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer; margin-top: -10px;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%; height: 6px;
      background: #e0e7ff; border-radius: 3px;
    }
    
    .glass-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.5);
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
    }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="bg-[#f3f4f6] text-slate-700 min-h-screen flex flex-col items-center justify-center p-4">

  <div class="w-full max-w-[420px] fade-in relative">
    
    <div class="mb-6 flex items-center justify-between px-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight">Asonlino Speed</h1>
          <p class="text-xs text-slate-400 font-medium" data-i18n="subtitle">Network Latency & Bandwidth</p>
        </div>
      </div>
    </div>

    <div class="glass-panel rounded-3xl p-6 relative overflow-hidden">
      
      <div class="absolute top-0 left-0 bg-indigo-50 px-4 py-1.5 rounded-br-2xl border-b border-r border-indigo-100">
        <span class="text-xs font-bold text-indigo-600 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <span data-i18n="badge_panel">网络面板</span>
        </span>
      </div>

      <div class="absolute top-4 right-4 z-10">
        <button onclick="toggleLanguage()" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
      </div>

      <div class="mt-8"></div>

      <div class="mb-5">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1" data-i18n="label_node">测速节点</label>
        <div class="relative">
            <select id="source-select" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3.5 appearance-none font-medium">
              <option value="${origin}/speed/down?mb=100" data-i18n="opt_100">默认节点 (100MB)</option>
              <option value="${origin}/speed/down?mb=200" data-i18n="opt_200">默认节点 (200MB)</option>
              <option value="${origin}/speed/down?mb=500" data-i18n="opt_500">默认节点 (500MB)</option>
              <option value="${origin}/speed/down?mb=1024" data-i18n="opt_1024">默认节点 (1GB)</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
      </div>

      <div class="mb-8">
        <div class="flex justify-between items-center mb-3 pl-1 pr-1">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider" data-i18n="label_threads">并发线程</label>
          <span id="concurrency-val" class="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">8</span>
        </div>
        <input type="range" id="concurrency-slider" min="1" max="32" value="8" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer">
      </div>

      <div class="space-y-3 mb-8">
        <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5" data-i18n="label_total">总流量</div>
            <div id="total-downloaded" class="text-lg font-bold text-slate-800">-</div>
          </div>
          <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
          </div>
        </div>

        <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5" data-i18n="label_speed">实时速度</div>
            <div id="realtime-speed" class="text-lg font-bold text-indigo-600">-</div>
          </div>
          <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>

        <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5" data-i18n="label_bandwidth">带宽估算</div>
            <div id="bandwidth-mbps" class="text-lg font-bold text-emerald-600">-</div>
          </div>
          <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
          </div>
        </div>
      </div>

      <button id="start-btn" class="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98]" data-i18n="btn_start">
        开始测速
      </button>

      <div class="mt-4 text-center">
         <span class="text-xs text-slate-400" id="status-text" data-i18n="status_ready">准备就绪</span>
      </div>

    </div>
    
    <div class="mt-6 text-center">
      <p class="text-[10px] text-slate-400">Powered by Cloudflare Workers • Asonlino</p>
    </div>
  </div>

  <script>
    // ==========================================
    // 多语言配置 (I18n)
    // ==========================================
    const translations = {
      zh: {
        subtitle: "网络延迟与带宽测试",
        badge_panel: "网络面板",
        label_node: "测速节点",
        opt_100: "默认节点 (100MB)",
        opt_200: "默认节点 (200MB)",
        opt_500: "默认节点 (500MB)",
        opt_1024: "默认节点 (1GB)",
        label_threads: "并发线程",
        label_total: "总流量",
        label_speed: "实时速度",
        label_bandwidth: "带宽估算",
        btn_start: "开始测速",
        btn_stop: "停止",
        status_ready: "准备就绪",
        status_running: "测速中...",
        status_done: "测速完成",
        status_stopped: "已停止"
      },
      en: {
        subtitle: "Network Latency & Bandwidth",
        badge_panel: "Network Panel",
        label_node: "Target Node",
        opt_100: "Default Node (100MB)",
        opt_200: "Default Node (200MB)",
        opt_500: "Default Node (500MB)",
        opt_1024: "Default Node (1GB)",
        label_threads: "Concurrency",
        label_total: "Downloaded",
        label_speed: "Realtime Speed",
        label_bandwidth: "Bandwidth",
        btn_start: "Start Test",
        btn_stop: "Stop",
        status_ready: "Ready to run",
        status_running: "Running...",
        status_done: "Test Completed",
        status_stopped: "Test stopped"
      },
      ja: {
        subtitle: "ネットワーク遅延と帯域幅",
        badge_panel: "ネットワークパネル",
        label_node: "測定ノード",
        opt_100: "デフォルトノード (100MB)",
        opt_200: "デフォルトノード (200MB)",
        opt_500: "デフォルトノード (500MB)",
        opt_1024: "デフォルトノード (1GB)",
        label_threads: "同時接続数",
        label_total: "ダウンロード済み",
        label_speed: "リアルタイム速度",
        label_bandwidth: "帯域幅推定",
        btn_start: "テスト開始",
        btn_stop: "停止",
        status_ready: "準備完了",
        status_running: "実行中...",
        status_done: "テスト完了",
        status_stopped: "停止しました"
      }
    };

    let currentLang = 'zh'; // 默认中文
    const langOrder = ['zh', 'en', 'ja'];

    function toggleLanguage() {
      // 切换到下一个语言
      const currentIndex = langOrder.indexOf(currentLang);
      const nextIndex = (currentIndex + 1) % langOrder.length;
      currentLang = langOrder[nextIndex];
      applyLanguage(currentLang);
    }

    function applyLanguage(lang) {
      const t = translations[lang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
           // 特殊处理按钮，如果当前正在运行，不要覆盖成"开始"
           if (key === 'btn_start' && isRunning) {
             el.innerText = t['btn_stop'];
           } else {
             el.innerText = t[key];
           }
        }
      });
      // 单独更新 document title
      // document.title = "Asonlino Speed"; // 标题保持英文品牌名不动
    }

    // ==========================================
    // 逻辑功能
    // ==========================================
    const slider = document.getElementById('concurrency-slider');
    const concurrencyVal = document.getElementById('concurrency-val');
    const startBtn = document.getElementById('start-btn');
    const sourceSelect = document.getElementById('source-select');
    const statusText = document.getElementById('status-text');
    
    slider.addEventListener('input', (e) => {
      concurrencyVal.innerText = e.target.value;
    });

    let isRunning = false;
    let abortController = null;
    let totalBytes = 0;
    let startTime = 0;
    let speedInterval = null;

    function formatSize(bytes) {
      if (bytes === 0) return '0 MB';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    startBtn.addEventListener('click', () => {
      if (isRunning) stopTest();
      else startTest();
    });

    function stopTest() {
      if (abortController) abortController.abort();
      if (speedInterval) clearInterval(speedInterval);
      isRunning = false;
      
      const t = translations[currentLang];
      startBtn.innerText = t.btn_start;
      
      startBtn.classList.remove('bg-red-500', 'hover:bg-red-600', 'shadow-red-200');
      startBtn.classList.add('bg-slate-800', 'hover:bg-slate-900', 'shadow-slate-200');
      statusText.innerText = t.status_stopped;
    }

    async function startTest() {
      isRunning = true;
      totalBytes = 0;
      startTime = performance.now();
      abortController = new AbortController();
      
      const t = translations[currentLang];
      startBtn.innerText = t.btn_stop;
      
      startBtn.classList.remove('bg-slate-800', 'hover:bg-slate-900', 'shadow-slate-200');
      startBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'shadow-red-200');
      statusText.innerText = t.status_running;

      const threads = parseInt(slider.value);
      const url = sourceSelect.value;
      
      let lastBytes = 0;
      speedInterval = setInterval(() => {
        const now = performance.now();
        const durationSec = (now - startTime) / 1000;
        if(durationSec <= 0) return;

        const speedBps = totalBytes / durationSec; 
        const speedMbps = (speedBps * 8) / (1024 * 1024);

        document.getElementById('total-downloaded').innerText = formatSize(totalBytes);
        document.getElementById('realtime-speed').innerText = formatSize(speedBps) + '/s';
        document.getElementById('bandwidth-mbps').innerText = speedMbps.toFixed(1) + ' Mbps';
        
        lastBytes = totalBytes;
      }, 200);

      const promises = [];
      for (let i = 0; i < threads; i++) {
        promises.push(downloadThread(url, abortController.signal));
      }

      try {
        await Promise.all(promises);
        statusText.innerText = t.status_done;
      } catch (err) {
        // expected on abort
      }
      
      stopTest();
    }

    async function downloadThread(url, signal) {
      const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Math.random();
      try {
        const response = await fetch(fetchUrl, { signal });
        if (!response.ok) throw new Error(response.statusText);
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
        }
      } catch (e) {}
    }

    // 初始化运行一次语言设置，确保一致性
    applyLanguage('zh');
  </script>
</body>
</html>
  `;
}