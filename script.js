function formatDays(value) {
  if (value === null || value === undefined || value === '—') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return `${numeric} days`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '—') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return `${numeric}%`;
}

async function loadData() {
  try {
    const url = new URL('probabilities.json', window.location.href);
    url.searchParams.set('t', Date.now());

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Request for probabilities.json failed with status ${res.status}`);
    }

    const data = await res.json();
    render(data);
  } catch (e) {
    console.error('Failed to load probabilities.json', e);
    showDataUnavailable();
  }
}

function showDataUnavailable() {
  const subtitleEl = document.getElementById('subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = 'Data unavailable';
  }

  const kpiIds = ['median', 'mean', 'withinWeek'];
  kpiIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '—';
    }
  });

  const bucketRows = document.getElementById('bucket-rows');
  if (bucketRows) {
    bucketRows.innerHTML = "<tr><td colspan='2' class='text-center text-muted py-4'>Unable to load probabilities.json</td></tr>";
  }

  const dailyRows = document.getElementById('daily-rows');
  if (dailyRows) {
    dailyRows.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-4'>Unable to load probabilities.json</td></tr>";
  }

  const chart = document.getElementById('chart');
  if (chart) {
    chart.innerHTML = "<div class='text-center text-muted pt-4'>Unable to load probabilities.json</div>";
  }
}

function render(data) {
  const subtitleEl = document.getElementById('subtitle');
  if (subtitleEl) {
    const lastUpdated = data.metadata?.last_updated_iso;
    subtitleEl.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(lastUpdated ? new Date(lastUpdated) : new Date());
  }

  document.getElementById('median').textContent = formatDays(data.derived?.median_days ?? '—');
  document.getElementById('mean').textContent = formatDays(data.derived?.mean_days ?? '—');
  document.getElementById('withinWeek').textContent = formatPercent(data.derived?.chance_end_within_week_percent ?? '—');

  const tbody = document.getElementById('bucket-rows');
  tbody.innerHTML = '';
  (data.buckets || []).forEach((b, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="fw-semibold">${b.range}</div>
        <small class="text-muted">Scenario ${index + 1}</small>
      </td>
      <td>
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-semibold">${formatPercent(b.prob)}</span>
        </div>
        <div class="progress-track mt-2">
          <div class="progress-fill" style="width: ${Math.min(Number(b.prob) || 0, 100)}%;"></div>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  const dbody = document.getElementById('daily-rows');
  dbody.innerHTML = '';
  (data.daily_tracker || []).forEach(d => {
    const endProb = formatPercent(d.end_today_prob ?? '—');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-muted">${d.day}</td>
      <td class="fw-semibold">${d.date}</td>
      <td>${endProb}</td>
      <td>${formatPercent(d.shutdown_continues_prob)}</td>
      <td class="text-muted">${d.watch}</td>`;
    dbody.appendChild(tr);
  });

  renderBarChart(data.buckets || []);
}

function renderBarChart(buckets) {
  const container = document.getElementById('chart');
  if (!container) return;

  const width = container.clientWidth - 24;
  const height = container.clientHeight - 24;
  const svgNS = 'http://www.w3.org/2000/svg';
  const maxProb = Math.max(...buckets.map(b => Number(b.prob) || 0), 1);
  const barGap = 16;
  const effectiveCount = Math.max(buckets.length, 1);
  const barWidth = Math.max((width - barGap * (effectiveCount + 1) - 40) / effectiveCount, 20);

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  const defs = document.createElementNS(svgNS, 'defs');
  const gradient = document.createElementNS(svgNS, 'linearGradient');
  gradient.setAttribute('id', 'barGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('x2', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('y2', '100%');

  const stopTop = document.createElementNS(svgNS, 'stop');
  stopTop.setAttribute('offset', '0%');
  stopTop.setAttribute('stop-color', '#38bdf8');
  stopTop.setAttribute('stop-opacity', '1');

  const stopBottom = document.createElementNS(svgNS, 'stop');
  stopBottom.setAttribute('offset', '100%');
  stopBottom.setAttribute('stop-color', '#2563eb');
  stopBottom.setAttribute('stop-opacity', '1');

  gradient.appendChild(stopTop);
  gradient.appendChild(stopBottom);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const yAxis = document.createElementNS(svgNS, 'line');
  yAxis.setAttribute('x1', 40);
  yAxis.setAttribute('y1', 16);
  yAxis.setAttribute('x2', 40);
  yAxis.setAttribute('y2', height - 36);
  yAxis.setAttribute('stroke', 'rgba(148, 163, 184, 0.35)');
  yAxis.setAttribute('stroke-width', '1');
  svg.appendChild(yAxis);

  const xAxis = document.createElementNS(svgNS, 'line');
  xAxis.setAttribute('x1', 40);
  xAxis.setAttribute('y1', height - 36);
  xAxis.setAttribute('x2', width - 10);
  xAxis.setAttribute('y2', height - 36);
  xAxis.setAttribute('stroke', 'rgba(148, 163, 184, 0.35)');
  xAxis.setAttribute('stroke-width', '1');
  svg.appendChild(xAxis);

  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const value = (maxProb / ticks) * i;
    const y = height - 36 - (value / maxProb) * (height - 60);
    const tick = document.createElementNS(svgNS, 'line');
    tick.setAttribute('x1', 36);
    tick.setAttribute('x2', 40);
    tick.setAttribute('y1', y);
    tick.setAttribute('y2', y);
    tick.setAttribute('stroke', 'rgba(148, 163, 184, 0.35)');
    tick.setAttribute('stroke-width', '1');
    svg.appendChild(tick);

    const label = document.createElementNS(svgNS, 'text');
    label.textContent = `${Math.round(value)}%`;
    label.setAttribute('x', 28);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', 'rgba(148, 163, 184, 0.85)');
    label.setAttribute('font-size', '11');
    svg.appendChild(label);
  }

  buckets.forEach((b, i) => {
    const probability = Number(b.prob) || 0;
    const x = 40 + barGap + i * (barWidth + barGap);
    const h = Math.max(2, (probability / maxProb) * (height - 60));
    const y = height - 36 - h;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', 'url(#barGradient)');
    rect.setAttribute('opacity', '0.95');
    svg.appendChild(rect);

    const percentLabel = document.createElementNS(svgNS, 'text');
    percentLabel.textContent = `${probability}%`;
    percentLabel.setAttribute('x', x + barWidth / 2);
    percentLabel.setAttribute('y', y - 6);
    percentLabel.setAttribute('text-anchor', 'middle');
    percentLabel.setAttribute('fill', '#bae6fd');
    percentLabel.setAttribute('font-size', '11');
    svg.appendChild(percentLabel);

    const rangeLabel = document.createElementNS(svgNS, 'text');
    rangeLabel.textContent = b.range;
    rangeLabel.setAttribute('x', x + barWidth / 2);
    rangeLabel.setAttribute('y', height - 16);
    rangeLabel.setAttribute('text-anchor', 'middle');
    rangeLabel.setAttribute('fill', 'rgba(148, 163, 184, 0.9)');
    rangeLabel.setAttribute('font-size', '11');
    svg.appendChild(rangeLabel);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

window.addEventListener('DOMContentLoaded', loadData);
