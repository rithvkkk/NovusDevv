/* ============================================================
   NOVUS AI AGENT PORTAL — Core Logic
   Auth, Tab Navigation, Analysis Engines, Charts, AI Recs
   ============================================================ */

// ── Auth ──────────────────────────────────────────────────────
const APPROVED_USERS = [
  { username: 'rithvik', password: 'novus2025', name: 'Rithvik' },
  { username: 'admin', password: 'novusadmin', name: 'Admin' },
];

let currentUser = null;
const chartInstances = {};

// Login
document.getElementById('loginForm').addEventListener('submit', () => {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const p = document.getElementById('loginPass').value;
  const user = APPROVED_USERS.find(x => x.username === u && x.password === p);

  if (user) {
    currentUser = user;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name[0].toUpperCase();
    document.getElementById('loginError').classList.remove('show');
  } else {
    const card = document.getElementById('loginCard');
    const err = document.getElementById('loginError');
    err.classList.add('show');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').classList.remove('show');
  destroyAllCharts();
  // Reset results
  document.querySelectorAll('.results-area').forEach(r => r.classList.remove('show'));
});

// ── Tab Navigation ────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Utility Functions ─────────────────────────────────────────
function simulateLoading(btnId, callback) {
  const btn = document.getElementById(btnId);
  btn.classList.add('loading');
  btn.disabled = true;
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;
    callback();
  }, 1800 + Math.random() * 1200);
}

function destroyAllCharts() {
  Object.keys(chartInstances).forEach(k => {
    if (chartInstances[k]) { chartInstances[k].destroy(); delete chartInstances[k]; }
  });
}

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function animateCounter(el, target, prefix = '', suffix = '') {
  let current = 0;
  const step = target / 40;
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = prefix + (target >= 100 ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
  }, 30);
}

