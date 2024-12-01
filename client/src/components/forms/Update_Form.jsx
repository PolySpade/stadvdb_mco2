import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";

const Update_Form = ({ game_id, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    release_date: "",
    price: "",
    short_description: "",
    windows: false,
    mac: false,
    linux: false,
    metacritic_score: "",
    positive: "",
    negative: "",
    recommendations: "",
    average_playtime_forever: "",
    peak_ccu: "",
    version: 0
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch the game data for the given game_id
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/games/${game_id}`);
        const gameData = response.data;
        setFormData({
          name: gameData.name || "",
          release_date:
            new Date(gameData.release_date).toISOString().split("T")[0] ||
            "",
          price: gameData.price || "",
          short_description: gameData.short_description || "",
          windows: gameData.windows || false,
          mac: gameData.mac || false,
          linux: gameData.linux || false,
          metacritic_score: gameData.metacritic_score || "",
          positive: gameData.positive || "",
          negative: gameData.negative || "",
          recommendations: gameData.recommendations || "",
          average_playtime_forever: gameData.average_playtime_forever || "",
          peak_ccu: gameData.peak_ccu || "",
          version: gameData.version || 0,
        });
      } catch (error) {
        console.error("Error fetching game data:", error);
        alert("Failed to load game data.");
      }
    };

    fetchGameData();
  }, [game_id, API_URL]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle cancel action
  const handleCancel = () => {
    onClose();
  };

  const refreshPage = () => { 
    window.location.reload(); 
  }
  // Handle form submission for updating the game
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API_URL}/api/games/${game_id}`, formData);
      alert("Game updated successfully!");
      onSuccess();
      onClose(); // Close the form after successful update
    } catch (error) {
      console.error("Error updating game:", error);
      alert(error.response.data);
      refreshPage();  
    }
  };

  return (
    <div className="bg-neutral p-10 rounded-2xl">
      <div>Game ID: {game_id}</div>
      <div className="flex justify-end mb-2 -mt-6">
        <button onClick={handleCancel}>
          <IoClose className="text-white h-5 w-5 bg-slate-500 rounded-full" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex flex-row mb-6">
        <div className="mr-4">
        <div className="text-bold text-primary text-xs mb-1">Game Name</div>
        <input
          type="text"
          name="name"
          placeholder="Game Name"
          value={formData.name}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
          required
        />
        <div className="text-bold text-primary text-xs mb-1">Date</div>
        <input
          type="date"
          name="release_date"
          placeholder="Release Date"
          value={formData.release_date}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
          required
        />
        <div className="text-bold text-primary text-xs mb-1">Price</div>

        <input
          type="number"
          name="price"
          placeholder="Price ($)"
          value={formData.price}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">
          Short Description
        </div>

        <textarea
          name="short_description"
          placeholder="Short Description"
          value={formData.short_description}
          onChange={handleInputChange}
          className="textarea w-full max-w-xs h-32 resize-none"
        ></textarea>
        <div className="text-bold text-primary text-xs mb-1">Compatibility</div>

        <div className="flex gap-4 mb-2">
          <label className="flex">
            <input
              type="checkbox"
              name="windows"
              checked={formData.windows}
              onChange={handleInputChange}
              className="checkbox"
            />
            Windows
          </label>
          <label className="flex">
            <input
              type="checkbox"
              name="mac"
              checked={formData.mac}
              onChange={handleInputChange}
              className="checkbox"
            />
            Mac
          </label>
          <label className="flex">
            <input
              type="checkbox"
              name="linux"
              checked={formData.linux}
              onChange={handleInputChange}
              className="checkbox"
            />
            Linux
          </label>
        </div>
</div>
        <div>
        <div className="text-bold text-primary text-xs mb-1">
          Metacritic Score
        </div>
        <input
          type="number"
          name="metacritic_score"
          placeholder="Metacritic Score"
          value={formData.metacritic_score}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">
          Positive Reviews
        </div>

        <input
          type="number"
          name="positive"
          placeholder="Positive Reviews"
          value={formData.positive}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">
          Negative Reviews
        </div>

        <input
          type="number"
          name="negative"
          placeholder="Negative Reviews"
          value={formData.negative}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">
          # of Recommendations
        </div>

        <input
          type="number"
          name="recommendations"
          placeholder="Recommendations"
          value={formData.recommendations}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">
          Average Playtime Forever (Minutes)
        </div>

        <input
          type="number"
          name="average_playtime_forever"
          placeholder="Average Playtime (minutes)"
          value={formData.average_playtime_forever}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <div className="text-bold text-primary text-xs mb-1">Peak CCU</div>

        <input
          type="number"
          name="peak_ccu"
          placeholder="Peak CCU"
          value={formData.peak_ccu}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        
        </div>

        </div>
        <button type="submit" className="btn btn-primary">
          Update Game
        </button>
      </form>
    </div>
  );
};

export default Update_Form;
