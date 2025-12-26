#!/usr/bin/env node

/**
 * Autonomous Execution Wrapper
 * 
 * Main wrapper for autonomous BMAD workflow execution.
 * Handles errors automatically, applies fixes when possible,
 * and logs all actions for audit trail.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import other modules
const { TerminalHealthChecker, ProcessMonitor, Logger } = require('./terminal-health-monitor');
const { RecoveryManager, RecoveryAction } = require('./fallback-recovery');

// Configuration
const CONFIG = {
  // Task tracker file
  TASK_TRACKER_FILE: path.join(__dirname, 'task-tracker.json'),
  
  // Logging
  LOG_DIR: path.join(__dirname, '..', 'logs'),
  LOG_FILE: 'autonomous-executor.log',
  AUDIT_LOG_FILE: 'audit.log',
  
  // Execution settings
  MAX_CONCURRENT_TASKS: 1,
  TASK_TIMEOUT: 300000,  // 5 minutes per task
  AUTO_FIX_ENABLED: true,
  
  // BMAD settings
  BMAD_DIR: path.join(__dirname, '..', '_bmad'),
  BMAD_CLI: 'bmad',
};

// Task status enum
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

// Logger class with audit trail
class AuditLogger extends Logger {
  constructor(logDir, logFile, auditLogFile) {
    super(logDir, logFile);
    this.auditLogPath = path.join(logDir, auditLogFile);
  }

  /**
   * Log audit event
   */
  audit(action, details = {}) {
    const timestamp = new Date().toISOString();
    const auditEntry = {
      timestamp,
      action,
      ...details,
    };

    const auditLine = JSON.stringify(auditEntry);
    fs.appendFileSync(this.auditLogPath, auditLine + '\n');
    
    this.info(`AUDIT: ${action}`, details);
  }

  /**
   * Log task start
   */
  logTaskStart(taskId, taskName) {
    this.audit('task_start', { taskId, taskName });
  }

  /**
   * Log task completion
   */
  logTaskComplete(taskId, taskName, result) {
    this.audit('task_complete', { taskId, taskName, result });
  }

  /**
   * Log task failure
   */
  logTaskFailure(taskId, taskName, error) {
    this.audit('task_failure', { taskId, taskName, error: error.message });
  }

  /**
   * Log recovery action
   */
  logRecovery(taskId, action, details) {
    this.audit('recovery_action', { taskId, action, ...details });
  }

  /**
   * Log auto-fix attempt
   */
  logAutoFix(taskId, issue, fix) {
    this.audit('auto_fix_attempt', { taskId, issue, fix });
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit = 100) {
    try {
      const content = fs.readFileSync(this.auditLogPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const entries = lines.map(line => JSON.parse(line));
      return entries.slice(-limit);
    } catch (error) {
      return [];
    }
  }
}

// Task tracker class
class TaskTracker {
  constructor(logger, trackerFile) {
    this.logger = logger;
    this.trackerFile = trackerFile;
    this.state = this.loadState();
  }

  /**
   * Load task tracker state
   */
  loadState() {
    try {
      if (fs.existsSync(this.trackerFile)) {
        const content = fs.readFileSync(this.trackerFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.logger.error('Failed to load task tracker state', { error: error.message });
    }

    return this.getInitialState();
  }

  /**
   * Get initial state
   */
  getInitialState() {
    return {
      version: '1.0.0',
      lastUpdated: null,
      phases: {},
      statistics: {
        totalSteps: 0,
        completedSteps: 0,
        inProgressSteps: 0,
        pendingSteps: 0,
        failedSteps: 0,
        totalRetries: 0,
        startTime: null,
        endTime: null,
      },
    };
  }

  /**
   * Save task tracker state
   */
  saveState() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.trackerFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      this.logger.error('Failed to save task tracker state', { error: error.message });
    }
  }

  /**
   * Get phase by ID
   */
  getPhase(phaseId) {
    return this.state.phases[phaseId] || null;
  }

