const express = require("express");
const router = express.Router();

const DbConnections = require("../dbConnection");

const transactionQueue = [];

const queueTransaction = (transaction) => {
  transactionQueue.push(transaction);
  console.log("Transaction queued:", transaction);
};

const processQueuedTransactions = async (db) => {
  while (transactionQueue.length > 0) {
    console.log("Processing queued transactions...");
    const transaction = transactionQueue.shift(); // Remove the first transaction
    let connection;

    try {
      // Get a connection from the pool
      connection = await db.getConnection();

      // Set isolation level for the transaction
      await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

      // Begin transaction
      await connection.beginTransaction();
      // Handle special case for INSERT transactions
      if (transaction.query.trim().toUpperCase().startsWith("INSERT INTO")) {
        console.log("Detected INSERT transaction. Generating unique game_id...");

        // Generate unique game ID
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

        // Generate the game_id
        const gameId = await getUniqueGameId(connection);

        // Update transaction parameters to include the generated game_id
        transaction.params[0] = gameId; // Assuming game_id is the first parameter
        console.log(`Generated game_id: ${gameId}`);
      }

      // Execute the query
      const [result] = await connection.query(
        transaction.query,
        transaction.params
      );

      // Commit the transaction if successful
      await connection.commit();
      console.log("Processed transaction:", result);
    } catch (err) {
      console.error("Error processing transaction:", err);

      // Re-add to the front of the queue if it fails
      transactionQueue.unshift(transaction);

      // Rollback the transaction
      if (connection) await connection.rollback();

      // Stop further processing for now
      break;
    } finally {
      // Release the connection back to the pool
      if (connection) connection.release();
    }
  }
};

const isDatabaseAvailable = async (db) => {
  try {
    await db.query("SELECT 1"); // Ping the database
    return true;
  } catch (err) {
    console.error("Database unavailable:", err.message);
    return false;
  }
};

setInterval(async (req, res) => {
  const dbAvailable = await isDatabaseAvailable(DbConnections.masterDb);
  if (dbAvailable) {
    await processQueuedTransactions(DbConnections.masterDb);
  } else {
    console.log("Database still unavailable. Retrying later...");
  }
}, 5000); // Retry every 5 seconds

// Test
router.get("/api/test", (req, res) => {
  res.send({ 1: "Test" });
});

