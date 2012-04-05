var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

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
        /*
        //nothing is using this now, but it's a holdover from a different project
		//returns a full listing for a directory
        case 'dir':
			var filePath = querystring.parse(parsedUrl.query).path;
			fs.readdir(filePath, function(err, files) {
				if (!err) {
					var serialize = function(filename) {
						var files = {
							directory : filePath,
							files : fileObjects,
						};
						response.writeHead(200, {'Content-Type': 'application/json'});
						response.write(JSON.stringify(files));
						response.end();
					}
					var fileObjects = [];
					var filesProcessed = 0;
					for (var i = 0; i < files.length; i++) {
						var name = files[i];
						var fullName = require('path').join(filePath, files[i]);
						fs.stat(fullName, (function(i, name, fullName) {
							return function(err, stats) {
								statHash = {};
								for (stat in stats) {
									var value = (typeof stats[stat] === 'function') ? stats[stat]() : stats[stat];
									statHash[stat] = value;
								}
								statHash.name = name;
								statHash.fullName = fullName;
								fileObjects[i] = statHash;
								filesProcessed++;
								if (filesProcessed >= files.length) {
									serialize();
								}
							}
						})(i, name, fullName));
					}
				} else {
					console.log(err);
				}
			});
			break;
        */
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
