var Modem = require('docker-modem'),
  Container = require('./container'),
  Image = require('./image'),
  util = require('./util'),
  Promise = require('bluebird');

var Docker = function(opts) {
  if (!(this instanceof Docker)) return new Docker(opts);
  this.modem = Promise.promisifyAll(new Modem(opts));
};

Docker.prototype.createContainer = function(opts, callback) {
  var self = this;
  var optsf = {
    path: '/containers/create?',
    method: 'POST',
    options: opts,
    statusCodes: {
      201: true,
      404: "no such container",
      406: 'impossible to attach',
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf)
    .then(function(data) {
      return self.getContainer(data.Id);
    })
    .nodeify(callback);
};

Docker.prototype.createImage = function(auth, opts, callback) {
  if (!callback && typeof(opts) === 'function') {
    callback = opts;
    opts = auth;
    auth = undefined;
  }

  var self = this;
  var optsf = {
    path: '/images/create?',
    method: 'POST',
    options: opts,
    authconfig: auth,
    isStream: true,
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

Docker.prototype.checkAuth = function(opts, callback) {
  var self = this;
  var opts = {
    path: '/auth',
    method: 'POST',
    options: opts,
    statusCodes: {
      200: true,
      204: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.buildImage = function(file, opts, callback) {
  if (!callback && typeof(opts) === 'function') {
    callback = opts;
    opts = null;
  }

  var self = this;
  var opts = {
    path: '/build?',
    method: 'POST',
    file: file,
    options: opts,
    isStream: true,
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.getContainer = function(id) {
  return new Container(this.modem, id);
};

Docker.prototype.getImage = function(name) {
  return new Image(this.modem, name);
};

Docker.prototype.listContainers = function(opts, callback) {
  var self = this;

  if (!callback && typeof(opts) === 'function') {
    callback = opts;
    opts = null;
  }

  var optsf = {
    path: '/containers/json?',
    method: 'GET',
    options: opts,
    statusCodes: {
      200: true,
      400: "bad parameter",
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

Docker.prototype.listImages = function(opts, callback) {
  if (!callback && typeof(opts) === 'function') {
    callback = opts;
    opts = null;
  }

  var opts = {
    path: '/images/json?',
    method: 'GET',
    options: opts,
    statusCodes: {
      200: true,
      400: "bad parameter",
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.searchImages = function(opts, callback) {
  var opts = {
    path: '/images/search?',
    method: 'GET',
    options: opts,
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.info = function(callback) {
  var opts = {
    path: '/info',
    method: 'GET',
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.version = function(callback) {
  var opts = {
    path: '/version',
    method: 'GET',
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Docker.prototype.getEvents = function(opts, callback) {
  if (!callback && typeof(opts) === 'function') {
    callback = opts;
    opts = null;
  }

  var optsf = {
    path: '/events?',
    method: 'GET',
    options: opts,
    isStream: true,
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

/**
Pull is a wrapper around parsing out the tag from the image
(which create image cannot do but run can for whatever reasons) and create image overloading.
*/
Docker.prototype.pull = function(repoTag, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var imageSrc = util.parseRepositoryTag(repoTag);
  var pullOpts = {
    fromImage: imageSrc.repository,
    tag: imageSrc.tag
  };

  // allow overriding the pull opts
  for (var key in opts) pullOpts[key] = opts[key];

  // XXX: Should we allow authopts here?
  return this.createImage(pullOpts, callback);
};

Docker.prototype.run = function(image, cmd, streamo, callback) {
  var optsc = {
    'Hostname': '',
    'User': '',
    'AttachStdin': false,
    'AttachStdout': true,
    'AttachStderr': true,
    'Tty': true,
    'OpenStdin': false,
    'StdinOnce': false,
    'Env': null,
    'Cmd': cmd,
    'Image': image,
    'Volumes': {},
    'VolumesFrom': ''
  };

  return this.createContainer(optsc)
    .then(function handler(container) {
      return container.attach({stream: true, stdout: true, stderr: true})
        .then(function handler(stream) {
          if (streamo) {
            stream.setEncoding('utf8');
            stream.pipe(streamo, {end: true});
          }

          return container.start()
            .then(function(data) {
              return container.wait()
                .then(function(data) {
                  return {
                    data: data,
                    container: container
                  };
                })
                .nodeify(callback);
            })
            .nodeify(callback);
        })
        .nodeify(callback);
    })
    .nodeify(callback);
};

module.exports = Docker;
