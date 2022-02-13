
interface OPTIONS {
    method: string,
    url:string,
    headers?:any,
    data?: any,
    baseURL?:string
}


function request(options:OPTIONS):Promise<any> {
    let defaultOptions = {
        method: 'GET',
        baseURL: 'http://loaclhost:8443',
        headers: {}, //请求头
        data: {} //请求体
    }

    options = {...defaultOptions, ...options, headers: {...defaultOptions.headers, ...(options.headers || {})}}

    return new Promise(function (resolve:Function, reject:Function) {
        let xhr = new XMLHttpRequest()
        xhr.open(options.method, options.baseURL + options.url)

        for (const key in options.headers) {
            xhr.setRequestHeader(key, options.headers[key])
        }
        xhr.send(options.data)
        xhr.responseType='json'
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (/(2|3)\d{2}/.test('' + xhr.status) ) {
                    resolve(xhr.response)
                }else{
                    reject(xhr.response)
                }
            }
        }
    })

}


export { request }