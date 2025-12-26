#!/bin/bash

###############################################################################
# BMAD Integration Runner
#
# Shell script to run the BMAD integration with autonomous execution,
# fallback mechanisms, and comprehensive logging.
#
# Usage:
#   ./bmad-integration-runner.sh [command] [options]
#
# Commands:
#   run           - Run full BMAD integration autonomously
#   status        - Show current execution status
#   reset         - Reset all state and checkpoints
#   health        - Check terminal health
#   monitor       - Start continuous health monitoring
#   resume        - Resume from last checkpoint
#   step <id>    - Execute specific step
#
# Examples:
#   ./bmad-integration-runner.sh run
#   ./bmad-integration-runner.sh status
#   ./bmad-integration-runner.sh step phase-1-step-1
###############################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/bmad-integration.log"
AUDIT_FILE="${LOG_DIR}/audit.log"

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

###############################################################################
# Logging Functions
###############################################################################

log_info() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    echo -e "${BLUE}[${timestamp}] [INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_success() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    echo -e "${GREEN}[${timestamp}] [SUCCESS]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_warning() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    echo -e "${YELLOW}[${timestamp}] [WARNING]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_error() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    echo -e "${RED}[${timestamp}] [ERROR]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_audit() {
    local action="$1"
    local details="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    echo "{\"timestamp\":\"${timestamp}\",\"action\":\"${action}\",\"details\":${details}}" >> "${AUDIT_FILE}"
}

###############################################################################
# Health Check Functions
###############################################################################

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        return 1
    fi
    log_info "Node.js version: $(node --version)"
    return 0
}

check_bmad() {
    if ! command -v bmad &> /dev/null; then
        log_error "BMAD CLI is not installed"
        return 1
    fi
    log_info "BMAD version: $(bmad --version 2>&1 || echo 'unknown')"
    return 0
}

check_project_structure() {
    if [[ ! -d "${PROJECT_ROOT}/_bmad" ]]; then
        log_error "BMAD directory not found at ${PROJECT_ROOT}/_bmad"
        return 1
    fi
    log_info "BMAD directory found"
    return 0
}

check_terminal_health() {
    log_info "Checking terminal health..."
    
    # Run health check via Node.js script
    local health_output
    health_output=$(cd "${SCRIPT_DIR}" && node terminal-health-monitor.js check 2>&1)
    local health_status=$?
    
    if [[ $health_status -eq 0 ]]; then
        log_success "Terminal health check passed"
        echo "$health_output"
        return 0
    else
        log_error "Terminal health check failed"
        echo "$health_output"
        return 1
    fi
}

###############################################################################
# Process Management Functions
###############################################################################

kill_stuck_processes() {
    log_info "Checking for stuck processes..."
    
    # Find and kill processes that have been running too long
    local stuck_pids=$(ps aux | grep -E "(node|npm|yarn|pnpm)" | grep -v grep | awk '{if ($10 > 3600) print $2}')
    
    if [[ -n "$stuck_pids" ]]; then
        log_warning "Found stuck processes: $stuck_pids"
        echo "$stuck_pids" | xargs kill -9 2>/dev/null || true
        log_success "Killed stuck processes"
    else
        log_info "No stuck processes found"
    fi
}

###############################################################################
# Execution Functions
###############################################################################

run_with_retry() {
    local command="$1"
    local max_retries="${2:-3}"
    local retry_delay="${3:-5}"
    
    local attempt=1
    local exit_code=1
    
    while [[ $attempt -le $max_retries ]]; do
        log_info "Attempt $attempt/$max_retries: $command"
        
        if eval "$command"; then
            log_success "Command succeeded on attempt $attempt"
            return 0
        else
            exit_code=$?
            log_warning "Command failed on attempt $attempt (exit code: $exit_code)"
            
            if [[ $attempt -lt $max_retries ]]; then
                log_info "Waiting ${retry_delay}s before retry..."
                sleep $retry_delay
                retry_delay=$((retry_delay * 2))  # Exponential backoff
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Command failed after $max_retries attempts"
    return $exit_code
}

run_with_timeout() {
    local command="$1"
    local timeout="${2:-300}"  # Default 5 minutes
    
    log_info "Running command with ${timeout}s timeout: $command"
    
    timeout $timeout bash -c "$command"
    local exit_code=$?
    
    if [[ $exit_code -eq 124 ]]; then
        log_error "Command timed out after ${timeout}s"
        return 124
    elif [[ $exit_code -eq 0 ]]; then
        log_success "Command completed successfully"
        return 0
    else
        log_error "Command failed with exit code $exit_code"
        return $exit_code
    fi
}

###############################################################################
# BMAD Integration Functions
###############################################################################

run_bmad_integration() {
    log_info "Starting BMAD integration..."
    log_audit "integration_start" "{\"project\":\"${PROJECT_ROOT}\"}"
    
    # Pre-flight checks
    log_info "Running pre-flight checks..."
    check_node || return 1
    check_bmad || return 1
    check_project_structure || return 1
    
    # Check terminal health
    check_terminal_health || log_warning "Terminal health check failed, continuing anyway"
    
    # Kill any stuck processes
    kill_stuck_processes
    
    # Run autonomous executor
    log_info "Running autonomous executor..."
    cd "${SCRIPT_DIR}"
    
    if node autonomous-executor.js run; then
        log_success "BMAD integration completed successfully"
        log_audit "integration_complete" "{\"status\":\"success\"}"
        return 0
    else
        log_error "BMAD integration failed"
        log_audit "integration_failed" "{\"status\":\"failed\"}"
        return 1
    fi
}

