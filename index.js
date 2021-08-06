const http = require("http");
const { Socket } = require("net");

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

  var response = new http.ServerResponse(request);
  response.body = false;
  response.write = function (message) {
    if (!this.body) {
      this.body = true;
      for (const name in this.getHeaders())
        process.stdout.write(name + ": " + this.getHeader(name) + "\n");
      process.stdout.write("\n");
    }

    if (message) process.stdout.write(message);
  };
  response.flush = function () {};

  response.end = function () {
    this.write.apply(this, arguments);
  };
  this.listen = function () {
    listener(request, response);
  };
};

exports.createServer = function (listener, options) {
  return new Server(listener, options);
};
