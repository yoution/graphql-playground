const setRequestHooks = () => {
  return `
    !function() {
      let interceptors = [];
      function interceptor(fetch, ...args) {
        const reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);
        let promise = Promise.resolve(args);

        // Register request interceptors
        interceptors.forEach(({ request, requestError }) => {
          if (request || requestError) {
            promise = promise.then(args => request(...args), requestError);
          }
        });

        // Register fetch call
        promise = promise.then(args => fetch(...args));

        // Register response interceptors
        reversedInterceptors.forEach(({ response, responseError }) => {
          if (response || responseError) {
            promise = promise.then(response, responseError);
          }
        });
        return promise;
      }

      window.fetch = (function (fetch) {
        return function (...args) {
          return interceptor(fetch, ...args);
        };
      })(window.fetch)

      window.fetch.register  = function (interceptor) {
        interceptors.push(interceptor);
        return () => {
          const index = interceptors.indexOf(interceptor);
          if (index >= 0) {
            interceptors.splice(index, 1);
          }
        };
      }

      window.fetch.clear = function () {
        interceptors = [];
      }
      const requestHooksList = _requestHooks || []

      // directly register hooks
      requestHooksList.forEach((h)=> {
        fetch.register(h)
      })
    }()
  `
}

const setInitHooks = ()=>{
  return `
    !function() {
      const initHookList = _initHooks || []
      let promise = Promise.resolve([]);

      // Register request interceptors
      initHookList.forEach(({ init, initError }) => {
        if (init || initError) {
          promise = promise.then(args => init(...args), initError);
        }
      });
      promise.then(()=>{ console.log('App inited') });
    }()
  `
}

export {setRequestHooks, setInitHooks}
