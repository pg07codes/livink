
let fetch = require('node-fetch');
let cheerio = require('cheerio');
let url = require('url');
/**
 * function isUrl() code sourced from https://github.com/segmentio/is-url
 */

let protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
let localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/
let nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

function isUrl(string) {
    if (typeof string !== 'string') {
        return false;
    }

    let match = string.match(protocolAndDomainRE);
    if (!match) {
        return false;
    }

    let everythingAfterProtocol = match[1];
    if (!everythingAfterProtocol) {
        return false;
    }

    if (localhostDomainRE.test(everythingAfterProtocol)) {
        return false; // currently my library does not support localhost scanning
    }

    if (nonLocalhostDomainRE.test(everythingAfterProtocol)) {
        return true; // only non localhost urls are valid input for library
    }

    return false;
}

/*
 * For devs 
 * url - refers to the URL from which <a/> tags are to be extracted 
 * links - refers to the href values extracted from page pointed by 'url'
 */

function between(x, min, max) {
    return x >= min && x <= max;
}


async function linkFilterByStatus(linksArray, status) {

    if (!Array.isArray(linksArray)) throw new Error('internal:expected input as array');

    let filteredLinks = [];

    try {
        let results = await Promise.allSettled(linksArray.map(linkObj => {
            if (!linkObj.hasOwnProperty('errorFetching'))
                return fetch(linkObj.link, { method: 'HEAD' })
            else
                return new Promise((_, rej) => { rej() })
        }));

        linksArray.forEach((linkObj, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (status === 'ALL' || status.includes(returnedStatus))
                    filteredLinks.push({ ...linkObj, returnedStatus });
            }

        })

        return filteredLinks;
    }
    catch (err) {
        console.log('------------no idea-----------', err);
    }
}

async function linkFilterByRange(linksArray, status) {

    if (!Array.isArray(linksArray)) throw new Error('internal:expected input as array');
    if (!Array.isArray(status)) throw new Error('internal:expected status as array');

    let filteredLinks = [];

    try {
        let results = await Promise.allSettled(linksArray.map(linkObj => {
            if (!linkObj.hasOwnProperty('errorFetching'))
                return fetch(linkObj.link, { method: 'HEAD' })
            else
                return new Promise((_, rej) => { rej() })
        }));

        linksArray.forEach((linkObj, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (between(returnedStatus, status[0], status[1]))
                    filteredLinks.push({ ...linkObj, returnedStatus });
            }

        })

        return filteredLinks;
    }
    catch (err) {
        console.log('------------no idea-----------', err);
    }
}

function getClass(status) {
    if (between(status, 100, 199)) {
        return "info";
    } else if (between(status, 200, 299)) {
        return "success";
    } else if (between(status, 300, 399)) {
        return "redirect";
    } else if (between(status, 400, 499)) {
        return "clientErr";
    } else if (between(status, 500, 599)) {
        return "serverErr"
    } else
        return "nonStandard";
}

async function linkFilterByClass(linksArray, status) {

    if (!Array.isArray(linksArray)) throw new Error('internal:expected input as array');
    if (!Array.isArray(status)) throw new Error('internal:expected status as array');

    let filteredLinks = [];

    try {

        let results = await Promise.allSettled(linksArray.map((linkObj) => {
            if (!linkObj.hasOwnProperty('errorFetching'))
                return fetch(linkObj.link, { method: 'HEAD' })
            else
                return new Promise((_, rej) => { rej() })
        }));

        // to fix : this may result in large number of concurrent network requests.

        linksArray.forEach((linkObj, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (status.includes(getClass(returnedStatus)))
                    filteredLinks.push({ ...linkObj, returnedStatus });
            }

        })

        return filteredLinks;
    }
    catch (err) {

        console.log('------------no idea-----------', err);
    }
}

const filter = (linksArray, config) => {


    if (Object.keys(config).length === 0) {
        config.status = 'ALL'; // flag 'ALL' denotes return all links
        return linkFilterByStatus(linksArray, config.status);
    }

    if (config.hasOwnProperty('status')) {
        if (typeof config.status === 'number') {
            return linkFilterByStatus(linksArray, [config.status]);
        } else if (Array.isArray(config.status)) {

            return linkFilterByStatus(linksArray, config.status);

        } else {
            throw new Error('invalid status value: neither number nor array');
        }
    } else if (config.hasOwnProperty('statusRange')) {
        if (Array.isArray(config.statusRange) && config.statusRange.length == 2
            && (config.statusRange[0] < config.statusRange[1])) {

            return linkFilterByRange(linksArray, config.statusRange)
        } else {
            throw new Error('invalid statusRange value: should be ascending two item array');
        }
    } else if (config.hasOwnProperty('statusClass')) {
        if (typeof config.statusClass === 'string') {

            return linkFilterByClass(linksArray, [config.statusClass]);
        } else if (Array.isArray(config.statusClass)) {

            return linkFilterByClass(linksArray, config.statusClass);

        } else {
            throw new Error('invalid statusClass value: neither string nor array');
        }
    } else {
        throw new Error('invalid config object property')
    }


}

const fetchLinks = async (URL, depth) => {

    let links = [];
    let httpProtocolMatcher = /^(https?:\/\/)/;

    try {
        if (!URL.match(httpProtocolMatcher)) throw ({ e: 'url could not be fetched', URL })
        const body = await fetch(URL).then(res => res.text()).catch(e => { throw ({ e, URL }) });
        let $ = cheerio.load(body);
        $('a').each((_, x) => {
            links.push($(x).attr('href'))
        })
    } catch (err) {
        links.push("~" + err.URL) // to identify this URL fetching failed
    }

    links = links.reduce((acc, link) => {
        if (link === undefined) return acc; // this too returned sometimes.
        if (link[0] === "~") {
            acc.push({ link: URL, errorFetching: true });
        }
        else
            acc.push({ link: url.resolve(URL, link), linkFoundOn: URL });

        return acc;
    }, []);

    if (depth == 0) return links;


    let recLinkResults = links;
    let tmp = [];
    for (let i = 0; i < links.length; i++) {
        if (!links[i].hasOwnProperty("errorFetching")) {
            tmp = await fetchLinks(links[i].link, depth - 1);
        } else {
            tmp = [];
        }
        recLinkResults = recLinkResults.concat(tmp);
    }

    return recLinkResults;

}


const livink = async (string, config = {}) => {

    if (typeof string !== 'string') throw new Error('URL must be in string format');
    if (!isUrl(string)) throw new Error('invalid URL');
    const URL = string;  // validation of string as url completed

    if (typeof config !== 'object') {
        throw new Error('config must be an object');
    }

    if (Object.keys(config).length === 0) {
        config.depth = 0;
    }

    if (Object.keys(config).length > 1 && !config.hasOwnProperty('depth')) {
        throw new Error('invalid config object passed');
    }

    if (typeof config.depth !== 'number' || (config.depth < 0 || config.depth > 2)) {
        throw new Error('Depth should be a number between 0 and 2(included)');
    }

    return fetchLinks(URL, config.depth);

}

module.exports = {
    livink,
    filter
}
