# Autonomous Implementation Environment

This directory contains scripts for autonomous BMAD integration with fallback mechanisms for terminal issues.

## Overview

The autonomous implementation environment provides:

- **Terminal Health Monitoring** - Detects lagging, stopped, or hanging terminals
- **Fallback/Recovery Mechanisms** - Automatic retry with exponential backoff
- **Task State Tracking** - Progress tracking with checkpoint/resume capability
- **Autonomous Execution** - Hands-off execution of BMAD workflows
- **Comprehensive Logging** - Audit trail for all operations

## Files

### Core Scripts

| File | Description |
|-------|-------------|
| [`terminal-health-monitor.js`](terminal-health-monitor.js) | Monitors terminal health and detects issues |
| [`fallback-recovery.js`](fallback-recovery.js) | Handles automatic recovery from failures |
| [`autonomous-executor.js`](autonomous-executor.js) | Main wrapper for autonomous execution |
| [`task-tracker.json`](task-tracker.json) | Task state tracking data |
| [`bmad-integration-runner.sh`](bmad-integration-runner.sh) | Shell script to run BMAD integration |

### Generated Directories

| Directory | Description |
|------------|-------------|
| `logs/` | Log files for all operations |
| `.checkpoints/` | Checkpoint data for recovery |

## Usage

### Quick Start

Run the full BMAD integration autonomously:

```bash
./scripts/bmad-integration-runner.sh run
```

### Available Commands

#### Shell Script ([`bmad-integration-runner.sh`](bmad-integration-runner.sh))

```bash
# Run full BMAD integration
./scripts/bmad-integration-runner.sh run

# Show execution status
./scripts/bmad-integration-runner.sh status

# Reset all state
./scripts/bmad-integration-runner.sh reset

# Check terminal health
./scripts/bmad-integration-runner.sh health

# Start continuous monitoring
./scripts/bmad-integration-runner.sh monitor

# Resume from last checkpoint
./scripts/bmad-integration-runner.sh resume

# Execute specific step
./scripts/bmad-integration-runner.sh step phase-1-step-1
```

#### Terminal Health Monitor ([`terminal-health-monitor.js`](terminal-health-monitor.js))

```bash
# Perform single health check
node scripts/terminal-health-monitor.js check

# Generate health report
node scripts/terminal-health-monitor.js report

# Start continuous monitoring
node scripts/terminal-health-monitor.js monitor

# Execute command with monitoring
node scripts/terminal-health-monitor.js execute npm install
```

#### Fallback/Recovery ([`fallback-recovery.js`](fallback-recovery.js))

```bash
# Execute command with retry
node scripts/fallback-recovery.js execute npm install

# Save checkpoint
node scripts/fallback-recovery.js checkpoint "phase-1-complete"

# Resume from checkpoint
node scripts/fallback-recovery.js resume "phase-1-complete"

# Get recovery status
node scripts/fallback-recovery.js status

# Reset recovery state
node scripts/fallback-recovery.js reset

# Kill process by PID
node scripts/fallback-recovery.js kill 12345
```

#### Autonomous Executor ([`autonomous-executor.js`](autonomous-executor.js))

```bash
# Execute all tasks autonomously
node scripts/autonomous-executor.js run

# Get execution status
node scripts/autonomous-executor.js status

# Reset executor state
node scripts/autonomous-executor.js reset

# Execute specific step
node scripts/autonomous-executor.js step phase-1-step-1
```

## Architecture

### Terminal Health Monitor

The [`TerminalHealthChecker`](terminal-health-monitor.js) class:

- Monitors command execution time
- Detects lagging (>5s), hanging (>60s), and stopped terminals
- Provides health statistics and recommendations
- Tracks health history for trend analysis

### Fallback/Recovery Mechanism

The [`RecoveryManager`](fallback-recovery.js) class:

- Executes commands with automatic retry
- Implements exponential backoff (1s → 2s → 4s → 8s → 16s → 30s max)
- Saves checkpoints after successful operations
- Enables resumption from last checkpoint
- Kills stuck processes automatically

### Task State Tracking

The [`TaskTracker`](autonomous-executor.js) class:

- Tracks 5 phases with 17 total steps
- Maintains dependency relationships between steps
- Records completion status, errors, and retry counts
- Provides progress percentage and statistics

### Autonomous Executor

The [`AutonomousExecutor`](autonomous-executor.js) class:

- Orchestrates all components
- Executes tasks with automatic recovery
- Applies auto-fixes when possible
- Maintains comprehensive audit trail