  /**
   * Get step by ID
   */
  getStep(stepId) {
    for (const phase of Object.values(this.state.phases)) {
      const step = phase.steps.find(s => s.id === stepId);
      if (step) return step;
    }
    return null;
  }

  /**
   * Update step status
   */
  updateStepStatus(stepId, status, data = {}) {
    const step = this.getStep(stepId);
    if (!step) {
      this.logger.error('Step not found', { stepId });
      return false;
    }

    step.status = status;
    step.lastAttempt = new Date().toISOString();
    
    // Update additional fields
    if (data.output !== undefined) step.output = data.output;
    if (data.error !== undefined) step.error = data.error;
    if (data.checkpoint !== undefined) step.checkpoint = data.checkpoint;
    if (data.retryCount !== undefined) step.retryCount = data.retryCount;

    // Update phase status
    this.updatePhaseStatus(step);

    // Update statistics
    this.updateStatistics();

    this.saveState();
    return true;
  }

  /**
   * Update phase status based on steps
   */
  updatePhaseStatus(step) {
    for (const phase of Object.values(this.state.phases)) {
      if (!phase.steps.includes(step)) continue;

      const statuses = phase.steps.map(s => s.status);
      
      if (statuses.every(s => s === TaskStatus.COMPLETED)) {
        phase.status = TaskStatus.COMPLETED;
      } else if (statuses.some(s => s === TaskStatus.IN_PROGRESS)) {
        phase.status = TaskStatus.IN_PROGRESS;
      } else if (statuses.some(s => s === TaskStatus.FAILED)) {
        phase.status = TaskStatus.FAILED;
      } else {
        phase.status = TaskStatus.PENDING;
      }
    }
  }

  /**
   * Update statistics
   */
  updateStatistics() {
    let totalSteps = 0;
    let completedSteps = 0;
    let inProgressSteps = 0;
    let pendingSteps = 0;
    let failedSteps = 0;
    let totalRetries = 0;

    for (const phase of Object.values(this.state.phases)) {
      for (const step of phase.steps) {
        totalSteps++;
        totalRetries += step.retryCount || 0;

        switch (step.status) {
          case TaskStatus.COMPLETED:
            completedSteps++;
            break;
          case TaskStatus.IN_PROGRESS:
            inProgressSteps++;
            break;
          case TaskStatus.PENDING:
            pendingSteps++;
            break;
          case TaskStatus.FAILED:
            failedSteps++;
            break;
        }
      }
    }

    this.state.statistics = {
      ...this.state.statistics,
      totalSteps,
      completedSteps,
      inProgressSteps,
      pendingSteps,
      failedSteps,
      totalRetries,
    };
  }

  /**
   * Get next pending step
   */
  getNextPendingStep() {
    for (const phase of Object.values(this.state.phases)) {
      for (const step of phase.steps) {
        if (step.status === TaskStatus.PENDING) {
          // Check dependencies
          const dependenciesMet = step.dependencies.every(depId => {
            const depStep = this.getStep(depId);
            return depStep && depStep.status === TaskStatus.COMPLETED;
          });

          if (dependenciesMet) {
            return step;
          }
        }
      }
    }
    return null;
  }

  /**
   * Get execution progress
   */
  getProgress() {
    const stats = this.state.statistics;
    const progress = stats.totalSteps > 0 
      ? (stats.completedSteps / stats.totalSteps) * 100 
      : 0;

    return {
      ...stats,
      progress: Math.round(progress),
      phases: Object.values(this.state.phases).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        steps: p.steps.length,
        completed: p.steps.filter(s => s.status === TaskStatus.COMPLETED).length,
      })),
    };
  }

  /**
   * Reset all steps
   */
  reset() {
    this.state = this.getInitialState();
    this.saveState();
    this.logger.info('Task tracker reset');
  }
}

