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

// ── RAG / Knowledge Base & Archetypes ───────────────────────
const KNOWLEDGE_BASE = {
  "glam luxe": {
    brand: "Glam Luxe Signature Salon",
    type: "SALON_SPA",
    location: "RR Nagar, Bangalore",
    meta: { followers: 14800, reach: 186400, engagement: 4.2, website_clicks: 2340, profile_visits: 8920, saves: 1560 },
    seo: { score: 78.0, gbp_completeness: 72.0, review_count: 48, rating: 4.3, citations: 12.0 },
    recs: [
        { priority: 'high', title: 'Fix NAP Inconsistencies', desc: 'Found 5 directories with inconsistent business name, address, or phone.', impact: '+15-20% local pack visibility' },
        { priority: 'high', title: 'Increase Reviews to 100+', desc: 'Currently at 48 reviews vs competitors averaging 99.', impact: '+2-3 positions in local pack' }
    ]
  }
};

const ARCHETYPES = {
  "SALON_SPA": {
    name: "Beauty & Wellness",
    meta: { followers: [5000, 20000], reach: [50000, 250000], engagement: [3.5, 6.0], cpc: [2, 5] },
    keywords: ["salon", "spa", "makeup", "hair", "beauty", "wellness", "bridal", "parlour"],
    recs: [
      { 
        title: "Double Down on Reels", 
        desc: "Transformation videos (Before/After) generate 4x more bookings than static images in the beauty sector.", 
        impact: "+45% booking rate",
        steps: ["Film 15s transformation reels", "Use trending 'satisfying' audio", "Add location tags in captions"],
        metrics: [{value: "4x", label: "Conv. Rate", color: "var(--green)"}, {value: "15s", label: "Max Length", color: "var(--blue-light)"}],
        timeline: "1 week", difficulty: "Medium", tools: ["CapCut", "Instagram Reels"]
      },
      {
        title: "UGC Transformation Wall",
        desc: "Encourage clients to post their new look. Tagging your biz builds instant social proof.",
        impact: "+30% referral footfall",
        steps: ["Create a 'Selfie Spot' in salon", "Offer 5% discount for story tags", "Repost 3+ tags weekly"],
        metrics: [{value: "30%", label: "Referral Lift", color: "var(--green)"}, {value: "3/wk", label: "Repost Goal", color: "var(--cyan)"}],
        timeline: "2 weeks", difficulty: "Easy", tools: ["Instagram", "Ring Light"]
      }
    ]
  },
  "RETAIL_ECOMMERCE": {
    name: "Retail & E-commerce",
    meta: { followers: [10000, 100000], reach: [100000, 500000], engagement: [1.2, 3.0], cpc: [8, 25] },
    keywords: ["store", "shop", "ecommerce", "product", "buy", "fashion", "clothes", "retail"],
    recs: [
      {
        title: "Dynamic Catalog Retargeting",
        desc: "Show exactly what users left in their cart. Retail ROAS often doubles with DABA campaigns.",
        impact: "+2.5x ROAS",
        steps: ["Set up Meta Pixel / CAPI", "Run Advantage+ Catalog Ads", "Exclude past 30-day purchasers"],
        metrics: [{value: "2.5x", label: "ROAS Target", color: "var(--green)"}, {value: "7 days", label: "Retarget Window", color: "var(--blue-light)"}],
        timeline: "3 days", difficulty: "Medium", tools: ["Meta Events Manager", "Shopify/Woo"]
      },
      {
        title: "Optimize PDP Hero Shots",
        desc: "High-quality lifestyle images convert 22% better than plain white backgrounds for fashion/retail.",
        impact: "+18% Add-to-Cart rate",
        steps: ["A/B test product vs lifestyle shots", "Implement zoom-on-hover", "Add user review photos to PDP"],
        metrics: [{value: "22%", label: "Conv. Boost", color: "var(--green)"}, {value: "1.2s", label: "LCP Spec", color: "var(--cyan)"}],
        timeline: "1 month", difficulty: "Hard", tools: ["Midjourney", "Lighthouse"]
      }
    ]
  },
  "B2B_SAAS": {
    name: "B2B & Software",
    meta: { followers: [2000, 15000], reach: [20000, 100000], engagement: [0.8, 2.5], cpc: [40, 150] },
    keywords: ["software", "saas", "agency", "tech", "platform", "b2b", "solution", "enterprise"],
    recs: [
      {
        title: "High-Value Lead Magnets",
        desc: "Whitepapers and industry reports drive 3x more qualified MQLs than generic 'Book Demo' CTAs.",
        impact: "+40% MQL volume",
        steps: ["Identify top customer pain point", "Create 5-page PDF solution guide", "Run LinkedIn lead gen ads"],
        metrics: [{value: "3x", label: "MQL Multiplier", color: "var(--green)"}, {value: "₹450", label: "Target CPL", color: "var(--blue-light)"}],
        timeline: "2 weeks", difficulty: "Medium", tools: ["LinkedIn Ads", "HubSpot"]
      },
      {
        title: "LinkedIn Thought Leadership",
        desc: "Founder-led content has 2x reach compared to company pages in B2B tech.",
        impact: "+50% brand authority",
        steps: ["Post 3x weekly from founder account", "Share 'Behind the Build' insights", "Engage with 10+ industry peers daily"],
        metrics: [{value: "2x", label: "Reach vs Page", color: "var(--green)"}, {value: "3/wk", label: "Post Freq", color: "var(--cyan)"}],
        timeline: "Ongoing", difficulty: "Medium", tools: ["Taplio", "LinkedIn"]
      }
    ]
  },
  "MEDICAL_HEALTH": {
    name: "Medical & Health",
    meta: { followers: [1000, 5000], reach: [10000, 50000], engagement: [2.0, 4.5], cpc: [15, 60] },
    keywords: ["clinic", "doctor", "health", "hospital", "dentist", "medical", "physio", "pharmacy"],
    recs: [
      {
        title: "E-A-T Content Strategy",
        desc: "Google prioritizes 'Expertise, Authoritativeness, Trust' for health queries. Doctor-authored blogs are essential.",
        impact: "Rank #1 for local medical queries",
        steps: ["Get doctor-verified blog posts", "Add staff credentials to About page", "Ensure all HIPAA compliance labels"],
        metrics: [{value: "Top 3", label: "Map Ranking", color: "var(--green)"}, {value: "Expert", label: "Trust Score", color: "var(--blue-light)"}],
        timeline: "3 months", difficulty: "Hard", tools: ["Google Search Console", "SurferSEO"]
      },
      {
        title: "Video Patient Testimonials",
        desc: "Nothing builds trust like a video of a happy patient. 70% of patients check reviews before booking.",
        impact: "+50% consultation bookings",
        steps: ["Request video reviews from top patients", "Caption for privacy & clarity", "Embed on homepage hero"],
        metrics: [{value: "70%", label: "Check Reviews", color: "var(--green)"}, {value: "+50%", label: "Booking Lift", color: "var(--cyan)"}],
        timeline: "1 month", difficulty: "Medium", tools: ["Wistia", "Testimonial.to"]
      }
    ]
  }
};

