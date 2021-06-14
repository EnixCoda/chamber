import http from 'http'
import fs from 'fs'
import url from 'url'
import path from 'path'

export const webServer = http.createServer(function handleWebRequest(request, response) {
  const { query } = url.parse(request.url, true)
  if (query.close !== undefined) {
    fs.createReadStream(path.resolve(__dirname, 'close.html')).pipe(response)
  } else {
    let { redirect } = query
    if (!redirect) {
      response.end()
      return
    }
    if (Array.isArray(redirect)) redirect = redirect.pop()
    response.writeHead(307, {
      Location: redirect,
    })
    response.end()
  }
})

const port = 8080
webServer.listen(port, function() {
  console.log(`Server is listening on port ${port}`)
})