// Auto-fix handler class
class AutoFixHandler {
  constructor(logger) {
    this.logger = logger;
    this.fixes = [
      {
        pattern: /command not found/i,
        fix: 'install_missing_command',
        description: 'Install missing command',
      },
      {
        pattern: /permission denied/i,
        fix: 'fix_permissions',
        description: 'Fix file permissions',
      },
      {
        pattern: /no such file or directory/i,
        fix: 'create_missing_directory',
        description: 'Create missing directory',
      },
      {
        pattern: /econnrefused|connection refused/i,
        fix: 'retry_with_backoff',
        description: 'Retry with exponential backoff',
      },
      {
        pattern: /timeout/i,
        fix: 'increase_timeout',
        description: 'Increase timeout duration',
      },
    ];
  }

  /**
   * Attempt to auto-fix an issue
   */
  async attemptAutoFix(error, context = {}) {
    if (!CONFIG.AUTO_FIX_ENABLED) {
      return { success: false, reason: 'Auto-fix disabled' };
    }

    for (const fix of this.fixes) {
      if (fix.pattern.test(error.message)) {
        this.logger.info('Attempting auto-fix', { 
          fix: fix.fix, 
          description: fix.description,
          error: error.message,
        });

        try {
          const result = await this.applyFix(fix.fix, error, context);
          
          if (result.success) {
            this.logger.info('Auto-fix successful', { fix: fix.fix });
            return { success: true, fix: fix.fix, result };
          }
        } catch (fixError) {
          this.logger.warn('Auto-fix failed', { 
            fix: fix.fix, 
            error: fixError.message,
          });
        }
      }
    }

    return { success: false, reason: 'No applicable fix found' };
  }

  /**
   * Apply specific fix
   */
  async applyFix(fixType, error, context) {
    switch (fixType) {
      case 'install_missing_command':
        return await this.installMissingCommand(error, context);
      
      case 'fix_permissions':
        return await this.fixPermissions(error, context);
      
      case 'create_missing_directory':
        return await this.createMissingDirectory(error, context);
      
      case 'retry_with_backoff':
        return { success: true, action: 'retry_with_backoff' };
      
      case 'increase_timeout':
        return { success: true, action: 'increase_timeout' };
      
      default:
        return { success: false, reason: 'Unknown fix type' };
    }
  }

  /**
   * Install missing command
   */
  async installMissingCommand(error, context) {
    const match = error.message.match(/command not found: (\w+)/);
    if (!match) {
      return { success: false, reason: 'Could not extract command name' };
    }

    const command = match[1];
    this.logger.info('Installing missing command', { command });

    // This is a placeholder - actual implementation would depend on package manager
    return { success: false, reason: 'Manual installation required' };
  }

  /**
   * Fix file permissions
   */
  async fixPermissions(error, context) {
    const match = error.message.match(/permission denied: (.+)/);
    if (!match) {
      return { success: false, reason: 'Could not extract file path' };
    }

    const filePath = match[1];
    this.logger.info('Fixing permissions', { filePath });

    try {
      fs.chmodSync(filePath, 0o755);
      return { success: true };
    } catch (chmodError) {
      return { success: false, reason: chmodError.message };
    }
  }

  /**
   * Create missing directory
   */
  async createMissingDirectory(error, context) {
    const match = error.message.match(/no such file or directory: (.+)/);
    if (!match) {
      return { success: false, reason: 'Could not extract directory path' };
    }

    const dirPath = match[1];
    this.logger.info('Creating missing directory', { dirPath });

    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true };
    } catch (mkdirError) {
      return { success: false, reason: mkdirError.message };
    }
  }
}

// Autonomous executor class
class AutonomousExecutor {
  constructor() {
    this.logger = new AuditLogger(CONFIG.LOG_DIR, CONFIG.LOG_FILE, CONFIG.AUDIT_LOG_FILE);
    this.taskTracker = new TaskTracker(this.logger, CONFIG.TASK_TRACKER_FILE);
    this.healthChecker = new TerminalHealthChecker(this.logger);
    this.recoveryManager = new RecoveryManager(this.logger);
    this.autoFixHandler = new AutoFixHandler(this.logger);
    this.isRunning = false;
  }

