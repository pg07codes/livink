
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


async function linkFilterByStatus(links, status) {

    if (!Array.isArray(links)) throw new Error('internal:expected input as array');

    let filteredLinks = [];

    try {
        let results = await Promise.allSettled(links.map(link => fetch(link, { method: 'HEAD' })));

        links.forEach((link, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (status === 'ALL' || status.includes(returnedStatus))
                    filteredLinks.push({ link, returnedStatus });
            } else {
                filteredLinks.push({ link, status: `fetching error ` });
            }

        })

        return filteredLinks;
    }
    catch (err) {
        throw new Error(err);
    }
}

async function linkFilterByRange(links, status) {

    if (!Array.isArray(links)) throw new Error('internal:expected input as array');
    if (!Array.isArray(status)) throw new Error('internal:expected status as array');

    let filteredLinks = [];

    try {
        let results = await Promise.allSettled(links.map(link => fetch(link, { method: 'HEAD' })));

        links.forEach((link, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (between(returnedStatus, status[0], status[1]))
                    filteredLinks.push({ link, returnedStatus });
            } else {
                filteredLinks.push({ link, status: `fetching error ` });
            }

        })

        return filteredLinks;
    }
    catch (err) {
        throw new Error(err);
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
        return "__invalid";
}

async function linkFilterByClass(links, status) {

    if (!Array.isArray(links)) throw new Error('internal:expected input as array');
    if (!Array.isArray(status)) throw new Error('internal:expected status as array');

    let filteredLinks = [];

    try {
        let results = await Promise.allSettled(links.map(link => fetch(link, { method: 'HEAD' })));

        links.forEach((link, idx) => {

            if (results[idx].status === 'fulfilled') {
                let returnedStatus = results[idx].value.status;
                if (status.includes(getClass(returnedStatus)))
                    filteredLinks.push({ link, returnedStatus });
            } else {
                filteredLinks.push({ link, status: `fetching error ` });
            }

        })

        return filteredLinks;
    }
    catch (err) {
        throw new Error(err);
    }
}

module.exports = async function livink(string, config = {}) {

    if (typeof string !== 'string') throw new Error('URL must be in string format');
    if (!isUrl(string)) throw new Error('invalid URL');
    const URL = string;  // validation of string as url completed

    if (typeof config !== 'object') {
        throw new Error('config must be an object');
    }
    if (Object.keys(config).length > 1) {
        throw new Error('invalid config object passed');
    }


    // improper placement - optimize it ...no point of fetching if it has to err later
    // ____________________
    let links = [];
    try {
        const body = await fetch(URL).then(res => res.text())
        let $ = cheerio.load(body);
        $('a').each((_, x) => {
            links.push($(x).attr('href'))
        })
    } catch (err) {
        throw new Error('fetching of provided url failed. check your internet', err)
    }

    links = links.reduce((acc, link) => {
        if (link === undefined) return acc; // yeah this also is returned sometimes.
        acc.push(url.resolve(URL, link))
        return acc;
    }, []);
    // ^^^^^^^^^^^^^^^
    // improper placement - optimize it ...no point of fetching if it has to err later


    if (Object.keys(config).length === 0) {
        config.status = 'ALL'; // flag 'ALL' denotes return all links
        return linkFilterByStatus(links, config.status);
    }

    if (config.hasOwnProperty('status')) {
        if (typeof config.status === 'number') {
            return linkFilterByStatus(links, [config.status]);
        } else if (Array.isArray(config.status)) {
            return linkFilterByStatus(links, config.status);

        } else {
            throw new Error('invalid status value: neither number nor array');
        }
    } else if (config.hasOwnProperty('statusRange')) {
        if (Array.isArray(config.statusRange) && config.statusRange.length == 2
            && (config.statusRange[0] < config.statusRange[1])) {
            return linkFilterByRange(links, config.statusRange)
        } else {
            throw new Error('invalid statusRange value: should be ascending two item array');
        }
    } else if (config.hasOwnProperty('statusClass')) {
        if (typeof config.statusClass === 'string') {
            return linkFilterByClass(links, [config.statusClass]);
        } else if (Array.isArray(config.statusClass)) {
            return linkFilterByClass(links, [config.statusClass]);

        } else {
            throw new Error('invalid statusClass value: neither string nor array');
        }
    } else {
        throw new Error('invalid config object property')
    }


}