function renderKpis(containerId, kpis) {
  const c = document.getElementById(containerId);
  c.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" data-target="${k.value}" data-prefix="${k.prefix || ''}" data-suffix="${k.suffix || ''}">${k.prefix || ''}0${k.suffix || ''}</div>
      <div class="kpi-change ${k.changeDir}">${k.changeDir === 'up' ? '↑' : '↓'} ${k.change}</div>
    </div>
  `).join('');
  c.querySelectorAll('.kpi-value').forEach(el => {
    animateCounter(el, parseFloat(el.dataset.target), el.dataset.prefix, el.dataset.suffix);
  });
}

function renderRecs(containerId, recs) {
  const c = document.getElementById(containerId);
  c.innerHTML = recs.map((r, i) => {
    // Build action steps HTML
    const stepsHtml = (r.steps || []).map((s, si) => `
      <li><span class="step-num">${si + 1}</span><span>${s}</span></li>
    `).join('');

    // Build metrics HTML
    const metricsHtml = (r.metrics || []).map(m => `
      <div class="detail-metric">
        <div class="dm-value" style="color:${m.color || 'var(--text-primary)'}">${m.value}</div>
        <div class="dm-label">${m.label}</div>
      </div>
    `).join('');

    // Build tools tags HTML
    const toolsHtml = (r.tools || []).map(t => `<span class="detail-tag">${t}</span>`).join('');

    // Timeline dot class
    const tlClass = r.timeline === '1-2 days' || r.timeline === '< 1 week' ? 'quick' : (r.timeline || '').includes('week') ? 'medium' : 'long';

    return `
    <li class="rec-item" onclick="this.classList.toggle('expanded')">
      <div class="rec-priority ${r.priority}">${r.priority === 'high' ? '!' : r.priority === 'medium' ? '!!' : '✓'}</div>
      <div class="rec-content">
        <h5>${r.title}</h5>
        <p>${r.desc}</p>
        <div class="rec-impact">⚡ Expected impact: ${r.impact}</div>

        <div class="rec-detail">
          <div class="rec-detail-grid">
            ${stepsHtml ? `
            <div class="detail-block">
              <div class="detail-block-title"><span class="material-symbols-outlined">checklist</span>Action Steps</div>
              <ul class="action-steps">${stepsHtml}</ul>
            </div>` : ''}

            <div class="detail-block">
              <div class="detail-block-title"><span class="material-symbols-outlined">analytics</span>Projected Metrics</div>
              <div class="detail-metrics">${metricsHtml}</div>
              ${r.timeline ? `
              <div class="detail-timeline" style="margin-top:12px">
                <span class="tl-dot ${tlClass}"></span>
                <span><strong>Timeline:</strong> ${r.timeline}</span>
              </div>` : ''}
              ${r.difficulty ? `
              <div class="detail-timeline">
                <span class="tl-dot ${r.difficulty === 'Easy' ? 'quick' : r.difficulty === 'Medium' ? 'medium' : 'long'}"></span>
                <span><strong>Difficulty:</strong> ${r.difficulty}</span>
              </div>` : ''}
            </div>
          </div>

          ${toolsHtml ? `
          <div class="rec-detail-full">
            <div class="detail-block-title"><span class="material-symbols-outlined">build</span>Recommended Tools</div>
            <div class="detail-tags">${toolsHtml}</div>
          </div>` : ''}

          ${r.proTip ? `
          <div class="detail-note">
            <span class="material-symbols-outlined">lightbulb</span>
            <span><strong>Pro Tip:</strong> ${r.proTip}</span>
          </div>` : ''}
        </div>
      </div>
    </li>`;
  }).join('');
}

function renderChecklist(containerId, items) {
  const c = document.getElementById(containerId);
  c.innerHTML = items.map(i => `
    <li>
      <div class="check-dot ${i.status}">${i.status === 'pass' ? '✓' : i.status === 'fail' ? '✗' : '!'}</div>
      <span>${i.label}</span>
    </li>
  `).join('');
}

function setScoreRing(ringId, numId, score) {
  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => {
    document.getElementById(ringId).style.strokeDashoffset = offset;
  }, 200);
  animateCounter(document.getElementById(numId), score);
}

const chartColors = {
  blue: 'rgba(37,99,235,0.8)',
  blueFill: 'rgba(37,99,235,0.15)',
  cyan: 'rgba(34,211,238,0.8)',
  cyanFill: 'rgba(34,211,238,0.15)',
  green: 'rgba(34,197,94,0.8)',
  greenFill: 'rgba(34,197,94,0.15)',
  red: 'rgba(239,68,68,0.8)',
  orange: 'rgba(245,158,11,0.8)',
  purple: 'rgba(168,85,247,0.8)',
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#7c8298', font: { family: 'Inter', size: 11 } } },
  },
  scales: {
    x: { ticks: { color: '#454b63', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
    y: { ticks: { color: '#454b63', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

// ════════════════════════════════════════════════════════════════
// ── GOOGLE ADS ANALYSIS ───────────────────────────────────────
// ════════════════════════════════════════════════════════════════

function analyzeGoogleAds() {
  const input = document.getElementById('googleAdsInput').value.trim();
  if (!input) { document.getElementById('googleAdsInput').focus(); return; }

  simulateLoading('analyzeGoogle', () => {
    document.getElementById('googleResults').classList.add('show');

    // KPIs
    renderKpis('googleKpis', [
      { label: 'Total Spend', value: 48520, prefix: '₹', change: '12.4% vs last month', changeDir: 'up' },
      { label: 'Impressions', value: 284300, change: '18.2% vs last month', changeDir: 'up' },
      { label: 'Clicks', value: 12840, change: '8.7% vs last month', changeDir: 'up' },
      { label: 'CTR', value: 4.5, suffix: '%', change: '0.3% improvement', changeDir: 'up' },
      { label: 'Avg. CPC', value: 3.8, prefix: '₹', change: '₹0.40 decrease', changeDir: 'up' },
      { label: 'Conversions', value: 342, change: '15.6% vs last month', changeDir: 'up' },
    ]);

    // Spend vs Conversions Chart
    destroyChart('googleSpendChart');
    const days = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
    chartInstances['googleSpendChart'] = new Chart(document.getElementById('googleSpendChart'), {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Spend (₹)',
            data: days.map(() => 1200 + Math.random() * 2200),
            borderColor: chartColors.blue, backgroundColor: chartColors.blueFill,
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
          },
          {
            label: 'Conversions',
            data: days.map(() => 6 + Math.floor(Math.random() * 18)),
            borderColor: chartColors.green, backgroundColor: chartColors.greenFill,
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        ...chartDefaults,
        scales: {
          ...chartDefaults.scales,
          y1: { position: 'right', ticks: { color: '#454b63', font: { size: 10 } }, grid: { display: false } },
        },
      },
    });

    // Campaign Pie
    destroyChart('googleCampaignPie');
    chartInstances['googleCampaignPie'] = new Chart(document.getElementById('googleCampaignPie'), {
      type: 'doughnut',
      data: {
        labels: ['Search - Brand', 'Search - Services', 'Display', 'Performance Max', 'YouTube'],
        datasets: [{
          data: [32, 28, 18, 14, 8],
          backgroundColor: [chartColors.blue, chartColors.cyan, chartColors.green, chartColors.purple, chartColors.orange],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#7c8298', font: { family: 'Inter', size: 11 }, padding: 12 } },
        },
        cutout: '65%',
      },
    });

    // Keyword Table
    const keywords = [
      { kw: `${input.includes('salon') ? 'salon' : 'business'} near me`, imp: '42,300', clicks: '2,180', ctr: '5.2%', cpc: '₹3.20', conv: '84', qs: 9 },
      { kw: 'bridal makeup artist', imp: '28,100', clicks: '1,620', ctr: '5.8%', cpc: '₹4.80', conv: '52', qs: 8 },
      { kw: 'best hair salon', imp: '35,400', clicks: '1,940', ctr: '5.5%', cpc: '₹2.90', conv: '63', qs: 9 },
      { kw: 'keratin treatment price', imp: '18,200', clicks: '980', ctr: '5.4%', cpc: '₹3.60', conv: '28', qs: 7 },
      { kw: 'facial spa near me', imp: '22,600', clicks: '1,120', ctr: '5.0%', cpc: '₹3.40', conv: '35', qs: 8 },
      { kw: 'hair color service', imp: '15,800', clicks: '720', ctr: '4.6%', cpc: '₹4.20', conv: '22', qs: 7 },
      { kw: 'skin treatment clinic', imp: '12,400', clicks: '580', ctr: '4.7%', cpc: '₹5.10', conv: '18', qs: 6 },
      { kw: 'party makeup walk in', imp: '8,900', clicks: '460', ctr: '5.2%', cpc: '₹2.80', conv: '15', qs: 8 },
    ];

    const tbody = document.querySelector('#googleKeywordTable tbody');
    tbody.innerHTML = keywords.map(k => `
      <tr>
        <td><strong>${k.kw}</strong></td>
        <td>${k.imp}</td>
        <td>${k.clicks}</td>
        <td><span class="badge badge-blue">${k.ctr}</span></td>
        <td>${k.cpc}</td>
        <td><strong>${k.conv}</strong></td>
        <td><span class="badge ${k.qs >= 8 ? 'badge-green' : k.qs >= 6 ? 'badge-orange' : 'badge-red'}">${k.qs}/10</span></td>
      </tr>
    `).join('');

    // AI Recommendations
    renderRecs('googleRecs', [
      { priority: 'high', title: 'Add Negative Keywords', desc: 'Block irrelevant search terms like "salon jobs", "salon training course", "free makeup" to prevent wasted spend. Found 23 irrelevant search terms consuming ₹4,200/month.', impact: 'Save ₹4,200/month, improve ROAS by ~15%',
        steps: ['Export Search Terms Report from Google Ads dashboard', 'Identify 23 irrelevant terms (jobs, courses, free, DIY, tutorial)', 'Add as negative keywords at campaign level', 'Create a shared negative keyword list for future campaigns', 'Monitor weekly and add new irrelevant terms'],
        metrics: [{value:'₹4,200', label:'Monthly Savings', color:'var(--green)'}, {value:'~15%', label:'ROAS Increase', color:'var(--green)'}, {value:'23', label:'Bad Terms Found', color:'var(--red)'}, {value:'4.8%', label:'New Est. CTR', color:'var(--blue-light)'}],
        timeline: '1-2 days', difficulty: 'Easy',
        tools: ['Google Ads Keyword Planner', 'Search Terms Report', 'Negative Keyword Lists'],
        proTip: 'Set up automated rules to flag search terms with 0 conversions and high spend (>₹200) weekly.' },
      { priority: 'high', title: 'Increase Budget on Top Converters', desc: `"${keywords[0].kw}" and "best hair salon" have the highest conversion rates but are impression-limited. Increase daily budget by 30% on these campaigns.`, impact: '+35-45 conversions/month',
        steps: ['Identify top 3 campaigns by conversion rate', 'Check impression share (currently ~65% — lost to budget)', 'Increase daily budget from ₹1,200 to ₹1,560 on these campaigns', 'Monitor CPA for 7 days to ensure efficiency', 'Reallocate budget from underperforming campaigns'],
        metrics: [{value:'+40', label:'Extra Conv/Month', color:'var(--green)'}, {value:'65%→90%', label:'Impression Share', color:'var(--blue-light)'}, {value:'₹140', label:'Target CPA', color:'var(--text-primary)'}, {value:'₹360', label:'Daily Budget Add', color:'var(--orange)'}],
        timeline: '1 week', difficulty: 'Easy',
        tools: ['Google Ads Budget Simulator', 'Auction Insights Report'],
        proTip: 'Use the Budget Simulator tool in Google Ads to preview estimated conversions before increasing spend.' },
      { priority: 'medium', title: 'Optimize Ad Copy with Location Extensions', desc: 'Enable location extensions and add business structured snippets. Currently only 2 of 5 ad groups use extensions — this suppresses ad rank.', impact: '+20% CTR improvement',
        steps: ['Link Google Business Profile to Google Ads account', 'Enable Location Extensions across all campaigns', 'Add Structured Snippets (Services: Haircut, Facial, Bridal, Keratin)', 'Add Callout Extensions (Free Consultation, 10+ Years, AC Salon)', 'Enable Call Extensions with business phone number'],
        metrics: [{value:'+20%', label:'CTR Boost', color:'var(--green)'}, {value:'5/5', label:'Extensions Goal', color:'var(--blue-light)'}, {value:'+0.3', label:'Ad Rank Lift', color:'var(--text-primary)'}, {value:'₹0.40', label:'CPC Reduction', color:'var(--green)'}],
        timeline: '2-3 days', difficulty: 'Easy',
        tools: ['Google Ads Extensions', 'Google Business Profile', 'Ad Preview Tool'],
        proTip: 'Ads with 4+ extensions get 15-20% higher CTR than those with fewer. Always max out your extension slots.' },
      { priority: 'medium', title: 'A/B Test Responsive Search Ads', desc: 'Current ads have only 3 headlines. Add 12+ headline variations and 4 descriptions for Google\'s ML to optimize combinations.', impact: '+10-18% conversion rate',
        steps: ['Audit current ad copy — only 3 headlines per ad group', 'Write 12 unique headlines per ad group (include keywords, USPs, CTAs, numbers)', 'Write 4 unique descriptions with different angles', 'Pin key headlines to Position 1 if needed', 'Run for 2 weeks, analyze asset-level performance', 'Remove "Low" performing assets and replace'],
        metrics: [{value:'12+', label:'Headlines Needed', color:'var(--blue-light)'}, {value:'4+', label:'Descriptions', color:'var(--blue-light)'}, {value:'+15%', label:'Conv Rate Est.', color:'var(--green)'}, {value:'2 weeks', label:'Test Duration', color:'var(--text-primary)'}],
        timeline: '1-2 weeks', difficulty: 'Medium',
        tools: ['Google Ads RSA', 'Ad Strength Score', 'Asset Performance Report'],
        proTip: 'Include at least 2 headlines with location, 2 with pricing/offers, 2 with social proof, and 2 with strong CTAs for best ML optimization.' },
      { priority: 'low', title: 'Enable Smart Bidding (Target CPA)', desc: 'With 342 conversions/month, you have sufficient data to switch from manual CPC to Target CPA bidding at ₹140/conversion.', impact: 'Reduce CPA by 12-20%',
        steps: ['Verify conversion tracking is accurate (check last 30 days)', 'Calculate current avg CPA (₹142) to set initial Target CPA', 'Switch bidding strategy to Target CPA on top campaigns first', 'Set learning period expectation: 1-2 weeks of increased volatility', 'Monitor daily and adjust target CPA based on results', 'Expand to all campaigns after stable performance'],
        metrics: [{value:'₹142→₹118', label:'CPA Reduction', color:'var(--green)'}, {value:'342', label:'Conv. Data Points', color:'var(--text-primary)'}, {value:'14 days', label:'Learning Period', color:'var(--orange)'}, {value:'+25%', label:'Efficiency Gain', color:'var(--green)'}],
        timeline: '2-3 weeks', difficulty: 'Medium',
        tools: ['Google Ads Smart Bidding', 'Bid Strategy Report', 'Google Ads Experiments'],
        proTip: 'Start with a Target CPA 10% above your current average, then gradually lower it as the algorithm learns. Never drop more than 15% at once.' },
    ]);
  });
}


// ════════════════════════════════════════════════════════════════
// ── META / INSTAGRAM ANALYSIS ──────────────────────────────────
// ════════════════════════════════════════════════════════════════

function analyzeMetaAds() {
  const input = document.getElementById('metaInput').value.trim();
  if (!input) { document.getElementById('metaInput').focus(); return; }

  simulateLoading('analyzeMeta', () => {
    document.getElementById('metaResults').classList.add('show');

    renderKpis('metaKpis', [
      { label: 'Followers', value: 14800, change: '+420 this month', changeDir: 'up' },
      { label: 'Reach', value: 186400, change: '22.5% vs last month', changeDir: 'up' },
      { label: 'Engagement Rate', value: 4.2, suffix: '%', change: '0.6% improvement', changeDir: 'up' },
      { label: 'Website Clicks', value: 2340, change: '18.3% vs last month', changeDir: 'up' },
      { label: 'Profile Visits', value: 8920, change: '14.1% vs last month', changeDir: 'up' },
      { label: 'Saves', value: 1560, change: '32.4% vs last month', changeDir: 'up' },
    ]);

    // Engagement Chart
    destroyChart('metaEngChart');
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
    chartInstances['metaEngChart'] = new Chart(document.getElementById('metaEngChart'), {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [
          { label: 'Likes', data: [820, 940, 1100, 980, 1240, 1380, 1560, 1720], backgroundColor: chartColors.blue, borderRadius: 4 },
          { label: 'Comments', data: [120, 145, 180, 160, 210, 240, 280, 310], backgroundColor: chartColors.cyan, borderRadius: 4 },
          { label: 'Shares', data: [45, 62, 78, 55, 90, 105, 130, 148], backgroundColor: chartColors.purple, borderRadius: 4 },
        ],
      },
      options: chartDefaults,
    });

    // Demographics Pie
    destroyChart('metaDemoPie');
    chartInstances['metaDemoPie'] = new Chart(document.getElementById('metaDemoPie'), {
      type: 'doughnut',
      data: {
        labels: ['Women 18-24', 'Women 25-34', 'Women 35-44', 'Men 25-34', 'Men 35-44', 'Other'],
        datasets: [{
          data: [22, 35, 18, 12, 8, 5],
          backgroundColor: ['#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#6b7280'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#7c8298', font: { family: 'Inter', size: 11 }, padding: 10 } } },
        cutout: '60%',
      },
    });

    // Best Posting Times
    destroyChart('metaTimeChart');
    chartInstances['metaTimeChart'] = new Chart(document.getElementById('metaTimeChart'), {
      type: 'bar',
      data: {
        labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '11 PM'],
        datasets: [{
          label: 'Engagement Score',
          data: [25, 58, 72, 45, 92, 88, 35],
          backgroundColor: [
            'rgba(37,99,235,0.3)','rgba(37,99,235,0.5)','rgba(37,99,235,0.7)','rgba(37,99,235,0.4)',
            'rgba(34,197,94,0.9)','rgba(34,197,94,0.8)','rgba(37,99,235,0.3)',
          ],
          borderRadius: 6,
        }],
      },
      options: {
        ...chartDefaults,
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
      },
    });

    // Content Type Performance
    destroyChart('metaContentChart');
    chartInstances['metaContentChart'] = new Chart(document.getElementById('metaContentChart'), {
      type: 'polarArea',
      data: {
        labels: ['Reels', 'Carousels', 'Single Image', 'Stories', 'IGTV/Live'],
        datasets: [{
          data: [92, 78, 45, 65, 38],
          backgroundColor: ['rgba(37,99,235,0.6)','rgba(34,211,238,0.6)','rgba(168,85,247,0.6)','rgba(245,158,11,0.6)','rgba(34,197,94,0.6)'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#7c8298', font: { family: 'Inter', size: 11 }, padding: 10 } } },
        scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } },
      },
    });

    // Posts Table
    const posts = [
      { name: 'Bridal Glam Transformation', type: 'Reel', likes: '4,820', comments: '342', reach: '48,200', eng: '10.7%', status: 'badge-green' },
      { name: 'Keratin Before & After', type: 'Carousel', likes: '3,210', comments: '218', reach: '32,100', eng: '10.7%', status: 'badge-green' },
      { name: 'Summer Hair Color Trends', type: 'Reel', likes: '2,890', comments: '165', reach: '28,400', eng: '10.8%', status: 'badge-green' },
      { name: 'Client Testimonial Story', type: 'Story', likes: '1,450', comments: '89', reach: '15,800', eng: '9.7%', status: 'badge-blue' },
      { name: 'Salon Tour Walkthrough', type: 'Reel', likes: '2,100', comments: '134', reach: '22,600', eng: '9.9%', status: 'badge-blue' },
      { name: 'Product Flat Lay', type: 'Image', likes: '680', comments: '42', reach: '8,900', eng: '8.1%', status: 'badge-orange' },
    ];

    document.querySelector('#metaPostsTable tbody').innerHTML = posts.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-blue">${p.type}</span></td>
        <td>${p.likes}</td>
        <td>${p.comments}</td>
        <td>${p.reach}</td>
        <td><span class="badge ${p.status}">${p.eng}</span></td>
        <td><span class="badge badge-green">● Active</span></td>
      </tr>
    `).join('');

    renderRecs('metaRecs', [
      { priority: 'high', title: 'Double Down on Reels Content', desc: 'Reels generate 3.2x more reach than carousels and 5.4x more than single images. Increase Reels frequency from 3/week to 5/week with trending audio.', impact: '+45-60% reach increase',
        steps: ['Identify 5 trending audios weekly using Instagram Explore and Reels tab', 'Create a weekly content calendar: 3 service reels + 2 behind-the-scenes', 'Keep reels under 15 seconds for maximum retention', 'Add text overlays and captions for accessibility', 'Post with 5-8 relevant hashtags + location tag'],
        metrics: [{value:'3.2x', label:'Reach vs Carousel', color:'var(--green)'}, {value:'5/week', label:'Target Frequency', color:'var(--blue-light)'}, {value:'+60%', label:'Reach Increase', color:'var(--green)'}, {value:'<15s', label:'Optimal Length', color:'var(--text-primary)'}],
        timeline: '1 week to start', difficulty: 'Medium',
        tools: ['Instagram Reels', 'CapCut Editor', 'Canva Pro', 'Later.com Scheduler'],
        proTip: 'The first 3 seconds of a Reel determine 80% of retention. Always start with a hook — a transformation reveal, bold text, or satisfying visual.' },
      { priority: 'high', title: 'Post at 6 PM & 9 PM Consistently', desc: 'Your audience is most active between 6-9 PM. Schedule all key content posts during this window. Currently 40% of posts go out at suboptimal times.', impact: '+25% engagement rate',
        steps: ['Audit last 30 days of post timing vs engagement', 'Set up scheduling tool with 6 PM and 9 PM time slots (IST)', 'Schedule Reels for 6 PM (peak discovery) and Carousels for 9 PM (peak engagement)', 'Post Stories throughout the day (10 AM, 2 PM, 7 PM, 10 PM)', 'A/B test Saturday vs Sunday for weekend posting'],
        metrics: [{value:'6 PM', label:'Peak Discovery', color:'var(--green)'}, {value:'9 PM', label:'Peak Engagement', color:'var(--green)'}, {value:'+25%', label:'Engagement Lift', color:'var(--green)'}, {value:'40%', label:'Currently Suboptimal', color:'var(--red)'}],
        timeline: '< 1 week', difficulty: 'Easy',
        tools: ['Meta Business Suite', 'Later.com', 'Instagram Insights'],
        proTip: 'Engagement in the first 30 minutes after posting determines algorithmic reach. Make sure you\'re active to reply to comments immediately after posting.' },
      { priority: 'medium', title: 'Leverage User-Generated Content', desc: 'Client transformation posts get 2.8x more saves. Create a branded hashtag campaign and reshare 3+ client posts per week.', impact: '+500 followers/month, +35% saves',
        steps: ['Create a branded hashtag (e.g. #GlamLuxeGlow or #MyGlamLuxe)', 'Print QR code cards for clients to tag the salon after their visit', 'Set up automatic monitoring of the branded hashtag', 'Reshare 3-5 client posts per week in Feed and Stories', 'Run a monthly "Best Transformation" contest with a free service as prize'],
        metrics: [{value:'2.8x', label:'More Saves', color:'var(--green)'}, {value:'+500', label:'Followers/Month', color:'var(--green)'}, {value:'3-5/wk', label:'UGC Reshares', color:'var(--blue-light)'}, {value:'+35%', label:'Saves Increase', color:'var(--green)'}],
        timeline: '1-2 weeks', difficulty: 'Easy',
        tools: ['Branded Hashtag', 'Repost App', 'Canva Templates', 'QR Code Generator'],
        proTip: 'UGC converts 4.5x better than branded content for service businesses. Always credit the original poster and add your own commentary.' },
      { priority: 'medium', title: 'Run Engagement Sticker Polls on Stories', desc: 'Interactive story features boost story retention by 40%. Use polls, quizzes, and countdown stickers for upcoming offers.', impact: '+30% story views',
        steps: ['Create 2-3 interactive Stories daily using sticker features', 'Use Polls: "Which hairstyle? 💇‍♀️" or "Hot take: Keratin > Smoothening?"', 'Use Quizzes: "Guess the price!" or "Which celeb had this haircut?"', 'Use Countdown stickers for upcoming offers or new service launches', 'Use Question stickers for "Ask me anything" sessions monthly'],
        metrics: [{value:'+40%', label:'Story Retention', color:'var(--green)'}, {value:'+30%', label:'Story Views', color:'var(--green)'}, {value:'2-3/day', label:'Interactive Stories', color:'var(--blue-light)'}, {value:'5x', label:'Reply Rate', color:'var(--text-primary)'}],
        timeline: '< 1 week', difficulty: 'Easy',
        tools: ['Instagram Stories', 'Canva Story Templates', 'Meta Business Suite'],
        proTip: 'Stories with interactive stickers get 3x more replies than static stories. Each reply boosts your account in the algorithm — more DMs = more reach.' },
      { priority: 'low', title: 'Optimize Bio & CTA Link', desc: 'Add a Linktree with booking link, price menu, and latest offers. Current bio lacks a compelling call-to-action.', impact: '+18% website click-through',
        steps: ['Create a Linktree or Bento page with 4-5 key links', 'Add links: Book Appointment, Price Menu, Current Offers, Google Reviews, WhatsApp', 'Rewrite bio: Clear value prop + location + CTA emoji', 'Add relevant category and action buttons (Book, Call, Email)', 'Update highlight covers with branded icons'],
        metrics: [{value:'+18%', label:'Click-through', color:'var(--green)'}, {value:'5', label:'Key Links', color:'var(--blue-light)'}, {value:'+12%', label:'Profile to Lead', color:'var(--green)'}, {value:'2 min', label:'Setup Time', color:'var(--text-primary)'}],
        timeline: '1-2 days', difficulty: 'Easy',
        tools: ['Linktree', 'Bento.me', 'Instagram Profile Settings'],
        proTip: 'A bio that includes "📍 [Location]" and a clear CTA ("Book below ⬇️") converts 22% better than generic descriptions.' },
    ]);
  });
}