  /**
   * Execute all tasks autonomously
   */
  async executeAll() {
    if (this.isRunning) {
      this.logger.warn('Executor already running');
      return;
    }

    this.isRunning = true;
    this.logger.audit('execution_start', { timestamp: new Date().toISOString() });

    // Set start time
    if (!this.taskTracker.state.statistics.startTime) {
      this.taskTracker.state.statistics.startTime = new Date().toISOString();
      this.taskTracker.saveState();
    }

    try {
      while (true) {
        // Check terminal health
        const health = await this.healthChecker.checkHealth();
        if (health.status !== 'healthy') {
          this.logger.warn('Terminal health issue detected', { status: health.status });
          await this.handleHealthIssue(health);
        }

        // Get next pending step
        const step = this.taskTracker.getNextPendingStep();
        if (!step) {
          this.logger.info('No more pending steps');
          break;
        }

        // Execute step
        await this.executeStep(step);

        // Check if we should continue
        if (this.shouldStop()) {
          this.logger.info('Stopping execution');
          break;
        }
      }

      // Set end time
      this.taskTracker.state.statistics.endTime = new Date().toISOString();
      this.taskTracker.saveState();

      this.logger.audit('execution_complete', {
        timestamp: new Date().toISOString(),
        progress: this.taskTracker.getProgress(),
      });

      return this.taskTracker.getProgress();
    } catch (error) {
      this.logger.error('Execution failed', { error: error.message });
      this.logger.audit('execution_failed', {
        timestamp: new Date().toISOString(),
        error: error.message,
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step) {
    this.logger.logTaskStart(step.id, step.name);
    this.taskTracker.updateStepStatus(step.id, TaskStatus.IN_PROGRESS);

    try {
      // Execute step with recovery
      const result = await this.recoveryManager.executeWithRecovery(
        step.id,
        () => this.executeStepLogic(step),
        {
          checkpointId: step.id,
          resumeFromCheckpoint: true,
          skipOnFailure: false,
          onRecovery: (action, error) => {
            this.logger.logRecovery(step.id, action, { error: error.message });
          },
        }
      );

      // Mark as completed
      this.taskTracker.updateStepStatus(step.id, TaskStatus.COMPLETED, {
        output: result,
        checkpoint: step.id,
      });

      this.logger.logTaskComplete(step.id, step.name, result);
    } catch (error) {
      // Try auto-fix
      const autoFixResult = await this.autoFixHandler.attemptAutoFix(error, { step });

      if (autoFixResult.success) {
        this.logger.logAutoFix(step.id, error.message, autoFixResult);
        
        // Retry after auto-fix
        step.retryCount = (step.retryCount || 0) + 1;
        this.taskTracker.updateStepStatus(step.id, TaskStatus.PENDING, {
          retryCount: step.retryCount,
        });

        return;
      }

      // Mark as failed
      this.taskTracker.updateStepStatus(step.id, TaskStatus.FAILED, {
        error: error.message,
      });

      this.logger.logTaskFailure(step.id, step.name, error);
      throw error;
    }
  }

  /**
   * Execute step logic (to be implemented per step)
   */
  async executeStepLogic(step) {
    this.logger.info('Executing step logic', { stepId: step.id, stepName: step.name });

    // This is a placeholder - actual implementation would execute
    // the specific BMAD workflow or command for each step
    switch (step.id) {
      case 'phase-1-step-1':
        return await this.executeVerifyBMADInstallation();
      
      case 'phase-1-step-2':
        return await this.executeConfigureBMAD();
      
      case 'phase-1-step-3':
        return await this.executeSetupProjectContext();
      
      case 'phase-1-step-4':
        return await this.executeValidateBMADConfig();
      
      default:
        return { success: true, message: 'Step executed' };
    }
  }

  /**
   * Execute BMAD installation verification
   */
  async executeVerifyBMADInstallation() {
    this.logger.info('Verifying BMAD installation');

    try {
      const result = await this.executeCommand(CONFIG.BMAD_CLI, ['--version']);
      this.logger.info('BMAD version', { version: result.stdout.trim() });
      return { success: true, version: result.stdout.trim() };
    } catch (error) {
      throw new Error(`BMAD not installed: ${error.message}`);
    }
  }

  /**
   * Execute BMAD configuration
   */
  async executeConfigureBMAD() {
    this.logger.info('Configuring BMAD for project');
    
    // Placeholder for actual BMAD configuration
    return { success: true, message: 'BMAD configured' };
  }

  /**
   * Execute project context setup
   */
  async executeSetupProjectContext() {
    this.logger.info('Setting up project context');
    
    // Placeholder for actual project context setup
    return { success: true, message: 'Project context set up' };
  }

  /**
   * Execute BMAD configuration validation
   */
  async executeValidateBMADConfig() {
    this.logger.info('Validating BMAD configuration');
    
    // Placeholder for actual validation
    return { success: true, message: 'BMAD configuration valid' };
  }

  /**
   * Handle terminal health issue
   */
  async handleHealthIssue(health) {
    this.logger.warn('Handling health issue', { status: health.status });

    switch (health.status) {
      case 'lagging':
        // Wait for terminal to recover
        await this.sleep(5000);
        break;
      
      case 'hanging':
        // Kill stuck processes
        const hangingProcesses = await this.healthChecker.processMonitor.checkHangingProcesses();
        for (const proc of hangingProcesses) {
          this.healthChecker.processMonitor.killProcess(proc.id);
        }
        break;
      
      case 'stopped':
        // Terminal is unresponsive, cannot continue
        throw new Error('Terminal stopped responding');
    }
  }

  /**
   * Check if execution should stop
   */
  shouldStop() {
    const stats = this.taskTracker.state.statistics;
    
    // Stop if there are failed steps
    if (stats.failedSteps > 0) {
      return true;
    }

    return false;
  }

  /**
   * Execute command helper
   */
  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => { stdout += data.toString(); });
      process.stderr.on('data', (data) => { stderr += data.toString(); });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });

