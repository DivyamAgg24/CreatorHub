import React from 'react';
import {Topbar} from './Topbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white  flex flex-col transition-colors duration-200">
      <Topbar />
      <main className="flex-grow">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} CreatorHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;