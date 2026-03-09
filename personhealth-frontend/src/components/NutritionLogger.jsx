import { useEffect, useState } from 'react';
import api from '../utils/api';

function NutritionLogger() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [summary, setSummary] = useState(null);
  const [foodLogs, setFoodLogs] = useState([]);
  const [message, setMessage] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchFoods = () => {
    api.get('/nutrition/foods/', { headers: getAuthHeader() })
      .then(res => setFoods(res.data))
      .catch(err => console.error(err));
  };

  const fetchSummary = () => {
    api.get('/nutrition/today-summary/', { headers: getAuthHeader() })
      .then(res => {
        setSummary(res.data.summary);
        setFoodLogs(res.data.food_logs);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchFoods();
    fetchSummary();
  }, []);

  const handleAddFood = () => {
    if (!search.trim()) return;

    const matched = foods.find(f => f.food.toLowerCase() === search.toLowerCase());
    if (matched && !selectedFoods.some(f => f.name === matched.name)) {
      setSelectedFoods([...selectedFoods, { ...matched, portions: 1 }]);
    }
    setSearch('');
  };

  const updatePortion = (index, value) => {
    const updated = [...selectedFoods];
    updated[index].portions = parseInt(value) || 1;
    setSelectedFoods(updated);
  };

  const removeFood = (index) => {
    const updated = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFoods.length) return;

    try {
      await api.post('/nutrition/log/', {
        foods: selectedFoods.map(item => ({ food: item.name, portions: item.portions }))
      }, { headers: getAuthHeader() });

      setMessage('Meal logged successfully!');
      setSelectedFoods([]);
      fetchSummary();
    } catch (err) {
      setMessage('Error logging nutrition.');
      console.error(err);
    }
  };

  const suggestions = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedFoods.some(sf => sf.food === f.name)
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 w-full max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Log Your Meal</h1>

        <div className="space-y-4">
          <div className="relative">
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type and select food item"
              onKeyDown={e => e.key === 'Enter' && handleAddFood()}
            />
            {search && suggestions.length > 0 && (
              <div className="absolute z-10 w-full border border-gray-300 rounded-xl bg-white shadow mt-2 max-h-40 overflow-y-auto">
                {suggestions.map(food => (
                  <div
                    key={food.id}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer transition"
                    onClick={() => {
                      setSelectedFoods([...selectedFoods, { ...food, portions: 1 }]);
                      setSearch('');
                    }}
                  >
                    {food.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedFoods.length > 0 && (
            <div className="space-y-3">
              {selectedFoods.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <input
                    type="number"
                    value={item.portions}
                    min="1"
                    onChange={e => updatePortion(index, e.target.value)}
                    className="w-20 border rounded-lg px-2 py-1 text-sm text-gray-700"
                  />
                  <button
                    onClick={() => removeFood(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={selectedFoods.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition w-full sm:w-auto"
          >
            Log Meal
          </button>

          {message && <p className="mt-2 text-green-600 font-medium">{message}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Nutrition Summary</h2>
        {summary ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="space-y-1 text-gray-700">
              <p><strong>Calories:</strong> {summary.calories.toFixed(2)} kcal</p>
              <p><strong>Protein:</strong> {summary.protein.toFixed(2)} g</p>
              <p><strong>Carbs:</strong> {summary.carbs.toFixed(2)} g</p>
              <p><strong>Fats:</strong> {summary.fats.toFixed(2)} g</p>
            </div>

            {foodLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Logged Foods</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {foodLogs.map((log, index) => (
                    <li key={index}>
                      {log.food} – {log.portions} portion{log.portions > 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Loading summary...</p>
        )}
      </div>
    </div>
  );
}

export default NutritionLogger;
