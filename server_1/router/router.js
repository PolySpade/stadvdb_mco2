const express = require("express");
const router = express.Router();

// Test
router.get("/api/test", (req, res) => {
    res.send({ 1: "Test" });
});

// Test
router.get('/api/test-master', async (req, res) => {
  try {
    const DbConnections = req.app.get("dbConnection");
    const [results] = await DbConnections.slaveDb.query('SELECT * FROM steamgames.windowsgames');
    res.send(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get
router.get("/api/games", async (req, res) => {
  try {
    const DbConnections = req.app.get("dbConnection");

    let rows;

    try {
      // Set the isolation level for the current session in slaveDb
      await DbConnections.slaveDb.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      // Execute the SELECT query in slaveDb
      [rows] = await DbConnections.slaveDb.query(
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
        FROM steamgames.windowsgames;`
      );
    } catch (slaveErr) {
      console.warn("Slave database unavailable, falling back to masterDb:", slaveErr);

      // Set the isolation level for the current session in masterDb
      await DbConnections.masterDb.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      // Execute the SELECT query in masterDb
      [rows] = await DbConnections.masterDb.query(
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
        FROM steamgames.games;`
      );
    }

    if (!rows || rows.length === 0) {
      return res.status(404).send("No games found");
    }

    res.send(rows);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Error Fetching Data");
  }
});

// Get Single Game
router.get("/api/games/:id", async (req, res) => {
  try {
    const DbConnections = req.app.get("dbConnection");
    const { id } = req.params;

    let rows;

    try {
      // Set the isolation level for this session in slaveDb
      await DbConnections.slaveDb.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      // Query to fetch game details by ID from slaveDb
      const query = `
        SELECT
          game_id,name, release_date, price, short_description,
          windows, mac, linux, metacritic_score, positive,
          negative, recommendations, average_playtime_forever, peak_ccu, version
        FROM steamgames.windowsgames WHERE game_id = ?;
      `;

      // Execute the query on slaveDb
      [rows] = await DbConnections.slaveDb.query(query, [id]);
    } catch (slaveErr) {
      console.warn("Slave database unavailable, falling back to masterDb:", slaveErr);

      // Set the isolation level for this session in masterDb
      await DbConnections.masterDb.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      // Query to fetch game details by ID from masterDb
      const query = `
        SELECT
          game_id, name, release_date, price, short_description,
          windows, mac, linux, metacritic_score, positive,
          negative, recommendations, average_playtime_forever, peak_ccu, version
        FROM steamgames.windowsgames WHERE game_id = ?;
      `;

      // Execute the query on masterDb
      [rows] = await DbConnections.masterDb.query(query, [id]);
    }

    // If no game is found, return 404
    if (!rows || rows.length === 0) {
      return res.status(404).send("Game not found");
    }

    // Return the game data
    res.send(rows[0]); // Return the single game object directly
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Error Fetching Data");
  }
});

// Update [working]
router.put("/api/games/:id", async (req, res) => {
  const DbConnections = req.app.get("dbConnection");
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
    version,
  } = req.body;

  let connection;

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level to SERIALIZABLE for this transaction
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

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

    const [result] = await connection.query(query, values);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send("Record is updated by another transaction");
    }

    // Commit transaction
    await connection.commit();

    res.send({
      message: "Game updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("Error updating data:", err);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();
    res.status(500).send("Error updating data");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// Delete [working]
router.delete("/api/games/:id", async (req, res) => {
  const DbConnections = req.app.get("dbConnection");
  const { id } = req.params;

  let connection;

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level to SERIALIZABLE for this operation
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

    const query = 'DELETE FROM steamgames.games WHERE game_id = ?;'
    const [result] = await connection.query(query, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send("Game deleted already");
    }

    // Commit transaction
    await connection.commit();

    res.send({
      message: "Game deleted successfully",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("Error deleting data:", err);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();
    res.status(500).send("Error deleting data");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// Insert [Working]
router.post("/api/games", async (req, res) => {
  const DbConnections = req.app.get("dbConnection");
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

  const getUniqueGameId = async (connection) => {
    let isUnique = false;
    let gameId;

    while (!isUnique) {
      gameId = generateGameId();
      const [rows] = await connection.query(
        "SELECT COUNT(*) AS count FROM steamgames.games WHERE game_id = ?",
        [gameId]
      );
      if (rows[0].count === 0) {
        isUnique = true;
      }
    }

    return gameId;
  };

  let connection;

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level to SERIALIZABLE for unique ID generation
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

    // Generate unique game_id
    const game_id = await getUniqueGameId(connection);

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

    const [result] = await connection.query(query, values);

    // Commit transaction
    await connection.commit();

    res.send({
      success: true,
      message: "Game added successfully",
      game_id,
      insertedId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting data:", error);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();

    res.status(500).send("Error inserting data");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});


module.exports = router;
