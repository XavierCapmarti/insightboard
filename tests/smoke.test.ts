import { execSync, ChildProcess, spawn } from 'child_process';

const PORT = 3007;
const BASE_URL = `http://localhost:${PORT}`;

let server: ChildProcess;

function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      fetch(url)
        .then((r) => {
          if (r.ok) resolve();
          else if (Date.now() - start > timeout) reject(new Error('Server timeout'));
          else setTimeout(check, 500);
        })
        .catch(() => {
          if (Date.now() - start > timeout) reject(new Error('Server timeout'));
          else setTimeout(check, 500);
        });
    };
    check();
  });
}

beforeAll(async () => {
  execSync('npx next build', { cwd: '/home/user/insightboard', stdio: 'ignore' });

  server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: '/home/user/insightboard',
    stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT) },
  });

  await waitForServer(BASE_URL);
}, 120000);

afterAll(async () => {
  server?.kill();
});

describe('Page smoke tests', () => {
  test('Landing page returns 200 with expected content', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('ClarLens');
    expect(html).toContain('CSV to Insights');
    expect(html).not.toContain('Internal Server Error');
  });

  test('Onboarding page returns 200 with expected content', async () => {
    const res = await fetch(`${BASE_URL}/onboarding`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Upload your CSV');
    expect(html).not.toContain('Internal Server Error');
  });

  test('Dashboard page returns 200 with expected content', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('ClarLens');
    expect(html).not.toContain('Internal Server Error');
  });
});

describe('API smoke tests', () => {
  test('GET /api/templates returns template list', async () => {
    const res = await fetch(`${BASE_URL}/api/templates`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('templates');
    expect(body.templates.length).toBeGreaterThan(0);
    expect(body.templates[0]).toHaveProperty('id');
    expect(body.templates[0]).toHaveProperty('name');
  });

  test('POST /api/ingest rejects empty body', async () => {
    const res = await fetch(`${BASE_URL}/api/ingest`, { method: 'POST' });
    // Should not be 500 — a proper error response
    expect(res.status).not.toBe(500);
  });

  test('GET /api/metrics rejects missing params', async () => {
    const res = await fetch(`${BASE_URL}/api/metrics`);
    expect(res.status).not.toBe(500);
  });
});
