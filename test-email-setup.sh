#!/bin/bash

# Email Setup Test Script for Vidyakosh LMS
# This script helps you test your email configuration

echo "🎓 Vidyakosh Email Setup Test"
echo "=============================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3001/api/test-email > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is not running. Please start it with: npm run dev"
    exit 1
fi

echo ""

# Test email configuration
echo "2. Testing email configuration..."
CONFIG_RESPONSE=$(curl -s http://localhost:3001/api/test-email)
echo "Configuration response:"
echo "$CONFIG_RESPONSE" | jq . 2>/dev/null || echo "$CONFIG_RESPONSE"

echo ""

# Check if Resend is configured
if echo "$CONFIG_RESPONSE" | grep -q '"resend":true'; then
    echo "✅ Resend is configured correctly!"
    
    # Ask for email to test
    echo ""
    read -p "3. Enter your email address to send a test email: " EMAIL
    
    if [ -n "$EMAIL" ]; then
        echo "Sending test email to $EMAIL..."
        TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/api/test-email \
            -H "Content-Type: application/json" \
            -d "{\"to\": \"$EMAIL\", \"subject\": \"Vidyakosh Test Email\", \"message\": \"This is a test email to verify your Resend configuration is working correctly!\"}")
        
        echo "Test email response:"
        echo "$TEST_RESPONSE" | jq . 2>/dev/null || echo "$TEST_RESPONSE"
        
        if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
            echo ""
            echo "🎉 SUCCESS! Test email sent successfully!"
            echo "Check your inbox (and spam folder) for the test email."
        else
            echo ""
            echo "❌ Failed to send test email. Check the error message above."
        fi
    else
        echo "No email provided. Skipping test email."
    fi
else
    echo "❌ Resend is not configured properly."
    echo ""
    echo "To fix this:"
    echo "1. Create a .env.local file in your project root"
    echo "2. Add: RESEND_API_KEY=re_your_actual_api_key_here"
    echo "3. Replace 're_your_actual_api_key_here' with your real Resend API key"
    echo "4. Restart your development server"
    echo "5. Run this script again"
    echo ""
    echo "Get your API key from: https://resend.com"
fi

echo ""
echo "📋 Next steps:"
echo "- If email configuration is working, test invitation emails at: http://localhost:3001/admin/invitations"
echo "- If not working, check the RESEND_EMAIL_SETUP_GUIDE.md file for detailed instructions"
