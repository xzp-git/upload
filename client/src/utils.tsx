
// interface OPTIONS {
//     method: string,
//     url?:string,
//     headers?:any,
//     data?: any,
//     baseURL?:string
// }


// function request(options:OPTIONS) {
//     let defaultOptions:OPTIONS = {
//         method: 'GET',
//         baseURL: 'http://loaclhost:8443',
//         headers: {}, //请求头
//         data: {} //请求体
//     }

//     options = {...defaultOptions, ...options, headers: {...defaultOptions.headers, ...(options.headers || {})}}

//     return new Promise(function (resolve:Function, reject:Function) {
//         let xhr = new XMLHttpRequest()
//         xhr.open(options.method, options.baseURL! + options.url!, true)

//         for (const key in options.headers) {
//             xhr.setRequestHeader(key, options.headers[key])
//         }
//         xhr.responseType='json'
//         xhr.onreadystatechange = function () {
//             if (xhr.readyState === 4) {
//                 if (/(2|3)\d{2}/.test('' + xhr.status) ) {
//                     resolve(xhr.response)
//                 }else{
//                     reject(xhr.response)
//                 }
//             }
//         }
//         xhr.send(options.data)

//     })

// }

function request(options: any) {
    let _default: any = {
        baseURL: 'http://localhost:8443',
        method: 'GET',
        headers: {},
        data: {}
    };
    options = { ..._default, ...options, headers: { ..._default.headers, ...(options.headers || {}) } };
    // options = {...defaultOptions, ...options, headers: {...defaultOptions.headers, ...(options.headers || {})}}
    console.log(options);

    return new Promise((resolve: Function, reject: Function) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method, options.baseURL + options.url, true);
        // Object.entries(options.headers).forEach(([key, value]) => xhr.setRequestHeader(key, value as string));
                for (const key in options.headers) {
            xhr.setRequestHeader(key, options.headers[key])
        }
        xhr.responseType = 'json';
        if (options.onProgress) {
            xhr.upload.onprogress = options.onProgress
        }
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (/(2|3)\d{2}/.test('' + xhr.status)) {
                    resolve(xhr.response);
                } else {
                    reject(xhr.response);
                }
            }
        }
        if (options.setXhr) {
            options.setXhr(xhr)
        }
        xhr.send(options.data);
    });
}


export { request }