// ════════════════════════════════════════════════════════════════
// ── PORTFOLIO / SCREENSHOT ANALYSIS ───────────────────────────
// ════════════════════════════════════════════════════════════════

let uploadedFiles = [];

// Upload Zone
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(files) {
  const maxFiles = 5;
  Array.from(files).slice(0, maxFiles - uploadedFiles.length).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    uploadedFiles.push(file);
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement('div');
      wrap.className = 'upload-preview';
      wrap.innerHTML = `<img src="${e.target.result}" alt="screenshot"/><button class="remove-btn" onclick="removeUpload(this)">✗</button>`;
      document.getElementById('uploadPreviews').appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });

  if (uploadedFiles.length > 0) {
    document.getElementById('analyzePortfolio').style.display = 'inline-flex';
  }
}

function removeUpload(btn) {
  const wrap = btn.parentElement;
  const idx = Array.from(document.getElementById('uploadPreviews').children).indexOf(wrap);
  uploadedFiles.splice(idx, 1);
  wrap.remove();
  if (uploadedFiles.length === 0) {
    document.getElementById('analyzePortfolio').style.display = 'none';
  }
}

function analyzePortfolio() {
  if (uploadedFiles.length === 0) return;

  simulateLoading('analyzePortfolio', () => {
    document.getElementById('portfolioResults').classList.add('show');

    const score = 62 + Math.floor(Math.random() * 20);

    renderKpis('portfolioKpis', [
      { label: 'UX Score', value: score, suffix: '/100', change: 'Needs improvement', changeDir: score >= 75 ? 'up' : 'down' },
      { label: 'Page Speed', value: 2.8, suffix: 's', change: 'Above 2s threshold', changeDir: 'down' },
      { label: 'Mobile Score', value: 58, suffix: '/100', change: 'Below standard', changeDir: 'down' },
      { label: 'SEO Score', value: 64, suffix: '/100', change: 'Missing meta tags', changeDir: 'down' },
      { label: 'Accessibility', value: 71, suffix: '/100', change: 'Fair rating', changeDir: 'up' },
      { label: 'CRO Potential', value: 38, suffix: '%', change: 'Significant upside', changeDir: 'up' },
    ]);

    renderChecklist('seoChecklist', [
      { label: 'Title tag present and optimized (50-60 chars)', status: 'pass' },
      { label: 'Meta description present (150-160 chars)', status: 'fail' },
      { label: 'H1 tag — single, descriptive heading', status: 'pass' },
      { label: 'Image alt text on all images', status: 'fail' },
      { label: 'Mobile-responsive viewport meta', status: 'pass' },
      { label: 'Structured data / Schema markup', status: 'fail' },
      { label: 'HTTPS enabled', status: 'pass' },
      { label: 'Canonical URL defined', status: 'warn' },
      { label: 'Open Graph tags for social sharing', status: 'fail' },
      { label: 'Fast load time (< 2 seconds)', status: 'warn' },
      { label: 'Internal linking structure', status: 'pass' },
      { label: 'XML Sitemap submitted', status: 'fail' },
    ]);

    setScoreRing('portfolioScoreRing', 'portfolioScoreNum', score);

    renderRecs('portfolioRecs', [
      { priority: 'high', title: 'Add Missing Meta Descriptions', desc: 'No meta description found. Search engines will auto-generate one which hurts CTR. Add compelling 150-160 character descriptions with target keywords.', impact: '+15-25% organic CTR',
        steps: ['Identify all pages missing meta descriptions', 'Write unique 150-160 char descriptions for each page', 'Include primary keyword naturally in each description', 'Add a clear CTA in the description (e.g. "Book your appointment today")', 'Verify using Google Search Console after deployment'],
        metrics: [{value:'+25%', label:'Organic CTR', color:'var(--green)'}, {value:'150-160', label:'Char Target', color:'var(--blue-light)'}, {value:'0', label:'Current Descriptions', color:'var(--red)'}, {value:'+30%', label:'Click Improvement', color:'var(--green)'}],
        timeline: '1-2 days', difficulty: 'Easy',
        tools: ['Yoast SEO', 'Google Search Console', 'SEMrush', 'Screaming Frog'],
        proTip: 'Write meta descriptions like ad copy — include the keyword, a benefit, and a CTA. Google bolds matching search terms in descriptions.' },
      { priority: 'high', title: 'Optimize Images — Add Alt Text & Compress', desc: 'Found 8+ images without alt text. Missing alt text hurts SEO and accessibility. Also compress images to WebP format to cut load time by ~40%.', impact: '-1.2s load time, +SEO boost',
        steps: ['Audit all images using Screaming Frog or manual check', 'Add descriptive alt text to 8+ images (include keywords naturally)', 'Convert all images to WebP format', 'Implement lazy loading for below-fold images', 'Set explicit width/height attributes to prevent layout shift', 'Compress remaining images to under 100KB each'],
        metrics: [{value:'-1.2s', label:'Load Time Cut', color:'var(--green)'}, {value:'8+', label:'Missing Alt Tags', color:'var(--red)'}, {value:'-40%', label:'File Size Reduction', color:'var(--green)'}, {value:'0.1', label:'CLS Improvement', color:'var(--blue-light)'}],
        timeline: '2-3 days', difficulty: 'Easy',
        tools: ['TinyPNG / Squoosh', 'Screaming Frog', 'WebP Converter', 'Lighthouse'],
        proTip: 'Use descriptive alt text like "bridal makeup before and after transformation" instead of generic labels like "image1.jpg". Google Image Search drives 20%+ of salon traffic.' },
      { priority: 'high', title: 'Implement Schema Markup', desc: 'No structured data detected. Add LocalBusiness schema, Service schema, and Review schema to enable rich snippets in search results.', impact: '+30% search visibility',
        steps: ['Add LocalBusiness JSON-LD schema to homepage', 'Add Service schema for each service offered', 'Add AggregateRating schema with review data', 'Add BreadcrumbList schema for navigation', 'Validate using Google Rich Results Test tool', 'Monitor in Google Search Console for errors'],
        metrics: [{value:'+30%', label:'Search Visibility', color:'var(--green)'}, {value:'3', label:'Schema Types', color:'var(--blue-light)'}, {value:'Rich Snippets', label:'Result Type', color:'var(--green)'}, {value:'+22%', label:'CTR from Rich', color:'var(--green)'}],
        timeline: '1-2 days', difficulty: 'Medium',
        tools: ['Google Rich Results Test', 'Schema.org', 'JSON-LD Generator', 'Google Search Console'],
        proTip: 'LocalBusiness schema with opening hours, price range, and reviews can trigger the Knowledge Panel on the right side of Google search results.' },
      { priority: 'medium', title: 'Improve Mobile Responsiveness', desc: 'Text elements overlap on mobile viewport. Fix responsive breakpoints, increase tap target sizes to 48px minimum, and test on multiple devices.', impact: '+20% mobile conversion rate',
        steps: ['Test on iPhone SE, iPhone 14, Samsung Galaxy, iPad', 'Fix overlapping text at 375px and 390px widths', 'Increase all tap targets (buttons, links) to minimum 48x48px', 'Ensure font size is minimum 16px to prevent iOS zoom', 'Fix horizontal scroll issues', 'Test hamburger menu and mobile navigation flow'],
        metrics: [{value:'+20%', label:'Mobile Conv. Rate', color:'var(--green)'}, {value:'48px', label:'Min Tap Target', color:'var(--blue-light)'}, {value:'16px', label:'Min Font Size', color:'var(--text-primary)'}, {value:'375px', label:'Min Width Test', color:'var(--text-primary)'}],
        timeline: '3-5 days', difficulty: 'Medium',
        tools: ['Chrome DevTools', 'BrowserStack', 'Lighthouse Mobile', 'PageSpeed Insights'],
        proTip: '70%+ of salon website traffic comes from mobile. Test the booking flow on mobile end-to-end — if it takes more than 3 taps to book, you\'re losing customers.' },
      { priority: 'medium', title: 'Add Clear Call-to-Action Above Fold', desc: 'No visible CTA in the hero section. Add a prominent "Book Now" or "Get Quote" button with contrasting color above the fold.', impact: '+25-40% conversion rate',
        steps: ['Add a prominent CTA button in the hero section', 'Use contrasting color (e.g. bright gold on dark, or blue on white)', 'CTA text: "Book Your Appointment" or "Get Free Quote"', 'Link directly to booking page or WhatsApp', 'Add a secondary CTA: "View Services" or "See Prices"', 'Add trust signals near CTA ("500+ happy clients", "4.5★ rated")'],
        metrics: [{value:'+35%', label:'Conv. Rate', color:'var(--green)'}, {value:'Above Fold', label:'CTA Placement', color:'var(--blue-light)'}, {value:'+40%', label:'Lead Increase', color:'var(--green)'}, {value:'2', label:'CTA Buttons', color:'var(--text-primary)'}],
        timeline: '1-2 days', difficulty: 'Easy',
        tools: ['Hotjar Heatmaps', 'Google Optimize', 'Figma'],
        proTip: 'Place the primary CTA where the eye naturally lands — top-right or center of the hero. Use action verbs ("Book", "Get", "Start") instead of passive ones ("Learn More").' },
      { priority: 'low', title: 'Submit XML Sitemap to Google Search Console', desc: 'No sitemap found. Generate and submit an XML sitemap to ensure all pages are indexed by Google.', impact: 'Faster indexing of new pages',
        steps: ['Generate sitemap using Yoast SEO or XML-Sitemaps.com', 'Verify all important URLs are included', 'Upload sitemap.xml to root directory of the website', 'Submit sitemap URL in Google Search Console', 'Check Coverage report for any indexing errors', 'Set up automatic sitemap updates for new content'],
        metrics: [{value:'All Pages', label:'Indexed', color:'var(--green)'}, {value:'<48h', label:'Index Speed', color:'var(--blue-light)'}, {value:'0', label:'Current Sitemaps', color:'var(--red)'}, {value:'Auto', label:'Update Frequency', color:'var(--text-primary)'}],
        timeline: '< 1 week', difficulty: 'Easy',
        tools: ['Google Search Console', 'XML-Sitemaps.com', 'Yoast SEO', 'Screaming Frog'],
        proTip: 'Submit your sitemap and then use the URL Inspection tool to request indexing for your most important pages individually — they\'ll get indexed within hours.' },
    ]);
  });
}


