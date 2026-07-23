const PHANTOM_LOGO_URL = 'https://phantom.app/img/phantom-icon-purple.png';

export default function PhantomLogo({ size = 30, showStatus = false, connected = false, className = '' }) {
  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <img
        src={PHANTOM_LOGO_URL}
        alt="Phantom"
        className="w-full h-full rounded-full object-cover"
      />
      {showStatus && connected && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full ring-2 ring-background"
          style={{ width: size * 0.4, height: size * 0.4 }}
        />
      )}
    </div>
  );
}