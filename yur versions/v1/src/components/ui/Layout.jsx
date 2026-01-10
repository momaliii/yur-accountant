import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
// import NotificationChecker from '../NotificationChecker';
import { useUIStore } from '../../stores/useStore';

export default function Layout() {
  const { sidebarOpen, sidebarMinimized } = useUIStore();

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <main
        className={`transition-all duration-300 ease-in-out min-h-screen
          ${sidebarOpen 
            ? sidebarMinimized 
              ? 'lg:ml-20' 
              : 'lg:ml-64'
            : 'lg:ml-20'
          } ml-0`}
      >
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </main>
      {/* <NotificationChecker /> */}
    </div>
  );
}

