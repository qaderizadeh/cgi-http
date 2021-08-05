const http = require("http");
const { Socket } = require("net");

var Response = function () {
  var body = false;
  this.headers = {};

  this.setHeader = function (name, value) {
    this.headers[name] = value;
  };

  this.getHeader = function (field) {
    return this.headers[field];
  };

  this.getHeaders = function () {
    return this.headers;
  };

  this.write = function (message) {
    if (!body) {
      body = true;
      for (const name in this.headers)
        process.stdout.write(name + ": " + this.headers[name] + "\n");
      process.stdout.write("\n");
    }

    if (message) process.stdout.write(message);
  };

  this.flush = function () {};

  this.end = function () {
    this.write.apply(this, arguments);
  };
};

var Server = function (listener, options) {
  const request = new http.IncomingMessage(new Socket({ readable: true }));

  Object.assign(
    request.headers,
    Object.assign(
      {},
      ...Object.keys(process.env)
        .filter(
          (key) =>
            ![
              "PATH",
              "REDIRECT_UNIQUE_ID",
              "UNIQUE_ID",
              "DOCUMENT_ROOT",
              "CONTEXT_PREFIX",
              "CONTEXT_DOCUMENT_ROOT",
              "SERVER_ADMIN",
              "SCRIPT_FILENAME",
              "REMOTE_PORT",
              "SCRIPT_NAME",
            ].includes(key)
        )
        .map((key) => ({
          [key
            .replace(/^HTTP_/, "")
            .replace(/_/g, "-")
            .toLowerCase()]: process.env[key],
        }))
    )
  );
  request.url = process.env["REQUEST_URI"];
  request.method = process.env["REQUEST_METHOD"];
  request.socket.encrypted = /https/gi.test(process.env["REQUEST_SCHEME"]);
  process.stdin.on("data", (chunk) => {
    request.push(chunk);
    request.push(null);
    process.stdin.destroy();
  });

  var response = new Response();
  Object.defineProperty(response, "statusCode", {
    get: function () {
      this.headers.Status || 200;
    },
    set: function (code) {
      this.headers.Status = code;
    },
  });
  this.listen = function () {
    listener(request, response);
  };
};

exports.createServer = function (listener, options) {
  return new Server(listener, options);
};
