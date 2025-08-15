import React from 'react'

const DrivingAnimation = ({ isVisible = true, size = "small" }) => {
  if (!isVisible) return null
  
  const sizeClasses = {
    small: "w-32 h-20",
    medium: "w-48 h-32", 
    large: "w-64 h-40"
  }
  
  const carSize = {
    small: { width: 32, height: 20 },
    medium: { width: 48, height: 32 },
    large: { width: 64, height: 40 }
  }
  
  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Background road */}
      <div className="absolute bottom-2 left-0 right-0 h-8 bg-gray-700 rounded-full overflow-hidden">
        {/* Road center line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-yellow-300 opacity-60 animate-pulse"></div>
        </div>
        
        {/* Moving dashed lines */}
        <div className="absolute inset-0 flex items-center">
          <div className="animate-move-road w-full flex justify-around items-center">
            <div className="w-8 h-0.5 bg-white opacity-80"></div>
            <div className="w-8 h-0.5 bg-white opacity-80"></div>
            <div className="w-8 h-0.5 bg-white opacity-80"></div>
            <div className="w-8 h-0.5 bg-white opacity-80"></div>
          </div>
        </div>
      </div>
      
      {/* Car */}
      <div className="absolute bottom-4 left-0 animate-drive-smooth">
        <svg 
          width={carSize[size].width} 
          height={carSize[size].height} 
          viewBox="0 0 48 32" 
          className="text-primary-600 drop-shadow-lg"
        >
          {/* Car body */}
          <rect x="8" y="12" width="32" height="12" rx="2" fill="currentColor" />
          <rect x="12" y="8" width="24" height="8" rx="3" fill="currentColor" />
          
          {/* Windows */}
          <rect x="14" y="10" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8" />
          <rect x="26" y="10" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8" />
          
          {/* Wheels with rotation */}
          <g className="animate-spin-slow">
            <circle cx="14" cy="26" r="4" fill="#2D3748" />
            <circle cx="14" cy="26" r="2" fill="#4A5568" />
            <circle cx="14" cy="26" r="1" fill="#718096" />
          </g>
          <g className="animate-spin-slow">
            <circle cx="34" cy="26" r="4" fill="#2D3748" />
            <circle cx="34" cy="26" r="2" fill="#4A5568" />
            <circle cx="34" cy="26" r="1" fill="#718096" />
          </g>
          
          {/* Headlights */}
          <circle cx="42" cy="16" r="1.5" fill="#FFF59D" className="animate-pulse" />
          <circle cx="42" cy="20" r="1.5" fill="#FFF59D" className="animate-pulse" />
          
          {/* Motion lines */}
          <g className="animate-pulse opacity-60">
            <line x1="2" y1="14" x2="6" y2="14" stroke="#CBD5E0" strokeWidth="1" />
            <line x1="1" y1="18" x2="5" y2="18" stroke="#CBD5E0" strokeWidth="1" />
            <line x1="3" y1="22" x2="7" y2="22" stroke="#CBD5E0" strokeWidth="1" />
          </g>
        </svg>
      </div>
      
      {/* Dust clouds */}
      <div className="absolute bottom-1 left-2 animate-bounce opacity-30">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
      <div className="absolute bottom-1 left-6 animate-bounce opacity-20" style={{animationDelay: '0.2s'}}>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
      </div>
      <div className="absolute bottom-1 left-10 animate-bounce opacity-25" style={{animationDelay: '0.4s'}}>
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  )
}

export default DrivingAnimation
