
<p align="center">
<img src="https://user-images.githubusercontent.com/34238240/82594261-6e50bd80-9bc1-11ea-9176-9b9b99be48ed.png" alt="livinkLogo">
</p>

# livink

> Get all links from a webpage and  filter them by status codes, status classes and many more. Livink makes all requests in parallel making it work extremely fast.

  
## Install
```
$ npm install livink
```
- note that it currently works only node version `>=12.9.0` as it uses `Promises.allSettled()`.

## Usage examples

```js

const {livink} = require('livink');


// use without any filter as shown below
// to find the links 
livink("https://any-valid-url-here.com").then(res=>{
console.log(res);
});
/* output of all links (img,href,mailto,etc)
[
  { link: 'https://xyz.com/domains/example', linkFoundOn:"https://any-valid-url-here.com" },
  { link: 'https://xyz.com/sampleURL',  linkFoundOn:"https://any-valid-url-here.com" },
  ...
]
*/

// or want to find the links on provided url + the links inside those links - use depth (defaults to 0 )
livink("https://any-valid-url-here.com",{depth:1}).then(res=>{
console.log(res);
});
/* output of all links (img,href,mailto,etc)
[
  { link: 'https://xyz.com/domains/example', linkFoundOn:"https://any-valid-url-here.com" },
  { link: 'https://xyz.com/sampleURL',  linkFoundOn:"https://any-valid-url-here.com" },
  ...
  { link: 'https://xyz.com/domains/ex123', linkFoundOn:"https://xyz.com/domains/example" },
  { link: 'https://xyz.com/trip-nights',  linkFoundOn:"https://xyz.com/domains/example" },
  ...
  { link: 'https://xyz.com/someSampleURL786',  linkFoundOn:"https://xyz.com/sampleURL" },
  ...


]
*/

// or want to find the links inside the links inside the URL provided - {use depth:2}
// hope the idea of depth parameter usage is clear. 

```
### Now, to filter out the results based on return status, you can use the filter function
```js

const {livink , filter} = require('livink');

livink("https://some-site.com/path",{depth:1}).then(links=>{
  console.log(links)  // these will be all the links {as shown in above examples}

  filter(links,config).then(filteredLinksByStatus=>{
    console.log(filteredLinksByStatus)  // these will be the links filtered according to the config
  })

})

```
### config object is like 

```
{
status: can be a <number>(status code) or <array> of status codes,
statusRange: must be an two item <array> like [min-status-code,max-status-code]
statusClass: can be a <string>(status class) or <array> of status class
}
```

- note 1: string/string array value of `statusClass` must be from these strings-  `'info'`, `'success'`, `'redirect'`, `'clientErr'`, `'serverErr'`, `'nonStandard'` only. Visit [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) to see why they are named like this.
- note 2: only one of the three keys `status`,`statusRange`,`statusClass` must be passed in configuration object as of current version

```js

// use with config object like this

livink("https://any-valid-url-here.com").then(links=>{

  return filter(links,{
	  status:404    // filters links with 404 status
  })

}).then(filteredLinks => console.log(filteredLinks))
/* sample output
[
  { link: 'https://xyz.com/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 404 }
]
*/

// or like this

livink("https://any-valid-url-here.com").then(links=>{

  return filter(links,{
	  status:[200,404,500]    // filters links with codes in array
  })

}).then(filteredLinks => console.log(filteredLinks))
/* sample output
[
  { link: 'https://xyz.com/domains/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 200 },
  { link: 'https://xyz.com/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 404 },
  { link: 'https://xyz.com/some-page#ok', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 200 },
  { link: 'https://hello.com/new-page/id', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 500 },
  { link: 'https://xyz.com/', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 400 },
  { link: 'https://abc.com/domains/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 200 }
]
*/
```
```js
// or use with statusRange 

livink("https://any-valid-url-here.com").then(links=>{

  return filter(links,{
	  statusRange:[100,500]    // filters links with status in range (including both)
  })

}).then(filteredLinks => console.log(filteredLinks))
/* sample output
[
  { link: 'https://xyz.com/domains/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 203 },
  { link: 'https://xyz.com/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 404 },
  { link: 'https://xyz.com/some-page#ok', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 200 },
  { link: 'https://hello.com/new-page/id', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 500 },
  { link: 'https://xyz.com/', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 405 },
  { link: 'https://abc.com/domains/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 200 }
]
*/
```

```js

// or use with statusClass

livink("https://any-valid-url-here.com").then(links=>{

  return filter(links,{
	  statusClass:['clientErr','nonStandard']    // can pass a single string as well
  })

}).then(filteredLinks => console.log(filteredLinks))
/* sample output of clientErrors and nonStandard status codes
[
  { link: 'https://xyz.com/example', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 404 },
  { link: 'https://xyz.com/', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 400 },
  { link: 'https://abc.com/do/it/page', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 405 }
  { link: 'https://pqr.co.in/this?query=ok', linkFoundOn:"https://any-valid-url-here.com", returnedStatus: 999 }
]
*/

```

- **MIT LICENSE :copyright: Pranav Gupta**

- **Finding this package useful, star this repo.**

- **Found a bug or want a feature, make an issue for it.**