/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard with navigation between sections.
 */

'use client';

import React, { useState } from 'react';
import Overview from '../../components/admin/Overview';
import TrainerManagement from '../../components/admin/TrainerManagement';
import ReviewModeration from '../../components/admin/ReviewModeration';
import FeaturedPlacement from '../../components/admin/FeaturedPlacement';
import Analytics from '../../components/admin/Analytics';
import EmergencyLogs from '../../components/admin/EmergencyLogs';
import PaymentAudit from '../../components/admin/PaymentAudit';
import SystemHealth from '../../components/admin/SystemHealth';
import TaskManagement from '../../components/admin/TaskManagement';

type AdminSection = 'overview' | 'trainers' | 'reviews' | 'featured' | 'analytics' | 'emergency' | 'payments' | 'health' | 'tasks';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const sections = [
    { id: 'overview' as AdminSection, label: 'Overview', icon: '📊' },
    { id: 'trainers' as AdminSection, label: 'Trainer Management', icon: '👥' },
    { id: 'reviews' as AdminSection, label: 'Review Moderation', icon: '⭐' },
    { id: 'featured' as AdminSection, label: 'Featured Placement', icon: '🌟' },
    { id: 'analytics' as AdminSection, label: 'Analytics', icon: '📈' },
    { id: 'emergency' as AdminSection, label: 'Emergency Logs', icon: '🚨' },
    { id: 'payments' as AdminSection, label: 'Payment Audit', icon: '💰' },
    { id: 'health' as AdminSection, label: 'System Health', icon: '💻' },
    { id: 'tasks' as AdminSection, label: 'Task Management', icon: '✅' },
  ];

  function renderSection() {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'trainers':
        return <TrainerManagement />;
      case 'reviews':
        return <ReviewModeration />;
      case 'featured':
        return <FeaturedPlacement />;
      case 'analytics':
        return <Analytics />;
      case 'emergency':
        return <EmergencyLogs />;
      case 'payments':
        return <PaymentAudit />;
      case 'health':
        return <SystemHealth />;
      case 'tasks':
        return <TaskManagement />;
      default:
        return <Overview />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="text-sm text-gray-500">
              Dog Trainers Directory
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white shadow rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{section.icon}</span>
                      <span className="font-medium">{section.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white shadow rounded-lg p-6">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
