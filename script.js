
async function loadData() {
  try {
    const res = await fetch('probabilities.json', { cache: 'no-store' });
    const data = await res.json();
    render(data);
  } catch (e) {
    console.error('Failed to load probabilities.json', e);
  }
}

function render(data) {
  // Header
  const subtitleEl = document.getElementById('subtitle');
  subtitleEl.textContent = new Date(data.metadata?.last_updated_iso || Date.now()).toLocaleString();

  // KPIs
  document.getElementById('median').textContent = data.derived?.median_days ?? '—';
  document.getElementById('mean').textContent = data.derived?.mean_days ?? '—';
  document.getElementById('withinWeek').textContent = (data.derived?.chance_end_within_week_percent ?? '—') + (data.derived?.chance_end_within_week_percent ? '%' : '');

  // Buckets table
  const tbody = document.getElementById('bucket-rows');
  tbody.innerHTML = '';
  (data.buckets || []).forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.range}</td><td>${b.prob}%</td>`;
    tbody.appendChild(tr);
  });

  // Daily tracker
  const dbody = document.getElementById('daily-rows');
  dbody.innerHTML = '';
  (data.daily_tracker || []).forEach(d => {
    const endProb = (d.end_today_prob === null || d.end_today_prob === undefined) ? '—' : `${d.end_today_prob}%`;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.day}</td><td>${d.date}</td><td>${endProb}</td><td>${d.shutdown_continues_prob}%</td><td>${d.watch}</td>`;
    dbody.appendChild(tr);
  });

  renderBarChart(data.buckets || []);
}

function renderBarChart(buckets) {
  const container = document.getElementById('chart');
  const width = container.clientWidth - 24;
  const height = container.clientHeight - 24;
  const svgNS = 'http://www.w3.org/2000/svg';
  const maxProb = Math.max(...buckets.map(b => b.prob), 1);
  const barGap = 12;
  const barWidth = (width - barGap * (buckets.length + 1) - 40) / Math.max(buckets.length, 1);

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  // axes
  const yAxis = document.createElementNS(svgNS, 'line');
  yAxis.setAttribute('x1', 40); yAxis.setAttribute('y1', 10);
  yAxis.setAttribute('x2', 40); yAxis.setAttribute('y2', height - 30);
  yAxis.setAttribute('stroke', '#334155'); yAxis.setAttribute('stroke-width', '1');
  svg.appendChild(yAxis);

  const xAxis = document.createElementNS(svgNS, 'line');
  xAxis.setAttribute('x1', 40); xAxis.setAttribute('y1', height - 30);
  xAxis.setAttribute('x2', width - 10); xAxis.setAttribute('y2', height - 30);
  xAxis.setAttribute('stroke', '#334155'); xAxis.setAttribute('stroke-width', '1');
  svg.appendChild(xAxis);

  buckets.forEach((b, i) => {
    const x = 40 + barGap + i * (barWidth + barGap);
    const h = Math.max(2, (b.prob / maxProb) * (height - 60));
    const y = (height - 30) - h;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', '#60a5fa');
    svg.appendChild(rect);

    const lp = document.createElementNS(svgNS, 'text');
    lp.textContent = b.prob + '%';
    lp.setAttribute('x', x + barWidth / 2);
    lp.setAttribute('y', y - 6);
    lp.setAttribute('text-anchor', 'middle');
    lp.setAttribute('fill', '#94a3b8');
    lp.setAttribute('font-size', '11');
    svg.appendChild(lp);

    const lr = document.createElementNS(svgNS, 'text');
    lr.textContent = b.range;
    lr.setAttribute('x', x + barWidth / 2);
    lr.setAttribute('y', height - 12);
    lr.setAttribute('text-anchor', 'middle');
    lr.setAttribute('fill', '#94a3b8');
    lr.setAttribute('font-size', '11');
    svg.appendChild(lr);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

window.addEventListener('DOMContentLoaded', loadData);
