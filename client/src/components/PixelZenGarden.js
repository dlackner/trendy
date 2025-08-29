import React from 'react';

const PixelZenGarden = ({ className }) => {
  return (
    <svg 
      className={className}
      width="120" 
      height="120" 
      viewBox="0 0 120 120" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Background - light sand */}
      <rect width="120" height="120" fill="#f5f1e8"/>
      
      {/* Sand patterns - raked lines */}
      <g opacity="0.3">
        <rect x="10" y="20" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="28" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="36" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="44" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="52" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="90" width="100" height="2" fill="#d4c4b0"/>
        <rect x="10" y="98" width="100" height="2" fill="#d4c4b0"/>
      </g>
      
      {/* Pond - pixel art style */}
      <g>
        {/* Pond shadow */}
        <rect x="18" y="62" width="44" height="24" fill="#8b9dc3" opacity="0.3"/>
        
        {/* Main pond water */}
        <rect x="20" y="60" width="40" height="20" fill="#88a0b3"/>
        <rect x="18" y="62" width="44" height="16" fill="#88a0b3"/>
        <rect x="22" y="58" width="36" height="2" fill="#88a0b3"/>
        <rect x="22" y="80" width="36" height="2" fill="#88a0b3"/>
        
        {/* Water highlights */}
        <rect x="24" y="64" width="8" height="2" fill="#a8c0d3" opacity="0.7"/>
        <rect x="36" y="68" width="6" height="2" fill="#a8c0d3" opacity="0.7"/>
        <rect x="46" y="72" width="8" height="2" fill="#a8c0d3" opacity="0.7"/>
        
        {/* Water ripples */}
        <rect x="30" y="70" width="4" height="2" fill="#6b8099" opacity="0.5"/>
        <rect x="42" y="66" width="4" height="2" fill="#6b8099" opacity="0.5"/>
      </g>
      
      {/* Zen rocks - pixel art style */}
      <g>
        {/* Large rock */}
        <rect x="70" y="28" width="20" height="20" fill="#6b5d54"/>
        <rect x="68" y="30" width="24" height="16" fill="#6b5d54"/>
        <rect x="72" y="26" width="16" height="2" fill="#6b5d54"/>
        <rect x="72" y="48" width="16" height="2" fill="#6b5d54"/>
        
        {/* Rock highlights */}
        <rect x="72" y="30" width="6" height="2" fill="#8b7765" opacity="0.8"/>
        <rect x="74" y="34" width="4" height="2" fill="#8b7765" opacity="0.8"/>
        
        {/* Rock shadow */}
        <rect x="68" y="50" width="24" height="2" fill="#3d3028" opacity="0.3"/>
        <rect x="70" y="52" width="20" height="2" fill="#3d3028" opacity="0.2"/>
        
        {/* Medium rock */}
        <rect x="84" y="72" width="12" height="12" fill="#7a6a5d"/>
        <rect x="82" y="74" width="16" height="8" fill="#7a6a5d"/>
        <rect x="86" y="70" width="8" height="2" fill="#7a6a5d"/>
        
        {/* Medium rock highlight */}
        <rect x="86" y="74" width="4" height="2" fill="#9a8a7d" opacity="0.8"/>
        
        {/* Small rock */}
        <rect x="32" y="34" width="8" height="8" fill="#8b7765"/>
        <rect x="30" y="36" width="12" height="4" fill="#8b7765"/>
        
        {/* Small rock highlight */}
        <rect x="34" y="36" width="2" height="2" fill="#a09080" opacity="0.8"/>
      </g>
      
      {/* Tiny bamboo or plant pixels */}
      <g>
        {/* Bamboo stalks */}
        <rect x="100" y="40" width="2" height="16" fill="#7a9a65"/>
        <rect x="104" y="38" width="2" height="18" fill="#7a9a65"/>
        <rect x="108" y="42" width="2" height="14" fill="#7a9a65"/>
        
        {/* Bamboo segments */}
        <rect x="100" y="44" width="2" height="2" fill="#5a7a45"/>
        <rect x="100" y="50" width="2" height="2" fill="#5a7a45"/>
        <rect x="104" y="42" width="2" height="2" fill="#5a7a45"/>
        <rect x="104" y="48" width="2" height="2" fill="#5a7a45"/>
        <rect x="108" y="46" width="2" height="2" fill="#5a7a45"/>
        
        {/* Bamboo leaves */}
        <rect x="98" y="38" width="4" height="2" fill="#88a673"/>
        <rect x="102" y="36" width="4" height="2" fill="#88a673"/>
        <rect x="106" y="40" width="4" height="2" fill="#88a673"/>
      </g>
      
      {/* Small moss patches */}
      <g opacity="0.6">
        <rect x="24" y="42" width="4" height="2" fill="#88a673"/>
        <rect x="26" y="44" width="2" height="2" fill="#88a673"/>
        <rect x="76" y="54" width="4" height="2" fill="#88a673"/>
        <rect x="78" y="56" width="2" height="2" fill="#88a673"/>
        <rect x="90" y="86" width="4" height="2" fill="#88a673"/>
      </g>
    </svg>
  );
};

export default PixelZenGarden;