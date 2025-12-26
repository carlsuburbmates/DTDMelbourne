#!/usr/bin/env node

/**
 * Terminal Health Monitor
 * 
 * Monitors terminal health by detecting lagging, stopped, or hanging processes.
 * Provides health status logging and alerts for terminal issues.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Time thresholds (in milliseconds)
  COMMAND_TIMEOUT: 30000,        // 30 seconds
  HANGING_THRESHOLD: 60000,      // 1 minute
  LAG_THRESHOLD: 5000,           // 5 seconds
  
  // Health check intervals
  CHECK_INTERVAL: 10000,          // 10 seconds
  
  // Logging
  LOG_DIR: path.join(__dirname, '..', 'logs'),
  LOG_FILE: 'terminal-health.log',
  
  // Process monitoring
  MONITOR_PROCESSES: ['node', 'npm', 'yarn', 'pnpm', 'git', 'bash', 'zsh'],
};

// Health status enum
const HealthStatus = {
  HEALTHY: 'healthy',
  LAGGING: 'lagging',
  HANGING: 'hanging',
  STOPPED: 'stopped',
  UNKNOWN: 'unknown',
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
    
    // Also output to console for immediate feedback
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

// Process monitor class
class ProcessMonitor {
  constructor(logger) {
    this.logger = logger;
    this.monitoredProcesses = new Map();
  }

  /**
   * Execute a command with timeout monitoring
   */
  async executeWithMonitoring(command, args = [], options = {}) {
    const startTime = Date.now();
    const commandId = `${command}_${Date.now()}`;
    
    this.logger.info('Starting command execution', { command, args, commandId });

    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options,
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      // Set up timeout
      const timeout = setTimeout(() => {
        isTimedOut = true;
        this.logger.warn('Command timeout detected', { 
          command, 
          commandId, 
          duration: Date.now() - startTime 
        });
        process.kill('SIGTERM');
        
        // Force kill if SIGTERM doesn't work
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 5000);
      }, options.timeout || CONFIG.COMMAND_TIMEOUT);

      // Collect output
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        
        if (isTimedOut) {
          this.logger.error('Command timed out', { 
            command, 
            commandId, 
            duration,
            stdout: stdout.slice(-500),
            stderr: stderr.slice(-500),
          });
          reject(new Error(`Command timed out after ${duration}ms`));
          return;
        }

        if (code === 0) {
          this.logger.info('Command completed successfully', { 
            command, 
            commandId, 
            duration 
          });
          resolve({ stdout, stderr, code, duration });
        } else {
          this.logger.error('Command failed', { 
            command, 
            commandId, 
            code, 
            duration,
            stderr: stderr.slice(-500),
          });
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Command execution error', { 
          command, 
          commandId, 
          error: error.message 
        });
        reject(error);
      });

      // Track process
      this.monitoredProcesses.set(commandId, {
        process,
        startTime,
        command,
        args,
      });
    });
  }

  /**
   * Check for hanging processes
   */
  async checkHangingProcesses() {
    const now = Date.now();
    const hangingProcesses = [];

    for (const [id, info] of this.monitoredProcesses.entries()) {
      const duration = now - info.startTime;
      
      if (duration > CONFIG.HANGING_THRESHOLD) {
        hangingProcesses.push({
          id,
          command: info.command,
          duration,
        });
      }
    }

    if (hangingProcesses.length > 0) {
      this.logger.warn('Hanging processes detected', { 
        count: hangingProcesses.length,
        processes: hangingProcesses,
      });
    }

    return hangingProcesses;
  }

  /**
   * Kill a monitored process
   */
  killProcess(commandId) {
    const info = this.monitoredProcesses.get(commandId);
    if (info && !info.process.killed) {
      this.logger.warn('Killing process', { commandId, command: info.command });
      info.process.kill('SIGKILL');
      this.monitoredProcesses.delete(commandId);
      return true;
    }
    return false;
  }

  /**
   * Clean up completed processes
   */
  cleanup() {
    for (const [id, info] of this.monitoredProcesses.entries()) {
      if (info.process.killed || info.process.exitCode !== null) {
        this.monitoredProcesses.delete(id);
      }
    }
  }
}

