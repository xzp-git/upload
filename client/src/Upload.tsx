import { Row, Col, Input } from 'antd'
import React, { ChangeEvent } from 'react'


function Upload() {

  function handleChange(event:ChangeEvent<HTMLInputElement>) {
    
  }

  return(
    <Row>
      <Col span={12}>
        <Input type='file' style={{width:300}} onChange={handleChange}></Input>
      </Col>
      <Col span={12}></Col>
    </Row>
  )
}


export default Upload