const express = require("express");
const router = express.Router();


router.get("/api/test", (req, res) => {
  res.send({ 1: "Test" });
});

// Get
router.get("/api/games", (req, res) => {
  const connection = req.app.get("dbConnection");

  // Set the isolation level for the current session
  connection.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED", (err) => {
    if (err) {
      console.error("Error setting isolation level:", err);
      return res.status(500).send("Error Fetching Data");
    }

    // Execute the SELECT query
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
});

// get single game
router.get("/api/games/:id", (req, res) => {
  const connection = req.app.get("dbConnection");
  const { id } = req.params;

// Set the isolation level for this session
  connection.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED", (err) => {
    if (err) {
    console.error("Error setting isolation level:", err);
    return res.status(500).send({ success: false, message: "Error setting isolation level" });
  }

  const query = `
    SELECT
      game_id, name, release_date, price, short_description,
      windows, mac, linux, metacritic_score, positive,
      negative, recommendations, average_playtime_forever, peak_ccu, version
    FROM steamgames.games WHERE game_id = ?;
  `;

  connection.query(query, [id], (err, rows) => {
    if (err) {
      console.error("Error Fetching Data:", err);
      return res.status(500).send("Error Fetching Data");
    }

    if (rows.length === 0) {
      return res.status(404).send("No tags found");
    }
    res.send(rows[0]); // Return the single game object directly
  });
  });
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
    version
  } = req.body;

  // Set isolation level to SERIALIZABLE for this transaction
  connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE", (err) => {
    if (err) {
      console.error("Error setting isolation level:", err);
      return res.status(500).send({ success: false, message: "Error setting isolation level" });
    }

    const query = `
      UPDATE steamgames.games 
      SET 
        name = ?,
        release_date = ?,
        price = ?,
        short_description = ?,
        windows = ?,
        mac = ?,
        linux = ?,
        metacritic_score = ?,
        positive = ?,
        negative = ?,
        recommendations = ?,
        average_playtime_forever = ?,
        peak_ccu = ?,
        version = version + 1
      WHERE game_id = ? AND version = ?;
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
      peak_ccu,
      id,
      version,
    ];

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).send("Error starting transaction");
      }

      connection.query(query, values, (err, result) => {
        if (err) {
          console.error("Error updating data:", err);
          return connection.rollback(() => {
            res.status(500).send("Error updating data");
          });
        }

        if (result.affectedRows === 0) {
          return connection.rollback(() => {
            res.status(404).send("Record is updated by another transaction");
          });
        }

        connection.commit((err) => {
          if (err) {
            console.error("Error committing transaction:", err);
            return connection.rollback(() => {
              res.status(500).send("Error committing transaction");
            });
          }

          res.send({
            message: "Game updated successfully",
            affectedRows: result.affectedRows,
          });
        });
      });
    });
  });
});

// Delete
router.delete("/api/games/:id", (req, res) => {
  const connection = req.app.get("dbConnection");
  const { id } = req.params;

  // Set the isolation level for this operation
  connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE", (err) => {
    if (err) {
      console.error("Error setting isolation level:", err);
      return res.status(500).send("Error setting isolation level");
    }

    // Begin transaction
    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).send("Error starting transaction");
      }

      const query = `DELETE FROM steamgames.games WHERE game_id = ?;`;

      connection.query(query, [id], (err, result) => {
        if (err) {
          console.error("Error deleting data:", err);
          return connection.rollback(() => {
            res.status(500).send("Error deleting data");
          });
        }

        if (result.affectedRows === 0) {
          return connection.rollback(() => {
            res.status(404).send("Game deleted already");
          });
        }

        // Commit transaction
        connection.commit((err) => {
          if (err) {
            console.error("Error committing transaction:", err);
            return connection.rollback(() => {
              res.status(500).send("Error committing transaction");
            });
          }

          res.send({
            message: "Game deleted successfully",
            affectedRows: result.affectedRows,
          });
        });
      });
    });
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

  // Input validation
  if (!name || !release_date || price === undefined || windows === undefined || mac === undefined || linux === undefined) {
    return res.status(400).send(
"Missing required fields: name, release_date, price, windows, mac, linux"
    );
  }

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
    // Set isolation level to SERIALIZABLE for unique ID generation
    await connection.promise().query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.promise().beginTransaction();

    // Generate unique game_id
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

    const [result] = await connection.promise().query(query, values);

    // Commit transaction
    await connection.promise().commit();

    res.send({
      success: true,
      message: "Game added successfully",
      game_id,
      insertedId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting data:", error);

    // Rollback transaction in case of failure
    await connection.promise().rollback();

    res.status(500).send("Error inserting data");
  }
});

module.exports = router;
