import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/**
 * Mobile-only navigation (visible below the md breakpoint, ≤768px).
 * Renders a fixed top bar with a hamburger that opens an off-canvas drawer
 * mirroring the desktop sidebar. The desktop sidebar stays in each page and is
 * simply hidden on mobile (hidden md:flex). Purely presentational — navigation
 * and logout are passed in as props, so no page logic changes.
 */
const MobileNav = ({ items = [], user, onLogout, headerIcon, headerTitle = 'Menu' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4 border-b border-white/10 bg-[#0A0F1E]/90 backdrop-blur-xl">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shrink-0">
            {headerIcon}
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
            {headerTitle}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Off-canvas drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[82%] border-r border-white/10 bg-[#0F1428] flex flex-col z-50"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shrink-0">
                    {headerIcon}
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                    {headerTitle}
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => go(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 min-h-[44px] ${
                      item.active
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px]"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
