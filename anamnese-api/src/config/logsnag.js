const { LogSnag } = require('logsnag');

const logsnag = process.env.LOGSNAG_TOKEN
  ? new LogSnag({ token: process.env.LOGSNAG_TOKEN, project: 'anamnese' })
  : null;

async function track(payload) {
  if (!logsnag) return;
  try { await logsnag.track(payload); } catch { /* silencioso */ }
}

module.exports = { track };
