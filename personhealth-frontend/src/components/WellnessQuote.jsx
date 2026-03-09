import { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/card';
import { RefreshCcw } from 'lucide-react';
import api from "../utils/api";

const WellnessQuote = () => {
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const cardStyle = "w-full h-full rounded-2xl shadow-md bg-gradient-to-br from-green-50 to-blue-100";


  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/wellness-quote/");
      setQuote(response.data);
    } catch (error) {
      console.error("Error fetching wellness quote", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={cardStyle}>
  <CardContent className="p-6 sm:p-8 h-full flex flex-col justify-between space-y-4">
    {/* Title & refresh button */}
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">Wellness Quote</h2>
      <button
        onClick={fetchQuote}
        disabled={isLoading}
        className="text-gray-500 hover:text-gray-700 transition"
        title="Refresh Quote"
      >
        <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>

    {/* Quote content */}
    <div className="flex-grow flex items-center justify-center text-center">
      {isLoading ? (
        <p className="text-gray-500 italic">Fetching inspiration...</p>
      ) : (
        <blockquote className="text-2xl sm:text-3xl text-gray-700 font-semibold italic relative px-4 border-l-4 border-blue-400 max-w-3xl mx-auto leading-relaxed">
          “{quote?.quote}”
          <footer className="mt-4 text-right text-base font-medium text-gray-600">
            — {quote?.author}
          </footer>
        </blockquote>
      )}
    </div>
  </CardContent>
</Card>

  );
};

export default WellnessQuote;
