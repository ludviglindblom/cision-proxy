const express = require('express')

const app = express()

let Parser = require('rss-parser')

app.get('/', (req, res) => res.send('Home Page Route'))
app.get('/health', (req, res) => res.send('cision-proxy server up and running'))
app.get('/rebuild', (req, res) => {
  try {
    fetch(
      'https://webhook.gatsbyjs.com/hooks/data_source/publish/7ed94d80-bd7e-454b-a3b7-2b88fd04e318',
      {
        method: 'POST',
      }
    ).then((response) => res.send('POST successful'))
  } catch (err) {
    res.send(`POST failed with error: ${err}`)
  }
})

const port = process.env.PORT || 3000

function startApp(app) {
  return app.listen(port, () =>
    console.info(`Server running on ${port}, http://localhost:${port}`)
  )
}

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

let parser = new Parser()

let cisionEntries = 1

const interval = 30000

let server = startApp(app)

const cisionPinger = async () => {
  console.info('Trying to fetch Cision RSS feed')
  try {
    const result = await parser.parseURL(
      `https://news.cision.com/se/beyond-frames/ListItems?format=rss&pageSize=200`
    )
    const resultData = result
    console.info(resultData.items.length)
    if (resultData.items.length != cisionEntries) {
      cisionEntries = resultData.items.length
      const gatsbyHookResponse = await fetch(
        'https://webhook.gatsbyjs.com/hooks/data_source/publish/7ed94d80-bd7e-454b-a3b7-2b88fd04e318',
        {
          method: 'POST',
        }
      )
      console.info(gatsbyHookResponse)
    }
  } catch (err) {
    server.close(() => {
      console.error('app closed. Restarting.', err)
      const app = express()
      server = startApp(app)
    })
  }
}
setInterval(cisionPinger, interval)
