const express = require('express');
const mysql = require('mysql2/promise'); // Используем mysql2/promise для поддержки асинхронного кода
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { arrayAsString } = require('pdf-lib');
const { channel } = require('diagnostics_channel');
const { error } = require('console');

const saltRounds = 10;

const PORT = process.env.PORT || 3300;

const app = express();


// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
})); // Разрешаем кросс-доменные запросы
app.use(express.json()); // Используем встроенный парсер JSON
app.use('/uploads', express.static('uploads'));

// Создаем асинхронную функцию для подключения к базе данных
async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "kphimbel",
            password: "root"
        });
        //console.log("Подключение к серверу MySQL успешно установлено");
        return connection;
    } catch (error) {
        console.error("Ошибка подключения к базе данных:", error);
        throw error;
    }
}

const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Настройка multer для сохранения файлов в папку uploads
/*const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
*/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // Папка, куда будут сохраняться загруженные файлы
    },
    filename: function (req, file, cb) {
        // Генерация уникального имени файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
  })
const upload = multer({ storage: storage });

// Обработчики для GET-запросов на получение данных
app.get('/getTypes', async (req, res) => {
    let connection;
    try {
        connection = await connectToDatabase();
        const [results] = await connection.query('SELECT * FROM type WHERE subtype_id IS NULL');
         
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getSubTypes', async (req, res) => {
    let connection;
    try{
        connection = await connectToDatabase();
        const [results] = await connection.query('SELECT * FROM type WHERE subtype_id IS NOT NULL');
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
})
app.get('/getTypesAndSubTypesForMain', async (req, res) => {
    let connection;
    try{
        connection = await connectToDatabase();
        const [results] = await connection.query('SELECT t.* FROM type t LEFT JOIN type subtypes ON t.id = subtypes.subtype_id WHERE subtypes.id IS NULL ');
         
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
})  
app.get('/getProductsBy/:type_id', async (req, res) => {
    let connection;
    try{
        const {type_id} = req.params;
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT * FROM product WHERE type_id = ${type_id} AND is_active = ${true}`);
         
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getDeletedProducts', async (req, res) => {
    let connection;
    try{
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT * FROM product WHERE is_active = ${false}`);
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getProductBy/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT * FROM product WHERE id = ${id}`);
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/login/:login/:password', async (req, res) => {
    let connection;
    try {
        const { login, password } = req.params;

        // Получаем соединение с базой данных
        connection = await connectToDatabase();

        // Выполняем запрос к базе данных для получения пользователя по логину
        const [results] = await connection.query(`SELECT * FROM \`user\` WHERE login = ?`, [login]);
         
        if (results.length === 0) {
            res.status(404).send('Пользователь не найден');
            return;
        }

        const user = results[0];

        // Сравниваем хеш пароля из базы данных с введенным паролем
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error('Произошла ошибка при сравнении паролей:', err);
                res.status(500).send('Ошибка выполнения запроса');
                return;
            }
            if (result) {
                // Пароль совпадает, отправляем информацию о пользователе
                res.status(200).json(user);
            } else {
                // Пароль не совпадает
                res.status(401).send('Неверный логин или пароль');
            }
        });
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getCharacteristicsBy/:product_id', async (req, res) => {
    let connection;
    try{
        const {product_id} = req.params;
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT c.name AS characteristic, pc.value, ch.unit
        FROM product p
        JOIN product_characteristic pc ON p.id = pc.product_id
        JOIN characteristic ch ON pc.characteristic_id = ch.id
        JOIN characteristic c ON c.id = ch.id
        WHERE p.id = ${product_id}
        `);
         
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getCharacteristicsForListBy/:product_id', async (req, res) => {
    let connection;
    try{
        const {product_id} = req.params;
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT c.id AS characteristic_id, pc.value, ch.unit
        FROM product p
        JOIN product_characteristic pc ON p.id = pc.product_id
        JOIN characteristic ch ON pc.characteristic_id = ch.id
        JOIN characteristic c ON c.id = ch.id
        WHERE p.id = ${product_id}
        `);
         
        res.json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getCharacteristics', async (req, res) => {
    let connection;
    try{
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT * FROM characteristic`);
        res.status(200).json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getAllTypes', async (req, res) => {
    let connection;
    try{
        connection = await connectToDatabase();
        const [results] = await connection.query(`SELECT * FROM type`);
        res.status(200).json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getBasketIdOrAddNew/:user_id', async (req, res) => {
    let connection;
    try {
        const { user_id } = req.params;
        connection = await connectToDatabase();
        let result = await connection.query(`SELECT id FROM \`order\` WHERE user_id = ${user_id} AND \`date\` IS NULL`);
        if (result[0].length < 1) {
            await connection.query(`INSERT INTO \`order\`(user_id) VALUES(${user_id})`);
            result = await connection.query(`SELECT id FROM \`order\` WHERE user_id = ${user_id} AND \`date\` IS NULL`);
        }
        // Извлекаем только id из результата запроса
        const orderIds = result[0].map(row => row.id);
        res.status(200).json(orderIds);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getProductsInCompaund/:order_id', async (req, res) => {
    let connection;
    try {
        const { order_id } = req.params;
        connection = await connectToDatabase();
        let [result] = await connection.query(`SELECT c.id AS compound_id, p.name AS product_name, p.price AS product_price, p.id AS product_id, c.count AS compound_count, p.quantity AS product_quantity
        FROM compound c
        JOIN product p ON c.product_id = p.id
        JOIN \`order\` o ON c.order_id = o.id
        WHERE o.id = ${order_id}`);
        res.status(200).json(result);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getPhotoesUrl/:product_id', async (req, res) => {
    let connection;
    try {
        const { product_id } = req.params;
        // Получаем соединение с базой данных
        connection = await connectToDatabase();
        
        // Выполняем запрос к базе данных для получения URL фотографии по product_id
        const [results] = await connection.query('SELECT url FROM product_photo WHERE product_id = ?', [product_id]);
        // Проверяем, есть ли результаты запроса
        if (results.length === 0) {
            res.status(404).send('URL фотографии для указанного product_id не найден');
            return;
        }
        // Отправляем URL фотографии в качестве ответа на запрос
        res.status(200).json(results);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getPhotoUrl/:product_id', async (req, res) => {
    let connection;
    try {
        const { product_id } = req.params;
        // Получаем соединение с базой данных
        connection = await connectToDatabase();
        
        // Выполняем запрос к базе данных для получения URL фотографии по product_id
        const [results] = await connection.query('SELECT url FROM product_photo WHERE product_id = ?', [product_id]);
        // Проверяем, есть ли результаты запроса
        if (results.length === 0) {
            res.status(404).send('URL фотографии для указанного product_id не найден');
            return;
        }
        // Отправляем URL фотографии в качестве ответа на запрос
        res.status(200).json(results[0].url);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getCountOfProductsInBasket/:userId', async (req, res) => {
    let connection;
    try{
        const { userId } = req.params;
        connection = await connectToDatabase();

        const [result] = await connection.query(`CALL GetCompoundSumByUserId(${userId})`);
        res.status(200).json(result[0][0].totalSum);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getShopDeliveryInfo', async (req, res) => {
    let connection;
    try {
        connection = await connectToDatabase();
        
        const [result] = await connection.query(`SELECT * FROM shop_address`);
        res.status(200).json(result);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getUserDeliveryInfo/:userId', async (req, res) => {
    let connection;
    try{
        const { userId } = req.params;
        connection = await connectToDatabase();

        const [result] = await connection.query(`SELECT * FROM user_address WHERE user_id = ${userId}`);
        res.status(200).json(result);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getUserPaymentBy/:id', async (req, res) => {
    let connection;
    try{
        const { id } = req.params;
        connection = await connectToDatabase();

        const result = await connection.query(`SELECT * FROM payment_way WHERE id = ${id}`);
        res.status(200).json(result[0][0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getUserDeliveryInfoBy/:id', async (req, res) => {
    let connection;
    try{
        const { id } = req.params;
        connection = await connectToDatabase();

        const result = await connection.query(`SELECT * FROM user_address WHERE id = ${id}`);
        res.status(200).json(result[0][0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getShopDeliveryInfoBy/:id', async (req, res) => {
    let connection;
    try{
        const { id } = req.params;
        connection = await connectToDatabase();

        const result = await connection.query(`SELECT * FROM shop_address WHERE id = ${id}`);
        res.status(200).json(result[0][0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getUserOrderBy/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();

        const [result] = await connection.query(`CALL GetUserOrders(${id})`);        
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getOrderStatusesBy/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();

        const [result] = await connection.query(`CALL GetOrderStatusByOrderId(${id})`);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getShortProductInfoBy/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();
        const result =  await connection.query(`SELECT name, description, raiting FROM product WHERE id = ${id}`);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getProductReviewsBy/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL GetReviewsByProductId(${id});`);
        console.log(result[0]);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getPrductsIdForFavoritesByUser/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`SELECT 
        p.*
    FROM 
        favorites f
    JOIN 
        product p ON f.product_id = p.id
    WHERE 
        f.user_id = ${id}`);
        console.log(result);
        res.status(200).json(result);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getUserCompare/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL GetCompareProductsByUserId(${id})`);
        console.log(result[0])
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getdemandReport', async (req, res) => {
    let connection;
    try {
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL GetTopProducts();`);
        console.log(result[0]);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.get('/getPhotoByType/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL get_first_product_photo_by_type(${id})`);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});

// Обработчики для POST-запросов
app.post('/registration', async (req, res) => {
    let connection;
    try {
        const {login, email, name, surname, password, phone} = req.body; // Получаем данные о пользователе из тела запроса
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error('Произошла ошибка при хешировании пароля:', err);
              res.status(500).send('Ошибка хеширования пароля');
              return;
            }
            try {
                connection = await connectToDatabase();

            } catch (error) {

            }
            try {
                connection = await connectToDatabase();
                const result = await connection.query(`INSERT INTO \`user\`(login, password, email, first_name, last_name, phone_number) VALUES ('${login}','${hash}','${email}','${name}','${surname}','${phone}')`); // Выполняем запрос к базе данных для создания нового пользователя
                console.log(result);
                //res.status(201).send('Пользователь успешно создан');
            } catch (error) {
                console.error('Ошибка создания пользователя:', error);
                res.status(500).send(error);
            }
        });
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        res.status(500).send(error);
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/sendNewType', async (req, res) => {
    let connection;
    try {
        const {name, subtype_id} = req.body; // Получаем данные о пользователе из тела запроса
        try {
            connection = await connectToDatabase();
            await connection.query(`INSERT INTO type(name, subtype_id) VALUES ('${name}', ${subtype_id})`); // Выполняем запрос к базе данных для создания нового пользователя
             
            res.status(200).send('Тип успешно создан');
        } catch (error) {
            console.error('Ошибка создания типа:', error);
            res.status(500).send('Ошибка создания типа');
        }
    } catch (error) {
        console.error('Ошибка создания типа:', error);
        res.status(500).send('Ошибка создания типа');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addNewProduct', async (req, res) => {
    let connection;
    try {
        const {name, price, description, product_characteristics, type_id} = req.body; // Получаем данные о пользователе из тела запроса
        try {
            connection = await connectToDatabase();
            await connection.query(`INSERT INTO product(name, price, description, type_id) VALUES ('${name}', ${price}, '${description}', ${type_id})`); // Выполняем запрос к базе данных для создания нового пользователя
            const [productId] = await connection.query(`SELECT id FROM product WHERE name = '${name}'`);

            // Если характеристики товара были переданы, добавляем их в базу данных
            if (product_characteristics && product_characteristics.length > 0) {
                await Promise.all(product_characteristics.map(async (characteristic) => {
                    await connection.query(`INSERT INTO product_characteristic (characteristic_id, product_id, value) VALUES (${characteristic.characteristic_id}, ${productId[0].id}, ${characteristic.value})`);
                }));
            }
            res.status(200).send('Товар успешно создан');
        } catch (error) {
            console.error('Ошибка создания типа:', error);
            res.status(500).send('Ошибка создания типа');
        }
    } catch (error) {
        console.error('Ошибка создания типа:', error);
        res.status(500).send('Ошибка создания типа');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addNewProductCharacteristc', async (req, res) => {
    let connection;
    try {
        const {product_id, product_characteristics} = req.body; // Получаем данные о пользователе из тела запроса
        try {
            connection = await connectToDatabase();
            // Если характеристики товара были переданы, добавляем их в базу данных
            if (product_characteristics && product_characteristics.length > 0) {
                await Promise.all(product_characteristics.map(async (characteristic) => {
                    await connection.query(`INSERT INTO product_characteristic (characteristic_id, product_id, value) VALUES (${characteristic.characteristic_id}, ${product_id}, ${characteristic.value})`);
                }));
            }
            res.status(200).send('Характеристики успешно добавлены');
        } catch (error) {
            console.error('Ошибка создания характеристик:', error);
            res.status(500).send('Ошибка создания характеристик');
        }
    } catch (error) {
        console.error('Ошибка создания типа:', error);
        res.status(500).send('Ошибка создания типа');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addProductToBasket', async (req, res) => {
    let connection;
    try {
        const {product_id, order_id, count} = req.body; // Получаем данные о пользователе из тела запроса
        try {
            connection = await connectToDatabase();
            // Если характеристики товара были переданы, добавляем их в базу данных
            await connection.query(`INSERT INTO compound(product_id, order_id, count) VALUES(${product_id}, ${order_id}, ${count})`)
            res.status(200).send('товар успешно добавлены в корзину');
        } catch (error) {
            console.error('Ошибка добавления товара:', error);
            res.status(500).send('Ошибка добавления товара');
        }
    } catch (error) {
        console.error('Ошибка создания типа:', error);
        res.status(500).send('Ошибка создания типа');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/uploadPhoto/:productId', upload.single('image'), async (req, res) => {
    let connection;
    try {
        const { productId } = req.params; // Получаем ID продукта из запроса
        const imagePath = req.file ? req.file.path : null; // Проверяем, был ли загружен файл
        if (!imagePath) {
            return res.status(400).send('Файл не был загружен');
        }
        connection = await connectToDatabase();
        // Сохраняем путь к изображению и ID продукта в базу данных
        const sql = 'INSERT INTO product_photo (url, product_id) VALUES (?, ?)';
        await connection.query(sql, [imagePath, productId]);
        res.status(200).send('Изображение успешно загружено и сохранено в базе данных');
    } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        res.status(500).send('Ошибка при загрузке изображения');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addNewCharacteristcs', async (req, res) => {
    let connection;
    try {
        const {characteristics} = req.body;
        connection = await connectToDatabase();
            // Если характеристики товара были переданы, добавляем их в базу данных
            if (characteristics && characteristics.length > 0) {
                await Promise.all(characteristics.map(async (characteristic) => {
                    await connection.query(`INSERT INTO characteristic (name, unit) VALUES ('${characteristic.characteristic_name}', '${characteristic.unit ? characteristic.unit : ''}')`);
                }));
            }
        res.status(200).send('Характеристики успешно добавлены');
    } catch (error) {
        console.error('Ошибка при загрузке характеристик:', error);
        res.status(500).send('Ошибка при загрузке характеристик');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addNewDelivery', async (req, res) => {
    let connection;
    try {
        const {user_address_id, shop_address_id, order_id} = req.body;

        connection = await connectToDatabase();
        let result;
        if(user_address_id === null){
            result = await connection.query(`INSERT INTO delivery(shop_address_id, order_id) VALUES (${shop_address_id}, ${order_id})`)
        }
        else if (shop_address_id === null) {
            result = await connection.query(`INSERT INTO delivery(user_address_id, order_id) VALUES (${user_address_id}, ${order_id})`)
        }
        else {
            res.status(404).send("В передаваемых данных присутствуют ошибки");
        }
        res.status(200).send("Новая доставка создана");
    } catch (error) {
        console.error('Ошибка при загрузке характеристик:', error);
        res.status(500).send('Ошибка при загрузке характеристик');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addNewUserDelivery', async (req, res) => {
    let connection;
    try {
        const {address, name, surname, email, phone, user_id, price} = req.body;

        connection = await connectToDatabase();
        const result = await connection.query(`INSERT INTO user_address(address, name, surname, email, phone, user_id, price) VALUES ('${address}', '${name}', '${surname}', '${email}', '${phone}', ${user_id}, ${price})`);
        res.status(200).send("Добавлен новый адрес доставки");
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).send('Ошибка удаления продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/getProductForSearchBar', async (req, res) => {
    let connection;
    try{
        const { search } = req.body;
        connection = await connectToDatabase();

        const result = await connection.query(`SELECT * FROM product WHERE name LIKE '%${search}%' AND is_active = ${true}`);
        console.log(result[0])
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }  
});
app.post('/addNewReview', async (req, res) => {
    let connection;
    try {
        const { product_id, user_id, title, text, rating } = req.body;
        connection = await connectToDatabase();
        await connection.query(`INSERT INTO review(product_id, user_id, title, description, raiting, date) VALUES(${product_id}, ${user_id}, '${title? title : ''}', '${text? text : ''}'   , ${rating}, ${Date.now()})`);
        res.status(200).send("Отзыв добавлен");
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }  
});
app.post('/addProductToFavorities', async (req, res) => {
    let connection;
    try {
        const { productId, userId } = req.body;
        connection = await connectToDatabase();
        await connection.query(`INSERT INTO favorites(product_id, user_id) VALUE(${productId}, ${userId})`);
        res.status(200).send("Товар добавлен в избранное");
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }  
});
app.post('/getExistingStatus', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        connection = await connectToDatabase();
        const result = await connection.query(`SELECT 
                                                CASE 
                                                    WHEN EXISTS (
                                                        SELECT 1 
                                                        FROM favorites 
                                                        WHERE product_id = ${productId} AND user_id = ${userId}
                                                    ) 
                                                    THEN 'да' 
                                                    ELSE 'нет' 
                                                END AS exists_status;`);
        res.status(200).json(result[0][0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/getExistingCompare', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        connection = await connectToDatabase();
        const result = await connection.query(`SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM compare 
                WHERE product_id = ${productId} AND user_id = ${userId}
            ) 
            THEN 'да' 
            ELSE 'нет' 
        END AS exists_compare;`);
        res.status(200).json(result[0][0])
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/addProductToCompare', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        connection = await connectToDatabase();
        console.log(productId + ' ' + userId);
        await connection.query(`INSERT INTO compare (product_id, user_id) VALUES (${productId}, ${userId})`);
        res.status(200).send('Товар добавлен в сравнении');
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/deleteProductFromCompare', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        connection = await connectToDatabase();
        await connection.query(`DELETE FROM compare WHERE product_id = ${productId} AND user_id = ${userId}`);
        res.status(200).send('Товар удален из сравнения');
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/deleteProductFromFavorites', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        console.log(productId, userId);
        connection = await connectToDatabase();
        await connection.query(`DELETE FROM favorites WHERE product_id = ${productId} AND user_id = ${userId}`);
        res.status(200).send('Товар удален из избранного');
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.post('/areProductInOrder', async (req, res) => {
    let connection;
    try {
        const {productId, userId} = req.body;
        connection = await connectToDatabase();
        const result = await connection.query(`SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1
                FROM \`order\` o
                JOIN compound c ON o.id = c.order_id
                WHERE o.user_id = ${userId} 
                AND c.product_id = ${productId} 
                AND o.date IS NULL
            ) 
            THEN 'да' 
            ELSE 'нет' 
        END AS product_in_order;`);
        res.status(200).send(result[0][0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    } 
});
app.post('/getCustomersByOrderPrice', async (req, res) => {
    let connection;
    try {
        const { price } = req.body;
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL GetTopCustomersByTotalOrderSum(${price});`);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    } 
});
app.post('/getsalesReport', async (req, res) => {
    let connection;
    try {
        const { start_date, end_date } = req.body;
        connection = await connectToDatabase();
        const [result] = await connection.query(`CALL GetSalesReportByPeriod(${start_date}, ${end_date})`);
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    } 
});
app.post('/delProductCharacteristic', async (req, res) => {
    let connection;
    try {
        const {characteristicId, productId} = req.body;
        connection = await connectToDatabase();
        await connection.query(`DELETE FROM product_characteristic WHERE characteristic_id = ${characteristicId} AND product_id = ${productId}`);
        res.status(200).json('Характеристика успешно удалена');
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    } 
});

let verificationCodes = {}; // In-memory storage for verification codes

app.post('/send-verification-email', (req, res) => {
    const { email } = req.body;
    const code = crypto.randomInt(100000, 999999).toString();
  
    verificationCodes[email] = code;
  
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'himbelhelp@gmail.com',
        pass: 'ziiy bvcy rury dfqy',
      },
    });
  
    const mailOptions = {
      from: 'himbelhelp@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: `Your verification code is: ${code}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send('Error sending email');
      }
      res.status(200).send('Verification email sent');
    });
  });

  app.post('/verify-code', (req, res) => {
    const { code } = req.body;
    const email = Object.keys(verificationCodes).find(email => verificationCodes[email] === code);
  
    if (email) {
      delete verificationCodes[email]; // Remove code after verification
      res.status(200).send('Code verified');
    } else {
      res.status(400).send('Invalid code');
    }
  });
app.post('/delCharacteristics', async (req, res) => {
    let connection;
    try {
        const {characteristics} = req.body;
        connection = await connectToDatabase();
            // Если характеристики товара были переданы, добавляем их в базу данных
            if (characteristics && characteristics.length > 0) {
                await Promise.all(characteristics.map(async (characteristic) => {
                    await connection.query(`DELETE FROM characteristic WHERE id = ${characteristic.characteristic_id}`);
                }));
            }
        res.status(200).send('Характеристики успешно удалены');
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        res.status(500).send('Ошибка выполнения запроса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                //console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});


// Обработчики для Delete запросов
app.delete('/delType/:id',  async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        connection = await connectToDatabase();
        //await connection.query(`DELETE FROM product WHERE type_id=${id}`);
        await connection.query(`DELETE FROM type WHERE id = ${id}`); // Выполняем запрос к базе данных для создания нового пользователя
        res.status(200).send('Тип успешно удалён');
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).send('Ошибка удаления продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.delete('/delProduct/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        connection = await connectToDatabase();
        //await connection.query(`DELETE FROM product_characteristic WHERE product_id = ${id}`);
        await connection.query(`UPDATE product SET is_active = ${false} WHERE id = ${id}`); // Выполняем запрос к базе данных для создания нового пользователя
        res.status(200).send('Продук успешно удалён');
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).send('Ошибка удаления продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
})
app.delete('/delCompound/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        connection = await connectToDatabase();
        //await connection.query(`DELETE FROM product_characteristic WHERE product_id = ${id}`);
        await connection.query(`DELETE FROM compound WHERE id = ${id}`); // Выполняем запрос к базе данных для создания нового пользователя
        res.status(200).send('Продук успешно удалён');
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).send('Ошибка удаления продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.delete('/delPhoto/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        const {url} = req.body; 
        let cleanedUrl = url.replace('http://localhost:3300/', '');
        const photo_name = cleanedUrl.replace('uploads\\', '') ;
        cleanedUrl = cleanedUrl.replace(/\\/g,'\\\\\\');
        connection = await connectToDatabase();
        const [result] = await connection.query(`DELETE FROM product_photo WHERE product_id = ${id} AND url = '${cleanedUrl}'`);
        
        if (result.affectedRows > 0) {
            const filePath = path.join(__dirname, 'uploads', photo_name);
            // Удаление файла
            fs.unlinkSync(filePath);
            res.status(200).send('Фото успешно удалено');
        } else {
            res.status(404).send('Фото не найдено');
        }
        
    } catch (error) {       
        console.error('Ошибка удаления фото:', error);
        res.status(500).send('Ошибка удаления фото');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.delete('/delUserDelivery/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`DELETE FROM user_address WHERE id = ${id}`);
        if (result.affectedRows > 0) {
            res.status(200).send('адрес успешно удален');
        }
        else {
        res.status(404).send('Адрес не найден');
        }

    } catch (error) {       
        console.error('Ошибка удаления адреса:', error);
        res.status(500).send('Ошибка удаления адреса');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.delete(`/delReview/:id`, async (req, res) => {
    let connection;
    try {
        const {id} = req.params;
        connection = await connectToDatabase();
        const [result] = await connection.query(`DELETE FROM review WHERE id = ${id}`);
        if (result.affectedRows > 0) {
            res.status(200).send('Отзыв успешно удален');
        }
        else {
        res.status(404).send('Отзыв не найден');
        }
    } catch (error) {       
        console.error('Ошибка удаления отзыва:', error);
        res.status(500).send('Ошибка удаления отзыва');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});

// Обработчики для Put запросов
app.put('/updateType/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        const {name, subtype_id} = req.body;
        connection = await connectToDatabase();
        await connection.query(`UPDATE type SET name = '${name}', subtype_id = ${subtype_id} WHERE id = ${id}`);
        res.status(200).send('Тип успешно обновлён');
        // 
    } catch (error) {
        console.error('Ошибка изменения типа:', error);
        res.status(500).send('Ошибка изменения типа');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put('/updateProduct/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        const {name, price, description, quantity, type_id} = req.body;
        connection = await connectToDatabase();
        await connection.query(`UPDATE product SET name = '${name}', price = ${price}, description = '${description}', quantity = ${quantity}, type_id = ${type_id} WHERE id = ${id}`);
        res.status(200).send('продукт успешно обновлён');
    } catch (error) {
        console.error('Ошибка изменения продукта:', error);
        res.status(500).send('Ошибка изменения продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put('/updateCompoundOf/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        const {newCount} = req.body;
        connection = await connectToDatabase();
        await connection.query(`UPDATE compound SET count = ${newCount} WHERE id = ${id}`);
        res.status(200).send('продукт успешно обновлён');
    } catch (error) {
        console.error('Ошибка изменения продукта:', error);
        res.status(500).send('Ошибка изменения продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put('/updateOrderOf/:id', async (req, res) => {
    let connection;
    try{
        const {id} = req.params;
        const {price, payment_id} = req.body;
        connection = await connectToDatabase();
        await connection.query(`UPDATE \`order\` SET price = ${price}, date = ${Date.now()}, payment_id=${payment_id} WHERE id = ${id}`);
        await connection.query(`INSERT INTO \`order_status\`(status_id, order_id, \`date\`) VALUES (${1}, ${id}, ${Date.now()})`);
        res.status(200).send('продукт успешно обновлён');
    } catch (error) {
        console.error('Ошибка изменения продукта:', error);
        res.status(500).send(error.sqlMessage);
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put('/updateProductCharacteristics', async (req, res) => {
    let connection;
    try {
        const {characteristics, productId} = req.body;
        connection = await connectToDatabase();
        if (characteristics && characteristics.length > 0) {
            await Promise.all(characteristics.map(async (characteristic) => {
                await connection.query(`UPDATE product_characteristic SET value = ${characteristic.value} WHERE characteristic_id = ${characteristic.characteristic_id} AND product_id = ${productId}`);
            }));
            res.status(200).send('Характеристики обнавлены!');
        }
        else {
            res.status(400).send('Нету характеристик для обновления!');
        }

    } catch (error) {
        console.error('Ошибка изменения характеристик продукта:', error);
        res.status(500).send('Ошибка изменения характеристик продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put('/updateReview', async (req, res) => {
    let connection;
    try {
        const {id, title, text, rating} = req.body;
        //console.log(req.body);
        connection = await connectToDatabase();
        await connection.query(`UPDATE review SET title = '${title}', description = '${text}', raiting = ${rating} WHERE id = ${id}`);
        res.status(200).send('отзыв успешно обновлён');
    } catch (error) {
        console.error('Ошибка изменения отзыва:', error);
        res.status(500).send('Ошибка изменения отзыва');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
app.put(`/recoveryProduct`, async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        connection = await connectToDatabase();
        await connection.query(`UPDATE product SET is_active = ${true} WHERE id = ${id}`);
        res.status(200).send('Продукт успешно восстановлен');
    } catch (error) {
        console.error('Ошибка изменения продукта:', error);
        res.status(500).send('Ошибка изменения продукта');
    } finally {
        if (connection) {
            try {
                await connection.end(); // Закрываем соединение
                console.log("Соединение с базой данных закрыто");
            } catch (error) {
                console.error("Ошибка при закрытии соединения:", error);
            }
        }
    }
});
// Обработчик для GET-запроса на корневой маршрут
app.get('/api', (req, res) => {
    res.json({
        message: "hello from backend"
    });
});

// Старт сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
