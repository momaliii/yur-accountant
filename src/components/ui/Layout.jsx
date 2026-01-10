import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UpdateChecker from '../UpdateChecker';
import SnowEffect from '../SnowEffect';
// import NotificationChecker from '../NotificationChecker';
import { useUIStore } from '../../stores/useStore';

export default function Layout() {
  const { sidebarOpen, sidebarMinimized } = useUIStore();

  return (
    <div className="min-h-screen">
      <SnowEffect />
      <Sidebar />
      <Header />
      
      <main
        className={`transition-all duration-300 ease-in-out min-h-screen
          ${sidebarOpen 
            ? sidebarMinimized 
              ? 'lg:ml-20' 
              : 'lg:ml-64'
            : 'lg:ml-20'
          } ml-0 pt-16`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <UpdateChecker />
          <Outlet />
        </div>
      </main>
      {/* <NotificationChecker /> */}
    </div>
  );
}