show_status() {
    log_info "Getting execution status..."
    cd "${SCRIPT_DIR}"
    
    # Get status from autonomous executor
    local status_output
    status_output=$(node autonomous-executor.js status 2>&1)
    echo "$status_output"
    
    # Get recovery status
    log_info "Recovery status:"
    node fallback-recovery.js status 2>&1 || true
    
    # Get health report
    log_info "Health report:"
    node terminal-health-monitor.js report 2>&1 || true
}

reset_state() {
    log_warning "Resetting all state and checkpoints..."
    log_audit "reset_start" "{}"
    
    cd "${SCRIPT_DIR}"
    
    # Reset autonomous executor
    node autonomous-executor.js reset 2>&1 || true
    
    # Reset recovery state
    node fallback-recovery.js reset 2>&1 || true
    
    # Clear checkpoints
    rm -rf "${PROJECT_ROOT}/.checkpoints" 2>/dev/null || true
    
    # Clear logs (optional - comment out if you want to keep logs)
    # rm -f "${LOG_DIR}"/*.log 2>/dev/null || true
    
    log_success "State reset complete"
    log_audit "reset_complete" "{}"
}

resume_from_checkpoint() {
    log_info "Resuming from last checkpoint..."
    log_audit "resume_start" "{}"
    
    cd "${SCRIPT_DIR}"
    
    # Get last checkpoint
    local last_checkpoint
    last_checkpoint=$(node fallback-recovery.js status 2>&1 | grep -o '"lastCheckpoint":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -n "$last_checkpoint" ]]; then
        log_info "Resuming from checkpoint: $last_checkpoint"
        node fallback-recovery.js resume "$last_checkpoint" 2>&1
    else
        log_warning "No checkpoint found, starting fresh"
        run_bmad_integration
    fi
}

execute_step() {
    local step_id="$1"
    
    if [[ -z "$step_id" ]]; then
        log_error "No step ID specified"
        echo "Usage: $0 step <step-id>"
        return 1
    fi
    
    log_info "Executing step: $step_id"
    log_audit "step_start" "{\"stepId\":\"${step_id}\"}"
    
    cd "${SCRIPT_DIR}"
    
    if node autonomous-executor.js step "$step_id"; then
        log_success "Step completed: $step_id"
        log_audit "step_complete" "{\"stepId\":\"${step_id}\",\"status\":\"success\"}"
        return 0
    else
        log_error "Step failed: $step_id"
        log_audit "step_failed" "{\"stepId\":\"${step_id}\",\"status\":\"failed\"}"
        return 1
    fi
}

start_monitoring() {
    log_info "Starting continuous health monitoring..."
    log_audit "monitoring_start" "{}"
    
    cd "${SCRIPT_DIR}"
    
    # Run health monitor in background
    node terminal-health-monitor.js monitor &
    local monitor_pid=$!
    
    log_info "Health monitoring started (PID: $monitor_pid)"
    echo "$monitor_pid"
    
    # Save PID for later cleanup
    echo "$monitor_pid" > "${LOG_DIR}/monitor.pid"
}

stop_monitoring() {
    log_info "Stopping health monitoring..."
    
    if [[ -f "${LOG_DIR}/monitor.pid" ]]; then
        local monitor_pid=$(cat "${LOG_DIR}/monitor.pid")
        if kill -0 "$monitor_pid" 2>/dev/null; then
            kill "$monitor_pid"
            log_success "Health monitoring stopped (PID: $monitor_pid)"
        fi
        rm -f "${LOG_DIR}/monitor.pid"
    fi
}

###############################################################################
# Help Function
###############################################################################

show_help() {
    cat << EOF
BMAD Integration Runner

Usage:
    $0 [command] [options]

Commands:
    run                    Run full BMAD integration autonomously
    status                 Show current execution status
    reset                  Reset all state and checkpoints
    health                 Check terminal health
    monitor                Start continuous health monitoring
    stop-monitor           Stop health monitoring
    resume                 Resume from last checkpoint
    step <id>             Execute specific step

Examples:
    $0 run
    $0 status
    $0 step phase-1-step-1
    $0 health
    $0 monitor

Environment Variables:
    BMAD_DIR              BMAD directory (default: ./_bmad)
    LOG_DIR               Log directory (default: ./logs)
    MAX_RETRIES           Maximum retry attempts (default: 3)
    COMMAND_TIMEOUT        Command timeout in seconds (default: 300)

Files:
    scripts/terminal-health-monitor.js    Terminal health monitoring
    scripts/fallback-recovery.js         Fallback and recovery mechanisms
    scripts/autonomous-executor.js       Autonomous execution wrapper
    scripts/task-tracker.json             Task state tracking
    logs/terminal-health.log             Health check logs
    logs/fallback-recovery.log          Recovery logs
    logs/autonomous-executor.log        Execution logs
    logs/audit.log                      Audit trail
    .checkpoints/                       Checkpoint data

EOF
}

###############################################################################
# Main Entry Point
###############################################################################

main() {
    local command="${1:-help}"
    
    case "$command" in
        run)
            run_bmad_integration
            ;;
        
        status)
            show_status
            ;;
        
        reset)
            reset_state
            ;;
        
        health)
            check_terminal_health
            ;;
        
        monitor)
            start_monitoring
            ;;
        
        stop-monitor)
            stop_monitoring
            ;;
        
        resume)
            resume_from_checkpoint
            ;;
        
        step)
            execute_step "$2"
            ;;
        
        help|--help|-h)
            show_help
            ;;
        
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
