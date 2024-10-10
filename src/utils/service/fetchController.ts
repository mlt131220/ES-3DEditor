/**
 * 创建一个handlerFetch
 *
 * @param limit 并发控制 
 * @param timeout 超时设
 * @return function 返回一个函数
 */
export function fetchController (limit:number, timeout:number | boolean) {
    limit = limit || 1;
    timeout = timeout || false;
    let count = 0, pool:any = [];
    
    return function (url:string, options?:any) {
        // 通过AbortController 控制 取消fetch 请求
        let controller = new AbortController();
        let signal = controller.signal;
        // 判断是否需要超时
        let isTimeout = options && options.timeout || timeout;

        // 控制请求超时
        let timeoutPromise = () => {
            return new Promise((reject) => {
                setTimeout(() => {
                    // resolve('请求超时');
                    reject('请求超时');
                    controller.abort();
                }, options?.timeout || timeout)
            })
        }

        // 返回fetch 本身
        let taskPromise = () => new Promise((resolve, reject) => {
            fetch(url, { signal, ...options }).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err)
            })
        });

        // 通过Promise.race可以控制超时，并在访问结果中 去继续调用等待池中的请求
        let task = () => (isTimeout ? Promise.race([timeoutPromise(), taskPromise()]) : taskPromise())
            .then((res) => {
                options.onSuccess && options.onSuccess(res)
                next();
            })
            .catch((err) => {
                options.onError && options.onError(err)
                next();
            });

        // 定一个next 控制等待队列中的请求继续并发调用
        let next = () => {
            // 每执行一次next count - 1，然后比较当前的count 与 limit
            // 如果小于limit 循环执行limit-count 次
            count--;
            if (count < limit && pool.length) {
                let n = limit - count;
                for (let i = 0; i < n; i++) {
                    let curTask:any = pool.shift();
                    curTask();
                    ++count;
                }
            }
        };

        // 比较count与limit 大于等于limit的推入等待队列 小于limit的 count + 1，并执行fetch请求
        if (count >= limit) {
            pool.push(task);
        } else {
            ++count;
            task();
        }
    }
}
