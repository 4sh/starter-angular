#!/usr/bin/env node
/**
 * Block Dangerous Commands - PreToolUse Hook for Bash
 * Blocks dangerous patterns before execution. Logs to: ~/.claude/hooks-logs/
 *
 * SAFETY_LEVEL: 'critical' | 'high' | 'strict' (override: CLAUDE_HOOK_SAFETY_LEVEL env var)
 *   critical - Only catastrophic: rm -rf ~, fork bombs
 *   high     - + risky: force push main, secrets exposure, git reset --hard, git add -A
 *   strict   - + cautionary: any force push, sudo rm
 *
 * Note: the 'cat-secrets' pattern also denies `cat`/`head`/`tail` on files whose
 * path mentions "secret" (including this hook's sibling protect-secrets.js).
 * Use the Read tool for those files instead of shell commands.
 *
 * Setup in .claude/settings.json:
 * {
 *   "hooks": {
 *     "PreToolUse": [{
 *       "matcher": "Bash",
 *       "hooks": [{ "type": "command", "command": "node /path/to/block-dangerous-commands.js" }]
 *     }]
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

const SAFETY_LEVEL = process.env.CLAUDE_HOOK_SAFETY_LEVEL || 'high';

const PATTERNS = [
  // CRITICAL - Catastrophic, unrecoverable
  {
    level: 'critical',
    id: 'rm-home',
    regex: /\brm\s+(-.+\s+)*["']?~\/?["']?(\s|$|[;&|])/,
    reason: 'rm targeting home directory',
  },
  {
    level: 'critical',
    id: 'rm-home-var',
    regex: /\brm\s+(-.+\s+)*["']?\$HOME["']?(\s|$|[;&|])/,
    reason: 'rm targeting $HOME',
  },
  {
    level: 'critical',
    id: 'rm-home-trailing',
    regex: /\brm\s+.+\s+["']?(~\/?|\$HOME)["']?(\s*$|[;&|])/,
    reason: 'rm with trailing ~/ or $HOME',
  },
  {
    level: 'critical',
    id: 'rm-root',
    regex: /\brm\s+(-.+\s+)*\/(\*|\s|$|[;&|])/,
    reason: 'rm targeting root filesystem',
  },
  {
    level: 'critical',
    id: 'rm-system',
    regex: /\brm\s+(-.+\s+)*\/(etc|usr|var|bin|sbin|lib|boot|dev|proc|sys)(\/|\s|$)/,
    reason: 'rm targeting system directory',
  },
  {
    level: 'critical',
    id: 'rm-cwd',
    regex: /\brm\s+(-.+\s+)*(\.\/?|\*|\.\/\*)(\s|$|[;&|])/,
    reason: 'rm deleting current directory contents',
  },
  {
    level: 'critical',
    id: 'fork-bomb',
    regex: /:\(\)\s*\{.*:\s*\|\s*:.*&/,
    reason: 'fork bomb detected',
  },

  // HIGH - Significant risk, data loss, security
  {
    level: 'high',
    id: 'curl-pipe-sh',
    regex: /\b(curl|wget)\b.+\|\s*(ba)?sh\b/,
    reason: 'piping URL to shell (RCE risk)',
  },
  {
    level: 'high',
    id: 'git-force-main',
    regex: /\bgit\s+push\b(?!.+--force-with-lease).+(--force|-f)\b.+\b(main|master)\b/,
    reason: 'force push to main/master',
  },
  {
    level: 'high',
    id: 'git-reset-hard',
    regex: /\bgit\s+reset\s+--hard/,
    reason: 'git reset --hard loses uncommitted work',
  },
  {
    level: 'high',
    id: 'git-clean-f',
    regex: /\bgit\s+clean\s+(-\w*f|-f)/,
    reason: 'git clean -f deletes untracked files',
  },
  {
    level: 'high',
    id: 'git-add-all',
    regex: /\bgit\s+add\s+(-\w*A\w*\b|--all\b|\.\/?(\s|$|[;&|]))/,
    reason: 'git add -A / git add . forbidden — stage files by name',
  },
  {
    level: 'high',
    id: 'git-no-verify',
    regex: /\bgit\s+(commit|push)\b.*--no-(verify|gpg-sign)\b/,
    reason: 'skipping git hooks is forbidden',
  },
  {
    level: 'high',
    id: 'git-discard-all',
    regex: /\bgit\s+(checkout|restore)\s+(--\s+)?\.\/?(\s|$|[;&|])/,
    reason: 'discards all uncommitted changes',
  },
  {
    level: 'high',
    id: 'chmod-777',
    regex: /\bchmod\b.+\b777\b/,
    reason: 'chmod 777 is a security risk',
  },
  {
    level: 'high',
    id: 'cat-env',
    regex: /\b(cat|less|head|tail|more|bat)\s+\S*\.env(?!\.(example|sample|template))(\.\w+)?\b/,
    reason: 'reading .env file exposes secrets',
  },
  {
    level: 'high',
    id: 'cat-secrets',
    regex: /\b(cat|less|head|tail|more)\b.+(credentials|secrets?|\.pem|\.key|id_rsa|id_ed25519)/i,
    reason: 'reading secrets file',
  },
  {
    level: 'high',
    id: 'env-dump',
    regex: /\b(printenv|^env)\s*([;&|]|$)/,
    reason: 'env dump may expose secrets',
  },
  {
    level: 'high',
    id: 'echo-secret',
    regex: /\becho\b.+\$\w*(SECRET|KEY|TOKEN|PASSWORD|API_|PRIVATE)/i,
    reason: 'echoing secret variable',
  },
  {
    level: 'high',
    id: 'rm-ssh',
    regex: /\brm\b.+\.ssh\/(id_|authorized_keys|known_hosts)/,
    reason: 'deleting SSH keys',
  },

  // STRICT - Cautionary, context-dependent
  {
    level: 'strict',
    id: 'git-force-any',
    regex: /\bgit\s+push\b(?!.+--force-with-lease).+(--force|-f)\b/,
    reason: 'force push (use --force-with-lease)',
  },
  {
    level: 'strict',
    id: 'sudo-rm',
    regex: /\bsudo\s+rm\b/,
    reason: 'sudo rm has elevated privileges',
  },
];

const LEVELS = { critical: 1, high: 2, strict: 3 };
const EMOJIS = { critical: '🚨', high: '⛔', strict: '⚠️' };
const LOG_DIR = path.join(process.env.HOME, '.claude', 'hooks-logs');

function log(data) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const file = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`);
    fs.appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...data }) + '\n');
  } catch {}
}

function checkCommand(cmd, safetyLevel = SAFETY_LEVEL) {
  const threshold = LEVELS[safetyLevel] || 2;
  for (const p of PATTERNS) {
    if (LEVELS[p.level] <= threshold && p.regex.test(cmd)) {
      return { blocked: true, pattern: p };
    }
  }
  return { blocked: false, pattern: null };
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const data = JSON.parse(input);
    const { tool_name, tool_input, session_id, cwd, permission_mode } = data;
    if (tool_name !== 'Bash') return console.log('{}');

    const cmd = tool_input?.command || '';
    const result = checkCommand(cmd);

    if (result.blocked) {
      const p = result.pattern;
      log({ level: 'BLOCKED', id: p.id, priority: p.level, cmd, session_id, cwd, permission_mode });
      return console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: `${EMOJIS[p.level]} [${p.id}] ${p.reason}`,
          },
        }),
      );
    }
    console.log('{}');
  } catch (e) {
    log({ level: 'ERROR', error: e.message });
    console.log('{}');
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = { PATTERNS, LEVELS, SAFETY_LEVEL, checkCommand };
}
