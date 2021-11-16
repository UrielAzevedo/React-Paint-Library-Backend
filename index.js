const express = require('express')
const app = express()
const cors = require('cors')
const Pool = require('pg').Pool
const multer = require('multer')

const storageDir = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './Paintings_img_storage')
    },
    filename: ((req, file, cb) => {
        // const fileExtension = file.originalname.substring(file.originalname.indexOf("."))

        cb(null, file.fieldname + '-' + Date.now() + '.' + 'jpg')
    })
})

const upload = multer({ storage: storageDir })
app.use(cors())
app.use('/static', express.static('./Paintings_img_storage'))

const pool = new Pool({
    user: 'eivgfpglhwncsf',
    password: 'a3489f75f65555cc63ee8a15967cdb71757b816f947e80cb8a05740932f98740',
    host: 'ec2-34-239-55-93.compute-1.amazonaws.com',
    database: 'd4jo435ku3ebvr',
    port: 5432,
    ssl: { rejectUnauthorized: false },
})

pool.connect()

app.use(express.json())

app.post('/', upload.single('picture'), (req, res) => {
    const dateNowImgId = req.file.filename.substring(req.file.filename.indexOf("-") + 1, req.file.filename.lastIndexOf("."))

    const values = [req.body.paintName, req.body.yearPainted, req.body.authorName, req.body.genre, dateNowImgId]
    const updateQury = 'INSERT INTO paintings (name, year, author_name, genre, img_id) VALUES ($1, $2, $3, $4, $5);'

    pool.query(updateQury, values, (err, res) => {
        if (err) {
            console.log(err)
        }
    })
})

app.get('/paintings', (req, resExp) => {
    const query = {
        name: 'fetch-paintings',
        text: 'SELECT * FROM paintings;'
    }

    pool.query(query, (err, res) => {
        if (err) {
            console.log(res.err)
        } else {
            console.log(res.rows)
            resExp.send(res.rows)
        }
    })
})

app.get('/paintMiniature', (req, resExp) => {

    const query = {
        name: 'getMiniatureData',
        text: 'SELECT name, img_id FROM paintings WHERE id = $1;',
        values: [req.query.id]
    }

    pool.query(query, (err, res) => {
        if (err) {
            console.log(err)
        } else if (!res.rows[0]) {
            console.log("no data")
        }
        else {
            const imgId = res.rows[0].img_id

            resExp.send({
                name: res.rows[0].name,
                file: `https://react-paint-library-backend.herokuapp.com/static/picture-${imgId}.jpg`,
            })
        }
    })

})

app.get('/fetchAllPaintingData', (req, resExp) => {

    const query = {
        name: 'getPaintingsData',
        text: 'SELECT id FROM paintings;'
    }

    pool.query(query, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            if (res.rows) {
                const response = {
                    paintingsIds: res.rows
                }
                resExp.send(response)
            } else {
                resExp.send({ paintingsIds: null })
            }
        }
    })

})

app.get('/paintingDisplay', (req, resExp) => {

    const query = {
        name: 'get-painting-data',
        text: 'SELECT name, author_name, year, img_id, genre FROM paintings WHERE id = $1;',
        values: [req.query.id]
    }

    pool.query(query, (err, res) => {
        if (err) {
            console.log(err)
        } else if (!res.rows[0]) {
            console.log("no data")
            resExp.send(null)
        } else {
            console.log(res.rows)
            const imgId = res.rows[0].img_id
            const response = {
                name: res.rows[0].name,
                year: res.rows[0].year,
                author_name: res.rows[0].author_name,
                genre: res.rows[0].genre,
                file: `https://react-paint-library-backend.herokuapp.com/paintings/static/picture-${imgId}.jpg`
                
            }
            resExp.send(response)
        }
    })
})

app.put('/editPainting', (req, resExp) => {
    
    const query = {
        name: 'edit-paint-data',
        text: 'UPDATE paintings SET name = $1, author_name = $2, year = $3, genre = $4 WHERE id = $5',
        values: [req.body.name, req.body.author, req.body.year, req.body.genre, req.body.id],
    }

    pool.query(query, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            resExp.send("success")
        }
    })

})

app.delete('/paintingDelete', (req, resExp) => {

    console.log(req.body.id)

    const query = {
        name: 'delete-painting',
        text: 'DELETE FROM paintings WHERE id = $1',
        values: [req.body.id]
    }

    pool.query(query, (err, res) => {
        if(err){
            console.log(err)
        }
    })
})

app.listen(process.env.PORT || 5504)