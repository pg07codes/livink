
let fetch = require('node-fetch');
let cheerio = require('cheerio');
let url = require('url');
let isUrl = require('./isUrl');

function sanitizer(urlArray, parsedURL) {

    if (!Array.isArray(urlArray)) throw new Error('expected array as input');

    const relativeUrl = new RegExp("^\/.*")
    const samePageHashUrl = new RegExp("^#.*")

    return urlArray.reduce((acc, curr) => {
        if (curr === undefined) return acc;
        if (curr.trim().length === 0) return acc;

        if (isUrl(curr))
            acc.push(curr);
        else if (relativeUrl.test(curr))
            acc.push(`${parsedURL.protocol}//${parsedURL.hostname}${curr}`);
        else if (samePageHashUrl.test(curr))
            acc.push(`${parsedURL.href}${curr}`);
        else
            acc.push(`${parsedURL.href}/${curr}`);  // to match urls like href='user/userid'

        return acc;

    }, []);


}

function checkAlive(urlArray) {
    if (!Array.isArray(urlArray)) throw new Error('expected array as input');

    urlArray.forEach(link => {
        if (isUrl(link)) {
            fetch(link, { method: 'HEAD' }).then(head => {
                if (head.status !== 200)
                    console.log(`${link}<-->${head.status}`);
            }).catch(err => console.log(err))
        }else{
            console.log('unexpected error with: ',link);
        }
    })
}

function scan(URL) {

    if (typeof URL !== 'string') throw new Error('URL must be a string');

    if (isUrl(URL) === false) throw new Error('invalid URL passed');

    const parsedURL = url.parse(URL);

    let urlArray = [];

    fetch(URL)
        .then(res => res.text())
        .then(body => {
            let $ = cheerio.load(body);
            $('a').each((_, x) => {
                urlArray.push($(x).attr('href'))
            })
            return urlArray;
        }).then(urlArray => {
            urlArray = sanitizer(urlArray, parsedURL);
            checkAlive(urlArray);
        }).catch(err => console.error(err));

}

module.exports = {
    scan
};


