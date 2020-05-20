function fetchJSONWithRetry(input, init, retries = 10) {
    fetch(input, init)
         .then(function(response) {
             if (response.ok) {
                 console.log('doneman');
             }
             throw new Error(`new Error("HTTP status " + ${response.status}`);
         })
         .catch(e => {
             if (retries <= 0) {
                 throw new Error(`multiple tries failed`);
             }
             return fetchJSONWithRetry(input, init, retries - 1);
         });
 }
 