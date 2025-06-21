import axios, { AxiosRequestConfig } from 'axios'

type QueryStringProps = Record<string, any> | URLSearchParams

export interface IRequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    query?: QueryStringProps
    body?: object
    headers?: Record<string, string>
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_HOST as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosIndexerInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_INDEXER_API as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosSuperlendInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SUPERLEND_API as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosPointsInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_POINTS_HOST as string,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

const axiosRewardsInstance = axios.create({
    baseURL: 'https://rewards.funds.superlend.xyz',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
    },
})

export async function request<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestIndexer<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosIndexerInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestSuperlend<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    try {
        const response = await axiosSuperlendInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestPoints<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    
    // Add custom headers if provided
    if (config.headers) {
        axiosConfig.headers = config.headers
    }
    
    try {
        const response = await axiosPointsInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}

export async function requestRewards<TResponse = void>(config: IRequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
        url: config.path,
        method: config.method,
        params: config.query,
        data: config.body,
    }
    
    // Add custom headers if provided
    if (config.headers) {
        axiosConfig.headers = config.headers
    }
    
    try {
        const response = await axiosRewardsInstance(axiosConfig)
        return response.data.data as TResponse
    } catch (error) {
        throw new Error('HTTP request has been failed', {
            cause: error,
        })
    }
}