// Test
router.get("/api/test-master", async (req, res) => {
  try {
    const DbConnections = req.app.get("dbConnection");
    const [results] = await DbConnections.masterDb.query(
      "SELECT * FROM steamgames.windowsgames"
    );
    res.send(results);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Database query failed" });
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
      console.warn(
        "Slave database unavailable, falling back to masterDb:",
        slaveErr
      );

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
      console.warn(
        "Slave database unavailable, falling back to masterDb:",
        slaveErr
      );

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
// router.put("/api/games/:id", async (req, res) => {
//   const DbConnections = req.app.get("dbConnection");
//   const { id } = req.params;
//   const {
//     name,
//     release_date,
//     price,
//     short_description,
//     windows,
//     mac,
//     linux,
//     metacritic_score,
//     positive,
//     negative,
//     recommendations,
//     average_playtime_forever,
//     peak_ccu,
//     version,
//   } = req.body;

//   let connection;

//   try {
//     // Get a connection from the pool
//     connection = await DbConnections.masterDb.getConnection();

//     // Set isolation level to SERIALIZABLE for this transaction
//     await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

//     // Begin transaction
//     await connection.beginTransaction();

//     const query = `
//       UPDATE steamgames.games
//       SET
//         name = ?,
//         release_date = ?,
//         price = ?,
//         short_description = ?,
//         windows = ?,
//         mac = ?,
//         linux = ?,
//         metacritic_score = ?,
//         positive = ?,
//         negative = ?,
//         recommendations = ?,
//         average_playtime_forever = ?,
//         peak_ccu = ?,
//         version = version + 1
//       WHERE game_id = ? AND version = ?;
//     `;

//     const values = [
//       name,
//       release_date,
//       price,
//       short_description,
//       windows,
//       mac,
//       linux,
//       metacritic_score,
//       positive,
//       negative,
//       recommendations,
//       average_playtime_forever,
//       peak_ccu,
//       id,
//       version,
//     ];

//     const [result] = await connection.query(query, values);

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).send("Record is updated by another transaction");
//     }

//     // Commit transaction
//     await connection.commit();

//     res.send({
//       message: "Game updated successfully",
//       affectedRows: result.affectedRows,
//     });
//   } catch (err) {
//     console.error("Error updating data:", err);

//     // Rollback transaction in case of failure
//     if (connection) await connection.rollback();
//     res.status(500).send("Error updating data");

//   } finally {
//     // Release the connection back to the pool
//     if (connection) connection.release();
//   }
// });
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

  // Transaction details
  const transaction = {
    query: `
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
    `,
    params: [
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
    ],
  };

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level for the transaction
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

    // Execute the update query
    const [result] = await connection.query(
      transaction.query,
      transaction.params
    );

    // Check if the record was updated
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

    // Queue the transaction for retry if an error occurs
    queueTransaction(transaction);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();

    res.status(500).send("Error updating data. Transaction queued for retry.");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// Delete [working]
// router.delete("/api/games/:id", async (req, res) => {
//   const DbConnections = req.app.get("dbConnection");
//   const { id } = req.params;

//   let connection;

//   try {
//     // Get a connection from the pool
//     connection = await DbConnections.masterDb.getConnection();

//     // Set isolation level to SERIALIZABLE for this operation
//     await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

//     // Begin transaction
//     await connection.beginTransaction();

//     const query = "DELETE FROM steamgames.games WHERE game_id = ?;";
//     const [result] = await connection.query(query, [id]);

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).send("Game deleted already");
//     }

//     // Commit transaction
//     await connection.commit();

//     res.send({
//       message: "Game deleted successfully",
//       affectedRows: result.affectedRows,
//     });
//   } catch (err) {
//     console.error("Error deleting data:", err);

//     // Rollback transaction in case of failure
//     if (connection) await connection.rollback();
//     res.status(500).send("Error deleting data");
//   } finally {
//     // Release the connection back to the pool
//     if (connection) connection.release();
//   }
// });
router.delete("/api/games/:id", async (req, res) => {
  const DbConnections = req.app.get("dbConnection");
  const { id } = req.params;

  let connection;

  // Define the transaction details for the delete operation
  const transaction = {
    query: "DELETE FROM steamgames.games WHERE game_id = ?;",
    params: [id],
  };

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level to SERIALIZABLE for this operation
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

    const [result] = await connection.query(transaction.query, transaction.params);

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

    // Queue the transaction for retry
    queueTransaction(transaction);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();

    res.status(500).send("Error deleting data. Transaction queued for retry.");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});


// Insert [Working]
// router.post("/api/games", async (req, res) => {
//   const DbConnections = req.app.get("dbConnection");
//   const {
//     name,
//     release_date,
//     price,
//     short_description,
//     windows,
//     mac,
//     linux,
//     metacritic_score,
//     positive,
//     negative,
//     recommendations,
//     average_playtime_forever,
//     peak_ccu,
//   } = req.body;

//   // Input validation
//   if (
//     !name ||
//     !release_date ||
//     price === undefined ||
//     windows === undefined ||
//     mac === undefined ||
//     linux === undefined
//   ) {
//     return res
//       .status(400)
//       .send(
//         "Missing required fields: name, release_date, price, windows, mac, linux"
//       );
//   }

//   const generateGameId = () => Math.floor(100000 + Math.random() * 900000);

//   const getUniqueGameId = async (connection) => {
//     let isUnique = false;
//     let gameId;

//     while (!isUnique) {
//       gameId = generateGameId();
//       const [rows] = await connection.query(
//         "SELECT COUNT(*) AS count FROM steamgames.games WHERE game_id = ?",
//         [gameId]
//       );
//       if (rows[0].count === 0) {
//         isUnique = true;
//       }
//     }

//     return gameId;
//   };

//   let connection;

//   try {
//     // Get a connection from the pool
//     connection = await DbConnections.masterDb.getConnection();

//     // Set isolation level to SERIALIZABLE for unique ID generation
//     await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

//     // Begin transaction
//     await connection.beginTransaction();

//     // Generate unique game_id
//     const game_id = await getUniqueGameId(connection);

//     const query = `
//       INSERT INTO steamgames.games 
//       (game_id, name, release_date, price, short_description, windows, mac, linux, metacritic_score, positive, negative, recommendations, average_playtime_forever, peak_ccu) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
//     `;

//     const values = [
//       game_id,
//       name,
//       release_date,
//       price,
//       short_description,
//       windows,
//       mac,
//       linux,
//       metacritic_score,
//       positive,
//       negative,
//       recommendations,
//       average_playtime_forever,
//       peak_ccu,
//     ];

//     const [result] = await connection.query(query, values);

//     // Commit transaction
//     await connection.commit();

//     res.send({
//       success: true,
//       message: "Game added successfully",
//       game_id,
//       insertedId: result.insertId,
//     });
//   } catch (error) {
//     console.error("Error inserting data:", error);

//     // Rollback transaction in case of failure
//     if (connection) await connection.rollback();

//     res.status(500).send("Error inserting data");
//   } finally {
//     // Release the connection back to the pool
//     if (connection) connection.release();
//   }
// });
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
  if (
    !name ||
    !release_date ||
    price === undefined ||
    windows === undefined ||
    mac === undefined ||
    linux === undefined
  ) {
    return res
      .status(400)
      .send(
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

  // Define the transaction details for the insert operation
  const transaction = {
    query: `
      INSERT INTO steamgames.games 
      (game_id, name, release_date, price, short_description, windows, mac, linux, metacritic_score, positive, negative, recommendations, average_playtime_forever, peak_ccu) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    params: [], // To be populated after generating game_id
  };

  try {
    // Get a connection from the pool
    connection = await DbConnections.masterDb.getConnection();

    // Set isolation level to SERIALIZABLE for unique ID generation
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    // Begin transaction
    await connection.beginTransaction();

    // Generate unique game_id
    const game_id = await getUniqueGameId(connection);
    transaction.params = [
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

    const [result] = await connection.query(transaction.query, transaction.params);

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
    const game_id = 0;
    transaction.params = [
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
    // Queue the transaction for retry
    queueTransaction(transaction);

    // Rollback transaction in case of failure
    if (connection) await connection.rollback();

    res.status(500).send("Error inserting data. Transaction queued for retry.");
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});



module.exports = router;
