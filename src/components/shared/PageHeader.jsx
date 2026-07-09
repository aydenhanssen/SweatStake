import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';

export default function PageHeader({ title, showBack = true, backTo = '/', children }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-6">
      {showBack && (
        <button
          onClick={() => navigate(backTo)}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {title && (
        <h1 className="text-xl font-black font-heading text-gradient-gold truncate">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all"
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/challenges')}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all"
          title="Challenges"
        >
          <Trophy className="w-4 h-4 text-primary" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all"
          title="Profile"
        >
          <User className="w-4 h-4" />
        </button>
        <PhantomWalletButton />
        {children}
      </div>
    </div>
  );
}