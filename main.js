/*created by Pranav Gupta (pg07codes) on 25-10-2018 */

let request = require('request')
let cheerio=require("cheerio")

request('https://en.wikipedia.org/wiki/Charles_Severance',(err, res, body)=> {
    let $ = cheerio.load(body)
    $('a').each((i,x)=>{
        console.log($(x).attr('href'))
    })
})