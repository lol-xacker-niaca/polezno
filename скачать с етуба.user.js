// ==UserScript==
// @name        SaveFrom.net ss
// @namespace   http://savefrom.net/
// @version     5.31.2
// @date        2015-08-18
// @author      Magicbit, Inc  xacker-niaca
// @description Youtube Downloader: all in one script to get Vimeo, Facebook, Dailymotion videos for free
// @homepage    http://savefrom.net/user.php?helper=userjs
// @icon        http://savefrom.net/img/extension/icon_16.png
// @icon64      http://savefrom.net/img/extension/icon_64.png
// @updateURL   https://sf-addon.com/helper/chrome/helper.meta.js
// @downloadURL https://sf-addon.com/helper/chrome/helper.user.js
// @include     http://*
// @include     https://*
// @exclude     *://google.*/*
// @exclude     *://*.google.*/*
// @exclude     *://acidtests.org/*
// @exclude     *://*.acidtests.org/*
// @run-at      document-end
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
// @grant       GM_info
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @grant       GM_notification
// @grant       GM_download
// ==/UserScript==

(function() {
  if(typeof GM_getValue === 'undefined') {
    return;
  }

  var _moduleHosts = {
    'dailymotion.com': 'dailymotion',
    'facebook.com': 'facebook',
    'odnoklassniki.ru': 'odnoklassniki',
    'mail.ru': 'mailru',
    'ok.ru': 'odnoklassniki',
    'savefrom.net': 'savefrom',
    'soundcloud.com': 'soundcloud',
    'vimeo.com': 'vimeo',
    'vk.com': 'vk',
    'vkontakte.ru': 'vk',
    'youtube.com': 'youtube',
    'instagram.com': 'instagram',
    'rutube.ru': 'rutube'
  };

  var getTopLevelDomain = function(domain) {
    if(!domain) {
      return '';
    }

    if(!domain.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/)) {
      return domain;
    }

    var a = domain.split('.');
    var l = a.length;

    if(l == 2) {
      return domain;
    }

    return (a[l - 2] + '.' + a[l - 1]);
  };

  var host = getTopLevelDomain(location.hostname);
  getTopLevelDomain = null;
  if(!host) {
    return;
  }

(function(){
  if (window.self == window.top || !location.hash) {
    return;
  }

  var params = location.hash.match(/sfh--download=([^\s\&]+)/i);
  if (!params) {
    return;
  }

  try {
    params = JSON.parse(decodeURIComponent(params[1]));
  } catch (e) {
    return;
  }
  if (!params.url || !params.filename) {
    return;
  }

  var a = document.createElement('a');
  a.href = params.url;
  a.download = params.filename;
  a.appendChild(document.body);

  var event = document.createEvent('MouseEvents');
  event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,
    false, false, false, false, 0, null);

  setTimeout(function() {
    a.dispatchEvent(event);
    parent.postMessage('killMe:'+location.href, '*');
  });

})();

  var _moduleName = _moduleHosts[host] || 'lm';
  _moduleHosts = null;
  host = null;

  if (_moduleName === 'lm') {
    if (GM_getValue('lmFileHosting') === 0 && GM_getValue('lmMediaHosting') === 0) {
      if (GM_getValue('sovetnikEnabled') === 0) {
        return;
      }
      _moduleName = 'sovetnik';
    }
  }

  var _menu;
  var _options;
  var _modules = {};
  var _languageList = {};

  try {
    window.sessionStorage && (window.sessionStorage['savefrom-helper-userjs'] = '1');
  } catch (e) {
    return;
  }
/////////////////////////////////////////////////
// MENU
_menu = {
  activeDataAttr: 'data-sfh-active',
  id: 'sfh--ujs-menu',
  tooltipId: 'sfh--ujs-menu-tooltip',
  enabled: true,
  active: false,
  hover: false,
  move: false,
  title: '',
  shakeTimer: 0,
  shakeInterval: 10000,

  menu: null,
  icon: null,

  initMenu: null,

  style: {
    menu: {
      initial: {
        background: '#fff',
        borderStyle: 'solid',
        borderWidth: '2px 0 2px 2px',
        borderRadius: '5px 0 0 5px',
        display: 'none',
        boxSizing: 'content-box',
        font: '13px/18px Arial,Helvetica,sans-serif',
        width: 'auto',
        height: 'auto',
        padding: 0,
        margin: 0,
        overflow: 'visible',
        position: 'fixed',
        top: '50px',
        right: '0',
        textAlign: 'left',
        WebkitTransition: 'all 0.2s',
        transition: 'all 0.2s',
        zIndex: 99999
      },

      enabled: {
        borderColor: '#8dc50b'
      },

      disabled: {
        borderColor: '#d0d0d0'
      },

      tag: {
        display: 'block',
        width: '10px',
        height: '20px',
        overflow: 'hidden',
        opacity: 0.5
      },

      tagHover: {
        width: '20px',
        opacity: 0.8
      },

      active: {
        width: 'auto',
        height: 'auto',
        overflow: 'visible',
        opacity: 0.9
      }
    },

    icon: {
      initial: {
        display: 'inline-block',
        boxSizing: 'content-box',
        backgroundPosition: '50% 50%',
        backgroundRepeat: 'no-repeat',
        width: '16px',
        height: '16px',
        margin: 0,
        padding: '2px',
        overflow: 'hidden',
        verticalAlign: 'middle',
        cursor: 'pointer'
      },

      enabled: {
        backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABqUlEQVQ4jY2SzStEURiHf2bMl+w0SrHRZKPY+RtkYyeRspPFsEEZItLM3DCRjxofw0wyK0k+ClNGhBiEmIiwsrChZqvj/sZcznDJ4um8532f9+3ccy5isRg0Qre2V67hxyzxnfkHm5AdDcib6SvLC9e5e5v4TujuY4Dm6A4YPc684xq8sb6Fbq1CZkbNyU7aACVqdPhP8usGouZT7qcuLInpuFnITJ6bE6zRocuezwEdS/B2LuO+ewXJY44dmZ795yYhM6LmWKNDlz1pn+D0o6J5FjeMfbvGx9ETg5BhjjU6dHXvQMMdMcZ9BxAy7k1DXM/F0J6tYSxm9wbOHJ65y9Lh4FnJvLKZfa3sQKSh5lijQ5c97EX7GnJ61nHYF4Egni0klG3jk7bXYI41bc8e9iaP0RhArmsR+92rEP+BLnvSL3ESea1h7LoWVOEP6NDVvcTaQRQ4ZxBtCUPowRqdX/9EUtOFwoZxbDTNQsgwx9qPV9B7mqoOFNX3Y61xAoIwZk73GfWSySFtKK7uxSph/Jv3FQAZKgYVk0q2ir2sEuWEcSpnSjkZWt87G7sZgVx6JvgAAAAASUVORK5CYII=)'
      },

      disabled: {
        backgroundImage: 'url(data:image/png;base64,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)'
      },

      tag: {padding: '2px'},
      active: {padding: '5px'}
    },

    title: {
      display: 'inline-block',
      font: 'bold 13px/18px Arial,Helvetica,sans-serif',
      lineHeight: '26px',
      margin: 0,
      padding: 0,
      textAlign: 'left',
      verticalAlign: 'middle',
      cursor: 'pointer'
    }
  },

  setTitle: function(title, version)
  {
    this.title = title;
    if(version)
      this.title += ' ' + version;
  },

  hide: function() {
    if(!this.menu || !document.body)
      return;
    this.menu.parentNode.removeChild(this.menu);
    this.menu = null;
    this.icon = null;
  },

  create: function(){
    if(this.menu || !document.body)
      return;

    this.moduleName = _moduleName;

    var _this = this;

    var menu = document.createElement('div');

    menu.addEventListener('mouseover', function(){
      if(!_this.active)
      {
        _this.hover = true;
        _this.setElementsStyle('tagHover');
      }
    });

    menu.addEventListener('mouseout', function(){
      if(!_this.active)
      {
        _this.hover = false;
        _this.setElementsStyle('tag');
      }
    });

    var icon = document.createElement('div');
    icon.title = this.title;

    icon.addEventListener('click', function(event){
      if (_this.move) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if(event.button === 0)
      {
        _this.toggleMenuItems();
      }
      else if(event.button == 2)
      {
        _this.remove();
      }

      return false;
    }, false);

    icon.addEventListener('contextmenu', function(event){
      if (_this.move) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      _this.remove();
      return false;
    }, false);

    this.icon = menu.appendChild(icon);
    this.menu = document.body.appendChild(menu);

    var iconTopPos = parseInt(_menu.style.menu.initial.top);
    if (iconTopPos < 0) {
      iconTopPos = 0;
    } else
    if (this.moduleName === 'youtube' && iconTopPos < 92) {
      iconTopPos = 92;
    } else
    if (iconTopPos + 24 > parseInt(window.innerHeight)) {
      iconTopPos = parseInt(window.innerHeight) - parseInt(_menu.style.menu.tag.height) - 4;
    }

    _menu.style.menu.initial.top = iconTopPos + 'px';

    this.setElementsStyle('initial');
    this.setEnabled(1);
    this.showTag();
    this.enableMove();
  },

  enableMove: function() {
    var isStart = false;
    var _this = this;
    var icon = _this.icon;
    var menu = _this.menu;
    var startTimer = undefined;
    var sT = (parseInt(menu.style.height) / 2) || 0;
    var noSelectStyle = mono.create('style', {
      text: 'body {-webkit-user-select: none;-moz-user-select: none;-o-user-select: none;user-select: none;}'
    });

    var rbIcon = function() {
      _this.move = false;
      menu.style.position = _this.style.menu.initial.position;
      menu.style.WebkitTransition = _this.style.menu.initial.WebkitTransition;
      menu.style.transition = _this.style.menu.initial.transition;
      menu.style.borderStyle = _this.style.menu.initial.borderStyle;

      if (noSelectStyle.parentNode) {
        noSelectStyle.parentNode.removeChild(noSelectStyle);
      }
    };

    var initIcon = function(e) {
      e.stopPropagation();
      e.preventDefault();

      _menu.hideMenuItems();

      _this.hover = true;
      _this.setElementsStyle('tagHover');

      _this.move = true;
      menu.style.position = 'fixed';
      var eX = e.y || e.clientY;
      menu.style.top = (eX-sT)+'px';
      menu.style.WebkitTransition = 'initial';
      menu.style.transition = 'initial';
      menu.style.borderStyle = 'dotted';

      document.body.appendChild(noSelectStyle);
    };

    var onMouseMove = function(e) {
      var eX = e.y || e.clientY;
      var topValue = eX-sT;
      if (_this.moduleName === 'youtube' && topValue < 50) {
        topValue = 50;
      } else
      if (topValue < 0) {
        topValue = 0;
      }
      menu.style.top = _this.style.menu.initial.top = topValue+'px';
    };

    var onStartTimer = function(e) {
      isStart = true;
      initIcon(e);
      document.body.addEventListener('mousemove', onMouseMove);
    };

    menu.addEventListener('dragstart', function(e) {
      e.preventDefault();
    });
    menu.addEventListener('mousedown', function(e) {
      if (e.target !== _this.icon) {
        return;
      }
      isStart = false;
      startTimer = setTimeout(onStartTimer.bind(null, e), 500);
      var ml = function () {
        clearTimeout(startTimer);
        mono.off(menu, 'mouseleave', ml);
      };
      mono.on(menu, 'mouseleave', ml);
      document.body.addEventListener('mouseup', function mu() {
        clearTimeout(startTimer);
        document.body.removeEventListener('mouseup', mu);
        mono.off(menu, 'mouseleave', ml);
        if (isStart) {
          setTimeout(rbIcon, 100);
          document.body.removeEventListener('mousemove', onMouseMove);
          mono.storage.set({gmIconTop: parseInt(_this.style.menu.initial.top)});
        }
      });
    });
  },

  setStyle: function(element, style)
  {
    if(this[element] && this.style[element] && this.style[element][style])
      SaveFrom_Utils.setStyle(this[element], this.style[element][style]);
  },

  setElementsStyle: function(style)
  {
    if(!style)
      return;

    var elements = ['menu', 'icon'];

    for(var i = 0; i < elements.length; i++)
      this.setStyle(elements[i], style);
  },

  setEnabled: function(enabled)
  {
    this.enabled = enabled;
    this.setElementsStyle(this.enabled ? 'enabled' : 'disabled');
  },

  showTag: function()
  {
    this.setElementsStyle('tag');
  },

  toggleMenuItems: function()
  {
    return _menu.active ? _menu.hideMenuItems() : _menu.showMenuItems();
  },

  remove: function()
  {
    if(_menu.menu)
      _menu.menu.parentNode.removeChild(_menu.menu);

    // _menu.removeTooltip();
  },

  menuHTML: 'PHN0eWxlIHR5cGU9InRleHQvY3NzIj4KLnNmLW1lbnUtY29udGFpbmVyIHsKICAgIHdpZHRoOiA0ODJweDsKICAgIGZvbnQ6IDEycHgvMTdweCBUYWhvbWEsIEhlbHZldGljYSwgT3BlblNhbnMsIHNhbnMtc2VyaWY7CiAgICBjb2xvcjogIzAwMDsKICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7CiAgICBtYXJnaW46IDA7CiAgICBib3gtc2l6aW5nOiBpbmhlcml0OwogICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgIGZsZXgtZGlyZWN0aW9uOiBpbml0aWFsOwogfQouc2YtbWVudS1jb250YWluZXIgPiAqIHsKICAgIGJveC1zaXppbmc6IGluaGVyaXQ7CiAgICBmbGV4LWRpcmVjdGlvbjogaW5pdGlhbDsKfQouc2YtbWVudS1jb250YWluZXIgcCB7CiAgICBmb250LXNpemU6IDEycHg7Cn0KLnNmLW1lbnUtY29udGFpbmVyIGRpdi5zZi1tZW51LWxpc3QsCi5zZi1tZW51LWNvbnRhaW5lciBkaXYuc2YtbWVudS1kZXNjIHsKICAgIGRpc3BsYXk6IGlubGluZS1ibG9jazsKICAgIHZlcnRpY2FsLWFsaWduOiB0b3A7CiAgICBmbG9hdDogbGVmdDsKfQouc2YtbWVudS1jb250YWluZXIgZGl2LnNmLW1lbnUtZGVzYyB7CiAgICB3aWR0aDogMTY2cHg7CiAgICBwYWRkaW5nOiAyMHB4IDMwcHg7CiAgICBwYWRkaW5nLWJvdHRvbTogMzZweDsKICAgIGNvbG9yOiAjNmE2YTZhOwp9Ci5zZi1tZW51LWNvbnRhaW5lciBkaXYuc2YtbWVudS1kZXNjIGEgewogICAgdGV4dC1kZWNvcmF0aW9uOiBub25lOwogICAgY29sb3I6ICM0QTkwRTI7Cn0KLnNmLW1lbnUtY29udGFpbmVyIGRpdi5zZi1tZW51LWRlc2MgYTpub3QoLnNvY2lhbC1idG4pOmhvdmVyIHsKICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOwp9Ci5zZi1tZW51LWNvbnRhaW5lciAuc2YtbWVudS1kZXNjIC5pY29uIHsKICAgIHdpZHRoOiA3NHB4OwogICAgaGVpZ2h0OiA3NHB4OwogICAgZGlzcGxheTogaW5saW5lLWJsb2NrOwogICAgYmFja2dyb3VuZC1zaXplOiA3NHB4OwogICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsKICAgIGJhY2tncm91bmQtcG9zaXRpb246IGNlbnRlcjsKICAgIHBhZGRpbmc6IDA7CiAgICBtYXJnaW46IDA7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWRlc2MgLnZlcnNpb24gewogICAgdmVydGljYWwtYWxpZ246IHRvcDsKICAgIGRpc3BsYXk6IGlubGluZS1ibG9jazsKICAgIGZsb2F0OiByaWdodDsKICAgIG1hcmdpbi1yaWdodDogLTMwcHg7CiAgICB3aWR0aDogMTEwcHg7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWRlc2MgLnZlcnNpb24gPiBzcGFuLAouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtZGVzYyAudmVyc2lvbiA+IGEgewogICAgZGlzcGxheTogYmxvY2s7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWRlc2MgLmljb24gcGF0aCB7CiAgICBmaWxsOiAjY2NjY2NjICFpbXBvcnRhbnQ7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWRlc2MgLnRpdGxlIHsKICAgIGZvbnQtc2l6ZTogMjBweDsKICAgIGxpbmUtaGVpZ2h0OiAxLjI7CiAgICBmb250LXdlaWdodDogbm9ybWFsOwogICAgbWFyZ2luLXRvcDogMTRweDsKICAgIG1hcmdpbi1ib3R0b206IDE2cHg7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWRlc2MgLm1vcmUgewogICAgcG9zaXRpb246IGFic29sdXRlOwogICAgYm90dG9tOiA0MHB4Owp9Ci5zZi1tZW51LWNvbnRhaW5lciAuc2YtbWVudS1saXN0IHsKICAgIGhlaWdodDogMzQ4cHg7CiAgICB3aWR0aDogMjQzcHg7CiAgICBmb250LXNpemU6IDE0cHg7CiAgICBwYWRkaW5nOiAxNHB4IDZweDsKICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI0Q4RDhEODsKfQouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuc2VwYXJhdG9yIHsKICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjRDhEOEQ4OwogICAgbWFyZ2luLXRvcDogMTBweDsKICAgIG1hcmdpbi1ib3R0b206IDlweDsKICAgIG1hcmdpbi1sZWZ0OiA1OXB4Owp9Ci5zZi1tZW51LWNvbnRhaW5lciAuc2YtbWVudS1saXN0IC5pdGVtIHsKICAgIGhlaWdodDogNDBweDsKICAgIGN1cnNvcjogcG9pbnRlcjsKICAgIGJvcmRlci1yYWRpdXM6IDVweDsKICAgIG1hcmdpbi10b3A6IC0ycHg7CiAgICBtYXJnaW4tYm90dG9tOiAtMnB4OwogICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgIGRpc3BsYXk6IGJsb2NrOwp9Cgouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuaXRlbSAuaWNvbiB7CiAgICBtYXJnaW46IDA7CiAgICBtYXJnaW4tbGVmdDogMThweDsKICAgIHdpZHRoOiAyNHB4OwogICAgaGVpZ2h0OiAyNHB4OwogICAgbWFyZ2luLWJvdHRvbTogOHB4OwogICAgbWFyZ2luLXRvcDogOHB4OwogICAgZmxvYXQ6IGxlZnQ7CiAgICBkaXNwbGF5OiBibG9jazsKICAgIHBhZGRpbmc6IDA7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWxpc3QgLml0ZW0gLmxhYmVsIHsKICAgIHBhZGRpbmctbGVmdDogMThweDsKICAgIHBhZGRpbmctcmlnaHQ6IDE4cHg7CiAgICBsaW5lLWhlaWdodDogNDBweDsKICAgIGZvbnQtc2l6ZTogMTRweDsKICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7CiAgICB3aWR0aDogMTY1cHg7CiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7CiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsKICAgIG92ZXJmbG93OiBoaWRkZW47Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWxpc3QgLml0ZW0gLmxhYmVsLmRibCB7CiAgICBsaW5lLWhlaWdodDogbm9ybWFsOwogICAgcGFkZGluZy10b3A6IDJweDsKICAgIHdoaXRlLXNwYWNlOiBub3JtYWw7CiAgICBoZWlnaHQ6IDQwcHg7Cn0KLnNmLW1lbnUtY29udGFpbmVyLm5vLXBvbGwgLnNmLW1lbnUtbGlzdCBkaXZbZGF0YS1hY3Rpb249Im9wZW5Qb2xsIl0gewogICAgZGlzcGxheTogbm9uZTsKfQouc2YtbWVudS1jb250YWluZXIubm8tcG9sbCAuc2YtbWVudS1saXN0IC5pdGVtIC5pY29uIHsKICAgIG1hcmdpbi1ib3R0b206IDEwcHg7CiAgICBtYXJnaW4tdG9wOiAxMHB4Owp9Ci5zZi1tZW51LWNvbnRhaW5lci5uby1wb2xsIC5zZi1tZW51LWxpc3QgLml0ZW0gewogICAgaGVpZ2h0OiA0NHB4Owp9Ci5zZi1tZW51LWNvbnRhaW5lci5uby1wb2xsIC5zZi1tZW51LWxpc3QgLml0ZW0gLmxhYmVsIHsKICAgIGxpbmUtaGVpZ2h0OiA0NHB4Owp9Cgouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuaXRlbTpob3ZlciB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNTk3QTlFOwogICAgY29sb3I6ICNmZmY7Cn0KCi5zZi1tZW51LWNvbnRhaW5lciAuc2YtbWVudS1saXN0IC5pdGVtLmluYWN0aXZlIHsKICAgIG9wYWNpdHk6IDAuNTsKICAgIGN1cnNvcjogZGVmYXVsdDsKfQouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuaXRlbS5pbmFjdGl2ZSAuaWNvbiBwYXRoIHsKICAgIGZpbGw6ICNjMmMyYzIgIWltcG9ydGFudDsKfQouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuaXRlbS5pbmFjdGl2ZTpob3ZlciB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOwogICAgY29sb3I6ICMwMDA7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWxpc3QgLmljb25bZGF0YS10eXBlPSJzaG93QWJvdXRQYWdlIl0gewogICAgdmlzaWJpbGl0eTogaGlkZGVuOwp9Cgouc2YtbWVudS1jb250YWluZXIgLnNmLW1lbnUtbGlzdCAuc0J0biB7CiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1tZW51LWxpc3QgLnNCdG46aG92ZXIgewogICAgdGV4dC1kZWNvcmF0aW9uOiBub25lOwp9Cgouc2YtbWVudS1jb250YWluZXIgLnNvY2lhbC1ibG9jayB7CiAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICBib3R0b206IDIwcHg7CiAgICBoZWlnaHQ6IDE2cHg7CiAgICBjdXJzb3I6IGRlZmF1bHQ7CiAgICBmbGV4LWRpcmVjdGlvbjogaW5pdGlhbDsKfQouc2YtbWVudS1jb250YWluZXIgLnNvY2lhbC1idG4gewogICAgZGlzcGxheTogaW5saW5lLWJsb2NrOwogICAgd2lkdGg6IDE2cHg7CiAgICBoZWlnaHQ6IDE2cHg7CiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7CiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0OwogICAgZmxvYXQ6IGluaXRpYWw7CiAgICBtYXJnaW46IGluaXRpYWw7CiAgICBwYWRkaW5nOiBpbml0aWFsOwogICAgbGlzdC1zdHlsZTogaW5pdGlhbDsKfQouc2YtbWVudS1jb250YWluZXIgLnNvY2lhbC1idG46aG92ZXIgewogICAgb3BhY2l0eTogMC44Owp9Ci5zZi1tZW51LWNvbnRhaW5lciAuc29jaWFsLWJ0bi52ayB7CiAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQUFYTlNSMElBcnM0YzZRQUFBQVJuUVUxQkFBQ3hqd3Y4WVFVQUFBQUpjRWhaY3dBQURzTUFBQTdEQWNkdnFHUUFBQUFZZEVWWWRGTnZablIzWVhKbEFIQmhhVzUwTG01bGRDQTBMakF1TTR6bWwxQUFBQUdXU1VSQlZEaFBuWkRiSzhOaEdNZmZmMGJHV3BKU1NpMkhNa3hDYm9UazFNZ2hod3RpWTJ0TklTSnphQmVhYUU2NVdFSklzaHZhaFNLVGNtN01LVVVPbDErLzUrMm52Vzl5c1gzclU4L3o5UGxldkM4enVYMzZ4bW4vUWJQYmowaWdEblZaNVlRdlZEQ3dnMnpIVmtSUWg3b3MxNzZCTE50NlZGQ1haWnE5RUNrYjNvWnJNL0NIdXNrOXlmdUZwWFVzUTZUTnRZdi8wanUzTDdrRTA3ZDVJTkxpM0ZSMVlHekpoODZKVmJ4L2Z2UGRmM1ludVFSTGJYSkRwSGwwamN1VXhtRXZVa3hUQ0Z3OThIMWw5MWh5Q1paaWNpbFNtSVloTDVjcHA5ZFBPTDE1NW5QdzhSWHA5VTdKSlZoeTFUaEU2dnRYZUlFU3VMekgvdkVsM2o2KytMN3RQNWRjZ2lXVmowREU1RmprTXFYR09nTmRrUld0QXd2cUJTanQ4VWcrU3l3WmhFaXQzYU9xNERQZGJGUGhmNm0xejBzK1N5anVnMGlOZFZaVmdaTUw1UWxIVitvRzNJWmVvQ3UwU1Q3VEZkcVZZNWhxaTF2VjVhenZIU0t6d2lHNUJOUG1XeUVTWit4R1RFYlRIMkt6MmhHZlo1RmNnbWx5dW9QeFJndWlnYnBNYXpRYk5JYk9rQ2FuU3psRWdOTFJHczJHSHpha21tb012bHFnQUFBQUFFbEZUa1N1UW1DQyk7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zb2NpYWwtYnRuLm9rIHsKICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBQVlkRVZZZEZOdlpuUjNZWEpsQUhCaGFXNTBMbTVsZENBMExqQXVNNHptbDFBQUFBSUxTVVJCVkRoUGxkRlBhTk5RSEFmd2R4ZGFxeE5CVktRTzhhSWdlQkpsNEdrTUJObHd5STVlTnhCQnlSaFRoNGlYSFJSY3hkbE5KcU5PVVFaRDNjU3BQYVRneGxBMlVKelMya01uYlpPdWFiTDhiWnA4ell0VjM1dW4vZUJEeUkvdjk1RkhpSlhwYkhNV3p5ODZTejNZa3FCRHU4UVV6eFN0OThkaHpSLyt5LzdRQlU5S3czZXE4STBDM053b3JMZEh1UXp0MEM2eFhoK0JOUmNzbXV4M3ArQlpFdWo0WGlOODBuSHpLUzRYQ3JyRW5Ea0VsdjE1T0N4b2hReFdVMjM0OGZJQ3ZMb0p2K0hBZW5PYXkxTEVmTjRLbHI0NkZSNVFGb2VnUGoySVNpb091NW9MZC9wOE41ZWxpUGs0RHBhY0ZzS3dxK1JnaTMyb0w5K21kNEZyS2xDZUJQZmVsQ2ZHeEg2d1N2Y1BRTXVMNFNIc0ZGNWRodlp3SDVlbGlKSGNDNVk1ZVF6NUJ5ZXhObmNWdGErenFIeWFRamJWQTNuaUJJenhPSmVsaUo3WUE1YW5GdUFaTXJTRkVaUm1Ma0thRldCOWV3RUVmOFJadXN0bEtiSnhaemRZeXNwMDg2UDVjZlYxVktaN3VTeEZOb1ozZ1pXOTFvTHZpUTdVYThWbUZWai8rQXhmaGxwUnZObkNaU21pM2RxSnpZeUZaTFA2ZXhxYUJIMnk2NzhjUmJRYk84Q3lNNG13NU5rNnN2ZTZVVTZQaHUrKzY4QVk2K0N5RkZHdmJ3ZXJsaG1IVS8ySjdNZzVsQVppeUYySlFoSWZ3ZFZrS01telhKWWl5dUMyTlhVd2lqK3lseUpZNll1aUpQQzc1ZDRveXYzL2RoVHRFbG1JdGF2OWthSTZFTUdXQkIxWmlMWC9BdTRBOHNuQy9penlBQUFBQUVsRlRrU3VRbUNDKTsKfQouc2YtbWVudS1jb250YWluZXIgLnNvY2lhbC1idG4uZmIgewogICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFBWWRFVllkRk52Wm5SM1lYSmxBSEJoYVc1MExtNWxkQ0EwTGpBdU00em1sMUFBQUFGSlNVUkJWRGhQbFl2Qks0TnhHTWVmZjhWbUNVblRldHRZdmFXdEpwbUptbUpvT0FsSEIxc3lTM0lRMGZZbWpGNXAyOEVPbEt5MG1WWjIyR2tYTnhkWlVRN0tjYjY4UC8xVzl2YStiL3ZVNS9KOG5pOEZvby9pWEtSY21vK1cwWXpLUnRtU2Y3VllkUzNrNFp5OWEwcGxvMnhKREdiUk4zMnI2K0JpRGpmRlZ6dzlmOWIxTHVlaGJNa3hlUVVqUzVVM05PSmJ5ckpHd3ZnbDlMUlBaRkNyZmJQUis4Y1h0ZzRMV0QvSVFaekpzRTYyc1JUMEZQeHBObFpJWGxkZ0hUNkIxWmVBYlRUSk92V015RENTYzVRdXF4cDFEeDFEU3owOHdSVDdvYTRCQ1ZycTRRN0k3SWM2M2Z2UTB0SWJZbklrdVZDL2RiajIyQSsxOSsvQVNJNTBYa1Jqb3paeEcwWnk0dktEcXBIRnVRa2pPZkd6ZTFXalZzY0dqT1RFVHZPcVJtWWgvR0sycjBGUFRpeVIrOTkrdDJRU3dwNFdXNmhxRWtMUWNpVnl3ZlJPN2RadmY1dXc1d2RlTjNEcjMwN1JXQUFBQUFCSlJVNUVya0pnZ2c9PSk7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zb2NpYWwtYnRuLnR3IHsKICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBQVlkRVZZZEZOdlpuUjNZWEpsQUhCaGFXNTBMbTVsZENBMExqQXVNNHptbDFBQUFBSEtTVVJCVkRoUG5kRFBTeFJoSEFidzl5K1pYVFdYTUltUWhBVEprMlFHQ1I2N0NPR2xicDNzNHRtN3FXaUpibVZKRWtZZUREb3MrNE5Ld3hRcS9JSEZidTF1cXpJejZPek92dS9PN3M3VCszM2QwY1dXWVAzQ0I5Nlo5M25tSFY1MloxTjBEV3c3cXdNN0R1b2lPOVJsL2Q5NDV2cUdRUHVYUWwyb1ExMTI3WE1CVjFmUGg3cXM3YU1BNlY0cm9HUGxlRjJ0VDU0VU1jdEljaGV6cVJJR3Z4ZHdWL0wyMlpVb0I1bEtPTmpNbHRINVFhaG4waWI5enBkeGRxYmpweGwyT2NSQmh0WXR0WGtnWEl6SVMrcUtDZHorSk5TNzZqRkZDYjBoVTNVSWEzMmZCK2tMSCtLQUZ5c3h3SkVIWi9pL3AyL29ISmZlV2FwRFdNdHlIdVRCV3I0UytmKzhqZHNxNzJFWGwyeVF3R3NkTDdhUFVITGRTclQyM0k4YUt1OWhnVGM1ZUFaRFJpVldlM1pNZ2NBci9TUlBXUE5DRHA0TEx3MDhqT3pqVCs3MExyd3BsbDNjV2t5ZlpEMnNhVDRMY21QWnhyMFl4L2hYR3ptNndhcEpaeDMwTHliUk9HZXFiRFhXTkNjWDBzMGxDOCszT0g1WlJaaThoSlRsSUp5d01Tei9xT1Z4SEkxQlErWE9ZZzNQTEJEL3JBSGZaQXJhMkU5b283dlFIdjJBTnBHQS84a2VHcDRlcVV3dFRKczVUUG1EOGdQblFGMm1CZlVlMzdTVjhjMVlxSXZzYUVHOTV5L0VDeU4wVW9VdmNRQUFBQUJKUlU1RXJrSmdnZz09KTsKfQouc2YtbWVudS1jb250YWluZXIgLnNvY2lhbC1idG4ubGogewogICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFBWWRFVllkRk52Wm5SM1lYSmxBSEJoYVc1MExtNWxkQ0EwTGpBdU00em1sMUFBQUFGNFNVUkJWRGhQWS9qLy96OERnMEdZS0l0dStsSW0vYlEvYkFZWi81bjAwN2N6YVNSS2dPUUlZUWFRUXFERzJ4NWV4Zi83a212L1QwaXAvZS9zVmY2ZlNTZmpCakdHTUFBMWIvUUVhZ1pwTEUzdisyK1h1LzUvVU1PZS94N1pNNGt5QkdUQUg1RE5aZW05L3kxek4vMC9ldVVsVVB6Ly95dDNYL3hYQ3V3amFBZ0RrMDdheng2Z0FRNjVhLzl2MkgvMS8vc1BILy9YTHpyMzM3MTIvLy84UmZmKys5VnV4bXNJQTR0T3hudzc5OUwvN3VXYi81ODVjK1ovOXNTRC8xMHFkLzJmY2VMMy81a24vNEl4UGtNWUdEWERlSUNoZnN3NHJPWC9qS1diLzFzWDdQaHZrYnY1ZjBqN0lhSU1BUk13UXhUOU8vODdsQUZkVUgwU2JFaG94MkdDaHNCTmdoc1NPQlZzQUY1RDlETDJZaGhBaWlFT2VVdi9zK2hsQUxXZ0dRRENZRU4wMGcrakcrSll1dlcvU2ZvYU9NWnBBQWhqTXdTazZmK0ZLWENNMXdBUVJqZUVaQU5BR0dRSWkzYkdIRG0vaVNnR1RPeHFBaHNBaWcyc0d0RXhTREUyRE1xMVdEVVF3aUNibVhRemRqRnF4cW9BQUpUV2RFcXI1K2NRQUFBQUFFbEZUa1N1UW1DQyk7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zb2NpYWwtYnRuLm1haWxydSB7CiAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQUFYTlNSMElBcnM0YzZRQUFBQVJuUVUxQkFBQ3hqd3Y4WVFVQUFBQUpjRWhaY3dBQURzTUFBQTdEQWNkdnFHUUFBQUFZZEVWWWRGTnZablIzWVhKbEFIQmhhVzUwTG01bGRDQTBMakF1TTR6bWwxQUFBQUtJU1VSQlZEaFBsZEpiU0pOaEhBYnc5L3ZtWVVUaVJYUVhoamhuM2RoeWJsUHhMTG1aRTZZb096Z2RVNWZUZVpqWnRDblpZVXZTWlp0VVdPbkllU3Fqc2lBSXVpZ0w2WUJYWFVUUVRUZVdlRk4wd0tpYnAvZDlYWkoxNWNVUHR2LzdQUC8zKzlpSXdyOVlvRHl6OUVycGY0NXRvUjNXSlhMdms5V0Vsb2VRTkR6WUZ0WmhYU0p0dUErSmJXRUxqWHNFd1dFalhvNm40OFcxQXdnTW1aSFpHZnd2eDdwRVlwM0hIenR0MDdnVktzR3Ztd1RQeHRJeGVOcUFFVjhGM29UMzh0bE1zQlE3Nm1jMzh3eVJtS2JCeEpzbjhlaXlHaXVSUkNqcWppSFZlZ0ttTGlkS1hOMlFHZ0xRTnJmZzA0eUloZEU4eEppbmVJY2hZblVZVEVOUE03OUZadXBGazhlQjlSc0VieWYyOElXdngyVllDR2JEM21IaG1RcDNOKzh3UkRTTWdWbStJa1BrYkE0VTluNGVLclkzUVR6a1E1enVGSzc2OHZrc3JiWWZkd01adUhNK2kzY1lJdXBEWU5ibkNHd3VFNFpQSHNiaWFCckVzaUUrRi9WQkpGVjU4RzJXUUc3cGc3ZEhqN1dwdU9oWmlDN1EwU0QxbFFic2JTWU05cFZ1TElqT21lU2E0L2hPTDVBYlBmQjV0Zmc0S2QwOEkrd3htY2VoVk53ZXpvQzhzaFUvNmVPV05UWHllVUw1QU9iUHFmZ3I3S3QyWSttaURIUCtESDdHRUxGNEFJeWh2cHFIOGl5TktLK3R3bG9rQnU4bWRtTTFFbytub3luNGNGMktld0VGeitRYnJiekRFTEhBQzBiSTdVWjQ0Q0MvdmM1UmlmMWxWbWhOVmRBWWpOaFY2RUJmWnlIZWh4UFIxVm9FSWMvRE93d1JjK21YS0VIZEN2L1JiUHlnUCtIbmFmcG5vamN2WDByQ2x4bUNGSzBkUXVZUkNGbnRtM21HQ0RsZDJFTGxSSEtSRVk3R0VvUjZWYmpRbzBLTlJZdjQzUGF0dVNnaXFOdFdoS3dPdXZrdm1qYStTRkE2TnJEUC8yWVkyaVd4R3FkT3lIU3RDbW9YSFd3RDdjUnFuTHJmV0VRUEN3NlorV2NBQUFBQVNVVk9SSzVDWUlJPSk7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zb2NpYWwtYnRuLmdwIHsKICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBQVlkRVZZZEZOdlpuUjNZWEpsQUhCaGFXNTBMbTVsZENBMExqQXVNNHptbDFBQUFBSWZTVVJCVkRoUGxkTC9TeE5oSEFmdzU0K1JxWTBjazJDVTdPWk0yYm0rTEtOaUVTaE55b2F4b2dUSnZvQVdWQVlKQlVYOUVCUlJFb3FsWTRxYTFrcmRwV3pPdVZXMmxsdkxVMnVyT1hWbTJidTdCN3gyeVFvZmVCM1A1LzN3K2ZEY2NXVHlTcFV1Y3RYR0NiQk9uTmhMUWcwSCtZa2FFOTdZRE9zaTlvaTk1TzNwL1poKzJvNTNUY2Z3OGZFZExIK05RVnlwNlUrSWUxeUl0TjZFdjdwRWtwcmxwWDNBVmdyeVl5R0p3STB6OEJ6U1k5akNZTUMyQzR1eHo1am5vK0NPYnNlSWtJMVZGVW5FUEwwbTM1TnplRldoaGFleWtISUxEZU4zcjlGYnpMem9sdkpWeWFtSXJDYkw4M01ZRVFha2MxbU5kRUFpL0I3Kzg0ZnBQdE1pNG1QOGdoV3VBMXNrbkdVclBaeHlPZkhTckVIYkRyVWtFUTdKYWpvZzduTmowTHdaQS9zMGxMK3hGaitYbHVDc0taZXlWWWx3VUZhVHdjWTZwT0pmRUhNUFlmU1VCYjc2YXN4eXo5RnpvZ0s5cG53NGQyK1MrZlpoUWxZVHV6RVA5NHVWNkN4bkViaGVUNjgrMUhBY1hkdFU2TitwWHVOaGlWSldrMTZqQ3FLdTBqeDRtODdSQVRIaGxmckxORFQvSDlKalZNTjc5Z2lDdHk5aHNxTVp2MVpXNkpCazhEV2U3V1hRYmRqNFQyUXhHc2FvOE5GYTJIemNZeFM0VmFoRVg1MFZLZUZuV29pRTBGZFdnTTdpRFJrUlIrVWVQTkFxMEtIUGhhTW9GM1pCc3pZYnJXWUR2WTN2NGttYVowSWVGV1JGN2Jwcy9LMUZHRHJqSFlibmN1MmFzeit5b3NUQnF0aDJSc0VMa002dXk2SC8vUk1USTh2VDhHMzZIUFkzV0ZLaUFmZ1I1ODhBQUFBQVNVVk9SSzVDWUlJPSk7Cn0KCi5zZi1tZW51LWNvbnRhaW5lciAuc2YtY2hlY2tib3ggewogICAgZmxvYXQ6IGxlZnQ7CiAgICBkaXNwbGF5OiBibG9jazsKCiAgICBwYWRkaW5nLXRvcDogMTJweDsKICAgIHBhZGRpbmctbGVmdDogMTZweDsKICAgIHBhZGRpbmctYm90dG9tOiAxMnB4OwoKICAgIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7CiAgICAtbW96LXVzZXItc2VsZWN0OiBub25lOwogICAgdXNlci1zZWxlY3Q6IG5vbmU7Cn0KCi5zZi1tZW51LWNvbnRhaW5lci5uby1wb2xsIC5zZi1jaGVja2JveCB7CiAgICBwYWRkaW5nLXRvcDogMTRweDsKfQoKLnNmLW1lbnUtY29udGFpbmVyIC5zZi1jaGVja2JveCA+IGkgewogICAgd2lkdGg6IDI0cHg7CiAgICBoZWlnaHQ6IDE0cHg7CiAgICBkaXNwbGF5OiBibG9jazsKICAgIHBhZGRpbmc6IDA7CgogICAgYm9yZGVyLXdpZHRoOiAxcHg7CiAgICBib3JkZXItc3R5bGU6IHNvbGlkOwogICAgYm9yZGVyLXJhZGl1czogOHB4OwogICAgcG9zaXRpb246IHJlbGF0aXZlOwoKICAgIGJvcmRlci1jb2xvcjogIzc4QzQzNTsKICAgIGJhY2tncm91bmQtY29sb3I6ICM3OEM0MzU7Cn0KLnNmLW1lbnUtY29udGFpbmVyIC5zZi1jaGVja2JveCA+IGkgPiBpIHsKICAgIGRpc3BsYXk6IGJsb2NrOwogICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsKICAgIGJvcmRlci13aWR0aDogMXB4OwogICAgYm9yZGVyLXN0eWxlOiBzb2xpZDsKICAgIGJvcmRlci1yYWRpdXM6IDhweDsKCiAgICBoZWlnaHQ6IDEycHg7CiAgICB3aWR0aDogMTJweDsKICAgIGJvcmRlci1jb2xvcjogIzc4QzQzNTsKICAgIG1hcmdpbi1sZWZ0OiAxMHB4OwoKICAgIHRyYW5zaXRpb246IG1hcmdpbi1sZWZ0IDAuMnM7CiAgICAtby10cmFuc2l0aW9uOiBub25lOwp9Ci5zZi1tZW51LWNvbnRhaW5lciAuaW5hY3RpdmUgLnNmLWNoZWNrYm94Om5vdCguZW5hYmxlRm9yY2UpID4gaSwKLnNmLW1lbnUtY29udGFpbmVyIC5zZi1jaGVja2JveC5kaXNhYmxlZCA+IGkgewogICAgYm9yZGVyLWNvbG9yOiAjQkUzRjJFOwogICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsKfQouc2YtbWVudS1jb250YWluZXIgLmluYWN0aXZlIC5zZi1jaGVja2JveDpub3QoLmVuYWJsZUZvcmNlKSA+IGkgPiBpLAouc2YtbWVudS1jb250YWluZXIgLnNmLWNoZWNrYm94LmRpc2FibGVkID4gaSA+IGkgewogICAgaGVpZ2h0OiAxNHB4OwogICAgd2lkdGg6IDE0cHg7CiAgICBib3JkZXItY29sb3I6ICNCRTNGMkU7CiAgICBtYXJnaW46IC0xcHg7Cn0KPC9zdHlsZT4KPGRpdiBjbGFzcz0ic2YtbWVudS1kZXNjIj4KICAgICAgICA8ZGl2IGNsYXNzPSJpY29uLWJvZHkiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpY29uIj48L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0idmVyc2lvbiI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0idGl0bGUiPjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImRlc2MiPjwvZGl2PgogICAgICAgIDxhIGhyZWY9IiMiIGNsYXNzPSJtb3JlIiB0YXJnZXQ9Il9ibGFuayIgZGF0YS1pMThuPSJyZWFkTW9yZSI+TGVhcm4gTW9yZTwvYT4KICAgICAgICA8ZGl2IGNsYXNzPSJzb2NpYWwtYmxvY2siPgogICAgICAgICAgICA8YSBocmVmPSIjIiBjbGFzcz0ic29jaWFsLWJ0biB2ayIgdGFyZ2V0PSJfYmxhbmsiPjwvYT4KICAgICAgICAgICAgPGEgaHJlZj0iIyIgY2xhc3M9InNvY2lhbC1idG4gZmIiIHRhcmdldD0iX2JsYW5rIj48L2E+CiAgICAgICAgICAgIDxhIGhyZWY9IiMiIGNsYXNzPSJzb2NpYWwtYnRuIG9rIiB0YXJnZXQ9Il9ibGFuayI+PC9hPgogICAgICAgICAgICA8YSBocmVmPSIjIiBjbGFzcz0ic29jaWFsLWJ0biB0dyIgdGFyZ2V0PSJfYmxhbmsiPjwvYT4KICAgICAgICAgICAgPGEgaHJlZj0iIyIgY2xhc3M9InNvY2lhbC1idG4gbWFpbHJ1IiB0YXJnZXQ9Il9ibGFuayI+PC9hPgogICAgICAgICAgICA8YSBocmVmPSIjIiBjbGFzcz0ic29jaWFsLWJ0biBsaiIgdGFyZ2V0PSJfYmxhbmsiPjwvYT4KICAgICAgICAgICAgPGEgaHJlZj0iIyIgY2xhc3M9InNvY2lhbC1idG4gZ3AiIHRhcmdldD0iX2JsYW5rIj48L2E+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNmLW1lbnUtbGlzdCI+CiAgICAgICAgPGRpdiBjbGFzcz0iaXRlbSBib29rbWFya2xldCIgZGF0YS1hY3Rpb249ImRvd25sb2FkRnJvbUN1cnJlbnRQYWdlIj4KICAgICAgICAgICAgPHN2ZyBjbGFzcz0iaWNvbiIgZGF0YS10eXBlPSJkb3dubG9hZEZyb21DdXJyZW50UGFnZSIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAwIDI0IDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTMsNy42OTY4MTQzNSBMMywxNS4zODAxMDg3IEMzLDE2LjIzMjI2NjUgMy42ODM0OTY1OSwxNi45MjMwNzY5IDQuNDkzMDk2MzUsMTYuOTIzMDc2OSBMMTYuNTA2OTAzNiwxNi45MjMwNzY5IEMxNy4zMzAwOTYyLDE2LjkyMzA3NjkgMTcuOTk3Njk0MywxNi4yNTE3MzQ0IDE3Ljk5OTk5NCwxNS4zODQ2MTU0IEwxOS41LDE1LjM4NDYxNTQgTDE5LjUsMTMuODQ2MTUzOCBMMjEsMTMuODQ2MTUzOCBMMjEsMTYuOTM1MzU4NCBDMjEsMTguNjE1MTEzNiAxOS42NTI5MTk3LDIwIDE3Ljk5MTIxMiwyMCBMMy4wMDg3ODc5OSwyMCBDMS4zNDU1OTAxOSwyMCAwLDE4LjYyNzkxMzIgMCwxNi45MzUzNTg0IEwwLDYuMTQxNTY0NjQgQzAsNC40NjE4MDk0OSAxLjM0NzA4MDI3LDMuMDc2OTIzMDggMy4wMDg3ODc5OSwzLjA3NjkyMzA4IEw5LDMuMDc2OTIzMDggTDksNC42MTUzODQ2MiBMNy41LDQuNjE1Mzg0NjIgTDcuNSw2LjE1Mzg0NjE1IEw0LjQ5MzA5NjM1LDYuMTUzODQ2MTUgQzMuNjY4NDgyMDEsNi4xNTM4NDYxNSAzLDYuODI3NTA5NzcgMyw3LjY5NjgxNDM1IFogTTE2LjUsNC42MzM4ODk3NSBMMTYuNSwwIEwyNCw2LjkyMzA3NjkyIEwxNi41LDEzLjg0NjE1MzggTDE2LjUsOS4yNDU5MDk3OSBDMTEuMzk0Mzg1Myw5LjQ1MjcxOTg0IDcuMjE5MTMwODIsMTEuNzU1NTM1NiA2LjIyNTA0MDczLDE0Ljc2OTIzMDggQzYuMDc3NDY4MDcsMTQuMjIyNDI5MyA2LDEzLjY1NjQ4MDcgNiwxMy4wNzY5MjMxIEM2LDguNTkzMjk2MTYgMTAuNjM2NDgxMiw0LjkyNDE2NDc5IDE2LjUsNC42MzM4ODk3NSBaIiBpZD0iU2hhcmUiIGZpbGw9IiMwMDAwMDAiPjwvcGF0aD4KICAgICAgICAgICAgPC9zdmc+CiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJsYWJlbCIgZGF0YS1pMThuPSJkb3dubG9hZEZyb21DdXJyZW50UGFnZSI+R28gdG8gU2F2ZUZyb20ubmV0PC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImJvb2ttYXJrbGV0IHNlcGFyYXRvciI+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iaXRlbSBtb2R1bGUgdmsgb2Rub2tsYXNzbmlraSBmYWNlYm9vayBsbSB5b3V0dWJlIGRhaWx5bW90aW9uIGluc3RhZ3JhbSBydXR1YmUiIGRhdGEtYWN0aW9uPSJ1cGRhdGVMaW5rcyI+CiAgICAgICAgICAgIDxzdmcgY2xhc3M9Imljb24iIGRhdGEtdHlwZT0idXBkYXRlTGlua3MiIHdpZHRoPSIyMnB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyMiAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0yMS4yMzA3NjkyLDEzLjcxNDI4NTcgQzIxLjIzMDc2OTIsMTkuMzk0OTI5MSAxNi40NzgwOTk5LDI0IDEwLjYxNTM4NDYsMjQgQzQuNzUyNjY5MjksMjQgMCwxOS4zOTQ5MjkxIDAsMTMuNzE0Mjg1NyBDMCw4LjAzMzY0MjI5IDQuNzUyNjY5MjksMy40Mjg1NzE0MyAxMC42MTUzODQ2LDMuNDI4NTcxNDMgTDEwLjYxNTM4NDYsNi44NTcxNDI4NiBDNi43MDY5MDc3Myw2Ljg1NzE0Mjg2IDMuNTM4NDYxNTQsOS45MjcxOTAxIDMuNTM4NDYxNTQsMTMuNzE0Mjg1NyBDMy41Mzg0NjE1NCwxNy41MDEzODEzIDYuNzA2OTA3NzMsMjAuNTcxNDI4NiAxMC42MTUzODQ2LDIwLjU3MTQyODYgQzE0LjUyMzg2MTUsMjAuNTcxNDI4NiAxNy42OTIzMDc3LDE3LjUwMTM4MTMgMTcuNjkyMzA3NywxMy43MTQyODU3IEwyMS4yMzA3NjkyLDEzLjcxNDI4NTcgTDIxLjIzMDc2OTIsMTMuNzE0Mjg1NyBaIE0xMC42MTUzODQ2LDEwLjI4NTcxNDMgTDEwLjYxNTM4NDYsMCBMMTkuNDYxNTM4NSw1LjE0Mjg1NzE0IEwxMC42MTUzODQ2LDEwLjI4NTcxNDMgWiIgaWQ9IlJlZnJlc2giIGZpbGw9IiMwMDAwMDAiPjwvcGF0aD4KICAgICAgICAgICAgPC9zdmc+CiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJsYWJlbCIgZGF0YS1pMThuPSJ1cGRhdGVMaW5rcyI+UmVmcmVzaCBsaW5rczwvc3Bhbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJpdGVtIG1vZHVsZSB2ayBvZG5va2xhc3NuaWtpIG1haWxydSIgZGF0YS1hY3Rpb249ImRvd25sb2FkTVAzRmlsZXMiPgogICAgICAgICAgICA8c3ZnIGNsYXNzPSJpY29uIiBkYXRhLXR5cGU9ImRvd25sb2FkTVAzRmlsZXMiIHdpZHRoPSIyMXB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyMSAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0yMSwyLjc2OTIzMDc3IEwyMSwxNy42NDg3Mjg4IEMyMSwxNy42NDg3Mjg4IDIxLDE3LjY0ODcyODggMjEsMTcuNjQ4NzI4OCBMMjEsMTguNDYxNTM4NSBMMjAuOTA2ODcyOSwxOC40NjE1Mzg1IEMyMC43MjM1OTUsMTkuMjcxMjI0OSAyMC4yNzE2MDEzLDIwLjA4NjU3OTEgMTkuNTY2OTI5NiwyMC43NjgwMTk4IEMxNy45MjAzNTM3LDIyLjM2MDMxMyAxNS41MTc2ODk2LDIyLjYxODQ3NDcgMTQuMjAwNDI4OSwyMS4zNDQ2NDAyIEMxMi44ODMxNjgyLDIwLjA3MDgwNTYgMTMuMTUwMTMwOSwxNy43NDczNTAzIDE0Ljc5NjcwNjgsMTYuMTU1MDU3MSBDMTYuMDYwMjUxNiwxNC45MzMxNjc2IDE3Ljc2OTAzMjQsMTQuNDk2OTA1MSAxOS4wOTA5MDkxLDE0LjkzNTY4MTYgTDE5LjA5MDkwOTEsMTQuOTM1NjgxNiBMMTkuMDkwOTA5MSw0LjE1Mzg0NjE1IEw3LjYzNjM2MzY0LDYuOTIzMDc2OTIgTDcuNjM2MzYzNjQsMTkuNDk0ODgyNiBDNy42MzYzNjM2NCwxOS40OTQ4ODI2IDcuNjM2MzYzNjQsMTkuNDk0ODgyNiA3LjYzNjM2MzY0LDE5LjQ5NDg4MjYgTDcuNjM2MzYzNjQsMjAuMzA3NjkyMyBMNy41NDMyMzY1LDIwLjMwNzY5MjMgQzcuMzU5OTU4NTksMjEuMTE3Mzc4OCA2LjkwNzk2NDkzLDIxLjkzMjczMjkgNi4yMDMyOTMyMywyMi42MTQxNzM3IEM0LjU1NjcxNzMyLDI0LjIwNjQ2NjkgMi4xNTQwNTMyOCwyNC40NjQ2Mjg2IDAuODM2NzkyNTUyLDIzLjE5MDc5NCBDLTAuNDgwNDY4MTczLDIxLjkxNjk1OTUgLTAuMjEzNTA1NTAxLDE5LjU5MzUwNDEgMS40MzMwNzA0MSwxOC4wMDEyMTA5IEMyLjY5NjYxNTIzLDE2Ljc3OTMyMTQgNC40MDUzOTYwMSwxNi4zNDMwNTkgNS43MjcyNzI3MywxNi43ODE4MzU0IEw1LjcyNzI3MjczLDE2Ljc4MTgzNTQgTDUuNzI3MjcyNzMsNi40NjE1Mzg0NiBMNS43MjcyNzI3MywzLjY5MjMwNzY5IEwyMSwwIEwyMSwyLjc2OTIzMDc3IFoiIGlkPSJNdXNpYy0yIiBmaWxsPSIjMDAwMDAwIj48L3BhdGg+CiAgICAgICAgICAgIDwvc3ZnPgogICAgICAgICAgICA8c3BhbiBjbGFzcz0ibGFiZWwiIGRhdGEtaTE4bj0iZG93bmxvYWRNUDNGaWxlcyI+RG93bmxvYWQgYXVkaW8gZmlsZXM8L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iaXRlbSBtb2R1bGUgdmsgb2Rub2tsYXNzbmlraSBwbFlvdXR1YmUgbWFpbHJ1IiBkYXRhLWFjdGlvbj0iZG93bmxvYWRQbGF5bGlzdCI+CiAgICAgICAgICAgIDxzdmcgY2xhc3M9Imljb24iIGRhdGEtdHlwZT0iZG93bmxvYWRQbGF5bGlzdCIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDI0IDE4IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTAsMCBMMCwzLjYgTDMuNDI4NTcxNDMsMy42IEwzLjQyODU3MTQzLDAgTDAsMCBaIE0wLDcuMiBMMCwxMC44IEwzLjQyODU3MTQzLDEwLjggTDMuNDI4NTcxNDMsNy4yIEwwLDcuMiBaIE01LjE0Mjg1NzE0LDAgTDUuMTQyODU3MTQsMy42IEwyNCwzLjYgTDI0LDAgTDUuMTQyODU3MTQsMCBaIE01LjE0Mjg1NzE0LDcuMiBMNS4xNDI4NTcxNCwxMC44IEwyMC41NzE0Mjg2LDEwLjggTDIwLjU3MTQyODYsNy4yIEw1LjE0Mjg1NzE0LDcuMiBaIE0wLDE0LjQgTDAsMTggTDMuNDI4NTcxNDMsMTggTDMuNDI4NTcxNDMsMTQuNCBMMCwxNC40IFogTTUuMTQyODU3MTQsMTQuNCBMNS4xNDI4NTcxNCwxOCBMMjIuMjg1NzE0MywxOCBMMjIuMjg1NzE0MywxNC40IEw1LjE0Mjg1NzE0LDE0LjQgWiIgaWQ9IkJ1bGxldC1MaXN0IiBmaWxsPSIjMDAwMDAwIj48L3BhdGg+CiAgICAgICAgICAgIDwvc3ZnPgogICAgICAgICAgICA8c3BhbiBjbGFzcz0ibGFiZWwiIGRhdGEtaTE4bj0iZG93bmxvYWRQbGF5bGlzdCI+RG93bmxvYWQgYSBwbGF5bGlzdDwvc3Bhbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJpdGVtIG1vZHVsZSB2ayIgZGF0YS1hY3Rpb249ImRvd25sb2FkUGhvdG9zIj4KICAgICAgICAgICAgPHN2ZyBjbGFzcz0iaWNvbiIgZGF0YS10eXBlPSJkb3dubG9hZFBob3RvcyIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMThweCIgdmlld0JveD0iMCAwIDI0IDE4IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5LjUsMyBMMjEuMDA4OTA5NiwzIEMyMi42NTgyMjk0LDMgMjQsNC4zNDI4ODcxOCAyNCw1Ljk5OTQyMjQ4IEwyNCwxNS4wMDA1Nzc1IEMyNCwxNi42NTU2NDkzIDIyLjY2MDg0MzIsMTggMjEuMDA4OTA5NiwxOCBMMi45OTEwOTA0MiwxOCBDMS4zNDE3NzA2MywxOCAwLDE2LjY1NzExMjggMCwxNS4wMDA1Nzc1IEwwLDUuOTk5NDIyNDggQzAsNC4zNDQzNTA3MyAxLjMzOTE1Njc5LDMgMi45OTEwOTA0MiwzIEw3LjUsMyBDNy41LDEuMzQ2NTE3MTIgOC44NDE4NzA2NywwIDEwLjQ5NzE1MiwwIEwxNi41MDI4NDgsMCBDMTguMTU4Mzc3MiwwIDE5LjUsMS4zNDMxNDU3NSAxOS41LDMgTDE5LjUsMyBaIE0xMy41LDE2LjUgQzE2LjgxMzcwODcsMTYuNSAxOS41LDEzLjgxMzcwODcgMTkuNSwxMC41IEMxOS41LDcuMTg2MjkxMzQgMTYuODEzNzA4Nyw0LjUgMTMuNSw0LjUgQzEwLjE4NjI5MTMsNC41IDcuNSw3LjE4NjI5MTM0IDcuNSwxMC41IEM3LjUsMTMuODEzNzA4NyAxMC4xODYyOTEzLDE2LjUgMTMuNSwxNi41IFogTTEzLjUsMTUgQzE1Ljk4NTI4MTUsMTUgMTgsMTIuOTg1MjgxNSAxOCwxMC41IEMxOCw4LjAxNDcxODUgMTUuOTg1MjgxNSw2IDEzLjUsNiBDMTEuMDE0NzE4NSw2IDksOC4wMTQ3MTg1IDksMTAuNSBDOSwxMi45ODUyODE1IDExLjAxNDcxODUsMTUgMTMuNSwxNSBaIiBpZD0iQ2FtZXJhLTIiIGZpbGw9IiMwMDAwMDAiPjwvcGF0aD4KICAgICAgICAgICAgPC9zdmc+CiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJsYWJlbCIgZGF0YS1pMThuPSJkb3dubG9hZFBob3RvcyI+RG93bmxvYWQgcGljdHVyZXM8L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0ibW9kdWxlIHZrIG9kbm9rbGFzc25pa2kgZmFjZWJvb2sgbG0gc2VwYXJhdG9yIj48L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJpdGVtIiBkYXRhLWFjdGlvbj0icmVwb3J0QnVnIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0iaWNvbiI+PC9kaXY+PHNwYW4gY2xhc3M9ImxhYmVsIiBkYXRhLWkxOG49InJlcG9ydEJ1ZyI+UmVwb3J0IGEgYnVnPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9Iml0ZW0iIGRhdGEtYWN0aW9uPSJzaG93T3B0aW9ucyI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9Imljb24iPjwvZGl2PjxzcGFuIGNsYXNzPSJsYWJlbCIgZGF0YS1pMThuPSJzaG93T3B0aW9ucyI+T3B0aW9uczwvc3Bhbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJpdGVtIiBkYXRhLWFjdGlvbj0ib3BlblBvbGwiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpY29uIj48L2Rpdj48c3BhbiBjbGFzcz0ibGFiZWwiIGRhdGEtaTE4bj0ib3BlblBvbGwiPkJlY29tZSBiZXR0ZXI8L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iaXRlbSBlbmFibGVNb2R1bGUiIGRhdGEtYWN0aW9uPSJlbmFibGVNb2R1bGUiPgogICAgICAgICAgICA8aSBjbGFzcz0ic2YtY2hlY2tib3giPjxpPjxpPjwvaT48L2k+PC9pPgogICAgICAgICAgICA8c3BhbiBpZD0iZGlzYWJsZU1vZHVsZSIgY2xhc3M9ImxhYmVsIiBkYXRhLWkxOG49ImRpc2FibGVNb2R1bGUiPkRpc2FibGUgbW9kdWxlPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgc3R5bGU9ImRpc3BsYXk6IG5vbmU7IiBkYXRhLWFjdGlvbj0ic2hvd0Fib3V0UGFnZSI+CiAgICAgICAgICAgIDxzdmcgY2xhc3M9Imljb24iIGRhdGEtdHlwZT0ic2hvd0Fib3V0UGFnZSIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDE2IDE2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Im0zLjA5LC43MTljMCwuODUxIDAsMS43MTEgMCwyLjU2MS0uNjcsMC0xLjM0LDAtMi4wMSwwIDEuMDcsMS4wNyAyLjE1LDIuMTUgMy4yMiwzLjIyIDAtMS45MyAwLTMuODUgMC01Ljc4MS0uNDIsMC0uODMsMC0xLjI1LDB6bTEuOTEsMGMuMDQsMi4wOTEgLjA0LDQuMTkxIC4wNCw2LjI4MS0xLjY3LDAtMy4zMywwLTUsMCAyLjY3LDIuNzcgNS4zMyw1LjUgOCw4LjMgMi43LTIuOCA1LjMtNS41MyA4LTguMy0xLjcsMC0zLjMsMC01LDAgMC0yLjA5IDAtNC4xOSAwLTYuMjgxLTIsMC00LDAtNiwwem02LjcsMGMwLDEuOTMxIDAsMy44NTEgMCw1Ljc4MSAxLjEtMS4wNyAyLjEtMi4xNSAzLjItMy4yMi0uNywwLTEuMywwLTIsMCAwLS44NSAwLTEuNzEgMC0yLjU2MS0uNCwwLS44LDAtMS4yLDB6Ii8+PC9zdmc+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4=',

  getMenu: function() {
    var code = atob(this.menuHTML);
    var menu = document.createElement('div');
    menu.classList.add('sf-menu-container');
    menu.setAttribute(this.activeDataAttr, '1');
    menu.style.marginTop = '-24px';
    menu.innerHTML = code;
    return menu;
  },

  showMenuItems: function()
  {
    if(this.active)
      return;

    this.menu.style.top = this.style.menu.initial.top;

    this.removeActiveItems();

    var menu = this.getMenu();
    if(menu) {
      this.menu.appendChild(menu);
      _menu.initMenu(this.menu);
    }

    this.active = true;
    this.setElementsStyle('active');

    document.addEventListener('click', this.onDocumentClick, false);
    document.addEventListener('keydown', this.onDocumentKeyDown, false);

    var menuHeight = this.menu.clientHeight;
    var menuTop = parseInt(this.menu.style.top);
    var winHeight = window.innerHeight;
    if (menuTop + menuHeight > winHeight) {
      this.menu.style.top = ( winHeight - menuHeight - 4 ) + 'px'
    } else
    if (menuTop < 0) {
      this.menu.style.top = '0px';
    }
  },

  hideMenuItems: function()
  {
    this.menu.style.top = this.style.menu.initial.top;

    // this.removeTooltip();
    this.removeActiveItems();
    document.removeEventListener('click', this.onDocumentClick, false);
    document.removeEventListener('keydown', this.onDocumentKeyDown, false);

    this.active = false;
    this.showTag();
  },

  onDocumentClick: function(event)
  {
    var node = event.target;
    if(node != _menu.menu && !SaveFrom_Utils.isParent(node, _menu.menu))
    {
      _menu.hideMenuItems();
    }
  },

  onDocumentKeyDown: function(event)
  {
    if(event.keyCode == 27)
    {
      _menu.hideMenuItems();
    }
  },

  removeActiveItems: function()
  {
    var e = null;
    while(e = this.menu.querySelector('div[' + this.activeDataAttr + ']'))
    {
      e.parentNode.removeChild(e);
    }
  }
};
/////////////////////////////////////////////////
// OPTIONS
_options = {
  classPrefix: 'sfh--',
  dataAttr: 'data-sfh-option',
  html: 'PHN0eWxlIHR5cGU9InRleHQvY3NzIj4KLnNmaC0tb3B0aW9uc3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyOm5vbmU7Zm9udDoxM3B4LzEgQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7d2lkdGg6NTgwcHg7bWFyZ2luOjA7cGFkZGluZzo5cHg7dGV4dC1hbGlnbjpsZWZ0fS5zZmgtLW9wdGlvbnMgLnNmaC0tdGl0bGV7Zm9udC1zaXplOjEuM2VtO21hcmdpbjowIDAgMS4zZW0gMH0KLnNmaC0tb3B0aW9ucyBmb3Jte21hcmdpbjowO3BhZGRpbmc6MH0KLnNmaC0tb3B0aW9ucyBpbnB1dFt0eXBlPSJjaGVja2JveCJdIHttaW4td2lkdGg6IDEycHg7IG1pbi1oZWlnaHQ6IDEycHh9Ci5zZmgtLW9wdGlvbnMgbGFiZWx7ZGlzcGxheTpibG9jazttYXJnaW46LjJlbSAwO3BhZGRpbmc6MDt0ZXh0LWFsaWduOmxlZnQ7Zm9udC1zaXplOiAxM3B4O30KLnNmaC0tb3B0aW9ucyAuc2ZoLS1pbmxpbmUtY29udGVudCBsYWJlbHtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tbGVmdDoxMHB4fQouc2ZoLS1vcHRpb25zIC5zZmgtLWZsZWZ0e2Zsb2F0OmxlZnR9Ci5zZmgtLW9wdGlvbnMgLnNmaC0tZmwtY29sdW1ue2Zsb2F0OmxlZnQ7bWFyZ2luLXJpZ2h0OjIwcHh9Ci5zZmgtLW9wdGlvbnMgLnNmaC0tY2xlYXJ7Y2xlYXI6Ym90aDtoZWlnaHQ6MDtmb250LXNpemU6MDtsaW5lLWhlaWdodDowfQouc2ZoLS1vcHRpb25zIC5zZmgtLWJsb2Nre2JvcmRlci10b3A6MXB4IHNvbGlkICNkZmUxZTg7cGFkZGluZzoxLjVlbSAwIDAgMDttYXJnaW46MS41ZW0gMCAwIDA7bWluLXdpZHRoOjE2MHB4fQouc2ZoLS1vcHRpb25zIC5zZmgtLWJsb2NrLXRpdGxle2ZvbnQtd2VpZ2h0OmJvbGQ7bWFyZ2luLWJvdHRvbTouNWVtfQouc2ZoLS1vcHRpb25zIC5zZmgtLW1vZHVsZXtmb250LXdlaWdodDpib2xkO21hcmdpbi10b3A6MWVtfS5zZmgtLW9wdGlvbnMgLnNmaC0tbW9kdWxlOmZpcnN0LWNoaWxke21hcmdpbi10b3A6MH0KLnNmaC0tb3B0aW9ucyAuc2ZoLS1tb2R1bGVfb3B0aW9uc3tmb250LXNpemU6LjllbTtmb250LXdlaWdodDpub3JtYWw7bWFyZ2luLWxlZnQ6MmVtfQoKPC9zdHlsZT4KPGRpdiBjbGFzcz0ic2ZoLS1vcHRpb25zIj4KICA8ZGl2IGNsYXNzPSJzZmgtLXRpdGxlIiBkYXRhLWkxOG49Im9wdGlvbnNUaXRsZSI+U2F2ZUZyb20ubmV0IEhlbHBlciAtIFByZWZlcmVuY2VzPC9kaXY+CgogIDxmb3JtPgogICAgPGRpdiBjbGFzcz0ic2ZoLS1ibG9jayI+CiAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0iYnV0dG9uIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49InNob3dCdXR0b24iPlNob3cgZXh0ZW5zaW9uIGJ1dHRvbjwvc3Bhbj48L2xhYmVsPgogICAgPC9kaXY+CgogICAgPGRpdiBjbGFzcz0ic2ZoLS1ibG9jayI+CiAgICAgIDxkaXYgZGF0YS1pMThuPSJvcHRpb25zSGFuZGxlTGlua3MiIGNsYXNzPSJzZmgtLWJsb2NrLXRpdGxlIj5IYW5kbGUgbGlua3M8L2Rpdj4KICAgICAgPGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJsbUZpbGVIb3N0aW5nIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNGaWxlSG9zdGluZ3MiPlRvIGZpbGVob3N0aW5nczwvc3Bhbj48L2xhYmVsPgogICAgICA8bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249ImxtTWVkaWFIb3N0aW5nIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNNZWRpYUhvc3RpbmdzIj5UbyBtZWRpYWhvc3RpbmdzPC9zcGFuPjwvbGFiZWw+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJzZmgtLWJsb2NrIj4KICAgICAgPGRpdiBkYXRhLWkxOG49Im9wdGlvbnNNb2R1bGVzIiBjbGFzcz0ic2ZoLS1ibG9jay10aXRsZSI+TW9kdWxlczwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJzZmgtLXlvdXR1YmVfYm94IiBjbGFzcz0ic2ZoLS1tb2R1bGUiPjxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0ibW9kdWxlWW91dHViZSIgY2hlY2tlZD0iMSI+Jm5ic3A7PHNwYW4gZGF0YS1pMThuPSJvcHRpb25zWW91dHViZSI+WW91VHViZTwvc3Bhbj48L2xhYmVsPgogICAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlX29wdGlvbnMiPgogICAgICAgICAgPGRpdiBjbGFzcz0ic2ZoLS1mbC1jb2x1bW4iPjxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc1lUSGlkZUxpbmtzIj5IaWRlIGxpbmtzPC9zcGFuPjo8L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9InNmaC0tZmxlZnQgc2ZoLS1pbmxpbmUtY29udGVudCI+CiAgICAgICAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0ieXRIaWRlRkxWIiBjaGVja2VkPSIwIj4mbmJzcDtGTFY8L2xhYmVsPgogICAgICAgICAgICA8bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Inl0SGlkZU1QNCIgY2hlY2tlZD0iMCI+Jm5ic3A7TVA0PC9sYWJlbD4KICAgICAgICAgICAgPGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJ5dEhpZGVXZWJNIiBjaGVja2VkPSIxIj4mbmJzcDtXZWJNPC9sYWJlbD4KICAgICAgICAgICAgPGJyPgogICAgICAgICAgICA8bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Inl0SGlkZTNHUCIgY2hlY2tlZD0iMSI+Jm5ic3A7M0dQPC9sYWJlbD4KICAgICAgICAgICAgPGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJ5dEhpZGUzRCIgY2hlY2tlZD0iMSI+Jm5ic3A7M0Q8L2xhYmVsPgogICAgICAgICAgICA8bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Inl0SGlkZU1QNE5vQXVkaW8iIGNoZWNrZWQ9IjEiPiZuYnNwO01QNCZuYnNwOyhubyZuYnNwO2F1ZGlvKTwvbGFiZWw+CiAgICAgICAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0ieXRIaWRlQXVkaW9fTVA0IiBjaGVja2VkPSIxIj4mbmJzcDtBdWRpbzwvbGFiZWw+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9InNmaC0tY2xlYXIiPjwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZURhaWx5bW90aW9uIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNEYWlseW1vdGlvbiI+RGFpbHltb3Rpb248L3NwYW4+PC9sYWJlbD48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZVZpbWVvIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNWaW1lbyI+VmltZW88L3NwYW4+PC9sYWJlbD48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZUZhY2Vib29rIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNGYWNlYm9vayI+RmFjZWJvb2s8L3NwYW4+PC9sYWJlbD48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZVNvdW5kY2xvdWQiIGNoZWNrZWQ9IjEiPiZuYnNwOzxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc1NvdW5kY2xvdWQiPlNvdW5kQ2xvdWQ8L3NwYW4+PC9sYWJlbD48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZVZrb250YWt0ZSIgY2hlY2tlZD0iMSI+Jm5ic3A7PHNwYW4gZGF0YS1pMThuPSJvcHRpb25zVmtvbnRha3RlIj5WSzwvc3Bhbj48L2xhYmVsPgogICAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlX29wdGlvbnMiPjxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0idmtTaG93Qml0cmF0ZSIgY2hlY2tlZD0iMCI+Jm5ic3A7PHNwYW4gZGF0YS1pMThuPSJvcHRpb25zQml0cmF0ZSI+U2hvdyBiaXRyYXRlIGluc3RhbnRseTwvc3Bhbj48L2xhYmVsPjwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZU9kbm9rbGFzc25pa2kiIGNoZWNrZWQ9IjEiPiZuYnNwOzxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc09kbm9rbGFzc25pa2kiPk9kbm9rbGFzc25pa2k8L3NwYW4+PC9sYWJlbD48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9InNmaC0tbW9kdWxlIj48bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249Im1vZHVsZU1haWxydSIgY2hlY2tlZD0iMSI+Jm5ic3A7PHNwYW4gZGF0YS1pMThuPSJvcHRpb25zTWFpbHJ1Ij5NYWlsLnJ1PC9zcGFuPjwvbGFiZWw+PC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJzZmgtLW1vZHVsZSI+PGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJtb2R1bGVJbnN0YWdyYW0iIGNoZWNrZWQ9IjEiPiZuYnNwOzxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc0luc3RhZ3JhbSI+SW5zdGFncmFtPC9zcGFuPjwvbGFiZWw+PC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJzZmgtLW1vZHVsZSI+PGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJtb2R1bGVSdXR1YmUiIGNoZWNrZWQ9IjEiPiZuYnNwOzxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc1J1dHViZSI+UnV0dWJlPC9zcGFuPjwvbGFiZWw+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNmaC0tYmxvY2sgYmxvY2tVbW15SW5mbyI+CiAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0ic2hvd1VtbXlJbmZvIiBjaGVja2VkPSIxIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNTaG93VW1teUluZm8iPlNob3cgVW1teSBpbmZvIHBvcHVwPC9zcGFuPjwvbGFiZWw+CiAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT0iY2hlY2tib3giIGRhdGEtc2ZoLW9wdGlvbj0ic2hvd1VtbXlCdG4iIGNoZWNrZWQ9IjEiPiZuYnNwOzxzcGFuIGRhdGEtaTE4bj0ib3B0aW9uc1Nob3dVbW15QnRuIj5TaG93IHRoZSBVbW15IGJ1dHRvbjwvc3Bhbj48L2xhYmVsPgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJzZmgtLWJsb2NrIGJsb2NrR21OYXRpdmVEb3dubG9hZCIgc3R5bGU9ImRpc3BsYXk6IG5vbmU7Ij4KICAgICAgPGxhYmVsPjxpbnB1dCB0eXBlPSJjaGVja2JveCIgZGF0YS1zZmgtb3B0aW9uPSJnbU5hdGl2ZURvd25sb2FkIiBjaGVja2VkPSIwIj4mbmJzcDs8c3BhbiBkYXRhLWkxOG49Im9wdGlvbnNHbU5hdGl2ZURvd25sb2FkIj5BZHZhbmNlZCBkb3dubG9hZCBtb2RlPC9zcGFuPjwvbGFiZWw+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNmaC0tYmxvY2sgYmxvY2tTb3ZldG5pa0VuYWJsZWQiPgogICAgICA8bGFiZWw+PGlucHV0IHR5cGU9ImNoZWNrYm94IiBkYXRhLXNmaC1vcHRpb249InNvdmV0bmlrRW5hYmxlZCIgY2hlY2tlZD0iMSI+Jm5ic3A7PHNwYW4gZGF0YS1pMThuPSJvcHRpb25zU292ZXRuaWtFbmFibGVkIj5FbmFibGUgc292ZXRuaWs8L3NwYW4+PC9sYWJlbD4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0ic2ZoLS1jbGVhciI+PC9kaXY+CiAgPC9mb3JtPgo8L2Rpdj4=',

  translate: function(parent) {
    parent = parent || document;
    var e_list = parent.querySelectorAll('*[data-i18n]');
    for(var i = 0, len = e_list.length; i < len; i++)
    {
      var el = e_list[i];
      el.textContent = engine.language[el.dataset.i18n];
    }
  },

  onCbChange: function(event) {
    var el = event.target;
    var key = el.getAttribute(_options.dataAttr);
    mono.sendMessage({action: 'updateOption', key: key, value: el.checked ? 1 : 0 });
  },

  init: function(preference) {
    var parent = document.querySelector('.sfh--options');

    if(!parent)
      return;

    if(!mono.global.hasSovetnik) {
      var sovBlock = parent.querySelector('.blockSovetnikEnabled');
      if (sovBlock) {
        sovBlock.style.display = 'none';
      }
    }

    if (!preference.showUmmyItem) {
      var ummyBlock = parent.querySelector('.blockUmmyInfo');
      if (ummyBlock) {
        ummyBlock.style.display = 'none';
      }
    }

    _options.translate(parent);

    var c = parent.querySelectorAll('form input[type="checkbox"]');
    for(var i = 0; i < c.length; i++) {
      var el = c[i];
      var name = el.getAttribute(_options.dataAttr);
      if(name && preference[name] !== undefined) {
        el.checked = preference[name] !== 0;
        el.addEventListener('change', _options.onCbChange, false);
      }
    }

    if (typeof GM_download !== 'undefined') {
      var blockGmNativeDownload = parent.querySelector('.blockGmNativeDownload');
      if (blockGmNativeDownload) {
        blockGmNativeDownload.style.display = 'block';
      }
    }
  },

  hideBlock: function(name, hide) {
    var node = document.querySelector('.' + _options.classPrefix + name);
    if(node)
      node.style.display = hide ? 'none' : '';
  },

  show: function()
  {
    var height = document.body.clientHeight || 0;
    if (height > 600) {
      height = 600;
    }
    SaveFrom_Utils.popupDiv(function(cnt) {
      cnt.innerHTML = atob(_options.html);
    }, null, 640, height);
    mono.initGlobal(function(resp) {
      mono.global.hasSovetnik = resp.hasSovetnik;
      _options.init(mono.global.preference);
    }, ['hasSovetnik']);
  }
};

  _languageList.de = {
 "extName": {"message": "SaveFrom.net Helfer"},
 "extDescription": {"message": "Laden Sie von YouTube, Facebook, VK.com und mehr als 40 anderen Seiten mit einem Klick herunter."},

 "extNameLite": {"message": "SaveFrom.net Helfer Lite"},
 "extDescriptionLite": {"message": "Herunterladen von Facebook, VK.com und mehr als 40 weiteren Seiten mit einem Klick herunter."},

 "lang": {"message": "de"},

 "titleDefault": {"message": "SaveFrom.net Helfer"},
 "titleDesabled": {"message": "SaveFrom.net Helfer deaktiviert"},

 "menuEnable": {"message": "Aktivieren"},
 "menuDisable": {"message": "Deaktivieren"},

 "showButton": {"message": "Erweiterungs Knopf anzeigen"},

 "copy": {"message": "Kopie"},
 "download": {"message": "Herunterladen"},
 "downloadTitle": {"message": "Klicken Sie den Link während Sie die Alt/Einstellung oder Ctrl/Strg Taste drücken zum Herunterladen der Dateien."},
 "noLinksFound": {"message": "Keine Links wurden gefunden"},
 "more": {"message": "Mehr"},
 "close": {"message": "Schließen"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "without audio"},
 "size": {"message": "größe"},

 "subtitles": {"message": "Untertitel"},
 "playlist": {"message": "Wiedergabliste"},
 "filelist": {"message": "List of files"},
 "downloadWholePlaylist": {"message": "Die komplette Wiedergabliste herunterladen"},

 "getFileSizeTitle": {"message": "Dateigröße bestimmen" },
 "getFileSizeFailTitle": {"message": "Fehler bei bestimmung der Dateigröße. Bitte versuchen Sie es erneut."},

 "lmButtonTitle": {"message": "Holen Sie sich einen direkten Link."},

 "downloadFromCurrentPage": {"message": "Zu SaveFrom.net"},
 "updateLinks": {"message": "Links aktualisieren"},
 "updateLinksNotification": {"message": "Links aktualisiert"},
 "downloadMP3Files": {"message": "Download Audiodateien"},
 "downloadPlaylist": {"message": "Download Playlist"},
 "downloadPhotos": {"message": "Download Bilder"},
 "installFullVersion": {"message": "Install full version"},
 "disable": {"message": "Deaktivieren"},
 "showOptions": {"message": "Einstellungen"},
 "reportBug": {"message": "Fehler melden"},
 "openPoll": {"message": "Become better"},
 "disableModule": {"message": "Auf dieser Webseite deaktivieren"},
 "enableModule": {"message": "Auf dieser Webseite aktivieren"},
 "enableDisableModule": {"message": "Ein/Aus auf dieser Webseite"},
 "showHideButton": {"message": "Erweitern Ein-/Ausblenden"},
 "updateTo": {"message": "Update auf %d"},

 "aboutPage": {"message": "Über"},
 "aboutTitle": {"message": "SaveFrom.net Helfer"},
 "aboutVersion": {"message": "Version"},
 "aboutDescription": {"message": "Hilft den Nutzern direkte Links zu Herunterladen von mehr als 40 Webseiten, inklusive Dailymotion.com, YouTube.com, VK.com und weiteren zu bekommen."},
 "aboutDescriptionLite": {"message": "Hilft den Nutzern direkte Links zu Herunterladen von mehr als 40 Webseiten, inklusive Dailymotion.com, VK.com und weiteren zu bekommen."},
 "aboutSupported": {"message": "Unterstützte Ressourcen"},
 "homePage": {"message": "Homepage"},

 "optionsTitle": {"message": "SaveFrom.net Helfer - Einstellungen"},
 "optionsHandleLinks": {"message": "Links handhaben"},
 "optionsFileHostings": {"message": "Zu Dateihoster"},
 "optionsMediaHostings": {"message": "Zu Medienhoster"},
 "optionsModules": {"message": "Module"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Links ausblenden"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Bitrate sofort zeigen"},
 "optionsSovetnikEnabled": {"message": "Advisor"},
 "optionsShowUmmyInfo": {"message": "Tipps für UVD einblenden"},
 "optionsGmNativeDownload": {"message": "Erweiterter Download-Modus"},
 "optionsShowUmmyBtn": {"message": "Schaltfläche Ummy anzeigen"},

 "menuDownloadFromCurrentPage": {"message": "Laden Sie die Dateien mit SaveFrom.net von der aktuellen Seite"},
 "menuUpdateLinks": {"message": "Hier klicken, wenn die Download-Taste nicht erscheint"},
 "menuDownloadMP3Files": {"message": "Alle auf dieser Seite gefundenen Audiodateien herunterladen"},
 "menuDownloadPlaylist": {"message": "Playliste mit den Links zu den Audiodateien generieren und downloaden"},
 "menuDownloadPhotos": {"message": "Alle auf der aktuellen Seite gefundenen Bilder herunterladen"},
 "menuReportBug": {"message": "Schreiben Sie uns, wenn Probleme auftreten"},
 "menuShowOptions": {"message": "AN/AUS unterstützte Ressourcen und Helperoptionen"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": ""},

 "quality": {"message": "Qualität"},
 "qualityNote": {"message": "Wenn es nicht um Qualität geht, wird das nächste verfügbare Video heruntergeladen."},
 "filelistTitle": {"message": "Die Liste der gefundenen dateien"},
 "filelistInstruction": {"message": "['Zum Herunterladen aller datien kopieren Sie die liste der Links in Ihren ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'Download Manager'}},'. Wenn Sie noch keinen Download Manager haben we empfehlen wir Ihnen die Installation des ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "playlistTitle": {"message": "Wiedergabliste"},
 "playlistInstruction": {"message": "Zur Wiedergabe Ihrer gespeicherten Wiedergabliste kann es nun mit einem Musik-Player geöffnet werden."},

 "ummySfTitle": {"message": "HD oder MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' mithilfe von Ummy herunterladen']"},
 "ummyMenuInfo": {"message": "['Ein Video mit dem kostenlosen ',{a:{href:'{url}',target:'_blank',text:'Ummy Video Downloader'}},' herunterladen']"},
 "warningPopupTitle": {"message": "Überprüfen Sie die Browsereinstellungen"},
 "warningPopupDesc": {"message": "Die Option \"Jedes Mal nachfragen, wo eine Datei gespeichert werden soll\" muss deaktiviert sein."},
 "readMore": {"message": "Mehr"},
 "noWarning": {"message": "Nicht benachrichtigen"},
 "cancel": {"message": "Abbrechen"},
 "continue": {"message": "Fortsetzen"},
 "beforeDownloadPopupWarn": {"message": "Achtung! Der Download kann nicht abgebrochen oder angehalten werden."},

 "vkInfo": {"message": "Info"},
 "vkInfoTitle": {"message": "Dateigröße und Bitrate"},
 "vkMp3LinksNotFound": {"message": "Links zu MP3 Dateien wurden nicht gefunden"},
 "vkPhotoLinksNotFound": {"message": "Photos are not found"},
 "vkDownloadPhotoAlbum": {"message": "Album herunterladen"},
 "vkDownloadAllPhotoAlbums": {"message": "Alle Alben herunterladen"},
 "vkFoundPhotos": {"message": "Gefundene Fotos"},
 "vkNotAvailablePhotos": {"message": "%d Foto(s) vorübergehend nicht verfügbar"},
 "vkFoundLinks": {"message": "Gefundene Links"},
 "vkFoundOf": {"message": "von"},
 "vkShowAs": {"message": "Zeigen als"},
 "vkListOfLinks": {"message": "Liste der Links"},
 "vkListOfLinksInstruction": {"message": "['Um alle Fotos herunterzuladen, kopieren Sie die Links aus der Liste und fügen Sie diese in Ihren ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'Download Manager'}},' ein. Wenn Sie noch keinen Download Manager haben we empfehlen wir Ihnen die Installation des ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "vkTableOfThumbnails": {"message": "Tabelle der Thumbnails"},
 "vkListOfPhotos": {"message": "Liste der Fotos"},
 "vkListOfPhotosInstruction": {"message": "Klicken Sie auf ein Foto um es herunterzuladen."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "B"},
 "vkFileSizeKByte": {"message": "kB"},
 "vkFileSizeMByte": {"message": "MB"},
 "vkFileSizeGByte": {"message": "GB"},
 "vkFileSizeTByte": {"message": "TB"},
 "vkDownloadFromYoutube": {"message": "['Herunterladen: Öffnen Sie ',{a:{href:'{url}',text:'die Video Seite'}},' und drücken Sie den \"Herunterladen\" Knopf über dem Video-Spieler']"},
 "vkFoundFiles": {"message": "Dateien gefunden: %d"},

 "shareIn": {"message": "In %w teilen"},
 "socialDesc": {"message": "Der SaveFrom.net Helper ermöglicht es Ihnen Dateien YouTube.com, Facebook.com, VK.com und mehr als 40 andere Seiten mit einem Klick herunterzuladen"}
};
_languageList.en = {
 "extName": {"message": "SaveFrom.net helper"},
 "extDescription": {"message": "Download YouTube, Facebook, VK.com and 40+ sites in one click."},

 "extNameLite": {"message": "SaveFrom.net helper lite"},
 "extDescriptionLite": {"message": "Download Facebook, VK.com and 40+ sites in one click."},

 "lang": {"message": "en"},

 "titleDefault": {"message": "SaveFrom.net helper"},
 "titleDesabled": {"message": "SaveFrom.net helper disabled"},

 "menuEnable": {"message": "Enable"},
 "menuDisable": {"message": "Disable"},

 "showButton": {"message": "Show extension button"},

 "copy": {"message": "Copy"},
 "download": {"message": "Download"},
 "downloadTitle": {"message": "Click the link while holding Alt/Option or Ctrl key to download the file."},
 "noLinksFound": {"message": "No links were found"},
 "more": {"message": "More"},
 "close": {"message": "Close"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "without audio"},
 "size": {"message": "size"},

 "subtitles": {"message": "Subtitles"},
 "playlist": {"message": "Playlist"},
 "filelist": {"message": "List of files"},
 "downloadWholePlaylist": {"message": "Download the whole playlist"},

 "getFileSizeTitle": {"message": "Get file size" },
 "getFileSizeFailTitle": {"message": "Unable to get the file size. Please try again."},

 "lmButtonTitle": {"message": "Get a direct link"},

 "downloadFromCurrentPage": {"message": "Go to SaveFrom.net"},
 "updateLinks": {"message": "Refresh links"},
 "updateLinksNotification": {"message": "Links updated"},
 "downloadMP3Files": {"message": "Download audio files"},
 "downloadPlaylist": {"message": "Download a playlist"},
 "downloadPhotos": {"message": "Download pictures"},
 "installFullVersion": {"message": "Install full version"},
 "disable": {"message": "Disable"},
 "showOptions": {"message": "Settings"},
 "reportBug": {"message": "Report a bug"},
 "openPoll": {"message": "Become better"},
 "disableModule": {"message": "Disable on this website"},
 "enableModule": {"message": "Enable on this website"},
 "enableDisableModule": {"message": "Turn On/Off on this website"},
 "showHideButton": {"message": "Show/hide extension button"},
 "updateTo": {"message": "Update to %d"},

 "aboutPage": {"message": "About"},
 "aboutTitle": {"message": "SaveFrom.net Helper"},
 "aboutVersion": {"message": "Version"},
 "aboutDescription": {"message": "Helps users to get direct links to download from more than 40 websites, including Dailymotion.com, YouTube.com, VK.com and others."},
 "aboutDescriptionLite": {"message": "Helps users to get direct links to download from more than 40 websites, including Dailymotion.com, VK.com and others."},
 "aboutSupported": {"message": "Supported resources"},
 "homePage": {"message": "Home page"},

 "optionsTitle": {"message": "SaveFrom.net Helper - Preferences"},
 "optionsHandleLinks": {"message": "Handle links"},
 "optionsFileHostings": {"message": "To filehostings"},
 "optionsMediaHostings": {"message": "To mediahostings"},
 "optionsModules": {"message": "Modules"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Hide links"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Show bitrate instantly"},
 "optionsSovetnikEnabled": {"message": "Advisor"},
 "optionsShowUmmyInfo": {"message": "Show tips for Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Advanced download mode"},
 "optionsShowUmmyBtn": {"message": "Show the Ummy button"},

 "menuDownloadFromCurrentPage": {"message": "Download files from the current page using SaveFrom.net"},
 "menuUpdateLinks": {"message": "Press if Download button doesn't appear"},
 "menuDownloadMP3Files": {"message": "Download all audio files found on the current page"},
 "menuDownloadPlaylist": {"message": "Generates and downloads the playlist consisting of links to audio files"},
 "menuDownloadPhotos": {"message": "Download all pictures found on the current page"},
 "menuReportBug": {"message": "Let us know if you have any problems"},
 "menuShowOptions": {"message": "ON/OFF supported resources and Helper options"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "We work hard to become better. Please, give us a hand!"},

 "quality": {"message": "Quality"},
 "qualityNote": {"message": "The best available video will be downloaded If there is no chosen quality."},
 "filelistTitle": {"message": "The list of the found files"},
 "filelistInstruction": {"message": "['To download all files copy the list of links and paste it into the ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'download manager'}},'. If you do not have a download manager installed we recommend installing ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "playlistTitle": {"message": "Playlist"},
 "playlistInstruction": {"message": "To playback the saved playlist it may be now opened in the music player."},

 "ummySfTitle": {"message": "HD or MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' via Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Install Ummy Video Downloader and download your favorite videos in HD or MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'Download'}}]}},{p:{append:['After the installation, a download will be started automatically anytime you click ',{img:{src:'#'}}]}}]"},
 "warningPopupTitle": {"message": "Check browser settings"},
 "warningPopupDesc": {"message": "The option \"Always ask me where to save files\" must be turned off."},
 "readMore": {"message": "More"},
 "noWarning": {"message": "Don't notify"},
 "cancel": {"message": "Cancel"},
 "continue": {"message": "Continue"},
 "beforeDownloadPopupWarn": {"message": "Warning! Downloading cannot be canceled or suspended."},

 "vkInfo": {"message": "Info"},
 "vkInfoTitle": {"message": "File size and bitrate"},
 "vkMp3LinksNotFound": {"message": "Links to MP3 files are not found"},
 "vkPhotoLinksNotFound": {"message": "Photos are not found"},
 "vkDownloadPhotoAlbum": {"message": "Download album"},
 "vkDownloadAllPhotoAlbums": {"message": "Download all albums"},
 "vkFoundPhotos": {"message": "Found photos"},
 "vkNotAvailablePhotos": {"message": "%d photos are temporarily unavailable"},
 "vkFoundLinks": {"message": "Found links"},
 "vkFoundOf": {"message": "of"},
 "vkShowAs": {"message": "Show as"},
 "vkListOfLinks": {"message": "List of links"},
 "vkListOfLinksInstruction": {"message": "['To download all photos copy the list of links and paste it into the ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'download manager'}},'. If you do not have a download manager installed we recommend installing ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "vkTableOfThumbnails": {"message": "Table of thumbnails"},
 "vkListOfPhotos": {"message": "List of photos"},
 "vkListOfPhotosInstruction": {"message": "Click on the photo to download it."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "B"},
 "vkFileSizeKByte": {"message": "kB"},
 "vkFileSizeMByte": {"message": "MB"},
 "vkFileSizeGByte": {"message": "GB"},
 "vkFileSizeTByte": {"message": "TB"},
 "vkDownloadFromYoutube": {"message": "['Download: open ',{a:{href:'{url}',text:'the video page'}},' and press the \"Download\" button above the player']"},
 "vkFoundFiles": {"message": "Files found: %d"},

 "shareIn": {"message": "Share on %w"},
 "socialDesc": {"message": "SaveFrom.net helper enables you to download files from YouTube.com, Facebook.com, VK.com and more than 40 other just in one click for free"}
};
_languageList.es = {
 "extName": {"message": "SaveFrom.net helper"},
 "extDescription": {"message": "Descargas desde YouTube, Facebook, VK.com y 40+ sitios en un sólo clic."},

 "extNameLite": {"message": "SaveFrom.net helper lite"},
 "extDescriptionLite": {"message": "Descargas desde Facebook, VK.com y 40+ sitios en un sólo clic."},

 "lang": {"message": "es"},

 "titleDefault": {"message": "SaveFrom.net helper"},
 "titleDesabled": {"message": "SaveFrom.net helper deshabilitado"},

 "menuEnable": {"message": "Habilitar"},
 "menuDisable": {"message": "Deshabilitar"},

 "showButton": {"message": "Mostrar botón de extensión"},

 "copy": {"message": "Copiar"},
 "download": {"message": "Descargar"},
 "downloadTitle": {"message": "Haga clic en el enlace mientras presiona la tecla Alt/Opción o Ctrl para descargar el archivo."},
 "noLinksFound": {"message": "No se han encontrado enlaces"},
 "more": {"message": "Más"},
 "close": {"message": "Cerrar"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "sin audio"},
 "size": {"message": "tamaño"},

 "subtitles": {"message": "Subtítulos"},
 "playlist": {"message": "Lista de reproducción"},
 "filelist": {"message": "Lista de archivos"},
 "downloadWholePlaylist": {"message": "Descargar toda la lista de reproducción"},

 "getFileSizeTitle": {"message": "Obtener tamaño de archivo" },
 "getFileSizeFailTitle": {"message": "No se pudo obtener el tamaño del archivo. Por favor, inténtelo de nuevo."},

 "lmButtonTitle": {"message": "Obtener un enlace directo"},

 "downloadFromCurrentPage": {"message": "Ir a SaveFrom.net"},
 "updateLinks": {"message": "Actualizar enlaces"},
 "updateLinksNotification": {"message": "Enlaces actualizados"},
 "downloadMP3Files": {"message": "Descargar archivos de audio"},
 "downloadPlaylist": {"message": "Descargar una lista de reproducción"},
 "downloadPhotos": {"message": "Descargar imágenes"},
 "installFullVersion": {"message": "Instalar la versión completa"},
 "disable": {"message": "Deshabilitar"},
 "showOptions": {"message": "Ajustes"},
 "reportBug": {"message": "Informar sobre un problema"},
 "openPoll": {"message": "Mejorar"},
 "disableModule": {"message": "Desactivar en este sitio web"},
 "enableModule": {"message": "Activar en este sitio web"},
 "enableDisableModule": {"message": "Activ./Desactiv. en esta web"},
 "showHideButton": {"message": "Mostrar/ocultar botón extens"},
 "updateTo": {"message": "Actualizar a la %d"},

 "aboutPage": {"message": "Acerca de"},
 "aboutTitle": {"message": "SaveFrom.net Helper"},
 "aboutVersion": {"message": "Versión"},
 "aboutDescription": {"message": "Ayuda a los usuarios a obtener enlaces directos para descargar desde más de 40 sitios web, incluidos Dailymotion.com, YouTube.com, VK.com y otros."},
 "aboutDescriptionLite": {"message": "Ayuda a los usuarios a obtener enlaces directos para descargar desde más de 40 sitios web, incluidos Dailymotion.com, VK.com y otros."},
 "aboutSupported": {"message": "Recursos admitidos"},
 "homePage": {"message": "Página de inicio"},

 "optionsTitle": {"message": "SaveFrom.net Helper - Preferencias"},
 "optionsHandleLinks": {"message": "Manejar enlaces"},
 "optionsFileHostings": {"message": "A servidores de archivos"},
 "optionsMediaHostings": {"message": "A servidores multimedia"},
 "optionsModules": {"message": "Módulos"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Ocultar enlaces"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Mostrar velocidad de bits instantáneamente"},
 "optionsSovetnikEnabled": {"message": "Consejero"},
 "optionsShowUmmyInfo": {"message": "Muestra consejos para Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Móudlo de descarga avanzada"},
 "optionsShowUmmyBtn": {"message": "Mostrar el botón Ummy"},

 "menuDownloadFromCurrentPage": {"message": "Descargar archivos de la página actual usando SaveFrom.net"},
 "menuUpdateLinks": {"message": "Pulse si no aparece el botón Descargar"},
 "menuDownloadMP3Files": {"message": "Descargar todos los archivos de audio de la página actual"},
 "menuDownloadPlaylist": {"message": "Genera y descarga la lista de reproducción que consiste en enlaces a archivos de audio"},
 "menuDownloadPhotos": {"message": "Descargar todas las imágenes encontradas en la página actual"},
 "menuReportBug": {"message": "Háganos saber si tiene algún problema"},
 "menuShowOptions": {"message": "ACTIVAR/DESACTIVAR recursos admitidos y opciones del Helper"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "Trabajamos duro para mejorar. ¡Échenos una mano!"},

 "quality": {"message": "Calidad"},
 "qualityNote": {"message": "Si no se elige ninguna calidad, se descargará el mejor vídeo disponible."},
 "filelistTitle": {"message": "La lista de los archivos encontrados"},
 "filelistInstruction": {"message": "['Para descargar todos los archivos, copie la lista de enlaces y péguela en el ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'gestor de descargas'}},'. Si no tiene instalado un gestor de descargas, le recomendamos que instale ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "playlistTitle": {"message": "Lista de reproducción"},
 "playlistInstruction": {"message": "Para reproducir la lista de reproducción guardada, puede abrirla ahora en el reproductor de música."},

 "ummySfTitle": {"message": "HD o MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' via Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Instale Ummy Video Downloader y descargue sus vídeos favoritos en HD o MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'Descargar'}}]}},{p:{append:['Después de la instalación, se iniciará una descarga automáticamente siempre que haga clic en ',{img:{src:'#'}}]}}]"},
 "warningPopupTitle": {"message": "Compruebe la configuración de su navegador"},
 "warningPopupDesc": {"message": "La opción \"Preguntarme siempre dónde guardar los archivos\" debe estar desactivada."},
 "readMore": {"message": "Más"},
 "noWarning": {"message": "No notificar"},
 "cancel": {"message": "Cancelar"},
 "continue": {"message": "Continuar"},
 "beforeDownloadPopupWarn": {"message": "¡Advertencia! La descarga no se puede cancelar o suspender."},

 "vkInfo": {"message": "Información"},
 "vkInfoTitle": {"message": "Tamaño de archivo y velocidad de bits"},
 "vkMp3LinksNotFound": {"message": "No se han encontrado enlaces a archivos MP3"},
 "vkPhotoLinksNotFound": {"message": "No se han encontrado imágenes"},
 "vkDownloadPhotoAlbum": {"message": "Descargar álbum"},
 "vkDownloadAllPhotoAlbums": {"message": "Descargar todos los álbums"},
 "vkFoundPhotos": {"message": "Imágenes encontradas"},
 "vkNotAvailablePhotos": {"message": "%d imágenes están temporalmente no disponibles"},
 "vkFoundLinks": {"message": "Enlaces encontrados"},
 "vkFoundOf": {"message": "de"},
 "vkShowAs": {"message": "Mostrar como"},
 "vkListOfLinks": {"message": "Lista de enlaces"},
 "vkListOfLinksInstruction": {"message": "['Para descargar todas las imágenes, copie la lista de enlaces y péguela en el ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'gestor de descargas'}},'. Si no tiene instalado un gestor de descargas, le recomendamos que instale ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "vkTableOfThumbnails": {"message": "Tabla de miniaturas"},
 "vkListOfPhotos": {"message": "Lista de imágenes"},
 "vkListOfPhotosInstruction": {"message": "Haga clic en la imagen para descargarla."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "B"},
 "vkFileSizeKByte": {"message": "kB"},
 "vkFileSizeMByte": {"message": "MB"},
 "vkFileSizeGByte": {"message": "GB"},
 "vkFileSizeTByte": {"message": "TB"},
 "vkDownloadFromYoutube": {"message": "['Descargar: abra ',{a:{href:'{url}',text:'la página del vídeo'}},' y pulse el botón \"Descargar\" sobre el reproductor']"},
 "vkFoundFiles": {"message": "Archivos encontrados: %d"},

 "shareIn": {"message": "Compartir en %w"},
 "socialDesc": {"message": "SaveFrom.net helper le permite descargar archivos desde YouTube.com, Facebook.com, VK.com y más de 40 sitios distintos con tan sólo un clic y gratis"}
};
_languageList.fr = {
 "extName": {"message": "SaveFrom.net Helper"},
 "extDescription": {"message": "Téléchargez YouTube, Facebook, VK.com et 40+ sites en un seul clic."},

 "extNameLite": {"message": "SaveFrom.net Helper lite"},
 "extDescriptionLite": {"message": "Téléchargez Facebook, VK.com et 40+ sites en un seul clic."},

 "lang": {"message": "fr"},

 "titleDefault": {"message": "SaveFrom.net Helper"},
 "titleDesabled": {"message": "Assistant SaveFrom.net désactivé"},

 "menuEnable": {"message": "Activer"},
 "menuDisable": {"message": "Désactiver"},

 "showButton": {"message": "Afficher le bouton d'extension"},

 "copy": {"message": "Copier"},
 "download": {"message": "Télécharger"},
 "downloadTitle": {"message": "Cliquer sur le lien tout en maintenant la touche Alt/Option ou Ctrl pour télécharger le fichier."},
 "noLinksFound": {"message": "Aucun lien n'a été trouvé"},
 "more": {"message": "Plus"},
 "close": {"message": "Fermer"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "sans audio"},
 "size": {"message": "taille"},

 "subtitles": {"message": "Sous-titres"},
 "playlist": {"message": "Playlist"},
 "filelist": {"message": "Liste de fichiers"},
 "downloadWholePlaylist": {"message": "Télécharger toute la playlist"},

 "getFileSizeTitle": {"message": "Obtenir la taille du fichier" },
 "getFileSizeFailTitle": {"message": "Impossible d'obtenir la taille du fichier. Veuillez réessayer."},

 "lmButtonTitle": {"message": "Obtenir un lien direct"},

 "downloadFromCurrentPage": {"message": "Aller à SaveFrom.net"},
 "updateLinks": {"message": "Rafraîchir les liens"},
 "updateLinksNotification": {"message": "Liens mis à jour"},
 "downloadMP3Files": {"message": "Télécharger les fichiers audio"},
 "downloadPlaylist": {"message": "Télécharger une playlist"},
 "downloadPhotos": {"message": "Télécharger les images"},
 "installFullVersion": {"message": "Installer la version complète"},
 "disable": {"message": "Désactiver"},
 "showOptions": {"message": "Paramètres"},
 "reportBug": {"message": "Signaler un bug"},
 "openPoll": {"message": "Améliorer"},
 "disableModule": {"message": "Désactiver sur ce site"},
 "enableModule": {"message": "Activer sur ce site"},
 "enableDisableModule": {"message": "Activer On/Off sur ce site web"},
 "showHideButton": {"message": "Afficher/masquer le bouton d'extension"},
 "updateTo": {"message": "Passer à la version %d"},

 "aboutPage": {"message": "À propos"},
 "aboutTitle": {"message": "SaveFrom.net Helper"},
 "aboutVersion": {"message": "Version"},
 "aboutDescription": {"message": "Aide les utilisateurs à obtenir des liens directs pour télécharger depuis plus de 40 sites web, y compris Dailymotion.com, YouTube.com, VK.com et d'autres."},
 "aboutDescriptionLite": {"message": "Aide les utilisateurs à obtenir des liens directs pour télécharger depuis plus de 40 sites web, y compris Dailymotion.com, VK.com et d'autres."},
 "aboutSupported": {"message": "Ressources prises en charge"},
 "homePage": {"message": "Page d'accueil"},

 "optionsTitle": {"message": "SaveFrom.net Helper - Préférences"},
 "optionsHandleLinks": {"message": "manipuler les liens"},
 "optionsFileHostings": {"message": "Vers l'hébergement de fichiers"},
 "optionsMediaHostings": {"message": "Vers l'hébergement de médias"},
 "optionsModules": {"message": "Modules"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Masquer les liens"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Afficher instantanément le bitrate"},
 "optionsSovetnikEnabled": {"message": "Advisor"},
 "optionsShowUmmyInfo": {"message": "Afficher les astuces pour Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Mode de téléchargement avancé"},
 "optionsShowUmmyBtn": {"message": "Montrer le bouton Ummy"},

 "menuDownloadFromCurrentPage": {"message": "Téléchargement des fichiers depuis la page actuelle en utilisant SaveFrom.net"},
 "menuUpdateLinks": {"message": "Appuyez si le bouton Télécharger n'apparaît pas"},
 "menuDownloadMP3Files": {"message": "Télécharger tous les fichiers audio trouvés sur la page actuelle"},
 "menuDownloadPlaylist": {"message": "Génère et télécharge la playlist consistant en liens vers les fichiers audio"},
 "menuDownloadPhotos": {"message": "Télécharger toutes les images trouvées sur la page actuelle"},
 "menuReportBug": {"message": "Prévenez-nous si vous avez des problèmes"},
 "menuShowOptions": {"message": "ON/OFF ressources prises en charge et options Helper"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "Nous faisons tout pour nous améliorer. N'hésitez pas à nous aider !"},

 "quality": {"message": "Qualité"},
 "qualityNote": {"message": "La meilleure vidéo disponible sera téléchargée s'il n'y a pas de qualité choisie."},
 "filelistTitle": {"message": "La liste des fichiers trouvés"},
 "filelistInstruction": {"message": "['Pour télécharger tous les fichiers copiez la liste des liens et collez-la dans ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'download manager'}},'. Si vous n\\'avez pas installé de gestionnaire de téléchargement, nous vous recommandons d\\'installer ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "playlistTitle": {"message": "Playlist"},
 "playlistInstruction": {"message": "Pour lire la playlist sauvegardée, ouvrez-la dans le lecteur musical."},

 "ummySfTitle": {"message": "HD ou MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' via Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Installez Ummy Video Downloader et téléchargez vos vidéos favorites en HD ou MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'Download'}}]}},{p:{append:['Après l\\'installation, un téléchargement démarrera automatiquement dès que vous cliquez sur ',{img:{src:'#'}}]}}]"},
 "warningPopupTitle": {"message": "Vérifier les paramètres du navigateur"},
 "warningPopupDesc": {"message": "L'option \"Toujours me demander où sauvegarder les fichiers\" doit être désactivée."},
 "readMore": {"message": "Plus"},
 "noWarning": {"message": "ne pas notifier'"},
 "cancel": {"message": "Annuler"},
 "continue": {"message": "Continuer"},
 "beforeDownloadPopupWarn": {"message": "Attention! Le téléchargement ne peut pas être annulé ou suspendu."},

 "vkInfo": {"message": "Info"},
 "vkInfoTitle": {"message": "Taille de fichier et bitrate"},
 "vkMp3LinksNotFound": {"message": "Les liens vers les fichiers MP3 sont introuvables"},
 "vkPhotoLinksNotFound": {"message": "Photos introuvables"},
 "vkDownloadPhotoAlbum": {"message": "Télécharger l'album"},
 "vkDownloadAllPhotoAlbums": {"message": "Télécharger tous les albums"},
 "vkFoundPhotos": {"message": "Photos trouvées"},
 "vkNotAvailablePhotos": {"message": "%d photos sont temporairement indisponibles"},
 "vkFoundLinks": {"message": "Liens trouvés"},
 "vkFoundOf": {"message": "de"},
 "vkShowAs": {"message": "Afficher comme"},
 "vkListOfLinks": {"message": "Liste des liens"},
 "vkListOfLinksInstruction": {"message": "['Pour télécharger toutes les photos copiez la liste des liens et collez-la dans ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'download manager'}},'. Si vous n\\'avez pas installé de gestionnaire de téléchargement nous vous recommandons d\\'installer ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "vkTableOfThumbnails": {"message": "Tableau des vignettes"},
 "vkListOfPhotos": {"message": "Liste des photos"},
 "vkListOfPhotosInstruction": {"message": "Cliquez sur la photo pour la télécharger."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "O"},
 "vkFileSizeKByte": {"message": "ko"},
 "vkFileSizeMByte": {"message": "Mo"},
 "vkFileSizeGByte": {"message": "Go"},
 "vkFileSizeTByte": {"message": "To"},
 "vkDownloadFromYoutube": {"message": "['Download: open ',{a:{href:'{url}',text:'the video page'}},' et appuyez sur le bouton \"Télécharger\" au-dessus du lecteur']"},
 "vkFoundFiles": {"message": "Fichiers trouvés : %d"},

 "shareIn": {"message": "Partager sur %w"},
 "socialDesc": {"message": "SaveFrom.net helper vous permet de télécharger des fichiers de YouTube.com, Facebook.com, VK.com et plus de 40 autres gratuitement et en un seul clic"}
};
_languageList.id = {
 "extName": {"message": "Bantuan SaveFrom.net"},
 "extDescription": {"message": "Unduh YouTube, Facebook, VK.com, dan 40+ situs dengan satu klik."},

 "extNameLite": {"message": "Bantuan SaveFrom.net lite"},
 "extDescriptionLite": {"message": "Unduh Facebook, VK.com, dan 40+ situs dengan satu klik."},

 "lang": {"message": "id"},

 "titleDefault": {"message": "Bantuan SaveFrom.net"},
 "titleDesabled": {"message": "Bantuan SaveFrom.net nonaktif"},

 "menuEnable": {"message": "Aktifkan"},
 "menuDisable": {"message": "Nonaktifkan"},

 "showButton": {"message": "Tampilkan tombol ekstensi"},

 "copy": {"message": "Salin"},
 "download": {"message": "Unduh"},
 "downloadTitle": {"message": "Klik tautan sambil menahan tombol Alt/Option atau Ctrl untuk mengunduh file."},
 "noLinksFound": {"message": "Tautan tidak ditemukan"},
 "more": {"message": "Lainnya"},
 "close": {"message": "Tutup"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "tanpa audio"},
 "size": {"message": "ukuran"},

 "subtitles": {"message": "Subtitel"},
 "playlist": {"message": "Daftar putar"},
 "filelist": {"message": "Daftar file"},
 "downloadWholePlaylist": {"message": "Unduh seluruh daftar putar"},

 "getFileSizeTitle": {"message": "Dapatkan ukuran file" },
 "getFileSizeFailTitle": {"message": "Gagal mendapatkan ukuran file. Mohon coba lagi."},

 "lmButtonTitle": {"message": "Dapatkan tautan langsung"},

 "downloadFromCurrentPage": {"message": "Buka SaveFrom.net"},
 "updateLinks": {"message": "Segarkan tautan"},
 "updateLinksNotification": {"message": "Tautan diperbarui"},
 "downloadMP3Files": {"message": "Unduh file audio"},
 "downloadPlaylist": {"message": "Unduh daftar putar"},
 "downloadPhotos": {"message": "Unduh gambar"},
 "installFullVersion": {"message": "Pasang versi lengkap"},
 "disable": {"message": "Nonaktifkan"},
 "showOptions": {"message": "Setelan"},
 "reportBug": {"message": "Laporkan bug"},
 "openPoll": {"message": "Jadikan lebih baik"},
 "disableModule": {"message": "Nonaktifkan di situs web ini"},
 "enableModule": {"message": "Aktifkan di situs web ini"},
 "enableDisableModule": {"message": "Nyalakan/Matikan di situs ini"},
 "showHideButton": {"message": "Tampilkan/tutup tbl ekstensi"},
 "updateTo": {"message": "Perbarui ke %d"},

 "aboutPage": {"message": "Tentang"},
 "aboutTitle": {"message": "Bantuan SaveFrom.net"},
 "aboutVersion": {"message": "Versi"},
 "aboutDescription": {"message": "Membantu pengguna mendapatkan tautan langsung dari 40+ situs web, termasuk Dailymotion.com, YouTube.com, VK.com dan lain-lain."},
 "aboutDescriptionLite": {"message": "Membantu pengguna mendapatkan tautan langsung untuk mengunduh dari 40+ situs web, termasuk Dailymotion.com, VK.com dan lain-lain."},
 "aboutSupported": {"message": "Sumber daya yang didukung"},
 "homePage": {"message": "Laman beranda"},

 "optionsTitle": {"message": "Bantuan SaveFrom.net - Preferensi"},
 "optionsHandleLinks": {"message": "Tangani tautan"},
 "optionsFileHostings": {"message": "Ke filehosting"},
 "optionsMediaHostings": {"message": "Ke mediahosting"},
 "optionsModules": {"message": "Modul"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Sembunyikan tautan"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Langsung tampilkan bitrate"},
 "optionsSovetnikEnabled": {"message": "Penasihat"},
 "optionsShowUmmyInfo": {"message": "Tampilkan tips untuk Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Mode unduh lanjutan"},
 "optionsShowUmmyBtn": {"message": "Perlihatkan tombol Ummy"},

 "menuDownloadFromCurrentPage": {"message": "Unduh file dari laman saat ini dengan SaveFrom.net"},
 "menuUpdateLinks": {"message": "Tekan jika tombol Unduh tidak muncul"},
 "menuDownloadMP3Files": {"message": "Unduh semua file audio yang ada di laman saat ini"},
 "menuDownloadPlaylist": {"message": "Buat dan unduh daftar putar berisi tautan ke file audio"},
 "menuDownloadPhotos": {"message": "Unduh semua gambar yang ada di laman saat ini"},
 "menuReportBug": {"message": "Beri tahu kami jika Anda mengalami masalah"},
 "menuShowOptions": {"message": "AKTIFKAN/NONAKTIFKAN sumber daya yang didukung dan opsi Bantuan"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "Kami bekerja keras untuk jadi lebih baik. Tolong, bantu kami!"},

 "quality": {"message": "Kualitas"},
 "qualityNote": {"message": "Video terbaik yang tersedia akan diunduh jika tidak ada kualitas yang dipilih."},
 "filelistTitle": {"message": "Daftar file yang ditemukan"},
 "filelistInstruction": {"message": "['Untuk mengunduh semua file, salin daftar tautan dan tempelkan ke ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'pengelola unduhan'}},'. Jika Anda tidak memiliki pengelola unduhan, kami menyarankan ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "playlistTitle": {"message": "Daftar putar"},
 "playlistInstruction": {"message": "Untuk memutar daftar putar yang disimpan, sekarang bisa dibuka di pemutar musik."},

 "ummySfTitle": {"message": "HD atau MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' via Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Pasang Ummy Video Downloader  dan unduh video favorit Anda dalam format HD atau MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'Unduh'}}]}},{p:{append:['Setelah pemasangan, unduhan akan otomatis dimulai setiap kali Anda mengeklik ',{img:{src:'#'}}]}}]"},
 "warningPopupTitle": {"message": "Periksa setelan browser"},
 "warningPopupDesc": {"message": "Opsi \"Selalu tanya saya di mana menyimpan file\" harus dinonaktifkan."},
 "readMore": {"message": "Lainnya"},
 "noWarning": {"message": "Jangan beri tahu"},
 "cancel": {"message": "Batal"},
 "continue": {"message": "Lanjutkan"},
 "beforeDownloadPopupWarn": {"message": "Perhatian! Pengunduhan tidak dapat dibatalkan atau ditunda."},

 "vkInfo": {"message": "Info"},
 "vkInfoTitle": {"message": "Ukuran file dan bitrate"},
 "vkMp3LinksNotFound": {"message": "Tautan atau file MP3 tidak ditemukan"},
 "vkPhotoLinksNotFound": {"message": "Foto tidak ditemukan"},
 "vkDownloadPhotoAlbum": {"message": "Unduh album"},
 "vkDownloadAllPhotoAlbums": {"message": "Unduh semua album"},
 "vkFoundPhotos": {"message": "Foto ditemukan"},
 "vkNotAvailablePhotos": {"message": "%d foto sementara ini tidak tersedia"},
 "vkFoundLinks": {"message": "Tautan ditemukan"},
 "vkFoundOf": {"message": "dari"},
 "vkShowAs": {"message": "Tampilkan sebagai"},
 "vkListOfLinks": {"message": "Daftar tautan"},
 "vkListOfLinksInstruction": {"message": "['Untuk mengunduh semua foto, salin daftar tautan dan tempelkan ke ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'pengelola unduhan'}},'. Jika Anda tidak memiliki pengelola unduhan, kami menyarankan ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},'.']"},
 "vkTableOfThumbnails": {"message": "Tabel gambar mini"},
 "vkListOfPhotos": {"message": "Daftar foto"},
 "vkListOfPhotosInstruction": {"message": "Klik foto untuk mengunduhnya."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "B"},
 "vkFileSizeKByte": {"message": "kB"},
 "vkFileSizeMByte": {"message": "MB"},
 "vkFileSizeGByte": {"message": "GB"},
 "vkFileSizeTByte": {"message": "TB"},
 "vkDownloadFromYoutube": {"message": "['Mengunduh: buka ',{a:{href:'{url}',text:'laman video'}},' dan tekan tombol \"Unduh\" di atas pemutar']"},
 "vkFoundFiles": {"message": "File ditemukan: %d"},

 "shareIn": {"message": "Bagikan di %w"},
 "socialDesc": {"message": "Dengan bantuan SaveFrom.net, Anda dapat mengunduh file dari YouTube.com, Facebook.com, VK.com, dan lebih dari 40 lainnya hanya dengan satu klik gratis"}
};
_languageList.ru = {
 "extName": {"message": "SaveFrom.net помощник"},
 "extDescription": {"message": "Скачивайте с Вконтакте, YouTube, Одноклассники и еще 40 сайтов за 1 клик."},

 "extNameLite": {"message": "SaveFrom.net помощник lite"},
 "extDescriptionLite": {"message": "Скачивайте с Вконтакте, Одноклассники и еще 40 сайтов за 1 клик."},

 "lang": {"message": "ru"},

 "titleDefault": {"message": "SaveFrom.net помощник"},
 "titleDesabled": {"message": "SaveFrom.net помощник выключен"},

 "menuEnable": {"message": "Включить"},
 "menuDisable": {"message": "Выключить"},

 "showButton": {"message": "Показывать кнопку расширения"},

 "copy": {"message": "Копировать"},
 "download": {"message": "Скачать"},
 "downloadTitle": {"message": "Нажмите на ссылку, удерживая клавишу Alt или Ctrl, чтобы сохранить файл."},
 "noLinksFound": {"message": "Не удалось найти ссылки"},
 "more": {"message": "Ещё"},
 "close": {"message": "Закрыть"},
 "kbps": {"message": "кб/с"},
 "withoutAudio": {"message": "без аудио"},
 "size": {"message": "размер"},

 "subtitles": {"message": "Субтитры"},
 "playlist": {"message": "Плейлист"},
 "filelist": {"message": "Список файлов"},
 "downloadWholePlaylist": {"message": "Скачать весь плейлист"},

 "getFileSizeTitle": {"message": "Определить размер файла" },
 "getFileSizeFailTitle": {"message": "Не удалось определить размер файла. Попробуйте повторить попытку."},

 "lmButtonTitle": {"message": "Получи прямую ссылку"},

 "downloadFromCurrentPage": {"message": "Перейти на SaveFrom.net"},
 "updateLinks": {"message": "Обновить ссылки"},
 "updateLinksNotification": {"message": "Ссылки обновлены"},
 "downloadMP3Files": {"message": "Скачать аудио файлы"},
 "downloadPlaylist": {"message": "Скачать плейлист"},
 "downloadPhotos": {"message": "Скачать фотографии"},
 "installFullVersion": {"message": "Установить полную версию"},
 "disable": {"message": "Выключить"},
 "showOptions": {"message": "Настройки"},
 "reportBug": {"message": "Сообщить об ошибке"},
 "openPoll": {"message": "Стать лучше"},
 "disableModule": {"message": "Отключить на этом сайте"},
 "enableModule": {"message": "Включить на этом сайте"},
 "enableDisableModule": {"message": "Вкл/Выкл на этом сайте"},
 "showHideButton": {"message": "Показ./скр. кнопку расширения"},
 "updateTo": {"message": "Обновить до %d"},

 "aboutPage": {"message": "О расширении"},
 "aboutTitle": {"message": "SaveFrom.net помощник"},
 "aboutVersion": {"message": "Версия"},
 "aboutDescription": {"message": "Позволяет получать прямые ссылки для скачивания с более чем 40 сайтов, среди которых  VK.com, YouTube.com и другие."},
 "aboutDescriptionLite": {"message": "Позволяет получать прямые ссылки для скачивания с более чем 40 сайтов, среди которых  VK.com и другие."},
 "aboutSupported": {"message": "Поддерживаемые ресурсы"},
 "homePage": {"message": "Домашняя страница"},

 "optionsTitle": {"message": "SaveFrom.net помощник - Настройки"},
 "optionsHandleLinks": {"message": "Обрабатывать ссылки"},
 "optionsFileHostings": {"message": "На файлообменники"},
 "optionsMediaHostings": {"message": "На медиахостинги"},
 "optionsModules": {"message": "Модули"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Скрывать ссылки"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "Вконтакте"},
 "optionsOdnoklassniki": {"message": "Одноклассники"},
 "optionsMailru": {"message": "Мой мир"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Показывать битрейт сразу"},
 "optionsSovetnikEnabled": {"message": "Советник"},
 "optionsShowUmmyInfo": {"message": "Показывать подсказки для Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Расширенный режим закачки"},
 "optionsShowUmmyBtn": {"message": "Отображать кнопку Ummy"},

 "menuDownloadFromCurrentPage": {"message": "Скачать файлы с текущей страницы с помощью сервиса SaveFrom.net"},
 "menuUpdateLinks": {"message": "Нажмите, если ссылка для скачивания не появляется"},
 "menuDownloadMP3Files": {"message": "Скачать все найденные на странице аудиофайлы"},
 "menuDownloadPlaylist": {"message": "Формирует и скачивает плейлист с ссылками на аудиофайлы"},
 "menuDownloadPhotos": {"message": "Скачать все найденные на странице фотографии"},
 "menuReportBug": {"message": "Дайте нам знать, если возникли проблемы"},
 "menuShowOptions": {"message": "Вкл./откл. поддерживаемые ресурсы и возможности помощника"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "Пожалуйста, оцените качество расширения \"SaveFrom.net помощник\""},

 "quality": {"message": "Качество"},
 "qualityNote": {"message": "Если видео в нужном качестве нет, скачается лучшее из возможного."},
 "filelistTitle": {"message": "Список найденных файлов"},
 "filelistInstruction": {"message": "['Чтобы скачать все файлы, скопируйте список ссылок и вставьте его в ',{a:{href:'http://ru.wikipedia.org/wiki/Менеджер_загрузок',text:'менеджер закачек'}},'. Если у вас не установлен менеджер закачек, рекомендуем установить ',{a:{href:'http://www.westbyte.com/dm/',text:'Download Master'}},'.']"},
 "playlistTitle": {"message": "Плейлист"},
 "playlistInstruction": {"message": "Сохраненный плейлист можно открыть в плеере для  воспроизведения."},

 "ummySfTitle": {"message": "HD или MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' с помощью Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Установите бесплатный Ummy Video Downloader и скачивайте свои любимые видео в HD или в MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'СКАЧАТЬ'}}]}},{p:{append:['После установки при клике на ',{img:{src:'#'}},' закачка будет начинаться автоматически.']}}]"},
 "warningPopupTitle": {"message": "Проверьте настройки браузера"},
 "warningPopupDesc": {"message": "Выбор папки при скачивании должен быть отключен."},
 "readMore": {"message": "Подробнее..."},
 "noWarning": {"message": "Не предупреждать"},
 "cancel": {"message": "Отмена"},
 "continue": {"message": "Продолжить"},
 "beforeDownloadPopupWarn": {"message": "Внимание: отменить или приостановить закачку будет невозможно."},

 "vkInfo": {"message": "Параметры"},
 "vkInfoTitle": {"message": "Размер файла и битрейт"},
 "vkMp3LinksNotFound": {"message": "Не найдены ссылки на MP3 файлы"},
 "vkPhotoLinksNotFound": {"message": "Не найдены ссылки на фотографии"},
 "vkDownloadPhotoAlbum": {"message": "Скачать альбом"},
 "vkDownloadAllPhotoAlbums": {"message": "Скачать все альбомы"},
 "vkFoundPhotos": {"message": "Найдено фотографий"},
 "vkNotAvailablePhotos": {"message": "%d фото временно не доступно"},
 "vkFoundLinks": {"message": "Найдено ссылок"},
 "vkFoundOf": {"message": "из"},
 "vkShowAs": {"message": "Показать как"},
 "vkListOfLinks": {"message": "Список ссылок"},
 "vkListOfLinksInstruction": {"message": "['Чтобы скачать все фотографии, скопируйте список ссылок и вставьте его в ',{a:{href:'http://ru.wikipedia.org/wiki/Менеджер_загрузок',text:'менеджер закачек'}},'. Если у вас не установлен менеджер закачек, рекомендуем установить ',{a:{href:'http://www.westbyte.com/dm/',text:'Download Master'}},'.']"},
 "vkTableOfThumbnails": {"message": "Таблицу эскизов"},
 "vkListOfPhotos": {"message": "Список фотографий"},
 "vkListOfPhotosInstruction": {"message": "Чтобы скачать фотографию, щелкните на ней левой кнопкой мыши."},
 "vkKbps": {"message": "кб/с"},
 "vkFileSizeByte": {"message": "Б"},
 "vkFileSizeKByte": {"message": "кБ"},
 "vkFileSizeMByte": {"message": "МБ"},
 "vkFileSizeGByte": {"message": "ГБ"},
 "vkFileSizeTByte": {"message": "ТБ"},
 "vkDownloadFromYoutube": {"message": "['Скачать: откройте ',{a:{href:'{url}',text:'страницу видео ролика'}},' и нажмите кнопку \"Скачать\" над плеером']"},
 "vkFoundFiles": {"message": "Найдено файлов: %d"},

 "shareIn": {"message": "Поделиться в %w"},
 "socialDesc": {"message": "SaveFrom.net помощник помогает бесплатно скачивать с VK.com, YouTube.com, Odnoklassniki.ru и более 40 других сайтов в 1 клик"}
};
_languageList.tr = {
 "extName": {"message": "SaveFrom.net asistan"},
 "extDescription": {"message": "Sadece bir tıklama ile YouTube, Facebook, VK.com ve 40'dan fazla siteden dosya indirin."},

 "extNameLite": {"message": "SaveFrom.net asistan lite"},
 "extDescriptionLite": {"message": "Sadece bir tıklama ile Facebook, VK.com ve 40'dan fazla siteden dosya indirin"},

 "lang": {"message": "tr"},

 "titleDefault": {"message": "SaveFrom.net asistan"},
 "titleDesabled": {"message": "SaveFrom.net asistan devre dışı"},

 "menuEnable": {"message": "Etkin"},
 "menuDisable": {"message": "Devre dışı"},

 "showButton": {"message": "Eklenti düğmesini göster"},

 "copy": {"message": "Kopyala"},
 "download": {"message": "İndir"},
 "downloadTitle": {"message": "Dosyayı indirmek için Alt/Option veya Ctrl tuşuna basılı tutarak bağlantıyı tıklayın."},
 "noLinksFound": {"message": "Hiçbir bağlantı bulunamadı"},
 "more": {"message": "Daha fazla"},
 "close": {"message": "Kapat"},
 "kbps": {"message": "kbps"},
 "withoutAudio": {"message": "without audio"},
 "size": {"message": "boyut"},

 "subtitles": {"message": "Alt yazı"},
 "playlist": {"message": "Çalma listesi"},
 "filelist": {"message": "Dosya listesi"},
 "downloadWholePlaylist": {"message": "Tüm çalma listesini indir"},

 "getFileSizeTitle": {"message": "Dosya boyutunu al" },
 "getFileSizeFailTitle": {"message": "Dosya boyutu alınamadı. Lütfen tekrar deneyiniz."},

 "lmButtonTitle": {"message": "Doğrudan bağlantı al"},

 "downloadFromCurrentPage": {"message": "SaveFrom.net'e git"},
 "updateLinks": {"message": "Bağlantıları yenile"},
 "updateLinksNotification": {"message": "Bağlantılar güncellendi"},
 "downloadMP3Files": {"message": "Ses dosyalarını indir"},
 "downloadPlaylist": {"message": "Çalma listesini indir"},
 "downloadPhotos": {"message": "Resimleri indir"},
 "installFullVersion": {"message": "Tam versiyonu kur"},
 "disable": {"message": "Devre dışı"},
 "showOptions": {"message": "Ayarlar"},
 "reportBug": {"message": "Hata bildir"},
 "openPoll": {"message": "Become better"},
 "disableModule": {"message": "Bu web sitesinde devre dışı bırak"},
 "enableModule": {"message": "Bu web sitesinde etkinleştir"},
 "enableDisableModule": {"message": "Bu sitede etkin/devre dışı"},
 "showHideButton": {"message": "Eklenti butonunu göster/gizle"},
 "updateTo": {"message": "%d sürümüne güncelle"},

 "aboutPage": {"message": "Hakkında"},
 "aboutTitle": {"message": "SaveFrom.net Asistan"},
 "aboutVersion": {"message": "Versiyon"},
 "aboutDescription": {"message": "Kullanıcıların, Dailymotion.com, YouTube.com, VK.com ve diğerleri de dahil olmak üzere 40'dan fazla web sitesinden dosya indirmek için doğrudan bağlantılar almalarını sağlar."},
 "aboutDescriptionLite": {"message": "Kullanıcıların, Dailymotion.com, VK.com ve diğerleri de dahil olmak üzere 40'dan fazla web sitesinden dosya indirmek için doğrudan bağlantılar almalarını sağlar."},
 "aboutSupported": {"message": "Desteklenen kaynaklar"},
 "homePage": {"message": "Ana Sayfa"},

 "optionsTitle": {"message": "SaveFrom.net Asistan - Tercihler"},
 "optionsHandleLinks": {"message": "Linkleri taşı"},
 "optionsFileHostings": {"message": "Dosya paylaşıma"},
 "optionsMediaHostings": {"message": "Medya paylaşıma"},
 "optionsModules": {"message": "Modüller"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Bağlantıları gizle"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "VK"},
 "optionsOdnoklassniki": {"message": "Odnoklassniki"},
 "optionsMailru": {"message": "Moy Mir"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Bit hızını anlık olarak göster"},
 "optionsSovetnikEnabled": {"message": "Advisor"},
 "optionsShowUmmyInfo": {"message": "UVD için ipuçlarını göster"},
 "optionsGmNativeDownload": {"message": "Gelişmiş indirme modu"},
 "optionsShowUmmyBtn": {"message": "Ummy düğmesini göster"},

 "menuDownloadFromCurrentPage": {"message": "SaveFrom.net'i kullanarak geçerli sayfadan dosya indirin"},
 "menuUpdateLinks": {"message": "Download düğmesi görünmüyorsa tıklayın"},
 "menuDownloadMP3Files": {"message": "Geçerli sayfada bulunan tüm ses dosyalarını indirin"},
 "menuDownloadPlaylist": {"message": "Ses dosyalarından oluşan bir çalma listesi oluşturur ve indirir"},
 "menuDownloadPhotos": {"message": "Geçerli sayfada bulunan tüm resimleri indirin"},
 "menuReportBug": {"message": "Herhangi bir sorun olması durumunda bize bildirin"},
 "menuShowOptions": {"message": "Desteklenen kaynakları ve Helper seçeneklerini AÇ/KAPAT"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": ""},

 "quality": {"message": "Kalite"},
 "qualityNote": {"message": "Herhangi bir seçilebilir kalitenin olmaması durumunda mevcut olan en iyi video indirilecektir."},
 "filelistTitle": {"message": "Bulunan dosyalarını listesi"},
 "filelistInstruction": {"message": "['Tüm dosyalarını indirmek için bağlantı listesini kopyalayın ve ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'indirme yöneticisine'}},' yapıştırın. Kurulu bir indirme yöneticiniz yoksa ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},' yüklemenizi tavsiye ederiz.']"},
 "playlistTitle": {"message": "Çalma Listesi"},
 "playlistInstruction": {"message": "Artık kaydedilen çalma listenizi yürütmek için müzik çalarınızda açabilirsiniz."},

 "ummySfTitle": {"message": "HD veya MP3"},
 "ummyMenuItem": {"message" : "['Ummy ile ',{span:{}}]"},
 "ummyMenuInfo": {"message": "[{p:{text:'Ummy Video İndirici\\'yi yükleyin ve en sevdiğiniz HD videoları ya da MP3\\'leri hemen indirin.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'İndir'}}]}},{p:{append:['Kurulumdan sonra ',{img:{src:'#'}},' simgesine tıklayarak dosya indirme işlemini otomatik olarak başlatabilirsiniz.']}}]"},
 "warningPopupTitle": {"message": "Tarayıcı ayarlarını kontrol edin"},
 "warningPopupDesc": {"message": "\"Dosyaların nereye kaydedileceğini her seferinde sor\" seçeneği kapalı olmalıdır."},
 "readMore": {"message": "Daha fazla"},
 "noWarning": {"message": "Bildirme"},
 "cancel": {"message": "İptal"},
 "continue": {"message": "Devam"},
 "beforeDownloadPopupWarn": {"message": "Uyarı! İndirme işlemi iptal edilemez ya da ertelenemez."},

 "vkInfo": {"message": "Bilgi"},
 "vkInfoTitle": {"message": "Dosya boyutu ve bit hızı"},
 "vkMp3LinksNotFound": {"message": "MP3 dosyaları için bağlantılar bulunamıyor"},
 "vkPhotoLinksNotFound": {"message": "Fotoğraflar bulunamadı"},
 "vkDownloadPhotoAlbum": {"message": "Albümü indir"},
 "vkDownloadAllPhotoAlbums": {"message": "Tüm albümleri indir"},
 "vkFoundPhotos": {"message": "Bulunan fotoğraflar"},
 "vkNotAvailablePhotos": {"message": "%d resim geçici olarak kullanılamıyor"},
 "vkFoundLinks": {"message": "Bulunan bağlantılar"},
 "vkFoundOf": {"message": "den"},
 "vkShowAs": {"message": "Olarak göster"},
 "vkListOfLinks": {"message": "Bağlantı listesi"},
 "vkListOfLinksInstruction": {"message": "['Tüm fotoğrafları indirmek için bağlantı listesini kopyalayın ve ',{a:{href:'http://en.wikipedia.org/wiki/Download_manager',text:'indirme yöneticisine'}},' yapıştırın. Kurulu bir indirme yöneticiniz yoksa ',{a:{href:'http://www.freedownloadmanager.org/',text:'Free Download Manager'}},' yüklemenizi tavsiye ederiz.']"},
 "vkTableOfThumbnails": {"message": "Küçükk resimler tablosu"},
 "vkListOfPhotos": {"message": "Fotoğraf listesi"},
 "vkListOfPhotosInstruction": {"message": "İndirmek için fotoğrafın üzerine tıklayın."},
 "vkKbps": {"message": "kbps"},
 "vkFileSizeByte": {"message": "B"},
 "vkFileSizeKByte": {"message": "kB"},
 "vkFileSizeMByte": {"message": "MB"},
 "vkFileSizeGByte": {"message": "GB"},
 "vkFileSizeTByte": {"message": "TB"},
 "vkDownloadFromYoutube": {"message": "['İndirme: ',{a:{href:'{url}',text:'video sayfasını'}},' açın ve oynatıcı üzerindeki \"İndir\" dümesine basın']"},
 "vkFoundFiles": {"message": "Bulunan dosyalar: %d"},

 "shareIn": {"message": "%w üzerinden paylaş"},
 "socialDesc": {"message": "SaveFrom.net Helper, sadece bir tıklama ile YouTube.com, Facebook.com, VK.com ve 40'dan fazla siteden ücretsiz olarak dosya indirmenizi sağlar."}
};
_languageList.uk = {
 "extName": {"message": "SaveFrom.net помічник"},
 "extDescription": {"message": "Завантажуйте з «ВКонтакте», YouTube, Facebook і ще 40 сайтів за 1 клік."},

 "extNameLite": {"message": "SaveFrom.net помічник lite"},
 "extDescriptionLite": {"message": "Завантажуйте з «ВКонтакте», YouTube, Facebook і ще 40 сайтів за 1 клік."},

 "lang": {"message": "uk"},

 "titleDefault": {"message": "SaveFrom.net помічник"},
 "titleDesabled": {"message": "SaveFrom.net помічник вимкнений"},

 "menuEnable": {"message": "Увімкнути"},
 "menuDisable": {"message": "Вимкнути"},

 "showButton": {"message": "Показувати кнопку розширення"},

 "copy": {"message": "Копіювати"},
 "download": {"message": "Завантажити"},
 "downloadTitle": {"message": "Натисніть на посилання, утримуючи клавішу Alt чи Ctrl, щоб зберегти файл."},
 "noLinksFound": {"message": "Не вдалося знайти посилання"},
 "more": {"message": "Ще"},
 "close": {"message": "Закрити"},
 "kbps": {"message": "кб/с"},
 "withoutAudio": {"message": "без аудіо"},
 "size": {"message": "розмір"},

 "subtitles": {"message": "Субтитри"},
 "playlist": {"message": "Плейліст"},
 "filelist": {"message": "Список файлів"},
 "downloadWholePlaylist": {"message": "Завантажити весь плейліст"},

 "getFileSizeTitle": {"message": "Визначити розмір файлу" },
 "getFileSizeFailTitle": {"message": "Не вдалося визначити розмір файлу. Спробуйте ще раз."},

 "lmButtonTitle": {"message": "Отримай пряме посилання"},

 "downloadFromCurrentPage": {"message": "Перейти на SaveFrom.net"},
 "updateLinks": {"message": "Відновити посилання"},
 "updateLinksNotification": {"message": "Посилання оновлені"},
 "downloadMP3Files": {"message": "Скачати аудіо файли"},
 "downloadPlaylist": {"message": "Скачати плейлист"},
 "downloadPhotos": {"message": "Скачати фотографії"},
 "installFullVersion": {"message": "Встановити повну версію"},
 "disable": {"message": "Вимкнути"},
 "showOptions": {"message": "Налаштування"},
 "reportBug": {"message": "Повідомити про помилку"},
 "openPoll": {"message": "Стати краще"},
 "disableModule": {"message": "Вимкнути на цьому сайті"},
 "enableModule": {"message": "Увімкнути на цьому сайті"},
 "enableDisableModule": {"message": "Вкл./вимк. на цьому сайті"},
 "showHideButton": {"message": "Показ./скр. кнопку розширення"},
 "updateTo": {"message": "Оновити до %d"},

 "aboutPage": {"message": "Про розширення"},
 "aboutTitle": {"message": "SaveFrom.net помічник"},
 "aboutVersion": {"message": "Версія"},
 "aboutDescription": {"message": "Дозволяє отримувати прямі посилання для завантаження з понад 40 сайтів, серед яких VK.com, YouTube.com та інші."},
 "aboutDescriptionLite": {"message": "Дозволяє отримувати прямі посилання для завантаження з понад 40 сайтів, серед яких VK.com та інші."},
 "aboutSupported": {"message": "Ресурси, які підтримуються"},
 "homePage": {"message": "Домашня сторінка"},

 "optionsTitle": {"message": "SaveFrom.net помічник - Налаштування"},
 "optionsHandleLinks": {"message": "Обробляти посилання"},
 "optionsFileHostings": {"message": "На файлообмінники"},
 "optionsMediaHostings": {"message": "На медіахостинги"},
 "optionsModules": {"message": "Модулі"},
 "optionsYoutube": {"message": "YouTube"},
 "optionsYTHideLinks": {"message": "Сховати посилання"},
 "optionsDailymotion": {"message": "Dailymotion"},
 "optionsVimeo": {"message": "Vimeo"},
 "optionsFacebook": {"message": "Facebook"},
 "optionsSoundcloud": {"message": "SoundCloud"},
 "optionsVkontakte": {"message": "ВКонтакте"},
 "optionsOdnoklassniki": {"message": "Одноклассники"},
 "optionsMailru": {"message": "Мой мир"},
 "optionsInstagram": {"message": "Instagram"},
 "optionsRutube": {"message": "Rutube"},
 "optionsBitrate": {"message": "Показувати бітрейт одразу"},
 "optionsSovetnikEnabled": {"message": "Порадник"},
 "optionsShowUmmyInfo": {"message": "Показувати підказки для Ummy Video Downloader"},
 "optionsGmNativeDownload": {"message": "Розширений режим закачування"},
 "optionsShowUmmyBtn": {"message": "Відображати кнопку Ummy"},

 "menuDownloadFromCurrentPage": {"message": "Завантажити файли з поточної сторінки за допомогою сервісу SaveFrom.net"},
 "menuUpdateLinks": {"message": "Натисніть, якщо посилання для скачування не з'являється"},
 "menuDownloadMP3Files": {"message": "Завантажити всі знайдені на сторінці аудіофайли"},
 "menuDownloadPlaylist": {"message": "Формує та завантажує плейлист з посиланнями на аудіофайли"},
 "menuDownloadPhotos": {"message": "Завантажити всі знайдені на сторінці фотографії"},
 "menuReportBug": {"message": "Дайте нам знати, якщо виникли проблеми"},
 "menuShowOptions": {"message": "Вкл. / Вимк. підтримувані ресурси і можливості помічника"},
 "menuEnableExtension": {"message": ""},
 "menuOpenPoll": {"message": "Будь ласка, оценіть якість розширення \"SaveFrom.net помічник\""},

 "quality": {"message": "Якість"},
 "qualityNote": {"message": "Якщо відео в потрібній якості немає, скачається найкраще з можливого."},
 "filelistTitle": {"message": "Список знайдених файлів"},
 "filelistInstruction": {"message": "['Щоб завантажити усі файли, скопіюйте список посилань і вставте його у ',{a:{href:'http://ru.wikipedia.org/wiki/Менеджер_загрузок',text:'менеджер завантажень'}},'. Якщо у вас не встановлений менеджер завантажень, рекомендуємо встановити ',{a:{href:'http://www.westbyte.com/dm/',text:'Download Master'}},'.']"},
 "playlistTitle": {"message": "Плейліст"},
 "playlistInstruction": {"message": "Збережений плейліст можна відкрити у плеєрі для відтворення."},

 "ummySfTitle": {"message": "HD або MP3"},
 "ummyMenuItem": {"message" : "[{span:{}},' з домомогою Ummy']"},
 "ummyMenuInfo": {"message": "[{p:{text:'Встановіть безкоштовний Ummy Video Downloader і завантажуйте свої улюблені відео в HD або в MP3.'}},{p:{class:'center',append:[{a:{class:'green-btn-2 arrow',href:'{url}',target:'_blank',text:'СКАЧАТИ'}}]}},{p:{append:['Після встановлення при кліці на ',{img:{src:'#'}},' закачка буде починатися автоматично.']}}]"},
 "warningPopupTitle": {"message": "Перевірте налаштування браузера"},
 "warningPopupDesc": {"message": "Вибір папки при скачуванні повинен бути відключений."},
 "readMore": {"message": "Детальніше..."},
 "noWarning": {"message": "Не попереджати"},
 "cancel": {"message": "Скасування"},
 "continue": {"message": "Продовжити"},
 "beforeDownloadPopupWarn": {"message": "Увага: скасувати або призупинити завантаження буде неможливо."},

 "vkInfo": {"message": "Параметри"},
 "vkInfoTitle": {"message": "Розмір файлу і бітрейт"},
 "vkMp3LinksNotFound": {"message": "Не знайдено посилань на MP3-файли"},
 "vkPhotoLinksNotFound": {"message": "Не знайдено посилань на фотографії"},
 "vkDownloadPhotoAlbum": {"message": "Завантажити альбом"},
 "vkDownloadAllPhotoAlbums": {"message": "Завантажити усі альбоми"},
 "vkFoundPhotos": {"message": "Знайдено фотографій"},
 "vkNotAvailablePhotos": {"message": "%d фото тимчасово недоступно"},
 "vkFoundLinks": {"message": "Знайдено посилань"},
 "vkFoundOf": {"message": "з"},
 "vkShowAs": {"message": "Показати як"},
 "vkListOfLinks": {"message": "Список посилань"},
 "vkListOfLinksInstruction": {"message": "['Щоб завантажити усі фотографії, скопіюйте список посилань і вставте його у ',{a:{href:'http://ru.wikipedia.org/wiki/Менеджер_загрузок',text:'менеджер завантажень'}},'. Якщо у вас не встановлений менеджер завантажень, рекомендуємо встановити ',{a:{href:'http://www.westbyte.com/dm/',text:'Download Master'}},'.']"},
 "vkTableOfThumbnails": {"message": "Таблицю ескізів"},
 "vkListOfPhotos": {"message": "Список фотографій"},
 "vkListOfPhotosInstruction": {"message": "Щоб завантажити фотографію, натисніть на неї лівою кнопкою миші."},
 "vkKbps": {"message": "кб/с"},
 "vkFileSizeByte": {"message": "Б"},
 "vkFileSizeKByte": {"message": "кБ"},
 "vkFileSizeMByte": {"message": "МБ"},
 "vkFileSizeGByte": {"message": "ГБ"},
 "vkFileSizeTByte": {"message": "ТБ"},
 "vkDownloadFromYoutube": {"message": "['Завантажити: відкрийте ',{a:{href:'{url}',text:'сторінку відео-ролика'}},' і натисніть кнопку \"Завантажити\" над плеєром']"},
 "vkFoundFiles": {"message": "Знайдено файлів: %d"},

 "shareIn": {"message": "Поділитися в %w"},
 "socialDesc": {"message": "SaveFrom.net помічник дає вам можливість безкоштовно завантажувати файли з YouTube.com, Facebook.com, VK.com та більше 40 інших сайтів лише одним кліком"}
};

/**
 *
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine.
 *
 **/

var mono = (typeof mono !== 'undefined') ? mono : undefined;

(function(window, factory) {
  "use strict";
  if (mono && mono.isLoaded) {
    return;
  }

  if (typeof window !== "undefined") {
    return mono = factory(null, mono);
  }

}(
typeof window !== "undefined" ? window : undefined,
function initMono(_addon, _mono) {
  var require;

  var checkCompatibility = function() {
    var vPos, vPosEnd;
    if (mono.isTM || mono.isChrome || mono.isVM) {
      vPos = navigator.userAgent.indexOf('Chrome/') + 7;
      if (vPos === 6) return;
      vPosEnd = navigator.userAgent.indexOf('.', vPos);
      if (vPosEnd === -1) {
        vPosEnd = navigator.userAgent.indexOf(' ', vPos);
      }
      var chromeVersion = parseInt(navigator.userAgent.substr(vPos, vPosEnd - vPos));
      if (isNaN(chromeVersion)) {
        return;
      }
      mono.isChromeVersion = chromeVersion;
      if (chromeVersion < 31) {
        mono.noMouseEnter = true;
        mono.noXhrJson = true;
      }
    } else if (mono.isSafari) {
      vPos = navigator.userAgent.indexOf('Version/') + 8;
      vPosEnd = navigator.userAgent.indexOf('.', vPos);
      if (vPosEnd === -1) {
        vPosEnd = navigator.userAgent.indexOf(' ', vPos);
      }
      var safariVersion = parseInt(navigator.userAgent.substr(vPos, vPosEnd - vPos));
      if (isNaN(safariVersion)) {
        return;
      }
      mono.isSafariVersion = safariVersion;
      if (safariVersion < 7) {
        mono.noMouseEnter = true;
        mono.noXhrJson = true;
        mono.badXhrHeadRedirect = true;
      }
    }
  };

  var mono = {
    isLoaded: true,
    emptyFunc: function() {
    },
    msgType: undefined,
    storageType: undefined,
    msgList: {},
    storageList: {}
  };

  (function browserDefine() {

    if (typeof GM_getValue !== 'undefined') {
      mono.isGM = true;
      mono.msgType = 'gm';
      if (window.chrome !== undefined) {
        mono.isTM = true;
        checkCompatibility();
      } else if (navigator.userAgent.indexOf('Maxthon/') !== -1) {
        mono.isVM = true;
        checkCompatibility();
      } else {
        mono.isGmOnly = true;
      }
      return;
    }

    console.error('Mono: can\'t define browser!');
  })();

  mono.cloneObj = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  var msgTools = {
    cbObj: {},
    cbStack: [],
    id: 0,
    idPrefix: Math.floor(Math.random() * 1000) + '_',
    aliveTime: 120 * 1000,
    addCb: function(message, cb) {
      mono.onMessage.count === 0 && mono.onMessage(mono.emptyFunc);

      if (this.cbStack.length > mono.messageStack) {
        this.clean();
      }
      var id = message.callbackId = this.idPrefix + (++this.id);
      this.cbObj[id] = {
        fn: cb,
        time: Date.now()
      };
      this.cbStack.push(id);
    },
    callCb: function(message) {
      var cb = this.cbObj[message.responseId];
      if (cb === undefined) return;
      delete this.cbObj[message.responseId];
      this.cbStack.splice(this.cbStack.indexOf(message.responseId), 1);
      cb.fn(message.data);
    },
    mkResponse: function(response, callbackId, responseMessage) {
      responseMessage = {
        data: responseMessage,
        responseId: callbackId
      };
      response(responseMessage);
    },
    clearCbStack: function() {
      for (var item in this.cbObj) {
        delete this.cbObj[item];
      }
      this.cbStack.splice(0);
    },
    removeCb: function(cbId) {
      var cb = this.cbObj[cbId];
      if (cb === undefined) return;
      delete this.cbObj[cbId];
      this.cbStack.splice(this.cbStack.indexOf(cbId), 1);
    },
    clean: function(aliveTime) {
      var now = Date.now();
      aliveTime = aliveTime || this.aliveTime;
      for (var item in this.cbObj) {
        if (this.cbObj[item].time + aliveTime < now) {
          delete this.cbObj[item];
          this.cbStack.splice(this.cbStack.indexOf(item), 1);
        }
      }
    }
  };

  mono.messageStack = 50;
  mono.msgClearStack = msgTools.clearCbStack;
  mono.msgRemoveCbById = msgTools.removeCb;
  mono.msgClean = msgTools.clean;

  mono.sendMessage = function(message, cb, hook) {
    message = {
      data: message,
      hook: hook
    };
    if (cb) {
      msgTools.addCb(message, cb.bind(this));
    }
    mono.sendMessage.send.call(this, message);

    return message.callbackId;
  };

  mono.sendMessageToActiveTab = function(message, cb, hook) {
    message = {
      data: message,
      hook: hook
    };
    if (cb) {
      msgTools.addCb(message, cb.bind(this));
    }
    mono.sendMessage.sendToActiveTab.call(this, message);

    return message.callbackId;
  };

  mono.sendHook = {};

  mono.onMessage = function(cb) {
    var index = mono.onMessage.count++;
    var func = mono.onMessage.wrapFunc.bind(this, cb, index);
    cb.monoCbId = index;
    mono.onMessage.on.call(this, mono.onMessage.wrapper[index] = func);
  };
  mono.onMessage.count = 0;
  mono.onMessage.wrapper = {};
  mono.onMessage.wrapFunc = function(cb, index, message, response) {
    if (message.responseId !== undefined) {
      return msgTools.callCb(message);
    }
    var mResponse;
    if (message.callbackId === undefined) {
      mResponse = mono.emptyFunc;
    } else {
      mResponse = msgTools.mkResponse.bind(msgTools, response.bind(this), message.callbackId);
    }
    if (message.hook !== undefined) {
      if (index !== 0) {
        return;
      }
      var hookFunc = mono.sendHook[message.hook];
      if (hookFunc !== undefined) {
        return hookFunc(message.data, mResponse);
      }
    }
    cb.call(this, message.data, mResponse);
  };

  mono.offMessage = function(cb) {
    var func = mono.onMessage.wrapper[cb.monoCbId];
    if (func === undefined) {
      return;
    }
    delete mono.onMessage.wrapper[cb.monoCbId];
    delete cb.monoCbId;
    mono.onMessage.off(func);
  };

  mono.msgList.gm = function() {
    var gmMsg = {
      cbList: [],
      onMessage: function(_message) {
        var message = mono.cloneObj(_message);
        var response = gmMsg.onMessage;
        for (var i = 0, cb; cb = gmMsg.cbList[i]; i++) {
          if (this.isBg === cb.isBg) {
            continue;
          }
          cb(message, response.bind({
            isBg: cb.isBg
          }));
        }
      },
      on: function(cb) {
        cb.isBg = this.isBg;
        gmMsg.cbList.push(cb);
      },
      off: function(cb) {
        var cbList = gmMsg.cbList;
        var pos = cbList.indexOf(cb);
        if (pos === -1) {
          return;
        }
        cbList.splice(pos, 1);
      }
    };
    gmMsg.send = gmMsg.onMessage;

    mono.onMessage.on = gmMsg.on;
    mono.onMessage.off = gmMsg.off;
    mono.sendMessage.send = gmMsg.send;
    mono.sendMessage.sendToActiveTab = gmMsg.onMessage.bind({
      isBg: true
    });
  };

  var func = mono.msgList[mono.msgType];
  if (func !== undefined) {
    func();
  } else {
    console.error('Msg transport is not defined!');
  }
  func = undefined;
  mono.msgList = undefined;

  (function storageDefine() {

    if (mono.isGM) {
      mono.storageType = 'gm';
      return;
    }

  })();

  mono.storageList.gm = function() {
    var storage = {
      get: function(src, cb) {
        var key, value, obj = {},
          i, len;
        if (src === undefined || src === null) {
          var nameList = GM_listValues();
          for (i = 0, len = nameList.length; i < len; i++) {
            key = nameList[i];
            value = GM_getValue(key, 'isMonoEmptyValue');
            if (value !== undefined && value !== null && value !== 'undefined' && value !== 'isMonoEmptyValue') {
              if (typeof value !== 'object') {
                obj[key] = value;
              } else {
                obj[key] = JSON.parse(JSON.stringify(value));
              }
            }
          }
          return cb(obj);
        }
        if (Array.isArray(src) === false) {
          src = [src];
        }
        for (i = 0, len = src.length; i < len; i++) {
          key = src[i];
          value = GM_getValue(key, 'isMonoEmptyValue');
          //todo: rm null and 'undefined'
          if (value !== undefined && value !== null && value !== 'undefined' && value !== 'isMonoEmptyValue') {
            if (typeof value !== 'object') {
              obj[key] = value;
            } else {
              obj[key] = JSON.parse(JSON.stringify(value));
            }
          }
        }
        cb(obj);
      },
      set: function(obj, cb) {
        var value;
        for (var key in obj) {
          value = obj[key];
          if (typeof value !== 'object') {
            if (value === undefined) {
              value = 'isMonoEmptyValue';
            }
            GM_setValue(key, value);
          } else {
            GM_setValue(key, JSON.parse(JSON.stringify(value)));
          }
        }
        cb && cb();
      },
      remove: function(arr, cb) {
        if (Array.isArray(arr) === false) {
          arr = [arr];
        }
        for (var i = 0, len = arr.length; i < len; i++) {
          var key = arr[i];
          if (storage.hasDeleteValue) {
            GM_deleteValue(key);
          } else {
            GM_setValue(key, 'isMonoEmptyValue');
          }
        }
        cb && cb();
      },
      clear: function(cb) {
        var nameList = GM_listValues();
        for (var i = 0, len = nameList.length; i < len; i++) {
          var key = nameList[i];
          if (storage.hasDeleteValue) {
            GM_deleteValue(key);
          } else {
            GM_setValue(key, 'isMonoEmptyValue');
          }
        }
        cb && cb();
      }
    };
    storage.hasDeleteValue = typeof GM_deleteValue !== 'undefined';

    mono.storage = storage;
    mono.storage.local = mono.storage.sync = mono.storage;
  };

  func = mono.storageList[mono.storageType];
  if (func !== undefined) {
    func();
  } else {
    console.error('Storage is not defined!');
  }
  func = undefined;
  mono.storageList = undefined;

  //> utils
  if (mono.isChrome) {
    mono.onMessage.on.lowLevelHook.hasInject = function(message, sender, response) {
      if (location.href !== message.url) {
        return setTimeout(function() {
          response(null);
        }, 1000);
      }
      response(1);
    }
  }

  mono.parseXhrHeader = function(head) {
    head = head.replace(/\r?\n/g, '\n').split('\n');
    var obj = {
      monoParsed: 1
    };
    for (var i = 0, len = head.length; i < len; i++) {
      var keyValue = head[i].split(':');
      if (keyValue.length < 2) {
        continue;
      }
      var key = keyValue[0].trim().toLowerCase();
      obj[key] = keyValue[1].trim();
    }
    return obj;
  };

  mono.ajax = function(obj) {
    var url = obj.url;

    var method = obj.type || 'GET';
    method = method.toUpperCase();

    var data = obj.data;

    if (data && typeof data !== "string") {
      data = mono.param(data);
    }

    if (data && method === 'GET') {
      url += (url.indexOf('?') === -1 ? '?' : '&') + data;
      data = undefined;
    }

    if (obj.cache === false && ['GET','HEAD'].indexOf(method) !== -1) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now();
    }

    var xhr;
    if (obj.localXHR === undefined && mono.isGM) {
      xhr = {};
      xhr.method = method;
      xhr.url = url;
      xhr.data = data;
    } else {
      xhr = new (mono.isModule ? require('sdk/net/xhr').XMLHttpRequest : XMLHttpRequest)();
      xhr.open(method, url, true);
    }

    if (obj.timeout !== undefined) {
      xhr.timeout = obj.timeout;
    }

    if (obj.dataType) {
      obj.dataType = obj.dataType.toLowerCase();

      if (!(mono.noXhrJson && obj.dataType === 'json')) {
        xhr.responseType = obj.dataType;
      }
    }

    if (!obj.headers) {
      obj.headers = {};
    }

    if (obj.contentType) {
      obj.headers["Content-Type"] = obj.contentType;
    }

    if (data && !obj.headers["Content-Type"]) {
      obj.headers["Content-Type"] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    if (obj.localXHR === undefined && mono.isGM) {
      xhr.responseType = 'text';
      xhr.overrideMimeType = obj.mimeType;
      xhr.headers = obj.headers;
      xhr.onload = function(_xhr) {
        var xhr = mono.extend({}, _xhr);
        var isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
        if (!isSuccess) {
          return obj.error && obj.error(xhr);
        }

        var response;
        if (typeof xhr.responseText === 'string') {
          response = xhr.responseText;
        } else
        if (typeof xhr.response === 'string') {
          response = xhr.response;
        }

        if (typeof response === 'string') {
          xhr.response = response;
          xhr.responseText = response;

          if (obj.dataType === 'json') {
            try {
              xhr.response = JSON.parse(response);
            } catch (e) {
              console.error('[XHR] Data parse error!', obj, xhr);
            }
          }

          if (obj.mimeType === 'text/xml') {
            var parser = new DOMParser();
            xhr.response = xhr.responseXML = parser.parseFromString(response, 'text/xml');
          }
        }

        var responseHeaders = undefined;
        xhr.getResponseHeader = function(name) {
          name = name.toLowerCase();
          if (responseHeaders === undefined) {
            responseHeaders = mono.parseXhrHeader(xhr.responseHeaders);
          }
          return responseHeaders[name];
        };

        return obj.success && obj.success(xhr.response, xhr);
      };

      xhr.onerror = function(response) {
        obj.error && obj.error(response || {});
      };

      return GM_xmlhttpRequest(xhr);
    }

    if (obj.withCredentials) {
      xhr.withCredentials = true;
    }

    if (obj.mimeType && !(mono.isOpera && obj.mimeType === 'application/json')) {
      xhr.overrideMimeType(obj.mimeType);
    }

    for (var key in obj.headers) {
      xhr.setRequestHeader(key, obj.headers[key]);
    }

    if (mono.isOpera || mono.isSafari) {
      xhr.onreadystatechange = function () {
        if (mono.badXhrRedirect && xhr.readyState > 1 && (xhr.status === 302 || xhr.status === 0)) {
          // Opera xhr redirect
          if (obj.noRedirect === undefined) {
            obj.noRedirect = 0;
          }
          var location = xhr.getResponseHeader('Location');
          if (location && obj.noRedirect < 5) {
            obj.noRedirect++;
            var _obj = mono.extend({}, obj);
            _obj.url = location;
            delete obj.success;
            delete obj.error;
            var _xhr = mono.ajax(_obj);
            xhr.abort = _xhr.abort;
          }
        }
        if (mono.badXhrHeadRedirect && xhr.readyState > 1 && method === 'HEAD') {
          // Safari on HEAD 302 redirect fix
          obj.success && obj.success(undefined, xhr);
          delete obj.success;
          delete obj.error;
          xhr.abort();
        }
      };
    }

    if (obj.onTimeout !== undefined) {
      xhr.ontimeout = function() {
        obj.onTimeout();
      };
    }

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ||
        ( mono.badXhrZeroResponse && xhr.status === 0 && xhr.response) ) {
        var response = (obj.dataType) ? xhr.response : xhr.responseText;
        if (obj.dataType === 'json' && typeof response !== 'object' && xhr.responseText) {
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {}
        }
        return obj.success && obj.success(response, xhr);
      }
      obj.error && obj.error(xhr);
    };

    xhr.onerror = function(e) {
      obj.error && obj.error(xhr);
    };

    try {
      xhr.send(data);
    } catch (e) {
      // NS_ERROR_FILE_NOT_FOUND
      obj.error && obj.error({});
    }

    return xhr;
  };

  mono.extend = function() {
    var obj = arguments[0];
    for (var i = 1, len = arguments.length; i < len; i++) {
      var item = arguments[i];
      for (var key in item) {
        obj[key] = item[key];
      }
    }
    return obj;
  };

  mono.param = function(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
    var itemsList = [];
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      if (obj[key] === undefined || obj[key] === null) {
        obj[key] = '';
      }
      itemsList.push(encodeURIComponent(key)+'='+encodeURIComponent(obj[key]));
    }
    return itemsList.join('&');
  };

  mono.capitalize = function(word) {
    return word.charAt(0).toUpperCase() + word.substr(1);
  };

  mono.create = function(tagName, obj) {
    var el;
    var func;
    if (typeof tagName !== 'object') {
      el = document.createElement(tagName);
    } else {
      el = tagName;
    }
    for (var attr in obj) {
      var value = obj[attr];
      if (func = mono.create.hook[attr]) {
        func(el, value);
        continue;
      }
      el[attr] = value;
    }
    return el;
  };
  mono.create.hook = {
    text: function(el, value) {
      el.textContent = value;
    },
    data: function(el, value) {
      for (var item in value) {
        el.dataset[item] = value[item];
      }
    },
    class: function(el, value) {
      if (Array.isArray(value)) {
        for (var i = 0, len = value.length; i < len; i++) {
          el.classList.add(value[i]);
        }
      } else {
        el.setAttribute('class', value);
      }
    },
    style: function(el, value) {
      if (typeof value === 'object') {
        for (var item in value) {
          el.style[item] = value[item];
        }
      } else {
        el.setAttribute('style', value);
      }
    },
    append: function(el, value) {
      if (!Array.isArray(value)) {
        value = [value];
      }
      for (var i = 0, len = value.length; i < len; i++) {
        var node = value[i];
        if (!node && node !== 0) {
          continue;
        }
        if (typeof node !== 'object') {
          node = document.createTextNode(node);
        }
        el.appendChild(node);
      }
    },
    on: function(el, eventList) {
      if (typeof eventList[0] !== 'object') {
        eventList = [eventList];
      }
      for (var i = 0, len = eventList.length; i < len; i++) {
        var args = eventList[i];
        mono.on(el, args[0], args[1], args[2]);
      }
    },
    onCreate: function(el, value) {
      value.call(el, el);
    }
  };

  mono.parseTemplate = function(list, fragment) {
    if (typeof list === "string") {
      if (list[0] !== '[') {
        return document.createTextNode(list);
      }
      try {
        list = list.replace(/"/g, '\\u0022').replace(/\\'/g, '\\u0027').replace(/'/g, '"').replace(/([{,])\s*([a-zA-Z0-9]+):/g, '$1"$2":');
        list = JSON.parse(list);
      } catch (e) {
        return document.createTextNode(list);
      }
    }
    if (!Array.isArray(list)) {
      return document.createTextNode(list);
    }
    fragment = fragment || document.createDocumentFragment();
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (typeof item === 'object') {
        for (var tagName in item) {
          var el = item[tagName];
          var append = el.append;
          delete el.append;
          var dEl;
          fragment.appendChild(dEl = mono.create(tagName, el));
          if (append !== undefined) {
            mono.parseTemplate(append, dEl);
          }
        }
      } else {
        fragment.appendChild(document.createTextNode(item));
      }
    }
    return fragment;
  };

  mono.trigger = function(el, type, data) {
    if (data === undefined) {
      data = {};
    }
    if (data.bubbles === undefined) {
      data.bubbles = false;
    }
    if (data.cancelable === undefined) {
      data.cancelable = false;
    }
    var event = new CustomEvent(type, data);
    el.dispatchEvent(event);
  };

  mono.str2regexp = function(s) {
    return new RegExp('^' + s.replace(/\./g, '\\.').replace(/\*/g, '.*?') + '$');
  };

  mono.checkUrl = function(url, rules) {
    return rules.some(function(rule){
      if (typeof rule === 'string') {
        rule = mono.str2regexp(rule);
      }
      return rule.test(url)
    });
  };

  mono.isIframe = function() {
    if (mono.isFF) {
      return window.parent !== window;
    } else {
      return window.top !== window.self;
    }
  };

  mono.uniFix = function() {
    if (mono.isOpera) {
      if (typeof location === 'undefined') {
        location = document.location;
      }
      if (typeof navigator === 'undefined') {
        navigator = window.navigator;
      }
      if (typeof localStorage === 'undefined') {
        localStorage = window.localStorage;
      }
      if (typeof CustomEvent === 'undefined') {
        CustomEvent = window.CustomEvent;
      }
      if (typeof XMLHttpRequest === 'undefined') {
        XMLHttpRequest = window.XMLHttpRequest;
      }
      if (typeof btoa === 'undefined') {
        btoa = window.btoa.bind(window);
      }
      if (typeof atob === 'undefined') {
        atob = window.atob.bind(window);
      }
    }
    if (mono.isSafari && typeof CustomEvent === 'undefined') {
      CustomEvent = function (event, params) {
        params = params || { bubbles: false, cancelable: false };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };
      CustomEvent.prototype = window.Event.prototype;
    }
  };

  mono.userJsCheck = function() {
    if (mono.isGM) {
      return;
    }
    try {
      if(window.sessionStorage && window.sessionStorage['savefrom-helper-userjs'] === '1') {
        mono.sendMessage({action: 'userjsDetected'});
      }
    } catch (e) {}
  };

  mono.setExtensionSession = function() {
    try {
      window.sessionStorage && (window.sessionStorage['savefrom-helper-extension'] = '1');
    } catch (e) {}
  };

  mono.onReady = function(moduleName, cb) {
    if (mono.isGM) {
      _modules[moduleName] = function() { cb(moduleName); };
      return;
    }

    if (mono.onReady.moduleList.indexOf(moduleName) !== -1) {
      return;
    }
    mono.onReady.moduleList.push(moduleName);

    mono.uniFix();

    mono.setExtensionSession();

    if (mono.isChrome || mono.isFF || document.readyState === 'complete') {
      return setTimeout(function() {
        cb(moduleName);
        mono.userJsCheck();
      });
    }

    var complete = function() {
      document.removeEventListener( "DOMContentLoaded", complete, false );
      window.removeEventListener( "load", complete, false );
      cb(moduleName);
      mono.userJsCheck();
    };
    document.addEventListener('DOMContentLoaded', complete, false);
    window.addEventListener('load', complete, false);
  };
  mono.onReady.moduleList = [];

  mono.onPageReady = function(cb) {
    if (mono.isChrome || mono.isFF || document.readyState === 'complete') {
      return setTimeout(function() {
        cb();
      });
    }

    mono.onPageReady.cbList.push(cb);
    if (mono.onPageReady.cbList.length > 1) {
      return;
    }

    var complete = function() {
      document.removeEventListener( "DOMContentLoaded", complete, false );
      window.removeEventListener( "load", complete, false );
      while (mono.onPageReady.cbList.length > 0) {
        var cbItem = mono.onPageReady.cbList.splice(0, 1)[0];
        cbItem();
      }
    };
    document.addEventListener('DOMContentLoaded', complete, false);
    window.addEventListener('load', complete, false);
  };
  mono.onPageReady.cbList = [];

  mono.loadModule = function(moduleName, cb, isAvailable) {
    var moduleNameList = mono.loadModule.moduleNameList;
    if (moduleNameList.indexOf(moduleName) !== -1) {
      return;
    }
    moduleNameList.push(moduleName);

    if (mono.isGM) {
      _modules[moduleName] = mono.loadModule.gmLoadModule.bind(null, moduleName, cb, isAvailable);
      return;
    }

    var moduleList = mono.loadModule.moduleList;
    moduleList.push(arguments);
    if (moduleList.length > 1) {
      return;
    }

    if (mono.loadModule.initData) {
      mono.loadModule.moduleLoad(mono.loadModule.initData);
    } else {
      mono.uniFix();
      mono.loadModule.getData();
    }
  };
  mono.loadModule.getData = function() {
    "use strict";
    var hasData = false;
    var limit = 50;
    (function getData() {
      if (hasData) {
        return;
      }
      mono.sendMessage(['getPreference', 'getLanguage'], function(data) {
        if (hasData) {
          return;
        }
        hasData = true;

        mono.global.language = data.getLanguage;
        mono.global.preference = data.getPreference;

        mono.loadModule.initData = data;
        mono.loadModule.moduleLoad(mono.loadModule.initData);
      });

      limit--;
      if (limit < 0) {
        return;
      }
      setTimeout(function() {
        getData();
      }, 100);
    })();
  };
  mono.loadModule.initData = null;
  mono.loadModule.moduleNameList = [];
  mono.loadModule.moduleList = [];
  mono.loadModule.moduleLoad = function(data) {
    var hasActiveModule = false;

    var moduleList = mono.loadModule.moduleList;
    while (moduleList.length > 0) {
      var item = moduleList.splice(0, 1)[0];
      if (item[2](data)) {
        mono.onPageReady(item[1].bind(null, item[0], data));
        hasActiveModule = true;
      }
    }
    mono.loadModule.initData = null;

    if (hasActiveModule) {
      mono.setExtensionSession();
      mono.userJsCheck();
    }
  };
  mono.loadModule.gmLoadModule = function(moduleName, cb, isAvailable) {
    mono.uniFix();
    mono.sendMessage(['getPreference', 'getLanguage'], function(data) {
      mono.global.language = data.getLanguage;
      mono.global.preference = data.getPreference;

      if (isAvailable(data)) {
        cb(moduleName, data);
      }
    });
  };

  mono.openTab = function(url, select, active) {
    select = (select === undefined)?true:!!select;
    if (mono.isChrome) {
      var options = {url: url, selected: select};
      if (active) {
        options.active = !!active;
      }
      chrome.tabs.create(options);
    } else
    if (mono.isFF) {
      var tabs = require("sdk/tabs");
      tabs.open(url);
    } else
    if (mono.isSafari) {
      var window = safari.application.activeBrowserWindow;
      var tab = window.openTab();
      tab.url = url;
      if (select) {
        tab.activate();
      }
    } else
    if (mono.isOpera) {
      opera.extension.tabs.create({ url: url, focused: select });
    } else
    if (mono.isGM) {
      if (typeof GM_openInTab === 'undefined') {
        return;
      }
      GM_openInTab(url, {
        active: select,
        insert: true
      });
    }
  };
  mono.getCurrentPageUrl = function(cb) {
    if (mono.isChrome) {
      chrome.tabs.getSelected(null, function (tab) {
        cb(tab.url);
      });
    } else
    if (mono.isFF) {
      var tabs = require("sdk/tabs");
      cb(tabs.activeTab.url);
    } else
    if (mono.isSafari) {
      cb(safari.application.activeBrowserWindow.activeTab.url || '');
    } else
    if (mono.isOpera) {
      var tab = opera.extension.tabs.getFocused();
      cb(tab.url);
    } else
    if (mono.isGM) {
      cb(location.href);
    }
  };
  mono.contains = function() {
    var rnative = /^[^{]+\{\s*\[native \w/;
    if (rnative.test(document.compareDocumentPosition) || rnative.test(document.contains)) {
      mono.contains = function(a, b) {
        // from Sizzle
        var adown = a.nodeType === 9 ? a.documentElement : a,
          bup = b && b.parentNode;
        return a === bup || !!( bup && bup.nodeType === 1 && (
            adown.contains ?
              adown.contains( bup ) :
            a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
          ));
      };
    } else {
      mono.contains = function(a, b) {
        if (b) {
          while (b = b.parentNode) {
            if (b === a) {
              return true;
            }
          }
        }
        return false;
      };
    }
    return mono.contains.apply(this, arguments);
  };
  (function() {
    "use strict";
    var getTwoElParent = function(a, b, parentList) {
      parentList.unshift(b);
      while (b = b.parentNode) {
        if (mono.contains(b, a)) {
          return b;
        }
        parentList.unshift(b);
      }
      return null;
    };
    var wrapEvent = function (origType, fixType, origEvent, capture) {
      return !capture ? function (event) {
        var related = event.relatedTarget;
        var target = this;
        if (!related || (related !== target && !mono.contains(target, related))) {
          origEvent.call(this, {
            type: origType,
            target: event.target,
            preventDefault: event.preventDefault,
            stopPropagation: event.stopPropagation
          });
        }
      } : function (event) {
        var related = event.relatedTarget;
        var target = event.target;
        var parentList = [];
        if (!related || mono.contains(related, target) || (related = getTwoElParent(related, target, parentList))) {
          if (parentList.length === 0) {
            while (target !== related) {
              parentList.unshift(target);
              target = target.parentNode;
            }
          }
          while (target = parentList.shift()) {
            origEvent.call(this, {
              type: origType,
              target: target,
              preventDefault: event.preventDefault,
              stopPropagation: event.stopPropagation
            });
          }
        }
      };
    };

    var functionMap = {
      key: 'fixEvent-',
      eventId: 0,
      replaceList: {}
    };
    mono.on = function(el, type, onEvent, capture) {
      if (type === 'mouseenter' || type === 'mouseleave') {
        if ((mono.isFF || (mono.isGM && !mono.isTM && !mono.isVM) || mono.isSafari) && el === document && !capture) {
          el = document.body;
        }

        if (mono.noMouseEnter) {
          var cacheEventKey = functionMap.key;
          var origEvent = onEvent;
          var origType = type;
          var origCapture = capture;

          if (type === 'mouseenter') {
            type = 'mouseover';
          } else
          if (type === 'mouseleave') {
            type = 'mouseout';
          }
          cacheEventKey += type;
          if (capture) {
            cacheEventKey += '-1';
            capture = false;
          }

          if (origEvent[cacheEventKey] === undefined) {
            var eventId = functionMap.eventId++;
            origEvent[cacheEventKey] = eventId;

            onEvent = wrapEvent(origType, type, origEvent, origCapture);

            functionMap.replaceList[eventId] = onEvent;
          } else {
            onEvent = functionMap.replaceList[origEvent[cacheEventKey]];
          }
        }
      }

      el.addEventListener(type, onEvent, capture);
    };

    mono.off = function(el, type, onEvent, capture) {
      if (type === 'mouseenter' || type === 'mouseleave') {
        if ((mono.isFF || (mono.isGM && !mono.isTM && !mono.isVM) || mono.isSafari) && el === document && !capture) {
          el = document.body;
        }

        if (mono.noMouseEnter) {
          var cacheEventKey = functionMap.key;
          if (type === 'mouseenter') {
            type = 'mouseover';
          } else
          if (type === 'mouseleave') {
            type = 'mouseout';
          }
          cacheEventKey += type;
          if (capture) {
            cacheEventKey += '-1';
            capture = false;
          }

          var eventId = onEvent[cacheEventKey];
          if (eventId !== undefined) {
            onEvent = functionMap.replaceList[eventId];
          }
        }
      }

      el.removeEventListener(type, onEvent, capture);
    };
  }());

  (function() {
    var vars = {
      lastUrl: undefined,
      timer: undefined,
      eventList: []
    };

    var checkUrlChange = function() {
      var url = document.location.href;

      if (vars.lastUrl === url) {
        return;
      }

      var oldUrl = vars.lastUrl;
      vars.lastUrl = url;

      for (var i = 0, len = vars.eventList.length; i < len; i++) {
        vars.eventList[i](vars.lastUrl, oldUrl);
      }
    };

    mono.onUrlChange = function(cb, now) {
      if (vars.eventList.indexOf(cb) !== -1) {
        return;
      }

      var currentUrl = window.location.href;

      vars.eventList.push(cb);

      now && cb(currentUrl);

      if (vars.eventList.length > 1) {
        return;
      }

      vars.lastUrl = currentUrl;

      vars.timer = setInterval(checkUrlChange, 1000);

      // window.addEventListener('popstate', onUrlChangeListener);
    };

    mono.offUrlChange = function(cb) {
      var pos = vars.eventList.indexOf(cb);
      if (pos === -1) {
        return;
      }
      vars.eventList.splice(pos, 1);

      if (vars.eventList.length === 0) {
        clearInterval(vars.timer);
        // window.removeEventListener('popstate', onUrlChangeListener);
      }
    };

    mono.clearUrlChange = function() {
      vars.eventList.splice(0);
      clearInterval(vars.timer);
    };
  }());

  mono.global = {};

  mono.initGlobal = function(cb, args) {
    args = args || [];
    if (mono.global.language && mono.global.preference && args.length === 0) {
      return cb({getLanguage: mono.global.language, getPreference: mono.global.preference});
    }
    mono.sendMessage(['getLanguage', 'getPreference'].concat(args), function(response) {
      mono.global.language = response.getLanguage;
      mono.global.preference = response.getPreference;
      cb(response);
    });
  };

  mono.getParentByClass = function(el, classList) {
    if (typeof classList === 'string') {
      classList = [classList];
    }

    for(var parent = el; parent; parent = parent.parentNode) {
      if (parent.nodeType !== 1) {
        return null;
      }
      for (var i = 0, className; className = classList[i]; i++) {
        if (parent.classList.contains(className)) {
          return parent;
        }
      }
    }

    return null;
  };

  mono.parseUrlParams = function(url, options) {
    options = options || {};
    var startFrom = url.indexOf('?');
    var query = url;
    if (!options.argsOnly && startFrom !== -1) {
      query = url.substr(startFrom + 1);
    }
    var sep = options.forceSep || '&';
    if (!options.forceSep && query.indexOf('&amp;') !== -1) {
      sep = '&amp;';
    }
    var dblParamList = query.split(sep);
    var params = {};
    for (var i = 0, len = dblParamList.length; i < len; i++) {
      var item = dblParamList[i];
      var ab = item.split('=');
      if (options.useDecode) {
        params[ab[0]] = decodeURIComponent(ab[1] || '');
      } else {
        params[ab[0]] = ab[1] || '';
      }

    }
    return params;
  };

  mono.throttle = function(fn, threshhold, scope) {
    threshhold = threshhold || 250;
    var last;
    var deferTimer;
    return function () {
      var context = scope || this;

      var now = Date.now();
      var args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  mono.debounce = function(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  };

  mono.getDomain = function(url, strip) {
    var m = url.match(/:\/\/(?:[^\/?#]*@)?([^:\/?#]+)/);
    m = m && m[1];
    if (m) {
      if (strip) {
        m = m.replace(/^www\./, '');
      }
      return m;
    }
  };

  // legacy

  mono.getQueryString = function(query, key_prefix, key_suffix) {
    if(!query || typeof(query) != 'object')
      return '';

    if(key_prefix === undefined)
      key_prefix = '';

    if(key_suffix === undefined)
      key_suffix = '';

    var str = '';
    for(var key in query)
    {
      if(str.length)
        str += '&';

      if(query[key] instanceof Object)
      {
        if(!key_prefix)
          key_prefix = '';

        if(!key_suffix)
          key_suffix = '';

        str += mono.getQueryString(query[key], key_prefix + key + "[", "]" + key_suffix);
      }
      else
        str += key_prefix + escape(key) + key_suffix + '=' + escape(query[key]);
    }

    return str;
  };

  mono.decodeUnicodeEscapeSequence = function(text) {
    return JSON.parse(JSON.stringify(text)
      .replace(mono.decodeUnicodeEscapeSequence.re, '$1'));
  };
  mono.decodeUnicodeEscapeSequence.re = /\\(\\u[0-9a-f]{4})/g;

  mono.fileName = {
    maxLength: 80,

    rtrim: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

    illegalRe: /[\/\?<>\\:\*\|":]/g,

    controlRe: /[\x00-\x1f\x80-\x9f]/g,

    reservedRe: /^\.+/,

    trim: function(text) {
      return text.replace(this.rtrim);
    },

    partsRe: /^(.+)\.([a-z0-9]{1,4})$/i,

    getParts: function (name) {
      return name.match(this.partsRe);
    },

    specialChars: ('nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2' +
    ',sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml' +
    ',Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml' +
    ',times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil' +
    ',egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash' +
    ',ugrave,uacute,ucirc,uuml,yacute,thorn,yuml').split(','),
    specialCharsList: [['amp','quot','lt','gt'], [38,34,60,62]],

    specialCharsRe: /&([^;]{2,6});/g,

    decodeSpecialChars: function(text) {
      var _this = this;
      return text.replace(this.specialCharsRe, function(text, word) {
        var code;
        if (word[0] === '#') {
          code = parseInt(word.substr(1));
          if (isNaN(code)) return '';
          return String.fromCharCode(code);
        }
        var pos = _this.specialCharsList[0].indexOf(word);
        if (pos !== -1) {
          code = _this.specialCharsList[1][pos];
        }
        pos = _this.specialChars.indexOf(word);
        if (pos !== -1) {
          code = pos + 160;
        }
        if (code !== undefined) {
          return String.fromCharCode(code);
        }
        return '';
      });
    },

    rnRe: /\r?\n/g,

    re1: /[\*\?"]/g,

    re2: /</g,

    re3: />/g,

    spaceRe: /[\s\t\uFEFF\xA0]+/g,

    dblRe: /(\.|\!|\?|_|,|\-|\:|\+){2,}/g,

    re4: /[\.,:;\/\-_\+=']$/g,

    modify: function (name) {
      if (!name) {
        return '';
      }

      name = mono.decodeUnicodeEscapeSequence(name);

      try {
        name = decodeURIComponent(name);
      } catch (err) {
        name = unescape(name);
      }

      name = this.decodeSpecialChars(name);

      name = name.replace(this.rnRe, ' ');

      name = this.trim(name);

      name = name.replace(this.re1, '')
        .replace(this.re2, '(')
        .replace(this.re3, ')')
        .replace(this.spaceRe, ' ')
        .replace(this.dblRe, '$1')
        .replace(this.illegalRe, '_')
        .replace(this.controlRe, '')
        .replace(this.reservedRe, '')
        .replace(this.re4, '');

      if (name.length <= this.maxLength) {
        return name;
      }

      var parts = this.getParts(name);
      if (parts && parts.length == 3) {
        parts[1] = parts[1].substr(0, this.maxLength);
        return parts[1] + '.' + parts[2];
      }

      return name;
    }
  };
  mono.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  };
  mono.dataAttr2Selector = function(dataName) {
    return 'data-'+dataName.replace(/[A-Z]/g, function(lit) {
        return '-'+lit.toLowerCase();
      });
  };
  mono.isEmptyObject = function(obj) {
    for (var item in obj) {
      return false;
    }
    return true;
  };

  mono.asyncCall = function(cb) {
    "use strict";
    var _setTimeout;
    if (mono.isModule) {
      _setTimeout = require("sdk/timers").setTimeout;
    } else {
      _setTimeout = setTimeout;
    }
    _setTimeout(function() {
      cb();
    });
  };

  mono.getPageScript = function(html, match) {
    "use strict";
    if (match && !Array.isArray(match)) {
      match = [match];
    }
    var scriptList = [];
    html.replace(/<script(?:|\s[^>]+[^\/])>/g, function(text, offset) {
      offset += text.length;
      var endPos = html.indexOf('<\/script>', offset);
      if (endPos !== -1) {
        var content = html.substr(offset, endPos - offset);
        if (match) {
          match.every(function(r) {
            return r.test(content);
          }) && scriptList.push(content);
        } else {
          scriptList.push(content);
        }
      }
    });
    return scriptList;
  };
  mono.findJson = function(html, match) {
    "use strict";
    if (match && !Array.isArray(match)) {
      match = [match];
    }
    var rawJson = [];
    var obj = {
      '{': 0,
      '[': 0
    };
    var map = {'}': '{', ']': '['};
    var jsonSymbols = /[{}\]\[":0-9.,]/;
    var whiteSpace = /\r\n\s\t/;
    var jsonText = '';
    for (var i = 0, symbol; symbol = html[i]; i++) {
      if (symbol === '"') {
        var end = i;
        while (end !== -1 && (end === i || html[end - 1] === '\\')) {
          end = html.indexOf('"', end + 1);
        }
        if (end === -1) {
          end = html.length - 1;
        }
        jsonText += html.substr(i, end - i + 1);
        i = end;
        continue;
      }

      if (!jsonSymbols.test(symbol)) {
        if (symbol === 't' && html.substr(i, 4) === 'true') {
          jsonText += 'true';
          i+=3;
        } else
        if (symbol === 'f' && html.substr(i, 5) === 'false') {
          jsonText += 'false';
          i+=4;
        } else
        if (symbol === 'n' && html.substr(i, 4) === 'null') {
          jsonText += 'null';
          i+=3;
        } else
        if (!whiteSpace.test(symbol)) {
          obj['{'] = 0;
          obj['['] = 0;
          jsonText = '';
        }
        continue;
      }

      jsonText += symbol;

      if (symbol === '{' || symbol === '[') {
        if (!obj['{'] && !obj['[']) {
          jsonText = symbol;
        }
        obj[symbol]++;
      } else
      if (symbol === '}' || symbol === ']') {
        obj[map[symbol]]--;
        if (!obj['{'] && !obj['[']) {
          rawJson.push(jsonText);
        }
      }
    }
    var jsonList = [];
    for (var i = 0, item; item = rawJson[i]; i++) {
      if (item === '{}' || item === '[]') {
        continue;
      }
      try {
        if (match) {
          match.every(function(r) {
            return r.test(item);
          }) && jsonList.push(JSON.parse(item));
        } else {
          jsonList.push(JSON.parse(item));
        }
      } catch(e) {
        // console.log('bad json', item);
      }
    }
    return jsonList;
  };

  mono.styleObjToText = function(insertStyle, btnId){
    var itemToText = function(styleList) {
      var content = [];
      for (var item in styleList) {
        var key = item.replace(/([A-Z])/g, function(text, letter) {
          return '-' + letter.toLowerCase();
        });
        content.push(key + ':' + styleList[item]);
      }
      return content.join(';');
    };

    var styleText = [];
    for (var selector in insertStyle) {
      var item = insertStyle[selector];
      var selectorList = selector.split(',');
      var cssSelector = '';
      for (var i = 0, len = selectorList.length; i < len; i++) {
        var selectorItem = selectorList[i];
        var sep = ' ';
        if (!selectorItem || [':', '\\'].indexOf(selectorItem[0]) !== -1) {
          sep = '';
          if (selectorItem[0] === '\\') {
            selectorItem = selectorItem.substr(1);
          }
        }
        if (i > 0) {
          cssSelector += ',';
        }
        cssSelector += btnId + sep + selectorItem;
      }
      styleText.push(cssSelector + '{' + itemToText(item) + '}');

    }

    return styleText.join('');
  };

  mono.storage.getExpire = function(arr, cb, noRemove) {
    "use strict";
    var prefix = mono.storage.getExpire.prefix;
    var now = parseInt(Date.now() / 1000);
    if (!Array.isArray(arr)) {
      arr = [arr];
    }
    var getArr = [];
    for (var i = 0, key, len = arr.length; i < len; i++) {
      key = arr[i];
      getArr.push.apply(getArr, [key, key + prefix]);
    }
    mono.storage.get(getArr, function(storage) {
      var obj = {};
      var rmList = [];
      var r = new RegExp(prefix + '$');
      for (var key in storage) {
        if (r.test(key)) {
          continue;
        }
        if (storage[key + prefix] > now) {
          obj[key] = storage[key];
        } else {
          rmList.push(key);
        }
      }
      !noRemove && rmList.length && mono.storage.removeExpire(rmList);
      return cb(obj);
    });
  };

  mono.storage.getExpire.prefix = '_expire_';

  mono.storage.setExpire = function(obj, sec, cb) {
    "use strict";
    var prefix = mono.storage.getExpire.prefix;
    var now = parseInt(Date.now() / 1000);
    var setObj = {};
    for (var key in obj) {
      setObj[key] = obj[key];
      setObj[key + prefix] = now + sec;
    }
    mono.storage.set(setObj, function() {
      cb && cb();
    });
  };

  mono.storage.removeExpire = function(arr, cb) {
    "use strict";
    var prefix = mono.storage.getExpire.prefix;
    if (!Array.isArray(arr)) {
      arr = [arr];
    }
    var rmList = [];
    for (var i = 0, key, len = arr.length; i < len; i++) {
      key = arr[i];
      rmList.push.apply(rmList, [key, key + prefix]);
    }
    mono.storage.remove(rmList, function() {
      cb && cb();
    });
  };

  _mono && (function(tmpMono) {
    "use strict";
    _mono = null;
    var args, list;
    ['onReady', 'loadModule'].forEach(function(funcName) {
      if (!(list = tmpMono[funcName + 'Stack'])) {
        return 1;
      }
      while (args = list.shift()) {
        mono.asyncCall(function(args) {
          mono[funcName].apply(mono, args);
        }.bind(null, args));
      }
    });
  })(_mono);
  //<utils

  //@insert

  return mono;
}
));

var utils = {
  getFileSize: function(message, cb) {
    "use strict";
    var url = message.url;
    var response = {
      fileSize: 0,
      fileType: '',
      status: 0
    };
    mono.ajax({
      url: url,
      type: 'HEAD',
      success: function(data, xhr) {
        if (!xhr.getResponseHeader) {
          return cb(response);
        }

        response.status = xhr.status;

        var contentLength = xhr.getResponseHeader('Content-Length');
        if(contentLength) {
          contentLength = parseInt(contentLength);
          if(!isNaN(contentLength)) {
            response.fileSize = contentLength;
          }
        }

        var contentType = xhr.getResponseHeader('Content-Type');
        if(contentType) {
          response.fileType = contentType;
        }
        cb(response);
      },
      error: function(xhr) {
        response.status = xhr.status;
        cb(response);
      }
    });
  },
  downloadFile: function(message) {
    "use strict";
    var url = message.options.url;
    var filename = message.options.filename;
    if (mono.isFF) {
      return mono.sendMessage({action: 'download', url: url, filename: filename}, undefined, 'service');
    }
    if (mono.isChrome) {
      chrome.downloads.download({
        url: url,
        filename: filename
      });
    }
    if (mono.isGM) {
      GM_download(url, filename);
    }
  },
  downloadList: function(message) {
    "use strict";
    var list = message.fileList;
    var path = message.path;
    list.forEach(function(item) {
      utils.downloadFile({options: {url: item.url, filename: path + item.filename}});
    });
  },
  getUmmyIcon: function(message, cb) {
    "use strict";
    var icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB90lEQVQ4EcVSy2oUURCtqm7HcYgmYDTiYxEEERdZGP0B0UVwEcSv8LHIb4gbQcjGlVtB40YhfkAWuhs0uFOIgjJomiEzztzue4+n7rTgH6SaoqpPnao6fW+LHLapC9hdPHMbKT1UTcsQWxDBnAAdFkuvQ6QR1cD0QAUVoF+0kKdXBoO32j959maK8V1LVDaBDXkwm9q32atz/hmRpIZb5STqPaDIjP/oFAS5Xu1l/MPCBZhxt09uSRykCn1QhmQr1MiSQ3TPGYdIMtwfZPh3MjkhlvOWOcuTrJQB5VJeR0g5HlzjMSSVpp7mtQGFBJjXwJp69AlqtlTW0bpQ6nNLbTdjSCIxNhkOqUBwBconZYWZr1G6RgXcRoI782k0rO681vVq15o6SGyCrFefbHVnS6eNkmcSyMlOvr48ernimjlf5WcUuP1zr7C7W090/twiMcjw+y95dWcjXRr7Sn6Ba8mmB1RQ/MwqOK2mg356FPFi4xGm4z8I40nOT434OanElDdWM2aH/eAtHOlz98XZRBch0uPnHPu4J9uPn+dNzNGTLho/Kj+D1gza12fl1RuEtlmaaWPiGkOK8k0mecB5Nnes8DZvdiwPgRVrmbAp19aI8Fe2ZSDN86aOk9OpkfiHqfKoap9JfMTWfcavvNXN+/H9G596uPYX83AWUVC6/FsAAAAASUVORK5CYII=';
    cb(icon);
  },
  getWarningIcon: function(message, cb) {
    "use strict";
    var icon;
    var color = message.color || '#c2c2c2';
    if (message.type === 'audio') {
      icon = '<svg width="21px" height="24px" viewBox="0 0 21 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M21,2.76923077 L21,17.6487288 C21,17.6487288 21,17.6487288 21,17.6487288 L21,18.4615385 L20.9068729,18.4615385 C20.723595,19.2712249 20.2716013,20.0865791 19.5669296,20.7680198 C17.9203537,22.360313 15.5176896,22.6184747 14.2004289,21.3446402 C12.8831682,20.0708056 13.1501309,17.7473503 14.7967068,16.1550571 C16.0602516,14.9331676 17.7690324,14.4969051 19.0909091,14.9356816 L19.0909091,14.9356816 L19.0909091,4.15384615 L7.63636364,6.92307692 L7.63636364,19.4948826 C7.63636364,19.4948826 7.63636364,19.4948826 7.63636364,19.4948826 L7.63636364,20.3076923 L7.5432365,20.3076923 C7.35995859,21.1173788 6.90796493,21.9327329 6.20329323,22.6141737 C4.55671732,24.2064669 2.15405328,24.4646286 0.836792552,23.190794 C-0.480468173,21.9169595 -0.213505501,19.5935041 1.43307041,18.0012109 C2.69661523,16.7793214 4.40539601,16.343059 5.72727273,16.7818354 L5.72727273,16.7818354 L5.72727273,6.46153846 L5.72727273,3.69230769 L21,0 L21,2.76923077 Z" fill="'+color+'"></path></svg>';
    } else
    if (message.type === 'playlist') {
      icon = '<svg width="24px" height="18px" viewBox="0 0 24 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0,0 L0,3.6 L3.42857143,3.6 L3.42857143,0 L0,0 Z M0,7.2 L0,10.8 L3.42857143,10.8 L3.42857143,7.2 L0,7.2 Z M5.14285714,0 L5.14285714,3.6 L24,3.6 L24,0 L5.14285714,0 Z M5.14285714,7.2 L5.14285714,10.8 L20.5714286,10.8 L20.5714286,7.2 L5.14285714,7.2 Z M0,14.4 L0,18 L3.42857143,18 L3.42857143,14.4 L0,14.4 Z M5.14285714,14.4 L5.14285714,18 L22.2857143,18 L22.2857143,14.4 L5.14285714,14.4 Z" fill="'+color+'"></path></svg>';
    } else {
      // photo
      icon = '<svg width="24px" height="18px" viewBox="0 0 24 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19.5,3 L21.0089096,3 C22.6582294,3 24,4.34288718 24,5.99942248 L24,15.0005775 C24,16.6556493 22.6608432,18 21.0089096,18 L2.99109042,18 C1.34177063,18 0,16.6571128 0,15.0005775 L0,5.99942248 C0,4.34435073 1.33915679,3 2.99109042,3 L7.5,3 C7.5,1.34651712 8.84187067,0 10.497152,0 L16.502848,0 C18.1583772,0 19.5,1.34314575 19.5,3 L19.5,3 Z M13.5,16.5 C16.8137087,16.5 19.5,13.8137087 19.5,10.5 C19.5,7.18629134 16.8137087,4.5 13.5,4.5 C10.1862913,4.5 7.5,7.18629134 7.5,10.5 C7.5,13.8137087 10.1862913,16.5 13.5,16.5 Z M13.5,15 C15.9852815,15 18,12.9852815 18,10.5 C18,8.0147185 15.9852815,6 13.5,6 C11.0147185,6 9,8.0147185 9,10.5 C9,12.9852815 11.0147185,15 13.5,15 Z" fill="'+color+'"></path></svg>';
    }
    cb('data:image/svg+xml;utf8,'+encodeURIComponent(icon));
  },
  getUmmyRadioLogo: function(msg, cb) {
    "use strict";
    var icon = 'data:image/png;base64,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';
    cb(icon);
  },
  checkUrlsOfOpenTabs: function(regExpList, callback) {
    "use strict";
    var getUrlList = mono.isGM ? function(cb) {
      cb([location.href]);
    } : mono.isChrome ? function(cb) {
      var urlList = [];
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          urlList.push(tab.url);
        });
        cb(urlList);
      });
    } : mono.isFF ? function(cb) {
      var urlList = [];
      var ffTabs = require("sdk/tabs");
      for (var tab in ffTabs) {
        urlList.push(ffTabs[tab].url);
      }
      cb(urlList);
    } : mono.isOpera ? function(cb) {
      var urlList = [];
      var oTabs = opera.extension.tabs.getAll();
      oTabs.forEach(function(tab) {
        urlList.push(tab.url);
      });
      cb(urlList);
    } : mono.isSafari ? function(cb) {
      var urlList = [];
      safari.application.activeBrowserWindow.tabs.forEach(function(tab) {
        if (!tab.url) {
          return 1;
        }
        urlList.push(tab.url);
      });
      cb(urlList);
    } : function(cb) {
      cb([]);
    };

    getUrlList(function(urlList) {
      var foundUrlList = [];
      urlList.forEach(function(url) {
        regExpList.forEach(function(regexp) {
          if (url.search(regexp) !== -1 ) {
            foundUrlList.push(url);
          }
        });
      });
      callback(foundUrlList);
    });
  },
  langNormalization: function(lang) {
    "use strict";
    lang = String(lang || '').toLowerCase();

    var m = lang.match(/\(([^)]+)\)/);
    m = m && m[1];
    if (m) {
      lang = m;
    }

    var tPos = lang.indexOf('-');
    if (tPos !== -1) {
      var left = lang.substr(0, tPos);
      var right = lang.substr(tPos + 1);
      if (left === right) {
        lang = left;
      } else {
        lang = left + '-' + right.toUpperCase();
      }
    }

    return lang;
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return utils;
  };
}
typeof window === 'undefined' && (function() {
  var _window = require('sdk/window/utils').getMostRecentBrowserWindow();
  window = {};
  window.navigator = _window.navigator;
  if (typeof _window.URL === 'function' && _window.URL.hasOwnProperty('prototype') && _window.URL.prototype.hasOwnProperty('hostname')) {
    window.URL = _window.URL;
  }
  _window = null;

  var self = require('sdk/self');
  mono = require('toolkit/loader').main(require('toolkit/loader').Loader({
    paths: {
      'data/': self.data.url('js/')
    },
    name: self.name,
    prefixURI: self.data.url().match(/([^:]+:\/\/[^/]+\/)/)[1],
    globals: {
      console: console,
      _require: function(path) {
        "use strict";
        switch (path) {
          case 'sdk/simple-storage':
            return require('sdk/simple-storage');
          case 'sdk/net/xhr':
            return require('sdk/net/xhr');
          case 'sdk/tabs':
            return require('sdk/tabs');
          case 'sdk/timers':
            return require('sdk/timers');
          default:
            console.error('Module is not found!', path);
        }
      }
    }
  }), "data/mono");
  self = null;
})();

var engine = {};

engine.varCache = {
  // helper name
  helperName: undefined,
  // extension version
  currentVersion: undefined,
  // cache user js detected state
  userjsDetected: undefined,
  // trackTime for userTrack
  trackTime: 0,
  opButton: null,
  //current language from navigator
  navigatorLanguage: undefined,
  langList: ['de', 'en', 'ru', 'tr', 'uk', 'es', 'fr', 'id'],
  fromId: undefined,
  hasSovetnik: false,
  lastVersion: undefined,
  baseVersion: 'NS4zMS4y',
  meta: {},
  lastTrackTime: 0,

  isFirstrun: false,
  isUpgrade: false
};

engine.defaultPreferences = {
  version: '0',
  button: 1,
  lmFileHosting: 1,
  lmMediaHosting: 1,
  moduleYoutube: 1,
  moduleDailymotion: 1,
  moduleVimeo: 1,
  moduleFacebook: 1,
  moduleSoundcloud: 1,
  moduleVkontakte: 1,
  moduleOdnoklassniki: 1,
  moduleMailru: 1,
  moduleInstagram: 1,
  moduleRutube: 1,
  moduleShowDownloadInfo: 1,
  ytHideFLV: 0,
  ytHideMP4: 0,
  ytHideWebM: 1,
  ytHide3GP: 1,
  ytHide3D: 1,
  ytHideMP4NoAudio: 1,
  ytHideAudio_MP4: 1,
  vkShowBitrate: 0,
  sovetnikEnabled: 1,
  showUmmyInfo: 1,
  showUmmyBtn: 1,
  gmNativeDownload: 0,
  expIndex: 0
};

engine.preferences = {
  sfHelperName: undefined,
  country: undefined,
  hasDP: undefined,
  cohortIndex: undefined,
  downloads: undefined,
  ummyDetected: undefined,
  iframeDownload: undefined,
  showUmmyItem: undefined,
  button: undefined
};

engine.preferenceMap = {
  youtube: 'moduleYoutube',
  dailymotion: 'moduleDailymotion',
  vimeo: 'moduleVimeo',
  facebook: 'moduleFacebook',
  soundcloud: 'moduleSoundcloud',
  vk: 'moduleVkontakte',
  odnoklassniki: 'moduleOdnoklassniki',
  mailru: 'moduleMailru',
  instagram: 'moduleInstagram',
  rutube: 'moduleRutube'
};

engine.modules = {};

engine.onEvent = function(nameList, cb) {
  "use strict";
  if (!Array.isArray(nameList)) {
    nameList = [nameList];
  }
  var readyList = engine.onEvent.readyList;
  var found = nameList.every(function(name) {
    return readyList.indexOf(name) !== -1;
  });
  if (found) {
    return cb();
  }
  var onReadyList = engine.onEvent.onReadyList;
  onReadyList.push([nameList, cb]);
};
engine.onEvent.onReadyList = [];
engine.onEvent.readyList = [];
engine.onEvent.ready = function(name) {
  "use strict";
  var readyList = engine.onEvent.readyList;
  readyList.push(name);

  var onReadyList = engine.onEvent.onReadyList;
  var found;
  var rmList = [];
  var nameList;
  var cb;
  var runList = [];
  for (var i = 0, item; item = onReadyList[i]; i++) {
    nameList = item[0];
    cb = item[1];
    found = nameList.every(function(name) {
      return readyList.indexOf(name) !== -1;
    });
    if (found) {
      rmList.push(item);
      runList.push(cb);
    }
  }
  while (item = rmList.shift()) {
    onReadyList.splice(onReadyList.indexOf(item), 1);
  }
  while (item = runList.shift()) {
    item();
  }
};

engine.getHelperName = function() {
  "use strict";
  if (mono.isChrome) {
    var browser = engine.getHelperName.getBrowserName();
    return browser || 'chrome';
  }
  if (mono.isFF) {
    if (!engine.varCache.ffButton) {
      return 'firefox-mobile';
    }
    if (engine.ffNoStore) {
      return 'firefox-sf';
    }
    return 'firefox';
  }
  if (mono.isSafari) {
    return 'safari';
  }
  if (mono.isOpera) {
    return 'opera';
  }
  if (mono.isGM) {
    return 'userjs-' + engine.getHelperName.getBrowserName();
  }

  return 'undefined';
};
engine.getHelperName.getBrowserName = function() {
  "use strict";
  var browser = '';
  if(navigator.userAgent.indexOf('YaBrowser\/') !== -1) {
    browser = 'yabrowser';
  } else
  if(navigator.userAgent.indexOf('Maxthon\/') !== -1) {
    browser = 'maxthon';
  } else
  if(navigator.userAgent.indexOf('OPR\/') !== -1) {
    browser = 'opera-chromium';
  } else
  if(navigator.userAgent.indexOf('Opera\/') !== -1) {
    browser = 'opera';
  } else
  if(navigator.userAgent.indexOf('Firefox\/') !== -1) {
    browser = 'firefox';
  } else
  if(navigator.userAgent.indexOf('Chrome\/') !== -1) {
    browser = 'chrome';
  } else
  if(navigator.userAgent.indexOf('Safari\/') !== -1) {
    browser = 'safari';
  }
  return browser;
};

engine.dblTrackCheck = function(cb) {
  "use strict";
  if (!mono.isGM) {
    return cb();
  }

  mono.storage.get('dblTrack', function(storage) {
    var dblTrack = storage.dblTrack || '';
    var dataList = dblTrack.split(',');
    var now = Date.now();
    if (dblTrack && dataList[1] > now) {
      return cb(1);
    }
    var uuid = engine.generateUuid();
    var expire = now + 60000;
    mono.storage.set({dblTrack: uuid+','+expire});

    setTimeout(function() {
      mono.storage.get('dblTrack', function(storage) {
        var dataList = storage.dblTrack.split(',');
        if (dataList[0] !== uuid) {
          return cb(1);
        }
        cb();
      });
    }, 5000);
  });
};

engine.getUuid = function() {
  "use strict";
  if (typeof engine.getUuid.uuid === 'string' && engine.getUuid.uuid.length === 36) {
    return engine.getUuid.uuid;
  }

  var uuid = engine.getUuid.uuid = engine.generateUuid();
  mono.storage.set({uuid: uuid});
  return uuid;
};
engine.getUuid.uuid = null;

engine.generateUuid = function() {
  "use strict";
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

engine.hasSovetnik = function() {
  "use strict";
  if (!mono.isFF && !mono.isChrome && !mono.isGM && !mono.isOpera) {
    return false;
  }
  if (mono.isFF && !engine.varCache.ffButton) {
    return false;
  }
  return true;
};

engine.langIsInList = function(lang, langList, countryList) {
  "use strict";
  countryList = countryList || [];
  langList = langList || [];

  lang = lang.substr(0, 2).toLowerCase();

  if (langList.indexOf(lang) !== -1) {
    return true;
  }

  if (countryList.indexOf(engine.preferences.country) !== -1) {
    return true;
  }

  return false;
};

engine.localStorageMigrate = function(cb) {
  "use strict";
  if (!mono.isChrome && !mono.isOpera && !mono.isSafari) {
    return cb();
  }
  if (typeof localStorage === 'undefined') {
    return cb();
  }
  var lStorage = mono.isOpera ? widget.preferences : localStorage;
  if (lStorage.length === 0) {
    mono.storage.set({migrated: 1});
    return cb();
  }
  mono.storage.get('migrated', function(storage) {
    if (storage.hasOwnProperty('migrated')) {
      return cb();
    }
    var obj = {migrated: 1};
    var copyDP = mono.extend({}, engine.defaultPreferences);
    copyDP.helper = '';
    copyDP.uuid = '';
    copyDP.trackTime = '';
    copyDP.dblTrack = '';
    for (var key in copyDP) {
      var value = lStorage[key];
      if (!value) {
        continue;
      }
      if (typeof copyDP[key] === 'number') {
        obj[key] = parseInt(value);
        if (isNaN(obj[key])) {
          obj[key] = copyDP[key];
        }
      } else {
        obj[key] = value;
      }
    }
    mono.storage.set(obj, function() {
      cb();
    });
  });
};

engine.loadLanguage = function(cb, forceLocale) {
  var locale, lang;
  var currentLanguage = engine.varCache.navigatorLanguage.substr(0,2).toLowerCase();
  var availableLang = engine.varCache.langList.indexOf(currentLanguage) !== -1 ? currentLanguage : 'en';
  var language = {};

  var url = '_locales/{locale}/messages.json';

  if (mono.isGM) {
    lang = _languageList[availableLang] || _languageList['en'];
    engine.loadLanguage.chrome2lang(lang, language);
    return cb(language);
  } else
  if (mono.isFF) {
    locale = require("sdk/l10n").get('lang');
    if (locale === 'lang') {
      locale = availableLang;
    }
    url = url.replace('{locale}', forceLocale || locale);
    try {
      lang = require('sdk/self').data.load(url);
      lang = JSON.parse(lang);
    } catch (e) {
      if (forceLocale !== undefined) {
        return cb(language);
      }
      return engine.loadLanguage(cb, 'en');
    }
    engine.loadLanguage.chrome2lang(lang, language);
    return cb(language);
  } else
  if (mono.isChrome) {
    locale = chrome.i18n.getMessage('lang');
    url = url.replace('{locale}', forceLocale || locale);
  } else
  if (mono.isSafari || mono.isOpera) {
    url = url.replace('{locale}', forceLocale || availableLang);
  }
  mono.ajax({
    mimeType: "application/json",
    dataType: 'json',
    url: url,
    success: function(lang) {
      engine.loadLanguage.chrome2lang(lang, language);
      cb(language);
    },
    error: function() {
      if (forceLocale !== undefined) {
        console.error('Language is not loaded', url);
        return cb(language);
      }
      engine.loadLanguage(cb, 'en');
    }
  });
};
engine.loadLanguage.chrome2lang = function(lang, language) {
  "use strict";
  for (var key in lang) {
    language[key] = lang[key].message;
  }
};

engine.language = {};

engine.operaShowButton = function(enabled) {
  "use strict";
  if (engine.varCache.opButton !== null) {
    opera.contexts.toolbar.removeItem(engine.varCache.opButton);
    engine.varCache.opButton = null;
  }
  if (!enabled) {
    return;
  }
  engine.varCache.opButton = opera.contexts.toolbar.createItem({
    title: 'SaveFrom.net helper',
    icon: "img/icon_18.png",
    popup: {
      href: "popup.html",
      width: 482,
      height: 404
    }
  });
  opera.contexts.toolbar.addItem(engine.varCache.opButton);
};

engine.gmShowButton = function(enabled) {
  if (enabled) {
    _menu.setTitle(engine.language.extName, engine.varCache.currentVersion);
    mono.storage.get('gmIconTop', function(storage) {
      if (storage.gmIconTop === 0 || storage.gmIconTop) {
        _menu.style.menu.initial.top = storage.gmIconTop + 'px';
      }
      _menu.create(1);
    });
  } else {
    _menu.hide();
  }
};

engine.userTrack2 = function() {
  var now = parseInt(Date.now() / 1000);
  if (engine.varCache.lastTrackTime > now) {
    return;
  }
  engine.varCache.lastTrackTime = String(now + 12 * 60 * 60);
  mono.storage.set({lastTrackTime: engine.varCache.lastTrackTime});

  engine.metrika && engine.metrika.sendParamRequest('init');
  engine.ga && engine.ga.sendScreenViewStats('init');
};

engine.tabListener = {
  excludeList: [
    "*.google.*",
    "*.acidtests.org",

    "*.savefrom.net",
    "*.youtube.com",
    "*.vimeo.com",
    "*.dailymotion.*",
    "*.vk.com",
    "*.vkontakte.ru",
    "*.odnoklassniki.ru",
    "my.mail.ru",
    "*.ok.ru",
    "*.soundcloud.com",
    "*.facebook.com",
    "*.instagram.com",
    "*.rutube.ru"
  ],
  matchCache: null,
  createMatchCache: function() {
    "use strict";
    if (this.matchCache) {
      return;
    }

    var rList = [];
    for (var i = 0, item; item = this.excludeList[i]; i++) {
      var regexp = item.replace(/\./g, '\\.').replace(/\*\\\./, '^(.+\\.|)').replace(/\.\*/g, '..+');
      if (item.substr(item.length-1, 1) !== '*') {
        regexp += '$';
      }
      if (item[0] !== '*') {
        regexp = '^'+regexp;
      }
      rList.push(regexp);
    }

    this.matchCache = new RegExp(rList.join('|'), 'i');
  },
  rHostname: /:\/\/(?:[^@\/?#]+@)?([^\/?:#]+)/,
  getHostname: typeof window.URL === 'function' ? function(url) {
    "use strict";
    return (new window.URL(url)).hostname;
  } : function(url) {
    "use strict";
    var m = url.match(this.rHostname);
    return m && m[1];
  },
  checkUrl: function(url) {
    "use strict";
    if (url.substr(0, 4) !== 'http') {
      return;
    }

    var hostname = this.getHostname(url);
    if (!hostname || this.matchCache.test(hostname)) {
      return;
    }

    return hostname;
  },
  chMessageSender: null,
  onChChange: function(tab, tabId) {
    "use strict";
    var preferences = engine.preferences;
    var list = [];

    if (preferences.lmFileHosting || preferences.lmMediaHosting) {
      list.push('includes/components.js');
      list.push('includes/link_modifier.js');
    }
    if (preferences.sovetnikEnabled) {
      if (engine.varCache.hasSovetnik) {
        list.push('includes/sovetnik-sf.js');
      } else
      if (preferences.hasDP) {
        list.push('includes/advisor-sf.js');
      }
    }

    if (list.length === 0) {
      return this.rmListener();
    }

    chrome.tabs.executeScript(tabId, { file: 'js/mono.js', runAt: 'document_end' }, function() {
      for (var i = 0, file; file = list[i]; i++) {
        chrome.tabs.executeScript(tabId, { file: file, runAt: 'document_end' });
      }
    });
  },
  chListener: function(tabId, changeInfo, tab) {
    "use strict";
    var _this = engine.tabListener;
    if (changeInfo.status !== 'loading') { // complete or loading
      return;
    }

    if (!_this.checkUrl(tab.url)) {
      return;
    }

    _this.chMessageSender(tabId, {hook: 'hasInject', url: tab.url}, function(r) {
      if (r === 1) {
        return;
      }

      chrome.tabs.get(tabId, function(tab) {
        _this.onChChange(tab, tab.id);
      });
    });
  },
  onFfChange: function(tab, hostname) {
    "use strict";
    var preferences = engine.preferences;
    var self = require('sdk/self');
    var list = [];

    if (preferences.lmFileHosting || preferences.lmMediaHosting) {
      list.push(self.data.url('includes/components.js'));
      list.push(self.data.url('includes/link_modifier.js'));
    }

    var options = {
      contentScriptFile: list
    };

    var hasContentScript = false;
    var setPort = false;
    if (preferences.sovetnikEnabled) {
      if (engine.ffNoStore) {
        if (engine.varCache.hasSovetnik) {
          list.push(self.data.url('includes/sovetnik-sf.js'));
        } else
        if (preferences.hasDP) {
          list.push(self.data.url('includes/advisor-sf.js'));
        }
      } else
      if (engine.varCache.hasSovetnik) {
        hasContentScript = true;
        if (!engine.sovetnikModule.isDenyURL(tab.url, hostname)) {
          setPort = true;
          options.contentScript = engine.sovetnikModule.getContentScript();
        }
      }
    }

    if (list.length === 0) {
      if (!hasContentScript) {
        return this.rmListener();
      }
      if (!setPort) {
        return;
      }
    }

    list.unshift(self.data.url('js/mono.js'));

    var worker = tab.attach(options);
    if (setPort) {
      engine.sovetnikModule.setPort(worker);
    }
    engine.varCache.monoLib.addPage(worker);
  },
  ffListener: function (tab) {
    "use strict";
    var _this = engine.tabListener;
    var hostname = _this.checkUrl(tab.url);
    if (!hostname) {
      return;
    }
    _this.onFfChange(tab, hostname);
  },
  rmListener: mono.isChrome ? function() {
    "use strict";
    chrome.tabs.onUpdated.removeListener(this.chListener);
  } : mono.isFF ? function() {
    "use strict";
    require("sdk/tabs").removeListener('ready', this.ffListener);
  } : null,
  addListener: function() {
    "use strict";
    if (!mono.isChrome && !mono.isFF) {
      return;
    }

    this.createMatchCache();

    this.rmListener();

    if (mono.isChrome) {
      if (chrome.runtime && chrome.runtime.onMessage) {
        this.chMessageSender = chrome.tabs.sendMessage;
      } else {
        this.chMessageSender = chrome.tabs.sendRequest;
      }

      chrome.tabs.onUpdated.addListener(this.chListener);
    } else
    if (mono.isFF) {
      require("sdk/tabs").on('ready', this.ffListener);
    }
  },
  injectLmInActiveTab: mono.isChrome ? function() {
    "use strict";
    chrome.tabs.getSelected(null, function (tab) {
      if (!this.checkUrl(tab.url)) {
        return;
      }
      chrome.tabs.executeScript(tab.id, { file: 'js/mono.js', runAt: 'document_end' }, function() {
        chrome.tabs.executeScript(tab.id, { file: 'includes/components.js', runAt: 'document_end' });
        chrome.tabs.executeScript(tab.id, { file: 'includes/link_modifier.js', runAt: 'document_end' });
      });
    }.bind(this));
  } : mono.isFF ? function() {
    "use strict";
    var self = require('sdk/self');
    var tab = require("sdk/tabs").activeTab;
    if (!this.checkUrl(tab.url)) {
      return;
    }
    var options = {
      contentScriptFile: [
        self.data.url('js/mono.js'),
        self.data.url('includes/components.js'),
        self.data.url('includes/link_modifier.js')
      ]
    };
    var worker = tab.attach(options);
    engine.varCache.monoLib.addPage(worker);
  } : null
};

engine.cohort = {
  data: {},
  isAllow: function(index) {
    if (index === 1) {
      return mono.isGM || engine.preferences.sfHelperName === 'ff-sf' || mono.isSafari || mono.isOpera || mono.isChrome;
    }
    if (index === 4) {
      if (engine.varCache.currentVersion === 'GM_unknown') {
        return false;
      }
      if (!engine.varCache.bum) {
        return false;
      }
      return true;
    }
    return false;
  },
  setIndex: function(index) {
    engine.preferences.cohortIndex = index;
  },
  forceSetCohort: function(index) {
    if (!this.isAllow(index)) {
      return;
    }

    var data = this.data;
    if (data.index && this.isAllow(data.index)) {
      return;
    }

    data.index = index;

    mono.storage.set({cohort: data});
    this.setIndex(index);

    if (index === 4) {
      var varCache = engine.varCache;
      engine.trackEvent('errors', 'bum', varCache.currentVersion + ' ' + varCache.baseVersion);
    }
  },
  firstRun: function() {
    var data = this.data;
    if (data.index && this.isAllow(data.index)) {
      return;
    }

    /*data.index = parseInt('cohort index');

     if (!this.isAllow(data.index)) {
     return;
     }

     mono.storage.set({cohort: data});
     this.setIndex(data.index);*/
  },
  run: function() {
    var data = this.data;
    if (!data.index) {
      return;
    }

    if (!this.isAllow(data.index)) {
      return;
    }

    this.setIndex(data.index);
  },
  track: {
    event: function(category, action, label) {
      var params = {
        ec: category, // share-button
        ea: action, // click
        el: label, // vk
        t: 'event'
      };

      engine.cohort.track.sendData(params);
    },
    sendScreen: function(screenName) {
      var params = {
        an: 'helper',
        aid: engine.varCache.helperName,
        av: engine.varCache.currentVersion,
        t: 'screenview',
        cd: screenName
      };

      engine.cohort.track.sendData(params);
    },
    tidList: {
      1: 'UA-7055055-8',
      2: undefined,
      3: undefined,
      4: 'UA-7055055-12'
    },
    sendData: function(params) {
      var preferences = engine.preferences;
      if (!engine.cohort.isAllow(preferences.cohortIndex)) {
        return;
      }

      if(!params.t) {
        return;
      }

      var defaultParams = {
        v: 1,
        ul: engine.varCache.navigatorLanguage,
        tid: engine.cohort.track.tidList[preferences.cohortIndex],
        cid: engine.getUuid()
      };

      for (var key in defaultParams) {
        if(!params.hasOwnProperty(key)) {
          params[key] = defaultParams[key];
        }
      }

      if (params.tid === undefined) {
        return;
      }

      mono.ajax({
        url: 'https://www.google-analytics.com/collect',
        type: 'POST',
        data: mono.param(params)
      });
    }
  }
};

engine.getCountry = function() {
  "use strict";
  var country;
  var preferences = engine.preferences;
  var varCache = engine.varCache;
  var lang2country = {
    be: 'by', kk: 'kz', ru: 'ru',
    uk: 'ua', hy: 'am', ro: 'md',
    az: 'az', ka: 'ge', ky: 'kg',
    uz: 'uz', lv: 'lv', lt: 'lt',
    et: 'ee', tg: 'tj', fi: 'fi',
    tk: 'tm'
  };
  if (country = lang2country[varCache.navigatorLanguage.substr(0, 2).toLowerCase()]) {
    preferences.country = country;
    engine.onEvent.ready('getCountry');
    return;
  }

  var requestCountry = function() {
    var xh = preferences.sfHelperName+' '+varCache.currentVersion;
    mono.ajax({
      type: 'POST',
      url: 'https://sf-addon.com/helper/geoip/country.php',
      data: {
        sig: xh.length
      },
      headers: {
        'X-Helper': xh
      },
      success: function(data) {
        if (!data || typeof data !== 'string') {
          return;
        }

        country = data.toLowerCase().substr(0, 2);
        mono.storage.setExpire({country: preferences.country = country}, 259200);
        engine.onEvent.ready('getCountry');
      }
    });
  };

  mono.storage.getExpire('country', function(storage) {
    if (!storage.country) {
      return requestCountry();
    }

    preferences.country = storage.country;
  }, 1);
};

engine.getMeta = function(onComplete, force) {
  "use strict";
  if (mono.isEmptyObject(engine.expList) && !engine.hasAdvisor) {
    return onComplete && onComplete();
  }

  var cacheMeta = engine.varCache.meta;

  var requestMeta = function() {
    var cDate = (function(){
      var _date = new Date();
      var date = _date.getDate();
      var month = _date.getMonth() + 1;
      var cDate = '';

      cDate += date < 10 ? '0' + date : date;
      cDate += month < 10 ? '0' + month : month;
      cDate += _date.getFullYear();

      return cDate;
    })();

    mono.ajax({
      url: 'http://sf-addon.com/helper/app/meta.json' + '?_=' + cDate,
      timeout: 6000,
      dataType: 'json',
      success: function(meta) {
        if (typeof meta !== 'object') {
          engine.trackEvent('errors', 'getMeta', 'bad response');

          return onComplete && onComplete();
        }

        mono.storage.setExpire({meta: engine.varCache.meta = meta}, 86400);
        engine.onEvent.ready('getMeta');

        onComplete && onComplete();
      },
      onTimeout: function() {
        engine.trackEvent('errors', 'getMeta', 'timeout');

        onComplete && onComplete();
      },
      error: function(xhr) {
        var errorCode = '?';
        if (xhr && xhr.hasOwnProperty('status')) {
          errorCode = xhr.status;
        }
        engine.trackEvent('errors', 'getMeta', errorCode);

        onComplete && onComplete();
      }
    });
  };

  mono.storage.getExpire('meta', function(storage) {
    if (force || !storage.meta) {
      if (cacheMeta) {
        mono.storage.setExpire({meta: cacheMeta}, 86400);
      }
      
      return requestMeta();
    }

    engine.varCache.meta = storage.meta;
    onComplete && onComplete();
  }, 1);
};

engine.onEvent('firstrun', function getFromInstallId() {
  if (engine.varCache.fromId) {
    return;
  }

  mono.ajax({
    url: 'http://savefrom.net/tools/get_vid.php',
    success: function(data) {
      if (!data || typeof data !== 'string' || isNaN(parseInt(data))) {
        return;
      }
      mono.storage.set({fromId: engine.varCache.fromId = data});
    }
  });
});

mono.isSafari && engine.onEvent('init', function() {
  "use strict";
  safari.extension.settings.addEventListener('change', function(event) {
    if (event.key !== 'show_options') {
      return;
    }
    mono.openTab(safari.extension.baseURI + 'options.html', true);
  });
});

engine.onOptionChange = {
  button: function(enabled) {
    if (mono.isOpera) {
      engine.operaShowButton(enabled);
    } else
    if (mono.isGM) {
      engine.gmShowButton(enabled);
    }
  },
  sovetnikEnabled: function() {
    engine.tabListener.addListener();
  },
  lmFileHosting: function() {
    engine.tabListener.addListener();
  },
  lmMediaHosting: function() {
    engine.tabListener.addListener();
  },
  gmNativeDownload: !mono.isGM ? undefined : function(value) {
    engine.preferences.downloads = !!value;
    if (mono.global.preference) {
      // GM only!
      mono.global.preference.downloads = engine.preferences.downloads;
    }
  }
};

engine.getHelperVersion = function(cb) {
  "use strict";
  if (mono.isChrome) {
    return cb(chrome.app.getDetails().version);
  }
  if (mono.isFF) {
    return cb(require('sdk/self').version);
  }
  if (mono.isOpera) {
    return cb(widget.version);
  }
  if (mono.isGM) {
    var version = 'GM_unknown';
    if(typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) {
      version = GM_info.script.version;
    }
    cb(version);
    return;
  }
  if (mono.isSafari) {
    mono.ajax({
      url: safari.extension.baseURI + 'Info.plist',
      success: function(data, xhr) {
        if (!xhr.responseText) {
          return cb('unknown');
        }

        var parser=new DOMParser();
        var xmlDoc=parser.parseFromString(xhr.responseText,"text/xml");
        var elList = xmlDoc.getElementsByTagName('key');
        for (var i = 0, el; el = elList[i]; i++) {
          if (el.textContent === 'CFBundleShortVersionString') {
            return cb(el.nextElementSibling.textContent);
          }
        }
      },
      error: function() {
        cb('unknown');
      }
    });
    return;
  }
};

engine.sendInGa = function(params) {
  "use strict";
  var stack = engine.sendInGa.stack;
  stack.unshift([Date.now(), params]);

  stack.splice(100);

  engine.sendInGa.send();
};
engine.sendInGa.stack = [];
engine.sendInGa.lock = false;
engine.sendInGa.checkStack = function() {
  "use strict";
  var now = parseInt(Date.now() / 1000);
  var checkStack = engine.sendInGa.checkStack;
  if (checkStack.time > now) {
    return;
  }
  checkStack.time = now + 60 * 60;

  engine.sendInGa.send();
};
engine.sendInGa.checkStack.time = 0;
engine.sendInGa.send = function() {
  "use strict";
  var stack = engine.sendInGa.stack;
  if (!stack.length) {
    return;
  }

  if (engine.sendInGa.lock) {
    return;
  }
  engine.sendInGa.lock = true;

  var item = stack.slice(-1)[0];

  var time = item[0];
  var params = item[1];

  var now = Date.now();

  var delta = now - time;
  if (delta >= 14400000) {
    delta = 14400000 - ((stack.length + 1) * 1000);
  }
  params.qt = delta;

  mono.ajax({
    url: 'https://www.google-analytics.com/collect?z=' + Date.now(),
    type: 'POST',
    data: mono.param(params),
    success: function() {
      var pos = stack.indexOf(item);
      if (pos !== -1) {
        stack.splice(pos, 1);
      }

      engine.sendInGa.lock = false;
      engine.sendInGa.send();
    },
    error: function() {
      engine.sendInGa.lock = false;
    }
  });
};

engine.actionList = {
  getLanguage: function(message, cb) {
    cb(engine.language);
  },
  getNavigatorLanguage: function(msg, cb) {
    cb(engine.varCache.navigatorLanguage);
  },
  getPreference: function(message, cb) {
    var preferences = engine.preferences;
    if (mono.isSafari || mono.isGM) {
       preferences = mono.extend({}, engine.preferences);
    }
    cb( preferences);

    if (engine.metrika || engine.ga) {
      engine.userTrack2();
    }

    engine.sendInGa.checkStack();

    engine.userTrack();

    mono.msgClean();
  },
  getVersion: function(message, cb) {
    cb(engine.varCache.currentVersion);
  },
  getLastVersionInfo: function(message, cb) {
    var currentVersion = String(engine.varCache.currentVersion);
    if (currentVersion.indexOf(engine.varCache.lastVersion) === 0) {
      return cb();
    }

    cb(engine.varCache.lastVersion);
  },
  updateOption: function(message) {
    engine.preferences[message.key] = message.value;
    var obj = {};
    obj[message.key] = message.value;
    mono.storage.set(obj);
    if (engine.onOptionChange[message.key] !== undefined) {
      engine.onOptionChange[message.key](message.value);
    }
  },
  downloadFromCurrentPage: function() {
    var url = 'http://savefrom.net/';
    mono.getCurrentPageUrl(function(cUrl) {
      var args = mono.param({
        url: cUrl,
        utm_source: engine.preferences.sfHelperName,
        utm_medium: 'extensions',
        utm_campaign: 'bookmarklet'
      });
      mono.openTab(url + '?' + args, 1);

      var domain = mono.getDomain(cUrl, 1);
      engine.trackEvent('extensionMenu', 'openSfPage', domain);
      if ([1].indexOf(engine.preferences.cohortIndex) !== -1) {
        engine.cohort.track.event('extensionMenu', 'openSfPage', domain);
      }
    });
  },
  openPoll: function() {
    if (['en', 'uk', 'ru'].indexOf(engine.language.lang) === -1) {
      return;
    }
    var url = 'http://'+engine.language.lang+'.savefrom.net/helper-form.php';
    mono.getCurrentPageUrl(function(cUrl) {
      var domain = mono.getDomain(cUrl) || '';

      var args = '?' + mono.param({
          version: engine.varCache.currentVersion,
          helper: engine.preferences.sfHelperName,
          url: domain
        });
      mono.openTab(url+args, 1);
    });
  },
  reportBug: function() {
    var url = 'http://savefrom.userecho.com/forum/20869-/';
    if(engine.language.lang === 'ru') {
      url = 'http://savefrom.userecho.com/forum/19523-/';
    }
    mono.openTab(url);
  },
  viaMenu_updateLinks: function() {
    mono.sendMessageToActiveTab({action: 'updateLinks'});
  },
  viaMenu_downloadMP3Files: function() {
    mono.sendMessageToActiveTab({action: 'downloadMP3Files'});
  },
  viaMenu_downloadPlaylist: function() {
    mono.sendMessageToActiveTab({action: 'downloadPlaylist'});
  },
  viaMenu_downloadPhotos: function() {
    mono.sendMessageToActiveTab({action: 'downloadPhotos'});
  },
  viaMenu_changeState: function(msg) {
    if (Array.isArray(msg.prefKey)) {
      for (var i = 0, key; key = msg.prefKey[i]; i++) {
        engine.actionList.updateOption({key: key, value: msg.state});
      }
    } else {
      engine.actionList.updateOption({key: msg.prefKey, value: msg.state});
    }

    if (msg.state && msg.moduleName === 'lm' && msg.needInclude) {
      if (mono.isChrome || mono.isFF) {
        engine.tabListener.injectLmInActiveTab();
      }
      return;
    }
    mono.sendMessageToActiveTab({action: 'changeState', state: msg.state});
  },
  showOptions: mono.isGM ? function() {
    _options.show();
  } : function() {
    var url = 'options.html';
    if (mono.isFF) {
      url = require('sdk/self').data.url(url);
    } else
    if (mono.isSafari) {
      url = safari.extension.baseURI + url;
    }
    mono.openTab(url, true);
  },
  getActiveTabModuleInfo: function(msg, cb) {
    mono.sendMessageToActiveTab({action: 'getModuleInfo', url: msg.url}, function(moduleInfo) {
      cb(moduleInfo);
    });
  },
  getActiveTabUrl: function(message, cb) {
    mono.getCurrentPageUrl(cb);
  },
  getActiveTabInfo: function(msg, cb) {
    var preferences = engine.preferences;
    mono.getCurrentPageUrl(function(url) {
      if (url.indexOf('http') !== 0) {
        return cb({});
      }
      var hostname = mono.getDomain(url);
      var hostList = {
        dailymotion: [/.?dailymotion\.*/],
        facebook: [/.?facebook\.com$/],
        mailru: [/^my\.mail\.ru$/],
        odnoklassniki: [/.?ok\.ru$/, /.?odnoklassniki\.ru$/],
        savefrom: [/.?savefrom\.net$/],
        soundcloud: [/.?soundcloud\.com$/],
        vimeo: [/.?vimeo\.com$/],
        vk: [/.?vk\.com$/, /.?vkontakte\.ru$/],
        youtube: [/.?youtube\.com$/],
        instagram: [/.?instagram\.com$/],
        rutube: [/.?rutube\.ru$/]
      };
      if (!hostname) {
        return cb({});
      }
      var moduleName = 'lm';
      var prefKey;
      var state;
      var found = 0;
      for (var key in hostList) {
        var regList = hostList[key];
        for (var i = 0, reg; reg = regList[i]; i++) {
          if (reg.test(hostname)) {
            moduleName = key;
            prefKey = engine.preferenceMap[moduleName];
            state = preferences[prefKey];
            found = 1;
            break;
          }
        }
        if (found === 1) {
          break;
        }
      }
      if (moduleName === 'lm') {
        prefKey = ['lmFileHosting', 'lmMediaHosting'];
        state = preferences.lmFileHosting || preferences.lmMediaHosting;
      }
      cb({moduleName: moduleName, prefKey: prefKey, url: url, state: state});
    });
  },
  popupResize: mono.isSafari ? function(message) {
    safari.extension.popovers[0].height = message.height;
  } : mono.isOpera ? function(message) {
    var varCache = engine.varCache;
    if (varCache.opButton === null) {
      return;
    }
    varCache.opButton.popup.height = message.height;
    varCache.opButton.popup.width = message.width;
  } : function() {},
  userjsDetected: function() {
    if (engine.varCache.userjsDetected) {
      return;
    }
    engine.varCache.userjsDetected = 1;

    mono.storage.get('userjsDetected', function(storage) {
      if (storage.userjsDetected === 1) {
        return;
      }
      mono.storage.set({userjsDetected: 1});

      var uuid = engine.getUuid();
      mono.ajax({
        url: 'https://www.google-analytics.com/collect',
        type: 'POST',
        data: 'v=1&tid=UA-7055055-1&cid=' + uuid + '&t=pageview&dh=savefrom.net&dp=%2Fextension%2Fuserjs_installed.ext'
      });
    });
  },
  hasSovetnik: function(message, cb) {
    cb(engine.varCache.hasSovetnik || engine.preferences.hasDP);
  },
  getBrowser: function(message, cb) {
    cb(engine.varCache.helperName);
  },
  hideDownloadWarning: function(message, cb) {
    if (message.set !== undefined) {
      return mono.storage.set({hideDownloadWarning: message.set});
    }
    mono.storage.get('hideDownloadWarning', function(storage) {
      cb(storage.hideDownloadWarning);
    });
  },
  storage: function(message, cb) {
    if (message.subaction === 'clear') {
      return;
    }
    if (message.keys) {
      for (var i = 0, len = message.keys.length; i < len; i++) {
        var key = message.keys[i];
        if (!message.data.hasOwnProperty(key)) {
          message.data[key] = undefined;
        }
      }
    }
    mono.storage[message.subaction](message.data, cb);
  },
  trackEvent: function(message) {
    if (message.label === '%domain%') {
      return mono.getCurrentPageUrl(function(cUrl) {
        message.label = mono.getDomain(cUrl, 1);
        engine.trackEvent(message.category, message.event, message.label, message.params);
      });
    }
    engine.trackEvent(message.category, message.event, message.label, message.params);
  },
  trackSocial: function(message) {
    engine.trackSocial(message.target, message.event, message.network);
  },
  trackCohort: function(message) {
    if (!engine.preferences.cohortIndex) {
      return;
    }
    if (message.label === '%domain%') {
      return mono.getCurrentPageUrl(function(cUrl) {
        message.label = mono.getDomain(cUrl, 1);
        engine.cohort.track.event(message.category, message.event, message.label);
      });
    }
    engine.cohort.track.event(message.category, message.event, message.label);
  },
  addToClipboard: mono.isFF ? function(message) {
    var clipboard = require("sdk/clipboard");
    clipboard.set(message.text);
  } : mono.isChrome ? function(message) {
    var text = message.text;
    var textArea;
    document.body.appendChild(textArea = mono.create('textarea', {
      text: text
    }));
    textArea.select();
    setTimeout(function() {
      document.execCommand("copy", false, null);
      textArea.parentNode.removeChild(textArea);
    });
  } : function() {}
};

engine.onMessage = function(message, cb) {
  if (!engine.onMessage.ready) {
    engine.onMessage.stack.push(arguments);
    return;
  }

  var func;
  var action = message.action || message;
  if ((func = engine.actionList[action]) !== undefined) {
    return func.call(engine.actionList, message, cb);
  }

  for (var moduleName in engine.modules) {
    var module = engine.modules[moduleName];
    if ((func = module[action]) !== undefined) {
      return func.call(module, message, cb);
    }
  }

  if ((func = utils[action]) !== undefined) {
    return func.call(utils, message, cb);
  }
};
engine.onMessage.stack = [];
engine.onMessage.ready = false;

engine.loadSettings = function(cb) {
  var varCache = engine.varCache;
  var preferences = engine.preferences;
  var defaultPreferences = engine.defaultPreferences;

  var keys = [];
  for (var key in defaultPreferences) {
    keys.push(key);
  }

  var preload = {
    cohort: function(value) {
      engine.cohort.data = value || {};
    },
    fromId: function(value) {
      if (value && isNaN(parseInt(value))) {
        value = undefined;
        mono.storage.remove('fromId');
      }
      varCache.fromId = value;
    },
    lastTrackTime: function(value) {
      varCache.lastTrackTime = value || 0;
    },
    trackTime: function(value) {
      varCache.trackTime = value || 0;
    },
    lastVersion: function(value) {
      varCache.lastVersion = value;
    },
    meta: function(value) {
      varCache.meta = value || {};
    },
    uuid: function(value) {
      engine.getUuid.uuid = value;
    },
    ummyDetected: function(value) {
      if (value === undefined) {
        value = preferences.showUmmyInfo ? 0 : 1;
        mono.storage.set({ummyDetected: value});
      }
      preferences.ummyDetected = value;
    },
    hasDP: function(value) {
      preferences.hasDP = value ? 1 : 0;
    },
    country: function(value) {
      preferences.country = value;
    }
  };

  keys.push.apply(keys, Object.keys(preload));

  mono.storage.get(keys, function(storage) {
    var key;
    for (key in defaultPreferences) {
      var defaultValue = defaultPreferences[key];
      if (storage[key] === undefined) {
        storage[key] = defaultValue;
      } else
      if (typeof storage[key] === 'string' && typeof defaultValue === 'number') {
        var numValue = parseFloat(storage[key]);
        if (!isNaN(numValue)) {
          storage[key] = numValue;
        } else {
          console.error('Bad storage value!', key, storage[key]);
        }
      }
      preferences[key] = storage[key];
    }

    for (key in preload) {
      preload[key](storage[key]);
    }

    if (mono.isChrome) {
      if (mono.isChromeVersion < 31) {
        preferences.downloads = false;
        preferences.moduleShowDownloadInfo = 0;
        preferences.iframeDownload = false;
      } else {
        preferences.downloads = chrome.downloads !== undefined;
        if (preferences.downloads) {
          preferences.moduleShowDownloadInfo = 0;
          preferences.iframeDownload = false;
        } else {
          preferences.iframeDownload = true;
        }
      }
    } else {
      preferences.moduleShowDownloadInfo = 0;
    }

    if (mono.isGM) {
      if (mono.isTM) {
        preferences.iframeDownload = true;
      }
      preferences.downloads = false;
      if ( typeof GM_download !== 'undefined' && (preferences.gmNativeDownload || (typeof GM_info !== 'undefined' && GM_info.downloadMode === 'browser'))) {
        preferences.gmNativeDownload = 1;
        preferences.downloads = true;
      }
    }

    if (mono.isFF && varCache.ffButton) {
      preferences.downloads = true;
    }

    cb();
  });
};

engine.expList = {};
engine.exp = {
  list: engine.expList,
  getExpIndex: function(type) {
    if (type === 'firstRun') {
      var value = mono.getRandomInt(0, 100);

      for (var index in this.list) {
        var item = this.list[index];
        if (value < item.percent) {
          return parseInt(index);
        }

        value -= item.percent;
      }
    }

    return 0;
  },
  disable: function() {
    if (engine.preferences.expIndex > 0) {
      engine.actionList.updateOption({key: 'expIndex', value: 0});
    }
  },
  cancel: function() {
    engine.preferences.expIndex = 0;
  },
  run: function(expIndex) {
    var varCache = engine.varCache;
    if (!this.list.hasOwnProperty(expIndex)) {
      this.disable();
      return;
    }
    if (varCache.meta.exp && varCache.meta.exp[expIndex] && varCache.meta.exp[expIndex].cancel) {
      this.cancel();
      return;
    }
    this.list[expIndex](engine.preferences, varCache);
  },
  initList: function(cb) {
    var preferences = engine.preferences;
    var varCache = engine.varCache;
    if (mono.isEmptyObject(this.list)) {
      this.disable();
      return cb();
    }

    if (!varCache.isFirstrun && !varCache.isUpgrade) {
      // just run
      this.run(preferences.expIndex);
      return cb();
    }

    if (!varCache.meta.exp) {
      this.disable();
      return cb();
    }

    var metaExpList = varCache.meta.exp;
    var expList = this.list;
    for (var index in expList) {
      var item = metaExpList[index];
      if (!item || !item.enable) {
        delete expList[index];
        continue;
      }
      var func;
      if ((func = expList[index].isAvailable) && !func.call(expList[index], preferences, varCache)) {
        delete expList[index];
        continue;
      }
      expList[index].percent = item.percent || 0;
    }

    var expIndex;
    if (varCache.isFirstrun) {
      // first run
      expIndex = this.getExpIndex('firstRun');

      if (expIndex > 0) {
        engine.actionList.updateOption({key: 'expIndex', value: expIndex});
      }
    } else
    if (varCache.isUpgrade) {
      // on update
      // check current experiment and run it
      if (preferences.expIndex > 0 && !this.list.hasOwnProperty(preferences.expIndex)) {
        this.disable();
      }

      if (preferences.expIndex === 0) {
        // exp is not set!
        expIndex = this.getExpIndex('nextRun');

        if (expIndex > 0) {
          engine.actionList.updateOption({key: 'expIndex', value: expIndex});
        }
      }
    }

    this.run(preferences.expIndex);

    return cb();
  }
};

engine.checkSovetnik = function() {
  "use strict";
  engine.varCache.hasSovetnik = engine.langIsInList(engine.varCache.navigatorLanguage, [
    'be', 'kk', 'ru', 'uk',
    'hy', 'ro', 'az', 'ka',
    'ky', 'uz', 'lv', 'lt',
    'et', 'tg', 'fi', 'tk'
  ], [
    'by', 'kz', 'ru', 'ua',
    'am', 'md', 'az', 'ge',
    'kg', 'uz', 'lv', 'lt',
    'ee', 'tj', 'fi', 'tm'
  ]);
};

engine.prepare = function(cb) {
  "use strict";
  var varCache = engine.varCache;

  engine.onEvent(['getHelperVersion'], function() {
    if (typeof varCache.currentVersion === 'string') {
      var _btoa = !mono.isFF ? btoa : require("sdk/base64").encode;
      var version = _btoa(varCache.currentVersion).replace(/=/g, '');
      varCache.bum = varCache.baseVersion !== version;
    }

    engine.getCountry();
  });

  engine.onEvent('loadSettings', function() {
    if (engine.hasSovetnik()) {
      engine.checkSovetnik();
      engine.onEvent('getCountry', engine.checkSovetnik);
    }
  });

  engine.onEvent(['loadLanguage', 'loadSettings', 'getHelperVersion'], function() {
    varCache.isFirstrun = engine.preferences.version === '0';
    varCache.isUpgrade = !varCache.isFirstrun && engine.preferences.version !== varCache.currentVersion;

    engine.getMeta(function() {
      engine.exp.initList(cb);
    }, varCache.isFirstrun || varCache.isUpgrade);
  });

  mono.asyncCall(function() {
    engine.loadLanguage(function(_language) {
      for (var key in _language) {
        engine.language[key] = _language[key];
      }
      engine.onEvent.ready('loadLanguage');
    });
  });

  mono.asyncCall(function() {
    engine.localStorageMigrate(function() {
      engine.loadSettings(function() {
        engine.onEvent.ready('loadSettings');
      });
    });
  });

  mono.asyncCall(function() {
    engine.getHelperVersion(function(version) {
      varCache.currentVersion = version;
      engine.onEvent.ready('getHelperVersion');
    });
  });
};

engine.initMessageListener = function() {
  if (engine.initMessageListener.fired) {
    return;
  }
  engine.initMessageListener.fired = 1;

  mono.onMessage.call({
    isBg: true
  }, function (message, response) {
    if (!Array.isArray(message)) {
      return engine.onMessage(message, response);
    }

    var countWait = message.length;
    var countReady = 0;
    var resultList = {};
    var ready = function (key, data) {
      countReady += 1;
      resultList[key] = data;
      if (countWait === countReady) {
        response(resultList);
      }
    };
    message.forEach(function (msg) {
      engine.onMessage(msg, function (data) {
        ready(msg.action || msg, data);
      });
    });
  });
};

engine.init = function() {
  engine.initMessageListener();

  var varCache = engine.varCache;
  var preferences = engine.preferences;

  var _navigator = (mono.isFF ? window.navigator : navigator);

  varCache.helperName = engine.getHelperName();
  varCache.navigatorLanguage = utils.langNormalization(_navigator.language);

  preferences.showUmmyItem = /^Win/.test(_navigator.platform) ? 1 : 0;

  preferences.sfHelperName = varCache.helperName;
  if (preferences.sfHelperName === 'firefox-sf') {
    preferences.sfHelperName = 'ff-sf';
  } else
  if (preferences.sfHelperName === 'firefox-mobile') {
    preferences.sfHelperName = 'ff-mobile';
  } else
  if (preferences.sfHelperName === 'firefox') {
    preferences.sfHelperName = 'ff';
  }

  engine.onEvent.ready('init');

  engine.prepare(function(){
    var uuid = engine.getUuid();
    engine.metrika && engine.metrika.init(
      varCache.currentVersion, varCache.helperName,
      varCache.fromId, uuid,
      varCache.navigatorLanguage, engine.language.lang);
    engine.ga && engine.ga.init(
      varCache.currentVersion, varCache.helperName,
      varCache.fromId, uuid,
      varCache.navigatorLanguage, engine.language.lang);

    if (varCache.bum) {
      engine.cohort.forceSetCohort(4);
    }

    engine.checkVersion();

    engine.cohort.run();

    engine.onMessage.ready = true;
    while (engine.onMessage.stack.length > 0) {
      engine.onMessage.apply(null, engine.onMessage.stack.shift());
    }

    engine.onEvent.ready('prepare');
  });
};

mono.isModule && (function(origFunc) {
  engine.init = function(addon, button, monoLib, ffInitPopup) {
    engine.varCache.monoLib = monoLib;
    mono = mono.init(addon);
    var modules = engine.modules;
    modules.vimeo = require('./vimeo_com_embed.js').init(mono);
    modules.dailymotion = require('./dailymotion_com_embed.js').init(mono);
    modules.youtube = require('./youtube_com_embed.js').init(mono, engine);
    modules.soundcloud = require('./soundcloud_com_embed.js').init(mono);
    modules.vkontakte = require('./vkontakte_ru_embed.js').init(mono, engine);
    modules.odnoklassniki = require('./odnoklassniki_ru_embed.js').init(mono);
    modules.facebook = require('./facebook_com_embed.js').init(mono);
    modules.mail_ru = require('./mail_ru_embed.js').init(mono, engine);
    utils = require('./utils.js').init(mono);
    engine.varCache.ffButton = button;

    engine.onEvent('prepare', function() {
      "use strict";
      ffInitPopup();
    });

    origFunc();
  };
})(engine.init);

engine.userTrack = function () {
  var now = Date.now();
  if (engine.varCache.trackTime > now) {
    return;
  }

  engine.dblTrackCheck(function(isFail) {
    if (isFail) {
      return;
    }

    engine.sendScreenViewStats();

    engine.varCache.trackTime = now + 12 * 60 * 60 * 1000;
    mono.storage.set({trackTime: String(engine.varCache.trackTime)});

    if (engine.preferences.cohortIndex) {
      engine.cohort.track.sendScreen('init');
    }

    if (engine.preferences.expIndex && [13].indexOf(engine.preferences.expIndex) === -1) {
      engine.sendScreenViewStats({
        tid: 'UA-7055055-11'
      });
    }

  });
};

engine.sendScreenViewStats = function(overParams) {
  var params = {
    t: 'screenview',
    cd: 'init'
  };

  if (typeof overParams === 'object') {
    for (var key in overParams) {
      params[key] = overParams[key];
    }
  }

  engine.sendStatsInfo(params);
};

engine.trackSocial = function(target, action, network) {
  var params = {
    st: target, // /home
    sa: action, // like
    sn: network, // facebook
    t: 'social'
  };

  engine.sendStatsInfo(params);
};

engine.trackEvent = function(category, action, label, overParams) {
  overParams = overParams || {};
  var params = {
    ec: category, // share-button
    ea: action, // click
    el: label, // vk
    t: 'event'
  };

  if (engine.preferences.expIndex && [13].indexOf(engine.preferences.expIndex) === -1) {
    overParams.tid = 'UA-7055055-11';
  }

  for (var key in overParams) {
    params[key] = overParams[key];
  }

  engine.sendStatsInfo(params);
};

engine.sendStatsInfo = function(params) {
  if(!params.t) {
    return;
  }

  var preferences = engine.preferences;

  var defaultParams = {
    v: 1,
    ul: engine.varCache.navigatorLanguage,
    tid: 'UA-7055055-5',
    cid: engine.getUuid(),
    cd3: engine.language.lang,

    an: 'helper',
    aid: engine.varCache.helperName,
    av: engine.varCache.currentVersion
  };

  for (var key in defaultParams) {
    if(!params.hasOwnProperty(key)) {
      params[key] = defaultParams[key];
    }
  }

  if (preferences.expIndex) {
    params.cd1 = 'test_' + preferences.expIndex;
  }

  if (engine.varCache.fromId) {
    params.cd2 = engine.varCache.fromId;
  }

  if (engine.varCache.hasSovetnik) {
    params.cd4 = preferences.sovetnikEnabled ? 'true' : 'false';
  }

  if (preferences.hasDP) {
    params.cd5 = preferences.sovetnikEnabled ? 'true' : 'false';
  }

  params.cd6 = preferences.ummyDetected ? 'true' : preferences.showUmmyItem ? 'false' : 'none';

  if (params.cd !== 'init' && [4].indexOf(preferences.cohortIndex) !== -1) {
    // Cohort 4 send all in self stat, except init
    params.tid = engine.cohort.track.tidList[preferences.cohortIndex];
  }

  engine.sendInGa(params);
};

engine.checkUpdate = function() {
  "use strict";
  var typeList = engine.checkUpdate.typeList;
  var cacheLastVersion = engine.varCache.lastVersion;

  var type = (mono.isChrome && !engine.isOperaNext) ? 'chrome' : (mono.isFF && engine.ffNoStore) ? 'ff' : mono.isGM ? 'gm' : mono.isSafari ? 'safari' : undefined;
  if (!type) {
    return;
  }

  var onFail = function() {
    if (cacheLastVersion) {
      mono.storage.setExpire({lastVersion: cacheLastVersion}, 86400);
    }
    engine.trackEvent('errors', 'sendUpdate', engine.varCache.currentVersion);
  };

  var requestVersion = function() {
    mono.ajax({
      type: 'GET',
      url: typeList[type].url,
      dataType: 'text',
      cache: false,
      success: function(data) {
        if (!data || typeof data !== 'string') {
          return onFail();
        }

        var version = typeList[type].getVersion(data, onFail);
        if (!version) {
          return;
        }

        mono.storage.setExpire({lastVersion: engine.varCache.lastVersion = version}, 604800);
      },
      error: function() {
        onFail();
      }
    });
  };

  mono.storage.getExpire('lastVersion', function(storage) {
    "use strict";
    if (!storage.lastVersion) {
      return requestVersion();
    }

    engine.varCache.lastVersion = storage.lastVersion;
  }, 1);
};
engine.checkUpdate.typeList = {
  chrome: {
    url: 'http://sf-addon.com/helper/chrome/updates-3.xml',
    getVersion: function(data, retry) {
      data = String(data);
      var version = data.match(/updatecheck.+version=['"](.+)['"]/);
      version = version && version[1];
      if (!version) {
        return retry();
      }
      return version;
    }
  },
  ff: {
    url: 'https://sf-addon.com/helper/mozilla/update.rdf',
    getVersion: function(data, retry) {
      data = String(data);
      var version = data.match(/<em:version>(.+)<\/em:version>/);
      version = version && version[1];
      if (!version) {
        return retry();
      }
      return version;
    }
  },
  safari: {
    url: 'https://sf-addon.com/helper/safari/update.plist',
    getVersion: function(data, retry) {
      data = String(data);
      var pos = data.indexOf('<key>CFBundleVersion</key>');
      if (pos === -1) {
        return retry();
      }
      data = data.substr(pos);
      var version = data.match(/<string>(.+)<\/string>/);
      version = version && version[1];
      if (!version) {
        return retry();
      }
      return version;
    }
  },
  gm: {
    url: 'https://sf-addon.com/helper/chrome/helper.meta.js',
    getVersion: function(data, retry) {
      data = String(data);
      var version = data.match(/@version\s+(.+)\s*\r?\n/);
      version = version && version[1];
      if (!version) {
        return retry();
      }
      return version;
    }
  }
};

engine.checkVersion = function () {
  var url, needSaveVersion;

  if(engine.varCache.isFirstrun) {
    // first run
    url = 'http://savefrom.net/user.php?helper=' + engine.preferences.sfHelperName + ';firstrun';

    engine.onEvent.ready('firstrun');

    needSaveVersion = true;
  } else
  if(engine.varCache.isUpgrade) {
    // update
    //url = 'http://savefrom.net/user.php?helper=' + preferences.sfHelperName + ';update';

    mono.storage.removeExpire('lastVersion');
    engine.varCache.lastVersion = undefined;

    needSaveVersion = true;
  }

  engine.checkUpdate();

  if (needSaveVersion) {
    engine.actionList.updateOption({key: 'version', value: engine.varCache.currentVersion});
  }

  if (!mono.isGM && url) {
    utils.checkUrlsOfOpenTabs([
      /https?:\/\/([\w\-]+\.)?savefrom\.net\/(update-helper|userjs-setup)\.php/i
    ], function(foundUrls) {
      if (foundUrls.length > 0) {
        return;
      }

      utils.checkUrlsOfOpenTabs([
        /https?:\/\/legal\.yandex\.(ru|com\.tr)\//i
      ], function(foundUrls) {
        var active = foundUrls.length === 0;
        mono.openTab(url, active, active);
      });
    });
  }
};

(mono.isChrome || mono.isFF) && engine.onEvent('prepare', function() {
  "use strict";

  if (mono.isFF && !engine.ffNoStore) {
    engine.sovetnikModule = require('./sovetnik.lib.js');
    engine.sovetnikModule.initSf(engine.actionList.updateOption, engine.preferences);
  }

  engine.tabListener.addListener();
});

mono.isOpera && engine.onEvent('prepare', function() {
  "use strict";
  engine.operaShowButton(engine.preferences.button);
});

mono.isGM && engine.onEvent('prepare', function() {
  "use strict";
  if (mono.isGM && !mono.isIframe()) {
    engine.menuCommands.register(_moduleName);

    if (engine.preferences.button && engine.preferences[engine.preferenceMap[_moduleName]] || _moduleName === 'savefrom') {
      engine.gmShowButton(1);
    }
  }
});

engine.menuCommands = {
  commands: [
    {
      id: 'downloadFromCurrentPage',
      command: function() {
        engine.actionList.downloadFromCurrentPage();
      }
    }, {
      id: 'updateLinks',
      notify: 'updateLinksNotification',
      modules: ['vk', 'odnoklassniki', 'facebook', 'lm', 'youtube', 'dailymotion', 'instagram', 'rutube']
    }, {
      id: 'downloadMP3Files',
      modules: ['vk', 'odnoklassniki', 'mailru']
    }, {
      id: 'downloadPlaylist',
      modules: ['vk', 'odnoklassniki', 'mailru']
    }, {
      id: 'downloadPhotos',
      modules: ['vk']
    }, {
      id: 'showOptions',
      command: function() {
        _options.show();
      }
    }, {
      id: 'reportBug',
      command: function() {
        engine.actionList.reportBug();
      }
    }, {
      id: 'enableDisableModule',
      command: function() {
        engine.actionList.getActiveTabInfo(undefined, function(tabInfo) {
          var state = tabInfo.state ? 0 : 1;
          engine.actionList.viaMenu_changeState({state: state, prefKey: tabInfo.prefKey, moduleName: tabInfo.moduleName});
          if (state) {
            if (engine.preferences.button === 1) {
              engine.gmShowButton(1);
            } else {
              engine.gmShowButton(0);
            }
          } else {
            engine.gmShowButton(0);
          }
        });
      }
    }, {
      id: 'showHideButton',
      command: function() {
        var hiddenBtn = _menu.menu === null;
        engine.actionList.updateOption({action: 'updateOption', key: 'button', value: hiddenBtn ? 1 : 0});
      }
    }
  ],
  registerModule: function (params) {
    if (typeof GM_registerMenuCommand === 'undefined') {
      return;
    }

    var strId = params.id;

    var name = engine.language[strId];

    if(params.command) {
      return GM_registerMenuCommand(name, params.command);
    }

    var fn = function() {
      engine.onMessage({action: ( params.modules !== undefined ? 'viaMenu_' : '' ) + params.id});

      if(params.notify && typeof GM_notification !== 'undefined') {
        GM_notification(engine.language[params.notify], null, null, null, 3000);
      }
    };

    return GM_registerMenuCommand(name, fn);
  },
  register: function (moduleName) {
    var hasRmFunc = typeof GM_unregisterMenuCommand !== "undefined";
    for (var i = 0, item; item = this.commands[i]; i++) {
      if (hasRmFunc) {
        if (item.gmId) {
          GM_unregisterMenuCommand(item.gmId);
        }
      } else
      if (item.hasOwnProperty("gmId")) {
        continue;
      }

      if (!item.modules || item.modules.indexOf(moduleName) > -1) {
        item.gmId = this.registerModule(item);
      }
    }
  }
};

engine.hasAdvisor = true;

engine.onEvent('runDP', function() {
  "use strict";
  var meta = engine.varCache.meta;
  if (!meta.dp || !meta.dp.enable || meta.dp.cancel || engine.varCache.hasSovetnik) {
    engine.preferences.hasDP = 0;
    return;
  }

  engine.tabListener.addListener();
});

engine.onEvent(['firstrun', 'getCountry'], function() {
  if (mono.isFF && !engine.varCache.ffButton) {
    return;
  }

  var countryList = [
    'ar', 'au', 'at', 'be',
    'br', 'ca', 'co', 'cz',
    'dk', 'fr', 'de', 'hk',
    'hu', 'in', 'id', 'it',
    'jp', 'ke', 'my', 'mx',
    'nl', 'nz', 'ng', 'no',
    'ph', 'pl', 'pt', 'ro',
    'rs', 'sg', 'sk', 'za',
    'es', 'se', 'th', 'gb',
    'us'
  ];

  if (countryList.indexOf(engine.preferences.country) === -1) {
    return;
  }

  if (engine.varCache.hasSovetnik) {
    return;
  }

  var meta = engine.varCache.meta;
  if (!meta.dp || !meta.dp.enable) {
    return;
  }

  var value = mono.getRandomInt(0, 100);
  if (value < meta.dp.percent) {
    mono.storage.set({hasDP: engine.preferences.hasDP = 1});

    engine.onEvent.ready('runDP');
  }
});

engine.onEvent(['getCountry'], function() {
  "use strict";
  if (mono.isFF && !engine.varCache.ffButton) {
    return;
  }

  var countryList = ['de', 'gb', 'us'];

  if (countryList.indexOf(engine.preferences.country) === -1) {
    return;
  }

  if (engine.varCache.hasSovetnik) {
    return;
  }

  var meta = engine.varCache.meta;
  if (!meta.dp || !meta.dp.enable) {
    return;
  }

  mono.storage.set({hasDP: engine.preferences.hasDP = 1});

  engine.onEvent.ready('runDP');
});

engine.onEvent('prepare', function() {
  "use strict";
  if (engine.preferences.hasDP) {
    engine.onEvent.ready('runDP');
  }
});

engine.onEvent('getMeta', function() {
  "use strict";
  var meta = engine.varCache.meta;
  if (!meta.dp || !meta.dp.enable) {
    mono.storage.remove('hasDP');
    engine.preferences.hasDP = 0;
  } else
  if (meta.dp.cancel) {
    engine.preferences.hasDP = 0;
  }
});
engine.expList[19] = function() {
  "use strict";
};
engine.expList[20] = function() {
  "use strict";
};
engine.actionList.setIconBadge = function(msg) {
  "use strict";
  var text = String(msg.text);

  if (mono.isChrome) {
    chrome.browserAction.setBadgeText({
      text: text
    });
  }
  if (mono.isModule && engine.varCache.ffButton) {
    var button = engine.varCache.ffButton;
    button.badge = text;
  }
};
engine.expList[21] = function() {
  "use strict";
  mono.storage.get('onceYtTutorial', function(storage) {
    if (storage.onceYtTutorial) {
      return;
    }

    engine.actionList.setIconBadge({text: '?'});
  });
};
//@insert

if (mono.isModule) {
  exports.init = engine.init;
} else {
  if (!mono.isGM) {
    engine.init();
  } else {
    engine.initMessageListener();
  }
}
(function() {
  var language = {};
  var preference = {};
  var varCache = {
    icons: {},
    activeTabInfo: {},
    isFirst: true
  };
  var menuContainer = undefined;

  var translatePage = function() {
    var elList = menuContainer.querySelectorAll('*[data-i18n]');
    for(var i = 0, len = elList.length; i < len; i++) {
      var el = elList[i];
      var key = el.dataset.i18n;
      el.textContent = language[key];
      if (el.classList.contains('label')) {
        el.title = language[key];
      }
    }
  };

  var onModuleToggle = function() {
    var state = varCache.moduleTrigger.classList.contains('disabled') ? 1 : 0;
    setCheckboxState(state);
    var tabInfo = varCache.activeTabInfo;
    tabInfo.state = state;
    if (Array.isArray(tabInfo.prefKey)) {
      for (var i = 0, key; key = tabInfo.prefKey[i]; i++) {
        preference[key] = state;
      }
    } else {
      preference[tabInfo.prefKey] = state;
    }
    mono.sendMessage({action: 'viaMenu_' + 'changeState', state: state ?  1 : 0, prefKey: tabInfo.prefKey, moduleName: tabInfo.moduleName, needInclude: tabInfo.isNotResponse});
    tabInfo.isNotResponse = false;
    updateMenuItem(tabInfo);
  };

  var menuItemAction = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var node = this;

    if (node.classList.contains('inactive')) {
      return;
    }

    var action = node.dataset.action;

    var isModule = node.classList.contains('module');

    if ([1].indexOf(preference.cohortIndex) !== -1) {
      if (['updateLinks', 'downloadPlaylist', 'downloadPhotos', 'downloadMP3Files'].indexOf(action) !== -1) {
        if (['dailymotion', 'facebook', 'mailru', 'odnoklassniki', 'savefrom', 'soundcloud', 'vimeo', 'vk', 'youtube', 'instagram', 'rutube'].indexOf(varCache.activeTabInfo.moduleName) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'extensionMenu', event: 'click', label: action});
        } else {
          mono.sendMessage({action: 'trackCohort', category: 'sitesNotSupporded', event: action, label: '%domain%'});
        }
      }
    }

    mono.sendMessage({action: 'trackEvent', category: 'extensionMenu', event: 'click', label: action});

    if (action === 'enableModule') {
      return onModuleToggle();
    } else {
      mono.sendMessage({action: (isModule ? 'viaMenu_' : '') + action});
    }

    if (mono.isGM) {
      _menu.hideMenuItems();
      return;
    }
    if (mono.isFF) {
      mono.addon.postMessage('hidePopup');
      return;
    }
    if (mono.isSafari) {
      safari.extension.popovers[0].hide();
      return;
    }
    window.close();
  };

  var updateMenu = function() {
    if (!menuContainer) {
      return;
    }

    updateDescription('showAboutPage');

    mono.sendMessage('getPreference', function(resp) {
      preference = resp;
      updateMenuItem();
    });

    mono.msgClean();
  };

  var setItemState = function (className, show) {
    var li = menuContainer.querySelectorAll('div.' + className);
    for(var i = 0; i < li.length; i++) {
      if (show) {
        li[i].classList.remove('inactive');
      } else {
        li[i].classList.add('inactive');
      }
    }
  };

  var safariBlankLink = function() {
    mono.openTab(this.href, true);
  };

  var updateSafariLinks = function() {
    var links = menuContainer.querySelectorAll('a[href][target="_blank"]');
    for (var i = 0, len = links.length; i < len; i++) {
      links[i].removeEventListener('click', safariBlankLink);
      links[i].addEventListener('click', safariBlankLink);
    }
  };

  var initSocial = function() {
    var targetUrl = 'http://savefrom.net/user.php';
    var url = encodeURIComponent(targetUrl);
    var image = encodeURIComponent('http://savefrom.net/img/icon_100.png');
    var title = encodeURIComponent(language.extName);
    var desc = encodeURIComponent(language.socialDesc);
    var btnList = {
      vk: {
        network: 'vkontakte',
        title: language.shareIn.replace('%w', 'VK'),
        href: 'http://vk.com/share.php?url='+url+'&image='+image+'&title='+title+'&description='+desc
      },
      ok: {
        network: 'odnoklassniki',
        title: language.shareIn.replace('%w', 'OK.ru'),
        href: 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1&st._surl='+url+'&st.comments='+desc
      },
      mailru: {
        network: 'mail.ru',
        title: language.shareIn.replace('%w', 'Mail.ru'),
        href: 'http://connect.mail.ru/share?url='+url+'&title='+title+'&description='+desc+'&imageurl='+image
      },
      tw: {
        network: 'twitter',
        title: language.shareIn.replace('%w', 'Twitter'),
        href: 'https://twitter.com/intent/tweet?text='+title+'&url='+url
      },
      fb: {
        network: 'facebook',
        title: language.shareIn.replace('%w', 'Facebook'),
        href: 'http://www.facebook.com/sharer.php?s=100&p[url]='+url+'&p[title]='+title+'&p[summary]='+desc+'&p[images][0]='+image
      },
      gp: {
        network: 'google+',
        title: language.shareIn.replace('%w', 'Google+'),
        href: 'https://plus.google.com/share?url='+url
      },
      lj: {
        network: 'livejournal',
        title: language.shareIn.replace('%w', 'Livejournal'),
        href: 'http://www.livejournal.com/update.bml?subject='+title+'&event='+desc+' '+url
      }
    };
    for (var item in btnList) {
      var link = menuContainer.querySelector('.social-btn.'+item);
      if (!link) {
        continue;
      }
      link.title = btnList[item].title;
      link.href = btnList[item].href;
      link.dataset.network = btnList[item].network;
    }
    link.parentNode.addEventListener('click', function(e) {
      var btn = e.target;
      if (!btn.classList.contains('social-btn')) {
        return;
      }
      var network = btn.dataset.network;
      mono.sendMessage({action: 'trackSocial', target: targetUrl, event: 'share', network: network});
    });
  };

  var setModuleBtnState = function(tabInfo) {
    setItemState(tabInfo.moduleName, true);

    if (tabInfo.moduleName === 'youtube') {
      setItemState('plYoutube', false);
      var isPlaylist = false;
      var url = tabInfo.url;
      if (url.indexOf('/playlist?') !== -1) {
        isPlaylist = true;
      } else
      if ((/[?&]{1}list=/).test(url)) {
        isPlaylist = true;
      } else {
        var matched = url.match(/(user|channel)\/[^\/]+(\/feed|\/featured|\/videos|$)/i);
        if (!matched) {
          matched = url.match(/\/(feed)\/(subscriptions|history)/i);
        }
        if (!matched || matched.length < 3) {
          isPlaylist = false;
        } else {
          isPlaylist = true;
        }
      }
      if (isPlaylist) {
        setItemState('plYoutube', true);
      }
    }
  };

  var onGetTabInfo = function(tabInfo, force) {
    varCache.activeTabInfo = tabInfo;

    if (tabInfo.moduleName) {
      setCheckboxState(tabInfo.state);
      setItemState('enableModule', true);
    }

    if (['odnoklassniki'].indexOf(tabInfo.moduleName) !== -1) {
      setItemState('bookmarklet', false);
    }

    if (tabInfo.state) {
      setModuleBtnState(tabInfo);
    }

    if (tabInfo.moduleName === 'savefrom') {
      setCheckboxState('force');
      setItemState('enableModule', false);
    }

    if (!force) {
      tabInfo.isNotResponse = true;
      mono.sendMessage({action: 'getActiveTabModuleInfo', url: tabInfo.url}, function(moduleInfo) {
        tabInfo.isNotResponse = false;
        if (moduleInfo.moduleName !== tabInfo.moduleName) return;
        moduleInfo.url = tabInfo.url;

        setCheckboxState(moduleInfo.state);

        if (moduleInfo.state) {
          setModuleBtnState(moduleInfo);
        } else {
          setItemState('module', false);
        }
      });
    }
  };

  var updateMenuItem = function(moduleInfo) {
    setItemState('module', false);
    setItemState('bookmarklet', true);
    setItemState('enableModule', false);
    setCheckboxState(0);

    varCache.activeTabInfo = {};

    if (moduleInfo) {
      onGetTabInfo(moduleInfo, 1);
    } else {
      mono.sendMessage('getActiveTabInfo', onGetTabInfo);
    }
  };

  var setIconState = function(el, state) {
    var type = el.getAttribute('data-type');
    var path = el.querySelector('path');
    if (state === 'hover') {
      path.setAttribute('fill', '#ffffff');
    } else
    if (state === 'active') {
      path.setAttribute('fill', '#AAAAAA');
    } else
    if (state) {
      if (type === 'downloadMP3Files') {
        path.setAttribute('fill', '#00CCFF');
      } else
      if (type === 'downloadPlaylist') {
        path.setAttribute('fill', '#77D1FA');
      } else
      if (type === 'downloadPhotos') {
        path.setAttribute('fill', '#88cb66');
      } else
      if (type === 'showAboutPage') {
        path.setAttribute('fill', '#ADE61B');
      } else
      if (type === 'updateLinks') {
        path.setAttribute('fill', '#CB7FBD');
      } else
      if (type === 'downloadFromCurrentPage') {
        path.setAttribute('fill', '#CB7FBD');
      }
    }
  };

  var updateDescription = function(action, label) {
    var desc = varCache.desc;
    var text = varCache.deskText;
    var title = varCache.descTitel;
    var more = varCache.descMore;
    desc.dataset.page = action;

    var icon = varCache.icons[ action ];
    var subIcon = desc.querySelector('.icon');
    if (icon) {
      var _icon = icon.cloneNode(true);
      setIconState(_icon, 'active');
      if (subIcon) {
        subIcon.parentNode.replaceChild(_icon, subIcon);
      }
      subIcon.style.visibility = 'visible';
    } else {
      subIcon.style.visibility = 'hidden';
    }
    if (action === 'showAboutPage') {
      title.textContent = language.aboutTitle;
      text.textContent = '';
      var aboutText = mono.create('p', {text: language.aboutDescription});
      var linkSupport = mono.create('a', {href: 'http://savefrom.net/faq.php#supported_resourses', target: '_blank', text: language.aboutSupported});
      var linkHome = mono.create('a', {href: 'http://savefrom.net/user.php?helper=' + varCache.browser, target: '_blank', text: language.homePage});
      linkSupport.style.display = 'block';
      linkHome.style.display = 'block';
      text.appendChild(aboutText);
      text.appendChild(linkSupport);
      text.appendChild(linkHome);
      more.style.display = 'none';
    } else {
      title.textContent = label;
      text.textContent = language['menu'+mono.capitalize(action)] || '';
      more.style.display = 'block';
    }
    if (mono.isSafari) {
      updateSafariLinks();
    }
  };

  var onReady = function() {
    translatePage();

    varCache.descMore.href = 'http://savefrom.net/user.php?helper=' + varCache.browser;

    var el = menuContainer.querySelectorAll('div[data-action]');
    for(var i = 0; i < el.length; i++) {
      var icon = el[i].querySelector('svg');
      if (icon) {
        varCache.icons[ el[i].dataset.action ] = icon;
        setIconState(icon, 1);
      }
      if (el[i].style.display === 'none') continue;
      el[i].addEventListener('click', menuItemAction, false);
      mono.on(el[i], 'mouseenter', function(e) {
        var action = this.dataset.action;
        var icon = varCache.icons[ action ];
        if (icon) {
          setIconState(icon, 'hover');
        }
        var span = this.querySelector('span');
        var title = '';
        if (span) {
          title = span.textContent;
        }
        updateDescription(action, title);
      });
      mono.on(el[i], 'mouseleave', function(e) {
        var action = this.dataset.action;
        var icon = varCache.icons[ action ];
        if (icon) {
          setIconState(icon, 1);
        }
      });
    }

    initSocial();
    if (mono.isSafari) {
      updateSafariLinks();
    }

    updateDescription('showAboutPage');

    updateMenuItem();
  };

  var setCheckboxState = function(state) {
    if (state === 'force') {
      varCache.moduleTrigger.classList.add('enableForce');
    } else {
      varCache.moduleTrigger.classList.remove('enableForce');
    }
    if (state) {
      varCache.moduleTrigger.classList.remove('disabled');
      varCache.moduleTrigger.nextElementSibling.textContent = language.disableModule;
    } else {
      varCache.moduleTrigger.classList.add('disabled');
      varCache.moduleTrigger.nextElementSibling.textContent = language.enableModule;
    }
    if (varCache.desc.dataset.page !== 'showAboutPage') {
      updateDescription('enableModule', state ? language.disableModule : language.enableModule);
    }
  };

  var tutorial = {
    show: function() {
      "use strict";
      mono.storage.get('onceYtTutorial', function(storage) {
        if (storage.onceYtTutorial) {
          return;
        }
        storage.onceYtTutorial = 1;

        SaveFrom_Utils.tutorial.show({
          container: menuContainer,
          width: 482,
          height: 404 + (mono.isGM ? 2 : 0),
          padding: 4,
          slideList: SaveFrom_Utils.tutorial.getYtSlideList('black'),
          onClose: function() {
            mono.storage.set(storage);

            mono.sendMessage({action: 'setIconBadge', text: ''});
          },
          checkExists: function(cb) {
            mono.storage.get('onceYtTutorial', function(storage) {
              if (storage.onceYtTutorial) {
                return cb(1);
              }
              cb();
            });
          },
          trackId: 'Menu',
          boxStyle: {
            backgroundColor: 'transparent'
          },
          containerStyle: {
            borderRadius: '3px',
            backgroundColor: 'rgba(0, 104, 255, 0.9)',
            padding: 0,
            margin: '4px',
            boxShadow: 'none'
          },
          slideStyle: {
            backgroundColor: 'transparent',
            borderRadius: 0
          },
          leftBtnStyle: {
            top: '4px',
            left: '4px'
          },
          rightBtnStyle: {
            top: '4px',
            right: '4px'
          },
          closeBtnStyle: {
            backgroundColor: '#fff',
            color: 'rgba(0, 104, 255, 0.9)'
          },
          cssStyle: {
            ' .sf-dots': {
              'paddingTop': '2px'
            },
            ' .sf-dot i': {
              backgroundColor: '#fff'
            },
            ' .sf-dot.active i': {
              backgroundColor: 'transparent',
              borderRadius: '6px',
              margin: '-1px',
              width: '6px',
              height: '6px',
              border: '2px solid #fff'
            },
            ' .sf-slider-conteiner span': {
              color: '#fff !important'
            },
            ' .sf-slider-conteiner a': {
              color: '#fff !important'
            }
          },
          arrowColor: '#fff',
          arrowColorActive: '#fff',
          onResize: function(details) {
            details.box.style.position = 'absolute';
          },
          withOpacity: true,
          withDelay: 250,
          onShow: function() {
            mono.isSafari && updateSafariLinks();

            mono.sendMessage({action: 'setIconBadge', text: '?'});
          }
        });
      });
    }
  };

  var run = function(parent) {
    menuContainer = (parent || document).getElementsByClassName('sf-menu-container')[0];
    if (!menuContainer) {
      return;
    }
    varCache.list = menuContainer.querySelector('.sf-menu-list');
    varCache.desc = menuContainer.querySelector('.sf-menu-desc');
    varCache.descTitel = varCache.desc.querySelector('.title');
    varCache.deskText = varCache.desc.querySelector('.desc');
    varCache.descMore = varCache.desc.querySelector('.more');
    var version = varCache.desc.querySelector('.version');


    varCache.list.style.height = varCache.list.offsetHeight + 'px';

    mono.sendMessage(['getLanguage', 'getPreference', 'getVersion', 'getLastVersionInfo', 'getBrowser'], function(response) {
      language = response.getLanguage;
      preference = response.getPreference;

      mono.global.language = language;
      mono.global.preference = preference;

      varCache.browser = response.getBrowser;

      version.textContent = '';
      mono.create(version, {
        append: [
          mono.create('span', {
            text: language.aboutVersion+' '+response.getVersion
          }),
          !response.getLastVersionInfo ? undefined : mono.create('a', {
            text: language.updateTo.replace('%d', response.getLastVersionInfo),
            href: 'http://savefrom.net/user.php?helper=' + varCache.browser + '&update=' + response.getVersion,
            target: '_blank',
            on: ['click', function() {
              mono.sendMessage({action: 'trackEvent', category: 'extensionMenu', event: 'click', label: 'updateVersion'});
            }]
          })
        ]
      });

      if (['en', 'uk', 'ru'].indexOf(language.lang) === -1) {
        menuContainer.classList.add('no-poll');
      }

      varCache.moduleTrigger = menuContainer.querySelector('.sf-checkbox');

      if ([21].indexOf(preference.expIndex) !== -1) {
        tutorial.show();
      }

      onReady();
    });
  };

  mono.onMessage(function (mesasge, response) {
    if (mesasge === 'updateMenu') {
      updateMenu();
    }
  });

  if (mono.isGM) {
    _menu.initMenu = run;
  } else
  if (mono.isSafari) {
    safari.application.addEventListener('popover', function() {
      if (varCache.first === undefined) {
        varCache.first = 1;
        run();
      } else {
        updateMenu();
      }
    }, true);
  } else {
    run();
  }
})();

var dailymotion_com_embed = {
  getDailymotionLinks: function (request, callback)
  {
    function callback_links(data)
    {
      if (!data) {
        data = {};
      }
      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: data.links,
        title: data.title,
        duration: data.duration,
        thumb: data.thumb
      };

      callback(response);
    }

    dailymotion_com_embed.getEmbedVideoInfo(request.extVideoId, callback_links)
  },

  getPlayerV5Links: function(text, cb, noRead) {
    var metadata;
    try {
      var scriptList = mono.getPageScript(text, /playerV5/)[0];
      var jsonList = scriptList && mono.findJson(scriptList)[0];
      if (jsonList && jsonList.metadata) {
        metadata = jsonList.metadata;
      } else {
        metadata = JSON.parse(text.replace(/\r?\n/g, '').match(/\.playerV5\s+=[^{]+({.+}})\);/)[1]).metadata;
      }
      delete metadata.qualities.auto;
    } catch (e) {
      return cb();
    }

    var qualities = metadata.qualities;

    var links = [];
    var info = {
      title: metadata.title,
      duration: metadata.duration,
      thumb: metadata.poster_url,
      links: undefined
    };

    for (var size in qualities) {
      var linkList = qualities[size];
      if (!Array.isArray(linkList)) continue;

      for (var i = 0, item; item = linkList[i]; i++) {
        if (!/mp4|flv/.test(item.type) || !item.url) {
          continue;
        }
        if (!noRead) {
          var linkObj = dailymotion_com_embed.readLink(item.url);
          linkObj && links.push(linkObj);
        } else {
          links.push(item.url);
        }
      }
    }

    if (links.length) {
      if (!noRead) {
        links.sort(function(a,b) {
          return a.height < b.height;
        });
      }
      info.links = links;
    }

    cb(info);
  },

  readLink: function(url) {
    url = url.replace(/\\\//g, '/');
    url = url.replace(/\@\@[\w\-]+$/, '');
    var size = '';
    var t = url.match(/\/cdn\/\w+\-(\d+x\d+)\//i);
    if(t && t.length > 1)
    {
      size = t[1];
    }
    else
    {
      t = url.match(/\D(\d+x\d+)\D/i);
      if(t && t.length > 1)
      {
        size = t[1];
      }
    }

    var ext = 'FLV';
    t = url.match(/\.(\w{1,6})(?:$|\?)/);
    if(t && t.length > 1)
    {
      ext = t[1].toUpperCase();
    }

    if(size !== '80x60')
    {
      var height = parseInt(size.split('x').slice(-1)[0]);
      return {url: url, name: ext+' '+height, ext: ext, info_url: '', height: height};
    }
  },

  getLinks: function(text, cb, noRead)
  {
    var about = {};
    var links = [];
    var info = text.match(/(?:var|,)\s*info\s*=\s*\{(.*?)\}\s*(?:;|,\s*\w+\s*=)/i);

    if(!info || info.length < 2) {
      return dailymotion_com_embed.getPlayerV5Links(text, cb, noRead);
    }
    info = info[1];
    try {
      info = JSON.parse('{' + info + '}');
      if(!info) {
        return cb();
      }
      about.title = info.title;
      about.duration = info.duration;
      about.thumb = info.thumbnail_medium_url;
      for(var i in info)
      {
        if (!info.hasOwnProperty(i)) {
          continue;
        }
        if (typeof info[i] !== 'string') {
          continue;
        }
        if(info[i].search(/^https?:\/\/[^\s\"]+\.(mp4|flv)(\?|$)/) > -1)
        {
          if (noRead) {
            links.push(info[i]);
          } else {
            var link = dailymotion_com_embed.readLink(info[i]);
            if (link !== undefined) {
              links.push(link);
            }
          }
        }
      }
    } catch(e){}
    if (links.length > 0) {
      if (!noRead) {
        links.sort(function(a,b) {
          return a.height < b.height;
        });
      }
      about.links = links;
    }
    cb(about);
  },

  getDailymotionEmbedVideoInfoMsg: function(message, cb) {
    mono.ajax({
      url: message.url,
      success: function (data) {
        if (!data) {
          return cb();
        }

        dailymotion_com_embed.getLinks(data, cb, true);
      },
      error: function () {
        cb();
      }
    });
  },

  getEmbed: function(url, cb) {
    mono.ajax({
      url: url,
      success: function(data) {
        if (!data) {
          return cb();
        }

        dailymotion_com_embed.getLinks(data, cb);
      },
      error: function() {
        cb();
      }
    });
  },

  getEmbedVideoInfo: function (id, callback) {
    var url = "http://www.dailymotion.com/embed/video/" + id;
    dailymotion_com_embed.getEmbed(url, callback);
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return dailymotion_com_embed;
  };
} else {
  engine.modules.dailymotion = dailymotion_com_embed;
}

var odnoklassniki_ru_embed = {
  getOdnoklassnikiLinks: function (request, callback)
  {
    function callback_links(links)
    {
      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links,
        title: request.title
      };

      callback(response);
    }

    odnoklassniki_ru_embed._getOdnoklassnikiLinks(request.extVideoId, callback_links);
  },

  getOdnoklassnikiAudioLinks: function (request, callback)
  {
    function callback_links(data)
    {
      var response = {
        action: request.action,
        trackId: request.trackId,
        jsessionId: request.jsessionId,
        data: data
      };

      callback(response);
    }

    odnoklassniki_ru_embed._getOdnoklassnikiAudioLinks(request.url, request.trackId, request.jsessionId, callback_links);
  },

  _getOdnoklassnikiLinks: function(extVideoId, callback)
  {
    if(!extVideoId)
    {
      callback(null);
      return;
    }

    var url = 'http://in.video.mail.ru/cgi-bin/video/oklite?eid=' + extVideoId;

    mono.ajax({
      url: url,
      success: function(data, xhr) {
        if (!data) {
          return callback(null);
        }
        var u = 'http://www.okcontent.video.mail.ru/media/';

        var host = data.match(/\$vcontentHost=([^\s\"'\<\>]+)/i);
        if(host && host.length > 1)
          u = 'http://' + host[1] + '/media/';

        u += extVideoId;

        var links = [];

        var quality = '';
        var qulityMatch = data.match(/\$height=([0-9]+)/);
        if(qulityMatch && qulityMatch.length > 1) {
          quality = qulityMatch[1];
        }

        links.push({
          url: u + '-v.mp4',
          name: 'SD',
          ext: 'FLV',
          subname: quality
        });

        if(data.search(/\$HDexist=1/i) > -1)
        {
          quality = '';
          var qulityMatch = data.match(/\$HDheight=([0-9]+)/);
          if(qulityMatch && qulityMatch.length > 1) {
            quality = qulityMatch[1];
          }

          links.push({
            url: u + '-hv.mp4',
            name: 'HD',
            ext: 'MP4',
            subname: quality
          });
        }

        if(links)
        {
          callback(links);
        }
      },
      error: function(xhr) {
        callback(null);
      }
    });
  },

  _getOdnoklassnikiAudioLinks: function(pageUrl, trackId, jSessionId, cb)
  {
    if(!trackId || !jSessionId) {
      return cb(null);
    }

    mono.ajax({
      url: 'http://wmf1.odnoklassniki.ru/play;jsessionid=' + jSessionId + '?tid=' + trackId + '&',
      success: function(data) {
        var obj;
        try {
          obj = JSON.parse(data);
        } catch (e) {}
        cb(obj);
      },
      error: function() {
        cb(null);
      }
    });
  },

  getOkAudioListLinks: function(msg, cb) {
    var responseList = [];
    var trackIdList = msg.trackIdArr;
    var jSessionId = msg.jsessionId;
    if(!Array.isArray(trackIdList) || typeof jSessionId !== 'string'  || !trackIdList.length) {
      return cb(responseList);
    }

    var waitCount = trackIdList.length;
    var readyCount = 0;
    var onReady = function() {
      readyCount++;
      if (readyCount !== waitCount) {
        return;
      }
      return cb(responseList);
    };
    var onGetData = function(data) {
      if (data) {
        responseList.push(data);
      }
      onReady();
    };
    for (var i = 0, trackId; trackId = trackIdList[i]; i++) {
      this._getOdnoklassnikiAudioLinks(undefined, trackId, jSessionId, onGetData);
    }
  },

  getClipyouLinks: function(id, hash, quality, title, cb) {
    mono.ajax({
      dataType: 'json',
      url: 'http://media.clipyou.ru/api/player/secure_link?record_id='+id+'&type=mp4&resource_hash='+hash,
      success: function(data) {
        if (!data || !data.data || data.data.length === 0) {
          return cb();
        }
        var links = [];
        data.data.forEach(function(item) {
          links.push({
            quality: quality,
            url: item,
            title: title
          });
        });
        cb(links);
      },
      error: function() {
        cb();
      }
    });
  },

  getClipyouHash: function(id, cb) {
    mono.ajax({
      url: 'http://media.clipyou.ru/api/player_data.json?id='+id,
      success: function(data, xhr) {
        if (!xhr.responseText) {
          return cb();
        }

        var content = xhr.responseText;
        if (!content) {
          return cb();
        }
        var data = content.match('resource_hash".?:.?"([^"]*)"');
        if (!data || data.length < 2) {
          return cb();
        }
        var hash = data[1];
        cb(hash)
      },
      error: function() {
        cb();
      }
    });
  },

  getPladformVideo: function(message, cb) {
    var playerId = message.playerId;
    var videoId = message.videoId;

    mono.ajax({
      mimeType: 'text/xml',
      url: 'http://out.pladform.ru/getVideo?pl='+playerId+'&videoid='+videoId,
      success: function(data, xhr) {
        if (!xhr.responseXML) {
          return cb();
        }

        var xml = xhr.responseXML;
        var srcList = xml.querySelectorAll('src');
        if (srcList.length === 0) {
          return cb();
        }

        var cover = xml.querySelector('cover') || undefined;
        if (cover && (cover = cover.textContent) && cover.substr(0, 2) === '//') {
          cover = 'http:' + cover;
        }

        var time = xml.querySelector('time') || undefined;
        time = time && time.textContent;

        var quality, id;
        var title = xml.querySelector('title') || undefined;
        title = title && title.textContent;
        var qualityList = ['ld', 'sd'];
        var sizeList = ['360', '720'];
        var linkList = [];
        for (var i = 0, src; src = srcList[i]; i++) {
          id = src.textContent || '';
          quality = src.getAttribute('quality');

          var qIndex = qualityList.indexOf(quality);
          if (qIndex !== -1) {
            quality = sizeList[qIndex];
          }

          var type = src.getAttribute('type');

          if (type === 'video') {
            linkList.push({url: id, quality: quality, title: title, cover: cover, duration: time});
          } else
          if (type === 'clipyou') {
            odnoklassniki_ru_embed.getClipyouHash(id, function(hash) {
              if (!hash) {
                return cb();
              }
              odnoklassniki_ru_embed.getClipyouLinks(id, hash, quality, title, function(links) {
                cb(links);
              });
            });
            return;
          }
        }
        if (linkList.length === 0) {
          linkList = undefined;
        }
        return cb(linkList);
      },
      error: function() {
        cb();
      }
    })
  },

  getOdklPladformVideo: function (request, callback)
  {
    function callback_links(links)
    {
      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links,
        title: request.title
      };

      callback(response);
    }

    odnoklassniki_ru_embed.getPladformVideo(request.extVideoId, callback_links);
  },

  getOdklPladformMeta: function (request, cb)
  {
    odnoklassniki_ru_embed.getOkMetadata({url: request.extVideoId}, function(data) {
      if (!data || !data.videos || !data.videos[0] || !data.videos[0].url) {
        return cb();
      }
      var args = mono.parseUrlParams(data.videos[0].url);
      var extVideoId = {
        playerId: args.pl,
        videoId: args.videoid
      };
      request.extVideoId = extVideoId;
      odnoklassniki_ru_embed.getOdklPladformVideo(request, cb);
    });
  },

  getOkMetadata: function(message, cb) {
    var url = message.url;
    if (!url) {
      return cb();
    }
    mono.ajax({
      url: url,
      success: function(data, xhr) {
        var obj;
        try {
          obj = JSON.parse(data);
        } catch (e) {}
        cb(obj);
      },
      error: function(xhr) {
        cb();
      }
    });
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return odnoklassniki_ru_embed;
  };
} else {
  engine.modules.odnoklassniki = odnoklassniki_ru_embed;
}

var soundcloud_com_embed = {
  getSoundcloudTrackInfo: function (request, callback)
  {
    function callback_links(data, isValid)
    {
      var response = {
        action: request.action,
        trackUrl: request.trackUrl,
        client_id: request.client_id,
        data: data,
        checkLinks: isValid
      };

      callback(response);
    }

    soundcloud_com_embed._getSoundcloudTrackInfo(request.trackUrl, request.client_id, callback_links);
  },

  _getSoundcloudTrackInfo: function (trackUrl, client_id, callback)
  {
    if(!trackUrl || !client_id)
    {
      callback(null);
      return;
    }

    var url = 'http://api.soundcloud.com/resolve.json?url=' + trackUrl +
      '&client_id=' + client_id;

    mono.ajax({
      url: url,
      dataType: 'json',
      headers: {
        Referer: url
      },
      success: function(data) {
        soundcloud_com_embed.checkSoundcloudLinks(data, client_id, callback);
      },
      error: function() {
        soundcloud_com_embed.checkSoundcloudLinks(null, client_id, callback);
      }
    });
  },

  checkSoundcloudLinks: function (data, client_id, cb) {
    if (!data) {
      return cb();
    }
    var info = data;

    if(info.kind !== 'track' && info.tracks && info.tracks.length === 1) {
      info = info.tracks[0];
    }

    if(info.kind === 'track' && info.stream_url) {
      soundcloud_com_embed.validateSoundcloudTrackUrl(info.stream_url, client_id, function (isValid) {
        cb(data, isValid);
      });
      return;
    }

    if (info.tracks) {
      soundcloud_com_embed.validateSoundcloudTrackUrl(info.tracks[0].stream_url, client_id, function(isValid) {
        cb(data, isValid);
      });
      return;
    }

    return cb(data);
  },

  validateSoundcloudTrackUrl: function (url, client_id, cb) {
    url += (url.indexOf('?') === -1) ? '?' : '&';
    url += 'client_id=' + client_id;
    mono.ajax({
      url: url,
      type: 'HEAD',
      success: function() {
        cb(true);
      },
      error: function() {
        cb(false);
      }
    });
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return soundcloud_com_embed;
  };
} else {
  engine.modules.soundcloud = soundcloud_com_embed;
}

var vimeo_com_embed = {
  getVimeoLinks: function(request, callback) {
    function callback_links(links, title, thumb)
    {
      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links,
        title: title,
        thumb: thumb
      };

      callback(response);
    }

    vimeo_com_embed._getVimeoLinks(request.extVideoId, callback_links);
  },
  _getVimeoLinks: function(videoId, callback) {
    vimeo_com_embed.getVimeoNoEmbedLinks(videoId, function(links, title, thumb){
      if(links)
      {
        callback(links, title, thumb);
        return;
      }

      vimeo_com_embed.getVimeoEmbedLinks(videoId, callback);
    });
  },
  getVimeoEmbedLinks: function(videoId, callback) {
    mono.ajax({
      url: 'http://player.vimeo.com/video/' + videoId,
      success: function(data, xhr) {
        if (!xhr.responseText) {
          return callback(null, '', '');
        }

        var config = xhr.responseText.match(/,c\s*=\s*(\{[\s\S]+?\})\s*;/i);
        if(config && config.length > 1) {
          config = config[1];

          var data = vimeo_com_embed.getVimeoDataFromConfig(config);
          if (data && data.links) {
            return callback(data.links, data.title, data.thumb);
          }
        }
        callback(null, '', '');
      },
      error: function() {
        callback(null, '', '');
      }
    });
  },
  getVimeoNoEmbedLinks: function(videoId, callback) {
    mono.ajax({
      url: 'http://vimeo.com/' + videoId,
      success: function(data, xhr) {
        if (!xhr.responseText) {
          return callback(null, '', '');
        }

        var configUrl = xhr.responseText.match(/data-config-url=[\"']([^\s\"'\<\>]+)/i);

        if(configUrl && configUrl.length > 1)
        {
          configUrl = configUrl[1].replace(/&amp;/ig, '&');
          mono.ajax({
            url: configUrl,
            success: function(responseText, xhr) {
              if (!xhr.responseText) {
                return callback(null, '', '');
              }

              var data = vimeo_com_embed.getVimeoDataFromConfig(xhr.responseText);
              if(data && data.links)
              {
                return callback(data.links, data.title, data.thumb);
              }
              callback(null, '', '');
            },
            error: function() {
              callback(null, '', '');
            }
          });
          return;
        }
        callback(null, '', '');
      },
      error: function() {
        callback(null, '', '');
      }
    });
  },
  getVimeoDataFromConfig: function(config) {
    config = config.replace(/(\{|,)\s*(\w+)\s*:/ig, '$1"$2":').
      replace(/(:\s+)\'/g, '$1"').replace(/\'([,\]\}])/g, '"$1');

    try
    {
      config = JSON.parse(config);
    }
    catch(err)
    {
      return null;
    }

    if(!config || !config.request || !config.video ||
      !config.request.files || !config.request.files.codecs.length)
    {
      return null;
    }

    var r = config.request, v = config.video, data = {};

    data.title = v.title ? v.title : '';

    if(v.thumbs)
    {
      for(i in v.thumbs)
      {
        data.thumb = v.thumbs[i];
        break;
      }
    }

    data.links = [];

    var codecs = r.files.codecs;
    for(var k = 0; k < codecs.length; k++)
    {
      var files = r.files[codecs[k]];
      if(files)
      {
        for(var i in files)
        {
          var name = i.length <= 3 ? i.toUpperCase() : mono.capitalize(i.toLowerCase());

          var ext = files[i].url.match(/\.(\w{2,4})(?:\?|#|$)/i);
          if(ext && ext.length > 1)
            ext = ext[1].toLowerCase();
          else
            ext = 'mp4';

          data.links.push({
            url: files[i].url,
            name: name,
            type: ext,
            ext: ext.toUpperCase()
          });
        }
      }
    }

    return data;
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return vimeo_com_embed;
  };
} else {
  engine.modules.vimeo = vimeo_com_embed;
}

var vkontakte_ru_embed = {
  getVKLinks: function (request, callback)
  {
    function callback_links(vid, links, title, duration, thumb, data, embed)
    {
      if(embed)
      {
        embed.origRequest = request;
        engine.onMessage(embed, callback);
        return;
      }

      var response = {
        action: request.action,
        extVideoId: vid ? vid : request.extVideoId,
        links: links,
        title: title,
        duration: duration,
        thumb: thumb,
        data: data,
        checkLinks: null
      };

      if(request.checkLinks && links && links.length > 0)
      {
        vkontakte_ru_embed.checkVkLinks(links, function(checkUrl, isValid, status){
          response.checkLinks = isValid;
          callback(response);
        });
        return;
      }

      callback(response);
    }

    vkontakte_ru_embed._getVKLinks(request.extVideoId, callback_links);
  },

  preparePladformLinks: function(pladformLinks) {
    var links;
    var obj = {
      links: links = []
    };
    pladformLinks.forEach(function(item) {
      obj.title = item.title;
      obj.duration = item.duration;
      obj.thumb = item.cover;

      var ext = item.url.match(/[\w]+\.(mp4|flv)(?:\?|$)/i);
      if (!ext) {
        ext = 'flv';
      } else {
        ext = ext[1];
      }
      links.push({
        url: item.url,
        name: ext.toUpperCase(),
        subname: item.quality.toUpperCase(),
        type: ext.toLowerCase()
      });
    });
    return obj;
  },

  _getVKLinks: function (videoId, callback) {
    var links = [], title = videoId, duration = '', thumb = '', data = null, embed = null;

    var vid = videoId;
    if(vid.search(/^video-?\d+_\d+/i) == -1)
    {
      var oid = '', id = '';
      var m = vid.match(/(?:^|&)oid=(-?\d+)/i);
      if(m && m.length > 1)
        oid = m[1];

      m = vid.match(/(?:^|&)id=(-?\d+)/i);
      if(m && m.length > 1)
        id = m[1];

      vid = '';
      if(oid && id)
        vid = 'video' + oid + '_' + id;
    }

    if(!vid)
    {
      callback(vid, links, title);
      return;
    }

    title = vid;

    var url = 'http://vk.com/' + vid;

    mono.ajax({
      url: url,
      success: function(response) {
        if (!response) {
          return callback(vid, links, title, duration, thumb, data, embed);
        }

        var data;
        var type = 1;
        var json = response
          .replace(/\{[-a-zA-Z_\.]+\}/ig, '')
          .match(/var\svars\s*=\s*(\{[^\}]+\})/i);
        if (!json) {
          type = 2;
          json = response
            .replace(/\{[-a-zA-Z_\.]+\}/ig, '')
            .match(/var\sopts\s*=\s*(\{[^\}]+\})/i);
          if (json) {
            try {
              json = json[1].replace(/\\n/g, '').replace(/\\\//g, '/').replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":').replace(/'/g, '"');
              json = JSON.parse(json);
            } catch (e) {
              json = null;
            }
            if (!json || !json.url || !/\/\/.*pladform\..*\//.test(json.url)) {
              json = null;
            }
          }
          if (!json) {
            type = 0;
          }
        }
        if(type === 1) {
          try {
            json = json[1];

            if(json.search(/^\{\s*\\\"/) > -1)
              json = json.replace(/\\\"/g, '"');

            json = JSON.parse(json);
            if(json) {
              data = json;
              links = vkontakte_ru_embed.getVkVideoLinks(json);

              if(json.md_title)
                title = json.md_title;

              if(json.thumb)
                thumb = json.thumb;
              else if(json.jpg)
                thumb = json.jpg;

              if(thumb && thumb.search(/\\\//) > -1)
                thumb = thumb.replace(/\\\//g, '/');
            }
          } catch(err){}
        } else
        if (type === 2) {
          var params = mono.parseUrlParams(json.url);
          var okEmbed = engine.modules.odnoklassniki;
          okEmbed.getPladformVideo({playerId: params.pl, videoId: params.videoid}, function(pladformLinks) {
            if (!Array.isArray(pladformLinks)) {
              return callback(vid, links, title, duration, thumb, data, embed);
            }

            var videoInfo = vkontakte_ru_embed.preparePladformLinks(pladformLinks);

            callback(vid, videoInfo.links, videoInfo.title, videoInfo.duration, videoInfo.thumb, data, embed);
          });
          return;
        } else {
          var frame = response.match(/<iframe[^>]+>/ig);
          var m;
          if(frame) {
            for(var i=0, l=frame.length; i<l; i++) {
              m = frame[i].match(/youtube.com\\?\/embed\\?\/([\w\-]+)/i);
              if(m && m.length > 1) {
                embed = {
                  action: 'getYoutubeLinks',
                  extVideoId: m[1]
                };
                break;
              }
              m = frame[i].match(/vimeo.com\\?\/video\\?\/(\d+)/i);
              if(m && m.length > 1) {
                embed = {
                  action: 'getVimeoLinks',
                  extVideoId: m[1]
                };
                break;
              }
            }
          }
          if (embed === null) {
            var ajaxPreload = response.lastIndexOf('ajax.preload');
            if (ajaxPreload !== -1) {
              data = response.substr(ajaxPreload);
              var dmId = data.match(/url: '(?:[\w\\/]+.)?dailymotion.com(?:\\\/swf)?\\\/video\\\/([\w\d]+)\??/);
              if (dmId && dmId.length > 1) {
                embed = {
                  action: 'getDailymotionLinks',
                  extVideoId: dmId[1]
                }
              }
            }
          }
        }

        var _duration = response.match(/(['"]?)duration\1\s*:\s*(\d+)/i);
        if(_duration && _duration.length > 2)
        {
          duration = _duration[2];
        }

        callback(vid, links, title, duration, thumb, data, embed);
      },
      error: function() {
        callback(vid, links, title, duration, thumb, data, embed);
      }
    });
  },

  checkVkLinks: function (links, callback)
  {
    var checkUrl = '';

    if(links && links.length > 0)
    {
      if(links[0].type == 'mp4')
        checkUrl = links[0].url;
      else if(links.length > 1)
        checkUrl = links[1].url;
      else
        checkUrl = links[0].url;
    }

    if(checkUrl)
    {
      mono.ajax({
        url: checkUrl,
        type: 'HEAD',
        success: function(data, xhr) {
          callback(checkUrl, true, xhr.status);
        },
        error: function(xhr) {
          callback(checkUrl, false, xhr.status);
        }
      });
      return;
    }

    callback();
  },

  getVkVideoLinks: function (v) {
    if(!v || !v.host || !v.vtag || (!v.vkid && !v.uid))
      return null;

    if(typeof(v.host) != 'string' && v.host.toString)
      v.host = v.host.toString();

    v.host = v.host.replace(/\\\//g, '/');

    if(v.hd > 0 && (!v.hd_def || v.hd > v.hd_def))
      v.hd_def = v.hd;

    var links = [];
    if(v.hd_def <= 0 && v.no_flv == 0)
    {
      links.push({
        url: vkontakte_ru_embed.getVkFlvLink(v),
        name: 'FLV',
        subname: '',
        type: 'flv'
      });
    }
    else
    {
      links.push({
        url: vkontakte_ru_embed.getVkMp4Link(v, 240),
        name: (v.no_flv == 0) ? 'FLV' : 'MP4',
        subname: '240',
        type: (v.no_flv == 0) ? 'flv' : 'mp4'
      });

      if(v.hd_def > 0)
      {
        links.push({
          url: vkontakte_ru_embed.getVkMp4Link(v, 360),
          name: 'MP4',
          subname: '360',
          type: 'mp4'
        });

        if(v.hd_def > 1)
        {
          links.push({
            url: vkontakte_ru_embed.getVkMp4Link(v, 480),
            name: 'MP4',
            subname: '480',
            type: 'mp4'
          });

          if(v.hd_def > 2)
          {
            links.push({
              url: vkontakte_ru_embed.getVkMp4Link(v, 720),
              name: 'MP4',
              subname: '720',
              type: 'mp4'
            });
          }
        }
      }
    }

    return links;
  },

  getVkFlvLink: function (v)
  {
    if(v.host.search(/^https?:\/\//i) != -1)
    {
      if(v.host.charAt(v.host.length - 1) != '/')
        v.host += '/';

      if(v.host.search(/^https?:\/\/cs\d+\./i) != -1)
        return v.host + 'u' + v.uid + '/videos/' + v.vtag + '.flv';

      return v.host + 'assets/video/' + v.vtag + v.vkid + '.vk.flv';
    }

    var url = v['url240'];
    if (url !== undefined) {
      url = decodeURIComponent(url.replace(/\\\//g, '/'));
      var ePos = url.indexOf('?');
      if (ePos === -1) {
        ePos = url.length;
      }
      if (url) {
        return url.substr(0, ePos);
      }
    }

    if(v.host.search(/\D/) == -1)
      return 'http://cs' + v.host + '.' + 'vk.com/u' + v.uid + '/videos/' + v.vtag + '.flv';

    return 'http://' + v.host + '/assets/video/' + v.vtag + v.vkid + '.vk.flv';
  },

  getVkMp4Link: function(v, q)
  {
    if(q == 240 && v.no_flv == 0)
      return vkontakte_ru_embed.getVkFlvLink(v);

    if(v.host.search(/^https?:\/\//i) != -1)
    {
      if(v.host.charAt(v.host.length - 1) != '/')
        v.host += '/';

      return v.host + 'u' + v.uid + '/videos/' + v.vtag + '.' + q + '.mp4';
    }

    var url = v['url'+q];
    if (url !== undefined) {
      url = decodeURIComponent(url.replace(/\\\//g, '/'));
      var ePos = url.indexOf('?');
      if (ePos === -1) {
        ePos = url.length;
      }
      if (url) {
        return url.substr(0, ePos);
      }
    }

    return 'http://cs' + v.host + '.' + 'vk.com/u' + v.uid + '/videos/' + v.vtag + '.' + q + '.mp4';
  },

  getVkLinksFromData: function(request, cb) {
    var data = request.data;
    var json = data.match(/var\s+vars\s+=\s+({.*});/i);
    if (!json) {
      return cb();
    }
    json = json[1];
    try {
      json = JSON.parse(json);
    } catch (e) {
      return cb();
    }
    var links = [];
    var vid = json.vid;
    var title = json.md_title || json.vid;
    var thumb = '';

    if(json.thumb) {
      thumb = json.thumb;
      if (thumb.search(/\\\//) !== -1) {
        thumb = thumb.replace(/\\\//g, '/');
      }
    } else
    if(json.jpg) {
      thumb = json.jpg;
    }

    for (var key in json) {
      if (key.substr(0, 3) !== 'url') {
        continue;
      }
      var quality = parseInt(key.substr(3));
      if (isNaN(quality)) {
        continue;
      }
      var url = json[key];
      var type = 'flv';
      if (json.no_flv === 1) {
        type = 'mp4';
      }
      links.push({
        url: url,
        subname: quality,
        name: type.toUpperCase(),
        type: type
      });
    }

    var duration = data.match(/(['"]?)duration\1\s*:\s*(\d+)/i);
    if(duration && duration.length > 2) {
      duration = duration[2];
    } else {
      duration = '';
    }

    return cb({
      action: 'getVKLinks',
      extVideoId: vid,
      links: links,
      title: title,
      duration: duration,
      thumb: thumb,
      data: json,
      checkLinks: null
    });
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono, _engine) {
    mono = _mono;
    engine = _engine;
    return vkontakte_ru_embed;
  };
} else {
  engine.modules.vkontakte = vkontakte_ru_embed;
}

var youtube_com_embed = {
  lastSts: ["16657", [["swap",11],["swap",29],["swap",63],["reverse",null],["swap",45],["swap",34],["splice",2]] ],
  /**
   * currentSts {{sts: Number, url: string, actList: Array, trust: boolean, invalid: boolean}}
   */
  currentSts: undefined,
  isTrackError: {},
  getYoutubeLinks: function (request, callback)
  {
    function callback_links(links, title, subtitles, duration)
    {
      youtube_com_embed.addUmmyLinks(links, request.extVideoId);

      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links,
        title: title,
        subtitles: subtitles,
        duration: duration,
        checkLinks: null
      };

      if(request.checkLinks && links)
      {
        youtube_com_embed.checkYoutubeLinks(links, function(checkUrl, isValid, status){
          response.checkLinks = isValid;
          callback(response);
        });
        return;
      }

      callback(response);
    }

    youtube_com_embed.__getYoutubeLinks(request.url, request.extVideoId, request.checkSubtitles, callback_links, request.noDash);
  },

  prepareDechiper: function(testItem, currentSts, cb) {
    "use strict";
    var sigUrl = currentSts.url.match(/\/html5player-([^\/]+)\//);
    sigUrl = sigUrl && sigUrl[1];
    this.ytHtml5SigDecipher.dechip({sts: currentSts.sts, url: currentSts.url}, function(actList, sts, trust) {
      if (!actList) {
        if (!this.isTrackError[sigUrl]) {
          this.isTrackError[sigUrl] = 1;
          sigUrl && currentSts.sts && engine.trackEvent('youtube', 'pError', currentSts.sts + ' ' + sigUrl);
        }
        currentSts.invalid = true;
        return cb();
      }

      currentSts.actList = actList;
      currentSts.trust = !!trust;

      if (!currentSts.sts && sts) {
        currentSts.sts = sts;
      }

      if (!trust) {
        var url = testItem.url;
        url += '&signature=' + youtube_com_embed.ytRunActList(currentSts.actList, testItem.s);
        this.ytHtml5SigDecipher.checkActList(currentSts.sts, currentSts.actList, url, function(r) {
          if (r) {
            currentSts.trust = true;
          } else {
            currentSts.invalid = true;
          }
          cb();
        });
      } else {
        cb();
      }
    }.bind(this));
  },

  needDechiper: function(config) {
    "use strict";
    var needDechiper = false;
    ['url_encoded_fmt_stream_map', 'adaptive_fmts', 'fmt_url_map'].some(function(key) {
      var item = config[key];
      if (!item) {
        return 0;
      }

      item.some(function(item) {
        if (item.s && item.url) {
          needDechiper = item;
          return 1;
        }
      });

      if (needDechiper) {
        return 1;
      }
    });
    return needDechiper;
  },

  videoInfoToObj: function(data, isObj) {
    "use strict";
    var decodeParams = function(data) {
      ['url_encoded_fmt_stream_map', 'adaptive_fmts', 'fmt_url_map'].forEach(function(key) {
        if (data[key]) {
          data[key] = data[key].split(',').map(function(item) {
            return dataStrToObj(item);
          });
        }
      });
    };
    var dataStrToObj = function(data) {
      data = mono.parseUrlParams(data, {
        forceSep: '&',
        argsOnly: 1,
        useDecode: 1
      });
      decodeParams(data);
      return data;
    };

    var config = data;
    if (isObj) {
      decodeParams(config);
    } else {
      config = dataStrToObj(data);
    }
    return config;
  },

  expCurrentSts: function() {
    "use strict";
    var now = parseInt(Date.now() / 1000);

    if (this.currentSts === undefined) {
      return;
    }

    if (!this.currentSts.expire) {
      this.currentSts.expire = now + 21600;
    } else
    if (this.currentSts.expire < now) {
      this.currentSts = undefined;
    }
  },

  getYtConfig: function(videoId, eurl, cb, index) {
    "use strict";
    if (!index) {
      index = 0;
    }

    this.expCurrentSts();

    if (this.currentSts === undefined) {
      return this.getCurrentSts(function(obj) {
        this.currentSts = obj || {sts: parseInt(this.lastSts[0]), actList: this.lastSts[1], trust: true};
        this.expCurrentSts();
        this.getYtConfig(videoId, eurl, cb, index);
      }.bind(this));
    }

    var currentSts = JSON.parse(JSON.stringify(this.currentSts));

    var url, params;
    if (index === 0 || index === 1) {
      var domain = index === 0 ? 'www.youtube-nocookie.com' : 'www.youtube.com';
      params = {
        video_id: videoId,
        asv: 3,
        eurl: eurl,
        el: 'info',
        sts: currentSts.sts
      };
      url = 'http://' + domain + '/get_video_info?' + mono.param(params);
    } else
    if (index === 2) {
      url = 'http://www.youtube.com/watch?' + mono.param({v: videoId, spf: 'navigate'});
    } else
    if (index === 3) {
      url = 'http://www.youtube.com/watch?' + mono.param({v: videoId});
    } else {
      return cb();
    }

    var abort = function() {
      this.getYtConfig(videoId, eurl, cb, ++index);
    }.bind(this);

    mono.ajax({
      url: url,
      success: function(data) {
        var jsonList = undefined;
        if (!data || typeof data !== 'string') {
          return abort();
        }

        var config;
        if ([0,1].indexOf(index) !== -1) {
          config = this.videoInfoToObj(data);

          if (index === 0) {
            if (config.requires_purchase === '1'
              || config.url_encoded_fmt_stream_map === ''
              || config.fmt_url_map === ''
              || config.adaptive_fmts === ''
              || config.errorcode > 0) {
              return abort();
            }
          }
        } else
        if (index === 2) {
          try {
            data = JSON.parse(data);
            data.some(function(item) {
              if (item.data && (jsonList = item.data.swfcfg)) {
                return true;
              }
            });
            if (!jsonList) {
              return abort();
            }
          } catch (e) {
            return abort();
          }
        } else {
          var script = mono.getPageScript(data, /ytplayer\.config\s+=\s+/);
          if (!script.length) {
            return abort();
          }
          script = script[0];

          jsonList = mono.findJson(script, [/"video_id":/]);
          if (!jsonList.length) {
            return abort();
          }
          jsonList = jsonList[0];
        }
        if ([2,3].indexOf(index) !== -1) {
          if (!jsonList.args || typeof jsonList.args !== 'object') {
            return abort();
          }

          if (jsonList.assets && jsonList.assets.js) {
            currentSts = {sts: jsonList.sts, url: jsonList.assets.js};
          }

          config = this.videoInfoToObj(jsonList.args, 1);
        }

        var testItem;
        if (!currentSts.actList && (testItem = this.needDechiper(config))) {
          this.prepareDechiper(testItem, currentSts, function() {
            if (index !== 3 && currentSts.invalid) {
              return abort();
            }

            cb(config, currentSts);
          });
        } else {
          cb(config, currentSts);
        }
      }.bind(this),
      error: function() {
        abort();
      }.bind(this)
    });
  },

  readFmt: function(links, meta, fmt, currentSts, titleParam) {
    "use strict";
    fmt.forEach(function(item) {
      if (item.stream) {
        meta.hasStream = 1;
        return 1;
      }

      if (!item.url) {
        return 1;
      }

      var url = item.url;
      if(!/(\?|&)s(ig(nature)?)?=/i.test(url)) {
        if(item.sig) {
          url += '&signature=' + item.sig;
        } else
        if(item.signature) {
          url += '&signature=' + item.signature;
        } else
        if(item.s) {
          if (currentSts.invalid) {
            console.error('Sts in invalid!', currentSts);
            return 1;
          }
          if (!currentSts.actList) {
            console.error('Sts actList is not found!', currentSts);
            return 1;
          }
          url += '&signature=' + youtube_com_embed.ytRunActList(currentSts.actList, item.s);
        }
      }

      if(item.itag && !/(\?|&)itag=/i.test(url)) {
        url += '&itag=' + item.itag;
      }

      url = url.replace(/(\?|&)sig=/i, '$1signature=').replace(/\\u0026/ig, '&');

      var itag = url.match(/(?:\?|&)itag=(\d+)/i);
      itag = itag && itag[1];
      if (!itag) {
        return 1;
      }

      if (!meta[itag]) {
        meta[itag] = {};
      }

      if (item.fps) {
        meta[itag].fps = item.fps;
      }

      if (item.size && /^\d+x\d+$/.test(item.size)) {
        var wh = item.size.split('x');
        meta[itag].quality = youtube_com_embed.getDashQuality(wh[0], wh[1]);
      }

      if (!links[itag]) {
        links[itag] = url + titleParam;
      }
    });
  },

  onGetConfig: function(videoId, checkSubtitles, cb, noDash, config, currentSts) {
    "use strict";
    var links = null, title = '', subtitles = null, duration = '', dashUrl = null;

    if (!config) {
      return cb(links, title, subtitles, duration);
    }

    cb = function(cb) {
      var wait = 1;
      var ready = 0;

      var onReady = function() {
        ready++;
        if (ready !== wait) {
          return;
        }
        cb(links, title, subtitles, duration);
      };

      if(checkSubtitles) {
        wait++;
        this.getYoutubeSubtitles({extVideoId: videoId}, function(subs) {
          subtitles = subs || null;
          onReady();
        });
      }

      if (!noDash && dashUrl) {
        wait++;
        if (!links) {
          links = {};
        }
        this.getYouTubeDashLinks(links, dashUrl, function() {
          var len = Object.keys(links).length;
          if (links.meta && !links.meta.hasStream) {
            len--;
          }
          if (!len) {
            links = null;
          }
          onReady();
        }, !currentSts.invalid && function(actList, s) {
            return youtube_com_embed.ytRunActList(actList, s);
          }.bind(this, currentSts.actList));
      }

      onReady();
    }.bind(this, cb);

    var titleParam = '';
    title = config.title || '';
    duration = config.length_seconds || '';
    dashUrl = config.dashmpd || '';

    if (title) {
      title = title.replace(/\+/g, ' ');
      titleParam = '&title=' + encodeURIComponent(mono.fileName.modify(title));
    }

    var fmtMap = config.fmt_url_map || config.url_encoded_fmt_stream_map || [];
    var adaptiveFmts = config.adaptive_fmts || [];

    var meta = {};

    if (config.livestream || config.live_playback) {
      meta.hasStream = 1;
    }

    links = {};
    fmtMap && this.readFmt(links, meta, fmtMap, currentSts, titleParam);
    adaptiveFmts && this.readFmt(links, meta, adaptiveFmts, currentSts, titleParam);

    if (Object.keys(links).length === 0 && !meta.hasStream) {
      links = null;
    } else {
      links.meta = meta;
    }

    cb();
  },

  __getYoutubeLinks: function(eurl, videoId, checkSubtitles, cb, noDash) {
    "use strict";
    if (!eurl) {
      eurl = 'http://www.youtube.com/watch?v='+videoId;
    }

    this.getYtConfig(videoId, eurl, function(config, currentSts) {
      this.onGetConfig(videoId, checkSubtitles, cb, noDash, config, currentSts);
    }.bind(this));
  },

  addUmmyLinks: function(links, videoId) {
    if (!links || (links.meta && links.meta.hasStream)) {
      return;
    }

    if (engine.preferences.showUmmyItem) {
      links['ummy'] = 'ummy:www.youtube.com/watch?v=' + videoId;
      links['ummyAudio'] = 'ummy:www.youtube.com/watch?v=' + videoId+'&sf_type=audio';
    }
  },

  checkYoutubeLinks: function (links, callback) {
    var checkItags = ['18', '34', '35'], checkUrl = '';
    for(var i = 0; i < checkItags.length; i++)
    {
      if(links[checkItags[i]])
      {
        checkUrl = links[checkItags[i]];
        break;
      }
    }

    if(checkUrl)
    {
      mono.ajax({
        type: 'HEAD',
        url: checkUrl,
        success: function(data, xhr) {
          callback(checkUrl, true, xhr.status);
        },
        error: function(xhr) {
          callback(checkUrl, false, xhr.status);
        }
      });
      return;
    }

    callback();
  },

  getYoutubeSubtitles: function(message, cb) {
    var videoId = message.extVideoId;
    var baseUrl = 'http://video.google.com/timedtext';
    mono.ajax({
      url: baseUrl + '?hl='+engine.language.lang+'&v=' + videoId + '&type=list&tlangs=1',
      mimeType: 'text/xml',
      success: function(data, xhr) {
        if (!xhr.responseXML) {
          return cb();
        }
        var track = xhr.responseXML.querySelectorAll('track');
        var target = xhr.responseXML.querySelectorAll('target');
        var list = [];
        var trackList = {};
        var targetList = {};
        var origTrack = undefined;
        var langCode, param;
        for (var i = 0, item; item = track[i]; i++) {
          langCode = item.getAttribute('lang_code');
          param = {
            lang: langCode,
            v: videoId,
            fmt: 'srt',
            name: item.getAttribute('name') || undefined
          };
          trackList[langCode] = {
            lang: item.getAttribute('lang_translated'),
            langCode: langCode,
            url: baseUrl + '?' + mono.param(param),
            name: param.name
          };
          list.push(trackList[langCode]);
          if (!origTrack && item.getAttribute('cantran')) {
            origTrack = param;
          }
        }

        if (origTrack) {
          for (i = 0, item; item = target[i]; i++) {
            langCode = item.getAttribute('lang_code');
            param = {
              lang: origTrack.lang,
              v: videoId,
              tlang: langCode,
              fmt: 'srt',
              name: origTrack.name
            };
            targetList[langCode] = {
              lang: item.getAttribute('lang_translated'),
              langCode: langCode,
              url: baseUrl + '?' + mono.param(param),
              isAuto: true
            };
          }
        }

        engine.actionList.getNavigatorLanguage(undefined, function(langCode) {
          langCode = langCode.toLocaleLowerCase();
          if (langCode.indexOf('zh-hant') === 0) {
            langCode = 'zh-Hant';
          } else
          if (langCode.indexOf('zh-hans') === 0) {
            langCode = 'zh-Hans';
          }
          var localeList = [langCode];
          if (localeList[0] === 'uk') {
            localeList.push('ru');
          }
          for (i = 0, item; item = localeList[i]; i++) {
            if (!trackList[item] && targetList[item]) {
              list.push(targetList[item]);
            }
          }

          return cb(list);
        });
      },
      error: function() {
        cb();
      }
    });
  },

  getYouTubeDashLinks: function(links, dashmpd, cb, dechiper) {
    if (!dashmpd || dashmpd.indexOf('yt_live_broadcast') !== -1) {
      return cb();
    }

    var s_pos = dashmpd.indexOf('/s/');
    if (s_pos !== -1) {
      if (!dechiper) {
        return cb();
      }

      s_pos += 3;
      var s_end = dashmpd.indexOf('/', s_pos);
      if (s_end === -1) {
        s_end = dashmpd.length;
      }
      var s = dashmpd.substr( s_pos, s_end - s_pos );
      var signature = dechiper(s);
      dashmpd = dashmpd.substr(0, s_pos - 2) + 'signature/' + signature + dashmpd.substr(s_end);
    }

    dashmpd = dashmpd.replace('/sig/', '/signature/');

    mono.ajax({
      url: dashmpd,
      mimeType: 'text/xml',
      success: function(data, xhr) {
        if (!xhr.responseXML) {
          return cb();
        }
        youtube_com_embed.parseDash( xhr.responseXML, links, cb);
      },
      error: function() {
        cb();
      }
    });
  },

  getDashQuality: function(a, b) {
    var qualityList = {
      144: 144,
      240: 240,
      360: 360,
      480: 480,
      720: 720,
      1080: 1080,
      1440: 1440,
      '4K': 2160,
      '5K': 2880,
      '8K': 4320
    };

    var quality;
    var g = Math.max(a, b);
    a = Math.min(a, b);
    for (var qualityName in qualityList) {
      var value = qualityList[qualityName];
      if (g >= Math.floor(16 * value / 9) || a >= value) {
        quality = qualityName;
      } else {
        return quality;
      }
    }
    return quality;
  },

  parseDash: function(xml, links, cb) {
    "use strict";
    var elList = xml.querySelectorAll('Representation');
    if (!links) {
      links = {};
    }

    var meta = links.meta = links.meta || {};

    for (var i = 0, el; el = elList[i]; i++) {
      var itag = el.getAttribute('id');

      if (!meta[itag]) {
        meta[itag] = {};
      }

      meta[itag].fps = el.getAttribute('frameRate') || undefined;

      var width = el.getAttribute('width');
      var height = el.getAttribute('height');

      meta[itag].quality = width && height && youtube_com_embed.getDashQuality(width, height);

      if (links[itag] !== undefined) {
        continue;
      }

      var baseurl = el.querySelector('BaseURL');
      if (baseurl === null) {
        continue;
      }
      var url = baseurl.textContent;

      var SegmentURL = baseurl.parentNode.querySelector('SegmentURL');
      var segmentUrl;
      if (SegmentURL && (segmentUrl = SegmentURL.getAttribute('media'))) {
        if (segmentUrl.indexOf('sq/') === 0) {
          continue;
        }
      }

      links[itag] = url;
    }
    cb(links);
  },

  getYoutubeIdListFromPlaylist: function(request, cb) {
    youtube_com_embed.getIdListFromList(request.baseUrl || 'http://www.youtube.com', request.listId, cb);
  },

  getIdListFromList: (function() {
    var getNextPage = function(baseUrl, url, pageList, cb) {
      if (!pageList) {
        pageList = [];
      }
      mono.ajax({
        url: baseUrl + url,
        dataType: 'json',
        success: function(data) {
          if (!data) {
            return cb(pageList);
          }
          pageList.push(data.content_html);
          var nextPageUrl = getNextPageUrl(data.load_more_widget_html);
          if (nextPageUrl === undefined) {
            return cb(pageList);
          }
          getNextPage(baseUrl, nextPageUrl, pageList, cb);
        },
        error: function() {
          cb(pageList);
        }
      });
    };
    var getTitleFromPage = function(data) {
      var title = data.match(/<h1[^>]+>([^<]+)<\/h1>/);
      if (!title) {
        return undefined;
      }
      return title[1].replace(/\r?\n/g, " ").trim();
    };
    var getNextPageUrl = function(data) {
      if (!data) {
        return undefined;
      }
      var nextUrl = data.match(/data-uix-load-more-href="([^"]+)"/);
      if (nextUrl) {
        nextUrl = nextUrl[1];
      }
      return nextUrl || undefined;
    };
    var readLinksFromPages = function(listId, pageList, cb) {
      var title = getTitleFromPage(pageList[0]);
      var idObj = {};
      var idList = [];
      var pattern = /href="\/watch\?([^"]+)"/g;
      var maxIndex = 0;
      for (var i = 0, len = pageList.length; i < len; i++) {
        var content = pageList[i];
        content.replace(pattern, function(string, args) {
          var url = mono.parseUrlParams(args, {argsOnly: 1});
          if (url.list !== listId) {
            return;
          }
          url.index = parseInt(url.index);
          idObj[url.index] = url.v;
          if (url.index > maxIndex) {
            maxIndex = url.index;
          }
        });
      }
      for (i = 0; i <= maxIndex; i++) {
        if (idObj[i] === undefined) {
          continue;
        }
        if (idList.indexOf(idObj[i]) === -1) {
          idList.push(idObj[i]);
        }
      }
      cb({idList: idList, title: title});
    };
    return function getLinksFromList(baseUrl, listId, cb) {
      mono.ajax({
        url: baseUrl + '/playlist?list=' + listId,
        success: function(data) {
          var nextPageUrl = getNextPageUrl(data);
          if (!nextPageUrl) {
            return readLinksFromPages(listId, [data], cb);
          }
          getNextPage(baseUrl, nextPageUrl, [data], function(pageList) {
            readLinksFromPages(listId, pageList, cb);
          });
        },
        error: function() {
          cb();
        }
      });
    };
  })(),

  getYoutubeLinksFromConfig: function(message, cb) {
    "use strict";
    var abort = function() {
      youtube_com_embed.getYoutubeLinks(message, cb);
    };
    cb = function(cb, obj) {
      if (obj && obj.links) {
        youtube_com_embed.addUmmyLinks(obj.links, message.extVideoId);
      }
      cb(obj);
    }.bind(this, cb);

    var jsonList = message.config;
    if (!jsonList
      || !jsonList.args
      || jsonList.args.video_id !== message.extVideoId
      || !jsonList.assets
      || !jsonList.assets.js
    ) {
      return abort();
    }

    var config = this.videoInfoToObj(jsonList.args, 1);
    var currentSts = {sts: jsonList.sts, url: jsonList.assets.js};

    this.expCurrentSts();

    if (this.currentSts === undefined) {
      if (currentSts.sts) {
        this.currentSts = JSON.parse(JSON.stringify(currentSts));
        this.expCurrentSts();
      }
    } else
    if (this.currentSts.url === currentSts.url || this.currentSts.sts === currentSts.sts) {
      currentSts = JSON.parse(JSON.stringify(this.currentSts));
    }

    var onCurrentStsReady = function() {
      var onGetLinks = function(links, title, subtitles, duration) {
        cb({
          links: links,
          title: title,
          isQuick: 1
        });
      };
      this.onGetConfig(
        message.extVideoId,
        message.checkSubtitles,
        onGetLinks,
        message.noDash,
        config,
        currentSts
      );
    }.bind(this);

    var testItem;
    if (!currentSts.actList && (testItem = this.needDechiper(config))) {
      this.prepareDechiper(testItem, currentSts, function() {
        if (currentSts.invalid) {
          return abort();
        }

        onCurrentStsReady();
      }.bind(this));
    } else {
      onCurrentStsReady();
    }
  },

  ytRunActList: function(list, a) {
    var actionList = {
      slice:function(a,b){a.slice(b)},
      splice:function(a,b){a.splice(0,b)},
      reverse:function(a){a.reverse()},
      swap:function(a,b){var c=a[0];a[0]=a[b%a.length];a[b]=c}
    };
    a = a.split("");
    for (var i = 0, item; item = list[i]; i++) {
      actionList[item[0]](a, item[1]);
    }
    return a.join("");
  },

  ytHtml5SigDecipher: {
    readObfFunc: function(func, data) {
      var vList = func.match(/\[(\w+)\]/g);
      if (!vList) {
        return;
      }
      for (var i = 0, v; v = vList[i]; i++) {
        var vv = data.match(new RegExp('[, ]{1}'+ v.slice(1, -1) +'="(\\w+)"'));
        if (vv) {
          func = func.replace(v, '.'+vv[1]);
        }
      }
      var arr = func.split(';');
      var actList = [];
      for (var i = 0, item; item = arr[i]; i++) {
        if (item.indexOf('.split(') !== -1 || item.indexOf('.join(') !== -1) {
          continue;
        }
        if (item.indexOf('reverse') !== -1) {
          actList.push(['reverse', null]);
          continue;
        }
        var m = item.match(/splice\((\d+)\)/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['splice', m]);
          continue;
        }
        var m = item.match(/slice\((\d+)\)/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['slice', m]);
          continue;
        }
        var m = item.match(/\[(\d+)%\w+\.length/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['swap', m]);
        }
      }
      return actList;
    },
    getChip: function(data, cb) {
      var sts = data.match(/,sts:(\d+)/);
      sts = sts && sts[1];

      var actList = [];
      var funcName = data.match(/\.sig\|\|([$_a-zA-Z0-9]+)\(/);
      if (!funcName) {
        return cb();
      }
      funcName = funcName[1];
      funcName = funcName.replace(/\$/g, '\\$');
      var func = data.match(new RegExp("(function "+funcName+"\\(([\\w$]+)\\){[^}]*});"));
      if (!func) {
        return cb();
      }
      var vName = func[2];
      func = func[1];
      var regexp = new RegExp("[\\w$]+\\.[\\w$]+\\("+vName+"[^)]*\\)", 'g');
      var sFuncList = func.match(regexp);
      if (!sFuncList) {
        actList = this.readObfFunc(func, data);
        if (actList && actList.length > 0) {
          return cb(actList, sts);
        }
        return cb();
      }
      var objName = '';
      var objElList = [];
      for (var i = 0, item; item = sFuncList[i]; i++) {
        var m = item.match(/([\w$]+)\.([\w$]+)\([\w$]+,?([\w$]+)?\)/);
        if (m) {
          objName = m[1];
          objElList.push({name: m[2], arg: parseInt(m[3])});
        }
      }
      var sPos = data.indexOf('var '+objName+'={');
      if (sPos === -1) {
        sPos = data.indexOf(','+objName+'={');
      }
      if (sPos === -1) {
        sPos = data.indexOf(objName+'={');
      }
      var place = data.substr(sPos, 300);
      for (i = 0, item; item = objElList[i]; i++) {
        var vName = item.name;
        regexp = new RegExp(vName+":(function\\([$\\w,]+\\){[^}]+})");
        var sF = place.match(regexp);
        if (!sF) {
          return cb();
        }
        sF = sF[1];
        if (sF.indexOf('splice') !== -1) {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['splice', item.arg]);
        } else
        if (sF.indexOf('slice') !== -1) {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['slice', item.arg]);
        } else
        if (sF.indexOf('reverse') !== -1) {
          item.arg = null;
          actList.push(['reverse', item.arg]);
        } else {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['swap', item.arg]);
        }
      }
      cb(actList, sts);
    },
    getPlayer: function(message, cb) {
      if (message.url.substr(0, 2) === '//') {
        message.url = 'http:' + message.url;
      }
      mono.ajax({
        url: message.url,
        success: function(data) {
          if (!data) {
            return cb();
          }
          return this.getChip(data, cb);
        }.bind(this),
        error: function() {
          return cb();
        }
      })
    },
    checkActList: function(sts, actList, url, cb) {
      mono.ajax({
        type: 'HEAD',
        url: url,
        success: function() {
          this.addDechipList(sts, actList);
          cb(1);
        }.bind(this),
        error: function() {
          cb(0);
        }
      });
    },
    getDechipList: function(cb) {
      if (this.getDechipList.data !== undefined) {
        return cb(this.getDechipList.data);
      }
      mono.storage.get('ytDechipList', function(data) {
        data.ytDechipList = data.ytDechipList || {};
        this.getDechipList.data = data;
        cb(data);
      }.bind(this));
    },
    addDechipList: function(sts, actList) {
      if (!sts) return;
      var lastSts = youtube_com_embed.lastSts;
      this.getDechipList.data.ytDechipList[lastSts[0] = sts] = lastSts[1] = actList;
      mono.storage.set(this.getDechipList.data);
    },
    /**
     * @param {{sts: Number, url: String}} message
     * @param {Function} cb
     */
    dechip: function(message, cb) {
      this.getDechipList(function(data) {
        if (message.sts) {
          var actList = data.ytDechipList[message.sts];
          if (actList) {
            return cb(actList, parseInt(message.sts), 1);
          }
        }
        this.getPlayer(message, function(actList, sts) {
          if (actList && actList.length > 0) {
            return cb(actList, parseInt(sts));
          }
          cb();
        });
      }.bind(this));
    }
  },

  addOnPrepareEvent: function() {
    "use strict";
    engine.onEvent('prepare', function() {
      mono.storage.get('ytDechipList', function(data) {
        var dechipList = data.ytDechipList = data.ytDechipList || {};
        var lastSts = this.lastSts;
        dechipList[lastSts[0]] = lastSts[1];

        this.ytHtml5SigDecipher.getDechipList.data = data;
        var keys = Object.keys(dechipList);
        keys.sort(function(a, b) {
          return a < b ? 1 : -1
        });

        if (lastSts[0] < keys[0]) {
          lastSts[0] = keys[0];
          lastSts[1] = dechipList[keys[0]];
        }

      }.bind(this));
    }.bind(youtube_com_embed));
  },

  getSignatureFromHtml: function(data, cb) {
    "use strict";
    var script = mono.getPageScript(data, /ytplayer\.config\s+=\s+/);
    if (!script.length) {
      return cb();
    }
    script = script[0];

    var jsonList = mono.findJson(script, [/html5player/, /"sts":\d+/]);
    if (!jsonList.length) {
      return cb();
    }
    jsonList = jsonList[0];

    if (!jsonList.sts || !jsonList.assets || !jsonList.assets.js) {
      return cb();
    }

    return cb({sts: parseInt(jsonList.sts), url: jsonList.assets.js});
  },

  getCurrentSts: function(cb) {
    "use strict";
    mono.ajax({
      url: 'http://www.youtube.com/',
      success: function(data) {
        if (!data) {
          return cb();
        }
        this.getSignatureFromHtml(data, cb);
      }.bind(this),
      error: function() {
        cb();
      }
    });
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono, _engine) {
    mono = _mono;
    engine = _engine;
    youtube_com_embed.addOnPrepareEvent();
    return youtube_com_embed;
  };
} else {
  engine.modules.youtube = youtube_com_embed;
  youtube_com_embed.addOnPrepareEvent();
}

var facebook_com_embed = {
  getFacebookLinks: function(request, callback) {
    var callback_links = function (links, title, thumb, duration) {
      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links || null,
        title: title || '',
        thumb: thumb || '',
        duration: duration || ''
      };

      callback(response);
    };

    facebook_com_embed._getFacebookLinks(request.extVideoId, callback_links);
  },

  _getFacebookLinks: function(videoId, cb) {
    mono.ajax({
      type: 'GET',
      url: 'https://www.facebook.com/video.php?v='+videoId,
      success: function(data) {
        if (data) {
          return facebook_com_embed.getLinksFromData(data, videoId, cb);
        }
        cb();
      },
      error: function() {
        cb();
      }
    });
  },
  getLinksFromData: function(data, videoId, cb) {
    var match = data.match(/\["params","([^"]*)"\]/im);
    var mTitle = data.match(/<h2[^>]*>([^<]*)<\/h2>/im);
    if (!mTitle) {
      mTitle = ['',''];
    }
    if (!match) {
      return this.getLinksFromData2(data, videoId, cb);
    }
    var params;
    try {
      params = JSON.parse(decodeURIComponent(JSON.parse('"'+match[1]+'"')));
      if (!params.video_data || !params.video_data[0]) {
        throw true;
      }
      params = params.video_data[0];
    } catch (e) {
      return cb();
    }

    var links = [];

    var ext;
    if (params.sd_src) {
      ext = facebook_com_embed.getFileExtension(params.sd_src, 'mp4');
      links.push({
        url: params.sd_src,
        name: 'SD',
        type: ext,
        ext: ext.toUpperCase()
      });
    }
    if (params.hd_src) {
      ext = facebook_com_embed.getFileExtension(params.hd_src, 'mp4');
      links.push({
        url: params.hd_src,
        name: 'HD',
        type: ext,
        ext: ext.toUpperCase()
      });
    }

    cb(links, mTitle[1], params.thumbnail_src, params.video_duration);
  },

  getLinksFromData2: function(data, videoId, cb) {
    "use strict";
    var title = data.match(/<h2[^>]*>([^<]*)<\/h2>/im);
    title = title && title[1];

    data = data.match(/"videoData":\[([^\]]+)\]/);
    data = data && data[1];

    if (!data) {
      return cb();
    }

    var jsonList = mono.findJson(data, [/"(sd|hd)_src":/, new RegExp(videoId)]);
    if (!jsonList || !jsonList.length) {
      return cb();
    }

    var params = jsonList[0];

    if (String(params.video_id) !== String(videoId)) {
      return cb();
    }

    var links = [];

    var ext;
    if (params.sd_src) {
      ext = facebook_com_embed.getFileExtension(params.sd_src, 'mp4');
      links.push({
        url: params.sd_src,
        name: 'SD',
        type: ext,
        ext: ext.toUpperCase()
      });
    }
    if (params.hd_src) {
      ext = facebook_com_embed.getFileExtension(params.hd_src, 'mp4');
      links.push({
        url: params.hd_src,
        name: 'HD',
        type: ext,
        ext: ext.toUpperCase()
      });
    }

    return cb(links, title, params.thumbnail_src, params.video_duration);
  },

  getFileExtension: function(str, def) {
    var ext = str.match(/\.([a-z0-9]{3,4})(\?|$)/i);
    if(ext) {
      ext = ext[1];
      return ext.toLowerCase();
    }

    return (def ? def : '');
  },

  getFacebookPhotoUrl: function(message, cb) {
    if (!message.fbid) {
      return cb();
    }
    mono.ajax({
      url: 'https://www.facebook.com/photo.php?fbid='+message.fbid,
      success: function(data) {
        if (!data) {
          return cb();
        }

        var m = data.match(/<a[^>]+fbPhotosPhotoActionsItem[^>]+href="([^">]+dl=1)"[^>]+>/i);
        if (m) {
          var url = m[1];
          url = url.replace(/&amp;/g, '&');
          return cb(url);
        }
        return cb();
      },
      error: function() {
        cb();
      }
    })
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono) {
    mono = _mono;
    return facebook_com_embed;
  };
} else {
  engine.modules.facebook = facebook_com_embed;
}

var mail_ru_embed = {
  getMailruLinks: function(request, callback) {
    function callback_links(links, title, thumb, vid, duration)
    {
      var response = {
        action: request.action,
        extVideoId: vid || request.extVideoId,
        links: links,
        title: title,
        thumb: thumb,
        duration: duration
      };

      callback(response);
    }

    mail_ru_embed._getMailruLinks(request.extVideoId, callback_links);
  },
  _getMailruLinks: function(pathname, callback) {
    var metadataUrl, vPath = pathname;
    var videoId = pathname.match('/?([^\/]+)/([^\/]+)/video/(.+).html');
    if (!videoId) {
      videoId = pathname.match('embed/([^\/]+)/([^\/]+)/(.+).html');
    }
    if (videoId !== null && videoId.length > 3) {
      metadataUrl = 'http://api.video.mail.ru/videos/' + videoId[1] + '/' + videoId[2] + '/' + videoId[3] + '.json';
      vPath = videoId[1] + '/' + videoId[2] + '/video/' + videoId[3]+'.html';
    }
    if (metadataUrl) {
      return mail_ru_embed.onGetMailruMetadataUrl(metadataUrl, vPath, callback);
    }
    mono.ajax({
      url: 'http://my.mail.ru/'+pathname,
      success: function(data) {
        if (!data || typeof data !== 'string') {
          return callback();
        }
        var data = data.match(/<meta\s+content="[^"]+(videoapi\.my\.mail[^&]+)&[^"]+"[^>]+\/>/);
        if (!data) {
          return callback();
        }
        data = decodeURIComponent(data[1]);
        var vid = data.substr(data.lastIndexOf('/')+1);
        metadataUrl = 'http://videoapi.my.mail.ru/videos/'+vid+'.json';
        mail_ru_embed.onGetMailruMetadataUrl(metadataUrl, vPath, callback);
      },
      error: function() {
        callback();
      }
    })
  },
  onGetMailruMetadataUrl: function(metadataUrl, vPath, callback) {
    mail_ru_embed.getMailruMetadata(metadataUrl, function(data) {
      if (!data || typeof data === 'string') {
        return callback();
      }
      mail_ru_embed.readMailruMetadata(data, function(_links, title, thumb, duration) {
        callback(mail_ru_embed.prepMailruLinks(_links), title, thumb, vPath, duration);
      });
    });
  },
  prepMailruLinks: function(_links) {
    if (!_links) {
       return;
    }
    var links = [];
    for (var i = 0, link; link = _links[i]; i++) {
      var url = link.url;
      var format = 'FLV';
      if (url.indexOf('.mp4') !== -1) {
        format = 'MP4';
      }
      if (url.indexOf('.mov') !== -1) {
        format = 'MOV';
      }
      if (url.indexOf('.mpg') !== -1) {
        format = 'MPG';
      }
      if (!link.quality) {
        link.quality = '-?-';
      }
      var quality = link.quality.toUpperCase();

      var qList = ['1080P', '720P', '480P', '360P', '272P'];
      var tList = ['1080', '720', '480', '360', '272'];

      var qPos = qList.indexOf(quality);
      if (qPos !== -1) {
        quality = tList[qPos];
      }

      var ext = format.toLowerCase();
      links.push({
        url: url,
        subname: quality,
        name: format,
        ext: ext
      });
    }
    links.sort(function(a, b) {
      if (a.subname === 'HD') {
        return 1;
      }
      return a.subname > b.subname;
    });
    return links;
  },
  getMailruMetadata: function(url, cb) {
    if (!url) {
      return cb();
    }
    mono.ajax({
      url: url,
      success: function(data) {
        var obj;
        try {
          obj = JSON.parse(data);
        } catch (e) {}
        cb(obj);
      },
      error: function(xhr) {
        cb();
      }
    });
  },
  readMailruMetadata: function(metadata, cb) {
    var links = [], title;
    /**
     * @namespace metadata.provider Object
     * @namespace metadata.movie Object
     * @namespace metadata.videos Object
     * @namespace metadata.meta Object
     * @namespace metadata.meta.poster Object
     */
    var duration = undefined;
    var thumb = undefined;
    if (metadata.meta) {
      thumb = metadata.meta.poster;
      duration = metadata.meta.duration;
    }
    if (metadata.provider === 'UPLOADED') {
      title = metadata.movie?metadata.movie.title:undefined;
      if (!metadata.videos) {
        return cb();
      }
      metadata.videos.forEach(function(item) {
        links.push({
          quality: item.name,
          url: item.url,
          title: title
        });
      });
    } else
    if (metadata.provider === 'ugc') {
      title = metadata.meta?metadata.meta.title:undefined;
      if (!metadata.videos) {
        return cb();
      }
      metadata.videos.forEach(function(item) {
        links.push({
          quality: item.key,
          url: item.url,
          title: title
        });
      });
    } else
    if (metadata.provider === 'pladform') {
      title = metadata.meta?metadata.meta.title:undefined;
      var okEmbed = engine.modules.odnoklassniki;
      okEmbed.getPladformVideo({playerId: metadata.meta.playerId, videoId: metadata.meta.videoId}, function(links) {
        if (!links) {
          return cb();
        }
        links.forEach(function(item) {
          if (item.title === undefined) {
            item.title = title
          }
        });
        cb(links, title, thumb, duration);
      });
      return;
    }
    if (links.length === 0) {
      return cb();
    }
    return cb(links, title, thumb, duration);
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono, _engine) {
    mono = _mono;
    engine = _engine;
    return mail_ru_embed;
  };
} else {
  engine.modules.mail_ru = mail_ru_embed;
}

var SaveFrom_Utils = {
  downloadParam: 'sfh--download',

  setStyle: function(node, style)
  {
    if(!node || !style)
      return;

    for(var i in style)
      node.style[i] = style[i];
  },


  getStyle: function(node, property)
  {
    var s = undefined;
    if(!node)
      return undefined;

    if(node.currentStyle)
    {
      property = property.replace(/-(w)/g, function(s, m){return m.toUpperCase()});
      return node.currentStyle[property];
    }

    if(window.getComputedStyle)
      return window.getComputedStyle(node, null).getPropertyValue(property);

    return undefined;
  },

  addStyleRules: function(selector, rules, className)
  {
    var style = className ? document.querySelector('#savefrom-styles.'+className) : document.getElementById('savefrom-styles');
    if(!style)
    {
      style = document.createElement('style');
      style.id = 'savefrom-styles';
      if (className) {
        style.classList.add(className);
      }
      // maybe need for safari
      //style.appendChild(document.createTextNode(""));
      var s = document.querySelector('head style');
      if(s)
      // allow to override our styles
        s.parentNode.insertBefore(style, s);
      else
        document.querySelector('head').appendChild(style);
    }

    if(typeof(rules) == 'object') {
      var r = [];
      for(var i in rules)
        r.push(i + ':' + rules[i]);

      rules = r.join(';');
    }

    style.textContent += selector + '{' + rules + '}';
  },

  getPosition: function(node, parent)
  {
    var box = node.getBoundingClientRect();

    if (parent) {
      var parent_pos = parent.getBoundingClientRect();
      return {
        top: Math.round(box.top - parent_pos.top),
        left: Math.round(box.left - parent_pos.left),
        width: box.width,
        height: box.height
      }
    }
    return {
      top: Math.round(box.top + window.pageYOffset),
      left: Math.round(box.left + window.pageXOffset),
      width: box.width,
      height: box.height
    }
  },

  getSize: function(node)
  {
    return {width: node.offsetWidth, height: node.offsetHeight};
  },

  getMatchFirst: function(str, re)
  {
    var m = str.match(re);
    if(m && m.length > 1)
      return m[1];

    return '';
  },


  getElementByIds: function(ids)
  {
    for(var i = 0; i < ids.length; i++)
    {
      var node = document.getElementById(ids[i]);
      if(node)
        return node;
    }

    return null;
  },

  getParentByClass: function(node, name) {
    if(!node || name == '') {
      return false;
    }

    var parent;
    if(typeof name === 'object' && name.length > 0) {
      for(parent = node; parent; parent = parent.parentNode) {
        if (parent.nodeType !== 1) {
          return null;
        }
        for(var i = 0; i < name.length; i++) {
          if(parent.classList.contains(name[i])) {
            return parent;
          }
        }
      }
    } else {
      for(parent = node; parent; parent = parent.parentNode) {
        if (parent.nodeType !== 1) {
          return null;
        }
        if(parent.classList.contains(name)) {
          return parent;
        }
      }
    }

    return null;
  },

  getParentByTagName: function(node, tagName) {
    if(!node || tagName == '') {
      return false;
    }

    for(var parent = node; parent; parent = parent.parentNode) {
      if (parent.nodeType !== 1) {
        return null;
      }
      if(parent.tagName === tagName) {
        return parent;
      }
    }

    return null;
  },

  hasChildrenTagName: function(node, tagName) {
    for (var i = 0, item; item = node.childNodes[i]; i++) {
      if (item.nodeType !== 1) {
        continue;
      }
      if (item.tagName === tagName) {
        return true;
      }
    }
    return false;
  },


  isParent: function(node, testParent)
  {
    if (!testParent || [1, 9, 11].indexOf(testParent.nodeType) === -1) {
      return false;
    }

    return testParent.contains(node);
  },


  emptyNode: function(node)
  {
    while(node.firstChild)
      node.removeChild(node.firstChild);
  },

  initFrameDownloadListener: function() {
    if (SaveFrom_Utils.initFrameDownloadListener.enable === 1) {
      return;
    }
    SaveFrom_Utils.initFrameDownloadListener.enable = 1;
    window.addEventListener("message", function listener(e) {
      if (e.data.substr(0, 6) !== 'killMe') {
        return;
      }
      var src = e.data.substr(7);
      var frameList = document.querySelectorAll('iframe.sf-dl-frame');
      var frameListLen = frameList.length;
      for (var f = 0, el; el = frameList[f]; f++) {
        if (el.src === src) {
          el.parentNode.removeChild(el);
          frameListLen--;
          break;
        }
      }
      if (frameListLen === 0) {
        SaveFrom_Utils.initFrameDownloadListener.enable = 0;
        window.removeEventListener("message", listener);
      }
    });
  },

  download: function(filename, url, requestOptions, callback, options)
  {
    if(!url)
      return false;

    filename = filename || this.getFileName(url);
    if(!filename)
      return false;

    options = options || {};

    if (!mono.global.preference.downloads) {
      if (options.useFrame && this.downloadCheckProtocol(url)) {
        SaveFrom_Utils.initFrameDownloadListener();
        var src = this.getMatchFirst(url, /(^https?:\/\/[^\/]+)/);

        if(src == location.protocol + '//' + location.host) {
          var a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          setTimeout(function() {
            mono.trigger(a, 'click', {
              cancelable: true
            });
            setTimeout(function(){
              a.parentNode.removeChild(a);
            }, 100);
          });
        }
        else {
          var params = {url: url, filename: filename};
          params = encodeURIComponent(JSON.stringify(params));

          src += '/404?#' + this.downloadParam + '=' + params;

          var f = document.createElement('iframe');
          f.src = src;
          f.classList.add('sf-dl-frame');
          f.style.display = 'none';

          document.body.appendChild(f);
        }

        return true;
      }

      return false;
    }

    var params = requestOptions || {};
    params.url = url;
    params.filename = filename;

    var request = {
      action: 'downloadFile',
      options: params
    };

    callback = callback || undefined;

    mono.sendMessage(request, callback);
    return true;
  },

  downloadList: {
    showDownloadWarningPopup: function(onContinue, type) {
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', type: type}, function(icon) {
        template.icon.style.backgroundImage = 'url(' + icon + ')';
      });

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: mono.global.language.warningPopupTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.warningPopupDesc+' ',
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            },
            append: mono.create('a', {
              href: (mono.global.language.lang === 'ru' || mono.global.language.lang === 'uk')?'http://vk.com/page-55689929_49003549':'http://vk.com/page-55689929_49004259',
              text: mono.global.language.readMore,
              target: '_blank',
              style: {
                color: '#4A90E2'
              }
            })
          }),
          mono.create('p', {
            style: {
              marginBottom: '13px'
            },
            append: [
              mono.create('label', {
                style: {
                  color: '#868686',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '19px'
                },
                append: [
                  mono.create('input', {
                    type: 'checkbox',
                    style: {
                      cssFloat: 'left',
                      marginLeft: '0px'
                    },
                    on: ['click', function() {
                      mono.sendMessage({action: 'hideDownloadWarning', set: this.checked?1:0});
                    }]
                  }),
                  mono.global.language.noWarning
                ]
              })
            ]
          })
        ]
      });

      var cancelBtn = undefined;
      var continueBtn = undefined;
      mono.create(template.buttonContainer, {
        append: [
          cancelBtn = mono.create('button', {
            text: mono.global.language.cancel,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '4px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          }),
          continueBtn = mono.create('button', {
            text: mono.global.language.continue,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      cancelBtn.addEventListener('click', function(e) {
        var popup = template.body.parentNode;
        mono.trigger(popup.lastChild, 'click');
      });

      continueBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        onContinue();
        mono.trigger(cancelBtn, 'click');
      });

      SaveFrom_Utils.popupDiv(template.body, 'dl_warning_box_popup');
    },
    startChromeDownloadList: function(options, hideDialog) {
      var folderName = options.folderName;
      var linkList = options.list;
      var dataType = options.type;

      if (folderName) {
        folderName += '/';
      }

      var itemIndex = 0;
      var pause = false;
      var timeout = 500;

      var focusEl = document.body;

      focusEl.focus();

      if (!hideDialog) {
        focusEl.onblur = function () {
          pause = true;
        };
      }

      var nextOneFile = function() {
        var item = linkList[itemIndex];
        itemIndex++;

        if (item === undefined) {
          return;
        }

        if (mono.global.preference.downloads) {
          SaveFrom_Utils.download(folderName+item.filename, item.url);
        } else {
          mono.trigger(mono.create('a', {
            download: item.filename,
            href: item.url,
            on: ['click', function(e) {
              SaveFrom_Utils.downloadOnClick(e, null, {
                useFrame: true
              });
            }]
          }), 'click', {
            cancelable: true
          });
        }

        if (pause) {
          SaveFrom_Utils.downloadList.showDownloadWarningPopup(function() {
            pause = false;
            focusEl.focus();
            nextOneFile();
          }, dataType);
        } else {
          if (itemIndex > 5 && timeout) {
            timeout = undefined;
            focusEl.onblur = undefined;
            pause = false;
            if (mono.global.preference.downloads) {
              mono.sendMessage({action: 'downloadList', fileList: linkList.slice(itemIndex), path: folderName});
              return;
            }
          }

          setTimeout(function() {
            nextOneFile();
          }, timeout);
        }
      };

      nextOneFile();
    },
    startFfDownloadList: function(linkList, folderName) {
      mono.sendMessage({action: 'getPath', folder: folderName}, function (path) {
        mono.sendMessage({action: 'downloadList', fileList: linkList, path: path}, undefined, "service");
      }, "service");
    },
    startDownload: function(options) {
      options.list.forEach(function(item) {
        item.filename = mono.fileName.modify(item.filename);
      });

      options.folderName =  mono.fileName.modify(options.folderName);

      if (mono.isFF) {
        return SaveFrom_Utils.downloadList.startFfDownloadList(options.list, options.folderName);
      }

      if (mono.isChrome || mono.isGM) {
        return mono.sendMessage({action: 'hideDownloadWarning'}, function(state) {
          SaveFrom_Utils.downloadList.startChromeDownloadList(options, state);
        });
      }
    },
    showBeforeDownloadPopup: function(list, options) {
      options.list = list;
      var type = options.type;
      var folderName = options.folderName;
      var onContinue = options.onContinue || SaveFrom_Utils.downloadList.startDownload;
      var onShowList = options.onShowList || SaveFrom_Utils.playlist.popupFilelist;
      var count = options.count || list.length;
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', color: '#00CCFF', type: type}, function(icon) {
        template.icon.style.backgroundImage = 'url('+icon+')';
      });

      var showListLink = [];
      if (onShowList) {
        showListLink = [' (',mono.create('a', {href: '#', text: mono.global.language.vkListOfLinks.toLowerCase()}),')'];
        showListLink[1].addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          onShowList(options.list);
          mono.trigger(cancelBtn, 'click');
        });
      }

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: folderName || mono.global.language.playlistTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.vkFoundFiles.replace('%d', count),
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            },
            append: showListLink
          }),
          mono.create('p', {
            text: mono.global.language.beforeDownloadPopupWarn,
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          })
        ]
      });

      var cancelBtn = undefined;
      var dlBtn = undefined;
      mono.create(template.buttonContainer, {
        append: [
          cancelBtn = mono.create('button', {
            text: mono.global.language.cancel,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '4px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          }),
          dlBtn = mono.create('button', {
            text: mono.global.language.continue,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      cancelBtn.addEventListener('click', function(e) {
        var popup = template.body.parentNode;
        mono.trigger(popup.lastChild, 'click');
      });

      dlBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        onContinue(options);
        mono.trigger(cancelBtn, 'click');
      });

      SaveFrom_Utils.popupDiv(template.body, 'dl_confirm_box_popup');
    }
  },


  downloadCheckProtocol: function(url) {
    if(location.protocol == 'http:') {
      return true;
    }

    if(!url) {
      return false;
    }

    url = url.toLowerCase();

    if(location.protocol == url.substr(0, location.protocol.length)) {
      return true;
    }

    return false;
  },


  downloadLink: function(a, callback, options)
  {
    if(!a.href)
      return false;

    var filename = a.getAttribute('download');

    return this.download(filename, a.href, null, callback, options);
  },


  downloadOnClick: function(event, callback, options)
  {
    options = options || {};
    var _this = SaveFrom_Utils;

    var node = options.el || event.target;
    if(node.tagName !== 'A') {
      node = node.parentNode;
    }

    if ( !mono.global.preference.downloads &&
      !(mono.global.preference.iframeDownload && options.useFrame && node.href && _this.downloadCheckProtocol(node.href)) ) {
      return;
    }

    if(event.button === 2) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    _this.downloadLink(node, callback, options);
  },

  getQueryString: function(query, key_prefix, key_suffix)
  {
    if(!query || typeof(query) != 'object')
      return '';

    if(key_prefix === undefined)
      key_prefix = '';

    if(key_suffix === undefined)
      key_suffix = '';

    var str = '';
    for(var key in query)
    {
      if(str.length)
        str += '&';

      if(query[key] instanceof Object)
      {
        if(!key_prefix)
          key_prefix = '';

        if(!key_suffix)
          key_suffix = '';

        str += SaveFrom_Utils.getQueryString(query[key], key_prefix + key + "[", "]" + key_suffix);
      }
      else
        str += key_prefix + escape(key) + key_suffix + '=' + escape(query[key]);
    }

    return str;
  },


  md5: function(str)
  {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: md5('Kevin van Zonneveld');
    // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
    var xl;

    var rotateLeft = function (lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    };

    var addUnsigned = function (lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    };

    var _F = function (x, y, z) {
      return (x & y) | ((~x) & z);
    };
    var _G = function (x, y, z) {
      return (x & z) | (y & (~z));
    };
    var _H = function (x, y, z) {
      return (x ^ y ^ z);
    };
    var _I = function (x, y, z) {
      return (y ^ (x | (~z)));
    };

    var _FF = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _GG = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _HH = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _II = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var convertToWordArray = function (str) {
      var lWordCount;
      var lMessageLength = str.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = new Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    };

    var wordToHex = function (lValue) {
      var wordToHexValue = "",
        wordToHexValue_temp = "",
        lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = "0" + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    };

    var x = [],
      k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
      S12 = 12,
      S13 = 17,
      S14 = 22,
      S21 = 5,
      S22 = 9,
      S23 = 14,
      S24 = 20,
      S31 = 4,
      S32 = 11,
      S33 = 16,
      S34 = 23,
      S41 = 6,
      S42 = 10,
      S43 = 15,
      S44 = 21;

    //str = this.utf8_encode(str);
    x = convertToWordArray(str);
    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;

    xl = x.length;
    for (k = 0; k < xl; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

    return temp.toLowerCase();
  },


  decodeUnicodeEscapeSequence: function(text)
  {
    return text.replace(/\\u([0-9a-f]{4})/g, function(s, m){
      m = parseInt(m, 16);
      if(!isNaN(m))
      {
        return String.fromCharCode(m);
      }
    });
  },


  getFileExtension: function(str, def)
  {
    var ext = this.getMatchFirst(str, /\.([a-z0-9]{3,4})(\?|$)/i);
    if(ext)
      return ext.toLowerCase();

    return (def ? def : '');
  },


  getFileName: function(url)
  {
    var filename = this.getMatchFirst(url, /\/([^\?#\/]+\.[a-z\d]{2,6})(?:\?|#|$)/i);
    if(!filename)
      return filename;

    return mono.fileName.modify(filename);
  },


  getTopLevelDomain: function(domain)
  {
    if(!domain)
      return '';

    if(!domain.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/))
      return domain;

    var a = domain.split('.');
    var l = a.length;

    if(l == 2)
      return domain;

    return (a[l - 2] + '.' + a[l - 1]);
  },


  dateToObj: function(ts, leadingZero)
  {
    var d = (ts === null || ts === undefined) ? new Date() : new Date(ts);

    if(leadingZero === undefined)
      leadingZero = true;

    var res = {
      year: d.getFullYear(),
      month: (d.getMonth() + 1),
      day: d.getDate(),
      hour: d.getHours(),
      min: d.getMinutes(),
      sec: d.getSeconds()
    };

    if(leadingZero)
    {
      for(var i in res)
      {
        if(res[i].toString().length == 1)
          res[i] = '0' + res[i];
      }
    }

    return res;
  },


  utf8Encode: function(str)
  {
    str = str.replace(/\r\n/g,"\n");
    var res = "";

    for (var n = 0; n < str.length; n++)
    {
      var c = str.charCodeAt(n);

      if (c < 128)
        res += String.fromCharCode(c);
      else if((c > 127) && (c < 2048))
      {
        res += String.fromCharCode((c >> 6) | 192);
        res += String.fromCharCode((c & 63) | 128);
      }
      else
      {
        res += String.fromCharCode((c >> 12) | 224);
        res += String.fromCharCode(((c >> 6) & 63) | 128);
        res += String.fromCharCode((c & 63) | 128);
      }

    }

    return res;
  },

  sizeHuman: function(size, round)
  {
    if(round == undefined || round == null)
      round = 2;

    var s = size, count = 0, sign = '', unite_spec = [
      mono.global.language.vkFileSizeByte,
      mono.global.language.vkFileSizeKByte,
      mono.global.language.vkFileSizeMByte,
      mono.global.language.vkFileSizeGByte,
      mono.global.language.vkFileSizeTByte
    ];

    if(s < 0)
    {
      sign = '-';
      s = Math.abs(s);
    }

    while(s >= 1000)
    {
      count++;
      s /= 1024;
    }

    if(round >= 0)
    {
      var m = round * 10;
      s = Math.round(s * m) / m;
    }

    if(count < unite_spec.length)
      return sign + s + ' ' + unite_spec[count];

    return size;
  },

  secondsToDuration: function(seconds)
  {
    if(!seconds || isNaN(seconds))
      return '';

    function zfill(time)
    {
      if(time < 10)
        return '0' + time;

      return time.toString();
    }

    var hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    var minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if(hours > 0)
      return hours + ":" + zfill(minutes) + ":" + zfill(seconds);

    return minutes + ":" + zfill(seconds);
  },

  svg: {
    icon: {
      download: 'M 4,0 4,8 0,8 8,16 16,8 12,8 12,0 4,0 z',
      info: 'M 8,1.55 C 11.6,1.55 14.4,4.44 14.4,8 14.4,11.6 11.6,14.4 8,14.4 4.44,14.4 1.55,11.6 1.55,8 1.55,4.44 4.44,1.55 8,1.55 M 8,0 C 3.58,0 0,3.58 0,8 0,12.4 3.58,16 8,16 12.4,16 16,12.4 16,8 16,3.58 12.4,0 8,0 L 8,0 z M 9.16,12.3 H 6.92 V 7.01 H 9.16 V 12.3 z M 8.04,5.91 C 7.36,5.91 6.81,5.36 6.81,4.68 6.81,4 7.36,3.45 8.04,3.45 8.72,3.45 9.27,4 9.27,4.68 9.27,5.36 8.72,5.91 8.04,5.91 z',
      noSound: 'M 11.4,5.05 13,6.65 14.6,5.05 16,6.35 14.4,7.95 16,9.55 14.6,11 13,9.35 11.4,11 10,9.55 11.6,7.95 10,6.35 z M 8,1.75 8,14.3 4,10.5 l -4,0 0,-4.75 4,0 z'
    },

    cache: {},

    getSrc: function(icon, color)
    {
      if(!this.icon[icon])
        return '';

      if(!this.cache[icon])
        this.cache[icon] = {};

      if(!this.cache[icon][color])
      {
        this.cache[icon][color] = btoa(
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="16" height="16" viewBox="0 0 16 16" id="svg2" xml:space="preserve">' +
            '<path d="' + this.icon[icon] + '" fill="' + color + '" /></svg>'
        );
      }

      if(this.cache[icon][color])
        return 'data:image/svg+xml;base64,' + this.cache[icon][color];

      return '';
    }
  },


  appendDownloadInfo: function(parent, color, boxStyle, btnStyle)
  {
    if(!color)
      color = '#a0a0a0';

    var info = document.createElement('span');
    info.appendChild(document.createTextNode(mono.global.language.downloadTitle));
    this.setStyle(info, {
      display: 'inline-block',
      position: 'relative',
      border: '1px solid ' + color,
      borderRadius: '5px',
      fontSize: '13px',
      lineHeight: '17px',
      padding: '2px 19px 2px 5px',
      marginTop: '5px',
      opacity: 0.9
    });

    if(boxStyle)
      this.setStyle(info, boxStyle);

    var close = document.createElement('span');
    close.textContent = String.fromCharCode(215);
    this.setStyle(close, {
      color: color,
      width: '14px',
      height: '14px',
      fontSize: '14px',
      fontWeight: 'bold',
      lineHeight: '14px',
      position: 'absolute',
      top: 0,
      right: 0,
      overflow: 'hidden',
      cursor: 'pointer'
    });

    if(btnStyle)
      this.setStyle(close, btnStyle);

    close.addEventListener('click', function(){
      info.parentNode.removeChild(info);
      mono.sendMessage({action: 'updateOption', key: 'moduleShowDownloadInfo', value: 0});
    }, false);

    info.appendChild(close);
    parent.appendChild(info);
  },


  appendFileSizeIcon: function(link, iconStyle, textStyle, error, noBrackets, container)
  {
    var iconColor = '#333333';
    if(error)
      iconColor = '#ff0000';
    else if(iconStyle && iconStyle.color)
      iconColor = iconStyle.color;

    var s = document.createElement('img');
    s.src = SaveFrom_Utils.svg.getSrc('info', iconColor);
    s.title = mono.global.language[error ? 'getFileSizeFailTitle' : 'getFileSizeTitle'];

    var defIconStyle = {
      width: '14px',
      height: '14px',
      marginLeft: '3px',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-1px',
      cursor: 'pointer'
    };

    var defTextStyle = {
      fontSize: '75%',
      fontWeight: 'normal',
      marginLeft: '3px',
      whiteSpace: 'nowrap'
    };

    var _this = this;

    this.setStyle(s, defIconStyle);
    if(iconStyle && typeof(iconStyle) == 'object')
      this.setStyle(s, iconStyle);

    if (container) {
      container.appendChild(s);
    } else
    if(link.nextSibling == null) {
      link.parentNode.appendChild(s);
    } else
    {
      link.parentNode.insertBefore(s, link.nextSibling);
    }

    s.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();

      var node = document.createElement('span');
      node.textContent = '...';
      _this.setStyle(node, defTextStyle);
      if(textStyle && typeof(textStyle) == 'object')
        _this.setStyle(node, textStyle);

      s.parentNode.replaceChild(node, s);

      var request = {
        action: 'getFileSize',
        url: link.href
      };

      mono.sendMessage(request, function(response){
        if(response.fileSize == 0)
        {
          node.parentNode.removeChild(node);
          _this.appendFileSizeIcon(link, iconStyle, textStyle, true, noBrackets, container);
        }
        else
        {
          if(response.fileType.search(/^audio\//i) > -1)
          {
            var seconds = link.getAttribute('data-savefrom-helper-duration');
            if(seconds)
            {
              seconds = parseInt(seconds);
              if(!isNaN(seconds))
              {
                var size = _this.sizeHuman(response.fileSize, 2);
                var bitrate = Math.floor((response.fileSize / seconds) / 125) + ' ' +
                  mono.global.language.kbps;

                if (noBrackets) {
                  node.textContent = size + ' ~ ' + bitrate;
                } else {
                  node.textContent = '(' + size + ' ~ ' + bitrate + ')';
                }
                return;
              }
            }
          }

          if (noBrackets) {
            node.textContent = _this.sizeHuman(response.fileSize, 2);
          } else {
            node.textContent = '(' + _this.sizeHuman(response.fileSize, 2) + ')';
          }
          node.title = response.fileType ? response.fileType : '';
        }
      });
    }, false);

    return s;
  },

  appendNoSoundIcon: function(link, iconStyle)
  {
    var noSoundIconColor = '#ff0000';
    if(iconStyle && iconStyle.color)
      noSoundIconColor = iconStyle.color;
    var s = document.createElement('img');
    s.src = SaveFrom_Utils.svg.getSrc('noSound', noSoundIconColor);
    s.title = mono.global.language.withoutAudio;

    var defIconStyle = {
      width: '14px',
      height: '14px',
      marginLeft: '3px',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-1px',
      cursor: 'pointer'
    };
    SaveFrom_Utils.setStyle(s, defIconStyle);
    if(iconStyle && typeof(iconStyle) == 'object')
      SaveFrom_Utils.setStyle(s, iconStyle);

    if(link.nextSibling == null) {
      if (link.parentNode === null) {
        link.appendChild(s);
      } else {
        link.parentNode.appendChild(s);
      }
    } else
    {
      link.parentNode.insertBefore(s, link.nextSibling);
    }
  },

  video: {
    dataAttr: 'data-savefrom-video-visible',

    yt: {
      inited: false,

      show3D: false,
      showMP4NoAudio: false,

      showFormat: {
        'FLV': true,
        'MP4': true,
        'WebM': false,
        '3GP': false,
        'Audio AAC': false,
        'Audio Vorbis': false,
        'Audio Opus': false
      },

      format: {
        'FLV': {
          '5': {quality: '240'},
          '6': {quality: '270'},
          '34': {quality: '360'},
          '35': {quality: '480'}
        },

        'MP4': {
          '18': {quality: '360'},
          '22': {quality: '720'},
          '37': {quality: '1080'},
          '38': {quality: '8K'},
          '59': {quality: '480'},
          '78': {quality: '480'},
          '82': {quality: '360', '3d': true},
          '83': {quality: '240', '3d': true},
          '84': {quality: '720', '3d': true},
          '85': {quality: '1080', '3d': true},
          '160': {quality: '144', noAudio: true},
          '133': {quality: '240', noAudio: true},
          '134': {quality: '360', noAudio: true},
          '135': {quality: '480', noAudio: true},
          '136': {quality: '720', noAudio: true},
          '137': {quality: '1080', noAudio: true},
          '264': {quality: '1440', noAudio: true},
          '138': {quality: '8K', noAudio: true},
          '298': {quality: '720', noAudio: true, sFps: true},
          '299': {quality: '1080', noAudio: true, sFps: true},
          '266': {quality: '4K', noAudio: true}
        },

        'WebM': {
          '43': {quality: '360'},
          '44': {quality: '480'},
          '45': {quality: '720'},
          '46': {quality: '1080'},
          '167': {quality: '360', noAudio: true},
          '168': {quality: '480', noAudio: true},
          '169': {quality: '720', noAudio: true},
          '170': {quality: '1080', noAudio: true},
          '218': {quality: '480', noAudio: true},
          '219': {quality: '480', noAudio: true},
          '242': {quality: '240', noAudio: true},
          '243': {quality: '360', noAudio: true},
          '244': {quality: '480 low', noAudio: true},
          '245': {quality: '480 med', noAudio: true},
          '246': {quality: '480 high', noAudio: true},
          '247': {quality: '720', noAudio: true},
          '248': {quality: '1080', noAudio: true},
          '271': {quality: '1440', noAudio: true},
          '272': {quality: '8K', noAudio: true},
          '278': {quality: '144', noAudio: true},
          '100': {quality: '360', '3d': true},
          '101': {quality: '480', '3d': true},
          '102': {quality: '720', '3d': true},
          '302': {quality: '720', noAudio: true, sFps: true},
          '303': {quality: '1080', noAudio: true, sFps: true},
          '308': {quality: '1440', noAudio: true, sFps: true},
          '313': {quality: '4K', noAudio: true},
          '315': {quality: '4K', noAudio: true, sFps: true}
        },

        '3GP': {
          '17': {quality: '144'},
          '36': {quality: '240'}
        },

        'Audio AAC': {
          '139': {quality: '48', ext: 'aac', noVideo: true},
          '140': {quality: '128', ext: 'aac', noVideo: true},
          '141': {quality: '256', ext: 'aac', noVideo: true},
          '256': {quality: '192', ext: 'aac', noVideo: true},
          '258': {quality: '384', ext: 'aac', noVideo: true}
        },

        'Audio Vorbis': {
          '171': {quality: '128', ext: 'webm', noVideo: true},
          '172': {quality: '192', ext: 'webm', noVideo: true}
        },

        'Audio Opus': {
          '249': {quality: '48', ext: 'opus', noVideo: true},
          '250': {quality: '128', ext: 'opus', noVideo: true},
          '251': {quality: '256', ext: 'opus', noVideo: true}
        }
      },

      excludeItag: {
        // hide left itag if exist right!
        // MP4
        '134': ['18'], // 360
        '136': ['22'],       // 720
        '137': ['37'],       // 1080
        '138': ['38'],       // 8K
        // WebM
        '243': ['167', '43'],// 360
        '167': ['43'], // 360

        '244': ['44'],        // 480 low
        '245': ['44'],        // 480 med
        '246': ['44'],        // 480 high

        '168': ['218', '219', '44'], // 480
        '218': ['219', '44'], // 480
        '219': ['44'],        // 480

        '247': ['45', '169'], // 720
        '169': ['45'],        // 720

        '248': ['170', '46'], // 1080,
        '170': ['46'],        // 1080,
        // Opus
        '249': ['139'],
        '250': ['140'],
        '251': ['141']
      },


      init: function()
      {
        if ( SaveFrom_Utils.video.yt.inited ) {
          return;
        }

        ['Audio AAC', 'Audio Vorbis', 'Audio Opus'].forEach(function(item) {
          var formatType = SaveFrom_Utils.video.yt.format[item];
          for (var qualityValue in formatType) {
            formatType[qualityValue].quality += ' ' + mono.global.language.kbps;
          }
        });

        SaveFrom_Utils.video.yt.show3D = mono.global.preference.ytHide3D == '0';
        SaveFrom_Utils.video.yt.showMP4NoAudio = mono.global.preference.ytHideMP4NoAudio == '0';

        var show = false;
        var showAudio = false;
        for(var i in SaveFrom_Utils.video.yt.showFormat)
        {
          var prefName = 'ytHide' + i.replace(' ', '_');
          if (prefName === 'ytHideAudio_AAC') {
            prefName = 'ytHideAudio_MP4';
          }
          var value = mono.global.preference[prefName] == '0';
          if (i === 'Audio AAC') {
            showAudio = value;
          }
          SaveFrom_Utils.video.yt.showFormat[i] = value;
          if(value) {
            show = true;
          }
        }

        SaveFrom_Utils.video.yt.showFormat['Audio Vorbis'] = showAudio;
        SaveFrom_Utils.video.yt.showFormat['Audio Opus'] = showAudio;

        if(!show) {
          SaveFrom_Utils.video.yt.showFormat.FLV = true;
        }

        SaveFrom_Utils.video.yt.inited = true;
      },


      filterLinks: function(links)
      {
        for(var i in this.excludeItag)
        {
          if(links[i] && this.excludeItag[i].length > 0)
          {
            for(var j = 0; j < this.excludeItag[i].length; j++)
            {
              var itag = this.excludeItag[i][j];
              if(links[itag])
              {
                delete links[i];
                break;
              }
            }
          }
        }
      },


      show: function(links, parent, showDownloadInfo, style, videoTitle)
      {
        SaveFrom_Utils.video.yt.filterLinks(links);
        style = style || {};

        var content = document.createElement('div');
        SaveFrom_Utils.setStyle(content, {
          display: 'inline-block',
          margin: '0 auto'
        });
        parent.appendChild(content);

        var box = document.createElement('div');
        SaveFrom_Utils.setStyle(box, {
          display: 'inline-block',
          padding: '0 90px 0 0',
          position: 'relative'
        });
        content.appendChild(box);

        var tbl = document.createElement('table');
        SaveFrom_Utils.setStyle(tbl, {
          emptyCells: 'show',
          borderCollapse: 'collapse',
          margin: '0 auto',
          padding: '0',
          width: 'auto'
        });
        box.appendChild(tbl);

        var hidden = false;

        for(var i in SaveFrom_Utils.video.yt.format)
        {
          if(SaveFrom_Utils.video.yt.append(links, i,
            SaveFrom_Utils.video.yt.format[i], tbl, style, videoTitle))
          {
            hidden = true;
          }
        }

        for(var i in links)
        {
          if (i === 'ummy' || i === 'ummyAudio' || i === 'meta') {
            continue;
          }
          if(SaveFrom_Utils.video.yt.append(links, '', null, tbl, style, videoTitle))
          {
            hidden = true;
          }

          break;
        }

        if (!tbl.firstChild) {
          parent.textContent = mono.global.language.noLinksFound;
          return;
        }

        if(!hidden)
          return;

        var more = document.createElement('span');
        more.textContent = mono.global.language.more + ' ' + String.fromCharCode(187);
        SaveFrom_Utils.setStyle(more, {
          color: '#555',
          border: '1px solid #a0a0a0',
          borderRadius: '3px',
          display: 'block',
          fontFamily: 'Arial',
          fontSize: '15px',
          lineHeight: '17px',
          padding: '1px 5px',
          position: 'absolute',
          bottom: '3px',
          right: '0',
          cursor: 'pointer'
        });

        if(style.btn && typeof(style.btn) == 'object')
          SaveFrom_Utils.setStyle(more, style.btn);

        box.appendChild(more);

        more.addEventListener('click', function(event){
          event.preventDefault();
          event.stopPropagation();

          var e = parent.querySelectorAll('*[' + SaveFrom_Utils.video.dataAttr + ']');
          for(var i = 0; i < e.length; i++)
          {
            var visible = e[i].getAttribute(SaveFrom_Utils.video.dataAttr);
            var display = 'none', symbol = String.fromCharCode(187);
            if(visible == '0')
            {
              visible = '1';
              display = '';
              symbol = String.fromCharCode(171);
            }
            else
              visible = '0';

            e[i].style.display = display;
            e[i].setAttribute(SaveFrom_Utils.video.dataAttr, visible);
            this.textContent = mono.global.language.more + ' ' + symbol;
          }

          return false;
        }, false);


        if(showDownloadInfo === 1)
        {
          var color = '#a0a0a0', a = tbl.querySelector('td a');

          content.appendChild(document.createElement('br'));
          SaveFrom_Utils.appendDownloadInfo(content, color, null, {
            width: '16px',
            height: '16px',
            fontSize: '16px',
            lineHeight: '16px'
          });
        }
      },


      append: function(links, title, format, parent, style, videoTitle)
      {
        var hidden = false;

        var aStyle = {
          whiteSpace: 'nowrap'
        };

        var sStyle = {
          fontSize: '75%',
          fontWeight: 'normal',
          marginLeft: '3px',
          whiteSpace: 'nowrap'
        };

        var tr = document.createElement('tr');

        var td = document.createElement('td');
        td.appendChild(document.createTextNode(title ? title : '???'));

        if(!title || !SaveFrom_Utils.video.yt.showFormat[title])
        {
          tr.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
          tr.style.display = 'none';
          hidden = true;
        }

        SaveFrom_Utils.setStyle(td, {
          border: 'none',
          padding: '3px 15px 3px 0',
          textAlign: 'left',
          verticalAlign: 'middle'
        });

        tr.appendChild(td);

        td = document.createElement('td');
        SaveFrom_Utils.setStyle(td, {
          border: 'none',
          padding: '3px 0',
          textAlign: 'left',
          verticalAlign: 'middle',
          lineHeight: '17px'
        });
        tr.appendChild(td);

        var meta = links.meta || {};

        var sep = false;
        if(format)
        {
          for(var i in format)
          {
            if(links[i])
            {
              var quality = format[i].quality;
              if(sep)
              {
                td.lastChild.style.marginRight = '15px';
                td.appendChild(document.createTextNode(' '));
              }

              var span = document.createElement('span');
              span.style.whiteSpace = 'nowrap';

              var a = document.createElement('a');
              a.href = links[i];
              a.title = mono.global.language.downloadTitle;

              if (meta[i]) {
                if (meta[i].quality) {
                  quality = meta[i].quality;
                }

                if (format[i].sFps) {
                  quality += ' ' + (meta[i].fps || 60);
                }
              }

              if (format[i]['3d']) {
                a.textContent = '3D';
              } else {
                a.textContent = quality;
              }
              if(videoTitle)
              {
                var ext = format[i]['ext'];
                if(!ext)
                  ext = title.toLowerCase();

                a.setAttribute('download', mono.fileName.modify(videoTitle + '.' + ext) );

                if(format[i].noVideo || format[i].noAudio)
                {
                  a.addEventListener('click', function(event){
                    SaveFrom_Utils.downloadOnClick(event, null, {
                      useFrame: true
                    });
                  }, false);
                }
              }
              SaveFrom_Utils.setStyle(a, aStyle);
              if(style.link && typeof(style.link) == 'object')
                SaveFrom_Utils.setStyle(a, style.link);

              span.appendChild(a);
              SaveFrom_Utils.appendFileSizeIcon(a, style.fsIcon, style.fsText);

              if(format[i]['3d'])
              {
                if(!SaveFrom_Utils.video.yt.show3D)
                {
                  hidden = true;
                  span.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
                  span.style.display = 'none';
                }

                var s = document.createElement('span');
                s.textContent = quality;
                SaveFrom_Utils.setStyle(s, sStyle);
                if(style.text && typeof(style.text) == 'object')
                  SaveFrom_Utils.setStyle(s, style.text);

                a.appendChild(s);
              }

              if(format[i]['noAudio'])
              {
                if(!SaveFrom_Utils.video.yt.showMP4NoAudio)
                {
                  hidden = true;
                  span.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
                  span.style.display = 'none';
                }

                SaveFrom_Utils.appendNoSoundIcon(a, style ? style.noSoundIcon : false);
              }

              td.appendChild(span);

              sep = true;

              delete links[i];
            }
          }
        }
        else
        {
          for(var i in links)
          {
            if(sep)
            {
              td.lastChild.style.marginRight = '15px';
              td.appendChild(document.createTextNode(' '));
            }

            var span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';

            var a = document.createElement('a');
            a.href = links[i];
            a.title = mono.global.language.downloadTitle;
            a.textContent = i;
            SaveFrom_Utils.setStyle(a, aStyle);
            if(style.link && typeof(style.link) == 'object')
              SaveFrom_Utils.setStyle(a, style.link);

            span.appendChild(a);
            SaveFrom_Utils.appendFileSizeIcon(a, style.fsIcon, style.fsText);
            td.appendChild(span);

            sep = true;

            delete links[i];
          }
        }

        if (sep === false) {
          return;
        }
        parent.appendChild(tr);

        return hidden;
      }
    }
  }, // video


  playlist: {
    btnStyle: {
      display: 'block',
      fontWeight: 'bold',
      border: 'none',
      textDecoration: 'underline'
    },


    getFilelistHtml: function(links)
    {
      if(!links || links.length == 0)
        return;

      var rows = 0;
      var list = '';

      for(var i = 0; i < links.length; i++)
      {
        if(links[i].url)
        {
          list += links[i].url + '\r\n';
          rows++;
        }
      }

      if(list)
      {
        if(rows < 5) {
          rows = 5;
        } else
        if(rows > 14) {
          rows = 14;
        }

        return mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('p', {
              text: mono.global.language.filelistTitle,
              style: {
                color: '#0D0D0D',
                fontSize: '20px',
                marginBottom: '11px',
                marginTop: '5px'
              }
            }),
            mono.create('p', {
              style: {
                marginBottom: '11px'
              },
              append: mono.parseTemplate(mono.global.language.filelistInstruction)
            }),
            mono.create('p', {
              text: mono.global.language.vkFoundFiles.replace('%d', links.length),
              style: {
                color: '#000',
                marginBottom: '11px'
              },
              append: mono.create('a', {
                text: mono.global.language.playlist,
                href: '#',
                class: 'sf__playlist',
                style: {
                  display: 'none',
                  cssFloat: 'right'
                }
              })
            }),
            mono.create('textarea', {
              text: list,
              rows: rows,
              cols: 60,
              style: {
                width: '100%',
                whiteSpace: (mono.isFF || (mono.isGM && !mono.isTM && !mono.isVM)) ? 'normal' : 'nowrap'
              }
            }),
            (!mono.isChrome && !mono.isFF)? undefined : mono.create('button', {
              text: mono.global.language.copy,
              style: {
                height: '27px',
                backgroundColor: '#ffffff',
                border: '1px solid #9e9e9e',
                marginTop: '6px',
                paddingLeft: '10px',
                paddingRight: '10px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                cssFloat: 'right'
              },
              on: ['click', function(e) {
                var _this = this;
                _this.disabled = true;
                mono.sendMessage({action: 'addToClipboard', text: list});
                setTimeout(function() {
                  _this.disabled = false;
                }, 1000);
              }],
              append: mono.create('style', {
                text: '#savefrom_popup_box button:hover:not(:disabled){' +
                  'background-color: #597A9E !important;' +
                  'border-color: #597A9E !important;' +
                  'color: #fff;' +
                  '}' +
                  '#savefrom_popup_box button:active{' +
                  'opacity: 0.9;' +
                  '}'
              })
            })
          ]
        });
      }
    },


    popupFilelist: function(links, title, playlist, id)
    {
      var content = SaveFrom_Utils.playlist.getFilelistHtml(links);
      if(!content)
        return;

      var popup = SaveFrom_Utils.popupDiv(content, id);
      if(playlist)
      {
        var a = popup.querySelector('a.sf__playlist');
        if(a)
        {
          a.addEventListener('click', function(event){
            setTimeout(function(){
              SaveFrom_Utils.playlist.popupPlaylist(links, title, true, id);
            }, 100);
            event.preventDefault();
            return false;
          }, false);

          SaveFrom_Utils.setStyle(a, SaveFrom_Utils.playlist.btnStyle);
        }
      }
    },

    getInfoPopupTemplate: function() {
      var popupContainer = mono.create('div', {
        class: 'sf-infoPopupTemplate',
        style: {
          width: '400px',
          minHeight: '40px'
        }
      });

      var mediaIcon = mono.create('div', {
        style: {
          backgroundSize: '48px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          display: 'inline-block',
          width: '60px',
          height: '60px',
          cssFloat: 'left',
          marginTop: '16px',
          marginRight: '10px'
        }
      });

      var textContent = mono.create('div', {
        style: {
          display: 'inline-block',
          width: '330px'
        }
      });

      var buttonWrap = mono.create('div', {
        style: {
          textAlign: 'right'
        },
        append: mono.create('style', {
          text: '.sf-infoPopupTemplate a.sf-button {' +
            'padding: 1px 6px;' +
            'display: inline-block;' +
            'text-align: center;' +
            'height: 23px;' +
            'line-height: 23px;' +
            'text-decoration: none;' +
            '}' +
            '.sf-infoPopupTemplate button:hover,' +
            '.sf-infoPopupTemplate a.sf-button:hover{' +
            'background-color: #597A9E !important;' +
            'border-color: #597A9E !important;' +
            'color: #fff;' +
            '}'
        })
      });

      popupContainer.appendChild(mediaIcon);
      popupContainer.appendChild(textContent);
      popupContainer.appendChild(buttonWrap);
      return {
        icon: mediaIcon,
        buttonContainer: buttonWrap,
        textContainer: textContent,
        body: popupContainer
      }
    },

    getM3U: function(links)
    {
      var text = '#EXTM3U\r\n';

      for(var i = 0; i < links.length; i++)
      {
        if(!links[i].duration)
          links[i].duration = '-1';

        if(links[i].title || links[i].duration)
        {
          text += '#EXTINF:' + links[i].duration + ',' +
            links[i].title + '\r\n';
        }

        text += links[i].url + '\r\n';
      }

      return text;
    },


    getPlaylistHtml: function(links, fileTitle)
    {
      if(!links || links.length == 0)
        return;

      var links_len = links.length;

      var d = SaveFrom_Utils.dateToObj();
      var dateStr = d.year + '-' + d.month + '-' + d.day + ' ' +
        d.hour + '-' + d.min;

      // M3U
      var m3uList = SaveFrom_Utils.playlist.getM3U(links);
      m3uList = m3uList.replace(/\r\n/g, '\n');

      var m3uUrl;
      if (typeof URL !== 'undefined' && typeof Blob !== "undefined" && !mono.isSafari) {
        var m3uBlob = new Blob([m3uList], {encoding: "UTF-8", type: 'audio/x-mpegurl'});
        m3uUrl = URL.createObjectURL(m3uBlob);
      } else {
        var m3uUTF8 = SaveFrom_Utils.utf8Encode(m3uList);
        m3uUrl = 'data:audio/x-mpegurl;charset=utf-8;base64,' + encodeURIComponent(btoa(m3uUTF8))
      }

      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', color: '#00CCFF', type: 'playlist'}, function(icon) {
        template.icon.style.backgroundImage = 'url('+icon+')';
      });

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: fileTitle || mono.global.language.playlistTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.playlistInstruction,
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          }),
          mono.create('a', {
            text: mono.global.language.filelist + ' ('+links_len+')',
            href: '#',
            class: 'sf__playlist',
            style: {
              display: 'none',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          })
        ]
      });

      if(!fileTitle) {
        fileTitle = 'playlist';
      }
      fileTitle += ' ' + dateStr;

      mono.create(template.buttonContainer, {
        append: [
          mono.create('a', {
            text:  mono.global.language.download,
            href: m3uUrl,
            download: mono.fileName.modify(fileTitle + '.m3u'),
            class: 'sf-button',
            style: {
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      return template.body;
    },


    popupPlaylist: function(links, title, filelist, id)
    {
      var content = SaveFrom_Utils.playlist.getPlaylistHtml(links, title);
      if(!content)
        return;

      var popup = SaveFrom_Utils.popupDiv(content, id);
      if(filelist)
      {
        var a = popup.querySelector('a.sf__playlist');
        if(a)
        {
          a.addEventListener('click', function(event){
            setTimeout(function(){
              SaveFrom_Utils.playlist.popupFilelist(links, title, true, id);
            }, 100);
            event.preventDefault();
            return false;
          }, false);

          a.style.display = 'inline';
          a = null;
        }
      }
      var dl_links = popup.querySelectorAll('a[download]');
      for (var i = 0, el; el = dl_links[i]; i++) {
        el.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
      }
    }
  },

  popupCloseBtn: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAWUlEQVQ4y2NgGHHAH4j1sYjrQ+WIAvFA/B+I36MZpg8V+w9VQ9Al/5EwzDBkQ2AYr8uwaXiPQ0yfkKuwGUayIYQMI8kQqhlEFa9RLbCpFv1US5BUzSLDBAAARN9OlWGGF8kAAAAASUVORK5CYII=',

  popupDiv: function(content, id, maxWidth, maxHeight, onClose)
  {
    if(!id)
      id = 'savefrom_popup_box';

    if(!maxWidth)
      maxWidth = 580;

    if(!maxHeight)
      maxHeight = 520;

    var d = document.getElementById(id);
    if(d)
      d.parentNode.removeChild(d);

    d = document.createElement('div');
    d.id = id;

    SaveFrom_Utils.setStyle(d, {
      zIndex: '9999',
      display: 'block',
      cssFloat: 'none',
      position: 'fixed',
      margin: '0',
      padding: '0',
      visibility: 'hidden',
      color: '#000',
      background: '#fff',
      border: '3px solid #c0cad5',
      borderRadius: '7px',
      overflow: 'auto'
    });

    var cnt = document.createElement('div');
    SaveFrom_Utils.setStyle(cnt, {
      display: 'block',
      cssFloat: 'none',
      position: 'relative',
      overflow: 'auto',
      margin: '0',
      padding: '10px 15px'
    });
    if (typeof content === 'function') {
      content(cnt);
    } else {
      cnt.appendChild(content);
    }

    var btn = document.createElement('img');
    btn.src = SaveFrom_Utils.popupCloseBtn;
    btn.alt = 'x';
    btn.width = 18;
    btn.height = 18;
    SaveFrom_Utils.setStyle(btn, {
      position: 'absolute',
      top: '10px',
      right: '15px',
      opacity: '0.5',
      cursor: 'pointer'
    });

    mono.on(btn, 'mouseenter', function() {
      this.style.opacity = '0.9';
    });

    mono.on(btn, 'mouseleave', function(){
      this.style.opacity = '0.5';
    });

    btn.addEventListener('click', function(){
      if (d.parentNode) {
        d.parentNode.removeChild(d);
      }
      if (onClose) {
        onClose();
      }
      return false;
    }, false);

    cnt.appendChild(btn);
    d.appendChild(cnt);
    document.body.appendChild(d);

    if(d.offsetWidth > maxWidth)
      d.style.width = maxWidth + 'px';

    if(d.offsetHeight > maxHeight)
    {
      d.style.height = maxHeight + 'px';
      d.style.width = (maxWidth + 20) + 'px';
    }

    setTimeout(function() {
      var l = Math.floor((window.innerWidth - d.offsetWidth) / 2.0);
      var t = Math.floor((window.innerHeight - d.offsetHeight) / 2.0);
      if (t < 0) {
        t = 0;
      }
      if (location.host.indexOf('youtu') !== -1 && t < 50) {
        t = 50;
        d.style.height = (d.offsetHeight - t - 10) + 'px';
      }
      if (l < 0) {
        l = 0;
      }
      SaveFrom_Utils.setStyle(d, {
        top: t + 'px',
        left: l + 'px',
        visibility: 'visible'
      });
    });

    var onDocClose = function(event){
      var node = event.target;
      if(node !== d && !SaveFrom_Utils.isParent(node, d))
      {
        if(d.parentNode){
          d.parentNode.removeChild(d);
        }
        document.removeEventListener('click', onDocClose, false);
        if (onClose) {
          onClose();
        }
      }
    };

    setTimeout(function() {
      document.addEventListener('click', onDocClose, false);
    }, 100);

    d.addEventListener('close', function() {
      if(d.parentNode){
        d.parentNode.removeChild(d);
      }
      document.removeEventListener('click', onDocClose, false);
      if (onClose) {
        onClose();
      }
    });

    d.addEventListener('kill', function() {
      if(d.parentNode){
        d.parentNode.removeChild(d);
      }
      document.removeEventListener('click', onDocClose, false);
    });

    return d;
  },

  // row - used for hide tooltip on mouseout
  // because node can dissaper from DOM before mouseout raised
  showTooltip: function(node, text, row, style)
  {
    if(!node)
      return;

    var tooltip = document.querySelector('.savefrom-tooltip');
    if(!tooltip)
    {
      tooltip = document.createElement('div');
      tooltip.className = 'savefrom-tooltip';
      SaveFrom_Utils.setStyle(tooltip, {
        'position': 'absolute',
        'opacity': 0,
        'zIndex': -1
      });
      if (style) {
        SaveFrom_Utils.setStyle(tooltip, style);
      }
    }

    tooltip.textContent = text;

    if(tooltip.lastNode && tooltip.lastNode === node)
    {
      fixPosition();
      return;
    }

    if(tooltip.lastNode)
    {
      mono.off(tooltip.lastNode, 'mouseleave', hide);
      mono.off(tooltip.lastNode, 'mousemove', fixPosition);
      tooltip.lastRow && mono.off(tooltip.lastRow, 'mouseleave', hide);
    }

    tooltip.lastNode = node;
    row && (tooltip.lastRow = row);

    mono.on(node, 'mouseleave', hide);
    mono.on(node, 'mousemove', fixPosition, false);
    row && mono.on(row, 'mouseleave', hide);

    document.body.appendChild(tooltip);
    fixPosition();

    function fixPosition(e) {
      if (e !== undefined) {
        e.stopPropagation();
      }
      var p = SaveFrom_Utils.getPosition(node),
        s = SaveFrom_Utils.getSize(tooltip);

      if(p.top == 0 && p.left == 0)
        return;

      p.top = p.top - s.height - 10;
      p.left = p.left - s.width / 2 + SaveFrom_Utils.getSize(node).width / 2;

      p.left = Math.min(p.left, document.body.clientWidth + document.body.scrollLeft - s.width);
      if(p.top < document.body.scrollTop)
        p.top = p.top + s.height + SaveFrom_Utils.getSize(node).height + 20;

      p.top += 'px';
      p.left += 'px';

      // show
      p.zIndex = 9999;
      p.opacity = 1;

      SaveFrom_Utils.setStyle(tooltip, p);
    }

    function hide() {
      if(tooltip.parentNode)
        document.body.removeChild(tooltip);

      tooltip.lastNode = null;
      tooltip.lastRow = null;
      SaveFrom_Utils.setStyle(tooltip, {
        zIndex: -1,
        opacity: 0
      });
      mono.off(node, 'mouseleave', hide);
      mono.off(node, 'mousemove', fixPosition);
      row && mono.off(row, 'mouseleave', hide);
    }
  },


  embedDownloader: {
    dataAttr: 'data-savefrom-get-links',
    dataIdAttr: 'data-savefrom-container-id',
    containerClass: 'savefrom-links-container',
    linkClass: 'savefrom-link',
    panel: null,
    lastLink: null,
    style: null,

    hostings: {
      'youtube': {
        re: [
          /^https?:\/\/(?:[a-z]+\.)?youtube\.com\/(?:#!?\/)?watch\?.*v=([\w\-]+)/i,
          /^https?:\/\/(?:[a-z0-9]+\.)?youtube\.com\/(?:embed|v)\/([\w\-]+)/i,
          /^https?:\/\/(?:[a-z]+\.)?youtu\.be\/([\w\-]+)/i
        ],
        action: 'getYoutubeLinks',
        prepareLinks: function(links) {
          var ret = [];
          var sfUtilsYt = SaveFrom_Utils.video.yt;
          var format = sfUtilsYt.format;

          var meta = links.meta || {};

          for(var formatName in format)
          {
            for(var iTag in format[formatName])
            {
              var metaTag = meta[iTag] || {};
              if(links[iTag]) {
                var type = formatName;
                if(format[formatName][iTag].ext) {
                  type = format[formatName][iTag].ext;
                }

                var quality = format[formatName][iTag].quality;
                if (metaTag.quality) {
                  quality = metaTag.quality;
                }

                if (format[formatName][iTag].sFps) {
                  quality += ' ' + (metaTag.fps || 60);
                }

                if (format[formatName][iTag]['3d']) {
                  quality += ' (3d)';
                }

                ret.push({
                  name: formatName + ' ' + quality,
                  type: type,
                  url: links[iTag],
                  noSound: format[formatName][iTag].noAudio
                });
              }
            }
          }

          return ret;
        }
      },

      'vimeo': {
        re: [
          /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/(?:\w+\#)?(\d+)/i,
          /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
          /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/channels\/(?:[^\/]+)\/(\d+)$/i
        ],
        action: 'getVimeoLinks',
        prepareLinks: function(links) {
          return links.map(function(link) {
            var ext = link.ext;
            if(!ext)
            {
              ext = 'MP4';
              if(link.url.search(/\.flv($|\?)/i) != -1)
                ext = 'FLV';
            }

            link.name = link.name ? link.name : ext;
            link.type = link.type ? link.type : ext;
            link.ext = ext;

            return link;
          });
        }
      },

      'vk': {
        re: [
          /^https?:\/\/(?:[\w\-]+\.)?(?:vk\.com|vkontakte\.ru)\/(?:[^\/]+\/)*(?:[\w\-]+\?.*z=)?(video-?\d+_-?\d+\?list=[0-9a-z]+|video-?\d+_-?\d+)/i,
          /^https?:\/\/(?:[\w\-]+\.)?(?:vk\.com|vkontakte\.ru)\/video_ext\.php\?(.+)/i
        ],
        action: 'getVKLinks'
      },

      'dailymotion': {
        re: [
          /^http:\/\/dai\.ly\/([a-z0-9]+)_?/i,
          /^https?:\/\/(?:[\w]+\.)?dailymotion\.com(?:\/embed|\/swf)?\/video\/([a-z0-9]+)_?/i
        ],
        action: 'getDailymotionLinks'
      },

      'facebook': {
        re: [
          /^https?:\/\/(?:[\w]+\.)?facebook\.com(?:\/video)?\/video.php.*[?&]{1}v=([0-9]+).*/i,
          /^https?:\/\/(?:[\w]+\.)?facebook\.com\/.+\/videos(?:\/\w[^\/]+)?\/(\d+)/i
        ],
        action: 'getFacebookLinks'
      }
    },


    init: function(style)
    {
      this.style = style;

      if(this.panel) {
        SaveFrom_Utils.popupMenu.removePanel();
      }

      this.panel = null;
      this.lastLink = null;

      var links = document.querySelectorAll('a[' + this.dataAttr + ']'),
        i, l = links.length;

      for(i = 0; i < l; i++)
      {
        if(['savefrom.net', 'sf-addon.com'].indexOf(
          SaveFrom_Utils.getTopLevelDomain(links[i].hostname)) > -1)
        {
          links[i].removeEventListener('click', this.onClick, false);
          links[i].addEventListener('click', this.onClick, false);
        }
      }

      // hide menu on click outside them
      // process dinamically added links
      if (document.body) {
        document.body.removeEventListener('click', this.onBodyClick, true);
        document.body.addEventListener('click', this.onBodyClick, true);
      }
    },


    checkUrl: function(url) {
      for(var hosting in this.hostings) {
        var params = this.hostings[hosting];

        for(var i = 0, len = params.re.length; i < len; i++) {
          var match = url.match(params.re[i]);
          if(match) {
            return {
              hosting: hosting,
              action: params.action,
              extVideoId: match[1]
            };
          }
        }
      }

      return null;
    },

    reMapHosting: function(action) {
      var map = {
        'getYoutubeLinks': 'youtube',
        'getVimeoLinks': 'vimeo',
        'getDailymotionLinks': 'dailymotion',
        'getFacebookLinks': 'facebook'
      };

      return map[action];
    },


    onClick: function(event, a)
    {
      var _this = SaveFrom_Utils.embedDownloader;

      if(!a)
      {
        a = event.target;
        while(a.parentNode) {
          if(a.nodeName === 'A')
            break;
          a = a.parentNode;
        }

        if(!a)
          return;
      }

      var href = a.getAttribute('data-savefrom-get-links');
      if(!href)
        return;

      if(event.button !== 0 || event.ctrlKey || event.shiftKey)
        return;

      if(_this.lastLink === a && _this.panel && _this.panel.style.display != 'none')
      {
        _this.lastLink = null;
        _this.panel.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
        return;
      }

      _this.lastLink = a;
      var data = _this.checkUrl(href);
      if(!data)
        return;

      event.preventDefault();
      event.stopPropagation();

      var request = {
        action: data.action,
        extVideoId: data.extVideoId
      };

      _this.showLinks(mono.global.language.download + ' ...', null, a);

      mono.sendMessage(request, function(response) {
        var hosting = data.hosting;

        if(response.action != request.action)
        {
          hosting = _this.reMapHosting(response.action);
        }

        if(response.links)
          _this.showLinks(response.links, response.title, a, hosting, true);
        else
          _this.showLinks(mono.global.language.noLinksFound, null, a, undefined, true);
      });

      return false;
    },


    onBodyClick: function(event)
    {
      var _this = SaveFrom_Utils.embedDownloader;

      if(!_this.panel || _this.panel.style.display == 'none')
      {
        var node = event.target;
        while(node.parentNode) {
          if(node.tagName === 'A')
            break;
          node = node.parentNode;
        }

        // dinamic links
        if(node.nodeName === 'A' && node.hasAttribute(_this.dataAttr) &&
          ['savefrom.net', 'sf-addon.com'].indexOf(SaveFrom_Utils.getTopLevelDomain(node.hostname)) > -1)
        {
          return _this.onClick(event, node);
        }

        return;
      }

      node = event.target;
      while(node.parentNode) {
        if(node === _this.panel)
          return;
        node = node.parentNode;
      }

      _this.lastLink = null;
      _this.panel.style.display = 'none';
    },

    hidePanel: function()
    {
      if (this.panel) {
        this.panel.style.display = 'none';
      }
    },

    createMenu: function(links, title, a, hname, update) {
      var menuLinks = mono.global.language.noLinksFound;
      if (typeof links === 'string') {
        menuLinks = links;
      } else
      if (SaveFrom_Utils.popupMenu.prepareLinks[hname] !== undefined && links) {
        menuLinks = SaveFrom_Utils.popupMenu.prepareLinks[hname](links, title, SaveFrom_Utils);
      }
      var options = {
        links: menuLinks,
        button: a,
        popupId: undefined,
        showFileSize: true,
        containerClass: this.containerClass,
        linkClass: this.linkClass,
        style: {
          popup: (this.style)?this.style.container:undefined,
          item: (this.style)?this.style.link:undefined
        },
        isUpdate: update
      };
      if (update && this.panel) {
        SaveFrom_Utils.popupMenu.update(this.panel, options)
      } else {
        this.panel = SaveFrom_Utils.popupMenu.create(options);
      }
    },

    showLinks: function(links, title, a, hname, update)
    {
      var panel, id = a.getAttribute(this.dataIdAttr);
      if(id)
        panel = document.getElementById(id);

      if(!panel)
      {
        this.createMenu(links, title, a, hname, update);

        return;
      }
      else if(this.panel)
      {
        this.panel.style.display = 'none';
      }

      if(typeof(links) == 'string')
      {
        panel.textContent = links;
      }
      else if(!links || links.length == 0)
      {
        panel.textContent = mono.global.language.noLinksFound;
      }
      else
      {
        // append links
        if(hname && this.hostings[hname] && this.hostings[hname].prepareLinks)
          links = this.hostings[hname].prepareLinks(links);

        panel.textContent = '';

        for(var i = 0; i < links.length; i++)
        {
          if(links[i].url && links[i].name)
          {
            var a = document.createElement('a');
            a.href = links[i].url;
            a.title = mono.global.language.downloadTitle;
            a.appendChild(document.createTextNode(links[i].name));
            var span = document.createElement('span');
            span.className = this.linkClass;

            span.appendChild(a);
            panel.appendChild(span);

            SaveFrom_Utils.appendFileSizeIcon(a);
            if(links[i].noSound)
              SaveFrom_Utils.appendNoSoundIcon(a);

            if(title && !links[i].noTitle && links[i].type)
            {
              a.setAttribute('download', mono.fileName.modify(
                  title + '.' + links[i].type.toLowerCase()));

              a.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
            }
          }
        }
      }
    }
  },
  createFrameUmmyInfo: function(params) {
    "use strict";
    params = params || {};
    if (!params.vid) {
      params.vid = 111;
    }

    var info;
    var infoContainer = mono.create('div', {
      class: 'sf-ummy-info-popup-container',
      style: {
        position: 'absolute',
        zIndex: 9999
      },
      append: [
        mono.create('span', {
          style: {
            display: 'inline-block',
            border: '10px solid transparent',
            borderTop: 0,
            borderBottomColor: 'rgba(0, 0, 0, 0.7)',
            width: 0,
            top: '0px',
            left: '110px',
            position: 'absolute'
          }
        }),
        info = mono.create('div', {
          class: 'sf-ummy-info-popup',
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '6px 5px',
            textAlign: 'center',
            maxWidth: '240px',
            lineHeight: '16px',
            fontFamily: 'arial, sans-serif',
            fontSize: '12px',
            color: '#fff',
            cursor: 'default',
            marginTop: '10px'
          },
          append: [
            mono.parseTemplate(mono.global.language.ummyMenuInfo.replace('{url}', 'http://videodownloader.ummy.net/?'+mono.param(params))
            ),
            mono.create('style', {
              text: '' +
              '.sf-ummy-info-popup > p > .green-btn-2.arrow {' +
              'color: #fff;' +
              'background: #84bd07;' +
              'border-radius: 5px;' +
              'display: inline-block;' +
              'position: relative;' +
              'line-height: 1;' +
              'padding: 8px 34px 8px 10px;' +
              'text-decoration: none;' +
              'font-size: 12px;' +
              '}' +
              '.sf-ummy-info-popup > p > .green-btn-2.arrow:hover {' +
              'color: #fff;' +
              'opacity: .8;' +
              '}' +
              '.sf-ummy-info-popup > p {' +
              'margin: 0 0 .8em 0;' +
              '}' +
              '.sf-ummy-info-popup > p.center {' +
              'text-align: center;' +
              '}' +
              '.sf-ummy-info-popup > p > .green-btn-2.arrow:after {' +
              'background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAYAAAAmL5yKAAAAjklEQVQoke3RsRGCQBCF4YuJsQDoQMpjKMImtAjth9xMEj4DF4c5QDH3n7lk773b3XsJNzTpR9DglrwYcUG9w1iHdoTpgYkBJ5QrxkPcDXNDQm/JHR2KOF3UcvoUgnZL8KFBi2I+Yrk2YsZjsaIsBVQ4i08KxqhVu1OYBLji+E/hzTKFlV13pfAVGynkPAFtrlNTMRczMgAAAABJRU5ErkJggg==) 0 0 no-repeat;' +
              'content: "";' +
              'display: block;' +
              'position: absolute;' +
              'width: 16px;' +
              'height: 14px;' +
              'top: 50%;' +
              'right: 10px;' +
              'margin-top: -7px;' +
              '}'
            })
          ]
        })
      ],
      on: [
        ['mouseclick', function(e) {
          e.stopPropagation();
        }],
        ['mousedown', function(e) {
          e.stopPropagation();
        }]]
    });

    mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
      var icon = info.querySelector('img');
      icon.src = dataImg;
      icon.style.verticalAlign = 'text-bottom';
    });

    return infoContainer;
  },
  createUmmyInfo: function(params, details) {
    "use strict";
    details = details || {};
    params = params || {};
    if (!params.vid) {
      params.vid = 111;
    }


    var themeShadowArrowDirStyle, themeArrowDirStyle, themeInfoPopup;

    var shadowArrowDirStyle, arrowDirStyle, containerDirArrow;
    if (details.posLeft) {
      shadowArrowDirStyle = {
        border: '8px solid transparent',
        borderLeft: '10px solid rgb(192, 187, 187)',
        borderRight: 0,
        top: '8px',
        right: '11px'
      };

      arrowDirStyle = mono.extend({}, shadowArrowDirStyle, {
        right: '12px',
        borderLeft: '10px solid #fff'
      });

      containerDirArrow = {
        right: '21px'
      };

      if (details.darkTheme) {
        themeShadowArrowDirStyle = {
          borderLeftColor: 'rgba(255, 255, 255, 0.4)'
        };

        themeArrowDirStyle = {
          borderLeftColor: 'rgba(28,28,28, 0.6)'
        };
      }
    } else {
      shadowArrowDirStyle = {
        border: '8px solid transparent',
        borderRight: '10px solid rgb(192, 187, 187)',
        borderLeft: 0,
        top: '8px',
        left: '11px'
      };

      arrowDirStyle = mono.extend({}, shadowArrowDirStyle, {
        left: '12px',
        borderRight: '10px solid #fff'
      });

      containerDirArrow = {
        left: '21px'
      };

      if (details.darkTheme) {
        themeShadowArrowDirStyle = {
          borderRightColor: '#fff'
        };

        themeArrowDirStyle = {
          borderRightColor: '#000'
        };
      }
    }

    if (details.darkTheme) {
      themeInfoPopup = {
        backgroundColor: 'rgba(28,28,28,0.8)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      };
    } else {
      themeInfoPopup = {
        backgroundColor: '#fff',
        border: '1px solid #ccc'
      };
    }


    var arrow = mono.create(document.createDocumentFragment(), {
      append: [
        mono.create('span', {
          style: mono.extend({
            display: 'inline-block',
            width: 0,
            position: 'absolute'
          }, shadowArrowDirStyle, themeShadowArrowDirStyle)
        }),
        mono.create('span', {
          style: mono.extend({
            display: 'inline-block',
            width: 0,
            position: 'absolute',
            zIndex: 1
          }, arrowDirStyle, themeArrowDirStyle)
        })
      ]
    });

    var info = null;
    var infoContainer = mono.create('div', {
      class: 'sf-ummy-info-popup-container',
      style: {
        position: 'absolute',
        zIndex: 9999
      },
      append: [
        arrow,
        info = mono.create('div', {
          class: 'sf-ummy-info-popup',
          style: mono.extend({
            position: 'relative',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '6px 5px',
            textAlign: 'center',
            maxWidth: '240px',
            lineHeight: '16px',
            fontSize: '12px',
            fontFamily: 'arial, sans-serif',
            cursor: 'default'
          }, containerDirArrow, themeInfoPopup),
          append: [
            mono.parseTemplate(mono.global.language.ummyMenuInfo.replace(
              '{url}', 'http://videodownloader.ummy.net/?'+mono.param(params)
            )),
            mono.create('style', {
              text: mono.styleObjToText({
                '> p > .green-btn-2.arrow': {
                  color: '#fff',
                  background: '#84bd07',
                  borderRadius: '5px',
                  display: 'inline-block',
                  position: 'relative',
                  lineHeight: 1,
                  padding: '8px 34px 8px 10px',
                  textDecoration: 'none',
                  fontSize: '12px'
                },
                '> p > .green-btn-2.arrow:hover': {
                  color: '#fff',
                  opacity: 0.8
                },
                '> p': {
                  margin: '0 0 .8em 0'
                },
                '> p.center': {
                  textAlign: 'center'
                },
                '> p > .green-btn-2.arrow:after': {
                  background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAYAAAAmL5yKAAAAjklEQVQoke3RsRGCQBCF4YuJsQDoQMpjKMImtAjth9xMEj4DF4c5QDH3n7lk773b3XsJNzTpR9DglrwYcUG9w1iHdoTpgYkBJ5QrxkPcDXNDQm/JHR2KOF3UcvoUgnZL8KFBi2I+Yrk2YsZjsaIsBVQ4i08KxqhVu1OYBLji+E/hzTKFlV13pfAVGynkPAFtrlNTMRczMgAAAABJRU5ErkJggg==) 0 0 no-repeat',
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  width: '16px',
                  height: '14px',
                  top: '50%',
                  right: '10px',
                  marginTop: '-7px'
                }
              }, '.sf-ummy-info-popup')
            })
          ]
        })
      ],
      on: [
        ['mouseclick', function(e) {
          e.stopPropagation();
        }],
        ['mousedown', function(e) {
          e.stopPropagation();
        }]]
    });

    mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
      var icon = info.querySelector('img');
      icon.src = dataImg;
      icon.style.verticalAlign = 'text-bottom';
    });

    return infoContainer;
  },
  bindFrameUmmyInfo: function(container, params) {
    "use strict";
    if (!mono.global.preference.showUmmyInfo) {
      return;
    }

    var infoPopup;
    var infoPopupShowTimer;
    var popupArrow;
    var size;

    var onMouseLeave = function() {
      clearTimeout(infoPopupShowTimer);
      infoPopupShowTimer = setTimeout(function() {
        if (infoPopup.parentNode) {
          infoPopup.parentNode.removeChild(infoPopup);
        }
      }, 100);
    };

    mono.on(container, 'mouseenter', function() {
      clearTimeout(infoPopupShowTimer);
      var position = SaveFrom_Utils.getPosition(this);

      if (!infoPopup) {
        infoPopup = SaveFrom_Utils.createFrameUmmyInfo(params);
        popupArrow = infoPopup.firstChild;

        size = SaveFrom_Utils.getSize(this);
        infoPopup.style.top = (position.top + size.height) + 'px';

        mono.on(infoPopup, 'mouseenter', function() {
          clearTimeout(infoPopupShowTimer);
        });

        mono.on(infoPopup, 'mouseleave', onMouseLeave);
      }

      infoPopup.style.left = (position.left - (240 - size.width) / 2) + 'px';

      document.body.appendChild(infoPopup);
    });
    mono.on(container, 'mouseleave', onMouseLeave);
  },
  bindUmmyInfo: function(container, params, details) {
    "use strict";
    if (!mono.global.preference.showUmmyInfo) {
      return;
    }
    details = details || {};
    if (details.widthLimit && document.documentElement.offsetWidth < details.widthLimit) {
      return;
    }
    var infoPopup;
    var infoPopupShowTimer;
    var positionTop;

    var popupArrowTop = 8;
    var popupArrow;
    var popupArrowShadow;

    var fixPosition = function() {
      setTimeout(function() {
        var windowHeight = window.innerHeight;
        var infoHeight = infoPopup.clientHeight;
        var scrollY = window.scrollY;
        if (infoHeight + positionTop > windowHeight + scrollY) {
          var newPositionTop = windowHeight - infoHeight + scrollY;
          if (newPositionTop < 0) {
            return;
          }

          if (positionTop === newPositionTop) {
            return;
          }

          infoPopup.style.top = newPositionTop + 'px';

          var raz = 8 - (windowHeight - (infoHeight + positionTop) + scrollY);
          if (popupArrowTop !== raz) {
            popupArrowTop = raz;
            popupArrow.style.top = popupArrowTop + 'px';
            popupArrowShadow.style.top = popupArrowTop + 'px';
          }
        } else {
          if (popupArrowTop !== 8) {
            popupArrowTop = 8;
            popupArrow.style.top = popupArrowTop + 'px';
            popupArrowShadow.style.top = popupArrowTop + 'px';
          }
        }
      });
    };

    var onMouseLeave = function() {
      clearTimeout(infoPopupShowTimer);
      infoPopupShowTimer = setTimeout(function() {
        if (infoPopup.parentNode) {
          infoPopup.parentNode.removeChild(infoPopup);
        }
      }, 50);
    };

    var updateLeftPos = function(el) {
      var position = SaveFrom_Utils.getPosition(el);
      if (details.posLeft) {
        infoPopup.style.right = (document.documentElement.clientWidth - position.left - 21) + 'px';
      } else {
        var size = SaveFrom_Utils.getSize(el);
        infoPopup.style.left = (size.width + position.left - 21) + 'px';
      }
    };

    mono.on(container, 'mouseenter', function() {
      clearTimeout(infoPopupShowTimer);

      var el = container;
      var position = SaveFrom_Utils.getPosition(el);

      if (!infoPopup) {
        if (details.expUmmyInfo) {
          infoPopup = details.expUmmyInfo(params);
        } else {
          infoPopup = SaveFrom_Utils.createUmmyInfo(params, details);
        }

        popupArrow = infoPopup.firstChild;
        popupArrowShadow = popupArrow.nextElementSibling;

        positionTop = position.top - 4;

        mono.on(infoPopup, 'mouseenter', function() {
          clearTimeout(infoPopupShowTimer);
        });

        mono.on(infoPopup, 'mouseleave', onMouseLeave);
      } else {
        positionTop = position.top - 4;
      }

      infoPopup.style.top = positionTop + 'px';

      if (infoPopup.dataset.hide === '1') {
        return;
      }

      updateLeftPos(container);

      document.body.appendChild(infoPopup);

      fixPosition();

      el = null;
    });
    mono.on(container, 'mouseleave', onMouseLeave);
  },

  popupMenu: {
    popupId: 'sf_popupMenu',
    popup: undefined,
    popupStyle: undefined,
    dataArrtVisible: 'data-isVisible',
    extStyleCache: undefined,
    ummyIcon: null,

    badgeQualityList: ['8K', '4K', '1440', '1080', '720', 'ummy'],
    createBadge: function(qulity, options) {
      options = options || {};
      var style = {
        display: 'inline-block',
        lineHeight: '18px',
        width: '19px',
        height: '17px',
        color: '#fff',
        fontSize: '12px',
        borderRadius: '2px',
        verticalAlign: 'middle',
        textAlign: 'center',
        paddingRight: '2px',
        fontWeight: 'bold',
        marginLeft: '3px'
      };
      for (var key in options.containerStyle) {
        style[key] = options.containerStyle[key];
      }

      var container = mono.create('div', {
        style: style
      });

      if (qulity === '1080' || qulity === '1440' || qulity === '720') {
        container.textContent = 'HD';
        container.style.backgroundColor = '#505050';
        container.style.paddingRight = '1px';
      } else
      if (qulity === '8K' || qulity === '4K') {
        container.textContent = 'HD';
        container.style.paddingRight = '1px';
        container.style.backgroundColor = 'rgb(247, 180, 6)';
      } else
      if (qulity === 'mp3') {
        container.textContent = 'MP3';
        container.style.width = '26px';
        container.style.paddingRight = '1px';
        container.style.backgroundColor = '#505050';
      } else
      if (qulity === 'ummy') {
        if (this.ummyIcon) {
          container.style.background = 'url('+this.ummyIcon+') center center no-repeat';
        } else {
          mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
            container.style.background = 'url(' + (this.ummyIcon = dataImg) + ') center center no-repeat';
          });
        }
      }
      return container;
    },

    getTitleNode: function(link) {
      "use strict";
      var _this = SaveFrom_Utils.popupMenu;

      var titleContainer = mono.create('span', {
        style: {
          cssFloat: 'left'
        }
      });

      if ( link.quality === 'ummy' ) {
        // ummy hook
        var badge = document.createDocumentFragment();
        if (link.uQuality !== -1) {
          badge.appendChild(_this.createBadge(link.uIsAudio ? 'mp3' : link.uQuality, {
            containerStyle: {
              marginLeft: 0
            }
          }));
        }
        mono.create(titleContainer, {
          append: [badge, ' ', 'Ummy']
        });
        badge = null;
      } else
      if (link.itemText) {
        titleContainer.textContent = link.itemText;
      } else {
        var titleQuality = link.quality?' '+link.quality:'';
        var titleFormat = link.format ? link.format : '???';
        var title3D = link['3d'] ? '3D ' : '';
        var titleFps = '';
        if (link.sFps) {
          titleFps += ' ' + (link.fps || 60);
        }
        titleContainer.textContent = title3D + titleFormat + titleQuality + titleFps;
      }

      if (_this.badgeQualityList.indexOf( String(link.quality) ) !== -1) {
        titleContainer.appendChild(_this.createBadge(String(link.quality)));
      }

      return titleContainer;
    },

    createPopupItem: function(listItem, options) {
      var _this = SaveFrom_Utils.popupMenu;

      var href;
      if (typeof listItem === 'string') {
        href = listItem;
      } else {
        href = listItem.href;
      }

      if (href === '-') {
        var line = mono.create('div', {
          style: {
            display: 'block',
            margin: '1px 0',
            borderTop: '1px solid rgb(214, 214, 214)'
          }
        });
        return {el: line};
      }

      var itemContainer = document.createElement( (href === '-text-') ? 'div' : 'a' );
      if (options.linkClass) {
        itemContainer.classList.add(options.linkClass);
      }
      var itemContainerStyle = {
        display: 'block',
        padding: '0 5px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      };
      if (listItem.isHidden) {
        itemContainer.setAttribute(_this.dataArrtVisible, '0');
        itemContainerStyle.display = 'none';
      }
      SaveFrom_Utils.setStyle(itemContainer, itemContainerStyle);

      if (href === '-text-') {
        itemContainer.style.lineHeight = '22px';
        return {el: itemContainer};
      }

      itemContainer.href = href;

      if (href === '#') {
        return {el: itemContainer};
      }

      if (mono.isGM || mono.isOpera || mono.isSafari) {
        if (listItem.quality !== 'ummy') {
          itemContainer.title = mono.global.language.downloadTitle;
        }
      }

      var onClickData = {
        itag: listItem.itag || (listItem.isSubtitle ? listItem.langCode : ''),
        quality: listItem.quality || '',
        format: listItem.format || '???',
        '3d': listItem['3d'] ? '3D' : '',
        sFps: listItem.sFps ? 'fps' + (listItem.fps || 60) : '',
        noAudio: listItem.noAudio ? 'no audio' : '',
        uIsAudio: listItem.uIsAudio ? 'audio' : ''
      };

      var firedOnClick = false;
      if (listItem.title && listItem.format) {
        var ext = listItem.ext;
        if(!ext) {
          ext = listItem.format.toLowerCase();
        }
        itemContainer.setAttribute('download', mono.fileName.modify(listItem.title + '.' + ext) );
        if (listItem.forceDownload) {
          firedOnClick = true;
          itemContainer.addEventListener('click', function(event) {
            options.onItemClick && options.onItemClick(onClickData);
            SaveFrom_Utils.downloadOnClick(event, null, {
              useFrame: listItem.useIframe || false,
              el: this
            });
          }, false);
        }
      }

      if (!firedOnClick) {
        options.onItemClick && itemContainer.addEventListener('click', function() {
          options.onItemClick(onClickData);
        }, false);
      }

      if (listItem.func !== undefined) {
        itemContainer.addEventListener('click', listItem.func, false);
      }

      if (listItem.isBank !== undefined) {
        itemContainer.setAttribute('target', 'blank');
      }

      itemContainer.appendChild(_this.getTitleNode(listItem));

      var infoConteiner = document.createElement('span');
      SaveFrom_Utils.setStyle(infoConteiner, {
        cssFloat: 'right',
        lineHeight: '22px',
        height: '22px'
      });
      var sizeIconStyle = {
        top: '5px',
        verticalAlign: 'top'
      };
      for (var key in options.sizeIconStyle) {
        sizeIconStyle[key] = options.sizeIconStyle[key];
      }
      var sizeIconTextStyle = {
        marginLeft: 0
      };

      if (listItem.noAudio) {
        SaveFrom_Utils.appendNoSoundIcon(infoConteiner, sizeIconStyle);
      }

      if (!listItem.noSize) {
        infoConteiner.addEventListener('click', function onClick(e) {
          if (infoConteiner.firstChild.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            mono.trigger(infoConteiner.firstChild, 'click', {cancelable: true});
          }
          this.removeEventListener('click', onClick);
        });
        SaveFrom_Utils.appendFileSizeIcon(itemContainer, sizeIconStyle, sizeIconTextStyle, undefined, true, infoConteiner);
      }

      itemContainer.appendChild(infoConteiner);

      if (listItem.quality === 'ummy') {
        var videoId = listItem.id && (/rutube\./.test(listItem.href) ? 'rt-' : 'yt-') + listItem.id;
        var ummyInfoParams = {
          video: videoId,
          vid: listItem.vid
        };
        SaveFrom_Utils.bindUmmyInfo(itemContainer, ummyInfoParams, options.ummyInfoDetails);
      }

      return {el: itemContainer, sizeIcon: infoConteiner.lastChild, prop: listItem, onClickData: onClickData};
    },

    sortMenuItems: function(list, options) {
      if (options === undefined) {
        options = {};
      }
      var formatPriority = ['ummy','Audio Opus','Audio Vorbis','Audio AAC','3GP','WebM','FLV','MP4'];
      var strQuality = {
        Mobile: 280,
        LD: 280,
        SD: 360,
        HD: 720,
        '480 low': 478,
        '480 med': 479,
        '480 high': 480,
        'ummy': 1
      };
      var sizePriority = {};
      var bitratePriority = [];
      var defList = [];
      var audioList = [];
      var subtitleList = [];
      var mute60List = [];
      var muteList = [];
      var _3dList = [];
      var unkList = [];

      list.forEach(function(item) {
        var prop = item.prop;
        if (options.noProp) {
          prop = item;
        }
        if (!prop.format) {
          unkList.push(item);
          return 1;
        }
        if (prop.isSubtitle) {
          subtitleList.push(item);
        } else
        if (!prop.noVideo) {
          var size = strQuality[prop.quality] || -1;
          if (size === -1) {
            if (String(prop.quality).substr(-1) === 'K') {
              size = parseInt(prop.quality) * 1000;
            } else {
              size = parseInt(prop.quality);
            }
          }
          if (options.maxSize && size > options.maxSize) {
            return 1;
          }
          if (options.minSize && size < options.minSize) {
            return 1;
          }
          sizePriority[prop.quality] = size;
          if (prop.noAudio) {
            if (prop.sFps) {
              mute60List.push(item);
            } else {
              muteList.push(item);
            }
          } else
          if (prop['3d']) {
            _3dList.push(item);
          } else {
            defList.push(item);
          }
        } else {
          bitratePriority[prop.quality] = parseInt(prop.quality);
          audioList.push(item);
        }
      });
      var sizeCompare = function(a, b) {
        return sizePriority[a.quality] > sizePriority[b.quality]? -1 : sizePriority[a.quality] === sizePriority[b.quality]? 0 : 1;
      };
      var bitrateCompare = function(a, b) {
        return bitratePriority[a.quality] > bitratePriority[b.quality]? -1 : (bitratePriority[a.quality] === bitratePriority[b.quality])? 0 : 1;
      };
      var formatCompare = function(a, b) {
        if (a.noVideo && b.noVideo) {
          return bitrateCompare(a, b);
        }
        if (a.noVideo) {
          return 1;
        }
        if (b.noVideo) {
          return -1;
        }
        return formatPriority.indexOf(a.format) > formatPriority.indexOf(b.format)? -1 : formatPriority.indexOf(a.format) === formatPriority.indexOf(b.format)? 0 : 1;
      };

      var compare = function(aa, bb) {
        var a = aa.prop;
        var b = bb.prop;
        if (options.noProp) {
          a = aa;
          b = bb;
        }

        var size = sizeCompare(a, b);
        if (size !== 0) {
          return size;
        }
        return formatCompare(a, b);
      };
      defList.sort(compare);
      _3dList.sort(compare);
      audioList.sort(compare);
      mute60List.sort(compare);
      muteList.sort(compare);

      if (options.typeList) {
        var resList = [];
        if (options.typeList.indexOf('video') !== -1) {
          resList = resList.concat(defList);
        }
        if (options.typeList.indexOf('3d') !== -1) {
          resList = resList.concat(_3dList);
        }
        if (options.typeList.indexOf('audio') !== -1) {
          resList = resList.concat(audioList);
        }
        if (options.typeList.indexOf('mute') !== -1) {
          resList = resList.concat(muteList);
        }
        if (options.typeList.indexOf('mute60') !== -1) {
          resList = resList.concat(mute60List);
        }
        if (options.typeList.indexOf('subtitles') !== -1) {
          resList = resList.concat(subtitleList);
        }
        if (options.typeList.indexOf('other') !== -1) {
          resList = resList.concat(unkList);
        }
        return resList;
      }
      return defList.concat(_3dList, audioList, subtitleList, mute60List, muteList, unkList);
    },

    removePanel: function() {
      if (this.popup.parentNode !== null) {
        this.popup.parentNode.removeChild(this.popup);
      }
      if (this.popupStyle !== undefined && this.popupStyle.parentNode !== null) {
        this.popupStyle.parentNode.removeChild(this.popupStyle);
      }
      this.popup = undefined;
      this.popupStyle = undefined;
    },

    getHiddenList: function(hiddenList, options) {
      "use strict";
      var _this = this;
      var content = document.createDocumentFragment();
      var scrollListItemCount = 8;
      if (hiddenList.length < scrollListItemCount) {
        mono.create(content, {
          append: hiddenList
        });
      } else {
        var scrollContainer = mono.create('div', {
          style: {
            maxHeight: (scrollListItemCount * 24) + 'px',
            overflowY: 'scroll',
            display: 'none'
          },
          on: [
            ['wheel', function(e) {
              if (e.wheelDeltaY > 0 && this.scrollTop === 0) {
                e.preventDefault();
              } else
              if (e.wheelDeltaY < 0 && this.scrollHeight - (this.offsetHeight + this.scrollTop) <= 0) {
                e.preventDefault();
              }
            }],
            (function() {
              var hasTopShadow = false;
              return ['scroll', function() {
                if (this.scrollTop !== 0) {
                  if (hasTopShadow) {
                    return;
                  }
                  hasTopShadow = true;
                  this.style.boxShadow = 'rgba(0, 0, 0, 0.40) -2px 1px 2px 0px inset';
                } else {
                  if (!hasTopShadow) {
                    return;
                  }
                  hasTopShadow = false;
                  this.style.boxShadow = '';
                }
              }];
            })()
          ],
          append: hiddenList
        });
        scrollContainer.setAttribute(_this.dataArrtVisible, '0');

        content.appendChild(scrollContainer);
      }

      var separator = _this.createPopupItem('-', options).el;
      content.appendChild(separator);

      var moreItem = _this.createPopupItem('#', options).el;
      mono.create(moreItem, {
        text: mono.global.language.more + ' ' + String.fromCharCode(187), //171 //160 - space
        data: {
          visible: '0'
        },
        on: ['click', function(e) {
          e.preventDefault();
          var state = this.dataset.visible;
          var symbol;
          if (state > 0) {
            state--;
            symbol = 187;
          } else {
            state++;
            symbol = 171;
          }
          this.textContent = mono.global.language.more + ' ' + String.fromCharCode(symbol);
          this.dataset.visible = state;
          var itemList = this.parentNode.querySelectorAll('*[' + _this.dataArrtVisible + ']');
          for (var i = 0, item; item = itemList[i]; i++) {
            if (state === 1) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
            item.setAttribute( _this.dataArrtVisible, state);
          }
        }]
      });
      content.appendChild(moreItem);

      return content;
    },

    getContent: function(options) {
      "use strict";
      var _this = this;
      var links = options.links;

      var content = document.createDocumentFragment();

      var sizeIconList = [];

      if(typeof(links) === 'string') {
        var loadingItem = _this.createPopupItem('-text-', options).el;
        loadingItem.textContent = links;
        content.appendChild( loadingItem );
      } else
      if (links.length === 0) {
        var emptyItem = _this.createPopupItem('-text-', options).el;
        emptyItem.textContent = mono.global.language.noLinksFound;
        content.appendChild( emptyItem );
      } else {
        var items = [];
        links.forEach(function(link) {
          items.push(_this.createPopupItem(link, options));
        });

        items = _this.sortMenuItems(items);

        var hiddenList = [];

        var hasBest = false;
        items.forEach(function(item) {
          if (item.prop.isHidden) {
            hiddenList.push(item.el);
            return 1;
          }

          if (hasBest === false) {
            item.onClickData.isBest = hasBest = true;
          }

          content.appendChild(item.el);

          if (options.showFileSize && !item.prop.noSize) {
            sizeIconList.push(item.sizeIcon);
          }
        });

        if (hiddenList.length > 0) {
          if (options.getHiddenListFunc) {
            content.appendChild(options.getHiddenListFunc(hiddenList, options));
          } else {
            content.appendChild(_this.getHiddenList(hiddenList, options));
          }
        }
      }

      return {sizeIconList: sizeIconList, content: content};
    },

    create: function(options) {
      var button = options.button;
      var _this = SaveFrom_Utils.popupMenu;

      options.linkClass = options.linkClass || 'sf-menu-item';

      options.offsetRight = options.offsetRight || 0;

      options.parent = options.parent || document.body;

      if (options.isUpdate && (_this.popup === undefined || _this.popup.style.display === 'none')) {
        return;
      }

      if(_this.popup) {
        _this.removePanel();
      }

      var popupContainer = _this.popup = document.createElement('div');
      var containerSelector = '#'+_this.popupId;
      if (options.popupId) {
        containerSelector = '#'+options.popupId;
        popupContainer.id = options.popupId;
      } else
      if (options.containerClass) {
        containerSelector = '.'+options.containerClass;
        popupContainer.classList.add(options.containerClass);
      } else {
        popupContainer.id = _this.popupId;
      }

      var popupContainerStyle = {
        display: 'block',
        position: 'absolute',
        minHeight: '24px',
        cursor: 'default',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        fontFamily: 'arial, sans-serif'
      };
      if (options.extStyle) {
        delete popupContainerStyle.display;
      }

      var pos = SaveFrom_Utils.getPosition(button, options.parent),
        size = SaveFrom_Utils.getSize(button);

      popupContainerStyle.top = (pos.top + size.height) + 'px';
      popupContainerStyle.left = (pos.left + options.offsetRight) + 'px';
      SaveFrom_Utils.setStyle(popupContainer, popupContainerStyle);

      var popupCustomContainerStyle = {
        'background-color': '#fff',
        'z-index': '9999',
        'box-shadow': '0 2px 10px 0 rgba(0,0,0,0.2)',
        border: '1px solid #ccc',
        'border-radius': '4px',
        'font-size': '12px',
        'font-weight': 'bold',
        'min-width': '190px'
      };

      if (options.style && options.style.popup) {
        for (var key in options.style.popup) {
          var value = options.style.popup[key];
          popupCustomContainerStyle[key] = value;
        }
      }

      SaveFrom_Utils.addStyleRules(containerSelector, popupCustomContainerStyle);

      var itemCustomStyle = {
        'line-height': '24px',
        color: '#3D3D3D'
      };

      if (options.style && options.style.item) {
        for (var key in options.style.item) {
          var value = options.style.item[key];
          itemCustomStyle[key] = value;
        }
      }

      SaveFrom_Utils.addStyleRules(containerSelector+' .'+ options.linkClass, itemCustomStyle);

      var stopPropagationFunc = function(e){e.stopPropagation()};
      mono.create(popupContainer, {
        on: [
          ['click', stopPropagationFunc],
          ['mouseover', stopPropagationFunc],
          ['mouseup', stopPropagationFunc],
          ['mousedown', stopPropagationFunc],
          ['mouseout', stopPropagationFunc]
        ]
      });

      while (popupContainer.firstChild !== null) {
        popupContainer.removeChild(popupContainer.firstChild);
      }

      var menuContent = _this.getContent.call(_this, options);
      var sizeIconList = menuContent.sizeIconList;
      menuContent = menuContent.content;
      popupContainer.appendChild(menuContent);


      var hoverBgColor = '#2F8AFF';
      var hoverTextColor = '#fff';
      if (options.style && options.style.hover) {
        hoverBgColor = options.style.hover.backgroundColor || hoverBgColor;
        hoverTextColor = options.style.hover.color || hoverTextColor;
      }
      var styleEl = _this.popupStyle = document.createElement('style');
      styleEl.textContent = containerSelector + ' a:hover'+
        '{'+
        'background-color: '+hoverBgColor+';'+
        'color: '+hoverTextColor+';'+
        '}'+
        containerSelector + ' > a:first-child'+
        '{'+
        'border-top-left-radius: 4px;'+
        'border-top-right-radius: 4px;'+
        '}'+
        containerSelector + ' > a:last-child'+
        '{'+
        'border-bottom-left-radius: 4px;'+
        'border-bottom-right-radius: 4px;'+
        '}';

      options.parent.appendChild(styleEl);
      options.parent.appendChild(popupContainer);
      if (options.extStyle) {
        if (SaveFrom_Utils.popupMenu.extStyleCache !== undefined && SaveFrom_Utils.popupMenu.extStyleCache.parentNode !== null) {
          SaveFrom_Utils.popupMenu.extStyleCache.parentNode.removeChild(SaveFrom_Utils.popupMenu.extStyleCache);
        }

        var extElClassName = 'sf-extElStyle_'+containerSelector.substr(1);
        var extBodyClassName = 'sf-extBodyStyle_'+containerSelector.substr(1);
        var extBodyStyle = document.querySelector('style.'+extBodyClassName);
        if (extBodyStyle === null) {
          document.body.appendChild( mono.create('style', {
            class: extBodyClassName,
            text: containerSelector+' {' +
              'display: none;' +
              '}'
          }) );
        }
        SaveFrom_Utils.popupMenu.extStyleCache = options.extStyle.appendChild(mono.create('style', {
          class: extElClassName,
          text: 'body ' + containerSelector + ' {' +
            'display: block;' +
            '}'
        }));
      }

      setTimeout(function() {
        sizeIconList.forEach(function(icon) {
          mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
        });
      });

      return popupContainer;
    },

    update: function(popupContainer, options) {
      var _this = SaveFrom_Utils.popupMenu;

      while (popupContainer.firstChild !== null) {
        popupContainer.removeChild(popupContainer.firstChild);
      }

      var menuContent = _this.getContent.call(_this, options);
      var sizeIconList = menuContent.sizeIconList;
      menuContent = menuContent.content;
      popupContainer.appendChild(menuContent);

      setTimeout(function() {
        sizeIconList.forEach(function(icon) {
          mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
        });
      });
    },

    prepareLinks: {
      youtube: function(links, title, subtitles, details) {
        details = details || {};
        subtitles = subtitles || [];
        links = mono.extend({}, links);
        var sfUtilsYt = SaveFrom_Utils.video.yt;
        sfUtilsYt.init();
        sfUtilsYt.filterLinks(links);

        var menuLinks = [];
        var popupLink;
        var ummyQuality = -1;
        var ummyHasAudio = false;
        var meta = links.meta || {};

        for (var format in sfUtilsYt.format) {
          var formatList = sfUtilsYt.format[format];
          for (var itag in formatList) {
            if (links[itag] === undefined) {
              continue;
            }

            var prop = formatList[itag];
            var isHidden = false;
            if (!sfUtilsYt.showFormat[format]) {
              isHidden = true;
            }
            if (prop['3d'] && !sfUtilsYt.show3D) {
              isHidden = true;
            }
            if (prop.noAudio && !sfUtilsYt.showMP4NoAudio) {
              isHidden = true;
            }

            popupLink = { href: links[itag], isHidden: isHidden, title: title, format: format, itag: itag };

            for (var pItem in prop) {
              popupLink[pItem] = prop[pItem];
            }

            var metaTag = meta[itag] || {};

            if (metaTag.quality) {
              popupLink.quality = metaTag.quality;
            }

            if (metaTag.fps) {
              popupLink.fps = metaTag.fps;
            }

            if(prop.noVideo || prop.noAudio) {
              if (!prop.noAudio) {
                ummyHasAudio = true;
              }
              popupLink.forceDownload = true;
              popupLink.useIframe = true;
            }

            var qIndex = SaveFrom_Utils.popupMenu.badgeQualityList.indexOf(popupLink.quality);
            if (qIndex !== -1 && (ummyQuality === -1 || qIndex < ummyQuality) ) {
              ummyQuality = qIndex;
            }

            menuLinks.push(popupLink);
            delete links[itag];
          }
        }
        if (ummyQuality !== -1) {
          if (ummyQuality === 0) {
            ummyQuality = 1;
          }
          ummyQuality = SaveFrom_Utils.popupMenu.badgeQualityList[ummyQuality];
        }

        var ummyLinkParam = mono.parseUrlParams(links.ummy || links.ummyAudio || '');

        for (var itag in links) {
          if (itag === 'meta') {
            continue;
          }
          if (['ummy', 'ummyAudio'].indexOf(itag) !== -1) {
            popupLink = {
              href: links[itag],
              quality: 'ummy',
              noSize: true,
              format: 'ummy',
              id: ummyLinkParam.v
            };
            if (itag === 'ummy') {
              popupLink.itag = 'ummy';
              popupLink.uQuality = ummyQuality;
            } else {
              popupLink.itag = 'ummyAudio';
              popupLink.uIsAudio = true;
            }
            if (details.ummyVid) {
              popupLink.vid = details.ummyVid;
            }
          } else {
            popupLink = {
              href: links[itag],
              isHidden: true,
              title: title,
              quality: itag,
              itag: itag
            };
          }
          menuLinks.push(popupLink);
          delete links[itag];
        }
        for (var i = 0, item; item = subtitles[i]; i++) {
          popupLink = {
            href: item.url,
            isHidden: true,
            quality: 'SRT' + (item.isAuto ? 'A' : ''),
            itemText: mono.global.language.subtitles + ' (' + item.lang + ')',
            title: title + '-' + item.langCode,
            ext: 'srt',
            format: 'SRT',
            isSubtitle: true,
            forceDownload: true,
            langCode: item.langCode
          };
          menuLinks.push(popupLink);
        }

        return menuLinks;
      },
      vimeo: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.ext;
          if(!ext)
          {
            ext = 'MP4';
            if(link.url.search(/\.flv($|\?)/i) != -1)
              ext = 'FLV';
          }
          var quality = link.name ? link.name : ext;
          var format = link.type ? link.type : ext;
          format = format.toUpperCase();
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true, useIframe: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      vk: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.name|| link.ext;
          var format = (ext)?ext.toUpperCase():'';
          var quality = (link.subname)?link.subname:'';
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true, useIframe: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      dailymotion: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var format = link.ext;
          var quality = (link.height)?link.height:'';
          popupLink = { href: link.url, title: title, ext: format, format: format, quality: quality, forceDownload: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      facebook: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.ext;
          var format = (ext)?ext.toUpperCase():'';
          var quality = link.name;
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      rutube: function(href) {
        "use strict";
        if (typeof href !== 'string') {
          return;
        }
        var links = [];

        href = href.replace(/\/\/video\./, '//');

        var id = href.match(/\/embed\/(\d+)/);
        id = id && id[1];
        if (!id) {
          id = href.match(/\/video\/([0-9a-z]+)/);
          id = id && id[1];
        }

        if (!id) {
          id = undefined;
        }

        var ummyUrl = href.replace(/^.*(\/\/.*)$/, 'ummy:$1');

        var videoLink = {href: ummyUrl, quality: 'ummy', noSize: true, format: 'ummy', itag: 'ummy', uQuality: -1, vid: 114, id: id};

        var sep = '?';
        if (ummyUrl.indexOf(sep) !== -1) {
          sep = '&';
        }
        ummyUrl += sep + 'sf_type=audio';

        var audioLink = {href: ummyUrl, quality: 'ummy', noSize: true, format: 'ummy', itag: 'ummyAudio', uIsAudio: true, vid: 114, id: id};

        links.push(videoLink);
        links.push(audioLink);

        return links;
      }
    },

    /**
     * @param {Node|Element} target
     * @param {String|Array} links
     * @param {String} id
     * @param {Object} [args]
     * @returns {{isShow: boolean, el: Node|Element, hide: Function, update: Function}}
     */
    quickInsert: function(target, links, id, args) {
      if (args === undefined) {
        args = {};
      }
      var out = {};
      var hideMenu = function() {
        menu.style.display = 'none';
        mono.off(document, 'mousedown', hideMenu);
        out.isShow = false;
        args.onHide && args.onHide(menu);
      };

      var options = {
        links: links,
        button: target,
        popupId: id,
        showFileSize: true,
        parent: args.parent,
        extStyle: args.extStyle,
        offsetRight: args.offsetRight
      };

      var menu = SaveFrom_Utils.popupMenu.create(options);

      args.onShow && args.onShow(menu);

      mono.off(document, 'mousedown', hideMenu);
      mono.on(document, 'mousedown', hideMenu);

      return out = {
        isShow: true,
        el: menu,
        hide: hideMenu,
        update: function(links) {
          options.links = links;
          SaveFrom_Utils.popupMenu.update(menu, options)
        }
      }
    }
  },

  frameMenu: {
    getBtn: function(details) {
      "use strict";
      var selectBtn = undefined;

      var containerStyle = {
        verticalAlign: 'middle',
        position: 'absolute',
        zIndex: 999,
        fontFamily: 'arial, sans-serif'
      };

      for (var key in details.containerStyle) {
        containerStyle[key] = details.containerStyle[key];
      }

      var quickBtnStyle = {
        display: 'inline-block',
        fontSize: 'inherit',
        height: '22px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '3px',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        paddingRight: '12px',
        paddingLeft: '28px',
        cursor: 'pointer',
        verticalAlign: 'middle',
        position: 'relative',
        lineHeight: '22px',
        textDecoration: 'none',
        zIndex: 1,
        color: '#fff'
      };

      for (var key in details.quickBtnStyle) {
        quickBtnStyle[key] = details.quickBtnStyle[key];
      }

      var quickBtnLabel = details.quickBtnLabel || mono.global.language.download;

      var insertStyle = {
        '': {
          opacity: 0.8,
          display: 'none'
        },
        '\\.sf-show': {
          display: 'block'
        },
        'button::-moz-focus-inner': {
          padding: 0,
          margin: 0
        },
        '.sf-quick-btn': {
          backgroundColor: 'rgba(28,28,28,0.1)'
        },
        '.sf-select-btn': {
          backgroundColor: 'rgba(28,28,28,0.1)'
        },
        ':hover,\\.hover': {
          opacity: 1
        },
        ':hover .sf-quick-btn,\\.hover .sf-quick-btn': {
          backgroundColor: 'rgba(0, 163, 80, 0.5)'
        },
        ':hover .sf-select-btn,\\.hover .sf-select-btn': {
          backgroundColor: 'rgba(60, 60, 60, 0.5)'//'rgba(28,28,28,0.8)'
        },
        '\\.hover .sf-select-btn': {
          backgroundColor: 'rgba(28,28,28,0.8)'
        }
      };

      for (var key in details.insertStyle) {
        insertStyle[key] = details.insertStyle[key];
      }

      var selectBtnStyle = {
        position: 'relative',
        display: 'inline-block',
        fontSize: 'inherit',
        height: '24px',
        paddingRight: '21px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderLeft: 0,
        borderRadius: '3px',
        borderTopLeftRadius: '0',
        borderBottomLeftRadius: '0',
        cursor: 'pointer',
        color: '#fff',
        zIndex: 0,
        verticalAlign: 'middle'
      };

      for (var key in details.selectBtnStyle) {
        selectBtnStyle[key] = details.selectBtnStyle[key];
      }

      var quickBtnIcon = details.quickBtnIcon || mono.create('i', {
        style: {
          position: 'absolute',
          display: 'inline-block',
          left: '6px',
          top: '3px',
          backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#ffffff')+')',
          backgroundSize: '12px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '16px',
          height: '16px'
        }
      });

      var selectBtnIcon = details.selectBtnIcon || mono.create('i', {
        style: {
          position: 'absolute',
          display: 'inline-block',
          top: '9px',
          right: '6px',
          border: '5px solid #FFF',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent'
        }
      });

      var quickBtn;

      var btnContainer = mono.create('div', {
        id: details.btnId,
        style: containerStyle,
        on: details.on,
        append: [
          quickBtn = mono.create('a', {
            class: 'sf-quick-btn',
            style: quickBtnStyle,
            href: '#',
            append: [
              quickBtnIcon,
              quickBtnLabel
            ]
          }),
          mono.create('style', {text: mono.styleObjToText(insertStyle, '#'+details.btnId)}),
          selectBtn = mono.create('button', {
            class: 'sf-select-btn',
            style: selectBtnStyle,
            on: details.onSelectBtn,
            append: [
              selectBtnIcon
            ]
          })
        ]
      });

      var setQuality = function(text) {
        var node = typeof text === 'object' ? text : document.createTextNode(text);
        var first = selectBtn.firstChild;
        if (first === selectBtnIcon) {
          selectBtn.insertBefore(node, first);
        } else {
          selectBtn.replaceChild(node, first);
        }
      };

      return {
        node: btnContainer,
        setQuality: setQuality,
        setLoadingState: function() {
          setQuality(mono.create('img', {
            src: SaveFrom_Utils.svg.getSrc('info', '#ffffff'),
            style: {
              width: '14px',
              height: '14px',
              marginLeft: '6px',
              verticalAlign: 'middle',
              top: '-1px',
              position: 'relative'
            }
          }));
        },
        selectBtn: selectBtn,
        quickBtn: quickBtn
      };
    },

    getHiddenList: function(hiddenList, options) {
      "use strict";
      var popupMenu = SaveFrom_Utils.popupMenu;
      var moreBtn = popupMenu.createPopupItem('-text-', options).el;
      mono.create(moreBtn, {
        text: mono.global.language.more + ' ' + String.fromCharCode(187),
        style: {
          cursor: 'pointer'
        },
        on: ['click', function() {
          var content = this.parentNode;
          var itemList = content.querySelectorAll('*[' + popupMenu.dataArrtVisible + ']');
          for (var i = 0, item; item = itemList[i]; i++) {
            item.style.display = 'block';
            item.setAttribute( popupMenu.dataArrtVisible, 1);
          }
          this.parentNode.removeChild(this);
          /*content.replaceChild(mono.create('i', {
            class: 'sf-separator'
          }), this);*/
        }]
      });

      var content = document.createDocumentFragment();
      content.appendChild(moreBtn);

      mono.create(content, {
        append: hiddenList
      });

      return content;
    },

    getMenuContainer: function(options) {
      "use strict";
      var popupMenu = SaveFrom_Utils.popupMenu;
      var button = options.button;
      var popupId = options.popupId;

      var container = mono.create('div',  {
          style: {
            position: 'absolute',
            minHeight: '24px',
            cursor: 'default',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'auto'
          }
      });

      if (popupId[0] === '#') {
        container.id = popupId.substr(1);
      } else {
        container.classList.add(popupId);
      }

      var menuContent = popupMenu.getContent(options);
      container.appendChild(menuContent.content);

      setTimeout(function() {
        menuContent.sizeIconList.forEach(function(icon) {
          mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
        });
      });

      var insertStyle = {
        '': {
          display: 'none',
          fontFamily: 'arial, sans-serif',

          backgroundColor: 'rgba(28,28,28,0.8)',
          zIndex: 9999,
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          minWidth: '190px',
          color: '#fff'
        },
        '\\.sf-show': {
          display: 'block'
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: '#424242'
        },
        '::-webkit-scrollbar': {
          width: '10px',
          backgroundColor: '#424242'
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#8e8e8e'
        },
        '.sf-menu-item': {
          lineHeight: '24px',
          color: '#fff'
        },
        '.sf-menu-item:hover': {
          backgroundColor: '#1c1c1c'
        }
      };
      for (var key in options.insertStyle) {
        insertStyle[key] = options.insertStyle[key];
      }

      var pos = SaveFrom_Utils.getPosition(button, options.parent);
      var size = SaveFrom_Utils.getSize(button);

      var stopPropagationFunc = function(e){e.stopPropagation()};

      var topOffset = pos.top + size.height;
      mono.create(container, {
        style: {
          top: topOffset + 'px',
          right: (document.body.offsetWidth - pos.left - size.width) + 'px',
          maxHeight: (document.body.offsetHeight - topOffset - 40) + 'px'
        },
        on: [
          ['click', stopPropagationFunc],
          ['mouseover', stopPropagationFunc],
          ['mouseup', stopPropagationFunc],
          ['mousedown', stopPropagationFunc],
          ['mouseout', stopPropagationFunc],
          ['wheel', function(e) {
            if (e.wheelDeltaY > 0 && this.scrollTop === 0) {
              e.preventDefault();
            } else
            if (e.wheelDeltaY < 0 && this.scrollHeight - (this.offsetHeight + this.scrollTop) <= 0) {
              e.preventDefault();
            }
          }]
        ],
        append: [
          mono.create('style', {text: mono.styleObjToText(insertStyle, (popupId[0] === '#' ? '' : '.') + popupId)})
        ]
      });

      return container;
    },
    getMenu: function(target, links, id, _options) {
      "use strict";
      var options = {
        links: links,
        button: target,
        popupId: id || '#sf-frame-menu',
        showFileSize: true,
        sizeIconStyle: {
          color: '#fff'
        },
        linkClass: 'sf-menu-item',
        ummyInfoDetails: {
          posLeft: true,
          darkTheme: true,
          widthLimit: 480
        },
        getHiddenListFunc: this.getHiddenList.bind(this)
      };

      for (var key in _options) {
        options[key] = _options[key];
      }

      var menu = this.getMenuContainer(options);

      document.body.appendChild(menu);

      var hideMenu = function() {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
        out.hide = true;
        options.onHide && options.onHide();
      };

      options.onShow && options.onShow(menu);

      mono.off(document, 'mousedown', hideMenu);
      mono.on(document, 'mousedown', hideMenu);

      var out = {
        isShow: true,
        el: menu,
        hide: hideMenu,
        update: function(links) {
          var popupMenu = SaveFrom_Utils.popupMenu;
          var style = menu.lastChild;
          menu.textContent = '';

          options.links = links;
          var menuContent = popupMenu.getContent(options);

          setTimeout(function() {
            menuContent.sizeIconList.forEach(function(icon) {
              mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
            });
          });

          menu.appendChild(menuContent.content);
          menu.appendChild(style);
        }.bind(this)
      };

      return out;
    }
  },

  mobileLightBox: {
    id: 'sf-lightbox',
    clear: function() {
      var el = document.getElementById(SaveFrom_Utils.mobileLightBox.id);
      if (el === null) {
        return;
      }
      el.parentNode.removeChild(el);
    },
    getTitle: function(item) {
      var title = [];

      title.push(item.format || '???');
      if (item.quality) {
        var quality = item.quality;

        if (item.sFps) {
          quality += ' ' + (item.fps || 60);
        }

        title.push(quality);
      }
      if (item['3d']) {
        title.push('3D');
      }
      if (item.noAudio) {
        title.push(mono.global.language.withoutAudio);
      }

      return title.join(' ');
    },
    createItem: function(listItem) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      var button = mono.create('a', {
        style: {
          display: 'block',
          marginBottom: '6px',
          border: 'solid 1px #d3d3d3',
          lineHeight: '36px',
          minHeight: '36px',
          background: '#f8f8f8',
          verticalAlign: 'middle',
          fontSize: '15px',
          textAlign: 'center',
          color: '#333',
          borderRadius: '2px',
          overflow: 'hidden'
        }
      });

      if (typeof listItem === 'string') {
        button.textContent = listItem;
        return button;
      } else {
        button.href = listItem.href;
        button.download = listItem.title;
        button.textContent = mobileLightBox.getTitle(listItem);
      }

      if (listItem.isHidden) {
        button.classList.add('isOptional');
        button.style.display = 'none';
      }

      var sizeIconStyle = {
        verticalAlign: 'middle',
        cssFloat: 'right',
        lineHeight: '36px',
        minHeight: '36px',
        paddingRight: '15px',
        width: '18px'
      };
      var sizeIconTextStyle = {
        cssFloat: 'right',
        paddingRight: '5px'
      };
      SaveFrom_Utils.appendFileSizeIcon(button, sizeIconStyle, sizeIconTextStyle, undefined, true, button);

      return button;
    },
    getItems: function(itemList) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      if (typeof itemList === 'string') {
        return {list: [mobileLightBox.createItem(itemList)], hiddenCount: 0};
      }

      var list = [];
      for (var i = 0, item; item = itemList[i]; i++) {
        if (item.quality === 'ummy') {
          continue;
        }
        list.push({el: mobileLightBox.createItem(item), prop: item});
      }
      list = SaveFrom_Utils.popupMenu.sortMenuItems(list);
      var elList = [];
      var hiddenElList = [];
      for (i = 0, item; item = list[i]; i++) {
        if (item.prop.isHidden) {
          hiddenElList.push(item.el);
        } else {
          elList.push(item.el);
        }
      }
      return {list: elList.concat(hiddenElList), hiddenCount: hiddenElList.length};
    },
    show: function(itemList) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      var winHeight = window.innerHeight;
      var mTop = parseInt(winHeight / 100 * 15);
      var btnBox = undefined;
      var moreBtn;

      var getBtnBoxSize = function(hasMore) {
        "use strict";
        var i = hasMore ? 2 : 1;
        return winHeight - 46*i - mTop*2;
      };

      var setMoreBtnState = function(itemObj) {
        "use strict";
        if (itemObj.hiddenCount > 0) {
          btnBox.style.height = getBtnBoxSize(1) + 'px';
          moreBtn.style.display = 'block';
        } else {
          moreBtn.style.display = 'none';
          btnBox.style.height = getBtnBoxSize(0) + 'px';
        }
      };

      var exLb = document.getElementById(mobileLightBox.id);
      if (exLb !== null) {
        exLb.parentNode.removeChild(exLb);
      }


      var lbWidth = window.innerWidth;
      if (lbWidth <= 250) {
        lbWidth = '90%';
      } else {
        lbWidth = '70%';
      }

      if (!itemList || itemList.length === 0) {
        itemList = mono.global.language.noLinksFound;
      }

      var itemObj = mobileLightBox.getItems(itemList);

      var lightbox = mono.create('div', {
        id: mobileLightBox.id,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 9000,
          height: document.body.scrollHeight + 'px',
          background: 'rgba(0,0,0,0.85)',
          textAlign: 'center'
        },
        on: [
          ['touchmove', function(e) {e.preventDefault()}],
          ['click', function(e) {
            e.preventDefault();
            close();
          }]
        ],
        append: mono.create('div', {
          style: {
            display: 'inline-block',
            width: lbWidth,
            backgroundColor: '#eee',
            height: (winHeight - mTop*2)+'px',
            marginTop: mTop+'px',
            borderRadius: '4px',
            padding: '8px',
            position: 'relative'
          },
          append: [
            btnBox = mono.create('div', {
              style: {
                overflowY: 'auto',
                marginBottom: '6px'
              },
              append: itemObj.list,
              on: ['touchmove', function(e) {
                e.stopPropagation();
              }]
            }),
            moreBtn = mono.create(mobileLightBox.createItem(mono.global.language.more + ' ' + String.fromCharCode(187)), {
              href: '#',
              on: ['click', function(e) {
                e.preventDefault();
                var state = 'none';
                var elList = this.parentNode.querySelectorAll('.isOptional');
                if (this.dataset.state !== 'open') {
                  this.dataset.state = 'open';
                  this.textContent = mono.global.language.more + ' ' + String.fromCharCode(171);
                  state = 'block';
                } else {
                  this.dataset.state = 'close';
                  this.textContent = mono.global.language.more + ' ' + String.fromCharCode(187);
                }
                for (var i = 0, el; el = elList[i]; i++) {
                  el.style.display = state;
                }
              }]
            }),
            mono.create(mobileLightBox.createItem(mono.global.language.close), {
              on: ['click', function(e) {
                e.preventDefault();
                close();
              }]
            })
          ],
          on: ['click', function(e) {
            e.stopPropagation();
          }]
        })
      });

      setMoreBtnState(itemObj);

      document.body.appendChild(lightbox);

      var topPos = document.body.scrollTop;
      var close = function() {
        document.body.scrollTop = topPos;
        lightbox.parentNode.removeChild(lightbox);
        lightbox = null;
      };

      return {
        update: function(itemList) {
          if (lightbox === null || lightbox.parentNode === null) {
            return;
          }

          if (!itemList || itemList.length === 0) {
            itemList = mono.global.language.noLinksFound;
          }

          btnBox.textContent = '';
          var itemObj = mobileLightBox.getItems(itemList);

          mono.create(btnBox, {
            append: itemObj.list
          });

          setMoreBtnState(itemObj);
        },
        close: close
      }
    }
  },

  showNotification: function(message, id, onClose) {
    if (!id) {
      id = 'savefrom_popup_panel';
    }
    var panel = document.getElementById(id);
    if(panel)
      panel.parentNode.removeChild(panel);

    panel = document.createElement('div');
    panel.id = id;
    SaveFrom_Utils.setStyle(panel, {
      color: '#000',
      backgroundColor: '#feefae',
      backgroundImage: '-webkit-linear-gradient(top, #feefae, #fbe792)',
      cssFloat: 'none',
      borderBottom: '1px solid #aaaaab',
      display: 'block',
      position: 'fixed',
      zIndex: 2147483647,
      top: 0,
      left: 0,
      right: 0,
      margin: 0,
      padding: 0
    });
    panel.setAttribute('style', panel.style.cssText + ';background-image: linear-gradient(to bottom, #feefae, #fbe792)');

    panel.addEventListener('click', function(e) {
      if (e.target.tagName !== 'A') {
        return;
      }
      panel.parentNode.removeChild(panel);
      if (onClose) {
        onClose(id);
      }
    }, false);

    var content = document.createElement('div');
    SaveFrom_Utils.setStyle(content, {
      color: '#000',
      display: 'block',
      position: 'relative',
      margin: '0 auto',
      paddingLeft: '10px',
      paddingRight: '10px',
      height: '35px',
      fontSize: '16px',
      lineHeight: '35px',
      maxWidth: '960px',
      overflow: 'hidden',
      textAlign: 'center'
    });
    content.textContent = message;

    var btn = document.createElement('div');
    SaveFrom_Utils.setStyle(btn, {
      background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAOCAYAAABU4P48AAADEUlEQVR42q2WX0hTYRjGdyXIoYuupAsvuuvKi+gm4hCjkrwKwXI1tbH8QyhqOTbPmafhH5zhXKNsmVRg1E1BEEhWBJ3CuslNR6FmlmLqjqWeKLr16zxfO6fvnB1X0D544f2e93nYT/fubA5Hns6T6lLu5ckK8U29V061NKko9NAwy5ktcnCPineIr/bukZOHDqgo9NAwc+T7yK4KfrK5UVmK9pOVyzFTQcMMHrvs4+Kd/IRzv7LpF8h3qctU0DCDJ2+w41UuflYStlavxEiuggdeE+zuXfwHV+WWFdRa8MBrC1BXV3fwX7Tfa1DNpdpaFR1q/cH9LFBWgxcZmi0p4qbKjig61M+bI1mgrAYvMiYAt9td2tDQQGpra9t0DT00zKzAr+u94nIsQlYHY+TznRGCs/78Gb2j0ONghju8yNA12lcibgaCFObr0A3q+zE6ZgCix8GMrofmRcbKUFBeXj6gQ+uw0DCzmifbWuS0BoJaiIRJ4nqcvsiGBrqRgYWGme5DBtlk2VFZh/siXCDJkdsGtA4LDTPdh4zdO21A54LFeSe1q+mrGkimFgb+QBuwmsZ6kEF2tvKUyr79LLQdLAoZ2z32eDwBHRj9dh+46VDQBIxaezpmvCh66xwZZOfcp9Wsp8LDUSOL3jpHJguCXQN2PeyAUx1+OR3XQDK1IWfWYDhOi66HprEeZJB9e7xKZmHYNWDXg/UgYwKoqak5bFkDYz0wswJPBM6Lq4MDRNFAlHt3DdjFaJiWDo0ZPPAig2zi2AlRFUIURB2+ZVoDdj0wox7Ni4yVodDpdHotO1uQ0Qqz/sM+HzfdE1KUazEyf7GLvJDayeKlMMEdhR4aZrjDiwzNao+3+TNN9LG24g+S8Z5e086ih4YZ7vCmMo/E/zoJQeA/9vdu6ZDbFTzwmv5g11l+uTnw1y8OeODN27ddQpL4933dSjoeJWtDMVNBwwwe28+B5xy/0BhQvgU7s0ChYQZP3n9PpPp93FR3pzjT1yPPRcIqCj00zHJmq33cTL0gfmrqkJdaJRWFHhpmrPcXrCMIfexnEK4AAAAASUVORK5CYII=) 0 0 no-repeat',
      position: 'absolute',
      right: '8px',
      top: '50%',
      marginTop: '-7px',
      width: '14px',
      height: '14px',
      overflow: 'hidden',
      cursor: 'pointer'
    });

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      panel.parentNode.removeChild(panel);
      if (onClose) {
        onClose(id);
      }
    }, false);

    mono.on(btn, 'mouseenter', function(){
      this.style.backgroundPosition = '-15px 0';
    });

    mono.on(btn, 'mouseleave', function(){
      this.style.backgroundPosition = '0 0';
    });

    panel.appendChild(content);
    panel.appendChild(btn);
    document.body.appendChild(panel);
  },

  updatePopup: function() {
    var id = 'savefrom_updatePanel';
    mono.sendMessage({action: 'popupShow', id: id}, function() {
      SaveFrom_Utils.showNotification('Please update me!', id, function(id) {
        mono.sendMessage({action: 'popupClose', id: id});
      });
    });
  },

  tutorial: {
    getYtSlideList: function(type) {
      "use strict";
      var logoImg = 'data:image/png;base64,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';
      var arrowImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAWCAYAAAArdgcFAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAV1JREFUeNpiZNgexQAEhkDcDsQ2QMzNQD74CsRHgLgSiM+zAAkjID4MxFwMlAOQw9yB2BaEmaAupobByABkXjsTNChoAWxYCLl6qX42Q5SkFYb4sufHGKIvTsXreiYGGoJRw4eZ4YzA7P8fXbBFNZTBXEAFzNbhkWGQYBfA0Pji5weGK1+egNknP9xhqLm9GkMNCzYbJz7cyXBW2pZBlkMYp6tAFoLwkx/vcKZ3rMHy+tcnBu+z3Qyf/nzH6+3Pf34weJ3tYngFVE9SmF/+/Jgh9tI0hr///2GVB4nHXJoKVkdWhG56dY6h/OZyrHIVt1aA5SlKLb0PtjHMfrwfRWzOk/0MPfe3Uicp5lxfwLDv7VUwG0RnX1tAdDr/RkjRr39/GMIuTGLY8eYiQ/jFyWA+EeAbKJ3vBDLcaJCHdjFB67tvVDYYZF4lyPBz0NpoFxUsAenfDcR2IHMBAgwACpV16b/HM30AAAAASUVORK5CYII=';

      var arrowObj = {img:{src: arrowImg, width: 16, style: {verticalAlign: 'baseline'}}};
      var logoObj = {img:{src: logoImg, width: 16, style: {verticalAlign: 'baseline'}}};

      var getLink = function(text, href) {
        return {a:{text: text, href: href, target: '_blank', style: {color: '#1795b9'}}}
      };

      var lang = {
        ru: {
          logo: 'Savefrom.net helper',
          s1Title: 'Хорошие новости!',
          s1Main: ['У тебя установлен SaveFrom.net помощник ',logoObj,', и теперь ты можешь скачать любое видео с YouTube в один клик'],
          s1Arrow: ['Хочешь узнать как?',{br:{}},'Нажми здесь'],
          s2Main: 'Чтобы скачать видео, выбери формат и нажми кнопку "Скачать"',
          s3History: 'Просмотренные',
          s3Main: ['Хочешь скачать уже просмотренное видео?',{br:{}},'Нажимай на ', arrowObj,' на превью в Просмотренных видео'],
          s4Main: ['Видео не обязательно просматривать —',{br:{}},'нажимай на ', arrowObj,', выбирай формат и скачивай. Это удобно!'],
          s5Title: 'Приятной работы!',
          s5Main: ['Остались вопросы? Есть предложения? Загляните на ',getLink('страницу поддержки', 'http://savefrom.userecho.com'),' или вступайте в наше ', getLink('ВК-собщество', 'https://vk.com/savefrom_net')]
        },
        en: {
          logo: 'Savefrom.net helper',
          s1Title: 'Good news!',
          s1Main: ['SaveFrom.net Helper ',logoObj,' has been successfully installed and now you can download any video from YouTube in one click'],
          s1Arrow: ['Want to know how?',{br:{}},'Click here'],
          s2Main: 'To download a video choose a format and click the "Download" button',
          s3History: 'History',
          s3Main: ['Do you want to download a video from History?',{br:{}},'Just click ', arrowObj,' on the preview of the previously watched video'],
          s4Main: ['No need to watch a video — just click on ', arrowObj,', choose the quality, and download. Quite easy, isn’t it?'],
          s5Title: 'Enjoy SaveFrom.net Helper!',
          s5Main: ['Still have questions? Want to share your ideas? Welcome to ',getLink('our support page', 'http://savefrom.userecho.com'),' or join us on ', getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn')]
        },
        de: {
          logo: 'Savefrom.net helper',
          s1Title: 'Gute Nachrichten!',
          s1Main: ['SaveFrom.net Helper ',logoObj,' wurde erfolgreich installiert. Jetzt kannst due jedes Video mit einem Klick von YouTube herunterladen'],
          s1Arrow: ['Wie das geht?',{br:{}},'Hier erfährst du es'],
          s2Main: 'Wähle das Format des Videos, das du herunterladen möchtest und klicken auf "Herunterladen"',
          s3History: 'Historie',
          s3Main: ['Du möchtest ein Video aus Historie herunterladen? Klicken einfach in der Vorschau des zuletzt gesehenen Videos auf ', arrowObj],
          s4Main: ['Du musst dir das Video nicht ansehen — klicke einfach auf ', arrowObj, ', wähle die Qualität und lade es herunter. Ganz einfach, oder?'],
          s5Title: 'Viel Spaß mit SaveFrom.net Helper!',
          s5Main: ['Noch Fragen? Vorschläge? Willkommen auf unserer ', getLink('Support-Seite', 'http://savefrom.userecho.com') ,'. Schließe dich uns bei ', getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn') ,' an']
        },
        id: {
          logo: 'Savefrom.net helper',
          s1Title: 'Berita bagus!',
          s1Main: ['SaveFrom.net Helper ',logoObj,' telah berhasil diinstal dan kini Anda dapat mengunduh video apa pun dari YouTube dengan satu klik'],
          s1Arrow: ['Anda ingin tahu caranya?', {br:{}}, 'Klik di sini'],
          s2Main: 'Untuk mengunduh video, pilih suatu format dan klik tombol "Unduh"',
          s3History: 'Riwayat',
          s3Main: ['Apakah Anda ingin mengunduh video dari Riwayat?', {br:{}}, 'Cukup klik ', arrowObj, ' pada pratinjau video yang telah ditonton sebelumnya'],
          s4Main: ['Tidak perlu menonton video — cukup klik pada ', arrowObj, ', pilih mutunya, dan unduh. Cukup mudah, ya?'],
          s5Title: 'Nikmati SaveFrom.net Helper!',
          s5Main: ['Masih punya pertanyaan? Ingin berbagi ide? Selamat datang di ', getLink('halaman dukungan', 'http://savefrom.userecho.com'),' kami atau bergabunglah dengan kami di ', getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn')]
        },
        es: {
          logo: 'Savefrom.net helper',
          s1Title: '¡Excelentes noticias!',
          s1Main: ['SaveFrom.net Helper ', logoObj, ' se instaló con éxito y ahora puedes descargar cualquier video de YouTube con un solo clic'],
          s1Arrow: ['¿Quieres saber cómo?', {br:{}}, 'Haz clic aquí'],
          s2Main: 'Para descargar un video, elige el formato y haz clic en el botón "Descargar"',
          s3History: 'Historial',
          s3Main: ['¿Deseas descargar un video del Historial?', {br:{}}, 'Simplemente haz clic en ', arrowObj, ' en la vista previa del video visto anteriormente.'],
          s4Main: ['No es necesario mirar un video: simplemente haz clic en ', arrowObj, ', elige la calidad y descárgalo. Fácil, ¿verdad?'],
          s5Title: '¡Disfruta de SaveForm.net Helper!',
          s5Main: ['¿Todavía tienes preguntas? ¿Quieres compartir tus ideas? Puedes ir a nuestra ',getLink('página de soporte', 'http://savefrom.userecho.com'),' o unirte a nosotros en ', getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn')]
        },
        tr: {
          logo: 'Savefrom.net helper',
          s1Title: 'Size harika bir haberimiz var!',
          s1Main: ['SaveFrom.net Helper ', logoObj, ' başarıyla kuruldu. Artık tek bir tıklama ile YouTube\'dan istediğiniz videoyu indirebilirsiniz'],
          s1Arrow: ['Nasıl olduğunu öğrenmek ister misiniz? Buraya tıklayın'],
          s2Main: 'Sadece indirmek istediğiniz videonun formatını seçin ve "İndir" butonuna tıklayın',
          s3History: 'Geçmiş',
          s3Main: ['Web geçmişinizdeki videoları indirmek ister misiniz?', {br:{}}, ' Sadece daha önce izlediğiniz bir videonun önizlemesi üzerindeki ', arrowObj, ' simgesine tıklayın'],
          s4Main: ['Videoları izlemenize gerek yok — sadece ', arrowObj, ' simgesine tıklayın, kalite değerini seçin ve anında indirin. Oldukça kolay, değil mi?'],
          s5Title: 'Hemen SaveFrom.net Helper\'in keyfini çıkarmaya başlayın!',
          s5Main: ['Hala kafanıza takılan sorular mı var? Düşüncelerinizi paylaşmak mı istiyorsunuz? ',getLink('Destek sayfamızı', 'http://savefrom.userecho.com'),' ziyaret edin veya ',getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn'),' topluluğumuza katılın']
        },
        fr: {
          logo: 'Savefrom.net helper',
          s1Title: 'Bonnes nouvelles !',
          s1Main: ['SaveFrom.net Helper ', logoObj, ' a été installé avec succès et maintenant vous pouvez télécharger les vidéos de YouTube en un clic'],
          s1Arrow: ['Vous voulez savoir comment ? Cliquez ici'],
          s2Main: 'Pour télécharger une vidéo, choisissez un format et cliquez sur le bouton "Télécharger"',
          s3History: 'Historique',
          s3Main: ['Voulez-vous télécharger une vidéo depuis l’historique ?', {br:{}}, 'Il suffit de cliquer sur ', arrowObj, ' située sur l\'aperçu de la vidéo précédemment regardée'],
          s4Main: ['Pas besoin de regarder une vidéo — il suffit de cliquer sur ', arrowObj, ', faites le choix de la qualité, et télécharger. Facile, est-ce pas ?'],
          s5Title: 'Profitez de SaveFrom.net Helper !',
          s5Main: ['Vous avez encore des questions ? Vous voulez partager vos idées ? Bienvenue sur notre page ',getLink('de d’Aide', 'http://savefrom.userecho.com'),' ou rejoignez-nous sur ', getLink('Facebook', 'https://www.facebook.com/SaveFromNetEn')]
        },
        uk: {
          logo: 'Savefrom.net helper',
          s1Title: 'Добрі новини!',
          s1Main: ['У тебе встановлений SaveFrom.net помічник ', logoObj, ', і тепер ти можеш завантажити будь-яке відео з YouTube в один клік'],
          s1Arrow: ['Прагнеш довідатися як?', {br:{}}, 'Натисни тут'],
          s2Main: 'Щоб завантажити відео, оберіть формат і натисни кнопку "Завантажити"',
          s3History: 'Переглянуті',
          s3Main: ['Хочеш скачати вже переглянуте відео?', {br:{}}, 'Натискай на ', arrowObj, ' на превью в переглянутих відео'],
          s4Main: ['Відео не обов\'язково переглядати —', {br:{}}, 'натискай на ', arrowObj, ', обирай формат і скачуй. Це зручно!'],
          s5Title: 'Приємної роботи!',
          s5Main: ['Залишилися питання? Є пропозиції? Загляньте на ',getLink('сторінку підтримки', 'http://savefrom.userecho.com'),' або вступайте в наш ', getLink('ВК-собщество', 'https://vk.com/savefrom_net')]
        }
      };

      var styleFix = {
        en: {
          s1Main: {
            margin: '0px 17px'
          }
        },
        ru: {
          s2Main: {
            margin: '0px 18px',
            width: 'initial'
          },
          s4Main: {
            top: '228px',
            margin: '0px 16px',
            width: 'initial'
          },
          s5Main: {
            margin: '0 10px'
          }
        },
        de: {
          s1Arrow: {
            right: '28px'
          },
          s3Main: {
            margin: 0,
            width: 'initial',
            top: '228px'
          },
          s4Main: {
            margin: 0,
            width: 'initial',
            top: '228px'
          }
        },
        id: {
          s1Arrow: {
            width: '175px'
          },
          s3Main: {
            margin: '0 6px',
            top: '228px',
            width: 'initial'
          }
        },
        es: {
          s1Arrow: {
            width: '160px'
          },
          s3Main: {
            top: '228px'
          },
          s4Main: {
            margin: '0 14px',
            width: 'initial',
            top: '228px'
          }
        },
        tr: {
          s1Title: {
            fontSize: '32px',
            marginTop: '40px'
          },
          s1Main: {
            marginTop: '-14px'
          },
          s1Arrow: {
            width: '187px'
          },
          s3Main: {
            top: '228px'
          },
          s4Main: {
            top: '228px'
          },
          s5Title: {
            fontSize: '32px',
            marginTop: '40px'
          }
        },
        fr: {
          s3Main: {
            top: '228px'
          },
          s4Main: {
            top: '228px',
            margin: 0,
            width: 'initial'
          },
          s5Main: {
            margin: '0 18px'
          }
        },
        uk: {
          s1Arrow: {
            width: '175px'
          },
          s5Main: {
            margin: '0 18px'
          }
        }
      };

      lang = lang[mono.global.language.lang] || lang.en;
      styleFix = styleFix[mono.global.language.lang] || styleFix.en;

      var slideList = [
        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              style: {
                display: 'block',
                color: '#a4a1a1',
                fontSize: '20px',
                textAlign: 'center',
                margin: '28px 0'
              },
              append: [
                mono.create('img', {
                  style: {
                    verticalAlign: 'middle',
                    marginRight: '18px'
                  },
                  src: logoImg,
                  width: 44
                }),
                lang.logo
              ]
            }),
            mono.create('span', {
              style: mono.extend({
                display: 'block',
                color: '#84bd07',
                fontSize: '40px',
                textAlign: 'center',
                marginBottom: '28px'
              }, styleFix.s1Title),
              text: lang.s1Title
            }),
            mono.create('span', {
              style: mono.extend({
                display: 'block',
                color: '#666',
                fontSize: '25px',
                textAlign: 'center',
                margin: '0 22px'
              }, styleFix.s1Main),
              append: mono.parseTemplate(lang.s1Main)
            }),
            mono.create('span', {
              style: mono.extend({
                position: 'absolute',
                display: 'block',
                textAlign: 'center',
                width: '145px',
                fontSize: '15px',
                color: '#666',
                right: '48px',
                bottom: '10px'
              }, styleFix.s1Arrow),
              append: mono.parseTemplate(lang.s1Arrow)
            }),
            mono.create('img', {
              src: type !== 'black' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAjCAYAAAD48HgdAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAACBklEQVRYw83YTYhNYRgH8N/1MY2PNBtWGrGxkFFTrERZYGGjlNSrZzs2FmZpEvlaiJUasnqbk5TNiAVWLBSaMEgUpiwokQULX2Ms7pm6GaZJzT3nX6dz73ufOr+e99z3fDSKnDdjPToxF+P4hs/4iHd4jfcp4qc2ZV65/4IP+FXiOrEE3diGZWgUOb/FC9zDaIr4MluwxkwLi5yXoqfcNmBxibyGuyniayWwv0CXYwt2owNXMJgixiuF/YHsxX5sxECKuFQLWIlrYA0OYCmOpIiRymEtwHnYgcBVDKWIH5XDWoArcR6vUsS+2sBKXCdOYRH6U8SnWsBK3AIcQxf6/mdaZxt4rsj55Ezr57TRdhC9Rc57Z1I861PZmiLnbgwjpYhn09W2s2NSxBucwEA7jzvjFDlfLnLeOl1NWzvWkrPoryPsDt4VOe+qFay84RzCP68IVXUMbqO7yHlFrWBl14axp1awMhexvch5bq1gKeIhFmLKdFbdMXiq+RxRO9hjrK0jbBSr6wh7ghVFzvNbB9t6dzGZIufDWIXTKWK0yPmW5rLRhUMYqwrWofk034Mz6NX8E/RhBJsqgZW4XtzXfCUxme9YlyKeV7nyP9C8XrbmQop4TvUn/3FMlJ8ncHryh6pX/pe4WX59lCLGagErM1juj7YO1gF2Q/Pl4PWqIVNS5Lzzz7HfNv+X/HfgpHUAAAAASUVORK5CYII=' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAjCAYAAAD48HgdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdNJREFUeNrM2EsoRFEcx/EZw4QkCiuRRylCTbFVFljIQlMeJVuTHSspETtZKDWkpJSVBbFSFhYKaTwXiLGjRBaUt/E9+t+axtDVjHvPrz7NLGamX+fce+ac6wyFQjUOh6MKyXDhHc+4xy2uEMQ13hwWJVFeH3CDDymnSqYjD/XIgROXOMEW9uV7/xInI2b2s9moENVIk5Ir2MSTXcUik4tatMCNJfjlUog9qlgceDCLM7TG4zdjGbFvo48y9Mi0D2HHjqn87YZqRCeWMYdXHYoZKcAUzuH765cT/nEpukCTrH0zyNRlxIykYAQZ6DI7rVYUMzKJO/TZPZWR6YcHHVauY2blIYBSK9cxs/GiGe26TKWRBSShTrdiKhPo1bHYhuzzvLoVe5O/Kp9uxVTWZSOar1sxNWqLaNOtmMo8GmQ7r1WxXaRGm067i6kcyTlCu2IHKNexmDoGluhY7FCusaRoB16rM4hCjMmIqSNflmwmB752vxZvewxu7OIdo1jDOJ6xAZcd2x4jatO4HbGGvaASx3ZeYwH5vwzPtCpl9Z4/WopxKodlVaRITle235VnWJX3e0YpXZYLv7wO23V8+ynqWVxQpvFRpxFTz9W6w0upfAowAMpXzPWPJzeOAAAAAElFTkSuQmCC',
              style: {
                position: 'absolute',
                right: '10px',
                bottom: '2px'
              },
              width: 38,
              height: 35
            })
          ]
        }),

        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              style: {
                display: 'inline-block',
                marginTop: '37px',
                width: '430px',
                position: 'relative'
              },
              append: [
                mono.create('img', {
                  src: 'data:image/png;base64,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',
                  width: 430,
                  height: 219
                }),
                mono.create('span', {
                  text: mono.global.language.download,
                  style: {
                    position: 'absolute',
                    top: '184px',
                    left: '168px',
                    fontSize: '14px',
                    color: '#fff',
                    width: '84px'
                  }
                }),
                mono.create('span', {
                  text: lang.s2Main,
                  style: mono.extend({
                    position: 'absolute',
                    display: 'block',
                    top: '238px',
                    left: '0px',
                    fontSize: '18px',
                    color: '#333',
                    margin: '0 -22px',
                    width: '474px'
                  }, styleFix.s2Main)
                })
              ]
            })
          ]
        }),

        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              style: {
                display: 'inline-block',
                marginTop: '37px',
                width: '430px',
                position: 'relative'
              },
              append: [
                mono.create('img', {
                  src: 'data:image/png;base64,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',
                  width: 430,
                  height: 209
                }),
                mono.create('span', {
                  text: lang.s3History,
                  style: {
                    position: 'absolute',
                    top: '143px',
                    left: '55px',
                    fontSize: '14px',
                    color: '#fff'
                  }
                }),
                mono.create('span', {
                  append: mono.parseTemplate(lang.s3Main),
                  style: mono.extend({
                    position: 'absolute',
                    display: 'block',
                    top: '238px',
                    left: '0px',
                    fontSize: '18px',
                    color: '#333',
                    margin: '0 -22px',
                    width: '474px'
                  }, styleFix.s3Main)
                })
              ]
            })
          ]
        }),

        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              style: {
                display: 'inline-block',
                marginTop: '37px',
                width: '430px',
                position: 'relative'
              },
              append: [
                mono.create('img', {
                  src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAa4AAADRCAYAAACU9lY6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpCMzdBMTc3MDJDM0NFNTExOUVBNEUxMTFGMUJDRTg1QyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCMEU3MDY3MzQwMjAxMUU1QkNGMEQyMjZDODREREUzNyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCMEU3MDY3MjQwMjAxMUU1QkNGMEQyMjZDODREREUzNyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ1OTAzRDM5RkYzRkU1MTE5REQyQUUwQ0M4QzA1OEE3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkIzN0ExNzcwMkMzQ0U1MTE5RUE0RTExMUYxQkNFODVDIi8+IDwvcmRmOkRlc2NyaXB0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',
                  width: 430,
                  height: 209
                }),
                mono.create('span', {
                  append: mono.parseTemplate(lang.s4Main),
                  style: mono.extend({
                    position: 'absolute',
                    display: 'block',
                    top: '238px',
                    left: '0px',
                    fontSize: '18px',
                    color: '#333',
                    margin: '0 -22px',
                    width: '474px'
                  }, styleFix.s4Main)
                })
              ]
            })
          ]
        }),

        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              style: {
                display: 'inline-block',
                width: '430px',
                position: 'relative'
              },
              append: [
                mono.create('span', {
                  style: mono.extend({
                    display: 'block',
                    color: '#84bd07',
                    fontSize: '40px',
                    margin: '67px 0 32px 0'
                  }, styleFix.s5Title),
                  text: lang.s5Title
                }),
                mono.create('span', {
                  style: mono.extend({
                    display: 'block',
                    color: '#333',
                    fontSize: '18px'
                  }, styleFix.s5Main),
                  append: mono.parseTemplate(lang.s5Main)
                }),
                mono.create('span', {
                  style: {
                    display: 'block',
                    color: '#666',
                    fontSize: '14px',
                    marginTop: '50px'
                  },
                  append: [
                    mono.create('img', {
                      style: {
                        verticalAlign: 'middle',
                        marginRight: '11px'
                      },
                      src: logoImg,
                      width: 29
                    }),
                    lang.logo
                  ]
                })
              ]
            })
          ]
        })
      ];

      return slideList;
    },
    getImage: function(type, color) {
      "use strict";
      var img;
      color = color || '#A6A2A3';
      var head = "<?xml version=\"1.0\"?><!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>";
      if (type === 'arrowLeft') {
        img = '<svg height="512px" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><polygon fill="'+color+'" points="352,128.4 319.7,96 160,256 160,256 160,256 319.7,416 352,383.6 224.7,256 "/></svg>';
      } else
      if (type === 'arrowRight') {
        img = '<svg height="512px" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><polygon fill="'+color+'" points="160,128.4 192.3,96 352,256 352,256 352,256 192.3,416 160,383.6 287.3,256 "/></svg>'
      }
      return 'data:image/svg+xml;base64,' + btoa(img);
    },
    setSlide: function(details, index) {
      "use strict";
      index = parseInt(index);
      if (index < 0) {
        index = 0;
      }
      var max = details.slideList.length - 1;
      if (index > max) {
        index = max;
      }

      if (index === 0) {
        details.leftBtn.classList.add('hide');
      } else {
        details.leftBtn.classList.remove('hide');
      }

      if (index === max) {
        details.rightBtn.classList.add('hide');
      } else {
        details.rightBtn.classList.remove('hide');
      }

      var oldDot = details.dotContainer.querySelector('.sf-dot.active');
      var dot = details.dotContainer.querySelector('.sf-dot[data-index="' + index + '"]');

      oldDot && oldDot.classList.remove('active');
      dot.classList.add('active');

      var posLeft = index * details.slide.width;
      details.slider.firstChild.style.marginLeft = (posLeft * -1) + 'px';

      details.index = index;

      if (details.viewSlideList.indexOf(index) === -1) {
        details.viewSlideList.push(index);
      }

      if (details.startTime === 0 && index > 0) {
        details.startTime = Date.now();
      }
    },
    switchSlide: function(details, direct) {
      "use strict";
      var newIndex = details.index;
      if (direct) {
        newIndex++;
      } else {
        newIndex--;
      }

      this.setSlide(details, newIndex);
    },
    onResize: function(details) {
      "use strict";
      var height = window.innerHeight;
      details.box.style.paddingTop = parseInt((height - details.height - details.padding * 2) / 2) + 'px';
      details.box.style.height = height + 'px';
    },
    getLiveTime: function(startTime) {
      "use strict";
      var time = Date.now() - startTime;
      time = parseInt(time / 1000);
      var liveTime = 0;
      if (time < 11) {
        liveTime = time;
      } else
      if (time < 31) {
        liveTime = 15;
      } else
      if (time < 61) {
        liveTime = 30;
      } else
      if (time < 121) {
        liveTime = 60;
      } else
      if (time < 181) {
        liveTime = 90;
      } else {
        liveTime = 180;
      }
      return liveTime;
    },
    sendStat: function(details) {
      "use strict";
      if (!details.trackId) {
        return;
      }
      var viewSlideList = details.viewSlideList;
      viewSlideList.sort();
      var slideList = viewSlideList.join(',');
      mono.sendMessage({action: 'trackEvent', category: 'tutorial', event: 'slides' + details.trackId, label: slideList, params: {tid: 'UA-7055055-11'}});

      if (details.startTime > 0) {
        var liveTime = this.getLiveTime(details.startTime);
        if (liveTime > 0) {
          mono.sendMessage({action: 'trackEvent', category: 'tutorial', event: 'time' + details.trackId, label: liveTime, params: {tid: 'UA-7055055-11'}});
        }
      }
    },
    onClose: function(details) {
      "use strict";
      details.container.removeEventListener('click', details.onBodyClick);
      window.removeEventListener('resize', details._onResize);

      if (details.withOpacity) {
        details.box.style.opacity = 0;
        setTimeout(function() {
          details.box.parentNode.removeChild(details.box);
        }, 500);
      } else {
        details.box.parentNode.removeChild(details.box);
      }

      details.checkExists(function(isExists) {
        !isExists && this.sendStat(details);

        details.onClose && details.onClose();
      }.bind(this));
    },
    getContent: function(details) {
      "use strict";
      var fullWidth = 0;
      var container = mono.create('div', {
        class: 'sf-slider-conteiner'
      });
      details.slideList.forEach(function(data, index) {
        var slide = mono.create('div', {
          data: {
            index: index
          },
          style: {
            display: 'inline-block',
            height: details.slide.height + 'px',
            width: details.slide.width + 'px',
            position: 'relative',
            verticalAlign: 'top',
            textAlign: 'center'
          },
          append: [
            data
          ]
        });
        fullWidth += details.slide.width;
        container.appendChild(slide);
      });

      container.style.width = fullWidth + 'px';
      return [container];
    },
    getDotList: function(details) {
      "use strict";
      var _this = this;
      var nodeList = [];
      var count = details.slideList.length;
      for (var i = 0; i < count; i++) {
        nodeList.push(mono.create('a', {
          class: 'sf-dot',
          data: {
            index: i
          },
          href: '#',
          on: ['click', function(e) {
            e.preventDefault();
            _this.setSlide(details, this.dataset.index);
          }],
          append: mono.create('i')
        }));
      }
      return nodeList;
    },
    onBodyClick: function(details) {
      "use strict";
      details.bodyClickCount++;
      if (details.bodyClickCount < 2) {
        return;
      }

      details._onClose();
    },
    show: function(_details) {
      "use strict";
      var _this = SaveFrom_Utils.tutorial;

      var details = {
        container: document.body,
        width: 564,
        height: 398,
        padding: 8,
        slide: {},
        viewSlideList: [],
        startTime: 0,
        margin: 0
      };

      for (var key in _details) {
        details[key] = _details[key];
      }

      details.width -= details.padding * 2;
      details.height -= details.padding * 2;

      details.slide.width = details.width;
      details.slide.height = details.height - 34;

      details._onResize = mono.debounce((details.onResize || _this.onResize).bind(_this, details), 250);
      details._onClose = _this.onClose.bind(_this, details);
      details.setSlide = _this.setSlide.bind(_this, details);
      details.onBodyClick = _this.onBodyClick.bind(_this, details);
      details.bodyClickCount = 0;

      details.box = mono.create('div', {
        class: 'sf-tutorial-box',
        style: mono.extend({
          position: 'fixed',
          width: '100%',
          textAlign: 'center',
          display: 'block',
          zIndex: 9999999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          top: 0
        }, details.boxStyle),
        append: [
          mono.create('div', {
            class: 'sf-tutorial-container',
            style: mono.extend({
              display: 'inline-block',
              width: details.width + 'px',
              height: details.height + 'px',
              backgroundColor: '#eee',
              fontFamily: 'Arial',
              lineHeight: 'normal',
              borderRadius: '6px',
              textAlign: 'left',
              position: 'relative',
              padding: details.padding + 'px',
              boxShadow: '0 0 25px rgba(0, 0, 0, 0.5)'
            }, details.containerStyle),
            on: ['click', function(e) {
              e.stopPropagation();
            }],
            append: [
              details.slider = mono.create('div', {
                class: 'sf-slider',
                style: mono.extend({
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  height: details.slide.height + 'px',
                  width: details.slide.width + 'px',
                  overflow: 'hidden'
                }, details.slideStyle),
                append: _this.getContent(details)
              }),
              mono.create('div', {
                class: 'sf-contorls',
                style: {
                  position: 'relative'
                },
                append: [
                  details.leftBtn = mono.create('a', {
                    class: ['sf-btn', 'left'],
                    href: '#',
                    style: mono.extend({
                      position: 'absolute',
                      top: '8px',
                      left: 0,
                      width: '16px',
                      height: '27px'
                    }, details.leftBtnStyle),
                    on: ['click', function(e) {
                      e.preventDefault();
                      _this.switchSlide.call(_this, details, 0);
                    }]
                  }),
                  details.dotContainer = mono.create('div', {
                    class: ['sf-dots'],
                    append: _this.getDotList(details)
                  }),
                  details.rightBtn = mono.create('a', {
                    class: ['sf-btn', 'right'],
                    href: '#',
                    style: mono.extend({
                      position: 'absolute',
                      top: '8px',
                      right: 0,
                      width: '16px',
                      height: '27px'
                    }, details.rightBtnStyle),
                    on: ['click', function(e) {
                      e.preventDefault();
                      _this.switchSlide.call(_this, details, 1);
                    }]
                  })
                ]
              }),
              mono.create('a', {
                class: ['sf-btn', 'close'],
                text: 'x',
                href: '#',
                style: mono.extend({
                  display: 'block',
                  position: 'absolute',
                  borderRadius: '9px',
                  right: '10px',
                  top: '10px',
                  backgroundColor: '#ccc',
                  width: '18px',
                  height: '18px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  lineHeight: '16px'
                }, details.closeBtnStyle),
                on: ['click', function(e) {
                  e.preventDefault();
                  details._onClose();
                }]
              })
            ]
          }),
          mono.create('style', {
            text: mono.styleObjToText(mono.extend({
              '': {
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                OUserSelect: 'none',
                userSelect: 'none'
              },
              '.sf-slider .sf-slider-conteiner': {
                transition: 'margin-left 0.5s'
              },
              '.sf-contorls .sf-btn.left': {
                backgroundImage: 'url(' + this.getImage('arrowLeft', details.arrowColor) + ')',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '44px'
              },
              '.sf-contorls .sf-btn.left.hide': {
                display: 'none'
              },
              '.sf-contorls .sf-btn.right': {
                backgroundImage: 'url(' + this.getImage('arrowRight', details.arrowColor) + ')',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '44px'
              },
              '.sf-contorls .sf-btn.right.hide': {
                display: 'none'
              },
              '.sf-contorls .sf-btn.left:hover': {
                backgroundImage: 'url(' + this.getImage('arrowLeft', details.arrowColorActive || '#00b75a') + ')'
              },
              '.sf-contorls .sf-btn.right:hover': {
                backgroundImage: 'url(' + this.getImage('arrowRight', details.arrowColorActive || '#00b75a') + ')'
              },
              '.sf-dots': {
                textAlign: 'center',
                paddingTop: '5px'
              },
              '.sf-dot': {
                display: 'inline-block',
                padding: '8px'
              },
              '.sf-dot i': {
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#a4a1a1'
              },
              '.sf-dot.active i': {
                backgroundColor: '#00b75a'
              }
            }, details.cssStyle), '.sf-tutorial-container')
          })
        ]
      });

      details.setSlide(0);
      (details.onResize || _this.onResize).call(_this, details);

      setTimeout(function() {
        if (details.withOpacity) {
          details.box.style.transition = 'opacity 0.5s';
          details.box.style.opacity = 0;
          details.container.appendChild(details.box);
          setTimeout(function() {
            details.box.style.opacity = 1;
          }, 50);
        } else {
          details.container.appendChild(details.box);
        }
        details.onShow && details.onShow();
      }, details.withDelay);

      window.addEventListener('resize', details._onResize);

      details.container.addEventListener('click', details.onBodyClick);
    }
  },

  bridge: {
    state: false,
    waitList: {},
    init: function() {
      var bridge = SaveFrom_Utils.bridge;
      if (bridge.state) {
        return;
      }
      bridge.state = true;
      var script = document.createElement('script');
      var injectScript = function() {
        window.addEventListener('sf-bridge', function(e) {
          /* fix */
          var data = e.detail;
          var value = undefined;

          var pos = data.indexOf(':');
          var action = data.substr(0, pos);
          var msg = data.substr(pos+1);
          var args = JSON.parse(msg);

          if (action === 'getYtPlayerConfig') {
            data = undefined;
            var ytPlayerConfig = window.ytplayer && window.ytplayer.config;
            if (ytPlayerConfig) {
              data = {
                args: ytPlayerConfig.args,
                sts: ytPlayerConfig.sts,
                assets: ytPlayerConfig.assets
              };
            }
            value = msg + ':' + JSON.stringify(data);
          }

          if (action === 'get-data') {
            var className = args[0];
            var el = document.getElementsByClassName(className)[0];
            el.classList.remove(className);
            var $data = jQuery(el).data();
            if ($data && $data.item) {
              value = $data.item.url;
            }
            value = msg + ':' + JSON.stringify(value);
          }

          if (action === 'getFromStorage') {
            var itemList = args;
            var stData = {};
            for (var i = 0, item; item = itemList[i]; i++) {
              stData[item] = localStorage[item];
            }
            if (typeof cur !== 'undefined') {
              stData.defaultTrack = cur.defaultTrack;
            }
            if (typeof audioPlayer !== "undefined") {
              stData.lastSong = audioPlayer.lastSong;
            }
            value = msg + ':' + JSON.stringify(stData);
          }

          if (action === 'getHtml5video') {
            data = undefined;
            if (window.html5video && window.html5video.vars) {
              data = window.html5video.vars;
            }
            value = msg + ':' + JSON.stringify(data);
          }

          if (action === 'ytVideoSetState') {
            var player = document.querySelector(['#movie_player', '#c4-player']);
            if (args[0] === 'pause') {
              player && player.pauseVideo && player.pauseVideo();
            } else
            if (args[0] === 'play') {
              player && player.playVideo && player.playVideo();
            }
          }

          var event = new CustomEvent('sf-cb-bridge', {detail: action+':'+value});
          window.dispatchEvent(event);
        });
      };
      injectScript = injectScript.toString();
      if (mono.isSafari) {
        var safariFix = function() {
          if (typeof CustomEvent === 'undefined') {
            CustomEvent = function (event, params) {
              params = params || { bubbles: false, cancelable: false };
              var evt = document.createEvent('CustomEvent');
              evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
              return evt;
            };
            CustomEvent.prototype = window.Event.prototype;
          }
        };
        injectScript = injectScript.replace('/* fix */', '('+safariFix.toString()+')();');
      } else
      if (mono.isOpera) {
        injectScript = injectScript.replace('/* fix */', 'var CustomEvent = window.CustomEvent;');
      }
      script.textContent = '('+injectScript+')()';
      document.body.appendChild(script);

      window.addEventListener('sf-cb-bridge', function(e) {
        var data = e.detail;
        var pos = data.indexOf(':');
        var action = data.substr(0, pos);
        var msg = data.substr(pos+1);
        var key = undefined;
        var value = undefined;
        if (['getYtPlayerConfig', 'get-data', 'getFromStorage', 'getHtml5video'].indexOf(action) !== -1) {
          pos = msg.indexOf(':');
          key = action+':'+msg.substr(0, pos);
          try {
            value = JSON.parse(msg.substr(pos + 1));
          } catch (e) {}
        }
        if (bridge.waitList[key]) {
          bridge.waitList[key](value);
          delete bridge.waitList[key];
        }
      });
    },
    send: function(action, detail, cb) {
      var bridge = SaveFrom_Utils.bridge;
      detail = JSON.stringify(detail);
      if (cb) {
        bridge.waitList[action + ':' + detail] = cb;
      }
      mono.trigger(window, 'sf-bridge', {
        detail: action+':'+detail
      });
      if (this.timeout) {
        setTimeout(function() {
          if (!bridge.waitList[action+':'+detail]) {
            return;
          }
          bridge.waitList[action+':'+detail](null);
          delete bridge.waitList[action+':'+detail];
        }, this.timeout);
      }
    }
  }
};

SaveFrom_Utils.tutorialTooltip = {
  getTooltipEl: function(details) {
    "use strict";
    var lang = {
      de: {
        tutorialTooltipText: ['Klicken Sie zum ',{b: {text: 'Download'}},', einfach auf die Schaltfläche']
      },
      en: {
        tutorialTooltipText: ['Just click the button to ',{b: {text: 'download'}}]
      },
      ru: {
        tutorialTooltipText: ['Что бы ',{b: {text: 'скачать'}},', просто кликните по кнопке']
      },
      tr: {
        tutorialTooltipText: [{b: {text: 'İndirmek'}}, ' için sadece butona tıklayın']
      },
      uk: {
        tutorialTooltipText: ['Щоб ',{b: {text: 'скачати'}},', просто клікніть по кнопці']
      },
      id: {
        tutorialTooltipText: ['Cukup klik tombol untuk ',{b: {text: 'mengunduh'}}]
      },
      es: {
        tutorialTooltipText: ['Simplemente haz clic en el botón para ',{b: {text: 'descargar'}}]
      },
      fr: {
        tutorialTooltipText: ['Il suffit de cliquer sur le bouton pour ',{b: {text: 'télécharger'}}]
      }
    };

    lang = lang[mono.global.language.lang] || lang.en;

    var zIndex = (function() {
      var zIndex = 1000;
      var top = document.getElementById('masthead-positioner');
      var styleList = top && window.getComputedStyle(top, null);
      if (styleList) {
        zIndex = parseInt(styleList.getPropertyValue('z-index')) + 1;
      }
      return zIndex;
    })();

    var box = mono.create('div', {
      class: 'sf-tooltip',
      on: ['mouseup', function(e) {
        e.stopPropagation();
      }],
      append: [
        mono.create('span', {
          style: {
            display: 'inline-block',
            border: '8px solid transparent',
            borderRight: '10px solid #4D4D4D',
            borderLeft: 0,
            width: 0,
            top: '8px',
            left: '0px',
            position: 'absolute'
          }
        }),
        mono.create('span', {
          style: {
            display: 'inline-block',
              backgroundColor: '#4D4D4D',
              marginLeft: '10px',
              padding: '10px 10px',
              maxWidth: '220px',
              lineHeight: '16px',
              fontSize: '14px',
              fontFamily: 'font-family: arial, sans-serif',
              color: '#fff'
          },
          append: [
            mono.create('p', {
              style: {
                margin: 0
              },
              append: mono.parseTemplate(lang.tutorialTooltipText)
            }),
            mono.create('a', {
              class: 'sf-button',
              text: 'OK',
              style: {
                display: 'inline-block',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '0 10px',
                cssFloat: 'right',

                marginTop: '5px',
                lineHeight: '20px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#fff',
                fontWeight: 'bolder',
                backgroundColor: '#167AC6'
              },
              on: ['click', (function(e) {
                e.preventDefault();
                details._onClose();
              }).bind(this)]
            }),
            mono.create('style', {
              text: mono.styleObjToText({
                '': {
                  position: 'absolute',
                  zIndex: zIndex + 2
                },
                '.sf-button:hover': {
                  backgroundColor: '#126db3 !important'
                },
                '.sf-button:active': {
                  opacity: 0.9
                }
              }, '.sf-tooltip')
            })
          ]
        })
      ]
    });

    return box;
  },
  onClose: function(details) {
    "use strict";
    details.tooltipEl.parentNode.removeChild(details.tooltipEl);
    window.removeEventListener('resize', details._onResize);
    details.target.removeEventListener('mouseup', details._onClose);

    if (details.startTime > 0) {
      var liveTime = SaveFrom_Utils.tutorial.getLiveTime(details.startTime);
      if (liveTime > 0) {
        mono.sendMessage({action: 'trackEvent', category: 'tutorial', event: 'timeTooltip' + details.trackId, label: liveTime, params: {tid: 'UA-7055055-11'}});
      }
    }

    details.onClose && details.onClose();
  },
  onResize: function(details) {
    "use strict";
    var btn = details.target;
    if (btn.offsetParent === null) {
      return details._onClose();
    }
    var btnPos = SaveFrom_Utils.getPosition(btn, details.tooltipContainer);
    var top = btnPos.top + details.btnTopOffset;
    var left = btnPos.left + btnPos.width + details.btnLeftOffset;
    details.tooltipEl.style.top = top + 'px';
    details.tooltipEl.style.left = left + 'px';
  },
  insert: function(_details) {
    "use strict";
    var details = {
      btnTopOffset: -3,
      btnLeftOffset: 0,
      startTime: Date.now()
    };
    for (var key in _details) {
      details[key] = _details[key];
    }

    details._onResize = mono.debounce(this.onResize.bind(this, details), 250);
    details._onClose = this.onClose.bind(this, details);

    details.tooltipEl = this.getTooltipEl(details);

    details.target.addEventListener('mouseup', details._onClose);

    window.addEventListener('resize', details._onResize);

    this.onResize.call(this, details);

    (function(_this) {
      var count = 20;
      var interval = setInterval(function() {
        _this.onResize.call(this, details);
        count--;
        if (count < 0) {
          clearInterval(interval);
        }
      }, 250);
    })(this);

    document.body.appendChild(details.tooltipEl);
  }
};

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('dailymotion', function(moduleName){
  if (mono.isSafari) {
    if ( !mono.checkUrl(document.URL, [
      'http://dailymotion.*/*',
      'http://*.dailymotion.*/*',
      'https://dailymotion.*/*',
      'https://*.dailymotion.*/*'
      ]) ) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var moduleState = 0;

  var init = function() {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return dailymotion.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        dailymotion.updateLinks();
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleDailymotion) {
        return;
      }
      dailymotion.run();
    });
  };

  var iframe = false;

  if(mono.isIframe()) {
    var m = document.location.href.match(/\/embed\/([\w\-]+)/i);

    if(m && m.length > 1)
    {
      iframe = true;
    }
    else
    {
      return;
    }
  }

  var dailymotion = {
    embed: null,
    title: '',
    styleIndex: 0,
    btnId: 'sf__download_btn',
    panelId: 'sf__download_panel',
    result: null,
    popupIsShow: false,

    run: function()
    {
      moduleState = 1;
      if (iframe) {
        dailymotion.appendIframeButtons();
        return;
      }

      var btnBox = dailymotion.insertBtn();
      if (!btnBox) {
        var count = 0;
        var timer = setInterval(function(){
          count++;
          btnBox = dailymotion.insertBtn();

          if(count > 5 || btnBox) {
            clearInterval(timer);
          }
        }, 1000);
      }

      mono.onUrlChange(function() {
        var exBtn = document.getElementById(dailymotion.btnId);
        if (!exBtn) {
          return dailymotion.insertBtn();
        }

        setTimeout(function () {
          var exBtn = document.getElementById(dailymotion.btnId);
          if (!exBtn) {
            dailymotion.insertBtn();
          }
        }, 1500);
      });

    },
    changeState: function(state) {
      if (iframe) return;
      moduleState = state;
      mono.clearUrlChange();
      dailymotion.rmBtn();
      if (state) {
        dailymotion.run();
      }
    },

    updateLinks: function() {
      dailymotion.result = null;
      dailymotion.insertBtn();
    },

    insertBtn: function() {
      var btnBox = dailymotion.getButtonBox();
      if(btnBox)
      {
        if(dailymotion.styleIndex === 2) {
          dailymotion.showLinks(btnBox, SaveFrom_Utils.getParentByClass(btnBox, 'row'));
        } else {
          dailymotion.showLinks(btnBox);
        }
      }
      return btnBox;
    },

    appendIframeButtons: function()
    {
      var p = undefined,
        b = document.createElement('div'),
        a = document.createElement('a'),
        panel = document.createElement('div');

      a.href = '#';
      a.textContent = language.download.toLowerCase();
      SaveFrom_Utils.setStyle(a, {
        display: 'inline-block',
        color: 'rgba(255,255,255,.9)',
        textDecoration: 'none',
        padding: '5px 10px'
      });
      b.appendChild(a);

      SaveFrom_Utils.setStyle(b, {
        background: 'rgba(0, 0, 0, .4)',
        border: '1px solid rgba(255,255,255,.5)',
        borderRadius: '4px',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        lineHeight: 'normal',
        position: 'absolute',
        top: '5px',
        left: '5px',
        padding: 0,
        margin: 0,
        zIndex: 99999
      });

      panel.id = dailymotion.panelId;
      SaveFrom_Utils.setStyle(panel, {
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
        border: 0,
        display: 'none',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        fontWeight: 'normal',
        lineHeight: 'normal',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        margin: 0,
        padding: '3px',
        zIndex: 99990
      });


      dailymotion.btnBox = document.createElement('div');
      dailymotion.btnBox.style.display = 'none';
      dailymotion.btnBox.appendChild(b);
      dailymotion.btnBox.appendChild(panel);

      mono.off(document, 'mouseenter', dailymotion.onExtPlayerOver);
      mono.off(document, 'mouseleave', dailymotion.onExtPlayerOver);
      mono.on(document, 'mouseenter', dailymotion.onExtPlayerOver);
      mono.on(document, 'mouseleave', dailymotion.onExtPlayerOver);

      a.addEventListener('click', dailymotion.fetchIframeLinks);
      a.addEventListener('click', dailymotion.toggleIframePanel);

      document.body.appendChild(dailymotion.btnBox);
    },

    onExtPlayerOver: function(event) {
      if(event.type == 'mouseenter') {
          dailymotion.btnBox.style.display = 'block';
      } else
      if(event.type == 'mouseleave') {
        dailymotion.btnBox.style.display = 'none';
      }
    },

    fetchIframeLinks: function(e) {
      var a = this;
      var button = e.target;

      if(!dailymotion.result)
      {
        dailymotion.getLinks(document.body.innerHTML, function(links) {
          if (links && links.length > 0) {
            dailymotion.result = dailymotion.handleLinks(links);
            dailymotion.fillIframePanelInfo(dailymotion.result);
            return;
          }
          dailymotion.getEmbedVideoInfo(function(links){
            if(links && links.length > 0) {
              dailymotion.result = dailymotion.handleLinks(links);
              dailymotion.fillIframePanelInfo(dailymotion.result);
            } else {
              dailymotion.result = true;
              dailymotion.fillIframePanelInfo(null);
            }
          });
        });
      }

      button.removeEventListener('click', dailymotion.fetchIframeLinks, false);
      e.preventDefault();
      e.stopPropagation();
      return false;
    },

    toggleIframePanel: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var panel = document.getElementById(dailymotion.panelId);
      if(panel)
      {
        var isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? '' : 'none';

        if (isHidden && [1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'dailymotion', event: 'click', label: 'video-iframe'});
        }
      }
    },

    getButtonBox: function()
    {
      var parent, container;
      // channel page
      container = document.querySelector('#content .pl_user_featured .col-4 ul li');
      if (container) {
        dailymotion.styleIndex = 3;
        return container;
      }
      // prew embed
      linkContainer = document.getElementById('container_player_main');
      if (linkContainer) {
        parent = SaveFrom_Utils.getParentByClass(linkContainer, 'pl_user_featured');
        if (parent) {
          container = parent.querySelector('.col-4 ul li');
          if (container) {
            dailymotion.styleIndex = 3;
            return container;
          }
        }
      }

      // channel page v5
      linkContainer = document.getElementById('js-content');
      if (linkContainer) {
        parent = linkContainer.querySelector('.pl_user_featured');
        if (parent) {
          container = parent.querySelector('.featured-card .mrg-top-md');
          if (container) {
            dailymotion.styleIndex = 3;
            return container;
          }
        }
      }
      // playlist
      linkContainer = document.getElementById('player_container');
      if (linkContainer) {
        parent = document.getElementById('player_tools');
        if (parent) {
          var container = parent.querySelector('#dmpi_video_tools');
          if (container) {
            container = container.firstChild;
            if (container) {
              dailymotion.styleIndex = 4;
              return container;
            }
          }
        }
      }

      var btnBox = document.getElementById('sd_video_tools');
      if(btnBox) {
        if (btnBox.tagName !== 'UL') {
          return;
        }
        return btnBox;
      }
      // single video page
      btnBox = document.querySelector('div.pl_video_infos .sd_user_subscribe');
      if (btnBox) {
        dailymotion.styleIndex = 2;
        return btnBox.parentNode;
      }

      parent = document.querySelector('.video_infos');
      if(parent)
      {
        var box = document.createElement('div');
        btnBox = document.createElement('ul');
        btnBox.style.textAlign = 'right';
        box.appendChild(btnBox);
        parent.appendChild(box);

        dailymotion.styleIndex = 1;
        return btnBox;
      }

      return null;
    },

    hidePopup: function(e) {
      if (dailymotion.popupIsShow === false) {
        return;
      }
      if (e !== undefined) {
        SaveFrom_Utils.embedDownloader.onBodyClick(e);
      } else {
        SaveFrom_Utils.embedDownloader.hidePanel();
        SaveFrom_Utils.embedDownloader.lastLink = null;
      }
      dailymotion.popupIsShow = SaveFrom_Utils.embedDownloader.lastLink !== null;
      if ( dailymotion.popupIsShow === false ) {
        document.removeEventListener('click', dailymotion.hidePopup, true);
      }
    },

    showLinks: function(btnBox, panelParent)
    {
      var oldBtn;
      var panel = dailymotion.createPanel();

      if(!btnBox) {
        if(dailymotion.embed) {
          dailymotion.embed.parentNode.parentNode.parentNode.appendChild(panel);
        } else {
          document.body.insertBefore(panel, document.body.firstChild);
        }
        return;
      }

      if (dailymotion.styleIndex === 3 || dailymotion.styleIndex === 4) {
        oldBtn = document.getElementById(dailymotion.btnId);
        if (oldBtn) {
          oldBtn.parentNode.removeChild(oldBtn);
          oldBtn = null;
        }

        var a = mono.create('a', {
          id: dailymotion.btnId,
          href: '#',
          class: 'btn',
          title: language.download,
          style: {
            display: 'inline-block',
            height: '25px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '12px',
            backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#808080')+')'
          },
          append: [
            !mono.isOpera ? undefined : mono.create('img', {
              src: SaveFrom_Utils.svg.getSrc('download', '#808080'),
              style: {
                width: '12px',
                height: '12px',
                marginBottom: '2px'
              }
            })
          ]
        });
        if (dailymotion.styleIndex === 3) {
          a.style.cssFloat = 'left';
          a.style.marginTop = '4px';
          a.style.marginRight = '10px';
        }
        if (dailymotion.styleIndex === 4) {
          a.style.marginLeft = '2px';
          a.style.marginRight = '-2px';
          a.style.verticalAlign = 'top';
        }

        a.addEventListener('click', function(e) {
          e.preventDefault();

          var video_obj, id;
          if (dailymotion.styleIndex === 3) {
            if (video_obj = document.getElementById('container_player_main')) {
              var param = video_obj.querySelector('param[name="flashvars"]');
              if (param) {
                var data = param.getAttribute('value') || '';
                var fragment = decodeURIComponent(data.substr(data.indexOf('media_id'), 100));
                var pos = fragment.indexOf(',');
                var pos2 = fragment.indexOf(':') + 2;
                id = fragment.substr(pos2, pos - pos2 - 1);
                this.setAttribute('data-savefrom-get-links', document.location.protocol + '//dailymotion.com/video/' + id);
              } else {
                var iframe = video_obj;
                this.setAttribute('data-savefrom-get-links', iframe.getAttribute('src'));
              }
            } else
            if (video_obj = document.querySelector('#playerv5_box #player embed')) {
              var falshvars = video_obj.getAttribute('flashvars');
              var params = mono.parseUrlParams(falshvars, {forceSep: '&', useDecode: 1, argsOnly: 1});
              if (params.config) {
                try {
                  params = JSON.parse(params.config);
                  this.dataset.savefromGetLinks = params.metadata.url;
                } catch(e) {}
              }
            } else {
              // v5 player
              var videoLink = document.querySelector('.featured-card h2 a');
              videoLink = videoLink && videoLink.href;
              if (videoLink) {
                if (videoLink.substr(0, 2) === '//') {
                  videoLink = document.location.protocol + videoLink;
                } else
                if (videoLink[0] === '/') {
                  videoLink = document.location.origin + videoLink;
                }
                this.dataset.savefromGetLinks = videoLink;
              }
            }
          } else
          if (dailymotion.styleIndex === 4) {
            var linkId = btnBox.querySelector('a[data-video-xid]');
            if (linkId) {
              id = linkId.getAttribute('data-video-xid');
            } else {
              id = undefined;
            }
            this.setAttribute('data-savefrom-get-links', document.location.protocol+'//dailymotion.com/video/' + id);
          }


          dailymotion.popupIsShow = true;
          SaveFrom_Utils.embedDownloader.onClick(e);
          document.removeEventListener('click', dailymotion.hidePopup, true);
          document.addEventListener('click', dailymotion.hidePopup, true);

          if ([1].indexOf(preference.cohortIndex) !== -1) {
            if (dailymotion.styleIndex === 4) {
              mono.sendMessage({action: 'trackCohort', category: 'dailymotion', event: 'click', label: 'video-playlist'});
            } else {
              mono.sendMessage({action: 'trackCohort', category: 'dailymotion', event: 'click', label: 'video-chennal'});
            }
          }
        });

        if(dailymotion.styleIndex === 4) {
          btnBox.appendChild(a);
        } else {
          btnBox.insertBefore(a, btnBox.firstChild);
        }
        return;
      }

      panel.style.display = 'none';
      panel.style.textAlign = 'center';

      var oldPanel = document.getElementById(dailymotion.panelId);
      if (oldPanel) {
        oldPanel.parentNode.removeChild(oldPanel);
        oldPanel = null;
      }
      var panelContainer = panelParent || btnBox;
      panelContainer.parentNode.insertBefore(panel, panelContainer.nextElementSibling);

      oldBtn = document.getElementById(dailymotion.btnId);
      if (oldBtn) {
        if (oldBtn.tagName === 'A') {
          oldBtn = oldBtn.parentNode;
        }
        oldBtn.parentNode.removeChild(oldBtn);
        oldBtn = null;
      }

      if(dailymotion.styleIndex === 2)
      {
        var li = a = document.createElement('div');
        a.id = dailymotion.btnId;
        a.className = 'button';
        a.style.lineHeight = '30px';
        a.style.padding = '0 5px';
        a.style.verticalAlign = 'top';
      } else  {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.id = dailymotion.btnId;
        a.className = 'dmco_simplelink button linkable';

        a.style.fontWeight = 'bold';
        a.href = '#';
        a.textContent = language.download;

        li.appendChild(a);
      }

      if(dailymotion.styleIndex > 0)
      {
        var icon = document.createElement('img');
        icon.src = SaveFrom_Utils.svg.getSrc('download', '#808080');
        icon.title = language.download;
        SaveFrom_Utils.setStyle(icon, {
          width: '12px',
          height: '12px',
          verticalAlign: 'middle',
          opacity: '0.9'
        });
        a.appendChild(icon);
        a.appendChild(document.createTextNode(' ' +
          language.download));
      }

      a.addEventListener('click', function(event){
        var a = this;

        if(!dailymotion.result)
        {
          var video = []; //dailymotion.getVideoInfo();
          if(video && video.length > 0)
          {
            dailymotion.result = dailymotion.handleLinks(video);
            if(dailymotion.result)
              dailymotion.fillPanelInfo(dailymotion.result);
          }
          else
          {
            dailymotion.getEmbedVideoInfo(function(links){
              if(links && links.length > 0)
              {
                dailymotion.result = dailymotion.handleLinks(links);
                dailymotion.fillPanelInfo(dailymotion.result);
              }
              else
              {
                dailymotion.result = true;
                dailymotion.fillPanelInfo(null);
              }
            });
          }
        }

        var isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? '' : 'none';

        event.preventDefault();
        event.stopPropagation();

        if (isHidden && [1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'dailymotion', event: 'click', label: 'video-single'});
        }

        return false;
      }, false);

      btnBox.appendChild(li);
    },

    rmBtn: function() {
      var btnList = document.querySelectorAll(['#'+dailymotion.btnId, '#'+dailymotion.panelId]);
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
      dailymotion.result = null;
      dailymotion.popupIsShow = false;
      SaveFrom_Utils.embedDownloader.hidePanel();
      SaveFrom_Utils.embedDownloader.lastLink = null;
    },

    createPanel: function()
    {
      return mono.create('div', {
        id: dailymotion.panelId,
        text: language.download + ': ',
        style: {
          background: '#fff',
          fontSize: '17px',
          padding: '5px 0'
        }
      });
    },


    fillPanelInfo: function(result)
    {
      var p = document.getElementById(dailymotion.panelId);
      if(!p)
        return;

      SaveFrom_Utils.emptyNode(p);
      p.appendChild(document.createTextNode(language.download + ': '));

      if(!result || !result.length)
      {
        p.appendChild(document.createTextNode(language.noLinksFound));
        return;
      }

      var sStyle = {
        fontSize: '75%',
        fontWeight: 'normal',
        marginLeft: '3px',
        whiteSpace: 'nowrap'
      };

      var fsIconStyle = {};

      var fsTextStyle = {
        position: 'relative',
        top: '-1px'
      };

      var color = '', sep = false;
      for(var i = 0; i < result.length; i++)
      {
        if(sep)
          p.appendChild(document.createTextNode(' '));

        var a = document.createElement('a');
        a.href = result[i][0];
        a.title = language.downloadTitle;

        if(dailymotion.title)
        {
          a.setAttribute('download', mono.fileName.modify(
            dailymotion.title + '.' + result[i][2].toLowerCase()));

          a.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
        }

        a.textContent = result[i][2];
        a.style.margin = '0 0 0 10px';

        if(result[i][1])
        {
          var s = document.createElement('span');
          s.textContent = result[i][1];
          SaveFrom_Utils.setStyle(s, sStyle);
          a.appendChild(s);
        }

        p.appendChild(a);
        sep = true;

        SaveFrom_Utils.appendFileSizeIcon(a, fsIconStyle, fsTextStyle);

        if(!color)
          color = SaveFrom_Utils.getStyle(a, 'color');
      }

      if(result.length > 0)
      {
        if(preference.moduleShowDownloadInfo === 1)
        {
          if(!color)
            color = 'blue';

          p.appendChild(document.createElement('br'));
          SaveFrom_Utils.appendDownloadInfo(p, color, null, {
            width: '16px',
            height: '16px',
            fontSize: '16px',
            lineHeight: '16px'
          });
        }
      }
    },

    fillIframePanelInfo: function(result)
    {
      var p = document.getElementById(dailymotion.panelId);
      if(!p)
        return;

      SaveFrom_Utils.emptyNode(p);

      if(!result || !result.length)
      {
        p.appendChild(document.createTextNode(language.noLinksFound));
        p.style.paddingTop = '11px';
        p.style.paddingBottom = '11px';
        return;
      }

      var sStyle = {
        fontSize: '75%',
        fontWeight: 'normal',
        marginLeft: '3px',
        whiteSpace: 'nowrap',
        color: '#fff'
      };

      var fsIconStyle = {
        color: '#fff',
        opacity: 0.5
      };

      var fsTextStyle = {
        position: 'relative',
        top: '-1px'
      };

      var item = document.createElement('div');
      item.style.marginTop = '8px';
      item.style.marginBottom = '8px';
      item.style.paddingLeft = '70px';
      item.style.paddingRight = '70px';
      p.appendChild(item);
      var color = '', sep = false;
      for(var i = 0; i < result.length; i++)
      {
        if(sep)
          item.appendChild(document.createTextNode(' '));

        var a = document.createElement('a');
        a.href = result[i][0];
        a.title = language.downloadTitle;

        if(dailymotion.title)
        {
          a.setAttribute('download', mono.fileName.modify(
              dailymotion.title + '.' + result[i][2].toLowerCase()));

          a.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
        }

        a.textContent = result[i][2];
        a.style.margin = '0 0 0 10px';
        a.style.color = '#fff';

        if(result[i][1])
        {
          var s = document.createElement('span');
          s.textContent = result[i][1];
          SaveFrom_Utils.setStyle(s, sStyle);
          a.appendChild(s);
        }

        item.appendChild(a);
        sep = true;

        SaveFrom_Utils.appendFileSizeIcon(a, fsIconStyle, fsTextStyle);

        if(!color)
          color = SaveFrom_Utils.getStyle(a, 'color');
      }

      if(result.length > 0)
      {
        if(preference.moduleShowDownloadInfo === 1)
        {
          if(!color)
            color = 'blue';

          SaveFrom_Utils.appendDownloadInfo(p, color, null, {
            width: '16px',
            height: '16px',
            fontSize: '16px',
            lineHeight: '16px'
          });
        }
      }
    },


    handleLinks: function(video)
    {
      var result = [];
      var links = null;

      if(typeof(video) == 'object')
        links = video;
      else
        links = video.split('||');

      if(links && links.length > 0)
      {
        for(var i = 0; i < links.length; i++)
        {
          links[i] = links[i].replace(/\\\//g, '/');
          links[i] = links[i].replace(/\@\@[\w\-]+$/, '');
          var size = '';
          var t = links[i].match(/\/cdn\/\w+\-(\d+x\d+)\//i);
          if(t && t.length > 1)
          {
            size = t[1];
          }
          else
          {
            t = links[i].match(/\D(\d+x\d+)\D/i);
            if(t && t.length > 1)
            {
              size = t[1];
            }
          }

          var ext = 'FLV';
          var t = links[i].match(/\.(\w{1,6})(?:$|\?)/);
          if(t && t.length > 1)
          {
            ext = t[1].toUpperCase();
          }

          if(size !== '80x60')
          {
            var height = parseInt(size.split('x').slice(-1)[0]);
            result.push([links[i], height, ext]);
          }
        }
      }

      if(!result)
      {
        return null;
      }

      var sort = function(a, b){
        a = parseInt(a[1]);
        a = isNaN(a) ? 0 : a;
        b = parseInt(b[1]);
        b = isNaN(b) ? 0 : b;
        return a - b;
      };

      result.sort(sort);
      return result;
    },


    getLinks: function(text, cb)
    {
      var links = [];
      var info = SaveFrom_Utils.getMatchFirst(text,
        /(?:var|,)\s*info\s*=\s*\{(.*?)\}\s*(?:;|,\s*\w+\s*=)/i);

      if(!info) {
        return cb();
      }
      try
      {
        info = JSON.parse('{' + info + '}');
        if(info)
        {
          dailymotion.title = info.title;
          for(var i in info)
          {
            if (!info.hasOwnProperty(i)) {
              continue;
            }
            if (typeof info[i] !== 'string') {
              continue;
            }
            if(info[i].search(/^https?:\/\/[^\s\"]+\.(mp4|flv)(\?|$)/) > -1)
            {
              links.push(info[i]);
            }
          }
        }
      }
      catch(e){}
      cb(links);
    },

    getEmbedVideoInfo: function(callback)
    {
      if(location.pathname)
      {
        var url = location.pathname;
        if (!iframe) {
            url = "/embed" + url;
        }
        url =  location.protocol + '//' +  location.host + url;
        mono.sendMessage({action: 'getDailymotionEmbedVideoInfoMsg', url: url}, function(data) {
          if (data === undefined) {
            return callback();
          }
          dailymotion.title = data.title;
          data = data.links;
          callback(data);
        });
        return;
      }

      callback();
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('facebook', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://facebook.com/*',
      'http://*.facebook.com/*',
      'https://facebook.com/*',
      'https://*.facebook.com/*'
    ])) {
      return;
    }
  }


  var language = {};
  var preference = {};
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return fb.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        fb.updateLinks();
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleFacebook) {
        return;
      }
      fb.run();
    });
  };

  if (mono.isIframe()) {
    return;
  }

  var fb = {
    className: 'savefrom_fb_download',

    run: function()
    {
      moduleState = 1;
      var _this = this;

      var photoContainer = document.getElementById('imagestage');
      if ( photoContainer ) {
        var img = photoContainer.querySelector('img.fbPhotoImage');
        if (img) {
          photo.addCurrentDlBtn(img);
        }
        img = null;
      }
      photoContainer = null;

      mono.onUrlChange(function() {
        _this.updateLinks();
      }, 1);
    },

    changeState: function(state) {
      moduleState = state;
      mono.clearUrlChange();
      externalMedia.disable();
      photo.rmCurrentPhotoBtn();
      photo.rmDataAttrs();
      videoFeed.rmBtn();
      video.rmBtn();
      if (state) {
        fb.run();
      }
    },


    updateLinks: function()
    {
      this.removeDownloadLinks();
      video.showLinks();

      externalMedia.run();

      SaveFrom_Utils.addStyleRules('.' + SaveFrom_Utils.embedDownloader.linkClass + ' img', {
        opacity: '.5'
      });

      SaveFrom_Utils.embedDownloader.init();
    },


    removeDownloadLinks: function()
    {
      var selector = 'a.' + this.className +
        ',div.' + this.className +
        ',span.' + this.className;

      var e = document.querySelectorAll(selector);
      for(var i = e.length-1; i >= 0; i--)
        e[i].parentNode.removeChild(e[i]);
    }
  };

  var externalMedia = {
    linkDataAttr: 'savefromEd',
    timer: 0,
    lastLink: null,

    re: [
      /https?:\/\/(?:[a-z]+\.)?youtube\.com\/(?:#!?\/)?watch\?[^\s\"\'\<\>]*v=([\w\-]+)/i,
      /https?:\/\/(?:[a-z0-9]+\.)?youtube\.com\/(?:embed|v)\/([\w\-]+)/i,
      /https?:\/\/(?:[a-z]+\.)?youtu\.be\/([\w\-]+)/i,
      /https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/(\d+)(?:\?|$)/i
    ],

    thumbnail: {
      youtube: {
        re: [/ytimg\.com(?:\/|%2F)vi(?:\/|%2F)([\w\-]+)(?:\/|%2F)/i],
        url: 'http://www.youtube.com/watch?v={vid}'
      }
    },

    disable: function() {
      mono.off(document, 'mouseenter', this.onLinkHover, true);
      mono.off(document, 'mouseleave', this.onLinkHover, true);
    },

    run: function() {
      mono.off(document, 'mouseenter', this.onLinkHover, true);
      mono.off(document, 'mouseleave', this.onLinkHover, true);

      mono.on(document, 'mouseenter', this.onLinkHover, true);
      mono.on(document, 'mouseleave', this.onLinkHover, true);
    },


    onLinkHover: function(event) {
      var link = event.target;

      if (mono.isOpera) {
        if (link.id === 'fbPhotoSnowliftTagBoxes') {
          link = link.previousElementSibling;
        }
      }
      if (link.tagName === 'IMG') {
        if (link.classList.contains('spotlight') && link.getAttribute('aria-describedby') === 'fbPhotosSnowliftCaption') {
          return photo.addCurrentDlBtn(link);
        }
      }

      if (['EMBED', 'VIDEO'].indexOf(link.tagName) !== -1) {
        videoFeed.onLinkHover.call(link, event);
        return;
      }

      if(link.tagName !== 'A') {
        link = link.parentNode;
        if(!link || link.tagName !== 'A') {
          return;
        }
      }

      var attr = link.dataset[externalMedia.linkDataAttr];

      if (event.type === 'mouseenter') {
        if (attr) {
          clearTimeout(externalMedia.timer);
          return;
        }

        if (externalMedia.handle(link)) {
          if(externalMedia.lastLink && externalMedia.lastLink != link)
            externalMedia.removeBtn(externalMedia.lastLink);

          SaveFrom_Utils.embedDownloader.hidePanel();
          externalMedia.lastLink = link;
        }

        return;
      }

      if (attr) {
        clearTimeout(externalMedia.timer);
        externalMedia.timer = setTimeout(function(){
          externalMedia.removeBtn(link);
        }, 1500);
      }
    },

    removeBtn: function(link)
    {
      if(!link || typeof(link) != 'object')
        return;

      var btn = link.querySelector('.' + fb.className);
      if(btn)
      {
        btn.parentNode.removeAttribute(mono.dataAttr2Selector(externalMedia.linkDataAttr));
        btn.parentNode.removeChild(btn);
      }

      link.removeAttribute(mono.dataAttr2Selector(externalMedia.linkDataAttr));

      if(link == this.lastLink)
        this.lastLink = null;
    },


    checkUrl: function(url, retry)
    {
      if(!retry && url.search(/https?:\/\/([\w\-]+\.)?facebook\.com\/l\.php/i) > -1)
      {
        return this.checkUrl(decodeURIComponent(url), true);
      }

      for(var i = 0, l = this.re.length; i < l; i++)
      {
        var m = url.match(this.re[i]);
        if(m && m.length > 0)
          return m[0];
      }
    },


    handle: function(link)
    {
      var img = link.querySelector('img');
      if(img)
      {
        var parent = img.parentNode;
        if(img.src && SaveFrom_Utils.getStyle(parent, 'position') == 'relative')
        {
          var ajaxify = link.getAttribute('ajaxify');

          if(ajaxify && ajaxify.search(/\/flash\/expand_inline/i) > -1)
          {
            var url = this.getThumbnailUrl(img.src);
            if(url)
            {
              return this.createButton(url, parent, link, {
                display: 'block',
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                zIndex: 9999,
                margin: 0,
                width: '16px',
                height: '16px'
              }, {
                display: 'block'
              });
            }
          }
          else if(this.checkUrl(link.href))
          {
            return this.createButton(link.href, parent, link, {
              display: 'block',
              position: 'absolute',
              bottom: '3px',
              right: '3px',
              zIndex: 9999,
              margin: 0,
              width: '16px',
              height: '16px'
            }, {
              display: 'block'
            });
          }
        }

        return false;
      }

      return this.createButton(link.href, link, link);
    },


    getThumbnailUrl: function(url)
    {
      for(var i in this.thumbnail)
      {
        for(var j = 0; j < this.thumbnail[i].re.length; j++)
        {
          var vid = SaveFrom_Utils.getMatchFirst(url, this.thumbnail[i].re[j]);
          if(vid)
            return this.thumbnail[i].url.replace(/\{vid\}/ig, vid);
        }
      }

      return '';
    },


    createButton: function(url, parent, link, styleParent, styleIcon)
    {
      url = this.checkUrl(url);
      if(!url)
        return false;

      var btn = document.createElement('a');
      btn.className = fb.className;
      btn.href = 'http://savefrom.net/?url=' + encodeURIComponent(url);
      btn.setAttribute(SaveFrom_Utils.embedDownloader.dataAttr, url);
      btn.title = language.download;

      btn.addEventListener('mousedown', function() {
        if ([1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'facebook', event: 'click', label: 'video-feed'});
        }
      });

      SaveFrom_Utils.setStyle(btn, {
        marginLeft: '7px',
        verticalAlign: 'middle'
      });

      if(styleParent)
        SaveFrom_Utils.setStyle(btn, styleParent);

      var icon = document.createElement('img');
      icon.className = 'icon';
      icon.src = SaveFrom_Utils.svg.getSrc('download', '#a2db16');
      SaveFrom_Utils.setStyle(icon, {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        verticalAlign: 'middle',
        //opacity: '0.9',
        cursor: 'pointer'
      });

      if(styleIcon)
        SaveFrom_Utils.setStyle(icon, styleIcon);

      btn.appendChild(icon);

      link.dataset[this.linkDataAttr] = 1;
      parent.appendChild(btn);

      return true;
    }
  };


  var video = {
    popupMenu: undefined,
    getParent: function()
    {
      return document.querySelector('.videoStage');
    },


    getLinks: function(parent, callback) {
      "use strict";
      var count = 0, _this = this;

      var func = function() {
        var embed = parent.querySelector('embed');
        if(embed) {
          return _this.getLinksFromEmbed(embed, callback.bind(this));
        }

        var video = parent.querySelector('video');
        if(video) {
          return _this.getLinksFromVideo(video, function(links) {
            callback.call(this, links);
          });
        }

        embed = null;
        video = null;

        count++;
        if(count > 10) {
          callback.call(_this, null);
        }

        setTimeout(func, 1000);
      };

      setTimeout(func, 1000);
    },


    getLinksFromEmbed: function(embed, cb) {
      if(!embed) {
        return cb(null);
      }

      var fv = embed.getAttribute('flashvars');
      if(fv === null) {
        return cb(null);
      }

      var params = mono.parseUrlParams(fv).params;
      if (params === undefined) {
        return cb(null);
      }

      try {
        params = JSON.parse(decodeURIComponent(params));
      } catch (e) {
        return cb(null);
      }
      if(!params || !params.video_data) {
        return cb(null);
      }

      var videoData = params.video_data;

      var links = {};
      for (var i = 0, item; item = videoData[i]; i++) {
        if (item.sd_src) {
          links[item.sd_src] = 'SD';
        }
        if (item.hd_src) {
          links[item.hd_src] = 'HD';
        }
      }

      return cb(links);
    },

    requestVideoLinks: function(videoid, cb) {
      "use strict";
      mono.sendMessage({
        action: 'getFacebookLinks',
        extVideoId: videoid
      }, function(response) {
        if (!response) {
          cb();
        } else {
          cb(response.links, response.title);
        }
      });
    },

    getLinksFromVideo: function(video, cb) {
      "use strict";
      if(!video) {
        return cb(null);
      }

      var links = {};

      var url = document.URL;
      var id;
      SaveFrom_Utils.embedDownloader.hostings.facebook.re.some(function(reg) {
        var _id;
        if (_id = url.match(reg)) {
          id = _id && _id[1];
          return true;
        }
      });
      if (!id) {
        var parent = mono.getParentByClass(video, 'userContentWrapper');
        parent = parent && parent.querySelectorAll('a.profileLink, a[rel="theater"]');
        if (parent && parent.length > 0) {
          parent = [].slice.call(parent);
          parent.some(function(item) {
            item = (item.href || '').match(/\/videos\/(\d+)/);
            item = item && item[1];
            if (item) {
              id = item;
              return true;
            }
          });
        }
      }
      id && (links.id = id);

      if(video.src) {
        var ext = SaveFrom_Utils.getFileExtension(video.src, 'mp4');
        links[video.src] = ext.toUpperCase();
      }

      var src = video.querySelectorAll('source');
      if(src && src.length > 0) {
        for(var i = 0; i < src.length; i++)
        {
          var ext = SaveFrom_Utils.getFileExtension(src[i].src, 'mp4');
          links[src[i].src] = ext.toUpperCase();
        }
      }

      return cb(links);
    },


    showLinks: function() {
      "use strict";
      var parent = this.getParent();
      if(!parent)
        return;

      var _this = this;
      this.getLinks(parent, function(links){
        _this.appendLinks(links, parent);
      });
    },


    getFileName: function(url) {
      var name = SaveFrom_Utils.getFileName(url);
      if(name)
        return name;

      var d = SaveFrom_Utils.dateToObj();
      var dateStr = d.year + '-' + d.month + '-' + d.day + '_' +
        d.hour + '-' + d.min;

      return 'facebook_' + dateStr + '.' +
        SaveFrom_Utils.getFileExtension(url, 'mp4');
    },

    prepareLinks: function(links, _title) {
      var menuLinks = [];
      for (var url in links) {
        var title = this.getFileName(url);
        var extPos = title.lastIndexOf('.');
        var ext = title.substr(extPos+1);
        title = _title || title.substr(0, extPos);
        var format = ext.toUpperCase();

        var quality = links[url];
        var popupLink = { href: url, title: title, format: format, quality: quality, forceDownload: true };
        menuLinks.push(popupLink);
      }
      if (menuLinks.length === 0) {
        menuLinks = language.noLinksFound;
      }
      return menuLinks;
    },

    appendLinks: function(links, parent)
    {
      if(!links)
        return;

      var box = SaveFrom_Utils.getElementByIds(['fbPhotoPageMediaInfo',
        'fbPhotoSnowliftMediaTitle']);

      if (box === null) return;

      var type = 0;
      var title;
      if (box.id === 'fbPhotoPageMediaInfo') {
        title = document.querySelector('h2.uiHeaderTitle');
        if (title) {
          title = title.textContent;
        }
        type = 1;
      } else
      if (box.id === 'fbPhotoSnowliftMediaTitle') {
        title = document.querySelector('.fbPhotoSnowliftContainer');
        if (title) {
          title = title.querySelector('span.fbPhotoSnowliftVideoTitle')
        }
        if (title) {
          title = title.textContent;
        }
        type = 2;
      }

      if(!box || box.querySelector('.' + fb.className))
        return;

      var panel = document.createElement('div');
      panel.className = fb.className;

      var button;
      panel.appendChild(
        button = mono.create('div', {
          title: language.download,
          style: {
            display: 'inline-block',
            width: '16px',
            height: '16px',
            backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#a2db16')+')',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            verticalAlign: 'middle',
            cursor: 'pointer'
          }
        })
      );

      button.addEventListener('click', function() {
        var menu;
        if (menu = video.popupMenu) {
          menu.hide();
        }

        menu = videoFeed.popupMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', fb.className + '_popup');

        if (links.id) {
          var id = links.id;
          delete links.id;
          video.requestVideoLinks(id, function(_links, title) {
            var popupMenuLinks;
            if (_links) {
              popupMenuLinks = SaveFrom_Utils.popupMenu.prepareLinks.facebook(_links, title);
            } else {
              popupMenuLinks = video.prepareLinks(links);
            }
            menu.update(popupMenuLinks);
          });
        } else {
          var popupMenuLinks = video.prepareLinks(links, title);
          menu.update(popupMenuLinks);
        }

        if ([1].indexOf(preference.cohortIndex) !== -1) {
          if (type === 1) {
            mono.sendMessage({action: 'trackCohort', category: 'facebook', event: 'click', label: 'video-single'});
          } else {
            mono.sendMessage({action: 'trackCohort', category: 'facebook', event: 'click', label: 'video-player'});
          }
        }
      });

      if(box.id == 'fbPhotoSnowliftMediaTitle')
      {
        panel.style.display = 'inline';
        panel.style.marginRight = '5px';
        panel.style.lineHeight = '33px';
        box.insertBefore(panel, box.firstChild);
      }
      else
      {
        box.appendChild(panel);
      }

      box = null;
      panel = null;
      button = null;
    },
    rmBtn: function() {
      var btnList = document.querySelectorAll('.'+fb.className);
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
      if (video.popupMenu) {
        video.popupMenu.hide();
      }
    }
  };

  var photo = {
    getFilenameFromUrl: function(url) {
      return SaveFrom_Utils.getMatchFirst(url, /\/([^\/]+\.[a-z0-9]{3,4})(?:\?|$)/i);
    },
    getPhotoId: function() {
      var params = mono.parseUrlParams(location.href);
      return params.fbid;
    },
    onGetPhotoUrl: function(url, container, onGetUrl) {
      if (!url) {
        var img = container.querySelector('img.spotlight') || container.querySelector('img.fbPhotoImage');
        if (!img) {
          return onGetUrl();
        }
        url = img.src;
      }
      if (!url) {
        return onGetUrl();
      }

      if (url.indexOf('dl=1') === -1) {
        if (url.indexOf('?') === -1) {
          url += '?dl=1'
        } else {
          url += '&dl=1'
        }
      }
      onGetUrl(url);
    },
    rmCurrentPhotoBtn: function(insertContainer) {
      if (this.photoMenu !== undefined) {
        this.photoMenu.hide();
      }
      var exBtn = undefined;
      var imgList = document.querySelectorAll('.sf-dl-current-photo-btn');
      for (var i = 0, imgItem; imgItem = imgList[i]; i++) {
        if (!insertContainer || !insertContainer.contains(imgItem)) {
          imgItem.parentNode.removeChild(imgItem);
        } else {
          exBtn = imgItem;
        }
      }
      return exBtn;
    },
    addDlCurrentPhotoBtn: function(container) {
      var exBtn = this.rmCurrentPhotoBtn(container);
      if (exBtn) {
        return;
      }
      var _this = this;

      container.appendChild(mono.create('a', {
        class: 'sf-dl-current-photo-btn',
        href: '#',
        title: language.download,
        on: ['click', function(e) {
          e.stopPropagation();
          e.preventDefault();

          var onKeyDown = function(e) {
            if (e.keyCode === 18 || e.keyCode === 17) return;
            menu.hide();
            document.removeEventListener('keydown', onKeyDown);
          };
          var menu = _this.photoMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', "photoDlMenu", {
            parent: container,
            onShow: function() {
              document.addEventListener('keydown', onKeyDown);
            },
            onHide: function() {
              document.removeEventListener('keydown', onKeyDown);
            }
          });

          var onGetUrl = function(link) {
            if (!link) {
              return menu.update(language.noLinksFound);
            }
            var photoFileName = mono.fileName.modify(photo.getFilenameFromUrl(link));
            var dotPos = photoFileName.lastIndexOf('.');
            var photoExt = photoFileName.substr(dotPos+1);
            var photoTitle = photoFileName.substr(0, dotPos);
            menu.update([{href: link, title: photoTitle, quality: language.download,
              format: ' ', ext: photoExt, isBank: true, func: function() {
                menu.hide();
              }}]);
          };

          var fbid = photo.getPhotoId();
          if (!fbid) {
            return photo.onGetPhotoUrl(undefined, container, onGetUrl);
          }
          mono.sendMessage({action: 'getFacebookPhotoUrl', fbid: fbid}, function(url) {
            photo.onGetPhotoUrl(url, container, onGetUrl);
          });
        }]
      }));

      if (photo.dlCurrentBtnStyle !== undefined) {
        return;
      }
      photo.dlCurrentBtnStyle = mono.create('style', {
        text: "div > .sf-dl-current-photo-btn {" +
        'display: none;' +
        'border: 1px solid #F8F8F8;' +
        'width: 20px;' +
        'height: 20px;' +
        'padding: 0;' +
        'position: absolute;' +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#777777')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        'top: 20px;' +
        'left: 20px;' +
        'z-index: 100;' +
        'cursor: pointer;' +
        "}" +
        "div > .sf-dl-current-photo-btn:hover {" +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#00B75A')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        "}" +
        "div > .sf-dl-current-photo-btn:active {" +
        "outline: 0;" +
        "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
        "}" +
        "div:hover > .sf-dl-current-photo-btn {display: block;}"
      });
      document.body.appendChild(photo.dlCurrentBtnStyle);
    },
    addCurrentDlBtn: function(img) {
      var contaier = img.parentNode;
      if (contaier.dataset.sfSkip === '1') {
        return;
      }
      contaier.dataset.sfSkip = '1';
      var url = img.src;
      if (!url) {
        return;
      }
      this.addDlCurrentPhotoBtn(contaier);
    },
    rmDataAttrs: function() {
      var dataAttr = mono.dataAttr2Selector('sfSkip');
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (var i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
    }
  };

  var videoFeed = {
    hasStyle: 0,
    popupMenu: undefined,
    addStyle: function() {
      videoFeed.hasStyle = 1;
      document.body.appendChild(mono.create('style', {
        class: 'sfFeedStyle',
        text: '' +
        '.'+fb.className+'-feed'+'.sf-feed {' +
          'display: none;' +
          'width: 20px;' +
          'height: 20px;' +
          'padding: 0;' +
          'position: absolute;' +
          'background: url('+SaveFrom_Utils.svg.getSrc('download', '#a2db16')+') center no-repeat transparent;' +
          'background-size: 16px;' +
          'top: 5px;' +
          'left: 5px;' +
          'z-index: 1;' +
          'cursor: pointer;' +
        '}' +
        'div:hover > .'+fb.className+'-feed'+'.sf-feed {' +
          'display: block;' +
        '}' +
        '.'+fb.className+'-feed'+'.sf-feed:active {' +
          'outline: 0;' +
        '}'
      }));
    },
    onDlBtnClick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var menu;

      try {
        var links = JSON.parse(this.dataset.sfDlLinks);
      } catch (e) {
        return;
      }
      if (menu = videoFeed.popupMenu) {
        menu.hide();
      }

      menu = videoFeed.popupMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', fb.className+'_popup');

      if (links.id) {
        var id = links.id;
        delete links.id;
        video.requestVideoLinks(id, function(_links, title) {
          var popupMenuLinks;
          if (_links) {
            popupMenuLinks = SaveFrom_Utils.popupMenu.prepareLinks.facebook(_links, title);
          } else {
            popupMenuLinks = video.prepareLinks(links);
          }
          menu.update(popupMenuLinks);
        });
      } else {
        var popupMenuLinks = video.prepareLinks(links);
        menu.update(popupMenuLinks);
      }

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'facebook', event: 'click', label: 'video-feed'});
      }
    },
    addDownloadBtn: function(container, links) {
      container.appendChild(mono.create('a', {
        data: {
          sfDlLinks: JSON.stringify(links)
        },
        title: language.download,
        class: [fb.className+'-feed', 'sf-feed'],
        href: '#',
        on: ['click', videoFeed.onDlBtnClick]
      }));
    },
    onLinkHover: function(e) {
      if (this.dataset.hasSfFeedBtn !== undefined) return;
      this.dataset.hasSfFeedBtn = 1;

      var onReady = function(links) {
        "use strict";
        if (!links) {
          return;
        }

        var timeLineMainColumn = document.getElementById('pagelet_timeline_main_column') || document.getElementById('stream_pagelet');

        if (!timeLineMainColumn || !timeLineMainColumn.contains(this)) {
          return;
        }

        videoFeed.addDownloadBtn(this.parentNode, links);

        if (videoFeed.hasStyle === 0) {
          videoFeed.addStyle();
        }
      };

      if (this.tagName === 'EMBED') {
        video.getLinksFromEmbed(this, onReady.bind(this));
      } else
      if (this.tagName === 'VIDEO') {
        video.getLinksFromVideo(this, onReady.bind(this));
      }
    },
    rmBtn: function() {
      if (videoFeed.popupMenu) {
        videoFeed.popupMenu.hide();
      }

      var dataAttr = mono.dataAttr2Selector('hasSfFeedBtn');
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (var i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
      var btnList = document.querySelectorAll('.'+fb.className+'-feed');
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('lm', function(moduleName) {
  if (mono.isSafari || mono.isFF) {
    if (mono.checkUrl(document.URL, [
      "ftp://*",
      "file://*",
      "http://google.*/*",
      "http://*.google.*/*",
      "https://google.*/*",
      "https://*.google.*/*",
      "http://acidtests.org/*",
      "http://*.acidtests.org/*",
      "http://savefrom.net/*",
      "http://*.savefrom.net/*",
      "http://youtube.com/*",
      "http://*.youtube.com/*",
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "http://vimeo.com/*",
      "http://*.vimeo.com/*",
      "https://vimeo.com/*",
      "https://*.vimeo.com/*",
      "http://dailymotion.*/*",
      "http://*.dailymotion.*/*",
      "https://dailymotion.*/*",
      "https://*.dailymotion.*/*",
      "http://vk.com/*",
      "http://*.vk.com/*",
      "http://vkontakte.ru/*",
      "http://*.vkontakte.ru/*",
      "https://vk.com/*",
      "https://*.vk.com/*",
      "https://vkontakte.ru/*",
      "https://*.vkontakte.ru/*",
      "http://odnoklassniki.ru/*",
      "http://*.odnoklassniki.ru/*",
      "http://my.mail.ru/*",
      "http://ok.ru/*",
      "http://*.ok.ru/*",
      "http://soundcloud.com/*",
      "http://*.soundcloud.com/*",
      "https://soundcloud.com/*",
      "https://*.soundcloud.com/*",
      "http://facebook.com/*",
      "http://*.facebook.com/*",
      "https://facebook.com/*",
      "https://*.facebook.com/*",
      "https://instagram.com/*",
      "http://instagram.com/*",
      "https://*.instagram.com/*",
      "http://*.instagram.com/*",
      "https://rutube.ru/*",
      "http://rutube.ru/*",
      "https://*.rutube.ru/*",
      "http://*.rutube.ru/*"
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var enable = true;
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return lm.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        lm.savefromLinkCount = -1;
        lm.run();
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      enable = preference.lmFileHosting || preference.lmMediaHosting;
      if (preference.showUmmyInfo) {
        checkUmmyPage();
      }
      ummyRadioBanner.run();
      lm.run();
    }, ['getNavigatorLanguage']);
  };

  if (mono.isIframe()) {
    return;
  }

  var checkUmmyPage = function() {
    if (typeof location === 'undefined') return;

    var url = location.href;
    if (url.indexOf("videodownloader.ummy.net") === -1) {
      return;
    }
    if (url.match(/pozdravlyaem|congratulations|tebrikler/) !== null) {
      mono.sendMessage({action: 'updateOption', key: 'showUmmyInfo', value: 0});
      mono.sendMessage({action: 'updateOption', key: 'ummyDetected', value: 1});
    }
  };

  var lm = {
    htmlAfter: '',

    linkText: '',

    linkStyle: {
      'border': 'none',
      'textDecoration': 'none',
      'padding': '0',
      'position': 'relative'
    },

    imgStyle: {
      'border': 'none',
      'width': 'auto',
      'height': 'auto'
    },

    buttonSrc: 'data:image/gif;base64,R0lGODlhEAAQAOZ3APf39+Xl5fT09OPj4/Hx8evr6/3+/u7u7uDh4OPi497e3t7e3/z8/P79/X3GbuXl5ubl5eHg4WzFUfb39+Pj4lzGOV7LOPz7+/n6+vn5+ZTLj9/e387Ozt7f3/7+/vv7/ISbePn5+m/JV1nRKXmVbkCnKVrSLDqsCuDh4d/e3uDn3/z7/H6TdVeaV1uSW+bn5v39/eXm5eXm5kyHP/f39pzGmVy7J3yRd9/f3mLEKkXCHJbka2TVM5vaZn6Wdfn6+YG/c/r5+ZO/jeLi41aHTIeageLn4f39/vr6+kzNG2PVM5i+lomdf2CXYKHVmtzo2YXNeDqsBebl5uHh4HDKWN3g3kKqEH6WeZHTXIPKdnSPbv79/pfmbE7PHpe1l4O8dTO5DODg4VDLIlKUUtzo2J7SmEWsLlG4NJbFjkrJHP7+/VK5Nfz8+zmnC3KKa+Hg4OHh4Y63j/3+/eDg4Ojo6P///8DAwP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAHcALAAAAAAQABAAAAfWgHd2g4SFhYJzdYqLjIpzgx5bBgYwHg1Hk2oNDXKDFwwfDF5NLmMtcStsn4MhGT8YS04aGmU1QRhIGYMTADQAQlAODlloAMYTgwICRmRfVBISIkBPKsqDBAREZmcVFhYVayUz2IMHB1dWOmImI2lgUVrmgwUFLzdtXTxKSSduMfSD6Aik48MGlx05SAykM0gKhAAPAhTB0oNFABkPHg5KMIBCxzlMQFQZMGBIggSDpsCJgGDOmzkIUCAIM2dOhEEcNijQuQDHgg4KOqRYwMGOIENIB90JBAA7',

    sfref: '&utm_source={sfHelperName}&utm_medium=extensions&utm_campaign=link_modifier',

    pageUrl: 'http://savefrom.net/',
    anchorAttribute: 'savefrom_lm',
    anchorAttributeLink: 'savefrom_lm_is_link',
    anchorIndexAttribute: 'savefrom_lm_index',

    linkRegExp: null,

    savefromLinkCount: 0,

    re: {
      filehosting: {
        'rapidshare.com': [/^https?:\/\/([\w\-]+\.)?rapidshare\.com\/\#\!download\|\d+\|\d+\|[^\s\"\|]+\|\d+/i, /^https?:\/\/(rs\d+\.|www\.)?rapidshare\.com\/files\/\d+\/.+/i],
        'filefactory.com': [/^http:\/\/(www\.)?filefactory\.com\/file\/[a-z0-9]+\/?/i],
        'sendspace.com': [/^http:\/\/(www\.)?sendspace\.com\/file\/\w+/i]
      },

      mediahosting: {
        'youtube.com': [
          /^https?:\/\/([a-z]+\.)?youtube\.com\/(#!?\/)?watch\?.*v=/i,
          /^https?:\/\/([a-z0-9]+\.)?youtube\.com\/(embed|v)\/[\w\-]+/i
        ],
        'youtu.be': [/^https?:\/\/([a-z]+\.)?youtu\.be\/[\w\-]+/i],
        'google.com': [/^http:\/\/video\.google\.com\/videoplay\?.*docid=/i],
        'metacafe.com': [/^http:\/\/(www\.)?metacafe\.com\/watch\/\d+\/[^\/]+\/?/i],
        'break.com': [/^http:\/\/(www\.)?break\.com\/(index|movies\w*|(\w+\-)+\w+)\/.+\.html$/i, /^http:\/\/view\.break\.com\/\d+/i],
        'vimeo.com': [/^http:\/\/([\w\-]+\.)?vimeo\.com\/\d+$/i],
        'sevenload.com': [/^http:\/\/([\w\-]+\.)?sevenload\.com\/videos\/[-\w\+\/=]+/i, /^http:\/\/([\w\-]+\.)?sevenload\.com\/shows\/.+/i],
        'facebook.com': [/^https?:\/\/(?:www\.)facebook\.com\/([^\/]+\/)*video\.php\?([^&]+&)*v=\d+/i],
        //'rutube.ru': [/^http:\/\/rutube\.ru\/tracks\/\d+\.html\?.*v=[a-f0-9]+/i],
        'mail.ru': [/^http:\/\/([a-z0-9_-]+\.)?video\.mail\.ru\/(.+\/)+\d+\.html/i, /^http:\/\/r\.mail\.ru\/\w+\/video\.mail\.ru\/(.+\/)+\d+\.html/i],
        'yandex.ru': [/^http:\/\/video\.yandex\.ru\/users\/[-\w,!\+]+\/view\/[-\w,!\+]+\/?/i],
        'rambler.ru': [/^http:\/\/vision\.rambler\.ru\/users\/[^\/\s]+\/\d+\/[-\w_\+!]+\/?/i],
        'smotri.com': [/^http:\/\/([a-z0-9_-]+\.)?smotri\.com\/video\/view\/\?.*id=v[0-9a-f]/i],
        'tvigle.ru': [/^http:\/\/(www\.)?tvigle\.ru\/channel\/\d+\?.*vid_id=\d+/i, /^http:\/\/(www\.)tvigle\.ru\/prg\/\d+\/\d+/i],
        'intv.ru': [/^http:\/\/(www\.)?intv\.ru\/(view|quickdl)\/\?.*film_id=\w+/i, /^http:\/\/(www\.)?intv\.ru\/v\/\w+/i],
        'yasee.ru': [/^http:\/\/([a-z0-9_-]+\.)?yasee\.ru\/video\/view\/\?.*id=v[0-9a-f]/i],
        'narod.tv': [/^http:\/\/(?:www\.)?narod\.tv\/\?.*vid=/i],
        'vkadre.ru': [/^http:\/\/(www\.)?vkadre\.ru\/videos\/\d+/i],
        'myvi.ru': [
          /^http:\/\/(www\.)?myvi\.ru\/([a-z][a-z]\/)?videodetail\.aspx\?.*video=/i,
          /^http:\/\/(www|kino|anime)\.myvi\.ru\/watch\/[\w\-]+/i
        ],
        '1tv.ru': [/^http:\/\/(www\.)?1tv\.ru(\:\d+)?\/newsvideo\/\d+/i, /^http:\/\/(www\.)?1tv\.ru(\:\d+)?\/news\/\w+\d+/i],
        'ntv.ru': [/^http:\/\/news\.ntv\.ru\/(\w+\/)?\d+\/video\/?/i],
        'vesti.ru': [/^http:\/\/(www\.)?vesti\.ru\/videos\?.*vid=\d+/i],
        'bibigon.ru': [/^http:\/\/(www\.)?bibigon\.ru\/videow\.html\?id=\d+/i, /^http:\/\/(www\.)?bibigon\.ru\/video\.html\?vid=\d+/i],
        'mreporter.ru': [/^http:\/\/(www\.)?mreporter\.ru\/reportermessages\!viewreport\.do[^\?]*\?.*reportid=\d+/i],
        'autoplustv.ru': [/^http:\/\/(www\.)?autoplustv\.ru\/494\/\?id=\d+/i],
        'russia.ru': [/^http:\/\/([\w\-]+\.)?russia\.ru\/video\/?/i],
        'amik.ru': [/^http:\/\/(www\.)?amik\.ru\/video\/vid\d+\.html/i, /^http:\/\/(www\.)?amik\.ru\/video\/vcid\d+\.html/i],
        'life.ru': [/^http:\/\/([\w+\-]+\.)?life\.ru\/video\/\d+/i]
      }
    },


    parseHref: function(href, search)
    {
      var res = [];
      res.push(href);

      var i = href.toLowerCase().indexOf('http://', 7);
      if(i > 7)
      {
        res.push(href.substring(i));
      }
      else if(search)
      {
        var h = search.match(/http%3a(%2f%2f|\/\/)[^\s\&\"\<\>]+/i);
        if(h && h.length > 0)
        {
          res.push(decodeURIComponent(h[0]));
        }
        else
        {
          var s = '';
          try
          {
            s = decodeURIComponent(search);
          }
          catch(err)
          {
          }

          if(s)
          {
            h = s.match(/((?:aHR0cDovL|aHR0cHM6Ly)[a-z0-9+\/=]+)/i);
            if(h && h.length > 1)
            {
              h = base64.decode(h[1]);
              if(h.search(/^https?:\/\//i) != -1)
                res.push(decodeURIComponent(h));
            }
          }
        }
      }

      return res;
    },


    href: function(a)
    {
      return a.getAttribute('href');
    },


    getElementIndex: function(e)
    {
      var html = e.innerHTML;
      if(!html || html == ' ')
        return 1;

      var bg = e.style.backgroundImage;
      if(bg && bg != 'none')
        return 1;

      var c = e.getElementsByTagName('*');
      for(var i = 0; i < c.length; i++)
      {
        if(c[i].tagName == 'IMG')
          return 2;
        else
        {
          bg = c[i].style.backgroundImage;
          if(bg && bg != 'none')
            return 1;
        }
      }

      return 0;
    },


    run: function()
    {
      SaveFrom_Utils.embedDownloader.init();

      lm.sfref = lm.sfref.replace('{sfHelperName}', preference.sfHelperName);

      var prefFileHosting = !!preference.lmFileHosting;
      var prefMediaHosting = !!preference.lmMediaHosting;

      if(!enable) {
        return;
      }

      moduleState = 1;

      lm.linkRegExp = {};
      if(prefFileHosting)
      {
        for(var i in lm.re.filehosting)
          lm.linkRegExp[i] = lm.re.filehosting[i];
      }

      if(prefMediaHosting)
      {
        for(var i in lm.re.mediahosting)
          lm.linkRegExp[i] = lm.re.mediahosting[i];
      }


      var a = document.getElementsByTagName('a');
      if(lm.savefromLinkCount != a.length)
      {
        lm.savefromLinkCount = a.length;

        var found = {}, lastHref = '';

        for(var i = 0, len = a.length; i < len; i++)
        {
          var href = handleAnchor(a[i]);
          if(href)
          {
            var index = 0;
            var attr = a[i].getAttribute(lm.anchorIndexAttribute);
            if(attr === 0 || attr)
              index = parseInt(attr);
            else
            {
              index = lm.getElementIndex(a[i]);
              a[i].setAttribute(lm.anchorIndexAttribute, index);
            }

            if(found[href])
            {
              if(index < found[href].index)
              {
                found[href].elements = [a[i]];
                found[href].index = index;
                lastHref = href;
              }
              else if(index == found[href].index && href != lastHref)
              {
                found[href].elements.push(a[i]);
                lastHref = href;
              }
            }
            else
            {
              found[href] = {
                index: index,
                elements: [a[i]]
              };

              lastHref = href;
            }
          }
        }

        var count = 0;
        for(var i in found)
        {
          for(var j = 0, len = found[i].elements.length; j < len; j++)
          {
            var e = found[i].elements[j];
            count++;
            if(!e.getAttribute(lm.anchorAttribute))
              modifyLink(e, i);
          }
        }
      }



      function checkLink(link, domain)
      {
        if(!link)
          return false;

        if(link == window.location.href)
          return false;

        domain = SaveFrom_Utils.getTopLevelDomain(domain);
        if(!domain || !lm.linkRegExp[domain])
          return false;

        for(var i = 0; i < lm.linkRegExp[domain].length; i++)
        {
          if(link.search(lm.linkRegExp[domain][i]) != -1)
            return true;
        }

        return false;
      }


      function handleAnchor(obj)
      {
        var href = obj.href;
        if(href && (href.search(/^https?:\/\/([\w\-]+\.)?savefrom\.net\//i) == -1))
        {
          var hrefArray = lm.parseHref(href, obj.search);

          if(hrefArray.length > 0)
          {
            if(lm.href(obj).indexOf('#') != 0 && checkLink(hrefArray[0], obj.hostname))
            {
              return hrefArray[0];
            }
            else if(hrefArray.length > 1)
            {
              for(var j = 1; j < hrefArray.length; j++)
              {
                var aTemp = document.createElement('a');
                aTemp.href = hrefArray[j];
                if(lm.href(aTemp).indexOf('#') != 0 && checkLink(hrefArray[j], aTemp.hostname))
                {
                  return hrefArray[j];
                }
              }
            }
          }
        }

        return '';
      }

      function modifyLink(obj, link)
      {
        if(!obj)
          return;

        obj.setAttribute(lm.anchorAttribute, '1');

        var box = document.createElement('span');
        box.setAttribute('style', 'padding: 0; margin: 0; margin-left: 5px;');
        box.addEventListener('click', function(e) {
          e.stopPropagation();
        });

        var parent = obj.parentNode;
        if(!parent)
          return;

        try
        {
          link = encodeURIComponent(link);
        }
        catch(err)
        {
          return;
        }

        var href = lm.pageUrl + '?url=' + link;
        if(lm.sfref)
          href += lm.sfref;

        // add button
        var a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.title = language.lmButtonTitle;

        a.style.backgroundImage = 'url('+lm.buttonSrc+')';
        a.style.backgroundRepeat = 'no-repeat';
        a.style.width = '16px';
        a.style.height = '16px';
        a.style.display = 'inline-block';

        a.addEventListener('click', function() {
          if ([1].indexOf(preference.cohortIndex) !== -1) {
            mono.sendMessage({action: 'trackCohort', category: 'mediahost', event: 'from', label: '%domain%'});
          }
        });

        for(var i in lm.linkStyle)
          a.style[i] = lm.linkStyle[i];

        if (obj.style.zIndex) {
          a.style.zIndex = obj.style.zIndex;
        }

        a.setAttribute(lm.anchorAttribute, '1');
        a.setAttribute(lm.anchorAttributeLink, '1');
        if(lm.linkText)
        {
          a.textContent = lm.linkText;
        }

        box.appendChild(a);

        if(lm.htmlAfter)
          box.textContent += lm.htmlAfter;


        if(obj.nextSibling)
          parent.insertBefore(box, obj.nextSibling);
        else
          parent.appendChild(box);
      }
    },
    changeState: function(state) {
      preference.lmFileHosting = state;
      preference.lmMediaHosting = state;
      moduleState = state;
      var btnList = document.querySelectorAll('a['+lm.anchorAttributeLink+']');
      for (var i = 0, item; item = btnList[i]; i++) {
        item = item.parentNode;
        item.parentNode.removeChild(item);
      }
      var dataAttrList = document.querySelectorAll(['*['+lm.anchorAttribute+']', '*['+lm.anchorIndexAttribute+']']);
      for (i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(lm.anchorAttribute);
        item.removeAttribute(lm.anchorIndexAttribute);
      }
      lm.savefromLinkCount = -1;

      if (state) {
        enable = preference.lmFileHosting || preference.lmMediaHosting;
        lm.run();
      }
    }
  };


  // Base64
  var base64 = {
    key: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    decode: function(text)
    {
      var res = '';
      var c1, c2, c3, e1, e2, e3, e4;
      var i = 0;

      text = text.replace(/[^A-Za-z0-9\+\/\=]/g, '');

      while(i < text.length)
      {
        e1 = base64.key.indexOf(text.charAt(i++));
        e2 = base64.key.indexOf(text.charAt(i++));
        e3 = base64.key.indexOf(text.charAt(i++));
        e4 = base64.key.indexOf(text.charAt(i++));

        c1 = (e1 << 2) | (e2 >> 4);
        c2 = ((e2 & 15) << 4) | (e3 >> 2);
        c3 = ((e3 & 3) << 6) | e4;

        res += String.fromCharCode(c1);

        if(e3 != 64)
          res += String.fromCharCode(c2);
        if(e4 != 64)
          res += String.fromCharCode(c3);
      }

      return res;
    }
  };

  var ummyRadioBanner = {};
  ummyRadioBanner.langList = {
    ru: {
      title: 'Слушай любимое радио онлайн!',
      more: 'Подробнее',
      close: 'Закрыть'
    },
    en: {
      title: 'The Best Online Radio Player!',
      more: 'More',
      close: 'Close'
    }
  };
  ummyRadioBanner.language = {};
  ummyRadioBanner.getType = function() {
    var hostname = location.hostname;
    var list = [
      '101.ru',
      'lovi.fm',
      'radiopotok.ru',
      'tunein.com',
      'radiotuna.com',
      'live365.com',
      'internet-radio.com',
      'streema.com',
      'ivoox.com',
      'webmaster-gratuit.com',
      'radio.de',
      'jango.com',
      'russiafm.net',
      'moskva.fm',
      'radiorecord.ru',
      'radio.com',
      'guia-radio.com',
      'frequence-radio.com',
      'lafrance.fm',
      'ecouter-en-direct.com',
      'radioonline.fm',
      'internetradiouk.com',
      'england.fm',
      'delicast.com'
    ];
    var dot_pos = hostname.indexOf('.');
    while (dot_pos !== -1) {
      if (list.indexOf(hostname) !== -1) {
        return hostname;
      }
      hostname = hostname.substr(dot_pos + 1);
      dot_pos = hostname.indexOf('.');
    }
  };
  ummyRadioBanner.run = function() {
    mono.sendMessage('getUmmyRadioLogo', function(response) {
      ummyRadioBanner.icon = response;
      mono.storage.get('uRadio', function(storage) {
        storage.uRadio = storage.uRadio || {};
        ummyRadioBanner.add(storage.uRadio);
      });
    });
  };
  ummyRadioBanner.addInList = function(storage, type, isClose) {
    if (isClose) {
      storage.siteList[type]++;
    } else {
      storage.siteList[type] = 3;
    }
    mono.storage.set({uRadio: storage});
  };
  ummyRadioBanner.add = function(storage) {
    if (mono.isOpera) {
      return;
    }

    var vid;
    if (['ru', 'uk'].indexOf(language.lang) !== -1) {
      this.language = this.langList['ru'];
      vid = 420;
    } else {
      this.language = this.langList['en'];
      vid = 421;
    }

    var type = this.getType();
    if (!type) return;

    if (storage.siteList === undefined) {
      storage.siteList = {};
    }
    if (storage.siteList[type] === undefined) {
      storage.siteList[type] = 0;
    }

    if (storage.siteList[type] >= 3) {
      return;
    }

    var body;
    var hide = function() {
      body.style.opacity = 0;
      setTimeout(function() {
        body.parentNode.removeChild(body);
      }, 1000);
    };
    document.body.appendChild(
      body = mono.create('div', {
        class: 'sf-ummy-banner',
        style: {
          position: 'fixed',
          bottom: '10px',
          width: '100%',
          textAlign: 'center',
          display: 'block',
          opacity: 0,
          zIndex: 1000
        },
        append: mono.create('div', {
          style: {
            display: 'inline-block',
            width: '524px',
            height: '55px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontFamily: 'Tahoma, Geneva, sans-serif',
            borderRadius: '3px',
            textAlign: 'left',
            position: 'relative'
          },
          append: [
            mono.create('div', {
              style: {
                position: 'absolute',
                width: '45px',
                height: '45px',
                background: 'url('+ummyRadioBanner.icon+') center no-repeat',
                left: '6px',
                top: '5px'
              }
            }),
            mono.create('span', {
              style: {
                position: 'absolute',
                fontSize: '20px',
                color: '#fff',
                left: '63px',
                lineHeight: '55px',
                verticalAlign: 'middle',
                fontWeight: 'normal',
                fontFamily: 'Tahoma, Geneva, sans-serif',
                cssFloat: 'none',
                padding: 'auto'
              },
              text: this.language.title
            }),
            mono.create('a', {
              href: 'http://radionline.fm/' + '?VID=' + vid,
              target: '_blank',
              style: {
                position: 'absolute',
                width: '130px',
                height: '29px',
                lineHeight: '29px',
                borderRadius: '3px',
                color: '#fff',
                top: '13px',
                left: '377px',
                textAlign: 'center',
                backgroundColor: '#f94346',
                cursor: 'pointer',
                textDecoration: 'none',
                letterSpacing: 'normal',
                fontSize: '12px',
                padding: 'auto'
              },
              append: mono.create('span', {
                style: {
                  cssFloat: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  padding: 'auto',
                  fontFamily: 'Tahoma, Geneva, sans-serif'
                },
                text: this.language.more
              }),
              on: [
                ['click', function() {
                  this.addInList(storage, type, 0);
                  hide();
                }.bind(this)]
              ]
            }),
            mono.create('span', {
              class: 'sf-close',
              style: {
                display: 'block',
                position: 'absolute',
                color: '#ccc',
                top: '2px',
                right: '3px',
                fontSize: '8px',
                cursor: 'pointer',
                width: '10px',
                height: '10px',
                textAlign: 'right',
                fontFamily: 'Tahoma, Geneva, sans-serif',
                cssFloat: 'none',
                padding: 'auto'
              },
              on: [
                ['click', function(e) {
                  e.preventDefault();
                  this.addInList(storage, type, 1);
                  hide();
                }.bind(this)]
              ],
              text: 'X',
              title: this.language.close
            }),
            mono.create('style', {
              text: '.sf-ummy-banner a:hover {color: #fff !important; background-color: #F7292C !important;}' +
              '.sf-ummy-banner .sf-close:hover {color: #fff !important;}' +
              '.sf-ummy-banner {transition: opacity 0.2s}'
            })
          ]
        })
      })
    );
    setTimeout(function() {
      body.style.opacity = 1;
    }, 100);
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('odnoklassniki', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://odnoklassniki.ru/*',
      'http://*.odnoklassniki.ru/*',
      'http://ok.ru/*',
      'http://*.ok.ru/*'
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var allowDownloadMode = mono.isChrome || mono.isFF || (mono.isGM && mono.isTM);
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return odnoklassniki.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        updateLinks();
      }
      if (message.action === 'downloadMP3Files') {
        if (allowDownloadMode) {
          audio.downloadMP3Files();
        } else {
          audio.showListOfAudioFiles(false);
        }
      }
      if (message.action === 'downloadPlaylist') {
        audio.showListOfAudioFiles(true);
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleOdnoklassniki) {
        return;
      }
      odnoklassniki.run();
    });
  };

  if (mono.isIframe()) {
    return;
  }

  var downloadLinkClassName = 'savefrom_ok_download';
  var titleTimer = 0;


  function updateLinks()
  {
    removeDownloadLinks();
    audio.showLinks();
    video.catchPopup();
  }


  function createTextLink(href, text, blank) {
    if(blank == undefined)
      blank = true;

    var a = document.createElement('a');
    a.href = href;
    a.className = downloadLinkClassName;
    a.textContent = text;

    if(blank)
      a.setAttribute('target', '_blank');

    return a;
  }


  function removeDownloadLinks()
  {
    var selector = '.' + downloadLinkClassName;

    var e = document.querySelectorAll(selector);
    for(var i = e.length-1; i >= 0; i--)
      e[i].parentNode.removeChild(e[i]);
  }

  ///////////////////////////////////////////////////////////////////
  //  AUDIO

  var audio = {
    downloadIdPrefix: 'savefrom_ok_audio_download_',
    infoIdPrefix: 'savefrom_ok_audio_info_',
    lastRow: null,
    lastRowCandidate: null,
    timer: 0,
    jsessionId: '',
    scriptNode: null,
    cache: {},
    ajaxTimer: {},


    showRowElements: function(row, show, force)
    {
      if(!row)
        return;

      var node = row.querySelectorAll('div.' + downloadLinkClassName);

      if(show && (!node || node.length == 0))
      {
        if(!audio.showRowLinks(row))
          return;

        node = row.querySelectorAll('div.' + downloadLinkClassName);
      }

      if(node && node.length > 0)
      {
        var d = show ? '' : 'none';
        for(var i = 0; i < node.length; i++)
        {
          node[i].style.display = d;
        }
      }
    },


    getNodeTrackId: function(node)
    {
      var query = node.getAttribute('data-query');
      if(query)
      {
        try
        {
          query = JSON.parse(query);
          if(query && query.trackId)
            return query.trackId;
        }
        catch(Err)
        {
          return null;
        }
      }

      return null;
    },


    getTrackId: function(parent)
    {
      if(!parent)
        return null;

      var trackId = audio.getNodeTrackId(parent);
      if(trackId)
      {
        var links = {};
        links[trackId] = parent;
        return links;
      }

      var id = parent.id;
      if(id)
      {
        var hashPos = id.indexOf('#');
        if (hashPos !== -1) {
          id = id.substr(hashPos + 1);
        }
        trackId = SaveFrom_Utils.getMatchFirst(id, /^\w+_(\d+)$/i);
        if (!trackId) {
          if (id.indexOf('GROUP_FEED') !== -1) {
            trackId = id.substr( id.lastIndexOf('_') + 1 );
          }
        }
        if(trackId)
        {
          var links = {};
          links[trackId] = parent;
          return links;
        }
      }

      return null;
    },


    showRowLinks: function(row)
    {
      var links = audio.getTrackId(row);
      for(var i in links)
      {
        if(audio.handleRow(i, links[i]))
          return true;
      }

      return false;
    },

    disable: function() {
      mono.off(document, 'mouseenter', audio.onMouseOver, true);
      mono.off(document, 'mouseleave', audio.onMouseOut, true);
      audio.lastRowCandidate = null;
      audio.lastRow = null;
      var dlBtn = document.querySelectorAll('.'+downloadLinkClassName);
      for (var i = 0, item; item = dlBtn[i]; i++) {
        item.parentNode.removeChild(item);
      }
    },

    gotJsSessonId: function(jsSessionId) {
      audio.jsessionId = jsSessionId;
      audio.cache = {};

      for(var i in audio.ajaxTimer)
        window.clearTimeout(audio.ajaxTimer[i]);

      audio.ajaxTimer = {};

      mono.off(document, 'mouseenter', audio.onMouseOver, true);
      mono.off(document, 'mouseleave', audio.onMouseOut, true);

      mono.on(document, 'mouseenter', audio.onMouseOver, true);
      mono.on(document, 'mouseleave', audio.onMouseOut, true);
    },

    showLinks: function() {
      var jsessionId = undefined;
      var html = document.body.innerHTML;
      var pos = html.indexOf('jsessionid');
      if (pos !== -1) {
        jsessionId = html.substr(pos, 100);
        var posStart = jsessionId.indexOf('=') + 1;
        var posEnd = jsessionId.indexOf('&');
        jsessionId = jsessionId.substr(posStart, posEnd - posStart);
      }
      html = undefined;

      if (!jsessionId) {
        if (audio.scriptNode && audio.scriptNode.parentNode) {
          audio.scriptNode.parentNode.removeChild(audio.scriptNode);
          audio.scriptNode = null;
        }

        var s = document.createElement('script');
        s.text = '('+function(){
          if(window.pageCtx && window.pageCtx.jsessionId) {
            document.body.setAttribute('data-ok-jsession-id', window.pageCtx.jsessionId);
          }
        }.toString()+')();';
        document.body.appendChild(s);
        audio.scriptNode = s;

        jsessionId = document.body.getAttribute('data-ok-jsession-id');
      }

      if(jsessionId) {
        return audio.gotJsSessonId(jsessionId);
      }

      var url = location.protocol + '//' +  location.host + '/web-api/music/conf';
      mono.ajax({
        type: 'POST',
        url: url,
        data: '_',
        dataType: 'json',
        success: function(data) {
          if (data && data.sid) {
            audio.gotJsSessonId(data.sid);
          }
        }
      });
    },


    getLink: function(trackId)
    {
      if(!trackId || !audio.jsessionId)
        return;

      audio.ajaxTimer[trackId] = window.setTimeout(function(){
        delete audio.ajaxTimer[trackId];
        audio.deleteLink(trackId);
      }, 30000);

      mono.sendMessage({
        action: 'getOdnoklassnikiAudioLinks',
        url: location.href,
        trackId: trackId,
        jsessionId: audio.jsessionId
      }, function(response){
        audio.setLink(response.trackId, response.data);
      });
    },


    onMouseOver: function(event)
    {
      var node = event.target;
      var row = SaveFrom_Utils.getParentByClass(node, ['m_portal_track', 'm_c_tr', 'mus-tr_i']);
      if(row)
      {
        audio.lastRowCandidate = row;
        window.clearTimeout(audio.timer);

        if(audio.lastRow == row)
          return;

        audio.timer = window.setTimeout(function(){
          audio.showRowElements(audio.lastRow, false);
          audio.lastRow = row;
          audio.lastRowCandidate = null;
          audio.showRowElements(audio.lastRow, true);
        }, 250);
      }
    },


    onMouseOut: function(event)
    {
      if(!audio.lastRow && !audio.lastRowCandidate)
        return;

      var node = event.target;
      if(SaveFrom_Utils.isParent(node, audio.lastRow) ||
        SaveFrom_Utils.isParent(node, audio.lastRowCandidate))
      {
        window.clearTimeout(audio.timer);
        audio.timer = window.setTimeout(function(){
          audio.showRowElements(audio.lastRow, false);
          audio.lastRow = null;
          audio.lastRowCandidate = null;
        }, 1000);
      }
      node = null;
    },


    handleRow: function(trackId, row)
    {
      if(!trackId || !row)
        return false;

      var parent = row;
      parent.style.position = 'relative';

      var duration = row.querySelector('.m_c_duration, .m_portal_duration');

      var box = document.createElement('div');
      box.className = downloadLinkClassName;

      var right = 40;
      var mmpcw = document.getElementById('mmpcw');
      if (mmpcw && mmpcw.contains(row)) {
        right = 65;
      }

      SaveFrom_Utils.setStyle(box, {
        color: '#fff',
        background: '#46aa19',
        border: '1px solid #337d12',
        borderRadius: '3px',
        padding: '1px 5px',
        position: 'absolute',
        right: right + 'px',
        top: '50%',
        lineHeight: '15px',
        opacity: 0,
        zIndex: 9999,
        cursor: 'pointer'
      });

      box.addEventListener('click', audio.onBoxClick, false);

      var title = audio.getTitle(trackId, row);

      var link1 = createTextLink('#', '...');
      link1.id = audio.downloadIdPrefix + trackId;
      link1.title = language.downloadTitle;
      if(duration)
      {
        link1.setAttribute('data-savefrom-helper-duration',
          audio.secondsFromDurationNode(duration));
      }

      if(title)
      {
        title += '.mp3';
        link1.setAttribute('download', mono.fileName.modify(title));
      }

      SaveFrom_Utils.setStyle(link1, {
        color: '#fff',
        fontWeight: 'normal'
      });

      link1.addEventListener('click', audio.onDownloadLinkClick, false);

      box.appendChild(link1);
      parent.appendChild(box);

      if(audio.cache[trackId])
        audio.setLinkFromCache(trackId, link1);
      else
        audio.getLink(trackId);

      box.style.marginTop = '-' + (box.offsetHeight / 2) + 'px';
      box.style.opacity = '1';

      var close = document.createElement('span');
      close.textContent = String.fromCharCode(215);
      close.title = language.close;
      SaveFrom_Utils.setStyle(close, {
        color: '#fff',
        fontFamily: 'Tahoma,Helvetica,sans-serif',
        fontSize: '15px',
        marginLeft: '7px',
        opacity: '.7',
        cursor: 'pointer'
      });
      close.addEventListener('click', audio.onCloseBtnClick, false);
      box.appendChild(close);

      return true;
    },


    onBoxClick: function(event)
    {
      event.preventDefault();
      event.stopPropagation();

      var a = this.querySelector('a.' + downloadLinkClassName);
      if(a) {
        mono.trigger(a, 'click', {cancelable: true});
        return false;
      }

      this.style.display = 'none';
      return false;
    },


    onDownloadLinkClick: function(event)
    {
      if(event.button == 2)
        return false;

      event.stopPropagation();

      if(this.href == '#')
      {
        event.preventDefault();
        return false;
      }

      SaveFrom_Utils.downloadOnClick(event);

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        var mmpcw = document.getElementById('mmpcw');
        if (!mmpcw || !mmpcw.contains(this)) {
          mono.sendMessage({action: 'trackCohort', category: 'ok', event: 'click', label: 'music-feed'});
        } else {
          mono.sendMessage({action: 'trackCohort', category: 'ok', event: 'click', label: 'music-list'});
        }
      }
      return false;
    },


    onCloseBtnClick: function(event)
    {
      if(event.button == 2)
        return true;

      event.preventDefault();
      event.stopPropagation();

      var parent = SaveFrom_Utils.getParentByClass(this, downloadLinkClassName);
      if(parent)
        parent.style.display = 'none';

      return false;
    },


    deleteLink: function(trackId, node)
    {
      if(!node && trackId)
        node = document.getElementById(audio.downloadIdPrefix + trackId);

      if(!node)
        return;

      var box = node.parentNode;
      if (!box) {
        return;
      }
      box.parentNode.removeChild(box);
    },


    getHash: function(src, magic)
    {
      if(!magic)
        magic = [4,3,5,6,1,2,8,7,2,9,3,5,7,1,4,8,8,3,4,3,1,7,3,5,9,8,1,4,3,7,2,8];

      var a = [];
      for(var i = 0; i < src.length; i++)
      {
        a.push(parseInt('0x0' + src.charAt(i)));
      }

      src = a;

      var res = [];
      src = src.slice(0);
      src[32] = src[31];
      var sum = 0;
      var i = 32;
      while(i-- > 0)
        sum += src[i];

      for(var x = 0; x < 32; x++)
        res[x] = Math.abs(sum - src[x + 1] * src[x] * magic[x]);

      return res.join('');
    },


    setLinkFromCache: function(trackId, node)
    {
      if(!audio.cache[trackId])
        return false;

      if(!node)
        node = document.getElementById(audio.downloadIdPrefix + trackId);

      if(!node)
        return;

      node.href = audio.cache[trackId].url;
      node.textContent = '';
      if(audio.cache[trackId].downloadAttr)
        node.setAttribute('download', audio.cache[trackId].downloadAttr);

      var icon = mono.create('div', {
        style: {
          display: 'inline-block',
          width: '16px',
          height: '16px',
          verticalAlign: 'middle',
          opacity: '0.9',
          background: 'url('+ SaveFrom_Utils.svg.getSrc('download', '#ffffff') +') center no-repeat'
        }
      });
      node.appendChild(icon);

      var info = document.createTextNode(audio.cache[trackId].info);

      if(node.nextSibling)
        node.parentNode.insertBefore(info, node.nextSibling);
      else
        node.parentNode.appendChild(info);

      return true;
    },


    setLink: function(trackId, data, clientHash)
    {
      if(!trackId)
        return;

      window.clearTimeout(audio.ajaxTimer[trackId]);

      var node = document.getElementById(audio.downloadIdPrefix + trackId);
      if(!node)
        return;

      if(audio.setLinkFromCache(trackId, node))
        return;

      if(!data || !data.play)
      {
        audio.deleteLink(trackId, node);
        node.textContent = '?';
        return;
      }

      if(clientHash === undefined)
      {
        var md5 = data.play.match(/(?:\?|&)md5=([\da-f]{32})/i);
        if(md5 && md5.length > 1) {
          md5 = md5[1];
          try {
            md5 = SaveFrom_Utils.md5(md5 + 'secret');
            audio.setLink(trackId, data, audio.getHash(md5));
            return;
          } catch(err) {}
        }

        audio.deleteLink(trackId, node);
        return;
      }

      var size = SaveFrom_Utils.getMatchFirst(data.play, /(?:\?|&)size=(\d+)/i);
      if(!size)
        return;

      audio.cache[trackId] = {};
      audio.cache[trackId].url = data.play + (clientHash ? '&clientHash=' + clientHash : '');

      var info = ' (' + SaveFrom_Utils.sizeHuman(size, 2);

      var duration = node.getAttribute('data-savefrom-helper-duration');
      if(data.track)
      {
        if(data.track.duration)
          duration = data.track.duration;

        if(data.track.ensemble && data.track.name)
        {
          var title = data.track.ensemble + ' - ' + data.track.name;
          audio.cache[trackId].title = title;
          audio.cache[trackId].downloadAttr = mono.fileName.modify(title + '.mp3');
        }
      }

      if(size && duration)
      {
        duration = parseInt(duration);
        if(isNaN(duration))
        {
          delete audio.cache[trackId];
          return;
        }

        var bitrate = Math.floor((size / duration) / 125) + ' ' + language.kbps;
        info += ' ~ ' + bitrate;
      }

      info += ')';
      audio.cache[trackId].info = info;

      audio.setLinkFromCache(trackId, node);
    },


    getTitle: function(id, row)
    {
      if(!id || !row)
        return '';

      var name = '';

      var performer = row.querySelector('.m_c_artist, .mus-tr_artist, .m_portal_c_artist');
      var title = row.querySelector('.m_track_source, .mus-tr_song, .m_portla_track_name');

      if(performer)
      {
        performer = performer.textContent;
        if(performer)
          name += performer.trim();
      }

      if(title)
      {
        title = title.textContent;
        if(title)
        {
          if(name)
            name += ' - ';

          name += title.trim();
        }
      }

      if(name)
        return name.replace(/\<a\s+[^\>]+\>/ig, '').replace(/\<\/a\>/ig, '');

      return '';
    },


    secondsFromDurationNode: function(node)
    {
      if(!node)
        return 0;

      var text = node.textContent;
      if(!text)
        return 0;

      var m = text.match(/^(?:\s*(\d+)\s*\:)?\s*(\d+)\s*\:\s*(\d+)/);
      if(m && m.length > 3)
      {
        if(!m[1])
          m[1] = 0;

        return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
      }

      return 0;
    },

    getPlaylistName: function(container) {
      if (container === document) return;

      var title = container.querySelector('.mus_h2_tx');
      if (!title) return;
      return mono.fileName.modify(title.textContent) || undefined;
    },

    elIsHidden: function isHidden(el) {
      return (el.offsetParent === null)
    },

    getLayer: function() {
      var layer = document.getElementById('mmpcw');
      if (!layer) {
        return;
      }
      if (layer.classList.contains('__hidden')) {
        return;
      }
      layer = layer.querySelector('div.m_c_s[aria-hidden="false"]');
      if (!layer || audio.elIsHidden(layer)) {
        return;
      }
      return layer;
    },

    getPopup: function(title, type, onClose) {
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      var progressEl;
      mono.create(template.textContainer, {
        append: [
          !title ? undefined : mono.create('p', {
            text: title,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          progressEl = mono.create('p', {
            text: '',
            style: {
              color: '#868686',
              fontSize: '14px',
              lineHeight: '24px'
            }
          })
        ]
      });

      var popupEl = SaveFrom_Utils.popupDiv(template.body, 'sf_progress_popup', undefined, undefined, onClose);

      var setState = function(state) {
        if (setState.state === state) {
          return;
        }
        setState.state = state;

        template.buttonContainer.style.display = 'none';
        progressEl.style.display = 'none';
        mono.sendMessage({action: 'getWarningIcon', type: type, color: '#77D1FA'}, function(icon) {
          template.icon.style.backgroundImage = 'url('+icon+')';
        });
        if (state === 'progress') {
          progressEl.style.display = 'block';
        }
        if (state === 'error') {
          mono.sendMessage({action: 'getWarningIcon', type: type, color: '#AAAAAA'}, function(icon) {
            template.icon.style.backgroundImage = 'url('+icon+')';
          });
          progressEl.style.display = 'block';
        }
      };

      return {
        onPrepare: function(text) {
          setState('progress');
          progressEl.textContent = text;
        },
        onProgress: function(count, max) {
          progressEl.textContent = language.vkFoundFiles.replace('%d', count) + ' ' + language.vkFoundOf + ' ' + max;
        },
        onReady: function() {
          mono.trigger(popupEl, 'kill');
        },
        onError: function(text) {
          setState('error');
          progressEl.textContent = text;
        }
      }
    },

    getAudioLinksViaAPI: function(trackIdList, onProgress, cb) {
      var abort = false;
      var trackList = [];
      var len = trackIdList.length;
      var next = function() {
        if (abort) {
          return;
        }
        var trackIdArr = trackIdList.splice(0, 10);
        if (trackIdArr.length === 0) {
          return cb(trackList);
        }

        mono.sendMessage({
          action: 'getOkAudioListLinks',
          trackIdArr: trackIdArr,
          jsessionId: audio.jsessionId
        }, function(responseList){
          if (Array.isArray(responseList)) {
            for (var i = 0, item; item = responseList[i]; i++) {
              if (typeof item.play !== 'string' || typeof item.track !== 'object') continue;

              var url = item.play;
              var md5 = url.match(/(?:\?|&)md5=([\da-f]{32})/i);
              if (!md5) continue;

              var title;
              if (item.track.name) {
                title = item.track.name;
              }
              if (item.track.ensemble) {
                title = item.track.ensemble + (title ? ' - ' + title : '');
              }
              if (!title) {
                title = 'noname';
              }

              md5 = md5[1];
              try {
                md5 = SaveFrom_Utils.md5(md5 + 'secret');
                var hash = audio.getHash(md5);

                url += '&clientHash=' + hash;

                trackList.push({
                  url: url,
                  duration: item.track.duration || 0,
                  title: title,
                  filename: mono.fileName.modify(title) + '.mp3'
                });
              } catch(err) {}
            }
          }
          onProgress(len - trackIdList.length, len);
          next();
        });
      };
      next();

      return {
        abort: function() {
          abort = true;
        }
      }
    },

    getAudioListLinksPopup: function(trackIdList, title, cb) {
      var process;
      var popup = this.getPopup(title, 'audio', function onClose() {
        if (process) {
          process.abort();
        }
      });
      var _cb = function(links) {
        if (links.length === 0) {
          popup.onError(language.vkMp3LinksNotFound);
          return;
        }
        popup.onReady();

        cb(links);
      }.bind(this);

      popup.onPrepare(language.download+' ...');

      process = this.getAudioLinksViaAPI(trackIdList, popup.onProgress, _cb);
    },

    getAudioLinks: function(container, title, cb) {
      var rowList = container.querySelectorAll(['.m_portal_track', '.m_c_tr', '.mus-tr_i']);
      var trackIdList = [];
      for (var i = 0, row; row = rowList[i]; i++) {
        var trackIdObj = audio.getTrackId(row);
        for (var trackId in trackIdObj) {
          trackIdList.push(trackId);
        }
      }
      this.getAudioListLinksPopup(trackIdList, title, cb);
    },

    downloadMP3Files: function() {
      var container = audio.getLayer() || document;
      var title = audio.getPlaylistName(container);
      audio.getAudioLinks(container, title, function(trackList) {
        SaveFrom_Utils.downloadList.showBeforeDownloadPopup(trackList, {
          type: 'audio',
          folderName: title
        });
      });
    },

    showListOfAudioFiles: function(showPlaylist) {
      var container = audio.getLayer() || document;
      var title = audio.getPlaylistName(container);
      audio.getAudioLinks(container, title, function(trackList) {
        if(trackList.length) {
          if(showPlaylist) {
              SaveFrom_Utils.playlist.popupPlaylist(trackList, title, true);
          } else {
              SaveFrom_Utils.playlist.popupFilelist(trackList);
          }
          return;
        }

        alert(language.vkMp3LinksNotFound);
      });
    }
  };

  //  /AUDIO
  ///////////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////////
  //  VIDEO

  var video = {
    currentVideoMenu: undefined,

    inline: {
      'feed_panel_activity': {selector: 'img.vid-card_img'},
      'share_card': {selector: 'img.vid-card_img'},
      'dsub': {selector: 'img.cthumb_img'},
      'd_comment_w_center': {selector: '.videomail_Thumb img', parent: true},
      'd_comment_right_w': {selector: '.vid-card_img_w img', parent: true},
      'media-layer-new_hld': {'selector': 'img.vid-card_img'},
      'feed-i_post' : {selector: 'img.vid-card_img', sibling: 'feed-i_links'}
    },

    reImg: {
      'getYoutubeLinks': /(?:\/|\.)ytimg\.com\/vi\/([\w\-]+)/i,
      'getVimeoLinks': /(?:\/|\.)vimeocdn\.com\/ts\/(.+)/i,
      'getOdnoklassnikiLinks': /\.mail\.ru\/media\/(OK_\d+_\d+)/i,
      'getOdklLinks': /\.mycdn\.me\/getImage\?(?:.+&)?id=(\d+)/i,
      'getDailymotionLinks': /\.dmcdn\.net\/(\w+)\//i,
      'getOdklPladformMeta': /\.pladform\.ru\/(\w+)\//i
    },


    appendButton: function(links, title, request, container) {
      var insertContainer = container.querySelector('div.vp-layer-info_cnt');
      if (!insertContainer) {
        return;
      }

      var oldBtn = insertContainer.querySelector('span.'+downloadLinkClassName);
      if (oldBtn !== null) {
        oldBtn.parentNode.removeChild(oldBtn);
      }
      oldBtn = null;

      var currentBtn = undefined;
      insertContainer.appendChild(currentBtn = mono.create('span', {
        className: downloadLinkClassName,
        style: {
          marginLeft: '12px'
        },
        on: [
          ['click', function(e) {e.stopPropagation();}],
          ['mousedown', function(e) {e.stopPropagation();}],
          ['keydown', function(e) {e.stopPropagation();}]
        ],
        append: mono.create('a', {
          href: '#',
          text: language.download,
          on: ['click', function(e) {
            e.preventDefault();

            if (video.currentVideoMenu) {
              video.currentVideoMenu.hide();
            }
            var menu = video.currentVideoMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download+'...', 'sf-single-video-menu', {
              parent: container
            });

            if ([1].indexOf(preference.cohortIndex) !== -1) {
              mono.sendMessage({action: 'trackCohort', category: 'ok', event: 'click', label: 'video-under'});
            }

            if(request) {
              if (request.extVideoId === undefined) {
                return videoFeed.onGetLinks.call(videoFeed, menu, null, request);
              }
              if(request.action === 'getOdklLinks') {
                videoFeed.getOdklLinks(request, videoFeed.onGetLinks.bind(videoFeed, menu, null));
              } else
              if(request.action === 'getOkMetadata') {
                videoFeed.getOkMetadata(request, videoFeed.onGetLinks.bind(videoFeed, menu, null));
              } else {
                mono.sendMessage(request, videoFeed.onGetLinks.bind(videoFeed, menu, null));
              }
              return;
            }

            if(links) {
              var menuLinks = videoFeed.prepareLinks(links, title);
              menu.update(menuLinks);
            }

          }]
        })
      }));

      clearTimeout(video.currentBtnTimer);
      video.currentBtnTimer = setTimeout(function() {
        if (!document.body.contains(insertContainer)) {
          currentBtn = null;
        }
        insertContainer = null;
        var newContainer = document.querySelector('div.vp_video');
        if (newContainer === null) return;
        newContainer = newContainer.parentNode;
        if (!newContainer.contains(currentBtn)) {
          video.catchPopup();
        }
      }, 5000);
    },

    openGraphToAction: function(data) {
      if (!data) {
        return;
      }
      var request = {};
      var url = data.movie.contentId;
      if (url.indexOf('vimeo') !== -1) {
        url = SaveFrom_Utils.getMatchFirst(url, /clip_id=(\w+)/i);
        request.action = 'getVimeoLinks';
        request.extVideoId = url;
        return request;
      } else
      if (url.indexOf('dailymotion') !== -1) {
        url = SaveFrom_Utils.getMatchFirst(url, /swf\/video\/(\w+)/i);
        request.action = 'getDailymotionLinks';
        request.extVideoId = url;
        return request;
      } else
      if (url.indexOf('pladform') !== -1) {
        var urlArgs = mono.parseUrlParams(url);
        url = {
          playerId: urlArgs.pl,
          videoId: urlArgs.videoid
        };
        request.action = 'getOdklPladformVideo';
        request.extVideoId = url;
        return request;
      }
    },

    appendVideoLink: function(provider, vid, metadata, container, request) {
      if (request) {
        return video.appendButton(undefined, undefined, request, container);
      }
      if(!provider || !vid) {
        return;
      }
      var action = undefined;
      switch(provider) {
        case 'user_youtube':
          action = 'getYoutubeLinks';
          break;

        case 'open_graph':
          var ogReq = video.openGraphToAction(metadata);
          if (ogReq) {
            action = ogReq.action;
            vid = ogReq.extVideoId;
          }
          break;

        case 'uploaded_odkl':
          if(metadata && metadata.movie && metadata.movie.movieId) {
            vid = metadata.movie.movieId;
            action = 'getOdklLinks';
          }
          break;

        case 'uploaded':
        case 'partner':
        case 'ykl':
          if (metadata && metadata.videos && metadata.movie) {
            return video.appendButton(metadata.videos, metadata.movie.title, undefined, container);
          }
          break;
      }

      if(action !== undefined) {
        video.appendButton(undefined, undefined, {
          action: action,
          extVideoId: vid,
          title: ''
        }, container);
      }
    },

    waitEl: function(func, cb, options) {
      var out;
      var capsule = mono.extend({
        abort: function() {
          clearInterval(capsule.timeout);
          capsule.isAborted = true;
        }
      }, {
        delay: 500,
        repeat: 12,
        isAborted: false,
        timeout: null
      }, options);

      if (out = func()) {
        cb(out);
        return capsule;
      }

      (function wait() {
        capsule.repeat--;
        capsule.timeout = setTimeout(function() {
          if (capsule.isAborted) {
            return;
          }

          if (out = func()) {
            return cb(out);
          }

          if (!capsule.isAborted && capsule.repeat) {
            wait();
          }
        }, capsule.delay);
      })();

      return capsule;
    },

    lastWaitEl: null,

    catchPopup: function() {
      "use strict";
      var flashVarsNode, html5player, container, videoContainer;
      this.lastWaitEl && this.lastWaitEl.abort();

      this.lastWaitEl = this.waitEl(function() {
        videoContainer = document.querySelector('div.vp_video');
        if (!videoContainer) {
          return;
        }

        flashVarsNode = videoContainer.querySelector('param[name="flashvars"]');

        html5player = videoContainer.querySelector('.html5-vpl');

        return flashVarsNode || html5player;
      }, function() {
        container = videoContainer.parentNode;
        var exBtn = container.querySelector('.'+downloadLinkClassName);
        if (exBtn) {
          return;
        }

        if (html5player) {
          var textarea = html5player.querySelector('textarea');
          textarea = textarea && textarea.textContent;
          if (!textarea) {
            return;
          }
          var id = textarea.match(/\/videoembed\/(\d+)/);
          id = id && id[1];
          if (!id) {
            return;
          }
          
          return video.appendVideoLink(null, null, null, container, {
            action: 'getOdklLinks',
            extVideoId: id
          });
        }

        var flashVars = flashVarsNode.getAttribute('value');
        flashVarsNode = null;

        var metadataUrl = SaveFrom_Utils.getMatchFirst(flashVars, /metadataUrl=([^&]+)/);
        if(metadataUrl) {
          return mono.sendMessage({action: 'getOkMetadata', url: decodeURIComponent(metadataUrl)}, function(metadata) {
            if (metadata === undefined || metadata.provider === undefined || metadata.movie === undefined) {
              return;
            }
            video.appendVideoLink(metadata.provider.toLowerCase(), metadata.movie.contentId, metadata, container);
          });
        }

        var vid = undefined;

        var provider = SaveFrom_Utils.getMatchFirst(flashVars, /providerId=(\w+)/);
        if(provider) {
          provider = provider.toLowerCase();
          vid = SaveFrom_Utils.getMatchFirst(flashVars, /movieId=([\w\-]+)/);
          return video.appendVideoLink(provider, vid, undefined, container);
        }

        var metadata = SaveFrom_Utils.getMatchFirst(flashVars, /metadata=([^&]+)/);
        if(metadata) {
          metadata = decodeURIComponent(metadata);
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            metadata = undefined;
          }
          if(metadata) {
            if (metadata.movie && metadata.movie.title &&
              metadata.movie.movieId && metadata.movie.link) {
              vid = metadata.movie.movieId || '';
              if (vid.substr(0, 3) === 'OK_') {
                vid = SaveFrom_Utils.getMatchFirst(vid, /OK_\d+_(\d+)/);
              }
              var sid = mono.parseUrlParams(metadata.movie.link)['st.vpl.sid'];
              if (vid && sid) {
                return video.appendVideoLink(null, null, null, container, {
                  title: metadata.movie.title,
                  sid: sid,
                  action: 'getOdklLinks',
                  extVideoId: vid
                });
              }
            }
            if (metadata.provider && metadata.movie && metadata.movie.contentId) {
              provider = metadata.provider.toLowerCase();
              vid = metadata.movie.contentId;
              return video.appendVideoLink(provider, vid, metadata, container);
            }
          }
        }
      });
    },

    rmBtn: function() {
      if (video.currentVideoMenu) {
        video.currentVideoMenu.hide();
      }
      clearTimeout(video.currentBtnTimer);
      video.lastWaitEl && video.lastWaitEl.abort();
      var dlBtn = document.querySelectorAll('.'+downloadLinkClassName);
      for (var i = 0, item; item = dlBtn[i]; i++) {
        item.parentNode.removeChild(item);
      }
    }
  };

  var videoFeed = {
    iconCache: {},
    btnClassName: 'sf-feed-dl-btn',
    state: false,
    currentMenu: undefined,
    injectedStyle: undefined,
    thumbClassName: 'vid-card_img',
    prepareLinks: function(links, title) {
      var linksLen = links?links.length:0;
      if (linksLen === 0) {
        return language.noLinksFound;
      }
      if (typeof links === 'string') {
        return links;
      }
      title = title || '';
      var menuLinks = [];
      var popupLink;
      var quality;
      var format;
      var url;
      for (var i = 0; i < linksLen; i++) {
        var link = links[i];
        if(typeof(link) === 'object' && link.url) {
          url = link.url;
          var ext = link.ext;

          if(!ext) {
            ext = 'FLV';
            if(link.url.indexOf('.mp4') !== -1) {
              ext = 'MP4';
            }
            if (link.url.indexOf('.mov') !== -1) {
              ext = 'MOV';
            }
            if (link.url.indexOf('.mpg') !== -1) {
              ext = 'MPG';
            }
          }

          ext = ext.toLowerCase();
          format = ext.toUpperCase();
          quality = link.subname || link.quality || link.name || ext;
        } else {
          url = link;
          ext = 'FLV';
          if(url.indexOf('.mp4') !== -1) {
            ext = 'MP4';
          }
          if (url.indexOf('.mov') !== -1) {
            ext = 'MOV';
          }
          if (url.indexOf('.mpg') !== -1) {
            ext = 'MPG';
          }

          ext = ext.toLowerCase();
          format = ext.toUpperCase();

          quality = ext;
          var qualityMath = SaveFrom_Utils.getMatchFirst(links[i], /\.(\d+)\.mp4/i);
          if(qualityMath) {
            quality = qualityMath;
          }
        }


        var trueName = [144,240,360,480,720,1080,1440,2160];
        var origName = ['mobile','lowest','low','sd','hd','full','quad','ultra'];
        var pos = origName.indexOf(quality);
        if (pos !== -1) {
          quality = trueName[pos];
        }

        popupLink = { href: url, title: link.title? link.title : title, ext: ext, format: format, quality: quality, forceDownload: true };
        menuLinks.push(popupLink);
      }
      return menuLinks;
    },
    findMetaDataId: function(parent, regexp) {
      var info = '', keyRe = /videoPlayerMetadata|metadata/i;

      var node = parent.querySelectorAll('div[data-query],span[data-query]');
      if(node && node.length > 0)
      {
        for(var i = 0; i < node.length; i++)
        {
          var q = node[i].getAttribute('data-query');
          if(q.search(keyRe) > -1)
          {
            info = q;
            break;
          }
        }
      }

      if(!info)
      {
        node = parent.querySelectorAll('div[onclick],span[onclick]');
        for(var i = 0; i < node.length; i++)
        {
          var q = node[i].getAttribute('onclick');
          if(q.search(keyRe) > -1)
          {
            info = q;
            break;
          }
        }
      }

      if(!info)
        return '';

      info = decodeURIComponent(mono.decodeUnicodeEscapeSequence(info));
      var mid = SaveFrom_Utils.getMatchFirst(info, regexp || /(?:\?|&)mid=(\d+)/i);
      return mid;
    },
    getData: function(node, parent) {
      var title = node.alt;
      var src = node.src;
      if (!src) {
        return;
      }

      var vid, sid;
      var hrefAttrs;
      var pp = parent.parentNode;
      if (pp && pp.tagName === 'A' && pp.getAttribute('hrefattrs')) {
        hrefAttrs = pp;
      } else {
        hrefAttrs = parent.querySelector('a[hrefattrs]');
      }

      if (hrefAttrs) {
        hrefAttrs = hrefAttrs.getAttribute('hrefattrs');
        if (hrefAttrs) {
          hrefAttrs = mono.parseUrlParams(hrefAttrs, {argsOnly: 1, forceSep: '&', useDecode: 1});

          sid = hrefAttrs['st.vpl.sid'];
          vid = hrefAttrs['st.vpl.id'] || (pp && pp.parentNode && pp.parentNode.dataset.id) || '';
          if (vid.substr(0, 3) === 'OK_') {
            vid = SaveFrom_Utils.getMatchFirst(vid, /OK_\d+_(\d+)/);
          }
          if (vid) {
            return {
              title: title,
              sid: sid,
              action: 'getOdklLinks',
              extVideoId: vid
            };
          }
        }
      }

      for(var k in video.reImg) {
        var mVid = SaveFrom_Utils.getMatchFirst(src, video.reImg[k]);
        vid = mVid;
        if (!vid) {
          continue;
        }

        if (!parent) {
          continue;
        }

        var data = {};
        data.action = k;
        data.title = title;
        if (k === 'getOdnoklassnikiLinks') {
          vid = SaveFrom_Utils.getMatchFirst(mVid, /OK_\d+_(\d+)/);
          data.action = 'getOdklLinks';
        } else
        if (k === 'getOdklLinks') {
          vid = videoFeed.findMetaDataId(parent);
        } else
        if (k === 'getOdklPladformMeta') {
          vid = videoFeed.findMetaDataId(parent);
          data.action = 'getOdklLinks';
        } else
        if(k == 'getVimeoLinks') {
          vid = videoFeed.findMetaDataId(parent, /clip_id=(\w+)/i);
        } else
        if (k === 'getDailymotionLinks') {
          vid = videoFeed.findMetaDataId(parent, /dailymotion\.com\/swf\/video\/(\w+)\??/i);
        }

        if (!vid) {
          continue;
        }

        data.extVideoId = vid;

        return data;
      }
    },
    onGetMetadata: function(req, data, cb) {
      if (!data || !data.videos) {
        return cb();
      }

      var response = req;
      delete response.extVideoId;

      if (data.provider === 'USER_YOUTUBE') {
        var vId;
        if (data.videos.length === 0 && data.movie) {
          vId = data.movie.contentId;
        } else {
          var v = data.videos[0].url;
          vId = v.substr(v.lastIndexOf('/') + 1);
        }
        var request = {
          action: 'getYoutubeLinks',
          extVideoId: vId
        };
        mono.sendMessage(request, function(response) {
          cb(response);
        });
        return;
      }

      if (data.provider === 'OPEN_GRAPH') {
        var request = video.openGraphToAction(data);
        if (!request) {
          return cb();
        }
        mono.sendMessage(request, function(response) {
          cb(response);
        });
        return;
      }

      if (data.videos.length === 0) {
        return cb();
      }

      var links = [];
      for(var i = 0; i < data.videos.length; i++) {
        var v = data.videos[i];
        if(v.url && v.url.search(/^https?:\/\//i) > -1) {
          links.push({
            url: v.url,
            subname: v.name ? v.name : '',
            ext: 'MP4'
          });
        }
      }

      if (data.movie !== undefined && data.movie.title) {
        response.title = data.movie.title;
      }

      response.links = links;

      cb(response);
    },
    getOkMetadata: function(request, cb) {
      mono.sendMessage({action: 'getOkMetadata', url: request.url}, function(data) {
        videoFeed.onGetMetadata(request, data, cb);
      });
    },
    getLocalMetadata: function(request, cb) {
      var url = request.url;
      if (!url) {
        return cb();
      }
      mono.ajax({
        url: url,
        localXHR: true,
        success: function(data) {
          var obj;
          try {
            obj = JSON.parse(data);
          } catch (e) {}
          videoFeed.onGetMetadata(request, obj, cb);
        },
        error: function(xhr) {
          cb();
        }
      });
    },
    getOdklLinks: function(request, cb, force) {
      if (!request.extVideoId) {
        return cb();
      }
      var url = location.protocol + '//' + location.host + '/dk?cmd=videoPlayerMetadata&mid=' + request.extVideoId +
        '&rnd=' + Date.now() + Math.random();

      if (force && request.sid) {
        url += '&mtId=' + request.sid;
      }
      request.url = url;

      videoFeed.getLocalMetadata(request, function(response) {
        if (!response && request.sid && !force) {
          return videoFeed.getOdklLinks(request, cb, 1);
        }
        cb(response);
      });
    },
    getContainerType: function(node) {
      var chatBox = document.querySelector('.mdialog_chat_window');
      return chatBox && chatBox.contains(node);
    },
    onGetLinks: function(menu, jsonBtnData, response) {
      if (!response || !response.links) {
        return menu.update(language.noLinksFound);
      }

      var prepareLinkType = undefined;
      if (response.action === 'getYoutubeLinks') {
        prepareLinkType = 'youtube';
      } else
      if (response.action === 'getVimeoLinks') {
        prepareLinkType = 'vimeo';
      } else
      if (response.action === 'getDailymotionLinks') {
        prepareLinkType = 'dailymotion';
      }

      var menuLinks = undefined;
      if (prepareLinkType === undefined) {
        menuLinks = videoFeed.prepareLinks(response.links, response.title);
      } else {
        menuLinks = SaveFrom_Utils.popupMenu.prepareLinks[prepareLinkType](response.links, response.title);
      }

      if (jsonBtnData && menuLinks && Array.isArray(menuLinks) && menuLinks.length > 0) {
        videoFeed.iconCache[jsonBtnData] = menuLinks;
      }

      menu.update(menuLinks);
    },
    onBtnClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var jsonBtnData = this.dataset.sfBtnData;
      try {
        var btnData = JSON.parse(jsonBtnData);
      } catch (e) {
        return;
      }

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        if (btnData.isChat) {
          mono.sendMessage({action: 'trackCohort', category: 'ok', event: 'click', label: 'video-message'});
        } else {
          mono.sendMessage({action: 'trackCohort', category: 'ok', event: 'click', label: 'video-feed-on-video'});
        }
      }

      if (videoFeed.currentMenu !== undefined) {
        videoFeed.currentMenu.hide();
        videoFeed.currentMenu = undefined;
      }

      // post in popup
      var menuParent = document.querySelector('#mtLayer.__active #mtLayerMain > div');
      if (!menuParent) {
        // video gaallery
        menuParent = document.getElementById('vv_content');
      }
      if (!menuParent) {
        // pm msgs
        menuParent = document.getElementById('__messagesList__');
        if (menuParent && !menuParent.offsetParent) {
          menuParent = null;
        }
      }
      var menu = videoFeed.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', 'sf-popupMenu', {
        parent: menuParent||undefined
      });

      if (videoFeed.iconCache[jsonBtnData]) {
        menu.update(videoFeed.iconCache[jsonBtnData]);
        return;
      }

      if(btnData.action === 'getOdklLinks') {
        videoFeed.getOdklLinks(btnData, videoFeed.onGetLinks.bind(videoFeed, menu, jsonBtnData));
      } else
      if(btnData.action === 'getOkMetadata') {
        videoFeed.getOkMetadata(btnData, videoFeed.onGetLinks.bind(videoFeed, menu, jsonBtnData));
      } else {
        mono.sendMessage(btnData, videoFeed.onGetLinks.bind(videoFeed, menu, jsonBtnData));
      }
    },
    onImgOver: function(e) {
      if (this.dataset.sfSkip === '1') {
        return;
      }
      var _this = videoFeed;
      var isChat = _this.getContainerType(this);

      var container;
      if (isChat) {
        container = SaveFrom_Utils.getParentByClass(this, 'd_comment_text_w');
        if (!container) {
          this.dataset.sfSkip = '1';
          return;
        }
      } else {
        container = this.parentNode.parentNode;
        if (!container.classList.contains('vid-card_cnt')) {
          container = container.parentNode;
        }
        if (!container.classList.contains('vid-card_cnt')) {
          this.dataset.sfSkip = '1';
          return;
        }
      }

      if (container.getElementsByClassName(_this.btnClassName).length !== 0) {
        return;
      }

      var isVideoVitrina = this.parentNode.classList.contains('vid-card_img__link');

      var btnData = _this.getData(this, container);
      if (!btnData) {
        this.dataset.sfSkip = '1';
        return;
      }

      btnData.isChat = isChat;

      container.appendChild(mono.create('i', {
        class: _this.btnClassName,
        data: {sfBtnData: JSON.stringify(btnData)},
        append: [
          !mono.isOpera ? undefined : mono.create('img', {
            src: SaveFrom_Utils.svg.getSrc('download', '#eb722e'),
            style: {
              width: '12px',
              height: '12px',
              margin: '4px',
              backgroundColor: 'transition'
            }
          })
        ],
        onCreate: function(el) {
          if (isChat) {
            el.style.left = '15px';
            el.style.top = '15px';
          }
          if (isVideoVitrina) {
            el.style.backgroundColor = '#454648';
            el.style.borderColor = 'rgb(53, 53, 53)';
          }
          isVideoVitrina = null;
        },
        on: [
          ['click', videoFeed.onBtnClick],
          ['mousedown', function(e) {e.stopPropagation();}],
          ['keydown', function(e) {e.stopPropagation();}]
        ]
      }));

      container = null;
    },
    onOver: function(e) {
      var node = e.target;
      if (!node || node.nodeType !== 1) {
        return;
      }
      if (node.tagName !== 'IMG') {
        if (!mono.isSafari && !mono.isOpera && node.id === 'photo-layer_photo') {
          photo.addCurrentDlBtn(node);
        }
        return;
      }
      var _this = videoFeed;
      _this.onImgOver.call(node, e);
    },
    enable: function() {
      if (this.state) {
        return;
      }
      this.state = true;

      mono.off(document, 'mouseenter', this.onOver, true);
      mono.on(document, 'mouseenter', this.onOver, true);

      this.injectedStyle = mono.create('style', {
        text: "div > .sf-feed-dl-btn {" +
        'display: none;' +
        'border: 1px solid #F8F8F8;' +
        'width: 20px;' +
        'height: 20px;' +
        'padding: 0;' +
        'position: absolute;' +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#eb722e')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        'top: 5px;' +
        'left: 5px;' +
        'z-index: 1;' +
        'cursor: pointer;' +
        "}" +
        "div > .sf-feed-dl-btn:hover {" +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#00B75A')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        "}" +
        "div > .sf-feed-dl-btn:active {" +
        "outline: 0;" +
        "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
        "}" +
        "div:hover > .sf-feed-dl-btn {display: block;}"
      });

      document.body.appendChild(this.injectedStyle);
    },
    disable: function() {
      if (!this.state) {
        return;
      }
      this.state = false;

      mono.off(document, 'mouseenter', this.onOver, true);
      if (this.injectedStyle.parentNode) {
        this.injectedStyle.parentNode.removeChild(this.injectedStyle);
      }

      if (videoFeed.currentMenu) {
        videoFeed.currentMenu.hide();
      }


    },
    rmBtn: function() {
      var btnList = document.querySelectorAll('.sf-feed-dl-btn');
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
      var dataAttr = mono.dataAttr2Selector('sfSkip');
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
    }
  };

  //  /VIDEO
  ///////////////////////////////////////////////////////////////////


  //  PHOTO
  ///////////////////////////////////////////////////////////////////

  var photo = {
    rmCurrentPhotoBtn: function(insertContainer) {
      if (this.photoMenu !== undefined) {
        this.photoMenu.hide();
      }
      var exBtn = undefined;
      var imgList = document.querySelectorAll('.sf-dl-current-photo-btn');
      for (var i = 0, imgItem; imgItem = imgList[i]; i++) {
        if (!insertContainer || !insertContainer.contains(imgItem)) {
          imgItem.parentNode.removeChild(imgItem);
        } else {
          exBtn = imgItem;
        }
      }
      return exBtn;
    },
    addDlCurrentPhotoBtn: function(container) {
      var exBtn = this.rmCurrentPhotoBtn(container);
      if (exBtn) {
        return;
      }
      exBtn = null;

      var _this = this;

      container.appendChild(mono.create('a', {
        class: 'sf-dl-current-photo-btn',
        href: '#',
        title: language.download,
        on: ['click', function(e) {
          e.stopPropagation();
          e.preventDefault();

          var onKeyDown = function(e) {
            if (e.keyCode === 18 || e.keyCode === 17) return;
            menu.hide();
            document.removeEventListener('keydown', onKeyDown);
          };
          var menu = _this.photoMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', "photoDlMenu", {
            parent: container,
            onShow: function() {
              document.addEventListener('keydown', onKeyDown);
            },
            onHide: function() {
              document.removeEventListener('keydown', onKeyDown);
            }
          });

          var img = container.querySelector('img.plp_photo');
          if (!img) {
            return menu.update(language.noLinksFound);
          }
          var url = img.dataset.fsSrc || img.dataset.nfsSrc || img.src;
          if (!url) {
            return menu.update(language.noLinksFound);
          }

          var photoExt = 'jpg';
          var photoTitle = 'photo_'+parseInt(Date.now() / 1000);
          menu.update([{
            href: url, title: photoTitle, quality: language.download, format: ' ',
            ext: photoExt, forceDownload: true, isBank: true, func: function() {
              menu.hide();
            }}]);
        }],
        append: [
          !mono.isOpera ? undefined : mono.create('img', {
            src: SaveFrom_Utils.svg.getSrc('download', '#eb722e'),
            style: {
              width: '12px',
              height: '12px',
              margin: '4px'
            }
          })
        ]
      }));

      if (photo.dlCurrentBtnStyle !== undefined) {
        return;
      }
      photo.dlCurrentBtnStyle = mono.create('style', {
        text: "div > .sf-dl-current-photo-btn {" +
        'display: none;' +
        'border: 1px solid #F8F8F8;' +
        'width: 20px;' +
        'height: 20px;' +
        'padding: 0;' +
        'position: absolute;' +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#eb722e')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        'top: 73px;' +
        'left: 20px;' +
        'z-index: 100;' +
        'cursor: pointer;' +
        "}" +
        "div > .sf-dl-current-photo-btn:hover {" +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#00B75A')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        "}" +
        "div > .sf-dl-current-photo-btn:active {" +
        "outline: 0;" +
        "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
        "}" +
        "div:hover > .sf-dl-current-photo-btn {display: block;}"
      });
      document.body.appendChild(photo.dlCurrentBtnStyle);
    },
    addCurrentDlBtn: function(container) {
      if (container.dataset.sfSkip === '1') {
        return;
      }
      container.dataset.sfSkip = '1';
      var img = container.querySelector('img.plp_photo');
      if (!img) {
        return;
      }
      var url = img.dataset.fsSrc || img.dataset.nfsSrc || img.src;
      if (!url) {
        return;
      }
      this.addDlCurrentPhotoBtn(container);
    }
  };

  //  /PHOTO
  //////////////////////////////////////////////////////////////////


  var odnoklassniki = {
    run: function()
    {
      moduleState = 1;
      audio.showLinks();
      videoFeed.enable();
      mono.onUrlChange(function(url, oldUrl) {
        video.catchPopup();
      }, 1);
    },
    changeState: function(state) {
      moduleState = state;
      video.rmBtn();
      audio.disable();
      photo.rmCurrentPhotoBtn();
      mono.clearUrlChange();
      videoFeed.disable();
      videoFeed.rmBtn();

      if (state) {
        odnoklassniki.run();
      }
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('mailru', function(moduleName) {
  if (mono.isSafari || mono.isGM) {
    if (!mono.checkUrl(document.URL, [
      'http://my.mail.ru/*',
      'https://my.mail.ru/*'
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var moduleState = 0;

  var allowDownloadMode = false;
  var init = function() {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return mailru.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'downloadMP3Files') {
        if (allowDownloadMode) {
          audio.downloadMP3Files();
        } else {
          audio.showListOfAudioFiles(false);
        }
      }
      if (message.action === 'downloadPlaylist') {
        audio.showListOfAudioFiles(true);
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleMailru) {
        return;
      }
      allowDownloadMode = mono.isChrome || mono.isFF || (mono.isGM && mono.isTM);
      mailru.run();
    });
  };

  if (mono.isIframe()) {
    return;
  }

  var tooltip = {
    tooltip: undefined,
    updatePos: function(button, options) {
      var btnPosition = SaveFrom_Utils.getPosition(button);
      var tooltipSize = SaveFrom_Utils.getSize(tooltip.tooltip);

      tooltip.tooltip.style.top = (btnPosition.top + options.top - tooltipSize.height)+'px';
      
      var left = btnPosition.left + parseInt(options.width / 2) - parseInt(tooltipSize.width / 2);
      var pageWidth = document.body.clientWidth;
      if (pageWidth < left + tooltipSize.width) {
        left = pageWidth -  tooltipSize.width;
      }
      tooltip.tooltip.style.left = left + 'px';
    },
    show: function(button, options) {
      if (tooltip.tooltip !== undefined) {
        tooltip.hide();
      } else {
        tooltip.tooltip = mono.create('div', {
          class: 'sf-tooltip',
          style: {
            position: 'absolute',
            display: 'none',
            zIndex: 9999,
            maxWidth: '200px',
            opacity: 0,
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            color: '#111',
            fontFamily: 'arial, verdana, sans-serif, Lucida Sans'
          },
          on: ['mouseenter', function(e) {
            tooltip.hide();
          }]
        });
        document.body.appendChild(tooltip.tooltip);
      }
      tooltip.tooltip.style.display = 'block';
      SaveFrom_Utils.setStyle(tooltip.tooltip, options.style);

      setTimeout(function() {
        tooltip.updatePos(button, options);
        tooltip.tooltip.style.opacity = 1;
      });

      return tooltip.tooltip;
    },
    hide: function() {
      tooltip.tooltip.style.opacity = 0;
      tooltip.tooltip.style.display = 'none';
    }
  };

  var getFolderName = function () {
    var folderName = document.title;
    var sep = folderName.indexOf('-');
    if (sep !== -1) {
      folderName = folderName.substr(0, sep -1);
    }

    return mono.fileName.modify(folderName);
  };

  var audio = {
    className: 'sf-audio-panel',
    lastRow: null,
    style: undefined,
    secondsFromDuration: function(time) {
      var minSec = time.split(':');
      return parseInt(minSec[0]) * 60 + parseInt(minSec[1]);
    },
    getTitle: function(row) {
      var title = row.querySelector('.jp__track-fullname');
      var artist = row.querySelector('.jp__track-performer');
      if (artist === null) {
        artist = row.querySelector('.jp__track-name-text');
        if (artist !== null) {
          artist = artist.querySelector('a:not(.jp__track-fullname)');
          if (artist !== null) {
            var tmp = title;
            title = artist;
            artist = tmp;
          }
        }
      }
      if (artist !== null) {
        artist = artist.textContent.trim();
        if (!artist) {
          artist = 'noname';
        }
      } else {
        artist = '';
      }
      if (artist) {
        artist = artist + ' - ';
      } else {
        artist = '';
      }
      if (title === null) {
        return;
      }
      title = title.textContent;
      var fullName =  artist + title;
      fullName = fullName.replace(/[\r\n\t\s]+/img, ' ').replace(/\s+/g, ' ').trim();
      return fullName;
    },
    getTitle2: function(row) {
      var title = row.querySelector('.title');
      var name = row.querySelector('.name');
      var author = row.querySelector('.author');
      if (name !== null) {
        name = name.textContent;
        if (name.length === 0) {
          name = 'noname';
        }
      }
      if (author) {
        author = author.textContent;
      }
      var fullName = '';
      if (name && author) {
        fullName = author + ' - ' + name;
      } else {
        fullName = title.textContent;
      }
      fullName = fullName.replace(/[\r\n\t\s]+/img, ' ').replace(/\s+/g, ' ').trim();
      return fullName;
    },
    getMp3UrlList: function(cb) {
      var ver = 1;
      var rowList = document.querySelectorAll('.song');
      if (rowList.length === 0) {
        rowList = document.querySelectorAll('.jp__track');
        ver = 0;
      }
      var waitCount = rowList.length;
      var readyCount = 0;
      var urlList = [];
      var dblList = {};
      var isReady = function() {
        if (waitCount === readyCount) {
          cb(urlList);
        }
      };
      if (waitCount === readyCount) {
        return isReady();
      }
      for (var i = 0, row; row = rowList[i]; i++) {
        audio.getUrl(row, ver, function(url) {
          readyCount++;
          if (!url) {
            return isReady();
          }
          if (dblList[url]) {
            return isReady();
          }
          dblList[url] = 1;

          var duration;
          var fullTitle;
          if(ver === 0) {
            duration = row.querySelector('.jp__track-duration-total');
            if (duration === null) {
              return isReady();
            }
            fullTitle = audio.getTitle(row);
            if (!fullTitle) {
              return isReady();
            }
          } else {
            duration = row.querySelector('.duration');
            if (duration === null) {
              return isReady();
            }
            fullTitle = audio.getTitle2(row);
            if (!fullTitle) {
              return isReady();
            }
          }
          var filename = mono.fileName.modify(fullTitle) + '.mp3';
          duration = audio.secondsFromDuration(duration.textContent);
          urlList.push({url: url, filename: filename, title: fullTitle, duration: duration});
          isReady();
        });
      }
    },
    showListOfAudioFiles: function(isPlaylist) {
      audio.getMp3UrlList(function(list) {
        if(list.length === 0) {
          return;
        }
        if (isPlaylist) {
          SaveFrom_Utils.playlist.popupPlaylist(list, getFolderName(), true);
        } else {
          SaveFrom_Utils.playlist.popupFilelist(list);
        }
      });
    },
    downloadMP3Files: function() {
      audio.getMp3UrlList(function(list) {
        if(list.length === 0) {
          return;
        }
        SaveFrom_Utils.downloadList.showBeforeDownloadPopup(list, {
          type: 'audio',
          folderName: getFolderName()
        });
      });
    },
    onDlBtnOver: function(e) {
      if (mono.isOpera || mono.isSafari) {
        return;
      }
      if (e.type === 'mouseenter') {
        var _this = this;
        var options = undefined;
        var ttp = tooltip.show(_this, options = {
          top: -14,
          width: 16,
          style: {
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            color: 'rgb(48, 48, 48)'
          }
        });
        if (_this.dataset.bitrate) {
          ttp.style.padding = '2px 5px 3px';
          ttp.textContent = ' (' + _this.dataset.size + ' ~ ' + _this.dataset.bitrate + ')';
          return;
        }
        ttp.style.padding = '2px 2px 0 2px';
        ttp.textContent = '';
        ttp.appendChild(mono.create('img', {
          src: 'http://my9.imgsmail.ru/r/my/preloader_circle_16.gif',
          height: 16,
          width: 16
        }));

        mono.sendMessage({action: 'getFileSize', url: _this.href}, function(response) {
          ttp.style.padding = '2px 5px 3px';
          if (!response.fileSize) {
            ttp.textContent = language.getFileSizeFailTitle;
            tooltip.updatePos(_this, options);
            return;
          }
          var size = SaveFrom_Utils.sizeHuman(response.fileSize, 2);
          var bitrate = Math.floor((response.fileSize / _this.dataset.duration) / 125) + ' ' + language.kbps;

          _this.dataset.bitrate = bitrate;
          _this.dataset.size = size;

          ttp.textContent = ' (' + size + ' ~ ' + bitrate + ')';

          tooltip.updatePos(_this, options);
        });
        return;
      }
      // mouseleave
      tooltip.hide();
    },
    getUrlViaBridge: function(row, cb) {
      if (audio.getUrlViaBridge.index === undefined) {
        audio.getUrlViaBridge.index = 0;
      }

      var className = 'sf-bridge-item-'+audio.getUrlViaBridge.index;
      audio.getUrlViaBridge.index++;
      row.classList.add(className);
      SaveFrom_Utils.bridge.send('get-data', [className], cb);
    },
    getUrl: function(row, rowType, cb) {
      var url = row.dataset.url;
      if (url) {
        return cb(url);
      }
      if (rowType === 0) {
        var urlLink = row.querySelector('a.js-jp__track-fullname');
        if (urlLink === null) {
          return cb();
        }
        urlLink = urlLink.href;
        var params = mono.parseUrlParams(urlLink);
        if (params.file === undefined || params.uid === undefined) {
          return audio.getUrlViaBridge(row, function(url) {
            if (url) {
              row.dataset.url = url;
            }
            cb(url);
          });
        }
        return cb('http://music.my.mail.ru/file/' + params.file + '.mp3?u=' + params.uid);
      } else
      if (rowType === 1) {
        if (row.dataset.file) {
          return cb('http://music.my.mail.ru/file/' + row.dataset.file + '.mp3');
        }
        return cb();
      }
    },
    onDlBtnClick: function(e) {
      e.stopPropagation();
      SaveFrom_Utils.downloadOnClick(e);

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'my.mail.ru', event: 'click', label: 'music-audio'});
      }
    },
    getDlLink: function(url, duration, fullTitle) {
      return mono.create('a', {
        data: {
          duration: duration
        },
        href: url,
        style: {
          position: 'relative',
          display: 'inline-block',
          width: '16px',
          height: '16px',
          verticalAlign: 'middle'
        },
        download: mono.fileName.modify(fullTitle + '.mp3'),
        on: [
          ['mouseenter', audio.onDlBtnOver],
          ['mouseleave', audio.onDlBtnOver],
          ['click', this.onDlBtnClick]
        ]
      });
    },
    addDownloadPanelNew: function(row, url) {
      var durationEl = row.querySelector('.duration');
      if (durationEl === null || url === undefined) {
        return;
      }
      var fullTitle = audio.getTitle2(row);
      if (!fullTitle) {
        return;
      }
      var container;
      if (!(container = durationEl.parentNode)) {
        return;
      }
      var duration = audio.secondsFromDuration(durationEl.textContent);

      var dlPanel = mono.create('div', {
        class: [audio.className, 'type-2'],
        style: {
          cssFloat: 'right'
        },
        append: [
          this.getDlLink(url, duration, fullTitle)
        ]
      });

      var sidebar = document.querySelector('.l-music__sidebar');
      if (sidebar.contains(container)) {
        dlPanel.style.lineHeight = '32px';
      }

      var titleEl = container.querySelector('.title');
      container.insertBefore(dlPanel, titleEl);
    },
    addDownloadPanel: function(row, url) {
      var duration = row.querySelector('.jp__track-duration-total');
      if (duration === null || url === undefined) {
        return;
      }
      var fullTitle = audio.getTitle(row);
      if (!fullTitle) {
        return;
      }
      var container;
      if (!(container = duration.parentNode) || !(container = container.parentNode)) {
        return;
      }
      duration = audio.secondsFromDuration(duration.textContent);

      var dlPanel = mono.create('div', {
        class: audio.className,
        style: {
          position: 'absolute',
          top: 0
        },
        append: [
          this.getDlLink(url, duration, fullTitle)
        ]
      });

      container.insertBefore(dlPanel, container.firstChild);
    },
    onMouseOver: function(e) {
      var node = e.target;
      if (node.nodeType !== 1) {
        return;
      }
      var rowType = 0;
      var row = null;

      if (node.classList.contains('jp__track')) {
        row = node;
      } else
      if (node.classList.contains('song')) {
        if (!node.parentNode.classList.contains('b-music-songs')) {
          node = null;
        }
        rowType = 1;
        row = node;
      }

      if (row === null) {
        return;
      }

      if (row.getElementsByClassName(audio.className).length !== 0) {
        return;
      }

      audio.getUrl(row, rowType, function(url) {
        if (rowType === 1) {
          audio.addDownloadPanelNew(row, url);
        } else {
          audio.addDownloadPanel(row, url);
        }
      });
    },
    init: function() {
      if (audio.style === undefined) {
        document.body.appendChild(audio.style = mono.create('style', {
          text: '' +
          '.' + audio.className + '{' +
          'display: none;' +
          'left: 22px;' +
          'background-image: url(' + SaveFrom_Utils.svg.getSrc('download', '#168DE2') + ');' +
          'background-repeat: no-repeat;' +
          'background-position: center;' +
          'background-size: 16px;' +
          '}' +
          '.jp__track:hover .' + audio.className + '{' +
          'display: block;' +
          'opacity: 0.5;' +
          '}' +
          '.jp__track.jp__track-plays .' + audio.className + '{' +
          'left: -18px;' +
          '}' +
          '.' + audio.className + ':hover {' +
          'opacity: 1 !important;' +
          '}' +
          '.' + audio.className + '.type-2' + '{' +
          'margin-right: 5px;' +
          'margin-left: 5px;' +
          '}' +
          '.song:hover .' + audio.className + '.type-2' + '{' +
          'display: block;' +
          'opacity: 0.5;' +
          '}' +
          ''
        }));
      }
    },
    rmBtn: function() {
      if (audio.style) {
        audio.style.parentNode.removeChild(audio.style);
        audio.style = undefined;
      }
      var btnList = document.querySelectorAll('.'+audio.className);
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
    },
    disable: function() {
      mono.off(document, 'mouseenter', audio.onMouseOver, true);
    },
    showLinks: function() {
      mono.off(document, 'mouseenter', audio.onMouseOver, true);
      mono.on(document, 'mouseenter', audio.onMouseOver, true);
    }
  };

  var video = {
    btnIndex: 0,
    domCache: {},
    className: 'sf-video-btn',
    contextMenu: undefined,

    prepareLinks: function(links) {
      var menuLinks = [];
      for (var i = 0, link; link = links[i]; i++) {
        var url = link.url;
        var format = 'FLV';
        if (url.indexOf('.mp4') !== -1) {
          format = 'MP4';
        }
        if (url.indexOf('.mov') !== -1) {
          format = 'MOV';
        }
        if (url.indexOf('.mpg') !== -1) {
          format = 'MPG';
        }
        if (!link.quality) {
          link.quality = '-?-';
        }
        var quality = link.quality.toUpperCase();

        var qList = ['1080P', '720P', '480P', '360P', '272P'];
        var tList = ['1080', '720', '480', '360', '272'];

        var qPos = qList.indexOf(quality);
        if (qPos !== -1) {
          quality = tList[qPos];
        }

        var ext = format.toLowerCase();
        var popupLink = { href: url, title: link.title, ext: ext, format: format, quality: quality, forceDownload: true, noSize: true };
        menuLinks.push(popupLink);
      }
      if (menuLinks.length === 0) {
        return;
      }
      return menuLinks;
    },

    showLinkList: function(links, button) {
      if (!links) {
        links = language.noLinksFound;
      }
      if (video.contextMenu) {
        video.contextMenu.hide();
      }
      video.contextMenu = SaveFrom_Utils.popupMenu.quickInsert(button, links, 'video-links-popup', {
        parent: mono.getParentByClass(button, 'b-video__main')
      });
    },

    appendBtn: function(container, btnIndex) {
      var child = undefined;
      var style = {};
      if (container.childNodes.length > 1) {
        child = container.childNodes[1];
      } else {
        child = container.lastChild;
        style.marginRight = '5px';
      }
      container.insertBefore(mono.create('span', {
        class: container.lastChild.getAttribute('class')+' '+video.className,
        append: [
          mono.create('a', {
            data: {
              index: btnIndex
            },
            text: language.download,
            href: '#',
            on: ['click', function(e) {
              e.preventDefault();
              video.readDomCache(this.dataset.index, this);

              if ([1].indexOf(preference.cohortIndex) !== -1) {
                mono.sendMessage({action: 'trackCohort', category: 'my.mail.ru', event: 'click', label: 'video'});
              }
            }],
            style: style
          })
        ]
      }), child);
      child = null;
    },

    readDomCache: function(index, button) {
      video.showLinkList(language.download, button);

      var cacheItem = video.domCache[parseInt(index)];
      if (cacheItem.links) {
        video.showLinkList(video.prepareLinks(cacheItem.links), button);
        return;
      }
      if (cacheItem.metadataUrl) {
        var metadataUrl = cacheItem.metadataUrl;
        var onResponse = function(data) {
          if (!data || typeof data === 'string') {
            return video.showLinkList(undefined, button);
          }
          video.readMeta(data, function(links) {
            if (links === undefined) {
              return video.showLinkList(undefined, button);
            }
            cacheItem.links = links;
            video.showLinkList(video.prepareLinks(links), button);
          });
        };

        if (mono.isOpera) {
          mono.ajax({
            url: metadataUrl,
            withCredentials: true,
            success: function(data) {
              try {
                onResponse(JSON.parse(data));
              } catch(e) {
                onResponse();
              }
            },
            error: function() {
              onResponse();
            }
          });
          return;
        }
        mono.sendMessage({action: 'getOkMetadata', url: metadataUrl}, onResponse);
        return;
      }
      video.showLinkList(undefined, button);
    },

    readMeta: function(metadata, cb) {
      var links = [], title;
      if (metadata.provider === 'UPLOADED') {
        title = metadata.movie?metadata.movie.title:undefined;
        if (!metadata.videos) {
          return cb();
        }
        metadata.videos.forEach(function(item) {
          links.push({
            quality: item.name,
            url: item.url,
            title: title
          });
        });
      }
      if (metadata.provider === 'ugc') {
        title = metadata.meta?metadata.meta.title:undefined;
        if (!metadata.videos) {
          return cb();
        }
        metadata.videos.forEach(function(item) {
          links.push({
            quality: item.key,
            url: item.url,
            title: title
          });
        });
      }
      if (metadata.provider === 'pladform') {
        title = metadata.meta?metadata.meta.title:undefined;
        mono.sendMessage({action: 'getPladformVideo', playerId: metadata.meta.playerId, videoId: metadata.meta.videoId}, function(links) {
          if (!links) {
            return cb();
          }
          links.forEach(function(item) {
            if (item.title === undefined) {
              item.title = title
            }
          });
          cb(links);
        });
        return;
      }
      if (links.length === 0) {
        return cb();
      }
      return cb(links);
    },

    waitPopup: function() {
      setTimeout(function() {
        video.waitPopup.timeCycle++;
        video.catchPopup(1);
        if (video.catchPopup.found === 1) {
          return;
        }
        if (video.waitPopup.timeCycle > 5) {
          video.waitPopup.timeCycle = 0;
          return;
        }
        video.waitPopup();
      }, 1000);
    },

    getVideoId: function(container) {
      var obj = {};
      var videoId = location.pathname.match('/([^\/]+)/([^\/]+)/video/(.+).html');
      if (videoId !== null && videoId.length > 3) {
        obj.metadataUrl = 'http://api.video.mail.ru/videos/' + videoId[1] + '/' + videoId[2] + '/' + videoId[3] + '.json';
        return obj;
      }
      var videoObj = container.querySelector('object[name="b-video-player"]');
      if (videoObj !== null) {
        var flashvars = videoObj.querySelector('param[name="flashvars"]');
        if (flashvars !== null) {
          var flashvarsValue = flashvars.value;
          var url = mono.parseUrlParams(flashvarsValue, {
            argsOnly: 1,
            forceSep: '&'
          });
          if (url.metadataUrl) {
            obj.metadataUrl = decodeURIComponent(url.metadataUrl);
            return obj;
          }
        }
      }
      return videoId;
    },

    catchPopup: function(waiting) {
      var container = document.querySelector('div.b-video__left');
      if (container === null) {
        if (!waiting) {
          video.waitPopup.timeCycle = 0;
          video.waitPopup();
        }
        return;
      }

      var videoInfo = video.getVideoId(container);
      if (videoInfo === undefined) {
        return;
      }

      var panel = container.querySelector('div.b-video__info-time');
      if (panel === null) {
        if (!waiting) {
          video.waitPopup.timeCycle = 0;
          video.waitPopup();
        }
        return;
      }

      if (panel.dataset.sfHasBtn) {
        if (!waiting) {
          video.waitPopup.timeCycle = 0;
          video.waitPopup();
        }
        return;
      }

      var exBtn = panel.querySelector('.'+video.className);
      if (exBtn !== null) {
        return;
      }

      panel.dataset.sfHasBtn = 1;

      video.catchPopup.found = 1;

      if (videoInfo.metadataUrl) {
        videoInfo.metadataUrl = decodeURIComponent(videoInfo.metadataUrl);
        video.domCache[video.btnIndex] = {
          metadataUrl: videoInfo.metadataUrl
        };
      }

      video.appendBtn(panel, video.btnIndex);

      video.btnIndex++;
    },
    rmBtn: function() {
      if (video.contextMenu) {
        video.contextMenu.hide();
      }

      var btnList = document.querySelectorAll('.'+video.className);
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
      var dataAttr = mono.dataAttr2Selector('sfHasBtn');
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
    }
  };

  var mailru = {
    run: function() {
      moduleState = 1;
      SaveFrom_Utils.bridge.init();
      audio.init();
      audio.showLinks();
      mono.onUrlChange(function(url, oldUrl) {
        video.catchPopup();
      }, 1);
    },
    changeState: function(state) {
      moduleState = state;
      mono.clearUrlChange();
      audio.disable();
      audio.rmBtn();
      video.rmBtn();

      if (state) {
        mailru.run();
      }
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('savefrom', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://savefrom.net/*',
      'http://*.savefrom.net/*'
    ])) {
      return;
    }
  }

  var allowFrame = !mono.isGM ? false : mono.isIframe() && location.href.indexOf('/tools/helper-check.html') !== -1;

  if(!allowFrame && location.href.search(/savefrom\.net\/(index\d?\.php|user\.php|update-helper\.php|userjs-setup\.php|\d+-[^\/]+\/|articles\/.+)?(\?|#|$)/i) == -1) {
    return;
  }

  if (!allowFrame && mono.isIframe()) {
    return;
  }

  var language = {};
  var preference = {};
  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function (messaage) {});

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      savefrom.run();
    });
  };

  var getRandomInt = function() {
    var now = Date.now();
    var rnd = now;
    while (now === rnd) {
      rnd = Date.now();
    }
    return rnd;
  };

  var savefrom = {
    name: moduleName,
    scriptId: 'savefrom__ext_script',
    dataAttr: 'data-extension-disabled',


    run: function()
    {
      savefrom.setExtParams();

      if(location.href.search(/\/(update-helper|userjs-setup)\.php/i) > -1)
      {
        var btn = document.getElementById('js-not-remind');
        if(btn)
        {
          btn.addEventListener('click', function(e){
            if(e.button === 0)
            {
              mono.sendMessage({action: 'hideUserjsMigrationInfo'});
            }
          });
        }
        return;
      }

      var form = document.getElementById('sf_form');
      if(!form)
        return;

      form.addEventListener('submit', function(event){
        var url = form.sf_url.value;
        if(!url)
          return;

        if(form.getAttribute(savefrom.dataAttr) == '1')
          return;

        var re = {
          getVKLinks: [
            /^https?:\/\/(?:[a-z]+\.)?(?:vk\.com|vkontakte\.ru)\/(video-?\d+_-?\d+)/i,
            /^https?:\/\/(?:[a-z]+\.)?(?:vk\.com|vkontakte\.ru)\/video_ext.php\?(.*oid=-?\d+.*)$/i,
            /^https?:\/\/(?:[a-z]+\.)?(?:vk\.com|vkontakte\.ru)\/[\w\-]+\?.*z=(video-?\d+_-?\d+)/i
          ],

          getYoutubeLinks: [
            /^https?:\/\/(?:[a-z]+\.)?youtube\.com\/(?:#!?\/)?watch\?.*v=([\w\-]+)/i,
            /^https?:\/\/(?:[a-z0-9]+\.)?youtube\.com\/(?:embed|v)\/([\w\-]+)/i,
            /^https?:\/\/(?:[a-z]+\.)?youtu\.be\/([\w\-]+)/i
          ],

          getVimeoLinks: [
            /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/(?:\w+\#)?(\d+)/i,
            /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
            /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/channels\/(?:[^\/]+)\/(\d+)$/i
          ],

          getDailymotionLinks: [
            /^http:\/\/dai\.ly\/([a-z0-9]+)_?/i,
            /^https?:\/\/(?:[\w]+\.)?dailymotion\.com(?:\/embed|\/swf)?\/video\/([a-z0-9]+)_?/i
          ],

          getFacebookLinks: [
            /^https?:\/\/(?:[\w]+\.)?facebook\.com(?:\/video)?\/video.php.*[?&]{1}v=([0-9]+).*/i,
            /^https?:\/\/(?:[\w]+\.)?facebook\.com\/.+\/videos(?:\/\w[^\/]+)?\/(\d+)/i
          ],

          getMailruLinks: [
            /^https?:\/\/my\.mail\.ru\/([^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\.html).*/i,
            /^https?:\/\/videoapi\.my\.mail\.ru\/videos\/(embed\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\.html).*/i
          ]
        };

        for(var i in re)
        {
          for(var j = 0; j < re[i].length; j++)
          {
            var vid = url.match(re[i][j]);
            if(vid && vid.length > 1)
            {
              vid = vid[1];
              var playlist = SaveFrom_Utils.getMatchFirst(url, /list=([\w\-]+)/i);
              event.preventDefault();
              event.stopPropagation();

              var request = {
                extVideoId: vid,
                action: i,
                checkSubtitles: true,
                checkLinks: true
              };

              mono.sendMessage(request, function(r){
                savefrom.setLinks(r.action, r.extVideoId, r.links, r.title, null,
                  r.subtitles, playlist, r.duration, r.thumb, r.checkLinks);
              });

              return false;
            }
          }
        }
      }, false);


      document.body.addEventListener('click', function(event){
        var node = event.target;

        if (node.tagName === 'I' && node.classList.contains('file-info-btn')) {
          savefrom.onInfoBtnClick.call(node, event);
          return;
        }

        if(node.tagName != 'A')
        {
          if(node.parentNode.tagName == 'A')
            node = node.parentNode;
          else
            return;
        }

        if ((mono.isChrome || mono.isFF) && node.classList.contains('link-download') && !node.classList.contains('disabled') && node.getAttribute('download')) {
          if (node.classList.contains('ga_track_events') && node.getAttribute('data-ga-event')) {
            mono.trigger(node, 'sendstats', {bubbles: true, cancelable: false});
          }
          return SaveFrom_Utils.downloadOnClick(event, null);
        }

        var vid = node.getAttribute('data-video-id');
        if(!vid) {
          return;
        }

        if(node.getAttribute(savefrom.dataAttr) == '1')
          return;

        var action = {vk: 'getVKLinks', yt: 'getYoutubeLinks'};

        vid = vid.split(':', 2);
        if(vid.length != 2 || !action[vid[0]])
          return;

        event.preventDefault();
        event.stopPropagation();

        node.style.display = 'none';

        if(!node.id)
        {
          node.id = vid[0] + '_' + vid[1] + '_' + (Math.random() * 1000) +
            '_' + (new Date()).getTime();
        }

        var request = {
          extVideoId: vid[1],
          action: action[vid[0]],
          checkSubtitles: true,
          checkLinks: true
        };

        mono.sendMessage(request, function(r){
          savefrom.setLinks(r.action, r.extVideoId, r.links, r.title, node,
            r.subtitles, null, r.duration, r.thumb, r.checkLinks);
        });

        return false;
      }, true);
    },

    onInfoBtnClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (this.classList.contains('sf-clicked')) {
        return;
      }
      this.classList.add('sf-clicked');

      var className = 'sf-btn'+getRandomInt();
      this.classList.add(className);

      var rmOldScript = function() {
        var exScript = document.getElementsByClassName('sf-script')[0];
        if (exScript !== undefined) {
          exScript.parentNode.removeChild(exScript);
        }
      };

      rmOldScript();
      document.body.appendChild(mono.create('script', {
        class: 'sf-script',
        text: '('+ function() {
          try{
            var btnClassName = '{btnClassName}';
            var btn = document.getElementsByClassName(btnClassName);
            var $btn = $(btn);

            $btn.unbind('click').removeAttr('onclick').addClass('active');

            if(btn.onclick) {
              btn.onclick = null;
            }

            var parent = $btn.closest('.result-box').find('.meta')[0];

            if (!parent) {
              return;
            }

            var boxId = 'file_info' + btnClassName;

            var box = sf.append(parent, 'div', {'id': boxId, 'class': 'media-info'});

            sf.append(box, 'span', {id: boxId + '_busy'});

            sf.busy(boxId + '_busy', true);
          }catch(err){}
        }.toString().replace('{btnClassName}', className) +')()'
      }));

      var url = this.nextElementSibling.href;
      var title = this.nextElementSibling.textContent;
      mono.sendMessage({action: 'getFileSize', url: url}, function(response) {
        var size = response.fileSize;
        var data = JSON.stringify({
          size: {
            name: {
              trans: language.size
            },
            value: SaveFrom_Utils.sizeHuman(size)
          }
        });
        rmOldScript();
        document.body.appendChild(mono.create('script', {
          class: 'sf-script',
          text: '('+ function() {
            try{
              var btnClassName = '{btnClassName}';
              var busy = document.getElementById('file_info' + btnClassName + '_busy');

              $(busy).slideUp();

              var json = undefined;
              try {
                json = $.parseJSON('{data}');
              } catch(err){
                json = '<!--error-->';
              }

              if(!json || typeof(json) !== 'object') {
                if(json.indexOf('<!--error-->') > -1) {
                  json = {err: json};
                } else {
                  json = {information: {value: json}};
                }
              }

              var btn = document.getElementsByClassName(btnClassName);

              sf.fileInfo.show(json, '{title}', btn, busy.parentNode);
            }catch(err){}
          }.toString().replace('{btnClassName}', className).replace('{title}', title).replace('{data}', data) +')()'
        }));
      });
    },

    setExtParams: function()
    {
      var script = mono.create('script', {
        id: 'savefrom__ext_params',
        type: 'text/javascript'
      });

      var params = {
        id: preference.sfHelperName,
        version: preference.version,
        enable: 1
      };

      script.textContent = '(' + function(json) {
        try{
          if(window.setBrowserExtension && typeof setBrowserExtension == "function"){
            setBrowserExtension(json);
          }
        } catch(err) {}
      }.toString() + ')('+JSON.stringify(params)+')';

      document.body.appendChild(script);
    },


    setLinks: function(action, vid, links, title, btn, subtitles, playlist,
                       duration, thumb, valid)
    {
      if(valid === false)
      {
        savefrom.handleError(btn);
        return;
      }

      switch(action)
      {
        case 'getYoutubeLinks':
          savefrom.setYoutubeLinks(vid, links, title, btn, subtitles,
            playlist, duration, thumb);
          break;

        case 'getVKLinks':
          savefrom.setVKLinks(vid, links, title, btn, duration, thumb);
          break;

        case 'getVimeoLinks':
          savefrom.setVimeoLinks(vid, links, title, btn, duration, thumb);
          break;

        case 'getDailymotionLinks':
          savefrom.setDailymotionLinks(vid, links, title, btn, duration, thumb);
          break;

        case 'getFacebookLinks':
          savefrom.setFacebookLinks(vid, links, title, btn, duration, thumb);
          break;

        case 'getMailruLinks':
          savefrom.setMailruLinks(vid, links, title, btn, duration, thumb);
          break;
      }
    },


    handleError: function(btn)
    {
      if(btn)
      {
        if(btn)
        {
          btn.style.display = '';
          btn.setAttribute(savefrom.dataAttr, '1');
          btn.click();
        }
        return;
      }

      var form = document.getElementById('sf_form');
      if(!form)
        return;

      form.setAttribute(savefrom.dataAttr, '1');
      form.submit();
      form.removeAttribute(savefrom.dataAttr);
    },

    showVideoResult: function(result, btn)
    {
      if(!result || !result.url || !result.url.length)
      {
        savefrom.handleError(btn);
        return;
      }

      var script = document.getElementById(savefrom.scriptId);
      if(script) {
        script.parentNode.removeChild(script);
      }

      script = mono.create('script', {
        id: savefrom.scriptId,
        type: 'text/javascript'
      });

      var fn;
      if(btn) {
        var btnId = (String.quote) ? String.quote(btn.id) : '"'+btn.id+'"';
        fn = '(' + function(btnId, json) {
          try {
            var btn = document.getElementById(btnId);
            sf.result.replaceAjaxResult(json, true, true, btn);
          } catch(err) {}
        }.toString() + ')('+btnId+','+JSON.stringify(result)+')';
      } else {
        fn = '(' + function(json) {
          try {
            sf.finishRequest(true);
            sf.videoResult.show(json);
          } catch(err) {}
        }.toString() + ')('+JSON.stringify(result)+')';
      }
      script.textContent = fn;

      document.body.appendChild(script);
    },


    setVKLinks: function(vid, links, title, btn, duration, thumb)
    {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: links,
        hosting: 'vk.com (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: "http://vk.com/" + vid,
          duration: SaveFrom_Utils.secondsToDuration(duration)
        }
      };

      if(thumb)
        result.thumb = thumb;

      for(var i = 0; i < result.url.length; i++)
      {
        result.url[i].info_url = '#';

        if(!result.url[i].ext && result.url[i].type)
          result.url[i].ext = result.url[i].type;

        if(!result.sd && !result.url[i].subname)
          result.sd = {url: result.url[i].url};
        else if(!result.hd && result.url[i].subname && parseInt(result.url[i].subname) >= 720)
          result.hd = {url: result.url[i].url};
      }

      savefrom.showVideoResult(result, btn);
    },


    setYoutubeLinks: function(vid, links, title, btn, subtitles, playlist,
                              duration, thumb)
    {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: [],
        hosting: '101 (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: (vid ? 'http://youtube.com/watch?v=' + vid : ''),
          duration: SaveFrom_Utils.secondsToDuration(duration)
        },
        thumb: (vid ? 'http://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' : '')
      };

      var sig = false;


      SaveFrom_Utils.video.yt.init();
      SaveFrom_Utils.video.yt.filterLinks(links);

      var meta = links.meta || {};

      for(var formatName in SaveFrom_Utils.video.yt.format)
      {
        var f = SaveFrom_Utils.video.yt.format[formatName];
        for(var iTag in f)
        {
          var metaTag = meta[iTag] || {};
          if(links[iTag])
          {
            if(!sig && links[iTag].search(/(\?|&)sig(nature)?=/i) > -1) {
              sig = true;
            }
            
            var quality = f[iTag].quality;

            if (metaTag.quality) {
              quality = metaTag.quality;
            }

            var l = {
              url: links[iTag],
              name: formatName,
              subname: quality,
              info_url: '#',
              type: formatName,
              quality: quality,
              attr: {}
            };


            if(f[iTag].sFps) {
              l.subname += ' ' + (metaTag.fps || 60);
            }

            if(f[iTag]['3d'])
            {
              l.name = '3D ' + l.name;
              l.group = '3d';
              l['3d'] = true;
            }
            else if(f[iTag]['noAudio'])
            {
              l.group = 'MP4 ';
              l.attr['class'] = 'no-audio';
              // l.ext = 'mp4';
            }
            else if(formatName == 'Audio AAC')
            {
              l.type = 'AAC';
              l.ext = 'aac';
              l.attr.style = 'white-space: nowrap;';
            }
            else if(formatName == 'Audio Vorbis')
            {
              l.type = 'Vorbis';
              l.ext = 'webm';
              l.attr.style = 'white-space: nowrap;';
            }
            else if(formatName == 'Audio Opus')
            {
              l.type = 'Opus';
              l.ext = 'opus';
              l.attr.style = 'white-space: nowrap;';
            }
            else
            {
              if(formatName.toLowerCase() == 'flv' && !result.sd)
              {
                result.sd = {url: links[iTag]};
              }

              if(parseInt(quality) >= 720 && result.sd && !result.hd)
              {
                result.hd = {url: links[iTag]};
              }
            }

            if (l.ext === undefined && l.type) {
              l.ext = l.type.toLowerCase();
            }

            if (f[iTag].noVideo === undefined && f[iTag].noAudio === undefined) {
              l.no_download = true;
            }

            result.url.push(l);
            delete links[iTag];
          }
        }
      }

      if(!sig)
      {
        savefrom.handleError(btn);
        return;
      }

      if(subtitles && subtitles.length > 0)
      {
        var subsId = vid.replace(/[^\w]/, '_');
        var btnId = 'yt_subs_btn_' + subsId;
        subsId = 'yt_subs_' + subsId;

        var subtToken = 'extension';
        var subsTitle = result.meta.title ?
          btoa(SaveFrom_Utils.utf8Encode(result.meta.title)) : '';

        vid = (String.quote) ? String.quote(vid) : '"'+vid+'"';
        subsId = (String.quote) ? String.quote(subsId) : '"'+subsId+'"';
        var _btnId = (String.quote) ? String.quote('#'+btnId) : '"'+'#'+btnId+'"';
        subtToken = (String.quote) ? String.quote(subtToken) : '"'+subtToken+'"';
        subsTitle = (String.quote) ? String.quote(subsTitle) : '"'+subsTitle+'"';

        result.action = [];
        result.action.push({
          name: language.subtitles,
          attr: {
            id: btnId,
            href: '#'
          },

          bind: {
            click: {
              fn: "sf.youtubeSubtitles(" + vid + "," + subsId +
                "," + _btnId + "," + subtToken + "," + subsTitle + ");"
            }
          }
        });
      }

      if(playlist && false)
      {
        playlist = 'http://www.youtube.com/playlist?list=' + playlist;
        playlist = (String.quote) ? String.quote(playlist) : '"'+playlist+'"';
        if(!result.action)
          result.action = [];
        result.action.push({
          name: language.playlist,
          attr: {
            href: '#',
            class: 'tooltip',
            title: language.downloadWholePlaylist
          },

          bind: {
            click: {
              fn: "sf.processLink(" + playlist + ");"
            }
          }
        });
      }

      if (preference.showUmmyItem) {
        if(!result.action) {
          result.action = [];
        }
        var params = mono.param({
          vid: 112,
          video: 'yt-' + vid,
          utm_source: 'savefrom',
          utm_medium: 'vidacha-helper',
          utm_campaign: 'ummy',
          utm_content: 'ummy_integration'
        });
        var tooltip = mono.create('div', {
          append: mono.parseTemplate(language.ummyMenuInfo.replace('{url}', 'http://videodownloader.ummy.net/?'+params).replace("src:'#'", "src:'/img/ummy_icon_16.png'"))
        });
        mono.create(tooltip.querySelector('a.arrow'), {
          class: ['ga_track_events'],
          data: {
            gaEvent: 'send;event;vidacha-helper;youtube;ummy-tooltip-click'
          }
        });
        result.action.push({
          name: language.ummySfTitle,
          attr: {
            href: 'ummy:www.youtube.com/watch?v=' + vid,
            class: 'ummy-link tooltip ga_track_events',
            title: tooltip.innerHTML,
            'data-ga-event': 'send;event;vidacha-helper;youtube;ummy-helper-button-click',
            'data-tooltip-ga-event': 'vidacha-helper;youtube;ummy-helper-tooltip-show'
          }
        });
        result.fn = result.fn || [];
        result.fn.push("if(window.ga){ga('send','event','vidacha-helper','youtube','ummy-helper-button-show');}");
      }

      savefrom.showVideoResult(result, btn);
    },

    setVimeoLinks: function(vid, links, title, btn, duration, thumb)
    {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: links,
        hosting: 'vimeo.com (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: "http://vimeo.com/" + vid,
          duration: SaveFrom_Utils.secondsToDuration(duration)
        }
      };

      if(thumb)
        result.thumb = thumb;

      for(var i = 0; i < result.url.length; i++)
      {
        result.url[i].info_url = '#';

        if(!result.url[i].ext && result.url[i].type)
          result.url[i].ext = result.url[i].type;

        if(!result.sd && result.url[i].name == 'SD')
          result.sd = {url: result.url[i].url};
        else if(!result.hd && result.url[i].name == 'HD')
          result.hd = {url: result.url[i].url};
      }

      savefrom.showVideoResult(result, btn);
    },

    setDailymotionLinks: function(vid, links, title, btn, duration, thumb) {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: links,
        hosting: 'dailymotion.com (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: "http://dai.ly/" + vid,
          duration: SaveFrom_Utils.secondsToDuration(duration)
        }
      };

      if(thumb)
        result.thumb = thumb;

      var hd_size = 0, sd_size = 0;
      for (var i = 0, item; item = links[i]; i++) {
        item.info_url = '#';

        if (item.height >= 720) {
          if (hd_size < item.height) {
            result.hd = {url: item.url};
            hd_size = item.height;
          }
        } else
        if (sd_size < item.height) {
          result.sd = {url: item.url};
          sd_size = item.height;
        }
        delete item.height;
      }
      savefrom.showVideoResult(result, btn);
    },

    setFacebookLinks: function(vid, links, title, btn, duration, thumb) {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: links,
        hosting: 'facebook.com (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: "https://facebook.com/video.php?v=" + vid,
          duration: SaveFrom_Utils.secondsToDuration(duration)
        }
      };

      if(thumb) {
        result.thumb = thumb;
      }

      for (var i = 0, item; item = links[i]; i++) {
        item.info_url = '#';

        if (item.name === "SD") {
          result.sd = {url: item.url};
        } else
        if (item.name === "HD") {
          result.hd = {url: item.url};
        }

        item.subname = item.name;
        item.name = item.ext;
      }
      savefrom.showVideoResult(result, btn);
    },

    setMailruLinks: function(vid, links, title, btn, duration, thumb) {
      if(!vid || !links)
      {
        savefrom.handleError(btn);
        return;
      }

      var result = {
        id: vid,
        url: links,
        hosting: 'mail.ru (h)',
        meta: {
          title: (title ? mono.fileName.modify(title) : ''),
          source: "http://my.mail.ru/" + vid,
          duration: SaveFrom_Utils.secondsToDuration(duration)
        }
      };

      if(thumb)
        result.thumb = thumb;

      var maxSd = 0;
      for(var i = 0, item; item = result.url[i]; i++)
      {
        item.info_url = '#';
        if (!isNaN(parseInt(item.subname))) {
          if (maxSd < item.subname && item.subname < 720) {
            result.sd = {url: item.url};
            maxSd = item.subname;
          }
          if (!result.hd && item.subname >= '720') {
            result.hd = {url: item.url};
          }
        } else {
          if (item.subname.toLowerCase() === 'sd') {
            result.sd = {url: item.url};
          } else if (item.subname.toLowerCase() === 'hd') {
            result.hd = {url: item.url};
          }
        }
      }

      savefrom.showVideoResult(result, btn);
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('soundcloud', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://soundcloud.com/*',
      'http://*.soundcloud.com/*',
      'https://soundcloud.com/*',
      'https://*.soundcloud.com/*'
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return sc.changeState(message.state);
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleSoundcloud) {
        return;
      }
      sc.run();
    });
  };

  if (mono.isIframe()) {
    return;
  }

  var sc = {
    client_id: 'b45b1aa10f1ac2941910a7f0d10f8e28',

    lastRow: null,
    timer: 0,
    btnClass: 'savefrom-helper--btn',

    tracks: {},
    audioElClassList: ['soundList__item', 'searchList__item', 'trackListWithEdit__item', 'soundBadgeList__item', 'sound'],


    run: function(){
      moduleState = 1;
      mono.off(document, 'mouseenter', sc.onMouseOver, true);
      mono.on(document, 'mouseenter', sc.onMouseOver, true);

      mono.onUrlChange(function(url) {
        sc.handleSingleTrack();
      }, 1);
    },

    changeState: function(state) {
      moduleState = state;
      mono.clearUrlChange();
      mono.off(document, 'mouseenter', sc.onMouseOver, true);
      sc.rmBtn();
      if (state) {
        sc.run();
      }
    },

    rmBtn: function() {
      var dataAttr = mono.dataAttr2Selector('sfSkip');
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (var i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
      var btnList = document.querySelectorAll('.'+sc.btnClass);
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
    },

    checkOverEl: function(row) {
      var _this = sc;
      var hasSkip = row.dataset.sfSkip === '1';
      if (hasSkip || row.querySelectorAll(['.'+_this.btnClass]).length !== 0) {
        if (!hasSkip) {
          row.dataset.sfSkip = '1';
        }
        return;
      }
      row.dataset.sfSkip = '1';
      var repeat = parseInt(row.dataset.sfRepeat) || 0;
      if (repeat > 5) {
        return;
      }
      row.dataset.sfRepeat = ++repeat;
      _this.handleRow.call(_this, row);
    },

    onMouseOver: function(e) {
      var _this = sc;
      var node = e.target;
      if (node.nodeType !== 1) {
        return;
      }

      var row = null;

      for (var i = 0, className; className = _this.audioElClassList[i]; i++) {
        if (node.classList.contains(className)) {
          row = node;
          break;
        }
      }

      if (row === null) {
        return;
      }

      if (!_this.checkOverElTr) {
        _this.checkOverElTr = mono.throttle(_this.checkOverEl, 750);
      }
      _this.checkOverElTr.call(_this, row);
    },


    handleSingleTrack: function()
    {
      var count = 0;

      var timer = setInterval(function(){
        count++;

        var row = document.querySelector('.listenEngagement, .visualSound .sound__footer');
        if(row || count > 10)
        {
          clearInterval(timer);
          sc.handleRow(row, 1);
        }
      }, 1000);
    },

    onGotTrackInfo: function(parent, row, info) {
      if (!info) {
        row.dataset.sfSkip = '0';
        return;
      }
      sc.appendButton(parent, row, info);
    },

    handleRow: function(row, single) {
      if (!row) {
        return;
      }

      var parent = row.querySelector('.soundActions .sc-button-group');
      if(!parent) {
        // console.log('no parent!', row);
        return;
      }

      if( single ) {
        if (parent.getElementsByClassName(sc.btnClass).length === 0) {
          sc.getTrackInfo(window.location.href, row, sc.onGotTrackInfo.bind(sc, parent, row));
        }
        return;
      }

      var a = row.querySelector('a.sound__coverArt[href], a.soundTitle__title[href], a.trackItemWithEdit__trackTitle[href]');
      if(a !== null) {
        sc.getTrackInfo(a.href, row, sc.onGotTrackInfo.bind(sc, parent, row));
        return;
      }
    },


    getTrackInfo: function(url, row, cb) {
      url = url.replace(/#.*$/i, '');

      if(url.search(/^\/\/(?:[\w-]+\.)?soundcloud\.com(?:\d+)?\//i) > -1) {
        url = window.location.protocol + url;
      } else
      if(url.search(/https?:\/\//i) == -1) {
        if(url.charAt(0) != '/') {
          url = '/' + url;
        }

        url = window.location.protocol + '//' + window.location.host + url;
      }

      if (sc.tracks[url] === null) {
        return;
      }

      if(sc.tracks[url]) {
        cb(sc.tracks[url]);
        return;
      }
      sc.tracks[url] = null;

      var request = {
        action: 'getSoundcloudTrackInfo',
        trackUrl: url,
        client_id: sc.client_id
      };

      mono.sendMessage(request, function(response){
        sc.tracks[url] = sc.setTrackInfo(response);
        cb(sc.tracks[url]);
      });
    },

    setTrackInfo: function(data) {
      var url = data.trackUrl;
      if(!url) {
        return;
      }
      var tInfo = {};

      var info = data.data;
      if(!info) {
        return;
      }

      if(info.kind != 'track' && info.tracks && info.tracks.length == 1) {
        info = info.tracks[0];
      }

      if(info.kind == 'track' && info.stream_url) {
        sc.setSingleTrackParams(tInfo, info);
        tInfo.checkLinks = data.checkLinks;
        return tInfo;
      }

      if (info.tracks) {
        var playlist = [];
        for(var i = 0, len = info.tracks.length; i < len; i++) {
          var t = {};
          sc.setSingleTrackParams(t, info.tracks[i]);
          playlist.push(t);
        }

        if(playlist.length > 0) {
          if(info.title) {
            tInfo.title = info.title;
          }

          tInfo.playlist = playlist;
          tInfo.checkLinks = data.checkLinks;
          return tInfo;
        }
      }
    },


    setSingleTrackParams: function(track, info) {
      var downloadUrl = info.stream_url;
      downloadUrl += (downloadUrl.indexOf('?') == -1) ? '?' : '&';
      downloadUrl += 'client_id=' + sc.client_id;
      track.url = downloadUrl;

      var param = ['id', 'title', 'duration'];
      for(var i = 0; i < param.length; i++)
      {
        if(info[param[i]])
          track[param[i]] = info[param[i]];
      }
    },

    onDlBtnClick: function(e) {
      SaveFrom_Utils.downloadOnClick(e);

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        var isSingle = document.querySelector('.l-listen-engagement');
        var isRecommended = document.querySelector('.sidebarModule .sidebarContent .soundBadgeList');
        var isPlaylistDetail = document.querySelector('.listenDetails .listenDetails__trackList');
        if (isSingle && isSingle.contains(this)) {
          mono.sendMessage({action: 'trackCohort', category: 'soundcloud', event: 'click', label: 'music-single'});
        } else
        if (isRecommended && isRecommended.contains(this)) {
          mono.sendMessage({action: 'trackCohort', category: 'soundcloud', event: 'click', label: 'music-recommend'});
        } else
        if (isPlaylistDetail && isPlaylistDetail.contains(this)) {
          mono.sendMessage({action: 'trackCohort', category: 'soundcloud', event: 'click', label: 'music-playlist-single'});
        } else {
          mono.sendMessage({action: 'trackCohort', category: 'soundcloud', event: 'click', label: 'music-list'});
        }
      }
    },

    appendButton: function(parent, row, info) {
      var track = info;

      var btnClass = ['sc-button-small', 'sc-button-medium', 'sc-button-large'];
      for(var i = 0; i < btnClass.length; i++) {
        if(parent.querySelector('.' + btnClass[i])) {
          btnClass = [btnClass[i]];
        }
      }

      var a = document.createElement('a');
      a.className = sc.btnClass + ' sc-button sc-button-responsive ' + btnClass[0];
      a.style.position = 'relative';

      var icon = document.createElement('img');

      if(track.playlist) {
        a.href = '#';
        a.title = language.playlist;

        var title = track.title ? mono.fileName.modify(track.title) : 'soundcloud';

        a.addEventListener('click', function (event) {
          event.preventDefault();
          setTimeout(function () {
            SaveFrom_Utils.playlist.popupPlaylist(track.playlist, title, true);
          }, 100);
        }, false);

        if (track.checkLinks === false) {
          icon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAJElEQVQoz2P4//8/A7mYgWqa6+vr/xPCtNE86udRP9PWz6RiANU4hUYGNDpOAAAAAElFTkSuQmCC';
        } else {
          icon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAMUlEQVR42mL8//8/A7mAiYECwILC82Uk7IzN/xmpYjPjqJ9H/UxTP1OkGQAAAP//AwDcahUV6UvyJwAAAABJRU5ErkJggg==';
        }
        icon.alt = language.playlist;
      } else {
        if (track.checkLinks === false) {
          a.href = '#';
          a.title = language.noLinksFound;

          a.addEventListener('click', function(e) {
            e.preventDefault();
            var style = {
              backgroundColor: '#fff',
              border: '1px solid #777',
              padding: '2px 5px 3px'
            };
            SaveFrom_Utils.showTooltip(this,language.noLinksFound, undefined, style);
          });

          icon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAVklEQVQoz2P4//8/A7mYgSqa0UF9ff1/GEaXG0SagYrmI2vAg+djtZkIA+bjdTYeA+YT5WcsBswnNcDmY9NIlGaoAQnYxHEFGMHQxqe5gRDGqpnuGQMALmDKhkjc9oYAAAAASUVORK5CYII=';
          icon.alt = 'noLinksFound'
        } else {
          a.href = track.url;
          a.title = language.download;

          if(track.title) {
            a.setAttribute('download',
              mono.fileName.modify(track.title.trim() + '.mp3'));

            a.addEventListener('click', this.onDlBtnClick, false);
          }

          icon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAPklEQVR42mNgGHTgvw/DfxgexJqBiuYja8CD55NrwHxyXTCfWP/OJ0sjFgPmkxvXCWRFDy6MT3MDITw40j8Ak46HYQ4gDfUAAAAASUVORK5CYII=';
          icon.alt = 'download';
        }
      }

      SaveFrom_Utils.setStyle(icon, {
        width: '15px',
        height: '15px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        margin: '-7px 0 0 -7px'
      });
      a.appendChild(icon);

      parent.appendChild(a);

      icon = null;
      a = null;
      parent = null;
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('sovetnik', function(moduleName) {
  var domain = document && document.domain;
  if (!domain) {
    return;
  }

  if (mono.isSafari || mono.isFF || mono.isGM) {
    if (mono.checkUrl(document.URL, [
      "ftp://*",
      "file://*",
      "http://google.*/*",
      "http://*.google.*/*",
      "https://google.*/*",
      "https://*.google.*/*",
      "http://acidtests.org/*",
      "http://*.acidtests.org/*",
      "http://savefrom.net/*",
      "http://*.savefrom.net/*",
      "http://youtube.com/*",
      "http://*.youtube.com/*",
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "http://vimeo.com/*",
      "http://*.vimeo.com/*",
      "https://vimeo.com/*",
      "https://*.vimeo.com/*",
      "http://dailymotion.*/*",
      "http://*.dailymotion.*/*",
      "https://dailymotion.*/*",
      "https://*.dailymotion.*/*",
      "http://vk.com/*",
      "http://*.vk.com/*",
      "http://vkontakte.ru/*",
      "http://*.vkontakte.ru/*",
      "https://vk.com/*",
      "https://*.vk.com/*",
      "https://vkontakte.ru/*",
      "https://*.vkontakte.ru/*",
      "http://odnoklassniki.ru/*",
      "http://*.odnoklassniki.ru/*",
      "http://ok.ru/*",
      "http://*.ok.ru/*",
      "http://soundcloud.com/*",
      "http://*.soundcloud.com/*",
      "https://soundcloud.com/*",
      "https://*.soundcloud.com/*",
      "http://facebook.com/*",
      "http://*.facebook.com/*",
      "https://facebook.com/*",
      "https://*.facebook.com/*",
      "http://instagram.com/*",
      "http://*.instagram.com/*",
      "https://instagram.com/*",
      "https://*.instagram.com/*",
      "https://rutube.ru/*",
      "http://rutube.ru/*",
      "https://*.rutube.ru/*",
      "http://*.rutube.ru/*"
    ])) {
      return;
    }
  }

  var preference = {};
  var init = function () {
    mono.initGlobal(function() {
      preference = mono.global.preference;
      if (!preference.sovetnikEnabled) {
        return;
      }
      runSovetnik();
    });
  };

  function checkProtocol() {
    if (location.protocol === 'https:') {
      return inWhiteList();
    }
    return true;
  }

  function inWhiteList() {
    var list = [
      "adidas.ru",
      "agent.ru",
      "airberlin.com",
      "airfrance.ru",
      "alitalia.com",
      "all4.ru",
      "amazon.de",
      "anywayanyday.com",
      "avia.euroset.ru",
      "avia.travel.ru",
      "avia.tutu.ru",
      "aviacassa.ru",
      "avito.ru",
      "aws.amazon.com",
      "biletix.ru",
      "book.lufthansa.com",
      "booking.utair.ru",
      "bravoavia.ru",
      "britishairways.com",
      "canon.ru",
      "chrono24.com.ru",
      "citilink.ru",
      "domalina.ru",
      "dpreview.com",
      "engadget.com",
      "finnair.com",
      "haroldltd.ru",
      "hilti.ru",
      "iberia.com",
      "intershop.orenair.ru",
      "irmag.ru",
      "kaledos.ru",
      "kayak.ru",
      "klingel.ru",
      "klm.com",
      "kuvalda.ru",
      "lazurit.com",
      "letaem.ru",
      "light-flight.ru",
      "litres.ru",
      "lovemag.ru",
      "lufthansa.com",
      "magazinbt.ru",
      "malina.ru",
      "marketplace.asos.com",
      "mediamarkt.ru",
      "mir220v.ru",
      "momondo.ru",
      "mvideo.ru",
      "my.tiu.ru",
      "nabortu.ru",
      "nama.ru",
      "nespresso.com",
      "new.pososhok.ru",
      "nokia.com",
      "onetwotrip.com",
      "origin.com",
      "otto.de",
      "ozon.ru",
      "ozon.travel",
      "pass.rzd.ru",
      "pixel24.ru",
      "planetarium.ru",
      "planetashop.ru",
      "pososhok.ru",
      "reservation.aeroflot.ru",
      "rimeks.ru",
      "ru.puma.com",
      "s7.ru",
      "samsung.com",
      "sapato.ru",
      "shop.idj.by",
      "shop.kz",
      "shop.megafon.ru",
      "sindbad.ru",
      "skyscanner.ru",
      "softkey.ru",
      "sony.ru",
      "sotmarket.ru",
      "ssl.molotok.ru",
      "store.sony.ru",
      "svyaznoy.travel",
      "tinydeal.com",
      "transaero.ru",
      "transport.marshruty.ru",
      "travel.ulmart.ru",
      "trip.ru",
      "tripadvisor.ru",
      "tvoydom.ru",
      "utinet.ru",
      "vodopad.spb.ru",
      "webdush.ru",
      "xcom-shop.ru"
    ];

    var hostname = location.hostname;
    var dot_pos = hostname.indexOf('.');
    while (dot_pos !== -1) {
      if (list.indexOf(hostname) !== -1) {
        return true;
      }
      hostname = hostname.substr(dot_pos + 1);
      dot_pos = hostname.indexOf('.');
    }

    return false;
  }

  function checkLanguage() {
    var langList = ['be', 'kk', 'ru', 'uk', 'hy', 'ro', 'az', 'ka', 'ky', 'uz', 'lv', 'lt', 'et', 'tg', 'fi', 'tk'];
    var countryList = ['by', 'kz', 'ru', 'ua', 'am', 'md', 'az', 'ge', 'kg', 'uz', 'lv', 'lt', 'ee', 'tj', 'fi', 'tm'];
    var lang = typeof navigator === 'undefined' || !navigator.language ? undefined : String(navigator.language).toLowerCase().substr(0, 2);
    if (langList.indexOf(lang) !== -1) {
      return true;
    }

    if (countryList.indexOf(preference.country) !== -1) {
      return true;
    }

    return false;
  }

  function inBlackList() {
    var list = [
      "vk.com",
      "youtube.com",
      "odnoklassniki.ru",
      "ok.ru",
      "privet.ru",
      "facebook.com",
      "news.sportbox.ru",
      "play.google.com",
      "roem.ru",
      "linkedin.com",
      "ex.ua",
      "instagram.com",
      "rutube.ru",
      "e.mail.ru",
      "fotki.yandex.ru",
      "support.kaspersky.ru",
      "vimeo.com",
      "club.foto.ru",
      "garant.ru",
      "webmaster.yandex.ru",
      "support.kaspersky.ru",
      "fotki.yandex.ru",
      "mk.ru",
      "metrika.yandex.ru",
      "images.yandex.ru",
      "disk.yandex.ru",
      "maps.yandex.ru",
      "help.yandex.ru",
      "www.yaplakal.com",
      "www.facebook.com",
      "my.mail.ru"
    ];

    var hostname = location.hostname;
    var dot_pos = hostname.indexOf('.');
    while (dot_pos !== -1) {
      if (list.indexOf(hostname) !== -1) {
        return true;
      }
      hostname = hostname.substr(dot_pos + 1);
      dot_pos = hostname.indexOf('.');
    }

    return false;
  }

  var settings = {
    affId: 1020,
    clid: 2210496,
    applicationName: 'SaveFrom',
    aviaEnabled: true,
    offerEnabled: true
  };

  var url = undefined;

  var extStorage = {
    get: function(obj, cb) {
      mono.sendMessage({action: 'storage', subaction: 'get', data: obj}, cb);
    },
    set: function(obj, cb) {
      if (preference.sovetnikEnabled === 1) {
        if (obj.sovetnikRemoved === true) {
          mono.sendMessage({action: 'updateOption', key: 'sovetnikEnabled', value: 0});
        } else
        if (obj.sovetnikOfferAccepted === false) {
          mono.sendMessage({action: 'updateOption', key: 'sovetnikEnabled', value: 0});
        }
      }
      mono.sendMessage({action: 'storage', subaction: 'set', data: obj, keys: Object.keys(obj)}, cb);
    },
    remove: function(obj, cb) {
      mono.sendMessage({action: 'storage', subaction: 'remove', data: obj}, cb);
    }
  };

  var injector = {

    /**
     * inject script to the page
     */
    inject: function () {
      if (!mono.isIframe()) {
        var script = document.createElement('script');
        script.async = 1;
        script.src = url;
        script.setAttribute('charset', 'UTF-8');
        if (document.body) {
          document.body.appendChild(script);
        }
      }
    },

    /**
     * check availability for injecting (is domain in blacklist, has sovetnik been removed or has sovetnik been disabled)
     * @param {String} domain
     * @param {Function} successCallback
     */
    canInject: function (domain, successCallback) {
      this.listenScriptMessages();

      extStorage.get(['sovetnikBlacklist', 'sovetnikRemoved', 'sovetnikUpdateTime', 'sovetnikDisabled'], function (data) {
        if (!((data.sovetnikBlacklist && data.sovetnikBlacklist[domain]) || data.sovetnikRemoved || data.sovetnikDisabled)) {
          successCallback();
        }
        data.sovetnikUpdateTime = data.sovetnikUpdateTime || 0;
        if (Date.now() - data.sovetnikUpdateTime > 604800000) { // one week
          extStorage.set({
            sovetnikUpdateTime: Date.now(),
            sovetnikRemoved: false,
            sovetnikBlacklist: {}
          });
        }
      });
    },

    /**
     * add domain to the blacklist
     * @param domain
     */
    addToBlacklist: function (domain) {
      extStorage.get('sovetnikBlacklist', function (data) {
        data.sovetnikBlacklist = data.sovetnikBlacklist || {};
        data.sovetnikBlacklist[domain] = true;
        extStorage.set(data);
      });
    },

    /**
     *
     * @param {Boolean} value
     */
    setSovetnikRemovedState: function (value) {
      if (typeof value === "undefined") {
        extStorage.remove('sovetnikRemoved');
      } else {
        extStorage.set({
          sovetnikRemoved: value
        });
      }
    },

    /**
     *
     * @param {Boolean} value
     */
    setOfferState: function (value) {
      if (typeof value === "undefined") {
        extStorage.remove('sovetnikOfferAccepted');
      } else {
        extStorage.set({
          sovetnikOfferAccepted: value
        });
      }
    },

    /**
     * window.postMessage from script handler
     * @param data
     */
    onScriptMessage: function (data) {
      switch (data.command) {
        case 'blacklist':
        {
          this.addToBlacklist(data.value);
          break;
        }
        case 'removed':
        {
          this.setSovetnikRemovedState(data.value);
          break;
        }
        case 'offerAccepted':
          this.setOfferState(data.value);
          break;
      }
    },

    /**
     * window.postMessage handler
     */
    listenScriptMessages: function () {
      window.addEventListener('message', function (message) {
        if (message && message.data && message.data.type === 'MBR_ENVIRONMENT') {
          this.onScriptMessage(message.data);
        }
      }.bind(this), false);
    }
  };

  var getUrl = function(cb) {
    url = '//dl.metabar.ru/static/js/sovetnik.min.js';
    var args = '?mbr=true&settings=' + encodeURIComponent(JSON.stringify(settings));
    url += args;
    cb();
  };

  var runSovetnik = function() {
    if(!checkProtocol() || !checkLanguage() || inBlackList()) {
      return;
    }

    if (/^www./.test(domain)) {
      domain = domain.slice(4);
    }

    getUrl(function() {
      injector.canInject(domain, injector.inject.bind(injector));
    });
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('dealply', function() {
  var domain = document && document.domain;
  if (!domain) {
    return;
  }

  if (mono.isSafari || mono.isFF || mono.isGM) {
    if (mono.checkUrl(document.URL, [
      "ftp://*",
      "file://*",
      "http://google.*/*",
      "http://*.google.*/*",
      "https://google.*/*",
      "https://*.google.*/*",
      "http://acidtests.org/*",
      "http://*.acidtests.org/*",
      "http://savefrom.net/*",
      "http://*.savefrom.net/*",
      "http://youtube.com/*",
      "http://*.youtube.com/*",
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "http://vimeo.com/*",
      "http://*.vimeo.com/*",
      "https://vimeo.com/*",
      "https://*.vimeo.com/*",
      "http://dailymotion.*/*",
      "http://*.dailymotion.*/*",
      "https://dailymotion.*/*",
      "https://*.dailymotion.*/*",
      "http://vk.com/*",
      "http://*.vk.com/*",
      "http://vkontakte.ru/*",
      "http://*.vkontakte.ru/*",
      "https://vk.com/*",
      "https://*.vk.com/*",
      "https://vkontakte.ru/*",
      "https://*.vkontakte.ru/*",
      "http://odnoklassniki.ru/*",
      "http://*.odnoklassniki.ru/*",
      "http://ok.ru/*",
      "http://*.ok.ru/*",
      "http://soundcloud.com/*",
      "http://*.soundcloud.com/*",
      "https://soundcloud.com/*",
      "https://*.soundcloud.com/*",
      "http://facebook.com/*",
      "http://*.facebook.com/*",
      "https://facebook.com/*",
      "https://*.facebook.com/*",
      "https://instagram.com/*",
      "http://instagram.com/*",
      "https://*.instagram.com/*",
      "http://*.instagram.com/*",
      "https://rutube.ru/*",
      "http://rutube.ru/*",
      "https://*.rutube.ru/*",
      "http://*.rutube.ru/*"
    ])) {
      return;
    }
  }

  var preference = {};
  var init = function () {
    if (mono.isIframe()) {
      return;
    }
    mono.initGlobal(function() {
      preference = mono.global.preference;
      if (!preference.hasDP) {
        return;
      }
      if (!preference.sovetnikEnabled) {
        return;
      }
      runAdvisor();
    });
  };

  function isWhiteList() {
    var list = [];

    var hostname = location.hostname;
    var dot_pos = hostname.indexOf('.');
    while (dot_pos !== -1) {
      if (list.indexOf(hostname) !== -1) {
        return true;
      }
      hostname = hostname.substr(dot_pos + 1);
      dot_pos = hostname.indexOf('.');
    }

    return false;
  }

  function checkProtocol() {
    if (location.protocol === 'https:') {
      return isWhiteList();
    }
    return true;
  }

  function checkLanguage() {
    var langList = [];
    var countryList = [
      'ar', 'au', 'at', 'be',
      'br', 'ca', 'co', 'cz',
      'dk', 'fr', 'de', 'hk',
      'hu', 'in', 'id', 'it',
      'jp', 'ke', 'my', 'mx',
      'nl', 'nz', 'ng', 'no',
      'ph', 'pl', 'pt', 'ro',
      'rs', 'sg', 'sk', 'za',
      'es', 'se', 'th', 'gb',
      'us'
    ];
    var lang = typeof navigator === 'undefined' || !navigator.language ? undefined : String(navigator.language).toLowerCase().substr(0, 2);
    if (langList.indexOf(lang) !== -1) {
      return true;
    }

    if (countryList.indexOf(preference.country) !== -1) {
      return true;
    }

    return false;
  }

  function inBlackList() {
    var list = [
      "vk.com",
      "youtube.com",
      "odnoklassniki.ru",
      "ok.ru",
      "privet.ru",
      "facebook.com",
      "news.sportbox.ru",
      "play.google.com",
      "roem.ru",
      "linkedin.com",
      "ex.ua",
      "instagram.com",
      "rutube.ru",
      "e.mail.ru",
      "fotki.yandex.ru",
      "support.kaspersky.ru",
      "vimeo.com",
      "club.foto.ru",
      "garant.ru",
      "webmaster.yandex.ru",
      "support.kaspersky.ru",
      "fotki.yandex.ru",
      "mk.ru",
      "metrika.yandex.ru",
      "images.yandex.ru",
      "disk.yandex.ru",
      "maps.yandex.ru",
      "help.yandex.ru",
      "www.yaplakal.com",
      "www.facebook.com",
      "my.mail.ru"
    ];

    var hostname = location.hostname;
    var dot_pos = hostname.indexOf('.');
    while (dot_pos !== -1) {
      if (list.indexOf(hostname) !== -1) {
        return true;
      }
      hostname = hostname.substr(dot_pos + 1);
      dot_pos = hostname.indexOf('.');
    }

    return false;
  }

  var getUrl = function() {
    var url;
    var isSSL = location.protocol === 'https:';
    if (isSSL) {
      url = 'https://i_mgicinjs_info.tlscdn.com/mgicin/javascript.js';
    } else {
      url = 'http://i.mgicinjs.info/mgicin/javascript.js';
    }
    return url;
  };

  var getUrl2 = function() {
    var url;
    var isSSL = location.protocol === 'https:';
    if (isSSL) return;
    url = 'http://i.mgicinsrc.org/mgicin/javascript.js';
    return url;
  };

  var injectScript = function() {
    if (!document.body) return;

    var script = document.createElement('script');
    script.async = 1;
    script.src = getUrl();
    script.setAttribute('charset', 'UTF-8');
    document.body.appendChild(script);

    var url2 = getUrl2();
    if (url2) {
      var script2 = document.createElement('script');
      script2.async = 1;
      script2.src = url2;
      script2.setAttribute('charset', 'UTF-8');
      document.body.appendChild(script2);
    }
  };

  var runAdvisor = function() {
    if(!checkProtocol() ||
      !checkLanguage() ||
      inBlackList()) {
      return;
    }

    injectScript();
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('vimeo', function(moduleName) {
  if (mono.isSafari) {
    if ( !mono.checkUrl(document.URL, [
      'http://vimeo.com/*',
      'http://*.vimeo.com/*',
      'https://vimeo.com/*',
      'https://*.vimeo.com/*'
      ]) ) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var moduleState =  0;

  var init = function() {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return vimeo.changeState(message.state);
      }
    });

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleVimeo) {
        return;
      }
      vimeo.run();
    });
  };

  var iframe = mono.isIframe();

  var vimeo = {
    panelId: 'savefrom__vimeo_links',
    btnBox: null,
    clipId: null,
    timer: null,
    btnPrefix: 'sd_ld_bnt_',
    popupIsShow: false,
    dlBtnClassName: 'sf-dl-btn',
    currentMenu: undefined,
    linkCache: {},

    run: function()
    {
      moduleState = 1;
      if (iframe) {
        vimeo.clipId = vimeo.getFrameClipId();
        if (vimeo.clipId) {
          vimeo.appendIframeButtons();
        }
        return;
      }

      mono.onUrlChange(function onUrlChange(url, oldUrl, force) {
        clearInterval(vimeo.checkBtnExist.interval);
        if (document.body.classList.contains('progress')) {
          if (!force) {
            onUrlChange.limit = 10;
          }
          onUrlChange.limit--;
          if (onUrlChange.limit > 0) {
            clearTimeout(onUrlChange.progressTimer);
            onUrlChange.progressTimer = setTimeout(function() {
              onUrlChange(url, url, 1);
            }, 500);
            return;
          }
        }

        var videoContainer = vimeo.getMainVideoData();
        if (videoContainer) {
          vimeo.appendBtn(videoContainer);
          vimeo.checkBtnExist();
        }
        videoContainer = null;

        var browseItems;
        // https://vimeo.com/home
        var browseContent = document.getElementById('browse_content');
        if (!browseContent) {
          // https://vimeo.com/channels/documentaryfilm
          browseContent = document.getElementById('clips');
          if (browseContent && !browseContent.querySelector('#channel_clip_container')) {
            browseContent = null;
          }
        }
        if (browseContent) {
          browseItems = browseContent.querySelectorAll('ol > li');
          if (browseItems.length === 0) {
            clearInterval(onUrlChange.browserTimer);
            onUrlChange.browserLimit = 5;
            onUrlChange.browserTimer = setInterval(function() {
              onUrlChange.browserLimit--;
              browseItems = browseContent.querySelectorAll(['ol > li', '.empty']);
              var find = false;
              if (browseItems.length === 1 && browseItems[0].classList.contains('empty')) {
                find = true;
                browseItems = [];
              }
              if (browseItems.length > 0) {
                vimeo.addBtnInBrowser(browseItems);
                find = true;
              }
              if (find || !onUrlChange.browserLimit) {
                clearInterval(onUrlChange.browserTimer);
              }
            }, 500);
          } else {
            vimeo.addBtnInBrowser(browseItems);
          }
        }

        // https://vimeo.com/home/discover/filter:videos/format:thumbnail
        // https://vimeo.com/96823376
        // https://vimeo.com/categories/animation
        // https://vimeo.com/groups/animation
        // https://vimeo.com/channels/mbmagazine/94367486
        // https://vimeo.com/couchmode/inbox/sort:date/108792063
        vimeo.videoFeed.checkUrl(url);
      }, 1);
    },

    changeState: function(state) {
      if (iframe) return;
      moduleState = state;

      mono.clearUrlChange();
      vimeo.videoFeed.disable();
      vimeo.rmAllBtn();

      if (state) {
        vimeo.run();
      }
    },

    addBtnInBrowser: function(browseContent) {
      for (var n = 0, el; el = browseContent[n]; n++) {
        if (el.id.indexOf('clip') !== 0) {
          continue;
        }
        var videoContainer = vimeo.getBrowserVideoData(el, el.id);
        if (videoContainer === null) {
          return;
        }
        if (videoContainer) {
          vimeo.appendBtn(videoContainer);
        }
      }
    },

    getFrameClipId: function() {
      var iframeClipId = document.location.href.match(/player\.vimeo\.com\/video\/([\w\-]+)/i);
      if(iframeClipId && iframeClipId.length > 1) {
        return iframeClipId[0];
      }
    },

    getBrowserVideoData: function(container, id) {
      var btnParent = container.querySelector('.uploaded_on');
      if (!btnParent) {
        btnParent = container.querySelector('#info .meta .stats');
      }
      if (!btnParent) {
        return null;
      }
      if (id) {
        id = id.match(/([0-9]+)$/);
        if (id) {
          id = id[1];
        }
      }
      if (!id) {
        var firstLink = container.querySelector('a.js-title') || container.querySelector('a');
        if (!firstLink) {
          return;
        }
        var url = firstLink.getAttribute('href');
        if (!url) {
          return;
        }
        id = url.match(/\/([0-9]+)$/);
        if (!id) {
          return;
        }
        id = id[1];
      }
      return {id: id, parent: btnParent, style: 1};
    },

    getMainVideoData: function() {
      var parentContainer = document;
      var btnStyle = undefined;
      var id = undefined;
      var btnParent = undefined;
      var container = undefined;

      container = parentContainer.querySelectorAll('#clip');
      if ( container && container.length === 1
        && (container = container[0]) && (id = vimeo.getVideoId(container)) ) {
        btnStyle = 2;
        // http://vimeo.com/96823376
        btnParent = container.querySelector('#info #tools');
        if (btnParent) {
          return {id: id, parent: btnParent, style: btnStyle};
        }
      }

      container = parentContainer.querySelectorAll('#channel_clip_container');
      if (container && container.length === 2) {
        if (container[0].hasChildNodes(container[1])) {
          container = [container[1]];
        }
      }
      if ( container && container.length === 1
        && (container = container[0]) && (id = vimeo.getVideoId(container)) ) {
        // http://vimeo.com/channels/staffpicks
        btnStyle = 1;
        btnParent = container.querySelector('#info .meta .stats');
        if (btnParent) {
          if (vimeo.getMainVideoData.hasExternalBtn) {
            // https://vimeo.com/channels/mbmagazine/92235056
            var exBtn = vimeo.getMainVideoData.hasExternalBtn.querySelector('.'+vimeo.dlBtnClassName);
            if (exBtn) {
              exBtn.parentNode.removeChild(exBtn);
            }
            vimeo.getMainVideoData.hasExternalBtn = undefined;
          }
          return {id: id, parent: btnParent, style: btnStyle};
        }
        btnStyle = 2;
        btnParent = document.querySelector('div.col_small section.block > div.tools') ||
          document.querySelector('div.col_small section.block > div.intro');
        if (btnParent) {
          vimeo.getMainVideoData.hasExternalBtn = btnParent;
          return {id: id, parent: btnParent, style: btnStyle};
        }
      }
    },

    getVideoId: function(container) {
      var id = null;
      var player = container.querySelector('.player[data-fallback-url]');
      if (player) {
        var fallbackUrl = player.dataset.fallbackUrl || '';
        fallbackUrl = fallbackUrl.match(/video\/([0-9]+)\//);
        if (fallbackUrl) {
          return fallbackUrl[1];
        }
      }
      player = container.querySelector('div.player_wrapper > div.faux_player[data-clip_id]');
      if (player) {
        id = player.dataset.clip_id;
        if (id) {
          return id;
        }
      }
    },

    onBtnClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      var id = this.dataset.sfId;

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        var isBrowseContent = document.getElementById('browse_content');
        if (isBrowseContent && isBrowseContent.contains(this)) {
          mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-list'});
        } else {
          mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-single'});
        }
        isBrowseContent = null;
      }

      if (vimeo.currentMenu !== undefined) {
        vimeo.currentMenu.hide();
        vimeo.currentMenu = undefined;
      }

      var fromCache = vimeo.linkCache[id];
      var links = language.download + ' ...';
      if (fromCache) {
        links = SaveFrom_Utils.popupMenu.prepareLinks.vimeo(fromCache.links, fromCache.title);
      }

      var menu = vimeo.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(this, links, 'sf-popupMenu');

      if (fromCache) {
        return;
      }

      mono.sendMessage({action: 'getVimeoLinks', extVideoId: id}, function(response) {
        if(response.links) {
          vimeo.linkCache[id] = response;
          var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.vimeo(response.links, response.title);
          menu.update(menuLinks);
          return;
        }
        menu.update(language.noLinksFound);
      });
    },

    rmAllBtn: function() {
      clearInterval(vimeo.checkBtnExist.interval);
      var btnList = document.querySelectorAll('.'+vimeo.dlBtnClassName);
      for (var i = 0, item; item = btnList[i]; i++) {
        if (item.classList.contains('sf-style-1')) {
          item = item.parentNode;
        }
        item.parentNode.removeChild(item);
      }
      vimeo.videoFeed.rmBtn();
    },

    appendBtn: function(videoData) {
      var box = videoData.parent;

      var exBtn = box.getElementsByClassName(vimeo.dlBtnClassName);
      if (exBtn.length > 0) {
        if (exBtn[0].dataset.sfId !== videoData.id) {
          exBtn[0].dataset.sfId = videoData.id;
        }
        return;
      }

      var btn;
      if (videoData.style === 1) {
        btn = mono.create('a', {
          text: language.download,
          class: [vimeo.dlBtnClassName, 'sf-style-1'],
          style: {
            display: 'inline'
          },
          data: {
            sfId: videoData.id,
            sfType: videoData.style
          },
          href: '#' + videoData.id,
          on: ['click', vimeo.onBtnClick]
        });
      } else
      if (videoData.style === 2) {
        btn = mono.create('button', {
          text: language.download,
          class: [vimeo.dlBtnClassName, 'btn', 'iconify_down_b'],
          data: {
            sfId: videoData.id,
            sfType: videoData.style
          },
          on: ['click', vimeo.onBtnClick]
        });
      }

      if (videoData.style === 1) {
        btn = mono.create('span', {
          append: [
            btn,
            ' / '
          ]
        });
      }

      if (videoData.style === 1 || videoData.style === 2) {
        var firstChild = box.firstChild;
        if (firstChild) {
          box.insertBefore(btn, firstChild);
        } else {
          box.appendChild(btn);
        }
      }
    },

    checkBtnExist: function() {
      var count = 2;
      clearInterval(vimeo.checkBtnExist.interval);
      vimeo.checkBtnExist.interval = setInterval(function() {
        count--;
        var videoContainer = vimeo.getMainVideoData();
        if (videoContainer) {
          vimeo.appendBtn(videoContainer);
        }
        if (!count) {
          clearInterval(vimeo.checkBtnExist.interval);
        }
      }, 1000);
    },

    showLinks: function(links, title, customFsIconStyle)
    {
      var box = document.getElementById(vimeo.panelId);
      if(!box)
        return;

      while(box.firstChild)
        box.removeChild(box.firstChild);

      if(links && links.length > 0)
      {
        box.appendChild(document.createTextNode(language.download + ': '));

        var aStyle = {margin: '0 0 0 15px'},
          fsIconStyle = {},
          fsTextStyle = {
            position: 'relative',
            top: '-1px'
          };

        if(iframe)
        {
          aStyle = {
            color: '#fff',
            borderBottom: '1px solid #808080',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            margin: '0 0 0 10px'
          };

          fsIconStyle = {color: '#ffffff', opacity: '.5'};
          fsTextStyle = {color: '#d0d0d0'};
        }

        if (customFsIconStyle !== undefined) {
          fsIconStyle = customFsIconStyle;
        }

        var success = false, color = '';
        for(var i = 0; i < links.length; i++)
        {
          var a = document.createElement('a');
          if(links[i].url && links[i].name)
          {
            success = true;

            var ext = links[i].ext;
            if(!ext)
            {
              ext = 'MP4';
              if(links[i].url.search(/\.flv($|\?)/i) != -1)
                ext = 'FLV';
            }

            var name = links[i].name ? links[i].name : ext;

            a.href = links[i].url;
            a.title = language.downloadTitle;
            a.appendChild(document.createTextNode(name));
            SaveFrom_Utils.setStyle(a, aStyle);

            box.appendChild(a);

            SaveFrom_Utils.appendFileSizeIcon(a, fsIconStyle, fsTextStyle);

            if(title && !links[i].noTitle)
            {
              a.setAttribute('download', mono.fileName.modify(
                  title + '.' + ext.toLowerCase()));

              a.addEventListener('click', function(event){
                SaveFrom_Utils.downloadOnClick(event, null, {
                  useFrame: true
                });
              }, false);
            }

            if(!color)
              color = SaveFrom_Utils.getStyle(a, 'color');
          }
        }

        if(success)
        {
          if(!color)
            color = '#2786c2';

          if(preference.moduleShowDownloadInfo === 1)
          {
            box.appendChild(document.createElement('br'));
            SaveFrom_Utils.appendDownloadInfo(box, color);
          }

          return;
        }
      }

      box.appendChild(document.createTextNode(language.noLinksFound));
    },

    appendIframeButtons: function()
    {
      var p = document.getElementsByTagName('div')[0],
        b = document.createElement('div'),
        a = document.createElement('a'),
        panel = document.createElement('div');

      a.href = '#';
      a.textContent = language.download.toLowerCase();
      SaveFrom_Utils.setStyle(a, {
        display: 'inline-block',
        color: 'rgba(255,255,255,.9)',
        textDecoration: 'none',
        padding: '5px 10px'
      });
      b.appendChild(a);

      SaveFrom_Utils.setStyle(b, {
        background: 'rgba(0, 0, 0, .4)',
        border: '1px solid rgba(255,255,255,.5)',
        borderRadius: '4px',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        lineHeight: 'normal',
        position: 'absolute',
        top: '5px',
        left: '5px',
        padding: 0,
        margin: 0,
        zIndex: 99999
      });

      panel.id = vimeo.panelId;
      SaveFrom_Utils.setStyle(panel, {
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
        border: 0,
        display: 'none',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        fontWeight: 'normal',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        margin: 0,
        padding: '3px',
        zIndex: 99990,
        lineHeight: '31px'
      });

      if(document.body.scrollWidth <= 400)
      {
        panel.style.paddingTop = '28px';
      }

      vimeo.btnBox = document.createElement('div');
      vimeo.btnBox.style.display = 'none';
      vimeo.btnBox.appendChild(b);
      vimeo.btnBox.appendChild(panel);

      mono.off(document, 'mouseenter', vimeo.onExtPlayerOver, false);
      mono.off(document, 'mouseleave', vimeo.onExtPlayerOver, false);
      mono.on(document, 'mouseenter', vimeo.onExtPlayerOver, false);
      mono.on(document, 'mouseleave', vimeo.onExtPlayerOver, false);

      a.addEventListener('click', vimeo.fetchIframeLinks, false);
      a.addEventListener('click', vimeo.toggleIframePanel, false);

      document.body.appendChild(vimeo.btnBox);
    },


    fetchIframeLinks: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var button = e.target;

      // try to get links from document
      var scripts = document.querySelectorAll('script'),
        l = scripts.length, i, content, matches, config,
        links = null, hd = false, title = '',
        re = new RegExp('=({\"cdn_url\":.*?});', 'i'),
        re2 = new RegExp('clip' + vimeo.clipId + '_\\d+\\s*=\\s*(\\{[\\s\\S]+?\\})\\s*;', 'i');

      for(i=0; i<l; i++)
      {
        content = scripts[i].innerHTML;
        //if(content && (matches = content.match(/=(\{\"cdn_url\"\:.*?\});/i)))
        if(content && ( (matches = content.match(re)) || (matches = content.match(re2)) ))
          break;
      }

      if(matches) {
        try {
          matches = matches[1].replace(/(\{|,)\s*(\w+)\s*:/ig, '$1"$2":').
            replace(/(:\s+)\'/g, '$1"').replace(/\'([,\]\}])/g, '"$1');
          config = JSON.parse(matches);

          links = [];

          if(config.config) {
            config = config.config;
            if(config && config.request && config.video &&
              config.request.signature && config.request.timestamp)
            {
              var data = {
                'clip_id': vimeo.clipId,
                'sig': config.request.signature,
                'time': config.request.timestamp,
                'type': 'moogaloop_local',
                'quality': 'sd',
                'codecs': 'H264,VP8,VP6'
              };

              links.push({
                url: 'http://player.vimeo.com/play_redirect?' +
                  SaveFrom_Utils.getQueryString(data),
                name: 'SD',
                type: 'mp4',
                ext: 'MP4'
              });

              if(config.video.hd == 1)
              {
                data.quality = 'hd';
                hd = true;
                links.push({
                  url: 'http://player.vimeo.com/play_redirect?' +
                    SaveFrom_Utils.getQueryString(data),
                  name: 'HD',
                  type: 'mp4',
                  ext: 'MP4'
                });
              }

              if(config.video.files && config.video.files.h264)
              {
                var files = config.video.files.h264;
                if(files.length > 0)
                {
                  for(var i = 0; i < files.length; i++)
                  {
                    if(files[i] != 'sd' && files[i] != 'hd')
                    {
                      data.quality = files[i];
                      links.push({
                        url: 'http://player.vimeo.com/play_redirect?' +
                          SaveFrom_Utils.getQueryString(data),
                        name: (files[i].length <= 3) ? files[i].toUpperCase() :
                          mono.capitalize(files[i].toLowerCase()),
                        type: 'mp4',
                        ext: 'MP4'
                      });
                    }
                  }
                }
              }
            }
          } else {
            for(i in config.request.files.h264) {
              var url = config.request.files.h264[i].url,
                t = url.match(/\.([a-z0-9]+)\?/i);
              if(i == 'hd') {
                hd = true;
              }

              links.push({
                'ext': t[1],
                'name': i.toUpperCase(),
                'type': t[1],
                'url': url
              });
            }
          }

          if(config.video.title)
            title = config.video.title;

        } catch(e) {
          // no data
        }
      }

      if(links && hd)
      {
        vimeo.appendIframeLinks(links, title, button);
      }
      else
      {

        var request = {
          action: 'getVimeoLinks',
          extVideoId: vimeo.clipId
        };

        mono.sendMessage(request, function(response){
          var _links = links;
          var _title = response.title || title;
          if (response && response.links) {
            _links = response.links;
          }
          vimeo.appendIframeLinks(_links, _title, button);
        });

        vimeo.appendIframeLinks(language.download + ' ...', button);
      }
    },


    appendIframeLinks: function(links, title, button)
    {
      var panel = document.getElementById(vimeo.panelId);

      if(typeof(links) == 'object')
      {
        vimeo.showLinks(links, title);
        button.removeEventListener('click', vimeo.fetchIframeLinks, false);
      }
      else if(typeof(links) == 'string')
      {
        panel.textContent = links;
      }
    },


    toggleIframePanel: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var panel = document.getElementById(vimeo.panelId);
      if(panel)
      {
        var isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? '' : 'none';

        if (isHidden && [1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-iframe'});
        }
      }
    },


    onExtPlayerOver: function(event)
    {
      if(vimeo.btnBox)
      {
        if(event.type == 'mouseenter')
        {
          if(vimeo.btnBox.style.display == 'none')
            vimeo.btnBox.style.display = 'block';
        }
        else if(event.type == 'mouseleave')
        {
          vimeo.btnBox.style.display = 'none';
        }
      }
    },

    videoFeed: {
      btnClassName: 'sf-feed-dl-btn',
      state: false,
      currentMenu: undefined,
      injectedStyle: undefined,
      checkUrl: function(url) {
        this.enable();
      },
      onImgOver: function(e) {
        var link = this.parentNode;

        var parent;
        var id;

        if (link.tagName == 'LI') {
          id = link.dataset.resultId;
          if (id && id.substr(0, 5) === 'clip_') {
            id = id.substr(5);
            parent = link;
            link = this.querySelector('.thumbnail_wrapper');
          } else {
            return;
          }
        }

        if (!id) {
          if (link.tagName !== 'A') {
            return;
          }
          id = link.dataset.clipId;

          parent = link.parentNode;
          if (!parent) {
            return;
          }
        }

        var isCouchMode = false;
        if (!id) {
          id = parent.id;
          isCouchMode = id.substr(0, 7) === 'item_id' && parent.classList.contains('clip');
          if (!isCouchMode && id.substr(0, 4) !== 'clip') {
            id = undefined;
          }
          if (!id && parent.tagName === 'ARTICLE' && parent.classList.contains('clip_item')) {
            id = link.getAttribute('href');
          }
          if (!id) {
            return;
          }

          id = id.match(/([0-9]+)$/);
          if (id) {
            id = id[1];
          }
        }

        var hasBtn = parent.dataset.sfBtn;
        if (hasBtn) {
          return;
        }
        parent.dataset.sfBtn = '1';

        var _this = vimeo.videoFeed;

        var classList = [_this.btnClassName];
        if (this.classList.contains('thumbnail_lg_wide')) {
          classList.push('sf-type1-btn');
        }

        if (this.classList.contains('clip_thumbnail')) {
          classList.push('sf-type3-btn');
        }

        var ol = parent.parentNode;
        if (ol && ol.id === 'clips') {
          classList.push('sf-type1-btn');
          // classList.push('sf-type2-btn');
        }
        ol = null;

        if (isCouchMode) {
          classList.push('sf-type1-btn');
        }

        if (parent.classList.contains('promo_clip') && classList.length === 1) {
          classList.push('sf-type1-btn');
          // classList.push('sf-type2-btn');
        }

        link.appendChild(mono.create('i', {
          class: classList,
          data: {
            sfId: id
          },
          append: [
            !mono.isOpera ? undefined : mono.create('img', {
              src: SaveFrom_Utils.svg.getSrc('download', '#777777'),
              style: {
                width: '12px',
                height: '12px',
                margin: '4px',
                backgroundColor: '#F8F8F8'
              }
            })
          ],
          on: ['click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var id = this.dataset.sfId;

            if ([1].indexOf(preference.cohortIndex) !== -1) {
              var isBrozar = document.getElementById('brozar');
              var isBrowseContent = document.getElementById('browse_content');
              if (isCouchMode) {
                mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-player'});
              } else
              if (isBrozar && isBrozar.contains(this)) {
                mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-discover'});
              } else
              if (isBrowseContent && isBrowseContent.contains(this)) {
                mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-list'});
              } else {
                mono.sendMessage({action: 'trackCohort', category: 'vimeo', event: 'click', label: 'video-other'});
              }
            }

            if (vimeo.currentMenu !== undefined) {
              vimeo.currentMenu.hide();
              vimeo.currentMenu = undefined;
            }

            var fromCache = vimeo.linkCache[id];
            var links = language.download + ' ...';
            if (fromCache) {
              links = SaveFrom_Utils.popupMenu.prepareLinks.vimeo(fromCache.links, fromCache.title);
            }

            var menu = vimeo.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(this, links, 'sf-popupMenu');

            if (fromCache) {
              return;
            }

            mono.sendMessage({action: 'getVimeoLinks', extVideoId: id}, function(response) {
              if (response.links) {
                vimeo.linkCache[id] = response;
                var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.vimeo(response.links, response.title);
                menu.update(menuLinks);
                return;
              }
              menu.update(language.noLinksFound);
            });
          }]
        }));

        link = null;
        parent = null;
      },
      onOver: function(e) {

        if (e.target.nodeType !== 1 ||  (e.target.tagName !== 'IMG' || !e.target.classList.contains('thumbnail')) && !e.target.classList.contains('clip_thumbnail')) {
          return;
        }

        vimeo.videoFeed.onImgOver.call(e.target, e);
      },
      enable: function() {
        if (iframe) {
          return;
        }
        if (this.state) {
          return;
        }
        this.state = true;

        mono.off(document, 'mouseenter', this.onOver, true);
        mono.on(document, 'mouseenter', this.onOver, true);

        if (this.injectedStyle === undefined) {
          this.injectedStyle = mono.create('style', {
            text: "a > .sf-feed-dl-btn," +
            "a .sf-feed-dl-btn.sf-type3-btn {" +
            'display: none;' +
            'border: 1px solid #F8F8F8;' +
            'width: 20px;' +
            'height: 20px;' +
            'padding: 0;' +
            'position: absolute;' +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#777777') + ') center no-repeat #F8F8F8;' +
            'background-size: 12px;' +
            'top: auto;' +
            'left: auto;' +
            "}" +
            "a > .sf-feed-dl-btn.sf-type1-btn," +
            "a > div > .sf-feed-dl-btn.sf-type3-btn {" +
            'top: 0;' +
            "}" +
            "a > .sf-feed-dl-btn.sf-type2-btn {" +
            'opacity: 0.5;' +
            "}" +
            "a > div > .sf-feed-dl-btn.sf-type3-btn {" +
            "z-index: 10;" +
            "}" +
            "a > .sf-feed-dl-btn:hover," +
            "a > div > .sf-feed-dl-btn.sf-type3-btn:hover {" +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#00B75A') + ') center no-repeat #F8F8F8;' +
            'background-size: 12px;' +
            "}" +
            "a > .sf-feed-dl-btn.sf-type2-btn:hover {" +
            'opacity: 0.8;' +
            "}" +
            "a > .sf-feed-dl-btn:active," +
            "a > div > .sf-feed-dl-btn.sf-type3-btn:active {" +
            "outline: 0;" +
            "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
            "}" +
            "a:hover > .sf-feed-dl-btn," +
            "a:hover > div > .sf-feed-dl-btn.sf-type3-btn" +
            "{display: block;}"
          });

          document.body.appendChild(this.injectedStyle);
        }
      },
      disable: function() {
        if (!this.state) {
          return;
        }
        this.state = false;

        mono.off(document, 'mouseenter', this.onOver, true);
        if (this.injectedStyle && this.injectedStyle.parentNode) {
          this.injectedStyle.parentNode.removeChild(this.injectedStyle);
          this.injectedStyle = undefined;
        }

        if (vimeo.currentMenu !== undefined) {
          vimeo.currentMenu.hide();
          vimeo.currentMenu = undefined;
        }
      },
      rmBtn: function() {
        var btnList = document.querySelectorAll('.sf-feed-dl-btn');
        for (var i = 0, item; item = btnList[i]; i++) {
          item.parentNode.removeChild(item);
        }
        var dataAttr = mono.dataAttr2Selector('sfBtn');
        var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
        for (i = 0, item; item = dataAttrList[i]; i++) {
          item.removeAttribute(dataAttr);
        }
      }
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('vk', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://vk.com/*',
      'http://*.vk.com/*',
      'http://vkontakte.ru/*',
      'http://*.vkontakte.ru/*',
      'https://vk.com/*',
      'https://*.vk.com/*',
      'https://vkontakte.ru/*',
      'https://*.vkontakte.ru/*'
    ])) {
      return;
    }
  }


  var language = {};
  var preference = {};
  var allowDownloadMode = 0;
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return vk.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        updateLinks();
      }
      if (message.action === 'downloadMP3Files') {
        if (allowDownloadMode) {
          audio.downloadMP3Files();
        } else {
          audio.showListOfAudioFiles(false);
        }
      }
      if (message.action === 'downloadPlaylist') {
        audio.showListOfAudioFiles(true);
      }
      if (message.action === 'downloadPhotos') {
        photo.downloadPhoto();
      }
    });

    allowDownloadMode = mono.isChrome || mono.isFF || (mono.isGM && mono.isTM);

    mono.initGlobal(function() {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleVkontakte) {
        return;
      }
      vk.run();
    });
  };

  var iframe = mono.isIframe();
  var videoExt = false;

  if(window.location.href.search(/\/video_ext\.php\?.+/) > -1) {
    videoExt = true;
  }

  if (iframe) {
    if(!videoExt && window.location.href.search(/\/widget_comments\.php\?.+/) == -1) {
      return;
    }
  }

  var vk = {
    run: function() {
      moduleState = 1;

      if (/m\.vk\.com/.test(location.hostname)) {
        return mVk.run();
      }

      SaveFrom_Utils.bridge.init();
      autoFocusLoginForm();
      audio.showLinks();
      videoFeed.run();
      videoExt && video.addFrameBtn();

      mono.onUrlChange(function(url) {
        clearTimeout(titleTimer);
        titleTimer = setTimeout(function(){
          removeDownloadLinks();
          video.catchPopup(url);
          photo.showLinks();
        }, 200);
      }, 1);
    },
    changeState: function(state) {
      if (iframe) return;
      moduleState = state;
      removeDownloadLinks();
      mono.clearUrlChange();
      audio.hideLinks();

      videoFeed.off();

      if (videoFeed.currentMenu) {
        videoFeed.currentMenu.hide();
      }

      if (video.currentMenu) {
        video.currentMenu.hide();
        video.currentMenu = null;
      }

      photo.rmCurrentPhotoBtn();

      audio.rmBitrate();

      photo.rmPhotoAlbumDlBtn();

      if (state) {
        vk.run();
      }
    }
  };

  var domain = window.location.hostname.replace(/^(?:[\w\-]+\.)*(\w+\.[a-z]{2,6})$/i, '$1');
  var downloadLinkClassName = 'savefrom_vk_download';
  var titleTimer = 0;


  function updateLinks()
  {
    removeDownloadLinks();
    video.catchPopup();
    photo.showLinks();
  }

  function autoFocusLoginForm()
  {
    if(window.location.href.search(/https?:\/\/(vkontakte\.ru|vk\.com)\/(login\.php)?$/i) != -1)
    {
      var email = document.getElementById('email');
      if(email && email.tagName == 'INPUT' && email.focus)
        setTimeout(function(){email.focus();}, 1000);
    }
  }


  function createTextLink(href, text, blank) {
    if(blank == undefined)
      blank = true;

    var a = document.createElement('a');
    a.href = href;
    a.className = downloadLinkClassName;
    a.textContent = text;

    if(blank)
      a.setAttribute('target', '_blank');

    return a;
  }


  function removeDownloadLinks()
  {
    var selector = 'a.' + downloadLinkClassName +
      ',div.' + downloadLinkClassName +
      ',span.' + downloadLinkClassName;

    audio.lastRow = null;
    videoFeed.lastLink = undefined;

    var e = document.querySelectorAll(selector);
    for(var i = e.length-1; i >= 0; i--) {
      if (audio.elIsHidden(e[i])) {
        e[i].parentNode.removeChild(e[i]);
      }
    }
  }

  function getFolderName() {
    var folderName = document.title;
    var sep = folderName.indexOf('|');
    if (sep !== -1) {
      folderName = folderName.substr(0, sep -1);
    }

    return mono.fileName.modify(folderName);
  }


  ///////////////////////////////////////////////////////////////////
  //  AUDIO

  var audio = {
    audioElClassList: ['audio', 'audioRow', 'audioRowWall'],
    lastRow: null,
    className: downloadLinkClassName,

    getMp3Link: function(elID, cb) {
      var audioId = elID.split('_');
      var ownerId = audioId[0];
      audioId = audioId[1];
      mono.ajax({
        localXHR: true,
        type: 'POST',
        data: 'act=reload_audio&al=1&audio_id='+audioId+'&owner_id='+ownerId,
        url: document.location.protocol + '//' + domain + '/audio',
        success: function(data) {
          data = data.substr(data.indexOf('['));
          try {
            var arr = JSON.parse(data);
            var src = arr[0];
            var duration = parseInt(arr[1]) || undefined;
            cb(elID, src, duration);
          } catch(e) {
            cb();
          }
        },
        error: function() {
          cb();
        }
      });
    },

    getLinksFromJson: function(albumData, list, onSuccess, onError) {
      if (!list['all']) {
        return onError();
      }
      var trackList = [];
      var linkList = {};
      for (var i = 0, item; item = list['all'][i]; i++) {
        if (albumData.aId !== undefined && item[8] !== albumData.aId) {
          continue;
        }
        var aId = item[0]+'_'+item[1];
        if (linkList[aId] !== undefined) {
          continue;
        }
        var url = item[2];
        var title = mono.fileName.decodeSpecialChars(mono.decodeUnicodeEscapeSequence(item[5] + ' - ' + item[6]));

        trackList.push({
          url: url,
          title: title,
          filename: mono.fileName.modify(title + '.mp3')
        });
        linkList[aId] = url;
      }

      if (trackList.length === 0) {
        return onError();
      }
      onSuccess(linkList, trackList);
    },

    getAudioLinksViaAPI: function(albumData, onSuccess, onError, reSend) {
      var url = document.location.protocol + '//' + domain + '/' + albumData.page;
      var params = {
        act: 'load_audios_silent',
        al: 1
      };
      if (albumData.gid !== undefined) {
        params.gid = albumData.gid;
      }
      if (albumData.id !== undefined) {
        params.id = albumData.id;
      }
      if (albumData.please_dont_ddos === undefined) {
        albumData.please_dont_ddos = 2;
      }
      params.please_dont_ddos = albumData.please_dont_ddos;
      var post = mono.param(params);
      if (reSend === undefined) {
        reSend = 0;
      }
      var _this = this;
      var onXhrError = function() {
        if (reSend > 2) {
          return onError();
        }
        setTimeout(function() {
          _this.getAudioLinksViaAPI(albumData, onSuccess, onError, ++reSend);
        }, 250);
      };
      mono.ajax({
        type: 'POST',
        url: url,
        data: post,
        localXHR: true,
        timeout: 10000,
        success: function(data) {
          if (!data) {
            return onError();
          }

          data = data.split('<!>');
          for (var n = 0, len = data.length; n < len; n++) {
            var str = data[n];
            if (str.indexOf('{') !== 0) {
              continue;
            }
            try {
              var regexp1 = /\"/g;
              str = str.replace(/\'/g, '"').replace(/<([^>]*)>/g, function(str, arg1) {
                var r = arg1.replace(regexp1, '\'');
                return '<'+r+'>';
              });
              var list = JSON.parse(str);
            } catch (e) {
              return onError();
            }
            return _this.getLinksFromJson.call(_this, albumData, list, onSuccess, onError);
          }
          onError();
        },
        error: onXhrError,
        onTimeout: onXhrError
      });
    },

    getLinksFromAlbum: function(albumData, cb) {
      this.getAudioLinksViaAPI(albumData, cb, function onError() {
        cb();
      });
    },

    getAlbumId: function(url) {
      var albumData = undefined;
      var m1 = url.match(/audios(\d+)/);
      if (m1 !== null) {
        albumData = {page: 'audio', id: m1[1], gid: 0};
      }
      var m1 = url.match(/audios-(\d+)/);
      if (m1 !== null) {
        albumData = {page: 'audio', id: 0, gid: m1[1]};
      }
      var allowArgs = false;
      var aId = url.match(/album_id=(\d+)/);
      if (aId) {
        albumData.aId = aId[1];
        allowArgs = true;
      }
      if (allowArgs === false) {
        var friendId = url.match(/friend=(\d+)/);
        if (friendId) {
          delete albumData.gid;
          albumData.id = friendId[1];
          albumData.please_dont_ddos = 3;
          allowArgs = true;
        }
      }

      if (allowArgs === false && url.indexOf('?') !== -1) {
        return;
      }
      return albumData;
    },

    getAudioLinks: function(container, cb, noAlbum) {
      var _this = this;
      container = container || document;
      var singleEl = container !== document;

      if (noAlbum === undefined && !singleEl) {
        var albumData = this.getAlbumId(location.href);
        if (albumData !== undefined) {
          return this.getLinksFromAlbum(albumData, function(linkList, trackList) {
            if (!linkList) {
              return _this.getAudioLinks(container, cb, 1);
            }
            cb(linkList, trackList);
          });
        }
      }

      var durationList = {};
      var linkList = {};
      var audioId = null;
      var audioUrl = null;

      var img = container.querySelectorAll('img.playimg');
      for (var i = 0, el; el = img[i]; i++) {
        if (!singleEl && _this.elIsHidden(el)) {
          continue;
        }
        var onclick = el.getAttribute('onclick');
        if (onclick === null || onclick.search(/(operate|operatewall)/i) === -1) {
          continue;
        }

        audioId = null;
        audioUrl = null;
        var r = onclick.match(/(?:operate|operatewall)\s*\x28\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\x22\x27](\w+)[\x22\x27]/i);
        if (r && r.length > 4) {
          audioId = r[1];
          audioUrl = 'http://cs' + r[2] + '.' + domain + '/u' + r[3] + '/audio/' + r[4] + '.mp3';
        } else {
          r = onclick.match(/(?:operate|operatewall)\s*\x28\s*[\x22\x27]?([\w\-]+)[\x22\x27]?\s*,\s*[\x22\x27](https?:\/\/[\w\_]+\.(?:vkontakte\.ru|vk\.com)\/u\d+\/audio\/\w+\.mp3)[\x22\x27]/i);
          if (r && r.length > 2) {
            audioId = r[1];
            audioUrl = r[2];
          }
        }

        if(!audioId && el.id && el.id.search(/^imgbutton/i) !== -1) {
          audioId = el.id.replace(/^imgbutton/i, '');
        }

        linkList[audioId] = audioUrl;
      }

      var wait_link = 0;
      var ready_link = 0;
      var gotLink = function (audioId, src, duration) {
        ready_link++;
        if (src) {
          linkList[audioId] = src;
        }
        if (duration) {
          durationList[audioId] = duration;
        }
        if (wait_link !== ready_link) {
          return;
        }
        cb(linkList, undefined, durationList);
      };

      var play = container.querySelectorAll(['div.play', 'div.play_new']);
      for(var i = 0, item; item = play[i]; i++) {
        if (!item.id || (!singleEl && _this.elIsHidden(item))) {
          continue;
        }
        audioId = item.id.replace(/^[^\d]+?(\-?\d+.+)$/i, '$1');
        var info = document.getElementById('audio_info' + audioId);
        if (info === null || !info.value) {
          continue;
        }
        var infoValue = info.value;
        audioUrl = SaveFrom_Utils.getMatchFirst(infoValue, /(https?:\/\/.+\.mp3)/i);
        if(audioUrl) {
          linkList[audioId] = infoValue;
          var extraPos = infoValue.indexOf('extra=');
          if (extraPos !== -1) {
            var duration = infoValue.substr(infoValue.indexOf(',', extraPos) + 1);
            duration = parseInt(duration);
            if (!isNaN(duration)) {
              durationList[audioId] = duration;
            }
          }
        } else
        if (cb !== undefined) {
          wait_link++;
          audio.getMp3Link(audioId, gotLink);
        }
      }

      if (wait_link === 0) {
        cb(linkList, undefined, durationList);
      }
    },

    getTitle: function(container, id) {
      if(!id || !container) {
        return '';
      }

      var name = '';

      var performer = container.querySelector('#performer' + id);
      if(performer === null) {
        performer = container.querySelector('#performerWall' + id);
      }
      if(performer === null) {
        performer = container.querySelector('.info b');
      }

      var title = container.querySelector('#title' + id);
      if(title === null) {
        title = container.querySelector('#titleWall' + id);
      }
      if(title === null) {
        title = container.querySelector('span.title');
      }

      if(performer !== null && performer.textContent) {
        name += performer.textContent.trim();
      }

      if(title !== null && title.textContent) {
        if(name) {
          name += ' - ';
        }

        name += title.textContent.trim();
      }

      if(name) {
        return name.replace(/\<a\s+[^\>]+\>/ig, '').replace(/\<\/a\>/ig, '');
      }

      return '';
    },

    secondsFromDuration: function(value) {
      var m = value.match(/^(?:\s*(\d+)\s*\:)?\s*(\d+)\s*\:\s*(\d+)/);
      if(m && m.length > 3) {
        if(!m[1]) {
          m[1] = 0;
        }

        return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
      }

      return 0;
    },

    secondsFromDurationNode: function(node) {
      if(!node) {
        return 0;
      }

      var text = node.textContent;
      if(!text) {
        return 0;
      }

      return this.secondsFromDuration(text);
    },

    tooltip: {
      tooltip: undefined,
      updatePos: function(button, options) {
        var tooltip = audio.tooltip;

        var btnPosition = SaveFrom_Utils.getPosition(button);
        var tooltipSize = SaveFrom_Utils.getSize(tooltip.tooltip);

        tooltip.tooltip.style.top = (btnPosition.top + options.top - tooltipSize.height)+'px';

        var left = btnPosition.left + parseInt(options.width / 2) - parseInt(tooltipSize.width / 2);
        var pageWidth = document.body.clientWidth;
        if (pageWidth < left + tooltipSize.width) {
          left = pageWidth -  tooltipSize.width;
        }
        tooltip.tooltip.style.left = left + 'px';
      },
      show: function(button, options) {
        var tooltip = audio.tooltip;

        if (tooltip.tooltip !== undefined) {
          tooltip.hide();
        } else {
          tooltip.tooltip = mono.create('div', {
            class: 'sf-tooltip',
            style: {
              position: 'absolute',
              display: 'none',
              zIndex: 9999,
              maxWidth: '200px',
              opacity: 0,
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap'
            },
            on: ['mouseenter', function(e) {
              tooltip.hide();
            }]
          });
          document.body.appendChild(tooltip.tooltip);
        }
        tooltip.tooltip.style.display = 'block';
        SaveFrom_Utils.setStyle(tooltip.tooltip, options.style);

        setTimeout(function() {
          tooltip.updatePos(button, options);
          tooltip.tooltip.style.opacity = 1;
        });

        return tooltip.tooltip;
      },
      hide: function() {
        var tooltip = audio.tooltip;

        tooltip.tooltip.style.opacity = 0;
        tooltip.tooltip.style.display = 'none';
      }
    },

    rmBitrate: function() {
      if (audio.rmBitrate.style === undefined) {
        document.body.appendChild(audio.rmBitrate.style = mono.create('style', {
          text: '.sf-bitrate-value {display: none;}'
        }));
      }
      var bitrateList = document.querySelectorAll('.sf-bitrate-value');
      for (var i = 0, item; item = bitrateList[i]; i++) {
        item.parentNode.removeChild(item);
      }
    },

    insertBitrate: function(bitrate, actionCntainer) {
      if (!bitrate || !actionCntainer || !actionCntainer.classList.contains('actions')) {
        return;
      }
      var durationContainer = actionCntainer.nextElementSibling;
      if (!durationContainer || !durationContainer.classList.contains('duration')) {
        return;
      }

      if (audio.rmBitrate.style !== undefined) {
        audio.rmBitrate.style.parentNode.removeChild(audio.rmBitrate.style);
        audio.rmBitrate.style = undefined;
      }

      var ex = durationContainer.querySelector('span.sf-bitrate-value');
      if (ex !== null) {
        return;
      }
      var el = mono.create('span', {
        text: ' '+bitrate,
        class: 'sf-bitrate-value',
        style: {
          position: 'absolute',
          width: '80px',
          textAlign: 'right',
          right: 0,
          top: '21px',
          opacity: '0.8'
        }
      });
      durationContainer.appendChild(el);
    },

    onDlBtnOver: function(e) {
      var tooltip = audio.tooltip;
      if (e.type !== 'mouseenter') {
        tooltip.hide();
        return;
      }
      var _this = this;

      var options = undefined;
      var ttp = tooltip.show(_this, options = {
        top: -6,
        width: 24,
        style: {
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          color: 'rgb(48, 48, 48)'
        }
      });
      var dataBitrate = _this.dataset.bitrate;
      var dataSize = _this.dataset.size;
      if (dataBitrate || dataSize) {
        if (dataBitrate) {
          audio.insertBitrate(dataBitrate, _this.parentNode);
          dataBitrate = ' ~ ' + dataBitrate;
        }
        ttp.style.padding = '2px 5px 3px';
        ttp.textContent = ' (' + dataSize + dataBitrate + ')';
        return;
      }
      ttp.style.padding = '2px 2px 0 2px';
      ttp.textContent = '';
      ttp.appendChild(mono.create('img', {
        src: '/images/upload.gif',
        height: 8,
        width: 32,
        style: {
          marginTop: '2px',
          marginBottom: '1px'
        }
      }));

      audio.onOverInsertBitrate(_this, _this.parentNode, function(response) {
        ttp.style.padding = '2px 5px 3px';
        if (!response.fileSize) {
          ttp.textContent = language.getFileSizeFailTitle;
          tooltip.updatePos(_this, options);
          return;
        }
        var size = _this.dataset.size;
        var bitrate = _this.dataset.bitrate;

        if (bitrate) {
          bitrate = ' ~ ' + bitrate;
        }

        ttp.textContent = ' (' + size + bitrate + ')';

        tooltip.updatePos(_this, options);
      });
    },

    getDlBtn: function(url, filename, duration, rowId) {
      var args = {
        href: url,
        class: [audio.className, 'sf-audio-btn'],
        data: {
          duration: duration || '',
          rowId: rowId
        },
        style: {
          width: '16px',
          height: '16px',
          verticalAlign: 'middle'
        },
        on: [
          ['mouseenter', this.onDlBtnOver],
          ['mouseleave', this.onDlBtnOver]
        ]
      };
      if (filename) {
        args.download = mono.fileName.modify(filename);
        args.on.push(['click', function(e) {
          SaveFrom_Utils.downloadOnClick(e, null, {
            useFrame: true
          });

          var rowList = document.querySelectorAll('#'+this.dataset.rowId);
          for (var i = 0, row; row = rowList[i]; i++) {
            row.style.backgroundColor = '#f4f7fc';
          }

          if ([1].indexOf(preference.cohortIndex) !== -1 && this.parentNode) {
            if (this.parentNode.id === 'gp_performer') {
              mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'music-player'});
            } else
            if (['pd_performer', 'ac_performer'].indexOf(this.parentNode.id) !== -1) {
              mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'music-playnow'});
            } else {
              mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'music-list'});
            }
          }
        }]);
      }
      return mono.create('a', args);
    },

    onOverInsertBitrate: function(dlBtn, actions, cb) {
      var onResponse = function(response) {
        if (!response.fileSize) {
          cb && cb(response);
          return;
        }

        var size = SaveFrom_Utils.sizeHuman(response.fileSize, 2);
        var bitrate = '';
        if (dlBtn.dataset.duration) {
          bitrate = Math.floor((response.fileSize / dlBtn.dataset.duration) / 125) + ' ' + language.kbps;
        }

        dlBtn.dataset.bitrate = bitrate;
        dlBtn.dataset.size = size;

        audio.insertBitrate(bitrate, actions);

        cb && cb(response);
      };
      try {
        mono.sendMessage({action: 'getFileSize', url: dlBtn.href}, onResponse);
      } catch (e) {
        onResponse({});
      }
    },

    handleAudioRow: function(container, audioId, url, duration) {
      if (container && container.id !== 'audio'+audioId) {
        container = null;
      }
      if (!container) {
        container = document.getElementById('audio'+audioId);
      }
      if (!container || !url) {
        return;
      }

      var data = container.querySelectorAll(['.info', 'div.actions', 'div.duration']);
      if (data.length !== 3) {
        return;
      }
      var _data = [null, null, null];
      for (var n = 0, el; el = data[n]; n++) {
        if (el.classList.contains('info')) {
          _data[0] = el;
        } else
        if (el.classList.contains('actions')) {
          _data[1] = el;
        } else
        if (el.classList.contains('duration')) {
          _data[2] = el;
        }
      }
      data = _data;

      var info = data[0];
      info.style.position = 'relative';

      if (!duration) {
        duration = data[2];
        duration = this.secondsFromDurationNode(duration);
      }

      var actions = data[1];

      var title = this.getTitle(container, audioId);
      var filename = title ? title + '.mp3' : '';

      var rowId = container.id;

      var dlBtn = this.getDlBtn(url, filename, duration, rowId);

      var style = {};

      if (actions.childNodes.length === 0 || actions.querySelectorAll(['div.audio_edit_wrap', 'div.audio_remove_wrap', 'div.audio_add_wrap:not(.unshown)']).length === 0) {
        if(!SaveFrom_Utils.getParentByClass(info, 'post_media')) {
          if (SaveFrom_Utils.getParentByClass(info, 'pad_audio_table')) {
            style.margin = '9px 40px 9px 0';
          } else {
            var profileAudios = document.getElementById('profile_audios');
            if (profileAudios && profileAudios.contains(info)) {
              style.marginRight = '35px';
            } else {
              style.margin = '6px 6px 6px 0';
            }
          }
        } else
        if(SaveFrom_Utils.getParentByClass(info, 'audio_list')) {
          style.padding = '0';
        }
      } else {
        var titleWrap = info.querySelector('.title_wrap');

        if (titleWrap !== null) {
          titleWrap.style.width = (parseInt(SaveFrom_Utils.getStyle(titleWrap, 'width')) - 20) + 'px';
        }

        if (SaveFrom_Utils.getParentByClass(info, 'pad_audio_table')) {
          if (SaveFrom_Utils.getParentByClass(info, 'post_info')) {
            style.margin = '0 7px 0 0';
          } else {
            style.margin = '9px 7px 0 0';
          }
        }
      }
      style.zIndex = 2;
      dlBtn.classList.add('audio_edit_wrap');
      dlBtn.classList.add('fl_r');
      SaveFrom_Utils.setStyle(dlBtn, style);

      if(preference.vkShowBitrate === 1) {
        this.onOverInsertBitrate(dlBtn, actions);
      }

      actions.appendChild(dlBtn);
    },

    handleCurrentAudioRow: function(container, data) {
      var duration = parseInt(data[3]);
      if (isNaN(duration)) {
        duration = undefined;
      }
      var url = data[2];

      if (!duration) {
        duration = this.secondsFromDuration(data[4]);
      }
      var title = data[5] + ' - ' + data[6];
      var filename = title ? title + '.mp3' : '';

      var rowId = 'audio'+data[0]+'_'+data[1];

      var dlBtn = this.getDlBtn(url, filename, duration, rowId);
      dlBtn.classList.remove('sf-audio-btn');
      SaveFrom_Utils.setStyle(dlBtn, {
        background: 'url('+SaveFrom_Utils.svg.getSrc('download', '#6C8CAC')+') center no-repeat',
        backgroundSize: '12px',
        width: '12px',
        height: '12px',
        padding: 0,
        margin: 0,
        cssFloat: 'left',
        marginRight: '3px',
        marginTop: '1px',
        marginBottom: '-2px'
      });

      container.insertBefore(dlBtn, container.firstChild);
    },

    addDlTrackBtn: function(container) {
      var _this = this;
      this.getAudioLinks(container, function(linkList, trackList, durationList) {
        if (!durationList) {
          durationList = {};
        }
        if (container) {
          container.dataset.sfAddingBtn = '0';
        }
        for (var audioId in linkList) {
          _this.handleAudioRow.call(_this, container, audioId, linkList[audioId], durationList[audioId]);
        }
      });
    },

    getCurrentTrack: function(data) {
      if (data.pad_lastsong) {
        try {
          return JSON.parse(data.pad_lastsong);
        } catch (e) {}
      }

      if (data.audio_id && data.pad_playlist) {
        try {
          data.audio_id = JSON.parse(data.audio_id);
          data.pad_playlist = JSON.parse(data.pad_playlist);
          if (data.pad_playlist[data.audio_id]) {
            return data.pad_playlist[data.audio_id];
          }
        } catch (e) {}
      }
      
      if (data.lastSong) {
        return data.lastSong;
      }

      if (data.defaultTrack) {
        return data.defaultTrack;
      }
    },

    addDlCurrentTrackBtn: function(container) {
      var _this = this;
      SaveFrom_Utils.bridge.send('getFromStorage', ['pad_lastsong', 'pad_playlist', 'audio_id'], function(data) {
        container.dataset.sfAddingBtn = '0';
        if (data === undefined) {
          return;
        }

        data = audio.getCurrentTrack(data);
        if (!data) {
          return;
        }

        _this.handleCurrentAudioRow(container, data);
      });
    },

    onMouseOver: function(e) {
      var _this = audio;
      var node = e.target;
      if (node.nodeType !== 1) {
        return;
      }
      var isCurrentTrack = 0;
      var row = null;
      if (['ac_performer','pd_performer', 'gp_performer'].indexOf(node.id) !== -1) {
        row = node;
        isCurrentTrack = 1;
      }
      if (row === null) {
        for (var i = 0, className; className = _this.audioElClassList[i]; i++) {
          if (node.classList.contains(className)) {
            row = node;
            break;
          }
        }
      }
      if (row === null || row.dataset.sfAddingBtn === '1' || row.getElementsByClassName(audio.className).length !== 0) {
        return;
      }
      row.dataset.sfAddingBtn = '1';

      if (isCurrentTrack === 0) {
        _this.addDlTrackBtn.call(_this, row);
      } else {
        _this.addDlCurrentTrackBtn.call(_this, row);
      }
    },

    addCustomStyle: function() {
      if (this.addCustomStyle.hasStyle === 1) {
        return;
      }
      this.addCustomStyle.hasStyle = 1;
      var currentStyle = document.querySelector('#savefrom-styles.sf-audio');
      if (currentStyle) {
        currentStyle.parentNode.removeChild(currentStyle);
      }

      SaveFrom_Utils.addStyleRules('.' + downloadLinkClassName+'.sf-audio-btn', {
        'background': 'url('+SaveFrom_Utils.svg.getSrc('download', '#5f7fa2')+') center no-repeat !important',
        'opacity': '0.4'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('#audio.new .audio.current.over .area .' + downloadLinkClassName+'.sf-audio-btn,' +
        '#pad_playlist .audio.current.over .area .' + downloadLinkClassName+'.sf-audio-btn', {
        'background': 'url('+SaveFrom_Utils.svg.getSrc('download', '#FFFFFF')+') center no-repeat !important'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('.audios_module .module_body .audio .actions .' + downloadLinkClassName +','+
        '#choose_audio_rows .audio .actions .' + downloadLinkClassName, {
        verticalAlign: 'top',
        margin: '7px'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('.audio.no_actions .actions .' + downloadLinkClassName, {
        'margin-right': '38px !important'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('.audio .actions .' + downloadLinkClassName, {
        'display': 'none'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('.audio.over .actions .' + downloadLinkClassName, {
        'display': 'block'
      }, 'sf-audio');
      SaveFrom_Utils.addStyleRules('.audio.over .actions .' + downloadLinkClassName+':hover', {
        'opacity': '1 !important'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('.audio.current .sf-bitrate-value', {
        'visibility': 'hidden'
      }, 'sf-audio');

      SaveFrom_Utils.addStyleRules('#audios_list .post_friends .post_table .post_media.wall_audio .actions .' + downloadLinkClassName, {
        margin: '2px 2px 0 0'
      }, 'sf-audio');
      
      SaveFrom_Utils.addStyleRules('#audios_list .post_friends .post_table .post_media.wall_audio .audio.current.over .actions .' + downloadLinkClassName + ',' +
        '#pad_playlist .post_info .audio.current.over .actions .' + downloadLinkClassName, {
        'background': 'url('+SaveFrom_Utils.svg.getSrc('download', '#5f7fa2')+') center no-repeat !important'
      }, 'sf-audio');
    },

    hideLinks: function() {
      if (this.addCustomStyle.hasStyle) {
        var currentStyle = document.querySelector('#savefrom-styles.sf-audio');
        if (currentStyle) {
          currentStyle.parentNode.removeChild(currentStyle);
        }
        SaveFrom_Utils.addStyleRules('.' + downloadLinkClassName, {
          'display': 'none'
        }, 'sf-audio');
        this.addCustomStyle.hasStyle = 0;
      }
      if (!this.onMouseOver.hasBind) {
        return;
      }
      this.onMouseOver.hasBind = 0;
      mono.off(document, 'mouseenter', this.onMouseOver, true);
      if (audio.tooltip.tooltip) {
        audio.tooltip.tooltip.parentNode.removeChild(audio.tooltip.tooltip);
        audio.tooltip.tooltip = undefined;
      }
    },

    showLinks: function() {
      this.addCustomStyle();
      if (this.onMouseOver.hasBind === 1) {
        return;
      }
      this.onMouseOver.hasBind = 1;
      mono.off(document, 'mouseenter', this.onMouseOver, true);
      mono.on(document, 'mouseenter', this.onMouseOver, true);
    },

    elIsHidden: function isHidden(el) {
      return (el.offsetParent === null)
    },

    getTitleForLinkList: function(linkList) {
      var list = [];
      if (!linkList) {
        return list;
      }
      for(var i in linkList) {
        var id = i;
        var row = document.getElementById('audio' + id);
        if (row === null) {
          continue;
        }
        var title = audio.getTitle(row, id);

        var duration = 0;
        var d = row.querySelector('div.duration');
        if(d !== null) {
          duration = audio.secondsFromDurationNode(d);
        }

        var filename = mono.fileName.modify(title ? title + '.mp3' : '');

        list.push({url: linkList[i], filename: filename, title: title, duration: duration});
      }
      return list;
    },

    downloadMP3Files: function() {
      var container = photo.getLayer() || document;
      audio.getAudioLinks(container, function(linkList, trackList) {
        var list = trackList || audio.getTitleForLinkList(linkList);

        if (list.length === 0) {
          return alert(language.vkMp3LinksNotFound);
        }
        // mp3
        SaveFrom_Utils.downloadList.showBeforeDownloadPopup(list, {
          type: 'audio',
          folderName: getFolderName()
        });
      });
    },

    showListOfAudioFiles: function(showPlaylist) {
      var container = photo.getLayer() || document;
      audio.getAudioLinks(container, function(linkList, trackList) {
        var list;
        if(showPlaylist) {
          list = trackList || audio.getTitleForLinkList(linkList);

          if(list.length !== 0) {
            return SaveFrom_Utils.playlist.popupPlaylist(list, getFolderName(), true);
          }
        } else {
          list = [];
          for(var i in linkList) {
            list.push({url: linkList[i]});
          }

          if(list.length !== 0) {
            return SaveFrom_Utils.playlist.popupFilelist(list);
          }
        }

        alert(language.vkMp3LinksNotFound);
      });
    }
  };

  //  /AUDIO
  ///////////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////////
  //  VIDEO

  var video = {
    panelId: 'savefrom__vk_video_links',
    videoAttr: 'data-savefrom-video',
    hiddenAttr: 'data-savefrom-hidden',
    btnBoxId: 'sf-iframe-dl-btn',
    btnBox: null,
    style: {fontSize: '10pt', margin: '15px 0', padding: '0'},

    isVideoPageRegExp: /video(-?[0-9]+)_([0-9]+)/,

    lastWaitChange: undefined,

    waitChange: function(onCheck, cb, options) {
      options = options || {
        repeat: 0
      };
      var abort = false;
      var n = options.count || 12;
      var onCb = function(data) {
        cb(data);
        if (options.repeat > 0) {
          options.repeat--;
          n = options.count || 12;
          wait();
        }
      };
      var wait = function() {
        if (abort) return;

        n--;
        setTimeout(function() {
          if (abort) return;
          if (n < 0) {
            return onCb();
          }

          onCheck(function(data) {
            if (abort) return;

            if (data) {
              return onCb(data);
            }
            wait();
          });
        }, options.timer || 500);
      };
      if (options.now) {
        onCheck(function(data) {
          if (abort) return;

          if (data) {
            return onCb(data);
          }
          wait();
        });
      } else {
        wait();
      }
      return {
        abort: function() {
          abort = true;
        }
      }
    },

    getLinksFormUrl: function(url) {
      if (!url) return;

      if (url.substr(0, 2) === '//') {
        url = 'http:'+url;
      }

      var request;
      var hostingList = SaveFrom_Utils.embedDownloader.hostings;
      for (var hostingName in hostingList) {
        var hosting = hostingList[hostingName];
        for (var i = 0, item; item = hosting.re[i]; i++) {
          var data = url.match(item);
          if (data) {
            request = {
              hosting: hostingName,
              action: hosting.action,
              extVideoId: data[1]
            };
            break;
          }
        }
        if (request) break;
      }

      if (!request) return;
      return {
        request: request
      }
    },

    getLinksFromFlashVars: function(flashVars) {
      var params = mono.parseUrlParams(flashVars, {
        argsOnly: 1,
        forceSep: '&',
        useDecode: 1
      });
      var links = video.getLinksFromHtml5MetaData(params);
      return links;
    },

    getLinksFromHtml5MetaData: function(metaData) {
      if (!metaData) return;

      var title = metaData.md_title;

      if (title === undefined) return;

      var videoUrlRegExp = /url([0-9]+)/;
      var urlList = {};

      var hasLinks = false;
      for (var key in metaData) {
        if (key === 'extra_data' && metaData.extra === "52") {
          urlList['Instagram'] = metaData[key];
          hasLinks = true;
          continue;
        }
        var quality = key.match(videoUrlRegExp);
        if (quality === null) continue;

        var link = metaData[key];
        var vPos = link.indexOf('?');
        if (vPos !== -1) {
          link = link.substr(0, vPos);
        }
        hasLinks = true;
        urlList[quality[1]] = link;
      }

      if (!hasLinks) {
        return;
      }

      return {
        title: title,
        links: urlList
      }
    },

    onOtherLinkClick: function(e) {
      var n = 10;
      var waitChangeVideo = setInterval(function() {
        n--;
        if (n < 0) {
          return clearInterval(waitChangeVideo);
        }
        if (document.body.contains(video.bindOtherLinks.lastLayer)) return;

        video.catchPopup();
        clearInterval(waitChangeVideo);
      }, 500);
    },

    bindOtherLinks: function(layer) {
      video.waitChange(function onCheck(cb) {
        if (!layer.querySelector('.mv_narrow_column')) {
          return cb();
        }
        cb(layer.querySelector('#mv_title'));
      }, function onReady(title) {
        if (!title) return;

        video.bindOtherLinks.lastLayer = title;
        var linkList = layer.querySelectorAll('a');
        for (var i = 0, link; link = linkList[i]; i++) {
          var href = link.getAttribute('href');
          if (!href || !href.match(video.isVideoPageRegExp)) {
            continue;
          }
          link.removeEventListener('click', video.onOtherLinkClick);
          link.addEventListener('click', video.onOtherLinkClick);
        }
      }, {now: 1, timer: 500, count: 4});
    },

    getRutubeLinks: function(src) {
      if (!/rutube[^\/]+\/(?:play|video)\/embed\/(\d+)/.test(src) && !/video\.rutube\./.test(src)) {
        return;
      }

      var links = SaveFrom_Utils.popupMenu.prepareLinks.rutube(src);

      return {
        isUmmy: true,
        links: links
      };
    },

    isRutubeLink: function(src) {
      return /\/\/.*rutube\..*/.test(src);
    },

    getLinksVideoEl: function(videoEl, layer) {
      "use strict";
      var title = layer.querySelector('.vv_summary');
      if (!title) {
        return null;
      }
      title = title.textContent;

      var linkList = {};
      var hasLinks;
      var sourceList = videoEl.querySelectorAll('source');
      for (var i = 0, node; node = sourceList[i]; i++) {
        var src = node.src || '';
        var pos = src.indexOf('?');
        if (pos !== -1) {
          src = src.substr(0, pos);
        }
        var m = src.match(/\.(\d+)\.[^\/]+$/);
        if (m === null) {
          continue;
        }
        linkList[m[1]] = src;
        hasLinks = true;
      }

      if (!hasLinks) {
        return;
      }

      return {
        title: title,
        links: linkList
      }
    },

    getLinksFromPlayer: function(layer, playerNode, cb) {
      if (!playerNode) return;

      var links, flashVars;
      if (playerNode.tagName === 'OBJECT') {
        flashVars = playerNode.querySelector('param[name="flashvars"]');
        if (flashVars) {
          flashVars = flashVars.getAttribute('value');
          links = video.getLinksFromFlashVars(flashVars);
        }
      } else
      if (playerNode.tagName === 'IFRAME') {
        var src = playerNode.getAttribute('src');
        if (preference.showUmmyItem && this.isRutubeLink(src)) {
          links = video.getRutubeLinks(src);
        } else {
          links = video.getLinksFormUrl(src);
        }
      } else
      if (playerNode.tagName === 'EMBED') {
        var url = playerNode.getAttribute('src');
        if (preference.showUmmyItem && this.isRutubeLink(url)) {
          links = video.getRutubeLinks(url);
        } else
        if (url && /\/\/.*pladform\..*\//.test(url)) {
          var params = mono.parseUrlParams(url);
          links = {
            request: {
              action: 'getPladformVideo',
              playerId: params.pl,
              videoId: params.videoid
            }
          };
        }
        if (!links) {
          flashVars = playerNode.getAttribute('flashvars');
          if (flashVars) {
            links = video.getLinksFromFlashVars(flashVars);
          }
        }
        if (!links) {
          links = video.getLinksFormUrl(playerNode.getAttribute('src'));
        }
      }
      if (playerNode.tagName === 'VIDEO' && playerNode.id !== 'html5_player') {
        links = video.getLinksVideoEl(playerNode, layer);
      }
      if (links) {
        return cb(links, layer);
      }
      if (playerNode.id === 'html5_player') {
        SaveFrom_Utils.bridge.send('getHtml5video', [], function(metaData) {
          var links = video.getLinksFromHtml5MetaData(metaData);
          if (links) {
            return cb(links, layer);
          }
        });
      }
      if (playerNode.tagName === 'A') {
        var href = playerNode.href;
        var pos;
        if ((pos = href.indexOf('away.php?to=')) !== -1) {
          href = decodeURIComponent(href.substr(pos + 12));
          links = SaveFrom_Utils.embedDownloader.checkUrl(href);
          if (links) {
            return cb({request: links}, layer);
          }
        }
      }
    },

    catchPopup: function(url) {
      if (!url) {
        url = document.URL;
      }

      delete video.bindOtherLinks.lastLayer;
      if (url.match(video.isVideoPageRegExp) === null) return;

      if (video.lastWaitChange !== undefined) {
        video.lastWaitChange.abort();
      }
      video.lastWaitChange = video.waitChange(function onCheck(cb) {
        cb(document.getElementById('mv_box'));
      }, function onReady(layer) {
        video.bindOtherLinks(layer);
        if (!layer) return;

        video.lastWaitChange = video.waitChange(function onCheck(cb) {
          var player = layer.querySelector('#video_player');
          if (!player || player.tagName === 'DIV') {
            player = layer.querySelector('#html5_player') || layer.querySelector('#flash_video_obj');
          }
          if (!player) {
            player = layer.querySelector('#playerObj') || layer.querySelector('#player');
            if (player && player.tagName === 'OBJECT' && !player.querySelector('param[name="flashvars"]')) {
              player = undefined;
            }
          }
          cb(player);
        }, function onReady(playerNode) {
          video.getLinksFromPlayer(layer, playerNode, video.appendButton);
        }, {now: 1});
      }, {now: 1});
    },

    preparePladformLinks: function(links) {
      var title = 'noname';
      var linkList = {};

      for (var i = 0, item; item = links[i]; i++) {
        title = item.title;
        if (linkList[item.quality]) {
          item.quality =+ ' ';
        }
        linkList[item.quality.toUpperCase()] = item.url;
      }

      return {
        title: title,
        links: linkList
      }
    },

    prepareLinks: function(links) {
      var title = links.title;

      var linkList = [];
      for (var quality in links.links) {
        var item = links.links[quality];

        var ext = item.match(/[\w]+\.(mp4|flv)(?:\?|$)/i);
        if (!ext) {
          ext = 'flv';
        } else {
          ext = ext[1];
        }
        var format = ext.toUpperCase();

        linkList.push({href: item, quality: quality, title: title, ext: ext, format: format, forceDownload: true, useIframe: true});
      }

      return linkList;
    },

    appendButton: function(links, container) {
      var styleList = ['flat_button', 'mv_share_button', 'fl_l', 'sf-under-video-btn'];
      var controlsBody =  container.querySelector('#mv_controls');

      var isInCounter = null;
      var isInTopControls = null;

      if (!controlsBody) {
        controlsBody = container.querySelector('#mv_top_controls');
        isInTopControls = controlsBody;
      }
      if (!controlsBody) return;

      var btnBody = null;

      if (isInTopControls) {
        btnBody = controlsBody;
        styleList = [];
      } else {
        btnBody = controlsBody.querySelector('.mv_share_actions');
        if (!btnBody) return;

        var actionsWrapper = btnBody.querySelector('.mv_share_actions_wrap');
        if (!actionsWrapper) return;

        isInCounter = audio.elIsHidden(actionsWrapper);
        if (isInCounter) {
          var wrapper = controlsBody.querySelector('#mv_date_views_wrap');
          if (!wrapper) return;
          wrapper = wrapper.parentNode;
        } else {
          var separatorList = btnBody.querySelectorAll('.mv_rtl_divider');
          var separator;
          if (separatorList.length === 0) {
            separator = mono.create('div', {class: 'mv_rtl_divider fl_l'});
            btnBody.appendChild(separator);
          } else {
            separator = separatorList[separatorList.length - 1];
          }
          separatorList = null;
        }
      }

      var oldBtnList = btnBody.querySelectorAll('.'+downloadLinkClassName);
      for (var i = 0, node; node = oldBtnList[i]; i++) {
        node.parentNode.removeChild(node);
      }
      node = null;
      oldBtnList = null;

      btnBody = null;
      actionsWrapper = null;
      controlsBody = null;

      var dlBtn = mono.create(document.createDocumentFragment(), {
        append: [
          mono.create('div', {class: 'mv_rtl_divider fl_l '+downloadLinkClassName}),
          mono.create('div', {
            class: styleList.concat([downloadLinkClassName]),
            style: {
              cursor: 'pointer'
            },
            append: isInTopControls ? [
              mono.create('img', {
                src: SaveFrom_Utils.svg.getSrc('download', '#99AEC8'),
                width: 15,
                height: 15
              })
            ] : [
              mono.create('img', {
                src: SaveFrom_Utils.svg.getSrc('download', '#99AEC8'),
                width: 12,
                height: 12,
                style: {
                  marginBottom: '-2px',
                  marginRight: '5px'
                }
              }),
              mono.create('span', {
                text: language.download
              })
            ],
            on: [
              ['click', function(e) {
                e.stopPropagation();

                if (video.currentMenu && video.currentMenu.isShow) {
                  video.currentMenu.hide();
                  video.currentMenu = null;
                  return;
                }

                if ([1].indexOf(preference.cohortIndex) !== -1) {
                  mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'video-under-video'});
                }

                var menu = video.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download+'...', 'sf-single-video-menu', {
                  parent: container,
                  offsetRight: !isInTopControls ? 0 : -160
                });

                if (links.isUmmy) {
                  menu.update(links.links);
                  return;
                }

                if (links.request) {
                  var onResponse = function(response) {
                    var mLinks;
                    if (response && links.request.action === 'getPladformVideo') {
                      mLinks = video.prepareLinks(video.preparePladformLinks(response));

                      menu.update(mLinks);
                      return;
                    }
                    if(!response || !response.links) {
                      return menu.update(language.noLinksFound);
                    }
                    mLinks = SaveFrom_Utils.popupMenu.prepareLinks[links.request.hosting](response.links, response.title);
                    menu.update(mLinks);
                  };
                  try {
                    mono.sendMessage(links.request, onResponse);
                  } catch (e) {
                    onResponse();
                  }
                  return;
                }

                var mLinks = video.prepareLinks(links);
                menu.update(mLinks);
              }],
              ['mousedown', function(e) {e.stopPropagation();}],
              ['keydown', function(e) {e.stopPropagation();}]
            ]
          })
        ]
      });
      if (isInTopControls) {
        mono.create(dlBtn.lastChild, {
          style: {
            margin: '-5px',
            padding: '5px',
            marginTop: '6px'
          }
        });
        isInTopControls.appendChild(dlBtn);
        isInTopControls = !!isInTopControls;
      } else
      if (isInCounter) {
        dlBtn = dlBtn.lastChild;
        dlBtn.classList.remove('flat_button');
        mono.create(dlBtn, {
          style: {
            paddingTop: '2px',
            paddingBottom: '2px',
            marginTop: '3px',
            marginLeft: '10px'
          }
        });
        wrapper.appendChild(dlBtn);
        wrapper = null;
      } else {
        separator.parentNode.insertBefore(dlBtn, separator);
      }

      dlBtn = null;
      separator = null;
    },

    onFramePlayerOver: function(event) {
      if(!video.btnBox) {
        mono.off(document, 'mouseenter', video.onFramePlayerOver, true);
        mono.off(document, 'mouseleave', video.onFramePlayerOver, true);
        return;
      }

      var panel = document.getElementById(video.panelId);
      if (panel && (panel.getAttribute(video.videoAttr) !== 'active' ||
        panel.getAttribute(video.hiddenAttr))) {
        panel = null;
      }

      if(event.type === 'mouseenter') {
        if(video.btnBox.style.display == 'none')
          video.btnBox.style.display = 'block';

        if(panel) {
          panel.style.display = 'block';
        }
      } else
      if(event.type === 'mouseleave') {
        video.btnBox.style.display = 'none';

        if(panel) {
          panel.style.display = 'none';
        }
      }
    },

    frameLinksShow: function(links, title, parent, style, action) {
      if(!links)
        return;

      if(!parent)
        parent = document.getElementById(video.panelId);

      if(!parent)
        return;

      SaveFrom_Utils.emptyNode(parent);

      if(action == 'getYoutubeLinks')
      {
        SaveFrom_Utils.video.yt.init();
        SaveFrom_Utils.video.yt.show(links, parent, preference.moduleShowDownloadInfo, {
          link: null,
          text: null,
          btn: {color: '#777', borderColor: '#555', fontSize: '95%'},
          fsIcon: null,
          fsText: {fontSize: '80%'}
        }, title);

        return;
      }

      if(title)
        title = title.replace(/\x2B+/g, ' ').trim();

      var html = false;
      if(typeof(links) == 'string')
        html = true;
      else if(links.length == 0)
        return;

      if(videoExt)
      {
        SaveFrom_Utils.setStyle(parent, {
          color: '#fff',
          display: 'block',
          float: 'none',
          fontSize: '11pt',
          fontWeight: 'normal',
          margin: 0,
          padding: '5px',
          textAlign: 'center'
        });
      }

      if(style && typeof(style) == 'object')
        SaveFrom_Utils.setStyle(parent, style);

      if(html)
      {
        parent.textContent = links;
        return;
      }

      var color = '';
      for(var i = 0; i < links.length; i++)
      {
        var a = null;

        if(typeof(links[i]) == 'object' && links[i].url)
        {
          var ext = links[i].ext;
          if(!ext)
          {
            ext = 'FLV';
            if(links[i].url.search(/\.mp4$/i) != -1)
              ext = 'MP4';
          }

          var name = links[i].name ? links[i].name : ext;
          a = createTextLink(links[i].url, name);

          if(!links[i].noTitle)
          {
            if(title)
            {
              a.setAttribute('download', mono.fileName.modify(
                title + '.' + ext.toLowerCase()));
            }

            a.addEventListener('click', function(event){
              SaveFrom_Utils.downloadOnClick(event, null, {
                useFrame: true
              });
            }, false);
          }

          if(links[i].subname)
          {
            var st = document.createElement('span');
            SaveFrom_Utils.setStyle(st, {
              fontSize: '80%',
              fontWeight: 'normal',
              marginLeft: '3px'
            });
            st.textContent = links[i].subname;
            a.appendChild(st);
          }
        }

        if(a)
        {
          a.style.marginLeft = '10px';
          if(videoExt)
            a.style.color = '#fff';

          a.title = language.downloadTitle;
          parent.appendChild(a);

          SaveFrom_Utils.appendFileSizeIcon(a,
            {color: '#a0a0a0', opacity: '.75'},
            {fontSize: '95%', opacity: '.9'});

          if(!color)
            color = SaveFrom_Utils.getStyle(a, 'color');
        }
      }
    },

    appendFrameBtn: function(links, container) {
      if(container.querySelector('.' + downloadLinkClassName)) {
        return;
      }

      var oldPanel = document.getElementById(video.panelId);
      if(oldPanel) {
        oldPanel.parentNode.removeChild(oldPanel);
      }

      if(video.btnBox && video.btnBox.parentNode) {
        video.btnBox.parentNode.removeChild(video.btnBox);
      }

      var panel = mono.create('div', {
        id: video.panelId,
        class: downloadLinkClassName,
        style: {
          background: '#000',
          border: 0,
          display: 'block',
          fontFamily: 'Arial,Helvetica,sans-serif',
          lineHeight: 'normal',
          position: 'absolute',
          top: '25px',
          left: 0,
          right: 0,
          zIndex: 99990,
          color: '#fff',
          float: 'none',
          fontWeight: 'normal',
          textAlign: 'center'
        }
      });

      var box = video.btnBox = mono.create('div', {
        id: video.btnBoxId,
        class: downloadLinkClassName,
        style: {
          background: '#000',
          border: '1px solid #fff',
          display: 'none',
          fontFamily: 'Arial,Helvetica,sans-serif',
          fontSize: '13px',
          lineHeight: 'normal',
          position: 'absolute',
          top: '2px',
          right: '2px',
          padding: '3px 5px',
          margin: 0,
          zIndex: 99999
        },
        append: [
          mono.create('a', {
            href: '#',
            text: language.download,
            style: {
              color: '#fff',
              textDecoration: 'none'
            },
            on: ['click', function(e) {
              e.stopPropagation();
              e.preventDefault();

              var isHidden = panel.getAttribute(video.videoAttr) !== 'active' || panel.style.display === 'none';

              if (isHidden && [1].indexOf(preference.cohortIndex) !== -1) {
                mono.sendMessage({action: 'getActiveTabUrl'}, function(tabUrl) {
                  if (typeof tabUrl === 'string' && tabUrl.indexOf('vk.com/') !== -1) {
                    mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'video-on-video'});
                  } else {
                    mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'video-iframe'});
                  }
                });
              }

              if(panel.getAttribute(video.videoAttr) === 'active') {
                if(panel.style.display === 'none') {
                  panel.style.display = 'block';
                  panel.removeAttribute(video.hiddenAttr);
                } else {
                  panel.style.display = 'none';
                  panel.setAttribute(video.hiddenAttr, '1');
                }
                return false;
              }

              panel.setAttribute(video.videoAttr, 'active');

              if (links.request) {
                panel.appendChild(mono.create('img', {src: '/images/upload.gif'}));
                var onResponse = function(response) {
                  var links = response ? response.links : undefined;
                  if (links) {
                    video.frameLinksShow(links, response.title, null, video.style, response.action);
                  } else {
                    video.frameLinksShow(language.noLinksFound, '', null, video.style);
                  }
                };
                try {
                  mono.sendMessage(links.request, onResponse);
                } catch (e) {
                  video.frameLinksShow(language.noLinksFound, '', null, video.style);
                }
                return;
              }

              var mLinks = video.prepareLinks(links);
              var pLinks = [];
              for (var i = 0, item; item = mLinks[i]; i++) {
                pLinks.push({ext: item.format, subname: item.quality, url: item.href});
              }
              video.frameLinksShow(pLinks, links.title, panel);
            }]
          })
        ]
      });

      mono.off(document, 'mouseenter', video.onFramePlayerOver, true);
      mono.off(document, 'mouseleave', video.onFramePlayerOver, true);
      mono.on(document, 'mouseenter', video.onFramePlayerOver, true);
      mono.on(document, 'mouseleave', video.onFramePlayerOver, true);

      container.parentNode.insertBefore(panel, container);
      container.parentNode.insertBefore(box, container);

      var n = 3;
      var waitPanelChange = setInterval(function() {
        n--;
        if (n < 0) {
          return clearInterval(waitPanelChange);
        }
        if (!document.body.contains(panel)) {
          container.parentNode.insertBefore(panel, container);
          container.parentNode.insertBefore(box, container);
          clearInterval(waitPanelChange);
        }
      }, 500);
    },

    addFrameBtn: function() {
      var layer = document.getElementById('page_wrap');
      if (!layer) return;

      if (video.lastWaitChange !== undefined) {
        video.lastWaitChange.abort();
      }
      video.lastWaitChange = video.waitChange(function onCheck(cb) {
        if (!document.body.contains(layer)) {
          layer = document.getElementById('page_wrap');
          if (!layer) {
            return cb();
          }
        }
        var player = layer.querySelector('#video_player');
        if (!player || player.tagName === 'DIV') {
          player = layer.querySelector('#html5_player') || layer.querySelector('#flash_video_obj');
        }
        if (!player) {
          player = layer.querySelector('#playerObj') || layer.querySelector('#player');
          if (player && player.tagName === 'OBJECT' && !player.querySelector('param[name="flashvars"]')) {
            player = undefined;
          }
        }

        cb(player);
      }, function onReady(playerNode) {
        video.getLinksFromPlayer(layer, playerNode, video.appendFrameBtn);
      });
    }
  };

  var videoFeed = {
    linkDataAttr: 'savefromHasBtn',
    lastLink: undefined,
    currentMenu: undefined,
    currentId: undefined,
    getLinkAsAjax: function(link, cb, moduleName) {
      var onClick = link.getAttribute('onclick') || '';
      var videoData = onClick.match(/showVideo\(['"]{1}([^'"]+)['"]{1},.?['"]{1}([^'"]+)['"]{1},.*\)/);
      if (!videoData) {
        return cb();
      }
      mono.ajax({
        localXHR: 1,
        type: 'POST',
        url: document.location.protocol + '//' + domain + '/al_video.php',
        data: {
          list: videoData[2],
          video: videoData[1],
          act: 'show',
          module: moduleName,
          al: 1
        },
        success: function(pageData) {
          if(!pageData) {
            return cb();
          }

          var frameSrc = pageData.match(/<iframe[^>]+src=['"]{1}([^'">]+)['"]{1}[^>]+>/i);
          if (!frameSrc) {
            // search dailymotion
            frameSrc = pageData.match(/var\s+opts\s+=\s+({[^}]*})/im);
            if (frameSrc) {
              frameSrc = frameSrc[1].match(/url:\s+['"]{1}([^'"]+)['"]{1}/i);
              if (frameSrc && frameSrc[1].indexOf('//') !== 0 && frameSrc[1].indexOf('http') !== 0) {
                frameSrc = null;
              }
            }
          }
          if (!frameSrc) {
            try {
              mono.sendMessage({action: 'getVkLinksFromData', data: pageData}, function(response) {
                return cb(response, 'vk');
              });
            } catch (e) {
              cb({}, 'vk');
            }
            return;
          }
          if (!frameSrc) {
            return cb();
          }
          var url = frameSrc[1];
          if (preference.showUmmyItem && video.isRutubeLink(url)) {
            return cb(video.getRutubeLinks(url));
          }
          if (url.indexOf('//') === 0) {
            url = 'http:' + url;
          }
          if (url.indexOf('http') !== 0) {
            return cb();
          }

          var data = SaveFrom_Utils.embedDownloader.checkUrl(url);
          if(!data) {
            return cb();
          }

          var request = {
            action: data.action,
            extVideoId: data.extVideoId
          };

          mono.sendMessage(request, function(response) {
            var hosting = data.hosting;

            if (response.action !== request.action) {
              hosting = SaveFrom_Utils.embedDownloader.reMapHosting(response.action);
            }

            return cb(response, hosting);
          });
        },
        error: function() {
          cb();
        }
      })
    },
    addDownloadBtn: function(link) {
      var btn_container = document.createElement('span');
      btn_container.classList.add('sf-video-feed-container');
      btn_container.addEventListener('click', function(e) {
        e.stopPropagation();
      }, false);
      var dl_link = document.createElement('a');
      var url = link.href;
      dl_link.href = 'http://savefrom.net/?url=' + encodeURIComponent(url);
      dl_link.setAttribute(SaveFrom_Utils.embedDownloader.dataAttr, url);
      dl_link.addEventListener('click', function(e) {
        var _this = this;
        e.preventDefault();
        // e.stopPropagation();

        var parentEl = document.querySelector('#wk_box');
        if (!parentEl || !parentEl.contains(this)) {
          parentEl = null;
        }
        var args = {
          parent: parentEl
        };

        var url = this.getAttribute(SaveFrom_Utils.embedDownloader.dataAttr);
        var data = SaveFrom_Utils.embedDownloader.checkUrl(url);
        if(!data) {
          videoFeed.currentId = undefined;
          videoFeed.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(dl_link, language.noLinksFound, 'sf-popupMenu', args);
          return;
        }

        var request = {
          action: data.action,
          extVideoId: data.extVideoId
        };


        var uId = data.action+'_'+data.extVideoId;
        videoFeed.currentId = uId;

        videoFeed.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(dl_link, language.download + ' ...', 'sf-popupMenu', args);

        /* alt video get!
        videoFeed.getLinkAsAjax(SaveFrom_Utils.getParentByTagName(_this.parentNode, 'A'), function(response, hosting) {
          if (videoFeed.currentId !== uId) {
            return;
          }
          if (response && response.links) {
            var links = SaveFrom_Utils.popupMenu.prepareLinks[hosting](response.links, response.title);
            videoFeed.currentMenu.update(links);
            return;
          }
          videoFeed.currentMenu.update(language.noLinksFound);
        });
        return;
        */

        var onResponse = function(response) {
          if (videoFeed.currentId !== uId) {
            return;
          }

          var hosting = data.hosting;

          if(response.action != request.action)
          {
            hosting = SaveFrom_Utils.embedDownloader.reMapHosting(response.action);
          }

          if (Array.isArray(response.links) && response.links.length === 0) {
            response.links = undefined;
          }
          if(response.links) {
            var links = SaveFrom_Utils.popupMenu.prepareLinks[hosting](response.links, response.title);
            videoFeed.currentMenu.update(links);
          } else {
            photo.getModuleName(videoFeed.getLinkAsAjax.bind(null, SaveFrom_Utils.getParentByTagName(_this.parentNode, 'A'), function(response, hosting) {
              if (videoFeed.currentId !== uId) {
                return;
              }
              if (response && response.links) {
                var links;
                if (response.isUmmy) {
                  links = response.links;
                } else {
                  links = SaveFrom_Utils.popupMenu.prepareLinks[hosting](response.links, response.title);
                }
                videoFeed.currentMenu.update(links);
                return;
              }
              videoFeed.currentMenu.update(language.noLinksFound);
            }));
          }
        };

        try {
          mono.sendMessage(request, onResponse);
        } catch (e) {
          onResponse({});
        }

        if ([1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'video-feed-arrow'});
        }
      }, false);

      SaveFrom_Utils.setStyle(dl_link, {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        marginLeft: '5px',
        backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#78A2CC')+')',
        backgroundRepeat: 'no-repeat',
        marginBottom: '-4px'
      });

      btn_container.appendChild(dl_link);
      var postVideoTitle = link.querySelector('.post_video_title');
      if (postVideoTitle) {
        postVideoTitle.appendChild(btn_container);
      } else {
        link.appendChild(btn_container);
      }
    },
    onLinkHover: function(event)
    {
      var link = event.target;
      if(link.tagName !== 'A') {
        link = link.parentNode;
      }
      if(link === null || link.tagName !== 'A') {
        return;
      }

      var href = link.href || '';
      var id = link.id;
      if (id.indexOf('post_media_lnk') !== 0 || href.indexOf('/video') === -1 ) {
        return;
      }

      if (videoFeed.lastLink === link) {
        return;
      }
      videoFeed.lastLink = link;
      if (videoFeed.currentMenu) {
        videoFeed.currentMenu.hide();
      }

      var hasBtn = link.dataset[videoFeed.linkDataAttr];
      if (hasBtn) {
        return;
      }


      link.dataset[videoFeed.linkDataAttr] = 1;

      videoFeed.addDownloadBtn(link);
    },
    run: function() {
      mono.off(document, 'mouseenter', this.onLinkHover, true);
      mono.on(document, 'mouseenter', this.onLinkHover, true);
    },
    off: function() {
      mono.off(document, 'mouseenter', this.onLinkHover, true);
      var btnList = document.querySelectorAll('.sf-video-feed-container');
      for (var i = 0, item; item = btnList[i]; i++) {
        item.parentNode.removeChild(item);
      }
      var dataAttr = mono.dataAttr2Selector(videoFeed.linkDataAttr);
      var dataAttrList = document.querySelectorAll('*['+dataAttr+']');
      for (i = 0, item; item = dataAttrList[i]; i++) {
        item.removeAttribute(dataAttr);
      }
    }
  };

  //  /VIDEO
  ///////////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////////
  //  PHOTO

  var photo = {
    photoCache: {},
    albumCache: {},
    offsetStep: 10,
    getAlbumId: function(url) {
      if(url.search(/(\?|&|#)act=edit/i) > -1) {
        return;
      }

      var pos = url.indexOf('%2');
      if (pos !== -1) {
        url = decodeURIComponent(url.substr(pos));
      }

      if(url.search(/(?:\/|=)(?:albums?|tag|photos)-?\d+(?:_\d+)?/i) == -1) {
        return;
      }

      var id = url.match(/#\/(albums?|tag|photos)(-?\d+)(?:_(\d+))?/i);
      if(!id || id.length == 0) {
        id = url.match(/(?:\/|=)(albums?|tag|photos)(-?\d+)(?:_(\d+))?/i);
      }

      if(!id || id.length < 3) {
        return;
      }

      var aid = undefined;

      if(id[3]) {
        aid = 'album' + id[2] + '_' + id[3];
      } else {
        if(id[1] == 'albums') {
          id[1] = 'photos';
        }

        aid = id[1] + id[2];
      }

      return aid;
    },
    getLinksFromJson: function(list, onSuccess) {
      var src = ['w_src', 'z_src', 'y_src', 'x_src'];
      var links = {};
      var title = this.getTitle === true ? undefined : null;
      for (var n = 0, item; item = list[n]; n++) {
        if (!item.id) {
          continue;
        }
        if (title === undefined && item.album) {
          title = mono.fileName.decodeSpecialChars(mono.decodeUnicodeEscapeSequence(item.album.replace(/<[^>]+>/g, '')));
        }
        for (var i = 0, type; type = src[i]; i++) {
          if (item[type] === undefined) {
            continue;
          }
          links[item.id] = this.photoCache[item.id] = item[type];
          break;
        }
      }
      onSuccess(links, title);
    },
    getLinksViaAPI: function(post, onSuccess, onError, reSend) {
      if (reSend === undefined) {
        reSend = 0;
      }
      var _this = this;
      var url = document.location.protocol + '//' + domain + '/al_photos.php';
      var onXhrError = function() {
        if (reSend > 2) {
          return onError();
        }
        setTimeout(function() {
          _this.getLinksViaAPI(post, onSuccess, onError, ++reSend);
        }, 250);
      };
      mono.ajax({
        type: 'POST',
        url: url,
        data: post,
        localXHR: true,
        timeout: 5000,
        success: function(data) {
          if (!data) {
            return onError();
          }

          var count = undefined;
          data = data.split('<!>');
          for (var n = 0, len = data.length; n < len; n++) {
            var str = data[n];
            if (count === undefined && str.indexOf('<!int>') === 0) {
              count = parseInt(str.substr(6));
              continue;
            }
            if (str.indexOf('<!json>') !== 0) {
              continue;
            }
            try {
              var list = JSON.parse(str.substr(7));
            } catch (e) {
              return onError();
            }
            if (!Array.isArray(list)) {
              continue;
            }
            return _this.getLinksFromJson.call(_this, list, onSuccess.bind(_this, count));
          }
          onError();
        },
        error: onXhrError,
        onTimeout: onXhrError
      });
    },
    getAlbumLinks: function(id, onProgress, cb) {
      var _this = mono.extend({getTitle: true}, this);
      var title = undefined;
      var url = location.href;
      if (url.indexOf('albums') !== -1 || url.indexOf('tags') !== -1 || url.indexOf('photos') !== -1) {
        title = null;
        _this.getTitle = false;
      }
      var post = 'act=show&al=1&list=' + id + '&offset={offset}';
      var offset = 0;
      var linkList = {};
      var summ = 0;
      var inProgress = 0;
      var count = 0;
      var abort = false;
      var nextStep = function() {
        if (abort) {
          return;
        }
        inProgress++;
        _this.getLinksViaAPI(post.replace('{offset}', offset), function onSuccess(fullCount, links, aTitle) {
          if (title === undefined && aTitle) {
            title = aTitle;
            _this.getTitle = false;
          }
          if (count < fullCount) {
            count = fullCount;
          }
          var newLinks = 0;
          for (var item in links) {
            if (linkList[item] !== undefined) {
              continue;
            }
            linkList[item] = links[item];
            newLinks++;
            summ++;
          }
          onProgress(summ, count);
          inProgress--;
          if (newLinks === 0) {
            if (inProgress === 0) {
              if (count === fullCount) {
                _this.albumCache[id] = {links: linkList, title: title};
              }
              if (!title) {
                title = getFolderName();
              }
              cb(linkList, title);
            }
            return;
          }
          nextStep();
        }, function onError() {
          inProgress--;

          if (inProgress === 0) {
            return cb(linkList, title);
          }
        });
        offset += _this.offsetStep;
      };
      nextStep();
      nextStep();
      return {
        abort: function() {
          abort = true;
        }
      }
    },
    getModuleName: function(cb) {
      var dataArg = 'sfModule';
      var script = mono.create('script', {
        text: '('+function() {
          if (window.cur && window.cur.module && typeof(window.cur.module) === 'string') {
            document.body.dataset['{dataArg}'] = window.cur.module;
          }
        }.toString().replace('{dataArg}', dataArg) +')();'
      });
      document.body.appendChild(script);
      setTimeout(function() {
        script.parentNode.removeChild(script);
        cb(document.body.dataset[dataArg]);
      });
    },
    getFullSizeSrc: function(list, count, onProgress, cb) {
      var _this = this;
      var abort = false;
      this.getModuleName(function(curModule) {
        var post = 'act=show&al=1&list={list}&module=' + curModule + '&photo={id}';
        var index = 0;
        var inProgress = 0;
        var linkList = {};
        var summ = 0;

        var keyList = (function() {
          var keyList = [];
          for (var key in list) {
            keyList.push(key);
          }
          return keyList;
        })();

        var nextStep = function() {
          if (abort) {
            return;
          }

          var photoId = keyList[index];
          var listItem = list[photoId];
          if (listItem === undefined) {
            if (inProgress === 0) {
              cb(linkList);
            }
            return;
          }

          inProgress++;

          if (_this.photoCache[photoId] !== undefined) {
            linkList[photoId] = _this.photoCache[photoId];
            summ++;
            onProgress(summ, count);
            index++;
            nextStep();
            inProgress--;
            return;
          }

          index++;

          var _post = post.replace('{list}', listItem.list).replace('{id}', photoId);
          _this.getLinksViaAPI(_post, function onSuccess(_count, links) {
            var link = links[photoId];
            if (!link) {
              link = listItem.src;
            }

            linkList[photoId] = link;

            summ++;
            onProgress(summ, count);

            inProgress--;
            nextStep();
          }, function onError() {
            linkList[photoId] = listItem.src;

            summ++;
            onProgress(summ, count);

            inProgress--;
            nextStep();
          });
        };
        nextStep();
        nextStep();
      });
      return {
        abort: function() {
          abort = true;
        }
      }
    },
    getWallPostContent: function() {
      var url = location.href;
      var pos = url.indexOf('%2Fwall');
      if (pos === -1) {
        return;
      }
      url = 'w='+decodeURIComponent(url.substr(pos+3));
      var urlObj = mono.parseUrlParams(url, {
        argsOnly: 1,
        forceSep: '&'
      });
      if (!urlObj.w) {
        return;
      }
      var id = 'post' + urlObj.w.substr(4);
      return document.getElementById(id) || undefined;
    },
    findLinks: function(container, onProgress, cb, force) {
      var links = container.querySelectorAll('a[onclick]');
      var linkList = {};
      var count = 0;
      for (var i = 0, el; el = links[i]; i++) {
        var onclick = el.getAttribute('onclick');
        if (onclick.search(/showPhoto\s*\(/i) === -1) {
          continue;
        }
        var photoId = '', listId = '';
        var params = onclick.match(/showPhoto\s*\(\s*[\"']([-\d_]+)[\"']\s*,\s*[\"']([\w\-]+)[\"']/i);
        if(params && params.length > 2) {
          photoId = params[1];
          listId = params[2];
        }
        if(photoId && listId) {
          var json = onclick.match(/\{[\"']?temp[\"']?\s*:\s*(\{.+?\})/i);
          if(json) {
            json = json[1].replace(/(\{|,)\s*(\w+)\s*:/ig, '$1"$2":');
            var src = undefined;
            try {
              json = JSON.parse(json);
              if(!json.base) {
                json.base = '';
              }
              var typeList = ['w_', 'z_', 'y_', 'x_'];
              for (var n = 0, type; type = typeList[n]; n++) {
                if (!json[type]) {
                  continue;
                }
                if(typeof json[type] == 'object') {
                  src = json.base + json[type][0] + '.jpg';
                } else {
                  src = json.base + json[type] + '.jpg';
                }
                break;
              }
            } catch(err){}

            if(src && linkList[photoId] === undefined) {
              linkList[photoId] = {src: src, list: listId};
              count++;
            }
          }
        }
      }
      if (count === 0 && container !== document && force === undefined) {
        var postContainer = this.getWallPostContent();
        if (postContainer === undefined) {
          return cb(undefined);
        }
        return this.findLinks(postContainer, onProgress, cb, 1);
      }
      if (count === 0) {
        return cb(undefined);
      }
      onProgress(0, count);
      return this.getFullSizeSrc(linkList, count, onProgress, cb);
    },
    getPopup: function(title, type, onClose) {
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();
      var progressEl;

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: title,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          progressEl = mono.create('p', {
            text: '',
            style: {
              color: '#868686',
              fontSize: '14px',
              lineHeight: '24px'
            }
          })
        ]
      });

      var popupEl = SaveFrom_Utils.popupDiv(template.body, 'sf_progress_popup', undefined, undefined, onClose);

      var setState = function(state) {
        if (setState.state === state) {
          return;
        }
        setState.state = state;

        template.buttonContainer.style.display = 'none';
        progressEl.style.display = 'none';
        mono.sendMessage({action: 'getWarningIcon', type: type, color: '#77D1FA'}, function(icon) {
          template.icon.style.backgroundImage = 'url('+icon+')';
        });
        if (state === 'progress') {
          progressEl.style.display = 'block';
        }
        if (state === 'error') {
          mono.sendMessage({action: 'getWarningIcon', type: type, color: '#AAAAAA'}, function(icon) {
            template.icon.style.backgroundImage = 'url('+icon+')';
          });
          progressEl.style.display = 'block';
        }
      };

      return {
        onPrepare: function(text) {
          setState('progress');
          progressEl.textContent = text;
        },
        onProgress: function(count, max) {
          progressEl.textContent = language.vkFoundFiles.replace('%d', count) + ' ' + language.vkFoundOf + ' ' + max;
        },
        onReady: function() {
          mono.trigger(popupEl, 'kill');
        },
        onError: function(text) {
          setState('error');
          progressEl.textContent = text;
        }
      }
    },
    getLayer: function() {
      var layer = document.getElementById('layer_wrap');
      if (layer === null || layer.style.display === "none" || layer.textContent.length === 0) {
        layer = null;
      }
      if (layer === null) {
        layer = document.getElementById('wk_layer_wrap');
        if (layer === null || layer.style.display === "none" || layer.textContent.length === 0) {
          layer = null;
        }
      }
      return layer;
    },
    getLinks: function(container, id) {
      var _this = this;
      var process = undefined;
      var popup = this.getPopup(getFolderName(), 'photo', function onClose() {
        if (process) {
          process.abort();
        }
      });
      var _cb = function(linkList, title) {
        if (!linkList) {
          linkList = {};
        }
        var links = [];
        for (var item in linkList) {
          var filename = SaveFrom_Utils.getMatchFirst(linkList[item], /\/([\w\-]+\.[a-z0-9]{3,4})(?:\?|$)/i);
          if (!filename) {
            continue;
          }
          links.push({
            filename: filename,
            url: linkList[item]
          });
        }
        if (links.length === 0) {
          popup.onError(language.noLinksFound);
          return;
        }
        popup.onReady();

        title = title || getFolderName();
        if (!allowDownloadMode) {
          return _this.showListOfLinks(title, links, true);
        }
        SaveFrom_Utils.downloadList.showBeforeDownloadPopup(links, {
          count: links.length,
          folderName: title,
          type: 'photo',
          onShowList: function() {
            // show list on links
            _this.showListOfLinks(title, links, true);
          }
        });
      };
      popup.onPrepare(language.download+' ...');
      if (id !== undefined) {
        if (this.albumCache[id] !== undefined) {
          _cb(this.albumCache[id].links, this.albumCache[id].title || getFolderName());
          return;
        }
        process = this.getAlbumLinks(id, popup.onProgress, _cb);
        return;
      }

      if (!container || container === document) {
        container = this.getLayer();
      }

      process = this.findLinks(container || document, popup.onProgress, _cb);
    },
    rmPhotoAlbumDlBtn: function() {
      var dlAlbumBtn = document.querySelectorAll(['.sf-dl-ablum-btn-divide','.sf-dl-ablum-btn']);
      for (var i = 0, item; item = dlAlbumBtn[i]; i++) {
        item.parentNode.removeChild(item);
      }
    },
    addPhotoAlbumDlBtn: function(container, id) {
      var _this = this;
      var body = container.previousElementSibling;
      if (!body.classList.contains('summary_wrap')) {
        return;
      }

      body = body.querySelector('.summary');

      if (!body) {
        return;
      }

      if (body.querySelector('.sf-dl-ablum-btn') !== null) {
        return;
      }

      var btnCnt = mono.create('span', {
        append: mono.create('a', {
          text: language.vkDownloadPhotoAlbum,
          href: '#',
          style: {
            fontWeight: 'bolder'
          },
          class: 'sf-dl-ablum-btn',
          on: ['click', function(e) {
            e.preventDefault();

            _this.getLinks.call(_this, container, id);

            if ([1].indexOf(preference.cohortIndex) !== -1) {
              mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'photo-albom'});
            }
          }]
        })
      });

      body.appendChild(
        mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('span', {
              class: 'divide sf-dl-ablum-btn-divide',
              text: '|'
            }),
            btnCnt
          ]
        })
      );

      body = null;
      btnCnt = null;
    },
    getContainer: function() {
      var container = document.getElementById('photos_albums_container');
      if(!container) {
        container = document.getElementById('photos_container');
      }

      return container;
    },
    getFilenameFromUrl: function(url) {
      return SaveFrom_Utils.getMatchFirst(url, /\/([\w\-]+\.[a-z0-9]{3,4})(?:\?|$)/i);
    },
    rmCurrentPhotoBtn: function(insertContainer) {
      if (this.photoMenu !== undefined) {
        this.photoMenu.hide();
      }
      var exBtn = undefined;
      var imgList = document.querySelectorAll('.sf-dl-current-photo-btn');
      for (var i = 0, imgItem; imgItem = imgList[i]; i++) {
        if (!insertContainer || !insertContainer.contains(imgItem)) {
          imgItem.parentNode.removeChild(imgItem);
        } else {
          exBtn = imgItem;
        }
      }
      return exBtn;
    },
    getCurrentPhotoOrigLinkEl: function(container) {
      return container.querySelector('#pv_open_original');
    },
    addDlCurrentPhotoBtn: function(container) {
      var insertContainer = container.parentNode;
      var exBtn = this.rmCurrentPhotoBtn(insertContainer);
      if (exBtn) {
        return;
      }

      var _this = this;
      insertContainer.appendChild(mono.create('a', {
        class: 'sf-dl-current-photo-btn',
        href: '#',
        title: language.download,
        on: ['click', function(e) {
          e.stopPropagation();
          e.preventDefault();

          var menu = _this.photoMenu = SaveFrom_Utils.popupMenu.quickInsert(this, language.download + ' ...', "photoDlMenu", {
            parent: insertContainer
          });

          var link = _this.getCurrentPhotoOrigLinkEl(_this.getLayer());
          if (!link || !(link = link.href)) {
            return menu.update(language.noLinksFound);
          }

          var photoFileName = mono.fileName.modify(_this.getFilenameFromUrl(link));
          var dotPos = photoFileName.lastIndexOf('.');
          var photoExt = photoFileName.substr(dotPos+1);
          var photoTitle = photoFileName.substr(0, dotPos);
          menu.update([
            { href: '#getAlbum', title: '', quality: language.vkDownloadPhotoAlbum, format: ' ', ext: '', noSize: true,
              func: function(e){
                e.preventDefault();

                photo.downloadPhoto();
                menu.hide();
              }
            }, {
              href: link, title: photoTitle, quality: language.download,
              format: ' ', ext: photoExt, forceDownload: true,
              isBank: true, func: function() {
                menu.hide();
              }
            }
          ]);
        }]
      }));

      if (photo.dlCurrentBtnStyle !== undefined) {
        return;
      }
      photo.dlCurrentBtnStyle = mono.create('style', {
        text: "div > .sf-dl-current-photo-btn {" +
        'display: none;' +
        'border: 1px solid #F8F8F8;' +
        'width: 20px;' +
        'height: 20px;' +
        'padding: 0;' +
        'position: absolute;' +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#777777')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        'top: 20px;' +
        'left: 30px;' +
        'cursor: pointer;' +
        "}" +
        "div > .sf-dl-current-photo-btn:hover {" +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#00B75A')+') center no-repeat #F8F8F8;' +
        'background-size: 12px;' +
        "}" +
        "div > .sf-dl-current-photo-btn:active {" +
        "outline: 0;" +
        "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
        "}" +
        "div:hover > .sf-dl-current-photo-btn {display: block;}"
      });
      document.body.appendChild(photo.dlCurrentBtnStyle);
    },
    currentPhotoAddBtn: function(container) {
      if (!container) {
        return;
      }
      var pvPhoto = container.querySelector('#pv_photo');
      if (!pvPhoto) {
        return;
      }
      var _this = this;
      var onSelectorFound = function(pvPhoto, pvOpenOriginal) {
        if (!pvOpenOriginal) {
          _this.rmCurrentPhotoBtn();
          return;
        }
        var originalLink = pvOpenOriginal.href;
        if (!originalLink) {
          _this.rmCurrentPhotoBtn();
          return;
        }
        _this.addDlCurrentPhotoBtn(pvPhoto);
      };
      var n = 0;
      var wait = function() {
        n++;
        setTimeout(function() {
          var pvOpenOriginal = _this.getCurrentPhotoOrigLinkEl(container);
          if (pvOpenOriginal || n > 9) {
            return onSelectorFound(pvPhoto, pvOpenOriginal);
          }
          wait();
        }, 300);
      };
      wait();
    },
    showLinks: function() {
      var albumId = this.getAlbumId(window.location.href);

      if (!mono.isSafari && !mono.isOpera) {
        this.currentPhotoAddBtn(this.getLayer());
      }

      if (!albumId) {
        return;
      }

      var container = this.getContainer();
      if (!container) {
        return;
      }

      this.addPhotoAlbumDlBtn(container, albumId);
    },
    downloadPhoto: function() {
      var container = this.getContainer();
      var id = this.getAlbumId(window.location.href);
      if (!id) {
        var link = document.querySelector('#pv_album_name a');
        if (link) {
          id = this.getAlbumId(link.href);
        }
      }
      this.getLinks(container, id);

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'vk', event: 'click', label: 'photo-menu'});
      }
    },
    showListOfPhotos: function(title, links) {
      title = title.replace(/[<>]+/g, '_');
      var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style type="text/css">' +
        'a,img{display:block;margin-bottom:5px;}' +
        '</style></head><body>' + title +
        '<p style="width:640px">' +
        language.vkListOfPhotosInstruction +
        '</p><br><br>';

      for (var i = 0, item; item = links[i]; i++) {
        var src = item.url;
        var fileName = item.filename;
        if(fileName) {
          html += '<a href="' + src + '" download="' + fileName + '">' +
            '<img src="' + src + '" alt="photo"></a>';
        } else {
          html += '<img src="' + src + '" alt="photo">';
        }
      }

      html += '</body></html>';

      var url = 'data:text/html;charset=utf-8;base64,' +
        encodeURIComponent(btoa(SaveFrom_Utils.utf8Encode(html)));

      window.open(url, '_blank');
    },
    showListOfLinks: function(title, links, showListOfPhotosLink) {
      var listOfPhotoLink;
      if (showListOfPhotosLink) {
        listOfPhotoLink = mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('p', {
              append: [
                mono.create('a', {
                  text: language.vkListOfPhotos,
                  href: '#',
                  class: 'sf__hidden',
                  style: {
                    fontWeight: 'bolder',
                    border: 'none',
                    textDecoration: 'underline'
                  },
                  on: ['click', function(e) {
                    e.preventDefault();
                    photo.showListOfPhotos(title, links);
                  }]
                })
              ]
            })
          ]
        });
      } else {
        listOfPhotoLink = '';
      }

      var textareaText = '';
      for (var i = 0, item; item = links[i]; i++) {
        textareaText += item.url + '\r\n';
      }

      var container = mono.create(document.createDocumentFragment(), {
        append: [
          mono.create('p', {
            text: title,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '5px'
            }
          }),
          mono.create('p', {
            append: mono.parseTemplate(language.vkListOfLinksInstruction)
          }),
          listOfPhotoLink,

          mono.create('textarea', {
            text: textareaText,
            cols: 60,
            rows: 10,
            style: {
              width: '100%'
            }
          }),
          (!mono.isChrome && !mono.isFF)? undefined : mono.create('button', {
            text: language.copy,
            style: {
              height: '27px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              marginTop: '6px',
              paddingLeft: '10px',
              paddingRight: '10px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer',
              cssFloat: 'right'
            },
            on: ['click', function(e) {
              var _this = this;
              _this.disabled = true;
              mono.sendMessage({action: 'addToClipboard', text: textareaText});
              setTimeout(function() {
                _this.disabled = false;
              }, 1000);
            }],
            append: mono.create('style', {
              text: '#savefrom_popup_box button:hover:not(:disabled){' +
              'background-color: #597A9E !important;' +
              'border-color: #597A9E !important;' +
              'color: #fff;' +
              '}' +
              '#savefrom_popup_box button:active{' +
              'opacity: 0.9;' +
              '}'
            })
          })
        ]
      });

      SaveFrom_Utils.popupDiv(container);
    }
  };

  //  /PHOTO
  ///////////////////////////////////////////////////////////////////

  // do...

  var mVk = {
    observer: null,
    styleEl: null,
    run: function() {
      "use strict";
      if (!this.observer) {
        this.onMutationDeb = mono.debounce(this.onMutation.bind(this), 250);

        this.observer = new MutationObserver(function() {
          this.onMutationDeb();
        }.bind(this));
        this.observer.observe(document.body, {childList: true, subtree: true});

        this.insertStyle();
      }
      
      this.onMutationDeb();
    },
    onMutationDeb: null,
    onMutation: function() {
      "use strict";
      this.findMusic();
      this.findVideo();
    },
    insertStyle: function() {
      "use strict";
      if (this.styleEl) {
        var parentNode = this.styleEl.parentNode;
        parentNode && parentNode.removeChild(this.styleEl);
        parentNode = null;
        this.styleEl = null;
      }

      var audioBtnClassName = '.' + downloadLinkClassName + '.sf-audio';
      this.styleEl = mono.create('style', {
        text: audioBtnClassName + '{' +
        'display: block;' +
        'float: right;' +
        'border-radius: 3px;' +
        'width: 22px;' +
        'height: 22px;' +
        'margin-top: 1px;' +
        'margin-left: 3px;' +
        'margin-right: 3px;' +
        'background: url('+SaveFrom_Utils.svg.getSrc('download', '#ffffff')+') center no-repeat;' +
        'background-size: 12px;' +
        'background-color: #5E80AA;' +
        '}'
      });
      document.body.appendChild(this.styleEl);
    },
    onAudioBtnClick: function(e) {
      "use strict";
      e.stopPropagation();

      SaveFrom_Utils.downloadOnClick(e, null, {
        useFrame: true
      });
    },
    getAudioDlBtnNode: function(url) {
      "use strict";
      return mono.create('a', {
        class: [downloadLinkClassName, 'sf-audio'],
        href: url,
        target: '_blank',
        on: ['click', this.onAudioBtnClick]
      });
    },
    insertAudioBtn: function(node) {
      "use strict";
      if (node.dataset.hasSfBtn === '1') {
        return;
      }
      node.dataset.hasSfBtn = '1';

      var url = node.querySelector('input');
      url = url && url.value;
      if (!url) {
        return;
      }
      var pos = url.indexOf('?');
      if (pos !== -1) {
        url = url.substr(0, pos);
      }

      var aiDur = node.querySelector('.ai_dur');
      var nextEl = aiDur && aiDur.nextElementSibling;
      nextEl && aiDur.parentNode.insertBefore(this.getAudioDlBtnNode(url), nextEl);
    },
    findMusic: function() {
      "use strict";
      var i, node;

      var audioItemList = document.body.querySelectorAll('.audio_item:not([data-has-sf-btn])');
      for (i = 0, node; node = audioItemList[i]; i++) {
        this.insertAudioBtn(node);
      }
    },
    onVideoBtnClick: function(links, e) {
      "use strict";
      e.preventDefault();
      e.stopPropagation();

      var lightBox = SaveFrom_Utils.mobileLightBox.show(language.download + ' ...');

      var mLinks;
      if (links.request) {
        var onResponse = function(response) {
          if (response && links.request.action === 'getPladformVideo') {
            mLinks = video.prepareLinks(video.preparePladformLinks(response));

            lightBox.update(mLinks);
            return;
          }
          if(!response || !response.links) {
            return lightBox.update(language.noLinksFound);
          }
          mLinks = SaveFrom_Utils.popupMenu.prepareLinks[links.request.hosting](response.links, response.title);
          lightBox.update(mLinks);
        };
        try {
          mono.sendMessage(links.request, onResponse);
        } catch (e) {
          onResponse();
        }
        return;
      }

      mLinks = video.prepareLinks(links);
      lightBox.update(mLinks);
    },
    appendVideoBtn: function(links, layer) {
      "use strict";
      var container = layer.querySelector('.mv_actions');
      container && container.appendChild(mono.create('li', {
        class: [downloadLinkClassName, 'sf-video-ctr'],
        append: mono.create('a', {
          class: [downloadLinkClassName, 'mva_item'],
          text: language.download,
          on: ['click', this.onVideoBtnClick.bind(this, links)]
        })
      }));
    },
    insertVideoBtn: function(node) {
      "use strict";
      if (node.dataset.hasSfBtn === '1') {
        return;
      }
      node.dataset.hasSfBtn = '1';

      var firstChild = node.querySelectorAll('iframe, video, a')[0];
      if (!firstChild || ['VIDEO', 'IFRAME', 'A'].indexOf(firstChild.tagName) === -1) {
        return;
      }

      video.getLinksFromPlayer(SaveFrom_Utils.getParentByClass(node, 'video_view'), firstChild, this.appendVideoBtn.bind(this));
    },
    findVideo: function() {
      "use strict";
      var i, node;

      var audioItemList = document.body.querySelectorAll('.video_view .vv_body:not([data-has-sf-btn])');
      for (i = 0, node; node = audioItemList[i]; i++) {
        this.insertVideoBtn(node);
      }
    }
  };

  init();
});

(typeof mono === 'undefined') && (mono = {onReady: function() {this.onReadyStack.push(arguments);},onReadyStack: []});

mono.onReady('youtube', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://youtube.com/*',
      'http://*.youtube.com/*',
      'https://youtube.com/*',
      'https://*.youtube.com/*'
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var allowDownloadMode = 0;
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return youtube.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        var vId = youtube.getIdFromLocation();
        if (vId) {
          getPlayerConfig(function(config) {
            if (config && config.args && config.args.video_id === vId) {
              var oldBtn = document.getElementById(youtube.buttonId);
              if (oldBtn !== null) {
                oldBtn.parentNode.removeChild(oldBtn);
              }

              ytUmmyBtn.rmBtn();

              youtube.responseCache = {};
              youtube.video_id = config.args.video_id;
              var container = document.getElementById('watch7-subscription-container');
              youtube.appendDownloadButton(container);
            }
          });
        }
      }
      if (message.action === 'downloadPlaylist') {
        youtube.downloadPlaylist();
      }
    });

    allowDownloadMode = mono.isChrome || mono.isFF || (mono.isGM && mono.isTM);

    mono.initGlobal(function(response) {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.moduleYoutube) {
        return;
      }
      youtube.run();
    });
  };

  var iframe = mono.isIframe();

  var youtube = {
    swfargs: null,
    token: '',
    video_id: '',
    sts: '',
    needDecipher: false,
    newInterface: false,

    panelId: 'savefrom__yt_links',
    buttonId: 'savefrom__yt_btn',
    panelParent: null,
    panelInsertBefore: null,
    timer: null,

    btnBox: null,
    responseCache: {},
    isMobile: false,

    lastWaitChange: null,

    currentMenu: undefined,

    run: function() {
      moduleState = 1;
      if (iframe) {
        var m = location.href.match(/\/embed\/([\w\-]+)/i);

        if(!m || m.length < 2) {
          iframe = false;
          if (!youtube.getIdFromLocation(location.href)) {
            return;
          }
        }
      }

      if (location.host.indexOf('m.') === 0) {
        youtube.isMobile = true;
        mono.onUrlChange(function(url) {
          SaveFrom_Utils.mobileLightBox.clear();
          var vid = youtube.getIdFromLocation(url);
          if (!vid) {
            youtube.waitBtnContainer.stop();
            return;
          }
          youtube.waitBtnContainer.start(function() {
            return youtube.getMobileContainer();
          }, function(container) {
            youtube.appendMobileButton(vid, container);
          });
        }, 1);
        return;
      }

      if(iframe) {
        youtube.isVideoPage();
        youtube.video_id = youtube.swfargs.video_id;

        youtube.appendIframeButtons();
        return;
      }

      if ([19].indexOf(preference.expIndex) !== -1) {
        youtube.tutorial.show();
      }

      mono.onUrlChange(function(url) {
        youtube.lastWaitChange && youtube.lastWaitChange.abort();
        if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
          youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
        }
        youtube.videoFeed.onUrlUpdate(url);

        var vId = youtube.getIdFromLocation(url);
        if (vId) {
          youtube.lastWaitChange = youtube.waitChange(function onCheck(cb) {
            getPlayerConfig(function(config) {
              if (config && config.args && config.args.video_id === vId) {
                return cb(config);
              }
              cb();
            });
          }, function onDune(config) {
            if (!config) return;

            youtube.video_id = config.args.video_id;

            youtube.lastWaitChange = youtube.waitChange(function onCheck(cb) {
              cb(document.getElementById('watch7-subscription-container'));
            },function onDune(container) {
              if (!container) {
                return;
              }

              var btnVid = youtube.video_id;
              youtube.appendDownloadButton(container);

              youtube.lastWaitChange = youtube.waitChange(function onCheck(cb) {
                if (btnVid !== youtube.video_id) {
                  return cb();
                }
                if (document.contains(container)) {
                  return cb();
                }
                cb(document.getElementById('watch7-subscription-container'));
              }, function onDune(container) {
                if (!container) {
                  return;
                }
                youtube.appendDownloadButton(container);
              }, {
                count: 1,
                timer: 8*1000,
                repeat: 1
              });
            });

          });
        }
      }, 1);
    },

    changeState: function(state) {
      moduleState = state;
      if (iframe || youtube.isMobile) {
        return;
      }
      youtube.lastWaitChange && youtube.lastWaitChange.abort();
      mono.clearUrlChange();
      if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
        youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
      }
      if (youtube.videoFeed.currentMenu !== undefined) {
        youtube.videoFeed.currentMenu.hide();
        youtube.videoFeed.currentMenu = undefined;
      }
      youtube.videoFeed.disable();
      youtube.videoFeed.rmBtn();
      var btn = document.getElementById(youtube.buttonId);
      if (btn) {
        btn.parentNode.removeChild(btn);
      }

      ytUmmyBtn.rmBtn();

      if (state) {
        youtube.run();
      }
    },

    waitChange: function(onCheck, cb, options) {
      "use strict";
      var abort;
      options = options || {
        repeat: 0
      };

      var n = options.count || 12;

      var onCb = function(data) {
        cb.apply(null, arguments);

        if (options.repeat > 0) {
          options.repeat--;
          n = options.count || 12;
          wait();
        }
      };

      var checkFunc = function(data) {
        if (abort) return;

        if (data) {
          return onCb.apply(null, arguments);
        }

        wait();
      };

      var wait = function() {
        n--;
        setTimeout(function() {
          if (abort) return;

          if (n < 0) {
            return onCb();
          }

          onCheck(checkFunc);
        }, options.timer || 500);
      };

      if (!options.skipFirst) {
        onCheck(checkFunc);
      } else {
        wait();
      }

      return {
        abort: function() {
          abort = true;
        }
      }
    },

    waitBtnContainer: {
      count: undefined,
      timer: undefined,
      check: function(getContainer, onReady) {
        var container = getContainer();
        if (container !== null && container.dataset.sfSkip === undefined) {
          if (container.dataset.sfFound !== undefined) {
            container.dataset.sfSkip = 1;
          } else {
            if (container.dataset.sfCondidate === undefined) {
              container.dataset.sfCondidate = 1;
            } else {
              container.dataset.sfFound = 1;
              onReady(container);
              return 1;
            }
          }
        }

        return undefined;
      },
      start: function(getContainer, onReady) {
        var _this = youtube.waitBtnContainer;

        _this.stop();

        if (_this.check(getContainer, onReady) !== undefined) {
          return;
        }

        _this.timer = setInterval(function() {
          _this.count--;
          if (_this.check(getContainer, onReady) !== undefined || _this.count <= 0) {
            clearInterval(_this.timer);
          }
        }, 250);
      },
      stop: function() {
        var _this = youtube.waitBtnContainer;

        clearInterval(_this.timer);
        _this.count = 20;
      }
    },


    getIdFromLocation: function(loc)
    {
      if(!loc)
        loc = document.location.href;

      var m = loc.match(/\/watch\?(?:.+&)?v=([\w\-]+)/i);
      if(m && m.length > 1)
        return m[1];

      return null;
    },


    isVideoPage: function()
    {
      var swfargs = youtube.getSwfArgs();
      if(!swfargs)
        return false;

      youtube.swfargs = swfargs;

      var token = swfargs.t ? swfargs.t : swfargs.token;
      if(!token)
        return false;

      youtube.token = token;

      var video_id = swfargs.video_id;
      if(!video_id)
        video_id = youtube.getIdFromLocation();

      if(!video_id)
        return false;

      youtube.video_id = video_id;

      youtube.sts = SaveFrom_Utils.getMatchFirst(document.body.innerHTML,
      /[\"']sts[\"']\s*:\s*[\"']?(\d+)/i);

      return true;
    },

    getSwfArgs: function()
    {
      var html = document.body.innerHTML;

      var t = html.match(/[\"\'](?:swf_)?args[\"\']\s*:\s*(\{[^\}]+\})/i);
      if(t && t.length > 1)
      {
        if(t[1].search(/:\s*\"[^\"]+\s*\}$/) > -1)
          t[1] = t[1].replace(/\s*\}$/i, '"}');

        try
        {
          return JSON.parse(t[1]);
        }
        catch(err){
          t = html.match(/ytplayer.config\s*=\s*(\{.*?\});?<\/script>/i);
          if(t && t.length > 1) {
            try
            {
              return JSON.parse(t[1]);
            }
            catch(err){}
          }
        }
      }
      else
      {
        t = html.match(/flashvars\s*=\s*\\?[\"']?([^\"']+)/i);
        if(t && t.length > 1)
        {
          t = t[1];
          if(t.indexOf(/&/) == -1)
            t = t.replace(/(?:\\u0026|%26|%2526|&)amp;/ig, '&');

          t = mono.parseUrlParams(t, {
            argsOnly: 1,
            forceSep: '&'
          });
          for(var i in t)
            t[i] = decodeURIComponent(t[i]);

          return t;
        }
      }

      var e = document.getElementsByTagName('embed');
      for(var i = 0; i < e.length; i++)
      {
        var f = e[i].getAttribute('flashvars');
        if(f && f.search(/fmt_map=/i) != -1)
        {
          return mono.parseUrlParams(f, {argsOnly: 1});
        }
      }

      return null;
    },

    getMobileContainer: function() {
      var elList = document.querySelectorAll('a[onclick][href="#"] span[id]');
      var elCount = 0;
      var fEl = undefined;
      for (var i = 0, el; el=elList[i];i++) {
        if (!el.id || el.id.substr(0, 10) !== 'koya_elem_') {
          continue;
        }
        elCount++;
        fEl = el;
      }
      if (elCount < 3) {
        return null;
      }
      var parent = fEl.parentNode.parentNode.parentNode;
      if (parent === null) {
        return null;
      }
      return parent.parentNode;
    },

    appendMobileButton: function(vid, container) {
      container.appendChild(mono.create('div', {
        data: {
          id: vid
        },
        style: {
          display: 'inline-block',
          height: '28px',
          width: '18px',
          marginRight: '20px',
          background: 'url('+SaveFrom_Utils.svg.getSrc('download', '#ADADAD')+') center no-repeat',
          cssFloat: 'right'
        },
        on: ['click', function() {
          var vid = this.dataset.id;

          var response = youtube.responseCache[vid];
          if (response) {
            var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title || youtube.getTitleModify());
            response = null;
            return SaveFrom_Utils.mobileLightBox.show(menuLinks);
          }

          var LightBox = SaveFrom_Utils.mobileLightBox.show(language.download + ' ...');

          mono.sendMessage({
            action: 'getYoutubeLinks',
            extVideoId: vid,
            url: location.href
          }, function(response){
            var menuLinks = undefined;
            if (response.links) {
              youtube.responseCache[vid] = response;
              menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title || youtube.getTitleModify());
            }
            if (!menuLinks) {
              menuLinks = language.noLinksFound;
            }
            LightBox.update(menuLinks);
          });

          LightBox.update(language.download + ' ...');
        }]
      }))
    },

    appendDownloadButton: function(parent) {
      if(document.getElementById(youtube.buttonId)) {
        return;
      }

      // var b = document.createElement('button');
      // b.id = youtube.buttonId;
      var selectBtn = undefined;
      var buttonContainer = mono.create('div', {
        id: youtube.buttonId,
        style: {
          display: 'inline-block',
          marginLeft: '10px',
          verticalAlign: 'middle'
        },
        append: [
          mono.create('a', {
            class: 'sf-quick-dl-btn',
            style: {
              display: 'inline-block',
              fontSize: 'inherit',
              height: '22px',
              border: '1px solid #00B75A',
              borderRadius: '3px',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              paddingRight: '12px',
              paddingLeft: '28px',
              cursor: 'pointer',
              verticalAlign: 'middle',
              position: 'relative',
              lineHeight: '22px',
              textDecoration: 'none',
              zIndex: 1,
              color: '#fff'
            },
            href: '#',
            append: [
              mono.create('i', {
                style: {
                  position: 'absolute',
                  display: 'inline-block',
                  left: '6px',
                  top: '3px',
                  backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#ffffff')+')',
                  backgroundSize: '12px',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  width: '16px',
                  height: '16px'
                }
              }),
              language.download
            ]
          }),
          mono.create('style', {
            text: mono.styleObjToText({
              'button::-moz-focus-inner': {
                padding: 0,
                margin: 0
              },
              '.sf-quick-dl-btn': {
                backgroundColor: '#00B75A'
              },
              '.sf-quick-dl-btn:hover': {
                backgroundColor: 'rgb(0, 163, 80)'
              },
              '.sf-quick-dl-btn:active': {
                backgroundColor: 'rgb(0, 151, 74)'
              }
            }, '#' + youtube.buttonId)
          }),
          selectBtn = mono.create('button', {
            style: {
              position: 'relative',
              display: 'inline-block',
              marginLeft: '-2px',
              fontSize: 'inherit',
              height: '24px',
              paddingRight: '21px',
              backgroundColor: '#F8F8F8',
              border: '1px solid #CCCCCC',
              borderRadius: '3px',
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              cursor: 'pointer',
              color: '#9B9B9B',
              zIndex: 0,
              verticalAlign: 'middle'
            },
            on: ['mousedown', youtube.getLinks],
            append: [
              mono.create('i', {
                style: {
                  position: 'absolute',
                  display: 'inline-block',
                  top: '9px',
                  right: '6px',
                  border: '5px solid #868282',
                  borderBottomColor: 'transparent',
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent'
                }
              })
            ]
          })
        ]
      });
      youtube.setButtonValue(selectBtn);

      parent.appendChild(buttonContainer);

      var ummyBtn = ytUmmyBtn(language, preference, youtube.video_id);
      ummyBtn && parent.appendChild(ummyBtn);

      if ([20].indexOf(preference.expIndex) !== -1) {
        youtube.tutorial.tooltipShow({
          target: buttonContainer,
          trackId: 'Yt'
        });
      }
    },

    lastFrameObserver: null,
    observeFrameVideoChange: function(btnObj) {
      "use strict";
      var _this = this;
      if (this.lastFrameObserver) {
        this.lastFrameObserver.disconnect();
      }

      var target  = document.querySelector('.ytp-thumbnail-overlay');
      if (!target) {
        return;
      }

      var vidRegexp = /\/vi\/([^\/]+)/;
      var onStyleChange = function() {
        var style = target.getAttribute('style');
        if (!style) {
          return;
        }
        var vid = style.match(vidRegexp);
        vid = vid && vid[1];
        if (!vid) {
          return;
        }

        if (vid !== youtube.video_id) {
          youtube.video_id = vid;

          if (youtube.frameQualityDetected) {
            btnObj.link = null;
            btnObj.setLoadingState();

            _this.quickBtn.setValue(btnObj);
          }
        }
      };
      onStyleChange();

      if (typeof MutationObserver === 'undefined') {
        return;
      }

      var observer = this.lastFrameObserver = new MutationObserver(function(mutations) {
        mutations.some(function(mutation) {
          if (mutation.type !== 'attributes') {
            return;
          }
          if (mutation.attributeName !== 'style') {
            return;
          }

          onStyleChange();
          return true;
        });
      });
      var config = { attributes: true, childList: false, characterData: false };
      observer.observe(target, config);
    },

    appendIframeButtons: function() {
      "use strict";
      var _this = youtube;

      var firstMenuShow = true;

      var btnObj = SaveFrom_Utils.frameMenu.getBtn({
        btnId: 'sfYtFrameBtn',
        containerStyle: {
          top: '40px',
          right: '20px'
        },
        on: [
          ['mousedown', function(e) {
            e.stopPropagation();
            if (e.button !== 2) {
              return;
            }

            if (_this.onFrameMouseEnterBind && _this.onFrameMouseLeaveBind) {
              mono.off(document, 'mouseenter', _this.onFrameMouseEnterBind);
              mono.off(document, 'mouseleave', _this.onFrameMouseLeaveBind);
              _this.onFrameMouseEnterBind = null;
              _this.onFrameMouseLeaveBind = null;
            }
            if (_this.lastFrameObserver) {
              _this.lastFrameObserver.disconnect();
            }
            if (_this.currentMenu !== undefined) {
              _this.currentMenu.hide();
              _this.currentMenu = undefined;
            }
            if (btnObj.node.parentNode) {
              btnObj.node.parentNode.removeChild(btnObj.node);
            }
          }]
        ],
        onSelectBtn: ['mousedown', function(e) {
          if (e.button > 0) {
            return;
          }

          e.stopPropagation();
          e.preventDefault();

          var vid = _this.video_id;

          if (_this.currentMenu !== undefined) {
            _this.currentMenu.hide();
            _this.currentMenu = undefined;
            return;
          }

          btnObj.node.classList.add('hover');
          var menu = _this.currentMenu = SaveFrom_Utils.frameMenu.getMenu(this.parentNode, language.download + ' ...', 'sf-popupMenu', {
            onShow: function() {
              if (!firstMenuShow) {
                return;
              }
              firstMenuShow = false;

              if ([1].indexOf(preference.cohortIndex) !== -1) {
                mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-iframe'});
              }
            },
            onHide: function() {
              _this.currentMenu = undefined;
              btnObj.node.classList.remove('hover');
            },
            onItemClick: function(link) {
              var itag = link.itag;
              mono.storage.set({ytLastITag: itag}, function() {
                _this.quickBtn.setValue(btnObj);
              });
            }
          });
          menu.el.classList.add('sf-show');

          var response = _this.responseCache[vid];
          if (response) {
            var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title, response.subtitles, {
              ummyVid: 136
            });
            menu.update(menuLinks);
            return;
          }

          mono.sendMessage({
            action: 'getYoutubeLinks',
            extVideoId: vid,
            url: location.href,
            checkSubtitles: true
          }, function(response) {
            if (response.links) {
              _this.responseCache[vid] = response;

              var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title, response.subtitles, {
                ummyVid: 136
              });
              menu.update(menuLinks);
              return;
            }

            menu.update(language.noLinksFound);
          });
        }]
      });

      btnObj.setLoadingState();

      document.body.appendChild(btnObj.node);

      var onBtnMouseEnter = function() {
        mono.off(btnObj.node, 'mouseenter', onBtnMouseEnter);

        if (this.frameQualityDetected) {
          return;
        }
        this.frameQualityDetected = true;

        this.quickBtn.setValue(btnObj);
      }.bind(this);

      mono.on(btnObj.node, 'mouseenter', onBtnMouseEnter);

      if (this.onFrameMouseEnterBind && this.onFrameMouseLeaveBind) {
        mono.off(document, 'mouseenter', this.onFrameMouseEnterBind);
        mono.off(document, 'mouseleave', this.onFrameMouseLeaveBind);
      }

      this.onFrameMouseEnterBind = this.onFrameMouseEnter.bind(this, btnObj);
      this.onFrameMouseLeaveBind = this.onFrameMouseLeave.bind(this, btnObj);

      mono.on(document, 'mouseenter', this.onFrameMouseEnterBind);
      mono.on(document, 'mouseleave', this.onFrameMouseLeaveBind);

      this.observeFrameVideoChange(btnObj);
    },

    frameQualityDetected: false,
    frameQualityTimer: null,

    onFrameMouseEnterBind: null,
    onFrameMouseLeaveBind: null,

    onFrameMouseEnter: function(btnObj) {
      "use strict";
      btnObj.node.classList.add('sf-show');

      if (youtube.currentMenu) {
        youtube.currentMenu.el.classList.add('sf-show');
      }


      if (!this.frameQualityDetected) {
        clearTimeout(this.frameQualityTimer);
        this.frameQualityTimer = setTimeout(function() {
          if (this.frameQualityDetected) {
            return;
          }
          this.frameQualityDetected = true;


          this.quickBtn.setValue(btnObj);
        }.bind(this), 500);
      }
    },

    onFrameMouseLeave: function(btnObj) {
      "use strict";
      if (!this.frameQualityDetected) {
        clearTimeout(this.frameQualityTimer);
      }

      btnObj.node.classList.remove('sf-show');

      if (youtube.currentMenu) {
        youtube.currentMenu.el.classList.remove('sf-show');
      }
    },

    getTitle: function()
    {
      var t = document.getElementById('watch-headline-title');
      if(t)
        return t.textContent;

      var meta = document.getElementsByTagName('meta');
      for(var i = 0; i < meta.length; i++)
      {
        var name = meta[i].getAttribute('name');
        if(name && name.toLowerCase() == 'title')
          return meta[i].getAttribute('content');
      }

      if(iframe || youtube.isMobile)
        return document.title.replace(/ - YouTube$/, '');

      return '';
    },

    getTitleModify: function() {
      "use strict";
      var title = youtube.getTitle();
      if(title) {
        title = modifyTitle(title);
      }

      return title;
    },

    onPopupMenuItemClick: function(button, data) {
      var quality = data.quality || '';
      if (quality) {
        quality = quality.replace(' ' + mono.global.language.kbps, '');
      }
      var label = [
        data.format, quality
      ];
      if (data.sFps) {
        label.push(data.sFps);
      }
      if (data['3d']) {
        label.push(data['3d']);
      }
      if (data.noAudio) {
        label.push(data.noAudio);
      }
      label.push(data.itag);
      if (data.quality === 'ummy') {
        label = [data.format];
        if (data.uIsAudio) {
          label.push(data.uIsAudio);
        }
      }

      label = label.join(' ');

      if (['18', '22'].indexOf(String(data.itag)) === -1) {
        mono.sendMessage({action: 'trackEvent', category: 'youtube', event: 'download', label: label});
      }

      if (data.format === '???') {
        mono.sendMessage({action: 'trackEvent', category: 'youtube', event: 'new_format', label: data.itag+' '+youtube.video_id});
      }

      var itag = data.itag;
      mono.storage.set({ytLastITag: itag}, function() {
        if (data.noUpdate) {
          return;
        }
        youtube.setButtonValue(button);
      });
    },

    showLinks: function(links, button, subtitles, title)
    {
      links = links || {};
      var _button = document.getElementById(youtube.buttonId);
      // _button = is container,
      // button - select btn

      if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
        youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
      }
      if (typeof links === 'string') {
        youtube.tmpExMenu = SaveFrom_Utils.popupMenu.create({
          links: links,
          button: _button || button,
          popupId: youtube.panelId
        });
      } else {
        var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(links, title || youtube.getTitleModify(), subtitles);

        youtube.tmpExMenu = SaveFrom_Utils.popupMenu.create({
          links: menuLinks,
          button: _button || button,
          popupId: youtube.panelId,
          showFileSize: true,
          onItemClick: function(data) {
            youtube.onPopupMenuItemClick(button, data);
          }
        });
      }

      // button.classList.add('yt-uix-button-toggled');

      button.removeEventListener('mousedown', youtube.getLinks, false);
      button.removeEventListener('mousedown', youtube.togglePanel, false);
      button.addEventListener('mousedown', youtube.togglePanel, false);

      document.removeEventListener('mousedown', youtube.closePopup, false);
      document.addEventListener('mousedown', youtube.closePopup, false);

      SaveFrom_Utils.popupMenu.popup = undefined;
    },

    closePopup: function () {
      youtube.togglePanel();
      document.removeEventListener('mousedown', youtube.closePopup);
    },

    togglePanel: function(event)
    {

      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      var e = document.getElementById(youtube.panelId);
      if(e)
      {
        if(e.style.display == 'none')
        {
          e.style.display = '';

          document.addEventListener('mousedown', youtube.closePopup, false);

          var button = document.getElementById(youtube.buttonId);
          if (button !== null) {
            var pos = SaveFrom_Utils.getPosition(button);
            var size = SaveFrom_Utils.getSize(button);

            e.style.top = (pos.top + size.height) + 'px';
            e.style.left = pos.left + 'px';
          }
        }
        else
        {
          e.style.display = 'none';

          document.removeEventListener('mousedown', youtube.closePopup, false);
        }
      }
    },

    onDlBtnClick: function(e, link, button, details) {
      if (!link) {
        e.preventDefault();
        e.stopPropagation();
        mono.trigger(this.parentNode.lastChild, 'mousedown');
        return;
      }

      if (details) {
        if (details.onItemClick) {
          details.onItemClick(link);
        }
      } else {
        if ([1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-single'});
        }

        var data = {
          itag: link.itag || '',
          quality: link.quality || '',
          format: link.format || '???',
          '3d': link['3d'] ? '3D' : '',
          sFps: link.sFps ? 'fps' + (link.fps || 60) : '',
          noAudio: link.noAudio ? 'no audio' : '',
          isBest: !!link.isBest,
          uIsAudio: link.uIsAudio ? 'audio' : '',
          noUpdate: 1
        };

        youtube.onPopupMenuItemClick(button, data);
      }

      if (link.quality === 'ummy') {
        return;
      }

      if (link.forceDownload) {
        SaveFrom_Utils.downloadOnClick(e, null, {
          useFrame: link.useIframe || false
        });
      }
    },

    setButtonValue: (function() {
      var bindDlBtn = function(selectBtn, dlBtn, link) {
        var eIndex = dlBtn.dataset.eventInedx || 0;
        dlBtn.dataset.eventInedx = ++eIndex;
        dlBtn.addEventListener('click', function onClick(e){
          e.stopPropagation();
          if (parseInt(this.dataset.eventInedx) !== eIndex) {
            this.removeEventListener('click', onClick);
            return;
          }
          youtube.onDlBtnClick.call(this, e, link, selectBtn);
        });

        dlBtn.removeAttribute('download');
        dlBtn.removeAttribute('title');

        if (!link) {
          return;
        }

        var title;
        if (link.quality === 'ummy') {
          mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
            selectBtn.insertBefore(mono.create('span', {
              style: {
                width: '16px',
                height: '16px',
                backgroundImage: 'url('+dataImg+')',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                marginLeft: '6px',
                display: 'inline-block',
                verticalAlign: 'top'
              }
            }), selectBtn.lastChild);
          });
          title = mono.capitalize(link.quality);
        } else {
          var btnText = link.quality;
          if (!link.noVideo) {
            btnText = parseInt(btnText);
          }
          if (link['3d']) {
            btnText = '3D ' + btnText;
          }
          if (link.sFps) {
            btnText += ' ' + (link.fps || 60);
          }
          title = [link.format, btnText];
          if (link.noAudio) {
            title.push(language.withoutAudio);
          }
          title = title.join(' ');
          selectBtn.insertBefore(mono.create('span', {
            text: btnText,
            style: {
              marginLeft: '6px',
              verticalAlign: 'bottom'
            }
          }), selectBtn.lastChild);
        }

        dlBtn.title = title;
        dlBtn.href = link.href;

        if (link.title && link.format) {
          var ext = link.ext;
          if(!ext) {
            ext = link.format.toLowerCase();
          }
          dlBtn.setAttribute('download', mono.fileName.modify(link.title + '.' + ext) );
        }
      };

      var getBestItem = function(menuLinks) {
        var sList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.prop.noAudio || item.prop.noVideo) {
            continue;
          }
          if (item.prop.format === 'ummy') {
            continue;
          }
          if (!item.prop.isHidden) {
            sList.push(item.prop);
          }
        }
        menuLinks = sList;
        if (menuLinks.length > 0) {
          return menuLinks[0];
        }
        return undefined;
      };

      var prepMenuLinks = function(links, title) {
        var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(links, title);
        var ummyLinks = {};

        var linkList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.quality === 'ummy') {
            ummyLinks[item.itag] = item;
          }
          linkList.push({prop: item});
        }
        menuLinks = SaveFrom_Utils.popupMenu.sortMenuItems(linkList);
        menuLinks.some(function(item) {
          if (item.prop.isHidden) {
            return 0;
          }
          item.prop.isBest = true;
          return 1;
        });

        return {mL: menuLinks, uM: ummyLinks};
      };

      var onGetLinks = function(selectBtn, dlBtn, links, title) {
        if (links) {
          var count = Object.keys(links).length;
          if (links.meta) {
            count--;
          }
        }
        if (!links || !count) {
          return bindDlBtn(selectBtn, dlBtn);
        }

        mono.storage.get('ytLastITag', function(storage) {
          var iTagLast = storage.ytLastITag;

          var menuLinks = prepMenuLinks(links, title || youtube.getTitleModify());
          var ummyLinks = menuLinks.uM;
          menuLinks = menuLinks.mL;

          if (selectBtn.firstChild.tagName !== 'I') {
            selectBtn.removeChild(selectBtn.firstChild);
          }

          if (iTagLast === 'ummyAudio') {
            iTagLast = 'ummy';
          }

          if (iTagLast === 'ummy' && ummyLinks[iTagLast]) {
            bindDlBtn(selectBtn, dlBtn, ummyLinks[iTagLast]);
          } else {
            bindDlBtn(selectBtn, dlBtn, getBestItem(menuLinks));
          }
        });
      };

      return function(selectBtn) {
        var dlBtn = selectBtn.parentNode.firstChild;
        var vid = youtube.video_id;

        var response = youtube.responseCache[vid];
        if(response) {
          onGetLinks(selectBtn, dlBtn, response.links, response.title);
          response = null;
          return;
        }

        if(!vid) {
          return onGetLinks(selectBtn, dlBtn);
        }

        bindDlBtn(selectBtn, dlBtn);

        getPlayerConfig(function(config) {
          mono.sendMessage({
            action: 'getYoutubeLinksFromConfig',
            config: config,
            extVideoId: vid,
            url: location.href,
            noDash: true
          }, function(response) {
            if (!response) {
              response = {};
            }
            if (response.isQuick) {
              dlBtn.dataset.isQuick = '1';
            }
            return onGetLinks(selectBtn, dlBtn, response.links, response.title);
          });
        });
      }
    })(),

    quickBtn: {
      prepMenuLinks: function(links, title) {
        "use strict";
        var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(links, title);
        var ummyLinks = {};

        var linkList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.quality === 'ummy') {
            ummyLinks[item.itag] = item;
          }
          linkList.push({prop: item});
        }
        menuLinks = SaveFrom_Utils.popupMenu.sortMenuItems(linkList);
        menuLinks.some(function(item) {
          if (item.prop.isHidden) {
            return 0;
          }
          item.prop.isBest = true;
          return 1;
        });

        return {menuLinks: menuLinks, ummyLinks: ummyLinks};
      },

      setValueInSelectBtn: function(details, text) {
        "use strict";
        if (typeof text !== 'object') {
          text = document.createTextNode(text);
        }
        var first = details.selectBtn.firstChild;
        if (first === details.selectBtn.lastChild) {
          details.selectBtn.insertBefore(text)
        } else {
          details.selectBtn.replaceChild(text, first);
        }
      },

      getBestItem: function(menuLinks) {
        var sList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.prop.noAudio || item.prop.noVideo) {
            continue;
          }
          if (item.prop.format === 'ummy') {
            continue;
          }
          if (!item.prop.isHidden) {
            sList.push(item.prop);
          }
        }

        if (!sList.length) {
          return;
        }

        return sList[0];
      },

      bindDlBtn: function(details) {
        "use strict";
        var quickBtn = details.quickBtn;
        if (details.quickBtnEvent) {
          quickBtn.removeEventListener('click', details.quickBtnEvent);
        }
        quickBtn.addEventListener('click', details.quickBtnEvent = function(e) {
          e.stopPropagation();

          if (details.link && youtube.currentMenu) {
            youtube.currentMenu.hide();
            youtube.currentMenu = undefined;
          }

          youtube.onDlBtnClick.call(this, e, details.link, details.selectBtn, details);
        });
      },

      setBestValue: function(details, link) {
        "use strict";
        var quickBtn = details.quickBtn;

        details.link = link;

        var btnText = link.quality;
        if (!link.noVideo) {
          btnText = parseInt(btnText);
        }
        if (link['3d']) {
          btnText = '3D ' + btnText;
        }
        if (link.sFps) {
          btnText += ' ' + (link.fps || 60);
        }

        var textContainer = mono.create('span', {
          text: btnText,
          style: {
            marginLeft: '6px',
            verticalAlign: 'bottom'
          }
        });

        this.setValueInSelectBtn(details, textContainer);

        var title = [link.format, btnText];
        if (link.noAudio) {
          title.push(language.withoutAudio);
        }
        title = title.join(' ');

        quickBtn.title = title;
        quickBtn.href = link.href;

        if (link.title && link.format) {
          var ext = link.ext;
          if(!ext) {
            ext = link.format.toLowerCase();
          }
          quickBtn.setAttribute('download', mono.fileName.modify(link.title + '.' + ext) );
        }
      },

      setUmmyBadge: function(details, link) {
        "use strict";
        var quickBtn = details.quickBtn;

        details.link = link;

        mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
          var ummyIcon = mono.create('span', {
            style: {
              width: '16px',
              height: '16px',
              backgroundImage: 'url('+dataImg+')',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              marginLeft: '6px',
              display: 'inline-block',
              verticalAlign: 'top'
            }
          });
          this.setValueInSelectBtn(details, ummyIcon);
        }.bind(this));

        quickBtn.title = mono.capitalize(link.quality);
        quickBtn.href = link.href;

        quickBtn.removeAttribute('download');
      },

      onGetLinks: function(details, links, title) {
        "use strict";
        if (links) {
          var count = Object.keys(links).length;
          if (links.meta) {
            count--;
          }
        }
        if (!links || !count) {
          return this.setValueInSelectBtn(details, '');
        }

        mono.storage.get('ytLastITag', function(storage) {
          var ytLastITag = storage.ytLastITag;

          var menuLinks = this.prepMenuLinks(links, title || youtube.getTitleModify());

          if (ytLastITag === 'ummyAudio') {
            ytLastITag = 'ummy';
          }

          if (ytLastITag === 'ummy' && menuLinks.ummyLinks[ytLastITag]) {
            this.setUmmyBadge(details, menuLinks.ummyLinks[ytLastITag]);
          } else {
            var link = this.getBestItem(menuLinks.menuLinks);
            if (link) {
              this.setBestValue(details, link);
            } else {
              this.setValueInSelectBtn(details, '');
            }
          }
        }.bind(this));
      },
      setValue: function(details) {
        "use strict";
        this.bindDlBtn(details);

        var vid = youtube.video_id;
        if(!vid) {
          return this.onGetLinks(details);
        }

        var response = youtube.responseCache[vid];
        if(response) {
          this.onGetLinks(details, response.links, response.title);
          response = null;
          return;
        }

        mono.sendMessage({
          action: 'getYoutubeLinks',
          extVideoId: vid,
          url: location.href,
          noDash: true
        }, function(response) {
          response = response || {};

          return this.onGetLinks(details, response.links, response.title);
        }.bind(this));
      }
    },

    getLinks: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var vid = youtube.video_id;

      var button = this;

      var d = button;
      while(d && d != document.body)
      {
        if(d.style.display == 'none')
          d.style.display = '';

        if(d.style.visibility == 'hidden')
          d.style.visibility = 'visible';

        d.style.zOrder = '9999';

        d = d.parentNode;
      }

      if ([1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-single'});
      }

      var response = youtube.responseCache[vid];
      if(response) {
        youtube.showLinks(response.links, button, response.subtitles, response.title);
        response = null;
        return;
      }

      if(!vid) {
        return;
      }

      youtube.showLinks(language.download +
      ' ...', button);

      mono.sendMessage({
        action: 'getYoutubeLinks',
        extVideoId: vid,
        url: location.href,
        checkSubtitles: true
      }, function(response) {
        if (response.links) {
          youtube.responseCache[vid] = response;
        }
        youtube.showLinks(response.links, button, response.subtitles, response.title);
      });
    },

    videoFeed: {
      state: false,
      currentMenu: undefined,
      injectedStyle: undefined,
      imgIdPattern: /vi[^\/]{0,}\/([^\/]+)/,
      onUrlUpdate: function(url) {
        if (youtube.videoFeed.currentMenu !== undefined) {
          youtube.videoFeed.currentMenu.hide();
          youtube.videoFeed.currentMenu = undefined;
        }
        var isPlaylist = false;
        if (url.indexOf('/playlist?') !== -1) {
          isPlaylist = true;
        } else {
          var matched = url.match(/(user|channel)\/[^\/]+(\/feed|\/featured|\/videos|$)/i);
          if (!matched) {
            matched = url.match(/\/(feed)\/(subscriptions|history)/i);
          }
          if (!matched || matched.length < 3) {
            isPlaylist = false;
          } else {
            isPlaylist = true;
          }
        }
        if (isPlaylist) {
          this.enable();
        } else {
          this.disable();
        }
      },
      disable: function() {
        if (!this.state) {
          return;
        }
        this.state = false;

        mono.off(document, 'mouseenter', this.onVideoImgHover, true);
        if (this.injectedStyle && this.injectedStyle.parentNode) {
          this.injectedStyle.parentNode.removeChild(this.injectedStyle);
          this.injectedStyle = undefined;
        }
      },
      enable: function() {
        if (iframe) {
          return;
        }
        if (this.state) {
          return;
        }
        this.state = true;

        mono.off(document, 'mouseenter', this.onVideoImgHover, true);
        mono.on(document, 'mouseenter', this.onVideoImgHover, true);

        if (this.injectedStyle === undefined) {
          this.injectedStyle = mono.create('style', {
            text: "a > .sf-feed-dl-btn," +
            "div > .sf-feed-dl-btn," +
            "span > .sf-feed-dl-btn {" +
            'display: none;' +
            'border: 1px solid #d3d3d3;' +
            'width: 20px;' +
            'height: 20px;' +
            'padding: 0;' +
            'position: absolute;' +
            'right: 26px;' +
            'bottom: 2px;' +
            'border-radius: 2px;' +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#777777') + ') center no-repeat #f8f8f8;' +
            'background-size: 12px;' +
            'cursor: pointer;' +
            "}" +
            "a > .sf-feed-dl-btn:hover," +
            "div > .sf-feed-dl-btn:hover," +
            "span > .sf-feed-dl-btn:hover {" +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#00B75A') + ') center no-repeat #f8f8f8;' +
            'background-size: 12px;' +
            "}" +
            "a > .sf-feed-dl-btn:active," +
            "div > .sf-feed-dl-btn:active," +
            "span > .sf-feed-dl-btn:active {" +
            "outline: 0;" +
            "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
            "}" +
            "a:hover > .sf-feed-dl-btn," +
            "div:hover > .sf-feed-dl-btn," +
            "span:hover > .sf-feed-dl-btn {display: block;}"
          });

          document.body.appendChild(this.injectedStyle);
        }
      },

      rmBtn: function() {
        var btnList = document.querySelectorAll('.sf-feed-dl-btn');
        for (var i = 0, item; item = btnList[i]; i++) {
          item.parentNode.removeChild(item);
        }
        var dataAttr = mono.dataAttr2Selector('sfBtn');
        var datasetList = document.querySelectorAll('*['+dataAttr+']');
        for (i = 0, item; item = datasetList[i]; i++) {
          item.removeAttribute(dataAttr);
        }
      },

      onVideoImgHover: function(e) {
        if (e.target.tagName !== 'IMG') {
          return;
        }

        youtube.videoFeed.onImgHover.call(e.target, e);
      },

      onImgHover: function(e) {
        var parent = this.parentNode;
        var vid = parent.dataset.vid;
        if (!vid) {
          if (!this.src) {
            return;
          }
          vid = this.src.match(youtube.videoFeed.imgIdPattern);
          if (!vid) {
            return;
          }
          vid = vid[1];
          if (parent.classList.contains('yt-thumb-clip') || parent.classList.contains('video-thumb')) {
            parent = SaveFrom_Utils.getParentByTagName(this, 'A');
          }
          if (!parent) {
            return;
          }
          parent = parent.parentNode;
          if (!SaveFrom_Utils.hasChildrenTagName(parent, 'BUTTON')) {
            return;
          }
        }
        var hasBtn = parent.dataset.sfBtn;
        if (hasBtn) {
          return;
        }
        parent.dataset.sfBtn = '1';

        parent.appendChild(mono.create('i', {
          class: "sf-feed-dl-btn",
          append: [
            !mono.isOpera ? undefined : mono.create('img', {
              src: SaveFrom_Utils.svg.getSrc('download', '#777777'),
              style: {
                width: '12px',
                height: '12px',
                margin: '4px'
              }
            })
          ],
          on: ['click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (youtube.videoFeed.currentMenu !== undefined) {
              youtube.videoFeed.currentMenu.hide();
              youtube.videoFeed.currentMenu = undefined;
            }

            var _this = this;
            var menu = youtube.videoFeed.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(_this, language.download + ' ...', 'sf-popupMenu');

            mono.sendMessage({
              action: 'getYoutubeLinks',
              extVideoId: vid,
              url: location.href,
              checkSubtitles: true
            }, function(response){
              if(response.links) {
                var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title, response.subtitles);
                menu.update(menuLinks);
                return;
              }
              menu.update(language.noLinksFound);
            });

            if ([1].indexOf(preference.cohortIndex) !== -1) {
              mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-playlist'});
            }
          }]
        }));
      }
    },

    downloadPlaylist: function() {
      var getIdListFromPage = function(container) {
        var idList = [];
        var imgList = container.querySelectorAll('img[src]');
        var pattern = youtube.videoFeed.imgIdPattern;
        for (var i = 0, el; el = imgList[i]; i++) {
          var matched = el.src.match(pattern);
          if (!matched) {
            continue;
          }
          if (idList.indexOf(matched[1]) === -1) {
            idList.push(matched[1]);
          }
        }

        var dataElList = container.querySelectorAll('*[data-video-id]');
        for (i = 0, el; el = dataElList[i]; i++) {
          var id = el.dataset.videoId;
          if (idList.indexOf(id) === -1) {
            idList.push(id);
          }
        }
        return idList;
      };
      var getIdLinks = function(cb) {
        var container = document;
        var url = mono.parseUrlParams(location.href);
        if (url.list !== undefined) {
          return mono.sendMessage({action: 'getYoutubeIdListFromPlaylist', listId: url.list, baseUrl: location.protocol + '//' + location.host}, function(response) {
            if (!response) {
              return cb();
            }
            if (!response.idList || response.idList.length === 0) {
              var container = document.querySelector(".playlist-videos-container > .playlist-videos-list");
              if (container !== null) {
                response.idList = getIdListFromPage(container);
              }
              if (!response.title) {
                var title = document.querySelector(".playlist-info > .playlist-title");
                if (title !== null) {
                  response.title = title.textContent.replace(/\r?\n/g, " ").trim();
                }
              }
            }
            cb(response.idList, response.title);
          });
        }
        var idList = getIdListFromPage(container);
        cb(idList, youtube.getTitle());
      };
      var getVideoLink = function(vid, maxSize, typeList, cb) {
        var useDash = typeList.indexOf('audio') !== -1;
        mono.sendMessage({action: 'getYoutubeLinks', extVideoId: vid, noDash: useDash}, function(response) {
          var links = undefined;
          if(response.links) {
            links = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title);
            links = SaveFrom_Utils.popupMenu.sortMenuItems(links, {
              noProp: true,
              maxSize: maxSize,
              minSize: 2,
              typeList: typeList
            });
          }
          cb(links);
        });
      };
      var getVideoLinks = function(idList, maxSize, onProgress, onReady) {
        var abort = false;
        var linkList = {};
        var index = 0;
        var inProgress = 0;
        var listLen = idList.length;

        var typeList = undefined;
        if (maxSize === 'audio') {
          typeList = ['audio'];
          maxSize = undefined;
        } else {
          typeList = ['video'];
          maxSize = parseInt(maxSize) || undefined;
        }

        var getNextOneId = function() {
          if (abort) {
            return;
          }
          var id = idList[index];
          if (id === undefined) {
            if (inProgress === 0) {
              return onReady(linkList);
            } else {
              return;
            }
          }
          index++;
          inProgress++;
          getVideoLink(id, maxSize, typeList, function(links) {
            var firstLink = links ? links[0] : undefined;
            if (firstLink) {
              var ext = firstLink.ext;
              if(!ext) {
                ext = firstLink.format.toLowerCase();
              }

              var filename = mono.fileName.modify(firstLink.title + '.' + ext);
              linkList[id] = {url: firstLink.href, title: firstLink.title, filename: filename};
            }
            onProgress(index, listLen);
            inProgress--;
            getNextOneId();
          });
        };
        getNextOneId();
        getNextOneId();
        return {
          abort: function () {
            abort = true;
          }
        }
      };
      var getPopup = function(onClose) {
        var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();
        var progressEl;
        var qualitySelectBox;
        var qualitySelect;

        mono.sendMessage({action: 'getWarningIcon', type: 'playlist', color: '#77D1FA'}, function(icon) {
          template.icon.style.backgroundImage = 'url('+icon+')';
        });

        mono.create(template.textContainer, {
          append: [
            mono.create('p', {
              text: language.playlist,
              style: {
                color: '#0D0D0D',
                fontSize: '20px',
                marginBottom: '11px',
                marginTop: '13px'
              }
            }),
            qualitySelectBox = mono.create('div', {
              append: [
                mono.create('p', {
                  text: language.quality+":",
                  style: {
                    color: '#000000',
                    fontSize: '14px',
                    marginBottom: '13px',
                    lineHeight: '24px'
                  },
                  append: [
                    qualitySelect = mono.create('select', {
                      style: {
                        width: '75px',
                        marginLeft: '5px'
                      },
                      append: [
                        mono.create('option', {
                          text: '720',
                          value: '720'
                        }),
                        mono.create('option', {
                          text: '480',
                          value: '480'
                        }),
                        mono.create('option', {
                          text: '360',
                          value: '360'
                        }),
                        mono.create('option', {
                          text: '240',
                          value: '240'
                        }),
                        mono.create('option', {
                          text: 'Audio',
                          value: 'audio'
                        })
                      ]
                    })
                  ]
                }),
                mono.create('p', {
                  text: language.qualityNote,
                  style: {
                    color: '#868686',
                    fontSize: '14px',
                    lineHeight: '24px'
                  }
                })
              ]
            }),
            progressEl = mono.create('p', {
              text: '',
              style: {
                color: '#868686',
                fontSize: '14px',
                lineHeight: '24px'
              }
            })
          ]
        });

        var continueBtn, cancelBtn;
        mono.create(template.buttonContainer, {
          append: [
            cancelBtn = mono.create('button', {
              text: language.cancel,
              style: {
                height: '27px',
                width: '118px',
                backgroundColor: '#ffffff',
                border: '1px solid #9e9e9e',
                margin: '12px',
                marginBottom: '11px',
                marginRight: '4px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }
            }),
            continueBtn = mono.create('button', {
              text: language.continue,
              style: {
                height: '27px',
                width: '118px',
                backgroundColor: '#ffffff',
                border: '1px solid #9e9e9e',
                margin: '12px',
                marginBottom: '11px',
                marginRight: '8px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }
            })
          ]
        });

        var popupEl = SaveFrom_Utils.popupDiv(template.body, 'pl_progress_popup', undefined, undefined, onClose);
        return {
          qualitySelect: function(cb) {
            progressEl.style.display = 'none';
            template.buttonContainer.style.display = 'block';
            qualitySelectBox.style.display = 'block';
            continueBtn.addEventListener('click', function() {
              cb(qualitySelect.value);
            });
            cancelBtn.addEventListener('click', function() {
              mono.trigger(popupEl, 'kill');
            });
          },
          onPrepare: function(text) {
            progressEl.style.display = 'block';
            template.buttonContainer.style.display = 'none';
            qualitySelectBox.style.display = 'none';
            progressEl.textContent = text;
          },
          onProgress: function(count, max) {
            progressEl.textContent = language.vkFoundFiles.replace('%d', count) + ' ' + language.vkFoundOf + ' ' + max;
          },
          onReady: function(list, title) {
            mono.trigger(popupEl, 'kill');
            if (allowDownloadMode) {
              SaveFrom_Utils.downloadList.showBeforeDownloadPopup(list, {
                type: 'playlist',
                folderName: title
              });
            } else {
              SaveFrom_Utils.playlist.popupPlaylist(list, title, true, undefined, 'video');
            }
          },
          onError: function(text) {
            mono.sendMessage({action: 'getWarningIcon', type: 'playlist', color: '#AAAAAA'}, function(icon) {
              template.icon.style.backgroundImage = 'url('+icon+')';
            });

            progressEl.style.display = 'block';
            template.buttonContainer.style.display = 'none';
            qualitySelectBox.style.display = 'none';
            progressEl.textContent = text;
          }
        }
      };
      return function() {
        var abort = false;
        var gettingLink = undefined;
        var popup = getPopup(function onClose() {
          abort = true;
          if (gettingLink) {
            gettingLink.abort();
          }
        });
        popup.qualitySelect(function(maxSize) {
          popup.onPrepare(language.download+' ...');
          getIdLinks(function(idList, title) {
            if (abort) {
              return;
            }
            if (!idList || idList.length === 0) {
              popup.onError(language.noLinksFound);
              return;
            }

            gettingLink = getVideoLinks(idList, maxSize, popup.onProgress, function onReady(linkList) {
              var links = [];
              for (var id in linkList) {
                links.push(linkList[id]);
              }

              var folderName = mono.fileName.modify(title);
              popup.onReady(links, folderName);
            });
          });
        });
        if ([1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-menu'});
        }
      }
    }(),

    tutorial: {
      tooltipShow: function(details) {
        "use strict";
        mono.storage.get('onceYtTutorial', function(storage) {
          if (storage.onceYtTutorial) {
            return;
          }
          storage.onceYtTutorial = 1;

          details.onClose = function() {
            mono.storage.set(storage);
          };

          SaveFrom_Utils.tutorialTooltip.insert(details);
        });
      },
      show: function() {
        "use strict";
        mono.storage.get('onceYtTutorial', function(storage) {
          if (storage.onceYtTutorial) {
            return;
          }
          storage.onceYtTutorial = 1;

          var bridge = SaveFrom_Utils.bridge;
          bridge.init();
          bridge.send('ytVideoSetState', ['pause']);

          var count = 5;
          var adTimeout = setInterval(function() {
            if (!count) {
              clearInterval(adTimeout);
            }
            bridge.send('ytVideoSetState', ['pause']);
            count--;
          }, 1000);

          SaveFrom_Utils.tutorial.show({
            slideList: SaveFrom_Utils.tutorial.getYtSlideList(),
            onClose: function() {
              mono.storage.set(storage);

              clearInterval(adTimeout);
              bridge.send('ytVideoSetState', ['play']);
            },
            checkExists: function(cb) {
              mono.storage.get('onceYtTutorial', function(storage) {
                if (storage.onceYtTutorial) {
                  return cb(1);
                }
                cb();
              });
            },
            withOpacity: true,
            trackId: 'Yt'
          });
        });
      }
    }
  };


  function modifyTitle(t)
  {
    t = t.replace(/[\x2F\x5C\x3A\x7C]/g, '-');
    t = t.replace(/[\x2A\x3F]/g, '');
    t = t.replace(/\x22/g, '\'');
    t = t.replace(/\x3C/g, '(');
    t = t.replace(/\x3E/g, ')');
    t = t.replace(/(?:^\s+)|(?:\s+$)/g, '');
    return t;
  }

  var getPlayerConfig = function(cb) {
    var bridge = SaveFrom_Utils.bridge;
    bridge.init();
    bridge.send.call({timeout: 300}, 'getYtPlayerConfig', [], function(data) {
      if (!data || !data.args || !data.sts || !data.assets) {
        var html = document.body.innerHTML;
        var script = mono.getPageScript(html, /ytplayer\.config\s+=\s+/);
        if (!script.length) {
          return cb(data);
        }
        script = script[0];

        var jsonList = mono.findJson(script, [/html5player/, /"sts":\d+/]);
        if (!jsonList.length) {
          return cb(data);
        }
        jsonList = jsonList[0];

        data = data || {};

        if (jsonList.sts && jsonList.assets) {
          data.sts = jsonList.sts;
          data.assets = jsonList.assets;
        }

        if (!data.args && jsonList.args) {
          data.args = jsonList.args;
        }
      }

      cb(data);
    });
  };

  var ytUmmyBtn = function(language, preferences, videoId) {
    "use strict";
    if (!preferences.showUmmyItem) {
      return;
    }

    if (!preferences.showUmmyBtn) {
      return;
    }

    var url = 'ummy://www.youtube.com/watch?v=' + videoId;
    var vid = 130;
    var text = language.download + ' HD';

    var ummyLogo = mono.create('i', {
      style: {
        position: 'absolute',
        display: 'inline-block',
        left: '6px',
        top: '3px',
        backgroundSize: '16px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        width: '16px',
        height: '16px'
      }
    });
    mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
      ummyLogo.style.backgroundImage = 'url('+dataImg+')';
    });
    var btn = mono.create('div', {
      id: ytUmmyBtn.id,
      style: {
        display: 'inline-block',
        marginLeft: '10px',
        verticalAlign: 'middle'
      },
      append: [
        mono.create('a', {
          class: 'sf-quick-dl-btn',
          style: {
            display: 'inline-block',
            fontSize: 'inherit',
            height: '22px',
            border: '1px solid #CCCCCC',
            borderRadius: '3px',
            paddingRight: '8px',
            paddingLeft: '28px',
            cursor: 'pointer',
            verticalAlign: 'middle',
            position: 'relative',
            lineHeight: '22px',
            textDecoration: 'none',
            zIndex: 1,
            color: '#575757'
          },
          href: url,
          append: [
            ummyLogo,
            text
          ]
        }),
        mono.create('style', {text: '' +
        '#' + ytUmmyBtn.id + ' .sf-quick-dl-btn {' +
        'background-color: #F8F8F8;' +
        '}' +
        '#' + ytUmmyBtn.id + ' .sf-quick-dl-btn:hover {' +
        'background-color: #EDEDED;' +
        '}' +
        '#' + ytUmmyBtn.id + ' .sf-quick-dl-btn:active {' +
        'background-color: #F8F8F8;' +
        '}' +
        '@media screen and (max-width: 1293px) {'
        + '#' + ytUmmyBtn.id + ' .sf-quick-dl-btn {'
        + '' + 'display: none !important;'
        + '}' +
        '}' +
        ''})
      ]
    });
    SaveFrom_Utils.bindUmmyInfo(btn, {video: 'yt-' + videoId, vid: vid});

    return btn;
  };
  ytUmmyBtn.id = 'sf-ummy-btn';
  ytUmmyBtn.rmBtn = function() {
    "use strict";
    var btnList = document.querySelectorAll('#' + ytUmmyBtn.id);
    for (var i = 0, el; el = btnList[i]; i++) {
      el.parentNode.removeChild(el);
    }
  };

  init();
});

//@insert

(typeof mono === 'undefined') && (mono = {loadModule: function() {this.loadModuleStack.push(arguments);},loadModuleStack: []});

mono.loadModule('instagram', function(moduleName, initData) {
  var language = initData.getLanguage;
  var preference = initData.getPreference;
  var moduleState = preference.moduleInstagram ? 1 : 0;

  mono.onMessage(function(message, cb){
    if (message.action === 'getModuleInfo') {
      if (message.url !== location.href) return;
      return cb({state: moduleState, moduleName: moduleName});
    }
    if (message.action === 'changeState') {
      return instagram.changeState(message.state);
    }
    if (message.action === 'updateLinks') {
      return instagram.updateLinks();
    }
  });

  var instagram = {
    urlR: /\/\/[^\/]+\.[^\/]+\/p\//,
    lastWaitEl: null,
    dlBtnClassName: 'savefrom-helper--btn',
    styleEl: null,
    run: function() {
      if (!moduleState) {
        return;
      }

      mono.onUrlChange(function(url) {
        if (!this.urlR.test(url)) {
          return;
        }

        this.lastWaitEl && this.lastWaitEl.abort();

        this.lastWaitEl = this.waitEl(function() {
          return document.querySelector(['.-cx-PRIVATE-Post__media', '.Embed', '.Item']);
        }, function(container) {

          var type = container.classList.contains('Embed') ? 1 : 0;
          this.addDlBtn(container, type);

        }.bind(this));

      }.bind(this), 1);

      mono.off(document, 'mouseenter', this.onMouseEnter, true);
      mono.on(document, 'mouseenter', this.onMouseEnter, true);

      this.insertStyle();
    },
    rmStyle: function() {
      this.styleEl && this.styleEl.parentNode.removeChild(this.styleEl);
      this.styleEl = null;
    },
    insertStyle: function() {
      if (this.styleEl) return;

      var pngDlBtn = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAEZ0FNQQAAsY58+1GTAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAG9JREFUeNpjZEAD5eXl/xnwgM7OTkZkPhMDhWDUgMFgAGNFRUXD////68nSzMjYyHzkyJEDtra2oMThQKrmjo6OBmYQh1RDYJpBbGaYILGGIGtGMYAYQ9A1YxiAzxBsmrEagM0QXJoJAlAUgzA+NQBB9DWbHiRTOAAAAABJRU5ErkJggg==';
      document.body.appendChild(this.styleEl = mono.create('style', {
        text: '.' + this.dlBtnClassName + '{' +
        '  display: none;' +
        '  border: 1px solid #F8F8F8;' +
        '  width: 20px;' +
        '  height: 20px;' +
        '  top: 8px;' +
        '  left: 8px;' +
        '  padding: 0;' +
        '  position: absolute;' +
        '  background: url('+(mono.isOpera ? pngDlBtn : SaveFrom_Utils.svg.getSrc('download', '#777777'))+') center no-repeat #F8F8F8;' +
        '  background-size: 16px;' +
        '  cursor: pointer;' +
        '}' +
        '.Embed .' + this.dlBtnClassName + '{' +
        '  border: 1px solid #B5B5B5;' +
        '  border-radius: 4px;' +
        '  padding: 3px;' +
        '}' +
        '.' + this.dlBtnClassName + ':hover{' +
        '  background: url('+(mono.isOpera ? pngDlBtn : SaveFrom_Utils.svg.getSrc('download', '#3f729b'))+') center no-repeat #F8F8F8;' +
        '  background-size: 16px;' +
        '}' +
        '.' + this.dlBtnClassName + ':active{' +
        '  outline: 0;' +
        '  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);' +
        '}' +
        '*:hover > .' + this.dlBtnClassName + '{' +
        '  display: block;' +
        '}'
      }));
    },
    updateLinks: function() {
      this.changeState(0);
      this.changeState(1);
    },
    changeState: function(state) {
      moduleState = state;
      mono.clearUrlChange();
      this.rmDlBtn();
      this.rmStyle();
      this.rmMouseEnterData();
      if (state) {
        this.run();
      }
    },
    rmDlBtn: function() {
      var btnList = document.querySelectorAll('.' + this.dlBtnClassName);
      for (var i = 0, el; el = btnList[i]; i++) {
        el.parentNode.removeChild(el);
      }
    },
    waitEl: function(func, cb, options) {
      var out;
      var capsule = mono.extend({
        abort: function() {
          clearInterval(capsule.timeout);
          capsule.isAborted = true;
        }
      }, {
        delay: 500,
        repeat: 12,
        isAborted: false,
        timeout: null
      }, options);

      if (out = func()) {
        cb(out);
        return capsule;
      }

      (function wait() {
        capsule.repeat--;
        capsule.timeout = setTimeout(function() {
          if (capsule.isAborted) {
            return;
          }

          if (out = func()) {
            return cb(out);
          }

          if (!capsule.isAborted && capsule.repeat) {
            wait();
          }
        }, capsule.delay);
      })();

      return capsule;
    },
    getVideoInfo: function(video) {
      // var poster = video.getAttribute('poster');
      var src = video.getAttribute('src');
      if (typeof src !== 'string') {
        return;
      }

      var ext = 'mp4';
      if (src.indexOf('.flv') !== -1) {
        ext = 'flv';
      }

      var filename = src.match(/\/([^\/?]+)(?:$|\?)/);
      filename = filename && filename[1];
      if (!filename) {
        filename = 'noname.' + ext;
      }
      return {
        filename: filename,
        url: src
      }
    },
    getImageInfo: function(image) {
      var src = image.getAttribute('src');
      if (typeof src !== 'string') {
        return;
      }
      var ext = 'jpg';
      if (src.indexOf('.png') !== -1) {
        ext = 'png';
      }

      var filename = src.match(/\/([^\/?]+)(?:$|\?)/);
      filename = filename && filename[1];
      if (!filename) {
        filename = 'noname.' + ext;
      }
      return {
        filename: filename,
        url: src
      }
    },
    getDbBtnEl: function(videoInfo) {
      return mono.create('a', {
        class: [this.dlBtnClassName],
        href: videoInfo.url,
        download: videoInfo.filename,
        title: language.download,
        style: {
          position: 'absolute',
          zIndex: 100,
          textAlign: 'center'
        },
        on: ['click', function(e) {
          e.stopPropagation();
          SaveFrom_Utils.downloadOnClick(e, undefined, {
            el: this
          });
        }]
      });
    },
    addDlBtn: function(container, type) {
      var isEmbed = type === 1;

      var oldBtn = container.querySelector('.' + this.dlBtnClassName);
      oldBtn && oldBtn.parentNode.removeChild(oldBtn);
      oldBtn = null;

      var iMedia
      if (!(iMedia = container.querySelector('.iMedia'))) {
        iMedia = container;
      }

      var mediaInfo;

      var video = container.querySelector('video[src]');
      if (video) {
        mediaInfo = this.getVideoInfo(video);
      }

      if (!mediaInfo) {
        var image = container.querySelector(['.-cx-PRIVATE-Photo__root[src]','.Image[src]', 'img[src]']);
        if (image) {
          mediaInfo = this.getImageInfo(image);
        }
      }

      if (!mediaInfo) {
        return;
      }

      var dlBtn = this.getDbBtnEl(mediaInfo);

      if (isEmbed) {
        var embedFollowButton = document.querySelector('.EmbedFollowButton');
        if (embedFollowButton) {
          var embedFollowButtonSize = SaveFrom_Utils.getSize(embedFollowButton);
          var embedFollowButtonPosition = SaveFrom_Utils.getPosition(embedFollowButton);
          dlBtn.style.right = (embedFollowButtonSize.width + 12) + 'px';
          dlBtn.style.left = 'auto';
          dlBtn.style.top = embedFollowButtonPosition.top + 'px';
          dlBtn.style.display = 'block';
        }
      }

      iMedia.appendChild(dlBtn);
    },
    onMouseEnter: function(e) {
      var el = e.target;
      if (el.nodeType !== 1) {
        return;
      }

      if (!el.classList.contains('-cx-PRIVATE-Post__media') && !el.classList.contains('mediaPhoto')) {
        return;
      }

      if (el.dataset.hasSfBtn === '1') {
        return;
      }
      el.dataset.hasSfBtn = '1';

      instagram.addDlBtn(el, 2);
    },
    rmMouseEnterData: function() {
      var elList = document.querySelectorAll('*[data-has-sf-btn="1"]');
      for (var i = 0, el; el = elList[i]; i++) {
        el.dataset.hasSfBtn = 0;
      }
    }
  };
  instagram.run();
}, function isActive() {

  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
        'http://instagram.com/*',
        'http://*.instagram.com/*',
        'https://instagram.com/*',
        'https://*.instagram.com/*'
      ])) {
      return false;
    }
  }

  if (mono.isIframe() && !/\/\/[^\/]+\.[^\/]+\/p\//.test(document.URL)) {
    return;
  }

  return true;
});

(typeof mono === 'undefined') && (mono = {loadModule: function() {this.loadModuleStack.push(arguments);},loadModuleStack: []});

mono.loadModule('rutube', function(moduleName, initData) {
  "use strict";
  var language = initData.getLanguage;
  var preference = initData.getPreference;
  var moduleState = preference.moduleRutube ? 1 : 0;
  var className = 'sf-dl-btn';

  var frame = mono.isIframe();

  mono.onMessage(function(message, cb){
    if (message.action === 'getModuleInfo') {
      if (message.url !== location.href) return;
      return cb({state: moduleState, moduleName: moduleName});
    }
    if (message.action === 'changeState') {
      return rutube.changeState(message.state);
    }
    if (message.action === 'updateLinks') {
      return rutube.updateLinks();
    }
  });

  var rutube = {
    contextMenu: null,
    lastWaitEl: null,
    videoR: /\/\/[^\/]+\/video\//,
    run: function() {
      if (!moduleState) {
        return;
      }

      if (frame) {
        return rutube.frame();
      }

      mono.onUrlChange(function(url) {
        if (!this.videoR.test(url)) {
          return;
        }

        this.lastWaitEl && this.lastWaitEl.abort();
        this.lastWaitEl = this.waitEl(function() {
          var container = document.querySelector('.b-video');
          if (container.offsetParent === null) {
            return;
          }
          container = container.querySelector('.b-author .data');
          if (!container) {
            return;
          }
          return container;
        }, function(container) {
          this.insertDlLink(container, url);
        }.bind(this));
      }.bind(this), 1);
    },
    changeState: function(state) {
      moduleState = state;
      this.contextMenu && this.contextMenu.hide();
      mono.clearUrlChange();
      this.rmDlLinks();
      if (state) {
        this.run();
      }
    },
    updateLinks: function() {
      this.changeState(0);
      this.changeState(1);
    },
    rmDlLinks: function() {
      var links = document.querySelectorAll('.' + className);
      for (var i = 0, node; node = links[i]; i++) {
        node.parentNode.removeChild(node);
      }
    },
    insertDlLink: function(container, url) {
      var oldBtnList = container.querySelectorAll('.' + className);
      for (var i = 0, node; node = oldBtnList[i]; i++) {
        node.parentNode.removeChild(node);
      }
      oldBtnList = undefined;

      url = 'ummy' + url.substr(url.indexOf('://'));
      container.appendChild(mono.create('a', {
        text: language.download,
        href: url,
        class: [className, 'g-solid-link'],
        style: {
          marginLeft: '5px'
        },
        target: '_blank',
        on: ['click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          if (rutube.contextMenu) {
            rutube.contextMenu.hide();
            rutube.contextMenu = null;
          }

          var links = SaveFrom_Utils.popupMenu.prepareLinks.rutube(this.getAttribute('href'));
          rutube.contextMenu = SaveFrom_Utils.popupMenu.quickInsert(this, links, 'sf-popupMenu');
        }]
      }));
    },
    waitEl: function(func, cb, options) {
      var out;
      var capsule = mono.extend({
        abort: function() {
          clearInterval(capsule.timeout);
          capsule.isAborted = true;
        }
      }, {
        delay: 500,
        repeat: 12,
        isAborted: false,
        timeout: null
      }, options);

      if (out = func()) {
        cb(out);
        return capsule;
      }

      (function wait() {
        capsule.repeat--;
        capsule.timeout = setTimeout(function() {
          if (capsule.isAborted) {
            return;
          }

          if (out = func()) {
            return cb(out);
          }

          if (!capsule.isAborted && capsule.repeat) {
            wait();
          }
        }, capsule.delay);
      })();

      return capsule;
    },
    linkPanelShow: null,
    frameBtn: null,
    framePanel: null,
    onFrameOver: function() {
      if (!rutube.frameBtn) {
        return;
      }
      rutube.frameBtn.style.display = 'inline-block';
      if (rutube.linkPanelShow) {
        rutube.framePanel.style.display = 'block';
      }
    },
    onFrameLeave: function() {
      if (!rutube.frameBtn) {
        return;
      }
      rutube.frameBtn.style.display = 'none';
      rutube.framePanel.style.display = 'none';
    },
    frame: function() {
      var linkPanel, hasLinks;
      document.body.appendChild(mono.create(document.createDocumentFragment(), {
        append: [
          rutube.frameBtn = mono.create('a', {
            class: className,
            text: language.download,
            title: language.download,
            href: '#',
            style: {
              position: 'absolute',
              display: 'none',
              right: '50px',
              top: '12px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              lineHeight: 'normal',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '5px 10px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none !important'
            },
            on: [
              ['mouseenter', function(e) {
                this.style.background = 'rgba(0, 0, 0, 0.4)';
              }],
              ['mouseleave', function(e) {
                this.style.background = 'rgba(0, 0, 0, 0.3)';
              }],
              ['click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (!rutube.linkPanelShow) {
                  linkPanel.style.display = 'block';
                } else {
                  linkPanel.style.display = 'none';
                }
                rutube.linkPanelShow = !rutube.linkPanelShow;

                if (hasLinks) {
                  return;
                }
                hasLinks = !hasLinks;

                linkPanel.appendChild(mono.create('span', {
                  text: language.download + '...'
                }));

                linkPanel.textContent = '';
                var linkList = SaveFrom_Utils.popupMenu.prepareLinks.rutube(location.href);
                mono.create(linkPanel, {
                  class: 'sf-link-panel',
                  append: (function() {
                    var linkElList = [];
                    var linkEl;
                    for (var i = 0, listItem; listItem = linkList[i]; i++) {
                      linkElList.push(linkEl = mono.create('a', {
                        href: listItem.href,
                        style: {
                          marginRight: '15px',
                          marginLeft: '15px'
                        },
                        append: mono.parseTemplate(language.ummyMenuItem)
                      }));
                      var uSpan = linkEl.querySelector('span');
                      var badge = SaveFrom_Utils.popupMenu.createBadge(listItem.uIsAudio ? 'mp3' : '720');
                      badge.style.paddingLeft = '1px';
                      badge.style.paddingRight = '1px';
                      badge.style.backgroundColor = 'rgb(115, 115, 115)';
                      linkEl.replaceChild(badge, uSpan);
                      linkEl.appendChild(SaveFrom_Utils.popupMenu.createBadge('ummy'));
                      SaveFrom_Utils.bindFrameUmmyInfo(linkEl, {
                        video: 'rt-' + listItem.id,
                        vid: 114
                      });
                    }
                    return linkElList;
                  })()
                });
              }]
            ],
            onCreate: function(el) {
              var style = el.getAttribute('style');
              el.setAttribute('style', style + ';' +
                'border-radius: 2px !important;' +
                'border-width: 1px !important;' +
                'border-style: solid !important;' +
                'border-color: rgba(255, 255, 255, 0.35) !important;');
            }
          }),
          rutube.framePanel = linkPanel = mono.create('div', {
            style: {
              position: 'absolute',
              display: 'none',
              top: 0,
              left: 0,
              width: '100%',
              boxSizing: 'border-box',
              height: '50px',
              lineHeight: '50px',
              zIndex: 9998,
              background: 'rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none !important'
            }
          })
        ]
      }));

      mono.off(document, 'mouseenter', rutube.onFrameOver);
      mono.on(document, 'mouseenter', rutube.onFrameOver);
      mono.off(document, 'mouseleave', rutube.onFrameLeave);
      mono.on(document, 'mouseleave', rutube.onFrameLeave);
    }
  };

  rutube.run();
}, function isActive(data) {
  if (!data.getPreference.showUmmyItem) {
    return false;
  }

  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
        'http://rutube.ru/*',
        'http://*.rutube.ru/*',
        'https://rutube.ru/*',
        'https://*.rutube.ru/*'
      ])) {
      return false;
    }
  }

  if (mono.isIframe()) {
    try {
      if (window.parent && window.parent.location && location.hostname === window.parent.location.hostname) {
        return false;
      }
    } catch(e) {}
  }

  return true;
});

  if(!_modules[_moduleName]) {
    return;
  }

  setTimeout(function(){
    if(window.sessionStorage && sessionStorage['savefrom-helper-extension'] === '1') {
      return;
    }
    engine.init();

    var runModule = (function(moduleName) {
      _modules[moduleName] && _modules[moduleName].call(this);
      if (moduleName === 'sovetnik') {
        _modules.dealply && _modules.dealply.call(this);
      }
    }).bind(this);

    runModule(_moduleName);
    if (_moduleName === 'lm' && GM_getValue('sovetnikEnabled') !== 0) {
      runModule('sovetnik');
    }
  }, 1000);
})();
