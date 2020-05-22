
<p align="center">
<img src="https://user-images.githubusercontent.com/34238240/82594261-6e50bd80-9bc1-11ea-9176-9b9b99be48ed.png" alt="livinkLogo">
</p>

# livink

> Get all links from a webpage filtered by status codes, status classes and many more. Livink makes all requests in parallel making it work extremely fast.

  
## Install
```
$ npm install livink
```
- note that it currently works only node version `>=12.9.0` as it uses `Promises.allSettled()`.

## Usage

```js
const l = require('livink');

// use without any configuration like this

l("https://any-valid-url-here.com").then(res=>{
console.log(res);
});
/* sample output of all links (img,href,mailto,etc)
[
  { link: 'https://xyz.com/domains/example', returnedStatus: 200 },
  { link: 'https://xyz.com/example', returnedStatus: 404 },
  { link: 'https://xyz.com/some-page#ok', returnedStatus: 200 },
  { link: 'https://hello.com/new-page/id', returnedStatus: 500 },
  { link: 'https://xyz.com/', returnedStatus: 400 },
  { link: 'https://abc.com/do/it/page', returnedStatus: 405 },
  { link: 'https://abc.com/domains/example', returnedStatus: 200 },
  { link: 'https://xyz.com/domains/id?q=true', returnedStatus: 301 },
  { link: 'https://pqr.com/example', returnedStatus: 203 },
  { link: 'https://pqr.co.in/this?query=ok', returnedStatus: 999 }
]
*/

```
### To filter out results based on status codes, you can pass a configuration object which is structured as
```
{
status: can be a number(status code) or array of status codes,
statusRange: must be an two item array[min-status-code,max-status-code]
statusClass: can be a string(status class) or array of status class
}
```
- note 1: string/string array value of `statusClass` must be from these strings-  `'info'`, `'success'`, `'redirect'`, `'clientErr'`, `'serverErr'`, `'nonStandard'` only. Visit [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) to see why they are named like this.
- note 2: only one of the three keys `status`,`statusRange`,`statusClass` must be passed in configuration object as of now. Make an issue if you need to use them simultaneously.

```js

// use with config object like this

l("https://any-valid-url-here.com",{
	status:404    // filters links with 404 status
}).then(res=>{
console.log(res);
})
/* sample output
[
  { link: 'https://xyz.com/example', returnedStatus: 404 }
]
*/

// or like this

l("https://any-valid-url-here.com",{
	status:[200,404,500]   // filters links with status codes in array
}).then(res=>{
console.log(res);
})
/* sample output
[
  { link: 'https://xyz.com/domains/example', returnedStatus: 200 },
  { link: 'https://xyz.com/example', returnedStatus: 404 },
  { link: 'https://xyz.com/some-page#ok', returnedStatus: 200 },
  { link: 'https://hello.com/new-page/id', returnedStatus: 500 },
  { link: 'https://xyz.com/', returnedStatus: 400 },
  { link: 'https://abc.com/domains/example', returnedStatus: 200 },
]
*/
```
```js
// or use with statusRange 

l("https://any-valid-url-here.com",{
	statusRange:[203,410]   // filters links between 203 and 410(including both)
}).then(res=>{
console.log(res);
})
/* sample output
[
  { link: 'https://xyz.com/example', returnedStatus: 404 },
  { link: 'https://hello.com/new-page/id', returnedStatus: 500 },
  { link: 'https://abc.com/do/it/page', returnedStatus: 405 },
  { link: 'https://xyz.com/domains/id?q=true', returnedStatus: 301 },
  { link: 'https://pqr.com/example', returnedStatus: 203 }
]
*/
```

```js

// or use with statusClass

l("https://any-valid-url-here.com",{
	{statusClass:['clientErr','nonStandard']}  // only single string can also be used
}).then(res=>{ 
console.log(res);
})
/* sample output of clientErrors and nonStandard status codes
[
  { link: 'https://xyz.com/example', returnedStatus: 404 },
  { link: 'https://xyz.com/', returnedStatus: 400 },
  { link: 'https://abc.com/do/it/page', returnedStatus: 405 }
  { link: 'https://pqr.co.in/this?query=ok', returnedStatus: 999 }
]
*/

```

**Finding this package useful, star this repo.**

**Found a bug or want a feature, make an issue for it.**




