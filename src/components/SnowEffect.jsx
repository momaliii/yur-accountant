import { useEffect, useState } from 'react';

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState([]);
  const [stars, setStars] = useState([]);
  const [isDecember, setIsDecember] = useState(false);

  useEffect(() => {
    // Check if it's December or first 5 days of January
    const now = new Date();
    const month = now.getMonth(); // 0-11, where 11 is December, 0 is January
    const day = now.getDate(); // 1-31
    
    const shouldShow = month === 11 || (month === 0 && day <= 5);
    setIsDecember(shouldShow);

    if (shouldShow) {
      // Create snowflakes with more variety
      const flakes = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 25, // 8-33 seconds (more variety)
        animationDelay: Math.random() * 5,
        size: 3 + Math.random() * 8, // 3-11px (bigger variety)
        opacity: 0.4 + Math.random() * 0.6, // 0.4-1.0
        drift: (Math.random() - 0.5) * 30, // Horizontal drift (-15px to +15px)
        shape: Math.random() > 0.7 ? 'star' : 'circle', // 30% chance of star shape
        sparkle: Math.random() > 0.8, // 20% chance of sparkle effect
      }));
      setSnowflakes(flakes);

      // Create twinkling stars
      const starArray = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 30, // Only in top 30% of screen
        size: 1 + Math.random() * 2, // 1-3px
        opacity: 0.3 + Math.random() * 0.7,
        twinkleDelay: Math.random() * 3,
        twinkleDuration: 2 + Math.random() * 3, // 2-5 seconds
      }));
      setStars(starArray);
    }
  }, []);

  if (!isDecember) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Winter sky gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-transparent" />
      
      {/* Twinkling stars */}
      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white star-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.twinkleDuration}s ease-in-out infinite`,
            animationDelay: `${star.twinkleDelay}s`,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))}
      
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={`absolute top-0 bg-white ${
            flake.shape === 'star' ? 'snowflake-star' : 'rounded-full'
          } ${flake.sparkle ? 'snowflake-sparkle' : ''}`}
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
            boxShadow: flake.sparkle 
              ? '0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.5)' 
              : '0 0 6px rgba(255, 255, 255, 0.8)',
            '--drift': `${flake.drift}px`,
            '--duration': `${flake.animationDuration}s`,
          }}
        />
      ))}
      
      {/* Snow accumulation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/10 via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
