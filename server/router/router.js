const express = require('express');
require('dotenv/config');
const router = express.Router();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
});

router.get('/api/test', async (req,res) => {
    res.send({1:"Test"});
});
//Get
router.get('/api/games', (req,res) => {
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
    FROM steamgames.games LIMIT 10;
        `
    ,
    (err,rows)=>{
        if(err){
            console.error("Error Fetching Data:",err);
            return res.status(500).send("Error Fetching Data");
        }

        if(rows.length === 0){
            return res.status(404).send("No tags found");            
        }

        res.send(rows);
    }
    );
});

//Update
router.put('/api/games/:id', (req, res) => {
    const { id } = req.params; // Game ID from the URL
    const { price, short_description, windows, mac, linux } = req.body; // Editable fields from the request body

    const query = `
        UPDATE steamgames.games 
        SET 
            price = ?, 
            short_description = ?, 
            windows = ?, 
            mac = ?, 
            linux = ? 
        WHERE game_id = ?;
    `;

    const values = [price, short_description, windows, mac, linux, id];


    connection.query(query,values,
        (err, result) => {
        if (err) {
            console.error("Error updating data:", err);
            return res.status(500).send("Error updating data");
        }

        res.send({ success: true, message: "Game updated successfully", affectedRows: result.affectedRows });
    });
});

//Delete
router.delete('/api/games/:id', (req, res) => {
    const { id } = req.params; // Game ID from the URL

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

router.post('/api/games', async (req, res) => {
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
        peak_ccu
    } = req.body;

    // Function to generate a random game_id
    const generateGameId = () => Math.floor(100000 + Math.random() * 900000); // 6-digit random number

    // Check for a unique game_id
    const getUniqueGameId = async () => {
        let isUnique = false;
        let gameId;

        while (!isUnique) {
            gameId = generateGameId();
            const [rows] = await connection.promise().query(
                'SELECT COUNT(*) AS count FROM steamgames.games WHERE game_id = ?',
                [gameId]
            );
            if (rows[0].count === 0) {
                isUnique = true;
            }
        }

        return gameId;
    };

    try {
        const game_id = await getUniqueGameId(); // Generate unique game_id

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
            peak_ccu
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