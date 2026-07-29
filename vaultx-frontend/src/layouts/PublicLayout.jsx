import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

/**
 * Layout wrapper for public-facing pages (landing, auth).
 * Includes the public Navbar at the top.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
