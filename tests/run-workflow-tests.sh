#!/bin/bash
# Quick script to run complete workflow tests for EDIcraft RCON reliability

echo "================================================================================"
echo "EDIcraft RCON Reliability - Complete Workflow Tests"
echo "================================================================================"
echo ""

# Check if Minecraft server is running
echo "Checking prerequisites..."
echo ""

# Check if config file exists
if [ ! -f "../edicraft-agent/config.ini" ]; then
    echo "❌ Error: config.ini not found in edicraft-agent/"
    echo "   Please create config.ini from config.ini.example"
    exit 1
fi

echo "✓ Configuration file found"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    echo "   Please install Python 3"
    exit 1
fi

echo "✓ Python 3 found"

# Check if required Python packages are installed
echo ""
echo "Checking Python dependencies..."
python3 -c "import rcon" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: rcon package not found"
    echo "   Installing dependencies..."
    pip3 install -r ../edicraft-agent/requirements.txt
fi

echo "✓ Dependencies ready"

# Run the tests
echo ""
echo "================================================================================"
echo "Running Complete Workflow Tests"
echo "================================================================================"
echo ""
echo "This will test:"
echo "  1. Clear Operation Workflow (build → clear → verify)"
echo "  2. Time Lock Workflow (set → wait 60s → verify)"
echo "  3. Terrain Fill Workflow (holes → fill → verify)"
echo "  4. Error Recovery Workflow (error → reconnect → retry)"
echo "  5. Performance Workflow (large clear → verify < 30s)"
echo ""
echo "Note: Tests will take approximately 2-3 minutes to complete"
echo ""
read -p "Press Enter to start tests (or Ctrl+C to cancel)..."
echo ""

# Run the test suite
python3 test-complete-workflows.py

# Capture exit code
EXIT_CODE=$?

echo ""
echo "================================================================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All workflow tests passed!"
    echo ""
    echo "Task 10 Complete: All workflows validated successfully"
    echo ""
    echo "Next steps:"
    echo "  1. Review test output above for details"
    echo "  2. Check TASK_10_COMPLETE_WORKFLOWS_TEST_GUIDE.md for more information"
    echo "  3. Proceed to Task 11 (Deploy and Validate)"
else
    echo "❌ Some workflow tests failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check Minecraft server is running"
    echo "  2. Verify RCON is enabled in server.properties"
    echo "  3. Check config.ini has correct RCON credentials"
    echo "  4. Review test output above for specific errors"
    echo "  5. See TASK_10_COMPLETE_WORKFLOWS_TEST_GUIDE.md for detailed troubleshooting"
fi
echo "================================================================================"

exit $EXIT_CODE