function getContext(query) {
  const q = query.toLowerCase();
  // 1. Check for specific brand in Knowledge Base
  const brandKey = Object.keys(KNOWLEDGE_BASE).find(k => q.includes(k));
  if (brandKey) return { ...KNOWLEDGE_BASE[brandKey], contextType: "Brand-Specific (RAG)" };

  // 2. Check for industry archetype
  for (const type in ARCHETYPES) {
    if (ARCHETYPES[type].keywords.some(kw => q.includes(kw))) {
      return { ...ARCHETYPES[type], type, contextType: `${ARCHETYPES[type].name} Archetype` };
    }
  }

  // 3. Default fallback
  return { type: "GENERAL", contextType: "General Business Context" };
}

function randRange(range) {
  return (range[0] + Math.random() * (range[1] - range[0])).toFixed(range[1] < 10 ? 1 : 0);
}

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
    // Build action steps
    const stepsHtml = (r.steps || []).map((s, si) => `
      <li style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;font-size:.78rem;color:#9ca3af;line-height:1.6;">
        <span style="width:22px;height:22px;border-radius:50%;background:rgba(37,99,235,0.15);color:#60a5fa;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0;margin-top:2px;">${si + 1}</span>
        <span>${s}</span>
      </li>
    `).join('');

    // Build metrics
    const metricsHtml = (r.metrics || []).map(m => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;text-align:center;">
        <div style="font-family:'Outfit',sans-serif;font-size:1.15rem;font-weight:700;color:${m.color || '#e8eaf0'};line-height:1;">${m.value}</div>
        <div style="font-size:.6rem;color:#454b63;text-transform:uppercase;letter-spacing:1px;margin-top:5px;font-weight:600;">${m.label}</div>
      </div>
    `).join('');

    // Build tools tags
    const toolsHtml = (r.tools || []).map(t => `
      <span style="padding:4px 12px;border-radius:6px;font-size:.7rem;font-weight:600;background:rgba(37,99,235,0.12);color:#60a5fa;border:1px solid rgba(37,99,235,0.2);display:inline-block;">${t}</span>
    `).join('');

    // Timeline colors
    const tlColor = r.timeline === '1-2 days' || (r.timeline||'').includes('< 1') ? '#22c55e' : (r.timeline || '').includes('week') ? '#f59e0b' : '#ef4444';
    const diffColor = r.difficulty === 'Easy' ? '#22c55e' : r.difficulty === 'Medium' ? '#f59e0b' : '#ef4444';

    return `
    <li class="rec-item" onclick="this.classList.toggle('expanded')" style="cursor:pointer;flex-wrap:wrap;">
      <div class="rec-priority ${r.priority}">${r.priority === 'high' ? '!' : r.priority === 'medium' ? '!!' : '✓'}</div>
      <div class="rec-content" style="flex:1;">
        <h5 style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          ${r.title}
          <svg width="10" height="6" viewBox="0 0 10 6" style="margin-left:auto;flex-shrink:0;transition:transform .3s ease;fill:#454b63;" class="rec-arrow"><path d="M1 1l4 4 4-4"/></svg>
        </h5>
        <p>${r.desc}</p>
        <div class="rec-impact">⚡ Expected impact: ${r.impact}</div>

        <div class="rec-detail" style="display:none;width:100%;margin-top:16px;padding-top:16px;border-top:1px solid rgba(37,99,235,0.1);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            
            ${stepsHtml ? `
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:16px;">
              <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#454b63;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                📋 Action Steps
              </div>
              <ul style="list-style:none;padding:0;margin:0;">${stepsHtml}</ul>
            </div>` : ''}

            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:16px;">
              <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#454b63;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                📊 Projected Metrics
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${metricsHtml}</div>
              ${r.timeline ? `
              <div style="display:flex;align-items:center;gap:8px;font-size:.78rem;color:#9ca3af;margin-top:14px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${tlColor};flex-shrink:0;"></span>
                <span><strong style="color:#e8eaf0;">Timeline:</strong> ${r.timeline}</span>
              </div>` : ''}
              ${r.difficulty ? `
              <div style="display:flex;align-items:center;gap:8px;font-size:.78rem;color:#9ca3af;margin-top:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${diffColor};flex-shrink:0;"></span>
                <span><strong style="color:#e8eaf0;">Difficulty:</strong> ${r.difficulty}</span>
              </div>` : ''}
            </div>
          </div>

          ${toolsHtml ? `
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin-top:12px;">
            <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#454b63;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
              🔧 Recommended Tools
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">${toolsHtml}</div>
          </div>` : ''}

          ${r.proTip ? `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.15);border-radius:10px;font-size:.78rem;color:#60a5fa;line-height:1.6;margin-top:12px;">
            <span style="font-size:1.1rem;flex-shrink:0;margin-top:1px;">💡</span>
            <span><strong>Pro Tip:</strong> ${r.proTip}</span>
          </div>` : ''}
        </div>
      </div>
    </li>`;
  }).join('');

  // Add expand/collapse CSS toggle via JS
  c.querySelectorAll('.rec-item').forEach(item => {
    const detail = item.querySelector('.rec-detail');
    const arrow = item.querySelector('.rec-arrow');
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = item.classList.contains('expanded');
      // Close all other items in this list
      c.querySelectorAll('.rec-item.expanded').forEach(other => {
        if (other !== item) {
          other.classList.remove('expanded');
          other.querySelector('.rec-detail').style.display = 'none';
          const otherArrow = other.querySelector('.rec-arrow');
          if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
        }
      });
      if (isExpanded) {
        detail.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      } else {
        detail.style.display = 'block';
        detail.style.animation = 'detailFade .3s ease';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
    });
  });
  // Remove the onclick from li since we use addEventListener now
  c.querySelectorAll('.rec-item').forEach(item => {
    item.removeAttribute('onclick');
  });
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

function showContextInfo(containerId, ctx) {
    const c = document.getElementById(containerId);
    let existing = c.querySelector('.context-info-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.className = 'context-info-bar';
    bar.innerHTML = `
        <div class="context-pill">
            <span class="material-symbols-outlined">psychology</span>
            <span><strong>Neural Context:</strong> ${ctx.contextType}</span>
        </div>
        ${ctx.brand ? `<div class="context-pill">
            <span class="material-symbols-outlined">verified</span>
            <span><strong>Brand Found:</strong> ${ctx.brand}</span>
        </div>` : ''}
    `;
    c.prepend(bar);
    showKnowledgeBadge(ctx.contextType);
}

function showKnowledgeBadge(type) {
    const badge = document.createElement('div');
    badge.className = 'rag-badge';
    badge.innerHTML = `<span class="material-symbols-outlined">psychology</span> RAG Active: ${type}`;
    document.body.appendChild(badge);
    setTimeout(() => badge.classList.add('show'), 100);
    setTimeout(() => {
        badge.classList.remove('show');
        setTimeout(() => badge.remove(), 500);
    }, 4000);
}

// ════════════════════════════════════════════════════════════════
// ── GOOGLE ADS ANALYSIS ───────────────────────────────────────
// ════════════════════════════════════════════════════════════════

function analyzeGoogleAds() {
  const input = document.getElementById('googleAdsInput').value.trim();
  if (!input) { document.getElementById('googleAdsInput').focus(); return; }

  const ctx = getContext(input);

  simulateLoading('analyzeGoogle', () => {
    document.getElementById('googleResults').classList.add('show');
    showContextInfo('googleResults', ctx);

    // KPIs
    const archetype = ARCHETYPES[ctx.type] || ARCHETYPES.SALON_SPA;
    const isBrand = ctx.contextType.includes('Brand');

    renderKpis('googleKpis', [
      { label: 'Total Spend', value: isBrand && ctx.google ? ctx.google.spend : 48520, prefix: '₹', change: '12.4% vs last month', changeDir: 'up' },
      { label: 'Impressions', value: isBrand && ctx.google ? ctx.google.imp : 284300, change: '18.2% vs last month', changeDir: 'up' },
      { label: 'Clicks', value: isBrand && ctx.google ? ctx.google.clicks : 12840, change: '8.7% vs last month', changeDir: 'up' },
      { label: 'Avg. CPC', value: archetype.meta.cpc[0], prefix: '₹', change: 'Market Avg', changeDir: 'up' },
      { label: 'Conversions', value: isBrand && ctx.google ? ctx.google.conv : 342, change: '15.6% vs last month', changeDir: 'up' },
      { label: 'ROAS', value: 3.2, suffix: 'x', change: 'Good performance', changeDir: 'up' },
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
    const defaultRecs = [
      { priority: 'high', title: 'Add Negative Keywords', desc: 'Block irrelevant search terms like "jobs" or "training" to prevent wasted spend.', impact: 'Save budget, improve ROAS' },
      { priority: 'high', title: 'Increase Budget on Top Converters', desc: 'Identify your best performing campaigns and increase budget by 20-30%.', impact: '+25% conversions' },
      { priority: 'medium', title: 'Optimize Ad Extensions', desc: 'Add location and callout extensions to improve ad rank and CTR.', impact: '+15% CTR boost' }
    ];

    const archetypeRecs = (archetype.recs || []).map(r => ({ priority: 'medium', ...r }));

    renderRecs('googleRecs', isBrand && ctx.recs ? ctx.recs : [...defaultRecs, ...archetypeRecs].slice(0, 5));
  });
}


// ════════════════════════════════════════════════════════════════
// ── META / INSTAGRAM ANALYSIS ──────────────────────────────────
// ════════════════════════════════════════════════════════════════

function analyzeMetaAds() {
  const input = document.getElementById('metaInput').value.trim();
  if (!input) { document.getElementById('metaInput').focus(); return; }

  const ctx = getContext(input);

  simulateLoading('analyzeMeta', () => {
    document.getElementById('metaResults').classList.add('show');
    showContextInfo('metaResults', ctx);

    const archetype = ARCHETYPES[ctx.type] || ARCHETYPES.SALON_SPA;
    const isBrand = ctx.contextType.includes('Brand');

    renderKpis('metaKpis', [
      { label: 'Followers', value: isBrand ? ctx.meta.followers : randRange(archetype.meta.followers), change: '+420 this month', changeDir: 'up' },
      { label: 'Reach', value: isBrand ? ctx.meta.reach : randRange(archetype.meta.reach), change: '22.5% vs last month', changeDir: 'up' },
      { label: 'Engagement Rate', value: isBrand ? ctx.meta.engagement : randRange(archetype.meta.engagement), suffix: '%', change: '0.6% improvement', changeDir: 'up' },
      { label: 'Website Clicks', value: isBrand ? ctx.meta.website_clicks : 2340, change: '18.3% vs last month', changeDir: 'up' },
      { label: 'Profile Visits', value: isBrand ? ctx.meta.profile_visits : 8920, change: '14.1% vs last month', changeDir: 'up' },
      { label: 'Saves', value: isBrand ? ctx.meta.saves : 1560, change: '32.4% vs last month', changeDir: 'up' },
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

    // AI Recommendations
    const defaultMetaRecs = [
      { priority: 'high', title: 'Double Down on Reels', desc: 'Video content generates 3.2x more engagement than static posts.', impact: '+45-60% reach increase' },
      { priority: 'high', title: 'Optimize Posting Times', desc: 'Your audience is most active in the evenings. Schedule posts for 6-9 PM.', impact: '+25% engagement' },
      { priority: 'medium', title: 'UGC Campaign', desc: 'User-generated content builds 2.8x more trust than branded assets.', impact: '+35% saves' }
    ];

    const archetypeMetaRecs = (archetype.recs || []).map(r => ({ priority: 'medium', ...r }));

    renderRecs('metaRecs', isBrand && ctx.recs ? ctx.recs : [...defaultMetaRecs, ...archetypeMetaRecs].slice(0, 5));
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
        tools: ['TinyPNG / Squoosh', 'WebP Converter', 'Lighthouse'],
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

  const ctx = getContext(biz) || getContext(loc);

  simulateLoading('analyzeSeo', () => {
    document.getElementById('seoResults').classList.add('show');
    showContextInfo('seoResults', ctx);

    const archetype = ARCHETYPES[ctx.type] || ARCHETYPES.SALON_SPA;
    const isBrand = ctx.contextType.includes('Brand');

    const seoScore = isBrand ? ctx.seo.score : 55 + Math.floor(Math.random() * 25);

    renderKpis('seoKpis', isBrand ? [
      { label: 'SEO Score', value: ctx.seo.score, suffix: '/100', change: 'Expert Audited', changeDir: 'up' },
      { label: 'GBP Completeness', value: ctx.seo.gbp_completeness, suffix: '%', change: 'Missing fields', changeDir: 'down' },
      { label: 'Local Pack Rank', value: 4.0, suffix: '', change: 'Not in top 3', changeDir: 'down' },
      { label: 'Review Count', value: ctx.seo.review_count, change: 'Below competitor avg', changeDir: 'down' },
      { label: 'Avg. Rating', value: ctx.seo.rating, suffix: '★', change: 'Good rating', changeDir: 'up' },
      { label: 'Citations Found', value: ctx.seo.citations, change: 'NAP issues detected', changeDir: 'down' },
    ] : [
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

    document.querySelector('#seoKeywordTable tbody').innerHTML = (ctx ? ctx.seo.keywords : keywords).map(k => {
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
    const defaultCompetitors = [
      { name: `🏆 ${biz}`, reviews: 48, rating: 4.3, photos: 24, posts: 2 },
      { name: '🥈 StyleCraft Studio', reviews: 128, rating: 4.6, photos: 85, posts: 8 },
      { name: '🥉 Urban Glow Salon', reviews: 92, rating: 4.4, photos: 62, posts: 5 },
    ];

    document.getElementById('competitorGrid').innerHTML = (ctx && ctx.seo && ctx.seo.competitors ? ctx.seo.competitors : defaultCompetitors).map((c, i) => `
      <div class="comp-card" style="${i === 0 ? 'border-color:var(--blue);background:rgba(37,99,235,0.05)' : ''}">
        <div class="comp-name">${c.name}</div>
        <div class="comp-stat"><span class="label">Reviews</span><span class="value">${c.reviews}</span></div>
        <div class="comp-stat"><span class="label">Rating</span><span class="value">${c.rating}★</span></div>
        <div class="comp-stat"><span class="label">Photos</span><span class="value">${c.photos}</span></div>
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
      options: chartDefaults,
    });

    // Citation Consistency Chart
    destroyChart('citationChart');
    chartInstances['citationChart'] = new Chart(document.getElementById('citationChart'), {
      type: 'doughnut',
      data: {
        labels: ['Consistent', 'Inconsistent', 'Missing'],
        datasets: [{
          data: [7, 3, 2],
          backgroundColor: [chartColors.green, chartColors.orange, '#4b5563'],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%' },
    });

    // AI Recommendations
    const defaultSeoRecs = [
      { priority: 'high', title: 'Fix NAP Inconsistencies', desc: 'Found mismatches in your Business Name, Address, or Phone across directories.', impact: '+15-20% local pack visibility' },
      { priority: 'high', title: 'Review Growth Strategy', desc: 'You need ~50 more reviews to catch up with top competitors.', impact: '+2-3 positions in local pack' }
    ];

    const archetypeSeoRecs = (archetype.recs || []).map(r => ({ priority: 'medium', ...r }));

    renderRecs('seoRecs', isBrand && ctx.recs ? ctx.recs : [...defaultSeoRecs, ...archetypeSeoRecs].slice(0, 5));
  });
}
