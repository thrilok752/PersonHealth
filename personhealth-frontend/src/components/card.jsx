// src/components/ui/card.jsx

export function Card({ children, className = '' }) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
        {children}
      </div>
    );
  }
  
  export function CardContent({ children, className = '' }) {
    return (
      <div className={`p-4 ${className}`}>
        {children}
      </div>
    );
  }
  