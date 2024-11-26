const express = require("express");
const router = express.Router();

// Middleware to select the appropriate database connection
// const selectDatabaseConnection = async (req, res, next) => {
//     const dbKey = req.query.db || "db1"; // Default to "db1"
//     const dbConnections = req.app.get("dbConnections");
  
//     const keys = ["db1", "db2", "db3"];
//     const selectedKeys = dbKey ? [dbKey, ...keys.filter((key) => key !== dbKey)] : keys; // Prioritize the requested key
  
//     for (const key of selectedKeys) {
//       try {
//         // Test the connection by running a simple query
//         await dbConnections[key].promise().query("SELECT 1");
//         req.dbConnection = dbConnections[key].promise(); // Use the first working connection
//         return next();
//       } catch (err) {
//         console.error(`Database ${key} is not available:`, err.message);
//       }
//     }
  
//     return res.status(500).send({ error: "All databases are unavailable" });
//   };
//   // Use the middleware for all routes that require a database connection
//   router.use(selectDatabaseConnection);
  
//   // Example route: Fetch games
//   router.get("/api/games", async (req, res) => {
//     try {
//       const [rows] = await req.dbConnection.query(
//         `SELECT 
//           game_id,
//           name,
//           release_date,
//           price,
//           short_description,
//           windows,
//           mac,
//           linux,
//           metacritic_score,
//           positive,
//           negative,
//           recommendations,
//           average_playtime_forever,
//           peak_ccu
//         FROM games LIMIT 10;`
//       );
//       res.send(rows);
//     } catch (err) {
//       console.error("Error fetching games:", err);
//       res.status(500).send("Error fetching games");
//     }
// });


router.get("/api/test", (req, res) => {
  res.send({ 1: "Test" });
});

// Get
router.get("/api/games", (req, res) => {
  const connection = req.app.get("dbConnection");
  connection.query(
    `SELECT 
      game_id,
      name,
      release_date,
      price,
      short_description,
      windows,
      mac,
      linux,
      metacritic_score,
      positive,
      negative,
      recommendations,
      average_playtime_forever,
      peak_ccu
    FROM steamgames.games;`,
    (err, rows) => {
      if (err) {
        console.error("Error Fetching Data:", err);
        return res.status(500).send("Error Fetching Data");
      }

      if (rows.length === 0) {
        return res.status(404).send("No tags found");
      }

      res.send(rows);
    }
  );
});

router.get("/api/games/:id", (req, res) => {
  const connection = req.app.get("dbConnection");
  const { id } = req.params;
  connection.query(
    `SELECT
      name,
      release_date,
      price,
      short_description,
      windows,
      mac,
      linux,
      metacritic_score,
      positive,
      negative,
      recommendations,
      average_playtime_forever,
      peak_ccu
    FROM steamgames.games WHERE game_id = ${id};`,
    (err, rows) => {
      if (err) {
        console.error("Error Fetching Data:", err);
        return res.status(500).send("Error Fetching Data");
      }

      if (rows.length === 0) {
        return res.status(404).send("No tags found");
      }

      res.send(rows);
    }
  );
});

// Update
router.put("/api/games/:id", (req, res) => {
  const connection = req.app.get("dbConnection");
  const { id } = req.params;
  const {
    name,
    release_date,
    price,
    short_description,
    windows,
    mac,
    linux,
    metacritic_score,
    positive,
    negative,
    recommendations,
    average_playtime_forever,
    peak_ccu,
  } = req.body;

  const query = `
    UPDATE steamgames.games 
    SET 
      name = ?,
      release_date  = ?,
      price  = ?,
      short_description  = ?,
      windows  = ?,
      mac  = ?,
      linux  = ?,
      metacritic_score  = ?,
      positive = ?,
      negative = ?,
      recommendations = ?,
      average_playtime_forever = ?,
      peak_ccu = ?
    WHERE game_id = ?;
  `;

  const values = [
    name,
    release_date,
    price,
    short_description,
    windows,
    mac,
    linux,
    metacritic_score,
    positive,
    negative,
    recommendations,
    average_playtime_forever,
    peak_ccu,id];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating data:", err);
      return res.status(500).send("Error updating data");
    }

    res.send({ success: true, message: "Game updated successfully", affectedRows: result.affectedRows });
  });
});

// Delete
router.delete("/api/games/:id", (req, res) => {
  const connection = req.app.get("dbConnection");
  const { id } = req.params;

  const query = `DELETE FROM steamgames.games WHERE game_id = ?;`;

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting data:", err);
      return res.status(500).send("Error deleting data");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ success: false, message: "Game not found" });
    }

    res.send({ success: true, message: "Game deleted successfully", affectedRows: result.affectedRows });
  });
});

// Insert
router.post("/api/games", async (req, res) => {
  const connection = req.app.get("dbConnection");
  const {
    name,
    release_date,
    price,
    short_description,
    windows,
    mac,
    linux,
    metacritic_score,
    positive,
    negative,
    recommendations,
    average_playtime_forever,
    peak_ccu,
  } = req.body;

  const generateGameId = () => Math.floor(100000 + Math.random() * 900000);

  const getUniqueGameId = async () => {
    let isUnique = false;
    let gameId;

    while (!isUnique) {
      gameId = generateGameId();
      const [rows] = await connection.promise().query(
        "SELECT COUNT(*) AS count FROM steamgames.games WHERE game_id = ?",
        [gameId]
      );
      if (rows[0].count === 0) {
        isUnique = true;
      }
    }

    return gameId;
  };

  try {
    const game_id = await getUniqueGameId();

    const query = `
      INSERT INTO steamgames.games 
      (game_id, name, release_date, price, short_description, windows, mac, linux, metacritic_score, positive, negative, recommendations, average_playtime_forever, peak_ccu) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      game_id,
      name,
      release_date,
      price,
      short_description,
      windows,
      mac,
      linux,
      metacritic_score,
      positive,
      negative,
      recommendations,
      average_playtime_forever,
      peak_ccu,
    ];

    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        return res.status(500).send({ success: false, message: "Error inserting data" });
      }

      res.send({ success: true, message: "Game added successfully", game_id, insertedId: result.insertId });
    });
  } catch (error) {
    console.error("Error generating game_id:", error);
    res.status(500).send({ success: false, message: "Error generating game_id" });
  }
});

module.exports = router;
