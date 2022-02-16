import { Row, Col, Input, Button, message, Progress, Table } from 'antd'
import React, { ChangeEvent, useEffect, useState } from 'react'
import {request} from './utils'
const DEFAULT_SIZE = 1024 * 1024 * 100 
interface Part {
  chunk:Blob
  size:number
  filename?:string
  chunk_name?:string
  loaded?:number
  percent?:number
  xhr?:XMLHttpRequest
}
interface Upload {
  filename:string
  size:number
}
enum UploadStatus{
  INIT,
  PAUSE,
  UPLOADING
}      
function Upload() {
  let [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadStatus.INIT)
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
  function createRequests(partList: Part[], uploadList: Upload[], filename:string) {

    return  partList.filter(
      (part:Part) => {
        let uploadFile = uploadList.find(item => item.filename === part.chunk_name)
        if (!uploadFile) {
          part.loaded = 0 //已经上传的字节数0
          part.percent = 0//已经上传的百分比就是0 分片的上传
          return true
        }
        if (uploadFile.size < part.size) {
          part.loaded = uploadFile.size
          part.percent = Number((part.loaded / part.size * 100).toFixed(2)); //已经上传的百分比
          return true
        }
        return false
      }
    ).map((part:Part) => request({
      url:`/upload/${part.filename}/${part.chunk_name}/${part.loaded}`,
      method:'POST',
      headers:{'Content-Type':'application/octet-stream'},
      data:part.chunk.slice(part.loaded),
      setXhr: (xhr: XMLHttpRequest) => part.xhr = xhr,
      onProgress: (event: ProgressEvent) => { 
          part.percent = Number(((part.loaded! + event.loaded )/ part.chunk.size * 100).toFixed(2));
          setPartList([...partList]);
      }
    }))
  }
  async function verify(filename: string):Promise<any> {
    return await request({
      url: `/verify/${filename}`
    })
  }
  let totalPercent = partList.length > 0 ? Number((partList.reduce((acc:number, curr:Part) => acc + curr.percent!, 0) / (partList.length*100)).toFixed(2)) * 100:0
  async function uploadParts(partList:Part[], filename:string) {
    let {needUpload, uploadList} = await verify(filename)
    if (!needUpload) {
      partList.forEach((part:Part) => {
        part.percent = 100
      })
      setPartList([...partList]);
     return  message.success('秒传成功')
    }
    let requests = createRequests(partList, uploadList, filename)
    await Promise.all(requests)
    await request({url:`/merge/${filename}`})

    message.success('上传成功')

  }
  async function handleUpload() {
    setHashPercent(0)
    if (!currentFile) {
      return message.error('尚未选择文件')
    }

    if (!allowUpload(currentFile)) {
      return message.error('不支持此类文件的上传')
    }
    setUploadStatus(UploadStatus.UPLOADING)
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
    await uploadParts(partList, filename)
    // reset()
  }
  function handlePause() {
    setUploadStatus(UploadStatus.PAUSE)
    partList.forEach((part:Part) => part.xhr && part.xhr.abort())
  }

  async function handleResume() {
    setUploadStatus(UploadStatus.UPLOADING)
    await uploadParts(partList, filename)
  }
  const columns = [
    {
      title:'切片名称',
      dataIndex:'chunk_name',
      key:'chunk_name',
      width:'20%'
    },
    {
      title:'进度',
      dataIndex:'percent',
      key:'percent',
      width:'80%',
      render:(value:number) => {
        return <Progress strokeColor={{'0%': '#108ee9','100%': '#87d068',}} percent={value} />
      }
    }
  ]
  
  let uploadProgress = uploadStatus!==UploadStatus.INIT? (
    <>
    <Row>
        <Col span={4}>
          正在解析文件:
        </Col>
        <Col span={20}>
          <Progress strokeColor={{'0%': '#108ee9','100%': '#87d068',}} percent={hashPercent}></Progress>
        </Col>
        <Col span={4}>
          总进度:
        </Col>
        <Col span={20}>
          <Progress strokeColor={{'0%': '#108ee9','100%': '#87d068',}} percent={totalPercent}></Progress>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={partList}
        rowKey={row => row.chunk_name!}
      />
    </>
  ):null
  function reset() {
    setUploadStatus(UploadStatus.INIT)
    setHashPercent(0)
    setPartList([])
    setFilename('')
  }
  return(
    <>
      <Row>
        <Col span={12}>
          <Input type='file' style={{width:300}} onChange={handleChange}></Input>
          {
            uploadStatus === UploadStatus.INIT &&  <Button type="primary" onClick={handleUpload} style={{marginLeft: 10}}>上传</Button>
          }
          {
            uploadStatus === UploadStatus.UPLOADING && <Button type="primary" onClick={handlePause} style={{marginLeft: 10}}>暂停</Button>
          }
          {
            uploadStatus === UploadStatus.PAUSE && <Button type="primary" onClick={handleResume}style={{marginLeft: 10}}>恢复</Button>
          }
        </Col>
        <Col span={12}>
          {objectURL && <img alt='图片' src={objectURL} style={{width:100}} />}
        </Col>
      </Row>
      
      {uploadProgress}
    </>
  )
}

function createChunks(file: File):Part[] {
  let current = 0
  let partList:Part[] = []
  while(current < file.size){
    let chunk = file.slice(current, current + DEFAULT_SIZE) 
    partList.push({chunk, size: chunk.size, loaded:0, percent:0})
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