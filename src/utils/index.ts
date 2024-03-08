export const isNotDefined = <T>(value: T | undefined | null): value is undefined | null => value === undefined || value === null

export const isDefined = <T>(value: T | undefined | null): value is NonNullable<T> => value !== undefined && value !== null

export const isEmpty = (value: string | undefined | null): value is undefined => value === undefined || value === null || value === ''

export const isNotEmpty = (value: string | undefined | null): value is string => value !== undefined && value !== null && value !== ''

export const sendRequest = async <ResponseData>(
    params:
        | {
              url: string
              method: string
              body?: Record<string, unknown> | FormData
          }
        | string
): Promise<{ data?: ResponseData; error?: Error }> => {
    try {
        const url = typeof params === 'string' ? params : params.url
        const response = await fetch(url, {
            method: typeof params === 'string' ? 'GET' : params.method,
            mode: 'cors',
            headers:
                typeof params !== 'string' && isDefined(params.body)
                    ? {
                          'Content-Type': 'application/json'
                      }
                    : undefined,
            body: typeof params !== 'string' && isDefined(params.body) ? JSON.stringify(params.body) : undefined
        })
        let data: any
        const contentType = response.headers.get('Content-Type')
        if (contentType && contentType.includes('application/json')) {
            data = await response.json()
        } else {
            data = await response.text()
        }
        if (!response.ok) {
            let errorMessage

            if (typeof data === 'object' && 'error' in data) {
                errorMessage = data.error
            } else {
                errorMessage = data || response.statusText
            }

            throw errorMessage
        }

        return { data }
    } catch (e) {
        console.error(e)
        return { error: e as Error }
    }
}


export const getCookie = (name: string): string => {
    const cookieDecoded = decodeURIComponent(document.cookie);
    const cookieArray = cookieDecoded.split("; ");
    let result:string = "";
    cookieArray.forEach((element) => {
        let components = element.split("=")
        if (components[0] == name){
            result = components[components.length-1]
        }
    })
    return result;
};

export const setCookie = (name:string,value: string ,daysToLive: number ) =>{
    const date = new Date();
    date.setTime(date.getTime() + (daysToLive*24*60*60*1000))
    const expires  = "expires="+date.toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`
};