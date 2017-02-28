const net = require('net')
const cluster = require('cluster')
const number = 1

if (number > 1 && cluster.isMaster) {
	for (let i = 0; i < number; i++) cluster.fork()
} else {
	// region route

	const exampleRoute = url => {
		switch (url) {
			case '/': return {
				status: 200,
				body: 'index',
				headers: `Content-Type: text/plain`
			}
			case '/password': return {
				status: 200,
				body: 'some password',
				headers: `Content-Type: text/plain`
			}
			case '/ping': return {
				status: 200,
				body: JSON.stringify({
					status: 'info'
				}, null, '\t'),
				headers: `Content-Type: text/json`
			}
			case '/slow': return {
				status: 200,
				body: `I'm slow`,
				headers: {
					'Content-Type': 'text/json'
				}
			}
		}
	}

	// endregion

	const staticResponse = Buffer.from(`HTTP/1.1 200 OK
Connection: Closed
Content-Length: 0

`)

	// region request

	const handleData = function (data) {

		// this.write(staticResponse)

		// read URL

		let start = data.indexOf(47)
		let end = data.indexOf(32, start)
		const url = data.slice(start, end)

		// respond

		const {status, body, headers} = exampleRoute(url.toString())
		if (typeof headers === 'string')
			this.write(Buffer.from(`HTTP/1.1 ${status} OK\r\n${headers}\r\nServer: hastytp\r\nConnection: Closed\r\nContent-Length: ${body.length}\r\n\r\n${body}`))
		else {
			const _headers = Object.keys(headers).map(i => `${i}: ${headers[i]}`).join('\r\n')
			this.write(Buffer.from(`HTTP/1.1 ${status} OK\r\nServer: hastytp\r\nConnection: Closed\r\nContent-Length: ${body.length}\r\n${_headers}\r\n\r\n${body}`))
		}
	}

	// endregion

	// region server

	const nop = () => {}

	const handleSocket = socket => {
		socket.on('data', handleData)
		socket.on('error', nop)
	}

	const server = net.createServer(handleSocket)

	server.listen(8080)

	// endregion

}