// Terminal health checker class
class TerminalHealthChecker {
  constructor(logger) {
    this.logger = logger;
    this.processMonitor = new ProcessMonitor(logger);
    this.healthHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Check overall terminal health
   */
  async checkHealth() {
    const startTime = Date.now();
    
    try {
      // Run a simple command to test responsiveness
      const result = await this.processMonitor.executeWithMonitoring('echo', ['health-check'], {
        timeout: CONFIG.LAG_THRESHOLD,
      });

      const duration = Date.now() - startTime;
      const status = this.determineHealthStatus(duration);

      this.recordHealthCheck(status, duration);
      
      this.logger.info('Health check completed', { 
        status, 
        duration,
        timestamp: new Date().toISOString(),
      });

      return {
        status,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      this.recordHealthCheck(HealthStatus.STOPPED, Date.now() - startTime);
      
      return {
        status: HealthStatus.STOPPED,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Determine health status based on execution time
   */
  determineHealthStatus(duration) {
    if (duration > CONFIG.HANGING_THRESHOLD) {
      return HealthStatus.HANGING;
    } else if (duration > CONFIG.LAG_THRESHOLD) {
      return HealthStatus.LAGGING;
    } else {
      return HealthStatus.HEALTHY;
    }
  }

  /**
   * Record health check result
   */
  recordHealthCheck(status, duration) {
    this.healthHistory.push({
      status,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Keep history size manageable
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health statistics
   */
  getHealthStats() {
    if (this.healthHistory.length === 0) {
      return null;
    }

    const recentChecks = this.healthHistory.slice(-10);
    const statusCounts = recentChecks.reduce((acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    }, {});

    const avgDuration = recentChecks.reduce((sum, check) => sum + check.duration, 0) / recentChecks.length;

    return {
      totalChecks: this.healthHistory.length,
      recentChecks: recentChecks.length,
      statusCounts,
      averageDuration: Math.round(avgDuration),
      lastCheck: this.healthHistory[this.healthHistory.length - 1],
    };
  }

  /**
   * Get health report
   */
  getHealthReport() {
    const stats = this.getHealthStats();
    const hangingProcesses = await this.processMonitor.checkHangingProcesses();

    return {
      timestamp: new Date().toISOString(),
      stats,
      hangingProcesses,
      recommendations: this.generateRecommendations(stats, hangingProcesses),
    };
  }

  /**
   * Generate recommendations based on health status
   */
  generateRecommendations(stats, hangingProcesses) {
    const recommendations = [];

    if (hangingProcesses.length > 0) {
      recommendations.push({
        severity: 'critical',
        message: `${hangingProcesses.length} hanging process(es) detected`,
        action: 'Consider killing hanging processes or restarting terminal',
      });
    }

    if (stats && stats.statusCounts[HealthStatus.LAGGING] > 3) {
      recommendations.push({
        severity: 'warning',
        message: 'Terminal is consistently lagging',
        action: 'Check system resources and consider reducing concurrent operations',
      });
    }

    if (stats && stats.statusCounts[HealthStatus.STOPPED] > 0) {
      recommendations.push({
        severity: 'critical',
        message: 'Terminal has stopped responding',
        action: 'Restart terminal session immediately',
      });
    }

    return recommendations;
  }
}

// Main execution
async function main() {
  const logger = new Logger(CONFIG.LOG_DIR, CONFIG.LOG_FILE);
  const healthChecker = new TerminalHealthChecker(logger);

  logger.info('Terminal Health Monitor started');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      const health = await healthChecker.checkHealth();
      console.log(JSON.stringify(health, null, 2));
      break;

    case 'report':
      const report = healthChecker.getHealthReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'monitor':
      logger.info('Starting continuous monitoring');
      setInterval(async () => {
        await healthChecker.checkHealth();
        healthChecker.processMonitor.cleanup();
      }, CONFIG.CHECK_INTERVAL);
      break;

    case 'execute':
      const cmd = args[1];
      const cmdArgs = args.slice(2);
      if (!cmd) {
        logger.error('No command specified for execute');
        process.exit(1);
      }
      try {
        const result = await healthChecker.processMonitor.executeWithMonitoring(cmd, cmdArgs);
        console.log(result.stdout);
        process.exit(0);
      } catch (error) {
        logger.error('Command execution failed', { error: error.message });
        process.exit(1);
      }
      break;

    default:
      console.log(`
Terminal Health Monitor

Usage:
  node terminal-health-monitor.js check          - Perform a single health check
  node terminal-health-monitor.js report         - Generate health report
  node terminal-health-monitor.js monitor        - Start continuous monitoring
  node terminal-health-monitor.js execute <cmd>  - Execute command with monitoring

Examples:
  node terminal-health-monitor.js check
  node terminal-health-monitor.js execute npm install
  node terminal-health-monitor.js monitor
      `);
  }
}

// Export for use as module
module.exports = {
  TerminalHealthChecker,
  ProcessMonitor,
  Logger,
  HealthStatus,
  CONFIG,
};

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
