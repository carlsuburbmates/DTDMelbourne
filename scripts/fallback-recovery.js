#!/usr/bin/env node

/**
 * Fallback/Recovery Mechanism
 * 
 * Automatically detects failed commands, retries with exponential backoff,
 * kills stuck processes, and enables continuation from last checkpoint.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Retry configuration
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 1000,    // 1 second
  MAX_BACKOFF_MS: 30000,        // 30 seconds
  BACKOFF_MULTIPLIER: 2,

  // Process management
  PROCESS_KILL_TIMEOUT: 5000,   // 5 seconds before SIGKILL

  // Checkpoint configuration
  CHECKPOINT_DIR: path.join(__dirname, '..', '.checkpoints'),
  CHECKPOINT_FILE: 'recovery-state.json',

  // Logging
  LOG_DIR: path.join(__dirname, '..', 'logs'),
  LOG_FILE: 'fallback-recovery.log',
};

// Recovery action types
const RecoveryAction = {
  RETRY: 'retry',
  SKIP: 'skip',
  TERMINATE: 'terminate',
  CONTINUE: 'continue',
};

// Logger class
class Logger {
  constructor(logDir, logFile) {
    this.logPath = path.join(logDir, logFile);
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(CONFIG.LOG_DIR)) {
      fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    const logLine = JSON.stringify(logEntry);
    fs.appendFileSync(this.logPath, logLine + '\n');
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

// Checkpoint manager class
class CheckpointManager {
  constructor(logger) {
    this.logger = logger;
    this.checkpointPath = path.join(CONFIG.CHECKPOINT_DIR, CONFIG.CHECKPOINT_FILE);
    this.ensureCheckpointDir();
  }

  ensureCheckpointDir() {
    if (!fs.existsSync(CONFIG.CHECKPOINT_DIR)) {
      fs.mkdirSync(CONFIG.CHECKPOINT_DIR, { recursive: true });
    }
  }

  /**
   * Save checkpoint state
   */
  saveCheckpoint(checkpointId, data = {}) {
    const state = this.loadState();
    
    state.checkpoints[checkpointId] = {
      id: checkpointId,
      timestamp: new Date().toISOString(),
      data,
    };

    state.lastCheckpoint = checkpointId;
    state.lastUpdated = new Date().toISOString();

    this.saveState(state);
    this.logger.info('Checkpoint saved', { checkpointId });
  }

  /**
   * Load checkpoint state
   */
  loadCheckpoint(checkpointId) {
    const state = this.loadState();
    return state.checkpoints[checkpointId] || null;
  }

  /**
   * Get last checkpoint
   */
  getLastCheckpoint() {
    const state = this.loadState();
    if (state.lastCheckpoint) {
      return state.checkpoints[state.lastCheckpoint] || null;
    }
    return null;
  }

  /**
   * Get all checkpoints
   */
  getAllCheckpoints() {
    const state = this.loadState();
    return Object.values(state.checkpoints);
  }

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId) {
    const state = this.loadState();
    delete state.checkpoints[checkpointId];
    
    if (state.lastCheckpoint === checkpointId) {
      state.lastCheckpoint = null;
    }

    this.saveState(state);
    this.logger.info('Checkpoint deleted', { checkpointId });
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints() {
    const state = {
      checkpoints: {},
      lastCheckpoint: null,
      lastUpdated: new Date().toISOString(),
    };
    this.saveState(state);
    this.logger.info('All checkpoints cleared');
  }

  /**
   * Load state from file
   */
  loadState() {
    try {
      if (fs.existsSync(this.checkpointPath)) {
        const content = fs.readFileSync(this.checkpointPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.logger.error('Failed to load checkpoint state', { error: error.message });
    }

    return {
      checkpoints: {},
      lastCheckpoint: null,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save state to file
   */
  saveState(state) {
    try {
      fs.writeFileSync(this.checkpointPath, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error('Failed to save checkpoint state', { error: error.message });
    }
  }
}

// Retry manager class
class RetryManager {
  constructor(logger) {
    this.logger = logger;
    this.retryHistory = [];
  }

  /**
   * Calculate backoff delay with exponential backoff
   */
  calculateBackoff(attempt) {
    const delay = Math.min(
      CONFIG.INITIAL_BACKOFF_MS * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
      CONFIG.MAX_BACKOFF_MS
    );
    
    // Add some jitter to avoid thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Execute command with retry logic
   */
  async executeWithRetry(command, args = [], options = {}) {
    const maxRetries = options.maxRetries || CONFIG.MAX_RETRIES;
    const retryableErrors = options.retryableErrors || [];
    const onRetry = options.onRetry || (() => {});

    let lastError = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      
      try {
        this.logger.info('Executing command', { 
          command, 
          args, 
          attempt,
          maxRetries,
        });

        const result = await this.executeCommand(command, args, options);
        
        if (attempt > 1) {
          this.logger.info('Command succeeded after retry', { 
            command, 
            attempt,
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        
        const isRetryable = this.isRetryableError(error, retryableErrors);
        
        if (attempt <= maxRetries && isRetryable) {
          const backoff = this.calculateBackoff(attempt);
          
          this.logger.warn('Command failed, retrying', { 
            command, 
            attempt,
            maxRetries,
            backoff,
            error: error.message,
          });

          this.recordRetry(command, args, attempt, error, backoff);
          onRetry(attempt, backoff, error);

          await this.sleep(backoff);
        } else {
          this.logger.error('Command failed permanently', { 
            command, 
            attempt,
            maxRetries,
            error: error.message,
          });
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute a single command
   */
  executeCommand(command, args, options) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          const error = new Error(`Command failed with exit code ${code}`);
          error.code = code;
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error, retryableErrors) {
    // Default retryable errors
    const defaultRetryablePatterns = [
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ENOTFOUND/,
      /EAI_AGAIN/,
      /network/i,
      /timeout/i,
      /temporary/i,
    ];

    // Check custom retryable errors
    if (retryableErrors.length > 0) {
      return retryableErrors.some(pattern => 
        pattern.test(error.message) || pattern.test(error.stderr || '')
      );
    }

    // Check default patterns
    return defaultRetryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stderr || '')
    );
  }

  /**
   * Record retry attempt
   */
  recordRetry(command, args, attempt, error, backoff) {
    this.retryHistory.push({
      command,
      args,
      attempt,
      error: error.message,
      backoff,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    const commandStats = {};
    
    for (const retry of this.retryHistory) {
      const key = retry.command;
      if (!commandStats[key]) {
        commandStats[key] = {
          count: 0,
          attempts: [],
          lastRetry: null,
        };
      }
      
      commandStats[key].count++;
      commandStats[key].attempts.push(retry.attempt);
      commandStats[key].lastRetry = retry.timestamp;
    }

    return {
      totalRetries: this.retryHistory.length,
      commandStats,
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Process killer class
class ProcessKiller {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Kill process by PID
   */
  async killProcess(pid, signal = 'SIGTERM') {
    return new Promise((resolve, reject) => {
      try {
        process.kill(pid, signal);
        this.logger.info('Process killed', { pid, signal });
        
        // Wait to ensure process is terminated
        setTimeout(() => {
          try {
            process.kill(pid, 0); // Check if process exists
            // Process still exists, try SIGKILL
            process.kill(pid, 'SIGKILL');
            this.logger.warn('Process killed with SIGKILL', { pid });
          } catch (e) {
            // Process is already dead
          }
          resolve();
        }, CONFIG.PROCESS_KILL_TIMEOUT);
      } catch (error) {
        if (error.code === 'ESRCH') {
          this.logger.info('Process already terminated', { pid });
          resolve();
        } else {
          this.logger.error('Failed to kill process', { pid, error: error.message });
          reject(error);
        }
      }
    });
  }

  /**
   * Kill processes by name
   */
  async killProcessesByName(name) {
    try {
      const { stdout } = await this.executeCommand('pgrep', ['-f', name]);
      const pids = stdout.trim().split('\n').filter(Boolean);
      
      const results = [];
      for (const pid of pids) {
        try {
          await this.killProcess(parseInt(pid));
          results.push({ pid, success: true });
        } catch (error) {
          results.push({ pid, success: false, error: error.message });
        }
      }

      this.logger.info('Killed processes by name', { name, count: results.length });
      return results;
    } catch (error) {
      this.logger.error('Failed to kill processes by name', { name, error: error.message });
      return [];
    }
  }

  /**
   * Execute command helper
   */
  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }
}

// Recovery manager class
class RecoveryManager {
  constructor(logger) {
    this.logger = logger;
    this.checkpointManager = new CheckpointManager(logger);
    this.retryManager = new RetryManager(logger);
    this.processKiller = new ProcessKiller(logger);
  }

  /**
   * Execute task with automatic recovery
   */
  async executeWithRecovery(taskId, taskFn, options = {}) {
    const checkpointId = options.checkpointId || taskId;
    const skipOnFailure = options.skipOnFailure || false;
    const onRecovery = options.onRecovery || (() => {});

    // Check if we can resume from checkpoint
    const checkpoint = this.checkpointManager.loadCheckpoint(checkpointId);
    if (checkpoint && options.resumeFromCheckpoint) {
      this.logger.info('Resuming from checkpoint', { checkpointId });
      return checkpoint.data;
    }

    try {
      const result = await taskFn();
      
      // Save checkpoint on success
      this.checkpointManager.saveCheckpoint(checkpointId, result);
      
      return result;
    } catch (error) {
      this.logger.error('Task failed, attempting recovery', { 
        taskId, 
        error: error.message,
      });

      const recoveryAction = this.determineRecoveryAction(error, options);

      switch (recoveryAction) {
        case RecoveryAction.RETRY:
          this.logger.info('Attempting retry recovery');
          onRecovery(RecoveryAction.RETRY, error);
          return await this.retryManager.executeWithRetry(
            () => taskFn(),
            options.retryOptions
          );

        case RecoveryAction.SKIP:
          if (skipOnFailure) {
            this.logger.warn('Skipping failed task');
            onRecovery(RecoveryAction.SKIP, error);
            return null;
          }
          throw error;

        case RecoveryAction.CONTINUE:
          this.logger.info('Continuing despite error');
          onRecovery(RecoveryAction.CONTINUE, error);
          return options.defaultValue || null;

        case RecoveryAction.TERMINATE:
        default:
          this.logger.error('Terminating due to unrecoverable error');
          onRecovery(RecoveryAction.TERMINATE, error);
          throw error;
      }
    }
  }

  /**
   * Determine appropriate recovery action
   */
  determineRecoveryAction(error, options) {
    // Check for explicit recovery action
    if (options.recoveryAction) {
      return options.recoveryAction;
    }

    // Check for retryable errors
    if (this.retryManager.isRetryableError(error, options.retryableErrors)) {
      return RecoveryAction.RETRY;
    }

    // Check for skip conditions
    if (options.skipOnFailure && options.skipErrors) {
      if (options.skipErrors.some(pattern => pattern.test(error.message))) {
        return RecoveryAction.SKIP;
      }
    }

    // Default to terminate
    return RecoveryAction.TERMINATE;
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus() {
    return {
      checkpoints: this.checkpointManager.getAllCheckpoints(),
      lastCheckpoint: this.checkpointManager.getLastCheckpoint(),
      retryStats: this.retryManager.getRetryStats(),
    };
  }

  /**
   * Reset recovery state
   */
  resetRecovery() {
    this.checkpointManager.clearCheckpoints();
    this.logger.info('Recovery state reset');
  }
}

// Main execution
async function main() {
  const logger = new Logger(CONFIG.LOG_DIR, CONFIG.LOG_FILE);
  const recoveryManager = new RecoveryManager(logger);

  logger.info('Fallback/Recovery Mechanism started');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'execute':
      const cmd = args[1];
      const cmdArgs = args.slice(2);
      if (!cmd) {
        logger.error('No command specified for execute');
        process.exit(1);
      }
      try {
        const result = await recoveryManager.retryManager.executeWithRetry(cmd, cmdArgs);
        console.log(result.stdout);
        process.exit(0);
      } catch (error) {
        logger.error('Command execution failed', { error: error.message });
        process.exit(1);
      }
      break;

    case 'checkpoint':
      const checkpointId = args[1];
      const data = args[2] ? JSON.parse(args[2]) : {};
      if (!checkpointId) {
        logger.error('No checkpoint ID specified');
        process.exit(1);
      }
      recoveryManager.checkpointManager.saveCheckpoint(checkpointId, data);
      console.log(`Checkpoint saved: ${checkpointId}`);
      break;

    case 'resume':
      const resumeId = args[1];
      if (!resumeId) {
        logger.error('No checkpoint ID specified for resume');
        process.exit(1);
      }
      const checkpoint = recoveryManager.checkpointManager.loadCheckpoint(resumeId);
      if (checkpoint) {
        console.log(JSON.stringify(checkpoint, null, 2));
      } else {
        console.log('Checkpoint not found');
        process.exit(1);
      }
      break;

    case 'status':
      const status = recoveryManager.getRecoveryStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'reset':
      recoveryManager.resetRecovery();
      console.log('Recovery state reset');
      break;

    case 'kill':
      const pid = parseInt(args[1]);
      if (!pid) {
        logger.error('No PID specified for kill');
        process.exit(1);
      }
      await recoveryManager.processKiller.killProcess(pid);
      console.log(`Process ${pid} killed`);
      break;

    default:
      console.log(`
Fallback/Recovery Mechanism

Usage:
  node fallback-recovery.js execute <cmd> [args...]  - Execute command with retry
  node fallback-recovery.js checkpoint <id> [data]   - Save checkpoint
  node fallback-recovery.js resume <id>              - Resume from checkpoint
  node fallback-recovery.js status                     - Get recovery status
  node fallback-recovery.js reset                      - Reset recovery state
  node fallback-recovery.js kill <pid>                - Kill process by PID

Examples:
  node fallback-recovery.js execute npm install
  node fallback-recovery.js checkpoint "phase-1-complete"
  node fallback-recovery.js resume "phase-1-complete"
  node fallback-recovery.js status
      `);
  }
}

// Export for use as module
module.exports = {
  RecoveryManager,
  CheckpointManager,
  RetryManager,
  ProcessKiller,
  RecoveryAction,
  CONFIG,
};

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
