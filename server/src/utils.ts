import path from 'path'
import fs, {WriteStream} from 'fs-extra'
import { stringify } from 'querystring'

const DEFAULT_SIZE = 1024 * 10
export const PUBLIC_DIR = path.resolve(__dirname, "public")
export const TEMP_DIR = path.resolve(__dirname, 'temp')
export const splitChunks = async (filename:string, size:number = DEFAULT_SIZE) => {
  let filePath = path.resolve(__dirname, filename) //要分割的文件的绝对路径
  const chunksDir = path.resolve(TEMP_DIR, filename)//以文件名命名的临时目录，存放分割后的文件
  await fs.mkdirp(chunksDir) //递归创建目录
  let content = await fs.readFile(filePath) //Buffer 其实是一个字节数组 1个字节是8bit 位
  let i = 0, current = 0, length = content.length
  while (current < length) {
    await fs.writeFile(path.resolve(chunksDir, filename + '-' + i), content.slice(current, current + size))
    i++
    current += size
  }
}

const pipeStream = (filePath:string, ws: WriteStream) => new Promise(function(resolve:Function, reject:Function){
  let rs = fs.createReadStream(filePath)
  rs.on('end', async () => {
    await fs.unlink(filePath)
    resolve()
  })
  rs.pipe(ws)
})



/**
 * 
 * @param filename 
 * @param size 
 * 1.读取temp目录下vue.jpg目录里所有文件，按照尾部的索引号
 * 2.把他们累加在一起，另外一旦加过了要把temp目录里的文件删除
 * 3.为了提高性能，尽量用流来实现 不要readFile writeFile
 */


export const mergeChunks = async (filename:string, size:number = DEFAULT_SIZE) => {
  const filePath = path.resolve(PUBLIC_DIR, filename)
  const chunksDir = path.resolve(TEMP_DIR, filename)
  const chunkFiles = await fs.readdir(chunksDir) 
  //按照文件名字升序排列
  chunkFiles.sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]) )  
  await Promise.all(chunkFiles.map((chunkFile:string, index:number) => pipeStream(
    path.resolve(chunksDir, chunkFile),
    fs.createWriteStream(filePath,{
      start: index * size
    })
  )))
  await fs.rmdir(chunksDir)
}
// splitChunks('koa.jpg')
mergeChunks('koa.jpg')