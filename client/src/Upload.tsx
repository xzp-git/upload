import { Row, Col, Input, Button, message, Progress } from 'antd'
import React, { ChangeEvent, useEffect, useState } from 'react'
import {request} from './utils'
const DEFAULT_SIZE = 1024 * 1024 * 100 
interface Part {
  chunk:Blob
  size:number
  filename?:string
  chunk_name?:string
}      
function Upload() {
  let [currentFile, setCurrentFile] = useState<File>()
  let [objectURL, setObjectURL] = useState<string>('')
  let [hashPercent, setHashPercent] = useState<number>(0)
  let [filename, setFilename] = useState<string>('')
  let [partList, setPartList] = useState<Part[]>([])



  useEffect(() => {
    if (currentFile) {
      let objectURL = window.URL.createObjectURL(currentFile)
      setObjectURL(objectURL)
      return () => window.URL.revokeObjectURL(objectURL)
    }
  }, [currentFile])
  function handleChange(event:ChangeEvent<HTMLInputElement>) {
     let file:File = event.target.files![0]
     console.log(file);
     setCurrentFile(file)
  }
  function calculateHash(partList: Part[]) {
    return new Promise(function (resolve) {
      let worker = new Worker("/hash.js")
      worker.postMessage({partList})
      worker.onmessage = function (event) {
        let {percent, hash} = event.data
        setHashPercent(percent)
        if (hash) {
          resolve(hash)
        }
      }
    })
  }
  function createRequests(partList: Part[]) {
    return partList.map((part:Part) => request({
      url:`/upload/${part.filename}/${part.chunk_name}`,
      method:'POST',
      headers:{'Content-Type':'application/octet-stream'},
      data:part.chunk,
      onProgress: (event: ProgressEvent) => { 
          part.percent = event.loaded / part.chunk.size * 100;
          setPartList([...partList]);
      }
    }))
  }
  async function upoadParts(partList:Part[], filename:string) {
    let requests = createRequests(partList)
    await Promise.all(requests)
    await request({url:`/merge/${filename}`})
  }
  async function handleUpload() {
    setHashPercent(0)
    if (!currentFile) {
      return message.error('尚未选择文件')
    }

    if (!allowUpload(currentFile)) {
      return message.error('不支持此类文件的上传')
    }

    //分片上传
    let partList: Part[] = createChunks(currentFile)
    //先计算这个对象哈希值 秒传的功能，通过webworker子进程来去计算哈希
    let fileHash = await calculateHash(partList)
    let lastDotIndex = currentFile.name.lastIndexOf('.')
    let extName = currentFile.name.slice(lastDotIndex)
    let filename = `${fileHash}${extName}` 
    setFilename(filename)
    partList.forEach((item:Part, index) => {
      item.filename = filename
      item.chunk_name = `${filename}-${index}`
    })
    setPartList(partList)
    await upoadParts(partList, filename)
    message.success('上传成功')
  }

  return(
    <Row>
      <Col span={12}>
        <Input type='file' style={{width:300}} onChange={handleChange}></Input>
        <Button type="primary" onClick={handleUpload}>上传</Button>
        <Progress strokeColor={{'0%': '#108ee9','100%': '#87d068',}} percent={hashPercent} />
      </Col>
      <Col span={12}>
        {objectURL && <img alt='图片' src={objectURL} style={{width:100}} />}
      </Col>
    </Row>
  )
}

function createChunks(file: File):Part[] {
  let current = 0
  let partList:Part[] = []
  while(current < file.size){
    let chunk = file.slice(current, current + DEFAULT_SIZE) 
    partList.push({chunk, size: chunk.size})
    current += DEFAULT_SIZE
  }
  return partList
}

function allowUpload(file: File) {
  let type = file.type

  let validFileTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4"]
  let isValidFileType = validFileTypes.includes(type)
  if (!isValidFileType) {
    message.error('不支持此类文件上传')
  }

  const isLessThan2G = file.size  < 1024 * 1024 * 1024 * 2

  if (!isLessThan2G) {
    message.error('上传的文件不能大于2G')
  }

  return isValidFileType && isLessThan2G
}
export default Upload