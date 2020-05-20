
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

        if (isUrl(curr))
            acc.push(curr);
        else if (relativeUrl.test(curr))
            acc.push(`${parsedURL.protocol}//${parsedURL.hostname}${curr}`);
        else if (samePageHashUrl.test(curr))
            acc.push(`${parsedURL.href}${curr}`);
        else
            acc.push(`unidentifiedURL:${curr}`);

        return acc;

    }, []);


}

function checkAlive(urlArray){
    if (!Array.isArray(urlArray)) throw new Error('expected array as input');
    
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

scan('https://facebook.com')