import { Row, Col, Input } from 'antd'
import React, { ChangeEvent, useEffect, useState } from 'react'


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

  return(
    <Row>
      <Col span={12}>
        <Input type='file' style={{width:300}} onChange={handleChange}></Input>
      </Col>
      <Col span={12}>
        {objectURL && <img src={objectURL} style={{width:100}} />}
      </Col>
    </Row>
  )
}


export default Upload