// ════════════════════════════════════════════════════════════════
// ── LOCAL SEO ANALYSIS ────────────────────────────────────────
// ════════════════════════════════════════════════════════════════

function analyzeSEO() {
  const biz = document.getElementById('seoBusinessName').value.trim();
  const loc = document.getElementById('seoLocation').value.trim();
  if (!biz || !loc) {
    if (!biz) document.getElementById('seoBusinessName').focus();
    else document.getElementById('seoLocation').focus();
    return;
  }

  simulateLoading('analyzeSeo', () => {
    document.getElementById('seoResults').classList.add('show');

    const seoScore = 55 + Math.floor(Math.random() * 25);

    renderKpis('seoKpis', [
      { label: 'SEO Score', value: seoScore, suffix: '/100', change: seoScore >= 70 ? 'Good standing' : 'Needs work', changeDir: seoScore >= 70 ? 'up' : 'down' },
      { label: 'GBP Completeness', value: 72, suffix: '%', change: 'Missing fields', changeDir: 'down' },
      { label: 'Local Pack Rank', value: 4.0, suffix: '', change: 'Not in top 3', changeDir: 'down' },
      { label: 'Review Count', value: 48, change: 'Below competitor avg', changeDir: 'down' },
      { label: 'Avg. Rating', value: 4.3, suffix: '★', change: 'Good rating', changeDir: 'up' },
      { label: 'Citations Found', value: 12, change: '5 inconsistent', changeDir: 'down' },
    ]);

    // GBP Checklist
    renderChecklist('gbpChecklist', [
      { label: 'Business name matches across all listings', status: 'pass' },
      { label: 'Address verified and consistent (NAP)', status: 'warn' },
      { label: 'Phone number verified', status: 'pass' },
      { label: 'Business hours updated', status: 'pass' },
      { label: 'Business description (750 chars)', status: 'fail' },
      { label: 'Primary category set correctly', status: 'pass' },
      { label: 'Secondary categories added (3+)', status: 'fail' },
      { label: 'Services / Menu listed', status: 'warn' },
      { label: 'Photos uploaded (20+)', status: 'fail' },
      { label: 'Google Posts published weekly', status: 'fail' },
      { label: 'Q&A section populated', status: 'fail' },
      { label: 'Booking link added', status: 'pass' },
    ]);

    setScoreRing('seoScoreRing', 'seoScoreNum', seoScore);

    // Keyword Rankings Table
    const keywords = [
      { kw: `best ${biz.toLowerCase().includes('salon') ? 'salon' : 'business'} in ${loc}`, rank: 8, vol: '2,400', diff: 'Medium', trend: 'up' },
      { kw: `${biz.toLowerCase().includes('salon') ? 'bridal makeup' : 'services'} ${loc}`, rank: 12, vol: '1,800', diff: 'High', trend: 'up' },
      { kw: `${biz.toLowerCase().includes('salon') ? 'hair salon' : biz.split(' ')[0].toLowerCase()} near me`, rank: 5, vol: '6,200', diff: 'High', trend: 'up' },
      { kw: `${biz.toLowerCase().includes('salon') ? 'keratin treatment' : 'premium service'} ${loc}`, rank: 15, vol: '890', diff: 'Low', trend: 'down' },
      { kw: `top rated ${biz.toLowerCase().includes('salon') ? 'beauty parlour' : 'company'} ${loc}`, rank: 18, vol: '1,200', diff: 'Medium', trend: 'down' },
      { kw: `${biz.toLowerCase().includes('salon') ? 'facial spa' : 'consultation'} near ${loc}`, rank: 9, vol: '1,600', diff: 'Medium', trend: 'up' },
    ];

    document.querySelector('#seoKeywordTable tbody').innerHTML = keywords.map(k => {
      const rankClass = k.rank <= 3 ? 'badge-green' : k.rank <= 10 ? 'badge-blue' : k.rank <= 20 ? 'badge-orange' : 'badge-red';
      const diffClass = k.diff === 'Low' ? 'badge-green' : k.diff === 'Medium' ? 'badge-orange' : 'badge-red';
      return `
        <tr>
          <td><strong>${k.kw}</strong></td>
          <td><span class="badge ${rankClass}">#${k.rank}</span></td>
          <td>${k.vol}</td>
          <td><span class="badge ${diffClass}">${k.diff}</span></td>
          <td><span style="color:${k.trend === 'up' ? 'var(--green)' : 'var(--red)'};font-weight:600">${k.trend === 'up' ? '↑ Rising' : '↓ Falling'}</span></td>
        </tr>
      `;
    }).join('');

    // Competitors
    const competitors = [
      { name: `🏆 ${biz}`, reviews: 48, rating: 4.3, photos: 24, posts: 2 },
      { name: '🥈 Competitor A — StyleCraft Studio', reviews: 128, rating: 4.6, photos: 85, posts: 8 },
      { name: '🥉 Competitor B — Urban Glow Salon', reviews: 92, rating: 4.4, photos: 62, posts: 5 },
      { name: 'Competitor C — Luxe Beauty Lounge', reviews: 76, rating: 4.2, photos: 38, posts: 3 },
    ];

    document.getElementById('competitorGrid').innerHTML = competitors.map((c, i) => `
      <div class="comp-card" style="${i === 0 ? 'border-color:var(--blue);background:rgba(37,99,235,0.05)' : ''}">
        <div class="comp-name">${c.name}</div>
        <div class="comp-stat"><span class="label">Reviews</span><span class="value ${c.reviews < 60 ? 'style=color:var(--red)' : ''}">${c.reviews}</span></div>
        <div class="comp-stat"><span class="label">Rating</span><span class="value">${c.rating}★</span></div>
        <div class="comp-stat"><span class="label">Photos</span><span class="value ${c.photos < 30 ? 'style=color:var(--orange)' : ''}">${c.photos}</span></div>
        <div class="comp-stat"><span class="label">Posts/Month</span><span class="value">${c.posts}</span></div>
      </div>
    `).join('');

    // Review Sentiment Chart
    destroyChart('sentimentChart');
    chartInstances['sentimentChart'] = new Chart(document.getElementById('sentimentChart'), {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { label: 'Positive', data: [8, 6, 9, 7, 10, 8], backgroundColor: chartColors.green, borderRadius: 4 },
          { label: 'Neutral', data: [2, 3, 1, 2, 1, 3], backgroundColor: chartColors.orange, borderRadius: 4 },
          { label: 'Negative', data: [1, 0, 1, 2, 0, 1], backgroundColor: chartColors.red, borderRadius: 4 },
        ],
      },
      options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { labels: { color: '#7c8298', font: { family: 'Inter', size: 11 } } } } },
    });

    // Citation Consistency Chart
    destroyChart('citationChart');
    chartInstances['citationChart'] = new Chart(document.getElementById('citationChart'), {
      type: 'doughnut',
      data: {
        labels: ['Consistent', 'Inconsistent Name', 'Inconsistent Address', 'Inconsistent Phone', 'Missing'],
        datasets: [{
          data: [7, 2, 1, 2, 3],
          backgroundColor: [chartColors.green, chartColors.orange, chartColors.red, chartColors.purple, '#4b5563'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#7c8298', font: { family: 'Inter', size: 10 }, padding: 8 } } },
        cutout: '60%',
      },
    });

    // SEO Recommendations
    renderRecs('seoRecs', [
      { priority: 'high', title: 'Fix NAP Inconsistencies Across Citations', desc: `Found 5 directories with inconsistent business name, address, or phone. Update listings on JustDial, Sulekha, IndiaMART, Yellow Pages, and Yelp to match your GBP exactly.`, impact: '+15-20% local pack visibility',
        steps: ['Export current NAP data from Google Business Profile', 'Audit all 12 citations found — identify the 5 with mismatches', 'Log into JustDial, Sulekha, IndiaMART, Yellow Pages, Yelp', 'Update business name, address, and phone to match GBP exactly', 'Use same formatting everywhere ("Road" vs "Rd", etc.)', 'Re-verify after 2-4 weeks and check for new inconsistencies'],
        metrics: [{value:'5', label:'Inconsistent Listings', color:'var(--red)'}, {value:'+20%', label:'Local Visibility', color:'var(--green)'}, {value:'100%', label:'NAP Match Goal', color:'var(--blue-light)'}, {value:'12', label:'Total Citations', color:'var(--text-primary)'}],
        timeline: '1-2 weeks', difficulty: 'Medium',
        tools: ['Moz Local', 'BrightLocal', 'Whitespark Citation Finder'],
        proTip: 'Google cross-references your NAP across the web. Even minor differences like "1st Floor" vs "First Floor" can hurt your local ranking.' },
      { priority: 'high', title: 'Increase Google Reviews to 100+', desc: `Currently at 48 reviews vs competitors averaging 99. Implement a review request workflow: send WhatsApp/SMS after each appointment with a direct review link.`, impact: '+2-3 positions in local pack',
        steps: ['Generate your Google Review direct link from GBP', 'Create a WhatsApp template: "Thank you for visiting! We\'d love your feedback 🙏 [link]"', 'Train receptionist to send review request within 1 hour of service', 'Print QR code cards for in-salon placement', 'Respond to every existing review (positive and negative)', 'Set a weekly goal: 5 new reviews per week'],
        metrics: [{value:'48→100+', label:'Review Target', color:'var(--green)'}, {value:'5/week', label:'New Reviews Goal', color:'var(--blue-light)'}, {value:'+3', label:'Local Pack Positions', color:'var(--green)'}, {value:'100%', label:'Response Rate Goal', color:'var(--text-primary)'}],
        timeline: '2-3 months', difficulty: 'Easy',
        tools: ['Google Business Profile', 'WhatsApp Business', 'QR Code Generator', 'Review Link Generator'],
        proTip: 'Timing is everything — Send the review request within 1 hour of their visit when the experience is fresh. Response rate drops 80% after 24 hours.' },
      { priority: 'high', title: 'Complete GBP Profile — Add Photos & Posts', desc: `Upload 50+ high-quality photos (interior, services, team, before/after). Publish Google Posts weekly with offers and updates. Competitors have 3x your photo count.`, impact: '+40% GBP engagement',
        steps: ['Take professional photos: interior (5+), exterior (3+), team (5+), services in action (10+)', 'Capture before/after transformations (10+ sets)', 'Upload all photos with descriptive filenames and geo-tags', 'Create a Google Post every week: offers, new services, events', 'Add a cover photo and logo in correct dimensions', 'Add 360° virtual tour if possible (huge differentiator)'],
        metrics: [{value:'24→50+', label:'Photo Target', color:'var(--green)'}, {value:'1/week', label:'Google Posts', color:'var(--blue-light)'}, {value:'+40%', label:'GBP Engagement', color:'var(--green)'}, {value:'3x', label:'Competitor Gap', color:'var(--red)'}],
        timeline: '1-2 weeks', difficulty: 'Easy',
        tools: ['Google Business Profile', 'Canva', 'Google Street View App', 'DSLR / iPhone Pro'],
        proTip: 'Businesses with 100+ photos get 520% more calls and 2,717% more direction requests than average. Quality and quantity both matter.' },
      { priority: 'medium', title: `Create Location-Specific Landing Pages`, desc: `Build dedicated pages targeting "${loc}" with location-specific content, embedded Google Map, local testimonials, and area-specific keywords.`, impact: '+25% organic traffic from local searches',
        steps: [`Create a dedicated page: "Best Salon in ${loc}"`, 'Include location in title tag, H1, meta description, and body text', `Embed Google Maps iframe for ${loc} location`, 'Add 3-5 local client testimonials with names and areas', 'Include "Areas We Serve" section with nearby neighborhoods', `Add local schema markup with ${loc} address`],
        metrics: [{value:'+25%', label:'Local Traffic', color:'var(--green)'}, {value:'1', label:'Pages to Create', color:'var(--blue-light)'}, {value:'Top 5', label:'Ranking Target', color:'var(--green)'}, {value:'+15', label:'Keywords Covered', color:'var(--text-primary)'}],
        timeline: '1 week', difficulty: 'Medium',
        tools: ['WordPress/HTML', 'Google Maps Embed', 'Yoast SEO', 'Schema Markup Generator'],
        proTip: `Include the pattern "[Service] in ${loc}" throughout the page naturally. Google\'s Helpful Content Update rewards pages that genuinely serve local searchers.` },
      { priority: 'medium', title: 'Add Secondary GBP Categories', desc: `Only 1 primary category set. Add 3-5 secondary categories (e.g. "Beauty Salon", "Hair Care", "Bridal Makeup Artist", "Spa") to appear in more relevant searches.`, impact: '+20% impression share',
        steps: ['Log into Google Business Profile', 'Keep primary category as your main service', 'Add secondary categories: Beauty Salon, Hair Care, Bridal Makeup Artist, Spa, Skin Care Clinic', 'Research competitor categories using GBP tools', 'Monitor impression share changes in GBP Insights', 'Update categories seasonally (add "Gift Shop" for festivals)'],
        metrics: [{value:'1→5+', label:'Categories', color:'var(--green)'}, {value:'+20%', label:'Impression Share', color:'var(--green)'}, {value:'5', label:'Categories to Add', color:'var(--blue-light)'}, {value:'+12', label:'New Search Matches', color:'var(--text-primary)'}],
        timeline: '1-2 days', difficulty: 'Easy',
        tools: ['Google Business Profile', 'PlePer GBP Tool', 'GMB Spy Chrome Extension'],
        proTip: 'Use the GMB Spy extension to see what categories your top-ranking competitors use — this reveals categories that Google associates with strong local performance.' },
      { priority: 'low', title: 'Build Local Backlinks', desc: `Get listed on local ${loc} business directories, partner with nearby businesses for cross-promotion, and sponsor local events for backlink opportunities.`, impact: '+Domain authority, long-term ranking boost',
        steps: [`Submit to ${loc} local business directories and chamber of commerce`, 'Partner with complementary businesses (wedding planners, photographers) for link exchanges', 'Sponsor local events, college festivals, or community programs', 'Write guest posts for local blogs or news sites', 'Get featured in "Best of ${loc}" roundup articles', 'Create linkable assets (style guides, trend reports) on your website'],
        metrics: [{value:'10+', label:'Backlink Target', color:'var(--blue-light)'}, {value:'+5', label:'Domain Authority', color:'var(--green)'}, {value:'3-6 mo', label:'Time to Results', color:'var(--orange)'}, {value:'Local', label:'Link Type Focus', color:'var(--text-primary)'}],
        timeline: '3-6 months', difficulty: 'Hard',
        tools: ['Ahrefs', 'Moz Link Explorer', 'HARO', 'Local Directories'],
        proTip: 'One quality backlink from a local news site or chamber of commerce is worth more than 50 directory links. Focus on relationship-building over mass submissions.' },
    ]);
  });
}
