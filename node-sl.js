#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

http.createServer(function(request, response) {
	var parsedUrl = require('url').parse(request.url);
	var path = parsedUrl.pathname;
	var page = path.replace(/\//, '');
	switch(page) {
		case '':
			fs.readFile('index.html', function(err, data) {
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(data);
				response.end();
			});
			break;
		case 'file':
			//returns a file's entire contents
			var filePath = querystring.parse(parsedUrl.query).path;
			fs.open(filePath, 'r', 0666, function(err, fd) {
				if (!err) {
					response.writeHead(200, {'Content-Type': 'text/plain'});
					var buffer = new Buffer(1024);
					var sendChunk = function() {
						fs.read(fd, buffer, 0, 1024, null, function(err, bytesRead) {
							if (bytesRead == 1024) {
								response.write(buffer.toString('binary'));
								sendChunk();
							} else {
								response.write(buffer.toString('binary', 0, bytesRead));
								response.end();
							}
						});
					}
					sendChunk();
				} else {
					console.log(err);
				}
			});
			break;
		case 'favicon.ico':
			break;
		case 'save':
			//get filename
			var fileSize = request.headers['content-length'];
			var rawFile = "";
			request.addListener('data', function(chunk) {
				rawFile += chunk.toString();
				if (rawFile.length == fileSize) {
					var data = querystring.parse(rawFile);
					var fileName = decodeURIComponent(data.fileName);
					console.log(fileName);
					var fileContents = data.fileContents;
					fs.writeFile(fileName, fileContents, function(err) {
						response.writeHead(200, {'Content-Type': 'text/plain'});
						response.write('ok');
						response.end();
					});
				}
			});
			break;
		default:
			fs.readFile(page, function(err, data) {
				response.writeHead(200, {'Content-Type': 'text/javascript'});
				response.write(data);
				response.end();
			});
			break;
	}
}).listen(8080, "localhost");
