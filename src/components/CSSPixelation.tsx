// components/CssPixelation.jsx
'use client'

import { useState } from 'react'

export default function CssPixelation({ children, initialEnabled = false, initialPixelSize = 2, showControls = true }: { children: React.ReactNode, initialEnabled?: boolean, initialPixelSize?: number, showControls?: boolean }) {
  const [pixelSize, setPixelSize] = useState(initialPixelSize)
  const [enabled, setEnabled] = useState(initialEnabled)
  
  // Create the filter value based on pixel size
  const getFilterValue = (pxSize: number) => {
    return `url("data:image/svg+xml,%3Csvg viewBox='0 0 ${pxSize} ${pxSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='pixelate'%3E%3CfeFlood x='0' y='0' width='1' height='1'/%3E%3CfeComposite width='${pxSize}' height='${pxSize}'/%3E%3CfeTile result='a'/%3E%3CfeComposite in='SourceGraphic' in2='a' operator='in'/%3E%3CfeMorphology operator='dilate' radius='${pxSize * 0.5}'/%3E%3C/filter%3E%3C/svg%3E#pixelate")`
  }

  return (
    <>
      <div className="w-full h-full" style={{
        filter: enabled ? getFilterValue(pixelSize) : 'none'
      }}>
        {children}
      </div>
      
      {showControls && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button 
            onClick={() => setEnabled(!enabled)}
            style={{
              padding: '5px 10px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {enabled ? 'Disable' : 'Enable'} Pixelation
          </button>
          
          <label>
            Pixel Size: {pixelSize}px
            <input
              type="range"
              min="2"
              max="20"
              value={pixelSize}
              onChange={(e) => setPixelSize(parseInt(e.target.value))}
              style={{ width: '100px', marginLeft: '10px' }}
            />
          </label>
        </div>
      )}
    </>
  )
}