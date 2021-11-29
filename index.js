const express = require('express')
const app = express()
const cors = require('cors')
const Pool = require('pg').Pool
const multer = require('multer')
const fs = require('fs')

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

app.post('/', upload.single('picture'), (req, resExp) => {
    
    const atributes = JSON.parse(req.body.atributes)
    const dateNowImgId = req.file.filename.substring(req.file.filename.indexOf("-") + 1, req.file.filename.lastIndexOf("."))

    const values = [atributes.name, atributes.year, atributes.author, atributes.genre, dateNowImgId]
    const updateQury = 'INSERT INTO paintings (name, year, author_name, genre, img_id) VALUES ($1, $2, $3, $4, $5);'

    pool.query(updateQury, values, (err, res) => {
        if (err) {
            console.log(err)
        }
        
        resExp.end()
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
            resExp.end()
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
            console.log(err)
            resExp.end()
        } else {
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
            resExp.end()
        } else if (!res.rows[0]) {
            console.log("no data")
            resExp.end()
        } else {
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
            resExp.end()
        } else {
            const response = {
                paintingsIds: (res.rows ? res.rows : null)
            }

            resExp.send(response)
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
            resExp.end()
        } else if (!res.rows[0]) {
            console.log("no data")
            resExp.end()
        } else {
            const imgId = res.rows[0].img_id
            const response = {
                name: res.rows[0].name,
                year: res.rows[0].year,
                author_name: res.rows[0].author_name,
                genre: res.rows[0].genre,
                file: `https://react-paint-library-backend.herokuapp.com/static/picture-${imgId}.jpg`,
                imgId: imgId
                
            }
            resExp.send(response)
        }
    })
})

app.get('/hasName', (req, resExp) => {
    const query = {
        name: 'get-name',
        text: 'SELECT id FROM paintings WHERE name = $1;',
        values:[req.query.name]
    }

    pool.query(query, (err, res) => {
        if(err){
            console.log(err)
            resExp.end()
        }else{
            const response = {
                hasName: (res.rows[0] != undefined ? true : false),
                id: (res.rows[0] != undefined ? res.rows[0].id : null)
            }
            resExp.send(response)
        }
    })
})

app.delete('/paintingDelete', (req, resExp) => {

    const query = {
        name: 'delete-painting',
        text: 'DELETE FROM paintings WHERE id = $1',
        values: [req.body.id]
    }

    const filePath = `./Paintings_img_storage/picture-${req.body.imgId}.jpg`

    fs.unlink(filePath, (err) => {
        if(err) console.log(err)
    })

    pool.query(query, (err, res) => {
        if(err) console.log(err)
    })
})

app.listen(process.env.PORT || 5504)