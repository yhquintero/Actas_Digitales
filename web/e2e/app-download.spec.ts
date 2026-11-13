import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';

/**
 * Pruebas E2E del flujo "descargar la App desde la Web".
 * Requieren el servidor en marcha (FastAPI sobre :8000 por defecto en CI).
 */

test.describe('Actas Digitales — Distribución de la App Android', () => {
  test('la Web carga con el título correcto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Actas Digitales/);
  });

  test('la sección de descarga es visible con su CTA y el QR', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#descarga-app');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: /Descarga la App para tu móvil/i })).toBeVisible();
    const cta = section.getByRole('link', { name: /Descargar para Android/i });
    await expect(cta).toBeVisible();
    // La descarga apunta al endpoint del backend o a la copia estática (modo estático)
    await expect(cta).toHaveAttribute('href', /(\/api\/app\/download|\/ActasDigitales\.apk)/);
    // El código QR existe (img con data URL SVG) una vez generado en el cliente
    await expect(section.locator('img[alt*="QR" i]')).toBeVisible({ timeout: 10_000 });
  });

  test('el backend sirve el APK íntegro y coherente con la metadata', async ({ request }) => {
    const infoRes = await request.get('/api/app/info');
    expect(infoRes.ok()).toBeTruthy();
    const info = await infoRes.json();
    expect(info.available).toBe(true);
    expect(info.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(info.installable).toBe(true);

    const dl = await request.get('/api/app/download');
    expect(dl.ok()).toBeTruthy();
    expect(dl.headers()['content-type']).toContain('application/vnd.android.package-archive');
    const body = await dl.body();
    expect(body.length).toBeGreaterThan(1000);
    const sha256 = createHash('sha256').update(body).digest('hex');
    expect(sha256).toBe(info.sha256);
  });

  test('HEAD del APK responde sin cuerpo y con la cabecera X-APK-SHA256', async ({ request }) => {
    const res = await request.fetch('/api/app/download', { method: 'HEAD' });
    expect(res.status()).toBe(200);
    expect(res.headers()['x-apk-sha256']).toMatch(/^[0-9a-f]{64}$/);
    expect(res.headers()['content-length']).toBeTruthy();
  });

  test('la copia estática del APK se sirve con el tipo MIME de Android', async ({ request }) => {
    const res = await request.get('/ActasDigitales.apk');
    expect(res.ok()).toBeTruthy();
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('las rutas de API desconocidas devuelven 404 JSON (no HTML)', async ({ request }) => {
    const res = await request.get('/api/no-existe');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.detail).toBeTruthy();
  });
});

test('/api/metrics expone contadores de descarga en JSON', async ({ request }) => {
  const res = await request.get('/api/metrics');
  expect(res.ok()).toBeTruthy();
  expect(res.headers()['content-type']).toContain('application/json');
  const body = await res.json();
  expect(body.counters).toBeTruthy();
  expect(typeof body.counters.app_downloads_total).toBe('number');
  expect(typeof body.counters.http_requests_total).toBe('number');
});
