import express, {Request, Response, NextFunction} from 'express'
import logger from 'morgan'
import { StatusCodes } from 'http-status-codes'
import createError from 'http-errors'
import cors from 'cors'
import path  from 'path'
import fs from 'fs-extra'
import { mergeChunks, TEMP_DIR, PUBLIC_DIR} from './utils'
let app = express()
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(express.static(path.resolve(__dirname, 'public')))

app.get('/verify/:filename', async (req:Request, res:Response) => {
    let {filename} = req.params

    //验证的时候如果存在这个文件的话，直接return
    let filePath = path.resolve(PUBLIC_DIR, filename)
    let existFile = await fs.pathExists(filePath)
    if (existFile) {
        return{
            success:true,
            needUpload: false
        }
    }

    let tempDir = path.resolve(TEMP_DIR, filename)
    let exist = await fs.pathExists(tempDir)
    let uploadList:any[] = []
    if (exist) {
        uploadList = await fs.readdir(tempDir)
        uploadList = await Promise.all(uploadList.map(async (filename:string) => {
            let stat = await fs.stat(path.resolve(tempDir, filename))
            return {
                filename,
                size: stat.size
            }
        }))
    }
    res.json({
        success:true,
        needUpload:true,
        uploadList //已经上传的文件例表
    })
})

app.post('/upload/:filename/:chunk_name/:start', async function (req:Request, res:Response, _next:NextFunction) {
    let {filename, chunk_name} = req.params
    let start:number = Number(req.params.start)
    let chunk_dir = path.resolve(TEMP_DIR, filename)
    let exist = await fs.pathExists(chunk_dir)
    if (!exist) {
        await fs.mkdirs(chunk_dir)
    }
    let chunkFilePath = path.resolve(chunk_dir, chunk_name)
    //falgs append 后面断点续传
    let ws = fs.createWriteStream(chunkFilePath, {start, flags: 'a'})
    req.on('end', () => {
        ws.close()
        res.json({success:true})
    })
    req.on('error',() => {
        ws.close()
    })
    req.on('close',() => {
        ws.close()
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