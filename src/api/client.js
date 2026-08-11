import axios from 'axios'

const client = axios.create({
  baseURL: process.env.VUE_APP_BINANCE_REST_URL || 'https://api.binance.com',
  timeout: 10000
})

client.interceptors.response.use(
  response => response.data,
  error => {
    const response = error.response
    const message = response && response.data && response.data.msg
      ? response.data.msg
      : 'Unable to retrieve market data. Please try again.'

    return Promise.reject({
      code: response && response.data && response.data.code ? response.data.code : null,
      message,
      status: response ? response.status : null
    })
  }
)

export default client
