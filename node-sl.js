var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
var sha1 = require('sha1');

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

var fileWatches = {};

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

    case 'check':
  		var filePath = querystring.parse(parsedUrl.query).path;
      response.writeHead(200, {'Content-Type': 'text/plain'});
      //look up the file
      var status = fileWatches[filePath];
      if (status) {
        response.write(status.hash);
        response.end();
      } else {
        fs.readFile(filePath, 'utf8', (function(status) {
          return function(err, data) {
            if (!err) {
              status = {};
              status.hash = sha1(data);
              status.watch = fs.watchFile(filePath, (function(filePath) {
                return function(current, previous) {
                  fs.readFile(filePath, 'utf8', (function(status) {
                    return function(err, data) {
                      if (!err) {
                        status.hash = sha1(data);
                      } else {
                        status.hash = 'failed to read file';
                      }
                    };
                  })(status));
                };
              })(filePath));
              fileWatches[filePath] = status;
              response.write(status.hash);
              response.end();
            } else {
              response.write('failed to read file');
              response.end();
            }
          };
        })(status));
      }
      break;

		//returns a file's entire contents
		case 'file':
			var filePath = querystring.parse(parsedUrl.query).path;
      fs.readFile(filePath, 'utf8', function(err, data) {
        if (!err) {
          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.write(data);
          response.end();
        } else {
          console.log(err);
        }
      });
			break;

    //lists the complete recursive contents of a directory
    case 'list':
      var filePath = querystring.parse(parsedUrl.query).path;
      var filesRemaining = {};
      var fileObjects = [];
      
      var getDirectoryListing = function(path) {
        filesRemaining[path] = 0;
        //read all the files
        fs.readdir(path, function(err, files) {
          if (!err) {
            for (var i = 0; i < files.length; i++) {
              var name = files[i];
              var fullName = require('path').join(path, files[i]);
              getFileStats(fullName);
            }
            delete filesRemaining[path];
          } else {
            console.log(err);
            delete filesRemaining[path];
          }
        });
      };
            
      var getFileStats = function(path) {
        //don't try to walk hidden files or directories
        if (!path.match(/\/\./)) {
          //put this file in files remaining
          filesRemaining[path] = 0;
          //read stats, place in file objects
        	fs.stat(path, function(err, stats) {
            if (!err) {
      				fileObjects.push(path);
              if (stats.isDirectory()) {
                getDirectoryListing(path);
              } else {
                delete filesRemaining[path];
              }

              if (Object.size(filesRemaining) == 0) {
                serialize();
              }
            } else {
              console.log(err);
              delete filesRemaining[path];
            }
          });
        }
      };

      var serialize = function() {
        var result = { files: fileObjects };
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(JSON.stringify(result));
        response.end();
      };
        
      getDirectoryListing(filePath);

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
          //set the monitor to the new hash
          var status = fileWatches[fileName];
          if (status) {
            status.hash = data.fileHash;
          } else {
            status = {
              hash: data.fileHash,
            }
          }
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
