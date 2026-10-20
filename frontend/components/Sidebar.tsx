'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, UserPlus, 
  CalendarCheck, User, ScanFace, Video, FileText, Users 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const studentMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
    { icon: UserPlus, label: 'Register Face', href: '/student/register' },
    { icon: CalendarCheck, label: 'Attendance', href: '/student/attendance' },
    { icon: User, label: 'Profile', href: '/student/profile' },
    { icon: ScanFace, label: 'Demo', href: '/student/demo' }
  ];

  const teacherMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/teacher/dashboard' },
    { icon: Video, label: 'Live Session', href: '/teacher/session' },
    { icon: FileText, label: 'Records', href: '/teacher/records' },
    { icon: Users, label: 'Students', href: '/teacher/students' }
  ];

  const menuItems = user.role === 'teacher' ? teacherMenu : studentMenu;
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="h-[calc(100vh-4rem)] glass border-r border-slate-700/50 bg-navy-950 flex flex-col z-40 hidden md:flex"
    >
      <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={22} className="flex-shrink-0" />
                <motion.span 
                  animate={{ opacity: collapsed ? 0 : 1, display: collapsed ? 'none' : 'block' }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {(user.username || user.studentName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">{user.username || user.studentName || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize">{user.userType}</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </motion.aside>
  );
}
