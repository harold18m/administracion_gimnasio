// Local agent server integrating with SLK20R helper (.NET/C#)
// Exposes: GET /health, POST /enroll
// Configure environment variables:
// - AGENT_PORT (default: 5599)
// - CORS_ORIGIN (default: http://localhost:8080)
// - SUPABASE_URL (optional, required if uploading templates)
// - SUPABASE_SERVICE_ROLE_KEY (optional, required if uploading templates)

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const AGENT_PORT = process.env.AGENT_PORT ? Number(process.env.AGENT_PORT) : 5599;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';

// Optional Supabase setup
let supabase = null;
try {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('[agent] Supabase client initialized');
  } else {
    console.log('[agent] Supabase env not set; templates will not be uploaded');
  }
} catch (err) {
  console.warn('[agent] Supabase client not available:', err?.message);
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: CORS_ORIGIN, methods: ['GET', 'POST', 'OPTIONS'], credentials: false }));

// Resolve helper executable path
function resolveHelperPath() {
  // Prefer self-contained publish builds to avoid requiring a system .NET runtime
  const exePublish9 = path.resolve(__dirname, 'slk20r-helper', 'bin', 'Release', 'net9.0-windows', 'win-x86', 'publish', 'slk20r-helper.exe');
  if (fs.existsSync(exePublish9)) return { mode: 'exe', path: exePublish9 };
  const exePublish6 = path.resolve(__dirname, 'slk20r-helper', 'bin', 'Release', 'net6.0-windows', 'win-x86', 'publish', 'slk20r-helper.exe');
  if (fs.existsSync(exePublish6)) return { mode: 'exe', path: exePublish6 };

  // Fallback to framework-dependent builds
  const exePath9 = path.resolve(__dirname, 'slk20r-helper', 'bin', 'Release', 'net9.0-windows', 'slk20r-helper.exe');
  if (fs.existsSync(exePath9)) return { mode: 'exe', path: exePath9 };
  const exePath6 = path.resolve(__dirname, 'slk20r-helper', 'bin', 'Release', 'net6.0-windows', 'slk20r-helper.exe');
  if (fs.existsSync(exePath6)) return { mode: 'exe', path: exePath6 };

  // Last resort: dotnet run
  const csprojPath = path.resolve(__dirname, 'slk20r-helper', 'slk20r-helper.csproj');
  if (fs.existsSync(csprojPath)) return { mode: 'dotnet', path: csprojPath };
  
  return { mode: 'none', path: '' };
}

function runHelper(args = [], timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const helper = resolveHelperPath();
    console.log(`[agent] runHelper mode=${helper.mode} path=${helper.path} args=${args.join(' ')}`);
    let child;

    try {
      if (helper.mode === 'exe') {
        child = spawn(helper.path, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
      } else if (helper.mode === 'dotnet') {
        child = spawn('dotnet', ['run', '--project', helper.path, '--', ...args], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
      } else {
        return reject(new Error('Helper not found'));
      }
    } catch (spawnErr) {
      console.error('[agent] helper spawn error:', spawnErr?.message);
      return reject(spawnErr);
    }

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      console.warn('[agent] helper timeout reached');
      return resolve({ ok: false, error: 'helper_timeout' });
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      console.error('[agent] helper child error:', err?.message);
      return resolve({ ok: false, error: 'helper_spawn_error', message: err?.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const text = (stdout || '').trim();
      const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
      const extractLastJson = () => {
        if (!text) return null;
        let json = tryParse(text);
        if (json) return json;
        const lastStart = text.lastIndexOf('{');
        const lastEnd = text.lastIndexOf('}');
        if (lastStart !== -1 && lastEnd !== -1 && lastEnd > lastStart) {
          const candidate = text.slice(lastStart, lastEnd + 1);
          return tryParse(candidate);
        }
        return null;
      };

      if (code !== 0) {
        const jsonErr = extractLastJson();
        if (jsonErr && typeof jsonErr === 'object') {
          return resolve({ ok: false, ...jsonErr });
        }
        console.error('[agent] helper exited non-zero:', code, '| stderr:', stderr);
        return resolve({ ok: false, error: 'helper_non_json', exit_code: code, stderr_tail: (stderr || '').slice(-200), stdout_tail: (text || '').slice(-200) });
      }

      const json = extractLastJson();
      if (!json) {
        console.error('[agent] helper invalid JSON. Raw length:', text.length, 'sample tail:', text.slice(-120));
        return resolve({ ok: false, error: 'invalid_json' });
      }
      resolve(json);
    });
  });
}

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await runHelper(['--check'], 15000);
    if (!result || result.ok === false || result.error) {
      return res.status(200).json({ status: 'ok', device_connected: !!result?.device_connected, helper: 'unavailable', error: result?.error || 'unknown' });
    }
    return res.json({ status: 'ok', device_connected: !!result?.device_connected, helper: 'ok' });
  } catch (err) {
    console.warn('[agent] /health helper error:', err.message);
    return res.status(200).json({ status: 'ok', device_connected: false, helper: 'unavailable', error: err?.message || 'unknown' });
  }
});

