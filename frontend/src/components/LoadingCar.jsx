import React from 'react'

const LoadingCar = ({ message = "Đang tải..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Car Animation */}
      <div className="relative w-full max-w-xs">
        {/* Road */}
        <div className="relative h-12 bg-gray-700 rounded-full overflow-hidden">
          {/* Road markings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1 bg-white opacity-60 animate-pulse"></div>
          </div>
          
          {/* Moving road lines */}
          <div className="absolute inset-0 flex items-center">
            <div className="animate-move-road w-full h-0.5 bg-yellow-300 opacity-80"></div>
          </div>
        </div>
        
        {/* Car */}
        <div className="absolute -top-6 left-0 animate-drive-car">
          <svg 
            width="48" 
            height="32" 
            viewBox="0 0 48 32" 
            className="text-primary-600 drop-shadow-lg"
          >
            {/* Car body */}
            <rect x="8" y="12" width="32" height="12" rx="2" fill="currentColor" />
            <rect x="12" y="8" width="24" height="8" rx="3" fill="currentColor" />
            
            {/* Windows */}
            <rect x="14" y="10" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8" />
            <rect x="26" y="10" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8" />
            
            {/* Wheels */}
            <circle cx="14" cy="26" r="4" fill="#2D3748" />
            <circle cx="34" cy="26" r="4" fill="#2D3748" />
            <circle cx="14" cy="26" r="2" fill="#4A5568" />
            <circle cx="34" cy="26" r="2" fill="#4A5568" />
            
            {/* Headlights */}
            <circle cx="42" cy="16" r="1.5" fill="#FFF59D" opacity="0.9" />
            <circle cx="42" cy="20" r="1.5" fill="#FFF59D" opacity="0.9" />
            
            {/* Motion lines */}
            <g className="animate-pulse">
              <line x1="2" y1="14" x2="6" y2="14" stroke="#CBD5E0" strokeWidth="1" opacity="0.6" />
              <line x1="1" y1="18" x2="5" y2="18" stroke="#CBD5E0" strokeWidth="1" opacity="0.4" />
              <line x1="3" y1="22" x2="7" y2="22" stroke="#CBD5E0" strokeWidth="1" opacity="0.6" />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Loading text with typing effect */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 animate-typing">
          {message}
        </h3>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="w-full max-w-xs">
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingCar
