import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { Search } from "lucide-react";

const NaturalRemedies = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem("recentRemedySearches")) || []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef();
  const itemRefs = useRef([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await api.get(`/remedies/?search=${query}`);
        setSuggestions(response.data);
        itemRefs.current = [];
      } catch (error) {
        console.error("Error fetching suggestions", error);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex !== -1 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const highlightMatch = (text, match) => {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="text-blue-600 font-semibold">
          {text.substring(index, index + match.length)}
        </span>
        {text.substring(index + match.length)}
      </>
    );
  };

  const handleSelect = (remedy) => {
    setSelectedRemedy(remedy);
    setQuery(remedy.issue);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    const updated = [
      remedy.issue,
      ...recentSearches.filter((item) => item !== remedy.issue),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentRemedySearches", JSON.stringify(updated));
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentRemedySearches");
  };

  const handleKeyDown = (e) => {
    const list = query.trim() === "" ? recentSearches : suggestions;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? list.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const item = list[highlightedIndex];
      if (query.trim() === "") {
        handleSelect({ issue: item });
      } else {
        handleSelect(item);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 justify-center pt-12 px-6">
      <div className="bg-white bg-opacity-80 backdrop-blur-lg shadow-lg rounded-2xl w-full max-w-2xl p-8 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-blue-800">Natural Remedy Search</h1>
          <p className="text-gray-600 mt-1">Only for very common issues (approx remedies)</p>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Start typing issue name..."
            className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedRemedy(null);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200);
            }}
            onKeyDown={handleKeyDown}
          />
          <Search className="absolute top-3 right-3 text-gray-400" />
        </div>

        {showSuggestions && (
          <ul className="bg-white border rounded shadow mt-2 divide-y max-h-64 overflow-auto z-10 relative">
            {query.trim() === "" && isFocused && recentSearches.length > 0 && (
              <>
                <li className="text-gray-500 px-4 py-2 text-sm flex justify-between items-center">
                  <span>Recent Searches</span>
                  <button className="text-red-500 text-xs" onMouseDown={handleClearSearches}>
                    Clear All
                  </button>
                </li>
                {recentSearches.map((item, index) => (
                  <li
                    key={index}
                    ref={(el) => (itemRefs.current[index] = el)}
                    className={`p-2 cursor-pointer transition ${
                      highlightedIndex === index ? "bg-blue-100" : "hover:bg-blue-50"
                    }`}
                    onMouseDown={() => handleSelect({ issue: item })}
                  >
                    {item}
                  </li>
                ))}
              </>
            )}

            {query.trim() !== "" && suggestions.map((rem, index) => (
              <li
                key={index}
                ref={(el) => (itemRefs.current[index] = el)}
                className={`p-2 cursor-pointer transition ${
                  highlightedIndex === index ? "bg-blue-100" : "hover:bg-blue-50"
                }`}
                onMouseDown={() => handleSelect(rem)}
              >
                {highlightMatch(rem.issue, query)}
              </li>
            ))}

            {query && suggestions.length === 0 && (
              <li className="p-2 text-gray-400 text-sm">No matches found</li>
            )}
          </ul>
        )}

        {selectedRemedy && (
          <div className="bg-white mt-6 p-4 rounded-lg shadow-md border border-blue-100">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              {selectedRemedy.issue}
            </h2>
            <p>
              <span className="font-semibold">Remedy:</span>{" "}
              {selectedRemedy.remedies || "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Duration:</span>{" "}
              {selectedRemedy.duration || "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Instructions:</span>{" "}
              {selectedRemedy.usage_instruction || "Unknown"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaturalRemedies;
