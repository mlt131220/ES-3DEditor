const ConcurrencyManager = (axios, MAX_CONCURRENT = 10) => {
  if (MAX_CONCURRENT < 1)
    throw "并发管理器错误: 最小并发请求数为 1";
  let instance = {
    queue: <any>[],
    running: <any>[],
    shiftInitial: () => {
      setTimeout(() => {
        if (instance.running.length < MAX_CONCURRENT) {
          instance.shift();
        }
      }, 0);
    },
    push: reqHandler => {
      instance.queue.push(reqHandler);
      instance.shiftInitial();
    },
    shift: () => {
      if (instance.queue.length) {
        const queued = instance.queue.shift();
        queued.resolver(queued.request);
        instance.running.push(queued);
      }
    },
    // 用作拦截器。将传出请求排队
    requestHandler: req => {
      return new Promise(resolve => {
        instance.push({ request: req, resolver: resolve });
      });
    },
    // 用作拦截器。在收到响应时执行排队的请求
    responseHandler: res => {
      instance.running.shift();
      instance.shift();
      return res;
    },
    responseErrorHandler: res => {
      return Promise.reject(instance.responseHandler(res));
    },
    interceptors: {
      request: null,
      response: null
    },
    detach: () => {
      axios.interceptors.request.eject(instance.interceptors.request);
      axios.interceptors.response.eject(instance.interceptors.response);
    }
  };
  // 对并发请求进行排队
  instance.interceptors.request = axios.interceptors.request.use(
    instance.requestHandler
  );
  instance.interceptors.response = axios.interceptors.response.use(
    instance.responseHandler,
    instance.responseErrorHandler,
  );
  return instance;
};

export default ConcurrencyManager;
