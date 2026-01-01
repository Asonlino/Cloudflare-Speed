export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ==========================================
    // 1. 后端下载接口 (保持 1MB 块大小，稳定输出)
    // ==========================================
    if (url.pathname === '/speed/down') {
      let fileSizeMB = 0; 
      const mbParam = url.searchParams.get('mb');
      if (mbParam !== null) {
        const val = parseFloat(mbParam);
        if (!isNaN(val) && val >= 0 && val <= 1024) fileSizeMB = val;
      }
      const fileSize = fileSizeMB === 0 ? Infinity : Math.floor(fileSizeMB * 1024 * 1024);
      
      const stream = new ReadableStream({
        start(controller) {
          const chunkSize = 1024 * 1024; // 1MB
          let sent = 0;
          function push() {
            if (fileSize !== Infinity && sent >= fileSize) {
              controller.close();
              return;
            }
            const currentChunkSize = fileSize === Infinity ? chunkSize : Math.min(chunkSize, fileSize - sent);
            const buffer = new Uint8Array(currentChunkSize); 
            if (controller.desiredSize === null || controller.desiredSize > 0) {
               controller.enqueue(buffer);
               sent += currentChunkSize;
               setTimeout(push, 0); 
            } else {
               setTimeout(push, 10);
            }
          }
          push();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment; filename=\"testfile.bin\"",
          // 允许跨域，方便自己调用自己
          "Access-Control-Allow-Origin": "*" 
        }
      });
    }

    // ==========================================
    // 2. 前端 UI 接口
    // ==========================================
    if (url.pathname === '/speed') {
      return new Response(htmlUI(url.origin), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
    return new Response("Not Found", { status: 404 });
  }
};

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
      -webkit-appearance: none; height: 26px; width: 26px; border-radius: 50%; background: #ffffff; border: 3px solid #6366f1; box-shadow: 0 4px 6px rgba(0,0,0,0.15); cursor: pointer; margin-top: -10px;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%; height: 6px; background: #cbd5e1; border-radius: 3px;
    }
    .glass-panel { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .clickable-setting { cursor: pointer; transition: all 0.2s; }
    .clickable-setting:hover { background-color: #f1f5f9; transform: scale(1.01); }
  </style>
</head>
<body class="bg-[#f1f5f9] text-slate-800 min-h-screen flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-[480px] fade-in relative">
    
    <div class="mb-6 flex items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-300 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Asonlino Speed</h1>
          <p class="text-sm text-slate-500 font-medium" data-i18n="subtitle">Network Latency & Bandwidth</p>
        </div>
      </div>
    </div>

    <div class="glass-panel rounded-[24px] p-6 md:p-8 relative overflow-hidden">
      
      <div class="absolute top-0 left-0 bg-indigo-50 px-5 py-2 rounded-br-2xl border-b border-r border-indigo-100">
        <span class="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <span data-i18n="badge_panel">网络面板</span>
        </span>
      </div>

      <div class="absolute top-5 right-5 z-10">
        <button onclick="toggleLanguage()" class="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
        </button>
      </div>
      <div class="mt-12"></div>

      <div class="mb-6">
        <label class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1" data-i18n="label_node">测速节点</label>
        <div class="relative">
            <select id="source-select" class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-4 appearance-none font-medium truncate pr-10 shadow-sm">
              </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
      </div>

      <div class="mb-8">
        <div class="flex justify-between items-center mb-3 pl-1 pr-1">
          <label class="text-sm font-bold text-slate-500 uppercase tracking-wider" data-i18n="label_threads">并发线程</label>
          <span id="concurrency-val" class="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg">8</span>
        </div>
        <input type="range" id="concurrency-slider" min="1" max="32" value="8" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer">
      </div>

      <div class="space-y-4 mb-9">
        
        <div id="total-limit-container" class="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm clickable-setting">
          <div>
            <div class="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span data-i18n="label_total_clickable">总流量 (点击设置上限)</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </div>
            <div id="total-downloaded" class="text-2xl font-bold text-slate-800">-</div>
          </div>
          <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
          </div>
        </div>

        <div class="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1" data-i18n="label_speed">实时速度</div>
            <div id="realtime-speed" class="text-2xl font-bold text-indigo-600">-</div>
          </div>
          <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>

        <div class="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div>
            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1" data-i18n="label_bandwidth">带宽估算</div>
            <div id="bandwidth-mbps" class="text-2xl font-bold text-emerald-600">-</div>
          </div>
          <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
          </div>
        </div>
      </div>

      <button id="start-btn" class="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white text-lg font-bold rounded-2xl transition-all shadow-lg shadow-slate-300 active:scale-[0.98]" data-i18n="btn_start">开始测速</button>

      <div class="mt-5 text-center">
         <span class="text-sm text-slate-400 font-medium" id="status-text" data-i18n="status_ready">准备就绪</span>
      </div>
    </div>
    <div class="mt-8 text-center"><p class="text-xs text-slate-400 font-medium">Powered by Cloudflare Workers • Asonlino</p></div>
  </div>

  <script>
    // ==========================================
    // 节点定义
    // 注意：所有链接必须支持 HTTPS，否则在 Worker 中会报错 (Mixed Content)
    // ==========================================
    const rawSources = [
      // 1. 官方与CDN (置顶)
      { c: "CDN", p: "Cloudflare", s: "Global", u: "https://speed.cloudflare.com/__down?bytes=200000000" },
      { c: "CDN", p: "Cloudflare-Worker", s: "Global", u: "${origin}/speed/down?mb=0" },
      { c: "CDN", p: "jsDelivr", s: "Global", u: "https://cdn.jsdelivr.net/gh/P3TERX/testfile@master/100MB.bin" },
      { c: "CDN", p: "Cachefly", s: "Global", u: "https://cachefly.cachefly.net/100mb.test" },

      // 2. 亚洲 - 中国
      { c: "China", p: "China Mobile", s: "Migu", u: "https://d.musicapp.migu.cn/prod/file-service/file-down/8578746d5066a9d59af905eb0939b4b1/4b9015f6b2164327a3d3c78864016666.apk" },
      { c: "China", p: "China Telecom", s: "Tianyi Cloud", u: "https://desk-download.cloud.189.cn/download/exe/20241224/CTCloudDisk_Setup_8.0.2_20241224163953.exe" },
      { c: "China", p: "China Unicom", s: "", u: "https://img.sj.ol-img.com/download/10010/10010_new_8.0.0.apk" },
      { c: "China", p: "Alibaba", s: "CDN", u: "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-36594a99-2093-463a-a759-52fb6b72da91/5a00630f-754b-4236-9011-3d484047641e.bin" },
      { c: "China", p: "Tencent", s: "WeGame", u: "https://wegame.gtimg.com/g.55555-r.26ca4/wegame-home/sc02-00.5.5.5.5.7.9.0.5.3.6.1.1.8.6.0.4.exe" },
      { c: "China", p: "Netease", s: "", u: "https://n.netease.com/download/n_setup_official.exe" },
      { c: "China", p: "Bilibili", s: "CDN", u: "https://s1.hdslb.com/bfs/static/game-web/duang/7.0.0/duang-7.0.0.zip.001" },
      { c: "China", p: "ByteDance", s: "Douyin", u: "https://lf9-apk.douyin.com/package/apk/com.ss.android.ugc.aweme/290601/douyin_29.6.0_douyin_update_8735_v290601_80ed.apk" },
      { c: "China", p: "Huawei", s: "Cloud", u: "https://hwid1.vmall.com/CAS/static/js/jquery.min.js?size=50MB" }, 

      // 2. 亚洲 - 其他 (已替换为 HTTPS 链接，或确认兼容)
      { c: "Singapore", p: "DigitalOcean", s: "", u: "https://speedtest-sgp1.digitalocean.com/100mb.test" },
      { c: "Japan", p: "Linode", s: "Tokyo", u: "http://speedtest.tokyo2.linode.com/100MB-tokyo2.bin" }, // Linode 某些节点可能只有HTTP，浏览器可能报Mixed Content警告，这是浏览器安全策略
      { c: "Taiwan", p: "Hinet", s: "Dr.Speed", u: "http://speed.hinet.net/test_100m.zip" }, // Hinet 通常只有HTTP

      // 3. 美洲
      { c: "USA", p: "DigitalOcean", s: "San Francisco", u: "https://speedtest-sfo3.digitalocean.com/100mb.test" },
      { c: "USA", p: "DigitalOcean", s: "New York", u: "https://speedtest-nyc1.digitalocean.com/100mb.test" },
      
      // 4. 欧洲
      { c: "Germany", p: "Hetzner", s: "", u: "https://speed.hetzner.de/100MB.bin" },
      { c: "UK", p: "DigitalOcean", s: "London", u: "https://speedtest-lon1.digitalocean.com/100mb.test" },
      { c: "France", p: "Scaleway", s: "Paris", u: "https://ping.online.net/100Mo.dat" },
    ];

    // ==========================================
    // I18n
    // ==========================================
    const translations = {
      zh: {
        subtitle: "网络延迟与带宽测试", badge_panel: "网络面板", label_node: "测速节点",
        label_threads: "并发线程", label_total_clickable: "总流量 (点击设置上限)", label_speed: "实时速度", label_bandwidth: "带宽估算",
        btn_start: "开始测速", btn_stop: "停止", status_ready: "准备就绪", status_running: "测速中...", status_done: "测速完成", status_stopped: "已停止",
        status_limit_reached: "已达流量上限停止", prompt_limit: "请输入最大下载流量限制(GB)，输入 0 表示无限：", label_total_unlimited: "总流量 (无限)", label_total_limited: "总流量 (上限: ",
        
        "China Mobile": "中国移动", "China Telecom": "中国电信", "China Unicom": "中国联通", "Cloudflare-Worker": "Cloudflare Worker",
        "Alibaba": "阿里巴巴", "Tencent": "腾讯", "Netease": "网易", "Huawei": "华为", "ByteDance": "字节跳动",
        "Global": "全球", "Migu": "咪咕", "Tianyi Cloud": "天翼云", "WeGame": "WeGame", "Douyin": "抖音", "Dr.Speed": "测速档"
      },
      en: {
        subtitle: "Network Latency & Bandwidth", badge_panel: "Network Panel", label_node: "Target Node",
        label_threads: "Concurrency", label_total_clickable: "Total Downloaded (Click to set limit)", label_speed: "Realtime Speed", label_bandwidth: "Bandwidth",
        btn_start: "Start Test", btn_stop: "Stop", status_ready: "Ready to run", status_running: "Running...", status_done: "Test Completed", status_stopped: "Test stopped",
        status_limit_reached: "Stopped: Limit reached", prompt_limit: "Enter max download limit (GB), 0 for unlimited:", label_total_unlimited: "Total (Unlimited)", label_total_limited: "Total (Limit: ",
      },
      ja: {
        subtitle: "ネットワーク遅延と帯域幅", badge_panel: "ネットワークパネル", label_node: "測定ノード",
        label_threads: "同時接続数", label_total_clickable: "総トラフィック (クリックして上限設定)", label_speed: "リアルタイム速度", label_bandwidth: "帯域幅推定",
        btn_start: "テスト開始", btn_stop: "停止", status_ready: "準備完了", status_running: "実行中...", status_done: "テスト完了", status_stopped: "停止しました",
        status_limit_reached: "上限に達したため停止", prompt_limit: "最大ダウンロード制限(GB)を入力、0は無制限:", label_total_unlimited: "総計 (無制限)", label_total_limited: "総計 (上限: ",
        
        "China Mobile": "中国移動", "China Telecom": "中国電信", "China Unicom": "中国聯通", "Cloudflare-Worker": "Cloudflare Worker",
        "Alibaba": "アリババ", "Tencent": "テンセント", "Netease": "網易", "Huawei": "ファーウェイ", "ByteDance": "バイトダンス",
        "Global": "グローバル", "Migu": "Migu", "Tianyi Cloud": "天翼クラウド", "Douyin": "Douyin"
      }
    };

    let currentLang = 'zh';
    const langOrder = ['zh', 'en', 'ja'];
    let maxDownloadSize = Infinity;
    const sourceSelect = document.getElementById('source-select');

    function tVal(key) {
      return (translations[currentLang] && translations[currentLang][key]) ? translations[currentLang][key] : key;
    }

    function renderSourceOptions() {
      const currentVal = sourceSelect.value;
      sourceSelect.innerHTML = rawSources.map(s => {
        const country = s.c; 
        const provider = tVal(s.p);
        let sourceSuffix = '';
        if (s.s) {
            const translatedS = tVal(s.s);
            if (translatedS) sourceSuffix = ' - ' + translatedS;
        }
        const displayName = '[' + country + '] ' + provider + sourceSuffix;
        return '<option value="' + s.u + '">' + displayName + '</option>';
      }).join('');

      if (currentVal && Array.from(sourceSelect.options).some(o => o.value === currentVal)) {
        sourceSelect.value = currentVal;
      } else {
        sourceSelect.selectedIndex = 0;
      }
    }

    function toggleLanguage() {
      currentLang = langOrder[(langOrder.indexOf(currentLang) + 1) % langOrder.length];
      applyLanguage(currentLang);
    }

    function applyLanguage(lang) {
      const t = translations[lang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
           if (key === 'btn_start' && isRunning) el.innerText = t['btn_stop'];
           else if (key === 'label_total_clickable') updateTotalLabel(t);
           else el.innerText = t[key];
        }
      });
      renderSourceOptions();
    }

    function updateTotalLabel(t) {
        const labelEl = document.querySelector('[data-i18n="label_total_clickable"]');
        if (maxDownloadSize === Infinity) {
            labelEl.childNodes[0].textContent = t.label_total_unlimited + " ";
        } else {
            labelEl.childNodes[0].textContent = t.label_total_limited + (maxDownloadSize / (1024*1024*1024)).toFixed(2) + "GB) ";
        }
    }

    const slider = document.getElementById('concurrency-slider');
    const concurrencyVal = document.getElementById('concurrency-val');
    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('status-text');
    const totalLimitContainer = document.getElementById('total-limit-container');
    
    slider.addEventListener('input', (e) => concurrencyVal.innerText = e.target.value);

    totalLimitContainer.addEventListener('click', () => {
        if (isRunning) return;
        const t = translations[currentLang];
        const limitStr = prompt(t.prompt_limit, maxDownloadSize === Infinity ? "0" : (maxDownloadSize / (1024*1024*1024)).toString());
        if (limitStr !== null) {
            const limitGB = parseFloat(limitStr);
            if (!isNaN(limitGB) && limitGB > 0) {
                maxDownloadSize = limitGB * 1024 * 1024 * 1024;
            } else {
                maxDownloadSize = Infinity;
            }
            updateTotalLabel(t);
        }
    });

    let isRunning = false;
    let abortController = null;
    let totalBytes = 0;
    let startTime = 0;
    let speedInterval = null;
    let lastIntervalBytes = 0;
    let lastIntervalTime = 0;

    function formatSize(bytes, isSpeed = false) {
      if (bytes === 0) return isSpeed ? '0 B/s' : '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] + (isSpeed ? '/s' : '');
    }

    startBtn.addEventListener('click', () => isRunning ? stopTest() : startTest());

    function stopTest(limitReached = false) {
      if (abortController) abortController.abort();
      if (speedInterval) clearInterval(speedInterval);
      isRunning = false;
      
      const t = translations[currentLang];
      startBtn.innerText = t.btn_start;
      startBtn.classList.remove('bg-red-500', 'hover:bg-red-600', 'shadow-red-200');
      startBtn.classList.add('bg-slate-800', 'hover:bg-slate-900', 'shadow-slate-300');
      statusText.innerText = limitReached ? t.status_limit_reached : t.status_stopped;
    }

    async function startTest() {
      isRunning = true;
      totalBytes = 0;
      lastIntervalBytes = 0;
      startTime = performance.now();
      lastIntervalTime = startTime;
      abortController = new AbortController();
      
      const t = translations[currentLang];
      startBtn.innerText = t.btn_stop;
      startBtn.classList.remove('bg-slate-800', 'hover:bg-slate-900', 'shadow-slate-300');
      startBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'shadow-red-200');
      statusText.innerText = t.status_running;

      const threads = parseInt(slider.value);
      const url = sourceSelect.value;
      
      speedInterval = setInterval(() => {
        const now = performance.now();
        const timeDelta = (now - lastIntervalTime) / 1000;
        if (timeDelta < 0.2) return;

        const bytesDelta = totalBytes - lastIntervalBytes;
        const instantSpeedBps = (bytesDelta * 8) / timeDelta;
        const instantSpeedMbps = instantSpeedBps / (1024 * 1024);

        document.getElementById('total-downloaded').innerText = formatSize(totalBytes);
        document.getElementById('realtime-speed').innerText = formatSize(bytesDelta / timeDelta, true);
        document.getElementById('bandwidth-mbps').innerText = instantSpeedMbps.toFixed(1) + ' Mbps';
        
        lastIntervalBytes = totalBytes;
        lastIntervalTime = now;

        if (totalBytes >= maxDownloadSize) {
            stopTest(true);
        }
      }, 500);

      const promises = [];
      for (let i = 0; i < threads; i++) {
        promises.push(downloadThread(url, abortController.signal));
      }

      try {
        await Promise.all(promises);
        if (isRunning) { 
             statusText.innerText = t.status_done;
             stopTest();
        }
      } catch (err) { }
    }

    // ============================================
    // 核心修复逻辑：简单请求 + 无限重连
    // ============================================
    async function downloadThread(url, signal) {
      while (isRunning) {
          // 1. 使用随机参数避开缓存
          // 2. 不加任何自定义 headers (Cache-Control/Pragma 等)，强制成为"简单请求"，避免 OPTIONS 预检
          // 3. 加上 referrerPolicy: 'no-referrer' 防止防盗链
          const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Math.random();
          
          try {
            const response = await fetch(fetchUrl, { 
                signal,
                referrerPolicy: 'no-referrer' 
            });
            
            // 如果请求失败(404/403/500)，抛出错误并在 catch 中重试
            if (!response.ok) throw new Error('Net Err');
            
            const reader = response.body.getReader();
            
            while (true) {
              const { done, value } = await reader.read();
              // 如果读取完成（文件下完了），跳出内部循环，外部 while 会立即发起新请求
              if (done) break; 
              
              totalBytes += value.length;
              if (totalBytes >= maxDownloadSize) return;
              if (!isRunning) return;
            }
          } catch (e) {
            // 遇到网络错误或 CORS 阻挡，不退出，稍微等待后重试（死循环）
            if (!isRunning) return;
            await new Promise(r => setTimeout(r, 200));
          }
      }
    }

    applyLanguage('zh');
    updateTotalLabel(translations['zh']);
  </script>
</body>
</html>
  `;
}
