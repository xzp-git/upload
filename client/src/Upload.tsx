import { Row, Col, Input, Button, message } from 'antd'
import React, { ChangeEvent, useEffect, useState } from 'react'
import {request} from './utils'

function Upload() {
  let [currentFile, setCurrentFile] = useState<File>()
  let [objectURL, setObjectURL] = useState<string>('')

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

  async function handleUpload() {
    if (!currentFile) {
      return message.error('尚未选择文件')
    }

    if (!allowUpload(currentFile)) {
      return message.error('不支持此类文件的上传')
    }

    const formData = new FormData()
    formData.append('chunk', currentFile) // 添加文件。字段名chunk 
    formData.append('filename', currentFile.name)

    let results = await request({
      url:'/get',
      method:'get',
    })
    console.log(results);
    

    let result = await request({
      url:'/upload',
      method:'post',
      data: formData
    })
    console.log('result', result);
    message.success('上传成功')
  }

  return(
    <Row>
      <Col span={12}>
        <Input type='file' style={{width:300}} onChange={handleChange}></Input>
        <Button type="primary" onClick={handleUpload}>上传</Button>
      </Col>
      <Col span={12}>
        {objectURL && <img src={objectURL} style={{width:100}} />}
      </Col>
    </Row>
  )
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