## Task Phases

### Phase 1: BMAD Configuration
1. Verify BMAD installation
2. Configure BMAD for dogtrainersdirectory project
3. Set up project context in BMAD
4. Validate BMAD configuration

### Phase 2: Custom Agent Creation
1. Create DogTrainerDirectory agent
2. Configure agent capabilities
3. Test agent functionality

### Phase 3: Workflow Development
1. Create directory listing workflow
2. Create trainer profile workflow
3. Create booking workflow
4. Validate workflows

### Phase 4: Project Execution
1. Execute directory listing workflow
2. Execute trainer profile workflow
3. Execute booking workflow

### Phase 5: Validation and Handoff
1. Validate all workflows
2. Generate documentation
3. Create handoff package

## Configuration

### Environment Variables

| Variable | Description | Default |
|-----------|-------------|----------|
| `BMAD_DIR` | BMAD directory path | `./_bmad` |
| `LOG_DIR` | Log directory path | `./logs` |
| `MAX_RETRIES` | Maximum retry attempts | `3` |
| `COMMAND_TIMEOUT` | Command timeout (seconds) | `300` |

### Script Configuration

Each script has a `CONFIG` object at the top that can be modified:

```javascript
const CONFIG = {
  COMMAND_TIMEOUT: 30000,        // 30 seconds
  HANGING_THRESHOLD: 60000,      // 1 minute
  LAG_THRESHOLD: 5000,           // 5 seconds
  CHECK_INTERVAL: 10000,          // 10 seconds
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 1000,       // 1 second
  MAX_BACKOFF_MS: 30000,          // 30 seconds
  BACKOFF_MULTIPLIER: 2,
};
```

## Logging

### Log Files

| File | Description |
|-------|-------------|
| `logs/terminal-health.log` | Terminal health check logs |
| `logs/fallback-recovery.log` | Recovery operation logs |
| `logs/autonomous-executor.log` | Execution logs |
| `logs/audit.log` | Audit trail (JSON) |

### Log Format

All logs use JSON format for easy parsing:

```json
{
  "timestamp": "2025-12-24T16:00:00.000Z",
  "level": "info",
  "message": "Command completed successfully",
  "command": "npm install",
  "duration": 12345
}
```

### Audit Trail

The audit log tracks all significant actions:

```json
{
  "timestamp": "2025-12-24T16:00:00.000Z",
  "action": "task_start",
  "taskId": "phase-1-step-1",
  "taskName": "Verify BMAD installation"
}
```

## Auto-Fix Capabilities

The system can automatically fix certain issues:

| Issue Pattern | Auto-Fix Action |
|--------------|------------------|
| `command not found` | Install missing command (manual) |
| `permission denied` | Fix file permissions |
| `no such file or directory` | Create missing directory |
| `ECONNREFUSED` | Retry with exponential backoff |
| `timeout` | Increase timeout duration |

## Recovery Actions

When a task fails, the system can:

1. **Retry** - Re-execute with exponential backoff
2. **Skip** - Continue to next task (if configured)
3. **Continue** - Use default value and proceed
4. **Terminate** - Stop execution (default for unrecoverable errors)

## Troubleshooting

### Terminal Issues

If the terminal becomes unresponsive:

```bash
# Check health
./scripts/bmad-integration-runner.sh health

# Kill stuck processes
./scripts/bmad-integration-runner.sh stop-monitor
```

### Failed Tasks

If a task fails repeatedly:

```bash
# Check status
./scripts/bmad-integration-runner.sh status

# View logs
cat logs/autonomous-executor.log

# Reset and retry
./scripts/bmad-integration-runner.sh reset
./scripts/bmad-integration-runner.sh run
```

### Checkpoint Issues

If checkpoints become corrupted:

```bash
# Reset recovery state
node scripts/fallback-recovery.js reset

# Clear checkpoints manually
rm -rf .checkpoints/
```

## Development

### Adding New Steps

1. Add step to [`task-tracker.json`](task-tracker.json)
2. Implement step logic in [`autonomous-executor.js`](autonomous-executor.js)
3. Add auto-fix pattern if needed in [`AutoFixHandler`](autonomous-executor.js)

### Adding Auto-Fixes

Add to the `fixes` array in [`AutoFixHandler`](autonomous-executor.js):

```javascript
{
  pattern: /your-error-pattern/i,
  fix: 'your_fix_function',
  description: 'Description of the fix',
}
```

## License

Part of the dogtrainersdirectory project.
