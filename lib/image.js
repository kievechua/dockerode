var Image = function(modem, name) {
  this.modem = modem;
  this.name = name;
};

Image.prototype.insert = function(opts, callback) {
  var self = this;
  var optsf = {
    path: '/images/' + this.name + '/insert?',
    method: 'POST',
    options: opts,
    isStream: true,
    statusCodes: {
      200: true,
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

Image.prototype.inspect = function(callback) {
  var opts = {
    path: '/images/' + this.name + '/json',
    method: 'GET',
    statusCodes: {
      200: true,
      404: "no such image",
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Image.prototype.history = function(callback) {
  var opts = {
    path: '/images/' + this.name + '/history',
    method: 'GET',
    statusCodes: {
      200: true,
      404: 'no such image',
      500: 'server error'
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

Image.prototype.push = function(opts, auth, callback) {
  if (typeof auth === 'function') {
    callback = auth;
    auth = null;
  }

  var self = this,
    optsf = {
      path: '/images/' + this.name + '/push?',
      method: 'POST',
      options: opts,
      authconfig: auth,
      isStream: true,
      statusCodes: {
        200: true,
        404: 'no such image',
        500: 'server error'
      }
    };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

Image.prototype.tag = function(opts, callback) {
  var self = this;
  var optsf = {
    path: '/images/' + this.name + '/tag?',
    method: 'POST',
    options: opts,
    statusCodes: {
      201: true,
      400: "bad parameter",
      404: "no such image",
      409: "conflict",
      500: "server error"
    }
  };

  return this.modem.dialAsync(optsf).nodeify(callback);
};

Image.prototype.remove = function(callback) {
  var opts = {
    path: '/images/' + this.name,
    method: 'DELETE',
    statusCodes: {
      200: true,
      404: "no such image",
      409: "conflict",
      500: "server error"
    }
  };

  return this.modem.dialAsync(opts).nodeify(callback);
};

module.exports = Image;
