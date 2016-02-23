module.exports = function(name, value, ttl, path, domain, secure) {

  if (arguments.length > 1) {
    return document.cookie = name + "=" + escape(value) +
      (ttl ? "; expires=" + new Date(+new Date()+(ttl*1000)).toUTCString() : "") +
      (path   ? "; path=" + path : "") +
      (domain ? "; domain=" + domain : "") +
      (secure ? "; secure" : "")
  }

  return unescape((("; "+document.cookie).split("; "+name+"=")[1]||"").split(";")[0])
}