import React, { useState } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";

const Insert_Form = ( {onClose}) => {
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
  });



  const API_URL = import.meta.env.VITE_API_URL;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCancel = () => {
    onClose();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/api/games`, formData);
      alert(`Game added successfully! Game ID: ${response.data.game_id}`);
      setFormData({
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
      }); //reset
    } catch (error) {
      alert("Failed to add game. Please try again.");
    }
  };

  return (
    <div className="bg-neutral p-10 rounded-2xl">
      <div className="flex justify-end mb-2 -mt-6">
      <button onClick={handleCancel}>
        <IoClose className="text-white h-5 w-5 bg-slate-500 rounded-full" />
      </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Game Name"
          value={formData.name}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
          required
        />
        <input
          type="date"
          name="release_date"
          placeholder="Release Date"
          value={formData.release_date}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price ($)"
          value={formData.price}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <textarea
          name="short_description"
          placeholder="Short Description"
          value={formData.short_description}
          onChange={handleInputChange}
          className="textarea w-full max-w-xs"
        ></textarea>
        <div className="flex gap-4">
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
        <input
          type="number"
          name="metacritic_score"
          placeholder="Metacritic Score"
          value={formData.metacritic_score}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <input
          type="number"
          name="positive"
          placeholder="Positive Reviews"
          value={formData.positive}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <input
          type="number"
          name="negative"
          placeholder="Negative Reviews"
          value={formData.negative}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <input
          type="number"
          name="recommendations"
          placeholder="Recommendations"
          value={formData.recommendations}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <input
          type="number"
          name="average_playtime_forever"
          placeholder="Average Playtime (minutes)"
          value={formData.average_playtime_forever}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <input
          type="number"
          name="peak_ccu"
          placeholder="Peak CCU"
          value={formData.peak_ccu}
          onChange={handleInputChange}
          className="input w-full max-w-xs"
        />
        <button type="submit" className="btn btn-primary">
          Add Game
        </button>
      </form>
    </div>
  );
};

export default Insert_Form;