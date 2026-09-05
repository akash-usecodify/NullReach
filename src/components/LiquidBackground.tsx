import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#0A0A0B]">
      {/* Deep atmospheric radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(147,51,234,0.12),rgba(10,10,11,1))]" />

      {/* Atmospheric purple glow (top right) matching Artistic Flair design */}
      <div 
        className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] animate-float-slow pointer-events-none"
      />

      {/* Atmospheric royal blue glow (bottom left) matching Artistic Flair design */}
      <div 
        className="absolute bottom-[-80px] left-[5%] w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[100px] animate-float-reverse pointer-events-none"
      />

      {/* Delicate indigo/violet center accent */}
      <div 
        className="absolute top-1/2 left-1/3 w-[350px] h-[350px] rounded-full bg-indigo-500/[0.07] blur-[110px] animate-liquid-pulse pointer-events-none"
      />

      {/* Subtle architectural dot grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '36px 36px'
        }}
      />
    </div>
  );
};
