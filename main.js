/*created by Pranav Gupta (pg07codes) on 25-10-2018 */

let bhttp = require("bhttp")
let cheerio=require("cheerio")
let url=require("url")
let get_urls=require("get-urls")

const URL=process.argv[2]
const parsedURL=url.parse(URL)


function getPageData(url,sanitizer){
    let urlArray=[]
    bhttp.get(url,{},function (err,res,body){
        let $= cheerio.load(res.body.toString())
        $('a').each((i,x)=>{
            urlArray.push($(x).attr('href'))
        })
        console.log(sanitizer(urlArray))
    })
}


let relativeUrlRegex=new RegExp("^\/.*")
let stringPathUrlRegex= new RegExp("^\S*")
let samePageHashUrl=new RegExp("^#.*")

function sanitizeUrls(arr){             // ask if it can be optimization

    // type 1 sanitization
    arr=arr.map(url=>{
        if(url===undefined){
            return -1
        }
        else if(get_urls(url).values().next().value===undefined){

            // type 2 sanitization
            if(relativeUrlRegex.test(url)){
                return (parsedURL.protocol+"//"+parsedURL.hostname+url)
            }

            // type 3 sanitization
            else if(stringPathUrlRegex.test(url)){
                return (parsedURL.protocol+"//"+parsedURL.hostname+'/'+url)
            }

            // type 4 sanitization
            else if(samePageHashUrl.test(url)) {
                return (parsedURL.href+url)
            }

            else
                return "unknown type" // not built as of now to handle this case...

        }
        else
            return get_urls(url).values().next().value
    })
    return arr
}

getPageData(URL, sanitizeUrls)
