(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{987:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==u(e)&&"function"!==typeof e)return{default:e};var t=i();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var a=r?Object.getOwnPropertyDescriptor(e,o):null;a&&(a.get||a.set)?Object.defineProperty(n,o,a):n[o]=e[o]}n.default=e,t&&t.set(e,n);return n}(n(0)),o=n(299),a=n(523);function i(){if("function"!==typeof WeakMap)return null;var e=new WeakMap;return i=function(){return e},e}function u(e){return(u="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"===typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach(function(t){b(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function p(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function s(e,t){return(s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function y(e){var t=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(e){return!1}}();return function(){var n,r=d(e);if(t){var o=d(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return function(e,t){if(t&&("object"===u(t)||"function"===typeof t))return t;return f(e)}(this,n)}}function f(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function d(e){return(d=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function b(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var h="wistia-player-",v=function(e){!function(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t)}(l,r.Component);var t,n,i,u=y(l);function l(){var e;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l);for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return b(f(e=u.call.apply(u,[this].concat(n))),"callPlayer",o.callPlayer),b(f(e),"playerID",e.props.config.playerId||"".concat(h).concat((0,o.randomString)())),b(f(e),"onPlay",function(){var t;return(t=e.props).onPlay.apply(t,arguments)}),b(f(e),"onPause",function(){var t;return(t=e.props).onPause.apply(t,arguments)}),b(f(e),"onSeek",function(){var t;return(t=e.props).onSeek.apply(t,arguments)}),b(f(e),"onEnded",function(){var t;return(t=e.props).onEnded.apply(t,arguments)}),b(f(e),"mute",function(){e.callPlayer("mute")}),b(f(e),"unmute",function(){e.callPlayer("unmute")}),e}return t=l,(n=[{key:"componentDidMount",value:function(){this.props.onMount&&this.props.onMount(this)}},{key:"load",value:function(e){var t=this,n=this.props,r=n.playing,a=n.muted,i=n.controls,u=n.onReady,l=n.config,p=n.onError;(0,o.getSDK)("https://fast.wistia.com/assets/external/E-v1.js","Wistia").then(function(){window._wq=window._wq||[],window._wq.push({id:t.playerID,options:c({autoPlay:r,silentAutoPlay:"allow",muted:a,controlsVisibleOnLoad:i,fullscreenButton:i,playbar:i,playbackRateControl:i,qualityControl:i,volumeControl:i,settingsControl:i,smallPlayButton:i},l.options),onReady:function(e){t.player=e,t.unbind(),t.player.bind("play",t.onPlay),t.player.bind("pause",t.onPause),t.player.bind("seek",t.onSeek),t.player.bind("end",t.onEnded),u()}})},p)}},{key:"unbind",value:function(){this.player.unbind("play",this.onPlay),this.player.unbind("pause",this.onPause),this.player.unbind("seek",this.onSeek),this.player.unbind("end",this.onEnded)}},{key:"play",value:function(){this.callPlayer("play")}},{key:"pause",value:function(){this.callPlayer("pause")}},{key:"stop",value:function(){this.unbind(),this.callPlayer("remove")}},{key:"seekTo",value:function(e){this.callPlayer("time",e)}},{key:"setVolume",value:function(e){this.callPlayer("volume",e)}},{key:"setPlaybackRate",value:function(e){this.callPlayer("playbackRate",e)}},{key:"getDuration",value:function(){return this.callPlayer("duration")}},{key:"getCurrentTime",value:function(){return this.callPlayer("time")}},{key:"getSecondsLoaded",value:function(){return null}},{key:"render",value:function(){var e=this.props.url,t=e&&e.match(a.MATCH_URL_WISTIA)[1],n="wistia_embed wistia_async_".concat(t);return r.default.createElement("div",{id:this.playerID,key:t,className:n,style:{width:"100%",height:"100%"}})}}])&&p(t.prototype,n),i&&p(t,i),l}();t.default=v,b(v,"displayName","Wistia"),b(v,"canPlay",a.canPlay.wistia),b(v,"loopOnEnded",!0)}}]);
//# sourceMappingURL=reactPlayerWistia.94417f9f.chunk.js.map