import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'POST, OPTIONS');
      res.statusCode = 204;
      return res.end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({ ok: false, error: 'missing_env', detail: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' });
    }

    // Parse raw JSON body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'invalid_json', detail: e.message });
    }

    const { cliente_id, finger_label, json } = body;
    if (!cliente_id || !json) {
      return res.status(400).json({ ok: false, error: 'missing_fields', detail: 'cliente_id and json are required' });
    }

    if (json.ok === false) {
      return res.status(422).json({ ok: false, error: json.error || 'capture_failed', detail: json });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const row = {
      cliente_id,
      finger_label: finger_label ?? null,
      format: json.format ?? 'unknown',
      template_len: json.template_len,
      image_width: json.image_width,
      image_height: json.image_height,
      dpi: json.dpi,
      enc_nonce_b64: json.enc_nonce_b64,
      enc_tag_b64: json.enc_tag_b64,
      enc_ciphertext_b64: json.enc_ciphertext_b64,
      source_device: json.source_device ?? null,
      json_raw: json,
    };

    // Basic validation of encryption fields
    if ([row.enc_nonce_b64, row.enc_tag_b64, row.enc_ciphertext_b64].some(v => typeof v !== 'string' || v.length === 0)) {
      return res.status(400).json({ ok: false, error: 'invalid_encryption_fields' });
    }

    const { data: inserted, error } = await supabase
      .from('fingerprint_templates')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      return res.status(500).json({ ok: false, error: 'supabase_insert_failed', detail: error.message });
    }

    return res.status(201).json({ ok: true, id: inserted.id });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', detail: err.message });
  }
}