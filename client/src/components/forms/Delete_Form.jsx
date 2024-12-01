import React, { useState } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";

const Delete_Form = ({ game_id, game_name, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false); // Add loading state
  const API_URL = import.meta.env.VITE_API_URL;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/games/${game_id}`);
      alert(`Game "${game_name}" has been deleted successfully.`);
      onSuccess(); // Notify parent component of successful deletion
    } catch (error) {
      console.error("Error deleting game:", error);
      alert(error.response.data);
    } finally {
      setLoading(false);
      onClose(); // Close the form
      refreshPage();
    }
  };
  const refreshPage = () => { 
    window.location.reload(); 
  }
  return (
    <div className="bg-neutral p-10 rounded-2xl text-white">
      <div className="flex justify-end mb-2 -mt-6">
        <button onClick={onClose}>
          <IoClose className="text-white h-5 w-5 bg-slate-500 rounded-full" />
        </button>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">
          Are you sure you want to delete "{game_name}"?
        </h2>
        <p className="mb-6">This action cannot be undone.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleDelete}
            className="btn btn-error"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Delete_Form;
