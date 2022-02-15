import express, {Request, Response, NextFunction} from 'express'
import logger from 'morgan'
import { StatusCodes } from 'http-status-codes'
import createError from 'http-errors'
import cors from 'cors'
import path  from 'path'
import fs from 'fs-extra'
import { mergeChunks, TEMP_DIR} from './utils'
let app = express()
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(express.static(path.resolve(__dirname, 'public')))


app.post('/upload/:filename/:chunk_name', async function (req:Request, res:Response, _next:NextFunction) {
    let {filename, chunk_name} = req.params
    let chunk_dir = path.resolve(TEMP_DIR, filename)
    let exist = await fs.pathExists(chunk_dir)
    if (!exist) {
        await fs.mkdirs(chunk_dir)
    }
    let chunkFilePath = path.resolve(chunk_dir, chunk_name)
    //falgs append 后面断点续传
    let ws = fs.createWriteStream(chunkFilePath, {start:0, flags: 'a'})
    req.on('end', () => {
        ws.close()
        res.json({success:true})
    })
    req.pipe(ws)
    
})
app.get('/merge/:filename', async function (req:Request, res:Response, _next:NextFunction) {
    let {filename} = req.params
    await mergeChunks(filename)
    res.json({success:true})
})
// app.post('/upload', async function (req:Request, res:Response, next:NextFunction) {
//     let form = new multiparty.Form()
    
//     form.parse(req, async (err:any, fields, files) => {
//         if (err) {
//             return next(err)
//         }
//         let filename = fields.filename[0]
//         let chunk = files.chunk[0]
//         await fs.move(chunk.path, path.resolve(PUBLIC_DIR, filename), {overwrite: true})
//         console.log('fields', fields);
//         console.log('files', files);
//         res.json({
//             success:true
//         })        
//     })
// })

app.get('/get', function (_req:Request, res:Response) {
   console.log("jinlai");
   
    res.json({
        success:true,
        data:11233
    })
})
app.use(function (_req, _res, next) {
    next(createError(404))
})

app.use(function (error:any, _req:Request, res:Response, _next:NextFunction) {
    res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
    res.json({
        success:false,
        error
    })
})


export default app