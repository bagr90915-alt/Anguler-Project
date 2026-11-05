import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="text-6xl font-black font-mono text-emerald-600 dark:text-emerald-400">404</div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        The route or group you are trying to visit does not exist.
      </p>
      <Link to="/">
        <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
