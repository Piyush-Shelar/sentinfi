import React, { useEffect, useRef } from 'react';

function getColor(score) {
  if (score >= 71) return { stroke: '#1F8A70', text: 'text-teal-600', label: 'Excellent' };
  if (score >= 40) return { stroke: '#d4a017', text: 'text-gold-500', label: 'Fair' };
  return { stroke: '#C1440E', text: 'text-amber-600', label: 'At Risk' };
}

export default function ScoreGauge({ score, size = 160 }) {
  const circleRef = useRef(null);
  const radius = (size / 2) - 14;
  const circumference = 2 * Math.PI * radius;
  // Use 270° arc (3/4 of circle)
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength - (score / 100) * arcLength;
  const { stroke, text, label } = getColor(score);
  const strokeWidth = size > 120 ? 10 : 7;

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    circle.style.setProperty('--dash-total', arcLength);
    circle.style.setProperty('--dash-offset', dashOffset);
  }, [arcLength, dashOffset]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#E2E6F0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated score arc */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={arcLength}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '--dash-offset': dashOffset,
            }}
            ref={el => {
              if (el) {
                setTimeout(() => {
                  el.style.strokeDashoffset = dashOffset;
                }, 100);
              }
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: size * 0.05 }}
        >
          <span className={`font-bold ${text}`} style={{ fontSize: size * 0.22 }}>
            {score}
          </span>
          <span className="text-xs text-gray-400 font-medium" style={{ fontSize: size * 0.09 }}>
            / 100
          </span>
        </div>
      </div>
      <div className={`text-sm font-semibold mt-1 ${text}`}>{label}</div>
    </div>
  );
}
