/*
 * JavaScript tracker for Snowplow: init.js
 *
 * Significant portions copyright 2010 Anthon Pang. Remainder copyright
 * 2012-2014 Snowplow Analytics Ltd. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * * Neither the name of Anthon Pang nor Snowplow Analytics Ltd nor the
 *   names of their contributors may be used to endorse or promote products
 *   derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES LOSS OF USE,
 * DATA, OR PROFITS OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Snowplow Asynchronous Queue

/*
 * Get the name of the global input function
 */

var snowplow = require('./snowplow')
var windowAlias = window
var cookie = require('./lib/cookie')

// if (windowAlias.GlobalSnowplowNamespace && windowAlias.GlobalSnowplowNamespace.length > 0) {
//   queueName = windowAlias.GlobalSnowplowNamespace.shift()
//   queue = windowAlias[queueName]
//   queue.q = new snowplow.Snowplow(queue.q, queueName)
// } else {
//   windowAlias._snaq = windowAlias._snaq || []
//   windowAlias._snaq = new snowplow.Snowplow(windowAlias._snaq, '_snaq')
// }


var cleaned_snq = []
var namespace
var app
var domain
var pv_init_data

var METHODS = {
  // appId
  app: function (v) {
    app = v
  },

  domain: function (v) {
    domain = v
  },

  // namespace prefix
  namespace: function (v) {
    namespace = v
  },

  // disable this method
  trackPageView: function (){},

  // All page will send a pv request automatically,
  // and nobody could send pv request more than once.
  // use:
  // ```
  // _snq.push(['pv', data])
  // ```
  // to specify the initial data which to be sent by pv
  pv: function (v) {
    pv_init_data = v
  },

  exp: function (v) {
    _snq.exp = v
  }
}


// Get the built-in one-time commander
function get_method (args) {
  var name = args[0]
  if (!name) {
    return
  }

  // 'trackPageView:wapT' -> trackPageView
  name = name.split(':')[0]

  return METHODS[name]
}


// function url_param (key) {
//   return (location.search.split(key + '=')[1] || '')
//     .split('&')[0]
// }


function get_platform () {
  // var channel_from_url = url_param('utm_source') || url_param('xhschannel')

  // // Detect url first, the utm_source might be changed
  // if (channel_from_url) {
  //   // save session cookie
  //   cookie('xhs_channel', channel_from_url)
  //   return 'mob_' + channel_from_url
  // }

  // var channel_from_cookie = cookie('xhs_channel')
  // if (channel_from_cookie) {
  //   return = 'mob_' + channel_from_cookie
  // }

  return 'mob'
  // returns 'mob' for now, we should use utm_source instead of get_platform
}


var _snq = windowAlias._snq = windowAlias._snq || []

_snq.forEach(function (directive) {
  var method = get_method(directive)
  if (method) {
    directive.shift()
    return method.apply(null, args)
  }

  cleaned_snq.push(directive)
})

_snq.length = 0

// first of all, create new tracker
cleaned_snq.unshift(
  [
    'newTracker',

    // namespace default to `'wapT'`
    namespace || 'wapT',

    // collector url
    't.xiaohongshu.com/api/collect',
    {
      appId: app || 'xhs-wap',
      platform: get_platform(),
      cookieDomain: domain || 'www.xiaohongshu.com',
      cookieName: 'xhs_sp',
      encodeBase64: true,
      respectDoNotTrack: false,
      userFingerprint: true,
      userFingerprintSeed: 6385926734,
      pageUnloadTimer: 0,
      forceSecureTracker: location.href === 'https:',

      // if use no localstorage, `functionName` ('_snq') is useless
      useLocalStorage: false,
      useCookies: true,
      writeCookies: true,
      post: true,
      bufferSize: 1,
      maxPostBytes: 450000,
      crossDomainLinker: function(a) {
        return true
      },
      contexts: {
        performanceTiming: true,
        gaCookies: true,
        geolocation: false
      }
    }
  ]
)

cleaned_snq.push(
  ['setUserIdFromCookie', 'user_token'],

  // send pv automatically
  ['trackPageView', {
    schema: 'dd:com.xhs/page/json/1-0-0',
    data: pv_init_data || {}
  }]
)

var _push = new snowplow.Snowplow(cleaned_snq, '_snq').push

// Custom push method
_snq.push = function push (directive) {
  !get_method(directive) && _push(directive)
}