// Optional encryption placeholder
function encryptTemplate(base64Template) {
  // TODO: Encrypt template with your chosen method
  return base64Template; // return as-is for now
}

// Enroll endpoint
app.post('/enroll', async (req, res) => {
  try {
    const { client_id, finger_label } = req.body || {};
    if (!client_id || typeof client_id !== 'string') {
      return res.status(400).json({ error: 'client_id requerido' });
    }

    // Capture from device via helper
    let helperResult;
    try {
      helperResult = await runHelper(['--enroll'], 150000);
    } catch (err) {
      console.error('[agent] helper enroll error:', err.message);
      return res.status(503).json({ error: 'El helper del lector no está disponible' });
    }

    // If helper returns an error payload, forward it
    if (helperResult && helperResult.ok === false) {
      return res.status(422).json({ error: helperResult.error || 'captura_fallida', detail: helperResult });
    }

    // Upload directly to Supabase if configured
    if (supabase) {
      const row = {
        cliente_id: client_id,
        finger_label: finger_label ?? null,
        format: helperResult.format ?? 'unknown',
        template_len: helperResult.template_len,
        image_width: helperResult.image_width,
        image_height: helperResult.image_height,
        dpi: helperResult.dpi,
        enc_nonce_b64: helperResult.enc_nonce_b64,
        enc_tag_b64: helperResult.enc_tag_b64,
        enc_ciphertext_b64: helperResult.enc_ciphertext_b64,
        source_device: helperResult.source_device ?? null,
        json_raw: helperResult,
      };

      // Basic validation of encryption fields
      if ([row.enc_nonce_b64, row.enc_tag_b64, row.enc_ciphertext_b64].some(v => typeof v !== 'string' || v.length === 0)) {
        return res.status(400).json({ error: 'invalid_encryption_fields' });
      }

      try {
        const { data: upserted, error } = await supabase
          .from('fingerprint_templates')
          .upsert(row, { onConflict: 'cliente_id,finger_label' })
          .select('id')
          .single();

        if (error) {
          console.error('[agent] supabase upsert failed:', error.message);
          return res.status(500).json({ error: 'supabase_insert_failed', detail: error.message });
        }

        return res.json({ status: 'success', client_id, supabase_id: upserted.id, json: helperResult });
      } catch (e) {
        console.error('[agent] supabase upsert exception:', e.message);
        return res.status(500).json({ error: 'supabase_insert_exception', detail: e.message });
      }
    }

    // If Supabase is not configured, just return raw helper result
    return res.json({ status: 'success', client_id, upload: 'skipped', json: helperResult });
  } catch (err) {
    console.error('[agent] enroll error:', err);
    return res.status(500).json({ error: 'Error durante el enrolamiento' });
  }
});

app.listen(AGENT_PORT, () => {
  console.log(`Agent server running at http://localhost:${AGENT_PORT}/`);
});