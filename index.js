const express = require('express')

const app = express()

let Parser = require('rss-parser')

app.get('/', (req, res) => res.send('Home Page Route'))
app.get('/health', (req, res) => res.send('cision-proxy server up and running'))
app.get('/rebuild', (req, res) => {
  try {
    fetch('https://api.netlify.com/build_hooks/651d24ee4348382399c6d072', {
      method: 'POST',
    }).then((response) => res.send('POST successful'))
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
  console.info('Fetching Cision RSS feed')
  try {
    const feedSE = await parser.parseURL(
      `https://news.cision.com/se/beyond-frames/ListItems?format=rss&pageSize=1000`
    )
    const feedEN = await parser.parseURL(
      `https://news.cision.com/beyond-frames/ListItems?format=rss&pageSize=1000`
    )
    const combinedTotal = feedSE?.items?.length + feedEN?.items?.length

    if (combinedTotal != cisionEntries) {
      cisionEntries = feedSE.items.length + feedEN.items.length
      const gatsbyHookResponse = await fetch(
        'https://api.netlify.com/build_hooks/651d24ee4348382399c6d072',
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
