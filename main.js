/*created by Pranav Gupta (pg07codes) on 25-10-2018 */

let request = require('request')
let cheerio=require("cheerio")
let url=require("url")
let sanitizeUrl=require("get-urls")

const URL=process.argv[2]
const parsedURL=url.parse(URL)


function getPageData(url){
    let urlArray=[]
    request(url,function (err,res,body){
        let $= cheerio.load(body)
        $('a').each((i,x)=>{
            urlArray.push($(x).attr('href'))
        })
        console.log(urlArray)
    })
}

getPageData(URL)
