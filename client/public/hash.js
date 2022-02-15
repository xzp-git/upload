/* eslint-disable no-restricted-globals */
self.importScripts('https://cdn.bootcss.com/spark-md5/3.0.0/spark-md5.js')

self.onmessage = async (event) => {
  let {partList} = event.data
  const spark = new self.SparkMD5.ArrayBuffer()
  let percent = 0 //总体计算hash的百分比
  let perSize = 100 / partList.length //每计算完一个part相当于完成了百分之几 
  let buffers = await Promise.all(partList.map(({chunk}) => new Promise(function (resolve) {
    const reader = new FileReader()
    reader.readAsArrayBuffer(chunk)
    reader.onload = function (event) {
      percent += perSize
      self.postMessage({percent:Number(percent.toFixed(2))})
      resolve(event.target.result)
    }
  })))
  buffers.forEach(buffer => spark.append(buffer))
  self.postMessage({percent:100, hash: spark.end()})
  self.close()
}


