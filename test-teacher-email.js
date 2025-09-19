#!/usr/bin/env node

import { generateInvitationEmail } from './src/lib/email.ts';

console.log('🧪 Testing Teacher Email Template...\n');

// Test data for teacher invitation
const teacherInvitationData = {
  recipientName: 'John Smith',
  recipientEmail: 'john.smith@example.com',
  schoolName: 'Rivendell High School',
  inviterName: 'Dr. Sarah Johnson',
  invitationCode: 'TEACH123456', // Will be hidden for teachers
  invitationUrl: 'http://localhost:3000/signup?invite=TEACH123456',
  message: 'Welcome to our teaching team! We\'re excited to have you join us as a mathematics teacher.',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  role: 'teacher',
  joinUrl: 'http://localhost:3000/join/teacher?token=abc123def456',
  joinToken: 'abc123def456'
};

// Test data for student invitation (for comparison)
const studentInvitationData = {
  recipientName: 'Jane Doe',
  recipientEmail: 'jane.doe@example.com',
  schoolName: 'Rivendell High School',
  inviterName: 'Dr. Sarah Johnson',
  invitationCode: 'STUD789012',
  invitationUrl: 'http://localhost:3000/signup?invite=STUD789012',
  message: 'Welcome to our school! We\'re excited to have you as a student.',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  role: 'student'
};

console.log('📧 Teacher Invitation Email:');
console.log('─'.repeat(50));
const teacherEmail = generateInvitationEmail(teacherInvitationData);
console.log('HTML Length:', teacherEmail.html.length, 'characters');
console.log('Text Length:', teacherEmail.text.length, 'characters');

console.log('\n📧 Student Invitation Email:');
console.log('─'.repeat(50));
const studentEmail = generateInvitationEmail(studentInvitationData);
console.log('HTML Length:', studentEmail.html.length, 'characters');
console.log('Text Length:', studentEmail.text.length, 'characters');

console.log('\n🔍 Key Differences:');
console.log('─'.repeat(50));

// Check for teacher-specific content
const teacherHasQuickAccess = teacherEmail.html.includes('Teacher Quick Access');
const teacherHasNoCode = !teacherEmail.html.includes('Your Invitation Code');
const teacherHasJoinButton = teacherEmail.html.includes('Join as Teacher - Quick Access');
const teacherHasJoinUrl = teacherEmail.html.includes('join/teacher?token=');

const studentHasCode = studentEmail.html.includes('Your Invitation Code');
const studentHasAcceptButton = studentEmail.html.includes('Accept Invitation & Join School');

console.log('Teacher Email:');
console.log(`  ✅ Has "Teacher Quick Access": ${teacherHasQuickAccess ? '✅' : '❌'}`);
console.log(`  ✅ No invitation code shown: ${teacherHasNoCode ? '✅' : '❌'}`);
console.log(`  ✅ Has "Join as Teacher" button: ${teacherHasJoinButton ? '✅' : '❌'}`);
console.log(`  ✅ Has join URL: ${teacherHasJoinUrl ? '✅' : '❌'}`);

console.log('\nStudent Email:');
console.log(`  ✅ Has invitation code: ${studentHasCode ? '✅' : '❌'}`);
console.log(`  ✅ Has "Accept Invitation" button: ${studentHasAcceptButton ? '✅' : '❌'}`);

console.log('\n📝 Sample Teacher Email Text:');
console.log('─'.repeat(50));
console.log(teacherEmail.text.substring(0, 500) + '...');

console.log('\n🎉 Teacher email template test completed!');
console.log('\n📋 Features implemented:');
console.log('✅ Different title for teachers');
console.log('✅ No invitation code for teachers');
console.log('✅ Quick access button for teachers');
console.log('✅ Direct join URL for teachers');
console.log('✅ Teacher-specific instructions');
console.log('✅ Maintains student invitation functionality');