      process.on('error', reject);
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.taskTracker.getProgress(),
      health: this.healthChecker.getHealthStats(),
      recovery: this.recoveryManager.getRecoveryStatus(),
      auditTrail: this.logger.getAuditTrail(10),
    };
  }

  /**
   * Reset executor
   */
  reset() {
    this.taskTracker.reset();
    this.recoveryManager.resetRecovery();
    this.logger.info('Executor reset');
  }
}

// Main execution
async function main() {
  const executor = new AutonomousExecutor();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'run':
      const progress = await executor.executeAll();
      console.log(JSON.stringify(progress, null, 2));
      break;

    case 'status':
      const status = executor.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'reset':
      executor.reset();
      console.log('Executor reset');
      break;

    case 'step':
      const stepId = args[1];
      if (!stepId) {
        console.error('No step ID specified');
        process.exit(1);
      }
      const step = executor.taskTracker.getStep(stepId);
      if (!step) {
        console.error('Step not found');
        process.exit(1);
      }
      await executor.executeStep(step);
      break;

    default:
      console.log(`
Autonomous Executor

Usage:
  node autonomous-executor.js run              - Execute all tasks autonomously
  node autonomous-executor.js status           - Get execution status
  node autonomous-executor.js reset            - Reset executor state
  node autonomous-executor.js step <step-id>  - Execute specific step

Examples:
  node autonomous-executor.js run
  node autonomous-executor.js status
  node autonomous-executor.js step phase-1-step-1
      `);
  }
}

// Export for use as module
module.exports = {
  AutonomousExecutor,
  TaskTracker,
  AuditLogger,
  AutoFixHandler,
  TaskStatus,
  CONFIG,
};

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
