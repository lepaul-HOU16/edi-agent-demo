#!/bin/bash

# 24-Hour Production Monitoring Script
# Monitors critical thinking indicator fixes and system health

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
LOG_FILE="monitoring-log-24h.txt"
CHECK_INTERVAL=3600  # 1 hour in seconds
PRODUCTION_URL="https://d2hkqpgqguj4do.cloudfront.net"

# Function to log with timestamp
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Function to log success
log_success() {
    local message="$1"
    echo -e "${GREEN}✅ $message${NC}"
    echo "✅ $message" >> "$LOG_FILE"
}

# Function to log warning
log_warning() {
    local message="$1"
    echo -e "${YELLOW}⚠️  $message${NC}"
    echo "⚠️  $message" >> "$LOG_FILE"
}

# Function to log error
log_error() {
    local message="$1"
    echo -e "${RED}❌ $message${NC}"
    echo "❌ $message" >> "$LOG_FILE"
}

# Function to print header
print_header() {
    local title="$1"
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$title${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to check CloudWatch errors
check_cloudwatch_errors() {
    print_header "🔍 Checking CloudWatch Logs for Errors"
    
    if [ -f "./check-cloudwatch-errors.sh" ]; then
        log_message "Running CloudWatch error check..."
        bash ./check-cloudwatch-errors.sh >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            log_success "CloudWatch check completed"
        else
            log_warning "CloudWatch check had issues"
        fi
    else
        log_warning "check-cloudwatch-errors.sh not found, skipping"
    fi
}

# Function to check DynamoDB streaming messages
check_dynamodb_messages() {
    print_header "💾 Checking DynamoDB for Stale Streaming Messages"
    
    if [ -f "./check-dynamodb-streaming-messages.sh" ]; then
        log_message "Running DynamoDB message check..."
        bash ./check-dynamodb-streaming-messages.sh >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            log_success "DynamoDB check completed"
        else
            log_warning "DynamoDB check had issues"
        fi
    else
        log_warning "check-dynamodb-streaming-messages.sh not found, skipping"
    fi
}

# Function to run regression tests
run_regression_tests() {
    print_header "🧪 Running Automated Regression Tests"
    
    if [ -f "./test-all-agents-regression.js" ]; then
        log_message "Running regression tests..."
        node test-all-agents-regression.js >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            log_success "Regression tests passed"
        else
            log_error "Regression tests failed - CHECK IMMEDIATELY"
        fi
    else
        log_warning "test-all-agents-regression.js not found, skipping"
    fi
}

# Function to perform full monitoring check
perform_check() {
    local check_number=$1
    
    print_header "🔄 Monitoring Check #$check_number"
    log_message "Starting monitoring check #$check_number"
    
    # Check CloudWatch for errors
    check_cloudwatch_errors
    
    # Check DynamoDB for stale messages
    check_dynamodb_messages
    
    # Run regression tests
    run_regression_tests
    
    # Summary
    echo ""
    log_message "Check #$check_number completed"
    echo "---" >> "$LOG_FILE"
    echo ""
}

# Function to start monitoring
start_monitoring() {
    print_header "🚀 Starting 24-Hour Production Monitoring"
    
    log_message "Monitoring started"
    log_message "Production URL: $PRODUCTION_URL"
    log_message "Check interval: $CHECK_INTERVAL seconds (1 hour)"
    log_message "Log file: $LOG_FILE"
    
    # Create or clear log file
    echo "=== 24-Hour Production Monitoring Log ===" > "$LOG_FILE"
    echo "Started: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "Production URL: $PRODUCTION_URL" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Perform initial check
    perform_check 0
    
    # Schedule checks every hour for 24 hours
    local check_count=1
    local max_checks=24
    
    while [ $check_count -le $max_checks ]; do
        log_message "Waiting $CHECK_INTERVAL seconds until next check..."
        log_message "Next check: #$check_count at $(date -v+${CHECK_INTERVAL}S '+%Y-%m-%d %H:%M:%S')"
        
        sleep $CHECK_INTERVAL
        
        perform_check $check_count
        check_count=$((check_count + 1))
    done
    
    # Final summary
    print_header "✅ 24-Hour Monitoring Complete"
    log_message "Monitoring completed successfully"
    log_message "Total checks performed: $max_checks"
    log_message "Review log file: $LOG_FILE"
    
    echo ""
    echo -e "${GREEN}Monitoring complete! Review the log file for full details.${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Review $LOG_FILE for any errors or warnings"
    echo "2. Create final monitoring report"
    echo "3. Update tasks.md to mark Task 24 complete"
    echo "4. Document any issues found"
    echo ""
}

# Function to check current status
check_status() {
    print_header "📊 Current Monitoring Status"
    
    if [ -f "$LOG_FILE" ]; then
        echo -e "${GREEN}Monitoring log exists${NC}"
        echo ""
        echo "Last 10 entries:"
        tail -n 10 "$LOG_FILE"
        echo ""
        
        # Count errors and warnings
        local error_count=$(grep -c "❌" "$LOG_FILE" || true)
        local warning_count=$(grep -c "⚠️" "$LOG_FILE" || true)
        local success_count=$(grep -c "✅" "$LOG_FILE" || true)
        
        echo "Summary:"
        echo -e "${GREEN}✅ Successes: $success_count${NC}"
        echo -e "${YELLOW}⚠️  Warnings: $warning_count${NC}"
        echo -e "${RED}❌ Errors: $error_count${NC}"
    else
        echo -e "${YELLOW}No monitoring log found${NC}"
        echo "Run: ./monitor-production-24h.sh start"
    fi
}

# Function to run single manual check
run_manual_check() {
    print_header "🔍 Running Manual Check"
    
    if [ ! -f "$LOG_FILE" ]; then
        echo "=== Manual Check Log ===" > "$LOG_FILE"
        echo "Started: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
        echo "" >> "$LOG_FILE"
    fi
    
    perform_check "MANUAL"
    
    echo ""
    echo -e "${GREEN}Manual check complete${NC}"
    echo "Results logged to: $LOG_FILE"
}

# Function to show help
show_help() {
    echo "24-Hour Production Monitoring Script"
    echo ""
    echo "Usage: ./monitor-production-24h.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start 24-hour automated monitoring (runs checks every hour)"
    echo "  status   - Check current monitoring status"
    echo "  check    - Run a single manual check now"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./monitor-production-24h.sh start    # Start monitoring"
    echo "  ./monitor-production-24h.sh status   # Check status"
    echo "  ./monitor-production-24h.sh check    # Run manual check"
    echo ""
    echo "Monitoring includes:"
    echo "  - CloudWatch error checking"
    echo "  - DynamoDB stale message detection"
    echo "  - Automated regression tests"
    echo "  - System health verification"
    echo ""
    echo "All results are logged to: $LOG_FILE"
}

# Main script logic
case "${1:-help}" in
    start)
        start_monitoring
        ;;
    status)
        check_status
        ;;
    check)
        run_manual_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
