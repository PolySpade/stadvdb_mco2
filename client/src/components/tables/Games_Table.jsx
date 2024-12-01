import React, { useState, useEffect} from "react";
import axios from "axios";
import { IoRefreshCircle, IoSearch } from "react-icons/io5";
import Update_Form from "../forms/Update_Form";
import Delete_Form from "../forms/Delete_Form";

const Games_Table = () => {
  const [games, setGames] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage] = useState(10);
  const [updateForm, setUpdateForm] = useState({ isOpen: false, gameId: null });
  const [deleteForm, setDeleteForm] = useState({ isOpen: false, gameId: null, gameName: ""});

  const API_URL = import.meta.env.VITE_API_URL;

  const getGames = () => {
    axios
      .get(`${API_URL}/api/games/`)
      .then((response) => setGames(response.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getGames();
  }, []);

  const refresh_table = () => {
    setCurrentPage(1);
    setSearchTerm("");
    getGames();
  };

  const filteredData = games.filter((item) =>
    item["name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    item["game_id"].toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastGame = currentPage * rowsPerPage;
  const indexOfFirstGame = indexOfLastGame - rowsPerPage;
  const currentGames = filteredData.slice(indexOfFirstGame, indexOfLastGame);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePageInputChange = (event) => {
    const inputPage = Number(event.target.value);
    handlePageChange(inputPage);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="relative">
      {/* Search and Refresh Controls */}
      <div className="flex flex-row justify-between">
        <div className="flex items-center mb-2">
          <IoSearch size={20} className="text-white mr-3" />
          <input
            type="text"
            placeholder="Search Games"
            value={searchTerm}
            onChange={handleSearchChange}
            className="input input-bordered text-white bg-neutral w-full max-w-lg"
          />
        </div>
        <button onClick={refresh_table}>
          <IoRefreshCircle className="text-4xl" />
        </button>
      </div>

      {/* Games Table */}
      <div className="overflow-x-auto mx-4">
        <table className="table bg-gray-800">
          <thead>
            <tr className="font-bold text-primary">
              <th>#</th>
              <th>Game ID</th>
              <th>Name</th>
              <th>Short Description</th>
              <th>Release Date</th>
              <th>Price ($)</th>
              <th>Metacritic Score</th>
              <th>Positive Reviews</th>
              <th>Negative Reviews</th>
              <th>Recommendations</th>
              <th>Average Playtime (hours)</th>
              <th>Peak CCU</th>
              <th>Platforms</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="text-white">
            {currentGames.map((game, index) => (
              <tr key={game.game_id}>
                <td>{indexOfFirstGame + index + 1}</td>
                <td>{game.game_id}</td>
                <td>{game.name}</td>
                <td className="max-w-24 text-xs text-nowrap truncate hover:text-clip hover:text-wrap">{game.short_description}</td>
                <td>{new Date(game.release_date).toLocaleDateString()}</td>
                <td>{game.price}</td>
                <td>{game.metacritic_score}</td>
                <td>{game.positive}</td>
                <td>{game.negative}</td>
                <td>{game.recommendations}</td>
                <td>{(game.average_playtime_forever / 60).toFixed(1)}</td>
                <td>{game.peak_ccu}</td>
                <td className="flex flex-row">
                  {game.windows ? <div className="bg-sky-400 rounded-md p-1">Windows</div> : ""}
                  {game.mac ? <div className="bg-stone-600 rounded-md p-1">Mac</div> : ""}
                  {game.linux ? <div className="bg-orange-400 rounded-md p-1">Linux</div> : ""}

                </td>
                <td>
                  <button
                    onClick={() =>
                      setUpdateForm({ isOpen: true, gameId: game.game_id })
                    }
                    className="rounded-md p-2 bg-yellow-600 text-white"
                  >
                    Update
                  </button>
                </td>
                <td>
                <button
                    onClick={() =>
                      setDeleteForm({
                        isOpen: true,
                        gameId: game.game_id,
                        gameName: game.name,
                      })
                    }
                    className="rounded-md p-2 bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 items-center">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-primary"
        >
          Previous
        </button>
        <div className="mx-4 text-sm">
          Page
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={handlePageInputChange}
            className="input input-bordered mx-1 w-16 text-center"
          />
          of {totalPages}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-primary"
        >
          Next
        </button>
      </div>

      {/* Absolute Positioned Update Form */}
      {updateForm.isOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative">
            <Update_Form
              game_id={updateForm.gameId}
              onClose={() => setUpdateForm({ isOpen: false, gameId: null })}
              onSuccess={refresh_table}
            />
          </div>
        </div>
      )}

      {deleteForm.isOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative">
            <Delete_Form
              game_id={deleteForm.gameId}
              game_name={deleteForm.gameName}
              onClose={() => setDeleteForm({ isOpen: false, gameId: null })}
              onSuccess={refresh_table}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Games_Table;
