
let fetch = require('node-fetch');
let cheerio = require('cheerio');
let url = require('url');
let isUrl = require('./isUrl');

function sanitizer(links, URL) {

    if (!Array.isArray(links)) throw new Error('expected array as input');

    const rootRelativeUrl = new RegExp("^\/.*") // eg. '/images/cat.png'
    const samePageHashUrl = new RegExp("^#.*")  // eg. '#footer-image'
    const sameProtocolUrl = new RegExp("^\/\/.*")  // eg. '//my-domain.com/images/cat.png'

    // these url formats not currently supported (support them + base tags - feature)
    // const relativeUrl = new RegExp("^\w.*")  // eg. 'images/cat.png' 
    // const relativeDotUrl = new RegExp("^\.\/.*")  // eg. './images/cat.png'

    return links.reduce((acc, curr) => {

        if (curr === undefined) return acc; // yeah this also is returned sometimes.
        if (curr.trim().length === 0) return acc; // empty string in page (may be pointing to root page)

        if (isUrl(curr))
            acc.push(curr);
        else if (rootRelativeUrl.test(curr))
            acc.push(`${URL.protocol}//${URL.hostname}${curr}`);
        else if (samePageHashUrl.test(curr))
            acc.push(`${URL.href}${curr}`);
        else if (sameProtocolUrl.test(curr))
            acc.push(`${URL.protocol}${curr}`);
        else
            acc.push(`not-supported :${curr}`);

        return acc;

    }, []);


}

async function linkFilter(links, STATUS) {

    if (!Array.isArray(links)) throw new Error('expected array as input');
    if (typeof STATUS !== 'number') throw new Error('expected status as number');

    let filteredLinks = [];

    // using this to remove unsupported links for now
    const notSupported = new RegExp("^not-supported :.*")
    links = links.filter(link =>{
        if(notSupported.test(link)){
            console.log(link);
            return false;
        }else{
            return true;
        }
    })
    // above code is only for removing unsupported links for now.


    try {
        let results = await Promise.allSettled(links.map(link => fetch(link, { method: 'HEAD' })));
        links.forEach((link, idx) => {
            if (results[idx].status === 'fulfilled') {
                let status = results[idx].value.status;
                if (STATUS === -1 || status === STATUS)
                    filteredLinks.push({ link, status });
            } else {
                filteredLinks.push({ link, status: `erred` });
            }
        })

        return filteredLinks;
    }
    catch (err) {
        throw new Error(err);
    }

}

/*
 * For devs 
 * url - refers to the URL from which <a/> tags are to be extracted 
 * links - refers to the href values extracted from page pointed by 'url'
 */

async function scan(string, config) {

    let STATUS;

    if (typeof string !== 'string') throw new Error('URL must be in string format');
    if (!isUrl(string)) throw new Error('invalid URL');
    if (typeof config !== 'object') {
        if (typeof config !== 'undefined') {
            throw new Error('config must be an object');
        } else {
            STATUS = -1; // -1 indicates "return links with any status" 
        }
    } else {
        if (typeof config.status !== 'number' || config.status === -1) { // as -1 is reserved status 
            throw new Error('status value provided is invalid');
        } else {
            STATUS = config.status;
        }
    }

    const URL = url.parse(string);
    let links = [];

    try {
        const body = await fetch(URL).then(res => res.text())
        let $ = cheerio.load(body);
        $('a').each((_, x) => {
            links.push($(x).attr('href'))
        })
    } catch (err) {
        throw new Error('fetching of provided url failed. check your internet')
    }


    links = sanitizer(links, URL);

    return linkFilter(links, STATUS)


}

module.exports = {
    scan
};


